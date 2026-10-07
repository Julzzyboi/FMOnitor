package com.FMOnitor_SpringWeb.FMOnitor_WebBE.controller;

import com.FMOnitor_SpringWeb.FMOnitor_WebBE.model.tbl_CampusFacilities;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.model.tbl_CampusStorages;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.repo.tbl_CampusFacilitiesRepo;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.repo.tbl_CampusStoragesRepo;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.repo.tbl_InventoryItemsRepo;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.repo.tbl_InventoryReportsRepo;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.service.GeofenceService;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.util.MapUtil;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
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

@RestController
@RequestMapping("/api/campus-storages")
public class CampusStorageController {

    private static final String INVENTORY_TRANSFER = "transfer";
    private static final String INVENTORY_DELETE = "delete";

    private final tbl_CampusStoragesRepo campusStoragesRepo;
    private final tbl_CampusFacilitiesRepo campusFacilitiesRepo;
    private final tbl_InventoryItemsRepo inventoryItemsRepo;
    private final tbl_InventoryReportsRepo inventoryReportsRepo;
    private final GeofenceService geofenceService;

    public CampusStorageController(tbl_CampusStoragesRepo campusStoragesRepo,
                                   tbl_CampusFacilitiesRepo campusFacilitiesRepo,
                                   tbl_InventoryItemsRepo inventoryItemsRepo,
                                   tbl_InventoryReportsRepo inventoryReportsRepo,
                                   GeofenceService geofenceService) {
        this.campusStoragesRepo = campusStoragesRepo;
        this.campusFacilitiesRepo = campusFacilitiesRepo;
        this.inventoryItemsRepo = inventoryItemsRepo;
        this.inventoryReportsRepo = inventoryReportsRepo;
        this.geofenceService = geofenceService;
    }

    // No height/footprint here - a storage room always takes its facility's
    // (see copyShapeFrom), so there's nothing for the client to send.
    public record CampusStorageRequest(String name, String description, Long facilityId, Double latitude, Double longitude,
                                       String photoUrl) {
    }

    @PostMapping
    public ResponseEntity<?> createCampusStorage(@RequestBody CampusStorageRequest request) {
        if (request.name() == null || request.name().isBlank()) {
            return badRequest("name is required");
        }
        if (request.facilityId() == null) {
            return badRequest("facilityId is required");
        }
        tbl_CampusFacilities facility = campusFacilitiesRepo.findById(request.facilityId()).orElse(null);
        if (facility == null) {
            return badRequest("No campus facility exists with that facilityId");
        }
        if (request.latitude() == null || request.longitude() == null) {
            return badRequest("latitude and longitude are required");
        }
        if (!geofenceService.isWithinFacility(request.latitude(), request.longitude(), facility)) {
            return badRequest(outsideFacilityMessage(facility));
        }

        tbl_CampusStorages storage = new tbl_CampusStorages();
        storage.setName(request.name());
        storage.setDescription(request.description());
        storage.setFacilityId(request.facilityId());
        storage.setLatitude(request.latitude());
        storage.setLongitude(request.longitude());
        storage.setPhotoUrl(request.photoUrl());
        copyShapeFrom(facility, storage);

        return ResponseEntity.ok(campusStoragesRepo.save(storage));
    }

    @GetMapping
    public List<tbl_CampusStorages> getCampusStorages() {
        return campusStoragesRepo.findAll();
    }

    @PatchMapping("/{id}")
    public ResponseEntity<?> updateCampusStorage(@PathVariable Long id, @RequestBody CampusStorageRequest request) {
        tbl_CampusStorages storage = campusStoragesRepo.findById(id).orElse(null);
        if (storage == null) {
            return ResponseEntity.notFound().build();
        }

        Long facilityId = request.facilityId() != null ? request.facilityId() : storage.getFacilityId();
        tbl_CampusFacilities facility = campusFacilitiesRepo.findById(facilityId).orElse(null);
        if (facility == null) {
            return badRequest("No campus facility exists with that facilityId");
        }
        // Whichever changed - the pin or the parent - the pin must end up on
        // the (possibly new) parent facility.
        boolean moving = request.latitude() != null && request.longitude() != null;
        double lat = moving ? request.latitude() : storage.getLatitude();
        double lng = moving ? request.longitude() : storage.getLongitude();
        if ((moving || !facilityId.equals(storage.getFacilityId()))
                && !geofenceService.isWithinFacility(lat, lng, facility)) {
            return badRequest(outsideFacilityMessage(facility));
        }
        storage.setFacilityId(facilityId);
        copyShapeFrom(facility, storage);
        storage.setLatitude(lat);
        storage.setLongitude(lng);
        if (request.name() != null) {
            storage.setName(request.name());
        }
        if (request.description() != null) {
            storage.setDescription(request.description());
        }
        if (request.photoUrl() != null) {
            storage.setPhotoUrl(request.photoUrl());
        }

        return ResponseEntity.ok(campusStoragesRepo.save(storage));
    }

    // A storage that still holds inventory can't just vanish: the caller must
    // say what happens to the items - ?inventoryAction=transfer&transferToStorageId=X
    // moves them, ?inventoryAction=delete deletes them (and their reports).
    // Without it the request is refused with 409 and the item count.
    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<?> deleteCampusStorage(@PathVariable Long id,
                                                 @RequestParam(required = false) String inventoryAction,
                                                 @RequestParam(required = false) Long transferToStorageId) {
        if (!campusStoragesRepo.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        long itemCount = inventoryItemsRepo.countByStorageId(id);
        if (itemCount > 0) {
            if (inventoryAction == null) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body(MapUtil.of(
                    "message", "This storage still holds " + itemCount + " inventory item"
                        + (itemCount == 1 ? "" : "s") + ". Move them to another storage or delete them with it.",
                    "itemCount", itemCount));
            }
            if (INVENTORY_TRANSFER.equals(inventoryAction)) {
                if (transferToStorageId == null || transferToStorageId.equals(id)) {
                    return badRequest("Pick a different storage to move the items to");
                }
                if (!campusStoragesRepo.existsById(transferToStorageId)) {
                    return badRequest("No campus storage exists with that transferToStorageId");
                }
                inventoryItemsRepo.moveToStorage(id, transferToStorageId);
            } else if (INVENTORY_DELETE.equals(inventoryAction)) {
                List<Long> itemIds = inventoryItemsRepo.findIdsByStorageId(id);
                inventoryReportsRepo.deleteAllForItems(itemIds);
                inventoryItemsRepo.deleteAllInStorage(id);
            } else {
                return badRequest("inventoryAction must be 'transfer' or 'delete'");
            }
        }

        campusStoragesRepo.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private String outsideFacilityMessage(tbl_CampusFacilities facility) {
        return "Place the pin inside the highlighted area of " + facility.getName() + ".";
    }

    private void copyShapeFrom(tbl_CampusFacilities facility, tbl_CampusStorages storage) {
        storage.setHeight(facility.getHeight());
        storage.setFootprintJson(facility.getFootprintJson());
    }

    private ResponseEntity<?> badRequest(String message) {
        return ResponseEntity.badRequest().body(MapUtil.of("message", message));
    }
}
