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

// Storage areas on campus (replaces the old generic tbl_Facilities entries
// with their own dedicated table) - each must be bound to a valid Campus ID
// and fall inside that campus's geofenced boundary, same rule
// FacilityController used to enforce.
@Entity
@Table(name = "tbl_storage")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class tbl_Storage {

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
    // Derived from campusAreaId below at creation time (StorageController),
    // not sent directly by the client - a storage area belongs to a specific
    // campus area, and inherits that area's own campus map from there.
    @Column(name = "campus_id", nullable = false)
    private Long campusId;

    // Which specific campus area (tbl_CampusAreas) this storage area is
    // embedded in - e.g. a storage room inside "UST Main Building". Required:
    // every storage area belongs to exactly one campus area, unlike venues
    // (which stand alone, tied only to a campusId).
    @Column(name = "campus_area_id", nullable = false)
    private Long campusAreaId;

    // Both nullable - optional per-storage-area 3D customization on the
    // campus map, not required for a row to exist. height is extrusion
    // height in meters (frontend falls back to a flat default when null;
    // extrusion color is always derived from type, not stored per-row).
    // footprintJson is a GeoJSON-style [[lng,lat],...] polygon ring (same
    // convention as tbl_Campuses.boundaryJson) - the area's own real
    // footprint, drawn and supplied directly; when null, this row just
    // renders as a flat marker with no 3D extrusion at all.
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
