const DEFAULT_SETTINGS = {
  enabled: true,
  autoSkip: true,
  muteDuringAds: true,
  siteOverrides: {}
};

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
}

function storageGet(area, defaults) {
  return new Promise((resolve) => chrome.storage[area].get(defaults, resolve));
}

function storageSet(area, value) {
  return new Promise((resolve) => chrome.storage[area].set(value, resolve));
}

function getSiteKey() {
  const host = window.location.hostname.replace(/^www\./, "");
  if (host.endsWith("youtube.com")) return "youtube.com";
  if (host.endsWith("facebook.com")) return "facebook.com";
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
  const directMatch = SKIP_SELECTORS
    .flatMap((selector) => Array.from(document.querySelectorAll(selector)))
    .find((element) => isVisible(element) && textLooksLikeSkip(element));

  if (directMatch) return directMatch;

  return Array.from(document.querySelectorAll("button, [role='button']"))
    .find((element) => isVisible(element) && textLooksLikeSkip(element));
}

function pageLooksLikeAdBreak() {
  return AD_STATE_SELECTORS.some((selector) => Array.from(document.querySelectorAll(selector)).some(isVisible));
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

  if (!settings.enabled) {
    status.adDetected = false;
    status.skipControlVisible = false;
    setLastAction("GhostShift is paused globally");
    return status;
  }

  if (!status.enabledForSite) {
    status.adDetected = false;
    status.skipControlVisible = false;
    setLastAction(`${getPlatformName()} is disabled in GhostShift`);
    return status;
  }

  const isAdBreak = pageLooksLikeAdBreak();
  status.adDetected = isAdBreak;
  setMutedDuringAd(isAdBreak);

  const skipControl = findSkipControl();
  status.skipControlVisible = Boolean(skipControl);

  if (!settings.autoSkip) {
    if (skipControl) setLastAction("Skip control found, auto skip is off");
    return status;
  }

  if (skipControl) {
    skipControl.click();
    status.skipCount += 1;
    setLastAction(reason === "manual" ? "Manual scan clicked a skip control" : "Auto-clicked a visible skip control");
    await recordSkip();
    return status;
  }

  if (isAdBreak) {
    setLastAction("Ad break detected, waiting for skip control");
  } else if (reason === "manual") {
    setLastAction("Manual scan complete, no skip control visible");
  }

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
