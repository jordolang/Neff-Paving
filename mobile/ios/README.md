# Neff Service + Support — iOS (Swift / SwiftUI)

Native iOS app for **Neff Paving**, **Muskingum Materials** and **Austin Trucking**. One SwiftUI
code base builds three branded apps; all of them talk to the shared backend in `../../api`
using the contract in [`../API_CONTRACT.md`](../API_CONTRACT.md).

## Prerequisites

- macOS with **Xcode 16 or newer** (the code relies on SwiftUI views being `@MainActor`, which
  Xcode 16's iOS 18 SDK provides; deployment target is still iOS 17).
- [XcodeGen](https://github.com/yonaskolb/XcodeGen): `brew install xcodegen`
- The backend running locally (`cd api && npm run dev`) or a deployed URL.

## Generate and run

```bash
cd mobile/ios
xcodegen generate          # creates NeffService.xcodeproj (git-ignored)
open NeffService.xcodeproj
```

Pick a scheme — **NeffPaving**, **MuskingumMaterials** or **AustinTrucking** — and run. The
Google Sign-In Swift package is resolved automatically on first build.

## Per-brand configuration

Everything brand-specific is a build setting in `project.yml`, written into each target's
generated Info.plist:

| Setting | Purpose |
| --- | --- |
| `COMPANY_KEY` | `neff`, `muskingum` or `austin`; sent as `X-Company` on every request and selects the theme |
| `API_BASE_URL` | Debug: `http://localhost:3000/api/v1`; Release: `https://api.neffpaving.com/api/v1` (change before shipping) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_REVERSED_CLIENT_ID` | iOS OAuth client from Google Cloud Console. The `REPLACE_ME` placeholders disable the Google button. |
| `PRODUCT_BUNDLE_IDENTIFIER`, `APP_DISPLAY_NAME` | App identity in the store |

To point a simulator at another machine, edit `API_BASE_URL` under the `Debug` config. Running on
a physical device needs your Mac's LAN IP, not `localhost`.

The **backend** must list each app's Google client ID in `GOOGLE_CLIENT_IDS` so it accepts the
ID tokens these apps send to `POST /auth/google`.

Brand colors live in `App/Theme.swift`. Neff uses #F5A400 on near-black, Muskingum uses an
earthy green, and Austin uses deep red. Drop 1024×1024 icons into
`Resources/Assets.xcassets/AppIcon.appiconset` (one per brand if you add per-target catalogs).

## How it's organized

```
App/        entry point, Session (auth + clock state), Theme
Core/       APIClient (X-Company, bearer, refresh-on-401, multipart), Keychain tokens,
            contract models, money/date decoding, roles + permissions
Services/   LocationTracker + LocationQueue, MediaUploader, navigation hand-off, push
Features/   Auth · Root (permission-driven tabs) · Profile · Portal (customer) · Messages ·
            Employee · Field (jobs, customers, estimates, crews) · Admin · Shared components
Tests/      unit tests for decoding, permissions, money, the offline location queue
```

Tabs are built from the permissions on `GET /me`:

- **Customers** see Profile, Projects, Estimates, Billing and More (gallery, reviews, messages,
  notifications).
- **Employees** see Profile, Clock, Jobs (crew leads and up) and Schedule.
- **Admins and office staff** also get an Admin tab, which holds the dashboard and the live crew
  map.

Every user lands on **Profile** right after signing in. The server enforces every permission;
the app only hides screens.

## Location tracking (read before App Store submission)

- Tracking runs **only while clocked in**. The first clock-in shows a plain-language disclosure,
  and the app sends `trackingConsent: true`.
- `LocationTracker` uses `allowsBackgroundLocationUpdates` and the blue status-bar indicator.
  When the user grants *When In Use*, the app then asks for *Always*.
- Points are batched every 60 s or 50 m, queued on disk while the phone is offline, and flushed
  on reconnect.
- Tracking stops on clock-out, on sign-out, or immediately on a `409 not_clocked_in` from the
  server.
- `UIBackgroundModes` includes `location`. In App Review notes, explain that this is workforce
  time-and-attendance tracking that runs only during paid, clocked-in time. Also provide a demo
  employee account. Apple's guideline 5.1.1(iv) applies.

## Media

Photos and videos are captured with the camera or picked from the library. They upload to the
active job (`POST /jobs/:id/media`, or `/portal/...` for customers) along with the device
location. `MediaUploader` copies files into Application Support and retries with backoff, so
uploads survive bad signal on job sites.

## Push notifications

The **Push Notifications** capability is enabled through `Config/App.entitlements`. The APNs
token is sent to `POST /auth/device` after each sign-in. A notification payload that carries
`jobId` opens that job when the user taps it. Delivering pushes needs an APNs key on the
backend.

## Tests

```bash
xcodebuild test -project NeffService.xcodeproj -scheme NeffPaving \
  -destination 'platform=iOS Simulator,name=iPhone 16'
```

You can also press ⌘U in Xcode with the NeffPaving scheme selected.

The test files only exercise Foundation code (`Core/` and `Services/LocationQueue.swift`), so
they also run on Linux with a Swift toolchain. Wrap those folders in a throwaway SwiftPM
package to run them that way.
