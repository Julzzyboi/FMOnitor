-- Switches tbl_inventory_items from a free-text storage_area to a real link
-- to a Campus Map storage (campus_storage_id), and drops not_working_qty.
--
-- Only needed if tbl_inventory_items already exists (the backend was started
-- with the earlier version). Run it BEFORE starting the updated backend -
-- otherwise Hibernate can't add the new NOT NULL column to a table with rows,
-- and inserts fail on the old NOT NULL storage_area column.
--
-- Each item is matched to a storage by name (case-insensitive). If any item's
-- storage_area has no storage with that name, the script stops and lists the
-- names: add them on the Campus Map (or fix the names) and run it again.

BEGIN;

ALTER TABLE tbl_inventory_items ADD COLUMN IF NOT EXISTS campus_storage_id BIGINT;

UPDATE tbl_inventory_items i
SET campus_storage_id = (
    SELECT min(s.campus_storage_id)
    FROM tbl_campus_storages s
    WHERE lower(trim(s.campus_storage_name)) = lower(trim(i.storage_area))
)
WHERE i.campus_storage_id IS NULL;

DO $$
DECLARE
    missing TEXT;
BEGIN
    SELECT string_agg(DISTINCT storage_area, ', ') INTO missing
    FROM tbl_inventory_items
    WHERE campus_storage_id IS NULL;
    IF missing IS NOT NULL THEN
        RAISE EXCEPTION 'No Campus Map storage named: % - add these storages on the Campus Map and run this again', missing;
    END IF;
END $$;

ALTER TABLE tbl_inventory_items ALTER COLUMN campus_storage_id SET NOT NULL;

ALTER TABLE tbl_inventory_items
    ADD CONSTRAINT fk_inventory_items_storage
    FOREIGN KEY (campus_storage_id) REFERENCES tbl_campus_storages (campus_storage_id);

ALTER TABLE tbl_inventory_items DROP COLUMN storage_area;
ALTER TABLE tbl_inventory_items DROP COLUMN not_working_qty;

-- Fair/Poor were replaced by Defect.
UPDATE tbl_inventory_items SET item_condition = 'Defect' WHERE item_condition IN ('Fair', 'Poor');

COMMIT;
