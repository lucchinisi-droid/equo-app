// Equo App · maniscalco · modulo (moduli ES, costruiti con Vite in ruoli/maniscalco/costruito.js)
import { cavalliEditCache, renderCavalliEditCliente } from "./034-strutture-collegate-a-equo-scuderia-prof.js";
import { syncNomeCavalloCliente } from "./035-ferratura-del-cavallo-scheda-libretto-fe.js";
import { caricaCavalliMiei } from "./086-indice-dei-cavalli-dei-clienti-professio.js";
/* ---------- «NON LO SEGUO PIÙ» / «ARCHIVIA» (24/10/2026, caso Rio) ----------
   I cavalli non si eliminano più.
   - Collegati a un proprietario o a una scuderia: richiesta che il proprietario o la scuderia confermano o rifiutano
     (messaggio in chat + riquadro in Home); finché non rispondono il cavallo resta nella lista con «In attesa di conferma».
   - Inseriti solo dal maniscalco: archiviati, con lo storico; si ripristinano da «Cavalli archiviati». */
let lasciaSel = null;

function apriLasciaCavallo(key){
  const x = (cavalliEditCache || []).find(c => c.key === key);
  if(!x) return;
  lasciaSel = x;
  const coll = !!(x.tipo === "equo" || x.horse_id || x.scuderia_cavallo_id);
  document.getElementById("lc-tit").textContent = coll ? "Non seguo più " + x.nome : "Archivia " + x.nome;
  document.getElementById("lc-testo").textContent = coll
    ? "Il cavallo è collegato al proprietario o alla scuderia: riceveranno la tua richiesta e la confermeranno. Finché non rispondono, il cavallo resta nella tua lista. Il suo storico non si cancella."
    : "Il cavallo esce dalla tua lista, ma il suo storico resta. Lo ritrovi in «Cavalli archiviati» e puoi ripristinarlo quando vuoi.";
  document.getElementById("lc-motivo-box").style.display = coll ? "block" : "none";
  document.getElementById("lc-motivo").value = "";
  const ok = document.getElementById("lc-ok");
  ok.textContent = coll ? "Invia la richiesta" : "Archivia";
  ok.disabled = false;
  openModal("modal-lascia-cavallo");
}

async function aggiornaDopoLascia(){
  await renderCavalliEditCliente();
  await syncNomeCavalloCliente().catch(() => {});
  await caricaCavalliMiei().catch(() => {});
}

async function confermaLasciaCavallo(){
  const x = lasciaSel; if(!x) return;
  const ok = document.getElementById("lc-ok"); ok.disabled = true;
  let id = x.id;
  if(!id){   // cavallo del proprietario senza scheda del maniscalco: la crea (serve per la richiesta)
    const r = await DB.risolviCavalloPerIntervento(currentClienteId, x);
    id = r.cavallo_cliente_id;
  }
  if(!id){ ok.disabled = false; showToast("Operazione non riuscita. Riprova."); return; }
  const res = await DB.lasciaCavallo(id, document.getElementById("lc-motivo").value.trim());
  ok.disabled = false;
  if(!res || !res.ok){
    showToast(res?.motivo === "manca_db" ? "Funzione non ancora attiva: serve l'aggiornamento del database." : "Operazione non riuscita. Riprova.");
    return;
  }
  closeModal("modal-lascia-cavallo");
  lasciaSel = null;
  showToast(res.archiviato ? "Cavallo archiviato" : "Richiesta inviata: aspetta la conferma del proprietario o della scuderia");
  await aggiornaDopoLascia();
}

async function annullaLasciaCavallo(id){
  const res = await DB.riprendiCavallo(id);
  if(!res || !res.ok){ showToast("Operazione non riuscita. Riprova."); return; }
  showToast("Richiesta annullata: continui a seguirlo");
  await aggiornaDopoLascia();
}

async function ripristinaCavallo(id){
  const res = await DB.riprendiCavallo(id);
  if(!res || !res.ok){ showToast("Operazione non riuscita. Riprova."); return; }
  showToast("Cavallo ripristinato");
  await aggiornaDopoLascia();
}

export { annullaLasciaCavallo, apriLasciaCavallo, confermaLasciaCavallo, ripristinaCavallo };
