# GhostShift

GhostShift is a freemium video-flow product prototype with a web app, a browser extension, a safe auto-skip demo, and a Stripe-ready subscription backend.

## Working local model

Fastest way:

```powershell
cd C:\Users\tierr\Documents\Codex\2026-05-03\i-want-to-create-a-factory\GhostShift
.\run-ghostshift.ps1
```

Manual way:

```powershell
cd C:\Users\tierr\Documents\Codex\2026-05-03\i-want-to-create-a-factory\GhostShift
node .\backend\server.mjs
```

Open:

`http://localhost:8787`

Key pages:

- `http://localhost:8787/signup.html`
- `http://localhost:8787/dashboard.html`
- `http://localhost:8787/demo-player.html`

## Test the extension

1. Open Chrome or Edge.
2. Go to `chrome://extensions` or `edge://extensions`.
3. Turn on Developer mode.
4. Click Load unpacked.
5. Select `GhostShift/extension-chrome-edge`.
6. Open `http://localhost:8787/demo-player.html`.

The demo player simulates an ad break with a visible skip button. GhostShift should click it automatically.

## Freemium model

- Free to download.
- 14-day full-feature trial.
- Paid Plus plan after the trial.
- Family plan for household use.
- Stripe Checkout for subscription payment.

## Platform boundary

GhostShift only automates supported browser-visible controls. It does not bypass DRM, paywalls, account requirements, app security, or platform restrictions.
