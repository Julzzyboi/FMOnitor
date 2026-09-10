/*
 * App-shell interactivity: the mobile sidebar slide-over and the two topbar
 * dropdowns (notifications, profile).
 *
 * In the React app these were three components each with their own useState +
 * useClickOutside + a portal. Same behaviour here, done directly against the
 * DOM the layout already rendered. No framework, no build step - the file is
 * served as-is from /static/js.
 */
(function () {
  'use strict';

  /* ---- Mobile sidebar: #sidebar-open toggles it, #sidebar-backdrop and the
     Esc key close it. On desktop the sidebar is always visible (lg:translate-x-0
     in the markup wins), so this only matters below the lg breakpoint. ---- */
  var sidebar = document.getElementById('app-sidebar');
  var backdrop = document.getElementById('sidebar-backdrop');
  var openBtn = document.getElementById('sidebar-open');

  function openSidebar() {
    if (!sidebar) return;
    sidebar.classList.add('is-open');
    if (backdrop) backdrop.hidden = false;
  }

  function closeSidebar() {
    if (!sidebar) return;
    sidebar.classList.remove('is-open');
    if (backdrop) backdrop.hidden = true;
  }

  if (openBtn) openBtn.addEventListener('click', openSidebar);
  if (backdrop) backdrop.addEventListener('click', closeSidebar);
  // Tapping any nav link closes the slide-over (matches React's onClose on NavLink).
  if (sidebar) {
    sidebar.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        if (window.matchMedia('(max-width: 1023px)').matches) closeSidebar();
      });
    });
  }

  /* ---- Topbar dropdowns: every [data-dropdown] holds a [data-dropdown-trigger]
     button and a [data-dropdown-panel]. Clicking the trigger toggles its panel
     (and closes any other open one); clicking outside or pressing Esc closes
     all of them. Un-hiding the panel re-triggers its CSS dropdown-in animation. ---- */
  var dropdowns = Array.prototype.slice.call(document.querySelectorAll('[data-dropdown]'));

  function closeAllDropdowns(except) {
    dropdowns.forEach(function (dd) {
      if (dd === except) return;
      var panel = dd.querySelector('[data-dropdown-panel]');
      if (panel) panel.hidden = true;
    });
  }

  dropdowns.forEach(function (dd) {
    var trigger = dd.querySelector('[data-dropdown-trigger]');
    var panel = dd.querySelector('[data-dropdown-panel]');
    if (!trigger || !panel) return;

    trigger.addEventListener('click', function (e) {
      e.stopPropagation();
      var willOpen = panel.hidden;
      closeAllDropdowns(dd);
      panel.hidden = !willOpen;
    });

    // Clicks inside the panel shouldn't count as "outside".
    panel.addEventListener('click', function (e) {
      e.stopPropagation();
    });
  });

  document.addEventListener('click', function () {
    closeAllDropdowns(null);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      closeAllDropdowns(null);
      closeSidebar();
    }
  });
})();
