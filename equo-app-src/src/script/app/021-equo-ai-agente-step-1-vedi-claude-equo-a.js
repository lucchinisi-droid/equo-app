/* ---------- EQUO AI (agente, Step 1 — vedi claude/equo-agenti-ai.md) ---------- */
let aiStoriaCaricata = false;
function vistaAi(){
  const v = currentUser?.vistaAttiva || currentUser?.ruolo;
  return PRO_ROLES.includes(v) ? "professionista" : "proprietario";
}
// Hammer = agente dei maniscalchi (vista professionista con ruolo maniscalco);
// Pegasus = agente del proprietario (vista proprietario); vet/istruttori: Equo AI neutro (fino a Galeno/Ares)
function agenteAiHammer(){
  return vistaAi() === "professionista" && (currentUser?.vistaAttiva || currentUser?.ruolo) === "maniscalco";
}
function nomeAgenteAi(){
  return agenteAiHammer() ? "Hammer" : vistaAi() === "proprietario" ? "Pegasus" : (currentUser?.vistaAttiva || currentUser?.ruolo) === "veterinario" ? "Galeno" : (currentUser?.vistaAttiva || currentUser?.ruolo) === "istruttore" ? "Ares" : "Equo AI";
}
const BENVENUTO_PEGASUS = 'Ciao, sono <strong>Pegasus</strong> 🪽. Tengo d\'occhio i tuoi cavalli: scadenze, spese, appuntamenti col maniscalco e lezioni, e ti dico cosa fare e quando. Prova a chiedermi <em>"Cosa scade questo mese?"</em> o <em>"Quanto ho speso in pensione quest\'anno?"</em>. Con la 📎 mandami una fattura o il certificato vaccinale: preparo io le schede da confermare.';
const BENVENUTO_EQUO_AI = document.getElementById("ai-benvenuto")?.innerHTML || "";
function aggiornaTestataAi(){
  const hammer = agenteAiHammer();
  const pegasus = !hammer && vistaAi() === "proprietario";
  const titolo = document.getElementById("ai-sheet-titolo");
  if(titolo) titolo.textContent = hammer ? "Hammer · mascalcia" : pegasus ? "Pegasus · il tuo assistente" : "Assistente AI";
  const benv = document.getElementById("ai-benvenuto");
  if(benv) benv.innerHTML = hammer
    ? 'Ciao, sono <strong>Hammer</strong> 🔨, l\'agente di mascalcia di Equo. Tecnica (pareggio, ferri ortopedici, setole, laminite), prodotti e link da Mustad, Kerckhaert e O\'Grady, e il tuo lavoro: prova <em>"cosa ho domani?"</em>, <em>"chi ha la ferratura scaduta?"</em>, <em>"quanto devo incassare?"</em>. Con la 📎 mandami la foto di uno zoccolo.'
    : pegasus ? BENVENUTO_PEGASUS : BENVENUTO_EQUO_AI;
  const input = document.getElementById("chat-input");
  if(input) input.placeholder = hammer ? "Chiedi a Hammer o allega una foto…" : pegasus ? "Chiedi a Pegasus o allega una foto…" : "Scrivi o allega una foto…";
}
let aiStoriaVista = null;
// versioni mostrate in fondo al menu profilo. REGOLA DI SIMONE (27/09/2026): restano tutte v1.0 finché non decide
// lui di cambiarle (almeno 10-20 utenti reali). NON aumentarle in automatico né a ogni deploy.
const VERSIONI = { app: "1.0", pegasus: "1.0", hammer: "1.0" };
function aggiornaVersioniMenu(){
  const el = document.getElementById("menu-versioni");
  if(!el) return;
  const agente = agenteAiHammer() ? `Hammer v${VERSIONI.hammer}` : vistaAi() === "proprietario" ? `Pegasus v${VERSIONI.pegasus}` : "";
  el.textContent = `Equo App v${VERSIONI.app}` + (agente ? ` · ${agente}` : "");
}
// tasto rotondo AI: icona dell'agente della vista attiva (Pegasus / Hammer; vet e istruttori: scintille)
function aggiornaFabAi(){
  const fab = document.getElementById("ai-fab"), ic = document.getElementById("ai-fab-icona");
  if(!fab || !ic) return;
  const hammer = agenteAiHammer(), pegasus = !hammer && vistaAi() === "proprietario";
  fab.classList.toggle("agente-hammer", hammer);
  fab.classList.toggle("agente-pegasus", pegasus);
  ic.className = "fa-solid " + (hammer ? "fa-hammer" : "fa-horse-head") + " ai-fab-agente";
  fab.setAttribute("aria-label", hammer ? "Hammer, agente di mascalcia" : pegasus ? "Pegasus, il tuo assistente" : "Assistente AI");
}
// ---- Novità nella chat dell'agente: riepilogo del lunedì (solo Pegasus) + annunci (tutti gli agenti).
// Pallino rosso sul tasto AI finché non si apre la chat; aprendola si segnano come letti.
let novitaAi = { riepilogo: false, annunci: false };
async function controllaNovitaAi(){
  if(DEMO_MODE || !currentUser) return;
  const vista = vistaAi();
  const [r, a] = await Promise.all([
    sb.from("ai_riepiloghi").select("settimana").eq("user_id", currentUser.id).eq("vista", vista).is("letto_il", null).limit(1),
    sb.from("annunci_destinatari").select("annuncio_id").eq("user_id", currentUser.id).eq("vista", vista).is("letto_il", null).limit(1),
  ]);
  if(r.error) console.error("controllaNovitaAi riepilogo:", r.error);
  if(a.error) console.error("controllaNovitaAi annunci:", a.error);
  if(vista !== vistaAi()) return; // nel frattempo ha cambiato vista
  novitaAi = { riepilogo: !!r.data?.length, annunci: !!a.data?.length };
  document.getElementById("ai-fab")?.classList.toggle("con-novita", novitaAi.riepilogo || novitaAi.annunci);
  if(typeof hmNovitaHammer === "function") hmNovitaHammer();
}
async function segnaNovitaLette(){
  document.getElementById("ai-fab")?.classList.remove("con-novita");
  if(typeof hmNovitaHammer === "function") hmNovitaHammer();
  if(DEMO_MODE || !currentUser) return;
  const ora = new Date().toISOString(), vista = vistaAi(), n = novitaAi;
  novitaAi = { riepilogo: false, annunci: false };
  if(n.riepilogo){
    const { error } = await sb.from("ai_riepiloghi").update({ letto_il: ora }).eq("user_id", currentUser.id).eq("vista", vista).is("letto_il", null);
    if(error) console.error("segnaNovitaLette riepilogo:", error);
  }
  if(n.annunci){
    const { error } = await sb.from("annunci_destinatari").update({ letto_il: ora }).eq("user_id", currentUser.id).eq("vista", vista).is("letto_il", null);
    if(error) console.error("segnaNovitaLette annunci:", error);
  }
}

// testi dei pop-up di sistema (vedi sotto)
const CHIAVE_ULTIMO_ONLINE = "equo-ultimo-online";
// diventa true quando è pronta la coda offline (livello 2): da lì il testo dice che si può lavorare offline e le modifiche partono dopo
const OFFLINE_CODA_ATTIVA = true;
const TESTO_OFFLINE = () => OFFLINE_CODA_ATTIVA
  ? `Nessun problema: <b>puoi continuare a lavorare</b>. Tutto quello che registri (interventi, appuntamenti, spese, eventi sanitari e messaggi) viene salvato sul telefono e <b>inviato da solo</b> appena torna la connessione.`
  : `Nessun problema: <b>puoi continuare a usare Equo</b> e consultare tutto quello che hai già aperto. Per salvare nuove modifiche serve la connessione: appena torna te lo diciamo noi e tutto si aggiorna da solo.`;
const TESTO_AGGIORNAMENTO = "Una nuova versione di Equo è pronta. Aggiornare richiede pochi secondi e non perdi nessun dato.";
