-- Step 1 of 2: copy the campus map data from the old tables into the new
-- schema. Non-destructive - the old tables are left untouched, so the map can
-- be checked before step 2 drops them.
--
-- Run AFTER the updated backend has started once (Hibernate creates the new
-- tables). Safe to re-run: rows already copied are skipped.
--
-- Ids are copied as-is, so every link keeps pointing at the same row:
--   tbl_campus_maps.id              -> tbl_campus_branches.campus_branch_id
--   tbl_campus_areas.id             -> tbl_campus_facilities.campus_facility_id
--   tbl_campus_areas.campus_id      -> tbl_campus_facilities.campus_branch_id
--   tbl_storage / tbl_venues.campus_area_id -> campus_facility_id
-- (the old campus_id on storage/venues is dropped - it's derivable from the
-- facility, which already knows its branch)

BEGIN;

INSERT INTO tbl_campus_branches (campus_branch_id, campus_branch_name, boundary_json, created_at, updated_at)
SELECT id, name, boundary_json, now(), now()
FROM tbl_campus_maps
ON CONFLICT (campus_branch_id) DO NOTHING;

INSERT INTO tbl_campus_facilities (campus_facility_id, campus_facility_name, campus_facility_type,
                                   campus_facility_description, campus_branch_id, latitude, longitude,
                                   height, footprint_json, photo_url, created_at, updated_at)
SELECT id, name, type, NULL, campus_id, latitude, longitude, height, footprint_json, photo_url, now(), now()
FROM tbl_campus_areas
ON CONFLICT (campus_facility_id) DO NOTHING;

INSERT INTO tbl_campus_storages (campus_storage_id, campus_storage_name, campus_facility_id, latitude, longitude,
                                 height, footprint_json, photo_url, created_at, updated_at)
SELECT id, name, campus_area_id, latitude, longitude, height, footprint_json, photo_url, now(), now()
FROM tbl_storage
ON CONFLICT (campus_storage_id) DO NOTHING;

INSERT INTO tbl_campus_venues (campus_venue_id, campus_venue_name, campus_facility_id, latitude, longitude,
                               height, footprint_json, photo_url, created_at, updated_at)
SELECT id, name, campus_area_id, latitude, longitude, height, footprint_json, photo_url, now(), now()
FROM tbl_venues
ON CONFLICT (campus_venue_id) DO NOTHING;

-- Explicit ids don't advance the identity counters. Without this, the next
-- row added from the app would try id 1 again and fail as a duplicate.
SELECT setval(pg_get_serial_sequence('tbl_campus_branches', 'campus_branch_id'),
              GREATEST((SELECT max(campus_branch_id) FROM tbl_campus_branches), 1));
SELECT setval(pg_get_serial_sequence('tbl_campus_facilities', 'campus_facility_id'),
              GREATEST((SELECT max(campus_facility_id) FROM tbl_campus_facilities), 1));
SELECT setval(pg_get_serial_sequence('tbl_campus_storages', 'campus_storage_id'),
              GREATEST((SELECT max(campus_storage_id) FROM tbl_campus_storages), 1));
SELECT setval(pg_get_serial_sequence('tbl_campus_venues', 'campus_venue_id'),
              GREATEST((SELECT max(campus_venue_id) FROM tbl_campus_venues), 1));

COMMIT;
