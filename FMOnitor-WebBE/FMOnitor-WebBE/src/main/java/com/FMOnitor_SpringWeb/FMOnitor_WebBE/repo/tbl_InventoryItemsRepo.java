package com.FMOnitor_SpringWeb.FMOnitor_WebBE.repo;

import com.FMOnitor_SpringWeb.FMOnitor_WebBE.model.tbl_InventoryItems;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface tbl_InventoryItemsRepo extends JpaRepository<tbl_InventoryItems, Long> {
    // Active items (not in the trash bin)
    List<tbl_InventoryItems> findByDeletedAtIsNull();

    List<tbl_InventoryItems> findByStorageIdAndDeletedAtIsNull(Long storageId);

    // Trash bin, most recently deleted first
    List<tbl_InventoryItems> findByDeletedAtIsNotNullOrderByDeletedAtDesc();

    List<tbl_InventoryItems> findByStorageIdAndDeletedAtIsNotNullOrderByDeletedAtDesc(Long storageId);

    List<tbl_InventoryItems> findByDeletedAtBefore(Instant cutoff);

    // Counts trashed items too - a storage can't be removed while its trash still points at it.
    long countByStorageId(Long storageId);

    @Query("select i.id from tbl_InventoryItems i where i.storageId = :storageId")
    List<Long> findIdsByStorageId(@Param("storageId") Long storageId);

    @Modifying
    @Query("update tbl_InventoryItems i set i.storageId = :toStorageId, i.updatedAt = CURRENT_TIMESTAMP "
         + "where i.storageId = :fromStorageId")
    int moveToStorage(@Param("fromStorageId") Long fromStorageId, @Param("toStorageId") Long toStorageId);

    @Modifying
    @Query("delete from tbl_InventoryItems i where i.storageId = :storageId")
    int deleteAllInStorage(@Param("storageId") Long storageId);
}
