package com.FMOnitor_SpringWeb.FMOnitor_WebBE.security;

import com.FMOnitor_SpringWeb.FMOnitor_WebBE.model.tbl_LoginLogs;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.model.tbl_Users;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.repo.tbl_LoginLogsRepo;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.repo.tbl_UsersRepo;

import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.stereotype.Service;

import java.time.Instant;

// Shared find-or-create-user + log-login logic, used by every Google login
// path (web OIDC redirect via CustomOAuth2UserService, mobile ID-token via
// MobileAuthController) so they can never drift into different business
// rules for what "log this person in" actually means - including who's
// actually allowed to log in at all. Both callers propagate
// OAuth2AuthenticationException on rejection: the web path already gets this
// for free via Spring Security's oauth2Login filter chain (routed to
// OAuth2LoginFailureHandler); MobileAuthController catches it explicitly.
@Service
public class UserProvisioningService {

    private static final String DEFAULT_ROLE = "Requestor";
    private static final String STATUS_ACTIVE = "Active";
    private static final String STATUS_UNREGISTERED = "Unregistered";
    private static final String STATUS_DISABLED = "Disabled";
    private static final String STATUS_DELETED = "Deleted";

    private final tbl_UsersRepo usersRepo;
    private final tbl_LoginLogsRepo loginLogsRepo;

    public UserProvisioningService(tbl_UsersRepo usersRepo, tbl_LoginLogsRepo loginLogsRepo) {
        this.usersRepo = usersRepo;
        this.loginLogsRepo = loginLogsRepo;
    }

    /**
     * Finds the tbl_users row for a Google account and records a login.
     * Returning user (has logged in before) -> found by googleSub.
     * Invited-but-never-logged-in user -> has no googleSub yet, only
     * findable by email; this login is what "claims" that pending row
     * instead of creating a duplicate. Anyone else - a real Google account
     * with no matching row here at all - is not an FMOnitor user and is
     * rejected, on every login path since they all call this.
     */
    public tbl_Users provisionFromGoogle(String googleSub, String email, String name, String pictureUrl) {
        tbl_Users user = usersRepo.findByGoogleSub(googleSub)
            .or(() -> usersRepo.findByEmail(email))
            .orElse(null);

        if (user == null) {
            throw new OAuth2AuthenticationException(new OAuth2Error("unauthorized_user"),
                "No FMOnitor account exists for " + email);
        }

        // Disable/Delete is an admin's explicit revocation of access - without this
        // check, that revocation only ever hid the account from the Accounts page's
        // UI; the account could still fully log in and get a real session, since
        // nothing anywhere in the login path looked at status before now.
        if (STATUS_DISABLED.equals(user.getStatus()) || STATUS_DELETED.equals(user.getStatus())) {
            throw new OAuth2AuthenticationException(new OAuth2Error("account_disabled"),
                "Account " + email + " is " + user.getStatus().toLowerCase());
        }

        user.setGoogleSub(googleSub);
        user.setEmail(email);
        user.setName(name);
        user.setPictureUrl(pictureUrl);
        if (user.getRole() == null) {
            user.setRole(DEFAULT_ROLE);
        }
        // Claiming a pending invite activates the account. Any other existing
        // status (e.g. Inactive) is left alone on a returning login.
        if (STATUS_UNREGISTERED.equals(user.getStatus())) {
            user.setStatus(STATUS_ACTIVE);
        }
        usersRepo.save(user);

        // Every successful login gets its own log row - this is what powers the
        // History page's login activity, separate from the user's own profile row above.
        loginLogsRepo.save(new tbl_LoginLogs(null, email, name, pictureUrl, user.getRole(), "LOGGED IN", Instant.now()));

        return user;
    }
}
