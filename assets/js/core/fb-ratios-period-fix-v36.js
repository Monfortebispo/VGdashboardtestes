// VG Operations V36 — correção de consistência temporal dos rácios A&B
// Regra: custos e receitas usam sempre exatamente o mesmo período P&L selecionado.
// A Receita Detalhada serve apenas para repartir a Receita F&B entre Comidas/Bebidas;
// nunca substitui o denominador absoluto do P&L mensal/acumulado.
(function(){
  'use strict';
  if(window.__VG_FB_RATIOS_PERIOD_FIX_V36__) return;
  window.__VG_FB_RATIOS_PERIOD_FIX_V36__ = true;

  function num(v){
    const x=Number(v);
    return Number.isFinite(x)?x:0;
  }
  function selectedMonths(){
    try{
      const out=(typeof selectedMeses!=='undefined'&&selectedMeses&&selectedMeses.size)
        ?Array.from(selectedMeses).map(Number).filter(m=>Number.isFinite(m)&&m>=1&&m<=12)
        :[];
      return out.sort((a,b)=>a-b);
    }catch(e){return [];}
  }
  function isYtdSelection(months){
    if(!months.length)return false;
    const last=months[months.length-1];
    return months.length===last&&months.every((m,i)=>m===i+1);
  }
  function selectedPeriodData(){
    const months=selectedMonths();
    if(months.length===1){
      try{
        if(typeof STORE!=='undefined'&&STORE&&STORE[months[0]])return STORE[months[0]];
      }catch(e){}
    }
    if(isYtdSelection(months)){
      const last=months[months.length-1];
      try{
        if(typeof STORE_ACUM!=='undefined'&&STORE_ACUM&&STORE_ACUM[last])return STORE_ACUM[last];
      }catch(e){}
    }
    try{return typeof RAW!=='undefined'?RAW:null;}catch(e){return null;}
  }
  function fbRevenue(hotel,year,data){
    const d=data||selectedPeriodData();
    const v=d?.hotels_rev?.[hotel]?.ALIMENTACAO?.[year] ?? d?.hotels_ops?.[hotel]?.['Receita FB']?.[year];
    const x=num(v);
    return x>0?x:null;
  }
  function directRevenue(hotel,year,kind,data){
    const d=data||selectedPeriodData();
    const x=num(d?.hotels_rev?.[hotel]?.[kind]?.[year]);
    return x>0?x:null;
  }
  function splitShare(hotel,year,kind){
    try{
      const s=typeof abBestRevenueShare==='function'?abBestRevenueShare(hotel,year,kind):null;
      return Number.isFinite(Number(s))&&Number(s)>0&&Number(s)<1?Number(s):null;
    }catch(e){return null;}
  }

  window.revAB=function(hotel,year,data){
    return fbRevenue(hotel,year,data||selectedPeriodData());
  };
  window.revComidas=function(hotel,year,data){
    const d=data||selectedPeriodData();
    const direct=directRevenue(hotel,year,'COMIDA',d);
    if(direct!=null)return direct;
    const total=fbRevenue(hotel,year,d);
    if(total==null)return null;
    const share=splitShare(hotel,year,'COMIDA');
    return share!=null?total*share:null;
  };
  window.revBebidas=function(hotel,year,data){
    const d=data||selectedPeriodData();
    const direct=directRevenue(hotel,year,'BEBIDA',d);
    if(direct!=null)return direct;
    const total=fbRevenue(hotel,year,d);
    if(total==null)return null;
    const share=splitShare(hotel,year,'BEBIDA');
    return share!=null?total*share:null;
  };
  window.ratioComidas=function(hotel,year){
    const d=selectedPeriodData();
    if(!d)return null;
    const c=typeof costComidas==='function'?Number(costComidas(hotel,year,d)):NaN;
    const r=window.revComidas(hotel,year,d);
    return Number.isFinite(c)&&c!==0&&r>0?c/r*100:null;
  };
  window.ratioBebidas=function(hotel,year){
    const d=selectedPeriodData();
    if(!d)return null;
    const c=typeof costBebidas==='function'?Number(costBebidas(hotel,year,d)):NaN;
    const r=window.revBebidas(hotel,year,d);
    return Number.isFinite(c)&&c!==0&&r>0?c/r*100:null;
  };
  window.ratioAB=function(hotel,year){
    const d=selectedPeriodData();
    if(!d)return null;
    const c1=typeof costComidas==='function'?num(costComidas(hotel,year,d)):0;
    const c2=typeof costBebidas==='function'?num(costBebidas(hotel,year,d)):0;
    const r=window.revAB(hotel,year,d);
    return r>0&&(c1||c2)?(c1+c2)/r*100:null;
  };

  window.VG=window.VG||{};
  window.VG.fbRatios=Object.freeze({
    version:2,
    selectedMonths,
    isYtdSelection,
    periodSource:function(){
      const months=selectedMonths();
      if(months.length===1)return 'mensal';
      if(isYtdSelection(months)){
        const last=months[months.length-1];
        try{if(typeof STORE_ACUM!=='undefined'&&STORE_ACUM?.[last])return 'acumulado-oficial';}catch(e){}
      }
      return 'selecao-agregada';
    }
  });

  // Deploy Preview: expõe a Ocupação moderna na navegação normal para validação visual.
  function installOccupancyEntry(){
    if(document.getElementById('nav-ocupacao')) return;
    const anchor=document.getElementById('nav-revenuehub') || document.getElementById('nav-revenueint') || document.getElementById('nav-pl');
    if(!anchor?.parentElement) return;

    if(!document.getElementById('view-ocupacao')){
      const view=document.createElement('div');
      view.className='tab-content';
      view.id='view-ocupacao';
      const reference=document.getElementById('view-revenuehub') || document.getElementById('view-reputacao');
      if(reference?.parentElement) reference.parentElement.insertBefore(view,reference.nextSibling);
      else document.body.appendChild(view);
    }

    const btn=document.createElement('button');
    btn.className='sb-nav-btn';
    btn.id='nav-ocupacao';
    btn.innerHTML='<span class="sb-nav-icon">▥</span> Ocupação';
    btn.addEventListener('click',async function(){
      try{
        const nav=window.VG?.modernPreview?.navigation;
        if(nav?.go){ await nav.go('ocupacao'); return; }
        const once=()=>window.VG?.modernPreview?.navigation?.go?.('ocupacao');
        window.addEventListener('vg-modern-preview-ready',once,{once:true});
      }catch(e){ console.error('Ocupação moderna: falha de navegação',e); }
    });
    anchor.insertAdjacentElement('afterend',btn);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',installOccupancyEntry,{once:true});
  else installOccupancyEntry();
})();
