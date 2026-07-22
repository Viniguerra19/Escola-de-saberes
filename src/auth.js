// ============================================
// AUTH
// Session management (token + user in localStorage)
// ============================================

import { STORAGE_KEYS } from './utils/constants.js';
import { getStoredJSON, setStoredJSON, removeStored } from './utils/helpers.js';
import { apiLogin, apiValidateToken, apiLogout, clearCache } from './api.js';

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
  return !!localStorage.getItem(STORAGE_KEYS.TOKEN) && !!getUser();
}

/**
 * Check if current user is the master admin
 */
export function isAdmin() {
  const user = getUser();
  if (!user) return false;
  const role = String(user.role || '').toLowerCase().trim();
  const email = String(user.email || '').toLowerCase().trim();
  return role === 'master_admin' && email === 'viniciusguerra19@icloud.com';
}

/**
 * Login with email
 * @param {string} email
 * @returns {Promise<object>} user data
 */
export async function login(email) {
  const data = await apiLogin(email);

  if (data.token && data.user) {
    localStorage.setItem(STORAGE_KEYS.TOKEN, data.token);
    setStoredJSON(STORAGE_KEYS.USER, data.user);
    currentUser = data.user;
    return data;
  }

  throw new Error(data.error || 'Falha no login');
}

/**
 * Validate current session token
 * @returns {Promise<boolean>}
 */
export async function validateSession() {
  const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
  if (!token) return false;

  try {
    const data = await apiValidateToken(token);
    if (data.valid && data.user) {
      setStoredJSON(STORAGE_KEYS.USER, data.user);
      currentUser = data.user;
      return true;
    }
    // Token invalid — clean up
    logout(false);
    return false;
  } catch {
    // Network error — keep session (offline tolerance)
    return !!getUser();
  }
}

/**
 * Logout
 * @param {boolean} callApi - Whether to call the backend logout endpoint
 */
export async function logout(callApi = true) {
  if (callApi) {
    try {
      await apiLogout();
    } catch {
      // Silent fail — we're logging out anyway
    }
  }

  localStorage.removeItem(STORAGE_KEYS.TOKEN);
  removeStored(STORAGE_KEYS.USER);
  clearCache();
  currentUser = null;
}
