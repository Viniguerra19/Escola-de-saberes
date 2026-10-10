export const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const h = escapeHtml;
export function safeUrl(value, support = false) {
  try { const u = new URL(String(value)); return (u.protocol === 'https:' || support && u.protocol === 'mailto:') && !u.username && !u.password ? u.href : ''; } catch { return ''; }
}
export function button(text, fn, cls = 'btn btn-secondary') {
  const b=document.createElement('button');b.type='button';b.className=cls;b.textContent=text;
  b.addEventListener('click',async event=>{if(b.dataset.busy)return;try{const result=fn(event);if(result&&typeof result.then==='function'){b.dataset.busy='true';b.disabled=true;await result;}}catch(error){const message=document.createElement('p');message.className='form-error';message.setAttribute('role','alert');message.textContent=error.message;b.after(message);}finally{if(b.dataset.busy){delete b.dataset.busy;b.disabled=false;}}});return b;
}
export function download(name, value, type='application/json') { const url=URL.createObjectURL(new Blob([typeof value==='string'?value:JSON.stringify(value,null,2)],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000); }
export function csvCell(value) { let s=String(value??'');if(/^[\s]*[=+@\-]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"'; }
export function parseCsv(text) {
  const first=text.split(/\r?\n/)[0], delimiter=first.split(';').length>first.split(',').length?';':',';
  const rows=[];let row=[],cell='',quoted=false;
  for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;}else if(c===delimiter&&!quoted){row.push(cell);cell='';}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(cell);if(row.some(v=>v.trim()))rows.push(row);row=[];cell='';}else cell+=c;}
  if(quoted)throw new Error('CSV com aspas não fechadas.');row.push(cell);if(row.some(v=>v.trim()))rows.push(row);return rows;
}
export function modal(title, html, onSubmit, label='Salvar') {
  const previous=document.activeElement, dialog=document.createElement('dialog');dialog.className='lms-dialog';
  dialog.innerHTML=`<form><header><h2>${h(title)}</h2><button type="button" class="btn btn-ghost close-dialog" aria-label="Fechar">✕</button></header><div class="dialog-body">${html}</div><p class="form-error" role="alert"></p><footer><button type="button" class="btn btn-secondary cancel-dialog">Cancelar</button><button class="btn btn-primary submit-dialog">${h(label)}</button></footer></form>`;
  document.body.append(dialog);dialog.showModal();
  const close=()=>{dialog.close();dialog.remove();previous?.focus();};dialog.querySelector('.close-dialog').onclick=close;dialog.querySelector('.cancel-dialog').onclick=close;dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
  const form=dialog.querySelector('form');form.onsubmit=async e=>{e.preventDefault();const submit=dialog.querySelector('.submit-dialog');submit.disabled=true;dialog.querySelector('.form-error').textContent='';try{await onSubmit(new FormData(form),dialog);close();}catch(err){dialog.querySelector('.form-error').textContent=err.message;}finally{submit.disabled=false;}};
  return dialog;
}
export const field=(name,label,value='',type='text',required=false)=>`<label class="field">${h(label)}<input name="${h(name)}" type="${type}" value="${h(value)}" ${required?'required':''} /></label>`;
export const area=(name,label,value='',rows=4)=>`<label class="field">${h(label)}<textarea name="${h(name)}" rows="${rows}">${h(value)}</textarea></label>`;
export const select=(name,label,options,value)=>`<label class="field">${h(label)}<select name="${h(name)}">${options.map(o=>`<option value="${h(o[0])}" ${String(o[0])===String(value)?'selected':''}>${h(o[1])}</option>`).join('')}</select></label>`;
export function announce(message) { const el=document.getElementById('app-status');if(el)el.textContent=message; }
