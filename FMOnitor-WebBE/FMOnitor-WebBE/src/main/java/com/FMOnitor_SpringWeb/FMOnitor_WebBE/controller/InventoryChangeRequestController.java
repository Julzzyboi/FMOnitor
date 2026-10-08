package com.FMOnitor_SpringWeb.FMOnitor_WebBE.controller;

import com.FMOnitor_SpringWeb.FMOnitor_WebBE.model.tbl_Users;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.repo.tbl_InventoryChangeRequestsRepo;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.service.CurrentUserService;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.service.InventoryChangeRequestService;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.service.InventoryChangeRequestService.Outcome;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.util.MapUtil;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.function.Supplier;

// The approval queue. Superadmins see every request and decide them; Admins
// see (and can cancel) only their own.
@RestController
@RequestMapping("/api/inventory-change-requests")
public class InventoryChangeRequestController {

    private final tbl_InventoryChangeRequestsRepo requestsRepo;
    private final InventoryChangeRequestService changeRequestService;
    private final CurrentUserService currentUserService;

    public InventoryChangeRequestController(tbl_InventoryChangeRequestsRepo requestsRepo,
                                            InventoryChangeRequestService changeRequestService,
                                            CurrentUserService currentUserService) {
        this.requestsRepo = requestsRepo;
        this.changeRequestService = changeRequestService;
        this.currentUserService = currentUserService;
    }

    public record RejectRequest(String reason) {
    }

    // Superadmin: the whole queue, oldest first. Admin: their own, newest first.
    @GetMapping
    public ResponseEntity<?> getRequests(Authentication authentication) {
        tbl_Users user = currentUserService.find(authentication).orElse(null);
        if (CurrentUserService.isSuperadmin(user)) {
            return ResponseEntity.ok(requestsRepo.findAllByOrderByIdAsc());
        }
        if (CurrentUserService.isAdmin(user)) {
            return ResponseEntity.ok(requestsRepo.findByRequestedByEmailOrderByIdDesc(user.getEmail()));
        }
        return forbidden("Only Superadmins and Admins can view inventory change requests");
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<?> approve(@PathVariable Long id, Authentication authentication) {
        tbl_Users user = currentUserService.find(authentication).orElse(null);
        if (!CurrentUserService.isSuperadmin(user)) {
            return forbidden("Only Superadmins can approve changes");
        }
        return respond(() -> changeRequestService.approve(id, user));
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<?> reject(@PathVariable Long id, @RequestBody(required = false) RejectRequest body,
                                    Authentication authentication) {
        tbl_Users user = currentUserService.find(authentication).orElse(null);
        if (!CurrentUserService.isSuperadmin(user)) {
            return forbidden("Only Superadmins can reject changes");
        }
        return respond(() -> changeRequestService.reject(id, user, body != null ? body.reason() : null));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> cancel(@PathVariable Long id, Authentication authentication) {
        tbl_Users user = currentUserService.find(authentication).orElse(null);
        if (user == null) {
            return forbidden("Sign in to cancel a request");
        }
        return respond(() -> changeRequestService.cancel(id, user));
    }

    private static ResponseEntity<?> respond(Supplier<Outcome> action) {
        Outcome outcome;
        try {
            outcome = action.get();
        } catch (ObjectOptimisticLockingFailureException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(MapUtil.of("message", "Another Superadmin just decided this request - refresh to see the result"));
        }
        return outcome.ok()
            ? ResponseEntity.ok(MapUtil.of("message", outcome.message(), "request", outcome.request()))
            : ResponseEntity.status(outcome.status()).body(MapUtil.of("message", outcome.message()));
    }

    private static ResponseEntity<?> forbidden(String message) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(MapUtil.of("message", message));
    }
}
