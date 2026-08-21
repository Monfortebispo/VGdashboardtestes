// ==========================================================
// VG DASHBOARD V27 — COMPATIBILIDADE LEGADA
// ==========================================================
// O motor visual V27 foi substituído pelo Workflow V36.
// Este ficheiro mantém apenas a API histórica necessária a pesquisa,
// notificações e integrações antigas. O alias approvalsRender abaixo é apenas
// um proxy de arranque: nunca desenha a interface V27 e é substituído pelo V36.
(function(){
  'use strict';
  window.VG=window.VG||{};

  const state={loaded:false,rows:[],assignees:[]};
  const esc=v=>String(v??'');

  function currentRows(){ return Array.isArray(state.rows)?state.rows:[]; }
  function all(){ return currentRows().slice(); }
  function searchItems(){
    return currentRows().map(r=>({
      id:r.id,
      type:'approval',
      title:r.title||'Pedido de aprovação',
      subtitle:[r.hotel,r.status,r.requesterName||r.requesterUser].filter(Boolean).join(' · '),
      hotel:r.hotel||'',
      status:r.status||'',
      text:[r.title,r.description,r.hotel,r.requesterName,r.approverName,r.decisionNote].filter(Boolean).join(' '),
      view:'approvals',
      raw:r
    }));
  }
  async function ensureLoaded(){ return currentRows(); }
  function open(id){
    try{
      if(id) sessionStorage.setItem('vg-approval-focus',esc(id));
      if(location.hash!=='#approvals') location.hash='#approvals';
    }catch(e){}
  }

  window.VG.approvalsLegacy={
    version:27,
    disabledRenderer:true,
    state,
    all,
    searchItems,
    ensureLoaded,
    open
  };

  // Compatibilidade transitória para consumidores que executem antes do V36.
  // O V36 substitui este objeto por version:36 assim que carrega.
  if(!window.VG.approvals || Number(window.VG.approvals.version||0)<27){
    window.VG.approvals={version:27,state,all,searchItems,ensureLoaded,open,legacy:true};
  }

  function ensureV36Script(){
    if(Number(window.VG?.approvals?.version||0)>=36 || window.__VG_APPROVALS_V36__)return;
    if(document.querySelector('script[data-vg-module="workflow-v36"],script[src*="workflow-approvals-v36.js"]'))return;
    const s=document.createElement('script');
    s.src='assets/js/modules/workflow-approvals-v36.js';
    s.async=false;
    s.dataset.vgModule='workflow-v36';
    s.onload=()=>{
      try{
        if(Number(window.VG?.approvals?.version||0)>=36 && (location.hash==='#approvals' || document.getElementById('view-approvals')?.classList.contains('active'))){
          window.VG.approvals.render?.();
        }
      }catch(e){console.warn('Workflow V36: render inicial falhou',e);}
    };
    s.onerror=()=>console.error('Workflow V36: ficheiro não carregado');
    (document.head||document.documentElement).appendChild(s);
  }

  // O V27 é carregado diretamente pelo index.html; usa-o como ponto de arranque
  // garantido do V36, em vez de depender apenas do bootstrap tardio.
  ensureV36Script();

  // Proxy de arranque. Existe para o version guard não classificar o módulo
  // como ausente enquanto workflow-approvals-v36.js ainda está a carregar.
  // Nunca renderiza a interface V27.
  if(typeof window.approvalsRender!=='function'){
    window.approvalsRender=function approvalsV36BootProxy(){
      const api=window.VG?.approvals;
      if(Number(api?.version||0)>=36 && typeof api?.render==='function'){
        return api.render();
      }
      ensureV36Script();
      const root=document.getElementById('approvalsRoot');
      if(root && !root.dataset.vgWorkflowWaiting){
        root.dataset.vgWorkflowWaiting='1';
        root.innerHTML='<div style="padding:22px;text-align:center"><strong>A carregar Workflow de Aprovações…</strong><div style="margin-top:6px;opacity:.65">A iniciar o módulo operacional.</div></div>';
      }
      return null;
    };
  }
})();
