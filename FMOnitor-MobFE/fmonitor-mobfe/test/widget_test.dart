// Basic smoke test for the login page.

import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:fmonitor/data/inventory_data.dart';
import 'package:fmonitor/main.dart';

const _fullMonthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/// These links live inside a RichText as TextSpans with a
/// TapGestureRecognizer, not as separate Text widgets - find.text() won't
/// match them directly, so this locates the span's actual rendered box and
/// taps through its center, exercising Flutter's real hit-testing rather
/// than calling the recognizer's callback directly.
Future<void> tapTextSpan(WidgetTester tester, String text) async {
  final richTextFinder = find.byWidgetPredicate(
    (widget) => widget is RichText && widget.text.toPlainText().contains(text),
  );
  expect(richTextFinder, findsOneWidget);

  final renderParagraph = tester.renderObject<RenderParagraph>(richTextFinder);
  final fullText = renderParagraph.text.toPlainText();
  final start = fullText.indexOf(text);
  final boxes = renderParagraph.getBoxesForSelection(
    TextSelection(baseOffset: start, extentOffset: start + text.length),
  );
  expect(boxes, isNotEmpty, reason: 'no rendered box found for "$text"');
  final box = boxes.first;
  final localCenter = Offset((box.left + box.right) / 2, (box.top + box.bottom) / 2);
  final globalPosition = renderParagraph.localToGlobal(localCenter);
  await tester.tapAt(globalPosition);
  await tester.pump();
}

void main() {
  testWidgets('Login page renders the core elements', (WidgetTester tester) async {
    await tester.pumpWidget(const FMonitorApp());
    await tester.pumpAndSettle();

    expect(find.text('FACILITIES MANAGEMENT OFFICE'), findsOneWidget);
    expect(find.text('Sign in with Google'), findsOneWidget);

    final termsText = tester
        .widgetList<RichText>(find.byType(RichText))
        .map((w) => w.text.toPlainText())
        .join(' ');
    expect(termsText, contains('Privacy Policy'));
  });

  testWidgets('Tapping Sign in with Google opens the Home tab', (WidgetTester tester) async {
    await tester.pumpWidget(const FMonitorApp());
    await tester.pumpAndSettle();

    await tester.tap(find.text('Sign in with Google'));
    await tester.pumpAndSettle();

    // Landed in the nav shell, on the Home tab - "Home" shows twice
    // (topbar title + the nav item's label), everything else once.
    expect(find.text('Home'), findsNWidgets(2));
    expect(find.text('Calendar'), findsOneWidget);
    expect(find.text('Inventory'), findsOneWidget);
    expect(find.text('History'), findsOneWidget);
    expect(find.byKey(const ValueKey('qr_fab')), findsOneWidget);
  });

  testWidgets('Bottom nav switches the topbar title between tabs', (WidgetTester tester) async {
    await tester.pumpWidget(const FMonitorApp());
    await tester.pumpAndSettle();
    await tester.tap(find.text('Sign in with Google'));
    await tester.pumpAndSettle();

    Text topbarTitle() => tester.widget<Text>(
          find.descendant(of: find.byKey(const Key('topbar_title')), matching: find.byType(Text)),
        );

    expect(topbarTitle().data, 'Home');

    await tester.tap(find.byKey(const ValueKey('nav_Calendar')));
    await tester.pumpAndSettle();
    expect(topbarTitle().data, 'Calendar');

    await tester.tap(find.byKey(const ValueKey('qr_fab')));
    await tester.pumpAndSettle();
    expect(topbarTitle().data, 'QR Scan');

    await tester.tap(find.byKey(const ValueKey('nav_Inventory')));
    await tester.pumpAndSettle();
    expect(topbarTitle().data, 'Inventory');

    await tester.tap(find.byKey(const ValueKey('nav_History')));
    await tester.pumpAndSettle();
    expect(topbarTitle().data, 'History');
  });

  testWidgets('Profile dropdown logout returns to the login page', (WidgetTester tester) async {
    await tester.pumpWidget(const FMonitorApp());
    await tester.pumpAndSettle();
    await tester.tap(find.text('Sign in with Google'));
    await tester.pumpAndSettle();

    await tester.tap(find.byKey(const ValueKey('profile_button')));
    await tester.pumpAndSettle();
    expect(find.text('Logout'), findsOneWidget);

    await tester.tap(find.text('Logout'));
    await tester.pumpAndSettle();

    expect(find.text('Sign in with Google'), findsOneWidget);
    expect(find.text('Home'), findsNothing);
  });

  testWidgets('QR Scan page shows the frame, flashlight toggle, and passcode button', (WidgetTester tester) async {
    await tester.pumpWidget(const FMonitorApp());
    await tester.pumpAndSettle();
    await tester.tap(find.text('Sign in with Google'));
    await tester.pumpAndSettle();

    await tester.tap(find.byKey(const ValueKey('qr_fab')));
    await tester.pumpAndSettle();

    expect(find.text('Scan QR Code'), findsOneWidget);
    expect(find.text('Flashlight'), findsOneWidget);
    expect(find.text('Request Passcode'), findsOneWidget);

    // Flashlight starts off, toggles on when tapped.
    expect(find.byIcon(Icons.flashlight_off_rounded), findsOneWidget);
    await tester.ensureVisible(find.text('Flashlight'));
    await tester.pump();
    await tester.tap(find.text('Flashlight'));
    await tester.pump();
    expect(find.byIcon(Icons.flashlight_on_rounded), findsOneWidget);

    // Request Passcode is currently inert - tapping it does nothing.
    await tester.ensureVisible(find.text('Request Passcode'));
    await tester.pump();
    await tester.tap(find.text('Request Passcode'));
    await tester.pump();
    expect(find.text('Scan QR Code'), findsOneWidget);
  });

  testWidgets('Inventory page searches, filters by storage area, and opens a detail page', (WidgetTester tester) async {
    await tester.pumpWidget(const FMonitorApp());
    await tester.pumpAndSettle();
    await tester.tap(find.text('Sign in with Google'));
    await tester.pumpAndSettle();

    await tester.tap(find.byKey(const ValueKey('nav_Inventory')));
    await tester.pumpAndSettle();

    expect(find.text('CURRENT STOCK REGISTRY'), findsOneWidget);
    expect(find.text('Showing ${kInventoryItems.length} items'), findsOneWidget);

    // Searching by name narrows the list to a single, unique-in-the-list match.
    // (The search field itself now also renders "Water Dispenser" as typed
    // text, so the card's label is the *second* match, not the only one.)
    await tester.enterText(find.byType(TextField), 'Water Dispenser');
    await tester.pump();
    expect(find.text('Showing 1 item'), findsOneWidget);
    expect(find.text('Water Dispenser'), findsNWidgets(2));

    // Opening the card shows the same fields on a dedicated detail page.
    await tester.tap(find.text('Water Dispenser').last);
    await tester.pumpAndSettle();
    expect(find.text('Equipment Details'), findsOneWidget);
    expect(find.text('Quantity Available'), findsOneWidget);
    expect(find.text('14'), findsOneWidget);
    expect(find.text('Storage Area'), findsOneWidget);
    expect(find.text('Con Van #3'), findsOneWidget);
    expect(find.text('Borrowable'), findsOneWidget);

    await tester.pageBack();
    await tester.pumpAndSettle();

    // Clear the search, then filter by storage area instead.
    await tester.enterText(find.byType(TextField), '');
    await tester.pump();
    await tester.tap(find.text('Storage Areas'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Grandstand').last);
    await tester.pumpAndSettle();

    expect(find.text('Showing 1 item'), findsOneWidget);
    expect(find.text('Trussed Tent'), findsOneWidget);

    // Every item on file is borrowable, so the non-borrowable filter empties the list.
    // It's a single button now - open its sheet, then pick the option from it.
    await tester.tap(find.text('All'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Non-Borrowable'));
    await tester.pumpAndSettle();
    expect(find.text('No equipment found'), findsOneWidget);
  });

  testWidgets('Calendar page lists deliveries for a selected day and opens a detail page', (WidgetTester tester) async {
    await tester.pumpWidget(const FMonitorApp());
    await tester.pumpAndSettle();
    await tester.tap(find.text('Sign in with Google'));
    await tester.pumpAndSettle();

    await tester.tap(find.byKey(const ValueKey('nav_Calendar')));
    await tester.pumpAndSettle();

    // The sample delivery data lives in September 2026 - navigate there
    // regardless of what "today" actually is when this test runs.
    final now = DateTime.now();
    final monthsForward = (2026 - now.year) * 12 + (9 - now.month);
    final navIcon = monthsForward >= 0 ? Icons.chevron_right : Icons.chevron_left;
    for (var i = 0; i < monthsForward.abs(); i++) {
      await tester.tap(find.byIcon(navIcon));
      await tester.pump();
    }
    await tester.pumpAndSettle();
    expect(find.text('September 2026'), findsOneWidget);

    // The missed-status sample task was removed entirely - it shouldn't
    // show up anywhere, including as a status label.
    expect(find.text('Missed'), findsNothing);

    // Sept 5, 2026 has two sample deliveries.
    await tester.tap(find.byKey(const ValueKey('day_2026-9-5')));
    await tester.pumpAndSettle();

    expect(find.text('2 tasks'), findsOneWidget);
    expect(find.text('Deliver Scaffolding Set'), findsOneWidget);
    expect(find.text('Deliver Water Dispenser'), findsOneWidget);

    // Opening a task shows the same fields on a dedicated detail page.
    await tester.ensureVisible(find.text('Deliver Scaffolding Set'));
    await tester.pump();
    await tester.tap(find.text('Deliver Scaffolding Set'));
    await tester.pumpAndSettle();
    expect(find.text('Delivery Details'), findsOneWidget);
    expect(find.text('Destination'), findsOneWidget);
    expect(find.text('St. Raymund Back Area'), findsOneWidget);
    expect(find.text('In Transit'), findsWidgets);
    expect(find.textContaining('Coordinate with the site engineer'), findsOneWidget);

    // Complete Task has no backend to call yet - tapping it just shouldn't
    // do (or crash) anything.
    expect(find.text('Complete Task'), findsOneWidget);
    await tester.tap(find.text('Complete Task'));
    await tester.pump();
    expect(find.text('Delivery Details'), findsOneWidget);

    await tester.pageBack();
    await tester.pumpAndSettle();

    // Sept 6, 2026 has nothing scheduled.
    await tester.ensureVisible(find.byKey(const ValueKey('day_2026-9-6')));
    await tester.pump();
    await tester.tap(find.byKey(const ValueKey('day_2026-9-6')));
    await tester.pumpAndSettle();
    expect(find.text('No deliveries this day'), findsOneWidget);

    // Tapping the header label itself (not a separate dropdown) toggles
    // to the Minimal view, collapsing the grid to a single week and
    // resetting to today. The header shows the month the visible week
    // mostly falls in (not a day-range) - computed here the same way the
    // page does, since "today" varies.
    await tester.ensureVisible(find.text('September 2026'));
    await tester.pump();
    await tester.tap(find.text('September 2026'));
    await tester.pumpAndSettle();

    DateTime startOfWeek(DateTime d) => DateTime(d.year, d.month, d.day - (d.weekday % 7));
    String monthYearOf(DateTime d) => '${_fullMonthNames[d.month - 1]} ${d.year}';

    final weekStart = startOfWeek(DateTime(now.year, now.month, now.day));
    final midweek = weekStart.add(const Duration(days: 3));
    expect(find.text(monthYearOf(midweek)), findsOneWidget);

    await tester.tap(find.byIcon(Icons.chevron_right));
    await tester.pumpAndSettle();
    final nextMidweek = weekStart.add(const Duration(days: 7 + 3));
    expect(find.text(monthYearOf(nextMidweek)), findsOneWidget);
  });

  testWidgets('History page filters the placeholder activity log by type', (WidgetTester tester) async {
    await tester.pumpWidget(const FMonitorApp());
    await tester.pumpAndSettle();
    await tester.tap(find.text('Sign in with Google'));
    await tester.pumpAndSettle();

    await tester.tap(find.byKey(const ValueKey('nav_History')));
    await tester.pumpAndSettle();

    expect(find.text('ACTIVITY LOG'), findsOneWidget);
    expect(find.text('10 logs'), findsOneWidget);

    // Filtering to Deliveries narrows the list to just that type's entries.
    await tester.tap(find.text('All Activity'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Deliveries'));
    await tester.pumpAndSettle();

    expect(find.text('5 logs'), findsOneWidget);
    expect(find.text('Deliveries'), findsOneWidget);

    // The clear "x" on the filter button resets back to everything.
    await tester.tap(find.byIcon(Icons.close));
    await tester.pumpAndSettle();
    expect(find.text('10 logs'), findsOneWidget);
    expect(find.text('All Activity'), findsOneWidget);
  });

  testWidgets('Tapping Privacy Policy shows the placeholder message', (WidgetTester tester) async {
    await tester.pumpWidget(const FMonitorApp());
    await tester.pumpAndSettle();

    await tapTextSpan(tester, 'Privacy Policy');
    expect(find.text('Privacy Policy — coming soon'), findsOneWidget);
  });

  testWidgets('Tapping Terms and Conditions shows the placeholder message', (WidgetTester tester) async {
    await tester.pumpWidget(const FMonitorApp());
    await tester.pumpAndSettle();

    await tapTextSpan(tester, 'Terms and Conditions');
    expect(find.text('Terms and Conditions — coming soon'), findsOneWidget);
  });
}
