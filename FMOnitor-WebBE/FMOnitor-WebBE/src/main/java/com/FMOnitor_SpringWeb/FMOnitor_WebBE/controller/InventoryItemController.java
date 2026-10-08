package com.FMOnitor_SpringWeb.FMOnitor_WebBE.controller;

import com.FMOnitor_SpringWeb.FMOnitor_WebBE.model.tbl_InventoryChangeRequests;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.model.tbl_InventoryItems;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.model.tbl_Users;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.repo.tbl_InventoryItemsRepo;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.service.CurrentUserService;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.service.InventoryChangeRequestService;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.service.InventoryService;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.service.InventoryService.ItemChanges;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.util.MapUtil;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.function.Function;

import static com.FMOnitor_SpringWeb.FMOnitor_WebBE.model.tbl_InventoryChangeRequests.*;

// Who can change the inventory:
//  - Superadmin: changes are applied immediately.
//  - Admin: the change is checked, then queued for a Superadmin to approve
//    or reject (202 Accepted with the queued request) - nothing changes yet.
//  - Anyone else: read-only (403).
@RestController
@RequestMapping("/api/inventory-items")
public class InventoryItemController {

    private final tbl_InventoryItemsRepo inventoryItemsRepo;
    private final InventoryService inventoryService;
    private final InventoryChangeRequestService changeRequestService;
    private final CurrentUserService currentUserService;

    public InventoryItemController(tbl_InventoryItemsRepo inventoryItemsRepo,
                                   InventoryService inventoryService,
                                   InventoryChangeRequestService changeRequestService,
                                   CurrentUserService currentUserService) {
        this.inventoryItemsRepo = inventoryItemsRepo;
        this.inventoryService = inventoryService;
        this.changeRequestService = changeRequestService;
        this.currentUserService = currentUserService;
    }

    // Active items by default; ?trashed=true lists the trash bin instead.
    // ?storageId= narrows either to one Campus Map storage.
    @GetMapping
    public List<tbl_InventoryItems> getInventoryItems(@RequestParam(required = false) Long storageId,
                                                      @RequestParam(defaultValue = "false") boolean trashed) {
        if (trashed) {
            return storageId != null
                ? inventoryItemsRepo.findByStorageIdAndDeletedAtIsNotNullOrderByDeletedAtDesc(storageId)
                : inventoryItemsRepo.findByDeletedAtIsNotNullOrderByDeletedAtDesc();
        }
        return storageId != null
            ? inventoryItemsRepo.findByStorageIdAndDeletedAtIsNull(storageId)
            : inventoryItemsRepo.findByDeletedAtIsNull();
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getInventoryItem(@PathVariable Long id) {
        return inventoryItemsRepo.findById(id)
            .<ResponseEntity<?>>map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> createInventoryItem(@RequestBody ItemChanges request, Authentication authentication) {
        tbl_Users user = currentUserService.find(authentication).orElse(null);
        if (!canChange(user)) {
            return forbidden();
        }
        String error = inventoryService.checkCreate(request);
        if (error != null) {
            return badRequest(error);
        }
        if (CurrentUserService.isSuperadmin(user)) {
            return ResponseEntity.ok(inventoryService.create(request));
        }
        return queued(changeRequestService.submit(user, ACTION_CREATE, null, request, null));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<?> updateInventoryItem(@PathVariable Long id, @RequestBody ItemChanges request,
                                                 Authentication authentication) {
        tbl_Users user = currentUserService.find(authentication).orElse(null);
        if (!canChange(user)) {
            return forbidden();
        }
        tbl_InventoryItems item = inventoryItemsRepo.findById(id).orElse(null);
        if (item == null) {
            return ResponseEntity.notFound().build();
        }
        String error = inventoryService.checkUpdate(item, request);
        if (error != null) {
            return badRequest(error);
        }
        if (CurrentUserService.isSuperadmin(user)) {
            return ResponseEntity.ok(inventoryService.update(item, request));
        }
        // Only the fields that actually change are queued, so two Admins
        // editing different fields of one item don't overwrite each other.
        ItemChanges changes = inventoryService.onlyChanged(item, request);
        if (InventoryService.isEmpty(changes)) {
            return badRequest("Nothing was changed");
        }
        return queued(changeRequestService.submit(user, ACTION_UPDATE, item, changes,
            inventoryService.currentValuesOf(item, changes)));
    }

    // Soft delete: moves the item to the trash bin. It (and its reports) can
    // be restored until it's permanently deleted - by hand or after 30 days.
    @DeleteMapping("/{id}")
    public ResponseEntity<?> trashInventoryItem(@PathVariable Long id, Authentication authentication) {
        return itemAction(id, authentication, ACTION_TRASH, inventoryService::checkTrash,
            item -> ResponseEntity.ok(inventoryService.trash(item)));
    }

    @PostMapping("/{id}/restore")
    public ResponseEntity<?> restoreInventoryItem(@PathVariable Long id, Authentication authentication) {
        return itemAction(id, authentication, ACTION_RESTORE, inventoryService::checkRestore,
            item -> ResponseEntity.ok(inventoryService.restore(item)));
    }

    @DeleteMapping("/{id}/permanent")
    public ResponseEntity<?> permanentlyDeleteInventoryItem(@PathVariable Long id, Authentication authentication) {
        return itemAction(id, authentication, ACTION_PERMANENT_DELETE, inventoryService::checkPermanentDelete,
            item -> {
                inventoryService.permanentlyDelete(item.getId());
                return ResponseEntity.noContent().build();
            });
    }

    // Shared flow for the trash-bin actions: find the item, check the action
    // is valid for it, then apply (Superadmin) or queue (Admin).
    private ResponseEntity<?> itemAction(Long id, Authentication authentication, String action,
                                         Function<tbl_InventoryItems, String> check,
                                         Function<tbl_InventoryItems, ResponseEntity<?>> apply) {
        tbl_Users user = currentUserService.find(authentication).orElse(null);
        if (!canChange(user)) {
            return forbidden();
        }
        tbl_InventoryItems item = inventoryItemsRepo.findById(id).orElse(null);
        if (item == null) {
            return ResponseEntity.notFound().build();
        }
        String error = check.apply(item);
        if (error != null) {
            return badRequest(error);
        }
        if (CurrentUserService.isSuperadmin(user)) {
            return apply.apply(item);
        }
        return queued(changeRequestService.submit(user, action, item, null, null));
    }

    private static boolean canChange(tbl_Users user) {
        return CurrentUserService.isSuperadmin(user) || CurrentUserService.isAdmin(user);
    }

    private static ResponseEntity<?> queued(tbl_InventoryChangeRequests request) {
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(MapUtil.of(
            "message", "Sent to a Superadmin for approval. Nothing changes until it's approved.",
            "request", request));
    }

    private static ResponseEntity<?> forbidden() {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
            .body(MapUtil.of("message", "Only Superadmins and Admins can change the inventory"));
    }

    private static ResponseEntity<?> badRequest(String message) {
        return ResponseEntity.badRequest().body(MapUtil.of("message", message));
    }
}
