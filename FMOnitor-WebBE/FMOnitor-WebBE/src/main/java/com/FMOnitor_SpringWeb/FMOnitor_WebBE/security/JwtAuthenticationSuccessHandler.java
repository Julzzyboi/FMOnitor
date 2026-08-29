package com.FMOnitor_SpringWeb.FMOnitor_WebBE.security;

import com.FMOnitor_SpringWeb.FMOnitor_WebBE.model.tbl_Users;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.repo.tbl_UsersRepo;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;

public class JwtAuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    static final String REFRESH_COOKIE_NAME = "refresh_token";

    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;
    private final tbl_UsersRepo usersRepo;
    private final String frontendUrl;
    private final boolean secureCookie;

    public JwtAuthenticationSuccessHandler(JwtService jwtService, RefreshTokenService refreshTokenService,
                                            tbl_UsersRepo usersRepo, String frontendUrl, boolean secureCookie) {
        this.jwtService = jwtService;
        this.refreshTokenService = refreshTokenService;
        this.usersRepo = usersRepo;
        this.frontendUrl = frontendUrl;
        this.secureCookie = secureCookie;
    }

    @Override
    protected String determineTargetUrl(HttpServletRequest request, HttpServletResponse response, Authentication authentication) {
        OAuth2User principal = (OAuth2User) authentication.getPrincipal();
        String accessToken = jwtService.generateToken(principal);

        // Long-lived, server-side-revocable refresh token - handed to the browser
        // only as an httpOnly cookie (never readable/stealable from JS, unlike the
        // access token which the frontend deliberately keeps in localStorage today).
        String email = principal.getAttribute("email");
        tbl_Users user = usersRepo.findByEmail(email).orElse(null);
        if (user != null) {
            String rawRefreshToken = refreshTokenService.issueToken(user.getId());
            ResponseCookie cookie = ResponseCookie.from(REFRESH_COOKIE_NAME, rawRefreshToken)
                .httpOnly(true)
                .secure(secureCookie)
                .sameSite("Lax")
                .path("/api/auth")
                .maxAge(refreshTokenService.getExpirationMs() / 1000)
                .build();
            response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
        }

        return frontendUrl + "/?token=" + accessToken;
    }
}
