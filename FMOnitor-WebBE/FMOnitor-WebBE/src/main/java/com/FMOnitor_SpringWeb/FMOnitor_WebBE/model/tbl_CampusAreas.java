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

// General registry of every named location from the UST campus GeoJSON
// dataset (buildings, gates, fields, plazas, etc.) - distinct from
// tbl_Venues/tbl_Storage, which are their own dedicated tables for those
// specific administrative categories. Each row must be bound to a valid
// campus map id and fall inside that campus map's geofenced boundary.
@Entity
@Table(name = "tbl_campus_areas")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class tbl_CampusAreas {

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
    // References tbl_campus_maps, not a separate "campus" table.
    @Column(name = "campus_id", nullable = false)
    private Long campusId;

    // "Building" | "Field" | "Grandstand" | "Pool" | "In-Campus Grounds" |
    // "Garden" | "Gate" | "Court" - the real areaType categories from the UST
    // campus GeoJSON dataset. Validated at the controller
    // (CampusAreaController.VALID_TYPES), not an enum, matching how
    // tbl_Users.status/role are modeled.
    @Column(nullable = false)
    private String type;

    // Both nullable - optional per-area 3D customization on the campus map,
    // not required for a row to exist. height is extrusion height in meters
    // (frontend falls back to a flat default when null; extrusion color is
    // always derived from the area's own type, not stored per-row).
    // footprintJson is a GeoJSON-style [[lng,lat],...] polygon ring (same
    // convention as tbl_CampusMaps.boundaryJson) - the area's own real
    // footprint, drawn and supplied directly; when null, this row just
    // renders as a flat marker with no 3D extrusion at all.
    private Double height;
    @Column(name = "footprint_json", columnDefinition = "TEXT")
    private String footprintJson;

    // Nullable - shown in the campus map's details sidebar when set; a
    // placeholder renders in the frontend when it's null. Holds a real
    // uploaded photo as a base64 data URL (the frontend's file picker reads
    // the chosen file via FileReader.readAsDataURL, same convention as
    // Accounts/AvatarPicker.jsx) - TEXT because a data URL is far larger than
    // a plain https:// link and would overflow a default varchar(255) column.
    @Column(name = "photo_url", columnDefinition = "TEXT")
    private String photoUrl;
}
