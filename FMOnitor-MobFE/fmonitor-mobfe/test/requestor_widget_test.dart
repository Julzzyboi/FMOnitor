// Smoke tests for the Requestor app's nav shell and dashboard.

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:fmonitor/main_requestor.dart';
import 'package:fmonitor/requestor/data/requestor_ticket_data.dart';

void main() {
  testWidgets('Requestor app boots into Home with four nav tabs and no QR destination', (WidgetTester tester) async {
    await tester.pumpWidget(const RequestorApp());
    await tester.pumpAndSettle();

    // "Home" shows twice - the topbar title and the nav item's label.
    expect(find.text('Home'), findsNWidgets(2));
    expect(find.text('Calendar'), findsOneWidget);
    expect(find.text('Track'), findsOneWidget);
    expect(find.text('History'), findsOneWidget);
    expect(find.text('Inventory'), findsNothing);
    expect(find.byKey(const ValueKey('qr_fab')), findsNothing);
  });

  testWidgets('Requestor dashboard shows ticket stats, no ticket IDs, and gates Additional Request on delivery status',
      (WidgetTester tester) async {
    await tester.pumpWidget(const RequestorApp());
    await tester.pumpAndSettle();

    expect(find.text('ACTIVE TICKETS'), findsOneWidget);
    expect(find.text('$activeTicketCount'), findsOneWidget);
    expect(find.text('PENDING TICKETS'), findsOneWidget);
    expect(find.text('$pendingTicketCount'), findsOneWidget);

    expect(find.text('RECENT TICKETS'), findsOneWidget);
    // The first three sample tickets are shown by default: Approved,
    // In Transit, then Delivered.
    expect(find.byKey(const ValueKey('ticket_TKT-99021')), findsOneWidget);
    expect(find.byKey(const ValueKey('ticket_TKT-99022')), findsOneWidget);
    expect(find.byKey(const ValueKey('ticket_TKT-99023')), findsOneWidget);

    // The ticket ID is no longer shown on the card itself.
    expect(find.textContaining('TICKET ID'), findsNothing);
    expect(find.textContaining('TKT-99021'), findsNothing);

    ElevatedButton buttonFor(String ticketId) => tester.widget<ElevatedButton>(
          find.descendant(of: find.byKey(ValueKey('ticket_$ticketId')), matching: find.byType(ElevatedButton)),
        );

    // Additional Request is only enabled once a ticket is Delivered.
    expect(buttonFor('TKT-99021').onPressed, isNull); // Approved
    expect(buttonFor('TKT-99022').onPressed, isNull); // In Transit
    expect(buttonFor('TKT-99023').onPressed, isNotNull); // Delivered
  });

  testWidgets('Calendar tab reuses the hauler Calendar page', (WidgetTester tester) async {
    await tester.pumpWidget(const RequestorApp());
    await tester.pumpAndSettle();

    await tester.tap(find.byKey(const ValueKey('nav_Calendar')));
    await tester.pumpAndSettle();

    // Same chrome the hauler's Calendar page renders: month nav arrows and
    // day cells keyed the same way.
    expect(find.byIcon(Icons.chevron_left), findsOneWidget);
    expect(find.byIcon(Icons.chevron_right), findsOneWidget);
    expect(find.byWidgetPredicate((w) => w.key is ValueKey && (w.key! as ValueKey).value.toString().startsWith('day_')), findsWidgets);
  });

  testWidgets('Track tab is blank', (WidgetTester tester) async {
    await tester.pumpWidget(const RequestorApp());
    await tester.pumpAndSettle();

    await tester.tap(find.byKey(const ValueKey('nav_Track')));
    await tester.pumpAndSettle();

    Text topbarTitle() => tester.widget<Text>(
          find.descendant(of: find.byKey(const Key('topbar_title')), matching: find.byType(Text)),
        );
    expect(topbarTitle().data, 'Track');
    // Nothing but the topbar and nav bar - the page body itself is blank.
    expect(find.text('Coming soon.'), findsNothing);
  });

  testWidgets('History tab shows a placeholder', (WidgetTester tester) async {
    await tester.pumpWidget(const RequestorApp());
    await tester.pumpAndSettle();

    await tester.tap(find.byKey(const ValueKey('nav_History')));
    await tester.pumpAndSettle();

    expect(find.text('Order History'), findsOneWidget);
    expect(find.text('Coming soon.'), findsOneWidget);
  });

  testWidgets('Logout navigates to LoginPage, same as the hauler shell', (WidgetTester tester) async {
    await tester.pumpWidget(const RequestorApp());
    await tester.pumpAndSettle();

    await tester.tap(find.byKey(const ValueKey('profile_button')));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Logout'));
    await tester.pumpAndSettle();

    // Real navigation now (pushAndRemoveUntil to LoginPage), mirroring
    // HaulerNavShell - no longer a no-op now that this is a real production
    // destination (reached via the real LoginPage's role-based routing),
    // not just a dev preview push.
    expect(find.text('Home'), findsNothing);
    expect(find.text('Sign in with Google'), findsOneWidget);
  });
}
