/* ---------- MODALS ---------- */
/* =====================================================================
   PACCHETTI EQUO SCUDERIA (START / ADVANCE / PREMIUM) — lucchetti e limiti lato app.
   I limiti veri sono nel database (centro_limiti / trigger): qui solo interfaccia e "passa a…".
   ===================================================================== */
let pianoCentro = null;
const PK_NOMI = { start:"START", advance:"ADVANCE", premium:"PREMIUM", enterprise:"ENTERPRISE", completo:"COMPLETO" };
const PK_PREZZI = { start:"€9/mese · €89/anno + IVA", advance:"€29/mese · €290/anno + IVA", premium:"€59/mese · €590/anno + IVA", enterprise:"su misura", completo:"sblocco totale" };
// moduli del menu legati a una funzione del pacchetto
const MODULO_FUNZIONE = { groom:"groom", pacchetti:"pacchetti", magazzino:"magazzino", statistiche:"statistiche", store:"store", fatturazione:"sdi" };
const FUNZIONI_INFO = {
  pacchetti: { titolo:"Pacchetti & Abbonamenti", icon:"fa-ticket", da:"advance", punti:["Carnet a scalare, abbonamenti e pensioni","Scalo automatico delle lezioni dal carnet","Cruscotto scadenze e rinnovi"] },
  magazzino: { titolo:"Magazzino", icon:"fa-boxes-stacked", da:"advance", punti:["Scorte con semaforo per categoria","Carichi, scarichi e inventario in un tocco","Consumi delle ultime 8 settimane"] },
  statistiche: { titolo:"Statistiche", icon:"fa-chart-line", da:"advance", punti:["Incassi e lezioni degli ultimi 12 mesi","Clienti a rischio con messaggio pronto","Carnet in esaurimento da rinnovare","In PREMIUM: indice di salute, margine per cavallo, radar della concorrenza"] },
  statistiche_complete: { titolo:"Statistiche complete", icon:"fa-chart-line", da:"premium", punti:["Indice di salute del centro 0-100","Margine per cavallo in pensione","Benessere e carico dei cavalli","Mappa di occupazione e simulatore","Radar di Merlino sulla concorrenza della zona"] },
  store: { titolo:"Store", icon:"fa-store", da:"premium", punti:["Vendita online di lezioni, pacchetti e prodotti"] },
  sdi: { titolo:"Fatturazione SDI", icon:"fa-file-invoice", da:"advance", punti:["Fatture elettroniche conformi SDI","Add-on in ADVANCE, inclusa in PREMIUM"] },
  box: { titolo:"Box / Stalla", icon:"fa-warehouse", da:"advance", punti:["Box disegnati con semaforo: libero, occupato, in manutenzione","Stato del cavallo e icone del giorno (pasti, paddock, farmaco…)","ADVANCE fino a 20 box, PREMIUM fino a 100","Modalità stalla per tablet e display in scuderia"] },
  groom: { titolo:"App Equo Groom", icon:"fa-id-badge", da:"advance", punti:["Il personale di stalla segna le attività dal telefono","QR personale + PIN, senza account e senza email","7 lingue: italiano, inglese, rumeno, hindi, punjabi, bengalese, arabo","ADVANCE fino a 3 groom, PREMIUM fino a 10"] },
  agenti: { titolo:"Agenti AI add-on", icon:"fa-wand-magic-sparkles", da:"advance", punti:["Merlino: numeri, conti e strategia","Ermes: magazzino e logistica","In PREMIUM uno dei due è incluso"] },
};
const PK_CONFRONTO = [
  ["Cavalli", "10", "30", "80"], ["Team", "3", "6", "15"], ["Professionisti esterni", "3", "9", "illimitati"],
  ["Lezioni & Prenotazioni", "base (1+1)", "✓ (3+3)", "✓"], ["Pacchetti & Abbonamenti", "—", "✓", "✓"],
  ["Promemoria automatici", "—", "✓", "✓"], ["Box / Stalla", "—", "20 box", "100 box"], ["App Groom", "—", "3 groom", "10 groom"], ["Magazzino", "—", "base", "avanzato"], ["Statistiche", "—", "base", "complete + radar"],
  ["Athena", "basic · 30 msg", "100 msg", "500 msg"], ["Agenti add-on", "—", "acquistabili", "1 incluso"], ["Fatturazione SDI", "—", "add-on", "✓"],
  ["Supporto prioritario", "—", "—", "✓"],
];

async function caricaPianoCentro(){
  if(DEMO_MODE){
    pianoCentro = { pacchetto:"premium", pacchetto_reale:"premium", sbloccato:false, agente_incluso:"merlino", agenti:["athena","merlino"],
      cavalli:80, team:15, maniscalchi:null, athena_messaggi:500, merlino_messaggi:300, athena_proattiva:true, pacchetti:true, magazzino:true,
      magazzino_avanzato:true, statistiche:true, statistiche_complete:true, radar:true, store:true, sdi:true, livelli:true, hard_reset:true,
      agenti_acquistabili:true, supporto_prioritario:true, uso:{ cavalli:(demoState.cavalli||[]).length, team:3, maniscalchi:1, athena_messaggi:4, merlino_messaggi:2 } };
  } else if(currentCentro?.id){
    const { data, error } = await sb.rpc("centro_piano", { p_centro_id: currentCentro.id });
    if(error || !data || data.errore){ console.warn("piano:", error || data); return; }
    pianoCentro = data;
  }
  if(pianoCentro) pianoCentro.groom = pianoCentro.pacchetto !== "start";
  applicaPianoGating();
  renderIlTuoPacchetto();
  aggiornaVersioneScuderia();
}
function haFunzione(f){ return !pianoCentro || pianoCentro[f] !== false; }
function moduloBloccato(key){ const f = MODULO_FUNZIONE[key]; return !!(f && pianoCentro && pianoCentro[f] === false && !["store","fatturazione"].includes(key)); }

function applicaPianoGating(){
  document.querySelectorAll(".nav-item[data-module]").forEach(b => {
    const f = MODULO_FUNZIONE[b.dataset.module];
    const lock = !!(f && pianoCentro && pianoCentro[f] === false);
    b.classList.toggle("bloccato", lock);
    let l = b.querySelector(".nav-lock");
    if(lock && !l){ b.insertAdjacentHTML("beforeend", `<span class="nav-lock" title="Non incluso nel tuo pacchetto"><i class="fa-solid fa-lock"></i></span>`); }
    if(!lock && l) l.remove();
    if(lock){ const badge = b.querySelector(".nav-unread-badge"); if(badge) badge.style.display = "none"; }
  });
  // Athena basic: niente "cosa c'è da fare" (è una funzione proattiva)
  const chip = document.querySelector('#athena-chips button[data-proattiva]');
  if(chip) chip.style.display = pianoCentro && pianoCentro.athena_proattiva === false ? "none" : "";
}

function apriUpsell(chiave){
  const info = FUNZIONI_INFO[chiave] || FUNZIONI_INFO[MODULO_FUNZIONE[chiave]] || FUNZIONI_INFO.statistiche;
  const target = info.da === "premium" || pianoCentro?.pacchetto === "advance" ? "premium" : "advance";
  document.getElementById("upsell-corpo").innerHTML = `
    <div class="upsell-hero"><div class="ic"><i class="fa-solid ${info.icon}"></i></div>
      <h3 style="margin:0 0 4px">${escapeHtml(info.titolo)}</h3>
      <div style="color:var(--muted);font-size:13px">Non è incluso nel pacchetto <b>${PK_NOMI[pianoCentro?.pacchetto] || "attuale"}</b>. Lo trovi in <span class="pk-badge pk-${target}">${PK_NOMI[target]}</span></div></div>
    <ul class="upsell-lista">${info.punti.map(p => `<li><i class="fa-solid fa-check"></i><span>${escapeHtml(p)}</span></li>`).join("")}</ul>
    <div style="text-align:center;font-size:13px;color:var(--muted);margin-bottom:12px">${PK_NOMI[target]}: <b style="color:var(--text)">${PK_PREZZI[target]}</b></div>`;
  document.getElementById("upsell-cta").onclick = () => { closeModal("modal-upsell"); richiediUpgrade(target); };
  openModal("modal-upsell");
}
function richiediUpgrade(target){
  apriTicketAssistenza();
  document.getElementById("tk-categoria").value = "pagamenti";
  document.getElementById("tk-oggetto").value = `Passaggio al pacchetto ${PK_NOMI[target] || ""}`.trim();
  document.getElementById("tk-descrizione").value = `Vorremmo passare al pacchetto ${PK_NOMI[target] || ""} per ${currentCentro?.nome || "il nostro centro"}. Ricontattateci per attivarlo.`;
}

function renderIlTuoPacchetto(){
  const box = document.getElementById("pk-card");
  if(!box || !pianoCentro) return;
  const p = pianoCentro, u = p.uso || {};
  const barra = (label, usato, max) => {
    const pct = max ? Math.min(100, Math.round((usato || 0) / max * 100)) : 8;
    return `<div><div class="riga"><span>${label}</span><b>${usato || 0}${max ? " / " + max : " · illimitati"}</b></div>
      <div class="pk-barra"><i class="${pct >= 100 ? "full" : pct >= 80 ? "warn" : ""}" style="width:${pct}%"></i></div></div>`;
  };
  const f = (ok, testo) => `<li class="${ok ? "" : "no"}"><i class="fa-solid ${ok ? "fa-check" : "fa-lock"}"></i>${testo}</li>`;
  const col = { start:1, advance:2, premium:3 }[p.pacchetto_reale] || 0;
  const promoFino = currentCentro?.promo_pacchetto_prima && currentCentro?.promo_fino ? currentCentro.promo_fino : null;
  const promoGg = promoFino ? Math.ceil((new Date(promoFino + "T23:59:59").getTime() - Date.now()) / 864e5) : null;
  const promoHtml = promoFino && promoGg >= 0 ? `
    <div class="pk-promo${promoGg <= 14 ? " pk-promo-fine" : ""}">
      <i class="fa-solid fa-gift"></i>
      <div><b>3 mesi di PREMIUM in regalo</b> fino al <b>${new Date(promoFino + "T12:00:00").toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" })}</b> (${promoGg === 0 ? "ultimo giorno" : promoGg === 1 ? "manca 1 giorno" : "mancano " + promoGg + " giorni"}).
      Dopo questa data il centro passa al pacchetto <b>${PK_NOMI[currentCentro.promo_pacchetto_prima] || ""}</b>, salvo diverso accordo.
      <a href="#" onclick="richiediUpgrade('${currentCentro.promo_pacchetto_prima === "start" ? "advance" : "premium"}');return false">Scegli con noi il pacchetto giusto</a></div>
    </div>` : "";
  box.innerHTML = promoHtml + `
    <div class="pk-top">
      <h3 style="margin:0">Il tuo pacchetto</h3>
      <span class="pk-badge pk-${p.pacchetto}">${p.sbloccato ? '<i class="fa-solid fa-key"></i> Sblocco totale' : PK_NOMI[p.pacchetto]}</span>
      <span style="color:var(--muted);font-size:12.5px">${p.sbloccato ? "Account Equo: tutte le funzioni e tutti gli agenti attivi" : PK_PREZZI[p.pacchetto] || ""}</span>
    </div>
    <div class="pk-uso">
      ${barra("Cavalli", u.cavalli, p.cavalli)}${barra("Team", u.team, p.team)}${barra("Maniscalchi collegati", u.maniscalchi, p.maniscalchi)}
      ${barra("Messaggi ad Athena (mese)", u.athena_messaggi, p.athena_messaggi)}
      ${(p.agenti || []).includes("merlino") ? barra("Messaggi a Merlino (mese)", u.merlino_messaggi, p.merlino_messaggi) : ""}
    </div>
    <ul class="pk-funz">
      ${f(p.pacchetti, "Pacchetti & Abbonamenti")}${f(p.promemoria_auto, "Promemoria automatici")}${f(p.magazzino, "Magazzino" + (p.magazzino && !p.magazzino_avanzato ? " (base)" : ""))}
      ${f(p.statistiche, "Statistiche" + (p.statistiche && !p.statistiche_complete ? " (base)" : ""))}${f(p.radar, "Radar di Merlino")}${f(p.livelli, "Livelli del team")}
      ${f(p.athena_proattiva, "Athena completa" + (p.athena_proattiva ? "" : " (hai Athena basic)"))}${f(p.sdi, "Fatturazione SDI")}${f(p.supporto_prioritario, "Supporto prioritario")}
      ${f((p.agenti || []).length > 1, "Agenti add-on" + ((p.agenti || []).length > 1 ? ": " + p.agenti.filter(a => a !== "athena").map(a => a[0].toUpperCase() + a.slice(1)).join(", ") : ""))}
    </ul>
    ${p.sbloccato || p.pacchetto === "enterprise" ? "" : `
    <details><summary style="cursor:pointer;font-size:13px;font-weight:700;margin-bottom:8px">Confronta i pacchetti</summary>
      <div class="table-wrap"><table class="pk-confronto"><thead><tr><th></th>
        ${["start","advance","premium"].map((k, i) => `<th class="${col === i + 1 ? "attuale" : ""}"><span class="pk-badge pk-${k}">${PK_NOMI[k]}</span><div style="font-size:11px;color:var(--muted);font-weight:500;margin-top:4px">${PK_PREZZI[k].replace(" + IVA", "")}</div></th>`).join("")}
      </tr></thead><tbody>${PK_CONFRONTO.map(r => `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td></tr>`).join("")}</tbody></table></div>
      <p style="color:var(--muted);font-size:11.5px;margin:0 0 10px">Prezzi IVA esclusa, fattura elettronica. ENTERPRISE (oltre 80 cavalli) su misura.</p>
    </details>
    <button class="btn btn-primary btn-sm" onclick="richiediUpgrade('${p.pacchetto === "start" ? "advance" : "premium"}')"><i class="fa-solid fa-arrow-up"></i> Passa a ${p.pacchetto === "start" ? "ADVANCE" : "PREMIUM"}</button>`}`;
}

