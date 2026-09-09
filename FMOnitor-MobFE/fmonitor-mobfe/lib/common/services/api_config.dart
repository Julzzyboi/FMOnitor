import 'dart:io' show Platform;
import 'package:flutter/foundation.dart' show kIsWeb;

// The Android *emulator* has its own "localhost" that refers to itself, not
// the host machine running the backend - 10.0.2.2 is the special alias it
// provides specifically to reach the host's localhost instead. Not an issue
// for the Chrome target (kIsWeb, checked first since Platform.isAndroid
// throws on web - there's no dart:io there) or for a real physical device,
// which reaches the host over the LAN instead; a real device needs the
// host's actual LAN IP here rather than either of these, since it isn't on
// the emulator's private virtual network at all. Not `const` - Platform.isAndroid
// is a runtime check, not a compile-time constant.
final String apiBaseUrl = kIsWeb
    ? 'http://localhost:8080'
    : Platform.isAndroid
        ? 'http://10.0.2.2:8080'
        : 'http://localhost:8080';

// Same web OAuth client-id already used by the backend (application.properties)
// and the React web app - not a secret, safe to embed here. This is what
// google_sign_in's serverClientId points at, so the ID token it returns is
// audienced correctly for GoogleIdTokenVerifierService on the backend to accept.
const String googleServerClientId =
    '590989370337-0thql0io9tfgi3vvk1rhqj9bn1rirhun.apps.googleusercontent.com';

// iOS-specific OAuth client (separate from the web/Android one above) -
// registered against the app's Bundle ID (com.fmonitor.fmonitor), not a
// SHA-1 fingerprint like Android. Needed alongside googleServerClientId on
// iOS: this one drives the native sign-in UI/URL scheme, the server one is
// still what makes the returned ID token audienced for our backend.
const String googleIosClientId =
    '590989370337-j7ohap66qi97da9akaof21mieaiqlepi.apps.googleusercontent.com';
