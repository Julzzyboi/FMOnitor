package com.FMOnitor_SpringWeb.FMOnitor_WebBE.service;

import com.FMOnitor_SpringWeb.FMOnitor_WebBE.model.tbl_InventoryItems;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.repo.tbl_InventoryItemsRepo;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Component
public class InventoryTrashScheduler {

    private static final Logger log = LoggerFactory.getLogger(InventoryTrashScheduler.class);

    private final tbl_InventoryItemsRepo inventoryItemsRepo;
    private final InventoryService inventoryService;

    public InventoryTrashScheduler(tbl_InventoryItemsRepo inventoryItemsRepo, InventoryService inventoryService) {
        this.inventoryItemsRepo = inventoryItemsRepo;
        this.inventoryService = inventoryService;
    }

    // Hourly, so an item goes at most an hour past its 30 days.
    @Scheduled(cron = "0 0 * * * *")
    public void purgeExpiredTrash() {
        Instant cutoff = Instant.now().minus(InventoryService.TRASH_RETENTION_DAYS, ChronoUnit.DAYS);
        List<tbl_InventoryItems> expired = inventoryItemsRepo.findByDeletedAtBefore(cutoff);

        for (tbl_InventoryItems item : expired) {
            log.info("Auto-purging inventory item {} \"{}\" (trashed {}, past the {}-day retention window)",
                item.getId(), item.getName(), item.getDeletedAt(), InventoryService.TRASH_RETENTION_DAYS);
            inventoryService.permanentlyDelete(item.getId());
        }
    }
}
