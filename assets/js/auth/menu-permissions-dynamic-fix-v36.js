(function(){
'use strict';
if(window.__VG_DYNAMIC_MENU_PERMISSIONS_V41__) return;
window.__VG_DYNAMIC_MENU_PERMISSIONS_V41__=true;

function normRole(v){
  return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[_-]+/g,' ').replace(/\s+/g,' ').trim();
}
function isDirectionRole(v){
  const role=normRole(v);
  return role==='direcao'||role==='admin'||role==='direcao de operacoes'||role==='diretor de operacoes'||role==='director de operacoes';
}
function isDirectionUser(){
  const u=window.vgAuthCurrent?.();
  if(!u) return false;
  if(isDirectionRole(u.role)) return true;
  try{const hs=window.vgAuthHotels?.();return Array.isArray(hs)&&hs.includes('*');}catch(e){return false;}
}
function moduleAllowed(id){
  const u=window.vgAuthCurrent?.();
  if(!u) return false;
  if(isDirectionUser()) return true;
  if(typeof window.vgAuthCanAccessModule==='function') return window.vgAuthCanAccessModule(id)===true;
  return Array.isArray(u.modules)&&u.modules.includes(id);
}
function syncDynamicMenus(){
  document.querySelectorAll('.sb-nav-btn[id^="nav-"]').forEach(function(el){
    const ok=moduleAllowed(el.id.slice(4));
    if(ok){
      el.style.display='';
      delete el.dataset.vgAccessHidden;
    }else{
      el.style.display='none';
      el.dataset.vgAccessHidden='1';
    }
  });
  document.querySelectorAll('.sb-nav-group').forEach(function(group){
    group.style.display=[...group.querySelectorAll('.sb-nav-btn')].some(function(btn){return btn.style.display!=='none';})?'':'none';
  });
}

function setCityStatus(text,bad){
  const e=document.querySelector('#cityLedgerRoot #clStatus');
  if(e){e.textContent=text||'';e.classList.toggle('bad',!!bad);}
}
function cityMoney(value){
  const d=window.VG?.market?.def?.()||{};
  const symbol=d.symbol||'€';
  const locale=d.locale||'pt-PT';
  const v=Number(value||0);
  return (v<0?'-':'')+symbol+' '+Math.abs(v).toLocaleString(locale,{maximumFractionDigits:0});
}
let citySummarySignature='';
function scheduleCitySummaryCorrection(delay){
  window.setTimeout(correctCityLedgerSummary,delay==null?80:delay);
}
function correctCityLedgerSummary(){
  try{
    const root=document.getElementById('cityLedgerRoot');
    const kpis=root?.querySelector('.cl-kpis');
    const cl=window.VG?.cityLedger;
    const all=cl?.state?.rows;
    if(!kpis||!Array.isArray(all)||!all.length) return;
    const st=cl.state||{};
    const main=window.VG?.market?.def?.()?.currency||'EUR';
    const signature=[st.loadedSnapshot||'',all.length,st.filterHotel||'',st.filterClient||'',Array.isArray(st.filterClients)?st.filterClients.join(','):'',st.filterBucket||'',st.filterCreditStatus||'',st.query||''].join('|');
    if(signature===citySummarySignature&&kpis.dataset.vgNetSummary==='1') return;
    citySummarySignature=signature;

    const selectedClients=new Set((st.filterClient?[st.filterClient]:(Array.isArray(st.filterClients)?st.filterClients:[])).filter(Boolean));
    const q=String(st.query||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().trim();
    let net=0,gross=0,credits=0,docs=0;
    const clients=new Set();
    for(const r of all){
      if(String(r?.currency||main)!==main) continue;
      if(st.filterHotel&&r.hotel!==st.filterHotel) continue;
      if(selectedClients.size&&!selectedClients.has(r.clientKey)) continue;
      if(st.filterBucket&&r.bucket!==st.filterBucket) continue;
      if(st.filterCreditStatus){
        const cs=String(r.creditStatus||'').trim();
        if(st.filterCreditStatus==='__EMPTY__'){if(cs)continue;}
        else{
          const ncs=cs.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().trim();
          if(ncs!==st.filterCreditStatus) continue;
        }
      }
      if(q){
        const hay=[r.hotel,r.entity,r.clientCode,r.accountingDocument,r.documentNumber,r.voucher,r.email,r.financeEmail,r.creditStatus].join(' ').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
        if(!hay.includes(q)) continue;
      }
      const bal=Number(r.balance||0);
      net+=bal;
      if(bal>0) gross+=bal;
      if(bal<0) credits+=bal;
      docs++;
      if(r.clientKey) clients.add(r.clientKey);
    }

    const cards=[...kpis.children].filter(function(el){return el.tagName==='ARTICLE';});
    const first=cards[0];
    if(first){
      const label=first.querySelector('span'),value=first.querySelector('strong'),small=first.querySelector('small');
      if(label) label.textContent='Saldo líquido em dívida';
      if(value) value.textContent=cityMoney(net);
      if(small) small.textContent=docs.toLocaleString('pt-PT')+' documentos · '+clients.size.toLocaleString('pt-PT')+' clientes';
    }
    let grossCard=kpis.querySelector('[data-vg-cl-gross-debt]');
    if(!grossCard){
      grossCard=document.createElement('article');
      grossCard.dataset.vgClGrossDebt='1';
      grossCard.innerHTML='<span>Débitos em aberto</span><strong></strong><small>Antes da dedução de créditos</small>';
      if(first&&first.nextSibling) kpis.insertBefore(grossCard,first.nextSibling); else kpis.appendChild(grossCard);
    }
    const grossValue=grossCard.querySelector('strong');
    if(grossValue) grossValue.textContent=cityMoney(gross);
    const creditCard=[...kpis.children].find(function(a){return a.tagName==='ARTICLE'&&(a.querySelector('span')?.textContent||'').trim().toLowerCase()==='créditos';});
    if(creditCard){const v=creditCard.querySelector('strong');if(v)v.textContent=cityMoney(credits);}
    kpis.dataset.vgNetSummary='1';
  }catch(e){console.warn('City Ledger summary correction skipped',e);}
}
async function forceCityRefresh(){
  const cl=window.VG?.cityLedger;
  if(!cl) return;
  try{
    await cl.ensureLoaded(true);
    await cl.render();
  }catch(e){console.warn('City Ledger refresh falhou',e);}
  ensureCityLedgerActions();
  scheduleCitySummaryCorrection(120);
}
async function runDirectImport(file){
  const cl=window.VG?.cityLedger;
  if(!cl||typeof cl.importFile!=='function'){
    setCityStatus('O módulo City Ledger ainda não terminou de carregar.',true);
    return;
  }
  try{
    setCityStatus('A importar '+file.name+'…');
    await cl.importFile(file);
    setCityStatus('Importação concluída. A atualizar o City Ledger…');
    await new Promise(function(r){setTimeout(r,700);});
    await forceCityRefresh();
    const snap=cl.state?.snapshot;
    const main=window.VG?.market?.def?.()?.currency||'EUR';
    const rows=(cl.state?.rows||[]).filter(function(r){return String(r?.currency||main)===main;});
    setCityStatus('City Ledger atualizado · '+rows.length.toLocaleString('pt-PT')+' documentos'+(snap?.snapshotDate?' · snapshot '+snap.snapshotDate:'')+'.');
  }catch(err){
    setCityStatus('Erro na importação: '+(err?.message||String(err)),true);
    window.showToast?.('Erro ao importar City Ledger: '+(err?.message||String(err)),true);
  }
}
function openDirectPicker(){
  if(!isDirectionUser()) return;
  const input=document.createElement('input');
  input.type='file';
  input.accept='.xlsm,.xlsx,.xls';
  input.style.display='none';
  document.body.appendChild(input);
  input.addEventListener('change',async function(){
    const f=input.files?.[0];
    input.remove();
    if(f) await runDirectImport(f);
  },{once:true});
  input.click();
}
function ensureCityLedgerActions(){
  if(!isDirectionUser()) return;
  const root=document.getElementById('cityLedgerRoot');
  const actions=root?.querySelector('.cl-head-actions');
  if(!actions) return;
  actions.style.display='flex';
  actions.style.flexWrap='wrap';
  actions.style.justifyContent='flex-end';
  actions.style.maxWidth='520px';

  let imp=actions.querySelector('[data-vg-direct-city-import]');
  if(!imp){
    imp=document.createElement('button');
    imp.type='button';
    imp.className='cl-primary';
    imp.dataset.vgDirectCityImport='1';
    imp.textContent='Importar Excel';
    imp.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();openDirectPicker();});
  }
  const geo=actions.querySelector('em');
  if(geo&&imp.parentNode!==actions) actions.insertBefore(imp,geo.nextSibling);
  else if(geo&&imp.previousElementSibling!==geo) actions.insertBefore(imp,geo.nextSibling);
  else if(!imp.parentNode) actions.prepend(imp);

  const oldImport=actions.querySelector('[data-cl-import]');
  if(oldImport&&oldImport!==imp) oldImport.style.display='none';
}
function install(){
  const original=window.vgAuthApplyMenuPermissions;
  if(typeof original==='function'&&!original.__vgDynamicMenuWrappedV41){
    const wrapped=function(){const out=original.apply(this,arguments);syncDynamicMenus();ensureCityLedgerActions();scheduleCitySummaryCorrection(120);return out;};
    wrapped.__vgDynamicMenuWrappedV41=true;
    window.vgAuthApplyMenuPermissions=wrapped;
  }
  syncDynamicMenus();
  ensureCityLedgerActions();
  scheduleCitySummaryCorrection(500);
  document.addEventListener('click',function(e){
    if(e.target.closest?.('#nav-cityledger,[data-cl-tab],[data-cl-hotel],[data-cl-bucket],[data-cl-clear]')) scheduleCitySummaryCorrection(180);
  });
  document.addEventListener('change',function(e){
    if(e.target.closest?.('#cityLedgerRoot select,#cityLedgerRoot input')) scheduleCitySummaryCorrection(120);
  });
  setInterval(function(){
    if(document.getElementById('cityLedgerRoot')){
      ensureCityLedgerActions();
      scheduleCitySummaryCorrection(0);
    }
  },1200);
}
window.vgSyncDynamicMenus=syncDynamicMenus;
window.vgEnsureCityLedgerActions=ensureCityLedgerActions;
window.vgCorrectCityLedgerSummary=correctCityLedgerSummary;
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',function(){setTimeout(install,0);},{once:true});
else setTimeout(install,0);
})();
