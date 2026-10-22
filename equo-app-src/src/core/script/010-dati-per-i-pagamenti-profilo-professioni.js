/* ---------- DATI PER I PAGAMENTI (profilo professionista) ---------- */
function openDatiPagamentoModal(){
  document.getElementById("dp-tipo").value = currentUser.datiPagamentoTipo || "persona_fisica";
  document.getElementById("dp-nome").value = currentUser.datiPagamentoNome || "";
  document.getElementById("dp-piva-cf").value = currentUser.datiPagamentoPivaCf || "";
  document.getElementById("dp-iban").value = currentUser.datiPagamentoIban || "";
  document.getElementById("dp-paypal").value = currentUser.datiPagamentoPaypal || "";
  document.getElementById("dp-error").style.display = "none";
  closeModal("modal-menu");
  openModal("modal-dati-pagamento");
}

async function saveDatiPagamento(){
  const errBox = document.getElementById("dp-error");
  errBox.style.display = "none";
  const tipo = document.getElementById("dp-tipo").value;
  const nome = document.getElementById("dp-nome").value.trim();
  const piva_cf = document.getElementById("dp-piva-cf").value.trim();
  const iban = document.getElementById("dp-iban").value.trim();
  const paypal = document.getElementById("dp-paypal").value.trim();
  if(!nome){
    errBox.textContent = "Inserisci almeno il nome o la ragione sociale.";
    errBox.style.display = "block";
    return;
  }
  const { error } = await DB.updateDatiPagamento({ tipo, nome, piva_cf, iban, paypal });
  if(error){
    errBox.textContent = "Errore: " + error.message;
    errBox.style.display = "block";
    return;
  }
  const cambiatiDatiFiscali = nome !== (currentUser.datiPagamentoNome || "") || piva_cf !== (currentUser.datiPagamentoPivaCf || "");
  Object.assign(currentUser, { datiPagamentoTipo: tipo, datiPagamentoNome: nome, datiPagamentoPivaCf: piva_cf, datiPagamentoIban: iban, datiPagamentoPaypal: paypal });
  if(cambiatiDatiFiscali && ["verificato", "in_verifica"].includes(currentUser.certificazioneStato)){
    currentUser.certificazioneStato = "in_verifica"; // il DB rimette in verifica il badge se cambiano P.IVA o nome
    renderBadgeProfilo();
  }
  renderCertifiedCard();
  closeModal("modal-dati-pagamento");
  showToast(piva_cf && !partitaIvaValida(piva_cf) && !/^[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]$/i.test(piva_cf)
    ? "Dati salvati. Controlla la P.IVA: non sembra valida."
    : "Dati di pagamento salvati!");
}

function copyDatiPagamentoField(inputId){
  const value = document.getElementById(inputId).value.trim();
  if(!value){ showToast("Campo vuoto."); return; }
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(value).then(() => showToast("Copiato negli appunti!"))
      .catch(() => showToast("Non sono riuscito a copiare, riprova."));
  } else {
    showToast("Copia manualmente: " + value);
  }
}

function buildDatiPagamentoText(){
  const nome = document.getElementById("dp-nome").value.trim();
  const iban = document.getElementById("dp-iban").value.trim();
  const paypal = document.getElementById("dp-paypal").value.trim();
  let text = "Ecco i miei dati per il pagamento:\n";
  if(nome) text += `Beneficiario: ${nome}\n`;
  if(iban) text += `IBAN: ${iban}\n`;
  if(paypal) text += `PayPal: ${paypal}\n`;
  return text.trim();
}

// Mantra Equo: "puoi farlo anche fuori da Equo, ma con Equo è tutto più facile".
// Chat Equo è l'opzione di default; WhatsApp/Email restano per chi non usa ancora l'app
// e portano con sé un invito a Equo.
const INVITO_EQUO_FIRMA = "\n\n— Inviato con Equo. Scrivimi e prenota i prossimi appuntamenti dall'app: https://app.equohub.com";

function shareDatiPagamento(){
  const text = buildDatiPagamentoText();
  if(text === "Ecco i miei dati per il pagamento:"){
    showToast("Compila almeno un metodo di pagamento prima di condividere.");
    return;
  }
  mostraSceltaCondivisione();
  openModal("modal-condividi-dati");
}

function mostraSceltaCondivisione(){
  document.getElementById("condividi-scelta").style.display = "block";
  document.getElementById("condividi-clienti").style.display = "none";
}

async function condividiDatiVia(canale){
  const text = buildDatiPagamentoText();
  if(canale === "whatsapp"){
    window.open("https://wa.me/?text=" + encodeURIComponent(text + INVITO_EQUO_FIRMA), "_blank");
    closeModal("modal-condividi-dati");
    return;
  }
  if(canale === "email"){
    window.location.href = "mailto:?subject=" + encodeURIComponent("Dati per il pagamento") + "&body=" + encodeURIComponent(text + INVITO_EQUO_FIRMA);
    closeModal("modal-condividi-dati");
    return;
  }
  // Chat Equo: scelta del cliente
  if(!clientiMascalcia || !clientiMascalcia.length) clientiMascalcia = await DB.listClientiMascalcia();
  const alf = (a, b) => (a.nome || "").localeCompare(b.nome || "", "it", { sensitivity: "base" });
  const collegati = clientiAttivi().filter(c => c.cliente_user_id).sort(alf);
  const nonCollegati = clientiAttivi().filter(c => !c.cliente_user_id).sort(alf);
  const box = document.getElementById("condividi-clienti-list");
  if(!clientiAttivi().length){
    box.innerHTML = '<div class="muted" style="font-size:13px;line-height:1.6">Non hai ancora clienti. Aggiungili dalla pagina Clienti e invitali su Equo con il loro codice.</div>';
  } else {
    box.innerHTML = collegati.map(c => `
      <div class="share-cli" onclick="inviaDatiPagamentoInChat('${c.id}')">
        <div class="horse-avatar" style="width:36px;height:36px"><i class="fa-solid ${isStruttura(c) ? "fa-building" : "fa-user"}" style="font-size:15px"></i></div>
        <div style="flex:1;min-width:0"><div style="font-weight:600;font-size:14px">${escapeHtml(c.nome)}</div><div class="muted" style="font-size:12px">su Equo</div></div>
        <span style="color:var(--accent);font-weight:800">›</span>
      </div>`).join("")
    + (nonCollegati.length ? `<div class="muted" style="font-size:12px;margin:12px 0 4px">Non ancora su Equo — usa WhatsApp o Email, oppure invitali con il loro codice dalla scheda cliente:</div>` : "")
    + nonCollegati.map(c => `
      <div class="share-cli off">
        <div class="horse-avatar" style="width:36px;height:36px"><i class="fa-solid ${isStruttura(c) ? "fa-building" : "fa-user"}" style="font-size:15px"></i></div>
        <div style="flex:1;min-width:0"><div style="font-weight:600;font-size:14px">${escapeHtml(c.nome)}</div><div class="muted" style="font-size:12px">non su Equo</div></div>
      </div>`).join("");
  }
  document.getElementById("condividi-scelta").style.display = "none";
  document.getElementById("condividi-clienti").style.display = "block";
}

async function inviaDatiPagamentoInChat(clienteId){
  const text = buildDatiPagamentoText();
  closeModal("modal-condividi-dati");
  closeModal("modal-dati-pagamento");
  await openChatThread(clienteId);
  // testo precompilato: il maniscalco lo rilegge e preme Invia
  document.getElementById("mchat-input").value = text.replace(/\n/g, " · ").replace("pagamento: · ", "pagamento: ");
}

