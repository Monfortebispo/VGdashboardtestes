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

// No artefacto de Deploy Preview, a Reputação legacy nunca é pintada. Isto não
// depende de ?modern=1, do clique, do hash nem da velocidade de montagem do módulo.
// A vista antiga só é libertada explicitamente se o módulo moderno falhar.
const reputationPrehide=`\n<!-- VG REPUTATION PREPAINT GUARD -->\n<style>\nhtml.vg-reputation-modern-preview #view-reputacao > :not([data-modern-reputation-readonly]):not([data-modern-reputation-preview-pending]){display:none!important}\nhtml.vg-reputation-modern-preview.vg-modern-reputation-fallback #view-reputacao > :not([data-modern-reputation-readonly]):not([data-modern-reputation-preview-pending]){display:revert!important}\n</style>\n<script>\ndocument.documentElement.classList.add('vg-reputation-modern-preview');\n</script>\n`;

if(!html.includes('</head>'))throw new Error('index.html sem </head>');
html=html.replace('</head>',`${reputationPrehide}</head>`);

const injection=`\n${marker}\n<script src="assets/js/modules/occupancy-modern-bridge-v40.js"></script>\n<script src="assets/js/modules/reputation-modern-bridge-v40.js"></script>\n<script src="assets/js/modules/revenue-modern-bridge-v40.js"></script>\n<script src="assets/js/modules/portfolio-modern-bridge-v40.js"></script>\n<script type="module" src="/dist-modern/assets/modern-main.js"></script>\n<script src="assets/js/ui/modern-preview-bootstrap.js" defer></script>\n<script src="assets/js/ui/reputation-modern-preview-v46.js" defer></script>\n<script src="assets/js/ui/ab-integration-stability-v40.js" defer></script>\n<script src="assets/js/modules/theoretical-consumption-fix-v40.js" defer></script>\n<script src="assets/js/modules/city-ledger-panorama-v40.js" defer></script>\n<script src="assets/js/modules/city-ledger-panorama-enhancements-v42.js" defer></script>\n<script src="assets/js/modules/city-ledger-upload-center-v42.js" defer></script>\n<script src="assets/js/ui/sidebar-governance-v43.js" defer></script>\n`;

if(!html.includes('</body>'))throw new Error('index.html sem </body>');
html=html.replace('</body>',`${injection}</body>`);
fs.writeFileSync(indexPath,html,'utf8');
console.log('✓ Deploy Preview moderno injetado apenas no artefacto de build');
