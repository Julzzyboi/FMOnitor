// TODO: when testing on the Android *emulator* specifically, this needs to
// become 'http://10.0.2.2:8080' instead - the emulator's own "localhost"
// refers to itself, not the host machine. Not an issue for the Chrome
// target used during development.
const String apiBaseUrl = 'http://localhost:8080';

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
