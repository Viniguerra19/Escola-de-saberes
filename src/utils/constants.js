// ============================================
// CONSTANTS
// Configuration, URLs, and enums
// ============================================

// Google Apps Script Web App URL (replace after deploying)
export const API_URL = 'https://script.google.com/macros/s/AKfycbyj_CkCNls8hg6673BwPx5Ba8n8qbFzMipn4wUJOZ7zZmRNlfYcfFi4s0f9Xhf4Coih9w/exec';

// Google Spreadsheet ID
export const SPREADSHEET_ID = '1N8gsG2A99KI1f-DuoPYffTrvIqHzjDQb-5_voIu4QWc';

// Local Storage Keys
export const STORAGE_KEYS = {
  TOKEN: 'eds_token',
  USER: 'eds_user',
  COURSES_CACHE: 'eds_courses_cache',
  COURSE_CONTENT_CACHE: 'eds_course_content_',
};

// Cache duration (in ms) — 5 minutes
export const CACHE_DURATION = 5 * 60 * 1000;

// Lesson type icons (emoji)
export const LESSON_TYPE_ICONS = {
  video: '🎬',
  audio: '🎧',
  pdf: '📄',
  image: '🖼️',
  slide: '📊',
  flashcard: '🃏',
};

// Lesson type labels
export const LESSON_TYPE_LABELS = {
  video: 'Vídeo',
  audio: 'Áudio',
  pdf: 'PDF',
  image: 'Imagem',
  slide: 'Slides',
  flashcard: 'Flashcard',
};

// Routes
export const ROUTES = {
  LOGIN: 'login',
  DASHBOARD: 'dashboard',
  COURSE: 'course',        // course/:courseId
  ADMIN: 'admin',
  ADMIN_COURSES: 'admin/courses',
  ADMIN_LESSONS: 'admin/lessons',
  ADMIN_USERS: 'admin/users',
  ADMIN_ACCESS: 'admin/access',
};

// Google Drive URL helpers
export const drivePreviewUrl = (fileId) =>
  `https://drive.google.com/file/d/${fileId}/preview`;

export const driveThumbnailUrl = (fileId) =>
  `https://drive.google.com/uc?export=view&id=${fileId}`;

export const driveDownloadUrl = (fileId) =>
  `https://drive.google.com/uc?export=download&id=${fileId}`;

// Extract file ID from Google Drive URL
export const extractDriveFileId = (url) => {
  if (!url) return null;
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
};

// Extract YouTube ID from various YouTube URLs
export const extractYouTubeId = (url) => {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|live\/))([^?&]+)/);
  return match ? match[1] : null;
};
