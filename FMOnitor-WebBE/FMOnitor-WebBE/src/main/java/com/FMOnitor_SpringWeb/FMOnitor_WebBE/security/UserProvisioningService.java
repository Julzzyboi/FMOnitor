package com.FMOnitor_SpringWeb.FMOnitor_WebBE.security;

import com.FMOnitor_SpringWeb.FMOnitor_WebBE.model.tbl_LoginLogs;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.model.tbl_Users;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.repo.tbl_LoginLogsRepo;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.repo.tbl_UsersRepo;

import org.springframework.stereotype.Service;

import java.time.Instant;

// Shared find-or-create-user + log-login logic, used by every Google login
// path (web OIDC redirect via CustomOAuth2UserService, mobile ID-token via
// MobileAuthController) so they can never drift into different business
// rules for what "log this person in" actually means.
@Service
public class UserProvisioningService {

    private static final String DEFAULT_ROLE = "Requestor";
    private static final String STATUS_ACTIVE = "Active";
    private static final String STATUS_UNREGISTERED = "Unregistered";

    private final tbl_UsersRepo usersRepo;
    private final tbl_LoginLogsRepo loginLogsRepo;

    public UserProvisioningService(tbl_UsersRepo usersRepo, tbl_LoginLogsRepo loginLogsRepo) {
        this.usersRepo = usersRepo;
        this.loginLogsRepo = loginLogsRepo;
    }

    /**
     * Finds or creates the tbl_users row for a Google account and records a
     * login. Returning user (has logged in before) -> found by googleSub.
     * Invited-but-never-logged-in user -> has no googleSub yet, only findable
     * by email; this login is what "claims" that pending row instead of
     * creating a duplicate. Brand new, uninvited sign-in -> found by neither,
     * gets a fresh row.
     */
    public tbl_Users provisionFromGoogle(String googleSub, String email, String name, String pictureUrl) {
        tbl_Users user = usersRepo.findByGoogleSub(googleSub)
            .or(() -> usersRepo.findByEmail(email))
            .orElseGet(tbl_Users::new);

        user.setGoogleSub(googleSub);
        user.setEmail(email);
        user.setName(name);
        user.setPictureUrl(pictureUrl);
        if (user.getRole() == null) {
            user.setRole(DEFAULT_ROLE);
        }
        // Claiming a pending invite (or a brand new signup) activates the account.
        // An admin-set status (Inactive/Disabled) is left alone on a returning login.
        if (user.getStatus() == null || STATUS_UNREGISTERED.equals(user.getStatus())) {
            user.setStatus(STATUS_ACTIVE);
        }
        usersRepo.save(user);

        // Every successful login gets its own log row - this is what powers the
        // History page's login activity, separate from the user's own profile row above.
        loginLogsRepo.save(new tbl_LoginLogs(null, email, name, pictureUrl, user.getRole(), "LOGGED IN", Instant.now()));

        return user;
    }
}
