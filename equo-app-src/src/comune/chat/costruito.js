
// === GENERATO da equo-app-src/strumenti/costruisci-moduli.mjs: NON modificare qui, modificare comune/chat/moduli/ ===
(function() {
	// equo-app-src/src/comune/chat/moduli/063-risposta-a-un-messaggio-stile-whatsapp.js
	var rispostaInCorso = null;
	var ETICHETTE_TIPO_CIT = {
		audio: "🎤 Nota vocale",
		foto: "📷 Foto",
		video: "🎬 Video",
		documento: "📄 Documento",
		immagine: "📷 Foto"
	};
	function citazioneHtml(m) {
		const r = m && m.risposta;
		if (!r || typeof r !== "object" || !r.id) return "";
		const testo = r.testo || ETICHETTE_TIPO_CIT[r.tipo] || "Messaggio";
		return `<div class="mchat-cit" onclick="event.stopPropagation();vaiAlMessaggio('${String(r.id).replace(/[^a-zA-Z0-9_-]/g, "")}', this)"><b>${escapeHtml(r.nome || "")}</b><span>${escapeHtml(testo)}</span></div>`;
	}
	function vaiAlMessaggio(id, da) {
		const b = (da && da.closest(".mchat-overlay") || document).querySelector(`.mchat-bubble[data-id="${id}"]`);
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
	function avviaRisposta(bolla) {
		const ov = bolla.closest(".mchat-overlay");
		if (!ov || !bolla.dataset.id || bolla.dataset.id.startsWith("tmp")) return;
		const out = bolla.classList.contains("out");
		const titolo = ov.querySelector(".mchat-header-name")?.textContent?.trim() || "";
		const firma = bolla.querySelector(":scope > div[style*='font-weight:700']")?.textContent?.trim();
		const testoEl = bolla.querySelector(".mchat-bubble-text");
		let tipo = "testo", testo = testoEl ? testoEl.textContent.trim() : "";
		if (!testo) {
			if (bolla.querySelector("audio")) tipo = "audio";
			else if (bolla.querySelector("video")) tipo = "video";
			else if (bolla.querySelector("img")) tipo = "foto";
			else tipo = "documento";
			testo = ETICHETTE_TIPO_CIT[tipo];
		}
		rispostaInCorso = {
			ov: ov.id,
			id: bolla.dataset.id,
			nome: out ? "Tu" : firma || titolo || "Messaggio",
			testo: testo.slice(0, 160),
			tipo
		};
		mostraBarraRisposta();
		const inp = ov.querySelector(".mchat-input-bar input, .mchat-input-bar textarea");
		if (inp) setTimeout(() => inp.focus(), 50);
	}
	function mostraBarraRisposta() {
		document.querySelectorAll(".risposta-bar").forEach((x) => x.remove());
		const r = rispostaInCorso;
		if (!r) return;
		const ov = document.getElementById(r.ov);
		const barra = ov && ov.querySelector(".mchat-input-bar");
		if (!barra) return;
		barra.insertAdjacentHTML("beforebegin", `<div class="risposta-bar"><div class="rb-cit"><b>Rispondi a ${escapeHtml(r.nome)}</b><span>${escapeHtml(r.testo)}</span></div><button type="button" aria-label="Annulla risposta" onclick="annullaRisposta()">✕</button></div>`);
	}
	function annullaRisposta() {
		rispostaInCorso = null;
		document.querySelectorAll(".risposta-bar").forEach((x) => x.remove());
	}
	function consumaRisposta() {
		const r = rispostaInCorso;
		if (!r) return null;
		annullaRisposta();
		if (!document.getElementById(r.ov)?.classList.contains("active")) return null;
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
			const b = e.target.closest && e.target.closest(".mchat-overlay .mchat-bubble[data-id]");
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
			const b = e.target.closest && e.target.closest(".mchat-overlay .mchat-bubble[data-id]");
			if (b && !e.target.closest("audio, video, a, button")) {
				e.preventDefault();
				avviaRisposta(b);
			}
		});
	})();
	// equo-app-src/src/comune/chat/moduli/064-spunte-di-lettura-pallini.js
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
	function oraBolla(m, out) {
		return `<div class="mchat-bubble-time"><span class="t">${formatChatTime(m.created_at)}</span>${out ? ferriHtml(statoSpunta(m)) : ""}</div>`;
	}
	function attrBolla(m, out, tabella) {
		if (!m.id) return "";
		return ` data-id="${escapeHtml(m.id)}"` + (out ? ` data-mid="${escapeHtml(m.id)}" data-tab="${tabella}" data-stato="${statoSpunta(m)}"` : "");
	}
	async function aggiornaSpunte() {
		if (DEMO_MODE || !currentUser) return;
		const bolle = [...document.querySelectorAll(".mchat-bubble.out[data-mid]:not([data-stato=\"letto\"])")].filter((b) => b.offsetParent !== null);
		if (!bolle.length) return;
		const perTab = {};
		bolle.forEach((b) => (perTab[b.dataset.tab] = perTab[b.dataset.tab] || []).push(b.dataset.mid));
		for (const [tab, ids] of Object.entries(perTab)) {
			const { data, error } = await sb.from(tab).select("id, letto, consegnato_at").in("id", ids.slice(-100));
			if (error || !data) continue;
			data.forEach((r) => {
				const stato = statoSpunta(r);
				document.querySelectorAll(`.mchat-bubble.out[data-mid="${r.id}"]`).forEach((b) => {
					if (b.dataset.stato === stato) return;
					b.dataset.stato = stato;
					const f = b.querySelector(".ferri");
					if (f) f.outerHTML = ferriHtml(stato);
				});
			});
		}
	}
	async function segnaConsegnati() {
		if (DEMO_MODE || !currentUser || document.visibilityState !== "visible") return;
		try {
			await sb.rpc("segna_messaggi_consegnati");
		} catch (e) {}
	}
	var spunteTimer = null;
	function avviaSpunte() {
		segnaConsegnati();
		clearInterval(spunteTimer);
		let giri = 0;
		spunteTimer = setInterval(() => {
			aggiornaSpunte();
			if (++giri % 5 === 0) segnaConsegnati();
		}, 6e3);
	}
	document.addEventListener("visibilitychange", () => {
		if (document.visibilityState === "visible") {
			segnaConsegnati();
			aggiornaSpunte();
		}
	});
	// equo-app-src/src/comune/chat/moduli/070-notifiche-badge-messaggi-non-letti.js
	async function segnaLettiChatApp(membroId) {
		if (DEMO_MODE) return;
		const { error } = await sb.rpc("segna_letti_chat", { p_membro_id: membroId });
		if (error) console.error("segnaLettiChatApp:", error);
	}
	function contaNonLettiScuderia(membroId, messaggi) {
		return (messaggi || []).filter((m) => m.mittente_user_id !== currentUser.id && !m.letto).length;
	}
	async function computeChatUnreadTotal() {
		let total = 0;
		(await DB.listConversazioniProprietario() || []).forEach((c) => {
			total += c.unread || 0;
		});
		const scuderie = await DB.listScuderieCollegate();
		for (const s of scuderie) {
			const msgs = await DB.listMessaggiScuderia(s.membro_id);
			total += contaNonLettiScuderia(s.membro_id, msgs);
		}
		(await DB.listManiscalchiCollegati()).forEach((f) => {
			total += Number(f.non_letti) || 0;
		});
		return total;
	}
	async function refreshChatBadge() {
		if (DEMO_MODE || !currentUser) return;
		const total = await computeChatUnreadTotal();
		const badge = document.getElementById("owner-chat-nav-badge");
		if (badge) badge.style.display = total > 0 || daSaldareStato.daRicordare ? "block" : "none";
	}
	// equo-app-src/src/comune/chat/moduli/065-chat-fluida-stile-whatsapp.js
	var cacheThread = /* @__PURE__ */ new Map();
	function vicinoAlFondo(box) {
		return box.scrollHeight - box.scrollTop - box.clientHeight < 120;
	}
	function inizioThread(box, chiave) {
		if (box.dataset.thread === chiave && !box.dataset.vuoto) return;
		delete box.dataset.vuoto;
		if (cacheThread.has(chiave)) {
			box.innerHTML = cacheThread.get(chiave);
			box.dataset.thread = chiave;
			box.scrollTop = box.scrollHeight;
		} else {
			box.dataset.thread = "";
			box.innerHTML = "<div class=\"loading\"><div class=\"spinner\"></div> Caricamento...</div>";
		}
	}
	function applicaThread(box, chiave, html) {
		cacheThread.set(chiave, html);
		delete box.dataset.vuoto;
		const tpl = document.createElement("div");
		tpl.innerHTML = html;
		const nuovi = [...tpl.children];
		const inAttesa = [...box.querySelectorAll(".mchat-bubble.pending")];
		const vecchi = [...box.children].filter((el) => !el.classList.contains("pending") && !el.classList.contains("mchat-nuovi"));
		const eraInFondo = vicinoAlFondo(box) || inAttesa.length > 0;
		const stessoThread = box.dataset.thread === chiave && vecchi.length > 0 && vecchi.every((el) => el.dataset.id);
		const idNuovi = nuovi.map((el) => el.dataset.id);
		if (!(stessoThread && vecchi.length <= nuovi.length && vecchi.every((el, i) => el.dataset.id === idNuovi[i]))) {
			box.innerHTML = html;
			box.dataset.thread = chiave;
			box.scrollTop = box.scrollHeight;
			return;
		}
		vecchi.forEach((el, i) => {
			const n = nuovi[i];
			if (el.dataset.stato && n.dataset.stato && el.dataset.stato !== n.dataset.stato) {
				el.dataset.stato = n.dataset.stato;
				const f = el.querySelector(".ferri"), nf = n.querySelector(".ferri");
				if (f && nf) f.outerHTML = nf.outerHTML;
			}
		});
		const aggiunti = nuovi.slice(vecchi.length);
		if (!aggiunti.length && !inAttesa.length) return;
		inAttesa.slice(0, aggiunti.filter((el) => el.classList.contains("out")).length).forEach((el) => el.remove());
		const primaPending = box.querySelector(".mchat-bubble.pending");
		let arrivatiDaAltri = false;
		aggiunti.forEach((el) => {
			el.classList.add("nuovo");
			if (el.classList.contains("in")) arrivatiDaAltri = true;
			box.insertBefore(el, primaPending || box.querySelector(".mchat-nuovi"));
		});
		if (eraInFondo) box.scrollTo({
			top: box.scrollHeight,
			behavior: "smooth"
		});
		else if (arrivatiDaAltri) mostraPillolaNuovi(box);
	}
	function mostraPillolaNuovi(box) {
		let pill = box.querySelector(".mchat-nuovi");
		if (!pill) {
			pill = document.createElement("button");
			pill.className = "mchat-nuovi";
			pill.textContent = "Nuovi messaggi ↓";
			pill.onclick = () => {
				box.scrollTo({
					top: box.scrollHeight,
					behavior: "smooth"
				});
				pill.remove();
			};
			box.appendChild(pill);
			box.addEventListener("scroll", function via() {
				if (vicinoAlFondo(box)) {
					pill.remove();
					box.removeEventListener("scroll", via);
				}
			});
		}
	}
	function bollaInAttesa(boxId, testo) {
		const box = document.getElementById(boxId);
		if (!box) return null;
		if (box.dataset.vuoto) box.innerHTML = "";
		const el = document.createElement("div");
		el.className = "mchat-bubble out pending nuovo";
		el.innerHTML = `${rispostaInCorso ? citazioneHtml({ risposta: rispostaInCorso }) : ""}<div class="mchat-bubble-text">${escapeHtml(testo)}</div><div class="mchat-bubble-time"><span class="t">${formatChatTime((/* @__PURE__ */ new Date()).toISOString())}</span><span class="ferri ferri-invio" title="Invio in corso">${ICONA_OROLOGIO}</span></div>`;
		box.appendChild(el);
		box.scrollTo({
			top: box.scrollHeight,
			behavior: "smooth"
		});
		return el;
	}
	var ICONA_OROLOGIO = "<svg viewBox=\"0 0 12 12\" aria-hidden=\"true\"><circle cx=\"6\" cy=\"6\" r=\"4.6\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.3\"/><path d=\"M6 3.4V6l1.8 1.1\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.3\" stroke-linecap=\"round\"/></svg>";
	function bollaNonInviata(el) {
		if (!el) return;
		el.classList.remove("pending");
		el.classList.add("failed");
		const f = el.querySelector(".ferri");
		if (f) f.outerHTML = "<span class=\"ferri ferri-errore\" title=\"Non inviato\">!</span>";
	}
	var chatLive = {
		chiave: null,
		canale: null,
		timer: null,
		inCorso: false,
		ancora: false,
		cfg: null
	};
	function avviaChatLive(cfg) {
		fermaChatLive();
		chatLive.chiave = cfg.chiave;
		chatLive.cfg = cfg;
		if (DEMO_MODE) return;
		try {
			chatLive.canale = sb.channel("chat-" + cfg.chiave.replace(/[^a-z0-9-]/gi, "-")).on("postgres_changes", {
				event: "*",
				schema: "public",
				table: cfg.tabella,
				filter: `${cfg.colonna}=eq.${cfg.valore}`
			}, (p) => {
				const r = p.new || {};
				aggiornaChatLive(p.eventType === "INSERT" && !eMioMessaggio(cfg.tabella, r));
			}).subscribe();
		} catch (e) {
			console.error("realtime chat:", e);
		}
		chatLive.timer = setInterval(() => {
			const ov = document.getElementById(cfg.overlay);
			if (!ov || !ov.classList.contains("active")) {
				fermaChatLive();
				return;
			}
			if (document.visibilityState === "visible") aggiornaChatLive(false);
		}, 4e3);
	}
	function eMioMessaggio(tabella, r) {
		if (tabella === "messaggi_proprietari") return r.mittente_id === currentUser?.id;
		if (tabella === "chat_messaggi") return r.mittente_user_id === currentUser?.id;
		if (tabella === "messaggi_mascalcia") return chatLive.chiave?.startsWith("mchat:") ? r.mittente_tipo === "maniscalco" : r.mittente_tipo !== "maniscalco";
		return false;
	}
	var letturaTimer = null;
	async function aggiornaChatLive(conNuoviAltrui) {
		const cfg = chatLive.cfg;
		if (!cfg) return;
		if (chatLive.inCorso) {
			chatLive.ancora = true;
			return;
		}
		chatLive.inCorso = true;
		try {
			await cfg.aggiorna();
			const box = document.querySelector("#" + cfg.overlay + " .mchat-messages");
			const nonLetti = box && [...box.querySelectorAll(".mchat-bubble.in.nuovo")].length;
			if ((conNuoviAltrui || nonLetti) && document.visibilityState === "visible" && cfg.segnaLetti) {
				clearTimeout(letturaTimer);
				letturaTimer = setTimeout(() => {
					cfg.segnaLetti().then(() => refreshChatBadge && refreshChatBadge()).catch(() => {});
				}, 400);
				box && box.querySelectorAll(".mchat-bubble.in.nuovo").forEach((el) => el.classList.remove("nuovo"));
			}
		} catch (e) {
			console.error("aggiornaChatLive:", e);
		}
		chatLive.inCorso = false;
		if (chatLive.ancora) {
			chatLive.ancora = false;
			aggiornaChatLive(false);
		}
	}
	function fermaChatLive() {
		clearInterval(chatLive.timer);
		chatLive.timer = null;
		if (chatLive.canale) try {
			sb.removeChannel(chatLive.canale);
		} catch (e) {}
		chatLive.canale = null;
		chatLive.chiave = null;
		chatLive.cfg = null;
	}
	document.addEventListener("visibilitychange", () => {
		if (document.visibilityState === "visible" && chatLive.cfg) aggiornaChatLive(true);
	});
	async function renderChatThread(clienteId) {
		const box = document.getElementById("mchat-messages");
		const chiaveThread = "mchat:" + clienteId;
		inizioThread(box, chiaveThread);
		const data = await DB.listThreadMascalcia(clienteId);
		if (!data || data.length === 0) {
			box.innerHTML = "<div class=\"muted\" style=\"font-size:13px;text-align:center;margin-top:20px\">Nessun messaggio ancora.<br>Scrivi il primo messaggio qui sotto.</div>";
			box.dataset.thread = chiaveThread;
			box.dataset.vuoto = "1";
			return;
		}
		let lastDay = null;
		let html = "";
		data.forEach((m) => {
			const day = formatChatDay(m.created_at);
			if (day !== lastDay) {
				html += `<div class="mchat-day-sep" data-id="day-${escapeHtml(day)}">${day}</div>`;
				lastDay = day;
			}
			const out = m.mittente_tipo === "maniscalco";
			const body = m.tipo === "audio" ? `<div class="mchat-audio-bubble"><audio controls src="${escapeHtml(m.audio_url)}"></audio></div>` : m.tipo === "documento" || m.tipo === "foto" || m.tipo === "video" ? bollaAllegato(m.tipo, m.file_url, m.file_nome, m.testo) : `<div class="mchat-bubble-text">${escapeHtml(m.testo || "")}</div>`;
			const firma = !out && m.mittente_nome ? `<div style="font-size:11px;font-weight:700;color:var(--primary);margin-bottom:2px">${escapeHtml(m.mittente_nome)}</div>` : "";
			html += `
      <div class="mchat-bubble ${out ? "out" : "in"}"${attrBolla(m, out, "messaggi_mascalcia")}>
        ${firma}${citazioneHtml(m)}${body}
        ${oraBolla(m, out)}
      </div>`;
		});
		applicaThread(box, chiaveThread, html);
	}
	// equo-app-src/src/comune/chat/moduli/068-messaggi-a-cartelle-stile-telegram-clien.js
	var chatCartella = "clienti";
	try {
		chatCartella = localStorage.getItem("equo-chat-cartella") || "clienti";
	} catch (_) {}
	function sceltaCartellaChat(k) {
		chatCartella = k;
		try {
			localStorage.setItem("equo-chat-cartella", k);
		} catch (_) {}
		if (typeof cercaAzzera === "function") cercaAzzera("inbox");
		renderChatCartelle();
	}
	function renderChatCartelle() {
		const x = renderChatCartelleBase.apply(this, arguments);
		eseguiEstensioniSubito(estensioniDopo, "renderChatCartelle");
		return x;
	}
	function renderChatCartelleBase() {
		const box = document.getElementById("chat-cartelle");
		if (!box) return;
		const soloColleghi = typeof plRuolo === "function" && plRuolo() === "istr";
		if (!(soloColleghi ? ["proprietari", "colleghi"] : [
			"clienti",
			"scuderie",
			"colleghi"
		]).includes(chatCartella)) chatCartella = soloColleghi ? "proprietari" : "clienti";
		box.innerHTML = (soloColleghi ? [["proprietari", "Proprietari"], ["colleghi", "Colleghi"]] : [
			["clienti", "Clienti"],
			["scuderie", "Scuderie"],
			["colleghi", "Colleghi"]
		]).map(([k, t]) => {
			const c = chatContatori[k];
			return `<button role="tab" aria-selected="${chatCartella === k}" class="${chatCartella === k ? "on" : ""}" onclick="sceltaCartellaChat('${k}')">${t}${c.nonLetti ? `<span class="n nonletti" aria-label="${c.nonLetti} non letti">${c.nonLetti}</span>` : `<span class="n">${c.n}</span>`}</button>`;
		}).join("");
		document.getElementById("chat-cartella-sotto").textContent = {
			proprietari: "Chat con i proprietari dei cavalli che segui",
			clienti: "Chat con i proprietari dei cavalli",
			scuderie: "Chat con scuderie, maneggi e centri ippici",
			colleghi: "Chat con maniscalchi, veterinari e altri professionisti"
		}[chatCartella];
		document.querySelectorAll("#page-pro-inbox .chat-sez").forEach((el) => {
			el.hidden = el.dataset.sez !== chatCartella;
		});
	}
	function renderInboxStrutture(strutture, unreadByCliente) {
		const wrap = document.getElementById("inbox-strutture-wrap");
		const box = document.getElementById("inbox-strutture-list");
		if (!wrap || !box) return;
		if (strutture.length === 0) {
			box.innerHTML = "<div class=\"muted\" style=\"font-size:13px;line-height:1.6\">Nessuna chat con scuderie. Da <strong>Clienti → Scuderie → Collega scuderia</strong> inserisci il codice di una scuderia che usa Equo Scuderia, oppure accetta il suo invito.</div>";
			return;
		}
		box.innerHTML = strutture.map((m) => {
			const unread = unreadByCliente[m.cliente_mascalcia_id] || 0;
			const c = m.clienti_mascalcia || {};
			const preview = (!c.centro_id || c.collegamento_stato === "attivo" ? "" : c.collegamento_stato === "da_confermare_pro" ? "Invito da accettare · " : "In attesa della scuderia · ") + (m.mittente_tipo === "maniscalco" ? "Tu: " : m.mittente_nome ? m.mittente_nome + ": " : "") + previewMessaggioMascalcia(m.tipo, m.testo, m.file_nome);
			const azione = c.collegamento_stato === "da_confermare_pro" ? `showPage('pro-clienti'); openClienteDetail('${m.cliente_mascalcia_id}')` : `openChatThread('${m.cliente_mascalcia_id}')`;
			return `
    <div class="inbox-item ${unread > 0 ? "unread" : ""}" onclick="${azione}">
      <div class="horse-avatar"><i class="fa-solid fa-building" style="font-size:19px"></i></div>
      <div style="flex:1;min-width:0">
        <div class="inbox-name" style="font-size:14px">${escapeHtml(c.nome || "Scuderia")}</div>
        <div class="inbox-preview muted" style="font-size:12.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHtml(preview)}</div>
      </div>
      ${unread > 0 ? `<span class="inbox-unread-dot"></span>` : ""}
    </div>`;
		}).join("");
	}
	// equo-app-src/src/comune/chat/moduli/067-note-vocali.js
	var mediaRecorder = null;
	var recordedChunks = [];
	var recordingTimer = null;
	var recordingSeconds = 0;
	var recordingStream = null;
	function formatRecTimer(sec) {
		const m = Math.floor(sec / 60);
		const s = sec % 60;
		return m + ":" + String(s).padStart(2, "0");
	}
	async function startVoiceRecording() {
		if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || typeof MediaRecorder === "undefined") {
			showToast("Il tuo browser non supporta la registrazione vocale.");
			return;
		}
		try {
			recordingStream = await navigator.mediaDevices.getUserMedia({ audio: true });
		} catch (e) {
			showToast("Permesso microfono negato. Abilitalo dalle impostazioni del browser.");
			return;
		}
		recordedChunks = [];
		try {
			mediaRecorder = new MediaRecorder(recordingStream);
		} catch (e) {
			showToast("Impossibile avviare la registrazione su questo dispositivo.");
			recordingStream.getTracks().forEach((t) => t.stop());
			return;
		}
		mediaRecorder.ondataavailable = (e) => {
			if (e.data && e.data.size > 0) recordedChunks.push(e.data);
		};
		mediaRecorder.start();
		recordingSeconds = 0;
		document.getElementById("mchat-rec-timer").textContent = "0:00";
		document.getElementById("mchat-input-bar").style.display = "none";
		document.getElementById("mchat-recording-bar").classList.add("active");
		document.getElementById("mchat-emoji-picker").classList.remove("active");
		recordingTimer = setInterval(() => {
			recordingSeconds++;
			document.getElementById("mchat-rec-timer").textContent = formatRecTimer(recordingSeconds) + (isPremium() ? "" : " / 0:30");
			if (!isPremium() && recordingSeconds >= 30) {
				showToast("Piano Free: note vocali fino a 30 secondi.");
				stopAndSendVoiceRecording();
			}
		}, 1e3);
	}
	function stopRecordingInternal() {
		clearInterval(recordingTimer);
		recordingTimer = null;
		document.getElementById("mchat-input-bar").style.display = "flex";
		document.getElementById("mchat-recording-bar").classList.remove("active");
		if (recordingStream) {
			recordingStream.getTracks().forEach((t) => t.stop());
			recordingStream = null;
		}
	}
	function cancelVoiceRecording() {
		if (mediaRecorder && mediaRecorder.state !== "inactive") {
			mediaRecorder.onstop = null;
			mediaRecorder.stop();
		}
		recordedChunks = [];
		mediaRecorder = null;
		stopRecordingInternal();
	}
	async function stopAndSendVoiceRecording() {
		if (!mediaRecorder || mediaRecorder.state === "inactive") return;
		const clienteId = currentClienteId;
		mediaRecorder.onstop = async () => {
			stopRecordingInternal();
			if (recordedChunks.length === 0) {
				showToast("Registrazione troppo breve, riprova.");
				return;
			}
			const blob = new Blob(recordedChunks, { type: mediaRecorder.mimeType || "audio/webm" });
			recordedChunks = [];
			mediaRecorder = null;
			const { url, error } = await DB.uploadNotaVocaleMascalcia(blob, clienteId);
			if (error || !url) {
				showToast("Errore nel caricamento della nota vocale.");
				return;
			}
			const { error: insertError } = await DB.insertMessaggioMascalcia({
				cliente_mascalcia_id: clienteId,
				tipo: "audio",
				audio_url: url
			});
			if (insertError) {
				showToast("Errore: " + insertError.message);
				return;
			}
			await renderChatThread(clienteId);
			await loadInboxMascalcia();
		};
		mediaRecorder.stop();
	}
	function shareInviteCodeFromChat() {
		const c = clientiMascalcia.find((x) => x.id === currentClienteId);
		if (!c) return;
		const text = `Il tuo codice per collegarti a me su Equo: ${c.codice_invito}\nApri Equo App (app.equohub.com) → Chat → "Il tuo maniscalco" → Collega.`;
		if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(() => showToast("Codice copiato negli appunti!")).catch(() => showToast("Non sono riuscito a copiare, riprova."));
		else showToast("Codice: " + c.codice_invito);
	}
	async function loadInboxMascalcia() {
		const box = document.getElementById("inbox-list");
		if (!box) return;
		box.innerHTML = "<div class=\"loading\"><div class=\"spinner\"></div> Caricamento...</div>";
		const data = await DB.listInboxMascalcia();
		const unreadByCliente = {};
		data.forEach((m) => {
			if (m.mittente_tipo === "cliente" && !m.letto) unreadByCliente[m.cliente_mascalcia_id] = (unreadByCliente[m.cliente_mascalcia_id] || 0) + 1;
		});
		const seen = /* @__PURE__ */ new Set();
		const conversazioni = [];
		data.forEach((m) => {
			if (seen.has(m.cliente_mascalcia_id)) return;
			seen.add(m.cliente_mascalcia_id);
			conversazioni.push(m);
		});
		const totalUnread = Object.values(unreadByCliente).reduce((a, b) => a + b, 0);
		proUnreadTotal = totalUnread;
		if (typeof wgPro !== "undefined") {
			const u = conversazioni[0];
			wgPro.unread = totalUnread;
			wgPro.ultimo = u ? {
				nome: u.clienti_mascalcia?.nome || "Cliente",
				testo: u.testo || (u.tipo === "audio" ? "Nota vocale" : u.file_nome ? "Allegato: " + u.file_nome : "Allegato")
			} : null;
			if (typeof wgRidisegna === "function") wgRidisegna();
		}
		const navBadge = document.getElementById("inbox-nav-badge");
		if (navBadge) navBadge.style.display = totalUnread > 0 ? "block" : "none";
		const eScuderia = (m) => !!m.clienti_mascalcia?.centro_id || m.clienti_mascalcia?.tipo_cliente === "struttura" || isStruttura((clientiMascalcia || []).find((c) => c.id === m.cliente_mascalcia_id));
		const strutture = conversazioni.filter(eScuderia);
		const clientiConv = conversazioni.filter((m) => !eScuderia(m));
		renderInboxStrutture(strutture, unreadByCliente);
		chatContatori.clienti = {
			n: clientiConv.length,
			nonLetti: clientiConv.reduce((t, m) => t + (unreadByCliente[m.cliente_mascalcia_id] || 0), 0)
		};
		chatContatori.scuderie = {
			n: strutture.length,
			nonLetti: strutture.reduce((t, m) => t + (unreadByCliente[m.cliente_mascalcia_id] || 0), 0)
		};
		renderChatCartelle();
		if (clientiConv.length === 0) {
			box.innerHTML = "<div class=\"empty-state\"><div class=\"icon\" style=\"width:32px;height:32px;margin:0 auto 10px;color:var(--muted)\"><svg><use href=\"#i-inbox\"/></svg></div><div style=\"font-size:13.5px;line-height:1.6\">Nessun messaggio con i proprietari.<br>Le conversazioni con i clienti appariranno qui.</div></div>";
			return;
		}
		box.innerHTML = clientiConv.map((m) => {
			const unread = unreadByCliente[m.cliente_mascalcia_id] || 0;
			const nome = m.clienti_mascalcia?.nome || "Cliente";
			const cavallo = m.clienti_mascalcia?.nome_cavallo;
			const previewBody = previewMessaggioMascalcia(m.tipo, m.testo, m.file_nome);
			const preview = (m.mittente_tipo === "maniscalco" ? "Tu: " : "") + previewBody;
			return `
    <div class="inbox-item ${unread > 0 ? "unread" : ""}" onclick="openChatThread('${m.cliente_mascalcia_id}')">
      <div class="horse-avatar"><i class="fa-solid fa-user" style="font-size:20px"></i></div>
      <div style="flex:1;min-width:0">
        <div class="inbox-name" style="font-size:14px">${escapeHtml(nome)}${cavallo ? " · " + escapeHtml(cavallo) : ""}</div>
        <div class="inbox-preview muted" style="font-size:12.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHtml(preview)}</div>
      </div>
      ${unread > 0 ? `<span class="inbox-unread-dot"></span>` : ""}
    </div>`;
		}).join("");
	}
	// equo-app-src/src/comune/chat/moduli/062-chat-mascalcia-stile-whatsapp.js
	function populateEmojiPicker() {
		const box = document.getElementById("mchat-emoji-picker");
		if (box.childElementCount > 0) return;
		box.innerHTML = EMOJI_LIST.map((e) => `<button type="button" onclick="insertEmoji('${e}')">${e}</button>`).join("");
	}
	function toggleEmojiPicker() {
		populateEmojiPicker();
		document.getElementById("mchat-emoji-picker").classList.toggle("active");
	}
	function insertEmoji(emoji) {
		const input = document.getElementById("mchat-input");
		input.value += emoji;
		input.focus();
	}
	async function openChatThread(clienteId) {
		if (!clienteId) return;
		currentClienteId = clienteId;
		if (!clientiMascalcia || !clientiMascalcia.some((x) => x.id === clienteId)) clientiMascalcia = await DB.listClientiMascalcia();
		const c = clientiMascalcia.find((x) => x.id === clienteId);
		document.getElementById("mchat-cliente-nome").textContent = c?.nome || "Cliente";
		const strutturaColl = isStrutturaCollegata(clienteId);
		document.getElementById("mchat-cliente-sub").textContent = strutturaColl ? "Scuderia collegata · Equo Scuderia" : c?.nome_cavallo || "";
		const btnCodice = document.querySelector("#mchat-overlay [onclick=\"shareInviteCodeFromChat()\"]");
		if (btnCodice) btnCodice.style.display = strutturaColl ? "none" : "";
		const btnInt = document.getElementById("mchat-btn-intervento");
		if (btnInt) btnInt.textContent = strutturaColl ? "Proponi appuntamento" : "Segna intervento fatto";
		document.getElementById("mchat-emoji-picker").classList.remove("active");
		document.getElementById("mchat-input").value = "";
		document.getElementById("mchat-overlay").classList.add("active");
		const letti = DB.markLettiMascalcia(clienteId);
		await renderChatThread(clienteId);
		avviaChatLive({
			chiave: "mchat:" + clienteId,
			tabella: "messaggi_mascalcia",
			colonna: "cliente_mascalcia_id",
			valore: clienteId,
			overlay: "mchat-overlay",
			aggiorna: () => renderChatThread(clienteId),
			segnaLetti: () => DB.markLettiMascalcia(clienteId).then(() => loadInboxMascalcia())
		});
		await letti;
		loadInboxMascalcia();
	}
	function closeChatThread() {
		if (mediaRecorder && mediaRecorder.state !== "inactive") cancelVoiceRecording();
		rimuoviAllegatoChat();
		document.getElementById("mchat-overlay").classList.remove("active");
		fermaChatLive();
	}
	function formatChatTime(iso) {
		return new Date(iso).toLocaleTimeString("it-IT", {
			hour: "2-digit",
			minute: "2-digit"
		});
	}
	function formatChatDay(iso) {
		const d = new Date(iso);
		const today = /* @__PURE__ */ new Date();
		if (d.toDateString() === today.toDateString()) return "Oggi";
		const yesterday = new Date(today);
		yesterday.setDate(yesterday.getDate() - 1);
		if (d.toDateString() === yesterday.toDateString()) return "Ieri";
		return d.toLocaleDateString("it-IT", {
			day: "numeric",
			month: "long",
			year: "numeric"
		});
	}
	// equo-app-src/src/comune/chat/moduli/077-chat-tra-colleghi-vista-professionista.js
	var chatColleghiAperta = false;
	async function loadColleghiList() {
		const box = document.getElementById("colleghi-list");
		if (!box) return;
		const lista = await DB.listColleghi();
		chatContatori.colleghi = {
			n: lista.length,
			nonLetti: lista.reduce((t, c) => t + (Number(c.unread) || 0), 0)
		};
		renderChatCartelle();
		if (!lista.length) {
			box.innerHTML = "<div class=\"muted\" style=\"font-size:13px;line-height:1.6;text-align:center;padding:6px 0\">Nessun collega ancora.<br>Tocca \"+ Collega\" e inserisci il suo codice professionista.</div>";
			return;
		}
		box.innerHTML = lista.map((c) => {
			const nome = c.nome || "Collega";
			const m = c.ultimoMessaggio;
			let preview = "Inizia la conversazione";
			if (m) preview = (m.mittente_id === currentUser.id ? "Tu: " : "") + (m.tipo && m.tipo !== "testo" ? previewAllegato(m.tipo, m.file_nome) : m.testo || "");
			return `
    <div class="inbox-item ${c.unread > 0 ? "unread" : ""}" onclick="apriChatCollega(${jsArg(c.conversazione_id)}, ${jsArg(nome)}, ${jsArg(c.ruolo || "")})">
      <div class="horse-avatar">${c.avatar_url ? `<img src="${escapeHtml(c.avatar_url)}" style="width:100%;height:100%;object-fit:cover;border-radius:inherit">` : "<i class=\"fa-solid fa-user-doctor\" style=\"font-size:18px\"></i>"}</div>
      <div style="flex:1;min-width:0">
        <div class="inbox-name" style="font-size:14px">${escapeHtml(nome)}${c.certificato ? " " + BADGE_CERTIFIED_HTML : ""}</div>
        <div class="muted" style="font-size:11.5px">${escapeHtml(ROLE_LABELS[c.ruolo] || "Professionista")}</div>
        <div class="inbox-preview muted" style="font-size:12.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHtml(preview)}</div>
      </div>
      ${c.unread > 0 ? `<span class="inbox-unread-dot"></span>` : ""}
    </div>`;
		}).join("");
	}
	function apriNuovoCollega() {
		document.getElementById("nuovo-collega-codice").value = "";
		document.getElementById("nuovo-collega-error").style.display = "none";
		openModal("modal-nuovo-collega");
	}
	async function avviaChatCollega() {
		const codice = document.getElementById("nuovo-collega-codice").value.trim().toUpperCase();
		const errBox = document.getElementById("nuovo-collega-error");
		errBox.style.display = "none";
		if (!codice) return;
		const r = await DB.creaChatCollega(codice);
		if (!r || !r.ok) {
			errBox.textContent = ({
				codice_non_valido: "Codice non valido: controlla che sia un codice professionista (EQUO-PRO-…, EQUO-TRA-… o EQUO-MED-…).",
				codice_tuo: "Questo è il tuo codice.",
				solo_professionisti: "La chat tra colleghi è per i professionisti."
			}[r?.errore] || "Non sono riuscito ad avviare la chat, riprova.") + (DEMO_MODE ? " (in demo prova EQUO-PRO-DEMO)" : "");
			errBox.style.display = "block";
			return;
		}
		closeModal("modal-nuovo-collega");
		await loadColleghiList();
		await apriChatCollega(r.conversazione_id, r.nome || "Collega", r.ruolo || "");
	}
	async function apriChatCollega(conversazioneId, nome, ruolo) {
		await openOwnerChatThread(conversazioneId, nome + (ROLE_LABELS[ruolo] ? " · " + ROLE_LABELS[ruolo] : ""), true);
	}
	async function invitaCollega() {
		const text = `Ciao! Ti scrivo su Equo, l'app per chi lavora con i cavalli: chat, foto e casi in un posto solo. Scaricala su https://app.equohub.com e aggiungimi con il mio codice ${await DB.ensureCodiceProfessionista()}`;
		if (navigator.share) {
			navigator.share({ text }).catch(() => {});
			return;
		}
		window.open("https://wa.me/?text=" + encodeURIComponent(text), "_blank");
	}
	function bloccaPremiumColleghi(cosa) {
		if (!chatColleghiAperta || isPremium()) return false;
		showToast(cosa + " tra colleghi sono inclusi in Equo Premium");
		togglePiano();
		return true;
	}
	async function startNewChat() {
		const codice = document.getElementById("new-chat-codice").value.trim().toUpperCase();
		const errBox = document.getElementById("new-chat-error");
		errBox.style.display = "none";
		if (!codice) return;
		if (codice.startsWith("EQUO-PRO-") || /^EQUO-[A-Z0-9]{5}$/.test(codice)) {
			gestisciCodiceScansionato(codice);
			return;
		}
		const altro = await DB.findProprietarioByCodice(codice);
		if (!altro) {
			errBox.textContent = "Codice non valido." + (DEMO_MODE ? " (in demo prova EQUO-OWN-DEMO)" : "");
			errBox.style.display = "block";
			return;
		}
		const conversazioneId = await DB.getOrCreateConversazione(altro.id);
		if (!conversazioneId) {
			errBox.textContent = "Errore nella creazione della chat, riprova.";
			errBox.style.display = "block";
			return;
		}
		document.getElementById("new-chat-codice").value = "";
		closeModal("modal-new-chat");
		await loadOwnerChatList();
		await openOwnerChatThread(conversazioneId, altro.full_name || "Utente Equo");
	}
	async function openOwnerChatThread(conversazioneId, nome, colleghi = false) {
		chatColleghiAperta = !!colleghi;
		currentConversazioneId = conversazioneId;
		document.getElementById("ochat-nome").textContent = nome || "Utente Equo";
		document.getElementById("ochat-emoji-picker").classList.remove("active");
		document.getElementById("ochat-input").value = "";
		document.getElementById("ochat-overlay").classList.add("active");
		const letti = DB.markLettiProprietario(conversazioneId);
		await renderOwnerChatThread(conversazioneId);
		avviaChatLive({
			chiave: "ochat:" + conversazioneId,
			tabella: "messaggi_proprietari",
			colonna: "conversazione_id",
			valore: conversazioneId,
			overlay: "ochat-overlay",
			aggiorna: () => renderOwnerChatThread(conversazioneId),
			segnaLetti: () => DB.markLettiProprietario(conversazioneId)
		});
		await letti;
		aggiornaListeChatProprietari();
		refreshChatBadge();
	}
	async function aggiornaListeChatProprietari() {
		if (chatColleghiAperta) await loadColleghiList();
		else await loadOwnerChatList();
	}
	function closeOwnerChatThread() {
		if (ownerMediaRecorder && ownerMediaRecorder.state !== "inactive") cancelOwnerVoiceRecording();
		document.getElementById("ochat-overlay").classList.remove("active");
		fermaChatLive();
	}
	async function renderOwnerChatThread(conversazioneId) {
		const box = document.getElementById("ochat-messages");
		const chiaveThread = "ochat:" + conversazioneId;
		inizioThread(box, chiaveThread);
		const data = await DB.listThreadProprietario(conversazioneId);
		if (!data || data.length === 0) {
			box.innerHTML = "<div class=\"muted\" style=\"font-size:13px;text-align:center;margin-top:20px\">Nessun messaggio ancora.<br>Scrivi il primo messaggio qui sotto.</div>";
			box.dataset.thread = chiaveThread;
			box.dataset.vuoto = "1";
			return;
		}
		let lastDay = null;
		let html = "";
		data.forEach((m) => {
			const day = formatChatDay(m.created_at);
			if (day !== lastDay) {
				html += `<div class="mchat-day-sep" data-id="day-${escapeHtml(day)}">${day}</div>`;
				lastDay = day;
			}
			const out = m.mittente_id === currentUser.id;
			let body;
			if (m.tipo === "audio") body = `<div class="mchat-audio-bubble"><audio controls src="${escapeHtml(m.media_url)}"></audio></div>`;
			else if (m.tipo === "foto") body = `<img src="${escapeHtml(m.media_url)}" style="max-width:220px;border-radius:12px;display:block">
      <button class="btn btn-outline btn-sm" style="margin-top:6px;width:100%" onclick="shareContentExternally(${jsArg(urlSicuro(m.media_url))})">
        <span class="fa-icon" style="width:14px;height:14px"><i class="fa-solid fa-share-nodes"></i></span> Condividi fuori da Equo
      </button>`;
			else if (m.tipo === "video") body = `<video controls src="${escapeHtml(m.media_url)}" style="max-width:220px;border-radius:12px;display:block"></video>
      <div class="muted" style="font-size:11px;margin-top:4px">I video si condividono solo dentro Equo per ora.</div>`;
			else if (m.tipo === "documento") body = bollaAllegato("documento", m.media_url, m.file_nome, m.testo);
			else body = `<div class="mchat-bubble-text">${escapeHtml(m.testo)}</div>`;
			html += `
      <div class="mchat-bubble ${out ? "out" : "in"}"${attrBolla(m, out, "messaggi_proprietari")}>
        ${citazioneHtml(m)}${body}
        ${oraBolla(m, out)}
      </div>`;
		});
		applicaThread(box, chiaveThread, html);
	}
	async function sendOwnerChatMessage() {
		const input = document.getElementById("ochat-input");
		const testo = input.value.trim();
		if (!testo || !currentConversazioneId) return;
		input.value = "";
		input.focus();
		const convId = currentConversazioneId;
		const bolla = bollaInAttesa("ochat-messages", testo);
		const { error } = await DB.insertMessaggioProprietario({
			conversazione_id: convId,
			tipo: "testo",
			testo
		});
		if (error) {
			bollaNonInviata(bolla);
			showToast("Non inviato: " + error.message);
			return;
		}
		if (currentConversazioneId === convId) await aggiornaChatLive(false);
		aggiornaListeChatProprietari();
	}
	async function handleOwnerChatMediaChange(event) {
		const file = event.target.files && event.target.files[0];
		event.target.value = "";
		if (!file || !currentConversazioneId) return;
		const isVideo = file.type.startsWith("video/");
		const tipo = isVideo ? "video" : "foto";
		const ext = (file.name || "").split(".").pop() || (isVideo ? "mp4" : "jpg");
		showToast(isVideo ? "Caricamento video..." : "Caricamento foto...");
		const { url, error } = await DB.uploadMediaProprietario(file, currentConversazioneId, tipo, ext);
		if (error || !url) {
			showToast("Errore nel caricamento del file.");
			return;
		}
		const { error: insertError } = await DB.insertMessaggioProprietario({
			conversazione_id: currentConversazioneId,
			tipo,
			media_url: url
		});
		if (insertError) {
			showToast("Errore: " + insertError.message);
			return;
		}
		await renderOwnerChatThread(currentConversazioneId);
		await aggiornaListeChatProprietari();
	}
	var ownerMediaRecorder = null;
	var ownerRecordedChunks = [];
	var ownerRecordingTimer = null;
	var ownerRecordingSeconds = 0;
	var ownerRecordingStream = null;
	async function startOwnerVoiceRecording() {
		if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || typeof MediaRecorder === "undefined") {
			showToast("Il tuo browser non supporta la registrazione vocale.");
			return;
		}
		try {
			ownerRecordingStream = await navigator.mediaDevices.getUserMedia({ audio: true });
		} catch (e) {
			showToast("Permesso microfono negato. Abilitalo dalle impostazioni del browser.");
			return;
		}
		ownerRecordedChunks = [];
		try {
			ownerMediaRecorder = new MediaRecorder(ownerRecordingStream);
		} catch (e) {
			showToast("Impossibile avviare la registrazione su questo dispositivo.");
			ownerRecordingStream.getTracks().forEach((t) => t.stop());
			return;
		}
		ownerMediaRecorder.ondataavailable = (e) => {
			if (e.data && e.data.size > 0) ownerRecordedChunks.push(e.data);
		};
		ownerMediaRecorder.start();
		ownerRecordingSeconds = 0;
		document.getElementById("ochat-rec-timer").textContent = "0:00";
		document.getElementById("ochat-input-bar").style.display = "none";
		document.getElementById("ochat-recording-bar").classList.add("active");
		document.getElementById("ochat-emoji-picker").classList.remove("active");
		ownerRecordingTimer = setInterval(() => {
			ownerRecordingSeconds++;
			const limiteFree = chatColleghiAperta && !isPremium();
			document.getElementById("ochat-rec-timer").textContent = formatRecTimer(ownerRecordingSeconds) + (limiteFree ? " / 0:30" : "");
			if (limiteFree && ownerRecordingSeconds >= 30) {
				showToast("Piano Free: note vocali fino a 30 secondi.");
				stopAndSendOwnerVoiceRecording();
			}
		}, 1e3);
	}
	function stopOwnerRecordingInternal() {
		clearInterval(ownerRecordingTimer);
		ownerRecordingTimer = null;
		document.getElementById("ochat-input-bar").style.display = "flex";
		document.getElementById("ochat-recording-bar").classList.remove("active");
		if (ownerRecordingStream) {
			ownerRecordingStream.getTracks().forEach((t) => t.stop());
			ownerRecordingStream = null;
		}
	}
	function cancelOwnerVoiceRecording() {
		if (ownerMediaRecorder && ownerMediaRecorder.state !== "inactive") {
			ownerMediaRecorder.onstop = null;
			ownerMediaRecorder.stop();
		}
		ownerRecordedChunks = [];
		ownerMediaRecorder = null;
		stopOwnerRecordingInternal();
	}
	async function stopAndSendOwnerVoiceRecording() {
		if (!ownerMediaRecorder || ownerMediaRecorder.state === "inactive") return;
		const conversazioneId = currentConversazioneId;
		ownerMediaRecorder.onstop = async () => {
			stopOwnerRecordingInternal();
			if (ownerRecordedChunks.length === 0) {
				showToast("Registrazione troppo breve, riprova.");
				return;
			}
			const blob = new Blob(ownerRecordedChunks, { type: ownerMediaRecorder.mimeType || "audio/webm" });
			ownerRecordedChunks = [];
			ownerMediaRecorder = null;
			const { url, error } = await DB.uploadMediaProprietario(blob, conversazioneId, "audio", "webm");
			if (error || !url) {
				showToast("Errore nel caricamento della nota vocale.");
				return;
			}
			const { error: insertError } = await DB.insertMessaggioProprietario({
				conversazione_id: conversazioneId,
				tipo: "audio",
				media_url: url
			});
			if (insertError) {
				showToast(/Premium|piano Free/i.test(insertError.message || "") ? insertError.message : "Errore: " + insertError.message);
				return;
			}
			await renderOwnerChatThread(conversazioneId);
			await loadOwnerChatList();
		};
		ownerMediaRecorder.stop();
	}
	// equo-app-src/src/comune/chat/moduli/066-allegati-in-chat-foto-da-fotocamera-gall.js
	var allegatoChatTarget = null;
	function apriMenuAllegati(chat) {
		allegatoChatTarget = chat;
		const videoPremium = chat === "fchat" || chat === "schat" || chat === "ochat" && chatColleghiAperta || chat === "mchat" && isStrutturaCollegata(currentClienteId);
		const video = chat === "ochat" && !chatColleghiAperta || videoPremium && isPremium();
		document.getElementById("allegato-galleria").accept = video ? "image/*,video/*" : "image/*";
		document.getElementById("allegati-galleria-label").textContent = video ? "Foto o video dalla galleria" : "Foto dalla galleria";
		document.getElementById("allegati-video-premium").style.display = videoPremium && !isPremium() ? "flex" : "none";
		document.getElementById("allegati-overlay").classList.add("active");
	}
	function chiudiMenuAllegati() {
		document.getElementById("allegati-overlay").classList.remove("active");
	}
	function scegliAllegato(fonte) {
		chiudiMenuAllegati();
		document.getElementById("allegato-" + fonte).click();
	}
	function durataVideo(file) {
		return new Promise((ok) => {
			const v = document.createElement("video");
			const u = URL.createObjectURL(file);
			v.preload = "metadata";
			v.onloadedmetadata = () => {
				URL.revokeObjectURL(u);
				ok(v.duration || 0);
			};
			v.onerror = () => {
				URL.revokeObjectURL(u);
				ok(0);
			};
			v.src = u;
		});
	}
	async function allegatoScelto(event) {
		const file = event.target.files && event.target.files[0];
		event.target.value = "";
		const chat = allegatoChatTarget;
		if (!file || !chat) return;
		const isVideo = (file.type || "").startsWith("video/") || /\.(mp4|mov|m4v|webm|3gp)$/i.test(file.name || "");
		if (chat === "ochat" && isVideo) {
			if (bloccaPremiumColleghi("I video")) return;
			return handleOwnerChatMediaChange({ target: {
				files: [file],
				value: ""
			} });
		}
		if (isVideo) {
			if (!(chat === "fchat" || chat === "schat" || chat === "mchat" && isStrutturaCollegata(currentClienteId))) {
				showToast("Qui puoi allegare foto o documenti PDF.");
				return;
			}
			if (!isPremium()) {
				showToast("I video in chat sono inclusi in Equo Premium");
				togglePiano();
				return;
			}
			if (file.size > 52428800) {
				showToast("Video troppo pesante (max 50 MB): accorcialo o riprendilo a qualità più bassa.");
				return;
			}
			if (await durataVideo(file) > 62) {
				showToast("Video troppo lungo: massimo 1 minuto.");
				return;
			}
		}
		const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name || "");
		const isImg = (file.type || "").startsWith("image/") || /\.(jpe?g|png|heic|heif|webp)$/i.test(file.name || "");
		if (!isPdf && !isImg && !isVideo) {
			showToast("Puoi allegare foto o documenti PDF.");
			return;
		}
		if (isPdf && file.size > 10485760) {
			showToast("PDF troppo grande (max 10 MB).");
			return;
		}
		const tipo = isVideo ? "video" : isPdf ? "documento" : "foto";
		showToast(isVideo ? "Invio del video… (può volerci qualche secondo)" : isPdf ? "Invio del PDF…" : "Invio della foto…");
		const { url, nome, error: upErr } = await DB.uploadAllegatoChat(file, chat, tipo);
		if (upErr || !url) {
			showToast("Caricamento non riuscito: " + (upErr?.message || "riprova"));
			return;
		}
		let error = null;
		if (chat === "mchat" && currentClienteId) {
			({error} = await DB.insertMessaggioMascalcia({
				cliente_mascalcia_id: currentClienteId,
				tipo,
				file_url: url,
				file_nome: nome
			}));
			if (!error) {
				await renderChatThread(currentClienteId);
				await loadInboxMascalcia();
			}
		} else if (chat === "fchat" && currentFarrier) {
			({error} = await DB.inviaAllegatoAlManiscalco(currentFarrier.cliente_mascalcia_id, tipo, url, nome));
			if (!error) {
				await renderFarrierChatThread();
				loadFarrierChatSection();
			}
		} else if (chat === "schat" && currentStableMembro) {
			({error} = await DB.inviaMessaggioScuderia({
				centro_id: currentStableMembro.centro_id,
				membro_id: currentStableMembro.membro_id,
				tipo,
				file_url: url,
				file_nome: nome
			}));
			if (!error) {
				await renderStableChatThread();
				await loadStableChatSection();
			}
		} else if (chat === "ochat" && currentConversazioneId) {
			({error} = await DB.insertMessaggioProprietario({
				conversazione_id: currentConversazioneId,
				tipo,
				media_url: url,
				file_nome: isPdf ? nome : null
			}));
			if (!error) {
				await renderOwnerChatThread(currentConversazioneId);
				await aggiornaListeChatProprietari();
			}
		} else return;
		if (error) showToast("Invio non riuscito: " + (error.message || "riprova"));
	}
	async function sendMascalciaMessage() {
		const input = document.getElementById("mchat-input");
		const testo = input.value.trim();
		if (!currentClienteId) return;
		if (chatAllegatoEvento) {
			const ev = chatAllegatoEvento;
			showToast("Invio PDF in corso…");
			try {
				const { blob, nome } = ev.__conto ? await creaPdfConto(ev.__conto) : await creaPdfEvento(ev);
				const { url, error: upErr } = await DB.uploadDocumentoMascalcia(blob, currentClienteId);
				if (upErr || !url) {
					showToast("Errore caricamento PDF: " + (upErr?.message || ""));
					return;
				}
				const { error } = await DB.insertMessaggioMascalcia({
					cliente_mascalcia_id: currentClienteId,
					tipo: "documento",
					testo,
					file_url: url,
					file_nome: nome
				});
				if (error) {
					showToast("Errore: " + error.message);
					return;
				}
			} catch (err) {
				console.error("invio PDF:", err);
				showToast("Impossibile creare il PDF: " + (err?.message || err));
				return;
			}
			input.value = "";
			rimuoviAllegatoChat();
			await renderChatThread(currentClienteId);
			await loadInboxMascalcia();
			return;
		}
		if (!testo) return;
		input.value = "";
		input.focus();
		const clienteId = currentClienteId;
		const bolla = bollaInAttesa("mchat-messages", testo);
		const { error } = await DB.insertMessaggioMascalcia({
			cliente_mascalcia_id: clienteId,
			tipo: "testo",
			testo
		});
		if (error) {
			bollaNonInviata(bolla);
			showToast("Non inviato: " + error.message);
			return;
		}
		if (currentClienteId === clienteId) await aggiornaChatLive(false);
		loadInboxMascalcia();
	}
	// equo-app-src/src/comune/chat/moduli/078-condivisione-esterna-watermark-share-she.js
	function drawRoundedRect(ctx, x, y, w, h, r) {
		ctx.beginPath();
		ctx.moveTo(x + r, y);
		ctx.arcTo(x + w, y, x + w, y + h, r);
		ctx.arcTo(x + w, y + h, x, y + h, r);
		ctx.arcTo(x, y + h, x, y, r);
		ctx.arcTo(x, y, x + w, y, r);
		ctx.closePath();
	}
	async function shareContentExternally(mediaUrl) {
		showToast("Preparazione condivisione...");
		try {
			const img = new Image();
			img.crossOrigin = "anonymous";
			const loaded = new Promise((resolve, reject) => {
				img.onload = resolve;
				img.onerror = reject;
			});
			img.src = mediaUrl;
			await loaded;
			const canvas = document.createElement("canvas");
			canvas.width = img.naturalWidth || 800;
			canvas.height = img.naturalHeight || 600;
			const ctx = canvas.getContext("2d");
			ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
			const label = "Condiviso con Equo";
			const fontSize = Math.max(14, Math.round(canvas.width * .028));
			ctx.font = `600 ${fontSize}px sans-serif`;
			const textWidth = ctx.measureText(label).width;
			const padX = fontSize * .6, padY = fontSize * .45;
			const boxW = textWidth + padX * 2, boxH = fontSize + padY * 2;
			const margin = fontSize * .6;
			const x = canvas.width - boxW - margin;
			const y = canvas.height - boxH - margin;
			ctx.fillStyle = "rgba(0,0,0,0.45)";
			drawRoundedRect(ctx, x, y, boxW, boxH, boxH / 2);
			ctx.fill();
			ctx.fillStyle = "#ffffff";
			ctx.textBaseline = "middle";
			ctx.fillText(label, x + padX, y + boxH / 2 + 1);
			canvas.toBlob(async (blob) => {
				if (!blob) {
					showToast("Non sono riuscito a preparare l'immagine.");
					return;
				}
				const file = new File([blob], "equo-condiviso.jpg", { type: "image/jpeg" });
				if (navigator.canShare && navigator.canShare({ files: [file] })) try {
					await navigator.share({
						files: [file],
						text: "Guarda questa foto su Equo!"
					});
				} catch (e) {}
				else {
					const objUrl = URL.createObjectURL(blob);
					const a = document.createElement("a");
					a.href = objUrl;
					a.download = "equo-condiviso.jpg";
					document.body.appendChild(a);
					a.click();
					a.remove();
					showToast("Immagine scaricata — condividila dal tuo rullino.");
				}
			}, "image/jpeg", .92);
		} catch (e) {
			showToast("Non sono riuscito a preparare la condivisione. Riprova.");
		}
	}
	// equo-app-src/src/comune/chat/moduli/index.js
	Object.assign(window, {
		aggiornaChatLive,
		allegatoScelto,
		annullaRisposta,
		applicaThread,
		apriChatCollega,
		apriMenuAllegati,
		apriNuovoCollega,
		attrBolla,
		avviaChatCollega,
		avviaChatLive,
		avviaSpunte,
		bollaInAttesa,
		bollaNonInviata,
		cancelOwnerVoiceRecording,
		cancelVoiceRecording,
		chiudiMenuAllegati,
		citazioneHtml,
		closeChatThread,
		closeOwnerChatThread,
		computeChatUnreadTotal,
		consumaRisposta,
		contaNonLettiScuderia,
		fermaChatLive,
		formatChatDay,
		handleOwnerChatMediaChange,
		inizioThread,
		insertEmoji,
		invitaCollega,
		loadColleghiList,
		loadInboxMascalcia,
		openChatThread,
		openOwnerChatThread,
		oraBolla,
		refreshChatBadge,
		renderChatCartelle,
		renderChatCartelleBase,
		scegliAllegato,
		sceltaCartellaChat,
		segnaLettiChatApp,
		sendMascalciaMessage,
		sendOwnerChatMessage,
		shareContentExternally,
		shareInviteCodeFromChat,
		startNewChat,
		startOwnerVoiceRecording,
		startVoiceRecording,
		stopAndSendOwnerVoiceRecording,
		stopAndSendVoiceRecording,
		toggleEmojiPicker,
		vaiAlMessaggio
	});
})();

