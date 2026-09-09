package com.FMOnitor_SpringWeb.FMOnitor_WebBE.controller;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.util.SetUtil;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.util.MapUtil;

import com.FMOnitor_SpringWeb.FMOnitor_WebBE.model.tbl_CampusAreas;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.repo.tbl_CampusAreasRepo;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.repo.tbl_CampusMapsRepo;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.repo.tbl_StorageRepo;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.repo.tbl_VenuesRepo;
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
import java.util.Set;

@RestController
@RequestMapping("/api/campus-areas")
public class CampusAreaController {

    // Matches the real area categories used in the UST campus GeoJSON dataset
    // (areaType property) - a plain Set check, not an enum, so adding a new
    // type later is a one-line change here rather than a schema/migration change.
    private static final Set<String> VALID_TYPES =
        SetUtil.of("Building", "Field", "Grandstand", "Pool", "In-Campus Grounds", "Garden", "Gate", "Court");

    private final tbl_CampusAreasRepo campusAreasRepo;
    private final tbl_CampusMapsRepo campusMapsRepo;
    private final tbl_StorageRepo storageRepo;
    private final tbl_VenuesRepo venuesRepo;
    private final GeofenceService geofenceService;
    private final ObjectMapper objectMapper;

    public CampusAreaController(tbl_CampusAreasRepo campusAreasRepo, tbl_CampusMapsRepo campusMapsRepo,
                                 tbl_StorageRepo storageRepo, tbl_VenuesRepo venuesRepo,
                                 GeofenceService geofenceService, ObjectMapper objectMapper) {
        this.campusAreasRepo = campusAreasRepo;
        this.campusMapsRepo = campusMapsRepo;
        this.storageRepo = storageRepo;
        this.venuesRepo = venuesRepo;
        this.geofenceService = geofenceService;
        this.objectMapper = objectMapper;
    }

    // height/footprint/photoUrl are all optional - per-area customization,
    // defaulted (or just skipped) on the frontend when omitted. footprint is
    // [[lng,lat],...], same convention as CampusMapController's boundary field.
    // Plain class instead of a record - records need Java 16+, this project
    // targets Java 8. Kept the same field-name-style accessor methods a
    // record would have generated, so nothing else in this file needed to change.
    public static class CampusAreaRequest {
        private final String name;
        private final Double latitude;
        private final Double longitude;
        private final Long campusId;
        private final String type;
        private final Double height;
        private final List<List<Double>> footprint;
        private final String photoUrl;

        public CampusAreaRequest(String name, Double latitude, Double longitude, Long campusId, String type,
                                  Double height, List<List<Double>> footprint, String photoUrl) {
            this.name = name;
            this.latitude = latitude;
            this.longitude = longitude;
            this.campusId = campusId;
            this.type = type;
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

        public Long campusId() {
            return campusId;
        }

        public String type() {
            return type;
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
    public ResponseEntity<?> createCampusArea(@RequestBody CampusAreaRequest request) {
        if (request.campusId() == null) {
            return badRequest("campusId is required");
        }
        if (!campusMapsRepo.findById(request.campusId()).isPresent()) {
            return badRequest("No campus exists with that campusId");
        }
        if (request.latitude() == null || request.longitude() == null) {
            return badRequest("latitude and longitude are required");
        }
        if (request.type() == null || !VALID_TYPES.contains(request.type())) {
            return badRequest("type must be one of " + VALID_TYPES);
        }
        if (!geofenceService.isWithinBoundary(request.latitude(), request.longitude(), request.campusId())) {
            return badRequest("Coordinates fall outside the campus boundary. Place the pin within official campus boundaries.");
        }

        tbl_CampusAreas area = new tbl_CampusAreas();
        area.setName(request.name());
        area.setLatitude(request.latitude());
        area.setLongitude(request.longitude());
        area.setCampusId(request.campusId());
        area.setType(request.type());
        area.setHeight(request.height());
        area.setFootprintJson(serializeFootprint(request.footprint()));
        area.setPhotoUrl(request.photoUrl());

        return ResponseEntity.ok(campusAreasRepo.save(area));
    }

    @GetMapping
    public List<tbl_CampusAreas> getCampusAreas() {
        return campusAreasRepo.findAll();
    }

    // Every field optional - only whatever's actually sent gets touched, so
    // e.g. re-drawing just the footprint doesn't require re-sending
    // name/type/coordinates too.
    @PatchMapping("/{id}")
    public ResponseEntity<?> updateCampusArea(@PathVariable Long id, @RequestBody CampusAreaRequest request) {
        tbl_CampusAreas area = campusAreasRepo.findById(id).orElse(null);
        if (area == null) {
            return ResponseEntity.notFound().build();
        }

        if (request.type() != null) {
            if (!VALID_TYPES.contains(request.type())) {
                return badRequest("type must be one of " + VALID_TYPES);
            }
            area.setType(request.type());
        }
        if (request.latitude() != null && request.longitude() != null) {
            if (!geofenceService.isWithinBoundary(request.latitude(), request.longitude(), area.getCampusId())) {
                return badRequest("Coordinates fall outside the campus boundary. Place the pin within official campus boundaries.");
            }
            area.setLatitude(request.latitude());
            area.setLongitude(request.longitude());
        }
        if (request.name() != null) {
            area.setName(request.name());
        }
        if (request.height() != null) {
            area.setHeight(request.height());
        }
        if (request.footprint() != null) {
            area.setFootprintJson(serializeFootprint(request.footprint()));
        }
        if (request.photoUrl() != null) {
            area.setPhotoUrl(request.photoUrl());
        }

        return ResponseEntity.ok(campusAreasRepo.save(area));
    }

    // Blocked while storage/venues are still embedded in this area, rather
    // than silently orphaning those rows (they have a required, non-nullable
    // campusAreaId with no DB-level cascade) - the caller has to remove the
    // embedded items first.
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCampusArea(@PathVariable Long id) {
        if (!campusAreasRepo.findById(id).isPresent()) {
            return ResponseEntity.notFound().build();
        }
        if (storageRepo.existsByCampusAreaId(id) || venuesRepo.existsByCampusAreaId(id)) {
            return badRequest("This area still has storage or venues embedded in it. Remove those first.");
        }
        campusAreasRepo.deleteById(id);
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
