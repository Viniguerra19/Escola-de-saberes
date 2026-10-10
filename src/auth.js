// ============================================
// AUTH
// Email-only access. The server looks up the registered user for each request.
// ============================================

import { STORAGE_KEYS } from './utils/constants.js';
import { getStoredJSON, setStoredJSON, removeStored } from './utils/helpers.js';
import { apiLogin, clearCache } from './api.js';

/**
 * Current user state (in-memory)
 */
let currentUser = null;

/**
 * Get the current logged-in user
 * @returns {object|null}
 */
export function getUser() {
  if (currentUser) return currentUser;
  currentUser = getStoredJSON(STORAGE_KEYS.USER);
  return currentUser;
}

/**
 * Check if user is logged in
 */
export function isLoggedIn() {
  return !!getUser()?.email;
}

/**
 * Check if current user is the master admin
 */
export function isAdmin() {
  const user = getUser();
  if (!user) return false;
  const role = String(user.role || '').toLowerCase().trim();
  return role === 'master_admin';
}

/**
 * Login with email
 * @param {string} email
 * @returns {Promise<object>} user data
 */
export async function login(email) {
  const data = await apiLogin(email);

  if (data.user?.email) {
    setStoredJSON(STORAGE_KEYS.USER, data.user);
    currentUser = data.user;
    return data;
  }

  throw new Error(data.error || 'Falha no login');
}

/**
 * Refresh the stored user's data from the registered email on page load.
 * @returns {Promise<boolean>}
 */
export async function refreshUser() {
  const email = getUser()?.email;
  if (!email) return false;

  try {
    const data = await apiLogin(email);
    if (data.user?.email) {
      setStoredJSON(STORAGE_KEYS.USER, data.user);
      currentUser = data.user;
      return true;
    }
  } catch (error) {
    if (error.code === 'BLOCKED' || error.code === 'DUPLICATE' || error.message === 'E-mail não cadastrado' || error.message === 'A Escola está em atualização. Tente novamente em instantes.') {
      logout();
      return false;
    }
    // Keep the last known user while offline; API calls still check the sheet.
    return !!getUser();
  }
  return false;
}

export function logout() {
  localStorage.removeItem('eds_token'); // Remove tokens left by older versions.
  removeStored(STORAGE_KEYS.USER);
  clearCache();
  currentUser = null;
}
