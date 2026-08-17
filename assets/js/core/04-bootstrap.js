// ==========================================================

function drawerOpen() {
  document.getElementById('sidebar').classList.add('open');
  const ov = document.getElementById('drawerOverlay');
  ov.style.display = 'block';
  requestAnimationFrame(() => ov.classList.add('open'));
  document.getElementById('hamburgerBtn').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function drawerClose() {
  document.getElementById('sidebar').classList.remove('open');
  const ov = document.getElementById('drawerOverlay');
  ov.classList.remove('open');
  setTimeout(() => { if (!ov.classList.contains('open')) ov.style.display = 'none'; }, 300);
  document.getElementById('hamburgerBtn').classList.remove('open');
  document.body.style.overflow = '';
}
function drawerToggle() {
  document.getElementById('sidebar').classList.contains('open') ? drawerClose() : drawerOpen();
}
// ==========================================================
// END DRAWER
// ==========================================================

// ── Upload status helper ──────────────────────────────────
function uploadSetStatus(elId, msg, ok) {
  const el = document.getElementById(elId);
  if (el) { el.textContent = msg; el.style.color = ok ? '#2ecc8f' : '#e05c4e'; }
}


// ── Hotfix V35.0 · recuperar campanhas do Inventário HK original ─────
// A ferramenta histórica e a Dashboard usam sites Netlify diferentes, logo
// têm stores Blob separados. Fazemos uma cópia única, no browser autenticado,
// sem substituir trabalho real que já exista na Dashboard.
const VG_HK_HISTORY_SOURCE='https://inventariovg.netlify.app/.netlify/functions/hk-store?key=vg_hk_inventario_v1';
const VG_HK_HISTORY_TARGET='/.netlify/functions/hk-store';
const VG_HK_HISTORY_KEY='vg_hk_inventario_v1';
let vgHkMigrationRunning=false,vgHkMigrationDone=false,vgHkMigrationRetries=0;
function vgHkStats(d){
  const camps=Array.isArray(d?.campanhas)?d.campanhas:[],invent=d?.invent&&typeof d.invent==='object'?d.invent:{};
  let touched=0;
  Object.values(invent).forEach(store=>Object.values(store||{}).forEach(inv=>{
    if(!inv||typeof inv!=='object')return;
    let yes=!!(inv.updatedAt||inv.aprovado||inv.aprovadoPor||(Array.isArray(inv.movs)&&inv.movs.length));
    if(!yes&&Array.isArray(inv.linhas))yes=inv.linhas.some(l=>l&&[l.existencias,l.invAnterior,l.quebras,l.vestido100,l.aprovadoDO].some(v=>v!==''&&v!=null&&(!isNaN(Number(v))?Number(v)!==0:true)));
    if(yes)touched++;
  }));
  return {campaigns:camps.length,closed:camps.filter(c=>c?.fechada).length,open:camps.filter(c=>!c?.fechada).length,touched};
}
function vgHkHasWork(d){const x=vgHkStats(d);return x.campaigns>1||x.touched>0;}
function vgHkCleanLegacy(d){
  const copy=JSON.parse(JSON.stringify(d||{})),st=vgHkStats(copy);
  if(Array.isArray(copy.users))copy.users.forEach(u=>{if(u&&typeof u==='object')u.password='';});
  copy.meta=copy.meta&&typeof copy.meta==='object'?copy.meta:{};
  copy.meta.legacyMigration={source:'https://inventariovg.netlify.app/',importedAt:new Date().toISOString(),campaigns:st.campaigns,closed:st.closed,open:st.open};
  copy.meta.rev={ts:Date.now(),by:'legacy-migration'};
  copy.log=Array.isArray(copy.log)?copy.log:[];
  copy.log.unshift({id:'mig'+Date.now().toString(36),ts:new Date().toISOString(),user:'VG Operations',role:'DO',acao:'Migração de histórico',detalhe:`Inventário original recuperado · ${st.campaigns} campanha(s), ${st.closed} fechada(s), ${st.open} aberta(s)`});
  return copy;
}
async function vgMigrateInventoryHistory(force=false){
  if(vgHkMigrationRunning||vgHkMigrationDone)return false;
  const token=typeof window.vgAuthToken==='function'?(window.vgAuthToken()||''):'';
  if(!token)return false;
  vgHkMigrationRunning=true;
  const auth={Authorization:'Bearer '+token,Accept:'application/json'};
  try{
    let current=null;
    const cr=await fetch(VG_HK_HISTORY_TARGET+'?key='+encodeURIComponent(VG_HK_HISTORY_KEY),{headers:auth,cache:'no-store'});
    if(cr.ok){const j=await cr.json();current=j?.data||null;}
    if(!force&&current?.meta?.legacyMigration){vgHkMigrationDone=true;return false;}
    if(!force&&vgHkHasWork(current)){vgHkMigrationDone=true;return false;}
    const or=await fetch(VG_HK_HISTORY_SOURCE,{mode:'cors',credentials:'omit',cache:'no-store',headers:{Accept:'application/json'}});
    if(!or.ok)throw new Error('origem HTTP '+or.status);
    const oj=await or.json(),legacy=oj?.data||null,st=vgHkStats(legacy);
    if(!legacy||st.campaigns<2||!vgHkHasWork(legacy))throw new Error('histórico não encontrado na origem');
    if(force&&current&&vgHkHasWork(current))await fetch(VG_HK_HISTORY_TARGET,{method:'POST',headers:{...auth,'Content-Type':'application/json'},body:JSON.stringify({key:'vg_hk_backup_pre_legacy_'+Date.now(),data:current})});
    const migrated=vgHkCleanLegacy(legacy);
    const wr=await fetch(VG_HK_HISTORY_TARGET,{method:'POST',headers:{...auth,'Content-Type':'application/json'},body:JSON.stringify({key:VG_HK_HISTORY_KEY,data:migrated})});
    if(!wr.ok)throw new Error('destino HTTP '+wr.status);
    try{localStorage.setItem(VG_HK_HISTORY_KEY,JSON.stringify(migrated));}catch(e){}
    vgHkMigrationDone=true;
    sessionStorage.setItem('vg_hk_history_migrated','1');
    sessionStorage.setItem('vg_hk_history_summary',JSON.stringify(st));
    console.info('[VG HK] histórico original recuperado',st);
    return true;
  }catch(e){console.warn('[VG HK] recuperação do histórico pendente:',e);return false;}
  finally{vgHkMigrationRunning=false;}
}
window.vgRecoverInventoryHistory=()=>{vgHkMigrationDone=false;return vgMigrateInventoryHistory(true);};
function vgScheduleInventoryHistoryMigration(){
  if(vgHkMigrationDone||sessionStorage.getItem('vg_hk_history_migrated')==='1')return;
  vgHkMigrationRetries++;
  vgMigrateInventoryHistory(false).finally(()=>{
    if(!vgHkMigrationDone&&vgHkMigrationRetries<120)setTimeout(vgScheduleInventoryHistoryMigration,5000);
  });
}

document.addEventListener('DOMContentLoaded', function() {
  // Close drawer when a nav button is tapped on mobile
  document.querySelectorAll('.sb-nav-btn').forEach(btn => {
    btn.addEventListener('click', () => { if (window.innerWidth <= 960) drawerClose(); });
  });
  buildMesButtons();  // also calls updateYearGlobals internally
  // Default: load highest month available
  if (Object.keys(STORE).length > 0) {
    const defaultMes = Math.max(...Object.keys(STORE).map(Number));
    selectedMeses.add(defaultMes);
    applyMesSelection();
  }
  // Hash routing — restore view from URL, else default to resumo
  const hash = window.location.hash.replace('#', '');
  const validViews = ['resumo','receitas','recdet','receitasdet','ab','housekeeping','custos','kpis','pl','costanalysis','cua','reputacao','ocupacao','instagram','agenda','hoteis','upload','alertas','compare','ranking','sazonalidade','simulador','notas'];
  setView(hash && validViews.includes(hash) ? hash : 'resumo');
  window.addEventListener('popstate', () => {
    const h = window.location.hash.replace('#', '');
    if (h && validViews.includes(h)) setView(h);
  });
  // v18: módulos secundários inicializam quando a respetiva vista é aberta.
  // Evita renderizar Reputação, Agenda e Hotéis durante o primeiro paint.
  // Auto-restauro ao arrancar (sobrepõe dados embutidos se existir sessão guardada)
  idbAutoRestore();
  // Tenta recuperar a base histórica assim que existir uma sessão autenticada.
  setTimeout(vgScheduleInventoryHistoryMigration,500);
});
