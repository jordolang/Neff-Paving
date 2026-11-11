import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../core/api_client.dart';
import '../core/json.dart';
import '../core/session.dart';

// ---------------------------------------------------------------- formatting

final _date = DateFormat.yMMMd();
final _dateTime = DateFormat.yMMMd().add_jm();
final _time = DateFormat.jm();

String fmtDate(DateTime? d) => d == null ? '—' : _date.format(d);
String fmtDateTime(DateTime? d) => d == null ? '—' : _dateTime.format(d);
String fmtTime(DateTime? d) => d == null ? '—' : _time.format(d);

/// Formats a date-only API string ("2026-12-24").
String fmtApiDate(String? s) {
  if (s == null || s.isEmpty) return '—';
  final d = DateTime.tryParse(s);
  return d == null ? s : _date.format(d);
}

String fmtDuration(Duration d) {
  final h = d.inHours;
  final m = d.inMinutes.remainder(60);
  final s = d.inSeconds.remainder(60);
  return '${h.toString().padLeft(2, '0')}:${m.toString().padLeft(2, '0')}:${s.toString().padLeft(2, '0')}';
}

String humanize(String key) => key.isEmpty
    ? key
    : key.replaceAll('_', ' ').replaceFirst(key[0], key[0].toUpperCase());

// ------------------------------------------------------------------ feedback

void showMessage(BuildContext context, String message, {bool error = false}) {
  final messenger = ScaffoldMessenger.maybeOf(context);
  messenger?.hideCurrentSnackBar();
  messenger?.showSnackBar(SnackBar(
    content: Text(message),
    backgroundColor: error ? Theme.of(context).colorScheme.error : null,
  ));
}

/// Runs [action], showing API errors as a snackbar. Returns true on success.
Future<bool> runAction(BuildContext context, Future<void> Function() action, {String? success}) async {
  try {
    await action();
    if (success != null && context.mounted) showMessage(context, success);
    return true;
  } on ApiException catch (e) {
    if (context.mounted) showMessage(context, e.message, error: true);
  } catch (e) {
    if (context.mounted) showMessage(context, 'Error: $e', error: true);
  }
  return false;
}

Future<bool> confirm(BuildContext context, String title, String message, {String action = 'Confirm'}) async =>
    await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(title),
        content: Text(message),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          FilledButton(
            style: FilledButton.styleFrom(minimumSize: const Size(64, 40)),
            onPressed: () => Navigator.pop(ctx, true),
            child: Text(action),
          ),
        ],
      ),
    ) ??
    false;

// ------------------------------------------------------------- async loading

/// Lets a parent ask an [AsyncView] / [AsyncList] to reload.
class Reloader extends ChangeNotifier {
  void reload() => notifyListeners();
}

/// Loads [load] and renders [builder]; spinner, error + retry, pull to refresh.
class AsyncView<T> extends StatefulWidget {
  const AsyncView({super.key, required this.load, required this.builder, this.reloader, this.scrollable = true});

  final Future<T> Function() load;
  final Widget Function(BuildContext context, T data, Future<void> Function() reload) builder;
  final Reloader? reloader;

  /// Wrap in a RefreshIndicator (child must be scrollable).
  final bool scrollable;

  @override
  State<AsyncView<T>> createState() => _AsyncViewState<T>();
}

class _AsyncViewState<T> extends State<AsyncView<T>> {
  late Future<T> _future;
  T? _last;

  @override
  void initState() {
    super.initState();
    _future = widget.load();
    widget.reloader?.addListener(_onExternal);
  }

  @override
  void dispose() {
    widget.reloader?.removeListener(_onExternal);
    super.dispose();
  }

  void _onExternal() => reload();

  Future<void> reload() async {
    final f = widget.load();
    setState(() => _future = f);
    try {
      await f;
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) => FutureBuilder<T>(
        future: _future,
        builder: (context, snap) {
          if (snap.hasData) _last = snap.data;
          if (snap.hasError && snap.connectionState == ConnectionState.done) {
            return ErrorRetry(error: snap.error!, onRetry: reload);
          }
          final data = snap.hasData ? snap.data as T : _last;
          if (data == null) return const Center(child: CircularProgressIndicator());
          final child = widget.builder(context, data, reload);
          return widget.scrollable ? RefreshIndicator(onRefresh: reload, child: child) : child;
        },
      );
}

/// A refreshable list backed by an API call.
class AsyncList<T> extends StatelessWidget {
  const AsyncList({
    super.key,
    required this.load,
    required this.itemBuilder,
    this.empty = 'Nothing here yet.',
    this.emptyIcon = Icons.inbox_outlined,
    this.header,
    this.reloader,
  });

  final Future<List<T>> Function() load;
  final Widget Function(BuildContext context, T item, Future<void> Function() reload) itemBuilder;
  final String empty;
  final IconData emptyIcon;
  final Widget? header;
  final Reloader? reloader;

  @override
  Widget build(BuildContext context) => AsyncView<List<T>>(
        load: load,
        reloader: reloader,
        builder: (context, items, reload) => ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.only(bottom: 96, top: 4),
          children: [
            ?header,
            if (items.isEmpty) EmptyState(message: empty, icon: emptyIcon),
            for (final item in items) itemBuilder(context, item, reload),
          ],
        ),
      );
}

/// Scaffold + [AsyncList] + optional create button.
class ListScreen<T> extends StatefulWidget {
  const ListScreen({
    super.key,
    required this.title,
    required this.load,
    required this.itemBuilder,
    this.empty = 'Nothing here yet.',
    this.fabLabel,
    this.onCreate,
    this.header,
    this.actions = const [],
    this.embedded = false,
  });

  final String title;
  final Future<List<T>> Function() load;
  final Widget Function(BuildContext context, T item, Future<void> Function() reload) itemBuilder;
  final String empty;
  final String? fabLabel;

  /// Return true to reload the list afterwards.
  final Future<bool> Function(BuildContext context)? onCreate;
  final Widget? header;
  final List<Widget> actions;

  /// Inside the home shell: no own AppBar.
  final bool embedded;

  @override
  State<ListScreen<T>> createState() => _ListScreenState<T>();
}

class _ListScreenState<T> extends State<ListScreen<T>> {
  final _reloader = Reloader();

  @override
  Widget build(BuildContext context) {
    final list = AsyncList<T>(
      load: widget.load,
      itemBuilder: widget.itemBuilder,
      empty: widget.empty,
      header: widget.header,
      reloader: _reloader,
    );
    final fab = widget.onCreate == null
        ? null
        : FloatingActionButton.extended(
            heroTag: widget.title,
            icon: const Icon(Icons.add),
            label: Text(widget.fabLabel ?? 'New'),
            onPressed: () async {
              if (await widget.onCreate!(context)) _reloader.reload();
            },
          );
    return Scaffold(
      appBar: widget.embedded ? null : AppBar(title: Text(widget.title), actions: widget.actions),
      body: list,
      floatingActionButton: fab,
    );
  }
}

class ErrorRetry extends StatelessWidget {
  const ErrorRetry({super.key, required this.error, required this.onRetry});

  final Object error;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) => ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(32),
        children: [
          Icon(
            error is ApiException && (error as ApiException).isNetwork ? Icons.cloud_off : Icons.error_outline,
            size: 48,
            color: Theme.of(context).colorScheme.error,
          ),
          const SizedBox(height: 12),
          Text(error.toString(), textAlign: TextAlign.center),
          const SizedBox(height: 12),
          Center(child: OutlinedButton.icon(onPressed: onRetry, icon: const Icon(Icons.refresh), label: const Text('Retry'))),
        ],
      );
}

class EmptyState extends StatelessWidget {
  const EmptyState({super.key, required this.message, this.icon = Icons.inbox_outlined});

  final String message;
  final IconData icon;

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 64, horizontal: 32),
        child: Column(children: [
          Icon(icon, size: 48, color: Theme.of(context).colorScheme.outline),
          const SizedBox(height: 12),
          Text(message, textAlign: TextAlign.center, style: TextStyle(color: Theme.of(context).colorScheme.outline)),
        ]),
      );
}

// ------------------------------------------------------------------- pieces

class StatusChip extends StatelessWidget {
  const StatusChip(this.status, {super.key});

  final String status;

  @override
  Widget build(BuildContext context) {
    final s = status.toLowerCase();
    final cs = Theme.of(context).colorScheme;
    final color = switch (s) {
      'completed' || 'approved' || 'paid' || 'accepted' || 'succeeded' => Colors.green,
      'cancelled' || 'denied' || 'declined' || 'rejected' || 'void' || 'failed' || 'overdue' => cs.error,
      'in_progress' || 'in progress' || 'sent' || 'submitted' || 'partial' => Colors.blue,
      'on_hold' || 'on hold' || 'pending' || 'requested' || 'in_review' => Colors.orange,
      _ => cs.outline,
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withValues(alpha: 0.6)),
      ),
      child: Text(humanize(s), style: TextStyle(color: color, fontSize: 12, fontWeight: FontWeight.w600)),
    );
  }
}

class SectionHeader extends StatelessWidget {
  const SectionHeader(this.title, {super.key, this.trailing});

  final String title;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.fromLTRB(16, 16, 8, 4),
        child: Row(children: [
          Expanded(
            child: Text(title.toUpperCase(),
                style: Theme.of(context).textTheme.labelLarge?.copyWith(
                      color: Theme.of(context).colorScheme.primary,
                      letterSpacing: 1.1,
                    )),
          ),
          ?trailing,
        ]),
      );
}

class InfoRow extends StatelessWidget {
  const InfoRow(this.icon, this.label, this.value, {super.key, this.onTap});

  final IconData icon;
  final String label;
  final String value;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) => ListTile(
        dense: true,
        leading: Icon(icon),
        title: Text(value.isEmpty ? '—' : value),
        subtitle: Text(label),
        onTap: onTap,
        trailing: onTap == null ? null : const Icon(Icons.chevron_right),
      );
}

/// Network image resolved against the API host, cached on disk.
class NetImage extends ConsumerWidget {
  const NetImage(this.url, {super.key, this.fit = BoxFit.cover, this.width, this.height});

  final String url;
  final BoxFit fit;
  final double? width, height;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final api = ref.watch(apiProvider);
    final token = ref.watch(tokenStoreProvider).accessToken;
    return CachedNetworkImage(
      imageUrl: api.absoluteUrl(url),
      httpHeaders: token == null ? null : {'Authorization': 'Bearer $token'},
      fit: fit,
      width: width,
      height: height,
      placeholder: (_, _) => Container(color: Theme.of(context).colorScheme.surfaceContainerHighest),
      errorWidget: (_, _, _) => Container(
        color: Theme.of(context).colorScheme.surfaceContainerHighest,
        child: const Icon(Icons.broken_image_outlined),
      ),
    );
  }
}

class UserAvatar extends StatelessWidget {
  const UserAvatar({super.key, this.url, required this.initials, this.radius = 20});

  final String? url;
  final String initials;
  final double radius;

  @override
  Widget build(BuildContext context) => CircleAvatar(
        radius: radius,
        child: url == null || url!.isEmpty
            ? Text(initials)
            : ClipOval(child: NetImage(url!, width: radius * 2, height: radius * 2)),
      );
}

String initialsOf(String name) {
  final parts = name.trim().split(RegExp(r'\s+')).where((p) => p.isNotEmpty).toList();
  if (parts.isEmpty) return '?';
  return parts.take(2).map((p) => p[0].toUpperCase()).join();
}

class StarRating extends StatelessWidget {
  const StarRating(this.rating, {super.key, this.onChanged, this.size = 20});

  final int rating;
  final ValueChanged<int>? onChanged;
  final double size;

  @override
  Widget build(BuildContext context) => Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          for (var i = 1; i <= 5; i++)
            GestureDetector(
              onTap: onChanged == null ? null : () => onChanged!(i),
              child: Icon(i <= rating ? Icons.star : Icons.star_border, color: Colors.amber, size: size),
            ),
        ],
      );
}

class StatTile extends StatelessWidget {
  const StatTile({super.key, required this.label, required this.value, required this.icon, this.onTap});

  final String label, value;
  final IconData icon;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) => Card(
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(12),
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Icon(icon, color: Theme.of(context).colorScheme.primary),
              const SizedBox(height: 8),
              Text(value, style: Theme.of(context).textTheme.headlineSmall),
              Text(label, style: Theme.of(context).textTheme.bodySmall),
            ]),
          ),
        ),
      );
}

// --------------------------------------------------------------------- forms

enum FieldKind { text, multiline, email, phone, number, decimal, password, date, dateTime, dropdown, toggle }

/// Declarative field for [showFormSheet].
class FieldSpec {
  const FieldSpec(
    this.key,
    this.label, {
    this.kind = FieldKind.text,
    this.initial,
    this.required = false,
    this.options = const {},
    this.hint,
    this.validator,
  });

  final String key, label;
  final FieldKind kind;

  /// String for text kinds, DateTime for dates, bool for toggles,
  /// option value for dropdowns.
  final Object? initial;
  final bool required;

  /// Dropdown options: value → label.
  final Map<String, String> options;
  final String? hint;
  final String? Function(String value)? validator;
}

/// Shows a modal form. Values: String for text kinds (dates as API strings —
/// `YYYY-MM-DD` for [FieldKind.date], ISO UTC for [FieldKind.dateTime]),
/// bool for toggles. Returns true when [onSubmit] succeeded.
Future<bool> showFormSheet(
  BuildContext context, {
  required String title,
  required List<FieldSpec> fields,
  required Future<void> Function(Json values) onSubmit,
  String submitLabel = 'Save',
  Widget? intro,
}) async =>
    await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (_) => _FormSheet(title: title, fields: fields, onSubmit: onSubmit, submitLabel: submitLabel, intro: intro),
    ) ??
    false;

class _FormSheet extends StatefulWidget {
  const _FormSheet({required this.title, required this.fields, required this.onSubmit, required this.submitLabel, this.intro});

  final String title;
  final List<FieldSpec> fields;
  final Future<void> Function(Json values) onSubmit;
  final String submitLabel;
  final Widget? intro;

  @override
  State<_FormSheet> createState() => _FormSheetState();
}

class _FormSheetState extends State<_FormSheet> {
  final _form = GlobalKey<FormState>();
  final _text = <String, TextEditingController>{};
  final _values = <String, Object?>{};
  bool _busy = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    for (final f in widget.fields) {
      switch (f.kind) {
        case FieldKind.toggle:
        case FieldKind.dropdown:
        case FieldKind.date:
        case FieldKind.dateTime:
          _values[f.key] = f.initial;
        default:
          _text[f.key] = TextEditingController(text: f.initial?.toString() ?? '');
      }
    }
  }

  @override
  void dispose() {
    for (final c in _text.values) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_form.currentState!.validate()) return;
    for (final f in widget.fields) {
      if (f.required && (f.kind == FieldKind.date || f.kind == FieldKind.dateTime || f.kind == FieldKind.dropdown) &&
          _values[f.key] == null) {
        setState(() => _error = '${f.label} is required');
        return;
      }
    }
    final out = <String, dynamic>{};
    for (final f in widget.fields) {
      final v = _values[f.key];
      out[f.key] = switch (f.kind) {
        FieldKind.toggle => v ?? false,
        FieldKind.dropdown => v,
        FieldKind.date => v is DateTime ? apiDate(v) : null,
        FieldKind.dateTime => v is DateTime ? apiTimestamp(v) : null,
        _ => _text[f.key]!.text.trim(),
      };
    }
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await widget.onSubmit(out);
      if (mounted) Navigator.pop(context, true);
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } catch (e) {
      setState(() => _error = '$e');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _pickDate(FieldSpec f) async {
    final current = _values[f.key] is DateTime ? _values[f.key] as DateTime : DateTime.now();
    final d = await showDatePicker(
      context: context,
      initialDate: current,
      firstDate: DateTime(2000),
      lastDate: DateTime(2100),
    );
    if (d == null || !mounted) return;
    if (f.kind == FieldKind.dateTime) {
      final t = await showTimePicker(context: context, initialTime: TimeOfDay.fromDateTime(current));
      if (t == null) return;
      setState(() => _values[f.key] = DateTime(d.year, d.month, d.day, t.hour, t.minute));
    } else {
      setState(() => _values[f.key] = d);
    }
  }

  Widget _field(FieldSpec f) {
    switch (f.kind) {
      case FieldKind.toggle:
        return SwitchListTile(
          contentPadding: EdgeInsets.zero,
          title: Text(f.label),
          subtitle: f.hint == null ? null : Text(f.hint!),
          value: (_values[f.key] as bool?) ?? false,
          onChanged: (v) => setState(() => _values[f.key] = v),
        );
      case FieldKind.dropdown:
        return DropdownButtonFormField<String>(
          initialValue: f.options.containsKey(_values[f.key]) ? _values[f.key] as String : null,
          decoration: InputDecoration(labelText: f.label, helperText: f.hint),
          items: [for (final e in f.options.entries) DropdownMenuItem(value: e.key, child: Text(e.value))],
          onChanged: (v) => setState(() => _values[f.key] = v),
          validator: (v) => f.required && v == null ? 'Required' : null,
        );
      case FieldKind.date:
      case FieldKind.dateTime:
        final v = _values[f.key] as DateTime?;
        return InputDecorator(
          decoration: InputDecoration(labelText: f.label, helperText: f.hint),
          child: InkWell(
            onTap: () => _pickDate(f),
            child: Row(children: [
              Expanded(child: Text(v == null ? 'Select…' : (f.kind == FieldKind.date ? fmtDate(v) : fmtDateTime(v)))),
              const Icon(Icons.calendar_today, size: 18),
            ]),
          ),
        );
      default:
        return TextFormField(
          controller: _text[f.key],
          obscureText: f.kind == FieldKind.password,
          maxLines: f.kind == FieldKind.multiline ? 4 : 1,
          keyboardType: switch (f.kind) {
            FieldKind.email => TextInputType.emailAddress,
            FieldKind.phone => TextInputType.phone,
            FieldKind.number => TextInputType.number,
            FieldKind.decimal => const TextInputType.numberWithOptions(decimal: true),
            FieldKind.multiline => TextInputType.multiline,
            _ => TextInputType.text,
          },
          decoration: InputDecoration(labelText: f.label, hintText: f.hint),
          validator: (raw) {
            final v = (raw ?? '').trim();
            if (f.required && v.isEmpty) return 'Required';
            if (v.isNotEmpty && f.kind == FieldKind.decimal && double.tryParse(v.replaceAll(',', '')) == null) {
              return 'Enter a number';
            }
            if (v.isNotEmpty && f.kind == FieldKind.number && int.tryParse(v) == null) return 'Enter a whole number';
            if (v.isNotEmpty && f.kind == FieldKind.email && !v.contains('@')) return 'Enter a valid email';
            return f.validator?.call(v);
          },
        );
    }
  }

  @override
  Widget build(BuildContext context) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(context).bottom),
        child: Form(
          key: _form,
          child: ListView(
            shrinkWrap: true,
            padding: const EdgeInsets.fromLTRB(20, 20, 20, 24),
            children: [
              Text(widget.title, style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 12),
              ?widget.intro,
              for (final f in widget.fields) Padding(padding: const EdgeInsets.only(bottom: 12), child: _field(f)),
              if (_error != null)
                Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: Text(_error!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
                ),
              FilledButton(
                onPressed: _busy ? null : _submit,
                child: _busy
                    ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                    : Text(widget.submitLabel),
              ),
            ],
          ),
        ),
      );
}

/// Picks one item from a loaded list (customers, crews, jobs, users…).
Future<T?> pickFrom<T>(
  BuildContext context, {
  required String title,
  required Future<List<T>> Function() load,
  required String Function(T) label,
  String Function(T)? subtitle,
}) =>
    showModalBottomSheet<T>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (ctx) => SizedBox(
        height: MediaQuery.sizeOf(ctx).height * 0.7,
        child: Column(children: [
          Padding(padding: const EdgeInsets.all(16), child: Text(title, style: Theme.of(ctx).textTheme.titleLarge)),
          Expanded(
            child: AsyncList<T>(
              load: load,
              itemBuilder: (c, item, _) => ListTile(
                title: Text(label(item)),
                subtitle: subtitle == null ? null : Text(subtitle(item)),
                onTap: () => Navigator.pop(c, item),
              ),
            ),
          ),
        ]),
      ),
    );

/// Push a full-screen page.
Future<T?> pushPage<T>(BuildContext context, Widget page) =>
    Navigator.of(context).push<T>(MaterialPageRoute(builder: (_) => page));
