package com.FMOnitor_SpringWeb.FMOnitor_WebBE.repo;

import com.FMOnitor_SpringWeb.FMOnitor_WebBE.model.tbl_CampusFacilities;

import org.springframework.data.jpa.repository.JpaRepository;

public interface tbl_CampusFacilitiesRepo extends JpaRepository<tbl_CampusFacilities, Long> {
    boolean existsByBranchId(Long branchId);
}
