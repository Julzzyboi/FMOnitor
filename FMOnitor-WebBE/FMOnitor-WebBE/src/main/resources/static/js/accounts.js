/*
 * Accounts page - a direct port of React's Accounts/ folder (index.jsx and its
 * 12 sub-components). The server renders the chrome + hidden modal shells; this
 * fetches GET /api/accounts, renders the stat cards / table / cards / pagination,
 * and does search + role/status filtering + view-mode + pagination client-side,
 * plus every mutation against the existing /api/accounts REST endpoints.
 *
 * Endpoints (all Superadmin-guarded server-side):
 *   GET    /api/accounts
 *   POST   /api/accounts/invite         { email, role }
 *   PATCH  /api/accounts/{id}           { name, role }
 *   PATCH  /api/accounts/{id}/status    { status }
 *   DELETE /api/accounts/{id}
 */
(function () {
  'use strict';

  var PAGE_SIZE = 8;
  var ROLES = ['Superadmin', 'Admin', 'Hauler', 'Requestor'];
  var FILTERABLE_STATUSES = ['Active', 'Inactive', 'Unregistered'];
  var PURGE_RETENTION_DAYS = 90; // matches AccountCleanupScheduler.RETENTION_DAYS

  var ROLE_STYLES = {
    Superadmin: { dot: 'bg-[#fccb35]', text: 'text-[#a3790f] font-bold' },
    Admin: { dot: 'bg-blue-500', text: 'text-gray-800 font-semibold' },
    Hauler: { dot: 'bg-violet-500', text: 'text-gray-800 font-semibold' },
    Requestor: { dot: 'bg-gray-400', text: 'text-gray-800 font-semibold' }
  };
  var STATUS_STYLES = {
    Active: 'bg-emerald-500 text-white',
    Inactive: 'bg-gray-400 text-white',
    Unregistered: 'bg-sky-500 text-white',
    Disabled: 'bg-orange-500 text-white',
    Deleted: 'bg-red-600 text-white'
  };

  var CONFIRM_CONFIG = {
    add: {
      title: 'Send invite?',
      message: 'Each person will get an email with a link to sign in and activate their account.',
      confirmLabel: 'Invite', variant: 'success'
    },
    save: {
      title: 'Save changes?', message: "This will update the user's information.",
      confirmLabel: 'Save', variant: 'success'
    },
    disable: {
      title: 'Disable this user?', message: 'They will lose access to the system until re-enabled.',
      confirmLabel: 'Disable', variant: 'warning'
    },
    delete: {
      title: 'Delete this user?',
      message: "They'll be hidden from the active list and only reachable through the Deleted Users view. Accounts left there are automatically deleted permanently after 3 months.",
      confirmLabel: 'Delete', variant: 'danger'
    },
    permanentDelete: {
      title: 'Permanently delete this account?',
      message: "This cannot be undone. All of this account's data will be erased, and its email address will become available to invite again as a brand new account.",
      confirmLabel: 'Delete Permanently', variant: 'danger'
    }
  };

  var CONFIRM_VARIANTS = {
    success: { icon: 'fa-circle-check', iconColor: 'text-emerald-600', iconBg: 'bg-emerald-50', button: 'bg-emerald-600 hover:bg-emerald-700' },
    danger: { icon: 'fa-triangle-exclamation', iconColor: 'text-red-600', iconBg: 'bg-red-50', button: 'bg-red-600 hover:bg-red-700' },
    warning: { icon: 'fa-ban', iconColor: 'text-amber-600', iconBg: 'bg-amber-50', button: 'bg-amber-500 hover:bg-amber-600' }
  };
  var TOAST_STYLES = {
    success: { bg: 'bg-emerald-600', icon: 'fa-circle-check' },
    danger: { bg: 'bg-red-600', icon: 'fa-triangle-exclamation' },
    warning: { bg: 'bg-amber-500', icon: 'fa-ban' }
  };

  /* ---------- helpers ---------- */
  function pad(n) { return String(n).padStart(2, '0'); }

  function formatDate(iso) {
    var d = new Date(iso);
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' +
      pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  function mapAccount(a) {
    return {
      id: a.id, name: a.name, email: a.email, role: a.role, status: a.status,
      dateCreated: formatDate(a.createdAt), avatarUrl: a.pictureUrl, deletedAt: a.deletedAt
    };
  }

  function daysUntilPurge(deletedAt) {
    if (!deletedAt) return null;
    var elapsedDays = Math.floor((Date.now() - new Date(deletedAt).getTime()) / 86400000);
    return Math.max(0, PURGE_RETENTION_DAYS - elapsedDays);
  }

  function purgeDate(deletedAt) {
    if (!deletedAt) return null;
    var d = new Date(new Date(deletedAt).getTime() + PURGE_RETENTION_DAYS * 86400000);
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' +
      pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  function getPageNumbers(current, total) {
    if (total <= 5) {
      var arr = [];
      for (var i = 1; i <= total; i++) arr.push(i);
      return arr;
    }
    var set = new Set([1, 2, total - 1, total, current - 1, current, current + 1]);
    var sorted = [].concat(Array.from(set)).filter(function (p) { return p >= 1 && p <= total; }).sort(function (a, b) { return a - b; });
    var withGaps = [];
    sorted.forEach(function (page, i) {
      if (i > 0 && page - sorted[i - 1] > 1) withGaps.push('...');
      withGaps.push(page);
    });
    return withGaps;
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function json(res) { return res.json().catch(function () { return null; }); }

  /* ---------- state ---------- */
  var users = [];
  var search = '';
  var roleFilter = 'All';
  var statusFilter = 'All';
  var viewMode = 'normal'; // 'normal' | 'disabled' | 'deleted'
  var page = 1;
  var pendingAction = null; // { type, payload }
  var editingUser = null;
  var viewingUser = null;
  var toastTimer = null;

  var canInvite = !!document.getElementById('btn-add-user');

  /* ---------- element refs ---------- */
  var $ = function (id) { return document.getElementById(id); };
  var tableContainer = $('users-table-container');
  var paginationEl = $('pagination');
  var rowMenu = $('row-menu');

  /* ---------- derived ---------- */
  function counts() {
    var visible = users.filter(function (u) { return u.status !== 'Deleted' && u.status !== 'Disabled'; });
    return {
      total: visible.length,
      active: visible.filter(function (u) { return u.status === 'Active'; }).length,
      inactive: visible.filter(function (u) { return u.status === 'Inactive'; }).length,
      unregistered: visible.filter(function (u) { return u.status === 'Unregistered'; }).length
    };
  }
  function disabledCount() { return users.filter(function (u) { return u.status === 'Disabled'; }).length; }
  function deletedCount() { return users.filter(function (u) { return u.status === 'Deleted'; }).length; }

  function filteredUsers() {
    var query = search.trim().toLowerCase();
    return users.filter(function (user) {
      if (viewMode === 'disabled') {
        if (user.status !== 'Disabled') return false;
      } else if (viewMode === 'deleted') {
        if (user.status !== 'Deleted') return false;
      } else if (user.status === 'Disabled' || user.status === 'Deleted') {
        return false;
      }
      var matchesQuery = query === '' ||
        user.name.toLowerCase().indexOf(query) !== -1 ||
        user.email.toLowerCase().indexOf(query) !== -1 ||
        user.role.toLowerCase().indexOf(query) !== -1 ||
        user.status.toLowerCase().indexOf(query) !== -1;
      var matchesRole = roleFilter === 'All' || user.role === roleFilter;
      var matchesStatus = viewMode !== 'normal' || statusFilter === 'All' || user.status === statusFilter;
      return matchesQuery && matchesRole && matchesStatus;
    });
  }

  function findUser(id) {
    return users.filter(function (u) { return String(u.id) === String(id); })[0];
  }

  /* ---------- renders ---------- */
  function renderStatCards() {
    var c = counts();
    $('stat-total').textContent = c.total;
    $('stat-active').textContent = c.active;
    $('stat-inactive').textContent = c.inactive;
    $('stat-unregistered').textContent = c.unregistered;
    $('count-disabled').textContent = disabledCount();
    $('count-deleted').textContent = deletedCount();
  }

  function renderViewToggles() {
    var d = $('toggle-disabled');
    var del = $('toggle-deleted');
    var dBadge = $('count-disabled');
    var delBadge = $('count-deleted');

    d.className = 'flex cursor-pointer items-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-bold uppercase tracking-wide transition-colors duration-150 ' +
      (viewMode === 'disabled'
        ? 'border-orange-500 bg-orange-500 text-white'
        : 'border-orange-200 bg-orange-50 text-orange-600 hover:bg-orange-100');
    dBadge.className = 'rounded-full px-1.5 py-0.5 text-[10px] ' + (viewMode === 'disabled' ? 'bg-white/25' : 'bg-orange-200/70');

    del.className = 'flex cursor-pointer items-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-bold uppercase tracking-wide transition-colors duration-150 ' +
      (viewMode === 'deleted'
        ? 'border-red-600 bg-red-600 text-white'
        : 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100');
    delBadge.className = 'rounded-full px-1.5 py-0.5 text-[10px] ' + (viewMode === 'deleted' ? 'bg-white/25' : 'bg-red-200/70');

    // Status filter is only shown in normal view (React conditionally renders it).
    $('filter-status').hidden = viewMode !== 'normal';
  }

  function avatarCell(user, sizeClass, iconSize) {
    if (user.avatarUrl) {
      return '<img src="' + esc(user.avatarUrl) + '" alt="' + esc(user.name) + '" class="h-full w-full object-cover" />';
    }
    return '<i class="fa-solid fa-user ' + iconSize + ' text-white"></i>';
  }

  function purgeLines(user, mobile) {
    if (user.status !== 'Deleted') return '';
    var days = daysUntilPurge(user.deletedAt);
    var at = purgeDate(user.deletedAt);
    if (days === null) return '';
    var daysText = days === 0 ? 'Purging soon' : days + ' day' + (days === 1 ? '' : 's') + ' until purge';
    if (mobile) {
      return '<span class="text-gray-400">' + daysText + (at ? ' (on ' + esc(at) + ')' : '') + '</span>';
    }
    return '<p class="mt-1 text-[11px] text-gray-400">' + daysText + '</p>' +
      (at ? '<p class="text-[11px] text-gray-400">on ' + esc(at) + '</p>' : '');
  }

  function roleChip(role) {
    var rs = ROLE_STYLES[role] || ROLE_STYLES.Requestor;
    return '<span class="h-2 w-2 rounded-full ' + rs.dot + '"></span>' +
      '<span class="text-sm ' + rs.text + '">' + esc(role) + '</span>';
  }
  function statusChip(status) {
    return '<span class="inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ' +
      (STATUS_STYLES[status] || '') + '">' + esc(status) + '</span>';
  }

  function renderTable() {
    var rows = filteredUsers();
    var totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
    if (page > totalPages) page = totalPages;
    var paged = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    if (paged.length === 0) {
      tableContainer.innerHTML =
        '<div class="px-6 py-12 text-center text-sm text-gray-400">No users match your search or filters.</div>';
    } else {
      // mobile cards
      var cards = paged.map(function (u) {
        return '<div data-user-id="' + u.id + '" data-row-open ' +
          'class="flex cursor-pointer flex-col gap-3 border-b border-gray-100 p-4 transition-colors duration-150 last:border-0 hover:bg-gray-50/60">' +
          '<div class="flex items-start justify-between gap-3">' +
            '<div class="flex min-w-0 items-center gap-3">' +
              '<div class="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-400">' + avatarCell(u, '', 'text-[16px]') + '</div>' +
              '<div class="min-w-0">' +
                '<p class="truncate font-medium text-gray-900">' + esc(u.name) + '</p>' +
                '<p class="truncate text-xs text-gray-500">' + esc(u.email) + '</p>' +
              '</div>' +
            '</div>' +
            rowMenuTrigger(u) +
          '</div>' +
          '<div class="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">' +
            '<span class="flex items-center gap-1.5">' + roleChip(u.role) + '</span>' +
            statusChip(u.status) +
            purgeLines(u, true) +
            '<span class="text-gray-400">' + esc(u.dateCreated) + '</span>' +
          '</div>' +
        '</div>';
      }).join('');

      // desktop table
      var body = paged.map(function (u) {
        return '<tr data-user-id="' + u.id + '" data-row-open class="cursor-pointer border-b border-gray-50 last:border-0 hover:bg-gray-50/60">' +
          '<td class="px-6 py-3.5"><div class="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-gray-400">' + avatarCell(u, '', 'text-[16px]') + '</div></td>' +
          '<td class="whitespace-nowrap px-6 py-3.5 font-medium text-gray-900">' + esc(u.name) + '</td>' +
          '<td class="whitespace-nowrap px-6 py-3.5 text-gray-500">' + esc(u.email) + '</td>' +
          '<td class="whitespace-nowrap px-6 py-3.5"><span class="flex items-center gap-2">' + roleChip(u.role) + '</span></td>' +
          '<td class="whitespace-nowrap px-6 py-3.5">' + statusChip(u.status) + purgeLines(u, false) + '</td>' +
          '<td class="whitespace-nowrap px-6 py-3.5 text-gray-500">' + esc(u.dateCreated) + '</td>' +
          '<td class="whitespace-nowrap px-6 py-3.5 text-right">' + rowMenuTrigger(u) + '</td>' +
        '</tr>';
      }).join('');

      tableContainer.innerHTML =
        '<div class="md:hidden">' + cards + '</div>' +
        '<div class="hidden overflow-x-auto rounded-t-xl md:block">' +
          '<table class="w-full text-left text-sm"><thead><tr class="border-b border-gray-100">' +
            ['Image', 'Name', 'Email', 'Role', 'Status', 'Date Created', 'Action'].map(function (c) {
              return '<th class="px-6 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-400">' +
                (c === 'Action' ? '<span class="sr-only">Action</span>' : c) + '</th>';
            }).join('') +
          '</tr></thead><tbody>' + body + '</tbody></table>' +
        '</div>';
    }

    renderPagination(rows.length, totalPages);
  }

  function rowMenuTrigger(u) {
    return '<button type="button" data-row-menu-trigger data-user-id="' + u.id + '" aria-label="Actions for ' + esc(u.name) + '" ' +
      'class="cursor-pointer rounded-md p-2 text-gray-400 transition-colors duration-150 hover:bg-gray-100 hover:text-gray-600">' +
      '<i class="fa-solid fa-ellipsis-vertical text-[16px]"></i></button>';
  }

  function renderPagination(totalItems, totalPages) {
    var start = totalItems === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
    var end = Math.min(page * PAGE_SIZE, totalItems);
    var nums = getPageNumbers(page, totalPages).map(function (p, i) {
      if (p === '...') return '<span class="px-2 text-xs text-gray-400">...</span>';
      return '<button type="button" data-page="' + p + '" class="h-7 w-7 cursor-pointer rounded-md text-xs font-semibold transition-colors duration-150 ' +
        (p === page ? 'bg-[#fccb35] text-gray-900' : 'text-gray-500 hover:bg-gray-100') + '">' + p + '</button>';
    }).join('');

    paginationEl.innerHTML =
      '<div class="flex flex-col items-center justify-between gap-3 px-6 py-4 sm:flex-row">' +
        '<p class="text-xs text-gray-500">Showing <span class="font-semibold text-gray-700">' + start + '-' + end +
          '</span> of <span class="font-semibold text-gray-700">' + totalItems + '</span> users</p>' +
        '<div class="flex items-center gap-1.5">' +
          '<button type="button" data-page-rel="prev"' + (page === 1 ? ' disabled' : '') +
            ' class="cursor-pointer rounded-md px-3 py-1.5 text-xs font-semibold text-gray-500 transition-colors duration-150 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent">Prev</button>' +
          nums +
          '<button type="button" data-page-rel="next"' + (page === totalPages || totalPages === 0 ? ' disabled' : '') +
            ' class="cursor-pointer rounded-md px-3 py-1.5 text-xs font-semibold text-gray-500 transition-colors duration-150 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent">Next</button>' +
        '</div>' +
      '</div>';
  }

  var filterInstances = [];
  function render() {
    renderStatCards();
    renderViewToggles();
    filterInstances.forEach(function (f) { f.syncLabel(); });
    renderTable();
  }

  /* ---------- filter dropdowns ---------- */
  function setupFilter(containerId, getOptions, getValue, setValue) {
    var container = $(containerId);
    var trigger = container.querySelector('[data-filter-trigger]');
    var menu = container.querySelector('[data-filter-menu]');
    var valueEl = container.querySelector('[data-filter-value]');

    function paint() {
      valueEl.textContent = getValue();
      menu.innerHTML = getOptions().map(function (opt) {
        return '<button type="button" data-opt="' + esc(opt) + '" ' +
          'class="flex w-full cursor-pointer items-center justify-between px-4 py-2 text-sm text-gray-700 transition-colors duration-150 hover:bg-gray-50">' +
          esc(opt) + (opt === getValue() ? '<i class="fa-solid fa-check text-[12px] text-[#fccb35]"></i>' : '') + '</button>';
      }).join('');
    }

    trigger.addEventListener('click', function (e) {
      e.stopPropagation();
      var willOpen = menu.hidden;
      closeAllMenus();
      if (willOpen) { paint(); menu.hidden = false; }
    });
    menu.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-opt]');
      if (!btn) return;
      setValue(btn.getAttribute('data-opt'));
      valueEl.textContent = getValue();
      page = 1;
      menu.hidden = true;
      render();
    });

    return { paint: paint, menu: menu, syncLabel: function () { valueEl.textContent = getValue(); } };
  }

  function closeAllMenus() {
    document.querySelectorAll('[data-filter-menu]').forEach(function (m) { m.hidden = true; });
    rowMenu.hidden = true;
  }

  /* ---------- row actions menu (shared, body-level fixed) ---------- */
  function openRowMenu(triggerEl, user) {
    var isDeleted = user.status === 'Deleted';
    var isDisabled = user.status === 'Disabled';
    var html;
    if (isDeleted) {
      html =
        '<button type="button" data-act="restore" class="flex w-full cursor-pointer items-center gap-2.5 px-4 py-2 text-sm text-emerald-600 transition-colors duration-150 hover:bg-emerald-50"><i class="fa-solid fa-arrow-rotate-left text-[14px]"></i>Restore</button>' +
        '<button type="button" data-act="permanentDelete" class="flex w-full cursor-pointer items-center gap-2.5 px-4 py-2 text-sm text-red-700 transition-colors duration-150 hover:bg-red-50"><i class="fa-solid fa-trash-can text-[14px]"></i>Delete Permanently</button>';
    } else {
      html =
        '<button type="button" data-act="edit" class="flex w-full cursor-pointer items-center gap-2.5 px-4 py-2 text-sm text-gray-700 transition-colors duration-150 hover:bg-gray-50"><i class="fa-solid fa-pen text-[14px]"></i>Edit</button>' +
        (isDisabled ? '' :
        '<button type="button" data-act="disable" class="flex w-full cursor-pointer items-center gap-2.5 px-4 py-2 text-sm text-orange-600 transition-colors duration-150 hover:bg-orange-50"><i class="fa-solid fa-ban text-[14px]"></i>Disable</button>') +
        '<button type="button" data-act="delete" class="flex w-full cursor-pointer items-center gap-2.5 px-4 py-2 text-sm text-red-600 transition-colors duration-150 hover:bg-red-50"><i class="fa-solid fa-trash text-[14px]"></i>Delete</button>';
    }
    rowMenu.innerHTML = html;
    rowMenu.dataset.userId = user.id;
    rowMenu.hidden = false;

    // position: right edge aligned to trigger, below it, flip up if no room
    var r = triggerEl.getBoundingClientRect();
    var mw = rowMenu.offsetWidth, mh = rowMenu.offsetHeight;
    var left = Math.max(8, r.right - mw);
    var top = r.bottom + 4;
    if (top + mh > window.innerHeight - 8) top = Math.max(8, r.top - mh - 4);
    rowMenu.style.left = left + 'px';
    rowMenu.style.top = top + 'px';
  }

  rowMenu.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-act]');
    if (!btn) return;
    var user = findUser(rowMenu.dataset.userId);
    rowMenu.hidden = true;
    if (!user) return;
    dispatchAction(btn.getAttribute('data-act'), user);
  });

  /* ---------- modals ---------- */
  function openModal(id) { $(id).hidden = false; }
  function closeModal(id) { $(id).hidden = true; }

  document.querySelectorAll('[id^="modal-"]').forEach(function (modal) {
    modal.querySelectorAll('[data-modal-close], [data-modal-backdrop]').forEach(function (el) {
      el.addEventListener('click', function () {
        modal.hidden = true;
        if (modal.id === 'modal-edit') editingUser = null;
        if (modal.id === 'modal-details') viewingUser = null;
        if (modal.id === 'modal-confirm') pendingAction = null;
      });
    });
  });

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    closeAllMenus();
    ['modal-confirm', 'modal-details', 'modal-edit', 'modal-add'].some(function (id) {
      if (!$(id).hidden) {
        $(id).hidden = true;
        if (id === 'modal-edit') editingUser = null;
        if (id === 'modal-details') viewingUser = null;
        if (id === 'modal-confirm') pendingAction = null;
        return true;
      }
      return false;
    });
  });

  /* ---------- details modal ---------- */
  function openDetails(user) {
    viewingUser = user;
    var rs = ROLE_STYLES[user.role] || ROLE_STYLES.Requestor;
    var isDeleted = user.status === 'Deleted';
    var isDisabled = user.status === 'Disabled';

    var img = $('details-avatar-img'), icon = $('details-avatar-icon');
    if (user.avatarUrl) { img.src = user.avatarUrl; img.hidden = false; icon.hidden = true; }
    else { img.hidden = true; icon.hidden = false; }

    $('details-name').textContent = user.name;
    $('details-email').textContent = user.email;
    $('details-role').innerHTML = '<span class="flex items-center gap-2">' + roleChip(user.role) + '</span>';
    $('details-status').innerHTML = statusChip(user.status);
    $('details-date').textContent = user.dateCreated;

    var days = isDeleted ? daysUntilPurge(user.deletedAt) : null;
    var at = isDeleted ? purgeDate(user.deletedAt) : null;
    var daysRow = $('details-purge-days-row'), dateRow = $('details-purge-date-row');
    if (days !== null) {
      daysRow.hidden = false;
      $('details-purge-days').innerHTML = '<span class="font-semibold text-red-600">' +
        (days === 0 ? 'Purging soon' : days + ' day' + (days === 1 ? '' : 's')) + '</span>';
    } else { daysRow.hidden = true; }
    if (at) { dateRow.hidden = false; $('details-purge-date').textContent = at; }
    else { dateRow.hidden = true; }

    $('details-actions-normal').hidden = isDeleted;
    $('details-actions-deleted').hidden = !isDeleted;
    $('details-btn-disable').hidden = isDisabled;

    openModal('modal-details');
  }

  $('modal-details').querySelectorAll('[data-details-action]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (!viewingUser) return;
      dispatchAction(btn.getAttribute('data-details-action'), viewingUser);
    });
  });

  /* ---------- edit modal ---------- */
  var editAvatarUrl = null;
  function openEdit(user) {
    editingUser = user;
    editAvatarUrl = user.avatarUrl || null;
    closeModal('modal-details');
    viewingUser = null;

    $('edit-name').value = user.name;
    fillRoleSelect($('edit-role'), user.role);
    var img = $('edit-avatar-img'), icon = $('edit-avatar-icon');
    if (editAvatarUrl) { img.src = editAvatarUrl; img.hidden = false; icon.hidden = true; }
    else { img.hidden = true; icon.hidden = false; }
    openModal('modal-edit');
  }

  $('edit-avatar-file').addEventListener('change', function (e) {
    var file = e.target.files && e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      editAvatarUrl = reader.result;
      var img = $('edit-avatar-img');
      img.src = editAvatarUrl; img.hidden = false;
      $('edit-avatar-icon').hidden = true;
    };
    reader.readAsDataURL(file);
  });

  $('form-edit').addEventListener('submit', function (e) {
    e.preventDefault();
    if (!editingUser) return;
    var name = $('edit-name').value.trim() || editingUser.name;
    var role = $('edit-role').value;
    requestConfirm('save', Object.assign({}, editingUser, { name: name, role: role, avatarUrl: editAvatarUrl }));
  });

  /* ---------- add modal ---------- */
  var EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  function parseEmails(raw) {
    return raw.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
  }

  if (canInvite) {
    $('btn-add-user').addEventListener('click', function () {
      $('add-emails').value = '';
      fillRoleSelect($('add-role'), ROLES[ROLES.length - 1]);
      $('add-role-label').textContent = ROLES[ROLES.length - 1];
      $('add-error').hidden = true;
      openModal('modal-add');
      $('add-emails').focus();
    });
  }
  $('add-role').addEventListener('change', function () {
    $('add-role-label').textContent = $('add-role').value;
  });
  $('form-add').addEventListener('submit', function (e) {
    e.preventDefault();
    var emails = parseEmails($('add-emails').value);
    var errEl = $('add-error');
    if (emails.length === 0) { errEl.textContent = 'Enter at least one email'; errEl.hidden = false; return; }
    var invalid = emails.filter(function (em) { return !EMAIL_PATTERN.test(em); })[0];
    if (invalid) { errEl.textContent = '"' + invalid + '" doesn\'t look like a valid email'; errEl.hidden = false; return; }
    errEl.hidden = true;
    requestConfirm('add', { emails: emails, role: $('add-role').value });
  });

  function fillRoleSelect(select, current) {
    select.innerHTML = ROLES.map(function (r) {
      return '<option value="' + r + '"' + (r === current ? ' selected' : '') + '>' + r + '</option>';
    }).join('');
  }

  /* ---------- confirm modal + actions ---------- */
  function dispatchAction(type, user) {
    if (type === 'edit') { openEdit(user); return; }
    if (type === 'restore') { handleRestore(user); return; }
    // disable | delete | permanentDelete -> confirm first
    requestConfirm(type, user);
  }

  function requestConfirm(type, payload) {
    pendingAction = { type: type, payload: payload };
    var cfg = CONFIRM_CONFIG[type];
    var v = CONFIRM_VARIANTS[cfg.variant] || CONFIRM_VARIANTS.success;
    $('confirm-icon-wrap').className = 'mx-auto flex h-12 w-12 items-center justify-center rounded-full ' + v.iconBg;
    $('confirm-icon').className = 'fa-solid ' + v.icon + ' text-[20px] ' + v.iconColor;
    $('confirm-title').textContent = cfg.title;
    $('confirm-message').textContent = cfg.message;
    var btn = $('confirm-btn');
    btn.textContent = cfg.confirmLabel;
    btn.className = 'flex-1 cursor-pointer rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors duration-150 ' + v.button;
    openModal('modal-confirm');
  }

  $('confirm-btn').addEventListener('click', function () { confirmPendingAction(); });

  function showToast(message, type) {
    var s = TOAST_STYLES[type] || TOAST_STYLES.success;
    $('toast-inner').className = 'flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-semibold text-white shadow-2xl ' + s.bg;
    $('toast-icon').className = 'fa-solid ' + s.icon + ' text-[20px] shrink-0 text-white';
    $('toast-message').textContent = message;
    $('toast').hidden = false;
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { $('toast').hidden = true; }, 3000);
  }

  function updateStatus(user, newStatus, onSuccess) {
    return fetch('/api/accounts/' + user.id + '/status', {
      method: 'PATCH', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    }).then(function (res) {
      if (!res.ok) {
        return json(res).then(function (body) {
          showToast((body && body.message) || 'Failed to update this account', 'danger');
        });
      }
      return res.json().then(function (updated) {
        var mapped = mapAccount(updated);
        users = users.map(function (u) { return u.id === mapped.id ? mapped : u; });
        viewingUser = null;
        closeModal('modal-details');
        if (onSuccess) onSuccess();
        render();
      });
    }).catch(function () {
      showToast('Failed to update this account', 'danger');
    });
  }

  function handleRestore(user) {
    updateStatus(user, 'Active', function () {
      showToast('User restored successfully', 'success');
    });
  }

  function confirmPendingAction() {
    if (!pendingAction) return;
    var type = pendingAction.type;
    var payload = pendingAction.payload;
    var done = function () { pendingAction = null; closeModal('modal-confirm'); };

    if (type === 'add') {
      var emails = payload.emails, role = payload.role;
      var created = [], alreadyExists = 0, failed = 0;
      var chain = Promise.resolve();
      emails.forEach(function (email) {
        chain = chain.then(function () {
          return fetch('/api/accounts/invite', {
            method: 'POST', credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email, role: role })
          }).then(function (res) {
            if (res.status === 403) { throw { forbidden: true }; }
            if (res.status === 409) { alreadyExists += 1; return; }
            if (!res.ok) { failed += 1; return; }
            return res.json().then(function (u) { created.push(u); });
          }).catch(function (err) {
            if (err && err.forbidden) throw err;
            failed += 1;
          });
        });
      });
      chain.then(function () {
        if (created.length > 0) users = created.map(mapAccount).concat(users);
        if (created.length > 0 && alreadyExists === 0 && failed === 0) closeModal('modal-add');
        var parts = [];
        if (created.length > 0) parts.push(created.length + ' invite' + (created.length > 1 ? 's' : '') + ' sent');
        if (alreadyExists > 0) parts.push(alreadyExists + ' already registered');
        if (failed > 0) parts.push(failed + ' failed');
        showToast(parts.join(', ') || 'Nothing to invite', created.length > 0 && failed === 0 ? 'success' : 'danger');
        render();
        done();
      }).catch(function (err) {
        if (err && err.forbidden) {
          showToast('Only Superadmins can invite new users', 'danger');
          done();
        }
      });
      return;
    }

    if (type === 'save') {
      fetch('/api/accounts/' + payload.id, {
        method: 'PATCH', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: payload.name, role: payload.role })
      }).then(function (res) {
        if (!res.ok) {
          return json(res).then(function (body) {
            showToast((body && body.message) || 'Failed to save changes', 'danger');
          });
        }
        return res.json().then(function (updated) {
          var mapped = mapAccount(updated);
          users = users.map(function (u) { return u.id === mapped.id ? mapped : u; });
          editingUser = null;
          closeModal('modal-edit');
          showToast('Changes saved successfully', 'success');
          render();
        });
      }).catch(function () {
        showToast('Failed to save changes', 'danger');
      }).then(done);
      return;
    }

    if (type === 'disable') {
      updateStatus(payload, 'Disabled', function () { showToast('User disabled successfully', 'warning'); }).then(done);
      return;
    }
    if (type === 'delete') {
      updateStatus(payload, 'Deleted', function () { showToast('User deleted successfully', 'danger'); }).then(done);
      return;
    }
    if (type === 'permanentDelete') {
      fetch('/api/accounts/' + payload.id, { method: 'DELETE', credentials: 'include' })
        .then(function (res) {
          if (!res.ok) {
            return json(res).then(function (body) {
              showToast((body && body.message) || 'Failed to permanently delete this account', 'danger');
            });
          }
          users = users.filter(function (u) { return u.id !== payload.id; });
          viewingUser = null;
          closeModal('modal-details');
          showToast('Account permanently deleted', 'danger');
          render();
        }).catch(function () {
          showToast('Failed to permanently delete this account', 'danger');
        }).then(done);
      return;
    }
    done();
  }

  /* ---------- top-level events ---------- */
  $('accounts-search').addEventListener('input', function (e) {
    search = e.target.value;
    page = 1;
    render();
  });

  $('toggle-disabled').addEventListener('click', function () { toggleViewMode('disabled'); });
  $('toggle-deleted').addEventListener('click', function () { toggleViewMode('deleted'); });
  function toggleViewMode(mode) {
    viewMode = viewMode === mode ? 'normal' : mode;
    statusFilter = 'All';
    page = 1;
    render();
  }

  tableContainer.addEventListener('click', function (e) {
    var trig = e.target.closest('[data-row-menu-trigger]');
    if (trig) {
      e.stopPropagation();
      var willOpen = rowMenu.hidden || rowMenu.dataset.userId !== trig.getAttribute('data-user-id');
      closeAllMenus();
      if (willOpen) openRowMenu(trig, findUser(trig.getAttribute('data-user-id')));
      return;
    }
    var row = e.target.closest('[data-row-open]');
    if (row) openDetails(findUser(row.getAttribute('data-user-id')));
  });

  paginationEl.addEventListener('click', function (e) {
    var btn = e.target.closest('button');
    if (!btn || btn.disabled) return;
    if (btn.dataset.page) { page = parseInt(btn.dataset.page, 10); render(); }
    else if (btn.dataset.pageRel === 'prev') { page = Math.max(1, page - 1); render(); }
    else if (btn.dataset.pageRel === 'next') { page = page + 1; render(); }
  });

  document.addEventListener('click', function () { closeAllMenus(); });
  window.addEventListener('resize', function () { closeAllMenus(); });

  filterInstances.push(setupFilter('filter-role',
    function () { return ['All'].concat(ROLES); },
    function () { return roleFilter; },
    function (v) { roleFilter = v; }));
  filterInstances.push(setupFilter('filter-status',
    function () { return ['All'].concat(FILTERABLE_STATUSES); },
    function () { return statusFilter; },
    function (v) { statusFilter = v; }));

  /* ---------- load ---------- */
  fetch('/api/accounts', { credentials: 'include' })
    .then(function (res) { return res.ok ? res.json() : []; })
    .then(function (accounts) { users = accounts.map(mapAccount); })
    .catch(function () { users = []; })
    .then(function () { render(); });
})();
