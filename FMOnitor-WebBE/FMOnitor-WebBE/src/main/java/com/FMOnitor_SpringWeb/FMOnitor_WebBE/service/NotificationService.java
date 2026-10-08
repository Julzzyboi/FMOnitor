package com.FMOnitor_SpringWeb.FMOnitor_WebBE.service;

import com.FMOnitor_SpringWeb.FMOnitor_WebBE.model.tbl_Notifications;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.model.tbl_Users;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.repo.tbl_NotificationsRepo;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.repo.tbl_UsersRepo;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.util.SetUtil;

import org.springframework.stereotype.Service;

import java.util.Set;

@Service
public class NotificationService {

    private static final Set<String> SKIPPED_STATUSES = SetUtil.of("Disabled", "Deleted");

    private final tbl_NotificationsRepo notificationsRepo;
    private final tbl_UsersRepo usersRepo;

    public NotificationService(tbl_NotificationsRepo notificationsRepo, tbl_UsersRepo usersRepo) {
        this.notificationsRepo = notificationsRepo;
        this.usersRepo = usersRepo;
    }

    // `actor` is whoever caused the notification (shown as their profile
    // picture); null for system notifications.
    public void notify(String recipientEmail, tbl_Users actor, String type, String title, String message, String link) {
        tbl_Notifications notification = new tbl_Notifications();
        notification.setRecipientEmail(recipientEmail);
        notification.setType(type);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setLink(link);
        if (actor != null) {
            notification.setActorName(CurrentUserService.displayName(actor));
            notification.setActorPictureUrl(actor.getPictureUrl());
        }
        notificationsRepo.save(notification);
    }

    // Everyone with the role except disabled or deleted accounts.
    public void notifyRole(String role, tbl_Users actor, String type, String title, String message, String link) {
        for (tbl_Users user : usersRepo.findByRole(role)) {
            if (!SKIPPED_STATUSES.contains(user.getStatus())) {
                notify(user.getEmail(), actor, type, title, message, link);
            }
        }
    }
}
