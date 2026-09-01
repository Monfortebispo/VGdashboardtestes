const fs=require('fs');
const path=require('path');

const indexPath=path.join(path.resolve(__dirname,'..'),'index.html');
let html=fs.readFileSync(indexPath,'utf8');

const authTag='<script id="vg-auth-script" src="assets/js/auth/auth-client.js" defer></script>';

if(!html.includes(authTag)){
  console.log('Auth tag not found or already prioritized.');
  process.exit(0);
}

html=html.replace(authTag,'');

if(!html.includes('<body>')) throw new Error('index.html sem <body>');
html=html.replace('<body>',`<body>\n<!-- VG LOGIN CRITICAL PATH: authentication must initialize before operational deferred modules -->\n${authTag}`);

fs.writeFileSync(indexPath,html,'utf8');
console.log('✓ Auth client moved to the first deferred script in body');
