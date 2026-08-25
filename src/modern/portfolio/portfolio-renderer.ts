import { currentPortfolioData } from '../data/portfolio-service';
import type { PortfolioSelection } from './portfolio-state';

function preview(value:unknown):string{
  try{
    const text=JSON.stringify(value,null,2);
    return text.length>6000?`${text.slice(0,6000)}\n…`:text;
  }catch(e){return String(value??'');}
}

export function renderPortfolioReadOnly(root:HTMLElement,selection:Readonly<PortfolioSelection>):HTMLElement{
  const source=currentPortfolioData();
  let host=root.querySelector<HTMLElement>('[data-modern-portfolio-readonly]');
  if(!host){
    host=document.createElement('section');
    host.dataset.modernPortfolioReadonly='true';
    root.appendChild(host);
  }

  const title=document.createElement('h2');
  title.textContent='Resumo / Portefólio';

  const meta=document.createElement('p');
  if(!source?.stats.available){
    meta.textContent='Sem fonte moderna de Portefólio disponível.';
    host.replaceChildren(title,meta);
    return host;
  }
  meta.textContent=`Âmbito: ${selection.geography} · Hotel: ${selection.hotel} · Período: ${selection.period} · ${source.stats.sections} secções · ~${source.stats.approxRecords} registos`;

  const pre=document.createElement('pre');
  pre.dataset.modernPortfolioPreview='true';
  pre.textContent=preview(source.data);

  host.replaceChildren(title,meta,pre);
  return host;
}

export function clearPortfolioReadOnly(root:HTMLElement):void{
  root.querySelector('[data-modern-portfolio-readonly]')?.remove();
}
