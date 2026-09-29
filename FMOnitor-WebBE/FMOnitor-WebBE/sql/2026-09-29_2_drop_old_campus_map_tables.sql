-- Step 2 of 2: drop the old campus map tables. Run only after step 1
-- (2026-09-29_1_copy_campus_map_data.sql) and after checking the map shows
-- everything. This cannot be undone - the RDS instance has no automated
-- backups (backup retention is 0).
--
-- Drops the old campus map tables plus the unused `product` test table.
-- tbl_users, tbl_login_logs and tbl_refresh_tokens are left alone.

BEGIN;

-- Refuse to drop anything if step 1 hasn't copied the data yet.
DO $$
BEGIN
    IF (SELECT count(*) FROM tbl_campus_facilities) < (SELECT count(*) FROM tbl_campus_areas) THEN
        RAISE EXCEPTION 'tbl_campus_facilities has fewer rows than tbl_campus_areas - run step 1 first';
    END IF;
END $$;

-- Children first, so nothing still points at a table being dropped.
DROP TABLE IF EXISTS tbl_storage;
DROP TABLE IF EXISTS tbl_venues;
DROP TABLE IF EXISTS tbl_campus_areas;
DROP TABLE IF EXISTS tbl_campus_maps;

-- Empty leftovers from an even older version of the schema.
DROP TABLE IF EXISTS tbl_facilities;
DROP TABLE IF EXISTS tbl_campuses;

-- Test table from the removed Product/ProductController code.
DROP TABLE IF EXISTS product;

COMMIT;
