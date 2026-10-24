// Equo App · maniscalco · modulo (moduli ES, costruiti con Vite in ruoli/maniscalco/costruito.js)
/* ---------- MODAL APPUNTAMENTO MANISCALCO (nuovo + modifica) ---------- */
// Tabella misure ferri: stessa riga = stessa misura nei 3 sistemi (IT 1-9)
const MISURE_FERRO = {
  italiana: ["1","2","3","4","5","6","7","8","9"],
  olandese: ["4/0","3/0","2/0","0","1","2","3","4","5"],
  tedesca:  ["2/0","0","1","2","3","4","5","6","7"]
};
/* -> stato-condiviso.js */ // riga IT 4 = NL 0 = DE 2
const MISURA_SISTEMA_LABEL = { italiana: "IT", olandese: "NL", tedesca: "DE" };
/* -> stato-condiviso.js */
let misuraScrollTimer = null;
/* -> stato-condiviso.js */
/* -> stato-condiviso.js */ // oggetto intervento se stiamo modificando
/* -> stato-condiviso.js */      // valori precompilati per un nuovo appuntamento (es. da scadenza)

function isoLocale(d){
  const p = n => String(n).padStart(2, "0");
  return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate());
}
function aggiungiGiorniIso(iso, giorni){
  const [y, m, d] = iso.split("-").map(Number);
  return isoLocale(new Date(y, m - 1, d + giorni));
}

// rotella della misura: p = "intervento" (cambio solo per un appuntamento) o "ferro" (ferro standard nella scheda del cavallo)
/* -> stato-condiviso.js */
function misuraIdx(p){ return p === "ferro" ? misuraIndiceFerro : misuraIndiceCorrente; }
function renderMisuraWheel(p = "intervento"){
  const sistema = document.getElementById(p + "-misura-sistema").value;
  const wheel = document.getElementById(p + "-misura-wheel");
  const cur = misuraIdx(p);
  wheel.innerHTML = MISURE_FERRO[sistema].map((v, i) =>
    `<div class="misura-wheel-item${i === cur ? " sel" : ""}" data-i="${i}" onclick="selezionaMisura(${i}, true, '${p}')">${v}</div>`).join("");
  requestAnimationFrame(() => { wheel.scrollTop = cur * 44; });
  aggiornaEquivalenzeMisura(p);
  wheel.onscroll = () => {
    clearTimeout(misuraScrollTimer);
    misuraScrollTimer = setTimeout(() => {
      const i = Math.max(0, Math.min(8, Math.round(wheel.scrollTop / 44)));
      selezionaMisura(i, false, p);
    }, 80);
  };
}
function selezionaMisura(i, scroll, p = "intervento"){
  if(p === "ferro") misuraIndiceFerro = i; else misuraIndiceCorrente = i;
  const wheel = document.getElementById(p + "-misura-wheel");
  wheel.querySelectorAll(".misura-wheel-item").forEach(el => el.classList.toggle("sel", Number(el.dataset.i) === i));
  if(scroll) wheel.scrollTo({ top: i * 44, behavior: "smooth" });
  aggiornaEquivalenzeMisura(p);
}
function aggiornaEquivalenzeMisura(p = "intervento"){
  const sistema = document.getElementById(p + "-misura-sistema").value;
  const altri = Object.keys(MISURE_FERRO).filter(k => k !== sistema)
    .map(k => MISURA_SISTEMA_LABEL[k] + " " + MISURE_FERRO[k][misuraIdx(p)]);
  document.getElementById(p + "-misura-equivalenze").textContent = "Equivale a: " + altri.join(" · ");
}
function onMisuraSistemaChange(p = "intervento"){ renderMisuraWheel(p); } // mantiene la misura equivalente

// «L'ho già fatto»: solo per un appuntamento NUOVO con la data di oggi (passato = fatto, futuro = da fare)
function aggiornaGiaFatto(){
  const riga = document.getElementById("intervento-gia-fatto-row");
  if(!riga) return;
  const d = document.getElementById("intervento-data").value;
  const vedi = !interventoInModifica && d === isoLocale(new Date());
  riga.style.display = vedi ? "flex" : "none";
  if(!vedi) document.getElementById("intervento-gia-fatto").checked = false;
}


// misura che il maniscalco usa di solito (profiles.ferro_sistema_predefinito): i cavalli senza misura partono da questa
function misuraPredefinita(ripiego = "italiana"){ return (currentUser && MISURE_FERRO[currentUser.ferroSistema]) ? currentUser.ferroSistema : ripiego; }

export { MISURA_SISTEMA_LABEL, MISURE_FERRO, misuraPredefinita, aggiornaGiaFatto, aggiungiGiorniIso, isoLocale, onMisuraSistemaChange, renderMisuraWheel, selezionaMisura };
