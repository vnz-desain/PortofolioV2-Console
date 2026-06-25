/* ═══════════════════════════════════════════════════════════
   ROUTER.JS — Simple SPA hash router
═══════════════════════════════════════════════════════════ */

const routes = new Map();
let currentRoute = null;

const router = {
  /**
   * Register a route
   * @param {string} path - e.g. 'dashboard', 'slides', 'skills'
   * @param {Function} handler - called when route activates
   */
  on(path, handler) {
    routes.set(path, handler);
    return this;
  },

  /**
   * Navigate to a route
   */
  go(path) {
    window.location.hash = path;
  },

  /**
   * Start listening to hash changes
   */
  start() {
    window.addEventListener('hashchange', () => this._resolve());
    this._resolve();
  },

  _resolve() {
    const hash = window.location.hash.replace('#', '') || 'dashboard';
    if (currentRoute === hash) return;
    currentRoute = hash;

    /* Update nav active state */
    document.querySelectorAll('.nav-item[data-route]').forEach(el => {
      el.classList.toggle('active', el.dataset.route === hash);
    });

    /* Update topbar title */
    const activeNav = document.querySelector(`.nav-item[data-route="${hash}"]`);
    const titleEl   = document.getElementById('topbar-title');
    if (titleEl && activeNav) titleEl.textContent = activeNav.querySelector('.nav-label')?.textContent || '';

    /* Show/hide pages */
    document.querySelectorAll('.page').forEach(el => {
      el.classList.toggle('active', el.dataset.page === hash);
    });

    /* Call route handler */
    const handler = routes.get(hash);
    if (handler) handler();
    else {
      const fallback = routes.get('dashboard');
      if (fallback) { router.go('dashboard'); }
    }
  },

  current() { return currentRoute; }
};

export { router };
