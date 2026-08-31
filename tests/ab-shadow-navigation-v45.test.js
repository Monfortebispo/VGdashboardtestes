const fs=require('fs');
const path=require('path');
const assert=require('assert');

const file=path.join(__dirname,'..','assets','js','ui','ab-integration-stability-v40.js');
const src=fs.readFileSync(file,'utf8');

assert(src.includes('__VG_AB_INTEGRATION_STABILITY_V45__'),'A&B integration V45 marker missing');
assert(src.includes("new MouseEvent('click'"),'A&B navigation must originate from a native shadow click');
assert(src.includes('composed:false'),'A&B native navigation must stay inside the ShadowRoot');
assert(src.includes("if(typeof window.setView==='function')window.setView(v,btn)"),'Private dispatcher fallback must target native setView');
assert(!src.includes("if(typeof window.renderView==='function')window.renderView(v)"),'A&B must not use generic renderView fallback');
assert(src.includes("if(currentView(r)===v){syncSelector(r);return true;}"),'A&B navigation should be idempotent');

console.log('✓ A&B ShadowRoot navigation isolation');
