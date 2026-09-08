package com.FMOnitor_SpringWeb.FMOnitor_WebBE.repo;

import com.FMOnitor_SpringWeb.FMOnitor_WebBE.model.tbl_Storage;

import org.springframework.data.jpa.repository.JpaRepository;

public interface tbl_StorageRepo extends JpaRepository<tbl_Storage, Long> {
    // Used by CampusAreaController to block deleting an area that still has
    // storage embedded in it, rather than silently orphaning those rows.
    boolean existsByCampusAreaId(Long campusAreaId);
}
