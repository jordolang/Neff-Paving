import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/legacy.dart';
import 'package:google_sign_in/google_sign_in.dart';

import '../services/location_tracker.dart';
import '../services/media_uploader.dart';
import '../services/push_registration.dart';
import 'api_client.dart';
import 'company_config.dart';
import 'json.dart';
import 'models.dart';
import 'token_store.dart';

/// Overridden in `bootstrap()` with the flavor's config.
final companyConfigProvider = Provider<CompanyConfig>((ref) => throw UnimplementedError('companyConfigProvider'));

final tokenStoreProvider = Provider<TokenStore>((ref) => TokenStore());

final apiProvider = Provider<ApiClient>((ref) {
  final api = ApiClient(ref.watch(companyConfigProvider), ref.watch(tokenStoreProvider));
  api.onSessionExpired = () => ref.read(sessionProvider.notifier).expire();
  return api;
});

final locationTrackerProvider = ChangeNotifierProvider<LocationTracker>((ref) =>
    LocationTracker(ref.watch(apiProvider), companyName: ref.watch(companyConfigProvider).name));

final mediaUploaderProvider = ChangeNotifierProvider<MediaUploader>((ref) => MediaUploader(ref.watch(apiProvider)));

final pushRegistrationProvider = Provider<PushRegistration>((ref) => PushRegistration(ref.watch(apiProvider)));

/// The signed-in user, or null when signed out.
final sessionProvider = AsyncNotifierProvider<SessionController, User?>(SessionController.new);

/// Convenience: the current user (null when signed out / loading).
final currentUserProvider = Provider<User?>((ref) => ref.watch(sessionProvider).value);

class SessionController extends AsyncNotifier<User?> {
  ApiClient get _api => ref.read(apiProvider);
  TokenStore get _tokens => ref.read(tokenStoreProvider);
  bool _googleReady = false;

  @override
  Future<User?> build() async {
    await _tokens.load();
    if (!_tokens.hasSession) return null;
    try {
      final user = User.fromJson(asMap(await _api.get('/me')));
      unawaited(_afterSignIn(user));
      return user;
    } on ApiException catch (e) {
      if (e.isUnauthorized) {
        await _tokens.clear();
        return null;
      }
      rethrow; // offline at launch: UI offers retry, session kept
    }
  }

  Future<void> _afterSignIn(User user) async {
    unawaited(ref.read(mediaUploaderProvider).init());
    if (user.isInternal) {
      try {
        final status = TimeStatus.fromJson(asMap(await _api.get('/time/status')));
        await ref.read(locationTrackerProvider).resumeIfClockedIn(
              clockedIn: status.clockedIn,
              pingIntervalSeconds: status.pingIntervalSeconds,
            );
      } on ApiException {
        // Not allowed to clock or offline; the Clock screen re-checks.
      }
    }
  }

  Future<void> _accept(Object? raw) async {
    final result = AuthResult.fromJson(asMap(raw));
    await _tokens.save(access: result.accessToken, refresh: result.refreshToken);
    state = AsyncData(result.user);
    unawaited(_afterSignIn(result.user));
  }

  Future<void> login(String email, String password) async =>
      _accept(await _api.post('/auth/login', {'email': email.trim(), 'password': password}, false));

  Future<void> signup({
    required String email,
    required String password,
    required String firstName,
    required String lastName,
    String? phone,
  }) async =>
      _accept(await _api.post(
        '/auth/signup',
        {
          'email': email.trim(),
          'password': password,
          'firstName': firstName.trim(),
          'lastName': lastName.trim(),
          if (phone != null && phone.trim().isNotEmpty) 'phone': phone.trim(),
        },
        false,
      ));

  /// Native Google sign-in → ID token → `POST /auth/google`.
  Future<void> signInWithGoogle() async {
    final cfg = ref.read(companyConfigProvider);
    if (cfg.googleServerClientId.isEmpty) {
      throw const ApiException('bad_request',
          'Google sign-in is not configured for this build (GOOGLE_SERVER_CLIENT_ID).');
    }
    final google = GoogleSignIn.instance;
    if (!_googleReady) {
      await google.initialize(serverClientId: cfg.googleServerClientId);
      _googleReady = true;
    }
    final GoogleSignInAccount account;
    try {
      account = await google.authenticate();
    } on GoogleSignInException catch (e) {
      if (e.code == GoogleSignInExceptionCode.canceled) return;
      throw ApiException('bad_request', 'Google sign-in failed: ${e.description ?? e.code.name}');
    }
    final idToken = account.authentication.idToken;
    if (idToken == null) {
      throw const ApiException('bad_request', 'Google did not return an ID token.');
    }
    await _accept(await _api.post('/auth/google', {'idToken': idToken}, false));
  }

  Future<void> forgotPassword(String email) => _api.post('/auth/forgot-password', {'email': email.trim()}, false);

  /// Completes a reset with the token from the emailed link.
  Future<void> resetPassword(String token, String newPassword) =>
      _api.post('/auth/reset-password', {'token': token.trim(), 'newPassword': newPassword}, false);

  Future<void> reload() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(build);
  }

  void setUser(User user) => state = AsyncData(user);

  Future<void> logout() async {
    await ref.read(locationTrackerProvider).stop();
    await ref.read(mediaUploaderProvider).clear();
    final refresh = _tokens.refreshToken;
    if (refresh != null) {
      try {
        await _api.post('/auth/logout', {'refreshToken': refresh});
      } on ApiException {
        // Best effort; local sign-out still happens.
      }
    }
    if (_googleReady) unawaited(GoogleSignIn.instance.signOut());
    await _tokens.clear();
    state = const AsyncData(null);
  }

  /// Refresh token rejected: drop to the login screen.
  Future<void> expire() async {
    await ref.read(locationTrackerProvider).stop();
    await _tokens.clear();
    state = const AsyncData(null);
  }
}
