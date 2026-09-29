package com.FMOnitor_SpringWeb.FMOnitor_WebBE.controller;

import com.FMOnitor_SpringWeb.FMOnitor_WebBE.model.tbl_CampusFacilities;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.model.tbl_CampusStorages;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.repo.tbl_CampusFacilitiesRepo;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.repo.tbl_CampusStoragesRepo;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.service.GeofenceService;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.util.MapUtil;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/campus-storages")
public class CampusStorageController {

    private final tbl_CampusStoragesRepo campusStoragesRepo;
    private final tbl_CampusFacilitiesRepo campusFacilitiesRepo;
    private final GeofenceService geofenceService;

    public CampusStorageController(tbl_CampusStoragesRepo campusStoragesRepo,
                                   tbl_CampusFacilitiesRepo campusFacilitiesRepo,
                                   GeofenceService geofenceService) {
        this.campusStoragesRepo = campusStoragesRepo;
        this.campusFacilitiesRepo = campusFacilitiesRepo;
        this.geofenceService = geofenceService;
    }

    // No height/footprint here - a storage room always takes its facility's
    // (see copyShapeFrom), so there's nothing for the client to send.
    public record CampusStorageRequest(String name, Long facilityId, Double latitude, Double longitude,
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
        if (!geofenceService.isWithinBoundary(request.latitude(), request.longitude(), facility.getBranchId())) {
            return badRequest("Coordinates fall outside the campus boundary. Place the pin within official campus boundaries.");
        }

        tbl_CampusStorages storage = new tbl_CampusStorages();
        storage.setName(request.name());
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
        storage.setFacilityId(facilityId);
        copyShapeFrom(facility, storage);

        if (request.latitude() != null && request.longitude() != null) {
            if (!geofenceService.isWithinBoundary(request.latitude(), request.longitude(), facility.getBranchId())) {
                return badRequest("Coordinates fall outside the campus boundary. Place the pin within official campus boundaries.");
            }
            storage.setLatitude(request.latitude());
            storage.setLongitude(request.longitude());
        }
        if (request.name() != null) {
            storage.setName(request.name());
        }
        if (request.photoUrl() != null) {
            storage.setPhotoUrl(request.photoUrl());
        }

        return ResponseEntity.ok(campusStoragesRepo.save(storage));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCampusStorage(@PathVariable Long id) {
        if (!campusStoragesRepo.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        campusStoragesRepo.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private void copyShapeFrom(tbl_CampusFacilities facility, tbl_CampusStorages storage) {
        storage.setHeight(facility.getHeight());
        storage.setFootprintJson(facility.getFootprintJson());
    }

    private ResponseEntity<?> badRequest(String message) {
        return ResponseEntity.badRequest().body(MapUtil.of("message", message));
    }
}
