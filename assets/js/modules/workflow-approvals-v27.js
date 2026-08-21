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

  function ensureCommunications(){
    if(!document.querySelector('link[data-vg-module="communications-v38-css"]')){
      const l=document.createElement('link');l.rel='stylesheet';l.href='assets/css/communications-v38.css';l.dataset.vgModule='communications-v38-css';document.head.appendChild(l);
    }
    if(window.__VG_COMMUNICATIONS_V38__ || document.querySelector('script[data-vg-module="communications-v38"]'))return;
    const s=document.createElement('script');
    s.src='assets/js/modules/communications-v38.js';
    s.async=false;
    s.dataset.vgModule='communications-v38';
    s.onerror=()=>console.error('VG Dashboard: sistema de mensagens V38 não carregou.');
    (document.head||document.documentElement).appendChild(s);
  }

  function ensureCommunicationsStability(){
    if(window.__VG_COMMUNICATIONS_STABILITY_V38_1__ || document.querySelector('script[data-vg-module="communications-stability-v38-1"]'))return;
    const s=document.createElement('script');
    s.src='assets/js/modules/communications-stability-v38_1.js';
    s.async=false;
    s.dataset.vgModule='communications-stability-v38-1';
    s.onerror=()=>console.error('VG Dashboard: hotfix de estabilidade das Mensagens V38.1 não carregou.');
    (document.head||document.documentElement).appendChild(s);
  }

  function ensureCommunicationsFix(){
    if(window.__VG_COMMUNICATIONS_FIX_V38_2__ || document.querySelector('script[data-vg-module="communications-v38-2"]'))return;
    const s=document.createElement('script');
    s.src='assets/js/modules/communications-v38_2.js';
    s.async=false;
    s.dataset.vgModule='communications-v38-2';
    s.onerror=()=>console.error('VG Dashboard: correção de destinatários/alertas V38.2 não carregou.');
    (document.head||document.documentElement).appendChild(s);
  }

  function ensureCommunicationsV39(){
    if(window.__VG_COMMUNICATIONS_V39__ || document.querySelector('script[data-vg-module="communications-v39"]'))return;
    const s=document.createElement('script');
    s.src='assets/js/modules/communications-v39.js';
    s.async=false;
    s.dataset.vgModule='communications-v39';
    s.onerror=()=>console.error('VG Dashboard: sincronização fluida das Mensagens V39 não carregou.');
    (document.head||document.documentElement).appendChild(s);
  }

  ensureV36Script();
  ensureCommunications();
  ensureCommunicationsStability();
  ensureCommunicationsFix();
  ensureCommunicationsV39();

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
