import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'requestor/navigation/requestor_nav_shell.dart';

/// Entry point for the Requestor app - a separate build target
/// (`flutter run -t lib/main_requestor.dart`) sharing this same codebase
/// and `common/` layer with the hauler app (`lib/main.dart`), but with its
/// own pages and nav shell under `lib/requestor/`.
///
/// There's no login flow here yet - it boots straight into the nav shell,
/// same as how new hauler pages get previewed before a real backend exists.
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
