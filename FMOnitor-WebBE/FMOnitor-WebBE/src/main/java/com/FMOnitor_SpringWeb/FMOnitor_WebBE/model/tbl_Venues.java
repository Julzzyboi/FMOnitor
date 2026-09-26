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

    @Column(name = "campus_id", nullable = false)
    private Long campusId;

    @Column(name = "campus_area_id", nullable = false)
    private Long campusAreaId;

    private Double height;
    @Column(name = "footprint_json", columnDefinition = "TEXT")
    private String footprintJson;

    @Column(name = "photo_url", columnDefinition = "TEXT")
    private String photoUrl;
}
