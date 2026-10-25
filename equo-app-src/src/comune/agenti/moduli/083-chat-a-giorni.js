// Equo App · agenti AI · modulo (moduli ES, costruiti con Vite in comune/agenti/costruito.js)
/* ---------- CHAT DEGLI AGENTI A GIORNI, CON STORICO (27/10/2026) ----------
   Ogni giorno una chat nuova (tabella ai_conversazioni; il server mette i messaggi nella chat del giorno).
   In alto: archivio (con il numero) e «+» per una chat nuova (la precedente resta nello storico).
   Archivio: ricerca per parola, cavallo o cliente; riapri, rinomina, fissa, elimina.
   Messaggi importanti (promemoria, risposte dei Boss): evidenziati, con i loro tasti; finché non li leggi sopra l'icona
   dell'agente compare «Messaggio importante». Se lo SQL non è ancora stato eseguito, la chat funziona come prima. */
let aiConvId = null;            // chat aperta (null = chat del giorno)
let aiConvInfo = null;          // { id, titolo, giorno, fissata }
let aiConvRiaperta = false;     // true = chat scelta dallo storico (non si cambia da sola il giorno dopo)
let aiArchivio = [];
let aiArchCerca = "", aiArchTimer = null, aiArchTrovate = null;
let aiSqlPronto = true;
const MESI_IT = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"];
const oggiRoma = () => new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Rome" });
const giornoLungo = iso => { const [y, m, d] = iso.split("-").map(Number); return new Date(y, m - 1, d).toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" }); };
const giornoBreve = iso => { const [y, m, d] = iso.split("-").map(Number); return `${d} ${MESI_IT[m - 1].slice(0, 3)}`; };
const sqlMancante = e => /ai_conversazioni|conversazione_id|importante|does not exist|schema cache/i.test(e?.message || "");

async function aiConvDelGiorno(){
  const { data, error } = await sb.from("ai_conversazioni").select("id, titolo, giorno, fissata, n_messaggi")
    .eq("user_id", currentUser.id).eq("vista", vistaAi()).eq("chiave", "").eq("giorno", oggiRoma())
    .order("aggiornata_il", { ascending: false }).limit(1);
  if(error){ if(sqlMancante(error)) aiSqlPronto = false; return null; }
  return data?.[0] || null;
}

// bolla di un messaggio salvato (anche importante, con i suoi tasti)
function aiBollaHtml(m){
  if(m.ruolo === "user") return `<div class="chat-bubble user">${escapeHtml(m.contenuto)}</div>`;
  const imp = m.importante;
  const tasti = imp && m.azione && typeof pmTastiChat === "function" ? pmTastiChat(m.azione) : "";
  return `<div class="chat-bubble ai${imp ? " importante" : ""}" data-msg="${m.id || ""}">${imp ? '<div class="ai-imp-testa">Messaggio importante</div>' : ""}${formattaRispostaAi(m.contenuto)}${tasti}</div>`;
}

// carica la chat aperta (o quella del giorno). Torna false se lo SQL non c'è ancora: si usa il modo di prima.
async function caricaChatAiGiorni(){
  if(DEMO_MODE || !currentUser) return false;
  const box = document.getElementById("chat-messages");
  let conv = null;
  if(aiConvId){
    const { data, error } = await sb.from("ai_conversazioni").select("id, titolo, giorno, fissata, n_messaggi").eq("id", aiConvId).maybeSingle();
    if(error && sqlMancante(error)){ aiSqlPronto = false; return false; }
    conv = data || null;
    if(!conv) aiConvId = null;
  }
  if(!conv) conv = await aiConvDelGiorno();
  if(!aiSqlPronto) return false;
  aiConvInfo = conv;
  box.querySelectorAll(".chat-bubble:not(#ai-benvenuto), .hp-scelte, .ai-ripresa").forEach(el => el.remove());
  if(conv){
    const { data: msg, error } = await sb.from("ai_messaggi").select("id, ruolo, contenuto, importante, letto_at, azione, created_at")
      .eq("conversazione_id", conv.id).order("created_at", { ascending: true }).limit(300);
    if(error){ console.error("chat agente:", error); return true; }
    if(conv.giorno !== oggiRoma()) box.insertAdjacentHTML("beforeend", `<div class="ai-ripresa">Stai riprendendo la chat del <b>${giornoLungo(conv.giorno)}</b>: ${escapeHtml(nomeAgenteAi())} ricorda i suoi messaggi. Scrivendo qui la conversazione continua in questa chat. <button type="button" onclick="aiTornaAOggi()">Torna a oggi</button></div>`);
    (msg || []).forEach(m => box.insertAdjacentHTML("beforeend", aiBollaHtml(m)));
    const daLeggere = (msg || []).filter(m => m.importante && !m.letto_at).map(m => m.id);
    if(daLeggere.length){ await sb.rpc("ai_segna_importanti_letti", { p_ids: daLeggere }); aiControllaImportanti(); }
  }
  aiAggiornaTestataChat();
  box.scrollTop = box.scrollHeight;
  aiContaArchivio();
  return true;
}
function aiAggiornaTestataChat(){
  const el = document.getElementById("ai-chat-sotto");
  if(!el) return;
  const c = aiConvInfo;
  el.textContent = !c || c.giorno === oggiRoma() ? (c?.titolo ? c.titolo + " · oggi" : "Oggi · " + giornoLungo(oggiRoma())) : (c.titolo || "Chat") + " · " + giornoBreve(c.giorno);
}
// risposta del server: la chat in cui è finito il messaggio
function aiConvDaRisposta(conv){
  if(!conv?.id) return;
  const nuova = !aiConvInfo || aiConvInfo.id !== conv.id;
  aiConvId = conv.id;
  aiConvInfo = { ...(aiConvInfo && !nuova ? aiConvInfo : {}), id: conv.id, titolo: conv.titolo || aiConvInfo?.titolo || null, giorno: conv.giorno || aiConvInfo?.giorno || oggiRoma() };
  aiAggiornaTestataChat();
  if(nuova) aiContaArchivio();
}
function aiConvPerInvio(){ return aiSqlPronto ? aiConvId : null; }
// all'apertura del pannello: si ricarica se ci sono messaggi importanti nuovi o se è cambiato il giorno
function aiServeRicarica(){
  // nuovo giorno: se la chat aperta non è stata riaperta apposta dallo storico, si passa alla chat di oggi
  if(aiConvInfo && aiConvInfo.giorno !== oggiRoma() && !aiConvRiaperta){ aiConvId = null; return true; }
  return document.body.classList.contains("ai-con-importante");
}

// «+»: chat nuova, la precedente resta nello storico
async function aiNuovaChat(){
  if(DEMO_MODE || !currentUser || !aiSqlPronto) return typeof nuovaConversazioneAi === "function" ? nuovaConversazioneAi() : null;
  const box = document.getElementById("chat-messages");
  const vuota = !box.querySelector(".chat-bubble:not(#ai-benvenuto)");
  if(vuota && (!aiConvInfo || aiConvInfo.giorno === oggiRoma())){ showToast("Sei già in una chat nuova"); return; }
  const { data, error } = await sb.from("ai_conversazioni").insert({ user_id: currentUser.id, vista: vistaAi(), chiave: "" }).select("id, titolo, giorno, fissata").single();
  if(error){ showToast("Non sono riuscito ad aprire una chat nuova, riprova."); return; }
  aiConvId = data.id; aiConvInfo = data; aiConvRiaperta = false;
  box.querySelectorAll(".chat-bubble:not(#ai-benvenuto), .hp-scelte, .ai-ripresa").forEach(el => el.remove());
  aiAggiornaTestataChat(); aiContaArchivio();
  showToast("Chat nuova: la precedente è nello storico");
  document.getElementById("chat-input")?.focus();
}
async function aiTornaAOggi(){ aiConvId = null; aiConvRiaperta = false; await caricaChatAiGiorni(); }

/* ---- archivio ---- */
async function aiContaArchivio(){
  const el = document.getElementById("ai-arch-n");
  if(!el || DEMO_MODE || !currentUser || !aiSqlPronto) return;
  const { count } = await sb.from("ai_conversazioni").select("id", { count: "exact", head: true }).eq("user_id", currentUser.id).eq("vista", vistaAi()).eq("chiave", "").gt("n_messaggi", 0);
  el.textContent = count ? String(count) : "";
}
async function aiApriArchivio(){
  const arch = document.getElementById("ai-arch");
  if(!arch) return;
  if(!aiSqlPronto){ showToast("Lo storico delle chat arriva con l'aggiornamento di Equo."); return; }
  document.getElementById("ai-arch-tit").textContent = "Chat con " + nomeAgenteAi();
  document.getElementById("ai-arch-cerca").value = aiArchCerca = ""; aiArchTrovate = null;
  arch.hidden = false;
  document.getElementById("ai-arch-lista").innerHTML = '<div class="loading"><div class="spinner"></div> Carico le chat…</div>';
  const { data, error } = await sb.from("ai_conversazioni").select("id, titolo, giorno, fissata, n_messaggi, aggiornata_il")
    .eq("user_id", currentUser.id).eq("vista", vistaAi()).eq("chiave", "").order("aggiornata_il", { ascending: false }).limit(300);
  if(error){ document.getElementById("ai-arch-lista").innerHTML = '<div class="muted">Non riesco a leggere lo storico, riprova.</div>'; return; }
  aiArchivio = (data || []).filter(c => c.n_messaggi > 0 || c.id === aiConvInfo?.id);
  document.getElementById("ai-arch-sotto").textContent = `${aiArchivio.length} chat nello storico`;
  aiDisegnaArchivio();
}
function aiChiudiArchivio(){ const a = document.getElementById("ai-arch"); if(a) a.hidden = true; }
function aiCercaArchivio(v){
  aiArchCerca = String(v || "").trim();
  clearTimeout(aiArchTimer);
  aiArchTimer = setTimeout(async () => {
    if(aiArchCerca.length < 2){ aiArchTrovate = null; return aiDisegnaArchivio(); }
    const q = aiArchCerca.replace(/[%_,()]/g, " ");
    const { data } = await sb.from("ai_messaggi").select("conversazione_id").eq("user_id", currentUser.id).eq("vista", vistaAi()).ilike("contenuto", `%${q}%`).limit(500);
    aiArchTrovate = new Set((data || []).map(r => r.conversazione_id));
    aiDisegnaArchivio();
  }, 250);
}
function aiDisegnaArchivio(){
  const box = document.getElementById("ai-arch-lista");
  if(!box) return;
  const q = aiArchCerca.toLowerCase();
  const lista = aiArchivio.filter(c => !aiArchTrovate || aiArchTrovate.has(c.id) || (c.titolo || "").toLowerCase().includes(q));
  const oggi = oggiRoma();
  const lun = (() => { const d = new Date(); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d.toLocaleDateString("sv-SE"); })();
  const gruppi = [];
  const metti = (t, c) => { let g = gruppi.find(x => x.t === t); if(!g) gruppi.push(g = { t, l: [] }); g.l.push(c); };
  lista.forEach(c => {
    if(c.id === aiConvInfo?.id && c.giorno === oggi) metti("In corso", c);
    else if(c.fissata) metti("Fissate", c);
    else if(c.giorno === oggi) metti("Oggi", c);
    else if(c.giorno >= lun) metti("Questa settimana", c);
    else { const [y, m] = c.giorno.split("-").map(Number); metti(MESI_IT[m - 1][0].toUpperCase() + MESI_IT[m - 1].slice(1) + (y !== new Date().getFullYear() ? " " + y : ""), c); }
  });
  const ordine = ["In corso", "Fissate", "Oggi", "Questa settimana"];
  gruppi.sort((a, b) => (ordine.indexOf(a.t) + 1 || 99) - (ordine.indexOf(b.t) + 1 || 99));
  const quando = c => c.giorno === oggi ? new Date(c.aggiornata_il).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })
    : c.giorno >= lun ? new Date(c.giorno + "T12:00").toLocaleDateString("it-IT", { weekday: "short", day: "numeric" }) : giornoBreve(c.giorno);
  box.innerHTML = !lista.length ? `<div class="ai-arch-vuoto">${aiArchCerca ? "Nessuna chat con «" + escapeHtml(aiArchCerca) + "»" : "Ancora nessuna chat nello storico"}</div>`
    : gruppi.map(g => `<div class="ai-arch-g">${escapeHtml(g.t)}</div>` + g.l.map(c => `
      <div class="ai-arch-r${c.id === aiConvInfo?.id ? " corrente" : ""}" data-id="${c.id}">
        <button type="button" class="ai-arch-apri" onclick="aiRiapriChat('${c.id}')">
          <span class="ai-arch-ic">${c.fissata ? "📌" : "💬"}</span>
          <span class="ai-arch-c"><b>${escapeHtml(c.titolo || "Chat del " + giornoBreve(c.giorno))}</b><small>${c.n_messaggi} ${c.n_messaggi === 1 ? "messaggio" : "messaggi"}</small></span>
          <span class="ai-arch-q">${quando(c)}</span>
        </button>
        <button type="button" class="ai-arch-piu" onclick="aiMenuChat('${c.id}')" aria-label="Altre azioni">⋯</button>
      </div>`).join("")).join("");
}
async function aiRiapriChat(id){
  const c = aiArchivio.find(x => x.id === id);
  aiConvId = id; aiConvRiaperta = !!c && c.giorno !== oggiRoma(); aiChiudiArchivio();
  await caricaChatAiGiorni();
}
function aiMenuChat(id){
  const r = document.querySelector(`.ai-arch-r[data-id="${id}"]`);
  const c = aiArchivio.find(x => x.id === id);
  if(!r || !c) return;
  const aperto = r.nextElementSibling?.classList.contains("ai-arch-menu");
  document.querySelectorAll(".ai-arch-menu").forEach(m => m.remove());
  if(aperto) return;
  r.insertAdjacentHTML("afterend", `<div class="ai-arch-menu">
    <input class="input" id="ai-ren-${id}" maxlength="70" value="${escapeHtml(c.titolo || "")}" placeholder="Nome della chat">
    <div class="ai-arch-menu-a">
      <button type="button" class="btn btn-primary btn-sm" onclick="aiRinominaChat('${id}')">Rinomina</button>
      <button type="button" class="btn btn-outline btn-sm" onclick="aiFissaChat('${id}')">${c.fissata ? "Togli dalle fissate" : "📌 Fissa"}</button>
      <button type="button" class="btn btn-outline btn-sm ai-rosso" onclick="aiEliminaChat('${id}')">Elimina</button>
    </div></div>`);
}
async function aiRinominaChat(id){
  const t = (document.getElementById("ai-ren-" + id)?.value || "").replace(/\s+/g, " ").trim().slice(0, 70);
  if(!t){ showToast("Scrivi un nome"); return; }
  const { error } = await sb.from("ai_conversazioni").update({ titolo: t, titolo_manuale: true }).eq("id", id);
  if(error){ showToast("Non salvato, riprova"); return; }
  const c = aiArchivio.find(x => x.id === id); if(c) c.titolo = t;
  if(aiConvInfo?.id === id){ aiConvInfo.titolo = t; aiAggiornaTestataChat(); }
  showToast("Chat rinominata"); aiDisegnaArchivio();
}
async function aiFissaChat(id){
  const c = aiArchivio.find(x => x.id === id); if(!c) return;
  const { error } = await sb.from("ai_conversazioni").update({ fissata: !c.fissata }).eq("id", id);
  if(error){ showToast("Non salvato, riprova"); return; }
  c.fissata = !c.fissata; showToast(c.fissata ? "Chat fissata in alto" : "Tolta dalle fissate"); aiDisegnaArchivio();
}
async function aiEliminaChat(id){
  const c = aiArchivio.find(x => x.id === id); if(!c) return;
  if(!confirm(`Eliminare la chat «${c.titolo || "Chat del " + giornoBreve(c.giorno)}»? I messaggi si cancellano; le note che ${nomeAgenteAi()} ha memorizzato restano.`)) return;
  const { error } = await sb.from("ai_conversazioni").delete().eq("id", id);
  if(error){ showToast("Non eliminata, riprova"); return; }
  aiArchivio = aiArchivio.filter(x => x.id !== id);
  if(aiConvInfo?.id === id){ aiConvId = null; aiConvRiaperta = false; await caricaChatAiGiorni(); }
  showToast("Chat eliminata"); aiDisegnaArchivio(); aiContaArchivio();
}

/* ---- «Messaggio importante» sopra l'icona dell'agente ---- */
let aiImpTimer = null;
async function aiControllaImportanti(){
  if(DEMO_MODE || !currentUser || !aiSqlPronto) return;
  const { count, error } = await sb.from("ai_messaggi").select("id", { count: "exact", head: true })
    .eq("user_id", currentUser.id).eq("vista", vistaAi()).eq("importante", true).is("letto_at", null);
  if(error){ if(sqlMancante(error)) aiSqlPronto = false; return; }
  aiMostraImportante(count || 0);
}
function aiMostraImportante(n){
  document.body.classList.toggle("ai-con-importante", n > 0);
  const dove = [document.getElementById("nav-hammer"), document.getElementById("ai-fab")].filter(Boolean);
  dove.forEach(el => {
    let tag = el.querySelector(":scope > .ai-imp-tag");
    if(n > 0 && !tag){ tag = document.createElement("span"); tag.className = "ai-imp-tag"; el.appendChild(tag); }
    if(tag){ if(n > 0) tag.textContent = n > 1 ? `${n} messaggi importanti` : "Messaggio importante"; else tag.remove(); }
  });
}
function aiAvviaControlloImportanti(){
  clearInterval(aiImpTimer);
  aiControllaImportanti();
  aiImpTimer = setInterval(() => { if(document.visibilityState === "visible" && currentUser) aiControllaImportanti(); }, 60000);
}

export { aiServeRicarica, aiApriArchivio, aiAvviaControlloImportanti, aiBollaHtml, aiCercaArchivio, aiChiudiArchivio, aiControllaImportanti, aiConvDaRisposta, aiConvPerInvio, aiEliminaChat, aiFissaChat, aiMenuChat, aiNuovaChat, aiRinominaChat, aiRiapriChat, aiTornaAOggi, caricaChatAiGiorni };
