// OneSignal Web SDK v16: il worker DEVE importare OneSignalSDK.sw.js (non il vecchio worker v15 /sdks/OneSignalSDKWorker.js).
importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');

/* =====================================================================
   EQUO OFFLINE — stesso service worker delle notifiche push (uno solo per sito, niente conflitti).
   - Pagine (index.html, /groom): prima la rete, senza rete l'ultima copia salvata → l'app si apre sempre.
   - File del sito e librerie esterne (icone, font, database, PDF, QR, mappe): copia salvata, aggiornata in sottofondo.
   - MAI salvati: dati del database, funzioni del server, version.json (aggiornamenti), statistiche.
   ===================================================================== */
const EQUO_CACHE = "equo-offline-v1";
const EQUO_PRECARICA = ["/", "/manifest.json", "/assets/icona-equo.png", "/assets/logo-equo.png"];
const EQUO_MAI = /supabase\.co|\/\.netlify\/functions\/|\/api\/|version\.json|onesignal\.com\/api|google-analytics|googletagmanager|nominatim|overpass|tile\.openstreetmap|api\.anthropic/;
const EQUO_ESTERNI = /^(cdnjs\.cloudflare\.com|cdn\.jsdelivr\.net|unpkg\.com|fonts\.googleapis\.com|fonts\.gstatic\.com|cdn\.onesignal\.com)$/;

self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(EQUO_CACHE).then((c) => Promise.allSettled(EQUO_PRECARICA.map((u) => c.add(u)))));
});
self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    const nomi = await caches.keys();
    await Promise.all(nomi.filter((n) => n.startsWith("equo-offline-") && n !== EQUO_CACHE).map((n) => caches.delete(n)));
    await self.clients.claim();
  })());
});

// pagine: rete con 6 secondi di pazienza, altrimenti la copia salvata (chiave senza parametri: niente token nella cache)
async function equoPagina(req) {
  const u = new URL(req.url);
  const chiave = u.origin + u.pathname;
  const cache = await caches.open(EQUO_CACHE);
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 6000);
    const res = await fetch(req, { signal: ctrl.signal });
    clearTimeout(t);
    if (res && res.ok) cache.put(chiave, res.clone());
    return res;
  } catch (e) {
    return (await cache.match(chiave)) || (await cache.match(u.origin + "/")) || new Response(
      '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><body style="font-family:sans-serif;padding:30px;text-align:center;color:#14482c"><h2>Sei offline</h2><p>Apri Equo una volta con la connessione: da quel momento funzionerà anche senza rete.</p></body>',
      { headers: { "Content-Type": "text/html; charset=utf-8" } });
  }
}
// file e librerie: subito la copia salvata, intanto si aggiorna dalla rete
async function equoFile(e, req) {
  const cache = await caches.open(EQUO_CACHE);
  const salvata = await cache.match(req);
  const dallaRete = fetch(req).then((res) => {
    if (res && (res.ok || res.type === "opaque")) cache.put(req, res.clone());
    return res;
  }).catch(() => salvata);
  if (salvata) { e.waitUntil(dallaRete); return salvata; }
  return dallaRete;
}

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || EQUO_MAI.test(req.url)) return;
  const u = new URL(req.url);
  if (req.mode === "navigate" && u.origin === self.location.origin) { e.respondWith(equoPagina(req)); return; }
  if (u.origin === self.location.origin || EQUO_ESTERNI.test(u.hostname)) e.respondWith(equoFile(e, req));
});
