/* ⌖HSUB⌖ · service worker
   Estrategia:
   · HTML y navegaciones → RED PRIMERO. Si hay conexión se sirve siempre la
     última versión publicada; sin conexión, la copia guardada. Así la app
     nunca se queda pegada a una versión vieja.
   · Iconos y manifiesto → CACHÉ PRIMERO, que no cambian.
   El nombre de la caché lleva la versión: al cambiarlo se descarta la
   anterior por completo. HAY QUE SUBIRLO junto al index.html en cada
   versión, o iOS seguirá sirviendo la copia antigua. */
const CACHE = "hsub-v1.26.4";
const ESTATICOS = ["./manifest.json", "./icon-180.png", "./icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ESTATICOS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;

  const esHTML = req.mode === "navigate" ||
                 (req.headers.get("accept") || "").includes("text/html");

  if (esHTML) {
    e.respondWith(
      fetch(req)
        .then(r => {
          const copia = r.clone();
          caches.open(CACHE).then(c => c.put("./index.html", copia));
          return r;
        })
        .catch(() => caches.match("./index.html").then(r => r || caches.match("./")))
    );
    return;
  }

  e.respondWith(
    caches.match(req).then(r => r || fetch(req).then(resp => {
      const copia = resp.clone();
      caches.open(CACHE).then(c => c.put(req, copia));
      return resp;
    }).catch(() => r))
  );
});
