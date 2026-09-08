package com.FMOnitor_SpringWeb.FMOnitor_WebBE.controller;

import com.FMOnitor_SpringWeb.FMOnitor_WebBE.model.tbl_Users;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.repo.tbl_UsersRepo;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.service.AccountService;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.service.EmailService;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/accounts")
public class AccountController {

    private static final Logger log = LoggerFactory.getLogger(AccountController.class);

    private static final String STATUS_UNREGISTERED = "Unregistered";
    private static final String ROLE_SUPERADMIN = "Superadmin";
    // Matches the vocabulary tbl_Users.status is documented to use (see that
    // model's own comment) - Delete, Disable, and Restore in the frontend are
    // all just this same status change with a different target value.
    private static final Set<String> VALID_STATUSES = Set.of("Active", "Inactive", "Unregistered", "Disabled", "Deleted");

    private final tbl_UsersRepo usersRepo;
    private final EmailService emailService;
    private final AccountService accountService;

    public AccountController(tbl_UsersRepo usersRepo, EmailService emailService, AccountService accountService) {
        this.usersRepo = usersRepo;
        this.emailService = emailService;
        this.accountService = accountService;
    }

    // Previously had no role check at all - any authenticated user (Admin,
    // Hauler, even Requestor) could hit this directly and get the full user
    // list, regardless of what the Accounts page's own UI showed or hid.
    // The frontend route guard alone can't be trusted for this - it only
    // controls what's rendered, not what the API will hand back to a direct
    // request - so the real restriction has to live here too.
    @GetMapping
    public ResponseEntity<?> getAccounts(@AuthenticationPrincipal OidcUser principal) {
        if (!isSuperadmin(principal)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of("message", "Only Superadmins can view accounts"));
        }
        return ResponseEntity.ok(usersRepo.findAll());
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

    public record UpdateStatusRequest(String status) {}

    // Backs Delete ("Deleted"), Disable ("Disabled"), and Restore (back to
    // "Active") from the Accounts page - previously all three only updated
    // React state in the browser tab that clicked them, with nothing actually
    // saved, so the change vanished on refresh and no other admin ever saw it.
    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestBody UpdateStatusRequest request,
                                           @AuthenticationPrincipal OidcUser principal) {
        if (!isSuperadmin(principal)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of("message", "Only Superadmins can change account status"));
        }

        if (request.status() == null || !VALID_STATUSES.contains(request.status())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid status"));
        }

        tbl_Users user = usersRepo.findById(id).orElse(null);
        if (user == null) {
            return ResponseEntity.notFound().build();
        }

        // A Superadmin disabling/deleting their own only account would lock
        // everyone out with nobody left to undo it - refuse it outright rather
        // than let that happen by accident.
        String callerEmail = principal.getAttribute("email");
        if (user.getEmail().equals(callerEmail) && !"Active".equals(request.status())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of("message", "You can't disable or delete your own account"));
        }

        // Only ever set while status is actually "Deleted" - clearing it on
        // any other transition (e.g. Restore) means a later re-delete starts
        // the 3-month countdown over, rather than the scheduler using a stale
        // timestamp from a much earlier archiving.
        user.setDeletedAt("Deleted".equals(request.status()) ? Instant.now() : null);
        user.setStatus(request.status());
        return ResponseEntity.ok(usersRepo.save(user));
    }

    // Real, unrecoverable deletion - only reachable from an already-archived
    // (status="Deleted") account, i.e. the Deleted Users view's own "Delete
    // Permanently" action, not the regular Delete. The same 3-month auto-purge
    // reaches this exact state on its own; this is just doing it early, on request.
    @DeleteMapping("/{id}")
    public ResponseEntity<?> permanentlyDelete(@PathVariable Long id, @AuthenticationPrincipal OidcUser principal) {
        if (!isSuperadmin(principal)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of("message", "Only Superadmins can permanently delete accounts"));
        }

        tbl_Users user = usersRepo.findById(id).orElse(null);
        if (user == null) {
            return ResponseEntity.notFound().build();
        }

        if (!"Deleted".equals(user.getStatus())) {
            return ResponseEntity.badRequest()
                .body(Map.of("message", "Only an already-deleted account can be permanently deleted"));
        }

        String callerEmail = principal.getAttribute("email");
        if (user.getEmail().equals(callerEmail)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of("message", "You can't delete your own account"));
        }

        accountService.permanentlyDelete(id);
        return ResponseEntity.noContent().build();
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
