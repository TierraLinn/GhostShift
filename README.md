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

- `http://localhost:8787/install.html`
- `http://localhost:8787/signup.html`
- `http://localhost:8787/dashboard.html`
- `http://localhost:8787/demo-player.html`

## Test the extension

1. Open `http://localhost:8787/install.html`.
2. Download the extension ZIP or use the unpacked folder directly.
3. Open Chrome or Edge.
4. Go to `chrome://extensions` or `edge://extensions`.
5. Turn on Developer mode.
6. Click Load unpacked.
7. Select `GhostShift/extension-chrome-edge`.
8. Refresh `http://localhost:8787/install.html`.
9. Open `http://localhost:8787/demo-player.html`.

The demo player simulates an ad break with a visible skip button. GhostShift should click it automatically.

## Mobile path

GhostShift includes an installable PWA and starter native-build notes. Open `mobile-app/PWA_INSTALL.md` for phone installation steps. Native Android and iOS store builds still require Android Studio, Xcode, signing keys, and store accounts.

## Freemium model

- Free to download.
- 14-day full-feature trial.
- Paid Plus plan after the trial.
- Family plan for household use.
- Stripe Checkout for subscription payment.

## Platform boundary

GhostShift only automates supported browser-visible controls. It does not bypass DRM, paywalls, account requirements, app security, or platform restrictions.
