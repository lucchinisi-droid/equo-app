/* ---------- stato ---------- */
const qs = new URLSearchParams(location.search);
const DEMO = qs.has("demo");
const leggi = (k, d) => { try{ const v = JSON.parse(localStorage.getItem(k)); return v ?? d; } catch(e){ return d; } };
const scrivi = (k, v) => { try{ localStorage.setItem(k, JSON.stringify(v)); } catch(e){} };
let S = DEMO ? { t:"demo", pin:"0000", lang: qs.get("lang") || "it" } : leggi(K_STATO, {});
let coda = DEMO ? [] : leggi(K_CODA, []);
let dati = DEMO ? null : leggi(K_CACHE, null);
let filtro = "tutti", focusBox = qs.get("b") || null, ultimoAgg = null, timerPoll = null, pinIns = "", pinPrimo = null, installEvt = null;
if(qs.get("t")){ if(qs.get("t") !== S.t){ S = { t: qs.get("t"), lang: S.lang }; dati = null; coda = []; scrivi(K_CODA, coda); scrivi(K_CACHE, null); } scrivi(K_STATO, S); }

const L = () => T[S.lang] || T.it;
const tr = (k, v = {}) => String(L()[k] ?? T.it[k] ?? k).replace(/\{(\w+)\}/g, (_, x) => v[x] ?? "");
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));
const oraAdesso = () => new Date().toLocaleTimeString("it-IT", { hour:"2-digit", minute:"2-digit", timeZone:"Europe/Rome" });
const oggiRoma = () => new Date().toLocaleDateString("sv-SE", { timeZone:"Europe/Rome" });
function applicaLingua(){ document.documentElement.lang = S.lang || "it"; document.documentElement.dir = S.lang === "ar" ? "rtl" : "ltr"; }
function toast(m){ const d = document.createElement("div"); d.className = "toast"; d.textContent = m; document.body.appendChild(d); setTimeout(() => d.remove(), 2600); }

