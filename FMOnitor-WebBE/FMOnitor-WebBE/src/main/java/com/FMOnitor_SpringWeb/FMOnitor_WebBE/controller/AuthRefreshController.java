package com.FMOnitor_SpringWeb.FMOnitor_WebBE.controller;

import com.FMOnitor_SpringWeb.FMOnitor_WebBE.model.tbl_Users;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.repo.tbl_UsersRepo;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.security.JwtService;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.security.RefreshTokenService;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

// The access token (JwtService) is deliberately short-lived (see
// app.jwt.expiration-ms) so a stolen one is only ever useful briefly. This
// endpoint is what lets a still-logged-in user get a new one without going
// back through the full Google OAuth2 dance - it trades the refresh token
// for a fresh access token, and rotates the refresh token in the process
// (old one is deleted the moment it's used, whether valid or not).
//
// Serves both platforms: web sends its refresh token via the httpOnly cookie
// (never touches JS) and gets a rotated cookie back; mobile, which has no
// browser-managed cookie jar, sends/receives it as a plain JSON field instead.
//
// Deliberately outside the normal session/JWT-authenticated request set
// (permitAll in SecurityConfig) - its own auth check IS the refresh token
// itself, validated against tbl_refresh_tokens below.
@RestController
public class AuthRefreshController {

    private static final String REFRESH_COOKIE_NAME = "refresh_token";

    private final RefreshTokenService refreshTokenService;
    private final JwtService jwtService;
    private final tbl_UsersRepo usersRepo;
    private final boolean secureCookie;

    public AuthRefreshController(RefreshTokenService refreshTokenService, JwtService jwtService,
                                  tbl_UsersRepo usersRepo,
                                  @Value("${app.cookie.secure}") boolean secureCookie) {
        this.refreshTokenService = refreshTokenService;
        this.jwtService = jwtService;
        this.usersRepo = usersRepo;
        this.secureCookie = secureCookie;
    }

    @PostMapping("/api/auth/refresh")
    public ResponseEntity<Map<String, Object>> refresh(HttpServletRequest request, HttpServletResponse response,
                                                         @RequestBody(required = false) Map<String, String> body) {
        String cookieToken = readCookie(request, REFRESH_COOKIE_NAME);
        boolean fromCookie = cookieToken != null;
        String rawToken = fromCookie ? cookieToken : (body != null ? body.get("refreshToken") : null);
        if (rawToken == null) {
            return ResponseEntity.status(401).body(Map.of("message", "No refresh token"));
        }

        Optional<Long> userId = refreshTokenService.validateAndConsume(rawToken);
        if (userId.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("message", "Refresh token invalid or expired"));
        }

        tbl_Users user = usersRepo.findById(userId.get()).orElse(null);
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Account no longer exists"));
        }

        String newAccessToken = jwtService.generateToken(
            String.valueOf(user.getId()), user.getEmail(), user.getName(), user.getRole());

        // Rotation: every refresh both consumes the old refresh token (above) and
        // issues a brand new one, so a leaked-but-unused refresh token has a
        // shrinking window rather than staying valid indefinitely.
        String newRawRefreshToken = refreshTokenService.issueToken(user.getId());

        Map<String, Object> responseBody = new HashMap<>();
        responseBody.put("token", newAccessToken);
        responseBody.put("accessToken", newAccessToken);

        if (fromCookie) {
            ResponseCookie cookie = ResponseCookie.from(REFRESH_COOKIE_NAME, newRawRefreshToken)
                .httpOnly(true)
                .secure(secureCookie)
                .sameSite("Lax")
                .path("/api/auth")
                .maxAge(refreshTokenService.getExpirationMs() / 1000)
                .build();
            response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
        } else {
            // Mobile: no cookie jar to rely on, so the rotated token has to
            // come back in the body for the app to store itself.
            responseBody.put("refreshToken", newRawRefreshToken);
        }

        return ResponseEntity.ok(responseBody);
    }

    private static String readCookie(HttpServletRequest request, String name) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) {
            return null;
        }
        for (Cookie cookie : cookies) {
            if (name.equals(cookie.getName())) {
                return cookie.getValue();
            }
        }
        return null;
    }
}
