const assert = require('assert');
const { createSandbox, load } = require('./helpers/browser-sandbox');

(async()=>{
  const s=createSandbox();
  let token='';
  let calls=0;
  let active=0;
  let maxActive=0;

  s.window.vgAuthToken=()=>token;
  s.window.idbAutoRestore=async()=>{
    calls++;
    active++;
    maxActive=Math.max(maxActive,active);
    await new Promise(r=>setTimeout(r,15));
    active--;
    return calls;
  };

  load('assets/js/core/00-runtime.js',s);

  const critical=[
    'resumo','hotel360','actions','approvals','cityledger','messages',
    'complaints','refunds','unbilled','budgets','energy','hrbalances',
    'lostfound','documents','datacenter','governance','backup','upload'
  ];
  critical.forEach(id=>assert.strictEqual(s.window.VG.routes.isKnown(id),true,`rota ${id} deve ser conhecida`));
  assert.strictEqual(s.window.VG.routes.canonical('recdet'),'receitasdet');
  assert.strictEqual(s.window.VG.routes.canonical('revenueint'),'revenuehub');
  assert.strictEqual(s.window.VG.routes.canonical('#kpis'),'resumo');
  assert.strictEqual(s.window.VG.routes.isKnown('rota-inexistente'),false);

  assert.strictEqual(s.window.VG.startup.installRestoreCoordinator(),true);

  await Promise.all([s.window.idbAutoRestore(),s.window.idbAutoRestore()]);
  assert.strictEqual(calls,1,'fase local deve executar uma única vez');
  assert.strictEqual(s.window.VG.startup.status.local,'done');

  token='token-A';
  await Promise.all([s.window.idbAutoRestore(),s.window.idbAutoRestore()]);
  assert.strictEqual(calls,2,'fase autenticada deve executar uma única vez');
  assert.strictEqual(s.window.VG.startup.status.authenticated,'done');

  // Nova conta/sessão: um token diferente tem de permitir nova sincronização.
  token='token-B';
  await Promise.all([s.window.idbAutoRestore(),s.window.idbAutoRestore()]);
  assert.strictEqual(calls,3,'nova sessão autenticada deve voltar a sincronizar uma vez');
  assert.strictEqual(s.window.VG.startup.status.authenticated,'done');
  assert.strictEqual(maxActive,1,'restauros de fases/sessões diferentes nunca podem concorrer');

  console.log('✓ P0 runtime: rotas canónicas e restauro coordenado por fase/sessão');
})().catch(err=>{console.error(err.stack||err);process.exit(1);});
