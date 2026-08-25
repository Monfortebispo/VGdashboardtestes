import { currentReputationData } from '../data/reputation-service';
import { reputationTopLevelKeys } from '../data/reputation-model';

export function renderReputationReadOnly(root:HTMLElement):HTMLElement {
  const source=currentReputationData();
  let host=root.querySelector<HTMLElement>('[data-modern-reputation-readonly]');
  if(!host){
    host=document.createElement('section');
    host.dataset.modernReputationReadonly='true';
    root.appendChild(host);
  }

  const title=document.createElement('h2');
  title.textContent='Reputação';

  if(!source?.stats.available){
    const empty=document.createElement('p');
    empty.textContent='Sem dados de reputação disponíveis.';
    host.replaceChildren(title,empty);
    return host;
  }

  const summary=document.createElement('p');
  summary.textContent=`${source.stats.records} registos disponíveis na fonte seletiva.`;

  const keys=reputationTopLevelKeys(source.data);
  const detail=document.createElement('p');
  detail.textContent=keys.length?`Blocos de dados: ${keys.join(', ')}`:'Fonte de reputação disponível.';

  host.replaceChildren(title,summary,detail);
  return host;
}

export function clearReputationReadOnly(root:HTMLElement):void {
  root.querySelector('[data-modern-reputation-readonly]')?.remove();
}
