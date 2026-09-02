const fs=require('fs');
const path=require('path');

const file=path.resolve(process.cwd(),'index.html');
const marker='<!-- VG CENTRAL OPERATIONS HOME CLEANUP V50 -->';
if(!fs.existsSync(file))process.exit(0);
let html=fs.readFileSync(file,'utf8');
if(html.includes(marker))process.exit(0);
const injection=`\n${marker}\n<script src="assets/js/ui/central-operations-home-cleanup-v50.js" defer></script>\n`;
html=html.includes('</body>')?html.replace('</body>',injection+'</body>'):html+injection;
fs.writeFileSync(file,html);
