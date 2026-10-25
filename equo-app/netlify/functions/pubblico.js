// Equo · pagine pubbliche (26/10/2026)
//   /cavallo/CODICE  → scheda pubblica del cavallo (dal QR della Equo Card): solo dati non sensibili
//   /pro/NOME        → pagina pubblica del professionista (Equo CV, solo Premium) — vedi equo_pro_pubblico
// Le pagine sono HTML semplici, generate qui con la chiave di servizio: i dati arrivano da funzioni del database che
// restituiscono solo quello che si può mostrare a chiunque.
const { createClient } = require("@supabase/supabase-js");

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const APP = "https://app.equohub.com";
const LIVELLO = { provvisorio: "Provvisorio", validato: "Validato ✓", certificato: "Certificato ★" };

function pagina({ titolo, descr, corpo, immagine }) {
  return `<!doctype html><html lang="it"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(titolo)} · Equo</title><meta name="description" content="${esc(descr)}">
<meta property="og:title" content="${esc(titolo)}"><meta property="og:description" content="${esc(descr)}">${immagine ? `<meta property="og:image" content="${esc(immagine)}">` : ""}
<link rel="icon" href="${APP}/assets/icona-192.png">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;background:#f7f3ea;color:#22201c;min-height:100vh}
.hero{background:linear-gradient(160deg,#0e3328,#1f5a46 60%,#b8862c);color:#fff;padding:34px 20px 30px;text-align:center}
.hero.pro{background:linear-gradient(160deg,#2b1f08,#6b4f18 70%,#c98f2e)}
.foto{width:116px;height:116px;border-radius:50%;margin:0 auto 12px;background:rgba(255,255,255,.15) center/cover no-repeat;border:3px solid rgba(255,255,255,.7);display:grid;place-items:center;font-size:36px;font-weight:800}
.foto img{width:70%;height:70%;object-fit:contain}
h1{font-size:26px}
.sotto{opacity:.88;font-size:14px;margin-top:4px}
.bollino{display:inline-block;margin-top:12px;background:#1d9a5d;font-size:12px;font-weight:800;padding:5px 11px;border-radius:999px}
.bollino.grigio{background:rgba(255,255,255,.25)}
.wrap{max-width:560px;margin:0 auto;padding:0 18px 40px}
.btn{display:block;margin:16px 0 0;padding:15px;border-radius:14px;background:#c98f2e;color:#1f1708;text-align:center;font-weight:800;font-size:15px;text-decoration:none}
.btn.sec{background:#fff;border:1px solid #d9cdb2;color:#2b1f08;font-weight:700;margin-top:8px}
h2{font-size:12.5px;letter-spacing:1.2px;color:#7a6a4a;margin:22px 0 8px;text-transform:uppercase}
.card{background:#fff;border:1px solid #eadfc6;border-radius:14px;padding:12px 14px;margin-bottom:8px;font-size:14px;line-height:1.5}
.card b{display:block}.card span{color:#7a6a4a;font-size:12.5px}
.riga{display:flex;justify-content:space-between;gap:10px;padding:9px 0;border-top:1px solid #f0e8d6;font-size:14px}
.riga:first-child{border-top:0}.riga span{color:#7a6a4a}
.num{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.num div{background:#fff;border-radius:12px;padding:10px;text-align:center;border:1px solid #eadfc6}
.num b{display:block;font-size:20px;color:#2b1f08}.num small{font-size:11px;color:#7a6a4a}
.chips{display:flex;flex-wrap:wrap;gap:6px}.chips span{background:#2b1f08;color:#f2d9a6;font-size:12px;font-weight:700;padding:5px 9px;border-radius:7px}
.piede{text-align:center;font-size:12px;color:#9a8d74;padding:26px 18px 40px;line-height:1.5}
.codice{font-family:ui-monospace,Menlo,monospace;letter-spacing:1.5px;font-variant-numeric:slashed-zero}
</style></head><body>${corpo}</body></html>`;
}

function nonTrovato(cosa) {
  return { statusCode: 404, headers: { "Content-Type": "text/html; charset=utf-8" },
    body: pagina({ titolo: cosa + " non trovato", descr: "Equo", corpo: `<div class="hero"><h1>${esc(cosa)} non trovato</h1><p class="sotto">Il codice potrebbe essere sbagliato o non più valido.</p></div><div class="wrap"><a class="btn" href="${APP}">Apri Equo</a></div>` }) };
}

async function cavallo(sb, codice) {
  const { data, error } = await sb.rpc("equo_cavallo_pubblico", { p_codice: codice });
  if (error || !data) return nonTrovato("Cavallo");
  let foto = null;
  if (data.foto_path) {
    const r = await sb.storage.from("cavalli-album").createSignedUrl(data.foto_path, 3600);
    foto = r.data?.signedUrl || null;
  }
  const anni = data.anno ? new Date().getFullYear() - data.anno : null;
  const liv = data.livello || "provvisorio";
  const corpo = `<div class="hero"><div class="foto"${foto ? ` style="background-image:url('${esc(foto)}')"` : ""}>${foto ? "" : `<img src="${APP}/assets/equo-card-cavallo.png" alt="">`}</div>
  <h1>${esc(data.nome)}</h1><p class="sotto">${esc([data.razza, anni != null ? anni + " anni" : null].filter(Boolean).join(" · "))}</p>
  <span class="bollino${liv === "provvisorio" ? " grigio" : ""}">Codice Equo ${esc(LIVELLO[liv] || liv)}</span></div>
  <div class="wrap"><h2>Scheda del cavallo</h2><div class="card">
    <div class="riga"><span>Codice Equo</span><b class="codice">${esc(data.codice)}</b></div>
    <div class="riga"><span>Razza</span><b>${esc(data.razza || "–")}</b></div>
    <div class="riga"><span>Anno di nascita</span><b>${esc(data.anno || "–")}</b></div>
    <div class="riga"><span>Mantello</span><b>${esc(data.mantello || "–")}</b></div>
    <div class="riga"><span>Attività</span><b>${esc(data.attivita || "–")}</b></div>
    <div class="riga"><span>Dove sta</span><b>${esc(data.dove || "–")}</b></div></div>
    <a class="btn" href="${APP}">Scopri Equo: la cura del cavallo in un'app</a>
    <p class="piede">${liv === "provvisorio" ? "Codice provvisorio: i dati non sono ancora stati confermati da due persone." : "Dati confermati dal proprietario e da un professionista su Equo."}<br>Libretto sanitario, proprietario e contatti restano privati.</p></div>`;
  return { statusCode: 200, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=300" },
    body: pagina({ titolo: data.nome + " · Equo Card", descr: "Scheda Equo del cavallo " + data.nome, corpo, immagine: foto }) };
}

exports.handler = async (event) => {
  const q = event.queryStringParameters || {};
  let tipo = q.tipo, chiave = q.c;
  if (!tipo) { const m = String(event.path || "").match(/\/(cavallo|pro)\/([^/?#]+)/); if (m) { tipo = m[1]; chiave = decodeURIComponent(m[2]); } }
  chiave = String(chiave || "").slice(0, 80);
  if (!chiave) return nonTrovato("Pagina");
  const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  try {
    if (tipo === "cavallo") return await cavallo(sb, chiave);
    if (tipo === "pro" && exports.pro) return await exports.pro(sb, chiave, { pagina, esc, nonTrovato, APP });
  } catch (e) { console.error("pubblico:", e); }
  return nonTrovato("Pagina");
};
