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

// O backend histórico continua disponível para processos V27 já existentes.
assert(server.includes('APPROVAL_PREFIX = "ops-approval/"'),'backend legado de aprovações deve continuar disponível');
assert(server.includes('resource === "ops-approval-save"'),'endpoint legado de gravação deve ser preservado');
assert(server.includes('resource === "ops-approval-decide"'),'endpoint legado de decisão deve ser preservado');

// Mas o frontend V27 já não pode controlar a página nem os aliases globais.
assert(legacy.includes('approvalsLegacy'),'V27 deve identificar-se apenas como compatibilidade legada');
assert(legacy.includes('disabled:true'),'V27 deve estar explicitamente desativado como renderer');
assert(!legacy.includes('window.VG.approvals={version:27'),'V27 não pode voltar a assumir window.VG.approvals');
assert(!legacy.includes('window.approvalsRender=renderPage'),'V27 não pode voltar a assumir approvalsRender');
assert(!legacy.includes('V27 · Governação de decisões'),'interface V27 não deve voltar a ser renderizada');

assert(v36.includes('window.VG.approvals={version:36'),'V36 deve ser o proprietário do Workflow de Aprovações');
console.log('✓ workflow V27: backend histórico preservado e renderer legado desativado a favor do V36');
