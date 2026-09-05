package com.FMOnitor_SpringWeb.FMOnitor_WebBE.controller;

import com.FMOnitor_SpringWeb.FMOnitor_WebBE.model.tbl_Campuses;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.repo.tbl_CampusesRepo;
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

@RestController
@RequestMapping("/api/campuses")
public class CampusController {

    private final tbl_CampusesRepo campusesRepo;
    private final ObjectMapper objectMapper;

    public CampusController(tbl_CampusesRepo campusesRepo, ObjectMapper objectMapper) {
        this.campusesRepo = campusesRepo;
        this.objectMapper = objectMapper;
    }

    // boundary is [[lng, lat], [lng, lat], ...] - GeoJSON point order, matches
    // what Mapbox will hand over once the actual map UI is built next sprint.
    public record CampusRequest(String name, List<List<Double>> boundary) {}

    @PostMapping
    public ResponseEntity<tbl_Campuses> createCampus(@RequestBody CampusRequest request) throws Exception {
        tbl_Campuses campus = new tbl_Campuses();
        campus.setName(request.name());
        campus.setBoundaryJson(objectMapper.writeValueAsString(request.boundary()));
        return ResponseEntity.ok(campusesRepo.save(campus));
    }

    @GetMapping
    public List<tbl_Campuses> getCampuses() {
        return campusesRepo.findAll();
    }

    // name/boundary are both optional here (unlike create) - only touches
    // whichever field was actually sent, so re-drawing just the boundary
    // doesn't require re-sending the name too.
    @PatchMapping("/{id}")
    public ResponseEntity<?> updateCampus(@PathVariable Long id, @RequestBody CampusRequest request) throws Exception {
        tbl_Campuses campus = campusesRepo.findById(id).orElse(null);
        if (campus == null) {
            return ResponseEntity.notFound().build();
        }
        if (request.name() != null) {
            campus.setName(request.name());
        }
        if (request.boundary() != null) {
            campus.setBoundaryJson(objectMapper.writeValueAsString(request.boundary()));
        }
        return ResponseEntity.ok(campusesRepo.save(campus));
    }

    // No corresponding tbl_FacilitiesRepo cleanup here - a campus with facilities
    // still bound to it will just leave those rows pointing at a campusId that no
    // longer resolves to anything. Fine for a test/seed-data cleanup tool; a real
    // "delete a live campus" flow would need to decide what happens to its
    // facilities first (reassign vs. cascade), which isn't this endpoint's job.
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCampus(@PathVariable Long id) {
        if (campusesRepo.findById(id).isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        campusesRepo.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
