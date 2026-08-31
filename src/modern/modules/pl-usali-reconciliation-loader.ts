let loaded=false;

export function ensureUsaliReconciliation():void{
  if(loaded||document.querySelector('script[data-vg-pl-usali-reconciliation]'))return;
  loaded=true;
  const script=document.createElement('script');
  script.src='assets/js/modules/pl-usali-reconciliation-v46.js';
  script.defer=true;
  script.dataset.vgPlUsaliReconciliation='v46';
  document.body.appendChild(script);
}
