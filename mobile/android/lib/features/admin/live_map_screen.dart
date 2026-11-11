import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:latlong2/latlong.dart';

import '../../core/json.dart';
import '../../core/models.dart';
import '../../core/session.dart';
import '../../services/launchers.dart';
import '../../ui/map_widgets.dart';
import '../../ui/widgets.dart';

/// Owners' live map of everyone currently clocked in. Refreshes every 15 s;
/// tap a person to see today's trail.
class LiveMapScreen extends ConsumerStatefulWidget {
  const LiveMapScreen({super.key});

  @override
  ConsumerState<LiveMapScreen> createState() => _LiveMapScreenState();
}

class _LiveMapScreenState extends ConsumerState<LiveMapScreen> {
  final _map = MapController();
  List<LiveLocation> _people = [];
  LiveLocation? _selected;
  List<LatLng> _trail = [];
  Object? _error;
  DateTime? _updatedAt;
  Timer? _timer;
  bool _fitted = false;
  bool _showList = false;

  // Zanesville, OH — sensible default before the first fix arrives.
  static const _home = LatLng(39.9403, -82.0132);

  @override
  void initState() {
    super.initState();
    _refresh();
    _timer = Timer.periodic(const Duration(seconds: 15), (_) => _refresh());
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  Future<void> _refresh() async {
    try {
      final people = await ref.read(apiProvider).listOf('/admin/tracking/live', LiveLocation.fromJson);
      if (!mounted) return;
      setState(() {
        _people = people;
        _error = null;
        _updatedAt = DateTime.now();
        if (_selected != null) {
          _selected = people.where((p) => p.userId == _selected!.userId).firstOrNull;
          if (_selected == null) _trail = [];
        }
      });
      if (!_fitted && people.isNotEmpty) {
        _fitted = true;
        _fitAll();
      }
      if (_selected != null) unawaited(_loadTrail(_selected!));
    } catch (e) {
      if (mounted) setState(() => _error = e);
    }
  }

  void _fitAll() {
    if (_people.isEmpty) return;
    if (_people.length == 1) {
      _map.move(LatLng(_people.first.latitude, _people.first.longitude), 14);
      return;
    }
    _map.fitCamera(CameraFit.coordinates(
      coordinates: [for (final p in _people) LatLng(p.latitude, p.longitude)],
      padding: const EdgeInsets.all(60),
      maxZoom: 15,
    ));
  }

  Future<void> _loadTrail(LiveLocation p) async {
    try {
      final today = apiDate(DateTime.now());
      final pts = await ref.read(apiProvider).listOf('/admin/tracking/${p.userId}/trail', TrailPoint.fromJson,
          query: {'date': today});
      if (mounted && _selected?.userId == p.userId) {
        setState(() => _trail = [for (final t in pts) LatLng(t.latitude, t.longitude)]);
      }
    } catch (e) {
      if (mounted) showMessage(context, '$e', error: true);
    }
  }

  void _select(LiveLocation p) {
    setState(() {
      _selected = p;
      _trail = [];
      _showList = false;
    });
    _map.move(LatLng(p.latitude, p.longitude), 15);
    _loadTrail(p);
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Stack(children: [
      FlutterMap(
        mapController: _map,
        options: MapOptions(
          initialCenter: _home,
          initialZoom: 10,
          onTap: (_, _) => setState(() {
            _selected = null;
            _trail = [];
          }),
        ),
        children: [
          osmTiles(),
          if (_trail.length > 1)
            PolylineLayer(polylines: [Polyline(points: _trail, strokeWidth: 4, color: cs.primary)]),
          MarkerLayer(markers: [
            for (final p in _people)
              Marker(
                point: LatLng(p.latitude, p.longitude),
                width: 120,
                height: 64,
                alignment: Alignment.topCenter,
                child: GestureDetector(
                  onTap: () => _select(p),
                  child: Column(mainAxisSize: MainAxisSize.min, children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: p.userId == _selected?.userId ? cs.primary : cs.surface,
                        borderRadius: BorderRadius.circular(8),
                        boxShadow: const [BoxShadow(blurRadius: 3, color: Colors.black26)],
                      ),
                      child: Text(
                        p.name.split(' ').first,
                        style: TextStyle(
                          fontSize: 12,
                          color: p.userId == _selected?.userId ? cs.onPrimary : cs.onSurface,
                        ),
                      ),
                    ),
                    Icon(Icons.person_pin_circle, size: 36, color: _stale(p) ? Colors.grey : cs.primary),
                  ]),
                ),
              ),
          ]),
          osmAttribution(),
        ],
      ),
      Positioned(
        top: 8,
        left: 8,
        right: 8,
        child: Card(
          child: ListTile(
            dense: true,
            leading: Icon(_error == null ? Icons.sensors : Icons.cloud_off, color: _error == null ? Colors.green : cs.error),
            title: Text('${_people.length} clocked in'),
            subtitle: Text(_error != null ? '$_error' : 'Updated ${fmtTime(_updatedAt)} · refreshes every 15 s'),
            trailing: Row(mainAxisSize: MainAxisSize.min, children: [
              IconButton(tooltip: 'Fit all', icon: const Icon(Icons.fit_screen), onPressed: _fitAll),
              IconButton(
                tooltip: 'List',
                icon: Icon(_showList ? Icons.map : Icons.list),
                onPressed: () => setState(() => _showList = !_showList),
              ),
            ]),
          ),
        ),
      ),
      if (_showList)
        Positioned(
          top: 80,
          left: 8,
          right: 8,
          bottom: 8,
          child: Card(
            child: _people.isEmpty
                ? const EmptyState(message: 'Nobody is clocked in.', icon: Icons.person_off)
                : ListView(children: [
                    for (final p in _people)
                      ListTile(
                        leading: UserAvatar(url: p.avatarUrl, initials: initialsOf(p.name)),
                        title: Text(p.name),
                        subtitle: Text('${p.role.label} · ${p.currentJob?.name ?? 'No job'} · seen ${fmtTime(p.recordedAt)}'),
                        onTap: () => _select(p),
                      ),
                  ]),
          ),
        ),
      if (_selected != null && !_showList)
        Positioned(
          left: 8,
          right: 8,
          bottom: 8,
          child: Card(
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 4),
              child: Column(mainAxisSize: MainAxisSize.min, children: [
                ListTile(
                  leading: UserAvatar(url: _selected!.avatarUrl, initials: initialsOf(_selected!.name)),
                  title: Text(_selected!.name),
                  subtitle: Text([
                    _selected!.role.label,
                    'Clocked in ${fmtTime(_selected!.clockedInAt)}',
                    if (_selected!.currentJob != null) 'Job: ${_selected!.currentJob!.name}',
                    'Last fix ${fmtTime(_selected!.recordedAt)}'
                        '${_selected!.accuracy != null ? ' (±${_selected!.accuracy!.round()} m)' : ''}',
                    if (_selected!.speed != null) '${(_selected!.speed! * 2.23694).toStringAsFixed(0)} mph',
                    if (_selected!.batteryLevel != null) 'Battery ${(_selected!.batteryLevel! * 100).round()}%',
                  ].join(' · ')),
                ),
                OverflowBar(children: [
                  Text('${_trail.length} trail points today  '),
                  TextButton.icon(
                    icon: const Icon(Icons.navigation),
                    label: const Text('Navigate to'),
                    onPressed: () => Launchers.navigateTo(latitude: _selected!.latitude, longitude: _selected!.longitude),
                  ),
                ]),
              ]),
            ),
          ),
        ),
    ]);
  }

  bool _stale(LiveLocation p) =>
      p.recordedAt == null || DateTime.now().difference(p.recordedAt!) > const Duration(minutes: 10);
}
