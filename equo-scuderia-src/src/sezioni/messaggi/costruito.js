
// === GENERATO da equo-app-src/strumenti/costruisci-moduli.mjs: NON modificare qui, modificare equo-scuderia-src/src/sezioni/messaggi/moduli/ ===
(function() {
	// equo-scuderia-src/src/sezioni/messaggi/moduli/016-risposta-a-un-messaggio-stile-whatsapp-c.js
	var ETICHETTE_TIPO_CIT = {
		audio: "🎤 Nota vocale",
		foto: "📷 Foto",
		video: "🎬 Video",
		documento: "📄 Documento"
	};
	var msgCit = {};
	var rispostaInCorso = null;
	function registraMsgCit(m, nome) {
		if (!m || !m.id) return;
		msgCit[m.id] = {
			nome,
			tipo: m.tipo || "testo",
			testo: (m.testo || ETICHETTE_TIPO_CIT[m.tipo] || "Messaggio").slice(0, 160)
		};
	}
	function citazioneHtml(m) {
		const r = m && m.risposta;
		if (!r || typeof r !== "object" || !r.id) return "";
		const testo = r.testo || ETICHETTE_TIPO_CIT[r.tipo] || "Messaggio";
		return `<div class="scit" onclick="event.stopPropagation();vaiAlMessaggio('${String(r.id).replace(/[^a-zA-Z0-9_-]/g, "")}', this)"><b>${escapeHtml(r.nome || "")}</b><span>${escapeHtml(testo)}</span></div>`;
	}
	function vaiAlMessaggio(id, da) {
		const b = (da && da.closest("#chat-messages, #chat-pro-messages") || document).querySelector(`.sbolla[data-id="${id}"]`);
		if (!b) {
			showToast("Messaggio non più nella chat");
			return;
		}
		b.scrollIntoView({
			behavior: "smooth",
			block: "center"
		});
		b.classList.remove("lampeggia");
		b.offsetWidth;
		b.classList.add("lampeggia");
	}
	var INPUT_DI_BOX = {
		"chat-messages": "chat-input",
		"chat-pro-messages": "chat-pro-input"
	};
	function avviaRisposta(b) {
		const box = b.closest("#chat-messages, #chat-pro-messages");
		const info = msgCit[b.dataset.id];
		if (!box || !info) return;
		rispostaInCorso = {
			box: box.id,
			id: b.dataset.id,
			...info
		};
		document.querySelectorAll(".srisposta-bar").forEach((x) => x.remove());
		const inp = document.getElementById(INPUT_DI_BOX[box.id]);
		if (!inp) return;
		inp.parentElement.insertAdjacentHTML("beforebegin", `<div class="srisposta-bar"><div class="rb-cit"><b>Rispondi a ${escapeHtml(info.nome)}</b><span>${escapeHtml(info.testo)}</span></div><button type="button" aria-label="Annulla risposta" onclick="annullaRisposta()">✕</button></div>`);
		setTimeout(() => inp.focus(), 50);
	}
	function annullaRisposta() {
		rispostaInCorso = null;
		document.querySelectorAll(".srisposta-bar").forEach((x) => x.remove());
	}
	function consumaRisposta(boxId) {
		const r = rispostaInCorso;
		if (!r || r.box !== boxId) return null;
		annullaRisposta();
		if (!document.getElementById(boxId)?.offsetParent) return null;
		return {
			id: r.id,
			nome: r.nome,
			testo: r.testo,
			tipo: r.tipo
		};
	}
	(function() {
		let x0 = 0, y0 = 0, bolla = null, dx = 0;
		document.addEventListener("touchstart", (e) => {
			const b = e.target.closest && e.target.closest(".sbolla[data-id]");
			if (!b || e.target.closest("audio, video, a, button")) {
				bolla = null;
				return;
			}
			bolla = b;
			x0 = e.touches[0].clientX;
			y0 = e.touches[0].clientY;
			dx = 0;
		}, { passive: true });
		document.addEventListener("touchmove", (e) => {
			if (!bolla) return;
			dx = e.touches[0].clientX - x0;
			const dy = Math.abs(e.touches[0].clientY - y0);
			if (dy > 30 && dy > Math.abs(dx)) {
				bolla.style.transform = "";
				bolla = null;
				return;
			}
			if (dx > 0) bolla.style.transform = `translateX(${Math.min(dx, 80)}px)`;
		}, { passive: true });
		document.addEventListener("touchend", () => {
			if (!bolla) return;
			const b = bolla;
			bolla = null;
			b.style.transform = "";
			if (dx > 60) avviaRisposta(b);
		});
		document.addEventListener("dblclick", (e) => {
			const b = e.target.closest && e.target.closest(".sbolla[data-id]");
			if (b && !e.target.closest("audio, video, a, button")) {
				e.preventDefault();
				avviaRisposta(b);
			}
		});
	})();
	function corpoMessaggioChat(msg, mine) {
		const testo = msg.testo ? escapeHtml(msg.testo) : "";
		if (msg.tipo === "foto" && msg.file_url) return `<a href="${escapeHtml(urlSicuro(msg.file_url))}" target="_blank" rel="noopener"><img src="${escapeHtml(urlSicuro(msg.file_url))}" alt="Foto" loading="lazy" style="max-width:220px;max-height:260px;border-radius:10px;display:block;object-fit:cover"></a>${testo ? `<div style="margin-top:4px">${testo}</div>` : ""}`;
		if (msg.tipo === "video" && msg.file_url) return `<video controls playsinline preload="metadata" src="${escapeHtml(msg.file_url)}" style="max-width:220px;max-height:260px;border-radius:10px;display:block"></video>${testo ? `<div style="margin-top:4px">${testo}</div>` : ""}`;
		if (msg.tipo === "audio" && (msg.audio_url || msg.file_url)) return `<audio controls preload="none" src="${escapeHtml(msg.audio_url || msg.file_url)}" style="max-width:230px;height:36px;display:block"></audio>${testo ? `<div style="margin-top:4px">${testo}</div>` : ""}`;
		if (msg.tipo === "documento" && msg.file_url) return `<a href="${escapeHtml(urlSicuro(msg.file_url))}" target="_blank" rel="noopener" style="display:flex;align-items:center;gap:8px;color:inherit;text-decoration:none"><span style="background:#c0392b;color:#fff;font-size:9px;font-weight:800;border-radius:5px;padding:8px 5px">PDF</span><span style="text-decoration:underline">${escapeHtml(msg.file_nome || "Documento.pdf")}</span></a>${testo ? `<div style="margin-top:4px">${testo}</div>` : ""}`;
		return testo;
	}
	async function riduciFotoChat(file) {
		const url = await new Promise((ok, ko) => {
			const r = new FileReader();
			r.onload = () => ok(r.result);
			r.onerror = ko;
			r.readAsDataURL(file);
		});
		const img = await new Promise((ok, ko) => {
			const i = new Image();
			i.onload = () => ok(i);
			i.onerror = ko;
			i.src = url;
		});
		const k = Math.min(1, 1600 / Math.max(img.width, img.height));
		const c = document.createElement("canvas");
		c.width = Math.round(img.width * k);
		c.height = Math.round(img.height * k);
		c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
		return await new Promise((ok) => c.toBlob(ok, "image/jpeg", .82));
	}
	async function inviaAllegatoChat(event) {
		const file = event.target.files && event.target.files[0];
		event.target.value = "";
		if (!file || !currentChatMembro) return;
		const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name || "");
		const isImg = (file.type || "").startsWith("image/");
		if (!isPdf && !isImg) {
			showToast("Puoi allegare foto o documenti PDF.");
			return;
		}
		if (isPdf && file.size > 10485760) {
			showToast("PDF troppo grande (max 10 MB).");
			return;
		}
		const tipo = isPdf ? "documento" : "foto";
		const file_nome = isPdf ? file.name || "Documento.pdf" : "Foto.jpg";
		try {
			if (DEMO_MODE) {
				demoState.chat = demoState.chat || {};
				if (!demoState.chat[currentChatMembro.id]) demoState.chat[currentChatMembro.id] = [];
				demoState.chat[currentChatMembro.id].push({
					id: "chat" + (demoIdCounter++ + 900),
					mittente_user_id: currentUser.id,
					testo: null,
					tipo,
					file_url: URL.createObjectURL(file),
					file_nome,
					created_at: (/* @__PURE__ */ new Date()).toISOString()
				});
			} else {
				showToast(isPdf ? "Invio del PDF…" : "Invio della foto…");
				let blob = file;
				if (!isPdf) try {
					blob = await riduciFotoChat(file) || file;
				} catch (e) {
					console.error("riduci foto:", e);
				}
				const rnd = crypto.randomUUID ? crypto.randomUUID() : Date.now() + "-" + Math.random().toString(36).slice(2);
				const path = `${currentUser.id}/scuderia/${rnd}.${isPdf ? "pdf" : "jpg"}`;
				const up = await sb.storage.from("chat-allegati").upload(path, blob, { contentType: isPdf ? "application/pdf" : "image/jpeg" });
				if (up.error) throw up.error;
				const file_url = sb.storage.from("chat-allegati").getPublicUrl(path).data?.publicUrl;
				const { error } = await sb.from("chat_messaggi").insert({
					centro_id: currentCentro.id,
					membro_id: currentChatMembro.id,
					mittente_user_id: currentUser.id,
					testo: null,
					tipo,
					file_url,
					file_nome
				});
				if (error) throw error;
			}
			await loadAndRenderChat();
		} catch (err) {
			console.error("inviaAllegatoChat:", err);
			showToast("Invio non riuscito: " + (err?.message || "riprova"));
		}
	}
	async function inviaChatMessaggio() {
		const input = document.getElementById("chat-input");
		const testo = input.value.trim();
		if (!testo || !currentChatMembro) return;
		input.value = "";
		try {
			if (DEMO_MODE) {
				demoState.chat = demoState.chat || {};
				if (!demoState.chat[currentChatMembro.id]) demoState.chat[currentChatMembro.id] = [];
				demoState.chat[currentChatMembro.id].push({
					id: "chat" + (demoIdCounter++ + 900),
					mittente_user_id: currentUser.id,
					testo,
					risposta: consumaRisposta("chat-messages"),
					created_at: (/* @__PURE__ */ new Date()).toISOString()
				});
			} else {
				const risposta = consumaRisposta("chat-messages");
				const { error } = await sb.from("chat_messaggi").insert({
					centro_id: currentCentro.id,
					membro_id: currentChatMembro.id,
					mittente_user_id: currentUser.id,
					testo,
					...risposta ? { risposta } : {}
				});
				if (error) throw error;
			}
			await loadAndRenderChat();
		} catch (err) {
			showToast("Errore nell'invio del messaggio.");
			input.value = testo;
		}
	}
	// equo-scuderia-src/src/sezioni/messaggi/moduli/015-spunte-di-lettura-pallini-come-in-equo-a.js
	function statoSpunta(m) {
		return m.letto ? "letto" : m.consegnato_at ? "consegnato" : "inviato";
	}
	function ferriHtml(stato) {
		const titoli = {
			inviato: "Inviato",
			consegnato: "Consegnato",
			letto: "Letto"
		};
		const uno = (x) => `<circle cx="${x}" cy="4" r="3.4" fill="currentColor"/>`;
		const svg = stato === "inviato" ? `<svg viewBox="0 0 8 8" aria-hidden="true">${uno(4)}</svg>` : `<svg viewBox="0 0 19 8" aria-hidden="true">${uno(4)}${uno(15)}</svg>`;
		return `<span class="ferri ferri-${stato}" title="${titoli[stato]}" aria-label="${titoli[stato]}">${svg}</span>`;
	}
	function oraBollaScuderia(m, mine) {
		return `<div class="bolla-ora"><span class="t">${new Date(m.created_at).toLocaleString("it-IT", {
			day: "2-digit",
			month: "2-digit",
			hour: "2-digit",
			minute: "2-digit"
		})}</span>${mine ? ferriHtml(statoSpunta(m)) : ""}</div>`;
	}
	async function segnaConsegnati() {
		if (DEMO_MODE || !currentUser || document.visibilityState !== "visible") return;
		try {
			await sb.rpc("segna_messaggi_consegnati");
		} catch (e) {}
	}
	document.addEventListener("visibilitychange", () => {
		if (document.visibilityState === "visible") segnaConsegnati();
	});
	function renderChatMessaggi(messaggi) {
		const box = document.getElementById("chat-messages");
		if (!box) return;
		const wasAtBottom = box.scrollTop + box.clientHeight >= box.scrollHeight - 40;
		const html = messaggi.map((msg) => {
			const mine = msg.mittente_user_id === currentUser.id;
			registraMsgCit(msg, mine ? "Tu" : msg.mittente_user_id === currentChatMembro?.user_id ? currentChatMembro?.nome_visualizzato || "Cliente" : "Staff del centro");
			return `<div class="sbolla${mine ? " mia" : ""}" data-id="${escapeHtml(msg.id || "")}" style="align-self:${mine ? "flex-end" : "flex-start"};max-width:80%;background:${mine ? "var(--primary)" : "var(--muted-bg)"};color:${mine ? "#fff" : "var(--text)"};padding:8px 12px;border-radius:12px;font-size:13.5px;white-space:pre-wrap;word-break:break-word">` + citazioneHtml(msg) + corpoMessaggioChat(msg, mine) + oraBollaScuderia(msg, mine) + `</div>`;
		}).join("") || `<p style="color:var(--muted);font-size:12.5px;text-align:center;margin:auto">Nessun messaggio ancora. Scrivi il primo!</p>`;
		if (box.dataset.html === html) return;
		box.dataset.html = html;
		box.innerHTML = html;
		if (wasAtBottom || messaggi.length <= 1) box.scrollTop = box.scrollHeight;
	}
	// equo-scuderia-src/src/sezioni/messaggi/moduli/047-chatta-con-i-tuoi-clienti.js
	function clientiChatCollegati() {
		return teamList.filter((m) => m.user_id && m.user_id !== currentUser.id && (m.ruolo === "proprietario" || m.ruolo !== "admin"));
	}
	// equo-scuderia-src/src/sezioni/messaggi/moduli/049-non-letti-chat-basati-su-chat-messaggi-l.js
	var chatNonLettiPerMembro = {};
	var chatUnreadPollTimer = null;
	async function refreshChatUnread() {
		loadProfessionisti().then(() => {
			if (document.getElementById("module-professionisti")?.style.display === "block") renderProfessionistiList();
		});
		if (DEMO_MODE || !currentCentro) {
			impostaContatoreNav("chat-nav-unread-badge", 0, "verde");
			return;
		}
		const { data, error } = await sb.from("chat_messaggi").select("membro_id, mittente_user_id").eq("centro_id", currentCentro.id).eq("letto", false);
		if (error) {
			console.error("refreshChatUnread:", error);
			return;
		}
		const map = {};
		(data || []).forEach((row) => {
			const m = teamList.find((x) => x.id === row.membro_id);
			if (m && row.mittente_user_id === m.user_id) map[row.membro_id] = (map[row.membro_id] || 0) + 1;
		});
		chatNonLettiPerMembro = map;
		const totale = Object.values(map).reduce((a, b) => a + b, 0);
		if (document.getElementById("chat-nav-unread-badge")) impostaContatoreNav("chat-nav-unread-badge", totale, totale > 0 ? "rosso" : "verde");
		renderClientiChatList();
		aggiornaBannerPush();
	}
	function startChatUnreadPolling() {
		clearInterval(chatUnreadPollTimer);
		refreshChatUnread();
		chatUnreadPollTimer = setInterval(() => {
			refreshChatUnread();
			segnaConsegnati();
		}, 2e4);
		segnaConsegnati();
	}
	function renderClientiChatList() {
		const box = document.getElementById("clienti-chat-list");
		const empty = document.getElementById("clienti-chat-empty");
		if (!box) return;
		const query = (document.getElementById("clienti-chat-search")?.value || "").trim().toLowerCase();
		let list = clientiChatCollegati();
		if (query) list = list.filter((m) => (m.nome_visualizzato || "").toLowerCase().includes(query));
		list = list.slice().sort((a, b) => (a.nome_visualizzato || "").localeCompare(b.nome_visualizzato || ""));
		empty.style.display = clientiChatCollegati().length === 0 ? "block" : "none";
		box.innerHTML = list.map((m) => `
    <div class="msg-item" style="display:flex;align-items:center;justify-content:space-between;gap:10px">
      <div style="display:flex;align-items:center">
        <div>
          <span class="who">${escapeHtml(m.nome_visualizzato || "Cliente")}</span>
          <div style="color:var(--muted);font-size:12px">${m.ruolo === "proprietario" ? "Proprietario" : RUOLO_LABELS[m.ruolo] || m.ruolo}</div>
        </div>
        ${chatNonLettiPerMembro[m.id] ? "<span class=\"unread-dot\" title=\"Messaggi non letti\"></span>" : ""}
      </div>
      <button class="btn btn-outline btn-sm" onclick="chattaConMembro('${m.id}')"><i class="fa-solid fa-comment-dots"></i> Chatta</button>
    </div>`).join("");
		if (query && list.length === 0 && clientiChatCollegati().length > 0) box.innerHTML = `<p style="color:var(--muted);font-size:12.5px;padding:8px 2px">Nessun cliente collegato trovato per "${escapeHtml(query)}".</p>`;
	}
	var clienteAppenaCollegato = null;
	function apriConfirmChatCliente(nome, membroId) {
		clienteAppenaCollegato = {
			membro_id: membroId,
			nome
		};
		document.getElementById("chat-cliente-confirm-text").textContent = `Vuoi subito aprire una chat con ${nome}?`;
		openModal("modal-chat-cliente-confirm");
	}
	function chattaConProprietarioAppenaCollegato() {
		closeModal("modal-chat-cliente-confirm");
		if (clienteAppenaCollegato) chattaConMembro(clienteAppenaCollegato.membro_id);
		clienteAppenaCollegato = null;
	}
	// equo-scuderia-src/src/sezioni/messaggi/moduli/014-chat-interna-membro-equo-app-struttura.js
	var EQUO_APP_URL = "https://equo-app.netlify.app";
	var currentChatMembro = null;
	var chatPollTimer = null;
	var appProfileCache = {};
	async function hasAppProfile(userId) {
		if (!userId) return false;
		if (DEMO_MODE) return userId === "u3";
		if (userId in appProfileCache) return appProfileCache[userId];
		const { data, error } = await sb.rpc("has_equo_app_profile", { check_user_id: userId });
		const result = !error && !!data;
		appProfileCache[userId] = result;
		return result;
	}
	async function chattaConMembro(membroId) {
		const m = teamList.find((x) => x.id === membroId);
		if (!m) {
			showToast("Membro non trovato.");
			return;
		}
		if (await hasAppProfile(m.user_id)) openChatModal(m);
		else copyInviteText(m);
	}
	function copyInviteText(m) {
		const nome = m.nome_visualizzato || "";
		const testo = `Ciao${nome ? " " + nome : ""}! Scarica Equo per gestire il tuo cavallo e chattare direttamente con ${currentCentro?.nome || "il centro ippico"}: ${EQUO_APP_URL}`;
		navigator.clipboard?.writeText(testo).then(() => {
			showToast(`${nome || "Questo membro"} non ha ancora Equo App — messaggio di invito copiato, incollalo dove preferisci (WhatsApp, email, SMS).`);
		}).catch(() => {
			showToast("Impossibile copiare automaticamente. Testo invito: " + testo);
		});
	}
	function openChatModal(m) {
		currentChatMembro = m;
		document.getElementById("chat-membro-nome").textContent = "Chat con " + (m.nome_visualizzato || RUOLO_LABELS[m.ruolo] || "membro");
		openModal("modal-chat");
		loadAndRenderChat();
		segnaLettiChat(m.id);
		clearInterval(chatPollTimer);
		chatPollTimer = setInterval(loadAndRenderChat, 4e3);
		ascoltaChat("chat_messaggi", "membro_id", m.id, async () => {
			await loadAndRenderChat();
			if (currentChatMembro) segnaLettiChat(currentChatMembro.id);
		});
		setTimeout(() => document.getElementById("chat-input")?.focus(), 100);
	}
	async function segnaLettiChat(membroId) {
		if (DEMO_MODE) return;
		const { error } = await sb.rpc("segna_letti_chat", { p_membro_id: membroId });
		if (error) {
			console.error("segnaLettiChat:", error);
			return;
		}
		await refreshChatUnread();
	}
	function closeChatModal() {
		closeModal("modal-chat");
		clearInterval(chatPollTimer);
		chatPollTimer = null;
		smettiAscoltoChat();
		currentChatMembro = null;
	}
	async function loadAndRenderChat() {
		if (!currentChatMembro) return;
		let messaggi;
		if (DEMO_MODE) {
			demoState.chat = demoState.chat || {};
			messaggi = demoState.chat[currentChatMembro.id] || [];
		} else {
			const { data, error } = await sb.from("chat_messaggi").select("*").eq("centro_id", currentCentro.id).eq("membro_id", currentChatMembro.id).order("created_at", { ascending: true });
			if (error) console.error("loadAndRenderChat:", error);
			messaggi = error ? [] : data || [];
		}
		renderChatMessaggi(messaggi);
	}
	// equo-scuderia-src/src/sezioni/messaggi/moduli/043-nuova-chat-cliente-dal-codice-senza-pass.js
	function openNuovaChatClienteForm() {
		document.getElementById("nuova-chat-cliente-error").style.display = "none";
		document.getElementById("nuova-chat-codice").value = "";
		openModal("modal-nuova-chat-cliente");
		setTimeout(() => document.getElementById("nuova-chat-codice")?.focus(), 100);
	}
	async function avviaNuovaChatCliente() {
		const codice = document.getElementById("nuova-chat-codice").value.trim().toUpperCase();
		const errBox = document.getElementById("nuova-chat-cliente-error");
		errBox.style.display = "none";
		if (!codice) {
			errBox.textContent = "Inserisci il codice del proprietario.";
			errBox.style.display = "block";
			return;
		}
		const btn = document.getElementById("nuova-chat-cliente-btn");
		btn.disabled = true;
		try {
			const esito = await collegaProprietarioDaCodice(codice, null, null);
			if (!esito.ok) {
				errBox.textContent = esito.error;
				errBox.style.display = "block";
				return;
			}
			closeModal("modal-nuova-chat-cliente");
			await proponiImportCavalli(esito.membroId, esito.nome || "il proprietario", () => chattaConMembro(esito.membroId));
		} finally {
			btn.disabled = false;
		}
	}
	function askDeleteCavallo() {
		cavalloToDelete = currentCavalloId;
		openModal("modal-delete-cavallo");
	}
	async function confirmDeleteCavallo() {
		if (!cavalloToDelete) return;
		if (DEMO_MODE) {
			demoState.cavalli = demoState.cavalli.filter((c) => c.id !== cavalloToDelete);
			demoState.eventi = demoState.eventi.filter((e) => e.cavallo_id !== cavalloToDelete);
		} else {
			const { error } = await sb.from("scuderia_cavalli").delete().eq("id", cavalloToDelete);
			if (error) {
				showToast("Errore nell'eliminazione.");
				closeModal("modal-delete-cavallo");
				return;
			}
		}
		closeModal("modal-delete-cavallo");
		closeCavalloDetail();
		await loadCavalli();
		await loadEventiAll();
		renderCavalliList();
		showToast("Cavallo eliminato.");
	}
	var editingEventoId = null;
	function toggleEventoAltro() {
		const tipo = document.getElementById("ev-tipo").value;
		document.getElementById("ev-tipo-altro-field").style.display = tipo === "altro" ? "block" : "none";
	}
	function openEventoForm(id) {
		editingEventoId = id || null;
		document.getElementById("evento-error").style.display = "none";
		document.getElementById("modal-evento-title").textContent = editingEventoId ? "Modifica evento sanitario" : "Registra evento sanitario";
		document.getElementById("evento-save-btn").textContent = editingEventoId ? "Salva modifiche" : "Salva evento";
		if (editingEventoId) {
			const e = eventiAll.find((x) => x.id === editingEventoId);
			document.getElementById("ev-tipo").value = e?.tipo || "vaccino";
			document.getElementById("ev-tipo-altro").value = e?.tipo_altro || "";
			document.getElementById("ev-data").value = e?.data_evento || "";
			document.getElementById("ev-scadenza").value = e?.data_scadenza || "";
			document.getElementById("ev-note").value = e?.note || "";
		} else {
			document.getElementById("ev-tipo").value = "vaccino";
			document.getElementById("ev-tipo-altro").value = "";
			document.getElementById("ev-data").value = isoLoc(/* @__PURE__ */ new Date());
			document.getElementById("ev-scadenza").value = "";
			document.getElementById("ev-note").value = "";
		}
		toggleEventoAltro();
		openModal("modal-evento");
	}
	async function saveEvento() {
		const tipo = document.getElementById("ev-tipo").value;
		const tipo_altro = tipo === "altro" ? document.getElementById("ev-tipo-altro").value.trim() || null : null;
		const data_evento = document.getElementById("ev-data").value;
		const data_scadenza = document.getElementById("ev-scadenza").value || null;
		const note = document.getElementById("ev-note").value.trim() || null;
		const errBox = document.getElementById("evento-error");
		errBox.style.display = "none";
		if (!data_evento) {
			errBox.textContent = "Inserisci la data dell'evento.";
			errBox.style.display = "block";
			return;
		}
		try {
			if (DEMO_MODE) {
				if (editingEventoId) {
					const idx = demoState.eventi.findIndex((x) => x.id === editingEventoId);
					if (idx >= 0) demoState.eventi[idx] = {
						...demoState.eventi[idx],
						tipo,
						tipo_altro,
						data_evento,
						data_scadenza,
						note,
						updated_at: (/* @__PURE__ */ new Date()).toISOString()
					};
				} else demoState.eventi.push({
					id: "e" + (demoIdCounter++ + 100),
					centro_id: demoState.centro.id,
					cavallo_id: currentCavalloId,
					tipo,
					tipo_altro,
					data_evento,
					data_scadenza,
					note,
					creato_da: currentMembroId(),
					updated_at: (/* @__PURE__ */ new Date()).toISOString()
				});
			} else if (editingEventoId) {
				const { error } = await sb.from("scuderia_eventi_sanitari").update({
					tipo,
					tipo_altro,
					data_evento,
					data_scadenza,
					note
				}).eq("id", editingEventoId);
				if (error) throw error;
			} else {
				const { error } = await sb.from("scuderia_eventi_sanitari").insert({
					centro_id: currentCentro.id,
					cavallo_id: currentCavalloId,
					tipo,
					tipo_altro,
					data_evento,
					data_scadenza,
					note,
					creato_da: currentMembroId()
				});
				if (error) throw error;
			}
			await loadEventiAll();
			renderCavalloDetail();
			closeModal("modal-evento");
			showToast(editingEventoId ? "Evento aggiornato." : "Evento registrato.");
		} catch (err) {
			errBox.textContent = err.message || "Errore nel salvataggio.";
			errBox.style.display = "block";
		}
	}
	function askDeleteEvento(id) {
		eventoToDelete = id;
		openModal("modal-delete-evento");
	}
	async function confirmDeleteEvento() {
		if (!eventoToDelete) return;
		if (DEMO_MODE) demoState.eventi = demoState.eventi.filter((e) => e.id !== eventoToDelete);
		else {
			const { error } = await sb.from("scuderia_eventi_sanitari").delete().eq("id", eventoToDelete);
			if (error) {
				showToast(error.message && /può cancellarla/.test(error.message) ? error.message : "Errore nell'eliminazione.");
				closeModal("modal-delete-evento");
				return;
			}
		}
		await loadEventiAll();
		renderCavalloDetail();
		closeModal("modal-delete-evento");
		showToast("Evento eliminato.");
	}
	function formatDate(iso) {
		if (!iso) return "—";
		const [y, m, d] = iso.split("-");
		return `${d}/${m}/${y}`;
	}
	// equo-scuderia-src/src/sezioni/messaggi/moduli/index.js
	Object.assign(window, {
		annullaRisposta,
		apriConfirmChatCliente,
		askDeleteCavallo,
		askDeleteEvento,
		avviaNuovaChatCliente,
		chattaConMembro,
		chattaConProprietarioAppenaCollegato,
		citazioneHtml,
		closeChatModal,
		confirmDeleteCavallo,
		confirmDeleteEvento,
		consumaRisposta,
		corpoMessaggioChat,
		formatDate,
		inviaAllegatoChat,
		inviaChatMessaggio,
		loadAndRenderChat,
		openChatModal,
		openEventoForm,
		openNuovaChatClienteForm,
		oraBollaScuderia,
		refreshChatUnread,
		registraMsgCit,
		renderClientiChatList,
		riduciFotoChat,
		saveEvento,
		segnaLettiChat,
		startChatUnreadPolling,
		toggleEventoAltro,
		vaiAlMessaggio
	});
})();

