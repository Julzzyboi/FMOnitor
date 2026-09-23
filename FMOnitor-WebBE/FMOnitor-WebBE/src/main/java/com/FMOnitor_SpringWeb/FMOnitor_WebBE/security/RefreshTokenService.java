package com.FMOnitor_SpringWeb.FMOnitor_WebBE.security;

import com.FMOnitor_SpringWeb.FMOnitor_WebBE.model.tbl_RefreshTokens;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.repo.tbl_RefreshTokensRepo;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.Optional;

@Service
public class RefreshTokenService {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final tbl_RefreshTokensRepo repo;
    private final long expirationMs;

    public RefreshTokenService(tbl_RefreshTokensRepo repo,
                                @Value("${app.jwt.refresh-expiration-ms}") long expirationMs) {
        this.repo = repo;
        this.expirationMs = expirationMs;
    }

    public String issueToken(Long userId) {
        byte[] bytes = new byte[64];
        RANDOM.nextBytes(bytes);
        String rawToken = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);

        Instant now = Instant.now();
        tbl_RefreshTokens entity = new tbl_RefreshTokens(null, hash(rawToken), userId, now.plusMillis(expirationMs), now);
        repo.save(entity);
        return rawToken;
    }

    public Optional<Long> validateAndConsume(String rawToken) {
        String hash = hash(rawToken);
        Optional<tbl_RefreshTokens> found = repo.findByTokenHash(hash);
        if (!found.isPresent()) {
            return Optional.empty();
        }

        tbl_RefreshTokens token = found.get();
        repo.delete(token);

        if (token.getExpiresAt().isBefore(Instant.now())) {
            return Optional.empty();
        }
        return Optional.of(token.getUserId());
    }

    @Transactional
    public void revokeAllForUser(Long userId) {
        repo.deleteByUserId(userId);
    }

    public long getExpirationMs() {
        return expirationMs;
    }

    private static String hash(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashed = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hashed);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
