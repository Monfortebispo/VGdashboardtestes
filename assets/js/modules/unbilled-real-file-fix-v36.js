(function(){
'use strict';
if(window.__VG_UNBILLED_REAL_FILE_FIX_V36__)return;
window.__VG_UNBILLED_REAL_FILE_FIX_V36__=true;
const $=id=>document.getElementById(id);
const norm=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
const isUndefinedEntity=v=>['','naodefinido','naodefinida','n/a','na'].includes(norm(v));
const toDate=v=>{
  if(v==null||v==='')return'';
  if(typeof v==='number'&&window.XLSX?.SSF?.parse_date_code){const d=XLSX.SSF.parse_date_code(v);if(d)return `${d.y}-${String(d.m).padStart(2,'0')}-${String(d.d).padStart(2,'0')}`;}
  const s=String(v).trim();
  let m=s.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);if(m)return `${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`;
  m=s.match(/^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})$/);if(m)return `${m[1]}-${m[2].padStart(2,'0')}-${m[3].padStart(2,'0')}`;
  return s.slice(0,10);
};
const toNum=v=>{
  if(typeof v==='number')return Number.isFinite(v)?v:0;
  let s=String(v??'').trim().replace(/\s/g,'').replace(/€/g,'');
  if(!s)return 0;
  if(s.includes(',')&&s.includes('.'))s=s.lastIndexOf(',')>s.lastIndexOf('.')?s.replace(/\./g,'').replace(',','.'):s.replace(/,/g,'');else s=s.replace(',','.');
  const n=Number(s);return Number.isFinite(n)?n:0;
};
const authToken=()=>window.vgAuthToken?.()||'';
async function apiBatch(items){
  const h={'Content-Type':'application/json'},t=authToken();if(t)h.Authorization='Bearer '+t;
  const r=await fetch('/.netlify/functions/unbilled?action=batch',{method:'POST',headers:h,cache:'no-store',body:JSON.stringify({items})});
  const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||('HTTP '+r.status));return d;
}
function headerMap(row){const m={};row.forEach((v,i)=>{const k=norm(v);if(k&&!Object.prototype.hasOwnProperty.call(m,k))m[k]=i});return m}
function idx(m,aliases){for(const a of aliases){const k=norm(a);if(Object.prototype.hasOwnProperty.call(m,k))return m[k]}return -1}
function findHeader(rows){
  for(let i=0;i<Math.min(rows.length,20);i++){
    const m=headerMap(rows[i]||[]);
    const hasReservation=idx(m,['Num Reserva','Nº Reserva','Numero Reserva'])>=0;
    const hasAmount=idx(m,['Total Conta','Valor','Montante','Total'])>=0;
    const hasHotel=idx(m,['Hotel','Unidade'])>=0;
    if((hasReservation&&hasAmount)||(hasHotel&&hasAmount))return {row:i,map:m};
  }
  return null;
}
function cell(row,i){return i>=0&&i<row.length?row[i]:''}
function buildReason(row,m){
  const parts=[];
  const fields=[['STATUS','Estado origem'],['Situacao','Situação'],['Estado Reserva','Estado reserva'],['Comentários Hotel','Comentário hotel'],['Comentários Controller','Comentário controller'],['Comentarios Controller','Comentário controller'],['Comentarios anteriores','Comentário anterior'],['Comentários anteriores','Comentário anterior'],['Comentários Anteriores','Comentário anterior']];
  for(const [name,label] of fields){const i=idx(m,[name]);const v=String(cell(row,i)??'').trim();if(v&&v!==' ')parts.push(`${label}: ${v}`)}
  return parts.join(' | ').slice(0,2000);
}
function parseWorkbook(wb){
  const items=[],stats={sheets:0,rows:0,accepted:0,rejected:0,noHeader:0};
  for(const sn of wb.SheetNames){
    if(['estatisticas','evolucaoindicadores'].includes(norm(sn)))continue;
    const rows=XLSX.utils.sheet_to_json(wb.Sheets[sn],{header:1,defval:'',raw:true});
    const h=findHeader(rows);if(!h){stats.noHeader++;continue}stats.sheets++;
    const m=h.map;
    const iHotel=idx(m,['Hotel','Unidade']);
    const iRes=idx(m,['Num Reserva','Nº Reserva','Numero Reserva','Reserva']);
    const iPessoa=idx(m,['Pessoa','Cliente','Hospede','Hóspede']);
    const iEnt=idx(m,['Entidade','Empresa']);
    const iCheckout=idx(m,['Checkout','Check out','Data Checkout','Data Saida','Data Saída']);
    const iCheckin=idx(m,['Checkin','Check in','Data Checkin','Data Entrada']);
    const iAmount=idx(m,['Total Conta','Valor','Montante','Total','Saldo']);
    for(let r=h.row+1;r<rows.length;r++){
      const row=rows[r]||[];if(!row.some(v=>String(v??'').trim()!==''))continue;stats.rows++;
      const hotel=String(cell(row,iHotel)||'').trim();
      const reservation=String(cell(row,iRes)||'').trim();
      const person=String(cell(row,iPessoa)||'').trim();
      const entity=String(cell(row,iEnt)||'').trim();
      const client=!isUndefinedEntity(entity)?entity:(person&&!isUndefinedEntity(person)?person:(reservation?`Reserva ${reservation}`:''));
      const referenceDate=toDate(cell(row,iCheckout)||cell(row,iCheckin));
      const amount=toNum(cell(row,iAmount));
      if(!hotel||!client||!referenceDate||!amount){stats.rejected++;continue}
      items.push({hotel,client,reservation,reference:reservation?`Reserva ${reservation}`:'',referenceDate,amount,reason:buildReason(row,m),responsible:'',department:'',status:'Por faturar'});stats.accepted++;
    }
  }
  return {items,stats};
}
async function importRealFile(file){
  try{
    if(window.VG?.performance?.ensureXLSX)await window.VG.performance.ensureXLSX();
    if(!window.XLSX)throw new Error('Motor Excel indisponível.');
    const wb=XLSX.read(await file.arrayBuffer(),{type:'array'}),parsed=parseWorkbook(wb),items=parsed.items,st=parsed.stats;
    if(!items.length)throw new Error(`Foram lidas ${st.rows} linhas, mas nenhuma correspondeu ao formato de Contas por Faturar. Cabeçalhos reconhecidos em ${st.sheets} folha(s).`);
    let created=0,errors=0;
    for(let i=0;i<items.length;i+=750){
      const d=await apiBatch(items.slice(i,i+750));created+=Number(d.created||0);errors+=(d.errors||[]).length;
      window.showToast?.(`A importar Contas por Faturar: ${Math.min(i+750,items.length)}/${items.length}`);
    }
    window.showToast?.(`Importação concluída: ${created} registos criados${errors?` · ${errors} rejeitados pelo servidor`:''}.`);
    if(typeof window.vgUnbilledOpen==='function')window.vgUnbilledOpen();
    setTimeout(()=>document.getElementById('vubRefresh')?.click(),150);
  }catch(e){window.showToast?.(e.message||'Falha na importação.',true)}
}
function install(){
  const input=$('vubImportFile');if(input&&!input.dataset.vgRealFileFix){input.dataset.vgRealFileFix='1';input.onchange=e=>{const f=e.target.files?.[0];e.target.value='';if(f)importRealFile(f)}}
  const s=document.createElement('style');s.id='vgUnbilledLayoutFix';s.textContent=`#view-unbilled.tab-content,#view-unbilled.tab-content.active{margin-top:0!important;padding-top:0!important;min-height:0!important;height:auto!important;transform:none!important;position:relative!important;top:auto!important;inset:auto!important}#view-unbilled{align-self:start!important}`;if(!document.getElementById(s.id))document.head.appendChild(s);
}
function boot(){install();document.addEventListener('click',e=>{if(e.target?.closest?.('#nav-unbilled'))setTimeout(install,0)},true)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();