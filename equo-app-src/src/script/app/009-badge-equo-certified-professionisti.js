/* ---------- BADGE EQUO CERTIFIED (professionisti) ----------
   Requisiti: P.IVA italiana valida (11 cifre + cifra di controllo), nome/ragione sociale, foto profilo.
   Il professionista richiede il badge → stato "in_verifica" → Simone verifica sul servizio gratuito
   dell'Agenzia delle Entrate (email automatica a gestione.equo@gmail.com) → "verificato" / "respinto".
   Lo stato "verificato" lo può impostare solo l'admin (trigger lato DB). */
const BADGE_CERTIFIED_HTML = '<span class="badge-certified">✓ Equo Certified</span>';

function partitaIvaValida(v){
  const n = String(v || "").toUpperCase().replace(/\s+/g, "").replace(/^IT/, "");
  if(!/^\d{11}$/.test(n) || /^0+$/.test(n)) return false;
  let somma = 0;
  for(let i = 0; i < 10; i++){
    let c = Number(n[i]);
    if(i % 2 === 1){ c *= 2; if(c > 9) c -= 9; }
    somma += c;
  }
  return (10 - (somma % 10)) % 10 === Number(n[10]);
}

function requisitiCertified(){
  return {
    piva: partitaIvaValida(currentUser?.datiPagamentoPivaCf),
    nome: !!(currentUser?.datiPagamentoNome || "").trim(),
    foto: !!currentUser?.avatarUrl,
  };
}

function renderBadgeProfilo(){
  const el = document.getElementById("profile-name");
  if(!el || !currentUser) return;
  const nome = currentUser.fullName || el.textContent || "Il tuo profilo";
  el.innerHTML = escapeHtml(nome) + (currentUser.certificazioneStato === "verificato" ? " " + BADGE_CERTIFIED_HTML : "");
}

function renderCertifiedCard(){
  const box = document.getElementById("certified-card");
  if(!box || !currentUser) return;
  const stato = currentUser.certificazioneStato || "nessuno";
  if(stato === "verificato"){
    box.style.display = "block";
    box.innerHTML = `<div style="display:flex;align-items:center;gap:10px">${BADGE_CERTIFIED_HTML}<div class="muted" style="font-size:12.5px;line-height:1.5">I tuoi clienti vedono il badge accanto al tuo nome, in chat e sui PDF.</div></div>`;
    return;
  }
  if(stato === "in_verifica"){
    box.style.display = "block";
    box.innerHTML = `<div style="font-weight:800;font-size:14px">⏳ Badge Equo Certified in verifica</div>
      <div class="muted" style="font-size:12.5px;line-height:1.5;margin-top:4px">Controlliamo la tua P.IVA sull'anagrafe dell'Agenzia delle Entrate. Ti avvisiamo appena è approvato, di solito entro 48 ore.</div>`;
    return;
  }
  const r = requisitiCertified();
  const riga = (ok, testo, azione) => `
    <div class="cert-check" onclick="${azione}">
      <span class="cert-dot ${ok ? "ok" : ""}">${ok ? "✓" : ""}</span>
      <span style="flex:1">${testo}</span>
      ${ok ? "" : '<span style="color:var(--accent);font-weight:800">›</span>'}
    </div>`;
  const tutti = r.piva && r.nome && r.foto;
  box.style.display = "block";
  box.innerHTML = `
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">${BADGE_CERTIFIED_HTML}<div style="font-weight:800;font-size:14px">Diventa Equo Certified</div></div>
    ${stato === "respinto" ? `<div style="font-size:12.5px;line-height:1.5;margin:6px 0;color:var(--red, #c0392b)">Richiesta non approvata${currentUser.certificazioneMotivo ? ": " + escapeHtml(currentUser.certificazioneMotivo) : ""}. Correggi i dati e richiedi di nuovo.</div>` : ""}
    <div class="muted" style="font-size:12.5px;line-height:1.5;margin-bottom:6px">Il badge che i tuoi clienti vedono accanto al tuo nome: più fiducia, più richieste. Presto sarai anche nella ricerca professionisti di Equo.</div>
    ${riga(r.piva, "Partita IVA valida", "openDatiPagamentoModal()")}
    ${riga(r.nome, "Nome o ragione sociale", "openDatiPagamentoModal()")}
    ${riga(r.foto, "Foto profilo", "document.getElementById('avatar-file-input').click()")}
    <button class="btn btn-primary" style="width:100%;margin-top:10px" ${tutti ? "" : "disabled"} onclick="richiediCertified()">${tutti ? "Richiedi il badge" : "Completa i 3 passaggi per richiederlo"}</button>`;
}

async function richiediCertified(){
  const r = requisitiCertified();
  if(!(r.piva && r.nome && r.foto)){ showToast("Completa prima i 3 passaggi."); return; }
  const { error } = await DB.richiediCertificazione();
  if(error){ showToast("Richiesta non inviata: " + (error.message || "riprova")); return; }
  currentUser.certificazioneStato = "in_verifica";
  currentUser.certificazioneMotivo = null;
  renderCertifiedCard();
  showToast("Richiesta inviata! Ti avvisiamo appena il badge è approvato.");
}

function showProActionComingSoon(){
  showToast("Disponibile a breve, insieme all'agenda interventi.");
}

function copyInviteLink(){
  const text = "Ciao! Uso Equo per gestire interventi e appuntamenti — scarica l'app su https://app.equohub.com e collegati al mio profilo.";
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(text).then(() => showToast("Link copiato negli appunti!"))
      .catch(() => showToast("Non sono riuscito a copiare, riprova."));
  } else {
    showToast("Copia manualmente: " + text);
  }
}

let timerPartnerBanner = null, timerPromo = null;
function startPartnerBannerRotation(){
  clearInterval(timerPartnerBanner);
  let i = 0;
  const slides = document.querySelectorAll(".partner-slide");
  slides.forEach((sl, k) => sl.classList.toggle("active", k === 0));
  if(slides.length < 2) return;
  timerPartnerBanner = setInterval(() => {
    slides[i].classList.remove("active");
    i = (i + 1) % slides.length;
    slides[i].classList.add("active");
  }, 30000);
}

async function submitSegnalazioneManeggio(){
  const nome_struttura = document.getElementById("segnala-nome-struttura").value.trim();
  const citta = document.getElementById("segnala-citta").value.trim();
  const via = document.getElementById("segnala-via").value.trim();
  const telefono_struttura = document.getElementById("segnala-telefono-struttura").value.trim();
  const contatto_premio = document.getElementById("segnala-contatto-premio").value.trim();
  if(!nome_struttura || !citta || !contatto_premio){
    showToast("Compila almeno nome del centro ippico, città e il tuo contatto.");
    return;
  }
  const payload = {
    nome_struttura, citta,
    via: via || null,
    telefono_struttura: telefono_struttura || null,
    contatto_premio,
    segnalato_da: currentUser ? currentUser.id : null,
  };
  const { error } = await DB.insertSegnalazioneManeggio(payload);
  if(error){ showToast("Errore, riprova tra poco."); return; }
  document.getElementById("segnala-nome-struttura").value = "";
  document.getElementById("segnala-citta").value = "";
  document.getElementById("segnala-via").value = "";
  document.getElementById("segnala-telefono-struttura").value = "";
  document.getElementById("segnala-contatto-premio").value = "";
  closeModal("modal-segnala-maneggio");
  showToast("Grazie! Ti contatteremo con il codice Premium.");
}

function showStableManagerBanner(){
  showToast("Per gestire il tuo centro ippico usa Equo Scuderia su scuderia.equohub.com");
}

