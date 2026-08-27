// VG Operations — City Ledger: melhorias do Panorama V42
(function(){
'use strict';
if(window.__VG_CITY_LEDGER_PANORAMA_ENH_V42__)return;
window.__VG_CITY_LEDGER_PANORAMA_ENH_V42__=true;

const norm=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/\s+/g,' ').trim();
const api=()=>window.VG?.cityLedger||null;
const state=()=>api()?.state||null;
const marketDef=()=>window.VG?.market?.def?.()||{};

function regionMap(){
  const out=new Map(),regions=marketDef().regions||{};
  for(const [region,hotels] of Object.entries(regions)) for(const h of (hotels||[])) out.set(norm(h),region);
  return out;
}
function regionOptions(){return Object.keys(marketDef().regions||{}).sort((a,b)=>a.localeCompare(b,'pt',{sensitivity:'base'}));}
function hotelRegion(h){return regionMap().get(norm(h))||'';}
function numericText(v){
  const s=String(v||'').replace(/\s/g,'').replace(/[^0-9,.-]/g,'');
  if(!s)return NaN;
  const x=Number(s.replace(/\.(?=\d{3}(\D|$))/g,'').replace(',','.'));
  return Number.isFinite(x)?x:NaN;
}
function cellValue(row,i,numeric){
  const t=row.cells?.[i]?.innerText?.trim()||'';
  if(numeric){const n=numericText(t);if(Number.isFinite(n))return n;}
  return norm(t);
}
function sortTable(table,col,dir,numeric){
  const tbody=table?.tBodies?.[0];if(!tbody)return;
  const rows=[...tbody.rows];
  rows.sort((a,b)=>{const av=cellValue(a,col,numeric),bv=cellValue(b,col,numeric);let c=0;if(typeof av==='number'&&typeof bv==='number')c=av-bv;else c=String(av).localeCompare(String(bv),'pt',{numeric:true,sensitivity:'base'});return dir==='desc'?-c:c;});
  rows.forEach(r=>tbody.appendChild(r));
}
function markSort(th,dir){
  const table=th.closest('table');table?.querySelectorAll('th').forEach(x=>{x.classList.remove('cl-sort-asc','cl-sort-desc');x.removeAttribute('aria-sort');});
  th.classList.add(dir==='asc'?'cl-sort-asc':'cl-sort-desc');th.setAttribute('aria-sort',dir==='asc'?'ascending':'descending');
}
function bindSortable(table,type){
  if(!table||table.dataset.sortBound)return;table.dataset.sortBound='1';
  const headers=[...table.tHead?.rows?.[0]?.cells||[]];
  headers.forEach((th,i)=>{
    if((type==='entity'&&i===headers.length-1))return;
    th.classList.add('cl-sortable');th.title='Clique para ordenar';
    th.addEventListener('click',e=>{e.stopPropagation();const cur=th.dataset.sortDir||'';const dir=cur==='asc'?'desc':'asc';headers.forEach(x=>delete x.dataset.sortDir);th.dataset.sortDir=dir;const numeric=(type==='matrix'&&i>=1&&i<=9)||(type==='entity'&&i>=1&&i<=9);sortTable(table,i,dir,numeric);markSort(th,dir);});
  });
  sortTable(table,0,'asc',false);if(headers[0]){headers[0].dataset.sortDir='asc';markSort(headers[0],'asc');}
}
function applyRegionFilter(root){
  const sel=root.querySelector('#clPanoramaRegion'),hotelSel=root.querySelector('#clPanoramaHotel');if(!sel||!hotelSel)return;
  const region=sel.value||'';
  [...hotelSel.options].forEach((o,i)=>{if(i===0){o.hidden=false;return;}o.hidden=!!region&&hotelRegion(o.value)!==region;});
  root.querySelectorAll('[data-cl-panorama-hotel]').forEach(tr=>{tr.hidden=!!region&&hotelRegion(tr.dataset.clPanoramaHotel)!==region;});
  if(region&&hotelSel.value&&hotelRegion(hotelSel.value)!==region){hotelSel.value='';hotelSel.dispatchEvent(new Event('change',{bubbles:true}));}
}
function addRegionFilter(root){
  const tools=root.querySelector('.cl-panorama-tools'),hotelSel=root.querySelector('#clPanoramaHotel');if(!tools||!hotelSel||root.querySelector('#clPanoramaRegion'))return;
  const regions=regionOptions();if(!regions.length)return;
  const s=state();if(s&&s.panoramaRegion==null)s.panoramaRegion='';
  const label=document.createElement('label');label.innerHTML=`Região<select id="clPanoramaRegion"><option value="">Todas as regiões</option>${regions.map(r=>`<option value="${r.replace(/"/g,'&quot;')}">${r}</option>`).join('')}</select>`;
  tools.insertBefore(label,hotelSel.closest('label'));
  const sel=label.querySelector('select');sel.value=s?.panoramaRegion||'';
  sel.addEventListener('change',()=>{if(s)s.panoramaRegion=sel.value;applyRegionFilter(root);});
  applyRegionFilter(root);
}
function sortHotelDropdown(root){
  const sel=root.querySelector('#clPanoramaHotel');if(!sel||sel.dataset.alphaSorted)return;sel.dataset.alphaSorted='1';
  const first=sel.options[0],value=sel.value,opts=[...sel.options].slice(1).sort((a,b)=>a.text.localeCompare(b.text,'pt',{numeric:true,sensitivity:'base'}));
  sel.innerHTML='';if(first)sel.appendChild(first);opts.forEach(o=>sel.appendChild(o));sel.value=value;
}
async function exportExcel(root){
  try{
    await window.VG?.performance?.ensureXLSX?.();
    if(typeof XLSX==='undefined')throw Error('Biblioteca Excel indisponível.');
    const table=root.querySelector('.cl-panorama-entity')||root.querySelector('.cl-panorama-matrix');if(!table)throw Error('Não existe tabela para exportar.');
    const rows=[];const header=[...table.tHead.rows[0].cells].map((c,i)=>i===table.tHead.rows[0].cells.length-1&&table.classList.contains('cl-panorama-entity')?null:c.innerText.replace(/[▲▼]/g,'').trim()).filter(x=>x!==null);rows.push(header);
    [...table.tBodies[0].rows].filter(r=>!r.hidden).forEach(r=>{const vals=[...r.cells].map((c,i)=>i===r.cells.length-1&&table.classList.contains('cl-panorama-entity')?null:c.innerText.replace(/\n+/g,' · ').trim()).filter(x=>x!==null);rows.push(vals);});
    const meta=[['Panorama City Ledger'],['Região',root.querySelector('#clPanoramaRegion')?.selectedOptions?.[0]?.text||'Todas'],['Hotel',root.querySelector('#clPanoramaHotel')?.selectedOptions?.[0]?.text||'Todos'],[]];
    const ws=XLSX.utils.aoa_to_sheet([...meta,...rows]);ws['!cols']=header.map((_,i)=>({wch:i===0?32:18}));
    const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,table.classList.contains('cl-panorama-entity')?'Entidades':'Panorama Hoteis');
    const h=root.querySelector('#clPanoramaHotel')?.value||'Todos',r=root.querySelector('#clPanoramaRegion')?.value||'Todas';
    XLSX.writeFile(wb,`CityLedger_Panorama_${String(r).replace(/\s+/g,'_')}_${String(h).replace(/\s+/g,'_')}.xlsx`);
  }catch(e){window.showToast?.(e.message||String(e),true);}
}
function addExport(root){
  const tools=root.querySelector('.cl-panorama-tools');if(!tools||root.querySelector('[data-cl-panorama-export]'))return;
  const b=document.createElement('button');b.className='cl-secondary';b.dataset.clPanoramaExport='1';b.textContent='Exportar Excel';b.addEventListener('click',()=>exportExcel(root));tools.appendChild(b);
}
function hideCityImport(){document.querySelectorAll('#cityLedgerRoot [data-cl-import]').forEach(b=>b.style.display='none');}
function enhance(){
  hideCityImport();
  const root=document.querySelector('#cityLedgerRoot .cl-panorama-v41');if(!root)return;
  sortHotelDropdown(root);addRegionFilter(root);addExport(root);
  bindSortable(root.querySelector('.cl-panorama-matrix'),'matrix');
  bindSortable(root.querySelector('.cl-panorama-entity'),'entity');
}
function init(){
  const st=document.createElement('style');st.textContent='.cl-sortable{cursor:pointer;user-select:none}.cl-sortable::after{content:" ↕";opacity:.35}.cl-sort-asc::after{content:" ▲";opacity:.9}.cl-sort-desc::after{content:" ▼";opacity:.9}.cl-panorama-tools button{min-height:36px}';document.head.appendChild(st);
  setInterval(enhance,500);document.addEventListener('click',()=>setTimeout(enhance,60),true);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
