(function(){
'use strict';
if(window.__VG_SIDEBAR_GOV_V44__)return; window.__VG_SIDEBAR_GOV_V44__=true;
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim().toLowerCase();
const txt=e=>norm(e&&e.textContent);
const all=(sel,r=document)=>Array.from(r.querySelectorAll(sel));
function buttonByText(parts,r=document){const p=parts.map(norm);return all('button,a,[role="button"]',r).find(e=>p.some(x=>txt(e).includes(x)));}
function sidebar(){return document.querySelector('aside,.sidebar,#sidebar,.side-nav,.nav-sidebar');}
function rowFor(el){if(!el)return null;return el.closest('li,.nav-item,.sidebar-item,.menu-item,.sidebar-row')||el;}
function hideDuplicatePL(){all('button,a').forEach(e=>{const t=txt(e);if(t.includes('carregar p&l')&&!e.closest('[data-view="upload"],#view-upload,.view-upload,[id*="upload" i]'))e.style.display='none';});}
function installSave(){const src=buttonByText(['publicar para todos']);if(!src)return;src.dataset.vgSaveSource='1';src.style.display='none';let b=document.getElementById('vgGlobalSave');if(!b){b=document.createElement('button');b.id='vgGlobalSave';b.type='button';b.innerHTML='💾 Gravar';b.title='Gravar alterações';b.className='vg-global-save';b.style.cssText='height:30px;display:inline-flex;align-items:center;gap:5px;padding:0 10px;border-radius:8px;border:1px solid #e5bd42;background:#d5b247;color:#071a2b;font:900 10px var(--font,system-ui);cursor:pointer;white-space:nowrap';b.addEventListener('click',()=>{const s=document.querySelector('[data-vg-save-source="1"]');if(!s)return;b.disabled=true;b.textContent='A gravar…';try{s.click();}finally{setTimeout(()=>{b.disabled=false;b.textContent='✓ Gravado';setTimeout(()=>b.innerHTML='💾 Gravar',1500)},500);}});}const host=document.querySelector('.topbar-right')||document.querySelector('header .right,header');if(host&&!host.contains(b)){const bell=all('button',host).find(x=>txt(x).includes('🔔')||norm(x.title).includes('notifica')||norm(x.getAttribute('aria-label')).includes('notifica'));bell?host.insertBefore(b,bell):host.prepend(b);}}
const GROUPS=[
 {name:'inicio & hoteis',items:['resumo','hotéis','comentários fecho do mês','hotel 360º']},
 {name:'gestao',items:['ações','agenda operacional','banco de horas & férias','workflow de aprovações','mensagens','city ledger & cobranças','contas por faturar']},
 {name:'analise',items:['receitas','custos','energia & consumos','p&l usali','revenue & forecast','eficiência & unit economics','benchmarking','deteção de anomalias']},
 {name:'operacao integrada',items:['receita detalhada','compras & a&b','housekeeping & têxtil','reputação & guest experience','perdidos & achados','reclamações','orçamentos','devoluções']},
 {name:'compras',items:['compras & artigos']},
 {name:'qualidade & comunicacao',items:['instagram']},
 {name:'suporte',items:['gestão de documentos','relatórios automáticos']},
 {name:'administracao',items:['centro de dados','auditoria & governação','backup & recuperação','carregar docs']},
 {name:'mes',items:['todos os meses','jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez']},
 {name:'atualizacao',aliases:['importar dados'],items:['atualizar dashboard']},
 {name:'sessao',items:['guardar no browser','restaurar do browser','exportar sessão','importar sessão','limpar browser']},
 {name:'dados partilhados (todos os utilizadores)',items:['publicar para todos','atualizar dados partilhados']},
 {name:'exportar',items:['exportar pdf']}
];
function headingFor(g,side){const names=[g.name,...(g.aliases||[])].map(norm);return all('*',side).find(e=>{const t=txt(e);return names.includes(t)&&e.children.length<5;});}
function itemsFor(g,side){const wanted=g.items.map(norm),seen=new Set(),out=[];all('button,a,[role="button"],.nav-item,.sidebar-item,.menu-item',side).forEach(e=>{const t=txt(e);if(!t)return;if(wanted.some(w=>t===w||t.startsWith(w+' ')||t.includes(w))){const r=rowFor(e);if(r&&!seen.has(r)){seen.add(r);out.push(r);}}});return out;}
function installGroup(g,side){let h=headingFor(g,side);if(!h)return;if(g.name==='atualizacao'&&txt(h)==='importar dados'){h.childNodes.forEach?.(n=>{if(n.nodeType===3&&norm(n.textContent)==='importar dados')n.textContent='ATUALIZAÇÃO';});if(txt(h)==='importar dados')h.textContent='ATUALIZAÇÃO';}
 let mark=h.querySelector(':scope > .vg-fold-mark');if(!mark){mark=document.createElement('span');mark.className='vg-fold-mark';mark.style.cssText='font-size:12px;font-weight:900;margin-left:auto;padding-left:8px;color:#86a6c6';h.appendChild(mark);}h.style.cursor='pointer';h.style.display='flex';h.style.alignItems='center';h.style.justifyContent='space-between';const key='vg_sidebar_fold_'+g.name.replace(/[^a-z0-9]+/g,'_');let open=false;try{open=localStorage.getItem(key)==='1';}catch(e){}const rows=itemsFor(g,side);if(rows.some(r=>r.matches?.('.active,[aria-current="page"]')||r.querySelector?.('.active,[aria-current="page"]')))open=true;const apply=()=>{itemsFor(g,side).forEach(r=>{if(r.dataset.vgOriginalDisplay===undefined)r.dataset.vgOriginalDisplay=r.style.display||'';r.style.setProperty('display',open?(r.dataset.vgOriginalDisplay||''):'none','important');});mark.textContent=open?'−':'+';h.setAttribute('aria-expanded',open?'true':'false');};apply();if(!h.dataset.vgFoldBound){h.dataset.vgFoldBound='1';h.addEventListener('click',ev=>{if(ev.target.closest('a,button')&&ev.target!==mark)return;open=!open;apply();try{localStorage.setItem(key,open?'1':'0');}catch(e){}});} }
function run(){hideDuplicatePL();installSave();const side=sidebar();if(side)GROUPS.forEach(g=>installGroup(g,side));}
let timer;new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(run,100)}).observe(document.documentElement,{subtree:true,childList:true});
document.addEventListener('DOMContentLoaded',run,{once:true});setTimeout(run,400);setTimeout(run,1400);
})();