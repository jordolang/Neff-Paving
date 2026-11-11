import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/models.dart';
import '../../core/session.dart';
import '../../services/launchers.dart';
import '../../services/location_tracker.dart';
import '../../services/media_uploader.dart';
import '../../ui/map_widgets.dart';
import '../../ui/widgets.dart';

/// Card summarizing a job in lists.
class JobCard extends StatelessWidget {
  const JobCard({super.key, required this.job, this.onTap, this.showCustomer = false});

  final Job job;
  final VoidCallback? onTap;
  final bool showCustomer;

  @override
  Widget build(BuildContext context) => Card(
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: onTap,
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            if (job.coverPhotoUrl != null) NetImage(job.coverPhotoUrl!, height: 140, width: double.infinity),
            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Row(children: [
                  Expanded(child: Text(job.title, style: Theme.of(context).textTheme.titleMedium)),
                  StatusChip(job.status.key),
                ]),
                const SizedBox(height: 4),
                if (showCustomer && job.customer != null) Text(job.customer!.name),
                Text(job.serviceAddress.singleLine, style: Theme.of(context).textTheme.bodySmall),
                if (job.scheduledStart != null)
                  Text('Scheduled ${fmtDate(job.scheduledStart)}', style: Theme.of(context).textTheme.bodySmall),
                if (job.status == JobStatus.inProgress) ...[
                  const SizedBox(height: 8),
                  LinearProgressIndicator(value: job.progress / 100),
                ],
              ]),
            ),
          ]),
        ),
      );
}

/// Map + address + Navigate button for a job's service address.
class ServiceLocationCard extends StatelessWidget {
  const ServiceLocationCard({super.key, required this.job});

  final Job job;

  @override
  Widget build(BuildContext context) => Card(
        clipBehavior: Clip.antiAlias,
        child: Column(children: [
          if (job.hasCoordinates) PinMap(latitude: job.latitude!, longitude: job.longitude!, label: job.title),
          ListTile(
            leading: const Icon(Icons.place_outlined),
            title: Text(job.serviceAddress.singleLine.isEmpty ? 'No address on file' : job.serviceAddress.singleLine),
            trailing: FilledButton.icon(
              style: FilledButton.styleFrom(minimumSize: const Size(0, 40)),
              onPressed: () async {
                final ok = await Launchers.navigateTo(
                  latitude: job.latitude,
                  longitude: job.longitude,
                  address: job.serviceAddress,
                );
                if (!ok && context.mounted) showMessage(context, 'No maps app available', error: true);
              },
              icon: const Icon(Icons.navigation),
              label: const Text('Navigate'),
            ),
          ),
        ]),
      );
}

/// Vertical status timeline.
class TimelineList extends StatelessWidget {
  const TimelineList({super.key, required this.updates, this.showVisibility = false});

  final List<StatusUpdate> updates;
  final bool showVisibility;

  @override
  Widget build(BuildContext context) {
    if (updates.isEmpty) return const EmptyState(message: 'No updates yet.', icon: Icons.timeline);
    final cs = Theme.of(context).colorScheme;
    return Column(children: [
      for (var i = 0; i < updates.length; i++)
        IntrinsicHeight(
          child: Row(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
            SizedBox(
              width: 40,
              child: Column(children: [
                Container(
                  margin: const EdgeInsets.only(top: 14),
                  width: 14,
                  height: 14,
                  decoration: BoxDecoration(color: cs.primary, shape: BoxShape.circle),
                ),
                if (i < updates.length - 1) Expanded(child: Container(width: 2, color: cs.outlineVariant)),
              ]),
            ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(0, 8, 12, 12),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Row(children: [
                    StatusChip(updates[i].status.key),
                    const SizedBox(width: 8),
                    Expanded(child: Text(fmtDateTime(updates[i].createdAt), style: Theme.of(context).textTheme.bodySmall)),
                    if (showVisibility && !updates[i].visibleToCustomer)
                      const Tooltip(message: 'Internal only', child: Icon(Icons.visibility_off, size: 16)),
                  ]),
                  const SizedBox(height: 4),
                  if (updates[i].message.isNotEmpty) Text(updates[i].message),
                  if (updates[i].author != null)
                    Text('— ${updates[i].author!.name}', style: Theme.of(context).textTheme.bodySmall),
                  if (updates[i].media.isNotEmpty) ...[
                    const SizedBox(height: 6),
                    MediaStrip(media: updates[i].media),
                  ],
                ]),
              ),
            ),
          ]),
        ),
    ]);
  }
}

class MediaStrip extends StatelessWidget {
  const MediaStrip({super.key, required this.media});

  final List<Media> media;

  @override
  Widget build(BuildContext context) => SizedBox(
        height: 72,
        child: ListView.separated(
          scrollDirection: Axis.horizontal,
          itemCount: media.length,
          separatorBuilder: (_, _) => const SizedBox(width: 6),
          itemBuilder: (context, i) => MediaThumb(media: media[i], size: 72, all: media, index: i),
        ),
      );
}

class MediaThumb extends StatelessWidget {
  const MediaThumb({super.key, required this.media, this.size, required this.all, required this.index, this.onLongPress});

  final Media media;
  final double? size;
  final List<Media> all;
  final int index;
  final VoidCallback? onLongPress;

  @override
  Widget build(BuildContext context) => GestureDetector(
        onTap: () => pushPage(context, MediaViewer(media: all, initial: index)),
        onLongPress: onLongPress,
        child: ClipRRect(
          borderRadius: BorderRadius.circular(8),
          child: Stack(fit: StackFit.passthrough, children: [
            NetImage(media.previewUrl, width: size, height: size),
            if (media.isVideo)
              const Positioned.fill(child: Center(child: Icon(Icons.play_circle_fill, color: Colors.white, size: 32))),
            if (media.isPublic)
              const Positioned(right: 4, top: 4, child: Icon(Icons.public, color: Colors.white, size: 16)),
          ]),
        ),
      );
}

/// Grid of job media.
class MediaGrid extends StatelessWidget {
  const MediaGrid({super.key, required this.media, this.onLongPress});

  final List<Media> media;
  final void Function(Media)? onLongPress;

  @override
  Widget build(BuildContext context) {
    if (media.isEmpty) return const EmptyState(message: 'No photos or videos yet.', icon: Icons.photo_library_outlined);
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      padding: const EdgeInsets.all(8),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 3, mainAxisSpacing: 6, crossAxisSpacing: 6),
      itemCount: media.length,
      itemBuilder: (context, i) => MediaThumb(
        media: media[i],
        all: media,
        index: i,
        onLongPress: onLongPress == null ? null : () => onLongPress!(media[i]),
      ),
    );
  }
}

/// Full-screen swipeable viewer. Videos open in the system player.
class MediaViewer extends ConsumerWidget {
  const MediaViewer({super.key, required this.media, this.initial = 0});

  final List<Media> media;
  final int initial;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final api = ref.read(apiProvider);
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(backgroundColor: Colors.black, foregroundColor: Colors.white),
      body: PageView.builder(
        controller: PageController(initialPage: initial),
        itemCount: media.length,
        itemBuilder: (context, i) {
          final m = media[i];
          return Column(children: [
            Expanded(
              child: m.isVideo
                  ? Center(
                      child: FilledButton.icon(
                        style: FilledButton.styleFrom(minimumSize: const Size(160, 48)),
                        onPressed: () => launchUrl(Uri.parse(api.absoluteUrl(m.url)), mode: LaunchMode.externalApplication),
                        icon: const Icon(Icons.play_arrow),
                        label: const Text('Play video'),
                      ),
                    )
                  : InteractiveViewer(child: Center(child: NetImage(m.url, fit: BoxFit.contain))),
            ),
            if (m.caption.isNotEmpty || m.uploadedBy != null)
              Padding(
                padding: const EdgeInsets.all(16),
                child: Text(
                  [m.caption, if (m.uploadedBy != null) '— ${m.uploadedBy!.name}, ${fmtDateTime(m.createdAt)}']
                      .where((s) => s.isNotEmpty)
                      .join('\n'),
                  style: const TextStyle(color: Colors.white),
                ),
              ),
          ]);
        },
      ),
    );
  }
}

/// Captures a photo or video and uploads it to [endpoint] (the active job).
/// Device location is attached; failures queue for retry.
Future<bool> captureAndUpload(
  BuildContext context,
  WidgetRef ref, {
  required String endpoint,
  int? statusUpdateId,
  bool allowLibrary = true,
}) async {
  final choice = await showModalBottomSheet<String>(
    context: context,
    builder: (ctx) => SafeArea(
      child: Wrap(children: [
        ListTile(leading: const Icon(Icons.photo_camera), title: const Text('Take photo'), onTap: () => Navigator.pop(ctx, 'photo')),
        ListTile(leading: const Icon(Icons.videocam), title: const Text('Record video'), onTap: () => Navigator.pop(ctx, 'video')),
        if (allowLibrary)
          ListTile(leading: const Icon(Icons.photo_library), title: const Text('From library'), onTap: () => Navigator.pop(ctx, 'library')),
      ]),
    ),
  );
  if (choice == null) return false;
  final picker = ImagePicker();
  final XFile? file = switch (choice) {
    'photo' => await picker.pickImage(source: ImageSource.camera, maxWidth: 2560, imageQuality: 85),
    'video' => await picker.pickVideo(source: ImageSource.camera, maxDuration: const Duration(minutes: 5)),
    _ => await picker.pickMedia(maxWidth: 2560, imageQuality: 85),
  };
  if (file == null || !context.mounted) return false;

  final captionCtl = TextEditingController();
  final caption = await showDialog<String>(
    context: context,
    builder: (ctx) => AlertDialog(
      title: const Text('Add a caption'),
      content: TextField(controller: captionCtl, decoration: const InputDecoration(hintText: 'Optional')),
      actions: [
        TextButton(onPressed: () => Navigator.pop(ctx, null), child: const Text('Cancel')),
        TextButton(onPressed: () => Navigator.pop(ctx, captionCtl.text.trim()), child: const Text('Upload')),
      ],
    ),
  );
  captionCtl.dispose();
  if (caption == null || !context.mounted) return false;

  final pos = await LocationTracker.currentPosition();
  if (!context.mounted) return false;
  final uploader = ref.read(mediaUploaderProvider);
  var sent = false;
  final ok = await runAction(context, () async {
    sent = await uploader.upload(PendingUpload(
      path: file.path,
      endpoint: endpoint,
      caption: caption,
      latitude: pos?.latitude,
      longitude: pos?.longitude,
      statusUpdateId: statusUpdateId,
      createdAt: DateTime.now(),
    ));
  });
  if (ok && context.mounted) {
    showMessage(context, sent ? 'Uploaded' : 'No connection — upload queued and will retry automatically');
  }
  return ok && sent;
}

/// Contact buttons for a person (call / text / email).
class ContactButtons extends StatelessWidget {
  const ContactButtons({super.key, this.phone, this.email, this.subject});

  final String? phone, email, subject;

  @override
  Widget build(BuildContext context) => Row(mainAxisSize: MainAxisSize.min, children: [
        if (phone != null && phone!.isNotEmpty) ...[
          IconButton(tooltip: 'Call', icon: const Icon(Icons.call), onPressed: () => Launchers.call(phone!)),
          IconButton(tooltip: 'Text', icon: const Icon(Icons.sms), onPressed: () => Launchers.text(phone!)),
        ],
        if (email != null && email!.isNotEmpty)
          IconButton(tooltip: 'Email', icon: const Icon(Icons.email), onPressed: () => Launchers.email(email!, subject: subject)),
      ]);
}
