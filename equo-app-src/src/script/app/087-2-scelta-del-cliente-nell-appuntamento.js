/* ---------- 2) Scelta del cliente nell'appuntamento ---------- */
function cercaClienteIntervento(){
  const sel = document.getElementById("intervento-cliente-select");
  const grp = document.getElementById("intervento-cliente-group");
  if(!sel || !grp) return;
  let wrap = document.getElementById("int-cerca-wrap");
  if(!wrap){
    wrap = document.createElement("div");
    wrap.id = "int-cerca-wrap";
    wrap.className = "rz-wrap int-cerca";
    wrap.innerHTML = `<span class="cerca-lente">${CERCA_LENTE_SVG}</span><input class="input cerca-input" id="int-cerca-input" type="search" autocomplete="off" autocorrect="off" spellcheck="false" placeholder="Cerca cliente o cavallo…" aria-label="Cerca cliente o cavallo"><div class="rz-lista" id="int-cerca-lista"></div>`;
    sel.parentNode.insertBefore(wrap, sel);
    const inp = wrap.querySelector("input"), lista = wrap.querySelector(".rz-lista");
    const mostra = () => {
      const parole = cercaParole(inp.value);
      if(!parole.length){ lista.classList.remove("aperta"); lista.innerHTML = ""; return; }
      const righe = [];
      clientiAttivi().forEach(c => {
        const cavalli = nomiCavalliCliente(c);
        if(cercaCorrisponde(parole, c.nome + " " + (c.telefono || ""))) righe.push({ c, cav: null, p: cercaNorm(c.nome).startsWith(parole[0]) ? 0 : 1 });
        cavalli.forEach(n => { if(cercaCorrisponde(parole, n + " " + c.nome)) righe.push({ c, cav: n, p: cercaNorm(n).startsWith(parole[0]) ? 0 : 2 }); });
      });
      const unici = []; const visti = new Set();
      righe.sort((a, b) => a.p - b.p || (a.cav || a.c.nome).localeCompare(b.cav || b.c.nome, "it")).forEach(r => { const k = r.c.id + "|" + (r.cav || ""); if(!visti.has(k)){ visti.add(k); unici.push(r); } });
      lista.innerHTML = unici.slice(0, 10).map(r => r.cav
        ? `<button type="button" data-id="${escapeHtml(r.c.id)}" data-cav="${escapeHtml(r.cav)}"><span><b>${escapeHtml(r.cav)}</b> <span class="muted">· ${escapeHtml(r.c.nome)}</span></span><small>Cavallo</small></button>`
        : `<button type="button" data-id="${escapeHtml(r.c.id)}"><span><b>${escapeHtml(r.c.nome)}</b></span><small>${isStruttura(r.c) ? "Scuderia" : "Cliente"}</small></button>`).join("")
        || `<div class="rz-vuoto">Nessun cliente con «${escapeHtml(inp.value.trim())}»</div><button type="button" data-nuovo="1"><span>+ Nuovo cliente</span></button>`;
      lista.classList.add("aperta");
    };
    inp.addEventListener("input", mostra);
    inp.addEventListener("focus", mostra);
    lista.addEventListener("mousedown", e => e.preventDefault());
    lista.addEventListener("click", async e => {
      const b = e.target.closest("button"); if(!b) return;
      lista.classList.remove("aperta");
      if(b.dataset.nuovo){
        const nome = inp.value.trim();
        sel.value = "__nuovo__"; inp.value = "";
        await onInterventoClienteChange();
        const campo = document.getElementById("intervento-nuovo-cliente-nome");
        if(campo && nome && !campo.value) campo.value = nome;
        return;
      }
      const c = clientiMascalcia.find(x => x.id === b.dataset.id);
      if(!c) return;
      sel.value = c.id;
      inp.value = b.dataset.cav ? b.dataset.cav + " · " + c.nome : c.nome;
      await onInterventoClienteChange();
      // scelto un cavallo: lo preseleziono nel menu dei cavalli
      if(b.dataset.cav) selezionaCavalloIntervento(b.dataset.cav);
    });
    inp.addEventListener("blur", () => setTimeout(() => lista.classList.remove("aperta"), 150));
  }
  const inp = document.getElementById("int-cerca-input");
  inp.value = "";
  document.getElementById("int-cerca-lista").classList.remove("aperta");
  // solo per i nuovi appuntamenti e quando i clienti sono tanti
  wrap.style.display = !sel.disabled && clientiAttivi().length >= CERCA_MIN ? "block" : "none";
}

