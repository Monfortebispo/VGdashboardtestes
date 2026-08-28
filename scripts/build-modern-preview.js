const fs=require('fs');
const path=require('path');

const root=path.resolve(__dirname,'..');
const indexPath=path.join(root,'index.html');
let html=fs.readFileSync(indexPath,'utf8');

const marker='<!-- VG MODERN DEPLOY PREVIEW -->';
if(html.includes(marker)){
  console.log('Modern preview already injected.');
  process.exit(0);
}

// Este guard é injetado no <head> (não no fim do body) para correr antes dos
// handlers legacy. Ao clicar em Reputação, a vista antiga fica invisível antes
// do browser poder pintar o primeiro frame; o módulo moderno assume de seguida.
const reputationPrehide=`\n<!-- VG REPUTATION PREPAINT GUARD -->\n<style>\n#view-reputacao.vg-modern-reputation-prehide > :not([data-modern-reputation-readonly]){visibility:hidden!important}\n</style>\n<script>\n(function(){\n  try{\n    if(new URLSearchParams(location.search).get('modern')!=='1')return;\n    function prehide(){var root=document.getElementById('view-reputacao');if(root)root.classList.add('vg-modern-reputation-prehide');}\n    document.addEventListener('pointerdown',function(e){var p=e.composedPath?e.composedPath():[];if(p.some(function(n){return n&&n.id==='nav-reputacao';}))prehide();},true);\n    document.addEventListener('click',function(e){var p=e.composedPath?e.composedPath():[];if(p.some(function(n){return n&&n.id==='nav-reputacao';}))prehide();},true);\n    if(location.hash.replace(/^#/,'')==='reputacao'){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',prehide,{once:true});else prehide();}\n  }catch(e){}\n})();\n</script>\n`;

if(!html.includes('</head>'))throw new Error('index.html sem </head>');
html=html.replace('</head>',`${reputationPrehide}</head>`);

const injection=`\n${marker}\n<script src="assets/js/modules/occupancy-modern-bridge-v40.js"></script>\n<script src="assets/js/modules/reputation-modern-bridge-v40.js"></script>\n<script src="assets/js/modules/revenue-modern-bridge-v40.js"></script>\n<script src="assets/js/modules/portfolio-modern-bridge-v40.js"></script>\n<script type="module" src="/dist-modern/assets/modern-main.js"></script>\n<script src="assets/js/ui/modern-preview-bootstrap.js" defer></script>\n<script src="assets/js/ui/reputation-modern-preview-v46.js" defer></script>\n<script src="assets/js/ui/ab-integration-stability-v40.js" defer></script>\n<script src="assets/js/modules/theoretical-consumption-fix-v40.js" defer></script>\n<script src="assets/js/modules/city-ledger-panorama-v40.js" defer></script>\n<script src="assets/js/modules/city-ledger-panorama-enhancements-v42.js" defer></script>\n<script src="assets/js/modules/city-ledger-upload-center-v42.js" defer></script>\n<script src="assets/js/ui/sidebar-governance-v43.js" defer></script>\n`;

if(!html.includes('</body>'))throw new Error('index.html sem </body>');
html=html.replace('</body>',`${injection}</body>`);
fs.writeFileSync(indexPath,html,'utf8');
console.log('✓ Deploy Preview moderno injetado apenas no artefacto de build');
