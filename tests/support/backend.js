import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../../google-apps-script/Code.gs',import.meta.url),'utf8');
export function backend(){
  const data={
    'Usuários':[['Nome','Email','Permissão','Cursos Escola de Saberes','Turma'],['Admin','admin@example.test','master_admin','',''],['Ana','ana@example.test','normal','Ritos','Sexta'],['Bia','bia@example.test','normal','Ritos','Sábado']],
    cursos:[['id','Título','Descrição','slug','url','turma'],['C1','Ritos','Formação','ritos','','Sexta'],['C2','Estudos','Curso 2','estudos','','']],
    Modulos:[['id','id do curso','titulos'],['M0','C1','Vazio'],['M1','C1','Introdução']],
    'Lições':[['id','id do modulo','titulo','type','url'],['L1','M1','Primeira aula','video','https://example.test/video.mp4']],
    'Progresso do usuarios':[['e-mail','Aula'],['ana@example.test','L1']]
  };let sequence=0;
  class Sheet{
    constructor(name){this.name=name;}
    getMaxRows(){return 100000;}
    getMaxColumns(){return 1000;}
    getLastRow(){const v=data[this.name];let i=v.length;while(i>0&&v[i-1].every(x=>x===''||x==null))i--;return i;}
    getLastColumn(){return Math.max(1,...data[this.name].map(r=>r.length));}
    getDataRange(){return this.getRange(1,1,Math.max(1,this.getLastRow()),this.getLastColumn());}
    getRange(row,col,height=1,width=1){return {getValues:()=>Array.from({length:height},(_,i)=>Array.from({length:width},(_,j)=>data[this.name][row+i-1]?.[col+j-1]??'')),setValue:value=>this.getRange(row,col).setValues([[value]]),setValues:values=>{for(let i=0;i<height;i++){data[this.name][row+i-1]??=[];for(let j=0;j<width;j++){let value=values[i][j];if(typeof value==='string'&&value.startsWith("'"))value=value.slice(1);data[this.name][row+i-1][col+j-1]=value;}}},clearContent:()=>{for(let i=0;i<height;i++)for(let j=0;j<width;j++){data[this.name][row+i-1]??=[];data[this.name][row+i-1][col+j-1]='';}}};}
    deleteRow(index){data[this.name].splice(index-1,1);}
  }
  const spreadsheet={getSheetByName:name=>Object.hasOwn(data,name)?new Sheet(name):null,insertSheet:name=>{data[name]=[['']];return new Sheet(name);}};
  const context=vm.createContext({console,Date,Set,Map,SpreadsheetApp:{openById:()=>spreadsheet},ContentService:{MimeType:{JSON:'json'},createTextOutput:text=>({text,setMimeType(){return this;}})},LockService:{getScriptLock:()=>({waitLock(){},releaseLock(){}})},Utilities:{getUuid:()=>`id-${++sequence}`} });
  vm.runInContext(source,context);
  function call(action,params={},email='admin@example.test') {const body={action,userEmail:email,requestId:`req-${++sequence}`,...params};return JSON.parse(context.handleRequest({postData:{contents:JSON.stringify(body)}},'POST').text);}
  return {data,context,call};
}
export const lessonInput=(overrides={})=>({title:'Aula nova',moduleId:'M1',status:'draft',resources:[{id:'R1',title:'Texto',type:'text',text:'Estudo',url:''}],...overrides});
