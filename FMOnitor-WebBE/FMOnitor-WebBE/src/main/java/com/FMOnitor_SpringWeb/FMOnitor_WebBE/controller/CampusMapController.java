package com.FMOnitor_SpringWeb.FMOnitor_WebBE.controller;

import com.FMOnitor_SpringWeb.FMOnitor_WebBE.model.tbl_CampusMaps;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.repo.tbl_CampusMapsRepo;
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

// Renamed from CampusController - "Campus" now means an individual area
// (see CampusAreaController), this one owns just the boundary polygon.
@RestController
@RequestMapping("/api/campus-maps")
public class CampusMapController {

    private final tbl_CampusMapsRepo campusMapsRepo;
    private final ObjectMapper objectMapper;

    public CampusMapController(tbl_CampusMapsRepo campusMapsRepo, ObjectMapper objectMapper) {
        this.campusMapsRepo = campusMapsRepo;
        this.objectMapper = objectMapper;
    }

    // boundary is [[lng, lat], [lng, lat], ...] - GeoJSON point order, matches
    // Mapbox's own coordinate order.
    // Plain class instead of a record - records need Java 16+, this project
    // targets Java 8. Kept the same field-name-style accessor methods a
    // record would have generated, so nothing else in this file needed to change.
    public static class CampusMapRequest {
        private final String name;
        private final List<List<Double>> boundary;

        public CampusMapRequest(String name, List<List<Double>> boundary) {
            this.name = name;
            this.boundary = boundary;
        }

        public String name() {
            return name;
        }

        public List<List<Double>> boundary() {
            return boundary;
        }
    }

    @PostMapping
    public ResponseEntity<tbl_CampusMaps> createCampusMap(@RequestBody CampusMapRequest request) throws Exception {
        tbl_CampusMaps campusMap = new tbl_CampusMaps();
        campusMap.setName(request.name());
        campusMap.setBoundaryJson(objectMapper.writeValueAsString(request.boundary()));
        return ResponseEntity.ok(campusMapsRepo.save(campusMap));
    }

    @GetMapping
    public List<tbl_CampusMaps> getCampusMaps() {
        return campusMapsRepo.findAll();
    }

    // name/boundary are both optional here (unlike create) - only touches
    // whichever field was actually sent, so re-drawing just the boundary
    // doesn't require re-sending the name too.
    @PatchMapping("/{id}")
    public ResponseEntity<?> updateCampusMap(@PathVariable Long id, @RequestBody CampusMapRequest request) throws Exception {
        tbl_CampusMaps campusMap = campusMapsRepo.findById(id).orElse(null);
        if (campusMap == null) {
            return ResponseEntity.notFound().build();
        }
        if (request.name() != null) {
            campusMap.setName(request.name());
        }
        if (request.boundary() != null) {
            campusMap.setBoundaryJson(objectMapper.writeValueAsString(request.boundary()));
        }
        return ResponseEntity.ok(campusMapsRepo.save(campusMap));
    }

    // No corresponding cleanup of tbl_CampusAreas/tbl_venues/tbl_storage here -
    // rows still pointing at this campusId just stop resolving to anything.
    // Fine for a test/seed-data cleanup tool; a real "delete a live campus"
    // flow would need to decide what happens to those first (reassign vs.
    // cascade), which isn't this endpoint's job.
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCampusMap(@PathVariable Long id) {
        if (!campusMapsRepo.findById(id).isPresent()) {
            return ResponseEntity.notFound().build();
        }
        campusMapsRepo.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
