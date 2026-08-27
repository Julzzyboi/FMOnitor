package com.FMOnitor_SpringWeb.FMOnitor_WebBE.security;

import com.FMOnitor_SpringWeb.FMOnitor_WebBE.model.tbl_Users;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.repo.tbl_UsersRepo;

import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

// Hooks into Spring Security's OAuth2 login right when it loads the user's
// profile from Google - this runs on every login, before the success handler.
@Service
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private static final String DEFAULT_ROLE = "USER";

    private final tbl_UsersRepo usersRepo;

    public CustomOAuth2UserService(tbl_UsersRepo usersRepo) {
        this.usersRepo = usersRepo;
    }

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);

        String googleSub = oAuth2User.getAttribute("sub");
        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");
        String picture = oAuth2User.getAttribute("picture");

        tbl_Users user = usersRepo.findByGoogleSub(googleSub).orElseGet(tbl_Users::new);
        user.setGoogleSub(googleSub);
        user.setEmail(email);
        user.setName(name);
        user.setPictureUrl(picture);
        if (user.getRole() == null) {
            user.setRole(DEFAULT_ROLE);
        }
        usersRepo.save(user);

        // The OAuth2User returned here is still what Spring Security's session/JwtAuthenticationSuccessHandler
        // see as the "principal" - we're only using this hook to persist a row, not changing the auth flow itself.
        return oAuth2User;
    }
}
