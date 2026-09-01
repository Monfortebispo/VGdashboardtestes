const fs=require('fs');
const path=require('path');

const root=path.resolve(__dirname,'..');
const swPath=path.join(root,'service-worker.js');
let sw=fs.readFileSync(swPath,'utf8');

const marker="self.addEventListener('fetch', event => {";
const pos=sw.indexOf(marker);
if(pos<0) throw new Error('service-worker.js sem fetch handler conhecido');

const optimized=`self.addEventListener('fetch', event => {
  const req=event.request;
  const url=new URL(req.url);
  if (isSensitive(req,url)) return;

  // NETWORK-FIRST sem bloquear a resposta na escrita do Cache Storage.
  // A rede alimenta imediatamente a página; a atualização do cache acontece em background.
  if (req.mode==='navigate') {
    const network=fetch(req);
    event.waitUntil(network.then(fresh=>{
      if (!fresh || !fresh.ok || url.origin!==self.location.origin) return;
      const copy=fresh.clone();
      return caches.open(CACHE_NAME).then(cache=>cache.put('/index.html',copy));
    }).catch(()=>{}));
    event.respondWith((async()=>{
      try {
        return await network;
      } catch (e) {
        return (await caches.match('/index.html')) || (await caches.match('/'));
      }
    })());
    return;
  }

  if (url.origin===self.location.origin) {
    const network=fetch(req);
    event.waitUntil(network.then(fresh=>{
      if (!fresh || !fresh.ok) return;
      const copy=fresh.clone();
      return caches.open(CACHE_NAME).then(cache=>cache.put(req,copy));
    }).catch(()=>{}));
    event.respondWith((async()=>{
      try {
        return await network;
      } catch (e) {
        return (await caches.match(req,{ignoreSearch:true})) || Response.error();
      }
    })());
  }
});
`;

sw=sw.slice(0,pos)+optimized;
fs.writeFileSync(swPath,sw,'utf8');
console.log('✓ Service worker otimizado: cache atualizado em background sem bloquear respostas');
