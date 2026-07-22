// ============================================
// COURSE PLAYER PAGE
// Immersive full-screen learning environment
// ============================================

import { apiGetCourseContent, apiMarkComplete, apiUnmarkComplete } from '../api.js';
import { getInitials } from '../utils/helpers.js';
import { LESSON_TYPE_ICONS, extractDriveFileId, extractYouTubeId, drivePreviewUrl, driveDownloadUrl } from '../utils/constants.js';
import { router } from '../router.js';
import { renderNavbar } from '../components/Navbar.js';

// PDF.js — Mozilla PDF renderer (works on all mobile browsers)
import * as pdfjsLib from 'pdfjs-dist';
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@5.7.284/build/pdf.worker.min.mjs';

export async function renderCoursePlayerPage(params) {
  const courseId = params.id;
  const wrapper = document.createElement('div');
  
  // Appends Navbar at the top of the course player
  wrapper.appendChild(renderNavbar());

  const container = document.createElement('div');
  container.className = 'player-layout';
  wrapper.appendChild(container);
  
  // Loading State
  container.innerHTML = `
    <div class="loading-screen" style="width: 100%;">
      <div class="spinner spinner-lg"></div>
      <p>Carregando curso...</p>
    </div>
  `;

  try {
    const data = await apiGetCourseContent(courseId);
    /* 
      Expected data format from mock/server:
      {
        course: { id, title, description, coverUrl },
        modules: [
          {
            id, title, 
            lessons: [
              { id, title, type, contentUrl, completed }
            ]
          }
        ]
      }
    */
    
    const courseData = data.course;
    const modules = data.modules || [];
    
    let activeLesson = null;

    // --- Sidebar Setup ---
    const sidebar = document.createElement('aside');
    sidebar.className = 'player-sidebar';
    sidebar.id = 'player-sidebar';
    
    sidebar.innerHTML = `
      <div class="player-sidebar-header">
        <button class="btn btn-ghost btn-sm" id="back-btn" style="margin-bottom: 16px; padding: 4px 8px;">
          ← Voltar
        </button>
        <h3>${courseData.title}</h3>
        <p>Seu progresso: <span id="progress-text">0%</span></p>
        <div class="progress-bar" style="margin-top: 8px;">
          <div class="progress-bar-fill" id="progress-fill" style="width: 0%;"></div>
        </div>
      </div>
      <div class="player-sidebar-content" id="modules-list"></div>
    `;

    // --- Main Content Area Setup ---
    const mainArea = document.createElement('main');
    mainArea.className = 'player-main animate-fade-in';
    mainArea.innerHTML = `
      <div id="lesson-content-area" class="player-content">
        <!-- Content inject here -->
      </div>
    `;
    
    // --- Mobile Toggle ---
    const mobileToggle = document.createElement('button');
    mobileToggle.className = 'sidebar-toggle';
    mobileToggle.innerHTML = '☰';
    mobileToggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      const overlay = document.querySelector('.sidebar-overlay');
      if(overlay) overlay.classList.toggle('visible');
    });

    const overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    overlay.addEventListener('click', () => {
      sidebar.classList.remove('open');
      overlay.classList.remove('visible');
    });

    container.innerHTML = '';
    container.appendChild(sidebar);
    container.appendChild(mainArea);
    container.appendChild(mobileToggle);
    container.appendChild(overlay);

    // Event Listeners
    sidebar.querySelector('#back-btn').addEventListener('click', () => {
      router.navigate('dashboard');
    });

    // --- Render Modules and Lessons ---
    const modulesList = sidebar.querySelector('#modules-list');
    
    function renderSidebar() {
      modulesList.innerHTML = '';
      
      let totalLessons = 0;
      let completedLessons = 0;
      
      modules.forEach((mod, index) => {
        const modGroup = document.createElement('div');
        // If there's an active lesson, open its module; otherwise open the first one
        const isActiveModule = activeLesson ? mod.lessons.some(l => l.id === activeLesson.id) : index === 0;
        modGroup.className = `module-group ${isActiveModule ? 'open' : ''}`;
        
        const modLessonsCompleted = mod.lessons.filter(l => l.completed).length;
        
        modGroup.innerHTML = `
          <div class="module-title" title="Clique para expandir/recolher">
            <span style="flex:1; display:flex; align-items:center; gap:8px;">
              <span class="accordion-arrow">▼</span>
              ${mod.title}
            </span>
            <span class="module-progress">${modLessonsCompleted}/${mod.lessons.length}</span>
          </div>
          <div class="module-lessons"></div>
        `;
        
        // Toggle Accordion functionality
        modGroup.querySelector('.module-title').addEventListener('click', () => {
          modGroup.classList.toggle('open');
        });
        
        const lessonsContainer = modGroup.querySelector('.module-lessons');
        
        mod.lessons.forEach((lesson) => {
          totalLessons++;
          if(lesson.completed) completedLessons++;
          
          const lessonItem = document.createElement('div');
          lessonItem.className = `lesson-item ${lesson.completed ? 'completed' : ''} ${activeLesson && activeLesson.id === lesson.id ? 'active' : ''}`;
          lessonItem.dataset.id = lesson.id;
          
          lessonItem.innerHTML = `
            <div class="lesson-check"></div>
            <span class="lesson-type-icon">${LESSON_TYPE_ICONS[lesson.type] || '📄'}</span>
            <span class="lesson-title" title="${lesson.title}">${lesson.title}</span>
          `;
          
          lessonItem.addEventListener('click', () => {
            selectLesson(lesson);
            // Close sidebar on mobile after select
            sidebar.classList.remove('open');
            overlay.classList.remove('visible');
          });
          
          // Toggle completion logic clicking directly on check circle
          const checkDiv = lessonItem.querySelector('.lesson-check');
          checkDiv.addEventListener('click', async (e) => {
            e.stopPropagation();
            lesson.completed = !lesson.completed;
            renderSidebar();
            
            // Background update API
            try {
              if (lesson.completed) {
                await apiMarkComplete(lesson.id);
              } else {
                await apiUnmarkComplete(lesson.id);
              }
            } catch(e) { /* ignore offline */ }
          });
          
          lessonsContainer.appendChild(lessonItem);
        });
        
        modulesList.appendChild(modGroup);
      });
      
      // Update Progress
      const percent = totalLessons === 0 ? 0 : Math.round((completedLessons / totalLessons) * 100);
      sidebar.querySelector('#progress-text').textContent = `${percent}%`;
      sidebar.querySelector('#progress-fill').style.width = `${percent}%`;
    }

    function selectLesson(lesson) {
      activeLesson = lesson;
      renderSidebar();
      renderContentArea(lesson);
    }
    
    function renderContentArea(lesson) {
      const contentArea = mainArea.querySelector('#lesson-content-area');
      contentArea.className = 'player-content animate-fade-in-scale';
      
      // Content player based on type
      let playerHtml = '';
      const fileId = extractDriveFileId(lesson.contentUrl);
      const ytId = extractYouTubeId(lesson.contentUrl);
      const isDirectLink = !fileId && !ytId && lesson.contentUrl && (lesson.contentUrl.startsWith('http') || lesson.contentUrl.startsWith('https'));
      
      if (lesson.type === 'video') {
         if(ytId) {
             playerHtml = `
               <div class="video-player-wrapper">
                 <iframe src="https://www.youtube.com/embed/${ytId}?rel=0&modestbranding=1&showinfo=0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
               </div>
             `;
         } else if(fileId) {
             playerHtml = `
               <div class="video-player-wrapper">
                 <iframe src="${drivePreviewUrl(fileId)}" allow="autoplay"></iframe>
               </div>
             `;
         } else if (isDirectLink) {
             playerHtml = `
               <div class="video-player-wrapper">
                 <video controls style="width: 100%; height: 100%; border-radius: var(--radius-lg);">
                    <source src="${lesson.contentUrl}" type="video/mp4">
                 </video>
               </div>
             `;
         } else {
             playerHtml = `<div class="empty-state"><h3>Link de vídeo inválido</h3></div>`;
         }
      } else if (lesson.type === 'pdf' || lesson.type === 'image') {
         if (isDirectLink && lesson.type === 'image') {
             playerHtml = `
               <div style="width:100%; text-align:center; padding: 2rem 0;">
                 <img src="${lesson.contentUrl}" style="max-width:100%; max-height: 70vh; border-radius:var(--radius-lg); box-shadow: var(--shadow-md);"/>
               </div>
             `;
         } else if (isDirectLink || fileId) {
             // PDF.js viewer — works on all mobile browsers
             playerHtml = `
               <div class="pdfjs-viewer" id="pdfjs-viewer-${lesson.id}">
                 <div class="pdfjs-toolbar">
                   <div class="pdfjs-toolbar-group">
                     <button class="pdfjs-btn" id="pdfjs-prev" title="Página anterior">❮</button>
                     <span class="pdfjs-page-info">
                       <span id="pdfjs-page-num">1</span> / <span id="pdfjs-page-count">-</span>
                     </span>
                     <button class="pdfjs-btn" id="pdfjs-next" title="Próxima página">❯</button>
                   </div>
                   <div class="pdfjs-toolbar-group">
                     <button class="pdfjs-btn" id="pdfjs-zoom-out" title="Diminuir zoom">−</button>
                     <span class="pdfjs-zoom-info" id="pdfjs-zoom-level">100%</span>
                     <button class="pdfjs-btn" id="pdfjs-zoom-in" title="Aumentar zoom">+</button>
                     <button class="pdfjs-btn" id="pdfjs-fit" title="Ajustar à página" style="font-size:0.75rem;">⊡</button>
                     <button class="pdfjs-btn" id="pdfjs-fit-width" title="Ajustar à largura">⬌</button>
                   </div>
                 </div>
                 <div class="pdfjs-canvas-container" id="pdfjs-canvas-container">
                   <div class="spinner spinner-lg"></div>
                   <p style="color: var(--text-muted); margin-top: 1rem;">Carregando PDF...</p>
                 </div>
               </div>
             `;
         } else {
             playerHtml = `<div class="empty-state"><h3>Link de arquivo inválido</h3></div>`;
         }
      } else if (lesson.type === 'slide') {
         const slideUrls = (lesson.contentUrl || '').split(',').map(url => url.trim()).filter(url => url.startsWith('http'));
         if (slideUrls.length > 0) {
             const slidesHtml = slideUrls.map((url, idx) => `
                <div class="carousel-slide" style="display: ${idx === 0 ? 'block' : 'none'}; text-align: center; width: 100%;">
                   <img src="${url}" style="max-width:100%; max-height:70vh; border-radius:var(--radius-lg); box-shadow: var(--shadow-md);" />
                   <div style="margin-top: 1rem; color: var(--text-secondary); font-size: 0.9rem; font-weight: 500;">Slide ${idx + 1} de ${slideUrls.length}</div>
                </div>
             `).join('');
             
             playerHtml = `
               <div class="slide-carousel-wrapper" id="carousel-${lesson.id}" style="position: relative; width: 100%; background: var(--bg-card); padding: 2rem 0; border: 1px solid var(--border-color); border-radius: var(--radius-lg); overflow: hidden;">
                 ${slidesHtml}
                 
                 ${slideUrls.length > 1 ? `
                 <button class="carousel-btn prev-btn" style="position: absolute; top: 50%; left: 1rem; transform: translateY(-50%); background: var(--primary); color: white; border: none; border-radius: 50%; width: 40px; height: 40px; cursor: pointer; display: flex; align-items: center; justify-content: center; opacity: 0.8; transition: 0.2s; font-size: 1.2rem;">❮</button>
                 <button class="carousel-btn next-btn" style="position: absolute; top: 50%; right: 1rem; transform: translateY(-50%); background: var(--primary); color: white; border: none; border-radius: 50%; width: 40px; height: 40px; cursor: pointer; display: flex; align-items: center; justify-content: center; opacity: 0.8; transition: 0.2s; font-size: 1.2rem;">❯</button>
                 ` : ''}
               </div>
             `;
         } else {
             playerHtml = `<div class="empty-state"><h3>Lista de slides inválida. Forneça links separados por vírgula.</h3></div>`;
         }
      } else if (lesson.type === 'audio') {
         if(fileId) {
             playerHtml = `
               <div class="video-player-wrapper" style="padding-top: 25%; max-width: 600px; margin: 0 auto; background: var(--bg-card); border: 1px solid var(--border-color);">
                 <iframe src="${drivePreviewUrl(fileId)}" allow="autoplay" style="border-radius: var(--radius-lg);"></iframe>
               </div>
             `;
         } else if (isDirectLink) {
             playerHtml = `
               <div class="audio-player-wrapper">
                 <div class="audio-card">
                   <div class="audio-icon">🎧</div>
                   <audio controls controlsList="nodownload">
                     <source src="${lesson.contentUrl}" type="audio/mpeg">
                     Seu navegador não suporta o formato de áudio.
                   </audio>
                 </div>
               </div>
             `;
         } else {
             playerHtml = `<div class="empty-state"><h3>Link de áudio inválido</h3></div>`;
         }
      } else if (lesson.type === 'flashcard' || lesson.type === 'csv') {
         if(fileId || isDirectLink) {
             // Container temporário para mostrar loading de flashcards
             playerHtml = `
               <div class="flashcard-wrapper" id="flashcard-container-${lesson.id}">
                 <div class="spinner spinner-sm"></div> Carregando baralho...
               </div>
             `;
         } else {
             playerHtml = `<div class="empty-state"><h3>Link do .csv de Flashcards inválido</h3></div>`;
         }
      } else {
         playerHtml = `
            <div class="lesson-welcome">
               <div class="lesson-welcome-icon">${LESSON_TYPE_ICONS[lesson.type] || '📄'}</div>
               <h2>Formato em desenvolvimento</h2>
               <p>O formato <strong>${lesson.type}</strong> estará disponível em breve.</p>
            </div>
         `;
      }
      
      contentArea.innerHTML = `
        <div class="player-content-title">
          <h2>${lesson.title}</h2>
        </div>
        
        ${playerHtml}
        
        <div class="player-completion-bar">
          <label class="${lesson.completed ? 'completed-label' : ''}">
            <div class="checkbox-wrapper">
               <input type="checkbox" id="mark-complete-main" class="checkbox" ${lesson.completed ? 'checked' : ''} />
               <span>${lesson.completed ? 'Aula Concluída 🎉' : 'Marcar como concluída'}</span>
            </div>
          </label>
          <div class="player-nav-buttons">
            <!-- Navigation feature incoming -->
          </div>
        </div>
      `;
      
      // Load Flashcards Dinamicamente
      if ((lesson.type === 'flashcard' || lesson.type === 'csv') && (fileId || isDirectLink)) {
         renderFlashcardsAsync(fileId, lesson.id, contentArea, lesson.contentUrl);
      }
      
      // PDF.js Viewer Initialization
      if (lesson.type === 'pdf' && (isDirectLink || fileId)) {
         initPdfJsViewer(lesson, fileId, contentArea);
      }
      
      // Slide Carousel Bindings
      if (lesson.type === 'slide') {
          const carousel = contentArea.querySelector(`#carousel-${lesson.id}`);
          if (carousel) {
              let currentSlide = 0;
              const slides = carousel.querySelectorAll('.carousel-slide');
              const prevBtn = carousel.querySelector('.prev-btn');
              const nextBtn = carousel.querySelector('.next-btn');
              
              const updateCarousel = () => {
                 slides.forEach((sl, idx) => sl.style.display = idx === currentSlide ? 'block' : 'none');
              };
              
              if (prevBtn && nextBtn) {
                  prevBtn.addEventListener('click', () => {
                     currentSlide = (currentSlide - 1 + slides.length) % slides.length;
                     updateCarousel();
                  });
                  nextBtn.addEventListener('click', () => {
                     currentSlide = (currentSlide + 1) % slides.length;
                     updateCarousel();
                  });

                  // Mobile Swipe Support
                  let touchStartX = 0;
                  let touchEndX = 0;
                  
                  carousel.addEventListener('touchstart', e => {
                      touchStartX = e.changedTouches[0].screenX;
                  }, {passive: true});
                  
                  carousel.addEventListener('touchend', e => {
                      touchEndX = e.changedTouches[0].screenX;
                      if (touchStartX - touchEndX > 50) {
                          // Swipe left -> Next Slide
                          currentSlide = (currentSlide + 1) % slides.length;
                          updateCarousel();
                      }
                      if (touchEndX - touchStartX > 50) {
                          // Swipe right -> Prev Slide
                          currentSlide = (currentSlide - 1 + slides.length) % slides.length;
                          updateCarousel();
                      }
                  }, {passive: true});
              }
          }
      }
      
      // Main checkbox logic
      const mainCheckbox = contentArea.querySelector('#mark-complete-main');
      if (mainCheckbox) {
        mainCheckbox.addEventListener('change', async (e) => {
          const isChecked = e.target.checked;
          lesson.completed = isChecked;
          renderSidebar();
          renderContentArea(lesson); // re-render to update the celebration text
          
          try {
              if (isChecked) {
                await apiMarkComplete(lesson.id);
              } else {
                await apiUnmarkComplete(lesson.id);
              }
          } catch(err) { /* ignore */ }
        });
      }
    }

    // ==========================================
    // PDF.js Viewer — Full mobile-compatible PDF renderer
    // ==========================================
    async function initPdfJsViewer(lesson, fileId, contentArea) {
      const container = contentArea.querySelector('#pdfjs-canvas-container');
      if (!container) return;

      try {
        // Determine PDF URL: direct link or Google Drive download
        const pdfUrl = fileId 
          ? driveDownloadUrl(fileId)
          : lesson.contentUrl;

        const loadingTask = pdfjsLib.getDocument({
          url: pdfUrl,
          cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@5.7.284/cmaps/',
          cMapPacked: true,
        });

        const pdfDoc = await loadingTask.promise;
        const totalPages = pdfDoc.numPages;

        let currentPage = 1;
        let currentScale = 1;
        let fitScale = 1; // will be calculated on first render

        // Update page counter
        const pageNumEl = contentArea.querySelector('#pdfjs-page-num');
        const pageCountEl = contentArea.querySelector('#pdfjs-page-count');
        const zoomLevelEl = contentArea.querySelector('#pdfjs-zoom-level');
        if (pageCountEl) pageCountEl.textContent = totalPages;

        async function renderPage(pageNum) {
          const page = await pdfDoc.getPage(pageNum);
          
          // Calculate scale to fit container
          const containerWidth = container.clientWidth - 32; // padding
          const containerHeight = container.clientHeight - 32;
          const unscaledViewport = page.getViewport({ scale: 1 });
          
          // Fit within both width AND height so nothing gets cut off
          const scaleByWidth = containerWidth / unscaledViewport.width;
          const scaleByHeight = containerHeight / unscaledViewport.height;
          fitScale = Math.min(scaleByWidth, scaleByHeight);

          // On first load, use fit-to-page scale
          if (currentScale === 1) currentScale = fitScale;

          const viewport = page.getViewport({ scale: currentScale });

          // Create or reuse canvas
          container.innerHTML = '';
          const canvas = document.createElement('canvas');
          canvas.className = 'pdfjs-canvas';
          const ctx = canvas.getContext('2d');

          // Handle high-DPI displays
          const dpr = window.devicePixelRatio || 1;
          canvas.width = Math.floor(viewport.width * dpr);
          canvas.height = Math.floor(viewport.height * dpr);
          canvas.style.width = Math.floor(viewport.width) + 'px';
          canvas.style.height = Math.floor(viewport.height) + 'px';
          ctx.scale(dpr, dpr);

          container.appendChild(canvas);

          await page.render({ canvasContext: ctx, viewport }).promise;
          
          // Scroll to top of canvas on page change
          container.scrollTop = 0;

          // Update UI
          if (pageNumEl) pageNumEl.textContent = pageNum;
          if (zoomLevelEl) zoomLevelEl.textContent = Math.round((currentScale / fitScale) * 100) + '%';

          // Update button states
          const prevBtn = contentArea.querySelector('#pdfjs-prev');
          const nextBtn = contentArea.querySelector('#pdfjs-next');
          if (prevBtn) prevBtn.disabled = pageNum <= 1;
          if (nextBtn) nextBtn.disabled = pageNum >= totalPages;
        }

        // Render first page
        await renderPage(currentPage);

        // --- Navigation Bindings ---
        const prevBtn = contentArea.querySelector('#pdfjs-prev');
        const nextBtn = contentArea.querySelector('#pdfjs-next');
        const zoomInBtn = contentArea.querySelector('#pdfjs-zoom-in');
        const zoomOutBtn = contentArea.querySelector('#pdfjs-zoom-out');
        const fitBtn = contentArea.querySelector('#pdfjs-fit');

        if (prevBtn) {
          prevBtn.addEventListener('click', () => {
            if (currentPage > 1) { currentPage--; renderPage(currentPage); }
          });
        }
        if (nextBtn) {
          nextBtn.addEventListener('click', () => {
            if (currentPage < totalPages) { currentPage++; renderPage(currentPage); }
          });
        }
        if (zoomInBtn) {
          zoomInBtn.addEventListener('click', () => {
            currentScale = Math.min(currentScale * 1.25, fitScale * 3);
            renderPage(currentPage);
          });
        }
        if (zoomOutBtn) {
          zoomOutBtn.addEventListener('click', () => {
            currentScale = Math.max(currentScale * 0.8, fitScale * 0.5);
            renderPage(currentPage);
          });
        }
        if (fitBtn) {
          fitBtn.addEventListener('click', () => {
            currentScale = fitScale; // fit-to-page (both width and height)
            renderPage(currentPage);
          });
        }
        const fitWidthBtn = contentArea.querySelector('#pdfjs-fit-width');
        if (fitWidthBtn) {
          fitWidthBtn.addEventListener('click', async () => {
            // Fit to width only (may require vertical scroll for tall pages)
            const page = await pdfDoc.getPage(currentPage);
            const containerWidth = container.clientWidth - 32;
            const unscaledViewport = page.getViewport({ scale: 1 });
            currentScale = containerWidth / unscaledViewport.width;
            renderPage(currentPage);
          });
        }

        // --- Mobile Swipe Support ---
        let touchStartX = 0;
        container.addEventListener('touchstart', (e) => {
          touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        container.addEventListener('touchend', (e) => {
          const touchEndX = e.changedTouches[0].screenX;
          const diff = touchStartX - touchEndX;
          if (Math.abs(diff) > 60) {
            if (diff > 0 && currentPage < totalPages) {
              currentPage++;
              renderPage(currentPage);
            } else if (diff < 0 && currentPage > 1) {
              currentPage--;
              renderPage(currentPage);
            }
          }
        }, { passive: true });

        // --- Keyboard Support ---
        const keyHandler = (e) => {
          if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
            if (currentPage < totalPages) { currentPage++; renderPage(currentPage); }
          } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
            if (currentPage > 1) { currentPage--; renderPage(currentPage); }
          }
        };
        document.addEventListener('keydown', keyHandler);
        // Clean up when lesson changes (simple approach: remove on next call)
        container._cleanupKeyboard = () => document.removeEventListener('keydown', keyHandler);

      } catch (err) {
        console.error('PDF.js render error:', err);
        container.innerHTML = `
          <div class="empty-state" style="padding: 2rem;">
            <div class="empty-state-icon text-danger">⚠️</div>
            <h3>Erro ao carregar PDF</h3>
            <p>${err.message || 'Verifique a URL do arquivo.'}</p>
            <a href="${lesson.contentUrl}" target="_blank" rel="noopener" class="btn btn-primary" style="margin-top: 1rem;">
              📄 Abrir PDF em nova aba
            </a>
          </div>
        `;
      }
    }

    async function renderFlashcardsAsync(fileId, lessonId, contentArea, contentUrl) {
      const container = contentArea.querySelector(`#flashcard-container-${lessonId}`);
      if(!container) return;

      try {
        let proxyUrl = contentUrl; // Assuma fetch direto se for storage próprio (com CORS ativado)
        
        if (fileId) {
            // Se for arquivo do Google Drive nativo (fileId existe)
            const isSheet = contentUrl.includes('spreadsheets');
            const rawDownloadUrl = isSheet 
               ? `https://docs.google.com/spreadsheets/d/${fileId}/export?format=csv`
               : driveDownloadUrl(fileId);

            // Usa proxy para driblar o cors restrito da google e cookies
            proxyUrl = 'https://api.codetabs.com/v1/proxy/?quest=' + encodeURIComponent(rawDownloadUrl);
        }
        
        const res = await fetch(proxyUrl);
        if(!res.ok) throw new Error('Falha ao baixar CSV');
        
        let rawText = await res.text();
        
        if (rawText.includes('<html') || rawText.includes('<!DOCTYPE')) {
           throw new Error('O link de Flashcards retornou uma página bloqueada (Acesso Negado) ou inválida.');
        }

        // CSV Parser Robusto (Respeita aspas e quebras de linha dentro do texto)
        function parseCSVLine(str) {
            const arr = [];
            let quote = false;
            for (let row = 0, col = 0, c = 0; c < str.length; c++) {
                let cc = str[c], nc = str[c+1];
                arr[row] = arr[row] || [];
                arr[row][col] = arr[row][col] || '';
                
                if (cc === '"' && quote && nc === '"') { arr[row][col] += cc; ++c; continue; }
                if (cc === '"') { quote = !quote; continue; }
                if (cc === ',' && !quote) { ++col; continue; }
                if (cc === ';' && !quote && !str.includes(',')) { ++col; continue; } // suporte a Excel Pt-Br
                if (cc === '\r' && nc === '\n' && !quote) { ++row; col = 0; ++c; continue; }
                if (cc === '\n' && !quote) { ++row; col = 0; continue; }
                if (cc === '\r' && !quote) { ++row; col = 0; continue; }
                
                arr[row][col] += cc;
            }
            return arr.filter(row => row.join('').trim().length > 0);
        }

        const rows = parseCSVLine(rawText.trim());
        
        let cards = rows.map(cols => {
           return { 
               front: (cols[0] || '').trim(), 
               back: (cols[1] || '---').trim() 
           };
        });
        
        // Remove header estritamente (se primeira for 'Frente' ou algo assim)
        if(cards.length > 0 && cards[0].front.toLowerCase().includes('frente')) {
           cards.shift();
        }
        
        if(cards.length === 0) throw new Error('Nenhum flashcard encontrado no CSV');

        let currentIndex = 0;
        
        const updateCardView = () => {
           const card = cards[currentIndex];
           container.innerHTML = `
             <div class="flashcard-scene">
               <div class="flashcard-card" id="fc-flip-${lessonId}">
                 <div class="flashcard-face flashcard-front">
                    <h4>Pergunta</h4>
                    <p>${card.front}</p>
                    <small>Clique para virar</small>
                 </div>
                 <div class="flashcard-face flashcard-back">
                    <h4>Resposta</h4>
                    <p>${card.back}</p>
                 </div>
               </div>
             </div>
             
             <div class="flashcard-controls">
               <button class="btn btn-secondary btn-sm" id="fc-prev-${lessonId}" ${currentIndex === 0 ? 'disabled' : ''}>← Anterior</button>
               <span>${currentIndex + 1} / ${cards.length}</span>
               <button class="btn btn-secondary btn-sm" id="fc-next-${lessonId}" ${currentIndex === cards.length - 1 ? 'disabled' : ''}>Próximo →</button>
             </div>
           `;
           
           container.querySelector(`#fc-flip-${lessonId}`).addEventListener('click', function() {
              this.classList.toggle('is-flipped');
           });
           
           container.querySelector(`#fc-prev-${lessonId}`).addEventListener('click', () => {
              if(currentIndex > 0) { currentIndex--; updateCardView(); }
           });
           
           container.querySelector(`#fc-next-${lessonId}`).addEventListener('click', () => {
              if(currentIndex < cards.length - 1) { currentIndex++; updateCardView(); }
           });
        };
        
        updateCardView();

      } catch(err) {
        console.error(err);
        container.innerHTML = `<div class="empty-state"><h3>Erro ao carregar flashcards</h3><p>Verifique o arquivo CSV e se ele está marcado como "Qualquer pessoa com o link".</p></div>`;
      }
    }

    // Init display
    renderSidebar();
    
    // Select first lesson by default if none selected
    if (modules.length > 0 && modules[0].lessons.length > 0) {
       selectLesson(modules[0].lessons[0]);
    } else {
       mainArea.innerHTML = `
         <div class="lesson-welcome">
           <h2>Nenhuma aula publicada</h2>
         </div>
       `;
    }

  } catch (error) {
    console.error('Course load error', error);
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon text-danger">⚠️</div>
        <h3>Erro ao carregar o curso</h3>
        <p>Volte para o início e tente novamente.</p>
        <button class="btn btn-primary" onclick="window.location.hash='#/dashboard'">Voltar para Dashboard</button>
      </div>
    `;
  }

  return wrapper;
}
