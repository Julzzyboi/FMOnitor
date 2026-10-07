export const BORROWABLE_STORAGE_AREAS = [
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

export const NON_BORROWABLE_STORAGE_AREAS = [
  'FMO Welding Area Ground Floor',
  'FMO 3rd Floor (Carpentry & Masonry)',
  'Plumbing Section Area Central Lab',
  'FMO Painting Area 3rd Floor',
]

export const STORAGE_AREAS = [...BORROWABLE_STORAGE_AREAS, ...NON_BORROWABLE_STORAGE_AREAS]

export const CONDITIONS = ['Good', 'Fair', 'Poor', 'Damaged']
export const AVAILABILITY_OPTIONS = ['Borrowable', 'Non-Borrowable']

function photoPath(filename) {
  return encodeURI(`/images/${filename}`)
}

let nextId = 1
function item(location, name, available, notWorking = 0, photo = null, availability = 'Borrowable') {
  return {
    id: nextId++,
    location,
    name,
    available,
    notWorking,
    condition: available === 0 && notWorking > 0 ? 'Damaged' : 'Good',
    availability,
    photoUrl: photo ? photoPath(photo) : '',
  }
}

function tool(location, name, available, notWorking = 0) {
  return item(location, name, available, notWorking, null, 'Non-Borrowable')
}

const WELDING = 'FMO Welding Area Ground Floor'
const CARPENTRY = 'FMO 3rd Floor (Carpentry & Masonry)'
const PLUMBING = 'Plumbing Section Area Central Lab'
const PAINTING = 'FMO Painting Area 3rd Floor'

export const INITIAL_EQUIPMENT = [
  item('Qpav Mezzanine', 'Stanchions', 35, 0, 'Stanchions.jpg'),
  item('Qpav Mezzanine', 'Sign Stand', 42, 0, 'Sign Stand.jpg'),
  item('Qpav Mezzanine', 'Carpets', 12, 0, 'Carpets.jpg'),
  item('Qpav Mezzanine', 'Podium (Wooden)', 15, 0, 'Podium (wooden).jpg'),
  item('Qpav Mezzanine', 'Artificial Plants', 15),
  item('Qpav Mezzanine', 'VIP Chairs', 18, 0, 'VIP Chairs.jpg'),
  item('Qpav Mezzanine', 'Stackable Chairs (Black)', 500),

  item('Qpav', 'Backdrop 8x12', 10, 0, 'Backdrop.jpg'),
  item('Qpav', 'Backdrop 12x12', 10, 0, 'Backdrop.jpg'),
  item('Qpav', 'Lifetime Chairs', 700, 0, 'Lifetime Chairs.jpg'),
  item('Qpav', 'Flagpole/Stand', 26, 0, 'Flagpole_Stand.jpg'),

  item('Practice Gym', 'Platforms 4x8', 50, 0, 'Platforms.jpg'),
  item('Practice Gym', 'Platforms 4x4', 5, 0, 'Platforms.jpg'),
  item('Practice Gym', 'Wooden Stairs', 6, 0, 'Wooden Stairs.jpg'),

  item('Grandstand', 'Trussed Tent', 1, 0, 'Trussed Tent.jpg'),
  item('Grandstand', 'Scaffolding (5ft)', 169, 0, 'Scaffolding 5FT.jpg'),
  item('Grandstand', 'Scaffolding (3ft)', 193, 0, 'Scaffolding 3FT.jpg'),
  item('Grandstand', 'Torch', 50, 0, 'Torch.jpg'),
  item('Grandstand', 'Lifetime Table', 90, 0, 'Lifetime Table.jpg'),

  item('Health Service Back Area', 'Tent Clothes (Small 12x12)', 26, 0, 'Small Tent.jpg'),
  item('Health Service Back Area', 'Tent Clothes (Medium 12x24)', 12, 0, 'Medium Tent.jpg'),
  item('Health Service Back Area', 'Tent Clothes (Large 24x24)', 10, 0, 'Large Tent.jpg'),

  item('St. Raymund Back Area', 'Railings', 236, 0, 'Railings.jpg'),
  item('St. Raymund Back Area', 'Monoblock Chairs', 876, 0, 'Monoblock Chairs.jpg'),
  item('St. Raymund Back Area', 'Tarp Stand', 15, 0, 'Tarp Stand.jpg'),
  item('St. Raymund Back Area', 'Platform 4x8', 50, 0, 'Platforms.jpg'),
  item('St. Raymund Back Area', 'Platform 4x4', 10, 0, 'Platforms.jpg'),

  item('2 Wing Van', 'Tent Frame (Small 12x12)', 26, 0, 'Small Tent.jpg'),
  item('2 Wing Van', 'Tent Frame (Medium 12x24)', 12, 0, 'Medium Tent.jpg'),
  item('2 Wing Van', 'Tent Frame (Large 24x24)', 10, 0, 'Large Tent.jpg'),
  item('2 Wing Van', 'Wooden Long Table', 60),

  item('Motorpool', 'Panel Board (Horizontal)', 40, 0, 'Panel Board.jpg'),
  item('Motorpool', 'Panel Board (Vertical)', 30, 0, 'Panel Board.jpg'),
  item('Motorpool', 'Iwata Aircooler', 19, 0, 'Iwata Aircooler.jpg'),
  item('Motorpool', 'Industrial Fan', 10),

  item('FMO Office Garage', 'Service Truck', 3, 0, 'Service Truck 1.jpg'),
  item('FMO Office Garage', 'Man Lift', 1, 0, 'Man Lift 1.jpg'),
  item('FMO Office Garage', 'L200', 1, 0, 'L200.jpg'),
  item('FMO Office Garage', 'NWOW Ebike', 1),
  item('FMO Office Garage', 'Toyota HiLux', 1, 0, 'Toyota HiLux.jpg'),

  item('TYK Back Parking Area', 'Wing Van', 2, 0, 'Wing Van 1.jpg'),
  item('TYK Back Parking Area', 'Vacuum Truck', 1, 0, 'Vacuum Truck.jpg'),
  item('TYK Back Parking Area', 'Military Truck', 1, 0, 'Military Truck.jpg'),
  item('TYK Back Parking Area', 'Man Lift', 1, 0, 'Man Lift 2.jpg'),

  item('Frassati 22nd Floor', 'Monoblock Chair (White)', 300, 0, 'Monoblock Chairs.jpg'),
  item('Frassati 22nd Floor', 'Lifetime Table', 15, 0, 'Lifetime Table.jpg'),
  item('Frassati 22nd Floor', 'Photowall 12x12', 1),
  item('Frassati 22nd Floor', 'Photowall 8x12', 1),
  item('Frassati 22nd Floor', 'Platform', 10, 0, 'Platform.jpg'),
  item('Frassati 22nd Floor', 'Panel Board Horizontal', 10, 0, 'Panel Board.jpg'),

  item('Bgpop Ground Floor', 'Podium (Acrylic)', 4, 0, 'Acrylic Podium.jpg'),
  item('Bgpop Ground Floor', 'Lifetime Table (2x6)', 46, 0, 'Lifetime Table.jpg'),
  item('Bgpop Ground Floor', 'Photowall 12x12', 3),
  item('Bgpop Ground Floor', 'Photowall 8x12', 1),

  item('Con Van #3', 'Water Dispenser', 14, 0, 'Water Dispenser.jpg'),

  tool(WELDING, 'Welding Machine', 6, 2),
  tool(WELDING, 'Grinder', 4),
  tool(WELDING, 'Drilling Machine', 4),
  tool(WELDING, 'Drill Press', 1),
  tool(WELDING, 'Cut Off Wheel Machine', 2),
  tool(WELDING, 'Air Compressor', 2),
  tool(WELDING, 'Electric Bender Machine', 1),
  tool(WELDING, 'Plasma Cutter', 1, 1),
  tool(WELDING, 'Spot Weld Machine', 1),
  tool(WELDING, 'Socket Wrench (Set)', 1),
  tool(WELDING, 'Combination Wrench (Set)', 1),
  tool(WELDING, 'Vice Grip', 2),
  tool(WELDING, 'Steel Vice Grip', 1),
  tool(WELDING, 'Vice Clamp', 4),
  tool(WELDING, 'Tinsnip', 2),
  tool(WELDING, 'Riveter', 2),
  tool(WELDING, 'Hydraulic Pipe Bender', 0, 1),
  tool(WELDING, 'Auto Welding Mask', 1, 6),
  tool(WELDING, 'Bolt Cutter', 1),
  tool(WELDING, 'Acetylene (Set)', 1),
  tool(WELDING, 'Telescopic Ladder', 1),
  tool(WELDING, 'Desktop', 1),

  tool(CARPENTRY, 'Table Saw', 0, 2),
  tool(CARPENTRY, 'Band Saw Cut Off Machine', 0, 3),
  tool(CARPENTRY, 'Portable Jig Saw', 4),
  tool(CARPENTRY, 'Electric Jig Saw', 2),
  tool(CARPENTRY, 'Hilti Drill', 3),
  tool(CARPENTRY, 'Portable Circular Saw', 2),
  tool(CARPENTRY, 'Electric Vacuum', 2),
  tool(CARPENTRY, 'Key Duplicator', 2),
  tool(CARPENTRY, 'Ladder', 3),
  tool(CARPENTRY, 'Drill Press', 1),
  tool(CARPENTRY, 'Blower', 2),
  tool(CARPENTRY, 'Portable Grinder', 2),
  tool(CARPENTRY, 'Grinder', 2),
  tool(CARPENTRY, 'Big Jack Hammer', 2),
  tool(CARPENTRY, 'Small Jack Hammer', 1),
  tool(CARPENTRY, 'Diamond Cutter', 1),
  tool(CARPENTRY, 'Electric Blower', 1),
  tool(CARPENTRY, 'Flashlight', 2),
  tool(CARPENTRY, 'Desktop', 1),

  tool(PLUMBING, 'Stanley Rechargeable Drill', 1),
  tool(PLUMBING, 'Hilti Impact Drill', 1, 1),
  tool(PLUMBING, 'Hilti Hammer Drill', 1),
  tool(PLUMBING, 'K150 Ridgid De-clogging Machine', 1),
  tool(PLUMBING, 'K50 Ridgid De-clogging Machine', 1, 1),
  tool(PLUMBING, 'K100 Ridgid De-clogging Machine', 0, 1),
  tool(PLUMBING, 'Hilti Electric Drill', 0, 1),
  tool(PLUMBING, 'Hakata Water Pump (Gasoline)', 1),
  tool(PLUMBING, 'Submersible Pump 3hp', 3),
  tool(PLUMBING, 'Submersible Pump 1hp', 1),
  tool(PLUMBING, 'K45 Ridgid De-clogging Machine', 1),
  tool(PLUMBING, 'Dobim Water Pump (Gasoline)', 1),

  tool(PAINTING, 'Vespa Compressor', 3, 1),
  tool(PAINTING, 'Thermo Plastic Machine', 1),
  tool(PAINTING, 'Airless Spray Gun Machine', 1),
  tool(PAINTING, 'Thermo Plastic Paint Removal Machine', 1),
  tool(PAINTING, 'Spray It Gravity Spray Gun', 0, 3),
  tool(PAINTING, 'Hilti Angle Grinder', 0, 1),
  tool(PAINTING, 'Makita Sander', 0, 1),
  tool(PAINTING, 'Makita Blower w/ Charger', 1),
  tool(PAINTING, '11kg Gasul Tank', 4),
  tool(PAINTING, 'Desktop', 1),
]
