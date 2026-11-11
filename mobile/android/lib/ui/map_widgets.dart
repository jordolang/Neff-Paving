import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';

/// OpenStreetMap tiles (no API key). For production volume, point
/// [osmTileUrl] at a commercial tile provider per the OSM tile usage policy.
const osmTileUrl = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const _userAgent = 'com.neffpaving.app';

TileLayer osmTiles() => TileLayer(urlTemplate: osmTileUrl, userAgentPackageName: _userAgent);

Widget osmAttribution() => const RichAttributionWidget(
      attributions: [TextSourceAttribution('OpenStreetMap contributors')],
    );

/// A small map with one pin (job service address).
class PinMap extends StatelessWidget {
  const PinMap({super.key, required this.latitude, required this.longitude, this.height = 200, this.label});

  final double latitude, longitude;
  final double height;
  final String? label;

  @override
  Widget build(BuildContext context) {
    final point = LatLng(latitude, longitude);
    return SizedBox(
      height: height,
      child: FlutterMap(
        options: MapOptions(
          initialCenter: point,
          initialZoom: 15,
          interactionOptions: const InteractionOptions(flags: InteractiveFlag.pinchZoom | InteractiveFlag.drag),
        ),
        children: [
          osmTiles(),
          MarkerLayer(markers: [
            Marker(
              point: point,
              width: 40,
              height: 40,
              alignment: Alignment.topCenter,
              child: Tooltip(
                message: label ?? '',
                child: Icon(Icons.location_on, size: 40, color: Theme.of(context).colorScheme.primary),
              ),
            ),
          ]),
          osmAttribution(),
        ],
      ),
    );
  }
}
