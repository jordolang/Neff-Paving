import 'package:flutter/material.dart';

import '../core/company_config.dart';

ThemeData buildTheme(CompanyConfig c, Brightness brightness) {
  final scheme = ColorScheme.fromSeed(
    seedColor: c.primary,
    brightness: brightness,
  ).copyWith(
    primary: c.primary,
    onPrimary: c.onPrimary,
    surface: brightness == Brightness.dark ? c.surfaceDark : null,
  );
  return ThemeData(
    useMaterial3: true,
    colorScheme: scheme,
    appBarTheme: AppBarTheme(
      backgroundColor: brightness == Brightness.dark ? c.surfaceDark : c.primary,
      foregroundColor: brightness == Brightness.dark ? c.primary : c.onPrimary,
      centerTitle: false,
    ),
    inputDecorationTheme: const InputDecorationTheme(border: OutlineInputBorder()),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(48)),
    ),
    cardTheme: const CardThemeData(margin: EdgeInsets.symmetric(horizontal: 12, vertical: 6)),
  );
}
