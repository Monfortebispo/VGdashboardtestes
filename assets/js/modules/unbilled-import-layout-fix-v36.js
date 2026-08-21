(function(){
'use strict';
if(window.__VG_UNBILLED_IMPORT_LAYOUT_FIX_V36__)return;
window.__VG_UNBILLED_IMPORT_LAYOUT_FIX_V36__=true;

const API='/.netlify/functions/unbilled';
const $=id=>document.getElementById(id);
const norm=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
const aliases={
 hotel:['hotel','unidade','estabelecimento','unidade hoteleira','nome hotel'],
 client:['cliente','empresa','entidade','nome cliente','cliente empresa','devedor','titular','nome'],
 reservation:['reserva','nr reserva','n reserva','numero reserva','booking'],
 reference:['referencia','documento','descricao','descrição','observacao','observação','referência','doc','numero documento','n documento'],
 date:['data','data referencia','data referência','data documento','data emissao','data emissão','data saida','data saída','data vencimento','vencimento'],
 amount:['valor','montante','total','saldo','saldo por faturar','valor por faturar','valor pendente','pendente','importe'],
 reason:['motivo','descricao','descrição','observacoes','observações','comentario','comentário'],
 responsible:['responsavel','responsável','gestor','utilizador'],
 department:['departamento','seccao','secção','area','área'],
 status:['estado','status','situacao','situação']
};
const aliasSets=Object.fromEntries(Object.entries(aliases).map(([k,a])=>[k,new Set(a.map(norm))]));
function fieldIndex(row,key){for(let i=0;i<row.length;i++)if(aliasSets[key].has(norm(row[i])))return i;return-1}
function detectHeader(matrix){let best=null;for(let r=0;r<Math.min(matrix.length,35);r++){const row=matrix[r]||[];let score=0;for(const k of Object.keys(aliasSets))if(fieldIndex(row,k)>=0)score++;if(score>=(best?.score||1))best={row:r,score};}return best&&best.score>=2?best:null}
function dateValue(v){if(v==null||v==='')return'';if(typeof v==='number'&&window.XLSX?.SSF?.parse_date_code){const d=XLSX.SSF.parse_date_code(v);if(d)return `${d.y}-${String(d.m).padStart(2,'0')}-${String(d.d).padStart(2,'0')}`;}const s=String(v).trim();let m=s.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);if(m)return `${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`;m=s.match(/^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})$/);if(m)return `${m[1]}-${m[2].padStart(2,'0')}-${m[3].padStart(2,'0')}`;return s.slice(0,10)}
function currentHotel(){const f=$('vubHotel')?.value||'';if(f&&f!=='ALL')return f;const hs=(window.vgAuthHotels?.()||[]).filter(h=>h&&h!=='*');if(hs.length===1)return hs[0];const opts=[...($('vubCHotel')?.options||[])].map(o=>o.value).filter(Boolean);return opts.length===1?opts[0]:''}
function value(row,idx){return idx>=0?(row[idx]??''):''}
async function apiBatch(items){const h={'Content-Type':'application/json'},t=window.vgAuthToken?.();if(t)h.Authorization='Bearer '+t;const r=await fetch(API+'?action=batch',{method:'POST',headers:h,cache:'no-store',body:JSON.stringify({items})}),d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||('HTTP '+r.status));return d}
function toast(msg,err){if(typeof window.showToast==='function')window.showToast(msg,!!err);else alert(msg)}
function normalizeLayout(){const v=$('view-unbilled');if(!v)return;const canonical=$('view-resumo')?.parentElement||$('view-receitas')?.parentElement;if(canonical&&v.parentElement!==canonical)canonical.appendChild(v);v.style.marginTop='0';v.style.paddingTop='0';v.style.minHeight='0';v.style.top='auto';v.style.transform='none';}
function installCss(){if($('vgUnbilledLayoutFixStyle'))return;const s=document.createElement('style');s.id='vgUnbilledLayoutFixStyle';s.textContent='#view-unbilled,#view-unbilled.tab-content,#view-unbilled.tab-content.active{margin-top:0!important;padding-top:0!important;min-height:0!important;top:auto!important;transform:none!important;align-self:stretch!important}';document.head.appendChild(s)}
async function importRobust(file){try{
 if(window.VG?.performance?.ensureXLSX)await window.VG.performance.ensureXLSX();
 if(!window.XLSX)throw new Error('Leitor Excel indisponível.');
 const wb=XLSX.read(await file.arrayBuffer(),{type:'array',cellDates:false});
 const fallbackHotel=currentHotel(),items=[];let readRows=0,rejected=0,headerSheets=0;
 for(const sn of wb.SheetNames){
   const matrix=XLSX.utils.sheet_to_json(wb.Sheets[sn],{header:1,defval:'',raw:true,blankrows:false});
   const head=detectHeader(matrix);if(!head)continue;headerSheets++;
   const header=matrix[head.row]||[],idx={};for(const k of Object.keys(aliasSets))idx[k]=fieldIndex(header,k);
   for(let r=head.row+1;r<matrix.length;r++){
     const row=matrix[r]||[];if(!row.some(x=>String(x??'').trim()))continue;readRows++;
     const item={hotel:String(value(row,idx.hotel)||fallbackHotel).trim(),client:String(value(row,idx.client)).trim(),reservation:String(value(row,idx.reservation)).trim(),reference:String(value(row,idx.reference)).trim(),referenceDate:dateValue(value(row,idx.date)),amount:value(row,idx.amount),reason:String(value(row,idx.reason)).trim(),responsible:String(value(row,idx.responsible)).trim(),department:String(value(row,idx.department)).trim(),status:String(value(row,idx.status)).trim()||'Por faturar'};
     if(!item.client||item.amount===''||item.amount==null||!item.referenceDate||!item.hotel){rejected++;continue;}
     items.push(item);
   }
 }
 if(!headerSheets)throw new Error('Não encontrei uma linha de cabeçalho reconhecível no ficheiro.');
 if(!items.length){const extra=!fallbackHotel?' Se o ficheiro não tiver coluna Hotel, selecione primeiro o hotel no filtro.':'';throw new Error(`Foram lidas ${readRows} linhas, mas nenhuma tinha Hotel, Cliente, Data e Valor válidos.${extra}`)}
 const d=await apiBatch(items);$('vubRefresh')?.click();const serverErrors=Array.isArray(d.errors)?d.errors.length:0;toast(`Importação concluída: ${d.created||0} registos criados · ${rejected+serverErrors} linhas rejeitadas.`);
 }catch(e){toast(e.message||'Não foi possível importar o ficheiro.',true)}}
function captureImport(e){const input=e.target;if(!input||input.id!=='vubImportFile')return;const file=input.files?.[0];input.value='';if(!file)return;e.preventDefault();e.stopImmediatePropagation();importRobust(file)}
function boot(){installCss();normalizeLayout();document.addEventListener('change',captureImport,true);const original=window.vgUnbilledOpen;if(typeof original==='function'&&!original.__layoutWrapped){const wrapped=function(){const out=original.apply(this,arguments);setTimeout(normalizeLayout,0);return out};wrapped.__layoutWrapped=true;window.vgUnbilledOpen=wrapped}setTimeout(normalizeLayout,50)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
