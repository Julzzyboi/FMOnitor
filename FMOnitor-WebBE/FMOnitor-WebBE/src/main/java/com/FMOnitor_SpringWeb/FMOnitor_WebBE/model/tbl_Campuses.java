package com.FMOnitor_SpringWeb.FMOnitor_WebBE.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

// Reference data for "official Campus IDs" - each row is one UST campus and
// its boundary polygon, which GeofenceService checks facility coordinates against.
@Entity
@Table(name = "tbl_campuses")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class tbl_Campuses {

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
