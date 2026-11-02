// Equo · agenti AI · DETTATURA (2/11/2026): una sola chiamata, niente strumenti, risposta JSON controllata qui.
// Usata da netlify/functions/agent.js con modalita "dettatura" (body.dettatura = "referto" | "ferratura").
const { MODELLO } = require("./configurazione");
const { oggiISO } = require("./aiuti");
const { ISTRUZIONI_DETTATURA_FERRATURA, ISTRUZIONI_DETTATURA_REFERTO } = require("./istruzioni-dettatura");

const DETTAGLI_CORRETTIVO = ["Pad", "Soletta", "Alluminio", "Pianella", "Banda larga in punta", "Ferro asimmetrico"];
const testo = (v, max) => (typeof v === "string" ? v.replace(/\r/g, "").trim().slice(0, max) : "");

// il modello a volte avvolge il JSON in ```: si prende il primo oggetto completo
function leggiJson(s) {
  const t = String(s || "").replace(/```(?:json)?/gi, "");
  const a = t.indexOf("{"), b = t.lastIndexOf("}");
  if (a < 0 || b <= a) return null;
  try { return JSON.parse(t.slice(a, b + 1)); } catch (_) { return null; }
}

function pulisciReferto(j) {
  return { relazione: testo(j.relazione, 6000), terapia: testo(j.terapia, 3000), da_controllare: testo(j.da_controllare, 400) };
}
function pulisciFerratura(j) {
  const s = j.scheda && typeof j.scheda === "object" ? j.scheda : {};
  const scheda = {};
  if (["completa", "mezza", "pareggio"].includes(s.lavoro)) scheda.lavoro = s.lavoro;
  if (["standard", "correttivo"].includes(s.ferro_tipo)) scheda.ferro_tipo = s.ferro_tipo;
  if (["standard", "correttivo"].includes(s.ferro_tipo_post)) scheda.ferro_tipo_post = s.ferro_tipo_post;
  const det = (l) => (Array.isArray(l) ? DETTAGLI_CORRETTIVO.filter((d) => l.some((x) => String(x).toLowerCase() === d.toLowerCase())) : []);
  if (det(s.dettagli).length) scheda.dettagli = det(s.dettagli);
  if (det(s.dettagli_post).length) scheda.dettagli_post = det(s.dettagli_post);
  if (s.misura != null && String(s.misura).trim()) scheda.misura = String(s.misura).trim().slice(0, 10);
  const g = Math.round(Number(s.intervallo_giorni));
  if (Number.isFinite(g) && g >= 7 && g <= 180) scheda.intervallo_giorni = g;
  if (testo(s.note, 160)) scheda.note = testo(s.note, 160);
  if (testo(s.avviso_sicurezza, 160)) scheda.avviso_sicurezza = testo(s.avviso_sicurezza, 160);
  return { nota_lavoro: testo(j.nota_lavoro, 2000), scheda, per_proprietario: testo(j.per_proprietario, 1500), da_controllare: testo(j.da_controllare, 400) };
}

// tipo: "referto" | "ferratura"; ritorna { ok, dati, usage }
async function eseguiDettatura({ tipo, dettato, contestoApp }) {
  const contesto = [
    `Oggi è ${new Date().toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Rome" })} (${oggiISO()}).`,
    tipo === "ferratura" ? "Scelte del correttivo possibili: " + DETTAGLI_CORRETTIVO.join(", ") + "." : "",
    contestoApp ? (tipo === "referto" ? "DATI DELLA SCHEDA DELLA VISITA (compilati a mano dal veterinario):\n" : "SCHEDA FERRATURA ATTUALE DEL CAVALLO:\n") + contestoApp : "",
  ].filter(Boolean).join("\n");
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({
      model: MODELLO,
      max_tokens: 2500,
      system: [
        { type: "text", text: tipo === "ferratura" ? ISTRUZIONI_DETTATURA_FERRATURA : ISTRUZIONI_DETTATURA_REFERTO, cache_control: { type: "ephemeral" } },
        { type: "text", text: contesto },
      ],
      messages: [{ role: "user", content: "DETTATO:\n" + dettato }],
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) { console.error("Dettatura, errore Claude API:", JSON.stringify(data).slice(0, 500)); return { ok: false, usage: {} }; }
  const scritto = (Array.isArray(data.content) ? data.content : []).filter((b) => b.type === "text").map((b) => b.text).join("");
  const j = leggiJson(scritto);
  if (!j) { console.error("Dettatura: risposta non JSON", scritto.slice(0, 300)); return { ok: false, usage: data.usage || {} }; }
  return { ok: true, dati: tipo === "ferratura" ? pulisciFerratura(j) : pulisciReferto(j), usage: data.usage || {} };
}

module.exports = { eseguiDettatura, leggiJson, pulisciFerratura, pulisciReferto };
