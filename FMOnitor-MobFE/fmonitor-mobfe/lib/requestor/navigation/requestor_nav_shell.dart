import 'package:flutter/material.dart';
import 'package:fmonitor/common/navigation/app_topbar.dart';
import 'package:fmonitor/hauler/pages/calendar/calendar_page.dart';
import 'package:fmonitor/hauler/pages/login/login_page.dart';
import '../pages/history/requestor_history_page.dart';
import '../pages/home/requestor_home_page.dart';
import '../pages/track/requestor_track_page.dart';
import 'requestor_bottom_nav.dart';

/// Hosts the persistent topbar + bottom nav for the requestor role and
/// swaps between its four destinations. Calendar is the exact same page
/// the hauler app uses - not a copy - since the test plan calls for
/// identical calendar behavior across both roles.
class RequestorNavShell extends StatefulWidget {
  const RequestorNavShell({super.key});

  @override
  State<RequestorNavShell> createState() => _RequestorNavShellState();
}

class _RequestorNavShellState extends State<RequestorNavShell> {
  int _index = 0;

  static const _titles = ['Home', 'Calendar', 'Track', 'History'];

  static const _pages = [
    RequestorHomePage(),
    CalendarPage(),
    RequestorTrackPage(),
    RequestorHistoryPage(),
  ];

  void _selectTab(int index) => setState(() => _index = index);

  void _logout() {
    // Mirrors HaulerNavShell's own logout exactly - the real login flow
    // (lib/main.dart's LoginPage) reaches this shell via pushReplacement, so
    // there's nothing to pop back to; a plain pop (this shell's old
    // behavior, from when the only way in was a dev preview push) was a
    // silent no-op once this became a real production destination.
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
      bottomNavigationBar: RequestorBottomNav(currentIndex: _index, onSelect: _selectTab),
    );
  }
}
