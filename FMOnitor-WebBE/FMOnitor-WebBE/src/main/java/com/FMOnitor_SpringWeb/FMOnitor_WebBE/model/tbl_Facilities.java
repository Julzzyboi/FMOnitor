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

// Spatial assets/storage areas/venues from the User Story - each must be bound
// to a valid Campus ID and fall inside that campus's geofenced boundary.
@Entity
@Table(name = "tbl_facilities")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class tbl_Facilities {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private Double latitude;

    @Column(nullable = false)
    private Double longitude;

    // Plain FK field, not a JPA @ManyToOne relation - matches how the rest of
    // this codebase keeps entities (tbl_LoginLogs, tbl_Users) flat and simple.
    @Column(name = "campus_id", nullable = false)
    private Long campusId;

    // "Storage" | "Venue" | "Office" | "Laboratory" | "Utility" - a plain String
    // validated at the controller (FacilityController.VALID_TYPES), not an enum,
    // matching how tbl_Users.status/role are modeled. Drives which marker
    // icon/color the campus map shows for this facility.
    @Column(nullable = false)
    private String type;

    // Both nullable on purpose - per-building 3D customization on the campus
    // map, not required for a facility to exist. color is a hex string
    // ("#3b82f6"); when null the frontend falls back to a color derived from
    // `type`. height is extrusion height in meters; when null the frontend
    // falls back to a flat default so the building still renders in 3D.
    private String color;
    private Double height;
}
