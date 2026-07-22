/**
 * ============================================
 * ESCOLA DE SABERES - APP SCRIPT BACKEND
 * ============================================
 * SPREADSHEET_ID: 1N8gsG2A99KI1f-DuoPYffTrvIqHzjDQb-5_voIu4QWc
 */

const DB_ID = '1N8gsG2A99KI1f-DuoPYffTrvIqHzjDQb-5_voIu4QWc';

// --- MAIN ENTRY POINTS ---

function doGet(e) {
  return handleRequest(e, 'GET');
}

function doPost(e) {
  return handleRequest(e, 'POST');
}

function handleRequest(e, method) {
  // CORS Headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  try {
    const params = method === 'GET' ? e.parameter : JSON.parse(e.postData.contents);
    const action = params.action;

    let result = {};

    switch (action) {
      // Auth
      case 'login':
        result = doLogin(params.email);
        break;
      case 'validate_token':
        result = doValidateToken(params.token);
        break;
      case 'logout':
        result = doLogout(params.token);
        break;

      // Student
      case 'get_courses':
        result = getCourses(params.token);
        break;
      case 'get_course_content':
        result = getCourseContent(params.token, params.courseId);
        break;
      case 'toggle_lesson':
        result = toggleLessonComplete(params.token, params.lessonId, params.isComplete);
        break;

      // Admin
      case 'admin_dashboard':
        result = adminDashboard(params.token);
        break;
      case 'admin_get_courses':
        result = adminGetCourses(params.token);
        break;
      case 'admin_create_course':
        result = adminCreateCourse(params.token, params);
        break;
      case 'admin_update_course':
        result = adminUpdateCourse(params.token, params);
        break;
      case 'admin_delete_course':
        result = adminDeleteCourse(params.token, params.courseId);
        break;
      case 'admin_get_users':
        result = adminGetUsers(params.token);
        break;
      case 'admin_create_user':
        result = adminCreateUser(params.token, params);
        break;
      case 'admin_update_user_access':
        result = adminUpdateUserAccess(params.token, params);
        break;
      case 'admin_create_module':
        result = adminCreateModule(params.token, params);
        break;
      case 'admin_create_lesson':
        result = adminCreateLesson(params.token, params);
        break;
      case 'admin_create_bulk_lessons':
        result = adminCreateBulkLessons(params.token, params);
        break;
      case 'admin_update_lesson':
        result = adminUpdateLesson(params.token, params);
        break;
      case 'admin_delete_lesson':
        result = adminDeleteLesson(params.token, params.lessonId);
        break;

      default:
        return respond({ error: 'Ação não encontrada' }, headers);
    }

    return respond(result, headers);
  } catch (error) {
    return respond({ error: error.message || 'Erro interno no servidor' }, headers, 500);
  }
}

function respond(data, headers, status = 200) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// --- DATABASE HELPERS ---

function getSheet(sheetName) {
  const ss = SpreadsheetApp.openById(DB_ID);
  return ss.getSheetByName(sheetName);
}

function getRowsAsObjects(sheet) {
  if (!sheet) return [];
  const startRow = 1; // Assuming header on row 1
  const startCol = 1;

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  const headers = data[0].map(h => String(h).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim());
  const rows = [];

  for (let i = 1; i < data.length; i++) {
    // Skip empty ghost rows
    if (!data[i].some(cell => String(cell).trim() !== '')) {
      continue;
    }

    const obj = {};
    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = data[i][j];
    }
    // inject row index for updates and raw columns for robust logic
    obj._rowIndex = i + 1;
    obj._raw_0 = data[i][0];
    obj._raw_1 = data[i][1];
    obj._raw_2 = data[i][2]; // Coluna C: Permissões de Admin (master_admin)
    rows.push(obj);
  }

  return rows;
}

// --- AUTH LOGIC ---

function doLogin(email) {
  if (!email) throw new Error('E-mail obrigatório');

  const sheet = getSheet('Usuários');
  const users = getRowsAsObjects(sheet);
  
  const user = users.find(u => String(u.email).toLowerCase() === String(email).toLowerCase());
  
  if (!user) {
    throw new Error('Usuário não encontrado');
  }

  // Generate simple token
  const token = Utilities.getUuid();
  
  // Find token column index (assumed column G, index 7, but let's find it via header)
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(h => String(h).toLowerCase().trim());
  const tokenColIdx = headers.indexOf('token') + 1;
  
  if(tokenColIdx > 0) {
    sheet.getRange(user._rowIndex, tokenColIdx).setValue(token);
  } else {
    // If column doesn't exist, create it (assuming column G)
    sheet.getRange(1, 7).setValue('Token');
    sheet.getRange(user._rowIndex, 7).setValue(token);
  }

  return {
    token: token,
    user: {
      name: user.nome || user.name || '',
      email: user.email,
      role: String(user._raw_2 || user['permissão'] || 'normal').toLowerCase().trim(),
      courses: user['cursos escola de saberes'] ? user['cursos escola de saberes'].split(',').map(s => s.trim().toLowerCase()) : [],
      turma: user.turma || '',
      gerencia: user['áreas de gestão'] || ''
    }
  };
}

function doValidateToken(inToken) {
  if (!inToken) throw new Error('Token obrigatório');

  const sheet = getSheet('Usuários');
  const users = getRowsAsObjects(sheet);
  
  const user = users.find(u => u.token === inToken);
  
  if (!user) {
    return { valid: false };
  }

  return {
    valid: true,
    user: {
      name: user.nome || user.name || '',
      email: user.email,
      role: String(user._raw_2 || user['permissão'] || 'normal').toLowerCase().trim(),
      courses: user['cursos escola de saberes'] ? user['cursos escola de saberes'].split(',').map(s => s.trim().toLowerCase()) : [],
      turma: user.turma || '',
      gerencia: user['áreas de gestão'] || ''
    }
  };
}

function doLogout(inToken) {
  if (!inToken) return { success: true };

  const sheet = getSheet('Usuários');
  const users = getRowsAsObjects(sheet);
  
  const user = users.find(u => u.token === inToken);
  
  if (user) {
     const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(h => String(h).toLowerCase().trim());
     const tokenColIdx = headers.indexOf('token') + 1;
     if(tokenColIdx > 0){
       sheet.getRange(user._rowIndex, tokenColIdx).setValue('');
     }
  }

  return { success: true };
}

// --- STUDENT LOGIC ---

function getCourses(inToken) {
  const auth = doValidateToken(inToken);
  if (!auth.valid) throw new Error('Token inválido');

  const sheet = getSheet('cursos');
  if(!sheet) return { courses: [] }; // Handle non-existent sheet gracefulyy
  
  const courses = getRowsAsObjects(sheet);
  const userCoursesSlugs = auth.user.courses || [];
  
  let validCourses = courses;
  // Filter by user permissions if not master_admin
  if (auth.user.role !== 'master_admin') {
      const userTurmaNormalized = String(auth.user.turma || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

      validCourses = validCourses.filter(c => {
         const cTitle = String(c.titulo || c.title || '').trim().toLowerCase();
         const cSlug = String(c.slug || '').trim().toLowerCase();
         const cTurmaRaw = String(c.turma || '').trim();
         const courseTurmaNorm = cTurmaRaw.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
         
         const identifierTitle = cTurmaRaw ? `${cTitle} [${courseTurmaNorm}]` : cTitle;
         const identifierSlug = cTurmaRaw ? `${cSlug} [${courseTurmaNorm}]` : cSlug;

         // 1. Explicit Access: bypassing global turma
         const hasExplicitAccess = userCoursesSlugs.includes(identifierTitle) || 
                                   userCoursesSlugs.includes(identifierSlug) || 
                                   userCoursesSlugs.includes(`${cTitle} [${cTurmaRaw.toLowerCase()}]`);
         
         if (hasExplicitAccess) return true;

         // 2. Legacy/General Access
         const hasGeneralAccess = userCoursesSlugs.includes(cSlug) || userCoursesSlugs.includes(cTitle);
         if (!hasGeneralAccess) return false;

         // 3. Apply global turma restriction
         if (cTurmaRaw !== '') {
           if (!userTurmaNormalized || (!courseTurmaNorm.includes(userTurmaNormalized) && !userTurmaNormalized.includes(courseTurmaNorm))) {
              return false;
           }
         }

         return true;
      });
  }

  return {
    courses: validCourses.map(c => ({
      id: c.id,
      slug: c.slug,
      title: c.titulo,
      description: c.descricao || c.description,
      coverUrl: c.url || c.cover_url || c.imagem || ''
    }))
  };
}

// ---------------------------------------------------------
// COURSE CONTENT & PROGRESS
// ---------------------------------------------------------
function getCourseContent(token, courseId) {
  const auth = doValidateToken(token);
  if (!auth.valid) throw new Error('Token inválido');

  const sheetCourses = getSheet('cursos');
  const sheetModules = getSheet('Modulos');
  const sheetLessons = getSheet('Lições');
  const sheetProgress = getSheet('Progresso do usuarios');

  const courses = getRowsAsObjects(sheetCourses);
  const course = courses.find(c => String(c.id) === String(courseId));
  if (!course) throw new Error('Curso não encontrado');

  const modulesRaw = getRowsAsObjects(sheetModules).filter(m => String(m['id do curso']) === String(courseId));
  const lessonsRaw = getRowsAsObjects(sheetLessons);
  
  const progressRaw = getRowsAsObjects(sheetProgress)
      .filter(p => String(p._raw_0).trim().toLowerCase() === String(auth.user.email).trim().toLowerCase());
  const completedLessonIds = progressRaw.map(p => String(p._raw_1).trim());

  const modules = modulesRaw.map(m => {
    const modLessons = lessonsRaw.filter(l => String(l['id do modulo']) === String(m.id)).map(l => ({
      id: String(l.id),
      title: l.titulo || l.title || '',
      type: l.type || 'video',
      contentUrl: l.url || '',
      duration: l.duration || '00:00',
      completed: completedLessonIds.includes(String(l.id).trim())
    }));
    return {
      id: String(m.id),
      title: m.titulos || m.title || '',
      lessons: modLessons
    };
  });

  return {
    course: {
      id: String(course.id),
      title: course.titulo || course.title || '',
      description: course.descricao || course.description || '',
      coverUrl: course.url || course.cover_url || ''
    },
    modules: modules
  };
}

function toggleLessonComplete(token, lessonId, isComplete) {
  const auth = doValidateToken(token);
  if (!auth.valid) throw new Error('Token inválido');

  const sheetProgress = getSheet('Progresso do usuarios');
  let progressRows;
  // If sheet is completely empty except headers, getRowsAsObjects handles it 
  // but if it has no headers, might fail. Assume it has headers.
  try {
    progressRows = getRowsAsObjects(sheetProgress);
  } catch(e) {
    progressRows = [];
  }
  
  const userEmail = String(auth.user.email).trim().toLowerCase();
  const targetLessonId = String(lessonId).trim();
  
  const existingIndex = progressRows.findIndex(p => 
    String(p._raw_0).trim().toLowerCase() === userEmail && 
    String(p._raw_1).trim() === targetLessonId
  );
  
  if (isComplete && existingIndex === -1) {
    // Add row
    sheetProgress.appendRow([userEmail, targetLessonId]);
  } else if (!isComplete && existingIndex !== -1) {
    // Remove row - _rowIndex stores the actual sheet row number
    sheetProgress.deleteRow(progressRows[existingIndex]._rowIndex);
  }

  return { success: true };
}

// =============================================================
// ADMIN LOGIC — Protegido por role === 'master_admin'
// =============================================================

function requireAdmin(token) {
  const auth = doValidateToken(token);
  if (!auth.valid) throw new Error('Token inválido');
  if (auth.user.role !== 'master_admin') throw new Error('Acesso negado: você não é administrador.');
  return auth;
}

// --- ADMIN DASHBOARD ---
function adminDashboard(token) {
  requireAdmin(token);

  const users = getRowsAsObjects(getSheet('Usuários'));
  const courses = getRowsAsObjects(getSheet('cursos'));
  const modules = getRowsAsObjects(getSheet('Modulos'));
  const lessons = getRowsAsObjects(getSheet('Lições'));
  
  let progressSheet = getSheet('Progresso do usuarios');
  let progress = [];
  try { progress = getRowsAsObjects(progressSheet); } catch(e) {}

  let totalUsers = 0;
  let totalUsersSexta = 0;
  let totalUsersSabado = 0;
  let totalUsersSemTurma = 0;

  const normalizeStr = (s) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

  // Build engajamento: para cada aluno, calcular % de progresso por curso
  const engagement = [];
  
  users.forEach(u => {
    const role = String(u._raw_2 || '').toLowerCase().trim();
    const email = String(u.email || '').trim().toLowerCase();
    
    // Process all users faithfully to spreadsheet rows
    totalUsers++;
    const userTurmaNormalized = normalizeStr(u.turma);
    if (userTurmaNormalized.includes('sexta')) totalUsersSexta++;
    else if (userTurmaNormalized.includes('sabado')) totalUsersSabado++;
    else totalUsersSemTurma++;

    const userProgress = progress.filter(p => String(p._raw_0).trim().toLowerCase() === email);
    const completedIds = userProgress.map(p => String(p._raw_1).trim());
    
    courses.forEach(c => {
      // 1. CHECKS DE ACESSO
      const courseTitle = String(c.titulo || c.title || '').toLowerCase().trim();
      const courseTurmaRaw = String(c.turma || '').trim();
      const courseTurmaNorm = courseTurmaRaw.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      
      const identifierTitle = courseTurmaRaw ? `${courseTitle} [${courseTurmaNorm}]` : courseTitle;
      
      const userCoursesRaw = String(u['cursos escola de saberes'] || '').toLowerCase();
      const userCoursesList = userCoursesRaw.split(',').map(s => s.trim());

      const hasCourseHeaderMatch = Object.keys(u).some(key => {
         if (['nome', 'name', 'email', 'cargo', 'role', 'token', 'turma', '_rowindex', '_raw_0', '_raw_1', '_raw_2'].includes(key)) return false;
         return key.includes(courseTitle) && String(u[key]).trim() !== '';
      });

      const hasExplicitAccess = userCoursesList.includes(identifierTitle) || userCoursesList.includes(`${courseTitle} [${courseTurmaRaw.toLowerCase()}]`);
      const hasGeneralAccess = userCoursesList.includes(courseTitle) || hasCourseHeaderMatch;

      if (!hasExplicitAccess && !hasGeneralAccess) return; // Aluno não está matriculado
      
      // 2. CHECK DE TURMA (se não for acesso explícito)
      if (!hasExplicitAccess && courseTurmaRaw !== '') {
          if (!userTurmaNormalized || (!courseTurmaNorm.includes(userTurmaNormalized) && !userTurmaNormalized.includes(courseTurmaNorm))) {
             return; // Curso é restrito e aluno não pertence à turma
          }
      }

      // Processa Licoes e Modulos deste curso
      const courseLessons = lessons.filter(l => {
        const mod = modules.find(m => String(m.id) === String(l['id do modulo']));
        return mod && String(mod['id do curso']) === String(c.id);
      });
      
      if (courseLessons.length === 0) return;
      
      const completed = courseLessons.filter(l => completedIds.includes(String(l.id).trim())).length;
      const pct = Math.round((completed / courseLessons.length) * 100);
      
      engagement.push({
        userName: u.nome || u.name || email,
        userEmail: email,
        courseTitle: c.titulo || c.title || '',
        courseId: String(c.id),
        progress: pct,
        completedCount: completed,
        totalLessons: courseLessons.length
      });
    });
  });

  const totalCourses = courses.length;
  const totalLessons = lessons.length;

  return {
    stats: { totalUsers, totalUsersSexta, totalUsersSabado, totalUsersSemTurma, totalCourses, totalLessons },
    engagement
  };
}

// --- ADMIN GET COURSES (detailed with modules + lesson counts) ---
function adminGetCourses(token) {
  requireAdmin(token);
  
  const courses = getRowsAsObjects(getSheet('cursos'));
  const modules = getRowsAsObjects(getSheet('Modulos'));
  const lessons = getRowsAsObjects(getSheet('Lições'));

  return {
    courses: courses.map(c => {
      const mods = modules.filter(m => String(m['id do curso']) === String(c.id));
      const modData = mods.map(m => {
        const modLessons = lessons.filter(l => String(l['id do modulo']) === String(m.id));
        return {
          id: String(m.id),
          title: m.titulos || m.title || '',
          lessonCount: modLessons.length,
          lessons: modLessons.map(l => ({
            id: String(l.id),
            title: l.titulo || l.title || '',
            type: l.type || 'video',
            url: l.url || ''
          }))
        };
      });
      return {
        id: String(c.id),
        title: c.titulo || c.title || '',
        description: c.descricao || c.description || '',
        slug: c.slug || '',
        coverUrl: c.url || c.cover_url || c.imagem || '',
        turma: c.turma || '',
        _rowIndex: c._rowIndex,
        modules: modData,
        totalLessons: modData.reduce((sum, m) => sum + m.lessonCount, 0)
      };
    })
  };
}

// --- ADMIN CREATE COURSE ---
function adminCreateCourse(token, params) {
  requireAdmin(token);
  const sheet = getSheet('cursos');
  const id = 'C' + Date.now();
  const slug = String(params.title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-$/, '');
  sheet.appendRow([id, params.title || '', params.description || '', slug, params.coverUrl || '', params.turma || '']);
  return { success: true, courseId: id };
}

// --- ADMIN UPDATE COURSE ---
function adminUpdateCourse(token, params) {
  requireAdmin(token);
  const sheet = getSheet('cursos');
  const courses = getRowsAsObjects(sheet);
  const course = courses.find(c => String(c.id) === String(params.courseId));
  if (!course) throw new Error('Curso não encontrado');
  
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(h => String(h).toLowerCase().trim());
  
  if (params.title) {
    const col = headers.indexOf('titulo') + 1 || headers.indexOf('title') + 1;
    if (col > 0) sheet.getRange(course._rowIndex, col).setValue(params.title);
  }
  if (params.description) {
    const col = headers.indexOf('descricao') + 1 || headers.indexOf('description') + 1;
    if (col > 0) sheet.getRange(course._rowIndex, col).setValue(params.description);
  }
  if (params.coverUrl) {
    const col = headers.indexOf('url') + 1 || headers.indexOf('cover_url') + 1;
    if (col > 0) sheet.getRange(course._rowIndex, col).setValue(params.coverUrl);
  }
  if (params.turma !== undefined) {
    let col = headers.indexOf('turma') + 1;
    if (col === 0) {
      col = 6; // Força na coluna F
      sheet.getRange(1, col).setValue('turma');
    }
    sheet.getRange(course._rowIndex, col).setValue(params.turma);
  }
  
  return { success: true };
}

// --- ADMIN DELETE COURSE ---
function adminDeleteCourse(token, courseId) {
  requireAdmin(token);
  const sheet = getSheet('cursos');
  const courses = getRowsAsObjects(sheet);
  const course = courses.find(c => String(c.id) === String(courseId));
  if (!course) throw new Error('Curso não encontrado');
  sheet.deleteRow(course._rowIndex);
  return { success: true };
}

// --- ADMIN GET USERS ---
function adminGetUsers(token) {
  requireAdmin(token);
  const users = getRowsAsObjects(getSheet('Usuários'));
  
  // Mirror exact sheet contents
  const validUsers = users;
  
  return {
    users: validUsers.map(u => ({
      name: u.nome || u.name || '',
      email: u.email || '',
      role: String(u._raw_2 || 'normal').toLowerCase().trim(),
      courses: u['cursos escola de saberes'] || '',
      turma: u.turma || '',
      _rowIndex: u._rowIndex
    }))
  };
}

// --- ADMIN CREATE USER ---
function adminCreateUser(token, params) {
  requireAdmin(token);
  const sheet = getSheet('Usuários');
  sheet.appendRow([params.name || '', params.email || '', 'normal']);
  return { success: true };
}

// --- ADMIN CREATE MODULE ---
function adminCreateModule(token, params) {
  requireAdmin(token);
  const sheet = getSheet('Modulos');
  const id = 'M' + Date.now();
  sheet.appendRow([id, params.courseId, params.title || 'Novo Módulo']);
  return { success: true, moduleId: id };
}

// --- ADMIN CREATE LESSON ---
function adminCreateLesson(token, params) {
  requireAdmin(token);
  const sheet = getSheet('Lições');
  const id = 'L' + Date.now();
  sheet.appendRow([id, params.moduleId, params.title || 'Nova Aula', params.type || 'video', params.url || '']);
  return { success: true, lessonId: id };
}

// --- ADMIN CREATE BULK LESSONS ---
function adminCreateBulkLessons(token, params) {
  requireAdmin(token);
  const sheet = getSheet('Lições');
  const lessons = params.lessons;
  if (!lessons || !Array.isArray(lessons) || lessons.length === 0) return { success: true };
  
  const timestamp = Date.now();
  const rows = lessons.map((l, index) => [
    'L' + (timestamp + index), 
    l.moduleId, 
    l.title || 'Slide', 
    l.type || 'slide', 
    l.url || ''
  ]);
  
  // Bulk insert is much faster than loop appendRow
  sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, 5).setValues(rows);
  return { success: true };
}

// --- ADMIN UPDATE LESSON ---
function adminUpdateLesson(token, params) {
  requireAdmin(token);
  const sheet = getSheet('Lições');
  const lessons = getRowsAsObjects(sheet);
  const lesson = lessons.find(l => String(l.id) === String(params.lessonId));
  if (!lesson) throw new Error('Aula não encontrada');
  
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(h => String(h).toLowerCase().trim());
  
  if (params.title) {
    const col = headers.indexOf('titulo') + 1 || headers.indexOf('title') + 1;
    if (col > 0) sheet.getRange(lesson._rowIndex, col).setValue(params.title);
  }
  if (params.type) {
    const col = headers.indexOf('type') + 1;
    if (col > 0) sheet.getRange(lesson._rowIndex, col).setValue(params.type);
  }
  if (params.url) {
    const col = headers.indexOf('url') + 1;
    if (col > 0) sheet.getRange(lesson._rowIndex, col).setValue(params.url);
  }
  
  return { success: true };
}

// --- ADMIN DELETE LESSON ---
function adminDeleteLesson(token, lessonId) {
  requireAdmin(token);
  const sheet = getSheet('Lições');
  const lessons = getRowsAsObjects(sheet);
  const lesson = lessons.find(l => String(l.id) === String(lessonId));
  if (!lesson) throw new Error('Aula não encontrada');
  sheet.deleteRow(lesson._rowIndex);
  return { success: true };
}

// --- ADMIN UPDATE USER ACCESS ---
function adminUpdateUserAccess(token, params) {
  requireAdmin(token);
  const sheet = getSheet('Usuários');
  const users = getRowsAsObjects(sheet);
  const user = users.find(u => String(u.email).toLowerCase().trim() === String(params.email).toLowerCase().trim());
  if (!user) throw new Error('Usuário não encontrado.');

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(h => String(h).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim());
  
  // Update Turma
  if (params.turma !== undefined) {
    let col = headers.indexOf('turma') + 1;
    if (col === 0) {
      col = 6; // Create 'turma' in usually empty col F
      sheet.getRange(1, col).setValue('turma');
    }
    sheet.getRange(user._rowIndex, col).setValue(params.turma);
  }

  // Update massive permissions
  if (params.coursesStr !== undefined) {
    let col = headers.indexOf('cursos escola de saberes') + 1;
    if (col === 0) {
      col = sheet.getLastColumn() + 1;
      sheet.getRange(1, col).setValue('cursos escola de saberes');
    }
    sheet.getRange(user._rowIndex, col).setValue(params.coursesStr);
  }

  return { success: true };
}
