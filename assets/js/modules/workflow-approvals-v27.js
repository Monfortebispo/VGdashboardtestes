// ==========================================================
// VG DASHBOARD V27 — COMPATIBILIDADE LEGADA
// ==========================================================
// O motor visual V27 foi substituído pelo Workflow Hub V37.
// Este ficheiro mantém apenas a API histórica necessária a pesquisa,
// notificações e integrações antigas. O alias approvalsRender abaixo é apenas
// um proxy de arranque: nunca desenha a interface V27.
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

  window.VG.approvalsLegacy={version:27,disabledRenderer:true,state,all,searchItems,ensureLoaded,open};
  if(!window.VG.approvals || Number(window.VG.approvals.version||0)<27){
    window.VG.approvals={version:27,state,all,searchItems,ensureLoaded,open,legacy:true};
  }

  // Mantido para retrocompatibilidade com o V36 e respetivos testes.
  window.STATUS=window.STATUS||{
    complaint:['Em preparação','A aguardar DO','Esclarecimentos solicitados','Aprovada','Recusada','Resposta ao cliente','Concluída','Arquivada'],
    refund:['Em preparação','A aguardar DO','Esclarecimentos solicitados','A aguardar DAF','Recusada','Processada','Concluída','Arquivada'],
    budget:['Em preparação','A aguardar DO','Esclarecimentos solicitados','Aprovado','Recusado','Adjudicado','Em execução','Concluído','Arquivado']
  };

  function ensureV36Script(){
    if(Number(window.VG?.approvals?.version||0)>=37 || window.__VG_WORKFLOW_HUB_V37__)return;
    if(document.querySelector('script[data-vg-module="workflow-v37"],script[src*="workflow-hub-v37.js"]'))return;
    const s=document.createElement('script');
    s.src='assets/js/modules/workflow-hub-v37.js';
    s.async=false;
    s.dataset.vgModule='workflow-v37';
    s.onload=()=>{
      try{
        if(Number(window.VG?.approvals?.version||0)>=37 && (location.hash==='#approvals' || document.getElementById('view-approvals')?.classList.contains('active'))){
          window.VG.approvals.render?.();
        }
      }catch(e){console.warn('Workflow Hub V37: render inicial falhou',e);}
    };
    s.onerror=()=>console.error('Workflow Hub V37: ficheiro não carregado');
    (document.head||document.documentElement).appendChild(s);
  }

  ensureV36Script();

  if(typeof window.approvalsRender!=='function'){
    window.approvalsRender=function approvalsV36BootProxy(){
      const api=window.VG?.approvals;
      if(Number(api?.version||0)>=37 && typeof api?.render==='function')return api.render();
      ensureV36Script();
      const root=document.getElementById('approvalsRoot');
      if(root && !root.dataset.vgWorkflowWaiting){
        root.dataset.vgWorkflowWaiting='1';
        root.innerHTML='<div style="padding:22px;text-align:center"><strong>A carregar Workflow de Aprovações…</strong><div style="margin-top:6px;opacity:.65">A iniciar o centro de processos.</div></div>';
      }
      return null;
    };
  }
})();
