package com.FMOnitor_SpringWeb.FMOnitor_WebBE.repo;

import com.FMOnitor_SpringWeb.FMOnitor_WebBE.model.tbl_CampusVenues;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface tbl_CampusVenuesRepo extends JpaRepository<tbl_CampusVenues, Long> {
    boolean existsByFacilityId(Long facilityId);

    List<tbl_CampusVenues> findByFacilityId(Long facilityId);
}
