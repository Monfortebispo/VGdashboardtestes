let pending:Promise<void>|null=null;

export function ensureUsaliReconciliation():Promise<void>{
  if(pending)return pending;
  const existing=document.querySelector<HTMLScriptElement>('script[data-vg-pl-usali-reconciliation]');
  if(existing){
    pending=new Promise(resolve=>{
      if((window as Window&{__VG_PL_USALI_RECON_V46__?:boolean}).__VG_PL_USALI_RECON_V46__){resolve();return;}
      const done=()=>resolve();
      existing.addEventListener('load',done,{once:true});
      window.addEventListener('vg-pl-usali-reconciled',done,{once:true});
    });
    return pending;
  }
  pending=new Promise((resolve,reject)=>{
    const script=document.createElement('script');
    script.src='assets/js/modules/pl-usali-reconciliation-v46.js';
    script.defer=true;
    script.dataset.vgPlUsaliReconciliation='v46';
    script.addEventListener('load',()=>resolve(),{once:true});
    script.addEventListener('error',()=>reject(new Error('Não foi possível carregar a reconciliação USALI.')),{once:true});
    document.body.appendChild(script);
  });
  return pending;
}
