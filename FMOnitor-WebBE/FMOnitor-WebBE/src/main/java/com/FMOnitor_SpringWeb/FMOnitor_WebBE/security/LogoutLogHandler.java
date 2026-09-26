package com.FMOnitor_SpringWeb.FMOnitor_WebBE.security;

import com.FMOnitor_SpringWeb.FMOnitor_WebBE.model.tbl_LoginLogs;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.model.tbl_Users;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.repo.tbl_LoginLogsRepo;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.repo.tbl_UsersRepo;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.web.authentication.logout.LogoutSuccessHandler;

import java.io.IOException;
import java.time.Instant;

public class LogoutLogHandler implements LogoutSuccessHandler {

    static final String REFRESH_COOKIE_NAME = "refresh_token";

    private static final String DEFAULT_ROLE = "USER";

    private final tbl_LoginLogsRepo loginLogsRepo;
    private final tbl_UsersRepo usersRepo;
    private final RefreshTokenService refreshTokenService;
    private final String frontendUrl;
    private final boolean secureCookie;

    public LogoutLogHandler(tbl_LoginLogsRepo loginLogsRepo, tbl_UsersRepo usersRepo,
                             RefreshTokenService refreshTokenService, String frontendUrl, boolean secureCookie) {
        this.loginLogsRepo = loginLogsRepo;
        this.usersRepo = usersRepo;
        this.refreshTokenService = refreshTokenService;
        this.frontendUrl = frontendUrl;
        this.secureCookie = secureCookie;
    }

    @Override
    public void onLogoutSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException {
        if (authentication != null && authentication.getPrincipal() instanceof OidcUser) {
            OidcUser oidcUser = (OidcUser) authentication.getPrincipal();
            String googleSub = oidcUser.getAttribute("sub");
            String email = oidcUser.getAttribute("email");
            String name = oidcUser.getAttribute("name");
            String picture = oidcUser.getAttribute("picture");

            tbl_Users user = usersRepo.findByGoogleSub(googleSub).orElse(null);
            String role = user != null ? user.getRole() : DEFAULT_ROLE;

            if (user != null) {
                refreshTokenService.revokeAllForUser(user.getId());
            }
            ResponseCookie expiredCookie = ResponseCookie.from(REFRESH_COOKIE_NAME, "")
                .httpOnly(true)
                .secure(secureCookie)
                .sameSite("Lax")
                .path("/api/auth")
                .maxAge(0)
                .build();
            response.addHeader(HttpHeaders.SET_COOKIE, expiredCookie.toString());

            loginLogsRepo.save(new tbl_LoginLogs(null, email, name, picture, role, "LOGGED OUT", Instant.now()));
        }

        response.sendRedirect(frontendUrl + "/");
    }
}
