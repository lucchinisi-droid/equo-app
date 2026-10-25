
// === GENERATO da equo-app-src/strumenti/costruisci-moduli.mjs: NON modificare qui, modificare ruoli/proprietario/moduli/ ===
(function() {
	// equo-app-src/src/ruoli/proprietario/moduli/027-health-events.js
	async function loadHorseEvents(horseId) {
		const box = document.getElementById("horse-events-list");
		box.innerHTML = "<div class=\"loading\"><div class=\"spinner\"></div> Caricamento...</div>";
		if (typeof cercaAzzera === "function" && loadHorseEvents.ultimo !== horseId) cercaAzzera("eventi");
		loadHorseEvents.ultimo = horseId;
		const [data, spost] = await Promise.all([DB.listEvents(horseId), DB.spostamentiCavallo("proprietario", horseId)]);
		currentHorseEventsData = data || [];
		if ((!data || data.length === 0) && !spost.length) {
			box.innerHTML = "<div class=\"muted\" style=\"font-size:13px\">Nessun evento registrato.</div>";
			return;
		}
		box.innerHTML = [...(data || []).map((ev) => ({
			d: ev.date || "",
			ev
		})), ...spost.map((s) => ({
			d: isoLocale(new Date(s.creato)),
			s
		}))].sort((a, b) => b.d.localeCompare(a.d)).map(({ ev, s }) => s ? spostamentoHtml(s) : `
    <div class="event-item" style="cursor:pointer" onclick="openEditEventModal('${ev.id}')">
      <div>
        <div style="font-weight:600;font-size:14px">${EVENT_LABELS[ev.type] || ev.type}</div>
        <div class="muted" style="font-size:12px">${formatDate(ev.date)}${ev.notes ? " · " + escapeHtml(ev.notes) : ""}</div>
      </div>
      ${ev.next_due_date ? `<span class="badge ${deadlineBadgeClass(ev.next_due_date)}">${formatDate(ev.next_due_date)}</span>` : ""}
    </div>
  `).join("");
	}
	var editingEventId = null;
	var currentHorseEventsData = [];
	function openAddEventModal() {
		editingEventId = null;
		document.getElementById("modal-add-event-title").textContent = "Nuovo evento sanitario";
		document.getElementById("event-type").value = "vaccino";
		document.getElementById("event-date").value = "";
		document.getElementById("event-next-date").value = "";
		document.getElementById("event-notes").value = "";
		document.getElementById("event-delete-btn").style.display = "none";
		const notaAltrui = document.getElementById("event-altrui-nota");
		if (notaAltrui) notaAltrui.style.display = "none";
		openModal("modal-add-event");
	}
	function openEditEventModal(id) {
		const ev = currentHorseEventsData.find((e) => e.id === id);
		if (!ev) return;
		editingEventId = id;
		document.getElementById("modal-add-event-title").textContent = "Modifica evento";
		document.getElementById("event-type").value = ev.type;
		document.getElementById("event-date").value = ev.date;
		document.getElementById("event-next-date").value = ev.next_due_date || "";
		document.getElementById("event-notes").value = ev.notes || "";
		const altrui = ev.origine && ev.origine !== "proprietario";
		const btnDel = document.getElementById("event-delete-btn");
		btnDel.style.display = altrui ? "none" : "block";
		let nota = document.getElementById("event-altrui-nota");
		if (!nota) {
			nota = document.createElement("div");
			nota.id = "event-altrui-nota";
			nota.className = "muted";
			nota.style.cssText = "font-size:12px;line-height:1.5;margin-top:8px;text-align:center";
			btnDel.after(nota);
		}
		nota.textContent = altrui ? ev.origine === "scuderia" ? "Voce registrata dalla scuderia: può cancellarla solo la scuderia." : "Voce registrata dal maniscalco: può cancellarla solo il maniscalco." : "";
		nota.style.display = altrui ? "block" : "none";
		openModal("modal-add-event");
	}
	async function saveHorseEvent() {
		if (!currentHorseId) return;
		const type = document.getElementById("event-type").value;
		const date = document.getElementById("event-date").value;
		const next_due_date = document.getElementById("event-next-date").value || null;
		const notes = document.getElementById("event-notes").value.trim();
		if (!date) return;
		const payload = {
			horse_id: currentHorseId,
			type,
			date,
			next_due_date,
			notes
		};
		const { error } = editingEventId ? await DB.updateEvent(editingEventId, payload) : await DB.insertEvent(payload);
		if (error) {
			alert("Errore: " + error.message);
			return;
		}
		document.getElementById("event-date").value = "";
		document.getElementById("event-next-date").value = "";
		document.getElementById("event-notes").value = "";
		editingEventId = null;
		closeModal("modal-add-event");
		await loadHorseEvents(currentHorseId);
	}
	async function deleteHorseEventFromModal() {
		if (!editingEventId) return;
		if (!confirm("Eliminare questo evento?")) return;
		await DB.deleteEvent(editingEventId, currentHorseId);
		editingEventId = null;
		closeModal("modal-add-event");
		await loadHorseEvents(currentHorseId);
	}
	function deadlineBadgeClass(dateStr) {
		const days = (new Date(dateStr) - /* @__PURE__ */ new Date()) / 864e5;
		if (days < 0) return "badge-red";
		if (days < 14) return "badge-accent";
		return "badge-green";
	}
	async function loadDeadlines() {
		const box = document.getElementById("home-deadlines");
		const horseIds = horses.map((h) => h.id);
		if (horseIds.length === 0) {
			box.innerHTML = "<div class=\"muted\" style=\"font-size:13px\">Nessuna scadenza.</div>";
			return;
		}
		const data = await DB.listUpcomingDeadlines(horseIds, 5);
		if (!data || data.length === 0) {
			box.innerHTML = "<div class=\"muted\" style=\"font-size:13px\">Nessuna scadenza in arrivo.</div>";
			document.getElementById("stat-deadlines").textContent = "0";
			return;
		}
		document.getElementById("stat-deadlines").textContent = data.filter((d) => (new Date(d.next_due_date) - /* @__PURE__ */ new Date()) / 864e5 < 30).length;
		box.innerHTML = data.map((d) => `
    <div class="deadline-item">
      <div class="deadline-dot ${deadlineBadgeClass(d.next_due_date) === "badge-red" ? "late" : deadlineBadgeClass(d.next_due_date) === "badge-accent" ? "soon" : "ok"}"></div>
      <div style="flex:1">
        <div style="font-size:13px;font-weight:600">${EVENT_LABELS[d.type] || d.type} · ${escapeHtml(d.horses?.name || "")}</div>
        <div class="muted" style="font-size:12px">${formatDate(d.next_due_date)}</div>
      </div>
    </div>
  `).join("");
	}
	// equo-app-src/src/ruoli/proprietario/moduli/073-chat-col-proprio-maniscalco-lato-proprie.js
	function bollaAllegato(tipo, url, nome, testo) {
		const extra = testo ? `<div class="mchat-bubble-text">${escapeHtml(testo)}</div>` : "";
		if (tipo === "foto") return `<a href="${escapeHtml(urlSicuro(url))}" target="_blank" rel="noopener"><img class="mchat-foto" src="${escapeHtml(urlSicuro(url))}" alt="Foto" loading="lazy"></a>${extra}`;
		if (tipo === "video") return `<video class="mchat-foto" controls playsinline preload="metadata" src="${escapeHtml(url || "")}"></video>${extra}`;
		return `<a class="mchat-doc" href="${escapeHtml(urlSicuro(url))}" target="_blank" rel="noopener"><span class="mchat-doc-ico">PDF</span><span class="mchat-doc-nome">${escapeHtml(nome || "Documento.pdf")}</span></a>${extra}`;
	}
	function previewAllegato(tipo, nome) {
		if (tipo === "foto") return "📷 Foto";
		if (tipo === "video") return "🎬 Video";
		if (tipo === "audio") return "🎙️ Nota vocale";
		if (tipo === "documento") return "📄 " + (nome || "Documento PDF");
		return "";
	}
	function previewMessaggioMascalcia(tipo, testo, fileNome) {
		if (tipo === "foto") return "📷 Foto";
		if (tipo === "video") return "🎬 Video";
		if (tipo === "documento") return "📄 " + (fileNome || "Documento PDF");
		if (tipo === "audio") return "🎙️ Nota vocale";
		return testo || "";
	}
	async function loadFarrierChatSection$1() {
		const box = document.getElementById("farrier-chat-list");
		if (!box) return;
		const lista = await DB.listManiscalchiCollegati();
		if (!lista.length) {
			box.innerHTML = `<div class="muted" style="font-size:13px;line-height:1.6;text-align:center;padding:6px 4px">
      Hai un codice dal tuo maniscalco?<br>Tocca "+ Collega" per scrivergli in chat e ricevere appuntamenti e PDF.</div>`;
			return;
		}
		box.innerHTML = lista.map((f) => {
			let preview = "Inizia la conversazione col tuo maniscalco";
			if (f.ultimo_at) preview = (f.ultimo_mittente === "cliente" ? "Tu: " : "") + previewMessaggioMascalcia(f.ultimo_tipo, f.ultimo_testo, f.ultimo_file_nome);
			return `
    <div class="inbox-item ${f.non_letti > 0 ? "unread" : ""}" onclick="openFarrierChatThread(${jsArg(f.cliente_mascalcia_id)}, ${jsArg(f.nome_maniscalco || "Il tuo maniscalco")}, ${f.certificato ? "true" : "false"})">
      <div class="horse-avatar"><i class="fa-solid fa-hammer" style="font-size:20px"></i></div>
      <div style="flex:1;min-width:0">
        <div class="inbox-name" style="font-size:14px">${escapeHtml(f.nome_maniscalco || "Il tuo maniscalco")}${f.certificato ? " " + BADGE_CERTIFIED_HTML : ""}</div>
        <div class="inbox-preview muted" style="font-size:12.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHtml(preview)}</div>
      </div>
      ${f.non_letti > 0 ? `<span class="inbox-unread-dot"></span>` : ""}
    </div>`;
		}).join("");
	}
	function openCollegaManiscalco() {
		document.getElementById("collega-maniscalco-codice").value = "";
		document.getElementById("collega-maniscalco-error").style.display = "none";
		openModal("modal-collega-maniscalco");
	}
	var ERRORI_CODICE_MANISCALCO = {
		codice_non_valido: "Codice non valido. Controlla di averlo scritto bene.",
		codice_gia_usato: "Questo codice è già stato usato da un altro account. Chiedi al tuo maniscalco di verificarlo.",
		codice_tuo: "Questo è un codice creato da te: va dato al tuo cliente.",
		non_autenticato: "Sessione scaduta: esci e rientra.",
		codice_altro_tipo: "Questo non è il codice di un maniscalco: controlla di averlo copiato bene."
	};
	async function collegaManiscalco() {
		const input = document.getElementById("collega-maniscalco-codice");
		const errBox = document.getElementById("collega-maniscalco-error");
		const btn = document.getElementById("collega-maniscalco-btn");
		errBox.style.display = "none";
		const codice = input.value.trim().toUpperCase();
		if (!codice) return;
		btn.disabled = true;
		const res = await DB.riscattaCodiceManiscalco(codice);
		btn.disabled = false;
		if (!res || !res.ok) {
			if (res?.errore === "codice_altro_tipo" && res.tipo === "own") {
				gestisciCodiceScansionato(codice);
				return;
			}
			if (res?.errore === "codice_altro_tipo" && res.tipo === "tra" && typeof trCollOwner === "function") {
				gestisciCodiceScansionato(codice);
				return;
			}
			errBox.textContent = (ERRORI_CODICE_MANISCALCO[res?.errore] || "Errore, riprova." + (res?.messaggio ? " (" + res.messaggio + ")" : "")) + (DEMO_MODE && res?.errore === "codice_non_valido" ? " (in demo prova EQUO-DC1AB)" : "");
			errBox.style.display = "block";
			return;
		}
		closeModal("modal-collega-maniscalco");
		showToast("Collegato a " + (res.nome_maniscalco || "il tuo maniscalco") + "!");
		await loadFarrierChatSection$1();
		const nomeMan = res.nome_maniscalco || "Il tuo maniscalco";
		await proponiAbbinamentoCavalli(res.cliente_mascalcia_id, nomeMan, () => openFarrierChatThread(res.cliente_mascalcia_id, nomeMan));
	}
	// equo-app-src/src/ruoli/proprietario/moduli/069-chat-proprietario-proprietario.js
	var OWNER_EMOJI_LIST = EMOJI_LIST;
	function populateOwnerEmojiPicker() {
		const box = document.getElementById("ochat-emoji-picker");
		if (box.childElementCount > 0) return;
		box.innerHTML = OWNER_EMOJI_LIST.map((e) => `<button type="button" onclick="insertOwnerEmoji('${e}')">${e}</button>`).join("");
	}
	function toggleOwnerEmojiPicker() {
		populateOwnerEmojiPicker();
		document.getElementById("ochat-emoji-picker").classList.toggle("active");
	}
	function insertOwnerEmoji(emoji) {
		const input = document.getElementById("ochat-input");
		input.value += emoji;
		input.focus();
	}
	async function loadOwnerChatList() {
		const box = document.getElementById("owner-chat-list");
		if (!box) return;
		box.innerHTML = "<div class=\"loading\"><div class=\"spinner\"></div> Caricamento...</div>";
		const conversazioni = await DB.listConversazioniProprietario();
		if (!conversazioni || conversazioni.length === 0) {
			box.innerHTML = "<div class=\"empty-state\"><div class=\"icon\" style=\"width:32px;height:32px;margin:0 auto 10px;color:var(--muted)\"><svg><use href=\"#i-inbox\"/></svg></div><div style=\"font-size:13.5px;line-height:1.6\">Nessuna chat ancora.<br>Usa \"+ Nuova chat\" e il codice di un altro proprietario per iniziare.</div></div>";
			return;
		}
		box.innerHTML = conversazioni.map((c) => {
			const nome = c.altro?.full_name || "Utente Equo";
			const m = c.ultimoMessaggio;
			let previewBody = "Inizia la conversazione";
			if (m) {
				previewBody = m.tipo && m.tipo !== "testo" ? previewAllegato(m.tipo, m.file_nome) : m.testo || "";
				previewBody = (m.mittente_id === currentUser.id ? "Tu: " : "") + previewBody;
			}
			return `
    <div class="inbox-item ${c.unread > 0 ? "unread" : ""}" onclick="openOwnerChatThread(${jsArg(c.id)}, ${jsArg(nome)})">
      <div class="horse-avatar"><i class="fa-solid fa-user" style="font-size:20px"></i></div>
      <div style="flex:1;min-width:0">
        <div class="inbox-name" style="font-size:14px">${escapeHtml(nome)}</div>
        <div class="inbox-preview muted" style="font-size:12.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHtml(previewBody)}</div>
      </div>
      ${c.unread > 0 ? `<span class="inbox-unread-dot"></span>` : ""}
    </div>`;
		}).join("");
	}
	async function loadStableChatSection() {
		const section = document.getElementById("stable-chat-section");
		const box = document.getElementById("stable-chat-list");
		if (!section || !box) return;
		const scuderie = await DB.listScuderieCollegate();
		if (!scuderie || scuderie.length === 0) {
			section.style.display = "none";
			return;
		}
		section.style.display = "block";
		box.innerHTML = (await Promise.all(scuderie.map(async (s) => ({
			...s,
			messaggi: await DB.listMessaggiScuderia(s.membro_id)
		})))).map((s) => {
			const ultimo = s.messaggi[s.messaggi.length - 1];
			let preview = "Inizia la conversazione con la scuderia";
			if (ultimo) preview = (ultimo.mittente_user_id === currentUser.id ? "Tu: " : "") + (ultimo.testo || previewAllegato(ultimo.tipo, ultimo.file_nome));
			const nonLetti = contaNonLettiScuderia(s.membro_id, s.messaggi);
			return `
    <div class="inbox-item" onclick="openStableChatThread(${jsArg(s.membro_id)}, ${jsArg(s.centro_id)}, ${jsArg(s.nome)})">
      <div class="horse-avatar"><i class="fa-solid fa-horse-head" style="font-size:20px"></i></div>
      <div style="flex:1;min-width:0">
        <div class="inbox-name" style="font-size:14px">${escapeHtml(s.nome)}</div>
        <div class="inbox-preview muted" style="font-size:12.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHtml(preview)}</div>
      </div>
      ${nonLetti > 0 ? `<span class="inbox-unread-dot"></span>` : ""}
    </div>`;
		}).join("");
	}
	async function openStableChatThread(membroId, centroId, nome) {
		currentStableMembro = {
			membro_id: membroId,
			centro_id: centroId,
			nome
		};
		document.getElementById("schat-nome").textContent = nome || "Scuderia";
		document.getElementById("schat-input").value = "";
		document.getElementById("schat-overlay").classList.add("active");
		await renderStableChatThread();
		avviaChatLive({
			chiave: "schat:" + membroId,
			tabella: "chat_messaggi",
			colonna: "membro_id",
			valore: membroId,
			overlay: "schat-overlay",
			aggiorna: () => currentStableMembro ? renderStableChatThread() : null,
			segnaLetti: () => segnaLettiChatApp(membroId)
		});
		await segnaLettiChatApp(membroId);
		refreshChatBadge();
	}
	// equo-app-src/src/ruoli/proprietario/moduli/026-ultimo-messaggio-home.js
	async function loadHomeLastMessage() {
		const card = document.getElementById("home-last-message-card");
		if (!card) return;
		card.style.display = "none";
		homeLastMessageTarget = null;
		if (DEMO_MODE) return;
		const candidates = [];
		const scuderie = await DB.listScuderieCollegate();
		for (const s of scuderie) {
			const msgs = await DB.listMessaggiScuderia(s.membro_id);
			const ultimo = msgs[msgs.length - 1];
			if (ultimo) candidates.push({
				tipo: "scuderia",
				nome: s.nome,
				testo: ultimo.testo || previewAllegato(ultimo.tipo, ultimo.file_nome),
				data: ultimo.created_at,
				target: s
			});
		}
		(await DB.listManiscalchiCollegati()).forEach((f) => {
			if (!f.ultimo_at) return;
			candidates.push({
				tipo: "maniscalco",
				nome: f.nome_maniscalco || "Il tuo maniscalco",
				testo: previewMessaggioMascalcia(f.ultimo_tipo, f.ultimo_testo, f.ultimo_file_nome),
				data: f.ultimo_at,
				target: f
			});
		});
		(await DB.listConversazioniProprietario() || []).forEach((c) => {
			const m = c.ultimoMessaggio;
			if (!m) return;
			const testo = m.tipo && m.tipo !== "testo" ? previewAllegato(m.tipo, m.file_nome) : m.testo || "";
			candidates.push({
				tipo: "proprietario",
				nome: c.altro?.full_name || "Utente Equo",
				testo,
				data: m.created_at,
				target: c
			});
		});
		if (candidates.length === 0) return;
		candidates.sort((a, b) => new Date(b.data) - new Date(a.data));
		window.homeChatTutte = candidates;
		const top = candidates[0];
		homeLastMessageTarget = top;
		document.getElementById("home-last-message-from").textContent = top.nome;
		document.getElementById("home-last-message-preview").textContent = top.testo;
		card.style.display = "block";
		if (typeof wgRidisegna === "function" && vistaAi() === "proprietario") wgRidisegna();
		if (typeof homeV3Chat === "function") homeV3Chat();
	}
	function goToLastMessage() {
		if (!homeLastMessageTarget) return;
		showPage("chat");
		if (homeLastMessageTarget.tipo === "scuderia") {
			const s = homeLastMessageTarget.target;
			loadStableChatSection().then(() => openStableChatThread(s.membro_id, s.centro_id, s.nome));
		} else if (homeLastMessageTarget.tipo === "maniscalco") {
			const f = homeLastMessageTarget.target;
			loadFarrierChatSection$1().then(() => openFarrierChatThread(f.cliente_mascalcia_id, f.nome_maniscalco || "Il tuo maniscalco"));
		} else {
			const c = homeLastMessageTarget.target;
			loadOwnerChatList().then(() => openOwnerChatThread(c.id, c.altro?.full_name || "Utente Equo"));
		}
	}
	function renderHorsesList() {
		const box = document.getElementById("horses-list");
		if (horses.length === 0) {
			box.innerHTML = "<div class=\"empty-state\"><div class=\"fa-icon\" style=\"width:32px;height:32px;font-size:28px;margin:0 auto 10px\"><i class=\"fa-solid fa-horse-head\"></i></div>Nessun cavallo ancora. Aggiungine uno per iniziare.</div>";
			return;
		}
		const TIPO_LABELS = {
			proprieta: "Di proprietà",
			noleggio: "A noleggio"
		};
		box.innerHTML = horses.map((h) => {
			const sub = [h.breed, TIPO_LABELS[h.tipo_proprieta] || null].filter(Boolean).join(" · ") || "Razza non specificata";
			const bl = cavalliBloccati.has(h.id);
			return `
    <div class="card horse-card${bl ? " bloccato" : ""}" data-cerca="${escapeHtml([
				h.microchip,
				h.mantello,
				h.codice_equo
			].filter(Boolean).join(" "))}" onclick="openHorseDetail('${h.id}')">
      <div class="horse-avatar"><i class="fa-solid fa-horse-head" style="font-size:22px"></i></div>
      <div>
        <div style="font-weight:700">${escapeHtml(h.name)}${bl ? " <span style=\"font-size:11px;font-weight:700;color:#7A5A00;background:#F8EDD2;border-radius:999px;padding:2px 8px;margin-left:4px\">Bloccato</span>" : ""}</div>
        <div class="muted" style="font-size:13px">${escapeHtml(sub)}</div>
      </div>
    </div>`;
		}).join("");
	}
	var TIPO_PROPRIETA_LABELS = {
		proprieta: "Cavallo di proprietà",
		noleggio: "Cavallo a noleggio"
	};
	function openHorseForm(id) {
		if (!id && !isPremium() && horses.length >= LIMITE_CAVALLI_FREE) {
			openModal("modal-limite-cavalli");
			return;
		}
		editingHorseId = id || null;
		document.getElementById("horse-error").style.display = "none";
		document.getElementById("horse-form-title").textContent = editingHorseId ? "Modifica cavallo" : "Nuovo cavallo";
		if (editingHorseId) {
			const h = horses.find((x) => x.id === editingHorseId);
			document.getElementById("horse-name").value = h?.name || "";
			document.getElementById("horse-tipo-proprieta").value = h?.tipo_proprieta || "proprieta";
			razzaImposta("horse-breed", h?.breed || "");
			document.getElementById("horse-mantello").value = h?.mantello || "";
			attivitaImposta(h?.attivita || "");
			document.getElementById("horse-birthdate").value = h?.birth_date || "";
			document.getElementById("horse-microchip").value = h?.microchip || "";
			document.getElementById("horse-gruppo-sanguigno").value = h?.gruppo_sanguigno || "";
			document.getElementById("horse-note").value = h?.note || "";
			document.getElementById("horse-condiviso").checked = h?.condiviso_ecosistema !== false;
		} else {
			[
				"horse-name",
				"horse-mantello",
				"horse-birthdate",
				"horse-microchip",
				"horse-gruppo-sanguigno",
				"horse-note"
			].forEach((id) => document.getElementById(id).value = "");
			attivitaImposta("");
			razzaImposta("horse-breed", "");
			document.getElementById("horse-tipo-proprieta").value = "proprieta";
			document.getElementById("horse-condiviso").checked = true;
		}
		openModal("modal-add-horse");
	}
	function attivitaImposta(v) {
		const sel = document.getElementById("horse-attivita"), alt = document.getElementById("horse-attivita-altro");
		if (!sel) return;
		const inElenco = [...sel.options].some((o) => o.value && o.value !== "__altro" && o.value === v);
		sel.value = !v ? "" : inElenco ? v : "__altro";
		alt.value = v && !inElenco ? v : "";
		alt.style.display = sel.value === "__altro" ? "" : "none";
	}
	function attivitaValore() {
		const sel = document.getElementById("horse-attivita");
		if (!sel) return null;
		if (sel.value === "__altro") return document.getElementById("horse-attivita-altro").value.trim().slice(0, 60) || null;
		return sel.value || null;
	}
	function raccogliDatiHorseForm() {
		const att = attivitaValore(), prima = editingHorseId ? horses.find((x) => x.id === editingHorseId)?.attivita || null : null;
		return {
			...att || prima ? { attivita: att } : {},
			name: document.getElementById("horse-name").value.trim(),
			tipo_proprieta: document.getElementById("horse-tipo-proprieta").value,
			breed: document.getElementById("horse-breed").value.trim() || null,
			mantello: document.getElementById("horse-mantello").value.trim() || null,
			birth_date: document.getElementById("horse-birthdate").value || null,
			microchip: document.getElementById("horse-microchip").value.trim() || null,
			gruppo_sanguigno: document.getElementById("horse-gruppo-sanguigno").value.trim() || null,
			note: document.getElementById("horse-note").value.trim() || null,
			condiviso_ecosistema: document.getElementById("horse-condiviso").checked
		};
	}
	async function saveHorse() {
		const errBox = document.getElementById("horse-error");
		errBox.style.display = "none";
		if (razzaValore("horse-breed") === false) return;
		const payload = raccogliDatiHorseForm();
		if (!payload.name) {
			errBox.textContent = "Inserisci il nome del cavallo.";
			errBox.style.display = "block";
			return;
		}
		if (!payload.microchip) {
			openModal("modal-microchip-warning");
			return;
		}
		await eseguiSalvataggioHorse(payload);
	}
	function tornaAInserireMicrochip() {
		closeModal("modal-microchip-warning");
		setTimeout(() => document.getElementById("horse-microchip")?.focus(), 150);
	}
	async function confermaSalvaSenzaMicrochip() {
		closeModal("modal-microchip-warning");
		await eseguiSalvataggioHorse(raccogliDatiHorseForm());
	}
	async function eseguiSalvataggioHorse(payload) {
		if (!await eseguiPrimaConStop("eseguiSalvataggioHorse", [payload])) return;
		return eseguiSalvataggioHorseBase(payload);
	}
	async function eseguiSalvataggioHorseBase(payload) {
		const errBox = document.getElementById("horse-error");
		const btn = document.getElementById("horse-save-btn");
		btn.disabled = true;
		try {
			editingHorseId;
			if (editingHorseId) {
				const { error } = await DB.updateHorse(editingHorseId, payload);
				if (error) throw error;
			} else {
				const { error, data } = await DB.insertHorse(payload);
				if (error) throw error;
				data?.id;
			}
			closeModal("modal-add-horse");
			await loadHorses();
			if (currentHorseId) await openHorseDetail(currentHorseId);
			if (payload.microchip && !DEMO_MODE) await sb.rpc("sync_microchip_link", { p_microchip: payload.microchip });
		} catch (err) {
			errBox.textContent = err.message || "Errore nel salvataggio.";
			errBox.style.display = "block";
		} finally {
			btn.disabled = false;
		}
	}
	function renderHorseInfoBox(h) {
		const x = renderHorseInfoBoxBase.apply(this, arguments);
		eseguiEstensioniSubito(estensioniDopo, "renderHorseInfoBox", [h]);
		return x;
	}
	function renderHorseInfoBoxBase(h) {
		const box = document.getElementById("horse-info-box");
		if (!box) return;
		box.innerHTML = [
			["Categoria", TIPO_PROPRIETA_LABELS[h.tipo_proprieta] || "—"],
			["Codice Equo", h.codice_equo || "in assegnazione"],
			["Razza", h.breed || "—"],
			["Mantello", h.mantello || "—"],
			["Data di nascita", h.birth_date ? formatDate(h.birth_date) : "—"],
			["Microchip", h.microchip || "Non inserito"],
			["Gruppo sanguigno", h.gruppo_sanguigno || "—"],
			["Note", h.note || "—"],
			["Condiviso con i professionisti", h.condiviso_ecosistema === false ? "No" : "Sì"]
		].map(([label, val]) => `
    <div style="display:flex;justify-content:space-between;gap:10px">
      <span class="muted">${label}</span><span style="text-align:right">${escapeHtml(String(val))}</span>
    </div>`).join("");
	}
	async function openHorseDetail(id) {
		await eseguiEstensioni(estensioniPrima, "openHorseDetail", [id]);
		const r = await openHorseDetailBase(id);
		await eseguiEstensioni(estensioniDopo, "openHorseDetail", [id]);
		return r;
	}
	async function openHorseDetailBase(id) {
		currentHorseId = id;
		const horse = horses.find((h) => h.id === id);
		if (!horse) return;
		document.getElementById("cavalli-list-view").style.display = "none";
		document.getElementById("cavalli-detail-view").style.display = "block";
		document.getElementById("detail-horse-name").textContent = horse.name;
		renderHorseBloccato(horse);
		renderLivelloCavallo(horse);
		renderHorseInfoBox(horse);
		renderDoveStaProprietario(horse);
		caricaAllegatiCavallo("horse-allegati", "proprietario", { id });
		await loadHorseEvents(id);
	}
	function closeHorseDetail() {
		currentHorseId = null;
		document.getElementById("cavalli-list-view").style.display = "block";
		document.getElementById("cavalli-detail-view").style.display = "none";
	}
	function askDeleteHorse() {
		if (!currentHorseId) return;
		const h = horses.find((x) => x.id === currentHorseId);
		document.getElementById("delete-horse-nome-1").textContent = h?.name || "questo cavallo";
		openModal("modal-delete-horse-1");
	}
	function askDeleteHorseStep2() {
		const h = horses.find((x) => x.id === currentHorseId);
		closeModal("modal-delete-horse-1");
		document.getElementById("delete-horse-nome-2").textContent = h?.name || "il cavallo";
		openModal("modal-delete-horse-2");
	}
	async function confirmDeleteHorse() {
		if (!currentHorseId) return;
		await DB.deleteHorse(currentHorseId);
		closeModal("modal-delete-horse-2");
		closeHorseDetail();
		await loadHorses();
	}
	// equo-app-src/src/ruoli/proprietario/moduli/024-codice-cavallo-2c-proposte-livelli-confe.js
	var LIVELLI_CODICE = {
		provvisorio: [
			"Provvisorio",
			"#5B6B62",
			"#E9EEEB"
		],
		validato: [
			"Validato",
			"#14573A",
			"#E3F1E9"
		],
		certificato: [
			"Certificato",
			"#7A5A00",
			"#F8EDD2"
		]
	};
	function badgeLivelloCodice(l) {
		const x = LIVELLI_CODICE[l] || LIVELLI_CODICE.provvisorio;
		return `<span style="font-size:11px;font-weight:700;color:${x[1]};background:${x[2]};border-radius:999px;padding:3px 9px">${x[0]}</span>`;
	}
	var proposteCav = [];
	async function caricaProposteCavalli() {
		const box = document.getElementById("home-proposte");
		if (!box) return;
		if (DEMO_MODE) {
			box.innerHTML = "";
			return;
		}
		try {
			const { data, error } = await sb.rpc("equo_proposte_cavalli_proprietario");
			proposteCav = !error && Array.isArray(data) ? data : [];
		} catch (e) {
			proposteCav = [];
		}
		renderProposteCavalli();
		caricaRichiesteLasciati();
	}
	var richiesteLasciati = [];
	async function caricaRichiesteLasciati() {
		const box = document.getElementById("home-lasciati");
		if (!box) return;
		if (DEMO_MODE) {
			box.innerHTML = "";
			return;
		}
		try {
			const { data, error } = await sb.rpc("equo_richieste_lasciati");
			richiesteLasciati = !error && Array.isArray(data) ? data : [];
		} catch (e) {
			richiesteLasciati = [];
		}
		if (!richiesteLasciati.length) {
			box.innerHTML = "";
			return;
		}
		box.innerHTML = `<div class="card" style="margin-bottom:14px">
    <div class="section-title" style="margin-bottom:4px">Richieste del maniscalco</div>
    <div class="muted" style="font-size:13px;line-height:1.5;margin-bottom:6px">Il maniscalco chiede di non seguire più questi cavalli. Se confermi, il cavallo esce dalla sua lista e i suoi appuntamenti ancora da fare si annullano; lo storico resta.</div>
    ${richiesteLasciati.map((r) => `
    <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 0;border-top:1px solid var(--border,#DDE5E0)">
      <div style="min-width:0"><div style="font-weight:600">${escapeHtml(r.cavallo || "")}</div>
        <div class="muted" style="font-size:12px">${escapeHtml(r.maniscalco || "Il maniscalco")}${r.motivo ? " · «" + escapeHtml(r.motivo) + "»" : ""}</div></div>
      <div style="display:flex;gap:6px;flex-shrink:0">
        <button class="btn btn-primary btn-sm" onclick="rispondiLasciato('${r.id}', true)">Conferma</button>
        <button class="btn btn-ghost btn-sm" onclick="rispondiLasciato('${r.id}', false)">Rifiuta</button>
      </div>
    </div>`).join("")}
  </div>`;
	}
	async function rispondiLasciato(id, conferma) {
		const { data, error } = await sb.rpc("equo_rispondi_lasciato", {
			p_id: id,
			p_conferma: !!conferma
		});
		if (error || !data?.ok) {
			showToast("Operazione non riuscita. Riprova.");
			return;
		}
		showToast(conferma ? "Confermato: il maniscalco non segue più il cavallo" : "Rifiutato: il maniscalco continua a seguirlo");
		caricaRichiesteLasciati();
	}
	function renderProposteCavalli() {
		const box = document.getElementById("home-proposte");
		if (!box) return;
		if (!proposteCav.length) {
			box.innerHTML = "";
			return;
		}
		const man = proposteCav[0].maniscalco || "Il tuo maniscalco";
		const righe = proposteCav.map((p) => `
    <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 0;border-top:1px solid var(--border,#DDE5E0)">
      <div style="min-width:0"><div style="font-weight:600">${escapeHtml(p.nome || "")}</div>
        <div class="muted" style="font-size:12px">${escapeHtml([p.razza, p.codice].filter(Boolean).join(" · "))}${p.esiste_gia ? " · hai già un cavallo con questo nome: si uniscono" : ""}</div></div>
      <div style="display:flex;gap:6px;flex-shrink:0">
        <button class="btn btn-primary btn-sm" onclick="accettaProposta('${p.proposta}')">Accetta</button>
        <button class="btn btn-ghost btn-sm" onclick="rifiutaProposta('${p.proposta}')">Non è mio</button>
      </div>
    </div>`).join("");
		box.innerHTML = `<div class="card" style="margin-bottom:14px">
    <div class="section-title" style="margin-bottom:4px">${escapeHtml(man)} ha preparato ${proposteCav.length === 1 ? "1 cavallo" : proposteCav.length + " cavalli"} per te</div>
    <div class="muted" style="font-size:13px;line-height:1.5;margin-bottom:6px">Accettali: non crei nulla da zero e non nascono schede doppie. Poi controlli e completi i dati.${isPremium() ? "" : " Con il piano Free è completo un solo cavallo: gli altri si aggiungono ma restano bloccati finché non passi a Premium."}</div>
    ${righe}
    ${proposteCav.length > 1 ? `<button class="btn btn-outline" style="width:100%;margin-top:8px" onclick="accettaTuttiProposte()">Accetta tutti</button>` : ""}
  </div>`;
	}
	async function accettaPropostaSilenzioso(id) {
		const { data, error } = await sb.rpc("equo_accetta_cavallo_proposto", { p_proposta: id });
		if (error || !data) return {
			ok: false,
			motivo: "errore"
		};
		return data;
	}
	function messaggioProposta(res) {
		if (res.motivo === "limite_cavalli_free") return "Con il piano Free puoi avere un solo cavallo: passa a Premium per accettare anche gli altri.";
		if (res.motivo === "proposta_non_trovata") return "Questa proposta non è più disponibile.";
		return "Operazione non riuscita. Riprova.";
	}
	async function accettaProposta(id) {
		const res = await accettaPropostaSilenzioso(id);
		if (!res.ok) {
			showToast(messaggioProposta(res));
			return;
		}
		showToast("Cavallo aggiunto. Controlla i dati e confermali.");
		await loadHorses();
		await caricaCavalliBloccati();
		if (res.horse_id && horses.some((h) => h.id === res.horse_id)) openHorseDetail(res.horse_id);
	}
	async function accettaTuttiProposte() {
		let n = 0, stop = null;
		for (const p of [...proposteCav]) {
			const res = await accettaPropostaSilenzioso(p.proposta);
			if (res.ok) n++;
			else {
				stop = res;
				break;
			}
		}
		if (n) showToast(n === 1 ? "1 cavallo aggiunto." : n + " cavalli aggiunti.");
		if (stop) {
			showToast(messaggioProposta(stop));
			if (stop.motivo === "limite_cavalli_free") openModal("modal-limite-cavalli");
		}
		await loadHorses();
	}
	async function rifiutaProposta(id) {
		const { data } = await sb.rpc("equo_rifiuta_cavallo_proposto", { p_proposta: id });
		showToast(data?.ok ? "Fatto: il maniscalco potrà correggere la scheda." : "Operazione non riuscita.");
		caricaProposteCavalli();
	}
	var cavalliBloccati = /* @__PURE__ */ new Set();
	function cavalliUsabili$1() {
		return (horses || []).filter((h) => !cavalliBloccati.has(h.id));
	}
	async function caricaCavalliBloccati() {
		if (DEMO_MODE) return;
		let ids = [];
		if (!isPremium()) try {
			const { data, error } = await sb.rpc("equo_cavalli_bloccati");
			if (!error && Array.isArray(data)) ids = data;
		} catch (e) {}
		const nuovo = ids.join(",");
		const vecchio = [...cavalliBloccati].join(",");
		cavalliBloccati = new Set(ids);
		if (nuovo !== vecchio) renderHorsesList();
	}
	function renderHorseBloccato(h) {
		const box = document.getElementById("horse-lock-box");
		const v = document.getElementById("cavalli-detail-view");
		if (!box || !v) return;
		if (!h || !cavalliBloccati.has(h.id)) {
			box.innerHTML = "";
			v.classList.remove("bloccato");
			return;
		}
		v.classList.add("bloccato");
		box.innerHTML = `<div class="card" style="margin-bottom:14px;text-align:center;padding:18px">
    <div style="font-weight:700;margin-bottom:6px">Scheda e interventi di ${escapeHtml(h.name)} sono bloccati</div>
    <div class="muted" style="font-size:13px;line-height:1.55;margin-bottom:12px">Il tuo maniscalco continua a registrare gli interventi, che restano al sicuro. Con il piano Free è completo un solo cavallo: passa a Premium per sbloccare questa scheda, con tutto il suo storico.</div>
    <button class="btn btn-primary" style="width:100%" onclick="openModal('modal-limite-cavalli')">Sblocca con Premium</button></div>`;
	}
	async function renderLivelloCavallo(h) {
		const box = document.getElementById("horse-livello-box");
		if (!box) return;
		const liv = h.codice_livello || "provvisorio";
		const codice = h.codice_equo || "in assegnazione";
		const testa = `<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px"><div><b class="cod-equo">${escapeHtml(codice)}</b></div>${badgeLivelloCodice(liv)}</div>`;
		box.innerHTML = `<div class="card" style="margin-bottom:12px">${testa}</div>`;
		if (DEMO_MODE) return;
		let st = null;
		try {
			st = (await sb.rpc("equo_stato_codice", { p_horse: h.id })).data;
		} catch (e) {}
		if (currentHorseId !== h.id || !st || !st.ok) return;
		const v = (ok, t) => `<div style="font-size:13.5px;padding:2px 0;color:${ok ? "#14573A" : "var(--muted)"}">${ok ? "✓" : "○"} ${t}</div>`;
		const dati = st.nome && st.razza && st.nascita;
		let corpo = v(st.nome, "Nome") + v(st.razza, "Razza") + v(st.nascita, "Data di nascita") + v(st.conferma_proprietario, "Tua conferma dei dati") + v(st.conferme_valide >= 2, "Seconda conferma da un professionista collegato (" + Math.min(st.conferme_valide, 2) + "/2)");
		let msg = "";
		if (liv === "provvisorio") msg = !dati ? "Completa nome, razza e data di nascita per poter confermare." : !st.io_ho_confermato ? "Controlla i dati e confermali. Con la conferma di un professionista il codice diventa definitivo." : "Tua conferma data. Manca la conferma di un professionista collegato (maniscalco, istruttore o scuderia).";
		else if (liv === "validato") msg = "Codice definitivo" + (st.codice_definitivo ? ": " + st.codice_definitivo : "") + ". Se cambi nome, razza o data di nascita, le conferme vanno rinnovate.";
		else msg = "Microchip verificato: il cavallo è Certificato.";
		const btn = dati && !st.io_ho_confermato ? `<button class="btn btn-primary" style="width:100%;margin-top:8px" onclick="confermaDatiCavallo('${h.id}')">Confermo i dati</button>` : !dati ? `<button class="btn btn-outline" style="width:100%;margin-top:8px" onclick="openHorseForm('${h.id}')">Completa i dati</button>` : "";
		box.innerHTML = `<div class="card" style="margin-bottom:12px">${testa}${corpo}<div class="muted" style="font-size:12.5px;line-height:1.5;margin-top:8px">${escapeHtml(msg)}</div>${btn}</div>`;
	}
	async function confermaDatiCavallo(id) {
		const { data, error } = await sb.rpc("equo_conferma_cavallo", { p_horse: id });
		if (error || !data?.ok) {
			showToast(data?.motivo === "dati_incompleti" ? "Completa nome, razza e data di nascita." : "Conferma non riuscita. Riprova.");
			return;
		}
		showToast(data.livello === "validato" ? "Codice definitivo assegnato: " + (data.codice_definitivo || "") : "Conferma registrata.");
		await loadHorses();
		if (horses.some((h) => h.id === id)) openHorseDetail(id);
	}
	var confermePro = [];
	var confermeProTs = 0;
	var confermeProBox = "hm-conferme";
	async function caricaConfermePro(force, idBox) {
		if (idBox) confermeProBox = idBox;
		const box = document.getElementById(confermeProBox);
		if (!box || DEMO_MODE) return;
		if (!force && Date.now() - confermeProTs < 6e4) return;
		confermeProTs = Date.now();
		try {
			const { data, error } = await sb.rpc("equo_cavalli_da_confermare");
			confermePro = !error && Array.isArray(data) ? data : [];
		} catch (e) {
			confermePro = [];
		}
		if (!confermePro.length) {
			box.innerHTML = "";
			return;
		}
		const righe = confermePro.map((c, i) => `
    <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:9px 0;border-top:1px solid var(--border,#DDE5E0)">
      <div style="min-width:0"><div style="font-weight:600">${escapeHtml(c.nome || "")}</div>
        <div class="muted" style="font-size:12px">${escapeHtml(c.codice || "")}${c.motivo === "dati_modificati" ? " · dati cambiati, riconferma" : ""}</div></div>
      <button class="btn btn-primary btn-sm" onclick="confermaCavalloPro(${i})">Confermo</button>
    </div>`).join("");
		box.innerHTML = `<div class="card" style="margin:0 0 14px">
    <div class="section-title" style="margin-bottom:2px">Da confermare (${confermePro.length})</div>
    <div class="muted" style="font-size:12.5px;line-height:1.5;margin-bottom:4px">Conferma che nome, razza e data di nascita sono giusti: serve la tua conferma, con quella del proprietario, per il codice definitivo.</div>
    ${righe}</div>`;
	}
	async function confermaCavalloPro(i) {
		const c = confermePro[i];
		if (!c) return;
		const { data, error } = await sb.rpc("equo_conferma_cavallo", {
			p_horse: c.horse_id || null,
			p_scuderia_cavallo: c.scuderia_cavallo_id || null
		});
		if (error || !data?.ok) {
			showToast("Conferma non riuscita. Riprova.");
			return;
		}
		showToast(data.livello === "validato" ? "Confermato: codice definitivo " + (data.codice_definitivo || "") : "Conferma registrata.");
		caricaConfermePro(true);
	}
	async function renderProposteCliente(c) {
		const box = document.getElementById("cliente-proposte-box");
		if (!box) return;
		box.innerHTML = "";
		if (DEMO_MODE || !c || !c.cliente_user_id || isStruttura(c)) return;
		let lista = [];
		try {
			const { data } = await sb.rpc("equo_proposte_inviate", { p_cliente: c.id });
			lista = Array.isArray(data) ? data : [];
		} catch (e) {}
		if (currentClienteId !== c.id) return;
		const n = (s) => lista.filter((p) => p.stato === s).length;
		box.innerHTML = `<div class="card" style="margin:0 0 12px"><div style="font-weight:600;margin-bottom:2px">Cavalli proposti al proprietario</div>
    <div class="muted" style="font-size:12.5px;line-height:1.5;margin-bottom:8px">${lista.length ? `In attesa: ${n("in_attesa")} · accettati: ${n("accettata")} · rifiutati: ${n("rifiutata")}` : "Nessun cavallo ancora proposto."}</div>
    <button class="btn btn-outline btn-sm" onclick="proponiCavalliCliente('${c.id}')">Proponi i cavalli al proprietario</button></div>`;
	}
	async function proponiCavalliCliente(clienteId) {
		const { data, error } = await sb.rpc("equo_proponi_cavalli_cliente", { p_cliente: clienteId });
		if (error || !data?.ok) {
			showToast(data?.motivo === "cliente_non_collegato" ? "Il cliente non ha ancora collegato l'app." : "Operazione non riuscita.");
			return;
		}
		showToast(data.proposti ? data.proposti + (data.proposti === 1 ? " cavallo proposto." : " cavalli proposti.") : "Niente di nuovo da proporre.");
		const c = clientiMascalcia.find((x) => x.id === clienteId);
		if (c) renderProposteCliente(c);
	}
	// equo-app-src/src/ruoli/proprietario/moduli/071-pagamenti-da-saldare-al-maniscalco-propr.js
	async function caricaDaSaldare() {
		const box = document.getElementById("home-da-saldare");
		if (!box) return;
		if (DEMO_MODE || !currentUser) {
			box.style.display = "none";
			return;
		}
		try {
			const { data, error } = await sb.rpc("prop_pagamenti_da_saldare");
			if (error) throw error;
			daSaldareStato.righe = data?.righe || [];
			daSaldareStato.daRicordare = !!data?.da_ricordare;
		} catch (e) {
			daSaldareStato.righe = [];
			daSaldareStato.daRicordare = false;
		}
		renderDaSaldare();
		const badge = document.getElementById("owner-chat-nav-badge");
		if (badge && daSaldareStato.daRicordare) badge.style.display = "block";
	}
	function euroIt(v) {
		return "€ " + Number(v || 0).toFixed(2).replace(".", ",");
	}
	function renderDaSaldare() {
		const box = document.getElementById("home-da-saldare");
		const righe = daSaldareStato.righe;
		if (!righe.length) {
			box.style.display = "none";
			box.innerHTML = "";
			return;
		}
		box.style.display = "block";
		const tot = righe.filter((r) => !r.segnalato).reduce((t, r) => t + Number(r.importo || 0), 0);
		if (!(daSaldareStato.daRicordare || daSaldareStato.aperto)) {
			box.innerHTML = `<button type="button" class="ds-riga-corta" onclick="daSaldareStato.aperto=true;renderDaSaldare()"><span>💶 Da saldare${tot ? " · " + euroIt(tot) : ""}</span><span class="muted">Vedi ›</span></button>`;
			return;
		}
		const perMan = {};
		righe.forEach((r) => {
			(perMan[r.maniscalco_id] = perMan[r.maniscalco_id] || {
				nome: r.maniscalco,
				iban: r.iban,
				paypal: r.paypal,
				pag_nome: r.pag_nome,
				righe: []
			}).righe.push(r);
		});
		box.innerHTML = `<div class="card ds-card">
    <div class="ds-testa"><span>${daSaldareStato.daRicordare ? "<i class=\"ds-dot\"></i>" : ""}💶 Da saldare</span><b>${euroIt(tot)}</b></div>
    ${Object.entries(perMan).map(([mid, m]) => `
      <div class="ds-man">${escapeHtml(m.nome || "Il tuo maniscalco")}</div>
      ${m.righe.map((r) => `<div class="ds-voce">
        <div><div>${escapeHtml([r.tipo, r.cavallo].filter(Boolean).join(" · "))}</div><small class="muted">${formatDataBreve(r.data)}${r.segnalato ? " · segnalato come pagato, in attesa del maniscalco" : ""}</small></div>
        <div class="ds-dx"><b>${euroIt(r.importo)}</b>${r.segnalato ? "" : `<button type="button" onclick="segnalaGiaPagato('${r.id}', this)">Ho già pagato</button>`}</div>
      </div>`).join("")}
      ${m.iban || m.paypal ? `<button type="button" class="ds-link" onclick="daSaldareStato.pagaAperto = daSaldareStato.pagaAperto === '${mid}' ? null : '${mid}'; renderDaSaldare()">Come pagare ${daSaldareStato.pagaAperto === mid ? "▴" : "▾"}</button>
        ${daSaldareStato.pagaAperto === mid ? `<div class="ds-paga">${m.pag_nome ? `<div><small class="muted">Intestatario</small><br>${escapeHtml(m.pag_nome)}</div>` : ""}${m.iban ? `<div><small class="muted">IBAN</small><br><span class="ds-copia" onclick="copiaTestoDs('${escapeHtml(m.iban)}')">${escapeHtml(m.iban)} <i class="fa-regular fa-copy"></i></span></div>` : ""}${m.paypal ? `<div><small class="muted">PayPal</small><br><span class="ds-copia" onclick="copiaTestoDs('${escapeHtml(m.paypal)}')">${escapeHtml(m.paypal)} <i class="fa-regular fa-copy"></i></span></div>` : ""}</div>` : ""}` : ""}
    `).join("")}
    ${daSaldareStato.daRicordare ? `<button type="button" class="ds-ok" onclick="daSaldareVisto()">Ok, ricordamelo tra 5 giorni</button>` : `<button type="button" class="ds-ok" onclick="daSaldareStato.aperto=false;renderDaSaldare()">Chiudi</button>`}
  </div>`;
	}
	function copiaTestoDs(t) {
		if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(() => showToast("Copiato")).catch(() => showToast(t));
		else showToast(t);
	}
	async function daSaldareVisto() {
		daSaldareStato.daRicordare = false;
		daSaldareStato.aperto = false;
		renderDaSaldare();
		try {
			await sb.rpc("prop_pagamenti_visti");
		} catch (e) {}
		refreshChatBadge();
	}
	async function segnalaGiaPagato(id, btn) {
		if (!confirm("Confermi di aver già pagato? Il maniscalco riceve un messaggio in chat e il promemoria si ferma.")) return;
		if (btn) btn.disabled = true;
		try {
			const { data, error } = await sb.rpc("prop_segnala_pagato", { p_intervento: id });
			if (error || !data?.ok) throw error || /* @__PURE__ */ new Error("non riuscito");
			showToast("Fatto: il maniscalco riceve il tuo messaggio in chat");
			await caricaDaSaldare();
		} catch (e) {
			showToast("Non riuscito, riprova.");
			if (btn) btn.disabled = false;
		}
	}
	// equo-app-src/src/ruoli/proprietario/moduli/079-expenses.js
	async function loadExpensesSummary() {
		if (horses.map((h) => h.id).length === 0) return;
		const startOfMonth = /* @__PURE__ */ new Date();
		startOfMonth.setDate(1);
		startOfMonth.setHours(0, 0, 0, 0);
		const total = (await DB.listExpenses()).filter((e) => new Date(e.date) >= startOfMonth).reduce((sum, e) => sum + Number(e.amount || 0), 0);
		document.getElementById("stat-expenses").textContent = "€ " + total.toFixed(0);
	}
	async function loadExpenses() {
		const box = document.getElementById("expenses-list");
		box.innerHTML = "<div class=\"loading\"><div class=\"spinner\"></div> Caricamento...</div>";
		const data = await DB.listExpenses();
		currentExpensesData = data || [];
		if (!data || data.length === 0) {
			box.innerHTML = "<div class=\"empty-state\"><div class=\"icon\" style=\"width:32px;height:32px;margin:0 auto 10px\"><svg><use href=\"#i-wallet\"/></svg></div>Nessuna spesa registrata.</div>";
			document.getElementById("expenses-month-total").textContent = "€ 0";
			return;
		}
		const startOfMonth = /* @__PURE__ */ new Date();
		startOfMonth.setDate(1);
		const monthTotal = data.filter((e) => new Date(e.date) >= startOfMonth).reduce((s, e) => s + Number(e.amount || 0), 0);
		document.getElementById("expenses-month-total").textContent = "€ " + monthTotal.toFixed(2);
		box.innerHTML = data.map((e) => `
    <div class="event-item" style="cursor:pointer" onclick="openEditExpenseModal('${e.id}')">
      <div>
        <div style="font-weight:600;font-size:14px;text-transform:capitalize">${escapeHtml(e.category)}${e.horses?.name ? " · " + escapeHtml(e.horses.name) : ""}</div>
        <div class="muted" style="font-size:12px">${formatDate(e.date)}${e.notes ? " · " + escapeHtml(e.notes) : ""}</div>
      </div>
      <div style="font-weight:700">€ ${Number(e.amount).toFixed(2)}</div>
    </div>
  `).join("");
	}
	var editingExpenseId = null;
	function openAddExpenseModal() {
		editingExpenseId = null;
		document.getElementById("modal-add-expense-title").textContent = "Nuova spesa";
		document.getElementById("expense-category").value = "pensione";
		document.getElementById("expense-amount").value = "";
		document.getElementById("expense-date").value = "";
		document.getElementById("expense-notes").value = "";
		document.getElementById("expense-delete-btn").style.display = "none";
		openModal("modal-add-expense");
	}
	function openEditExpenseModal(id) {
		const e = currentExpensesData.find((x) => x.id === id);
		if (!e) return;
		editingExpenseId = id;
		document.getElementById("modal-add-expense-title").textContent = "Modifica spesa";
		document.getElementById("expense-category").value = e.category;
		document.getElementById("expense-amount").value = e.amount;
		document.getElementById("expense-date").value = e.date;
		document.getElementById("expense-notes").value = e.notes || "";
		document.getElementById("expense-delete-btn").style.display = "block";
		openModal("modal-add-expense");
	}
	async function saveExpense() {
		const category = document.getElementById("expense-category").value;
		const amount = parseFloat(document.getElementById("expense-amount").value);
		const date = document.getElementById("expense-date").value;
		const notes = document.getElementById("expense-notes").value.trim();
		if (!amount || !date) return;
		const existing = editingExpenseId ? currentExpensesData.find((x) => x.id === editingExpenseId) : null;
		const payload = {
			horse_id: existing ? existing.horse_id : currentHorseId || (horses[0] ? horses[0].id : null),
			category,
			amount,
			date,
			notes
		};
		const { error } = editingExpenseId ? await DB.updateExpense(editingExpenseId, payload) : await DB.insertExpense(payload);
		if (error) {
			alert("Errore: " + error.message);
			return;
		}
		document.getElementById("expense-amount").value = "";
		document.getElementById("expense-date").value = "";
		document.getElementById("expense-notes").value = "";
		editingExpenseId = null;
		closeModal("modal-add-expense");
		await loadExpenses();
		await loadExpensesSummary();
	}
	async function deleteExpenseFromModal() {
		if (!editingExpenseId) return;
		if (!confirm("Eliminare questa spesa?")) return;
		await DB.deleteExpense(editingExpenseId);
		editingExpenseId = null;
		closeModal("modal-add-expense");
		await loadExpenses();
		await loadExpensesSummary();
	}
	// equo-app-src/src/ruoli/proprietario/moduli/089-early-adopter-arrivo-dal-sito-ottobre-20.js
	var EARLY_KEY = "equo-early";
	var EARLY_PREZZO = {
		proprietario: 49,
		professionista: 99
	};
	var EARLY_ANNUALE = {
		proprietario: 19,
		professionista: 59
	};
	var EARLY_NOME = {
		proprietario: "Proprietari",
		professionista: "Professionisti"
	};
	var EARLY_RITORNO_STRIPE = new URLSearchParams(location.search).has("checkout");
	function earlyLeggi() {
		try {
			const v = JSON.parse(lsGet(EARLY_KEY) || "null");
			if (v && EARLY_PREZZO[v.piano] && Date.now() - v.t < 1728e5) return v;
		} catch (e) {}
		return null;
	}
	function earlyCancella() {
		lsDel(EARLY_KEY);
		document.querySelectorAll(".early-avviso").forEach((el) => el.remove());
		document.querySelectorAll(".early-scelta").forEach((el) => el.classList.remove("early-scelta"));
	}
	(function earlyDaUrl() {
		const p = new URLSearchParams(location.search);
		const e = p.get("early");
		if (e === "proprietario" || e === "professionista") {
			lsSet(EARLY_KEY, JSON.stringify({
				piano: e,
				t: Date.now()
			}));
			p.delete("early");
			history.replaceState({}, "", location.pathname + (p.toString() ? "?" + p.toString() : ""));
		}
	})();
	function earlyAvvisoHtml(e, testo) {
		return `<div class="early-avviso"><span class="early-medaglia">★</span><div><b>Stai per diventare Early Adopter</b><span>Premium a vita · ${EARLY_NOME[e.piano]} · ${EARLY_PREZZO[e.piano]} € una volta sola</span><small>${testo}</small></div></div>`;
	}
	function earlyMostraAvvisi() {
		const e = earlyLeggi();
		if (!e || typeof DEMO_MODE !== "undefined" && DEMO_MODE) return;
		const tag = document.querySelector("#screen-auth .auth-tagline");
		if (tag && !document.querySelector("#screen-auth .early-avviso")) tag.insertAdjacentHTML("afterend", earlyAvvisoHtml(e, "Accedi o crea il tuo account: subito dopo completi il pagamento."));
		const lista = document.querySelector("#onb-step-1 .role-list");
		if (lista && !document.querySelector("#onb-step-1 .early-avviso")) {
			lista.insertAdjacentHTML("beforebegin", earlyAvvisoHtml(e, e.piano === "proprietario" ? "Scegli «Ho un cavallo» per continuare." : "Scegli «Sono un professionista» e poi la tua professione."));
			const bottoni = lista.querySelectorAll(".role-card");
			const giusto = e.piano === "proprietario" ? bottoni[0] : bottoni[1];
			if (giusto) giusto.classList.add("early-scelta");
		}
	}
	var earlyInCorso = false;
	async function earlyControlla() {
		const e = earlyLeggi();
		if (!e || DEMO_MODE || !currentUser || EARLY_RITORNO_STRIPE || earlyInCorso) return;
		if (document.getElementById("modal-early")?.classList.contains("active")) return;
		if (document.getElementById("screen-onboarding")?.classList.contains("active")) return;
		earlyInCorso = true;
		try {
			const { data: prof } = await sb.from("profiles").select("piano, stripe_subscription_id, stripe_customer_id").eq("id", currentUser.id).maybeSingle();
			if (prof?.piano === "premium" && prof.stripe_customer_id && !prof.stripe_subscription_id) {
				earlyCancella();
				showToast("Sei già Premium a vita: grazie per essere un Early Adopter!");
				return;
			}
			let ruoloVista = currentPianoRuolo();
			let cambio = null;
			if (e.piano !== ruoloVista) {
				const ruoli = [currentUser.ruolo, currentUser.ruoloSecondario].filter(Boolean);
				const target = e.piano === "professionista" ? ruoli.find((r) => PRO_ROLES.includes(r)) : ruoli.includes("proprietario") ? "proprietario" : null;
				if (target) {
					await enterApp(target);
					ruoloVista = currentPianoRuolo();
				} else cambio = {
					scelto: e.piano,
					giusto: ruoloVista
				};
			}
			let rimasti = null;
			try {
				const { data } = await sb.rpc("promo_posti");
				const r = data && data[ruoloVista === "professionista" ? "professionisti" : "proprietari"];
				if (r && typeof r.rimasti === "number") rimasti = r.rimasti;
			} catch (_) {}
			earlyApriFinestra(ruoloVista, rimasti, !!(prof?.piano === "premium" && prof?.stripe_subscription_id), cambio);
		} finally {
			earlyInCorso = false;
		}
	}
	function earlyApriFinestra(ruolo, rimasti, abbonato, cambio) {
		let ov = document.getElementById("modal-early");
		if (!ov) {
			ov = document.createElement("div");
			ov.className = "modal-overlay";
			ov.id = "modal-early";
			ov.addEventListener("click", (ev) => {
				if (ev.target === ov) earlyNonOra();
			});
			document.body.appendChild(ov);
		}
		const prezzo = EARLY_PREZZO[ruolo], annuale = EARLY_ANNUALE[ruolo];
		const esauriti = rimasti === 0;
		const risparmio = Math.round((1 - prezzo / (annuale * 10)) * 100);
		ov.innerHTML = `<div class="modal early-finestra">
    <div class="modal-handle"></div>
    <div class="early-testa"><span class="early-medaglia grande">★</span><div><div class="modal-title" style="margin:0">Diventa Early Adopter</div><div class="muted" style="font-size:13px">Equo Premium a vita · ${EARLY_NOME[ruolo]}</div></div></div>
    ${cambio ? `<div class="early-nota">Sul sito hai scelto il pacchetto <b>${EARLY_NOME[cambio.scelto]}</b>, ma il tuo profilo è <b>${cambio.giusto === "professionista" ? "professionista" : "proprietario"}</b>: per te c'è il pacchetto <b>${EARLY_NOME[ruolo]}</b> qui sotto.</div>` : ""}
    ${esauriti ? `<p class="early-txt">I posti Early Adopter per i ${EARLY_NOME[ruolo].toLowerCase()} sono <b>esauriti</b>. Grazie per l'interesse: puoi comunque passare a Premium con il piano mensile o annuale.</p>
         <div style="display:flex;flex-direction:column;gap:10px"><button class="btn btn-primary" style="width:100%" onclick="earlyCancella();closeModal('modal-early');togglePiano()">Vedi i piani Premium</button><button class="btn btn-outline" style="width:100%" onclick="earlyNonOra()">Chiudi</button></div>` : `<div class="early-prezzo">${prezzo} € <small>una volta sola</small></div>
         <ul class="early-punti">
           <li>Premium a vita, senza abbonamento e senza rinnovi</li>
           <li>−${risparmio}% in 10 anni rispetto al piano annuale (${annuale}&nbsp;€/anno)</li>
           <li>Accesso in anteprima alle nuove funzioni</li>
         </ul>
         ${rimasti != null ? `<div class="early-posti">Restano <b>${rimasti}</b> posti</div>` : ""}
         ${abbonato ? `<div class="early-nota">Hai già un abbonamento Premium: dopo il pagamento lo chiudiamo noi in automatico, così non paghi più rinnovi.</div>` : ""}
         <div style="display:flex;flex-direction:column;gap:10px;margin-top:4px"><button class="btn btn-primary" style="width:100%" onclick="earlyPaga()">Paga ${prezzo} € e diventa Early Adopter</button><button class="btn btn-outline" style="width:100%" onclick="earlyNonOra()">Non ora</button></div>
         <div class="muted" style="font-size:11.5px;line-height:1.5;margin-top:10px;text-align:center">Pagamento sicuro con Stripe: carta, Apple Pay, Google Pay, PayPal. Rimborso completo entro 14 giorni se cambi idea.</div>`}
  </div>`;
		openModal("modal-early");
	}
	function earlyNonOra() {
		earlyCancella();
		closeModal("modal-early");
	}
	function earlyPaga() {
		lsSet("equo-early-pagamento", "1");
		startLifetimeCheckout();
	}
	function earlyDopoRitorno(esito, premiumAttivo) {
		const pagando = lsGet("equo-early-pagamento") === "1";
		lsDel("equo-early-pagamento");
		if (!pagando) return false;
		earlyCancella();
		if (esito === "success" && premiumAttivo) {
			showToast("Benvenuto tra gli Early Adopter! Il tuo Premium a vita è attivo.");
			return true;
		}
		return false;
	}
	async function earlyAggiornaBottoneLifetime() {
		const btn = document.getElementById("upgrade-btn-lifetime");
		if (!btn || DEMO_MODE) return;
		try {
			const ruolo = currentPianoRuolo();
			const { data } = await sb.rpc("promo_posti");
			const r = data && data[ruolo === "professionista" ? "professionisti" : "proprietari"];
			if (!r || typeof r.rimasti !== "number") return;
			if (r.rimasti === 0) {
				btn.style.display = "none";
				return;
			}
			btn.style.display = "";
			btn.textContent = PREZZI_PREMIUM[ruolo].lifetime + " · Early Adopter, restano " + r.rimasti + " posti";
		} catch (e) {}
	}
	if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", earlyMostraAvvisi);
	else setTimeout(earlyMostraAvvisi, 0);
	var REF_KEY = "equo-ref";
	(function refDaUrl() {
		const p = new URLSearchParams(location.search);
		const r = p.get("ref");
		if (r && /^[A-Za-z0-9_-]{2,40}$/.test(r)) {
			lsSet(REF_KEY, JSON.stringify({
				codice: r.toUpperCase(),
				t: Date.now()
			}));
			p.delete("ref");
			history.replaceState({}, "", location.pathname + (p.toString() ? "?" + p.toString() : ""));
		}
	})();
	function refLeggi() {
		try {
			const v = JSON.parse(lsGet(REF_KEY) || "null");
			if (v && v.codice && Date.now() - v.t < 2592e6) return v;
		} catch (e) {}
		return null;
	}
	function refCancella() {
		lsDel(REF_KEY);
		document.querySelectorAll(".ref-avviso").forEach((el) => el.remove());
	}
	var refInfoCache = null;
	async function refMostraAvvisi() {
		const r = refLeggi();
		if (!r || typeof DEMO_MODE !== "undefined" && DEMO_MODE || typeof sb === "undefined") return;
		try {
			if (!refInfoCache || refInfoCache.codice !== r.codice) {
				const { data } = await sb.rpc("equo_referral_info", { p_codice: r.codice });
				if (!data || typeof data.valido !== "boolean") return;
				refInfoCache = {
					codice: r.codice,
					info: data
				};
			}
		} catch (e) {
			return;
		}
		const info = refInfoCache.info;
		if (!info.valido) return;
		const mesi = Math.round((info.giorni || 90) / 30);
		const html = (t) => `<div class="ref-avviso"><span class="early-medaglia">★</span><div><b>Invito di ${escapeHtml(info.nome)}</b><span>${mesi} mesi di Premium gratis, senza carta</span><small>${t}</small></div></div>`;
		const tag = document.querySelector("#screen-auth .auth-tagline");
		if (tag && !document.querySelector("#screen-auth .ref-avviso")) tag.insertAdjacentHTML("afterend", html("Crea il tuo account e scegli «Ho un cavallo»: il Premium parte da solo."));
		const lista = document.querySelector("#onb-step-1 .role-list");
		if (lista && !document.querySelector("#onb-step-1 .ref-avviso")) lista.insertAdjacentHTML("beforebegin", html("Scegli «Ho un cavallo» per attivarlo."));
	}
	var refInCorso = false;
	async function referralControlla() {
		if (DEMO_MODE || !currentUser || refInCorso) return;
		refInCorso = true;
		try {
			try {
				const { data } = await sb.rpc("equo_controlla_premium");
				if (data?.scaduto) {
					currentUser.piano = "free";
					currentUser.premiumLivello = null;
					showToast("I tuoi mesi di Premium in regalo sono finiti: sei tornato al piano Free. Puoi passare a Premium quando vuoi dal menu.");
				}
			} catch (e) {}
			const r = refLeggi();
			if (!r) return;
			if (![currentUser.ruolo, currentUser.ruoloSecondario].filter(Boolean).includes("proprietario")) return;
			const { data, error } = await sb.rpc("equo_riscatta_referral", { p_codice: r.codice });
			if (error) {
				console.error("referral:", error);
				return;
			}
			if (data?.ok) {
				refCancella();
				currentUser.piano = "premium";
				currentUser.premiumLivello = "proprietario";
				const fino = new Date(data.premium_fino).toLocaleDateString("it-IT", {
					day: "numeric",
					month: "long",
					year: "numeric"
				});
				showToast(`Benvenuto! Hai ${Math.round((data.giorni || 90) / 30)} mesi di Premium gratis grazie a ${data.nome}, fino al ${fino}.`);
				return;
			}
			if (data?.errore === "profilo") return;
			refCancella();
			const msg = {
				gia_usato: "Hai già usato un codice invito.",
				gia_premium: "Sei già Premium: il codice invito non serve.",
				non_nuovo: "Il codice invito vale solo per i nuovi iscritti.",
				esaurito: "Questo codice invito ha esaurito i posti.",
				codice_non_valido: "Questo codice invito non è più valido."
			}[data?.errore];
			if (msg) showToast(msg);
		} finally {
			refInCorso = false;
		}
	}
	if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", refMostraAvvisi);
	else setTimeout(refMostraAvvisi, 0);
	var INV_KEY = "equo-invito";
	(function invitoDaUrl() {
		const p = new URLSearchParams(location.search);
		const v = (p.get("invito") || "").trim().toUpperCase();
		if (v && tipoCodiceEquo(v)) {
			lsSet(INV_KEY, JSON.stringify({
				codice: v,
				t: Date.now()
			}));
			p.delete("invito");
			history.replaceState({}, "", location.pathname + (p.toString() ? "?" + p.toString() : ""));
		}
	})();
	function invitoLeggi() {
		try {
			const v = JSON.parse(lsGet(INV_KEY) || "null");
			if (v && v.codice && Date.now() - v.t < 2592e6) return v;
		} catch (e) {}
		return null;
	}
	function invitoCancella() {
		lsDel(INV_KEY);
		document.querySelectorAll(".inv-avviso").forEach((el) => el.remove());
	}
	function invitoMostraAvvisi() {
		if (!invitoLeggi() || typeof DEMO_MODE !== "undefined" && DEMO_MODE) return;
		const html = (t) => `<div class="ref-avviso inv-avviso"><span class="early-medaglia">★</span><div><b>Colleghiamoci su Equo</b><span>Il tuo professionista ti ha invitato</span><small>${t}</small></div></div>`;
		const tag = document.querySelector("#screen-auth .auth-tagline");
		if (tag && !document.querySelector("#screen-auth .inv-avviso")) tag.insertAdjacentHTML("afterend", html("Crea il tuo account gratuito e scegli «Ho un cavallo»: il collegamento parte da solo."));
		const lista = document.querySelector("#onb-step-1 .role-list");
		if (lista && !document.querySelector("#onb-step-1 .inv-avviso")) lista.insertAdjacentHTML("beforebegin", html("Scegli «Ho un cavallo»: ti colleghiamo subito."));
	}
	var invitoInCorso = false;
	async function invitoControlla() {
		if (DEMO_MODE || !currentUser || invitoInCorso) return;
		const r = invitoLeggi();
		if (!r) return;
		if (![currentUser.ruolo, currentUser.ruoloSecondario].filter(Boolean).includes("proprietario")) return;
		if ([
			"own",
			"tra",
			"med"
		].includes(tipoCodiceEquo(r.codice))) {
			if (currentUser.vistaAttiva !== "proprietario") return;
			invitoCancella();
			if (typeof gestisciCodiceScansionato === "function") gestisciCodiceScansionato(r.codice);
			return;
		}
		invitoInCorso = true;
		try {
			const res = await DB.riscattaCodiceManiscalco(r.codice);
			if (res?.ok) {
				invitoCancella();
				const nome = res.nome_maniscalco || "il tuo professionista";
				showToast("Collegato a " + nome + "!");
				if (currentUser.vistaAttiva === "proprietario") {
					if (typeof loadFarrierChatSection === "function") await loadFarrierChatSection().catch(() => {});
					if (typeof proponiAbbinamentoCavalli === "function") await proponiAbbinamentoCavalli(res.cliente_mascalcia_id, nome, () => {
						if (typeof openFarrierChatThread === "function") openFarrierChatThread(res.cliente_mascalcia_id, nome);
					});
				}
				return;
			}
			if (res?.errore === "errore" || res?.errore === "non_autenticato") return;
			invitoCancella();
			const msg = {
				codice_non_valido: "Il codice invito non è più valido: chiedi al tuo professionista di mandartelo di nuovo.",
				codice_gia_usato: "Questo invito è già stato usato da un altro account.",
				codice_tuo: "Questo è un tuo invito: va dato al cliente."
			}[res?.errore];
			if (msg) showToast(msg);
		} finally {
			invitoInCorso = false;
		}
	}
	if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", invitoMostraAvvisi);
	else setTimeout(invitoMostraAvvisi, 0);
	function vistaWidgetAttiva() {
		return true;
	}
	function incassiNascosti() {
		return !!(currentUser && currentUser.incassiNascosti);
	}
	var hmNavOriginale = null;
	function homeManAttiva() {
		return !!currentUser && agenteAiHammer();
	}
	function applicaHomeMan() {
		const x = applicaHomeManBase.apply(this, arguments);
		eseguiEstensioniSubito(estensioniDopo, "applicaHomeMan");
		return x;
	}
	function applicaHomeManBase() {
		const on = homeManAttiva();
		document.body.classList.toggle("home-man", on);
		const nav = document.getElementById("bottom-nav-pro");
		if (!nav) return;
		if (hmNavOriginale === null) hmNavOriginale = nav.innerHTML;
		if (on && !nav.dataset.man) {
			nav.innerHTML = HM_NAV;
			nav.dataset.man = "1";
		} else if (!on && nav.dataset.man) {
			nav.innerHTML = hmNavOriginale;
			delete nav.dataset.man;
		}
		const pg = document.querySelector(".page-content.active")?.id?.replace("page-", "");
		if (pg) hmNavAttivo(pg);
		hmNovitaHammer();
		if (on) {
			renderHomeMan();
			if (document.getElementById("page-pro-home")?.classList.contains("active")) setTimeout(() => {
				try {
					meteoHome();
				} catch (e) {}
			}, 0);
		}
	}
	function hmNavAttivo(page) {
		document.body.dataset.pagina = page;
		if (!document.body.classList.contains("home-man")) return;
		document.querySelectorAll("#bottom-nav-pro .nav-btn").forEach((b) => {
			let on = b.dataset.page === page;
			if (on && b.dataset.cart) on = b.dataset.cart === "cavalli" === (cliCartella === "cavalli");
			b.classList.toggle("active", on);
		});
		if (page !== "pro-home") hmChiudi();
	}
	function hmNovitaHammer() {
		const nh = document.getElementById("nav-hammer");
		if (nh) nh.classList.toggle("pulsa", !!document.getElementById("ai-fab")?.classList.contains("con-novita"));
	}
	function hmCartella(k) {
		hmChiudi();
		showPage("pro-clienti");
		if (typeof closeClienteDetail === "function") closeClienteDetail();
		sceltaCartellaClienti(k);
		hmNavAttivo("pro-clienti");
	}
	function hmMessaggi() {
		hmChiudi();
		showPage("pro-inbox");
		if (typeof loadColleghiList === "function") loadColleghiList();
	}
	function hmDaIncassare() {
		hmChiudi();
		if (typeof incAperta !== "undefined") incAperta = "dasaldare";
		if (typeof incVista !== "undefined") incVista = "semplice";
		showPage("pro-incassi");
		if (typeof renderIncassi === "function") renderIncassi();
	}
	async function hmGiaFatto() {
		await openInterventoModal(null);
		const d = document.getElementById("intervento-data");
		d.value = isoLocale(/* @__PURE__ */ new Date());
		aggiornaGiaFatto();
		aggiornaQuando();
		const g = document.getElementById("intervento-gia-fatto");
		if (g) g.checked = true;
	}
	function hmPiu() {
		eseguiEstensioniSubito(estensioniPrima, "hmPiu");
		return hmPiuBase.apply(this, arguments);
	}
	function hmPiuBase() {
		const aperto = document.getElementById("hm-menu-piu").classList.contains("on");
		hmChiudi();
		if (aperto) return;
		document.getElementById("hm-menu-piu").classList.add("on");
		document.getElementById("hm-piu").classList.add("aperto");
		document.getElementById("hm-velo").classList.add("on");
	}
	function hmChiudi() {
		[
			"hm-menu-piu",
			"hm-velo",
			"hm-foglio"
		].forEach((id) => document.getElementById(id)?.classList.remove("on"));
		document.getElementById("hm-piu")?.classList.remove("aperto");
	}
	function hmFoglio(titolo, sotto, corpo) {
		hmChiudi();
		document.getElementById("hm-foglio-tit").textContent = titolo;
		document.getElementById("hm-foglio-s").textContent = sotto || "";
		document.getElementById("hm-foglio-corpo").innerHTML = corpo;
		document.getElementById("hm-velo").classList.add("on");
		document.getElementById("hm-foglio").classList.add("on");
	}
	function mlSalva() {
		try {
			if (ml) localStorage.setItem("equo-lavoro", JSON.stringify(ml));
			else localStorage.removeItem("equo-lavoro");
		} catch (e) {}
	}
	function mlOggi() {
		return isoLocale(/* @__PURE__ */ new Date());
	}
	async function mlTappeOggi() {
		try {
			await caricaUbicazioni();
		} catch (e) {}
		const oggi = mlOggi();
		const app = agOrdinaGiro((hpAppuntamenti || []).filter((e) => e.data_intervento === oggi && ![
			"annullato",
			"rifiutato",
			"fatto"
		].includes(e.stato)));
		const per = /* @__PURE__ */ new Map();
		app.forEach((e) => {
			const l = luogoEvento(e, true);
			if (!per.has(l.key)) per.set(l.key, {
				l,
				eventi: []
			});
			per.get(l.key).eventi.push(e);
		});
		return [...per.values()];
	}
	function mlCavId(e) {
		if (e.cavallo_cliente_id) return e.cavallo_cliente_id;
		const r = e.horse_id && typeof cavalliMieiByHorse !== "undefined" ? cavalliMieiByHorse[e.horse_id] : null;
		return r ? r.id : null;
	}
	async function mlApri(key) {
		const tappe = await mlTappeOggi();
		const t = tappe.find((x) => x.l.key === key) || tappe[0];
		if (!t) {
			showToast("Nessuna tappa da fare oggi.");
			return;
		}
		ml = {
			key: t.l.key,
			nome: t.l.nome,
			uid: currentUser?.id,
			fase: "prima",
			ids: t.eventi.map((e) => e.id),
			importi: {},
			pag: "saldato",
			inizio: Date.now(),
			giorno: mlOggi()
		};
		mlSalva();
		await mlCarica();
		mlRender();
	}
	async function mlCarica() {
		mlEventi = (ml.ids || []).map((id) => agEventiCache[id] || (hpAppuntamenti || []).find((e) => e.id === id)).filter(Boolean);
		if (!mlEventi.length && !DEMO_MODE) {
			const { data } = await sb.from("interventi_mascalcia").select("*, clienti_mascalcia(nome, cliente_user_id), cavalli_clienti_mascalcia(nome)").in("id", ml.ids);
			mlEventi = data || [];
		}
		const cav = [...new Set(mlEventi.map(mlCavId).filter(Boolean))];
		mlInfo = {};
		cav.forEach((id) => {
			mlInfo[id] = {
				avviso: null,
				aperti: [],
				anno: []
			};
		});
		if (cav.length && !DEMO_MODE) try {
			const [a, p] = await Promise.all([sb.from("cavalli_clienti_mascalcia").select("id, avviso_sicurezza").in("id", cav), sb.from("cavalli_problemi_piede").select("id, cavallo_cliente_id, piede, voci, nota, ricontrolla_il, risolto_il, creato_il").in("cavallo_cliente_id", cav).gte("creato_il", (/* @__PURE__ */ new Date(Date.now() - 31536e6)).toISOString()).order("creato_il", { ascending: false })]);
			(a.data || []).forEach((r) => {
				if (mlInfo[r.id]) mlInfo[r.id].avviso = r.avviso_sicurezza || null;
			});
			(p.data || []).forEach((r) => {
				const m = mlInfo[r.cavallo_cliente_id];
				if (!m) return;
				m.anno.push(r);
				if (!r.risolto_il) m.aperti.push(r);
			});
		} catch (e) {
			console.warn("modalità lavoro:", e);
		}
		if (DEMO_MODE && cav[0] && mlInfo[cav[0]]) {
			mlInfo[cav[0]].aperti = [{
				piede: "pd",
				voci: ["ferro perso", "parete sfaldata"],
				ricontrolla_il: mlOggi(),
				creato_il: (/* @__PURE__ */ new Date(Date.now() - 1728e6)).toISOString()
			}];
			mlInfo[cav[0]].anno = mlInfo[cav[0]].aperti.slice();
			if (cav[1] && mlInfo[cav[1]]) mlInfo[cav[1]].avviso = "Scalcia dietro quando gli si alza il posteriore sinistro.";
		}
		const mancano = mlEventi.filter((e) => ml.importi[e.id] === void 0);
		if (mancano.length) {
			for (const e of mancano) {
				let v = e.importo;
				if (v == null && !incassiNascosti()) try {
					v = (await importiSuggeriti(e, [{
						cavallo_cliente_id: e.cavallo_cliente_id,
						horse_id: e.horse_id
					}]))[0];
				} catch (x) {
					v = null;
				}
				ml.importi[e.id] = v == null ? "" : String(v);
			}
			mlSalva();
		}
	}
	function mlRigaCavallo(e) {
		return {
			nome: agNomeCavallo(e) || "Cavallo",
			cli: e.clienti_mascalcia?.nome || clienteDiId(e.cliente_mascalcia_id)?.nome || ""
		};
	}
	// equo-app-src/src/ruoli/proprietario/moduli/101-proprietario.js
	var wgOwn = {
		scadenze: null,
		spese: null,
		appuntamento: null,
		lezioni: null,
		unread: 0,
		caricato: 0
	};
	async function wgCaricaOwner() {
		if (!currentUser || DEMO_MODE && !demoState) return;
		const ids = (horses || []).map((h) => h.id);
		const sicuro = (p) => Promise.resolve().then(p).catch((e) => {
			console.warn("widget:", e);
			return null;
		});
		const [scad, spese, man, lez, unread] = await Promise.all([
			sicuro(() => ids.length ? DB.listUpcomingDeadlines(ids, 6) : []),
			sicuro(() => DB.listExpenses()),
			sicuro(() => DEMO_MODE ? [] : DB.listManiscalchiCollegati()),
			sicuro(async () => {
				if (DEMO_MODE) return [];
				const r = await sb.rpc("mie_lezioni_scuderia");
				return r.error ? [] : r.data || [];
			}),
			sicuro(() => DEMO_MODE ? 0 : computeChatUnreadTotal())
		]);
		wgOwn.scadenze = scad || [];
		wgOwn.spese = spese || [];
		wgOwn.lezioni = lez || [];
		wgOwn.unread = Number(unread) || 0;
		const oggi = isoLocale(/* @__PURE__ */ new Date());
		const cand = [];
		for (const f of man || []) (await sicuro(() => DB.listAppuntamentiCliente(f.cliente_mascalcia_id)) || []).filter((a) => a.data_intervento >= oggi && ["programmato", "richiesto"].includes(a.stato)).forEach((a) => cand.push({
			tipo: "maniscalco",
			data: a.data_intervento,
			ora: a.ora ? String(a.ora).slice(0, 5) : "",
			titolo: (TIPO_FERRATURA_LABELS[a.tipo_ferratura] || "Appuntamento") + (a.nome_cavallo ? " · " + a.nome_cavallo : ""),
			chi: f.nome_maniscalco || "Il tuo maniscalco",
			stato: a.stato,
			modifica: a.modifica && a.modifica.prima ? a.modifica : null,
			f
		}));
		(wgOwn.lezioni || []).filter((l) => l.data >= oggi && !["annullata", "completata"].includes(l.stato)).forEach((l) => cand.push({
			tipo: "lezione",
			data: l.data,
			ora: l.ora ? String(l.ora).slice(0, 5) : "",
			titolo: "Lezione" + (l.cavallo ? " · " + l.cavallo : ""),
			chi: [l.scuderia, l.istruttore ? "con " + l.istruttore : ""].filter(Boolean).join(" · "),
			stato: l.stato,
			l
		}));
		cand.sort((a, b) => (a.data + a.ora).localeCompare(b.data + b.ora));
		wgOwn.appuntamento = cand[0] || null;
		wgOwn.appMan = cand.filter((c) => c.tipo === "maniscalco");
		wgOwn.caricato = Date.now();
		if (vistaWidgetAttiva() && vistaAi() === "proprietario") renderWidgetOwner(true);
	}
	function wgGiorniA(iso) {
		return giorniTra(isoLocale(/* @__PURE__ */ new Date()), String(iso).slice(0, 10));
	}
	function wgQuandoScad(g) {
		return g < 0 ? `scaduta da ${-g} ${-g === 1 ? "giorno" : "giorni"}` : g === 0 ? "scade oggi" : g === 1 ? "scade domani" : `tra ${g} giorni`;
	}
	function renderWidgetOwner(daCarica) {
		const box = document.getElementById("wh-owner");
		if (!box || !currentUser) return;
		if (!horses || !horses.length) {
			box.innerHTML = "";
			return;
		}
		if (!daCarica && Date.now() - wgOwn.caricato > 3e4) wgCaricaOwner();
		const scad = wgOwn.scadenze;
		const oggi = isoLocale(/* @__PURE__ */ new Date());
		const appMan = (wgOwn.appMan || []).slice(0, 4);
		const rigaAppMan = (a) => `<div class="wg-ric" onclick="wgApriAppMan('${a.f.cliente_mascalcia_id}')"><span class="wg-sem ${a.stato === "richiesto" || a.modifica ? "ocra" : "verde"}"></span><span class="wg-t"><b>${a.modifica ? "✏️ " : ""}${wgEsc(a.titolo)}</b><small>${a.modifica ? "<b>Modificato</b> (prima: " + wgEsc(testoPrimaModifica(a.modifica)) + ") · " : ""}${a.stato === "richiesto" ? "richiesto a " : "fissato con "}${wgEsc(a.chi)} · ${wgEsc(a.data === oggi ? "oggi" : hpGiornoEtichetta(a.data).toLowerCase())}${a.ora ? " " + a.ora : ""}</small></span></div>`;
		let scadHtml;
		if (scad == null) scadHtml = "<div class=\"wg-vuoto piccolo\">Caricamento…</div>";
		else if (!scad.length && appMan.length) scadHtml = appMan.map(rigaAppMan).join("");
		else if (!scad.length) scadHtml = "<div class=\"wg-vuoto\">Nessuna scadenza in arrivo.<br><button class=\"wg-link\" onclick=\"wgNuovoEvento()\">+ Registra un vaccino o una ferratura</button></div>";
		else {
			const p = scad[0], g = wgGiorniA(p.next_due_date);
			const ferr = p.type === "ferratura";
			const nomeP = String(p.horses?.name || "").toLowerCase();
			const giaFissato = ferr && nomeP ? appMan.find((x) => String(x.titolo).toLowerCase().endsWith("· " + nomeP)) : null;
			document.querySelector("#farrier-chat-list .inbox-item") || wgOwn.appuntamento && wgOwn.appuntamento.tipo;
			scadHtml = `
      <div class="wg-prossimo ${g < 0 ? "rosso" : ""}" onclick="showPage('cavalli');openHorseDetail('${p.horse_id}')">
        <div class="wg-quando">${wgEsc(wgQuandoScad(g))} · ${formatDate(p.next_due_date)}</div>
        <div class="wg-chi">${wgEsc(EVENT_LABELS[p.type] || p.type)} · ${wgEsc(p.horses?.name || "")}</div>
        <div class="wg-azioni">
          ${ferr && giaFissato ? `<button class="oro" onclick="event.stopPropagation();wgApriAppMan('${giaFissato.f.cliente_mascalcia_id}')">${WG_IC.cal}Fissato: ${wgEsc(giaFissato.data === oggi ? "oggi" : hpGiornoEtichetta(giaFissato.data).toLowerCase())}${giaFissato.ora ? " " + giaFissato.ora : ""}</button>` : ferr ? `<button class="oro" onclick="event.stopPropagation();wgFissaManiscalco()">${WG_IC.cal}Fissa con il maniscalco</button>` : `<button class="oro" onclick="event.stopPropagation();showPage('cavalli');openHorseDetail('${p.horse_id}')">${WG_IC.scad}Apri il libretto</button>`}
        </div>
      </div>
      ${[...scad.slice(1, 4).map((d) => ({
				k: d.next_due_date,
				h: (() => {
					const gg = wgGiorniA(d.next_due_date);
					return `<div class="wg-ric" onclick="showPage('cavalli');openHorseDetail('${d.horse_id}')"><span class="wg-sem ${gg < 0 ? "rosso" : gg <= 14 ? "ocra" : "verde"}"></span><span class="wg-t"><b>${wgEsc(EVENT_LABELS[d.type] || d.type)}</b> · ${wgEsc(d.horses?.name || "")}<small>${wgEsc(wgQuandoScad(gg))} · ${formatDate(d.next_due_date)}</small></span></div>`;
				})()
			})), ...appMan.map((a) => ({
				k: a.data,
				h: rigaAppMan(a)
			}))].sort((x, y) => String(x.k).localeCompare(String(y.k))).slice(0, 4).map((x) => x.h).join("")}`;
		}
		const spese = wgOwn.spese || [];
		const inizio = /* @__PURE__ */ new Date();
		inizio.setDate(1);
		inizio.setHours(0, 0, 0, 0);
		const inizioPrec = new Date(inizio);
		inizioPrec.setMonth(inizioPrec.getMonth() - 1);
		const mese = spese.filter((e) => new Date(e.date) >= inizio).reduce((t, e) => t + Number(e.amount || 0), 0);
		const prec = spese.filter((e) => new Date(e.date) >= inizioPrec && new Date(e.date) < inizio).reduce((t, e) => t + Number(e.amount || 0), 0);
		const diff = mese - prec;
		const a = wgOwn.appuntamento;
		const quandoA = a ? (a.data === oggi ? "Oggi" : a.data === aggiungiGiorniIso(oggi, 1) ? "Domani" : hpGiornoEtichetta(a.data)) + (a.ora ? " · " + a.ora : "") : "";
		const fra7 = aggiungiGiorniIso(oggi, 7);
		const lezSett = (wgOwn.lezioni || []).filter((l) => l.data >= oggi && l.data <= fra7 && !["annullata"].includes(l.stato));
		const ultimo = typeof homeLastMessageTarget !== "undefined" ? homeLastMessageTarget : null;
		box.innerHTML = `
    <div class="wg wg-grande">
      <div class="wg-testa"><span class="wg-et">${WG_IC.scad}Prossime scadenze</span><span class="wg-meta">${scad && scad.length || appMan.length ? (scad ? scad.length : 0) + appMan.length + " in arrivo" : ""}</span></div>
      ${scadHtml}
    </div>
    <div class="wg wg-piccolo wg-pieno" onclick="document.querySelector('[data-page=&quot;spese&quot;]')?.click()">
      <span class="wg-cerchio">${WG_IC.euro}</span>
      <div class="wg-num">${wgEuro(mese)}</div>
      <div class="wg-riga">spese di ${(/* @__PURE__ */ new Date()).toLocaleDateString("it-IT", { month: "long" })}</div>
      <div class="wg-riga evid">${prec ? (diff > 0 ? "+" : diff < 0 ? "−" : "") + wgEuro(Math.abs(diff)).replace("€ ", "€ ") + " sul mese scorso" : "Registra le spese con +"}</div>
    </div>
    <div class="wg wg-piccolo" onclick="${ultimo ? "goToLastMessage()" : "document.querySelector('[data-page=&quot;chat&quot;]')?.click()"}">
      <span class="wg-et">${WG_IC.msg}Messaggi</span>${wgOwn.unread ? `<span class="wg-badge">${wgOwn.unread}</span>` : ""}
      <div class="wg-num">${wgOwn.unread} <small>${wgOwn.unread === 1 ? "non letto" : "non letti"}</small></div>
      <div class="wg-riga">${ultimo ? `<b>${wgEsc(ultimo.nome)}:</b> ${wgEsc(ultimo.testo || "")}` : "Nessun messaggio"}</div>
    </div>
    <div class="wg wg-medio">
      <div class="wg-testa"><span class="wg-et">${WG_IC.cal}Prossimo appuntamento</span></div>
      ${a ? `<div class="wg-app">
          <div class="wg-app-data">${wgEsc(quandoA)}${a.stato === "richiesto" || a.stato === "prenotata" ? " <span class=\"wg-tag\">da confermare</span>" : ""}</div>
          <div class="wg-app-tit">${wgEsc(a.titolo)}</div>
          <div class="wg-riga">${wgEsc(a.chi)}</div>
          <div class="wg-azioni chiaro"><button class="oro" onclick="wgChattaAppuntamento()">${WG_IC.msg}Chatta</button><button onclick="${a.tipo === "lezione" ? "document.querySelector('[data-page=&quot;prenotazioni&quot;]')?.click()" : "wgFissaManiscalco()"}">Apri</button></div>
        </div>` : "<div class=\"wg-vuoto piccolo\">Nessun appuntamento in programma.</div>"}
    </div>
    <div class="wg wg-piccolo wg-pieno wg-azione" onclick="document.querySelector('[data-page=&quot;spese&quot;]')?.click();openAddExpenseModal()">
      <span class="wg-cerchio grande">${WG_IC.piu}</span>
      <div class="wg-riga forte">Nuova spesa</div>
    </div>
    <div class="wg wg-piccolo wg-pieno wg-azione" onclick="wgNuovoEvento()">
      <span class="wg-cerchio grande">${WG_IC.piu}</span>
      <div class="wg-riga forte">Nuovo evento<br><small>vaccino, ferratura…</small></div>
    </div>
    <div class="wg wg-medio">
      <div class="wg-testa"><span class="wg-et">${WG_IC.cav}I miei cavalli</span><button class="wg-link" onclick="showPage('cavalli');closeHorseDetail()">Tutti ›</button></div>
      <div class="wg-cavalli">${horses.slice(0, 8).map((h) => `<button class="wg-cavallo" onclick="showPage('cavalli');openHorseDetail('${h.id}')"><span>${wgEsc((h.name || "?").charAt(0).toUpperCase())}</span><small>${wgEsc(h.name)}</small></button>`).join("")}
        <button class="wg-cavallo nuovo" onclick="openHorseForm()"><span>${WG_IC.piu}</span><small>Aggiungi</small></button></div>
    </div>
    ${(wgOwn.lezioni || []).length ? `<div class="wg wg-medio" onclick="document.querySelector('[data-page=&quot;prenotazioni&quot;]')?.click()">
      <div class="wg-testa"><span class="wg-et">${WG_IC.lez}Lezioni della settimana</span><span class="wg-meta">${lezSett.length}</span></div>
      ${lezSett.length ? lezSett.slice(0, 3).map((l) => `<div class="wg-voce"><span class="wg-ora">${wgEsc(hpGiornoEtichetta(l.data))}</span><span class="wg-t">${l.ora ? String(l.ora).slice(0, 5) + " · " : ""}${wgEsc(l.cavallo || "Lezione")} <small>${wgEsc(l.istruttore ? "· " + l.istruttore : "")}</small></span></div>`).join("") : "<div class=\"wg-vuoto piccolo\">Nessuna lezione nei prossimi 7 giorni.</div>"}
    </div>` : ""}`;
	}
	function wgApriAppMan(clienteId) {
		showPage("chat");
		const f = (wgOwn.appMan || []).find((a) => a.f.cliente_mascalcia_id === clienteId)?.f;
		if (typeof loadFarrierChatSection$1 === "function") loadFarrierChatSection$1().then(() => {
			if (f) openFarrierChatThread(f.cliente_mascalcia_id, f.nome_maniscalco || "Il tuo maniscalco");
		});
	}
	function wgFissaManiscalco() {
		showPage("chat");
		if (typeof loadFarrierChatSection$1 === "function") loadFarrierChatSection$1().then(() => {
			const a = wgOwn.appuntamento;
			if (a && a.tipo === "maniscalco") openFarrierChatThread(a.f.cliente_mascalcia_id, a.f.nome_maniscalco || "Il tuo maniscalco");
		});
	}
	function wgChattaAppuntamento() {
		const a = wgOwn.appuntamento;
		if (!a) return;
		showPage("chat");
		if (a.tipo === "maniscalco") loadFarrierChatSection$1().then(() => openFarrierChatThread(a.f.cliente_mascalcia_id, a.f.nome_maniscalco || "Il tuo maniscalco"));
		else loadStableChatSection().then(async () => {
			const s = (await DB.listScuderieCollegate()).find((x) => !a.l.scuderia || x.nome === a.l.scuderia) || null;
			if (s) openStableChatThread(s.membro_id, s.centro_id, s.nome);
		});
	}
	async function wgNuovoEvento() {
		if (!horses || !horses.length) {
			openHorseForm();
			return;
		}
		if (horses.length === 1) {
			showPage("cavalli");
			await openHorseDetail(horses[0].id);
			openAddEventModal();
			return;
		}
		let ov = document.getElementById("modal-scegli-cavallo");
		if (!ov) {
			ov = document.createElement("div");
			ov.className = "modal-overlay";
			ov.id = "modal-scegli-cavallo";
			ov.addEventListener("click", (ev) => {
				if (ev.target === ov) closeModal("modal-scegli-cavallo");
			});
			document.body.appendChild(ov);
		}
		ov.innerHTML = `<div class="modal"><div class="modal-handle"></div><div class="modal-title">Per quale cavallo?</div>
    ${horses.map((h) => `<button class="wg-app-mappa" onclick="closeModal('modal-scegli-cavallo');showPage('cavalli');openHorseDetail('${h.id}').then(openAddEventModal)"><i style="background:var(--surface2);display:flex;align-items:center;justify-content:center;color:var(--accent);font-weight:700">${wgEsc((h.name || "?").charAt(0))}</i>${wgEsc(h.name)}</button>`).join("")}
    <button class="btn btn-outline" style="width:100%;margin-top:6px" onclick="closeModal('modal-scegli-cavallo')">Annulla</button></div>`;
		openModal("modal-scegli-cavallo");
	}
	function wgPin({ titolo, testo, passo, dimenticato }) {
		return new Promise((resolve) => {
			let ov = document.getElementById("pin-ov");
			if (!ov) {
				ov = document.createElement("div");
				ov.id = "pin-ov";
				document.body.appendChild(ov);
			}
			let cifre = "";
			const tasti = [
				"1",
				"2",
				"3",
				"4",
				"5",
				"6",
				"7",
				"8",
				"9",
				"",
				"0",
				"⌫"
			];
			ov.className = "pin-ov on";
			ov.innerHTML = `<div class="pin-box">
      <div class="pin-lucch"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/></svg></div>
      <h3>${wgEsc(titolo)}</h3><p>${wgEsc(testo || "")}</p>
      <div class="pin-pallini"><i></i><i></i><i></i><i></i></div>
      <div class="pin-passo">${wgEsc(passo || "")}</div>
      <div class="pin-err" id="pin-err"></div>
      <div class="pin-tast">${tasti.map((t) => t ? `<button type="button" data-t="${t}">${t}</button>` : "<span></span>").join("")}</div>
      ${dimenticato ? "<button type=\"button\" class=\"pin-link\" data-az=\"dim\">PIN dimenticato?</button>" : ""}
      <button type="button" class="pin-link grigio" data-az="annulla">Annulla</button></div>`;
			const pallini = ov.querySelectorAll(".pin-pallini i");
			const aggiorna = () => pallini.forEach((p, i) => p.classList.toggle("p", i < cifre.length));
			const fine = (v) => {
				ov.className = "pin-ov";
				document.removeEventListener("keydown", tastiera);
				resolve(v);
			};
			const premi = (t) => {
				if (t === "⌫") {
					cifre = cifre.slice(0, -1);
					aggiorna();
					return;
				}
				if (cifre.length >= 4) return;
				cifre += t;
				aggiorna();
				if (cifre.length === 4) setTimeout(() => fine(cifre), 160);
			};
			const tastiera = (e) => {
				if (/^[0-9]$/.test(e.key)) premi(e.key);
				else if (e.key === "Backspace") premi("⌫");
				else if (e.key === "Escape") fine(null);
			};
			document.addEventListener("keydown", tastiera);
			ov.onclick = (e) => {
				const b = e.target.closest("button");
				if (!b) return;
				if (b.dataset.t) premi(b.dataset.t);
				else if (b.dataset.az === "annulla") fine(null);
				else if (b.dataset.az === "dim") fine("__dimenticato__");
			};
		});
	}
	async function cambiaIncassi(mostra) {
		const sw = document.getElementById("incassi-switch");
		const ripristina = () => {
			if (sw) sw.checked = !incassiNascosti();
		};
		if (DEMO_MODE) {
			currentUser.incassiNascosti = !mostra;
			applicaVistaHome();
			showToast(mostra ? "Incassi visibili" : "Incassi nascosti");
			return;
		}
		try {
			if (!mostra) {
				const { data: st } = await sb.rpc("incassi_stato");
				let pin = null;
				if (!st?.ha_pin) {
					const p1 = await wgPin({
						titolo: "Crea un PIN per gli incassi",
						testo: "Ti servirà per farli ricomparire. Scegli 4 cifre che ricordi facilmente.",
						passo: "Passo 1 di 2 · scegli il PIN"
					});
					if (!p1) {
						ripristina();
						return;
					}
					const p2 = await wgPin({
						titolo: "Ripeti il PIN",
						testo: "Per sicurezza scrivilo un'altra volta.",
						passo: "Passo 2 di 2 · ripeti il PIN"
					});
					if (!p2) {
						ripristina();
						return;
					}
					if (p1 !== p2) {
						showToast("I due PIN non coincidono, riprova.");
						ripristina();
						return;
					}
					pin = p1;
				}
				const { data, error } = await sb.rpc("incassi_nascondi", { p_pin: pin });
				if (error || !data?.ok) throw error || /* @__PURE__ */ new Error("non riuscito");
				currentUser.incassiNascosti = true;
				applicaVistaHome();
				closeModal("modal-menu");
				showToast("Incassi nascosti in tutta l'app");
			} else {
				const p = await wgPin({
					titolo: "Mostra gli incassi",
					testo: "Inserisci il PIN di 4 cifre che hai scelto quando li hai nascosti.",
					dimenticato: true
				});
				if (!p) {
					ripristina();
					return;
				}
				if (p === "__dimenticato__") {
					ripristina();
					return wgPinDimenticato();
				}
				const { data, error } = await sb.rpc("incassi_mostra", { p_pin: p });
				if (error) throw error;
				if (data?.ok) {
					currentUser.incassiNascosti = false;
					applicaVistaHome();
					showToast("Incassi di nuovo visibili");
					if (typeof renderIncassi === "function") renderIncassi();
					return;
				}
				ripristina();
				if (data?.bloccato_fino) showToast("Troppi tentativi: riprova tra 5 minuti.");
				else showToast(`PIN errato. ${data?.rimasti != null ? "Tentativi rimasti: " + data.rimasti : ""}`);
			}
		} catch (e) {
			console.error("incassi:", e);
			ripristina();
			showToast("Funzione non ancora attiva: serve l'aggiornamento del database.");
		}
	}
	async function wgPinDimenticato() {
		if (!confirm("Per scegliere un nuovo PIN devi rientrare nel tuo account. Ti facciamo uscire: dopo l'accesso ti chiediamo subito il nuovo PIN. Continuare?")) return;
		lsSet("equo-pin-reset", "1");
		await logout();
	}
	async function wgControllaResetPin() {
		if (DEMO_MODE || lsGet("equo-pin-reset") !== "1" || vistaAi() !== "professionista") return;
		const p1 = await wgPin({
			titolo: "Scegli il nuovo PIN",
			testo: "Hai appena fatto l'accesso: scegli 4 nuove cifre per gli incassi.",
			passo: "Passo 1 di 2"
		});
		if (!p1) {
			lsDel("equo-pin-reset");
			return;
		}
		if (p1 !== await wgPin({
			titolo: "Ripeti il nuovo PIN",
			testo: "",
			passo: "Passo 2 di 2"
		})) {
			showToast("I due PIN non coincidono: riprova dal menu.");
			lsDel("equo-pin-reset");
			return;
		}
		const { data, error } = await sb.rpc("incassi_nuovo_pin", { p_pin: p1 });
		lsDel("equo-pin-reset");
		if (error || !data?.ok) {
			showToast(data?.serve_accesso ? "Per sicurezza rifai l'accesso e riprova subito." : "Non sono riuscito a salvare il PIN.");
			return;
		}
		currentUser.incassiNascosti = false;
		applicaVistaHome();
		showToast("Nuovo PIN salvato: gli incassi sono di nuovo visibili");
	}
	(function() {
		let t = null;
		document.addEventListener("scroll", (ev) => {
			if (!ev.target || !ev.target.classList || !ev.target.classList.contains("page-content")) return;
			document.body.classList.add("fab-via");
			clearTimeout(t);
			t = setTimeout(() => document.body.classList.remove("fab-via"), 700);
		}, true);
	})();
	// equo-app-src/src/ruoli/proprietario/moduli/025-scheda-unica-stesso-nome-in-scuderia-dec.js
	var stessoCavalloCoda = null;
	var stessoCavalloAttuale = null;
	async function controllaStessoCavallo() {
		if (DEMO_MODE || stessoCavalloCoda !== null || !horses.length) return;
		stessoCavalloCoda = [];
		try {
			const { data, error } = await sb.rpc("equo_proposte_collegamento");
			if (error || !data) return;
			stessoCavalloCoda = data;
			mostraStessoCavallo();
		} catch (e) {}
	}
	function mostraStessoCavallo() {
		stessoCavalloAttuale = stessoCavalloCoda.shift() || null;
		if (!stessoCavalloAttuale) {
			closeModal("modal-stesso-cavallo");
			return;
		}
		const p = stessoCavalloAttuale;
		document.getElementById("stesso-cavallo-testo").innerHTML = escapeHtml(p.centro_nome || "La tua scuderia") + " ha una scheda <b>«" + escapeHtml(p.scheda_nome) + "»</b>" + (p.codice_scheda ? " (" + escapeHtml(p.codice_scheda) + ")" : "") + ". È il tuo cavallo <b>" + escapeHtml(p.horse_nome) + "</b>?<br><br>Se sì, le due schede diventano un unico cavallo con un solo codice Equo (resta il numero più vecchio) e condividete registro sanitario e appuntamenti. Spese e note personali restano solo tue.";
		openModal("modal-stesso-cavallo");
	}
	async function rispondiStessoCavallo(stesso) {
		const p = stessoCavalloAttuale;
		if (!p) return;
		const btn = document.getElementById("stesso-cavallo-ok");
		btn.disabled = true;
		try {
			const { data, error } = await sb.rpc("equo_conferma_collegamento", {
				p_horse: p.horse_id,
				p_scheda: p.scuderia_cavallo_id,
				p_stesso: stesso
			});
			if (error) throw error;
			if (stesso && data && data.ok) {
				showToast(p.horse_nome + " ora è un unico cavallo: codice Equo n. " + data.numero);
				horses = await DB.listHorses();
				renderHorsesList();
				if (currentHorseId === p.horse_id) await openHorseDetail(p.horse_id);
			} else if (!stesso) showToast("Ok, restano due cavalli diversi");
			else showToast("Non è stato possibile unire le schede");
		} catch (e) {
			showToast(e.message || "Errore, riprova");
		} finally {
			btn.disabled = false;
		}
		mostraStessoCavallo();
	}
	function renderHome() {
		renderHomeBase();
		eseguiEstensioniSubito(estensioniDopo, "renderHome");
	}
	function renderHomeBase() {
		renderHomeGreeting();
		const setupBox = document.getElementById("home-setup");
		const mainBox = document.getElementById("home-main");
		if (horses.length === 0) {
			setupBox.style.display = "block";
			mainBox.style.display = "none";
			document.getElementById("topbar-context").textContent = "Nessun cavallo";
			return;
		}
		setupBox.style.display = "none";
		mainBox.style.display = "block";
		document.getElementById("topbar-context").textContent = horses.length === 1 ? horses[0].name : horses.length + " cavalli";
		loadDeadlines();
		loadExpensesSummary();
		loadHomeLastMessage();
		caricaDaSaldare();
		if (typeof wgCaricaOwner === "function" && typeof vistaWidgetAttiva === "function" && vistaWidgetAttiva()) wgCaricaOwner();
	}
	// equo-app-src/src/ruoli/proprietario/moduli/023-horses.js
	async function loadHorses() {
		horses = await DB.listHorses();
		renderHome();
		renderHorsesList();
		controllaStessoCavallo();
		caricaProposteCavalli();
		caricaCavalliBloccati();
	}
	// equo-app-src/src/ruoli/proprietario/moduli/028-stable-equo-scuderia.js
	async function joinStable() {
		const code = document.getElementById("stable-code").value.trim().toUpperCase();
		const errBox = document.getElementById("stable-error");
		errBox.style.display = "none";
		if (!code) return;
		const stable = await DB.findStableByCode(code);
		if (!stable) {
			errBox.textContent = "Codice non valido." + (DEMO_MODE ? " (in demo prova EQUO-DEMO)" : "");
			errBox.style.display = "block";
			return;
		}
		if (currentHorseId || horses[0]) {
			const horseId = currentHorseId || horses[0].id;
			await DB.linkHorseToStable(horseId, stable.id);
		}
		closeModal("modal-join-stable");
		alert("Collegato a " + stable.name + "!");
	}
	// equo-app-src/src/ruoli/proprietario/moduli/030-calendario-lezioni-ed-eventi-sanitari-da.js
	var LEZ_SCUD_STATO = {
		prenotata: ["Da confermare", "badge-accent"],
		confermata: ["Confermata", "badge-green"],
		completata: ["Completata", ""],
		annullata: ["Annullata", "badge-red"]
	};
	var EVENTO_SCUD_LABEL = {
		vaccino: "Vaccino",
		coggins: "Coggins",
		ferratura: "Ferratura",
		sverminazione: "Sverminazione"
	};
	var calScuderiaCache = {
		lezioni: [],
		eventi: []
	};
	function oggiISO() {
		const d = /* @__PURE__ */ new Date();
		return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
	}
	function dataLezioneIt(dataStr, ora) {
		const txt = (/* @__PURE__ */ new Date(dataStr + "T12:00:00")).toLocaleDateString("it-IT", {
			weekday: "short",
			day: "numeric",
			month: "short"
		});
		return txt.charAt(0).toUpperCase() + txt.slice(1) + (ora ? ", " + ora : "");
	}
	async function loadCalendarioScuderia() {
		const wrap = document.getElementById("scuderia-cal-box");
		const box = document.getElementById("scuderia-cal-list");
		const nota = document.getElementById("cal-nota-scuderia");
		if (!wrap || !box) return;
		if (DEMO_MODE || !currentUser) {
			wrap.style.display = "none";
			return;
		}
		try {
			const [scuderie, lez, ev] = await Promise.all([
				DB.listScuderieCollegate(),
				sb.rpc("mie_lezioni_scuderia"),
				sb.rpc("miei_eventi_scuderia")
			]);
			if (lez.error) console.error("mie_lezioni_scuderia:", lez.error);
			if (ev.error) console.error("miei_eventi_scuderia:", ev.error);
			calScuderiaCache = {
				lezioni: lez.error ? [] : lez.data || [],
				eventi: ev.error ? [] : ev.data || []
			};
			if (nota) nota.style.display = scuderie && scuderie.length ? "none" : "";
			if (!(scuderie && scuderie.length) && !calScuderiaCache.lezioni.length && !calScuderiaCache.eventi.length) {
				wrap.style.display = "none";
				return;
			}
			wrap.style.display = "block";
			renderCalendarioScuderia();
		} catch (err) {
			console.error("loadCalendarioScuderia:", err);
			wrap.style.display = "none";
		}
	}
	function renderCalendarioScuderia() {
		const box = document.getElementById("scuderia-cal-list");
		if (!box) return;
		const oggi = oggiISO();
		const { lezioni, eventi } = calScuderiaCache;
		const future = lezioni.filter((l) => l.data >= oggi);
		const passate = lezioni.filter((l) => l.data < oggi).reverse();
		let html = "";
		if (future.length === 0 && passate.length === 0) html += "<div class=\"muted\" style=\"font-size:13px;padding:6px 0 10px\">Nessuna lezione in programma dalla scuderia.</div>";
		html += future.map((l) => cardLezioneScuderia(l, true)).join("");
		if (passate.length) html += `<details style="margin-top:6px"><summary class="muted" style="font-size:12.5px;cursor:pointer;padding:6px 0">Lezioni passate (${passate.length})</summary>${passate.map((l) => cardLezioneScuderia(l, false)).join("")}</details>`;
		if (eventi.length) {
			html += "<div style=\"font-weight:700;font-size:13.5px;margin:16px 0 4px\">Salute registrata dalla scuderia</div>";
			html += eventi.map((e) => {
				const tipo = EVENTO_SCUD_LABEL[e.tipo] || e.tipo_altro || "Evento sanitario";
				const scad = e.data_scadenza ? ` · prossima scadenza ${formatDate(e.data_scadenza)}` : "";
				const scaduto = e.data_scadenza && e.data_scadenza < oggi;
				return `
      <div class="event-item">
        <div style="min-width:0">
          <div style="font-weight:600;font-size:14px">${escapeHtml(tipo)} · ${escapeHtml(e.cavallo || "Cavallo")}</div>
          <div class="muted" style="font-size:12px">${formatDate(e.data_evento)}${scad} · ${escapeHtml(e.scuderia)}${e.note ? " · " + escapeHtml(e.note) : ""}</div>
        </div>
        ${scaduto ? "<span class=\"badge badge-red\">Scaduto</span>" : ""}
      </div>`;
			}).join("");
		}
		box.innerHTML = html;
	}
	function cardLezioneScuderia(l, futura) {
		const [statoTxt, statoCls] = LEZ_SCUD_STATO[l.stato] || [l.stato, ""];
		const dettagli = [
			l.cavaliere ? "monta " + escapeHtml(l.cavaliere) : null,
			l.cavallo ? "su " + escapeHtml(l.cavallo) : null,
			l.istruttore ? "istruttore " + escapeHtml(l.istruttore) : null
		].filter(Boolean).join(" · ");
		const azioni = futura && l.stato !== "annullata" && l.stato !== "completata" ? `
    <div style="display:flex;gap:8px;margin-top:10px">
      ${l.stato === "prenotata" ? `<button class="btn btn-primary btn-sm btn-conferma" style="flex:1" onclick="accettaLezioneScuderia('${l.id}', this)">Accetta</button>` : ""}
      <button class="btn btn-outline btn-sm btn-variazione" style="flex:1" onclick="modificaLezioneScuderia('${l.id}')">Modifica</button>
    </div>` : "";
		return `
    <div class="event-item" style="display:block;${futura ? "" : "opacity:.65"}">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px">
        <div style="min-width:0">
          <div style="font-weight:600;font-size:14px">${escapeHtml(dataLezioneIt(l.data, l.ora))} · Lezione</div>
          <div class="muted" style="font-size:12px">${dettagli ? dettagli + " · " : ""}${escapeHtml(l.scuderia)}</div>
        </div>
        <span class="badge ${statoCls}" style="flex-shrink:0${statoCls ? "" : ";background:rgba(0,0,0,.07);color:var(--muted)"}">${statoTxt}</span>
      </div>
      ${azioni}
    </div>`;
	}
	async function accettaLezioneScuderia(id, btn) {
		if (btn) btn.disabled = true;
		const { data, error } = await sb.rpc("accetta_lezione_scuderia", { p_lezione_id: id });
		if (error || !data?.ok) {
			showToast(data && data.errore || "Non sono riuscito a confermare la lezione. Riprova.");
			if (btn) btn.disabled = false;
			return;
		}
		showToast(data.gia ? "La lezione era già confermata." : "Lezione confermata: la scuderia riceve l'avviso.");
		await loadCalendarioScuderia();
	}
	async function modificaLezioneScuderia(id) {
		const l = calScuderiaCache.lezioni.find((x) => x.id === id);
		if (!l) return;
		await openStableChatThread(l.membro_id, l.centro_id, l.scuderia);
		const input = document.getElementById("schat-input");
		if (input) {
			input.value = `Vorrei modificare la lezione di ${dataLezioneIt(l.data, l.ora)}: `;
			input.focus();
		}
	}
	function openAddLezioneModal(id) {
		editingLezioneId = id || null;
		document.getElementById("lezione-error").style.display = "none";
		document.getElementById("lezione-form-title").textContent = editingLezioneId ? "Modifica lezione" : "Nuova lezione";
		document.getElementById("lezione-delete-btn").style.display = editingLezioneId ? "block" : "none";
		const sel = document.getElementById("lezione-cavallo");
		if (horses.length === 0) sel.innerHTML = "<option value=\"\">Nessun cavallo</option>";
		else sel.innerHTML = cavalliUsabili$1().map((h) => `<option value="${h.id}">${escapeHtml(h.name)}</option>`).join("");
		if (editingLezioneId) {
			const l = lezioniCache.find((x) => x.id === editingLezioneId);
			sel.value = l?.horse_id || "";
			document.getElementById("lezione-tipo").value = l?.tipo || "lezione";
			document.getElementById("lezione-data").value = l?.data || "";
			document.getElementById("lezione-note").value = l?.note || "";
		} else {
			document.getElementById("lezione-tipo").value = "lezione";
			document.getElementById("lezione-data").value = "";
			document.getElementById("lezione-note").value = "";
		}
		openModal("modal-add-lezione");
	}
	async function createLezione() {
		const errBox = document.getElementById("lezione-error");
		errBox.style.display = "none";
		const horse_id = document.getElementById("lezione-cavallo").value || null;
		const tipo = document.getElementById("lezione-tipo").value;
		const data = document.getElementById("lezione-data").value;
		const note = document.getElementById("lezione-note").value.trim();
		if (!data) return;
		const { error } = editingLezioneId ? await DB.updateLezione(editingLezioneId, {
			horse_id,
			data,
			tipo,
			note
		}) : await DB.insertLezione({
			horse_id,
			data,
			tipo,
			note
		});
		if (error) {
			errBox.textContent = "Errore: " + error.message;
			errBox.style.display = "block";
			return;
		}
		closeModal("modal-add-lezione");
		await loadLezioni();
	}
	async function deleteLezioneCorrente() {
		if (!editingLezioneId) return;
		if (!confirm("Eliminare questa lezione?")) return;
		const { error } = await DB.deleteLezione(editingLezioneId);
		if (error) {
			alert("Errore: " + error.message);
			return;
		}
		closeModal("modal-add-lezione");
		await loadLezioni();
	}
	// equo-app-src/src/ruoli/proprietario/moduli/029-lezioni-manuali-calendario-proprietario.js
	var lezioniCache = [];
	async function loadLezioni() {
		loadCalendarioScuderia();
		const box = document.getElementById("lezioni-list");
		box.innerHTML = "<div class=\"loading\"><div class=\"spinner\"></div> Caricamento...</div>";
		lezioniCache = await DB.listLezioni() || [];
		if (lezioniCache.length === 0) {
			box.innerHTML = "<div class=\"empty-state\"><div class=\"icon\" style=\"width:32px;height:32px;margin:0 auto 10px\"><svg><use href=\"#i-calendar\"/></svg></div>Nessuna lezione registrata. Aggiungine una per iniziare.</div>";
			return;
		}
		box.innerHTML = lezioniCache.map((l) => `
    <div class="event-item" style="cursor:pointer" onclick="openAddLezioneModal('${l.id}')">
      <div>
        <div style="font-weight:600;font-size:14px">${LEZIONE_TIPO_LABELS[l.tipo] || l.tipo}${l.horses?.name ? " · " + escapeHtml(l.horses.name) : ""}</div>
        <div class="muted" style="font-size:12px">${formatDate(l.data)}${l.note ? " · " + escapeHtml(l.note) : ""}</div>
      </div>
      <span class="icon"><svg><use href="#i-chevron"/></svg></span>
    </div>
  `).join("");
	}
	// equo-app-src/src/ruoli/proprietario/moduli/075-appuntamenti-col-maniscalco-lato-proprie.js
	var STATO_APP_LABEL = {
		richiesto: ["In attesa", "background:rgba(232,176,75,.18);color:var(--accent)"],
		programmato: ["Confermato", "background:rgba(92,200,143,.18);color:var(--green)"],
		rifiutato: ["Non disponibile", "background:rgba(0,0,0,.07);color:var(--muted)"]
	};
	async function apriAppuntamentiManiscalco() {
		if (!currentFarrier) return;
		if (!horses || horses.length === 0) horses = await DB.listHorses();
		const sel = document.getElementById("rich-cavallo");
		sel.innerHTML = (horses || []).map((h) => `<option value="${escapeHtml(h.id)}">${escapeHtml(h.name || "Cavallo")}</option>`).join("") + "<option value=\"__altro__\">Altro cavallo…</option>";
		sel.value = horses && horses.length ? horses[0].id : "__altro__";
		document.getElementById("rich-tipo").value = "ferratura";
		[
			"rich-cavallo-nome",
			"rich-tipo-altro",
			"rich-ora",
			"rich-note"
		].forEach((id) => document.getElementById(id).value = "");
		const domani = aggiungiGiorniIso(isoLocale(/* @__PURE__ */ new Date()), 1);
		document.getElementById("rich-data").value = domani;
		document.getElementById("rich-data").min = isoLocale(/* @__PURE__ */ new Date());
		document.getElementById("rich-error").style.display = "none";
		toggleRichiestaCampi();
		openModal("modal-appuntamenti-maniscalco");
		await renderAppuntamentiManiscalco();
	}
	function toggleRichiestaCampi() {
		document.getElementById("rich-cavallo-nome-group").style.display = document.getElementById("rich-cavallo").value === "__altro__" ? "flex" : "none";
		document.getElementById("rich-tipo-altro-group").style.display = document.getElementById("rich-tipo").value === "altro" ? "flex" : "none";
	}
	async function renderAppuntamentiManiscalco() {
		const box = document.getElementById("app-man-list");
		if (!currentFarrier) {
			box.innerHTML = "";
			return;
		}
		box.innerHTML = "<div class=\"loading\"><div class=\"spinner\"></div> Caricamento...</div>";
		const lista = await DB.listAppuntamentiCliente(currentFarrier.cliente_mascalcia_id);
		if (!lista.length) {
			box.innerHTML = "<div class=\"muted\" style=\"font-size:13px\">Nessun appuntamento in programma.</div>";
			return;
		}
		box.innerHTML = lista.map((a) => {
			const [lbl, stile] = STATO_APP_LABEL[a.stato] || [a.stato, ""];
			let tipo = TIPO_FERRATURA_LABELS[a.tipo_ferratura] || a.tipo_ferratura || "";
			if (a.tipo_ferratura === "altro" && a.tipo_altro) tipo = a.tipo_altro;
			return `
    <div class="rich-item">
      <div style="flex:1;min-width:0">
        <div style="font-size:13.5px;font-weight:600">${formatDataBreve(a.data_intervento)}${a.ora ? " · " + String(a.ora).slice(0, 5) : ""}</div>
        <div class="muted" style="font-size:12px">${escapeHtml(tipo)}${a.nome_cavallo ? " · " + escapeHtml(a.nome_cavallo) : ""}</div>
      </div>
      <span class="app-man-stato" style="${stile}">${lbl}</span>
      ${a.stato === "richiesto" ? `<button class="btn btn-outline btn-sm" onclick="annullaRichiestaAppuntamento('${a.id}')">Annulla</button>` : ""}
    </div>${a.modifica && a.modifica.prima ? `
    <div class="nota-modifica lunga" style="margin:-4px 0 10px">✏️ Modificato dal maniscalco · prima era: ${escapeHtml(testoPrimaModifica(a.modifica))}
      <button class="btn btn-primary btn-sm" style="display:block;margin-top:6px" onclick="vistoModificaAppuntamento('${a.id}', this)">Ok, ho visto</button></div>` : ""}`;
		}).join("");
	}
	async function vistoModificaAppuntamento(id, btn) {
		if (btn) btn.disabled = true;
		if (DEMO_MODE) {
			const i = demoState.interventiMascalcia.find((x) => x.id === id);
			if (i) i.modifica = null;
		} else {
			const { data, error } = await sb.rpc("prop_visto_modifica_appuntamento", { p_intervento_id: id });
			if (error || !data?.ok) {
				if (btn) btn.disabled = false;
				showToast(data && data.errore || "Non riuscito, riprova.");
				return;
			}
		}
		showToast("Fatto: il maniscalco sa che hai visto la modifica.");
		wgOwn.caricato = 0;
		if (currentFarrier) {
			await renderAppuntamentiManiscalco();
			try {
				await renderFarrierChatThread();
			} catch (e) {}
		}
		if (vistaWidgetAttiva() && vistaAi() === "proprietario") wgCaricaOwner();
	}
	async function inviaRichiestaAppuntamento() {
		if (!currentFarrier) return;
		const errBox = document.getElementById("rich-error");
		const errore = (msg) => {
			errBox.textContent = msg;
			errBox.style.display = "block";
		};
		errBox.style.display = "none";
		const cav = document.getElementById("rich-cavallo").value;
		const horse_id = cav && cav !== "__altro__" ? cav : null;
		const nome_cavallo = cav === "__altro__" ? document.getElementById("rich-cavallo-nome").value.trim() : null;
		const tipo = document.getElementById("rich-tipo").value;
		const tipo_altro = tipo === "altro" ? document.getElementById("rich-tipo-altro").value.trim() : null;
		const data = document.getElementById("rich-data").value;
		const ora = document.getElementById("rich-ora").value || null;
		const note = document.getElementById("rich-note").value.trim() || null;
		if (cav === "__altro__" && !nome_cavallo) return errore("Scrivi il nome del cavallo.");
		if (tipo === "altro" && !tipo_altro) return errore("Specifica il tipo di intervento.");
		if (!data || data < isoLocale(/* @__PURE__ */ new Date())) return errore("Scegli una data da oggi in poi.");
		const btn = document.getElementById("rich-btn");
		btn.disabled = true;
		const { error } = await DB.richiediAppuntamento({
			cliente_mascalcia_id: currentFarrier.cliente_mascalcia_id,
			horse_id,
			nome_cavallo,
			tipo,
			tipo_altro,
			data,
			ora,
			note
		});
		btn.disabled = false;
		if (error) return errore("Invio non riuscito: " + (error.message || "riprova"));
		showToast("Richiesta inviata al maniscalco");
		document.getElementById("rich-note").value = "";
		await renderAppuntamentiManiscalco();
		await renderFarrierChatThread();
		loadFarrierChatSection$1();
	}
	async function annullaRichiestaAppuntamento(id) {
		if (!confirm("Annullare questa richiesta?")) return;
		const { error } = await DB.annullaRichiesta(id);
		if (error) {
			showToast("Errore: " + (error.message || ""));
			return;
		}
		showToast("Richiesta annullata");
		await renderAppuntamentiManiscalco();
		await renderFarrierChatThread();
	}
	// equo-app-src/src/ruoli/proprietario/moduli/083-services-map.js
	var servicesMapInstance = null;
	var servicesMapMarkers = [];
	var servicesAllData = [];
	var servicesUserPos = null;
	var servicesActiveFilter = "tutti";
	function haversineKm(lat1, lng1, lat2, lng2) {
		const R = 6371;
		const dLat = (lat2 - lat1) * Math.PI / 180;
		const dLng = (lng2 - lng1) * Math.PI / 180;
		const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
		return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	}
	var SERVICE_TYPE_LABELS = {
		veterinario: "Veterinario",
		centro_ippico: "Centro ippico",
		negozio: "Negozio"
	};
	var SERVICE_TYPE_ICONS = {
		veterinario: "fa-stethoscope",
		centro_ippico: "fa-horse-head",
		negozio: "fa-store"
	};
	async function fetchOsmServices(lat, lng, radiusM) {
		const query = `[out:json][timeout:20];(node["amenity"="veterinary"](around:${radiusM},${lat},${lng});node["leisure"="horse_riding"](around:${radiusM},${lat},${lng});node["sport"="equestrian"](around:${radiusM},${lat},${lng});node["shop"="equestrian"](around:${radiusM},${lat},${lng}););out center;`;
		const res = await fetch("https://overpass-api.de/api/interpreter", {
			method: "POST",
			body: "data=" + encodeURIComponent(query)
		});
		if (!res.ok) throw new Error("overpass_http_" + res.status);
		return ((await res.json()).elements || []).map((el) => {
			const tags = el.tags || {};
			let tipo = "negozio";
			if (tags.amenity === "veterinary") tipo = "veterinario";
			else if (tags.leisure === "horse_riding" || tags.sport === "equestrian") tipo = "centro_ippico";
			else if (tags.shop === "equestrian") tipo = "negozio";
			return {
				id: "osm-" + el.id,
				tipo,
				nome: tags.name || SERVICE_TYPE_LABELS[tipo],
				indirizzo: [tags["addr:street"], tags["addr:housenumber"]].filter(Boolean).join(" ") || null,
				telefono: tags.phone || tags["contact:phone"] || null,
				lat: el.lat,
				lng: el.lon,
				fonte: "osm"
			};
		});
	}
	function openServicesMap() {
		openModal("modal-services-map");
		servicesActiveFilter = "tutti";
		document.getElementById("services-list").innerHTML = "<div class=\"loading\"><div class=\"spinner\"></div> Cerco i servizi vicino a te...</div>";
		if (!navigator.geolocation) {
			document.getElementById("services-list").innerHTML = "<div class=\"empty-state\">Il tuo browser non supporta la geolocalizzazione.</div>";
			return;
		}
		navigator.geolocation.getCurrentPosition(async (pos) => {
			servicesUserPos = {
				lat: pos.coords.latitude,
				lng: pos.coords.longitude
			};
			await loadServicesData();
		}, () => {
			document.getElementById("services-list").innerHTML = "<div class=\"empty-state\">Attiva la posizione per vedere i servizi vicino a te.<br><button class=\"btn btn-primary btn-sm\" style=\"margin-top:10px\" onclick=\"openServicesMap()\">Riprova</button></div>";
		}, {
			enableHighAccuracy: false,
			timeout: 8e3
		});
	}
	async function loadServicesData() {
		document.getElementById("services-list").innerHTML = "<div class=\"loading\"><div class=\"spinner\"></div> Cerco i servizi vicino a te...</div>";
		let osmData = [];
		let curatedData = [];
		let osmError = false;
		try {
			[osmData, curatedData] = await Promise.all([fetchOsmServices(servicesUserPos.lat, servicesUserPos.lng, 15e3), DB.listServices()]);
			if (osmData.length === 0) osmData = await fetchOsmServices(servicesUserPos.lat, servicesUserPos.lng, 4e4);
		} catch (e) {
			osmError = true;
			curatedData = await DB.listServices().catch(() => []);
		}
		servicesAllData = [...(curatedData || []).map((s) => ({
			...s,
			fonte: "curato"
		})), ...osmData].map((s) => ({
			...s,
			distanza: haversineKm(servicesUserPos.lat, servicesUserPos.lng, s.lat, s.lng)
		})).sort((a, b) => a.distanza - b.distanza);
		initServicesMapView();
		if (servicesAllData.length === 0 && osmError) {
			document.getElementById("services-list").innerHTML = "<div class=\"empty-state\">Errore di connessione durante la ricerca. Riprova.<br><button class=\"btn btn-primary btn-sm\" style=\"margin-top:10px\" onclick=\"loadServicesData()\">Riprova</button></div>";
			return;
		}
		renderServicesList();
	}
	function initServicesMapView() {
		const el = document.getElementById("services-map-canvas");
		if (!el) return;
		if (servicesMapInstance) {
			servicesMapInstance.remove();
			servicesMapInstance = null;
		}
		servicesMapInstance = L.map(el).setView([servicesUserPos.lat, servicesUserPos.lng], 12);
		L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OpenStreetMap" }).addTo(servicesMapInstance);
		L.circleMarker([servicesUserPos.lat, servicesUserPos.lng], {
			radius: 7,
			color: "#03491d",
			fillColor: "#03491d",
			fillOpacity: 1
		}).addTo(servicesMapInstance).bindPopup("Tu sei qui");
		renderServicesMarkers();
	}
	function renderServicesMarkers() {
		if (!servicesMapInstance) return;
		servicesMapMarkers.forEach((m) => servicesMapInstance.removeLayer(m));
		servicesMapMarkers = [];
		(servicesActiveFilter === "tutti" ? servicesAllData : servicesAllData.filter((s) => s.tipo === servicesActiveFilter)).forEach((s) => {
			const marker = L.marker([s.lat, s.lng]).addTo(servicesMapInstance).bindPopup(`<b>${escapeHtml(s.nome)}</b><br>${SERVICE_TYPE_LABELS[s.tipo]}`);
			marker.on("click", () => focusServiceOnMap(s.id));
			servicesMapMarkers.push(marker);
		});
	}
	function filterServices(tipo) {
		servicesActiveFilter = tipo;
		document.querySelectorAll("#services-map-chips .chip").forEach((c) => c.classList.toggle("active", c.dataset.tipo === tipo));
		renderServicesMarkers();
		renderServicesList();
	}
	function renderServicesList() {
		const box = document.getElementById("services-list");
		const filtered = servicesActiveFilter === "tutti" ? servicesAllData : servicesAllData.filter((s) => s.tipo === servicesActiveFilter);
		if (filtered.length === 0) {
			box.innerHTML = "<div class=\"empty-state\">Nessun servizio trovato nella zona.</div>";
			return;
		}
		box.innerHTML = filtered.map((s) => `
    <div class="inbox-item" id="service-item-${s.id}" onclick="focusServiceOnMap('${s.id}')">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px">
        <div>
          <div style="font-weight:600"><span class="fa-icon"><i class="fa-solid ${SERVICE_TYPE_ICONS[s.tipo]}"></i></span> ${escapeHtml(s.nome)}${s.fonte === "curato" ? " <span title=\"Verificato da Equo\">★</span>" : ""}</div>
          <div class="muted" style="font-size:12px">${SERVICE_TYPE_LABELS[s.tipo]} · ${s.distanza.toFixed(1)} km${s.indirizzo ? " · " + escapeHtml(s.indirizzo) : ""}</div>
        </div>
      </div>
      <div style="display:flex;gap:8px;margin-top:8px" onclick="event.stopPropagation()">
        ${s.telefono ? `<a class="btn btn-outline btn-sm" href="tel:${escapeHtml(String(s.telefono).replace(/[^\d+]/g, ""))}"><span class="fa-icon"><i class="fa-solid fa-phone"></i></span> Chiama</a>` : ""}
        <a class="btn btn-outline btn-sm" href="https://www.google.com/maps/dir/?api=1&destination=${s.lat},${s.lng}" target="_blank" rel="noopener"><span class="fa-icon"><i class="fa-solid fa-diamond-turn-right"></i></span> Indicazioni</a>
      </div>
    </div>
  `).join("");
	}
	function focusServiceOnMap(id) {
		const s = servicesAllData.find((x) => x.id === id);
		if (!s || !servicesMapInstance) return;
		servicesMapInstance.setView([s.lat, s.lng], 15);
		const marker = servicesMapMarkers.find((m) => m.getLatLng().lat === s.lat && m.getLatLng().lng === s.lng);
		if (marker) marker.openPopup();
	}
	// equo-app-src/src/ruoli/proprietario/moduli/102-equo-card.js
	var EC_GRAD = [
		"linear-gradient(135deg,#1f5a46 0%,#0e3328 55%,#b8862c 140%)",
		"linear-gradient(135deg,#6b2340 0%,#3a1023 60%,#e0a35a 150%)",
		"linear-gradient(135deg,#23407a 0%,#101f45 60%,#c9a86a 150%)",
		"linear-gradient(135deg,#5b3a12 0%,#2b1a06 60%,#e8b04b 150%)",
		"linear-gradient(135deg,#2c4a52 0%,#122429 60%,#9fd0c0 150%)"
	];
	var EC_LIVELLO = {
		provvisorio: "PROVVISORIO",
		validato: "VALIDATO ✓",
		certificato: "CERTIFICATO ★"
	};
	var EC_LOGO = "assets/equo-card-cavallo.png";
	var ecDati = null;
	var ecAttuale = -1;
	var ecMov = false;
	var ecRaf = null;
	function ecEsc(s) {
		return escapeHtml(s == null ? "" : String(s));
	}
	function ecCodice(h) {
		return h.codice_definitivo || h.codice_equo || "";
	}
	function ecLinkPubblico(h) {
		return "https://app.equohub.com/cavallo/" + encodeURIComponent(ecCodice(h));
	}
	function ecAnni(h) {
		const a = h.birth_date ? Number(String(h.birth_date).slice(0, 4)) : null;
		return a ? Math.max(0, (/* @__PURE__ */ new Date()).getFullYear() - a) : null;
	}
	function ecFoto(h) {
		try {
			const rows = typeof albumCache !== "undefined" && albumCache[h.id] || [];
			const cov = rows.find((r) => r.copertina) || rows[0];
			if (cov && albumUrlMap[cov.path]) return albumUrlMap[cov.path];
			const v = (ecDati?.diario || []).find((x) => x.horse_id === h.id && x.media_path && x.tipo === "foto");
			if (v && diarioUrl[v.media_path]) return diarioUrl[v.media_path];
		} catch (e) {}
		return null;
	}
	function ecProprietario() {
		const u = currentUser || {};
		return u.fullName || u.full_name || u.nome || (u.email ? String(u.email).split("@")[0] : "") || "–";
	}
	function ecDove(h) {
		if (h.ubicazione_tipo === "casa") return "A casa";
		return h.ubicazione_nome || (h.stable_id ? "In scuderia" : "–");
	}
	function ecQrSvg(testo) {
		if (typeof QRCode !== "function") return "";
		const d = document.createElement("div");
		new QRCode(d, {
			text: testo,
			width: 120,
			height: 120
		});
		const s = d.querySelector("svg");
		return s ? s.outerHTML : "";
	}
	async function ecCaricaDati(lista) {
		const ids = lista.map((h) => h.id);
		const oggi = /* @__PURE__ */ new Date();
		oggi.setHours(0, 0, 0, 0);
		const da14 = (/* @__PURE__ */ new Date(oggi.getTime() - 12096e5)).toISOString();
		const sicuro = (p) => Promise.resolve().then(p).catch(() => []);
		const [eventi, diario, lezioni] = await Promise.all([
			sicuro(() => ids.length ? DB.listEventiTutti(ids) : []),
			sicuro(async () => {
				if (DEMO_MODE || !ids.length) return [];
				const { data, error } = await sb.from("diario_voci").select("id, horse_id, data_voce, categoria, tipo, media_path").in("horse_id", ids).eq("nascosta", false).gte("data_voce", da14).order("data_voce", { ascending: false }).limit(400);
				if (error) return [];
				try {
					await firmaUrl("diario-media", (data || []).filter((v) => v.tipo === "foto").map((v) => v.media_path), diarioUrl);
				} catch (e) {}
				return data || [];
			}),
			sicuro(() => DB.listLezioni())
		]);
		await Promise.all(ids.map((id) => typeof albumCache !== "undefined" && albumCache[id] ? null : sicuro(() => albumFetch(id))));
		return {
			eventi: eventi || [],
			diario: diario || [],
			lezioni: lezioni || []
		};
	}
	function ecGiorni(da, a) {
		return Math.round((new Date(a).setHours(0, 0, 0, 0) - new Date(da).setHours(0, 0, 0, 0)) / 864e5);
	}
	function ecAnelli(h) {
		const oggi = /* @__PURE__ */ new Date(), d = ecDati || {
			eventi: [],
			diario: [],
			lezioni: []
		};
		const ev = d.eventi.filter((e) => e.horse_id === h.id);
		const ultimi = {};
		ev.forEach((e) => {
			if (!ultimi[e.type] || String(e.date) > String(ultimi[e.type].date)) ultimi[e.type] = e;
		});
		const conScad = Object.values(ultimi).filter((e) => e.next_due_date);
		const scaduti = conScad.filter((e) => ecGiorni(oggi, e.next_due_date) < 0);
		let cura, curaTesto;
		if (!ev.length) {
			cura = 0;
			curaTesto = "Segna ferratura e vaccini nel libretto";
		} else if (!conScad.length) {
			cura = 70;
			curaTesto = "Nessuna scadenza impostata nel libretto";
		} else {
			cura = Math.max(0, 100 - 45 * scaduti.length);
			const nome = (t) => typeof EVENT_LABELS !== "undefined" && EVENT_LABELS[t] || t;
			curaTesto = scaduti.length ? scaduti.map((e) => nome(e.type) + " scaduta da " + -ecGiorni(oggi, e.next_due_date) + " giorni").join(" · ").replace("Vaccino scaduta", "Vaccino scaduto").replace("Test Coggins scaduta", "Test Coggins scaduto") : conScad.sort((a, b) => String(a.next_due_date).localeCompare(String(b.next_due_date))).slice(0, 2).map((e) => {
				const g = ecGiorni(oggi, e.next_due_date);
				return nome(e.type) + (g === 0 ? " oggi" : " tra " + g + " giorni");
			}).join(" · ");
		}
		const da7 = /* @__PURE__ */ new Date(oggi.getTime() - 6048e5);
		const uscite = d.diario.filter((v) => v.horse_id === h.id && [
			"allenamento",
			"passeggiata",
			"lezione"
		].includes(v.categoria) && new Date(v.data_voce) >= da7).length + d.lezioni.filter((l) => l.horse_id === h.id && new Date(l.data) >= da7 && new Date(l.data) <= oggi).length;
		const obiettivo = Math.max(1, Number(h.obiettivo_settimana) || 4);
		const mov = Math.min(100, Math.round(uscite / obiettivo * 100));
		const movTesto = uscite + " su " + obiettivo + " questa settimana" + (uscite >= obiettivo ? ": bravo!" : "");
		const ultimo = d.diario.filter((v) => v.horse_id === h.id).sort((a, b) => String(b.data_voce).localeCompare(String(a.data_voce)))[0];
		let att, attTesto;
		if (!ultimo) {
			att = 0;
			attTesto = "Nessun momento nel Diario da 2 settimane";
		} else {
			const g = ecGiorni(ultimo.data_voce, oggi);
			att = g <= 2 ? 100 : g <= 7 ? 70 : 40;
			attTesto = "Ultimo momento nel Diario: " + (g === 0 ? "oggi" : g === 1 ? "ieri" : g + " giorni fa");
		}
		return {
			valori: [
				cura,
				mov,
				att
			],
			testi: [
				curaTesto,
				movTesto,
				attTesto
			],
			obiettivo
		};
	}
	function ecCardHtml(h, i) {
		const anni = ecAnni(h), foto = ecFoto(h), liv = h.codice_livello || "provvisorio";
		const anno = h.birth_date ? String(h.birth_date).slice(0, 4) : "";
		return `<div class="ec-slot"><div class="ec-carta" data-i="${i}" onclick="ecGira(this)">
    <div class="ec-faccia" style="background:${EC_GRAD[i % EC_GRAD.length]}">
      <div class="ec-olo"></div><div class="ec-trama"></div><div class="ec-luce"></div>
      <div class="ec-alto"><div class="ec-marchio">Equo<small>CARD</small></div><div class="ec-livello">${EC_LIVELLO[liv] || liv.toUpperCase()}</div></div>
      <div class="ec-mezzo"><div class="ec-foto${foto ? " vera" : ""}">${foto ? `<img src="${ecEsc(foto)}" alt="">` : `<img src="${EC_LOGO}" alt="">`}</div>
        <div class="ec-txt"><div class="ec-nome">${ecEsc(h.name)}</div><div class="ec-dett">${ecEsc(h.breed || "Razza non indicata")}<br>${anni != null ? anni + (anni === 1 ? " anno" : " anni") : ""}</div>${h.attivita ? `<div class="ec-attivo">${ecEsc(h.attivita)}</div>` : ""}</div></div>
      <div class="ec-basso"><div class="ec-codice">${ecEsc(ecCodice(h))}</div><div class="ec-chip"></div></div>
    </div>
    <div class="ec-faccia ec-retro" style="background:${EC_GRAD[i % EC_GRAD.length]}">
      <div class="ec-olo"></div><div class="ec-trama"></div><div class="ec-luce"></div>
      <div class="ec-griglia"><div class="ec-qr">${ecCodice(h) ? ecQrSvg(ecLinkPubblico(h)) : "<div class=\"ec-qr-vuoto\">Il QR arriva con il codice Equo del cavallo</div>"}</div>
        <div class="ec-dati">
          <div><span>Microchip</span>${ecEsc(h.microchip || "–")}</div>
          <div><span>Anno di nascita</span>${ecEsc([anno, h.mantello].filter(Boolean).join(" · ") || "–")}</div>
          <div><span>Attività</span>${ecEsc(h.attivita || "–")}</div>
          <div><span>Proprietario</span>${ecEsc(ecProprietario())}</div>
          <div><span>Dove sta</span>${ecEsc(ecDove(h))}</div>
        </div></div>
    </div>
  </div></div>`;
	}
	function ecLista() {
		return (typeof cavalliUsabili === "function" ? cavalliUsabili() : horses || []) || [];
	}
	async function apriEquoCard() {
		const lista = ecLista();
		const box = document.getElementById("equo-card");
		if (!box) return;
		box.classList.add("on");
		document.body.classList.add("ec-aperta");
		const giostra = document.getElementById("ec-giostra");
		if (!lista.length) {
			giostra.innerHTML = `<div class="ec-vuoto">Aggiungi il tuo primo cavallo per avere la sua Equo Card.<br><button class="btn btn-primary" style="margin-top:12px" onclick="chiudiEquoCard();openHorseForm()">Aggiungi cavallo</button></div>`;
			document.getElementById("ec-punti").innerHTML = "";
			document.getElementById("ec-salute").style.display = "none";
			document.getElementById("ec-esito").style.display = "none";
			return;
		}
		document.getElementById("ec-salute").style.display = "";
		document.getElementById("ec-esito").style.display = "";
		giostra.innerHTML = lista.map(ecCardHtml).join("");
		document.getElementById("ec-punti").innerHTML = lista.map((_, i) => `<i class="${i ? "" : "on"}"></i>`).join("");
		ecAttuale = -1;
		giostra.scrollLeft = 0;
		ecMostraSalute(0);
		ecAnima();
		ecDati = await ecCaricaDati(lista);
		giostra.innerHTML = lista.map(ecCardHtml).join("");
		ecAttuale = -1;
		ecMostraSalute(ecIndice());
	}
	function chiudiEquoCard() {
		document.getElementById("equo-card")?.classList.remove("on");
		document.body.classList.remove("ec-aperta");
		if (ecRaf) cancelAnimationFrame(ecRaf);
		ecRaf = null;
	}
	function ecIndice() {
		const g = document.getElementById("ec-giostra"), s = g && g.querySelector(".ec-slot");
		if (!s) return 0;
		return Math.max(0, Math.min(ecLista().length - 1, Math.round(g.scrollLeft / (s.offsetWidth + 14))));
	}
	function ecGira(el) {
		ecChiediMovimento();
		el.classList.toggle("girata");
	}
	function ecMostraSalute(i) {
		const h = ecLista()[i];
		if (!h || i === ecAttuale) return;
		ecAttuale = i;
		document.querySelectorAll("#ec-punti i").forEach((p, k) => p.classList.toggle("on", k === i));
		const a = ecAnelli(h);
		document.getElementById("ec-s-tit").textContent = "Salute di " + h.name;
		const col = [
			"var(--ec-cura)",
			"var(--ec-mov)",
			"var(--ec-att)"
		], rr = [
			56,
			42,
			28
		], nomi = [
			"Cura",
			"Movimento",
			"Attenzioni"
		];
		const svg = document.getElementById("ec-anelli");
		svg.innerHTML = rr.map((r, k) => `<circle class="fondo" cx="66" cy="66" r="${r}" stroke="${col[k]}" stroke-width="11"/><circle class="val" cx="66" cy="66" r="${r}" stroke="${col[k]}" stroke-width="11" stroke-dasharray="${(2 * Math.PI * r).toFixed(2)}" stroke-dashoffset="${(2 * Math.PI * r).toFixed(2)}"/>`).join("");
		requestAnimationFrame(() => requestAnimationFrame(() => svg.querySelectorAll(".val").forEach((el, k) => {
			const L = 2 * Math.PI * rr[k];
			el.style.strokeDashoffset = (L * (1 - a.valori[k] / 100)).toFixed(2);
		})));
		document.getElementById("ec-voci").innerHTML = nomi.map((n, k) => `<button type="button" class="ec-voce" onclick="ecAzione(${k})"><i style="background:${col[k]}"></i><span><b>${n} · ${a.valori[k]}%</b><small>${ecEsc(a.testi[k])}</small></span></button>`).join("");
		const tutti = a.valori.every((v) => v >= 100), da = nomi.filter((_, k) => a.valori[k] < 70);
		document.getElementById("ec-esito").innerHTML = tutti ? `✨ <b>Tutti gli anelli chiusi!</b> ${ecEsc(h.name)} è in perfetta forma: cura, movimento e attenzioni al 100%.` : da.length ? `Da sistemare: <b>${da.map((x) => x.toLowerCase()).join(", ").replace(/, ([^,]*)$/, " e $1")}</b>. Tocca una voce per sapere cosa fare.` : `Quasi perfetto: ancora un po' e chiudi tutti gli anelli di ${ecEsc(h.name)}.`;
		const box = document.getElementById("ec-salute");
		box.classList.remove("ec-festa");
		document.getElementById("ec-coriandoli").innerHTML = "";
		if (tutti) setTimeout(() => {
			if (ecAttuale !== i) return;
			box.classList.add("ec-festa");
			ecCoriandoli();
		}, 1250);
	}
	function ecCoriandoli() {
		const cc = [
			"#f2b544",
			"#3fd18a",
			"#7cc4ff",
			"#ff8a5c",
			"#ffffff"
		];
		document.getElementById("ec-coriandoli").innerHTML = Array.from({ length: 34 }, () => `<i style="left:${Math.random() * 100}%;background:${cc[Math.floor(Math.random() * cc.length)]};animation-delay:${Math.random() * .5}s;animation-duration:${1.2 + Math.random() * .9}s"></i>`).join("");
	}
	async function ecAzione(k) {
		const h = ecLista()[Math.max(0, ecAttuale)];
		if (!h) return;
		if (k === 0) {
			chiudiEquoCard();
			if (typeof apriSchedaCavallo === "function") apriSchedaCavallo(h.id);
			return;
		}
		if (k === 2) {
			chiudiEquoCard();
			showPage("diario");
			return;
		}
		const attuale = Math.max(1, Number(h.obiettivo_settimana) || 4);
		const v = prompt("Quante uscite a settimana vuoi fare con " + h.name + "? (allenamenti, passeggiate, lezioni)", String(attuale));
		if (v == null) return;
		const n = Math.round(Number(v));
		if (!(n >= 1 && n <= 14)) {
			showToast("Scrivi un numero da 1 a 14");
			return;
		}
		if (DEMO_MODE) h.obiettivo_settimana = n;
		else {
			const { error } = await sb.from("horses").update({ obiettivo_settimana: n }).eq("id", h.id);
			if (error) {
				showToast(/obiettivo_settimana/.test(error.message || "") ? "Funzione non ancora attiva: serve l'aggiornamento del database." : "Non salvato, riprova.");
				return;
			}
			h.obiettivo_settimana = n;
		}
		ecAttuale = -1;
		ecMostraSalute(ecIndice());
	}
	function ecLuce(x, y) {
		document.querySelectorAll("#equo-card .ec-faccia").forEach((f) => {
			f.style.setProperty("--mx", x);
			f.style.setProperty("--my", y);
			f.style.setProperty("--a", (x + y) * 3);
		});
	}
	function ecChiediMovimento() {
		if (ecMov) return;
		ecMov = true;
		const on = () => window.addEventListener("deviceorientation", (e) => {
			if (e.gamma == null || !document.body.classList.contains("ec-aperta")) return;
			ecLuce(50 + e.gamma * 1.6, 40 + (e.beta - 40) * 1.2);
		});
		try {
			if (typeof DeviceOrientationEvent !== "undefined" && DeviceOrientationEvent.requestPermission) DeviceOrientationEvent.requestPermission().then((s) => {
				if (s === "granted") on();
			}).catch(() => {});
			else on();
		} catch (e) {}
	}
	function ecAnima() {
		let t = 0;
		const giro = () => {
			if (!document.body.classList.contains("ec-aperta")) return;
			if (!ecMov) {
				t += .012;
				ecLuce(50 + Math.sin(t) * 35, 35 + Math.cos(t * .8) * 25);
			}
			ecRaf = requestAnimationFrame(giro);
		};
		if (ecRaf) cancelAnimationFrame(ecRaf);
		ecRaf = requestAnimationFrame(giro);
	}
	function ecInit() {
		const g = document.getElementById("ec-giostra");
		if (!g || g.dataset.pronto) return;
		g.dataset.pronto = "1";
		g.addEventListener("scroll", () => ecMostraSalute(ecIndice()), { passive: true });
		g.addEventListener("pointermove", (e) => {
			const c = e.target.closest(".ec-carta");
			if (!c) return;
			const r = c.getBoundingClientRect();
			ecLuce((e.clientX - r.left) / r.width * 100, (e.clientY - r.top) / r.height * 100);
		});
	}
	if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", ecInit);
	else setTimeout(ecInit, 0);
	function ecMostraQr() {
		const h = ecLista()[Math.max(0, ecAttuale)];
		if (!h) return;
		if (!ecCodice(h)) {
			showToast("Questo cavallo non ha ancora un codice Equo.");
			return;
		}
		document.getElementById("ec-qr-g").innerHTML = ecQrSvg(ecLinkPubblico(h));
		document.getElementById("ec-qr-t").textContent = h.name + " · " + ecCodice(h);
		document.getElementById("ec-qrgrande").classList.add("on");
	}
	function ecCaricaImg(src) {
		return new Promise((res) => {
			if (!src) return res(null);
			const im = new Image();
			im.crossOrigin = "anonymous";
			im.onload = () => res(im);
			im.onerror = () => res(null);
			im.src = src;
		});
	}
	async function ecImmagineCard(h, i) {
		const W = 1012, H = 638, cv = document.createElement("canvas");
		cv.width = W;
		cv.height = H;
		const x = cv.getContext("2d");
		const colori = [
			["#1f5a46", "#0e3328"],
			["#6b2340", "#3a1023"],
			["#23407a", "#101f45"],
			["#5b3a12", "#2b1a06"],
			["#2c4a52", "#122429"]
		][i % 5];
		const r = 44;
		x.beginPath();
		x.moveTo(r, 0);
		x.arcTo(W, 0, W, H, r);
		x.arcTo(W, H, 0, H, r);
		x.arcTo(0, H, 0, 0, r);
		x.arcTo(0, 0, W, 0, r);
		x.closePath();
		x.clip();
		const gr = x.createLinearGradient(0, 0, W, H);
		gr.addColorStop(0, colori[0]);
		gr.addColorStop(.62, colori[1]);
		gr.addColorStop(1, "#b8862c");
		x.fillStyle = gr;
		x.fillRect(0, 0, W, H);
		x.fillStyle = "#fff";
		x.font = "800 46px -apple-system,Helvetica,Arial";
		x.fillText("Equo", 54, 92);
		x.font = "500 26px -apple-system,Helvetica,Arial";
		x.globalAlpha = .8;
		x.fillText("CARD", 182, 92);
		x.globalAlpha = 1;
		const liv = EC_LIVELLO[h.codice_livello || "provvisorio"] || "";
		x.font = "700 24px -apple-system,Helvetica,Arial";
		const lw = x.measureText(liv).width + 36;
		x.fillStyle = "rgba(255,255,255,.22)";
		x.beginPath();
		x.roundRect ? x.roundRect(958 - lw, 56, lw, 50, 25) : x.rect(958 - lw, 56, lw, 50);
		x.fill();
		x.fillStyle = "#fff";
		x.fillText(liv, 958 - lw + 18, 90);
		const foto = await ecCaricaImg(ecFoto(h) || EC_LOGO);
		if (foto) {
			x.save();
			x.beginPath();
			x.arc(150, 300, 96, 0, Math.PI * 2);
			x.clip();
			const s = Math.max(192 / foto.width, 192 / foto.height);
			x.drawImage(foto, 150 - foto.width * s / 2, 300 - foto.height * s / 2, foto.width * s, foto.height * s);
			x.restore();
		}
		x.fillStyle = "#fff";
		x.font = "800 70px -apple-system,Helvetica,Arial";
		x.fillText(h.name || "", 284, 290);
		x.font = "400 32px -apple-system,Helvetica,Arial";
		x.globalAlpha = .9;
		const anni = ecAnni(h);
		x.fillText([
			h.breed,
			anni != null ? anni + " anni" : null,
			h.attivita
		].filter(Boolean).join(" · "), 284, 342);
		x.globalAlpha = 1;
		x.font = "500 40px ui-monospace,Menlo,monospace";
		x.fillText(ecCodice(h), 54, 584);
		if (ecCodice(h) && typeof QRCode === "function") {
			const d = document.createElement("div");
			new QRCode(d, {
				text: ecLinkPubblico(h),
				width: 200,
				height: 200
			});
			const qc = d.querySelector("canvas");
			if (qc) {
				x.fillStyle = "#fff";
				x.fillRect(758, 384, 200, 200);
				x.imageSmoothingEnabled = false;
				x.drawImage(qc, 768, 394, 180, 180);
			}
		}
		return new Promise((res) => cv.toBlob((b) => res(b), "image/png"));
	}
	async function ecCondividi() {
		const lista = ecLista(), i = Math.max(0, ecAttuale), h = lista[i];
		if (!h) return;
		showToast("Preparo la card…");
		try {
			const blob = await ecImmagineCard(h, i);
			const file = new File([blob], "Equo-Card-" + String(h.name || "cavallo").replace(/[^A-Za-z0-9]+/g, "-") + ".png", { type: "image/png" });
			if (navigator.canShare && navigator.canShare({ files: [file] })) try {
				await navigator.share({
					files: [file],
					title: "Equo Card di " + h.name,
					text: ecCodice(h) ? ecLinkPubblico(h) : ""
				});
				return;
			} catch (e) {
				if (e?.name === "AbortError") return;
			}
			const url = URL.createObjectURL(blob), a = document.createElement("a");
			a.href = url;
			a.download = file.name;
			document.body.appendChild(a);
			a.click();
			a.remove();
			setTimeout(() => URL.revokeObjectURL(url), 3e4);
		} catch (e) {
			showToast("Non riesco a creare l'immagine, riprova.");
		}
	}
	// equo-app-src/src/ruoli/proprietario/moduli/index.js
	Object.assign(window, {
		accettaLezioneScuderia,
		accettaProposta,
		accettaTuttiProposte,
		annullaRichiestaAppuntamento,
		applicaHomeMan,
		apriAppuntamentiManiscalco,
		askDeleteHorse,
		askDeleteHorseStep2,
		bollaAllegato,
		cambiaIncassi,
		caricaConfermePro,
		cavalliUsabili: cavalliUsabili$1,
		closeHorseDetail,
		collegaManiscalco,
		confermaCavalloPro,
		confermaDatiCavallo,
		confermaSalvaSenzaMicrochip,
		confirmDeleteHorse,
		copiaTestoDs,
		createLezione,
		daSaldareVisto,
		deleteExpenseFromModal,
		deleteHorseEventFromModal,
		deleteLezioneCorrente,
		earlyAggiornaBottoneLifetime,
		earlyCancella,
		earlyControlla,
		earlyDopoRitorno,
		earlyLeggi,
		earlyNonOra,
		earlyPaga,
		eseguiSalvataggioHorse,
		filterServices,
		focusServiceOnMap,
		goToLastMessage,
		hmCartella,
		hmChiudi,
		hmDaIncassare,
		hmFoglio,
		hmGiaFatto,
		hmMessaggi,
		hmNavAttivo,
		hmNovitaHammer,
		hmPiu,
		incassiNascosti,
		insertOwnerEmoji,
		inviaRichiestaAppuntamento,
		joinStable,
		loadCalendarioScuderia,
		loadDeadlines,
		loadExpenses,
		loadExpensesSummary,
		loadFarrierChatSection: loadFarrierChatSection$1,
		loadHorseEvents,
		loadHorses,
		loadLezioni,
		loadOwnerChatList,
		loadServicesData,
		loadStableChatSection,
		mlApri,
		mlCarica,
		mlCavId,
		mlOggi,
		mlRigaCavallo,
		mlSalva,
		mlTappeOggi,
		modificaLezioneScuderia,
		openAddEventModal,
		openAddExpenseModal,
		openAddLezioneModal,
		openCollegaManiscalco,
		openEditEventModal,
		openEditExpenseModal,
		openHorseDetail,
		openHorseForm,
		openServicesMap,
		openStableChatThread,
		previewAllegato,
		previewMessaggioMascalcia,
		proponiCavalliCliente,
		referralControlla,
		invitoControlla,
		renderDaSaldare,
		renderHome,
		renderHorseInfoBox,
		renderProposteCliente,
		renderWidgetOwner,
		rifiutaProposta,
		rispondiLasciato,
		caricaRichiesteLasciati,
		rispondiStessoCavallo,
		saveExpense,
		saveHorse,
		saveHorseEvent,
		segnalaGiaPagato,
		toggleOwnerEmojiPicker,
		toggleRichiestaCampi,
		tornaAInserireMicrochip,
		vistaWidgetAttiva,
		vistoModificaAppuntamento,
		wgApriAppMan,
		wgChattaAppuntamento,
		wgControllaResetPin,
		wgFissaManiscalco,
		wgNuovoEvento,
		apriEquoCard,
		chiudiEquoCard,
		ecAzione,
		ecCondividi,
		ecGira,
		ecMostraQr
	});
})();

