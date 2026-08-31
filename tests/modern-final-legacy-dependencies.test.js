const fs=require('fs');
const path=require('path');
const assert=require('assert');

const ROOT=path.join(__dirname,'..');
const MODULES=path.join(ROOT,'src/modern/modules');
const files=fs.readdirSync(MODULES).filter(name=>name.endsWith('.ts')).sort();
const violations=[];

for(const file of files){
  const source=fs.readFileSync(path.join(MODULES,file),'utf8');
  const forbidden=[
    ['RAW global',/\bRAW\b/],
    ['refreshAll',/\brefreshAll\s*\(/],
    ['setView',/\bsetView\s*\(/],
    ['buildKPIs',/\bbuildKPIs\s*\(/],
    ['buildChartsReceitas',/\bbuildChartsReceitas\s*\(/],
    ['buildRevTable',/\bbuildRevTable\s*\(/],
    ['updateContextPanel',/\bupdateContextPanel\s*\(/]
  ];
  for(const [label,re] of forbidden)if(re.test(source))violations.push(`${file}: ${label}`);
}

assert.deepStrictEqual(violations,[],`Dependências legacy diretas ainda presentes nos módulos modernos:\n${violations.join('\n')}`);

const usali=fs.readFileSync(path.join(MODULES,'pl-usali.ts'),'utf8');
assert(usali.includes('plRender?.()'),'USALI mantém temporariamente apenas o renderer visual legacy validado');
const purchases=fs.readFileSync(path.join(MODULES,'purchases.ts'),'utf8');
assert(purchases.includes('comprasNative35'),'A&B mantém apenas o módulo nativo Shadow DOM como fronteira explícita de compatibilidade');

console.log(`✓ auditoria final: ${files.length} módulos modernos sem RAW/refreshAll/setView/renderers financeiros legacy diretos`);
