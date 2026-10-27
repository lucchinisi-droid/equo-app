// Equo App · proprietario · modulo (moduli ES, costruiti con Vite in ruoli/proprietario/costruito.js)
import { caricaProposteCavalli, proposteInAttesa } from "./024-codice-cavallo-2c-proposte-livelli-confe.js";
/* ---------- ONBOARDING PREDITTIVO lato proprietario (27/10/2026, caso Sara Matteucci) ----------
   1. «<maniscalco> ti segue già»: il maniscalco ha registrato la tua email → un tocco e siete collegati (senza codice).
   2. Con cavalli preparati dal maniscalco la Home non dice «Aggiungi il tuo primo cavallo» e il modulo «Nuovo cavallo»
      invita ad accettarli (niente schede doppie).
   3. Data di nascita oggi o nel futuro (spesso è quella proposta dal telefono): si chiede conferma prima di salvare. */
const ONB_NO = "equo_ti_seguono_no";
let tiSeguono = [], onbAgganciato = false;
function onbNascosti(){ try{ return JSON.parse(localStorage.getItem(ONB_NO) || "[]"); }catch(e){ return []; } }
function onbVisibili(){ const no = onbNascosti(); return tiSeguono.filter(x => !no.includes(x.cliente_mascalcia_id)); }
function onbNascondiSetup(){
  if(!(typeof horses !== "undefined" && horses.length === 0)) return;
  if(!onbVisibili().length && !proposteInAttesa().length) return;
  const s = document.getElementById("home-setup"); if(s) s.style.display = "none";
}
function onbAggancia(){
  if(onbAgganciato || typeof estendiDopo !== "function") return;
  onbAgganciato = true;
  estendiDopo("renderHome", onbNascondiSetup);
  estendiPrima("eseguiSalvataggioHorse", async payload => {
    const oggi = new Date(), iso = oggi.getFullYear() + "-" + String(oggi.getMonth() + 1).padStart(2, "0") + "-" + String(oggi.getDate()).padStart(2, "0");
    if(!payload?.birth_date || payload.birth_date < iso) return true;
    const d = new Date(payload.birth_date + "T12:00").toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });
    const ok = await chiediSiNo("Nato il " + d + "?", "La data di nascita è oggi o nel futuro: spesso è quella che propone il telefono. Nome, razza e data di nascita servono per il codice definitivo. «Sì» salva così, «No» torna a correggerla.");
    if(!ok) setTimeout(() => document.getElementById("horse-birthdate")?.focus(), 150);
    return ok;
  });
}
async function onbCaricaTiSeguono(){
  onbAggancia();
  const box = document.getElementById("home-ti-seguono");
  if(!box) return;
  if(DEMO_MODE){ box.innerHTML = ""; return; }
  try{ const { data, error } = await sb.rpc("equo_professionisti_che_mi_seguono"); tiSeguono = !error && Array.isArray(data) ? data : []; }catch(e){ tiSeguono = []; }
  const l = onbVisibili();
  if(!l.length){ box.innerHTML = ""; return; }
  box.innerHTML = l.map(x => {
    const cav = Array.isArray(x.cavalli) ? x.cavalli : [];
    const elenco = cav.length ? "con " + (cav.length > 3 ? cav.slice(0, 3).join(", ") + " e altri " + (cav.length - 3) : cav.join(cav.length === 2 ? " e " : ", ")) : "";
    return `<div class="card" style="margin-bottom:14px">
      <div class="section-title" style="margin-bottom:4px">🔗 ${escapeHtml(x.maniscalco || "Il tuo maniscalco")} ti segue già${elenco ? " " + escapeHtml(elenco) : ""}</div>
      <div class="muted" style="font-size:13px;line-height:1.5;margin-bottom:10px">${x.lavori ? `Ha già registrato ${x.lavori} ${x.lavori === 1 ? "lavoro" : "lavori"}. ` : ""}Collegati: niente codice da scrivere, e i cavalli arrivano nel tuo account con i lavori già nel libretto.</div>
      <div style="display:flex;gap:8px"><button class="btn btn-primary" style="flex:1" onclick="onbCollegati('${x.cliente_mascalcia_id}', this)">Collegati</button>
        <button class="btn btn-ghost" onclick="onbNonSonoIo('${x.cliente_mascalcia_id}')">Non sono io</button></div>
    </div>`;
  }).join("");
  onbNascondiSetup();
}
async function onbCollegati(id, btn){
  if(btn) btn.disabled = true;
  try{
    const { data, error } = await sb.rpc("equo_collegati_da_contatto", { p_cliente: id });
    if(error || !data?.ok){ showToast(data?.errore === "codice_gia_usato" ? "Questo profilo è già collegato a un altro account." : "Collegamento non riuscito, riprova o chiedi il QR al maniscalco."); return; }
    showToast(`Collegato a ${data.nome_maniscalco}. Ora accetta i cavalli che ti ha preparato.`);
    await onbCaricaTiSeguono();
    await caricaProposteCavalli();
    try{ if(typeof caricaManiscalcoCliente === "function") caricaManiscalcoCliente(); }catch(e){}
    document.getElementById("home-proposte")?.scrollIntoView({ behavior: "smooth", block: "start" });
  } finally { if(btn) btn.disabled = false; }
}
function onbNonSonoIo(id){
  const no = onbNascosti(); no.push(id);
  try{ localStorage.setItem(ONB_NO, JSON.stringify(no.slice(-20))); }catch(e){}
  tiSeguono = tiSeguono.filter(x => x.cliente_mascalcia_id !== id);
  onbCaricaTiSeguono();
}
// «Nuovo cavallo» con cavalli già preparati dal maniscalco: avviso in cima al modulo
function onbAvvisoNuovoCavallo(nuovo){
  const form = document.querySelector("#modal-add-horse .auth-form");
  if(!form) return;
  let box = document.getElementById("horse-onb-avviso");
  const p = nuovo ? proposteInAttesa() : [];
  if(!p.length){ if(box) box.remove(); return; }
  if(!box){ box = document.createElement("div"); box.id = "horse-onb-avviso"; box.className = "card"; box.style.cssText = "margin-bottom:12px;padding:12px;border:1.5px solid var(--accent)"; form.insertBefore(box, form.firstChild); }
  const man = p[0].maniscalco || "Il tuo maniscalco", nomi = p.map(x => x.nome).filter(Boolean);
  box.innerHTML = `<div style="font-size:13.5px;line-height:1.5"><b>${escapeHtml(man)}</b> ti ha già preparato ${escapeHtml(nomi.join(", "))}, con i lavori già fatti. Accettali invece di crearli da zero: niente schede doppie.</div>
    <button type="button" class="btn btn-primary btn-sm" style="width:100%;margin-top:8px" onclick="onbVaiAiProposti()">Vai ai cavalli preparati</button>
    <div class="muted" style="font-size:11.5px;margin-top:6px">Se è un altro cavallo continua qui sotto. Con lo stesso nome si collega da solo alla scheda del maniscalco.</div>`;
}
function onbVaiAiProposti(){
  closeModal("modal-add-horse");
  try{ showPage("home"); }catch(e){}
  setTimeout(() => document.getElementById("home-proposte")?.scrollIntoView({ behavior: "smooth", block: "start" }), 200);
}

export { onbAvvisoNuovoCavallo, onbCaricaTiSeguono, onbCollegati, onbNonSonoIo, onbVaiAiProposti };
