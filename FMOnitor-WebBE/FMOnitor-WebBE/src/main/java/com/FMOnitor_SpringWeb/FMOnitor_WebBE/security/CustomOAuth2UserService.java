package com.FMOnitor_SpringWeb.FMOnitor_WebBE.security;

import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserService;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Service;

// Google's registration includes the "openid" scope by default, which makes this
// an OIDC login, not a plain OAuth2 one - Spring Security routes those through
// OidcUserService, not the plain OAuth2UserService. This is the hook that
// actually runs for Google logins.
@Service
public class CustomOAuth2UserService extends OidcUserService {

    private final UserProvisioningService userProvisioningService;

    public CustomOAuth2UserService(UserProvisioningService userProvisioningService) {
        this.userProvisioningService = userProvisioningService;
    }

    @Override
    public OidcUser loadUser(OidcUserRequest userRequest) throws OAuth2AuthenticationException {
        OidcUser oidcUser = super.loadUser(userRequest);

        userProvisioningService.provisionFromGoogle(
            oidcUser.getAttribute("sub"),
            oidcUser.getAttribute("email"),
            oidcUser.getAttribute("name"),
            oidcUser.getAttribute("picture"));

        // The OidcUser returned here is still what Spring Security's session/JwtAuthenticationSuccessHandler
        // see as the "principal" - we're only using this hook to persist a row, not changing the auth flow itself.
        return oidcUser;
    }
}
