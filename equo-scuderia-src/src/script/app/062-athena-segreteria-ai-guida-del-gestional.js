/* ---------- ATHENA (segreteria AI: guida del gestionale + situazione del centro) ---------- */
// La funzione è sul sito dell'app: /api/agent è un proxy (netlify.toml) → stesso dominio, niente CORS.
let athenaCaricata = false, athenaInCorso = false, agenteAttivo = "athena";
const AGENTI_CHAT = {
  athena: { nome:"Athena", sub:"la tua segreteria AI · conosce tutto il gestionale", cls:"", placeholder:"Chiedi ad Athena come si fa qualcosa…",
    chips:["Cosa c'è da fare oggi?","Come invito un nuovo allievo?","Come creo un carnet di lezioni?","Come collego un maniscalco?","Cosa posso fare con il gestionale?"] },
  merlino: { nome:"Merlino", sub:"numeri, conti e strategia del centro", cls:"merlino-av", placeholder:"Chiedi a Merlino dei numeri del centro…",
    chips:["Come sta andando il centro questo mese?","Quali cavalli mi fanno guadagnare di più?","Chi rischio di perdere e cosa gli scrivo?","Cosa fa la concorrenza della zona?","E se aumento la lezione di 2 €?"] },
  hammer: { nome:"Hammer", sub:"mascalcia: pareggio, ferri e piede equino", cls:"", placeholder:"Chiedi a Hammer di ferratura e piedi…",
    chips:["Che ferro consigli per un cavallo con i talloni bassi?","Ogni quanto va ricontrollato un pareggio?","Come riconosco i primi segni di laminite?","Quali cavalli del centro hanno note sui piedi?"] },
  ares: { nome:"Ares", sub:"allenamento: programmi di lavoro e lezioni", cls:"", placeholder:"Chiedi ad Ares di allenamenti e lezioni…",
    chips:["Imposta una lezione di 45 minuti sul lavoro in piano","Come preparo un cavallo giovane al salto?","Esercizi per migliorare l'assetto di un principiante","Che programma consigli per un cavallo che riparte dopo una pausa?"] },
};
const AGENTI_IMG = { athena:"athena", merlino:"merlino", hammer:"hammer", ares:"ares" };
function apriAthena(){ apriAgente("athena"); }
async function apriAgente(key, domanda){
  Registro.pagina("agente-" + key);
  if(key !== "athena" && pianoCentro && !(pianoCentro.agenti || []).includes(key) && !(proveAgenti && proveAgenti[key]?.stato === "attiva")){ apriUpsell("agenti"); return; }
  const a = AGENTI_CHAT[key] || AGENTI_CHAT.athena;
  if(agenteAttivo !== key){ agenteAttivo = key; athenaCaricata = false; }
  const av = document.getElementById("ag-av");
  av.className = "athena-av " + a.cls;
  av.innerHTML = ""; av.style.cssText = "background:url(assets/agenti/" + (AGENTI_IMG[key] || "athena") + ".webp) center/cover no-repeat;font-size:0";
  document.getElementById("ag-nome").textContent = a.nome;
  document.getElementById("ag-sub").textContent = a.sub;
  document.getElementById("athena-input").placeholder = a.placeholder;
  const chips = document.getElementById("athena-chips");
  chips.innerHTML = a.chips.map((c, i) => `<button ${key === "athena" && i === 0 ? "data-proattiva" : ""} onclick="athenaChiedi(this.textContent)">${escapeHtml(c)}</button>`).join("");
  applicaPianoGating();
  document.getElementById("athena-uso").textContent = "";
  await apriAthenaPannello();
  if(domanda) athenaChiedi(domanda);
}

function athenaFormatta(testo){
  const righe = escapeHtml(testo || "").split("\n");
  let html = "", lista = null;
  const inline = t => t.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*(?!\s)(.+?)\*(?!\*)/g, "$1<em>$2</em>")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  const chiudi = () => { if(lista){ html += `</${lista}>`; lista = null; } };
  righe.forEach(r => {
    const num = r.match(/^\s*\d+[.)]\s+(.*)$/), pun = r.match(/^\s*[-•*]\s+(.*)$/);
    if(num || pun){ const t = num ? "ol" : "ul"; if(lista !== t){ chiudi(); html += `<${t}>`; lista = t; } html += `<li>${inline((num || pun)[1])}</li>`; return; }
    chiudi();
    if(r.trim()) html += `<p>${inline(r.replace(/^#+\s*/, ""))}</p>`;
  });
  chiudi();
  return html || "<p></p>";
}
function athenaBolla(ruolo, testo, extraClass){
  const box = document.getElementById("athena-box");
  const el = document.createElement("div");
  el.className = "athena-msg " + (ruolo === "user" ? "io" : "ai") + (extraClass ? " " + extraClass : "");
  if(ruolo === "user") el.textContent = testo; else el.innerHTML = athenaFormatta(testo);
  box.appendChild(el);
  box.scrollTop = box.scrollHeight;
  return el;
}
function athenaBenvenuto(){
  const nome = (currentMembro?.nome_visualizzato || "").split(" ")[0];
  if(agenteAttivo === "merlino"){
    athenaBolla("assistant", `Ciao${nome ? " " + nome : ""}! Sono **Merlino** 🔮, l'agente di Equo Scuderia per numeri, conti e strategia.\nLeggo i dati del centro e ti dico **dove guadagni, dove perdi e cosa fare**: incassi, clienti a rischio, margine per cavallo, occupazione, e cosa fa la **concorrenza della zona**. Prova a chiedermi "come sta andando il centro?".`);
    return;
  }
  if(agenteAttivo === "hammer"){
    athenaBolla("assistant", `Ciao${nome ? " " + nome : ""}! Sono **Hammer**, l'agente di Equo per la **mascalcia**.\nTi aiuto su pareggio, ferri, piede equino e andature, anche sui cavalli di ${currentCentro?.nome || "questo centro"}. Chiedimi pure.`);
    return;
  }
  if(agenteAttivo === "ares"){
    athenaBolla("assistant", `Ciao${nome ? " " + nome : ""}! Sono **Ares**, l'agente di Equo per l'**allenamento**.\nPreparo programmi di lavoro e lezioni per allievi e cavalli di ${currentCentro?.nome || "questo centro"}. Dimmi cosa ti serve.`);
    return;
  }
  if(pianoCentro && pianoCentro.athena_proattiva === false){
    athenaBolla("assistant", `Ciao${nome ? " " + nome : ""}! Sono **Athena**, la guida di ${currentCentro?.nome || "Equo Scuderia"}.\nChiedimi **come si fa** qualsiasi cosa nel gestionale e ti porto passo passo, con un esempio.`);
    return;
  }
  athenaBolla("assistant", `Ciao${nome ? " " + nome : ""}! Sono **Athena**, la segreteria AI di ${currentCentro?.nome || "Equo Scuderia"}.\nSono la segretaria del centro: conosco iscritti, cavalli, staff e le procedure del gestionale. Chiedimi **come si fa** e ti porto passo passo, con un esempio. Posso anche dirti **cosa c'è da fare** oggi (lezioni, carnet, box). Per magazzino, salute, ferratura e allenamenti ci sono gli agenti specializzati.`);
}
async function apriAthenaPannello(){
  openModal("modal-athena");
  if(!athenaCaricata){
    athenaCaricata = true;
    const box = document.getElementById("athena-box"); box.innerHTML = "";
    if(!DEMO_MODE && currentCentro?.id){
      let q = sb.from("ai_messaggi").select("ruolo, contenuto").eq("vista", "scuderia").eq("centro_id", currentCentro.id);
      q = agenteAttivo !== "athena" ? q.eq("agente", agenteAttivo) : q.or("agente.is.null,agente.eq.athena");
      const { data } = await q.order("created_at", { ascending: false }).limit(30);
      const storia = (data || []).reverse();
      if(storia.length){ storia.forEach(m => athenaBolla(m.ruolo, m.contenuto)); document.getElementById("athena-chips").style.display = "none"; }
      else athenaBenvenuto();
    } else athenaBenvenuto();
  }
  setTimeout(() => { if(window.innerWidth > 700) document.getElementById("athena-input").focus(); }, 60);
}
function athenaChiedi(testo){ document.getElementById("athena-input").value = testo; athenaInvia(); }
function athenaNuovaChat(){
  document.getElementById("athena-box").innerHTML = "";
  document.getElementById("athena-chips").style.display = "flex";
  athenaBenvenuto();
}
async function athenaInvia(){
  const input = document.getElementById("athena-input");
  const testo = input.value.trim();
  if(!testo || athenaInCorso) return;
  input.value = ""; input.style.height = "auto";
  document.getElementById("athena-chips").style.display = "none";
  athenaBolla("user", testo);
  const pensa = athenaBolla("assistant", "Athena sta scrivendo…", "pensa");
  if(DEMO_MODE){
    if(agenteAttivo === "merlino"){ setTimeout(() => { pensa.classList.remove("pensa"); pensa.innerHTML = athenaFormatta("**[Demo] Incassi di questo mese: € 3.380, +11% sul mese scorso.**\n- Il margine più basso è **Brezza**: la pensione (€ 300) non copre i costi (€ 360 con la quota comune).\n- 3 clienti non montano da più di 3 settimane.\nCosa farei:\n1. Porta la pensione di Brezza a € 380 al rinnovo.\n2. Scrivi oggi a Sofia, Marco ed Elena (Statistiche → Clienti a rischio → \"Scrivi\")."); }, 600); return; }
    setTimeout(() => { pensa.classList.remove("pensa"); pensa.innerHTML = athenaFormatta("**[Demo]** Nel gestionale vero qui Athena ti risponde con la procedura esatta, per esempio:\n**Dove**: menu \"Cavalli\" → \"+\" Nuovo cavallo\n1. Inserisci nome e proprietario.\n2. Scegli il box.\n3. Tocca \"Salva\"."); }, 600);
    return;
  }
  athenaInCorso = true; document.getElementById("athena-send").disabled = true;
  try{
    const { data: sess } = await sb.auth.getSession();
    const token = sess?.session?.access_token;
    const res = await fetch("/api/agent", { method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: "Bearer " + token } : {}) },
      body: JSON.stringify({ message: testo, vista: "scuderia", agente: agenteAttivo, centro_id: currentCentro?.id }) });
    const data = await res.json().catch(() => ({}));
    pensa.classList.remove("pensa");
    if(res.status === 401) pensa.innerHTML = athenaFormatta("Sessione scaduta: esci e rientra per parlare con Athena.");
    else if(res.status === 403 && data.bloccato){ pensa.innerHTML = athenaFormatta(`${AGENTI_CHAT[agenteAttivo].nome} non è attivo per questo centro (o la prova è finita): lo trovi in "Agenti AI".`); proveAgenti = undefined; }
    else if(res.status === 403) pensa.innerHTML = athenaFormatta(data.error ? data.error + "." : "Non risulti nello staff di questo centro.");
    else if(data.limite_raggiunto && agenteAttivo !== "athena" && data.uso.limite === 10 && !((pianoCentro?.agenti || []).includes(agenteAttivo))){ pensa.innerHTML = athenaFormatta(`La prova gratuita di ${AGENTI_CHAT[agenteAttivo].nome} è finita (10 messaggi). Se ti è piaciuto lo attivi da "Agenti AI".`); proveAgenti = undefined; }
    else if(data.limite_raggiunto) pensa.innerHTML = athenaFormatta(`Il centro ha usato tutti i **${data.uso.limite} messaggi** di ${AGENTI_CHAT[agenteAttivo].nome} di questo mese: il contatore riparte il 1° del mese.${agenteAttivo !== "athena" ? " Puoi aggiungere messaggi extra da \"Agenti AI\" (200 a 7 € o 500 a 15 € + IVA al mese, condivisi fra gli agenti)." : ""} Per un problema urgente usa "Serve aiuto?" → "Apri un ticket" in Home.`);
    else pensa.innerHTML = athenaFormatta(data.reply || "Non sono riuscita a rispondere, riprova.");
    if(data.uso) document.getElementById("athena-uso").textContent = data.prova ? `Prova gratuita: ${data.uso.usati} di ${data.uso.limite} messaggi a ${AGENTI_CHAT[agenteAttivo].nome}` : `${data.uso.usati} di ${data.uso.limite} messaggi a ${AGENTI_CHAT[agenteAttivo].nome} questo mese (tutto il centro)`;
    if(data.prova) proveAgenti = undefined;
  } catch(e){
    pensa.classList.remove("pensa"); pensa.textContent = "Errore di connessione, riprova.";
  }
  athenaInCorso = false; document.getElementById("athena-send").disabled = false;
  document.getElementById("athena-box").scrollTop = 1e9;
}

