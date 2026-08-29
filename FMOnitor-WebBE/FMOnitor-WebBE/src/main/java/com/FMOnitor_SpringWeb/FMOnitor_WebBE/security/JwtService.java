package com.FMOnitor_SpringWeb.FMOnitor_WebBE.security;

import com.FMOnitor_SpringWeb.FMOnitor_WebBE.model.tbl_Users;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.repo.tbl_UsersRepo;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

@Service
public class JwtService {

    // Only used if, for some reason, no tbl_users row exists yet for this email -
    // shouldn't normally happen, since CustomOAuth2UserService already saves/updates
    // the user earlier in the same OAuth2 login flow, before this ever runs.
    private static final String DEFAULT_ROLE = "Requestor";

    private final SecretKey key;
    private final long expirationMs;
    private final tbl_UsersRepo usersRepo;

    public JwtService(@Value("${app.jwt.secret}") String secret,
                       @Value("${app.jwt.expiration-ms}") long expirationMs,
                       tbl_UsersRepo usersRepo) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationMs = expirationMs;
        this.usersRepo = usersRepo;
    }

    public String generateToken(OAuth2User principal) {
        String email = principal.getAttribute("email");
        String name = principal.getAttribute("name");

        // Real internal id + current role from tbl_users - not Google's own "sub"
        // claim, and not a hardcoded placeholder like before.
        tbl_Users user = usersRepo.findByEmail(email).orElse(null);
        String userId = user != null ? String.valueOf(user.getId()) : null;
        String role = (user != null && user.getRole() != null) ? user.getRole() : DEFAULT_ROLE;

        return generateToken(userId, email, name, role);
    }

    /**
     * Core token-minting logic, usable without an OAuth2User principal - this is
     * what /api/auth/refresh calls after validating a refresh token, since at
     * that point all it has is the resolved tbl_users row, not a live OAuth2 session.
     */
    public String generateToken(String userId, String email, String name, String role) {
        Instant now = Instant.now();
        return Jwts.builder()
            .subject(userId)
            .claim("email", email)
            .claim("name", name)
            .claim("role", role)
            .issuedAt(Date.from(now))
            .expiration(Date.from(now.plusMillis(expirationMs)))
            .signWith(key)
            .compact();
    }
}
