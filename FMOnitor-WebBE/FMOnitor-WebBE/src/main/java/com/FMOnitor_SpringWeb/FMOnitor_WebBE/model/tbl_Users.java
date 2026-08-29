package com.FMOnitor_SpringWeb.FMOnitor_WebBE.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.time.Instant;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "tbl_users")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class tbl_Users {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Google's "sub" claim - a stable, immutable ID for the account.
    // Null until an invited (status=Unregistered) user actually logs in for
    // the first time and claims this row.
    @Column(name = "google_sub", unique = true)
    private String googleSub;

    @Column(nullable = false, unique = true)
    private String email;

    private String name;

    @Column(name = "picture_url")
    private String pictureUrl;

    @Column(nullable = false)
    private String role;

    // "Active" | "Inactive" | "Unregistered" | "Disabled" | "Deleted" - matches
    // the frontend's Accounts page status vocabulary exactly.
    @Column(nullable = false)
    private String status;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    protected void onCreate() {
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }
}
