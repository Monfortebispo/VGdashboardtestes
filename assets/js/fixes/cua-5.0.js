
/* CUA 5.0 — Artigos com desvio estável e testável. Não interfere no carregamento geral. */
(function(){
  'use strict';
  function esc(s){ return String(s==null?'':s).replace(/[&<>]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c];}); }
  function euro(v,d){ if(v==null || !isFinite(v)) return '—'; return '€'+Number(v).toLocaleString('pt-PT',{minimumFractionDigits:d||0,maximumFractionDigits:d||0}); }
  function short(h){ return String(h||'').replace('COLLECTION ','C. '); }
  function median(a){ a=(a||[]).filter(function(v){return isFinite(v);}).sort(function(x,y){return x-y;}); if(!a.length) return null; var m=Math.floor(a.length/2); return a.length%2?a[m]:(a[m-1]+a[m])/2; }
  function getCD(){
    try{ if(typeof cdGetData==='function'){ var d=cdGetData(); if(d && d.dic) return d; } }catch(e){}
    try{ if(typeof CD!=='undefined' && CD && CD.dic) return CD; }catch(e){}
    try{ if(window.__VG_CUA_TEST_CD && window.__VG_CUA_TEST_CD.dic) return window.__VG_CUA_TEST_CD; }catch(e){}
    return null;
  }
  function activeHotelNames(dic){
    var list=[];
    try{ if(typeof getActiveHotels==='function') list=getActiveHotels()||[]; }catch(e){}
    if(!list.length && window.RAW && RAW.hotels_ops) list=Object.keys(RAW.hotels_ops||{});
    if(!list.length && dic && Array.isArray(dic.hoteis)) list=dic.hoteis.filter(Boolean);
    var set={}; list.forEach(function(h){set[String(h).toUpperCase()]=1;});
    return set;
  }
  function rowsFromCD(cd){
    var dic=cd.dic||{}, meses=(cd.meta&&cd.meta.meses)||[], rows=[], latestYear=0;
    for(var i=0;i<meses.length;i++){ var y=Math.floor(Number(meses[i])/100); if(y>latestYear) latestYear=y; }
    try{ if(typeof YR_CUR!=='undefined' && Number(YR_CUR)) latestYear=Number(YR_CUR); }catch(e){}
    if(Array.isArray(cd.PM) && cd.PM.length){
      var map={};
      for(var r of cd.PM){
        if(!r || r.length<6) continue;
        var mes=meses[Number(r[3])];
        if(latestYear && mes && Math.floor(Number(mes)/100)!==latestYear) continue;
        var a=Number(r[0]), fo=Number(r[1]), h=Number(r[2]), val=Number(r[4]||0), q=Number(r[5]||0);
        if(!a || !h || val<=0 || q<=0) continue;
        var k=a+'|'+fo+'|'+h; if(!map[k]) map[k]=[a,fo,h,0,0];
        map[k][3]+=val; map[k][4]+=q;
      }
      for(var k in map){ if(map[k][4]>0) rows.push(map[k]); }
      if(rows.length) return {rows:rows, year:latestYear};
    }
    if(Array.isArray(cd.P)){
      for(var p of cd.P){
        if(!p || p.length<5) continue;
        var val2=Number(p[3]||0), q2=Number(p[4]||0);
        if(Number(p[0]) && Number(p[2]) && val2>0 && q2>0) rows.push([Number(p[0]),Number(p[1]),Number(p[2]),val2,q2]);
      }
    }
    return {rows:rows, year:latestYear};
  }
  function calcArticleDeviations(limit){
    var cd=getCD();
    if(!cd || !cd.dic) return {rows:[], reason:'NO_CD'};
    var dic=cd.dic, HOT=dic.hoteis||[], ART=dic.art||[], FORN=dic.forn||[];
    var pack=rowsFromCD(cd), priceRows=pack.rows||[];
    if(!priceRows.length) return {rows:[], reason:'NO_ROWS'};
    var active=activeHotelNames(dic), hasActive=Object.keys(active).length>0;
    var byArtHotel={};
    for(var r of priceRows){
      var a=r[0], fo=r[1], h=r[2], val=r[3], q=r[4];
      if(q<=0 || val<=0) continue;
      var p=val/q;
      if(!isFinite(p) || p<=0 || p>5000) continue;
      var key=a+'|'+h;
      if(!byArtHotel[key]) byArtHotel[key]={a:a,h:h,v:0,q:0,forn:{}};
      byArtHotel[key].v+=val; byArtHotel[key].q+=q; if(FORN[fo]) byArtHotel[key].forn[FORN[fo]]=1;
    }
    var byArt={};
    Object.keys(byArtHotel).forEach(function(k){
      var o=byArtHotel[k]; if(o.q<=0) return; var p=o.v/o.q;
      if(!isFinite(p) || p<=0 || p>2500) return;
      if(!byArt[o.a]) byArt[o.a]=[];
      byArt[o.a].push({h:o.h,p:p,q:o.q,v:o.v,forn:Object.keys(o.forn).slice(0,3).join(', ')});
    });
    var bench={};
    Object.keys(byArt).forEach(function(a){
      var l=byArt[a].filter(function(x){return x.q>=1 && x.p>0;});
      if(l.length<2) return;
      var med=median(l.map(function(x){return x.p;}));
      var mn=l.slice().sort(function(x,y){return x.p-y.p;})[0];
      if(med && isFinite(med)) bench[a]={med:med,min:mn.p,minHotel:HOT[mn.h]||'',n:l.length};
    });
    var res=[];
    Object.keys(byArtHotel).forEach(function(k){
      var o=byArtHotel[k], b=bench[o.a]; if(!b || o.q<=0) return;
      var hName=HOT[o.h]||'';
      if(hasActive && !active[String(hName).toUpperCase()]) return;
      var p=o.v/o.q;
      if(p<=b.med*1.05 || p>b.med*4) return;
      var sobre=(p-b.med)*o.q;
      if(sobre<25) return;
      res.push({hotel:hName, artigo:ART[o.a]||('Artigo '+o.a), preco:p, mediana:b.med, melhor:b.min, melhorHotel:b.minHotel, qtd:o.q, valor:o.v, sobre:sobre, fornecedores:Object.keys(o.forn).slice(0,3).join(', '), comps:b.n});
    });
    res.sort(function(a,b){return b.sobre-a.sobre;});
    return {rows:res.slice(0,limit||30), total:res.length, counts:{priceRows:priceRows.length, bench:Object.keys(bench).length, year:pack.year}};
  }
  function render(title,intro,table,extra){
    if(typeof cuaRenderAnswer==='function') return cuaRenderAnswer(title,intro,table||'',extra||'');
    var el=document.getElementById('cua-pergunta-resp'); if(!el) return;
    el.innerHTML='<div class="pl-dept-card" style="border-left:3px solid var(--gold)"><div class="pl-dept-name">'+esc(title)+'</div><p style="font-size:12px;color:var(--text-2);line-height:1.75;margin-top:8px">'+intro+'</p>'+(extra||'')+'</div>'+(table||'');
  }
  function answerArtigos(){
    var result=calcArticleDeviations(30);
    if(!result.rows.length){
      var msg='Não encontrei artigos com desvio comparável no filtro atual. Diagnóstico: '+(result.reason||'sem resultado')+'. Se o ficheiro de Compras & Artigos estiver carregado, altere o filtro para Portefólio filtrado e confirme que existem pelo menos dois hotéis com o mesmo artigo comprado no período. O dashboard mantém as análises de P&L/rubrica, mas o detalhe por artigo depende do extrato de compras/preços.';
      if(result.counts) msg+=' Linhas de preço lidas: '+result.counts.priceRows+'; artigos com benchmark: '+result.counts.bench+'.';
      return render('Resposta — artigos com desvio',msg);
    }
    var rows=result.rows;
    var total=rows.reduce(function(s,r){return s+r.sobre;},0);
    var topHotels={}; rows.forEach(function(r){ if(!topHotels[r.hotel]) topHotels[r.hotel]={h:r.hotel,n:0,s:0}; topHotels[r.hotel].n++; topHotels[r.hotel].s+=r.sobre; });
    var ht=Object.keys(topHotels).map(function(k){return topHotels[k];}).sort(function(a,b){return b.s-a.s;}).slice(0,5);
    var intro='Foram encontrados <strong>'+rows.length+'</strong> artigos com preço médio acima da mediana interna, no período '+esc(result.counts&&result.counts.year||'atual')+'. O sobrecusto estimado dos artigos listados é <strong style="color:var(--gold)">'+euro(total,0)+'</strong>. Hotéis com maior exposição: '+ht.map(function(x){return '<strong>'+esc(short(x.h))+'</strong> ('+x.n+' artigos; '+euro(x.s,0)+')';}).join('; ')+'. Esta análise compara preços médios do mesmo artigo entre hotéis; deve ser validada contra unidade de medida, embalagem, fornecedor, qualidade e codificação antes de concluir desperdício.';
    var table='<div style="overflow:auto;margin-top:12px"><table class="pl-table"><thead><tr><th>#</th><th>Hotel</th><th style="text-align:left">Artigo</th><th>Preço médio</th><th>Mediana grupo</th><th>Melhor preço</th><th>Qtd.</th><th>Sobrecusto</th><th>Fornecedor(es)</th><th>Validação</th></tr></thead><tbody>'+
      rows.map(function(r,i){return '<tr><td>'+(i+1)+'</td><td>'+esc(short(r.hotel))+'</td><td style="text-align:left">'+esc(r.artigo)+'</td><td class="pl-cell-bad">'+euro(r.preco,2)+'</td><td>'+euro(r.mediana,2)+'</td><td>'+euro(r.melhor,2)+' <span style="color:var(--text-3)">'+esc(short(r.melhorHotel))+'</span></td><td>'+Number(r.qtd).toLocaleString('pt-PT',{maximumFractionDigits:1})+'</td><td class="pl-cell-bad">'+euro(r.sobre,0)+'</td><td style="font-size:11px;color:var(--text-2)">'+esc(r.fornecedores||'—')+'</td><td style="font-size:11px;color:var(--text-2)">Confirmar fatura, unidade, embalagem, fornecedor e preço contratado.</td></tr>';}).join('')+
      '</tbody></table></div>';
    var extra='<div class="pl-dept-card" style="border-left:3px solid #e05c4e"><div class="pl-dept-name">Leitura operacional</div><p style="font-size:12px;color:var(--text-2);line-height:1.75;margin-top:8px">Prioridade: validar os 10 primeiros artigos. Se o artigo for equivalente, há oportunidade de renegociação ou centralização de preço. Se não for equivalente, deve corrigir a codificação, separar embalagens/formats ou criar unidade equivalente para evitar falsos desvios.</p></div>';
    return render('Resposta — artigos com desvio',intro,table,extra);
  }
  window.cuaCalcArticleDeviations=calcArticleDeviations;
  window.cuaAnswerArtigos=answerArtigos;
  var prev=window.cuaPerguntar;
  window.cuaPerguntar=function(forcedQ){
    var q=forcedQ || (document.getElementById('cuaPerguntaInput')&&document.getElementById('cuaPerguntaInput').value) || '';
    var up=String(q).toUpperCase();
    if(up.indexOf('ARTIGO')>=0 || up.indexOf('ARTIGOS')>=0) return answerArtigos();
    if(typeof prev==='function') return prev(forcedQ);
  };
})();

