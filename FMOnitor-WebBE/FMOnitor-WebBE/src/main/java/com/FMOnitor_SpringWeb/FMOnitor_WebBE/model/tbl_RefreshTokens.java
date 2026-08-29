package com.FMOnitor_SpringWeb.FMOnitor_WebBE.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

// Refresh tokens are opaque random strings, not JWTs - unlike the short-lived
// access token, this one is always checked against the DB anyway (that's the
// whole point: it's what makes revocation actually possible), so there's no
// benefit to a self-contained signed token here. Only the HASH is stored,
// same principle as never storing a plaintext password.
@Entity
@Table(name = "tbl_refresh_tokens")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class tbl_RefreshTokens {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "token_hash", nullable = false, unique = true)
    private String tokenHash;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
}
