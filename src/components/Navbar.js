// ============================================
// NAVBAR COMPONENT
// Top navigation bar
// ============================================

import { getUser, isAdmin, logout } from '../auth.js';
import { router } from '../router.js';
import { getInitials } from '../utils/helpers.js';

/**
 * Render the Navbar
 * @returns {HTMLElement}
 */
export function renderNavbar() {
  const user = getUser();
  const nav = document.createElement('nav');
  nav.className = 'navbar';
  nav.id = 'main-navbar';

  const initials = user ? getInitials(user.name) : '?';
  const displayName = user ? user.name.split(' ')[0] : '';

  nav.innerHTML = `
    <a href="#/dashboard" class="navbar-brand" id="nav-brand">
      <img src="https://terreiroiansaguerreira.com.br/wp-content/uploads/2026/01/11-96653-7848.png" alt="Logo Terreiro Iansã Guerreira" class="navbar-logo" />
      <span class="navbar-title">Escola de Saberes</span>
    </a>
    <div class="navbar-actions">
      ${isAdmin() ? `
        <button class="btn btn-ghost btn-sm" id="nav-admin-btn">
          ⚙️ Painel Admin
        </button>
      ` : ''}
      <div class="navbar-user">
        <div class="navbar-user-avatar">${initials}</div>
        <span class="navbar-user-name">${displayName}</span>
      </div>
      <button class="btn btn-ghost btn-icon btn-sm" id="nav-logout-btn" title="Sair">
        🚪
      </button>
    </div>
  `;

  // Event: Admin button
  const adminBtn = nav.querySelector('#nav-admin-btn');
  if (adminBtn) {
    adminBtn.addEventListener('click', () => {
      router.navigate('admin');
    });
  }

  // Event: Logout
  const logoutBtn = nav.querySelector('#nav-logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await logout();
      router.navigate('login');
    });
  }

  return nav;
}
