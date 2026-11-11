# Neff Service + Support — mobile apps

Native apps for **Neff Paving**, **Muskingum Materials** and **Austin Trucking**, built from
the handwritten spec: one code base per platform, three branded builds each, one shared API.

| Piece | Tech | Location |
| --- | --- | --- |
| iOS apps | Swift / SwiftUI (iOS 17+), XcodeGen project with one target per company | [`ios/`](ios/README.md) |
| Android apps | Flutter (Material 3), one product flavor per company | [`android/`](android/README.md) |
| Backend | Express + PostgreSQL, mounted at `/api/v1` of the existing `api/` server | [`../api/`](../api/README.md) |
| Contract | Every endpoint, payload and rule both apps follow | [`API_CONTRACT.md`](API_CONTRACT.md) |

## Two sides, one app

Everyone installs the same app and signs in (email + password, sign up, or Google). What they
see depends on their role in that company:

- **Customer service portal + profile** (every new account): profile (name, address, contact,
  photo, notification preferences), job history, project timeline and status updates, job
  photos, estimate requests with photos, accepting/declining estimates, invoices and payments,
  messages with the office, publishing job photos to the public gallery, browsing other
  customers' shared projects, and reviews.
- **Employee access** (after an admin elevates the account): clock in/out, time sheets,
  work schedule, crews, job logs, contacts, time off, pay stubs, tax and payment preferences,
  raise or position-change requests, updating info, and messaging the owners.
- **Crew leads / estimators / office**: job details and editing, customer data and contact,
  status updates, job logs, crew members, estimates, calendars, photos/videos that attach to
  the active job, and a navigation map to the service address.
- **Admins (Clint, Austin) and the super admin (owner)**: roles and permissions, live map of
  every clocked-in employee, estimates, jobs, payroll, invoices, media, job postings, reviews,
  calendars, dispatching crews, approvals, customers, suppliers, equipment maintenance,
  account close-out.

## Roles

`super_admin` › `admin` › `office_staff` › `estimator` › `crew_lead` › `mechanic` › `employee` ›
`customer`. The super admin is set by `SUPER_ADMIN_EMAIL` on the server and cannot be demoted
by anyone else; only the super admin can grant or remove admin access. Admins can elevate any
customer account to an employee role and can edit what each role is allowed to do.

## Location tracking

All internal roles are tracked **while clocked in, and only then**. Before the first clock-in
the app explains that the owners can see their location until they clock out, and the server
refuses to record a point outside an open shift. Clint and Austin see everyone on the clock on
the admin live map, with each person's trail for the day.

## Getting started

1. Start the API (`cd api && cp .env.example .env`, fill it in, `npm install && npm start`),
   then run `npm run seed:admins` once with `SUPER_ADMIN_EMAIL` and `ADMIN_EMAILS` set.
2. iOS: see [`ios/README.md`](ios/README.md). Android: see [`android/README.md`](android/README.md).
3. Point the apps at the API (`API_BASE_URL`) and add the Google OAuth client IDs on both sides.
