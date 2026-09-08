package com.FMOnitor_SpringWeb.FMOnitor_WebBE.service;

import com.FMOnitor_SpringWeb.FMOnitor_WebBE.model.tbl_Users;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.repo.tbl_UsersRepo;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

// Auto-purges accounts that have sat archived (status="Deleted") for 3+
// months, so "Delete" from the Accounts page eventually means the same thing
// as "Delete Permanently" even if nobody ever clicks the permanent option -
// the archive isn't meant to be a place accounts sit forever.
@Component
public class AccountCleanupScheduler {

    private static final Logger log = LoggerFactory.getLogger(AccountCleanupScheduler.class);
    private static final String STATUS_DELETED = "Deleted";
    // 90 days as a simple stand-in for "3 months" - Instant is a fixed-length
    // duration type with no calendar awareness (no .minusMonths()), and being
    // off by a day or two either way doesn't matter for a retention window.
    private static final long RETENTION_DAYS = 90;

    private final tbl_UsersRepo usersRepo;
    private final AccountService accountService;

    public AccountCleanupScheduler(tbl_UsersRepo usersRepo, AccountService accountService) {
        this.usersRepo = usersRepo;
        this.accountService = accountService;
    }

    // Once a day at 3am - archived accounts aren't time-sensitive, so there's
    // no need for anything more frequent.
    @Scheduled(cron = "0 0 3 * * *")
    public void purgeExpiredDeletedAccounts() {
        Instant cutoff = Instant.now().minus(RETENTION_DAYS, ChronoUnit.DAYS);
        List<tbl_Users> expired = usersRepo.findByStatusAndDeletedAtBefore(STATUS_DELETED, cutoff);

        for (tbl_Users user : expired) {
            log.info("Auto-purging account {} (archived {}, past the {}-day retention window)",
                user.getEmail(), user.getDeletedAt(), RETENTION_DAYS);
            accountService.permanentlyDelete(user.getId());
        }
    }
}
