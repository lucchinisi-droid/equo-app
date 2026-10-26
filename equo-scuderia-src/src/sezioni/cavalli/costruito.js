
// === GENERATO da equo-app-src/strumenti/costruisci-moduli.mjs: NON modificare qui, modificare equo-scuderia-src/src/sezioni/cavalli/moduli/ ===
(function() {
	// equo-scuderia-src/src/sezioni/cavalli/moduli/061-modalita-stalla-schermo-intero-per-table.js
	function boxModalitaStalla(on) {
		const s = document.getElementById("box-sezione");
		s.classList.toggle("stalla", on);
		document.getElementById("box-stalla-barra").style.display = on ? "flex" : "none";
		clearInterval(boxOrologioTimer);
		if (on) {
			const tick = () => {
				document.getElementById("box-orologio").textContent = (/* @__PURE__ */ new Date()).toLocaleTimeString("it-IT", {
					hour: "2-digit",
					minute: "2-digit"
				});
			};
			tick();
			boxOrologioTimer = setInterval(async () => {
				tick();
				if ((/* @__PURE__ */ new Date()).getSeconds() < 30 && !DEMO_MODE) {
					await loadBox();
					renderBox();
				}
			}, 3e4);
			try {
				s.requestFullscreen?.();
			} catch (e) {}
		} else try {
			if (document.fullscreenElement) document.exitFullscreen();
		} catch (e) {}
	}
	(function() {
		let tip = null, timer = null, bersaglio = null, bloccaClick = false;
		const ICONE_TIP = {
			"fa-pen": "Modifica",
			"fa-trash": "Elimina",
			"fa-file-pdf": "Scheda PDF",
			"fa-print": "Stampa",
			"fa-download": "Scarica",
			"fa-paper-plane": "Invia",
			"fa-xmark": "Chiudi",
			"fa-rotate-left": "Nuova chat",
			"fa-copy": "Copia",
			"fa-plus": "Aggiungi",
			"fa-arrows-rotate": "Aggiorna",
			"fa-chevron-left": "Riduci o espandi il menu",
			"fa-bars": "Apri il menu",
			"fa-paperclip": "Allega foto o PDF",
			"fa-eye": "Vedi",
			"fa-lock": "Non incluso nel tuo pacchetto: tocca per saperne di più"
		};
		const MODULI_TIP = {
			home: "Panoramica del centro, accesso rapido e promemoria",
			centro: "Dati del centro, team, codice invito e il tuo pacchetto",
			cavalli: "Anagrafica cavalli, scadenzario sanitario e Box / Stalla",
			lezioni: "Calendario delle lezioni e prenotazioni",
			pacchetti: "Carnet, abbonamenti e pensioni",
			comunicazioni: "Messaggi al team e chat con i clienti",
			magazzino: "Scorte, movimenti, riordini e fornitori",
			statistiche: "Incassi, clienti a rischio, margini e radar di Merlino",
			professionisti: "Maniscalchi collegati: chat e appuntamenti",
			groom: "App Equo Groom per il personale di stalla: QR, PIN e icone del giorno",
			store: "Vendita online (in arrivo)",
			fatturazione: "Fatture elettroniche SDI (in arrivo)",
			ai: "Athena, Merlino e gli altri agenti"
		};
		function crea() {
			if (!tip) {
				tip = document.createElement("div");
				tip.id = "eq-tip";
				tip.setAttribute("role", "tooltip");
				document.body.appendChild(tip);
			}
			return tip;
		}
		function mostra(el) {
			if (window.__boxDrag) return;
			const testo = el.getAttribute("data-tip");
			if (!testo) return;
			const t = crea();
			t.textContent = testo;
			t.classList.remove("sopra", "sotto");
			t.style.left = "0px";
			t.style.top = "0px";
			t.classList.add("vis");
			const r = el.getBoundingClientRect(), w = t.offsetWidth, h = t.offsetHeight;
			let x = Math.min(window.innerWidth - w - 8, Math.max(8, r.left + r.width / 2 - w / 2));
			let y = r.top - h - 10, sopra = true;
			if (y < 8) {
				y = r.bottom + 10;
				sopra = false;
			}
			t.style.left = x + "px";
			t.style.top = y + "px";
			t.classList.add(sopra ? "sopra" : "sotto");
			t.style.setProperty("--freccia", Math.min(w - 12, Math.max(12, r.left + r.width / 2 - x)) + "px");
		}
		function nascondi() {
			clearTimeout(timer);
			bersaglio = null;
			if (tip) tip.classList.remove("vis");
		}
		document.addEventListener("mouseover", (e) => {
			const el = e.target.closest && e.target.closest("[data-tip]");
			if (el === bersaglio) return;
			nascondi();
			if (!el) return;
			bersaglio = el;
			timer = setTimeout(() => mostra(el), 450);
		});
		document.addEventListener("mouseout", (e) => {
			if (bersaglio && !bersaglio.contains(e.relatedTarget)) nascondi();
		});
		document.addEventListener("scroll", nascondi, true);
		document.addEventListener("focusin", (e) => {
			const el = e.target.closest && e.target.closest("[data-tip]");
			if (el && el.matches(":focus-visible")) mostra(el);
		});
		document.addEventListener("focusout", nascondi);
		document.addEventListener("touchstart", (e) => {
			const el = e.target.closest && e.target.closest("[data-tip]");
			nascondi();
			if (!el) return;
			timer = setTimeout(() => {
				mostra(el);
				bloccaClick = true;
				setTimeout(nascondi, 2600);
			}, 520);
		}, { passive: true });
		[
			"touchend",
			"touchmove",
			"touchcancel"
		].forEach((ev) => document.addEventListener(ev, () => clearTimeout(timer), { passive: true }));
		document.addEventListener("click", (e) => {
			if (bloccaClick) {
				bloccaClick = false;
				e.preventDefault();
				e.stopPropagation();
				return;
			}
			nascondi();
		}, true);
		document.addEventListener("contextmenu", (e) => {
			if (e.target.closest && e.target.closest("[data-tip]") && matchMedia("(hover: none)").matches) e.preventDefault();
		});
		function automatici(radice) {
			(radice || document).querySelectorAll("[title]:not(input):not(textarea):not(select):not(iframe)").forEach((el) => {
				if (!el.hasAttribute("data-tip")) el.setAttribute("data-tip", el.getAttribute("title"));
				el.removeAttribute("title");
			});
			(radice || document).querySelectorAll("button:not([data-tip]), .x:not([data-tip])").forEach((b) => {
				if (b.textContent.trim()) return;
				const i = b.querySelector("i[class*='fa-']");
				if (!i && !b.classList.contains("x")) return;
				const k = i ? [...i.classList].find((c) => ICONE_TIP[c]) : null;
				if (k) b.setAttribute("data-tip", ICONE_TIP[k]);
				else if (b.classList.contains("x")) b.setAttribute("data-tip", "Chiudi");
			});
			(radice || document).querySelectorAll(".nav-item[data-module]:not([data-tip])").forEach((n) => {
				const t = MODULI_TIP[n.dataset.module];
				if (t) n.setAttribute("data-tip", t);
			});
			(radice || document).querySelectorAll(".badge:not([data-tip])").forEach((b) => {
				if (/soon/i.test(b.textContent)) b.setAttribute("data-tip", "In arrivo: ci stiamo lavorando");
			});
		}
		let pend = null;
		const osserva = () => {
			clearTimeout(pend);
			pend = setTimeout(() => automatici(document), 250);
		};
		document.addEventListener("DOMContentLoaded", () => {
			automatici(document);
			new MutationObserver(osserva).observe(document.body, {
				childList: true,
				subtree: true
			});
		});
		if (document.readyState !== "loading") {
			automatici(document);
			new MutationObserver(osserva).observe(document.body, {
				childList: true,
				subtree: true
			});
		}
	})();
	var groomDati = {
		limite: 0,
		gestisce: false,
		groom: []
	};
	var groomQrCorrente = null;
	var GROOM_LINGUE = {
		it: "Italiano",
		en: "English",
		ro: "Română",
		hi: "हिन्दी",
		pa: "ਪੰਜਾਬੀ",
		bn: "বাংলা",
		ar: "العربية"
	};
	var groomLimiteLocale = () => ({
		start: 0,
		advance: 3,
		premium: 10
	})[pianoCentro?.pacchetto] ?? 50;
	var groomLink = (token) => `${location.origin}/groom?t=${token}`;
	async function groomCarica() {
		if (DEMO_MODE) {
			if (!demoState.groom) demoState.groom = [{
				id: "g1",
				nome: "Rahim",
				lingua: "bn",
				attivo: true,
				pin_creato: true,
				bloccato: false,
				ultimo_accesso: (/* @__PURE__ */ new Date(Date.now() - 36e5)).toISOString(),
				token: "demo-rahim"
			}, {
				id: "g2",
				nome: "Ion",
				lingua: "ro",
				attivo: true,
				pin_creato: false,
				bloccato: false,
				ultimo_accesso: null,
				token: "demo-ion"
			}];
			groomDati = {
				limite: groomLimiteLocale(),
				gestisce: true,
				groom: demoState.groom
			};
			return;
		}
		const { data, error } = await sb.rpc("groom_elenco", { p_centro_id: currentCentro.id });
		if (error) {
			console.warn("groom:", error.message);
			groomDati = {
				limite: groomLimiteLocale(),
				gestisce: false,
				groom: []
			};
			return;
		}
		groomDati = data;
	}
	async function refreshGroomModule() {
		await groomCarica();
		groomRender();
	}
	async function groomCaricaTeam() {
		if (pianoCentro && pianoCentro.groom === false) return;
		await groomCarica();
		groomRenderTeam();
	}
	function groomAttivi() {
		return groomDati.groom.filter((g) => g.attivo).length;
	}
	function groomQuando(iso) {
		if (!iso) return "mai entrato";
		const d = new Date(iso), min = Math.round((Date.now() - d) / 6e4);
		if (min < 2) return "attivo ora";
		if (min < 60) return `${min} min fa`;
		if (d.toDateString() === (/* @__PURE__ */ new Date()).toDateString()) return "oggi alle " + d.toLocaleTimeString("it-IT", {
			hour: "2-digit",
			minute: "2-digit"
		});
		return d.toLocaleDateString("it-IT", {
			day: "numeric",
			month: "short"
		});
	}
	function groomRender() {
		const n = groomAttivi(), lim = groomDati.limite ?? groomLimiteLocale(), pieno = n >= lim;
		document.getElementById("groom-contatore").textContent = `${n} di ${lim}`;
		const btn = document.getElementById("groom-btn-agg");
		btn.style.display = groomDati.gestisce ? "" : "none";
		btn.classList.toggle("disabled", pieno);
		btn.setAttribute("data-tip", pieno ? lim < 10 ? "Hai raggiunto i 3 groom di ADVANCE: con PREMIUM arrivi a 10." : "Hai raggiunto il massimo di groom del tuo pacchetto." : "Crea il QR personale per un nuovo groom");
		const lista = document.getElementById("groom-lista");
		document.getElementById("groom-vuoto").style.display = groomDati.groom.length ? "none" : "block";
		lista.innerHTML = groomDati.groom.map((g) => {
			const stato = !g.attivo ? `<span class="badge-pill badge-gray">Disattivato</span>` : g.bloccato ? `<span class="badge-pill" style="background:#fdeceb;color:#a5281b">PIN bloccato: genera un nuovo QR</span>` : !g.pin_creato ? `<span class="badge-pill" style="background:#fff4d6;color:#7a5300">In attesa del primo accesso</span>` : `<span class="badge-pill" style="background:#e8f3ec;color:#1d4a35">${escapeHtml(groomQuando(g.ultimo_accesso))}</span>`;
			const az = !groomDati.gestisce ? "" : g.attivo ? `<button class="btn btn-outline btn-sm" onclick="groomMostraQr('${g.id}')" data-tip="Mostra il QR personale da inquadrare"><i class="fa-solid fa-qrcode"></i> QR</button>
         <button class="btn btn-ghost btn-sm" onclick="groomNuovoQr('${g.id}')" data-tip="Telefono cambiato o PIN dimenticato: il vecchio QR smette di funzionare"><i class="fa-solid fa-arrows-rotate"></i> Nuovo QR</button>
         <button class="btn btn-ghost btn-sm" onclick="groomAttiva('${g.id}', false)" data-tip="Il groom non può più entrare nell'app"><i class="fa-solid fa-user-slash"></i> Disattiva</button>` : `<button class="btn btn-outline btn-sm" onclick="groomAttiva('${g.id}', true)"><i class="fa-solid fa-user-check"></i> Riattiva</button>
         <button class="btn btn-ghost btn-sm" onclick="groomElimina('${g.id}')"><i class="fa-solid fa-trash"></i></button>`;
			return `<div class="groom-riga${g.attivo ? "" : " off"}"><div class="groom-av">${escapeHtml((g.nome || "?").slice(0, 1).toUpperCase())}</div>
      <div class="groom-info"><b>${escapeHtml(g.nome)}</b><span>${escapeHtml(GROOM_LINGUE[g.lingua] || g.lingua)} · ${stato}</span></div><div class="groom-az">${az}</div></div>`;
		}).join("");
	}
	function groomRenderTeam() {
		const box = document.getElementById("team-groom");
		if (!box) return;
		box.style.display = groomDati.groom.length ? "block" : "none";
		document.getElementById("team-groom-count").textContent = `${groomAttivi()} di ${groomDati.limite ?? groomLimiteLocale()}`;
		document.getElementById("team-groom-lista").innerHTML = groomDati.groom.map((g) => `<div class="groom-riga mini${g.attivo ? "" : " off"}"><div class="groom-av">${escapeHtml((g.nome || "?").slice(0, 1).toUpperCase())}</div>
    <div class="groom-info"><b>${escapeHtml(g.nome)}</b><span>Groom · ${escapeHtml(GROOM_LINGUE[g.lingua] || "")} · ${g.attivo ? escapeHtml(g.pin_creato ? groomQuando(g.ultimo_accesso) : "in attesa del primo accesso") : "disattivato"}</span></div></div>`).join("");
	}
	function groomApriNuovo() {
		const lim = groomDati.limite ?? groomLimiteLocale();
		if (groomAttivi() >= lim) {
			if (lim < 10) return apriUpsell("groom");
			return showToast("Hai raggiunto il massimo di groom del tuo pacchetto.");
		}
		document.getElementById("groom-nome").value = "";
		document.getElementById("groom-lingua").value = "it";
		document.getElementById("groom-err").style.display = "none";
		openModal("modal-groom-nuovo");
		setTimeout(() => document.getElementById("groom-nome").focus(), 50);
	}
	async function groomSalvaNuovo() {
		const nome = document.getElementById("groom-nome").value.trim(), lingua = document.getElementById("groom-lingua").value;
		const err = document.getElementById("groom-err");
		if (!nome) {
			err.textContent = "Scrivi il nome del groom.";
			err.style.display = "block";
			return;
		}
		let r;
		if (DEMO_MODE) {
			r = {
				id: "g" + Date.now(),
				token: "demo-" + Date.now()
			};
			demoState.groom.push({
				id: r.id,
				nome,
				lingua,
				attivo: true,
				pin_creato: false,
				bloccato: false,
				ultimo_accesso: null,
				token: r.token
			});
		} else {
			const { data, error } = await sb.rpc("groom_crea", {
				p_centro_id: currentCentro.id,
				p_nome: nome,
				p_lingua: lingua
			});
			if (error) {
				err.textContent = error.message;
				err.style.display = "block";
				return;
			}
			r = data;
		}
		Registro.azione("groom:crea");
		closeModal("modal-groom-nuovo");
		await refreshGroomModule();
		groomMostraQr(r.id, r.token);
	}
	function groomMostraQr(id, token) {
		const g = groomDati.groom.find((x) => x.id === id);
		token = token || g?.token;
		if (!token) return showToast("QR non disponibile.");
		groomQrCorrente = {
			nome: g?.nome || "",
			link: groomLink(token)
		};
		document.getElementById("groom-qr-titolo").textContent = "QR di " + (g?.nome || "");
		const d = document.getElementById("groom-qr-img");
		d.innerHTML = "";
		try {
			new QRCode(d, {
				text: groomQrCorrente.link,
				width: 220,
				height: 220,
				colorDark: "#0b341e",
				colorLight: "#ffffff"
			});
		} catch (e) {
			d.textContent = groomQrCorrente.link;
		}
		openModal("modal-groom-qr");
	}
	function groomCondividi() {
		if (!groomQrCorrente) return;
		const testo = `Ciao ${groomQrCorrente.nome}, questa è la tua app Equo Groom per ${currentCentro?.nome || "la scuderia"}. Apri il link, scegli il tuo PIN e la tua lingua: ${groomQrCorrente.link}`;
		if (navigator.share) {
			navigator.share({
				title: "Equo Groom",
				text: testo
			}).catch(() => {});
			return;
		}
		window.open("https://wa.me/?text=" + encodeURIComponent(testo), "_blank");
	}
	async function groomCopia() {
		try {
			await navigator.clipboard.writeText(groomQrCorrente.link);
			showToast("Link copiato.");
		} catch (e) {
			showToast(groomQrCorrente.link);
		}
	}
	async function groomStampaQr() {
		groomFinestraStampa(`<div class="et grande"><img src="${await qrDataUrl(groomQrCorrente.link)}"><b>${escapeHtml(groomQrCorrente.nome)}</b><span>Equo Groom · ${escapeHtml(currentCentro?.nome || "")}</span><small>QR personale: non condividerlo</small></div>`, "QR groom");
	}
	async function groomNuovoQr(id) {
		const g = groomDati.groom.find((x) => x.id === id);
		if (!await groomConferma("Nuovo QR", `Il QR attuale di ${g.nome} smetterà di funzionare e al prossimo accesso sceglierà un nuovo PIN. Procedo?`)) return;
		let token;
		if (DEMO_MODE) {
			token = "demo-" + Date.now();
			Object.assign(g, {
				token,
				pin_creato: false,
				bloccato: false
			});
		} else {
			const { data, error } = await sb.rpc("groom_nuovo_qr", { p_id: id });
			if (error) return showToast(error.message);
			token = data.token;
		}
		await refreshGroomModule();
		groomMostraQr(id, token);
	}
	async function groomAttiva(id, attivo) {
		const g = groomDati.groom.find((x) => x.id === id);
		if (!attivo && !await groomConferma("Disattiva groom", `${g.nome} non potrà più entrare nell'app Groom. Le spunte che ha già fatto restano. Potrai riattivarlo con un nuovo QR.`)) return;
		if (attivo && groomAttivi() >= (groomDati.limite ?? groomLimiteLocale())) return groomApriNuovo();
		if (DEMO_MODE) Object.assign(g, {
			attivo,
			pin_creato: attivo ? false : g.pin_creato
		});
		else {
			const { error } = await sb.rpc("groom_attiva", {
				p_id: id,
				p_attivo: attivo
			});
			if (error) return showToast(error.message);
		}
		await refreshGroomModule();
		if (attivo) groomMostraQr(id);
	}
	async function groomElimina(id) {
		if (!await groomConferma("Elimina groom", `Elimino ${groomDati.groom.find((x) => x.id === id).nome} dall'elenco? Le spunte che ha già fatto restano nello storico.`)) return;
		if (DEMO_MODE) demoState.groom = demoState.groom.filter((x) => x.id !== id);
		else {
			const { error } = await sb.rpc("groom_elimina", { p_id: id });
			if (error) return showToast(error.message);
		}
		await refreshGroomModule();
	}
	function groomConferma(titolo, testo) {
		return new Promise((ok) => {
			document.getElementById("box-conf-titolo").textContent = titolo;
			document.getElementById("box-conf-testo").textContent = testo;
			const si = document.getElementById("box-conf-si"), no = document.getElementById("box-conf-no");
			si.onclick = () => {
				closeModal("modal-box-conferma");
				ok(true);
			};
			no.onclick = () => {
				closeModal("modal-box-conferma");
				ok(false);
			};
			openModal("modal-box-conferma");
		});
	}
	async function groomStampaBox() {
		if (!boxList || !boxList.length) try {
			await loadBox();
		} catch (e) {}
		const lista = (boxList || []).slice().sort((a, b) => (a.numero || 0) - (b.numero || 0));
		if (!lista.length) return showToast("Nessun box: creali prima in Cavalli & Salute → Box / Stalla.");
		showToast("Preparo le etichette…");
		const et = [];
		for (const b of lista) {
			const u = await qrDataUrl(`${location.origin}/groom?b=${b.id}`);
			et.push(`<div class="et"><img src="${u}"><b>Box ${escapeHtml(b.numero ?? "")}</b><span>${escapeHtml([b.nome, b.zona].filter(Boolean).join(" · ") || currentCentro?.nome || "")}</span><small>Equo Groom</small></div>`);
		}
		groomFinestraStampa(et.join(""), "QR dei box");
	}
	function groomFinestraStampa(corpo, titolo) {
		const w = window.open("", "_blank");
		if (!w) return showToast("Consenti le finestre pop-up per stampare.");
		w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${titolo}</title><style>
    @page{ size:A4; margin:10mm } body{ font-family:Arial,sans-serif; margin:0; color:#0b341e }
    .griglia{ display:grid; grid-template-columns:repeat(3,1fr); gap:6mm }
    .et{ border:0.4mm solid #0b341e; border-radius:3mm; padding:4mm; text-align:center; break-inside:avoid; display:flex; flex-direction:column; align-items:center; gap:1mm }
    .et img{ width:42mm; height:42mm } .et b{ font-size:16pt } .et span{ font-size:9pt; color:#444 } .et small{ font-size:7.5pt; color:#777 }
    .et.grande{ width:90mm; margin:20mm auto } .et.grande img{ width:70mm; height:70mm }
  </style></head><body><div class="${corpo.includes("grande") ? "" : "griglia"}">${corpo}</div><script>window.onload=()=>setTimeout(()=>window.print(),300)<\/script></body></html>`);
		w.document.close();
	}
	function openModal(id) {
		document.getElementById(id).classList.add("active");
	}
	// equo-scuderia-src/src/sezioni/cavalli/moduli/050-import-cavalli-dopo-collegamento-proprie.js
	var importCavalliPendenti = [];
	var importCavalliMembroId = null;
	var importCavalliOnDone = null;
	async function proponiImportCavalli(membroId, nome, onDone) {
		if (DEMO_MODE) {
			onDone();
			return;
		}
		try {
			const { data, error } = await sb.rpc("cavalli_da_importare", { p_membro_id: membroId });
			if (error || !data || data.length === 0) {
				onDone();
				return;
			}
			importCavalliMembroId = membroId;
			importCavalliOnDone = onDone;
			importCavalliPendenti = data;
			renderImportCavalliList(nome);
			openModal("modal-import-cavalli");
		} catch (err) {
			onDone();
		}
	}
	function renderImportCavalliList(nome) {
		const n = importCavalliPendenti.length;
		document.getElementById("import-cavalli-title").textContent = `${nome} ha ${n === 1 ? "un cavallo" : n + " cavalli"} sul suo profilo Equo App non ancora in scheda qui. Seleziona quelli da importare.`;
		document.getElementById("import-cavalli-list").innerHTML = importCavalliPendenti.map((h) => `
    <label style="display:flex;align-items:center;gap:10px;padding:8px 2px;border-bottom:1px solid var(--border)">
      <input type="checkbox" class="import-cavallo-check" value="${h.id}" style="width:18px;height:18px;flex-shrink:0">
      <div>
        <div style="font-weight:600">${escapeHtml(h.name || "Cavallo")}</div>
        <div style="color:var(--muted);font-size:12px">${escapeHtml([h.breed, h.microchip ? "Microchip " + h.microchip : null].filter(Boolean).join(" · ") || "—")}</div>
      </div>
    </label>`).join("");
	}
	async function confermaImportCavalli() {
		const ids = Array.from(document.querySelectorAll(".import-cavallo-check:checked")).map((el) => el.value);
		closeModal("modal-import-cavalli");
		if (ids.length > 0) {
			let ok = 0;
			const errori = [];
			for (const horseId of ids) {
				const { error } = await sb.rpc("importa_cavallo_scuderia", {
					p_horse_id: horseId,
					p_membro_id: importCavalliMembroId
				});
				if (!error) ok++;
				else {
					const nome = (importCavalliPendenti.find((h) => h.id === horseId) || {}).name || "cavallo";
					errori.push(`${nome}: ${error.message || "errore"}`);
				}
			}
			if (ok > 0) {
				await loadCavalli();
				renderCavalliList();
			}
			if (errori.length === 0) {
				if (ok > 0) showToast(ok === 1 ? "Cavallo importato." : `${ok} cavalli importati.`);
			} else showToast((ok > 0 ? `${ok} importat${ok === 1 ? "o" : "i"}, ` : "") + `non importat${errori.length === 1 ? "o" : "i"}: ` + errori.join(" · "));
		}
		importCavalliPendenti = [];
		const onDone = importCavalliOnDone;
		importCavalliOnDone = null;
		if (onDone) onDone();
	}
	function saltaImportCavalli() {
		closeModal("modal-import-cavalli");
		importCavalliPendenti = [];
		const onDone = importCavalliOnDone;
		importCavalliOnDone = null;
		if (onDone) onDone();
	}
	async function loadMessaggi() {
		if (DEMO_MODE) {
			messaggiList = demoState.messaggi;
			return;
		}
		const { data, error } = await sb.from("scuderia_messaggi").select("id, centro_id, mittente_id, destinatario_tipo, destinatario_ruolo, destinatario_membro_id, testo, priorita, created_at").eq("centro_id", currentCentro.id).order("created_at", { ascending: false });
		if (!error) messaggiList = data || [];
	}
	function destinatarioLabel(m) {
		if (m.destinatario_tipo === "tutti") return "Tutto il centro";
		if (m.destinatario_tipo === "ruolo") return "Per ruolo: " + (RUOLO_LABELS[m.destinatario_ruolo] || m.destinatario_ruolo);
		return "A: " + (m.destinatario_nome || membroNome(m.destinatario_membro_id));
	}
	function renderMessaggi() {
		const list = document.getElementById("messaggi-list");
		const empty = document.getElementById("messaggi-empty");
		list.innerHTML = "";
		empty.style.display = messaggiList.length === 0 ? "block" : "none";
		messaggiList.forEach((m) => {
			const mittente = m.mittente_nome || membroNome(m.mittente_id) || "Un membro";
			const div = document.createElement("div");
			div.className = "msg-item";
			div.innerHTML = `
      <div class="head">
        <span class="who">${escapeHtml(mittente)} <span style="color:var(--muted);font-weight:400">→ ${escapeHtml(destinatarioLabel(m))}</span></span>
        <span style="display:flex;align-items:center;gap:8px">
          ${m.priorita === "urgente" ? `<span class="badge-pill badge-red">Urgente</span>` : ""}
          <span class="when">${formatDateTime(m.created_at)}</span>
        </span>
      </div>
      <div class="body">${escapeHtml(m.testo)}</div>`;
			list.appendChild(div);
		});
	}
	function toggleDestinatarioMsg() {
		const tipo = document.getElementById("msg-destinatario").value;
		document.getElementById("msg-ruolo-field").style.display = tipo === "ruolo" ? "block" : "none";
		document.getElementById("msg-membro-field").style.display = tipo === "singolo" ? "block" : "none";
		if (tipo === "singolo") {
			const sel = document.getElementById("msg-membro");
			sel.innerHTML = teamList.filter((m) => m.user_id !== currentUser.id).map((m) => `<option value="${m.id}">${escapeHtml(m.nome_visualizzato || RUOLO_LABELS[m.ruolo])}</option>`).join("");
		}
	}
	function openMessaggioForm() {
		document.getElementById("messaggio-error").style.display = "none";
		document.getElementById("msg-destinatario").value = "tutti";
		document.getElementById("msg-testo").value = "";
		document.getElementById("msg-priorita").value = "normale";
		toggleDestinatarioMsg();
		openModal("modal-messaggio");
	}
	async function saveMessaggio() {
		const testo = document.getElementById("msg-testo").value.trim();
		const errBox = document.getElementById("messaggio-error");
		errBox.style.display = "none";
		if (!testo) {
			errBox.textContent = "Scrivi un messaggio prima di inviare.";
			errBox.style.display = "block";
			return;
		}
		const destinatario_tipo = document.getElementById("msg-destinatario").value;
		const destinatario_ruolo = destinatario_tipo === "ruolo" ? document.getElementById("msg-ruolo").value : null;
		const destinatario_membro_id = destinatario_tipo === "singolo" ? document.getElementById("msg-membro").value : null;
		const priorita = document.getElementById("msg-priorita").value;
		try {
			if (DEMO_MODE) demoState.messaggi.unshift({
				id: "msg" + (demoIdCounter++ + 400),
				centro_id: demoState.centro.id,
				mittente_id: currentMembro ? "m1" : null,
				mittente_nome: currentMembro?.nome_visualizzato || "Tu (admin)",
				destinatario_tipo,
				destinatario_ruolo,
				destinatario_nome: destinatario_membro_id ? membroNome(destinatario_membro_id) : null,
				testo,
				priorita,
				created_at: (/* @__PURE__ */ new Date()).toISOString()
			});
			else {
				const { error } = await sb.from("scuderia_messaggi").insert({
					centro_id: currentCentro.id,
					mittente_id: currentMembroId(),
					destinatario_tipo,
					destinatario_ruolo,
					destinatario_membro_id,
					testo,
					priorita
				});
				if (error) throw error;
			}
			await loadMessaggi();
			renderMessaggi();
			closeModal("modal-messaggio");
			showToast("Messaggio inviato.");
		} catch (err) {
			errBox.textContent = err.message || "Errore nell'invio.";
			errBox.style.display = "block";
		}
	}
	function currentMembroId() {
		const m = teamList.find((x) => x.user_id === currentUser.id);
		return m ? m.id : null;
	}
	function formatDateTime(iso) {
		if (!iso) return "—";
		const d = new Date(iso);
		return d.toLocaleDateString("it-IT") + " " + d.toLocaleTimeString("it-IT", {
			hour: "2-digit",
			minute: "2-digit"
		});
	}
	// equo-scuderia-src/src/sezioni/cavalli/moduli/042-razza-menu-con-ricerca-stesso-codice-in.js
	var RAZZE_EQUO = [
		[
			"Avelignese",
			"AVE",
			1,
			["haflinger italiano"]
		],
		[
			"Bardigiano",
			"BAR",
			1,
			[]
		],
		[
			"Calabrese",
			"CAL",
			1,
			[]
		],
		[
			"Catria",
			"CTR",
			1,
			[]
		],
		[
			"Cavallo del Delta",
			"DEL",
			1,
			["delta"]
		],
		[
			"Cavallo del Ventasso",
			"VEN",
			1,
			["ventasso"]
		],
		[
			"Esperia",
			"ESP",
			1,
			["pony esperia"]
		],
		[
			"Cavallino della Giara",
			"GIA",
			1,
			["giara"]
		],
		[
			"Lipizzano",
			"LIP",
			1,
			["lipizzaner"]
		],
		[
			"Maremmano",
			"MAR",
			1,
			["maremma"]
		],
		[
			"Monterufolino",
			"MTR",
			1,
			[]
		],
		[
			"Murgese",
			"MUR",
			1,
			[]
		],
		[
			"Napoletano",
			"NAP",
			1,
			[]
		],
		[
			"Norico",
			"NOR",
			1,
			["noriker"]
		],
		[
			"Pentro",
			"PEN",
			1,
			[]
		],
		[
			"Persano",
			"PRS",
			1,
			[]
		],
		[
			"Salernitano",
			"SAL",
			1,
			[]
		],
		[
			"Sanfratellano",
			"SFT",
			1,
			["san fratellano"]
		],
		[
			"Sarcidano",
			"SRC",
			1,
			[]
		],
		[
			"Sella Italiano",
			"SIT",
			1,
			["sella italiana", "si"]
		],
		[
			"Purosangue Orientale Siciliano",
			"SIC",
			1,
			["siciliano", "orientale siciliano"]
		],
		[
			"Tolfetano",
			"TOL",
			1,
			[]
		],
		[
			"Trottatore Italiano",
			"TIT",
			1,
			["trottatore"]
		],
		[
			"Anglo-Arabo Sardo",
			"AAS",
			1,
			["anglo arabo sardo"]
		],
		[
			"Tiro Pesante Rapido",
			"TPR",
			1,
			["tpr"]
		],
		[
			"Purosangue Inglese",
			"PSI",
			0,
			[
				"psi",
				"purosangue",
				"thoroughbred",
				"inglese"
			]
		],
		[
			"Purosangue Arabo",
			"PSA",
			0,
			[
				"arabo",
				"psa",
				"arabian"
			]
		],
		[
			"Anglo-Arabo",
			"AAR",
			0,
			["anglo arabo"]
		],
		[
			"Shagya",
			"SHA",
			0,
			["arabo shagya"]
		],
		[
			"Akhal-Teke",
			"AKT",
			0,
			["akhal teke"]
		],
		[
			"Barbero",
			"BRB",
			0,
			["barbo"]
		],
		[
			"Standardbred",
			"STB",
			0,
			["trottatore americano"]
		],
		[
			"Trottatore Francese",
			"TFR",
			0,
			["trotteur francais"]
		],
		[
			"Orlov",
			"ORL",
			0,
			["trottatore russo"]
		],
		[
			"Hannover",
			"HAN",
			0,
			["hannoveraner", "annover"]
		],
		[
			"Holsteiner",
			"HOL",
			0,
			["holstein"]
		],
		[
			"Oldenburg",
			"OLD",
			0,
			["oldenburger"]
		],
		[
			"Westfalen",
			"WES",
			0,
			["westfalico"]
		],
		[
			"Trakehner",
			"TRK",
			0,
			["trakener"]
		],
		[
			"Hessen",
			"HES",
			0,
			[]
		],
		[
			"Brandenburg",
			"BRA",
			0,
			[]
		],
		[
			"Mecklenburg",
			"MEC",
			0,
			[]
		],
		[
			"Württemberg",
			"WUR",
			0,
			["wurttemberg"]
		],
		[
			"Bayerisches Warmblut",
			"BAY",
			0,
			["bavarese"]
		],
		[
			"Zangersheide",
			"ZAN",
			0,
			[]
		],
		[
			"KWPN",
			"KWP",
			0,
			[
				"sella olandese",
				"dutch warmblood",
				"olandese"
			]
		],
		[
			"BWP",
			"BWP",
			0,
			["sella belga"]
		],
		[
			"Selle Français",
			"SFR",
			0,
			["sella francese", "selle francais"]
		],
		[
			"Sella Svedese",
			"SWB",
			0,
			["swb"]
		],
		[
			"Sella Danese",
			"DWB",
			0,
			["dwb"]
		],
		[
			"Irish Sport Horse",
			"ISH",
			0,
			["irlandese"]
		],
		[
			"Irish Draught",
			"IRD",
			0,
			[]
		],
		[
			"Wielkopolski",
			"WIE",
			0,
			[]
		],
		[
			"Małopolski",
			"MAL",
			0,
			["malopolski"]
		],
		[
			"Kisbéri",
			"KIS",
			0,
			["kisberi"]
		],
		[
			"Nonius",
			"NON",
			0,
			[]
		],
		[
			"Furioso-North Star",
			"FUR",
			0,
			["furioso"]
		],
		[
			"Lusitano",
			"LUS",
			0,
			[]
		],
		[
			"PRE (Pura Raza Española)",
			"PRE",
			0,
			[
				"andaluso",
				"pura raza espanola",
				"spagnolo"
			]
		],
		[
			"Hispano-Arabo",
			"HIS",
			0,
			[]
		],
		[
			"Frisone",
			"FRI",
			0,
			["friesian"]
		],
		[
			"Gelderlander",
			"GEL",
			0,
			[]
		],
		[
			"Groninger",
			"GRO",
			0,
			[]
		],
		[
			"Kladruber",
			"KLA",
			0,
			[]
		],
		[
			"Cleveland Bay",
			"CLE",
			0,
			[]
		],
		[
			"Hackney",
			"HAC",
			0,
			[]
		],
		[
			"Quarter Horse",
			"QTR",
			0,
			["quarter", "qh"]
		],
		[
			"Paint Horse",
			"PNT",
			0,
			["paint"]
		],
		[
			"Appaloosa",
			"APP",
			0,
			[]
		],
		[
			"Mustang",
			"MUS",
			0,
			[]
		],
		[
			"Morgan",
			"MOR",
			0,
			[]
		],
		[
			"Tennessee Walking Horse",
			"TWH",
			0,
			[]
		],
		[
			"American Saddlebred",
			"ASB",
			0,
			["saddlebred"]
		],
		[
			"Missouri Fox Trotter",
			"MFT",
			0,
			[]
		],
		[
			"Rocky Mountain Horse",
			"RMH",
			0,
			[]
		],
		[
			"Palomino",
			"PAL",
			0,
			[]
		],
		[
			"Buckskin",
			"BUC",
			0,
			[]
		],
		[
			"Pinto",
			"PIN",
			0,
			[]
		],
		[
			"Criollo",
			"CRI",
			0,
			[]
		],
		[
			"Paso Fino",
			"PSF",
			0,
			[]
		],
		[
			"Paso Peruviano",
			"PSP",
			0,
			[]
		],
		[
			"Mangalarga Marchador",
			"MNG",
			0,
			["mangalarga"]
		],
		[
			"Campolina",
			"CMP",
			0,
			[]
		],
		[
			"Azteca",
			"AZT",
			0,
			[]
		],
		[
			"Bretone",
			"BRE",
			0,
			[]
		],
		[
			"Percheron",
			"PER",
			0,
			[]
		],
		[
			"Ardennese",
			"ARD",
			0,
			["ardennes"]
		],
		[
			"Comtois",
			"CMT",
			0,
			[]
		],
		[
			"Boulonnais",
			"BOU",
			0,
			[]
		],
		[
			"Belga da tiro",
			"BEL",
			0,
			["brabante"]
		],
		[
			"Clydesdale",
			"CLY",
			0,
			[]
		],
		[
			"Shire",
			"SHI",
			0,
			[]
		],
		[
			"Suffolk Punch",
			"SUF",
			0,
			["suffolk"]
		],
		[
			"Schwarzwälder Fuchs",
			"SWF",
			0,
			["schwarzwalder"]
		],
		[
			"Freiberger",
			"FRB",
			0,
			["franches-montagnes", "franches montagnes"]
		],
		[
			"Fjord",
			"FJO",
			0,
			["fiordo", "fjord norvegese"]
		],
		[
			"Döle",
			"DOL",
			0,
			["dole"]
		],
		[
			"Jutland",
			"JUT",
			0,
			[]
		],
		[
			"Vladimir",
			"VLA",
			0,
			[]
		],
		[
			"Shetland",
			"SHE",
			0,
			[]
		],
		[
			"Welsh",
			"WEL",
			0,
			["welsh pony", "welsh cob"]
		],
		[
			"Connemara",
			"CON",
			0,
			[]
		],
		[
			"New Forest",
			"NFO",
			0,
			[]
		],
		[
			"Dartmoor",
			"DAR",
			0,
			[]
		],
		[
			"Exmoor",
			"EXM",
			0,
			[]
		],
		[
			"Highland",
			"HIG",
			0,
			[]
		],
		[
			"Fell",
			"FEL",
			0,
			[]
		],
		[
			"Dales",
			"DAL",
			0,
			[]
		],
		[
			"Eriskay",
			"ERI",
			0,
			[]
		],
		[
			"Haflinger",
			"HAF",
			0,
			["avelignese haflinger"]
		],
		[
			"Islandese",
			"ISL",
			0,
			["icelandic"]
		],
		[
			"Pony Tedesco da Sella",
			"DRP",
			0,
			["deutsches reitpony"]
		],
		[
			"Pony Olandese",
			"PON",
			0,
			[]
		],
		[
			"Pony Francese da Sella",
			"PFS",
			0,
			["poney francais de selle"]
		],
		[
			"Falabella",
			"FAL",
			0,
			[]
		],
		[
			"Miniature Horse",
			"MIN",
			0,
			["cavallo miniatura", "mini horse"]
		],
		[
			"Pony Americano",
			"PAM",
			0,
			[]
		],
		[
			"Pony of the Americas",
			"POA",
			0,
			["poa"]
		],
		[
			"Bosniaco",
			"BOS",
			0,
			[]
		],
		[
			"Huzul",
			"HUZ",
			0,
			["hucul"]
		],
		[
			"Konik",
			"KON",
			0,
			[]
		],
		[
			"Landais",
			"LAN",
			0,
			[]
		],
		[
			"Pottok",
			"POT",
			0,
			[]
		],
		[
			"Caspio",
			"CAS",
			0,
			[]
		],
		[
			"Berbero",
			"BER",
			0,
			["barb"]
		],
		[
			"Arabo-Berbero",
			"ABB",
			0,
			["arabo berbero"]
		],
		[
			"Turkmeno",
			"TUR",
			0,
			[]
		],
		[
			"Marwari",
			"MRW",
			0,
			[]
		],
		[
			"Kathiawari",
			"KAT",
			0,
			[]
		],
		[
			"Mongolo",
			"MNL",
			0,
			[]
		],
		[
			"Przewalski",
			"PRZ",
			0,
			[]
		],
		[
			"Yakuto",
			"YAK",
			0,
			[]
		],
		[
			"Don",
			"DON",
			0,
			[]
		],
		[
			"Budyonny",
			"BUD",
			0,
			["budenny"]
		],
		[
			"Kabardino",
			"KAB",
			0,
			[]
		],
		[
			"Karabakh",
			"KRB",
			0,
			[]
		],
		[
			"Lokai",
			"LOK",
			0,
			[]
		],
		[
			"Kustanai",
			"KUS",
			0,
			[]
		],
		[
			"Waler",
			"WAL",
			0,
			[]
		],
		[
			"Brumby",
			"BRU",
			0,
			[]
		],
		[
			"Australian Stock Horse",
			"ASH",
			0,
			[]
		],
		[
			"Kiger Mustang",
			"KIG",
			0,
			[]
		],
		[
			"Camargue",
			"CAM",
			0,
			[]
		],
		[
			"Merens",
			"MER",
			0,
			["merens"]
		],
		[
			"Henson",
			"HEN",
			0,
			[]
		],
		[
			"Auxois",
			"AUX",
			0,
			[]
		],
		[
			"Poitevin",
			"POI",
			0,
			[]
		],
		[
			"Sorraia",
			"SOR",
			0,
			[]
		],
		[
			"Garrano",
			"GAR",
			0,
			[]
		],
		[
			"Asturcón",
			"AST",
			0,
			["asturcon"]
		],
		[
			"Losino",
			"LOS",
			0,
			[]
		],
		[
			"Marismeño",
			"MRS",
			0,
			["marismeno"]
		],
		[
			"Meticcio / Incrocio",
			"MET",
			0,
			[
				"meticcio",
				"incrocio",
				"mezzosangue"
			]
		],
		[
			"Sella (razza non indicata)",
			"SEL",
			0,
			["sella", "cavallo da sella"]
		],
		[
			"Pony (razza non indicata)",
			"PNY",
			0,
			["pony"]
		],
		[
			"Asino",
			"ASN",
			0,
			[
				"asina",
				"somaro",
				"ciuco"
			]
		],
		[
			"Bardotto",
			"BDT",
			0,
			["bardotta"]
		],
		[
			"Mulo",
			"MUL",
			0,
			["mula"]
		]
	].map(([nome, sigla, italiana, alias]) => ({
		nome,
		sigla,
		italiana: !!italiana,
		alias
	}));
	var RAZZE_DIFFUSE = [
		"PSI",
		"PSA",
		"SIT",
		"MAR",
		"QTR",
		"HAF",
		"AVE",
		"TIT",
		"TFR",
		"AAR",
		"SFR",
		"KWP",
		"HAN",
		"HOL",
		"OLD",
		"PRE",
		"LUS",
		"FRI",
		"APP",
		"PNT",
		"SHE",
		"WEL",
		"MUR",
		"BAR",
		"MET",
		"SEL",
		"PNY"
	];
	var RAZZE_FISSE = [
		"Meticcio / Incrocio",
		"Sella (razza non indicata)",
		"Pony (razza non indicata)"
	];
	var razzeCaricate = false;
	async function caricaRazzeEquo() {
		if (razzeCaricate || typeof DEMO_MODE === "undefined" || DEMO_MODE || typeof sb === "undefined") return;
		razzeCaricate = true;
		try {
			const { data } = await sb.from("equo_razze").select("nome, sigla, italiana, alias, ordine").order("ordine");
			if (data && data.length) RAZZE_EQUO = data.map((r) => ({
				nome: r.nome,
				sigla: r.sigla,
				italiana: r.italiana,
				alias: r.alias || []
			}));
		} catch (e) {
			razzeCaricate = false;
		}
	}
	function razzaNorm(t) {
		return String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ł/g, "l").replace(/Ł/g, "L").toLowerCase().replace(/[^a-z0-9]/g, "");
	}
	function razzaTrova(testo) {
		const n = razzaNorm(testo);
		if (!n) return null;
		return RAZZE_EQUO.find((r) => razzaNorm(r.nome) === n || (r.alias || []).some((a) => razzaNorm(a) === n)) || null;
	}
	function razzaCerca(testo) {
		const n = razzaNorm(testo);
		if (!n) return RAZZE_EQUO.filter((r) => r.italiana).slice(0, 8);
		const parole = String(testo).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").split(/[^a-z0-9]+/).filter(Boolean);
		const punteggio = (r) => {
			const nome = razzaNorm(r.nome), w = r.nome.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").split(/[^a-z0-9]+/);
			if (nome.startsWith(n)) return 0;
			if (parole.every((p) => w.some((x) => x.startsWith(p)))) return 1;
			if (nome.includes(n)) return 2;
			if ((r.alias || []).some((a) => razzaNorm(a).startsWith(n))) return 3;
			if ((r.alias || []).some((a) => razzaNorm(a).includes(n))) return 4;
			return 9;
		};
		return RAZZE_EQUO.map((r, i) => ({
			r,
			p: punteggio(r),
			i
		})).filter((x) => x.p < 9).sort((a, b) => a.p - b.p || (RAZZE_DIFFUSE.indexOf(a.r.sigla) < 0) - (RAZZE_DIFFUSE.indexOf(b.r.sigla) < 0) || b.r.italiana - a.r.italiana || a.i - b.i).slice(0, 8).map((x) => x.r);
	}
	function razzaCampo(id) {
		const inp = document.getElementById(id);
		if (!inp || inp.dataset.razza) return;
		inp.dataset.razza = "1";
		inp.setAttribute("autocomplete", "off");
		const box = document.createElement("div");
		box.className = "rz-wrap";
		inp.parentNode.insertBefore(box, inp);
		box.appendChild(inp);
		const lista = document.createElement("div");
		lista.className = "rz-lista";
		box.appendChild(lista);
		const nota = document.createElement("div");
		nota.className = "rz-nota";
		box.appendChild(nota);
		const mostra = () => {
			caricaRazzeEquo();
			const t = inp.value.trim();
			const trov = razzaCerca(t);
			const fisse = RAZZE_FISSE.filter((f) => !trov.some((r) => r.nome === f)).map((nome) => ({
				nome,
				fissa: true
			}));
			lista.innerHTML = trov.map((r) => `<button type="button" data-v="${escapeHtml(r.nome)}"><span>${escapeHtml(r.nome)}</span><small>${escapeHtml(r.sigla)}</small></button>`).join("") + (trov.length ? "" : "<div class=\"rz-vuoto\">Nessuna razza trovata con «" + escapeHtml(t) + "»</div>") + "<div class=\"rz-sep\"></div>" + fisse.map((f) => `<button type="button" class="rz-fissa" data-v="${escapeHtml(f.nome)}">${escapeHtml(f.nome)}</button>`).join("") + (t.length >= 3 && !trov.length ? `<button type="button" class="rz-altra" data-altra="${escapeHtml(t)}">La mia razza non c'è: «${escapeHtml(t)}»</button>` : "");
			lista.classList.add("aperta");
		};
		const scegli = (valore, altra) => {
			inp.value = valore;
			inp.dataset.ok = "1";
			inp.dataset.altra = altra || "";
			lista.classList.remove("aperta");
			box.classList.remove("rz-errore");
			nota.textContent = altra ? "Razza fuori elenco: avvisiamo Equo per aggiungerla." : "";
			if (altra) razzaSegnala(altra);
		};
		inp.addEventListener("focus", mostra);
		inp.addEventListener("input", () => {
			inp.dataset.ok = "";
			inp.dataset.altra = "";
			nota.textContent = "";
			mostra();
		});
		lista.addEventListener("mousedown", (e) => e.preventDefault());
		lista.addEventListener("click", (e) => {
			const b = e.target.closest("button");
			if (!b) return;
			if (b.dataset.altra) scegli("Altra razza (" + b.dataset.altra + ")", b.dataset.altra);
			else scegli(b.dataset.v);
		});
		inp.addEventListener("blur", () => setTimeout(() => {
			lista.classList.remove("aperta");
			if (!inp.dataset.ok && inp.value.trim()) {
				const r = razzaTrova(inp.value);
				if (r) scegli(r.nome);
			}
		}, 120));
	}
	function razzaImposta(id, valore) {
		razzaCampo(id);
		const inp = document.getElementById(id);
		const r = razzaTrova(valore);
		inp.value = r ? r.nome : valore || "";
		inp.dataset.ok = r || !valore ? "1" : "";
		inp.dataset.iniziale = inp.value;
		inp.dataset.altra = "";
		inp.parentNode.classList.remove("rz-errore");
		inp.parentNode.querySelector(".rz-nota").textContent = "";
	}
	function razzaValore(id) {
		const inp = document.getElementById(id);
		const t = inp.value.trim();
		if (!t) return null;
		if (inp.dataset.ok === "1" || t === inp.dataset.iniziale) return t;
		const r = razzaTrova(t);
		if (r) {
			inp.value = r.nome;
			return r.nome;
		}
		inp.parentNode.classList.add("rz-errore");
		inp.parentNode.querySelector(".rz-nota").textContent = "Scegli la razza dall'elenco (oppure «La mia razza non c'è»).";
		inp.focus();
		return false;
	}
	var razzeSegnalate = /* @__PURE__ */ new Set();
	async function razzaSegnala(testo) {
		const k = razzaNorm(testo);
		if (razzeSegnalate.has(k) || typeof DEMO_MODE === "undefined" || DEMO_MODE || !currentUser) return;
		razzeSegnalate.add(k);
		try {
			await sb.from("ticket_assistenza").insert({
				user_id: currentUser.id,
				app: "scuderia",
				categoria: "suggerimento",
				oggetto: "Nuova razza da aggiungere: " + testo.slice(0, 80),
				descrizione: "Un utente ha inserito una razza che non è nell'elenco Equo: «" + testo + "». Se è una razza vera, aggiungila alla tabella equo_razze con la sua sigla di 3 lettere: i cavalli con quella razza prenderanno la sigla al prossimo salvataggio.",
				email: currentUser.email || "gestione.equo@gmail.com"
			});
		} catch (e) {
			console.warn("razzaSegnala:", e);
		}
	}
	async function saveCavallo() {
		const nome = document.getElementById("cav-nome").value.trim();
		const errBox = document.getElementById("cavallo-error");
		errBox.style.display = "none";
		if (!nome) {
			errBox.textContent = "Inserisci il nome del cavallo.";
			errBox.style.display = "block";
			return;
		}
		if (razzaValore("cav-razza") === false) return;
		const payload = {
			nome,
			tipo_proprieta: document.getElementById("cav-tipo-proprieta").value,
			razza: document.getElementById("cav-razza").value.trim() || null,
			mantello: document.getElementById("cav-mantello").value.trim() || null,
			data_nascita: document.getElementById("cav-nascita").value || null,
			microchip: document.getElementById("cav-microchip").value.trim() || null,
			gruppo_sanguigno: document.getElementById("cav-gruppo-sanguigno").value.trim() || null,
			proprietario: document.getElementById("cav-proprietario").value.trim() || null,
			note: document.getElementById("cav-note").value.trim() || null
		};
		const vecchio = editingCavalloId ? cavalliList.find((x) => x.id === editingCavalloId) : null;
		const sesso = document.getElementById("cav-sesso").value || null, attivita = document.getElementById("cav-attivita").value.trim().slice(0, 60) || null;
		if (sesso || vecchio?.sesso) payload.sesso = sesso;
		if (attivita || vecchio?.attivita) payload.attivita = attivita;
		const fotoFile = document.getElementById("cav-foto-file").files[0] || null;
		const codiceProprietario = document.getElementById("cav-codice-proprietario").value.trim().toUpperCase();
		const saveBtn = document.getElementById("cavallo-save-btn");
		try {
			saveBtn.disabled = true;
			let savedCavalloId = editingCavalloId;
			if (DEMO_MODE) {
				if (fotoFile) payload.foto_url = await new Promise((res) => {
					const reader = new FileReader();
					reader.onload = () => res(reader.result);
					reader.readAsDataURL(fotoFile);
				});
				if (editingCavalloId) {
					const idx = demoState.cavalli.findIndex((c) => c.id === editingCavalloId);
					if (idx >= 0) demoState.cavalli[idx] = {
						...demoState.cavalli[idx],
						...payload,
						updated_at: (/* @__PURE__ */ new Date()).toISOString()
					};
				} else {
					savedCavalloId = "c" + (demoIdCounter++ + 100);
					demoState.cavalli.push({
						id: savedCavalloId,
						centro_id: demoState.centro.id,
						...payload,
						updated_at: (/* @__PURE__ */ new Date()).toISOString()
					});
				}
			} else if (editingCavalloId) {
				if (fotoFile) payload.foto_url = await uploadCavalloFoto(fotoFile, editingCavalloId);
				const { error } = await sb.from("scuderia_cavalli").update(payload).eq("id", editingCavalloId);
				if (error) throw error;
			} else {
				const { data, error } = await sb.from("scuderia_cavalli").insert({
					centro_id: currentCentro.id,
					...payload
				}).select().single();
				if (error) throw error;
				savedCavalloId = data.id;
				if (fotoFile) {
					const foto_url = await uploadCavalloFoto(fotoFile, data.id);
					await sb.from("scuderia_cavalli").update({ foto_url }).eq("id", data.id);
				}
			}
			await loadCavalli();
			if (currentCavalloId) renderCavalloDetail();
			else renderCavalliList();
			closeModal("modal-cavallo");
			showToast(editingCavalloId ? "Cavallo aggiornato." : "Cavallo aggiunto.");
			if (codiceProprietario) {
				const esito = await collegaProprietarioDaCodice(codiceProprietario, savedCavalloId, payload.proprietario);
				if (esito.ok) {
					const nomeProprietario = esito.nome || "il proprietario";
					await proponiImportCavalli(esito.membroId, nomeProprietario, () => apriConfirmChatCliente(nomeProprietario, esito.membroId));
				} else showToast(esito.error + " Il cavallo è stato comunque salvato.");
			} else if (payload.microchip && !DEMO_MODE) {
				const { data, error } = await sb.rpc("sync_microchip_link", { p_microchip: payload.microchip });
				if (!error) {
					await loadTeam();
					renderClientiChatList();
				}
			}
		} catch (err) {
			errBox.textContent = err.message || "Errore nel salvataggio.";
			errBox.style.display = "block";
		} finally {
			saveBtn.disabled = false;
		}
	}
	async function collegaProprietarioDaCodice(codice, cavalloId, nomeFallback) {
		try {
			let membroId, nome;
			if (DEMO_MODE) {
				if (codice !== "EQUO-OWN-DEMO") return {
					ok: false,
					error: "Codice non valido."
				};
				const esistente = teamList.find((m) => m.user_id === "u3");
				if (esistente) {
					membroId = esistente.id;
					nome = esistente.nome_visualizzato;
				} else {
					membroId = "m" + (demoIdCounter++ + 500);
					nome = "Giulia Verdi";
					const nuovo = {
						id: membroId,
						user_id: "u3",
						ruolo: "proprietario",
						nome_visualizzato: nome,
						livello: "1",
						permessi: {}
					};
					demoState.membri.push(nuovo);
					teamList.push(nuovo);
				}
			} else {
				const { data, error } = await sb.rpc("link_proprietario_da_codice", {
					p_centro_id: currentCentro.id,
					p_codice: codice,
					p_nome_fallback: nomeFallback || null
				});
				if (error || !data) return {
					ok: false,
					error: "Codice non valido."
				};
				const row = Array.isArray(data) ? data[0] : data;
				membroId = row.membro_id;
				nome = row.nome;
				if (cavalloId) await sb.from("scuderia_cavalli").update({
					proprietario_membro_id: membroId,
					codice_app_proprietario: codice
				}).eq("id", cavalloId);
				await loadTeam();
			}
			renderClientiChatList();
			return {
				ok: true,
				membroId,
				nome
			};
		} catch (err) {
			return {
				ok: false,
				error: err.message || "Codice non valido."
			};
		}
	}
	// equo-scuderia-src/src/sezioni/cavalli/moduli/041-scheda-cavallo-pdf-brandizzato-equo-qr-s.js
	var PDF_VERDE = [
		20,
		72,
		44
	];
	var PDF_VERDE_SCURO = [
		11,
		52,
		30
	];
	var PDF_ORO = [
		232,
		176,
		75
	];
	var PDF_BEIGE = [
		247,
		243,
		234
	];
	var PDF_GRIGIO = [
		110,
		118,
		112
	];
	function needsPdfUpdate(c) {
		if (!c.pdf_url || !c.pdf_generato_at) return true;
		const genTime = new Date(c.pdf_generato_at).getTime();
		if (c.updated_at && new Date(c.updated_at).getTime() > genTime) return true;
		return eventiAll.filter((e) => e.cavallo_id === c.id).some((e) => e.updated_at && new Date(e.updated_at).getTime() > genTime);
	}
	function refreshSchedaPdfUI(c) {
		const btn = document.getElementById("scheda-pdf-btn");
		const status = document.getElementById("scheda-pdf-status");
		const qrBox = document.getElementById("scheda-qr-box");
		const qrDiv = document.getElementById("scheda-qr");
		const azioni = document.getElementById("scheda-pdf-azioni");
		qrDiv.innerHTML = "";
		if (typeof codiceValidatoScud === "function" && !codiceValidatoScud(c)) {
			btn.style.display = "none";
			qrBox.style.display = "none";
			azioni.style.display = "none";
			status.innerHTML = "La scheda PDF e il QR ufficiali si sbloccano quando il codice del cavallo e <b>Validato</b>: completa i dati e fai le due conferme nel riquadro qui sopra.";
			return;
		}
		if (!c.pdf_url) {
			btn.style.display = "";
			btn.innerHTML = `<i class="fa-solid fa-file-pdf"></i> Genera PDF`;
			status.textContent = "Nessuna scheda generata ancora.";
			qrBox.style.display = "none";
			azioni.style.display = "none";
			return;
		}
		const vecchio = needsPdfUpdate(c);
		btn.style.display = vecchio ? "" : "none";
		btn.innerHTML = `<i class="fa-solid fa-arrows-rotate"></i> Aggiorna PDF`;
		status.innerHTML = vecchio ? `⚠️ La scheda è stata modificata dopo l'ultimo PDF (generato il ${formatDate(c.pdf_generato_at.slice(0, 10))}): scaricandolo, inviandolo o stampandolo viene aggiornato da solo.` : "Scheda aggiornata — generata il " + formatDate(c.pdf_generato_at.slice(0, 10)) + ".";
		qrBox.style.display = "block";
		azioni.style.display = "flex";
		new QRCode(qrDiv, {
			text: urlPdfPulito(c.pdf_url),
			width: 140,
			height: 140
		});
	}
	var urlPdfPulito = (u) => String(u || "").split("?")[0];
	async function handleSchedaPdf() {
		const c = cavalliList.find((x) => x.id === currentCavalloId);
		if (!c) return;
		if (typeof codiceValidatoScud === "function" && !codiceValidatoScud(c)) {
			showToast("La scheda PDF si sblocca quando il codice e Validato.");
			return;
		}
		const btn = document.getElementById("scheda-pdf-btn");
		btn.disabled = true;
		btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Generazione...`;
		try {
			await generateSchedaPdf(c);
			showToast("Scheda PDF generata.");
		} catch (err) {
			console.error("pdf:", err);
			showToast("Errore nella generazione del PDF.");
		} finally {
			btn.disabled = false;
		}
	}
	async function pdfCavalloAggiornato() {
		let c = cavalliList.find((x) => x.id === currentCavalloId);
		if (!c) return null;
		if (typeof codiceValidatoScud === "function" && !codiceValidatoScud(c)) {
			showToast("La scheda PDF si sblocca quando il codice e Validato.");
			return null;
		}
		if (needsPdfUpdate(c)) {
			showToast("Aggiorno la scheda PDF…");
			await generateSchedaPdf(c);
			c = cavalliList.find((x) => x.id === currentCavalloId);
		}
		return c;
	}
	var nomeFilePdf = (c) => `Scheda_${String(c.nome || "cavallo").replace(/[^\wÀ-ÿ]+/g, "_")}.pdf`;
	async function blobPdfCavallo(c) {
		const res = await fetch(DEMO_MODE ? c.pdf_url : urlPdfPulito(c.pdf_url) + "?v=" + Date.now(), { cache: "no-store" });
		if (!res.ok) throw new Error("download");
		return await res.blob();
	}
	async function scaricaSchedaPdf() {
		try {
			const c = await pdfCavalloAggiornato();
			if (!c) return;
			const blob = await blobPdfCavallo(c);
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = nomeFilePdf(c);
			document.body.appendChild(a);
			a.click();
			a.remove();
			setTimeout(() => URL.revokeObjectURL(url), 2e4);
		} catch (e) {
			console.error(e);
			showToast("Download non riuscito, riprova.");
		}
	}
	async function stampaSchedaPdf() {
		try {
			const c = await pdfCavalloAggiornato();
			if (!c) return;
			const blob = await blobPdfCavallo(c);
			const url = URL.createObjectURL(blob);
			let fr = document.getElementById("pdf-stampa-frame");
			if (fr) fr.remove();
			fr = document.createElement("iframe");
			fr.id = "pdf-stampa-frame";
			fr.style.cssText = "position:fixed;right:0;bottom:0;width:1px;height:1px;border:0;opacity:0";
			fr.src = url;
			fr.onload = () => {
				try {
					fr.contentWindow.focus();
					fr.contentWindow.print();
				} catch (e) {
					window.open(url, "_blank");
				}
			};
			document.body.appendChild(fr);
		} catch (e) {
			console.error(e);
			showToast("Stampa non riuscita, riprova.");
		}
	}
	async function apriInviaSchedaChat() {
		const c = cavalliList.find((x) => x.id === currentCavalloId);
		if (!c) return;
		const sel = document.getElementById("pdf-chat-dest");
		if (!DEMO_MODE && !professionistiList.length) await loadProfessionisti();
		const persone = teamList.filter((m) => m.user_id && m.user_id !== currentUser?.id);
		const pro = professionistiList.filter((p) => p.categoria === "maniscalco" && p.stato === "attivo");
		const nomiPro = new Set(pro.map((p) => (p.nome || "").trim().toLowerCase()));
		const nomiTeam = new Set(persone.map((m) => (m.nome_visualizzato || "").trim().toLowerCase()));
		const etichetta = (nome, ruolo, doppio) => escapeHtml(nome) + (doppio ? ` · come ${ruolo}` : "");
		const gruppo = (titolo, lista, ruolo) => lista.length ? `<optgroup label="${titolo}">${lista.map((m) => {
			const nome = m.nome_visualizzato || RUOLO_LABELS[m.ruolo] || "Membro";
			return `<option value="m:${m.id}">${etichetta(nome, ruolo, nomiPro.has(nome.trim().toLowerCase()))}</option>`;
		}).join("")}</optgroup>` : "";
		const gruppoPro = pro.length ? `<optgroup label="Maniscalchi collegati">${pro.map((p) => `<option value="p:${p.cliente_id}">${etichetta(p.nome || "Maniscalco", "maniscalco", nomiTeam.has((p.nome || "").trim().toLowerCase()))}</option>`).join("")}</optgroup>` : "";
		sel.innerHTML = gruppo("Clienti / proprietari", persone.filter((m) => m.ruolo === "proprietario"), "proprietario") + gruppo("Team", persone.filter((m) => m.ruolo !== "proprietario"), "membro del team") + gruppoPro;
		if (!sel.options.length) {
			showToast("Nessuna persona collegata a cui inviarla: collega il proprietario, il team o un maniscalco.");
			return;
		}
		if (c.proprietario_membro_id && [...sel.options].some((o) => o.value === "m:" + c.proprietario_membro_id)) sel.value = "m:" + c.proprietario_membro_id;
		document.getElementById("pdf-chat-testo").value = `Ecco la scheda aggiornata di ${c.nome} 🐴`;
		openModal("modal-pdf-chat");
	}
	async function inviaSchedaChat() {
		const btn = document.getElementById("pdf-chat-btn");
		btn.disabled = true;
		try {
			const c = await pdfCavalloAggiornato();
			if (!c) return;
			const scelta = document.getElementById("pdf-chat-dest").value || "";
			const testo = document.getElementById("pdf-chat-testo").value.trim();
			if (scelta.startsWith("p:")) {
				const pro = professionistiList.find((p) => p.cliente_id === scelta.slice(2));
				if (!pro) {
					showToast("Scegli a chi inviarla.");
					return;
				}
				if (DEMO_MODE) {
					showToast("Nella demo la chat con i maniscalchi non è attiva.");
					return;
				}
				const res = await fetch(urlPdfPulito(c.pdf_url) + "?v=" + Date.now());
				if (!res.ok) throw new Error("PDF non disponibile");
				const url = await caricaFileChatPro(await res.blob(), "pdf", "application/pdf");
				{
					const invia = async (tipo, t, fu, fn) => {
						const { data, error } = await sb.rpc("scuderia_invia_messaggio_professionista", {
							p_cliente_id: pro.cliente_id,
							p_tipo: tipo,
							p_testo: t || null,
							p_file_url: fu || null,
							p_file_nome: fn || null
						});
						if (error || !data?.ok) throw new Error(data && data.errore || error?.message || "riprova");
					};
					if (testo) await invia("testo", testo);
					await invia("documento", null, url, nomeFilePdf(c));
				}
				closeModal("modal-pdf-chat");
				showToast(`Scheda inviata nella chat con ${pro.nome || "il maniscalco"} (Professionisti).`);
				return;
			}
			const m = teamList.find((x) => x.id === scelta.replace(/^m:/, ""));
			if (!m) {
				showToast("Scegli a chi inviarla.");
				return;
			}
			const file_url = DEMO_MODE ? c.pdf_url : urlPdfPulito(c.pdf_url) + "?v=" + Date.now();
			if (DEMO_MODE) {
				demoState.chat = demoState.chat || {};
				demoState.chat[m.id] = demoState.chat[m.id] || [];
				if (testo) demoState.chat[m.id].push({
					id: "chat" + (demoIdCounter++ + 900),
					mittente_user_id: currentUser.id,
					testo,
					created_at: (/* @__PURE__ */ new Date()).toISOString()
				});
				demoState.chat[m.id].push({
					id: "chat" + (demoIdCounter++ + 900),
					mittente_user_id: currentUser.id,
					testo: null,
					tipo: "documento",
					file_url,
					file_nome: nomeFilePdf(c),
					created_at: (/* @__PURE__ */ new Date()).toISOString()
				});
			} else {
				if (testo) {
					const r = await sb.from("chat_messaggi").insert({
						centro_id: currentCentro.id,
						membro_id: m.id,
						mittente_user_id: currentUser.id,
						testo
					});
					if (r.error) throw r.error;
				}
				const { error } = await sb.from("chat_messaggi").insert({
					centro_id: currentCentro.id,
					membro_id: m.id,
					mittente_user_id: currentUser.id,
					testo: null,
					tipo: "documento",
					file_url,
					file_nome: nomeFilePdf(c)
				});
				if (error) throw error;
			}
			closeModal("modal-pdf-chat");
			showToast(`Scheda inviata in chat a ${m.nome_visualizzato || "destinatario"}.`);
		} catch (e) {
			console.error("inviaSchedaChat:", e);
			showToast("Invio non riuscito: " + (e?.message || "riprova"));
		} finally {
			btn.disabled = false;
		}
	}
	async function fotoPerPdf(url) {
		try {
			const blob = await (await fetch(url)).blob();
			let bmp = null;
			try {
				bmp = await createImageBitmap(blob, { imageOrientation: "from-image" });
			} catch (e) {
				bmp = null;
			}
			if (!bmp) bmp = await new Promise((ok, ko) => {
				const i = new Image();
				i.onload = () => ok(i);
				i.onerror = ko;
				i.src = URL.createObjectURL(blob);
			});
			const w = bmp.width, h = bmp.height, lato = Math.min(w, h), out = 700;
			const cv = document.createElement("canvas");
			cv.width = out;
			cv.height = out;
			cv.getContext("2d").drawImage(bmp, (w - lato) / 2, (h - lato) / 2, lato, lato, 0, 0, out, out);
			return cv.toDataURL("image/jpeg", .85);
		} catch (e) {
			console.error("foto pdf:", e);
			return null;
		}
	}
	async function immagineDataUrl(src) {
		try {
			const b = await (await fetch(src)).blob();
			return await new Promise((ok) => {
				const fr = new FileReader();
				fr.onload = () => ok(fr.result);
				fr.onerror = () => ok(null);
				fr.readAsDataURL(b);
			});
		} catch (e) {
			return null;
		}
	}
	function qrDataUrl(testo) {
		return new Promise((ok) => {
			const d = document.createElement("div");
			d.style.cssText = "position:fixed;left:-9999px;top:0";
			document.body.appendChild(d);
			try {
				new QRCode(d, {
					text: testo,
					width: 256,
					height: 256,
					colorDark: "#0b341e",
					colorLight: "#ffffff"
				});
			} catch (e) {
				d.remove();
				return ok(null);
			}
			setTimeout(() => {
				const cv = d.querySelector("canvas");
				const img = d.querySelector("img");
				const u = cv ? cv.toDataURL("image/png") : img?.src || null;
				d.remove();
				ok(u);
			}, 60);
		});
	}
	function cornicePdf(doc) {
		const H = 297;
		doc.setDrawColor(...PDF_VERDE);
		doc.setLineWidth(.6);
		doc.rect(7, 7, 196, 283);
		doc.setDrawColor(...PDF_ORO);
		doc.setLineWidth(.3);
		doc.rect(9.2, 9.2, 191.6, 278.6);
		const angolo = (x, y, sx, sy) => {
			doc.setFillColor(...PDF_VERDE);
			doc.triangle(x, y, x + 16 * sx, y, x, y + 16 * sy, "F");
			doc.setFillColor(...PDF_ORO);
			doc.triangle(x + 2.2 * sx, y + 2.2 * sy, x + 9 * sx, y + 2.2 * sy, x + 2.2 * sx, y + 9 * sy, "F");
			doc.setDrawColor(...PDF_ORO);
			doc.setLineWidth(.3);
			doc.line(x + 19 * sx, y, x, y + 19 * sy);
		};
		angolo(7, 7, 1, 1);
		angolo(203, 7, -1, 1);
		angolo(7, 290, 1, -1);
		angolo(203, 290, -1, -1);
		const rombo = (cx, cy, r, col) => {
			doc.setFillColor(...col);
			doc.triangle(cx - r, cy, cx, cy - r, cx + r, cy, "F");
			doc.triangle(cx - r, cy, cx, cy + r, cx + r, cy, "F");
		};
		for (let x = 40; x <= 170; x += 16) {
			rombo(x, 7, x === 105 ? 1.9 : 1.1, x === 105 ? PDF_ORO : PDF_VERDE);
			rombo(x, 290, x === 105 ? 1.9 : 1.1, x === 105 ? PDF_ORO : PDF_VERDE);
		}
		for (let y = 44; y <= 253; y += 18) {
			const m = Math.abs(y - H / 2) < 9;
			rombo(7, y, m ? 1.9 : 1.1, m ? PDF_ORO : PDF_VERDE);
			rombo(203, y, m ? 1.9 : 1.1, m ? PDF_ORO : PDF_VERDE);
		}
	}
	async function generateSchedaPdf(c) {
		const { jsPDF } = window.jspdf;
		const doc = new jsPDF({
			unit: "mm",
			format: "a4"
		}), L = 20, R = 190;
		const path = `${currentCentro?.id}/${c.id}.pdf`;
		const urlFinale = DEMO_MODE ? "https://scuderia.equohub.com" : sb.storage.from("cavalli-pdf").getPublicUrl(path).data.publicUrl;
		const [logo, foto, qr] = await Promise.all([
			immagineDataUrl("assets/logo-equo.png"),
			c.foto_url ? fotoPerPdf(c.foto_url) : null,
			qrDataUrl(urlFinale)
		]);
		const nuovaPagina = () => {
			doc.addPage();
			cornicePdf(doc);
			return 26;
		};
		cornicePdf(doc);
		if (logo) doc.addImage(logo, "PNG", L, 15, 36, 18);
		doc.setFont("helvetica", "bold");
		doc.setFontSize(8.5);
		doc.setTextColor(...PDF_ORO);
		doc.text("SCHEDA CAVALLO", R, 21, {
			align: "right",
			charSpace: 1.2
		});
		doc.setFont("helvetica", "normal");
		doc.setFontSize(9.5);
		doc.setTextColor(...PDF_GRIGIO);
		doc.text(currentCentro?.nome || "", R, 27, { align: "right" });
		doc.setDrawColor(...PDF_ORO);
		doc.setLineWidth(.5);
		doc.line(L, 38, R, 38);
		let y = 52;
		doc.setFont("helvetica", "bold");
		doc.setFontSize(26);
		doc.setTextColor(...PDF_VERDE_SCURO);
		doc.text(c.nome || "Cavallo", L, y);
		doc.setFont("helvetica", "normal");
		doc.setFontSize(11);
		doc.setTextColor(...PDF_GRIGIO);
		doc.text([
			c.razza,
			c.mantello,
			TIPO_PROPRIETA_LABELS[c.tipo_proprieta]
		].filter(Boolean).join("  ·  ") || " ", L, y + 7);
		if (c.codice_equo) {
			doc.setFont("courier", "bold");
			doc.setFontSize(11);
			doc.setTextColor(...PDF_VERDE_SCURO);
			doc.text("Codice Equo " + c.codice_equo, L, y + 13);
			doc.setFont("helvetica", "normal");
		}
		const fx = 138, fy = 44;
		if (foto) {
			doc.setFillColor(...PDF_ORO);
			doc.roundedRect(136.8, 42.8, 54.4, 54.4, 3, 3, "F");
			doc.addImage(foto, "JPEG", fx, fy, 52, 52);
		} else {
			doc.setFillColor(...PDF_BEIGE);
			doc.roundedRect(fx, fy, 52, 52, 3, 3, "F");
			doc.setFontSize(9);
			doc.setTextColor(...PDF_GRIGIO);
			doc.text("Foto non inserita", 164, 71, { align: "center" });
		}
		y = 70;
		[
			["Data di nascita", c.data_nascita ? formatDate(c.data_nascita) : "—"],
			["Microchip", c.microchip || "—"],
			["Gruppo sanguigno", c.gruppo_sanguigno || "—"],
			["Proprietario", c.proprietario || "—"],
			["Sesso", {
				femmina: "Femmina",
				castrone: "Castrone",
				stallone: "Stallone"
			}[c.sesso] || "—"],
			["Attività", c.attivita || "—"]
		].forEach(([k, v], i) => {
			const cx = L + i % 2 * 60, cy = y + Math.floor(i / 2) * 13;
			doc.setFont("helvetica", "bold");
			doc.setFontSize(7.5);
			doc.setTextColor(...PDF_GRIGIO);
			doc.text(k.toUpperCase(), cx, cy, { charSpace: .4 });
			doc.setFont("helvetica", "normal");
			doc.setFontSize(11);
			doc.setTextColor(25, 35, 30);
			doc.text(doc.splitTextToSize(String(v), 56)[0], cx, cy + 5.5);
		});
		y = 104;
		if (c.note) {
			doc.setFillColor(...PDF_BEIGE);
			const righe = doc.splitTextToSize(c.note, 160);
			const h = 8 + righe.length * 4.6;
			doc.roundedRect(L, y, 170, h, 2.5, 2.5, "F");
			doc.setFont("helvetica", "bold");
			doc.setFontSize(7.5);
			doc.setTextColor(...PDF_GRIGIO);
			doc.text("NOTE", 25, y + 5.5);
			doc.setFont("helvetica", "normal");
			doc.setFontSize(10);
			doc.setTextColor(25, 35, 30);
			doc.text(righe, 25, y + 10.5);
			y += h + 8;
		} else y += 2;
		const titolo = (t) => {
			doc.setFont("helvetica", "bold");
			doc.setFontSize(13);
			doc.setTextColor(...PDF_VERDE_SCURO);
			doc.text(t, L, y);
			doc.setDrawColor(...PDF_ORO);
			doc.setLineWidth(.8);
			doc.line(L, y + 2, 34, y + 2);
			y += 9;
		};
		titolo("Scadenzario sanitario");
		const scad = scadenzarioFor(c.id);
		const colori = {
			red: [
				201,
				75,
				64
			],
			yellow: [
				214,
				150,
				40
			],
			green: [
				47,
				125,
				70
			],
			gray: [
				150,
				150,
				150
			]
		};
		const bw = 82;
		TIPO_ORDER.forEach((tipo, i) => {
			const s = scad[tipo], bx = L + i % 2 * 88, by = y + Math.floor(i / 2) * 20;
			doc.setFillColor(...PDF_BEIGE);
			doc.roundedRect(bx, by, bw, 16, 2.5, 2.5, "F");
			doc.setFillColor(...colori[s.status]);
			doc.circle(bx + 6, by + 8, 1.9, "F");
			doc.setFont("helvetica", "bold");
			doc.setFontSize(10.5);
			doc.setTextColor(25, 35, 30);
			doc.text(TIPO_LABELS[tipo], bx + 11, by + 6.5);
			doc.setFont("helvetica", "normal");
			doc.setFontSize(8.5);
			doc.setTextColor(...PDF_GRIGIO);
			doc.text(s.ultimo ? `Ultimo ${formatDate(s.ultimo.data_evento)}${s.ultimo.data_scadenza ? " · scadenza " + formatDate(s.ultimo.data_scadenza) : ""}` : "Mai registrato", bx + 11, by + 11.8);
			doc.setFont("helvetica", "bold");
			doc.setFontSize(7.5);
			doc.setTextColor(...colori[s.status]);
			doc.text(etichettaStato(s).toUpperCase(), bx + bw - 4, by + 6.5, { align: "right" });
		});
		y += 46;
		titolo("Storico eventi");
		const eventiCavallo = eventiAll.filter((e) => e.cavallo_id === c.id).sort((a, b) => new Date(b.data_evento) - new Date(a.data_evento));
		const intest = () => {
			doc.setFillColor(...PDF_VERDE);
			doc.rect(L, y - 4.5, 170, 7, "F");
			doc.setFont("helvetica", "bold");
			doc.setFontSize(8);
			doc.setTextColor(255, 255, 255);
			doc.text("DATA", 23, y);
			doc.text("TIPO", 48, y);
			doc.text("SCADENZA", 88, y);
			doc.text("NOTE", 116, y);
			y += 7;
		};
		if (!eventiCavallo.length) {
			doc.setFont("helvetica", "normal");
			doc.setFontSize(10);
			doc.setTextColor(...PDF_GRIGIO);
			doc.text("Nessun evento registrato.", L, y);
			y += 6;
		} else {
			intest();
			eventiCavallo.forEach((e, i) => {
				const tipoLabel = e.tipo === "altro" ? e.tipo_altro || "Altro" : TIPO_LABELS[e.tipo];
				let nota = String(e.note || "");
				if (nota.toLowerCase().startsWith(String(tipoLabel).toLowerCase() + " — ")) nota = nota.slice(String(tipoLabel).length + 3);
				const righe = doc.splitTextToSize(nota || "—", 71);
				const h = Math.max(7, righe.length * 4.2 + 3);
				if (y + h > 262) {
					y = nuovaPagina();
					intest();
				}
				if (i % 2 === 0) {
					doc.setFillColor(...PDF_BEIGE);
					doc.rect(L, y - 4.6, 170, h, "F");
				}
				doc.setFont("helvetica", "normal");
				doc.setFontSize(9);
				doc.setTextColor(25, 35, 30);
				doc.text(formatDate(e.data_evento), 23, y);
				doc.setFont("helvetica", "bold");
				doc.text(doc.splitTextToSize(tipoLabel, 38)[0], 48, y);
				doc.setFont("helvetica", "normal");
				doc.text(e.data_scadenza ? formatDate(e.data_scadenza) : "—", 88, y);
				doc.setTextColor(...PDF_GRIGIO);
				doc.text(righe, 116, y);
				y += h;
			});
		}
		if (qr) {
			doc.addImage(qr, "PNG", 166, 258, 20, 20);
			doc.setFontSize(6);
			doc.setTextColor(...PDF_GRIGIO);
			doc.text("Scansiona: versione aggiornata", 176, 281, { align: "center" });
		}
		doc.setDrawColor(...PDF_ORO);
		doc.setLineWidth(.3);
		doc.line(L, 270, 160, 270);
		doc.setFont("helvetica", "normal");
		doc.setFontSize(8);
		doc.setTextColor(...PDF_GRIGIO);
		doc.text(`Generato con Equo Scuderia il ${formatDate(isoLoc(/* @__PURE__ */ new Date()))}  ·  equohub.com`, L, 275);
		doc.setFont("helvetica", "bold");
		doc.setTextColor(...PDF_VERDE);
		doc.text("Prenditi cura del tuo cavallo", L, 279.5);
		const blob = doc.output("blob");
		const generato_at = (/* @__PURE__ */ new Date()).toISOString();
		let pdf_url;
		if (DEMO_MODE) {
			pdf_url = URL.createObjectURL(blob);
			const idx = demoState.cavalli.findIndex((x) => x.id === c.id);
			if (idx >= 0) demoState.cavalli[idx] = {
				...demoState.cavalli[idx],
				pdf_url,
				pdf_generato_at: generato_at
			};
		} else {
			const { error: upErr } = await sb.storage.from("cavalli-pdf").upload(path, blob, {
				upsert: true,
				contentType: "application/pdf"
			});
			if (upErr) throw upErr;
			pdf_url = urlFinale + "?t=" + Date.now();
			const { error } = await sb.from("scuderia_cavalli").update({
				pdf_url,
				pdf_generato_at: generato_at
			}).eq("id", c.id);
			if (error) throw error;
		}
		await loadCavalli();
		renderCavalloDetail();
	}
	function etichettaStato(s) {
		return s.ultimo && !s.ultimo.data_scadenza ? "Senza scadenza" : STATUS_LABELS[s.status];
	}
	function openCavalloForm(id) {
		editingCavalloId = id || null;
		document.getElementById("cavallo-error").style.display = "none";
		document.getElementById("cav-foto-file").value = "";
		const preview = document.getElementById("cav-foto-preview");
		if (editingCavalloId) {
			const c = cavalliList.find((x) => x.id === editingCavalloId);
			document.getElementById("modal-cavallo-title").textContent = "Modifica cavallo";
			document.getElementById("cav-nome").value = c?.nome || "";
			document.getElementById("cav-tipo-proprieta").value = c?.tipo_proprieta || "proprieta";
			razzaImposta("cav-razza", c?.razza || "");
			document.getElementById("cav-mantello").value = c?.mantello || "";
			document.getElementById("cav-sesso").value = c?.sesso || "";
			document.getElementById("cav-attivita").value = c?.attivita || "";
			document.getElementById("cav-nascita").value = c?.data_nascita || "";
			document.getElementById("cav-microchip").value = c?.microchip || "";
			document.getElementById("cav-gruppo-sanguigno").value = c?.gruppo_sanguigno || "";
			document.getElementById("cav-proprietario").value = c?.proprietario || "";
			document.getElementById("cav-codice-proprietario").value = "";
			document.getElementById("cav-note").value = c?.note || "";
			preview.innerHTML = c?.foto_url ? `<img src="${escapeHtml(urlSicuro(c.foto_url))}" style="width:80px;height:80px;object-fit:cover;border-radius:8px">` : "";
		} else {
			document.getElementById("modal-cavallo-title").textContent = "Nuovo cavallo";
			document.getElementById("cav-tipo-proprieta").value = "proprieta";
			razzaImposta("cav-razza", "");
			[
				"cav-nome",
				"cav-mantello",
				"cav-sesso",
				"cav-attivita",
				"cav-nascita",
				"cav-microchip",
				"cav-gruppo-sanguigno",
				"cav-proprietario",
				"cav-codice-proprietario",
				"cav-note"
			].forEach((id) => document.getElementById(id).value = "");
			preview.innerHTML = "";
		}
		openModal("modal-cavallo");
	}
	async function uploadCavalloFoto(file, cavalloId) {
		const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
		const path = `${currentCentro.id}/${cavalloId}.${ext}`;
		const { error } = await sb.storage.from("cavalli-foto").upload(path, file, { upsert: true });
		if (error) throw error;
		const { data } = sb.storage.from("cavalli-foto").getPublicUrl(path);
		return data.publicUrl + "?t=" + Date.now();
	}
	// equo-scuderia-src/src/sezioni/cavalli/moduli/040-allegati-del-cavallo-condivisi-con-propr.js
	var allegatiScud = [];
	var allegatiScudCavallo = null;
	async function caricaAllegatiScud(cavalloId) {
		allegatiScudCavallo = cavalloId;
		const box = document.getElementById("scud-allegati");
		if (!box) return;
		if (DEMO_MODE) {
			box.innerHTML = "<div style=\"color:var(--muted);font-size:13px\">In demo gli allegati non sono disponibili.</div>";
			return;
		}
		const { data, error } = await sb.rpc("equo_allegati_cavallo", {
			p_vista: "scuderia",
			p_id: cavalloId
		});
		if (allegatiScudCavallo !== cavalloId) return;
		if (error) {
			box.innerHTML = "<div style=\"color:var(--muted);font-size:13px\">Allegati non disponibili ora. Riprova più tardi.</div>";
			return;
		}
		allegatiScud = data || [];
		const chi = {
			maniscalco: "dal maniscalco",
			proprietario: "dal proprietario",
			scuderia: "dalla scuderia"
		};
		box.innerHTML = allegatiScud.length ? allegatiScud.map((a) => {
			const pdf = (a.mime || "").includes("pdf") || /\.pdf$/i.test(a.nome);
			const kb = a.byte ? a.byte > 1048576 ? (a.byte / 1048576).toFixed(1).replace(".", ",") + " MB" : Math.max(1, Math.round(a.byte / 1024)) + " KB" : "";
			return `<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border)">
      <div style="width:38px;height:38px;border-radius:10px;background:var(--muted-bg);display:flex;align-items:center;justify-content:center;font-size:10.5px;font-weight:800;flex-shrink:0">${pdf ? "PDF" : "FOTO"}</div>
      <div style="flex:1;min-width:0"><div style="font-weight:600;font-size:13.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHtml(a.nome)}</div>
        <div style="color:var(--muted);font-size:12px">${a.mio ? "caricato da te" : "caricato " + (chi[a.autore_ruolo] || "") + (a.autore_nome ? " " + escapeHtml(a.autore_nome) : "")} · ${new Date(a.created_at).toLocaleDateString("it-IT")}${kb ? " · " + kb : ""}</div></div>
      <button class="btn btn-outline btn-sm" onclick="apriAllegatoScud('${a.id}', this)">Apri</button>
      ${a.mio ? `<button class="btn btn-outline btn-sm" style="color:var(--danger, #c0392b)" onclick="eliminaAllegatoScud('${a.id}')">Elimina</button>` : ""}
    </div>`;
		}).join("") : "<div style=\"color:var(--muted);font-size:13px\">Nessun allegato per questo cavallo.</div>";
	}
	async function caricaAllegatoScud(input) {
		const f = input.files && input.files[0];
		input.value = "";
		const id = allegatiScudCavallo;
		if (!f || !id) return;
		if (DEMO_MODE) {
			showToast("In demo gli allegati non sono disponibili.");
			return;
		}
		if (f.size > 15728640) {
			showToast("File troppo grande: massimo 15 MB");
			return;
		}
		if (!/^(application\/pdf|image\/)/.test(f.type || "")) {
			showToast("Puoi caricare PDF o foto");
			return;
		}
		showToast("Caricamento in corso…");
		const est = (f.name.match(/\.[a-z0-9]{1,5}$/i) || [""])[0].toLowerCase();
		const path = `${currentUser.id}/${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}${est}`;
		const up = await sb.storage.from("cavalli-allegati").upload(path, f, { contentType: f.type || void 0 });
		if (up.error) {
			showToast("Caricamento non riuscito: " + up.error.message);
			return;
		}
		const { data, error } = await sb.rpc("equo_aggiungi_allegato", {
			p_vista: "scuderia",
			p_id: id,
			p_nome: f.name,
			p_path: path,
			p_mime: f.type || null,
			p_byte: f.size
		});
		if (error || !data?.ok) {
			await sb.storage.from("cavalli-allegati").remove([path]);
			showToast(data && data.errore || "Caricamento non riuscito, riprova.");
			return;
		}
		showToast("Allegato caricato");
		await caricaAllegatiScud(id);
	}
	async function apriAllegatoScud(id, btn) {
		const a = allegatiScud.find((x) => x.id === id);
		if (!a) return;
		const w = window.open("", "_blank");
		if (btn) btn.disabled = true;
		const { data, error } = await sb.storage.from("cavalli-allegati").createSignedUrl(a.path, 600);
		if (btn) btn.disabled = false;
		if (error || !data?.signedUrl) {
			if (w) w.close();
			showToast("Non riesco ad aprire il file, riprova.");
			return;
		}
		if (w) w.location.href = data.signedUrl;
		else window.location.href = data.signedUrl;
	}
	async function eliminaAllegatoScud(id) {
		const a = allegatiScud.find((x) => x.id === id);
		if (!a) return;
		if (!confirm(`Eliminare «${a.nome}»? Sparisce anche per il proprietario e il maniscalco; l'eliminazione resta nello storico del cavallo.`)) return;
		const { data, error } = await sb.rpc("equo_elimina_allegato", { p_id: id });
		if (error || !data?.ok) {
			showToast(data && data.errore || "Non riuscito, riprova.");
			return;
		}
		if (data.path) await sb.storage.from("cavalli-allegati").remove([data.path]);
		showToast("Allegato eliminato");
		await caricaAllegatiScud(allegatiScudCavallo);
	}
	function renderCavalloDetail() {
		const c = cavalliList.find((x) => x.id === currentCavalloId);
		if (!c) {
			closeCavalloDetail();
			return;
		}
		document.getElementById("detail-cavallo-nome").innerHTML = escapeHtml(c.nome) + " " + pallinoHtml(c.id);
		const sub = [
			c.razza,
			c.mantello,
			{
				femmina: "Femmina",
				castrone: "Castrone",
				stallone: "Stallone"
			}[c.sesso] || null,
			TIPO_PROPRIETA_LABELS[c.tipo_proprieta] || null,
			c.proprietario ? "proprietario: " + c.proprietario : null
		].filter(Boolean).join(" · ");
		document.getElementById("detail-cavallo-sub").textContent = sub || "Nessun dettaglio aggiuntivo";
		const info = [
			c.codice_equo ? "Codice Equo: " + c.codice_equo : null,
			c.data_nascita ? "Nato il " + formatDate(c.data_nascita) : null,
			c.microchip ? "Microchip: " + c.microchip : null,
			c.gruppo_sanguigno ? "Gruppo sanguigno: " + c.gruppo_sanguigno : null,
			c.attivita ? "Attività: " + c.attivita : null
		].filter(Boolean).join(" · ");
		document.getElementById("detail-cavallo-info").textContent = info;
		const fotoEl = document.getElementById("detail-cavallo-foto");
		if (c.foto_url) {
			fotoEl.style.backgroundImage = `url('${c.foto_url}')`;
			fotoEl.innerHTML = "";
		} else {
			fotoEl.style.backgroundImage = "";
			fotoEl.innerHTML = `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:var(--muted)"><i class="fa-solid fa-horse-head"></i></div>`;
		}
		refreshSchedaPdfUI(c);
		if (typeof renderCodiceScud === "function") renderCodiceScud(c);
		const scad = scadenzarioFor(c.id);
		const grid = document.getElementById("scadenzario-grid");
		grid.innerHTML = TIPO_ORDER.map((tipo) => {
			const s = scad[tipo];
			const meta = s.ultimo ? `Ultimo: ${formatDate(s.ultimo.data_evento)}${s.ultimo.data_scadenza ? " · Scadenza: " + formatDate(s.ultimo.data_scadenza) : ""}` : "Nessun evento registrato";
			return `
      <div class="scad-tile">
        <div class="t">
          <span class="lbl">${iconHtml(TIPO_ICONS[tipo])} ${TIPO_LABELS[tipo]}</span>
          <span class="badge-pill badge-${s.status}">${etichettaStato(s)}</span>
        </div>
        <div class="meta">${meta}</div>
      </div>`;
		}).join("");
		renderEventiTable(c.id);
	}
	function canDeleteEvento(e) {
		if (e && e.origine && e.origine !== "scuderia") return false;
		if (currentMembro?.ruolo === "admin") return true;
		return e.creato_da && e.creato_da === currentMembroId();
	}
	function renderEventiTable(cavalloId) {
		const eventi = eventiAll.filter((e) => e.cavallo_id === cavalloId).sort((a, b) => new Date(b.data_evento) - new Date(a.data_evento));
		const body = document.getElementById("eventi-table-body");
		const empty = document.getElementById("eventi-empty");
		body.innerHTML = "";
		empty.style.display = eventi.length === 0 ? "block" : "none";
		eventi.forEach((e) => {
			const tr = document.createElement("tr");
			tr.innerHTML = `
      <td>${iconHtml(TIPO_ICONS[e.tipo], "color:var(--muted);margin-right:6px")}${e.tipo === "altro" ? escapeHtml(e.tipo_altro || "Altro") : TIPO_LABELS[e.tipo]}</td>
      <td>${formatDate(e.data_evento)}</td>
      <td>${e.data_scadenza ? formatDate(e.data_scadenza) : "—"}</td>
      <td style="color:var(--muted)">${escapeHtml(e.note || "—")}</td>
      <td style="text-align:right;white-space:nowrap">
        ${memberCanUI("eventi") ? `<button class="btn btn-ghost btn-sm" onclick="openEventoForm('${e.id}')"><i class="fa-solid fa-pen"></i></button>` : ""}
        ${canDeleteEvento(e) ? `<button class="btn btn-ghost btn-sm" onclick="askDeleteEvento('${e.id}')"><i class="fa-solid fa-trash"></i></button>` : ""}
      </td>`;
			body.appendChild(tr);
		});
	}
	// equo-scuderia-src/src/sezioni/cavalli/moduli/039-cavalli-salute.js
	async function refreshCavalliModule() {
		await loadCavalli();
		await loadEventiAll();
		document.getElementById("cavalli-detail-view").style.display = "none";
		document.getElementById("cavalli-list-view").style.display = "block";
		currentCavalloId = null;
		renderCavalliList();
		refreshBoxSezione();
	}
	var cavalliUsciti = [];
	var cavalliArrivi = [];
	async function loadCavalli() {
		if (DEMO_MODE) {
			cavalliList = demoState.cavalli.filter((c) => !c.uscito_il);
			cavalliUsciti = demoState.cavalli.filter((c) => c.uscito_il);
			cavalliArrivi = demoState.arrivi || [];
			return;
		}
		const campi = "id, centro_id, nome, razza, mantello, data_nascita, microchip, proprietario, note, tipo_proprieta, gruppo_sanguigno, foto_url, pdf_url, pdf_generato_at, updated_at, proprietario_membro_id, codice_equo, codice_livello, codice_definitivo, sesso, attivita";
		const [att, usc, arr] = await Promise.all([
			sb.from("scuderia_cavalli").select(campi).eq("centro_id", currentCentro.id).is("uscito_il", null).order("nome", { ascending: true }),
			sb.from("scuderia_cavalli").select("id, nome, razza, proprietario, codice_equo, uscito_il, uscito_verso").eq("centro_id", currentCentro.id).not("uscito_il", "is", null).order("uscito_il", { ascending: false }).limit(50),
			sb.from("cavalli_arrivi").select("id, nome_cavallo, proprietario_nome, richiesto_nome, richiesto_ruolo, dal, created_at").eq("centro_id", currentCentro.id).eq("stato", "in_attesa").order("created_at", { ascending: true })
		]);
		cavalliUsciti = usc.error ? [] : usc.data || [];
		cavalliArrivi = arr.error ? [] : arr.data || [];
		if (!att.error) {
			cavalliList = att.data || [];
			return;
		}
		const { data, error } = await sb.from("scuderia_cavalli").select(campi).eq("centro_id", currentCentro.id).order("nome", { ascending: true });
		if (!error) {
			cavalliList = data || [];
			return;
		}
		const r = await sb.from("scuderia_cavalli").select("id, centro_id, nome, razza, mantello, data_nascita, microchip, proprietario, note, tipo_proprieta, gruppo_sanguigno, foto_url, pdf_url, pdf_generato_at, updated_at, codice_equo").eq("centro_id", currentCentro.id).order("nome", { ascending: true });
		if (!r.error) cavalliList = r.data || [];
	}
	async function loadEventiAll() {
		if (DEMO_MODE) {
			eventiAll = demoState.eventi;
			aggiornaContatoriNav();
			return;
		}
		const { data, error } = await sb.from("scuderia_eventi_sanitari").select("*").eq("centro_id", currentCentro.id).order("data_evento", { ascending: false });
		if (!error) eventiAll = data || [];
		aggiornaContatoriNav();
	}
	function scadenzarioFor(cavalloId) {
		const eventiCavallo = eventiAll.filter((e) => e.cavallo_id === cavalloId);
		const result = {};
		TIPO_ORDER.forEach((tipo) => {
			const ultimo = eventiCavallo.filter((e) => e.tipo === tipo).sort((a, b) => new Date(b.data_evento) - new Date(a.data_evento))[0] || null;
			result[tipo] = {
				ultimo,
				status: statusFor(ultimo)
			};
		});
		return result;
	}
	function statusFor(evento) {
		if (!evento) return "gray";
		if (!evento.data_scadenza) return "gray";
		const oggi = /* @__PURE__ */ new Date();
		oggi.setHours(0, 0, 0, 0);
		const scad = new Date(evento.data_scadenza);
		const giorni = Math.round((scad - oggi) / 864e5);
		if (giorni < 0) return "red";
		if (giorni <= (PREAVVISO_GIORNI[evento.tipo] ?? SOGLIE_CONTATORI.saluteGiorni)) return "yellow";
		return "green";
	}
	function worstStatus(cavalloId) {
		const scad = scadenzarioFor(cavalloId);
		const order = {
			red: 0,
			yellow: 1,
			gray: 2,
			green: 3
		};
		let worst = "green";
		TIPO_ORDER.forEach((tipo) => {
			if (order[scad[tipo].status] < order[worst]) worst = scad[tipo].status;
		});
		return worst;
	}
	var sezioniCavalliChiuse = (() => {
		try {
			return JSON.parse(localStorage.getItem("equo-scud-sez-chiuse") || "[]");
		} catch (e) {
			return [];
		}
	})();
	function toggleSezioneCavalli(sez) {
		sezioniCavalliChiuse = sezioniCavalliChiuse.includes(sez) ? sezioniCavalliChiuse.filter((x) => x !== sez) : [...sezioniCavalliChiuse, sez];
		try {
			localStorage.setItem("equo-scud-sez-chiuse", JSON.stringify(sezioniCavalliChiuse));
		} catch (e) {}
		renderCavalliList();
	}
	function renderArriviUsciti() {
		const ab = document.getElementById("cavalli-arrivi"), ub = document.getElementById("cavalli-usciti");
		if (ab) ab.innerHTML = cavalliArrivi.map((a) => `<div class="arrivo-card">
      <div class="arrivo-t">🐴 ${escapeHtml(a.nome_cavallo)} in arrivo</div>
      <div class="arrivo-d">${escapeHtml(a.richiesto_nome || "Qualcuno")} (${a.richiesto_ruolo === "maniscalco" ? "maniscalco" : "proprietario"}) segna che <b>${escapeHtml(a.nome_cavallo)}</b>${a.proprietario_nome ? " di <b>" + escapeHtml(a.proprietario_nome) + "</b>" : ""} sta da voi dal ${formatDate(a.dal)}. Accogliendolo entra nei vostri cavalli (Pensione) con la sua scheda Equo e il suo storico.</div>
      <div class="arrivo-az"><button class="btn btn-primary" onclick="rispondiArrivo('${a.id}', true, this)">Accogli</button><button class="btn btn-outline" onclick="rispondiArrivo('${a.id}', false, this)">Non è da noi</button></div>
    </div>`).join("");
		if (ub) ub.innerHTML = cavalliUsciti.length ? `<details class="usciti-box"><summary>Usciti dal centro · ${cavalliUsciti.length}</summary>
      ${cavalliUsciti.map((c) => `<div class="uscito-riga"><b>${escapeHtml(c.nome)}</b><span>${escapeHtml([c.proprietario, c.codice_equo].filter(Boolean).join(" · "))}</span>
        <span>uscito il ${formatDate(String(c.uscito_il).slice(0, 10))}${c.uscito_verso ? " · verso " + escapeHtml(c.uscito_verso) : ""}</span></div>`).join("")}
      <p class="usciti-nota">La scheda e lo storico restano: se il cavallo torna e qualcuno lo indica in Equo, con «Accogli» si riattiva la stessa scheda.</p></details>` : "";
	}
	async function rispondiArrivo(id, accogli, btn) {
		const a = cavalliArrivi.find((x) => x.id === id);
		if (!a) return;
		if (!accogli && btn.dataset.conferma !== "1") {
			btn.dataset.conferma = "1";
			btn.textContent = "Tocca ancora: non è da noi";
			setTimeout(() => {
				btn.dataset.conferma = "";
				btn.textContent = "Non è da noi";
			}, 4e3);
			return;
		}
		btn.closest(".arrivo-az").querySelectorAll("button").forEach((b) => b.disabled = true);
		if (DEMO_MODE) {
			demoState.arrivi = (demoState.arrivi || []).filter((x) => x.id !== id);
			if (accogli) demoState.cavalli.push({
				id: "dcav-" + Date.now(),
				nome: a.nome_cavallo,
				proprietario: a.proprietario_nome,
				tipo_proprieta: "pensione",
				centro_id: currentCentro.id
			});
		} else {
			const { data, error } = await sb.rpc("equo_rispondi_arrivo", {
				p_id: id,
				p_accogli: accogli
			});
			if (error || !data?.ok) {
				showToast(data && data.errore || error && error.message || "Non riuscito, riprova.");
				btn.closest(".arrivo-az").querySelectorAll("button").forEach((b) => b.disabled = false);
				return;
			}
		}
		showToast(accogli ? `${a.nome_cavallo} accolto: lo trovi in Pensione` : `Segnalato: ${a.nome_cavallo} non è da voi. Chi l'aveva indicato riceve l'avviso.`);
		await refreshCavalliModule();
	}
	function renderCavalliList() {
		renderArriviUsciti();
		const empty = document.getElementById("cavalli-empty");
		empty.style.display = cavalliList.length === 0 ? "block" : "none";
		document.getElementById("cavalli-sezioni").style.display = cavalliList.length === 0 ? "none" : "block";
		[
			"proprieta",
			"pensione",
			"soci"
		].forEach((sezione) => {
			const grid = document.getElementById("cavalli-grid-" + sezione);
			const sezioneEl = document.querySelector(`.cavalli-sezione[data-sezione="${sezione}"]`);
			const emptySezione = sezioneEl.querySelector(".empty-state-sezione");
			const list = cavalliList.filter((c) => (c.tipo_proprieta || "proprieta") === sezione);
			grid.innerHTML = "";
			sezioneEl.style.display = cavalliList.length === 0 ? "none" : "block";
			emptySezione.style.display = list.length === 0 ? "block" : "none";
			const chiusa = sezioniCavalliChiuse.includes(sezione);
			sezioneEl.classList.toggle("chiusa", chiusa);
			sezioneEl.querySelector(".cav-sez-n").textContent = " · " + list.length;
			const urgenti = list.filter((c) => pallinoCavallo(c.id).col === "rosso").length;
			sezioneEl.querySelector(".cav-sez-alert").innerHTML = chiusa && urgenti ? `<span class="sem-dot rosso" data-tip="${urgenti} ${urgenti === 1 ? "cavallo ha" : "cavalli hanno"} scadenze superate"></span>` : "";
			list.forEach((c) => {
				const worst = worstStatus(c.id);
				const sub = [c.razza, c.mantello].filter(Boolean).join(" · ") || "Dati non specificati";
				const div = document.createElement("div");
				div.className = "card cavallo-card";
				div.onclick = () => openCavalloDetail(c.id);
				div.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px">
          ${c.foto_url ? `<div style="width:40px;height:40px;border-radius:8px;background-image:${cssUrl(c.foto_url)};background-size:cover;background-position:center;flex-shrink:0"></div>` : ""}
          <div style="flex:1">
            <h3 style="margin:0 0 2px;display:flex;align-items:center;gap:8px">${escapeHtml(c.nome)} ${pallinoHtml(c.id)}</h3>
            <div style="color:var(--muted);font-size:13px">${escapeHtml(sub)}</div>
          </div>
          <span class="badge-pill badge-${worst}" data-tip="Stato dello scadenzario (vaccino, Coggins, ferratura, sverminazione)">${STATUS_LABELS[worst]}</span>
        </div>`;
				grid.appendChild(div);
			});
		});
	}
	function openCavalloDetail(id) {
		currentCavalloId = id;
		document.getElementById("cavalli-list-view").style.display = "none";
		document.getElementById("cavalli-detail-view").style.display = "block";
		renderCavalloDetail();
		caricaAllegatiScud(id);
	}
	function closeCavalloDetail() {
		currentCavalloId = null;
		document.getElementById("cavalli-detail-view").style.display = "none";
		document.getElementById("cavalli-list-view").style.display = "block";
		renderCavalliList();
	}
	// equo-scuderia-src/src/sezioni/cavalli/moduli/058-pannello-del-box.js
	function boxApri(id) {
		boxPannelloId = id;
		boxRenderPannello();
		openModal("modal-box");
	}
	function boxRenderPannello() {
		const b = boxList.find((x) => x.id === boxPannelloId);
		if (!b) {
			closeModal("modal-box");
			return;
		}
		const c = b.cavallo_id ? cavalliList.find((x) => x.id === b.cavallo_id) : null;
		const gest = boxPuoGestire();
		const stB = boxStato(b);
		document.getElementById("box-pannello-titolo").innerHTML = `<span class="box-targa">BOX ${b.numero}</span> ${escapeHtml(stB.proprietario || b.zona || "")}`;
		const ass = stB.ass;
		const altriLiberiAss = cavalliList.filter((x) => !boxList.some((bb) => bb.assegnato_cavallo_id === x.id));
		const sezioneProprieta = !gest ? ass ? `<p style="font-size:13px;color:var(--muted);margin:10px 0 0">Box di proprietà: ${escapeHtml(ass.nome)}${ass.proprietario ? " · " + escapeHtml(ass.proprietario) : ""}</p>` : "" : `<details class="bp-proprieta" ${ass ? "open" : ""}><summary data-tip="Un box di proprietà resta riservato a un cavallo e al suo proprietario, anche quando il cavallo è altrove">Box di proprietà</summary>
      ${ass ? `<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:8px"><span style="font-size:13.5px">Riservato a <b>${escapeHtml(ass.nome)}</b>${ass.proprietario ? " · " + escapeHtml(ass.proprietario) : ""}</span>
          <button class="btn btn-outline btn-sm btn-variazione" onclick="boxRiserva('${b.id}', null)">Togli riserva</button></div>` : altriLiberiAss.length ? `<div style="display:flex;gap:8px;margin-top:8px"><select class="input" id="box-riserva-cavallo">${altriLiberiAss.map((x) => `<option value="${x.id}">${escapeHtml(x.nome)}${x.proprietario ? " · " + escapeHtml(x.proprietario) : ""}</option>`).join("")}</select>
          <button class="btn btn-primary btn-conferma btn-sm" onclick="boxRiserva('${b.id}', document.getElementById('box-riserva-cavallo').value)">Riserva</button></div>` : `<p style="font-size:13px;color:var(--muted);margin:8px 0 0">Tutti i cavalli hanno già un box di proprietà.</p>`}</details>`;
		let h = "";
		if (c) {
			const liberi = boxList.filter((x) => !x.cavallo_id && !x.manutenzione && x.id !== b.id);
			const nota = boxNote[c.id];
			h = `<div class="bp-testa">${c.foto_url ? `<div class="box-foto" style="background-image:${cssUrl(c.foto_url)}"></div>` : `<div class="box-nopic" style="margin:0">NO<br>PICTURE</div>`}
        <div style="min-width:0"><div style="font-weight:800;font-size:18px;display:flex;align-items:center;gap:8px">${escapeHtml(c.nome)} ${pallinoHtml(c.id)}</div>
        <div style="color:var(--muted);font-size:12.5px">${escapeHtml([c.razza, c.proprietario ? "di " + c.proprietario : null].filter(Boolean).join(" · "))}</div>
        <div style="color:var(--muted);font-size:12px;margin-top:2px">${escapeHtml(pallinoCavallo(c.id).testo)}</div></div></div>
      ${stB.sotto ? `<div class="bp-avviso giallo">${escapeHtml(stB.tip.replace(/^Bordo giallo: /, ""))}</div>` : ""}
      <div class="bp-nota" onclick="boxApriNota('${c.id}')"><span class="box-nota ${nota ? "on" : ""}" style="position:static">N</span><span>${nota ? escapeHtml(nota) : "<span style=\"color:var(--muted)\">Nessuna nota: tocca per scriverne una</span>"}</span></div>
      <div class="field"><label>Dov'è / come sta</label>
        <select class="input" onchange="boxAggiorna('${b.id}', { stato_cavallo: this.value })">${Object.entries(BOX_STATI).map(([k, s]) => `<option value="${k}" ${b.stato_cavallo === k ? "selected" : ""}>${s.nome}</option>`).join("")}</select></div>
      <label style="font-size:12px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.04em">Oggi</label>
      <div class="bp-ic-griglia">${boxIconeAttive().map((k) => {
				const d = BOX_ICONE[k], a = boxAttivitaDi(b.id, k);
				return `<button class="bp-ic ${a ? "on" : ""}" style="--ic-col:${d.col}" data-tip="${escapeHtml(d.tip)}" onclick="boxToggleIcona('${b.id}','${k}')"><span class="i">${iconHtml(d.icon)}</span><b>${d.nome}</b>
          <small>${a ? new Date(a.fatto_il).toLocaleTimeString("it-IT", {
					hour: "2-digit",
					minute: "2-digit"
				}) + (a.fatto_da_nome ? " · " + escapeHtml(a.fatto_da_nome.split(" ")[0]) : "") : "da fare"}</small></button>`;
			}).join("")}</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn btn-outline btn-sm" onclick="closeModal('modal-box');showModule('cavalli');openCavalloDetail('${c.id}')"><i class="fa-solid fa-horse-head"></i> Scheda cavallo</button>
        ${gest && liberi.length ? `<select class="input" style="width:auto;flex:1;min-width:140px" onchange="if(this.value)boxSposta('${b.id}', this.value)"><option value="">Sposta in…</option>${liberi.map((x) => {
				const a2 = x.assegnato_cavallo_id ? cavalliList.find((y) => y.id === x.assegnato_cavallo_id) : null;
				return `<option value="${x.id}">Box ${x.numero}${a2 && a2.id !== c.id ? " · riservato a " + escapeHtml(a2.nome) : x.nome ? " · " + escapeHtml(x.nome) : ""}</option>`;
			}).join("")}</select>` : ""}
        ${gest ? `<button class="btn btn-outline btn-sm" style="color:var(--danger)" onclick="boxLibera('${b.id}')"><i class="fa-solid fa-right-from-bracket"></i> Libera box</button>` : ""}
      </div>`;
		} else if (b.manutenzione) h = `<div class="bp-testa"><div class="box-manut-ic" style="margin:0">${iconHtml("fa-screwdriver-wrench")}</div><div><div style="font-weight:800;font-size:17px">In manutenzione</div>
        <div style="color:var(--muted);font-size:13px">${BOX_MOTIVI[b.manutenzione_motivo] || "Lavori"}${b.manutenzione_fino ? " · fino al " + formatDate(b.manutenzione_fino) : ""}</div>
        ${b.manutenzione_nota ? `<div style="font-size:13px;margin-top:4px">${escapeHtml(b.manutenzione_nota)}</div>` : ""}</div></div>
      ${gest ? `<button class="btn btn-primary btn-block" onclick="boxAggiorna('${b.id}', { manutenzione: false }).then(ok => ok && boxRenderPannello())"><i class="fa-solid fa-check"></i> Fine manutenzione: box libero</button>` : `<p style="color:var(--muted);font-size:13px">Può chiudere la manutenzione l'amministratore o un membro di livello 2-3.</p>`}`;
		else {
			const senzaBox = cavalliList.filter((x) => !boxList.some((bb) => bb.cavallo_id === x.id)).sort((x, y) => (y.id === b.assegnato_cavallo_id) - (x.id === b.assegnato_cavallo_id));
			h = gest ? `<div class="field"><label>Aggiungi un cavallo</label>
        ${senzaBox.length ? `<div style="display:flex;gap:8px"><select class="input" id="box-scegli-cavallo">${senzaBox.map((x) => `<option value="${x.id}">${escapeHtml(x.nome)}</option>`).join("")}</select>
        <button class="btn btn-primary" onclick="boxAssegna('${b.id}')">Aggiungi</button></div>` : `<p style="color:var(--muted);font-size:13px;margin:0">Tutti i cavalli hanno già un box. Aggiungi un cavallo da "Nuovo cavallo".</p>`}</div>
      <details style="margin:4px 0 12px"><summary style="cursor:pointer;font-weight:700;font-size:13.5px">Metti in manutenzione</summary>
        <div class="grid grid-2" style="margin-top:10px"><div class="field"><label>Motivo</label><select class="input" id="box-man-motivo">${Object.entries(BOX_MOTIVI).map(([k, v]) => `<option value="${k}">${v}</option>`).join("")}</select></div>
        <div class="field"><label>Fino al (facoltativo)</label><input class="input" type="date" id="box-man-fino"></div></div>
        <div class="field"><label>Nota (facoltativa)</label><input class="input" id="box-man-nota" maxlength="300" placeholder="Es. cambio lettiera e disinfezione"></div>
        <button class="btn btn-variazione btn-sm" onclick="boxManutenzione('${b.id}')"><i class="fa-solid fa-screwdriver-wrench"></i> Metti in manutenzione</button></details>
      <details style="margin-bottom:12px"><summary style="cursor:pointer;font-weight:700;font-size:13.5px">Nome e zona del box</summary>
        <div class="grid grid-2" style="margin-top:10px"><div class="field"><label>Nome (facoltativo)</label><input class="input" id="box-nome" maxlength="60" value="${escapeHtml(b.nome || "")}" placeholder="Es. Box grande"></div>
        <div class="field"><label>Zona</label><input class="input" id="box-zona" maxlength="60" value="${escapeHtml(b.zona || "")}" placeholder="Es. Scuderia A"></div></div>
        <button class="btn btn-variazione btn-sm" onclick="boxAggiorna('${b.id}', { nome: document.getElementById('box-nome').value.trim() || null, zona: document.getElementById('box-zona').value.trim() || null }).then(ok => ok && boxRenderPannello())">Salva nome e zona</button></details>
      <button class="btn btn-ghost btn-sm" style="color:var(--danger)" onclick="boxElimina('${b.id}')"><i class="fa-solid fa-trash"></i> Elimina box</button>` : `<p style="color:var(--muted);font-size:13.5px">Box libero. Può assegnare i cavalli l'amministratore o un membro di livello 2-3.</p>`;
		}
		document.getElementById("box-pannello-corpo").innerHTML = h + (b.manutenzione && !c ? "" : sezioneProprieta);
	}
	async function boxMuovi(cavId, daId, aId) {
		const a = boxList.find((x) => x.id === aId), c = cavalliList.find((x) => x.id === cavId);
		if (!a || !c || daId === aId) return false;
		if (a.cavallo_id) {
			const o = cavalliList.find((x) => x.id === a.cavallo_id);
			showToast(`Box ${a.numero} occupato${o ? " da " + o.nome : ""}: spostamento non possibile.`);
			return false;
		}
		if (a.manutenzione) {
			showToast(`Box ${a.numero} in manutenzione: spostamento non possibile.`);
			return false;
		}
		if (a.assegnato_cavallo_id && a.assegnato_cavallo_id !== cavId) {
			const ass = cavalliList.find((x) => x.id === a.assegnato_cavallo_id);
			const chi = ass ? ass.proprietario ? `di ${ass.proprietario} (cavallo ${ass.nome})` : `riservato a ${ass.nome}` : "di proprietà";
			if (!await boxConferma(`Box ${a.numero} privato`, `Questo box è ${chi}. Vuoi mettere comunque ${c.nome}?`)) return false;
		}
		const da = daId ? boxList.find((x) => x.id === daId) : null;
		const stato = da?.stato_cavallo || "in_box";
		if (da && !await boxAggiorna(daId, { cavallo_id: null })) return false;
		if (!await boxAggiorna(aId, {
			cavallo_id: cavId,
			stato_cavallo: stato,
			manutenzione: false
		})) return false;
		showToast(da ? `${c.nome} spostato nel box ${a.numero}.` : `${c.nome} nel box ${a.numero}.`);
		return true;
	}
	async function boxAssegna(id) {
		const cav = document.getElementById("box-scegli-cavallo")?.value;
		if (!cav) return;
		if (await boxMuovi(cav, null, id)) boxRenderPannello();
	}
	async function boxLibera(id) {
		if (!confirm("Liberare il box? Il cavallo resta nell'anagrafica.")) return;
		if (await boxAggiorna(id, { cavallo_id: null })) {
			showToast("Box liberato.");
			boxRenderPannello();
		}
	}
	async function boxSposta(daId, aId) {
		const b = boxList.find((x) => x.id === daId);
		if (!b?.cavallo_id) return;
		if (await boxMuovi(b.cavallo_id, daId, aId)) {
			boxPannelloId = aId;
			boxRenderPannello();
		} else boxRenderPannello();
	}
	async function boxRiserva(boxId, cavId) {
		if (await boxAggiorna(boxId, { assegnato_cavallo_id: cavId || null })) {
			showToast(cavId ? "Box riservato." : "Riserva tolta: il box è di nuovo libero per tutti.");
			boxRenderPannello();
		}
	}
	function boxConferma(titolo, testo) {
		return new Promise((resolve) => {
			document.getElementById("box-conf-titolo").textContent = titolo;
			document.getElementById("box-conf-testo").textContent = testo;
			const fine = (v) => {
				closeModal("modal-box-conferma");
				resolve(v);
			};
			document.getElementById("box-conf-si").onclick = () => fine(true);
			document.getElementById("box-conf-no").onclick = () => fine(false);
			openModal("modal-box-conferma");
		});
	}
	var boxNotaCavalloId = null;
	function boxApriNota(cavId) {
		const c = cavalliList.find((x) => x.id === cavId);
		if (!c) return;
		boxNotaCavalloId = cavId;
		document.getElementById("box-nota-titolo").textContent = "Nota su " + c.nome;
		document.getElementById("box-nota-testo").value = boxNote[cavId] || "";
		document.getElementById("box-nota-elimina").style.display = boxNote[cavId] ? "" : "none";
		openModal("modal-box-nota");
		setTimeout(() => document.getElementById("box-nota-testo").focus(), 60);
	}
	async function boxSalvaNota(cancella) {
		const id = boxNotaCavalloId;
		if (!id) return;
		const testo = cancella ? "" : document.getElementById("box-nota-testo").value.trim();
		if (DEMO_MODE) {
			const c = demoState.cavalli.find((x) => x.id === id);
			if (c) c.nota_box = testo || null;
		} else {
			const { error } = await sb.rpc("box_nota_cavallo", {
				p_cavallo: id,
				p_nota: testo
			});
			if (error) {
				showToast(error.message);
				return;
			}
		}
		if (testo) boxNote[id] = testo;
		else delete boxNote[id];
		closeModal("modal-box-nota");
		renderBox();
		if (boxPannelloId) boxRenderPannello();
		showToast(testo ? "Nota salvata: segue il cavallo in ogni box." : "Nota eliminata.");
	}
	// equo-scuderia-src/src/sezioni/cavalli/moduli/059-trascinamento-tieni-premuto-un-cavallo-e.js
	var boxDrag = {
		timer: null,
		attivo: false,
		cav: null,
		da: null,
		x0: 0,
		y0: 0,
		ghost: null,
		target: null,
		blocca: false
	};
	function boxDragReset() {
		clearTimeout(boxDrag.timer);
		if (boxDrag.ghost) boxDrag.ghost.remove();
		document.querySelectorAll(".box-card.drop-ok, .box-card.drop-no, .box-card.in-trascinamento").forEach((el) => el.classList.remove("drop-ok", "drop-no", "in-trascinamento"));
		document.body.classList.remove("box-trascina");
		Object.assign(boxDrag, {
			timer: null,
			attivo: false,
			cav: null,
			da: null,
			ghost: null,
			target: null
		});
		window.__boxDrag = false;
	}
	document.addEventListener("pointerdown", (e) => {
		const card = e.target.closest && e.target.closest(".box-card[data-cav]");
		if (!card || e.target.closest(".box-ic, .box-nota") || !boxPuoGestire() || boxBloccati()) return;
		if (e.pointerType === "mouse" && e.button !== 0) return;
		boxDragReset();
		Object.assign(boxDrag, {
			cav: card.dataset.cav,
			da: card.dataset.box,
			x0: e.clientX,
			y0: e.clientY
		});
		boxDrag.timer = setTimeout(() => {
			boxDrag.attivo = true;
			window.__boxDrag = true;
			document.getElementById("eq-tip")?.classList.remove("vis");
			card.classList.add("in-trascinamento");
			document.body.classList.add("box-trascina");
			const c = cavalliList.find((x) => x.id === boxDrag.cav);
			const g = document.createElement("div");
			g.className = "box-ghost";
			g.innerHTML = `${c?.foto_url ? `<span class="f" style="background-image:${cssUrl(c.foto_url)}"></span>` : `<i class="fa-solid fa-horse-head"></i>`}<b>${escapeHtml(c?.nome || "")}</b>`;
			g.style.left = boxDrag.x0 + "px";
			g.style.top = boxDrag.y0 + "px";
			document.body.appendChild(g);
			boxDrag.ghost = g;
			try {
				navigator.vibrate?.(15);
			} catch (x) {}
		}, e.pointerType === "mouse" ? 260 : 420);
	});
	document.addEventListener("pointermove", (e) => {
		if (!boxDrag.cav) return;
		if (!boxDrag.attivo) {
			if (Math.hypot(e.clientX - boxDrag.x0, e.clientY - boxDrag.y0) > 8) boxDragReset();
			return;
		}
		boxDrag.ghost.style.left = e.clientX + "px";
		boxDrag.ghost.style.top = e.clientY + "px";
		const el = document.elementFromPoint(e.clientX, e.clientY)?.closest(".box-card[data-box]");
		document.querySelectorAll(".box-card.drop-ok, .box-card.drop-no").forEach((x) => {
			if (x !== el) x.classList.remove("drop-ok", "drop-no");
		});
		boxDrag.target = el && el.dataset.box !== boxDrag.da ? el.dataset.box : null;
		if (boxDrag.target) {
			const b = boxList.find((x) => x.id === boxDrag.target);
			el.classList.add(b && !b.cavallo_id && !b.manutenzione ? "drop-ok" : "drop-no");
		}
	});
	document.addEventListener("touchmove", (e) => {
		if (boxDrag.attivo) e.preventDefault();
	}, { passive: false });
	document.addEventListener("pointerup", async () => {
		if (!boxDrag.cav) return;
		const { attivo, cav, da, target } = boxDrag;
		boxDragReset();
		if (!attivo) return;
		boxDrag.blocca = true;
		setTimeout(() => {
			boxDrag.blocca = false;
		}, 400);
		if (target) await boxMuovi(cav, da, target);
	});
	document.addEventListener("pointercancel", () => {
		if (!boxDrag.attivo) boxDragReset();
	});
	document.addEventListener("click", (e) => {
		if (boxDrag.blocca && e.target.closest && e.target.closest(".box-card")) {
			e.preventDefault();
			e.stopPropagation();
			boxDrag.blocca = false;
		}
	}, true);
	document.addEventListener("contextmenu", (e) => {
		if (e.target.closest && e.target.closest(".box-card[data-cav]") && boxPuoGestire()) e.preventDefault();
	});
	async function boxManutenzione(id) {
		const campi = {
			manutenzione: true,
			manutenzione_motivo: document.getElementById("box-man-motivo").value,
			manutenzione_fino: document.getElementById("box-man-fino").value || null,
			manutenzione_nota: document.getElementById("box-man-nota").value.trim() || null
		};
		if (await boxAggiorna(id, campi)) {
			showToast("Box in manutenzione.");
			boxRenderPannello();
		}
	}
	async function boxElimina(id) {
		const b = boxList.find((x) => x.id === id);
		if (!confirm(`Eliminare il box ${b?.numero}?`)) return;
		if (DEMO_MODE) demoState.box = demoState.box.filter((x) => x.id !== id);
		else {
			const { error } = await sb.from("scuderia_box").delete().eq("id", id);
			if (error) {
				showToast(error.message);
				return;
			}
		}
		closeModal("modal-box");
		boxPannelloId = null;
		showToast("Box eliminato.");
		await refreshBoxSezione();
	}
	// equo-scuderia-src/src/sezioni/cavalli/moduli/060-impostazioni-icone-4-facoltative.js
	function boxApriImpostazioni() {
		const extra = currentCentro?.box_icone_extra || [];
		document.getElementById("box-impost-lista").innerHTML = Object.entries(BOX_ICONE).map(([k, d]) => `<label style="display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid var(--border);font-size:14px">
    <input type="checkbox" value="${k}" ${!d.extra ? "checked disabled" : extra.includes(k) ? "checked" : ""}> <span class="box-ic on" style="--ic-col:${d.col};opacity:1">${iconHtml(d.icon)}</span> ${d.nome} <small style="color:var(--muted);margin-left:auto">${d.extra ? "facoltativa" : "sempre"}</small></label>`).join("");
		openModal("modal-box-impost");
	}
	async function boxSalvaImpostazioni() {
		const extra = [...document.querySelectorAll("#box-impost-lista input:not([disabled]):checked")].map((i) => i.value);
		if (!DEMO_MODE) {
			const { error } = await sb.from("centri").update({ box_icone_extra: extra }).eq("id", currentCentro.id);
			if (error) {
				showToast(error.message);
				return;
			}
		}
		currentCentro.box_icone_extra = extra;
		closeModal("modal-box-impost");
		renderBox();
		showToast("Icone del giorno aggiornate.");
	}
	// equo-scuderia-src/src/sezioni/cavalli/moduli/index.js
	Object.assign(window, {
		apriAllegatoScud,
		apriInviaSchedaChat,
		boxApri,
		boxApriImpostazioni,
		boxApriNota,
		boxAssegna,
		boxElimina,
		boxLibera,
		boxManutenzione,
		boxModalitaStalla,
		boxRenderPannello,
		boxRiserva,
		boxSalvaImpostazioni,
		boxSalvaNota,
		boxSposta,
		caricaAllegatoScud,
		closeCavalloDetail,
		collegaProprietarioDaCodice,
		confermaImportCavalli,
		currentMembroId,
		eliminaAllegatoScud,
		groomApriNuovo,
		groomAttiva,
		groomCaricaTeam,
		groomCondividi,
		groomCopia,
		groomElimina,
		groomMostraQr,
		groomNuovoQr,
		groomSalvaNuovo,
		groomStampaBox,
		groomStampaQr,
		handleSchedaPdf,
		inviaSchedaChat,
		loadCavalli,
		loadEventiAll,
		loadMessaggi,
		openCavalloDetail,
		openCavalloForm,
		openMessaggioForm,
		openModal,
		proponiImportCavalli,
		razzaSegnala,
		refreshCavalliModule,
		refreshGroomModule,
		renderCavalliList,
		renderCavalloDetail,
		renderMessaggi,
		rispondiArrivo,
		saltaImportCavalli,
		saveCavallo,
		saveMessaggio,
		scadenzarioFor,
		scaricaSchedaPdf,
		stampaSchedaPdf,
		toggleDestinatarioMsg,
		toggleSezioneCavalli,
		worstStatus
	});
})();

