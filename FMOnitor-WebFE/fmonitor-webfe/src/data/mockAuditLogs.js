// Placeholder data for the Activity History page until a real backend
// endpoint exists. Shape mirrors what GET /api/audit-logs is expected to
// return eventually — swap MOCK_AUDIT_LOGS for a real fetch when ready.

const JOBS = [
  { venue: 'QPAV Mezzanine', equipment: 'Stanchions', category: 'MOVEMENTS' },
  { venue: 'Motorpool', equipment: 'Iwata Aircooler', category: 'MAINTENANCE' },
  { venue: 'Frassati 22nd Floor', equipment: 'Monoblock Chair', category: 'MOVEMENTS' },
  { venue: 'Grandstand', equipment: 'Scaffolding (5ft / 3ft)', category: 'CRITICAL_ALERTS' },
  { venue: 'FMO Office Garage', equipment: 'Man lift', category: 'MOVEMENTS' },
  { venue: 'Practice Gym', equipment: 'Platforms 4x8', category: 'CRITICAL_ALERTS' },
  { venue: 'Albertus Magnus Building', equipment: 'Extension Ladder', category: 'MAINTENANCE' },
  { venue: 'Thomas Aquinas Research Complex', equipment: 'Generator Set', category: 'MAINTENANCE' },
  { venue: 'UST Field', equipment: 'Portable Bleachers', category: 'MOVEMENTS' },
  { venue: 'Main Building', equipment: 'Fire Extinguisher Cart', category: null },
  { venue: 'Central Laboratory', equipment: 'Fume Hood Unit', category: null },
  { venue: 'Benavides Auditorium', equipment: 'Stage Truss', category: 'MOVEMENTS' },
]

function pad(n) {
  return String(n).padStart(2, '0')
}

function formatTimestamp(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

function buildMockAuditLogs() {
  const now = new Date('2026-08-27T15:00:00')
  const total = 36
  const logs = []

  for (let i = 0; i < total; i++) {
    const job = JOBS[i % JOBS.length]
    const timestamp = new Date(now.getTime() - i * 3.5 * 36e5)
    logs.push({
      timestamp,
      hauler: 'Hauler',
      venue: job.venue,
      equipment: job.equipment,
      status: i % 3 === 0 ? 'IN PROGRESS' : 'COMPLETED',
      category: job.category,
    })
  }

  return logs.map((log, index) => ({
    id: `LOG-${String(9921 - index).padStart(4, '0')}`,
    timestamp: formatTimestamp(log.timestamp),
    hauler: log.hauler,
    venue: log.venue,
    equipment: log.equipment,
    status: log.status,
    category: log.category,
  }))
}

const MOCK_AUDIT_LOGS = buildMockAuditLogs()

export default MOCK_AUDIT_LOGS
