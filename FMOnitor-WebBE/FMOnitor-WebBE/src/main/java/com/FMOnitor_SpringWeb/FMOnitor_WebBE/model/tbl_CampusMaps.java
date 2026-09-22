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

@Entity
@Table(name = "tbl_campus_maps")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class tbl_CampusMaps {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(name = "boundary_json", nullable = false, columnDefinition = "TEXT")
    private String boundaryJson;
}
