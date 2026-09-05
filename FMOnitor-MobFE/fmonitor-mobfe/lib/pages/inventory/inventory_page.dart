import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../data/inventory_data.dart';
import '../../data/inventory_item.dart';
import '../../navigation/bottom_nav_bar.dart';
import '../../theme/app_colors.dart';
import '../../widgets/common/blank_loading_page.dart';
import 'equipment_detail_page.dart';
import 'widgets/borrowable_filter.dart';
import 'widgets/borrowable_filter_sheet.dart';
import 'widgets/equipment_card.dart';
import 'widgets/inventory_search_bar.dart';
import 'widgets/storage_area_button.dart';
import 'widgets/storage_area_sheet.dart';

class InventoryPage extends StatelessWidget {
  const InventoryPage({super.key});

  @override
  Widget build(BuildContext context) => const BlankLoadingPage(child: _InventoryContent());
}

class _InventoryContent extends StatefulWidget {
  const _InventoryContent();

  @override
  State<_InventoryContent> createState() => _InventoryContentState();
}

class _InventoryContentState extends State<_InventoryContent> {
  final _searchController = TextEditingController();
  String _query = '';
  String? _selectedArea;
  BorrowableFilter _borrowableFilter = BorrowableFilter.all;

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  List<InventoryItem> get _filteredItems {
    final query = _query.trim().toLowerCase();
    return kInventoryItems.where((item) {
      if (_selectedArea != null && item.location != _selectedArea) return false;
      if (_borrowableFilter == BorrowableFilter.borrowable && !item.borrowable) return false;
      if (_borrowableFilter == BorrowableFilter.nonBorrowable && item.borrowable) return false;
      if (query.isEmpty) return true;
      return item.name.toLowerCase().contains(query) || item.location.toLowerCase().contains(query);
    }).toList();
  }

  void _openStorageAreaSheet() {
    showStorageAreaSheet(
      context: context,
      selected: _selectedArea,
      onSelect: (area) => setState(() => _selectedArea = area),
    );
  }

  void _openBorrowableFilterSheet() {
    showBorrowableFilterSheet(
      context: context,
      selected: _borrowableFilter,
      onSelect: (value) => setState(() => _borrowableFilter = value),
    );
  }

  void _openDetail(InventoryItem item) {
    // Slides up from the bottom, same as the Storage Areas / Filter sheets -
    // not the platform-default MaterialPageRoute transition (on Android
    // that's ZoomPageTransitionsBuilder, which visibly zooms the page in).
    Navigator.of(context).push(
      PageRouteBuilder(
        transitionDuration: const Duration(milliseconds: 280),
        reverseTransitionDuration: const Duration(milliseconds: 220),
        pageBuilder: (_, _, _) => EquipmentDetailPage(item: item),
        transitionsBuilder: (_, animation, _, child) {
          final curved = CurvedAnimation(parent: animation, curve: Curves.easeOutCubic, reverseCurve: Curves.easeInCubic);
          return SlideTransition(
            position: Tween<Offset>(begin: const Offset(0, 1), end: Offset.zero).animate(curved),
            child: child,
          );
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final items = _filteredItems;

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              InventorySearchBar(
                controller: _searchController,
                onChanged: (value) => setState(() => _query = value),
              ),
              const SizedBox(height: 12),
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: [
                    StorageAreaButton(
                      selectedArea: _selectedArea,
                      onTap: _openStorageAreaSheet,
                      onClear: () => setState(() => _selectedArea = null),
                    ),
                    const SizedBox(width: 8),
                    BorrowableFilterButton(
                      value: _borrowableFilter,
                      onTap: _openBorrowableFilterSheet,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),
              Row(
                children: [
                  Text(
                    'CURRENT STOCK REGISTRY',
                    style: GoogleFonts.montserrat(
                      fontSize: 11.5,
                      fontWeight: FontWeight.w700,
                      letterSpacing: 0.6,
                      color: AppColors.textMuted,
                    ),
                  ),
                  const Spacer(),
                  Text(
                    'Showing ${items.length} item${items.length == 1 ? '' : 's'}',
                    style: GoogleFonts.montserrat(fontSize: 11.5, color: AppColors.textMuted),
                  ),
                ],
              ),
            ],
          ),
        ),
        Expanded(
          child: items.isEmpty
              ? const _EmptyState()
              : ListView.separated(
                  padding: EdgeInsets.fromLTRB(20, 0, 20, AppBottomNavBar.reservedHeight(context) + 16),
                  itemCount: items.length,
                  separatorBuilder: (_, _) => const SizedBox(height: 12),
                  itemBuilder: (context, index) {
                    final item = items[index];
                    return EquipmentCard(item: item, onTap: () => _openDetail(item));
                  },
                ),
        ),
      ],
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.inventory_2_outlined, size: 40, color: AppColors.textMuted),
            const SizedBox(height: 12),
            Text(
              'No equipment found',
              style: GoogleFonts.montserrat(fontSize: 14, fontWeight: FontWeight.w700, color: AppColors.textDark),
            ),
            const SizedBox(height: 6),
            Text(
              'Try a different search term or filter.',
              textAlign: TextAlign.center,
              style: GoogleFonts.montserrat(fontSize: 12.5, color: AppColors.textMuted),
            ),
          ],
        ),
      ),
    );
  }
}
