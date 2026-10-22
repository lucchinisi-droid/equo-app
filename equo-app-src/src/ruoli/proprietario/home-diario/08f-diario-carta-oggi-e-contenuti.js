/* ---- carta «Oggi» nella Home ---- */
async function diarioHomeRender(){ const r = await diarioHomeRenderBase(); await eseguiEstensioni(estensioniDopo, "diarioHomeRender"); return r; }
async function diarioHomeRenderBase(){
  const box = document.getElementById("home-oggi"); if(!box) return;
  const h = diarioCavallo();
  if(!h){ box.innerHTML = ""; return; }
  if(diarioVoci.length === 0 || diarioVoci[0].horse_id !== h.id) diarioVoci = await diarioFetch(h.id);
  if(!albumCache[h.id]) await albumFetch(h.id);
  const st = diarioStats(diarioVoci), foto = cavalloHero(h);
  const oggi = diarioVoci.some(v => dKey(v.data_voce) === dKey(new Date()));
  const titolo = oggi ? "Hai già scritto oggi. Aggiungi un altro momento?" : (diarioVoci.length ? "Com'è andata oggi?" : "Scrivi il primo momento nel Diario.");
  const fa = new Date(); fa.setFullYear(fa.getFullYear() - 1);
  const ric = diarioVoci.find(v => diarioFotoUrl(v) && Math.abs(new Date(v.data_voce) - fa) < 3 * 864e5);
  box.innerHTML =
    `<div class="dr-oggi" style="background-image:url('${foto}')"><div class="c"><small>Oggi con ${escapeHtml(h.name)}${st.streak > 1 ? " · " + st.streak + " giorni di fila" : ""}</small><div class="t">${titolo}</div>` +
    `<div class="r"><button class="dr-btn o" onclick="diarioApri('foto')"><svg class="ic-d"><use href="#i-camera"/></svg>Foto</button><button class="dr-btn g" onclick="diarioApri('vocale')"><svg class="ic-d"><use href="#i-mic"/></svg>Vocale</button><button class="dr-btn g" onclick="diarioApri('nota')"><svg class="ic-d"><use href="#i-nota"/></svg>Nota</button></div></div></div>` +
    (diarioVoci.length ? `<div class="dr-ultimi"><div class="eq-tit" style="margin:0 2px 6px"><b>Ultimi momenti</b><span onclick="showPage('diario')" style="cursor:pointer">Apri il Diario ›</span></div><div class="dr-strip">${diarioVoci.slice(0, 8).map(v => { const u = v.media_path ? diarioUrl[v.media_path] : null; return `<button class="dr-mini2" ${v.tipo === "foto" && u ? `style="background-image:url('${u}')"` : ""} onclick="showPage('diario');setTimeout(()=>diarioDettaglio('${v.id}'),350)">${v.tipo === "vocale" ? "🎙" : v.tipo === "nota" ? "✎" : (u ? "" : "▫")}</button>`; }).join("")}</div></div>` : "") +
    `<div class="dr-rapidi"><button class="dr-chip" onclick="apriSchedaCavallo(${horses.length === 1 ? "'" + h.id + "'" : "null"})">${horses.length === 1 ? "Scheda di " + escapeHtml(h.name) : "I miei cavalli"}</button><button class="dr-chip" onclick="document.querySelector('[data-page=&quot;spese&quot;]').click()">Spese</button></div>` +
    (diarioVoci.length < 6 ? '<div class="eq-tit" style="margin-top:2px"><b>Da Equo</b><span>per iniziare</span></div><div class="eq-scroll">' + equoCardsHtml(7) + '</div>' : "") +
    (ric ? `<div class="dr-ricordo" style="background-image:url('${diarioFotoUrl(ric)}')" onclick="showPage('diario');setTimeout(()=>diarioDettaglio('${ric.id}'),350)"><div class="c"><small>Un anno fa</small><div class="t">${escapeHtml(ric.testo || "Un momento con " + h.name)}</div></div></div>` : "");
}
/* ---- contenuti Equo (quando il Diario è vuoto o quasi): ogni card apre una sezione ---- */
const EQUO_HERO = ["assets/equo/hero-1.jpg","assets/equo/hero-2.jpg","assets/equo/hero-3.jpg","assets/equo/hero-4.jpg"];
const EQUO_CARDS = [
  { img: "assets/equo/e-17.jpg", t: "Ogni giorno conta", d: "Una foto, una nota o un vocale: il Diario si costruisce un momento alla volta.", l: "Il Diario è la storia quotidiana del tuo cavallo: una foto dopo la passeggiata, una nota sull'allenamento, un vocale appena scendi di sella. Ogni momento resta legato al codice Equo del cavallo, per sempre. Non serve scrivere tanto: anche una riga basta.", bt: [["Scrivi il primo momento", "diarioApri('foto')"]] },
  { img: "assets/equo/e-13.jpg", t: "Un cavallo, un codice per sempre", d: "Vaccini, ferrature e visite restano nel suo storico, anche se cambia scuderia.", l: "Ogni cavallo ha il suo codice Equo. Vaccini, ferrature, visite e momenti restano nello storico del cavallo anche se cambia scuderia, maniscalco o proprietario. Conta solo il numero del codice, non le lettere.", bt: [["Apri la scheda del cavallo", "apriSchedaCavallo()"]] },
  { img: "assets/equo/e-18.jpg", t: "Il libretto sempre con te", d: "Registra vaccini e scadenze: Equo ti avvisa prima che scadano.", l: "Nella scheda del cavallo c'è il libretto sanitario: vaccini, Coggins, ferrature, sverminazioni. Aggiungi una data e Equo ti ricorda la prossima scadenza.", bt: [["Aggiungi un vaccino o una scadenza", "apriSchedaCavallo();setTimeout(openAddEventModal,600)"], ["Apri la scheda", "apriSchedaCavallo()"]] },
  { img: "assets/equo/e-14.jpg", t: "Il maniscalco su Equo", d: "Le ferrature registrate dal maniscalco arrivano nel libretto del cavallo.", l: "Se il tuo maniscalco usa Equo, le ferrature che registra compaiono nel libretto del tuo cavallo, con data e prossima scadenza. Puoi scrivergli direttamente dalla Chat.", bt: [["Vai alla Chat", "showPage('chat')"]] },
  { img: "assets/equo/e-19.jpg", t: "Porta la tua scuderia su Equo", d: "Lezioni, box e messaggi in un posto solo.", l: "Se la tua scuderia o il tuo centro ippico usa Equo Scuderia, collega il cavallo con il codice che ti dà il centro: prenoti le lezioni dall'app e ricevi i messaggi della scuderia.", bt: [["Collega la scuderia con un codice", "openModal('modal-join-stable')"]] },
  { img: "assets/equo/e-15.jpg", t: "Giorni di fila", d: "Scrivi un momento ogni giorno e guarda crescere la serie.", l: "Ogni giorno in cui scrivi almeno un momento aggiunge un giorno alla tua serie. Anche una riga basta: tocca «Giorni di fila» nel Diario per vedere gli ultimi 14 giorni.", bt: [["Scrivi un momento oggi", "diarioApri('foto')"], ["Vedi i tuoi giorni", "showPage('diario');setTimeout(()=>diarioInfo('streak'),400)"]] },
  { img: "assets/equo/e-16.jpg", t: "Il filmato del mese", d: "Con Premium, a fine mese Equo monta i tuoi momenti migliori.", l: "Con Premium puoi aggiungere anche i video e, a fine mese, Equo monta i tuoi momenti migliori in un filmato da condividere con la cornice Equo. Foto, note e vocali restano liberi per tutti.", bt: [["Scopri Premium", "isPremium() ? showToast('Hai già Premium: il filmato arriva presto') : togglePiano()"]] }
];
function equoCardsHtml(n){
  return EQUO_CARDS.slice(0, n).map((c, i) => `<div class="eq-card" onclick="equoApri(${i})"><div class="im" style="background-image:url('${c.img}')"><span class="bd">Da Equo</span></div><div class="tx"><b>${c.t}</b><p>${c.d}</p><span class="eq-vai">Scopri ›</span></div></div>`).join("");
}
function equoApri(i){
  const c = EQUO_CARDS[i]; if(!c) return;
  diarioSheet(c.t, `<div class="eq-card" style="margin:0 0 12px"><div class="im" style="background-image:url('${c.img}')"><span class="bd">Da Equo</span></div></div><div style="font-size:14.5px;line-height:1.55;margin-bottom:14px">${c.l}</div>` + c.bt.map((b, j) => `<button class="btn ${j ? "btn-outline" : "btn-primary"}" style="width:100%;margin-bottom:8px" onclick="closeModal('modal-dr-sheet');${b[1].replace(/"/g, "&quot;")}">${b[0]}</button>`).join("") + `<button class="btn btn-outline" style="width:100%" onclick="closeModal('modal-dr-sheet')">Chiudi</button>`);
}
