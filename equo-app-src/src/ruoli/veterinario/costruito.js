
// === GENERATO da equo-app-src/strumenti/costruisci-moduli.mjs: NON modificare qui, modificare ruoli/veterinario/moduli/ ===
(function() {
	// equo-app-src/src/ruoli/veterinario/moduli/01-home.js
	var VH_IC = {
		cerca: "<svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><circle cx=\"11\" cy=\"11\" r=\"7\"/><path d=\"m20 20-3.5-3.5\"/></svg>",
		sole: "<svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><circle cx=\"12\" cy=\"12\" r=\"4\"/><path d=\"M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4\"/></svg>",
		portami: "<svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M3 11 22 2l-9 19-2-8z\"/></svg>",
		detta: "<svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><rect x=\"9\" y=\"2\" width=\"6\" height=\"12\" rx=\"3\"/><path d=\"M5 10a7 7 0 0 0 14 0M12 17v5\"/></svg>",
		scadenze: "<svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M5 22h14M5 2h14\"/><path d=\"M17 22v-4.2a2 2 0 0 0-.6-1.4L12 12l-4.4 4.4a2 2 0 0 0-.6 1.4V22M7 2v4.2a2 2 0 0 0 .6 1.4L12 12l4.4-4.4a2 2 0 0 0 .6-1.4V2\"/></svg>",
		euro: "<svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M18 7a7 7 0 1 0 0 10M4 10h10M4 14h10\"/></svg>",
		altro: "<svg viewBox=\"0 0 24 24\" aria-hidden=\"true\" class=\"pieno\"><circle cx=\"6\" cy=\"9\" r=\"1.5\"/><circle cx=\"12\" cy=\"9\" r=\"1.5\"/><circle cx=\"18\" cy=\"9\" r=\"1.5\"/><circle cx=\"6\" cy=\"15\" r=\"1.5\"/><circle cx=\"12\" cy=\"15\" r=\"1.5\"/><circle cx=\"18\" cy=\"15\" r=\"1.5\"/></svg>",
		piu: "<svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M12 5v14M5 12h14\"/></svg>"
	};
	function vhEtichetta(e) {
		const t = e.tipo_ferratura;
		if (t === "urgenza") return {
			cls: "urg",
			txt: "Urgente"
		};
		if (t === "vaccino") return {
			cls: "oro",
			txt: "Vaccino"
		};
		if (t === "mtc") return {
			cls: "tif",
			txt: "MTC"
		};
		if (t === "fisio") return {
			cls: "tif",
			txt: "Fisio"
		};
		if (t === "terapia") return {
			cls: "tif",
			txt: "Terapia"
		};
		if (t === "visita") return {
			cls: "tif",
			txt: "Controllo"
		};
		return {
			cls: "tif",
			txt: TIPO_FERRATURA_LABELS[t] || "Visita"
		};
	}
	function vhTitolo(e) {
		const cav = agNomeCavallo(e);
		const motivo = (e.tipo_altro || "").trim() || TIPO_FERRATURA_LABELS[e.tipo_ferratura] || "Visita";
		return cav ? `<b>${escapeHtml(cav)}</b> · ${escapeHtml(motivo)}` : `<b>${escapeHtml(motivo)}</b>`;
	}
	function vhLuogo(e) {
		try {
			return luogoEvento(e, true).nome;
		} catch (_) {
			return e.clienti_mascalcia?.nome || "";
		}
	}
	function vhOra(e) {
		return e.ora ? String(e.ora).slice(0, 5) : "—";
	}
	function vhDaFare(e) {
		return ![
			"annullato",
			"rifiutato",
			"fatto"
		].includes(e.stato);
	}
	var vhKm = {
		giorno: null,
		km: null
	};
	function vhBox() {
		const home = document.getElementById("page-pro-home");
		if (!home) return null;
		let box = document.getElementById("vh");
		if (!box) {
			box = document.createElement("div");
			box.id = "vh";
			box.className = "vh";
			home.appendChild(box);
		}
		return box;
	}
	function renderHomeVet$1() {
		if (typeof eVeterinario !== "function" || !eVeterinario()) return;
		const box = vhBox();
		if (!box) return;
		const oggi = isoLocale(/* @__PURE__ */ new Date());
		(/* @__PURE__ */ new Date()).toTimeString().slice(0, 5);
		const app = (hpAppuntamenti || []).filter(vhDaFare);
		const diOggi = app.filter((e) => e.data_intervento === oggi);
		const urg = diOggi.filter((e) => e.tipo_ferratura === "urgenza").length;
		const ric = (hpRichiamiLista || []).filter((r) => r.giorni <= 7).length;
		const prima = diOggi.map(vhOra).filter((o) => o !== "—").sort()[0];
		const km = vhKm.giorno === oggi && vhKm.km ? `${vhKm.km} km` : "";
		const prossime = app.filter((e) => e.data_intervento >= oggi).sort((a, b) => (a.data_intervento + vhOra(a)).localeCompare(b.data_intervento + vhOra(b))).slice(0, 3);
		const nome = (currentUser?.nome || currentUser?.full_name || "").split(" ")[0];
		const data = (/* @__PURE__ */ new Date()).toLocaleDateString("it-IT", {
			weekday: "long",
			day: "numeric",
			month: "long"
		});
		const nMsg = wgPro?.unread || 0, inRitardo = (hpRichiamiLista || []).filter((r) => r.giorni < 0).length;
		const avviso = nMsg ? {
			t: `hai ${nMsg} ${nMsg === 1 ? "messaggio da leggere" : "messaggi da leggere"}.`,
			az: "hmMessaggi()"
		} : inRitardo ? {
			t: `${inRitardo} ${inRitardo === 1 ? "cavallo è in ritardo" : "cavalli sono in ritardo"} con il richiamo.`,
			az: "hmScadenze()"
		} : urg ? {
			t: `oggi hai ${urg === 1 ? "un'urgenza" : urg + " urgenze"}: è la prima del giro.`,
			az: "showPage('pro-agenda')"
		} : null;
		box.innerHTML = `
    <div class="vh-saluto">${escapeHtml(testoSaluto())}${nome ? " " + escapeHtml(nome) : ""} · ${escapeHtml(data)}</div>
    <div class="vh-giro">
      <div class="vh-giro-et">Il giro di oggi</div>
      <div class="vh-giro-riga">
        <div><div class="vh-giro-n">${diOggi.length} ${diOggi.length === 1 ? "visita" : "visite"}</div>
          <div class="vh-giro-s">${[km, prima ? "prima alle " + prima : diOggi.length ? "" : "nessuna visita in agenda"].filter(Boolean).join(" · ")}</div></div>
        <button class="vh-giornata" onclick="vhGiornata()">Giornata</button>
      </div>
      <div class="vh-giro-num">
        <button onclick="vhGiornata()"><b>${urg}</b><span>${urg === 1 ? "urgenza" : "urgenze"}</span></button>
        <button onclick="hmScadenze()"><b>${ric}</b><span>${ric === 1 ? "richiamo" : "richiami"}</span></button>
      </div>
    </div>
    <div class="vh-cerchi">
      <button onclick="hmPortami()"><span class="c">${VH_IC.portami}</span>Portami da</button>
      <button onclick="vhDetta()"><span class="c">${VH_IC.detta}</span>Detta</button>
      <button onclick="hmScadenze()"><span class="c">${VH_IC.scadenze}</span>Scadenze</button>
      <button class="solo-incassi" onclick="hmDaIncassare()"><span class="c">${VH_IC.euro}</span>Da incassare</button>
      <button onclick="hmAltro()"><span class="c">${VH_IC.altro}</span>Altro</button>
    </div>
    <div class="vh-tit">Prossime visite</div>
    ${prossime.length ? prossime.map((e) => {
			const et = vhEtichetta(e);
			const altroGiorno = e.data_intervento !== oggi;
			return `<button class="vh-visita${et.cls === "urg" ? " urg" : ""}" onclick="apriAzioniEvento('${e.id}')">
        <span class="o">${altroGiorno ? `<small>${escapeHtml(hpGiornoEtichetta(e.data_intervento))}</small>` : ""}${vhOra(e)}</span>
        <span class="c"><span class="t">${vhTitolo(e)}</span><span class="l">${escapeHtml(vhLuogo(e))}</span></span>
        <span class="vh-et ${et.cls}">${et.txt}</span></button>`;
		}).join("") : `<div class="vh-vuoto">Nessuna visita in agenda. <button onclick="openInterventoModal(null)">Aggiungine una</button></div>`}
    ${avviso ? `<button class="vh-galeno" onclick="${avviso.az}"><span class="g">${VH_IC.piu}</span><span><b>Galeno:</b> ${escapeHtml(avviso.t)}</span></button>` : ""}`;
		if (diOggi.length && vhKm.giorno !== oggi && typeof ofStimaKm === "function") {
			vhKm = {
				giorno: oggi,
				km: null
			};
			ofStimaKm(oggi, diOggi).then((r) => {
				if (r && r.km) {
					vhKm.km = r.km;
					renderHomeVet$1();
				}
			}).catch(() => {});
		}
	}
	function vhGiornata() {
		showPage("pro-agenda");
		if (typeof tornaSettimanaCorrente === "function") tornaSettimanaCorrente();
	}
	function vhDetta() {
		openAiSheet();
	}
	function vhMeteo() {
		const m = document.getElementById("hm-meteo");
		if (m) m.click();
	}
	quandoApriPagina(function(p) {
		if (p === "pro-home") renderHomeVet$1();
	});
	quandoAggiornaBarra(function() {
		if (document.body.classList.contains("pl-vet") && !document.getElementById("vh")) renderHomeVet$1();
	});
	// equo-app-src/src/ruoli/veterinario/moduli/02-demo.js
	function vdIso(giorni) {
		const d = /* @__PURE__ */ new Date();
		d.setDate(d.getDate() + giorni);
		return isoLocale(d);
	}
	function vdDati() {
		const cli = (id, nome, tipo, extra) => ({
			id,
			nome,
			nome_cavallo: "",
			telefono: "",
			note: "",
			cliente_user_id: null,
			codice_invito: "EQUO-" + id.toUpperCase(),
			tipo_cliente: tipo,
			created_at: "2026-09-01",
			indirizzo: null,
			email: null,
			...extra || {}
		});
		const cav = (id, cliente, nome, extra) => ({
			id,
			cliente_mascalcia_id: cliente,
			nome,
			microchip: null,
			horse_id: null,
			created_at: "2026-09-01",
			razza: null,
			sesso: null,
			ubicazione_tipo: null,
			ubicazione_cliente_id: null,
			...extra || {}
		});
		const vis = (id, cliente, cavallo, tipo, motivo, giorni, ora, extra) => ({
			id,
			cliente_mascalcia_id: cliente,
			cavallo_cliente_id: cavallo,
			horse_id: null,
			tipo_ferratura: tipo,
			tipo_altro: motivo,
			misura_sistema: null,
			numero_ferro: null,
			quantita_ferri: null,
			data_intervento: vdIso(giorni),
			ora,
			stato: giorni < 0 ? "fatto" : "programmato",
			prossima_scadenza: null,
			importo: null,
			stato_pagamento: "da_saldare",
			note: "",
			...extra || {}
		});
		const sc = { ubicazione_tipo: "scuderia" };
		return {
			clientiMascalcia: [
				cli("vc-sr", "Allevamento San Rocco", "struttura", {
					cliente_user_id: "demo-sr",
					indirizzo: "Via San Rocco 4"
				}),
				cli("vc-cl", "Centro Ippico Levante", "struttura", {
					cliente_user_id: "demo-cl",
					indirizzo: "Strada del Levante 12"
				}),
				cli("vc-po", "Scuderia Il Poggio", "struttura", { indirizzo: "Località Il Poggio" }),
				cli("vc-qu", "Maneggio Le Querce", "struttura", { indirizzo: "Via delle Querce 8" }),
				cli("vc-gv", "Giulia Verdi", "proprietario", {
					cliente_user_id: "demo-gv",
					nome_cavallo: "Aurora, Ombra"
				}),
				cli("vc-mb", "Marco Bianchi", "proprietario", { nome_cavallo: "Lampo" }),
				cli("vc-pn", "Paolo Neri", "proprietario", {
					cliente_user_id: "demo-pn",
					nome_cavallo: "Tango"
				}),
				cli("vc-sg", "Sara Gallo", "proprietario", {
					cliente_user_id: "demo-sg",
					nome_cavallo: "Luna"
				})
			],
			cavalliClientiMascalcia: [
				cav("vv-ne", "vc-sr", "Nerone"),
				cav("vv-ve", "vc-sr", "Vento"),
				cav("vv-br", "vc-cl", "Brezza"),
				cav("vv-st", "vc-cl", "Stella"),
				cav("vv-au", "vc-gv", "Aurora", {
					...sc,
					ubicazione_cliente_id: "vc-po"
				}),
				cav("vv-om", "vc-gv", "Ombra", {
					...sc,
					ubicazione_cliente_id: "vc-po"
				}),
				cav("vv-la", "vc-mb", "Lampo"),
				cav("vv-ta", "vc-pn", "Tango", {
					...sc,
					ubicazione_cliente_id: "vc-qu"
				}),
				cav("vv-lu", "vc-sg", "Luna")
			],
			interventiMascalcia: [
				vis("vi-1", "vc-sr", "vv-ne", "urgenza", "colica lieve", 0, "08:30"),
				vis("vi-2", "vc-gv", "vv-au", "visita", "zoppia ASx", 0, "09:40"),
				vis("vi-3", "vc-gv", "vv-om", "visita", "ecografia tendine", 0, "10:20"),
				vis("vi-4", "vc-pn", "vv-ta", "mtc", "agopuntura 3ª seduta", 0, "11:30"),
				vis("vi-5", "vc-cl", "vv-br", "vaccino", "influenza e tetano", 0, "14:30"),
				vis("vi-6", "vc-sg", "vv-lu", "fisio", "controllo schiena", 1, "09:00"),
				vis("vi-7", "vc-sr", "vv-ve", "visita", "controllo puledro", 2, "10:00"),
				vis("vi-8", "vc-sr", "vv-ne", "visita", "controllo", -12, "09:00", {
					importo: 120,
					stato_pagamento: "da_saldare"
				}),
				vis("vi-9", "vc-gv", "vv-au", "visita", "zoppia ASx", -20, "15:00", {
					importo: 140,
					stato_pagamento: "da_saldare"
				}),
				vis("vi-10", "vc-pn", "vv-ta", "mtc", "agopuntura 2ª seduta", -7, "11:00", {
					importo: 80,
					stato_pagamento: "da_saldare"
				}),
				vis("vi-11", "vc-cl", "vv-st", "vaccino", "influenza", -30, "14:00", {
					importo: 60,
					stato_pagamento: "saldato",
					prossima_scadenza: vdIso(150)
				})
			],
			messaggiMascalcia: [
				{
					id: "vm-1",
					cliente_mascalcia_id: "vc-pn",
					mittente_tipo: "cliente",
					testo: "Tango ha fatto lo stretching, grazie!",
					letto: false,
					created_at: vdIso(0) + "T09:12:00"
				},
				{
					id: "vm-2",
					cliente_mascalcia_id: "vc-sr",
					mittente_tipo: "cliente",
					testo: "Nerone si rotola, può venire prima?",
					letto: false,
					created_at: vdIso(0) + "T07:02:00"
				},
				{
					id: "vm-3",
					cliente_mascalcia_id: "vc-gv",
					mittente_tipo: "maniscalco",
					testo: "Ti ho mandato il referto di Aurora",
					letto: true,
					created_at: vdIso(-1) + "T18:20:00"
				},
				{
					id: "vm-4",
					cliente_mascalcia_id: "vc-sg",
					mittente_tipo: "cliente",
					testo: "Perfetto, ci vediamo alle 14:30",
					letto: true,
					created_at: vdIso(-3) + "T12:00:00"
				},
				{
					id: "vm-5",
					cliente_mascalcia_id: "vc-mb",
					mittente_tipo: "cliente",
					testo: "Grazie dottoressa, a presto",
					letto: true,
					created_at: vdIso(-4) + "T19:00:00"
				}
			]
		};
	}
	var vdFatto = false;
	async function vdPrepara() {
		if (vdFatto || typeof DEMO_MODE === "undefined" || !DEMO_MODE || typeof eVeterinario !== "function" || !eVeterinario()) return;
		vdFatto = true;
		Object.assign(demoState, vdDati());
		try {
			if (typeof loadClientiMascalcia === "function") await loadClientiMascalcia();
			if (typeof caricaUbicazioni === "function") await caricaUbicazioni(true);
			if (typeof renderProDeadlines === "function") await renderProDeadlines();
			if (typeof renderIncassi === "function") await renderIncassi();
		} catch (e) {
			console.warn("demo veterinario:", e);
		}
		if (typeof renderHomeVet === "function") renderHomeVet();
	}
	quandoApriPagina(function() {
		vdPrepara();
	});
	quandoAggiornaBarra(function() {
		vdPrepara();
	});
	// equo-app-src/src/ruoli/veterinario/moduli/03-agenda.js
	function vetEtichettaGruppo(ev, luogo) {
		const tipi = new Set((ev || []).map((e) => e.tipo_ferratura));
		const nCav = new Set((ev || []).map((e) => e.cavallo_cliente_id || e.horse_id || e.id)).size;
		if (tipi.has("urgenza")) return {
			cls: "vt-urg",
			html: "<span class=\"vt-b urg\">Urgente</span>"
		};
		const mf = [tipi.has("mtc") ? "MTC" : "", tipi.has("fisio") ? "Fisio" : ""].filter(Boolean);
		if (mf.length) return {
			cls: "",
			html: `<span class="vt-b tif">${mf.join(" · ")}</span>`
		};
		if ((ev || []).length && ev.every((e) => {
			const c = typeof clienteDiId === "function" ? clienteDiId(e.cliente_mascalcia_id) : null;
			return c && c.tipo_cliente === "struttura";
		}) && luogo && luogo.scuderia) return {
			cls: "",
			html: "<span class=\"vt-b testo\">paga la scuderia</span>"
		};
		return {
			cls: "",
			html: `<span class="vt-b testo">${nCav} ${nCav === 1 ? "cavallo" : "cavalli"}</span>`
		};
	}
	function vetTestiAgenda() {
		if (typeof eVeterinario !== "function" || !eVeterinario()) return;
		const s = document.querySelector("#ag-schede [data-s=\"prog\"] span");
		if (s && s.textContent !== "Da fissare") s.textContent = "Da fissare";
		const t = document.getElementById("pro-agenda-title");
		if (t && t.textContent !== "Agenda") t.textContent = "Agenda";
	}
	quandoApriPagina(function(p) {
		if (p === "pro-agenda") vetTestiAgenda();
	});
	// equo-app-src/src/ruoli/veterinario/moduli/04-clienti.js
	var vetCliFiltro = (() => {
		try {
			return localStorage.getItem("equo-vet-cli-filtro") || "tutti";
		} catch (e) {
			return "tutti";
		}
	})();
	function vetSuEquo(c) {
		return !!(c.cliente_user_id || c.collegamento_stato === "attivo");
	}
	function vetSigla(nome) {
		const p = String(nome || "?").trim().split(/\s+/).filter(Boolean);
		return ((p[0] || "?").charAt(0) + (p.length > 1 ? p[p.length - 1].charAt(0) : (p[0] || "").charAt(1) || "")).toUpperCase();
	}
	function vetCrediti() {
		const out = {};
		(typeof cliInterventi !== "undefined" ? cliInterventi : []).forEach((i) => {
			if (i.stato !== "fatto" || i.stato_pagamento !== "da_saldare") return;
			const resto = typeof pagResiduo === "function" ? pagResiduo(i) : Number(i.importo) || 0;
			if (resto > 0) out[i.cliente_mascalcia_id] = (out[i.cliente_mascalcia_id] || 0) + resto;
		});
		return out;
	}
	function vetFiltroClienti(k) {
		vetCliFiltro = k;
		try {
			localStorage.setItem("equo-vet-cli-filtro", k);
		} catch (e) {}
		const box = document.getElementById("clienti-list");
		if (box) vetRenderClienti(box);
	}
	function vetVaiLettera(l) {
		const el = document.querySelector(`#clienti-list .cli-lettera[data-l="${l}"]`);
		if (el) el.scrollIntoView({
			behavior: "smooth",
			block: "start"
		});
	}
	function vetRenderClienti(box) {
		const attivi = clientiAttivi();
		const crediti = vetCrediti();
		const cavalli = typeof cavalliCartella === "function" ? cavalliCartella() : [];
		const perCliente = {};
		cavalli.forEach((cv) => {
			(perCliente[cv.cliente_mascalcia_id] = perCliente[cv.cliente_mascalcia_id] || []).push(cv);
		});
		const filtri = [
			["tutti", "Tutti"],
			["privati", "Privati"],
			["scuderie", "Scuderie"],
			["crediti", "Crediti"]
		];
		if (!filtri.some((f) => f[0] === vetCliFiltro)) vetCliFiltro = "tutti";
		document.getElementById("cli-cartelle").innerHTML = filtri.map(([k, t]) => `<button role="tab" aria-selected="${vetCliFiltro === k}" class="${vetCliFiltro === k ? "on" : ""}" onclick="vetFiltroClienti('${k}')">${t}</button>`).join("");
		const nCli = attivi.length;
		document.getElementById("cli-cartella-sotto").innerHTML = `<span>${nCli} ${nCli === 1 ? "cliente" : "clienti"} · ${cavalli.length} ${cavalli.length === 1 ? "cavallo" : "cavalli"}</span><button class="vt-cli-nuovo" onclick="apriNuovoCliente('proprietario')">+ Cliente</button>`;
		const collega = document.getElementById("cli-collega-btn");
		if (collega) collega.style.display = "none";
		const f = typeof cercaFiltri !== "undefined" && cercaFiltri.clienti;
		if (f) f.inp.placeholder = "Nome, cavallo, microchip";
		const lista = attivi.filter((c) => vetCliFiltro === "privati" ? !isStruttura(c) : vetCliFiltro === "scuderie" ? isStruttura(c) : vetCliFiltro === "crediti" ? crediti[c.id] > 0 : true).sort((a, b) => (a.nome || "").localeCompare(b.nome || "", "it", { sensitivity: "base" }));
		let html = "", lettera = "";
		const lettere = [];
		lista.forEach((c) => {
			const l = (c.nome || "?").trim().charAt(0).toUpperCase();
			if (l !== lettera) {
				lettera = l;
				lettere.push(l);
				html += `<div class="cli-lettera" data-l="${escapeHtml(l)}">${escapeHtml(l)}</div>`;
			}
			const str = isStruttura(c), equo = vetSuEquo(c);
			const suoi = perCliente[c.id] || [];
			let sotto;
			if (str) {
				const qui = typeof cavalliQuiStanno === "function" ? cavalliQuiStanno(c.id).length : 0;
				const n = suoi.length + qui;
				sotto = [
					"Scuderia",
					n ? `${n} ${n === 1 ? "cavallo" : "cavalli"}` : "",
					equo ? "su Equo" : "non ancora su Equo"
				];
			} else {
				const nomi = suoi.length ? suoi.map((x) => x.nome) : typeof nomiCavalliCliente === "function" ? nomiCavalliCliente(c) : [];
				const dove = suoi.find((x) => x.ubicazione_tipo === "scuderia" && x.ubicazione_cliente_id);
				const posto = dove ? clienteDiId(dove.ubicazione_cliente_id)?.nome || dove.ubicazione_nome || "" : "";
				sotto = [nomi.slice(0, 3).join(", ") + (nomi.length > 3 ? "…" : ""), posto || (equo ? "" : "non ancora su Equo")];
			}
			const deve = crediti[c.id] || 0;
			const dx = deve > 0 ? `<span class="vt-cli-deve">${escapeHtml(formatEuro(deve))}</span>` : !equo ? `<span class="vt-cli-invita">Invita</span>` : `<span class="vt-cli-ok">in regola</span>`;
			const cerca = [typeof paroleCercaCliente === "function" ? paroleCercaCliente(c) : "", ...suoi.map((x) => [
				x.nome,
				x.microchip,
				x.codice_equo
			].filter(Boolean).join(" "))].join(" ");
			html += `<div class="cli-riga vt-cli" data-cerca="${escapeHtml(cerca)}" onclick="openClienteDetail('${c.id}')">
      <span class="cli-av vt-av ${str ? "str" : equo ? "equo" : "no"}">${escapeHtml(vetSigla(c.nome))}</span>
      <span class="cli-c"><b>${escapeHtml(c.nome)}</b><span>${escapeHtml(sotto.filter(Boolean).join(" · "))}</span></span>
      ${dx}</div>`;
		});
		if (!lista.length) html = `<div class="cli-vuoto cerca-ignora">${vetCliFiltro === "crediti" ? "Nessun cliente ti deve qualcosa: tutti in regola." : "Nessun cliente qui."}</div>`;
		box.innerHTML = html + (lettere.length > 4 ? `<div class="vt-indice cerca-ignora">${lettere.map((l) => `<button onclick="event.stopPropagation();vetVaiLettera('${escapeHtml(l)}')">${escapeHtml(l)}</button>`).join("")}</div>` : "");
		const arch = (clientiMascalcia || []).filter((c) => c.archiviato_il);
		document.getElementById("clienti-archiviati-box").innerHTML = arch.length ? `<details class="clienti-archiviati" style="margin-top:14px">
      <summary class="clienti-sez-title" style="cursor:pointer;padding:6px 0">ARCHIVIATI (${arch.length})</summary>
      <div class="cli-lista" style="opacity:.72">${arch.map((c) => `<div class="cli-riga" onclick="openClienteDetail('${c.id}')"><span class="cli-av vt-av no">${escapeHtml(vetSigla(c.nome))}</span><span class="cli-c"><b>${escapeHtml(c.nome)}</b><span>${escapeHtml(c.nome_cavallo || "")}</span></span><span class="cli-dx">›</span></div>`).join("")}</div></details>` : "";
	}
	// equo-app-src/src/ruoli/veterinario/moduli/05-messaggi.js
	var VM_MATITA = "<svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M12 20h9\"/><path d=\"M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z\"/></svg>";
	function vmCavalliDi(clienteId) {
		const nomi = (typeof cavalliCartella === "function" ? cavalliCartella() : []).filter((c) => c.cliente_mascalcia_id === clienteId || c.ubicazione_cliente_id === clienteId).map((c) => c.nome).filter(Boolean);
		return [...new Set(nomi)];
	}
	function vmUrgente(clienteId) {
		return (typeof hpAppuntamenti !== "undefined" ? hpAppuntamenti : []).some((e) => e.cliente_mascalcia_id === clienteId && e.tipo_ferratura === "urgenza" && e.stato !== "fatto");
	}
	function vmSigla(nome) {
		const p = String(nome || "?").trim().split(/\s+/).filter(Boolean);
		return ((p[0] || "?").charAt(0) + (p.length > 1 ? p[p.length - 1].charAt(0) : "")).toUpperCase();
	}
	function vmDecora() {
		if (typeof eVeterinario !== "function" || !eVeterinario()) return;
		document.querySelectorAll("#inbox-list .inbox-item, #inbox-strutture-list .inbox-item").forEach((it) => {
			if (it.dataset.vt) return;
			const m = (it.getAttribute("onclick") || "").match(/'([0-9a-zA-Z-]+)'\)\s*$/);
			const id = m ? m[1] : null;
			it.dataset.vt = "1";
			if (!id) return;
			const urg = vmUrgente(id), cav = vmCavalliDi(id).slice(0, 3);
			const nome = (it.querySelector(".inbox-name")?.textContent || "").split(" · ")[0];
			const av = it.querySelector(".horse-avatar");
			if (av) {
				av.innerHTML = escapeHtml(vmSigla(nome));
				av.classList.add("vt-av", urg ? "urg" : it.closest("#inbox-strutture-list") ? "str" : "equo");
			}
			it.classList.toggle("vt-urg", urg);
			const corpo = it.querySelector(".inbox-preview")?.parentElement;
			if (corpo && (urg || cav.length)) {
				const r = document.createElement("div");
				r.className = "vt-chips";
				r.innerHTML = (urg ? "<span class=\"vt-chip urg\">Urgente</span>" : "") + cav.map((n) => `<span class="vt-chip">${escapeHtml(n)}</span>`).join("");
				corpo.appendChild(r);
			}
		});
		vmFiltra();
	}
	function vmTesta() {
		if (typeof eVeterinario !== "function" || !eVeterinario()) return;
		const pag = document.getElementById("page-pro-inbox");
		if (!pag || pag.querySelector(".vt-msg-testa")) return;
		const tit = pag.querySelector(":scope > .section-title");
		const testa = document.createElement("div");
		testa.className = "vt-msg-testa";
		testa.innerHTML = `<button class="vt-matita" onclick="vmNuovoMessaggio()" aria-label="Nuovo messaggio">${VM_MATITA}</button>`;
		if (tit) tit.after(testa);
		const cerca = document.createElement("div");
		cerca.className = "vt-msg-cerca";
		cerca.innerHTML = "<input type=\"search\" id=\"vt-msg-cerca\" placeholder=\"Cerca persona o cavallo\" oninput=\"vmFiltra()\" autocomplete=\"off\">";
		testa.after(cerca);
	}
	function vmFiltra() {
		const q = (document.getElementById("vt-msg-cerca")?.value || "").trim().toLowerCase();
		document.querySelectorAll("#page-pro-inbox .inbox-item").forEach((it) => {
			it.style.display = !q || it.textContent.toLowerCase().includes(q) ? "" : "none";
		});
	}
	function vmNuovoMessaggio() {
		const lista = (typeof clientiAttivi === "function" ? clientiAttivi() : []).filter((c) => c.cliente_user_id || c.collegamento_stato === "attivo").sort((a, b) => (a.nome || "").localeCompare(b.nome || "", "it", { sensitivity: "base" }));
		const corpo = lista.length ? lista.map((c) => `<button class="hm-tappa" onclick="hmChiudi();openChatThread('${c.id}')"><span class="o">${escapeHtml(vmSigla(c.nome))}</span>
      <span class="c"><b>${escapeHtml(c.nome)}</b><span>${escapeHtml(vmCavalliDi(c.id).slice(0, 3).join(", "))}</span></span></button>`).join("") : "<div class=\"muted\" style=\"font-size:13.5px;padding:8px 0\">Nessun cliente su Equo: invitali dalla pagina Clienti.</div>";
		hmFoglio("Nuovo messaggio", "Scegli a chi scrivere: clienti e scuderie che usano Equo", corpo);
	}
	var vmOss = null;
	quandoApriPagina(function(p) {
		if (p !== "pro-inbox" || typeof eVeterinario !== "function" || !eVeterinario()) return;
		vmTesta();
		vmDecora();
		if (!vmOss && typeof MutationObserver === "function") {
			vmOss = new MutationObserver(() => vmDecora());
			["inbox-list", "inbox-strutture-list"].forEach((id) => {
				const el = document.getElementById(id);
				if (el) vmOss.observe(el, { childList: true });
			});
		}
	});
	// equo-app-src/src/ruoli/veterinario/moduli/06-galeno.js
	var GALENO_BENVENUTO = "Ciao, sono <strong>Galeno</strong>, l'agente di Equo per i veterinari. Cerco nelle schede verificate (clinica, prevenzione, normativa italiana ed europea) e ti dico sempre la fonte; ti spiego anche come usare l'app. Prova <em>\"criteri SIRS nel cavallo adulto\"</em>, <em>\"cosa faccio prima di trattare un cavallo DPA?\"</em> o <em>\"come aggiungo un appuntamento?\"</em>. Non prescrivo e non do dosi: la decisione clinica resta tua.";
	function galenoTestata() {
		if (typeof eVeterinario !== "function" || !eVeterinario()) return;
		const t = document.getElementById("ai-sheet-titolo");
		if (t) t.textContent = "Galeno · veterinaria";
		const b = document.getElementById("ai-benvenuto");
		if (b) b.innerHTML = GALENO_BENVENUTO;
		const i = document.getElementById("chat-input");
		if (i) i.placeholder = "Chiedi a Galeno…";
	}
	try {
		estendiDopo("aggiornaTestataAi", function() {
			try {
				galenoTestata();
			} catch (e) {
				console.error("galeno:", e);
			}
		});
	} catch (e) {
		console.error("galeno:", e);
	}
	// equo-app-src/src/ruoli/veterinario/moduli/07-scheda-visita.js
	var ARTI = [
		["ad", "ADx"],
		["as", "ASx"],
		["pd", "PDx"],
		["ps", "PSx"]
	];
	var zoppiaArti = (s, tab) => ARTI.map(([a, n]) => ({
		k: "zop_" + a,
		e: "Zoppia " + n,
		t: "scala",
		max: 5,
		s,
		tab,
		rosso: true
	}));
	var CAMPI_STANDARD = [
		{
			k: "motivo",
			e: "Motivo della visita",
			t: "riga",
			s: "Anamnesi"
		},
		{
			k: "anamnesi",
			e: "Cosa dice il proprietario",
			t: "testo",
			s: "Anamnesi",
			ph: "da quando, com'è cambiato, cosa è stato fatto"
		},
		{
			k: "temp",
			e: "Temperatura °C",
			t: "numero",
			s: "Esame obiettivo generale",
			mezzo: true
		},
		{
			k: "fc",
			e: "FC (bpm)",
			t: "numero",
			s: "Esame obiettivo generale",
			mezzo: true
		},
		{
			k: "fr",
			e: "FR (atti/min)",
			t: "numero",
			s: "Esame obiettivo generale",
			mezzo: true
		},
		{
			k: "trc",
			e: "TRC (s)",
			t: "numero",
			s: "Esame obiettivo generale",
			mezzo: true
		},
		{
			k: "mucose",
			e: "Mucose",
			t: "scelta",
			o: [
				"Rosee",
				"Pallide",
				"Iperemiche",
				"Itteriche",
				"Cianotiche"
			],
			s: "Esame obiettivo generale"
		},
		{
			k: "motilita",
			e: "Motilità intestinale (4 quadranti)",
			t: "scelta",
			o: [
				"Normale",
				"Ridotta",
				"Aumentata",
				"Assente"
			],
			s: "Esame obiettivo generale"
		},
		...zoppiaArti("Apparato locomotore"),
		{
			k: "flessione",
			e: "Test di flessione",
			t: "riga",
			s: "Apparato locomotore",
			ph: "es. positivo distale ASx"
		},
		{
			k: "polso",
			e: "Polso digitale",
			t: "riga",
			s: "Apparato locomotore"
		},
		{
			k: "diagnosi",
			e: "Diagnosi / ipotesi",
			t: "testo",
			s: "Diagnosi e piano"
		},
		{
			k: "cosa_fare",
			e: "Cosa fare",
			t: "testo",
			s: "Diagnosi e piano"
		},
		{
			k: "terapia",
			e: "Terapia",
			t: "testo",
			s: "Diagnosi e piano",
			ph: "farmaci, cure, esercizi"
		},
		{
			k: "ricontrollo",
			e: "Ricontrollo",
			t: "data",
			s: "Diagnosi e piano"
		},
		{
			k: "rev",
			e: "N. ricetta REV",
			t: "riga",
			s: "Diagnosi e piano",
			mezzo: true
		},
		{
			k: "dpa",
			e: "Stato del cavallo",
			t: "scelta",
			o: [
				"DPA",
				"Non DPA",
				"Da verificare"
			],
			s: "Diagnosi e piano"
		},
		{
			k: "sospensione",
			e: "Tempo di sospensione da annotare",
			t: "riga",
			s: "Diagnosi e piano",
			ph: "per i farmaci prescritti a un cavallo DPA"
		}
	];
	var PUNTI_DIAGNOSTICI = [
		["GV20", "Bai-hui"],
		["BL13", "Shu Polmone"],
		["BL15", "Shu Cuore"],
		["BL18", "Shu Fegato"],
		["BL20", "Shu Milza"],
		["BL23", "Shu Rene"],
		["BL25", "Shu Grosso intestino"],
		["GB21", "Base del collo"],
		["SI9", "Spalla"],
		["GB34", "Grassella"],
		["ST36", "Sotto la grassella"],
		["C", "Cervicale"]
	];
	var ZONE_PALPAZIONE = [
		"Nuca / atlante",
		"Collo (brachiocefalico)",
		"Trapezio",
		"Dorso (longissimo) sx",
		"Dorso (longissimo) dx",
		"Lombi",
		"Glutei",
		"Ischiotibiali"
	];
	var TAB_MTC = [
		["mtc", "Valutazione MTC"],
		["fisio", "Fisioterapia"],
		["tratt", "Trattamento"]
	];
	var CAMPI_MTC = [
		{
			k: "motivo",
			e: "Motivo della seduta",
			t: "riga",
			s: "Seduta",
			tab: "mtc"
		},
		{
			k: "cost",
			e: "Costituzione (5 elementi)",
			t: "scelta",
			o: [
				"Legno",
				"Fuoco",
				"Terra",
				"Metallo",
				"Acqua"
			],
			s: "Costituzione e Shen",
			tab: "mtc"
		},
		{
			k: "shen",
			e: "Shen (spirito)",
			t: "scelta",
			o: [
				"Calmo",
				"Vigile",
				"Ansioso",
				"Spento",
				"Aggressivo"
			],
			s: "Costituzione e Shen",
			tab: "mtc"
		},
		{
			k: "lingua",
			e: "Colore",
			t: "scelta",
			o: [
				"Rosa",
				"Pallida",
				"Rossa",
				"Viola"
			],
			s: "Lingua",
			tab: "mtc"
		},
		{
			k: "patina",
			e: "Patina",
			t: "scelta",
			o: [
				"Assente",
				"Sottile",
				"Spessa",
				"Gialla"
			],
			s: "Lingua",
			tab: "mtc"
		},
		{
			k: "umidita",
			e: "Umidità",
			t: "scelta",
			o: [
				"Secca",
				"Normale",
				"Umida"
			],
			s: "Lingua",
			tab: "mtc"
		},
		{
			k: "forma",
			e: "Forma",
			t: "multi",
			o: [
				"Gonfia",
				"Segni dei denti",
				"Fessure"
			],
			s: "Lingua",
			tab: "mtc"
		},
		{
			k: "polso_sx",
			e: "Polso sinistro",
			t: "riga",
			s: "Polso",
			tab: "mtc",
			ph: "profondità, forza, frequenza"
		},
		{
			k: "polso_dx",
			e: "Polso destro",
			t: "riga",
			s: "Polso",
			tab: "mtc",
			ph: "profondità, forza, frequenza"
		},
		{
			k: "polso_q",
			e: "Qualità del polso",
			t: "multi",
			o: [
				"Scivoloso",
				"A corda",
				"Sottile",
				"Irregolare"
			],
			s: "Polso",
			tab: "mtc"
		},
		...PUNTI_DIAGNOSTICI.map(([p, n]) => ({
			k: "scan_" + p,
			e: p + " · " + n,
			t: "scala",
			max: 3,
			s: "Scansione dei punti diagnostici (reattività 0–3)",
			tab: "mtc",
			rosso: true
		})),
		{
			k: "pr_yy",
			e: "Yin / Yang",
			t: "scelta",
			o: ["Yin", "Yang"],
			s: "Otto principi e sindrome",
			tab: "mtc"
		},
		{
			k: "pr_ie",
			e: "Interno / Esterno",
			t: "scelta",
			o: ["Interno", "Esterno"],
			s: "Otto principi e sindrome",
			tab: "mtc"
		},
		{
			k: "pr_fc",
			e: "Freddo / Calore",
			t: "scelta",
			o: ["Freddo", "Calore"],
			s: "Otto principi e sindrome",
			tab: "mtc"
		},
		{
			k: "pr_vp",
			e: "Vuoto / Pieno",
			t: "scelta",
			o: ["Vuoto", "Pieno"],
			s: "Otto principi e sindrome",
			tab: "mtc"
		},
		{
			k: "sindrome",
			e: "Sindrome",
			t: "riga",
			s: "Otto principi e sindrome",
			tab: "mtc",
			ph: "es. Stasi di Qi del Fegato"
		},
		...zoppiaArti("Zoppia (AAEP 0–5)", "fisio"),
		{
			k: "postura",
			e: "Postura e appiombi",
			t: "multi",
			o: [
				"Appiombi regolari",
				"Carico avanti",
				"Sotto di sé dietro",
				"Collo invertito",
				"Dorso rigido"
			],
			s: "Postura e appiombi",
			tab: "fisio"
		},
		...ZONE_PALPAZIONE.map((z, i) => ({
			k: "palp_" + i,
			e: z,
			t: "scala",
			max: 3,
			s: "Palpazione muscolare (dolore 0–3)",
			tab: "fisio",
			rosso: true
		})),
		{
			k: "collo",
			e: "Collo (flessione laterale con la carota)",
			t: "scelta",
			o: [
				"Normale",
				"Ridotta a sx",
				"Ridotta a dx",
				"Ridotta entrambi"
			],
			s: "Mobilità e test",
			tab: "fisio"
		},
		{
			k: "riflessi",
			e: "Riflessi dorsali",
			t: "scelta",
			o: [
				"Normali",
				"Ridotti",
				"Dolorosi"
			],
			s: "Mobilità e test",
			tab: "fisio"
		},
		{
			k: "sella",
			e: "Sella",
			t: "scelta",
			o: [
				"Ok",
				"Da controllare",
				"Non adatta"
			],
			s: "Mobilità e test",
			tab: "fisio"
		},
		{
			k: "tecnica",
			e: "Tecnica",
			t: "multi",
			o: [
				"Ago secco",
				"Elettroagopuntura",
				"Acquapuntura",
				"Moxa",
				"Laserpuntura",
				"Tui-na"
			],
			s: "Agopuntura",
			tab: "tratt"
		},
		{
			k: "hz",
			e: "Frequenza (Hz)",
			t: "numero",
			s: "Agopuntura",
			tab: "tratt",
			mezzo: true,
			se: (d) => (d.tecnica || []).includes("Elettroagopuntura")
		},
		{
			k: "minuti",
			e: "Durata (min)",
			t: "numero",
			s: "Agopuntura",
			tab: "tratt",
			mezzo: true,
			se: (d) => (d.tecnica || []).includes("Elettroagopuntura")
		},
		{
			k: "punti",
			e: "Punti trattati",
			t: "multi",
			o: [
				"GV20",
				"BL18",
				"BL23",
				"BL25",
				"GB21",
				"GB34",
				"ST36",
				"SP6",
				"LI4",
				"KID1"
			],
			s: "Agopuntura",
			tab: "tratt"
		},
		{
			k: "punti_altri",
			e: "Altri punti",
			t: "riga",
			s: "Agopuntura",
			tab: "tratt"
		},
		{
			k: "fito",
			e: "Fitoterapia / formula",
			t: "riga",
			s: "Agopuntura",
			tab: "tratt",
			ph: "es. formula e durata"
		},
		{
			k: "alimenti",
			e: "Consigli alimentari (MTC)",
			t: "riga",
			s: "Agopuntura",
			tab: "tratt",
			ph: "es. alimenti tiepidi, meno concentrati"
		},
		{
			k: "fisio_t",
			e: "Tecniche di fisioterapia",
			t: "multi",
			o: [
				"Massaggio",
				"Stretching passivo",
				"Mobilizzazioni",
				"Linfodrenaggio",
				"Laser",
				"TENS",
				"Ultrasuoni",
				"Magnetoterapia",
				"Kinesio taping"
			],
			s: "Fisioterapia",
			tab: "tratt"
		},
		{
			k: "risposta",
			e: "Risposta al trattamento",
			t: "multi",
			o: [
				"Rilassamento",
				"Sbadigli",
				"Masticazione",
				"Sonnolenza",
				"Reattivo / agitato"
			],
			s: "Risposta al trattamento",
			tab: "tratt"
		},
		{
			k: "esercizi",
			e: "Esercizi a casa",
			t: "testo",
			s: "Esercizi a casa",
			tab: "tratt",
			ph: "es. stretching con la carota, 3 per lato, mattina e sera, 14 giorni"
		},
		{
			k: "prossima",
			e: "Prossima seduta",
			t: "scelta",
			o: [
				"1 settimana",
				"2 settimane",
				"3 settimane",
				"4 settimane"
			],
			s: "Prossima seduta",
			tab: "tratt"
		}
	];
	var STD = (k) => ({ ...CAMPI_STANDARD.find((c) => c.k === k) });
	var ESEMPI_MODELLI = [
		{
			nome: "Controllo zoppia",
			base: "standard",
			campi: [
				STD("motivo"),
				STD("anamnesi"),
				...zoppiaArti("Apparato locomotore"),
				{
					k: "flessione",
					e: "Test di flessione",
					t: "scelta",
					o: [
						"Negativo",
						"Positivo distale",
						"Positivo prossimale",
						"Dubbio"
					],
					s: "Apparato locomotore"
				},
				STD("polso"),
				{
					k: "blocchi",
					e: "Blocchi anestetici",
					t: "testo",
					s: "Apparato locomotore",
					attivo: false
				},
				STD("diagnosi"),
				STD("terapia"),
				STD("ricontrollo")
			]
		},
		{
			nome: "Pre-acquisto",
			base: "standard",
			campi: [
				{
					k: "committente",
					e: "Per conto di",
					t: "riga",
					s: "Visita"
				},
				STD("motivo"),
				STD("temp"),
				STD("fc"),
				STD("fr"),
				STD("mucose"),
				{
					k: "auscultazione",
					e: "Cuore e polmoni",
					t: "testo",
					s: "Esame generale"
				},
				{
					k: "occhi",
					e: "Occhi",
					t: "testo",
					s: "Esame generale"
				},
				...zoppiaArti("Apparato locomotore"),
				{
					k: "flessioni",
					e: "Test di flessione",
					t: "testo",
					s: "Apparato locomotore"
				},
				{
					k: "esami",
					e: "Esami eseguiti o richiesti",
					t: "multi",
					o: [
						"Radiografie",
						"Ecografie",
						"Endoscopia",
						"Esami del sangue",
						"Antidoping"
					],
					s: "Esami"
				},
				{
					k: "conclusioni",
					e: "Conclusioni",
					t: "testo",
					s: "Conclusioni"
				}
			]
		},
		{
			nome: "Dentale",
			base: "standard",
			campi: [
				STD("motivo"),
				STD("anamnesi"),
				{
					k: "sedazione",
					e: "Sedazione",
					t: "sino",
					s: "Visita"
				},
				{
					k: "reperti",
					e: "Reperti dentali",
					t: "testo",
					s: "Visita"
				},
				{
					k: "trattamento",
					e: "Trattamento",
					t: "testo",
					s: "Visita"
				},
				STD("ricontrollo")
			]
		},
		{
			nome: "Vaccinazione",
			base: "standard",
			campi: [
				{
					k: "vaccini",
					e: "Vaccini",
					t: "multi",
					o: [
						"Influenza",
						"Tetano",
						"Rinopolmonite (EHV)",
						"West Nile"
					],
					s: "Vaccinazione"
				},
				{
					k: "prodotto",
					e: "Prodotto e lotto",
					t: "riga",
					s: "Vaccinazione"
				},
				{
					k: "passaporto",
					e: "Registrato sul passaporto",
					t: "sino",
					s: "Vaccinazione"
				},
				{
					k: "richiamo",
					e: "Prossimo richiamo",
					t: "data",
					s: "Vaccinazione"
				}
			]
		}
	];
	var TIPI_CAMPO = [
		["riga", "Testo breve"],
		["testo", "Testo lungo"],
		["numero", "Numero"],
		["scelta", "Scelta"],
		["multi", "Scelta multipla"],
		["scala", "Scala 0–5"],
		["scala3", "Scala 0–3"],
		["sino", "Sì / No"],
		["data", "Data"]
	];
	var NOME_TIPO = Object.fromEntries(TIPI_CAMPO);
	var vsEsc = (s) => escapeHtml(s == null ? "" : String(s));
	var vsSqlMancante = (e) => /visite_pro|modelli_visita|does not exist|schema cache/i.test(e?.message || "");
	var VsDB = {
		demo() {
			return demoState.visitePro = demoState.visitePro || {
				visite: [],
				modelli: []
			};
		},
		async visitaDiEvento(id) {
			if (DEMO_MODE) return this.demo().visite.find((v) => v.intervento_id === id) || null;
			const { data, error } = await sb.from("visite_pro").select("*").eq("intervento_id", id).maybeSingle();
			if (error) {
				if (!vsSqlMancante(error)) console.warn("visite_pro", error.message);
				return null;
			}
			return data;
		},
		async visiteCavallo(cavId, horseId) {
			if (DEMO_MODE) return this.demo().visite.filter((v) => cavId && v.cavallo_cliente_id === cavId || horseId && v.horse_id === horseId).sort((a, b) => String(b.data_visita).localeCompare(String(a.data_visita)));
			const filtri = [cavId ? "cavallo_cliente_id.eq." + cavId : "", horseId ? "horse_id.eq." + horseId : ""].filter(Boolean).join(",");
			if (!filtri) return [];
			const { data, error } = await sb.from("visite_pro").select("id, data_visita, modello_nome, stato, dati, intervento_id").or(filtri).order("data_visita", { ascending: false }).limit(20);
			if (error) {
				if (!vsSqlMancante(error)) console.warn("visite_pro", error.message);
				return [];
			}
			return data || [];
		},
		async salvaVisita(v) {
			if (DEMO_MODE) {
				const t = this.demo().visite;
				if (v.id) {
					const r = t.find((x) => x.id === v.id);
					Object.assign(r, v, { aggiornata_il: (/* @__PURE__ */ new Date()).toISOString() });
					return {
						data: r,
						error: null
					};
				}
				const r = {
					...v,
					id: "vp" + Math.random().toString(36).slice(2, 10),
					professionista_id: currentUser.id,
					creata_il: (/* @__PURE__ */ new Date()).toISOString()
				};
				t.push(r);
				return {
					data: r,
					error: null
				};
			}
			const { id, creata_il, aggiornata_il, professionista_id, ...campi } = v;
			return await (id ? sb.from("visite_pro").update(campi).eq("id", id) : sb.from("visite_pro").insert(campi)).select().single();
		},
		async modelli() {
			if (DEMO_MODE) return this.demo().modelli.filter((m) => !m.archiviato_il);
			const { data, error } = await sb.from("modelli_visita").select("*").is("archiviato_il", null).order("ordine").order("creato_il");
			if (error) {
				if (!vsSqlMancante(error)) console.warn("modelli_visita", error.message);
				return [];
			}
			return data || [];
		},
		async salvaModello(m) {
			if (DEMO_MODE) {
				const t = this.demo().modelli;
				if (m.id) {
					const r = t.find((x) => x.id === m.id);
					Object.assign(r, m);
					return {
						data: r,
						error: null
					};
				}
				const r = {
					...m,
					id: "mv" + Math.random().toString(36).slice(2, 10),
					creato_il: (/* @__PURE__ */ new Date()).toISOString()
				};
				t.push(r);
				return {
					data: r,
					error: null
				};
			}
			const { id, creato_il, aggiornato_il, professionista_id, ...campi } = m;
			return await (id ? sb.from("modelli_visita").update(campi).eq("id", id) : sb.from("modelli_visita").insert(campi)).select().single();
		}
	};
	var VS = {
		e: null,
		visita: null,
		campi: [],
		tab: "mtc",
		modelli: [],
		modello: null,
		timer: null,
		precedenti: [],
		schermo: "scelta"
	};
	function vsFoglio() {
		let f = document.getElementById("vs-foglio");
		if (!f) {
			f = document.createElement("div");
			f.id = "vs-foglio";
			f.className = "vs-foglio";
			f.setAttribute("role", "dialog");
			f.setAttribute("aria-modal", "true");
			f.innerHTML = "<div class=\"vs-testa\"><button class=\"vs-indietro\" onclick=\"vsIndietro()\" aria-label=\"Indietro\">‹</button><div class=\"vs-tt\"><b id=\"vs-titolo\"></b><small id=\"vs-sotto\"></small></div><span class=\"vs-salvato\" id=\"vs-salvato\"></span></div><div class=\"vs-corpo\" id=\"vs-corpo\"></div><div class=\"vs-piede\" id=\"vs-piede\"></div>";
			document.body.appendChild(f);
		}
		return f;
	}
	function vsTesta(t, s) {
		document.getElementById("vs-titolo").textContent = t;
		document.getElementById("vs-sotto").textContent = s || "";
	}
	function vsChiudi() {
		vsSalvaSubito();
		const f = document.getElementById("vs-foglio");
		if (f) f.classList.remove("aperto");
		document.body.classList.remove("vs-aperto");
	}
	function vsIndietro() {
		if (VS.schermo === "referto") return vsMostraScheda();
		if (VS.schermo === "referto-fatto") return vsChiudi();
		if (VS.schermo === "modello-edit" || VS.schermo === "miei") return vsMostraScelta();
		if (VS.schermo === "scheda" && !VS.visita?.id && !Object.keys(VS.visita?.dati || {}).length) return vsMostraScelta();
		vsChiudi();
	}
	var vsNomeCavallo = (e) => {
		try {
			return agNomeCavallo(e) || "";
		} catch (_) {
			return "";
		}
	};
	var vsNomeCliente = (e) => e?.clienti_mascalcia?.nome || (typeof clienteDiId === "function" ? clienteDiId(e?.cliente_mascalcia_id)?.nome : "") || "";
	async function vsApriDaEvento(id) {
		const e = typeof agEventiCache !== "undefined" && agEventiCache[id] || (hpAppuntamenti || []).find((x) => x.id === id);
		if (!e) return showToast("Visita non trovata");
		try {
			closeModal("modal-azioni-evento");
		} catch (_) {}
		VS.e = e;
		VS.precedenti = [];
		vsDemoPrepara();
		vsFoglio().classList.add("aperto");
		document.body.classList.add("vs-aperto");
		document.getElementById("vs-corpo").innerHTML = "<div class=\"vs-vuoto\">Carico la scheda…</div>";
		document.getElementById("vs-piede").innerHTML = "";
		const [v, modelli, prec] = await Promise.all([
			VsDB.visitaDiEvento(e.id),
			VsDB.modelli(),
			VsDB.visiteCavallo(e.cavallo_cliente_id, e.horse_id)
		]);
		VS.modelli = modelli;
		VS.precedenti = (prec || []).filter((p) => p.intervento_id !== e.id);
		if (v) {
			VS.visita = v;
			return vsMostraScheda();
		}
		vsMostraScelta();
	}
	function vsMostraScelta() {
		VS.schermo = "scelta";
		const e = VS.e;
		vsTesta(vsNomeCavallo(e) || "Visita", [vsNomeCliente(e), e.tipo_altro].filter(Boolean).join(" · "));
		const mtcSuggerito = ["mtc", "fisio"].includes(e.tipo_ferratura);
		const carta = (az, tit, et, txt, sugg) => `<button class="vs-carta${sugg ? " sugg" : ""}" onclick="${az}"><span class="c"><b>${tit}</b><span class="et">${et}</span><span class="tx">${txt}</span></span><span class="fr">›</span></button>`;
		document.getElementById("vs-corpo").innerHTML = `${vsPrecedentiHtml()}
    <div class="vs-h">Che visita fai?</div>
    ${carta("vsNuova('standard')", "Visita standard", "Clinica", "Anamnesi, esame obiettivo, locomotore, diagnosi, terapia", !mtcSuggerito)}
    ${carta("vsMostraMiei()", "I miei modelli", "Personalizzata", (VS.modelli.length ? VS.modelli.map((m) => m.nome).slice(0, 3).join(" · ") + " · " : "Controllo zoppia · Pre-acquisto · Dentale · ") + "+ crea il tuo")}
    ${carta("vsNuova('mtc')", "Agopuntura · MTC · Fisioterapia", "Specialistica", "Lingua e polso, scansione dei punti, zoppia e palpazione, trattamento ed esercizi a casa", mtcSuggerito)}`;
		document.getElementById("vs-piede").innerHTML = "";
	}
	function vsPrecedentiHtml() {
		if (!VS.precedenti.length) return "";
		const riga = (p) => {
			const d = p.dati || {};
			const cosa = d.diagnosi || d.sindrome || d.motivo || d.conclusioni || "";
			const [y, m, g] = String(p.data_visita).split("-");
			return `<div class="vs-prec-r"><span class="d">${g}/${m}/${String(y).slice(2)}</span><span class="t"><b>${vsEsc(p.modello_nome || "Visita")}</b>${cosa ? " · " + vsEsc(String(cosa).slice(0, 90)) : ""}</span>${p.stato === "bozza" ? "<span class=\"vs-et\">bozza</span>" : ""}</div>`;
		};
		return `<details class="vs-prec"${VS.schermo === "scelta" ? " open" : ""}><summary>Visite precedenti di ${vsEsc(vsNomeCavallo(VS.e) || "questo cavallo")} · ${VS.precedenti.length}</summary>${VS.precedenti.slice(0, 5).map(riga).join("")}</details>`;
	}
	function vsCampiDi(modello) {
		if (modello === "standard") return CAMPI_STANDARD;
		if (modello === "mtc") return CAMPI_MTC;
		const m = VS.modelli.find((x) => x.id === modello);
		return m ? (m.campi || []).filter((c) => c.attivo !== false) : CAMPI_STANDARD;
	}
	var vsNomeModello = (m) => m === "standard" ? "Visita standard" : m === "mtc" ? "Agopuntura · MTC · Fisioterapia" : VS.modelli.find((x) => x.id === m)?.nome || "Modello personale";
	function vsNuova(modello) {
		const e = VS.e, campi = vsCampiDi(modello);
		const personale = modello !== "standard" && modello !== "mtc";
		VS.visita = {
			intervento_id: e.id,
			cliente_id: e.cliente_mascalcia_id || null,
			cavallo_cliente_id: e.cavallo_cliente_id || null,
			horse_id: e.horse_id || null,
			professione: "veterinario",
			modello,
			modello_nome: vsNomeModello(modello),
			campi: personale ? campi : null,
			stato: "bozza",
			data_visita: e.data_intervento || isoLocale(/* @__PURE__ */ new Date()),
			dati: e.tipo_altro && campi.some((c) => c.k === "motivo") ? { motivo: e.tipo_altro } : {}
		};
		vsMostraScheda();
	}
	function vsMostraScheda() {
		VS.schermo = "scheda";
		const v = VS.visita;
		VS.campi = v.campi || vsCampiDi(v.modello);
		if (v.modello === "mtc" && !TAB_MTC.some((t) => t[0] === VS.tab)) VS.tab = "mtc";
		vsTesta("Visita · " + (vsNomeCavallo(VS.e) || "cavallo"), v.modello_nome + (v.stato === "conclusa" ? " · conclusa" : ""));
		vsDisegnaCorpo();
		document.getElementById("vs-piede").innerHTML = v.stato === "conclusa" ? "<button class=\"vs-btn\" onclick=\"vsChiudi()\">Chiudi</button><button class=\"vs-btn pri\" onclick=\"vrApri()\">Referto</button>" : "<button class=\"vs-btn\" onclick=\"vrApri()\">Referto</button><button class=\"vs-btn pri\" onclick=\"vsConcludi()\">Concludi la visita</button>";
	}
	function vsDisegnaCorpo() {
		const v = VS.visita, d = v.dati || {}, mtc = v.modello === "mtc";
		const campi = VS.campi.filter((c) => (!mtc || c.tab === VS.tab) && (!c.se || c.se(d)));
		const sezioni = [];
		campi.forEach((c) => {
			let s = sezioni.find((x) => x.n === c.s);
			if (!s) {
				s = {
					n: c.s || "Visita",
					c: []
				};
				sezioni.push(s);
			}
			s.c.push(c);
		});
		const tabs = mtc ? `<div class="vs-tabs" role="tablist">${TAB_MTC.map(([k, t]) => `<button role="tab" aria-selected="${VS.tab === k}" class="${VS.tab === k ? "on" : ""}" onclick="vsTab('${k}')">${t}</button>`).join("")}</div>` : "";
		const sola = v.stato === "conclusa";
		document.getElementById("vs-corpo").innerHTML = vsPrecedentiHtml() + tabs + (sola ? "<div class=\"vs-nota\">Visita conclusa: la scheda è in sola lettura.</div>" : "") + (d._referto ? `<div class="vs-nota">Referto inviato il ${new Date(d._referto.il).toLocaleDateString("it-IT")}${d._referto.a?.length ? " a " + vsEsc(d._referto.a.join(", ")) : ""}.</div>` : "") + sezioni.map((s) => `<section class="vs-sez"><h3>${vsEsc(s.n)}</h3><div class="vs-griglia">${s.c.map((c) => vsCampoHtml(c, d[c.k], sola)).join("")}</div></section>`).join("") + "<div class=\"vs-nota\">Foto, video e dettatura arrivano nei prossimi aggiornamenti.</div>";
	}
	function vsTab(k) {
		VS.tab = k;
		vsDisegnaCorpo();
		document.getElementById("vs-corpo").scrollTop = 0;
	}
	function vsCampoHtml(c, val, sola) {
		const id = "vs-f-" + c.k, dis = sola ? " disabled" : "", lab = `<label for="${id}">${vsEsc(c.e)}</label>`;
		const cls = "vs-campo" + (c.mezzo ? " mezzo" : "");
		const chip = (o, on, az) => `<button type="button" class="vs-chip${on ? " on" : ""}" aria-pressed="${on}"${dis} onclick="${az}">${vsEsc(o)}</button>`;
		switch (c.t) {
			case "testo": return `<div class="${cls} pieno">${lab}<textarea id="${id}" rows="3" placeholder="${vsEsc(c.ph || "")}"${dis} oninput="vsCambia('${c.k}', this.value)">${vsEsc(val || "")}</textarea></div>`;
			case "numero": return `<div class="${cls}">${lab}<input id="${id}" inputmode="decimal" value="${vsEsc(val ?? "")}" placeholder="${vsEsc(c.ph || "")}"${dis} oninput="vsCambia('${c.k}', this.value)"></div>`;
			case "data": return `<div class="${cls}">${lab}<input id="${id}" type="date" value="${vsEsc(val || "")}"${dis} onchange="vsCambia('${c.k}', this.value)"></div>`;
			case "scelta": return `<div class="${cls} pieno"><span class="vs-lab">${vsEsc(c.e)}</span><div class="vs-chips">${(c.o || []).map((o) => chip(o, val === o, `vsScegli('${c.k}', ${vsJs(o)})`)).join("")}</div></div>`;
			case "multi": {
				const sel = Array.isArray(val) ? val : [];
				return `<div class="${cls} pieno"><span class="vs-lab">${vsEsc(c.e)}</span><div class="vs-chips">${(c.o || []).map((o) => chip(o, sel.includes(o), `vsMulti('${c.k}', ${vsJs(o)})`)).join("")}</div></div>`;
			}
			case "scala": {
				const max = c.max || 5, n = Number(val) || 0;
				return `<div class="${cls} pieno vs-scala-r"><span class="vs-lab">${vsEsc(c.e)}</span><div class="vs-scala">${Array.from({ length: max + 1 }, (_, i) => `<button type="button" class="${i === n && val != null ? "on" : ""}${c.rosso && i >= Math.ceil(max / 2) ? " alto" : ""}" aria-pressed="${i === n && val != null}"${dis} onclick="vsScegli('${c.k}', ${i})">${i}</button>`).join("")}</div></div>`;
			}
			case "sino": return `<div class="${cls} pieno"><span class="vs-lab">${vsEsc(c.e)}</span><div class="vs-chips">${chip("Sì", val === true, `vsScegli('${c.k}', true)`)}${chip("No", val === false, `vsScegli('${c.k}', false)`)}</div></div>`;
			default: return `<div class="${cls}">${lab}<input id="${id}" value="${vsEsc(val || "")}" placeholder="${vsEsc(c.ph || "")}"${dis} oninput="vsCambia('${c.k}', this.value)"></div>`;
		}
	}
	var vsJs = (s) => vsEsc(JSON.stringify(s));
	function vsCambia(k, val) {
		VS.visita.dati = {
			...VS.visita.dati || {},
			[k]: val
		};
		vsSalvaPresto();
	}
	function vsScegli(k, val) {
		const d = VS.visita.dati || {};
		VS.visita.dati = {
			...d,
			[k]: d[k] === val ? null : val
		};
		vsSalvaPresto();
		vsRidisegna();
	}
	function vsMulti(k, o) {
		const d = VS.visita.dati || {}, l = Array.isArray(d[k]) ? d[k].slice() : [];
		const i = l.indexOf(o);
		if (i >= 0) l.splice(i, 1);
		else l.push(o);
		VS.visita.dati = {
			...d,
			[k]: l
		};
		vsSalvaPresto();
		vsRidisegna();
	}
	function vsRidisegna() {
		const b = document.getElementById("vs-corpo"), top = b.scrollTop;
		vsDisegnaCorpo();
		b.scrollTop = top;
	}
	function vsSalvaPresto() {
		clearTimeout(VS.timer);
		vsStato("…");
		VS.timer = setTimeout(vsSalvaSubito, 700);
	}
	async function vsSalvaSubito() {
		clearTimeout(VS.timer);
		VS.timer = null;
		while (VS.salvando) await new Promise((r) => setTimeout(r, 80));
		const v = VS.visita;
		if (!v) return;
		if (!v.id && !Object.values(v.dati || {}).some((x) => x != null && x !== "" && !(Array.isArray(x) && !x.length))) return;
		VS.salvando = true;
		const { data, error } = await VsDB.salvaVisita({
			...v,
			campi: v.campi ? v.campi.map(({ se, ...c }) => c) : null
		});
		VS.salvando = false;
		if (error) {
			vsStato("");
			showToast(vsSqlMancante(error) ? "La scheda visita non è ancora attiva: manca l'aggiornamento del database (SQL 31)." : "Errore nel salvare: " + error.message);
			return;
		}
		if (data && !v.id) v.id = data.id;
		vsStato("Salvato");
	}
	function vsStato(t) {
		const s = document.getElementById("vs-salvato");
		if (s) s.textContent = t;
	}
	async function vsConcludi() {
		const v = VS.visita, e = VS.e;
		if (!Object.values(v.dati || {}).some((x) => x != null && x !== "" && !(Array.isArray(x) && !x.length))) return showToast("La scheda è vuota: scrivi almeno il motivo o la diagnosi");
		v.stato = "conclusa";
		v.conclusa_il = (/* @__PURE__ */ new Date()).toISOString();
		await vsSalvaSubito();
		if (!v.id) {
			v.stato = "bozza";
			return;
		}
		vsChiudi();
		if (e && e.stato !== "fatto" && typeof segnaFatto === "function") {
			const r = await segnaFatto(e);
			if (r && r.ok) e.stato = "fatto";
		} else showToast("Visita conclusa");
		const d = v.dati || {};
		const quando = d.ricontrollo || d.richiamo || (d.prossima ? isoLocale(new Date(Date.now() + parseInt(d.prossima, 10) * 7 * 864e5)) : "");
		if (quando && typeof chiediSiNo === "function" && await chiediSiNo("Fisso il ricontrollo in agenda?", "Il " + (/* @__PURE__ */ new Date(quando + "T12:00")).toLocaleDateString("it-IT", {
			weekday: "long",
			day: "numeric",
			month: "long"
		}) + " per " + (vsNomeCavallo(e) || "il cavallo") + ".")) openInterventoModal(e.cliente_mascalcia_id, null, {
			tipo_ferratura: v.modello === "mtc" ? "mtc" : "visita",
			tipo_altro: "ricontrollo" + (d.motivo ? " · " + d.motivo : ""),
			data_intervento: quando,
			cavallo_cliente_id: e.cavallo_cliente_id || null,
			horse_id: e.horse_id || null
		});
	}
	function vsMostraMiei() {
		VS.schermo = "miei";
		vsTesta("I miei modelli", "Scegli un modello o costruisci il tuo");
		const miei = VS.modelli.map((m) => `<div class="vs-mod"><button class="vs-mod-usa" onclick="vsNuova('${m.id}')"><b>${vsEsc(m.nome)}</b><span>${(m.campi || []).filter((c) => c.attivo !== false).length} campi</span></button><button class="vs-mod-mod" onclick="vsModificaModello('${m.id}')">Modifica</button></div>`).join("");
		const esempi = ESEMPI_MODELLI.filter((x) => !VS.modelli.some((m) => m.nome === x.nome));
		document.getElementById("vs-corpo").innerHTML = (miei ? `<div class="vs-h">I tuoi modelli</div>${miei}` : "<div class=\"vs-nota\">Non hai ancora modelli tuoi: parti da un esempio o da zero.</div>") + (esempi.length ? `<div class="vs-h">Parti da un esempio</div><div class="vs-chips">${esempi.map((x) => `<button class="vs-chip" onclick="vsModelloDaEsempio(${vsJs(x.nome)})">${vsEsc(x.nome)}</button>`).join("")}</div>` : "") + `<div class="vs-h">Oppure</div><div class="vs-chips"><button class="vs-chip" onclick="vsModelloDa('standard')">Copia la visita standard</button><button class="vs-chip" onclick="vsModelloDa('mtc')">Copia MTC · Fisio</button><button class="vs-chip" onclick="vsModelloDa('vuoto')">+ Nuovo vuoto</button></div>`;
		document.getElementById("vs-piede").innerHTML = "";
	}
	var vsCopiaCampi = (l) => l.map(({ se, ...c }) => ({
		...c,
		attivo: c.attivo !== false
	}));
	function vsModelloDaEsempio(nome) {
		const x = ESEMPI_MODELLI.find((m) => m.nome === nome);
		VS.modello = {
			nome: x.nome,
			base: x.base,
			campi: vsCopiaCampi(x.campi)
		};
		vsMostraEditor();
	}
	function vsModelloDa(base) {
		VS.modello = {
			nome: base === "mtc" ? "La mia seduta MTC" : base === "vuoto" ? "Nuovo modello" : "La mia visita",
			base,
			campi: base === "vuoto" ? [] : vsCopiaCampi(base === "mtc" ? CAMPI_MTC.map((c) => ({
				...c,
				s: TAB_MTC.find((t) => t[0] === c.tab)[1] + " · " + c.s
			})) : CAMPI_STANDARD)
		};
		vsMostraEditor();
	}
	function vsModificaModello(id) {
		const m = VS.modelli.find((x) => x.id === id);
		VS.modello = JSON.parse(JSON.stringify(m));
		vsMostraEditor();
	}
	function vsMostraEditor() {
		VS.schermo = "modello-edit";
		const m = VS.modello;
		vsTesta(m.id ? "Modifica modello" : "Nuovo modello", "Accendi i campi che usi, spegni gli altri");
		document.getElementById("vs-corpo").innerHTML = `<div class="vs-campo pieno"><label for="vs-mod-nome">Nome del modello</label><input id="vs-mod-nome" maxlength="80" value="${vsEsc(m.nome)}" oninput="VS.modello.nome = this.value"></div>
    <div class="vs-pila">${m.campi.map((c, i) => `<div class="vs-cm${c.attivo === false ? " spento" : ""}">
      <span class="sp"><b>${vsEsc(c.e)}</b><small>${vsEsc(NOME_TIPO[c.t === "scala" && c.max === 3 ? "scala3" : c.t] || c.t)} · ${vsEsc(c.s || "")}</small></span>
      <button class="vs-fr" aria-label="Sposta su" onclick="vsSposta(${i}, -1)"${i === 0 ? " disabled" : ""}>↑</button><button class="vs-fr" aria-label="Sposta giù" onclick="vsSposta(${i}, 1)"${i === m.campi.length - 1 ? " disabled" : ""}>↓</button>
      <button class="vs-inter${c.attivo !== false ? " on" : ""}" role="switch" aria-checked="${c.attivo !== false}" aria-label="Campo ${vsEsc(c.e)}" onclick="vsAccendi(${i})"><span></span></button></div>`).join("") || "<div class=\"vs-nota\">Nessun campo: aggiungine uno.</div>"}</div>
    <details class="vs-nuovo-campo" id="vs-nuovo-campo"><summary>+ Aggiungi un campo</summary>
      <div class="vs-campo pieno"><label for="vs-nc-nome">Nome del campo</label><input id="vs-nc-nome" maxlength="60" placeholder="es. Ecografia tendine"></div>
      <div class="vs-campo pieno"><label for="vs-nc-tipo">Tipo</label><select id="vs-nc-tipo" onchange="document.getElementById('vs-nc-opz-b').hidden = !['scelta','multi'].includes(this.value)">${TIPI_CAMPO.map(([k, t]) => `<option value="${k}">${t}</option>`).join("")}</select></div>
      <div class="vs-campo pieno" id="vs-nc-opz-b" hidden><label for="vs-nc-opz">Scelte (separate da virgola)</label><input id="vs-nc-opz" placeholder="es. Negativo, Positivo, Dubbio"></div>
      <div class="vs-campo pieno"><label for="vs-nc-sez">Sezione</label><input id="vs-nc-sez" maxlength="60" value="${vsEsc(m.campi[m.campi.length - 1]?.s || "Visita")}"></div>
      <button class="vs-btn pri" onclick="vsAggiungiCampo()">Aggiungi</button></details>`;
		document.getElementById("vs-piede").innerHTML = "<button class=\"vs-btn\" onclick=\"vsMostraMiei()\">Annulla</button><button class=\"vs-btn pri\" onclick=\"vsSalvaModello()\">Salva il modello</button>";
	}
	function vsAccendi(i) {
		const c = VS.modello.campi[i];
		c.attivo = c.attivo === false;
		vsMostraEditor();
	}
	function vsSposta(i, d) {
		const l = VS.modello.campi, j = i + d;
		if (j < 0 || j >= l.length) return;
		[l[i], l[j]] = [l[j], l[i]];
		vsMostraEditor();
	}
	function vsAggiungiCampo() {
		const nome = document.getElementById("vs-nc-nome").value.trim(), tipo = document.getElementById("vs-nc-tipo").value;
		if (!nome) return showToast("Scrivi il nome del campo");
		const opz = document.getElementById("vs-nc-opz").value.split(",").map((s) => s.trim()).filter(Boolean);
		if (["scelta", "multi"].includes(tipo) && opz.length < 2) return showToast("Scrivi almeno due scelte, separate da virgola");
		const base = nome.toLowerCase().normalize("NFD").replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 30) || "campo";
		let k = "u_" + base, n = 2;
		while (VS.modello.campi.some((c) => c.k === k)) k = "u_" + base + "_" + n++;
		const c = {
			k,
			e: nome,
			t: tipo === "scala3" ? "scala" : tipo,
			s: document.getElementById("vs-nc-sez").value.trim() || "Visita",
			attivo: true
		};
		if (tipo === "scala3") c.max = 3;
		else if (tipo === "scala") c.max = 5;
		if (opz.length) c.o = opz;
		VS.modello.campi.push(c);
		vsMostraEditor();
	}
	async function vsSalvaModello() {
		const m = VS.modello;
		if (!String(m.nome || "").trim()) return showToast("Scrivi il nome del modello");
		if (!m.campi.some((c) => c.attivo !== false)) return showToast("Accendi almeno un campo");
		const { data, error } = await VsDB.salvaModello({
			id: m.id,
			nome: m.nome.trim(),
			base: m.base || "standard",
			campi: m.campi,
			ordine: m.ordine || 0
		});
		if (error) return showToast(vsSqlMancante(error) ? "I modelli non sono ancora attivi: manca l'aggiornamento del database (SQL 31)." : "Errore: " + error.message);
		VS.modelli = await VsDB.modelli();
		showToast("Modello salvato");
		if (VS.e && data) return vsNuova(data.id);
		vsMostraMiei();
	}
	var vsEventoAzioni = null;
	try {
		estendiDopo("apriAzioniEvento", function(e) {
			const box = document.querySelector("#modal-azioni-evento .ag-azioni");
			if (!box) return;
			let b = document.getElementById("azioni-evento-scheda");
			if (!b) {
				b = document.createElement("button");
				b.id = "azioni-evento-scheda";
				b.className = "btn btn-primary vs-azione";
				b.onclick = () => vsApriDaEvento(vsEventoAzioni);
				box.insertBefore(b, box.firstChild);
			}
			const vet = typeof eVeterinario === "function" && eVeterinario();
			b.style.display = vet && e && ![
				"annullato",
				"rifiutato",
				"richiesto",
				"proposto"
			].includes(e.stato) ? "" : "none";
			b.textContent = e && e.stato === "fatto" ? "Apri la scheda visita" : "Scheda visita";
			vsEventoAzioni = e ? e.id : null;
		});
	} catch (err) {
		console.error("scheda visita:", err);
	}
	function vsDemoPrepara() {
		if (!DEMO_MODE) return;
		const d = VsDB.demo();
		if (d.visite.length) return;
		const g = /* @__PURE__ */ new Date(Date.now() - 6048e5);
		d.visite.push({
			id: "vp-demo1",
			intervento_id: null,
			cliente_id: "vc-gv",
			cavallo_cliente_id: "vv-au",
			horse_id: null,
			modello: "standard",
			modello_nome: "Visita standard",
			stato: "conclusa",
			data_visita: isoLocale(g),
			dati: {
				motivo: "Zoppia ASx",
				diagnosi: "Sospetto ascesso subsolare ASx",
				zop_as: 2
			},
			professione: "veterinario"
		});
	}
	// equo-app-src/src/ruoli/veterinario/moduli/08-referto.js
	var vrEsc = (s) => escapeHtml(s == null ? "" : String(s));
	function vrValore(c, v) {
		if (v == null || v === "" || Array.isArray(v) && !v.length) return null;
		if (Array.isArray(v)) return v.join(", ");
		if (c.t === "sino") return v ? "Sì" : "No";
		if (c.t === "scala") return v + "/" + (c.max || 5);
		if (c.t === "data") {
			const [y, m, d] = String(v).split("-");
			return d ? `${d}/${m}/${y}` : String(v);
		}
		return String(v);
	}
	function vrSezioni() {
		const v = VS.visita, d = v.dati || {}, mtc = v.modello === "mtc";
		const out = [];
		(VS.campi || []).forEach((c) => {
			const val = vrValore(c, d[c.k]);
			if (val == null) return;
			const nomeSez = mtc ? {
				mtc: "Valutazione MTC",
				fisio: "Fisioterapia",
				tratt: "Trattamento"
			}[c.tab] + " · " + c.s : c.s || "Visita";
			let s = out.find((x) => x.n === nomeSez);
			if (!s) {
				s = {
					n: nomeSez,
					r: []
				};
				out.push(s);
			}
			s.r.push([c.e, val]);
		});
		return out;
	}
	function vrCavallo() {
		const e = VS.e;
		const cv = (typeof cavalliCartella === "function" ? cavalliCartella() : []).find((x) => x.id === e.cavallo_cliente_id) || {};
		const eta = cv.anno_nascita ? (/* @__PURE__ */ new Date()).getFullYear() - Number(cv.anno_nascita) + " anni" : cv.data_nascita ? (/* @__PURE__ */ new Date()).getFullYear() - Number(String(cv.data_nascita).slice(0, 4)) + " anni" : "";
		return {
			nome: cv.nome || vsNomeCavallo(e) || "Cavallo",
			razza: cv.razza || "",
			sesso: cv.sesso || "",
			eta,
			microchip: cv.microchip || "",
			codice: cv.codice_equo || "",
			proprietarioId: cv.cliente_mascalcia_id || e.cliente_mascalcia_id,
			luogoId: cv.ubicazione_cliente_id || null
		};
	}
	var vrCliente = (id) => typeof clienteDiId === "function" ? clienteDiId(id) : null;
	var vrStruttura = (c) => !!(c && (c.tipo_cliente === "struttura" || c.centro_id));
	function vrNomePro() {
		return currentUser?.datiPagamentoNome || currentUser?.fullName || currentUser?.full_name || currentUser?.email || "Veterinario";
	}
	function vrDestinatari() {
		const cav = vrCavallo(), e = VS.e, l = [];
		const prop = vrCliente(cav.proprietarioId);
		if (prop && !vrStruttura(prop)) l.push({
			k: "prop",
			cliente: prop,
			nome: prop.nome,
			ruolo: "Proprietario",
			suEquo: !!prop.cliente_user_id,
			on: !!prop.cliente_user_id
		});
		const str = vrCliente(cav.luogoId || (vrStruttura(vrCliente(e.cliente_mascalcia_id)) ? e.cliente_mascalcia_id : null));
		if (str && vrStruttura(str) && !l.some((x) => x.cliente.id === str.id)) l.push({
			k: "str",
			cliente: str,
			nome: str.nome,
			ruolo: prop && !vrStruttura(prop) ? "Scuderia dove sta il cavallo" : "Proprietario (scuderia)",
			suEquo: !!(str.centro_id || str.cliente_user_id),
			on: !prop && !!(str.centro_id || str.cliente_user_id)
		});
		return l;
	}
	var VR = { dest: [] };
	async function vrApri() {
		await vsSalvaSubito();
		if (!VS.visita?.id) return showToast("Scrivi prima qualcosa nella scheda");
		VS.schermo = "referto";
		const cav = vrCavallo(), sez = vrSezioni(), d = VS.visita.dati || {};
		if (!sez.length) return showToast("La scheda è vuota: non c'è niente da mettere nel referto");
		VR.dest = vrDestinatari();
		vsTesta("Referto pronto", cav.nome + " · " + VS.visita.modello_nome);
		const gia = d._referto ? `<div class="vs-nota">Referto già inviato il ${new Date(d._referto.il).toLocaleDateString("it-IT")}${d._referto.a?.length ? " a " + vrEsc(d._referto.a.join(", ")) : ""}: se lo rimandi, arriva la versione nuova.</div>` : "";
		document.getElementById("vs-corpo").innerHTML = `
    <div class="vs-galeno">Ho preparato il referto con i dati della scheda. <b>Rileggilo:</b> lo mandi tu, nessuno lo vede prima.</div>${gia}
    <div class="vr-foglio">
      <div class="vr-testa"><b>Referto · ${vrEsc(cav.nome)}</b><span>${(/* @__PURE__ */ new Date((VS.visita.data_visita || isoLocale(/* @__PURE__ */ new Date())) + "T12:00")).toLocaleDateString("it-IT")} · PDF</span></div>
      ${sez.map((s) => `<div class="vr-sez"><h4>${vrEsc(s.n)}</h4>${s.r.map(([k, v]) => `<div class="vr-r"><span>${vrEsc(k)}</span><b>${vrEsc(v)}</b></div>`).join("")}</div>`).join("")}
    </div>
    <div class="vs-h">Chi lo riceve</div>
    ${VR.dest.length ? VR.dest.map((x, i) => `<label class="vr-dest${x.suEquo ? "" : " fuori"}"><input type="checkbox" ${x.on ? "checked" : ""} ${x.suEquo ? "" : "disabled"} onchange="VR.dest[${i}].on = this.checked">
      <span><b>${vrEsc(x.nome)}</b><small>${vrEsc(x.ruolo)}${x.suEquo ? " · in chat su Equo" : " · non è su Equo: usa «Condividi»"}</small></span></label>`).join("") : "<div class=\"vs-nota\">Nessun destinatario su Equo per questo cavallo: usa «Condividi» per mandarlo con WhatsApp o email.</div>"}
    <div class="vs-nota">Il referto resta nella cartella del cavallo in uno spazio privato: lo vedono tu e il proprietario, e chi lo riceve. Il proprietario può togliere l'accesso a chi vuole (non a te).</div>
    <div class="vr-scorri" id="vr-scorri" role="slider" aria-label="Scorri per firmare e inviare" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" tabindex="0"
      onkeydown="if(event.key==='Enter')vrInvia()"><span class="vr-man" id="vr-man">›</span><span class="vr-tx">Scorri per firmare e inviare</span></div>`;
		document.getElementById("vs-piede").innerHTML = "<button class=\"vs-btn\" onclick=\"vsMostraScheda()\">Torna alla scheda</button><button class=\"vs-btn\" onclick=\"vrCondividi()\">Condividi</button>";
		vrScorri();
	}
	function vrScorri() {
		const s = document.getElementById("vr-scorri"), m = document.getElementById("vr-man");
		if (!s || !m) return;
		let x0 = null;
		s.addEventListener("pointerdown", (e) => {
			x0 = e.clientX;
			m.style.transition = "none";
			try {
				s.setPointerCapture(e.pointerId);
			} catch (_) {}
		});
		s.addEventListener("pointermove", (e) => {
			if (x0 === null) return;
			m.style.left = Math.max(5, Math.min(s.clientWidth - 53, 5 + e.clientX - x0)) + "px";
		});
		s.addEventListener("pointerup", (e) => {
			if (x0 === null) return;
			m.style.transition = "";
			const fatto = e.clientX - x0 > s.clientWidth * .6;
			x0 = null;
			if (fatto) {
				m.style.left = s.clientWidth - 53 + "px";
				vrInvia();
			} else m.style.left = "5px";
		});
	}
	async function vrCreaPdf() {
		const doc = new (await (caricaJsPdf()))({
			unit: "mm",
			format: "a4"
		});
		const W = 210, M = 18, notte = [
			29,
			45,
			80
		], tif = [
			127,
			209,
			201
		], grigio = [
			103,
			112,
			134
		], testo = [
			26,
			34,
			54
		], chiaro = [
			247,
			244,
			238
		];
		const cav = vrCavallo(), sez = vrSezioni(), prop = vrCliente(cav.proprietarioId);
		const dataVisita = (/* @__PURE__ */ new Date((VS.visita.data_visita || isoLocale(/* @__PURE__ */ new Date())) + "T12:00")).toLocaleDateString("it-IT", {
			day: "numeric",
			month: "long",
			year: "numeric"
		});
		const testa = () => {
			doc.setFillColor(...notte);
			doc.rect(0, 0, W, 30, "F");
			doc.setTextColor(255, 255, 255);
			doc.setFont("helvetica", "bold");
			doc.setFontSize(20);
			doc.text("Referto veterinario", M, 18);
			doc.setFont("helvetica", "normal");
			doc.setFontSize(10);
			doc.text(dataVisita, 192, 18, { align: "right" });
			doc.setFillColor(...tif);
			doc.rect(0, 30, W, 1.4, "F");
		};
		const piede = () => {
			doc.setDrawColor(230, 224, 212);
			doc.setLineWidth(.2);
			doc.line(M, 278, 192, 278);
			doc.setFont("helvetica", "normal");
			doc.setFontSize(8.2);
			doc.setTextColor(...grigio);
			doc.text("Documento clinico riservato. Generato con Equo (equohub.com). Conferma in app, non firma digitale qualificata.", M, 283);
		};
		testa();
		let y = 44;
		doc.setTextColor(...notte);
		doc.setFont("helvetica", "bold");
		doc.setFontSize(19);
		doc.text(cav.nome, M, y);
		y += 6;
		doc.setFont("helvetica", "normal");
		doc.setFontSize(10.5);
		doc.setTextColor(...grigio);
		doc.text([
			cav.razza,
			cav.sesso,
			cav.eta
		].filter(Boolean).join(" · ") || " ", M, y);
		y += 8;
		const info = [
			["Proprietario", prop?.nome || "—"],
			["Veterinario", vrNomePro() + (currentUser?.certificazioneStato === "verificato" ? " · Equo Certified" : "")],
			["Visita", VS.visita.modello_nome || "Visita"],
			cav.microchip ? ["Microchip", cav.microchip] : null,
			cav.codice ? ["Codice Equo", cav.codice] : null
		].filter(Boolean);
		doc.setFontSize(10.5);
		info.forEach(([k, v]) => {
			doc.setFont("helvetica", "bold");
			doc.setTextColor(...grigio);
			doc.text(k, M, y);
			doc.setFont("helvetica", "normal");
			doc.setTextColor(...testo);
			doc.text(String(v), 52, y);
			y += 6;
		});
		y += 4;
		const nuovaPagina = () => {
			piede();
			doc.addPage();
			testa();
			y = 42;
		};
		sez.forEach((s) => {
			if (y > 255) nuovaPagina();
			doc.setFillColor(...chiaro);
			doc.rect(M, y - 5, 174, 8, "F");
			doc.setFont("helvetica", "bold");
			doc.setFontSize(10.5);
			doc.setTextColor(...notte);
			doc.text(s.n.toUpperCase(), 21, y);
			y += 8;
			s.r.forEach(([k, v]) => {
				const righe = doc.splitTextToSize(String(v), 114);
				const h = Math.max(6.2, righe.length * 5 + 1.6);
				if (y + h > 272) nuovaPagina();
				doc.setFont("helvetica", "normal");
				doc.setFontSize(10);
				doc.setTextColor(...grigio);
				doc.text(doc.splitTextToSize(k, 54), 21, y);
				doc.setTextColor(...testo);
				doc.text(righe, 78, y);
				y += h;
			});
			y += 3;
		});
		if (y > 250) nuovaPagina();
		y += 8;
		doc.setFont("helvetica", "normal");
		doc.setFontSize(10);
		doc.setTextColor(...testo);
		doc.text("Confermato in app da " + vrNomePro() + " il " + (/* @__PURE__ */ new Date()).toLocaleString("it-IT", {
			day: "numeric",
			month: "long",
			year: "numeric",
			hour: "2-digit",
			minute: "2-digit"
		}) + ".", M, y);
		piede();
		const pulisci = (t) => String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "");
		const nome = [
			"Referto",
			pulisci(cav.nome),
			VS.visita.data_visita
		].filter(Boolean).join("_") + ".pdf";
		return {
			blob: doc.output("blob"),
			nome,
			titolo: "Referto " + cav.nome + " · " + dataVisita
		};
	}
	async function vrCondividi() {
		try {
			showToast("Creo il PDF…");
			const { blob, nome } = await vrCreaPdf();
			const file = new File([blob], nome, { type: "application/pdf" });
			if (navigator.canShare && navigator.canShare({ files: [file] })) try {
				await navigator.share({
					files: [file],
					title: nome
				});
				return;
			} catch (err) {
				if (err?.name === "AbortError") return;
			}
			const url = URL.createObjectURL(blob), a = document.createElement("a");
			a.href = url;
			a.download = nome;
			document.body.appendChild(a);
			a.click();
			a.remove();
			setTimeout(() => URL.revokeObjectURL(url), 3e4);
		} catch (err) {
			console.error("referto:", err);
			showToast("Impossibile creare il PDF: " + (err?.message || err));
		}
	}
	async function vrInvia() {
		if (VR.invio) return;
		VR.invio = true;
		try {
			const scelti = VR.dest.filter((x) => x.on && x.suEquo);
			showToast("Preparo e invio il referto…");
			const { blob, nome, titolo } = await vrCreaPdf();
			const v = VS.visita, e = VS.e;
			const { id, error } = await DB.caricaDocumentoPrivato({
				blob,
				nomeFile: nome,
				mime: "application/pdf",
				categoria: "referto",
				titolo,
				cavallo_cliente_id: v.cavallo_cliente_id || e.cavallo_cliente_id || null,
				horse_id: v.horse_id || e.horse_id || null,
				visita_id: v.id,
				autore_ruolo: "veterinario"
			});
			if (!id) {
				showToast(/documenti|bucket|not found|does not exist/i.test(error?.message || "") ? "Lo spazio privato dei documenti non è ancora attivo (SQL 32)." : "Errore nel salvare il referto: " + (error?.message || "riprova"));
				return;
			}
			const inviati = [], avvisi = [];
			for (const x of scelti) {
				const c = x.cliente;
				const acc = c.centro_id && !c.cliente_user_id ? await DB.condividiDocumento(id, {
					centro_id: c.centro_id,
					motivo: "chat"
				}) : c.cliente_user_id ? await DB.condividiDocumento(id, {
					user_id: c.cliente_user_id,
					motivo: "chat"
				}) : { ok: false };
				if (!acc?.ok) {
					avvisi.push(x.nome + (String(acc?.errore || "").startsWith("decide_proprietario") ? ": lo vedrà se il proprietario lo condivide" : ": non condiviso"));
					continue;
				}
				const { error: em } = await DB.insertMessaggioMascalcia({
					cliente_mascalcia_id: c.id,
					tipo: "documento",
					testo: "Referto della visita di " + vrCavallo().nome + " (" + (/* @__PURE__ */ new Date((v.data_visita || isoLocale(/* @__PURE__ */ new Date())) + "T12:00")).toLocaleDateString("it-IT") + ")",
					file_url: "equo-doc:" + id,
					file_nome: nome
				});
				if (em) avvisi.push(x.nome + ": messaggio non inviato");
				else inviati.push(x.nome);
			}
			v.dati = {
				...v.dati || {},
				_referto: {
					il: (/* @__PURE__ */ new Date()).toISOString(),
					a: inviati,
					documento_id: id
				}
			};
			await vsSalvaSubito();
			vrFatto(inviati, avvisi);
		} catch (err) {
			console.error("referto:", err);
			showToast("Impossibile inviare il referto: " + (err?.message || err));
		} finally {
			VR.invio = false;
		}
	}
	function vrFatto(inviati, avvisi) {
		VS.schermo = "referto-fatto";
		vsTesta("Fatto", vrCavallo().nome);
		const prop = VR.dest.find((x) => x.k === "prop" && inviati.includes(x.nome));
		document.getElementById("vs-corpo").innerHTML = `<div class="vr-ok"><span class="vr-spunta">✓</span><b>Referto ${inviati.length ? "inviato" : "salvato"}</b>
    <span>${inviati.length ? "In chat a " + vrEsc(inviati.join(", ")) + "." : "È nella cartella del cavallo, nello spazio privato."} Lo trovi anche nella scheda della visita.</span></div>
    ${avvisi.length ? `<div class="vs-nota">${avvisi.map(vrEsc).join("<br>")}</div>` : ""}`;
		document.getElementById("vs-piede").innerHTML = (prop ? `<button class="vs-btn" onclick="vsChiudi();openChatThread('${prop.cliente.id}')">Apri la chat</button>` : "") + "<button class=\"vs-btn pri\" onclick=\"vsChiudi()\">Chiudi</button>";
	}
	// equo-app-src/src/ruoli/veterinario/moduli/index.js
	Object.assign(window, {
		renderHomeVet: renderHomeVet$1,
		vhGiornata,
		vhDetta,
		vhMeteo,
		vdPrepara,
		vetEtichettaGruppo,
		vetTestiAgenda,
		vetRenderClienti,
		vetFiltroClienti,
		vetVaiLettera,
		vmDecora,
		vmFiltra,
		vmNuovoMessaggio,
		galenoTestata,
		vsMostraScheda,
		vrApri,
		vrInvia,
		vrCondividi,
		vrCreaPdf,
		vrSezioni,
		vrDestinatari,
		VR,
		vsApriDaEvento,
		vsMostraScelta,
		vsMostraMiei,
		vsNuova,
		vsTab,
		vsCambia,
		vsScegli,
		vsMulti,
		vsConcludi,
		vsChiudi,
		vsIndietro,
		vsModelloDaEsempio,
		vsModelloDa,
		vsModificaModello,
		vsAccendi,
		vsSposta,
		vsAggiungiCampo,
		vsSalvaModello,
		vsDemoPrepara,
		VS,
		VsDB
	});
})();

