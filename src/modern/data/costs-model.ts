export interface CostRecord {
  hotel:string;
  category:string;
  period:string;
  value:number;
}

export interface CostsSourceSnapshot {
  records:CostRecord[];
  stats:{records:number;hotels:number;categories:number;periods:number;available:boolean};
}

const COST_HINTS=['custo','cost','gasto','despesa','energia','agua','água','pessoal','staff','salario','salário','compras','f&b','alimentacao','alimentação','comida','bebida','lavandaria','manutencao','manutenção'];
const IGNORE_HINTS=['receita','revenue','venda','vendas','ocupacao','ocupação','roomnight','room night','quartos vendidos'];

function norm(v:string):string{return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();}
function looksCost(path:string[]):boolean{
  const text=norm(path.join(' '));
  if(IGNORE_HINTS.some(x=>text.includes(norm(x))))return false;
  return COST_HINTS.some(x=>text.includes(norm(x)));
}
function periodFrom(path:string[]):string{
  for(let i=path.length-1;i>=0;i--){
    const p=String(path[i]);
    if(/^(20\d{2})([-_/ ]?(0?[1-9]|1[0-2]))?$/.test(p)||/^(jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)/i.test(p))return p;
  }
  return 'Atual';
}
function hotelFrom(path:string[]):string{
  if(path.length<2)return 'Global';
  const structural=new Set(['raw','hotels','hotel','costs','custos','data','values','metrics','kpis']);
  for(const p of path){const n=norm(p);if(p&&p.length>2&&!structural.has(n)&&!looksCost([p])&&!/^20\d{2}/.test(p))return p;}
  return 'Global';
}
function categoryFrom(path:string[]):string{
  const candidates=path.filter(p=>looksCost([p]));
  return candidates[candidates.length-1]||path[path.length-1]||'Custos';
}
export function normalizeCosts(value:unknown):CostRecord[]{
  const out:CostRecord[]=[];const seen=new Set<string>();
  function walk(node:unknown,path:string[],depth:number){
    if(depth>8||node==null)return;
    if(typeof node==='number'&&Number.isFinite(node)&&looksCost(path)){
      const rec={hotel:hotelFrom(path),category:categoryFrom(path),period:periodFrom(path),value:node};
      const key=`${rec.hotel}|${rec.category}|${rec.period}|${rec.value}`;
      if(!seen.has(key)){seen.add(key);out.push(rec);}return;
    }
    if(typeof node==='string'){
      const cleaned=node.replace(/\s/g,'').replace(/\.(?=\d{3}(?:\D|$))/g,'').replace(',','.');
      const n=Number(cleaned);if(Number.isFinite(n)&&node.trim()!==''&&looksCost(path))walk(n,path,depth+1);return;
    }
    if(Array.isArray(node)){node.forEach((item,i)=>walk(item,[...path,String(i+1)],depth+1));return;}
    if(typeof node==='object')Object.entries(node as Record<string,unknown>).forEach(([k,v])=>walk(v,[...path,k],depth+1));
  }
  walk(value,[],0);
  return out.sort((a,b)=>a.hotel.localeCompare(b.hotel,'pt')||a.category.localeCompare(b.category,'pt')||a.period.localeCompare(b.period,'pt'));
}
export function costsSnapshot(value:unknown):CostsSourceSnapshot{
  const records=normalizeCosts(value);
  return {records,stats:{records:records.length,hotels:new Set(records.map(r=>r.hotel)).size,categories:new Set(records.map(r=>r.category)).size,periods:new Set(records.map(r=>r.period)).size,available:records.length>0}};
}
