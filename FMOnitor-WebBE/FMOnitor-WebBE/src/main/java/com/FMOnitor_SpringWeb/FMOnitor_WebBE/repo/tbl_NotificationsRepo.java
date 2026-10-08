package com.FMOnitor_SpringWeb.FMOnitor_WebBE.repo;

import com.FMOnitor_SpringWeb.FMOnitor_WebBE.model.tbl_Notifications;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface tbl_NotificationsRepo extends JpaRepository<tbl_Notifications, Long> {
    List<tbl_Notifications> findTop50ByRecipientEmailOrderByCreatedAtDesc(String email);

    @Modifying
    @Query("update tbl_Notifications n set n.readAt = :now where n.recipientEmail = :email and n.readAt is null")
    int markAllRead(@Param("email") String email, @Param("now") Instant now);
}
