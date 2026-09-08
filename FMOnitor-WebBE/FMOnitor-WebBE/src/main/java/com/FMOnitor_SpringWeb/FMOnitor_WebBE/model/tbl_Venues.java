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

// Event venues on campus (replaces the old generic tbl_Facilities "Venue"-ish
// entries with their own dedicated table) - each must be bound to a valid
// Campus ID and fall inside that campus's geofenced boundary, same rule
// FacilityController used to enforce.
@Entity
@Table(name = "tbl_venues")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class tbl_Venues {

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
    // Derived from campusAreaId below at creation time (VenueController), not
    // sent directly by the client - a venue belongs to a specific campus
    // area, and inherits that area's own campus map from there.
    @Column(name = "campus_id", nullable = false)
    private Long campusId;

    // Which specific campus area (tbl_CampusAreas) this venue is embedded in
    // - e.g. an event hall inside "UST Main Building". Required: every venue
    // belongs to exactly one campus area (mirrors tbl_Storage's design).
    @Column(name = "campus_area_id", nullable = false)
    private Long campusAreaId;

    // Both nullable - optional per-venue 3D customization on the campus map,
    // not required for a venue to exist. height is extrusion height in
    // meters (frontend falls back to a flat default when null; extrusion
    // color is always derived from type, not stored per-row). footprintJson
    // is a GeoJSON-style [[lng,lat],...] polygon ring (same convention as
    // tbl_Campuses.boundaryJson) - the venue's own real footprint, drawn and
    // supplied directly; when null, this venue just renders as a flat marker
    // with no 3D extrusion at all.
    private Double height;
    @Column(name = "footprint_json", columnDefinition = "TEXT")
    private String footprintJson;

    // Nullable - shown in the campus map's details sidebar when set; a
    // placeholder renders in the frontend when it's null. Holds a real
    // uploaded photo as a base64 data URL (see tbl_CampusAreas.photoUrl) -
    // TEXT because a data URL is far larger than a plain https:// link.
    @Column(name = "photo_url", columnDefinition = "TEXT")
    private String photoUrl;
}
