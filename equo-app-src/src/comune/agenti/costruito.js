
// === GENERATO da equo-app-src/strumenti/costruisci-moduli.mjs: NON modificare qui, modificare comune/agenti/moduli/ ===
(function() {
	// equo-app-src/src/comune/agenti/moduli/080-ai-chat.js
	var DEMO_EVENT_TYPES = {
		vaccino: "vaccino",
		coggins: "coggins",
		ferratura: "ferratura",
		sverminazione: "sverminazione"
	};
	function detectDemoEvent(text) {
		const t = text.toLowerCase();
		const type = Object.keys(DEMO_EVENT_TYPES).find((k) => t.includes(k));
		if (!type) return null;
		const dateMatch = t.match(/(\d{4}-\d{2}-\d{2})|(\d{1,2}\/\d{1,2}\/\d{2,4})/);
		const horse = horses.find((h) => t.includes((h.name || "").toLowerCase()));
		if (!horse) return null;
		let date = isoLocale(/* @__PURE__ */ new Date());
		if (dateMatch) {
			if (dateMatch[1]) date = dateMatch[1];
			else if (dateMatch[2]) {
				const [d, m, y] = dateMatch[2].split("/");
				date = `${y.length === 2 ? "20" + y : y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
			}
		}
		return {
			horse_name: horse.name,
			type,
			date,
			next_due_date: null,
			notes: null
		};
	}
	// equo-app-src/src/comune/agenti/moduli/083-chat-a-giorni.js
	var aiConvId = null;
	var aiConvInfo = null;
	var aiConvRiaperta = false;
	var aiArchivio = [];
	var aiArchCerca = "";
	var aiArchTimer = null;
	var aiArchTrovate = null;
	var aiSqlPronto = true;
	var MESI_IT = [
		"gennaio",
		"febbraio",
		"marzo",
		"aprile",
		"maggio",
		"giugno",
		"luglio",
		"agosto",
		"settembre",
		"ottobre",
		"novembre",
		"dicembre"
	];
	var oggiRoma = () => (/* @__PURE__ */ new Date()).toLocaleDateString("sv-SE", { timeZone: "Europe/Rome" });
	var giornoLungo = (iso) => {
		const [y, m, d] = iso.split("-").map(Number);
		return new Date(y, m - 1, d).toLocaleDateString("it-IT", {
			weekday: "long",
			day: "numeric",
			month: "long"
		});
	};
	var giornoBreve = (iso) => {
		const [y, m, d] = iso.split("-").map(Number);
		return `${d} ${MESI_IT[m - 1].slice(0, 3)}`;
	};
	var sqlMancante = (e) => /ai_conversazioni|conversazione_id|importante|does not exist|schema cache/i.test(e?.message || "");
	async function aiConvDelGiorno() {
		const { data, error } = await sb.from("ai_conversazioni").select("id, titolo, giorno, fissata, n_messaggi").eq("user_id", currentUser.id).eq("vista", vistaAi()).eq("chiave", "").eq("giorno", oggiRoma()).order("aggiornata_il", { ascending: false }).limit(1);
		if (error) {
			if (sqlMancante(error)) aiSqlPronto = false;
			return null;
		}
		return data?.[0] || null;
	}
	function aiBollaHtml(m) {
		if (m.ruolo === "user") return `<div class="chat-bubble user">${escapeHtml(m.contenuto)}</div>`;
		const imp = m.importante;
		const tasti = imp && m.azione && typeof pmTastiChat === "function" ? pmTastiChat(m.azione) : "";
		return `<div class="chat-bubble ai${imp ? " importante" : ""}" data-msg="${m.id || ""}">${imp ? "<div class=\"ai-imp-testa\">Messaggio importante</div>" : ""}${formattaRispostaAi(m.contenuto)}${tasti}</div>`;
	}
	async function caricaChatAiGiorni() {
		if (DEMO_MODE || !currentUser) return false;
		const box = document.getElementById("chat-messages");
		let conv = null;
		if (aiConvId) {
			const { data, error } = await sb.from("ai_conversazioni").select("id, titolo, giorno, fissata, n_messaggi").eq("id", aiConvId).maybeSingle();
			if (error && sqlMancante(error)) {
				aiSqlPronto = false;
				return false;
			}
			conv = data || null;
			if (!conv) aiConvId = null;
		}
		if (!conv) conv = await aiConvDelGiorno();
		if (!aiSqlPronto) return false;
		aiConvInfo = conv;
		box.querySelectorAll(".chat-bubble:not(#ai-benvenuto), .hp-scelte, .ai-ripresa").forEach((el) => el.remove());
		if (conv) {
			const { data: msg, error } = await sb.from("ai_messaggi").select("id, ruolo, contenuto, importante, letto_at, azione, created_at").eq("conversazione_id", conv.id).order("created_at", { ascending: true }).limit(300);
			if (error) {
				console.error("chat agente:", error);
				return true;
			}
			if (conv.giorno !== oggiRoma()) box.insertAdjacentHTML("beforeend", `<div class="ai-ripresa">Stai riprendendo la chat del <b>${giornoLungo(conv.giorno)}</b>: ${escapeHtml(nomeAgenteAi())} ricorda i suoi messaggi. Scrivendo qui la conversazione continua in questa chat. <button type="button" onclick="aiTornaAOggi()">Torna a oggi</button></div>`);
			(msg || []).forEach((m) => box.insertAdjacentHTML("beforeend", aiBollaHtml(m)));
			const daLeggere = (msg || []).filter((m) => m.importante && !m.letto_at).map((m) => m.id);
			if (daLeggere.length) {
				await sb.rpc("ai_segna_importanti_letti", { p_ids: daLeggere });
				aiControllaImportanti();
			}
		}
		aiAggiornaTestataChat();
		box.scrollTop = box.scrollHeight;
		aiContaArchivio();
		return true;
	}
	function aiAggiornaTestataChat() {
		const el = document.getElementById("ai-chat-sotto");
		if (!el) return;
		const c = aiConvInfo;
		el.textContent = !c || c.giorno === oggiRoma() ? c?.titolo ? c.titolo + " · oggi" : "Oggi · " + giornoLungo(oggiRoma()) : (c.titolo || "Chat") + " · " + giornoBreve(c.giorno);
	}
	function aiConvDaRisposta(conv) {
		if (!conv?.id) return;
		const nuova = !aiConvInfo || aiConvInfo.id !== conv.id;
		aiConvId = conv.id;
		aiConvInfo = {
			...aiConvInfo && !nuova ? aiConvInfo : {},
			id: conv.id,
			titolo: conv.titolo || aiConvInfo?.titolo || null,
			giorno: conv.giorno || aiConvInfo?.giorno || oggiRoma()
		};
		aiAggiornaTestataChat();
		if (nuova) aiContaArchivio();
	}
	function aiConvPerInvio() {
		return aiSqlPronto ? aiConvId : null;
	}
	function aiServeRicarica() {
		if (aiConvInfo && aiConvInfo.giorno !== oggiRoma() && !aiConvRiaperta) {
			aiConvId = null;
			return true;
		}
		return document.body.classList.contains("ai-con-importante");
	}
	async function aiNuovaChat() {
		if (DEMO_MODE || !currentUser || !aiSqlPronto) return typeof nuovaConversazioneAi === "function" ? nuovaConversazioneAi() : null;
		const box = document.getElementById("chat-messages");
		if (!box.querySelector(".chat-bubble:not(#ai-benvenuto)") && (!aiConvInfo || aiConvInfo.giorno === oggiRoma())) {
			showToast("Sei già in una chat nuova");
			return;
		}
		const { data, error } = await sb.from("ai_conversazioni").insert({
			user_id: currentUser.id,
			vista: vistaAi(),
			chiave: ""
		}).select("id, titolo, giorno, fissata").single();
		if (error) {
			showToast("Non sono riuscito ad aprire una chat nuova, riprova.");
			return;
		}
		aiConvId = data.id;
		aiConvInfo = data;
		aiConvRiaperta = false;
		box.querySelectorAll(".chat-bubble:not(#ai-benvenuto), .hp-scelte, .ai-ripresa").forEach((el) => el.remove());
		aiAggiornaTestataChat();
		aiContaArchivio();
		showToast("Chat nuova: la precedente è nello storico");
		document.getElementById("chat-input")?.focus();
	}
	async function aiTornaAOggi() {
		aiConvId = null;
		aiConvRiaperta = false;
		await caricaChatAiGiorni();
	}
	async function aiContaArchivio() {
		const el = document.getElementById("ai-arch-n");
		if (!el || DEMO_MODE || !currentUser || !aiSqlPronto) return;
		const { count } = await sb.from("ai_conversazioni").select("id", {
			count: "exact",
			head: true
		}).eq("user_id", currentUser.id).eq("vista", vistaAi()).eq("chiave", "").gt("n_messaggi", 0);
		el.textContent = count ? String(count) : "";
	}
	async function aiApriArchivio() {
		const arch = document.getElementById("ai-arch");
		if (!arch) return;
		if (!aiSqlPronto) {
			showToast("Lo storico delle chat arriva con l'aggiornamento di Equo.");
			return;
		}
		document.getElementById("ai-arch-tit").textContent = "Chat con " + nomeAgenteAi();
		document.getElementById("ai-arch-cerca").value = aiArchCerca = "";
		aiArchTrovate = null;
		arch.hidden = false;
		document.getElementById("ai-arch-lista").innerHTML = "<div class=\"loading\"><div class=\"spinner\"></div> Carico le chat…</div>";
		const { data, error } = await sb.from("ai_conversazioni").select("id, titolo, giorno, fissata, n_messaggi, aggiornata_il").eq("user_id", currentUser.id).eq("vista", vistaAi()).eq("chiave", "").order("aggiornata_il", { ascending: false }).limit(300);
		if (error) {
			document.getElementById("ai-arch-lista").innerHTML = "<div class=\"muted\">Non riesco a leggere lo storico, riprova.</div>";
			return;
		}
		aiArchivio = (data || []).filter((c) => c.n_messaggi > 0 || c.id === aiConvInfo?.id);
		document.getElementById("ai-arch-sotto").textContent = `${aiArchivio.length} chat nello storico`;
		aiDisegnaArchivio();
	}
	function aiChiudiArchivio() {
		const a = document.getElementById("ai-arch");
		if (a) a.hidden = true;
	}
	function aiCercaArchivio(v) {
		aiArchCerca = String(v || "").trim();
		clearTimeout(aiArchTimer);
		aiArchTimer = setTimeout(async () => {
			if (aiArchCerca.length < 2) {
				aiArchTrovate = null;
				return aiDisegnaArchivio();
			}
			const q = aiArchCerca.replace(/[%_,()]/g, " ");
			const { data } = await sb.from("ai_messaggi").select("conversazione_id").eq("user_id", currentUser.id).eq("vista", vistaAi()).ilike("contenuto", `%${q}%`).limit(500);
			aiArchTrovate = new Set((data || []).map((r) => r.conversazione_id));
			aiDisegnaArchivio();
		}, 250);
	}
	function aiDisegnaArchivio() {
		const box = document.getElementById("ai-arch-lista");
		if (!box) return;
		const q = aiArchCerca.toLowerCase();
		const lista = aiArchivio.filter((c) => !aiArchTrovate || aiArchTrovate.has(c.id) || (c.titolo || "").toLowerCase().includes(q));
		const oggi = oggiRoma();
		const lun = (() => {
			const d = /* @__PURE__ */ new Date();
			d.setDate(d.getDate() - (d.getDay() + 6) % 7);
			return d.toLocaleDateString("sv-SE");
		})();
		const gruppi = [];
		const metti = (t, c) => {
			let g = gruppi.find((x) => x.t === t);
			if (!g) gruppi.push(g = {
				t,
				l: []
			});
			g.l.push(c);
		};
		lista.forEach((c) => {
			if (c.id === aiConvInfo?.id && c.giorno === oggi) metti("In corso", c);
			else if (c.fissata) metti("Fissate", c);
			else if (c.giorno === oggi) metti("Oggi", c);
			else if (c.giorno >= lun) metti("Questa settimana", c);
			else {
				const [y, m] = c.giorno.split("-").map(Number);
				metti(MESI_IT[m - 1][0].toUpperCase() + MESI_IT[m - 1].slice(1) + (y !== (/* @__PURE__ */ new Date()).getFullYear() ? " " + y : ""), c);
			}
		});
		const ordine = [
			"In corso",
			"Fissate",
			"Oggi",
			"Questa settimana"
		];
		gruppi.sort((a, b) => (ordine.indexOf(a.t) + 1 || 99) - (ordine.indexOf(b.t) + 1 || 99));
		const quando = (c) => c.giorno === oggi ? new Date(c.aggiornata_il).toLocaleTimeString("it-IT", {
			hour: "2-digit",
			minute: "2-digit"
		}) : c.giorno >= lun ? (/* @__PURE__ */ new Date(c.giorno + "T12:00")).toLocaleDateString("it-IT", {
			weekday: "short",
			day: "numeric"
		}) : giornoBreve(c.giorno);
		box.innerHTML = !lista.length ? `<div class="ai-arch-vuoto">${aiArchCerca ? "Nessuna chat con «" + escapeHtml(aiArchCerca) + "»" : "Ancora nessuna chat nello storico"}</div>` : gruppi.map((g) => `<div class="ai-arch-g">${escapeHtml(g.t)}</div>` + g.l.map((c) => `
      <div class="ai-arch-r${c.id === aiConvInfo?.id ? " corrente" : ""}" data-id="${c.id}">
        <button type="button" class="ai-arch-apri" onclick="aiRiapriChat('${c.id}')">
          <span class="ai-arch-ic">${c.fissata ? "📌" : "💬"}</span>
          <span class="ai-arch-c"><b>${escapeHtml(c.titolo || "Chat del " + giornoBreve(c.giorno))}</b><small>${c.n_messaggi} ${c.n_messaggi === 1 ? "messaggio" : "messaggi"}</small></span>
          <span class="ai-arch-q">${quando(c)}</span>
        </button>
        <button type="button" class="ai-arch-piu" onclick="aiMenuChat('${c.id}')" aria-label="Altre azioni">⋯</button>
      </div>`).join("")).join("");
	}
	async function aiRiapriChat(id) {
		const c = aiArchivio.find((x) => x.id === id);
		aiConvId = id;
		aiConvRiaperta = !!c && c.giorno !== oggiRoma();
		aiChiudiArchivio();
		await caricaChatAiGiorni();
	}
	function aiMenuChat(id) {
		const r = document.querySelector(`.ai-arch-r[data-id="${id}"]`);
		const c = aiArchivio.find((x) => x.id === id);
		if (!r || !c) return;
		const aperto = r.nextElementSibling?.classList.contains("ai-arch-menu");
		document.querySelectorAll(".ai-arch-menu").forEach((m) => m.remove());
		if (aperto) return;
		r.insertAdjacentHTML("afterend", `<div class="ai-arch-menu">
    <input class="input" id="ai-ren-${id}" maxlength="70" value="${escapeHtml(c.titolo || "")}" placeholder="Nome della chat">
    <div class="ai-arch-menu-a">
      <button type="button" class="btn btn-primary btn-sm" onclick="aiRinominaChat('${id}')">Rinomina</button>
      <button type="button" class="btn btn-outline btn-sm" onclick="aiFissaChat('${id}')">${c.fissata ? "Togli dalle fissate" : "📌 Fissa"}</button>
      <button type="button" class="btn btn-outline btn-sm ai-rosso" onclick="aiEliminaChat('${id}')">Elimina</button>
    </div></div>`);
	}
	async function aiRinominaChat(id) {
		const t = (document.getElementById("ai-ren-" + id)?.value || "").replace(/\s+/g, " ").trim().slice(0, 70);
		if (!t) {
			showToast("Scrivi un nome");
			return;
		}
		const { error } = await sb.from("ai_conversazioni").update({
			titolo: t,
			titolo_manuale: true
		}).eq("id", id);
		if (error) {
			showToast("Non salvato, riprova");
			return;
		}
		const c = aiArchivio.find((x) => x.id === id);
		if (c) c.titolo = t;
		if (aiConvInfo?.id === id) {
			aiConvInfo.titolo = t;
			aiAggiornaTestataChat();
		}
		showToast("Chat rinominata");
		aiDisegnaArchivio();
	}
	async function aiFissaChat(id) {
		const c = aiArchivio.find((x) => x.id === id);
		if (!c) return;
		const { error } = await sb.from("ai_conversazioni").update({ fissata: !c.fissata }).eq("id", id);
		if (error) {
			showToast("Non salvato, riprova");
			return;
		}
		c.fissata = !c.fissata;
		showToast(c.fissata ? "Chat fissata in alto" : "Tolta dalle fissate");
		aiDisegnaArchivio();
	}
	async function aiEliminaChat(id) {
		const c = aiArchivio.find((x) => x.id === id);
		if (!c) return;
		if (!confirm(`Eliminare la chat «${c.titolo || "Chat del " + giornoBreve(c.giorno)}»? I messaggi si cancellano; le note che ${nomeAgenteAi()} ha memorizzato restano.`)) return;
		const { error } = await sb.from("ai_conversazioni").delete().eq("id", id);
		if (error) {
			showToast("Non eliminata, riprova");
			return;
		}
		aiArchivio = aiArchivio.filter((x) => x.id !== id);
		if (aiConvInfo?.id === id) {
			aiConvId = null;
			aiConvRiaperta = false;
			await caricaChatAiGiorni();
		}
		showToast("Chat eliminata");
		aiDisegnaArchivio();
		aiContaArchivio();
	}
	var aiImpTimer = null;
	async function aiControllaImportanti() {
		if (DEMO_MODE || !currentUser || !aiSqlPronto) return;
		const { count, error } = await sb.from("ai_messaggi").select("id", {
			count: "exact",
			head: true
		}).eq("user_id", currentUser.id).eq("vista", vistaAi()).eq("importante", true).is("letto_at", null);
		if (error) {
			if (sqlMancante(error)) aiSqlPronto = false;
			return;
		}
		aiMostraImportante(count || 0);
	}
	function aiMostraImportante(n) {
		document.body.classList.toggle("ai-con-importante", n > 0);
		[document.getElementById("nav-hammer"), document.getElementById("ai-fab")].filter(Boolean).forEach((el) => {
			let tag = el.querySelector(":scope > .ai-imp-tag");
			if (n > 0 && !tag) {
				tag = document.createElement("span");
				tag.className = "ai-imp-tag";
				el.appendChild(tag);
			}
			if (tag) {
				if (n > 0) tag.textContent = n > 1 ? `${n} messaggi importanti` : "Messaggio importante";
				else tag.remove();
			}
		});
	}
	function aiAvviaControlloImportanti() {
		clearInterval(aiImpTimer);
		aiControllaImportanti();
		aiImpTimer = setInterval(() => {
			if (document.visibilityState === "visible" && currentUser) aiControllaImportanti();
		}, 6e4);
	}
	// equo-app-src/src/comune/agenti/moduli/082-analizza-una-foto-focus.js
	var HP_SCATTI = [
		{
			k: "laterale",
			t: "Laterale",
			g: "Zoccolo di lato, a terra, telefono all'altezza del piede"
		},
		{
			k: "frontale",
			t: "Frontale",
			g: "Di fronte, a terra, tutto il piede dentro la guida"
		},
		{
			k: "suola",
			t: "Suola",
			g: "Piede alzato e pulito, suola al centro"
		},
		{
			k: "lastra",
			t: "Lastra",
			g: "Radiografia dritta, tutta dentro la guida"
		}
	];
	var hpFoto = {
		scatto: "laterale",
		url: null,
		testo: null,
		via: false
	};
	function hpApriFoto() {
		hpFineCaso();
		hpFoto = {
			scatto: "laterale",
			url: null,
			testo: null,
			via: false
		};
		document.getElementById("hp-f-cav").textContent = hpContesto ? hpContesto.nome : "";
		document.getElementById("hp-f-img").hidden = true;
		document.getElementById("hp-f-img").removeAttribute("src");
		document.getElementById("hp-f-nota").value = "";
		document.getElementById("hp-f-via").disabled = true;
		document.getElementById("hp-f-passo1").hidden = false;
		document.getElementById("hp-f-passo2").hidden = true;
		const free = !isPremium();
		document.getElementById("hp-f-costo").textContent = free ? "Nel piano Free un'analisi foto vale 3 messaggi." : "Con Premium l'analisi foto vale 1 messaggio.";
		hpScatto("laterale");
		document.getElementById("hp-focus").classList.add("on");
	}
	function hpChiudiFoto() {
		document.getElementById("hp-focus")?.classList.remove("on");
		clearInterval(hpFoto.timer);
	}
	function hpScatto(k) {
		hpFoto.scatto = k;
		document.getElementById("hp-f-scatti").innerHTML = HP_SCATTI.map((x) => `<button type="button" class="${x.k === k ? "on" : ""}" onclick="hpScatto('${x.k}')">${x.t}</button>`).join("");
		document.getElementById("hp-f-guida").textContent = HP_SCATTI.find((x) => x.k === k).g;
		document.getElementById("hp-f-guida").hidden = !!hpFoto.url;
	}
	async function hpFotoScelta(input) {
		const f = input.files && input.files[0];
		input.value = "";
		if (!f) return;
		if (!(f.type || "").startsWith("image/")) {
			showToast("Serve una foto.");
			return;
		}
		try {
			hpFoto.url = await riduciImmagine(f);
		} catch (e) {
			showToast("Non riesco a leggere la foto, riprova.");
			return;
		}
		const img = document.getElementById("hp-f-img");
		img.src = hpFoto.url;
		img.hidden = false;
		document.getElementById("hp-f-guida").hidden = true;
		document.getElementById("hp-f-via").disabled = false;
	}
	async function hpAnalizza() {
		if (!hpFoto.url || hpFoto.via) return;
		hpFoto.via = true;
		const scatto = HP_SCATTI.find((x) => x.k === hpFoto.scatto);
		const nota = document.getElementById("hp-f-nota").value.trim();
		document.getElementById("hp-f-passo1").hidden = true;
		document.getElementById("hp-f-passo2").hidden = false;
		document.getElementById("hp-f-attesa").hidden = false;
		document.getElementById("hp-f-esito").hidden = true;
		document.getElementById("hp-f-img2").src = hpFoto.url;
		const li = [...document.querySelectorAll("#hp-f-attesa .hp-f-step li")];
		li.forEach((x) => x.classList.remove("ok"));
		let k = 0;
		clearInterval(hpFoto.timer);
		hpFoto.timer = setInterval(() => {
			if (li[k]) li[k++].classList.add("ok");
		}, 2200);
		const testo = `Analisi foto · scatto ${scatto.t.toLowerCase()}${hpContesto && hpContesto.tipo === "cavallo" ? " · " + hpContesto.nome : ""}${nota ? " · " + nota : ""}`;
		let data = {};
		try {
			if (DEMO_MODE) {
				await new Promise((r) => setTimeout(r, 1200));
				data = {
					reply: "## Cosa si vede\n- Punta lunga, talloni bassi\n- Asse zoccolo-pastorale spezzato all'indietro\n## Da controllare\n- Angolo dei talloni sull'altro piede\n- Linea bianca in punta\n## Cosa fare\n- Accorciare la punta e arretrare il punto di stacco\n- Valutare un ferro a rotolamento facilitato\n## Limiti\n- Foto un po' dall'alto: rifai lo scatto laterale a terra\nAffidabilità: media",
					uso: {
						usati: 3,
						limite: 5,
						periodo: "giorno"
					}
				};
			} else {
				const res = await fetch("/.netlify/functions/agent", {
					method: "POST",
					headers: await authHeaders(),
					body: JSON.stringify({
						message: testo,
						vista: vistaAi(),
						modalita: "foto",
						allegati: [{
							media_type: "image/jpeg",
							data: hpFoto.url.split(",")[1]
						}],
						contesto_app: hpContesto ? hpContesto.testo : null,
						conversazione_id: aiConvPerInvio()
					})
				});
				data = await res.json().catch(() => ({}));
				if (data.conversazione) aiConvDaRisposta(data.conversazione);
				if (res.status === 413) data = {
					reply: null,
					errore: "Foto troppo pesante: riprova con un'altra."
				};
				else if (!res.ok && !data.reply) data = {
					reply: null,
					errore: "Non riesco ad analizzare la foto adesso, riprova tra poco."
				};
			}
		} catch (e) {
			data = {
				reply: null,
				errore: "Errore di connessione, riprova."
			};
		}
		clearInterval(hpFoto.timer);
		li.forEach((x) => x.classList.add("ok"));
		hpFoto.via = false;
		if (data.uso) aggiornaNotaUsoAi(data.uso);
		const es = document.getElementById("hp-f-esito");
		document.getElementById("hp-f-attesa").hidden = true;
		es.hidden = false;
		if (data.limite_raggiunto) {
			es.innerHTML = hpLimiteHtml(data).replace("chat-bubble ai ", "");
			return;
		}
		if (!data.reply || data.errore) {
			es.innerHTML = `<div class="hp-es-disc">${escapeHtml(data.errore || "Non sono riuscito ad analizzare la foto, riprova.")}</div><button type="button" class="hp-b o" onclick="hpApriFoto()">Riprova</button>`;
			return;
		}
		hpFoto.testo = data.reply;
		hpFoto.titolo = testo;
		es.innerHTML = hpEsitoHtml(data.reply);
		const box = document.getElementById("chat-messages");
		box.insertAdjacentHTML("beforeend", `<div class="chat-bubble user hp-foto-msg"><div class="ai-thumbs"><img src="${hpFoto.url}" alt=""></div>${escapeHtml(testo)}</div><div class="chat-bubble ai hp-foto-msg">${formattaRispostaAi(data.reply)}</div>`);
		box.scrollTop = box.scrollHeight;
	}
	var HP_SEZ = [
		["Cosa si vede", "<path d=\"M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z\"/><circle cx=\"12\" cy=\"12\" r=\"3\"/>"],
		["Da controllare", "<path d=\"M9 11l3 3 8-8\"/><path d=\"M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9\"/>"],
		["Cosa fare", "<path d=\"m15 12-8.373 8.373a1 1 0 1 1-3-3L12 9\"/><path d=\"m18 15 4-4\"/><path d=\"m21.5 11.5-1.914-1.914A2 2 0 0 1 19 8.172V7l-2.26-2.26a6 6 0 0 0-4.202-1.756L9 2.96l.92.82A6.18 6.18 0 0 1 12 8.4V10l2 2h1.172a2 2 0 0 1 1.414.586L18.5 14.5\"/>"],
		["Limiti", "<path d=\"M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z\"/><path d=\"M12 9v4M12 17h.01\"/>"]
	];
	function hpSezioni(testo) {
		const out = {};
		let cur = null;
		String(testo || "").split("\n").forEach((r) => {
			const h = r.match(/^#{1,4}\s*(.+?)\s*$/);
			if (h) {
				cur = HP_SEZ.find((s) => h[1].toLowerCase().startsWith(s[0].toLowerCase()))?.[0] || h[1];
				out[cur] = out[cur] || [];
				return;
			}
			if (/^\s*\**Affidabilit/i.test(r)) return;
			const t = r.replace(/^\s*[-*•]\s*/, "").trim();
			if (t && cur) out[cur].push(t);
		});
		const m = String(testo || "").match(/Affidabilit[àa]:\s*\**\s*(alta|media|bassa)/i);
		return {
			sez: out,
			aff: m ? m[1].toLowerCase() : null
		};
	}
	function hpEsitoHtml(testo) {
		const { sez, aff } = hpSezioni(testo);
		const AFF = {
			alta: ["100%", "#1f8a52"],
			media: ["62%", "#e2ab45"],
			bassa: ["28%", "#c94b40"]
		};
		const corpo = Object.keys(sez).length ? Object.entries(sez).map(([t, r]) => {
			const ic = HP_SEZ.find((s) => s[0] === t)?.[1] || "";
			return `<div class="hp-es-sez"><h4>${ic ? `<svg class="hm-svg" viewBox="0 0 24 24">${ic}</svg>` : ""}${escapeHtml(t)}</h4><ul>${r.map((x) => `<li>${formattaRispostaAi(x).replace(/^<p>|<\/p>$/g, "")}</li>`).join("")}</ul></div>`;
		}).join("") : `<div class="hp-es-sez">${formattaRispostaAi(testo)}</div>`;
		return (hpFoto.url ? `<img src="${hpFoto.url}" alt="" style="width:100%;border-radius:18px;margin-bottom:10px;max-height:260px;object-fit:cover">` : "") + (aff ? `<div class="hp-es-aff" style="--v:${AFF[aff][0]};--c:${AFF[aff][1]}">Affidabilità ${aff} <i></i></div>` : "") + corpo + `<div class="hp-es-disc">Valutazione indicativa, non una diagnosi: la decisione resta tua sul cavallo. Per zoppie o infezioni coinvolgi il veterinario.</div>
    <button type="button" class="hp-b v" onclick="hpPdf()"><svg class="hm-svg" viewBox="0 0 24 24"><path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></svg>Scarica PDF (solo per te)</button>
    ${hpContesto && hpContesto.tipo === "cavallo" ? `<button type="button" class="hp-b o" onclick="hpCondividi(this)"><svg class="hm-svg" viewBox="0 0 24 24"><path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2zM22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z"/></svg>Condividi nel libretto di ${escapeHtml(hpContesto.nome)}</button>` : ""}
    <button type="button" class="hp-b r" onclick="hpElimina()"><svg class="hm-svg" viewBox="0 0 24 24"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>Elimina</button>`;
	}
	async function hpCreaPdf() {
		const doc = new (await (caricaJsPdf()))({
			unit: "mm",
			format: "a4"
		});
		const { sez, aff } = hpSezioni(hpFoto.testo);
		const pulito = (t) => String(t || "").replace(/\*\*|__|\*/g, "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/[^\x20-\x7E -ÿ€’“”«»–—…]/g, "");
		let y = 18;
		doc.setFont("helvetica", "bold");
		doc.setFontSize(17);
		doc.setTextColor(20, 72, 44);
		doc.text("Analisi foto · Hammer", 15, y);
		y += 7;
		doc.setFont("helvetica", "normal");
		doc.setFontSize(10);
		doc.setTextColor(110, 95, 60);
		doc.text(pulito([
			hpContesto && hpContesto.tipo === "cavallo" ? hpContesto.nome : null,
			(/* @__PURE__ */ new Date()).toLocaleDateString("it-IT", {
				day: "numeric",
				month: "long",
				year: "numeric"
			}),
			aff ? "affidabilità " + aff : null
		].filter(Boolean).join(" · ")), 15, y);
		y += 6;
		try {
			const img = await new Promise((ok, ko) => {
				const i = new Image();
				i.onload = () => ok(i);
				i.onerror = ko;
				i.src = hpFoto.url;
			});
			const w = 90, h = Math.min(90, w * img.height / img.width);
			doc.addImage(hpFoto.url, "JPEG", 15, y, h < w * img.height / img.width ? h * img.width / img.height : w, h);
			y += h + 6;
		} catch (e) {}
		doc.setTextColor(40, 30, 10);
		Object.entries(sez).forEach(([t, righe]) => {
			if (y > 265) {
				doc.addPage();
				y = 18;
			}
			doc.setFont("helvetica", "bold");
			doc.setFontSize(12);
			doc.text(pulito(t), 15, y);
			y += 6;
			doc.setFont("helvetica", "normal");
			doc.setFontSize(10.5);
			righe.forEach((r) => {
				doc.splitTextToSize("• " + pulito(r), 180).forEach((l) => {
					if (y > 280) {
						doc.addPage();
						y = 18;
					}
					doc.text(l, 15, y);
					y += 5;
				});
			});
			y += 2;
		});
		if (y > 268) {
			doc.addPage();
			y = 18;
		}
		doc.setFontSize(9);
		doc.setTextColor(110, 95, 60);
		doc.splitTextToSize("Valutazione indicativa da foto, non una diagnosi: la decisione resta del maniscalco sul cavallo. Per zoppie o infezioni coinvolgere il veterinario. Generato con Equo.", 180).forEach((l) => {
			doc.text(l, 15, y);
			y += 4.5;
		});
		return {
			doc,
			nome: "Equo_analisi-foto_" + String(hpContesto && hpContesto.tipo === "cavallo" ? hpContesto.nome : "cavallo").normalize("NFD").replace(/[^\w]+/g, "-") + "_" + isoLocale(/* @__PURE__ */ new Date()) + ".pdf"
		};
	}
	async function hpPdf() {
		try {
			const { doc, nome } = await hpCreaPdf();
			doc.save(nome);
			showToast("PDF salvato sul telefono");
		} catch (e) {
			showToast("PDF non disponibile: " + (e.message || "riprova"));
		}
	}
	async function hpCondividi(btn) {
		if (!hpContesto || hpContesto.tipo !== "cavallo") return;
		if (DEMO_MODE) {
			showToast("In demo il libretto non si aggiorna.");
			return;
		}
		if (!await chiediSiNo(`Condividere nel libretto di ${hpContesto.nome}?`, "La vedranno anche il proprietario collegato e la scuderia dove sta il cavallo. Resta nello storico.")) return;
		btn.disabled = true;
		try {
			const { doc, nome } = await hpCreaPdf();
			const blob = doc.output("blob");
			let id = hpContesto.cv.id;
			if (!id) {
				({cavallo_cliente_id: id} = await DB.risolviCavalloPerIntervento(hpContesto.clienteId, hpContesto.cv));
				hpContesto.cv.id = id;
			}
			if (!id) {
				showToast("Non riuscito, riprova.");
				return;
			}
			const path = `${currentUser.id}/${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}.pdf`;
			const up = await sb.storage.from("cavalli-allegati").upload(path, blob, { contentType: "application/pdf" });
			if (up.error) {
				showToast("Caricamento non riuscito: " + up.error.message);
				return;
			}
			const { data, error } = await sb.rpc("equo_aggiungi_allegato", {
				p_vista: "maniscalco",
				p_id: id,
				p_nome: nome,
				p_path: path,
				p_mime: "application/pdf",
				p_byte: blob.size
			});
			if (error || !data?.ok) {
				await sb.storage.from("cavalli-allegati").remove([path]);
				showToast(data && data.errore || "Non riuscito, riprova.");
				return;
			}
			showToast(`Analisi nel libretto di ${hpContesto.nome}`);
			btn.textContent = "✓ Nel libretto";
			if (document.getElementById("cavpro-allegati") && typeof caricaAllegatiCavallo === "function") caricaAllegatiCavallo("cavpro-allegati", "maniscalco", hpContesto.cv);
		} finally {
			if (btn.textContent !== "✓ Nel libretto") btn.disabled = false;
		}
	}
	async function hpElimina() {
		if (!await chiediSiNo("Eliminare questa analisi?", "Sparisce dalla chat di Hammer. Se l'hai condivisa nel libretto, l'allegato resta lì.")) return;
		if (!DEMO_MODE && currentUser) {
			const { data } = await sb.from("ai_messaggi").select("id, ruolo, contenuto").eq("user_id", currentUser.id).eq("vista", vistaAi()).order("created_at", { ascending: false }).limit(2);
			const ultimi = data || [];
			if (ultimi.length === 2 && ultimi.some((m) => m.ruolo === "user" && /^📷 Analisi foto/.test(m.contenuto || ""))) {
				const { error } = await sb.from("ai_messaggi").delete().in("id", ultimi.map((m) => m.id));
				if (error) {
					showToast("Non sono riuscito a eliminarla, riprova.");
					return;
				}
			}
		}
		[...document.querySelectorAll("#chat-messages .hp-foto-msg")].slice(-2).forEach((el) => el.remove());
		hpFoto = {
			scatto: "laterale",
			url: null,
			testo: null,
			via: false
		};
		hpChiudiFoto();
		showToast("Analisi eliminata");
	}
	var aiAzioniInAttesa = {};
	var CAT_SPESA_LABEL = {
		pensione: "Pensione",
		mangime: "Mangime",
		veterinario: "Veterinario",
		maniscalco: "Maniscalco",
		attrezzatura: "Attrezzatura",
		altro: "Altro"
	};
	var ETICHETTA_CONFERMA_AI = {
		richiesta_maniscalco: () => "Invia richiesta",
		accetta_richiesta: () => "Accetta",
		rifiuta_richiesta: () => "Rifiuta",
		promemoria: (x) => x.collegato ? "Invia in chat" : "Copia testo",
		saldato: () => "Segna saldato",
		promemoria_personale: () => "Salva promemoria"
	};
	var AZIONE_PM = {
		conto: "con il tasto «Fai il conto»",
		chat: "con il tasto «Scrivi al cliente»",
		naviga: "con il tasto «Naviga»"
	};
	async function aggiornaViteManiscalco(clienteId) {
		try {
			if (typeof renderAgendaSettimana === "function") await renderAgendaSettimana();
			if (typeof renderProDeadlines === "function") await renderProDeadlines();
			if (typeof renderIncassi === "function") await renderIncassi();
			if (clienteId && typeof currentClienteId !== "undefined" && currentClienteId === clienteId && typeof loadClienteInterventi === "function") await loadClienteInterventi(clienteId);
		} catch (e) {
			console.error("aggiornaViteManiscalco:", e);
		}
	}
	function renderAzioneAi(box, azione) {
		if (azione.tipo === "evento") return renderEventProposal(box, azione.dati);
		const id = "azione-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6);
		aiAzioniInAttesa[id] = azione;
		const x = azione.dati;
		if (azione.tipo === "naviga") {
			const riga = x.indirizzo ? escapeHtml(x.indirizzo) : x.ricerca ? `Ricerca nelle mappe: ${escapeHtml(x.ricerca)}` : "Indirizzo da cercare: scegli il posto giusto";
			box.insertAdjacentHTML("beforeend", `
    <div class="chat-bubble ai event-proposal" id="${id}">
      <div class="event-proposal-title"><span class="fa-icon"><i class="fa-solid fa-location-dot"></i></span> Naviga verso ${escapeHtml(x.nome || "")}</div>
      <div class="event-proposal-row">${riga}</div>
      <div class="event-proposal-actions">
        <button class="btn btn-primary btn-sm btn-conferma" onclick="aiNaviga('${id}')">Naviga</button>
      </div>
    </div>`);
			box.scrollTop = box.scrollHeight;
			return;
		}
		if (azione.tipo === "conto") {
			const nuovo = x.n_liberi > 0;
			box.insertAdjacentHTML("beforeend", `
    <div class="chat-bubble ai event-proposal" id="${id}">
      <div class="event-proposal-title">Conto · ${escapeHtml(x.nome_cliente || "")}</div>
      <div class="event-proposal-row">${nuovo ? `${x.n_liberi} ${x.n_liberi === 1 ? "lavoro da mettere" : "lavori da mettere"} in conto · <b>€ ${Number(x.totale_liberi || 0).toFixed(2)}</b>${x.senza_importo ? ` <span class="muted">(${x.senza_importo} senza importo)</span>` : ""}` : "Nessun lavoro nuovo da mettere in conto."}</div>
      ${(x.aperti || []).map((c) => `<div class="event-proposal-row">Già fatto: <b>${escapeHtml(c.codice)}</b> del ${formatDataBreve(c.creato_il)} · ${c.n_lavori} lavori · € ${Number(c.totale || 0).toFixed(2)} · da incassare</div>`).join("")}
      <div class="event-proposal-actions">
        ${(x.aperti || []).map((c) => `<button class="btn btn-outline btn-sm" onclick="closeAiSheet();apriInvioConto('${c.id}')">Apri ${escapeHtml(c.codice)}</button>`).join("")}
        ${nuovo || !(x.aperti || []).length ? `<button class="btn btn-primary btn-sm btn-conferma" onclick="closeAiSheet();apriNuovoConto('${x.cliente_mascalcia_id}')">Fai il conto</button>` : ""}
      </div>
    </div>`);
			box.scrollTop = box.scrollHeight;
			return;
		}
		let titolo = "", righe = [];
		if (azione.tipo === "promemoria_personale") {
			titolo = `🔔 Promemoria · ${formatDataBreve(x.data)} ore ${escapeHtml(x.ora || "08:00")}`;
			righe = [
				`<b>${escapeHtml(x.testo || "")}</b>`,
				x.nome_cliente ? `Cliente: ${escapeHtml(x.nome_cliente)}${x.azione && AZIONE_PM[x.azione] ? " · " + AZIONE_PM[x.azione] : ""}` : "",
				`<span class="muted">All'ora giusta te lo scrivo qui e ti arriva la notifica.</span>`
			];
		} else if (azione.tipo === "spesa") {
			titolo = `Spesa · ${CAT_SPESA_LABEL[x.category] || escapeHtml(x.category)}`;
			righe = [
				`Importo: € ${Number(x.amount).toFixed(2)}`,
				`Data: ${formatDate(x.date)}`,
				x.horse_name ? `Cavallo: ${escapeHtml(x.horse_name)}` : "",
				x.notes ? escapeHtml(x.notes) : ""
			];
		} else if (azione.tipo === "lezione") {
			titolo = `Calendario · ${LEZIONE_TIPO_LABELS[x.tipo] || escapeHtml(x.tipo)}`;
			righe = [
				`Data: ${formatDate(x.data)}`,
				x.horse_name ? `Cavallo: ${escapeHtml(x.horse_name)}` : "",
				x.note ? escapeHtml(x.note) : ""
			];
		} else if (azione.tipo === "richiesta_maniscalco") {
			titolo = `Richiesta a ${escapeHtml(x.nome_maniscalco || "maniscalco")}`;
			righe = [
				`${escapeHtml(x.tipo === "altro" && x.tipo_altro ? x.tipo_altro : TIPO_MAN_LABEL[x.tipo] || x.tipo)}${x.horse_name ? " · " + escapeHtml(x.horse_name) : ""}`,
				`Data preferita: ${formatDate(x.data)}${x.ora ? " ore " + escapeHtml(x.ora) : ""}`,
				x.note ? escapeHtml(x.note) : ""
			];
		} else if (azione.tipo === "appuntamento") {
			const nomeCv = x.cavallo?.nome || x.nuovo_cavallo_nome;
			titolo = `Agenda · ${escapeHtml(x.tipo === "altro" && x.tipo_altro ? x.tipo_altro : TIPO_MAN_LABEL[x.tipo] || x.tipo)}`;
			righe = [
				`${escapeHtml(x.nome_cliente || "")}${nomeCv ? " · " + escapeHtml(nomeCv) : ""}${x.nuovo_cavallo_nome ? " (nuovo cavallo)" : ""}`,
				`${formatDataBreve(x.data)}${x.ora ? " ore " + escapeHtml(x.ora) : ""}`,
				x.importo != null ? `<span class="solo-incassi">Importo: € ${Number(x.importo).toFixed(2)} · ${x.stato_pagamento === "saldato" ? "saldato" : "da saldare"}</span>` : "",
				x.note ? escapeHtml(x.note) : ""
			];
		} else if (azione.tipo === "accetta_richiesta" || azione.tipo === "rifiuta_richiesta") {
			const acc = azione.tipo === "accetta_richiesta";
			titolo = acc ? "Accetta richiesta" : "Rifiuta richiesta";
			righe = [
				`${escapeHtml(x.nome_cliente || "")}${x.cavallo ? " · " + escapeHtml(x.cavallo) : ""}`,
				`${escapeHtml(x.tipo_ferratura === "altro" && x.tipo_altro ? x.tipo_altro : TIPO_MAN_LABEL[x.tipo_ferratura] || x.tipo_ferratura || "")} · ${formatDataBreve(x.data_intervento)}${x.ora ? " ore " + escapeHtml(x.ora) : ""}`,
				acc && x.importo != null ? `Importo: € ${Number(x.importo).toFixed(2)}` : "",
				acc && x.invia_riepilogo ? "Poi apro la chat con il PDF di riepilogo" : "",
				!acc ? "Il cliente riceve un messaggio per trovare un'altra data" : ""
			];
		} else if (azione.tipo === "promemoria") {
			titolo = `Messaggio a ${escapeHtml(x.nome_cliente || "")}`;
			righe = [`<span style="white-space:pre-wrap">${escapeHtml(x.testo || "")}</span>`, x.collegato ? "" : "<span class=\"muted\">Cliente non su Equo: copia il testo e mandalo tu.</span>"];
		} else if (azione.tipo === "saldato") {
			titolo = `Segna come saldato · € ${Number(x.totale || 0).toFixed(2)}`;
			righe = (x.righe || []).map((r) => escapeHtml(r));
		} else return;
		box.insertAdjacentHTML("beforeend", `
    <div class="chat-bubble ai event-proposal" id="${id}">
      <div class="event-proposal-title">${titolo}</div>
      ${righe.filter(Boolean).map((r) => `<div class="event-proposal-row">${r}</div>`).join("")}
      <div class="event-proposal-actions">
        <button class="btn btn-ghost btn-sm" onclick="cancelEventProposal('${id}')">Annulla</button>
        <button class="btn btn-primary btn-sm btn-conferma" onclick="confermaAzioneAi('${id}')">${ETICHETTA_CONFERMA_AI[azione.tipo] ? ETICHETTA_CONFERMA_AI[azione.tipo](x) : "Conferma"}</button>
      </div>
    </div>`);
		box.scrollTop = box.scrollHeight;
	}
	async function aiNaviga(id) {
		const x = aiAzioniInAttesa[id]?.dati;
		if (!x) return;
		if (x.indirizzo) return wgMostraMappe({ nome: x.nome }, x.indirizzo);
		if (x.cliente_mascalcia_id) {
			if (!wgClienteDi(x.cliente_mascalcia_id) && typeof loadClientiMascalcia === "function") await loadClientiMascalcia();
			if (wgClienteDi(x.cliente_mascalcia_id)) return wgNaviga(x.cliente_mascalcia_id);
		}
		wgMostraMappe({ nome: x.nome }, x.ricerca || x.nome, "Ricerca per nome: controlla nelle mappe che sia il posto giusto.");
	}
	async function confermaAzioneAi(id) {
		const azione = aiAzioniInAttesa[id];
		const el = document.getElementById(id);
		if (!azione || !el) return;
		el.querySelectorAll("button").forEach((b) => b.disabled = true);
		const x = azione.dati;
		let error = null, fatto = "";
		if (azione.tipo === "spesa") {
			const horse_id = x.horse_id || currentHorseId || (horses[0] ? horses[0].id : null);
			({error} = await DB.insertExpense({
				horse_id,
				category: x.category,
				amount: x.amount,
				date: x.date,
				notes: x.notes
			}));
			fatto = "✓ Spesa registrata.";
			if (!error) {
				if (typeof loadExpenses === "function" && document.getElementById("expenses-list")) loadExpenses();
				if (typeof loadExpensesSummary === "function") loadExpensesSummary();
			}
		} else if (azione.tipo === "lezione") {
			({error} = await DB.insertLezione({
				horse_id: x.horse_id,
				data: x.data,
				tipo: x.tipo,
				note: x.note
			}));
			fatto = "✓ Aggiunto al calendario.";
			if (!error && typeof loadLezioni === "function" && document.getElementById("lezioni-list")) loadLezioni();
		} else if (azione.tipo === "richiesta_maniscalco") {
			({error} = await DB.richiediAppuntamento({
				cliente_mascalcia_id: x.cliente_mascalcia_id,
				horse_id: x.horse_id,
				nome_cavallo: x.nome_cavallo,
				tipo: x.tipo,
				tipo_altro: x.tipo_altro,
				data: x.data,
				ora: x.ora,
				note: x.note
			}));
			fatto = `✓ Richiesta inviata a ${escapeHtml(x.nome_maniscalco || "il maniscalco")}: ti risponde in chat.`;
		} else if (azione.tipo === "appuntamento") {
			let cavallo_cliente_id = null, horse_id = null;
			if (x.nuovo_cavallo_nome) {
				const r = await DB.insertCavalloCliente({
					cliente_mascalcia_id: x.cliente_mascalcia_id,
					nome: x.nuovo_cavallo_nome
				});
				error = r.error;
				cavallo_cliente_id = r.data?.id || null;
			} else if (x.cavallo) ({cavallo_cliente_id, horse_id} = await DB.risolviCavalloPerIntervento(x.cliente_mascalcia_id, x.cavallo));
			if (!error) {
				const futuro = (/* @__PURE__ */ new Date(x.data + "T" + (x.ora || "00:00"))).getTime() > Date.now();
				const giorni = (await giorniRichiamoSuggeriti(x.tipo, cavallo_cliente_id, horse_id)).giorni;
				({error} = await DB.insertInterventoMascalcia({
					cliente_mascalcia_id: x.cliente_mascalcia_id,
					cavallo_cliente_id,
					horse_id,
					tipo_ferratura: x.tipo,
					tipo_altro: x.tipo_altro,
					misura_sistema: null,
					numero_ferro: null,
					quantita_ferri: null,
					data_intervento: x.data,
					ora: x.ora,
					stato: futuro ? "programmato" : "fatto",
					prossima_scadenza: giorni ? aggiungiGiorniIso(x.data, giorni) : null,
					importo: x.importo,
					stato_pagamento: x.stato_pagamento || "da_saldare",
					note: x.note
				}));
			}
			fatto = "✓ Salvato in agenda. Misura e numero di ferri li aggiungi aprendo l'appuntamento.";
			if (!error) await aggiornaViteManiscalco(x.cliente_mascalcia_id);
		} else if ((azione.tipo === "accetta_richiesta" || azione.tipo === "rifiuta_richiesta") && x.gruppo_id) {
			const r = await sb.rpc("pro_azione_appuntamento_struttura", {
				p_gruppo_id: x.gruppo_id,
				p_azione: azione.tipo === "accetta_richiesta" ? "conferma" : "rifiuta"
			});
			error = r.error || (r.data && !r.data.ok ? { message: r.data.errore } : null);
			if (!error) fatto = azione.tipo === "accetta_richiesta" ? "✓ Confermato: la scuderia riceve l'avviso in chat." : "✓ Richiesta rifiutata: la scuderia riceve un messaggio in chat.";
		} else if (azione.tipo === "accetta_richiesta") {
			const giorni = TIPO_FERRATURA_INTERVALLI[x.tipo_ferratura] ? (await giorniRichiamoSuggeriti(x.tipo_ferratura, x.cavallo_cliente_id, x.horse_id, x.id)).giorni : null;
			const payload = {
				stato: x.data_intervento >= isoLocale(/* @__PURE__ */ new Date()) ? "programmato" : "fatto",
				prossima_scadenza: giorni ? aggiungiGiorniIso(x.data_intervento, giorni) : null
			};
			if (x.importo != null) payload.importo = x.importo;
			({error} = await DB.updateInterventoMascalcia(x.id, payload));
			if (!error) {
				await DB.insertMessaggioMascalcia({
					cliente_mascalcia_id: x.cliente_mascalcia_id,
					tipo: "testo",
					testo: testoRichiesta("✅ Appuntamento confermato", {
						tipo_ferratura: x.tipo_ferratura,
						tipo_altro: x.tipo_altro,
						data_intervento: x.data_intervento,
						ora: x.ora
					}, x.cavallo || "")
				});
				fatto = "✓ Richiesta accettata: il cliente riceve la conferma in chat.";
				await aggiornaViteManiscalco(x.cliente_mascalcia_id);
				if (x.invia_riepilogo) {
					const ev = (await DB.listInterventiPeriodo(x.data_intervento, x.data_intervento)).find((e) => e.id === x.id);
					if (ev) {
						closeAiSheet();
						await inviaEventoInChat(ev);
					}
				}
			}
		} else if (azione.tipo === "rifiuta_richiesta") {
			({error} = await DB.updateInterventoMascalcia(x.id, { stato: "rifiutato" }));
			if (!error) {
				await DB.insertMessaggioMascalcia({
					cliente_mascalcia_id: x.cliente_mascalcia_id,
					tipo: "testo",
					testo: testoRichiesta("❌ Non riesco per questa richiesta", {
						tipo_ferratura: x.tipo_ferratura,
						tipo_altro: x.tipo_altro,
						data_intervento: x.data_intervento,
						ora: x.ora,
						note: x.note
					}, x.cavallo || "") + " Scrivimi qui per trovare un'altra data."
				});
				fatto = "✓ Richiesta rifiutata: il cliente riceve un messaggio in chat.";
				await aggiornaViteManiscalco(x.cliente_mascalcia_id);
			}
		} else if (azione.tipo === "promemoria") {
			if (x.collegato) {
				({error} = await DB.insertMessaggioMascalcia({
					cliente_mascalcia_id: x.cliente_mascalcia_id,
					tipo: "testo",
					testo: x.testo
				}));
				fatto = `✓ Messaggio inviato a ${escapeHtml(x.nome_cliente || "")}.`;
			} else try {
				await navigator.clipboard.writeText(x.testo);
				fatto = `✓ Testo copiato: incollalo nel messaggio a ${escapeHtml(x.nome_cliente || "")}.`;
			} catch (e) {
				error = { message: "copia non riuscita, tieni premuto sul testo per copiarlo" };
			}
		} else if (azione.tipo === "promemoria_personale") {
			if (typeof pmSalvaDaHammer !== "function") error = { message: "promemoria non disponibili in questa vista" };
			else ({error} = await pmSalvaDaHammer(x));
			fatto = `✓ Promemoria salvato: ${formatDataBreve(x.data)} ore ${escapeHtml(x.ora || "08:00")}. Te lo ricordo io.`;
		} else if (azione.tipo === "saldato") {
			for (const idInt of x.ids || []) {
				const r = await DB.updateInterventoMascalcia(idInt, { stato_pagamento: "saldato" });
				if (r.error) {
					error = r.error;
					break;
				}
			}
			fatto = `✓ Segnati come saldati (€ ${Number(x.totale || 0).toFixed(2)}).`;
			if (!error) await aggiornaViteManiscalco(null);
		}
		if (error) {
			el.querySelectorAll("button").forEach((b) => b.disabled = false);
			showToast("Non sono riuscito a salvare: " + (error.message || "riprova"));
			return;
		}
		delete aiAzioniInAttesa[id];
		el.innerHTML = `<div class="event-proposal-title">${fatto}</div>`;
		el.classList.remove("event-proposal");
	}
	async function sendChatMessage(opz) {
		opz = opz && typeof opz === "object" && !opz.type ? opz : {};
		const input = document.getElementById("chat-input");
		const text = (opz.testo != null ? String(opz.testo) : input.value).trim();
		const modalita = opz.modalita || (hpCasoAttivo ? "caso" : null);
		const allegati = aiAllegati.slice();
		if (!text && !allegati.length) return;
		const box = document.getElementById("chat-messages");
		const thumbs = allegati.length ? `<div class="ai-thumbs">${allegati.map((a) => a.anteprima ? `<img src="${a.anteprima}" alt="">` : `<span class="ai-allegato" style="width:56px;height:56px">PDF</span>`).join("")}</div>` : "";
		box.insertAdjacentHTML("beforeend", `<div class="chat-bubble user">${thumbs}${escapeHtml(text)}</div>`);
		input.value = "";
		aiAllegati = [];
		renderAllegatiAi();
		box.scrollTop = box.scrollHeight;
		const thinkingId = "think-" + Date.now();
		box.insertAdjacentHTML("beforeend", `<div class="chat-bubble ai" id="${thinkingId}">…</div>`);
		box.scrollTop = box.scrollHeight;
		if (DEMO_MODE) {
			setTimeout(() => {
				const proposed = detectDemoEvent(text);
				if (proposed) {
					document.getElementById(thinkingId).textContent = `Ho preparato una proposta di evento per ${proposed.horse_name}. Confermi? (demo — nessuna chiamata AI reale)`;
					renderEventProposal(box, proposed);
				} else document.getElementById(thinkingId).textContent = "[Risposta demo] In app vera qui risponde l'assistente AI collegato a Claude. Prova a scrivere qualcosa come \"segna un vaccino ad Aurora oggi\" per vedere la proposta di evento.";
				box.scrollTop = box.scrollHeight;
			}, 500);
			return;
		}
		try {
			const res = await fetch("/.netlify/functions/agent", {
				method: "POST",
				headers: await authHeaders(),
				body: JSON.stringify({
					message: text,
					vista: vistaAi(),
					allegati: allegati.map((a) => ({
						media_type: a.media_type,
						data: a.data
					})),
					posizione: typeof meteoUltimaPos === "function" ? meteoUltimaPos() : null,
					modalita,
					contesto_app: agenteAiHammer() && hpContesto ? hpContesto.testo : null,
					conversazione_id: aiConvPerInvio()
				})
			});
			const data = await res.json().catch(() => ({}));
			if (data.conversazione) aiConvDaRisposta(data.conversazione);
			const bolla = document.getElementById(thinkingId);
			if (res.status === 413) bolla.textContent = "Allegati troppo pesanti: prova con meno foto o un PDF più leggero.";
			else if (res.status === 401) bolla.textContent = `Sessione scaduta: esci e rientra per usare ${nomeAgenteAi()}.`;
			else if (data.limite_raggiunto && agenteAiHammer()) bolla.outerHTML = hpLimiteHtml(data);
			else if (data.limite_raggiunto) {
				const alGiorno = data.uso.periodo === "giorno" || !data.uso.periodo && data.uso.piano !== "premium";
				bolla.innerHTML = `<p>Hai usato tutti i <strong>${data.uso.limite} messaggi AI</strong> di ${alGiorno ? "oggi" : "questo mese"}.</p>` + (!alGiorno ? "<p>Il contatore riparte il 1° del mese.</p>" : `<p>Il contatore riparte a mezzanotte. Con Premium ne hai 500 al mese, più cavalli illimitati e promemoria automatici.</p><button class="btn btn-primary btn-sm ai-limit-cta" onclick="closeAiSheet();togglePiano()">Passa a Premium</button>`);
			} else {
				const scelte = hpEstraiScelte(data.reply || "");
				bolla.innerHTML = formattaRispostaAi(data.reply || "Non sono riuscito a rispondere, riprova.");
				if (modalita === "caso") {
					if (scelte.length) bolla.insertAdjacentHTML("afterend", `<div class="hp-scelte">${scelte.map((t) => `<button type="button" onclick="hpScelta(this)">${escapeHtml(t)}</button>`).join("")}</div>`);
					else hpFineCaso(true);
				}
				if (Array.isArray(data.azioni) && data.azioni.length) data.azioni.forEach((a) => renderAzioneAi(box, a));
				else if (data.proposedEvent && data.proposedEvent.horse_name && data.proposedEvent.type && data.proposedEvent.date) renderEventProposal(box, data.proposedEvent);
			}
			if (data.uso) aggiornaNotaUsoAi(data.uso);
		} catch (e) {
			document.getElementById(thinkingId).textContent = "Errore di connessione, riprova.";
		}
		box.scrollTop = box.scrollHeight;
	}
	function renderEventProposal(box, proposed) {
		const id = "proposal-" + Date.now();
		const label = EVENT_LABELS[proposed.type] || proposed.type;
		box.insertAdjacentHTML("beforeend", `
    <div class="chat-bubble ai event-proposal" id="${id}">
      <div class="event-proposal-title">${escapeHtml(label)} · ${escapeHtml(proposed.horse_name)}</div>
      <div class="event-proposal-row">Data: ${formatDate(proposed.date)}</div>
      ${proposed.next_due_date ? `<div class="event-proposal-row">Prossima scadenza: ${formatDate(proposed.next_due_date)}</div>` : ""}
      ${proposed.notes ? `<div class="event-proposal-row">${escapeHtml(proposed.notes)}</div>` : ""}
      <div class="event-proposal-actions">
        <button class="btn btn-ghost btn-sm" onclick="cancelEventProposal('${id}')">Annulla</button>
        <button class="btn btn-primary btn-sm btn-conferma" onclick="confirmEventProposal(${jsArg(id)}, ${jsArg(proposed)})">Conferma</button>
      </div>
    </div>
  `);
		box.scrollTop = box.scrollHeight;
	}
	function cancelEventProposal(id) {
		const el = document.getElementById(id);
		if (!el) return;
		el.innerHTML = `<div class="event-proposal-title">Proposta annullata.</div>`;
		el.classList.remove("event-proposal");
	}
	async function confirmEventProposal(id, proposed) {
		const el = document.getElementById(id);
		const horse = horses.find((h) => (h.name || "").toLowerCase() === (proposed.horse_name || "").toLowerCase());
		if (!horse) {
			if (el) el.innerHTML = `<div class="event-proposal-title">Non trovo il cavallo "${escapeHtml(proposed.horse_name)}" — aggiungilo prima da Cavalli.</div>`;
			return;
		}
		const { error } = await DB.insertEvent({
			horse_id: horse.id,
			type: proposed.type,
			date: proposed.date,
			next_due_date: proposed.next_due_date || null,
			notes: proposed.notes || null
		});
		if (error) {
			if (el) el.innerHTML = `<div class="event-proposal-title">Errore nel salvataggio, riprova da Cavalli.</div>`;
			return;
		}
		if (el) {
			el.innerHTML = `<div class="event-proposal-title">✓ Evento salvato per ${escapeHtml(horse.name)}.</div>`;
			el.classList.remove("event-proposal");
		}
		if (currentHorseId === horse.id) await loadHorseEvents(horse.id);
		await loadDeadlines();
	}
	// equo-app-src/src/comune/agenti/moduli/081-equo-ai-allegati-step-2-foto-ridotte-a-m.js
	function leggiFileComeDataUrl(file) {
		return new Promise((ok, ko) => {
			const r = new FileReader();
			r.onload = () => ok(r.result);
			r.onerror = ko;
			r.readAsDataURL(file);
		});
	}
	async function riduciImmagine(file) {
		const url = await leggiFileComeDataUrl(file);
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
		return c.toDataURL("image/jpeg", .82);
	}
	async function aggiungiAllegatiAi(event) {
		const files = Array.from(event.target.files || []);
		event.target.value = "";
		for (const f of files) {
			if (aiAllegati.length >= 3) {
				showToast("Massimo 3 allegati per messaggio.");
				break;
			}
			try {
				if (f.type === "application/pdf") {
					if (f.size > 4194304) {
						showToast("PDF troppo grande (max 4 MB): prova con una foto.");
						continue;
					}
					const url = await leggiFileComeDataUrl(f);
					aiAllegati.push({
						media_type: "application/pdf",
						data: url.split(",")[1],
						anteprima: null,
						nome: f.name
					});
				} else if ((f.type || "").startsWith("image/")) {
					const url = await riduciImmagine(f);
					aiAllegati.push({
						media_type: "image/jpeg",
						data: url.split(",")[1],
						anteprima: url,
						nome: f.name
					});
				} else showToast("Puoi allegare foto o PDF.");
			} catch (err) {
				console.error("allegato AI:", err);
				showToast("Non riesco a leggere il file, riprova.");
			}
		}
		renderAllegatiAi();
	}
	function renderAllegatiAi() {
		const box = document.getElementById("ai-allegati");
		if (!box) return;
		box.classList.toggle("attivi", aiAllegati.length > 0);
		box.innerHTML = aiAllegati.map((a, i) => `<div class="ai-allegato">${a.anteprima ? `<img src="${a.anteprima}" alt="">` : "PDF"}<button onclick="rimuoviAllegatoAi(${i})" aria-label="Rimuovi">×</button></div>`).join("");
	}
	function rimuoviAllegatoAi(i) {
		aiAllegati.splice(i, 1);
		renderAllegatiAi();
	}
	function hpCalcolaContesto() {
		if (!agenteAiHammer() || !document.getElementById("page-pro-clienti")?.classList.contains("active")) return null;
		const vp = document.getElementById("cavallo-pro-view");
		if (vp && vp.style.display === "block") {
			const cv = (schedaCavalli || []).find((c) => c.key === schedaCavalloKey);
			if (cv) {
				const cli = (clientiMascalcia || []).find((c) => c.id === currentClienteId);
				const st = statoCavalloPro(cv, schedaStoricoCavallo || []);
				const righe = (schedaStoricoCavallo || []).slice().sort((a, b) => String(b.data_intervento).localeCompare(String(a.data_intervento))).slice(0, 12).map((i) => "- " + [
					i.data_intervento,
					(TIPO_FERRATURA_LABELS[i.tipo_ferratura] || i.tipo_ferratura) + (i.tipo_altro ? " (" + i.tipo_altro + ")" : ""),
					i.numero_ferro ? "ferro " + siglaFerro(i.misura_sistema, i.numero_ferro) : "",
					i.quantita_ferri ? i.quantita_ferri + " ferri" : "",
					testoFerroIntervento(i) || "",
					i.stato !== "fatto" ? i.stato : "",
					i.note ? "note: " + i.note : ""
				].filter(Boolean).join(" · "));
				const testo = [
					`Scheda del cavallo ${cv.nome}${cv.codice_equo ? " (codice Equo " + cv.codice_equo + ")" : ""}${cv.razza ? ", " + cv.razza : ""}${cv.nascita ? ", nato il " + cv.nascita : ""}; cliente ${cli?.nome || "—"}.`,
					typeof testoAnagraficaCavallo === "function" && testoAnagraficaCavallo(cv) ? `Anagrafica: ${testoAnagraficaCavallo(cv)}.` : "",
					`Ferratura in scheda: ${descrFerraturaCavallo(cv)}.`,
					st.prossimo ? `Prossimo lavoro: ${st.prossimo.data}.` : "",
					righe.length ? "Storico (più recenti prima):\n" + righe.join("\n") : "Nessun lavoro registrato."
				].filter(Boolean).join("\n");
				return {
					tipo: "cavallo",
					nome: cv.nome,
					testo,
					cv,
					clienteId: currentClienteId
				};
			}
		}
		const dv = document.getElementById("clienti-detail-view");
		if (currentClienteId && dv && dv.style.display !== "none") {
			const cli = (clientiMascalcia || []).find((c) => c.id === currentClienteId);
			if (cli) return {
				tipo: "cliente",
				nome: cli.nome,
				clienteId: cli.id,
				testo: `Scheda del cliente ${cli.nome}${isStruttura(cli) ? " (scuderia o centro ippico)" : ""}. Cavalli: ${(schedaCavalli || []).map((c) => c.nome + " (" + descrFerraturaCavallo(c) + ")").join(", ") || "nessuno"}.`
			};
		}
		return null;
	}
	function hpPreparaPannello() {
		const pan = document.getElementById("hp-pan");
		if (!pan) return;
		const on = agenteAiHammer();
		pan.hidden = !on;
		if (!on) {
			hpContesto = null;
			return;
		}
		hpContesto = hpCalcolaContesto();
		const ctx = document.getElementById("hp-ctx");
		ctx.hidden = !hpContesto;
		if (hpContesto) document.getElementById("hp-ctx-nome").textContent = hpContesto.nome;
		document.getElementById("hp-btn-storico").hidden = !(hpContesto && hpContesto.tipo === "cavallo");
	}
	function hpTogliContesto() {
		hpContesto = null;
		document.getElementById("hp-ctx").hidden = true;
		document.getElementById("hp-btn-storico").hidden = true;
	}
	function hpChiedi() {
		hpFineCaso();
		document.getElementById("chat-input").focus();
	}
	function hpStorico() {
		if (hpContesto) sendChatMessage({
			testo: `Riassumi lo storico di ${hpContesto.nome}`,
			modalita: "storico"
		});
	}
	function hpCaso() {
		hpCasoAttivo = true;
		if (!document.getElementById("hp-caso-barra")) document.getElementById("hp-pan").insertAdjacentHTML("afterend", "<div class=\"hp-caso-barra\" id=\"hp-caso-barra\">Consulta un caso: rispondi o tocca una scelta<button type=\"button\" onclick=\"hpFineCaso()\">Fine</button></div>");
		sendChatMessage({
			testo: hpContesto && hpContesto.tipo === "cavallo" ? `Vorrei un consulto su ${hpContesto.nome}.` : "Vorrei un consulto su un caso.",
			modalita: "caso"
		});
	}
	function hpFineCaso() {
		hpCasoAttivo = false;
		document.getElementById("hp-caso-barra")?.remove();
	}
	function hpEstraiScelte(testo) {
		const m = String(testo || "").match(/\**Scelte:\**\s*([^\n]+)\s*$/i);
		return m ? m[1].split("|").map((x) => x.replace(/[*_"«»]/g, "").trim()).filter(Boolean).slice(0, 5) : [];
	}
	function hpScelta(btn) {
		btn.parentElement.querySelectorAll("button").forEach((b) => b.disabled = true);
		sendChatMessage({
			testo: btn.textContent,
			modalita: "caso"
		});
	}
	function hpLimiteHtml(data) {
		const u = data.uso || {}, alGiorno = u.periodo === "giorno";
		const foto = data.peso > 1;
		return `<div class="chat-bubble ai hp-limite"><b>${foto ? "Un'analisi foto vale 3 messaggi" : alGiorno ? `Hai usato i ${u.limite} messaggi di oggi` : "Hai finito i messaggi di questo mese"}</b>
    <p>${foto ? `Oggi ne restano ${Math.max(0, (u.limite || 0) - (u.usati || 0))}. ` : ""}${alGiorno ? "Domani ne hai altri " + u.limite + ". Per continuare adesso:" : "Il contatore riparte il 1° del mese."}</p>
    ${alGiorno ? `<button type="button" class="hp-b v" onclick="closeAiSheet();hpChiudiFoto();togglePiano()">Passa a Premium</button>
    <button type="button" class="hp-b o" onclick="showToast('I crediti Hammer arrivano a breve: intanto con Premium hai 500 messaggi al mese.')">Acquista crediti Hammer</button>` : ""}</div>`;
	}
	// equo-app-src/src/comune/agenti/moduli/index.js
	Object.assign(window, {
		aggiornaViteManiscalco,
		aggiungiAllegatiAi,
		aiNaviga,
		cancelEventProposal,
		confermaAzioneAi,
		confirmEventProposal,
		hpAnalizza,
		hpApriFoto,
		hpCaso,
		hpChiedi,
		hpChiudiFoto,
		hpCondividi,
		hpElimina,
		hpFineCaso,
		hpFotoScelta,
		hpPdf,
		hpPreparaPannello,
		hpScatto,
		hpScelta,
		hpStorico,
		hpTogliContesto,
		renderAllegatiAi,
		riduciImmagine,
		rimuoviAllegatoAi,
		sendChatMessage,
		aiApriArchivio,
		aiAvviaControlloImportanti,
		aiCercaArchivio,
		aiChiudiArchivio,
		aiControllaImportanti,
		aiEliminaChat,
		aiFissaChat,
		aiMenuChat,
		aiNuovaChat,
		aiRiapriChat,
		aiRinominaChat,
		aiServeRicarica,
		aiTornaAOggi,
		caricaChatAiGiorni
	});
})();

