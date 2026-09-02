(function(){
  'use strict';
  if(window.__VG_CENTRAL_HOME_CLEANUP_V50__) return;
  window.__VG_CENTRAL_HOME_CLEANUP_V50__=true;

  function apply(){
    document.querySelectorAll('.v33-integrated-launcher').forEach(function(el){
      el.style.display='none';
      el.setAttribute('aria-hidden','true');
    });

    document.querySelectorAll('.v30-profile-home.direction').forEach(function(el){
      el.style.display='none';
      el.setAttribute('aria-hidden','true');
    });

    var root=document.getElementById('v30ProfileHomeRoot');
    if(root){
      var hasDirection=!!root.querySelector('.v30-profile-home.direction');
      var hasHotel=!!root.querySelector('.v30-profile-home.hotel');
      root.style.display=(hasDirection&&!hasHotel)?'none':'';
    }
  }

  function observe(){
    apply();
    var root=document.getElementById('v30ProfileHomeRoot');
    if(root){
      new MutationObserver(apply).observe(root,{childList:true,subtree:true});
    }
    document.addEventListener('vg-modern-preview-ready',apply);
    window.addEventListener('hashchange',function(){setTimeout(apply,0);});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',observe,{once:true});
  else observe();
})();
