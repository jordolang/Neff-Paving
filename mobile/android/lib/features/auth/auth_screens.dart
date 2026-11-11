import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/api_client.dart';
import '../../core/session.dart';

class _AuthScaffold extends ConsumerWidget {
  const _AuthScaffold({required this.title, required this.children});

  final String title;
  final List<Widget> children;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cfg = ref.watch(companyConfigProvider);
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 440),
            child: ListView(
              shrinkWrap: true,
              padding: const EdgeInsets.all(24),
              children: [
                Icon(Icons.construction, size: 56, color: cfg.primary),
                const SizedBox(height: 8),
                Text(cfg.name, textAlign: TextAlign.center, style: Theme.of(context).textTheme.headlineSmall),
                Text('Service + Support', textAlign: TextAlign.center, style: Theme.of(context).textTheme.bodySmall),
                const SizedBox(height: 24),
                Text(title, style: Theme.of(context).textTheme.titleLarge),
                const SizedBox(height: 16),
                ...children,
              ],
            ),
          ),
        ),
      ),
    );
  }
}

mixin _Busy<T extends StatefulWidget> on State<T> {
  bool busy = false;
  String? error;

  Future<void> guard(Future<void> Function() action) async {
    setState(() {
      busy = true;
      error = null;
    });
    try {
      await action();
    } on ApiException catch (e) {
      if (mounted) setState(() => error = e.message);
    } catch (e) {
      if (mounted) setState(() => error = '$e');
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  Widget errorText(BuildContext context) => error == null
      ? const SizedBox.shrink()
      : Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: Text(error!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
        );

  Widget submitButton(String label, VoidCallback onPressed) => FilledButton(
        onPressed: busy ? null : onPressed,
        child: busy
            ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
            : Text(label),
      );
}

class _GoogleButton extends ConsumerWidget {
  const _GoogleButton({required this.onPressed});

  final VoidCallback? onPressed;

  @override
  Widget build(BuildContext context, WidgetRef ref) => OutlinedButton.icon(
        style: OutlinedButton.styleFrom(minimumSize: const Size.fromHeight(48)),
        onPressed: onPressed,
        icon: const Text('G', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
        label: const Text('Continue with Google'),
      );
}

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> with _Busy {
  final _form = GlobalKey<FormState>();
  final _email = TextEditingController();
  final _password = TextEditingController();

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => _AuthScaffold(
        title: 'Sign in',
        children: [
          Form(
            key: _form,
            child: Column(children: [
              TextFormField(
                controller: _email,
                keyboardType: TextInputType.emailAddress,
                autofillHints: const [AutofillHints.email],
                decoration: const InputDecoration(labelText: 'Email'),
                validator: (v) => (v ?? '').contains('@') ? null : 'Enter your email',
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _password,
                obscureText: true,
                autofillHints: const [AutofillHints.password],
                decoration: const InputDecoration(labelText: 'Password'),
                validator: (v) => (v ?? '').isEmpty ? 'Enter your password' : null,
                onFieldSubmitted: (_) => _login(),
              ),
            ]),
          ),
          Align(
            alignment: Alignment.centerRight,
            child: TextButton(onPressed: () => context.push('/forgot'), child: const Text('Forgot password?')),
          ),
          errorText(context),
          submitButton('Sign in', _login),
          const SizedBox(height: 12),
          _GoogleButton(onPressed: busy ? null : () => guard(ref.read(sessionProvider.notifier).signInWithGoogle)),
          const SizedBox(height: 24),
          TextButton(onPressed: () => context.push('/signup'), child: const Text("New here? Create an account")),
        ],
      );

  void _login() {
    if (!_form.currentState!.validate()) return;
    guard(() => ref.read(sessionProvider.notifier).login(_email.text, _password.text));
  }
}

class SignUpScreen extends ConsumerStatefulWidget {
  const SignUpScreen({super.key});

  @override
  ConsumerState<SignUpScreen> createState() => _SignUpScreenState();
}

class _SignUpScreenState extends ConsumerState<SignUpScreen> with _Busy {
  final _form = GlobalKey<FormState>();
  final _first = TextEditingController();
  final _last = TextEditingController();
  final _email = TextEditingController();
  final _phone = TextEditingController();
  final _password = TextEditingController();
  final _confirm = TextEditingController();

  @override
  void dispose() {
    for (final c in [_first, _last, _email, _phone, _password, _confirm]) {
      c.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => _AuthScaffold(
        title: 'Create your account',
        children: [
          Form(
            key: _form,
            child: Column(children: [
              Row(children: [
                Expanded(
                  child: TextFormField(
                    controller: _first,
                    decoration: const InputDecoration(labelText: 'First name'),
                    validator: (v) => (v ?? '').trim().isEmpty ? 'Required' : null,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: TextFormField(
                    controller: _last,
                    decoration: const InputDecoration(labelText: 'Last name'),
                    validator: (v) => (v ?? '').trim().isEmpty ? 'Required' : null,
                  ),
                ),
              ]),
              const SizedBox(height: 12),
              TextFormField(
                controller: _email,
                keyboardType: TextInputType.emailAddress,
                decoration: const InputDecoration(labelText: 'Email'),
                validator: (v) => (v ?? '').contains('@') ? null : 'Enter a valid email',
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _phone,
                keyboardType: TextInputType.phone,
                decoration: const InputDecoration(labelText: 'Phone (optional)'),
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _password,
                obscureText: true,
                decoration: const InputDecoration(labelText: 'Password', helperText: 'At least 8 characters'),
                validator: (v) => (v ?? '').length < 8 ? 'Use at least 8 characters' : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _confirm,
                obscureText: true,
                decoration: const InputDecoration(labelText: 'Confirm password'),
                validator: (v) => v != _password.text ? "Passwords don't match" : null,
              ),
              const SizedBox(height: 16),
            ]),
          ),
          errorText(context),
          submitButton('Create account', () {
            if (!_form.currentState!.validate()) return;
            guard(() => ref.read(sessionProvider.notifier).signup(
                  email: _email.text,
                  password: _password.text,
                  firstName: _first.text,
                  lastName: _last.text,
                  phone: _phone.text,
                ));
          }),
          const SizedBox(height: 12),
          _GoogleButton(onPressed: busy ? null : () => guard(ref.read(sessionProvider.notifier).signInWithGoogle)),
          const SizedBox(height: 16),
          TextButton(onPressed: () => context.pop(), child: const Text('Already have an account? Sign in')),
        ],
      );
}

class ForgotPasswordScreen extends ConsumerStatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  ConsumerState<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends ConsumerState<ForgotPasswordScreen> with _Busy {
  final _email = TextEditingController();
  final _token = TextEditingController();
  final _password = TextEditingController();
  bool _sent = false;
  bool _done = false;

  @override
  void dispose() {
    _email.dispose();
    _token.dispose();
    _password.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => _AuthScaffold(
        title: 'Reset your password',
        children: [
          if (_done)
            const Text('Your password was changed. Sign in with your new password.')
          else if (!_sent) ...[
            TextField(
              controller: _email,
              keyboardType: TextInputType.emailAddress,
              decoration: const InputDecoration(labelText: 'Email'),
            ),
            const SizedBox(height: 16),
            errorText(context),
            submitButton('Send reset link', () => guard(() async {
                  await ref.read(sessionProvider.notifier).forgotPassword(_email.text);
                  if (mounted) setState(() => _sent = true);
                })),
            TextButton(onPressed: () => setState(() => _sent = true), child: const Text('I already have a reset code')),
          ] else ...[
            const Text('If an account exists for that email, a reset link is on its way. '
                'Paste the code from the link below and choose a new password.'),
            const SizedBox(height: 16),
            TextField(controller: _token, decoration: const InputDecoration(labelText: 'Reset code')),
            const SizedBox(height: 12),
            TextField(
              controller: _password,
              obscureText: true,
              decoration: const InputDecoration(labelText: 'New password', helperText: 'At least 8 characters'),
            ),
            const SizedBox(height: 16),
            errorText(context),
            submitButton('Set new password', () {
              if (_token.text.trim().isEmpty || _password.text.length < 8) {
                setState(() => error = 'Enter the reset code and a password of at least 8 characters.');
                return;
              }
              guard(() async {
                await ref.read(sessionProvider.notifier).resetPassword(_token.text, _password.text);
                if (mounted) setState(() => _done = true);
              });
            }),
          ],
          const SizedBox(height: 16),
          TextButton(onPressed: () => context.pop(), child: const Text('Back to sign in')),
        ],
      );
}

/// Shown while restoring a session (or when the server is unreachable at launch).
class SplashScreen extends ConsumerWidget {
  const SplashScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final session = ref.watch(sessionProvider);
    final cfg = ref.watch(companyConfigProvider);
    return Scaffold(
      body: Center(
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Icon(Icons.construction, size: 64, color: cfg.primary),
          const SizedBox(height: 12),
          Text(cfg.name, style: Theme.of(context).textTheme.headlineSmall),
          const SizedBox(height: 24),
          if (session.hasError) ...[
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 32),
              child: Text('${session.error}', textAlign: TextAlign.center),
            ),
            const SizedBox(height: 12),
            OutlinedButton.icon(
              onPressed: () => ref.read(sessionProvider.notifier).reload(),
              icon: const Icon(Icons.refresh),
              label: const Text('Retry'),
            ),
            TextButton(onPressed: () => ref.read(sessionProvider.notifier).logout(), child: const Text('Sign out')),
          ] else
            const CircularProgressIndicator(),
        ]),
      ),
    );
  }
}
