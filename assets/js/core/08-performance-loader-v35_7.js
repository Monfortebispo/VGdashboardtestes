// VG Operations V35.7 — carregamento modular por necessidade
(function(){
  'use strict';
  window.VG=window.VG||{};
  if(window.VG.lazy?.version>=35.7)return;

  const FEATURES={
    fflate:{js:['assets/vendor/fflate.min.js']},
    financeTools:{js:[
      'assets/js/modules/pl-usali.js',
      'assets/js/modules/cost-analysis.js',
      'assets/js/modules/custo-atividade.js',
      'assets/js/modules/analysis-tools.js'
    ]},
    unitEconomics:{css:['assets/css/unit-economics-v32.css'],js:['assets/js/modules/unit-economics-v32.js']},
    benchmark:{css:['assets/css/benchmarking.css'],js:['assets/js/modules/benchmarking.js']},
    anomalies:{css:['assets/css/anomaly-detection.css'],js:['assets/js/modules/anomaly-detection.js']},
    revenueCore:{
      css:[
        'assets/css/revenue-intelligence.css','assets/css/revenue-intelligence-secondary.css','assets/css/revenue-intelligence-ask.css',
        'assets/css/forecast-scenarios.css','assets/css/scenario-comparison-v29.css'
      ],
      js:[
        'assets/js/modules/revenue-intelligence.js',
        'assets/js/modules/forecast-scenarios.js',
        'assets/js/modules/scenario-comparison-v29.js',
        'assets/js/modules/revenue-hub-v30.js'
      ]
    },
    documents:{css:['assets/css/document-management-v26.css'],js:['assets/js/modules/document-management-v26.js']},
    approvals:{css:['assets/css/workflow-approvals-v27.css'],js:['assets/js/modules/workflow-approvals-v27.js']},
    hotel360:{
      deps:['benchmark','anomalies','revenueCore'],
      css:['assets/css/hotel-performance-v23.css'],
      js:['assets/js/modules/hotel-360-v30.js']
    },
    reports:{deps:['benchmark','agenda'],css:['assets/css/automatic-reports-v24.css'],js:['assets/js/modules/automatic-reports-v24.js']},
    assistant:{deps:['agenda','anomalies','revenueCore'],css:['assets/css/analytical-assistant-v25.css'],js:['assets/js/modules/analytical-assistant-v25.js']},
    agenda:{css:['assets/css/operational-agenda-v22.css'],js:['assets/js/modules/agenda-tempo.js','assets/js/modules/operational-agenda-v22.js']},
    datacenter:{css:['assets/css/data-center.css'],js:['assets/js/modules/data-center.js']},
    governance:{css:['assets/css/audit-governance.css'],js:['assets/js/modules/audit-governance.js']},
    backup:{css:['assets/css/backup-recovery.css'],js:['assets/js/modules/backup-recovery.js']},
    legacyReputation:{js:['assets/js/modules/reputacao.js']},
    operationsDomains:{css:['assets/css/operations-domains-v33.css'],js:['assets/js/modules/operations-domains-v33.js']},
    reputation:{deps:['legacyReputation','operationsDomains']},
    cityledger:{css:['assets/css/city-ledger-v32.css'],js:['assets/js/modules/city-ledger-v32.js']},
    orcamento:{js:['assets/js/modules/orcamento.js']},
    whatsapp:{css:['assets/css/whatsapp.css'],js:['assets/js/modules/whatsapp.js']},
    searchExtended:{deps:['agenda','documents','approvals','cityledger','operationsDomains','datacenter','reports','assistant','hotel360']}
  };

  const VIEW_FEATURE={
    pl:'financeTools',costanalysis:'financeTools',cua:'financeTools',alertas:'financeTools',compare:'financeTools',ranking:'financeTools',sazonalidade:'financeTools',simulador:'financeTools',
    unitEconomics:'unitEconomics',benchmark:'benchmark',anomalies:'anomalies',
    revenueint:'revenueCore',forecast:'revenueCore',scenariocompare:'revenueCore',revenuehub:'revenueCore',
    hotel360:'hotel360',hotelperformance:'hotel360',
    automaticreports:'reports',analyticalassistant:'assistant',agenda:'agenda',datacenter:'datacenter',governance:'governance',backup:'backup',documents:'documents',approvals:'approvals',
    reputacao:'reputation',receitasdet:'operationsDomains',recdet:'operationsDomains',ab:'operationsDomains',housekeeping:'operationsDomains',cityledger:'cityledger',orcamento:'orcamento'
  };

  const loaded=new Set();
  const inflight=new Map();
  const featureReady=new Set();
  const featureInflight=new Map();

  function normPath(v){try{return new URL(v,document.baseURI).pathname.replace(/^\//,'');}catch(e){return String(v||'').replace(/^\//,'');}}
  document.querySelectorAll('script[src]').forEach(x=>loaded.add(normPath(x.getAttribute('src'))));
  document.querySelectorAll('link[rel="stylesheet"][href]').forEach(x=>loaded.add(normPath(x.getAttribute('href'))));

  function loadCss(href){
    const key=normPath(href);if(loaded.has(key))return Promise.resolve();if(inflight.has(key))return inflight.get(key);
    const p=new Promise((resolve,reject)=>{const l=document.createElement('link');l.rel='stylesheet';l.href=href;l.dataset.vgLazy='35.7';l.onload=()=>{loaded.add(key);inflight.delete(key);resolve();};l.onerror=()=>{inflight.delete(key);reject(new Error('Falha ao carregar '+href));};document.head.appendChild(l);});
    inflight.set(key,p);return p;
  }
  function loadScript(src){
    const key=normPath(src);if(loaded.has(key))return Promise.resolve();if(inflight.has(key))return inflight.get(key);
    const p=new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.async=false;s.dataset.vgLazy='35.7';s.onload=()=>{loaded.add(key);inflight.delete(key);resolve();};s.onerror=()=>{inflight.delete(key);reject(new Error('Falha ao carregar '+src));};document.head.appendChild(s);});
    inflight.set(key,p);return p;
  }
  async function ensureFeature(name){
    if(!name||featureReady.has(name))return true;if(featureInflight.has(name))return featureInflight.get(name);
    const spec=FEATURES[name];if(!spec)return true;
    const p=(async()=>{
      for(const d of spec.deps||[])await ensureFeature(d);
      await Promise.all((spec.css||[]).map(loadCss));
      for(const src of spec.js||[])await loadScript(src);
      featureReady.add(name);return true;
    })().finally(()=>featureInflight.delete(name));
    featureInflight.set(name,p);return p;
  }
  function featureForView(v){return VIEW_FEATURE[String(v||'')]||'';}
  function needsView(v){return !!featureForView(v);}
  function isViewReady(v){const f=featureForView(v);return !f||featureReady.has(f);}
  function ensureView(v){const f=featureForView(v);return f?ensureFeature(f):Promise.resolve(true);}

  function loadingNode(view){const root=document.getElementById('view-'+String(view||''));return root?.querySelector?.('[data-vg-lazy-loading]')||null;}
  function showLoading(view){
    const root=document.getElementById('view-'+view);if(!root||loadingNode(view))return;
    root.setAttribute('aria-busy','true');
    const box=document.createElement('div');box.className='vg-lazy-loading';box.dataset.vgLazyLoading='1';box.innerHTML='<span class="vg-lazy-spinner"></span><div><strong>A abrir módulo…</strong><small>A carregar apenas os recursos necessários.</small></div>';
    root.prepend(box);
  }
  function hideLoading(view){const root=document.getElementById('view-'+view);if(root)root.removeAttribute('aria-busy');loadingNode(view)?.remove();}
  function showError(view,err){hideLoading(view);const root=document.getElementById('view-'+view);if(!root)return;const box=document.createElement('div');box.className='vg-lazy-error';box.dataset.vgLazyLoading='1';box.innerHTML='<strong>Não foi possível abrir este módulo.</strong><small>'+String(err?.message||err||'Erro de carregamento')+'</small><button type="button">Tentar novamente</button>';box.querySelector('button').onclick=()=>{box.remove();ensureView(view).then(()=>{if(typeof window.refreshAll==='function')window.refreshAll();}).catch(e=>showError(view,e));};root.prepend(box);}

  function warmIdle(){
    const idle=window.requestIdleCallback||((fn)=>setTimeout(fn,1600));
    idle(()=>ensureFeature('whatsapp').catch(()=>{}),{timeout:3500});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',warmIdle,{once:true});else warmIdle();

  window.VG.lazy={version:35.7,FEATURES,VIEW_FEATURE,ensureFeature,ensureView,needsView,isViewReady,featureForView,showLoading,hideLoading,showError,loaded,featureReady};
})();
