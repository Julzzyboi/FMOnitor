package com.FMOnitor_SpringWeb.FMOnitor_WebBE.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonRawValue;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.Version;

import java.time.Instant;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

// An inventory change an Admin made, waiting in the queue for a Superadmin to
// approve (then it's applied) or reject. Requests are reviewed oldest first,
// and for one item strictly in order, so simultaneous edits can't clash.
@Entity
@Table(name = "tbl_inventory_change_requests")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class tbl_InventoryChangeRequests {

    public static final String STATUS_PENDING = "Pending";
    public static final String STATUS_APPROVED = "Approved";
    public static final String STATUS_REJECTED = "Rejected";
    public static final String STATUS_CANCELLED = "Cancelled";

    public static final String ACTION_CREATE = "Create";
    public static final String ACTION_UPDATE = "Update";
    public static final String ACTION_TRASH = "Trash";
    public static final String ACTION_RESTORE = "Restore";
    public static final String ACTION_PERMANENT_DELETE = "PermanentDelete";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "change_request_id")
    private Long id;

    // Create | Update | Trash | Restore | PermanentDelete
    @Column(nullable = false)
    private String action;

    // Null for Create until it's approved (then see resultItemId).
    @Column(name = "inventory_item_id")
    private Long itemId;

    // Name at the time of the request, so the queue stays readable even if
    // the item is renamed or deleted later.
    @Column(name = "item_name")
    private String itemName;

    // The requested field values (Create/Update) as JSON; only the fields
    // that actually change are stored for an Update.
    @Column(name = "changes_json", columnDefinition = "TEXT")
    @JsonRawValue
    private String changes;

    // Those fields' values when the request was made, for a before/after view.
    @Column(name = "previous_json", columnDefinition = "TEXT")
    @JsonRawValue
    private String previous;

    // Pending | Approved | Rejected | Cancelled
    @Column(nullable = false)
    private String status;

    @Column(name = "requested_by_email", nullable = false)
    private String requestedByEmail;

    @Column(name = "requested_by_name")
    private String requestedByName;

    @Column(name = "requested_at", nullable = false, updatable = false)
    private Instant requestedAt;

    @Column(name = "reviewed_by_email")
    private String reviewedByEmail;

    @Column(name = "reviewed_by_name")
    private String reviewedByName;

    @Column(name = "reviewed_at")
    private Instant reviewedAt;

    // The Superadmin's reason when rejecting.
    @Column(name = "review_note", columnDefinition = "TEXT")
    private String reviewNote;

    // The item the approved change produced or affected.
    @Column(name = "result_item_id")
    private Long resultItemId;

    // Optimistic lock: if two Superadmins decide the same request at once,
    // the second save fails instead of applying the change twice.
    @Version
    @JsonIgnore
    private Long version;

    @PrePersist
    protected void onCreate() {
        requestedAt = Instant.now();
    }
}
