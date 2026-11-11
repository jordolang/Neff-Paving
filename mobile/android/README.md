# Neff Service + Support — Android (Flutter)

The Android app for **Neff Paving**, **Muskingum Materials** and **Austin Trucking**. One
codebase builds three apps (product flavors). It implements
[`../API_CONTRACT.md`](../API_CONTRACT.md) against the shared backend in `api/`.

## What's in it

| Area | Who sees it | Screens |
| --- | --- | --- |
| Sign-in | everyone | Email login, sign up, Google sign-in, forgot/reset password. After sign-in → **Profile**. |
| Profile | everyone | Name, phone, address, photo, push/email/SMS preferences, public-profile toggle, change password. |
| Customer portal | `customer` | Project history, project detail (overview, map + Navigate, timeline, photos), add photos, share to public gallery, leave a review, request estimates (with photos), accept/decline estimates, invoices + payments (Stripe Checkout hand-off), messages, notifications, gallery, reviews. |
| Employee | internal roles | Clock in/out (tracking disclosure + consent), live tracking status, photo/video for the active job, time sheet + submit, schedule, crews, contacts directory, time off, pay stubs, tax & pay preferences (write-only bank numbers), raise/position requests, message the owners. |
| Field | crew leads, estimators, office | Jobs (my crew / all, status filters), job detail with customer call/text/email, edit job, status updates (customer-visible or internal; *completed* notifies customer + owners), daily job logs, photo/video capture, crew member management, customers, estimates with a line-item editor + send, company calendar, equipment & maintenance. |
| Admin | admins, super admin | Dashboard, **Live Map** of everyone clocked in (15 s refresh, tap for today's trail), users (role elevation, pay rate, deactivate), permission editor, approvals (time sheets, time off, raises), dispatch + shift scheduling, invoices (create/send/record payment/void), payroll runs, suppliers, job postings, review moderation, media moderation (long-press job media), account close-out. |

Navigation (bottom bar + drawer) is built from the permissions on `GET /me`, so a new
permission granted in the role editor shows up after the next refresh. The server enforces every
permission on its own; the app only decides what to show.

## Layout

```
lib/
  main_neff.dart · main_muskingum.dart · main_austin.dart   flavor entrypoints
  app.dart                     bootstrap, go_router, auth redirects
  core/                        CompanyConfig, ApiClient (X-Company, bearer, refresh-on-401,
                               error codes), TokenStore, models, Money, permissions, session
  services/                    LocationTracker + LocationBatcher, MediaUploader (offline queue),
                               Launchers (navigation/call/text/email), PushRegistration
  ui/                          theme, shell (feature registry), generic list/form widgets, maps
  features/                    auth, profile, portal, community, messages, time, employee,
                               jobs, admin
test/                          money, models, permissions, location batching, API errors, shell
```

## Prerequisites

- Flutter 3.47+ (Dart 3.13+), the Android SDK (`flutter doctor` lists the platform it needs), JDK 17
- An Android device or emulator on Android 7.0 (API 24) or newer
- The backend from `api/` running (see `api/README.md`)

## Run

```bash
cd mobile/android
flutter pub get

# Neff Paving against a local API (emulator reaches the host at 10.0.2.2)
flutter run --flavor neff -t lib/main_neff.dart \
  --dart-define=API_BASE_URL=http://10.0.2.2:3000/api/v1 \
  --dart-define=GOOGLE_SERVER_CLIENT_ID=XXXX.apps.googleusercontent.com

# The other companies
flutter run --flavor muskingum -t lib/main_muskingum.dart --dart-define=API_BASE_URL=https://api.example.com/api/v1
flutter run --flavor austin    -t lib/main_austin.dart    --dart-define=API_BASE_URL=https://api.example.com/api/v1

# Release bundles for Google Play (one per company)
flutter build appbundle --flavor neff -t lib/main_neff.dart --dart-define=API_BASE_URL=https://api.example.com/api/v1
```

| Flavor | Application id | Tenant (`X-Company`) |
| --- | --- | --- |
| `neff` | `com.neffpaving.app` | `neff` |
| `muskingum` | `com.muskingummaterials.app` | `muskingum` |
| `austin` | `com.austintrucking.app` | `austin` |

`API_BASE_URL` defaults to `http://10.0.2.2:3000/api/v1`. Plain HTTP is only allowed to
`10.0.2.2`/`localhost` (`res/xml/network_security_config.xml`); production must be HTTPS.

Release builds are currently signed with the debug key (`android/app/build.gradle.kts`). Add an
upload keystore (`key.properties`, never committed) before publishing.

## Google sign-in

The app uses `google_sign_in` 7 (Android Credential Manager) and sends the returned **ID token** to
`POST /auth/google`.

1. In Google Cloud Console create an **OAuth client of type Web application**. Its client id is the
   `GOOGLE_SERVER_CLIENT_ID` dart-define, and the backend must accept it as the token audience.
2. Create one **Android** OAuth client per flavor with the package name above and your signing
   certificate's SHA-1:
   ```bash
   keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
   ```
   Repeat with the release/upload key (and the Play App Signing key from the Play Console).
3. Without `GOOGLE_SERVER_CLIENT_ID` the Google button shows a "not configured" message; email
   sign-in still works.

## Location tracking (clocked-in employees)

Implements the contract's tracking rules:

- Starts only after a successful `POST /time/clock-in`; stops on clock-out, sign-out, or any
  `409 not_clocked_in` from `/time/locations` (queued points are then discarded).
- First clock-in shows a plain-language disclosure; the app then requests location *While in use*
  and *Allow all the time*, and sends `trackingConsent: true`.
- Runs as a foreground service (`foregroundServiceType="location"`, from `geolocator`) with the
  ongoing notification **"Clocked in — location shared"**.
- Points are batched every 60 s (server `pingIntervalSeconds`) or 50 m moved, persisted in
  `SharedPreferences` while offline (bounded to 5,000 points) and flushed when the network returns.
- At clock-out the app flushes queued points *before* calling `/time/clock-out`.
- On launch it reads `/time/status` and resumes tracking only if the server says the user is
  clocked in.

**Google Play:** background location needs the Play Console *Location permissions* declaration and
a short video showing the in-app disclosure and the clock-in flow. The disclosure text lives in
`lib/features/time/time_screens.dart`. Battery level is not sent (no battery plugin); add
`battery_plus` if owners want it on the live map.

## Photos and video

Captured with `image_picker` and uploaded as multipart `file` with `caption`, `latitude`,
`longitude` (and `statusUpdateId` when attached to a status update). From the Clock screen, media
goes to the job on the open time entry; from a job screen, to that job. Failed uploads are queued
and retried every two minutes and at launch; the app bar shows a badge while uploads wait.

## Maps

`flutter_map` with OpenStreetMap tiles, so no API key is needed. Heavy production use should
switch `osmTileUrl` in `lib/ui/map_widgets.dart` to a commercial tile provider per the OSM tile
policy. **Navigate** opens Google Maps turn-by-turn (`google.navigation:q=`), falling back to the
Google Maps website.

## Push notifications

`PushRegistration.register(token)` posts to `POST /auth/device`. Delivering push messages needs
Firebase Cloud Messaging: add `firebase_core` + `firebase_messaging`, put each flavor's
`google-services.json` in `android/app/src/<flavor>/`, and pass the FCM token to
`PushRegistration`. Until then, notifications appear in-app from `GET /notifications`.

## Checks

```bash
flutter analyze   # must report "No issues found!"
flutter test      # unit tests: money, models, permissions, location batching, API errors, nav
```
