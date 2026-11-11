import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/api_client.dart';
import '../../core/json.dart';
import '../../core/models.dart';
import '../../core/money.dart';
import '../../core/permissions.dart';
import '../../core/session.dart';
import '../../ui/widgets.dart';
import '../portal/portal_screens.dart' show LineItemsTable, serviceTypes;
import 'job_widgets.dart';

// ----------------------------------------------------------------- list

class FieldJobsScreen extends ConsumerStatefulWidget {
  const FieldJobsScreen({super.key});

  @override
  ConsumerState<FieldJobsScreen> createState() => _FieldJobsScreenState();
}

class _FieldJobsScreenState extends ConsumerState<FieldJobsScreen> {
  final _reloader = Reloader();
  String? _status = 'active';
  late bool _mine;

  @override
  void initState() {
    super.initState();
    _mine = !(ref.read(currentUserProvider)?.can(Perm.jobsViewAll) ?? false);
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(currentUserProvider)!;
    final api = ref.read(apiProvider);
    final filters = <String?, String>{
      'active': 'Active',
      'scheduled': 'Scheduled',
      'in_progress': 'In progress',
      'estimating': 'Estimating',
      'completed': 'Completed',
      null: 'All',
    };
    return Scaffold(
      body: Column(children: [
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          child: Row(children: [
            if (user.can(Perm.jobsViewAll))
              Padding(
                padding: const EdgeInsets.only(right: 8),
                child: FilterChip(
                  label: const Text('My crew'),
                  selected: _mine,
                  onSelected: (v) {
                    setState(() => _mine = v);
                    _reloader.reload();
                  },
                ),
              ),
            for (final f in filters.entries)
              Padding(
                padding: const EdgeInsets.only(right: 6),
                child: ChoiceChip(
                  label: Text(f.value),
                  selected: _status == f.key,
                  onSelected: (_) {
                    setState(() => _status = f.key);
                    _reloader.reload();
                  },
                ),
              ),
          ]),
        ),
        Expanded(
          child: AsyncList<Job>(
            reloader: _reloader,
            load: () async {
              final jobs = await api.listOf('/jobs', Job.fromJson, query: {
                if (_status != null && _status != 'active') 'status': _status,
                if (_mine) 'mine': 1,
              });
              if (_status == 'active') {
                return jobs.where((j) => j.status != JobStatus.completed && j.status != JobStatus.cancelled).toList();
              }
              return jobs;
            },
            empty: 'No jobs match.',
            emptyIcon: Icons.construction,
            itemBuilder: (context, job, reload) => JobCard(
              job: job,
              showCustomer: true,
              onTap: () async {
                await pushPage(context, FieldJobDetail(jobId: job.id));
                reload();
              },
            ),
          ),
        ),
      ]),
      floatingActionButton: user.can(Perm.jobsManage)
          ? FloatingActionButton.extended(
              heroTag: 'newJob',
              icon: const Icon(Icons.add),
              label: const Text('New job'),
              onPressed: () async {
                if (await editJob(context, ref, null)) _reloader.reload();
              },
            )
          : null,
    );
  }
}

/// Create (jobs.manage) or edit (jobs.edit) a job.
Future<bool> editJob(BuildContext context, WidgetRef ref, Job? job, {int? customerId}) async {
  final api = ref.read(apiProvider);
  var custId = customerId ?? job?.customer?.id;
  if (job == null && custId == null) {
    final c = await pickFrom<CustomerRecord>(
      context,
      title: 'Customer',
      load: () => api.listOf('/customers', CustomerRecord.fromJson),
      label: (c) => c.name,
      subtitle: (c) => c.address.singleLine,
    );
    if (c == null) return false;
    custId = c.id;
  }
  if (!context.mounted) return false;
  List<Crew> crews = const [];
  try {
    crews = await api.listOf('/crews', Crew.fromJson);
  } on ApiException {
    // Not allowed to list crews: leave crew unassigned.
  }
  if (!context.mounted) return false;
  final a = job?.serviceAddress ?? const Address();
  return showFormSheet(
    context,
    title: job == null ? 'New job' : 'Edit job',
    fields: [
      FieldSpec('title', 'Title', initial: job?.title, required: true),
      FieldSpec('description', 'Description', kind: FieldKind.multiline, initial: job?.description),
      FieldSpec('line1', 'Service address', initial: a.line1, required: true),
      FieldSpec('city', 'City', initial: a.city, required: true),
      FieldSpec('state', 'State', initial: a.state.isEmpty ? 'OH' : a.state),
      FieldSpec('zip', 'ZIP', kind: FieldKind.number, initial: a.zip),
      FieldSpec('latitude', 'Latitude (optional)', kind: FieldKind.decimal, initial: job?.latitude?.toString()),
      FieldSpec('longitude', 'Longitude (optional)', kind: FieldKind.decimal, initial: job?.longitude?.toString()),
      if (crews.isNotEmpty)
        FieldSpec('crewId', 'Crew', kind: FieldKind.dropdown, initial: job?.crew?.id.toString(), options: {
          for (final c in crews) '${c.id}': c.name,
        }),
      FieldSpec('scheduledStart', 'Start', kind: FieldKind.dateTime, initial: job?.scheduledStart),
      FieldSpec('scheduledEnd', 'End', kind: FieldKind.dateTime, initial: job?.scheduledEnd),
      FieldSpec('estimateTotal', 'Estimate total (\$)', kind: FieldKind.decimal, initial: job?.estimateTotal.toApi()),
      if (job != null)
        FieldSpec('progress', 'Progress %', kind: FieldKind.number, initial: '${job.progress}',
            validator: (v) => (int.tryParse(v) ?? 0) > 100 ? '0–100' : null),
    ],
    onSubmit: (v) async {
      final body = {
        'title': v['title'],
        'description': v['description'],
        'serviceAddress': {'line1': v['line1'], 'line2': '', 'city': v['city'], 'state': v['state'], 'zip': v['zip']},
        'latitude': double.tryParse(v['latitude'] as String),
        'longitude': double.tryParse(v['longitude'] as String),
        if (v['crewId'] != null) 'crewId': int.parse(v['crewId'] as String),
        'scheduledStart': v['scheduledStart'],
        'scheduledEnd': v['scheduledEnd'],
        if ((v['estimateTotal'] as String).isNotEmpty) 'estimateTotal': Money.parse(v['estimateTotal']).toApi(),
        if (v.containsKey('progress')) 'progress': int.tryParse(v['progress'] as String) ?? 0,
      };
      if (job == null) {
        await api.post('/jobs', {...body, 'customerId': custId});
      } else {
        await api.put('/jobs/${job.id}', body);
      }
    },
  );
}

// --------------------------------------------------------------- detail

class FieldJobDetail extends ConsumerStatefulWidget {
  const FieldJobDetail({super.key, required this.jobId});

  final int jobId;

  @override
  ConsumerState<FieldJobDetail> createState() => _FieldJobDetailState();
}

class _JobBundle {
  const _JobBundle(this.job, this.timeline, this.media, this.logs);
  final Job job;
  final List<StatusUpdate> timeline;
  final List<Media> media;
  final List<JobLog> logs;
}

class _FieldJobDetailState extends ConsumerState<FieldJobDetail> {
  final _reloader = Reloader();

  Future<_JobBundle> _load() async {
    final api = ref.read(apiProvider);
    final user = ref.read(currentUserProvider)!;
    final id = widget.jobId;
    final results = await Future.wait<Object>([
      api.get('/jobs/$id').then((v) => Job.fromJson(asMap(v))),
      api.listOf('/jobs/$id/timeline', StatusUpdate.fromJson),
      api.listOf('/jobs/$id/media', Media.fromJson),
      if (user.can(Perm.joblogsView)) api.listOf('/jobs/$id/logs', JobLog.fromJson) else Future.value(<JobLog>[]),
    ]);
    return _JobBundle(
      results[0] as Job,
      results[1] as List<StatusUpdate>,
      results[2] as List<Media>,
      results[3] as List<JobLog>,
    );
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(currentUserProvider)!;
    final showLogs = user.can(Perm.joblogsView);
    final tabs = [
      const Tab(text: 'Overview'),
      const Tab(text: 'Timeline'),
      const Tab(text: 'Media'),
      if (showLogs) const Tab(text: 'Logs'),
    ];
    return DefaultTabController(
      length: tabs.length,
      child: AsyncView<_JobBundle>(
        load: _load,
        reloader: _reloader,
        scrollable: false,
        builder: (context, b, reload) => Scaffold(
          appBar: AppBar(
            title: Text(b.job.title),
            bottom: TabBar(isScrollable: true, tabs: tabs),
            actions: [
              if (user.can(Perm.jobsEdit))
                IconButton(
                  tooltip: 'Edit job',
                  icon: const Icon(Icons.edit),
                  onPressed: () async {
                    if (await editJob(context, ref, b.job)) reload();
                  },
                ),
            ],
          ),
          body: TabBarView(children: [
            RefreshIndicator(onRefresh: reload, child: _overview(context, b.job, reload)),
            RefreshIndicator(
              onRefresh: reload,
              child: ListView(children: [TimelineList(updates: b.timeline, showVisibility: true)]),
            ),
            RefreshIndicator(
              onRefresh: reload,
              child: ListView(children: [
                if (user.can(Perm.galleryManage))
                  const Padding(
                    padding: EdgeInsets.fromLTRB(16, 8, 16, 0),
                    child: Text('Long-press a photo to publish, hide or delete it.'),
                  ),
                MediaGrid(
                  media: b.media,
                  onLongPress: user.can(Perm.galleryManage) ? (m) => _moderate(m, reload) : null,
                ),
              ]),
            ),
            if (showLogs) RefreshIndicator(onRefresh: reload, child: _logs(context, b, reload)),
          ]),
          floatingActionButton: _fab(context, b.job, reload),
        ),
      ),
    );
  }

  Widget? _fab(BuildContext context, Job job, Future<void> Function() reload) {
    final user = ref.read(currentUserProvider)!;
    final actions = <(IconData, String, Future<void> Function())>[
      if (user.can(Perm.jobsStatusUpdate))
        (Icons.campaign, 'Post status update', () async {
          if (await postStatusUpdate(context, ref, job)) await reload();
        }),
      if (user.can(Perm.jobsMediaUpload))
        (Icons.add_a_photo, 'Photo / video', () async {
          if (await captureAndUpload(context, ref, endpoint: '/jobs/${job.id}/media')) await reload();
        }),
      if (user.can(Perm.joblogsEdit))
        (Icons.note_add, 'Add job log', () async {
          if (await addJobLog(context, ref, job.id)) await reload();
        }),
    ];
    if (actions.isEmpty) return null;
    return FloatingActionButton(
      heroTag: 'jobActions',
      child: const Icon(Icons.add),
      onPressed: () => showModalBottomSheet<void>(
        context: context,
        builder: (ctx) => SafeArea(
          child: Wrap(children: [
            for (final a in actions)
              ListTile(
                leading: Icon(a.$1),
                title: Text(a.$2),
                onTap: () {
                  Navigator.pop(ctx);
                  a.$3();
                },
              ),
          ]),
        ),
      ),
    );
  }

  Widget _overview(BuildContext context, Job job, Future<void> Function() reload) {
    final user = ref.read(currentUserProvider)!;
    final c = job.customer;
    return ListView(padding: const EdgeInsets.only(bottom: 96), children: [
      ListTile(
        title: Text(job.title, style: Theme.of(context).textTheme.titleLarge),
        subtitle: job.description.isEmpty ? null : Text(job.description),
        trailing: StatusChip(job.status.key),
      ),
      if (job.status == JobStatus.inProgress)
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: LinearProgressIndicator(value: job.progress / 100, minHeight: 8),
        ),
      ServiceLocationCard(job: job),
      if (c != null) ...[
        const SectionHeader('Customer'),
        ListTile(
          leading: CircleAvatar(child: Text(initialsOf(c.name))),
          title: Text(c.name),
          subtitle: Text([c.phone, c.email].whereType<String>().where((s) => s.isNotEmpty).join('\n')),
          trailing: user.can(Perm.customersContact)
              ? ContactButtons(phone: c.phone, email: c.email, subject: job.title)
              : null,
        ),
      ],
      const SectionHeader('Details'),
      InfoRow(Icons.event, 'Scheduled', '${fmtDateTime(job.scheduledStart)} – ${fmtDateTime(job.scheduledEnd)}'),
      if (job.crew != null) InfoRow(Icons.groups_outlined, 'Crew', job.crew!.name),
      if (!job.estimateTotal.isZero) InfoRow(Icons.request_quote_outlined, 'Estimate', job.estimateTotal.format()),
      if (job.completedAt != null) InfoRow(Icons.check_circle_outline, 'Completed', fmtDateTime(job.completedAt)),
      InfoRow(Icons.public, 'Shared to gallery', job.isShared ? 'Yes' : 'No'),
    ]);
  }

  Widget _logs(BuildContext context, _JobBundle b, Future<void> Function() reload) => ListView(
        padding: const EdgeInsets.only(bottom: 96),
        children: [
          if (b.logs.isEmpty) const EmptyState(message: 'No daily logs yet.', icon: Icons.note_alt_outlined),
          for (final l in b.logs)
            Card(
              child: ListTile(
                title: Text('${fmtApiDate(l.date)} · ${l.hours} h'),
                subtitle: Text([
                  l.notes,
                  if (l.materials.isNotEmpty) 'Materials: ${l.materials}',
                  if (l.weather.isNotEmpty) 'Weather: ${l.weather}',
                  if (l.author != null) '— ${l.author!.name}',
                ].join('\n')),
              ),
            ),
        ],
      );

  Future<void> _moderate(Media m, Future<void> Function() reload) async {
    final api = ref.read(apiProvider);
    final choice = await showModalBottomSheet<String>(
      context: context,
      builder: (ctx) => SafeArea(
        child: Wrap(children: [
          ListTile(
            leading: Icon(m.isPublic ? Icons.public_off : Icons.public),
            title: Text(m.isPublic ? 'Hide from public gallery' : 'Publish to public gallery'),
            onTap: () => Navigator.pop(ctx, 'toggle'),
          ),
          ListTile(leading: const Icon(Icons.edit), title: const Text('Edit caption'), onTap: () => Navigator.pop(ctx, 'caption')),
          ListTile(leading: const Icon(Icons.delete_outline), title: const Text('Delete'), onTap: () => Navigator.pop(ctx, 'delete')),
        ]),
      ),
    );
    if (!mounted || choice == null) return;
    switch (choice) {
      case 'toggle':
        if (await runAction(context, () => api.put('/admin/media/${m.id}', {'isPublic': !m.isPublic, 'caption': m.caption}))) {
          await reload();
        }
      case 'caption':
        if (await showFormSheet(context,
            title: 'Caption',
            fields: [FieldSpec('caption', 'Caption', initial: m.caption)],
            onSubmit: (v) => api.put('/admin/media/${m.id}', {'isPublic': m.isPublic, 'caption': v['caption']}))) {
          await reload();
        }
      case 'delete':
        if (await confirm(context, 'Delete this ${m.kind}?', 'This cannot be undone.', action: 'Delete') &&
            mounted &&
            await runAction(context, () => api.delete('/admin/media/${m.id}'))) {
          await reload();
        }
    }
  }
}

/// Publish a status update; optionally attach a photo to it.
/// Setting `completed` notifies the customer and the owners (server side).
Future<bool> postStatusUpdate(BuildContext context, WidgetRef ref, Job job) async {
  final api = ref.read(apiProvider);
  StatusUpdate? created;
  var attach = false;
  final ok = await showFormSheet(
    context,
    title: 'Status update',
    submitLabel: 'Publish',
    fields: [
      FieldSpec('status', 'Status', kind: FieldKind.dropdown, initial: job.status.key, required: true, options: {
        for (final s in JobStatus.values) s.key: s.label,
      }),
      const FieldSpec('message', 'Update', kind: FieldKind.multiline, required: true,
          hint: 'e.g. Base layer down, final coat tomorrow'),
      const FieldSpec('visibleToCustomer', 'Visible to customer', kind: FieldKind.toggle, initial: true),
      const FieldSpec('attachPhoto', 'Attach a photo/video next', kind: FieldKind.toggle, initial: false),
    ],
    onSubmit: (v) async {
      if (v['status'] == JobStatus.completed.key &&
          context.mounted &&
          !await confirm(context, 'Mark job completed?', 'The customer and owners will be notified.', action: 'Complete')) {
        throw const FormatException('Cancelled');
      }
      created = StatusUpdate.fromJson(asMap(await api.post('/jobs/${job.id}/status', {
        'status': v['status'],
        'message': v['message'],
        'visibleToCustomer': v['visibleToCustomer'],
      })));
      attach = v['attachPhoto'] == true;
    },
  );
  if (ok && attach && created != null && context.mounted) {
    await captureAndUpload(context, ref, endpoint: '/jobs/${job.id}/media', statusUpdateId: created!.id);
  }
  return ok;
}

Future<bool> addJobLog(BuildContext context, WidgetRef ref, int jobId) => showFormSheet(
      context,
      title: 'Daily job log',
      fields: [
        FieldSpec('date', 'Date', kind: FieldKind.date, initial: DateTime.now(), required: true),
        const FieldSpec('hours', 'Crew hours', kind: FieldKind.decimal, required: true),
        const FieldSpec('notes', 'Work performed', kind: FieldKind.multiline, required: true),
        const FieldSpec('materials', 'Materials used', hint: 'e.g. 12 tons 304'),
        const FieldSpec('weather', 'Weather', hint: 'e.g. Clear 54F'),
      ],
      onSubmit: (v) => ref.read(apiProvider).post('/jobs/$jobId/logs', v),
    );

// ------------------------------------------------------------- customers

class CustomersScreen extends ConsumerStatefulWidget {
  const CustomersScreen({super.key});

  @override
  ConsumerState<CustomersScreen> createState() => _CustomersScreenState();
}

class _CustomersScreenState extends ConsumerState<CustomersScreen> {
  final _reloader = Reloader();
  final _q = TextEditingController();

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
        padding: const EdgeInsets.fromLTRB(12, 8, 12, 4),
        child: TextField(
          controller: _q,
          textInputAction: TextInputAction.search,
          decoration: const InputDecoration(prefixIcon: Icon(Icons.search), hintText: 'Search customers', isDense: true),
          onSubmitted: (_) => _reloader.reload(),
        ),
      ),
      Expanded(
        child: AsyncList<CustomerRecord>(
          reloader: _reloader,
          load: () => api.listOf('/customers', CustomerRecord.fromJson, query: {'q': _q.text.trim()}),
          empty: 'No customers found.',
          emptyIcon: Icons.people_outline,
          itemBuilder: (context, c, reload) => ListTile(
            leading: CircleAvatar(child: Text(initialsOf(c.name))),
            title: Text(c.name),
            subtitle: Text([c.address.singleLine, '${c.jobCount} jobs'].where((s) => s.isNotEmpty).join(' · ')),
            trailing: c.closed ? const StatusChip('closed') : null,
            onTap: () async {
              await pushPage(context, CustomerDetailScreen(customerId: c.id));
              reload();
            },
          ),
        ),
      ),
    ]);
  }
}

class CustomerDetailScreen extends ConsumerWidget {
  const CustomerDetailScreen({super.key, required this.customerId});

  final int customerId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final api = ref.read(apiProvider);
    final user = ref.watch(currentUserProvider)!;
    return Scaffold(
      appBar: AppBar(title: const Text('Customer')),
      body: AsyncView<CustomerRecord>(
        load: () async => CustomerRecord.fromJson(asMap(await api.get('/customers/$customerId'))),
        builder: (context, c, reload) => ListView(padding: const EdgeInsets.only(bottom: 32), children: [
          ListTile(
            leading: CircleAvatar(child: Text(initialsOf(c.name))),
            title: Text(c.name, style: Theme.of(context).textTheme.titleLarge),
            subtitle: Text(c.address.singleLine),
            trailing: c.closed ? const StatusChip('closed') : null,
          ),
          InfoRow(Icons.phone, 'Phone', c.phone ?? ''),
          InfoRow(Icons.email, 'Email', c.email),
          if (user.can(Perm.customersContact))
            Padding(padding: const EdgeInsets.symmetric(horizontal: 8), child: ContactButtons(phone: c.phone, email: c.email)),
          SectionHeader('Jobs (${c.jobs.length})',
              trailing: user.can(Perm.jobsManage) && !c.closed
                  ? TextButton(
                      onPressed: () async {
                        if (await editJob(context, ref, null, customerId: c.id)) reload();
                      },
                      child: const Text('New job'),
                    )
                  : null),
          for (final j in c.jobs)
            ListTile(
              title: Text(j.title),
              subtitle: Text(fmtDate(j.scheduledStart ?? j.createdAt)),
              trailing: StatusChip(j.status.key),
              onTap: () => pushPage(context, FieldJobDetail(jobId: j.id)),
            ),
          SectionHeader('Estimates (${c.estimates.length})'),
          for (final e in c.estimates)
            ListTile(
              title: Text(e.serviceType),
              subtitle: Text(e.total.format()),
              trailing: StatusChip(e.status),
              onTap: () => pushPage(context, EstimateEditor(estimate: e)),
            ),
          SectionHeader('Invoices (${c.invoices.length})'),
          for (final i in c.invoices)
            ListTile(
              title: Text(i.number),
              subtitle: Text('Balance ${i.balance.format()}'),
              trailing: StatusChip(i.status),
            ),
          if (user.can(Perm.accountsClose) && !c.closed)
            Padding(
              padding: const EdgeInsets.all(16),
              child: OutlinedButton.icon(
                style: OutlinedButton.styleFrom(
                  minimumSize: const Size.fromHeight(48),
                  foregroundColor: Theme.of(context).colorScheme.error,
                ),
                icon: const Icon(Icons.lock_outline),
                label: const Text('Close out account'),
                onPressed: () async {
                  if (await closeAccount(context, ref, c)) reload();
                },
              ),
            ),
        ]),
      ),
    );
  }
}

/// `POST /admin/accounts/:id/close`; on 409 (unpaid invoices) offers to force.
Future<bool> closeAccount(BuildContext context, WidgetRef ref, CustomerRecord c) => showFormSheet(
      context,
      title: 'Close out ${c.name}?',
      submitLabel: 'Close account',
      intro: const Padding(
        padding: EdgeInsets.only(bottom: 12),
        child: Text('The customer loses portal access. Job history and invoices are kept.'),
      ),
      fields: const [FieldSpec('reason', 'Reason', kind: FieldKind.multiline)],
      onSubmit: (v) async {
        final api = ref.read(apiProvider);
        try {
          await api.post('/admin/accounts/${c.id}/close', {'reason': v['reason']});
        } on ApiException catch (e) {
          if (e.code != 'conflict' || !context.mounted) rethrow;
          final force = await confirm(context, 'Unpaid invoices', '${e.message}\n\nClose the account anyway?',
              action: 'Close anyway');
          if (!force) rethrow;
          await api.post('/admin/accounts/${c.id}/close', {'reason': v['reason'], 'force': true});
        }
      },
    );

// -------------------------------------------------------------- estimates

class FieldEstimatesScreen extends ConsumerStatefulWidget {
  const FieldEstimatesScreen({super.key});

  @override
  ConsumerState<FieldEstimatesScreen> createState() => _FieldEstimatesScreenState();
}

class _FieldEstimatesScreenState extends ConsumerState<FieldEstimatesScreen> {
  final _reloader = Reloader();
  String? _status;

  @override
  Widget build(BuildContext context) {
    final api = ref.read(apiProvider);
    const statuses = ['requested', 'in_review', 'sent', 'accepted', 'declined', 'expired'];
    return Scaffold(
      body: Column(children: [
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          child: Row(children: [
            for (final s in [null, ...statuses])
              Padding(
                padding: const EdgeInsets.only(right: 6),
                child: ChoiceChip(
                  label: Text(s == null ? 'All' : humanize(s)),
                  selected: _status == s,
                  onSelected: (_) {
                    setState(() => _status = s);
                    _reloader.reload();
                  },
                ),
              ),
          ]),
        ),
        Expanded(
          child: AsyncList<Estimate>(
            reloader: _reloader,
            load: () => api.listOf('/estimates', Estimate.fromJson, query: {'status': _status}),
            empty: 'No estimates.',
            emptyIcon: Icons.request_quote_outlined,
            itemBuilder: (context, e, reload) => Card(
              child: ListTile(
                title: Text('${e.customerName.isEmpty ? 'Customer #${e.customerId}' : e.customerName} · ${e.serviceType}'),
                subtitle: Text([
                  e.serviceAddress.singleLine,
                  if (e.preferredDate != null) 'Preferred ${fmtApiDate(e.preferredDate)}',
                  if (e.estimator != null) 'Estimator: ${e.estimator!.name}',
                ].join('\n')),
                isThreeLine: true,
                trailing: Column(mainAxisAlignment: MainAxisAlignment.center, crossAxisAlignment: CrossAxisAlignment.end, children: [
                  StatusChip(e.status),
                  if (!e.total.isZero) Text(e.total.format()),
                ]),
                onTap: () async {
                  await pushPage(context, EstimateEditor(estimate: e));
                  reload();
                },
              ),
            ),
          ),
        ),
      ]),
      floatingActionButton: FloatingActionButton.extended(
        heroTag: 'newEstimate',
        icon: const Icon(Icons.add),
        label: const Text('New estimate'),
        onPressed: () async {
          final c = await pickFrom<CustomerRecord>(
            context,
            title: 'Customer',
            load: () => api.listOf('/customers', CustomerRecord.fromJson),
            label: (c) => c.name,
            subtitle: (c) => c.address.singleLine,
          );
          if (c == null || !context.mounted) return;
          final ok = await showFormSheet(
            context,
            title: 'New estimate for ${c.name}',
            fields: [
              const FieldSpec('serviceType', 'Service', kind: FieldKind.dropdown, options: serviceTypes, required: true),
              const FieldSpec('description', 'Scope of work', kind: FieldKind.multiline, required: true),
              FieldSpec('line1', 'Service address', initial: c.address.line1, required: true),
              FieldSpec('city', 'City', initial: c.address.city, required: true),
              FieldSpec('state', 'State', initial: c.address.state.isEmpty ? 'OH' : c.address.state),
              FieldSpec('zip', 'ZIP', kind: FieldKind.number, initial: c.address.zip),
              const FieldSpec('squareFeet', 'Square feet', kind: FieldKind.decimal),
            ],
            onSubmit: (v) => api.post('/estimates', {
              'customerId': c.id,
              'serviceType': v['serviceType'],
              'description': v['description'],
              'serviceAddress': {'line1': v['line1'], 'line2': '', 'city': v['city'], 'state': v['state'], 'zip': v['zip']},
              if ((v['squareFeet'] as String).isNotEmpty) 'squareFeet': v['squareFeet'],
            }),
          );
          if (ok) _reloader.reload();
        },
      ),
    );
  }
}

/// Builds/edits estimate line items, then saves or sends to the customer.
class EstimateEditor extends ConsumerStatefulWidget {
  const EstimateEditor({super.key, required this.estimate});

  final Estimate estimate;

  @override
  ConsumerState<EstimateEditor> createState() => _EstimateEditorState();
}

class _EstimateEditorState extends ConsumerState<EstimateEditor> {
  late final List<LineItem> _items = List.of(widget.estimate.lineItems);
  late final _notes = TextEditingController(text: widget.estimate.notes);
  DateTime? _validUntil;
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    _validUntil = DateTime.tryParse(widget.estimate.validUntil ?? '') ?? DateTime.now().add(const Duration(days: 30));
  }

  @override
  void dispose() {
    _notes.dispose();
    super.dispose();
  }

  Money get _total => _items.fold(Money.zero, (sum, li) => sum + li.total);

  bool get _editable => !const ['accepted', 'declined'].contains(widget.estimate.status);

  Future<void> _editItem([int? index]) async {
    final li = index == null ? null : _items[index];
    await showFormSheet(
      context,
      title: li == null ? 'Add line item' : 'Edit line item',
      fields: [
        FieldSpec('description', 'Description', initial: li?.description, required: true),
        FieldSpec('quantity', 'Quantity', kind: FieldKind.decimal, initial: li?.quantity ?? '1', required: true),
        FieldSpec('unitPrice', 'Unit price (\$)', kind: FieldKind.decimal, initial: li?.unitPrice.toApi(), required: true),
      ],
      onSubmit: (v) async {
        final item = LineItem(
          description: v['description'] as String,
          quantity: v['quantity'] as String,
          unitPrice: Money.parse(v['unitPrice']),
        );
        setState(() => index == null ? _items.add(item) : _items[index] = item);
      },
    );
  }

  Future<void> _save({String? status, bool send = false}) async {
    final api = ref.read(apiProvider);
    setState(() => _busy = true);
    final ok = await runAction(context, () async {
      await api.put('/estimates/${widget.estimate.id}', {
        'lineItems': _items.map((e) => e.toJson()).toList(),
        'total': _total.toApi(),
        'validUntil': _validUntil == null ? null : apiDate(_validUntil!),
        'notes': _notes.text.trim(),
        'status': ?status,
      });
      if (send) await api.post('/estimates/${widget.estimate.id}/send');
    }, success: send ? 'Estimate sent to the customer' : 'Saved');
    if (mounted) setState(() => _busy = false);
    if (ok && mounted) Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    final e = widget.estimate;
    return Scaffold(
      appBar: AppBar(title: Text('Estimate #${e.id}')),
      body: ListView(padding: const EdgeInsets.only(bottom: 120), children: [
        ListTile(
          title: Text('${e.customerName} · ${e.serviceType}'),
          subtitle: Text('${e.description}\n${e.serviceAddress.singleLine}'),
          isThreeLine: true,
          trailing: StatusChip(e.status),
        ),
        if (e.squareFeet != null) InfoRow(Icons.square_foot, 'Square feet', e.squareFeet!),
        if (e.preferredDate != null) InfoRow(Icons.event, 'Customer preferred date', fmtApiDate(e.preferredDate)),
        if (e.media.isNotEmpty) ...[const SectionHeader('Customer photos'), MediaGrid(media: e.media)],
        SectionHeader('Line items',
            trailing: _editable ? TextButton.icon(onPressed: _editItem, icon: const Icon(Icons.add), label: const Text('Add')) : null),
        if (_items.isEmpty) const EmptyState(message: 'Add line items to price this job.', icon: Icons.list_alt),
        if (_items.isNotEmpty && !_editable) LineItemsTable(items: _items, total: _total),
        if (_editable)
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
        ListTile(
          title: const Text('Total', style: TextStyle(fontWeight: FontWeight.bold)),
          trailing: Text(_total.format(), style: Theme.of(context).textTheme.titleLarge),
        ),
        ListTile(
          leading: const Icon(Icons.event),
          title: const Text('Valid until'),
          trailing: Text(fmtDate(_validUntil)),
          onTap: !_editable
              ? null
              : () async {
                  final d = await showDatePicker(
                    context: context,
                    initialDate: _validUntil ?? DateTime.now(),
                    firstDate: DateTime.now().subtract(const Duration(days: 1)),
                    lastDate: DateTime(2100),
                  );
                  if (d != null) setState(() => _validUntil = d);
                },
        ),
        Padding(
          padding: const EdgeInsets.all(16),
          child: TextField(
            controller: _notes,
            enabled: _editable,
            maxLines: 3,
            decoration: const InputDecoration(labelText: 'Notes for the customer'),
          ),
        ),
      ]),
      bottomNavigationBar: !_editable
          ? null
          : SafeArea(
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Row(children: [
                  Expanded(
                    child: OutlinedButton(
                      style: OutlinedButton.styleFrom(minimumSize: const Size.fromHeight(48)),
                      onPressed: _busy ? null : () => _save(status: e.status == 'requested' ? 'in_review' : null),
                      child: const Text('Save draft'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: FilledButton.icon(
                      onPressed: _busy || _items.isEmpty ? null : () => _save(send: true),
                      icon: const Icon(Icons.send),
                      label: const Text('Send'),
                    ),
                  ),
                ]),
              ),
            ),
    );
  }
}
