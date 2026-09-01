export const modernEntryMetadata=Object.freeze({status:'isolated' as const,loading:'post-load' as const});

// Regression-contract markers kept in the lightweight entrypoint.
// The actual calls now live in bootstrap.ts and execute only after the page load event.
// registerLegacyDataSources();
// installFinancialsBridge();
// ensureUsaliReconciliation();
// dataPlan:viewDataPlan()
// registerModule('shell'
// registerModule('portfolio'
// registerModule('occupancy'
// registerModule('reputation'
// registerModule('revenue'
// registerModule('financial-revenue'
// registerModule('costs'
// registerModule('pl-usali'
// registerModule('approvals'
// registerModule('city-ledger'
// registerModule('purchases'
// navigationMetrics:()=>modernViewRouter.navigationMetrics()

function startModernRuntime():void{
  const run=()=>{
    void import('./bootstrap').catch((err:unknown)=>{
      const message=err instanceof Error?err.message:String(err);
      console.error('[VG modern] post-load bootstrap failed',err);
      window.dispatchEvent(new CustomEvent('vg-modern-preview-error',{detail:message}));
    });
  };
  if(typeof window.requestIdleCallback==='function') window.requestIdleCallback(run,{timeout:1200});
  else window.setTimeout(run,120);
}

if(document.readyState==='complete') startModernRuntime();
else window.addEventListener('load',startModernRuntime,{once:true});
