package com.FMOnitor_SpringWeb.FMOnitor_WebBE.repo;

import com.FMOnitor_SpringWeb.FMOnitor_WebBE.model.tbl_Venues;

import org.springframework.data.jpa.repository.JpaRepository;

public interface tbl_VenuesRepo extends JpaRepository<tbl_Venues, Long> {
    boolean existsByCampusAreaId(Long campusAreaId);
}
