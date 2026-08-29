package com.FMOnitor_SpringWeb.FMOnitor_WebBE.controller;

import com.FMOnitor_SpringWeb.FMOnitor_WebBE.repo.tbl_UsersRepo;

import java.util.HashMap;
import java.util.Map;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class AuthController {

    private final tbl_UsersRepo usersRepo;

    public AuthController(tbl_UsersRepo usersRepo) {
        this.usersRepo = usersRepo;
    }

    @GetMapping("/api/user")
    public Map<String, Object> getCurrentUser(@AuthenticationPrincipal OAuth2User principal) {
        String email = principal.getAttribute("email");
        // Session only carries Google's identity claims - our app's own role
        // lives in tbl_users and has to be looked up separately.
        // Map.of() would throw on a null role, hence HashMap here.
        String role = usersRepo.findByEmail(email).map(u -> u.getRole()).orElse(null);

        Map<String, Object> response = new HashMap<>();
        response.put("name", principal.getAttribute("name"));
        response.put("email", email);
        response.put("picture", principal.getAttribute("picture"));
        response.put("role", role);
        return response;
    }
}
