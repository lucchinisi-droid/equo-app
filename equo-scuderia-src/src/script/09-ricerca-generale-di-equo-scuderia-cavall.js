
/* Ricerca generale di Equo Scuderia: cavalli, persone (team, clienti, maniscalchi, rubrica), lezioni, magazzino, sezioni.
   Cerca nei dati già caricati dal gestionale (li carica se mancano) e rispetta i moduli del pacchetto. */
let scCercaAzioni = [], scCercaTimer = null, scCercaPronto = false;
const scNorm = t => String(t ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
function scModuloOk(k){
  const nav = document.querySelector(`.nav-item[data-module="${k}"]`);
  if(!nav || nav.style.display === "none" || nav.hidden) return false;
  return !(typeof moduloBloccato === "function" && moduloBloccato(k));
}
async function apriCercaScud(){
  const ov = document.getElementById("sc-cerca"); if(!ov) return;
  if(!scCercaPronto){
    scCercaPronto = true;
    const inp = document.getElementById("sc-input");
    inp.addEventListener("input", () => { clearTimeout(scCercaTimer); scCercaTimer = setTimeout(scCercaMostra, 80); });
    inp.addEventListener("keydown", e => { if(e.key === "Escape") chiudiCercaScud(); if(e.key === "Enter"){ document.querySelector("#sc-ris .sc-riga")?.click(); } });
    document.getElementById("sc-ris").addEventListener("click", e => { const b = e.target.closest(".sc-riga"); if(!b) return; const az = scCercaAzioni[Number(b.dataset.i)]; if(az){ chiudiCercaScud(); az(); } });
    ov.addEventListener("click", e => { if(e.target === ov) chiudiCercaScud(); });
  }
  ov.classList.add("on");
  const inp = document.getElementById("sc-input"); inp.value = "";
  scCercaMostra();
  setTimeout(() => inp.focus(), 50);
  // dati: si caricano solo quelli che mancano
  try{
    await Promise.all([
      !cavalliList.length && scModuloOk("cavalli") ? loadCavalli() : null,
      !lezioniList.length && scModuloOk("lezioni") ? loadLezioni() : null,
      typeof mag !== "undefined" && !mag.caricato && scModuloOk("magazzino") ? loadMagazzino() : null,
      !professionistiList.length && scModuloOk("professionisti") ? loadProfessionisti() : null,
      !contattiList.length ? loadContatti() : null,
    ].filter(Boolean));
  }catch(e){ console.warn("ricerca:", e); }
  if(ov.classList.contains("on")) scCercaMostra();
}
function chiudiCercaScud(){ document.getElementById("sc-cerca")?.classList.remove("on"); }
function scRiga(icona, titolo, sotto, az){
  scCercaAzioni.push(az);
  return `<button type="button" class="sc-riga" data-i="${scCercaAzioni.length - 1}"><span class="sc-ico"><i class="fa-solid ${icona}"></i></span><span class="sc-testi"><b>${escapeHtml(titolo)}</b>${sotto ? `<small>${escapeHtml(sotto)}</small>` : ""}</span><i class="fa-solid fa-chevron-right" style="color:var(--muted);font-size:12px"></i></button>`;
}
function scGruppo(titolo, righe, max = 6){
  if(!righe.length) return "";
  return `<div class="sc-gruppo"><div class="sc-titolo">${escapeHtml(titolo)}${righe.length > max ? ` <span>(${righe.length})</span>` : ""}</div>${righe.slice(0, max).join("")}${righe.length > max ? `<div class="sc-altri">e altri ${righe.length - max}: aggiungi una parola per restringere</div>` : ""}</div>`;
}
function scCercaMostra(){
  const out = document.getElementById("sc-ris"); if(!out) return;
  const parole = scNorm(document.getElementById("sc-input").value).split(" ").filter(Boolean);
  scCercaAzioni = [];
  const ok = (...campi) => { const t = scNorm(campi.filter(Boolean).join(" ")); return parole.every(p => t.includes(p)); };
  const sezioni = Object.entries(MODULE_TITLES).filter(([k]) => scModuloOk(k));
  if(!parole.length){
    out.innerHTML = `<div class="sc-gruppo"><div class="sc-titolo">Vai a</div>${sezioni.map(([k, t]) => scRiga("fa-arrow-right", t, "", () => showModule(k))).join("")}</div>
      <div class="sc-sugg">Scrivi il nome di un cavallo, di una persona, un microchip, una data (es. 12/10) o un articolo come «fieno».</div>`;
    return;
  }
  const nomeMembro = id => (typeof membroNome === "function" ? membroNome(id) : "") || "";
  const cavalli = scModuloOk("cavalli") ? cavalliList.filter(c => ok(c.nome, c.codice_equo, c.microchip, c.razza, c.mantello, c.proprietario, nomeMembro(c.proprietario_membro_id), c.note))
    .map(c => scRiga("fa-horse-head", c.nome || "Cavallo", [c.proprietario || nomeMembro(c.proprietario_membro_id), c.codice_equo, c.microchip ? "chip " + c.microchip : ""].filter(Boolean).join(" · ") || "Scheda cavallo",
      () => { showModule("cavalli"); openCavalloDetail(c.id); })) : [];
  const persone = teamList.filter(m => ok(m.nome_visualizzato, RUOLO_LABELS[m.ruolo], m.ruolo === "proprietario" ? "cliente proprietario" : "team staff"))
    .map(m => scRiga(m.ruolo === "proprietario" ? "fa-user" : "fa-user-tie", m.nome_visualizzato || RUOLO_LABELS[m.ruolo] || "Membro", (RUOLO_LABELS[m.ruolo] || m.ruolo || "") + (m.user_id && m.user_id !== currentUser?.id ? " · tocca per la chat" : ""),
      () => { if(m.user_id && m.user_id !== currentUser?.id && typeof chattaConMembro === "function") chattaConMembro(m.id); else showModule("centro"); }))
    .concat(scModuloOk("professionisti") ? professionistiList.filter(p => ok(p.nome, p.categoria, "maniscalco professionista")).map(p =>
      scRiga("fa-hammer", p.nome || "Professionista", (p.categoria === "maniscalco" ? "Maniscalco" : p.categoria || "Professionista") + (p.stato === "attivo" ? " · collegato" : " · in attesa"),
        () => { showModule("professionisti"); if(p.stato === "attivo" && typeof apriChatProfessionista === "function") apriChatProfessionista(p.cliente_id); })) : [])
    .concat(contattiList.filter(c => ok(c.nome, c.ruolo, c.categoria, c.tipo, c.telefono, c.email, c.azienda, "contatto rubrica fornitore")).map(c =>
      scRiga("fa-address-book", c.nome || c.azienda || "Contatto", [c.ruolo || c.categoria || c.tipo, c.telefono].filter(Boolean).join(" · ") || "Rubrica",
        () => { showModule("centro"); openContattoForm(c.id); })));
  const lezioni = scModuloOk("lezioni") ? lezioniList.filter(l => ok(nomeMembro(l.allievo_id), nomeMembro(l.istruttore_id), l.cavaliere, typeof cavalloNome === "function" ? cavalloNome(l.cavallo_id) : "", formatDate(l.data), l.data, l.note, l.stato, "lezione"))
    .sort((a, b) => String(b.data).localeCompare(String(a.data)))
    .map(l => scRiga("fa-person-chalkboard", `${formatDate(l.data)} · ${l.ora_inizio || ""} — ${nomeMembro(l.allievo_id) || l.cavaliere || "Lezione"}`,
      [nomeMembro(l.istruttore_id) ? "con " + nomeMembro(l.istruttore_id) : "", typeof cavalloNome === "function" ? cavalloNome(l.cavallo_id) : "", l.stato].filter(Boolean).join(" · "),
      () => { showModule("lezioni"); openLezioneForm(l.id); })) : [];
  const articoli = scModuloOk("magazzino") && typeof mag !== "undefined" ? (mag.articoli || []).filter(a => ok(a.nome, a.marca, a.categoria, a.sottocategoria, "magazzino articolo"))
    .map(a => scRiga("fa-boxes-stacked", a.nome || "Articolo", [a.marca, a.sottocategoria || a.categoria].filter(Boolean).join(" · ") || "Magazzino",
      () => { showModule("magazzino"); if(typeof magApriDettaglio === "function") magApriDettaglio(a.id); })) : [];
  const sez = sezioni.filter(([k, t]) => ok(t, k)).map(([k, t]) => scRiga("fa-arrow-right", t, "Sezione", () => showModule(k)));
  const html = scGruppo("Cavalli", cavalli) + scGruppo("Persone", persone) + scGruppo("Lezioni", lezioni, 8) + scGruppo("Magazzino", articoli) + scGruppo("Sezioni", sez);
  out.innerHTML = html || `<div class="sc-nulla">Nessun risultato per «${escapeHtml(parole.join(" "))}»</div>`;
}
document.addEventListener("keydown", e => {
  if((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k" && document.getElementById("screen-app")?.style.display !== "none"){ e.preventDefault(); apriCercaScud(); }
});
