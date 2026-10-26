// Equo App · cavalli · modulo (moduli ES, costruiti con Vite in ruoli/cavalli/costruito.js)
import { loadCavalli, renderCavalliList } from "./039-cavalli-salute.js";
import { renderCavalloDetail } from "./040-allegati-del-cavallo-condivisi-con-propr.js";
import { uploadCavalloFoto } from "./041-scheda-cavallo-pdf-brandizzato-equo-qr-s.js";
import { proponiImportCavalli } from "./050-import-cavalli-dopo-collegamento-proprie.js";
/* ---------- RAZZA: menu con ricerca (stesso codice in App e Scuderia) ----------
   Si salva solo una razza scelta dall'elenco Equo (tabella equo_razze, sigla del codice cavallo).
   Fuori elenco: "La mia razza non c'è" → "Altra razza (testo)" + segnalazione a Equo. */
let RAZZE_EQUO = [["Avelignese", "AVE", 1, ["haflinger italiano"]], ["Bardigiano", "BAR", 1, []], ["Calabrese", "CAL", 1, []], ["Catria", "CTR", 1, []], ["Cavallo del Delta", "DEL", 1, ["delta"]], ["Cavallo del Ventasso", "VEN", 1, ["ventasso"]], ["Esperia", "ESP", 1, ["pony esperia"]], ["Cavallino della Giara", "GIA", 1, ["giara"]], ["Lipizzano", "LIP", 1, ["lipizzaner"]], ["Maremmano", "MAR", 1, ["maremma"]], ["Monterufolino", "MTR", 1, []], ["Murgese", "MUR", 1, []], ["Napoletano", "NAP", 1, []], ["Norico", "NOR", 1, ["noriker"]], ["Pentro", "PEN", 1, []], ["Persano", "PRS", 1, []], ["Salernitano", "SAL", 1, []], ["Sanfratellano", "SFT", 1, ["san fratellano"]], ["Sarcidano", "SRC", 1, []], ["Sella Italiano", "SIT", 1, ["sella italiana", "si"]], ["Purosangue Orientale Siciliano", "SIC", 1, ["siciliano", "orientale siciliano"]], ["Tolfetano", "TOL", 1, []], ["Trottatore Italiano", "TIT", 1, ["trottatore"]], ["Anglo-Arabo Sardo", "AAS", 1, ["anglo arabo sardo"]], ["Tiro Pesante Rapido", "TPR", 1, ["tpr"]], ["Purosangue Inglese", "PSI", 0, ["psi", "purosangue", "thoroughbred", "inglese"]], ["Purosangue Arabo", "PSA", 0, ["arabo", "psa", "arabian"]], ["Anglo-Arabo", "AAR", 0, ["anglo arabo"]], ["Shagya", "SHA", 0, ["arabo shagya"]], ["Akhal-Teke", "AKT", 0, ["akhal teke"]], ["Barbero", "BRB", 0, ["barbo"]], ["Standardbred", "STB", 0, ["trottatore americano"]], ["Trottatore Francese", "TFR", 0, ["trotteur francais"]], ["Orlov", "ORL", 0, ["trottatore russo"]], ["Hannover", "HAN", 0, ["hannoveraner", "annover"]], ["Holsteiner", "HOL", 0, ["holstein"]], ["Oldenburg", "OLD", 0, ["oldenburger"]], ["Westfalen", "WES", 0, ["westfalico"]], ["Trakehner", "TRK", 0, ["trakener"]], ["Hessen", "HES", 0, []], ["Brandenburg", "BRA", 0, []], ["Mecklenburg", "MEC", 0, []], ["Württemberg", "WUR", 0, ["wurttemberg"]], ["Bayerisches Warmblut", "BAY", 0, ["bavarese"]], ["Zangersheide", "ZAN", 0, []], ["KWPN", "KWP", 0, ["sella olandese", "dutch warmblood", "olandese"]], ["BWP", "BWP", 0, ["sella belga"]], ["Selle Français", "SFR", 0, ["sella francese", "selle francais"]], ["Sella Svedese", "SWB", 0, ["swb"]], ["Sella Danese", "DWB", 0, ["dwb"]], ["Irish Sport Horse", "ISH", 0, ["irlandese"]], ["Irish Draught", "IRD", 0, []], ["Wielkopolski", "WIE", 0, []], ["Małopolski", "MAL", 0, ["malopolski"]], ["Kisbéri", "KIS", 0, ["kisberi"]], ["Nonius", "NON", 0, []], ["Furioso-North Star", "FUR", 0, ["furioso"]], ["Lusitano", "LUS", 0, []], ["PRE (Pura Raza Española)", "PRE", 0, ["andaluso", "pura raza espanola", "spagnolo"]], ["Hispano-Arabo", "HIS", 0, []], ["Frisone", "FRI", 0, ["friesian"]], ["Gelderlander", "GEL", 0, []], ["Groninger", "GRO", 0, []], ["Kladruber", "KLA", 0, []], ["Cleveland Bay", "CLE", 0, []], ["Hackney", "HAC", 0, []], ["Quarter Horse", "QTR", 0, ["quarter", "qh"]], ["Paint Horse", "PNT", 0, ["paint"]], ["Appaloosa", "APP", 0, []], ["Mustang", "MUS", 0, []], ["Morgan", "MOR", 0, []], ["Tennessee Walking Horse", "TWH", 0, []], ["American Saddlebred", "ASB", 0, ["saddlebred"]], ["Missouri Fox Trotter", "MFT", 0, []], ["Rocky Mountain Horse", "RMH", 0, []], ["Palomino", "PAL", 0, []], ["Buckskin", "BUC", 0, []], ["Pinto", "PIN", 0, []], ["Criollo", "CRI", 0, []], ["Paso Fino", "PSF", 0, []], ["Paso Peruviano", "PSP", 0, []], ["Mangalarga Marchador", "MNG", 0, ["mangalarga"]], ["Campolina", "CMP", 0, []], ["Azteca", "AZT", 0, []], ["Bretone", "BRE", 0, []], ["Percheron", "PER", 0, []], ["Ardennese", "ARD", 0, ["ardennes"]], ["Comtois", "CMT", 0, []], ["Boulonnais", "BOU", 0, []], ["Belga da tiro", "BEL", 0, ["brabante"]], ["Clydesdale", "CLY", 0, []], ["Shire", "SHI", 0, []], ["Suffolk Punch", "SUF", 0, ["suffolk"]], ["Schwarzwälder Fuchs", "SWF", 0, ["schwarzwalder"]], ["Freiberger", "FRB", 0, ["franches-montagnes", "franches montagnes"]], ["Fjord", "FJO", 0, ["fiordo", "fjord norvegese"]], ["Döle", "DOL", 0, ["dole"]], ["Jutland", "JUT", 0, []], ["Vladimir", "VLA", 0, []], ["Shetland", "SHE", 0, []], ["Welsh", "WEL", 0, ["welsh pony", "welsh cob"]], ["Connemara", "CON", 0, []], ["New Forest", "NFO", 0, []], ["Dartmoor", "DAR", 0, []], ["Exmoor", "EXM", 0, []], ["Highland", "HIG", 0, []], ["Fell", "FEL", 0, []], ["Dales", "DAL", 0, []], ["Eriskay", "ERI", 0, []], ["Haflinger", "HAF", 0, ["avelignese haflinger"]], ["Islandese", "ISL", 0, ["icelandic"]], ["Pony Tedesco da Sella", "DRP", 0, ["deutsches reitpony"]], ["Pony Olandese", "PON", 0, []], ["Pony Francese da Sella", "PFS", 0, ["poney francais de selle"]], ["Falabella", "FAL", 0, []], ["Miniature Horse", "MIN", 0, ["cavallo miniatura", "mini horse"]], ["Pony Americano", "PAM", 0, []], ["Pony of the Americas", "POA", 0, ["poa"]], ["Bosniaco", "BOS", 0, []], ["Huzul", "HUZ", 0, ["hucul"]], ["Konik", "KON", 0, []], ["Landais", "LAN", 0, []], ["Pottok", "POT", 0, []], ["Caspio", "CAS", 0, []], ["Berbero", "BER", 0, ["barb"]], ["Arabo-Berbero", "ABB", 0, ["arabo berbero"]], ["Turkmeno", "TUR", 0, []], ["Marwari", "MRW", 0, []], ["Kathiawari", "KAT", 0, []], ["Mongolo", "MNL", 0, []], ["Przewalski", "PRZ", 0, []], ["Yakuto", "YAK", 0, []], ["Don", "DON", 0, []], ["Budyonny", "BUD", 0, ["budenny"]], ["Kabardino", "KAB", 0, []], ["Karabakh", "KRB", 0, []], ["Lokai", "LOK", 0, []], ["Kustanai", "KUS", 0, []], ["Waler", "WAL", 0, []], ["Brumby", "BRU", 0, []], ["Australian Stock Horse", "ASH", 0, []], ["Kiger Mustang", "KIG", 0, []], ["Camargue", "CAM", 0, []], ["Merens", "MER", 0, ["merens"]], ["Henson", "HEN", 0, []], ["Auxois", "AUX", 0, []], ["Poitevin", "POI", 0, []], ["Sorraia", "SOR", 0, []], ["Garrano", "GAR", 0, []], ["Asturcón", "AST", 0, ["asturcon"]], ["Losino", "LOS", 0, []], ["Marismeño", "MRS", 0, ["marismeno"]], ["Meticcio / Incrocio", "MET", 0, ["meticcio", "incrocio", "mezzosangue"]], ["Sella (razza non indicata)", "SEL", 0, ["sella", "cavallo da sella"]], ["Pony (razza non indicata)", "PNY", 0, ["pony"]], ["Asino", "ASN", 0, ["asina", "somaro", "ciuco"]], ["Bardotto", "BDT", 0, ["bardotta"]], ["Mulo", "MUL", 0, ["mula"]]].map(([nome, sigla, italiana, alias]) => ({ nome, sigla, italiana: !!italiana, alias }));
// le più diffuse in Italia compaiono per prime a parità di somiglianza
const RAZZE_DIFFUSE = ["PSI","PSA","SIT","MAR","QTR","HAF","AVE","TIT","TFR","AAR","SFR","KWP","HAN","HOL","OLD","PRE","LUS","FRI","APP","PNT","SHE","WEL","MUR","BAR","MET","SEL","PNY"];
const RAZZE_FISSE = ["Meticcio / Incrocio", "Sella (razza non indicata)", "Pony (razza non indicata)"];
let razzeCaricate = false;
async function caricaRazzeEquo(){
  if(razzeCaricate || typeof DEMO_MODE === "undefined" || DEMO_MODE || typeof sb === "undefined") return;
  razzeCaricate = true;
  try{
    const { data } = await sb.from("equo_razze").select("nome, sigla, italiana, alias, ordine").order("ordine");
    if(data && data.length) RAZZE_EQUO = data.map(r => ({ nome: r.nome, sigla: r.sigla, italiana: r.italiana, alias: r.alias || [] }));
  }catch(e){ razzeCaricate = false; }
}
function razzaNorm(t){ return String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ł/g, "l").replace(/Ł/g, "L").toLowerCase().replace(/[^a-z0-9]/g, ""); }
function razzaTrova(testo){
  const n = razzaNorm(testo); if(!n) return null;
  return RAZZE_EQUO.find(r => razzaNorm(r.nome) === n || (r.alias || []).some(a => razzaNorm(a) === n)) || null;
}
function razzaCerca(testo){
  const n = razzaNorm(testo);
  if(!n) return RAZZE_EQUO.filter(r => r.italiana).slice(0, 8);
  const parole = String(testo).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").split(/[^a-z0-9]+/).filter(Boolean);
  const punteggio = r => {
    const nome = razzaNorm(r.nome), w = r.nome.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").split(/[^a-z0-9]+/);
    if(nome.startsWith(n)) return 0;
    if(parole.every(p => w.some(x => x.startsWith(p)))) return 1;
    if(nome.includes(n)) return 2;
    if((r.alias || []).some(a => razzaNorm(a).startsWith(n))) return 3;
    if((r.alias || []).some(a => razzaNorm(a).includes(n))) return 4;
    return 9;
  };
  return RAZZE_EQUO.map((r, i) => ({ r, p: punteggio(r), i })).filter(x => x.p < 9)
    .sort((a, b) => a.p - b.p || (RAZZE_DIFFUSE.indexOf(a.r.sigla) < 0) - (RAZZE_DIFFUSE.indexOf(b.r.sigla) < 0) || (b.r.italiana - a.r.italiana) || a.i - b.i).slice(0, 8).map(x => x.r);
}
// trasforma un <input> in campo razza con suggerimenti
function razzaCampo(id){
  const inp = document.getElementById(id);
  if(!inp || inp.dataset.razza) return;
  inp.dataset.razza = "1";
  inp.setAttribute("autocomplete", "off");
  const box = document.createElement("div"); box.className = "rz-wrap";
  inp.parentNode.insertBefore(box, inp); box.appendChild(inp);
  const lista = document.createElement("div"); lista.className = "rz-lista"; box.appendChild(lista);
  const nota = document.createElement("div"); nota.className = "rz-nota"; box.appendChild(nota);
  const mostra = () => {
    caricaRazzeEquo();
    const t = inp.value.trim();
    const trov = razzaCerca(t);
    const fisse = RAZZE_FISSE.filter(f => !trov.some(r => r.nome === f)).map(nome => ({ nome, fissa: true }));
    lista.innerHTML = trov.map(r => `<button type="button" data-v="${escapeHtml(r.nome)}"><span>${escapeHtml(r.nome)}</span><small>${escapeHtml(r.sigla)}</small></button>`).join("")
      + (trov.length ? "" : '<div class="rz-vuoto">Nessuna razza trovata con «' + escapeHtml(t) + '»</div>')
      + '<div class="rz-sep"></div>' + fisse.map(f => `<button type="button" class="rz-fissa" data-v="${escapeHtml(f.nome)}">${escapeHtml(f.nome)}</button>`).join("")
      + (t.length >= 3 && !trov.length ? `<button type="button" class="rz-altra" data-altra="${escapeHtml(t)}">La mia razza non c'è: «${escapeHtml(t)}»</button>` : "");
    lista.classList.add("aperta");
  };
  const scegli = (valore, altra) => {
    inp.value = valore; inp.dataset.ok = "1"; inp.dataset.altra = altra || "";
    lista.classList.remove("aperta"); box.classList.remove("rz-errore"); nota.textContent = altra ? "Razza fuori elenco: avvisiamo Equo per aggiungerla." : "";
    if(altra) razzaSegnala(altra);
  };
  inp.addEventListener("focus", mostra);
  inp.addEventListener("input", () => { inp.dataset.ok = ""; inp.dataset.altra = ""; nota.textContent = ""; mostra(); });
  lista.addEventListener("mousedown", e => e.preventDefault());
  lista.addEventListener("click", e => {
    const b = e.target.closest("button"); if(!b) return;
    if(b.dataset.altra) scegli("Altra razza (" + b.dataset.altra + ")", b.dataset.altra);
    else scegli(b.dataset.v);
  });
  inp.addEventListener("blur", () => setTimeout(() => {
    lista.classList.remove("aperta");
    // scritta per intero e uguale a una razza (o a un nome alternativo): la sistemo io
    if(!inp.dataset.ok && inp.value.trim()){ const r = razzaTrova(inp.value); if(r) scegli(r.nome); }
  }, 120));
}
// imposta il valore all'apertura della scheda (le razze già scritte in passato vengono ricondotte all'elenco se possibile)
function razzaImposta(id, valore){
  razzaCampo(id);
  const inp = document.getElementById(id);
  const r = razzaTrova(valore);
  inp.value = r ? r.nome : (valore || "");
  inp.dataset.ok = r || !valore ? "1" : "";
  inp.dataset.iniziale = inp.value; inp.dataset.altra = "";
  inp.parentNode.classList.remove("rz-errore");
  inp.parentNode.querySelector(".rz-nota").textContent = "";
}
// al salvataggio: null = vuota, stringa = razza valida, false = da scegliere dall'elenco (mostra l'errore)
function razzaValore(id){
  const inp = document.getElementById(id);
  const t = inp.value.trim();
  if(!t) return null;
  if(inp.dataset.ok === "1" || t === inp.dataset.iniziale) return t;
  const r = razzaTrova(t); if(r){ inp.value = r.nome; return r.nome; }
  inp.parentNode.classList.add("rz-errore");
  inp.parentNode.querySelector(".rz-nota").textContent = "Scegli la razza dall'elenco (oppure «La mia razza non c'è»).";
  inp.focus();
  return false;
}
const razzeSegnalate = new Set();
async function razzaSegnala(testo){
  const k = razzaNorm(testo);
  if(razzeSegnalate.has(k) || typeof DEMO_MODE === "undefined" || DEMO_MODE || !currentUser) return;
  razzeSegnalate.add(k);
  try{
    await sb.from("ticket_assistenza").insert({ user_id: currentUser.id, app: "scuderia", categoria: "suggerimento",
      oggetto: "Nuova razza da aggiungere: " + testo.slice(0, 80),
      descrizione: "Un utente ha inserito una razza che non è nell'elenco Equo: «" + testo + "». Se è una razza vera, aggiungila alla tabella equo_razze con la sua sigla di 3 lettere: i cavalli con quella razza prenderanno la sigla al prossimo salvataggio.",
      email: currentUser.email || "gestione.equo@gmail.com" });
  }catch(e){ console.warn("razzaSegnala:", e); }
}


async function saveCavallo(){
  const nome = document.getElementById("cav-nome").value.trim();
  const errBox = document.getElementById("cavallo-error");
  errBox.style.display = "none";
  if(!nome){ errBox.textContent = "Inserisci il nome del cavallo."; errBox.style.display = "block"; return; }
  if(razzaValore("cav-razza") === false) return;

  const payload = {
    nome,
    tipo_proprieta: document.getElementById("cav-tipo-proprieta").value,
    razza: document.getElementById("cav-razza").value.trim() || null,
    mantello: document.getElementById("cav-mantello").value.trim() || null,
    data_nascita: document.getElementById("cav-nascita").value || null,
    microchip: document.getElementById("cav-microchip").value.trim() || null,
    gruppo_sanguigno: document.getElementById("cav-gruppo-sanguigno").value.trim() || null,
    proprietario: document.getElementById("cav-proprietario").value.trim() || null,
    note: document.getElementById("cav-note").value.trim() || null,
  };
  // 26/10/2026: sesso e attività (schema 13); si mandano solo se scelti o se c'erano già
  const vecchio = editingCavalloId ? cavalliList.find(x => x.id === editingCavalloId) : null;
  const sesso = document.getElementById("cav-sesso").value || null, attivita = document.getElementById("cav-attivita").value.trim().slice(0, 60) || null;
  if(sesso || vecchio?.sesso) payload.sesso = sesso;
  if(attivita || vecchio?.attivita) payload.attivita = attivita;
  const fotoFile = document.getElementById("cav-foto-file").files[0] || null;
  const codiceProprietario = document.getElementById("cav-codice-proprietario").value.trim().toUpperCase();
  const saveBtn = document.getElementById("cavallo-save-btn");

  try{
    saveBtn.disabled = true;
    let savedCavalloId = editingCavalloId;
    if(DEMO_MODE){
      if(fotoFile){
        payload.foto_url = await new Promise(res => {
          const reader = new FileReader();
          reader.onload = () => res(reader.result);
          reader.readAsDataURL(fotoFile);
        });
      }
      if(editingCavalloId){
        const idx = demoState.cavalli.findIndex(c => c.id === editingCavalloId);
        if(idx >= 0) demoState.cavalli[idx] = { ...demoState.cavalli[idx], ...payload, updated_at: new Date().toISOString() };
      } else {
        savedCavalloId = "c" + (demoIdCounter++ + 100);
        demoState.cavalli.push({ id: savedCavalloId, centro_id: demoState.centro.id, ...payload, updated_at: new Date().toISOString() });
      }
    } else if(editingCavalloId){
      if(fotoFile) payload.foto_url = await uploadCavalloFoto(fotoFile, editingCavalloId);
      const { error } = await sb.from("scuderia_cavalli").update(payload).eq("id", editingCavalloId);
      if(error) throw error;
    } else {
      const { data, error } = await sb.from("scuderia_cavalli").insert({ centro_id: currentCentro.id, ...payload }).select().single();
      if(error) throw error;
      savedCavalloId = data.id;
      if(fotoFile){
        const foto_url = await uploadCavalloFoto(fotoFile, data.id);
        await sb.from("scuderia_cavalli").update({ foto_url }).eq("id", data.id);
      }
    }
    await loadCavalli();
    if(currentCavalloId){ renderCavalloDetail(); } else { renderCavalliList(); }
    closeModal("modal-cavallo");
    showToast(editingCavalloId ? "Cavallo aggiornato." : "Cavallo aggiunto.");

    if(codiceProprietario){
      const esito = await collegaProprietarioDaCodice(codiceProprietario, savedCavalloId, payload.proprietario);
      if(esito.ok){
        const nomeProprietario = esito.nome || "il proprietario";
        await proponiImportCavalli(esito.membroId, nomeProprietario, () => apriConfirmChatCliente(nomeProprietario, esito.membroId));
      } else showToast(esito.error + " Il cavallo è stato comunque salvato.");
    } else if(payload.microchip && !DEMO_MODE){
      // Nessun codice inserito manualmente: se il microchip combacia con un
      // cavallo già presente su Equo App, il proprietario viene collegato in automatico.
      const { data, error } = await sb.rpc("sync_microchip_link", { p_microchip: payload.microchip });
      if(!error){
        await loadTeam();
        renderClientiChatList();
      }
    }
  } catch(err){
    errBox.textContent = err.message || "Errore nel salvataggio.";
    errBox.style.display = "block";
  } finally {
    saveBtn.disabled = false;
  }
}

// Collega (o riusa) il proprietario Equo App corrispondente al codice personale.
// cavalloId è facoltativo: se passato, il cavallo viene anche marcato come collegato a lui.
// Ritorna { ok:true, membroId, nome } oppure { ok:false, error }.
async function collegaProprietarioDaCodice(codice, cavalloId, nomeFallback){
  try{
    let membroId, nome;
    if(DEMO_MODE){
      if(codice !== "EQUO-OWN-DEMO") return { ok:false, error:"Codice non valido." };
      const esistente = teamList.find(m => m.user_id === "u3");
      if(esistente){ membroId = esistente.id; nome = esistente.nome_visualizzato; }
      else {
        membroId = "m" + (demoIdCounter++ + 500);
        nome = "Giulia Verdi";
        const nuovo = { id: membroId, user_id:"u3", ruolo:"proprietario", nome_visualizzato: nome, livello:"1", permessi:{} };
        demoState.membri.push(nuovo);
        teamList.push(nuovo);
      }
    } else {
      const { data, error } = await sb.rpc("link_proprietario_da_codice", {
        p_centro_id: currentCentro.id, p_codice: codice, p_nome_fallback: nomeFallback || null,
      });
      if(error || !data) return { ok:false, error: "Codice non valido." };
      const row = Array.isArray(data) ? data[0] : data;
      membroId = row.membro_id; nome = row.nome;
      if(cavalloId) await sb.from("scuderia_cavalli").update({ proprietario_membro_id: membroId, codice_app_proprietario: codice }).eq("id", cavalloId);
      await loadTeam();
    }
    renderClientiChatList();
    return { ok:true, membroId, nome };
  } catch(err){
    return { ok:false, error: err.message || "Codice non valido." };
  }
}


export { collegaProprietarioDaCodice, razzaImposta, razzaSegnala, saveCavallo };
