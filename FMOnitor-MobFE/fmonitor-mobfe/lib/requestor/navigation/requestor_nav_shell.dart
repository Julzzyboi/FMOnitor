import 'package:flutter/material.dart';
import 'package:fmonitor/common/navigation/app_topbar.dart';
import 'package:fmonitor/hauler/pages/calendar/calendar_page.dart';
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
    // There's no requestor-specific login page yet. The only way in right
    // now is the hauler Login page's "Preview Requestor App" shortcut,
    // which pushes this shell - so popping (when possible) genuinely logs
    // back out to that screen. Launched standalone (no route to pop to,
    // e.g. via `-t lib/main_requestor.dart`), this is a no-op since there's
    // nowhere to return to yet.
    if (Navigator.of(context).canPop()) {
      Navigator.of(context).pop();
    }
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
