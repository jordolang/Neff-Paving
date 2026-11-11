import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';

import '../../core/json.dart';
import '../../core/models.dart';
import '../../core/money.dart';
import '../../core/permissions.dart';
import '../../core/session.dart';
import '../../services/launchers.dart';
import '../../ui/widgets.dart';
import '../jobs/job_widgets.dart';
import '../messages/messages_screens.dart';

// ------------------------------------------------------------------- jobs

/// Customer job history.
class MyJobsScreen extends ConsumerWidget {
  const MyJobsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final api = ref.read(apiProvider);
    return AsyncList<Job>(
      load: () => api.listOf('/portal/jobs', Job.fromJson),
      empty: "No projects yet. Request an estimate to get started.",
      emptyIcon: Icons.construction,
      itemBuilder: (context, job, reload) => JobCard(
        job: job,
        onTap: () async {
          await pushPage(context, PortalJobDetail(jobId: job.id));
          reload();
        },
      ),
    );
  }
}

class PortalJobDetail extends ConsumerStatefulWidget {
  const PortalJobDetail({super.key, required this.jobId});

  final int jobId;

  @override
  ConsumerState<PortalJobDetail> createState() => _PortalJobDetailState();
}

class _PortalJobDetailState extends ConsumerState<PortalJobDetail> {
  final _reloader = Reloader();

  Future<(Job, List<StatusUpdate>, List<Media>)> _load() async {
    final api = ref.read(apiProvider);
    final id = widget.jobId;
    final results = await Future.wait([
      api.get('/portal/jobs/$id'),
      api.listOf('/portal/jobs/$id/timeline', StatusUpdate.fromJson),
      api.listOf('/portal/jobs/$id/media', Media.fromJson),
    ]);
    return (
      Job.fromJson(asMap(results[0])),
      results[1] as List<StatusUpdate>,
      results[2] as List<Media>,
    );
  }

  @override
  Widget build(BuildContext context) {
    final api = ref.read(apiProvider);
    final user = ref.watch(currentUserProvider);
    return DefaultTabController(
      length: 3,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Project'),
          bottom: const TabBar(tabs: [Tab(text: 'Overview'), Tab(text: 'Timeline'), Tab(text: 'Photos')]),
        ),
        body: AsyncView<(Job, List<StatusUpdate>, List<Media>)>(
          load: _load,
          reloader: _reloader,
          scrollable: false,
          builder: (context, data, reload) {
            final (job, timeline, media) = data;
            return TabBarView(children: [
              RefreshIndicator(
                onRefresh: reload,
                child: ListView(padding: const EdgeInsets.only(bottom: 32), children: [
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
                  InfoRow(Icons.event, 'Scheduled',
                      '${fmtDate(job.scheduledStart)}${job.scheduledEnd != null ? ' – ${fmtDate(job.scheduledEnd)}' : ''}'),
                  if (job.completedAt != null) InfoRow(Icons.check_circle_outline, 'Completed', fmtDate(job.completedAt)),
                  if (!job.estimateTotal.isZero) InfoRow(Icons.request_quote_outlined, 'Estimate', job.estimateTotal.format()),
                  if (job.crew != null) InfoRow(Icons.groups_outlined, 'Crew', job.crew!.name),
                  ServiceLocationCard(job: job),
                  const SectionHeader('Actions'),
                  if (user?.can(Perm.messagesSend) ?? true)
                    ListTile(
                      leading: const Icon(Icons.chat_bubble_outline),
                      title: const Text('Message us about this project'),
                      onTap: () => startThread(context, ref, subject: job.title, jobId: job.id),
                    ),
                  if (user?.can(Perm.galleryPublish) ?? false)
                    SwitchListTile(
                      secondary: const Icon(Icons.public),
                      title: const Text('Share photos to the public gallery'),
                      subtitle: const Text('Let other customers see your finished project'),
                      value: job.isShared,
                      onChanged: (v) async {
                        if (await runAction(context, () => api.post('/portal/jobs/${job.id}/share', {'share': v}),
                            success: v ? 'Shared to the gallery' : 'Removed from the gallery')) {
                          reload();
                        }
                      },
                    ),
                  if (job.status == JobStatus.completed && (user?.can(Perm.reviewsWrite) ?? false))
                    ListTile(
                      leading: const Icon(Icons.star_outline),
                      title: const Text('Leave a review'),
                      onTap: () => _review(job),
                    ),
                ]),
              ),
              RefreshIndicator(
                onRefresh: reload,
                child: ListView(children: [TimelineList(updates: timeline)]),
              ),
              Scaffold(
                body: RefreshIndicator(onRefresh: reload, child: ListView(children: [MediaGrid(media: media)])),
                floatingActionButton: FloatingActionButton(
                  heroTag: 'portalPhoto',
                  tooltip: 'Add photo',
                  onPressed: () async {
                    if (await captureAndUpload(context, ref, endpoint: '/portal/jobs/${job.id}/media')) reload();
                  },
                  child: const Icon(Icons.add_a_photo),
                ),
              ),
            ]);
          },
        ),
      ),
    );
  }

  Future<void> _review(Job job) async {
    var rating = 5;
    final comment = TextEditingController();
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setLocal) => AlertDialog(
          title: const Text('How did we do?'),
          content: Column(mainAxisSize: MainAxisSize.min, children: [
            StarRating(rating, size: 36, onChanged: (v) => setLocal(() => rating = v)),
            const SizedBox(height: 12),
            TextField(controller: comment, maxLines: 4, decoration: const InputDecoration(hintText: 'Tell us about your experience')),
          ]),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
            TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Submit')),
          ],
        ),
      ),
    );
    final text = comment.text.trim();
    comment.dispose();
    if (ok != true || !mounted) return;
    await runAction(
      context,
      () => ref.read(apiProvider).post('/portal/jobs/${job.id}/review', {'rating': rating, 'comment': text}),
      success: 'Thanks for your review!',
    );
  }
}

// -------------------------------------------------------------- estimates

const serviceTypes = {
  'Asphalt Paving': 'Asphalt paving',
  'Sealcoating': 'Sealcoating',
  'Crack Sealing': 'Crack sealing',
  'Concrete': 'Concrete',
  'Line Striping': 'Line striping',
  'Repair / Patching': 'Repair / patching',
  'Materials Delivery': 'Materials delivery',
  'Hauling / Trucking': 'Hauling / trucking',
  'Other': 'Other',
};

class MyEstimatesScreen extends ConsumerWidget {
  const MyEstimatesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final api = ref.read(apiProvider);
    final user = ref.watch(currentUserProvider)!;
    return ListScreen<Estimate>(
      title: 'Estimates',
      embedded: true,
      load: () => api.listOf('/portal/estimates', Estimate.fromJson),
      empty: 'No estimates yet. Tap "Request estimate" to tell us about your project.',
      fabLabel: 'Request estimate',
      onCreate: (context) => showFormSheet(
        context,
        title: 'Request an estimate',
        submitLabel: 'Submit request',
        fields: [
          const FieldSpec('serviceType', 'Service', kind: FieldKind.dropdown, options: serviceTypes, required: true),
          const FieldSpec('description', 'Describe the work', kind: FieldKind.multiline, required: true),
          FieldSpec('line1', 'Service address', initial: user.address.line1, required: true),
          FieldSpec('city', 'City', initial: user.address.city, required: true),
          FieldSpec('state', 'State', initial: user.address.state.isEmpty ? 'OH' : user.address.state),
          FieldSpec('zip', 'ZIP', kind: FieldKind.number, initial: user.address.zip),
          const FieldSpec('squareFeet', 'Approx. square feet', kind: FieldKind.decimal),
          const FieldSpec('preferredDate', 'Preferred date', kind: FieldKind.date),
        ],
        onSubmit: (v) async {
          final created = Estimate.fromJson(asMap(await api.post('/portal/estimates', {
            'serviceType': v['serviceType'],
            'description': v['description'],
            'serviceAddress': {'line1': v['line1'], 'line2': '', 'city': v['city'], 'state': v['state'], 'zip': v['zip']},
            if ((v['squareFeet'] as String).isNotEmpty) 'squareFeet': v['squareFeet'],
            'preferredDate': ?v['preferredDate'],
          })));
          if (context.mounted &&
              await confirm(context, 'Add photos?', 'Photos of the area help us give an accurate estimate.',
                  action: 'Add photos')) {
            if (context.mounted) await _addEstimatePhotos(context, ref, created.id);
          }
        },
      ),
      itemBuilder: (context, e, reload) => Card(
        child: ListTile(
          title: Text(e.serviceType.isEmpty ? 'Estimate #${e.id}' : e.serviceType),
          subtitle: Text('${e.serviceAddress.singleLine}\n${fmtDate(e.createdAt)}'),
          isThreeLine: true,
          trailing: Column(mainAxisAlignment: MainAxisAlignment.center, crossAxisAlignment: CrossAxisAlignment.end, children: [
            StatusChip(e.status),
            if (!e.total.isZero) Text(e.total.format()),
          ]),
          onTap: () async {
            await pushPage(context, PortalEstimateDetail(estimate: e));
            reload();
          },
        ),
      ),
    );
  }
}

Future<void> _addEstimatePhotos(BuildContext context, WidgetRef ref, int estimateId) async {
  final files = await ImagePicker().pickMultiImage(maxWidth: 2560, imageQuality: 85);
  if (files.isEmpty || !context.mounted) return;
  final api = ref.read(apiProvider);
  await runAction(context, () async {
    for (final f in files) {
      await api.upload('/portal/estimates/$estimateId/photos', f.path);
    }
  }, success: '${files.length} photo(s) added');
}

class PortalEstimateDetail extends ConsumerWidget {
  const PortalEstimateDetail({super.key, required this.estimate});

  final Estimate estimate;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final e = estimate;
    final api = ref.read(apiProvider);
    return Scaffold(
      appBar: AppBar(title: Text('Estimate #${e.id}')),
      body: ListView(padding: const EdgeInsets.only(bottom: 32), children: [
        ListTile(title: Text(e.serviceType), subtitle: Text(e.description), trailing: StatusChip(e.status)),
        InfoRow(Icons.place_outlined, 'Service address', e.serviceAddress.singleLine),
        if (e.squareFeet != null) InfoRow(Icons.square_foot, 'Square feet', e.squareFeet!),
        if (e.estimator != null) InfoRow(Icons.person_outline, 'Estimator', e.estimator!.name),
        if (e.validUntil != null) InfoRow(Icons.event, 'Valid until', fmtApiDate(e.validUntil)),
        if (e.lineItems.isNotEmpty) ...[
          const SectionHeader('Line items'),
          LineItemsTable(items: e.lineItems, total: e.total),
        ],
        if (e.notes.isNotEmpty) ...[const SectionHeader('Notes'), Padding(padding: const EdgeInsets.all(16), child: Text(e.notes))],
        if (e.media.isNotEmpty) ...[const SectionHeader('Photos'), MediaGrid(media: e.media)],
        if (e.status == 'requested' || e.status == 'in_review')
          ListTile(
            leading: const Icon(Icons.add_a_photo_outlined),
            title: const Text('Add photos'),
            onTap: () => _addEstimatePhotos(context, ref, e.id),
          ),
        if (e.awaitingCustomer)
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(children: [
              Expanded(
                child: OutlinedButton(
                  style: OutlinedButton.styleFrom(minimumSize: const Size.fromHeight(48)),
                  onPressed: () async {
                    if (!await confirm(context, 'Decline estimate?', 'We will let the estimator know.', action: 'Decline')) return;
                    if (!context.mounted) return;
                    if (await runAction(context, () => api.post('/portal/estimates/${e.id}/decline'), success: 'Estimate declined') &&
                        context.mounted) {
                      Navigator.pop(context);
                    }
                  },
                  child: const Text('Decline'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: FilledButton(
                  onPressed: () async {
                    if (!await confirm(context, 'Accept estimate?', 'Accept ${e.total.format()} and get on the schedule.',
                        action: 'Accept')) {
                      return;
                    }
                    if (!context.mounted) return;
                    if (await runAction(context, () => api.post('/portal/estimates/${e.id}/accept'),
                            success: "Accepted — we'll be in touch to schedule.") &&
                        context.mounted) {
                      Navigator.pop(context);
                    }
                  },
                  child: const Text('Accept'),
                ),
              ),
            ]),
          ),
      ]),
    );
  }
}

class LineItemsTable extends StatelessWidget {
  const LineItemsTable({super.key, required this.items, required this.total, this.subtotal, this.tax});

  final List<LineItem> items;
  final Money total;
  final Money? subtotal, tax;

  @override
  Widget build(BuildContext context) => Card(
        child: Column(children: [
          for (final li in items)
            ListTile(
              dense: true,
              title: Text(li.description),
              subtitle: Text('${li.quantity} × ${li.unitPrice.format()}'),
              trailing: Text(li.total.format()),
            ),
          const Divider(height: 1),
          if (subtotal != null) ListTile(dense: true, title: const Text('Subtotal'), trailing: Text(subtotal!.format())),
          if (tax != null) ListTile(dense: true, title: const Text('Tax'), trailing: Text(tax!.format())),
          ListTile(
            title: const Text('Total', style: TextStyle(fontWeight: FontWeight.bold)),
            trailing: Text(total.format(), style: const TextStyle(fontWeight: FontWeight.bold)),
          ),
        ]),
      );
}

// ---------------------------------------------------------------- billing

class BillingScreen extends ConsumerWidget {
  const BillingScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final api = ref.read(apiProvider);
    return DefaultTabController(
      length: 2,
      child: Column(children: [
        const TabBar(tabs: [Tab(text: 'Invoices'), Tab(text: 'Payments')]),
        Expanded(
          child: TabBarView(children: [
            AsyncList<Invoice>(
              load: () => api.listOf('/portal/invoices', Invoice.fromJson),
              empty: 'No invoices.',
              emptyIcon: Icons.receipt_long_outlined,
              itemBuilder: (context, inv, reload) => Card(
                child: ListTile(
                  title: Text(inv.number),
                  subtitle: Text('Due ${fmtDate(inv.dueAt)} · Balance ${inv.balance.format()}'),
                  trailing: Column(mainAxisAlignment: MainAxisAlignment.center, crossAxisAlignment: CrossAxisAlignment.end, children: [
                    StatusChip(inv.status),
                    Text(inv.total.format()),
                  ]),
                  onTap: () async {
                    await pushPage(context, InvoiceDetail(invoice: inv));
                    reload();
                  },
                ),
              ),
            ),
            AsyncList<Payment>(
              load: () => api.listOf('/portal/payments', Payment.fromJson),
              empty: 'No payments yet.',
              emptyIcon: Icons.payments_outlined,
              itemBuilder: (context, p, _) => ListTile(
                leading: const Icon(Icons.payments_outlined),
                title: Text(p.amount.format()),
                subtitle: Text('${humanize(p.method)} · ${fmtDateTime(p.createdAt)}'),
                trailing: StatusChip(p.status),
              ),
            ),
          ]),
        ),
      ]),
    );
  }
}

class InvoiceDetail extends ConsumerWidget {
  const InvoiceDetail({super.key, required this.invoice});

  final Invoice invoice;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final inv = invoice;
    final user = ref.watch(currentUserProvider);
    return Scaffold(
      appBar: AppBar(title: Text(inv.number)),
      body: ListView(padding: const EdgeInsets.only(bottom: 32), children: [
        ListTile(title: Text('Balance ${inv.balance.format()}', style: Theme.of(context).textTheme.titleLarge), trailing: StatusChip(inv.status)),
        InfoRow(Icons.event, 'Issued', fmtDate(inv.issuedAt)),
        InfoRow(Icons.event_busy, 'Due', fmtDate(inv.dueAt)),
        LineItemsTable(items: inv.lineItems, total: inv.total, subtotal: inv.subtotal, tax: inv.tax),
        if (inv.isPayable && (user?.can(Perm.paymentsMake) ?? false))
          Padding(
            padding: const EdgeInsets.all(16),
            child: FilledButton.icon(
              icon: const Icon(Icons.credit_card),
              label: const Text('Make a payment'),
              onPressed: () => showFormSheet(
                context,
                title: 'Pay ${inv.number}',
                submitLabel: 'Continue to payment',
                fields: [
                  FieldSpec('amount', 'Amount', kind: FieldKind.decimal, initial: inv.balance.toApi(), required: true,
                      validator: (v) {
                    final m = Money.tryParse(v);
                    if (m == null || m.cents <= 0) return 'Enter an amount';
                    if (m > inv.balance) return 'More than the balance';
                    return null;
                  }),
                ],
                onSubmit: (v) async {
                  final res = asMap(await ref.read(apiProvider).post('/portal/invoices/${inv.id}/pay', {
                    'amount': Money.parse(v['amount']).toApi(),
                  }));
                  final url = asStringOrNull(res['checkoutUrl']);
                  if (url != null && url.isNotEmpty) {
                    await Launchers.openUrl(url);
                  } else if (context.mounted) {
                    showMessage(context, 'Payment recorded as pending. Our office will confirm it.');
                  }
                },
              ),
            ),
          ),
      ]),
    );
  }
}
