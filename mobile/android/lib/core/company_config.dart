import 'package:flutter/material.dart';

/// Per-company build configuration. Each Android product flavor has a matching
/// Dart entrypoint (`lib/main_<key>.dart`) that passes one of these.
class CompanyConfig {
  const CompanyConfig({
    required this.key,
    required this.name,
    required this.primary,
    required this.onPrimary,
    required this.surfaceDark,
    required this.trackingOwnerLabel,
  });

  /// Tenant key sent as the `X-Company` header: neff | muskingum | austin.
  final String key;
  final String name;
  final Color primary;
  final Color onPrimary;
  final Color surfaceDark;

  /// Who can see an employee's location (used in the tracking disclosure).
  final String trackingOwnerLabel;

  /// API base URL. Override at build time:
  /// `--dart-define=API_BASE_URL=https://api.example.com/api/v1`.
  /// Defaults to the host machine as seen from the Android emulator.
  String get apiBaseUrl => const String.fromEnvironment(
        'API_BASE_URL',
        defaultValue: 'http://10.0.2.2:3000/api/v1',
      );

  /// Google OAuth *Web* client id used as `serverClientId` so the native
  /// sign-in returns an ID token the backend can verify.
  /// `--dart-define=GOOGLE_SERVER_CLIENT_ID=xxxx.apps.googleusercontent.com`.
  String get googleServerClientId =>
      const String.fromEnvironment('GOOGLE_SERVER_CLIENT_ID');

  static const neff = CompanyConfig(
    key: 'neff',
    name: 'Neff Paving',
    primary: Color(0xFFF5A400),
    onPrimary: Color(0xFF121212),
    surfaceDark: Color(0xFF121212),
    trackingOwnerLabel: 'Neff Paving owners',
  );

  static const muskingum = CompanyConfig(
    key: 'muskingum',
    name: 'Muskingum Materials',
    primary: Color(0xFF4E6B3A),
    onPrimary: Color(0xFFFFFFFF),
    surfaceDark: Color(0xFF1B1F17),
    trackingOwnerLabel: 'Muskingum Materials owners',
  );

  static const austin = CompanyConfig(
    key: 'austin',
    name: 'Austin Trucking',
    primary: Color(0xFF9B1B1B),
    onPrimary: Color(0xFFFFFFFF),
    surfaceDark: Color(0xFF1C1414),
    trackingOwnerLabel: 'Austin Trucking owners',
  );
}
