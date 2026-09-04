import 'dart:convert';

import 'package:flutter/foundation.dart' show TargetPlatform, defaultTargetPlatform, kIsWeb;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:http/http.dart' as http;

import '../config/api_config.dart';

/// Result of a sign-in attempt - just enough for the UI to react (show a
/// success/error snackbar) without it needing to know anything about tokens.
class AuthResult {
  const AuthResult.success() : success = true, errorMessage = null;
  const AuthResult.failure(this.errorMessage) : success = false;

  final bool success;
  final String? errorMessage;
}

/// Wraps Google Sign-In + the backend's mobile login endpoint. Mirrors the
/// web app's flow (Google login -> backend issues accessToken/refreshToken)
/// but as a plain JSON call instead of a browser redirect, since there's no
/// cookie jar to rely on here - both tokens get stored locally instead.
class AuthService {
  static const _storage = FlutterSecureStorage();
  static const _accessTokenKey = 'accessToken';
  static const _refreshTokenKey = 'refreshToken';

  final GoogleSignIn _googleSignIn = GoogleSignIn.instance;
  bool _initialized = false;

  /// Must be called once, before the first sign-in attempt (e.g. from
  /// main() before runApp) - initialize() is async, unlike constructing
  /// GoogleSignIn used to be in older versions of this package.
  Future<void> init() async {
    if (_initialized) return;
    // Each platform wants a different combination here:
    // - Web: clientId only - google_sign_in_web asserts serverClientId is
    //   NOT supported on Web at all.
    // - Android: serverClientId only - it sources its own client from the
    //   SHA-1 + package name registered in Google Cloud Console instead, and
    //   passing clientId isn't needed (serverClientId alone is what makes
    //   the returned ID token audienced for our backend to accept).
    // - iOS: BOTH - clientId (its own iOS client, tied to the Bundle ID)
    //   drives the native sign-in UI/URL scheme, while serverClientId is
    //   still what makes the returned ID token audienced for our backend -
    //   unlike Web, iOS allows (and needs) both set simultaneously.
    final isIOS = !kIsWeb && defaultTargetPlatform == TargetPlatform.iOS;
    await _googleSignIn.initialize(
      clientId: kIsWeb
          ? googleServerClientId
          : isIOS
              ? googleIosClientId
              : null,
      serverClientId: kIsWeb ? null : googleServerClientId,
    );
    _initialized = true;
  }

  Future<AuthResult> signInWithGoogle() async {
    try {
      final GoogleSignInAccount account = await _googleSignIn.authenticate();
      final String? idToken = account.authentication.idToken;
      if (idToken == null) {
        return const AuthResult.failure('Google did not return an ID token');
      }

      final response = await http.post(
        Uri.parse('$apiBaseUrl/api/auth/mobile/google'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'idToken': idToken}),
      );

      if (response.statusCode != 200) {
        final message = _extractMessage(response.body) ?? 'Sign-in failed (${response.statusCode})';
        return AuthResult.failure(message);
      }

      final data = jsonDecode(response.body) as Map<String, dynamic>;
      final accessToken = data['accessToken'] as String?;
      final refreshToken = data['refreshToken'] as String?;
      if (accessToken == null || refreshToken == null) {
        return const AuthResult.failure('Unexpected response from server');
      }

      await _storage.write(key: _accessTokenKey, value: accessToken);
      await _storage.write(key: _refreshTokenKey, value: refreshToken);

      return const AuthResult.success();
    } on GoogleSignInException catch (e) {
      if (e.code == GoogleSignInExceptionCode.canceled) {
        return const AuthResult.failure('Sign-in cancelled');
      }
      return AuthResult.failure('Google sign-in failed: ${e.description ?? e.code}');
    } catch (e) {
      return AuthResult.failure('Something went wrong: $e');
    }
  }

  static String? _extractMessage(String body) {
    try {
      final data = jsonDecode(body) as Map<String, dynamic>;
      return data['message'] as String?;
    } catch (_) {
      return null;
    }
  }
}
