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

// An issue filed against one inventory item - something damaged, missing or
// needing repair - tracked from Open to Resolved.
@Entity
@Table(name = "tbl_inventory_reports")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class tbl_InventoryReports {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "inventory_report_id")
    private Long id;

    @Column(name = "inventory_item_id", nullable = false)
    private Long itemId;

    // Read-only mirror of itemId - exists only for the foreign key.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inventory_item_id", insertable = false, updatable = false,
                foreignKey = @ForeignKey(name = "fk_inventory_reports_item"))
    @JsonIgnore
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private tbl_InventoryItems item;

    // Damaged | Missing | Needs Repair | Other
    @Column(name = "report_type", nullable = false)
    private String type;

    // How many units of the item the report covers.
    @Column(nullable = false)
    private Integer quantity;

    @Column(columnDefinition = "TEXT")
    private String description;

    // Open | In Progress | Resolved
    @Column(nullable = false)
    private String status;

    // Email of whoever filed the report.
    @Column(name = "reported_by")
    private String reportedBy;

    @Column(name = "resolved_at")
    private Instant resolvedAt;

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
