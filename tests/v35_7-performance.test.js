const assert=require('assert');
const fs=require('fs');
const path=require('path');
const crypto=require('crypto');
const cp=require('child_process');
const ROOT=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const html=read('index.html');
const lazy=read('assets/js/core/08-performance-loader-v35_7.js');
const persistence=read('assets/js/core/03-persistence-sharing.js');
const bootstrap=read('assets/js/core/04-bootstrap.js');
const shell=read('assets/js/ui/vg-operations-2-v30.js');
const sw=read('service-worker.js');
const pkg=require('../package.json');

assert.strictEqual(pkg.version,'35.7.0','package deve identificar V35.7');
assert(html.includes('content="35.7"')&&html.includes('V35.7 · Performance'),'HTML deve identificar V35.7 Performance');
assert(html.includes('assets/js/core/08-performance-loader-v35_7.js')&&html.includes('assets/css/performance-v35_7.css'),'loader de performance deve arrancar com o shell');

const lazyHeavy=[
  'assets/js/modules/hotel-360-v30.js','assets/js/modules/revenue-intelligence.js','assets/js/modules/revenue-hub-v30.js',
  'assets/js/modules/city-ledger-v32.js','assets/js/modules/unit-economics-v32.js','assets/js/modules/operations-domains-v33.js',
  'assets/js/modules/document-management-v26.js','assets/js/modules/workflow-approvals-v27.js','assets/js/modules/analytical-assistant-v25.js',
  'assets/js/modules/automatic-reports-v24.js','assets/js/modules/operational-agenda-v22.js','assets/js/modules/benchmarking.js','assets/js/modules/anomaly-detection.js'
];
for(const rel of lazyHeavy){
  assert(!html.includes(`src="${rel}"`),`${rel} não deve bloquear o arranque`);
  assert(lazy.includes(rel),`${rel} deve existir no manifesto lazy`);
}
for(const token of ["hotel360:'hotel360'","revenuehub:'revenueCore'","cityledger:'cityledger'","housekeeping:'operationsDomains'","analyticalassistant:'assistant'"])
  assert(lazy.includes(token),`mapeamento lazy em falta: ${token}`);

function localRefs(tag,attr,ext){
  const re=new RegExp(`<${tag}\\b[^>]*\\b${attr}=["']([^"']+)`,`gi`);const out=[];let m;
  while((m=re.exec(html))){const r=m[1].split(/[?#]/)[0];if(/^https?:/i.test(r))continue;const f=path.join(ROOT,r.replace(/^\//,''));if(fs.existsSync(f)&&(!ext||r.endsWith(ext)))out.push(f);}
  return [...new Set(out)];
}
const initialJs=localRefs('script','src','.js');
const initialCss=localRefs('link','href','.css');
const jsBytes=initialJs.reduce((n,f)=>n+fs.statSync(f).size,0);
const cssBytes=initialCss.reduce((n,f)=>n+fs.statSync(f).size,0);
assert(initialJs.length<=36&&jsBytes<=1000000,`arranque JS demasiado pesado: ${initialJs.length} ficheiros / ${jsBytes} bytes`);
assert(initialCss.length<=24&&cssBytes<=260000,`arranque CSS demasiado pesado: ${initialCss.length} ficheiros / ${cssBytes} bytes`);

const staticMatch=sw.match(/const STATIC_ASSETS = (\[[\s\S]*?\]);/);assert(staticMatch,'STATIC_ASSETS deve existir');
const staticAssets=JSON.parse(staticMatch[1]);
assert(sw.includes("vg-operations-shell-v35-7"),'cache deve identificar V35.7');
assert(staticAssets.length<=65,`pre-cache inicial demasiado grande: ${staticAssets.length}`);
assert(staticAssets.includes('/assets/js/core/08-performance-loader-v35_7.js'),'loader deve estar disponível offline no shell');
for(const rel of ['hotel-360-v30.js','revenue-hub-v30.js','operations-domains-v33.js','city-ledger-v32.js','document-management-v26.js'])
  assert(!staticAssets.some(x=>x.endsWith('/'+rel)),`${rel} deve ser cacheado apenas quando usado`);

for(const token of ['idbReadSessionSnapshot','idbCacheSnapshotSilent','idbAutoCacheScope','auto-v357::','localSavedAt','background:true',"sharedGet('meta')"])
  assert(persistence.includes(token),`cache local-first/meta-check em falta: ${token}`);
assert(persistence.includes('IG_SNAPSHOTS:')&&persistence.includes('RD_STORE:')&&persistence.includes('HOTEIS_XLSX:'),'cache local deve conservar datasets secundários');
assert(!/DOMContentLoaded[\s\S]{0,500}idbAutoRestore\(\)/.test(bootstrap),'bootstrap não deve disparar um segundo auto-restauro');
assert(!html.includes('restore-after-auth.js'),'restauro duplicado pós-auth não deve voltar ao HTML');
assert(shell.includes('ensureAndRender')&&shell.includes("ensureView?.(view)"),'router V30 deve renderizar módulos apenas depois do lazy-load terminar');

for(const f of ['assets/js/core/08-performance-loader-v35_7.js','assets/js/core/02-navigation-kpis.js','assets/js/core/03-persistence-sharing.js','assets/js/core/04-bootstrap.js','assets/js/ui/global-search.js','assets/js/ui/vg-operations-2-v30.js','service-worker.js'])
  cp.execFileSync(process.execPath,['--check',path.join(ROOT,f)],{stdio:'pipe'});
const ficha=fs.readFileSync(path.join(ROOT,'assets/js/modules/ficha-hotel.js'));
assert.strictEqual(crypto.createHash('sha256').update(ficha).digest('hex'),'2779d6f5cbfcedb672f037494ee54847a16aec2247f5a0594346e3e6c4963dc7','Ficha do Hotel protegida não pode mudar');
console.log(`✓ V35.7 Performance: ${initialJs.length} JS/${Math.round(jsBytes/1024)} KB, ${initialCss.length} CSS/${Math.round(cssBytes/1024)} KB, ${staticAssets.length} assets no pre-cache`);
