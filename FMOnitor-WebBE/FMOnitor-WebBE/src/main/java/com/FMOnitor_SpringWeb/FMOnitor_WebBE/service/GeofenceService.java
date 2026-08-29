package com.FMOnitor_SpringWeb.FMOnitor_WebBE.service;

import com.FMOnitor_SpringWeb.FMOnitor_WebBE.model.tbl_Campuses;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.repo.tbl_CampusesRepo;
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

    private final tbl_CampusesRepo campusesRepo;
    private final ObjectMapper objectMapper;

    public GeofenceService(tbl_CampusesRepo campusesRepo, ObjectMapper objectMapper) {
        this.campusesRepo = campusesRepo;
        this.objectMapper = objectMapper;
    }

    public boolean isWithinBoundary(double lat, double lng, Long campusId) {
        return campusesRepo.findById(campusId)
            .map(campus -> pointInPolygon(lat, lng, parseBoundary(campus)))
            .orElse(false);
    }

    public Optional<tbl_Campuses> findCampusContaining(double lat, double lng) {
        return campusesRepo.findAll().stream()
            .filter(campus -> pointInPolygon(lat, lng, parseBoundary(campus)))
            .findFirst();
    }

    private List<List<Double>> parseBoundary(tbl_Campuses campus) {
        try {
            return objectMapper.readValue(campus.getBoundaryJson(), new TypeReference<List<List<Double>>>() {});
        } catch (Exception e) {
            throw new IllegalStateException("Malformed boundary JSON for campus " + campus.getId(), e);
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
