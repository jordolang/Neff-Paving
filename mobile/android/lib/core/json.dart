/// Small, defensive JSON readers so a missing or oddly typed field never
/// crashes a screen.
typedef Json = Map<String, dynamic>;

int asInt(Object? v, [int fallback = 0]) {
  if (v is int) return v;
  if (v is num) return v.toInt();
  if (v is String) return int.tryParse(v) ?? fallback;
  return fallback;
}

int? asIntOrNull(Object? v) => v == null ? null : asInt(v);

double? asDouble(Object? v) {
  if (v is num) return v.toDouble();
  if (v is String) return double.tryParse(v);
  return null;
}

String asString(Object? v, [String fallback = '']) =>
    v == null ? fallback : v.toString();

String? asStringOrNull(Object? v) => v?.toString();

bool asBool(Object? v, [bool fallback = false]) {
  if (v is bool) return v;
  if (v is num) return v != 0;
  if (v is String) return v == 'true' || v == '1';
  return fallback;
}

DateTime? asDate(Object? v) {
  if (v == null) return null;
  return DateTime.tryParse(v.toString())?.toLocal();
}

Json asMap(Object? v) => v is Map ? Map<String, dynamic>.from(v) : <String, dynamic>{};

Json? asMapOrNull(Object? v) => v is Map ? Map<String, dynamic>.from(v) : null;

List<T> asList<T>(Object? v, T Function(Json) parse) => v is List
    ? v.whereType<Map>().map((e) => parse(Map<String, dynamic>.from(e))).toList()
    : <T>[];

List<String> asStringList(Object? v) =>
    v is List ? v.map((e) => e.toString()).toList() : <String>[];

/// Formats a date as `YYYY-MM-DD` for date-only API fields.
String apiDate(DateTime d) =>
    '${d.year.toString().padLeft(4, '0')}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';

/// UTC ISO-8601 timestamp for API date-time fields.
String apiTimestamp(DateTime d) => d.toUtc().toIso8601String();
