# Neff Service + Support — Mobile API Contract (v1)

One backend serves three branded apps: **Neff Paving** (`neff`), **Muskingum Materials**
(`muskingum`) and **Austin Trucking** (`austin`). Both native clients (iOS/Swift and
Android/Flutter) speak exactly this contract. The server lives in `api/` and mounts it at
`/api/v1`.

## Conventions

| Item | Rule |
| --- | --- |
| Base URL | `https://<host>/api/v1` (dev: `http://localhost:3000/api/v1`, Android emulator `http://10.0.2.2:3000/api/v1`) |
| Tenant | Every request sends `X-Company: neff \| muskingum \| austin`. The app build flavor fixes it. |
| Auth | `Authorization: Bearer <accessToken>` (JWT, 12 h). Refresh with `POST /auth/refresh`. |
| JSON | camelCase keys, ISO-8601 UTC timestamps (`2026-11-11T17:58:00Z`), money as decimal **strings** (`"1250.00"`), ids as integers. |
| Success | `200/201` with `{ "data": <payload> }`; lists are `{ "data": [...], "meta": { "total": n } }`. |
| Error | `4xx/5xx` with `{ "error": { "code": "forbidden", "message": "..." } }`. Codes: `bad_request`, `unauthorized`, `forbidden`, `not_found`, `conflict`, `not_clocked_in`, `server_error`. |
| Uploads | `multipart/form-data`, field name `file` (+ optional text fields). Max 200 MB. Upload URLs (`/uploads/...`) are absolute in responses. |
| Rate limit | `429` with code `rate_limited`. |

## Roles and permissions

Roles, highest first (a user holds exactly one role per company):

| Role key | Who | Notes |
| --- | --- | --- |
| `super_admin` | The owner | Seeded from `SUPER_ADMIN_EMAIL`. Ultimate authority, every permission, every company. Cannot be demoted by anyone else. |
| `admin` | Clint, Austin | Seeded from `ADMIN_EMAILS`. Every permission except managing super admins. Sees live employee locations. |
| `office_staff` | Office | Customers, estimates, invoices, scheduling, payroll prep, bookkeeping, emails, forms. |
| `estimator` | Estimators | Receive/create/update estimates, view jobs and customers, schedule site visits. |
| `crew_lead` | Crew managers | Everything an employee has + job logs, status updates, crew members, contact customer, post estimates. |
| `mechanic` | Shop | Employee features + equipment and maintenance. |
| `employee` | Field crew | Clock in/out, time sheets, schedule, crews, job logs (read), time off, pay stubs, raise requests. |
| `customer` | Everyone who signs up | Customer portal. Default role on sign-up. |

"Internal" = every role except `customer`. **All internal roles are actively location-tracked
while clocked in** (see Tracking).

Permission strings (returned on `/me`, used by clients to show/hide UI — the server enforces
them independently):

```
portal.use            jobs.view_own         estimates.request     invoices.view_own
payments.make         reviews.write         gallery.publish       messages.send
time.clock            time.view_own         timeoff.request       paystubs.view_own
schedule.view         crews.view            joblogs.view          raise.request
taxprefs.edit         contacts.view
joblogs.edit          jobs.status_update    jobs.view_assigned    jobs.edit
jobs.media_upload     customers.view        customers.contact     crews.manage
estimates.create      estimates.manage      calendar.view
maintenance.view      maintenance.manage
jobs.view_all         jobs.manage           invoices.manage       payroll.manage
time.view_all         time.approve          timeoff.approve       schedule.manage
calendar.manage       dispatch.manage       customers.manage      suppliers.manage
reviews.manage        gallery.manage        job_postings.manage   bookkeeping.manage
emails.manage         forms.print           raise.review          accounts.close
tracking.view_live    users.manage          roles.assign          roles.manage
```

Role → permissions mapping is defined server-side in `api/v1/permissions.js` and editable by
admins via `PUT /admin/roles/:key`.

## Data shapes

```jsonc
// User (returned by /me and auth endpoints)
{
  "id": 7, "email": "a@b.com", "firstName": "Ann", "lastName": "Lee",
  "phone": "740-555-0100", "avatarUrl": "https://…/uploads/…jpg",
  "address": { "line1": "", "line2": "", "city": "", "state": "OH", "zip": "" },
  "role": "crew_lead", "isInternal": true,
  "permissions": ["time.clock", "..."],
  "company": { "key": "neff", "name": "Neff Paving", "primaryColor": "#F5A400" },
  "notificationPrefs": { "push": true, "email": true, "sms": false },
  "publicProfile": false,
  "createdAt": "…"
}

// Job / Project
{
  "id": 12, "title": "Driveway reseal", "description": "…",
  "status": "scheduled",          // lead|estimating|scheduled|in_progress|on_hold|completed|cancelled
  "serviceAddress": { "line1": "…", "city": "Zanesville", "state": "OH", "zip": "43701" },
  "latitude": 39.94, "longitude": -82.01,
  "customer": { "id": 3, "name": "Jo Smith", "phone": "…", "email": "…" },
  "crew": { "id": 2, "name": "Crew A" } | null,
  "scheduledStart": "…", "scheduledEnd": "…", "completedAt": null,
  "estimateTotal": "4200.00", "progress": 40,
  "coverPhotoUrl": "…" | null, "createdAt": "…"
}

// StatusUpdate (timeline entry)
{ "id": 1, "jobId": 12, "status": "in_progress", "message": "Base layer down",
  "author": { "id": 7, "name": "Ann Lee", "role": "crew_lead" },
  "media": [Media], "visibleToCustomer": true, "createdAt": "…" }

// Media
{ "id": 4, "jobId": 12, "kind": "photo" | "video", "url": "…", "thumbnailUrl": "…",
  "caption": "…", "isPublic": false, "uploadedBy": { "id": 7, "name": "…" },
  "latitude": 39.9, "longitude": -82.0, "createdAt": "…" }

// JobLog (crew daily log)
{ "id": 1, "jobId": 12, "date": "2026-11-11", "notes": "…", "hours": "8.0",
  "materials": "12 tons 304", "weather": "Clear 54F", "author": {…}, "createdAt": "…" }

// Estimate
{ "id": 9, "customerId": 3, "jobId": 12 | null, "status": "requested",
  // requested|in_review|sent|accepted|declined|expired
  "serviceType": "Sealcoating", "description": "…", "serviceAddress": {…},
  "squareFeet": "1200", "lineItems": [{ "description": "…", "quantity": "1", "unitPrice": "100.00", "total": "100.00" }],
  "total": "4200.00", "validUntil": "2026-12-31", "notes": "…",
  "customerName": "Jo Smith", "estimator": { "id": 5, "name": "…" } | null,
  "media": [Media], "createdAt": "…" }

// Invoice
{ "id": 21, "number": "NP-2026-0021", "customerId": 3, "jobId": 12,
  "status": "draft|sent|paid|partial|overdue|void", "issuedAt": "…", "dueAt": "…",
  "lineItems": [...], "subtotal": "…", "tax": "…", "total": "…", "balance": "…" }

// Payment
{ "id": 2, "invoiceId": 21, "amount": "500.00", "method": "card|ach|check|cash",
  "status": "succeeded|pending|failed", "createdAt": "…" }

// TimeEntry
{ "id": 30, "userId": 7, "jobId": 12 | null, "clockIn": "…", "clockOut": null | "…",
  "hours": "7.50" | null, "status": "open|submitted|approved|rejected",
  "clockInLat": 39.9, "clockInLng": -82.0, "notes": "" }

// TimeOffRequest
{ "id": 3, "userId": 7, "userName": "…", "startDate": "2026-12-24", "endDate": "2026-12-26",
  "type": "vacation|sick|personal|unpaid", "reason": "…",
  "status": "pending|approved|denied", "reviewedBy": {…} | null, "createdAt": "…" }

// PayStub
{ "id": 1, "periodStart": "…", "periodEnd": "…", "payDate": "…", "hours": "80.00",
  "gross": "1800.00", "deductions": "320.00", "net": "1480.00", "pdfUrl": "…" | null }

// TaxPaymentPrefs
{ "filingStatus": "single|married|head", "allowances": 0, "extraWithholding": "0.00",
  "payMethod": "direct_deposit|check", "bankName": "…", "accountLast4": "1234",
  "routingLast4": "5678" }
// (Full account/routing numbers are write-only: send `accountNumber`/`routingNumber` on PUT;
// server stores only encrypted values and returns last-4.)

// Crew
{ "id": 2, "name": "Crew A", "lead": { "id": 7, "name": "…" },
  "members": [{ "id": 8, "name": "…", "role": "employee", "phone": "…" }], "color": "#FF7A00" }

// ScheduleEntry
{ "id": 5, "userId": 7, "crewId": 2, "jobId": 12, "jobTitle": "…",
  "start": "…", "end": "…", "notes": "…", "address": {…} }

// RaiseRequest
{ "id": 1, "userId": 7, "userName": "…", "kind": "raise|position_change",
  "currentRate": "22.00", "requestedRate": "25.00", "requestedPosition": "crew_lead" | null,
  "justification": "…", "status": "pending|approved|denied", "reviewNote": "…", "createdAt": "…" }

// Review
{ "id": 1, "jobId": 12, "customer": { "id": 3, "name": "Jo S." }, "rating": 5,
  "comment": "…", "isPublished": true, "response": "…" | null, "createdAt": "…" }

// GalleryItem (public showcase from customers who opted in)
{ "id": 1, "jobId": 12, "jobTitle": "…", "customerName": "Jo S.", "city": "Zanesville",
  "media": [Media], "review": Review | null, "createdAt": "…" }

// Message (customer ↔ company, employee ↔ owners)
{ "id": 1, "threadId": 4, "sender": { "id": 3, "name": "…", "role": "customer" },
  "body": "…", "createdAt": "…" }
// Thread
{ "id": 4, "subject": "…", "jobId": 12 | null, "participants": [...], "lastMessage": Message,
  "unreadCount": 1, "updatedAt": "…" }

// Notification
{ "id": 1, "type": "job_completed|status_update|estimate|invoice|message|timeoff|raise|schedule",
  "title": "…", "body": "…", "data": { "jobId": 12 }, "readAt": null, "createdAt": "…" }

// LiveLocation (admin tracking)
{ "userId": 7, "name": "Ann Lee", "role": "crew_lead", "avatarUrl": "…",
  "latitude": 39.94, "longitude": -82.01, "accuracy": 8.0, "speed": 0.0, "heading": 90.0,
  "batteryLevel": 0.82, "recordedAt": "…", "clockedInAt": "…",
  "currentJob": { "id": 12, "title": "…" } | null }
```

## Endpoints

### Auth
| Method | Path | Body | Returns |
| --- | --- | --- | --- |
| POST | `/auth/signup` | `{ email, password, firstName, lastName, phone? }` | `{ accessToken, refreshToken, user }` (role `customer`) |
| POST | `/auth/login` | `{ email, password }` | `{ accessToken, refreshToken, user }` |
| POST | `/auth/google` | `{ idToken }` (Google ID token from the native SDK) | `{ accessToken, refreshToken, user }` — creates a customer on first sign-in |
| POST | `/auth/refresh` | `{ refreshToken }` | `{ accessToken, refreshToken }` |
| POST | `/auth/logout` | `{ refreshToken }` | `{ ok: true }` |
| POST | `/auth/forgot-password` | `{ email }` | `{ ok: true }` (always) |
| POST | `/auth/reset-password` | `{ token, newPassword }` | `{ ok: true }` (token comes from the emailed link) |
| POST | `/auth/device` | `{ token, platform: "ios"\|"android" }` | registers push token |

### Me / Profile (every signed-in user)
| Method | Path | Notes |
| --- | --- | --- |
| GET | `/me` | User |
| PUT | `/me` | `{ firstName, lastName, phone, address, notificationPrefs, publicProfile }` |
| POST | `/me/avatar` | multipart `file` → User |
| PUT | `/me/password` | `{ currentPassword, newPassword }` |

### Customer portal (`portal.use`)
| Method | Path | Notes |
| --- | --- | --- |
| GET | `/portal/jobs` | my jobs (job history) |
| GET | `/portal/jobs/:id` | Job |
| GET | `/portal/jobs/:id/timeline` | `[StatusUpdate]` visible to customer, newest first |
| GET | `/portal/jobs/:id/media` | `[Media]` |
| POST | `/portal/jobs/:id/media` | customer can add photos too |
| POST | `/portal/jobs/:id/share` | `{ share: true\|false }` publish job photos to public gallery |
| POST | `/portal/jobs/:id/review` | `{ rating 1-5, comment }` → Review |
| GET | `/portal/estimates` | `[Estimate]` |
| POST | `/portal/estimates` | `{ serviceType, description, serviceAddress, squareFeet?, preferredDate? }` → Estimate (`requested`) |
| POST | `/portal/estimates/:id/photos` | multipart `file` |
| POST | `/portal/estimates/:id/accept` / `/decline` | |
| GET | `/portal/invoices` | `[Invoice]` |
| GET | `/portal/payments` | `[Payment]` |
| POST | `/portal/invoices/:id/pay` | `{ amount }` → `{ checkoutUrl }` (Stripe Checkout when `STRIPE_SECRET_KEY` set; otherwise records a `pending` payment and returns `checkoutUrl: null`) |

### Public (any signed-in user)
| GET | `/gallery` | `[GalleryItem]` shared by other customers |
| GET | `/reviews` | published `[Review]` |
| GET | `/company` | `{ key, name, phone, email, address, primaryColor, website }` (no auth needed) |

### Messages & notifications (everyone)
| Method | Path | Notes |
| --- | --- | --- |
| GET | `/threads` | `[Thread]` |
| POST | `/threads` | `{ subject, body, jobId?, toRole?: "admin"\|"office_staff", toUserId? }` → Thread. Customers default to office; employees can address `admin` ("communicate with owners"). |
| GET | `/threads/:id/messages` | `[Message]` |
| POST | `/threads/:id/messages` | `{ body }` |
| GET | `/notifications` | `[Notification]` |
| POST | `/notifications/:id/read` · `/notifications/read-all` | |

### Time & tracking (`time.clock`)
| Method | Path | Notes |
| --- | --- | --- |
| GET | `/time/status` | `{ clockedIn: bool, entry: TimeEntry\|null, trackingRequired: true, pingIntervalSeconds: 60 }` |
| POST | `/time/clock-in` | `{ latitude, longitude, jobId?, trackingConsent: true }` — **400 unless `trackingConsent` is true for internal roles** |
| POST | `/time/clock-out` | `{ latitude, longitude, notes? }` → TimeEntry |
| POST | `/time/locations` | `{ points: [{ latitude, longitude, accuracy, speed, heading, batteryLevel, recordedAt }] }` — batch; **409 `not_clocked_in`** when no open entry (client must stop tracking) |
| GET | `/time/entries?from=&to=` | my time sheet |
| POST | `/time/entries/:id/submit` | submit for approval |

### Employee self-service
| Method | Path | Perm |
| --- | --- | --- |
| GET | `/schedule?from=&to=` | `schedule.view` → `[ScheduleEntry]` (mine) |
| GET | `/crews` | `crews.view` → my crews (all crews for office/admin) |
| PUT | `/crews/:id/members` | `crews.manage` `{ memberIds: [] }` — crew lead edits members of a crew they lead |
| GET | `/timeoff` · POST `/timeoff` `{ startDate, endDate, type, reason }` | `timeoff.request` |
| GET | `/paystubs` | `paystubs.view_own` |
| GET/PUT | `/tax-prefs` | `taxprefs.edit` |
| GET | `/raise-requests` · POST `/raise-requests` `{ kind, requestedRate?, requestedPosition?, justification }` | `raise.request` |
| GET | `/contacts` | `contacts.view` → internal directory `[{ id, name, role, phone, email }]` |

### Field work (crew leads, estimators, office, admins)
| Method | Path | Perm |
| --- | --- | --- |
| GET | `/jobs?status=&mine=1` | `jobs.view_assigned` (assigned to my crew) or `jobs.view_all` |
| GET | `/jobs/:id` | same; includes `customer` contact fields |
| POST | `/jobs` | `jobs.manage` `{ title, description, customerId, serviceAddress, latitude?, longitude?, crewId?, scheduledStart?, scheduledEnd?, estimateTotal? }` |
| PUT | `/jobs/:id` | `jobs.edit` (any Job fields) |
| POST | `/jobs/:id/status` | `jobs.status_update` `{ status, message, visibleToCustomer }` → StatusUpdate. **Setting `completed` notifies the customer and all admins/super admins.** |
| GET | `/jobs/:id/timeline` | all updates |
| GET/POST | `/jobs/:id/media` | `jobs.media_upload` multipart `file`, `caption`, `latitude`, `longitude`, `statusUpdateId?` |
| GET/POST | `/jobs/:id/logs` | `joblogs.view` / `joblogs.edit` `{ date, notes, hours, materials, weather }` |
| GET | `/customers?q=` | `customers.view` |
| GET | `/customers/:id` | `{ id, name, email, phone, address, closed, jobs: [Job], estimates: [Estimate], invoices: [Invoice] }` (list rows omit the arrays and add `jobCount`) |
| GET | `/estimates?status=` | `estimates.create` |
| POST | `/estimates` | `estimates.create` (for a customer) |
| PUT | `/estimates/:id` | `estimates.manage` or assigned estimator; `{ lineItems, total, validUntil, notes, status }` |
| POST | `/estimates/:id/send` | marks `sent`, notifies customer |
| GET | `/calendar?from=&to=` | `calendar.view` → `[ScheduleEntry]` all |

### Admin (`users.manage` etc.)
| Method | Path | Perm |
| --- | --- | --- |
| GET | `/admin/users?q=&role=` | `users.manage` → `[{ id, email, name, firstName, lastName, phone, avatarUrl, role, isActive, closed, payRate, lastLoginAt }]` |
| PUT | `/admin/users/:id/role` | `roles.assign` `{ role, payRate? }` — elevate customer → employee etc. Only `super_admin` may grant/revoke `admin` or touch a `super_admin`. |
| PUT | `/admin/users/:id/active` | `users.manage` `{ active }` |
| PUT | `/admin/users/:id/pay-rate` | `payroll.manage` `{ payRate }` |
| GET | `/admin/permissions` | `roles.manage` → `["portal.use", ...]` every permission string |
| GET | `/admin/roles` | `roles.manage` → `[{ key, name, permissions: [] }]` |
| PUT | `/admin/roles/:key` | `roles.manage` `{ permissions: [] }` (`super_admin` row is immutable) |
| GET | `/admin/tracking/live` | `tracking.view_live` → `[LiveLocation]` for everyone currently clocked in |
| GET | `/admin/tracking/:userId/trail?date=` | `tracking.view_live` → `[{ latitude, longitude, recordedAt }]` (only points recorded while clocked in) |
| GET | `/admin/time?from=&to=&status=` | `time.view_all` |
| POST | `/admin/time/:id/approve` · `/reject` | `time.approve` |
| GET | `/admin/timeoff?status=` · POST `/admin/timeoff/:id/approve` · `/deny` | `timeoff.approve` |
| GET | `/admin/raise-requests` · POST `/admin/raise-requests/:id/approve` · `/deny` `{ note }` | `raise.review` |
| POST | `/admin/schedule` · PUT/DELETE `/admin/schedule/:id` | `schedule.manage` |
| POST | `/admin/dispatch` | `dispatch.manage` `{ jobId, crewId, start, end, notes }` → creates schedule entries for every crew member + notifies |
| GET/POST/PUT | `/admin/crews`, `/admin/crews/:id` `{ name, leadId, memberIds, color }` | `crews.manage` |
| GET/POST/PUT | `/admin/invoices`, `/admin/invoices/:id` (GET adds `payments`), POST `/admin/invoices/:id/send` | `invoices.manage` — POST `{ customerId, jobId?, lineItems, tax?, dueAt? }`; PUT `{ lineItems?, tax?, dueAt?, status?: "void" }` |
| POST | `/admin/payments` `{ invoiceId, amount, method }` | `invoices.manage` (record check/cash) |
| GET/POST | `/admin/payroll/runs` `{ periodStart, periodEnd, payDate? }` → generates PayStubs from approved time (`{ id, periodStart, periodEnd, stubCount, gross, net, paystubs? }`) | `payroll.manage` |
| GET/POST/PUT/DELETE | `/admin/suppliers[/:id]` | `suppliers.manage` `{ name, contactName, phone, email, materials, notes }` |
| GET/POST/PUT | `/admin/equipment[/:id]` `{ name, kind, identifier, status: active\|in_shop\|retired, notes }` → `{ ..., lastServiceAt, nextDueAt, maintenance: [] }` · POST `/admin/equipment/:id/maintenance` `{ description, cost, performedAt, nextDueAt }` | `maintenance.view` / `maintenance.manage` |
| GET/POST/PUT/DELETE | `/admin/job-postings[/:id]` `{ title, description, payRange, isOpen }` | `job_postings.manage` |
| DELETE | `/admin/crews/:id` | `crews.manage` |
| GET | `/admin/reviews` · PUT `/admin/reviews/:id` `{ isPublished, response }` | `reviews.manage` |
| PUT | `/admin/media/:id` `{ isPublic, caption }` · DELETE | `gallery.manage` |
| POST | `/admin/accounts/:customerId/close` | `accounts.close` `{ reason?, force? }` — 409 if unpaid invoices unless `force: true` |
| GET | `/admin/dashboard` (`users.manage` or `invoices.manage`) | `{ activeJobs, clockedIn, pendingEstimates, pendingTimeOff, overdueInvoices, revenueMtd }` |

## Location tracking rules (both clients must follow)

1. Tracking starts **only** after a successful `POST /time/clock-in` and stops immediately on
   `clock-out`, sign-out, or any `409 not_clocked_in` from `/time/locations`.
2. Before the first clock-in the app shows a plain-language disclosure ("While you are clocked
   in, Neff Paving owners can see your location. Tracking stops when you clock out.") and sends
   `trackingConsent: true`.
3. Send batched points every `pingIntervalSeconds` (default 60 s) or every 50 m moved, whichever
   comes first; queue points offline and flush when the network returns.
4. iOS: `CLLocationManager` with `allowsBackgroundLocationUpdates = true`,
   `showsBackgroundLocationIndicator = true`, "Always" authorization requested after
   "When In Use". Android: a foreground service (`foregroundServiceType="location"`) with an
   ongoing "Clocked in — location shared" notification.
5. The server rejects points when the user is not clocked in, so nothing is ever recorded off
   the clock.

## Navigation

Each job carries `serviceAddress` + optional `latitude/longitude`. Clients render the job on a
map and hand off turn-by-turn navigation to Apple Maps / Google Maps
(`maps://?daddr=` on iOS, `google.navigation:q=` on Android, with web fallback).

## Media capture

Photos and videos are captured in-app and uploaded to `POST /jobs/:id/media` for the user's
**active job** (the `jobId` on the open TimeEntry, else the job they're viewing). Uploads carry
the device location and are queued for retry when offline.
