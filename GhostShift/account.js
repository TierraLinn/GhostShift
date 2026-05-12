const ACCOUNT_KEY = "ghostshift.account";
const CHECKLIST_KEY = "ghostshift.checklist";
const DEVICES_KEY = "ghostshift.devices";
const PRIVACY_KEY = "ghostshift.privacy";
const REPORTS_KEY = "ghostshift.reports";
const params = new URLSearchParams(window.location.search);

const PLAN_LABELS = {
  free: "Free trial",
  plus: "GhostShift Plus",
  family: "Family"
};

function getAccount() {
  try {
    return JSON.parse(localStorage.getItem(ACCOUNT_KEY));
  } catch {
    return null;
  }
}

function saveAccount(account) {
  localStorage.setItem(ACCOUNT_KEY, JSON.stringify(account));
}

function getJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
}

function setJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getSelectedPlan() {
  const plan = params.get("plan");
  return PLAN_LABELS[plan] ? plan : "free";
}

function formatTrial(createdAt) {
  const created = new Date(createdAt).getTime();
  const elapsed = Date.now() - created;
  const remaining = Math.max(0, 14 - Math.floor(elapsed / 86400000));
  return `${remaining} day${remaining === 1 ? "" : "s"} remaining`;
}

function formatTrialFromAccount(account) {
  if (account?.trialEndsAt) {
    const remaining = Math.max(0, Math.ceil((new Date(account.trialEndsAt).getTime() - Date.now()) / 86400000));
    return `${remaining} day${remaining === 1 ? "" : "s"} remaining`;
  }
  return formatTrial(account?.createdAt || new Date().toISOString());
}

function initSignup() {
  const form = document.getElementById("signupForm");
  if (!form) return;

  const planField = document.getElementById("plan");
  planField.value = getSelectedPlan();
  const error = document.getElementById("signupError");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    if (!email || !password) {
      if (error) error.hidden = false;
      return;
    }

    if (error) error.hidden = true;
    const account = {
      name: email.split("@")[0] || "GhostShift user",
      email,
      plan: planField.value,
      createdAt: new Date().toISOString(),
      stripeCustomerId: null,
      subscriptionStatus: "trialing"
    };

    try {
      const response = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(account)
      });
      if (response.ok) {
        const data = await response.json();
        saveAccount(data.account);
      } else {
        saveAccount(account);
      }
    } catch {
      saveAccount(account);
    }
    window.location.href = "./dashboard.html";
  });
}

function initSignIn() {
  const form = document.getElementById("signinForm");
  if (!form) return;

  const error = document.getElementById("signinError");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = document.getElementById("signinEmail").value.trim();
    const password = document.getElementById("signinPassword").value;

    if (!email || !password) {
      if (error) error.hidden = false;
      return;
    }

    try {
      const response = await fetch(`/api/account?email=${encodeURIComponent(email)}`);
      if (response.ok) {
        const data = await response.json();
        if (data.account) {
          saveAccount(data.account);
          window.location.href = "./dashboard.html";
          return;
        }
      }
    } catch {
      // Fall through to local account check.
    }

    const localAccount = getAccount();
    if (localAccount?.email?.toLowerCase() === email.toLowerCase()) {
      window.location.href = "./dashboard.html";
      return;
    }

    if (error) error.hidden = false;
  });
}

function initLogout() {
  const button = document.getElementById("confirmSignOut");
  if (!button) return;

  button.addEventListener("click", () => {
    localStorage.removeItem(ACCOUNT_KEY);
    window.location.href = "./index.html";
  });
}

function setDashboardText(account) {
  const welcomeTitle = document.getElementById("welcomeTitle");
  if (!welcomeTitle) return;

  if (!account) {
    welcomeTitle.textContent = "Create your GhostShift account.";
    document.getElementById("accountSummary").textContent = "Sign up to start your trial and manage Stripe billing.";
    document.getElementById("accountEmail").textContent = "Not signed in";
    document.getElementById("accountPlan").textContent = "No active plan";
    document.getElementById("trialStatus").textContent = "Sign up required";
    return;
  }

  welcomeTitle.textContent = `Welcome, ${account.name || "GhostShift user"}.`;
  document.getElementById("accountSummary").textContent = "Manage your trial, extension download, and subscription from here.";
  document.getElementById("accountEmail").textContent = account.email;
  document.getElementById("accountPlan").textContent = PLAN_LABELS[account.plan] || "Free trial";
  document.getElementById("trialStatus").textContent = account.subscriptionStatus === "active" ? "Active subscription" : formatTrialFromAccount(account);
}

async function refreshServerStatus() {
  const serverStatus = document.getElementById("serverStatus");
  if (!serverStatus) return;

  const serverDetail = document.getElementById("serverDetail");
  const serverUptime = document.getElementById("serverUptime");
  const stripeConfigured = document.getElementById("stripeConfigured");
  const platformCount = document.getElementById("platformCount");

  try {
    const [healthResponse, configResponse] = await Promise.all([
      fetch("/api/health"),
      fetch("/api/extension-config")
    ]);

    if (!healthResponse.ok || !configResponse.ok) throw new Error("Backend endpoints unavailable");

    const health = await healthResponse.json();
    const config = await configResponse.json();
    const minutes = Math.floor((health.uptimeSeconds || 0) / 60);

    serverStatus.textContent = "Online";
    serverDetail.textContent = "The GhostShift backend is responding to health checks.";
    serverUptime.textContent = minutes < 1 ? `${health.uptimeSeconds}s` : `${minutes}m`;
    stripeConfigured.textContent = health.stripeConfigured ? "Ready" : "Needs key";
    platformCount.textContent = String(config.supportedPlatforms?.filter((platform) => platform.status === "enabled").length || 0);
  } catch {
    serverStatus.textContent = "Local only";
    serverDetail.textContent = "Open this dashboard through the GhostShift backend server for always-on health checks and Stripe checkout.";
    serverUptime.textContent = "--";
    stripeConfigured.textContent = "Not checked";
    platformCount.textContent = "2";
  }
}

async function beginStripeCheckout(plan) {
  const message = document.getElementById("stripeMessage");
  const status = document.getElementById("stripeStatus");
  const account = getAccount();

  if (!account) {
    window.location.href = `./signup.html?plan=${plan}`;
    return;
  }

  message.textContent = "Opening Stripe Checkout...";
  status.textContent = "Connecting";

  try {
    const response = await fetch("/api/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan, email: account.email })
    });

    if (!response.ok) throw new Error("Checkout endpoint is not available yet.");
    const data = await response.json();

    if (data.url) {
      window.location.href = data.url;
      return;
    }

    throw new Error(data.error || "Stripe Checkout did not return a URL.");
  } catch (error) {
    status.textContent = "Setup needed";
    message.innerHTML = `
      Stripe checkout is wired, but the local backend is not running or keys are not configured yet.
      Open <strong>GhostShift/backend/README.md</strong> and add your Stripe secret key plus price IDs.
    `;
  }
}

function initDashboard() {
  const signOut = document.getElementById("signOut");
  const planOptions = document.querySelectorAll(".plan-option");
  if (!signOut && !planOptions.length) return;

  setDashboardText(getAccount());
  hydrateAccountFromServer();
  refreshServerStatus();
  initChecklist();
  initPrivacyControls();
  initDevices();
  initSupport();
  initReferral();
  initDashboardInteractions();

  signOut?.addEventListener("click", () => {
    window.location.href = "./logout.html";
  });

  planOptions.forEach((button) => {
    button.addEventListener("click", () => beginStripeCheckout(button.dataset.plan));
  });
}

function initDashboardInteractions() {
  const cards = document.querySelectorAll(".dashboard-hero, .dash-card");
  cards.forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `translateY(-2px) rotateX(${(-y * 2.5).toFixed(2)}deg) rotateY(${(x * 2.5).toFixed(2)}deg)`;
    });
    card.addEventListener("pointerleave", () => {
      card.style.transform = "";
    });
  });

  document.querySelectorAll(".checklist input").forEach((input) => {
    input.addEventListener("change", () => {
      input.closest("label")?.classList.toggle("checked", input.checked);
    });
  });
}

async function hydrateAccountFromServer() {
  const account = getAccount();
  if (!account?.email) return;
  try {
    const response = await fetch(`/api/account?email=${encodeURIComponent(account.email)}`);
    if (!response.ok) return;
    const data = await response.json();
    if (data.account) {
      saveAccount(data.account);
      setDashboardText(data.account);
    }
  } catch {
    // Local file mode still works from localStorage.
  }
}

function initChecklist() {
  const checklist = document.getElementById("setupChecklist");
  if (!checklist) return;

  const saved = getJson(CHECKLIST_KEY, {});
  if (getAccount()) saved.account = true;

  const boxes = Array.from(checklist.querySelectorAll("input[type='checkbox']"));
  const progress = document.getElementById("setupProgress");

  function render() {
    boxes.forEach((box) => {
      box.checked = Boolean(saved[box.dataset.check]);
    });
    progress.textContent = `${boxes.filter((box) => box.checked).length}/${boxes.length} done`;
    setJson(CHECKLIST_KEY, saved);
  }

  boxes.forEach((box) => {
    box.addEventListener("change", () => {
      saved[box.dataset.check] = box.checked;
      render();
    });
  });

  render();
}

function initPrivacyControls() {
  const fields = ["diagnostics", "syncSettings", "localStats"].map((id) => document.getElementById(id)).filter(Boolean);
  if (!fields.length) return;

  const saved = getJson(PRIVACY_KEY, { diagnostics: false, syncSettings: true, localStats: true });
  fields.forEach((field) => {
    field.checked = Boolean(saved[field.id]);
    field.addEventListener("change", () => {
      saved[field.id] = field.checked;
      setJson(PRIVACY_KEY, saved);
    });
  });
}

function initDevices() {
  const list = document.getElementById("deviceList");
  const addDevice = document.getElementById("addDevice");
  if (!list || !addDevice) return;

  const devices = getJson(DEVICES_KEY, []);

  function render() {
    list.innerHTML = devices.length
      ? devices.map((device) => `<div><strong>${device.name}</strong><span>${device.addedAt}</span></div>`).join("")
      : "<p class='form-note'>No devices added yet.</p>";
    setJson(DEVICES_KEY, devices);
  }

  addDevice.addEventListener("click", async () => {
    const name = navigator.userAgent.includes("Edg") ? "Edge browser" : "Chrome-compatible browser";
    const account = getAccount();
    try {
      const response = await fetch("/api/devices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: account?.email, name, platform: navigator.platform || "web" })
      });
      if (response.ok) {
        const data = await response.json();
        saveAccount(data.account);
        devices.unshift({ name: data.device.name, addedAt: new Date(data.device.addedAt).toLocaleString() });
        render();
        return;
      }
    } catch {
      // Fall back to local-only device tracking.
    }
    devices.unshift({ name, addedAt: new Date().toLocaleString() });
    render();
  });

  render();
}

function initSupport() {
  const form = document.getElementById("supportForm");
  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = {
      email: getAccount()?.email || null,
      platform: document.getElementById("supportPlatform").value,
      message: document.getElementById("supportMessage").value.trim()
    };
    const reports = getJson(REPORTS_KEY, []);
    reports.unshift({ ...payload, createdAt: new Date().toISOString() });
    setJson(REPORTS_KEY, reports);
    try {
      await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    } catch {
      // Local report copy is still saved.
    }
    document.getElementById("supportSaved").textContent = "Report saved locally for launch notes.";
    form.reset();
  });
}

function initReferral() {
  const button = document.getElementById("copyReferral");
  if (!button) return;

  button.addEventListener("click", async () => {
    const account = getAccount();
    const code = account?.email ? `GHOST-${account.email.split("@")[0].slice(0, 8).toUpperCase()}` : "GHOST-TRIAL";
    const link = `${window.location.origin}${window.location.pathname.replace("dashboard.html", "signup.html")}?ref=${encodeURIComponent(code)}`;
    document.getElementById("referralCode").textContent = code;
    try {
      await navigator.clipboard.writeText(link);
      document.getElementById("referralStatus").textContent = "Referral link copied.";
    } catch {
      document.getElementById("referralStatus").textContent = link;
    }
  });
}

initSignup();
initSignIn();
initLogout();
initDashboard();
