(function(){
  'use strict';
  const API_PART='/.netlify/functions/lost-found';
  const $=id=>document.getElementById(id);
  const toast=(m,bad)=>typeof window.showToast==='function'?window.showToast(m,!!bad):alert(m);

  function syncCommentField(){
    const detail=$('vlfDetail');
    const state=$('vlfState');
    if(!detail||!state||state.disabled)return;

    let field=$('vlfStatusCommentWrap');
    if(!field){
      field=document.createElement('div');
      field.id='vlfStatusCommentWrap';
      field.className='vlf-field';
      field.style.cssText='grid-column:1/-1;margin-top:7px';
      field.innerHTML='<label>Comentário da alteração de estado <span style="color:var(--neg,#c0392b)">*</span></label><textarea id="vlfStatusComment" rows="3" maxlength="800" placeholder="Indique obrigatoriamente o motivo, diligência ou resultado associado a esta alteração de estado."></textarea><div class="vlf-sub" style="margin-top:3px">Obrigatório sempre que o estado for alterado. Fica registado no histórico.</div>';
      const grid=state.closest('.vlf-formgrid');
      if(grid)grid.appendChild(field);
    }

    if(!state.dataset.vlfOriginalStatus){
      const pill=detail.querySelector('.vlf-pill');
      state.dataset.vlfOriginalStatus=(pill?.textContent||state.value||'').trim();
    }
    const changed=state.value!==state.dataset.vlfOriginalStatus;
    field.style.display=changed?'block':'none';
    const txt=$('vlfStatusComment');
    if(txt)txt.required=changed;
  }

  document.addEventListener('change',function(e){
    if(e.target&&e.target.id==='vlfState')syncCommentField();
  },true);

  document.addEventListener('click',function(e){
    const btn=e.target&&e.target.closest?e.target.closest('#vlfSave'):null;
    if(!btn)return;
    const state=$('vlfState');
    if(!state||state.disabled)return;
    syncCommentField();
    const changed=state.value!==state.dataset.vlfOriginalStatus;
    const comment=($('vlfStatusComment')?.value||'').trim();
    if(changed&&!comment){
      e.preventDefault();
      e.stopImmediatePropagation();
      toast('Para alterar o estado é obrigatório escrever um comentário.',true);
      $('vlfStatusComment')?.focus();
    }
  },true);

  const nativeFetch=window.fetch.bind(window);
  window.fetch=async function(input,init){
    try{
      const url=typeof input==='string'?input:(input&&input.url)||'';
      if(url.includes(API_PART)&&url.includes('action=update')&&init&&typeof init.body==='string'){
        const body=JSON.parse(init.body);
        const state=$('vlfState');
        const comment=($('vlfStatusComment')?.value||'').trim();
        if(state&&state.dataset.vlfOriginalStatus&&state.value!==state.dataset.vlfOriginalStatus){
          body.statusComment=comment;
          init=Object.assign({},init,{body:JSON.stringify(body)});
        }
      }
    }catch(e){}
    return nativeFetch(input,init);
  };

  const observer=new MutationObserver(()=>syncCommentField());
  function boot(){
    const root=$('view-lostfound')||document.body;
    observer.observe(root,{childList:true,subtree:true});
    syncCommentField();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
