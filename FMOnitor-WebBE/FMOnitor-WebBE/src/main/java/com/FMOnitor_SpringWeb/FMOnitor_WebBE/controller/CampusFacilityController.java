package com.FMOnitor_SpringWeb.FMOnitor_WebBE.controller;

import com.FMOnitor_SpringWeb.FMOnitor_WebBE.model.tbl_CampusFacilities;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.model.tbl_CampusStorages;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.model.tbl_CampusVenues;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.repo.tbl_CampusBranchesRepo;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.repo.tbl_CampusFacilitiesRepo;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.repo.tbl_CampusStoragesRepo;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.repo.tbl_CampusVenuesRepo;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.service.GeofenceService;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.util.MapUtil;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.util.SetUtil;
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
import java.util.Set;

@RestController
@RequestMapping("/api/campus-facilities")
public class CampusFacilityController {

    private static final Set<String> VALID_TYPES =
        SetUtil.of("Building", "Field", "Grandstand", "Pool", "In-Campus Grounds", "Garden", "Gate", "Court");

    private final tbl_CampusFacilitiesRepo campusFacilitiesRepo;
    private final tbl_CampusBranchesRepo campusBranchesRepo;
    private final tbl_CampusStoragesRepo campusStoragesRepo;
    private final tbl_CampusVenuesRepo campusVenuesRepo;
    private final GeofenceService geofenceService;
    private final ObjectMapper objectMapper;

    public CampusFacilityController(tbl_CampusFacilitiesRepo campusFacilitiesRepo,
                                    tbl_CampusBranchesRepo campusBranchesRepo,
                                    tbl_CampusStoragesRepo campusStoragesRepo,
                                    tbl_CampusVenuesRepo campusVenuesRepo,
                                    GeofenceService geofenceService, ObjectMapper objectMapper) {
        this.campusFacilitiesRepo = campusFacilitiesRepo;
        this.campusBranchesRepo = campusBranchesRepo;
        this.campusStoragesRepo = campusStoragesRepo;
        this.campusVenuesRepo = campusVenuesRepo;
        this.geofenceService = geofenceService;
        this.objectMapper = objectMapper;
    }

    // height/footprint are normally what the map read from Mapbox's building
    // at the clicked point. heightOverride marks a height corrected by hand.
    public record CampusFacilityRequest(String name, String type, String description, Long branchId,
                                        Double latitude, Double longitude, Double height,
                                        List<List<Double>> footprint, Boolean heightOverride,
                                        String photoUrl) {
    }

    // Side of the square footprint used when nothing is mapped at the pin.
    private static final double FALLBACK_FOOTPRINT_METERS = 4;
    private static final double METERS_PER_DEG_LAT = 111320;

    @PostMapping
    public ResponseEntity<?> createCampusFacility(@RequestBody CampusFacilityRequest request) {
        if (request.name() == null || request.name().isBlank()) {
            return badRequest("name is required");
        }
        if (request.branchId() == null) {
            return badRequest("branchId is required");
        }
        if (!campusBranchesRepo.existsById(request.branchId())) {
            return badRequest("No campus branch exists with that branchId");
        }
        if (request.latitude() == null || request.longitude() == null) {
            return badRequest("latitude and longitude are required");
        }
        if (request.type() == null || !VALID_TYPES.contains(request.type())) {
            return badRequest("type must be one of " + VALID_TYPES);
        }
        if (!geofenceService.isWithinBoundary(request.latitude(), request.longitude(), request.branchId())) {
            return badRequest("Coordinates fall outside the campus boundary. Place the pin within official campus boundaries.");
        }

        tbl_CampusFacilities facility = new tbl_CampusFacilities();
        facility.setName(request.name());
        facility.setType(request.type());
        facility.setDescription(request.description());
        facility.setBranchId(request.branchId());
        facility.setLatitude(request.latitude());
        facility.setLongitude(request.longitude());
        facility.setHeight(request.height() != null ? request.height() : 0);
        facility.setFootprintJson(serializeFootprint(request.footprint() != null && request.footprint().size() >= 3
            ? request.footprint()
            : squareAround(request.latitude(), request.longitude())));
        facility.setHeightOverride(Boolean.TRUE.equals(request.heightOverride()));
        facility.setPhotoUrl(request.photoUrl());

        return ResponseEntity.ok(campusFacilitiesRepo.save(facility));
    }

    @GetMapping
    public List<tbl_CampusFacilities> getCampusFacilities() {
        return campusFacilitiesRepo.findAll();
    }

    @PatchMapping("/{id}")
    public ResponseEntity<?> updateCampusFacility(@PathVariable Long id, @RequestBody CampusFacilityRequest request) {
        tbl_CampusFacilities facility = campusFacilitiesRepo.findById(id).orElse(null);
        if (facility == null) {
            return ResponseEntity.notFound().build();
        }

        if (request.type() != null) {
            if (!VALID_TYPES.contains(request.type())) {
                return badRequest("type must be one of " + VALID_TYPES);
            }
            facility.setType(request.type());
        }
        if (request.latitude() != null && request.longitude() != null) {
            if (!geofenceService.isWithinBoundary(request.latitude(), request.longitude(), facility.getBranchId())) {
                return badRequest("Coordinates fall outside the campus boundary. Place the pin within official campus boundaries.");
            }
            facility.setLatitude(request.latitude());
            facility.setLongitude(request.longitude());
        }
        if (request.name() != null) {
            facility.setName(request.name());
        }
        if (request.description() != null) {
            facility.setDescription(request.description());
        }
        if (request.height() != null) {
            facility.setHeight(request.height());
        }
        if (request.footprint() != null && request.footprint().size() >= 3) {
            facility.setFootprintJson(serializeFootprint(request.footprint()));
        }
        if (request.heightOverride() != null) {
            facility.setHeightOverride(request.heightOverride());
        }
        if (request.photoUrl() != null) {
            facility.setPhotoUrl(request.photoUrl());
        }

        tbl_CampusFacilities saved = campusFacilitiesRepo.save(facility);
        copyShapeToChildren(saved);
        return ResponseEntity.ok(saved);
    }

    // Storage rooms and venues carry their facility's footprint and height,
    // so a change here has to reach them too.
    private void copyShapeToChildren(tbl_CampusFacilities facility) {
        List<tbl_CampusStorages> storages = campusStoragesRepo.findByFacilityId(facility.getId());
        storages.forEach(s -> {
            s.setHeight(facility.getHeight());
            s.setFootprintJson(facility.getFootprintJson());
        });
        campusStoragesRepo.saveAll(storages);

        List<tbl_CampusVenues> venues = campusVenuesRepo.findByFacilityId(facility.getId());
        venues.forEach(v -> {
            v.setHeight(facility.getHeight());
            v.setFootprintJson(facility.getFootprintJson());
        });
        campusVenuesRepo.saveAll(venues);
    }

    private static List<List<Double>> squareAround(double lat, double lng) {
        double half = FALLBACK_FOOTPRINT_METERS / 2;
        double dLat = half / METERS_PER_DEG_LAT;
        double dLng = half / (METERS_PER_DEG_LAT * Math.cos(Math.toRadians(lat)));
        return List.of(
            List.of(lng - dLng, lat - dLat),
            List.of(lng + dLng, lat - dLat),
            List.of(lng + dLng, lat + dLat),
            List.of(lng - dLng, lat + dLat),
            List.of(lng - dLng, lat - dLat));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCampusFacility(@PathVariable Long id) {
        if (!campusFacilitiesRepo.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        if (campusStoragesRepo.existsByFacilityId(id) || campusVenuesRepo.existsByFacilityId(id)) {
            return badRequest("This facility still has storage or venues embedded in it. Remove those first.");
        }
        campusFacilitiesRepo.deleteById(id);
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
