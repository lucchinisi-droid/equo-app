/* ---------- REPORT PDF del mese ---------- */
function stReportPdf(){
  const s = statDati; if(!s){ showToast("Apri prima le statistiche."); return; }
  if(!window.jspdf){ showToast("Generatore PDF non disponibile, riprova."); return; }
  const doc = new window.jspdf.jsPDF({ unit:"mm", format:"a4" });
  let y = 18; const L = 16, W = 178;
  const riga = (t, size, bold, col) => { doc.setFont("helvetica", bold ? "bold" : "normal"); doc.setFontSize(size || 10.5); doc.setTextColor(...(col || [30, 40, 35]));
    doc.splitTextToSize(String(t), W).forEach(l => { if(y > 280){ doc.addPage(); y = 18; } doc.text(l, L, y); y += (size || 10.5) * 0.48; }); y += 1.5; };
  const mesi = s.incassi_mesi || [], cur = mesi[mesi.length - 1] || {};
  doc.setFillColor(31, 61, 43); doc.rect(0, 0, 210, 12, "F"); doc.setTextColor(243, 230, 192); doc.setFontSize(9); doc.text("EQUO SCUDERIA · REPORT DEL CENTRO", L, 8);
  y = 24; riga(currentCentro?.nome || "Centro", 18, true); riga(new Date().toLocaleDateString("it-IT", { month:"long", year:"numeric" }) + " · generato da Merlino", 10, false, [110, 110, 110]); y += 3;
  if(s.salute) riga(`Indice di salute: ${s.salute.indice}/100  (incassi ${s.salute.componenti.incassi}, occupazione ${s.salute.componenti.occupazione}, fedeltà ${s.salute.componenti.fedelta}, sanitario ${s.salute.componenti.sanitario}, magazzino ${s.salute.componenti.magazzino})`, 11.5, true);
  riga(`Incassi del mese: ${euro(cur.incasso)} · ultimi 12 mesi: ${euro(mesi.reduce((t, m) => t + Number(m.incasso || 0), 0))}`, 11);
  riga(`Lezioni ultimi 7 giorni: ${s.lezioni_settimana} · clienti attivi: ${s.clienti_attivi} · clienti a rischio: ${(s.clienti_a_rischio || []).length}`, 11);
  if(s.previsione_90) riga(`Rinnovi attesi nei prossimi 90 giorni: ${euro(s.previsione_90.rinnovi_attesi)} (tasso di rinnovo ${Math.round((s.tasso_rinnovo || 0) * 100)}%)`, 11);
  y += 3; riga("Incassi e lezioni per mese", 13, true);
  mesi.forEach(m => { const [a, mm] = m.mese.split("-"); riga(`${MESI_BREVI[+mm - 1]} ${a}: ${euro(m.incasso)} · ${m.lezioni} lezioni`, 10); });
  if((s.clienti_a_rischio || []).length){ y += 3; riga("Clienti da ricontattare", 13, true); s.clienti_a_rischio.slice(0, 12).forEach(c => riga(`• ${c.nome} — ultima lezione ${c.giorni} giorni fa`, 10)); }
  const marg = (s.margine_cavalli || []).filter(c => c.ricavo_mese != null);
  if(marg.length){ y += 3; riga("Margine per cavallo (30 giorni)", 13, true);
    marg.forEach(c => { const costo = Number(c.costo_mese || 0) + Number(s.costo_comune_per_cavallo || 0); riga(`• ${c.nome}: incassi ${euro(c.ricavo_mese)} − costi ${euro(costo)} = ${euro(Number(c.ricavo_mese) - costo)}`, 10); }); }
  if(s.radar?.testo){ y += 3; riga("Il radar di Merlino", 13, true); riga(s.radar.testo.replace(/\*\*/g, "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1"), 9.5); }
  doc.save(`Report_${(currentCentro?.nome || "centro").replace(/[^\w]+/g, "_")}_${isoLoc(new Date()).slice(0, 7)}.pdf`);
}

function statisticheDemo(){
  const oggi = new Date(), mesi = [];
  const inc = [1800, 2100, 2400, 2250, 2600, 2950, 3100, 2300, 2150, 2800, 3050, 3380], lez = [96, 104, 118, 112, 126, 140, 132, 88, 94, 121, 135, 142];
  for(let i = 11; i >= 0; i--){ const d = new Date(oggi.getFullYear(), oggi.getMonth() - i, 1); mesi.push({ mese: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, incasso: inc[11 - i], lezioni: lez[11 - i] }); }
  const occ = []; [[1,17,6],[1,18,7],[2,17,5],[2,18,6],[3,16,4],[3,17,7],[3,18,8],[4,17,6],[4,18,7],[5,16,3],[5,17,5],[6,9,6],[6,10,8],[6,11,7],[6,15,5],[7,10,6],[7,11,4]].forEach(([g,o,n]) => occ.push({ giorno:g, ora:o, n }));
  return { pacchetto:"premium", completo:true, generato_il:new Date().toISOString(), incassi_mesi:mesi, lezioni_settimana:34, lezioni_prossime_7:31, clienti_attivi:42, cavalli:14,
    clienti_a_rischio:[{ nome:"Sofia Russo", giorni:26, lezioni_totali:18 }, { nome:"Marco Bianchi", giorni:33, lezioni_totali:9 }, { nome:"Elena Conti", giorni:41, lezioni_totali:24 }],
    carnet_in_esaurimento:[{ cliente:"Giulia Verdi", tipo:"carnet", unita_totali:10, unita_usate:9, data_scadenza:null, prezzo:250 }, { cliente:"Luca Neri", tipo:"abbonamento", data_scadenza:new Date(Date.now() + 9 * 864e5).toISOString().slice(0, 10), prezzo:120 }],
    tasso_rinnovo:0.78, previsione_90:{ rinnovi_attesi:4290, in_scadenza:21, valore_in_scadenza:5500 },
    margine_cavalli:[{ nome:"Ares", ricavo_mese:350, costo_mese:236 }, { nome:"Luna", ricavo_mese:380, costo_mese:212 }, { nome:"Tornado", ricavo_mese:320, costo_mese:298 }, { nome:"Brezza", ricavo_mese:300, costo_mese:318 }],
    costo_comune_per_cavallo:41.5,
    carico_cavalli:[{ nome:"Luna", tipo_proprieta:"proprieta", lezioni_7:11, lezioni_28:38, max_giorno:3, ultima_lezione:isoLoc(oggi) }, { nome:"Zeus", tipo_proprieta:"proprieta", lezioni_7:7, lezioni_28:26, max_giorno:2, ultima_lezione:isoLoc(oggi) }, { nome:"Stella", tipo_proprieta:"proprieta", lezioni_7:4, lezioni_28:15, max_giorno:1, ultima_lezione:isoLoc(oggi) }, { nome:"Ombra", tipo_proprieta:"proprieta", lezioni_7:0, lezioni_28:1, max_giorno:1, ultima_lezione:new Date(Date.now() - 19 * 864e5).toISOString().slice(0, 10) }],
    occupazione:occ, prezzi_medi:{ lezione_da_carnet:25, pensione_mese:350, abbonamento:120 },
    box:{ totale:12, occupati:9, liberi:2, manutenzione:1, pensione_media:350 },
    salute:{ indice:78, componenti:{ incassi:88, occupazione:64, fedelta:81, sanitario:92, magazzino:67 }, incasso_mese:3380, media_3_mesi:2667 },
    confronto:{ disponibile:true, centri:7, regione:"Lazio", prezzo_lezione_medio:28, pensione_media:390, lezioni_settimana_medie:29.5, cavalli_medi:16.4 },
    radar:{ creato_il:new Date().toISOString(), fonti:[], testo:"**In sintesi** — Due centri della zona lanciano i campi invernali; nessuno offre lezioni serali infrasettimanali.\n**Offerte e prezzi della concorrenza**\n- Centro Ippico Le Querce (8 km): carnet 10 lezioni a € 270 (tu € 250).\n- Scuderia Monte Verde (14 km): pensione a € 420/mese con paddock (tu € 350).\n**Eventi e iniziative**\n- Gara sociale di salto ostacoli a Valmontone, domenica 19.\n**Reputazione online**\n- Le Querce 4,6★: \"istruttori preparati\", \"prezzi alti\".\n**Opportunità**\n- Bando regionale per lo sport di base: contributi fino a € 10.000 per attrezzature.\n**Mosse consigliate**\n1. Aumenta il carnet a € 265: sei ancora sotto la media della zona.\n2. Apri il martedì 18-19 con lezioni di gruppo per adulti che lavorano.\n3. Candidati al bando regionale entro fine mese per il nuovo recinto." } };
}

/* =====================================================================
   AGENTI AI (pagina) — Athena inclusa; Merlino / Ermes add-on (uno incluso in PREMIUM)
   ===================================================================== */
const AGENTI_INFO = [
  { key:"athena", nome:"Athena", ruolo:"Segreteria e guida del gestionale", icon:"svg:owl", cls:"athena-col", testo:"È la segretaria del centro: conosce iscritti, cavalli, staff e il gestionale e ti guida passo passo; ti dice cosa c'è da fare (lezioni, carnet, box)." },
  { key:"merlino", nome:"Merlino", ruolo:"Numeri, conti e strategia", icon:"fa-hat-wizard", cls:"merlino-av", testo:"Legge i numeri del centro, trova dove guadagni e dove perdi, sorveglia la concorrenza della zona con il radar settimanale." },
  { key:"ermes", nome:"Ermes", ruolo:"Magazzino e logistica", icon:"fa-truck-ramp-box", cls:"", testo:"Tiene d'occhio scorte, lotti e consumi e prepara le liste di riordino per i fornitori.", presto:true },
  { key:"galeno", nome:"Galeno", ruolo:"Veterinario", icon:"fa-stethoscope", cls:"", testo:"Supporto sanitario: protocolli, scadenze, primo orientamento.", presto:true },
  { key:"hammer", nome:"Hammer", ruolo:"Mascalcia", icon:"fa-hammer", cls:"", testo:"Il maniscalco esperto: pareggi, ferrature e piede equino, applicato ai cavalli del centro." },
  { key:"ares", nome:"Ares", ruolo:"Istruttore", icon:"fa-person-running", cls:"", testo:"L'istruttore: programmi di lavoro e lezioni per allievi e cavalli del centro." },
];
const AG_PREZZI = { merlino:9, ermes:9, hammer:4, ares:4, galeno:4 };   // € al mese + IVA
const AG_BUNDLE = { advance:24, premium:19 };                              // tutti gli agenti, € al mese + IVA
const AG_EXTRA_MSG = [{ n:200, p:7 }, { n:500, p:15 }];                    // messaggi extra condivisi, € al mese + IVA
let proveAgenti;   // undefined = da caricare; null = non disponibile; altrimenti { merlino:{stato,...}, hammer, ares }
async function caricaProveAgenti(){
  if(DEMO_MODE){ proveAgenti = { merlino:{ stato:"disponibile" }, hammer:{ stato:"disponibile" }, ares:{ stato:"disponibile" } }; return; }
  try{
    const { data, error } = await sb.rpc("agenti_prove_stato", { p_centro: currentCentro.id });
    proveAgenti = !error && data && !data.errore ? data : null;
  } catch(e){ proveAgenti = null; }
}
function renderModuloAgenti(){
  const el = document.getElementById("module-ai"); if(!el) return;
  if(proveAgenti === undefined){ proveAgenti = null; caricaProveAgenti().then(() => renderModuloAgenti()); }
  const p = pianoCentro || {}, attivi = p.agenti || ["athena"];
  const owl = document.querySelector(".athena-ic svg")?.outerHTML || "";
  const prova = a => (proveAgenti || {})[a.key] || null;
  const prezzo = a => AG_PREZZI[a.key] ? `${AG_PREZZI[a.key]} € + IVA al mese` : "";
  const oraProva = d => new Date(d).toLocaleString("it-IT", { day:"numeric", month:"short", hour:"2-digit", minute:"2-digit" });
  const stato = a => {
    if(attivi.includes(a.key) && !a.presto) return `<span class="stato" style="color:#3f7a45">● Attivo${a.key === "athena" && p.athena_proattiva === false ? " · basic" : ""}${a.key !== "athena" && p.agente_incluso === a.key ? " · incluso in PREMIUM" : ""}</span>`;
    if(a.presto) return `<span class="stato" style="color:var(--muted)">${prezzo(a) ? "Add-on " + prezzo(a) + " · " : ""}In arrivo${attivi.includes(a.key) ? " · già sbloccato per te" : ""}</span>`;
    const pr = prova(a);
    if(pr?.stato === "attiva") return `<span class="stato" style="color:#3f7a45">● Prova gratuita · ${pr.rimasti} messaggi, fino al ${oraProva(pr.fine)}</span>`;
    if(p.pacchetto === "start") return `<span class="stato" style="color:var(--muted)"><i class="fa-solid fa-lock"></i> Da ADVANCE · ${prezzo(a)}</span>`;
    if(p.pacchetto === "premium" && !p.agente_incluso) return `<span class="stato" style="color:#8a6516">Incluso a scelta in PREMIUM · altrimenti ${prezzo(a)}</span>`;
    return `<span class="stato" style="color:#8a6516">Add-on · ${prezzo(a)}</span>`;
  };
  const azione = a => {
    if(attivi.includes(a.key) && !a.presto) return `<button class="btn btn-primary btn-sm" onclick="apriAgente('${a.key}')">Apri la chat</button>`;
    if(a.presto) return "";
    const pr = prova(a);
    if(pr?.stato === "attiva") return `<button class="btn btn-primary btn-sm" onclick="apriAgente('${a.key}')">Apri la chat</button>`;
    const bottoni = [];
    if(pr?.stato === "disponibile") bottoni.push(`<button class="btn btn-ghost btn-sm" onclick="avviaProvaAgente('${a.key}')">Prova gratis 1 giorno</button>`);
    else if(pr?.stato === "attesa") bottoni.push(`<span style="font-size:11.5px;color:var(--muted)">Prova dal ${oraProva(pr.dal)}</span>`);
    else if(pr?.stato === "usata") bottoni.push(`<span style="font-size:11.5px;color:var(--muted)">Prova già usata</span>`);
    bottoni.push(p.pacchetto === "start" ? `<button class="btn btn-outline btn-sm" onclick="apriUpsell('agenti')">Scopri</button>`
      : `<button class="btn btn-outline btn-sm" onclick="richiediAgente('${a.key}')">${p.pacchetto === "premium" && !p.agente_incluso ? "Scegli questo agente" : "Richiedi l'attivazione"}</button>`);
    return `<span style="display:flex;gap:6px;flex-wrap:wrap;align-items:center">${bottoni.join("")}</span>`;
  };
  const bundle = p.pacchetto && p.pacchetto !== "start" && p.pacchetto !== "enterprise" ? `
    <div class="card" style="margin-top:16px"><div style="display:flex;gap:14px;flex-wrap:wrap;align-items:center;justify-content:space-between">
      <div><div style="font-weight:800;font-size:16px">Tutti gli agenti insieme</div>
        <div style="font-size:13px;color:var(--muted);margin-top:2px;line-height:1.5">Merlino, Hammer, Ares e, appena escono, Ermes e Galeno: <b>${AG_BUNDLE[p.pacchetto] || 24} € + IVA al mese</b>${p.pacchetto === "premium" ? " (hai già un agente incluso)" : " (19 € per chi ha PREMIUM)"}. 300 messaggi al mese per ogni agente.</div></div>
      <button class="btn btn-outline btn-sm" onclick="richiediAgente('tutti')">Richiedi il pacchetto</button></div></div>
    <div class="card" style="margin-top:12px"><div style="display:flex;gap:14px;flex-wrap:wrap;align-items:center;justify-content:space-between">
      <div><div style="font-weight:800;font-size:16px">Messaggi in più</div>
        <div style="font-size:13px;color:var(--muted);margin-top:2px;line-height:1.5">Ogni agente a pagamento ha 300 messaggi al mese. Se non bastano, aggiungi messaggi condivisi fra tutti gli agenti del centro: ${AG_EXTRA_MSG.map(m => `<b>${m.n} messaggi a ${m.p} € + IVA al mese</b>`).join(" oppure ")}.</div></div>
      <span style="display:flex;gap:6px;flex-wrap:wrap">${AG_EXTRA_MSG.map(m => `<button class="btn btn-outline btn-sm" onclick="richiediMessaggiExtra(${m.n})">${m.n} messaggi</button>`).join("")}</span></div></div>
    <p style="font-size:12px;color:var(--muted);margin-top:8px">Ogni agente si può provare gratis per 1 giorno con 10 messaggi (uno nuovo ogni 3 giorni).</p>` : `<p style="font-size:12px;color:var(--muted);margin-top:12px">Ogni agente si può provare gratis per 1 giorno con 10 messaggi (uno nuovo ogni 3 giorni). Gli agenti si acquistano da ADVANCE in su.</p>`;
  el.innerHTML = `<div class="page-header"><div><h1><span class="page-icon"><i class="fa-solid fa-wand-magic-sparkles"></i></span> Agenti AI</h1>
    <p>Il tuo team digitale: ognuno è esperto di un'area del centro e conosce il gestionale alla perfezione.</p></div></div>
    <div class="ag-grid">${AGENTI_INFO.map(a => `<div class="card ag-card"><div class="top"><div class="av ${a.cls}">${a.icon === "svg:owl" ? owl : `<i class="fa-solid ${a.icon}"></i>`}</div>
      <div><div style="font-weight:800;font-size:16px">${a.nome}</div><div style="font-size:12.5px;color:var(--muted)">${a.ruolo}</div></div></div>
      <p>${a.testo}</p><div style="display:flex;flex-direction:column;align-items:flex-start;gap:10px;margin-top:auto">${stato(a)}${azione(a)}</div></div>`).join("")}</div>${bundle}`;
}
async function avviaProvaAgente(key){
  const nome = key[0].toUpperCase() + key.slice(1);
  if(!confirm(`Vuoi provare ${nome} gratis? La prova dura 1 giorno e comprende 10 messaggi. Dopo la prova potrai provare un altro agente dopo 3 giorni.`)) return;
  if(DEMO_MODE){ proveAgenti = { ...proveAgenti, [key]:{ stato:"attiva", rimasti:10, fine:new Date(Date.now() + 864e5).toISOString() } }; renderModuloAgenti(); apriAgente(key); return; }
  const { error } = await sb.rpc("agente_prova_avvia", { p_centro: currentCentro.id, p_agente: key });
  if(error){
    const m = error.message || "";
    showToast(/SOLO_RESPONSABILI/.test(m) ? "La prova la può avviare solo il titolare o un responsabile (livello 2 o 3)."
      : /ATTENDI_3_GIORNI/.test(m) ? "Hai già provato un agente da poco: potrai provarne un altro dopo 3 giorni."
      : /PROVA_GIA_USATA/.test(m) ? "Hai già usato la prova di questo agente."
      : /AGENTE_GIA_ATTIVO/.test(m) ? "Questo agente è già attivo per il centro." : "Non riesco ad avviare la prova, riprova.");
    proveAgenti = undefined; renderModuloAgenti(); return;
  }
  proveAgenti = undefined; await caricaProveAgenti(); renderModuloAgenti(); apriAgente(key);
}
function richiediAgente(key){
  apriTicketAssistenza();
  const tutti = key === "tutti";
  const nome = tutti ? "il pacchetto Tutti gli agenti" : key[0].toUpperCase() + key.slice(1);
  const prezzo = tutti ? `${AG_BUNDLE[pianoCentro?.pacchetto] || 24} € + IVA al mese` : `${AG_PREZZI[key] || ""} € + IVA al mese`;
  document.getElementById("tk-categoria").value = "pagamenti";
  document.getElementById("tk-oggetto").value = tutti ? "Attivazione pacchetto Tutti gli agenti" : `Attivazione agente ${nome}`;
  document.getElementById("tk-descrizione").value = `Vorremmo attivare ${nome} per ${currentCentro?.nome || "il nostro centro"} (${prezzo})${!tutti && pianoCentro?.pacchetto === "premium" ? ", come agente incluso nel pacchetto PREMIUM se ancora disponibile" : ""}.`;
}
function richiediMessaggiExtra(n){
  apriTicketAssistenza();
  const m = AG_EXTRA_MSG.find(x => x.n === n) || AG_EXTRA_MSG[0];
  document.getElementById("tk-categoria").value = "pagamenti";
  document.getElementById("tk-oggetto").value = `Messaggi extra per gli agenti: ${m.n} al mese`;
  document.getElementById("tk-descrizione").value = `Vorremmo aggiungere ${m.n} messaggi extra al mese (${m.p} € + IVA al mese, condivisi fra gli agenti) per ${currentCentro?.nome || "il nostro centro"}.`;
}

const CHIAVE_ULTIMO_ONLINE = "equo-scuderia-ultimo-online";
const TESTO_OFFLINE = () => `Nessun problema: <b>puoi continuare a usare il gestionale</b> e consultare cavalli, lezioni, pacchetti, magazzino e chat con gli ultimi dati caricati. Per registrare nuove modifiche serve la connessione: appena torna te lo diciamo noi e tutto si aggiorna da solo.`;
const TESTO_AGGIORNAMENTO = "Una nuova versione di Equo Scuderia è pronta. Aggiornare richiede pochi secondi e non perdi nessun dato.";
