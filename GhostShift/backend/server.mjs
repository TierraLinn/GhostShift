import { createServer } from "node:http";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const PORT = Number(process.env.PORT || 8787);
const BACKEND_DIR = dirname(fileURLToPath(import.meta.url));
const ROOT = normalize(join(BACKEND_DIR, ".."));
const DATA_DIR = normalize(join(ROOT, "data"));
const STORE_PATH = normalize(join(DATA_DIR, "ghostshift-store.json"));
const STRIPE_API_VERSION = "2026-02-25.clover";

const PRICE_IDS = {
  plus: process.env.STRIPE_PRICE_PLUS,
  family: process.env.STRIPE_PRICE_FAMILY
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
    pricesConfigured: {
      plus: Boolean(PRICE_IDS.plus),
      family: Boolean(PRICE_IDS.family)
    }
  }, headOnly);
}

async function readRequestJson(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  const body = Buffer.concat(chunks).toString("utf8");
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
  return account;
}

function makeTrialDates() {
  const trialStartedAt = new Date();
  const trialEndsAt = new Date(trialStartedAt.getTime() + 14 * 86400000);
  return {
    trialStartedAt: trialStartedAt.toISOString(),
    trialEndsAt: trialEndsAt.toISOString()
  };
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
  const body = new URLSearchParams({
    mode: "subscription",
    "line_items[0][price]": priceId,
    "line_items[0][quantity]": "1",
    success_url: `${origin}/dashboard.html?checkout=success`,
    cancel_url: `${origin}/dashboard.html?checkout=cancelled`,
    allow_promotion_codes: "true",
    billing_address_collection: "auto"
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
    response.writeHead(200, { "Content-Type": MIME_TYPES[extname(normalized)] || "application/octet-stream" });
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
