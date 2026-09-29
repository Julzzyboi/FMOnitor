package com.FMOnitor_SpringWeb.FMOnitor_WebBE.controller;

import com.FMOnitor_SpringWeb.FMOnitor_WebBE.model.tbl_CampusFacilities;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.model.tbl_CampusVenues;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.repo.tbl_CampusFacilitiesRepo;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.repo.tbl_CampusVenuesRepo;
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
@RequestMapping("/api/campus-venues")
public class CampusVenueController {

    private final tbl_CampusVenuesRepo campusVenuesRepo;
    private final tbl_CampusFacilitiesRepo campusFacilitiesRepo;
    private final GeofenceService geofenceService;

    public CampusVenueController(tbl_CampusVenuesRepo campusVenuesRepo,
                                 tbl_CampusFacilitiesRepo campusFacilitiesRepo,
                                 GeofenceService geofenceService) {
        this.campusVenuesRepo = campusVenuesRepo;
        this.campusFacilitiesRepo = campusFacilitiesRepo;
        this.geofenceService = geofenceService;
    }

    // No height/footprint here - a venue always takes its facility's (see
    // copyShapeFrom), so there's nothing for the client to send.
    public record CampusVenueRequest(String name, Long facilityId, Double latitude, Double longitude,
                                     String photoUrl) {
    }

    @PostMapping
    public ResponseEntity<?> createCampusVenue(@RequestBody CampusVenueRequest request) {
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

        tbl_CampusVenues venue = new tbl_CampusVenues();
        venue.setName(request.name());
        venue.setFacilityId(request.facilityId());
        venue.setLatitude(request.latitude());
        venue.setLongitude(request.longitude());
        venue.setPhotoUrl(request.photoUrl());
        copyShapeFrom(facility, venue);

        return ResponseEntity.ok(campusVenuesRepo.save(venue));
    }

    @GetMapping
    public List<tbl_CampusVenues> getCampusVenues() {
        return campusVenuesRepo.findAll();
    }

    @PatchMapping("/{id}")
    public ResponseEntity<?> updateCampusVenue(@PathVariable Long id, @RequestBody CampusVenueRequest request) {
        tbl_CampusVenues venue = campusVenuesRepo.findById(id).orElse(null);
        if (venue == null) {
            return ResponseEntity.notFound().build();
        }

        Long facilityId = request.facilityId() != null ? request.facilityId() : venue.getFacilityId();
        tbl_CampusFacilities facility = campusFacilitiesRepo.findById(facilityId).orElse(null);
        if (facility == null) {
            return badRequest("No campus facility exists with that facilityId");
        }
        venue.setFacilityId(facilityId);
        copyShapeFrom(facility, venue);

        if (request.latitude() != null && request.longitude() != null) {
            if (!geofenceService.isWithinBoundary(request.latitude(), request.longitude(), facility.getBranchId())) {
                return badRequest("Coordinates fall outside the campus boundary. Place the pin within official campus boundaries.");
            }
            venue.setLatitude(request.latitude());
            venue.setLongitude(request.longitude());
        }
        if (request.name() != null) {
            venue.setName(request.name());
        }
        if (request.photoUrl() != null) {
            venue.setPhotoUrl(request.photoUrl());
        }

        return ResponseEntity.ok(campusVenuesRepo.save(venue));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCampusVenue(@PathVariable Long id) {
        if (!campusVenuesRepo.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        campusVenuesRepo.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private void copyShapeFrom(tbl_CampusFacilities facility, tbl_CampusVenues venue) {
        venue.setHeight(facility.getHeight());
        venue.setFootprintJson(facility.getFootprintJson());
    }

    private ResponseEntity<?> badRequest(String message) {
        return ResponseEntity.badRequest().body(MapUtil.of("message", message));
    }
}
