// ============================================
// DASHBOARD PAGE
// Displays grid of courses the user is enrolled in
// ============================================

import { apiGetCourses } from '../api.js';
import { getUser } from '../auth.js';
import { renderNavbar } from '../components/Navbar.js';
import { router } from '../router.js';
import { extractDriveFileId, driveThumbnailUrl } from '../utils/constants.js';

export async function renderDashboardPage() {
  const container = document.createElement('div');
  container.className = 'dashboard-page';

  // Add Navbar
  container.appendChild(renderNavbar());

  const pageContainer = document.createElement('main');
  pageContainer.className = 'page-container animate-fade-in-up';
  
  const user = getUser();
  const userName = user ? user.name.split(' ')[0] : '';
  
  pageContainer.innerHTML = `
    <div class="page-header">
      <h1>Olá, ${userName}! 🌿</h1>
      <p>Bem-vindo(a) à sua área de estudos.</p>
    </div>
    
    <div id="courses-wrapper" class="courses-wrapper">
      <div class="loading-screen" style="min-height: 200px;">
        <div class="spinner"></div>
        <p>Carregando seus cursos...</p>
      </div>
    </div>
  `;

  container.appendChild(pageContainer);

  // Load Courses
  const coursesWrapper = container.querySelector('#courses-wrapper');
  
  try {
    const response = await apiGetCourses();
    const courses = response.courses || [];
    
    if (courses.length === 0) {
      coursesWrapper.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📚</div>
          <h3>Nenhum curso ainda</h3>
          <p>Você ainda não está matriculado(a) em nenhum curso.</p>
        </div>
      `;
      return container;
    }
    
    // Render Grid
    const grid = document.createElement('div');
    grid.className = 'courses-grid';
    
    courses.forEach((course) => {
      const card = document.createElement('div');
      card.className = 'course-card';
      
      const fileId = extractDriveFileId(course.coverUrl);
      const optimizedUrl = fileId ? driveThumbnailUrl(fileId, 600) : course.coverUrl;

      const coverHtml = optimizedUrl 
        ? `<img src="${optimizedUrl}" alt="${course.title}" class="course-card-cover" />`
        : `<div class="course-card-cover-placeholder">📚</div>`;
        
      card.innerHTML = `
        ${coverHtml}
        <div class="course-card-body">
          <h3 class="course-card-title">${course.title}</h3>
          <p class="course-card-desc">${course.description || 'Nenhuma descrição fornecida.'}</p>
        </div>
      `;
      
      card.addEventListener('click', () => {
        router.navigate(`course/${course.id}`);
      });
      
      grid.appendChild(card);
    });
    
    coursesWrapper.innerHTML = '';
    coursesWrapper.appendChild(grid);
    
  } catch (error) {
    console.error('Failed to load courses', error);
    coursesWrapper.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">⚠️</div>
        <h3>Erro ao carregar cursos</h3>
        <p>Não foi possível buscar seus dados. Tente atualizar a página.</p>
      </div>
    `;
  }

  return container;
}
