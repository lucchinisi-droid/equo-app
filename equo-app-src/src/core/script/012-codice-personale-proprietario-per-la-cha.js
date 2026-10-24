/* ---------- CODICE PERSONALE PROPRIETARIO (per la chat) ---------- */
async function openCodiceProprietarioModal(){
  const codice = await DB.ensureCodiceProprietario();
  document.getElementById("codice-proprietario-testo").textContent = codice;
  const qrBox = document.getElementById("codice-proprietario-qr");
  qrBox.innerHTML = "";
  if(window.QRCode){ new QRCode(qrBox, { text: linkCodiceEquo(codice), width: 160, height: 160 }); }   // il QR apre Equo e collega
  closeModal("modal-menu");
  openModal("modal-codice-proprietario");
}

function copyCodiceProprietario(){
  const codice = currentUser.codiceProprietario;
  if(!codice) return;
  const text = codice + "\nhttps://app.equohub.com";
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(text).then(() => showToast("Codice copiato negli appunti!"))
      .catch(() => showToast("Non sono riuscito a copiare, riprova."));
  } else {
    showToast("Codice: " + codice);
  }
}

function shareCodiceProprietario(){
  const codice = currentUser.codiceProprietario;
  if(!codice) return;
  const text = codice + "\nhttps://app.equohub.com";
  if(navigator.share){
    navigator.share({ text }).catch(() => {});
    return;
  }
  window.open("https://wa.me/?text=" + encodeURIComponent(text), "_blank");
}

