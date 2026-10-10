import './styles/global.css';
import './styles/components.css';
import './styles/layout.css';
import './styles/login.css';
import './styles/lms.css';
import {router} from './router.js';
import {isLoggedIn,refreshUser} from './auth.js';
import {loadSettings} from './settings.js';
let renderId=0, active=null;
async function render(loader,params){
  const id=++renderId,root=document.getElementById('app');active?.dispose?.();active=null;
  document.querySelectorAll('.lms-dialog').forEach(d=>d.remove());
  root.innerHTML='<div class="loading-screen" role="status"><div class="spinner"></div><p>Carregando…</p></div>';
  try{const page=await loader(params);if(id!==renderId){page.dispose?.();return;}active=page;root.replaceChildren(page);window.scrollTo(0,0);}
  catch(error){if(id!==renderId)return;root.innerHTML='<main class="page-container empty-state"><h1>Não foi possível abrir esta página</h1><p></p><a href="#/dashboard">Voltar para meus cursos</a></main>';root.querySelector('p').textContent=error.message;}
}
async function init(){
  localStorage.removeItem('eds_token');
  await Promise.all([loadSettings(),isLoggedIn()?refreshUser():Promise.resolve()]);
  router.guard(to=>{if(!isLoggedIn()&&to!=='login'){router.navigate('login');return false;}if(isLoggedIn()&&to==='login'){router.navigate('dashboard');return false;}return true;});
  router.on('login',()=>render(async()=> (await import('./pages/LoginPage.js')).renderLoginPage()))
    .on('dashboard',()=>render(async()=> (await import('./pages/DashboardPage.js')).renderDashboardPage()))
    .on('course/:id',p=>render(async p=>(await import('./pages/CoursePlayerPage.js')).renderCoursePlayerPage(p),p))
    .on('course/:id/lesson/:lessonId',p=>render(async p=>(await import('./pages/CoursePlayerPage.js')).renderCoursePlayerPage(p),p))
    .on('preview/:id',p=>render(async p=>(await import('./pages/CoursePlayerPage.js')).renderCoursePlayerPage({...p,preview:true}),p))
    .on('admin',()=>render(async()=> (await import('./pages/AdminPage.js')).renderAdminPage()));
  router.start();
}
document.addEventListener('DOMContentLoaded',()=>{init().catch(error=>{document.getElementById('app').textContent='Não foi possível iniciar: '+error.message;});});
