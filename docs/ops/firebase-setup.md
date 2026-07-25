# Firebase — project state & remaining wiring

**Created 2026-07-26** (visible-browser session, owner's Google account).

| Item | Value |
|---|---|
| Project | **HelioGrid** · id `heliogrid-app` · Spark (no-cost) plan |
| Analytics | Enabled (Default Account for Firebase) — Crashlytics breadcrumbs ready |
| Android app | `com.heliogrid.app` (nickname "HelioGrid Android") — `google-services.json` in `apps/mobile/android/app/`, google-services plugin 4.5.0 applied |
| iOS app | `com.heliogrid.app` (nickname "HelioGrid iOS") — `GoogleService-Info.plist` in `apps/mobile/ios/`, added to the Xcode Resources phase |
| Bundle/application id | Both platforms moved OFF the RN template default to **`com.heliogrid.app`** (store identity — never change post-publish) |

RNFB (`@react-native-firebase/app` + `messaging` 25.1.0) auto-initialises from these
files — no code required for init.

## Remaining (external clocks — none block development)

1. **iOS remote push**: upload the **APNs Auth Key** (.p8) to Firebase → Cloud Messaging
   → Apple app config. Requires the **Apple Developer account** (paperwork). Until then:
   Notifee local notifications work everywhere; FCM delivery works on **Android** today.
2. **Server-side sends (PushPort)**: create a service account key (Project settings →
   Service accounts → Generate private key) → `FCM_SERVICE_ACCOUNT_JSON_BASE64` in env.
   Do this when Track A wires PushPort; key generation is one click.
3. **Crashlytics SDK** (`@react-native-firebase/crashlytics`) — add with the first real
   release build (docs/03 §18); Analytics is already collecting.
4. Production hardening later: separate `heliogrid-app-stg` project if/when a staging
   environment exists (config files are per-project — the RN build flavors decide).

## Committed vs local

`google-services.json` and `GoogleService-Info.plist` for this project are **committed**
(standard practice — they are client identifiers, not secrets; API restrictions live on
the Google Cloud side). The service-account JSON (server key) is a SECRET — env only.
