/* Cero_Aedes by AR — service worker
   Cachea la aplicación completa para uso sin conexión.
   Sube el número de versión para forzar la actualización en los dispositivos. */

const VERSION = 'ceroaedes-v3.3.1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './assets/icon-maskable-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(VERSION)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* Network-first para el HTML (recibe actualizaciones al abrir con señal),
   cache-first para el resto. Siempre responde offline. */
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  /* El conteo de visitas no se cachea ni se intercepta: si no hay red, que falle
     en silencio. Nunca debe estorbar al funcionamiento sin conexión. */
  if (req.url.includes('cloudflareinsights.com')) return;

  const esDocumento = req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html');

  if (esDocumento) {
    /* Red primero, pero con techo de 3 s: en zona rural o tras un portal cautivo
       el usuario esperaba el timeout del navegador antes de ver la copia offline. */
    const conTecho = Promise.race([
      fetch(req),
      new Promise((_, rechazar) => setTimeout(() => rechazar(new Error('lenta')), 3000))
    ]);
    event.respondWith(
      conTecho
        .then(res => {
          const copia = res.clone();
          caches.open(VERSION).then(c => c.put(req, copia));
          return res;
        })
        .catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then(cached => cached || fetch(req).then(res => {
      const copia = res.clone();
      caches.open(VERSION).then(c => c.put(req, copia));
      return res;
    }).catch(() => cached || Response.error()))
  );
});
