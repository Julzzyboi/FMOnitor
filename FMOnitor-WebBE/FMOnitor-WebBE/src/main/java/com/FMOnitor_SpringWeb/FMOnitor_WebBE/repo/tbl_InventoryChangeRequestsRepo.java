package com.FMOnitor_SpringWeb.FMOnitor_WebBE.repo;

import com.FMOnitor_SpringWeb.FMOnitor_WebBE.model.tbl_InventoryChangeRequests;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface tbl_InventoryChangeRequestsRepo extends JpaRepository<tbl_InventoryChangeRequests, Long> {
    // The queue: oldest first.
    List<tbl_InventoryChangeRequests> findAllByOrderByIdAsc();

    List<tbl_InventoryChangeRequests> findByStatusOrderByIdAsc(String status);

    List<tbl_InventoryChangeRequests> findByRequestedByEmailOrderByIdDesc(String email);

    // The oldest still-pending request for an item - it must be decided first.
    Optional<tbl_InventoryChangeRequests> findFirstByItemIdAndStatusOrderByIdAsc(Long itemId, String status);
}
