// Equo App · proprietario · modulo (moduli ES, costruiti con Vite in ruoli/proprietario/costruito.js)
/* ---------- PAGAMENTI DA SALDARE AL MANISCALCO (proprietario) ----------
   Riquadro discreto in Home: aperto (con pallino anche su Chat) la prima volta e poi ogni 5 giorni,
   altrimenti una riga sola. «Ho già pagato» avvisa il maniscalco in chat e ferma il promemoria. */
/* -> stato-condiviso.js */
async function caricaDaSaldare(){
  const box = document.getElementById("home-da-saldare");
  if(!box) return;
  if(DEMO_MODE || !currentUser){ box.style.display = "none"; return; }
  try{
    const { data, error } = await sb.rpc("prop_pagamenti_da_saldare");
    if(error) throw error;
    daSaldareStato.righe = data?.righe || [];
    daSaldareStato.daRicordare = !!data?.da_ricordare;
  }catch(e){ daSaldareStato.righe = []; daSaldareStato.daRicordare = false; }
  renderDaSaldare();
  const badge = document.getElementById("owner-chat-nav-badge");
  if(badge && daSaldareStato.daRicordare) badge.style.display = "block";
}
function euroIt(v){ return "€ " + Number(v || 0).toFixed(2).replace(".", ","); }
// 27/10/2026: acconti e rate registrati dal maniscalco (pagato, piano: rate, pagate, prossima)
const dsResto = r => Math.max(0, Number(r.importo || 0) - Number(r.pagato || 0));
function dsOggi(){ const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
function dsPianoHtml(p, titolo){
  if(!p || !p.rate) return "";
  const scad = p.prossima_scadenza && p.prossima_scadenza < dsOggi();
  return `<div class="ds-piano">${titolo ? `<small>${escapeHtml(titolo)}</small>` : ""}<b>${p.pagate ? `Pagato ${p.pagate} ${p.pagate === 1 ? "rata" : "rate"} su ${p.rate}` : `${p.rate} rate, nessuna ancora pagata`}</b>
    <div class="ds-segm" aria-hidden="true">${Array.from({ length: p.rate }, (_, k) => `<i class="${k < p.pagate ? "p" : ""}"></i>`).join("")}</div>
    ${p.prossima_importo != null ? `<small class="${scad ? "scad" : ""}">${scad ? "Rata scaduta" : "Prossima rata"}: ${euroIt(p.prossima_importo)} entro il ${formatDataBreve(p.prossima_scadenza)}</small>` : ""}</div>`;
}
function renderDaSaldare(){
  const box = document.getElementById("home-da-saldare");
  const righe = daSaldareStato.righe;
  if(!righe.length){ box.style.display = "none"; box.innerHTML = ""; return; }
  box.style.display = "block";
  const tot = righe.filter(r => !r.segnalato).reduce((t, r) => t + dsResto(r), 0);
  const contiVisti = new Set();
  const aperto = daSaldareStato.daRicordare || daSaldareStato.aperto;
  if(!aperto){
    box.innerHTML = `<button type="button" class="ds-riga-corta" onclick="daSaldareStato.aperto=true;renderDaSaldare()"><span>💶 Da saldare${tot ? " · " + euroIt(tot) : ""}</span><span class="muted">Vedi ›</span></button>`;
    return;
  }
  const perMan = {};
  righe.forEach(r => { (perMan[r.maniscalco_id] = perMan[r.maniscalco_id] || { nome: r.maniscalco, iban: r.iban, paypal: r.paypal, pag_nome: r.pag_nome, righe: [] }).righe.push(r); });
  box.innerHTML = `<div class="card ds-card">
    <div class="ds-testa"><span>${daSaldareStato.daRicordare ? '<i class="ds-dot"></i>' : ""}💶 Da saldare</span><b>${euroIt(tot)}</b></div>
    ${Object.entries(perMan).map(([mid, m]) => `
      <div class="ds-man">${escapeHtml(m.nome || "Il tuo maniscalco")}</div>
      ${m.righe.map(r => `${r.piano_di === "conto" && r.conto && !contiVisti.has(r.conto) && contiVisti.add(r.conto) ? dsPianoHtml(r.piano, "Conto " + r.conto) : ""}<div class="ds-voce">
        <div><div>${escapeHtml([r.tipo, r.cavallo].filter(Boolean).join(" · "))}</div><small class="muted">${formatDataBreve(r.data)}${r.segnalato ? " · segnalato come pagato, in attesa del maniscalco" : ""}</small>${Number(r.pagato) > 0 ? `<small class="ds-acc">Pagati ${euroIt(r.pagato)} di ${euroIt(r.importo)}</small>` : ""}</div>
        <div class="ds-dx"><b>${euroIt(dsResto(r))}</b>${r.segnalato ? "" : `<button type="button" onclick="segnalaGiaPagato('${r.id}', this)">Ho già pagato</button>`}</div>
      </div>${r.piano_di === "lavoro" ? dsPianoHtml(r.piano) : ""}`).join("")}
      ${m.iban || m.paypal ? `<button type="button" class="ds-link" onclick="daSaldareStato.pagaAperto = daSaldareStato.pagaAperto === '${mid}' ? null : '${mid}'; renderDaSaldare()">Come pagare ${daSaldareStato.pagaAperto === mid ? "▴" : "▾"}</button>
        ${daSaldareStato.pagaAperto === mid ? `<div class="ds-paga">${m.pag_nome ? `<div><small class="muted">Intestatario</small><br>${escapeHtml(m.pag_nome)}</div>` : ""}${m.iban ? `<div><small class="muted">IBAN</small><br><span class="ds-copia" onclick="copiaTestoDs('${escapeHtml(m.iban)}')">${escapeHtml(m.iban)} <i class="fa-regular fa-copy"></i></span></div>` : ""}${m.paypal ? `<div><small class="muted">PayPal</small><br><span class="ds-copia" onclick="copiaTestoDs('${escapeHtml(m.paypal)}')">${escapeHtml(m.paypal)} <i class="fa-regular fa-copy"></i></span></div>` : ""}</div>` : ""}` : ""}
    `).join("")}
    ${daSaldareStato.daRicordare ? `<button type="button" class="ds-ok" onclick="daSaldareVisto()">Ok, ricordamelo tra 5 giorni</button>` : `<button type="button" class="ds-ok" onclick="daSaldareStato.aperto=false;renderDaSaldare()">Chiudi</button>`}
  </div>`;
}
function copiaTestoDs(t){
  if(navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(() => showToast("Copiato")).catch(() => showToast(t));
  else showToast(t);
}
async function daSaldareVisto(){
  daSaldareStato.daRicordare = false; daSaldareStato.aperto = false;
  renderDaSaldare();
  try{ await sb.rpc("prop_pagamenti_visti"); }catch(e){}
  refreshChatBadge();
}
async function segnalaGiaPagato(id, btn){
  if(!confirm("Confermi di aver già pagato? Il maniscalco riceve un messaggio in chat e il promemoria si ferma.")) return;
  if(btn) btn.disabled = true;
  try{
    const { data, error } = await sb.rpc("prop_segnala_pagato", { p_intervento: id });
    if(error || !data?.ok) throw error || new Error("non riuscito");
    showToast("Fatto: il maniscalco riceve il tuo messaggio in chat");
    await caricaDaSaldare();
  }catch(e){ showToast("Non riuscito, riprova."); if(btn) btn.disabled = false; }
}


export { caricaDaSaldare, copiaTestoDs, daSaldareVisto, renderDaSaldare, segnalaGiaPagato };
