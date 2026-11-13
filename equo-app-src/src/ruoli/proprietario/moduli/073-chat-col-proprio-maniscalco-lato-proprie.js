// Equo App · proprietario · modulo (moduli ES, costruiti con Vite in ruoli/proprietario/costruito.js)
/* ---------- CHAT COL PROPRIO MANISCALCO (lato proprietario) ---------- */
/* -> stato-condiviso.js */ // { cliente_mascalcia_id, nome }

// Corpo di una bolla con allegato (foto o PDF), uguale in tutte le chat
function bollaAllegato(tipo, url, nome, testo){
  const extra = testo ? `<div class="mchat-bubble-text">${escapeHtml(testo)}</div>` : "";
  // 2/11/2026: documento privato (SQL 32): «equo-doc:<id>» si apre solo con un link temporaneo, se hai l'accesso
  const priv = /^equo-doc:[0-9a-zA-Z-]+$/.test(String(url || "")) ? String(url).slice(9) : null;
  if(priv) return `<button type="button" class="mchat-doc" onclick="apriDocumentoPrivato('${escapeHtml(priv)}')"><span class="mchat-doc-ico">${tipo === "foto" ? "FOTO" : tipo === "video" ? "VIDEO" : "PDF"}</span><span class="mchat-doc-nome">${escapeHtml(nome || "Documento")}</span><span class="mchat-doc-priv">Privato · tocca per aprire</span></button>${extra}`;
  if(tipo === "foto") return `<a href="${escapeHtml(urlSicuro(url))}" target="_blank" rel="noopener"><img class="mchat-foto" src="${escapeHtml(urlSicuro(url))}" alt="Foto" loading="lazy"></a>${extra}`;
  if(tipo === "video") return `<video class="mchat-foto" controls playsinline preload="metadata" src="${escapeHtml(url || "")}"></video>${extra}`;
  return `<a class="mchat-doc" href="${escapeHtml(urlSicuro(url))}" target="_blank" rel="noopener"><span class="mchat-doc-ico">PDF</span><span class="mchat-doc-nome">${escapeHtml(nome || "Documento.pdf")}</span></a>${extra}`;
}
// apre un documento privato con un link che vale pochi minuti (la finestra si apre subito, se no il telefono la blocca)
async function apriDocumentoPrivato(id){
  const w = window.open("", "_blank");
  const { url, error } = await DB.apriUrlDocumento(id);
  if(!url){
    if(w) w.close();
    showToast(error === "accesso" ? "Non hai accesso a questo documento: chi lo gestisce può avertelo tolto." : "Non riesco ad aprire il documento, riprova.");
    return;
  }
  if(w) w.location.href = url; else window.location.href = url;
}
function previewAllegato(tipo, nome){
  if(tipo === "foto") return "📷 Foto";
  if(tipo === "video") return "🎬 Video";
  if(tipo === "audio") return "🎙️ Nota vocale";
  if(tipo === "documento") return "📄 " + (nome || "Documento PDF");
  if(tipo === "cavallo") return "🐴 Scheda cavallo";   // 11/11/2026 (SQL 67): tra colleghi
  return "";
}
function previewMessaggioMascalcia(tipo, testo, fileNome){
  if(tipo === "foto") return "📷 Foto";
  if(tipo === "video") return "🎬 Video";
  if(tipo === "documento") return "📄 " + (fileNome || "Documento PDF");
  if(tipo === "audio") return "🎙️ Nota vocale";
  return testo || "";
}

async function loadFarrierChatSection(){
  const box = document.getElementById("farrier-chat-list");
  if(!box) return;
  const lista = await DB.listManiscalchiCollegati();
  if(!lista.length){
    box.innerHTML = `<div class="muted" style="font-size:13px;line-height:1.6;text-align:center;padding:6px 4px">
      Hai un codice dal tuo maniscalco o dal tuo veterinario?<br>Tocca "+ Collega" per scrivergli in chat e ricevere appuntamenti e PDF.</div>`;
    return;
  }
  // 11/11/2026 (SQL 63): la professione dice se è il maniscalco o il veterinario (senza SQL 63: maniscalco, come prima)
  box.innerHTML = lista.map(f => {
    const vet = f.professione === "veterinario", chi = vet ? "Il tuo veterinario" : f.professione === "istruttore" ? "Il tuo istruttore" : "Il tuo maniscalco";
    let preview = "Inizia la conversazione col " + (vet ? "tuo veterinario" : f.professione === "istruttore" ? "tuo istruttore" : "tuo maniscalco");
    if(f.ultimo_at) preview = (f.ultimo_mittente === "cliente" ? "Tu: " : "") + previewMessaggioMascalcia(f.ultimo_tipo, f.ultimo_testo, f.ultimo_file_nome);
    return `
    <div class="inbox-item ${f.non_letti > 0 ? "unread" : ""}" onclick="openFarrierChatThread(${jsArg(f.cliente_mascalcia_id)}, ${jsArg(f.nome_maniscalco || chi)}, ${f.certificato ? "true" : "false"})">
      <div class="horse-avatar"><i class="fa-solid ${vet ? "fa-stethoscope" : "fa-hammer"}" style="font-size:20px"></i></div>
      <div style="flex:1;min-width:0">
        <div class="inbox-name" style="font-size:14px">${escapeHtml(f.nome_maniscalco || chi)}${f.certificato ? " " + BADGE_CERTIFIED_HTML : ""}${f.nome_maniscalco && f.professione ? ` <span class="muted" style="font-weight:500;font-size:12px">· ${vet ? "veterinario" : f.professione === "istruttore" ? "istruttore" : "maniscalco"}</span>` : ""}</div>
        <div class="inbox-preview muted" style="font-size:12.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHtml(preview)}</div>
      </div>
      ${f.non_letti > 0 ? `<span class="inbox-unread-dot"></span>` : ""}
    </div>`;
  }).join("");
}

function openCollegaManiscalco(iscrizione){
  document.getElementById("collega-maniscalco-codice").value = "";
  document.getElementById("collega-maniscalco-error").style.display = "none";
  // 9/11/2026 (SQL 52): alla prima iscrizione la finestra spiega perché e si può saltare
  const isc = iscrizione === true;
  document.getElementById("collega-maniscalco-iscrizione").style.display = isc ? "" : "none";
  document.getElementById("collega-maniscalco-spiega").style.display = isc ? "none" : "";
  document.getElementById("collega-maniscalco-salta-box").style.display = isc ? "" : "none";
  openModal("modal-collega-maniscalco");
}
// subito dopo la scelta «Ho un cavallo»: se non è arrivato già con il link o il QR del maniscalco
function chiediCodiceIscrizione(){
  let invito = null;
  try{ invito = JSON.parse(lsGet("equo-invito") || "null"); }catch(e){}
  if(invito && invito.codice) return;      // c'è già il codice dal QR: il collegamento parte da solo
  openCollegaManiscalco(true);
}
function saltaCodiceIscrizione(){
  closeModal("modal-collega-maniscalco");
  showToast("Va bene! Se il tuo maniscalco o il tuo veterinario usano Equo, li colleghi quando vuoi dal menu.");
}

const ERRORI_CODICE_MANISCALCO = {
  codice_non_valido: "Codice non valido. Controlla di averlo scritto bene.",
  codice_gia_usato: "Questo codice è già stato usato da un altro account. Chiedi al tuo maniscalco di verificarlo.",
  codice_tuo: "Questo è un codice creato da te: va dato al tuo cliente.",
  non_autenticato: "Sessione scaduta: esci e rientra.",
  codice_altro_tipo: "Questo non è il codice di un maniscalco o di un veterinario: controlla di averlo copiato bene.",
  codice_scuderia: "Questo è l'invito per una scuderia: va usato in Equo Scuderia. Chiedi al maniscalco il suo codice personale (EQUOPRO…) o il QR della tua scheda cliente.",
};

async function collegaManiscalco(){
  const input = document.getElementById("collega-maniscalco-codice");
  const errBox = document.getElementById("collega-maniscalco-error");
  const btn = document.getElementById("collega-maniscalco-btn");
  errBox.style.display = "none";
  const codice = input.value.trim().toUpperCase();
  if(!codice) return;
  btn.disabled = true;
  const res = await DB.riscattaCodiceManiscalco(codice);
  btn.disabled = false;
  if(!res || !res.ok){
    if(res?.errore === "codice_altro_tipo" && res.tipo === "own"){ gestisciCodiceScansionato(codice); return; }   // codice di un proprietario: chat
    if(res?.errore === "codice_altro_tipo" && res.tipo === "tra" && typeof trCollOwner === "function"){ gestisciCodiceScansionato(codice); return; }
    errBox.textContent = (ERRORI_CODICE_MANISCALCO[res?.errore] || ("Errore, riprova." + (res?.messaggio ? " (" + res.messaggio + ")" : "")))
      + (DEMO_MODE && res?.errore === "codice_non_valido" ? " (in demo prova EQUO-DC1AB)" : "");
    errBox.style.display = "block";
    return;
  }
  closeModal("modal-collega-maniscalco");
  const proN = res.professione === "veterinario" ? "il tuo veterinario" : "il tuo maniscalco";
  showToast("Collegato a " + (res.nome_maniscalco || proN) + "!");
  await loadFarrierChatSection();
  const nomeMan = res.nome_maniscalco || (res.professione === "veterinario" ? "Il tuo veterinario" : "Il tuo maniscalco");
  await proponiAbbinamentoCavalli(res.cliente_mascalcia_id, nomeMan, () => openFarrierChatThread(res.cliente_mascalcia_id, nomeMan));
}


export { apriDocumentoPrivato, bollaAllegato, chiediCodiceIscrizione, collegaManiscalco, loadFarrierChatSection, openCollegaManiscalco, previewAllegato, previewMessaggioMascalcia, saltaCodiceIscrizione };
