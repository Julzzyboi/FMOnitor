package com.FMOnitor_SpringWeb.FMOnitor_WebBE.controller;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.util.MapUtil;

import com.FMOnitor_SpringWeb.FMOnitor_WebBE.model.tbl_CampusAreas;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.model.tbl_Storage;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.repo.tbl_CampusAreasRepo;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.repo.tbl_StorageRepo;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.service.GeofenceService;

import com.fasterxml.jackson.databind.ObjectMapper;

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
import java.util.Map;

@RestController
@RequestMapping("/api/storage")
public class StorageController {

    private final tbl_StorageRepo storageRepo;
    private final tbl_CampusAreasRepo campusAreasRepo;
    private final GeofenceService geofenceService;
    private final ObjectMapper objectMapper;

    public StorageController(tbl_StorageRepo storageRepo, tbl_CampusAreasRepo campusAreasRepo,
                              GeofenceService geofenceService, ObjectMapper objectMapper) {
        this.storageRepo = storageRepo;
        this.campusAreasRepo = campusAreasRepo;
        this.geofenceService = geofenceService;
        this.objectMapper = objectMapper;
    }

    // No campusId field here on purpose - a storage area is always embedded
    // in a specific campus area, and inherits that area's own campusId
    // (looked up server-side) rather than needing the client to know/send it
    // separately. height/footprint are both optional - per-area 3D
    // customization, defaulted (or just skipped) on the frontend when omitted.
    // Plain class instead of a record - records need Java 16+, this project
    // targets Java 8. Kept the same field-name-style accessor methods a
    // record would have generated, so nothing else in this file needed to change.
    public static class StorageRequest {
        private final String name;
        private final Double latitude;
        private final Double longitude;
        private final Long campusAreaId;
        private final Double height;
        private final List<List<Double>> footprint;
        private final String photoUrl;

        public StorageRequest(String name, Double latitude, Double longitude, Long campusAreaId,
                               Double height, List<List<Double>> footprint, String photoUrl) {
            this.name = name;
            this.latitude = latitude;
            this.longitude = longitude;
            this.campusAreaId = campusAreaId;
            this.height = height;
            this.footprint = footprint;
            this.photoUrl = photoUrl;
        }

        public String name() {
            return name;
        }

        public Double latitude() {
            return latitude;
        }

        public Double longitude() {
            return longitude;
        }

        public Long campusAreaId() {
            return campusAreaId;
        }

        public Double height() {
            return height;
        }

        public List<List<Double>> footprint() {
            return footprint;
        }

        public String photoUrl() {
            return photoUrl;
        }
    }

    @PostMapping
    public ResponseEntity<?> createStorage(@RequestBody StorageRequest request) {
        if (request.campusAreaId() == null) {
            return badRequest("campusAreaId is required");
        }
        tbl_CampusAreas campusArea = campusAreasRepo.findById(request.campusAreaId()).orElse(null);
        if (campusArea == null) {
            return badRequest("No campus area exists with that campusAreaId");
        }
        if (request.latitude() == null || request.longitude() == null) {
            return badRequest("latitude and longitude are required");
        }
        if (!geofenceService.isWithinBoundary(request.latitude(), request.longitude(), campusArea.getCampusId())) {
            return badRequest("Coordinates fall outside the campus boundary. Place the pin within official campus boundaries.");
        }

        tbl_Storage storage = new tbl_Storage();
        storage.setName(request.name());
        storage.setLatitude(request.latitude());
        storage.setLongitude(request.longitude());
        storage.setCampusAreaId(request.campusAreaId());
        storage.setCampusId(campusArea.getCampusId());
        storage.setHeight(request.height());
        storage.setFootprintJson(serializeFootprint(request.footprint()));
        storage.setPhotoUrl(request.photoUrl());

        return ResponseEntity.ok(storageRepo.save(storage));
    }

    @GetMapping
    public List<tbl_Storage> getStorage() {
        return storageRepo.findAll();
    }

    // Every field optional - only whatever's actually sent gets touched, so
    // e.g. re-drawing just the footprint doesn't require re-sending
    // name/coordinates too. Re-deriving campusId whenever campusAreaId
    // changes keeps the two from ever drifting apart.
    @PatchMapping("/{id}")
    public ResponseEntity<?> updateStorage(@PathVariable Long id, @RequestBody StorageRequest request) {
        tbl_Storage storage = storageRepo.findById(id).orElse(null);
        if (storage == null) {
            return ResponseEntity.notFound().build();
        }

        Long effectiveCampusId = storage.getCampusId();
        if (request.campusAreaId() != null) {
            tbl_CampusAreas campusArea = campusAreasRepo.findById(request.campusAreaId()).orElse(null);
            if (campusArea == null) {
                return badRequest("No campus area exists with that campusAreaId");
            }
            storage.setCampusAreaId(request.campusAreaId());
            storage.setCampusId(campusArea.getCampusId());
            effectiveCampusId = campusArea.getCampusId();
        }
        if (request.latitude() != null && request.longitude() != null) {
            if (!geofenceService.isWithinBoundary(request.latitude(), request.longitude(), effectiveCampusId)) {
                return badRequest("Coordinates fall outside the campus boundary. Place the pin within official campus boundaries.");
            }
            storage.setLatitude(request.latitude());
            storage.setLongitude(request.longitude());
        }
        if (request.name() != null) {
            storage.setName(request.name());
        }
        if (request.height() != null) {
            storage.setHeight(request.height());
        }
        if (request.footprint() != null) {
            storage.setFootprintJson(serializeFootprint(request.footprint()));
        }
        if (request.photoUrl() != null) {
            storage.setPhotoUrl(request.photoUrl());
        }

        return ResponseEntity.ok(storageRepo.save(storage));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteStorage(@PathVariable Long id) {
        if (!storageRepo.findById(id).isPresent()) {
            return ResponseEntity.notFound().build();
        }
        storageRepo.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private String serializeFootprint(List<List<Double>> footprint) {
        if (footprint == null) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(footprint);
        } catch (Exception e) {
            throw new RuntimeException("Failed to serialize footprint", e);
        }
    }

    private ResponseEntity<?> badRequest(String message) {
        return ResponseEntity.badRequest().body(MapUtil.of("message", message));
    }
}
