// RADAR DI MERLINO — generazione (funzione background: fino a 15 minuti).
// Ricerca web SOLO di informazioni pubbliche sulle strutture equestri della zona del centro: offerte e prezzi
// pubblicati, eventi e iniziative, reputazione online, opportunità (gare, bandi) + mosse consigliate.
// Salva in merlino_radar e avvisa lo staff con una push sull'app Equo Scuderia.
const { createClient } = require("@supabase/supabase-js");
const { firma, zonaCentro } = require("../lib/radar-comune");
const MODELLO = process.env.EQUO_AI_MODEL || "claude-sonnet-5";
const PREZZI = { "claude-sonnet-5": { in: 2, out: 10 }, "claude-haiku-4-5-20251001": { in: 1, out: 5 } };

exports.handler = async (event) => {
  let body = {}; try { body = JSON.parse(event.body || "{}"); } catch (e) { return; }
  const centroId = String(body.centro_id || "");
  if (!centroId || event.headers["x-equo-firma"] !== firma(centroId)) { console.error("radar: firma non valida"); return; }
  const admin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  const { data: c } = await admin.from("centri").select("id, nome, indirizzo, citta, provincia, regione").eq("id", centroId).maybeSingle();
  if (!c) return;
  const zona = zonaCentro(c);
  if (!zona) return;
  const { data: stat } = await admin.rpc("centro_limiti", { p_centro_id: centroId });
  if (!stat?.radar) return;
  const { data: prezzi } = await admin.from("scuderia_pacchetti").select("tipo, prezzo, unita_totali").eq("centro_id", centroId).gt("prezzo", 0).gte("data_inizio", new Date(Date.now() - 365 * 86400000).toISOString().slice(0, 10)).limit(60);
  const media = (t, f) => { const v = (prezzi || []).filter((p) => p.tipo === t).map(f).filter((x) => x > 0); return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : null; };
  const nostri = [`lezione da carnet ≈ ${media("carnet", (p) => p.prezzo / (p.unita_totali || 1)) ?? "n.d."} €`, `pensione ≈ ${media("pensione", (p) => p.prezzo) ?? "n.d."} €/mese`, `abbonamento ≈ ${media("abbonamento", (p) => p.prezzo) ?? "n.d."} €`].join(", ");
  const oggi = new Date().toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Rome" });

  const system = `Sei Merlino, l'agente di Equo Scuderia per numeri e strategia. Prepari "Il radar di Merlino": un briefing settimanale sulla concorrenza e sulle opportunità nella zona del centro ippico "${c.nome}" (${zona}). Oggi è ${oggi}.
Regole: usa la ricerca web e riporta SOLO informazioni pubbliche trovate nei risultati (siti, pagine social pubbliche, schede Google, calendari di gare, bandi). Mai dati personali di privati, mai informazioni non verificabili, mai inventare prezzi o eventi: se non trovi qualcosa scrivi che non è pubblicato. Non denigrare nessuno. Link solo presi dai risultati, nel formato [titolo](url). Italiano, tono da consulente pratico.`;
  const prompt = `Prepara il radar per ${c.nome} (${zona}). I prezzi medi del centro (dai suoi pacchetti) sono: ${nostri}.
Cerca strutture equestri (maneggi, centri ippici, scuderie, circoli) entro circa 30 km e scrivi il briefing con ESATTAMENTE queste sezioni (titoli in grassetto, punti brevi):
**In sintesi** — 2-3 righe con la notizia più importante della settimana.
**Offerte e prezzi della concorrenza** — offerte, promozioni, campi estivi/invernali, carnet, pensioni con i prezzi SE pubblicati; confronta con i prezzi del centro.
**Eventi e iniziative** — gare, stage, open day, eventi nelle prossime settimane nella zona o nella regione.
**Reputazione online** — voti e temi ricorrenti delle recensioni pubbliche delle strutture principali (se trovi anche il centro stesso, includilo).
**Opportunità** — bandi, contributi o finanziamenti regionali per sport/equitazione/agricoltura, gare dove portare gli allievi, tendenze.
**Mosse consigliate** — 3 azioni concrete e numerate per il centro, ognuna con il perché.
Massimo circa 350 parole in totale.`;

  const messages = [{ role: "user", content: prompt }];
  let testo = "", fonti = [], cin = 0, cout = 0, ricerche = 0;
  try {
    for (let giro = 0; giro < 4; giro++) {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({ model: MODELLO, max_tokens: 2500, system, messages,
          tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 8, user_location: { type: "approximate", country: "IT", region: c.regione || undefined, city: c.citta || undefined, timezone: "Europe/Rome" } }] }),
      });
      const data = await res.json();
      if (!res.ok) { console.error("radar API:", JSON.stringify(data).slice(0, 400)); return; }
      cin += data.usage?.input_tokens || 0; cout += data.usage?.output_tokens || 0; ricerche += data.usage?.server_tool_use?.web_search_requests || 0;
      const blocchi = data.content || [];
      for (const b of blocchi) {
        if (b.type === "text") {
          testo += b.text;
          for (const ci of b.citations || []) if (ci.url && !fonti.some((f) => f.url === ci.url)) fonti.push({ titolo: ci.title || ci.url, url: ci.url });
        }
      }
      if (data.stop_reason === "pause_turn") { messages.push({ role: "assistant", content: blocchi }); testo = ""; continue; }
      break;
    }
  } catch (e) { console.error("radar:", e); return; }
  testo = testo.trim();
  if (!testo) return;
  const p = PREZZI[MODELLO] || PREZZI["claude-sonnet-5"];
  const costo = (cin * p.in + cout * p.out) / 1e6 + ricerche * 0.01;
  await admin.from("merlino_radar").insert({ centro_id: centroId, testo, fonti: fonti.slice(0, 20), zona, costo_usd: Math.round(costo * 10000) / 10000, richiesto_da: body.richiesto_da || null });

  // push allo staff (admin e livello 2-3) sull'app Equo Scuderia
  if (process.env.ONESIGNAL_SCUDERIA_APP_ID && process.env.ONESIGNAL_SCUDERIA_REST_API_KEY) {
    const { data: staff } = await admin.from("scuderia_membri").select("user_id").eq("centro_id", centroId).neq("ruolo", "proprietario").in("livello", ["admin", "2", "3"]);
    const ids = [...new Set((staff || []).map((s) => s.user_id).filter(Boolean))];
    if (ids.length) {
      const link = { apri: "statistiche", sez: "radar" };
      await fetch("https://api.onesignal.com/notifications?c=push", {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Key ${process.env.ONESIGNAL_SCUDERIA_REST_API_KEY}` },
        body: JSON.stringify({ app_id: process.env.ONESIGNAL_SCUDERIA_APP_ID, target_channel: "push", include_aliases: { external_id: ids },
          headings: { en: "🔮 Il radar di Merlino" }, contents: { en: "Novità sulla concorrenza e mosse consigliate per il tuo centro: dai un'occhiata." },
          data: link, url: "https://scuderia.equohub.com/?" + new URLSearchParams(link).toString() }),
      }).catch((e) => console.error("push radar:", e));
    }
  }
};
