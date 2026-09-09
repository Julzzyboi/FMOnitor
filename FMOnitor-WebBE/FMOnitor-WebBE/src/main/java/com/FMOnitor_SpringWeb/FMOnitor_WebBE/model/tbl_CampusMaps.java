package com.FMOnitor_SpringWeb.FMOnitor_WebBE.model;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.Table;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

// Renamed from tbl_Campuses - "Campus" now refers to the individual named
// locations/areas on campus (tbl_CampusAreas), not the physical
// campus/zone boundary itself. This table is purely the boundary polygon
// GeofenceService checks area/venue/storage coordinates against.
@Entity
@Table(name = "tbl_campus_maps")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class tbl_CampusMaps {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    // GeoJSON-style [[lng, lat], [lng, lat], ...] polygon, stored as raw JSON text -
    // no PostGIS dependency needed for a simple point-in-polygon check at this scale.
    @Column(name = "boundary_json", nullable = false, columnDefinition = "TEXT")
    private String boundaryJson;
}
