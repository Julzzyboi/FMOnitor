package com.FMOnitor_SpringWeb.FMOnitor_WebBE.controller;

import com.FMOnitor_SpringWeb.FMOnitor_WebBE.model.tbl_CampusBranches;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.repo.tbl_CampusBranchesRepo;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.repo.tbl_CampusFacilitiesRepo;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.util.MapUtil;
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

@RestController
@RequestMapping("/api/campus-branches")
public class CampusBranchController {

    private final tbl_CampusBranchesRepo campusBranchesRepo;
    private final tbl_CampusFacilitiesRepo campusFacilitiesRepo;
    private final ObjectMapper objectMapper;

    public CampusBranchController(tbl_CampusBranchesRepo campusBranchesRepo,
                                  tbl_CampusFacilitiesRepo campusFacilitiesRepo, ObjectMapper objectMapper) {
        this.campusBranchesRepo = campusBranchesRepo;
        this.campusFacilitiesRepo = campusFacilitiesRepo;
        this.objectMapper = objectMapper;
    }

    public record CampusBranchRequest(String name, List<List<Double>> boundary) {
    }

    @PostMapping
    public ResponseEntity<?> createCampusBranch(@RequestBody CampusBranchRequest request) throws Exception {
        if (request.name() == null || request.name().isBlank()) {
            return badRequest("name is required");
        }
        if (request.boundary() == null || request.boundary().size() < 3) {
            return badRequest("boundary needs at least 3 [lng, lat] points");
        }
        tbl_CampusBranches branch = new tbl_CampusBranches();
        branch.setName(request.name());
        branch.setBoundaryJson(objectMapper.writeValueAsString(request.boundary()));
        return ResponseEntity.ok(campusBranchesRepo.save(branch));
    }

    @GetMapping
    public List<tbl_CampusBranches> getCampusBranches() {
        return campusBranchesRepo.findAll();
    }

    @PatchMapping("/{id}")
    public ResponseEntity<?> updateCampusBranch(@PathVariable Long id, @RequestBody CampusBranchRequest request) throws Exception {
        tbl_CampusBranches branch = campusBranchesRepo.findById(id).orElse(null);
        if (branch == null) {
            return ResponseEntity.notFound().build();
        }
        if (request.name() != null) {
            branch.setName(request.name());
        }
        if (request.boundary() != null) {
            branch.setBoundaryJson(objectMapper.writeValueAsString(request.boundary()));
        }
        return ResponseEntity.ok(campusBranchesRepo.save(branch));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCampusBranch(@PathVariable Long id) {
        if (!campusBranchesRepo.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        if (campusFacilitiesRepo.existsByBranchId(id)) {
            return badRequest("This campus branch still has facilities on it. Remove those first.");
        }
        campusBranchesRepo.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private ResponseEntity<?> badRequest(String message) {
        return ResponseEntity.badRequest().body(MapUtil.of("message", message));
    }
}
