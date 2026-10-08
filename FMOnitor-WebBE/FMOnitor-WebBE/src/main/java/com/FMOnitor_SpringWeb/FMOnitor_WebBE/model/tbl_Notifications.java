package com.FMOnitor_SpringWeb.FMOnitor_WebBE.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.time.Instant;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

// One message in a user's notification bell.
@Entity
@Table(name = "tbl_notifications")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class tbl_Notifications {

    public static final String TYPE_INFO = "info";
    public static final String TYPE_SUCCESS = "success";
    public static final String TYPE_DANGER = "danger";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "notification_id")
    private Long id;

    @Column(name = "recipient_email", nullable = false)
    private String recipientEmail;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String message;

    // info | success | danger - picks the icon and colour.
    @Column(nullable = false)
    private String type;

    // Where clicking the notification takes the user (an app path).
    private String link;

    // Who caused it (e.g. the Superadmin who rejected a change) - shown as
    // their profile picture. Copied at the time, so it stays right even if
    // the account changes later. Null for system notifications.
    @Column(name = "actor_name")
    private String actorName;

    @Column(name = "actor_picture_url", columnDefinition = "TEXT")
    private String actorPictureUrl;

    @Column(name = "read_at")
    private Instant readAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
    }
}
