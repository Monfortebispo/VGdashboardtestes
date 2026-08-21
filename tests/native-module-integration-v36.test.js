const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.join(__dirname,'..');
const boot=fs.readFileSync(path.join(root,'assets/js/core/04-bootstrap.js'),'utf8');
const early=fs.readFileSync(path.join(root,'assets/js/auth/early-login-v36.js'),'utf8');
const dynamic=fs.readFileSync(path.join(root,'assets/js/auth/menu-permissions-dynamic-fix-v36.js'),'utf8');
const catalog=fs.readFileSync(path.join(root,'assets/js/auth/operations-modules-catalog-v36.js'),'utf8');
const refunds=fs.readFileSync(path.join(root,'assets/js/modules/refunds-v36.js'),'utf8');
const unbilled=fs.readFileSync(path.join(root,'assets/js/modules/unbilled-v36.js'),'utf8');
new Function(early);new Function(dynamic);new Function(catalog);new Function(refunds);new Function(unbilled);
for(const m of ['refunds','unbilled']){
  assert(boot.includes(`data-vg-module=\"${m}`)||boot.includes(`data-vg-module="${m}`)||boot.includes(`'${m}'`),`${m}: script deve estar no bootstrap`);
  assert(boot.includes(`'${m}'`),`${m}: deve estar em validViews`);
  const src=m==='refunds'?refunds:unbilled;
  assert(src.includes(`nav-${m}`),`${m}: deve criar botão de menu`);
  assert(catalog.includes(`'${m}'`),`${m}: deve estar disponível no Setup`);
}
assert(early.includes('menu-permissions-dynamic-fix-v36.js'),'arranque deve carregar sincronização central de menus');
assert(early.includes('operations-modules-catalog-v36.js'),'arranque deve carregar catálogo operacional de permissões');
assert(dynamic.includes("el.style.display=''"),'sincronizador deve voltar a mostrar módulos autorizados após login');
console.log('✓ Integração nativa: menu, vista, permissões e sincronização pós-login validadas.');
