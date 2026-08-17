// VG Operations v35.7 Performance — service worker · stability hotfix 2
// Cacheia apenas a aplicação estática. Dados/API Netlify são sempre network-only.
const CACHE_NAME = 'vg-operations-shell-v35-7';
const HOTFIX_REV = 'stability-2';
// Compatibilidade de regressão: versão anterior publicada como vg-operations-shell-v32-5.
const STATIC_ASSETS = [
  "/assets/css/actions-management.css",
  "/assets/css/auth.css",
  "/assets/css/base.css",
  "/assets/css/chart-actions.css",
  "/assets/css/compras.css",
  "/assets/css/cost-detail.css",
  "/assets/css/forecast-state.css",
  "/assets/css/global-search.css",
  "/assets/css/logo-fix.css",
  "/assets/css/markets-v31.css",
  "/assets/css/mobile-pwa.css",
  "/assets/css/navigation-shell.css",
  "/assets/css/notifications-v21.css",
  "/assets/css/operational-summary-pdf-v32_6.css",
  "/assets/css/operations-center.css",
  "/assets/css/performance-v35_7.css",
  "/assets/css/responsive-desktop-v35_6.css",
  "/assets/css/targets-rules.css",
  "/assets/css/theme.css",
  "/assets/css/uniformizacao-v32_2.css",
  "/assets/css/vg-operations-2-v30.css",
  "/assets/icons/vg-ops-180.png",
  "/assets/icons/vg-ops-192.png",
  "/assets/icons/vg-ops-512.png",
  "/assets/js/auth/auth-client.js",
  "/assets/js/core/00-runtime.js",
  "/assets/js/core/01-data-import.js",
  "/assets/js/core/02-navigation-kpis.js",
  "/assets/js/core/03-persistence-sharing.js",
  "/assets/js/core/04-bootstrap.js",
  "/assets/js/core/05-performance.js",
  "/assets/js/core/06-version-guard-v29_1.js",
  "/assets/js/core/07-markets-v31.js",
  "/assets/js/core/08-performance-loader-v35_7.js",
  "/assets/js/core/compat-stubs.js",
  "/assets/js/modules/actions-management.js",
  "/assets/js/modules/compras.js",
  "/assets/js/modules/ficha-hotel.js",
  "/assets/js/modules/hoteis.js",
  "/assets/js/modules/hotel-performance-v23.js",
  "/assets/js/modules/instagram.js",
  "/assets/js/modules/ocupacao.js",
  "/assets/js/modules/operational-score-v28.js",
  "/assets/js/modules/operational-summary-pdf-v32_6.js",
  "/assets/js/modules/pdf-export.js",
  "/assets/js/modules/receitas-detalhe.js",
  "/assets/js/modules/targets-rules.js",
  "/assets/js/ui/cdn-healthcheck.js",
  "/assets/js/ui/chart-actions.js",
  "/assets/js/ui/context-panel.js",
  "/assets/js/ui/forecast-state.js",
  "/assets/js/ui/global-search.js",
  "/assets/js/ui/mobile-pwa.js",
  "/assets/js/ui/navigation-shell.js",
  "/assets/js/ui/notifications-v21.js",
  "/assets/js/ui/operational-tools.js",
  "/assets/js/ui/operations-center.js",
  "/assets/js/ui/vg-operations-2-v30.js",
  "/index.html",
  "/manifest.webmanifest"
];

self.addEventListener('install', event => {
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE_NAME);
    // V35.7: pré-cache reduzido ao shell inicial; módulos secundários entram na cache apenas quando são abertos.
    const batchSize=8;
    for(let i=0;i<STATIC_ASSETS.length;i+=batchSize){
      const batch=STATIC_ASSETS.slice(i,i+batchSize);
      await Promise.allSettled(batch.map(url=>cache.add(new Request(url,{cache:'reload'})).catch(e=>{console.warn('[VG SW] precache falhou',url);throw e;})));
    }
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(k=>k.startsWith('vg-operations-shell-') && k!==CACHE_NAME).map(k=>caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', event => {
  if (event.data && event.data.type==='SKIP_WAITING') self.skipWaiting();
});

function isSensitive(req,url) {
  if (req.method!=='GET') return true;
  if (url.pathname.startsWith('/.netlify/')) return true;
  if (url.pathname.startsWith('/netlify/functions/')) return true;
  return false;
}

self.addEventListener('fetch', event => {
  const req=event.request;
  const url=new URL(req.url);
  if (isSensitive(req,url)) return; // network-only: nunca cachear dados empresariais/API

  // Navegação: rede primeiro, shell apenas como fallback offline.
  if (req.mode==='navigate') {
    event.respondWith((async()=>{
      try {
        const fresh=await fetch(req);
        if (fresh && fresh.ok && url.origin===self.location.origin) {
          const cache=await caches.open(CACHE_NAME);
          await cache.put('/index.html', fresh.clone());
        }
        return fresh;
      } catch (e) {
        return (await caches.match('/index.html')) || (await caches.match('/'));
      }
    })());
    return;
  }

  // V35.7: recursos da própria aplicação continuam NETWORK-FIRST para evitar misturas de versões; os módulos lazy são cacheados apenas após a primeira utilização.
  // Isto impede misturas do tipo HTML novo + JavaScript antigo. O browser
  // continua a poder usar a sua cache HTTP e o Cache Storage fica como
  // fallback offline, nunca como fonte prioritária quando há rede.
  if (url.origin===self.location.origin) {
    event.respondWith((async()=>{
      try {
        const fresh=await fetch(req);
        if (fresh && fresh.ok) {
          const cache=await caches.open(CACHE_NAME);
          await cache.put(req, fresh.clone());
        }
        return fresh;
      } catch (e) {
        return (await caches.match(req,{ignoreSearch:true})) || Response.error();
      }
    })());
  }
  // Recursos CDN são network-only. A app abre offline, mas gráficos/Excel podem ficar indisponíveis.
});
