# GhostShift Production Launch Checklist

Last updated: May 13, 2026

## 1. Public HTTPS Web App

Deploy the `GhostShift` folder to a Node host that supports HTTPS.

Required commands:

```bash
npm install
npm run build
npm start
```

Required environment variables:

```bash
PORT=8787
PUBLIC_APP_URL=https://your-live-ghostshift-domain.com
STRIPE_SECRET_KEY=sk_live_or_sk_test_value
STRIPE_WEBHOOK_SECRET=whsec_value_from_stripe
STRIPE_PRICE_PLUS=price_plus_value
STRIPE_PRICE_FAMILY=price_family_value
```

Production health check:

```text
https://your-live-ghostshift-domain.com/api/health
```

## 2. Stripe Subscriptions

Create two recurring monthly Prices in Stripe:

- GhostShift Plus
- GhostShift Family

Use those Price IDs for `STRIPE_PRICE_PLUS` and `STRIPE_PRICE_FAMILY`.

Create a webhook endpoint in Stripe Workbench:

```text
https://your-live-ghostshift-domain.com/api/stripe/webhook
```

Subscribe to these event types:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

Copy the webhook signing secret into `STRIPE_WEBHOOK_SECRET`.

## 3. Browser Extension

After the live URL is known, add the live host to `GhostShift/extension-chrome-edge/manifest.json`.

Example:

```json
"https://your-live-ghostshift-domain.com/*"
```

Reload the extension at `chrome://extensions`, then test:

```text
https://your-live-ghostshift-domain.com/demo-player.html
```

## 4. Android Wrapper

On a machine with Node/npm, Android Studio, Java, and the Android SDK:

```bash
cd GhostShift
npm install
npm run prepare:mobile
cd mobile-app
npm install
npx cap add android
npx cap sync android
npx cap open android
```

In Android Studio:

1. Set package name `com.ghostshift.app`.
2. Set app version and version code.
3. Configure signing.
4. Build a release Android App Bundle.
5. Upload the `.aab` to Google Play Console.

## 5. iOS Wrapper

On macOS with Xcode and an Apple Developer account:

```bash
cd GhostShift
npm install
npm run prepare:mobile
cd mobile-app
npm install
npx cap add ios
npx cap sync ios
npx cap open ios
```

In Xcode:

1. Set Bundle ID `com.ghostshift.app`.
2. Select the Apple Developer team.
3. Configure signing.
4. Archive the app.
5. Upload to App Store Connect/TestFlight.

## 6. Store Review Language

Do not claim GhostShift blocks every ad or controls every native app.

Use this wording:

> GhostShift helps reduce video interruptions where supported by automating visible skip controls in supported browser players. Some platforms, native apps, and video services may not allow skip assistance.

## 7. Before Public Release

- Verify `/api/health` returns `stripeConfigured: true` and `stripeWebhookConfigured: true`.
- Complete a Stripe test Checkout flow.
- Confirm webhook events update the dashboard account status.
- Test the extension on the hosted demo player.
- Test the mobile wrapper on at least one Android device.
- Test iOS through TestFlight before App Store submission.
- Publish final Privacy Policy and Terms URLs.

