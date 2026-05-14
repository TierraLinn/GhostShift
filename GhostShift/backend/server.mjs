import { createServer } from "node:http";
import { createHmac, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const PORT = Number(process.env.PORT || 8787);
const BACKEND_DIR = dirname(fileURLToPath(import.meta.url));
const ROOT = normalize(join(BACKEND_DIR, ".."));
const DATA_DIR = normalize(join(ROOT, "data"));
const STORE_PATH = normalize(join(DATA_DIR, "ghostshift-store.json"));
const STRIPE_API_VERSION = "2026-02-25.clover";
const env = (key) => process.env[key]?.trim();
const STRIPE_WEBHOOK_SECRET = env("STRIPE_WEBHOOK_SECRET");
const PUBLIC_APP_URL = env("PUBLIC_APP_URL") || env("APP_URL") || `http://localhost:${PORT}`;

const PRICE_IDS = {
  plus: env("STRIPE_PRICE_PLUS"),
  family: env("STRIPE_PRICE_FAMILY")
};

const STARTED_AT = new Date().toISOString();
const EXTENSION_CONFIG = {
  autoSkipDefault: true,
  muteDuringAdsDefault: true,
  freemium: {
    freeDownload: true,
    trialDays: 14,
    trialFeatures: ["auto_skip", "mute_restore", "manual_scan", "local_stats"],
    paidFeatures: ["continued_auto_skip", "cross_device_sync", "priority_updates", "family_profiles"]
  },
  supportedPlatforms: [
    {
      id: "youtube.com",
      name: "YouTube web",
      automation: "visible_skip_controls",
      status: "enabled"
    },
    {
      id: "facebook.com",
      name: "Facebook web",
      automation: "visible_skip_controls",
      status: "enabled"
    },
    {
      id: "ghostshift-demo",
      name: "GhostShift demo player",
      automation: "visible_skip_controls",
      status: "enabled"
    }
  ],
  unsupportedNativeAppsMessage:
    "Native mobile app skipping depends on platform rules. GhostShift supports browser-based automation first."
};

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".md": "text/markdown; charset=utf-8",
  ".zip": "application/zip"
};

const EMPTY_STORE = {
  accounts: [],
  reports: [],
  events: []
};

let storeQueue = Promise.resolve();

function sendJson(response, status, payload, headOnly = false) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  if (!headOnly) {
    response.end(JSON.stringify(payload));
  } else {
    response.end();
  }
}

function sendHealth(response, headOnly = false) {
  sendJson(response, 200, {
    ok: true,
    service: "ghostshift",
    startedAt: STARTED_AT,
    uptimeSeconds: Math.round(process.uptime()),
    stripeConfigured: Boolean(process.env.STRIPE_SECRET_KEY),
    stripeWebhookConfigured: Boolean(STRIPE_WEBHOOK_SECRET),
    publicAppUrl: PUBLIC_APP_URL,
    pricesConfigured: {
      plus: Boolean(PRICE_IDS.plus),
      family: Boolean(PRICE_IDS.family)
    }
  }, headOnly);
}

async function readRequestBody(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  return Buffer.concat(chunks);
}

async function readRequestJson(request) {
  const body = (await readRequestBody(request)).toString("utf8");
  return body ? JSON.parse(body) : {};
}

async function readStore() {
  try {
    return { ...EMPTY_STORE, ...JSON.parse(await readFile(STORE_PATH, "utf8")) };
  } catch {
    return { ...EMPTY_STORE };
  }
}

async function writeStore(store) {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(STORE_PATH, JSON.stringify(store, null, 2));
}

async function updateStore(mutator) {
  const operation = storeQueue.then(async () => {
    const store = await readStore();
    const result = await mutator(store);
    await writeStore(store);
    return result;
  });
  storeQueue = operation.catch(() => {});
  return operation;
}

function publicAccount(account) {
  if (!account) return null;
  const { password, ...safeAccount } = account;
  return safeAccount;
}

function makeTrialDates() {
  const trialStartedAt = new Date();
  const trialEndsAt = new Date(trialStartedAt.getTime() + 14 * 86400000);
  return {
    trialStartedAt: trialStartedAt.toISOString(),
    trialEndsAt: trialEndsAt.toISOString()
  };
}

function getPlanFromPrice(priceId) {
  return Object.entries(PRICE_IDS).find(([, value]) => value && value === priceId)?.[0] || null;
}

function getHeader(request, headerName) {
  const exact = request.headers[headerName];
  if (exact) return exact;
  return request.headers[headerName.toLowerCase()];
}

function parseStripeSignature(signatureHeader) {
  return String(signatureHeader || "")
    .split(",")
    .map((part) => part.split("="))
    .reduce((parsed, [key, value]) => {
      if (!key || !value) return parsed;
      parsed[key] = parsed[key] || [];
      parsed[key].push(value);
      return parsed;
    }, {});
}

function secureCompareHex(leftHex, rightHex) {
  try {
    const left = Buffer.from(leftHex, "hex");
    const right = Buffer.from(rightHex, "hex");
    return left.length === right.length && timingSafeEqual(left, right);
  } catch {
    return false;
  }
}

function verifyStripeSignature(rawBody, signatureHeader) {
  if (!STRIPE_WEBHOOK_SECRET) {
    return { ok: false, status: 503, error: "Stripe webhook secret is not configured." };
  }

  const parsed = parseStripeSignature(signatureHeader);
  const timestamp = parsed.t?.[0];
  const signatures = parsed.v1 || [];

  if (!timestamp || !signatures.length) {
    return { ok: false, status: 400, error: "Missing Stripe webhook timestamp or signature." };
  }

  const timestampSeconds = Number(timestamp);
  const ageSeconds = Math.abs(Math.floor(Date.now() / 1000) - timestampSeconds);
  if (!Number.isFinite(timestampSeconds) || ageSeconds > 300) {
    return { ok: false, status: 400, error: "Stripe webhook timestamp is outside tolerance." };
  }

  const expected = createHmac("sha256", STRIPE_WEBHOOK_SECRET)
    .update(`${timestamp}.`)
    .update(rawBody)
    .digest("hex");

  const matched = signatures.some((signature) => secureCompareHex(expected, signature));
  return matched ? { ok: true } : { ok: false, status: 400, error: "Stripe webhook signature verification failed." };
}

function findAccountForStripe(store, { email, customerId, subscriptionId }) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  return store.accounts.find((account) =>
    (normalizedEmail && account.email === normalizedEmail) ||
    (customerId && account.stripeCustomerId === customerId) ||
    (subscriptionId && account.stripeSubscriptionId === subscriptionId)
  );
}

function applySubscriptionToAccount(account, updates) {
  if (!account) return null;
  if (updates.plan) account.plan = updates.plan;
  if (updates.status) account.subscriptionStatus = updates.status;
  if (updates.customerId) account.stripeCustomerId = updates.customerId;
  if (updates.subscriptionId) account.stripeSubscriptionId = updates.subscriptionId;
  if (updates.currentPeriodEnd) account.currentPeriodEnd = updates.currentPeriodEnd;
  if (updates.trialEndsAt) account.trialEndsAt = updates.trialEndsAt;
  if (updates.cancelAtPeriodEnd !== undefined) account.cancelAtPeriodEnd = updates.cancelAtPeriodEnd;
  account.lastStripeEventAt = new Date().toISOString();
  return account;
}

function periodDateFromStripe(seconds) {
  return seconds ? new Date(seconds * 1000).toISOString() : null;
}

async function signup(request, response) {
  const body = await readRequestJson(request);
  const email = String(body.email || "").trim().toLowerCase();
  const name = String(body.name || "").trim();
  const plan = ["free", "plus", "family"].includes(body.plan) ? body.plan : "free";

  if (!email || !name) {
    sendJson(response, 400, { error: "Name and email are required." });
    return;
  }

  const account = await updateStore((store) => {
    let savedAccount = store.accounts.find((item) => item.email === email);

    if (!savedAccount) {
      savedAccount = {
      id: `acct_${Date.now()}`,
      name,
      email,
      plan,
      subscriptionStatus: "trialing",
      stripeCustomerId: null,
      ...makeTrialDates(),
      createdAt: new Date().toISOString(),
      devices: [],
      privacy: {
        diagnostics: false,
        syncSettings: true,
        localStats: true
      }
    };
      store.accounts.push(savedAccount);
    } else {
      savedAccount.name = name || savedAccount.name;
      savedAccount.plan = plan;
    }

    store.events.unshift({ type: "signup", email, plan, createdAt: new Date().toISOString() });
    return savedAccount;
  });
  sendJson(response, 200, { account: publicAccount(account) });
}

async function getAccount(request, response) {
  const url = new URL(request.url, `http://localhost:${PORT}`);
  const email = String(url.searchParams.get("email") || "").trim().toLowerCase();
  const store = await readStore();
  sendJson(response, 200, { account: publicAccount(store.accounts.find((item) => item.email === email)) });
}

async function addDevice(request, response) {
  const body = await readRequestJson(request);
  const email = String(body.email || "").trim().toLowerCase();
  const result = await updateStore((store) => {
    const account = store.accounts.find((item) => item.email === email);
    if (!account) return null;
    const device = {
      id: `device_${Date.now()}`,
      name: body.name || "Browser device",
      platform: body.platform || "web",
      addedAt: new Date().toISOString()
    };
    account.devices.unshift(device);
    return { account, device };
  });

  if (!result) {
    sendJson(response, 404, { error: "Account not found." });
    return;
  }

  sendJson(response, 200, { account: publicAccount(result.account), device: result.device });
}

async function saveReport(request, response) {
  const body = await readRequestJson(request);
  const report = await updateStore((store) => {
    const savedReport = {
    id: `report_${Date.now()}`,
    email: body.email || null,
    platform: body.platform || "Unknown",
    message: body.message || "",
    createdAt: new Date().toISOString()
    };
    store.reports.unshift(savedReport);
    return savedReport;
  });
  sendJson(response, 200, { report });
}

async function createDemoCheckout(request, response) {
  const { plan, email } = await readRequestJson(request);
  await updateStore((store) => {
    const account = store.accounts.find((item) => item.email === String(email || "").trim().toLowerCase());
    if (!account) return null;
    account.plan = ["plus", "family"].includes(plan) ? plan : "plus";
    account.subscriptionStatus = "active";
    account.demoCheckoutAt = new Date().toISOString();
    return account;
  });
  sendJson(response, 200, { url: `/dashboard.html?checkout=demo-success&plan=${encodeURIComponent(plan || "plus")}` });
}

async function createCheckoutSession(request, response) {
  if (!process.env.STRIPE_SECRET_KEY) {
    await createDemoCheckout(request, response);
    return;
  }

  const { plan, email } = await readRequestJson(request);
  const priceId = PRICE_IDS[plan];

  if (!priceId) {
    sendJson(response, 400, { error: "Unknown or unconfigured Stripe price." });
    return;
  }

  const origin = request.headers.origin || `http://localhost:${PORT}`;
  const account = email
    ? (await readStore()).accounts.find((item) => item.email === String(email || "").trim().toLowerCase())
    : null;
  const body = new URLSearchParams({
    mode: "subscription",
    "line_items[0][price]": priceId,
    "line_items[0][quantity]": "1",
    success_url: `${origin}/dashboard.html?checkout=success`,
    cancel_url: `${origin}/dashboard.html?checkout=cancelled`,
    allow_promotion_codes: "true",
    billing_address_collection: "auto",
    client_reference_id: account?.id || String(email || ""),
    "metadata[plan]": plan,
    "metadata[email]": email || "",
    "subscription_data[metadata][plan]": plan,
    "subscription_data[metadata][email]": email || ""
  });

  if (email) body.set("customer_email", email);

  const stripeResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      "Stripe-Version": STRIPE_API_VERSION,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body
  });

  const payload = await stripeResponse.json();

  if (!stripeResponse.ok) {
    sendJson(response, stripeResponse.status, { error: payload.error?.message || "Stripe checkout failed." });
    return;
  }

  sendJson(response, 200, { url: payload.url, id: payload.id });
}

async function createCustomerPortalSession(request, response) {
  if (!process.env.STRIPE_SECRET_KEY) {
    sendJson(response, 200, { url: "/dashboard.html?portal=demo-mode" });
    return;
  }

  const { email } = await readRequestJson(request);
  const store = await readStore();
  const account = store.accounts.find((item) => item.email === String(email || "").trim().toLowerCase());

  if (!account?.stripeCustomerId) {
    sendJson(response, 400, { error: "This account does not have a Stripe customer yet. Start a subscription first." });
    return;
  }

  const origin = request.headers.origin || PUBLIC_APP_URL;
  const body = new URLSearchParams({
    customer: account.stripeCustomerId,
    return_url: `${origin}/dashboard.html?portal=return`
  });

  const stripeResponse = await fetch("https://api.stripe.com/v1/billing_portal/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      "Stripe-Version": STRIPE_API_VERSION,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body
  });

  const payload = await stripeResponse.json();

  if (!stripeResponse.ok) {
    sendJson(response, stripeResponse.status, { error: payload.error?.message || "Stripe portal failed." });
    return;
  }

  sendJson(response, 200, { url: payload.url, id: payload.id });
}

async function updateAccountFromStripeEvent(event) {
  const object = event.data?.object || {};

  if (event.type === "checkout.session.completed") {
    const email = object.customer_details?.email || object.customer_email || object.metadata?.email;
    const customerId = typeof object.customer === "string" ? object.customer : object.customer?.id;
    const subscriptionId = typeof object.subscription === "string" ? object.subscription : object.subscription?.id;
    const plan = ["plus", "family"].includes(object.metadata?.plan) ? object.metadata.plan : "plus";

    await updateStore((store) => {
      const account = findAccountForStripe(store, { email, customerId, subscriptionId });
      if (account) {
        applySubscriptionToAccount(account, {
          plan,
          status: "active",
          customerId,
          subscriptionId
        });
      }
      store.events.unshift({
        type: "stripe.checkout.completed",
        email,
        customerId,
        subscriptionId,
        createdAt: new Date().toISOString()
      });
      return account;
    });
    return;
  }

  if (event.type.startsWith("customer.subscription.")) {
    const customerId = typeof object.customer === "string" ? object.customer : object.customer?.id;
    const subscriptionId = object.id;
    const priceId = object.items?.data?.[0]?.price?.id;
    const metadataPlan = ["plus", "family"].includes(object.metadata?.plan) ? object.metadata.plan : null;
    const plan = metadataPlan || getPlanFromPrice(priceId);
    const status = event.type === "customer.subscription.deleted" ? "canceled" : object.status;

    await updateStore((store) => {
      const account = findAccountForStripe(store, { customerId, subscriptionId, email: object.metadata?.email });
      if (account) {
        applySubscriptionToAccount(account, {
          plan,
          status,
          customerId,
          subscriptionId,
          currentPeriodEnd: periodDateFromStripe(object.current_period_end),
          trialEndsAt: periodDateFromStripe(object.trial_end),
          cancelAtPeriodEnd: Boolean(object.cancel_at_period_end)
        });
      }
      store.events.unshift({
        type: `stripe.${event.type}`,
        email: account?.email || object.metadata?.email || null,
        customerId,
        subscriptionId,
        status,
        createdAt: new Date().toISOString()
      });
      return account;
    });
    return;
  }

  if (event.type === "invoice.payment_succeeded" || event.type === "invoice.payment_failed") {
    const customerId = typeof object.customer === "string" ? object.customer : object.customer?.id;
    const subscriptionId = typeof object.subscription === "string" ? object.subscription : object.subscription?.id;
    const status = event.type === "invoice.payment_succeeded" ? "active" : "past_due";

    await updateStore((store) => {
      const account = findAccountForStripe(store, { customerId, subscriptionId, email: object.customer_email });
      if (account) {
        applySubscriptionToAccount(account, {
          status,
          customerId,
          subscriptionId
        });
      }
      store.events.unshift({
        type: `stripe.${event.type}`,
        email: account?.email || object.customer_email || null,
        customerId,
        subscriptionId,
        status,
        createdAt: new Date().toISOString()
      });
      return account;
    });
  }
}

async function handleStripeWebhook(request, response) {
  const rawBody = await readRequestBody(request);
  const signature = getHeader(request, "stripe-signature");
  const verification = verifyStripeSignature(rawBody, signature);

  if (!verification.ok) {
    sendJson(response, verification.status, { error: verification.error });
    return;
  }

  let event;
  try {
    event = JSON.parse(rawBody.toString("utf8"));
  } catch {
    sendJson(response, 400, { error: "Invalid Stripe webhook JSON." });
    return;
  }

  await updateAccountFromStripeEvent(event);
  sendJson(response, 200, { received: true, type: event.type });
}

async function serveStatic(request, response, headOnly = false) {
  const url = new URL(request.url, `http://localhost:${PORT}`);
  const requestedPath = url.pathname === "/" ? "/index.html" : decodeURIComponent(url.pathname);
  const normalized = normalize(join(ROOT, requestedPath));

  if (!normalized.startsWith(ROOT)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  try {
    const file = await readFile(normalized);
    response.writeHead(200, {
      "Content-Type": MIME_TYPES[extname(normalized)] || "application/octet-stream",
      "Cache-Control": "no-store"
    });
    if (!headOnly) {
      response.end(file);
    } else {
      response.end();
    }
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
  }
}

createServer(async (request, response) => {
  try {
    const headOnly = request.method === "HEAD";

    if ((request.method === "GET" || headOnly) && request.url === "/api/health") {
      sendHealth(response, headOnly);
      return;
    }

    if ((request.method === "GET" || headOnly) && request.url === "/api/extension-config") {
      sendJson(response, 200, EXTENSION_CONFIG, headOnly);
      return;
    }

    if (request.method === "POST" && request.url === "/api/signup") {
      await signup(request, response);
      return;
    }

    if (request.method === "GET" && request.url.startsWith("/api/account")) {
      await getAccount(request, response);
      return;
    }

    if (request.method === "POST" && request.url === "/api/devices") {
      await addDevice(request, response);
      return;
    }

    if (request.method === "POST" && request.url === "/api/reports") {
      await saveReport(request, response);
      return;
    }

    if (request.method === "POST" && request.url === "/api/create-checkout-session") {
      await createCheckoutSession(request, response);
      return;
    }

    if (request.method === "POST" && request.url === "/api/create-customer-portal-session") {
      await createCustomerPortalSession(request, response);
      return;
    }

    if (request.method === "POST" && request.url === "/api/stripe/webhook") {
      await handleStripeWebhook(request, response);
      return;
    }

    if (request.method === "GET" || headOnly) {
      await serveStatic(request, response, headOnly);
      return;
    }

    response.writeHead(405);
    response.end("Method not allowed");
  } catch (error) {
    sendJson(response, 500, { error: error.message || "Server error" });
  }
}).listen(PORT, () => {
  console.log(`GhostShift running at http://localhost:${PORT}`);
});
