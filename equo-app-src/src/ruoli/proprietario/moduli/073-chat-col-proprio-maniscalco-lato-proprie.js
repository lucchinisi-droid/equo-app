// Equo App · proprietario · modulo (moduli ES, costruiti con Vite in ruoli/proprietario/costruito.js)
/* ---------- CHAT COL PROPRIO MANISCALCO (lato proprietario) ---------- */
/* -> stato-condiviso.js */ // { cliente_mascalcia_id, nome }

// Corpo di una bolla con allegato (foto o PDF), uguale in tutte le chat
function bollaAllegato(tipo, url, nome, testo){
  const extra = testo ? `<div class="mchat-bubble-text">${escapeHtml(testo)}</div>` : "";
  if(tipo === "foto") return `<a href="${escapeHtml(urlSicuro(url))}" target="_blank" rel="noopener"><img class="mchat-foto" src="${escapeHtml(urlSicuro(url))}" alt="Foto" loading="lazy"></a>${extra}`;
  if(tipo === "video") return `<video class="mchat-foto" controls playsinline preload="metadata" src="${escapeHtml(url || "")}"></video>${extra}`;
  return `<a class="mchat-doc" href="${escapeHtml(urlSicuro(url))}" target="_blank" rel="noopener"><span class="mchat-doc-ico">PDF</span><span class="mchat-doc-nome">${escapeHtml(nome || "Documento.pdf")}</span></a>${extra}`;
}
function previewAllegato(tipo, nome){
  if(tipo === "foto") return "📷 Foto";
  if(tipo === "video") return "🎬 Video";
  if(tipo === "audio") return "🎙️ Nota vocale";
  if(tipo === "documento") return "📄 " + (nome || "Documento PDF");
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
      Hai un codice dal tuo maniscalco?<br>Tocca "+ Collega" per scrivergli in chat e ricevere appuntamenti e PDF.</div>`;
    return;
  }
  box.innerHTML = lista.map(f => {
    let preview = "Inizia la conversazione col tuo maniscalco";
    if(f.ultimo_at) preview = (f.ultimo_mittente === "cliente" ? "Tu: " : "") + previewMessaggioMascalcia(f.ultimo_tipo, f.ultimo_testo, f.ultimo_file_nome);
    return `
    <div class="inbox-item ${f.non_letti > 0 ? "unread" : ""}" onclick="openFarrierChatThread(${jsArg(f.cliente_mascalcia_id)}, ${jsArg(f.nome_maniscalco || "Il tuo maniscalco")}, ${f.certificato ? "true" : "false"})">
      <div class="horse-avatar"><i class="fa-solid fa-hammer" style="font-size:20px"></i></div>
      <div style="flex:1;min-width:0">
        <div class="inbox-name" style="font-size:14px">${escapeHtml(f.nome_maniscalco || "Il tuo maniscalco")}${f.certificato ? " " + BADGE_CERTIFIED_HTML : ""}</div>
        <div class="inbox-preview muted" style="font-size:12.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHtml(preview)}</div>
      </div>
      ${f.non_letti > 0 ? `<span class="inbox-unread-dot"></span>` : ""}
    </div>`;
  }).join("");
}

function openCollegaManiscalco(){
  document.getElementById("collega-maniscalco-codice").value = "";
  document.getElementById("collega-maniscalco-error").style.display = "none";
  openModal("modal-collega-maniscalco");
}

const ERRORI_CODICE_MANISCALCO = {
  codice_non_valido: "Codice non valido. Controlla di averlo scritto bene.",
  codice_gia_usato: "Questo codice è già stato usato da un altro account. Chiedi al tuo maniscalco di verificarlo.",
  codice_tuo: "Questo è un codice creato da te: va dato al tuo cliente.",
  non_autenticato: "Sessione scaduta: esci e rientra.",
  codice_altro_tipo: "Questo non è il codice di un maniscalco: controlla di averlo copiato bene.",
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
  showToast("Collegato a " + (res.nome_maniscalco || "il tuo maniscalco") + "!");
  await loadFarrierChatSection();
  const nomeMan = res.nome_maniscalco || "Il tuo maniscalco";
  await proponiAbbinamentoCavalli(res.cliente_mascalcia_id, nomeMan, () => openFarrierChatThread(res.cliente_mascalcia_id, nomeMan));
}


export { bollaAllegato, collegaManiscalco, loadFarrierChatSection, openCollegaManiscalco, previewAllegato, previewMessaggioMascalcia };
