package com.FMOnitor_SpringWeb.FMOnitor_WebBE.repo;

import com.FMOnitor_SpringWeb.FMOnitor_WebBE.model.tbl_Storage;

import org.springframework.data.jpa.repository.JpaRepository;

public interface tbl_StorageRepo extends JpaRepository<tbl_Storage, Long> {
    boolean existsByCampusAreaId(Long campusAreaId);
}
