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

// A storage room/area inside one campus facility.
@Entity
@Table(name = "tbl_campus_storages")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class tbl_CampusStorages {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "campus_storage_id")
    private Long id;

    @Column(name = "campus_storage_name", nullable = false)
    private String name;

    @Column(name = "campus_storage_description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "campus_facility_id", nullable = false)
    private Long facilityId;

    // Read-only mirror of facilityId - exists only for the foreign key.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "campus_facility_id", insertable = false, updatable = false,
                foreignKey = @ForeignKey(name = "fk_campus_storages_facility"))
    @JsonIgnore
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private tbl_CampusFacilities facility;

    @Column(nullable = false)
    private Double latitude;

    @Column(nullable = false)
    private Double longitude;

    // Copied from the facility this is inside (see the controller) - a room
    // has no 3D shape of its own.
    @Column(nullable = false)
    private Double height;

    @Column(name = "footprint_json", nullable = false, columnDefinition = "TEXT")
    private String footprintJson;

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
