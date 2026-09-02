(function(){
  'use strict';
  if(window.__VG_REVENUE_RISK_AUDIT_V50__)return;
  window.__VG_REVENUE_RISK_AUDIT_V50__=true;

  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
  function money(v){
    const n=Number(v);
    if(!Number.isFinite(n))return '—';
    try{if(window.VG?.market?.formatMoney)return window.VG.market.formatMoney(n,0,false);}catch(e){}
    return (n<0?'-':'')+'€'+Math.abs(n).toLocaleString('pt-PT',{maximumFractionDigits:0});
  }
  function pct(v){const n=Number(v);return Number.isFinite(n)?n.toLocaleString('pt-PT',{maximumFractionDigits:1})+'%':'—';}
  function activeHotels(){
    try{if(typeof window.getActiveHotels==='function')return window.getActiveHotels().slice();}catch(e){}
    try{return (window.RAW?.hotel_list||[]).slice();}catch(e){return [];}
  }
  function snapshot(){
    try{
      const api=window.VG?.revenue;
      if(!api||typeof api.getDecisionSnapshot!=='function')return null;
      return api.getDecisionSnapshot(activeHotels());
    }catch(e){console.warn('Auditoria receita em risco indisponível',e);return null;}
  }
  function ensureStyle(){
    if(document.getElementById('vgRevenueRiskAuditStyle'))return;
    const s=document.createElement('style');s.id='vgRevenueRiskAuditStyle';s.textContent=`
      .ops-stat.vg-risk-auditable{cursor:pointer;transition:transform .15s ease,border-color .15s ease}.ops-stat.vg-risk-auditable:hover{transform:translateY(-1px);border-color:var(--gold)}
      .vg-risk-audit-hint{font-size:8px;color:var(--gold);margin-top:3px}
      #vgRiskAuditModal{position:fixed;inset:0;z-index:2500;background:rgba(0,0,0,.62);display:none;align-items:center;justify-content:center;padding:24px}
      #vgRiskAuditModal.open{display:flex}.vg-risk-card{width:min(1080px,96vw);max-height:88vh;overflow:auto;background:var(--surface-1);border:1px solid var(--border);border-radius:16px;box-shadow:0 24px 70px rgba(0,0,0,.35)}
      .vg-risk-head{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;padding:18px 20px;border-bottom:1px solid var(--border-2)}.vg-risk-head h3{margin:0;color:var(--text-1);font-size:16px}.vg-risk-head p{margin:5px 0 0;color:var(--text-3);font-size:10px;line-height:1.5}.vg-risk-close{border:1px solid var(--border-2);background:var(--surface-2);color:var(--text-2);border-radius:8px;width:32px;height:32px;cursor:pointer}
      .vg-risk-summary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px;padding:14px 20px}.vg-risk-box{border:1px solid var(--border-2);border-radius:10px;padding:10px;background:var(--surface-2)}.vg-risk-box span{display:block;font-size:8px;text-transform:uppercase;color:var(--text-3);letter-spacing:.7px}.vg-risk-box strong{display:block;margin-top:5px;font:800 17px var(--mono);color:var(--text-1)}
      .vg-risk-note{margin:0 20px 14px;padding:10px 12px;border:1px solid rgba(201,168,76,.28);border-radius:9px;background:rgba(201,168,76,.06);font-size:9px;color:var(--text-2);line-height:1.5}.vg-risk-table-wrap{padding:0 20px 20px;overflow:auto}.vg-risk-table{width:100%;border-collapse:collapse;font-size:9px}.vg-risk-table th,.vg-risk-table td{padding:8px 7px;border-bottom:1px solid var(--border-2);text-align:left;vertical-align:top}.vg-risk-table th{font-size:8px;text-transform:uppercase;letter-spacing:.6px;color:var(--text-3)}.vg-risk-table td{color:var(--text-2)}.vg-risk-table td.money{text-align:right;font-family:var(--mono);font-weight:800}.vg-risk-table tfoot td{font-weight:800;color:var(--text-1)}
      @media(max-width:760px){.vg-risk-summary{grid-template-columns:repeat(2,1fr)}#vgRiskAuditModal{padding:8px}}
    `;document.head.appendChild(s);
  }
  function ensureModal(){
    let m=document.getElementById('vgRiskAuditModal');if(m)return m;
    m=document.createElement('div');m.id='vgRiskAuditModal';m.innerHTML='<div class="vg-risk-card"><div class="vg-risk-head"><div><h3>Composição da Receita em Risco</h3><p>Auditoria do valor apresentado na Central de Operações.</p></div><button class="vg-risk-close" type="button" aria-label="Fechar">✕</button></div><div id="vgRiskAuditBody"></div></div>';
    document.body.appendChild(m);m.addEventListener('click',e=>{if(e.target===m||e.target.closest('.vg-risk-close'))m.classList.remove('open');});return m;
  }
  function openAudit(){
    ensureStyle();const m=ensureModal(),body=document.getElementById('vgRiskAuditBody');const s=snapshot();
    if(!s){body.innerHTML='<div class="vg-risk-note">Revenue Intelligence não disponibiliza neste momento um snapshot auditável.</div>';m.classList.add('open');return;}
    const risks=(Array.isArray(s.risks)?s.risks:[]).filter(r=>Number(r.eurRisk)>0).sort((a,b)=>Number(b.eurRisk||0)-Number(a.eurRisk||0));
    const sum=risks.reduce((t,r)=>t+Number(r.eurRisk||0),0);const reported=Number(s.totalRisk||0);const diff=reported-sum;
    const hotels=new Set(risks.map(r=>r.hotel).filter(Boolean));
    body.innerHTML=`<div class="vg-risk-summary"><div class="vg-risk-box"><span>Total apresentado</span><strong>${money(reported)}</strong></div><div class="vg-risk-box"><span>Soma do detalhe</span><strong>${money(sum)}</strong></div><div class="vg-risk-box"><span>Hotéis em risco</span><strong>${hotels.size}</strong></div><div class="vg-risk-box"><span>Diferença de reconciliação</span><strong>${money(diff)}</strong></div></div>
      <div class="vg-risk-note"><strong>Como é construído:</strong> este indicador vem exclusivamente do Revenue Intelligence. A Central soma os valores <code>eurRisk</code> dos sinais comerciais identificados no snapshot atual. Não é receita contabilística perdida nem uma previsão de perda garantida; é uma estimativa de exposição comercial baseada nos sinais de ocupação/pickup existentes. O total deve reconciliar com o detalhe abaixo.</div>
      <div class="vg-risk-table-wrap"><table class="vg-risk-table"><thead><tr><th>Hotel</th><th>Mês</th><th>Forecast</th><th>Objetivo</th><th>Motivo</th><th style="text-align:right">Valor em risco</th></tr></thead><tbody>${risks.map(r=>`<tr><td>${esc(r.hotel||'—')}</td><td>${esc(r.monthLabel||r.month||'—')}</td><td>${pct(r.forecast)}</td><td>${pct(r.target)}</td><td>${esc(r.summary||r.action||'Sinal comercial identificado pelo Revenue Intelligence')}</td><td class="money">${money(r.eurRisk)}</td></tr>`).join('')||'<tr><td colspan="6">Sem linhas de risco positivas no snapshot atual.</td></tr>'}</tbody><tfoot><tr><td colspan="5">Total auditado</td><td class="money">${money(sum)}</td></tr></tfoot></table></div>`;
    m.classList.add('open');
  }
  function enhance(){
    document.querySelectorAll('.ops-stat').forEach(card=>{
      const label=card.querySelector('.ops-stat-label')?.textContent?.trim().toLowerCase();
      if(label!=='receita em risco'||card.dataset.vgRiskAudit==='1')return;
      card.dataset.vgRiskAudit='1';card.classList.add('vg-risk-auditable');card.setAttribute('role','button');card.setAttribute('tabindex','0');card.setAttribute('title','Clique para ver a composição da Receita em Risco');
      const sub=card.querySelector('.ops-stat-sub');if(sub){sub.textContent='Clique para ver composição e reconciliação';sub.removeAttribute('title');}
      const h=document.createElement('div');h.className='vg-risk-audit-hint';h.textContent='Detalhe auditável →';card.appendChild(h);
      card.addEventListener('click',openAudit);card.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openAudit();}});
    });
  }
  const obs=new MutationObserver(enhance);obs.observe(document.documentElement,{subtree:true,childList:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',enhance,{once:true});else enhance();
})();
