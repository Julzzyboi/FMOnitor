package com.FMOnitor_SpringWeb.FMOnitor_WebBE.controller;

import com.FMOnitor_SpringWeb.FMOnitor_WebBE.model.tbl_CampusAreas;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.model.tbl_Venues;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.repo.tbl_CampusAreasRepo;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.repo.tbl_VenuesRepo;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.service.GeofenceService;

import tools.jackson.databind.ObjectMapper;

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
@RequestMapping("/api/venues")
public class VenueController {

    private final tbl_VenuesRepo venuesRepo;
    private final tbl_CampusAreasRepo campusAreasRepo;
    private final GeofenceService geofenceService;
    private final ObjectMapper objectMapper;

    public VenueController(tbl_VenuesRepo venuesRepo, tbl_CampusAreasRepo campusAreasRepo,
                            GeofenceService geofenceService, ObjectMapper objectMapper) {
        this.venuesRepo = venuesRepo;
        this.campusAreasRepo = campusAreasRepo;
        this.geofenceService = geofenceService;
        this.objectMapper = objectMapper;
    }

    // No campusId field here on purpose - a venue is always embedded in a
    // specific campus area, and inherits that area's own campusId (looked up
    // server-side) rather than needing the client to know/send it separately
    // - mirrors StorageController's design exactly. height/footprint are both
    // optional - per-venue 3D customization, defaulted (or just skipped) on
    // the frontend when omitted.
    public record VenueRequest(String name, Double latitude, Double longitude, Long campusAreaId,
                               Double height, List<List<Double>> footprint, String photoUrl) {}

    @PostMapping
    public ResponseEntity<?> createVenue(@RequestBody VenueRequest request) {
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

        tbl_Venues venue = new tbl_Venues();
        venue.setName(request.name());
        venue.setLatitude(request.latitude());
        venue.setLongitude(request.longitude());
        venue.setCampusAreaId(request.campusAreaId());
        venue.setCampusId(campusArea.getCampusId());
        venue.setHeight(request.height());
        venue.setFootprintJson(serializeFootprint(request.footprint()));
        venue.setPhotoUrl(request.photoUrl());

        return ResponseEntity.ok(venuesRepo.save(venue));
    }

    @GetMapping
    public List<tbl_Venues> getVenues() {
        return venuesRepo.findAll();
    }

    // Every field optional - only whatever's actually sent gets touched, so
    // e.g. re-drawing just the footprint doesn't require re-sending
    // name/coordinates too. Re-deriving campusId whenever campusAreaId
    // changes keeps the two from ever drifting apart.
    @PatchMapping("/{id}")
    public ResponseEntity<?> updateVenue(@PathVariable Long id, @RequestBody VenueRequest request) {
        tbl_Venues venue = venuesRepo.findById(id).orElse(null);
        if (venue == null) {
            return ResponseEntity.notFound().build();
        }

        Long effectiveCampusId = venue.getCampusId();
        if (request.campusAreaId() != null) {
            tbl_CampusAreas campusArea = campusAreasRepo.findById(request.campusAreaId()).orElse(null);
            if (campusArea == null) {
                return badRequest("No campus area exists with that campusAreaId");
            }
            venue.setCampusAreaId(request.campusAreaId());
            venue.setCampusId(campusArea.getCampusId());
            effectiveCampusId = campusArea.getCampusId();
        }
        if (request.latitude() != null && request.longitude() != null) {
            if (!geofenceService.isWithinBoundary(request.latitude(), request.longitude(), effectiveCampusId)) {
                return badRequest("Coordinates fall outside the campus boundary. Place the pin within official campus boundaries.");
            }
            venue.setLatitude(request.latitude());
            venue.setLongitude(request.longitude());
        }
        if (request.name() != null) {
            venue.setName(request.name());
        }
        if (request.height() != null) {
            venue.setHeight(request.height());
        }
        if (request.footprint() != null) {
            venue.setFootprintJson(serializeFootprint(request.footprint()));
        }
        if (request.photoUrl() != null) {
            venue.setPhotoUrl(request.photoUrl());
        }

        return ResponseEntity.ok(venuesRepo.save(venue));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteVenue(@PathVariable Long id) {
        if (venuesRepo.findById(id).isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        venuesRepo.deleteById(id);
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
        return ResponseEntity.badRequest().body(Map.of("message", message));
    }
}
