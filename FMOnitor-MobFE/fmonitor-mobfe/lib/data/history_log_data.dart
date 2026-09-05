import 'history_log_entry.dart';

/// Sample log entries standing in for the real activity history that would
/// come from the backend once it exists - enough of a mix of [HistoryLogType]
/// for the filter to have something to actually narrow down.
const List<HistoryLogEntry> kHistoryLogEntries = [
  HistoryLogEntry(id: 'log-1', type: HistoryLogType.delivery),
  HistoryLogEntry(id: 'log-2', type: HistoryLogType.login),
  HistoryLogEntry(id: 'log-3', type: HistoryLogType.delivery),
  HistoryLogEntry(id: 'log-4', type: HistoryLogType.delivery),
  HistoryLogEntry(id: 'log-5', type: HistoryLogType.system),
  HistoryLogEntry(id: 'log-6', type: HistoryLogType.login),
  HistoryLogEntry(id: 'log-7', type: HistoryLogType.delivery),
  HistoryLogEntry(id: 'log-8', type: HistoryLogType.system),
  HistoryLogEntry(id: 'log-9', type: HistoryLogType.delivery),
  HistoryLogEntry(id: 'log-10', type: HistoryLogType.login),
];

int countForType(HistoryLogType? type) => type == null
    ? kHistoryLogEntries.length
    : kHistoryLogEntries.where((entry) => entry.type == type).length;
