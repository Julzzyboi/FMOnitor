package com.FMOnitor_SpringWeb.FMOnitor_WebBE.service;

import com.FMOnitor_SpringWeb.FMOnitor_WebBE.model.tbl_CampusBranches;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.repo.tbl_CampusBranchesRepo;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class GeofenceService {

    private final tbl_CampusBranchesRepo campusBranchesRepo;
    private final ObjectMapper objectMapper;

    public GeofenceService(tbl_CampusBranchesRepo campusBranchesRepo, ObjectMapper objectMapper) {
        this.campusBranchesRepo = campusBranchesRepo;
        this.objectMapper = objectMapper;
    }

    public boolean isWithinBoundary(double lat, double lng, Long branchId) {
        return campusBranchesRepo.findById(branchId)
            .map(branch -> pointInPolygon(lat, lng, parseBoundary(branch)))
            .orElse(false);
    }

    public Optional<tbl_CampusBranches> findBranchContaining(double lat, double lng) {
        return campusBranchesRepo.findAll().stream()
            .filter(branch -> pointInPolygon(lat, lng, parseBoundary(branch)))
            .findFirst();
    }

    private List<List<Double>> parseBoundary(tbl_CampusBranches branch) {
        try {
            return objectMapper.readValue(branch.getBoundaryJson(), new TypeReference<List<List<Double>>>() {});
        } catch (Exception e) {
            throw new IllegalStateException("Malformed boundary JSON for campus branch " + branch.getId(), e);
        }
    }

    private boolean pointInPolygon(double lat, double lng, List<List<Double>> polygon) {
        boolean inside = false;
        int n = polygon.size();
        for (int i = 0, j = n - 1; i < n; j = i++) {
            double lngI = polygon.get(i).get(0), latI = polygon.get(i).get(1);
            double lngJ = polygon.get(j).get(0), latJ = polygon.get(j).get(1);

            boolean intersects = ((latI > lat) != (latJ > lat))
                && (lng < (lngJ - lngI) * (lat - latI) / (latJ - latI) + lngI);
            if (intersects) {
                inside = !inside;
            }
        }
        return inside;
    }
}
