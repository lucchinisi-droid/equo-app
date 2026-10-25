/* ---------- POP-UP DI SISTEMA: OFFLINE e AGGIORNAMENTO ----------
   Offline: pop-up al centro + pillola in alto finché la connessione non torna.
   Aggiornamento: pop-up con "Cosa c'è di nuovo" (testo da version.json, scritto al deploy da novita.json).
   Il numero di versione mostrato (v1.0) NON cambia qui: lo decide solo Simone. */
let ultimoOnline = Date.now(), popOfflineMostrato = false, aggNovita = null;
try{ const t = Number(localStorage.getItem(CHIAVE_ULTIMO_ONLINE)); if(t) ultimoOnline = t; }catch(e){}
function segnaOnline(){ if(!navigator.onLine) return; ultimoOnline = Date.now(); try{ localStorage.setItem(CHIAVE_ULTIMO_ONLINE, String(ultimoOnline)); }catch(e){} }
setInterval(segnaOnline, 60000); segnaOnline();
function oraBreve(t){
  const d = new Date(t), oggi = new Date();
  const ora = d.toLocaleTimeString("it-IT", { hour:"2-digit", minute:"2-digit" });
  return d.toDateString() === oggi.toDateString() ? `alle ${ora}` : `il ${d.toLocaleDateString("it-IT", { day:"numeric", month:"long" })} alle ${ora}`;
}
function mostraPopOffline(){
  document.getElementById("eq-pop-off-testo").innerHTML = TESTO_OFFLINE();
  document.getElementById("eq-pop-off-ora").textContent = `Stai vedendo i dati aggiornati ${oraBreve(ultimoOnline)}.`;
  document.getElementById("eq-pop-offline").classList.add("attivo");
}
function chiudiPop(q){
  document.getElementById(q === "offline" ? "eq-pop-offline" : "eq-pop-agg").classList.remove("attivo");
  if(q === "offline" && !navigator.onLine) document.getElementById("eq-pill-offline").classList.add("attivo");
  if(q === "agg") document.getElementById("eq-pill-agg").classList.add("attivo");
}
function vaiOffline(){
  document.getElementById("eq-pill-agg").classList.remove("attivo");
  if(!popOfflineMostrato){ popOfflineMostrato = true; mostraPopOffline(); }
  else document.getElementById("eq-pill-offline").classList.add("attivo");
}
function tornaOnline(){
  segnaOnline();
  document.getElementById("eq-pop-offline").classList.remove("attivo");
  document.getElementById("eq-pill-offline").classList.remove("attivo");
  if(popOfflineMostrato){ popOfflineMostrato = false; showToast("Sei di nuovo online: dati aggiornati."); }
  if(typeof dopoRitornoOnline === "function") dopoRitornoOnline();
}
window.addEventListener("offline", vaiOffline);
window.addEventListener("online", tornaOnline);
if(!navigator.onLine) setTimeout(vaiOffline, 400);

function mostraPopAggiornamento(){
  document.getElementById("eq-pill-agg").classList.remove("attivo");
  document.getElementById("eq-pop-agg-testo").textContent = TESTO_AGGIORNAMENTO;
  const voci = Array.isArray(aggNovita?.voci) ? aggNovita.voci : [];
  document.getElementById("eq-pop-agg-novita").style.display = voci.length ? "block" : "none";
  document.getElementById("eq-pop-agg-lista").innerHTML = voci.map(v => `<li>${escapeHtml(v)}</li>`).join("");
  document.getElementById("eq-pop-agg").classList.add("attivo");
}
function segnalaAggiornamento(dati){
  aggNovita = dati || null;
  if(document.getElementById("eq-pop-agg").classList.contains("attivo") || document.getElementById("eq-pill-agg").classList.contains("attivo")) return;
  if(!navigator.onLine) return;
  mostraPopAggiornamento();
}
function aggiornaOra(){
  document.getElementById("eq-pop-agg").classList.remove("attivo");
  // ?aggiorna= dice al service worker di aspettare la versione nuova dalla rete (anche se lenta) invece della copia salvata
  const u = new URL(location.href); u.searchParams.set("aggiorna", Date.now().toString(36));
  location.replace(u.toString());
}
// tolgo ?aggiorna= dall'indirizzo dopo l'aggiornamento
try { const u = new URL(location.href); if(u.searchParams.has("aggiorna")){ u.searchParams.delete("aggiorna"); history.replaceState(history.state, "", u.pathname + u.search + u.hash); } } catch(e){}

// ---- Aggiornamento app: Netlify scrive il codice di build a ogni deploy (netlify/scrivi-build.js).
// Se online c'è un deploy più nuovo compare il banner "Nuova versione disponibile → Aggiorna".
// È un codice INTERNO, non la versione v1.0 mostrata nel menu.
const EQUO_BUILD = "__EQUO_BUILD__";
let ultimoControlloBuild = 0;
async function controllaAggiornamentoApp(){
  if(EQUO_BUILD.startsWith("__") || DEMO_MODE) return; // in locale / senza build Netlify: disattivato
  if(Date.now() - ultimoControlloBuild < 5 * 60 * 1000) return;
  ultimoControlloBuild = Date.now();
  try {
    const res = await fetch("/version.json?t=" + Date.now(), { cache: "no-store" });
    if(!res.ok) return;
    const dati = await res.json();
    if(dati.build && dati.build !== EQUO_BUILD) segnalaAggiornamento(dati.novita);
  } catch(e){ /* offline: riproverà */ }
}
document.addEventListener("visibilitychange", () => {
  if(document.visibilityState !== "visible") return;
  controllaAggiornamentoApp();
  if(document.getElementById("screen-app")?.classList.contains("active")) controllaNovitaAi();
});
async function caricaSwitchRiepilogo(){
  const sw = document.getElementById("riepilogo-switch");
  const swH = document.getElementById("riepilogo-hammer-switch");
  const boxH = document.getElementById("menu-hammer-riepilogo");
  if(boxH) boxH.style.display = agenteAiHammer() ? "block" : "none";
  caricaRichiamiPredefiniti();
  if(sw) sw.checked = true;
  if(swH) swH.checked = true;
  if(DEMO_MODE || !currentUser) return;
  const { data } = await sb.from("profiles").select("riepilogo_settimanale, riepilogo_hammer").eq("id", currentUser.id).maybeSingle();
  if(sw) sw.checked = data?.riepilogo_settimanale !== false;
  if(swH) swH.checked = data?.riepilogo_hammer !== false;
}
async function toggleRiepilogoHammer(attivo){
  if(DEMO_MODE || !currentUser){ showToast(attivo ? "Riepilogo attivato" : "Riepilogo disattivato"); return; }
  const { error } = await sb.from("profiles").update({ riepilogo_hammer: attivo }).eq("id", currentUser.id);
  if(error){ console.error("toggleRiepilogoHammer:", error); document.getElementById("riepilogo-hammer-switch").checked = !attivo; showToast("Non sono riuscito a salvare, riprova."); return; }
  showToast(attivo ? "Hammer ti manderà il riepilogo ogni lunedì" : "Riepilogo settimanale disattivato");
}
async function toggleRiepilogoSettimanale(attivo){
  if(DEMO_MODE || !currentUser){ showToast(attivo ? "Riepilogo attivato" : "Riepilogo disattivato"); return; }
  const { error } = await sb.from("profiles").update({ riepilogo_settimanale: attivo }).eq("id", currentUser.id);
  if(error){ console.error("toggleRiepilogoSettimanale:", error); document.getElementById("riepilogo-switch").checked = !attivo; showToast("Non sono riuscito a salvare, riprova."); return; }
  showToast(attivo ? "Pegasus ti manderà il riepilogo ogni lunedì" : "Riepilogo settimanale disattivato");
}
function aggiornaAltezzaAiSheet(){
  const vv = window.visualViewport;
  const h = vv ? vv.height : window.innerHeight;
  document.documentElement.style.setProperty("--ai-vh", h + "px");
  const ov = document.getElementById("ai-sheet-overlay");
  // con la tastiera aperta su iOS la pagina scorre: il pannello segue la parte visibile
  if(ov && vv){ ov.style.top = vv.offsetTop + "px"; ov.style.height = vv.height + "px"; ov.style.bottom = "auto"; }
}
if(window.visualViewport){
  window.visualViewport.addEventListener("resize", () => { if(document.body.classList.contains("ai-aperta")) aggiornaAltezzaAiSheet(); });
  window.visualViewport.addEventListener("scroll", () => { if(document.body.classList.contains("ai-aperta")) aggiornaAltezzaAiSheet(); });
}
async function openAiSheet(){ const alt = versioneDelRuolo("openAiSheet"); if(alt) return alt.apply(this, arguments); return openAiSheetBase.apply(this, arguments); }
async function openAiSheetBase(){
  Registro.pagina("assistente-ai");
  try{ hpPreparaPannello(); }catch(e){ console.error("pannello Hammer:", e); }
  aggiornaAltezzaAiSheet();
  document.body.classList.add("ai-aperta");
  document.getElementById("ai-sheet-overlay").classList.add("active");
  aggiornaTestataAi();
  const conNovita = document.getElementById("ai-fab")?.classList.contains("con-novita");
  segnaNovitaLette();
  // se ha cambiato vista (proprietario ↔ professionista) o sono arrivate novità, si ricarica la conversazione
  const ricarica = typeof aiServeRicarica === "function" && aiServeRicarica();
  if(aiStoriaCaricata && (aiStoriaVista !== vistaAi() || conNovita || ricarica)){
    document.querySelectorAll("#chat-messages .chat-bubble:not(#ai-benvenuto), #chat-messages .ai-ripresa, #chat-messages .hp-scelte").forEach(el => el.remove());
    aiStoriaCaricata = false;
  }
  if(!aiStoriaCaricata && !DEMO_MODE && currentUser){
    aiStoriaCaricata = true;
    aiStoriaVista = vistaAi();
    await caricaStoriaAi();
    await aggiornaNotaUsoAi();
  }
}
async function caricaStoriaAi(){
  // chat a giorni con storico (27/10/2026); se lo SQL non c'è ancora si carica la conversazione unica come prima
  if(typeof caricaChatAiGiorni === "function" && await caricaChatAiGiorni().catch(e => { console.error("chat a giorni:", e); return false; })) return;
  const { data, error } = await sb.from("ai_messaggi").select("ruolo, contenuto").eq("user_id", currentUser.id).eq("vista", vistaAi()).order("created_at", { ascending: false }).limit(20);
  if(error){ console.error("caricaStoriaAi:", error); return; }
  const box = document.getElementById("chat-messages");
  (data || []).reverse().forEach(m => {
    box.insertAdjacentHTML("beforeend", m.ruolo === "user"
      ? `<div class="chat-bubble user">${escapeHtml(m.contenuto)}</div>`
      : `<div class="chat-bubble ai">${formattaRispostaAi(m.contenuto)}</div>`);
  });
  box.scrollTop = box.scrollHeight;
}
async function aggiornaNotaUsoAi(uso){
  const el = document.getElementById("ai-usage-note");
  if(!el) return;
  if(!uso && !DEMO_MODE && currentUser){
    // Free: 5 al giorno (chiave AAAA-MM-GG, riparte a mezzanotte); Premium: 500 al mese (AAAA-MM)
    const oggi = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Rome" });
    const prem = isPremium();
    const { data } = await sb.from("ai_utilizzo").select("conteggio").eq("user_id", currentUser.id).eq("mese", prem ? oggi.slice(0, 7) : oggi).maybeSingle();
    uso = { usati: data?.conteggio || 0, limite: prem ? 500 : 5, periodo: prem ? "mese" : "giorno" };
  }
  if(!uso){ el.textContent = ""; return; }
  const alGiorno = uso.periodo === "giorno" || (!uso.periodo && uso.limite <= 5);
  el.textContent = `${uso.usati} di ${uso.limite} messaggi AI ${alGiorno ? "oggi" : "questo mese"}` + (alGiorno ? " · Premium: 500 al mese" : "");
}
async function nuovaConversazioneAi(){
  if(!confirm(`Cancellare la conversazione con ${nomeAgenteAi()}? Le note che ha memorizzato restano.`)) return;
  if(!DEMO_MODE && currentUser){
    const { error } = await sb.from("ai_messaggi").delete().eq("user_id", currentUser.id).eq("vista", vistaAi());
    if(error){ showToast("Non sono riuscito a cancellare, riprova."); return; }
  }
  const box = document.getElementById("chat-messages");
  box.querySelectorAll(".chat-bubble:not(#ai-benvenuto)").forEach(el => el.remove());
  showToast("Nuova conversazione");
}
// Markdown minimo e sicuro: prima si fa l'escape, poi grassetto, corsivo, link, elenchi e paragrafi.
function formattaRispostaAi(testo){
  testo = String(testo || "").replace(/\n?[ \t]*\**Scelte:\**[^\n]*\s*$/i, "");
  testo = testo.replace(/^#{1,4}[ \t]*(.+)$/gm, "**$1**");
  const righe = escapeHtml(testo || "").split("\n");
  let html = "", inLista = false;
  const inline = s => s
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*(?!\s)(.+?)\*(?!\*)/g, "$1<em>$2</em>")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    .replace(/(^|[\s(])(https?:\/\/[^\s<)]+)/g, '$1<a href="$2" target="_blank" rel="noopener">$2</a>');
  // elenchi puntati e numerati (i passi delle procedure restano numerati)
  righe.forEach(r => {
    const num = r.match(/^\s*\d+[.)]\s+(.*)$/), pun = r.match(/^\s*[-•*]\s+(.*)$/);
    if(num || pun){ const t = num ? "ol" : "ul"; if(inLista !== t){ if(inLista) html += `</${inLista}>`; html += `<${t}>`; inLista = t; } html += `<li>${inline((num || pun)[1])}</li>`; return; }
    if(inLista){ html += `</${inLista}>`; inLista = false; }
    if(r.trim()) html += `<p>${inline(r.replace(/^#+\s*/, ""))}</p>`;
  });
  if(inLista) html += `</${inLista}>`;
  return html || "<p></p>";
}

let toastTimer = null;
function showToast(message){
  const el = document.getElementById("toast");
  el.textContent = message;
  el.classList.add("active");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("active"), Math.max(2600, Math.min(7000, String(message || "").length * 60)));
}
function showAiComingSoon(){ openAiSheet(); }
function closeAiSheet(){ document.getElementById("ai-sheet-overlay").classList.remove("active"); document.body.classList.remove("ai-aperta"); }

