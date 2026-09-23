// Transcribed directly from the physical "Event Inventory" count sheet -
// one section per storage area, each row an item + its available count.
// There's no backend inventory table/API yet (see index.jsx's top comment
// for why this lives here as frontend-only state instead of a real fetch),
// so this is the seed this page starts from.
//
// A few sheet rows are category headers with no count of their own,
// immediately followed by size-specific rows that DO carry one (Scaffolding
// -> 5ft/3ft; Tent Clothes/Tent Frame -> Small/Medium/Large 12x12/12x24/
// 24x24) - folded into each item's own name here (e.g. "Scaffolding (5ft)")
// rather than kept as a separate zero-count row, since a bare "5ft" or
// "Small 12x12" item name is meaningless once split out of that grouping.
//
// The sheet's "Not working" column was blank for every row, so notWorking
// is 0 across the board - a literal reading of the source, not a guess.
export const STORAGE_AREAS = [
  'Qpav Mezzanine',
  'Qpav',
  'Practice Gym',
  'Grandstand',
  'Health Service Back Area',
  'St. Raymund Back Area',
  '2 Wing Van',
  'Motorpool',
  'FMO Office Garage',
  'TYK Back Parking Area',
  'Frassati 22nd Floor',
  'Bgpop Ground Floor',
  'Con Van #3',
]

// Shown in the Filters sidebar's Condition/Availability sections - the sheet
// only ever tracked Available/Not Working counts, nothing per-item this
// granular, so every seeded row defaults to Good/Borrowable rather than a
// guessed-at real assessment. Real values can be set going forward through
// the Add/Edit modal.
export const CONDITIONS = ['Good', 'Fair', 'Poor', 'Damaged']
export const AVAILABILITY_OPTIONS = ['Borrowable', 'Non-Borrowable']

// Real photos, copied from the mobile app's own assets/images/inventory
// folder (public/images/inventory here - filenames kebab-cased from the
// originals). Only items with an actual matching photo there get one passed
// through `item()`'s `photo` arg below; everything else keeps photoUrl ''
// and falls back to the placeholder icon, same as before this existed.
function photoPath(filename) {
  return `/images/inventory/${filename}`
}

let nextId = 1
function item(location, name, available, notWorking = 0, photo = null) {
  return {
    id: nextId++,
    location,
    name,
    available,
    notWorking,
    condition: 'Good',
    availability: 'Borrowable',
    photoUrl: photo ? photoPath(photo) : '',
  }
}

export const INITIAL_EQUIPMENT = [
  item('Qpav Mezzanine', 'Stanchions', 35, 0, 'stanchions.jpg'),
  item('Qpav Mezzanine', 'Sign Stand', 42, 0, 'sign-stand.jpg'),
  item('Qpav Mezzanine', 'Carpets', 12, 0, 'carpets.jpg'),
  item('Qpav Mezzanine', 'Podium (Wooden)', 15, 0, 'podium-wooden.jpg'),
  item('Qpav Mezzanine', 'Artificial Plants', 15),
  item('Qpav Mezzanine', 'VIP Chairs', 18, 0, 'vip-chairs.jpg'),
  item('Qpav Mezzanine', 'Stackable Chairs (Black)', 500),

  item('Qpav', 'Backdrop 8x12', 10, 0, 'backdrop.jpg'),
  item('Qpav', 'Backdrop 12x12', 10, 0, 'backdrop.jpg'),
  item('Qpav', 'Lifetime Chairs', 700, 0, 'lifetime-chairs.jpg'),
  item('Qpav', 'Flagpole/Stand', 26, 0, 'flagpole-stand.jpg'),

  item('Practice Gym', 'Platforms 4x8', 50, 0, 'platforms.jpg'),
  item('Practice Gym', 'Platforms 4x4', 5, 0, 'platforms.jpg'),
  item('Practice Gym', 'Wooden Stairs', 6, 0, 'wooden-stairs.jpg'),

  item('Grandstand', 'Trussed Tent', 1, 0, 'trussed-tent.jpg'),
  item('Grandstand', 'Scaffolding (5ft)', 169, 0, 'scaffolding-5ft.jpg'),
  item('Grandstand', 'Scaffolding (3ft)', 193, 0, 'scaffolding-3ft.jpg'),
  item('Grandstand', 'Torch', 50, 0, 'torch.jpg'),
  item('Grandstand', 'Lifetime Table', 90, 0, 'lifetime-table.jpg'),

  item('Health Service Back Area', 'Tent Clothes (Small 12x12)', 26),
  item('Health Service Back Area', 'Tent Clothes (Medium 12x24)', 12),
  item('Health Service Back Area', 'Tent Clothes (Large 24x24)', 10),

  item('St. Raymund Back Area', 'Railings', 236, 0, 'railings.jpg'),
  item('St. Raymund Back Area', 'Monoblock Chairs', 876, 0, 'monoblock-chairs.jpg'),
  item('St. Raymund Back Area', 'Tarp Stand', 15, 0, 'tarp-stand.jpg'),
  item('St. Raymund Back Area', 'Platform 4x8', 50, 0, 'platforms.jpg'),
  item('St. Raymund Back Area', 'Platform 4x4', 10, 0, 'platforms.jpg'),

  item('2 Wing Van', 'Tent Frame (Small 12x12)', 26),
  item('2 Wing Van', 'Tent Frame (Medium 12x24)', 12),
  item('2 Wing Van', 'Tent Frame (Large 24x24)', 10),
  item('2 Wing Van', 'Wooden Long Table', 60),

  item('Motorpool', 'Panel Board (Horizontal)', 40, 0, 'panel-board.jpg'),
  item('Motorpool', 'Panel Board (Vertical)', 30, 0, 'panel-board.jpg'),
  item('Motorpool', 'Iwata Aircooler', 19, 0, 'iwata-aircooler.jpg'),
  item('Motorpool', 'Industrial Fan', 10),

  item('FMO Office Garage', 'Service Truck', 3),
  item('FMO Office Garage', 'Man Lift', 1),
  item('FMO Office Garage', 'L200', 1),
  item('FMO Office Garage', 'NWOW Ebike', 1),
  item('FMO Office Garage', 'Toyota HiLux', 1),

  item('TYK Back Parking Area', 'Wing Van', 2),
  item('TYK Back Parking Area', 'Vacuum Truck', 1),
  item('TYK Back Parking Area', 'Military Truck', 1),
  item('TYK Back Parking Area', 'Man Lift', 1),

  item('Frassati 22nd Floor', 'Monoblock Chair (White)', 300, 0, 'monoblock-chairs.jpg'),
  item('Frassati 22nd Floor', 'Lifetime Table', 15, 0, 'lifetime-table.jpg'),
  item('Frassati 22nd Floor', 'Photowall 12x12', 1),
  item('Frassati 22nd Floor', 'Photowall 8x12', 1),
  item('Frassati 22nd Floor', 'Platform', 10, 0, 'platform.jpg'),
  item('Frassati 22nd Floor', 'Panel Board Horizontal', 10, 0, 'panel-board.jpg'),

  item('Bgpop Ground Floor', 'Podium (Acrylic)', 4),
  item('Bgpop Ground Floor', 'Lifetime Table (2x6)', 46, 0, 'lifetime-table.jpg'),
  item('Bgpop Ground Floor', 'Photowall 12x12', 3),
  item('Bgpop Ground Floor', 'Photowall 8x12', 1),

  item('Con Van #3', 'Water Dispenser', 14, 0, 'water-dispenser.jpg'),
]
