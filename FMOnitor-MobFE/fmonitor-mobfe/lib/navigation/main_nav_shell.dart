import 'package:flutter/material.dart';
import '../pages/calendar/calendar_page.dart';
import '../pages/history/history_page.dart';
import '../pages/home/home_page.dart';
import '../pages/inventory/inventory_page.dart';
import '../pages/login/login_page.dart';
import '../pages/qr_scan/qr_scan_page.dart';
import 'app_topbar.dart';
import 'bottom_nav_bar.dart';

/// Hosts the persistent topbar + bottom nav and swaps between the five
/// destinations. Pages are kept in an IndexedStack so each one keeps its
/// own state (and only runs its loading skeleton once) as you switch tabs.
class MainNavShell extends StatefulWidget {
  const MainNavShell({super.key});

  @override
  State<MainNavShell> createState() => _MainNavShellState();
}

class _MainNavShellState extends State<MainNavShell> {
  int _index = 0;

  static const _titles = ['Home', 'Calendar', 'QR Scan', 'Inventory', 'History'];

  static const _pages = [
    HomePage(),
    CalendarPage(),
    QrScanPage(),
    InventoryPage(),
    HistoryPage(),
  ];

  void _selectTab(int index) => setState(() => _index = index);

  void _logout() {
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => const LoginPage()),
      (route) => false,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      extendBody: true,
      appBar: AppTopBar(title: _titles[_index], onLogout: _logout),
      body: IndexedStack(index: _index, children: _pages),
      bottomNavigationBar: AppBottomNavBar(currentIndex: _index, onSelect: _selectTab),
    );
  }
}
