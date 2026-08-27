// VG Operations — City Ledger: Panorama por Hotel V40
(function(){
'use strict';
if(window.__VG_CITY_LEDGER_PANORAMA_V40__)return;
window.__VG_CITY_LEDGER_PANORAMA_V40__=true;

const BUCKET_ORDER=['notDue','d1_30','d31_60','d61_90','d91_180','d181_365','over365'];
let observer=null,scheduled=false;

const api=()=>window.VG?.cityLedger||null;
const state=()=>api()?.state||null;
const rows=()=>Array.isArray(state()?.rows)?state().rows:[];
const esc=v=>window.VG?.util?.escapeHtml?window.VG.util.escapeHtml(v):String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const marketDef=()=>window.VG?.market?.def?.()||{symbol:'€',currency:'EUR',locale:'pt-PT'};
const money=v=>`${marketDef().symbol||'€'} ${Number(v||0).toLocaleString(marketDef().locale||'pt-PT',{minimumFractionDigits:0,maximumFractionDigits:0})}`;
const fmt=v=>Number(v||0).toLocaleString('pt-PT',{maximumFractionDigits:0});
const pct=v=>`${Number(v||0).toLocaleString('pt-PT',{minimumFractionDigits:1,maximumFractionDigits:1})}%`;
const mainCurrency=()=>marketDef().currency||'EUR';
const debt=r=>Number(r?.balance||0)>0?Number(r.balance):0;
const bucketLabels=()=>api()?.BUCKETS||{notDue:'A vencer',d1_30:'1–30 dias',d31_60:'31–60 dias',d61_90:'61–90 dias',d91_180:'91–180 dias',d181_365:'181–365 dias',over365:'+365 dias'};

function latestDiligence(hotel,clientKey){
  const list=Array.isArray(state()?.diligences)?state().diligences:[];
  return list.filter(d=>d.hotel===hotel&&d.clientKey===clientKey).sort((a,b)=>String(b.createdAt||'').localeCompare(String(a.createdAt||'')))[0]||null;
}
function baseRows(){return rows().filter(r=>r.currency===mainCurrency()&&debt(r)>0);}
function hotelData(){
  const map=new Map();
  for(const r of baseRows()){
    let h=map.get(r.hotel);
    if(!h){h={hotel:r.hotel,total:0,docs:0,clients:new Map(),buckets:{}};BUCKET_ORDER.forEach(k=>h.buckets[k]=0);map.set(r.hotel,h);}
    const val=debt(r);h.total+=val;h.docs++;h.buckets[r.bucket]=(h.buckets[r.bucket]||0)+val;
    let c=h.clients.get(r.clientKey);
    if(!c){c={key:r.clientKey,entity:r.entity||r.clientCode||'Entidade',code:r.clientCode||'',total:0,docs:0,oldest:0,buckets:{}};BUCKET_ORDER.forEach(k=>c.buckets[k]=0);h.clients.set(r.clientKey,c);}
    c.total+=val;c.docs++;c.oldest=Math.max(c.oldest,Number(r.daysOverdue||0));c.buckets[r.bucket]=(c.buckets[r.bucket]||0)+val;
  }
  return [...map.values()].sort((a,b)=>b.total-a.total);
}
function over90(x){return Number(x.buckets.d91_180||0)+Number(x.buckets.d181_365||0)+Number(x.buckets.over365||0);}
function topClient(h){return [...h.clients.values()].sort((a,b)=>b.total-a.total)[0]||null;}
function selectedHotel(){
  const s=state();if(!s)return'';
  const hotels=hotelData().map(x=>x.hotel);
  if(s.panoramaHotel&&hotels.includes(s.panoramaHotel))return s.panoramaHotel;
  return'';
}
function setSelectedHotel(h){const s=state();if(s)s.panoramaHotel=h||'';}

function styles(){
  if(document.getElementById('clPanoramaV40Style'))return;
  const st=document.createElement('style');st.id='clPanoramaV40Style';st.textContent=`
  .cl-panorama-tools{display:flex;align-items:end;gap:12px;flex-wrap:wrap;margin-bottom:12px}.cl-panorama-tools label{display:grid;gap:5px;font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted,#8ca3bd)}.cl-panorama-tools select{min-width:260px;background:#0b2036;color:#fff;border:1px solid #294865;border-radius:8px;padding:9px 11px}
  .cl-panorama-matrix th,.cl-panorama-matrix td{white-space:nowrap}.cl-panorama-matrix tr[data-cl-panorama-hotel]{cursor:pointer}.cl-panorama-matrix tr[data-cl-panorama-hotel]:hover{background:rgba(255,255,255,.035)}
  .cl-panorama-bandgrid{display:grid;grid-template-columns:repeat(7,minmax(120px,1fr));gap:8px;margin:12px 0}.cl-panorama-band{border:1px solid #23415f;background:#0d233b;border-radius:10px;padding:11px;text-align:left;color:inherit;cursor:pointer}.cl-panorama-band span{display:block;font-size:10px;color:#89a5c3;text-transform:uppercase;letter-spacing:.06em}.cl-panorama-band strong{display:block;margin-top:5px;font-size:17px}.cl-panorama-band.critical{border-color:#76434b}.cl-panorama-band:hover{transform:translateY(-1px)}
  .cl-panorama-entity td small{display:block;color:#8199b3;margin-top:3px}.cl-panorama-risk{font-weight:700}.cl-panorama-risk.bad{color:#ff6666}.cl-panorama-risk.warn{color:#f0b93b}.cl-panorama-actions{display:flex;gap:6px;flex-wrap:wrap}.cl-panorama-actions button{border:1px solid #315271;background:#102942;color:#dbe9f6;border-radius:7px;padding:6px 9px;cursor:pointer}
  @media(max-width:1100px){.cl-panorama-bandgrid{grid-template-columns:repeat(3,minmax(120px,1fr))}}`;
  document.head.appendChild(st);
}
function matrixHtml(hotels){
  const bl=bucketLabels();
  return `<section class="cl-panel"><header><div><strong>Panorama de todos os hotéis</strong><small>Distribuição do saldo por aging e entidade de maior exposição.</small></div></header><div class="cl-table-wrap"><table class="cl-table cl-panorama-matrix"><thead><tr><th>Hotel</th><th>Total</th>${BUCKET_ORDER.map(k=>`<th>${esc(bl[k])}</th>`).join('')}<th>% +90</th><th>Maior devedor</th></tr></thead><tbody>${hotels.map(h=>{const tc=topClient(h),o90=over90(h);return `<tr data-cl-panorama-hotel="${esc(h.hotel)}"><td><strong>${esc(h.hotel)}</strong><small>${fmt(h.docs)} docs · ${fmt(h.clients.size)} entidades</small></td><td><strong>${money(h.total)}</strong></td>${BUCKET_ORDER.map(k=>`<td>${money(h.buckets[k]||0)}</td>`).join('')}<td><span class="cl-panorama-risk ${h.total&&o90/h.total>.35?'bad':h.total&&o90/h.total>.15?'warn':''}">${pct(h.total?o90/h.total*100:0)}</span></td><td>${tc?`<strong>${esc(tc.entity)}</strong><small>${money(tc.total)}</small>`:'—'}</td></tr>`;}).join('')}</tbody></table></div></section>`;
}
function hotelDetailHtml(h){
  const bl=bucketLabels(),entities=[...h.clients.values()].sort((a,b)=>b.total-a.total),o90=over90(h),top5=entities.slice(0,5).reduce((s,x)=>s+x.total,0);
  return `<div class="cl-kpis"><article><span>Saldo em dívida</span><strong>${money(h.total)}</strong><small>${fmt(h.docs)} documentos</small></article><article><span>Entidades</span><strong>${fmt(h.clients.size)}</strong><small>com saldo positivo</small></article><article class="bad"><span>+90 dias</span><strong>${money(o90)}</strong><small>${pct(h.total?o90/h.total*100:0)} do hotel</small></article><article><span>Concentração Top 5</span><strong>${pct(h.total?top5/h.total*100:0)}</strong><small>${money(top5)}</small></article></div>
  <div class="cl-panorama-bandgrid">${BUCKET_ORDER.map(k=>`<button class="cl-panorama-band ${['d91_180','d181_365','over365'].includes(k)?'critical':''}" data-cl-panorama-bucket="${k}" data-hotel="${esc(h.hotel)}"><span>${esc(bl[k])}</span><strong>${money(h.buckets[k]||0)}</strong></button>`).join('')}</div>
  <section class="cl-panel"><header><div><strong>Entidades devedoras · ${esc(h.hotel)}</strong><small>Saldo, distribuição por aging, antiguidade e última diligência.</small></div></header><div class="cl-table-wrap"><table class="cl-table cl-panorama-entity"><thead><tr><th>Entidade</th><th>Total</th>${BUCKET_ORDER.map(k=>`<th>${esc(bl[k])}</th>`).join('')}<th>Mais antiga</th><th>Última diligência</th><th></th></tr></thead><tbody>${entities.map(c=>{const d=latestDiligence(h.hotel,c.key);return `<tr><td><strong>${esc(c.entity)}</strong><small>${esc(c.code||'Sem código')} · ${fmt(c.docs)} docs</small></td><td><strong>${money(c.total)}</strong></td>${BUCKET_ORDER.map(k=>`<td>${money(c.buckets[k]||0)}</td>`).join('')}<td><span class="cl-panorama-risk ${c.oldest>90?'bad':c.oldest>30?'warn':''}">${c.oldest>0?fmt(c.oldest)+' dias':'A vencer'}</span></td><td>${d?`<strong>${esc(api()?.STATUS?.[d.status]||d.status||'Contactado')}</strong><small>${esc((d.createdAt||'').slice(0,10))}</small>`:'<span class="muted">Sem diligência</span>'}</td><td><div class="cl-panorama-actions"><button data-cl-panorama-client="${esc(c.key)}" data-hotel="${esc(h.hotel)}">Ver faturas</button></div></td></tr>`;}).join('')}</tbody></table></div></section>`;
}
function panoramaHtml(){
  const hotels=hotelData();if(!hotels.length)return'<div class="cl-empty">Sem saldos em dívida na moeda principal para construir o panorama.</div>';
  const sel=selectedHotel(),h=hotels.find(x=>x.hotel===sel);
  return `<div class="cl-panorama-tools"><label>Hotel<select id="clPanoramaHotel"><option value="">Todos os hotéis</option>${hotels.map(x=>`<option value="${esc(x.hotel)}" ${x.hotel===sel?'selected':''}>${esc(x.hotel)}</option>`).join('')}</select></label>${sel?'<button class="cl-secondary" data-cl-panorama-all>← Voltar ao panorama geral</button>':''}</div>${h?hotelDetailHtml(h):matrixHtml(hotels)}`;
}
function activateTabUI(root){
  root.querySelectorAll('[data-cl-tab]').forEach(b=>b.classList.toggle('active',b.dataset.clTab==='hotelpanorama'));
  let btn=root.querySelector('[data-cl-tab="hotelpanorama"]');
  if(!btn){btn=document.createElement('button');btn.dataset.clTab='hotelpanorama';btn.textContent='Panorama por Hotel';const tabs=root.querySelector('.cl-tabs'),after=tabs?.querySelector('[data-cl-tab="hotels"]');if(tabs){after?.after(btn);if(!after)tabs.appendChild(btn);}}
  btn.classList.add('active');
}
function renderPanorama(){
  const root=document.getElementById('cityLedgerRoot'),s=state();if(!root||!s||s.tab!=='hotelpanorama')return false;
  styles();activateTabUI(root);const body=root.querySelector('.cl-body');if(!body)return false;
  body.innerHTML=panoramaHtml();
  body.querySelector('#clPanoramaHotel')?.addEventListener('change',e=>{setSelectedHotel(e.target.value);renderPanorama();});
  body.querySelector('[data-cl-panorama-all]')?.addEventListener('click',()=>{setSelectedHotel('');renderPanorama();});
  body.querySelectorAll('[data-cl-panorama-hotel]').forEach(tr=>tr.addEventListener('click',()=>{setSelectedHotel(tr.dataset.clPanoramaHotel);renderPanorama();}));
  body.querySelectorAll('[data-cl-panorama-client]').forEach(b=>b.addEventListener('click',()=>{s.filterHotel=b.dataset.hotel;s.filterClient=b.dataset.clPanoramaClient;s.filterClients=[];s.filterBucket='';s.tab='invoices';api()?.render?.();}));
  body.querySelectorAll('[data-cl-panorama-bucket]').forEach(b=>b.addEventListener('click',()=>{s.filterHotel=b.dataset.hotel;s.filterClient='';s.filterClients=[];s.filterBucket=b.dataset.clPanoramaBucket;s.tab='invoices';api()?.render?.();}));
  return true;
}
function ensureTab(){
  const root=document.getElementById('cityLedgerRoot');if(!root||!api())return;
  let btn=root.querySelector('[data-cl-tab="hotelpanorama"]');
  if(!btn){btn=document.createElement('button');btn.dataset.clTab='hotelpanorama';btn.textContent='Panorama por Hotel';const tabs=root.querySelector('.cl-tabs'),after=tabs?.querySelector('[data-cl-tab="hotels"]');if(tabs){after?.after(btn);if(!after)tabs.appendChild(btn);}}
  if(btn&&!btn.dataset.bound){btn.dataset.bound='1';btn.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();state().tab='hotelpanorama';renderPanorama();});}
  if(state()?.tab==='hotelpanorama')renderPanorama();
}
function schedule(){if(scheduled)return;scheduled=true;setTimeout(()=>{scheduled=false;ensureTab();},40);}
function init(){styles();ensureTab();observer=new MutationObserver(schedule);observer.observe(document.documentElement,{childList:true,subtree:true});document.addEventListener('click',e=>{if(e.target.closest?.('#nav-cityledger'))setTimeout(schedule,120);},false);window.VG?.events?.on?.('cityledger:changed',()=>setTimeout(schedule,80));window.VG?.events?.on?.('cityledger:diligence',()=>setTimeout(schedule,80));}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
