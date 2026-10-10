import { apiRequest } from './api.js';
import { safeUrl } from './utils/ui.js';
let current={name:'Escola de Saberes',subtitle:'Onde a fé encontra o conhecimento.',logo:'https://terreiroiansaguerreira.com.br/wp-content/uploads/2026/01/11-96653-7848.png',color:'#0ea5e9',welcome:'Bem-vindo(a) à sua área de estudos.',support:''};
export const getSettings=()=>current;
export async function loadSettings(){try{const response=await apiRequest('get_settings');current={...current,...response.settings};}catch{}applySettings(current);return current;}
export function applySettings(value){current={...current,...value};document.title=current.name;if(/^#[\da-f]{6}$/i.test(current.color))document.documentElement.style.setProperty('--accent-primary',current.color);current.logo=safeUrl(current.logo);current.support=safeUrl(current.support,true);}
