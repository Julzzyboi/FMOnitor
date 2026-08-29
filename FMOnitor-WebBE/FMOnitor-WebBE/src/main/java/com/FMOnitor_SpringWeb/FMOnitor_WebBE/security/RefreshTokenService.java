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

// Refresh tokens are the piece that makes the JWT setup revocable: the access
// token (JwtService) is short-lived and self-contained (nothing to check it
// against once issued), so it can't be individually invalidated before it
// expires. This is what a logout, a disabled account, etc. can actually reach.
//
// Deliberately NOT a JWT - it's an opaque, high-entropy random string that
// always requires a DB round-trip anyway (that round-trip IS the revocation
// check), so there's nothing to gain from making it self-contained/signed.
// Only its SHA-256 hash is ever persisted, same reasoning as password hashing:
// a DB leak alone shouldn't hand out usable tokens.
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

    /** Mints a new refresh token for this user and persists its hash. Returns the raw token - only given to the client, never stored. */
    public String issueToken(Long userId) {
        byte[] bytes = new byte[64];
        RANDOM.nextBytes(bytes);
        String rawToken = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);

        Instant now = Instant.now();
        tbl_RefreshTokens entity = new tbl_RefreshTokens(null, hash(rawToken), userId, now.plusMillis(expirationMs), now);
        repo.save(entity);
        return rawToken;
    }

    /**
     * Validates a raw refresh token and rotates it (single-use: the old row is
     * deleted whether the token was valid or not, so a stolen-and-replayed
     * token can only ever be used once before its "validity" disappears).
     * Returns the associated userId if the token was valid and unexpired.
     */
    public Optional<Long> validateAndConsume(String rawToken) {
        String hash = hash(rawToken);
        Optional<tbl_RefreshTokens> found = repo.findByTokenHash(hash);
        if (found.isEmpty()) {
            return Optional.empty();
        }

        tbl_RefreshTokens token = found.get();
        repo.delete(token); // single-use, regardless of outcome below

        if (token.getExpiresAt().isBefore(Instant.now())) {
            return Optional.empty();
        }
        return Optional.of(token.getUserId());
    }

    /**
     * Revokes every outstanding refresh token for a user - used on logout.
     * Needs its own @Transactional: unlike the built-in save()/delete()
     * methods (transactional automatically via SimpleJpaRepository), a custom
     * derived query like deleteByUserId needs an active transaction to call
     * EntityManager.remove() under the hood, and callers of this method (like
     * LogoutLogHandler, invoked directly from a security filter rather than a
     * Spring-managed controller/service method) don't already have one open.
     * Without this, the delete throws, and - since this runs before the
     * "LOGGED OUT" row gets saved and the redirect gets sent - the log entry
     * never gets written and the request fails outright instead.
     */
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
            // SHA-256 is a JDK-guaranteed algorithm; this is unreachable in practice.
            throw new IllegalStateException(e);
        }
    }
}
