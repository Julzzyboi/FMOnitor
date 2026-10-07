-- One-off seed: loads the equipment list that used to be hard-coded in the
-- web frontend into tbl_inventory_items. Run once, after the backend has
-- started at least once so Hibernate has created the table.
--
-- Each item is matched to a Campus Map storage by name (case-insensitive).
-- Storages are not created here: add them on the Campus Map first. Items whose
-- storage doesn't exist yet are skipped, and their storage names are listed
-- as a NOTICE so you can add them and run the seed again.
--
-- Refuses to run if the table already has rows, so it can't double the data.

BEGIN;

DO $$
BEGIN
    IF (SELECT count(*) FROM tbl_inventory_items) > 0 THEN
        RAISE EXCEPTION 'tbl_inventory_items already has rows - seed skipped';
    END IF;
END $$;

CREATE TEMP TABLE seed_inventory (
    item_name    TEXT,
    storage_name TEXT,
    available    INT,
    condition    TEXT,
    availability TEXT,
    photo_url    TEXT
) ON COMMIT DROP;

INSERT INTO seed_inventory VALUES
    ('Stanchions', 'Qpav Mezzanine', 35, 'Good', 'Borrowable', '/images/Stanchions.jpg'),
    ('Sign Stand', 'Qpav Mezzanine', 42, 'Good', 'Borrowable', '/images/Sign%20Stand.jpg'),
    ('Carpets', 'Qpav Mezzanine', 12, 'Good', 'Borrowable', '/images/Carpets.jpg'),
    ('Podium (Wooden)', 'Qpav Mezzanine', 15, 'Good', 'Borrowable', '/images/Podium%20(wooden).jpg'),
    ('Artificial Plants', 'Qpav Mezzanine', 15, 'Good', 'Borrowable', NULL),
    ('VIP Chairs', 'Qpav Mezzanine', 18, 'Good', 'Borrowable', '/images/VIP%20Chairs.jpg'),
    ('Stackable Chairs (Black)', 'Qpav Mezzanine', 500, 'Good', 'Borrowable', NULL),
    ('Backdrop 8x12', 'Qpav', 10, 'Good', 'Borrowable', '/images/Backdrop.jpg'),
    ('Backdrop 12x12', 'Qpav', 10, 'Good', 'Borrowable', '/images/Backdrop.jpg'),
    ('Lifetime Chairs', 'Qpav', 700, 'Good', 'Borrowable', '/images/Lifetime%20Chairs.jpg'),
    ('Flagpole/Stand', 'Qpav', 26, 'Good', 'Borrowable', '/images/Flagpole_Stand.jpg'),
    ('Platforms 4x8', 'Practice Gym', 50, 'Good', 'Borrowable', '/images/Platforms.jpg'),
    ('Platforms 4x4', 'Practice Gym', 5, 'Good', 'Borrowable', '/images/Platforms.jpg'),
    ('Wooden Stairs', 'Practice Gym', 6, 'Good', 'Borrowable', '/images/Wooden%20Stairs.jpg'),
    ('Trussed Tent', 'Grandstand', 1, 'Good', 'Borrowable', '/images/Trussed%20Tent.jpg'),
    ('Scaffolding (5ft)', 'Grandstand', 169, 'Good', 'Borrowable', '/images/Scaffolding%205FT.jpg'),
    ('Scaffolding (3ft)', 'Grandstand', 193, 'Good', 'Borrowable', '/images/Scaffolding%203FT.jpg'),
    ('Torch', 'Grandstand', 50, 'Good', 'Borrowable', '/images/Torch.jpg'),
    ('Lifetime Table', 'Grandstand', 90, 'Good', 'Borrowable', '/images/Lifetime%20Table.jpg'),
    ('Tent Clothes (Small 12x12)', 'Health Service Back Area', 26, 'Good', 'Borrowable', '/images/Small%20Tent.jpg'),
    ('Tent Clothes (Medium 12x24)', 'Health Service Back Area', 12, 'Good', 'Borrowable', '/images/Medium%20Tent.jpg'),
    ('Tent Clothes (Large 24x24)', 'Health Service Back Area', 10, 'Good', 'Borrowable', '/images/Large%20Tent.jpg'),
    ('Railings', 'St. Raymund Back Area', 236, 'Good', 'Borrowable', '/images/Railings.jpg'),
    ('Monoblock Chairs', 'St. Raymund Back Area', 876, 'Good', 'Borrowable', '/images/Monoblock%20Chairs.jpg'),
    ('Tarp Stand', 'St. Raymund Back Area', 15, 'Good', 'Borrowable', '/images/Tarp%20Stand.jpg'),
    ('Platform 4x8', 'St. Raymund Back Area', 50, 'Good', 'Borrowable', '/images/Platforms.jpg'),
    ('Platform 4x4', 'St. Raymund Back Area', 10, 'Good', 'Borrowable', '/images/Platforms.jpg'),
    ('Tent Frame (Small 12x12)', '2 Wing Van', 26, 'Good', 'Borrowable', '/images/Small%20Tent.jpg'),
    ('Tent Frame (Medium 12x24)', '2 Wing Van', 12, 'Good', 'Borrowable', '/images/Medium%20Tent.jpg'),
    ('Tent Frame (Large 24x24)', '2 Wing Van', 10, 'Good', 'Borrowable', '/images/Large%20Tent.jpg'),
    ('Wooden Long Table', '2 Wing Van', 60, 'Good', 'Borrowable', NULL),
    ('Panel Board (Horizontal)', 'Motorpool', 40, 'Good', 'Borrowable', '/images/Panel%20Board.jpg'),
    ('Panel Board (Vertical)', 'Motorpool', 30, 'Good', 'Borrowable', '/images/Panel%20Board.jpg'),
    ('Iwata Aircooler', 'Motorpool', 19, 'Good', 'Borrowable', '/images/Iwata%20Aircooler.jpg'),
    ('Industrial Fan', 'Motorpool', 10, 'Good', 'Borrowable', NULL),
    ('Service Truck', 'FMO Office Garage', 3, 'Good', 'Borrowable', '/images/Service%20Truck%201.jpg'),
    ('Man Lift', 'FMO Office Garage', 1, 'Good', 'Borrowable', '/images/Man%20Lift%201.jpg'),
    ('L200', 'FMO Office Garage', 1, 'Good', 'Borrowable', '/images/L200.jpg'),
    ('NWOW Ebike', 'FMO Office Garage', 1, 'Good', 'Borrowable', NULL),
    ('Toyota HiLux', 'FMO Office Garage', 1, 'Good', 'Borrowable', '/images/Toyota%20HiLux.jpg'),
    ('Wing Van', 'TYK Back Parking Area', 2, 'Good', 'Borrowable', '/images/Wing%20Van%201.jpg'),
    ('Vacuum Truck', 'TYK Back Parking Area', 1, 'Good', 'Borrowable', '/images/Vacuum%20Truck.jpg'),
    ('Military Truck', 'TYK Back Parking Area', 1, 'Good', 'Borrowable', '/images/Military%20Truck.jpg'),
    ('Man Lift', 'TYK Back Parking Area', 1, 'Good', 'Borrowable', '/images/Man%20Lift%202.jpg'),
    ('Monoblock Chair (White)', 'Frassati 22nd Floor', 300, 'Good', 'Borrowable', '/images/Monoblock%20Chairs.jpg'),
    ('Lifetime Table', 'Frassati 22nd Floor', 15, 'Good', 'Borrowable', '/images/Lifetime%20Table.jpg'),
    ('Photowall 12x12', 'Frassati 22nd Floor', 1, 'Good', 'Borrowable', NULL),
    ('Photowall 8x12', 'Frassati 22nd Floor', 1, 'Good', 'Borrowable', NULL),
    ('Platform', 'Frassati 22nd Floor', 10, 'Good', 'Borrowable', '/images/Platform.jpg'),
    ('Panel Board Horizontal', 'Frassati 22nd Floor', 10, 'Good', 'Borrowable', '/images/Panel%20Board.jpg'),
    ('Podium (Acrylic)', 'Bgpop Ground Floor', 4, 'Good', 'Borrowable', '/images/Acrylic%20Podium.jpg'),
    ('Lifetime Table (2x6)', 'Bgpop Ground Floor', 46, 'Good', 'Borrowable', '/images/Lifetime%20Table.jpg'),
    ('Photowall 12x12', 'Bgpop Ground Floor', 3, 'Good', 'Borrowable', NULL),
    ('Photowall 8x12', 'Bgpop Ground Floor', 1, 'Good', 'Borrowable', NULL),
    ('Water Dispenser', 'Con Van #3', 14, 'Good', 'Borrowable', '/images/Water%20Dispenser.jpg'),
    ('Welding Machine', 'FMO Welding Area Ground Floor', 6, 'Good', 'Non-Borrowable', NULL),
    ('Grinder', 'FMO Welding Area Ground Floor', 4, 'Good', 'Non-Borrowable', NULL),
    ('Drilling Machine', 'FMO Welding Area Ground Floor', 4, 'Good', 'Non-Borrowable', NULL),
    ('Drill Press', 'FMO Welding Area Ground Floor', 1, 'Good', 'Non-Borrowable', NULL),
    ('Cut Off Wheel Machine', 'FMO Welding Area Ground Floor', 2, 'Good', 'Non-Borrowable', NULL),
    ('Air Compressor', 'FMO Welding Area Ground Floor', 2, 'Good', 'Non-Borrowable', NULL),
    ('Electric Bender Machine', 'FMO Welding Area Ground Floor', 1, 'Good', 'Non-Borrowable', NULL),
    ('Plasma Cutter', 'FMO Welding Area Ground Floor', 1, 'Good', 'Non-Borrowable', NULL),
    ('Spot Weld Machine', 'FMO Welding Area Ground Floor', 1, 'Good', 'Non-Borrowable', NULL),
    ('Socket Wrench (Set)', 'FMO Welding Area Ground Floor', 1, 'Good', 'Non-Borrowable', NULL),
    ('Combination Wrench (Set)', 'FMO Welding Area Ground Floor', 1, 'Good', 'Non-Borrowable', NULL),
    ('Vice Grip', 'FMO Welding Area Ground Floor', 2, 'Good', 'Non-Borrowable', NULL),
    ('Steel Vice Grip', 'FMO Welding Area Ground Floor', 1, 'Good', 'Non-Borrowable', NULL),
    ('Vice Clamp', 'FMO Welding Area Ground Floor', 4, 'Good', 'Non-Borrowable', NULL),
    ('Tinsnip', 'FMO Welding Area Ground Floor', 2, 'Good', 'Non-Borrowable', NULL),
    ('Riveter', 'FMO Welding Area Ground Floor', 2, 'Good', 'Non-Borrowable', NULL),
    ('Hydraulic Pipe Bender', 'FMO Welding Area Ground Floor', 0, 'Damaged', 'Non-Borrowable', NULL),
    ('Auto Welding Mask', 'FMO Welding Area Ground Floor', 1, 'Good', 'Non-Borrowable', NULL),
    ('Bolt Cutter', 'FMO Welding Area Ground Floor', 1, 'Good', 'Non-Borrowable', NULL),
    ('Acetylene (Set)', 'FMO Welding Area Ground Floor', 1, 'Good', 'Non-Borrowable', NULL),
    ('Telescopic Ladder', 'FMO Welding Area Ground Floor', 1, 'Good', 'Non-Borrowable', NULL),
    ('Desktop', 'FMO Welding Area Ground Floor', 1, 'Good', 'Non-Borrowable', NULL),
    ('Table Saw', 'FMO 3rd Floor (Carpentry & Masonry)', 0, 'Damaged', 'Non-Borrowable', NULL),
    ('Band Saw Cut Off Machine', 'FMO 3rd Floor (Carpentry & Masonry)', 0, 'Damaged', 'Non-Borrowable', NULL),
    ('Portable Jig Saw', 'FMO 3rd Floor (Carpentry & Masonry)', 4, 'Good', 'Non-Borrowable', NULL),
    ('Electric Jig Saw', 'FMO 3rd Floor (Carpentry & Masonry)', 2, 'Good', 'Non-Borrowable', NULL),
    ('Hilti Drill', 'FMO 3rd Floor (Carpentry & Masonry)', 3, 'Good', 'Non-Borrowable', NULL),
    ('Portable Circular Saw', 'FMO 3rd Floor (Carpentry & Masonry)', 2, 'Good', 'Non-Borrowable', NULL),
    ('Electric Vacuum', 'FMO 3rd Floor (Carpentry & Masonry)', 2, 'Good', 'Non-Borrowable', NULL),
    ('Key Duplicator', 'FMO 3rd Floor (Carpentry & Masonry)', 2, 'Good', 'Non-Borrowable', NULL),
    ('Ladder', 'FMO 3rd Floor (Carpentry & Masonry)', 3, 'Good', 'Non-Borrowable', NULL),
    ('Drill Press', 'FMO 3rd Floor (Carpentry & Masonry)', 1, 'Good', 'Non-Borrowable', NULL),
    ('Blower', 'FMO 3rd Floor (Carpentry & Masonry)', 2, 'Good', 'Non-Borrowable', NULL),
    ('Portable Grinder', 'FMO 3rd Floor (Carpentry & Masonry)', 2, 'Good', 'Non-Borrowable', NULL),
    ('Grinder', 'FMO 3rd Floor (Carpentry & Masonry)', 2, 'Good', 'Non-Borrowable', NULL),
    ('Big Jack Hammer', 'FMO 3rd Floor (Carpentry & Masonry)', 2, 'Good', 'Non-Borrowable', NULL),
    ('Small Jack Hammer', 'FMO 3rd Floor (Carpentry & Masonry)', 1, 'Good', 'Non-Borrowable', NULL),
    ('Diamond Cutter', 'FMO 3rd Floor (Carpentry & Masonry)', 1, 'Good', 'Non-Borrowable', NULL),
    ('Electric Blower', 'FMO 3rd Floor (Carpentry & Masonry)', 1, 'Good', 'Non-Borrowable', NULL),
    ('Flashlight', 'FMO 3rd Floor (Carpentry & Masonry)', 2, 'Good', 'Non-Borrowable', NULL),
    ('Desktop', 'FMO 3rd Floor (Carpentry & Masonry)', 1, 'Good', 'Non-Borrowable', NULL),
    ('Stanley Rechargeable Drill', 'Plumbing Section Area Central Lab', 1, 'Good', 'Non-Borrowable', NULL),
    ('Hilti Impact Drill', 'Plumbing Section Area Central Lab', 1, 'Good', 'Non-Borrowable', NULL),
    ('Hilti Hammer Drill', 'Plumbing Section Area Central Lab', 1, 'Good', 'Non-Borrowable', NULL),
    ('K150 Ridgid De-clogging Machine', 'Plumbing Section Area Central Lab', 1, 'Good', 'Non-Borrowable', NULL),
    ('K50 Ridgid De-clogging Machine', 'Plumbing Section Area Central Lab', 1, 'Good', 'Non-Borrowable', NULL),
    ('K100 Ridgid De-clogging Machine', 'Plumbing Section Area Central Lab', 0, 'Damaged', 'Non-Borrowable', NULL),
    ('Hilti Electric Drill', 'Plumbing Section Area Central Lab', 0, 'Damaged', 'Non-Borrowable', NULL),
    ('Hakata Water Pump (Gasoline)', 'Plumbing Section Area Central Lab', 1, 'Good', 'Non-Borrowable', NULL),
    ('Submersible Pump 3hp', 'Plumbing Section Area Central Lab', 3, 'Good', 'Non-Borrowable', NULL),
    ('Submersible Pump 1hp', 'Plumbing Section Area Central Lab', 1, 'Good', 'Non-Borrowable', NULL),
    ('K45 Ridgid De-clogging Machine', 'Plumbing Section Area Central Lab', 1, 'Good', 'Non-Borrowable', NULL),
    ('Dobim Water Pump (Gasoline)', 'Plumbing Section Area Central Lab', 1, 'Good', 'Non-Borrowable', NULL),
    ('Vespa Compressor', 'FMO Painting Area 3rd Floor', 3, 'Good', 'Non-Borrowable', NULL),
    ('Thermo Plastic Machine', 'FMO Painting Area 3rd Floor', 1, 'Good', 'Non-Borrowable', NULL),
    ('Airless Spray Gun Machine', 'FMO Painting Area 3rd Floor', 1, 'Good', 'Non-Borrowable', NULL),
    ('Thermo Plastic Paint Removal Machine', 'FMO Painting Area 3rd Floor', 1, 'Good', 'Non-Borrowable', NULL),
    ('Spray It Gravity Spray Gun', 'FMO Painting Area 3rd Floor', 0, 'Damaged', 'Non-Borrowable', NULL),
    ('Hilti Angle Grinder', 'FMO Painting Area 3rd Floor', 0, 'Damaged', 'Non-Borrowable', NULL),
    ('Makita Sander', 'FMO Painting Area 3rd Floor', 0, 'Damaged', 'Non-Borrowable', NULL),
    ('Makita Blower w/ Charger', 'FMO Painting Area 3rd Floor', 1, 'Good', 'Non-Borrowable', NULL),
    ('11kg Gasul Tank', 'FMO Painting Area 3rd Floor', 4, 'Good', 'Non-Borrowable', NULL),
    ('Desktop', 'FMO Painting Area 3rd Floor', 1, 'Good', 'Non-Borrowable', NULL);

DO $$
DECLARE
    missing TEXT;
BEGIN
    SELECT string_agg(DISTINCT seed.storage_name, ', ') INTO missing
    FROM seed_inventory seed
    WHERE NOT EXISTS (
        SELECT 1 FROM tbl_campus_storages s
        WHERE lower(trim(s.campus_storage_name)) = lower(trim(seed.storage_name))
    );
    IF missing IS NOT NULL THEN
        RAISE NOTICE 'Skipped items - no Campus Map storage named: %', missing;
    END IF;
END $$;

-- min() picks one storage if two share a name.
INSERT INTO tbl_inventory_items
    (item_name, campus_storage_id, available_qty, item_condition, availability, photo_url, created_at, updated_at)
SELECT seed.item_name, match.storage_id, seed.available, seed.condition, seed.availability, seed.photo_url, now(), now()
FROM seed_inventory seed
CROSS JOIN LATERAL (
    SELECT min(s.campus_storage_id) AS storage_id
    FROM tbl_campus_storages s
    WHERE lower(trim(s.campus_storage_name)) = lower(trim(seed.storage_name))
) match
WHERE match.storage_id IS NOT NULL;

COMMIT;
