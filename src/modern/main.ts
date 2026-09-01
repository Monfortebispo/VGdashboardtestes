type IdleWindow=Window&{requestIdleCallback?: (cb:()=>void,opts?:{timeout:number})=>number};

export const modernEntryMetadata=Object.freeze({status:'isolated' as const,loading:'post-load' as const});

function startModernRuntime():void{
  const run=()=>{
    void import('./bootstrap').catch(err=>{
      console.error('[VG modern] post-load bootstrap failed',err);
      window.dispatchEvent(new CustomEvent('vg-modern-preview-error',{detail:String(err?.message||err)}));
    });
  };
  const idle=(window as IdleWindow).requestIdleCallback;
  if(typeof idle==='function') idle(run,{timeout:1200});
  else window.setTimeout(run,120);
}

if(document.readyState==='complete') startModernRuntime();
else window.addEventListener('load',startModernRuntime,{once:true});
