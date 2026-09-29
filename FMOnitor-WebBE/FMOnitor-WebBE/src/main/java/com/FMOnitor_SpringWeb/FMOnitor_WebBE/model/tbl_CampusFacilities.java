package com.FMOnitor_SpringWeb.FMOnitor_WebBE.model;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.time.Instant;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

// Every clickable location on the map (Building, Field, Gate, ...). Storage
// rooms and venues live in their own tables and point back here through
// campus_facility_id, so one facility can hold any number of each.
@Entity
@Table(name = "tbl_campus_facilities")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class tbl_CampusFacilities {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "campus_facility_id")
    private Long id;

    @Column(name = "campus_facility_name", nullable = false)
    private String name;

    @Column(name = "campus_facility_type", nullable = false)
    private String type;

    @Column(name = "campus_facility_description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "campus_branch_id", nullable = false)
    private Long branchId;

    // Read-only mirror of branchId - exists only so Hibernate creates a real
    // foreign key constraint on campus_branch_id. Writes go through branchId.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "campus_branch_id", insertable = false, updatable = false,
                foreignKey = @ForeignKey(name = "fk_campus_facilities_branch"))
    @JsonIgnore
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private tbl_CampusBranches branch;

    @Column(nullable = false)
    private Double latitude;

    @Column(nullable = false)
    private Double longitude;

    // Meters. Normally Mapbox's own height for the building at the pin (0 for
    // anything that isn't a building), so the pin sits on the roof the map
    // already draws.
    @Column(nullable = false)
    private Double height;

    // Outline as [[lng,lat], ...]: the building/area at the pin, or a small
    // square around the pin when there's nothing mapped there (e.g. gates).
    @Column(name = "footprint_json", nullable = false, columnDefinition = "TEXT")
    private String footprintJson;

    // True when height was corrected by hand because Mapbox's building is
    // wrong - the map then draws its own 3D block from footprint + height.
    @Column(name = "height_override", nullable = false)
    private Boolean heightOverride = false;

    @Column(name = "photo_url", columnDefinition = "TEXT")
    private String photoUrl;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    protected void onCreate() {
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }
}
