import 'inventory_item.dart';

const String _imgDir = 'assets/images/inventory';

/// The full equipment inventory, transcribed from the FMO "Borrowable"
/// equipment inventory sheet. Every entry here is borrowable - that sheet
/// doesn't cover non-borrowable equipment yet, so the non-borrowable filter
/// simply has nothing to show until that list exists.
const List<InventoryItem> kInventoryItems = [
  // Qpav Mezzanine
  InventoryItem(
    id: 'qpav-mezzanine-stanchions',
    name: 'Stanchions',
    quantity: 35,
    location: 'Qpav Mezzanine',
    borrowable: true,
    imageAsset: '$_imgDir/Stanchions.jpg',
  ),
  InventoryItem(
    id: 'qpav-mezzanine-sign-stand',
    name: 'Sign Stand',
    quantity: 42,
    location: 'Qpav Mezzanine',
    borrowable: true,
    imageAsset: '$_imgDir/Sign Stand.jpg',
  ),
  InventoryItem(
    id: 'qpav-mezzanine-carpets',
    name: 'Carpets',
    quantity: 12,
    location: 'Qpav Mezzanine',
    borrowable: true,
    imageAsset: '$_imgDir/Carpets.jpg',
  ),
  InventoryItem(
    id: 'qpav-mezzanine-podium-wooden',
    name: 'Podium (Wooden)',
    quantity: 15,
    location: 'Qpav Mezzanine',
    borrowable: true,
    imageAsset: '$_imgDir/Podium (wooden).jpg',
  ),
  InventoryItem(
    id: 'qpav-mezzanine-artificial-plants',
    name: 'Artificial Plants',
    quantity: 15,
    location: 'Qpav Mezzanine',
    borrowable: true,
  ),
  InventoryItem(
    id: 'qpav-mezzanine-vip-chairs',
    name: 'VIP Chairs',
    quantity: 18,
    location: 'Qpav Mezzanine',
    borrowable: true,
    imageAsset: '$_imgDir/VIP Chairs.jpg',
  ),
  InventoryItem(
    id: 'qpav-mezzanine-stackable-chairs-black',
    name: 'Stackable Chairs (Black)',
    quantity: 500,
    location: 'Qpav Mezzanine',
    borrowable: true,
  ),
  InventoryItem(
    id: 'qpav-mezzanine-panel-board-horizontal',
    name: 'Panel Board (Horizontal)',
    quantity: 40,
    location: 'Qpav Mezzanine',
    borrowable: true,
    imageAsset: '$_imgDir/Panel Board.jpg',
  ),
  InventoryItem(
    id: 'qpav-mezzanine-panel-board-vertical',
    name: 'Panel Board (Vertical)',
    quantity: 30,
    location: 'Qpav Mezzanine',
    borrowable: true,
    imageAsset: '$_imgDir/Panel Board.jpg',
  ),
  InventoryItem(
    id: 'qpav-mezzanine-iwata-aircooler',
    name: 'Iwata Aircooler',
    quantity: 19,
    location: 'Qpav Mezzanine',
    borrowable: true,
    imageAsset: '$_imgDir/Iwata Aircooler.jpg',
  ),
  InventoryItem(
    id: 'qpav-mezzanine-industrial-fan',
    name: 'Industrial Fan',
    quantity: 10,
    location: 'Qpav Mezzanine',
    borrowable: true,
  ),

  // Qpav
  InventoryItem(
    id: 'qpav-backdrop-8x12',
    name: 'Backdrop 8x12',
    quantity: 10,
    location: 'Qpav',
    borrowable: true,
    imageAsset: '$_imgDir/Backdrop.jpg',
  ),
  InventoryItem(
    id: 'qpav-backdrop-12x12',
    name: 'Backdrop 12x12',
    quantity: 10,
    location: 'Qpav',
    borrowable: true,
    imageAsset: '$_imgDir/Backdrop.jpg',
  ),
  InventoryItem(
    id: 'qpav-lifetime-chairs',
    name: 'Lifetime Chairs',
    quantity: 700,
    location: 'Qpav',
    borrowable: true,
    imageAsset: '$_imgDir/Lifetime Chairs.jpg',
  ),
  InventoryItem(
    id: 'qpav-flagpole-stand',
    name: 'Flagpole/Stand',
    quantity: 26,
    location: 'Qpav',
    borrowable: true,
    imageAsset: '$_imgDir/Flagpole_Stand.jpg',
  ),

  // Practice Gym
  InventoryItem(
    id: 'practice-gym-platforms-4x8',
    name: 'Platforms 4x8',
    quantity: 50,
    location: 'Practice Gym',
    borrowable: true,
    imageAsset: '$_imgDir/Platforms.jpg',
  ),
  InventoryItem(
    id: 'practice-gym-platforms-4x4',
    name: 'Platforms 4x4',
    quantity: 5,
    location: 'Practice Gym',
    borrowable: true,
    imageAsset: '$_imgDir/Platforms.jpg',
  ),
  InventoryItem(
    id: 'practice-gym-wooden-stairs',
    name: 'Wooden Stairs',
    quantity: 6,
    location: 'Practice Gym',
    borrowable: true,
    imageAsset: '$_imgDir/Wooden Stairs.jpg',
  ),

  // Grandstand
  InventoryItem(
    id: 'grandstand-trussed-tent',
    name: 'Trussed Tent',
    quantity: 1,
    location: 'Grandstand',
    borrowable: true,
    imageAsset: '$_imgDir/Trussed Tent.jpg',
  ),

  // Scaffolding
  InventoryItem(
    id: 'scaffolding-5ft',
    name: 'Scaffolding 5ft',
    quantity: 169,
    location: 'Scaffolding',
    borrowable: true,
    imageAsset: '$_imgDir/Scaffolding 5FT.jpg',
  ),
  InventoryItem(
    id: 'scaffolding-3ft',
    name: 'Scaffolding 3ft',
    quantity: 193,
    location: 'Scaffolding',
    borrowable: true,
    imageAsset: '$_imgDir/Scaffolding 3FT.jpg',
  ),
  InventoryItem(
    id: 'scaffolding-torch',
    name: 'Torch',
    quantity: 50,
    location: 'Scaffolding',
    borrowable: true,
    imageAsset: '$_imgDir/Torch.jpg',
  ),
  InventoryItem(
    id: 'scaffolding-lifetime-table',
    name: 'Lifetime Table',
    quantity: 90,
    location: 'Scaffolding',
    borrowable: true,
    imageAsset: '$_imgDir/Lifetime Table.jpg',
  ),

  // Health Service Back Area (Tent Clothes)
  InventoryItem(
    id: 'health-service-small-12x12',
    name: 'Tent Cloth - Small 12x12',
    quantity: 26,
    location: 'Health Service Back Area',
    borrowable: true,
  ),
  InventoryItem(
    id: 'health-service-medium-12x24',
    name: 'Tent Cloth - Medium 12x24',
    quantity: 12,
    location: 'Health Service Back Area',
    borrowable: true,
  ),
  InventoryItem(
    id: 'health-service-large-24x24',
    name: 'Tent Cloth - Large 24x24',
    quantity: 10,
    location: 'Health Service Back Area',
    borrowable: true,
  ),

  // St. Raymund Back Area
  InventoryItem(
    id: 'st-raymund-railings',
    name: 'Railings',
    quantity: 236,
    location: 'St. Raymund Back Area',
    borrowable: true,
    imageAsset: '$_imgDir/Railings.jpg',
  ),
  InventoryItem(
    id: 'st-raymund-monoblock-chairs',
    name: 'Monoblock Chairs',
    quantity: 876,
    location: 'St. Raymund Back Area',
    borrowable: true,
    imageAsset: '$_imgDir/Monoblock Chairs.jpg',
  ),
  InventoryItem(
    id: 'st-raymund-tarp-stand',
    name: 'Tarp Stand',
    quantity: 15,
    location: 'St. Raymund Back Area',
    borrowable: true,
    imageAsset: '$_imgDir/Tarp Stand.jpg',
  ),
  InventoryItem(
    id: 'st-raymund-platform-4x8',
    name: 'Platform 4x8',
    quantity: 50,
    location: 'St. Raymund Back Area',
    borrowable: true,
    imageAsset: '$_imgDir/Platforms.jpg',
  ),
  InventoryItem(
    id: 'st-raymund-platform-4x4',
    name: 'Platform 4x4',
    quantity: 10,
    location: 'St. Raymund Back Area',
    borrowable: true,
    imageAsset: '$_imgDir/Platforms.jpg',
  ),

  // 2 Wing Van (Tent Frame)
  InventoryItem(
    id: 'wing-van-small-12x12',
    name: 'Tent Frame - Small 12x12',
    quantity: 26,
    location: '2 Wing Van (Tent Frame)',
    borrowable: true,
  ),
  InventoryItem(
    id: 'wing-van-medium-12x24',
    name: 'Tent Frame - Medium 12x24',
    quantity: 12,
    location: '2 Wing Van (Tent Frame)',
    borrowable: true,
  ),
  InventoryItem(
    id: 'wing-van-large-24x24',
    name: 'Tent Frame - Large 24x24',
    quantity: 10,
    location: '2 Wing Van (Tent Frame)',
    borrowable: true,
  ),
  InventoryItem(
    id: 'wing-van-wooden-long-table',
    name: 'Wooden Long Table',
    quantity: 60,
    location: '2 Wing Van (Tent Frame)',
    borrowable: true,
  ),

  // Fmo Office Garage
  InventoryItem(
    id: 'fmo-garage-service-truck',
    name: 'Service Truck',
    quantity: 3,
    location: 'Fmo Office Garage',
    borrowable: true,
  ),
  InventoryItem(
    id: 'fmo-garage-man-lift',
    name: 'Man Lift',
    quantity: 1,
    location: 'Fmo Office Garage',
    borrowable: true,
  ),
  InventoryItem(
    id: 'fmo-garage-l200',
    name: 'L200',
    quantity: 1,
    location: 'Fmo Office Garage',
    borrowable: true,
  ),
  InventoryItem(
    id: 'fmo-garage-nwow-ebike',
    name: 'NWOW Ebike',
    quantity: 1,
    location: 'Fmo Office Garage',
    borrowable: true,
  ),
  InventoryItem(
    id: 'fmo-garage-toyota-hilux',
    name: 'Toyota HiLux',
    quantity: 1,
    location: 'Fmo Office Garage',
    borrowable: true,
  ),

  // TYK Back Parking Area
  InventoryItem(
    id: 'tyk-parking-wing-van',
    name: 'Wing Van',
    quantity: 2,
    location: 'TYK Back Parking Area',
    borrowable: true,
  ),
  InventoryItem(
    id: 'tyk-parking-vacuum-truck',
    name: 'Vacuum Truck',
    quantity: 1,
    location: 'TYK Back Parking Area',
    borrowable: true,
  ),
  InventoryItem(
    id: 'tyk-parking-military-truck',
    name: 'Military Truck',
    quantity: 1,
    location: 'TYK Back Parking Area',
    borrowable: true,
  ),
  InventoryItem(
    id: 'tyk-parking-man-lift',
    name: 'Man Lift',
    quantity: 1,
    location: 'TYK Back Parking Area',
    borrowable: true,
  ),

  // Frassati 22nd Floor
  InventoryItem(
    id: 'frassati-monoblock-chair-white',
    name: 'Monoblock Chair (White)',
    quantity: 300,
    location: 'Frassati 22nd Floor',
    borrowable: true,
    imageAsset: '$_imgDir/Monoblock Chairs.jpg',
  ),
  InventoryItem(
    id: 'frassati-lifetime-table',
    name: 'Lifetime Table',
    quantity: 15,
    location: 'Frassati 22nd Floor',
    borrowable: true,
    imageAsset: '$_imgDir/Lifetime Table.jpg',
  ),
  InventoryItem(
    id: 'frassati-photowall-12x12',
    name: 'Photowall 12x12',
    quantity: 1,
    location: 'Frassati 22nd Floor',
    borrowable: true,
  ),
  InventoryItem(
    id: 'frassati-photowall-8x12',
    name: 'Photowall 8x12',
    quantity: 1,
    location: 'Frassati 22nd Floor',
    borrowable: true,
  ),
  InventoryItem(
    id: 'frassati-platform',
    name: 'Platform',
    quantity: 10,
    location: 'Frassati 22nd Floor',
    borrowable: true,
    imageAsset: '$_imgDir/Platform.jpg',
  ),
  InventoryItem(
    id: 'frassati-panel-board-horizontal',
    name: 'Panel Board Horizontal',
    quantity: 10,
    location: 'Frassati 22nd Floor',
    borrowable: true,
    imageAsset: '$_imgDir/Panel Board.jpg',
  ),

  // Bgpop Ground Floor
  InventoryItem(
    id: 'bgpop-podium-acrylic',
    name: 'Podium (Acrylic)',
    quantity: 4,
    location: 'Bgpop Ground Floor',
    borrowable: true,
  ),
  InventoryItem(
    id: 'bgpop-lifetime-table-2x6',
    name: 'Lifetime Table (2x6)',
    quantity: 46,
    location: 'Bgpop Ground Floor',
    borrowable: true,
    imageAsset: '$_imgDir/Lifetime Table.jpg',
  ),
  InventoryItem(
    id: 'bgpop-photowall-12x12',
    name: 'Photowall 12x12',
    quantity: 3,
    location: 'Bgpop Ground Floor',
    borrowable: true,
  ),
  InventoryItem(
    id: 'bgpop-photowall-8x12',
    name: 'Photowall 8x12',
    quantity: 1,
    location: 'Bgpop Ground Floor',
    borrowable: true,
  ),

  // Con Van #3
  InventoryItem(
    id: 'con-van-3-water-dispenser',
    name: 'Water Dispenser',
    quantity: 14,
    location: 'Con Van #3',
    borrowable: true,
    imageAsset: '$_imgDir/Water Dispenser.jpg',
  ),
];

/// Every distinct storage area, in the order it first appears above.
List<String> get kStorageAreas {
  final seen = <String>{};
  final areas = <String>[];
  for (final item in kInventoryItems) {
    if (seen.add(item.location)) areas.add(item.location);
  }
  return areas;
}

/// How many equipment entries are filed under [location].
int itemCountForArea(String location) =>
    kInventoryItems.where((item) => item.location == location).length;
