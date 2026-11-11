import 'package:url_launcher/url_launcher.dart';

import '../core/models.dart';

/// Hands off to Google Maps / dialer / SMS / email.
abstract final class Launchers {
  /// Turn-by-turn navigation to a job: `google.navigation:q=` with a
  /// Google Maps web fallback.
  static Future<bool> navigateTo({double? latitude, double? longitude, Address? address}) async {
    final query = (latitude != null && longitude != null)
        ? '$latitude,$longitude'
        : (address?.singleLine ?? '');
    if (query.isEmpty) return false;
    final nav = Uri.parse('google.navigation:q=${Uri.encodeComponent(query)}');
    if (await canLaunchUrl(nav) && await launchUrl(nav)) return true;
    final web = Uri.https('www.google.com', '/maps/dir/', {'api': '1', 'destination': query});
    return launchUrl(web, mode: LaunchMode.externalApplication);
  }

  static Future<bool> call(String phone) => launchUrl(Uri(scheme: 'tel', path: _digits(phone)));

  static Future<bool> text(String phone) => launchUrl(Uri(scheme: 'sms', path: _digits(phone)));

  static Future<bool> email(String address, {String? subject}) => launchUrl(Uri(
        scheme: 'mailto',
        path: address,
        query: subject == null ? null : 'subject=${Uri.encodeComponent(subject)}',
      ));

  static Future<bool> openUrl(String url) =>
      launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);

  static String _digits(String s) => s.replaceAll(RegExp(r'[^0-9+]'), '');
}
