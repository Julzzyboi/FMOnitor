import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'requestor/navigation/requestor_nav_shell.dart';

/// Standalone launch/test target for `RequestorNavShell` - boots straight
/// into it with no login, which is exactly what `test/requestor_widget_test.dart`
/// needs (a plain MaterialApp wrapper to pump in widget tests). The real
/// production path is `lib/main.dart`'s single LoginPage, which now routes
/// to this same nav shell for a Hauler- vs Requestor-role account after a
/// real Google sign-in - this file isn't part of that flow.
void main() {
  runApp(const RequestorApp());
}

class RequestorApp extends StatelessWidget {
  const RequestorApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'FMOnitor Requestor',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        scaffoldBackgroundColor: Colors.white,
        textTheme: GoogleFonts.montserratTextTheme(),
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFFFDCC36),
          brightness: Brightness.light,
        ),
      ),
      home: const RequestorNavShell(),
    );
  }
}
