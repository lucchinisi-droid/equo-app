
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
		vmNuovoMessaggio
	});
})();

