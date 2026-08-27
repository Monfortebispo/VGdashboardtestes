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

const injection=`\n${marker}\n<script src="assets/js/modules/occupancy-modern-bridge-v40.js"></script>\n<script src="assets/js/modules/reputation-modern-bridge-v40.js"></script>\n<script src="assets/js/modules/revenue-modern-bridge-v40.js"></script>\n<script src="assets/js/modules/portfolio-modern-bridge-v40.js"></script>\n<script type="module" src="/dist-modern/assets/modern-main.js"></script>\n<script src="assets/js/ui/modern-preview-bootstrap.js" defer></script>\n<script src="assets/js/ui/ab-integration-stability-v40.js" defer></script>\n<script src="assets/js/modules/theoretical-consumption-fix-v40.js" defer></script>\n<script src="assets/js/modules/city-ledger-panorama-v40.js" defer></script>\n<script src="assets/js/modules/city-ledger-panorama-enhancements-v42.js" defer></script>\n<script src="assets/js/modules/city-ledger-upload-center-v42.js" defer></script>\n<script src="assets/js/ui/sidebar-governance-v43.js" defer></script>\n`;

if(!html.includes('</body>'))throw new Error('index.html sem </body>');
html=html.replace('</body>',`${injection}</body>`);
fs.writeFileSync(indexPath,html,'utf8');
console.log('✓ Deploy Preview moderno injetado apenas no artefacto de build');
