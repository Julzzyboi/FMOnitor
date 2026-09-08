package com.FMOnitor_SpringWeb.FMOnitor_WebBE.repo;

import com.FMOnitor_SpringWeb.FMOnitor_WebBE.model.tbl_Users;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface tbl_UsersRepo extends JpaRepository<tbl_Users, Long> {
    Optional<tbl_Users> findByGoogleSub(String googleSub);
    Optional<tbl_Users> findByEmail(String email);
    // Powers the 3-month auto-purge - every archived (status="Deleted") row
    // whose deletedAt is older than the cutoff the scheduler passes in.
    List<tbl_Users> findByStatusAndDeletedAtBefore(String status, Instant cutoff);
}
