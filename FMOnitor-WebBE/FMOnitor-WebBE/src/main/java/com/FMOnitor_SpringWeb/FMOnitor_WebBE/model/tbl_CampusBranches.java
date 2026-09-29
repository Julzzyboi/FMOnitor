package com.FMOnitor_SpringWeb.FMOnitor_WebBE.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.time.Instant;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

// One row per campus branch shown on the map. boundaryJson is the branch's
// outline as [[lng,lat], ...] - the map draws it and GeofenceService checks
// that every pin placed in this branch falls inside it.
@Entity
@Table(name = "tbl_campus_branches")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class tbl_CampusBranches {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "campus_branch_id")
    private Long id;

    @Column(name = "campus_branch_name", nullable = false)
    private String name;

    @Column(name = "boundary_json", nullable = false, columnDefinition = "TEXT")
    private String boundaryJson;

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
