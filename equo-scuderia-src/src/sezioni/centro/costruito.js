
// === GENERATO da equo-app-src/strumenti/costruisci-moduli.mjs: NON modificare qui, modificare equo-scuderia-src/src/sezioni/centro/moduli/ ===
(function() {
	// equo-scuderia-src/src/sezioni/centro/moduli/010-team.js
	async function loadTeam() {
		if (DEMO_MODE) {
			teamList = demoState.membri;
			return;
		}
		const { data, error } = await sb.from("scuderia_membri").select("id, user_id, ruolo, nome_visualizzato, livello, permessi").eq("centro_id", currentCentro.id).order("created_at", { ascending: true });
		if (!error) teamList = data || [];
	}
	function renderTeam() {
		document.getElementById("team-count").textContent = teamList.length;
		const body = document.getElementById("team-table-body");
		const empty = document.getElementById("team-empty");
		body.innerHTML = "";
		if (teamList.length <= 1) empty.style.display = "block";
		else empty.style.display = "none";
		teamList.forEach((m) => {
			const isMe = m.user_id === currentUser.id;
			const isAdminUser = currentMembro.ruolo === "admin";
			const canRemove = isAdminUser && !isMe && m.ruolo !== "admin";
			const canEdit = isAdminUser && !isMe;
			const livelloLabel = m.ruolo === "admin" ? "Admin" : LIVELLO_LABELS[m.livello] || "—";
			const tr = document.createElement("tr");
			tr.innerHTML = `
      <td>${escapeHtml(m.nome_visualizzato || (isMe ? "Tu" : "Membro"))}</td>
      <td><span class="badge-pill badge-gray">${RUOLO_LABELS[m.ruolo] || m.ruolo}</span></td>
      <td><span class="badge-pill badge-gray">${livelloLabel}</span></td>
      <td style="text-align:right;white-space:nowrap">
        ${canEdit ? `<button class="btn btn-ghost btn-sm" onclick="openMemberForm('${m.id}')"><i class="fa-solid fa-pen"></i></button>` : ""}
        ${canRemove ? `<button class="btn btn-ghost btn-sm" onclick="askRemoveMember(${jsArg(m.id)}, ${jsArg(m.nome_visualizzato || "questo membro")})"><i class="fa-solid fa-trash"></i></button>` : ""}
      </td>
    `;
			body.appendChild(tr);
		});
	}
	function onMemberRuoloChange() {
		const isAdminRole = document.getElementById("member-ruolo").value === "admin";
		document.getElementById("member-livello-field").style.display = isAdminRole ? "none" : "block";
		document.getElementById("member-livello-admin-note").style.display = isAdminRole ? "block" : "none";
		if (isAdminRole) document.getElementById("member-permessi-field").style.display = "none";
		else onMemberLivelloChange();
	}
	function onMemberLivelloChange() {
		const livello = document.getElementById("member-livello").value;
		document.getElementById("member-permessi-field").style.display = livello === "3" ? "block" : "none";
	}
	function openMemberForm(id) {
		const m = teamList.find((x) => x.id === id);
		if (!m) return;
		editingMemberId = id;
		document.getElementById("member-error").style.display = "none";
		document.getElementById("member-nome").value = m.nome_visualizzato || "";
		document.getElementById("member-ruolo").value = m.ruolo;
		document.getElementById("member-livello").value = m.livello && m.livello !== "admin" ? m.livello : "1";
		PERMESSI_FLAGS.forEach((f) => {
			document.getElementById("perm-" + f).checked = !!(m.permessi && m.permessi[f]);
		});
		onMemberRuoloChange();
		openModal("modal-member");
	}
	async function saveMember() {
		if (!editingMemberId) return;
		const nome_visualizzato = document.getElementById("member-nome").value.trim() || null;
		const ruolo = document.getElementById("member-ruolo").value;
		const errBox = document.getElementById("member-error");
		errBox.style.display = "none";
		let livello, permessi;
		if (ruolo === "admin") {
			livello = "admin";
			permessi = {};
		} else {
			livello = document.getElementById("member-livello").value;
			permessi = {};
			if (livello === "3") PERMESSI_FLAGS.forEach((f) => {
				permessi[f] = document.getElementById("perm-" + f).checked;
			});
		}
		try {
			if (DEMO_MODE) {
				const idx = demoState.membri.findIndex((x) => x.id === editingMemberId);
				if (idx >= 0) demoState.membri[idx] = {
					...demoState.membri[idx],
					nome_visualizzato,
					ruolo,
					livello,
					permessi
				};
				teamList = demoState.membri;
			} else {
				const { error } = await sb.from("scuderia_membri").update({
					nome_visualizzato,
					ruolo,
					livello,
					permessi
				}).eq("id", editingMemberId);
				if (error) throw error;
				await loadTeam();
			}
			renderTeam();
			closeModal("modal-member");
			showToast("Membro aggiornato.");
		} catch (err) {
			errBox.textContent = err.message || "Errore nel salvataggio.";
			errBox.style.display = "block";
		}
	}
	function askRemoveMember(id, nome) {
		memberToRemove = id;
		document.getElementById("remove-member-text").textContent = `Confermi di voler rimuovere ${nome} dal team?`;
		openModal("modal-remove-member");
	}
	async function confirmRemoveMember() {
		if (!memberToRemove) return;
		if (DEMO_MODE) {
			demoState.membri = demoState.membri.filter((m) => m.id !== memberToRemove);
			teamList = demoState.membri;
		} else {
			const { error } = await sb.from("scuderia_membri").delete().eq("id", memberToRemove);
			if (error) {
				showToast("Errore nella rimozione.");
				closeModal("modal-remove-member");
				return;
			}
			await loadTeam();
		}
		renderTeam();
		closeModal("modal-remove-member");
		showToast("Membro rimosso.");
	}
	// equo-scuderia-src/src/sezioni/centro/moduli/012-dati-societari-e-pagamenti-solo-admin.js
	var DATI_FISCALI_FIELDS = [
		"denominazione",
		"piva",
		"cod_rea",
		"iban",
		"pec",
		"sdi",
		"indirizzo",
		"telefono_fisso",
		"cellulare"
	];
	var DATI_FISCALI_LABELS = {
		denominazione: "Denominazione",
		piva: "P.IVA",
		cod_rea: "Cod. REA",
		iban: "IBAN",
		pec: "PEC",
		sdi: "SDI",
		indirizzo: "Indirizzo",
		telefono_fisso: "Telefono fisso",
		cellulare: "Cellulare"
	};
	async function refreshDatiFiscaliCard() {
		const isAdminUser = currentMembro?.ruolo === "admin";
		document.getElementById("card-dati-fiscali").style.display = isAdminUser ? "block" : "none";
		if (!isAdminUser) return;
		await loadDatiFiscali();
		renderDatiFiscali();
	}
	async function loadDatiFiscali() {
		if (DEMO_MODE) {
			datiFiscali = demoState.datiFiscali;
			return;
		}
		const { data, error } = await sb.from("scuderia_dati_fiscali").select("id, centro_id, denominazione, piva, cod_rea, iban, pec, sdi, indirizzo, telefono_fisso, cellulare").eq("centro_id", currentCentro.id).maybeSingle();
		if (!error) datiFiscali = data || null;
	}
	function renderDatiFiscali() {
		DATI_FISCALI_FIELDS.forEach((f) => {
			const val = datiFiscali?.[f];
			document.getElementById("df-view-" + f).textContent = val ? val : "—";
		});
	}
	function openDatiFiscaliForm() {
		document.getElementById("dati-fiscali-error").style.display = "none";
		DATI_FISCALI_FIELDS.forEach((f) => {
			document.getElementById("df-" + f).value = datiFiscali?.[f] || "";
		});
		openModal("modal-dati-fiscali");
	}
	async function saveDatiFiscali() {
		const errBox = document.getElementById("dati-fiscali-error");
		errBox.style.display = "none";
		const payload = {};
		DATI_FISCALI_FIELDS.forEach((f) => {
			payload[f] = document.getElementById("df-" + f).value.trim() || null;
		});
		try {
			if (DEMO_MODE) {
				demoState.datiFiscali = {
					...demoState.datiFiscali,
					...payload
				};
				datiFiscali = demoState.datiFiscali;
			} else if (datiFiscali?.id) {
				const { error } = await sb.from("scuderia_dati_fiscali").update(payload).eq("id", datiFiscali.id);
				if (error) throw error;
				await loadDatiFiscali();
			} else {
				const { error } = await sb.from("scuderia_dati_fiscali").insert({
					centro_id: currentCentro.id,
					...payload
				});
				if (error) throw error;
				await loadDatiFiscali();
			}
			renderDatiFiscali();
			closeModal("modal-dati-fiscali");
			showToast("Dati aggiornati.");
		} catch (err) {
			errBox.textContent = err.message || "Errore nel salvataggio.";
			errBox.style.display = "block";
		}
	}
	function copyDatiFiscali() {
		if (!datiFiscali) {
			showToast("Nessun dato da copiare.");
			return;
		}
		const lines = DATI_FISCALI_FIELDS.filter((f) => datiFiscali[f]).map((f) => `${DATI_FISCALI_LABELS[f]}: ${datiFiscali[f]}`);
		if (lines.length === 0) {
			showToast("Nessun dato da copiare.");
			return;
		}
		navigator.clipboard?.writeText(lines.join("\n")).then(() => showToast("Dati copiati negli appunti!"));
	}
	// equo-scuderia-src/src/sezioni/centro/moduli/013-hard-reset-solo-admin-con-codice-usa-e-g.js
	var RESET_LABELS = {
		cavalli: "Cavalli (e storico sanitario)",
		eventi: "Eventi sanitari",
		lezioni: "Lezioni",
		pacchetti: "Pacchetti/abbonamenti",
		messaggi: "Messaggi",
		note: "Post-it",
		totale: "TUTTO (reset totale)"
	};
	var RESET_DEMO_TABLES = {
		cavalli: ["scuderia_eventi_sanitari", "scuderia_cavalli"],
		eventi: ["scuderia_eventi_sanitari"],
		lezioni: ["scuderia_lezioni"],
		pacchetti: ["scuderia_pacchetti"],
		messaggi: ["scuderia_messaggi"],
		note: ["scuderia_note"],
		totale: [
			"scuderia_note",
			"scuderia_messaggi",
			"scuderia_pacchetti",
			"scuderia_lezioni",
			"scuderia_eventi_sanitari",
			"scuderia_cavalli",
			"scuderia_contatti",
			"scuderia_dati_fiscali"
		]
	};
	var pendingHardReset = null;
	function refreshHardResetCard() {
		const isAdminUser = currentMembro?.ruolo === "admin";
		const card = document.getElementById("card-hard-reset");
		if (card) card.style.display = isAdminUser ? "block" : "none";
		chiudiHardReset();
	}
	function chiudiHardReset() {
		const body = document.getElementById("hard-reset-body");
		if (body) body.style.display = "none";
		const btn = document.getElementById("hard-reset-toggle");
		if (btn) btn.textContent = "Apri";
		const lock = document.getElementById("hard-reset-lock");
		if (lock) lock.className = "fa-solid fa-lock";
	}
	function toggleHardReset() {
		const body = document.getElementById("hard-reset-body");
		if (body.style.display === "none") {
			body.style.display = "block";
			document.getElementById("hard-reset-toggle").textContent = "Chiudi";
			document.getElementById("hard-reset-lock").className = "fa-solid fa-lock-open";
		} else chiudiHardReset();
	}
	function richiediCodiceReset() {
		const tipo = document.getElementById("reset-modulo-select").value;
		const oggetto = `Richiesta codice Hard Reset — ${currentCentro?.nome || "centro"}`;
		const corpo = `Ciao Equo,\n\nchiedo un codice usa e getta per l'Hard Reset.\n\nCentro: ${currentCentro?.nome || "—"}\nID centro: ${currentCentro?.id || "—"}\nCosa cancellare: ${RESET_LABELS[tipo]}\nRichiesto da: ${currentUser?.email || "—"}\n\n(Per Equo) Comando da eseguire su Supabase:\nselect genera_codice_reset('${currentCentro?.id || ""}', '${tipo}');\n`;
		window.location.href = `mailto:gestione.equo@gmail.com?subject=${encodeURIComponent(oggetto)}&body=${encodeURIComponent(corpo)}`;
		showToast("Si apre la tua email: invia la richiesta a Equo.");
	}
	function askHardReset() {
		const tipo = document.getElementById("reset-modulo-select").value;
		pendingHardReset = { tipo };
		document.getElementById("hard-reset-code-input").value = "";
		document.getElementById("hard-reset-error").style.display = "none";
		document.getElementById("hard-reset-desc").innerHTML = (tipo === "totale" ? "Stai per cancellare definitivamente <strong>TUTTI</strong> i dati operativi del centro (cavalli, eventi sanitari, lezioni, pacchetti, messaggi, post-it, contatti, dati societari). Centro e team resteranno." : `Stai per cancellare definitivamente tutti i dati di: <strong>${escapeHtml(RESET_LABELS[tipo])}</strong>. Operazione irreversibile.`) + (DEMO_MODE ? "<br><em>Demo: usa il codice 123456.</em>" : "");
		openModal("modal-hard-reset");
		setTimeout(() => document.getElementById("hard-reset-code-input").focus(), 50);
	}
	async function confirmHardReset() {
		if (!pendingHardReset) return;
		const codice = document.getElementById("hard-reset-code-input").value.replace(/\D/g, "");
		const errBox = document.getElementById("hard-reset-error");
		const btn = document.getElementById("hard-reset-confirm-btn");
		errBox.style.display = "none";
		if (codice.length !== 6) {
			errBox.textContent = "Inserisci il codice di 6 cifre ricevuto da Equo.";
			errBox.style.display = "block";
			return;
		}
		btn.disabled = true;
		try {
			if (DEMO_MODE) {
				if (codice !== "123456") throw new Error("Codice errato.");
				hardResetDemo(RESET_DEMO_TABLES[pendingHardReset.tipo]);
			} else {
				const { data, error } = await sb.rpc("esegui_hard_reset", {
					p_centro_id: currentCentro.id,
					p_tipo: pendingHardReset.tipo,
					p_codice: codice
				});
				if (error) throw error;
				if (!data?.ok) throw new Error(data?.errore || "Reset non eseguito.");
			}
			closeModal("modal-hard-reset");
			chiudiHardReset();
			showToast("Reset eseguito.");
			pendingHardReset = null;
			await refreshHomeModule();
			await refreshContattiModule();
			await refreshCavalliModule();
			await refreshLezioniModule();
			await refreshPacchettiModule();
			await refreshComunicazioniModule();
		} catch (err) {
			errBox.textContent = err.message || "Errore durante il reset.";
			errBox.style.display = "block";
		} finally {
			btn.disabled = false;
		}
	}
	function hardResetDemo(tables) {
		const stateKeyMap = {
			scuderia_cavalli: "cavalli",
			scuderia_eventi_sanitari: "eventi",
			scuderia_lezioni: "lezioni",
			scuderia_pacchetti: "pacchetti",
			scuderia_messaggi: "messaggi",
			scuderia_note: "note",
			scuderia_contatti: "contatti"
		};
		tables.forEach((t) => {
			if (t === "scuderia_dati_fiscali") {
				demoState.datiFiscali = null;
				datiFiscali = null;
				return;
			}
			const key = stateKeyMap[t];
			if (key) demoState[key] = [];
		});
	}
	// equo-scuderia-src/src/sezioni/centro/moduli/011-contatti-utili.js
	async function refreshContattiModule() {
		await loadContatti();
		renderContatti();
		await refreshDatiFiscaliCard();
		refreshHardResetCard();
	}
	async function loadContatti() {
		if (DEMO_MODE) {
			contattiList = demoState.contatti;
			return;
		}
		const { data, error } = await sb.from("scuderia_contatti").select("id, centro_id, tipo, tipo_altro, nome, telefono, email, note").eq("centro_id", currentCentro.id).order("nome", { ascending: true });
		if (!error) contattiList = data || [];
	}
	function contattoRuoloLabel(c) {
		return c.tipo === "altro" ? c.tipo_altro || "Altro" : CONTATTO_TIPO_LABELS[c.tipo] || c.tipo;
	}
	function renderContatti() {
		document.getElementById("contatti-count").textContent = contattiList.length;
		const body = document.getElementById("contatti-table-body");
		const empty = document.getElementById("contatti-empty");
		body.innerHTML = "";
		empty.style.display = contattiList.length === 0 ? "block" : "none";
		const isAdminUser = currentMembro?.ruolo === "admin";
		const canEditContatti = isAdminUser || memberCanUI("contatti");
		contattiList.forEach((c) => {
			const tr = document.createElement("tr");
			tr.innerHTML = `
      <td>${escapeHtml(c.nome)}</td>
      <td><span class="badge-pill badge-gray">${escapeHtml(contattoRuoloLabel(c))}</span></td>
      <td>${c.telefono ? escapeHtml(c.telefono) : "—"}</td>
      <td>${c.email ? escapeHtml(c.email) : "—"}</td>
      <td style="text-align:right;white-space:nowrap">
        ${canEditContatti ? `
          <button class="btn btn-ghost btn-sm" onclick="openContattoForm('${c.id}')"><i class="fa-solid fa-pen"></i></button>
          ${isAdminUser ? `<button class="btn btn-ghost btn-sm" onclick="askDeleteContatto('${c.id}')"><i class="fa-solid fa-trash"></i></button>` : ""}
        ` : ""}
      </td>`;
			body.appendChild(tr);
		});
	}
	function toggleContattoAltro() {
		const tipo = document.getElementById("cont-tipo").value;
		document.getElementById("cont-tipo-altro-field").style.display = tipo === "altro" ? "block" : "none";
	}
	function openContattoForm(id) {
		editingContattoId = id || null;
		document.getElementById("contatto-error").style.display = "none";
		document.getElementById("modal-contatto-title").textContent = editingContattoId ? "Modifica contatto" : "Nuovo contatto";
		if (editingContattoId) {
			const c = contattiList.find((x) => x.id === editingContattoId);
			document.getElementById("cont-tipo").value = c?.tipo || "altro";
			document.getElementById("cont-tipo-altro").value = c?.tipo_altro || "";
			document.getElementById("cont-nome").value = c?.nome || "";
			document.getElementById("cont-telefono").value = c?.telefono || "";
			document.getElementById("cont-email").value = c?.email || "";
			document.getElementById("cont-note").value = c?.note || "";
		} else {
			document.getElementById("cont-tipo").value = "istruttore_esterno";
			[
				"cont-tipo-altro",
				"cont-nome",
				"cont-telefono",
				"cont-email",
				"cont-note"
			].forEach((id) => document.getElementById(id).value = "");
		}
		toggleContattoAltro();
		openModal("modal-contatto");
	}
	async function saveContatto() {
		const tipo = document.getElementById("cont-tipo").value;
		const nome = document.getElementById("cont-nome").value.trim();
		const errBox = document.getElementById("contatto-error");
		errBox.style.display = "none";
		if (!nome) {
			errBox.textContent = "Inserisci il nome del contatto.";
			errBox.style.display = "block";
			return;
		}
		const payload = {
			tipo,
			tipo_altro: tipo === "altro" ? document.getElementById("cont-tipo-altro").value.trim() || null : null,
			nome,
			telefono: document.getElementById("cont-telefono").value.trim() || null,
			email: document.getElementById("cont-email").value.trim() || null,
			note: document.getElementById("cont-note").value.trim() || null
		};
		try {
			if (DEMO_MODE) {
				if (editingContattoId) {
					const idx = demoState.contatti.findIndex((c) => c.id === editingContattoId);
					if (idx >= 0) demoState.contatti[idx] = {
						...demoState.contatti[idx],
						...payload
					};
				} else demoState.contatti.push({
					id: "ct" + (demoIdCounter++ + 600),
					centro_id: demoState.centro.id,
					...payload
				});
			} else if (editingContattoId) {
				const { error } = await sb.from("scuderia_contatti").update(payload).eq("id", editingContattoId);
				if (error) throw error;
			} else {
				const { error } = await sb.from("scuderia_contatti").insert({
					centro_id: currentCentro.id,
					...payload
				});
				if (error) throw error;
			}
			await loadContatti();
			renderContatti();
			closeModal("modal-contatto");
			showToast(editingContattoId ? "Contatto aggiornato." : "Contatto aggiunto.");
		} catch (err) {
			errBox.textContent = err.message || "Errore nel salvataggio.";
			errBox.style.display = "block";
		}
	}
	function askDeleteContatto(id) {
		contattoToDelete = id;
		openModal("modal-delete-contatto");
	}
	async function confirmDeleteContatto() {
		if (!contattoToDelete) return;
		if (DEMO_MODE) demoState.contatti = demoState.contatti.filter((c) => c.id !== contattoToDelete);
		else {
			const { error } = await sb.from("scuderia_contatti").delete().eq("id", contattoToDelete);
			if (error) {
				showToast("Errore nell'eliminazione.");
				closeModal("modal-delete-contatto");
				return;
			}
		}
		await loadContatti();
		renderContatti();
		closeModal("modal-delete-contatto");
		showToast("Contatto eliminato.");
	}
	function copyJoinCode() {
		const code = currentCentro?.join_code || "";
		navigator.clipboard?.writeText(code).then(() => showToast("Codice copiato!"));
	}
	// equo-scuderia-src/src/sezioni/centro/moduli/055-zona-del-centro-serve-al-radar-di-merlin.js
	function renderZonaCentro() {
		const el = document.getElementById("centro-view-zona");
		if (!el) return;
		el.textContent = [
			currentCentro?.citta,
			currentCentro?.provincia ? `(${currentCentro.provincia})` : "",
			currentCentro?.regione
		].filter(Boolean).join(" ") || "Non impostata";
		const btn = document.getElementById("btn-modifica-centro");
		if (btn) btn.style.display = currentMembro?.ruolo === "admin" || currentMembro?.livello === "admin" ? "" : "none";
	}
	function apriModificaCentro() {
		[
			"nome",
			"indirizzo",
			"telefono",
			"citta",
			"provincia",
			"regione"
		].forEach((k) => document.getElementById("cz-" + k).value = currentCentro?.[k] || "");
		document.getElementById("cz-error").style.display = "none";
		openModal("modal-centro-dati");
	}
	async function salvaDatiCentro() {
		const v = (k) => document.getElementById("cz-" + k).value.trim();
		const err = document.getElementById("cz-error");
		const payload = {
			nome: v("nome"),
			indirizzo: v("indirizzo") || null,
			telefono: v("telefono") || null,
			citta: v("citta") || null,
			provincia: v("provincia").toUpperCase() || null,
			regione: v("regione") || null
		};
		if (!payload.nome) {
			err.textContent = "Il nome del centro è obbligatorio.";
			err.style.display = "block";
			return;
		}
		if (!DEMO_MODE) {
			const { error } = await sb.from("centri").update(payload).eq("id", currentCentro.id);
			if (error) {
				err.textContent = error.message || "Salvataggio non riuscito.";
				err.style.display = "block";
				return;
			}
		}
		Object.assign(currentCentro, payload);
		try {
			meteoScud(true);
		} catch (e) {}
		document.getElementById("centro-view-nome").textContent = payload.nome;
		document.getElementById("centro-view-indirizzo").textContent = payload.indirizzo || "Non impostato";
		document.getElementById("centro-view-telefono").textContent = payload.telefono || "Non impostato";
		document.getElementById("sidebar-centro-name").textContent = payload.nome;
		document.getElementById("home-centro-name").textContent = payload.nome;
		renderZonaCentro();
		closeModal("modal-centro-dati");
		showToast("Dati del centro aggiornati.");
	}
	var GIORNI_BREVI = [
		"Lun",
		"Mar",
		"Mer",
		"Gio",
		"Ven",
		"Sab",
		"Dom"
	];
	async function refreshStatisticheModule() {
		const body = document.getElementById("st-body");
		if (!statDati) body.innerHTML = `<div class="card st-vuoto" style="text-align:center;padding:40px"><i class="fa-solid fa-spinner fa-spin"></i> Merlino sta leggendo i numeri del centro…</div>`;
		if (DEMO_MODE) statDati = statisticheDemo();
		else {
			const { data, error } = await sb.rpc("statistiche_centro", { p_centro_id: currentCentro.id });
			if (error) {
				body.innerHTML = `<div class="card st-vuoto">Non riesco a caricare le statistiche: ${escapeHtml(error.message || "")}</div>`;
				return;
			}
			statDati = data;
		}
		if (statDati?.bloccato) {
			body.innerHTML = "";
			apriUpsell("statistiche");
			return;
		}
		renderStatistiche(statDati);
	}
	function stBloccata(html, titolo) {
		return `<div class="card st-card st-bloccata"><div class="st-dentro">${html}</div>
    <div class="st-velo"><span class="pk-badge pk-premium"><i class="fa-solid fa-lock"></i> PREMIUM</span>
    <b style="font-size:14.5px">${escapeHtml(titolo)}</b>
    <button class="btn btn-outline btn-sm" onclick="apriUpsell('statistiche_complete')">Scopri cosa include</button></div></div>`;
	}
	function stSemplici(s) {
		const mesi = (s.incassi_mesi || []).slice(-6);
		const tutti = s.incassi_mesi || [];
		const cur = tutti[tutti.length - 1] || { incasso: 0 }, prev = tutti[tutti.length - 2] || { incasso: 0 };
		const d = Number(prev.incasso) ? Math.round((Number(cur.incasso) - Number(prev.incasso)) / Number(prev.incasso) * 100) : null;
		const rischio = s.clienti_a_rischio || [], carnet = s.carnet_in_esaurimento || [];
		const num = (l, v, sub, cls, tip) => `<div class="card ss-num" data-tip="${tip}"><div class="l">${l}</div><div class="v">${v}</div>${sub ? `<div class="d ${cls || ""}">${sub}</div>` : ""}</div>`;
		const cose = [];
		(cavalliList || []).filter((c) => pallinoCavallo(c.id).col === "rosso").slice(0, 2).forEach((c) => cose.push({
			ic: "fa-heart-pulse",
			col: "#c0473d",
			t: `${c.nome}: ${pallinoCavallo(c.id).testo}`,
			b: "Apri",
			f: `showModule('cavalli');openCavalloDetail('${c.id}')`
		}));
		rischio.slice(0, 2).forEach((c, i) => cose.push({
			ic: "fa-user-clock",
			col: "#d9a13b",
			t: `${c.nome} non monta da ${c.giorni} giorni`,
			b: "Scrivi",
			f: `stScriviCliente(${i})`
		}));
		carnet.slice(0, 2).forEach((p) => cose.push({
			ic: "fa-ticket",
			col: "#3d7fc4",
			t: p.tipo === "carnet" && p.unita_totali ? `Carnet di ${p.cliente}: ${p.unita_totali - (p.unita_usate || 0)} lezioni rimaste` : `${p.cliente}: ${p.tipo} in scadenza`,
			b: "Rinnova",
			f: `showModule('pacchetti')`
		}));
		const max = Math.max(1, ...mesi.map((m) => Number(m.incasso || 0)));
		return `<div class="ss-nums">
      ${num("Incassato questo mese", euro(cur.incasso), d == null ? "" : `${d >= 0 ? "▲" : "▼"} ${Math.abs(d)}% sul mese scorso`, d == null ? "" : d >= 0 ? "su" : "giu", "Carnet, abbonamenti e pensioni iniziati questo mese")}
      ${num("Lezioni questa settimana", s.lezioni_settimana ?? 0, `${s.lezioni_prossime_7 ?? 0} in programma`, "", "Lezioni degli ultimi 7 giorni e dei prossimi 7")}
      ${num("Box occupati", s.box && s.box.totale ? `${s.box.occupati} su ${s.box.totale}` : "—", s.box && s.box.liberi ? `${s.box.liberi} liberi` : "", "", "Box con un cavallo dentro")}
      ${num("Clienti da ricontattare", rischio.length, rischio.length ? "non montano da 3 settimane" : "nessuno: ottimo!", rischio.length ? "giu" : "su", "Non montano da almeno 3 settimane e non hanno lezioni in programma")}
    </div>
    <div class="ss-grid">
      <div class="card st-card"><h3><i class="fa-solid fa-list-check" style="color:var(--primary)"></i> Le cose da fare oggi</h3>
        ${cose.length ? cose.slice(0, 3).map((c) => `<div class="st-riga"><div class="t" style="display:flex;gap:10px;align-items:center"><i class="fa-solid ${c.ic}" style="color:${c.col};width:18px"></i><b style="font-weight:600">${escapeHtml(c.t)}</b></div>
          <button class="btn btn-outline btn-sm" onclick="${c.f}">${c.b}</button></div>`).join("") : `<div class="st-vuoto">Niente di urgente oggi. 👏</div>`}</div>
      <div class="card st-card"><h3><i class="fa-solid fa-chart-column" style="color:var(--primary)"></i> Incassi, ultimi 6 mesi</h3>
        <div class="ss-bars">${mesi.map((m, i) => {
			const [a, mm] = m.mese.split("-"), h = Math.round(Number(m.incasso || 0) / max * 100);
			return `<div class="b ${i === mesi.length - 1 ? "ora" : ""}" data-tip="${MESI_BREVI[+mm - 1]} ${a}: ${euro(m.incasso)}"><small>${Number(m.incasso) >= 1e3 ? (Number(m.incasso) / 1e3).toFixed(1) + "k" : Math.round(Number(m.incasso || 0))}</small><i style="height:${Math.max(2, h)}%"></i><span>${MESI_BREVI[+mm - 1]}</span></div>`;
		}).join("")}</div></div>
    </div>`;
	}
	function renderStatistiche(s) {
		const body = document.getElementById("st-body");
		vistaSincronizza("statistiche");
		const pdf = document.getElementById("st-btn-pdf");
		if (vistaSemplice("statistiche")) {
			if (pdf) pdf.style.display = "none";
			body.innerHTML = stSemplici(s);
			return;
		}
		if (pdf) pdf.style.display = "";
		const mesi = s.incassi_mesi || [];
		const cur = mesi[mesi.length - 1] || {
			incasso: 0,
			lezioni: 0
		}, prev = mesi[mesi.length - 2] || {
			incasso: 0,
			lezioni: 0
		};
		const delta = (a, b) => b ? Math.round((a - b) / b * 100) : null;
		const dInc = delta(Number(cur.incasso), Number(prev.incasso));
		const anno = mesi.reduce((t, m) => t + Number(m.incasso || 0), 0);
		const rischio = s.clienti_a_rischio || [], carnet = s.carnet_in_esaurimento || [];
		const completo = !!s.completo;
		let hero = "";
		if (completo && s.salute) {
			const idx = s.salute.indice, col = idx >= 75 ? "#3f7a45" : idx >= 50 ? "#d9a13b" : "#c0473d";
			const C = 2 * Math.PI * 70, comp = s.salute.componenti || {};
			hero = `<div class="card st-salute">
      <div class="st-ring"><svg viewBox="0 0 160 160"><circle cx="80" cy="80" r="70" fill="none" stroke="var(--muted-bg)" stroke-width="13"/>
        <circle cx="80" cy="80" r="70" fill="none" stroke="${col}" stroke-width="13" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - idx / 100)}" style="transition:stroke-dashoffset 1s ease"/></svg>
        <div class="num"><b style="color:${col}">${idx}</b><span>Indice di salute</span></div></div>
      <div class="st-comp">${Object.entries({
				incassi: "Incassi",
				occupazione: "Occupazione",
				fedelta: "Fedeltà clienti",
				sanitario: "Salute in regola",
				magazzino: "Magazzino"
			}).map(([k, n]) => {
				const v = Math.max(0, Math.min(100, comp[k] ?? 0));
				return `<div class="r"><span>${n}</span><div class="pk-barra"><i class="${v < 50 ? "full" : v < 75 ? "warn" : ""}" style="width:${v}%"></i></div><b>${v}</b></div>`;
			}).join("")}</div>
    </div>`;
		} else hero = stBloccata(`<div class="st-salute" style="padding:20px"><div class="st-ring"><div class="num"><b>78</b><span>Indice di salute</span></div></div></div>`, "Indice di salute del centro 0-100");
		const KPI_TIP = {
			"Incassi del mese": "Somma dei pacchetti (carnet, abbonamenti, pensioni) iniziati questo mese",
			"Ultimi 12 mesi": "Incassi dei pacchetti degli ultimi 12 mesi",
			"Lezioni ultimi 7 gg": "Lezioni non annullate degli ultimi 7 giorni",
			"Clienti attivi": "Allievi con almeno una lezione negli ultimi 30 giorni",
			"Clienti a rischio": "Non montano da almeno 3 settimane e non hanno lezioni in programma",
			"Rinnovi attesi 90 gg": "Valore dei pacchetti in scadenza nei prossimi 90 giorni × il vostro tasso di rinnovo",
			"Box liberi": "Box senza cavallo e non in manutenzione: la stima usa la vostra pensione media"
		};
		const kpi = (l, v, d, cls) => `<div class="card st-kpi" data-tip="${KPI_TIP[l] || ""}"><div class="l">${l}</div><div class="v">${v}</div>${d ? `<div class="d ${cls || ""}">${d}</div>` : ""}</div>`;
		const kpis = `<div class="st-kpis">
    ${kpi("Incassi del mese", euro(cur.incasso), dInc == null ? "primo mese con dati" : `${dInc >= 0 ? "▲" : "▼"} ${Math.abs(dInc)}% sul mese scorso`, dInc == null ? "" : dInc >= 0 ? "su" : "giu")}
    ${kpi("Ultimi 12 mesi", euro(anno), "da pacchetti e pensioni")}
    ${kpi("Lezioni ultimi 7 gg", s.lezioni_settimana ?? 0, `${s.lezioni_prossime_7 ?? 0} in programma nei prossimi 7`)}
    ${kpi("Clienti attivi", s.clienti_attivi ?? 0, "con lezioni negli ultimi 30 gg")}
    ${kpi("Clienti a rischio", rischio.length, rischio.length ? "da ricontattare" : "nessuno: ottimo!", rischio.length ? "giu" : "su")}
    ${s.box && s.box.totale ? kpi("Box liberi", `${s.box.liberi} su ${s.box.totale}`, s.box.liberi && s.box.pensione_media ? `≈ ${euro(s.box.liberi * s.box.pensione_media)}/mese di pensioni possibili` : `${s.box.occupati} occupati · ${s.box.manutenzione} in manutenzione`) : ""}
    ${completo && s.previsione_90 ? kpi("Rinnovi attesi 90 gg", euro(s.previsione_90.rinnovi_attesi), `tasso di rinnovo ${Math.round((s.tasso_rinnovo || 0) * 100)}%`) : ""}
  </div>`;
		const maxInc = Math.max(1, ...mesi.map((m) => Number(m.incasso || 0)));
		const barre = `<div class="card st-card"><h3><i class="fa-solid fa-chart-column" style="color:var(--primary)"></i> Incassi e lezioni, ultimi 12 mesi</h3>
    <p class="sub">Incassi dai pacchetti (carnet, abbonamenti, pensioni) per mese di inizio; sotto, le lezioni svolte.</p>
    <div class="st-bars">${mesi.map((m, i) => {
			const h = Math.round(Number(m.incasso || 0) / maxInc * 100);
			const [a, mm] = m.mese.split("-");
			return `<div class="b" title="${MESI_BREVI[+mm - 1]} ${a}: ${euro(m.incasso)} · ${m.lezioni} lezioni">${Number(m.incasso) ? `<small>${Number(m.incasso) >= 1e3 ? (Number(m.incasso) / 1e3).toFixed(1) + "k" : Math.round(m.incasso)}</small>` : ""}<i class="${i === mesi.length - 1 ? "ora" : ""}" style="height:${Math.max(2, h)}%"></i><em>${MESI_BREVI[+mm - 1]}</em><em>${m.lezioni}</em></div>`;
		}).join("")}</div></div>`;
		const listaRischio = `<div class="card st-card"><h3><i class="fa-solid fa-user-clock" style="color:#c0473d"></i> Clienti a rischio</h3>
    <p class="sub">Non montano da almeno 3 settimane e non hanno lezioni in programma.</p>
    ${rischio.length ? `<div class="st-lista">${rischio.slice(0, 8).map((c, i) => `<div class="st-riga"><div class="t"><b>${escapeHtml(c.nome)}</b><span>ultima lezione ${c.giorni} giorni fa · ${c.lezioni_totali} lezioni in tutto</span></div>
      <button class="btn btn-outline btn-sm" onclick="stScriviCliente(${i})"><i class="fa-solid fa-paper-plane"></i> Scrivi</button></div>`).join("")}</div>` : `<div class="st-vuoto">Nessun cliente a rischio in questo momento. 👏</div>`}</div>`;
		const listaCarnet = `<div class="card st-card"><h3><i class="fa-solid fa-ticket" style="color:#d9a13b"></i> Carnet e pacchetti da rinnovare</h3>
    <p class="sub">Carnet con 2 lezioni o meno, o pacchetti che scadono entro 3 settimane.</p>
    ${carnet.length ? `<div class="st-lista">${carnet.slice(0, 8).map((p) => `<div class="st-riga"><div class="t"><b>${escapeHtml(p.cliente)}</b><span>${p.tipo === "carnet" && p.unita_totali ? `${p.unita_totali - (p.unita_usate || 0)} lezioni rimaste` : p.tipo}${p.data_scadenza ? " · scade il " + formatDate(p.data_scadenza) : ""}${p.prezzo ? " · " + euro(p.prezzo) : ""}</span></div>
      <button class="btn btn-outline btn-sm" onclick="showModule('pacchetti')">Rinnova</button></div>`).join("")}</div>` : `<div class="st-vuoto">Niente da rinnovare a breve.</div>`}</div>`;
		let premium = "";
		if (completo) premium = `<div class="st-grid2">${stMargini(s)}${stCarico(s)}</div><div class="st-grid2">${stOccupazione(s)}${stSimulatore(s)}</div>
      <div class="st-grid2">${stConfronto(s)}${stRadar(s)}</div>`;
		else premium = `<div class="st-grid2">${stBloccata(`<h3>Margine per cavallo</h3><table class="st-tab"><tr><td>Ares</td><td>€ 350</td><td>€ 312</td><td>+€ 38</td></tr><tr><td>Luna</td><td>€ 380</td><td>€ 290</td><td>+€ 90</td></tr></table>`, "Margine per cavallo in pensione")}
      ${stBloccata(`<h3>Radar di Merlino</h3><p>Il Centro X lancia un campo estivo a € 180/settimana… Mosse consigliate: 1. …</p>`, "Radar della concorrenza della tua zona")}</div>
      <div class="st-grid2">${stBloccata(`<h3>Mappa di occupazione</h3><div style="height:120px"></div>`, "Mappa di occupazione e simulatore")}
      ${stBloccata(`<h3>Benessere cavalli</h3><div style="height:120px"></div>`, "Carico di lavoro e benessere dei cavalli")}</div>`;
		body.innerHTML = `<div class="st-hero">${hero}<div>${kpis}${barre}</div></div>
    <div class="st-grid2">${listaRischio}${listaCarnet}</div>${premium}
    <p class="st-nota"><i class="fa-solid fa-circle-info"></i> Aggiornato ${new Date(s.generato_il || Date.now()).toLocaleString("it-IT", {
			day: "numeric",
			month: "long",
			hour: "2-digit",
			minute: "2-digit"
		})}. I numeri sono calcolati dai dati del gestionale: più sono completi (prezzi dei pacchetti, pensioni collegate al cavallo, scarichi di magazzino per cavallo), più le analisi sono precise.</p>`;
		if (radarAttesa) stMostraAttesaRadar();
		if (document.getElementById("sim-ris")) stCalcolaSim();
	}
	function stMargini(s) {
		const righe = (s.margine_cavalli || []).map((c) => ({
			...c,
			costo: Number(c.costo_mese || 0) + Number(s.costo_comune_per_cavallo || 0)
		})).filter((c) => c.ricavo_mese != null || c.costo > 0);
		const tab = righe.length ? `<div class="table-wrap"><table class="st-tab"><thead><tr><th>Cavallo</th><th>Entrate</th><th>Costi</th><th>Margine</th></tr></thead><tbody>
    ${righe.map((c) => {
			const m = c.ricavo_mese != null ? Number(c.ricavo_mese) - c.costo : null;
			return `<tr><td>${escapeHtml(c.nome)}</td><td>${c.ricavo_mese != null ? euro(c.ricavo_mese) : "—"}</td><td>${euro(c.costo)}</td><td class="${m == null ? "" : m >= 0 ? "st-pos" : "st-neg"}">${m == null ? "—" : (m >= 0 ? "+" : "−") + euro(Math.abs(m)).replace("€ ", "€ ")}</td></tr>`;
		}).join("")}
    </tbody></table></div>` : `<div class="st-vuoto">Per calcolarlo servono le pensioni collegate al cavallo (Pacchetti → campo "Cavallo") e gli scarichi di Magazzino con il cavallo indicato.</div>`;
		return `<div class="card st-card"><h3><i class="fa-solid fa-scale-balanced" style="color:var(--primary)"></i> Margine per cavallo</h3>
    <p class="sub">Ultimi 30 giorni: pensione incassata meno i costi di magazzino del cavallo${Number(s.costo_comune_per_cavallo) ? ` e la sua quota dei consumi comuni (${euro(s.costo_comune_per_cavallo, true)})` : ""}.</p>${tab}</div>`;
	}
	function stCarico(s) {
		const oggi = /* @__PURE__ */ new Date();
		const righe = (s.carico_cavalli || []).map((c) => {
			const giorniFermo = c.ultima_lezione ? Math.round((oggi - new Date(c.ultima_lezione)) / 864e5) : null;
			let flag = "", cls = "verde";
			if (c.lezioni_7 >= 10 || (c.max_giorno || 0) >= 3) {
				flag = "Sovraccarico";
				cls = "rosso";
			} else if (c.lezioni_7 >= 7) {
				flag = "Carico alto";
				cls = "giallo";
			} else if (c.tipo_proprieta === "proprieta" && (giorniFermo == null || giorniFermo > 14)) {
				flag = giorniFermo == null ? "Mai in lezione" : `Fermo da ${giorniFermo} gg`;
				cls = "giallo";
			} else flag = "OK";
			return {
				...c,
				flag,
				cls
			};
		});
		const max = Math.max(1, ...righe.map((r) => r.lezioni_7));
		return `<div class="card st-card"><h3><i class="fa-solid fa-heart-pulse" style="color:#c0473d"></i> Benessere e carico dei cavalli</h3>
    <p class="sub">Lezioni negli ultimi 7 giorni: chi lavora troppo e chi è fermo da troppo tempo.</p>
    ${righe.length ? `<div class="st-lista">${righe.slice(0, 10).map((r) => `<div class="st-riga"><div class="t"><b>${escapeHtml(r.nome)}</b>
      <div class="pk-barra" style="margin-top:6px"><i class="${r.cls === "rosso" ? "full" : r.cls === "giallo" ? "warn" : ""}" style="width:${Math.round(r.lezioni_7 / max * 100)}%"></i></div>
      <span>${r.lezioni_7} lezioni in 7 gg · ${r.lezioni_28} in 4 settimane</span></div><span class="st-flag ${r.cls}">${r.flag}</span></div>`).join("")}</div>` : `<div class="st-vuoto">Nessun cavallo registrato.</div>`}</div>`;
	}
	function stOccupazione(s) {
		const ore = Array.from({ length: 13 }, (_, i) => i + 8);
		const m = {};
		let max = 1;
		(s.occupazione || []).forEach((o) => {
			m[o.giorno + "-" + o.ora] = o.n;
			max = Math.max(max, o.n);
		});
		let buco = null;
		for (const g of [
			2,
			3,
			4,
			1,
			5
		]) for (const h of [
			15,
			16,
			17
		]) if (!m[g + "-" + h] && !buco) buco = {
			g,
			h
		};
		const cella = (g, h) => {
			const n = m[g + "-" + h] || 0;
			const a = n ? .18 + .82 * n / max : 0;
			return `<div class="c" title="${GIORNI_BREVI[g - 1]} ${h}:00 · ${n} lezioni in 8 settimane" style="${n ? `background:color-mix(in srgb,var(--primary) ${Math.round(a * 100)}%,transparent)` : ""}"></div>`;
		};
		return `<div class="card st-card"><h3><i class="fa-solid fa-table-cells" style="color:var(--primary)"></i> Mappa di occupazione</h3>
    <p class="sub">Lezioni per giorno e ora nelle ultime 8 settimane: i quadrati chiari sono ore vuote da riempire.</p>
    <div class="st-heat"><div></div>${ore.map((h) => `<div class="h">${h}</div>`).join("")}
      ${GIORNI_BREVI.map((g, i) => `<div style="align-self:center">${g}</div>${ore.map((h) => cella(i + 1, h)).join("")}`).join("")}</div>
    ${buco ? `<div class="st-sim-ris" style="margin-top:12px;font-size:13px"><b>💡 Idea di Merlino:</b> ${GIORNI_BREVI[buco.g - 1].toLowerCase()} dalle ${buco.h} alle ${buco.h + 1} è sempre vuoto: prova una lezione di gruppo a prezzo speciale o un'ora "porte aperte" per nuovi allievi.</div>` : ""}</div>`;
	}
	function stSimulatore(s) {
		const pm = s.prezzi_medi || {};
		return `<div class="card st-card"><h3><i class="fa-solid fa-flask" style="color:#6b4fa0"></i> Simulatore "e se…"</h3>
    <p class="sub">Prova una decisione e guarda l'effetto sugli incassi di un anno (stima sui tuoi dati reali).</p>
    <div class="st-sim">
      <div class="field"><label>Prezzo lezione (± €)</label><input class="input" id="sim-prezzo" type="number" step="1" value="2" oninput="stCalcolaSim()"></div>
      <div class="field"><label>Clienti persi</label><input class="input" id="sim-persi" type="number" min="0" step="1" value="0" oninput="stCalcolaSim()"></div>
      <div class="field"><label>Box/pensioni in più</label><input class="input" id="sim-box" type="number" min="0" step="1" value="0" oninput="stCalcolaSim()"></div>
    </div>
    <div class="field"><label>Pensione mensile (€)</label><input class="input" id="sim-pensione" type="number" min="0" step="10" value="${Math.round(pm.pensione_mese || 350)}" oninput="stCalcolaSim()"></div>
    <div class="st-sim-ris" id="sim-ris"></div></div>`;
	}
	function stCalcolaSim() {
		const s = statDati;
		if (!s) return;
		const n = (id) => Number(document.getElementById(id)?.value || 0);
		const lezAnno = (s.incassi_mesi || []).reduce((t, m) => t + Number(m.lezioni || 0), 0) || (s.lezioni_settimana || 0) * 52;
		const prezzo = Number(s.prezzi_medi?.lezione_da_carnet || 30);
		const clienti = Math.max(1, Number(s.clienti_attivi || 1));
		const lezCliente = lezAnno / clienti;
		const dPrezzo = n("sim-prezzo"), persi = Math.min(n("sim-persi"), clienti), box = n("sim-box"), pens = n("sim-pensione");
		const perse = persi * lezCliente;
		const effetto = (lezAnno - perse) * dPrezzo - perse * prezzo + box * pens * 12;
		const pareggio = dPrezzo > 0 ? Math.floor(lezAnno * dPrezzo / (lezCliente * (prezzo + dPrezzo))) : null;
		document.getElementById("sim-ris").innerHTML = `<b class="big ${effetto >= 0 ? "st-pos" : "st-neg"}">${effetto >= 0 ? "+" : "−"}${euro(Math.abs(effetto))} all'anno</b>
    Base: ${Math.round(lezAnno)} lezioni l'anno a ${euro(prezzo, true)} di media, ${clienti} clienti attivi (≈ ${Math.round(lezCliente)} lezioni a testa).
    ${pareggio != null ? `<br>Con +${euro(dPrezzo)} a lezione potresti perdere fino a <b>${pareggio} clienti</b> e incassare comunque come oggi.` : ""}`;
	}
	function stConfronto(s) {
		const c = s.confronto || {}, pm = s.prezzi_medi || {};
		if (!c.disponibile) return `<div class="card st-card"><h3><i class="fa-solid fa-people-arrows" style="color:var(--primary)"></i> Confronto con centri simili</h3>
      <p class="sub">Il tuo centro contro la media anonima dei centri Equo della tua regione.</p>
      <div class="st-vuoto">${c.regione ? `Nella regione ${escapeHtml(c.regione)} ci sono ancora ${c.centri || 0} centri Equo: il confronto si attiva da 5 in su, in forma anonima.` : `Imposta la <b>regione</b> del centro in "Il tuo Centro" → "Modifica dati" per attivare il confronto (servono almeno 5 centri Equo nella regione).`}</div></div>`;
		const r = (l, tuo, media, pref) => {
			const d = tuo != null && media ? Math.round((tuo - media) / media * 100) : null;
			return `<tr><td>${l}</td><td>${pref === "€" ? euro(tuo) : tuo ?? "—"}</td><td>${pref === "€" ? euro(media) : media ?? "—"}</td><td class="${d == null ? "" : d >= 0 ? "st-pos" : "st-neg"}">${d == null ? "—" : (d >= 0 ? "+" : "") + d + "%"}</td></tr>`;
		};
		return `<div class="card st-card"><h3><i class="fa-solid fa-people-arrows" style="color:var(--primary)"></i> Confronto con centri simili</h3>
    <p class="sub">Media anonima di ${c.centri} centri Equo in ${escapeHtml(c.regione)}.</p>
    <table class="st-tab"><thead><tr><th></th><th>Tu</th><th>Media</th><th>Diff.</th></tr></thead><tbody>
      ${r("Prezzo lezione", pm.lezione_da_carnet, c.prezzo_lezione_medio, "€")}${r("Pensione mensile", pm.pensione_mese, c.pensione_media, "€")}
      ${r("Lezioni a settimana", Math.round(s.lezioni_settimana || 0), c.lezioni_settimana_medie)}${r("Cavalli", s.cavalli, c.cavalli_medi)}
    </tbody></table></div>`;
	}
	function stRadar(s) {
		const r = s.radar;
		if (!(pianoCentro?.agenti || []).includes("merlino")) return stBloccata(`<h3>Radar di Merlino</h3><p>Offerte e prezzi della concorrenza, eventi, recensioni, bandi…</p>`, "Il radar richiede Merlino (incluso a scelta in PREMIUM)");
		const fonti = (r?.fonti || []).slice(0, 8);
		return `<div class="card st-card st-radar" id="st-radar"><h3><i class="fa-solid fa-satellite-dish" style="color:#6b4fa0"></i> Il radar di Merlino</h3>
    <p class="sub">Concorrenza e opportunità nella tua zona, solo da fonti pubbliche. Si aggiorna da solo ogni lunedì.</p>
    <div id="st-radar-corpo">${r ? `<div class="testo">${athenaFormatta(r.testo)}</div>
      ${fonti.length ? `<div class="fonti"><b>Fonti:</b> ${fonti.map((f) => `<a href="${escapeHtml(urlSicuro(f.url))}" target="_blank" rel="noopener">${escapeHtml((f.titolo || f.url).slice(0, 60))}</a>`).join(" · ")}</div>` : ""}
      <div class="st-nota">Aggiornato il ${new Date(r.creato_il).toLocaleDateString("it-IT", {
			day: "numeric",
			month: "long"
		})}.</div>` : `<div class="st-vuoto">Nessun radar ancora: avvialo ora, Merlino impiega un paio di minuti a cercare.</div>`}</div>
    <div class="st-azioni" style="margin-top:10px"><button class="btn btn-primary btn-sm" id="st-radar-btn" onclick="stAggiornaRadar()"><i class="fa-solid fa-rotate"></i> Aggiorna il radar</button>
      <button class="btn btn-outline btn-sm" onclick="apriAgente('merlino','Guardando il radar di questa settimana, quale mossa mi consigli di fare per prima e come?')"><i class="fa-solid fa-hat-wizard"></i> Chiedi a Merlino</button></div></div>`;
	}
	async function stAggiornaRadar() {
		if (DEMO_MODE) {
			showToast("Nella demo il radar è di esempio.");
			return;
		}
		const btn = document.getElementById("st-radar-btn");
		if (btn) btn.disabled = true;
		try {
			const { data: sess } = await sb.auth.getSession();
			const res = await fetch("/api/radar", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: "Bearer " + (sess?.session?.access_token || "")
				},
				body: JSON.stringify({ centro_id: currentCentro.id })
			});
			const d = await res.json().catch(() => ({}));
			if (d.manca_zona) {
				showToast(d.error);
				apriModificaCentro();
				if (btn) btn.disabled = false;
				return;
			}
			if (d.bloccato) {
				apriUpsell("statistiche_complete");
				if (btn) btn.disabled = false;
				return;
			}
			if (d.gia_recente) {
				showToast(d.messaggio);
				if (btn) btn.disabled = false;
				return;
			}
			if (d.in_corso) {
				showToast(d.messaggio);
				radarAttesa = {
					da: Date.now(),
					ultimo: statDati?.radar?.creato_il || null
				};
				stMostraAttesaRadar();
				stControllaRadar();
				return;
			}
			if (!res.ok && !d.avviato) {
				showToast(d.error || "Non riesco ad avviare il radar.");
				if (btn) btn.disabled = false;
				return;
			}
			radarAttesa = {
				da: Date.now(),
				ultimo: statDati?.radar?.creato_il || null
			};
			stMostraAttesaRadar();
			stControllaRadar();
		} catch (e) {
			showToast("Errore di connessione.");
			if (btn) btn.disabled = false;
		}
	}
	function stMostraAttesaRadar() {
		const c = document.getElementById("st-radar-corpo");
		if (!c) return;
		c.innerHTML = `<div class="st-vuoto"><i class="fa-solid fa-satellite-dish fa-beat-fade" style="color:#6b4fa0"></i> Merlino sta perlustrando la zona (siti, offerte, eventi, recensioni, bandi)… di solito servono 1-3 minuti. Puoi continuare a lavorare: ti avviso io.</div>`;
		const btn = document.getElementById("st-radar-btn");
		if (btn) btn.disabled = true;
	}
	async function stControllaRadar() {
		if (!radarAttesa) return;
		const { data } = await sb.from("merlino_radar").select("testo, fonti, created_at").eq("centro_id", currentCentro.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
		if (data && data.created_at !== radarAttesa.ultimo && new Date(data.created_at).getTime() > radarAttesa.da - 6e4) {
			radarAttesa = null;
			if (statDati) statDati.radar = {
				testo: data.testo,
				fonti: data.fonti,
				creato_il: data.created_at
			};
			showToast("🔮 Il radar di Merlino è pronto.");
			if (document.getElementById("module-statistiche").style.display !== "none") renderStatistiche(statDati);
			return;
		}
		if (Date.now() - radarAttesa.da > 36e4) {
			radarAttesa = null;
			showToast("Il radar sta impiegando più del solito: riprova tra qualche minuto.");
			if (statDati) renderStatistiche(statDati);
			return;
		}
		setTimeout(stControllaRadar, 8e3);
	}
	function stScriviCliente(i) {
		const c = (statDati?.clienti_a_rischio || [])[i];
		if (!c) return;
		const testo = `Ciao ${(c.nome || "").split(" ")[0]}! È da un po' che non ti vediamo in sella 🐴 Ti teniamo un posto questa settimana? Dimmi tu giorno e orario che preferisci.`;
		const m = c.membro_id && teamList.find((x) => x.id === c.membro_id);
		if (m) {
			openChatModal(m);
			setTimeout(() => {
				const inp = document.getElementById("chat-input") || document.querySelector("#modal-chat textarea, #modal-chat input[type=text]");
				if (inp) {
					inp.value = testo;
					inp.focus();
				}
			}, 300);
		} else navigator.clipboard?.writeText(testo).then(() => showToast("Messaggio copiato: incollalo su WhatsApp o SMS."), () => showToast(testo));
	}
	// equo-scuderia-src/src/sezioni/centro/moduli/index.js
	Object.assign(window, {
		apriModificaCentro,
		askDeleteContatto,
		askHardReset,
		askRemoveMember,
		confirmDeleteContatto,
		confirmHardReset,
		confirmRemoveMember,
		copyDatiFiscali,
		copyJoinCode,
		loadContatti,
		loadTeam,
		onMemberLivelloChange,
		onMemberRuoloChange,
		openContattoForm,
		openDatiFiscaliForm,
		openMemberForm,
		refreshContattiModule,
		refreshStatisticheModule,
		renderStatistiche,
		renderTeam,
		renderZonaCentro,
		richiediCodiceReset,
		salvaDatiCentro,
		saveContatto,
		saveDatiFiscali,
		saveMember,
		stAggiornaRadar,
		stCalcolaSim,
		stScriviCliente,
		toggleContattoAltro,
		toggleHardReset
	});
})();

