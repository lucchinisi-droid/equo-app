
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
		await Promise.all([
			loadLezioni(),
			loadPacchetti().catch(() => {}),
			caricaDisdettaOre()
		]);
		populateLezioneSelects();
		renderLezioni();
	}
	async function loadLezioni() {
		if (DEMO_MODE) {
			lezioniList = demoState.lezioni;
			aggiornaContatoriNav();
			return;
		}
		const { data, error } = await sb.from("scuderia_lezioni").select("*").eq("centro_id", currentCentro.id).order("data", { ascending: true }).order("ora_inizio", { ascending: true });
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
      <td>${escapeHtml(membroNome(l.allievo_id))}${l.cavaliere ? `<div style="color:var(--muted);font-size:12px">monta ${escapeHtml(l.cavaliere)}</div>` : ""}${carnetBreve(l.pacchetto_id)}</td>
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
		lezioneAggiornaCarnet(l?.pacchetto_id || null, !l);
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
			cavaliere,
			pacchetto_id: document.getElementById("lez-pacchetto").value || null
		};
		if (editingLezioneId) payload.stato = document.getElementById("lez-stato").value || "prenotata";
		else payload.stato = "prenotata";
		try {
			if (DEMO_MODE) {
				if (editingLezioneId) {
					const l = demoState.lezioni.find((x) => x.id === editingLezioneId);
					if (l) {
						const prima = l.stato, pacPrima = l.pacchetto_id;
						if (pacPrima && pacPrima !== payload.pacchetto_id) {
							l.stato = "prenotata";
							demoScalo(l, prima);
							l.stato = prima;
							l.pacchetto_id = pacPrima;
						}
						Object.assign(l, payload);
						demoScalo(l, prima);
					}
				} else {
					const l = {
						id: "l" + (demoIdCounter++ + 200),
						centro_id: demoState.centro.id,
						...payload
					};
					demoState.lezioni.push(l);
					demoScalo(l, null);
				}
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
			await Promise.all([loadLezioni(), loadPacchetti().catch(() => {})]);
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
			if (l) {
				const prima = l.stato;
				l.stato = stato;
				demoScalo(l, prima);
			}
		} else {
			const { error } = await sb.from("scuderia_lezioni").update({ stato }).eq("id", id);
			if (error) {
				showToast("Errore nell'aggiornamento.");
				return;
			}
		}
		await Promise.all([loadLezioni(), loadPacchetti().catch(() => {})]);
		renderLezioni();
		const l = lezioniList.find((x) => x.id === id), p = l?.pacchetto_id ? pacchettiList.find((x) => x.id === l.pacchetto_id) : null;
		showToast(stato === "completata" && p && p.unita_totali != null ? `Lezione completata · nel carnet restano ${Math.max(p.unita_totali - (p.unita_usate || 0), 0)} lezioni.` : "Lezione aggiornata.");
	}
	function askDeleteLezione(id) {
		lezioneToDelete = id;
		openModal("modal-delete-lezione");
	}
	async function confirmDeleteLezione() {
		if (!lezioneToDelete) return;
		if (DEMO_MODE) {
			const l = demoState.lezioni.find((x) => x.id === lezioneToDelete);
			if (l) {
				const prima = l.stato;
				l.stato = "prenotata";
				demoScalo(l, prima);
			}
			demoState.lezioni = demoState.lezioni.filter((l) => l.id !== lezioneToDelete);
		} else {
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
	function carnetValidiPer(allievoId, data) {
		if (!allievoId) return [];
		const ref = typeof clientiDati !== "undefined" ? clientiDati[allievoId]?.referente_id : null;
		return (pacchettiList || []).filter((p) => p.tipo === "carnet" && (p.membro_id === allievoId || ref && p.membro_id === ref) && (!p.data_scadenza || p.data_scadenza >= data) && (!p.data_inizio || p.data_inizio <= data)).sort((a, b) => (a.data_scadenza || "9999").localeCompare(b.data_scadenza || "9999"));
	}
	function carnetRimaste(p) {
		return p && p.unita_totali != null ? p.unita_totali - (p.unita_usate || 0) : null;
	}
	function carnetBreve(id) {
		const p = id ? (pacchettiList || []).find((x) => x.id === id) : null;
		if (!p) return "";
		const r = carnetRimaste(p);
		return `<div style="color:${r != null && r <= 2 ? "#8a6a12" : "var(--muted)"};font-size:12px"><i class="fa-solid fa-ticket"></i> carnet ${p.unita_usate || 0}/${p.unita_totali ?? "—"}</div>`;
	}
	function lezioneAggiornaCarnet(scelto, proponi) {
		const sel = document.getElementById("lez-pacchetto");
		if (!sel) return;
		const allievo = document.getElementById("lez-allievo").value;
		const validi = carnetValidiPer(allievo, document.getElementById("lez-data").value || isoLoc(/* @__PURE__ */ new Date()));
		const attuale = scelto !== void 0 && scelto !== null ? scelto : sel.value;
		const extra = attuale && !validi.some((p) => p.id === attuale) ? (pacchettiList || []).filter((p) => p.id === attuale) : [];
		sel.innerHTML = `<option value="">— nessuno —</option>` + [...validi, ...extra].map((p) => {
			const r = carnetRimaste(p);
			return `<option value="${p.id}">${escapeHtml(p.cliente)} · ${r == null ? "senza limite" : r + " su " + p.unita_totali + " rimaste"}${p.data_scadenza ? " · scade " + formatDate(p.data_scadenza) : ""}</option>`;
		}).join("");
		const libero = validi.find((p) => carnetRimaste(p) == null || carnetRimaste(p) > 0);
		sel.value = attuale && [...sel.options].some((o) => o.value === attuale) ? attuale : proponi !== false && !attuale && libero ? libero.id : "";
		lezioneCarnetInfo();
	}
	function lezioneCarnetInfo() {
		const info = document.getElementById("lez-carnet-info");
		if (!info) return;
		const allievo = document.getElementById("lez-allievo").value, id = document.getElementById("lez-pacchetto").value;
		const p = id ? (pacchettiList || []).find((x) => x.id === id) : null, r = carnetRimaste(p);
		if (p) info.innerHTML = r == null ? "Lezioni senza limite." : r <= 0 ? "<span style=\"color:var(--danger)\">Questo carnet è finito: la lezione si salva, ma conviene un carnet nuovo.</span>" : `Quando la segni completata, la lezione si scala da qui: ne restano ${r}.`;
		else info.innerHTML = allievo ? "Nessun carnet valido: la lezione si salva lo stesso, senza scalare." : "";
	}
	async function caricaDisdettaOre() {
		if (!DEMO_MODE && currentCentro?.id && currentCentro.disdetta_ore == null) {
			const { data, error } = await sb.from("centri").select("disdetta_ore").eq("id", currentCentro.id).maybeSingle();
			if (!error && data?.disdetta_ore != null) currentCentro.disdetta_ore = data.disdetta_ore;
		}
		const sel = document.getElementById("lez-disdetta-ore");
		if (!sel) return;
		const ore = String(currentCentro?.disdetta_ore ?? 24);
		if (![...sel.options].some((o) => o.value === ore)) sel.insertAdjacentHTML("beforeend", `<option value="${ore}">${ore}</option>`);
		sel.value = ore;
		sel.disabled = currentMembro?.ruolo !== "admin";
	}
	async function salvaDisdettaOre() {
		const ore = parseInt(document.getElementById("lez-disdetta-ore").value, 10);
		if (!DEMO_MODE) {
			const { error } = await sb.from("centri").update({ disdetta_ore: ore }).eq("id", currentCentro.id);
			if (error) {
				showToast(error.message);
				return;
			}
		}
		currentCentro.disdetta_ore = ore;
		showToast(ore ? `Disdetta senza perdere la lezione fino a ${ore} ore prima.` : "Le lezioni disdette non si perdono mai.");
	}
	function demoScalo(l, statoPrima) {
		if (!DEMO_MODE || !l) return;
		demoState.movimenti = demoState.movimenti || [];
		if (!l.pacchetto_id && l.allievo_id && l.stato === "completata" && statoPrima !== "completata") {
			const libero = carnetValidiPer(l.allievo_id, l.data).find((p) => carnetRimaste(p) == null || carnetRimaste(p) > 0);
			l.pacchetto_id = libero ? libero.id : null;
		}
		const p = demoState.pacchetti.find((x) => x.id === l.pacchetto_id && x.tipo === "carnet");
		if (!p) return;
		const netto = demoState.movimenti.filter((m) => m.lezione_id === l.id && m.pacchetto_id === p.id).reduce((s, m) => s + m.quantita, 0);
		let target, motivo = "lezione";
		if (l.stato === "completata") target = 1;
		else if (l.stato === "annullata" && statoPrima && statoPrima !== "annullata") {
			const inizio = (/* @__PURE__ */ new Date(l.data + "T" + String(l.ora_inizio || "00:00").slice(0, 5))).getTime();
			target = Date.now() > inizio - (currentCentro?.disdetta_ore ?? 24) * 36e5 ? 1 : 0;
			motivo = "disdetta_tardiva";
		} else if (l.stato === "annullata") target = netto;
		else target = 0;
		if (target === netto) return;
		demoState.movimenti.push({
			id: "mv" + demoIdCounter++,
			pacchetto_id: p.id,
			lezione_id: l.id,
			quantita: target - netto,
			motivo: target > netto ? motivo : "restituito",
			nota: "lezione del " + formatDate(l.data),
			creato_il: (/* @__PURE__ */ new Date()).toISOString()
		});
		p.unita_usate = Math.max((p.unita_usate || 0) + target - netto, 0);
	}
	// equo-scuderia-src/src/sezioni/lezioni-pacchetti-comunicazioni/moduli/045-pacchetti-abbonamenti.js
	async function refreshPacchettiModule() {
		if (cavalliList.length === 0) await loadCavalli();
		await loadEventiAll();
		await loadPacchetti$1();
		populatePacchettoMembroSelect();
		renderCruscotto();
		renderPacchetti();
	}
	function populatePacchettoMembroSelect() {
		const sel = document.getElementById("pac-membro");
		if (!sel) return;
		const opt = (m) => `<option value="${m.id}">${escapeHtml(m.nome_visualizzato || RUOLO_LABELS[m.ruolo])} (${RUOLO_LABELS[m.ruolo] || m.ruolo})</option>`;
		const ord = (a, b) => (a.nome_visualizzato || "").localeCompare(b.nome_visualizzato || "", "it");
		const clienti = teamList.filter((m) => ["allievo", "proprietario"].includes(m.ruolo)).sort(ord);
		const staff = teamList.filter((m) => !["allievo", "proprietario"].includes(m.ruolo)).sort(ord);
		sel.innerHTML = `<option value="">— scegli il cliente —</option>` + (clienti.length ? `<optgroup label="Clienti">${clienti.map(opt).join("")}</optgroup>` : "") + (staff.length ? `<optgroup label="Staff">${staff.map(opt).join("")}</optgroup>` : "");
	}
	async function loadPacchetti$1() {
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
      <td>${escapeHtml(p.cliente)}${p.membro_id ? "" : " <span class=\"badge-pill badge-yellow\" title=\"Apri il pacchetto e scegli il cliente\">da collegare</span>"}</td>
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
		const btnNuovo = document.getElementById("pac-nuovo-cliente");
		if (btnNuovo) btnNuovo.style.display = typeof puoVedereClienti === "function" && puoVedereClienti() ? "" : "none";
		const pv = editingPacchettoId ? pacchettiList.find((x) => x.id === editingPacchettoId) : null;
		document.getElementById("pac-da-collegare").style.display = pv && !pv.membro_id ? "block" : "none";
		document.getElementById("pac-nome-vecchio").textContent = pv?.cliente || "";
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
		pacchettoMostraCrediti(editingPacchettoId ? pacchettiList.find((x) => x.id === editingPacchettoId) : null);
		openModal("modal-pacchetto");
	}
	var MOTIVO_CREDITO = {
		lezione: "Lezione",
		disdetta_tardiva: "Disdetta tardiva",
		restituito: "Restituita",
		correzione: "Correzione",
		iniziale: "Già usate all'inizio"
	};
	async function pacchettoMostraCrediti(p) {
		const esistente = !!(p && p.tipo === "carnet");
		document.getElementById("pac-unita-usate").disabled = esistente;
		document.getElementById("pac-correzione").style.display = esistente ? "grid" : "none";
		document.getElementById("pac-corr-q").value = "";
		document.getElementById("pac-corr-nota").value = "";
		const box = document.getElementById("pac-storico");
		box.style.display = "none";
		box.innerHTML = "";
		if (!esistente) return;
		let mov = [];
		if (DEMO_MODE) mov = (demoState.movimenti || []).filter((m) => m.pacchetto_id === p.id);
		else {
			const { data, error } = await sb.from("scuderia_crediti_movimenti").select("quantita, motivo, nota, creato_il").eq("pacchetto_id", p.id).order("creato_il", { ascending: false }).limit(30);
			if (!error) mov = data || [];
		}
		mov = [...mov].sort((a, b) => String(b.creato_il).localeCompare(String(a.creato_il)));
		if (!mov.length) return;
		box.innerHTML = `<div style="font-weight:600;margin-bottom:4px">Movimenti del carnet</div>` + mov.map((m) => `<div style="display:flex;gap:8px;padding:4px 0;border-bottom:1px solid var(--border)">
    <span style="width:44px;color:var(--muted)">${escapeHtml(formatDate(String(m.creato_il).slice(0, 10)).slice(0, 5))}</span>
    <span style="flex:1">${escapeHtml(MOTIVO_CREDITO[m.motivo] || m.motivo)}${m.nota ? ` <span style="color:var(--muted)">· ${escapeHtml(m.nota)}</span>` : ""}</span>
    <b style="color:${m.quantita > 0 ? "var(--text)" : "#2c5228"}">${m.quantita > 0 ? "−" + m.quantita : "+" + Math.abs(m.quantita)}</b></div>`).join("");
		box.style.display = "block";
	}
	async function savePacchetto() {
		const membroScelto = document.getElementById("pac-membro").value;
		const errBox = document.getElementById("pacchetto-error");
		errBox.style.display = "none";
		if (!membroScelto) {
			errBox.textContent = "Scegli il cliente dall'elenco (se non c'è, crealo con il tasto accanto).";
			errBox.style.display = "block";
			return;
		}
		if (!document.getElementById("pac-cliente").value.trim()) document.getElementById("pac-cliente").value = teamList.find((m) => m.id === membroScelto)?.nome_visualizzato || "";
		const cliente = document.getElementById("pac-cliente").value.trim() || "Cliente";
		const tipo = document.getElementById("pac-tipo").value;
		const corrQ = parseInt(document.getElementById("pac-corr-q").value, 10) || 0;
		const corrNota = document.getElementById("pac-corr-nota").value.trim();
		if (editingPacchettoId && corrQ && !corrNota) {
			errBox.textContent = "Scrivi il motivo della correzione.";
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
		const pv = editingPacchettoId ? pacchettiList.find((x) => x.id === editingPacchettoId) : null;
		if (pv && pv.tipo === "carnet" && tipo === "carnet") delete payload.unita_usate;
		try {
			if (DEMO_MODE) {
				if (editingPacchettoId) {
					const idx = demoState.pacchetti.findIndex((p) => p.id === editingPacchettoId);
					if (idx >= 0) demoState.pacchetti[idx] = {
						...demoState.pacchetti[idx],
						...payload
					};
					if (idx >= 0 && corrQ) {
						const p = demoState.pacchetti[idx];
						p.unita_usate = Math.max((p.unita_usate || 0) + corrQ, 0);
						(demoState.movimenti = demoState.movimenti || []).push({
							id: "mv" + demoIdCounter++,
							pacchetto_id: p.id,
							quantita: corrQ,
							motivo: "correzione",
							nota: corrNota,
							creato_il: (/* @__PURE__ */ new Date()).toISOString()
						});
					}
				} else demoState.pacchetti.push({
					id: "p" + (demoIdCounter++ + 300),
					centro_id: demoState.centro.id,
					...payload
				});
			} else if (editingPacchettoId) {
				const { error } = await sb.from("scuderia_pacchetti").update(payload).eq("id", editingPacchettoId);
				if (error) throw error;
				if (corrQ) {
					const r = await sb.rpc("correggi_crediti", {
						p_pacchetto: editingPacchettoId,
						p_quantita: corrQ,
						p_nota: corrNota
					});
					if (r.error) throw r.error;
				}
			} else {
				const { error } = await sb.from("scuderia_pacchetti").insert({
					centro_id: currentCentro.id,
					...payload
				});
				if (error) throw error;
			}
			await loadPacchetti$1();
			renderCruscotto();
			renderPacchetti();
			closeModal("modal-pacchetto");
			showToast("Pacchetto salvato.");
		} catch (err) {
			errBox.textContent = /PACCHETTO_SENZA_CLIENTE/.test(err.message || "") ? "Scegli il cliente dall'elenco." : err.message || "Errore nel salvataggio.";
			errBox.style.display = "block";
		}
	}
	var pacNomeAuto = "";
	function pacchettoClienteCambiato() {
		const nome = teamList.find((m) => m.id === document.getElementById("pac-membro").value)?.nome_visualizzato || "";
		const campo = document.getElementById("pac-cliente");
		if (!campo.value.trim() || campo.value.trim() === pacNomeAuto || document.getElementById("pac-da-collegare").style.display === "block") campo.value = nome;
		pacNomeAuto = nome;
	}
	function pacchettoScegliCliente(id) {
		populatePacchettoMembroSelect();
		document.getElementById("pac-membro").value = id;
		pacchettoClienteCambiato();
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
		await loadPacchetti$1();
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
		lezioneAggiornaCarnet,
		lezioneCarnetInfo,
		caricaDisdettaOre,
		salvaDisdettaOre,
		carnetValidiPer,
		pacchettoMostraCrediti,
		aggiornaCavalieriSuggeriti,
		askDeleteLezione,
		askDeletePacchetto,
		cavalloNome,
		confirmDeleteLezione,
		confirmDeletePacchetto,
		lezioneCavalloCambiato,
		loadLezioni,
		loadPacchetti: loadPacchetti$1,
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
		toggleTipoPacchetto,
		pacchettoClienteCambiato,
		pacchettoScegliCliente
	});
})();

