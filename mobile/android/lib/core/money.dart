import 'package:intl/intl.dart';

/// Exact money value held as integer cents.
///
/// The API sends money as decimal strings ("1250.00") so it never passes
/// through a binary double. Parse with [Money.parse], send back with
/// [toApi], show with [format].
class Money implements Comparable<Money> {
  const Money.cents(this.cents);

  static const zero = Money.cents(0);

  final int cents;

  /// Parses "1250", "1250.5", "1,250.00", "-3.10", "$12.34".
  /// Fractions beyond two places round half away from zero.
  /// Returns [zero] for null/empty; throws [FormatException] on garbage.
  factory Money.parse(Object? raw) {
    if (raw == null) return zero;
    if (raw is int) return Money.cents(raw * 100);
    if (raw is num) return Money.parse(raw.toString());
    var s = raw.toString().trim().replaceAll(',', '').replaceAll(r'$', '');
    if (s.isEmpty) return zero;
    var negative = false;
    if (s.startsWith('-')) {
      negative = true;
      s = s.substring(1);
    } else if (s.startsWith('+')) {
      s = s.substring(1);
    }
    if (!RegExp(r'^\d*(\.\d*)?$').hasMatch(s) || s == '.' ) {
      throw FormatException('Not a money value', raw);
    }
    final parts = s.split('.');
    final whole = parts[0].isEmpty ? 0 : int.parse(parts[0]);
    var frac = parts.length > 1 ? parts[1] : '';
    var cents = whole * 100;
    if (frac.length <= 2) {
      cents += int.parse(frac.padRight(2, '0'));
    } else {
      cents += int.parse(frac.substring(0, 2));
      if (frac.codeUnitAt(2) - 48 >= 5) cents += 1;
    }
    return Money.cents(negative ? -cents : cents);
  }

  /// Null for a missing/blank value or garbage, otherwise the parsed amount.
  /// Use for optional money fields where "absent" differs from zero.
  static Money? parseOrNull(Object? raw) {
    if (raw == null || raw.toString().trim().isEmpty) return null;
    return tryParse(raw);
  }

  /// Lenient parse for user input: returns null instead of throwing.
  static Money? tryParse(Object? raw) {
    try {
      return Money.parse(raw);
    } on FormatException {
      return null;
    }
  }

  bool get isZero => cents == 0;
  bool get isNegative => cents < 0;

  Money operator +(Money o) => Money.cents(cents + o.cents);
  Money operator -(Money o) => Money.cents(cents - o.cents);
  bool operator >(Money o) => cents > o.cents;
  bool operator <(Money o) => cents < o.cents;
  bool operator >=(Money o) => cents >= o.cents;
  bool operator <=(Money o) => cents <= o.cents;

  /// Multiplies by a decimal quantity string such as "2.5", rounding to cents.
  Money timesQuantity(String quantity) {
    final q = Money.parse(quantity); // quantity in hundredths
    final product = cents * q.cents; // cents * hundredths
    final rounded = (product.abs() + 50) ~/ 100;
    return Money.cents(product < 0 ? -rounded : rounded);
  }

  /// Decimal string for the API: "1250.00", "-3.10".
  String toApi() {
    final abs = cents.abs();
    final s = '${abs ~/ 100}.${(abs % 100).toString().padLeft(2, '0')}';
    return cents < 0 ? '-$s' : s;
  }

  static final _fmt = NumberFormat.currency(locale: 'en_US', symbol: r'$');

  /// "$1,250.00"
  String format() {
    final abs = cents.abs();
    final body = _fmt.format(abs ~/ 100).replaceAll('.00', '');
    final s = '$body.${(abs % 100).toString().padLeft(2, '0')}';
    return cents < 0 ? '-$s' : s;
  }

  @override
  int compareTo(Money other) => cents.compareTo(other.cents);

  @override
  bool operator ==(Object other) => other is Money && other.cents == cents;

  @override
  int get hashCode => cents.hashCode;

  @override
  String toString() => toApi();
}
