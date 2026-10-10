import { API_URL, STORAGE_KEYS } from './utils/constants.js';
import { getStoredJSON } from './utils/helpers.js';
export async function apiRequest(action, params = {}, options = {}) {
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),options.timeout||45000);
  const request={...params,action};
  if(!['get_profile','get_settings','health'].includes(action))request.userEmail=getStoredJSON(STORAGE_KEYS.USER)?.email||'';
  if(action.startsWith('admin_')&&!['admin_get_courses','admin_get_users','admin_get_materials','admin_dashboard','admin_audit','admin_diagnostics','admin_check_links'].includes(action))request.requestId=params.requestId||crypto.randomUUID();
  try {
    const response=await fetch(API_URL,{method:'POST',headers:{'Content-Type':'text/plain'},body:JSON.stringify(request),signal:controller.signal,redirect:'follow'});
    if(!response.ok)throw new Error(`Falha de comunicação (${response.status}). Tente novamente.`);
    let data;try{data=await response.json();}catch{throw new Error('O servidor não retornou JSON. Confira a implantação do Apps Script.');}
    if(!data || typeof data!=='object')throw new Error('Resposta inválida do servidor.');
    if(data.error){const error=new Error(data.error);error.code=data.code;throw error;}return data;
  } catch(error){if(error.name==='AbortError')throw new Error('O servidor demorou para responder. Recarregue para conferir se a operação foi salva antes de repetir.');throw error;}
  finally{clearTimeout(timer);}
}
export const apiLogin=email=>apiRequest('get_profile',{email});
export const apiGetCourses=()=>apiRequest('get_courses');
export const apiGetCourseContent=(courseId,preview=false)=>apiRequest('get_course_content',{courseId,preview});
export const apiMarkComplete=lessonId=>apiRequest('toggle_lesson',{lessonId,isComplete:true});
export const apiUnmarkComplete=lessonId=>apiRequest('toggle_lesson',{lessonId,isComplete:false});
export function clearCache(){Object.keys(localStorage).forEach(key=>{if(key.startsWith('eds_')&&key!==STORAGE_KEYS.USER&&!key.startsWith('eds_last_lesson_'))localStorage.removeItem(key);});}
