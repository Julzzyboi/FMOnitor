package com.FMOnitor_SpringWeb.FMOnitor_WebBE.model;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.time.Instant;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

// One line of equipment kept in a Campus Map storage (e.g. 500 stackable
// chairs at Qpav Mezzanine). The same item name can appear in several storages.
@Entity
@Table(name = "tbl_inventory_items")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class tbl_InventoryItems {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "inventory_item_id")
    private Long id;

    @Column(name = "item_name", nullable = false, length = 100)
    private String name;

    @Column(name = "campus_storage_id", nullable = false)
    private Long storageId;

    // Read-only mirror of storageId - exists only for the foreign key.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "campus_storage_id", insertable = false, updatable = false,
                foreignKey = @ForeignKey(name = "fk_inventory_items_storage"))
    @JsonIgnore
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private tbl_CampusStorages storage;

    @Column(name = "available_qty", nullable = false)
    private Integer available;

    // Good | Defect | Damaged | Missing
    @Column(name = "item_condition", nullable = false)
    private String condition;

    // Borrowable | Non-Borrowable
    @Column(nullable = false)
    private String availability;

    // A critical item is tracked one physical unit per ID (its own record,
    // ID and QR sticker), so its quantity is always exactly 1. Non-critical
    // items are bulk stock where one ID covers many units. The DB default
    // lets Hibernate add the column to a table that already has rows.
    @Column(name = "is_critical", nullable = false, columnDefinition = "boolean not null default false")
    private Boolean critical = false;

    @Column(name = "photo_url", columnDefinition = "TEXT")
    private String photoUrl;

    // Set when the item is moved to the trash bin; null while it's active.
    // Trashed items are purged for good 30 days later (InventoryTrashScheduler).
    @Column(name = "deleted_at")
    private Instant deletedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    protected void onCreate() {
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }
}
