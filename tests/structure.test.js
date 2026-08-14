const assert = require('assert');
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const { ROOT } = require('./helpers/browser-sandbox');

const htmlPath = path.join(ROOT,'index.html');
const html = fs.readFileSync(htmlPath,'utf8');

assert(!/<style(?:\s|>)/i.test(html),'index.html não deve voltar a conter CSS inline');
const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
assert(scripts.every(m => /\bsrc\s*=/.test(m[1])),'index.html não deve conter JavaScript funcional inline');
assert(!fs.existsSync(path.join(ROOT,'assets/js/fixes')),'a pasta histórica fixes não deve regressar');
assert(html.includes('id="opsCenter"'),'o Resumo deve conter a Central de Operações v8');
assert(html.includes('assets/js/ui/operations-center.js'),'o módulo da Central de Operações deve estar ligado ao HTML');
assert(html.includes('assets/css/operations-center.css'),'o CSS da Central de Operações deve estar ligado ao HTML');
assert(html.includes('assets/js/modules/actions-management.js'),'o módulo de gestão de ações v8 deve estar ligado ao HTML');
assert(html.includes('assets/css/actions-management.css'),'o CSS de gestão de ações v8 deve estar ligado ao HTML');
assert(html.includes('id="opsActionModal"')&&html.includes('id="opsActionsModal"'),'os modais de ações v8 devem existir');
assert(html.includes('id="opsActionStats"')&&html.includes('id="opsActionWatch"'),'a Central deve expor acompanhamento de ações');

const refs = [];
for (const m of html.matchAll(/(?:src|href)=["']([^"']+)["']/gi)) {
  const ref = m[1];
  if (/^(?:https?:|data:|mailto:|#|\/\/)/i.test(ref)) continue;
  if (ref.startsWith('/.netlify/')) continue;
  refs.push(ref.split(/[?#]/)[0]);
}
const missing = [...new Set(refs)].filter(ref => !fs.existsSync(path.join(ROOT,ref)));
assert.deepStrictEqual(missing,[],`Recursos locais em falta: ${missing.join(', ')}`);

const runtimePos = html.indexOf('assets/js/core/00-runtime.js');
const navPos = html.indexOf('assets/js/core/02-navigation-kpis.js');
const persistencePos = html.indexOf('assets/js/core/03-persistence-sharing.js');
assert(runtimePos >= 0 && runtimePos < navPos && runtimePos < persistencePos,'runtime deve carregar antes dos módulos principais');

const clientText = [html, ...walk(path.join(ROOT,'assets/js')).map(f => fs.readFileSync(f,'utf8'))].join('\n');
assert(!/140605/.test(clientText),'senha fixa histórica não pode regressar ao cliente');
assert(!/passwordHash|passwordSalt|SEED_USERS/.test(clientText),'hashes/salts/seed users não podem ser expostos no cliente');
assert(!/assets\/js\/fixes|v17-clean|forecast-warning|navigation-safe-v20/i.test(clientText),'patches históricos não podem regressar');

const jsFiles = [...walk(path.join(ROOT,'assets/js')), path.join(ROOT,'netlify/functions/dashboard-sessao.js')];
for (const file of jsFiles) {
  cp.execFileSync(process.execPath,['--check',file],{stdio:'pipe'});
}

function walk(dir){
  if (!fs.existsSync(dir)) return [];
  const out=[];
  for (const name of fs.readdirSync(dir)) {
    const p=path.join(dir,name), st=fs.statSync(p);
    if(st.isDirectory()) out.push(...walk(p)); else if(p.endsWith('.js')) out.push(p);
  }
  return out;
}

console.log(`✓ estrutura: ${refs.length} referências locais e ${jsFiles.length} ficheiros JS validados`);
