package com.FMOnitor_SpringWeb.FMOnitor_WebBE.service;

import com.FMOnitor_SpringWeb.FMOnitor_WebBE.model.tbl_Users;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.repo.tbl_UsersRepo;

import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Service;

import java.util.Optional;

// Looks up the tbl_Users row (and so the role) of whoever made the request.
@Service
public class CurrentUserService {

    public static final String ROLE_SUPERADMIN = "Superadmin";
    public static final String ROLE_ADMIN = "Admin";

    private final tbl_UsersRepo usersRepo;

    public CurrentUserService(tbl_UsersRepo usersRepo) {
        this.usersRepo = usersRepo;
    }

    public Optional<tbl_Users> find(Authentication authentication) {
        String email = emailOf(authentication);
        return email == null ? Optional.empty() : usersRepo.findByEmail(email);
    }

    // Web logins arrive as an OidcUser, mobile JWT logins as the email itself.
    public static String emailOf(Authentication authentication) {
        if (authentication == null) {
            return null;
        }
        if (authentication.getPrincipal() instanceof OidcUser oidcUser) {
            return oidcUser.getEmail();
        }
        return authentication.getName();
    }

    public static boolean isSuperadmin(tbl_Users user) {
        return user != null && ROLE_SUPERADMIN.equals(user.getRole());
    }

    public static boolean isAdmin(tbl_Users user) {
        return user != null && ROLE_ADMIN.equals(user.getRole());
    }

    public static String displayName(tbl_Users user) {
        return user.getName() != null && !user.getName().isBlank() ? user.getName() : user.getEmail();
    }
}
