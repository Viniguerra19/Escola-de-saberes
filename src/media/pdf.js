import * as pdfjs from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import {button} from '../utils/ui.js';
pdfjs.GlobalWorkerOptions.workerSrc=workerUrl;
export async function mountPdf(host,url,isDisposed){
  const loading=pdfjs.getDocument({url,isEvalSupported:false});let task=null,doc=null,disposed=false,page=1,zoom=1,busy=false;
  const cleanup=()=>{disposed=true;task?.cancel();loading.destroy();};
  // Return cleanup immediately; document loading continues within this mounted instance.
  (async()=>{try{doc=await loading.promise;if(disposed||isDisposed()){cleanup();return;}host.replaceChildren();const controls=document.createElement('div');controls.className='pdf-controls';const label=document.createElement('span');const canvas=document.createElement('canvas');const stage=document.createElement('div');stage.className='pdf-stage';stage.append(canvas);const prev=button('← Página',()=>{page--;render();}),next=button('Página →',()=>{page++;render();}),minus=button('− Zoom',()=>{zoom=Math.max(.5,zoom-.25);render();}),plus=button('+ Zoom',()=>{zoom=Math.min(3,zoom+.25);render();});controls.append(prev,label,next,minus,plus);host.append(controls,stage);
    async function render(){if(busy||disposed)return;busy=true;[prev,next,minus,plus].forEach(b=>b.disabled=true);try{const p=await doc.getPage(page);if(disposed)return;const base=p.getViewport({scale:1}),width=Math.max(250,host.clientWidth-32),scale=width/base.width*zoom,viewport=p.getViewport({scale}),ratio=Math.min(devicePixelRatio||1,2);canvas.width=viewport.width*ratio;canvas.height=viewport.height*ratio;canvas.style.width=viewport.width+'px';canvas.style.height=viewport.height+'px';task=p.render({canvasContext:canvas.getContext('2d'),viewport,transform:ratio!==1?[ratio,0,0,ratio,0,0]:null});await task.promise;label.textContent=`${page} / ${doc.numPages}`;}finally{busy=false;if(!disposed){prev.disabled=page<=1;next.disabled=page>=doc.numPages;minus.disabled=zoom<=.5;plus.disabled=zoom>=3;}}}await render();
  }catch(e){if(!disposed&&!isDisposed()){host.replaceChildren();const p=document.createElement('p');p.textContent='Não foi possível abrir o PDF nesta tela. A hospedagem precisa permitir leitura por outros sites.';const a=document.createElement('a');a.href=url;a.target='_blank';a.rel='noopener';a.textContent='Abrir PDF original';host.append(p,a);}}})();return cleanup;
}
