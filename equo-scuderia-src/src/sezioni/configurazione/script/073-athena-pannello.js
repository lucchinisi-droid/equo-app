/* =====================================================================
   CONFIGURAZIONE GUIDATA · ATHENA CHE PARLA E COMPILA (blocco B3, 10/11/2026)
   - Chat del passo (modalità B): /api/agent con «configurazione: { passo, contesto }»; Athena risponde nei fumetti.
   - Compila da una frase (modalità C): Athena propone i campi (azione «conf_campi»), l'app li scrive nel modulo del
     passo evidenziati in verde e aspetta «Conferma» → stesso salvataggio di «Salva e continua». Nessuna scrittura
     diretta dell'AI.
   - 30 messaggi bonus per scuderia (contati sul server); finiti quelli si usa la quota del mese; senza AI si continua
     con i campi. Errori, limite e rete assente sono detti chiaramente.
   ===================================================================== */
let confAiInCorso = false;
let confBonusAi = null;        // { usati, limite, finito } dall'ultima risposta del server

// campo dell'AI → elemento del modulo (sel: scelta per testo dell'opzione; val: scelta per valore)
const CONF_CAMPI_ID = {
  1: { codice: "conf-codice-pro" },
  2: { nome: "conf-c-nome", telefono: "conf-c-telefono", indirizzo: "conf-c-indirizzo", citta: "conf-c-citta", provincia: "conf-c-provincia", email: "conf-c-email", forma_giuridica: "val:conf-c-forma" },
  3: { asd: "check:conf-asd-si", asd_nome: "conf-asd-nome", asd_cf: "conf-asd-cf", asd_sede: "conf-asd-sede", asd_rasd: "conf-asd-rasd", asd_affiliazioni: "conf-asd-aff", asd_quota: "conf-asd-quota" },
  5: { box_totali: "conf-box-n", paddock: "paddock" },
  6: { nome: "conf-cav-nome", categoria: "val:conf-cav-cat", razza: "conf-cav-razza", sesso: "val:conf-cav-sesso", data_nascita: "conf-cav-nascita", microchip: "conf-cav-chip", proprietario: "conf-cav-prop" },
  7: { proprietario_nome: "conf-pr-nome", telefono: "conf-pr-tel", email: "conf-pr-email", cavallo: "sel:conf-pr-cav" },
  8: { data: "conf-lz-data", ora: "conf-lz-ora", allievo: "sel:conf-lz-allievo", cavallo: "sel:conf-lz-cav", istruttore: "sel:conf-lz-ist" },
  9: { cliente: "sel:conf-in-cli", importo: "conf-in-imp", metodo: "val:conf-in-met", data: "conf-in-data", causale: "conf-in-causale", cassa: "val:conf-in-cassa" },
};

function confInputAthena(){
  const inp = document.getElementById("conf-msg"), inv = document.getElementById("conf-invia");
  if(inp){ inp.disabled = confAiInCorso; inp.placeholder = confPassoVisto === 10 ? "Chiedi ad Athena…" : "Scrivi ad Athena, anche i dati a parole…"; }
  if(inv) inv.disabled = confAiInCorso;
  confNotaBonus();
}
function confNotaBonus(){
  const nota = document.getElementById("conf-nota-ai"); if(!nota) return;
  const b = confBonusAi;
  nota.textContent = !b ? "Hai 30 messaggi gratuiti per la configurazione. Senza AI puoi continuare con i campi."
    : b.finito ? "I 30 messaggi della configurazione sono finiti: ora Athena usa i messaggi del mese. Puoi sempre continuare con i campi."
    : `Messaggi della configurazione: ${Math.max(0, b.limite - b.usati)} di ${b.limite} rimasti.`;
}

// cosa c'è ora nel passo: i valori dei campi e i nomi tra cui scegliere (aiuta Athena a non inventare)
function confContestoPasso(){
  const righe = [];
  document.querySelectorAll("#conf-passo .conf-campo").forEach(l => {
    const el = l.querySelector("input, select"); if(!el || el.type === "file") return;
    const nome = (l.childNodes[0]?.textContent || "").trim();
    const v = el.tagName === "SELECT" ? (el.selectedIndex > 0 ? el.options[el.selectedIndex].text : "") : el.value;
    righe.push(`${nome}: ${v || "(vuoto)"}`);
  });
  const nomi = (id, et) => { const s = document.getElementById(id); if(s && s.options.length > 1) righe.push(`${et}: ${[...s.options].slice(1, 41).map(o => o.text).join(", ")}`); };
  if(confPassoVisto === 7) nomi("conf-pr-cav", "Cavalli tra cui scegliere");
  if(confPassoVisto === 8){ nomi("conf-lz-allievo", "Allievi"); nomi("conf-lz-cav", "Cavalli"); nomi("conf-lz-ist", "Istruttori"); }
  if(confPassoVisto === 9) nomi("conf-in-cli", "Clienti");
  const d = confRiepilogoDati(confPassoVisto, confDati).map(r => r.testo);
  if(d.length) righe.push("Già nel gestionale: " + d.join("; "));
  return righe.join("\n").slice(0, 1500);
}

async function confScriviAthena(){
  const inp = document.getElementById("conf-msg"); if(!inp) return;
  const testo = inp.value.trim();
  if(!testo || confAiInCorso) return;
  inp.value = "";
  const passo = confPassoVisto;
  confAggiungiFumetto(testo, true);
  const pensa = confAggiungiFumetto("Athena sta scrivendo…", false);
  pensa?.classList.add("pensa");
  confAiInCorso = true; confInputAthena();
  let risposta = "", azioni = [];
  try{
    if(DEMO_MODE){
      await new Promise(r => setTimeout(r, 700));
      const n = (testo.match(/\d+/) || [])[0];
      if(passo === 5 && n){ azioni = [{ tipo: "conf_campi", dati: { passo: 5, campi: { box_totali: Number(n) } } }]; risposta = "[Demo] Ho compilato i campi in verde: controlla e conferma."; }
      else risposta = "[Demo] Nel gestionale vero qui ti rispondo sul passo in corso e, se mi scrivi i dati, compilo io i campi.";
      confBonusAi = { usati: (confBonusAi?.usati || 0) + 1, limite: 30 };
    } else {
      const { data: sess } = await sb.auth.getSession();
      const token = sess?.session?.access_token;
      const res = await fetch("/api/agent", { method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: "Bearer " + token } : {}) },
        body: JSON.stringify({ message: testo, vista: "scuderia", agente: "athena", centro_id: currentCentro?.id, configurazione: { passo, contesto: confContestoPasso() } }) });
      const data = await res.json().catch(() => ({}));
      if(data.bonus) confBonusAi = data.bonus;
      if(res.status === 401) risposta = "La sessione è scaduta: esci e rientra per parlare con me. Intanto puoi continuare con i campi.";
      else if(res.status === 403) risposta = (data.error || "Non posso aiutarti in questo momento") + ".";
      else if(data.limite_raggiunto) risposta = "Il centro ha finito i messaggi di Athena di questo mese. Nessun problema: continua con i campi, ci sono anche i miei consigli.";
      else if(!res.ok || data.errore) risposta = data.reply || "Non riesco a rispondere ora: riprova tra poco, oppure continua con i campi.";
      else { risposta = data.reply || "Non sono riuscita a rispondere, riprova."; azioni = Array.isArray(data.azioni) ? data.azioni : []; }
    }
  }catch(e){
    risposta = "Non riesco a collegarmi: controlla la rete. Puoi continuare con i campi.";
  }
  confAiInCorso = false;
  if(pensa){ pensa.classList.remove("pensa"); pensa.firstChild && (pensa.firstChild.textContent = risposta); }
  confInputAthena();
  // la proposta vale solo se si è ancora sullo stesso passo
  azioni.filter(a => a.tipo === "conf_campi" && a.dati?.passo === passo && confPassoVisto === passo).slice(0, 1).forEach(a => confApplicaCampi(a.dati.campi, pensa));
  document.getElementById("conf-msg")?.focus();
}

// scrive i valori proposti nei campi (evidenziati) e chiede conferma
function confApplicaCampi(campi, bollaRisposta){
  const mappa = CONF_CAMPI_ID[confPassoVisto] || {};
  const fatti = [], mancati = [];
  const segna = el => { el.classList.add("conf-proposto"); el.addEventListener("input", () => el.classList.remove("conf-proposto"), { once: true }); };
  for(const [k, v] of Object.entries(campi || {})){
    const dove = mappa[k]; if(!dove) continue;
    if(dove === "paddock"){
      (Array.isArray(v) ? v : []).forEach((p, i) => {
        if(!document.getElementById("conf-pad-nome-" + (i + 1)) && typeof confAggiungiPaddock === "function") confAggiungiPaddock();
        const n = document.getElementById("conf-pad-nome-" + (i + 1)), c = document.getElementById("conf-pad-cap-" + (i + 1));
        if(n && c){ n.value = p.nome; c.value = p.capienza; segna(n); segna(c); fatti.push(n); }
      });
      continue;
    }
    const [tipo, id] = dove.includes(":") ? dove.split(":") : ["txt", dove];
    const el = document.getElementById(id); if(!el){ continue; }
    if(tipo === "check"){
      el.checked = !!v; el.dispatchEvent(new Event("change")); segna(el); fatti.push(el); continue;
    }
    if(tipo === "val"){
      const opt = [...el.options].find(o => o.value === String(v)); if(opt){ el.value = opt.value; segna(el); fatti.push(el); } else mancati.push(String(v)); continue;
    }
    if(tipo === "sel"){
      const cerca = confNorma(v), opts = [...el.options].slice(1);
      const opt = opts.find(o => confNorma(o.text) === cerca) || opts.find(o => confNorma(o.text).includes(cerca) || (cerca.length > 3 && cerca.includes(confNorma(o.text).split(" ")[0])));
      if(opt){ el.value = opt.value; segna(el); fatti.push(el); } else mancati.push(String(v));
      continue;
    }
    el.value = String(v); el.dispatchEvent(new Event("input")); el.classList.add("conf-proposto"); fatti.push(el);
  }
  if(confPassoVisto === 7 && typeof confSimiliProprietario === "function") confSimiliProprietario();
  if(!fatti.length && !mancati.length) return;
  // i tasti vanno sotto la risposta di Athena; un fumetto in più solo se qualcosa non si è potuto scegliere
  const b = mancati.length || !bollaRisposta
    ? confAggiungiFumetto((fatti.length ? "Ho compilato i campi in verde: controlla e conferma." : "") + (mancati.length ? ` Non ho trovato «${mancati.join("», «")}» tra le scelte: sceglilo tu.` : ""), false)
    : bollaRisposta;
  if(b && fatti.length){
    const riga = document.createElement("div"); riga.className = "conf-fum-bottoni";
    riga.innerHTML = '<button type="button" class="btn btn-primary btn-sm">Conferma</button><button type="button" class="btn btn-outline btn-sm">Correggo io</button>';
    riga.children[0].onclick = () => { riga.remove(); confAthena(false); confAvanti(); };
    riga.children[1].onclick = () => { riga.remove(); confAthena(false); fatti[0].focus(); };
    b.insertBefore(riga, b.querySelector(".conf-coda"));
  }
  fatti[0]?.scrollIntoView({ block: "nearest", behavior: "smooth" });
}
