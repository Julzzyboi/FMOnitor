package com.FMOnitor_SpringWeb.FMOnitor_WebBE.controller;

import com.FMOnitor_SpringWeb.FMOnitor_WebBE.model.tbl_Campuses;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.model.tbl_Facilities;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.repo.tbl_CampusesRepo;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.repo.tbl_FacilitiesRepo;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.service.GeofenceService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/facilities")
public class FacilityController {

    // Starter vocabulary - a plain Set check, not an enum, so adding a new type
    // later is a one-line change here rather than a schema/migration change.
    private static final Set<String> VALID_TYPES = Set.of("Storage", "Venue", "Office", "Laboratory", "Utility");

    private final tbl_FacilitiesRepo facilitiesRepo;
    private final tbl_CampusesRepo campusesRepo;
    private final GeofenceService geofenceService;

    public FacilityController(tbl_FacilitiesRepo facilitiesRepo, tbl_CampusesRepo campusesRepo,
                               GeofenceService geofenceService) {
        this.facilitiesRepo = facilitiesRepo;
        this.campusesRepo = campusesRepo;
        this.geofenceService = geofenceService;
    }

    // color/height are optional - per-building 3D customization, defaulted on
    // the frontend when omitted, not required for a facility to exist.
    public record FacilityRequest(String name, Double latitude, Double longitude, Long campusId, String type,
                                   String color, Double height) {}

    @PostMapping
    public ResponseEntity<?> createFacility(@RequestBody FacilityRequest request) {
        // Campus ID Schema Validation - must be present before anything else.
        if (request.campusId() == null) {
            return badRequest("campusId is required");
        }
        if (campusesRepo.findById(request.campusId()).isEmpty()) {
            return badRequest("No campus exists with that campusId");
        }
        if (request.latitude() == null || request.longitude() == null) {
            return badRequest("latitude and longitude are required");
        }
        if (request.type() == null || !VALID_TYPES.contains(request.type())) {
            return badRequest("type must be one of " + VALID_TYPES);
        }

        // Geofence Boundary Enforcement.
        if (!geofenceService.isWithinBoundary(request.latitude(), request.longitude(), request.campusId())) {
            return badRequest("Coordinates fall outside the campus boundary. Place the pin within official campus boundaries.");
        }

        tbl_Facilities facility = new tbl_Facilities();
        facility.setName(request.name());
        facility.setLatitude(request.latitude());
        facility.setLongitude(request.longitude());
        facility.setCampusId(request.campusId());
        facility.setType(request.type());
        facility.setColor(request.color());
        facility.setHeight(request.height());

        return ResponseEntity.ok(facilitiesRepo.save(facility));
    }

    @GetMapping
    public List<tbl_Facilities> getFacilities() {
        return facilitiesRepo.findAll();
    }

    // Geofenced Asset Lookup - given raw coordinates (no campusId supplied), figure
    // out which campus zone they actually fall inside, if any.
    @GetMapping("/lookup")
    public ResponseEntity<Map<String, Object>> lookup(@RequestParam double lat, @RequestParam double lng) {
        Map<String, Object> response = new HashMap<>();
        java.util.Optional<tbl_Campuses> campus = geofenceService.findCampusContaining(lat, lng);

        if (campus.isEmpty()) {
            response.put("campus", null);
            response.put("message", "These coordinates do not fall within any known campus boundary");
            return ResponseEntity.ok(response);
        }

        response.put("campus", campus.get());
        response.put("message", null);
        return ResponseEntity.ok(response);
    }

    private ResponseEntity<?> badRequest(String message) {
        return ResponseEntity.badRequest().body(Map.of("message", message));
    }
}
