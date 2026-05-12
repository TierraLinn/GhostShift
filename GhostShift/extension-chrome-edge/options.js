const DEFAULT_SETTINGS = {
  enabled: true,
  autoSkip: true,
  muteDuringAds: true,
  siteOverrides: {}
};

const settingFields = ["enabled", "autoSkip", "muteDuringAds"].map((key) => document.getElementById(key));
const siteFields = Array.from(document.querySelectorAll(".site-toggle"));
const statsList = document.getElementById("statsList");
const resetStats = document.getElementById("resetStats");

function renderStats(stats) {
  const entries = Object.entries(stats || {});
  if (!entries.length) {
    statsList.innerHTML = "<p>No skips recorded yet.</p>";
    return;
  }

  statsList.innerHTML = entries
    .map(([site, siteStats]) => {
      const lastSkip = siteStats.lastSkipAt ? new Date(siteStats.lastSkipAt).toLocaleString() : "Never";
      return `
        <div class="stat-row">
          <strong>${site}</strong>
          <span>${siteStats.totalSkips || 0} total skips</span>
          <span>Last: ${lastSkip}</span>
        </div>
      `;
    })
    .join("");
}

function loadOptions() {
  chrome.storage.sync.get(DEFAULT_SETTINGS, (settings) => {
    settingFields.forEach((field) => {
      field.checked = Boolean(settings[field.id]);
    });

    siteFields.forEach((field) => {
      field.checked = settings.siteOverrides?.[field.id] !== false;
    });
  });

  chrome.storage.local.get({ stats: {} }, ({ stats }) => renderStats(stats));
}

settingFields.forEach((field) => {
  field.addEventListener("change", () => {
    chrome.storage.sync.set({ [field.id]: field.checked });
  });
});

siteFields.forEach((field) => {
  field.addEventListener("change", () => {
    chrome.storage.sync.get(DEFAULT_SETTINGS, (settings) => {
      const siteOverrides = { ...(settings.siteOverrides || {}), [field.id]: field.checked };
      chrome.storage.sync.set({ siteOverrides });
    });
  });
});

resetStats.addEventListener("click", () => {
  chrome.storage.local.set({ stats: {} }, () => renderStats({}));
});

loadOptions();
