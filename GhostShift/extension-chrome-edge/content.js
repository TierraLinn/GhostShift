const DEFAULT_SETTINGS = {
  enabled: true,
  autoSkip: true,
  muteDuringAds: true,
  siteOverrides: {}
};

const DEBUG = true;
function debug(...args) {
  if (DEBUG) {
    console.debug("[GhostShift]", ...args);
  }
}

const SKIP_SELECTORS = [
  ".ytp-ad-skip-button",
  ".ytp-ad-skip-button-modern",
  ".ytp-skip-ad-button",
  "#ghostshift-demo-skip",
  "button[aria-label*='Skip']",
  "button[title*='Skip']"
];

const AD_STATE_SELECTORS = [
  ".ad-showing",
  ".ytp-ad-player-overlay",
  ".ytp-ad-text",
  ".ghostshift-demo-ad",
  "[aria-label*='Sponsored']"
];

let settings = { ...DEFAULT_SETTINGS };
let previousVolume = null;
let status = {
  host: window.location.hostname,
  supported: true,
  enabledForSite: true,
  adDetected: false,
  skipControlVisible: false,
  mutedByGhostShift: false,
  lastAction: "Waiting for a supported video player",
  lastActionAt: null,
  scanCount: 0,
  skipCount: 0
};

function markExtensionDetected() {
  if (document.getElementById("ghostshift-extension-detected")) return;
  const marker = document.createElement("div");
  marker.id = "ghostshift-extension-detected";
  marker.hidden = true;
  marker.dataset.version = chrome.runtime.getManifest().version;
  document.documentElement.appendChild(marker);
  createDebugBanner();
  updateDebugBanner();
  debug("Extension injected", { host: window.location.hostname, pathname: window.location.pathname, version: marker.dataset.version });
}

function createDebugBanner() {
  if (document.getElementById("ghostshift-debug-banner")) return;
  const banner = document.createElement("div");
  banner.id = "ghostshift-debug-banner";
  banner.style.cssText = "position:fixed;bottom:1rem;right:1rem;z-index:2147483647;max-width:320px;padding:0.75rem 1rem;font-family:Arial,sans-serif;font-size:12px;line-height:1.4;background:rgba(0,0,0,0.85);color:#ffffff;border-radius:10px;box-shadow:0 12px 30px rgba(0,0,0,0.35);opacity:0.95;";
  banner.innerHTML = '<strong>GhostShift</strong><br><span id="ghostshift-debug-status">Initializing...</span><br><span id="ghostshift-debug-action"></span>';
  document.documentElement.appendChild(banner);
}

function updateDebugBanner() {
  const banner = document.getElementById("ghostshift-debug-banner");
  if (!banner) return;
  const statusEl = document.getElementById("ghostshift-debug-status");
  const actionEl = document.getElementById("ghostshift-debug-action");
  if (statusEl) statusEl.textContent = `${status.platform} on ${status.host}`;
  if (actionEl) actionEl.textContent = `${status.lastAction} — scans: ${status.scanCount}, skips: ${status.skipCount}`;
}

function storageGet(area, defaults) {
  return new Promise((resolve) => chrome.storage[area].get(defaults, resolve));
}

function storageSet(area, value) {
  return new Promise((resolve) => chrome.storage[area].set(value, resolve));
}

function getSiteKey() {
  const host = window.location.hostname.replace(/^www\./, "");
  const pathname = window.location.pathname.toLowerCase();
  if (host.endsWith("youtube.com")) return "youtube.com";
  if (host.endsWith("facebook.com")) return "facebook.com";
  if (pathname.includes("demo-player") || pathname.includes("install")) return "ghostshift-demo";
  if (host === "localhost" || host === "127.0.0.1") return "ghostshift-demo";
  return host;
}

function getPlatformName() {
  const siteKey = getSiteKey();
  if (siteKey === "youtube.com") return "YouTube";
  if (siteKey === "facebook.com") return "Facebook";
  if (siteKey === "ghostshift-demo") return "GhostShift demo";
  return siteKey;
}

function isEnabledForSite() {
  const value = settings.siteOverrides?.[getSiteKey()];
  return value !== false;
}

function setLastAction(message) {
  status.lastAction = message;
  status.lastActionAt = new Date().toISOString();
}

function isVisible(element) {
  if (!element) return false;
  const box = element.getBoundingClientRect();
  const style = window.getComputedStyle(element);
  return box.width > 0 && box.height > 0 && style.visibility !== "hidden" && style.display !== "none";
}

function textLooksLikeSkip(element) {
  const text = `${element.innerText || ""} ${element.ariaLabel || ""} ${element.title || ""}`.toLowerCase();
  return text.includes("skip") || text.includes("skip ad") || text.includes("skip ads");
}

function findSkipControl() {
  const directMatches = SKIP_SELECTORS.flatMap((selector) => Array.from(document.querySelectorAll(selector)));
  debug("findSkipControl: direct selector candidates", { count: directMatches.length, selectors: SKIP_SELECTORS });
  const directMatch = directMatches.find((element) => isVisible(element) && textLooksLikeSkip(element));

  if (directMatch) {
    debug("findSkipControl: direct match found", { selector: directMatch.tagName, text: directMatch.innerText });
    return directMatch;
  }

  const buttons = Array.from(document.querySelectorAll("button, [role='button']"));
  debug("findSkipControl: button candidates", { count: buttons.length });
  const fallbackMatch = buttons.find((element) => isVisible(element) && textLooksLikeSkip(element));
  if (fallbackMatch) {
    debug("findSkipControl: fallback match found", { text: fallbackMatch.innerText });
  }
  return fallbackMatch;
}

function pageLooksLikeAdBreak() {
  const match = AD_STATE_SELECTORS.some((selector) => Array.from(document.querySelectorAll(selector)).some(isVisible));
  debug("pageLooksLikeAdBreak", { match, selectors: AD_STATE_SELECTORS });
  return match;
}

function getVideo() {
  return Array.from(document.querySelectorAll("video")).find(isVisible);
}

function setMutedDuringAd(isAdBreak) {
  const video = getVideo();
  if (!video || !settings.muteDuringAds) return;

  if (isAdBreak && !video.muted) {
    previousVolume = video.volume;
    video.muted = true;
    status.mutedByGhostShift = true;
    setLastAction("Muted an ad break");
    return;
  }

  if (!isAdBreak && video.muted && previousVolume !== null) {
    video.muted = false;
    video.volume = previousVolume;
    previousVolume = null;
    status.mutedByGhostShift = false;
    setLastAction("Restored video audio");
  }
}

async function recordSkip() {
  const siteKey = getSiteKey();
  const today = new Date().toISOString().slice(0, 10);
  const saved = await storageGet("local", { stats: {} });
  const stats = saved.stats || {};
  const siteStats = stats[siteKey] || { totalSkips: 0, mutedBreaks: 0, lastSkipAt: null, days: {} };
  siteStats.totalSkips += 1;
  siteStats.lastSkipAt = new Date().toISOString();
  siteStats.days[today] = (siteStats.days[today] || 0) + 1;
  stats[siteKey] = siteStats;
  await storageSet("local", { stats, lastGhostShiftAction: siteStats.lastSkipAt });
}

async function scan(reason = "auto") {
  status.scanCount += 1;
  status.host = window.location.hostname;
  status.platform = getPlatformName();
  status.enabledForSite = isEnabledForSite();
  debug("Starting scan", { reason, host: status.host, platform: status.platform, enabledForSite: status.enabledForSite, settings });

  if (!settings.enabled) {
    status.adDetected = false;
    status.skipControlVisible = false;
    setLastAction("GhostShift is paused globally");
    updateDebugBanner();
    return status;
  }

  if (!status.enabledForSite) {
    status.adDetected = false;
    status.skipControlVisible = false;
    setLastAction(`${getPlatformName()} is disabled in GhostShift`);
    updateDebugBanner();
    return status;
  }

  const isAdBreak = pageLooksLikeAdBreak();
  status.adDetected = isAdBreak;
  setMutedDuringAd(isAdBreak);

  const skipControl = findSkipControl();
  status.skipControlVisible = Boolean(skipControl);

  if (!settings.autoSkip) {
    if (skipControl) setLastAction("Skip control found, auto skip is off");
    updateDebugBanner();
    return status;
  }

  if (skipControl) {
    debug("Clicking skip control", { element: skipControl, text: skipControl.innerText });
    skipControl.click();
    status.skipCount += 1;
    setLastAction(reason === "manual" ? "Manual scan clicked a skip control" : "Auto-clicked a visible skip control");
    await recordSkip();
    updateDebugBanner();
    return status;
  }

  if (isAdBreak) {
    setLastAction("Ad break detected, waiting for skip control");
  } else if (reason === "manual") {
    setLastAction("Manual scan complete, no skip control visible");
  }

  updateDebugBanner();
  return status;
}

chrome.storage.sync.get(DEFAULT_SETTINGS, (saved) => {
  settings = { ...DEFAULT_SETTINGS, ...saved };
  markExtensionDetected();
  scan();
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "sync") return;
  Object.entries(changes).forEach(([key, change]) => {
    settings[key] = change.newValue;
  });
});

const observer = new MutationObserver(scan);
observer.observe(document.documentElement, { childList: true, subtree: true });

window.setInterval(scan, 1200);

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "GHOSTSHIFT_GET_STATUS") {
    scan("popup").then(sendResponse);
    return true;
  }

  if (message?.type === "GHOSTSHIFT_RUN_SCAN") {
    scan("manual").then(sendResponse);
    return true;
  }

  if (message?.type === "GHOSTSHIFT_SET_SITE_ENABLED") {
    const siteKey = getSiteKey();
    settings.siteOverrides = { ...(settings.siteOverrides || {}), [siteKey]: Boolean(message.enabled) };
    chrome.storage.sync.set({ siteOverrides: settings.siteOverrides }, () => {
      scan("popup").then(sendResponse);
    });
    return true;
  }

  return false;
});
