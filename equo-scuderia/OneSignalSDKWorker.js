// OneSignal Web SDK v16: il worker DEVE importare OneSignalSDK.sw.js (non il vecchio worker v15 /sdks/OneSignalSDKWorker.js).
importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');

/* Tocco su una notifica: salviamo quale chat aprire. Su iPhone l'app installata a volte si riapre
   sulla Home senza i parametri della notifica: la pagina legge questo appunto all'avvio e quando torna in primo piano. */
self.addEventListener("notificationclick", (e) => {
  try {
    const trova = (o, liv) => {
      if (!o || typeof o !== "object" || liv > 6) return null;
      if (o.apri === "chat") return o;
      for (const k in o) { const r = trova(o[k], liv + 1); if (r) return r; }
      return null;
    };
    let dati = e.notification && e.notification.data;
    if (typeof dati === "string") { try { dati = JSON.parse(dati); } catch (_) {} }
    const d = trova(dati, 0);
    if (d) e.waitUntil(caches.open("equo-notifica").then((c) => c.put("/__ultima-notifica",
      new Response(JSON.stringify({ d, t: Date.now() }), { headers: { "Content-Type": "application/json" } }))));
  } catch (_) {}
});

/* =====================================================================
   EQUO OFFLINE — stesso service worker delle notifiche push (uno solo per sito, niente conflitti).
   - Pagine (index.html, /groom): prima la rete, senza rete l'ultima copia salvata → l'app si apre sempre.
   - File del sito e librerie esterne (icone, font, database, PDF, QR, mappe): copia salvata, aggiornata in sottofondo.
   - MAI salvati: dati del database, funzioni del server, version.json (aggiornamenti), statistiche.
   ===================================================================== */
const EQUO_CACHE = "equo-offline-v2"; // v2: elimina le copie vecchie rimaste bloccate
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

// pagine: prima la rete. Se la rete è lenta (oltre 6 s) si apre la copia salvata MA il download continua in
// sottofondo e la copia si aggiorna: alla prossima apertura c'è la versione nuova. (Prima il download veniva
// interrotto: su connessioni lente, es. iPad, l'app restava per sempre alla versione vecchia.)
// Con ?aggiorna= (tasto «Aggiorna») o senza copia salvata si aspetta la rete fino a 45 s.
async function equoPagina(e, req) {
  const u = new URL(req.url);
  const chiave = u.origin + u.pathname;
  const cache = await caches.open(EQUO_CACHE);
  const dallaRete = fetch(req).then(async (res) => {
    if (res && res.ok && !res.redirected) await cache.put(chiave, res.clone());
    return res;
  });
  e.waitUntil(dallaRete.catch(() => {}));
  const salvata = (await cache.match(chiave)) || (await cache.match(u.origin + "/"));
  const pazienza = u.searchParams.has("aggiorna") || !salvata ? 45000 : 6000;
  try {
    const res = await Promise.race([dallaRete, new Promise((_, no) => setTimeout(() => no(new Error("rete lenta")), pazienza))]);
    if (res && (res.ok || !salvata)) return res;
    return salvata || res;
  } catch (err) {
    return salvata || new Response(
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
  if (req.mode === "navigate" && u.origin === self.location.origin) { e.respondWith(equoPagina(e, req)); return; }
  if (u.origin === self.location.origin || EQUO_ESTERNI.test(u.hostname)) e.respondWith(equoFile(e, req));
});
