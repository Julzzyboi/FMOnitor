package com.FMOnitor_SpringWeb.FMOnitor_WebBE.controller;

import com.FMOnitor_SpringWeb.FMOnitor_WebBE.model.tbl_InventoryItems;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.repo.tbl_CampusStoragesRepo;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.repo.tbl_InventoryItemsRepo;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.service.InventoryService;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.util.MapUtil;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.util.SetUtil;

import org.springframework.http.ResponseEntity;
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
@RequestMapping("/api/inventory-items")
public class InventoryItemController {

    private static final int NAME_MAX = 100;
    private static final Set<String> VALID_CONDITIONS = SetUtil.of("Good", "Defect", "Damaged", "Missing");
    private static final Set<String> VALID_AVAILABILITY = SetUtil.of("Borrowable", "Non-Borrowable");

    private final tbl_InventoryItemsRepo inventoryItemsRepo;
    private final tbl_CampusStoragesRepo campusStoragesRepo;
    private final InventoryService inventoryService;

    public InventoryItemController(tbl_InventoryItemsRepo inventoryItemsRepo,
                                   tbl_CampusStoragesRepo campusStoragesRepo,
                                   InventoryService inventoryService) {
        this.inventoryItemsRepo = inventoryItemsRepo;
        this.campusStoragesRepo = campusStoragesRepo;
        this.inventoryService = inventoryService;
    }

    // On PATCH a null field means "leave unchanged".
    public record InventoryItemRequest(String name, Long storageId, Integer available,
                                       String condition, String availability, String photoUrl) {
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
    public ResponseEntity<?> createInventoryItem(@RequestBody InventoryItemRequest request) {
        if (request.name() == null || request.name().isBlank()) {
            return badRequest("Item name is required");
        }
        if (request.storageId() == null) {
            return badRequest("Storage is required");
        }
        if (request.available() == null) {
            return badRequest("Quantity available is required");
        }
        if (request.condition() == null) {
            return badRequest("Condition is required");
        }
        if (request.availability() == null) {
            return badRequest("Item type is required");
        }
        String error = validate(request);
        if (error != null) {
            return badRequest(error);
        }

        tbl_InventoryItems item = new tbl_InventoryItems();
        item.setName(request.name().trim());
        item.setStorageId(request.storageId());
        item.setAvailable(request.available());
        item.setCondition(request.condition());
        item.setAvailability(request.availability());
        item.setPhotoUrl(request.photoUrl());

        return ResponseEntity.ok(inventoryItemsRepo.save(item));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<?> updateInventoryItem(@PathVariable Long id, @RequestBody InventoryItemRequest request) {
        tbl_InventoryItems item = inventoryItemsRepo.findById(id).orElse(null);
        if (item == null) {
            return ResponseEntity.notFound().build();
        }
        if (item.getDeletedAt() != null) {
            return badRequest("This item is in the trash bin - restore it before editing");
        }
        if (request.name() != null && request.name().isBlank()) {
            return badRequest("Item name is required");
        }
        String error = validate(request);
        if (error != null) {
            return badRequest(error);
        }

        if (request.name() != null) {
            item.setName(request.name().trim());
        }
        if (request.storageId() != null) {
            item.setStorageId(request.storageId());
        }
        if (request.available() != null) {
            item.setAvailable(request.available());
        }
        if (request.condition() != null) {
            item.setCondition(request.condition());
        }
        if (request.availability() != null) {
            item.setAvailability(request.availability());
        }
        if (request.photoUrl() != null) {
            item.setPhotoUrl(request.photoUrl());
        }

        return ResponseEntity.ok(inventoryItemsRepo.save(item));
    }

    // Soft delete: moves the item to the trash bin. It (and its reports) can
    // be restored until it's permanently deleted - by hand or after 30 days.
    @DeleteMapping("/{id}")
    public ResponseEntity<?> trashInventoryItem(@PathVariable Long id) {
        tbl_InventoryItems item = inventoryItemsRepo.findById(id).orElse(null);
        if (item == null) {
            return ResponseEntity.notFound().build();
        }
        if (item.getDeletedAt() != null) {
            return badRequest("This item is already in the trash bin");
        }
        item.setDeletedAt(Instant.now());
        return ResponseEntity.ok(inventoryItemsRepo.save(item));
    }

    @PostMapping("/{id}/restore")
    public ResponseEntity<?> restoreInventoryItem(@PathVariable Long id) {
        tbl_InventoryItems item = inventoryItemsRepo.findById(id).orElse(null);
        if (item == null) {
            return ResponseEntity.notFound().build();
        }
        if (item.getDeletedAt() == null) {
            return badRequest("This item isn't in the trash bin");
        }
        item.setDeletedAt(null);
        return ResponseEntity.ok(inventoryItemsRepo.save(item));
    }

    // Only from the trash bin, so nothing is ever destroyed in one click.
    @DeleteMapping("/{id}/permanent")
    public ResponseEntity<?> permanentlyDeleteInventoryItem(@PathVariable Long id) {
        tbl_InventoryItems item = inventoryItemsRepo.findById(id).orElse(null);
        if (item == null) {
            return ResponseEntity.notFound().build();
        }
        if (item.getDeletedAt() == null) {
            return badRequest("Move this item to the trash bin before deleting it permanently");
        }
        inventoryService.permanentlyDelete(id);
        return ResponseEntity.noContent().build();
    }

    // Checks only the fields that were sent; required-ness is the caller's job.
    private String validate(InventoryItemRequest request) {
        if (request.name() != null && request.name().trim().length() > NAME_MAX) {
            return "Item name must be " + NAME_MAX + " characters or fewer";
        }
        if (request.storageId() != null && !campusStoragesRepo.existsById(request.storageId())) {
            return "No campus storage exists with that storageId";
        }
        if (request.available() != null && request.available() < 0) {
            return "Quantity available can't be negative";
        }
        if (request.condition() != null && !VALID_CONDITIONS.contains(request.condition())) {
            return "Invalid condition";
        }
        if (request.availability() != null && !VALID_AVAILABILITY.contains(request.availability())) {
            return "Invalid item type";
        }
        return null;
    }

    private ResponseEntity<?> badRequest(String message) {
        return ResponseEntity.badRequest().body(MapUtil.of("message", message));
    }
}
