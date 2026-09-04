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

    final signInButton = find.text('Sign in with Google');
    await tester.tap(signInButton);
    await tester.pump();
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
