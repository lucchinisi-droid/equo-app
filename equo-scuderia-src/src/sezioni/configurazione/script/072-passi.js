/* =====================================================================
   CONFIGURAZIONE GUIDATA · I MODULI DENTRO I PASSI (blocco B2, 10/11/2026 · SQL 59)
   Ogni passo scrive con le stesse funzioni dei moduli del gestionale (nessun archivio parallelo):
     1 maniscalco  → scuderia_usa_codice_invito / scuderia_aggiungi_maniscalco (SQL 51-53: niente scuderie doppie)
     2 anagrafica  → centri (+ email, forma giuridica, logo: SQL 59; logo nel bucket cavalli-foto del centro)
     3 ASD         → incassi_impostazioni + asd_salva_dati
     4 staff       → codice del centro da condividere (nessun invio automatico)
     5 box/paddock → scuderia_box (solo i numeri che mancano) e scuderia_paddock
     6 cavallo     → prima equo_cerca_cavallo_conf (microchip/codice), poi scuderia_cavalli solo se assente
     7 proprietario→ salva_cliente + collegamento al cavallo (niente doppioni per nome)
     8 lezione     → scuderia_lezioni (solo lezioni vere) · 9 incasso → incassi_registra_pagamento (solo incassi veri)
   Ogni modulo ha: html() da mostrare, vuoto() se l'utente non ha scritto nulla, salva() → { ok, testo | errore }.
   ===================================================================== */
const confV = id => (document.getElementById(id)?.value || "").trim();
const confNorma = s => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const confOggi = () => new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Rome" });
const confCampo = (id, etichetta, attr, facolt) => `<label class="conf-campo" for="${id}">${etichetta}${facolt ? ' <span class="conf-facolt">facoltativo</span>' : ""}<input class="input" id="${id}" ${attr || ""}></label>`;
const confEsc = s => escapeHtml(s == null ? "" : String(s));
const confClienti = () => (typeof teamList !== "undefined" ? teamList : []).filter(m => ["allievo", "proprietario"].includes(m.ruolo) && !m.provvisorio_nascosto);
const confStaff = () => (typeof teamList !== "undefined" ? teamList : []).filter(m => !["allievo", "proprietario"].includes(m.ruolo));
const confNomeMembro = m => m.nome_visualizzato || m.nome || "—";
const confCavalli = () => (typeof cavalliList !== "undefined" ? cavalliList : []).filter(c => !c.uscito_il);
let confCavalloRicerca = null;   // esito dell'ultima ricerca del passo 6
let confLogoFile = null;

const CONF_FORM = {
  // ---------- 1 · maniscalco ----------
  1: {
    html: () => `<div class="conf-riquadro"><h3>Codice del maniscalco <span class="conf-facolt">facoltativo</span></h3>
      <p>Scrivi il codice che ti ha dato (o incolla il link dell'invito). Se la scuderia è già nella sua rubrica la colleghiamo a quella, senza doppioni.</p>
      ${confCampo("conf-codice-pro", "Codice o link", 'autocomplete="off" placeholder="es. EQUOPRO1A2B3C" style="text-transform:uppercase"')}
      <p class="conf-nota">Veterinario: prossimamente.</p></div>`,
    vuoto: () => !confV("conf-codice-pro"),
    salva: async () => {
      const codice = typeof codiceDaTestoScud === "function" ? codiceDaTestoScud(confV("conf-codice-pro")) : confV("conf-codice-pro").toUpperCase();
      if(DEMO_MODE) return { ok: true, testo: "Maniscalco collegato (demo: non salvato)." };
      if(/^EQUO(PRO|TRA|MED|OWN)/.test(codice)){
        const { data, error } = await sb.rpc("scuderia_aggiungi_maniscalco", { p_centro_id: currentCentro.id, p_codice: codice, p_cavalli: null });
        if(error || !data?.ok) return { ok: false, errore: data?.errore || "Non è stato possibile inviare l'invito. Riprova." };
        return { ok: true, testo: data.gia ? `${data.nome} è già collegato o c'è già una richiesta in corso.` : `Invito inviato a ${data.nome}: appena accetta i suoi cavalli ti arrivano da confermare.` };
      }
      if(typeof usaCodiceInvitoScud !== "function") return { ok: false, errore: "Funzione non disponibile: riprova da Professionisti." };
      const r = await usaCodiceInvitoScud(codice);
      return r.ok ? { ok: true, testo: r.testo } : { ok: false, errore: r.errore };
    },
  },
  // ---------- 2 · anagrafica ----------
  2: {
    html: () => {
      const c = confDati?.centro || currentCentro || {};
      const forme = { "": "—", asd: "ASD", ssd: "SSD", ditta_individuale: "Ditta individuale", societa_agricola: "Società agricola", snc: "S.n.c.", sas: "S.a.s.", srl: "S.r.l.", srls: "S.r.l.s.", spa: "S.p.A.", associazione: "Associazione", altro: "Altro" };
      return `<div class="conf-riquadro"><h3>Dati della struttura</h3>
        <div class="conf-griglia">
          ${confCampo("conf-c-nome", "Nome *", `value="${confEsc(c.nome)}" maxlength="80"`)}
          ${confCampo("conf-c-telefono", "Telefono", `value="${confEsc(c.telefono)}" inputmode="tel"`)}
          ${confCampo("conf-c-indirizzo", "Indirizzo", `value="${confEsc(c.indirizzo)}"`)}
          ${confCampo("conf-c-citta", "Città", `value="${confEsc(c.citta)}"`)}
          ${confCampo("conf-c-provincia", "Provincia", `value="${confEsc(c.provincia)}" maxlength="2" style="text-transform:uppercase"`)}
          ${confCampo("conf-c-email", "Email", `value="${confEsc(c.email)}" type="email"`, true)}
          <label class="conf-campo" for="conf-c-forma">Forma giuridica <span class="conf-facolt">facoltativo</span>
            <select class="input" id="conf-c-forma">${Object.entries(forme).map(([k, n]) => `<option value="${k}"${(c.forma_giuridica || "") === k ? " selected" : ""}>${n}</option>`).join("")}</select></label>
          <label class="conf-campo" for="conf-c-logo">Logo <span class="conf-facolt">facoltativo</span>
            <input class="input" id="conf-c-logo" type="file" accept="image/png,image/jpeg,image/webp" onchange="confLogoScelto(this)"></label>
        </div>
        <div id="conf-logo-anteprima" class="conf-logo-ant">${c.logo_url ? `<img src="${confEsc(c.logo_url)}" alt="Logo attuale">` : ""}</div>
        <p class="conf-nota">Il logo compare nell'intestazione del gestionale, nei PDF e nelle ricevute ASD.</p></div>`;
    },
    vuoto: () => {
      const c = confDati?.centro || currentCentro || {};
      const pari = (id, v) => confV(id) === String(v || "");
      return !confLogoFile && pari("conf-c-nome", c.nome) && pari("conf-c-telefono", c.telefono) && pari("conf-c-indirizzo", c.indirizzo) && pari("conf-c-citta", c.citta)
        && confV("conf-c-provincia").toUpperCase() === String(c.provincia || "").toUpperCase() && pari("conf-c-email", c.email) && confV("conf-c-forma") === String(c.forma_giuridica || "");
    },
    salva: async () => {
      const p = { nome: confV("conf-c-nome"), telefono: confV("conf-c-telefono") || null, indirizzo: confV("conf-c-indirizzo") || null,
        citta: confV("conf-c-citta") || null, provincia: confV("conf-c-provincia").toUpperCase() || null };
      if(!p.nome) return { ok: false, errore: "Il nome della struttura è obbligatorio." };
      const extra = { email: confV("conf-c-email") || null, forma_giuridica: confV("conf-c-forma") || null };
      if(extra.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(extra.email)) return { ok: false, errore: "Controlla l'email." };
      if(DEMO_MODE){ Object.assign(currentCentro, p, extra); return { ok: true, testo: "Dati salvati (demo: non salvato)." }; }
      const r1 = await sb.from("centri").update(p).eq("id", currentCentro.id);
      if(r1.error) return { ok: false, errore: r1.error.message || "Salvataggio non riuscito." };
      Object.assign(currentCentro, p);
      const r2 = await sb.from("centri").update(extra).eq("id", currentCentro.id);
      if(r2.error) return { ok: false, errore: /column|schema cache/.test(r2.error.message || "") ? "Email e forma giuridica richiedono un aggiornamento del database (SQL 59)." : r2.error.message };
      Object.assign(currentCentro, extra);
      if(confLogoFile){
        const ext = confLogoFile.type === "image/png" ? "png" : confLogoFile.type === "image/webp" ? "webp" : "jpg";
        const path = `${currentCentro.id}/logo-${Date.now()}.${ext}`;
        const up = await sb.storage.from("cavalli-foto").upload(path, confLogoFile, { contentType: confLogoFile.type, upsert: false });
        if(up.error) return { ok: false, errore: "Dati salvati, ma il logo non è stato caricato: " + up.error.message };
        const url = sb.storage.from("cavalli-foto").getPublicUrl(path).data.publicUrl;
        const r3 = await sb.from("centri").update({ logo_url: url }).eq("id", currentCentro.id);
        if(r3.error) return { ok: false, errore: "Dati salvati, ma il logo non è stato registrato: " + r3.error.message };
        currentCentro.logo_url = url; confLogoFile = null; logoCentroCarica(true);
      }
      ["sidebar-centro-name", "home-centro-name", "centro-view-nome"].forEach(id => { const el = document.getElementById(id); if(el) el.textContent = p.nome; });
      try{ if(typeof renderZonaCentro === "function") renderZonaCentro(); }catch(e){}
      return { ok: true, testo: "Dati della struttura salvati." };
    },
  },
  // ---------- 3 · ASD ----------
  3: {
    html: () => {
      const c = confDati?.centro || {};
      return `<div class="conf-riquadro"><h3>Associazione sportiva</h3>
        <label class="conf-check"><input type="checkbox" id="conf-asd-si" ${c.asd_attiva ? "checked" : ""} onchange="document.getElementById('conf-asd-campi').style.display=this.checked?'':'none'"> La struttura è (o ha) un'ASD / SSD con cassa separata</label>
        <div id="conf-asd-campi" class="conf-griglia" style="${c.asd_attiva ? "" : "display:none"}">
          ${confCampo("conf-asd-nome", "Denominazione *", `value="${confEsc(c.asd_nome)}"`)}
          ${confCampo("conf-asd-cf", "Codice fiscale", `value="${confEsc(c.asd_cf)}" style="text-transform:uppercase"`)}
          ${confCampo("conf-asd-sede", "Sede legale", `value="${confEsc(c.asd_sede)}"`, true)}
          ${confCampo("conf-asd-rasd", "Numero RASD", `value="${confEsc(c.asd_rasd)}"`, true)}
          ${confCampo("conf-asd-aff", "Affiliazioni (FISE, enti…)", `value="${confEsc(c.asd_affiliazioni)}"`, true)}
          ${confCampo("conf-asd-quota", "Quota associativa annuale (€)", `value="${confEsc(c.asd_quota_annuale)}" type="number" min="0" step="1"`, true)}
        </div></div>`;
    },
    vuoto: () => { const c = confDati?.centro || {}; return !!document.getElementById("conf-asd-si")?.checked === !!c.asd_attiva && (!c.asd_attiva || (confV("conf-asd-nome") === String(c.asd_nome || "") && confV("conf-asd-cf") === String(c.asd_cf || "") && confV("conf-asd-sede") === String(c.asd_sede || "") && confV("conf-asd-rasd") === String(c.asd_rasd || "") && confV("conf-asd-aff") === String(c.asd_affiliazioni || "") && confV("conf-asd-quota") === String(c.asd_quota_annuale ?? ""))); },
    salva: async () => {
      const si = !!document.getElementById("conf-asd-si")?.checked, c = confDati?.centro || {};
      const nome = confV("conf-asd-nome");
      if(si && !nome) return { ok: false, errore: "Scrivi la denominazione dell'ASD." };
      if(DEMO_MODE){ Object.assign(c, { asd_attiva: si, asd_nome: nome }); return { ok: true, testo: "ASD salvata (demo: non salvato)." }; }
      const r1 = await sb.rpc("incassi_impostazioni", { p_centro: currentCentro.id, p_asd_attiva: si, p_asd_nome: si ? nome : (c.asd_nome || null),
        p_lezioni_addebito: c.lezioni_addebito || "nessuno", p_cassa_lezioni: c.cassa_lezioni || "scuderia" });
      if(r1.error || r1.data?.ok === false) return { ok: false, errore: r1.data?.errore || r1.error?.message || "Salvataggio non riuscito." };
      if(si){
        const q = confV("conf-asd-quota");
        const r2 = await sb.rpc("asd_salva_dati", { p_centro: currentCentro.id, p_cf: confV("conf-asd-cf").toUpperCase() || null, p_sede: confV("conf-asd-sede") || null,
          p_rasd: confV("conf-asd-rasd") || null, p_affiliazioni: confV("conf-asd-aff") || null, p_quota: q === "" ? null : Number(q), p_mese: c.asd_mese_inizio || 1 });
        if(r2.error || r2.data?.ok === false) return { ok: false, errore: r2.data?.errore || r2.error?.message || "Dati ASD non salvati." };
      }
      return { ok: true, testo: si ? "Dati dell'ASD salvati." : "Segnato: niente ASD." };
    },
  },
  // ---------- 4 · collaboratori ----------
  4: {
    html: () => {
      const codice = currentCentro?.join_code || "—";
      const testo = `Ciao! Entra in ${currentCentro?.nome || "scuderia"} su Equo Scuderia (scuderia.equohub.com): registrati e usa il codice del centro ${codice}.`;
      const staff = confStaff();
      confTestoInvito = testo;
      return `<div class="conf-riquadro"><h3>Invita lo staff <span class="conf-facolt">facoltativo</span></h3>
        <p>Ogni collaboratore si registra e inserisce il codice del centro. Poi in Il tuo Centro scegli il suo livello.</p>
        <div class="join-code-box">${confEsc(codice)} <button type="button" class="btn btn-outline btn-sm" onclick="confCopia(currentCentro.join_code)">Copia</button></div>
        <div class="conf-bottoni-riga">
          <a class="btn btn-outline" href="https://wa.me/?text=${encodeURIComponent(testo)}" target="_blank" rel="noopener">WhatsApp</a>
          <a class="btn btn-outline" href="mailto:?subject=${encodeURIComponent("Invito su Equo Scuderia")}&body=${encodeURIComponent(testo)}">Email</a>
          <button type="button" class="btn btn-outline" onclick="confCopia(confTestoInvito)">Copia il messaggio</button>
        </div>
        ${staff.length ? `<p class="conf-nota">Nello staff: ${staff.map(m => confEsc(confNomeMembro(m))).join(", ")}.</p>` : ""}</div>`;
    },
    vuoto: () => true,
  },
  // ---------- 5 · box e paddock ----------
  5: {
    html: () => {
      const d = confDati || {};
      return `<div class="conf-riquadro"><h3>Box <span class="conf-facolt">facoltativo</span></h3>
        <div class="conf-griglia">
          ${confCampo("conf-box-n", "Quanti box in totale", `type="number" min="0" max="100" step="1" value="${d.box || ""}" placeholder="es. 12"`)}
        </div>
        <p class="conf-nota">Creo solo i box che mancano, numerati dall'1 in poi. Quelli che hai restano come sono${d.box ? ` (ora ne hai ${d.box})` : ""}.</p></div>
        <div class="conf-riquadro"><h3>Paddock <span class="conf-facolt">facoltativo</span></h3>
        <div id="conf-pad-righe">${[1, 2].map(i => confRigaPaddock(i)).join("")}</div>
        <div><button type="button" class="btn btn-ghost btn-sm" onclick="confAggiungiPaddock()">+ Aggiungi un paddock</button></div>
        <p class="conf-nota">Box e paddock insieme contano nel limite del pacchetto.${d.paddock ? ` Ora hai ${d.paddock} paddock.` : ""}</p></div>`;
    },
    vuoto: () => { const n = confV("conf-box-n"); return (n === "" || Number(n) <= (confDati?.box || 0)) && !confPaddockNuovi().length; },
    salva: async () => {
      const n = Math.floor(Number(confV("conf-box-n") || 0));
      if(n < 0 || n > 100) return { ok: false, errore: "Il numero di box va da 0 a 100." };
      const pad = confPaddockNuovi();
      if(pad.some(p => !(p.capienza >= 1 && p.capienza <= 60))) return { ok: false, errore: "La capienza di un paddock va da 1 a 60 cavalli." };
      if(DEMO_MODE){ return { ok: true, testo: "Box e paddock creati (demo: non salvato)." }; }
      let creati = 0;
      if(n > 0){
        const { data: esist } = await sb.from("scuderia_box").select("numero").eq("centro_id", currentCentro.id);
        const ci = new Set((esist || []).map(b => b.numero));
        const righe = []; for(let i = 1; i <= n; i++) if(!ci.has(i)) righe.push({ centro_id: currentCentro.id, numero: i });
        if(righe.length){
          const r = await sb.from("scuderia_box").upsert(righe, { onConflict: "centro_id,numero", ignoreDuplicates: true });
          if(r.error) return { ok: false, errore: /massimo|limite|pacchetto/i.test(r.error.message || "") ? r.error.message : "Box non creati: " + r.error.message };
          creati = righe.length;
        }
      }
      for(const p of pad){
        const r = await sb.from("scuderia_paddock").insert({ centro_id: currentCentro.id, nome: p.nome, capienza: p.capienza });
        if(r.error) return { ok: false, errore: (creati ? `${creati} box creati, ma ` : "") + "il paddock «" + p.nome + "» non è stato creato: " + r.error.message };
      }
      try{ if(typeof loadBox === "function") await loadBox(); }catch(e){}
      return { ok: true, testo: [creati ? `${creati} box creati` : "", pad.length ? `${pad.length} paddock creati` : ""].filter(Boolean).join(" e ") + "." };
    },
  },
  // ---------- 6 · primo cavallo ----------
  6: {
    html: () => `<div class="conf-riquadro"><h3>1 · Cerca prima il cavallo</h3>
        <p>Se ha già un microchip o un codice Equo controllo che non esista già: così non nascono doppioni.</p>
        <div class="conf-bottoni-riga">
          <input class="input" id="conf-cav-cerca" placeholder="Microchip o codice Equo" autocomplete="off" style="flex:1;min-width:180px" onkeydown="if(event.key==='Enter'){event.preventDefault();confCercaCavallo()}">
          <button type="button" class="btn btn-outline" onclick="confCercaCavallo()">Cerca</button>
        </div>
        <div id="conf-cav-esito" aria-live="polite"></div></div>
      <div class="conf-riquadro" id="conf-cav-nuovo"><h3>2 · Oppure inserisci un cavallo nuovo</h3>
        <div class="conf-griglia">
          ${confCampo("conf-cav-nome", "Nome *", 'maxlength="80"')}
          <label class="conf-campo" for="conf-cav-cat">Categoria<select class="input" id="conf-cav-cat"><option value="pensione">In pensione</option><option value="mezza_pensione">Mezza pensione</option><option value="proprieta">Di proprietà del centro</option><option value="soci">Di soci / istruttori</option></select></label>
          ${confCampo("conf-cav-razza", "Razza", "", true)}
          <label class="conf-campo" for="conf-cav-sesso">Sesso <span class="conf-facolt">facoltativo</span><select class="input" id="conf-cav-sesso"><option value="">—</option><option value="femmina">Femmina</option><option value="castrone">Castrone</option><option value="stallone">Stallone</option></select></label>
          ${confCampo("conf-cav-nascita", "Data di nascita", 'type="date"', true)}
          ${confCampo("conf-cav-chip", "Microchip", 'autocomplete="off"', true)}
          ${confCampo("conf-cav-prop", "Proprietario (nome e cognome)", "", true)}
        </div>
        <p class="conf-nota">Se il proprietario non è tra i clienti preparo la sua scheda, da completare nel passo 7.</p></div>`,
    vuoto: () => !confV("conf-cav-nome"),
    salva: async () => {
      if(confCavalloRicerca?.esito === "tuo" && !confV("conf-cav-nome")) return { ok: true, testo: "Il cavallo è già nella scuderia." };
      const nome = confV("conf-cav-nome").replace(/\s+/g, " ");
      if(!nome) return { ok: false, errore: "Scrivi il nome del cavallo." };
      const chip = confV("conf-cav-chip").replace(/[^0-9A-Za-z]/g, "").toUpperCase();
      if(confCavalli().some(c => confNorma(c.nome) === confNorma(nome)) && !confCavalloConfermaNome){
        confCavalloConfermaNome = true;
        return { ok: false, errore: `C'è già un cavallo «${nome}» nella scuderia. Se è un altro cavallo tocca di nuovo «Salva e continua».` };
      }
      if(chip.length >= 6 && !DEMO_MODE){
        const { data } = await sb.rpc("equo_cerca_cavallo_conf", { p_centro: currentCentro.id, p_testo: chip });
        if(data?.esito === "tuo") return { ok: false, errore: `Questo microchip è già di «${data.nome}» nella tua scuderia: niente doppione.` };
        if(data?.esito === "altrove") return { ok: false, errore: "Questo microchip esiste già su Equo: chiedi al proprietario di collegarsi con il codice del centro, così il cavallo arriva con il suo storico." };
      }
      const cat = confV("conf-cav-cat") || "pensione";
      const payload = { centro_id: currentCentro.id, nome, tipo_proprieta: cat, razza: confV("conf-cav-razza") || null, sesso: confV("conf-cav-sesso") || null,
        data_nascita: confV("conf-cav-nascita") || null, microchip: chip || null, proprietario: cat === "proprieta" ? null : (confV("conf-cav-prop") || null) };
      if(DEMO_MODE){ (demoState.cavalli = demoState.cavalli || []).push({ id: "dc" + Date.now(), ...payload }); return { ok: true, testo: `«${nome}» aggiunto (demo: non salvato).` }; }
      const r = await sb.from("scuderia_cavalli").insert(payload);
      if(r.error) return { ok: false, errore: /limite|massimo|pacchetto/i.test(r.error.message || "") ? "Hai raggiunto i cavalli del tuo pacchetto." : r.error.message };
      confCavalloConfermaNome = false;
      try{ if(typeof loadCavalli === "function") await loadCavalli(); if(typeof loadTeam === "function") await loadTeam(); }catch(e){}
      return { ok: true, testo: `«${nome}» aggiunto alla scuderia.` + (payload.proprietario ? " Se il proprietario era nuovo trovi la sua scheda in Clienti." : "") };
    },
  },
  // ---------- 7 · primo proprietario ----------
  7: {
    html: () => {
      const cav = confCavalli();
      return `<div class="conf-riquadro"><h3>Proprietario e cavallo</h3>
        <div class="conf-griglia">
          <label class="conf-campo" for="conf-pr-cav">Cavallo<select class="input" id="conf-pr-cav"><option value="">— scegli —</option>${cav.map(c => `<option value="${c.id}">${confEsc(c.nome)}${c.proprietario ? " · " + confEsc(c.proprietario) : ""}</option>`).join("")}</select></label>
          ${confCampo("conf-pr-nome", "Nome e cognome del proprietario *", 'oninput="confSimiliProprietario()"')}
          ${confCampo("conf-pr-tel", "Telefono", 'inputmode="tel"', true)}
          ${confCampo("conf-pr-email", "Email", 'type="email"', true)}
        </div>
        <div id="conf-pr-simili" aria-live="polite"></div>
        <p class="conf-nota">Se ha l'app Equo, dopo potrà collegarsi con il codice del centro e vedere lo stesso libretto.</p></div>`;
    },
    vuoto: () => !confV("conf-pr-nome") && !confV("conf-pr-esistente"),
    salva: async () => {
      const esistente = confV("conf-pr-esistente"), nome = confV("conf-pr-nome").replace(/\s+/g, " "), cavId = confV("conf-pr-cav");
      if(!esistente && !nome) return { ok: false, errore: "Scrivi il nome del proprietario." };
      if(!esistente && nome.split(" ").length < 2) return { ok: false, errore: "Scrivi nome e cognome." };
      if(DEMO_MODE) return { ok: true, testo: "Proprietario salvato (demo: non salvato)." };
      let membro = esistente, nomeFinale = nome;
      if(!membro){
        const { data, error } = await sb.rpc("salva_cliente", { p_centro: currentCentro.id, p_membro: null, p_ruolo: "proprietario", p_nome: nome,
          p_telefono: confV("conf-pr-tel") || null, p_email: confV("conf-pr-email") || null, p_data_nascita: null, p_referente: null, p_note: null, p_consenso: false });
        if(error) return { ok: false, errore: /clienti, il massimo/.test(error.message || "") ? "Hai raggiunto i clienti del tuo pacchetto." : error.message };
        membro = data;
      } else nomeFinale = confNomeMembro(confClienti().find(m => m.id === membro) || {});
      if(cavId){
        const r = await sb.from("scuderia_cavalli").update({ proprietario_membro_id: membro, proprietario: nomeFinale }).eq("id", cavId).eq("centro_id", currentCentro.id);
        if(r.error) return { ok: false, errore: "Proprietario salvato, ma non collegato al cavallo: " + r.error.message };
      }
      try{ if(typeof loadTeam === "function") await loadTeam(); if(typeof loadCavalli === "function") await loadCavalli(); }catch(e){}
      return { ok: true, testo: esistente ? "Cavallo collegato al proprietario." : "Proprietario salvato" + (cavId ? " e collegato al cavallo." : ".") + " Ricorda il consenso privacy nella sua scheda." };
    },
  },
  // ---------- 8 · prima lezione ----------
  8: {
    html: () => {
      const cli = confClienti(), cav = confCavalli(), staff = confStaff();
      return `<div class="conf-riquadro"><h3>Prima lezione</h3>
        <div class="conf-griglia">
          ${confCampo("conf-lz-data", "Data *", `type="date" min="${confOggi()}"`)}
          ${confCampo("conf-lz-ora", "Ora *", 'type="time" step="900"')}
          <label class="conf-campo" for="conf-lz-allievo">Allievo *<select class="input" id="conf-lz-allievo"><option value="">— scegli —</option>${cli.map(m => `<option value="${m.id}">${confEsc(confNomeMembro(m))}</option>`).join("")}</select></label>
          <label class="conf-campo" for="conf-lz-cav">Cavallo <span class="conf-facolt">facoltativo</span><select class="input" id="conf-lz-cav"><option value="">—</option>${cav.map(c => `<option value="${c.id}">${confEsc(c.nome)}</option>`).join("")}</select></label>
          <label class="conf-campo" for="conf-lz-ist">Istruttore <span class="conf-facolt">facoltativo</span><select class="input" id="conf-lz-ist"><option value="">—</option>${staff.map(m => `<option value="${m.id}">${confEsc(confNomeMembro(m))}</option>`).join("")}</select></label>
        </div>
        ${cli.length ? "" : '<p class="conf-nota">Non hai ancora allievi: aggiungili in Clienti, oppure salta questo passo.</p>'}
        <p class="conf-nota">Solo lezioni vere: se non fai lezioni tocca «Non applicabile».</p></div>`;
    },
    vuoto: () => !confV("conf-lz-data") && !confV("conf-lz-ora") && !confV("conf-lz-allievo"),
    salva: async () => {
      const data = confV("conf-lz-data"), ora = confV("conf-lz-ora"), allievo = confV("conf-lz-allievo");
      if(!data || !ora || !allievo) return { ok: false, errore: "Per la lezione servono data, ora e allievo." };
      if(data < confOggi()) return { ok: false, errore: "Scegli una data da oggi in poi." };
      const al = confClienti().find(m => m.id === allievo);
      const payload = { centro_id: currentCentro.id, data, ora_inizio: ora, allievo_id: allievo, allievo_nome: al ? confNomeMembro(al) : null,
        cavallo_id: confV("conf-lz-cav") || null, istruttore_id: confV("conf-lz-ist") || null, stato: "prenotata" };
      if(DEMO_MODE) return { ok: true, testo: "Lezione aggiunta (demo: non salvato)." };
      const r = await sb.from("scuderia_lezioni").insert(payload);
      if(r.error) return { ok: false, errore: r.error.message };
      try{ if(typeof loadLezioni === "function") await loadLezioni(); }catch(e){}
      return { ok: true, testo: "Lezione aggiunta al calendario." };
    },
  },
  // ---------- 9 · primo incasso ----------
  9: {
    html: () => {
      const cli = confClienti(), asd = !!confDati?.centro?.asd_attiva;
      return `<div class="conf-riquadro"><h3>Un incasso ricevuto</h3>
        <div class="conf-griglia">
          <label class="conf-campo" for="conf-in-cli">Da chi *<select class="input" id="conf-in-cli"><option value="">— scegli —</option>${cli.map(m => `<option value="${m.id}">${confEsc(confNomeMembro(m))}</option>`).join("")}</select></label>
          ${confCampo("conf-in-imp", "Importo (€) *", 'type="number" min="0.01" step="0.01" inputmode="decimal"')}
          <label class="conf-campo" for="conf-in-met">Metodo<select class="input" id="conf-in-met"><option value="contanti">Contanti</option><option value="bonifico">Bonifico</option><option value="pos">POS / carta</option><option value="assegno">Assegno</option><option value="altro">Altro</option></select></label>
          ${confCampo("conf-in-data", "Data *", `type="date" max="${confOggi()}" value="${confOggi()}"`)}
          ${asd ? `<label class="conf-campo" for="conf-in-cassa">Cassa<select class="input" id="conf-in-cassa"><option value="scuderia">Scuderia</option><option value="asd">ASD</option></select></label>` : ""}
          ${confCampo("conf-in-causale", "Causale *", 'placeholder="es. Pensione di novembre" maxlength="200"')}
        </div>
        <p class="conf-nota">Solo incassi veri: nessun importo di esempio. Se non hai ancora incassi, salta questo passo.</p></div>`;
    },
    vuoto: () => !confV("conf-in-cli") && !confV("conf-in-imp") && !confV("conf-in-causale"),
    salva: async () => {
      const membro = confV("conf-in-cli"), imp = Math.round(Number(confV("conf-in-imp")) * 100) / 100, data = confV("conf-in-data"), causale = confV("conf-in-causale");
      if(!membro || !(imp > 0) || !data || !causale) return { ok: false, errore: "Per l'incasso servono cliente, importo, data e causale." };
      if(data > confOggi()) return { ok: false, errore: "La data non può essere nel futuro." };
      if(DEMO_MODE) return { ok: true, testo: "Incasso registrato (demo: non salvato)." };
      const { data: r, error } = await sb.rpc("incassi_registra_pagamento", { p_centro: currentCentro.id, p_membro: membro, p_cassa: confV("conf-in-cassa") || "scuderia",
        p_importo: imp, p_metodo: confV("conf-in-met") || "contanti", p_data: data, p_addebito: null, p_conto: null, p_note: causale });
      if(error || r?.ok === false) return { ok: false, errore: r?.errore || error?.message || "Incasso non registrato." };
      return { ok: true, testo: "Incasso registrato: lo trovi in Incassi." };
    },
  },
};
let confCavalloConfermaNome = false;
let confTestoInvito = "";

function confRigaPaddock(i){
  return `<div class="conf-griglia conf-pad-riga">
    ${confCampo("conf-pad-nome-" + i, "Nome paddock", 'placeholder="es. Paddock ' + String.fromCharCode(64 + i) + '"')}
    ${confCampo("conf-pad-cap-" + i, "Capienza (cavalli)", 'type="number" min="1" max="60" step="1"')}
  </div>`;
}
function confAggiungiPaddock(){
  const box = document.getElementById("conf-pad-righe"); if(!box) return;
  const n = box.querySelectorAll(".conf-pad-riga").length + 1; if(n > 12) return;
  box.insertAdjacentHTML("beforeend", confRigaPaddock(n));
}
function confPaddockNuovi(){
  return [...document.querySelectorAll(".conf-pad-riga")].map((r, i) => ({ nome: confV("conf-pad-nome-" + (i + 1)), capienza: Math.floor(Number(confV("conf-pad-cap-" + (i + 1)))) }))
    .filter(p => p.nome);
}
function confLogoScelto(inp){
  const f = inp.files && inp.files[0]; confLogoFile = null;
  const ant = document.getElementById("conf-logo-anteprima");
  if(!f) return;
  if(!/^image\/(png|jpeg|webp)$/.test(f.type) || f.size > 2 * 1024 * 1024){ showToast("Il logo deve essere PNG, JPG o WEBP, al massimo 2 MB."); inp.value = ""; return; }
  confLogoFile = f;
  if(ant) ant.innerHTML = `<img src="${URL.createObjectURL(f)}" alt="Anteprima del logo">`;
}
async function confCercaCavallo(){
  const t = confV("conf-cav-cerca"), box = document.getElementById("conf-cav-esito"); if(!box) return;
  if(t.replace(/[^0-9A-Za-z]/g, "").length < 6){ box.innerHTML = '<p class="conf-nota">Scrivi almeno 6 caratteri del microchip o del codice.</p>'; return; }
  box.innerHTML = '<p class="conf-nota">Cerco…</p>';
  let r;
  if(DEMO_MODE){ const c = confCavalli().find(x => (x.microchip || "").replace(/[^0-9A-Za-z]/g, "").toUpperCase() === t.replace(/[^0-9A-Za-z]/g, "").toUpperCase()); r = c ? { esito: "tuo", nome: c.nome, proprietario: c.proprietario } : { esito: "nessuno" }; }
  else { const { data, error } = await sb.rpc("equo_cerca_cavallo_conf", { p_centro: currentCentro.id, p_testo: t }); r = error ? { esito: "errore", errore: /equo_cerca_cavallo_conf|schema cache/.test(error.message || "") ? "Manca un aggiornamento del database (SQL 59)." : error.message } : data; }
  confCavalloRicerca = r;
  if(r.esito === "tuo") box.innerHTML = `<div class="conf-gia">«${confEsc(r.nome)}» è già nella tua scuderia${r.proprietario ? " (di " + confEsc(r.proprietario) + ")" : ""}: non serve crearlo. Vai avanti.</div>`;
  else if(r.esito === "altrove") box.innerHTML = '<div class="conf-avviso">Questo cavallo esiste già su Equo, ma non nella tua scuderia. Per non creare un doppione chiedi al proprietario di collegarsi con il codice del centro: il cavallo arriverà con il suo storico.</div>';
  else if(r.esito === "nessuno"){ box.innerHTML = '<p class="conf-nota">Non c\'è su Equo: inseriscilo qui sotto.</p>'; const ch = document.getElementById("conf-cav-chip"); if(ch && !ch.value) ch.value = t; document.getElementById("conf-cav-nome")?.focus(); }
  else box.innerHTML = `<p class="conf-nota">${confEsc(r.errore || "Ricerca non riuscita, riprova.")}</p>`;
}
function confSimiliProprietario(){
  const box = document.getElementById("conf-pr-simili"); if(!box) return;
  const n = confNorma(confV("conf-pr-nome"));
  if(n.length < 3){ box.innerHTML = ""; return; }
  const simili = confClienti().filter(m => { const k = confNorma(confNomeMembro(m)); return k && (k === n || k.includes(n) || n.includes(k)); }).slice(0, 5);
  box.innerHTML = simili.length ? `<div class="conf-avviso"><b>Forse c'è già:</b>
    <select class="input" id="conf-pr-esistente" style="margin-top:6px"><option value="">No, è una persona nuova</option>${simili.map(m => `<option value="${m.id}">${confEsc(confNomeMembro(m))}</option>`).join("")}</select></div>` : "";
}
async function confCopia(t){
  try{ await navigator.clipboard.writeText(t); showToast("Copiato."); }catch(e){ showToast("Non riesco a copiare: tieni premuto per selezionare."); }
}

/* ---------- LOGO DEL CENTRO: intestazione del gestionale, PDF, ricevute ASD ---------- */
let logoCentroPdf = null;   // { data, w, h } in mm, già pronto per jsPDF (sincrono)
async function logoCentroCarica(forza){
  try{
    if(!currentCentro) return;
    if(!DEMO_MODE && (forza || currentCentro.logo_url === undefined)){
      const { data, error } = await sb.from("centri").select("logo_url").eq("id", currentCentro.id).maybeSingle();
      if(!error) currentCentro.logo_url = data?.logo_url || null;
    }
    const url = currentCentro.logo_url;
    const img = document.getElementById("sidebar-centro-logo");
    if(img){ if(url){ img.src = url; img.style.display = ""; } else img.style.display = "none"; }
    logoCentroPdf = null;
    if(!url) return;
    const el = new Image(); el.crossOrigin = "anonymous";
    await new Promise((ok, ko) => { el.onload = ok; el.onerror = ko; el.src = url; });
    const max = 400, sc = Math.min(1, max / Math.max(el.width, el.height));
    const cv = document.createElement("canvas"); cv.width = Math.round(el.width * sc); cv.height = Math.round(el.height * sc);
    cv.getContext("2d").drawImage(el, 0, 0, cv.width, cv.height);
    const r = cv.width / cv.height, h = r > 2 ? 28 / r : 14;   // al massimo 28 x 14 mm
    logoCentroPdf = { data: cv.toDataURL("image/png"), w: Math.min(28, 14 * r), h };
  }catch(e){ logoCentroPdf = null; }
}
// disegna il logo nel PDF, allineato a destra, se c'è (le funzioni dei PDF lo chiamano)
function logoCentroNelPdf(doc, destra, y){
  if(!logoCentroPdf) return;
  try{ doc.addImage(logoCentroPdf.data, "PNG", destra - logoCentroPdf.w, y, logoCentroPdf.w, logoCentroPdf.h); }catch(e){}
}
(function(){
  try{ const o = enterAppShell; enterAppShell = function(){ const r = o.apply(this, arguments); setTimeout(() => logoCentroCarica(), 1200); return r; }; }catch(e){}
})();
