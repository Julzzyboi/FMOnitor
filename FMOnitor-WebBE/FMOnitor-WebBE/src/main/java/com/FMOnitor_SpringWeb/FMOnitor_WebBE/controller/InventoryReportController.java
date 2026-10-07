package com.FMOnitor_SpringWeb.FMOnitor_WebBE.controller;

import com.FMOnitor_SpringWeb.FMOnitor_WebBE.model.tbl_InventoryReports;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.repo.tbl_InventoryItemsRepo;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.repo.tbl_InventoryReportsRepo;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.util.MapUtil;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.util.SetUtil;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/inventory-reports")
public class InventoryReportController {

    private static final int DESCRIPTION_MAX = 1000;
    private static final String STATUS_OPEN = "Open";
    private static final String STATUS_RESOLVED = "Resolved";
    private static final Set<String> VALID_TYPES = SetUtil.of("Damaged", "Missing", "Needs Repair", "Other");
    private static final Set<String> VALID_STATUSES = SetUtil.of("Open", "In Progress", "Resolved");

    private final tbl_InventoryReportsRepo inventoryReportsRepo;
    private final tbl_InventoryItemsRepo inventoryItemsRepo;

    public InventoryReportController(tbl_InventoryReportsRepo inventoryReportsRepo,
                                     tbl_InventoryItemsRepo inventoryItemsRepo) {
        this.inventoryReportsRepo = inventoryReportsRepo;
        this.inventoryItemsRepo = inventoryItemsRepo;
    }

    // On PATCH a null field means "leave unchanged".
    public record InventoryReportRequest(Long itemId, String type, Integer quantity, String description,
                                         String status) {
    }

    // Newest first; ?itemId= narrows it to one item's reports.
    @GetMapping
    public List<tbl_InventoryReports> getInventoryReports(@RequestParam(required = false) Long itemId) {
        return itemId != null
            ? inventoryReportsRepo.findByItemIdOrderByCreatedAtDesc(itemId)
            : inventoryReportsRepo.findAllByOrderByCreatedAtDesc();
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getInventoryReport(@PathVariable Long id) {
        return inventoryReportsRepo.findById(id)
            .<ResponseEntity<?>>map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> createInventoryReport(@RequestBody InventoryReportRequest request,
                                                   Authentication authentication) {
        if (request.itemId() == null) {
            return badRequest("itemId is required");
        }
        String itemError = activeItemError(request.itemId());
        if (itemError != null) {
            return badRequest(itemError);
        }
        if (request.type() == null) {
            return badRequest("Report type is required");
        }
        if (request.quantity() == null) {
            return badRequest("Quantity is required");
        }
        String error = validate(request);
        if (error != null) {
            return badRequest(error);
        }

        String status = request.status() != null ? request.status() : STATUS_OPEN;
        tbl_InventoryReports report = new tbl_InventoryReports();
        report.setItemId(request.itemId());
        report.setType(request.type());
        report.setQuantity(request.quantity());
        report.setDescription(request.description());
        report.setStatus(status);
        report.setReportedBy(callerEmail(authentication));
        report.setResolvedAt(STATUS_RESOLVED.equals(status) ? Instant.now() : null);

        return ResponseEntity.ok(inventoryReportsRepo.save(report));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<?> updateInventoryReport(@PathVariable Long id, @RequestBody InventoryReportRequest request) {
        tbl_InventoryReports report = inventoryReportsRepo.findById(id).orElse(null);
        if (report == null) {
            return ResponseEntity.notFound().build();
        }
        if (request.itemId() != null && !request.itemId().equals(report.getItemId())) {
            String itemError = activeItemError(request.itemId());
            if (itemError != null) {
                return badRequest(itemError);
            }
        }
        String error = validate(request);
        if (error != null) {
            return badRequest(error);
        }

        if (request.itemId() != null) {
            report.setItemId(request.itemId());
        }
        if (request.type() != null) {
            report.setType(request.type());
        }
        if (request.quantity() != null) {
            report.setQuantity(request.quantity());
        }
        if (request.description() != null) {
            report.setDescription(request.description());
        }
        if (request.status() != null && !request.status().equals(report.getStatus())) {
            report.setStatus(request.status());
            report.setResolvedAt(STATUS_RESOLVED.equals(request.status()) ? Instant.now() : null);
        }

        return ResponseEntity.ok(inventoryReportsRepo.save(report));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteInventoryReport(@PathVariable Long id) {
        if (!inventoryReportsRepo.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        inventoryReportsRepo.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // Checks only the fields that were sent; required-ness is the caller's job.
    private String validate(InventoryReportRequest request) {
        if (request.type() != null && !VALID_TYPES.contains(request.type())) {
            return "Invalid report type";
        }
        if (request.quantity() != null && request.quantity() < 1) {
            return "Quantity must be at least 1";
        }
        if (request.status() != null && !VALID_STATUSES.contains(request.status())) {
            return "Invalid status";
        }
        if (request.description() != null && request.description().length() > DESCRIPTION_MAX) {
            return "Description must be " + DESCRIPTION_MAX + " characters or fewer";
        }
        return null;
    }

    // A report can only be filed against an item that exists and isn't in the trash bin.
    private String activeItemError(Long itemId) {
        return inventoryItemsRepo.findById(itemId)
            .map(item -> item.getDeletedAt() != null ? "That item is in the trash bin - restore it first" : null)
            .orElse("No inventory item exists with that itemId");
    }

    // Web logins arrive as an OidcUser, mobile JWT logins as the email itself.
    private String callerEmail(Authentication authentication) {
        if (authentication == null) {
            return null;
        }
        if (authentication.getPrincipal() instanceof OidcUser oidcUser) {
            return oidcUser.getEmail();
        }
        return authentication.getName();
    }

    private ResponseEntity<?> badRequest(String message) {
        return ResponseEntity.badRequest().body(MapUtil.of("message", message));
    }
}
