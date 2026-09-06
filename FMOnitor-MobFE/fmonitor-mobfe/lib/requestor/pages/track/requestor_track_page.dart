import 'package:flutter/material.dart';
import 'package:fmonitor/common/widgets/blank_loading_page.dart';

/// The requestor's Track tab - blank for now. This is where live
/// hauler-location tracking (test plan: "View Live Tracking") will
/// eventually live once that flow is built out.
class RequestorTrackPage extends StatelessWidget {
  const RequestorTrackPage({super.key});

  @override
  Widget build(BuildContext context) => const BlankLoadingPage();
}
