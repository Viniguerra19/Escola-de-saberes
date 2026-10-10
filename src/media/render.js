import {h,safeUrl,button,parseCsv} from '../utils/ui.js';
import {apiRequest} from '../api.js';
export function mountResource(host,resource,context){
  let disposed=false,cleanup=()=>{};host.replaceChildren();
  const error=message=>{if(disposed)return;host.innerHTML=`<div class="empty-state"><h3>Material indisponível</h3><p>${h(message)}</p></div>`;if(safeUrl(resource.url)){const link=document.createElement('a');link.href=safeUrl(resource.url);link.target='_blank';link.rel='noopener noreferrer';link.className='btn btn-secondary';link.textContent='Abrir arquivo original';host.append(link);}};
  async function start(){
    const type=resource.type,url=safeUrl(resource.url),drive=url.match(/^https:\/\/(?:drive|docs)\.google\.com\/(?:file\/d|document\/d|presentation\/d)\/([\w-]+)/);
    let youtube='';if(url){const parsed=new URL(url);if(['www.youtube.com','youtube.com','m.youtube.com','youtu.be'].includes(parsed.hostname)){youtube=parsed.hostname==='youtu.be'?parsed.pathname.slice(1):parsed.searchParams.get('v')||parsed.pathname.split('/').filter(Boolean).at(-1);if(!/^[\w-]{11}$/.test(youtube||''))youtube='';}}
    if(type==='text'){const block=document.createElement('div');block.className='lesson-text';block.textContent=resource.text;host.append(block);return;}
    if(type==='flashcard'){
      host.innerHTML='<p role="status">Carregando cartões…</p>';
      const csv=resource.text||(await apiRequest('get_flashcards',{lessonId:context.lessonId,resourceId:resource.id,preview:context.preview})).csv;
      if(disposed)return;let cards=parseCsv(csv);if(/^(frente|pergunta|front)$/i.test(cards[0]?.[0]?.trim()))cards.shift();cards=cards.filter(row=>row[0]&&row[1]);if(!cards.length)throw new Error('Inclua duas colunas: pergunta e resposta.');let index=0,flipped=false;
      const render=()=>{host.replaceChildren();const card=button((flipped?'Resposta\n\n':'Pergunta\n\n')+cards[index][flipped?1:0],()=>{flipped=!flipped;render();},'flashcard');card.setAttribute('aria-label','Cartão '+(index+1)+': '+card.textContent+'. Clique para virar.');host.append(card);const controls=document.createElement('div');controls.className='toolbar';const prev=button('← Anterior',()=>{index--;flipped=false;render();});prev.disabled=index===0;const next=button('Próximo →',()=>{index++;flipped=false;render();});next.disabled=index===cards.length-1;controls.append(prev,document.createTextNode(`${index+1} / ${cards.length}`),next);host.append(controls);};render();return;
    }
    if(type==='slide'){
      const urls=String(resource.url).split(/\n|,/).map(s=>safeUrl(s.trim())).filter(Boolean);if(!urls.length)throw new Error('Nenhuma imagem válida.');let index=0;const img=document.createElement('img');img.className='lesson-image';const label=document.createElement('span');const controls=document.createElement('div');controls.className='toolbar';const prev=button('← Anterior',()=>{index--;update();}),next=button('Próximo →',()=>{index++;update();});controls.append(prev,label,next);host.append(img,controls);function update(){img.src=urls[index];img.alt=`Slide ${index+1} de ${urls.length}`;label.textContent=`${index+1} / ${urls.length}`;prev.disabled=index===0;next.disabled=index===urls.length-1;}img.onerror=()=>error('Não foi possível abrir esta imagem.');update();return;
    }
    if(!url)throw new Error('Link HTTPS inválido.');
    if(drive && ['video','audio','pdf','image'].includes(type) || youtube&&type==='video'){
      const iframe=document.createElement('iframe');iframe.className='media-frame '+(type==='pdf'?'document-frame':'');iframe.title=resource.title;iframe.src=youtube?`https://www.youtube-nocookie.com/embed/${youtube}`:`https://drive.google.com/file/d/${drive[1]}/preview${new URL(url).searchParams.get('resourcekey')?'?resourcekey='+encodeURIComponent(new URL(url).searchParams.get('resourcekey')):''}`;iframe.allow='fullscreen; picture-in-picture';iframe.allowFullscreen=true;iframe.referrerPolicy='strict-origin-when-cross-origin';host.append(iframe);cleanup=()=>{iframe.src='about:blank';};return;
    }
    if(type==='video'||type==='audio'){const media=document.createElement(type);media.controls=true;media.preload='metadata';if(type==='video')media.playsInline=true;media.src=url;media.className='native-media';media.addEventListener('error',()=>error('O formato ou a hospedagem não permitiu reproduzir o arquivo.'));host.append(media);cleanup=()=>{media.pause();media.removeAttribute('src');media.load();};return;}
    if(type==='image'){const img=document.createElement('img');img.src=url;img.alt=resource.title;img.className='lesson-image';img.onerror=()=>error('Não foi possível carregar a imagem.');host.append(img);return;}
    if(type==='pdf'){
      host.innerHTML='<p role="status">Carregando PDF…</p>';const {mountPdf}=await import('./pdf.js');if(disposed)return;cleanup=await mountPdf(host,url,()=>disposed);return;
    }
    const a=document.createElement('a');a.href=url;a.target='_blank';a.rel='noopener noreferrer';a.className='btn btn-primary';a.textContent='Abrir '+resource.title;host.append(a);
  }
  start().catch(e=>error(e.message));return ()=>{disposed=true;cleanup();host.querySelectorAll('iframe').forEach(f=>f.remove());};
}
