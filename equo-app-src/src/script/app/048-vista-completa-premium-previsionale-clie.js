/* ---------- VISTA COMPLETA (Premium): previsionale, clienti e prezzi, medie operative, consumo ferri ----------
   I ferri nuovi/rimessi sono un dato privato del maniscalco: si vedono solo qui. */
const INC_TIPI_CAVALLO = ["ferratura", "mezza_ferratura", "pareggio"];
const INC_ORIZZONTE = 28; // previsionale: prossime 4 settimane
function ferriIntervento(i){ return Number(i.quantita_ferri) || (i.tipo_ferratura === "mezza_ferratura" ? 2 : 4); }
function incFinestra(mesi, primo){
  const oggi = isoLocale(new Date());
  const d = new Date(); d.setMonth(d.getMonth() - mesi);
  let da = isoLocale(d);
  const tagliata = !!(primo && primo > da);
  if(tagliata) da = primo;
  return { da, a: oggi, giorni: Math.max(7, giorniTra(da, oggi) + 1), tagliata };
}
const incData = iso => new Date(iso + "T12:00").toLocaleDateString("it-IT", { day: "numeric", month: "short" });
const incNum = (n, dec = 0) => (Number(n) || 0).toLocaleString("it-IT", { maximumFractionDigits: dec, minimumFractionDigits: 0 });
function incPct(v, prima){ if(!prima) return ""; const d = Math.round((v - prima) / prima * 100); return `<span class="${d >= 0 ? "su" : "giu"}">${d >= 0 ? "▲" : "▼"} ${Math.abs(d)}%</span>`; }

function statFinte(){
  const k = (l, v) => `<div class="k"><div class="l">${l}</div><div class="v">${v}</div></div>`;
  return `<div class="card inc-card"><div class="inc-tit"><span>Previsionale</span></div><div class="inc-stat-kpis"><div class="k grande"><div class="l">Incasso in arrivo</div><div class="v">2.380 €</div></div></div></div>
    <div class="card inc-card"><div class="inc-tit"><span>Medie operative</span></div><div class="inc-stat-kpis">${k("Cavalli a settimana", "14,5")}${k("Guadagno al mese", "6.090 €")}</div></div>
    <div class="card inc-card"><div class="inc-tit"><span>Consumo ferri</span></div><div class="inc-stat-kpis">${k("A settimana", "38")}${k("Al mese", "164")}</div></div>`;
}

async function renderIncassiCompleta(){
  const box = document.getElementById("inc-stat");
  if(!box) return;
  const mesiBox = document.getElementById("inc-mesi");
  if(!isPremium()){
    mesiBox.innerHTML = "";
    box.innerHTML = `<div class="inc-bloccata"><div class="sotto" aria-hidden="true">${statFinte()}</div>
      <div class="lucchetto"><div style="font-size:30px">📊</div><h3>Statistiche complete</h3><p>Con Premium vedi il tuo lavoro come un'azienda:</p>
        <ul><li>quanto incasserai con gli appuntamenti in agenda</li><li>prezzo medio per cliente</li><li>cavalli e guadagno medi a settimana e al mese</li><li>quanti ferri usi e quanti comprarne</li></ul>
        <button class="btn btn-primary" style="width:100%" onclick="togglePiano()">Passa a Premium</button>
        <button class="btn btn-outline" style="width:100%;margin-top:6px" onclick="sceltaVistaIncassi('semplice')">Torna alla vista Semplice</button></div></div>`;
    return;
  }
  mesiBox.innerHTML = [3, 6, 12].map(n => `<button class="${incMesi === n ? "on" : ""}" onclick="sceltaMesiIncassi(${n})">${n} mesi</button>`).join("");
  try { incCavalli = await DB.listCavalliMiei(); } catch(e){ incCavalli = []; }
  const oggi = isoLocale(new Date());
  const fatti = incTutti.filter(i => i.stato === "fatto");
  const primo = fatti.reduce((m, i) => !m || i.data_intervento < m ? i.data_intervento : m, null);
  const W = incFinestra(incMesi, primo);
  const settimane = W.giorni / 7, mesiEff = W.giorni / 30.44;
  const inFin = fatti.filter(i => i.data_intervento >= W.da && i.data_intervento <= W.a);
  const nomeFin = W.tagliata ? `dal ${incData(W.da)}` : `ultimi ${incMesi} mesi`;

  // 1. PREVISIONALE
  const fineOr = aggiungiGiorniIso(oggi, INC_ORIZZONTE - 1);
  const futuri = incTutti.filter(i => i.stato === "programmato" && i.stato_pagamento !== "saldato" && i.data_intervento >= oggi);
  const nelleSett = futuri.filter(i => i.data_intervento <= fineOr);
  const conPrezzo = nelleSett.filter(i => Number(i.importo) > 0), senzaPrezzo = nelleSett.filter(i => !(Number(i.importo) > 0));
  const piuAvanti = incSomma(futuri.filter(i => i.data_intervento > fineOr && Number(i.importo) > 0));
  const settBarre = [0, 1, 2, 3].map(w => { const da = aggiungiGiorniIso(oggi, w * 7), a = aggiungiGiorniIso(oggi, w * 7 + 6);
    return [Number(da.slice(8)) + "–" + incData(a), incSomma(conPrezzo.filter(i => i.data_intervento >= da && i.data_intervento <= a))]; });
  const maxB = Math.max(1, ...settBarre.map(b => b[1]));
  const fmtK = v => v >= 1000 ? (v / 1000).toFixed(1).replace(".", ",").replace(",0", "") + "k" : String(Math.round(v));
  const prev = `<div class="card inc-card"><div class="inc-tit"><span>Previsionale</span><em>prossime 4 settimane</em></div>
    <div class="inc-stat-kpis"><div class="k grande"><div class="l">Incasso in arrivo</div><div class="v">${euroTondo(incSomma(conPrezzo))}</div>
      <div class="d">${conPrezzo.length} ${conPrezzo.length === 1 ? "appuntamento" : "appuntamenti"} con prezzo${piuAvanti ? ` · più avanti in agenda altri ${euroTondo(piuAvanti)}` : ""}</div></div></div>
    <div class="inc-grafico" style="height:96px;margin-top:8px">${settBarre.map(([l, v]) => `<div class="c" title="${escapeHtml(l)}: ${euroTondo(v)}"><small>${v ? fmtK(v) : ""}</small><div class="b${v ? "" : " zero"}" style="height:${Math.max(2, Math.round(v / maxB * 62))}px"></div><small>${escapeHtml(l)}</small></div>`).join("")}</div>
    ${senzaPrezzo.length ? `<div class="inc-avviso">⚠️ <span><b>${senzaPrezzo.length} ${senzaPrezzo.length === 1 ? "appuntamento senza prezzo" : "appuntamenti senza prezzo"}</b><br>non ${senzaPrezzo.length === 1 ? "è contato" : "sono contati"}</span><button class="btn btn-outline btn-sm" onclick="aggiungiPrezziMancanti()">Aggiungi</button></div>` : ""}</div>`;

  // 2. CLIENTI E PREZZI
  const attivi = clientiAttivi();
  const idAttivi = new Set(attivi.map(c => c.id));
  const cavAttivi = incCavalli.filter(c => idAttivi.has(c.cliente_mascalcia_id));
  const media = (l) => { const v = l.filter(i => Number(i.importo) > 0); return v.length ? incSomma(v) / v.length : null; };
  const righeCli = attivi.map(c => {
    const suoi = inFin.filter(i => i.cliente_mascalcia_id === c.id);
    return { id: c.id, nome: c.nome, scuderia: c.tipo_cliente === "struttura" || !!c.centro_id, cav: cavAttivi.filter(x => x.cliente_mascalcia_id === c.id).length,
      fer: media(suoi.filter(i => i.tipo_ferratura === "ferratura")), par: media(suoi.filter(i => i.tipo_ferratura === "pareggio")), lavori: suoi.length };
  }).filter(r => r.cav || r.lavori).sort((a, b) => b.cav - a.cav || b.lavori - a.lavori || a.nome.localeCompare(b.nome));
  const visCli = incCliTutti ? righeCli : righeCli.slice(0, 8);
  const mF = media(inFin.filter(i => i.tipo_ferratura === "ferratura")), mM = media(inFin.filter(i => i.tipo_ferratura === "mezza_ferratura")), mP = media(inFin.filter(i => i.tipo_ferratura === "pareggio"));
  const medieTot = [mF != null ? `ferratura <b>${euroTondo(Math.round(mF))}</b>` : "", mM != null ? `mezza <b>${euroTondo(Math.round(mM))}</b>` : "", mP != null ? `pareggio <b>${euroTondo(Math.round(mP))}</b>` : ""].filter(Boolean).join(" · ");
  const cli = `<div class="card inc-card"><div class="inc-tit"><span>Clienti e prezzi</span><em>${cavAttivi.length} ${cavAttivi.length === 1 ? "cavallo" : "cavalli"} · ${attivi.length} ${attivi.length === 1 ? "cliente" : "clienti"}</em></div>
    ${righeCli.length ? `<table class="inc-tab"><tr><th>Cliente</th><th>Cavalli</th><th>Ferratura media</th></tr>
      ${visCli.map(r => `<tr class="cli" onclick="showPage('pro-clienti'); openClienteDetail('${r.id}')"><td>${escapeHtml(r.nome)}${r.scuderia ? "<small>scuderia</small>" : r.par != null && r.fer == null ? `<small>pareggio ${euroTondo(Math.round(r.par))}</small>` : ""}</td><td>${r.cav}</td><td>${r.fer != null ? euroTondo(Math.round(r.fer)) : "—"}</td></tr>`).join("")}</table>
      ${righeCli.length > visCli.length ? `<button class="btn btn-ghost btn-sm" style="width:100%;margin-top:6px" onclick="incCliTutti=true;renderIncassiCompleta()">Mostra tutti (${righeCli.length})</button>` : ""}`
      : '<div class="muted" style="font-size:13px">Ancora nessun cliente con cavalli.</div>'}
    <div class="inc-nota">${medieTot ? `Media di tutti i clienti (${escapeHtml(nomeFin)}): ${medieTot}. ` : ""}Conta solo i lavori fatti con il prezzo. Tocca un cliente per aprire la scheda.</div></div>`;

  // 3. MEDIE OPERATIVE (cavalli ferrati e pareggiati; guadagno = valore dei lavori fatti)
  const cavLav = inFin.filter(i => INC_TIPI_CAVALLO.includes(i.tipo_ferratura));
  const valore = incSomma(inFin), conImp = inFin.filter(i => Number(i.importo) > 0);
  const pDa = aggiungiGiorniIso(W.da, -W.giorni), pA = aggiungiGiorniIso(W.da, -1);
  const primaFin = fatti.filter(i => i.data_intervento >= pDa && i.data_intervento <= pA);
  const cavPrima = primaFin.filter(i => INC_TIPI_CAVALLO.includes(i.tipo_ferratura)).length, valPrima = incSomma(primaFin);
  const kk = (l, v, d) => `<div class="k"><div class="l">${l}</div><div class="v">${v}</div><div class="d">${d}</div></div>`;
  const med = `<div class="card inc-card"><div class="inc-tit"><span>Medie operative</span><em>${escapeHtml(nomeFin)}</em></div>
    ${cavLav.length || valore ? `<div class="inc-stat-kpis">
      ${kk("Cavalli a settimana", incNum(cavLav.length / settimane, 1), "ferrati e pareggiati")}
      ${kk("Cavalli al mese", incNum(cavLav.length / mesiEff), (incPct(cavLav.length, cavPrima) ? incPct(cavLav.length, cavPrima) + " sul periodo prima" : `${cavLav.length} in tutto`))}
      ${kk("Guadagno a settimana", euroTondo(Math.round(valore / settimane)), "valore dei lavori fatti")}
      ${kk("Guadagno al mese", euroTondo(Math.round(valore / mesiEff)), [conImp.length ? euroTondo(Math.round(valore / conImp.length)) + " a lavoro" : "", incPct(valore, valPrima)].filter(Boolean).join(" · "))}
    </div>` : '<div class="muted" style="font-size:13px">Nessun lavoro fatto nel periodo.</div>'}
    ${W.tagliata ? `<div class="inc-nota">Medie calcolate dal ${incData(W.da)}, il primo lavoro registrato in Equo.</div>` : ""}</div>`;

  // 4. CONSUMO FERRI (solo numero, niente costi)
  const conFerri = inFin.filter(i => i.tipo_ferratura === "ferratura" || i.tipo_ferratura === "mezza_ferratura");
  let nuovi = 0, rimessi = 0;
  const perMisura = new Map();
  conFerri.forEach(i => {
    const n = ferriIntervento(i);
    if(i.ferri_nuovi === false){ rimessi += n; return; }
    nuovi += n;
    const k = i.numero_ferro ? "n. " + i.numero_ferro + (i.misura_sistema ? " " + (MISURA_SISTEMA_LABEL[i.misura_sistema] || "") : "") : "?";
    perMisura.set(k, (perMisura.get(k) || 0) + n);
  });
  const quotaNuovi = nuovi + rimessi ? nuovi / (nuovi + rimessi) : 1;
  const inAgenda = futuri.filter(i => i.data_intervento <= aggiungiGiorniIso(oggi, 29) && (i.tipo_ferratura === "ferratura" || i.tipo_ferratura === "mezza_ferratura"))
    .reduce((t, i) => t + ferriIntervento(i), 0);
  const agendaNuovi = Math.round(inAgenda * quotaNuovi), mediaMese = Math.round(nuovi / mesiEff);
  const stima = Math.max(agendaNuovi, mediaMese);
  const misure = [...perMisura.entries()].map(([k, v]) => [k, v / mesiEff]).sort((a, b) => (a[0] === "?") - (b[0] === "?") || b[1] - a[1]).slice(0, 10);
  const maxM = Math.max(1, ...misure.map(m => m[1]));
  const ferri = `<div class="card inc-card"><div class="inc-tit"><span>Consumo ferri</span><em>${escapeHtml(nomeFin)}</em></div>
    ${nuovi + rimessi ? `<div class="inc-stat-kpis">
      ${kk("Ferri nuovi a settimana", incNum(nuovi / settimane), `rimessi: ${incNum(rimessi / settimane)}`)}
      ${kk("Ferri nuovi al mese", incNum(nuovi / mesiEff), `${Math.round(quotaNuovi * 100)}% nuovi · ${100 - Math.round(quotaNuovi * 100)}% rimessi`)}
      <div class="k grande"><div class="l">Te ne servono nel prossimo mese</div><div class="v">≈ ${incNum(stima)} ferri</div>
        <div class="d">in agenda: ${incNum(agendaNuovi)} · tua media: ${incNum(mediaMese)} al mese</div></div>
    </div>
    ${misure.length ? `<div class="inc-tit" style="margin-top:12px"><span>Per misura · al mese</span></div><div class="inc-misure">${misure.map(([k, v]) =>
      `<div class="inc-misura"><span>${escapeHtml(k)}</span><div class="f"><i style="width:${Math.round(v / maxM * 100)}%${k === "?" ? ";opacity:.5" : ""}"></i></div><b>${incNum(v)}</b></div>`).join("")}</div>` : ""}
    <div class="inc-nota">${perMisura.has("?") ? "«?» = ferrature senza misura del ferro: aggiungila nella scheda del cavallo. " : ""}Conta i ferri degli appuntamenti fatti: ferratura completa 4, mezza 2, o il numero indicato. Questi dati li vedi solo tu.</div>`
      : '<div class="muted" style="font-size:13px">Nessuna ferratura fatta nel periodo.</div>'}</div>`;

  box.innerHTML = prev + cli + med + ferri;
}

