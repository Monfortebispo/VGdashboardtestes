(function(){
'use strict';
if(window.__VG_UNBILLED_IMPORT_LAYOUT_FIX_V36__)return;
window.__VG_UNBILLED_IMPORT_LAYOUT_FIX_V36__=true;
const API='/.netlify/functions/unbilled';
const $=id=>document.getElementById(id);
const norm=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
const aliases={
 hotel:['hotel','unidade','estabelecimento','unidade hoteleira','nome hotel'],
 reservation:['num reserva','nº reserva','n reserva','nr reserva','numero reserva','reserva','booking'],
 person:['pessoa','cliente','hospede','hóspede','nome cliente','titular','nome'],
 entity:['entidade','empresa','agencia','agência','devedor'],
 checkout:['checkout','check out','data checkout','data saida','data saída','saida','saída'],
 checkin:['checkin','check in','data checkin','data entrada','entrada'],
 amount:['total conta','valor','montante','total','saldo','saldo por faturar','valor por faturar','valor pendente','pendente','importe'],
 sourceStatus:['status','situacao','situação'],
 bookingStatus:['estado reserva'],
 hotelComment:['comentarios hotel','comentários hotel','comentario hotel','comentário hotel'],
 controllerComment:['comentarios controller','comentários controller','comentario controller','comentário controller'],
 previousComment:['comentarios anteriores','comentários anteriores','comentario anterior','comentário anterior'],
 responsible:['responsavel','responsável','gestor','utilizador'],
 department:['departamento','seccao','secção','area','área']
};
const sets=Object.fromEntries(Object.entries(aliases).map(([k,a])=>[k,new Set(a.map(norm))]));
function fieldIndex(row,key){for(let i=0;i<row.length;i++)if(sets[key].has(norm(row[i])))return i;return-1}
function detectHeader(matrix){for(let r=0;r<Math.min(matrix.length,25);r++){const row=matrix[r]||[];const hasRes=fieldIndex(row,'reservation')>=0,hasAmount=fieldIndex(row,'amount')>=0,hasHotel=fieldIndex(row,'hotel')>=0;if((hasRes&&hasAmount)||(hasHotel&&hasAmount))return r;}return-1}
function dateValue(v){if(v==null||v==='')return'';if(typeof v==='number'&&window.XLSX?.SSF?.parse_date_code){const d=XLSX.SSF.parse_date_code(v);if(d)return `${d.y}-${String(d.m).padStart(2,'0')}-${String(d.d).padStart(2,'0')}`;}const s=String(v).trim();let m=s.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);if(m)return `${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`;m=s.match(/^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})$/);if(m)return `${m[1]}-${m[2].padStart(2,'0')}-${m[3].padStart(2,'0')}`;return s.slice(0,10)}
function numberValue(v){if(typeof v==='number')return Number.isFinite(v)?v:0;let s=String(v??'').trim().replace(/\s/g,'').replace(/€/g,'');if(!s)return 0;if(s.includes(',')&&s.includes('.'))s=s.lastIndexOf(',')>s.lastIndexOf('.')?s.replace(/\./g,'').replace(',','.'):s.replace(/,/g,'');else s=s.replace(',','.');const n=Number(s);return Number.isFinite(n)?n:0}
function currentHotel(){const f=$('vubHotel')?.value||'';if(f&&f!=='ALL')return f;const hs=(window.vgAuthHotels?.()||[]).filter(h=>h&&h!=='*');if(hs.length===1)return hs[0];const opts=[...($('vubCHotel')?.options||[])].map(o=>o.value).filter(Boolean);return opts.length===1?opts[0]:''}
function value(row,i){return i>=0?(row[i]??''):''}
function isUndefinedEntity(v){return ['','naodefinido','naodefinida','n/a','na'].includes(norm(v))}
function reason(row,idx){const parts=[];for(const [key,label] of [['sourceStatus','Status origem'],['bookingStatus','Estado reserva'],['hotelComment','Comentário hotel'],['controllerComment','Comentário controller'],['previousComment','Comentário anterior']]){const v=String(value(row,idx[key])??'').trim();if(v&&v!==' ')parts.push(`${label}: ${v}`)}return parts.join(' | ').slice(0,2000)}
async function apiBatch(items){const h={'Content-Type':'application/json'},t=window.vgAuthToken?.();if(t)h.Authorization='Bearer '+t;const r=await fetch(API+'?action=batch',{method:'POST',headers:h,cache:'no-store',body:JSON.stringify({items})}),d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||('HTTP '+r.status));return d}
function toast(msg,err){if(typeof window.showToast==='function')window.showToast(msg,!!err);else alert(msg)}
function normalizeLayout(){const v=$('view-unbilled');if(!v)return;const canonical=$('view-resumo')?.parentElement||$('view-receitas')?.parentElement;if(canonical&&v.parentElement!==canonical)canonical.appendChild(v);v.style.marginTop='0';v.style.paddingTop='0';v.style.minHeight='0';v.style.height='auto';v.style.top='auto';v.style.transform='none';v.style.position='relative';}
function installCss(){if($('vgUnbilledLayoutFixStyle'))return;const s=document.createElement('style');s.id='vgUnbilledLayoutFixStyle';s.textContent='#view-unbilled,#view-unbilled.tab-content,#view-unbilled.tab-content.active{margin-top:0!important;padding-top:0!important;min-height:0!important;height:auto!important;top:auto!important;transform:none!important;position:relative!important;inset:auto!important;align-self:stretch!important}';document.head.appendChild(s)}
async function importRobust(file){try{
 if(window.VG?.performance?.ensureXLSX)await window.VG.performance.ensureXLSX();
 if(!window.XLSX)throw new Error('Leitor Excel indisponível.');
 const wb=XLSX.read(await file.arrayBuffer(),{type:'array',cellDates:false});
 const fallbackHotel=currentHotel(),items=[];let readRows=0,rejected=0,recognizedSheets=0;
 for(const sn of wb.SheetNames){
   if(['estatisticas','evolucaoindicadores'].includes(norm(sn)))continue;
   const matrix=XLSX.utils.sheet_to_json(wb.Sheets[sn],{header:1,defval:'',raw:true,blankrows:false});
   const hr=detectHeader(matrix);if(hr<0)continue;recognizedSheets++;
   const header=matrix[hr]||[],idx={};for(const k of Object.keys(sets))idx[k]=fieldIndex(header,k);
   for(let r=hr+1;r<matrix.length;r++){
     const row=matrix[r]||[];if(!row.some(x=>String(x??'').trim()))continue;readRows++;
     const hotel=String(value(row,idx.hotel)||fallbackHotel).trim();
     const reservation=String(value(row,idx.reservation)).trim();
     const person=String(value(row,idx.person)).trim();
     const entity=String(value(row,idx.entity)).trim();
     const client=!isUndefinedEntity(entity)?entity:(!isUndefinedEntity(person)?person:(reservation?`Reserva ${reservation}`:''));
     const referenceDate=dateValue(value(row,idx.checkout)||value(row,idx.checkin));
     const amount=numberValue(value(row,idx.amount));
     if(!hotel||!client||!referenceDate||!amount){rejected++;continue;}
     items.push({hotel,client,reservation,reference:reservation?`Reserva ${reservation}`:'',referenceDate,amount,reason:reason(row,idx),responsible:String(value(row,idx.responsible)).trim(),department:String(value(row,idx.department)).trim(),status:'Por faturar'});
   }
 }
 if(!recognizedSheets)throw new Error('Não encontrei folhas com o formato de Contas por Faturar.');
 if(!items.length){const extra=!fallbackHotel?' O ficheiro foi reconhecido, mas faltam campos operacionais válidos.':'';throw new Error(`Foram lidas ${readRows} linhas em ${recognizedSheets} folha(s), mas nenhuma pôde ser importada.${extra}`)}
 let created=0,serverErrors=0;
 for(let i=0;i<items.length;i+=750){const d=await apiBatch(items.slice(i,i+750));created+=Number(d.created||0);serverErrors+=Array.isArray(d.errors)?d.errors.length:0;toast(`A importar: ${Math.min(i+750,items.length)}/${items.length}`)}
 $('vubRefresh')?.click();toast(`Importação concluída: ${created} registos criados · ${rejected+serverErrors} rejeitados.`);
 }catch(e){toast(e.message||'Não foi possível importar o ficheiro.',true)}}
function captureImport(e){const input=e.target;if(!input||input.id!=='vubImportFile')return;const file=input.files?.[0];input.value='';if(!file)return;e.preventDefault();e.stopImmediatePropagation();importRobust(file)}
function boot(){installCss();normalizeLayout();document.addEventListener('change',captureImport,true);const original=window.vgUnbilledOpen;if(typeof original==='function'&&!original.__layoutWrapped){const wrapped=function(){const out=original.apply(this,arguments);setTimeout(normalizeLayout,0);return out};wrapped.__layoutWrapped=true;window.vgUnbilledOpen=wrapped}setTimeout(normalizeLayout,50)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();