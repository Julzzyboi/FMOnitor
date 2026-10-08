package com.FMOnitor_SpringWeb.FMOnitor_WebBE.service;

import com.FMOnitor_SpringWeb.FMOnitor_WebBE.model.tbl_InventoryChangeRequests;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.model.tbl_InventoryItems;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.model.tbl_Notifications;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.model.tbl_Users;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.repo.tbl_InventoryChangeRequestsRepo;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.repo.tbl_InventoryItemsRepo;
import com.FMOnitor_SpringWeb.FMOnitor_WebBE.service.InventoryService.ItemChanges;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

import static com.FMOnitor_SpringWeb.FMOnitor_WebBE.model.tbl_InventoryChangeRequests.*;

// The approval queue for inventory changes made by Admins.
@Service
public class InventoryChangeRequestService {

    // Opens the request in the Inventory page's Action List.
    private static String linkTo(tbl_InventoryChangeRequests request) {
        return "/inventory?request=" + request.getId();
    }

    // What a queue operation produced: an HTTP status, a message for the
    // user, and the updated request.
    public record Outcome(HttpStatus status, String message, tbl_InventoryChangeRequests request) {
        static Outcome fail(HttpStatus status, String message) {
            return new Outcome(status, message, null);
        }

        public boolean ok() {
            return status.is2xxSuccessful();
        }
    }

    private final tbl_InventoryChangeRequestsRepo requestsRepo;
    private final tbl_InventoryItemsRepo inventoryItemsRepo;
    private final InventoryService inventoryService;
    private final NotificationService notificationService;
    private final ObjectMapper objectMapper;

    public InventoryChangeRequestService(tbl_InventoryChangeRequestsRepo requestsRepo,
                                         tbl_InventoryItemsRepo inventoryItemsRepo,
                                         InventoryService inventoryService,
                                         NotificationService notificationService,
                                         ObjectMapper objectMapper) {
        this.requestsRepo = requestsRepo;
        this.inventoryItemsRepo = inventoryItemsRepo;
        this.inventoryService = inventoryService;
        this.notificationService = notificationService;
        this.objectMapper = objectMapper;
    }

    // Queues an Admin's change and tells every Superadmin about it.
    // `item` is null for Create; `changes`/`previous` are null for actions
    // that don't edit fields.
    public tbl_InventoryChangeRequests submit(tbl_Users requester, String action, tbl_InventoryItems item,
                                              ItemChanges changes, ItemChanges previous) {
        tbl_InventoryChangeRequests request = new tbl_InventoryChangeRequests();
        request.setAction(action);
        request.setItemId(item != null ? item.getId() : null);
        request.setItemName(item != null ? item.getName() : (changes != null ? changes.name() : null));
        request.setChanges(toJson(changes));
        request.setPrevious(toJson(previous));
        request.setStatus(STATUS_PENDING);
        request.setRequestedByEmail(requester.getEmail());
        request.setRequestedByName(CurrentUserService.displayName(requester));
        tbl_InventoryChangeRequests saved = requestsRepo.save(request);

        notificationService.notifyRole(CurrentUserService.ROLE_SUPERADMIN, requester, tbl_Notifications.TYPE_INFO,
            "Inventory change awaiting approval",
            saved.getRequestedByName() + " wants to " + describe(saved) + ".",
            linkTo(saved));
        return saved;
    }

    @Transactional
    public Outcome approve(Long id, tbl_Users reviewer) {
        tbl_InventoryChangeRequests request = requestsRepo.findById(id).orElse(null);
        if (request == null) {
            return Outcome.fail(HttpStatus.NOT_FOUND, "That request no longer exists");
        }
        if (!STATUS_PENDING.equals(request.getStatus())) {
            return Outcome.fail(HttpStatus.CONFLICT, "This request was already " + request.getStatus().toLowerCase());
        }
        // Requests for the same item are applied strictly in the order they
        // were made, so a later edit can never be undone by an earlier one.
        if (request.getItemId() != null) {
            tbl_InventoryChangeRequests first = requestsRepo
                .findFirstByItemIdAndStatusOrderByIdAsc(request.getItemId(), STATUS_PENDING).orElse(request);
            if (!first.getId().equals(request.getId())) {
                return Outcome.fail(HttpStatus.CONFLICT, "Decide request #" + first.getId()
                    + " for this item first - requests for the same item are reviewed in the order they were made.");
            }
        }

        // Re-checked against the inventory as it is now: things may have
        // changed since the Admin made the request.
        tbl_InventoryItems item = null;
        if (!ACTION_CREATE.equals(request.getAction())) {
            item = inventoryItemsRepo.findById(request.getItemId()).orElse(null);
            if (item == null) {
                return cantApply("the item no longer exists");
            }
        }
        ItemChanges changes = fromJson(request.getChanges());
        String error = switch (request.getAction()) {
            case ACTION_CREATE -> inventoryService.checkCreate(changes);
            case ACTION_UPDATE -> inventoryService.checkUpdate(item, changes);
            case ACTION_TRASH -> inventoryService.checkTrash(item);
            case ACTION_RESTORE -> inventoryService.checkRestore(item);
            case ACTION_PERMANENT_DELETE -> inventoryService.checkPermanentDelete(item);
            default -> "unknown action " + request.getAction();
        };
        if (error != null) {
            return cantApply(error);
        }

        Long resultItemId = switch (request.getAction()) {
            case ACTION_CREATE -> inventoryService.create(changes).getId();
            case ACTION_UPDATE -> inventoryService.update(item, changes).getId();
            case ACTION_TRASH -> inventoryService.trash(item).getId();
            case ACTION_RESTORE -> inventoryService.restore(item).getId();
            default -> {
                inventoryService.permanentlyDelete(item.getId());
                yield item.getId();
            }
        };

        markReviewed(request, reviewer, STATUS_APPROVED, null);
        request.setResultItemId(resultItemId);
        if (request.getItemId() == null) {
            request.setItemId(resultItemId);
        }
        tbl_InventoryChangeRequests saved = requestsRepo.save(request);

        notificationService.notify(request.getRequestedByEmail(), reviewer, tbl_Notifications.TYPE_SUCCESS,
            "Your inventory change was approved",
            "Your request to " + describe(saved) + " was approved by " + saved.getReviewedByName()
                + " and is now saved in the inventory.",
            linkTo(saved));
        return new Outcome(HttpStatus.OK, "Change approved and saved to the inventory", saved);
    }

    @Transactional
    public Outcome reject(Long id, tbl_Users reviewer, String reason) {
        tbl_InventoryChangeRequests request = requestsRepo.findById(id).orElse(null);
        if (request == null) {
            return Outcome.fail(HttpStatus.NOT_FOUND, "That request no longer exists");
        }
        if (!STATUS_PENDING.equals(request.getStatus())) {
            return Outcome.fail(HttpStatus.CONFLICT, "This request was already " + request.getStatus().toLowerCase());
        }
        String note = reason != null && !reason.isBlank() ? reason.trim() : null;
        markReviewed(request, reviewer, STATUS_REJECTED, note);
        tbl_InventoryChangeRequests saved = requestsRepo.save(request);

        notificationService.notify(request.getRequestedByEmail(), reviewer, tbl_Notifications.TYPE_DANGER,
            "A Superadmin rejected your action",
            saved.getReviewedByName() + " rejected your request to " + describe(saved) + "."
                + (note != null ? " Reason: " + note : ""),
            linkTo(saved));
        return new Outcome(HttpStatus.OK, "Change rejected - the Admin has been notified", saved);
    }

    // An Admin can withdraw their own request while it's still pending.
    @Transactional
    public Outcome cancel(Long id, tbl_Users requester) {
        tbl_InventoryChangeRequests request = requestsRepo.findById(id).orElse(null);
        if (request == null) {
            return Outcome.fail(HttpStatus.NOT_FOUND, "That request no longer exists");
        }
        if (!request.getRequestedByEmail().equalsIgnoreCase(requester.getEmail())) {
            return Outcome.fail(HttpStatus.FORBIDDEN, "You can only cancel your own requests");
        }
        if (!STATUS_PENDING.equals(request.getStatus())) {
            return Outcome.fail(HttpStatus.CONFLICT, "This request was already " + request.getStatus().toLowerCase());
        }
        request.setStatus(STATUS_CANCELLED);
        request.setReviewedAt(Instant.now());
        return new Outcome(HttpStatus.OK, "Request cancelled", requestsRepo.save(request));
    }

    private Outcome cantApply(String reason) {
        return Outcome.fail(HttpStatus.CONFLICT,
            "This change can't be applied any more: " + reason + ". Reject it instead.");
    }

    private void markReviewed(tbl_InventoryChangeRequests request, tbl_Users reviewer, String status, String note) {
        request.setStatus(status);
        request.setReviewedByEmail(reviewer.getEmail());
        request.setReviewedByName(CurrentUserService.displayName(reviewer));
        request.setReviewedAt(Instant.now());
        request.setReviewNote(note);
    }

    // e.g. "edit “Torch” (FMO-INV-0002)" - used in notifications.
    private static String describe(tbl_InventoryChangeRequests request) {
        String name = "“" + (request.getItemName() != null ? request.getItemName() : "an item") + "”";
        String id = request.getItemId() != null ? " (" + String.format("FMO-INV-%04d", request.getItemId()) + ")" : "";
        return switch (request.getAction()) {
            case ACTION_CREATE -> "add " + name + " to the inventory";
            case ACTION_UPDATE -> "edit " + name + id;
            case ACTION_TRASH -> "move " + name + id + " to the trash bin";
            case ACTION_RESTORE -> "restore " + name + id + " from the trash bin";
            case ACTION_PERMANENT_DELETE -> "permanently delete " + name + id;
            default -> "change " + name + id;
        };
    }

    private String toJson(ItemChanges changes) {
        if (changes == null) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(changes);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Could not store the requested changes", e);
        }
    }

    private ItemChanges fromJson(String json) {
        if (json == null) {
            return null;
        }
        try {
            return objectMapper.readValue(json, ItemChanges.class);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Could not read the requested changes", e);
        }
    }
}
