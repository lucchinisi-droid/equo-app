// Equo App · veterinario · Clienti (29/10/2026, mockup Clienti 1 · Elenco)
// Un solo elenco A–Z di privati e scuderie, con i filtri Tutti · Privati · Scuderie · Crediti.
// Stessi dati e stesse schede del maniscalco: clientiAttivi(), openClienteDetail(), apriNuovoCliente(), crediti dagli interventi
// (pagResiduo tiene conto degli acconti e delle rate). Lo chiama renderClientiList (maniscalco/033) per il veterinario.

let vetCliFiltro = (() => { try { return localStorage.getItem("equo-vet-cli-filtro") || "tutti"; } catch(e){ return "tutti"; } })();

function vetSuEquo(c){ return !!(c.cliente_user_id || c.collegamento_stato === "attivo"); }
function vetSigla(nome){
  const p = String(nome || "?").trim().split(/\s+/).filter(Boolean);
  return ((p[0] || "?").charAt(0) + (p.length > 1 ? p[p.length - 1].charAt(0) : (p[0] || "").charAt(1) || "")).toUpperCase();
}
// quanto deve ogni cliente: lavori fatti e non saldati (meno acconti e rate già pagati)
function vetCrediti(){
  const out = {};
  (typeof cliInterventi !== "undefined" ? cliInterventi : []).forEach(i => {
    if(i.stato !== "fatto" || i.stato_pagamento !== "da_saldare") return;
    const resto = typeof pagResiduo === "function" ? pagResiduo(i) : Number(i.importo) || 0;
    if(resto > 0) out[i.cliente_mascalcia_id] = (out[i.cliente_mascalcia_id] || 0) + resto;
  });
  return out;
}
function vetFiltroClienti(k){
  vetCliFiltro = k;
  try { localStorage.setItem("equo-vet-cli-filtro", k); } catch(e){}
  const box = document.getElementById("clienti-list");
  if(box) vetRenderClienti(box);
}
function vetVaiLettera(l){
  const el = document.querySelector(`#clienti-list .cli-lettera[data-l="${l}"]`);
  if(el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

function vetRenderClienti(box){
  const attivi = clientiAttivi();
  const crediti = vetCrediti();
  const cavalli = typeof cavalliCartella === "function" ? cavalliCartella() : [];
  const perCliente = {};
  cavalli.forEach(cv => { (perCliente[cv.cliente_mascalcia_id] = perCliente[cv.cliente_mascalcia_id] || []).push(cv); });
  const filtri = [["tutti", "Tutti"], ["privati", "Privati"], ["scuderie", "Scuderie"], ["crediti", "Crediti"]];
  if(!filtri.some(f => f[0] === vetCliFiltro)) vetCliFiltro = "tutti";
  document.getElementById("cli-cartelle").innerHTML = filtri.map(([k, t]) =>
    `<button role="tab" aria-selected="${vetCliFiltro === k}" class="${vetCliFiltro === k ? "on" : ""}" onclick="vetFiltroClienti('${k}')">${t}</button>`).join("");
  const nCli = attivi.length;
  document.getElementById("cli-cartella-sotto").innerHTML = `<span>${nCli} ${nCli === 1 ? "cliente" : "clienti"} · ${cavalli.length} ${cavalli.length === 1 ? "cavallo" : "cavalli"}</span>`
    + `<button class="vt-cli-nuovo" onclick="apriNuovoCliente('proprietario')">+ Cliente</button>`;
  const collega = document.getElementById("cli-collega-btn"); if(collega) collega.style.display = "none";
  const f = typeof cercaFiltri !== "undefined" && cercaFiltri.clienti;
  if(f) f.inp.placeholder = "Nome, cavallo, microchip";

  const lista = attivi.filter(c => vetCliFiltro === "privati" ? !isStruttura(c) : vetCliFiltro === "scuderie" ? isStruttura(c) : vetCliFiltro === "crediti" ? crediti[c.id] > 0 : true)
    .sort((a, b) => (a.nome || "").localeCompare(b.nome || "", "it", { sensitivity: "base" }));
  let html = "", lettera = "";
  const lettere = [];
  lista.forEach(c => {
    const l = (c.nome || "?").trim().charAt(0).toUpperCase();
    if(l !== lettera){ lettera = l; lettere.push(l); html += `<div class="cli-lettera" data-l="${escapeHtml(l)}">${escapeHtml(l)}</div>`; }
    const str = isStruttura(c), equo = vetSuEquo(c);
    const suoi = perCliente[c.id] || [];
    let sotto;
    if(str){
      const qui = typeof cavalliQuiStanno === "function" ? cavalliQuiStanno(c.id).length : 0;
      const n = suoi.length + qui;
      sotto = ["Scuderia", n ? `${n} ${n === 1 ? "cavallo" : "cavalli"}` : "", equo ? "su Equo" : "non ancora su Equo"];
    } else {
      const nomi = suoi.length ? suoi.map(x => x.nome) : (typeof nomiCavalliCliente === "function" ? nomiCavalliCliente(c) : []);
      const dove = suoi.find(x => x.ubicazione_tipo === "scuderia" && x.ubicazione_cliente_id);
      const posto = dove ? (clienteDiId(dove.ubicazione_cliente_id)?.nome || dove.ubicazione_nome || "") : "";
      sotto = [nomi.slice(0, 3).join(", ") + (nomi.length > 3 ? "…" : ""), posto || (equo ? "" : "non ancora su Equo")];
    }
    const deve = crediti[c.id] || 0;
    const dx = deve > 0 ? `<span class="vt-cli-deve">${escapeHtml(formatEuro(deve))}</span>`
      : !equo ? `<span class="vt-cli-invita">Invita</span>`
      : `<span class="vt-cli-ok">in regola</span>`;
    const cerca = [typeof paroleCercaCliente === "function" ? paroleCercaCliente(c) : "", ...suoi.map(x => [x.nome, x.microchip, x.codice_equo].filter(Boolean).join(" "))].join(" ");
    html += `<div class="cli-riga vt-cli" data-cerca="${escapeHtml(cerca)}" onclick="openClienteDetail('${c.id}')">
      <span class="cli-av vt-av ${str ? "str" : equo ? "equo" : "no"}">${escapeHtml(vetSigla(c.nome))}</span>
      <span class="cli-c"><b>${escapeHtml(c.nome)}</b><span>${escapeHtml(sotto.filter(Boolean).join(" · "))}</span></span>
      ${dx}</div>`;
  });
  if(!lista.length) html = `<div class="cli-vuoto cerca-ignora">${vetCliFiltro === "crediti" ? "Nessun cliente ti deve qualcosa: tutti in regola." : "Nessun cliente qui."}</div>`;
  box.innerHTML = html + (lettere.length > 4 ? `<div class="vt-indice cerca-ignora">${lettere.map(l => `<button onclick="event.stopPropagation();vetVaiLettera('${escapeHtml(l)}')">${escapeHtml(l)}</button>`).join("")}</div>` : "");
  // archiviati: come per il maniscalco, in fondo
  const arch = (clientiMascalcia || []).filter(c => c.archiviato_il);
  document.getElementById("clienti-archiviati-box").innerHTML = arch.length ? `<details class="clienti-archiviati" style="margin-top:14px">
      <summary class="clienti-sez-title" style="cursor:pointer;padding:6px 0">ARCHIVIATI (${arch.length})</summary>
      <div class="cli-lista" style="opacity:.72">${arch.map(c => `<div class="cli-riga" onclick="openClienteDetail('${c.id}')"><span class="cli-av vt-av no">${escapeHtml(vetSigla(c.nome))}</span><span class="cli-c"><b>${escapeHtml(c.nome)}</b><span>${escapeHtml(c.nome_cavallo || "")}</span></span><span class="cli-dx">›</span></div>`).join("")}</div></details>` : "";
}

export { vetRenderClienti, vetFiltroClienti, vetVaiLettera };
