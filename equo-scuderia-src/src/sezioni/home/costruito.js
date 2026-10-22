
// === GENERATO da equo-app-src/strumenti/costruisci-moduli.mjs: NON modificare qui, modificare equo-scuderia-src/src/sezioni/home/moduli/ ===
(function() {
	// equo-scuderia-src/src/sezioni/home/moduli/048-contatori-a-semaforo-nel-menu-verde-0-tu.js
	function impostaContatoreNav(id, valore, colore) {
		const el = document.getElementById(id);
		if (!el) return;
		el.textContent = valore > 99 ? "99+" : String(valore);
		el.classList.remove("sem-verde", "sem-giallo", "sem-rosso");
		el.classList.add("sem-" + colore);
	}
	function aggiornaContatoriNav() {
		if (typeof currentCentro === "undefined" || !currentCentro) return;
		const oggi = oggiLocaleIso();
		const aperte = (l) => !["annullata", "completata"].includes(l.stato);
		const diOggi = (lezioniList || []).filter((l) => l.data === oggi && aperte(l));
		const passateAperte = (lezioniList || []).filter((l) => l.data < oggi && aperte(l));
		impostaContatoreNav("lezioni-nav-badge", diOggi.length + passateAperte.length, passateAperte.length ? "rosso" : diOggi.some((l) => l.stato === "prenotata") ? "giallo" : "verde");
		const statiPac = (pacchettiList || []).map(statusPacchetto);
		const pacRossi = statiPac.filter((x) => x === "red").length, pacGialli = statiPac.filter((x) => x === "yellow").length;
		impostaContatoreNav("pacchetti-nav-badge", pacRossi + pacGialli, pacRossi ? "rosso" : pacGialli ? "giallo" : "verde");
		let cavRossi = 0, cavGialli = 0;
		(cavalliList || []).forEach((c) => {
			const w = pallinoCavallo(c.id).col;
			if (w === "rosso") cavRossi++;
			else if (w === "ocra") cavGialli++;
		});
		impostaContatoreNav("cavalli-nav-badge", cavRossi + cavGialli, cavRossi ? "rosso" : cavGialli ? "giallo" : "verde");
	}
	var contatoriNavTimer = null;
	async function ricaricaContatoriNav() {
		if (!currentCentro) return;
		await Promise.all([
			cavalliList.length === 0 ? loadCavalli() : Promise.resolve(),
			loadEventiAll(),
			loadLezioni(),
			loadPacchetti(),
			loadMagazzino().catch((e) => console.error("magazzino:", e))
		]);
		aggiornaContatoriNav();
	}
	function startContatoriNav() {
		clearInterval(contatoriNavTimer);
		ricaricaContatoriNav();
		contatoriNavTimer = setInterval(ricaricaContatoriNav, 3e5);
	}
	document.addEventListener("visibilitychange", () => {
		if (document.visibilityState === "visible" && currentCentro) ricaricaContatoriNav();
	});
	// equo-scuderia-src/src/sezioni/home/moduli/053-drag-drop-post-it-mouse-e-touch.js
	var notaDragState = null;
	function onPostitPointerDown(e) {
		if (e.target.closest(".close-x")) return;
		const el = e.currentTarget;
		notaDragState = {
			id: el.dataset.id,
			el,
			overId: null,
			moved: false,
			startX: e.clientX,
			startY: e.clientY
		};
		el.setPointerCapture(e.pointerId);
		el.classList.add("dragging");
		el.style.zIndex = "50";
		el.style.pointerEvents = "none";
		el.addEventListener("pointermove", onPostitPointerMove);
		el.addEventListener("pointerup", onPostitPointerUp);
		el.addEventListener("pointercancel", onPostitPointerUp);
	}
	function onPostitPointerMove(e) {
		if (!notaDragState) return;
		notaDragState.moved = true;
		const dx = e.clientX - notaDragState.startX;
		const dy = e.clientY - notaDragState.startY;
		notaDragState.el.style.transform = `translate(${dx}px, ${dy}px)`;
		const target = document.elementFromPoint(e.clientX, e.clientY);
		const postitEl = target ? target.closest(".postit") : null;
		document.querySelectorAll(".postit.drag-over").forEach((p) => p.classList.remove("drag-over"));
		if (postitEl && postitEl.dataset.id !== notaDragState.id) {
			postitEl.classList.add("drag-over");
			notaDragState.overId = postitEl.dataset.id;
		} else notaDragState.overId = null;
	}
	async function onPostitPointerUp() {
		if (!notaDragState) return;
		const { id, el, overId, moved } = notaDragState;
		el.removeEventListener("pointermove", onPostitPointerMove);
		el.removeEventListener("pointerup", onPostitPointerUp);
		el.removeEventListener("pointercancel", onPostitPointerUp);
		el.classList.remove("dragging");
		el.style.transform = "";
		el.style.zIndex = "";
		el.style.pointerEvents = "";
		document.querySelectorAll(".postit.drag-over").forEach((p) => p.classList.remove("drag-over"));
		notaDragState = null;
		if (!moved || !overId || overId === id) return;
		const fromIdx = noteList.findIndex((n) => n.id === id);
		const toIdx = noteList.findIndex((n) => n.id === overId);
		if (fromIdx === -1 || toIdx === -1) return;
		const [moved_] = noteList.splice(fromIdx, 1);
		noteList.splice(toIdx, 0, moved_);
		renderNote();
		await persistNoteOrder();
	}
	async function persistNoteOrder() {
		noteList.forEach((n, idx) => {
			n.ordine = idx;
		});
		if (DEMO_MODE) {
			demoState.note = noteList;
			return;
		}
		await Promise.all(noteList.map((n, idx) => sb.from("scuderia_note").update({ ordine: idx }).eq("id", n.id)));
	}
	function openNotaForm() {
		document.getElementById("nota-error").style.display = "none";
		document.getElementById("nota-testo").value = "";
		selectNotaColore("giallo");
		openModal("modal-nota");
	}
	function selectNotaColore(colore) {
		notaColoreSelezionato = colore;
		document.querySelectorAll(".color-swatch").forEach((s) => s.classList.toggle("selected", s.dataset.colore === colore));
	}
	async function saveNota() {
		const testo = document.getElementById("nota-testo").value.trim();
		const errBox = document.getElementById("nota-error");
		errBox.style.display = "none";
		if (!testo) {
			errBox.textContent = "Scrivi un promemoria prima di salvare.";
			errBox.style.display = "block";
			return;
		}
		try {
			const nextOrdine = noteList.length;
			if (DEMO_MODE) demoState.note.push({
				id: "n" + (demoIdCounter++ + 500),
				centro_id: demoState.centro.id,
				testo,
				colore: notaColoreSelezionato,
				created_at: (/* @__PURE__ */ new Date()).toISOString(),
				ordine: nextOrdine
			});
			else {
				const { error } = await sb.from("scuderia_note").insert({
					centro_id: currentCentro.id,
					testo,
					colore: notaColoreSelezionato,
					ordine: nextOrdine
				});
				if (error) throw error;
			}
			await loadNote();
			renderNote();
			closeModal("modal-nota");
			showToast("Post-it aggiunto.");
		} catch (err) {
			errBox.textContent = err.message || "Errore nel salvataggio.";
			errBox.style.display = "block";
		}
	}
	async function deleteNota(id) {
		if (DEMO_MODE) demoState.note = demoState.note.filter((n) => n.id !== id);
		else {
			const { error } = await sb.from("scuderia_note").delete().eq("id", id);
			if (error) {
				showToast("Errore nell'eliminazione.");
				return;
			}
		}
		await loadNote();
		renderNote();
	}
	function renderHomeStats() {
		const oggi = isoLoc(/* @__PURE__ */ new Date());
		let scadRosse = 0, scadGialle = 0;
		cavalliList.forEach((c) => {
			const s = worstStatus(c.id);
			if (s === "red") scadRosse++;
			else if (s === "yellow") scadGialle++;
		});
		const in7gg = /* @__PURE__ */ new Date();
		in7gg.setDate(in7gg.getDate() + 7);
		const in7ggIso = isoLoc(in7gg);
		const lezioniProssime = lezioniList.filter((l) => l.data >= oggi && l.data <= in7ggIso && l.stato !== "annullata").length;
		const pacchettiCritici = pacchettiList.filter((p) => ["red", "yellow"].includes(statusPacchetto(p))).length;
		const tiles = [
			{
				label: "Scadenze sanitarie urgenti",
				value: scadRosse + scadGialle,
				icon: "fa-heart-pulse",
				tone: scadRosse > 0 ? "red" : scadGialle > 0 ? "yellow" : "green",
				type: "sanitarie"
			},
			{
				label: "Lezioni nei prossimi 7 giorni",
				value: lezioniProssime,
				icon: "fa-calendar-days",
				tone: "green",
				type: "lezioni"
			},
			{
				label: "Pacchetti da rinnovare",
				value: pacchettiCritici,
				icon: "fa-ticket",
				tone: pacchettiCritici > 0 ? "yellow" : "green",
				type: "pacchetti"
			}
		];
		document.getElementById("home-stats").innerHTML = tiles.map((t) => `
    <div class="stat-tile stat-tile-clickable" onclick="openHomeDetail('${t.type}')">
      <div class="label"><i class="fa-solid ${t.icon}" style="margin-right:6px"></i>${t.label}</div>
      <div class="value" style="color:${t.tone === "red" ? "var(--danger)" : t.tone === "yellow" ? "#8a6a12" : "var(--text)"}">${t.value}</div>
    </div>`).join("");
	}
	function openHomeDetail(type) {
		const titleEl = document.getElementById("home-detail-title");
		const listEl = document.getElementById("home-detail-list");
		const gotoBtn = document.getElementById("home-detail-goto");
		let rows = [];
		if (type === "sanitarie") {
			titleEl.textContent = "Scadenze sanitarie urgenti";
			cavalliList.forEach((c) => {
				const scad = scadenzarioFor(c.id);
				TIPO_ORDER.forEach((tipo) => {
					const s = scad[tipo];
					if (s.status === "red" || s.status === "yellow") rows.push({
						main: `${c.nome} — ${TIPO_LABELS[tipo]}`,
						sub: s.ultimo?.data_scadenza ? "Scadenza: " + formatDate(s.ultimo.data_scadenza) : "Mai registrato",
						badge: s.status
					});
				});
			});
			gotoBtn.onclick = () => {
				closeModal("modal-home-detail");
				showModule("cavalli");
			};
		}
		if (type === "lezioni") {
			titleEl.textContent = "Lezioni nei prossimi 7 giorni";
			const oggi = isoLoc(/* @__PURE__ */ new Date());
			const in7gg = /* @__PURE__ */ new Date();
			in7gg.setDate(in7gg.getDate() + 7);
			const in7ggIso = isoLoc(in7gg);
			lezioniList.filter((l) => l.data >= oggi && l.data <= in7ggIso && l.stato !== "annullata").sort((a, b) => (a.data + a.ora_inizio).localeCompare(b.data + b.ora_inizio)).forEach((l) => {
				rows.push({
					main: `${formatDate(l.data)} · ${l.ora_inizio} — ${membroNome(l.allievo_id)}`,
					sub: `Istruttore: ${membroNome(l.istruttore_id)} · Cavallo: ${cavalloNome(l.cavallo_id)}`,
					badge: STATO_LEZIONE_BADGE[l.stato] || "gray"
				});
			});
			gotoBtn.onclick = () => {
				closeModal("modal-home-detail");
				showModule("lezioni");
			};
		}
		if (type === "pacchetti") {
			titleEl.textContent = "Pacchetti da rinnovare";
			pacchettiList.filter((p) => ["red", "yellow"].includes(statusPacchetto(p))).forEach((p) => {
				rows.push({
					main: `${p.cliente} — ${TIPO_PACCHETTO_LABELS[p.tipo] || p.tipo}`,
					sub: p.data_scadenza ? "Scadenza: " + formatDate(p.data_scadenza) : "Lezioni esaurite",
					badge: statusPacchetto(p)
				});
			});
			gotoBtn.onclick = () => {
				closeModal("modal-home-detail");
				showModule("pacchetti");
			};
		}
		listEl.innerHTML = rows.length === 0 ? `<div class="empty-state" style="padding:20px 0"><i class="fa-solid fa-circle-check"></i><div>Nessuna voce da segnalare.</div></div>` : rows.map((r) => `
      <div class="detail-row">
        <div><div class="dr-main">${escapeHtml(r.main)}</div><div class="sub">${escapeHtml(r.sub)}</div></div>
        <span class="badge-pill badge-${r.badge}">${STATUS_LABELS[r.badge] || ""}</span>
      </div>`).join("");
		openModal("modal-home-detail");
	}
	function renderHomeQuickAccess() {
		document.getElementById("home-quick-grid").innerHTML = QUICK_ACCESS_ITEMS.map((item) => `
    <div class="card quick-card ${item.soon ? "is-soon" : ""}" onclick="showModule('${item.key}')">
      <div class="ic">${iconHtml(item.icon)}</div>
      <div>
        <h4>${escapeHtml(item.titolo)}</h4>
        <p>${escapeHtml(item.testo)}</p>
        ${item.soon ? `<span class="badge-pill badge-yellow">Presto</span>` : ""}
      </div>
    </div>`).join("");
	}
	function comingSoonHtml(icon, titolo, testo, badgeText) {
		return `
    <div class="coming-soon">
      <div class="ic">${iconHtml(icon)}</div>
      <div class="badge-pill badge-yellow"><i class="fa-solid fa-clock"></i> ${badgeText}</div>
      <h2>${escapeHtml(titolo)}</h2>
      <p>${escapeHtml(testo)}</p>
    </div>`;
	}
	var SFONDI_PAGINE = {
		home: {
			file: "home",
			chiaro: .08,
			scuro: .06
		},
		centro: {
			file: "centro",
			chiaro: .095,
			scuro: .045
		},
		cavalli: {
			file: "cavalli",
			chiaro: .098,
			scuro: .062
		},
		lezioni: {
			file: "lezioni",
			chiaro: .1,
			scuro: .065
		},
		pacchetti: {
			file: "pacchetti",
			chiaro: .088,
			scuro: .055
		},
		comunicazioni: {
			file: "comunicazioni",
			chiaro: .128,
			scuro: .062
		},
		professionisti: {
			file: "professionisti",
			chiaro: .095,
			scuro: .048
		},
		magazzino: {
			file: "magazzino",
			chiaro: .1,
			scuro: .065
		},
		statistiche: {
			file: "statistiche",
			chiaro: .085,
			scuro: .055
		}
	};
	var sfondoAttivo = "a";
	var sfondoCorrente = null;
	var sfondiPrecaricati = false;
	function aggiornaSfondoPagina(key) {
		const conf = SFONDI_PAGINE[key] || null;
		const nome = conf ? conf.file : null;
		if (nome === sfondoCorrente) return;
		sfondoCorrente = nome;
		const vecchio = document.getElementById("sfondo-" + sfondoAttivo);
		sfondoAttivo = sfondoAttivo === "a" ? "b" : "a";
		const nuovo = document.getElementById("sfondo-" + sfondoAttivo);
		if (vecchio) vecchio.classList.remove("visibile");
		if (nuovo && conf) {
			nuovo.style.backgroundImage = `url("assets/sfondi/${nome}.jpg")`;
			nuovo.style.setProperty("--op-chiaro", conf.chiaro);
			nuovo.style.setProperty("--op-scuro", conf.scuro);
			nuovo.classList.add("visibile");
		}
		if (!sfondiPrecaricati) {
			sfondiPrecaricati = true;
			setTimeout(() => Object.values(SFONDI_PAGINE).forEach((c) => {
				const i = new Image();
				i.src = `assets/sfondi/${c.file}.jpg`;
			}), 3e3);
		}
	}
	var ascoltiSezione = [];
	function quandoApriSezione(fn) {
		ascoltiSezione.push(fn);
	}
	function avvisaSezione(key) {
		for (const fn of ascoltiSezione) try {
			fn(key);
		} catch (e) {
			console.error("quandoApriSezione:", e);
		}
	}
	function showModule(key) {
		if (moduloBloccato(key)) {
			Registro.azione("bloccato:" + key);
			apriUpsell(key);
			avvisaSezione(key);
			return;
		}
		Registro.pagina(key);
		aggiornaSfondoPagina(key);
		document.querySelectorAll(".module-page").forEach((p) => p.style.display = "none");
		document.getElementById("module-" + key).style.display = "block";
		document.querySelectorAll(".nav-item").forEach((b) => b.classList.toggle("active", b.dataset.module === key));
		document.getElementById("topbar-title").textContent = MODULE_TITLES[key] || "";
		closeSidebar();
		if (key === "home") refreshHomeModule();
		if (key === "centro") refreshContattiModule();
		if (key === "cavalli") refreshCavalliModule();
		if (key === "lezioni") refreshLezioniModule();
		if (key === "pacchetti") refreshPacchettiModule();
		if (key === "comunicazioni") refreshComunicazioniModule();
		if (key === "professionisti") refreshProfessionistiModule();
		if (key === "groom") refreshGroomModule();
		if (key === "magazzino") refreshMagazzinoModule();
		if (key === "statistiche") refreshStatisticheModule();
		if (key === "ai") renderModuloAgenti();
		if (key === "centro") {
			renderIlTuoPacchetto();
			renderZonaCentro();
			groomCaricaTeam();
		}
		avvisaSezione(key);
	}
	function openSidebar() {
		document.getElementById("sidebar").classList.add("open");
		document.getElementById("sidebar-overlay").classList.add("active");
	}
	function closeSidebar() {
		document.getElementById("sidebar").classList.remove("open");
		document.getElementById("sidebar-overlay").classList.remove("active");
	}
	// equo-scuderia-src/src/sezioni/home/moduli/052-post-it-promemoria.js
	async function loadNote() {
		if (DEMO_MODE) {
			noteList = demoState.note;
			return;
		}
		const { data, error } = await sb.from("scuderia_note").select("id, centro_id, testo, colore, created_at, ordine").eq("centro_id", currentCentro.id).order("ordine", { ascending: true }).order("created_at", { ascending: false });
		if (!error) noteList = data || [];
	}
	function renderNote() {
		const board = document.getElementById("note-board");
		const empty = document.getElementById("note-empty");
		board.innerHTML = "";
		empty.style.display = noteList.length === 0 ? "block" : "none";
		noteList.forEach((n, idx) => {
			const rot = (idx % 2 === 0 ? -1 : 1) * (1 + idx % 3);
			const div = document.createElement("div");
			div.className = `postit postit-${n.colore}`;
			div.dataset.id = n.id;
			div.style.setProperty("--postit-rot", rot + "deg");
			div.innerHTML = `<div class="close-x" onclick="deleteNota('${n.id}')"><i class="fa-solid fa-xmark"></i></div>${escapeHtml(n.testo)}`;
			div.addEventListener("pointerdown", onPostitPointerDown);
			board.appendChild(div);
		});
	}
	// equo-scuderia-src/src/sezioni/home/moduli/051-home-cruscotto.js
	var QUICK_ACCESS_ITEMS = [
		{
			key: "centro",
			icon: "fa-house-chimney",
			titolo: "Il tuo Centro",
			testo: "Anagrafica centro, team e codice invito."
		},
		{
			key: "cavalli",
			icon: "fa-horse-head",
			titolo: "Cavalli & Salute",
			testo: "Anagrafica cavalli e scadenzario sanitario."
		},
		{
			key: "lezioni",
			icon: "fa-calendar-days",
			titolo: "Lezioni & Prenotazioni",
			testo: "Calendario delle lezioni del centro."
		},
		{
			key: "pacchetti",
			icon: "fa-ticket",
			titolo: "Pacchetti & Abbonamenti",
			testo: "Carnet, abbonamenti e cruscotto scadenze."
		},
		{
			key: "comunicazioni",
			icon: "fa-comments",
			titolo: "Messaggi",
			testo: "Messaggi al team e chat con i clienti."
		},
		{
			key: "magazzino",
			icon: "fa-boxes-stacked",
			titolo: "Magazzino",
			testo: "Scorte, depositi e riordini con il semaforo."
		},
		{
			key: "statistiche",
			icon: "fa-chart-line",
			titolo: "Statistiche",
			testo: "Incassi, clienti a rischio, margini e radar della concorrenza."
		},
		{
			key: "professionisti",
			icon: "fa-user-doctor",
			titolo: "Professionisti",
			testo: "Maniscalchi collegati: chat e appuntamenti con doppia conferma."
		},
		{
			key: "store",
			icon: "fa-store",
			titolo: "Store",
			testo: "Vendita di prodotti e servizi ai clienti.",
			soon: true
		},
		{
			key: "fatturazione",
			icon: "fa-file-invoice",
			titolo: "Fatturazione SDI",
			testo: "Fatture elettroniche conformi SDI.",
			soon: true
		},
		{
			key: "ai",
			icon: "fa-wand-magic-sparkles",
			titolo: "Agenti AI",
			testo: "Athena inclusa, Merlino per numeri e strategia; in arrivo Ermes, Galeno, Hammer, Ares."
		}
	];
	async function refreshHomeModule() {
		try {
			meteoScud();
		} catch (e) {
			console.warn("meteo:", e);
		}
		await Promise.all([
			cavalliList.length === 0 ? loadCavalli() : Promise.resolve(),
			loadEventiAll(),
			loadLezioni(),
			loadPacchetti(),
			loadMessaggi(),
			loadNote()
		]);
		renderHomeStats();
		renderHomeQuickAccess();
		renderNote();
	}
	// equo-scuderia-src/src/sezioni/home/moduli/index.js
	Object.assign(window, {
		aggiornaContatoriNav,
		closeSidebar,
		comingSoonHtml,
		deleteNota,
		impostaContatoreNav,
		openHomeDetail,
		openNotaForm,
		openSidebar,
		quandoApriSezione,
		refreshHomeModule,
		saveNota,
		selectNotaColore,
		showModule,
		startContatoriNav
	});
})();

