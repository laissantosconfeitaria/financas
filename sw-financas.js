const CACHE = 'financas-v3';
const ASSETS = [
  '/financas/',
  '/financas/index.html'
];

self.addEventListener('install', e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).catch(()=>{}));
  self.skipWaiting();
});

self.addEventListener('activate', e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('message', e=>{
  if(e.data?.type==='SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', e=>{
  // Nunca intercepta chamadas ao Supabase
  if(e.request.url.includes('supabase.co')) return;
  if(e.request.method !== 'GET') return;
  if(e.request.mode === 'navigate'){
    e.respondWith(fetch(e.request).catch(()=>caches.match('/financas/')));
    return;
  }
  e.respondWith(
    caches.match(e.request).then(cached=>{
      if(cached) return cached;
      return fetch(e.request).then(r=>{
        if(r && r.status===200){
          const cl=r.clone();
          caches.open(CACHE).then(c=>c.put(e.request,cl));
        }
        return r;
      }).catch(()=>cached);
    })
  );
});
