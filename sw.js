/* ⌖HSUB⌖ — service worker
   index.html y navegaciones: RED PRIMERO (si hay cobertura, siempre la última versión publicada;
   si no, la copia guardada).  Iconos y manifiesto: CACHÉ PRIMERO.                              */
const CACHE = "hsub-v1.9.41";
const ESTATICOS = ["./manifest.json", "./icon-180.png", "./icon-512.png"];
const HTML = ["./", "./index.html"];

self.addEventListener("install", (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await c.addAll(ESTATICOS);
    try { await c.addAll(HTML); } catch (err) { /* sin red al instalar: se guarda al primer uso */ }
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    const nombres = await caches.keys();
    await Promise.all(nombres.filter(n => n !== CACHE).map(n => caches.delete(n)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  const esHTML = req.mode === "navigate" ||
                 url.pathname.endsWith("/") ||
                 url.pathname.endsWith("/index.html");

  if (esHTML) {                                   // ---- RED PRIMERO ----
    e.respondWith((async () => {
      try {
        const red = await fetch(req, { cache: "no-store" });
        const c = await caches.open(CACHE);
        c.put("./index.html", red.clone());
        return red;
      } catch (err) {
        const c = await caches.open(CACHE);
        return (await c.match("./index.html")) || (await c.match("./")) || Response.error();
      }
    })());
    return;
  }

  const esEstatico = ESTATICOS.some(a => url.pathname.endsWith(a.replace("./", "")));
  if (esEstatico) {                               // ---- CACHÉ PRIMERO ----
    e.respondWith((async () => {
      const c = await caches.open(CACHE);
      const guardado = await c.match(req);
      if (guardado) return guardado;
      const red = await fetch(req);
      c.put(req, red.clone());
      return red;
    })());
    return;
  }

  e.respondWith(fetch(req).catch(async () => (await caches.match(req)) || Response.error()));
});
