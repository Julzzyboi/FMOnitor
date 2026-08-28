package com.FMOnitor_SpringWeb.FMOnitor_WebBE.security;

import com.FMOnitor_SpringWeb.FMOnitor_WebBE.model.tbl_LoginLogs;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.model.tbl_Users;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.repo.tbl_LoginLogsRepo;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.repo.tbl_UsersRepo;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.web.authentication.logout.LogoutSuccessHandler;

import java.io.IOException;
import java.time.Instant;

// Mirrors what CustomOAuth2UserService does for LOGIN, but for the logout
// flow instead - Spring Security still has the just-logged-out principal
// available here, before the security context is fully cleared.
public class LogoutLogHandler implements LogoutSuccessHandler {

    private static final String DEFAULT_ROLE = "USER";

    private final tbl_LoginLogsRepo loginLogsRepo;
    private final tbl_UsersRepo usersRepo;
    private final String frontendUrl;

    public LogoutLogHandler(tbl_LoginLogsRepo loginLogsRepo, tbl_UsersRepo usersRepo, String frontendUrl) {
        this.loginLogsRepo = loginLogsRepo;
        this.usersRepo = usersRepo;
        this.frontendUrl = frontendUrl;
    }

    @Override
    public void onLogoutSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException {
        if (authentication != null && authentication.getPrincipal() instanceof OidcUser oidcUser) {
            String googleSub = oidcUser.getAttribute("sub");
            String email = oidcUser.getAttribute("email");
            String name = oidcUser.getAttribute("name");
            String picture = oidcUser.getAttribute("picture");
            String role = usersRepo.findByGoogleSub(googleSub).map(tbl_Users::getRole).orElse(DEFAULT_ROLE);

            loginLogsRepo.save(new tbl_LoginLogs(null, email, name, picture, role, "LOGGED OUT", Instant.now()));
        }

        response.sendRedirect(frontendUrl + "/");
    }
}
