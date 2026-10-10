/** Escola de Saberes — LMS 2.0. Copie este arquivo inteiro para Code.gs.
 * Entrada por e-mail cadastrado, deliberadamente sem verificação de identidade.
 * Dados legados são lidos sem migração destrutiva. Novas colunas são aditivas.
 */
const DB_ID = '1N8gsG2A99KI1f-DuoPYffTrvIqHzjDQb-5_voIu4QWc';
const LMS_VERSION = '2.0.0';
const SCHEMA = {
  courses: { sheet: 'cursos', fields: { id:['id'], title:['titulo','title'], description:['descricao','description'], slug:['slug'], coverUrl:['url','cover_url','imagem'], turma:['turma'], status:['status'], position:['position','ordem'], version:['version'], updatedAt:['updated_at'] } },
  modules: { sheet: 'Modulos', fields: { id:['id'], courseId:['id do curso','course_id'], title:['titulos','titulo','title'], status:['status'], position:['position','ordem'], version:['version'], updatedAt:['updated_at'] } },
  lessons: { sheet: 'Lições', fields: { id:['id'], moduleId:['id do modulo','module_id'], title:['titulo','title'], type:['type','tipo'], url:['url'], description:['descricao','description'], resources:['resources'], status:['status'], position:['position','ordem'], version:['version'], updatedAt:['updated_at'] } },
  users: { sheet: 'Usuários', fields: { name:['nome','name'], email:['email','e-mail'], role:['cargo','role','permissao','permissoes'], legacyCourses:['cursos escola de saberes'], turma:['turma'], courseIds:['course_ids'], status:['status'], version:['version'], updatedAt:['updated_at'], lastActivity:['last_activity'] } },
  progress: { sheet: 'Progresso do usuarios', fields: { email:['email','usuario','e-mail'], lessonId:['lesson_id','id da licao','id da aula','licao'], completedAt:['completed_at'] } },
  materials: { sheet: 'LMS Materiais', fields: { id:['id'], title:['title'], type:['type'], url:['url'], text:['text'], status:['status'], version:['version'], updatedAt:['updated_at'] } },
  settings: { sheet: 'LMS Configurações', fields: { key:['key'], value:['value'] } },
  audit: { sheet: 'LMS Histórico', fields: { id:['id'], at:['at'], email:['email'], action:['action'], entity:['entity'], details:['details'] } },
  requests: { sheet: 'LMS Requisições', fields: { id:['id'], email:['email'], action:['action'], result:['result'], at:['at'] } }
};
let requestTables = {};
function norm(v) { return String(v == null ? '' : v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase(); }
function str(v) { return String(v == null ? '' : v).trim(); }
function fail(message, code) { const e = new Error(message); e.code = code || 'VALIDATION'; throw e; }
function uid() { return Utilities.getUuid(); }
function now() { return new Date().toISOString(); }
function parse(v, fallback) { try { return v === '' || v == null ? fallback : JSON.parse(String(v)); } catch (_) { return fallback; } }
function safeCell(v) { if (typeof v === 'string' && /^[=+@\-]/.test(v)) return "'" + v; return v == null ? '' : v; }
function doGet(e) { return handleRequest(e, 'GET'); }
function doPost(e) { return handleRequest(e, 'POST'); }
function handleRequest(e, method) {
  requestTables = {};
  try {
    const p = method === 'GET' ? (e.parameter || {}) : JSON.parse(e.postData.contents);
    if (method === 'GET' && p.action !== 'health' && p.action !== 'get_settings') fail('Use POST para esta operação.');
    return respond(dispatch(p));
  } catch (e) { return respond({ error: e.message || 'Erro interno', code: e.code || 'SERVER' }); }
}
function respond(data) { return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON); }
function db() { return SpreadsheetApp.openById(DB_ID); }
function ensureGrid(sheet,lastRow,lastColumn) {
  if(lastRow>sheet.getMaxRows()) sheet.insertRowsAfter(sheet.getMaxRows(),lastRow-sheet.getMaxRows());
  if(lastColumn>sheet.getMaxColumns()) sheet.insertColumnsAfter(sheet.getMaxColumns(),lastColumn-sheet.getMaxColumns());
}
function table(kind, create) {
  if (requestTables[kind] && !create) return requestTables[kind];
  const spec = SCHEMA[kind];
  if (!spec) fail('Tipo de registro inválido.');
  let sheet = db().getSheetByName(spec.sheet);
  if (!sheet && create) sheet = db().insertSheet(spec.sheet);
  let values = sheet ? sheet.getDataRange().getValues() : [];
  let headers = (values[0] || []).map(norm);
  const columns = {};
  Object.keys(spec.fields).forEach(key => {
    let col = headers.findIndex(h => spec.fields[key].indexOf(h) >= 0);
    // Existing installations used positional columns for these fields only.
    if (col < 0 && kind === 'users' && key === 'role' && headers.length >= 3) col = 2;
    if (col < 0 && kind === 'progress' && headers.length >= 2 && (key === 'email' || key === 'lessonId')) col = key === 'email' ? 0 : 1;
    if (col < 0 && create) {
      col = headers.length === 1 && headers[0] === '' ? 0 : headers.length;
      ensureGrid(sheet,1,col+1);
      sheet.getRange(1,col+1).setValue(spec.fields[key][0]);
      headers[col] = spec.fields[key][0];
    }
    columns[key] = col;
  });
  if (create) values = sheet.getDataRange().getValues();
  const rows = values.slice(1).map((raw,i) => {
    const row = {_row: i+2};
    Object.keys(columns).forEach(key => row[key] = columns[key] < 0 ? '' : raw[columns[key]] == null ? '' : raw[columns[key]]);
    ['id','courseId','moduleId','lessonId','email'].forEach(key => { if (key in row) row[key] = str(row[key]); });
    if ('version' in row) row.version = Number(row.version) || 0;
    if ('position' in row) row.position = row.position === '' ? i : Number(row.position);
    if ('status' in row) row.status = str(row.status) || (kind === 'users' ? 'active' : 'published');
    ['completedAt','lastActivity','updatedAt','at'].forEach(key=>{if(row[key] instanceof Date)row[key]=row[key].toISOString();});
    if (kind === 'lessons') row.resources = parse(row.resources, null);
    if (kind === 'users') { row.courseIds = parse(row.courseIds, null); row.role = norm(row.role) || 'normal'; }
    return row;
  }).filter(row => Object.keys(columns).some(key => row[key] !== '' && row[key] != null && key !== 'version' && key !== 'position' && key !== 'status'));
  return requestTables[kind] = { sheet, headers, columns, rows };
}
function rows(kind) { return table(kind).rows; }
function write(kind, data, existing) {
  const t = table(kind,true);
  ensureGrid(t.sheet,existing?existing._row:t.sheet.getLastRow()+1,t.headers.length);
  const values = Array(t.headers.length).fill('');
  Object.keys(data).forEach(key => {
    if (!(key in t.columns) || t.columns[key] < 0) return;
    let value = data[key];
    if (Array.isArray(value) || value && typeof value === 'object') value = JSON.stringify(value);
    value = safeCell(value);
    // Update only the chosen field: formulas and unrelated columns stay intact.
    if(existing) t.sheet.getRange(existing._row,t.columns[key]+1).setValue(value);
    else values[t.columns[key]] = value;
  });
  if(!existing) t.sheet.getRange(t.sheet.getLastRow()+1,1,1,values.length).setValues([values]);
  delete requestTables[kind];
  return data;
}
function appendBatch(kind,items) {
  if(!items.length)return;
  const t=table(kind,true);
  const values=items.map(item=>t.headers.map((_,col)=>{
    const key=Object.keys(t.columns).find(key=>t.columns[key]===col);
    let value=key?item[key]:'';
    if(Array.isArray(value)||value&&typeof value==='object')value=JSON.stringify(value);
    return safeCell(value);
  }));
  ensureGrid(t.sheet,t.sheet.getLastRow()+values.length,t.headers.length);
  t.sheet.getRange(t.sheet.getLastRow()+1,1,values.length,t.headers.length).setValues(values);
  delete requestTables[kind];
}

function removeRows(kind, matches) {
  const t = table(kind);
  matches.sort((a,b) => b._row-a._row).forEach(row => t.sheet.deleteRow(row._row));
  delete requestTables[kind];
}
function lookup(kind,id) { const row = rows(kind).find(r => str(r.id) === str(id)); if (!row) fail('Registro não encontrado.','NOT_FOUND'); return row; }
function publicRow(row) { const out = Object.assign({},row); delete out._row; return out; }
function profile(email) {
  const matches = rows('users').filter(u => norm(u.email) === norm(email));
  if (!norm(email) || !matches.length) fail('E-mail não cadastrado','UNREGISTERED');
  if (matches.length > 1) fail('E-mail duplicado na planilha. Corrija o cadastro antes de entrar.','DUPLICATE');
  const user = matches[0];
  if (user.status === 'blocked' || user.status === 'archived') fail('Cadastro bloqueado. Entre em contato com a escola.','BLOCKED');
  user.role = norm(user.role) || 'normal';
  return user;
}
function admin(email) { const u = profile(email); if(u.role !== 'master_admin') fail('Acesso negado: você não é administrador.','FORBIDDEN'); return u; }
function canAccessCourse(user,course) {
  if (user.status === 'blocked' || user.status === 'archived') return false;
  if (user.role === 'master_admin') return true;
  if (Array.isArray(user.courseIds)) return user.courseIds.map(String).indexOf(str(course.id)) >= 0;
  const permissions = Array.isArray(user.courses) ? user.courses : String(user.legacyCourses || '').split(',').map(v => v.trim().toLowerCase());
  const title = str(course.title || course.titulo).toLowerCase(), slug = str(course.slug).toLowerCase(), turma = str(course.turma).toLowerCase();
  if (turma && [title,slug].some(v => v && (permissions.indexOf(v+' ['+turma+']') >= 0 || permissions.indexOf(v+' ['+norm(turma)+']') >= 0))) return true;
  if (![title,slug].some(v => v && permissions.indexOf(v) >= 0)) return false;
  return !turma || !!norm(user.turma) && (norm(turma).indexOf(norm(user.turma)) >= 0 || norm(user.turma).indexOf(norm(turma)) >= 0);
}
function ordered(list) { return list.slice().sort((a,b) => Number(a.position)-Number(b.position) || a._row-b._row); }
function visible(row,preview) { return preview || row.status === 'published'; }
function resources(lesson) {
  if (Array.isArray(lesson.resources)) return lesson.resources;
  return lesson.url ? [{id: 'legacy-'+lesson.id, title: lesson.title, type: lesson.type || 'video', url: lesson.url, text:''}] : [];
}
function courseTree(course,user,preview) {
  if (!canAccessCourse(user,course) || !visible(course,preview)) fail('Acesso negado a este curso','FORBIDDEN');
  const complete = new Set(rows('progress').filter(p => norm(p.email) === norm(user.email)).map(p => p.lessonId));
  const allLessons = rows('lessons');
  const modules = ordered(rows('modules').filter(m => m.courseId === course.id && visible(m,preview))).map(m => Object.assign(publicRow(m), {
    lessons: ordered(allLessons.filter(l => l.moduleId === m.id && visible(l,preview))).map(l => Object.assign(publicRow(l), { resources: resources(l), contentUrl: l.url, completed: complete.has(l.id) }))
  }));
  return {course:publicRow(course), modules, preview:!!preview};
}
function settings() {
  const result = { name:'Escola de Saberes', subtitle:'Onde a fé encontra o conhecimento.', logo:'https://terreiroiansaguerreira.com.br/wp-content/uploads/2026/01/11-96653-7848.png', color:'#0ea5e9', support:'', welcome:'Bem-vindo(a) à sua área de estudos.' };
  rows('settings').forEach(r => { if (Object.hasOwnProperty.call(result,r.key)) result[r.key] = str(r.value); });
  return result;
}
function dispatch(p) {
  const action = str(p.action);
  if (action === 'health') return {version:LMS_VERSION, schema:2};
  if (action === 'get_settings') return {settings:settings(), version:LMS_VERSION};
  if (action === 'get_profile') return {user:publicRow(profile(p.email))};
  const user = profile(p.userEmail);
  if (action === 'get_courses') return { courses: ordered(rows('courses').filter(c => c.status === 'published' && canAccessCourse(user,c))).map(c => {
    const tree = courseTree(c,user,false), lessons = tree.modules.reduce((a,m) => a.concat(m.lessons),[]);
    return Object.assign(publicRow(c), {totalLessons:lessons.length, completedLessons:lessons.filter(l=>l.completed).length, moduleCount:tree.modules.length});
  }) };
  if (action === 'get_course_content') return courseTree(lookup('courses',p.courseId),user,p.preview === true && user.role === 'master_admin');
  if (action === 'toggle_lesson') return locked(() => toggleProgress(p,user));
  if (action === 'get_flashcards') return flashcards(p,user);
  admin(p.userEmail);
  if (action === 'admin_get_courses') return {courses:ordered(rows('courses')).map(c => Object.assign(publicRow(c),{modules:ordered(rows('modules').filter(m=>m.courseId===c.id)).map(m=>Object.assign(publicRow(m),{lessons:ordered(rows('lessons').filter(l=>l.moduleId===m.id)).map(l=>Object.assign(publicRow(l),{resources:resources(l)}))}))}))};
  if (action === 'admin_get_users') return {users:rows('users').map(u=>Object.assign(publicRow(u),{effectiveCourseIds: rows('courses').filter(c=>canAccessCourse(u,c)).map(c=>c.id)}))};
  if (action === 'admin_get_materials') return {materials:rows('materials').map(publicRow)};
  if (action === 'admin_dashboard') return report(p);
  if (action === 'admin_audit') return {entries:rows('audit').slice(-200).reverse().map(publicRow)};
  if (action === 'admin_diagnostics') return diagnostics();
  if (action === 'admin_import' && p.dryRun === true) return importRows(p);
  if (action === 'admin_check_links') return checkLinks();
  const mutations = ['admin_save','admin_archive','admin_restore','admin_duplicate','admin_reorder','admin_save_user','admin_import','admin_settings','admin_setup','admin_upload'];
  if (mutations.indexOf(action) < 0) fail('Ação não encontrada','UNKNOWN_ACTION');
  return locked(() => {
    admin(p.userEmail);
    const requestId = str(p.requestId);
    if (!requestId || requestId.length > 100) fail('Identificador da operação ausente.');
    const previous = rows('requests').find(r=>r.id===requestId && norm(r.email)===norm(p.userEmail));
    if (previous) { if(previous.action!==action) fail('Identificador reutilizado para outra operação.'); return parse(previous.result,{}); }
    // A pending receipt prevents a repeated request from duplicating a partial operation.
    write('requests',{id:requestId,email:norm(p.userEmail),action,result:JSON.stringify({error:'Operação anterior interrompida. Recarregue e confira os dados antes de iniciar uma nova operação.',code:'INDETERMINATE'}),at:now()});
    let result;
    if(action==='admin_save') result = saveEntity(p);
    if(action==='admin_archive' || action==='admin_restore') result = changeStatus(p, action==='admin_archive'?'archived':'draft');
    if(action==='admin_duplicate') result = duplicate(p);
    if(action==='admin_reorder') result = reorder(p);
    if(action==='admin_save_user') result = saveUser(p);
    if(action==='admin_import') result = importRows(p);
    if(action==='admin_settings') result = saveSettings(p);
    if(action==='admin_setup') { const check=diagnostics(); if(check.errors.length) fail('Corrija as inconsistências indicadas no diagnóstico antes de preparar a estrutura.'); Object.keys(SCHEMA).forEach(k=>table(k,true)); result={success:true,version:LMS_VERSION}; }
    if(action==='admin_upload') result = upload(p);
    write('audit',{id:uid(),at:now(),email:norm(p.userEmail),action,entity:str(p.id || p.kind),details:JSON.stringify({id:result.id || '',count:result.count || 0})});
    write('requests',{result:JSON.stringify(result),at:now()},rows('requests').find(r=>r.id===requestId && norm(r.email)===norm(p.userEmail)));
    return result;
  });
}
function locked(fn) { const lock=LockService.getScriptLock(); lock.waitLock(20000); requestTables={}; try { return fn(); } finally { lock.releaseLock(); } }
function checkVersion(row,version) { if (Number(version)!==Number(row.version)) fail('Este registro foi alterado em outra tela. Recarregue antes de salvar.','CONFLICT'); }
function validUrl(value, optional) {
  const s=str(value); if(!s && optional) return '';
  if(s.length>4000 || !/^https:\/\/[^\s<>"'\\]+$/i.test(s)) fail('Use um endereço HTTPS válido.');
  const host=s.slice(8).split('/')[0].split(':')[0].toLowerCase();
  if(host.indexOf('@')>=0 || host==='localhost' || /^\d+\./.test(host) || host.indexOf('.')<0 || /\.local$/.test(host)) fail('Endereço de recurso não permitido.');
  return s;
}
function required(value,label,max) { const s=str(value); if(!s || s.length>(max || 250)) fail(label+' obrigatório (máximo '+(max||250)+' caracteres).'); return s; }
function validResource(raw) {
  const r={id:str(raw.id)||uid(),title:required(raw.title || 'Material','Título'),type:str(raw.type),url:str(raw.url),text:String(raw.text||'')};
  if(['video','audio','pdf','image','slide','flashcard','text','link'].indexOf(r.type)<0) fail('Tipo de material inválido.');
  if(r.text.length>45000) fail('Texto muito longo. Divida em mais materiais.');
  if(r.type==='text') { required(r.text,'Texto',45000); r.url=''; }
  else if(r.type==='flashcard' && r.text) { r.url=''; }
  else if(r.type==='slide') r.url=r.url.split(/\n|,/).map(v=>validUrl(v)).join('\n');
  else r.url=validUrl(r.url);
  return r;
}
function validateEntity(kind,input,old) {
  if(['courses','modules','lessons','materials'].indexOf(kind)<0) fail('Registro inválido.');
  const data=Object.assign({},old || {},input);
  data.title=required(data.title,'Título');
  data.status=str(data.status)||(old?'published':'draft');
  if(['draft','published','archived'].indexOf(data.status)<0) fail('Situação inválida.');
  data.description=String(data.description||''); if(data.description.length>12000) fail('Descrição muito longa.');
  if(kind==='courses') { data.coverUrl=validUrl(data.coverUrl,true); data.turma=str(data.turma); data.slug=str(data.slug)||norm(data.title).replace(/[^a-z0-9]+/g,'-'); }
  if(kind==='modules') lookup('courses',data.courseId);
  if(kind==='lessons') {
    const parent=lookup('modules',data.moduleId); lookup('courses',parent.courseId);
    const list=Array.isArray(data.resources)?data.resources:resources(data);
    if(list.length>30) fail('Limite de 30 materiais por aula.');
    data.resources=list.map(validResource);
    if(JSON.stringify(data.resources).length>45000) fail('Materiais excedem o limite de texto por aula.');
    if(data.status==='published' && !data.resources.length) fail('Adicione ao menos um material antes de publicar.');
    data.type=data.resources[0]?.type || 'text'; data.url=data.resources[0]?.url || '';
  }
  if(kind==='materials') Object.assign(data,validResource(data));
  data.id=old?old.id:uid(); data.version=(old?old.version:0)+1; data.updatedAt=now();
  data.position=old?old.position:rows(kind).length;
  return data;
}
function saveEntity(p) {
  const old=p.id?lookup(p.kind,p.id):null; if(old) checkVersion(old,p.version);
  const data=validateEntity(p.kind,p.data || {},old);
  if(p.kind==='courses' && old && (data.title!==old.title || data.turma!==old.turma || data.slug!==old.slug)) {
    const catalogue=rows('courses');
    rows('users').filter(u=>!Array.isArray(u.courseIds)).forEach(u=>write('users',{courseIds:catalogue.filter(c=>canAccessCourse(u,c)).map(c=>c.id),version:u.version+1,updatedAt:now()},u));
  }
  write(p.kind,data,old); return {success:true,id:data.id,version:data.version};
}
function changeStatus(p,status) { if(['courses','modules','lessons','materials'].indexOf(p.kind)<0) fail('Tipo inválido.'); const old=lookup(p.kind,p.id); checkVersion(old,p.version); write(p.kind,{status,version:old.version+1,updatedAt:now()},old); return {success:true,id:old.id}; }
function duplicate(p) {
  if(p.kind!=='lessons') fail('A duplicação está disponível para aulas.');
  const old=lookup('lessons',p.id); checkVersion(old,p.version);
  const data=validateEntity('lessons',Object.assign({},old,{title:old.title+' (cópia)',status:'draft',moduleId:p.moduleId||old.moduleId}),null);
  data.resources=data.resources.map(r=>Object.assign({},r,{id:uid()}));
  write('lessons',data); return {success:true,id:data.id};
}
function reorder(p) {
  if(['courses','modules','lessons'].indexOf(p.kind)<0) fail('Ordenação inválida.');
  const key=p.kind==='modules'?'courseId':p.kind==='lessons'?'moduleId':null;
  const list=rows(p.kind).filter(r=>!key || r[key]===p.parentId);
  if(!Array.isArray(p.items) || p.items.length!==list.length || new Set(p.items.map(i=>i.id)).size!==list.length) fail('Lista de ordenação incompleta. Recarregue.');
  p.items.forEach(item=>{const row=list.find(r=>r.id===item.id);if(!row) fail('Registro fora deste grupo.');checkVersion(row,item.version);});
  p.items.forEach((item,index)=>{const row=list.find(r=>r.id===item.id);write(p.kind,{position:index,version:row.version+1,updatedAt:now()},row);});
  return {success:true};
}
function saveUser(p) {
  const input=p.data || {}, email=norm(p.email || input.email);
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail('E-mail inválido.');
  const matches=rows('users').filter(u=>norm(u.email)===email);
  if(matches.length>1) fail('Há cadastros duplicados para este e-mail.');
  const old=matches[0];
  if(old && !p.email) fail('Este e-mail já está cadastrado.');
  if(old) checkVersion(old,p.version);
  const data={email,name:required(input.name,'Nome'),turma:str(input.turma),role:str(input.role)||'normal',status:str(input.status)||'active',courseIds:input.courseIds,version:(old?old.version:0)+1,updatedAt:now()};
  if(['normal','master_admin'].indexOf(data.role)<0 || ['active','blocked'].indexOf(data.status)<0) fail('Papel ou situação inválida.');
  if(!Array.isArray(data.courseIds) || data.courseIds.some(id=>!rows('courses').some(c=>c.id===id))) fail('Matrículas inválidas.');
  if(norm(p.userEmail)===email && (data.role!=='master_admin' || data.status!=='active')) fail('Não é possível remover seu próprio acesso administrativo.');
  if(old && old.role==='master_admin' && (data.role!=='master_admin' || data.status!=='active') && rows('users').filter(u=>norm(u.role)==='master_admin'&&u.status==='active').length<=1) fail('Mantenha ao menos um administrador ativo.');
  write('users',data,old); return {success:true,id:email};
}
function toggleProgress(p,user) {
  user=profile(user.email);
  if(typeof p.isComplete!=='boolean') fail('Estado de conclusão inválido');
  const lesson=lookup('lessons',p.lessonId), module=lookup('modules',lesson.moduleId), course=lookup('courses',module.courseId);
  if(!canAccessCourse(user,course)||[lesson,module,course].some(r=>r.status!=='published')) fail('Acesso negado a esta aula','FORBIDDEN');
  const matches=rows('progress').filter(r=>norm(r.email)===norm(user.email)&&r.lessonId===lesson.id);
  if(p.isComplete && !matches.length) write('progress',{email:norm(user.email),lessonId:lesson.id,completedAt:now()});
  if(!p.isComplete) removeRows('progress',matches);
  write('users',{lastActivity:now()},user);
  return {success:true,completed:p.isComplete};
}
function report(p) {
  const courses=rows('courses'), modules=rows('modules'), lessons=rows('lessons'), progress=rows('progress'), users=rows('users').filter(u=>norm(u.role)!=='master_admin');
  const engagement=[];
  users.filter(u=>!p.turma || norm(u.turma)===norm(p.turma)).forEach(u=>courses.filter(c=>c.status==='published' && (!p.courseId || c.id===p.courseId) && canAccessCourse(u,c)).forEach(c=>{
    const moduleIds=new Set(modules.filter(m=>m.courseId===c.id&&m.status==='published').map(m=>m.id));
    const list=lessons.filter(l=>moduleIds.has(l.moduleId)&&l.status==='published');
    const completed=progress.filter(r=>norm(r.email)===norm(u.email)&&list.some(l=>l.id===r.lessonId));
    const count=new Set(completed.map(r=>r.lessonId)).size;
    const dates=completed.map(r=>str(r.completedAt)).filter(Boolean).sort();
    const lastActivity=str(u.lastActivity)||dates[dates.length-1]||'';
    if(p.since && (!lastActivity || lastActivity.slice(0,10)<p.since)) return;
    if(p.until && (!lastActivity || lastActivity.slice(0,10)>p.until)) return;
    engagement.push({userName:u.name,userEmail:u.email,turma:u.turma,courseId:c.id,courseTitle:c.title,totalLessons:list.length,completedCount:count,progress:list.length?Math.round(count/list.length*100):0,lastActivity});
  }));
  return {stats:{totalUsers:users.length,totalCourses:courses.filter(c=>c.status==='published').length,totalLessons:lessons.filter(l=>l.status==='published' && modules.some(m=>m.id===l.moduleId && m.status==='published' && courses.some(c=>c.id===m.courseId && c.status==='published'))).length,notStarted:engagement.filter(r=>!r.completedCount).length},engagement};
}
function saveSettings(p) {
  const allowed=Object.keys(settings()), input=p.settings || {};
  Object.keys(input).forEach(key=>{if(allowed.indexOf(key)<0) fail('Configuração não permitida.');});
  const values={};
  Object.keys(input).forEach(key=>{values[key]=str(input[key]);if(values[key].length>500) fail('Configuração muito longa.');});
  if('name' in values) required(values.name,'Nome');
  if('color' in values && !/^#[\da-f]{6}$/i.test(values.color)) fail('Use uma cor hexadecimal.');
  if('logo' in values) validUrl(values.logo,true);
  if('support' in values && values.support) { if(!/^mailto:[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.support)) validUrl(values.support); }
  Object.keys(values).forEach(key=>write('settings',{key,value:values[key]},rows('settings').find(r=>r.key===key)));
  return {success:true,settings:settings()};
}
function diagnostics() {
  const errors=[],warnings=[];
  ['courses','modules','lessons'].forEach(kind=>{const ids=new Set();rows(kind).forEach(r=>{if(!r.id || ids.has(r.id)) errors.push(kind+': ID vazio ou duplicado (linha '+r._row+').');ids.add(r.id);});});
  const emails=new Set();rows('users').forEach(u=>{if(!norm(u.email)||emails.has(norm(u.email))) errors.push('E-mail vazio ou duplicado (linha '+u._row+').');emails.add(norm(u.email));});
  rows('modules').forEach(m=>{if(!rows('courses').some(c=>c.id===m.courseId)) errors.push('Módulo órfão: '+m.id);});
  rows('lessons').forEach(l=>{if(!rows('modules').some(m=>m.id===l.moduleId)) errors.push('Aula órfã: '+l.id);});
  rows('progress').forEach(r=>{if(!rows('lessons').some(l=>l.id===r.lessonId)) warnings.push('Progresso com aula ausente: '+r.lessonId);});
  return {version:LMS_VERSION,errors,warnings,counts:Object.fromEntries(Object.keys(SCHEMA).map(k=>[k,rows(k).length]))};
}
function importRows(p) {
  if(!Array.isArray(p.items)||p.items.length<1||p.items.length>100) fail('Importe entre 1 e 100 linhas.');
  const accepted=[],errors=[], seen=new Set();
  p.items.forEach((item,i)=>{try {
    const data=validateEntity('lessons',{title:item.title,moduleId:p.moduleId,status:'draft',resources:[{title:item.title,type:item.type,url:item.url,text:item.text||''}]},null);
    const key=norm(data.title)+'|'+data.moduleId+'|'+data.url;
    if(seen.has(key)||rows('lessons').some(l=>norm(l.title)+'|'+l.moduleId+'|'+l.url===key)) fail('Aula duplicada.');
    seen.add(key);accepted.push(data);
  } catch(e) {errors.push({line:i+1,error:e.message});}});
  if(p.dryRun) return {success:true,count:accepted.length,errors,preview:accepted.map(publicRow)};
  if(errors.length) fail('Corrija os erros da prévia antes de importar.');
  const offset=rows('lessons').length; accepted.forEach((data,i)=>data.position=offset+i); appendBatch('lessons',accepted);
  return {success:true,count:accepted.length};
}
function upload(p) {
  const mime=str(p.mime), allowed=['application/pdf','image/png','image/jpeg','image/webp','audio/mpeg','audio/mp4','video/mp4','text/csv'];
  if(allowed.indexOf(mime)<0) fail('Formato de arquivo não permitido.');
  if(!p.base64 || p.base64.length>7000000) fail('Limite de 5 MB. Para vídeos maiores, use um link.');
  const bytes=Utilities.base64Decode(p.base64); if(bytes.length>5*1024*1024) fail('Arquivo maior que 5 MB.');
  const name=required(p.name,'Nome do arquivo');
  const props=PropertiesService.getScriptProperties();let folderId=props.getProperty('LMS_UPLOAD_FOLDER');
  if(!folderId){folderId=DriveApp.createFolder('Escola de Saberes — Materiais').getId();props.setProperty('LMS_UPLOAD_FOLDER',folderId);}
  const file=DriveApp.getFolderById(folderId).createFile(Utilities.newBlob(bytes,mime,name));
  try { file.setSharing(DriveApp.Access.ANYONE_WITH_LINK,DriveApp.Permission.VIEW); }
  catch(e) { file.setTrashed(true); fail('O Google Workspace não permitiu compartilhar este arquivo por link.'); }
  return {success:true,id:file.getId(),url:file.getUrl()};
}
function flashcards(p,user) {
  const lesson=lookup('lessons',p.lessonId), module=lookup('modules',lesson.moduleId), course=lookup('courses',module.courseId);
  const preview=p.preview===true && user.role==='master_admin';
  if(!canAccessCourse(user,course)||[lesson,module,course].some(r=>!visible(r,preview))) fail('Acesso negado','FORBIDDEN');
  const resource=resources(lesson).find(r=>r.id===p.resourceId);
  if(!resource || resource.type!=='flashcard') fail('Material não encontrado.');
  if(resource.text) return {csv:resource.text};
  let url=validUrl(resource.url);
  const match=url.match(/^https:\/\/(?:drive|docs)\.google\.com\/(?:file\/d|spreadsheets\/d)\/([\w-]+)/);
  if(match) url=url.indexOf('spreadsheets')>=0?'https://docs.google.com/spreadsheets/d/'+match[1]+'/export?format=csv':'https://drive.google.com/uc?export=download&id='+match[1];
  let response;
  for(let hop=0;hop<4;hop++) {
    response=UrlFetchApp.fetch(url,{muteHttpExceptions:true,followRedirects:false});
    const code=response.getResponseCode();
    if(code>=300 && code<400) {
      const headers=response.getHeaders();
      const location=headers.Location || headers.location;
      if(!location)break;
      url=validUrl(location); // Only HTTPS public destinations, no credentials or local addresses.
      continue;
    }
    break;
  }
  if(response.getResponseCode()!==200) fail('Não foi possível ler o CSV. Use um link público direto ou cole o conteúdo no editor.');
  if(response.getContent().length>1024*1024) fail('CSV excede 1 MB.');
  const csv=response.getContentText();if(/<html|<!doctype/i.test(csv)) fail('O link retornou uma página, não um CSV.');
  return {csv};
}
function checkLinks() {
  const list=rows('materials').filter(m=>m.status!=='archived' && m.url && m.type!=='slide').slice(0,25);
  return {limit:25,results:list.map(m=>{try{const url=validUrl(m.url);const response=UrlFetchApp.fetch(url,{muteHttpExceptions:true,followRedirects:false});const code=response.getResponseCode();return {id:m.id,title:m.title,code,status:code>=200&&code<300?'Respondeu':code===404||code===410?'Não encontrado':'Inconclusivo (acesso ou redirecionamento)'};}catch(e){return {id:m.id,title:m.title,code:0,status:'Inconclusivo: '+e.message};}})};
}
/** Execute uma vez no editor se o Google solicitar novas permissões após a atualização. */
function autorizarEscola() {
  db().getName();
  DriveApp.getFileById(DB_ID).getName();
  return {version:LMS_VERSION,ready:true};
}
