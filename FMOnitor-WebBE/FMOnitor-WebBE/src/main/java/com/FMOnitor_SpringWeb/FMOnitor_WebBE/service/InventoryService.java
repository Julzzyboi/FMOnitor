package com.FMOnitor_SpringWeb.FMOnitor_WebBE.service;

import com.FMOnitor_SpringWeb.FMOnitor_WebBE.model.tbl_InventoryItems;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.repo.tbl_CampusStoragesRepo;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.repo.tbl_InventoryItemsRepo;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.repo.tbl_InventoryReportsRepo;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.util.SetUtil;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Objects;
import java.util.Set;

// Every inventory item change goes through here, whether a Superadmin makes it
// directly or it's applied when a Superadmin approves an Admin's request -
// so both paths run exactly the same checks. Each change has a check*()
// that returns an error message (or null) and an apply method.
@Service
public class InventoryService {

    // How long an item sits in the trash bin before it's purged for good.
    public static final long TRASH_RETENTION_DAYS = 30;

    private static final int NAME_MAX = 100;
    private static final Set<String> VALID_CONDITIONS = SetUtil.of("Good", "Defect", "Damaged", "Missing");
    private static final Set<String> VALID_AVAILABILITY = SetUtil.of("Borrowable", "Non-Borrowable");
    // A critical item is one physical unit per ID: 1 when it's in, 0 when
    // it's out (borrowed, missing). More than 1 means separate items.
    private static final int CRITICAL_MAX_QTY = 1;

    // The editable fields of an item. On an update a null field means
    // "leave unchanged".
    public record ItemChanges(String name, Long storageId, Integer available, String condition,
                              String availability, String photoUrl, Boolean critical) {
    }

    private final tbl_InventoryItemsRepo inventoryItemsRepo;
    private final tbl_InventoryReportsRepo inventoryReportsRepo;
    private final tbl_CampusStoragesRepo campusStoragesRepo;

    public InventoryService(tbl_InventoryItemsRepo inventoryItemsRepo,
                            tbl_InventoryReportsRepo inventoryReportsRepo,
                            tbl_CampusStoragesRepo campusStoragesRepo) {
        this.inventoryItemsRepo = inventoryItemsRepo;
        this.inventoryReportsRepo = inventoryReportsRepo;
        this.campusStoragesRepo = campusStoragesRepo;
    }

    // ---- Create ----

    public String checkCreate(ItemChanges c) {
        if (c.name() == null || c.name().isBlank()) {
            return "Item name is required";
        }
        if (c.storageId() == null) {
            return "Storage is required";
        }
        if (c.available() == null) {
            return "Quantity available is required";
        }
        if (c.condition() == null) {
            return "Condition is required";
        }
        if (c.availability() == null) {
            return "Item type is required";
        }
        String error = checkFields(c);
        return error != null ? error : criticalQuantityError(Boolean.TRUE.equals(c.critical()), c.available());
    }

    public tbl_InventoryItems create(ItemChanges c) {
        tbl_InventoryItems item = new tbl_InventoryItems();
        item.setName(c.name().trim());
        item.setStorageId(c.storageId());
        item.setAvailable(c.available());
        item.setCondition(c.condition());
        item.setAvailability(c.availability());
        item.setPhotoUrl(c.photoUrl());
        item.setCritical(Boolean.TRUE.equals(c.critical()));
        return inventoryItemsRepo.save(item);
    }

    // ---- Update ----

    public String checkUpdate(tbl_InventoryItems item, ItemChanges c) {
        if (item.getDeletedAt() != null) {
            return "This item is in the trash bin - restore it before editing";
        }
        if (c.name() != null && c.name().isBlank()) {
            return "Item name is required";
        }
        String error = checkFields(c);
        if (error != null) {
            return error;
        }
        // Check the combination the item will end up with, e.g. marking a
        // 50-unit item critical without changing its quantity is refused.
        boolean critical = c.critical() != null ? c.critical() : Boolean.TRUE.equals(item.getCritical());
        int available = c.available() != null ? c.available() : item.getAvailable();
        return criticalQuantityError(critical, available);
    }

    public tbl_InventoryItems update(tbl_InventoryItems item, ItemChanges c) {
        if (c.name() != null) {
            item.setName(c.name().trim());
        }
        if (c.storageId() != null) {
            item.setStorageId(c.storageId());
        }
        if (c.available() != null) {
            item.setAvailable(c.available());
        }
        if (c.condition() != null) {
            item.setCondition(c.condition());
        }
        if (c.availability() != null) {
            item.setAvailability(c.availability());
        }
        if (c.photoUrl() != null) {
            item.setPhotoUrl(c.photoUrl());
        }
        if (c.critical() != null) {
            item.setCritical(c.critical());
        }
        return inventoryItemsRepo.save(item);
    }

    // Keeps only the fields that differ from the item, so a queued edit
    // doesn't overwrite fields someone else changed in the meantime.
    public ItemChanges onlyChanged(tbl_InventoryItems item, ItemChanges c) {
        return new ItemChanges(
            differs(c.name() == null ? null : c.name().trim(), item.getName()),
            differs(c.storageId(), item.getStorageId()),
            differs(c.available(), item.getAvailable()),
            differs(c.condition(), item.getCondition()),
            differs(c.availability(), item.getAvailability()),
            differs(c.photoUrl(), item.getPhotoUrl() == null ? "" : item.getPhotoUrl()),
            differs(c.critical(), Boolean.TRUE.equals(item.getCritical())));
    }

    // The item's current values for the fields in `c` - shown as "before"
    // when a Superadmin reviews the change.
    public ItemChanges currentValuesOf(tbl_InventoryItems item, ItemChanges c) {
        return new ItemChanges(
            c.name() != null ? item.getName() : null,
            c.storageId() != null ? item.getStorageId() : null,
            c.available() != null ? item.getAvailable() : null,
            c.condition() != null ? item.getCondition() : null,
            c.availability() != null ? item.getAvailability() : null,
            c.photoUrl() != null ? (item.getPhotoUrl() == null ? "" : item.getPhotoUrl()) : null,
            c.critical() != null ? Boolean.TRUE.equals(item.getCritical()) : null);
    }

    public static boolean isEmpty(ItemChanges c) {
        return c.name() == null && c.storageId() == null && c.available() == null && c.condition() == null
            && c.availability() == null && c.photoUrl() == null && c.critical() == null;
    }

    // ---- Trash bin ----

    public String checkTrash(tbl_InventoryItems item) {
        return item.getDeletedAt() != null ? "This item is already in the trash bin" : null;
    }

    public tbl_InventoryItems trash(tbl_InventoryItems item) {
        item.setDeletedAt(Instant.now());
        return inventoryItemsRepo.save(item);
    }

    public String checkRestore(tbl_InventoryItems item) {
        return item.getDeletedAt() == null ? "This item isn't in the trash bin" : null;
    }

    public tbl_InventoryItems restore(tbl_InventoryItems item) {
        item.setDeletedAt(null);
        return inventoryItemsRepo.save(item);
    }

    // Only from the trash bin, so nothing is ever destroyed in one click.
    public String checkPermanentDelete(tbl_InventoryItems item) {
        return item.getDeletedAt() == null ? "Move this item to the trash bin before deleting it permanently" : null;
    }

    // Removes the item and its reports for good - they'd point at nothing otherwise.
    @Transactional
    public void permanentlyDelete(Long itemId) {
        inventoryReportsRepo.deleteByItemId(itemId);
        inventoryItemsRepo.deleteById(itemId);
    }

    // ---- Shared checks ----

    // Checks only the fields that were sent; required-ness is the caller's job.
    private String checkFields(ItemChanges c) {
        if (c.name() != null && c.name().trim().length() > NAME_MAX) {
            return "Item name must be " + NAME_MAX + " characters or fewer";
        }
        if (c.storageId() != null && !campusStoragesRepo.existsById(c.storageId())) {
            return "No campus storage exists with that storageId";
        }
        if (c.available() != null && c.available() < 0) {
            return "Quantity available can't be negative";
        }
        if (c.condition() != null && !VALID_CONDITIONS.contains(c.condition())) {
            return "Invalid condition";
        }
        if (c.availability() != null && !VALID_AVAILABILITY.contains(c.availability())) {
            return "Invalid item type";
        }
        return null;
    }

    private static String criticalQuantityError(boolean critical, int available) {
        return critical && available > CRITICAL_MAX_QTY
            ? "A critical item is a single unit with its own ID, so its quantity can only be 0 or 1. "
                + "Add each unit as its own critical item."
            : null;
    }

    private static <T> T differs(T requested, T current) {
        return requested != null && !Objects.equals(requested, current) ? requested : null;
    }
}
