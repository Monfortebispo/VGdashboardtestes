const assert=require('assert');
const fs=require('fs');
const path=require('path');
const cp=require('child_process');
const ROOT=path.resolve(__dirname,'..');

const legacyPath=path.join(ROOT,'assets/js/modules/workflow-approvals-v27.js');
const v36Path=path.join(ROOT,'assets/js/modules/workflow-approvals-v36.js');
const serverPath=path.join(ROOT,'netlify/functions/dashboard-sessao.js');
const legacy=fs.readFileSync(legacyPath,'utf8');
const v36=fs.readFileSync(v36Path,'utf8');
const server=fs.readFileSync(serverPath,'utf8');

for(const f of [legacyPath,v36Path,serverPath]){
  const r=cp.spawnSync(process.execPath,['--check',f],{encoding:'utf8'});
  assert.strictEqual(r.status,0,`Sintaxe inválida em ${path.basename(f)}: ${r.stderr}`);
}

assert(server.includes('APPROVAL_PREFIX = "ops-approval/"'),'backend legado de aprovações deve continuar disponível');
assert(server.includes('resource === "ops-approval-save"'),'endpoint legado de gravação deve ser preservado');
assert(server.includes('resource === "ops-approval-decide"'),'endpoint legado de decisão deve ser preservado');

// V27 mantém API de leitura/compatibilidade, mas nunca renderiza a página.
assert(legacy.includes('approvalsLegacy'),'V27 deve identificar a compatibilidade legada');
assert(legacy.includes('disabledRenderer:true'),'renderer V27 deve estar explicitamente desativado');
assert(legacy.includes('searchItems'),'API histórica de pesquisa deve continuar disponível');
assert(legacy.includes('ensureLoaded'),'API histórica de carregamento deve continuar disponível');
assert(legacy.includes('version:27'),'compatibilidade deve conservar a versão 27 para consumidores antigos');
assert(!legacy.includes('window.approvalsRender=renderPage'),'V27 não pode assumir approvalsRender');
assert(!legacy.includes('V27 · Governação de decisões'),'interface V27 não deve voltar a ser desenhada');
assert(v36.includes('window.VG.approvals={version:36'),'V36 deve substituir a API transitória e ser o proprietário final do Workflow');
console.log('✓ workflow V27: API histórica preservada sem renderer; V36 mantém a interface');
