package com.FMOnitor_SpringWeb.FMOnitor_WebBE.controller;

import com.FMOnitor_SpringWeb.FMOnitor_WebBE.model.tbl_Campuses;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.repo.tbl_CampusesRepo;
import tools.jackson.databind.ObjectMapper;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
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
}
