const assert=require('assert');const fs=require('fs');const path=require('path');const cp=require('child_process');const ROOT=path.resolve(__dirname,'..');
const front=path.join(ROOT,'assets/js/modules/workflow-approvals-v36.js'),back=path.join(ROOT,'netlify/functions/process-workflow-v36.js'),boot=path.join(ROOT,'assets/js/core/04-bootstrap.js');
for(const f of [front,back,boot])assert(fs.existsSync(f),'Ficheiro em falta: '+f);
for(const f of [front,back]){const r=cp.spawnSync(process.execPath,['--check',f],{encoding:'utf8'});assert.strictEqual(r.status,0,`Sintaxe inválida em ${path.basename(f)}: ${r.stderr}`)}
const F=fs.readFileSync(front,'utf8'),B=fs.readFileSync(back,'utf8'),S=fs.readFileSync(boot,'utf8');
assert(F.includes("version:36"),'frontend deve assumir Workflow V36');
for(const x of ['complaint','refund','budget']){assert(F.includes(x),`frontend sem tipo ${x}`);assert(B.includes(x),`backend sem tipo ${x}`)}
for(const x of ['A aguardar DO','Esclarecimentos solicitados','A aguardar DAF','Adjudicado','Resposta ao cliente'])assert(B.includes(x),'estado operacional em falta: '+x);
for(const a of ["action==='message'","action==='submit'","action==='decision'","action==='state'","action==='archive'","action==='upload'"])assert(B.includes(a),'ação backend em falta: '+a);
assert(B.includes("if(!isDO(u))return forbid"),'decisão deve ser exclusiva da DO');
assert(B.includes('canHotel(u,r.hotel)'),'backend deve aplicar âmbito de hotel');
assert(B.includes("ps.length<3||ps.length>4"),'orçamento deve exigir 3–4 propostas');
assert(F.includes('Conversa do processo'),'frontend deve apresentar thread');
assert(F.includes('Histórico técnico'),'frontend deve separar histórico técnico');
assert(F.includes('data-decision="clarify"'),'DO deve poder pedir esclarecimentos');
assert(S.includes('workflow-approvals-v36.js'),'bootstrap deve carregar Workflow V36');
console.log('✓ workflow V36: motor único, conversa, decisão DO, estados por tipo, anexos e arquivo');