// ============================================
// API LAYER
// Communication with Google Apps Script backend
// ============================================

import { API_URL, STORAGE_KEYS, CACHE_DURATION } from './utils/constants.js';
import { getStoredJSON, setStoredJSON } from './utils/helpers.js';

/**
 * Make a request to the Apps Script API
 * @param {string} action - The action to call
 * @param {object} params - Parameters to send
 * @param {string} method - GET or POST
 * @returns {Promise<object>}
 */
async function apiRequest(action, params = {}, method = 'POST') {
  const token = localStorage.getItem(STORAGE_KEYS.TOKEN);

  try {
    let response;

    if (method === 'GET') {
      const searchParams = new URLSearchParams({ action, ...params });
      if (token) searchParams.set('token', token);
      response = await fetch(`${API_URL}?${searchParams.toString()}`);
    } else {
      response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action, token, ...params }),
      });
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    return data;
  } catch (err) {
    console.error(`API Error [${action}]:`, err);
    throw err;
  }
}

// ============================================
// AUTH ENDPOINTS
// ============================================

export async function apiLogin(email) {
  const data = await apiRequest('login', { email });
  return data;
}

export async function apiValidateToken(token) {
  const data = await apiRequest('validate_token', { token });
  return data;
}

export async function apiLogout() {
  return apiRequest('logout');
}

// ============================================
// STUDENT ENDPOINTS
// ============================================

export async function apiGetCourses() {
  // Check cache first (DISABLED TEMPORARILY FOR TESTING)
  // const cached = getStoredJSON(STORAGE_KEYS.COURSES_CACHE);
  // if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
  //   return cached.data;
  // }

  const data = await apiRequest('get_courses', {}, 'GET');

  // Cache the result
  setStoredJSON(STORAGE_KEYS.COURSES_CACHE, {
    data,
    timestamp: Date.now(),
  });

  return data;
}

export async function apiGetCourseContent(courseId) {
  const cacheKey = STORAGE_KEYS.COURSE_CONTENT_CACHE + courseId;

  // Check cache (DISABLED)
  // const cached = getStoredJSON(cacheKey);
  // if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
  //   return cached.data;
  // }

  const data = await apiRequest('get_course_content', { courseId: courseId }, 'GET');

  setStoredJSON(cacheKey, {
    data,
    timestamp: Date.now(),
  });

  return data;
}

export async function apiGetProgress(courseId) {
  return apiRequest('get_progress', { course_id: courseId }, 'GET');
}

export async function apiMarkComplete(lessonId) {
  return apiRequest('toggle_lesson', { lessonId: lessonId, isComplete: true });
}

export async function apiUnmarkComplete(lessonId) {
  return apiRequest('toggle_lesson', { lessonId: lessonId, isComplete: false });
}

// ============================================
// ADMIN ENDPOINTS
// ============================================

export async function apiAdminDashboard() {
  return apiRequest('admin_dashboard', {}, 'GET');
}

export async function apiAdminGetCourses() {
  return apiRequest('admin_get_courses', {}, 'GET');
}

export async function apiAdminCreateCourse(courseData) {
  return apiRequest('admin_create_course', courseData);
}

export async function apiAdminUpdateCourse(courseId, courseData) {
  return apiRequest('admin_update_course', { course_id: courseId, ...courseData });
}

export async function apiAdminDeleteCourse(courseId) {
  return apiRequest('admin_delete_course', { course_id: courseId });
}

export async function apiAdminCreateModule(courseId, title, order) {
  return apiRequest('admin_create_module', { course_id: courseId, title, order });
}

export async function apiAdminCreateLesson(moduleId, lessonData) {
  return apiRequest('admin_create_lesson', { module_id: moduleId, ...lessonData });
}

export async function apiAdminBulkCreateLessons(moduleId, lessons) {
  return apiRequest('admin_bulk_create_lessons', { module_id: moduleId, lessons });
}

export async function apiAdminUpdateLesson(lessonId, lessonData) {
  return apiRequest('admin_update_lesson', { lesson_id: lessonId, ...lessonData });
}

export async function apiAdminDeleteLesson(lessonId) {
  return apiRequest('admin_delete_lesson', { lesson_id: lessonId });
}

export async function apiAdminReorder(type, ids) {
  return apiRequest('admin_reorder', { type, ids });
}

export async function apiAdminGetUsers() {
  return apiRequest('admin_get_users', {}, 'GET');
}

export async function apiAdminCreateUser(name, email) {
  return apiRequest('admin_create_user', { name, email });
}

export async function apiAdminImportUsers(csvData) {
  return apiRequest('admin_import_users', { csv_data: csvData });
}

export async function apiAdminExportUsers() {
  return apiRequest('admin_export_users', {}, 'GET');
}

export async function apiAdminToggleAccess(userEmail, courseSlug, grant) {
  return apiRequest('admin_toggle_access', {
    user_email: userEmail,
    course_slug: courseSlug,
    grant,
  });
}

export async function apiAdminBlockUser(userEmail) {
  return apiRequest('admin_block_user', { user_email: userEmail });
}

export async function apiAdminEngagement() {
  return apiRequest('admin_engagement', {}, 'GET');
}

/**
 * Clear all caches
 */
export function clearCache() {
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith('eds_') && key !== STORAGE_KEYS.TOKEN && key !== STORAGE_KEYS.USER) {
      localStorage.removeItem(key);
    }
  });
}
