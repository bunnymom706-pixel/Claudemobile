/* Offline shell for Strike.
   Everything the app needs is four files and the fonts. Cache them on install
   so the app opens with no signal; serve the network first for the HTML so a
   redeploy is picked up, and the cache first for everything else. */
const CACHE = "strike-v2";
const SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png",
  "./icons/favicon-32.png"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if(req.method !== "GET") return;

  // HTML: network first, so a new version lands as soon as there is signal.
  if(req.mode === "navigate" || (req.headers.get("accept") || "").includes("text/html")){
    e.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(req).then(r => r || caches.match("./index.html")))
    );
    return;
  }

  // Everything else: cache first, fall back to the network, then give up quietly.
  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      if(res && res.status === 200 && (res.type === "basic" || res.type === "cors")){
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
      }
      return res;
    }).catch(() => hit))
  );
});
