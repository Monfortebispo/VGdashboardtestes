// ==========================================================
// VG DASHBOARD V27 — COMPATIBILIDADE LEGADA
// ==========================================================
// O motor visual V27 foi substituído pelo Workflow V36.
// Este ficheiro mantém apenas a API histórica necessária a pesquisa,
// notificações e integrações antigas. NÃO renderiza #approvalsRoot e NÃO
// cria o alias global approvalsRender; o V36 é o único renderer da página.
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

  // Intencionalmente sem approvalsRender / renderPage / DOMContentLoaded.
})();
