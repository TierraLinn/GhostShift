# GhostShift Stripe Backend

GhostShift subscriptions should use Stripe Billing with Checkout Sessions.

## Why this backend exists

The browser must never contain your Stripe secret key. The dashboard calls this backend endpoint:

`POST /api/create-checkout-session`

The backend creates a Stripe Checkout Session in `subscription` mode and returns the Stripe-hosted checkout URL.

## Environment variables

Create these environment variables before running the server:

- `STRIPE_SECRET_KEY`
- `STRIPE_PRICE_PLUS`
- `STRIPE_PRICE_FAMILY`
- `PORT` optional, defaults to `8787`

Use Stripe Prices, not deprecated Plans.

## Run locally in PowerShell

```powershell
$env:STRIPE_SECRET_KEY="sk_test_your_key_here"
$env:STRIPE_PRICE_PLUS="price_your_plus_price_id"
$env:STRIPE_PRICE_FAMILY="price_your_family_price_id"
node .\GhostShift\backend\server.mjs
```

Then open:

`http://localhost:8787/signup.html`

Working test model:

`http://localhost:8787/demo-player.html`

The demo player simulates an ad break so the browser extension can prove automatic skip behavior locally.

## Stripe dashboard setup

1. Create a Stripe account.
2. Create a GhostShift product.
3. Add a monthly Plus price for `$2.99`.
4. Add a monthly Family price for `$6.99`.
5. Copy the two `price_...` IDs into the environment variables above.
6. Use Stripe Customer Portal later for cancel, update payment method, and plan changes.

## Freemium model

- Free to download.
- 14-day full-feature trial.
- Subscription required after the trial for continued Plus features.
- Keep sign-in, extension download, support, and account access available without payment.

## Production notes

- Add webhook handling before launch.
- Listen for `checkout.session.completed`, `customer.subscription.updated`, and `customer.subscription.deleted`.
- Store Stripe customer IDs and subscription state in a real database.
- Add a privacy policy and terms page before accepting live payments.
- Keep the server online with Docker, a VPS, or an always-on app host.
- Monitor `GET /api/health` so downtime is detected quickly.
