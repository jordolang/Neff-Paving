import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../core/models.dart';
import '../core/permissions.dart';
import '../core/session.dart';
import '../features/admin/admin_screens.dart';
import '../features/admin/live_map_screen.dart';
import '../features/community/community_screens.dart';
import '../features/employee/employee_screens.dart';
import '../features/jobs/jobs_screens.dart';
import '../features/messages/messages_screens.dart';
import '../features/portal/portal_screens.dart';
import '../features/profile/profile_screen.dart';
import '../features/time/time_screens.dart';
import 'widgets.dart';

/// One navigable area of the app, shown when the user holds any of [anyOf]
/// (empty = everyone).
class Feature {
  const Feature(this.key, this.title, this.icon, this.section, {this.anyOf = const [], this.customerOnly = false, required this.build});

  final String key, title, section;
  final IconData icon;
  final List<String> anyOf;
  final bool customerOnly;
  final Widget Function(BuildContext context, void Function(String key) open) build;

  bool availableTo(User u) {
    if (customerOnly && u.isInternal) return false;
    return anyOf.isEmpty || u.canAny(anyOf);
  }
}

void _openJob(BuildContext context, User u, int jobId) => pushPage(
      context,
      u.canAny([Perm.jobsViewAssigned, Perm.jobsViewAll]) ? FieldJobDetail(jobId: jobId) : PortalJobDetail(jobId: jobId),
    );

final List<Feature> features = [
  // Everyone
  Feature('profile', 'Profile', Icons.person, 'Me', build: (_, _) => const ProfileScreen()),
  Feature('notifications', 'Notifications', Icons.notifications, 'Me',
      build: (_, _) => Consumer(
            builder: (context, ref, _) => NotificationsScreen(
              onOpenJob: (ctx, id) => _openJob(ctx, ref.read(currentUserProvider)!, id),
            ),
          )),
  Feature('messages', 'Messages', Icons.chat_bubble, 'Me', anyOf: [Perm.messagesSend], build: (_, _) => const ThreadsScreen()),

  // Customer portal
  Feature('myJobs', 'My Projects', Icons.home_work, 'Portal', anyOf: [Perm.jobsViewOwn], customerOnly: true,
      build: (_, _) => const MyJobsScreen()),
  Feature('myEstimates', 'Estimates', Icons.request_quote, 'Portal', anyOf: [Perm.estimatesRequest], customerOnly: true,
      build: (_, _) => const MyEstimatesScreen()),
  Feature('billing', 'Billing', Icons.receipt_long, 'Portal', anyOf: [Perm.invoicesViewOwn], customerOnly: true,
      build: (_, _) => const BillingScreen()),
  Feature('gallery', 'Gallery', Icons.photo_library, 'Community', build: (_, _) => const GalleryScreen()),
  Feature('reviews', 'Reviews', Icons.star, 'Community', build: (_, _) => const ReviewsScreen()),

  // Employee
  Feature('clock', 'Clock', Icons.timer, 'Work', anyOf: [Perm.timeClock], build: (_, _) => const ClockScreen()),
  Feature('timesheet', 'Time Sheet', Icons.list_alt, 'Work', anyOf: [Perm.timeViewOwn], build: (_, _) => const TimesheetScreen()),
  Feature('schedule', 'My Schedule', Icons.event, 'Work', anyOf: [Perm.scheduleView], build: (_, _) => const ScheduleScreen()),
  Feature('crews', 'Crews', Icons.groups, 'Work', anyOf: [Perm.crewsView, Perm.crewsManage], build: (_, _) => const CrewsScreen()),
  Feature('contacts', 'Contacts', Icons.contacts, 'Work', anyOf: [Perm.contactsView], build: (_, _) => const ContactsScreen()),
  Feature('timeoff', 'Time Off', Icons.beach_access, 'Work', anyOf: [Perm.timeoffRequest], build: (_, _) => const TimeOffScreen()),
  Feature('paystubs', 'Pay Stubs', Icons.receipt, 'Work', anyOf: [Perm.paystubsViewOwn], build: (_, _) => const PayStubsScreen()),
  Feature('taxPrefs', 'Tax & Pay', Icons.account_balance, 'Work', anyOf: [Perm.taxprefsEdit], build: (_, _) => const TaxPrefsScreen()),
  Feature('raise', 'Raise / Position', Icons.trending_up, 'Work', anyOf: [Perm.raiseRequest],
      build: (_, _) => const RaiseRequestsScreen()),

  // Field
  Feature('jobs', 'Jobs', Icons.construction, 'Field', anyOf: [Perm.jobsViewAssigned, Perm.jobsViewAll],
      build: (_, _) => const FieldJobsScreen()),
  Feature('customers', 'Customers', Icons.people, 'Field', anyOf: [Perm.customersView], build: (_, _) => const CustomersScreen()),
  Feature('estimates', 'Estimates', Icons.request_quote, 'Field', anyOf: [Perm.estimatesCreate, Perm.estimatesManage],
      build: (_, _) => const FieldEstimatesScreen()),
  Feature('calendar', 'Calendar', Icons.calendar_month, 'Field', anyOf: [Perm.calendarView, Perm.scheduleManage, Perm.dispatchManage],
      build: (_, _) => Consumer(
            builder: (context, ref, _) => ref.read(currentUserProvider)!.canAny([Perm.scheduleManage, Perm.dispatchManage])
                ? const DispatchScheduleScreen()
                : const ScheduleScreen(endpoint: '/calendar', days: 21),
          )),
  Feature('equipment', 'Equipment', Icons.agriculture, 'Field', anyOf: [Perm.maintenanceView, Perm.maintenanceManage],
      build: (_, _) => const EquipmentScreen()),

  // Admin
  Feature('dashboard', 'Dashboard', Icons.dashboard, 'Admin', anyOf: [Perm.usersManage, Perm.timeViewAll, Perm.invoicesManage],
      build: (_, open) => AdminDashboardScreen(open: open)),
  Feature('liveMap', 'Live Map', Icons.map, 'Admin', anyOf: [Perm.trackingViewLive], build: (_, _) => const LiveMapScreen()),
  Feature('approvals', 'Approvals', Icons.fact_check, 'Admin',
      anyOf: [Perm.timeViewAll, Perm.timeApprove, Perm.timeoffApprove, Perm.raiseReview], build: (_, _) => const ApprovalsScreen()),
  Feature('users', 'Users & Roles', Icons.manage_accounts, 'Admin', anyOf: [Perm.usersManage, Perm.rolesAssign],
      build: (_, _) => const UsersScreen()),
  Feature('roles', 'Permissions', Icons.admin_panel_settings, 'Admin', anyOf: [Perm.rolesManage], build: (_, _) => const RolesScreen()),
  Feature('invoices', 'Invoices', Icons.receipt_long, 'Admin', anyOf: [Perm.invoicesManage],
      build: (_, _) => const InvoicesAdminScreen()),
  Feature('payroll', 'Payroll', Icons.account_balance_wallet, 'Admin', anyOf: [Perm.payrollManage],
      build: (_, _) => const PayrollScreen()),
  Feature('suppliers', 'Suppliers', Icons.inventory_2, 'Admin', anyOf: [Perm.suppliersManage], build: (_, _) => const SuppliersScreen()),
  Feature('jobPostings', 'Job Postings', Icons.work_outline, 'Admin', anyOf: [Perm.jobPostingsManage],
      build: (_, _) => const JobPostingsScreen()),
  Feature('reviewsAdmin', 'Manage Reviews', Icons.reviews, 'Admin', anyOf: [Perm.reviewsManage],
      build: (_, _) => const ReviewsModerationScreen()),
];

/// Picks up to four bottom-nav tabs for a user. Profile always comes first
/// (sign-in lands on Profile), then role-appropriate shortcuts.
List<Feature> primaryTabs(User u) {
  const preference = [
    'profile',
    'dashboard', 'liveMap', // owners
    'clock', 'jobs', 'schedule', // crew
    'myJobs', 'myEstimates', 'messages', // customers
    'estimates', 'calendar',
  ];
  final available = {for (final f in features) if (f.availableTo(u)) f.key: f};
  return preference.where(available.containsKey).take(4).map((k) => available[k]!).toList();
}

class HomeShell extends ConsumerWidget {
  const HomeShell({super.key, required this.featureKey});

  final String featureKey;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(currentUserProvider);
    if (user == null) return const SizedBox.shrink();
    final available = features.where((f) => f.availableTo(user)).toList();
    final current = available.firstWhere((f) => f.key == featureKey, orElse: () => available.first);
    final tabs = primaryTabs(user);
    final tabIndex = tabs.indexWhere((f) => f.key == current.key);
    void open(String key) => context.go('/home/$key');
    final company = ref.watch(companyConfigProvider);
    final tracking = ref.watch(locationTrackerProvider).isActive;
    final uploads = ref.watch(mediaUploaderProvider).queue.length;

    return Scaffold(
      appBar: AppBar(
        title: Text(current.title),
        actions: [
          if (tracking)
            const Tooltip(
              message: 'Clocked in — location shared',
              child: Padding(padding: EdgeInsets.symmetric(horizontal: 8), child: Icon(Icons.my_location, color: Colors.green)),
            ),
          if (uploads > 0)
            Tooltip(
              message: '$uploads uploads waiting for a connection',
              child: Badge(label: Text('$uploads'), child: const Icon(Icons.cloud_upload_outlined)),
            ),
          if (current.key != 'notifications')
            IconButton(tooltip: 'Notifications', icon: const Icon(Icons.notifications_outlined), onPressed: () => open('notifications')),
        ],
      ),
      drawer: NavigationDrawer(
        selectedIndex: available.indexOf(current),
        onDestinationSelected: (i) {
          Navigator.pop(context);
          open(available[i].key);
        },
        children: [
          DrawerHeader(
            child: Row(children: [
              UserAvatar(url: user.avatarUrl, initials: user.initials, radius: 28),
              const SizedBox(width: 12),
              Expanded(
                child: Column(mainAxisAlignment: MainAxisAlignment.center, crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(user.fullName, style: Theme.of(context).textTheme.titleMedium),
                  Text('${user.role.label} · ${company.name}', style: Theme.of(context).textTheme.bodySmall),
                ]),
              ),
            ]),
          ),
          ..._drawerItems(available),
        ],
      ),
      body: KeyedSubtree(key: ValueKey(current.key), child: current.build(context, open)),
      bottomNavigationBar: tabs.length < 2
          ? null
          : NavigationBar(
              selectedIndex: tabIndex < 0 ? 0 : tabIndex,
              indicatorColor: tabIndex < 0 ? Colors.transparent : null,
              onDestinationSelected: (i) => open(tabs[i].key),
              destinations: [for (final t in tabs) NavigationDestination(icon: Icon(t.icon), label: t.title)],
            ),
    );
  }

  /// NavigationDrawer children must be destinations in the same order as
  /// [available]; section titles are interleaved as plain widgets.
  List<Widget> _drawerItems(List<Feature> available) {
    final out = <Widget>[];
    String? section;
    for (final f in available) {
      if (f.section != section) {
        section = f.section;
        out.add(Padding(padding: const EdgeInsets.fromLTRB(28, 16, 16, 8), child: Text(section)));
      }
      out.add(NavigationDrawerDestination(icon: Icon(f.icon), label: Text(f.title)));
    }
    return out;
  }
}
