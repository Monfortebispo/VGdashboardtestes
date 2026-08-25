import { currentRevenueData } from '../data/revenue-service';

export function renderRevenueReadOnly(root:HTMLElement):HTMLElement{
  const source=currentRevenueData();
  let host=root.querySelector<HTMLElement>('[data-modern-revenue-readonly]');
  if(!host){
    host=document.createElement('section');
    host.dataset.modernRevenueReadonly='true';
    root.appendChild(host);
  }

  const title=document.createElement('h2');
  title.textContent='Revenue & Forecast';

  const summary=document.createElement('p');
  if(!source||!source.stats.available){
    summary.textContent='Sem dados de Revenue disponíveis.';
    host.replaceChildren(title,summary);
    return host;
  }

  summary.textContent=`Fonte disponível · ${source.stats.records} bloco${source.stats.records===1?'':'s'} de dados`;

  const details=document.createElement('pre');
  details.dataset.modernRevenuePreview='true';
  try{
    const text=JSON.stringify(source.data,null,2);
    details.textContent=text.length>6000?`${text.slice(0,6000)}\n…`:text;
  }catch(e){
    details.textContent='Dados disponíveis, mas não foi possível gerar pré-visualização.';
  }

  host.replaceChildren(title,summary,details);
  return host;
}

export function clearRevenueReadOnly(root:HTMLElement):void{
  root.querySelector('[data-modern-revenue-readonly]')?.remove();
}
