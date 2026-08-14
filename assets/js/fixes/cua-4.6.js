
/* CUA 4.6 — correção estável do botão Artigos com desvio, sem template literals para não quebrar o HTML. */
(function(){
  function esc(s){return String(s==null?'':s).replace(/[&<>]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c];});}
  function euro(v,d){ if(v==null || !isFinite(v)) return '—'; return '€'+Number(v).toLocaleString('pt-PT',{minimumFractionDigits:d||0,maximumFractionDigits:d||0}); }
  function short(h){ return String(h||'').replace('COLLECTION ','C. '); }
  function render(title,intro,table,extra){
    if(typeof window.cuaRenderAnswer==='function') return window.cuaRenderAnswer(title,intro,table||'',extra||'');
    var el=document.getElementById('cua-pergunta-resp');
    if(el) el.innerHTML='<div class="pl-dept-card"><div class="pl-dept-name">'+esc(title)+'</div><p>'+intro+'</p>'+(table||'')+(extra||'')+'</div>';
  }
  function activeHotels(){ try{return (typeof cuaActiveHotelsSafe==='function'?cuaActiveHotelsSafe():Object.keys(RAW&&RAW.hotels_ops||{}));}catch(e){return [];} }
  function findHotel(q){ try{return (typeof cuaFindHotelInQuestion==='function'?cuaFindHotelInQuestion(q):null);}catch(e){return null;} }
  function safeTopArticles(h,limit){
    try{
      if(typeof cuaTopArticleDeviations==='function') return cuaTopArticleDeviations(h,limit||12)||[];
    }catch(e){}
    return [];
  }
  window.cuaAnswerArtigos = function(){
    var q=(document.getElementById('cuaPerguntaInput')||{}).value||'';
    var h=findHotel(q);
    var hotels=h?[h]:activeHotels();
    var all=[];
    hotels.forEach(function(hh){ safeTopArticles(hh,12).forEach(function(a){ var o={}; for(var k in a)o[k]=a[k]; o.h=hh; all.push(o); }); });
    all=all.sort(function(a,b){return (b.sobre||0)-(a.sobre||0);}).slice(0,30);
    if(!all.length){
      var msg='Não encontrei artigos com sobrecusto comparável para o filtro atual. Isto não bloqueia o dashboard: significa apenas que o extrato de compras/preços não está disponível nesta sessão, não tem pelo menos dois hotéis comparáveis para o mesmo artigo, ou os preços foram excluídos por unidade/embalagem não comparável. Para análise por artigo, carregue também o ficheiro de compras/preços; sem esse extrato, a análise fica limitada ao P&L por rubrica.';
      return render('Resposta — artigos com desvio',msg);
    }
    var total=all.reduce(function(s,a){return s+(a.sobre||0);},0);
    var byH={};
    all.forEach(function(a){var k=a.h||''; if(!byH[k])byH[k]={h:k,n:0,sobre:0}; byH[k].n++; byH[k].sobre+=a.sobre||0;});
    var topH=Object.keys(byH).map(function(k){return byH[k];}).sort(function(a,b){return b.sobre-a.sobre;}).slice(0,5);
    var intro='Foram encontrados <strong>'+all.length+'</strong> artigos com preço médio acima da mediana interna, com sobrecusto estimado de <strong style="color:var(--gold)">'+euro(total,0)+'</strong>. Hotéis com maior exposição: '+topH.map(function(x){return '<strong>'+esc(short(x.h))+'</strong> ('+x.n+' artigos; '+euro(x.sobre,0)+')';}).join('; ')+'. Esta leitura deve ser usada para validação de preço, unidade de compra, embalagem, fornecedor, codificação e condições comerciais antes de concluir que existe desperdício.';
    var rows=all.map(function(a,i){return '<tr><td>'+(i+1)+'</td><td>'+esc(short(a.h))+'</td><td style="text-align:left">'+esc(a.nome||('Artigo '+(a.art||'')))+'</td><td>'+esc(a.fam||'—')+'</td><td>'+esc(a.grp||'—')+'</td><td class="pl-cell-bad">'+euro(a.p,2)+'</td><td>'+euro(a.med,2)+'</td><td>'+euro(a.min,2)+' <span style="color:var(--text-3)">'+esc(short(a.minHotel||''))+'</span></td><td>'+Number(a.q||0).toLocaleString('pt-PT',{maximumFractionDigits:1})+'</td><td class="pl-cell-bad">'+euro(a.sobre,0)+'</td><td style="font-size:11px;color:var(--text-2)">Preço, unidade, embalagem, fornecedor, codificação</td></tr>';}).join('');
    var table='<div style="overflow:auto;margin-top:12px"><table class="pl-table"><thead><tr><th>#</th><th>Hotel</th><th style="text-align:left">Artigo</th><th>Família</th><th>Grupo</th><th>Preço pago</th><th>Mediana</th><th>Melhor preço</th><th>Qtd</th><th>Sobrecusto</th><th>Validação</th></tr></thead><tbody>'+rows+'</tbody></table></div>';
    var leitura='<div class="pl-dept-card" style="border-left:3px solid #e05c4e"><div class="pl-dept-name">Leitura operacional</div><p style="font-size:12px;color:var(--text-2);line-height:1.75;margin-top:8px">Prioridade: validar primeiro os artigos com maior sobrecusto absoluto. Pedir ao hotel a última fatura, unidade de medida, embalagem, fornecedor, preço contratado e justificação de eventual diferença de qualidade. Se o artigo for equivalente, negociar preço; se não for equivalente, corrigir codificação ou separar artigos.</p></div>';
    return render('Resposta — artigos com desvio',intro,table,leitura);
  };
  var oldPerguntar=window.cuaPerguntar;
  window.cuaPerguntar=function(forcedQ){
    var q=forcedQ || (document.getElementById('cuaPerguntaInput')||{}).value || '';
    var up=String(q).toUpperCase();
    if(up.indexOf('ARTIGO')>=0 || up.indexOf('ARTIGOS')>=0) return window.cuaAnswerArtigos();
    if(typeof oldPerguntar==='function') return oldPerguntar(forcedQ);
  };
})();
