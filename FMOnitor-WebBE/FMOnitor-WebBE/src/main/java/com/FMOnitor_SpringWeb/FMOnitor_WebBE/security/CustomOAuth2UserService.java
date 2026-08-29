package com.FMOnitor_SpringWeb.FMOnitor_WebBE.security;

import com.FMOnitor_SpringWeb.FMOnitor_WebBE.model.tbl_LoginLogs;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.model.tbl_Users;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.repo.tbl_LoginLogsRepo;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.repo.tbl_UsersRepo;

import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserService;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
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
        // Brand new, uninvited sign-in -> found by neither, gets a fresh row.
        tbl_Users user = usersRepo.findByGoogleSub(googleSub)
            .or(() -> usersRepo.findByEmail(email))
            .orElseGet(tbl_Users::new);

        user.setGoogleSub(googleSub);
        user.setEmail(email);
        user.setName(name);
        user.setPictureUrl(picture);
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
        loginLogsRepo.save(new tbl_LoginLogs(null, email, name, picture, user.getRole(), "LOGGED IN", Instant.now()));

        // The OidcUser returned here is still what Spring Security's session/JwtAuthenticationSuccessHandler
        // see as the "principal" - we're only using this hook to persist a row, not changing the auth flow itself.
        return oidcUser;
    }
}
