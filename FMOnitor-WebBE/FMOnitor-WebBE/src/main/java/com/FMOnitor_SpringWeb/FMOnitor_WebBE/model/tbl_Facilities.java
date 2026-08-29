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
}
