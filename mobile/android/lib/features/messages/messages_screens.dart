import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/json.dart';
import '../../core/models.dart';
import '../../core/session.dart';
import '../../ui/widgets.dart';

/// Starts a new conversation. Customers reach the office; employees can pick
/// "Owners" (admins) — "communicate with owners".
Future<void> startThread(
  BuildContext context,
  WidgetRef ref, {
  String? subject,
  int? jobId,
  String? toRole,
  int? toUserId,
}) async {
  final user = ref.read(currentUserProvider);
  final api = ref.read(apiProvider);
  MessageThread? created;
  final ok = await showFormSheet(
    context,
    title: 'New message',
    submitLabel: 'Send',
    fields: [
      if (toRole == null && toUserId == null && (user?.isInternal ?? false))
        const FieldSpec('toRole', 'To', kind: FieldKind.dropdown, initial: 'admin', options: {
          'admin': 'Owners',
          'office_staff': 'Office',
        }),
      FieldSpec('subject', 'Subject', initial: subject, required: true),
      const FieldSpec('body', 'Message', kind: FieldKind.multiline, required: true),
    ],
    onSubmit: (v) async {
      created = MessageThread.fromJson(asMap(await api.post('/threads', {
        'subject': v['subject'],
        'body': v['body'],
        'jobId': ?jobId,
        'toUserId': ?toUserId,
        if ((toRole ?? v['toRole']) != null) 'toRole': toRole ?? v['toRole'],
      })));
    },
  );
  if (ok && created != null && context.mounted) {
    await pushPage(context, ThreadScreen(thread: created!));
  }
}

class ThreadsScreen extends ConsumerStatefulWidget {
  const ThreadsScreen({super.key});

  @override
  ConsumerState<ThreadsScreen> createState() => _ThreadsScreenState();
}

class _ThreadsScreenState extends ConsumerState<ThreadsScreen> {
  final _reloader = Reloader();

  @override
  Widget build(BuildContext context) {
    final api = ref.read(apiProvider);
    final company = ref.watch(companyConfigProvider);
    return Scaffold(
      body: AsyncList<MessageThread>(
        reloader: _reloader,
        load: () => api.listOf('/threads', MessageThread.fromJson),
        empty: 'No conversations yet. Questions? Send ${company.name} a message.',
        emptyIcon: Icons.chat_bubble_outline,
        itemBuilder: (context, t, reload) => ListTile(
          leading: CircleAvatar(child: Text(initialsOf(t.subject))),
          title: Text(t.subject, style: TextStyle(fontWeight: t.unreadCount > 0 ? FontWeight.bold : null)),
          subtitle: Text(
            t.lastMessage == null ? '' : '${t.lastMessage!.sender?.name ?? ''}: ${t.lastMessage!.body}',
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          trailing: t.unreadCount > 0
              ? Badge(label: Text('${t.unreadCount}'))
              : Text(fmtDate(t.updatedAt), style: Theme.of(context).textTheme.bodySmall),
          onTap: () async {
            await pushPage(context, ThreadScreen(thread: t));
            reload();
          },
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        heroTag: 'newThread',
        icon: const Icon(Icons.edit),
        label: const Text('New message'),
        onPressed: () async {
          await startThread(context, ref);
          _reloader.reload();
        },
      ),
    );
  }
}

class ThreadScreen extends ConsumerStatefulWidget {
  const ThreadScreen({super.key, required this.thread});

  final MessageThread thread;

  @override
  ConsumerState<ThreadScreen> createState() => _ThreadScreenState();
}

class _ThreadScreenState extends ConsumerState<ThreadScreen> {
  final _text = TextEditingController();
  List<Message> _messages = [];
  Object? _error;
  bool _loading = true;
  bool _sending = false;
  Timer? _poll;

  @override
  void initState() {
    super.initState();
    _load();
    _poll = Timer.periodic(const Duration(seconds: 15), (_) => _load());
  }

  @override
  void dispose() {
    _poll?.cancel();
    _text.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    try {
      final msgs = await ref.read(apiProvider).listOf('/threads/${widget.thread.id}/messages', Message.fromJson);
      msgs.sort((a, b) => (a.createdAt ?? DateTime(0)).compareTo(b.createdAt ?? DateTime(0)));
      if (mounted) {
        setState(() {
          _messages = msgs;
          _error = null;
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e;
          _loading = false;
        });
      }
    }
  }

  Future<void> _send() async {
    final body = _text.text.trim();
    if (body.isEmpty) return;
    setState(() => _sending = true);
    final ok = await runAction(context, () => ref.read(apiProvider).post('/threads/${widget.thread.id}/messages', {'body': body}));
    if (ok) {
      _text.clear();
      await _load();
    }
    if (mounted) setState(() => _sending = false);
  }

  @override
  Widget build(BuildContext context) {
    final me = ref.watch(currentUserProvider);
    final cs = Theme.of(context).colorScheme;
    return Scaffold(
      appBar: AppBar(title: Text(widget.thread.subject)),
      body: Column(children: [
        Expanded(
          child: _loading
              ? const Center(child: CircularProgressIndicator())
              : _error != null && _messages.isEmpty
                  ? ErrorRetry(error: _error!, onRetry: _load)
                  : ListView.builder(
                      reverse: true,
                      padding: const EdgeInsets.all(12),
                      itemCount: _messages.length,
                      itemBuilder: (context, i) {
                        final m = _messages[_messages.length - 1 - i];
                        final mine = m.sender?.id == me?.id;
                        return Align(
                          alignment: mine ? Alignment.centerRight : Alignment.centerLeft,
                          child: Container(
                            constraints: BoxConstraints(maxWidth: MediaQuery.sizeOf(context).width * 0.78),
                            margin: const EdgeInsets.symmetric(vertical: 4),
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: mine ? cs.primaryContainer : cs.surfaceContainerHighest,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                              if (!mine)
                                Text(m.sender?.name ?? '', style: Theme.of(context).textTheme.labelSmall),
                              Text(m.body),
                              Text(fmtDateTime(m.createdAt), style: Theme.of(context).textTheme.labelSmall),
                            ]),
                          ),
                        );
                      },
                    ),
        ),
        SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(12, 4, 4, 8),
            child: Row(children: [
              Expanded(
                child: TextField(
                  controller: _text,
                  minLines: 1,
                  maxLines: 4,
                  decoration: const InputDecoration(hintText: 'Message'),
                ),
              ),
              IconButton(
                icon: _sending
                    ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                    : const Icon(Icons.send),
                onPressed: _sending ? null : _send,
              ),
            ]),
          ),
        ),
      ]),
    );
  }
}

class NotificationsScreen extends ConsumerStatefulWidget {
  const NotificationsScreen({super.key, this.onOpenJob});

  /// Opens a job from a notification (portal or field detail by role).
  final void Function(BuildContext context, int jobId)? onOpenJob;

  @override
  ConsumerState<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends ConsumerState<NotificationsScreen> {
  final _reloader = Reloader();

  @override
  Widget build(BuildContext context) {
    final api = ref.read(apiProvider);
    return AsyncList<AppNotification>(
      reloader: _reloader,
      load: () => api.listOf('/notifications', AppNotification.fromJson),
      empty: "You're all caught up.",
      emptyIcon: Icons.notifications_none,
      header: Align(
        alignment: Alignment.centerRight,
        child: TextButton.icon(
          icon: const Icon(Icons.done_all),
          label: const Text('Mark all read'),
          onPressed: () async {
            if (await runAction(context, () => api.post('/notifications/read-all'))) _reloader.reload();
          },
        ),
      ),
      itemBuilder: (context, n, reload) => ListTile(
        leading: Icon(_icon(n.type), color: n.isRead ? null : Theme.of(context).colorScheme.primary),
        title: Text(n.title, style: TextStyle(fontWeight: n.isRead ? null : FontWeight.bold)),
        subtitle: Text('${n.body}\n${fmtDateTime(n.createdAt)}'),
        isThreeLine: true,
        onTap: () async {
          if (!n.isRead) {
            try {
              await api.post('/notifications/${n.id}/read');
            } catch (_) {}
          }
          if (n.jobId != null && widget.onOpenJob != null && context.mounted) {
            widget.onOpenJob!(context, n.jobId!);
          }
          reload();
        },
      ),
    );
  }

  IconData _icon(String type) => switch (type) {
        'job_completed' => Icons.check_circle,
        'status_update' => Icons.timeline,
        'estimate' => Icons.request_quote,
        'invoice' => Icons.receipt_long,
        'message' => Icons.chat_bubble,
        'timeoff' => Icons.beach_access,
        'raise' => Icons.trending_up,
        'schedule' => Icons.event,
        _ => Icons.notifications,
      };
}
