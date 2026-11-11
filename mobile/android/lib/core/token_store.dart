import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Access/refresh tokens in the Android Keystore-backed secure storage.
class TokenStore {
  TokenStore({FlutterSecureStorage? storage}) : _storage = storage ?? const FlutterSecureStorage();

  final FlutterSecureStorage _storage;
  static const _accessKey = 'access_token';
  static const _refreshKey = 'refresh_token';

  String? _access;
  String? _refresh;
  bool _loaded = false;

  Future<void> load() async {
    if (_loaded) return;
    _access = await _storage.read(key: _accessKey);
    _refresh = await _storage.read(key: _refreshKey);
    _loaded = true;
  }

  String? get accessToken => _access;
  String? get refreshToken => _refresh;
  bool get hasSession => (_access ?? '').isNotEmpty;

  Future<void> save({required String access, String? refresh}) async {
    _access = access;
    await _storage.write(key: _accessKey, value: access);
    if (refresh != null && refresh.isNotEmpty) {
      _refresh = refresh;
      await _storage.write(key: _refreshKey, value: refresh);
    }
  }

  Future<void> clear() async {
    _access = null;
    _refresh = null;
    await _storage.delete(key: _accessKey);
    await _storage.delete(key: _refreshKey);
  }
}
