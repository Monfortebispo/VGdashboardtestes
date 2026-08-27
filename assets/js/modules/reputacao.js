// REPUTATION MODULE v2
// REP_STORE: { normalisedHotelName → [ {entry}, ... ] }
// Each entry has a unique (hotel, week) key — no duplicates.
// ══════════════════════════════════════════════════════════
const REP_STORE = {};
window.VG = window.VG || {};
window.VG.reputationStore = REP_STORE;
window.VG.reputation = window.VG.reputation || {};
window.VG.reputation.read = () => REP_STORE;
window.VG.reputation.stats = () => ({
  hotels: Object.keys(REP_STORE).length,
  records: Object.values(REP_STORE).reduce((sum, rows) => sum + (Array.isArray(rows) ? rows.length : 0), 0)
});
let rtSelected  = new Set(); // selected hotel keys for comparison
let rtCharts    = {};

// ── Key helpers ───────────────────────────────────────────
const rtKey = name => name.toLowerCase().replace(/[^a-z0-9\u00c0-\u017e\s]/gi,'').replace(/\s+/g,' ').trim();

function rtEscape(v) {
  return String(v ?? '').replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[s]));
}
function rtCanon(v) {
  return String(v ?? '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .toLowerCase()
    .replace(/\bvila\s*gal[eé]?\b/g,'')
    .replace(/\bvg\b/g,'')
    .replace(/\bresumo\s+executivo\b/g,'')
    .replace(/\bhotel\b/g,'')
    .replace(/[^a-z0-9]+/g,' ')
    .replace(/\s+/g,' ')
    .trim();
}
function rtPrettyHotelName(v) {
  const small = new Set(['de','da','do','das','dos','e']);
  return String(v || '')
    .toLowerCase()
    .split(/\s+/)
    .map((w,i) => small.has(w) && i > 0 ? w : w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
    .replace(/\bOpera\b/g,'Ópera')
    .replace(/\bPalacio\b/g,'Palácio')
    .replace(/\bAtlantico\b/g,'Atlântico')
    .replace(/\bEvora\b/g,'Évora');
}
function rtKnownHotels() {
  const fromRegions = Object.values(REGIOES || {}).flat();
  const fromRaw = (RAW && RAW.hotel_list) ? RAW.hotel_list : [];
  return [...new Set([...fromRegions, ...fromRaw])];
}
function rtCleanHotelName(raw) {
  let s = String(raw || '')
    .replace(/\.pdf$/i,'')
    .replace(/_/g,' ')
    .replace(/\s*\(\d+\)\s*$/,'')
    .replace(/\s*[-–—]\s*Resumo\s+Executivo.*$/i,'')
    .replace(/\bResumo\s+Executivo\b.*$/i,'')
    .replace(/^\s*Vila\s+Gal[eé]\s+/i,'')
    .replace(/^\s*VG\s+/i,'')
    .replace(/\s+/g,' ')
    .trim();
  return s || String(raw || 'Hotel').trim();
}
function rtResolveHotelName(raw) {
  const cleaned = rtCleanHotelName(raw);
  const c = rtCanon(cleaned);
  const match = rtKnownHotels().find(h => {
    const hc = rtCanon(h);
    return hc === c || c.includes(hc) || hc.includes(c);
  });
  return match ? rtPrettyHotelName(match) : cleaned;
}
function rtPeriodKey(entry) {
  const raw = entry?.period || entry?.week || '';
  return rtCanon(raw) || 'semana-desconhecida';
}
function rtEntryKey(entry) {
  return `${rtCanon(entry?.hotel || '')}|${rtPeriodKey(entry)}`;
}
function rtEntryMatchesRegion(k, regionHotel) {
  const a = rtCanon(REP_STORE[k]?.[0]?.hotel || k);
  const b = rtCanon(regionHotel);
  return a === b || a.includes(b) || b.includes(a);
}
function rtKeysForRegion(region = activeRegion) {
  const keys = Object.keys(REP_STORE).sort((a,b) => String(REP_STORE[a]?.[0]?.hotel || a).localeCompare(String(REP_STORE[b]?.[0]?.hotel || b), 'pt'));
  if (!region || region === 'todos') return keys;
  const list = REGIOES[region] || [];
  return keys.filter(k => list.some(h => rtEntryMatchesRegion(k, h)));
}
function rtNormalizeStore() {
  const next = {};
  Object.keys(REP_STORE).forEach(oldKey => {
    const arr = Array.isArray(REP_STORE[oldKey]) ? REP_STORE[oldKey] : [REP_STORE[oldKey]];
    arr.filter(Boolean).forEach(oldEntry => {
      const entry = Object.assign({}, oldEntry);
      entry.hotel = rtResolveHotelName(entry.hotel || oldKey);
      entry._entryKey = rtEntryKey(entry);
      const key = rtKey(entry.hotel);
      if (!next[key]) next[key] = [];
      const i = next[key].findIndex(e => rtEntryKey(e) === entry._entryKey);
      if (i >= 0) next[key][i] = entry;
      else next[key].push(entry);
    });
  });
  Object.keys(REP_STORE).forEach(k => delete REP_STORE[k]);
  Object.entries(next).forEach(([k, arr]) => {
    REP_STORE[k] = arr.sort((a,b) => rtCmpWeek(a.week,b.week));
  });
  const valid = new Set(Object.keys(REP_STORE));
  rtSelected = new Set([...rtSelected].map(k => {
    if (valid.has(k)) return k;
    const target = [...valid].find(v => rtCanon(REP_STORE[v]?.[0]?.hotel || v) === rtCanon(k));
    return target || null;
  }).filter(Boolean));
  if (!rtSelected.size) Object.keys(REP_STORE).forEach(k => rtSelected.add(k));
}


// ── Clear all data ────────────────────────────────────────
function rtClearAll() {
  if (!Object.keys(REP_STORE).length) return;
  if (!confirm('Limpar todos os dados de reputação?')) return;
  Object.keys(REP_STORE).forEach(k => delete REP_STORE[k]);
  rtSelected.clear();
  Object.values(rtCharts).forEach(c => c.destroy());
  rtCharts = {};
  window.dispatchEvent(new CustomEvent('vg-reputation-data-changed'));
  rtRender();
  showToast('Dados de reputação limpos');
}

// ── File loading ──────────────────────────────────────────
async function rtLoadFiles(files) {
  const dcBefore = typeof window.vgDataCenterCapture === 'function' ? window.vgDataCenterCapture('reputation') : null;
  let added = 0, updated = 0, failed = 0;
  for (const file of [...files]) {
    if (!file.name.toLowerCase().endsWith('.pdf')) continue;
    const text = await rtReadPdf(file);
    const data = text ? rtParsePdf(text, file.name) : null;
    if (!data || !data.gri) { showToast('Não foi possível ler: ' + file.name, true); failed++; continue; }
    data.hotel = rtResolveHotelName(data.hotel);
    data._entryKey = rtEntryKey(data);
    const key = rtKey(data.hotel);
    if (!REP_STORE[key]) REP_STORE[key] = [];
    // Substituição real: mesmo hotel + mesmas datas/semana → apaga a versão antiga e entra a nova
    const existing = REP_STORE[key].findIndex(e => rtEntryKey(e) === data._entryKey);
    if (existing >= 0) { REP_STORE[key][existing] = data; updated++; }
    else { REP_STORE[key].push(data); added++; }
    // Keep entries sorted chronologically by week
    REP_STORE[key].sort((a,b) => rtCmpWeek(a.week, b.week));
    rtSelected.add(key);
  }
  document.getElementById('rtFileInput').value = '';
  if (added + updated > 0) {
    window.dispatchEvent(new CustomEvent('vg-reputation-data-changed'));
    showToast(`✓ ${added} entr${added===1?'ada':'adas'} adicionada${added===1?'':'s'}${updated?' · '+updated+' actualizada'+(updated===1?'':'s'):''}`);
    rtRender();
    if (typeof window.vgDataCenterRecord === 'function') window.vgDataCenterRecord({
      source:'reputation',fileName:[...files].map(f=>f.name).join(', '),fileSize:[...files].reduce((a,f)=>a+(f.size||0),0),scope:`${added+updated} período(s)`,before:dcBefore,duplicate:updated>0,metrics:{added,updated,failed,hotels:Object.keys(REP_STORE).length},warnings:failed?[`${failed} ficheiro(s) não reconhecido(s)`]:[],summary:'Importação de reputação'
    });
  } else if (failed && typeof window.vgDataCenterRecordFailure === 'function') {
    window.vgDataCenterRecordFailure({source:'reputation',fileName:[...files].map(f=>f.name).join(', '),fileSize:[...files].reduce((a,f)=>a+(f.size||0),0),summary:'Nenhum ficheiro de reputação válido',warnings:[`${failed} ficheiro(s) não reconhecido(s)`]});
  }
}

function rtHandleDrop(e) {
  e.preventDefault();
  document.getElementById('rtDropZone').classList.remove('drag-over');
  rtLoadFiles(e.dataTransfer.files);
}

// ── Debug: mostrar texto bruto extraído de um PDF ─────────
async function rtDebugPdf(file) {
  if (!file) return;
  showToast('A extrair texto do PDF...');
  const text = await rtReadPdf(file);
  if (!text) { showToast('Não foi possível extrair texto', true); return; }
  // Mostrar janela modal com o texto e os campos parsed
  const parsed = rtParsePdf(text, file.name);
  const snippet = text.slice(0, 2000).replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const info = `
    <b>Ficheiro:</b> ${file.name}<br>
    <b>reviews:</b> ${parsed.reviews ?? '<span style="color:#e05c5c">null — não encontrado!</span>'}<br>
    <b>reviewsDelta:</b> ${parsed.reviewsDelta ?? '—'}<br>
    <b>gri:</b> ${parsed.gri ?? '—'}<br>
    <b>mgmtResp:</b> ${parsed.mgmtResp ?? '—'}<br>
    <b>week:</b> ${parsed.week}<br><br>
    <b>Texto bruto (primeiros 2000 chars):</b><br>
    <pre style="white-space:pre-wrap;font-size:11px;max-height:300px;overflow:auto;background:rgba(0,0,0,.3);padding:8px;border-radius:4px;margin-top:4px">${snippet}</pre>
  `;
  // Create overlay
  const ov = document.createElement('div');
  ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:9999;display:flex;align-items:center;justify-content:center;padding:24px';
  ov.innerHTML = `<div style="background:#0f1e35;border:1px solid rgba(201,168,76,.3);border-radius:12px;padding:24px;max-width:700px;width:100%;max-height:80vh;overflow:auto;font-size:13px;color:#94a3b8;line-height:1.6">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
      <span style="color:#c9a84c;font-weight:700;font-size:12px;text-transform:uppercase;letter-spacing:1.5px">🔍 Debug PDF Parser</span>
      <button onclick="this.closest('[style*=fixed]').remove()" style="background:none;border:none;color:#64748b;cursor:pointer;font-size:18px">✕</button>
    </div>
    ${info}
  </div>`;
  document.body.appendChild(ov);
  ov.addEventListener('click', e => { if (e.target === ov) ov.remove(); });
}

// ── PDF reading ───────────────────────────────────────────
async function rtReadPdf(file) {
  return new Promise(resolve => {
    const r = new FileReader();
    r.onload = async e => {
      try {
        const lib = window['pdfjs-dist/build/pdf'];
        if (!lib) { resolve(rtFallback(e.target.result)); return; }
        const pdf = await lib.getDocument({ data: e.target.result }).promise;
        let t = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const pg = await pdf.getPage(i);
          const ct = await pg.getTextContent();
          t += ct.items.map(s=>s.str).join(' ') + '\n';
        }
        resolve(t);
      } catch(err) { resolve(rtFallback(e.target.result)); }
    };
    r.readAsArrayBuffer(file);
  });
}
function rtFallback(ab) {
  const b = new Uint8Array(ab); let t = '';
  for (let i=0;i<b.length;i++) { const c=b[i]; if(c>=32&&c<127)t+=String.fromCharCode(c); else if(c===10||c===13)t+=' '; }
  return t;
}

// ── PDF parser ────────────────────────────────────────────
function rtParsePdf(text, filename) {
  // Hotel name from filename — limpo e alinhado com o mapa de regiões
  let hotel = rtResolveHotelName(filename);

  // Period
  const pM = text.match(/(\d{1,2}\s+\w+\s+\d{4})\s*[-–]\s*(\d{1,2}\s+\w+\s+\d{4})/);
  const period = pM ? pM[0] : null;
  let week = period || 'Sem. desconhecida';
  if (pM) {
    const d1 = pM[1].match(/(\d+)\s+(\w+)\s+(\d{4})/), d2 = pM[2].match(/(\d+)\s+(\w+)/);
    if (d1&&d2) week = `${d1[1]}-${d2[1]} ${d1[2].substring(0,3)} ${d1[3]}`;
  }

  const n = v => v == null ? null : Math.round(parseFloat(v.replace(',','.'))*10)/10;

  // GRI
  const gM = text.match(/GRI[™M]?\s*[\n\r]*\s*(\d{2,3}[.,]\d)%\s*([+\-]\d{1,2}[.,]\d)/);
  const gri = gM ? n(gM[1]) : null;
  const griDelta = gM ? n(gM[2]) : null;
  const gGoal = (text.match(/Goal\s+(\d{2,3}[.,]\d)%/) || [])[1];
  const griGoal = gGoal ? n(gGoal) : null;

  // Reviews — várias variantes do ReviewPro PDF
  // Tenta: "Reviews 123 +45"  |  "Reviews 123"  |  "Total Reviews 123"  |  "Reviews\n123"  |  "123 Reviews"
  const rM = text.match(/(?:Total\s+)?Reviews[\s\n\r:]+(\d+)\s*([+\-]\d+)?/)
           || text.match(/(\d{1,5})\s+Reviews?(?:\s+([+\-]\d+))?/i)
           || text.match(/N[uú]mero\s+de\s+[Rr]eviews[\s\n\r:]+(\d+)\s*([+\-]\d+)?/);
  const reviews = rM ? parseInt(rM[1]) : null;
  const reviewsDelta = (rM && rM[2]) ? parseInt(rM[2]) : null;

  // Depts
  function dept(names) {
    for (const nm of names) {
      const m = text.match(new RegExp(nm+'[^\\d]{0,25}(\\d{2,3}[.,]\\d)%\\s*([+\\-]\\d{1,2}[.,]\\d)','i'));
      if (m) return { val: n(m[1]), delta: n(m[2]) };
    }
    return null;
  }
  const depts = {
    Service:     dept(['Service','Servi']),
    Room:        dept(['Room','Quarto']),
    Cleanliness: dept(['Cleanliness','Limpeza']),
    Value:       dept(['Value','Valor','Custo']),
    Location:    dept(['Location','Localiza']),
  };

  // Mgmt response
  const mgM = (text.match(/Management Response[^%\d]*(\d{1,3}[.,]\d?)%/) || [])[1];
  const mgmtResp = mgM ? n(mgM) : null;

  // Sources
  const srcMap = {};
  const sRx = /(Booking\.com|Google|Tripadvisor|Expedia|Agoda|Holidaycheck)\s+(\d{1,3}[.,]\d)%/gi;
  let sm;
  while ((sm = sRx.exec(text)) !== null) {
    const v = n(sm[2]);
    if (!srcMap[sm[1]] && v > 0) srcMap[sm[1]] = { name: sm[1], score: v };
  }

  // CQI
  const cqiM = (text.match(/CQI[™M]?[^%\d]*(\d{2,3}[.,]\d)%/) || [])[1];
  const cqi = cqiM ? n(cqiM) : null;

  // Rank VG
  const rkM = text.match(/Vila Galé\s+(\d+)\s*\/\s*(\d+)/);
  const rankVG = rkM ? `${rkM[1]}/${rkM[2]}` : null;

  // ── Structured neg/pos categories from page 5 ─────────
  // Format: "Category Name  N  +N  -X.X  -X.X  TopConcept"
  const negCats = [], posCats = [];

  // Extract the negative categories block
  const negBlock = text.match(/Negativamente[\s\S]{0,120}?GRI[™\w]*\s*Impact([\s\S]{0,800}?)(?=Categorias que Afet[ae]m Positivamente|Tendências|Trending|Glossário)/i);
  if (negBlock) {
    // Known category patterns (Portuguese ReviewPro labels)
    const CAT_PATTERNS = [
      'Alimentos e restaura[çc][aã]o','Instala[çc][oõ][eê]s','Estabelecimento',
      'Ambiente e decora[çc][aã]o','Caf[eé] da manh[aã]','Servi[çc]o','Quarto',
      'Limpeza','Localiza[çc][aã]o','Valor','Piscina','Bar e bebidas','Pessoal',
      'Spa','Entretenimento','Transporte','Wi[- ]?Fi','Estacionamento'
    ];
    const block = negBlock[1];
    CAT_PATTERNS.forEach(pat => {
      const m = block.match(new RegExp(pat + '[\\s\\S]{0,5}?(\\d+)[\\s\\S]{0,30}?(-[\\d.]+)', 'i'));
      if (m) {
        const catName = block.match(new RegExp(pat, 'i'))?.[0] || pat;
        negCats.push({ cat: catName, mentions: parseInt(m[1]), impact: parseFloat(m[2]) });
      }
    });
    // Fallback: extract top concepts as simple strings if structured parse failed
    if (!negCats.length) {
      block.match(/\b[a-záàãâéêíóôõúçü]{4,20}\b/gi)?.slice(0,5).forEach(w => negCats.push({ cat: w, mentions: 1, impact: 0 }));
    }
  }

  const posBlock = text.match(/Positivamente[\s\S]{0,120}?GRI[™\w]*\s*Impact([\s\S]{0,800}?)(?=Tendências|Trending|Glossário)/i);
  if (posBlock) {
    const CAT_POS = [
      'Piscina e praia','Bar e bebidas','Limpeza','Pessoal','Caf[eé] da manh[aã]',
      'Servi[çc]o','Quarto','Localiza[çc][aã]o','Valor','Spa','Jardim','Vista'
    ];
    const block = posBlock[1];
    CAT_POS.forEach(pat => {
      const m = block.match(new RegExp(pat + '[\\s\\S]{0,5}?(\\d+)[\\s\\S]{0,30}?([+][\\d.]+)', 'i'));
      if (m) {
        const catName = block.match(new RegExp(pat, 'i'))?.[0] || pat;
        posCats.push({ cat: catName, mentions: parseInt(m[1]), impact: parseFloat(m[2]) });
      }
    });
    if (!posCats.length) {
      block.match(/\b[a-záàãâéêíóôõúçü]{4,20}\b/gi)?.slice(0,5).forEach(w => posCats.push({ cat: w, mentions: 1, impact: 0 }));
    }
  }

  return { hotel, week, period, gri, griDelta, griGoal, reviews, reviewsDelta,
           depts, mgmtResp, srcList: Object.values(srcMap), cqi, rankVG, negCats, posCats };
}

// ── Pills ─────────────────────────────────────────────────
function rtBuildPills() {
  const keys = rtKeysForRegion(activeRegion);
  const wrap = document.getElementById('rtFilterWrap');
  const pills = document.getElementById('rtPills');
  wrap.style.display = Object.keys(REP_STORE).length ? 'block' : 'none';
  if (!keys.length) {
    pills.innerHTML = `<div class="rt-filter-empty">Sem hotéis carregados para a região selecionada.</div>`;
    return;
  }
  const allOn = keys.every(k => rtSelected.has(k));
  pills.innerHTML =
    `<span class="rt-pill rt-pill-all ${allOn?'on':''}" onclick="rtToggleAll(this)">Todos (${keys.length})</span>` +
    keys.map(k => {
      const nm = REP_STORE[k][0]?.hotel || k;
      const weeks = REP_STORE[k]?.length || 0;
      return `<span class="rt-pill ${rtSelected.has(k)?'on':''}" data-key="${rtEscape(k)}" onclick="rtTogglePill(this)">${rtEscape(nm)}${weeks>1?` · ${weeks} sem.`:''}</span>`;
    }).join('');
}
function rtToggleAll(el) {
  const keys = rtKeysForRegion(activeRegion);
  const allOn = keys.length && keys.every(k => rtSelected.has(k));
  if (allOn) {
    // Nunca deixa a análise completamente vazia: mantém o primeiro hotel visível.
    keys.slice(1).forEach(k => rtSelected.delete(k));
  } else {
    keys.forEach(k => rtSelected.add(k));
  }
  rtRender();
}
function rtTogglePill(el) {
  const k = el.dataset.key;
  const visibleSelected = rtKeysForRegion(activeRegion).filter(x => rtSelected.has(x));
  if (rtSelected.has(k)) { if (visibleSelected.length > 1) rtSelected.delete(k); }
  else rtSelected.add(k);
  rtRender();
}
function rtRemove(key, week) {
  if (!REP_STORE[key]) return;
  REP_STORE[key] = REP_STORE[key].filter(e => e.week !== week);
  if (!REP_STORE[key].length) { delete REP_STORE[key]; rtSelected.delete(key); }
  rtRender();
}

// ── Helpers ───────────────────────────────────────────────
// ── Week date comparator ──────────────────────────────────
// Parses "9-15 Feb 2026", "30-5 Mar 2026", "25 Jan-1 Feb 2026" etc.
// Returns a Date from the start day for chronological sorting.
const MONTH_MAP = {jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11,
                   fev:1,abr:3,mai:4,jun:5,jul:6,ago:7,set:8,out:9,dez:11};
function rtWeekToDate(w) {
  if (!w) return new Date(0);
  // "9-15 Feb 2026" → day=9, month=Feb, year=2026
  const m = w.match(/^(\d{1,2})[\s\-].*?(\w{3})\s+(\d{4})$/);
  if (m) {
    const mo = MONTH_MAP[m[2].toLowerCase()];
    if (mo !== undefined) return new Date(parseInt(m[3]), mo, parseInt(m[1]));
  }
  return new Date(0);
}
function rtCmpWeek(a, b) { return rtWeekToDate(a) - rtWeekToDate(b); }

const rtLatest = k => REP_STORE[k]?.length ? [...REP_STORE[k]].sort((a,b)=>rtCmpWeek(a.week,b.week)).slice(-1)[0] : null;
const rtSelKeys = () => {
  const regionKeys = new Set(rtKeysForRegion(activeRegion));
  return [...rtSelected].filter(k => REP_STORE[k] && regionKeys.has(k));
};
const gClass = v => v >= 90 ? 'c-good' : v >= 80 ? 'c-mid' : 'c-bad';
const fillClass = v => v >= 90 ? 'fill-g' : v >= 80 ? 'fill-m' : 'fill-b';
const fmt2 = v => v != null ? (v >= 0 ? '+' : '') + v : '—';

// ── KPIs ──────────────────────────────────────────────────
function rtBuildKPIs() {
  const sel = rtSelKeys();
  const lats = sel.map(rtLatest).filter(h => h?.gri != null);
  if (!lats.length) {
    const kpis = document.getElementById('rtKpis');
    kpis.style.display = 'grid';
    kpis.innerHTML = `<div class="rt-empty-inline">Sem dados de reputação para a região/filtro selecionado.</div>`;
    return;
  }
  const avg = (lats.reduce((a,h)=>a+h.gri,0)/lats.length).toFixed(1);
  const best  = [...lats].sort((a,b)=>b.gri-a.gri)[0];
  const worst = [...lats].sort((a,b)=>a.gri-b.gri)[0];
  const aboveGoal = lats.filter(h=>h.griGoal!=null&&h.gri>=h.griGoal).length;
  const totalRev  = lats.reduce((a,h)=>a+(h.reviews||0),0);
  const kpis = document.getElementById('rtKpis');
  kpis.style.display = 'grid';
  kpis.innerHTML = [
    { l:'GRI™ Médio', v:avg+'%', s:`${sel.length} unidades`, c:'' },
    { l:'Melhor GRI™', v:best.gri+'%', s:best.hotel, c:'k-green' },
    { l:'Pior GRI™', v:worst.gri+'%', s:worst.hotel, c:'k-red' },
    { l:'Acima do Goal', v:`${aboveGoal}/${lats.filter(h=>h.griGoal).length}`, s:'unidades', c:'k-blue' },
    { l:'Total Reviews', v:totalRev, s:'semana + recente', c:'' },
  ].map(k=>`<div class="rt-kpi ${k.c}">
    <div class="rt-kpi-lbl">${k.l}</div>
    <div class="rt-kpi-val">${k.v}</div>
    <div class="rt-kpi-sub">${k.s}</div>
  </div>`).join('');
}

// ── Ranking ───────────────────────────────────────────────
function rtBuildRanking() {
  const rows = rtSelKeys().map(k => ({ k, h: rtLatest(k) }))
    .filter(r => r.h?.gri != null).sort((a,b) => b.h.gri - a.h.gri);
  const tbody = document.getElementById('rtRankBody');
  tbody.innerHTML = rows.map(({k,h},i) => {
    const gc = gClass(h.gri); const dc = (h.griDelta||0)>=0?'c-up':'c-dn';
    const goalBadge = h.griGoal
      ? `<span class="delta-badge ${h.gri>=h.griGoal?'pos':'neg'}">${h.griGoal}% ${h.gri>=h.griGoal?'✓':'✗'}</span>` : '—';
    const delta = h.griDelta != null ? `<span class="delta-badge ${h.griDelta>=0?'pos':'neg'}">${h.griDelta>=0?'▲':'▼'} ${Math.abs(h.griDelta)}</span>` : '—';
    return `<tr>
      <td><span class="rank-num ${i===0?'top':''}">${i+1}</span></td>
      <td style="font-weight:700;color:var(--text-1)">${rtEscape(h.hotel)}</td>
      <td><strong class="${gc}">${h.gri}%</strong></td>
      <td>${delta}</td>
      <td>${goalBadge}</td>
      <td>${h.reviews ?? '—'}${h.reviewsDelta != null ? ` <span class="c-up" style="font-size:9px">(+${h.reviewsDelta})</span>` : ''}</td>
      <td>${h.week || '—'}</td>
      <td><button class="rt-remove-btn" onclick="rtRemove('${rtEscape(k)}','${rtEscape(h.week)}')" title="Remover esta semana">✕</button></td>
    </tr>`;
  }).join('');
}

// ── Department comparison ─────────────────────────────────
function rtBuildDepts() {
  const sel = rtSelKeys();
  const latest = sel.map(k=>({k,h:rtLatest(k)})).filter(x=>x.h);
  if (!latest.length) return;
  const deptNames = ['Service','Room','Cleanliness','Value','Location'];
  const labels = {Service:'Serviço',Room:'Quartos',Cleanliness:'Limpeza',Value:'Valor',Location:'Localização'};
  const wrap = document.getElementById('rtDeptGrid');
  wrap.innerHTML = deptNames.map(d => {
    const rows = latest.map(({h})=>({hotel:h.hotel,v:h.depts?.[d]?.val,delta:h.depts?.[d]?.delta})).filter(x=>x.v!=null).sort((a,b)=>b.v-a.v);
    if (!rows.length) return '';
    return `<div class="rt-dept-card">
      <div class="rt-dept-name">${labels[d]}</div>
      ${rows.map(r=>`<div class="rt-dept-row">
        <div class="rt-dept-hotel">${rtEscape(r.hotel)}</div>
        <div class="rt-dept-track"><div class="rt-dept-fill ${fillClass(r.v)}" style="width:${r.v}%"></div></div>
        <div class="rt-dept-val ${gClass(r.v)}">${r.v}%</div>
        <div class="rt-dept-delta ${r.delta>=0?'c-up':'c-dn'}">${fmt2(r.delta)}</div>
      </div>`).join('')}
    </div>`;
  }).join('');
}

// ── Source scores ─────────────────────────────────────────
function rtBuildSources() {
  const sel = rtSelKeys();
  const allSrc = {};
  sel.forEach(k => {
    const h = rtLatest(k); if (!h) return;
    (h.srcList||[]).forEach(s => {
      if (!allSrc[s.name]) allSrc[s.name]=[];
      allSrc[s.name].push({hotel:h.hotel,score:s.score});
    });
  });
  const wrap = document.getElementById('rtSrcGrid');
  if (!Object.keys(allSrc).length) { wrap.innerHTML='<div style="color:var(--text-3);font-size:11px">Sem dados de fontes disponíveis.</div>'; return; }
  wrap.innerHTML = Object.entries(allSrc).map(([src,rows]) => `<div class="rt-src-card">
    <div class="rt-src-title">${rtEscape(src)}</div>
    ${rows.sort((a,b)=>b.score-a.score).map(r=>`<div class="rt-src-row">
      <span>${rtEscape(r.hotel)}</span><strong class="${gClass(r.score)}">${r.score}%</strong>
    </div>`).join('')}
  </div>`).join('');
}

// ── Trends ────────────────────────────────────────────────
function rtBuildTrends() {
  const sel = rtSelKeys();
  const all = [];
  sel.forEach(k => {
    const h=rtLatest(k); if (!h) return;
    (h.negCats||[]).forEach(c=>all.push({...c,hotel:h.hotel,type:'neg'}));
    (h.posCats||[]).forEach(c=>all.push({...c,hotel:h.hotel,type:'pos'}));
  });
  const neg = all.filter(x=>x.type==='neg').sort((a,b)=>a.impact-b.impact).slice(0,12);
  const pos = all.filter(x=>x.type==='pos').sort((a,b)=>b.impact-a.impact).slice(0,12);
  document.getElementById('rtNegTrends').innerHTML = neg.length ? neg.map(x=>`<div class="rt-trend-row"><span>${rtEscape(x.cat)} <small>${rtEscape(x.hotel)}</small></span><strong class="c-dn">${x.impact}</strong></div>`).join('') : '<div class="rt-empty-inline">Sem tendências negativas.</div>';
  document.getElementById('rtPosTrends').innerHTML = pos.length ? pos.map(x=>`<div class="rt-trend-row"><span>${rtEscape(x.cat)} <small>${rtEscape(x.hotel)}</small></span><strong class="c-up">+${x.impact}</strong></div>`).join('') : '<div class="rt-empty-inline">Sem tendências positivas.</div>';
}

// ── Charts ────────────────────────────────────────────────
function rtBuildCharts() {
  const sel = rtSelKeys();
  if (!sel.length) return;
  const ctx = document.getElementById('rtTrendChart');
  if (!ctx || typeof Chart === 'undefined') return;
  if (rtCharts.trend) rtCharts.trend.destroy();
  const labels = [...new Set(sel.flatMap(k => REP_STORE[k].map(e=>e.week)))].sort(rtCmpWeek);
  const datasets = sel.map((k,i) => {
    const color = ['#c9a84c','#38bdf8','#22c55e','#f97316','#a78bfa','#ef4444','#14b8a6','#f59e0b'][i%8];
    return {
      label: REP_STORE[k][0]?.hotel || k,
      data: labels.map(w => REP_STORE[k].find(e=>e.week===w)?.gri ?? null),
      borderColor: color, backgroundColor: color+'22', tension:.35, spanGaps:true,
      pointRadius:3, pointHoverRadius:5, borderWidth:2
    };
  });
  rtCharts.trend = new Chart(ctx,{type:'line',data:{labels,datasets},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{color:'#94a3b8',font:{size:10}}}},scales:{x:{ticks:{color:'#64748b',font:{size:9}},grid:{color:'rgba(255,255,255,.04)'}},y:{ticks:{color:'#64748b',font:{size:9}},grid:{color:'rgba(255,255,255,.04)'},suggestedMin:70,suggestedMax:100}}}});
}

function rtRender() {
  rtNormalizeStore();
  rtBuildPills();
  const hasData = rtSelKeys().length > 0;
  document.getElementById('rtEmpty').style.display = Object.keys(REP_STORE).length ? 'none' : 'block';
  document.getElementById('rtContent').style.display = Object.keys(REP_STORE).length ? 'block' : 'none';
  if (!Object.keys(REP_STORE).length) return;
  rtBuildKPIs();
  rtBuildRanking();
  rtBuildDepts();
  rtBuildSources();
  rtBuildTrends();
  rtBuildCharts();
}

// initial render
window.addEventListener('DOMContentLoaded', () => {
  try { rtRender(); } catch(e) { console.warn('rtRender init:', e); }
});
