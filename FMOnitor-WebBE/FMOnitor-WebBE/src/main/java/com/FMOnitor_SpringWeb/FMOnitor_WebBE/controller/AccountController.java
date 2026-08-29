package com.FMOnitor_SpringWeb.FMOnitor_WebBE.controller;

import com.FMOnitor_SpringWeb.FMOnitor_WebBE.model.tbl_Users;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.repo.tbl_UsersRepo;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.service.EmailService;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/accounts")
public class AccountController {

    private static final Logger log = LoggerFactory.getLogger(AccountController.class);

    private static final String STATUS_UNREGISTERED = "Unregistered";
    private static final String ROLE_SUPERADMIN = "Superadmin";

    private final tbl_UsersRepo usersRepo;
    private final EmailService emailService;

    public AccountController(tbl_UsersRepo usersRepo, EmailService emailService) {
        this.usersRepo = usersRepo;
        this.emailService = emailService;
    }

    @GetMapping
    public List<tbl_Users> getAccounts() {
        return usersRepo.findAll();
    }

    // "name" is optional - a Notion-style invite is just an email + role, no
    // name collected upfront. It gets filled in for real once the person
    // actually signs in with Google and claims this row.
    public record InviteRequest(String email, String role) {}

    @PostMapping("/invite")
    public ResponseEntity<?> invite(@RequestBody InviteRequest request, @AuthenticationPrincipal OidcUser principal) {
        if (!isSuperadmin(principal)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of("message", "Only Superadmins can invite new users"));
        }

        if (usersRepo.findByEmail(request.email()).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(Map.of("message", "An account with this email already exists"));
        }

        // Placeholder display name so the Accounts table doesn't show a blank
        // name before this person has ever logged in - e.g. "julien.novilla" from the email.
        String placeholderName = request.email().split("@")[0];

        tbl_Users user = new tbl_Users();
        user.setEmail(request.email());
        user.setName(placeholderName);
        user.setRole(request.role());
        user.setStatus(STATUS_UNREGISTERED);
        tbl_Users saved = usersRepo.save(user);

        // The account row is the source of truth - if the mail server isn't configured
        // yet (or Gmail rejects it), the invite still exists as Unregistered rather
        // than failing the whole request and leaving no record at all.
        try {
            emailService.sendInvite(request.email(), placeholderName, request.role());
        } catch (Exception e) {
            log.warn("Failed to send invite email to {}: {}", request.email(), e.getMessage());
        }

        return ResponseEntity.ok(saved);
    }

    // The session only carries Google's identity claims (email/name/picture), not our
    // own app role - that lives in tbl_users, so it has to be looked up by email here.
    private boolean isSuperadmin(OidcUser principal) {
        if (principal == null) {
            return false;
        }
        String email = principal.getAttribute("email");
        return usersRepo.findByEmail(email)
            .map(u -> ROLE_SUPERADMIN.equals(u.getRole()))
            .orElse(false);
    }
}
