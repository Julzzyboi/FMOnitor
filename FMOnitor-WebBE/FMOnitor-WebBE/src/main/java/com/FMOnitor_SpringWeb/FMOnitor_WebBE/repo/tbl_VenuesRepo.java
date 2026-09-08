package com.FMOnitor_SpringWeb.FMOnitor_WebBE.repo;

import com.FMOnitor_SpringWeb.FMOnitor_WebBE.model.tbl_Venues;

import org.springframework.data.jpa.repository.JpaRepository;

public interface tbl_VenuesRepo extends JpaRepository<tbl_Venues, Long> {
    // Used by CampusAreaController to block deleting an area that still has
    // venues embedded in it, rather than silently orphaning those rows.
    boolean existsByCampusAreaId(Long campusAreaId);
}
