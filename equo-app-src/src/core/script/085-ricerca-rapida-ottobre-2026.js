/* ---------- RICERCA RAPIDA (ottobre 2026) ----------
   1) Barre di ricerca sugli elenchi: compaiono quando l'elenco ha almeno CERCA_MIN elementi,
      filtrano mentre si scrive, ignorano maiuscole e accenti, funzionano anche offline
      (filtrano solo quello che è già sul telefono). Gli elenchi si ridisegnano da soli:
      un osservatore riapplica il filtro dopo ogni aggiornamento.
   2) Scelta del cliente nell'appuntamento: campo "cerca cliente o cavallo".
   3) Lente: ricerca unica (Home e barra in alto) su cavalli, clienti, appuntamenti, spese, chat e sezioni. */
const CERCA_MIN = 6;
function cercaNorm(t){ return String(t ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim(); }
function cercaParole(q){ return cercaNorm(q).split(" ").filter(Boolean); }
function cercaCorrisponde(parole, testo){ const t = cercaNorm(testo); return parole.every(p => t.includes(p)); }
const CERCA_LENTE_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.6-3.6"/></svg>';

const cercaFiltri = {};
function cercaFiltro(cfg){
  if(cercaFiltri[cfg.id]) return cercaFiltri[cfg.id];
  const rif = document.getElementById(cfg.prima);
  if(!rif) return null;
  const barra = document.createElement("div");
  barra.className = "cerca-barra";
  barra.id = "cerca-" + cfg.id;
  barra.innerHTML = `<span class="cerca-lente">${CERCA_LENTE_SVG}</span><input class="input cerca-input" type="search" autocomplete="off" autocorrect="off" spellcheck="false" enterkeyhint="search" aria-label="${escapeHtml(cfg.placeholder)}" placeholder="${escapeHtml(cfg.placeholder)}"><button type="button" class="cerca-x" aria-label="Cancella la ricerca">×</button>`;
  rif.parentNode.insertBefore(barra, rif);
  const vuoto = document.createElement("div");
  vuoto.className = "cerca-vuoto";
  const inp = barra.querySelector("input");
  const boxes = cfg.boxes.map(id => document.getElementById(id)).filter(Boolean);
  // il messaggio "nessun risultato" va dopo l'ultimo elenco (o dopo il suo contenitore)
  const ultimo = boxes[boxes.length - 1];
  const dopo = (cfg.contenitori && cfg.contenitori[cfg.boxes[cfg.boxes.length - 1]] && document.getElementById(cfg.contenitori[cfg.boxes[cfg.boxes.length - 1]])) || ultimo;
  if(cfg.vuotoSopra) barra.after(vuoto); else dopo.after(vuoto);
  const f = { cfg, barra, inp, boxes, vuoto };
  f.applica = () => {
    const parole = cercaParole(inp.value);
    let totale = 0, visibili = 0;
    boxes.forEach(box => {
      let gruppoVisibile = true, ultimoItem = null, testa = null, visibiliBox = 0;
      const figli = [...box.children];
      const teste = [];
      figli.forEach(el => {
        if(el.classList.contains("cerca-ignora")) return;
        if(cfg.testa && el.matches(cfg.testa)){
          testa = { el, visibili: 0 }; teste.push(testa); ultimoItem = null;
          return;
        }
        if(el.matches(cfg.item)){
          totale++;
          const ok = !parole.length || cercaCorrisponde(parole, el.textContent + " " + (el.dataset.cerca || ""));
          el.classList.toggle("cerca-nascosto", !ok);
          if(ok){ visibili++; visibiliBox++; if(testa) testa.visibili++; }
          ultimoItem = ok;
          return;
        }
        // elementi accessori (es. invito sotto un cliente, testo "nessun..."): seguono l'elemento prima di loro
        const nascondi = parole.length && (ultimoItem === null ? !!testa : !ultimoItem);
        el.classList.toggle("cerca-nascosto", !!nascondi && !el.classList.contains("hp-filtri"));
      });
      teste.forEach(t => t.el.classList.toggle("cerca-nascosto", !!parole.length && t.visibili === 0));
      if(cfg.contenitori && cfg.contenitori[box.id]){
        const c = document.getElementById(cfg.contenitori[box.id]);
        if(c) c.classList.toggle("cerca-nascosto", !!parole.length && visibiliBox === 0);
      }
    });
    const mostra = totale >= (cfg.min ?? CERCA_MIN) || !!parole.length;
    barra.classList.toggle("on", mostra);
    barra.classList.toggle("piena", !!inp.value);
    vuoto.classList.toggle("on", !!parole.length && visibili === 0);
    vuoto.textContent = parole.length ? `Nessun risultato per «${inp.value.trim()}»` : "";
  };
  inp.addEventListener("input", f.applica);
  inp.addEventListener("keydown", e => { if(e.key === "Enter") inp.blur(); if(e.key === "Escape"){ inp.value = ""; f.applica(); } });
  barra.querySelector(".cerca-x").addEventListener("click", () => { inp.value = ""; f.applica(); inp.focus(); });
  const oss = new MutationObserver(() => f.applica());
  boxes.forEach(b => oss.observe(b, { childList: true }));
  cercaFiltri[cfg.id] = f;
  f.applica();
  return f;
}
// svuota la ricerca di un elenco (es. quando si apre un altro cavallo)
function cercaAzzera(id){ const f = cercaFiltri[id]; if(f && f.inp.value){ f.inp.value = ""; f.applica(); } }

function cercaInitElenchi(){
  // Professionista
  cercaFiltro({ id: "clienti", prima: "clienti-list", boxes: ["clienti-list"], item: ".cli-riga", testa: ".cli-lettera", min: 0, placeholder: "Cerca cavallo, cliente o microchip" });
  cercaFiltro({ id: "incassi", prima: "incassi-da-saldare-list", boxes: ["incassi-da-saldare-list"], item: ".inc-voce", testa: ".inc-gruppo", placeholder: "Cerca cliente o cavallo" });
  cercaFiltro({ id: "inbox", prima: "inbox-card", boxes: ["inbox-list", "inbox-strutture-list", "colleghi-list"], item: ".inbox-item", vuotoSopra: true,
    contenitori: { "inbox-list": "inbox-card", "inbox-strutture-list": "inbox-strutture-wrap" }, placeholder: "Cerca una conversazione" });
  // Proprietario
  cercaFiltro({ id: "eventi", prima: "horse-events-list", boxes: ["horse-events-list"], item: ".event-item", placeholder: "Cerca nel libretto: vaccino, ferratura, note…" });
  cercaFiltro({ id: "spese", prima: "expenses-list", boxes: ["expenses-list"], item: ".event-item", placeholder: "Cerca spesa: fieno, maniscalco, cavallo…" });
  cercaFiltro({ id: "cavalli", prima: "horses-list", boxes: ["horses-list"], item: ".horse-card", placeholder: "Cerca cavallo, razza o microchip" });
}

