// ============================================
// ADMIN PAGE — Painel Administrativo
// Dashboard + Cursos + Usuários (Tab Layout)
// ============================================

import { isAdmin, getUser } from '../auth.js';
import { router } from '../router.js';
import { LESSON_TYPE_ICONS } from '../utils/constants.js';

const API_URL = 'https://script.google.com/macros/s/AKfycbyj_CkCNls8hg6673BwPx5Ba8n8qbFzMipn4wUJOZ7zZmRNlfYcfFi4s0f9Xhf4Coih9w/exec';

async function apiAdmin(action, params = {}) {
  const token = localStorage.getItem('eds_token');
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify({ action, token, ...params }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data;
}

// ==============================
// HELPERS
// ==============================
function showModal(title, bodyHtml, footerHtml) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  
  const modal = document.createElement('div');
  modal.className = 'modal';
  
  modal.innerHTML = `
    <div class="modal-header">
      <h3 class="modal-title">${title}</h3>
      <button class="modal-close">&times;</button>
    </div>
    <div class="modal-body">${bodyHtml}</div>
    <div class="modal-footer">${footerHtml}</div>
  `;
  
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  
  // Close on click outside
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });
  
  // Close button
  modal.querySelector('.modal-close').addEventListener('click', () => {
    overlay.remove();
  });
  
  return overlay;
}

// ==============================
// PDF GENERATION
// ==============================
async function generatePdfReport(engagement, selectedCourse = 'ALL') {
  const printBtn = document.getElementById('btn-print-report');
  const originalText = printBtn ? printBtn.textContent : '📄 Relatório (PDF)';
  if (printBtn) {
    printBtn.textContent = "Gerando dados...";
    printBtn.disabled = true;
  }

  try {
    // Fetch absolute user list so no student is left behind (even with 0 courses)
    const { users: allUsers } = await apiAdmin('admin_get_users');
    
    // Use an array to allow duplicate entries (same email, different rows)
    const usersMap = {};
    allUsers.forEach((u, idx) => {
       // Fallback to name+email if rowIndex missing, just to ensure uniqueness
       const key = u._rowIndex ? String(u._rowIndex) : (u.email + idx);
       usersMap[key] = { 
         name: u.name || u.email, 
         email: u.email, 
         turma: u.turma,
         totalProgress: 0, 
         count: 0,
         _key: key 
       };
    });

    // Aggregate individual course progresses into a general average per user
    engagement.forEach((e, idx) => {
      // Find matching user in map (ideally by rowIndex if engagement had it, but we can match by email)
      // Since engagement only gives userEmail, if there are duplicates we just attribute to all of them,
      // or we find the FIRST matching user by email.
      const matchKey = Object.keys(usersMap).find(k => String(usersMap[k].email).toLowerCase() === String(e.userEmail).toLowerCase());
      
      if (matchKey) {
        usersMap[matchKey].totalProgress += e.progress;
        usersMap[matchKey].count += 1;
      } else {
        // Fallback for isolated engagement rows that didn't map
        usersMap['unmatched_' + idx] = { name: e.userName, email: e.userEmail, turma: '-', totalProgress: e.progress, count: 1 };
      }
    });

    const users = Object.values(usersMap).map(u => ({
      name: u.name,
      email: u.email,
      turma: u.turma,
      avgProgress: u.count > 0 ? Math.round(u.totalProgress / u.count) : 0
    })).sort((a, b) => b.avgProgress - a.avgProgress);

  // Rankings
  const top10 = users.slice(0, 10);
  const bottom10 = [...users].reverse().slice(0, 10);
  
  // Sorting full list alphabetically
  const alphabeticalUsers = [...users].sort((a, b) => a.name.localeCompare(b.name));

  // Build Off-Screen Print Container
  let printDiv = document.getElementById('print-report-container');
  if (!printDiv) {
    printDiv = document.createElement('div');
    printDiv.id = 'print-report-container';
    document.body.appendChild(printDiv);
  }

  const styles = `
    <style>
      @media print {
        body * { visibility: hidden; }
        #print-report-container, #print-report-container * { visibility: visible; }
        #print-report-container { 
          position: absolute; left: 0; top: 0; width: 100%; padding: 20px; 
          font-family: 'Inter', system-ui, sans-serif; color: #111; 
        }
        #app { display: none !important; }
        .pr-header { text-align: center; margin-bottom: 40px; }
        .pr-title { font-size: 26px; font-weight: 700; margin-bottom: 5px; color: #000; }
        .pr-subtitle { font-size: 14px; color: #555; }
        .pr-section { margin-bottom: 40px; page-break-inside: avoid; }
        .pr-section-title { font-size: 18px; font-weight: 600; border-bottom: 2px solid #ccc; padding-bottom: 8px; margin-bottom: 15px; color: #222; }
        .pr-table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
        .pr-table th, .pr-table td { border: 1px solid #ddd; padding: 10px 12px; text-align: left; font-size: 14px; color: #333; }
        .pr-table th { background: #f4f4f4; font-weight: 600; color: #111; }
        .pr-badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 700; text-align: center; width: 45px; }
        .bg-green { background: #e0f2e9; color: #2e8b57; }
        .bg-red { background: #ffebee; color: #c62828; }
        .bg-gray { background: #f0f0f0; color: #555; }
        
        @page { margin: 1.5cm; }
      }
      @media screen {
        #print-report-container { display: none; }
      }
    </style>
  `;

  const tableHtml = (data, badgeClassStyle) => `
    <table class="pr-table">
      <thead>
        <tr>
          <th style="width: 8%;">Pos</th>
          <th style="width: 32%;">Nome do Aluno</th>
          <th style="width: 30%;">E-mail</th>
          <th style="width: 15%;">Turma (Planilha)</th>
          <th style="width: 15%; text-align: center;">${selectedCourse === 'ALL' ? 'Média Geral' : 'Progresso'}</th>
        </tr>
      </thead>
      <tbody>
        ${data.map((u, i) => {
          let badgeClass = badgeClassStyle;
          if (badgeClassStyle === 'dynamic') {
             badgeClass = u.avgProgress >= 70 ? 'bg-green' : (u.avgProgress < 30 ? 'bg-red' : 'bg-gray');
          }
          return `
          <tr>
            <td style="text-align: center; font-weight: bold; color: #777;">${i + 1}º</td>
            <td><strong>${u.name}</strong></td>
            <td style="color: #666; font-size: 12px;">${u.email}</td>
            <td style="color: #444; font-size: 12px; font-weight: 500;">${u.turma || '-'}</td>
            <td style="text-align: center;"><span class="pr-badge ${badgeClass}">${u.avgProgress}%</span></td>
          </tr>
        `}).join('')}
      </tbody>
    </table>
  `;

  const today = new Date().toLocaleDateString('pt-BR');

  printDiv.innerHTML = `
    ${styles}
    <div class="pr-header">
      <h1 class="pr-title">Relatório de Desempenho Institucional</h1>
      <p class="pr-subtitle">Escola de Saberes • Gerado em ${today}${selectedCourse !== 'ALL' ? ` • Curso: ${selectedCourse}` : ' • Todos os Cursos'}</p>
    </div>
    
    <div class="pr-section">
      <h2 class="pr-section-title">🏆 Top 10 Melhores Alunos (${selectedCourse === 'ALL' ? 'Maior Média Geral' : 'Maior Progresso'})</h2>
      ${tableHtml(top10, 'bg-green')}
    </div>

    <div class="pr-section">
      <h2 class="pr-section-title">⚠️ Atenção: Alunos com Baixo Engajamento</h2>
      ${tableHtml(bottom10, 'bg-red')}
    </div>

    <div class="pr-section" style="page-break-before: always;">
      <h2 class="pr-section-title">📋 Relatório Integral (A-Z)</h2>
      ${tableHtml(alphabeticalUsers, 'dynamic')}
    </div>
  `;

  // Start print cycle
  setTimeout(() => window.print(), 300);

  } catch (err) {
    showToast("Erro ao preparar PDF: " + err.message, "error");
  } finally {
    if (printBtn) {
       printBtn.textContent = originalText;
       printBtn.disabled = false;
    }
  }
};

function showToast(msg, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span class="toast-icon">${icons[type]}</span><span class="toast-message">${msg}</span>`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

// ==============================
// MAIN RENDER
// ==============================
export async function renderAdminPage() {
  if (!isAdmin()) {
    router.navigate('dashboard');
    return document.createElement('div');
  }

  const page = document.createElement('div');
  page.innerHTML = `
    <nav class="navbar">
      <div class="navbar-brand">
        <span class="navbar-title">🛡️ Painel Administrativo</span>
      </div>
      <div class="navbar-actions">
        <button class="btn btn-ghost btn-sm" id="admin-back-btn">← Voltar ao LMS</button>
      </div>
    </nav>
    <div class="page-container">
      <div class="admin-tabs" id="admin-tabs">
        <button class="admin-tab active" data-tab="dashboard">📊 Dashboard</button>
        <button class="admin-tab" data-tab="courses">📚 Cursos</button>
        <button class="admin-tab" data-tab="users">👥 Usuários</button>
      </div>
      <div id="admin-content">
        <div class="loading-screen"><div class="spinner spinner-lg"></div></div>
      </div>
    </div>
  `;

  // Back button
  page.querySelector('#admin-back-btn').addEventListener('click', () => router.navigate('dashboard'));

  // Tab navigation
  const tabs = page.querySelectorAll('.admin-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const target = tab.dataset.tab;
      if (target === 'dashboard') loadDashboard(page);
      else if (target === 'courses') loadCourses(page);
      else if (target === 'users') loadUsers(page);
    });
  });

  // Load initial
  setTimeout(() => loadDashboard(page), 100);

  return page;
}

// ==============================
// TAB: DASHBOARD
// ==============================
async function loadDashboard(page) {
  const content = page.querySelector('#admin-content');
  content.innerHTML = '<div class="loading-screen"><div class="spinner spinner-lg"></div></div>';

  try {
    const data = await apiAdmin('admin_dashboard');
    const { stats, engagement } = data;

    content.innerHTML = `
      <div class="admin-stats-grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));">
        <div class="stat-card">
          <div class="stat-icon stat-icon-blue">👥</div>
          <div class="stat-info"><h4>${stats.totalUsers}</h4><p>Alunos totais</p></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon stat-icon-amber">📅</div>
          <div class="stat-info"><h4>${stats.totalUsersSexta}</h4><p>Turma de Sexta</p></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon stat-icon-amber">📅</div>
          <div class="stat-info"><h4>${stats.totalUsersSabado}</h4><p>Turma de Sábado</p></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon stat-icon-green">📚</div>
          <div class="stat-info"><h4>${stats.totalCourses}</h4><p>Cursos ativos</p></div>
        </div>
      </div>

      <div class="card" style="overflow-x: auto;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: var(--space-md);">
          <h3>Engajamento dos Alunos</h3>
          ${engagement.length > 0 ? `
            <div style="display: flex; gap: 8px; align-items: center;">
              <select id="report-course-filter" class="input input-sm" style="max-width: 250px;">
                <option value="ALL">Todos os Cursos</option>
                ${[...new Set(engagement.map(e => e.courseTitle))].map(c => `<option value="${c}">${c}</option>`).join('')}
              </select>
              <button id="btn-print-report" class="btn btn-outline btn-sm">📄 Relatório (PDF)</button>
            </div>
          ` : ''}
        </div>
        ${engagement.length > 0 ? `
          <table class="data-table">
            <thead>
              <tr>
                <th>Aluno</th>
                <th>Curso</th>
                <th>Progresso</th>
                <th>Aulas</th>
              </tr>
            </thead>
            <tbody>
              ${engagement.map(e => `
                <tr>
                  <td>
                    <div style="font-weight:500; color: var(--text-primary);">${e.userName}</div>
                    <div style="font-size: 0.75rem; color: var(--text-muted);">${e.userEmail}</div>
                  </td>
                  <td>${e.courseTitle}</td>
                  <td>
                    <div style="display:flex; align-items:center; gap: 8px;">
                      <div style="flex:1; height:8px; background:var(--bg-card-hover); border-radius:4px; overflow:hidden; min-width: 80px;">
                        <div style="height:100%; width:${e.progress}%; background: ${e.progress < 30 ? 'var(--accent-danger)' : e.progress < 70 ? 'var(--accent-warning)' : 'var(--accent-success)'}; border-radius:4px; transition: width 0.5s;"></div>
                      </div>
                      <span style="font-weight:600; font-size:0.8125rem; min-width:35px;">${e.progress}%</span>
                    </div>
                  </td>
                  <td style="white-space:nowrap;">${e.completedCount}/${e.totalLessons}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : '<p style="color: var(--text-muted);">Nenhum dado de progresso encontrado ainda.</p>'}
      </div>
    `;

    // Bind PDF Generation
    const printBtn = content.querySelector('#btn-print-report');
    if (printBtn) {
      printBtn.addEventListener('click', () => {
        const filterSelect = content.querySelector('#report-course-filter');
        const selectedCourse = filterSelect ? filterSelect.value : 'ALL';
        let filteredEngagement = engagement;
        if (selectedCourse !== 'ALL') {
          filteredEngagement = engagement.filter(e => e.courseTitle === selectedCourse);
        }
        generatePdfReport(filteredEngagement, selectedCourse);
      });
    }

  } catch (err) {
    content.innerHTML = `<div class="empty-state"><div class="empty-state-icon">⚠️</div><h3>Erro ao carregar dashboard</h3><p>${err.message}</p></div>`;
  }
}

// ==============================
// TAB: COURSES
// ==============================
async function loadCourses(page) {
  const content = page.querySelector('#admin-content');
  
  // Capture currently open accordions before wiping the DOM
  const openCourses = new Set();
  const openModules = new Set();
  
  if (content.querySelector('#courses-tree')) {
    content.querySelectorAll('.admin-course-group').forEach(group => {
      const header = group.querySelector('.admin-course-header');
      const courseId = header.querySelector('.btn-edit-course').dataset.id;
      const contentDiv = header.nextElementSibling;
      if (contentDiv && contentDiv.style.display === 'block') {
        openCourses.add(courseId);
      }
      
      const moduleGroups = group.querySelectorAll('.admin-module-group');
      moduleGroups.forEach(mGroup => {
        const mHeader = mGroup.querySelector('.admin-module-header');
        const addLessonBtn = mHeader.querySelector('.btn-add-lesson');
        if (addLessonBtn) {
          const moduleId = addLessonBtn.dataset.moduleId;
          const mContentDiv = mHeader.nextElementSibling;
          if (mContentDiv && mContentDiv.style.display === 'block') {
            openModules.add(moduleId);
          }
        }
      });
    });
  }

  content.innerHTML = '<div class="loading-screen"><div class="spinner spinner-lg"></div></div>';

  try {
    const data = await apiAdmin('admin_get_courses');
    const { courses } = data;

    content.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: var(--space-lg);">
        <h3>Gerenciar Cursos</h3>
        <button class="btn btn-primary btn-sm" id="btn-new-course">+ Novo Curso</button>
      </div>
      <div id="courses-tree">
        ${courses.map(c => `
          <div class="card admin-course-group" style="margin-bottom: var(--space-md);">
            <div class="admin-course-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 0px; cursor: pointer; user-select: none;">
              <div style="flex:1;">
                <h4 style="color: var(--text-primary); margin-bottom: 4px; display:inline-flex; align-items:center; gap:6px;">
                  <span class="course-arrow" style="font-size:0.7em; transition: transform 0.2s;">▶</span>
                  ${c.title}
                </h4>
                <div style="margin-top: 4px;">
                  <span class="badge badge-primary">${c.totalLessons} aulas</span>
                  ${c.modules.length > 0 ? `<span class="badge badge-success" style="margin-left:4px;">${c.modules.length} módulos</span>` : ''}
                  ${c.turma ? `<span class="badge" style="margin-left:4px; background:var(--accent-primary); color:white;">Turma: ${c.turma}</span>` : ''}
                </div>
              </div>
              <div style="display:flex; gap: 6px;" class="admin-course-actions">
                <button class="btn btn-ghost btn-sm btn-edit-course" data-id="${c.id}" data-title="${c.title}" data-desc="${c.description || ''}" data-cover="${c.coverUrl || ''}" data-turma="${c.turma || ''}">✏️</button>
                <button class="btn btn-ghost btn-sm btn-add-module" data-course-id="${c.id}">+ Módulo</button>
                <button class="btn btn-danger btn-sm btn-delete-course" data-id="${c.id}" data-title="${c.title}">🗑️</button>
              </div>
            </div>

            <div class="admin-course-content" style="display:none; margin-top: var(--space-md); border-top: 1px solid var(--border-color); padding-top: var(--space-md);">
              ${c.modules.map(m => `
                <div class="admin-module-group" style="margin-left: var(--space-md); border-left: 2px solid var(--accent-primary); margin-bottom: var(--space-sm);">
                  <div class="admin-module-header" style="display:flex; justify-content:space-between; align-items:center; padding: 6px 12px; cursor: pointer; user-select: none;">
                    <span style="font-weight:600; font-size:0.875rem; color: var(--text-secondary); display:flex; align-items:center; gap:6px;">
                      <span class="module-arrow" style="font-size:0.7em; transition: transform 0.2s;">▶</span>
                      📁 ${m.title}
                    </span>
                    <div class="admin-module-actions">
                      <button class="btn btn-ghost btn-sm btn-bulk-slides" data-module-id="${m.id}" data-module-title="${m.title}">📚 +Lote Slides</button>
                      <button class="btn btn-ghost btn-sm btn-add-lesson" data-module-id="${m.id}" data-module-title="${m.title}">+ Aula</button>
                    </div>
                  </div>
                  
                  <div class="admin-module-content" style="display:none; padding-bottom: var(--space-xs);">
                    ${m.lessons.map(l => `
                      <div class="lesson-tree-item" style="display:flex; align-items:center; gap: 8px; padding: 6px 12px; margin-left: 14px; border-radius: var(--radius-sm); transition: background 0.15s;" onmouseenter="this.style.background='var(--bg-card-hover)'" onmouseleave="this.style.background='transparent'">
                        <span style="font-size:0.8rem; opacity:0.5;">${LESSON_TYPE_ICONS[l.type] || '📄'}</span>
                        <span style="flex:1; font-size:0.8125rem; color: var(--text-secondary);">${l.title}</span>
                        <span class="badge" style="font-size:0.65rem; padding: 2px 6px; background: var(--bg-card-hover); color: var(--text-muted);">${l.type}</span>
                        <button class="btn btn-ghost btn-sm btn-edit-lesson" data-id="${l.id}" data-title="${l.title}" data-type="${l.type}" data-url="${l.url}" style="padding:4px 8px; font-size:0.75rem;">✏️</button>
                        <button class="btn btn-ghost btn-sm btn-delete-lesson" data-id="${l.id}" data-title="${l.title}" style="padding:4px 8px; font-size:0.75rem; color: var(--accent-danger);">🗑️</button>
                      </div>
                    `).join('')}
                    ${m.lessons.length === 0 ? '<div style="margin-left: 26px; font-size:0.75rem; color: var(--text-muted);">Nenhuma aula neste módulo.</div>' : ''}
                  </div>
                </div>
              `).join('')}
              ${c.modules.length === 0 ? '<div style="font-size:0.875rem; color: var(--text-muted);">Nenhum módulo cadastrado neste curso.</div>' : ''}
            </div>
          </div>
        `).join('')}
      </div>
    `;

    // --- ACCORDION BINDINGS ---
    content.querySelectorAll('.admin-course-header').forEach(header => {
      header.addEventListener('click', (e) => {
        // Prevent toggle if clicking action buttons
        if(e.target.closest('.admin-course-actions')) return;
        
        const contentDiv = header.nextElementSibling;
        const arrow = header.querySelector('.course-arrow');
        if (contentDiv.style.display === 'none') {
          contentDiv.style.display = 'block';
          arrow.style.transform = 'rotate(90deg)';
        } else {
          contentDiv.style.display = 'none';
          arrow.style.transform = 'rotate(0deg)';
        }
      });
    });

    content.querySelectorAll('.admin-module-header').forEach(header => {
      header.addEventListener('click', (e) => {
        if(e.target.closest('.admin-module-actions')) return;

        const contentDiv = header.nextElementSibling;
        const arrow = header.querySelector('.module-arrow');
        if (contentDiv.style.display === 'none') {
          contentDiv.style.display = 'block';
          arrow.style.transform = 'rotate(90deg)';
        } else {
          contentDiv.style.display = 'none';
          arrow.style.transform = 'rotate(0deg)';
        }
      });
    });

    // --- RESTORE ACCORDION STATE ---
    if (openCourses.size > 0 || openModules.size > 0) {
      content.querySelectorAll('.admin-course-group').forEach(group => {
        const header = group.querySelector('.admin-course-header');
        const courseId = header.querySelector('.btn-edit-course').dataset.id;
        
        if (openCourses.has(courseId)) {
          const contentDiv = header.nextElementSibling;
          const arrow = header.querySelector('.course-arrow');
          if (contentDiv) {
            contentDiv.style.display = 'block';
            if (arrow) arrow.style.transform = 'rotate(90deg)';
          }
        }
        
        group.querySelectorAll('.admin-module-group').forEach(mGroup => {
          const mHeader = mGroup.querySelector('.admin-module-header');
          const addLessonBtn = mHeader.querySelector('.btn-add-lesson');
          if (addLessonBtn && openModules.has(addLessonBtn.dataset.moduleId)) {
            const mContentDiv = mHeader.nextElementSibling;
            const arrow = mHeader.querySelector('.module-arrow');
            if (mContentDiv) {
               mContentDiv.style.display = 'block';
               if (arrow) arrow.style.transform = 'rotate(90deg)';
            }
          }
        });
      });
    }

    // --- EVENT BINDINGS (CRUD) ---

    // New Course
    content.querySelector('#btn-new-course')?.addEventListener('click', () => {
      const modal = showModal('Criar Novo Curso', `
        <div class="input-group" style="margin-bottom: var(--space-md);">
          <label>Título do Curso</label>
          <input class="input" id="mc-title" placeholder="Ex: Desenvolvimento Mediúnico" />
        </div>
        <div class="input-group" style="margin-bottom: var(--space-md);">
          <label>URL da Imagem (Capa)</label>
          <input class="input" id="mc-cover" placeholder="URL da imagem (Google Drive ou Hospedagem externa)" />
        </div>
        <div class="input-group" style="margin-bottom: var(--space-md);">
          <label>Turma Restrita (Opcional)</label>
          <input class="input" id="mc-turma" placeholder="Ex: Sexta" />
          <small style="color:var(--text-muted);font-size:0.75rem;">Deixe em branco para todos.</small>
        </div>
        <div class="input-group">
          <label>Descrição</label>
          <textarea class="input" id="mc-desc" placeholder="Breve descrição do curso..."></textarea>
        </div>
      `, `<button class="btn btn-primary" id="mc-save">Criar Curso</button>`);

      modal.querySelector('#mc-save').addEventListener('click', async () => {
        const title = modal.querySelector('#mc-title').value.trim();
        if (!title) return;
        try {
          await apiAdmin('admin_create_course', { 
            title, 
            description: modal.querySelector('#mc-desc').value.trim(),
            coverUrl: modal.querySelector('#mc-cover').value.trim(),
            turma: modal.querySelector('#mc-turma').value.trim()
          });
          modal.remove();
          showToast('Curso criado com sucesso!', 'success');
          loadCourses(page);
        } catch (err) { showToast(err.message, 'error'); }
      });
    });

    // Edit Course
    content.querySelectorAll('.btn-edit-course').forEach(btn => {
      btn.addEventListener('click', () => {
        const modal = showModal('Editar Curso', `
          <div class="input-group" style="margin-bottom: var(--space-md);">
            <label>Título</label>
            <input class="input" id="ec-title" value="${btn.dataset.title}" />
          </div>
          <div class="input-group" style="margin-bottom: var(--space-md);">
            <label>URL da Imagem (Capa)</label>
            <input class="input" id="ec-cover" value="${btn.dataset.cover}" placeholder="URL da imagem" />
          </div>
          <div class="input-group" style="margin-bottom: var(--space-md);">
            <label>Turma Restrita (Opcional)</label>
            <input class="input" id="ec-turma" value="${btn.dataset.turma}" placeholder="Ex: Sexta" />
          </div>
          <div class="input-group">
            <label>Descrição</label>
            <textarea class="input" id="ec-desc">${btn.dataset.desc}</textarea>
          </div>
        `, `<button class="btn btn-primary" id="ec-save">Salvar</button>`);

        modal.querySelector('#ec-save').addEventListener('click', async () => {
          try {
            await apiAdmin('admin_update_course', {
              courseId: btn.dataset.id,
              title: modal.querySelector('#ec-title').value.trim(),
              description: modal.querySelector('#ec-desc').value.trim(),
              coverUrl: modal.querySelector('#ec-cover').value.trim(),
              turma: modal.querySelector('#ec-turma').value.trim()
            });
            modal.remove();
            showToast('Curso atualizado!', 'success');
            loadCourses(page);
          } catch (err) { showToast(err.message, 'error'); }
        });
      });
    });

    // Delete Course
    content.querySelectorAll('.btn-delete-course').forEach(btn => {
      btn.addEventListener('click', () => {
        const modal = showModal('Excluir Curso', `
          <p style="color: var(--accent-danger); font-weight: 500;">⚠️ Tem certeza que deseja excluir o curso "<strong>${btn.dataset.title}</strong>"?</p>
          <p style="font-size: 0.8125rem; color: var(--text-muted); margin-top: 8px;">Esta ação não pode ser desfeita.</p>
        `, `<button class="btn btn-ghost" id="dc-cancel">Cancelar</button><button class="btn btn-danger" id="dc-confirm">Excluir</button>`);

        modal.querySelector('#dc-cancel').addEventListener('click', () => modal.remove());
        modal.querySelector('#dc-confirm').addEventListener('click', async () => {
          try {
            await apiAdmin('admin_delete_course', { courseId: btn.dataset.id });
            modal.remove();
            showToast('Curso excluído.', 'success');
            loadCourses(page);
          } catch (err) { showToast(err.message, 'error'); }
        });
      });
    });

    // Add Module
    content.querySelectorAll('.btn-add-module').forEach(btn => {
      btn.addEventListener('click', () => {
        const modal = showModal('Novo Módulo', `
          <div class="input-group">
            <label>Título do Módulo</label>
            <input class="input" id="am-title" placeholder="Ex: Quaresma" />
          </div>
        `, `<button class="btn btn-primary" id="am-save">Criar</button>`);

        modal.querySelector('#am-save').addEventListener('click', async () => {
          const title = modal.querySelector('#am-title').value.trim();
          if (!title) return;
          try {
            await apiAdmin('admin_create_module', { courseId: btn.dataset.courseId, title });
            modal.remove();
            showToast('Módulo criado!', 'success');
            loadCourses(page);
          } catch (err) { showToast(err.message, 'error'); }
        });
      });
    });

    // Add Lesson
    content.querySelectorAll('.btn-add-lesson').forEach(btn => {
      btn.addEventListener('click', () => {
        const typeOptions = Object.entries(LESSON_TYPE_ICONS).map(([k, v]) => `<option value="${k}">${v} ${k}</option>`).join('');
        const modal = showModal(`Nova Aula em "${btn.dataset.moduleTitle}"`, `
          <div class="input-group" style="margin-bottom: var(--space-md);">
            <label>Título da Aula</label>
            <input class="input" id="al-title" placeholder="Ex: Introdução à Quaresma" />
          </div>
          <div class="input-group" style="margin-bottom: var(--space-md);">
            <label>Tipo</label>
            <select class="input" id="al-type">${typeOptions}</select>
          </div>
          <div class="input-group">
            <label>URL do Conteúdo</label>
            <input class="input" id="al-url" placeholder="Link do Cloudflare R2 ou Google Drive" />
          </div>
        `, `<button class="btn btn-primary" id="al-save">Criar Aula</button>`);

        modal.querySelector('#al-save').addEventListener('click', async () => {
          const title = modal.querySelector('#al-title').value.trim();
          if (!title) return;
          try {
            await apiAdmin('admin_create_lesson', {
              moduleId: btn.dataset.moduleId,
              title,
              type: modal.querySelector('#al-type').value,
              url: modal.querySelector('#al-url').value.trim()
            });
            modal.remove();
            showToast('Aula criada!', 'success');
            loadCourses(page);
          } catch (err) { showToast(err.message, 'error'); }
        });
      });
    });

    // Add Bulk Slides (Carousel)
    content.querySelectorAll('.btn-bulk-slides').forEach(btn => {
      btn.addEventListener('click', () => {
        const modal = showModal(`Criar Carrossel de Slides: "${btn.dataset.moduleTitle}"`, `
          <div class="input-group" style="margin-bottom: var(--space-md);">
            <label>Título da Aula (Ex: Apresentação Parte 1)</label>
            <input class="input" id="bs-title" value="Apresentação de Slides" />
          </div>
          <div class="input-group" style="margin-bottom: var(--space-md);">
            <label>Quantidade de Slides (Ex: 20)</label>
            <input class="input" type="number" id="bs-count" min="1" value="10" />
          </div>
          <div class="input-group">
            <label>URL Base da Imagem</label>
            <p style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 8px;">Coloque <strong>{n}</strong> onde o número deve entrar. Ex: <code>https://meusite.com/img{n}.jpg</code></p>
            <input class="input" id="bs-url" placeholder="https://cloudflare/img_{n}.png" />
          </div>
        `, `<button class="btn btn-primary" id="bs-save">Gerar Tudo</button>`);

        modal.querySelector('#bs-save').addEventListener('click', async () => {
          const title = modal.querySelector('#bs-title').value;
          const count = parseInt(modal.querySelector('#bs-count').value);
          const urlBase = modal.querySelector('#bs-url').value.trim();
          
          if (!count || isNaN(count)) return showToast('Coloque uma quantidade válida.', 'warning');
          if (!urlBase || !urlBase.includes('{n}')) return showToast('A URL base deve conter a tag {n}', 'warning');

          const submitBtn = modal.querySelector('#bs-save');
          submitBtn.disabled = true;
          submitBtn.textContent = 'Gerando...';

          try {
            const urls = [];
            for (let i = 1; i <= count; i++) {
              urls.push(urlBase.replace('{n}', i));
            }
            
            const carouselUrl = urls.join(',');

            await apiAdmin('admin_create_lesson', { 
              moduleId: btn.dataset.moduleId,
              title: title,
              type: 'slide',
              url: carouselUrl
            });
            
            modal.remove();
            showToast(`${count} slides gerados em lote!`, 'success');
            loadCourses(page);
          } catch (err) { 
            showToast(err.message, 'error'); 
            submitBtn.disabled = false;
            submitBtn.textContent = 'Gerar Tudo';
          }
        });
      });
    });

    // Edit Lesson
    content.querySelectorAll('.btn-edit-lesson').forEach(btn => {
      btn.addEventListener('click', () => {
        const typeOptions = Object.entries(LESSON_TYPE_ICONS).map(([k, v]) => `<option value="${k}" ${k === btn.dataset.type ? 'selected' : ''}>${v} ${k}</option>`).join('');
        const modal = showModal('Editar Aula', `
          <div class="input-group" style="margin-bottom: var(--space-md);">
            <label>Título</label>
            <input class="input" id="el-title" value="${btn.dataset.title}" />
          </div>
          <div class="input-group" style="margin-bottom: var(--space-md);">
            <label>Tipo</label>
            <select class="input" id="el-type">${typeOptions}</select>
          </div>
          <div class="input-group">
            <label>URL do Conteúdo</label>
            <input class="input" id="el-url" value="${btn.dataset.url}" />
          </div>
        `, `<button class="btn btn-primary" id="el-save">Salvar</button>`);

        modal.querySelector('#el-save').addEventListener('click', async () => {
          try {
            await apiAdmin('admin_update_lesson', {
              lessonId: btn.dataset.id,
              title: modal.querySelector('#el-title').value.trim(),
              type: modal.querySelector('#el-type').value,
              url: modal.querySelector('#el-url').value.trim()
            });
            modal.remove();
            showToast('Aula atualizada!', 'success');
            loadCourses(page);
          } catch (err) { showToast(err.message, 'error'); }
        });
      });
    });

    // Delete Lesson
    content.querySelectorAll('.btn-delete-lesson').forEach(btn => {
      btn.addEventListener('click', () => {
        const modal = showModal('Excluir Aula', `
          <p style="color: var(--accent-danger);">⚠️ Excluir "<strong>${btn.dataset.title}</strong>"?</p>
        `, `<button class="btn btn-ghost" id="dl-cancel">Cancelar</button><button class="btn btn-danger" id="dl-confirm">Excluir</button>`);

        modal.querySelector('#dl-cancel').addEventListener('click', () => modal.remove());
        modal.querySelector('#dl-confirm').addEventListener('click', async () => {
          try {
            await apiAdmin('admin_delete_lesson', { lessonId: btn.dataset.id });
            modal.remove();
            showToast('Aula removida.', 'success');
            loadCourses(page);
          } catch (err) { showToast(err.message, 'error'); }
        });
      });
    });

  } catch (err) {
    content.innerHTML = `<div class="empty-state"><div class="empty-state-icon">⚠️</div><h3>Erro ao carregar cursos</h3><p>${err.message}</p></div>`;
  }
}

// ==============================
// TAB: USERS
// ==============================
async function loadUsers(page) {
  const content = page.querySelector('#admin-content');
  content.innerHTML = '<div class="loading-screen"><div class="spinner spinner-lg"></div></div>';

  try {
    const [userData, coursesData] = await Promise.all([
      apiAdmin('admin_get_users'),
      apiAdmin('admin_get_courses')
    ]);
    const { users } = userData;
    const { courses } = coursesData;

    content.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: var(--space-lg);">
        <h3>Gerenciar Usuários</h3>
        <button class="btn btn-primary btn-sm" id="btn-new-user">+ Novo Usuário</button>
      </div>
      <div class="card" style="overflow-x: auto;">
        <table class="data-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>E-mail</th>
              <th>Permissão</th>
              <th>Turma</th>
              <th style="width: 60px;">Ações</th>
            </tr>
          </thead>
          <tbody>
            ${users.map(u => `
              <tr>
                <td style="font-weight:500; color: var(--text-primary);">${u.name}</td>
                <td>${u.email}</td>
                <td><span class="badge ${u.role === 'master_admin' ? 'badge-danger' : 'badge-primary'}">${u.role}</span></td>
                <td>${u.turma}</td>
                <td>
                  <button class="btn btn-ghost btn-sm btn-edit-user" data-email="${u.email}" data-name="${u.name}" data-turma="${u.turma}" data-courses="${u.courses}" title="Editar Acessos">✏️</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    // Edit User Courses
    content.querySelectorAll('.btn-edit-user').forEach(btn => {
      btn.addEventListener('click', () => {
        const userCoursesArray = (btn.dataset.courses || '').toLowerCase().split(',').map(s => s.trim());
        const userTurma = (btn.dataset.turma || '').toLowerCase().trim();
        
        // Group by title + turma to allow explicit turma access
        const uniqueCoursesMap = new Map();
        courses.forEach(c => {
          const turma = (c.turma || '').trim();
          const key = turma ? `${c.title} [${turma}]` : c.title;
          uniqueCoursesMap.set(key, c);
        });
        const uniqueCourses = Array.from(uniqueCoursesMap.values());

        const coursesHtml = uniqueCourses.map(c => {
          const turma = (c.turma || '').trim();
          const identifier = turma ? `${c.title} [${turma}]` : c.title;
          const identifierLower = identifier.toLowerCase();
          const titleLower = c.title.toLowerCase();
          
          let isChecked = false;
          if (userCoursesArray.includes(identifierLower)) {
             isChecked = true;
          } else if (userCoursesArray.includes(titleLower)) {
             // Legacy match: check if the course has no turma or matches user's global turma
             if (!turma) {
                isChecked = true;
             } else {
                const courseTurmaNorm = turma.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
                const userTurmaNorm = userTurma.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
                if (userTurmaNorm && (courseTurmaNorm.includes(userTurmaNorm) || userTurmaNorm.includes(courseTurmaNorm))) {
                   isChecked = true;
                }
             }
          }

          return `
            <div style="display:flex; align-items:center; gap: 8px; margin-bottom: 8px;">
              <input type="checkbox" id="chk-${c.id}" class="course-checkbox" value="${identifier}" ${isChecked ? 'checked' : ''} />
              <label for="chk-${c.id}">${identifier}</label>
            </div>
          `;
        }).join('');

        const modal = showModal(`Editar Acessos - ${btn.dataset.name}`, `
          <div class="input-group" style="margin-bottom: var(--space-md);">
            <label>Turma (Opcional)</label>
            <input class="input" id="eu-turma" value="${btn.dataset.turma}" placeholder="Ex: Sexta" />
          </div>
          <div class="input-group">
            <label>Cursos Liberados</label>
            <div style="background: var(--bg-card); padding: 12px; border-radius: var(--radius-md); border: 1px solid var(--border-color); max-height: 200px; overflow-y: auto;">
               ${coursesHtml.length > 0 ? coursesHtml : '<p style="color:var(--text-muted); font-size: 13px;">Nenhum curso cadastrado no sistema ainda.</p>'}
            </div>
          </div>
        `, `<button class="btn btn-primary" id="eu-save">Salvar Alterações</button>`);

        modal.querySelector('#eu-save').addEventListener('click', async () => {
           const turma = modal.querySelector('#eu-turma').value.trim();
           const checked = Array.from(modal.querySelectorAll('.course-checkbox:checked')).map(cb => cb.value);
           const coursesStr = checked.join(', ');

           try {
              modal.querySelector('#eu-save').textContent = 'Salvando...';
              await apiAdmin('admin_update_user_access', { email: btn.dataset.email, turma, coursesStr });
              modal.remove();
              showToast('Acessos atualizados!', 'success');
              loadUsers(page);
           } catch (err) {
              modal.querySelector('#eu-save').textContent = 'Salvar Alterações';
              showToast(err.message, 'error');
           }
        });
      });
    });

    // New User
    content.querySelector('#btn-new-user')?.addEventListener('click', () => {
      const modal = showModal('Cadastrar Novo Usuário', `
        <div class="input-group" style="margin-bottom: var(--space-md);">
          <label>Nome Completo</label>
          <input class="input" id="nu-name" placeholder="Nome do aluno" />
        </div>
        <div class="input-group">
          <label>E-mail</label>
          <input class="input" id="nu-email" placeholder="email@exemplo.com" type="email" />
        </div>
      `, `<button class="btn btn-primary" id="nu-save">Cadastrar</button>`);

      modal.querySelector('#nu-save').addEventListener('click', async () => {
        const name = modal.querySelector('#nu-name').value.trim();
        const email = modal.querySelector('#nu-email').value.trim();
        if (!name || !email) return showToast('Preencha nome e e-mail.', 'warning');
        try {
          await apiAdmin('admin_create_user', { name, email });
          modal.remove();
          showToast('Usuário cadastrado!', 'success');
          loadUsers(page);
        } catch (err) { showToast(err.message, 'error'); }
      });
    });

  } catch (err) {
    content.innerHTML = `<div class="empty-state"><div class="empty-state-icon">⚠️</div><h3>Erro ao carregar usuários</h3><p>${err.message}</p></div>`;
  }
}
