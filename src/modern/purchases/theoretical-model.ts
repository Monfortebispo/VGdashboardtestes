export interface TheoryIngredientSource {ingredient?:unknown;unit?:unknown;qty?:unknown;cost?:unknown;}
export interface TheoryRecipe {id?:unknown;name?:unknown;cost?:unknown;ingredients?:TheoryIngredientSource[];}
export interface TheoryMatchedRow {hotel?:unknown;pdv?:unknown;art?:unknown;artigo?:unknown;qtd?:unknown;vn?:unknown;cost?:unknown;match?:unknown;recipe?:TheoryRecipe;}
export interface TheoryUnmatchedRow {hotel?:unknown;armazem?:unknown;pdv?:unknown;artigo?:unknown;art?:unknown;grupo?:unknown;qtd?:unknown;vn?:unknown;}
export interface TheoryRawData {matched?:TheoryMatchedRow[];unmatched?:TheoryUnmatchedRow[];ingredients?:unknown[];}
export interface TheoryIngredient {ingredient:string;unit:string;qty:number;cost:number;knownCost:boolean;}
export interface TheoryViewModel {
  selectedHotel:string;
  hotels:string[];
  matched:TheoryMatchedRow[];
  unmatched:TheoryUnmatchedRow[];
  ingredients:TheoryIngredient[];
  totals:{quantity:number;revenue:number;cost:number;matchedLines:number;unmatchedLines:number};
  hasSource:boolean;
}

const text=(v:unknown)=>String(v??'').trim();
const n=(v:unknown)=>{const x=Number(v);return Number.isFinite(x)?x:0;};
const norm=(v:unknown)=>text(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]+/g,' ').replace(/\s+/g,' ').trim();
function validIngredient(x:TheoryIngredientSource):boolean{
  const name=norm(x.ingredient),unit=norm(x.unit);
  if(!name||/^\d+(?:[.,]\d+)?$/.test(name))return false;
  if(['A COMPOSICAO','COMPOSICAO','OS INGREDIENTES','INGREDIENTES','INGREDIENTE','QT','QTD','QUANTIDADE'].includes(name))return false;
  if(['ADICIONAR','DECORAR','ACAO','ACCAO'].includes(unit))return false;
  return true;
}
export function buildTheoryViewModel(raw:TheoryRawData|null|undefined,selectedHotel='__all',canonical:(v:unknown)=>string=text,dashboardHotels:string[]=[]):TheoryViewModel{
  const matched=Array.isArray(raw?.matched)?raw!.matched!:[],unmatched=Array.isArray(raw?.unmatched)?raw!.unmatched!:[];
  const hotelSet=new Set<string>();
  for(const row of [...matched,...unmatched]){const h=canonical(row.hotel);if(h)hotelSet.add(h);}
  if(!hotelSet.size)for(const h of dashboardHotels){const c=canonical(h);if(c)hotelSet.add(c);}
  const hotels=[...hotelSet].sort((a,b)=>a.localeCompare(b,'pt'));
  const selected=selectedHotel!=='__all'&&hotels.includes(selectedHotel)?selectedHotel:'__all';
  const accepts=(row:{hotel?:unknown})=>selected==='__all'||canonical(row.hotel)===selected;
  const filteredMatched=matched.filter(accepts).slice().sort((a,b)=>n(b.vn)-n(a.vn));
  const filteredUnmatched=unmatched.filter(accepts);
  const ingredientMap=new Map<string,TheoryIngredient>();
  for(const row of filteredMatched){
    const sold=n(row.qtd);
    for(const src of row.recipe?.ingredients||[]){
      if(!validIngredient(src))continue;
      const ingredient=text(src.ingredient),unit=text(src.unit),key=norm(ingredient)+'|'+norm(unit);
      const cur=ingredientMap.get(key)||{ingredient,unit,qty:0,cost:0,knownCost:false};
      cur.qty+=n(src.qty)*sold;
      const unitCost=Number(src.cost);if(Number.isFinite(unitCost)){cur.cost+=unitCost*sold;cur.knownCost=true;}
      ingredientMap.set(key,cur);
    }
  }
  const ingredients=[...ingredientMap.values()].sort((a,b)=>Math.abs(b.cost)-Math.abs(a.cost)||b.qty-a.qty);
  return{
    selectedHotel:selected,hotels,matched:filteredMatched,unmatched:filteredUnmatched,ingredients,
    totals:{quantity:filteredMatched.reduce((s,x)=>s+n(x.qtd),0),revenue:filteredMatched.reduce((s,x)=>s+n(x.vn),0),cost:filteredMatched.reduce((s,x)=>s+n(x.cost),0),matchedLines:filteredMatched.length,unmatchedLines:filteredUnmatched.length},
    hasSource:matched.length+unmatched.length>0
  };
}
