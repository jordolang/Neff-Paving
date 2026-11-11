/// Permission strings from the API contract. The server enforces them; the app
/// only uses them to decide what to show.
abstract final class Perm {
  static const portalUse = 'portal.use';
  static const jobsViewOwn = 'jobs.view_own';
  static const estimatesRequest = 'estimates.request';
  static const invoicesViewOwn = 'invoices.view_own';
  static const paymentsMake = 'payments.make';
  static const reviewsWrite = 'reviews.write';
  static const galleryPublish = 'gallery.publish';
  static const messagesSend = 'messages.send';

  static const timeClock = 'time.clock';
  static const timeViewOwn = 'time.view_own';
  static const timeoffRequest = 'timeoff.request';
  static const paystubsViewOwn = 'paystubs.view_own';
  static const scheduleView = 'schedule.view';
  static const crewsView = 'crews.view';
  static const joblogsView = 'joblogs.view';
  static const raiseRequest = 'raise.request';
  static const taxprefsEdit = 'taxprefs.edit';
  static const contactsView = 'contacts.view';

  static const joblogsEdit = 'joblogs.edit';
  static const jobsStatusUpdate = 'jobs.status_update';
  static const jobsViewAssigned = 'jobs.view_assigned';
  static const jobsEdit = 'jobs.edit';
  static const jobsMediaUpload = 'jobs.media_upload';
  static const customersView = 'customers.view';
  static const customersContact = 'customers.contact';
  static const crewsManage = 'crews.manage';
  static const estimatesCreate = 'estimates.create';
  static const estimatesManage = 'estimates.manage';
  static const calendarView = 'calendar.view';
  static const maintenanceView = 'maintenance.view';
  static const maintenanceManage = 'maintenance.manage';

  static const jobsViewAll = 'jobs.view_all';
  static const jobsManage = 'jobs.manage';
  static const invoicesManage = 'invoices.manage';
  static const payrollManage = 'payroll.manage';
  static const timeViewAll = 'time.view_all';
  static const timeApprove = 'time.approve';
  static const timeoffApprove = 'timeoff.approve';
  static const scheduleManage = 'schedule.manage';
  static const calendarManage = 'calendar.manage';
  static const dispatchManage = 'dispatch.manage';
  static const customersManage = 'customers.manage';
  static const suppliersManage = 'suppliers.manage';
  static const reviewsManage = 'reviews.manage';
  static const galleryManage = 'gallery.manage';
  static const jobPostingsManage = 'job_postings.manage';
  static const bookkeepingManage = 'bookkeeping.manage';
  static const emailsManage = 'emails.manage';
  static const formsPrint = 'forms.print';
  static const raiseReview = 'raise.review';
  static const accountsClose = 'accounts.close';
  static const trackingViewLive = 'tracking.view_live';
  static const usersManage = 'users.manage';
  static const rolesAssign = 'roles.assign';
  static const rolesManage = 'roles.manage';

  /// Every permission, grouped for the role editor.
  static const all = <String>[
    portalUse, jobsViewOwn, estimatesRequest, invoicesViewOwn, paymentsMake,
    reviewsWrite, galleryPublish, messagesSend,
    timeClock, timeViewOwn, timeoffRequest, paystubsViewOwn, scheduleView,
    crewsView, joblogsView, raiseRequest, taxprefsEdit, contactsView,
    joblogsEdit, jobsStatusUpdate, jobsViewAssigned, jobsEdit, jobsMediaUpload,
    customersView, customersContact, crewsManage, estimatesCreate,
    estimatesManage, calendarView, maintenanceView, maintenanceManage,
    jobsViewAll, jobsManage, invoicesManage, payrollManage, timeViewAll,
    timeApprove, timeoffApprove, scheduleManage, calendarManage,
    dispatchManage, customersManage, suppliersManage, reviewsManage,
    galleryManage, jobPostingsManage, bookkeepingManage, emailsManage,
    formsPrint, raiseReview, accountsClose, trackingViewLive, usersManage,
    rolesAssign, rolesManage,
  ];
}

/// Roles, highest authority first.
enum Role {
  superAdmin('super_admin', 'Super Admin'),
  admin('admin', 'Admin'),
  officeStaff('office_staff', 'Office Staff'),
  estimator('estimator', 'Estimator'),
  crewLead('crew_lead', 'Crew Lead'),
  mechanic('mechanic', 'Mechanic'),
  employee('employee', 'Employee'),
  customer('customer', 'Customer');

  const Role(this.key, this.label);

  final String key;
  final String label;

  bool get isInternal => this != Role.customer;

  /// Office/admin roles use the `/admin/*` management endpoints; crew leads
  /// use the narrower self-service ones (e.g. `PUT /crews/:id/members`).
  bool get isOfficeOrAdmin => this == Role.superAdmin || this == Role.admin || this == Role.officeStaff;

  static Role fromKey(String? key) => Role.values.firstWhere(
        (r) => r.key == key,
        orElse: () => Role.customer,
      );
}

/// Mirrors the server rule for `PUT /admin/users/:id/role`:
/// the actor needs `roles.assign`, and only a super admin may grant or revoke
/// `admin`, or change anything about a `super_admin`.
bool canAssignRole({
  required Role actor,
  required Set<String> actorPermissions,
  required Role targetCurrent,
  required Role newRole,
}) {
  if (!actorPermissions.contains(Perm.rolesAssign)) return false;
  if (targetCurrent == newRole) return false;
  final touchesPrivileged = targetCurrent == Role.admin ||
      newRole == Role.admin ||
      targetCurrent == Role.superAdmin ||
      newRole == Role.superAdmin;
  if (touchesPrivileged && actor != Role.superAdmin) return false;
  // Nobody demotes a super admin from inside the app.
  if (targetCurrent == Role.superAdmin) return false;
  return true;
}

/// Roles an actor may pick for a target in the role picker.
List<Role> assignableRoles({
  required Role actor,
  required Set<String> actorPermissions,
  required Role targetCurrent,
}) =>
    Role.values
        .where((r) => canAssignRole(
              actor: actor,
              actorPermissions: actorPermissions,
              targetCurrent: targetCurrent,
              newRole: r,
            ))
        .toList();
