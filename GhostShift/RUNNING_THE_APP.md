# Running GhostShift

## One-command run

Open PowerShell and run:

```powershell
cd C:\Users\tierr\Documents\Codex\2026-05-03\i-want-to-create-a-factory\GhostShift
.\run-ghostshift.ps1
```

Then open:

- `http://localhost:8787`
- `http://localhost:8787/signup.html`
- `http://localhost:8787/dashboard.html`
- `http://localhost:8787/demo-player.html`

Keep the PowerShell window open while testing.

## Test the extension

1. Open Chrome or Edge.
2. Go to `chrome://extensions` or `edge://extensions`.
3. Turn on Developer mode.
4. Click Load unpacked.
5. Select:

`C:\Users\tierr\Documents\Codex\2026-05-03\i-want-to-create-a-factory\GhostShift\extension-chrome-edge`

6. Open:

`http://localhost:8787/demo-player.html`

The demo player should show a sponsored break. GhostShift should click `Skip Ad` automatically.

## Stripe setup

The app has a demo checkout fallback right now. To use real Stripe subscriptions, set:

```powershell
$env:STRIPE_SECRET_KEY="sk_test_your_key_here"
$env:STRIPE_PRICE_PLUS="price_plus_monthly_id"
$env:STRIPE_PRICE_FAMILY="price_family_monthly_id"
.\run-ghostshift.ps1
```

Use Stripe Price IDs, not old Plan IDs.
