import 'package:flutter_test/flutter_test.dart';
import 'package:neff_service/core/models.dart';
import 'package:neff_service/core/permissions.dart';

void main() {
  const assign = {Perm.rolesAssign};

  group('canAssignRole', () {
    test('admin can elevate a customer to employee', () {
      expect(
        canAssignRole(actor: Role.admin, actorPermissions: assign, targetCurrent: Role.customer, newRole: Role.employee),
        isTrue,
      );
    });

    test('only super admin can grant or revoke admin', () {
      expect(canAssignRole(actor: Role.admin, actorPermissions: assign, targetCurrent: Role.employee, newRole: Role.admin), isFalse);
      expect(canAssignRole(actor: Role.admin, actorPermissions: assign, targetCurrent: Role.admin, newRole: Role.employee), isFalse);
      expect(
        canAssignRole(actor: Role.superAdmin, actorPermissions: assign, targetCurrent: Role.employee, newRole: Role.admin),
        isTrue,
      );
      expect(
        canAssignRole(actor: Role.superAdmin, actorPermissions: assign, targetCurrent: Role.admin, newRole: Role.crewLead),
        isTrue,
      );
    });

    test('nobody demotes a super admin and nobody else creates one', () {
      expect(
        canAssignRole(actor: Role.superAdmin, actorPermissions: assign, targetCurrent: Role.superAdmin, newRole: Role.admin),
        isFalse,
      );
      expect(canAssignRole(actor: Role.admin, actorPermissions: assign, targetCurrent: Role.employee, newRole: Role.superAdmin),
          isFalse);
    });

    test('requires roles.assign and an actual change', () {
      expect(canAssignRole(actor: Role.admin, actorPermissions: const {}, targetCurrent: Role.customer, newRole: Role.employee),
          isFalse);
      expect(canAssignRole(actor: Role.admin, actorPermissions: assign, targetCurrent: Role.employee, newRole: Role.employee),
          isFalse);
    });

    test('assignableRoles for an admin excludes privileged roles', () {
      final roles = assignableRoles(actor: Role.admin, actorPermissions: assign, targetCurrent: Role.customer);
      expect(roles, isNot(contains(Role.admin)));
      expect(roles, isNot(contains(Role.superAdmin)));
      expect(roles, containsAll([Role.officeStaff, Role.estimator, Role.crewLead, Role.mechanic, Role.employee]));
    });
  });

  group('roles', () {
    test('fromKey and internal flag', () {
      expect(Role.fromKey('crew_lead'), Role.crewLead);
      expect(Role.fromKey('nonsense'), Role.customer);
      expect(Role.customer.isInternal, isFalse);
      expect(Role.mechanic.isInternal, isTrue);
      expect(Role.officeStaff.isOfficeOrAdmin, isTrue);
      expect(Role.crewLead.isOfficeOrAdmin, isFalse);
    });

    test('User.can gates on permission strings', () {
      final u = User.fromJson({
        'id': 1,
        'email': 'x@y.z',
        'firstName': 'A',
        'lastName': 'B',
        'role': 'employee',
        'permissions': [Perm.timeClock, Perm.scheduleView],
      });
      expect(u.can(Perm.timeClock), isTrue);
      expect(u.can(Perm.trackingViewLive), isFalse);
      expect(u.canAny([Perm.usersManage, Perm.scheduleView]), isTrue);
      expect(u.isInternal, isTrue);
    });

    test('Perm.all has no duplicates', () {
      expect(Perm.all.toSet().length, Perm.all.length);
    });
  });
}
