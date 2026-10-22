// Equo App · agenti · modulo (moduli ES, costruiti con Vite in ruoli/agenti/costruito.js)
import { sendChatMessage } from "./082-analizza-una-foto-focus.js";
/* ---------- EQUO AI — allegati (Step 2): foto ridotte a max 1600px JPEG, PDF fino a 4 MB ---------- */
/* -> stato-condiviso.js */ // { media_type, data (base64), anteprima (dataURL o null), nome }
function leggiFileComeDataUrl(file){
  return new Promise((ok, ko) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = ko; r.readAsDataURL(file); });
}
async function riduciImmagine(file){
  const url = await leggiFileComeDataUrl(file);
  const img = await new Promise((ok, ko) => { const i = new Image(); i.onload = () => ok(i); i.onerror = ko; i.src = url; });
  const lato = 1600, k = Math.min(1, lato / Math.max(img.width, img.height));
  const c = document.createElement("canvas");
  c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
  c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
  return c.toDataURL("image/jpeg", 0.82);
}
async function aggiungiAllegatiAi(event){
  const files = Array.from(event.target.files || []);
  event.target.value = "";
  for(const f of files){
    if(aiAllegati.length >= 3){ showToast("Massimo 3 allegati per messaggio."); break; }
    try{
      if(f.type === "application/pdf"){
        if(f.size > 4 * 1024 * 1024){ showToast("PDF troppo grande (max 4 MB): prova con una foto."); continue; }
        const url = await leggiFileComeDataUrl(f);
        aiAllegati.push({ media_type: "application/pdf", data: url.split(",")[1], anteprima: null, nome: f.name });
      } else if((f.type || "").startsWith("image/")){
        const url = await riduciImmagine(f);
        aiAllegati.push({ media_type: "image/jpeg", data: url.split(",")[1], anteprima: url, nome: f.name });
      } else {
        showToast("Puoi allegare foto o PDF.");
      }
    } catch(err){
      console.error("allegato AI:", err);
      showToast("Non riesco a leggere il file, riprova.");
    }
  }
  renderAllegatiAi();
}
function renderAllegatiAi(){
  const box = document.getElementById("ai-allegati");
  if(!box) return;
  box.classList.toggle("attivi", aiAllegati.length > 0);
  box.innerHTML = aiAllegati.map((a, i) => `<div class="ai-allegato">${a.anteprima ? `<img src="${a.anteprima}" alt="">` : "PDF"}<button onclick="rimuoviAllegatoAi(${i})" aria-label="Rimuovi">×</button></div>`).join("");
}
function rimuoviAllegatoAi(i){ aiAllegati.splice(i, 1); renderAllegatiAi(); }

/* ==================== PANNELLO DI HAMMER (ottobre 2026) ====================
   Si apre dal tasto centrale. Sa cosa stai guardando (scheda del cavallo o del cliente) e lo manda a Hammer come contesto.
   Avvii rapidi: Chiedi · Analizza una foto (modalità Focus, nel Free vale 3 messaggi) · Consulta un caso (domande con le
   risposte pronte da toccare) · Riassumi lo storico. L'esito della foto si può scaricare in PDF (resta sul telefono),
   condividere nel libretto del cavallo (allegato) o eliminare. */
/* -> stato-condiviso.js */
function hpCalcolaContesto(){
  if(!agenteAiHammer() || !document.getElementById("page-pro-clienti")?.classList.contains("active")) return null;
  const vp = document.getElementById("cavallo-pro-view");
  if(vp && vp.style.display === "block"){
    const cv = (schedaCavalli || []).find(c => c.key === schedaCavalloKey);
    if(cv){
      const cli = (clientiMascalcia || []).find(c => c.id === currentClienteId);
      const st = statoCavalloPro(cv, schedaStoricoCavallo || []);
      const righe = (schedaStoricoCavallo || []).slice().sort((a, b) => String(b.data_intervento).localeCompare(String(a.data_intervento))).slice(0, 12).map(i =>
        "- " + [i.data_intervento, (TIPO_FERRATURA_LABELS[i.tipo_ferratura] || i.tipo_ferratura) + (i.tipo_altro ? " (" + i.tipo_altro + ")" : ""),
          i.numero_ferro ? "ferro " + siglaFerro(i.misura_sistema, i.numero_ferro) : "", i.quantita_ferri ? i.quantita_ferri + " ferri" : "",
          testoFerroIntervento(i) || "", i.stato !== "fatto" ? i.stato : "", i.note ? "note: " + i.note : ""].filter(Boolean).join(" · "));
      const testo = [`Scheda del cavallo ${cv.nome}${cv.codice_equo ? " (codice Equo " + cv.codice_equo + ")" : ""}${cv.razza ? ", " + cv.razza : ""}${cv.nascita ? ", nato il " + cv.nascita : ""}; cliente ${cli?.nome || "—"}.`,
        `Ferratura in scheda: ${descrFerraturaCavallo(cv)}.`,
        st.prossimo ? `Prossimo lavoro: ${st.prossimo.data}.` : "",
        righe.length ? "Storico (più recenti prima):\n" + righe.join("\n") : "Nessun lavoro registrato."].filter(Boolean).join("\n");
      return { tipo: "cavallo", nome: cv.nome, testo, cv, clienteId: currentClienteId };
    }
  }
  const dv = document.getElementById("clienti-detail-view");
  if(currentClienteId && dv && dv.style.display !== "none"){
    const cli = (clientiMascalcia || []).find(c => c.id === currentClienteId);
    if(cli) return { tipo: "cliente", nome: cli.nome, clienteId: cli.id,
      testo: `Scheda del cliente ${cli.nome}${isStruttura(cli) ? " (scuderia o centro ippico)" : ""}. Cavalli: ${(schedaCavalli || []).map(c => c.nome + " (" + descrFerraturaCavallo(c) + ")").join(", ") || "nessuno"}.` };
  }
  return null;
}
function hpPreparaPannello(){
  const pan = document.getElementById("hp-pan");
  if(!pan) return;
  const on = agenteAiHammer();
  pan.hidden = !on;
  if(!on){ hpContesto = null; return; }
  hpContesto = hpCalcolaContesto();
  const ctx = document.getElementById("hp-ctx");
  ctx.hidden = !hpContesto;
  if(hpContesto) document.getElementById("hp-ctx-nome").textContent = hpContesto.nome;
  document.getElementById("hp-btn-storico").hidden = !(hpContesto && hpContesto.tipo === "cavallo");
}
function hpTogliContesto(){ hpContesto = null; document.getElementById("hp-ctx").hidden = true; document.getElementById("hp-btn-storico").hidden = true; }
function hpChiedi(){ hpFineCaso(); const i = document.getElementById("chat-input"); i.focus(); }
function hpStorico(){ if(hpContesto) sendChatMessage({ testo: `Riassumi lo storico di ${hpContesto.nome}`, modalita: "storico" }); }
function hpCaso(){
  hpCasoAttivo = true;
  if(!document.getElementById("hp-caso-barra")) document.getElementById("hp-pan").insertAdjacentHTML("afterend", '<div class="hp-caso-barra" id="hp-caso-barra">Consulta un caso: rispondi o tocca una scelta<button type="button" onclick="hpFineCaso()">Fine</button></div>');
  sendChatMessage({ testo: hpContesto && hpContesto.tipo === "cavallo" ? `Vorrei un consulto su ${hpContesto.nome}.` : "Vorrei un consulto su un caso.", modalita: "caso" });
}
function hpFineCaso(){ hpCasoAttivo = false; document.getElementById("hp-caso-barra")?.remove(); }
function hpEstraiScelte(testo){
  const m = String(testo || "").match(/\**Scelte:\**\s*([^\n]+)\s*$/i);
  return m ? m[1].split("|").map(x => x.replace(/[*_"«»]/g, "").trim()).filter(Boolean).slice(0, 5) : [];
}
function hpScelta(btn){
  btn.parentElement.querySelectorAll("button").forEach(b => b.disabled = true);
  sendChatMessage({ testo: btn.textContent, modalita: "caso" });
}
function hpLimiteHtml(data){
  const u = data.uso || {}, alGiorno = u.periodo === "giorno";
  const foto = data.peso > 1;
  return `<div class="chat-bubble ai hp-limite"><b>${foto ? "Un'analisi foto vale 3 messaggi" : alGiorno ? `Hai usato i ${u.limite} messaggi di oggi` : "Hai finito i messaggi di questo mese"}</b>
    <p>${foto ? `Oggi ne restano ${Math.max(0, (u.limite || 0) - (u.usati || 0))}. ` : ""}${alGiorno ? "Domani ne hai altri " + u.limite + ". Per continuare adesso:" : "Il contatore riparte il 1° del mese."}</p>
    ${alGiorno ? `<button type="button" class="hp-b v" onclick="closeAiSheet();hpChiudiFoto();togglePiano()">Passa a Premium</button>
    <button type="button" class="hp-b o" onclick="showToast('I crediti Hammer arrivano a breve: intanto con Premium hai 500 messaggi al mese.')">Acquista crediti Hammer</button>` : ""}</div>`;
}


export { aggiungiAllegatiAi, hpCaso, hpChiedi, hpEstraiScelte, hpFineCaso, hpLimiteHtml, hpPreparaPannello, hpScelta, hpStorico, hpTogliContesto, renderAllegatiAi, riduciImmagine, rimuoviAllegatoAi };
