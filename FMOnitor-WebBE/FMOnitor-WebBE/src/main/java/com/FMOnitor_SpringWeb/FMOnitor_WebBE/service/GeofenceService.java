package com.FMOnitor_SpringWeb.FMOnitor_WebBE.service;

import com.FMOnitor_SpringWeb.FMOnitor_WebBE.model.tbl_CampusMaps;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.repo.tbl_CampusMapsRepo;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

// Pure-Java point-in-polygon geofencing - no PostGIS/DB extension needed at
// this scale (a handful of campus boundaries, not a large geospatial dataset).
// Boundary points are [lng, lat] pairs, matching GeoJSON convention, so this
// lines up cleanly with Mapbox's own coordinate order once the UI work starts.
@Service
public class GeofenceService {

    private final tbl_CampusMapsRepo campusMapsRepo;
    private final ObjectMapper objectMapper;

    public GeofenceService(tbl_CampusMapsRepo campusMapsRepo, ObjectMapper objectMapper) {
        this.campusMapsRepo = campusMapsRepo;
        this.objectMapper = objectMapper;
    }

    public boolean isWithinBoundary(double lat, double lng, Long campusId) {
        return campusMapsRepo.findById(campusId)
            .map(campusMap -> pointInPolygon(lat, lng, parseBoundary(campusMap)))
            .orElse(false);
    }

    public Optional<tbl_CampusMaps> findCampusContaining(double lat, double lng) {
        return campusMapsRepo.findAll().stream()
            .filter(campusMap -> pointInPolygon(lat, lng, parseBoundary(campusMap)))
            .findFirst();
    }

    private List<List<Double>> parseBoundary(tbl_CampusMaps campusMap) {
        try {
            return objectMapper.readValue(campusMap.getBoundaryJson(), new TypeReference<List<List<Double>>>() {});
        } catch (Exception e) {
            throw new IllegalStateException("Malformed boundary JSON for campus map " + campusMap.getId(), e);
        }
    }

    // Standard ray-casting algorithm: cast a ray from the point and count how many
    // polygon edges it crosses - odd = inside, even = outside.
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
