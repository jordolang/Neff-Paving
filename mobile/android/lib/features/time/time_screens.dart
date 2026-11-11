import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../core/json.dart';
import '../../core/models.dart';
import '../../core/permissions.dart';
import '../../core/session.dart';
import '../../services/location_tracker.dart';
import '../../ui/widgets.dart';
import '../jobs/job_widgets.dart';

const _disclosureKey = 'tracking_disclosure_ack_v1';

/// Clock in / out with the location-sharing disclosure and live status.
class ClockScreen extends ConsumerStatefulWidget {
  const ClockScreen({super.key});

  @override
  ConsumerState<ClockScreen> createState() => _ClockScreenState();
}

class _ClockScreenState extends ConsumerState<ClockScreen> {
  TimeStatus? _status;
  Object? _error;
  bool _busy = false;
  Timer? _ticker;

  @override
  void initState() {
    super.initState();
    _load();
    _ticker = Timer.periodic(const Duration(seconds: 1), (_) {
      if (_status?.clockedIn ?? false) setState(() {});
    });
  }

  @override
  void dispose() {
    _ticker?.cancel();
    super.dispose();
  }

  Future<void> _load() async {
    try {
      final s = TimeStatus.fromJson(asMap(await ref.read(apiProvider).get('/time/status')));
      final tracker = ref.read(locationTrackerProvider);
      // Keep the device in sync with the server's view of the clock.
      if (s.clockedIn && !tracker.isActive) {
        await tracker.start(pingIntervalSeconds: s.pingIntervalSeconds);
      } else if (!s.clockedIn && tracker.isActive) {
        await tracker.stop();
      }
      if (mounted) {
        setState(() {
          _status = s;
          _error = null;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _error = e);
    }
  }

  /// Plain-language disclosure required before the first clock-in.
  Future<bool> _disclosure() async {
    final prefs = await SharedPreferences.getInstance();
    if (prefs.getBool(_disclosureKey) ?? false) return true;
    if (!mounted) return false;
    final owner = ref.read(companyConfigProvider).trackingOwnerLabel;
    final ok = await showDialog<bool>(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        icon: const Icon(Icons.location_on, size: 36),
        title: const Text('Location sharing while clocked in'),
        content: Text(
          'While you are clocked in, $owner can see your location, including when the app is closed '
          'or your screen is off. A notification shows the whole time.\n\n'
          'Tracking stops when you clock out. Your location is never collected while you are off the clock.\n\n'
          'On the next screen, choose "Allow all the time" so tracking keeps working in your pocket.',
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Not now')),
          FilledButton(
            style: FilledButton.styleFrom(minimumSize: const Size(64, 40)),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('I agree'),
          ),
        ],
      ),
    );
    if (ok == true) await prefs.setBool(_disclosureKey, true);
    return ok == true;
  }

  Future<void> _clockIn() async {
    if (!await _disclosure() || !mounted) return;
    final perm = await LocationTracker.ensurePermission();
    if (!mounted) return;
    switch (perm) {
      case TrackingPermission.servicesOff:
        showMessage(context, 'Turn on Location to clock in.', error: true);
        await Geolocator.openLocationSettings();
        return;
      case TrackingPermission.denied:
        showMessage(context, 'Location permission is required to clock in.', error: true);
        await Geolocator.openAppSettings();
        return;
      case TrackingPermission.foregroundOnly:
        showMessage(context, 'Tip: set location to "Allow all the time" so tracking continues with the screen off.');
      case TrackingPermission.granted:
        break;
    }

    // Optional: which job are you starting on? (today's schedule)
    int? jobId;
    final user = ref.read(currentUserProvider)!;
    if (user.can(Perm.scheduleView)) {
      final now = DateTime.now();
      final start = DateTime(now.year, now.month, now.day);
      try {
        final today = await ref.read(apiProvider).listOf('/schedule', ScheduleEntry.fromJson, query: {
          'from': apiTimestamp(start),
          'to': apiTimestamp(start.add(const Duration(days: 1))),
        });
        final jobs = today.where((e) => e.jobId != null).toList();
        if (jobs.isNotEmpty && mounted) {
          final picked = await showModalBottomSheet<ScheduleEntry?>(
            context: context,
            builder: (ctx) => SafeArea(
              child: ListView(shrinkWrap: true, children: [
                const ListTile(title: Text('Which job are you starting?')),
                for (final e in jobs)
                  ListTile(
                    leading: const Icon(Icons.construction),
                    title: Text(e.jobTitle),
                    subtitle: Text('${fmtTime(e.start)} · ${e.address.singleLine}'),
                    onTap: () => Navigator.pop(ctx, e),
                  ),
                ListTile(leading: const Icon(Icons.schedule), title: const Text('No specific job'), onTap: () => Navigator.pop(ctx)),
              ]),
            ),
          );
          jobId = picked?.jobId;
        }
      } catch (_) {
        // Schedule unavailable; clock in without a job.
      }
    }

    setState(() => _busy = true);
    final pos = await LocationTracker.currentPosition();
    if (!mounted) return;
    await runAction(context, () async {
      await ref.read(apiProvider).post('/time/clock-in', {
        'latitude': pos?.latitude,
        'longitude': pos?.longitude,
        'jobId': ?jobId,
        'trackingConsent': true,
      });
      final s = TimeStatus.fromJson(asMap(await ref.read(apiProvider).get('/time/status')));
      await ref.read(locationTrackerProvider).start(pingIntervalSeconds: s.pingIntervalSeconds);
      if (mounted) setState(() => _status = s);
    }, success: 'Clocked in');
    if (mounted) setState(() => _busy = false);
  }

  Future<void> _clockOut() async {
    final notes = TextEditingController();
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Clock out?'),
        content: TextField(controller: notes, maxLines: 3, decoration: const InputDecoration(labelText: 'Notes (optional)')),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Clock out')),
        ],
      ),
    );
    final text = notes.text.trim();
    notes.dispose();
    if (ok != true || !mounted) return;
    setState(() => _busy = true);
    final tracker = ref.read(locationTrackerProvider);
    final pos = await LocationTracker.currentPosition();
    await tracker.flush(force: true); // still on the clock: send what we have
    if (!mounted) return;
    final done = await runAction(context, () async {
      await ref.read(apiProvider).post('/time/clock-out', {
        'latitude': pos?.latitude,
        'longitude': pos?.longitude,
        if (text.isNotEmpty) 'notes': text,
      });
    }, success: 'Clocked out — location sharing stopped');
    if (done) await tracker.stop();
    await _load();
    if (mounted) setState(() => _busy = false);
  }

  @override
  Widget build(BuildContext context) {
    final tracker = ref.watch(locationTrackerProvider);
    final user = ref.watch(currentUserProvider)!;
    final s = _status;
    if (s == null) {
      return _error != null ? ErrorRetry(error: _error!, onRetry: _load) : const Center(child: CircularProgressIndicator());
    }
    final entry = s.entry;
    final cs = Theme.of(context).colorScheme;
    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(padding: const EdgeInsets.all(16), children: [
        Card(
          color: s.clockedIn ? cs.primaryContainer : null,
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(children: [
              Icon(s.clockedIn ? Icons.timer : Icons.timer_off_outlined, size: 48),
              const SizedBox(height: 8),
              Text(s.clockedIn ? 'On the clock' : 'Off the clock', style: Theme.of(context).textTheme.titleLarge),
              if (entry != null && s.clockedIn) ...[
                const SizedBox(height: 8),
                Text(fmtDuration(entry.elapsed()), style: Theme.of(context).textTheme.displaySmall),
                Text('Since ${fmtTime(entry.clockIn)}'),
              ],
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: s.clockedIn
                    ? FilledButton.icon(
                        style: FilledButton.styleFrom(backgroundColor: cs.error, foregroundColor: cs.onError),
                        onPressed: _busy ? null : _clockOut,
                        icon: const Icon(Icons.logout),
                        label: const Text('Clock out'),
                      )
                    : FilledButton.icon(
                        onPressed: _busy ? null : _clockIn,
                        icon: const Icon(Icons.login),
                        label: const Text('Clock in'),
                      ),
              ),
            ]),
          ),
        ),
        if (s.clockedIn)
          Card(
            child: ListTile(
              leading: Icon(tracker.isActive ? Icons.my_location : Icons.location_disabled,
                  color: tracker.isActive ? Colors.green : cs.error),
              title: Text(tracker.isActive ? 'Location shared with owners' : 'Location sharing is OFF'),
              subtitle: Text([
                if (tracker.lastSentAt != null) 'Last sent ${fmtTime(tracker.lastSentAt)}',
                if (tracker.queued > 0) '${tracker.queued} queued',
                ?tracker.lastError,
              ].join(' · ')),
              trailing: tracker.isActive
                  ? null
                  : TextButton(
                      onPressed: () => tracker.start(pingIntervalSeconds: s.pingIntervalSeconds),
                      child: const Text('Resume'),
                    ),
            ),
          ),
        if (s.clockedIn && entry?.jobId != null && user.can(Perm.jobsMediaUpload))
          Card(
            child: ListTile(
              leading: const Icon(Icons.add_a_photo),
              title: const Text('Photo / video for current job'),
              subtitle: Text('Attached to job #${entry!.jobId}'),
              onTap: () => captureAndUpload(context, ref, endpoint: '/jobs/${entry.jobId}/media'),
            ),
          ),
        if (user.can(Perm.timeViewOwn))
          ListTile(
            leading: const Icon(Icons.list_alt),
            title: const Text('My time sheet'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => pushPage(context, const Scaffold(body: TimesheetScreen(), appBar: _TimesheetBar())),
          ),
      ]),
    );
  }
}

class _TimesheetBar extends StatelessWidget implements PreferredSizeWidget {
  const _TimesheetBar();

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);

  @override
  Widget build(BuildContext context) => AppBar(title: const Text('Time sheet'));
}

/// Week-by-week time sheet with "submit for approval".
class TimesheetScreen extends ConsumerStatefulWidget {
  const TimesheetScreen({super.key});

  @override
  ConsumerState<TimesheetScreen> createState() => _TimesheetScreenState();
}

class _TimesheetScreenState extends ConsumerState<TimesheetScreen> {
  late DateTime _weekStart;
  final _reloader = Reloader();

  @override
  void initState() {
    super.initState();
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    _weekStart = today.subtract(Duration(days: today.weekday % 7)); // Sunday
  }

  void _shift(int weeks) {
    setState(() => _weekStart = _weekStart.add(Duration(days: 7 * weeks)));
    _reloader.reload();
  }

  @override
  Widget build(BuildContext context) {
    final api = ref.read(apiProvider);
    final end = _weekStart.add(const Duration(days: 7));
    return Column(children: [
      Row(children: [
        IconButton(icon: const Icon(Icons.chevron_left), onPressed: () => _shift(-1)),
        Expanded(
          child: Text('${fmtDate(_weekStart)} – ${fmtDate(end.subtract(const Duration(days: 1)))}', textAlign: TextAlign.center),
        ),
        IconButton(icon: const Icon(Icons.chevron_right), onPressed: () => _shift(1)),
      ]),
      Expanded(
        child: AsyncView<List<TimeEntry>>(
          reloader: _reloader,
          load: () => api.listOf('/time/entries', TimeEntry.fromJson,
              query: {'from': apiTimestamp(_weekStart), 'to': apiTimestamp(end)}),
          builder: (context, entries, reload) {
            final total = entries.fold<double>(0, (sum, e) => sum + (double.tryParse(e.hours ?? '') ?? 0));
            return ListView(physics: const AlwaysScrollableScrollPhysics(), children: [
              ListTile(
                title: const Text('Total hours'),
                trailing: Text(total.toStringAsFixed(2), style: Theme.of(context).textTheme.titleLarge),
              ),
              const Divider(height: 1),
              if (entries.isEmpty) const EmptyState(message: 'No time this week.', icon: Icons.schedule),
              for (final e in entries)
                ListTile(
                  title: Text('${fmtDate(e.clockIn)} · ${fmtTime(e.clockIn)} – ${e.clockOut == null ? 'now' : fmtTime(e.clockOut)}'),
                  subtitle: Text([
                    if (e.hours != null) '${e.hours} h',
                    if (e.jobId != null) 'Job #${e.jobId}',
                    if (e.notes.isNotEmpty) e.notes,
                  ].join(' · ')),
                  trailing: e.status == 'open' && e.clockOut != null
                      ? TextButton(
                          onPressed: () async {
                            if (await runAction(context, () => api.post('/time/entries/${e.id}/submit'),
                                success: 'Submitted for approval')) {
                              reload();
                            }
                          },
                          child: const Text('Submit'),
                        )
                      : StatusChip(e.status),
                ),
            ]);
          },
        ),
      ),
    ]);
  }
}
