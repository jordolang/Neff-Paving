import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';

import '../../core/json.dart';
import '../../core/models.dart';
import '../../core/session.dart';
import '../../ui/widgets.dart';

/// First screen after sign-in for everyone: name, address, contact info,
/// photo, notification preferences and public-profile toggle.
class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(currentUserProvider);
    if (user == null) return const SizedBox.shrink();
    final api = ref.read(apiProvider);
    final session = ref.read(sessionProvider.notifier);

    Future<void> save(Json body) async => session.setUser(User.fromJson(asMap(await api.put('/me', body))));

    Json base() => {
          'firstName': user.firstName,
          'lastName': user.lastName,
          'phone': user.phone ?? '',
          'address': user.address.toJson(),
          'notificationPrefs': user.notificationPrefs.toJson(),
          'publicProfile': user.publicProfile,
        };

    Future<void> changeAvatar() async {
      final source = await showModalBottomSheet<ImageSource>(
        context: context,
        builder: (ctx) => SafeArea(
          child: Wrap(children: [
            ListTile(leading: const Icon(Icons.photo_camera), title: const Text('Take photo'), onTap: () => Navigator.pop(ctx, ImageSource.camera)),
            ListTile(leading: const Icon(Icons.photo_library), title: const Text('Choose from library'), onTap: () => Navigator.pop(ctx, ImageSource.gallery)),
          ]),
        ),
      );
      if (source == null) return;
      final file = await ImagePicker().pickImage(source: source, maxWidth: 1024, imageQuality: 85);
      if (file == null || !context.mounted) return;
      await runAction(context, () async {
        session.setUser(User.fromJson(asMap(await api.upload('/me/avatar', file.path))));
      }, success: 'Profile photo updated');
    }

    return ListView(
      padding: const EdgeInsets.only(bottom: 32),
      children: [
        const SizedBox(height: 16),
        Center(
          child: Stack(children: [
            UserAvatar(url: user.avatarUrl, initials: user.initials, radius: 48),
            Positioned(
              right: 0,
              bottom: 0,
              child: IconButton.filled(icon: const Icon(Icons.camera_alt, size: 18), onPressed: changeAvatar),
            ),
          ]),
        ),
        const SizedBox(height: 8),
        Center(child: Text(user.fullName, style: Theme.of(context).textTheme.titleLarge)),
        Center(child: Text('${user.role.label} · ${user.company?.name ?? ref.read(companyConfigProvider).name}')),
        const SectionHeader('Contact'),
        InfoRow(Icons.person_outline, 'Name', user.fullName, onTap: () => showFormSheet(
              context,
              title: 'Your name & phone',
              fields: [
                FieldSpec('firstName', 'First name', initial: user.firstName, required: true),
                FieldSpec('lastName', 'Last name', initial: user.lastName, required: true),
                FieldSpec('phone', 'Phone', kind: FieldKind.phone, initial: user.phone),
              ],
              onSubmit: (v) => save({...base(), ...v}),
            )),
        InfoRow(Icons.email_outlined, 'Email', user.email),
        InfoRow(Icons.phone_outlined, 'Phone', user.phone ?? ''),
        InfoRow(Icons.home_outlined, 'Address', user.address.singleLine, onTap: () => showFormSheet(
              context,
              title: 'Address',
              fields: [
                FieldSpec('line1', 'Street', initial: user.address.line1),
                FieldSpec('line2', 'Apt / Suite', initial: user.address.line2),
                FieldSpec('city', 'City', initial: user.address.city),
                FieldSpec('state', 'State', initial: user.address.state.isEmpty ? 'OH' : user.address.state),
                FieldSpec('zip', 'ZIP', kind: FieldKind.number, initial: user.address.zip),
              ],
              onSubmit: (v) => save({...base(), 'address': v}),
            )),
        const SectionHeader('Communications'),
        SwitchListTile(
          secondary: const Icon(Icons.notifications_outlined),
          title: const Text('Push notifications'),
          value: user.notificationPrefs.push,
          onChanged: (v) => runAction(context, () => save({
                ...base(),
                'notificationPrefs': {...user.notificationPrefs.toJson(), 'push': v},
              })),
        ),
        SwitchListTile(
          secondary: const Icon(Icons.mail_outline),
          title: const Text('Email updates'),
          value: user.notificationPrefs.email,
          onChanged: (v) => runAction(context, () => save({
                ...base(),
                'notificationPrefs': {...user.notificationPrefs.toJson(), 'email': v},
              })),
        ),
        SwitchListTile(
          secondary: const Icon(Icons.sms_outlined),
          title: const Text('Text messages'),
          value: user.notificationPrefs.sms,
          onChanged: (v) => runAction(context, () => save({
                ...base(),
                'notificationPrefs': {...user.notificationPrefs.toJson(), 'sms': v},
              })),
        ),
        if (!user.isInternal)
          SwitchListTile(
            secondary: const Icon(Icons.public),
            title: const Text('Public profile'),
            subtitle: const Text('Show your name and city on photos you share to the gallery'),
            value: user.publicProfile,
            onChanged: (v) => runAction(context, () => save({...base(), 'publicProfile': v})),
          ),
        const SectionHeader('Account'),
        ListTile(
          leading: const Icon(Icons.lock_outline),
          title: const Text('Change password'),
          onTap: () => showFormSheet(
            context,
            title: 'Change password',
            fields: [
              const FieldSpec('currentPassword', 'Current password', kind: FieldKind.password, required: true),
              FieldSpec('newPassword', 'New password', kind: FieldKind.password, required: true,
                  validator: (v) => v.length < 8 ? 'Use at least 8 characters' : null),
            ],
            submitLabel: 'Update password',
            onSubmit: (v) async {
              await api.put('/me/password', v);
              if (context.mounted) showMessage(context, 'Password updated');
            },
          ),
        ),
        ListTile(
          leading: const Icon(Icons.logout),
          title: const Text('Sign out'),
          onTap: () async {
            final tracking = ref.read(locationTrackerProvider).isActive;
            if (tracking &&
                !await confirm(context, 'Sign out?',
                    'You are clocked in. Signing out stops location sharing but does NOT clock you out.',
                    action: 'Sign out')) {
              return;
            }
            await session.logout();
          },
        ),
      ],
    );
  }
}
