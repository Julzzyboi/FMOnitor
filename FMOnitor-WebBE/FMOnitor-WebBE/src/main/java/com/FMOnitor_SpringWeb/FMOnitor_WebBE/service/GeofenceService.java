package com.FMOnitor_SpringWeb.FMOnitor_WebBE.service;

import com.FMOnitor_SpringWeb.FMOnitor_WebBE.model.tbl_CampusBranches;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.model.tbl_CampusFacilities;
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

    // A storage room or venue must be placed inside its facility's geofence:
    // the smallest rectangle around the facility's outline (footprint_json),
    // lined up with the campus's street grid, grown by this many meters on
    // every side - so entrances and small sheds just outside the walls still
    // count. The web map draws exactly this rectangle (geofence.js runs the
    // same math) - keep the two in step, including FACILITY_GEOFENCE_MARGIN_M.
    public static final double FACILITY_MARGIN_METERS = 10;
    private static final double METERS_PER_DEG_LAT = 111320;

    public boolean isWithinFacility(double lat, double lng, tbl_CampusFacilities facility) {
        List<List<Double>> outline;
        try {
            outline = openRing(objectMapper.readValue(facility.getFootprintJson(), new TypeReference<List<List<Double>>>() {}));
        } catch (Exception e) {
            throw new IllegalStateException("Malformed footprint JSON for campus facility " + facility.getId(), e);
        }
        if (outline.size() < 3) {
            return false;
        }
        double angle = campusBranchesRepo.findById(facility.getBranchId())
            .map(branch -> campusGridAngle(openRing(parseBoundary(branch))))
            .orElse(0.0);

        // Outline and point in the grid-aligned frame, origin at the outline's
        // first corner.
        List<Double> origin = outline.get(0);
        double minU = Double.MAX_VALUE, maxU = -Double.MAX_VALUE, minV = Double.MAX_VALUE, maxV = -Double.MAX_VALUE;
        for (List<Double> p : outline) {
            double[] uv = toGrid(p.get(0), p.get(1), origin, angle);
            minU = Math.min(minU, uv[0]);
            maxU = Math.max(maxU, uv[0]);
            minV = Math.min(minV, uv[1]);
            maxV = Math.max(maxV, uv[1]);
        }
        double[] point = toGrid(lng, lat, origin, angle);
        return point[0] >= minU - FACILITY_MARGIN_METERS && point[0] <= maxU + FACILITY_MARGIN_METERS
            && point[1] >= minV - FACILITY_MARGIN_METERS && point[1] <= maxV + FACILITY_MARGIN_METERS;
    }

    // Direction of the campus's street grid, in radians within [0, pi/2): the
    // turn of the smallest rectangle that fits around the boundary. The best
    // fit always lies along one of the boundary's own edges.
    private double campusGridAngle(List<List<Double>> boundary) {
        if (boundary.size() < 3) {
            return 0;
        }
        List<Double> origin = boundary.get(0);
        int n = boundary.size();
        double[][] flat = new double[n][];
        for (int i = 0; i < n; i++) {
            flat[i] = toGrid(boundary.get(i).get(0), boundary.get(i).get(1), origin, 0);
        }
        double bestAngle = 0;
        double bestArea = Double.MAX_VALUE;
        double quarter = Math.PI / 2;
        for (int i = 0; i < n; i++) {
            double[] a = flat[i], b = flat[(i + 1) % n];
            if (a[0] == b[0] && a[1] == b[1]) {
                continue;
            }
            double angle = ((Math.atan2(b[1] - a[1], b[0] - a[0]) % quarter) + quarter) % quarter;
            double cos = Math.cos(angle), sin = Math.sin(angle);
            double minU = Double.MAX_VALUE, maxU = -Double.MAX_VALUE, minV = Double.MAX_VALUE, maxV = -Double.MAX_VALUE;
            for (double[] p : flat) {
                double u = p[0] * cos + p[1] * sin, v = -p[0] * sin + p[1] * cos;
                minU = Math.min(minU, u);
                maxU = Math.max(maxU, u);
                minV = Math.min(minV, v);
                maxV = Math.max(maxV, v);
            }
            double area = (maxU - minU) * (maxV - minV);
            if (area < bestArea) {
                bestArea = area;
                bestAngle = angle;
            }
        }
        return bestAngle;
    }

    // Flat local projection in meters around `origin`, turned by `angle` - u/v
    // run along the campus grid. Accurate to well under a meter at campus scale.
    private double[] toGrid(double lng, double lat, List<Double> origin, double angle) {
        double kx = METERS_PER_DEG_LAT * Math.cos(Math.toRadians(origin.get(1)));
        double x = (lng - origin.get(0)) * kx;
        double y = (lat - origin.get(1)) * METERS_PER_DEG_LAT;
        return new double[] { x * Math.cos(angle) + y * Math.sin(angle), -x * Math.sin(angle) + y * Math.cos(angle) };
    }

    // Drops a repeated closing point, so every corner counts once.
    private List<List<Double>> openRing(List<List<Double>> ring) {
        int n = ring.size();
        if (n > 1 && ring.get(0).equals(ring.get(n - 1))) {
            return ring.subList(0, n - 1);
        }
        return ring;
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
