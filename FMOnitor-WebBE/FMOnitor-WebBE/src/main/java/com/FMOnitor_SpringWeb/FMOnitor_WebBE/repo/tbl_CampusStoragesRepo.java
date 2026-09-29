package com.FMOnitor_SpringWeb.FMOnitor_WebBE.repo;

import com.FMOnitor_SpringWeb.FMOnitor_WebBE.model.tbl_CampusStorages;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface tbl_CampusStoragesRepo extends JpaRepository<tbl_CampusStorages, Long> {
    boolean existsByFacilityId(Long facilityId);

    List<tbl_CampusStorages> findByFacilityId(Long facilityId);
}
