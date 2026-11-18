import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/api_client.dart';
import '../../core/json.dart';
import '../../core/models.dart';
import '../../core/money.dart';
import '../../core/permissions.dart';
import '../../core/session.dart';
import '../../ui/widgets.dart';
import '../community/community_screens.dart';
import '../employee/employee_screens.dart' show PayStubCard, RaiseTile;

// -------------------------------------------------------------- dashboard

class AdminDashboardScreen extends ConsumerWidget {
  const AdminDashboardScreen({super.key, required this.open});

  /// Switches the shell to a feature by key (e.g. 'liveMap').
  final void Function(String featureKey) open;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final api = ref.read(apiProvider);
    final user = ref.watch(currentUserProvider)!;
    return AsyncView<Dashboard>(
      load: () async => Dashboard.fromJson(asMap(await api.get('/admin/dashboard'))),
      builder: (context, d, _) => GridView.count(
        physics: const AlwaysScrollableScrollPhysics(),
        crossAxisCount: 2,
        childAspectRatio: 1.35,
        padding: const EdgeInsets.all(8),
        children: [
          StatTile(label: 'Clocked in now', value: '${d.clockedIn}', icon: Icons.sensors,
              onTap: user.can(Perm.trackingViewLive) ? () => open('liveMap') : null),
          StatTile(label: 'Active jobs', value: '${d.activeJobs}', icon: Icons.construction, onTap: () => open('jobs')),
          StatTile(label: 'Pending estimates', value: '${d.pendingEstimates}', icon: Icons.request_quote,
              onTap: user.can(Perm.estimatesCreate) ? () => open('estimates') : null),
          StatTile(label: 'Time-off requests', value: '${d.pendingTimeOff}', icon: Icons.beach_access,
              onTap: user.can(Perm.timeoffApprove) ? () => open('approvals') : null),
          StatTile(label: 'Overdue invoices', value: '${d.overdueInvoices}', icon: Icons.warning_amber,
              onTap: user.can(Perm.invoicesManage) ? () => open('invoices') : null),
          StatTile(label: 'Revenue this month', value: d.revenueMtd.format(), icon: Icons.attach_money),
        ],
      ),
    );
  }
}

// ------------------------------------------------------------------ users

class UsersScreen extends ConsumerStatefulWidget {
  const UsersScreen({super.key});

  @override
  ConsumerState<UsersScreen> createState() => _UsersScreenState();
}

class _UsersScreenState extends ConsumerState<UsersScreen> {
  final _reloader = Reloader();
  final _q = TextEditingController();
  String? _role;

  @override
  void dispose() {
    _q.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final api = ref.read(apiProvider);
    return Column(children: [
      Padding(
        padding: const EdgeInsets.fromLTRB(12, 8, 12, 0),
        child: Row(children: [
          Expanded(
            child: TextField(
              controller: _q,
              textInputAction: TextInputAction.search,
              decoration: const InputDecoration(prefixIcon: Icon(Icons.search), hintText: 'Name or email', isDense: true),
              onSubmitted: (_) => _reloader.reload(),
            ),
          ),
          const SizedBox(width: 8),
          DropdownButton<String?>(
            value: _role,
            hint: const Text('All roles'),
            items: [
              const DropdownMenuItem(value: null, child: Text('All roles')),
              for (final r in Role.values) DropdownMenuItem(value: r.key, child: Text(r.label)),
            ],
            onChanged: (v) {
              setState(() => _role = v);
              _reloader.reload();
            },
          ),
        ]),
      ),
      Expanded(
        child: AsyncList<AdminUser>(
          reloader: _reloader,
          load: () => api.listOf('/admin/users', AdminUser.fromJson, query: {'q': _q.text.trim(), 'role': _role}),
          empty: 'No users found.',
          emptyIcon: Icons.people_outline,
          itemBuilder: (context, u, reload) => ListTile(
            leading: UserAvatar(url: u.avatarUrl, initials: initialsOf(u.name)),
            title: Text(u.name, style: TextStyle(decoration: u.isActive ? null : TextDecoration.lineThrough)),
            subtitle: Text('${u.email}\n${u.role.label}${u.payRate != null ? ' · ${u.payRate!.format()}/h' : ''}'
                '${u.lastLoginAt != null ? ' · last seen ${fmtDate(u.lastLoginAt)}' : ''}'),
            isThreeLine: true,
            trailing: u.closed ? const StatusChip('closed') : (u.isActive ? null : const StatusChip('inactive')),
            onTap: () async {
              if (await _manage(u)) reload();
            },
          ),
        ),
      ),
    ]);
  }

  Future<bool> _manage(AdminUser u) async {
    final me = ref.read(currentUserProvider)!;
    final api = ref.read(apiProvider);
    final roles = assignableRoles(actor: me.role, actorPermissions: me.permissions, targetCurrent: u.role);
    final action = await showModalBottomSheet<String>(
      context: context,
      builder: (ctx) => SafeArea(
        child: Wrap(children: [
          ListTile(title: Text(u.name), subtitle: Text('${u.role.label} · ${u.email}')),
          if (roles.isNotEmpty)
            ListTile(leading: const Icon(Icons.admin_panel_settings), title: const Text('Change role'), onTap: () => Navigator.pop(ctx, 'role'))
          else if (me.can(Perm.rolesAssign))
            const ListTile(
              leading: Icon(Icons.lock_outline),
              title: Text('Role locked'),
              subtitle: Text('Only the super admin can change admin or super-admin accounts.'),
            ),
          if (me.can(Perm.payrollManage) && u.role.isInternal)
            ListTile(leading: const Icon(Icons.attach_money), title: const Text('Set pay rate'), onTap: () => Navigator.pop(ctx, 'pay')),
          if (me.can(Perm.usersManage) && u.role != Role.superAdmin && u.id != me.id)
            ListTile(
              leading: Icon(u.isActive ? Icons.block : Icons.check_circle_outline),
              title: Text(u.isActive ? 'Deactivate account' : 'Reactivate account'),
              onTap: () => Navigator.pop(ctx, 'active'),
            ),
        ]),
      ),
    );
    if (!mounted || action == null) return false;
    switch (action) {
      case 'role':
        return showFormSheet(
          context,
          title: 'Role for ${u.name}',
          submitLabel: 'Update role',
          fields: [
            FieldSpec('role', 'Role', kind: FieldKind.dropdown, required: true, options: {for (final r in roles) r.key: r.label}),
            if (me.can(Perm.payrollManage))
              FieldSpec('payRate', 'Hourly pay rate (\$, optional)', kind: FieldKind.decimal, initial: u.payRate?.toApi()),
          ],
          onSubmit: (v) {
            final rate = Money.tryParse(v['payRate']);
            return api.put('/admin/users/${u.id}/role', {
              'role': v['role'],
              if (rate != null && !rate.isZero) 'payRate': rate.toApi(),
            });
          },
        );
      case 'pay':
        return showFormSheet(
          context,
          title: 'Pay rate for ${u.name}',
          fields: [FieldSpec('payRate', 'Hourly rate (\$)', kind: FieldKind.decimal, initial: u.payRate?.toApi(), required: true)],
          onSubmit: (v) => api.put('/admin/users/${u.id}/pay-rate', {'payRate': Money.parse(v['payRate']).toApi()}),
        );
      case 'active':
        if (!await confirm(context, u.isActive ? 'Deactivate ${u.name}?' : 'Reactivate ${u.name}?',
            u.isActive ? 'They will be signed out and unable to sign in.' : 'They will be able to sign in again.')) {
          return false;
        }
        if (!mounted) return false;
        return runAction(context, () => api.put('/admin/users/${u.id}/active', {'active': !u.isActive}));
    }
    return false;
  }
}

// ------------------------------------------------------------------ roles

class RolesScreen extends ConsumerWidget {
  const RolesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final api = ref.read(apiProvider);
    return AsyncView<(List<RoleDefinition>, List<String>)>(
      load: () async {
        final roles = await api.listOf('/admin/roles', RoleDefinition.fromJson);
        List<String> perms;
        try {
          perms = asStringList(await api.get('/admin/permissions'));
        } on ApiException {
          perms = Perm.all;
        }
        return (roles, perms.isEmpty ? Perm.all : perms);
      },
      builder: (context, data, reload) {
        final (roles, perms) = data;
        return ListView(physics: const AlwaysScrollableScrollPhysics(), children: [
          for (final r in roles)
            ListTile(
              leading: Icon(r.isImmutable ? Icons.lock : Icons.badge_outlined),
              title: Text(r.name),
              subtitle: Text(r.isImmutable ? 'Every permission · cannot be changed' : '${r.permissions.length} permissions'),
              onTap: r.isImmutable
                  ? null
                  : () async {
                      final saved = await pushPage<bool>(context, _RoleEditor(role: r, allPermissions: perms));
                      if (saved == true) reload();
                    },
            ),
        ]);
      },
    );
  }
}

class _RoleEditor extends ConsumerStatefulWidget {
  const _RoleEditor({required this.role, required this.allPermissions});

  final RoleDefinition role;
  final List<String> allPermissions;

  @override
  ConsumerState<_RoleEditor> createState() => _RoleEditorState();
}

class _RoleEditorState extends ConsumerState<_RoleEditor> {
  late final Set<String> _selected = {...widget.role.permissions};

  @override
  Widget build(BuildContext context) {
    final groups = <String, List<String>>{};
    for (final p in widget.allPermissions) {
      groups.putIfAbsent(p.split('.').first, () => []).add(p);
    }
    return Scaffold(
      appBar: AppBar(title: Text(widget.role.name), actions: [
        TextButton(
          onPressed: () async {
            final ok = await runAction(
              context,
              () => ref.read(apiProvider).put('/admin/roles/${widget.role.key}', {'permissions': _selected.toList()..sort()}),
              success: 'Role updated',
            );
            if (ok && context.mounted) Navigator.pop(context, true);
          },
          child: const Text('Save'),
        ),
      ]),
      body: ListView(children: [
        for (final g in groups.entries) ...[
          SectionHeader(humanize(g.key)),
          for (final p in g.value)
            CheckboxListTile(
              dense: true,
              value: _selected.contains(p),
              title: Text(p),
              onChanged: (v) => setState(() => v == true ? _selected.add(p) : _selected.remove(p)),
            ),
        ],
      ]),
    );
  }
}

// -------------------------------------------------------------- approvals

/// Time sheets, time off and raise requests, tabbed by permission.
class ApprovalsScreen extends ConsumerWidget {
  const ApprovalsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(currentUserProvider)!;
    final api = ref.read(apiProvider);
    final tabs = <(String, Widget)>[
      if (user.can(Perm.timeViewAll))
        ('Time sheets', AsyncList<TimeEntry>(
          load: () => api.listOf('/admin/time', TimeEntry.fromJson, query: {'status': 'submitted'}),
          empty: 'No time sheets waiting.',
          emptyIcon: Icons.task_alt,
          itemBuilder: (context, e, reload) => Card(
            child: ListTile(
              title: Text('${e.userName} · ${e.hours ?? '–'} h'),
              subtitle: Text('${fmtDate(e.clockIn)} ${fmtTime(e.clockIn)} – ${fmtTime(e.clockOut)}'
                  '${e.jobTitle.isNotEmpty ? '\n${e.jobTitle}' : ''}${e.notes.isNotEmpty ? '\n${e.notes}' : ''}'),
              isThreeLine: true,
              trailing: user.can(Perm.timeApprove)
                  ? _ApproveButtons(
                      onApprove: ([_]) => api.post('/admin/time/${e.id}/approve'),
                      onReject: ([_]) => api.post('/admin/time/${e.id}/reject'),
                      reload: reload,
                    )
                  : StatusChip(e.status),
            ),
          ),
        )),
      if (user.can(Perm.timeoffApprove))
        ('Time off', AsyncList<TimeOffRequest>(
          load: () => api.listOf('/admin/timeoff', TimeOffRequest.fromJson, query: {'status': 'pending'}),
          empty: 'No pending requests.',
          emptyIcon: Icons.task_alt,
          itemBuilder: (context, t, reload) => Card(
            child: ListTile(
              title: Text('${t.userName} · ${humanize(t.type)}'),
              subtitle: Text('${fmtApiDate(t.startDate)} – ${fmtApiDate(t.endDate)}${t.reason.isNotEmpty ? '\n${t.reason}' : ''}'),
              trailing: _ApproveButtons(
                onApprove: ([_]) => api.post('/admin/timeoff/${t.id}/approve'),
                onReject: ([_]) => api.post('/admin/timeoff/${t.id}/deny'),
                reload: reload,
              ),
            ),
          ),
        )),
      if (user.can(Perm.raiseReview))
        ('Raises', AsyncList<RaiseRequest>(
          load: () => api.listOf('/admin/raise-requests', RaiseRequest.fromJson),
          empty: 'No raise or position requests.',
          emptyIcon: Icons.task_alt,
          itemBuilder: (context, r, reload) => Card(
            child: RaiseTile(
              request: r,
              trailing: r.status != 'pending'
                  ? StatusChip(r.status)
                  : _ApproveButtons(
                      withNote: true,
                      onApprove: ([note]) => api.post('/admin/raise-requests/${r.id}/approve', {'note': note ?? ''}),
                      onReject: ([note]) => api.post('/admin/raise-requests/${r.id}/deny', {'note': note ?? ''}),
                      reload: reload,
                    ),
            ),
          ),
        )),
    ];
    if (tabs.isEmpty) return const EmptyState(message: 'Nothing to approve.');
    return DefaultTabController(
      length: tabs.length,
      child: Column(children: [
        TabBar(tabs: [for (final t in tabs) Tab(text: t.$1)]),
        Expanded(child: TabBarView(children: [for (final t in tabs) t.$2])),
      ]),
    );
  }
}

class _ApproveButtons extends StatelessWidget {
  const _ApproveButtons({required this.onApprove, required this.onReject, required this.reload, this.withNote = false});

  final Future<dynamic> Function([String? note]) onApprove;
  final Future<dynamic> Function([String? note]) onReject;
  final Future<void> Function() reload;
  final bool withNote;

  Future<void> _act(BuildContext context, bool approve) async {
    String? note;
    if (withNote) {
      final ctl = TextEditingController();
      final ok = await showDialog<bool>(
        context: context,
        builder: (ctx) => AlertDialog(
          title: Text(approve ? 'Approve' : 'Deny'),
          content: TextField(controller: ctl, maxLines: 3, decoration: const InputDecoration(labelText: 'Note to employee')),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
            TextButton(onPressed: () => Navigator.pop(ctx, true), child: Text(approve ? 'Approve' : 'Deny')),
          ],
        ),
      );
      note = ctl.text.trim();
      ctl.dispose();
      if (ok != true) return;
    }
    if (!context.mounted) return;
    if (await runAction(context, () => approve ? onApprove(note) : onReject(note), success: approve ? 'Approved' : 'Denied')) {
      await reload();
    }
  }

  @override
  Widget build(BuildContext context) => Row(mainAxisSize: MainAxisSize.min, children: [
        IconButton(tooltip: 'Deny', icon: const Icon(Icons.close, color: Colors.red), onPressed: () => _act(context, false)),
        IconButton(tooltip: 'Approve', icon: const Icon(Icons.check, color: Colors.green), onPressed: () => _act(context, true)),
      ]);
}

// --------------------------------------------------- dispatch & schedule

/// Company calendar with dispatch (whole crew) and single-shift scheduling.
class DispatchScheduleScreen extends ConsumerStatefulWidget {
  const DispatchScheduleScreen({super.key});

  @override
  ConsumerState<DispatchScheduleScreen> createState() => _DispatchScheduleScreenState();
}

class _DispatchScheduleScreenState extends ConsumerState<DispatchScheduleScreen> {
  final _reloader = Reloader();

  @override
  Widget build(BuildContext context) {
    final api = ref.read(apiProvider);
    final user = ref.watch(currentUserProvider)!;
    final now = DateTime.now();
    final start = DateTime(now.year, now.month, now.day);
    return Scaffold(
      body: AsyncView<List<ScheduleEntry>>(
        reloader: _reloader,
        load: () => api.listOf('/calendar', ScheduleEntry.fromJson,
            query: {'from': apiTimestamp(start), 'to': apiTimestamp(start.add(const Duration(days: 21)))}),
        builder: (context, entries, reload) {
          entries.sort((a, b) => a.start.compareTo(b.start));
          String? lastDay;
          return ListView(physics: const AlwaysScrollableScrollPhysics(), padding: const EdgeInsets.only(bottom: 96), children: [
            if (entries.isEmpty) const EmptyState(message: 'Nothing on the calendar for the next 3 weeks.', icon: Icons.event),
            for (final e in entries) ...[
              if (lastDay != fmtDate(e.start)) SectionHeader(lastDay = fmtDate(e.start)),
              ListTile(
                leading: const Icon(Icons.event),
                title: Text('${e.jobTitle.isEmpty ? 'Shift' : e.jobTitle}${e.userName.isNotEmpty ? ' · ${e.userName}' : ''}'),
                subtitle: Text('${fmtTime(e.start)} – ${fmtTime(e.end)}${e.notes.isNotEmpty ? ' · ${e.notes}' : ''}'),
                trailing: user.can(Perm.scheduleManage)
                    ? PopupMenuButton<String>(
                        onSelected: (v) async {
                          if (v == 'edit' && await _editShift(e)) reload();
                          if (v == 'delete' &&
                              context.mounted &&
                              await confirm(context, 'Remove this shift?', 'The employee will no longer see it.', action: 'Remove') &&
                              context.mounted &&
                              await runAction(context, () => api.delete('/admin/schedule/${e.id}'))) {
                            reload();
                          }
                        },
                        itemBuilder: (_) => const [
                          PopupMenuItem(value: 'edit', child: Text('Edit')),
                          PopupMenuItem(value: 'delete', child: Text('Remove')),
                        ],
                      )
                    : null,
              ),
            ],
          ]);
        },
      ),
      floatingActionButton: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.end, children: [
        if (user.can(Perm.scheduleManage))
          FloatingActionButton.small(
            heroTag: 'addShift',
            tooltip: 'Add shift',
            onPressed: () async {
              if (await _editShift(null)) _reloader.reload();
            },
            child: const Icon(Icons.person_add_alt),
          ),
        const SizedBox(height: 8),
        if (user.can(Perm.dispatchManage))
          FloatingActionButton.extended(
            heroTag: 'dispatch',
            icon: const Icon(Icons.local_shipping),
            label: const Text('Dispatch crew'),
            onPressed: () async {
              if (await _dispatch()) _reloader.reload();
            },
          ),
      ]),
    );
  }

  Future<(List<Job>, List<Crew>)> _jobsAndCrews() async {
    final api = ref.read(apiProvider);
    final r = await Future.wait<Object>([
      api.listOf('/jobs', Job.fromJson),
      api.listOf('/crews', Crew.fromJson),
    ]);
    final jobs = (r[0] as List<Job>).where((j) => j.status != JobStatus.completed && j.status != JobStatus.cancelled).toList();
    return (jobs, r[1] as List<Crew>);
  }

  Future<bool> _dispatch() async {
    final (List<Job>, List<Crew>) data;
    try {
      data = await _jobsAndCrews();
    } catch (e) {
      if (mounted) showMessage(context, '$e', error: true);
      return false;
    }
    if (!mounted) return false;
    final (jobs, crews) = data;
    final tomorrow = DateTime.now().add(const Duration(days: 1));
    return showFormSheet(
      context,
      title: 'Dispatch a crew',
      submitLabel: 'Dispatch & notify',
      fields: [
        FieldSpec('jobId', 'Job', kind: FieldKind.dropdown, required: true, options: {for (final j in jobs) '${j.id}': j.title}),
        FieldSpec('crewId', 'Crew', kind: FieldKind.dropdown, required: true, options: {for (final c in crews) '${c.id}': c.name}),
        FieldSpec('start', 'Start', kind: FieldKind.dateTime, required: true,
            initial: DateTime(tomorrow.year, tomorrow.month, tomorrow.day, 7)),
        FieldSpec('end', 'End', kind: FieldKind.dateTime, required: true,
            initial: DateTime(tomorrow.year, tomorrow.month, tomorrow.day, 15, 30)),
        const FieldSpec('notes', 'Notes for the crew', kind: FieldKind.multiline),
      ],
      onSubmit: (v) => ref.read(apiProvider).post('/admin/dispatch', {
        'jobId': int.parse(v['jobId'] as String),
        'crewId': int.parse(v['crewId'] as String),
        'start': v['start'],
        'end': v['end'],
        'notes': v['notes'],
      }),
    );
  }

  Future<bool> _editShift(ScheduleEntry? e) async {
    final api = ref.read(apiProvider);
    final List<Contact> people;
    final List<Job> jobs;
    try {
      people = await api.listOf('/contacts', Contact.fromJson);
      jobs = (await _jobsAndCrews()).$1;
    } catch (err) {
      if (mounted) showMessage(context, '$err', error: true);
      return false;
    }
    if (!mounted) return false;
    return showFormSheet(
      context,
      title: e == null ? 'Add shift' : 'Edit shift',
      fields: [
        FieldSpec('userId', 'Employee', kind: FieldKind.dropdown, required: true, initial: e?.userId?.toString(),
            options: {for (final p in people) '${p.id}': '${p.name} (${p.role.label})'}),
        FieldSpec('jobId', 'Job', kind: FieldKind.dropdown, initial: e?.jobId?.toString(),
            options: {for (final j in jobs) '${j.id}': j.title}),
        FieldSpec('start', 'Start', kind: FieldKind.dateTime, required: true, initial: e?.start),
        FieldSpec('end', 'End', kind: FieldKind.dateTime, required: true, initial: e?.end),
        FieldSpec('notes', 'Notes', kind: FieldKind.multiline, initial: e?.notes),
      ],
      onSubmit: (v) {
        final body = {
          'userId': int.parse(v['userId'] as String),
          if (v['jobId'] != null) 'jobId': int.parse(v['jobId'] as String),
          'start': v['start'],
          'end': v['end'],
          'notes': v['notes'],
        };
        return e == null ? api.post('/admin/schedule', body) : api.put('/admin/schedule/${e.id}', body);
      },
    );
  }
}

// --------------------------------------------------------------- invoices

class InvoicesAdminScreen extends ConsumerWidget {
  const InvoicesAdminScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final api = ref.read(apiProvider);
    return ListScreen<Invoice>(
      title: 'Invoices',
      embedded: true,
      load: () => api.listOf('/admin/invoices', Invoice.fromJson),
      empty: 'No invoices.',
      fabLabel: 'New invoice',
      onCreate: (context) async {
        final c = await pickFrom<CustomerRecord>(
          context,
          title: 'Bill which customer?',
          load: () => api.listOf('/customers', CustomerRecord.fromJson),
          label: (c) => c.name,
          subtitle: (c) => c.address.singleLine,
        );
        if (c == null || !context.mounted) return false;
        return await pushPage<bool>(context, InvoiceEditor(customerId: c.id, customerName: c.name, jobs: c.jobs)) ?? false;
      },
      itemBuilder: (context, inv, reload) => Card(
        child: ListTile(
          title: Text('${inv.number} · ${inv.customerName}'),
          subtitle: Text('Total ${inv.total.format()} · Balance ${inv.balance.format()} · Due ${fmtDate(inv.dueAt)}'),
          trailing: StatusChip(inv.status),
          onTap: () async {
            await pushPage(context, AdminInvoiceDetail(invoiceId: inv.id));
            reload();
          },
        ),
      ),
    );
  }
}

class InvoiceEditor extends ConsumerStatefulWidget {
  const InvoiceEditor({super.key, required this.customerId, required this.customerName, this.jobs = const [], this.invoice});

  final int customerId;
  final String customerName;
  final List<Job> jobs;
  final Invoice? invoice;

  @override
  ConsumerState<InvoiceEditor> createState() => _InvoiceEditorState();
}

class _InvoiceEditorState extends ConsumerState<InvoiceEditor> {
  late final List<LineItem> _items = List.of(widget.invoice?.lineItems ?? const []);
  late final _tax = TextEditingController(text: widget.invoice?.tax.toApi() ?? '0.00');
  late DateTime _due = widget.invoice?.dueAt ?? DateTime.now().add(const Duration(days: 30));
  int? _jobId;
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    _jobId = widget.invoice?.jobId;
  }

  @override
  void dispose() {
    _tax.dispose();
    super.dispose();
  }

  Money get _subtotal => _items.fold(Money.zero, (s, li) => s + li.total);
  Money get _taxAmount => Money.tryParse(_tax.text) ?? Money.zero;

  Future<void> _editItem([int? i]) => showFormSheet(
        context,
        title: i == null ? 'Add line item' : 'Edit line item',
        fields: [
          FieldSpec('description', 'Description', initial: i == null ? null : _items[i].description, required: true),
          FieldSpec('quantity', 'Quantity', kind: FieldKind.decimal, initial: i == null ? '1' : _items[i].quantity, required: true),
          FieldSpec('unitPrice', 'Unit price (\$)', kind: FieldKind.decimal, initial: i == null ? null : _items[i].unitPrice.toApi(),
              required: true),
        ],
        onSubmit: (v) async {
          final li = LineItem(
            description: v['description'] as String,
            quantity: v['quantity'] as String,
            unitPrice: Money.parse(v['unitPrice']),
          );
          setState(() => i == null ? _items.add(li) : _items[i] = li);
        },
      );

  Future<void> _save() async {
    final api = ref.read(apiProvider);
    setState(() => _busy = true);
    final body = {
      'lineItems': _items.map((e) => e.toJson()).toList(),
      'tax': _taxAmount.toApi(),
      'dueAt': apiTimestamp(_due),
    };
    final ok = await runAction(context, () async {
      if (widget.invoice == null) {
        await api.post('/admin/invoices', {...body, 'customerId': widget.customerId, 'jobId': ?_jobId});
      } else {
        await api.put('/admin/invoices/${widget.invoice!.id}', body);
      }
    }, success: 'Invoice saved');
    if (mounted) setState(() => _busy = false);
    if (ok && mounted) Navigator.pop(context, true);
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: Text(widget.invoice == null ? 'New invoice · ${widget.customerName}' : widget.invoice!.number)),
        body: ListView(padding: const EdgeInsets.only(bottom: 120), children: [
          if (widget.invoice == null && widget.jobs.isNotEmpty)
            Padding(
              padding: const EdgeInsets.all(16),
              child: DropdownButtonFormField<int?>(
                initialValue: _jobId,
                decoration: const InputDecoration(labelText: 'Job (optional)'),
                items: [
                  const DropdownMenuItem(value: null, child: Text('None')),
                  for (final j in widget.jobs) DropdownMenuItem(value: j.id, child: Text(j.title)),
                ],
                onChanged: (v) => setState(() => _jobId = v),
              ),
            ),
          SectionHeader('Line items', trailing: TextButton.icon(onPressed: _editItem, icon: const Icon(Icons.add), label: const Text('Add'))),
          for (var i = 0; i < _items.length; i++)
            ListTile(
              title: Text(_items[i].description),
              subtitle: Text('${_items[i].quantity} × ${_items[i].unitPrice.format()}'),
              trailing: Row(mainAxisSize: MainAxisSize.min, children: [
                Text(_items[i].total.format()),
                IconButton(icon: const Icon(Icons.delete_outline), onPressed: () => setState(() => _items.removeAt(i))),
              ]),
              onTap: () => _editItem(i),
            ),
          ListTile(title: const Text('Subtotal'), trailing: Text(_subtotal.format())),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: TextField(
              controller: _tax,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              decoration: const InputDecoration(labelText: 'Tax (\$)'),
              onChanged: (_) => setState(() {}),
            ),
          ),
          ListTile(
            title: const Text('Total', style: TextStyle(fontWeight: FontWeight.bold)),
            trailing: Text((_subtotal + _taxAmount).format(), style: Theme.of(context).textTheme.titleLarge),
          ),
          ListTile(
            leading: const Icon(Icons.event),
            title: const Text('Due date'),
            trailing: Text(fmtDate(_due)),
            onTap: () async {
              final d = await showDatePicker(context: context, initialDate: _due, firstDate: DateTime(2020), lastDate: DateTime(2100));
              if (d != null) setState(() => _due = d);
            },
          ),
        ]),
        bottomNavigationBar: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: FilledButton(onPressed: _busy || _items.isEmpty ? null : _save, child: const Text('Save invoice')),
          ),
        ),
      );
}

class AdminInvoiceDetail extends ConsumerWidget {
  const AdminInvoiceDetail({super.key, required this.invoiceId});

  final int invoiceId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final api = ref.read(apiProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Invoice')),
      body: AsyncView<(Invoice, List<Payment>)>(
        load: () async {
          final raw = asMap(await api.get('/admin/invoices/$invoiceId'));
          return (Invoice.fromJson(raw), asList(raw['payments'], Payment.fromJson));
        },
        builder: (context, data, reload) {
          final (inv, payments) = data;
          final editable = inv.status == 'draft';
          return ListView(padding: const EdgeInsets.only(bottom: 32), children: [
            ListTile(
              title: Text('${inv.number} · ${inv.customerName}', style: Theme.of(context).textTheme.titleMedium),
              subtitle: Text('Issued ${fmtDate(inv.issuedAt)} · Due ${fmtDate(inv.dueAt)}'),
              trailing: StatusChip(inv.status),
            ),
            for (final li in inv.lineItems)
              ListTile(dense: true, title: Text(li.description), subtitle: Text('${li.quantity} × ${li.unitPrice.format()}'),
                  trailing: Text(li.total.format())),
            ListTile(dense: true, title: const Text('Subtotal'), trailing: Text(inv.subtotal.format())),
            ListTile(dense: true, title: const Text('Tax'), trailing: Text(inv.tax.format())),
            ListTile(title: const Text('Total'), trailing: Text(inv.total.format())),
            ListTile(title: const Text('Balance'), trailing: Text(inv.balance.format(), style: Theme.of(context).textTheme.titleLarge)),
            const SectionHeader('Payments'),
            if (payments.isEmpty) const ListTile(title: Text('No payments recorded')),
            for (final p in payments)
              ListTile(
                leading: const Icon(Icons.payments_outlined),
                title: Text(p.amount.format()),
                subtitle: Text('${humanize(p.method)} · ${fmtDateTime(p.createdAt)}'),
                trailing: StatusChip(p.status),
              ),
            const SizedBox(height: 8),
            Wrap(spacing: 8, runSpacing: 8, alignment: WrapAlignment.center, children: [
              if (editable)
                OutlinedButton.icon(
                  icon: const Icon(Icons.edit),
                  label: const Text('Edit'),
                  onPressed: () async {
                    final saved = await pushPage<bool>(
                      context,
                      InvoiceEditor(customerId: inv.customerId ?? 0, customerName: inv.customerName, invoice: inv),
                    );
                    if (saved == true) reload();
                  },
                ),
              if (inv.status != 'void' && inv.status != 'paid')
                FilledButton.icon(
                  style: FilledButton.styleFrom(minimumSize: const Size(0, 44)),
                  icon: const Icon(Icons.send),
                  label: Text(editable ? 'Send to customer' : 'Resend'),
                  onPressed: () async {
                    if (await runAction(context, () => api.post('/admin/invoices/${inv.id}/send'), success: 'Invoice sent')) reload();
                  },
                ),
              if (inv.balance.cents > 0 && inv.status != 'void')
                OutlinedButton.icon(
                  icon: const Icon(Icons.price_check),
                  label: const Text('Record payment'),
                  onPressed: () async {
                    final ok = await showFormSheet(
                      context,
                      title: 'Record payment',
                      fields: [
                        FieldSpec('amount', 'Amount (\$)', kind: FieldKind.decimal, initial: inv.balance.toApi(), required: true),
                        const FieldSpec('method', 'Method', kind: FieldKind.dropdown, initial: 'check', required: true, options: {
                          'check': 'Check',
                          'cash': 'Cash',
                          'card': 'Card',
                          'ach': 'ACH / bank transfer',
                        }),
                      ],
                      onSubmit: (v) => api.post('/admin/payments', {
                        'invoiceId': inv.id,
                        'amount': Money.parse(v['amount']).toApi(),
                        'method': v['method'],
                      }),
                    );
                    if (ok) reload();
                  },
                ),
              if (inv.status != 'void' && inv.status != 'paid')
                TextButton.icon(
                  icon: const Icon(Icons.block),
                  label: const Text('Void'),
                  onPressed: () async {
                    if (!await confirm(context, 'Void ${inv.number}?', 'The customer will no longer owe this invoice.', action: 'Void')) return;
                    if (context.mounted &&
                        await runAction(context, () => api.put('/admin/invoices/${inv.id}', {'status': 'void'}))) {
                      reload();
                    }
                  },
                ),
            ]),
          ]);
        },
      ),
    );
  }
}

// ---------------------------------------------------------------- payroll

class PayrollScreen extends ConsumerWidget {
  const PayrollScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final api = ref.read(apiProvider);
    return ListScreen<PayrollRun>(
      title: 'Payroll',
      embedded: true,
      load: () => api.listOf('/admin/payroll/runs', PayrollRun.fromJson),
      empty: 'No payroll runs yet. Approved time sheets are turned into pay stubs when you run payroll.',
      fabLabel: 'Run payroll',
      onCreate: (context) async {
        PayrollRun? run;
        final ok = await showFormSheet(
          context,
          title: 'Run payroll',
          submitLabel: 'Generate pay stubs',
          intro: const Padding(
            padding: EdgeInsets.only(bottom: 12),
            child: Text('Pay stubs are generated from APPROVED time in the period.'),
          ),
          fields: [
            FieldSpec('periodStart', 'Period start', kind: FieldKind.date, required: true,
                initial: DateTime.now().subtract(const Duration(days: 14))),
            FieldSpec('periodEnd', 'Period end', kind: FieldKind.date, required: true,
                initial: DateTime.now().subtract(const Duration(days: 1))),
            FieldSpec('payDate', 'Pay date', kind: FieldKind.date, initial: DateTime.now().add(const Duration(days: 3))),
          ],
          onSubmit: (v) async => run = PayrollRun.fromJson(asMap(await api.post('/admin/payroll/runs', v))),
        );
        if (ok && run != null && context.mounted) await pushPage(context, _PayrollRunDetail(run: run!));
        return ok;
      },
      itemBuilder: (context, r, _) => Card(
        child: ListTile(
          leading: const Icon(Icons.account_balance_wallet_outlined),
          title: Text('${fmtApiDate(r.periodStart)} – ${fmtApiDate(r.periodEnd)}'),
          subtitle: Text('${r.stubCount} pay stubs · Gross ${r.gross.format()} · Net ${r.net.format()}'),
          onTap: r.paystubs.isEmpty ? null : () => pushPage(context, _PayrollRunDetail(run: r)),
        ),
      ),
    );
  }
}

class _PayrollRunDetail extends StatelessWidget {
  const _PayrollRunDetail({required this.run});

  final PayrollRun run;

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: Text('Payroll ${fmtApiDate(run.periodStart)} – ${fmtApiDate(run.periodEnd)}')),
        body: ListView(children: [
          ListTile(title: const Text('Gross'), trailing: Text(run.gross.format())),
          ListTile(title: const Text('Net'), trailing: Text(run.net.format())),
          for (final s in run.paystubs) PayStubCard(stub: s),
        ]),
      );
}

// ---------------------------------------------- simple CRUD (suppliers etc.)

/// A list of plain JSON records with create / edit / delete via [endpoint].
class JsonCrudScreen extends ConsumerWidget {
  const JsonCrudScreen({
    super.key,
    required this.endpoint,
    required this.noun,
    required this.fields,
    required this.title,
    required this.subtitle,
    this.canDelete = true,
    this.encode,
  });

  final String endpoint, noun;
  final List<FieldSpec> Function(Json? existing) fields;
  final String Function(Json) title;
  final String Function(Json) subtitle;
  final bool canDelete;
  final Json Function(Json values)? encode;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final api = ref.read(apiProvider);
    Future<bool> edit(BuildContext context, Json? row) => showFormSheet(
          context,
          title: row == null ? 'New $noun' : 'Edit $noun',
          fields: fields(row),
          onSubmit: (v) {
            final body = encode?.call(v) ?? v;
            return row == null ? api.post(endpoint, body) : api.put('$endpoint/${row['id']}', body);
          },
        );
    return ListScreen<Json>(
      title: noun,
      embedded: true,
      load: () async => (await api.list(endpoint)).items,
      empty: 'No ${noun.toLowerCase()}s yet.',
      fabLabel: 'Add $noun',
      onCreate: (context) => edit(context, null),
      itemBuilder: (context, row, reload) => Card(
        child: ListTile(
          title: Text(title(row)),
          subtitle: Text(subtitle(row)),
          onTap: () async {
            if (await edit(context, row)) reload();
          },
          trailing: !canDelete
              ? null
              : IconButton(
                  icon: const Icon(Icons.delete_outline),
                  onPressed: () async {
                    if (!await confirm(context, 'Delete ${title(row)}?', 'This cannot be undone.', action: 'Delete')) return;
                    if (context.mounted && await runAction(context, () => api.delete('$endpoint/${row['id']}'))) reload();
                  },
                ),
        ),
      ),
    );
  }
}

class SuppliersScreen extends StatelessWidget {
  const SuppliersScreen({super.key});

  @override
  Widget build(BuildContext context) => JsonCrudScreen(
        endpoint: '/admin/suppliers',
        noun: 'Supplier',
        title: (r) => asString(r['name']),
        subtitle: (r) => [asString(r['contactName']), asString(r['phone']), asString(r['materials'])]
            .where((s) => s.isNotEmpty)
            .join(' · '),
        fields: (r) => [
          FieldSpec('name', 'Company', initial: r?['name'], required: true),
          FieldSpec('contactName', 'Contact person', initial: r?['contactName']),
          FieldSpec('phone', 'Phone', kind: FieldKind.phone, initial: r?['phone']),
          FieldSpec('email', 'Email', kind: FieldKind.email, initial: r?['email']),
          FieldSpec('materials', 'Materials supplied', initial: r?['materials']),
          FieldSpec('notes', 'Notes', kind: FieldKind.multiline, initial: r?['notes']),
        ],
      );
}

class JobPostingsScreen extends StatelessWidget {
  const JobPostingsScreen({super.key});

  @override
  Widget build(BuildContext context) => JsonCrudScreen(
        endpoint: '/admin/job-postings',
        noun: 'Job posting',
        title: (r) => '${asString(r['title'])}${asBool(r['isOpen'], true) ? '' : ' (closed)'}',
        subtitle: (r) => [asString(r['payRange']), asString(r['description'])].where((s) => s.isNotEmpty).join(' · '),
        fields: (r) => [
          FieldSpec('title', 'Position', initial: r?['title'], required: true),
          FieldSpec('payRange', 'Pay range', initial: r?['payRange'], hint: r == null ? r'e.g. $20–$26/hr' : null),
          FieldSpec('description', 'Description', kind: FieldKind.multiline, initial: r?['description'], required: true),
          FieldSpec('isOpen', 'Accepting applications', kind: FieldKind.toggle, initial: asBool(r?['isOpen'], true)),
        ],
      );
}

// -------------------------------------------------------------- equipment

class EquipmentScreen extends ConsumerWidget {
  const EquipmentScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final api = ref.read(apiProvider);
    final canManage = ref.watch(currentUserProvider)!.can(Perm.maintenanceManage);
    return ListScreen<Equipment>(
      title: 'Equipment',
      embedded: true,
      load: () => api.listOf('/admin/equipment', Equipment.fromJson),
      empty: 'No equipment on file.',
      fabLabel: 'Add equipment',
      onCreate: canManage ? (context) => _editEquipment(context, ref, null) : null,
      itemBuilder: (context, e, reload) => Card(
        child: ExpansionTile(
          leading: Icon(Icons.agriculture, color: e.isDue ? Colors.orange : null),
          title: Text(e.name),
          subtitle: Text([
            if (e.kind.isNotEmpty) e.kind,
            if (e.identifier.isNotEmpty) e.identifier,
            'Next service ${fmtDate(e.nextDueAt)}',
          ].join(' · ')),
          trailing: StatusChip(e.status),
          children: [
            if (e.notes.isNotEmpty) ListTile(dense: true, title: Text(e.notes)),
            ListTile(dense: true, title: const Text('Last service'), trailing: Text(fmtDate(e.lastServiceAt))),
            for (final m in e.maintenance)
              ListTile(
                dense: true,
                leading: const Icon(Icons.build_outlined),
                title: Text(m.description),
                subtitle: Text('${fmtDate(m.performedAt)}${m.cost != null ? ' · ${m.cost!.format()}' : ''}'),
              ),
            if (canManage)
              OverflowBar(alignment: MainAxisAlignment.end, children: [
                TextButton.icon(
                  icon: const Icon(Icons.edit),
                  label: const Text('Edit'),
                  onPressed: () async {
                    if (await _editEquipment(context, ref, e)) reload();
                  },
                ),
                TextButton.icon(
                  icon: const Icon(Icons.build),
                  label: const Text('Log maintenance'),
                  onPressed: () async {
                    final ok = await showFormSheet(
                      context,
                      title: 'Maintenance · ${e.name}',
                      fields: [
                        const FieldSpec('description', 'Work done', kind: FieldKind.multiline, required: true),
                        const FieldSpec('cost', 'Cost (\$)', kind: FieldKind.decimal),
                        FieldSpec('performedAt', 'Performed', kind: FieldKind.date, initial: DateTime.now(), required: true),
                        const FieldSpec('nextDueAt', 'Next service due', kind: FieldKind.date),
                      ],
                      onSubmit: (v) {
                        final cost = Money.parseOrNull(v['cost']);
                        return api.post('/admin/equipment/${e.id}/maintenance', {
                          'description': v['description'],
                          if (cost != null) 'cost': cost.toApi(),
                          'performedAt': v['performedAt'],
                          'nextDueAt': v['nextDueAt'],
                        });
                      },
                    );
                    if (ok) reload();
                  },
                ),
              ]),
          ],
        ),
      ),
    );
  }

  Future<bool> _editEquipment(BuildContext context, WidgetRef ref, Equipment? e) => showFormSheet(
        context,
        title: e == null ? 'Add equipment' : 'Edit ${e.name}',
        fields: [
          FieldSpec('name', 'Name', initial: e?.name, required: true),
          FieldSpec('kind', 'Type', initial: e?.kind, hint: 'Truck, paver, roller…'),
          FieldSpec('identifier', 'VIN / serial / unit #', initial: e?.identifier),
          FieldSpec('status', 'Status', kind: FieldKind.dropdown, initial: e?.status ?? 'active', options: const {
            'active': 'Active',
            'in_shop': 'In shop',
            'retired': 'Retired',
          }),
          FieldSpec('notes', 'Notes', kind: FieldKind.multiline, initial: e?.notes),
        ],
        onSubmit: (v) {
          final api = ref.read(apiProvider);
          return e == null ? api.post('/admin/equipment', v) : api.put('/admin/equipment/${e.id}', v);
        },
      );
}

// -------------------------------------------------------- reviews moderation

class ReviewsModerationScreen extends ConsumerWidget {
  const ReviewsModerationScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final api = ref.read(apiProvider);
    return AsyncList<Review>(
      load: () => api.listOf('/admin/reviews', Review.fromJson),
      empty: 'No reviews yet.',
      emptyIcon: Icons.star_outline,
      itemBuilder: (context, r, reload) => ReviewTile(
        review: r,
        trailing: Icon(r.isPublished ? Icons.public : Icons.public_off),
        onTap: () async {
          final ok = await showFormSheet(
            context,
            title: 'Moderate review',
            intro: Padding(padding: const EdgeInsets.only(bottom: 12), child: Text('"${r.comment}"')),
            fields: [
              FieldSpec('isPublished', 'Published on the app & website', kind: FieldKind.toggle, initial: r.isPublished),
              FieldSpec('response', 'Public response', kind: FieldKind.multiline, initial: r.response),
            ],
            onSubmit: (v) => api.put('/admin/reviews/${r.id}', v),
          );
          if (ok) reload();
        },
      ),
    );
  }
}
