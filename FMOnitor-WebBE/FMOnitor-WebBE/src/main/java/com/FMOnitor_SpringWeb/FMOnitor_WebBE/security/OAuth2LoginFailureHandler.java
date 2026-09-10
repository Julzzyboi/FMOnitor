package com.FMOnitor_SpringWeb.FMOnitor_WebBE.security;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.springframework.security.core.AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationFailureHandler;

import java.io.IOException;
import java.net.URLEncoder;

// Sends a rejected login (e.g. CustomOAuth2UserService throwing for an
// unrecognized or disabled account) back to our own server-rendered
// /login page with an ?error=<code>, which PageController turns into a
// readable message. Without this, Spring Security's default would land on
// a bare "/login?error" with no useful text.
public class OAuth2LoginFailureHandler extends SimpleUrlAuthenticationFailureHandler {

    @Override
    public void onAuthenticationFailure(HttpServletRequest request, HttpServletResponse response,
                                         AuthenticationException exception) throws IOException {
        // CustomOAuth2UserService's OAuth2Error code ("unauthorized_user" /
        // "account_disabled") rides along on the exception - forward it as-is
        // so the login page can show the right message instead of a generic one.
        String errorCode = "login_failed";
        if (exception instanceof OAuth2AuthenticationException) {
            OAuth2AuthenticationException oauthEx = (OAuth2AuthenticationException) exception;
            if (oauthEx.getError() != null) {
                errorCode = oauthEx.getError().getErrorCode();
            }
        }
        // URLEncoder.encode(String, Charset) needs Java 10 - this project
        // targets Java 8, where the only encode() overload takes the charset
        // name as a String instead (and declares a checked
        // UnsupportedEncodingException, already covered by this method's own
        // "throws IOException" since that exception is an IOException subtype).
        String encoded = URLEncoder.encode(errorCode, "UTF-8");
        response.sendRedirect("/login?error=" + encoded);
    }
}
