const DEFAULT_SETTINGS = {
  enabled: true,
  autoSkip: true,
  muteDuringAds: true,
  siteOverrides: {}
};

const settingFields = ["enabled", "autoSkip", "muteDuringAds"].map((key) => document.getElementById(key));
const siteEnabledField = document.getElementById("siteEnabled");
const siteToggleLabel = document.getElementById("siteToggleLabel");
const subtitle = document.getElementById("subtitle");
const statusDot = document.getElementById("statusDot");
const statusLabel = document.getElementById("statusLabel");
const statusDetail = document.getElementById("statusDetail");
const todaySkips = document.getElementById("todaySkips");
const totalSkips = document.getElementById("totalSkips");
const scanNow = document.getElementById("scanNow");
const openOptions = document.getElementById("openOptions");

let activeTabId = null;
let activeSiteKey = null;

function getSiteKey(url) {
  try {
    const parsedUrl = new URL(url);
    const host = parsedUrl.hostname.replace(/^www\./, "");
    const pathname = parsedUrl.pathname.toLowerCase();
    if (host.endsWith("youtube.com")) return "youtube.com";
    if (host.endsWith("facebook.com")) return "facebook.com";
    if (pathname.includes("demo-player") || pathname.includes("install")) return "ghostshift-demo";
    if (host === "localhost" || host === "127.0.0.1") return "ghostshift-demo";
    return host;
  } catch {
    return null;
  }
}

function getPlatformName(siteKey) {
  if (siteKey === "youtube.com") return "YouTube";
  if (siteKey === "facebook.com") return "Facebook";
  if (siteKey === "ghostshift-demo") return "GhostShift demo";
  return siteKey || "this site";
}

function setStatus(kind, label, detail) {
  statusDot.className = `status-dot ${kind}`;
  statusLabel.textContent = label;
  statusDetail.textContent = detail;
}

function loadStats(siteKey) {
  chrome.storage.local.get({ stats: {} }, ({ stats }) => {
    const siteStats = stats?.[siteKey] || { totalSkips: 0, days: {} };
    const today = new Date().toISOString().slice(0, 10);
    todaySkips.textContent = String(siteStats.days?.[today] || 0);
    totalSkips.textContent = String(siteStats.totalSkips || 0);
  });
}

function refreshFromStatus(status) {
  if (!status) return;
  activeSiteKey = getSiteKey(`https://${status.host}`);
  subtitle.textContent = getPlatformName(activeSiteKey);
  siteToggleLabel.textContent = `Enable on ${getPlatformName(activeSiteKey)}`;
  siteEnabledField.checked = Boolean(status.enabledForSite);

  if (!status.enabledForSite) {
    setStatus("paused", "Paused on this site", status.lastAction || "Use the site switch to enable GhostShift here.");
  } else if (status.skipControlVisible) {
    setStatus("ready", "Skip control visible", status.lastAction || "GhostShift is ready.");
  } else if (status.adDetected) {
    setStatus("waiting", "Ad break detected", status.lastAction || "Waiting for a visible skip control.");
  } else {
    setStatus("ready", "Watching quietly", status.lastAction || "No supported ad control is visible right now.");
  }

  loadStats(activeSiteKey);
}

function sendToActiveTab(message) {
  return new Promise((resolve) => {
    if (!activeTabId) {
      resolve(null);
      return;
    }

    chrome.tabs.sendMessage(activeTabId, message, (response) => {
      if (chrome.runtime.lastError) {
        resolve(null);
        return;
      }
      resolve(response);
    });
  });
}

async function refreshTabStatus() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  activeTabId = tab?.id || null;
  activeSiteKey = getSiteKey(tab?.url || "");

  if (!activeSiteKey || !["youtube.com", "facebook.com", "ghostshift-demo"].includes(activeSiteKey)) {
    subtitle.textContent = "Unsupported tab";
    siteToggleLabel.textContent = "Enable on this site";
    siteEnabledField.checked = false;
    setStatus("blocked", "Unsupported page", "Open YouTube or Facebook in this browser to use the extension.");
    loadStats("unsupported");
    return;
  }

  const status = await sendToActiveTab({ type: "GHOSTSHIFT_GET_STATUS" });
  if (!status) {
    setStatus("waiting", "Reload needed", "Refresh this page once after installing GhostShift.");
    chrome.storage.sync.get(DEFAULT_SETTINGS, (settings) => {
      siteEnabledField.checked = settings.siteOverrides?.[activeSiteKey] !== false;
      loadStats(activeSiteKey);
    });
    return;
  }

  refreshFromStatus(status);
}

chrome.storage.sync.get(DEFAULT_SETTINGS, (settings) => {
  settingFields.forEach((field) => {
    field.checked = Boolean(settings[field.id]);
  });
});

settingFields.forEach((field) => {
  field.addEventListener("change", () => {
    chrome.storage.sync.set({ [field.id]: field.checked });
    refreshTabStatus();
  });
});

siteEnabledField.addEventListener("change", async () => {
  const status = await sendToActiveTab({
    type: "GHOSTSHIFT_SET_SITE_ENABLED",
    enabled: siteEnabledField.checked
  });

  if (status) {
    refreshFromStatus(status);
    return;
  }

  chrome.storage.sync.get(DEFAULT_SETTINGS, (settings) => {
    const siteOverrides = { ...(settings.siteOverrides || {}), [activeSiteKey]: siteEnabledField.checked };
    chrome.storage.sync.set({ siteOverrides }, refreshTabStatus);
  });
});

scanNow.addEventListener("click", async () => {
  scanNow.disabled = true;
  scanNow.textContent = "Scanning...";
  const status = await sendToActiveTab({ type: "GHOSTSHIFT_RUN_SCAN" });
  if (status) refreshFromStatus(status);
  if (!status) setStatus("waiting", "Reload needed", "Refresh this page once so GhostShift can connect.");
  scanNow.disabled = false;
  scanNow.textContent = "Scan now";
});

openOptions.addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});

refreshTabStatus();
