import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/json.dart';
import '../../core/models.dart';
import '../../core/money.dart';
import '../../core/permissions.dart';
import '../../core/session.dart';
import '../../services/launchers.dart';
import '../../ui/widgets.dart';
import '../jobs/job_widgets.dart';
import '../jobs/jobs_screens.dart';

// --------------------------------------------------------------- schedule

/// My upcoming work (next 14 days), grouped by day.
class ScheduleScreen extends ConsumerWidget {
  const ScheduleScreen({super.key, this.endpoint = '/schedule', this.days = 14, this.title});

  /// `/schedule` (mine) or `/calendar` (everyone, for `calendar.view`).
  final String endpoint;
  final int days;
  final String? title;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final api = ref.read(apiProvider);
    final user = ref.watch(currentUserProvider)!;
    final now = DateTime.now();
    final start = DateTime(now.year, now.month, now.day);
    return AsyncView<List<ScheduleEntry>>(
      load: () => api.listOf(endpoint, ScheduleEntry.fromJson, query: {
        'from': apiTimestamp(start),
        'to': apiTimestamp(start.add(Duration(days: days))),
      }),
      builder: (context, entries, reload) {
        entries.sort((a, b) => a.start.compareTo(b.start));
        final byDay = <DateTime, List<ScheduleEntry>>{};
        for (final e in entries) {
          byDay.putIfAbsent(DateTime(e.start.year, e.start.month, e.start.day), () => []).add(e);
        }
        return ListView(physics: const AlwaysScrollableScrollPhysics(), padding: const EdgeInsets.only(bottom: 32), children: [
          if (entries.isEmpty) const EmptyState(message: 'Nothing scheduled in the next two weeks.', icon: Icons.event_available),
          for (final day in byDay.keys) ...[
            SectionHeader(fmtDate(day)),
            for (final e in byDay[day]!)
              Card(
                child: ListTile(
                  leading: const Icon(Icons.construction),
                  title: Text(e.jobTitle.isEmpty ? 'Shift' : e.jobTitle),
                  subtitle: Text([
                    '${fmtTime(e.start)} – ${fmtTime(e.end)}',
                    if (e.userName.isNotEmpty) e.userName,
                    if (!e.address.isEmpty) e.address.singleLine,
                    if (e.notes.isNotEmpty) e.notes,
                  ].join('\n')),
                  isThreeLine: true,
                  trailing: e.address.isEmpty
                      ? null
                      : IconButton(
                          icon: const Icon(Icons.navigation),
                          tooltip: 'Navigate',
                          onPressed: () => Launchers.navigateTo(address: e.address),
                        ),
                  onTap: e.jobId != null && user.canAny([Perm.jobsViewAssigned, Perm.jobsViewAll])
                      ? () => pushPage(context, FieldJobDetail(jobId: e.jobId!))
                      : null,
                ),
              ),
          ],
        ]);
      },
    );
  }
}

// ------------------------------------------------------------------ crews

class CrewsScreen extends ConsumerWidget {
  const CrewsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final api = ref.read(apiProvider);
    final user = ref.watch(currentUserProvider)!;
    final canManage = user.can(Perm.crewsManage);
    final full = canManage && user.role.isOfficeOrAdmin;
    return ListScreen<Crew>(
      title: 'Crews',
      embedded: true,
      load: () => api.listOf('/crews', Crew.fromJson),
      empty: "You're not on a crew yet.",
      fabLabel: 'New crew',
      onCreate: full ? (context) => editCrew(context, ref, null, full: true) : null,
      itemBuilder: (context, crew, reload) => Card(
        child: ExpansionTile(
          leading: CircleAvatar(backgroundColor: _parseColor(crew.color), child: Text(initialsOf(crew.name))),
          title: Text(crew.name),
          subtitle: Text('Lead: ${crew.lead?.name ?? '—'} · ${crew.members.length} members'),
          children: [
            for (final m in crew.members)
              ListTile(
                dense: true,
                leading: const Icon(Icons.person_outline),
                title: Text(m.name),
                subtitle: Text(Role.fromKey(m.role).label),
                trailing: ContactButtons(phone: m.phone),
              ),
            if (canManage && (full || crew.lead?.id == user.id))
              OverflowBar(alignment: MainAxisAlignment.end, children: [
                if (full)
                  TextButton.icon(
                    icon: const Icon(Icons.delete_outline),
                    label: const Text('Delete'),
                    onPressed: () async {
                      if (!await confirm(context, 'Delete ${crew.name}?', 'Members stay employed; the crew is removed.',
                          action: 'Delete')) {
                        return;
                      }
                      if (context.mounted && await runAction(context, () => api.delete('/admin/crews/${crew.id}'))) reload();
                    },
                  ),
                TextButton.icon(
                  icon: const Icon(Icons.edit),
                  label: Text(full ? 'Edit crew' : 'Manage members'),
                  onPressed: () async {
                    if (await editCrew(context, ref, crew, full: full)) reload();
                  },
                ),
              ]),
          ],
        ),
      ),
    );
  }
}

Color? _parseColor(String? hex) {
  if (hex == null || !RegExp(r'^#[0-9a-fA-F]{6}$').hasMatch(hex)) return null;
  return Color(int.parse('FF${hex.substring(1)}', radix: 16));
}

/// Create/edit a crew. Office/admin ([full]) edit name, color, lead and
/// members via `/admin/crews`; a crew lead edits only the members of a crew
/// they lead via `PUT /crews/:id/members`. People come from `/contacts`.
Future<bool> editCrew(BuildContext context, WidgetRef ref, Crew? crew, {required bool full}) async {
  assert(full || crew != null);
  final api = ref.read(apiProvider);
  final List<Contact> people;
  try {
    people = await api.listOf('/contacts', Contact.fromJson);
  } catch (e) {
    if (context.mounted) showMessage(context, '$e', error: true);
    return false;
  }
  if (!context.mounted) return false;
  final name = TextEditingController(text: crew?.name ?? '');
  final color = TextEditingController(text: crew?.color ?? '#FF7A00');
  int? leadId = crew?.lead?.id;
  final members = {...?crew?.members.map((m) => m.id)};
  final saved = await showModalBottomSheet<bool>(
    context: context,
    isScrollControlled: true,
    useSafeArea: true,
    builder: (ctx) => StatefulBuilder(
      builder: (ctx, setLocal) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(ctx).bottom),
        child: Column(children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(children: [
              Text(crew == null ? 'New crew' : 'Edit ${crew.name}', style: Theme.of(ctx).textTheme.titleLarge),
              if (full) ...[
              const SizedBox(height: 12),
              TextField(controller: name, decoration: const InputDecoration(labelText: 'Crew name')),
              const SizedBox(height: 12),
              TextField(controller: color, decoration: const InputDecoration(labelText: 'Color (#RRGGBB)')),
              const SizedBox(height: 12),
              DropdownButtonFormField<int>(
                initialValue: people.any((p) => p.id == leadId) ? leadId : null,
                decoration: const InputDecoration(labelText: 'Crew lead'),
                items: [for (final p in people) DropdownMenuItem(value: p.id, child: Text('${p.name} (${p.role.label})'))],
                onChanged: (v) => setLocal(() => leadId = v),
              ),
              ],
            ]),
          ),
          const Align(alignment: Alignment.centerLeft, child: SectionHeader('Members')),
          Expanded(
            child: ListView(children: [
              for (final p in people)
                CheckboxListTile(
                  value: members.contains(p.id),
                  title: Text(p.name),
                  subtitle: Text(p.role.label),
                  onChanged: (v) => setLocal(() => v == true ? members.add(p.id) : members.remove(p.id)),
                ),
            ]),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: FilledButton(
              onPressed: () async {
                final body = {
                  'name': name.text.trim(),
                  'leadId': leadId,
                  'memberIds': members.toList(),
                  'color': color.text.trim(),
                };
                final ok = await runAction(ctx, () async {
                  if (!full) {
                    await api.put('/crews/${crew!.id}/members', {'memberIds': members.toList()});
                  } else if (crew == null) {
                    await api.post('/admin/crews', body);
                  } else {
                    await api.put('/admin/crews/${crew.id}', body);
                  }
                });
                if (ok && ctx.mounted) Navigator.pop(ctx, true);
              },
              child: const Text('Save crew'),
            ),
          ),
        ]),
      ),
    ),
  );
  name.dispose();
  color.dispose();
  return saved ?? false;
}

// --------------------------------------------------------------- contacts

class ContactsScreen extends ConsumerWidget {
  const ContactsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final api = ref.read(apiProvider);
    return AsyncList<Contact>(
      load: () async => (await api.listOf('/contacts', Contact.fromJson))..sort((a, b) => a.name.compareTo(b.name)),
      empty: 'No contacts.',
      itemBuilder: (context, c, _) => ListTile(
        leading: CircleAvatar(child: Text(initialsOf(c.name))),
        title: Text(c.name),
        subtitle: Text(c.role.label),
        trailing: ContactButtons(phone: c.phone, email: c.email),
      ),
    );
  }
}

// --------------------------------------------------------------- time off

class TimeOffScreen extends ConsumerWidget {
  const TimeOffScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final api = ref.read(apiProvider);
    return ListScreen<TimeOffRequest>(
      title: 'Time off',
      embedded: true,
      load: () => api.listOf('/timeoff', TimeOffRequest.fromJson),
      empty: 'No time-off requests.',
      fabLabel: 'Request time off',
      onCreate: (context) => showFormSheet(
        context,
        title: 'Request time off',
        submitLabel: 'Submit request',
        fields: const [
          FieldSpec('type', 'Type', kind: FieldKind.dropdown, initial: 'vacation', required: true, options: {
            'vacation': 'Vacation',
            'sick': 'Sick',
            'personal': 'Personal',
            'unpaid': 'Unpaid',
          }),
          FieldSpec('startDate', 'First day off', kind: FieldKind.date, required: true),
          FieldSpec('endDate', 'Last day off', kind: FieldKind.date, required: true),
          FieldSpec('reason', 'Reason', kind: FieldKind.multiline),
        ],
        onSubmit: (v) async {
          if ((v['endDate'] as String).compareTo(v['startDate'] as String) < 0) {
            throw const FormatException('The last day must be on or after the first day.');
          }
          await api.post('/timeoff', v);
        },
      ),
      itemBuilder: (context, t, _) => Card(
        child: ListTile(
          leading: const Icon(Icons.beach_access),
          title: Text('${humanize(t.type)}: ${fmtApiDate(t.startDate)} – ${fmtApiDate(t.endDate)}'),
          subtitle: Text([
            if (t.reason.isNotEmpty) t.reason,
            if (t.reviewedBy != null) 'Reviewed by ${t.reviewedBy!.name}',
          ].join('\n')),
          trailing: StatusChip(t.status),
        ),
      ),
    );
  }
}

// --------------------------------------------------------------- paystubs

class PayStubsScreen extends ConsumerWidget {
  const PayStubsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final api = ref.read(apiProvider);
    return AsyncList<PayStub>(
      load: () => api.listOf('/paystubs', PayStub.fromJson),
      empty: 'No pay stubs yet.',
      emptyIcon: Icons.receipt_outlined,
      itemBuilder: (context, p, _) => PayStubCard(stub: p),
    );
  }
}

class PayStubCard extends ConsumerWidget {
  const PayStubCard({super.key, required this.stub});

  final PayStub stub;

  @override
  Widget build(BuildContext context, WidgetRef ref) => Card(
        child: ExpansionTile(
          leading: const Icon(Icons.receipt_long),
          title: Text('Paid ${fmtApiDate(stub.payDate)}${stub.userName.isNotEmpty ? ' · ${stub.userName}' : ''}'),
          subtitle: Text('Net ${stub.net.format()}'),
          children: [
            ListTile(dense: true, title: const Text('Period'), trailing: Text('${fmtApiDate(stub.periodStart)} – ${fmtApiDate(stub.periodEnd)}')),
            ListTile(dense: true, title: const Text('Hours'), trailing: Text(stub.hours)),
            ListTile(dense: true, title: const Text('Gross'), trailing: Text(stub.gross.format())),
            ListTile(dense: true, title: const Text('Deductions'), trailing: Text('-${stub.deductions.format()}')),
            ListTile(dense: true, title: const Text('Net pay'), trailing: Text(stub.net.format())),
            if (stub.pdfUrl != null)
              TextButton.icon(
                icon: const Icon(Icons.picture_as_pdf),
                label: const Text('Open PDF'),
                onPressed: () => Launchers.openUrl(ref.read(apiProvider).absoluteUrl(stub.pdfUrl!)),
              ),
          ],
        ),
      );
}

// --------------------------------------------------------------- tax prefs

class TaxPrefsScreen extends ConsumerWidget {
  const TaxPrefsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final api = ref.read(apiProvider);
    final reloader = Reloader();
    return AsyncView<TaxPaymentPrefs>(
      reloader: reloader,
      load: () async => TaxPaymentPrefs.fromJson(asMap(await api.get('/tax-prefs'))),
      builder: (context, p, reload) => ListView(physics: const AlwaysScrollableScrollPhysics(), children: [
        const SectionHeader('Tax withholding'),
        InfoRow(Icons.account_balance_outlined, 'Filing status', humanize(p.filingStatus)),
        InfoRow(Icons.people_outline, 'Allowances', '${p.allowances}'),
        InfoRow(Icons.add_circle_outline, 'Extra withholding per check', p.extraWithholding.format()),
        const SectionHeader('Payment'),
        InfoRow(Icons.payments_outlined, 'Pay method', humanize(p.payMethod)),
        if (p.payMethod == 'direct_deposit') ...[
          InfoRow(Icons.account_balance, 'Bank', p.bankName),
          InfoRow(Icons.numbers, 'Account', p.accountLast4.isEmpty ? '' : '•••• ${p.accountLast4}'),
          InfoRow(Icons.route_outlined, 'Routing', p.routingLast4.isEmpty ? '' : '•••• ${p.routingLast4}'),
        ],
        Padding(
          padding: const EdgeInsets.all(16),
          child: FilledButton.icon(
            icon: const Icon(Icons.edit),
            label: const Text('Update'),
            onPressed: () async {
              final ok = await showFormSheet(
                context,
                title: 'Tax & payment preferences',
                intro: const Padding(
                  padding: EdgeInsets.only(bottom: 12),
                  child: Text('Account and routing numbers are encrypted and never shown again. '
                      'Leave them blank to keep what is on file.'),
                ),
                fields: [
                  FieldSpec('filingStatus', 'Filing status', kind: FieldKind.dropdown, initial: p.filingStatus, options: const {
                    'single': 'Single',
                    'married': 'Married',
                    'head': 'Head of household',
                  }),
                  FieldSpec('allowances', 'Allowances', kind: FieldKind.number, initial: '${p.allowances}'),
                  FieldSpec('extraWithholding', 'Extra withholding (\$)', kind: FieldKind.decimal, initial: p.extraWithholding.toApi()),
                  FieldSpec('payMethod', 'Pay method', kind: FieldKind.dropdown, initial: p.payMethod, options: const {
                    'direct_deposit': 'Direct deposit',
                    'check': 'Paper check',
                  }),
                  FieldSpec('bankName', 'Bank name', initial: p.bankName),
                  FieldSpec('routingNumber', 'Routing number', kind: FieldKind.number,
                      validator: (v) => v.isNotEmpty && v.length != 9 ? 'Routing numbers have 9 digits' : null),
                  FieldSpec('accountNumber', 'Account number', kind: FieldKind.number,
                      validator: (v) => v.isNotEmpty && (v.length < 4 || v.length > 17) ? 'Check the account number' : null),
                ],
                onSubmit: (v) => api.put('/tax-prefs', {
                  'filingStatus': v['filingStatus'],
                  'allowances': int.tryParse(v['allowances'] as String) ?? 0,
                  'extraWithholding': (Money.tryParse(v['extraWithholding']) ?? Money.zero).toApi(),
                  'payMethod': v['payMethod'],
                  'bankName': v['bankName'],
                  // Write-only: only sent when the employee typed new numbers.
                  if ((v['routingNumber'] as String).isNotEmpty) 'routingNumber': v['routingNumber'],
                  if ((v['accountNumber'] as String).isNotEmpty) 'accountNumber': v['accountNumber'],
                }),
              );
              if (ok) reload();
            },
          ),
        ),
      ]),
    );
  }
}

// ---------------------------------------------------------- raise requests

class RaiseRequestsScreen extends ConsumerWidget {
  const RaiseRequestsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final api = ref.read(apiProvider);
    return ListScreen<RaiseRequest>(
      title: 'Raise / position',
      embedded: true,
      load: () => api.listOf('/raise-requests', RaiseRequest.fromJson),
      empty: 'Ask for a raise or apply for a new position here.',
      fabLabel: 'New request',
      onCreate: (context) => showFormSheet(
        context,
        title: 'Raise or position change',
        submitLabel: 'Submit',
        fields: [
          const FieldSpec('kind', 'Request', kind: FieldKind.dropdown, initial: 'raise', required: true, options: {
            'raise': 'Pay raise',
            'position_change': 'Position change',
          }),
          const FieldSpec('requestedRate', 'Requested hourly rate (\$)', kind: FieldKind.decimal),
          FieldSpec('requestedPosition', 'Requested position', kind: FieldKind.dropdown, options: {
            for (final r in Role.values.where((r) => r.isInternal && r != Role.superAdmin && r != Role.admin)) r.key: r.label,
          }),
          const FieldSpec('justification', 'Why?', kind: FieldKind.multiline, required: true),
        ],
        onSubmit: (v) {
          final rate = Money.tryParse(v['requestedRate']);
          return api.post('/raise-requests', {
            'kind': v['kind'],
            if (rate != null && !rate.isZero) 'requestedRate': rate.toApi(),
            if (v['kind'] == 'position_change') 'requestedPosition': v['requestedPosition'],
            'justification': v['justification'],
          });
        },
      ),
      itemBuilder: (context, r, _) => Card(child: RaiseTile(request: r)),
    );
  }
}

class RaiseTile extends StatelessWidget {
  const RaiseTile({super.key, required this.request, this.trailing});

  final RaiseRequest request;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    final r = request;
    return ListTile(
      leading: Icon(r.kind == 'raise' ? Icons.trending_up : Icons.badge_outlined),
      title: Text([
        if (r.userName.isNotEmpty) r.userName,
        r.kind == 'raise'
            ? 'Raise ${r.currentRate?.format() ?? ''} → ${r.requestedRate?.format() ?? ''}'
            : 'Position → ${Role.fromKey(r.requestedPosition).label}',
      ].join(' · ')),
      subtitle: Text([
        r.justification,
        if (r.reviewNote.isNotEmpty) 'Note: ${r.reviewNote}',
        fmtDate(r.createdAt),
      ].join('\n')),
      isThreeLine: true,
      trailing: trailing ?? StatusChip(r.status),
    );
  }
}
