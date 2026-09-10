/*
 * Activity History page logic - a direct port of the old React History.jsx
 * (plus its src/data/mockAuditLogs.js). The server renders the static chrome
 * (header, tabs, search bar, empty table, pagination); this fetches the real
 * login logs, merges in the still-mock equipment logs, and does the tab
 * filtering / search / pagination client-side so it stays instant, exactly
 * like the React version did.
 *
 * Real data: GET /api/login-logs (same-origin, session cookie).
 * Mock data: buildMockAuditLogs() below - equipment movement/maintenance
 * logs, unchanged until that feature actually exists on the backend.
 */
(function () {
  'use strict';

  var PAGE_SIZE = 10;

  var LOG_TYPES = [
    { key: 'ALL', label: 'All Activity' },
    { key: 'LOGIN_ACTIVITY', label: 'Login Activity' },
    { key: 'CRITICAL_ALERTS', label: 'Critical Alerts' },
    { key: 'MAINTENANCE', label: 'Maintenance' },
    { key: 'MOVEMENTS', label: 'Movements' }
  ];

  /* ---- mock equipment logs (ported from mockAuditLogs.js) ---- */
  var JOBS = [
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
    { venue: 'Benavides Auditorium', equipment: 'Stage Truss', category: 'MOVEMENTS' }
  ];

  function buildMockAuditLogs() {
    var now = new Date('2026-08-27T15:00:00');
    var total = 36;
    var logs = [];
    for (var i = 0; i < total; i++) {
      var job = JOBS[i % JOBS.length];
      var timestamp = new Date(now.getTime() - i * 3.5 * 36e5);
      logs.push({
        id: 'LOG-' + String(9921 - i).padStart(4, '0'),
        timestamp: timestamp,
        hauler: 'Hauler',
        venue: job.venue,
        equipment: job.equipment,
        status: i % 3 === 0 ? 'IN PROGRESS' : 'COMPLETED',
        category: job.category
      });
    }
    return logs;
  }

  /* ---- timestamp: 12-hour display, e.g. "2026-08-30 11:51:15 PM" ---- */
  function pad(n) { return String(n).padStart(2, '0'); }

  function formatTimestamp12h(date) {
    var hours24 = date.getHours();
    var hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
    var ampm = hours24 < 12 ? 'AM' : 'PM';
    return (
      date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate()) + ' ' +
      pad(hours12) + ':' + pad(date.getMinutes()) + ':' + pad(date.getSeconds()) + ' ' + ampm
    );
  }

  /* ---- map both shapes onto the same row ---- */
  function mapAuditLog(log) {
    return {
      id: log.id,
      user: log.hauler,
      avatarUrl: null,
      email: '—',
      role: '—',
      action: (log.category ? log.category.replace('_', ' ') : null) || 'ACTIVITY',
      timestamp: formatTimestamp12h(log.timestamp),
      sortKey: log.timestamp.getTime(),
      category: log.category
    };
  }

  function mapLoginLog(log) {
    var date = new Date(log.actionAt);
    return {
      id: 'Log-' + String(log.id).padStart(3, '0'),
      user: log.name || log.email,
      avatarUrl: log.pictureUrl,
      email: log.email,
      role: log.role,
      action: log.action,
      timestamp: formatTimestamp12h(date),
      sortKey: date.getTime(),
      category: 'LOGIN_ACTIVITY'
    };
  }

  /* ---- DOM handles ---- */
  var root = document.getElementById('history-root');
  if (!root) return;
  var loadingEl = document.getElementById('history-loading');
  var contentEl = document.getElementById('history-content');
  var tabsEl = document.getElementById('history-tabs');
  var searchInput = document.getElementById('history-search');
  var tbody = document.getElementById('history-tbody');
  var showingEl = document.getElementById('history-showing');
  var prevBtn = document.getElementById('history-prev');
  var nextBtn = document.getElementById('history-next');
  var pageNumEl = document.getElementById('history-page');
  var pageTotalEl = document.getElementById('history-page-total');

  /* ---- state ---- */
  var logs = [];
  var activeTab = 'ALL';
  var search = '';
  var currentPage = 1;

  var initialTab = new URLSearchParams(window.location.search).get('tab');
  if (initialTab && LOG_TYPES.some(function (t) { return t.key === initialTab; })) {
    activeTab = initialTab;
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function counts() {
    var result = { ALL: logs.length };
    LOG_TYPES.forEach(function (t) {
      if (t.key !== 'ALL') {
        result[t.key] = logs.filter(function (l) { return l.category === t.key; }).length;
      }
    });
    return result;
  }

  function filteredLogs() {
    var query = search.trim().toLowerCase();
    return logs.filter(function (log) {
      if (activeTab !== 'ALL' && log.category !== activeTab) return false;
      if (!query) return true;
      return (
        (log.user && log.user.toLowerCase().indexOf(query) !== -1) ||
        (log.email && log.email.toLowerCase().indexOf(query) !== -1) ||
        (log.id && log.id.toLowerCase().indexOf(query) !== -1)
      );
    });
  }

  function actionPill(action) {
    var styles = action === 'LOGGED OUT'
      ? 'bg-gray-100 text-gray-600'
      : 'bg-emerald-100 text-emerald-700';
    return '<span class="inline-flex rounded-full px-3 py-1 text-xs font-semibold ' + styles + '">' +
      escapeHtml(action) + '</span>';
  }

  function renderTabs() {
    var c = counts();
    tabsEl.innerHTML = LOG_TYPES.map(function (t) {
      var active = activeTab === t.key;
      var cls = active
        ? 'bg-[#fccb35] text-gray-900'
        : 'bg-gray-100 text-gray-600 hover:bg-gray-200';
      return '<button type="button" data-tab="' + t.key + '" ' +
        'class="rounded-full px-4 py-2 text-xs font-bold tracking-wide uppercase transition-colors duration-150 ' + cls + '">' +
        escapeHtml(t.label) + ' <span class="ml-1 opacity-70">' + (c[t.key] || 0) + '</span></button>';
    }).join('');
  }

  function renderTable() {
    var rows = filteredLogs();
    var totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
    if (currentPage > totalPages) currentPage = totalPages;
    var pageStart = (currentPage - 1) * PAGE_SIZE;
    var paged = rows.slice(pageStart, pageStart + PAGE_SIZE);

    if (rows.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="6" class="px-4 py-16 text-center text-gray-400">' +
        '<i class="fa-solid fa-clock-rotate-left mb-3 block text-[32px] text-gray-300"></i>' +
        '<p class="text-sm font-medium text-gray-900">No activity logs yet</p></td></tr>';
    } else {
      tbody.innerHTML = paged.map(function (log) {
        var avatar = log.avatarUrl
          ? '<img src="' + escapeHtml(log.avatarUrl) + '" alt="" referrerpolicy="no-referrer" class="h-6 w-6 rounded-full object-cover" />'
          : '<span class="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-[10px] font-semibold text-gray-400">' +
            escapeHtml((log.user && log.user.charAt(0).toUpperCase()) || '?') + '</span>';
        return '<tr class="border-b border-gray-50 last:border-0">' +
          '<td class="px-4 py-3 font-medium text-gray-900">' + escapeHtml(log.id) + '</td>' +
          '<td class="px-4 py-3"><div class="flex items-center gap-2">' + avatar +
            '<span class="text-gray-500">' + escapeHtml(log.user) + '</span></div></td>' +
          '<td class="px-4 py-3 text-gray-500">' + escapeHtml(log.email) + '</td>' +
          '<td class="px-4 py-3 text-gray-500">' + escapeHtml(log.role) + '</td>' +
          '<td class="px-4 py-3">' + actionPill(log.action) + '</td>' +
          '<td class="px-4 py-3 text-gray-500">' + escapeHtml(log.timestamp) + '</td>' +
          '</tr>';
      }).join('');
    }

    showingEl.textContent = 'Showing ' + paged.length + ' of ' + rows.length + ' records';
    pageNumEl.textContent = currentPage;
    pageTotalEl.textContent = 'of ' + totalPages;
    prevBtn.disabled = currentPage <= 1;
    nextBtn.disabled = currentPage >= totalPages;
  }

  function render() {
    renderTabs();
    renderTable();
  }

  /* ---- events ---- */
  tabsEl.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-tab]');
    if (!btn) return;
    activeTab = btn.getAttribute('data-tab');
    currentPage = 1;
    render();
  });

  searchInput.addEventListener('input', function () {
    search = searchInput.value;
    currentPage = 1;
    render();
  });

  prevBtn.addEventListener('click', function () {
    if (currentPage > 1) { currentPage -= 1; renderTable(); }
  });
  nextBtn.addEventListener('click', function () {
    currentPage += 1; renderTable();
  });

  /* ---- load ---- */
  fetch('/api/login-logs', { credentials: 'include' })
    .then(function (res) { return res.ok ? res.json() : []; })
    .then(function (loginLogs) {
      var combined = loginLogs.map(mapLoginLog).concat(buildMockAuditLogs().map(mapAuditLog));
      combined.sort(function (a, b) { return b.sortKey - a.sortKey; });
      logs = combined;
    })
    .catch(function () {
      logs = buildMockAuditLogs().map(mapAuditLog);
    })
    .then(function () {
      loadingEl.hidden = true;
      contentEl.hidden = false;
      render();
    });
})();
