const assert=require('assert');const fs=require('fs');const path=require('path');const cp=require('child_process');const ROOT=path.resolve(__dirname,'..');
const front=path.join(ROOT,'assets/js/modules/workflow-approvals-v36.js'),back=path.join(ROOT,'netlify/functions/process-workflow-v36.js'),boot=path.join(ROOT,'assets/js/core/04-bootstrap.js'),legacy=path.join(ROOT,'assets/js/modules/workflow-approvals-v27.js');
for(const f of [front,back,boot,legacy])assert(fs.existsSync(f),'Ficheiro em falta: '+f);
for(const f of [front,back,boot,legacy]){const r=cp.spawnSync(process.execPath,['--check',f],{encoding:'utf8'});assert.strictEqual(r.status,0,`Sintaxe inválida em ${path.basename(f)}: ${r.stderr}`)}
const F=fs.readFileSync(front,'utf8'),B=fs.readFileSync(back,'utf8'),S=fs.readFileSync(boot,'utf8'),L=fs.readFileSync(legacy,'utf8');
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
assert(S.includes("'approvals'"),'approvals deve ser uma vista válida no routing do bootstrap');
assert(S.includes("w.onload=()=>"),'bootstrap deve re-renderizar V36 quando o módulo termina de carregar');
assert(L.includes('approvalsLegacy')&&L.includes('disabled:true'),'V27 deve estar apenas em modo legado');
assert(!L.includes('window.VG.approvals={version:27'),'V27 não pode sobrescrever V36');
console.log('✓ workflow V36: renderer único, motor operacional, conversa, decisão DO, estados, anexos, routing e arquivo');
