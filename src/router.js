// ============================================
// ROUTER
// Hash-based SPA Router
// ============================================

class Router {
  constructor() {
    this.routes = {};
    this.currentRoute = null;
    this.params = {};
    this.beforeEach = null;

    window.addEventListener('hashchange', () => this._resolve());
  }

  /**
   * Register a route handler
   * @param {string} path - Route path (e.g. "dashboard", "course/:id")
   * @param {Function} handler - Function(params) that renders the page
   */
  on(path, handler) {
    this.routes[path] = handler;
    return this;
  }

  /**
   * Set a guard function called before each navigation
   * @param {Function} guard - Function(route, params) => boolean
   */
  guard(fn) {
    this.beforeEach = fn;
    return this;
  }

  /**
   * Navigate to a hash route
   */
  navigate(path) {
    window.location.hash = `#/${path}`;
  }

  /**
   * Get the current hash path
   */
  getPath() {
    const hash = window.location.hash.slice(2) || ''; // Remove #/
    return hash;
  }

  /**
   * Start the router (resolve current hash)
   */
  start() {
    this._resolve();
  }

  /**
   * Internal: resolve the current hash to a route handler
   */
  _resolve() {
    const path = this.getPath();
    const segments = path.split('/').filter(Boolean);

    // Try exact match first
    if (this.routes[path]) {
      if (this._guard(path, {})) {
        this.currentRoute = path;
        this.params = {};
        this.routes[path]({});
      }
      return;
    }

    // Try parameterized routes
    for (const [routePath, handler] of Object.entries(this.routes)) {
      const routeSegments = routePath.split('/').filter(Boolean);

      if (routeSegments.length !== segments.length) continue;

      const params = {};
      let match = true;

      for (let i = 0; i < routeSegments.length; i++) {
        if (routeSegments[i].startsWith(':')) {
          params[routeSegments[i].slice(1)] = decodeURIComponent(segments[i]);
        } else if (routeSegments[i] !== segments[i]) {
          match = false;
          break;
        }
      }

      if (match) {
        if (this._guard(routePath, params)) {
          this.currentRoute = routePath;
          this.params = params;
          handler(params);
        }
        return;
      }
    }

    // No match → default to login or dashboard
    this.navigate('login');
  }

  _guard(route, params) {
    if (this.beforeEach) {
      return this.beforeEach(route, params);
    }
    return true;
  }
}

// Singleton instance
export const router = new Router();
