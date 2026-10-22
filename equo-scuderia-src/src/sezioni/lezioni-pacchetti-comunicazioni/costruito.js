
// === GENERATO da equo-app-src/strumenti/costruisci-moduli.mjs: NON modificare qui, modificare equo-scuderia-src/src/sezioni/lezioni-pacchetti-comunicazioni/moduli/ ===
(function() {
	// equo-scuderia-src/src/sezioni/lezioni-pacchetti-comunicazioni/moduli/044-lezioni-prenotazioni.js
	var STATO_LEZIONE_LABELS = {
		prenotata: "Prenotata",
		confermata: "Confermata",
		completata: "Completata",
		annullata: "Annullata"
	};
	async function refreshLezioniModule() {
		if (cavalliList.length === 0) await loadCavalli();
		await loadLezioni();
		populateLezioneSelects();
		renderLezioni();
	}
	async function loadLezioni() {
		if (DEMO_MODE) {
			lezioniList = demoState.lezioni;
			aggiornaContatoriNav();
			return;
		}
		const { data, error } = await sb.from("scuderia_lezioni").select("id, centro_id, data, ora_inizio, istruttore_id, cavallo_id, allievo_id, stato, note, cavaliere").eq("centro_id", currentCentro.id).order("data", { ascending: true }).order("ora_inizio", { ascending: true });
		if (!error) lezioniList = data || [];
		aggiornaContatoriNav();
	}
	function membroNome(id) {
		const m = teamList.find((x) => x.id === id);
		return m ? m.nome_visualizzato || RUOLO_LABELS[m.ruolo] : "—";
	}
	function cavalloNome(id) {
		const c = cavalliList.find((x) => x.id === id);
		return c ? c.nome : "—";
	}
	function setLezioniFilter(f) {
		lezioniFilter = f;
		document.querySelectorAll(".lez-filter-btn").forEach((b) => b.classList.toggle("active", b.dataset.filter === f));
		renderLezioni();
	}
	function renderLezioni() {
		const oggi = isoLoc(/* @__PURE__ */ new Date());
		let list = [...lezioniList];
		if (lezioniFilter === "prossime") list = list.filter((l) => l.data >= oggi);
		if (lezioniFilter === "passate") list = list.filter((l) => l.data < oggi);
		list.sort((a, b) => (a.data + a.ora_inizio).localeCompare(b.data + b.ora_inizio) * (lezioniFilter === "passate" ? -1 : 1));
		const body = document.getElementById("lezioni-table-body");
		const empty = document.getElementById("lezioni-empty");
		body.innerHTML = "";
		empty.style.display = list.length === 0 ? "block" : "none";
		list.forEach((l) => {
			const tr = document.createElement("tr");
			tr.innerHTML = `
      <td>${formatDate(l.data)}</td>
      <td>${l.ora_inizio ? String(l.ora_inizio).slice(0, 5) : "—"}</td>
      <td>${escapeHtml(membroNome(l.istruttore_id))}</td>
      <td>${escapeHtml(cavalloNome(l.cavallo_id))}</td>
      <td>${escapeHtml(membroNome(l.allievo_id))}${l.cavaliere ? `<div style="color:var(--muted);font-size:12px">monta ${escapeHtml(l.cavaliere)}</div>` : ""}</td>
      <td><span class="badge-pill badge-${STATO_LEZIONE_BADGE[l.stato] || "gray"}">${STATO_LEZIONE_LABELS[l.stato] || l.stato}</span></td>
      <td style="text-align:right">
        ${l.allievo_id ? `<button class="btn btn-ghost btn-sm" onclick="chattaConMembro('${l.allievo_id}')" title="Chatta"><i class="fa-solid fa-comment-dots"></i></button>` : ""}
        ${memberCanUI("lezioni") ? `<button class="btn btn-ghost btn-sm" onclick="openLezioneForm('${l.id}')" title="Modifica"><i class="fa-solid fa-pen"></i></button>` : ""}
        ${l.stato !== "annullata" && l.stato !== "completata" && memberCanUI("lezioni") ? `<button class="btn btn-ghost btn-sm" onclick="setLezioneStato('${l.id}','completata')" title="Segna completata"><i class="fa-solid fa-check"></i></button>` : ""}
        <button class="btn btn-ghost btn-sm" onclick="askDeleteLezione('${l.id}')" title="Elimina"><i class="fa-solid fa-trash"></i></button>
      </td>`;
			body.appendChild(tr);
		});
	}
	function populateLezioneSelects() {
		const istruttori = teamList.filter((m) => ["istruttore", "admin"].includes(m.ruolo));
		const allievi = teamList.filter((m) => m.ruolo === "allievo");
		const proprietari = teamList.filter((m) => m.ruolo === "proprietario");
		const selIst = document.getElementById("lez-istruttore");
		const selAll = document.getElementById("lez-allievo");
		const selCav = document.getElementById("lez-cavallo");
		const opt = (m, def) => `<option value="${m.id}">${escapeHtml(m.nome_visualizzato || def)}</option>`;
		selIst.innerHTML = istruttori.map((m) => opt(m, RUOLO_LABELS[m.ruolo])).join("") || `<option value="">Nessun istruttore nel team</option>`;
		selAll.innerHTML = `<option value="">Nessuno / da definire</option>` + (allievi.length ? `<optgroup label="Allievi">${allievi.map((m) => opt(m, "Allievo")).join("")}</optgroup>` : "") + (proprietari.length ? `<optgroup label="Proprietari collegati">${proprietari.map((m) => opt(m, "Proprietario")).join("")}</optgroup>` : "");
		selCav.innerHTML = `<option value="">Nessuno / da definire</option>` + cavalliList.map((c) => `<option value="${c.id}">${escapeHtml(c.nome)}</option>`).join("");
	}
	function aggiornaCavalieriSuggeriti() {
		const allievo = document.getElementById("lez-allievo").value;
		const nomi = [...new Set(lezioniList.filter((l) => l.cavaliere && (!allievo || l.allievo_id === allievo)).map((l) => l.cavaliere))].sort();
		document.getElementById("lez-cavalieri-suggeriti").innerHTML = nomi.map((n) => `<option value="${escapeHtml(n)}">`).join("");
	}
	function lezioneCavalloCambiato() {
		const cav = cavalliList.find((c) => c.id === document.getElementById("lez-cavallo").value);
		const selAll = document.getElementById("lez-allievo");
		if (cav?.proprietario_membro_id && !selAll.value && [...selAll.options].some((o) => o.value === cav.proprietario_membro_id)) {
			selAll.value = cav.proprietario_membro_id;
			aggiornaCavalieriSuggeriti();
		}
	}
	function openLezioneForm(id) {
		document.getElementById("lezione-error").style.display = "none";
		populateLezioneSelects();
		const l = id ? lezioniList.find((x) => x.id === id) : null;
		editingLezioneId = l ? l.id : null;
		document.getElementById("lezione-modal-titolo").textContent = l ? "Modifica lezione" : "Nuova lezione";
		document.getElementById("lez-stato-field").style.display = l ? "block" : "none";
		document.getElementById("lez-data").value = l ? l.data : isoLoc(/* @__PURE__ */ new Date());
		document.getElementById("lez-ora").value = l?.ora_inizio ? String(l.ora_inizio).slice(0, 5) : "10:00";
		document.getElementById("lez-note").value = l?.note || "";
		document.getElementById("lez-cavallo").value = l?.cavallo_id || "";
		document.getElementById("lez-allievo").value = l?.allievo_id || "";
		document.getElementById("lez-stato").value = l?.stato || "prenotata";
		document.getElementById("lez-cavaliere").value = l?.cavaliere || "";
		aggiornaCavalieriSuggeriti();
		if (l?.istruttore_id) document.getElementById("lez-istruttore").value = l.istruttore_id;
		openModal("modal-lezione");
	}
	async function saveLezione() {
		const data = document.getElementById("lez-data").value;
		const ora_inizio = document.getElementById("lez-ora").value;
		const istruttore_id = document.getElementById("lez-istruttore").value || null;
		const cavallo_id = document.getElementById("lez-cavallo").value || null;
		const allievo_id = document.getElementById("lez-allievo").value || null;
		const note = document.getElementById("lez-note").value.trim() || null;
		const cavaliere = document.getElementById("lez-cavaliere").value.trim().slice(0, 80) || null;
		const errBox = document.getElementById("lezione-error");
		errBox.style.display = "none";
		if (!data || !ora_inizio) {
			errBox.textContent = "Inserisci data e orario.";
			errBox.style.display = "block";
			return;
		}
		const payload = {
			data,
			ora_inizio,
			istruttore_id,
			cavallo_id,
			allievo_id,
			note,
			cavaliere
		};
		if (editingLezioneId) payload.stato = document.getElementById("lez-stato").value || "prenotata";
		else payload.stato = "prenotata";
		try {
			if (DEMO_MODE) {
				if (editingLezioneId) {
					const l = demoState.lezioni.find((x) => x.id === editingLezioneId);
					if (l) Object.assign(l, payload);
				} else demoState.lezioni.push({
					id: "l" + (demoIdCounter++ + 200),
					centro_id: demoState.centro.id,
					...payload
				});
			} else if (editingLezioneId) {
				const { error } = await sb.from("scuderia_lezioni").update(payload).eq("id", editingLezioneId);
				if (error) throw error;
			} else {
				const { error } = await sb.from("scuderia_lezioni").insert({
					centro_id: currentCentro.id,
					...payload
				});
				if (error) throw error;
			}
			const modificata = !!editingLezioneId;
			editingLezioneId = null;
			await loadLezioni();
			renderLezioni();
			closeModal("modal-lezione");
			showToast(modificata ? "Lezione aggiornata." : "Lezione aggiunta.");
		} catch (err) {
			errBox.textContent = err.message || "Errore nel salvataggio.";
			errBox.style.display = "block";
		}
	}
	async function setLezioneStato(id, stato) {
		if (DEMO_MODE) {
			const l = demoState.lezioni.find((x) => x.id === id);
			if (l) l.stato = stato;
		} else {
			const { error } = await sb.from("scuderia_lezioni").update({ stato }).eq("id", id);
			if (error) {
				showToast("Errore nell'aggiornamento.");
				return;
			}
		}
		await loadLezioni();
		renderLezioni();
		showToast("Lezione aggiornata.");
	}
	function askDeleteLezione(id) {
		lezioneToDelete = id;
		openModal("modal-delete-lezione");
	}
	async function confirmDeleteLezione() {
		if (!lezioneToDelete) return;
		if (DEMO_MODE) demoState.lezioni = demoState.lezioni.filter((l) => l.id !== lezioneToDelete);
		else {
			const { error } = await sb.from("scuderia_lezioni").delete().eq("id", lezioneToDelete);
			if (error) {
				showToast("Errore nell'eliminazione.");
				closeModal("modal-delete-lezione");
				return;
			}
		}
		await loadLezioni();
		renderLezioni();
		closeModal("modal-delete-lezione");
		showToast("Lezione eliminata.");
	}
	// equo-scuderia-src/src/sezioni/lezioni-pacchetti-comunicazioni/moduli/045-pacchetti-abbonamenti.js
	async function refreshPacchettiModule() {
		if (cavalliList.length === 0) await loadCavalli();
		await loadEventiAll();
		await loadPacchetti();
		populatePacchettoMembroSelect();
		renderCruscotto();
		renderPacchetti();
	}
	function populatePacchettoMembroSelect() {
		const sel = document.getElementById("pac-membro");
		if (!sel) return;
		sel.innerHTML = `<option value="">— nessuno (solo testo libero) —</option>` + teamList.map((m) => `<option value="${m.id}">${escapeHtml(m.nome_visualizzato || RUOLO_LABELS[m.ruolo])} (${RUOLO_LABELS[m.ruolo] || m.ruolo})</option>`).join("");
	}
	async function loadPacchetti() {
		if (DEMO_MODE) {
			pacchettiList = demoState.pacchetti;
			aggiornaContatoriNav();
			return;
		}
		const { data, error } = await sb.from("scuderia_pacchetti").select("id, centro_id, cliente, tipo, unita_totali, unita_usate, data_inizio, data_scadenza, prezzo, note, membro_id, cavallo_id").eq("centro_id", currentCentro.id).order("data_scadenza", { ascending: true });
		if (!error) pacchettiList = data || [];
		aggiornaContatoriNav();
	}
	function statusPacchetto(p) {
		if (p.tipo === "carnet" && p.unita_totali != null && p.unita_usate >= p.unita_totali) return "red";
		const carnetQuasiFinito = p.tipo === "carnet" && p.unita_totali != null && p.unita_totali - (p.unita_usate || 0) <= SOGLIE_CONTATORI.carnetUnitaRimaste;
		if (!p.data_scadenza) return carnetQuasiFinito ? "yellow" : "gray";
		const oggi = /* @__PURE__ */ new Date();
		oggi.setHours(0, 0, 0, 0);
		const giorni = Math.round((new Date(p.data_scadenza) - oggi) / 864e5);
		if (giorni < 0) return "red";
		if (giorni <= SOGLIE_CONTATORI.pacchettiGiorni || carnetQuasiFinito) return "yellow";
		return "green";
	}
	function renderCruscotto() {
		const countByStatus = {
			red: 0,
			yellow: 0
		};
		cavalliList.forEach((c) => {
			const s = worstStatus(c.id);
			if (s === "red") countByStatus.red++;
			else if (s === "yellow") countByStatus.yellow++;
		});
		let pacchettiInScadenza = 0, pacchettiScaduti = 0;
		pacchettiList.forEach((p) => {
			const s = statusPacchetto(p);
			if (s === "red") pacchettiScaduti++;
			else if (s === "yellow") pacchettiInScadenza++;
		});
		const tiles = [
			{
				label: "Cavalli con scadenze sanitarie scadute",
				value: countByStatus.red,
				tone: countByStatus.red > 0 ? "red" : "green",
				icon: "fa-triangle-exclamation",
				type: "sanitarie"
			},
			{
				label: "Cavalli in scadenza (30 gg)",
				value: countByStatus.yellow,
				tone: countByStatus.yellow > 0 ? "yellow" : "green",
				icon: "fa-clock",
				type: "sanitarie"
			},
			{
				label: "Pacchetti scaduti / esauriti",
				value: pacchettiScaduti,
				tone: pacchettiScaduti > 0 ? "red" : "green",
				icon: "fa-ticket",
				type: "pacchetti"
			}
		];
		document.getElementById("cruscotto-grid").innerHTML = tiles.map((t) => `
    <div class="stat-tile stat-tile-clickable" onclick="openHomeDetail('${t.type}')">
      <div class="label"><i class="fa-solid ${t.icon}" style="margin-right:6px"></i>${t.label}</div>
      <div class="value" style="color:${t.tone === "red" ? "var(--danger)" : t.tone === "yellow" ? "#8a6a12" : "var(--text)"}">${t.value}</div>
    </div>`).join("");
	}
	function renderPacchetti() {
		const body = document.getElementById("pacchetti-table-body");
		const empty = document.getElementById("pacchetti-empty");
		body.innerHTML = "";
		empty.style.display = pacchettiList.length === 0 ? "block" : "none";
		pacchettiList.forEach((p) => {
			const s = statusPacchetto(p);
			const dettaglio = p.tipo === "carnet" ? `${p.unita_usate ?? 0} / ${p.unita_totali ?? "—"} lezioni` : p.prezzo ? `€ ${Number(p.prezzo).toFixed(2)}` : "—";
			const tr = document.createElement("tr");
			tr.innerHTML = `
      <td>${escapeHtml(p.cliente)}</td>
      <td>${TIPO_PACCHETTO_LABELS[p.tipo] || p.tipo}</td>
      <td>${dettaglio}</td>
      <td>${p.data_scadenza ? formatDate(p.data_scadenza) : "—"}</td>
      <td><span class="badge-pill badge-${s}">${s === "red" ? "Scaduto" : s === "yellow" ? "In scadenza" : "Attivo"}</span></td>
      <td style="text-align:right;white-space:nowrap">
        ${p.membro_id ? `<button class="btn btn-ghost btn-sm" onclick="chattaConMembro('${p.membro_id}')" title="Chatta"><i class="fa-solid fa-comment-dots"></i></button>` : ""}
        ${memberCanUI("pacchetti") ? `<button class="btn btn-ghost btn-sm" onclick="openPacchettoForm('${p.id}')"><i class="fa-solid fa-pen"></i></button>` : ""}
        <button class="btn btn-ghost btn-sm" onclick="askDeletePacchetto('${p.id}')"><i class="fa-solid fa-trash"></i></button>
      </td>`;
			body.appendChild(tr);
		});
	}
	function toggleTipoPacchetto() {
		const tipo = document.getElementById("pac-tipo").value;
		document.getElementById("pac-carnet-fields").style.display = tipo === "carnet" ? "grid" : "none";
		document.getElementById("pac-cavallo-field").style.display = tipo === "carnet" ? "none" : "block";
	}
	async function popolaPacchettoCavalli(sel) {
		if (!cavalliList.length) await loadCavalli();
		document.getElementById("pac-cavallo").innerHTML = `<option value="">— nessuno —</option>` + cavalliList.map((c) => `<option value="${c.id}">${escapeHtml(c.nome)}</option>`).join("");
		document.getElementById("pac-cavallo").value = sel || "";
	}
	function openPacchettoForm(id) {
		editingPacchettoId = id || null;
		document.getElementById("pacchetto-error").style.display = "none";
		document.getElementById("modal-pacchetto-title").textContent = editingPacchettoId ? "Modifica pacchetto" : "Nuovo pacchetto";
		populatePacchettoMembroSelect();
		if (editingPacchettoId) {
			const p = pacchettiList.find((x) => x.id === editingPacchettoId);
			document.getElementById("pac-cliente").value = p?.cliente || "";
			document.getElementById("pac-membro").value = p?.membro_id || "";
			document.getElementById("pac-tipo").value = p?.tipo || "carnet";
			document.getElementById("pac-unita-totali").value = p?.unita_totali ?? "";
			document.getElementById("pac-unita-usate").value = p?.unita_usate ?? "0";
			document.getElementById("pac-inizio").value = p?.data_inizio || "";
			document.getElementById("pac-scadenza").value = p?.data_scadenza || "";
			document.getElementById("pac-prezzo").value = p?.prezzo ?? "";
			document.getElementById("pac-note").value = p?.note || "";
			popolaPacchettoCavalli(p?.cavallo_id);
		} else {
			popolaPacchettoCavalli(null);
			document.getElementById("pac-cliente").value = "";
			document.getElementById("pac-membro").value = "";
			document.getElementById("pac-tipo").value = "carnet";
			document.getElementById("pac-unita-totali").value = "";
			document.getElementById("pac-unita-usate").value = "0";
			document.getElementById("pac-inizio").value = isoLoc(/* @__PURE__ */ new Date());
			document.getElementById("pac-scadenza").value = "";
			document.getElementById("pac-prezzo").value = "";
			document.getElementById("pac-note").value = "";
		}
		toggleTipoPacchetto();
		openModal("modal-pacchetto");
	}
	async function savePacchetto() {
		const cliente = document.getElementById("pac-cliente").value.trim();
		const tipo = document.getElementById("pac-tipo").value;
		const errBox = document.getElementById("pacchetto-error");
		errBox.style.display = "none";
		if (!cliente) {
			errBox.textContent = "Inserisci il nome del cliente.";
			errBox.style.display = "block";
			return;
		}
		const payload = {
			cliente,
			tipo,
			membro_id: document.getElementById("pac-membro").value || null,
			unita_totali: tipo === "carnet" ? parseInt(document.getElementById("pac-unita-totali").value) || null : null,
			unita_usate: tipo === "carnet" ? parseInt(document.getElementById("pac-unita-usate").value) || 0 : null,
			data_inizio: document.getElementById("pac-inizio").value || null,
			data_scadenza: document.getElementById("pac-scadenza").value || null,
			prezzo: document.getElementById("pac-prezzo").value ? parseFloat(document.getElementById("pac-prezzo").value) : null,
			note: document.getElementById("pac-note").value.trim() || null,
			cavallo_id: tipo === "carnet" ? null : document.getElementById("pac-cavallo").value || null
		};
		try {
			if (DEMO_MODE) {
				if (editingPacchettoId) {
					const idx = demoState.pacchetti.findIndex((p) => p.id === editingPacchettoId);
					if (idx >= 0) demoState.pacchetti[idx] = {
						...demoState.pacchetti[idx],
						...payload
					};
				} else demoState.pacchetti.push({
					id: "p" + (demoIdCounter++ + 300),
					centro_id: demoState.centro.id,
					...payload
				});
			} else if (editingPacchettoId) {
				const { error } = await sb.from("scuderia_pacchetti").update(payload).eq("id", editingPacchettoId);
				if (error) throw error;
			} else {
				const { error } = await sb.from("scuderia_pacchetti").insert({
					centro_id: currentCentro.id,
					...payload
				});
				if (error) throw error;
			}
			await loadPacchetti();
			renderCruscotto();
			renderPacchetti();
			closeModal("modal-pacchetto");
			showToast("Pacchetto salvato.");
		} catch (err) {
			errBox.textContent = err.message || "Errore nel salvataggio.";
			errBox.style.display = "block";
		}
	}
	function askDeletePacchetto(id) {
		pacchettoToDelete = id;
		openModal("modal-delete-pacchetto");
	}
	async function confirmDeletePacchetto() {
		if (!pacchettoToDelete) return;
		if (DEMO_MODE) demoState.pacchetti = demoState.pacchetti.filter((p) => p.id !== pacchettoToDelete);
		else {
			const { error } = await sb.from("scuderia_pacchetti").delete().eq("id", pacchettoToDelete);
			if (error) {
				showToast("Errore nell'eliminazione.");
				closeModal("modal-delete-pacchetto");
				return;
			}
		}
		await loadPacchetti();
		renderCruscotto();
		renderPacchetti();
		closeModal("modal-delete-pacchetto");
		showToast("Pacchetto eliminato.");
	}
	// equo-scuderia-src/src/sezioni/lezioni-pacchetti-comunicazioni/moduli/046-comunicazioni.js
	async function refreshComunicazioniModule() {
		await loadMessaggi();
		renderMessaggi();
		renderClientiChatList();
	}
	// equo-scuderia-src/src/sezioni/lezioni-pacchetti-comunicazioni/moduli/index.js
	Object.assign(window, {
		aggiornaCavalieriSuggeriti,
		askDeleteLezione,
		askDeletePacchetto,
		cavalloNome,
		confirmDeleteLezione,
		confirmDeletePacchetto,
		lezioneCavalloCambiato,
		loadLezioni,
		loadPacchetti,
		membroNome,
		openLezioneForm,
		openPacchettoForm,
		refreshComunicazioniModule,
		refreshLezioniModule,
		refreshPacchettiModule,
		saveLezione,
		savePacchetto,
		setLezioneStato,
		setLezioniFilter,
		statusPacchetto,
		toggleTipoPacchetto
	});
})();

