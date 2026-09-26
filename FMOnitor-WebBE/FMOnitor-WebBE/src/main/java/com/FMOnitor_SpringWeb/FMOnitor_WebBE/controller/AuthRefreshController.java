package com.FMOnitor_SpringWeb.FMOnitor_WebBE.controller;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.util.MapUtil;

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
            return ResponseEntity.status(401).body(MapUtil.of("message", "No refresh token"));
        }

        Optional<Long> userId = refreshTokenService.validateAndConsume(rawToken);
        if (!userId.isPresent()) {
            return ResponseEntity.status(401).body(MapUtil.of("message", "Refresh token invalid or expired"));
        }

        tbl_Users user = usersRepo.findById(userId.get()).orElse(null);
        if (user == null) {
            return ResponseEntity.status(401).body(MapUtil.of("message", "Account no longer exists"));
        }

        String newAccessToken = jwtService.generateToken(
            String.valueOf(user.getId()), user.getEmail(), user.getName(), user.getRole());

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
