// ============================================
// MAIN ENTRY POINT
// Application initialization, global CSS, router setup
// ============================================

import './styles/global.css';
import './styles/components.css';
import './styles/layout.css';
import './styles/player.css';

import { router } from './router.js';
import { isLoggedIn, validateSession } from './auth.js';

// Import Pages
import { renderLoginPage } from './pages/LoginPage.js';
import { renderDashboardPage } from './pages/DashboardPage.js';
import { renderCoursePlayerPage } from './pages/CoursePlayerPage.js';
import { renderAdminPage } from './pages/AdminPage.js';

const appConfig = {
  appContainerId: 'app',
};

/**
 * Render a component into the main app container
 * @param {HTMLElement|Promise<HTMLElement>} component
 */
async function render(componentOrPromise) {
  const container = document.getElementById(appConfig.appContainerId);
  if (!container) return;

  // Show global spinner while resolving
  container.innerHTML = '<div class="loading-screen"><div class="spinner spinner-lg"></div></div>';

  try {
    const el = await componentOrPromise;
    container.innerHTML = '';
    
    if (typeof el === 'string') {
      container.innerHTML = el;
    } else {
      container.appendChild(el);
    }
  } catch (error) {
    console.error('Render Error:', error);
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon text-danger">⚠️</div>
        <h3>Erro fatal ao renderizar</h3>
        <p>${error.message}</p>
      </div>
    `;
  }
}

/**
 * Initialize Router and Application
 */
async function initApp() {
  // Validate token silently on boot if exists
  if (isLoggedIn()) {
    await validateSession();
  }

  // --- Router Configuration ---

  // Global Navigation Guard
  router.guard((to, params) => {
    const isAuthRoute = to === 'login';
    const hasSession = isLoggedIn();

    if (!hasSession && !isAuthRoute) {
      // Must be logged in to view other routes
      router.navigate('login');
      return false;
    }

    if (hasSession && isAuthRoute) {
      // Already logged in, no need to see login page
      router.navigate('dashboard');
      return false;
    }

    return true;
  });

  // Define Routes
  router
    .on('login', () => render(renderLoginPage()))
    .on('dashboard', () => render(renderDashboardPage()))
    .on('course/:id', (params) => render(renderCoursePlayerPage(params)))
    .on('admin', () => render(renderAdminPage()));

  // Start Router
  router.start();
}

// Boot
document.addEventListener('DOMContentLoaded', initApp);
