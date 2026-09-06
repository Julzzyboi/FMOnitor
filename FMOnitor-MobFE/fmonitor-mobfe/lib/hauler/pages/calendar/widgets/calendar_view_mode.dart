enum CalendarViewMode { detailed, minimal }

extension CalendarViewModeLabel on CalendarViewMode {
  String get label => switch (this) {
        CalendarViewMode.detailed => 'Detailed',
        CalendarViewMode.minimal => 'Minimal',
      };
}
