import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
const buildRoot=path.resolve('dist');
import {backend} from '../tests/support/backend.js';
const b=backend();
for(let m=2;m<=50;m++)b.data.Modulos.push(['M'+m,'C1','Módulo '+m]);
for(let l=2;l<=1000;l++)b.data['Lições'].push(['L'+l,'M'+(2+(l%49)),'Aula '+l,'text','']);
b.call('admin_save',{kind:'lessons',id:'L1',version:0,data:{title:'Boas-vindas à formação',status:'published',description:'Conheça o percurso de estudos.',resources:[{id:'R1',title:'Comece por aqui',type:'text',text:'Este é um ambiente de teste com dados fictícios.\n\nExplore os módulos, a busca e os materiais.',url:''},{id:'R2',title:'Revise os conceitos',type:'flashcard',text:'Pergunta,Resposta\nComo começar?,Abra um módulo e escolha uma aula.\nComo acompanhar?,Marque as aulas concluídas.',url:''}]}});
http.createServer(async(req,res)=>{
  if(req.method==='GET') {
    try {
      const pathname=new URL(req.url,'http://localhost').pathname.replace(/^\/escoladesaberes\//,'/');
      if(pathname==='/config.js'){res.setHeader('Content-Type','application/javascript');res.end("window.EDS_CONFIG={apiUrl:'http://127.0.0.1:4174'};");return;}
      const target=path.resolve(buildRoot,'.'+(pathname.endsWith('/')?pathname+'index.html':pathname));
      if(!target.startsWith(buildRoot+path.sep)){res.statusCode=403;res.end();return;}
      const ext=path.extname(target);res.setHeader('Content-Type',({'.html':'text/html','.js':'application/javascript','.mjs':'application/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png'})[ext]||'application/octet-stream');res.end(await readFile(target));
    }catch{res.statusCode=404;res.end('Not found');}return;
  }
  res.setHeader('Access-Control-Allow-Origin','*');res.setHeader('Content-Type','application/json');if(req.method==='OPTIONS'){res.setHeader('Access-Control-Allow-Headers','content-type');res.end();return;}let body='';for await(const chunk of req)body+=chunk;try{const p=JSON.parse(body);res.end(JSON.stringify(b.call(p.action,p,p.userEmail)));}catch(e){res.end(JSON.stringify({error:e.message}));}}).listen(4174,'127.0.0.1',()=>console.log('API de teste em 127.0.0.1:4174; dados fictícios em memória.'));
