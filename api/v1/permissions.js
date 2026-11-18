'use strict';

/**
 * Role → permission defaults for the mobile platform. Synced into app.roles on startup
 * (`syncRoles`) only when a role row does not exist yet, so admin edits made through
 * PUT /admin/roles/:key survive restarts. super_admin is always forced to ALL.
 */

const CUSTOMER = [
  'portal.use', 'jobs.view_own', 'estimates.request', 'invoices.view_own', 'payments.make',
  'reviews.write', 'gallery.publish', 'messages.send',
];

const EMPLOYEE = [
  'messages.send', 'time.clock', 'time.view_own', 'timeoff.request', 'paystubs.view_own',
  'schedule.view', 'crews.view', 'joblogs.view', 'raise.request', 'taxprefs.edit',
  'contacts.view', 'jobs.view_assigned', 'jobs.media_upload',
];

const CREW_LEAD = [
  ...EMPLOYEE, 'joblogs.edit', 'jobs.status_update', 'jobs.edit', 'customers.view',
  'customers.contact', 'crews.manage', 'estimates.create', 'calendar.view',
];

const MECHANIC = [...EMPLOYEE, 'maintenance.view', 'maintenance.manage'];

const ESTIMATOR = [
  ...EMPLOYEE, 'estimates.create', 'estimates.manage', 'customers.view', 'customers.contact',
  'calendar.view', 'jobs.view_all',
];

const OFFICE_STAFF = [
  ...EMPLOYEE, 'customers.view', 'customers.contact', 'customers.manage', 'estimates.create',
  'estimates.manage', 'calendar.view', 'calendar.manage', 'schedule.manage', 'jobs.view_all',
  'jobs.manage', 'jobs.edit', 'jobs.status_update', 'invoices.manage', 'payroll.manage',
  'time.view_all', 'bookkeeping.manage', 'emails.manage', 'forms.print', 'suppliers.manage',
  'joblogs.edit', 'maintenance.view', 'timeoff.approve',
];

const ALL = [
  ...new Set([
    ...CUSTOMER, ...OFFICE_STAFF, ...CREW_LEAD, ...MECHANIC, ...ESTIMATOR,
    'time.approve', 'dispatch.manage', 'reviews.manage', 'gallery.manage',
    'job_postings.manage', 'raise.review', 'accounts.close', 'tracking.view_live',
    'users.manage', 'roles.assign', 'roles.manage',
  ]),
].sort();

const ROLES = [
  { key: 'super_admin', name: 'Super Admin', rank: 100, isInternal: true, permissions: ALL },
  { key: 'admin', name: 'Admin', rank: 90, isInternal: true, permissions: ALL },
  { key: 'office_staff', name: 'Office Staff', rank: 60, isInternal: true, permissions: OFFICE_STAFF },
  { key: 'estimator', name: 'Estimator', rank: 50, isInternal: true, permissions: ESTIMATOR },
  { key: 'crew_lead', name: 'Crew Lead', rank: 40, isInternal: true, permissions: CREW_LEAD },
  { key: 'mechanic', name: 'Mechanic', rank: 30, isInternal: true, permissions: MECHANIC },
  { key: 'employee', name: 'Employee', rank: 20, isInternal: true, permissions: EMPLOYEE },
  { key: 'customer', name: 'Customer', rank: 0, isInternal: false, permissions: CUSTOMER },
].map((r) => ({ ...r, permissions: [...new Set(r.permissions)].sort() }));

const ROLE_KEYS = ROLES.map((r) => r.key);
const PRIVILEGED_ROLES = ['super_admin', 'admin']; // only a super admin may grant/revoke these

async function syncRoles(db) {
  for (const r of ROLES) {
    await db.query(
      `INSERT INTO app.roles (key, name, rank, is_internal, permissions)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (key) DO UPDATE SET name = EXCLUDED.name, rank = EXCLUDED.rank,
         is_internal = EXCLUDED.is_internal,
         permissions = CASE WHEN app.roles.key = 'super_admin' THEN EXCLUDED.permissions
                            ELSE app.roles.permissions END`,
      [r.key, r.name, r.rank, r.isInternal, r.permissions],
    );
  }
}

module.exports = { ROLES, ROLE_KEYS, ALL_PERMISSIONS: ALL, PRIVILEGED_ROLES, syncRoles };
