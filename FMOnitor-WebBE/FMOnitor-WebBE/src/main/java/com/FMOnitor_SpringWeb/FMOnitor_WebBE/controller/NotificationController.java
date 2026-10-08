package com.FMOnitor_SpringWeb.FMOnitor_WebBE.controller;

import com.FMOnitor_SpringWeb.FMOnitor_WebBE.model.tbl_Notifications;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.repo.tbl_NotificationsRepo;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.service.CurrentUserService;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.List;

// The signed-in user's own notifications (the bell in the top bar).
@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final tbl_NotificationsRepo notificationsRepo;

    public NotificationController(tbl_NotificationsRepo notificationsRepo) {
        this.notificationsRepo = notificationsRepo;
    }

    // Newest 50.
    @GetMapping
    public List<tbl_Notifications> getMyNotifications(Authentication authentication) {
        String email = CurrentUserService.emailOf(authentication);
        return email == null ? List.of() : notificationsRepo.findTop50ByRecipientEmailOrderByCreatedAtDesc(email);
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<?> markRead(@PathVariable Long id, Authentication authentication) {
        String email = CurrentUserService.emailOf(authentication);
        tbl_Notifications notification = notificationsRepo.findById(id).orElse(null);
        // Someone else's notification looks the same as a missing one.
        if (notification == null || !notification.getRecipientEmail().equalsIgnoreCase(email)) {
            return ResponseEntity.notFound().build();
        }
        if (notification.getReadAt() == null) {
            notification.setReadAt(Instant.now());
            notificationsRepo.save(notification);
        }
        return ResponseEntity.ok(notification);
    }

    @PostMapping("/read-all")
    @Transactional
    public ResponseEntity<?> markAllRead(Authentication authentication) {
        String email = CurrentUserService.emailOf(authentication);
        if (email != null) {
            notificationsRepo.markAllRead(email, Instant.now());
        }
        return ResponseEntity.noContent().build();
    }
}
