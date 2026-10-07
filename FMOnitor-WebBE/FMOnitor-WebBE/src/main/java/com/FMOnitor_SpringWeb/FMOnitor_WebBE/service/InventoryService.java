package com.FMOnitor_SpringWeb.FMOnitor_WebBE.service;

import com.FMOnitor_SpringWeb.FMOnitor_WebBE.repo.tbl_InventoryItemsRepo;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.repo.tbl_InventoryReportsRepo;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class InventoryService {

    // How long an item sits in the trash bin before it's purged for good.
    public static final long TRASH_RETENTION_DAYS = 30;

    private final tbl_InventoryItemsRepo inventoryItemsRepo;
    private final tbl_InventoryReportsRepo inventoryReportsRepo;

    public InventoryService(tbl_InventoryItemsRepo inventoryItemsRepo,
                            tbl_InventoryReportsRepo inventoryReportsRepo) {
        this.inventoryItemsRepo = inventoryItemsRepo;
        this.inventoryReportsRepo = inventoryReportsRepo;
    }

    // Removes the item and its reports for good - they'd point at nothing otherwise.
    @Transactional
    public void permanentlyDelete(Long itemId) {
        inventoryReportsRepo.deleteByItemId(itemId);
        inventoryItemsRepo.deleteById(itemId);
    }
}
