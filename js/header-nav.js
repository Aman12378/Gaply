/* Gaply header: Workspace dropdown only. Touches no app logic. Load AFTER js/main.js. */
(function () {
  var btn = document.getElementById('workspace-btn');
  var menu = document.getElementById('workspace-menu');
  if (!btn || !menu) return;
  function set(open) { menu.classList.toggle('is-open', open); btn.setAttribute('aria-expanded', String(open)); }
  btn.addEventListener('click', function (e) { e.stopPropagation(); set(!menu.classList.contains('is-open')); });
  menu.addEventListener('click', function (e) { if (e.target.closest('button')) set(false); });
  document.addEventListener('click', function (e) { if (!menu.contains(e.target) && !btn.contains(e.target)) set(false); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && menu.classList.contains('is-open')) { set(false); btn.focus(); }
  });
  var chip = document.getElementById('user-avatar-chip');   /* keyboard access for the profile chip */
  if (chip) chip.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); chip.click(); }
  });
})();
