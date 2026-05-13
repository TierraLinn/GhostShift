# GhostShift Chrome/Edge Extension

This is the first interactable GhostShift extension package.

## What it does

- Runs on YouTube and Facebook web pages.
- Looks for visible skip controls.
- Clicks only visible controls that already include skip text or skip labels.
- Auto skip is enabled by default on supported web platforms.
- Mutes during detected ad states and restores volume afterward.
- Stores settings in Chrome sync storage.
- Shows live status in the popup.
- Lets the user turn GhostShift on or off globally and per supported site.
- Tracks local skip counts by site.
- Includes an options page for settings and stats.

## Freemium behavior

The extension is free to install. The intended production model is a 14-day Plus trial, then a Stripe subscription for continued Plus features. This local MVP does not yet enforce the paid license because that requires the always-on backend, account database, and Stripe webhooks.

## What it does not do

- It does not block ad network requests.
- It does not bypass DRM.
- It does not bypass paywalls.
- It does not scrape account credentials.
- It does not guarantee support for every video player.

## Load locally

1. Open Chrome or Edge.
2. Go to `chrome://extensions` or `edge://extensions`.
3. Turn on Developer mode.
4. Choose Load unpacked.
5. Select this folder: `GhostShift/extension-chrome-edge`.
6. Open YouTube or Facebook in a new tab.
7. Click the GhostShift extension icon to use the popup.
8. If the popup says reload is needed, refresh the video page once.

> You should see a GhostShift debug banner in the bottom-right corner of the page when the extension is active.
>
> If GhostShift still does not activate, open the extension details and set site access to `On all sites`, then reload the extension and refresh the demo page.

## Working local test model

The extension also runs on the GhostShift demo player:

`http://localhost:8787/demo-player.html`

Use this page to prove auto-skip safely before testing on live video sites. The page creates a simulated sponsored break with a visible `Skip Ad` button. GhostShift should detect and click it automatically when the extension is loaded.

### Production deployment
After deploying the backend, update `manifest.json` to include the live host and reload the extension. For example:

- `https://ghostshift.onrender.com/*`

Once deployed, the extension can support the live demo page at:

- `https://ghostshift.onrender.com/demo-player.html`

## Interactable surfaces

- Popup: `popup.html`
- Options page: `options.html`
- Content script: `content.js`

## Next engineering steps

1. Connect the popup to the GhostShift subscription account.
2. Add more supported player adapters through a review-safe registry.
3. Add automated extension tests with mocked video player pages.
4. Prepare Chrome Web Store and Microsoft Edge Add-ons privacy disclosures.
