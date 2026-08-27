// VG Operations V36 — correção de consistência temporal dos rácios A&B
// Regra: custos e receitas usam sempre exatamente o mesmo período P&L selecionado.
// A Receita Detalhada serve apenas para repartir a Receita F&B entre Comidas/Bebidas;
// nunca substitui o denominador absoluto do P&L acumulado.
(function(){
  'use strict';
  if(window.__VG_FB_RATIOS_PERIOD_FIX_V36__) return;
  window.__VG_FB_RATIOS_PERIOD_FIX_V36__ = true;

  function num(v){
    const x=Number(v);
    return Number.isFinite(x)?x:0;
  }
  function fbRevenue(hotel,year,data){
    const d=data || (typeof RAW!=='undefined'?RAW:null);
    const v=d?.hotels_rev?.[hotel]?.ALIMENTACAO?.[year] ?? d?.hotels_ops?.[hotel]?.['Receita FB']?.[year];
    const x=num(v);
    return x>0?x:null;
  }
  function directRevenue(hotel,year,kind,data){
    const d=data || (typeof RAW!=='undefined'?RAW:null);
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
    return fbRevenue(hotel,year,data || (typeof RAW!=='undefined'?RAW:null));
  };
  window.revComidas=function(hotel,year,data){
    const d=data || (typeof RAW!=='undefined'?RAW:null);
    const direct=directRevenue(hotel,year,'COMIDA',d);
    if(direct!=null) return direct;
    const total=fbRevenue(hotel,year,d);
    if(total==null) return null;
    if(typeof RAW!=='undefined' && d===RAW){
      const share=splitShare(hotel,year,'COMIDA');
      if(share!=null) return total*share;
    }
    return null;
  };
  window.revBebidas=function(hotel,year,data){
    const d=data || (typeof RAW!=='undefined'?RAW:null);
    const direct=directRevenue(hotel,year,'BEBIDA',d);
    if(direct!=null) return direct;
    const total=fbRevenue(hotel,year,d);
    if(total==null) return null;
    if(typeof RAW!=='undefined' && d===RAW){
      const share=splitShare(hotel,year,'BEBIDA');
      if(share!=null) return total*share;
    }
    return null;
  };
  window.ratioComidas=function(hotel,year){
    if(typeof RAW==='undefined'||!RAW) return null;
    const c=typeof costComidas==='function'?Number(costComidas(hotel,year)):NaN;
    const r=window.revComidas(hotel,year,RAW);
    return Number.isFinite(c)&&c!==0&&r>0?c/r*100:null;
  };
  window.ratioBebidas=function(hotel,year){
    if(typeof RAW==='undefined'||!RAW) return null;
    const c=typeof costBebidas==='function'?Number(costBebidas(hotel,year)):NaN;
    const r=window.revBebidas(hotel,year,RAW);
    return Number.isFinite(c)&&c!==0&&r>0?c/r*100:null;
  };
  window.ratioAB=function(hotel,year){
    if(typeof RAW==='undefined'||!RAW) return null;
    const c1=typeof costComidas==='function'?num(costComidas(hotel,year)):0;
    const c2=typeof costBebidas==='function'?num(costBebidas(hotel,year)):0;
    const r=window.revAB(hotel,year,RAW);
    return r>0&&(c1||c2)?(c1+c2)/r*100:null;
  };

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
