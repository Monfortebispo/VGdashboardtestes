
(function(){
  'use strict';
  const HOTEL_LIST = ["ALBACORA", "ALENTEJO VINEYARDS", "AMPALIUS", "ATLANTICO", "CASAS DE ELVAS", "CASCAIS", "CERRO ALAGOA", "COIMBRA", "COLLECTION ALTER REAL", "COLLECTION BRAGA", "COLLECTION DOURO", "COLLECTION ELVAS", "COLLECTION FIGUEIRA DA FOZ", "COLLECTION MONTE DO VILAR", "COLLECTION PALACIO DOS ARCOS", "COLLECTION PONTE DE LIMA VINEYARDS", "COLLECTION PRAIA", "COLLECTION S. MIGUEL", "COLLECTION SERRA DA ESTRELA", "COLLECTION SINTRA", "COLLECTION TOMAR", "DOURO VINEYARDS", "ERICEIRA", "ESTORIL", "EVORA", "ISLA CANELA", "LAGOS", "MARINA", "NAUTICO", "NEP KIDS", "OPERA", "PORTO", "PORTO RIBEIRA", "SANTA CRUZ", "TAVIRA"];
  const SESSION_KEY='vg_auth_session_v6';
  const TOKEN_KEY='vg_auth_token_v6';
  const AUDIT_KEY='vg_auth_audit_v5';
  let usersCache = {};
  let usersLoaded = false;
  let forcedPasswordChange = false;

  function esc(s){return String(s??'').replace(/[&<>"']/g,function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m];});}
  function norm(s){return String(s||'').trim().toUpperCase();}
  function token(){try{return sessionStorage.getItem(TOKEN_KEY)||'';}catch(e){return '';}}
  function current(){
    try{
      if(!token()) return null;
      return JSON.parse(sessionStorage.getItem(SESSION_KEY)||'null');
    }catch(e){return null;}
  }
  function setAuth(u,t){
    try{
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(u));
      sessionStorage.setItem(TOKEN_KEY, t||'');
    }catch(e){}
  }
  function clearCurrent(){
    try{sessionStorage.removeItem(SESSION_KEY);sessionStorage.removeItem(TOKEN_KEY);}catch(e){}
  }
  window.vgAuthToken=token;
  window.vgAuthCurrent=current;

  async function api(resource, method, payload, key){
    let url = window.SHARED_API_URL + '?resource=' + encodeURIComponent(resource);
    if(key!==undefined && key!==null) url += '&key=' + encodeURIComponent(key);
    const headers={'Content-Type':'application/json'};
    const t=token(); if(t) headers.Authorization='Bearer '+t;
    const opts={method:method||'GET',headers,cache:'no-store'};
    if(payload!==undefined) opts.body=JSON.stringify(payload);
    const res=await fetch(url,opts);
    const data=await res.json().catch(()=>({}));
    if(!res.ok){
      const err=new Error(data.error||('HTTP '+res.status)); err.status=res.status; throw err;
    }
    return data;
  }

  async function audit(action, hotel, detail){
    const u=current();
    if(!u) return;
    const entry={ts:new Date().toLocaleString('pt-PT'),hotel:hotel||'',action:action||'',detail:detail||''};
    let rows=[]; try{rows=JSON.parse(localStorage.getItem(AUDIT_KEY)||'[]')||[];}catch(e){}
    rows.unshift(Object.assign({},entry,{user:u.user,name:u.name})); rows=rows.slice(0,300);
    try{localStorage.setItem(AUDIT_KEY,JSON.stringify(rows));}catch(e){}
    renderAudit(rows);
    try{await api('audit','POST',entry);}catch(e){console.warn('Não foi possível publicar auditoria.',e);}
  }
  function canEditHotel(h){
    const u=current(); if(!u) return false;
    if(u.role==='admin'||u.role==='direcao') return true;
    return norm(h)===norm(u.hotel);
  }
  window.vgAuthCanEditHotel=canEditHotel;
  window.vgAuthAudit=audit;

  function handleUnauthorized(){
    if(!current() && !token()) return;
    clearCurrent();
    usersCache={}; usersLoaded=false;
    applySession();
    const err=document.getElementById('vgLoginError'); if(err) err.textContent='A sessão expirou. Inicie sessão novamente.';
  }
  window.vgAuthHandleUnauthorized=handleUnauthorized;

  async function refreshUsersFromServer(){
    const u=current();
    if(!u || !(u.role==='direcao'||u.role==='admin')) {usersCache={};usersLoaded=true;return usersCache;}
    const data=await api('users','GET');
    usersCache=(data&&data.data)||{}; usersLoaded=true;
    return usersCache;
  }
  function readUsers(){return usersCache||{};}
  async function ensureUsersLoaded(force){
    if(force||!usersLoaded) await refreshUsersFromServer();
    return usersCache;
  }

  async function afterLoginLoad(){
    setTimeout(async function(){
      try{if(typeof idbAutoRestore==='function') await idbAutoRestore();}catch(e){console.warn('Auto-restauro após login falhou',e);}
      try{if(typeof window.vgTargetsRulesLoad==='function') await window.vgTargetsRulesLoad(false);}catch(e){console.warn('Metas & Regras após login falharam',e);}
      try{
        if(typeof STORE!=='undefined'&&typeof selectedMeses!=='undefined'){
          var avail=Object.keys(STORE).map(Number).filter(function(x){return x>0;});
          if(avail.length>0&&selectedMeses.size===0) selectedMeses.add(Math.max.apply(null,avail));
        }
        if(typeof buildMesButtons==='function') buildMesButtons();
        if(typeof applyMesSelection==='function') applyMesSelection();
      }catch(e){console.warn('Carregamento de dados após login falhou',e);}
      try{if(typeof calInit==='function')calInit();if(typeof setView==='function')setView(typeof currentView!=='undefined'?currentView:'resumo');}catch(e){console.warn('Re-render após login falhou',e);}
    },250);
  }

  async function login(){
    const user=(document.getElementById('vgLoginUser')?.value||'').trim().toLowerCase();
    const pass=document.getElementById('vgLoginPass')?.value||'';
    const err=document.getElementById('vgLoginError'); if(err)err.textContent='';
    const btn=document.getElementById('vgLoginBtn'); if(btn){btn.disabled=true;btn.textContent='A validar…';}
    try{
      const data=await api('auth-login','POST',{user,password:pass});
      if(!data.token||!data.user) throw new Error('Resposta de autenticação inválida.');
      setAuth(data.user,data.token);
      if(document.getElementById('vgLoginPass')) document.getElementById('vgLoginPass').value='';
      applySession();
      audit('Login',data.user.hotel,'Entrada no dashboard');
      if(data.user.mustChangePassword){
        openPasswordModal(true);
      }else{
        afterLoginLoad();
      }
      return true;
    }catch(e){
      if(err)err.textContent=e.status===429?e.message:'Utilizador ou palavra-passe inválidos.';
      return false;
    }finally{
      if(btn){btn.disabled=false;btn.textContent='Entrar';}
    }
  }
  function logout(){audit('Logout','','Saída do dashboard');clearCurrent();usersCache={};usersLoaded=false;applySession();}
  window.vgAuthLogin=login;window.vgAuthLogout=logout;

  function ensureTopbar(){
    const top=document.querySelector('.topbar-right')||document.querySelector('.topbar')||document.body;
    if(!document.getElementById('vgCurrentUserPill')){let p=document.createElement('div');p.id='vgCurrentUserPill';p.className='vg-auth-pill';top.appendChild(p);}
    if(!document.getElementById('vgPasswordBtn')){let b=document.createElement('button');b.id='vgPasswordBtn';b.className='vg-auth-btn';b.textContent='Palavra-passe';b.type='button';b.onclick=function(){openPasswordModal(false);};top.appendChild(b);}
    if(!document.getElementById('vgSetupBtn')){let b=document.createElement('button');b.id='vgSetupBtn';b.className='vg-auth-btn';b.textContent='Setup';b.type='button';b.onclick=openSetup;top.appendChild(b);}
    if(!document.getElementById('vgLogoutBtn')){let b=document.createElement('button');b.id='vgLogoutBtn';b.className='vg-auth-btn';b.textContent='Sair';b.type='button';b.onclick=logout;top.appendChild(b);}
  }
  function applySession(){
    ensureTopbar();
    const u=current();
    const overlay=document.getElementById('vgLoginOverlay');
    const pill=document.getElementById('vgCurrentUserPill');
    const setup=document.getElementById('vgSetupBtn');
    const passBtn=document.getElementById('vgPasswordBtn');
    const logoutBtn=document.getElementById('vgLogoutBtn');
    if(!u){
      if(overlay)overlay.style.display='flex';
      [pill,setup,passBtn,logoutBtn].forEach(function(x){if(x)x.style.display='none';});
      document.querySelectorAll('.vg-direction-only').forEach(function(x){x.style.display='none';});
      document.body.classList.remove('vg-is-admin');
      try{onlineStopPing&&onlineStopPing();}catch(e){}
      return;
    }
    if(overlay)overlay.style.display='none';
    if(pill){pill.style.display='inline-flex';pill.innerHTML='<b>'+esc(u.name)+'</b><span>'+(u.role==='direcao'?'Dir. Operações':u.role==='diretor'?'Diretor':u.role==='assistente'?'Assistente Direção':'Dir. Operações')+(u.hotel&&u.hotel!=='*'?' · '+esc(u.hotel):'')+'</span>';}
    if(setup)setup.style.display=(u.role==='admin'||u.role==='direcao')?'inline-flex':'none';
    if(passBtn)passBtn.style.display='inline-flex';
    if(logoutBtn)logoutBtn.style.display='inline-flex';
    document.querySelectorAll('.vg-direction-only').forEach(function(x){x.style.display=(u.role==='admin'||u.role==='direcao')?'':'none';});
    document.body.classList.toggle('vg-is-admin',u.role==='admin'||u.role==='direcao');
    applyPermissions();
    if(u.role==='admin'||u.role==='direcao') renderSetup();
    try{onlineStartPing();}catch(e){}
  }

  function selectedHotel(){return document.getElementById('hsHotel')?.value||document.querySelector('[data-current-hotel]')?.getAttribute('data-current-hotel')||'';}
  function applyPermissions(){
    const h=selectedHotel();const editable=canEditHotel(h);
    const root=document.getElementById('view-fichahotel')||document.querySelector('#hsTableBody')?.closest('.tab-content');
    if(!root||!h)return;
    let msg=document.getElementById('vgLockMessage');
    if(!msg){msg=document.createElement('div');msg.id='vgLockMessage';msg.className='vg-lock-message';msg.textContent='Pode consultar todos os hotéis, mas só pode editar comentários e campos do hotel associado ao seu utilizador.';root.insertBefore(msg,root.firstElementChild);}
    msg.style.display=editable?'none':'block';
    root.querySelectorAll('textarea,input,select,button').forEach(function(el){
      if(['hsHotel','hsMes'].includes(el.id))return;
      if(el.closest('#vgSetupModal'))return;
      if(el.id&&el.id.startsWith('vg'))return;
      if(!editable){el.classList.add('vg-edit-locked');if(['TEXTAREA','INPUT'].includes(el.tagName))el.setAttribute('readonly','readonly');}
      else{el.classList.remove('vg-edit-locked');if(['TEXTAREA','INPUT'].includes(el.tagName))el.removeAttribute('readonly');}
    });
  }
  window.vgAuthApplyPermissions=applyPermissions;

  function hotelsForSetup(){
    const fromSelect=Array.from(document.querySelectorAll('#hsHotel option, select option')).map(function(o){return o.value;}).filter(Boolean);
    const marketHotels=window.VG?.market?.def?.()?.hotels||[];const rawHotels=(typeof RAW!=='undefined'&&RAW?.hotel_list)||[];
    const base=marketHotels.length?marketHotels:(HOTEL_LIST||[]).concat(rawHotels,fromSelect);
    return Array.from(new Set(base.filter(Boolean).filter(h=>!window.VG?.market||window.VG.market.isCurrentHotel(h)))).sort();
  }
  function fillHotelSelect(){const s=document.getElementById('vgNewHotel');if(!s)return;const val=s.value;s.innerHTML='<option value="*">Todos os hotéis</option>'+hotelsForSetup().map(function(h){return '<option value="'+esc(h)+'">'+esc(h)+'</option>';}).join('');if(val)s.value=val;}
  async function openSetup(){
    if(current()?.role!=='admin'&&current()?.role!=='direcao')return;
    const m=document.getElementById('vgSetupModal');if(m)m.style.display='flex';
    await renderSetup(true);
  }
  function closeSetup(){const m=document.getElementById('vgSetupModal');if(m)m.style.display='none';}

  async function renderAudit(preloadedRows){
    const b=document.getElementById('vgAuditTable');if(!b)return;
    let rows=preloadedRows;
    if(!rows){
      try{const data=await api('audit-events','GET');if(data&&Array.isArray(data.data))rows=data.data;}catch(e){if(e.status===401)handleUnauthorized();}
      if(!rows){try{rows=JSON.parse(localStorage.getItem(AUDIT_KEY)||'[]')||[];}catch(e){rows=[];}}
      try{localStorage.setItem(AUDIT_KEY,JSON.stringify(rows.slice(0,300)));}catch(e){}
    }
    b.innerHTML=rows.slice(0,80).map(function(r){return '<tr><td>'+esc(r.serverTs||r.ts)+'</td><td>'+esc(r.name||r.user)+'</td><td>'+esc(r.hotel)+'</td><td>'+esc(r.action)+'</td><td>'+esc(r.detail)+'</td></tr>';}).join('');
  }

  const legacyRegionNames={norte:'🔵 Norte e Centro',lisboa:'🟢 Lisboa & Ilhas',alentejo:'🟡 Alentejo',algarve:'🔴 Algarve'};
  function setupRegionName(r){const x=window.VG?.market?.regionLabel?.(r)||legacyRegionNames[r]||r;const icons={cidade:'🏙️',resorts:'🏖️',collection:'◆'};return (icons[r]?icons[r]+' ':'')+x;}
  let editRegioes=null;
  function renderRegioesEditor(){
    const el=document.getElementById('vgRegioesEditor');if(!el)return;
    if(!editRegioes)editRegioes=JSON.parse(JSON.stringify(REGIOES));
    el.innerHTML=Object.keys(editRegioes).map(function(reg){
      const list=editRegioes[reg];
      const items=list.map(function(h){return '<div style="display:flex;align-items:center;justify-content:space-between;padding:3px 6px;background:var(--surface-2);border-radius:4px;margin-bottom:3px;font-size:11px;gap:4px"><span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="'+esc(h)+'">'+esc(h)+'</span><select style="font-size:10px;padding:1px 3px;background:var(--surface-3);border:1px solid var(--border);color:var(--text-2);border-radius:3px" onchange="vgMoveHotel(\''+esc(h)+'\',\''+reg+'\',this.value)">'+Object.keys(editRegioes).map(function(r){return '<option value="'+r+'"'+(r===reg?' selected':'')+'>'+esc(setupRegionName(r))+'</option>';}).join('')+'</select></div>';}).join('');
      return '<div style="background:var(--surface-1);border:1px solid var(--border);border-radius:8px;padding:10px"><div style="font-size:11px;font-weight:700;color:var(--gold);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">'+esc(setupRegionName(reg))+' <span style="font-weight:400;color:var(--text-3)">('+list.length+')</span></div>'+(items||'<div style="font-size:11px;color:var(--text-3);font-style:italic">Sem hotéis</div>')+'</div>';
    }).join('');
  }
  window.vgMoveHotel=function(hotel,fromReg,toReg){if(!editRegioes||fromReg===toReg)return;editRegioes[fromReg]=editRegioes[fromReg].filter(function(h){return h!==hotel;});if(!editRegioes[toReg].includes(hotel))editRegioes[toReg].push(hotel);editRegioes[toReg].sort();renderRegioesEditor();};
  window.vgSaveRegioes=async function(){if(!editRegioes)return;const ok=await saveRegioes(editRegioes);editRegioes=JSON.parse(JSON.stringify(REGIOES));const msg=document.getElementById('vgRegioesMsg');if(msg){msg.textContent=ok?'✓ Regiões partilhadas e guardadas para todos.':'⚠ Não foi possível sincronizar as regiões.';setTimeout(function(){if(msg)msg.textContent='';},3500);}if(typeof renderAll==='function')renderAll();};
  window.vgResetRegioes=async function(){if(!confirm('Repor o mapeamento de regiões por defeito para todos os utilizadores?'))return;const defaults=JSON.parse(JSON.stringify(window.VG?.market?.defaultRegions?.()||REGIOES_DEFAULT));const ok=await saveRegioes(defaults);editRegioes=JSON.parse(JSON.stringify(REGIOES));renderRegioesEditor();const msg=document.getElementById('vgRegioesMsg');if(msg){msg.textContent=ok?'↺ Regiões por defeito publicadas para todos.':'⚠ Não foi possível publicar a reposição.';setTimeout(function(){if(msg)msg.textContent='';},3500);}if(typeof renderAll==='function')renderAll();};

  window.VG?.events?.on?.('market:changed',()=>{editRegioes=JSON.parse(JSON.stringify(typeof REGIOES!=='undefined'?REGIOES:{}));renderRegioesEditor();});

  async function renderSetup(force){
    const u=current();if(!u||!(u.role==='direcao'||u.role==='admin'))return;
    fillHotelSelect();renderRegioesEditor();
    try{if(typeof window.vgTargetsRulesRenderSetup==='function') await window.vgTargetsRulesRenderSetup(!!force);}catch(e){console.warn('Setup Metas & Regras indisponível',e);}
    var body=document.getElementById('vgUsersTable');if(!body)return;
    if(force||!usersLoaded){
      body.innerHTML='<tr><td colspan="6" style="padding:14px;color:var(--text-3)">A carregar utilizadores…</td></tr>';
      try{await ensureUsersLoaded(true);}catch(e){if(e.status===401){handleUnauthorized();return;}body.innerHTML='<tr><td colspan="6">Não foi possível obter os utilizadores.</td></tr>';return;}
    }
    var users=readUsers();
    function roleLabel(r){return(r==='direcao'||r==='admin')?'Dir. Operações':r==='assistente'?'Assistente Direção':'Diretor';}
    function scopeLabel(x){return(!x.hotel||x.hotel==='*')?'Todos os hotéis':x.hotel;}
    function roleBg(r){return(r==='direcao'||r==='admin')?'rgba(201,168,76,.2);color:#c9a84c':r==='assistente'?'rgba(100,180,255,.15);color:#64b4ff':'rgba(42,125,140,.2);color:#2a7d8c';}
    var sorted=Object.values(users).sort(function(a,b){var ro={direcao:0,admin:0,diretor:1,assistente:2};var rd=(ro[a.role]??1)-(ro[b.role]??1);return rd!==0?rd:String(a.name).localeCompare(String(b.name),'pt');});
    body.innerHTML=sorted.map(function(x){
      const pwd=x.mustChangePassword?'<span title="A alteração da palavra-passe será pedida no próximo login" style="color:#e0a020"> · troca pendente</span>':'';
      return '<tr style="opacity:'+(x.active===false?'.45':'1')+'"><td style="font-family:monospace;font-size:11px">'+esc(x.user)+'</td><td>'+esc(x.name)+pwd+'</td><td><span style="padding:2px 7px;border-radius:4px;font-size:10px;font-weight:700;background:'+roleBg(x.role)+'">'+roleLabel(x.role)+'</span></td><td style="font-size:11px">'+esc(scopeLabel(x))+'</td><td>'+(x.active===false?'<span style="color:#e55">Inativo</span>':'<span style="color:#5c5">Ativo</span>')+'</td><td style="display:flex;gap:4px"><button class="vg-auth-smallbtn" type="button" data-edit="'+esc(x.user)+'">✏ Editar</button><button class="vg-auth-smallbtn" type="button" data-toggle="'+esc(x.user)+'">'+(x.active===false?'✓ Ativar':'✕ Inativar')+'</button></td></tr>';
    }).join('');
    body.querySelectorAll('[data-edit]').forEach(function(b){b.onclick=function(){editUser(this.getAttribute('data-edit'));};});
    body.querySelectorAll('[data-toggle]').forEach(function(b){b.onclick=function(){toggleUser(this.getAttribute('data-toggle'));};});
    renderAudit();
  }

  async function saveUser(){
    if(current()?.role!=='admin'&&current()?.role!=='direcao')return;
    var user=(document.getElementById('vgNewUser')?.value||'').trim().toLowerCase();
    var name=(document.getElementById('vgNewName')?.value||'').trim();
    var password=document.getElementById('vgNewPass')?.value||'';
    var role=document.getElementById('vgNewRole')?.value||'diretor';
    var hotel=document.getElementById('vgNewHotel')?.value||'*';
    var msg=document.getElementById('vgFormMsg');if(msg)msg.textContent='';
    if(!user||!name){if(msg)msg.textContent='⚠ Preencha o utilizador e o nome.';return;}
    try{
      await api('user-save','POST',{user,name,password,role,hotel});
      await ensureUsersLoaded(true);await renderSetup(false);
      if(msg)msg.textContent='✓ '+name+' guardado no servidor.';
      ['vgNewUser','vgNewName','vgNewPass'].forEach(function(id){const el=document.getElementById(id);if(el)el.value='';});
      audit('Setup',hotel,'Utilizador criado/alterado: '+user);
      showToast('Utilizador guardado: '+name+' ('+role+')');
    }catch(e){if(e.status===401){handleUnauthorized();return;}if(msg)msg.textContent='⚠ '+e.message;}
  }
  function editUser(user){
    var x=readUsers()[user];if(!x)return;fillHotelSelect();
    document.getElementById('vgNewUser').value=x.user;
    document.getElementById('vgNewName').value=x.name;
    document.getElementById('vgNewPass').value='';
    var r=x.role;if(r==='admin')r='direcao';if(r==='director')r='diretor';
    document.getElementById('vgNewRole').value=r;
    var hotelSel=document.getElementById('vgNewHotel');hotelSel.value=(r==='direcao')?'*':(x.hotel||'*');
    var msg=document.getElementById('vgFormMsg');if(msg)msg.textContent='A editar: '+x.name+' · deixe a palavra-passe vazia para a manter.';
  }
  async function toggleUser(user){
    if(user==='pmonforte'){alert('O administrador principal não pode ser inativado.');return;}
    try{await api('user-toggle','POST',{user});await ensureUsersLoaded(true);audit('Setup',readUsers()[user]?.hotel,'Estado alterado: '+user);await renderSetup(false);}catch(e){if(e.status===401)handleUnauthorized();else alert(e.message);}
  }

  function openPasswordModal(forced){
    if(!current())return;
    forcedPasswordChange=!!forced;
    const m=document.getElementById('vgPasswordModal');if(!m)return;
    document.getElementById('vgPasswordTitle').textContent=forced?'Alteração obrigatória da palavra-passe':'Alterar palavra-passe';
    document.getElementById('vgPasswordHelp').textContent=forced?'Por segurança, a conta ainda usa uma palavra-passe inicial. Defina uma nova antes de continuar.':'A nova palavra-passe deve ter pelo menos 8 caracteres e incluir uma letra e um número.';
    ['vgOldPassword','vgNewPassword1','vgNewPassword2'].forEach(function(id){const el=document.getElementById(id);if(el)el.value='';});
    const err=document.getElementById('vgPasswordError');if(err)err.textContent='';
    const cancel=document.getElementById('vgPasswordCancel');if(cancel)cancel.style.display=forced?'none':'inline-flex';
    m.style.display='flex';setTimeout(function(){document.getElementById('vgOldPassword')?.focus();},50);
  }
  function closePasswordModal(){if(forcedPasswordChange)return;const m=document.getElementById('vgPasswordModal');if(m)m.style.display='none';}
  async function saveOwnPassword(){
    const oldPassword=document.getElementById('vgOldPassword')?.value||'';
    const p1=document.getElementById('vgNewPassword1')?.value||'';
    const p2=document.getElementById('vgNewPassword2')?.value||'';
    const err=document.getElementById('vgPasswordError');if(err)err.textContent='';
    if(p1!==p2){if(err)err.textContent='As duas novas palavras-passe não coincidem.';return;}
    const btn=document.getElementById('vgPasswordSave');if(btn){btn.disabled=true;btn.textContent='A guardar…';}
    try{
      const data=await api('auth-change-password','POST',{oldPassword,newPassword:p1});
      setAuth(data.user,data.token);forcedPasswordChange=false;
      const m=document.getElementById('vgPasswordModal');if(m)m.style.display='none';
      applySession();audit('Segurança',data.user.hotel,'Palavra-passe alterada');showToast('Palavra-passe alterada com sucesso.');
      afterLoginLoad();
    }catch(e){if(e.status===401&&e.message==='Sessão inválida ou expirada.'){handleUnauthorized();return;}if(err)err.textContent=e.message||'Não foi possível alterar a palavra-passe.';}
    finally{if(btn){btn.disabled=false;btn.textContent='Guardar nova palavra-passe';}}
  }

  window.vgAuthOpenSetup=openSetup;window.vgAuthCloseSetup=closeSetup;window.vgAuthSaveUser=saveUser;
  window.vgAuthOpenPassword=function(){openPasswordModal(false);};

  function init(){
    // Elimina caches do sistema antigo que continham passwords em texto simples.
    try{localStorage.removeItem('vg_auth_users_v5');sessionStorage.removeItem('vg_auth_session_v5');sessionStorage.removeItem('vg_upload_unlocked');}catch(e){}
    const btn=document.getElementById('vgLoginBtn');if(btn)btn.onclick=login;
    const pass=document.getElementById('vgLoginPass');if(pass)pass.addEventListener('keydown',function(e){if(e.key==='Enter')login();});
    const close=document.getElementById('vgCloseSetupBtn');if(close)close.onclick=closeSetup;
    const save=document.getElementById('vgSaveUserBtn');if(save)save.onclick=saveUser;
    const pwdSave=document.getElementById('vgPasswordSave');if(pwdSave)pwdSave.onclick=saveOwnPassword;
    const pwdCancel=document.getElementById('vgPasswordCancel');if(pwdCancel)pwdCancel.onclick=closePasswordModal;
    document.addEventListener('change',function(e){if(e.target&&e.target.id==='hsHotel')setTimeout(applyPermissions,0);});
    applySession();
    const u=current();
    if(u){
      if(u.mustChangePassword)openPasswordModal(true);else afterLoginLoad();
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
