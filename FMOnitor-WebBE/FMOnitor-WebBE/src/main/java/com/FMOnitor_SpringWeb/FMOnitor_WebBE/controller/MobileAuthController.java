package com.FMOnitor_SpringWeb.FMOnitor_WebBE.controller;

import com.FMOnitor_SpringWeb.FMOnitor_WebBE.model.tbl_Users;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.security.GoogleIdTokenVerifierService;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.security.JwtService;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.security.RefreshTokenService;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.security.UserProvisioningService;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.Optional;

// Mobile equivalent of the web app's oauth2Login redirect flow. The Flutter
// app does the actual Google Sign-In itself (via the google_sign_in SDK) and
// hands us the resulting ID token - this endpoint's job is entirely
// server-side verification of that token, not initiating the sign-in.
//
// Response is plain JSON (accessToken + refreshToken), not a cookie: a raw
// HTTP call from Flutter's default client doesn't handle cookies the way a
// browser does, so the app is expected to store both itself.
@RestController
public class MobileAuthController {

    private final GoogleIdTokenVerifierService googleIdTokenVerifierService;
    private final UserProvisioningService userProvisioningService;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;

    public MobileAuthController(GoogleIdTokenVerifierService googleIdTokenVerifierService,
                                 UserProvisioningService userProvisioningService,
                                 JwtService jwtService,
                                 RefreshTokenService refreshTokenService) {
        this.googleIdTokenVerifierService = googleIdTokenVerifierService;
        this.userProvisioningService = userProvisioningService;
        this.jwtService = jwtService;
        this.refreshTokenService = refreshTokenService;
    }

    @PostMapping("/api/auth/mobile/google")
    public ResponseEntity<Map<String, Object>> googleMobileLogin(@RequestBody Map<String, String> body) {
        String idTokenString = body.get("idToken");
        if (idTokenString == null || idTokenString.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Missing idToken"));
        }

        Optional<GoogleIdToken.Payload> verified = googleIdTokenVerifierService.verify(idTokenString);
        if (verified.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("message", "Invalid Google ID token"));
        }

        GoogleIdToken.Payload payload = verified.get();
        String googleSub = payload.getSubject();
        String email = payload.getEmail();
        String name = (String) payload.get("name");
        String picture = (String) payload.get("picture");

        tbl_Users user = userProvisioningService.provisionFromGoogle(googleSub, email, name, picture);

        String accessToken = jwtService.generateToken(
            String.valueOf(user.getId()), user.getEmail(), user.getName(), user.getRole());
        String refreshToken = refreshTokenService.issueToken(user.getId());

        return ResponseEntity.ok(Map.of(
            "accessToken", accessToken,
            "refreshToken", refreshToken));
    }
}
