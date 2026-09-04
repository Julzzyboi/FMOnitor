package com.FMOnitor_SpringWeb.FMOnitor_WebBE.security;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.Collections;
import java.util.Optional;

// Verifies a raw Google ID token sent up by the Flutter app's Google Sign-In
// SDK. Audience is the SAME web OAuth client-id already used for the browser
// login flow - the Flutter side is expected to request it via
// GoogleSignIn(serverClientId: <that same client-id>), which is Google's own
// documented pattern for "get an ID token my backend can verify" on mobile.
// No separate Android/iOS client-id needed here (Android still needs its own
// OAuth client registered in Google Cloud Console, tied to the app's package
// name + SHA-1 signing fingerprint, for the sign-in flow to run at all - but
// that's a Console configuration step, not something this verifier needs).
@Service
public class GoogleIdTokenVerifierService {

    private final GoogleIdTokenVerifier verifier;

    public GoogleIdTokenVerifierService(
            @Value("${spring.security.oauth2.client.registration.google.client-id}") String googleClientId) {
        this.verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), GsonFactory.getDefaultInstance())
            .setAudience(Collections.singletonList(googleClientId))
            .build();
    }

    /** Returns the verified payload, or empty if the token is missing/invalid/expired/wrong-audience. */
    public Optional<GoogleIdToken.Payload> verify(String idTokenString) {
        try {
            GoogleIdToken idToken = verifier.verify(idTokenString);
            return idToken != null ? Optional.of(idToken.getPayload()) : Optional.empty();
        } catch (GeneralSecurityException | IOException | IllegalArgumentException e) {
            return Optional.empty();
        }
    }
}
