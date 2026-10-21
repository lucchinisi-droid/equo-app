/* ---------- INCASSI: Saldati (per periodo), Da saldare, Previsti ----------
   Saldati: conta il giorno del pagamento (saldato_il); per i saldati di prima del 9/10/2026 il giorno del lavoro.
   Piano Free: Oggi e Mese corrente; Settimana, Anno e date a scelta sono Premium. */
let incPeriodo = "mese", incTutti = [], incElencoTutto = false, incCavalli = [];
let incVista = (() => { try { return localStorage.getItem("equo-inc-vista") || "semplice"; } catch(e){ return "semplice"; } })();
let incMesi = (() => { try { return Number(localStorage.getItem("equo-inc-mesi")) || 6; } catch(e){ return 6; } })();
let incAperta = "dasaldare", incCliTutti = false;
const INC_PERIODI = [["oggi", "Oggi", false], ["settimana", "Settimana", true], ["mese", "Mese", false], ["anno", "Anno", true], ["date", "Scegli date…", true]];
function euroTondo(n){ return (Number(n) || 0).toLocaleString("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: Number(n) % 1 ? 2 : 0 }); }
function giornoPagamento(i){ return i.saldato_il ? isoLocale(new Date(i.saldato_il)) : (i.data_intervento || ""); }
function incIntervallo(per){
  const oggi = new Date(), iso = isoLocale(oggi);
  if(per === "oggi") return { da: iso, a: iso, prevDa: aggiungiGiorniIso(iso, -1), prevA: aggiungiGiorniIso(iso, -1), nome: "oggi", prevNome: "ieri" };
  if(per === "settimana"){
    const lun = isoLocale(agLunedi(0)), dom = aggiungiGiorniIso(lun, 6);
    return { da: lun, a: dom, prevDa: aggiungiGiorniIso(lun, -7), prevA: aggiungiGiorniIso(lun, -1), nome: "questa settimana", prevNome: "la settimana scorsa" };
  }
  if(per === "anno"){
    const y = oggi.getFullYear();
    return { da: y + "-01-01", a: y + "-12-31", prevDa: (y - 1) + "-01-01", prevA: (y - 1) + "-12-31", nome: String(y), prevNome: String(y - 1) };
  }
  if(per === "date"){
    const da = document.getElementById("inc-dal").value || aggiungiGiorniIso(iso, -29), a = document.getElementById("inc-al").value || iso;
    const n = giorniTra(da, a) + 1;
    return { da, a, prevDa: aggiungiGiorniIso(da, -n), prevA: aggiungiGiorniIso(da, -1), nome: formatDataBreve(da) + " – " + formatDataBreve(a), prevNome: `i ${n} giorni prima` };
  }
  const y = oggi.getFullYear(), m = oggi.getMonth();
  const primo = isoLocale(new Date(y, m, 1)), ultimo = isoLocale(new Date(y, m + 1, 0));
  const pPrimo = isoLocale(new Date(y, m - 1, 1)), pUltimo = isoLocale(new Date(y, m, 0));
  return { da: primo, a: ultimo, prevDa: pPrimo, prevA: pUltimo, nome: new Date(y, m, 1).toLocaleDateString("it-IT", { month: "long" }), prevNome: new Date(y, m - 1, 1).toLocaleDateString("it-IT", { month: "long" }) };
}
function incSaldatiTra(da, a){ return incTutti.filter(i => i.stato_pagamento === "saldato" && i.stato === "fatto" && (() => { const g = giornoPagamento(i); return g >= da && g <= a; })()); }
const incSomma = l => l.reduce((t, i) => t + (Number(i.importo) || 0), 0);

async function renderIncassi(){
  const box = document.getElementById("incassi-mese-incassato");
  if(!box) return;
  incTutti = await DB.listInterventiMascalciaTutti();
  const iso = isoLocale(new Date()), mese = iso.slice(0, 7);
  const incassatoMese = incSomma(incTutti.filter(i => i.stato_pagamento === "saldato" && i.stato === "fatto" && giornoPagamento(i).startsWith(mese)));
  const fattiNonSaldati = incTutti.filter(i => i.stato === "fatto" && i.stato_pagamento !== "saldato");
  const daIncassare = incSomma(fattiNonSaldati);
  const previsti = incTutti.filter(i => i.stato === "programmato" && i.stato_pagamento !== "saldato" && Number(i.importo) > 0)
    .sort((a, b) => (a.data_intervento + (a.ora || "")).localeCompare(b.data_intervento + (b.ora || "")));
  const previstoTot = incSomma(previsti);
  box.textContent = formatEuro(incassatoMese);
  if(typeof wgPro !== "undefined"){ wgPro.incassatoMese = incassatoMese; wgPro.daIncassareMese = daIncassare; wgPro.previsto = previstoTot; if(typeof wgRidisegna === "function") wgRidisegna(); }
  const homeTeaser = document.getElementById("home-pro-incassi-mese");
  if(homeTeaser) homeTeaser.textContent = formatEuro(incassatoMese) + " incassati";
  const totalUnread = proUnreadTotal;
  const homeUnread = document.getElementById("home-pro-unread");
  if(homeUnread) homeUnread.textContent = totalUnread > 0 ? `${totalUnread} messagg${totalUnread === 1 ? "io" : "i"} non lett${totalUnread === 1 ? "o" : "i"}` : "Nessun messaggio non letto";

  // vista Semplice | Completa (l'interruttore c'è solo nella versione Completa dell'app)
  if(!vistaCompleta() && incVista === "completa") incVista = "semplice";
  document.getElementById("inc-vista").style.display = vistaCompleta() ? "" : "none";
  const prem = isPremium();
  document.getElementById("inc-vista").innerHTML = [["semplice", "Semplice"], ["completa", "Completa"]]
    .map(([k, t]) => `<button role="tab" aria-selected="${incVista === k}" class="${incVista === k ? "on" : ""}" onclick="sceltaVistaIncassi('${k}')">${t}${k === "completa" && !prem ? '<span class="stella" aria-label="Premium">★</span>' : ""}</button>`).join("");
  document.getElementById("inc-titolo").textContent = incVista === "completa" ? "Statistiche" : "Incassi";
  document.getElementById("inc-semplice").hidden = incVista !== "semplice";
  document.getElementById("inc-completa").hidden = incVista !== "completa";

  // DA INCASSARE: lavori già fatti e non pagati, per cliente, con i giorni passati
  const oggiIso = iso;
  const perCli = new Map();
  fattiNonSaldati.forEach(i => { const k = i.cliente_mascalcia_id || "?"; if(!perCli.has(k)) perCli.set(k, { id: k, nome: i.clienti_mascalcia?.nome || "Cliente", righe: [] }); perCli.get(k).righe.push(i); });
  const gruppiDs = [...perCli.values()].map(g => ({ ...g, tot: incSomma(g.righe), righe: g.righe.sort((a, b) => a.data_intervento.localeCompare(b.data_intervento)) })).sort((a, b) => b.tot - a.tot);
  const piuVecchio = fattiNonSaldati.reduce((m, i) => Math.max(m, giorniTra(i.data_intervento, oggiIso)), 0);
  const cDs = document.getElementById("inc-cassa-dasaldare");
  cDs.classList.toggle("aperta", incAperta === "dasaldare");
  cDs.setAttribute("aria-expanded", String(incAperta === "dasaldare"));
  cDs.innerHTML = `<span class="l"><span>Da incassare</span><span>${incAperta === "dasaldare" ? "⌃" : "⌄"}</span></span><span class="v">${euroTondo(daIncassare)}</span>
    <span class="d">${fattiNonSaldati.length ? `${fattiNonSaldati.length} ${fattiNonSaldati.length === 1 ? "lavoro già fatto" : "lavori già fatti"} · ${gruppiDs.length} ${gruppiDs.length === 1 ? "cliente" : "clienti"} · il più vecchio da ${piuVecchio} ${piuVecchio === 1 ? "giorno" : "giorni"}` : "Tutto incassato 👍"}</span>`;
  document.getElementById("inc-det-dasaldare").hidden = incAperta !== "dasaldare";
  document.getElementById("incassi-da-saldare-list").innerHTML = !gruppiDs.length ? '<div class="muted" style="font-size:13px">Nessun pagamento in sospeso.</div>'
    : gruppiDs.map(g => `<div class="inc-gruppo"><span>${escapeHtml(g.nome)}</span><span style="display:flex;align-items:center;gap:10px">${euroTondo(g.tot)}${g.id && g.id !== "?" ? `<button type="button" class="btn btn-outline btn-sm" onclick="apriNuovoConto('${g.id}')">Fai il conto</button>` : ""}</span></div>` + g.righe.map(i => {
        const gg = giorniTra(i.data_intervento, oggiIso);
        return `<div class="inc-voce" data-cerca="${escapeHtml(TIPO_FERRATURA_LABELS[i.tipo_ferratura] || "")}">
          <div class="c"><b>${escapeHtml([i.cavalli_clienti_mascalcia?.nome, TIPO_FERRATURA_LABELS[i.tipo_ferratura] || i.tipo_ferratura].filter(Boolean).join(" · "))}</b>
            <span>${formatDataBreve(i.data_intervento)} · <span class="${gg > 30 ? "inc-vecchio" : ""}">${gg <= 0 ? "oggi" : "da " + gg + (gg === 1 ? " giorno" : " giorni")}</span></span></div>
          <span class="imp">${i.importo != null ? euroTondo(i.importo) : "—"}</span>
          <button class="btn btn-primary btn-sm inc-saldato" onclick="segnaSaldatoIncassi('${i.id}', this)">Saldato</button></div>`;
      }).join("")).join("");

  if(incVista === "completa") await renderIncassiCompleta();
  renderIncassiSaldati();
}

function renderIncassiSaldati(){
  const prem = isPremium();
  if(!prem && INC_PERIODI.find(p => p[0] === incPeriodo)?.[2]) incPeriodo = "mese";
  document.getElementById("inc-periodi").innerHTML = INC_PERIODI.map(([k, t, p]) =>
    `<button class="${incPeriodo === k ? "on" : ""}" onclick="sceltaPeriodoIncassi('${k}')">${t}${p && !prem ? ' <span class="inc-lucchetto" aria-label="Premium">🔒</span>' : ""}</button>`).join("");
  document.getElementById("inc-date").hidden = incPeriodo !== "date";
  const r = incIntervallo(incPeriodo);
  const lista = incSaldatiTra(r.da, r.a).sort((a, b) => giornoPagamento(b).localeCompare(giornoPagamento(a)));
  const prev = incSaldatiTra(r.prevDa, r.prevA);
  const tot = incSomma(lista), totPrev = incSomma(prev);
  const diff = totPrev > 0 ? Math.round((tot - totPrev) / totPrev * 100) : null;
  const conImporto = lista.filter(i => Number(i.importo) > 0);
  const cIn = document.getElementById("inc-cassa-incassati");
  cIn.classList.toggle("aperta", incAperta === "incassati");
  cIn.setAttribute("aria-expanded", String(incAperta === "incassati"));
  cIn.innerHTML = `<span class="l"><span>Incassati · ${escapeHtml(r.nome)}</span><span>${incAperta === "incassati" ? "⌃" : "⌄"}</span></span><span class="v">${euroTondo(tot)}</span>
    <span class="d">${lista.length} ${lista.length === 1 ? "lavoro pagato" : "lavori pagati"}${diff === null ? "" : ` · <span class="${diff >= 0 ? "su" : "giu"}" style="color:var(--${diff >= 0 ? "green" : "red"})">${diff >= 0 ? "▲" : "▼"} ${Math.abs(diff)}%</span> rispetto a ${escapeHtml(r.prevNome)}`}</span>`;
  document.getElementById("inc-det-incassati").hidden = incAperta !== "incassati";
  document.getElementById("inc-kpis").innerHTML = `
    <div class="inc-kpi"><div class="l">${escapeHtml(r.prevNome.charAt(0).toUpperCase() + r.prevNome.slice(1))}</div><div class="v">${euroTondo(totPrev)}</div></div>
    <div class="inc-kpi"><div class="l">Media a lavoro</div><div class="v">${conImporto.length ? euroTondo(Math.round(tot / conImporto.length)) : "—"}</div></div>`;

  // grafico: settimana = giorni, mese = settimane, anno = mesi, date = giorni (≤31) o mesi
  const barre = [];
  if(incPeriodo === "settimana" || (incPeriodo === "date" && giorniTra(r.da, r.a) <= 31)){
    for(let g = r.da; g <= r.a; g = aggiungiGiorniIso(g, 1)){
      const d = new Date(g + "T12:00");
      barre.push([incPeriodo === "settimana" ? AG_GIORNI[(d.getDay() + 6) % 7].charAt(0) : String(d.getDate()), incSomma(lista.filter(i => giornoPagamento(i) === g))]);
    }
  } else if(incPeriodo === "mese"){
    const fine = Number(r.a.slice(8));
    for(let s0 = 1; s0 <= fine; s0 += 7){
      const s1 = Math.min(s0 + 6, fine), pre = r.da.slice(0, 8);
      barre.push([s0 + "-" + s1, incSomma(lista.filter(i => { const g = Number(giornoPagamento(i).slice(8)); return g >= s0 && g <= s1; }))]);
    }
  } else if(incPeriodo === "anno" || incPeriodo === "date"){
    const mesi = [];
    for(let d = new Date(r.da.slice(0, 7) + "-01T12:00"); isoLocale(d).slice(0, 7) <= r.a.slice(0, 7); d.setMonth(d.getMonth() + 1)) mesi.push(isoLocale(d).slice(0, 7));
    mesi.forEach(m => barre.push([new Date(m + "-01T12:00").toLocaleDateString("it-IT", { month: "narrow" }), incSomma(lista.filter(i => giornoPagamento(i).startsWith(m)))]));
  }
  const gc = document.getElementById("inc-grafico-card");
  gc.style.display = barre.length > 1 ? "" : "none";
  const max = Math.max(1, ...barre.map(b => b[1]));
  const fmtK = v => v >= 1000 ? (v / 1000).toFixed(1).replace(".", ",").replace(",0", "") + "k" : String(Math.round(v));
  document.getElementById("inc-grafico").innerHTML = barre.map(([l, v]) => `<div class="c" title="${escapeHtml(l)}: ${euroTondo(v)}"><small>${v ? fmtK(v) : ""}</small><div class="b${v ? "" : " zero"}" style="height:${Math.max(2, Math.round(v / max * 78))}px"></div><small>${escapeHtml(l)}</small></div>`).join("");

  // per tipo e per cliente
  const barra = (t, v, maxV) => `<div class="inc-riga"><div class="t"><i style="transform:scaleX(${maxV ? (v / maxV).toFixed(3) : 0})"></i><span>${escapeHtml(t)}</span></div><b>${euroTondo(v)}</b></div>`;
  const perTipo = Object.keys(TIPO_FERRATURA_LABELS).map(k => [TIPO_FERRATURA_LABELS[k], incSomma(lista.filter(i => i.tipo_ferratura === k))]).filter(x => x[1] > 0);
  const mt = Math.max(0, ...perTipo.map(x => x[1]));
  document.getElementById("inc-per-tipo").innerHTML = perTipo.length ? perTipo.map(([t, v]) => barra(t, v, mt)).join("") : '<div class="muted" style="font-size:13px">Nessun incasso nel periodo.</div>';
  const cli = new Map();
  lista.forEach(i => { const n = i.clienti_mascalcia?.nome || "Cliente"; cli.set(n, (cli.get(n) || 0) + (Number(i.importo) || 0)); });
  const cliOrd = [...cli.entries()].sort((a, b) => b[1] - a[1]);
  const top = cliOrd.slice(0, 5), altri = cliOrd.slice(5);
  if(altri.length) top.push([`Altri ${altri.length} ${altri.length === 1 ? "cliente" : "clienti"}`, altri.reduce((t, x) => t + x[1], 0)]);
  const mc = Math.max(0, ...top.map(x => x[1]));
  document.getElementById("inc-per-cliente").innerHTML = top.length ? top.map(([t, v]) => barra(t, v, mc)).join("") : '<div class="muted" style="font-size:13px">Nessun incasso nel periodo.</div>';

  // elenco
  document.getElementById("inc-elenco-n").textContent = lista.length ? String(lista.length) : "";
  const vis = incElencoTutto ? lista : lista.slice(0, 30);
  document.getElementById("inc-elenco").innerHTML = !lista.length ? '<div class="muted" style="font-size:13px">Nessun lavoro saldato nel periodo.</div>'
    : vis.map(i => `<div class="inc-voce"><div class="c"><b>${escapeHtml(i.clienti_mascalcia?.nome || "")}${i.cavalli_clienti_mascalcia?.nome ? " · " + escapeHtml(i.cavalli_clienti_mascalcia.nome) : ""}</b>
        <span>${escapeHtml(TIPO_FERRATURA_LABELS[i.tipo_ferratura] || i.tipo_ferratura)} · lavoro ${formatDataBreve(i.data_intervento)}${i.saldato_il ? " · pagato " + formatDataBreve(giornoPagamento(i)) : ""}</span></div>
        <span class="imp">${i.importo != null ? euroTondo(i.importo) : "—"}</span></div>`).join("")
      + (lista.length > vis.length ? `<button class="btn btn-ghost btn-sm" style="width:100%;margin-top:6px" onclick="incElencoTutto=true;renderIncassiSaldati()">Mostra tutti (${lista.length})</button>` : "");
}
function sceltaPeriodoIncassi(k){
  const p = INC_PERIODI.find(x => x[0] === k);
  if(p && p[2] && !isPremium()){ showToast("Settimana, Anno e date a scelta sono con Premium"); setTimeout(() => togglePiano(), 400); return; }
  incPeriodo = k; incElencoTutto = false;
  if(k === "date" && !document.getElementById("inc-dal").value){
    const iso = isoLocale(new Date());
    document.getElementById("inc-dal").value = aggiungiGiorniIso(iso, -29);
    document.getElementById("inc-al").value = iso;
  }
  renderIncassi();
}
function incApri(k){
  incAperta = incAperta === k ? null : k;
  renderIncassi();
}
function sceltaVistaIncassi(k){
  incVista = k;
  try { localStorage.setItem("equo-inc-vista", k); } catch(e){}
  renderIncassi();
}
function sceltaMesiIncassi(n){
  incMesi = n;
  try { localStorage.setItem("equo-inc-mesi", String(n)); } catch(e){}
  renderIncassiCompleta();
}

