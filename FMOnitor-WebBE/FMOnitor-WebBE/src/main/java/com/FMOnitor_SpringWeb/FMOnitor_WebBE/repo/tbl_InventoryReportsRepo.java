package com.FMOnitor_SpringWeb.FMOnitor_WebBE.repo;

import com.FMOnitor_SpringWeb.FMOnitor_WebBE.model.tbl_InventoryReports;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface tbl_InventoryReportsRepo extends JpaRepository<tbl_InventoryReports, Long> {
    List<tbl_InventoryReports> findByItemIdOrderByCreatedAtDesc(Long itemId);

    List<tbl_InventoryReports> findAllByOrderByCreatedAtDesc();

    void deleteByItemId(Long itemId);

    @Modifying
    @Query("delete from tbl_InventoryReports r where r.itemId in :itemIds")
    int deleteAllForItems(@Param("itemIds") List<Long> itemIds);
}
