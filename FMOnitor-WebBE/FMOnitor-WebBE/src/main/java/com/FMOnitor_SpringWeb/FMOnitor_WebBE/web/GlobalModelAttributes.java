package com.FMOnitor_SpringWeb.FMOnitor_WebBE.web;

import com.FMOnitor_SpringWeb.FMOnitor_WebBE.repo.tbl_UsersRepo;

import java.util.HashMap;
import java.util.Map;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ModelAttribute;

// Puts the logged-in user (name / email / picture / role) into the model for
// every Thymeleaf page, so the shared layout (sidebar role filter, topbar
// profile menu) can render it without each PageController method fetching it.
// Same data, same lookup as the REST-side AuthController#getCurrentUser - the
// mobile app gets it as JSON there, the web pages get it as ${currentUser} here.
//
// Scoped to @Controller only (not @RestController) so it never runs for the
// JSON API endpoints.
@ControllerAdvice(annotations = org.springframework.stereotype.Controller.class)
public class GlobalModelAttributes {

    private final tbl_UsersRepo usersRepo;

    public GlobalModelAttributes(tbl_UsersRepo usersRepo) {
        this.usersRepo = usersRepo;
    }

    @ModelAttribute("currentUser")
    public Map<String, Object> currentUser(@AuthenticationPrincipal OAuth2User principal) {
        // The /login page is the one @Controller route reachable without a
        // session - principal is null there. Returning null keeps ${currentUser}
        // simply absent rather than blowing up.
        if (principal == null) {
            return null;
        }

        String email = principal.getAttribute("email");
        // Google's session carries identity, not our app's role - that lives in
        // tbl_users and is looked up separately. HashMap (not MapUtil.of) so a
        // null role doesn't throw.
        String role = usersRepo.findByEmail(email).map(u -> u.getRole()).orElse(null);

        Map<String, Object> user = new HashMap<>();
        user.put("name", principal.getAttribute("name"));
        user.put("email", email);
        user.put("picture", principal.getAttribute("picture"));
        user.put("role", role);
        return user;
    }
}
