# GhostShift Mobile App Plan

GhostShift can be available on mobile, but the mobile product has to be split into two layers:

1. The GhostShift mobile app: account, subscription, settings, install help, privacy controls, and supported-browser setup.
2. Browser extension behavior: actual skip assistance where the browser and platform allow extensions or page scripts.

## Best all-platform strategy

- PWA: works first on Android, iPhone, iPad, Windows, macOS, and desktop browsers as an installable web app.
- Android app: wrap the PWA with Capacitor or Trusted Web Activity, then publish through Google Play after policy review.
- iPhone/iPad app: wrap the PWA with Capacitor and package a Safari Web Extension through Xcode for Safari support.
- Windows app: publish the PWA through Microsoft Store or ship an Edge extension plus a small desktop companion.
- Chrome/Edge extension: remains the strongest first build for actual skip automation.

## What the mobile app can safely do

- Let users create an account.
- Manage the free trial and subscription.
- Turn GhostShift features on or off.
- Show supported sites and browsers.
- Sync settings across devices.
- Guide users to install the right extension.
- Provide status messages when a mobile platform does not allow auto-skip.

## What the mobile app should not promise

- It should not promise to skip ads inside every native app.
- It should not claim it can control YouTube, Facebook, or other native apps directly.
- It should not use hidden screen monitoring or Accessibility APIs to manipulate other apps unless a store-approved accessibility use case exists.
- It should not bypass DRM, paywalls, subscriptions, or platform security.

## Android path

1. Launch the installable PWA first.
2. Build a Capacitor Android wrapper.
3. Add account and subscription screens.
4. Add browser setup guidance for supported Android browsers.
5. Publish to Google Play with clear disclosure that GhostShift works only where supported.

## Apple path

1. Launch the installable PWA first.
2. Build a Capacitor iOS wrapper.
3. Add a Safari Web Extension target in Xcode.
4. Package the Safari extension inside the iOS app.
5. Publish through the Apple App Store with clear Safari-only support language.

## Microsoft path

1. Keep the Edge extension as the primary automation layer.
2. Publish the PWA through Microsoft Store.
3. Add a Windows companion later only if users need local settings or installer management.

## First build checklist

- PWA manifest: done.
- Offline shell/service worker: done.
- Mobile app icon: done.
- Chrome/Edge extension skeleton: done.
- Capacitor wrapper: next.
- Account and subscription backend: next.
- Store privacy policy: next.
- App Store and Play Store listing copy: next.
