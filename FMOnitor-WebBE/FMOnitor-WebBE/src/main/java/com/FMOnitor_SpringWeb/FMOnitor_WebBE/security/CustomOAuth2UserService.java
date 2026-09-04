package com.FMOnitor_SpringWeb.FMOnitor_WebBE.security;

import com.FMOnitor_SpringWeb.FMOnitor_WebBE.model.tbl_LoginLogs;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.model.tbl_Users;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.repo.tbl_LoginLogsRepo;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.repo.tbl_UsersRepo;

import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserService;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Service;

import java.time.Instant;

// Google's registration includes the "openid" scope by default, which makes this
// an OIDC login, not a plain OAuth2 one - Spring Security routes those through
// OidcUserService, not the plain OAuth2UserService. This is the hook that
// actually runs for Google logins.
@Service
public class CustomOAuth2UserService extends OidcUserService {

    private static final String DEFAULT_ROLE = "Requestor";
    private static final String STATUS_ACTIVE = "Active";
    private static final String STATUS_UNREGISTERED = "Unregistered";
    private static final String STATUS_DISABLED = "Disabled";
    private static final String STATUS_DELETED = "Deleted";

    private final tbl_UsersRepo usersRepo;
    private final tbl_LoginLogsRepo loginLogsRepo;

    public CustomOAuth2UserService(tbl_UsersRepo usersRepo, tbl_LoginLogsRepo loginLogsRepo) {
        this.usersRepo = usersRepo;
        this.loginLogsRepo = loginLogsRepo;
    }

    @Override
    public OidcUser loadUser(OidcUserRequest userRequest) throws OAuth2AuthenticationException {
        OidcUser oidcUser = super.loadUser(userRequest);

        String googleSub = oidcUser.getAttribute("sub");
        String email = oidcUser.getAttribute("email");
        String name = oidcUser.getAttribute("name");
        String picture = oidcUser.getAttribute("picture");

        // Returning user (has logged in before) -> found by googleSub.
        // Invited-but-never-logged-in user -> has no googleSub yet, only findable by email;
        // this login is what "claims" that pending row instead of creating a duplicate.
        // Anyone else - a real Google account with no matching row here at all -
        // is not an FMOnitor user and is rejected below instead of being
        // auto-provisioned. Only an admin creating a row via Add User (or an
        // account that already exists) can ever sign in.
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
        user.setPictureUrl(picture);
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
        loginLogsRepo.save(new tbl_LoginLogs(null, email, name, picture, user.getRole(), "LOGGED IN", Instant.now()));

        // The OidcUser returned here is still what Spring Security's session/JwtAuthenticationSuccessHandler
        // see as the "principal" - we're only using this hook to persist a row, not changing the auth flow itself.
        return oidcUser;
    }
}
