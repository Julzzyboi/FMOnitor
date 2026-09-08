package com.FMOnitor_SpringWeb.FMOnitor_WebBE.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.security.core.AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationFailureHandler;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

// Without this, Spring Security's default failure handler sends the browser to
// "/login?error" - a URL this app doesn't serve (it's an SPA behind a separate
// frontend, not a server-rendered login page), so a rejected login (e.g.
// CustomOAuth2UserService throwing for an unrecognized or disabled account)
// would land on a raw Whitelabel error page instead of back on the real
// sign-in screen with something the user can actually read.
public class OAuth2LoginFailureHandler extends SimpleUrlAuthenticationFailureHandler {

    private final String frontendUrl;

    public OAuth2LoginFailureHandler(String frontendUrl) {
        this.frontendUrl = frontendUrl;
    }

    @Override
    public void onAuthenticationFailure(HttpServletRequest request, HttpServletResponse response,
                                         AuthenticationException exception) throws IOException {
        // CustomOAuth2UserService's OAuth2Error code ("unauthorized_user" /
        // "account_disabled") rides along on the exception - forward it as-is
        // so the frontend can show the right message instead of one generic one.
        String errorCode = "login_failed";
        if (exception instanceof OAuth2AuthenticationException oauthEx && oauthEx.getError() != null) {
            errorCode = oauthEx.getError().getErrorCode();
        }
        String encoded = URLEncoder.encode(errorCode, StandardCharsets.UTF_8);
        response.sendRedirect(frontendUrl + "/?error=" + encoded);
    }
}
