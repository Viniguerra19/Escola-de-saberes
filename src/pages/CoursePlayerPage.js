import {apiGetCourseContent,apiMarkComplete,apiUnmarkComplete} from '../api.js';
import {getUser} from '../auth.js';
import {renderNavbar} from '../components/Navbar.js';
import {showToast} from '../components/Toast.js';
import {h,button,announce} from '../utils/ui.js';
import {mountResource} from '../media/render.js';
export async function renderCoursePlayerPage(params){
  const root=document.createElement('div');root.append(renderNavbar());let disposeMedia=()=>{},disposed=false,drawer=null;
  root.dispose=()=>{disposed=true;disposeMedia();drawer?.remove();};
  const data=await apiGetCourseContent(params.id,!!params.preview);if(disposed)return root;
  const modules=data.modules||[],all=modules.flatMap(m=>m.lessons),key=`eds_last_lesson_${getUser()?.email}_${params.id}`;
  let active=null,openModule=null,query='',resourceIndex=0;
  const pending=new Set();
  const layout=document.createElement('main');layout.className='learning-layout';root.append(layout);
  layout.innerHTML=`<aside class="learning-sidebar"></aside><section class="learning-main"><div class="lesson-topline"><a href="#/dashboard">← Meus cursos</a><button class="btn btn-secondary mobile-curriculum" type="button">Aulas deste curso</button></div><div class="lesson-body"></div></section>`;
  const aside=layout.querySelector('aside'),main=layout.querySelector('.learning-main'),body=layout.querySelector('.lesson-body');
  const panel=document.createElement('div');panel.className='curriculum-panel';aside.append(panel);
  panel.innerHTML=`<p class="eyebrow">${data.preview?'PRÉVIA ADMINISTRATIVA':'SEU PERCURSO'}</p><h2>${h(data.course.title)}</h2><p class="progress-label"></p><progress max="100" value="0" aria-label="Progresso do curso"></progress><button class="btn btn-secondary overview-button" type="button">Visão geral do curso</button><label class="field">Buscar módulo ou aula<input type="search" class="lesson-search" placeholder="O que você quer estudar?" /></label><nav class="module-list" aria-label="Módulos e aulas"></nav>`;
  const nav=panel.querySelector('nav');
  function updateProgress(){const count=all.filter(l=>l.completed).length;panel.querySelector('progress').value=all.length?Math.round(count/all.length*100):0;panel.querySelector('.progress-label').textContent=`${count} de ${all.length} aulas concluídas`;}
  function renderNav(){updateProgress();nav.replaceChildren();const q=query.toLocaleLowerCase();const filtered=modules.filter(m=>!q||(m.title+' '+m.lessons.map(l=>l.title).join(' ')).toLocaleLowerCase().includes(q));
    if(!filtered.length){nav.textContent='Nenhuma aula encontrada.';return;}
    filtered.forEach(m=>{const section=document.createElement('section');section.className='curriculum-module';const matches=!q||m.title.toLocaleLowerCase().includes(q)?m.lessons:m.lessons.filter(l=>l.title.toLocaleLowerCase().includes(q));const expanded=!!q||openModule===m.id;const toggle=button(`${expanded?'▾':'▸'} ${m.title} · ${m.lessons.length}`,()=>{openModule=expanded?null:m.id;renderNav();},'module-toggle');toggle.setAttribute('aria-expanded',String(expanded));section.append(toggle);if(expanded){matches.forEach(l=>{const b=button(`${l.completed?'✓':'○'} ${l.title}`,()=>selectLesson(l),'lesson-link'+(active?.id===l.id?' active':''));if(active?.id===l.id)b.setAttribute('aria-current','page');section.append(b);});if(!matches.length){const p=document.createElement('p');p.textContent='Ainda não há aulas neste módulo.';section.append(p);}}nav.append(section);});
  }
  panel.querySelector('.lesson-search').oninput=e=>{query=e.target.value;renderNav();};
  drawer=document.createElement('dialog');drawer.className='curriculum-drawer';document.body.append(drawer);const close=()=>{drawer.close();aside.append(panel);main.querySelector('.mobile-curriculum').focus();};drawer.addEventListener('cancel',e=>{e.preventDefault();close();});main.querySelector('.mobile-curriculum').onclick=()=>{drawer.replaceChildren(button('Fechar aulas ✕',close,'btn btn-secondary'),panel);drawer.showModal();};
  panel.querySelector('.overview-button').onclick=()=>{if(drawer.open)close();overview();};
  function overview(){active=null;disposeMedia();renderNav();body.innerHTML=`<header class="course-overview"><p class="eyebrow">VISÃO GERAL</p><h1>${h(data.course.title)}</h1><p>${h(data.course.description)}</p><p>${modules.length} módulos · ${all.length} aulas</p><div class="overview-resume"></div></header><div class="overview-modules"></div>`;
    let last;try{last=localStorage.getItem(key);}catch{}const resume=all.find(l=>l.id===last)||all.find(l=>!l.completed)||all[0];if(resume)body.querySelector('.overview-resume').append(button('Continuar estudos →',()=>selectLesson(resume),'btn btn-primary'));
    modules.forEach(m=>{const card=document.createElement('article');card.className='card overview-module';card.innerHTML=`<h2>${h(m.title)}</h2><p>${m.lessons.filter(l=>l.completed).length} de ${m.lessons.length} aulas concluídas</p>`;card.append(button('Ver aulas',()=>{openModule=m.id;renderNav();if(matchMedia('(max-width: 800px)').matches)main.querySelector('.mobile-curriculum').click();else panel.querySelector('.module-list').scrollIntoView({block:'nearest'});},'btn btn-secondary'));body.querySelector('.overview-modules').append(card);});
    if(!modules.length)body.insertAdjacentHTML('beforeend','<p class="empty-state">Nenhum módulo publicado ainda.</p>');
  }
  function selectLesson(lesson){disposeMedia();active=lesson;resourceIndex=0;openModule=modules.find(m=>m.lessons.some(l=>l.id===lesson.id))?.id;query='';panel.querySelector('.lesson-search').value='';if(drawer.open)close();try{localStorage.setItem(key,lesson.id);}catch{}
    if(!params.preview)history.replaceState(null,'',`#/course/${encodeURIComponent(params.id)}/lesson/${encodeURIComponent(lesson.id)}`);
    renderNav();const module=modules.find(m=>m.id===openModule);body.innerHTML=`<p class="eyebrow">${h(module?.title)}</p><h1 tabindex="-1">${h(lesson.title)}</h1>${data.preview?'<p class="preview-banner">Prévia: rascunhos e conteúdos arquivados são visíveis somente nesta tela administrativa.</p>':''}<p class="lesson-description">${h(lesson.description)}</p><div class="resource-tabs" role="group" aria-label="Materiais da aula"></div><section class="resource-stage" aria-live="polite"></section><div class="lesson-completion"><label><input type="checkbox" class="complete-checkbox" /> <span></span></label></div><div class="lesson-pagination"></div>`;
    const resources=lesson.resources?.length?lesson.resources:lesson.contentUrl?[{id:'legacy-'+lesson.id,title:lesson.title,type:lesson.type,url:lesson.contentUrl}]:[];
    function showResource(index){disposeMedia();resourceIndex=index;body.querySelectorAll('.resource-tab').forEach((b,i)=>{b.classList.toggle('active',i===index);b.setAttribute('aria-pressed',String(i===index));});disposeMedia=mountResource(body.querySelector('.resource-stage'),resources[index],{lessonId:lesson.id,preview:data.preview});}
    resources.forEach((r,i)=>{const b=button(`${i+1}. ${r.title}`,()=>showResource(i),'resource-tab');body.querySelector('.resource-tabs').append(b);});
    if(resources.length)showResource(0);else body.querySelector('.resource-stage').textContent='Esta aula ainda não possui materiais.';
    const input=body.querySelector('.complete-checkbox');input.onchange=()=>complete(lesson,input.checked);refreshCompletion();
    const index=all.findIndex(l=>l.id===lesson.id),prev=button('← Aula anterior',()=>selectLesson(all[index-1])),next=button('Próxima aula →',()=>selectLesson(all[index+1]),'btn btn-primary');prev.disabled=index===0;next.disabled=index===all.length-1;body.querySelector('.lesson-pagination').append(prev,next);
    body.querySelector('h1').focus({preventScroll:true});window.scrollTo({top:0,behavior:'instant'});announce(lesson.title);
  }
  function refreshCompletion(){if(!active)return;const input=body.querySelector('.complete-checkbox');if(!input)return;input.checked=!!active.completed;input.disabled=pending.has(active.id)||data.preview;body.querySelector('.lesson-completion span').textContent=data.preview?'A conclusão fica disponível na área do aluno.':pending.has(active.id)?'Salvando…':active.completed?'Aula concluída':'Marcar como concluída';}
  async function complete(lesson,value){if(pending.has(lesson.id))return;pending.add(lesson.id);const old=lesson.completed;lesson.completed=value;renderNav();refreshCompletion();try{if(value)await apiMarkComplete(lesson.id);else await apiUnmarkComplete(lesson.id);announce(value?'Aula concluída':'Conclusão removida');}catch(e){lesson.completed=old;showToast(e.message,'error');}finally{pending.delete(lesson.id);if(!disposed){renderNav();refreshCompletion();}}}
  renderNav();const requested=all.find(l=>l.id===params.lessonId);if(requested)selectLesson(requested);else overview();return root;
}
