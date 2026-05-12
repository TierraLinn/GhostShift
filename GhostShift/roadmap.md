# GhostShift Technical Roadmap

GhostShift should launch as a platform-safe freemium product, not as a tool that promises to defeat every ad system.

## Legal product boundary

- Allowed: click visible skip controls after they appear, mute and restore volume during ad breaks, offer reminders, store user preferences, sync subscription status, and support browser players where this behavior is permitted.
- Not allowed: bypass DRM, defeat paywalls, scrape credentials, interfere with network requests in a way stores prohibit, or claim guaranteed ad removal on every platform.
- Important: YouTube, Facebook, Apple, Google, and Microsoft can restrict or reject ad-skipping behavior in stores. The app copy should say "where supported" and "where platform rules allow it."

## Recommended build order

1. Chrome and Microsoft Edge extension
   - Manifest V3 extension.
   - Content scripts for supported web players.
   - Detect visible skip buttons and click only after they are available.
   - Mute ad breaks and restore user volume.
   - Popup UI for free trial status, supported sites, and settings.

2. GhostShift account and billing web app
   - Sign up, sign in, manage subscription, download installers.
   - Freemium plan: 14-day full feature trial, then monthly subscription.
   - Stripe or another official billing provider.

3. Desktop companion
   - Windows app as a settings and install manager.
   - Edge extension pairing.
   - Later Mac app with Safari extension support.

4. Mobile companion
   - Android app can manage settings and browser integration.
   - iPhone/iPad support should start with Safari extension limits.
   - Native YouTube/Facebook app ad skipping may not be allowed by platform or app store rules.

## Suggested pricing

- Free download: anyone can install GhostShift first.
- Free trial: 14-day full feature trial to attract users.
- Plus: $2.99/month for supported auto-skip, mute/restore, and cross-device sync.
- Family: $6.99/month for up to 6 profiles.

After the trial, keep basic account access free and require a subscription for continued Plus features.

## First real MVP

Build a Chrome/Edge extension with:

- `manifest.json`
- `content.js`
- `popup.html`
- `popup.css`
- `popup.js`
- local settings storage
- supported-site toggles
- clear status text when a site cannot be automated safely

Then connect it to the GhostShift web account and billing layer.
