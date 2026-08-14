// ==========================================================
// HOTÉIS MODULE
// ==========================================================

// Live data loaded from Excel (overrides static data when present)
let HOTEIS_XLSX = {}; // key = sheet name → parsed hotel object

// ── Static base data (urls + region mapping) ──────────────
const HOTEIS_STATIC = {
  'VG Porto Ribeira':              { regiao:'Norte e Centro', url:'https://www.vilagale.com/pt/hoteis/porto-e-norte/vila-gale-porto-ribeira' },
  'VG Porto':                      { regiao:'Norte e Centro', url:'https://www.vilagale.com/pt/hoteis/porto-e-norte/vila-gale-porto' },
  'VG Isla Canela':                { regiao:'Espanha',       url:'https://www.vilagale.com/pt/hoteis/espanha/vila-gale-isla-canela' },
  'VGC PONTE DE LIMA VINEYARDS':   { regiao:'Norte e Centro', url:'https://www.vilagale.com/pt/hoteis/porto-e-norte/collection-ponte-de-lima-vineyards' },
  'VG Collection Figueira da Foz': { regiao:'Norte e Centro',        url:'https://www.vilagale.com/pt/hoteis/centro-de-portugal/collection-figueira-da-foz' },
  'VG Collection Braga':           { regiao:'Norte e Centro', url:'https://www.vilagale.com/pt/hoteis/porto-e-norte/collection-braga' },
  'VG Douro Vineyards':            { regiao:'Norte e Centro', url:'https://www.vilagale.com/pt/hoteis/porto-e-norte/vila-gale-douro-vineyards' },
  'VG Collection Douro':           { regiao:'Norte e Centro', url:'https://www.vilagale.com/pt/hoteis/porto-e-norte/collection-douro' },
  'VG Serra da Estrela':           { regiao:'Norte e Centro',        url:'https://www.vilagale.com/pt/hoteis/centro-de-portugal/collection-serra-da-estrela' },
  'VG Coimbra':                    { regiao:'Norte e Centro',        url:'https://www.vilagale.com/pt/hoteis/centro-de-portugal/vila-gale-coimbra' },
  'VG Tomar':                      { regiao:'Norte e Centro',        url:'https://www.vilagale.com/pt/hoteis/centro-de-portugal/collection-tomar' },
  'VG Sintra':                     { regiao:'Lisboa & Ilhas',        url:'https://www.vilagale.com/pt/hoteis/costa-de-lisboa/collection-sintra', estrelas:5 },
  'VG Ericeira':                   { regiao:'Lisboa & Ilhas',        url:'https://www.vilagale.com/pt/hoteis/costa-de-lisboa/vila-gale-ericeira' },
  'VG Cascais':                    { regiao:'Lisboa & Ilhas',        url:'https://www.vilagale.com/pt/hoteis/costa-de-lisboa/vila-gale-cascais' },
  'VG Collection Palácio dos Arcos':{ regiao:'Lisboa & Ilhas',       url:'https://www.vilagale.com/pt/hoteis/costa-de-lisboa/collection-palacio-dos-arcos', estrelas:5 },
  'VG Santa Cruz':                 { regiao:'Lisboa & Ilhas',         url:'https://www.vilagale.com/pt/hoteis/madeira/vila-gale-santa-cruz' },
  'VG Estoril':                    { regiao:'Lisboa & Ilhas',        url:'https://www.vilagale.com/pt/hoteis/costa-de-lisboa/vila-gale-estoril' },
  'VG Ópera':                      { regiao:'Lisboa & Ilhas',        url:'https://www.vilagale.com/pt/hoteis/costa-de-lisboa/vila-gale-opera' },
  "VG Casas d'Elvas":              { regiao:'Alentejo',      url:'https://www.vilagale.com/pt/hoteis/alentejo/casas-de-elvas' },
  'VG Collection Elvas':           { regiao:'Alentejo',      url:'https://www.vilagale.com/pt/hoteis/alentejo/collection-elvas' },
  'VG Collection Alter Real':      { regiao:'Alentejo',      url:'https://www.vilagale.com/pt/hoteis/alentejo/collection-alter-real' },
  'VG Évora':                      { regiao:'Alentejo',      url:'https://www.vilagale.com/pt/hoteis/alentejo/vila-gale-evora' },
  'VG Monte do Vilar':             { regiao:'Alentejo',      url:'https://www.vilagale.com/pt/hoteis/alentejo/collection-monte-do-vilar' },
  'VG Alentejo Vineyards':         { regiao:'Alentejo',      url:'https://www.vilagale.com/pt/hoteis/alentejo/vila-gale-alentejo-vineyards' },
  'VG Tavira':                     { regiao:'Algarve',       url:'https://www.vilagale.com/pt/hoteis/algarve/vila-gale-tavira' },
  'VG NEP Kids':                   { regiao:'Alentejo',      url:'https://www.vilagale.com/pt/hoteis/alentejo/vila-gale-nep-kids' },
  'VG Marina':                     { regiao:'Algarve',       url:'https://www.vilagale.com/pt/hoteis/algarve/vila-gale-marina' },
  'VG Albacora':                   { regiao:'Algarve',       url:'https://www.vilagale.com/pt/hoteis/algarve/vila-gale-albacora' },
  'VG Collection Praia':           { regiao:'Algarve',       url:'https://www.vilagale.com/pt/hoteis/algarve/collection-praia' },
  'VG Ampalius':                   { regiao:'Algarve',       url:'https://www.vilagale.com/pt/hoteis/algarve/vila-gale-ampalius' },
  'VG Cerro Alagoa':               { regiao:'Algarve',       url:'https://www.vilagale.com/pt/hoteis/algarve/vila-gale-cerro-alagoa' },
  'VG Atlântico':                  { regiao:'Algarve',       url:'https://www.vilagale.com/pt/hoteis/algarve/vila-gale-atlantico' },
  'VG Náutico':                    { regiao:'Algarve',       url:'https://www.vilagale.com/pt/hoteis/algarve/vila-gale-nautico' },
  'VG Lagos':                      { regiao:'Algarve',       url:'https://www.vilagale.com/pt/hoteis/algarve/vila-gale-lagos' },
  'VG S Miguel':                   { regiao:'Lisboa & Ilhas',         url:'https://www.vilagale.com/pt/hoteis/acores/collection-sao-miguel' },
};

// ── Excel loader ──────────────────────────────────────────
async function hoteisLoadXlsx(file) {
  if (!file) return;
  try { if(window.VG?.performance?.ensureXLSX) await window.VG.performance.ensureXLSX(); } catch(e) { showToast('Não foi possível carregar a biblioteca Excel: '+(e.message||e), true); return; }
  const dcBefore = typeof window.vgDataCenterCapture === 'function' ? window.vgDataCenterCapture('hotels') : null;
  showToast('A processar fichas técnicas...');
  try {
    const ab = await file.arrayBuffer();
    const wb = XLSX.read(ab, { type:'array' });
    const skip = new Set(['Resumo','Template','Sheet27']);
    const result = {};
    wb.SheetNames.forEach(sh => {
      if (skip.has(sh)) return;
      const ws = wb.Sheets[sh];
      const rows = XLSX.utils.sheet_to_json(ws, { header:1, defval:null });
      result[sh] = hoteisParseSheet(rows, sh);
    });
    HOTEIS_XLSX = result;
    const dt = new Date().toLocaleString('pt-PT',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});
    { const st = document.getElementById('hoteisXlsxStatus'); if (st) st.textContent = `✓ ${Object.keys(result).length} fichas carregadas · ${dt}`; }
    hoteisFiltrar();
    showToast(`✓ ${Object.keys(result).length} fichas técnicas carregadas`);
    uploadSetStatus('uploadStatusHoteis', `✓ ${Object.keys(result).length} fichas carregadas · ${dt}`, true);
    if (typeof window.vgDataCenterRecord === 'function') window.vgDataCenterRecord({source:'hotels',fileName:file.name,fileSize:file.size,scope:`${Object.keys(result).length} fichas`,before:dcBefore,duplicate:!!(dcBefore&&dcBefore.payload&&Object.keys(dcBefore.payload).length),metrics:{hotels:Object.keys(result).length},summary:'Fichas técnicas dos hotéis'});
  } catch(e) {
    showToast('Erro: ' + e.message, true);
    if (typeof window.vgDataCenterRecordFailure === 'function') window.vgDataCenterRecordFailure({source:'hotels',fileName:file.name,fileSize:file.size,summary:e.message,warnings:[e.message]});
  }
}

function hoteisParseSheet(rows, sheetName) {
  const get = (label) => {
    for (const row of rows) {
      if (!row) continue;
      const c0 = (row[0]||'').toString().trim();
      if (c0.toLowerCase() === label.toLowerCase()) {
        return row[1] != null ? row[1].toString().trim() : null;
      }
    }
    return null;
  };
  const getN = (label) => { const v = get(label); return v ? parseFloat(v) : null; };
  const has  = (label) => { const v = get(label); return v && v.toUpperCase() !== 'NÃO' && v !== '' && v !== 'N'; };

  // Hotel name — row 3 col B, may be multiline
  let nome = rows[2]?.[1] || sheetName;
  if (typeof nome === 'string' && nome.includes('\n')) nome = nome.split('\n').filter(s=>s.trim()).find(s=>s.toLowerCase().includes('vila') || s.toLowerCase().includes('hotel')) || nome.split('\n')[0];
  nome = nome.toString().trim();

  // Basic
  const estrelas = getN('Categoria') || (get('Categoria')||'').match(/(\d)/)?.[1] && parseInt(get('Categoria').match(/(\d)/)[1]) || 4;
  const morada   = get('Morada');
  const tel      = get('Telefone');
  const web      = get('Página web');
  const coords   = get('Coordenadas geográficas');
  const anoCons  = getN('Ano de Construção');
  const anoReform= getN('Última Reforma Integral') || getN('Última Reforma Parcial');
  const nEdif    = getN('Nº de Edificios');
  const nPisos   = getN('Nº de Pisos');
  const nElevs   = getN('Nº de Elevadores');
  const totalQ   = getN('Total de Quartos:');

  // Room features
  const features = [];
  ['Comunicantes','Fumador','Não Fumador','Deficiente','Cama de casal','Sofá-cama','Cama extra (tipo e medida)',
   'Berços','Ar condicionado | Aquecimento','Cofre (ex:digital, Laptop)','Terraço/Varanda',
   'Room Service','Mini Bar','Banheira','Internet (wifi, cabo)'].forEach(f => {
    const v = get(f);
    if (v && v.toLowerCase() !== 'não' && v.toLowerCase() !== 'n') features.push(f.replace(' | ',' / '));
  });
  const checkIn  = get('Check In');
  const checkOut = get('Check-Out');

  // Languages
  const langs = [];
  ['Inglês','Francês','Espanhol','Alemão','Outra'].forEach(l => {
    const row = rows.find(r => r && (r[0]||'').toString().trim() === l);
    if (row && row[1]) langs.push(l);
  });

  // Contacts
  const contacts = [];
  const roles = ['Director','Assistente de Direcção','Recepção','Reservas Lazer','Reservas Turismo','Reservas Empresas','Vendas/contratação'];
  roles.forEach(role => {
    const row = rows.find(r => r && (r[0]||'').toString().trim() === role);
    if (row && (row[1] || row[2])) contacts.push({ role, nome: row[1]||'', email: row[2]||'', tel: row[3]||'' });
  });

  // Restaurants
  const rests = [];
  for (let col = 1; col <= 5; col += 2) {
    const nomeRow = rows.find(r => r && (r[0]||'').toString().includes('Nome') && r[col]);
    const capRow  = rows.find(r => r && (r[0]||'').toString().includes('Capacidade') && r[col]);
    const tipRow  = rows.find(r => r && (r[0]||'').toString().includes('Tipo de Serviço') && r[col]);
    const horPA   = rows.find(r => r && (r[0]||'').toString().includes('Horário PA') && r[col]);
    const horJ    = rows.find(r => r && (r[0]||'').toString().includes('Horário Jantar') && r[col]);
    if (nomeRow?.[col]) rests.push({
      nome: nomeRow[col], cap: capRow?.[col], tipo: tipRow?.[col],
      pa: horPA?.[col], jantar: horJ?.[col]
    });
  }

  // Bars
  const bars = [];
  const barSection = rows.findIndex(r => r && (r[0]||'').toString().includes('Bar 1'));
  if (barSection >= 0) {
    for (let col = 1; col <= 5; col += 2) {
      const nRow = rows[barSection+1];
      const hRow = rows.find((r,i) => i > barSection && r && (r[0]||'').toString().includes('Horário') && r[col]);
      if (nRow?.[col]) bars.push({ nome: nRow[col], horario: hRow?.[col] });
    }
  }

  // Pools
  const piscExt = get('Piscina Exterior');
  const piscInt = get('Piscina Interior');
  const piscIntHorario = (() => {
    const row = rows.find(r => r && (r[0]||'').toString().includes('Horário') && r[2] && rows.indexOf(r) > rows.findIndex(rr => (rr?.[0]||'').toString().includes('Piscina')));
    return row?.[2] || null;
  })();

  // Spa
  const spaHorario = (() => {
    const i = rows.findIndex(r => r && (r[0]||'').toString().includes('SPA | Health Club'));
    return i >= 0 ? rows[i+1]?.[1] : null;
  })();
  const spaTratamentos = has('Salas de Massagens e Tratamentos');

  // Meeting rooms
  const nSalas   = getN('Nº de salas');
  const salasLoc = get('Localização/pisos/interior/exterior');

  // Parking
  const garagem  = get('Garagem');
  const garagemCap = getN('Capacidade (nº lugares)');
  const garagemVal = get('Valor');

  // Distances
  const distances = [];
  const distStart = rows.findIndex(r => r && (r[0]||'').toString().includes('Localização/Distâncias'));
  if (distStart >= 0) {
    for (let i = distStart+1; i < Math.min(distStart+20, rows.length); i++) {
      const r = rows[i];
      if (!r || !r[0] || !r[1]) continue;
      const label = r[0].toString().trim();
      const val   = r[1].toString().trim();
      const ref   = r[2] ? r[2].toString().trim() : '';
      if (label && val) distances.push({ label, val, ref });
    }
  }

  // Segments
  const segs = [];
  ['Hotel familiar','Hotel de negócios','Hotel de praia','Hotel ecológico','Hotel romântico','Hotel temático','Hotel histórico','Spa Hotel'].forEach(s => {
    const row = rows.find(r => r && (r[0]||'').toString().trim() === s);
    if (row && row[1]) segs.push(s.replace('Hotel ',''));
  });

  return { nome, estrelas, morada, tel, web, coords, anoCons, anoReform,
           nEdif, nPisos, nElevs, totalQ, features, checkIn, checkOut,
           langs, contacts, rests, bars, piscExt, piscInt, piscIntHorario,
           spaHorario, spaTratamentos, nSalas, salasLoc, garagem, garagemCap,
           garagemVal, distances, segs };
}

// ── Filter & Render ───────────────────────────────────────
let hoteisFiltroRegiao = '';

function hoteisRegiao(btn, regiao) {
  document.querySelectorAll('.ht-filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  hoteisFiltroRegiao = regiao;
  hoteisFiltrar();
}

function hoteisFiltrar() {
  const q = (document.getElementById('hotelSearchFilter')?.value || '').toLowerCase();
  const sheetKeys = Object.keys(HOTEIS_STATIC);
  const filtered = sheetKeys.filter(sk => {
    const s = HOTEIS_STATIC[sk];
    const d = HOTEIS_XLSX[sk];
    const nome = d?.nome || sk;
    const matchR = !hoteisFiltroRegiao || s.regiao === hoteisFiltroRegiao;
    const matchQ = !q || nome.toLowerCase().includes(q) || s.regiao.toLowerCase().includes(q) || (d?.morada||'').toLowerCase().includes(q);
    return matchR && matchQ;
  });
  hoteisRender(filtered);
}

function hoteisRender(sheetKeys) {
  const grid = document.getElementById('hoteisGrid');
  if (!sheetKeys.length) { grid.innerHTML = '<div style="color:var(--text-3);padding:20px;font-size:13px">Nenhum hotel encontrado.</div>'; return; }
  const stars = n => '★'.repeat(n||4) + '<span style="opacity:.2">★</span>'.repeat(5-(n||4));

  grid.innerHTML = sheetKeys.map(sk => {
    const s = HOTEIS_STATIC[sk];
    const d = HOTEIS_XLSX[sk];
    const nome = d?.nome || sk.replace('VG ','Vila Galé ').replace('VGC ','Vila Galé Collection ');
    const estrelas = s.estrelas || d?.estrelas || 4;
    const url = d?.web || s.url;

    if (!d) {
      // No Excel data yet — simple card
      return `<div class="ht-card">
        <div class="ht-card-head">
          <div><div class="ht-hotel-name">${nome}</div><div class="ht-regiao">${s.regiao}</div></div>
          <div class="ht-stars">${stars(estrelas)}</div>
        </div>
        <div class="ht-card-body">
          <div style="color:var(--text-3);font-size:11px;font-style:italic">Carregue a Ficha Técnica Excel para ver os detalhes.</div>
        </div>
        <div class="ht-card-foot">
          <div class="ht-location">📍 ${s.regiao}</div>
          ${url?`<a class="ht-link" href="${url}" target="_blank">Ver hotel ↗</a>`:''}
        </div>
      </div>`;
    }

    // Full card with Excel data
    const restHtml = d.rests.map(r =>
      `<div class="ht-rest-item"><strong>${r.nome}</strong>${r.tipo?' · '+r.tipo:''} ${r.cap?'('+r.cap+' pax)':''}</div>`
    ).join('');
    const barsHtml = d.bars.map(b =>
      `<div class="ht-rest-item">🍹 ${b.nome}${b.horario?' · '+b.horario:''}</div>`
    ).join('');

    const badges = [
      d.piscExt && d.piscExt !== 'Não' ? `<span class="ht-badge">☀️ Piscina exterior</span>` : '',
      d.piscInt && d.piscInt !== 'Não' ? `<span class="ht-badge">🏊 Piscina interior${d.piscIntHorario?' · '+d.piscIntHorario:''}</span>` : '',
      d.spaHorario ? `<span class="ht-badge">💆 Satsanga Spa</span>` : '',
      d.nSalas ? `<span class="ht-badge">🏢 ${d.nSalas} sala${d.nSalas>1?'s':''} reunião${d.salasLoc?' · '+d.salasLoc:''}</span>` : '',
      d.garagem && d.garagem !== 'Não' ? `<span class="ht-badge">🚗 Garagem${d.garagemCap?' ('+d.garagemCap+' lug.)':''}${d.garagemVal?' · '+d.garagemVal:''}</span>` : '',
      d.langs.length ? `<span class="ht-badge">🌐 ${d.langs.join(' · ')}</span>` : '',
    ].filter(Boolean).join('');

    const segsHtml = d.segs.length ? `<div class="ht-row" style="margin-top:6px">${d.segs.map(s=>`<span class="ht-tag">${s}</span>`).join('')}</div>` : '';

    const contactsHtml = d.contacts.length ? `
      <div class="ht-section-lbl" style="margin-top:10px">Contactos</div>
      ${d.contacts.map(c=>`<div style="font-size:10px;color:var(--text-2);padding:3px 0;border-bottom:1px solid var(--border-2);display:flex;gap:8px;flex-wrap:wrap">
        <span style="color:var(--text-3);min-width:120px">${c.role}</span>
        <span style="color:var(--text-1);font-weight:600">${c.nome}</span>
        ${c.email?`<a href="mailto:${c.email}" style="color:var(--gold);font-size:10px">${c.email}</a>`:''}
        ${c.tel?`<span style="font-family:var(--mono)">${c.tel}</span>`:''}
      </div>`).join('')}` : '';

    const distHtml = d.distances.length ? `
      <div class="ht-section-lbl" style="margin-top:10px">Distâncias</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px">
        ${d.distances.slice(0,10).map(dist=>`<div style="font-size:10px;color:var(--text-2);padding:2px 0">
          <span style="color:var(--text-3)">${dist.label}:</span> <span style="font-family:var(--mono);color:var(--text-1)">${dist.val}</span>${dist.ref?` <span style="color:var(--text-3)">${dist.ref}</span>`:''}
        </div>`).join('')}
      </div>` : '';

    const checkHtml = (d.checkIn || d.checkOut) ? `
      <div class="ht-section-lbl" style="margin-top:10px">Check-in / Check-out</div>
      <div style="display:flex;gap:16px;font-size:11px">
        ${d.checkIn?`<span>🔑 Check-in: <strong>${d.checkIn}</strong></span>`:''}
        ${d.checkOut?`<span>🔓 Check-out: <strong>${d.checkOut}</strong></span>`:''}
      </div>` : '';

    const infoHtml = [
      d.totalQ   ? `<span class="ht-badge">🛏 ${d.totalQ} quartos</span>` : '',
      d.nPisos   ? `<span class="ht-badge">🏗 ${d.nPisos} pisos</span>` : '',
      d.anoCons  ? `<span class="ht-badge">📅 Const. ${d.anoCons}</span>` : '',
      d.anoReform? `<span class="ht-badge">🔧 Reform. ${d.anoReform}</span>` : '',
    ].filter(Boolean).join('');

    return `<div class="ht-card">
      <div class="ht-card-head">
        <div>
          <div class="ht-hotel-name">${nome}</div>
          <div class="ht-regiao">${s.regiao}${d.morada?' · '+d.morada.split('\n')[0]:''}</div>
        </div>
        <div class="ht-stars">${stars(estrelas)}</div>
      </div>
      <div class="ht-card-body">
        ${segsHtml}
        ${infoHtml ? `<div class="ht-row">${infoHtml}</div>` : ''}
        ${d.rests.length ? `<div><div class="ht-section-lbl">Restauração</div>${restHtml}${barsHtml}</div>` : ''}
        ${badges ? `<div><div class="ht-section-lbl">Instalações</div><div class="ht-row">${badges}</div></div>` : ''}
        ${checkHtml}
        ${contactsHtml}
        ${distHtml}
      </div>
      <div class="ht-card-foot">
        <div class="ht-location">📍 ${d.morada ? d.morada.split('\n')[0] : s.regiao}</div>
        ${url?`<a class="ht-link" href="${url}" target="_blank">Ver hotel ↗</a>`:''}
      </div>
    </div>`;
  }).join('');
}

function hoteisInit() {
  hoteisFiltrar();
}

// ── Persistence ───────────────────────────────────────────
const _htBuild = buildSessionSnapshot;
buildSessionSnapshot = function() {
  const snap = _htBuild();
  if (Object.keys(HOTEIS_XLSX).length) snap.HOTEIS_XLSX = HOTEIS_XLSX;
  return snap;
};
const _htRestore = restoreFromSnapshot;
restoreFromSnapshot = function(snap) {
  try{ _htRestore(snap); }catch(e){ console.warn('Restauro anterior às Fichas de Hotel falhou:', e); }
  try{
    if (snap.HOTEIS_XLSX) { HOTEIS_XLSX = snap.HOTEIS_XLSX; hoteisFiltrar(); }
  }catch(e){ console.warn('Atualização do ecrã de Fichas de Hotel falhou (dados já estão carregados):', e); }
};
