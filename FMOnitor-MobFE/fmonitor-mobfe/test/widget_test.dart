// Basic smoke test for the login page.

import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:fmonitor/main.dart';

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
