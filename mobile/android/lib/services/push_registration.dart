import '../core/api_client.dart';

/// Registers a push token with `POST /auth/device`.
///
/// The FCM token itself comes from Firebase Cloud Messaging, which needs the
/// per-flavor `google-services.json` files from the Firebase console (see
/// README "Push notifications"). Until those are added, in-app notifications
/// still work through `GET /notifications`.
class PushRegistration {
  PushRegistration(this._api);

  final ApiClient _api;
  String? _registered;

  Future<void> register(String? token) async {
    if (token == null || token.isEmpty || token == _registered) return;
    await _api.post('/auth/device', {'token': token, 'platform': 'android'});
    _registered = token;
  }
}
