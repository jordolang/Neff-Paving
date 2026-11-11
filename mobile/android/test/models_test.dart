import 'package:flutter_test/flutter_test.dart';
import 'package:neff_service/core/models.dart';
import 'package:neff_service/core/permissions.dart';

void main() {
  test('User parses the contract shape', () {
    final u = User.fromJson({
      'id': 7,
      'email': 'a@b.com',
      'firstName': 'Ann',
      'lastName': 'Lee',
      'phone': '740-555-0100',
      'avatarUrl': '/uploads/a.jpg',
      'address': {'line1': '12 Main St', 'line2': '', 'city': 'Zanesville', 'state': 'OH', 'zip': '43701'},
      'role': 'crew_lead',
      'isInternal': true,
      'permissions': ['time.clock', 'jobs.status_update'],
      'company': {'key': 'neff', 'name': 'Neff Paving', 'primaryColor': '#F5A400'},
      'notificationPrefs': {'push': true, 'email': false, 'sms': true},
      'publicProfile': false,
      'createdAt': '2026-11-11T17:58:00Z',
    });
    expect(u.role, Role.crewLead);
    expect(u.fullName, 'Ann Lee');
    expect(u.initials, 'AL');
    expect(u.address.singleLine, '12 Main St, Zanesville, OH 43701');
    expect(u.notificationPrefs.email, isFalse);
    expect(u.company!.key, 'neff');
    expect(u.can('jobs.status_update'), isTrue);
  });

  test('Job parses statuses, nested refs and money', () {
    final j = Job.fromJson({
      'id': 12,
      'title': 'Driveway reseal',
      'status': 'in_progress',
      'serviceAddress': {'line1': '1 A St', 'city': 'Zanesville', 'state': 'OH', 'zip': '43701'},
      'latitude': 39.94,
      'longitude': -82.01,
      'customer': {'id': 3, 'name': 'Jo Smith', 'phone': '555', 'email': 'jo@x.com'},
      'crew': {'id': 2, 'name': 'Crew A'},
      'scheduledStart': '2026-11-12T12:00:00Z',
      'estimateTotal': '4200.00',
      'progress': 40,
      'sharedPublicly': true,
      'someFutureField': {'ignored': true},
    });
    expect(j.status, JobStatus.inProgress);
    expect(j.status.key, 'in_progress');
    expect(j.customer!.name, 'Jo Smith');
    expect(j.crew!.id, 2);
    expect(j.estimateTotal.toApi(), '4200.00');
    expect(j.hasCoordinates, isTrue);
    expect(j.isShared, isTrue);
  });

  test('crew is nullable', () {
    expect(Job.fromJson({'id': 1, 'title': 't', 'status': 'lead', 'crew': null}).crew, isNull);
  });

  test('Estimate line items compute or use server totals', () {
    final e = Estimate.fromJson({
      'id': 9,
      'status': 'sent',
      'lineItems': [
        {'description': 'Seal', 'quantity': '2', 'unitPrice': '100.00', 'total': '200.00'},
        {'description': 'Patch', 'quantity': '1.5', 'unitPrice': '10.00'},
      ],
      'total': '215.00',
      'preferredDate': '2026-12-01',
    });
    expect(e.awaitingCustomer, isTrue);
    expect(e.lineItems[0].total.toApi(), '200.00');
    expect(e.lineItems[1].total.toApi(), '15.00');
    expect(e.total.toApi(), '215.00');
    expect(e.preferredDate, '2026-12-01');
    expect(e.lineItems[1].toJson()['unitPrice'], '10.00');
  });

  test('Invoice payable rules', () {
    final inv = Invoice.fromJson({'id': 21, 'number': 'NP-2026-0021', 'status': 'sent', 'total': '500.00', 'balance': '250.00'});
    expect(inv.isPayable, isTrue);
    expect(Invoice.fromJson({'id': 1, 'number': 'x', 'status': 'void', 'balance': '9.00'}).isPayable, isFalse);
    expect(Invoice.fromJson({'id': 1, 'number': 'x', 'status': 'paid', 'balance': '0.00'}).isPayable, isFalse);
  });

  test('TimeStatus with open entry', () {
    final s = TimeStatus.fromJson({
      'clockedIn': true,
      'entry': {'id': 30, 'userId': 7, 'jobId': 12, 'clockIn': '2026-11-11T13:00:00Z', 'clockOut': null, 'hours': null, 'status': 'open'},
      'trackingRequired': true,
      'pingIntervalSeconds': 60,
    });
    expect(s.clockedIn, isTrue);
    expect(s.entry!.jobId, 12);
    expect(s.entry!.clockOut, isNull);
    expect(s.pingIntervalSeconds, 60);
  });

  test('LiveLocation maps currentJob title', () {
    final l = LiveLocation.fromJson({
      'userId': 7,
      'name': 'Ann Lee',
      'role': 'crew_lead',
      'latitude': 39.94,
      'longitude': -82.01,
      'batteryLevel': 0.82,
      'recordedAt': '2026-11-11T17:00:00Z',
      'currentJob': {'id': 12, 'title': 'Driveway'},
    });
    expect(l.role, Role.crewLead);
    expect(l.currentJob!.name, 'Driveway');
    expect(l.batteryLevel, 0.82);
  });

  test('TaxPaymentPrefs only exposes last four', () {
    final t = TaxPaymentPrefs.fromJson({
      'filingStatus': 'married',
      'allowances': 2,
      'extraWithholding': '25.00',
      'payMethod': 'direct_deposit',
      'bankName': 'Park National',
      'accountLast4': '1234',
      'routingLast4': '5678',
    });
    expect(t.accountLast4, '1234');
    expect(t.extraWithholding.toApi(), '25.00');
  });

  test('admin rows, customers, equipment and payroll runs', () {
    final u = AdminUser.fromJson({
      'id': 4, 'email': 'e@x.com', 'firstName': 'Ed', 'lastName': 'Ray', 'role': 'employee',
      'isActive': false, 'closed': false, 'payRate': '22.50', 'lastLoginAt': null,
    });
    expect(u.name, 'Ed Ray');
    expect(u.isActive, isFalse);
    expect(u.payRate!.toApi(), '22.50');

    final c = CustomerRecord.fromJson({
      'id': 3, 'name': 'Jo Smith', 'email': 'jo@x.com', 'closed': false,
      'jobs': [{'id': 1, 'title': 'A', 'status': 'completed'}], 'estimates': [], 'invoices': [],
    });
    expect(c.jobs.single.status, JobStatus.completed);
    expect(c.jobCount, 1);
    expect(CustomerRecord.fromJson({'id': 3, 'name': 'Jo', 'jobCount': 4}).jobCount, 4);

    final eq = Equipment.fromJson({
      'id': 1, 'name': 'Paver', 'status': 'in_shop', 'nextDueAt': '2020-01-01T00:00:00Z',
      'maintenance': [{'id': 1, 'description': 'Oil', 'cost': '80.00', 'performedAt': '2026-10-01T00:00:00Z'}],
    });
    expect(eq.isDue, isTrue);
    expect(eq.maintenance.single.cost!.toApi(), '80.00');

    final run = PayrollRun.fromJson({'id': 1, 'periodStart': '2026-10-01', 'periodEnd': '2026-10-14', 'stubCount': 3,
        'gross': '5400.00', 'net': '4400.00'});
    expect(run.stubCount, 3);
    expect(run.net.toApi(), '4400.00');
  });

  test('Notifications expose jobId from data', () {
    final n = AppNotification.fromJson({
      'id': 1, 'type': 'job_completed', 'title': 'Done', 'body': '', 'data': {'jobId': 12}, 'readAt': null,
    });
    expect(n.jobId, 12);
    expect(n.isRead, isFalse);
  });

  test('lenient parsing never throws on wrong types', () {
    final j = Job.fromJson({'id': '5', 'title': null, 'status': 'weird', 'progress': '250', 'estimateTotal': 'n/a'});
    expect(j.id, 5);
    expect(j.title, '');
    expect(j.status, JobStatus.lead);
    expect(j.progress, 100);
    expect(j.estimateTotal.isZero, isTrue);
  });
}
