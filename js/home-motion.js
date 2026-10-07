/* Gaply home motion. Standalone: touches no app logic. Load AFTER js/main.js. */
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!('IntersectionObserver' in window)) return;
  var steps = document.querySelector('.gh-steps');
  if (!steps) return;
  steps.classList.add('gh-armed');
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { steps.classList.add('is-in'); io.disconnect(); }
    });
  }, { threshold: 0.4 });
  io.observe(steps);
})();
