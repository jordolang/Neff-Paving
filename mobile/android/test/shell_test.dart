import 'package:flutter_test/flutter_test.dart';
import 'package:neff_service/core/models.dart';
import 'package:neff_service/core/permissions.dart';
import 'package:neff_service/ui/shell.dart';

User userWith(String role, List<String> perms) => User.fromJson({
      'id': 1,
      'email': 'u@x.com',
      'firstName': 'U',
      'lastName': 'X',
      'role': role,
      'permissions': perms,
    });

void main() {
  test('customers land on Profile and see portal tabs, not field tools', () {
    final u = userWith('customer', [Perm.portalUse, Perm.jobsViewOwn, Perm.estimatesRequest, Perm.messagesSend]);
    final tabs = primaryTabs(u).map((f) => f.key).toList();
    expect(tabs.first, 'profile');
    expect(tabs, containsAll(['myJobs', 'myEstimates', 'messages']));
    final keys = features.where((f) => f.availableTo(u)).map((f) => f.key);
    expect(keys, isNot(contains('clock')));
    expect(keys, isNot(contains('liveMap')));
  });

  test('crew sees Clock and Jobs; admins see Dashboard and Live Map', () {
    final crew = userWith('crew_lead', [Perm.timeClock, Perm.jobsViewAssigned, Perm.scheduleView]);
    expect(primaryTabs(crew).map((f) => f.key), ['profile', 'clock', 'jobs', 'schedule']);

    final admin = userWith('admin', [Perm.usersManage, Perm.trackingViewLive, Perm.timeClock, Perm.jobsViewAll]);
    expect(primaryTabs(admin).map((f) => f.key), ['profile', 'dashboard', 'liveMap', 'clock']);
  });

  test('portal features are hidden from internal users even with portal perms', () {
    final office = userWith('office_staff', [Perm.portalUse, Perm.jobsViewOwn, Perm.jobsViewAll]);
    final keys = features.where((f) => f.availableTo(office)).map((f) => f.key);
    expect(keys, isNot(contains('myJobs')));
    expect(keys, contains('jobs'));
  });

  test('feature keys are unique', () {
    final keys = features.map((f) => f.key).toList();
    expect(keys.toSet().length, keys.length);
  });
}
