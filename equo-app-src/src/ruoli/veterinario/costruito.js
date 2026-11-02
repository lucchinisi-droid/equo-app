
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
		const ter = typeof ptConteggi === "function" ? ptConteggi() : {
			n: 0,
			saltate: 0
		};
		if (typeof ptCaricaInCorso === "function" && !PT.inCorso && !PT.promessa) ptCaricaInCorso().then(() => {
			if (document.getElementById("vh")) renderHomeVet$1();
		});
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
        <button onclick="ptElenco()"><b>${ter.n}</b><span>${ter.n === 1 ? "terapia" : "terapie"}${ter.saltate ? ` · <em class="vh-saltate">${ter.saltate} ${ter.saltate === 1 ? "saltata" : "saltate"}</em>` : ""}</span></button>
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
    ${avviso ? `<button class="vh-galeno" onclick="${avviso.az}"><span class="g">${VH_IC.piu}</span><span><b>Galeno:</b> ${escapeHtml(avviso.t)}</span></button>` : ""}
    ${vhRigheHtml()}
    <div class="vh-aiuto"><span class="ic"><i class="fa-solid fa-life-ring"></i></span><span class="t"><b>Segnalaci un problema o un consiglio</b>
      <small>Un errore, un'idea per migliorare l'app: ti rispondiamo via email.</small></span><button type="button" class="vh-aiuto-bt" onclick="apriTicketAssistenza()">Scrivici</button></div>`;
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
	function vhIcona(cls) {
		return document.querySelector("#hm .hm-riga." + cls + " .ic")?.innerHTML || "";
	}
	function vhRigheHtml() {
		const attivi = typeof clientiAttivi === "function" ? clientiAttivi() : [];
		const nCav = typeof cavalliCartella === "function" ? cavalliCartella().length : 0;
		const str = (c) => typeof isStruttura === "function" && isStruttura(c);
		const nCli = attivi.filter((c) => !str(c)).length, nScu = attivi.filter(str).length;
		const mese = (/* @__PURE__ */ new Date()).toLocaleDateString("it-IT", { month: "long" });
		const euro = (n) => formatEuro(Math.round(Number(n) || 0));
		const inc = `${escapeHtml(mese)} <strong>${euro(wgPro?.incassatoMese)}</strong>` + (wgPro?.daIncassareMese ? ` · da incassare <strong>${euro(wgPro.daIncassareMese)}</strong>` : "");
		const riga = (cls, az, t, sotto, extra) => `<button class="hm-riga ${cls}${extra ? " " + extra : ""}" onclick="${az}"><span class="ic">${vhIcona(cls)}</span>
    <span class="tx"><b>${t}</b><span>${sotto}</span></span><span class="fr"><svg class="hm-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg></span></button>`;
		return `<div class="hm-righe vh-righe">
    ${riga("r-cav", "vhVai('cavalli')", "Cavalli", `<strong>${nCav}</strong> ${nCav === 1 ? "cavallo che segui" : "cavalli che segui"}`)}
    ${riga("r-cli", "vhVai('privati')", "Clienti", `<strong>${nCli}</strong> ${nCli === 1 ? "proprietario" : "proprietari"}`)}
    ${riga("r-scu", "vhVai('scuderie')", "Scuderie", `<strong>${nScu}</strong> ${nScu === 1 ? "scuderia o maneggio" : "scuderie e maneggi"}`)}
    ${riga("r-inc", "showPage('pro-incassi')", "Incassi", inc, "solo-incassi")}</div>`;
	}
	function vhVai(filtro) {
		showPage("pro-clienti");
		if (typeof closeClienteDetail === "function") try {
			closeClienteDetail();
		} catch (_) {}
		if (typeof vetFiltroClienti === "function") vetFiltroClienti(filtro);
	}
	function vhGiornata() {
		showPage("pro-agenda");
		if (typeof tornaSettimanaCorrente === "function") tornaSettimanaCorrente();
	}
	function vhDetta() {
		if (typeof vdDaHome === "function") return vdDaHome();
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
	var clienteDi = (id) => (typeof clienteDiId === "function" ? clienteDiId(id) : null) || (clientiMascalcia || []).find((c) => c.id === id) || null;
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
	function vetFiltroClienti$1(k) {
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
			["cavalli", "Cavalli"],
			["terapia", "In terapia"],
			["crediti", "Crediti"]
		];
		if (typeof ptCaricaInCorso === "function" && !PT.inCorso && !PT.promessa) ptCaricaInCorso().then(() => {
			const b = document.getElementById("clienti-list");
			if (b) vetRenderClienti(b);
		});
		const inTerapia = typeof ptClientiInTerapia === "function" ? ptClientiInTerapia() : /* @__PURE__ */ new Set();
		if (!filtri.some((f) => f[0] === vetCliFiltro)) vetCliFiltro = "tutti";
		document.getElementById("cli-cartelle").innerHTML = filtri.map(([k, t]) => `<button role="tab" aria-selected="${vetCliFiltro === k}" class="${vetCliFiltro === k ? "on" : ""}" onclick="vetFiltroClienti('${k}')">${t}</button>`).join("");
		const nCli = attivi.length;
		document.getElementById("cli-cartella-sotto").innerHTML = `<span>${nCli} ${nCli === 1 ? "cliente" : "clienti"} · ${cavalli.length} ${cavalli.length === 1 ? "cavallo" : "cavalli"}</span><button class="vt-cli-nuovo" onclick="apriNuovoCliente('proprietario')">+ Cliente</button>`;
		const collega = document.getElementById("cli-collega-btn");
		if (collega) collega.style.display = "none";
		const f = typeof cercaFiltri !== "undefined" && cercaFiltri.clienti;
		if (f) f.inp.placeholder = "Nome, cavallo, microchip";
		if (vetCliFiltro === "cavalli") {
			const cav = cavalli.slice().sort((a, b) => (a.nome || "").localeCompare(b.nome || "", "it", { sensitivity: "base" }));
			const terCav = new Set((typeof PT !== "undefined" && PT.inCorso?.piani || []).flatMap((p) => [p.cavallo_cliente_id, p.horse_id]).filter(Boolean));
			box.innerHTML = cav.length ? cav.map((cv) => {
				const cli = clienteDi(cv.cliente_mascalcia_id);
				const cerca = [
					cv.nome,
					cv.microchip,
					cv.codice_equo,
					cli?.nome
				].filter(Boolean).join(" ");
				return `<div class="cli-riga vt-cli" data-cerca="${escapeHtml(cerca)}" onclick="apriCavalloDaCartella('${cv.cliente_mascalcia_id}', ${cv.id ? `'${cv.id}'` : "null"}, ${cv.horse_id ? `'${cv.horse_id}'` : "null"})">
        <span class="cli-av vt-av equo">${escapeHtml(vetSigla(cv.nome))}</span>
        <span class="cli-c"><b>${escapeHtml(cv.nome || "Cavallo")}${terCav.has(cv.id) || terCav.has(cv.horse_id) ? " <span class=\"vt-cli-ter\">in terapia</span>" : ""}</b><span>${escapeHtml([cv.razza, cli?.nome].filter(Boolean).join(" · "))}</span></span></div>`;
			}).join("") : "<div class=\"cli-vuoto cerca-ignora\">Nessun cavallo: si aggiungono dalla scheda del cliente.</div>";
			document.getElementById("clienti-archiviati-box").innerHTML = "";
			return;
		}
		const lista = attivi.filter((c) => vetCliFiltro === "privati" ? !isStruttura(c) : vetCliFiltro === "scuderie" ? isStruttura(c) : vetCliFiltro === "terapia" ? inTerapia.has(c.id) : vetCliFiltro === "crediti" ? crediti[c.id] > 0 : true).sort((a, b) => (a.nome || "").localeCompare(b.nome || "", "it", { sensitivity: "base" }));
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
      <span class="cli-c"><b>${escapeHtml(c.nome)}${inTerapia.has(c.id) ? " <span class=\"vt-cli-ter\">in terapia</span>" : ""}</b><span>${escapeHtml(sotto.filter(Boolean).join(" · "))}</span></span>
      ${dx}</div>`;
		});
		if (!lista.length) html = `<div class="cli-vuoto cerca-ignora">${vetCliFiltro === "crediti" ? "Nessun cliente ti deve qualcosa: tutti in regola." : vetCliFiltro === "terapia" ? "Nessun cavallo in terapia." : "Nessun cliente qui."}</div>`;
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
			k: "arti",
			e: "Arti · tendini",
			t: "mappa",
			modo: "segni",
			disegno: "arto",
			s: "Apparato locomotore"
		},
		{
			k: "zoccoli",
			e: "Zoccoli · suola",
			t: "mappa",
			modo: "segni",
			disegno: "zoccoli",
			s: "Apparato locomotore"
		},
		{
			k: "mappa",
			e: "Mappa del cavallo",
			t: "mappa",
			modo: "segni",
			s: "Mappa del cavallo"
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
			k: "lingua_zone",
			e: "Lingua per zone",
			t: "mappa",
			modo: "zone",
			s: "Lingua",
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
			tab: "mtc",
			vecchio: true,
			se: (d) => !!d.lingua
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
			tab: "mtc",
			vecchio: true,
			se: (d) => !!d.patina
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
			tab: "mtc",
			vecchio: true,
			se: (d) => !!d.umidita
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
			tab: "mtc",
			vecchio: true,
			se: (d) => Array.isArray(d.forma) && d.forma.length > 0
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
		{
			k: "mappa_mtc",
			e: "Punti sul cavallo",
			t: "mappa",
			modo: "punti",
			s: "Scansione dei punti diagnostici (reattività 0–3)",
			tab: "mtc"
		},
		...PUNTI_DIAGNOSTICI.map(([p, n]) => ({
			k: "scan_" + p,
			e: p + " · " + n,
			t: "scala",
			max: 3,
			s: "Scansione dei punti diagnostici (reattività 0–3)",
			tab: "mtc",
			rosso: true,
			vecchio: true,
			se: (d) => d["scan_" + p] != null
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
			k: "mappa_fisio",
			e: "Mappa del dolore",
			t: "mappa",
			modo: "segni",
			s: "Mappa del dolore",
			tab: "fisio"
		},
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
				STD("arti"),
				STD("zoccoli"),
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
					k: "denti",
					e: "Dentatura",
					t: "mappa",
					modo: "denti",
					s: "Dentatura"
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
		["data", "Data"],
		["mappa_segni", "Mappa del cavallo · segni"],
		["mappa_punti", "Mappa del cavallo · punti"],
		["mappa_arti", "Arti · tendini"],
		["mappa_zoccoli", "Zoccoli · suola"],
		["mappa_denti", "Dentatura"],
		["mappa_lingua", "Lingua per zone"]
	];
	var NOME_TIPO = Object.fromEntries(TIPI_CAMPO);
	NOME_TIPO.mappa = "Mappa del cavallo";
	var TIPO_MAPPA = {
		mappa_segni: { modo: "segni" },
		mappa_punti: { modo: "punti" },
		mappa_arti: {
			modo: "segni",
			disegno: "arto"
		},
		mappa_zoccoli: {
			modo: "segni",
			disegno: "zoccoli"
		},
		mappa_denti: { modo: "denti" },
		mappa_lingua: { modo: "zone" }
	};
	var vsNomeTipo = (c) => c.t === "mappa" ? NOME_TIPO[Object.keys(TIPO_MAPPA).find((t) => TIPO_MAPPA[t].modo === c.modo && (TIPO_MAPPA[t].disegno || "") === (c.disegno || "")) || "mappa_segni"] : NOME_TIPO[c.t === "scala" && c.max === 3 ? "scala3" : c.t] || c.t;
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
		if (typeof vdReset === "function") vdReset();
		vsSalvaSubito();
		const f = document.getElementById("vs-foglio");
		if (f) f.classList.remove("aperto");
		document.body.classList.remove("vs-aperto");
	}
	function vsIndietro() {
		if (VS.schermo === "referto") return vsMostraScheda();
		if (VS.schermo === "referto-fatto" || VS.schermo === "terapie") return vsChiudi();
		if (VS.schermo === "piano-voce") return vsMostraScheda();
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
	async function vsApriDaEvento(id, evento) {
		const e = evento || typeof agEventiCache !== "undefined" && agEventiCache[id] || (hpAppuntamenti || []).find((x) => x.id === id) || (typeof schedaStoricoCavallo !== "undefined" ? schedaStoricoCavallo : []).find((x) => x.id === id);
		if (!e) return showToast("Visita non trovata");
		try {
			closeModal("modal-azioni-evento");
		} catch (_) {}
		VS.e = e;
		VS.precedenti = [];
		vsDemoPrepara();
		if (typeof vaReset === "function") vaReset();
		if (typeof vdReset === "function") vdReset();
		if (typeof ptReset === "function") ptReset();
		if (typeof mpReset === "function") mpReset();
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
		if (typeof vaCarica === "function") vaCarica();
		if (typeof ptCarica === "function") ptCarica();
		if (typeof vdDopoScheda === "function") vdDopoScheda();
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
		document.getElementById("vs-corpo").innerHTML = vsPrecedentiHtml() + tabs + (sola ? "<div class=\"vs-nota\">Visita conclusa: la scheda è in sola lettura.</div>" : "") + (d._referto ? `<div class="vs-nota">Referto inviato il ${new Date(d._referto.il).toLocaleDateString("it-IT")}${d._referto.a?.length ? " a " + vsEsc(d._referto.a.join(", ")) : ""}.</div>` : "") + sezioni.map((s) => `<section class="vs-sez"><h3>${vsEsc(s.n)}</h3><div class="vs-griglia">${s.c.map((c) => vsCampoHtml(c, d[c.k], sola)).join("")}</div></section>`).join("") + (typeof vdSezioneHtml === "function" ? vdSezioneHtml() : "") + (typeof ptSezioneHtml === "function" ? ptSezioneHtml() : "") + (typeof vaSezioneHtml === "function" ? vaSezioneHtml() : "");
		if (typeof ptDisegna === "function") ptDisegna();
		if (typeof mpAttivaTutte === "function") mpAttivaTutte();
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
			case "mappa": return typeof mpCampoHtml === "function" ? mpCampoHtml(c, val, sola) : "";
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
	async function vsSalvaSubito(forza) {
		clearTimeout(VS.timer);
		VS.timer = null;
		while (VS.salvando) await new Promise((r) => setTimeout(r, 80));
		const v = VS.visita;
		if (!v) return;
		if (!v.id && !forza && !Object.values(v.dati || {}).some((x) => x != null && x !== "" && !(Array.isArray(x) && !x.length))) return;
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
	var vsCopiaCampi = (l) => l.filter((c) => !c.vecchio).map(({ se, ...c }) => ({
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
      <span class="sp"><b>${vsEsc(c.e)}</b><small>${vsEsc(vsNomeTipo(c))} · ${vsEsc(c.s || "")}</small></span>
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
			t: tipo === "scala3" ? "scala" : /^mappa_/.test(tipo) ? "mappa" : tipo,
			s: document.getElementById("vs-nc-sez").value.trim() || "Visita",
			attivo: true
		};
		if (TIPO_MAPPA[tipo]) Object.assign(c, TIPO_MAPPA[tipo]);
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
	// equo-app-src/src/ruoli/veterinario/moduli/09-allegati.js
	var VA_TIPI = [
		"foto_clinica",
		"video",
		"lastra",
		"ecografia",
		"esame",
		"documento"
	];
	var VA_ZONE = [
		"as",
		"ad",
		"ps",
		"pd",
		"piede_as",
		"piede_ad",
		"piede_ps",
		"piede_pd",
		"testa",
		"bocca",
		"occhi",
		"collo",
		"dorso",
		"torace",
		"addome",
		"pelle",
		"intero"
	];
	var VA_MAX_BYTE = 52428800;
	var VA_MAX_SEC = 185;
	var VA = {
		lista: [],
		altri: [],
		mini: {},
		attesa: null,
		aperto: null,
		chi: {},
		ultimaZona: null,
		carico: false
	};
	var vaEsc = (s) => escapeHtml(s == null ? "" : String(s));
	var vaJs = (s) => vaEsc(JSON.stringify(s));
	var vaGenere = (d) => /^image\//.test(d.mime || "") ? "foto" : /^video\//.test(d.mime || "") ? "video" : "documento";
	var vaEtichetta = (d) => /^image\//.test(d.mime || "") ? "FOTO" : /^video\//.test(d.mime || "") ? "VIDEO" : d.mime === "application/dicom" ? "DICOM" : "PDF";
	function vaInput(id, accept, capture) {
		let i = document.getElementById(id);
		if (!i) {
			i = document.createElement("input");
			i.type = "file";
			i.id = id;
			i.hidden = true;
			i.accept = accept;
			if (capture) i.setAttribute("capture", capture);
			i.addEventListener("change", (ev) => {
				const f = ev.target.files && ev.target.files[0];
				ev.target.value = "";
				if (f) vaFile(f);
			});
			document.body.appendChild(i);
		}
		return i;
	}
	function vaScegli$1(fonte) {
		({
			foto: () => vaInput("va-in-foto", "image/*", "environment"),
			galleria: () => vaInput("va-in-galleria", "image/*,video/*"),
			video: () => vaInput("va-in-video", "video/*", "environment"),
			file: () => vaInput("va-in-file", "application/pdf,application/dicom,.dcm,image/*")
		})[fonte]().click();
	}
	function vaDurata(file) {
		return new Promise((ok) => {
			const v = document.createElement("video"), u = URL.createObjectURL(file);
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
	async function vaFile(file) {
		const video = /^video\//.test(file.type) || /\.(mp4|mov|m4v|webm|3gp)$/i.test(file.name || "");
		const pdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name || "");
		const dicom = file.type === "application/dicom" || /\.dcm$/i.test(file.name || "");
		const img = /^image\//.test(file.type) || /\.(jpe?g|png|heic|heif|webp)$/i.test(file.name || "");
		if (!video && !pdf && !dicom && !img) return showToast("Puoi allegare foto, video, PDF o lastre (DICOM)");
		if (file.size > VA_MAX_BYTE) return showToast("File troppo pesante (massimo 50 MB)" + (video ? ": riprendi a qualità più bassa o accorcia il video" : ""));
		if (video) {
			if (await vaDurata(file) > VA_MAX_SEC) return showToast("Video troppo lungo: massimo 3 minuti");
		}
		const categoria = video ? "video" : dicom ? "lastra" : pdf ? "documento" : "foto_clinica";
		VA.attesa = {
			file,
			mime: file.type || (dicom ? "application/dicom" : pdf ? "application/pdf" : video ? "video/mp4" : "image/jpeg"),
			categoria,
			zona: VA.ultimaZona,
			nota: ""
		};
		vaRidisegna();
		document.getElementById("va-attesa")?.scrollIntoView({
			block: "center",
			behavior: "smooth"
		});
	}
	async function vaRiduci(file) {
		try {
			const bmp = await createImageBitmap(file);
			const k = Math.min(1, 2e3 / Math.max(bmp.width, bmp.height));
			const c = document.createElement("canvas");
			c.width = Math.round(bmp.width * k);
			c.height = Math.round(bmp.height * k);
			c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
			const b = await new Promise((r) => c.toBlob(r, "image/jpeg", .85));
			return b ? {
				blob: b,
				mime: "image/jpeg"
			} : {
				blob: file,
				mime: file.type
			};
		} catch (_) {
			return {
				blob: file,
				mime: file.type || "image/jpeg"
			};
		}
	}
	async function vaSalva() {
		const a = VA.attesa;
		if (!a || VA.carico) return;
		const v = VS.visita, e = VS.e;
		VA.carico = true;
		vaRidisegna();
		try {
			await vsSalvaSubito(true);
			if (!v.id) {
				showToast("Non riesco a salvare la scheda: riprova");
				return;
			}
			const { blob, mime } = /^image\/(jpe?g|png|webp|heic|heif)$/i.test(a.mime) ? await vaRiduci(a.file) : {
				blob: a.file,
				mime: a.mime
			};
			const r = await DB.caricaDocumentoPrivato({
				blob,
				mime,
				categoria: a.categoria,
				zona: a.zona,
				nota: a.nota,
				cavallo_nome: vsNomeCavallo(e),
				data_documento: v.data_visita,
				visita_id: v.id,
				cavallo_cliente_id: v.cavallo_cliente_id || e.cavallo_cliente_id || null,
				horse_id: v.horse_id || e.horse_id || null,
				autore_ruolo: "veterinario"
			});
			if (!r.id) {
				showToast("Caricamento non riuscito: " + (r.error?.message || "riprova"));
				return;
			}
			VA.ultimaZona = a.zona;
			VA.attesa = null;
			showToast("Salvato: " + (r.titolo || "allegato"));
			await vaCarica$1();
		} finally {
			VA.carico = false;
			vaRidisegna();
		}
	}
	function vaNomeLive() {
		const a = VA.attesa, el = document.querySelector(".va-anteprima-nome b");
		if (a && el) el.textContent = DB.titoloDocumento({
			cavallo: vsNomeCavallo(VS.e),
			data: VS.visita?.data_visita,
			categoria: a.categoria,
			zona: a.zona,
			nota: a.nota
		});
	}
	function vaAnnulla() {
		VA.attesa = null;
		vaRidisegna();
	}
	function vaImposta(k, val) {
		if (VA.attesa) {
			VA.attesa[k] = VA.attesa[k] === val && k === "zona" ? null : val;
			vaRidisegna();
		}
	}
	async function vaCarica$1() {
		const v = VS.visita, e = VS.e;
		if (!v) return;
		const [miei, tutti] = await Promise.all([v.id ? DB.listaDocumenti({ visita_id: v.id }) : [], DB.listaDocumenti({
			cavallo_cliente_id: v.cavallo_cliente_id || e?.cavallo_cliente_id,
			horse_id: v.horse_id || e?.horse_id
		})]);
		VA.lista = miei.filter((d) => d.categoria !== "referto");
		VA.altri = tutti.filter((d) => d.visita_id !== v.id || !v.id);
		vaRidisegna();
		for (const d of VA.lista.concat(VA.altri.slice(0, 8))) if (vaGenere(d) === "foto" && !VA.mini[d.id]) {
			const { url } = await DB.apriUrlDocumento(d.id, 600);
			if (url) {
				VA.mini[d.id] = url;
				vaRidisegna();
			}
		}
	}
	function vaRiga(d, mia) {
		const aperto = VA.aperto === d.id, chi = VA.chi[d.id];
		const mio = d.autore_user_id === currentUser?.id;
		const mini = VA.mini[d.id] ? `<img src="${vaEsc(urlSicuro(VA.mini[d.id]))}" alt="">` : `<span>${vaEtichetta(d)}</span>`;
		return `<div class="va-doc${aperto ? " aperto" : ""}">
    <button class="va-mini" onclick="apriDocumentoPrivato('${d.id}')" aria-label="Apri ${vaEsc(d.titolo)}">${mini}</button>
    <button class="va-tit" onclick="vaApri('${d.id}')"><b>${vaEsc(d.titolo)}</b><small>${vaEsc(DB.DOC_TIPI[d.categoria] || "Documento")}${d.autore_ruolo && !mio ? " · " + vaEsc(d.autore_ruolo) : ""}</small></button>
    ${aperto ? `<div class="va-azioni">
      <button onclick="apriDocumentoPrivato('${d.id}')">Apri</button>
      ${mio ? `<button onclick="vaModifica('${d.id}')">Cambia tipo o zona</button>` : ""}
      <button onclick="vaChiVede('${d.id}')">Chi lo vede</button>
      ${mio && mia ? `<button class="urg" onclick="vaElimina('${d.id}')">Elimina</button>` : ""}
    </div>${chi ? vaChiHtml(d, chi) : ""}` : ""}
  </div>`;
	}
	function vaApri(id) {
		VA.aperto = VA.aperto === id ? null : id;
		vaRidisegna();
	}
	function vaSezioneHtml$1() {
		const a = VA.attesa, sola = VS.visita?.stato === "conclusa";
		const chip = (on, az, t) => `<button type="button" class="vs-chip${on ? " on" : ""}" aria-pressed="${on}" onclick="${az}">${vaEsc(t)}</button>`;
		const attesa = a ? `<div class="va-attesa" id="va-attesa"><b>${vaEsc(a.mime.startsWith("image/") ? "Foto" : a.mime.startsWith("video/") ? "Video" : "File")} da salvare</b>
      <span class="vs-lab">Tipo</span><div class="vs-chips">${VA_TIPI.map((t) => chip(a.categoria === t, `vaImposta('categoria', ${vaJs(t)})`, DB.DOC_TIPI[t])).join("")}</div>
      <span class="vs-lab">Zona (facoltativa)</span><div class="vs-chips">${VA_ZONE.map((z) => chip(a.zona === z, `vaImposta('zona', ${vaJs(z)})`, DB.DOC_ZONE[z])).join("")}</div>
      <div class="vs-campo pieno"><label for="va-nota">Nota (facoltativa)</label><input id="va-nota" maxlength="120" value="${vaEsc(a.nota)}" placeholder="es. proiezione laterale" oninput="VA.attesa.nota = this.value; vaNomeLive()"></div>
      <div class="va-anteprima-nome">Nome: <b>${vaEsc(DB.titoloDocumento({
			cavallo: vsNomeCavallo(VS.e),
			data: VS.visita?.data_visita,
			categoria: a.categoria,
			zona: a.zona,
			nota: a.nota
		}))}</b></div>
      <div class="va-bott"><button class="vs-btn" onclick="vaAnnulla()">Annulla</button><button class="vs-btn pri" onclick="vaSalva()"${VA.carico ? " disabled" : ""}>${VA.carico ? "Salvo…" : "Salva"}</button></div></div>` : "";
		return `<section class="vs-sez" id="va-box"><h3>Foto, video e lastre</h3>
    ${sola ? "" : `<div class="va-tasti"><button onclick="vaScegli('foto')">Scatta foto</button><button onclick="vaScegli('galleria')">Dalla galleria</button><button onclick="vaScegli('video')">Video</button><button onclick="vaScegli('file')">File · PDF, lastre</button></div>`}
    ${attesa}
    ${VA.lista.length ? VA.lista.map((d) => vaRiga(d, true)).join("") : a ? "" : "<div class=\"vs-nota\">Nessun allegato in questa visita. Video fino a 3 minuti, file fino a 50 MB. Le lastre DICOM si salvano e si scaricano: per vederle serve il tuo programma.</div>"}
    ${VA.altri.length ? `<details class="va-altri"><summary>Documenti di questo cavallo · ${VA.altri.length}</summary>${VA.altri.map((d) => vaRiga(d, false)).join("")}</details>` : ""}
    <div class="vs-nota">Privati: li vedete tu e il proprietario. Il nome lo dà Equo (cavallo, data, tipo, zona).</div>
  </section>`;
	}
	function vaRidisegna() {
		const b = document.getElementById("va-box");
		if (b) b.outerHTML = vaSezioneHtml$1();
	}
	function vaModifica(id) {
		const d = VA.lista.concat(VA.altri).find((x) => x.id === id);
		if (!d) return;
		VA.attesa = {
			modifica: id,
			file: null,
			mime: d.mime || "",
			categoria: d.categoria,
			zona: d.zona,
			nota: d.nota || ""
		};
		vaRidisegna();
		const b = document.querySelector("#va-attesa .va-bott .pri");
		if (b) {
			b.textContent = "Salva le modifiche";
			b.setAttribute("onclick", "vaSalvaModifica()");
		}
	}
	async function vaSalvaModifica() {
		const a = VA.attesa;
		if (!a?.modifica) return;
		const { error } = await DB.aggiornaDocumento(a.modifica, {
			categoria: a.categoria,
			zona: a.zona,
			nota: a.nota,
			cavallo_nome: vsNomeCavallo(VS.e)
		});
		if (error) return showToast("Errore: " + error.message);
		VA.attesa = null;
		await vaCarica$1();
	}
	async function vaElimina(id) {
		if (!await chiediSiNo("Eliminare questo allegato?", "Sparisce dalla visita e da chi lo vede. Le copie già scaricate restano a chi le ha.")) return;
		const { error } = await DB.eliminaDocumento(id);
		if (error) return showToast("Errore: " + error.message);
		VA.aperto = null;
		await vaCarica$1();
	}
	async function vaChiVede(id) {
		VA.chi[id] = await DB.chiVedeDocumento(id) || { errore: true };
		vaRidisegna();
	}
	function vaChiHtml(d, c) {
		if (c.errore) return "<div class=\"vs-nota\">Puoi vedere chi ha accesso solo ai file tuoi o che gestisci.</div>";
		const righe = [];
		if (c.autore) righe.push(`<div class="va-chi-r"><span><b>${vaEsc(c.autore.nome)}</b><small>Autore · lo vede sempre</small></span></div>`);
		if (c.proprietario) righe.push(`<div class="va-chi-r"><span><b>${vaEsc(c.proprietario.nome)}</b><small>Proprietario · lo vede sempre</small></span></div>`);
		else righe.push("<div class=\"va-chi-r\"><span><b>Proprietario</b><small>Non è su Equo: lo vedrà quando si collega</small></span></div>");
		(c.accessi || []).forEach((a) => righe.push(`<div class="va-chi-r"><span><b>${vaEsc(a.nome || "—")}</b><small>${vaEsc({
			chat: "Ricevuto in chat",
			consulto: "Consulto",
			urgenza: "Accesso d'urgenza"
		}[a.motivo] || "Condiviso")}${a.da ? " da " + vaEsc(a.da) : ""}</small></span>${c.puoi_decidere ? `<button onclick="vaTogli('${d.id}', '${a.id}')">Togli</button>` : ""}</div>`));
		const str = typeof vrDestinatari === "function" ? vrDestinatari().find((x) => x.k === "str" && x.cliente.centro_id) : null;
		const giaStr = str && (c.accessi || []).some((a) => a.centro_id === str.cliente.centro_id);
		const fai = str && !giaStr ? c.puoi_decidere ? `<button class="vs-btn" onclick="vaFaiVedere('${d.id}', '${str.cliente.centro_id}')">Fai vedere a ${vaEsc(str.nome)}</button>` : `<div class="vs-nota">Chi altro lo vede lo decide ${c.decide === "proprietario" ? "il proprietario" : "la scuderia"}.</div>` : "";
		return `<div class="va-chi">${righe.join("")}${fai}<div class="vs-nota">Togliere l'accesso non cancella le copie già scaricate o girate fuori da Equo.</div></div>`;
	}
	async function vaTogli(docId, accId) {
		if (!(await DB.revocaAccessoDocumento(accId))?.ok) return showToast("Non puoi togliere questo accesso");
		await vaChiVede(docId);
	}
	async function vaFaiVedere(docId, centroId) {
		const r = await DB.condividiDocumento(docId, {
			centro_id: centroId,
			motivo: "condivisione"
		});
		if (!r?.ok) return showToast(String(r?.errore || "").startsWith("decide_") ? "Lo decide il proprietario" : "Non riuscito");
		await vaChiVede(docId);
	}
	function vaReset$1() {
		VA.lista = [];
		VA.altri = [];
		VA.attesa = null;
		VA.aperto = null;
		VA.chi = {};
	}
	// equo-app-src/src/ruoli/veterinario/moduli/08-referto.js
	var vrEsc = (s) => escapeHtml(s == null ? "" : String(s));
	function vrValore(c, v) {
		if (v == null || v === "" || Array.isArray(v) && !v.length) return null;
		if (c.t === "mappa") return typeof mpTesto === "function" ? mpTesto(c, v) : null;
		if (Array.isArray(v)) return v.join(", ");
		if (c.t === "sino") return v ? "Sì" : "No";
		if (c.t === "scala") return v + "/" + (c.max || 5);
		if (c.t === "data") {
			const [y, m, d] = String(v).split("-");
			return d ? `${d}/${m}/${y}` : String(v);
		}
		return String(v);
	}
	var VR_REL = ["diagnosi", "conclusioni"];
	var VR_TER = [
		"terapia",
		"cosa_fare",
		"ricontrollo",
		"rev",
		"dpa",
		"sospensione"
	];
	function vrSezioni() {
		const v = VS.visita, d = v.dati || {}, mtc = v.modello === "mtc";
		const out = [];
		(VS.campi || []).forEach((c) => {
			if (VR_REL.includes(c.k) || VR_TER.includes(c.k)) return;
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
	function vrParteScritta() {
		const d = VS.visita?.dati || {}, campi = VS.campi || [];
		const righe = (chiavi) => chiavi.map((k) => {
			const c = campi.find((x) => x.k === k);
			const val = c ? vrValore(c, d[k]) : null;
			return val == null ? null : [c.e, val];
		}).filter(Boolean);
		const piano = typeof ptRigheReferto === "function" ? ptRigheReferto() : [], attesa = typeof ptAttesaReferto === "function" ? ptAttesaReferto() : "";
		return {
			relazione: String(d.relazione || "").trim(),
			rel: righe(VR_REL),
			indicazioni: String(d.indicazioni || "").trim(),
			ter: righe(VR_TER),
			piano,
			attesa
		};
	}
	var vrScrittaVuota = (p) => !p.relazione && !p.rel.length && !p.indicazioni && !p.ter.length && !p.piano.length;
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
	function vrDestinatari$1() {
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
	var VR = {
		dest: [],
		alleg: /* @__PURE__ */ new Set()
	};
	async function vrApri$1() {
		await vsSalvaSubito();
		if (!VS.visita?.id) return showToast("Scrivi prima qualcosa nella scheda");
		VS.schermo = "referto";
		const cav = vrCavallo(), sez = vrSezioni(), d = VS.visita.dati || {}, ps = vrParteScritta();
		if (!sez.length && vrScrittaVuota(ps)) return showToast("La scheda è vuota: non c'è niente da mettere nel referto");
		VR.dest = vrDestinatari$1();
		VR.alleg = new Set([...VR.alleg].filter((id) => VA.lista.some((a) => a.id === id)));
		vsTesta("Referto pronto", cav.nome + " · " + VS.visita.modello_nome);
		const gia = d._referto ? `<div class="vs-nota">Referto già inviato il ${new Date(d._referto.il).toLocaleDateString("it-IT")}${d._referto.a?.length ? " a " + vrEsc(d._referto.a.join(", ")) : ""}: se lo rimandi, arriva la versione nuova.</div>` : "";
		document.getElementById("vs-corpo").innerHTML = `
    <div class="vs-galeno">Ho preparato il referto con i dati della scheda${ps.relazione ? " e la tua relazione" : ""}. <b>Rileggilo:</b> lo mandi tu, nessuno lo vede prima.</div>${gia}
    <div class="vr-foglio">
      <div class="vr-testa"><b>Referto · ${vrEsc(cav.nome)}</b><span>${(/* @__PURE__ */ new Date((VS.visita.data_visita || isoLocale(/* @__PURE__ */ new Date())) + "T12:00")).toLocaleDateString("it-IT")} · PDF</span></div>
      ${sez.map((s) => `<div class="vr-sez"><h4>${vrEsc(s.n)}</h4>${s.r.map(([k, v]) => `<div class="vr-r"><span>${vrEsc(k)}</span><b>${vrEsc(v)}</b></div>`).join("")}</div>`).join("")}
      <div class="vr-sez vr-scritta"><h4>Relazione del veterinario</h4>
        <textarea id="vr-relazione" rows="${Math.min(12, Math.max(3, Math.ceil(ps.relazione.length / 45)))}" placeholder="Scrivila qui o dettala" oninput="vsCambia('relazione', this.value)">${vrEsc(ps.relazione)}</textarea>
        ${ps.rel.map(([k, v]) => `<div class="vr-r"><span>${vrEsc(k)}</span><b>${vrEsc(v)}</b></div>`).join("")}</div>
      <div class="vr-sez vr-scritta"><h4>Terapia e indicazioni</h4>
        <textarea id="vr-indicazioni" rows="${Math.min(10, Math.max(2, Math.ceil(ps.indicazioni.length / 45)))}" placeholder="Farmaci, dosi, durata, cosa fare a casa" oninput="vsCambia('indicazioni', this.value)">${vrEsc(ps.indicazioni)}</textarea>
        ${ps.ter.map(([k, v]) => `<div class="vr-r"><span>${vrEsc(k)}</span><b>${vrEsc(v)}</b></div>`).join("")}
        ${ps.piano.length ? `<div class="vr-piano"><h5>Piano terapeutico</h5>${ps.piano.map(([k, v]) => `<div class="vr-r"><span>${vrEsc(k)}</span><b>${vrEsc(v)}</b></div>`).join("")}${ps.attesa ? `<div class="vr-attesa">${vrEsc(ps.attesa)}</div>` : ""}</div>` : ""}</div>
      <button type="button" class="vd-detta piccolo" onclick="vdDetta()"><span class="c"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0M12 17v5"/></svg></span><span><b>Detta</b><small>Galeno scrive relazione e terapia</small></span></button>
    </div>
    ${VA.lista.length ? `<div class="vs-h">Allegati da mandare con il referto</div>${VA.lista.map((a) => `<label class="vr-dest"><input type="checkbox" ${VR.alleg.has(a.id) ? "checked" : ""} onchange="this.checked ? VR.alleg.add('${a.id}') : VR.alleg.delete('${a.id}')"><span><b>${vrEsc(a.titolo)}</b><small>${vrEsc(DB.DOC_TIPI[a.categoria] || "Documento")}</small></span></label>`).join("")}` : ""}
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
		const disegni = typeof mpImmaginiPdf === "function" ? await mpImmaginiPdf().catch(() => []) : [];
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
		if (disegni.length) {
			if (y > 225) nuovaPagina();
			doc.setFillColor(...chiaro);
			doc.rect(M, y - 5, 174, 8, "F");
			doc.setFont("helvetica", "bold");
			doc.setFontSize(10.5);
			doc.setTextColor(...notte);
			doc.text("DISEGNI", 21, y);
			y += 8;
			const larg = 84;
			let col = 0, hRiga = 0;
			const aCapo = () => {
				y += hRiga + 4;
				col = 0;
				hRiga = 0;
			};
			disegni.forEach((im) => {
				const box = im.grande ? [174, 125] : [larg, 72];
				const s = Math.min(box[0] / im.w, box[1] / im.h), w = im.w * s, h = im.h * s;
				if (im.grande && col) aCapo();
				if (y + h + 6 > 272) {
					nuovaPagina();
					col = 0;
					hRiga = 0;
				}
				const x0 = im.grande ? M : M + col * 90, lw = im.grande ? 174 : larg;
				doc.setFont("helvetica", "bold");
				doc.setFontSize(9);
				doc.setTextColor(...grigio);
				doc.text(im.titolo, x0 + lw / 2, y, { align: "center" });
				doc.addImage(im.url, "JPEG", x0 + (lw - w) / 2, y + 2, w, h);
				hRiga = Math.max(hRiga, h + 4);
				if (im.grande || col === 1) aCapo();
				else col = 1;
			});
			if (col) aCapo();
			y += 3;
		}
		const ps = vrParteScritta();
		const titoloSez = (t) => {
			if (y > 255) nuovaPagina();
			doc.setFillColor(...chiaro);
			doc.rect(M, y - 5, 174, 8, "F");
			doc.setFont("helvetica", "bold");
			doc.setFontSize(10.5);
			doc.setTextColor(...notte);
			doc.text(t, 21, y);
			y += 8;
		};
		const paragrafi = (t) => String(t || "").split(/\n+/).map((x) => x.trim()).filter(Boolean).forEach((par) => {
			doc.setFont("helvetica", "normal");
			doc.setFontSize(10.5);
			doc.setTextColor(...testo);
			doc.splitTextToSize(par, 168).forEach((r) => {
				if (y > 272) nuovaPagina();
				doc.text(r, 21, y);
				y += 5.4;
			});
			y += 2;
		});
		const righeCampi = (l) => l.forEach(([k, v]) => {
			const righe = doc.splitTextToSize(String(v), 114), h = Math.max(6.2, righe.length * 5 + 1.6);
			if (y + h > 272) nuovaPagina();
			doc.setFont("helvetica", "bold");
			doc.setFontSize(10);
			doc.setTextColor(...grigio);
			doc.text(doc.splitTextToSize(k, 54), 21, y);
			doc.setFont("helvetica", "normal");
			doc.setTextColor(...testo);
			doc.text(righe, 78, y);
			y += h;
		});
		if (ps.relazione || ps.rel.length) {
			titoloSez("RELAZIONE DEL VETERINARIO");
			paragrafi(ps.relazione);
			righeCampi(ps.rel);
			y += 3;
		}
		if (ps.indicazioni || ps.ter.length || ps.piano.length) {
			titoloSez("TERAPIA E INDICAZIONI");
			paragrafi(ps.indicazioni);
			righeCampi(ps.ter);
			if (ps.piano.length) {
				if (y > 262) nuovaPagina();
				doc.setFont("helvetica", "bold");
				doc.setFontSize(10);
				doc.setTextColor(...notte);
				doc.text("Piano terapeutico", 21, y);
				y += 6;
				righeCampi(ps.piano);
				if (ps.attesa) {
					if (y > 272) nuovaPagina();
					doc.setFont("helvetica", "bold");
					doc.setFontSize(10);
					doc.setTextColor(...testo);
					doc.text(ps.attesa, 21, y);
					y += 6;
				}
			}
			y += 3;
		}
		const alleg = VA.lista.filter((a) => VR.alleg.has(a.id));
		if (alleg.length) {
			if (y > 245) nuovaPagina();
			doc.setFillColor(...chiaro);
			doc.rect(M, y - 5, 174, 8, "F");
			doc.setFont("helvetica", "bold");
			doc.setFontSize(10.5);
			doc.setTextColor(...notte);
			doc.text("ALLEGATI", 21, y);
			y += 8;
			doc.setFont("helvetica", "normal");
			doc.setFontSize(10);
			doc.setTextColor(...testo);
			alleg.forEach((a) => {
				if (y > 272) nuovaPagina();
				doc.text("· " + a.titolo, 21, y);
				y += 6;
			});
		}
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
		const nome = DB.nomeFileDocumento({
			mime: "application/pdf",
			data_documento: VS.visita.data_visita,
			categoria: "referto"
		}, cav.nome);
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
			const { id, error, numero } = await DB.caricaDocumentoPrivato({
				blob,
				mime: "application/pdf",
				categoria: "referto",
				cavallo_nome: vrCavallo().nome,
				data_documento: v.data_visita,
				cavallo_cliente_id: v.cavallo_cliente_id || e.cavallo_cliente_id || null,
				horse_id: v.horse_id || e.horse_id || null,
				visita_id: v.id,
				autore_ruolo: "veterinario"
			});
			if (!id) {
				showToast(/documenti|bucket|not found|does not exist/i.test(error?.message || "") ? "Lo spazio privato dei documenti non è ancora attivo (SQL 32)." : "Errore nel salvare il referto: " + (error?.message || "riprova"));
				return;
			}
			const nomeFile = DB.nomeFileDocumento({
				mime: "application/pdf",
				data_documento: v.data_visita,
				categoria: "referto",
				numero
			}, vrCavallo().nome);
			const alleg = VA.lista.filter((a) => VR.alleg.has(a.id));
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
					file_nome: nomeFile
				});
				if (em) {
					avvisi.push(x.nome + ": messaggio non inviato");
					continue;
				}
				inviati.push(x.nome);
				for (const a of alleg) {
					const dest = c.centro_id && !c.cliente_user_id ? {
						centro_id: c.centro_id,
						motivo: "chat"
					} : {
						user_id: c.cliente_user_id,
						motivo: "chat"
					};
					if (!(await DB.condividiDocumento(a.id, dest))?.ok) {
						avvisi.push(a.titolo + " → " + x.nome + ": non condiviso");
						continue;
					}
					await DB.insertMessaggioMascalcia({
						cliente_mascalcia_id: c.id,
						tipo: /^image\//.test(a.mime || "") ? "foto" : /^video\//.test(a.mime || "") ? "video" : "documento",
						testo: a.titolo,
						file_url: "equo-doc:" + a.id,
						file_nome: DB.nomeFileDocumento(a, vrCavallo().nome)
					});
				}
			}
			if (typeof ptAvviaDaReferto === "function") try {
				await ptAvviaDaReferto();
			} catch (err) {
				avvisi.push("Piano terapeutico non avviato: " + (err?.message || err));
			}
			v.dati = {
				...v.dati || {},
				_referto: {
					il: (/* @__PURE__ */ new Date()).toISOString(),
					a: inviati,
					documento_id: id,
					allegati: alleg.length
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
	// equo-app-src/src/ruoli/veterinario/moduli/10-dettatura.js
	var vdEsc = (s) => escapeHtml(s == null ? "" : String(s));
	var VD = { attesa: false };
	function vdSezioneHtml$1() {
		const v = VS.visita;
		if (!v) return "";
		const d = v.dati || {}, dis = "";
		return `<section class="vs-sez vd-sez" id="vd-box"><h3>Relazione per il referto</h3>
    <div class="vs-nota">La parte scritta del referto: cosa hai visto, cosa significa e cosa fare. Dettala: Galeno la sistema e tu la confermi.</div>
    <button type="button" class="vd-detta" onclick="vdDetta()"><span class="c"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0M12 17v5"/></svg></span><span><b>Detta</b><small>Galeno scrive relazione e terapia</small></span></button>
    <div class="vs-griglia">
      <div class="vs-campo pieno"><label for="vs-f-relazione">Relazione del veterinario</label><textarea id="vs-f-relazione" rows="4" placeholder="Si rileva…"${dis} oninput="vsCambia('relazione', this.value)">${vdEsc(d.relazione || "")}</textarea></div>
      <div class="vs-campo pieno"><label for="vs-f-indicazioni">Terapia e indicazioni</label><textarea id="vs-f-indicazioni" rows="3" placeholder="Farmaci, dosi, durata, cosa fare a casa, ricontrollo"${dis} oninput="vsCambia('indicazioni', this.value)">${vdEsc(d.indicazioni || "")}</textarea></div>
    </div></section>`;
	}
	function vdContesto() {
		const v = VS.visita || {};
		const righe = [`Visita: ${v.modello_nome || "Visita"} · cavallo ${vsNomeCavallo(VS.e) || "—"} · data ${v.data_visita || ""}`];
		try {
			vrSezioni().forEach((s) => s.r.forEach(([k, val]) => righe.push(`${s.n} · ${k}: ${val}`)));
		} catch (_) {}
		const d = v.dati || {};
		[
			"diagnosi",
			"conclusioni",
			"terapia",
			"cosa_fare"
		].forEach((k) => {
			if (d[k] && !righe.some((r) => r.endsWith(": " + d[k]))) righe.push(k + ": " + d[k]);
		});
		if (d.relazione) righe.push("Relazione già scritta: " + d.relazione);
		if (d.indicazioni) righe.push("Terapia e indicazioni già scritte: " + d.indicazioni);
		return righe.join("\n");
	}
	function vdDetta() {
		const v = VS.visita;
		if (!v) return;
		apriDettatura({
			tipo: "referto",
			agente: "Galeno",
			titolo: "Detta la relazione",
			sotto: (vsNomeCavallo(VS.e) || "Visita") + " · " + (v.modello_nome || ""),
			aiuto: "Racconta la visita come la spiegheresti al proprietario: cosa hai visto, cosa significa, cosa fare. I dati già nella scheda non serve ripeterli.",
			segnaposto: "Es. zoppia 2 su 5 all'anteriore sinistro, peggiora sul duro; pinza positiva in punta. Sospetto ascesso subsolare: apertura e impacco per tre giorni, riposo in box, ricontrollo tra una settimana.",
			contesto: vdContesto,
			proposte: (r) => {
				const d = VS.visita?.dati || {};
				return [
					{
						k: "relazione",
						titolo: "Relazione del veterinario",
						testo: r.relazione || "",
						modificabile: true,
						on: true,
						nota: d.relazione ? "Si aggiunge alla relazione che c'è già." : ""
					},
					{
						k: "indicazioni",
						titolo: "Terapia e indicazioni",
						testo: r.terapia || "",
						modificabile: true,
						on: true,
						nota: d.indicazioni ? "Si aggiunge a quella che c'è già." : ""
					},
					(r.piano || []).length && typeof ptAggiungiVoci === "function" ? {
						k: "piano",
						titolo: "Piano terapeutico · " + r.piano.length + (r.piano.length === 1 ? " voce" : " voci"),
						testo: r.piano.map((v) => "• " + v.nome + (v.dose ? " " + v.dose : "") + (v.via ? " · " + v.via.toLowerCase() : "") + (v.volte_giorno ? " · " + v.volte_giorno + (v.volte_giorno === 1 ? " volta" : " volte") + " al giorno" : " · orari da scegliere") + (v.giorni ? " · " + v.giorni + " giorni" : " · giorni da scegliere")).join("\n"),
						on: true,
						nota: "Si aggiungono al piano della visita: poi controlla orari, giorni e tempo di attesa."
					} : null
				].filter(Boolean);
			},
			conferma: async (scelte, r) => {
				const d = { ...VS.visita.dati || {} };
				scelte.filter((x) => x.k !== "piano").forEach((x) => {
					const t = String(x.testo).trim();
					d[x.k] = d[x.k] ? String(d[x.k]).trim() + "\n\n" + t : t;
				});
				VS.visita.dati = d;
				await vsSalvaSubito(true);
				if (scelte.some((x) => x.k === "piano")) await ptAggiungiVoci(r.piano || []);
				if (VS.schermo === "scheda") vsRidisegna();
				else if (VS.schermo === "referto" && typeof vrApri === "function") return vrApri();
				showToast("Inserito nella scheda: lo trovi nel referto");
				setTimeout(() => document.getElementById("vd-box")?.scrollIntoView({
					block: "start",
					behavior: "smooth"
				}), 60);
			},
			demo: (dettato) => ({
				relazione: dettato,
				terapia: "",
				piano: [],
				da_controllare: "In prova Galeno non risponde: il dettato è riportato così com'è."
			})
		});
	}
	async function vdVisiteRecenti() {
		const oggi = isoLocale(/* @__PURE__ */ new Date()), d = /* @__PURE__ */ new Date();
		d.setDate(d.getDate() - 7);
		const da = isoLocale(d);
		const buona = (e) => e && e.data_intervento >= da && e.data_intervento <= oggi && !["annullato", "rifiutato"].includes(e.stato) && (e.cavallo_cliente_id || e.horse_id);
		let l = [];
		if (DEMO_MODE) l = (demoState.interventiMascalcia || []).filter(buona);
		else {
			const { data, error } = await sb.from("interventi_mascalcia").select("*, clienti_mascalcia(nome), cavalli_clienti_mascalcia(nome)").eq("maniscalco_id", currentUser.id).gte("data_intervento", da).lte("data_intervento", oggi).not("stato", "in", "(annullato,rifiutato)").order("data_intervento", { ascending: false }).order("ora", { ascending: true }).limit(60);
			if (error) console.warn("visite recenti:", error.message);
			l = (data || []).filter(buona);
		}
		(hpAppuntamenti || []).filter(buona).forEach((e) => {
			if (!l.some((x) => x.id === e.id)) l.push(e);
		});
		return l.sort((a, b) => b.data_intervento.localeCompare(a.data_intervento) || String(a.ora || "99").localeCompare(String(b.ora || "99")));
	}
	async function vdDaHome$1() {
		const eventi = await vdVisiteRecenti();
		dtScegliDiOggi({
			titolo: "Detta",
			sotto: "Di quale visita?",
			eventi,
			vuoto: "Per dettare serve una visita: non ne hai oggi né negli ultimi 7 giorni. Crea l'appuntamento, poi apri la sua scheda e tocca «Detta».",
			azioneVuoto: {
				testo: "Nuovo appuntamento",
				az: "openInterventoModal(null)"
			},
			onScelta: ({ e }) => {
				if (e) vdApriDaEvento(e.id, e);
			}
		});
	}
	async function vdApriDaEvento(id, evento) {
		await vsApriDaEvento(id, evento);
		if (VS.schermo === "scheda") vdDetta();
		else if (VS.schermo === "scelta") {
			VD.attesa = true;
			showToast("Scegli il tipo di visita: poi si apre la dettatura");
		}
	}
	function vdDopoScheda$1() {
		if (!VD.attesa) return;
		VD.attesa = false;
		if (VS.visita) vdDetta();
	}
	function vdReset$1() {
		VD.attesa = false;
	}
	// equo-app-src/src/ruoli/veterinario/moduli/11-piano-terapia.js
	var ptEsc = (s) => escapeHtml(s == null ? "" : String(s));
	var PT$1 = {
		piano: null,
		caricato: false,
		voce: null,
		inCorso: null,
		promessa: null,
		giro: 0
	};
	var PT_TIPI = [
		["farmaco", "Farmaco"],
		["cura", "Cura"],
		["esercizio", "Esercizio"],
		["riposo", "Riposo"],
		["altro", "Altro"]
	];
	var PT_VIE = [
		"Bocca",
		"Intramuscolo",
		"Endovena",
		"Sottocute",
		"Locale",
		"Occhio",
		"Inalazione"
	];
	var PT_ORARI = {
		1: ["08:00"],
		2: ["08:00", "20:00"],
		3: [
			"08:00",
			"14:00",
			"20:00"
		],
		4: [
			"08:00",
			"12:00",
			"16:00",
			"20:00"
		]
	};
	var PT_STATO = {
		bozza: "Bozza: non ancora mandato",
		attivo: "In corso",
		sospeso: "Sospeso",
		concluso: "Concluso"
	};
	var ptData = (iso) => iso ? (/* @__PURE__ */ new Date(iso + "T12:00")).toLocaleDateString("it-IT", {
		day: "numeric",
		month: "long",
		year: "numeric"
	}) : "";
	var ptDataBreve = (iso) => iso ? (/* @__PURE__ */ new Date(iso + "T12:00")).toLocaleDateString("it-IT", {
		day: "numeric",
		month: "short"
	}) : "";
	function ptReset$1() {
		PT$1.piano = null;
		PT$1.caricato = false;
		PT$1.voce = null;
	}
	async function ptCarica$1() {
		const v = VS.visita;
		ptReset$1();
		const giro = PT$1.giroCarica = (PT$1.giroCarica || 0) + 1;
		const piano = v?.id ? await DB.pianoDiVisita(v.id) : null;
		if (giro !== PT$1.giroCarica) return;
		PT$1.piano = piano;
		PT$1.caricato = true;
		ptDisegna$1();
	}
	function ptVoci() {
		return PT$1.piano?.voci || [];
	}
	function ptAttesaFino(voci) {
		let fino = null;
		(voci || ptVoci()).forEach((v) => {
			if (v.tipo !== "farmaco" || !(v.attesa_giorni > 0)) return;
			const d = /* @__PURE__ */ new Date(fineVoceTerapia(v) + "T12:00");
			d.setDate(d.getDate() + Number(v.attesa_giorni));
			const iso = isoLocale(d);
			if (!fino || iso > fino) fino = iso;
		});
		return fino;
	}
	function ptPeriodo(voci) {
		const l = voci || ptVoci();
		if (!l.length) return null;
		return {
			dal: l.map((v) => v.inizio).sort()[0],
			al: l.map(fineVoceTerapia).sort().slice(-1)[0]
		};
	}
	function ptProprietario() {
		try {
			return (vrDestinatari() || []).find((x) => x.k === "prop" && x.suEquo) || null;
		} catch (_) {
			return null;
		}
	}
	async function ptAssicuraPiano() {
		if (PT$1.piano?.id) return PT$1.piano;
		await vsSalvaSubito(true);
		const v = VS.visita, e = VS.e;
		if (!v?.id) throw new Error("scheda non salvata");
		const cav = (typeof cavalliCartella === "function" ? cavalliCartella() : []).find((x) => x.id === (v.cavallo_cliente_id || e?.cavallo_cliente_id)) || {};
		const { data, error } = await DB.salvaPiano({
			visita_id: v.id,
			cliente_id: v.cliente_id || e?.cliente_mascalcia_id || null,
			cavallo_cliente_id: v.cavallo_cliente_id || e?.cavallo_cliente_id || null,
			horse_id: v.horse_id || e?.horse_id || cav.horse_id || null,
			cavallo_nome: vsNomeCavallo(e) || cav.nome || null,
			stato: "bozza",
			chiedi_conferme: false
		});
		if (error) throw new Error(DB._terSql(error) ? "Il piano terapeutico non è ancora attivo: manca l'aggiornamento del database (SQL 34)." : error.message);
		PT$1.piano = {
			...data,
			voci: []
		};
		return PT$1.piano;
	}
	async function ptAggiornaPiano(extra) {
		const p = PT$1.piano;
		if (!p?.id) return;
		const campi = {
			id: p.id,
			attesa_fino: ptAttesaFino(),
			...extra || {}
		};
		if (!p._confermeToccate && !("chiedi_conferme" in campi) && ptVoci().some((v) => (v.giorni || 1) > 7 && (v.orari || []).length)) campi.chiedi_conferme = true;
		const { data, error } = await DB.salvaPiano(campi);
		if (error) throw new Error(error.message);
		Object.assign(p, data || campi);
		if (p.stato === "attivo" || "stato" in (extra || {})) await DB.generaSomministrazioni(p.id);
		PT$1.inCorso = null;
	}
	function ptSezioneHtml$1() {
		return "<section class=\"vs-sez pt-sez\" id=\"pt-box\"><h3>Piano terapeutico</h3><div class=\"vs-nota\">Carico…</div></section>";
	}
	function ptRiga(v, i) {
		const ic = {
			farmaco: "💊",
			cura: "🩹",
			esercizio: "🐴",
			riposo: "🛏",
			altro: "•"
		}[v.tipo] || "•";
		const att = v.tipo === "farmaco" && v.attesa_giorni > 0 ? ` · attesa ${v.attesa_giorni} giorni` : "";
		return `<button type="button" class="pt-voce" onclick="ptModificaVoce(${i})"><span class="ic" aria-hidden="true">${ic}</span>
    <span class="c"><b>${ptEsc(v.nome)}${v.dose ? " · " + ptEsc(v.dose) : ""}${v.via ? " · " + ptEsc(v.via.toLowerCase()) : ""}</b>
    <small>${ptEsc(testoVoceTerapia(v))}${ptEsc(att)}</small>${v.note ? `<small>${ptEsc(v.note)}</small>` : ""}</span><span class="fr">›</span></button>`;
	}
	async function ptAndamento() {
		const p = PT$1.piano;
		if (!p?.id || p.stato === "bozza") return "";
		const x = ((await ptCaricaInCorso$1()).piani || []).find((t) => t.id === p.id);
		if (!x) return "";
		const ora = Date.now(), passate = x.somm.filter((s) => new Date(s.previsto_il).getTime() <= ora);
		const fatte = passate.filter((s) => s.fatto_il).length, saltate = passate.filter((s) => statoSomministrazione(s, ora) === "saltata").length;
		const prossima = x.somm.find((s) => !s.fatto_il && new Date(s.previsto_il).getTime() > ora);
		return [
			p.chiedi_conferme ? `${fatte} ${fatte === 1 ? "fatta" : "fatte"}` : "",
			p.chiedi_conferme && saltate ? `<b class="pt-saltate">${saltate} ${saltate === 1 ? "saltata" : "saltate"}</b>` : "",
			prossima ? "prossima " + new Date(prossima.previsto_il).toLocaleString("it-IT", {
				weekday: "short",
				hour: "2-digit",
				minute: "2-digit"
			}) : ""
		].filter(Boolean).join(" · ");
	}
	async function ptDisegna$1() {
		const box = document.getElementById("pt-box");
		if (!box || VS.schermo !== "scheda") return;
		if (!PT$1.caricato) {
			box.innerHTML = "<h3>Piano terapeutico</h3><div class=\"vs-nota\">Carico…</div>";
			return;
		}
		const p = PT$1.piano, voci = ptVoci(), per = ptPeriodo(voci), att = ptAttesaFino(voci), prop = ptProprietario();
		const stato = p?.stato || "bozza", chiuso = stato === "concluso";
		const giro = ++PT$1.giro;
		const andamento = await ptAndamento();
		if (giro !== PT$1.giro || VS.schermo !== "scheda" || !document.getElementById("pt-box")) return;
		const azioni = !voci.length ? "" : stato === "bozza" ? `<button type="button" class="vs-btn pri" onclick="ptAvvia()">${prop ? "Avvia e manda a " + ptEsc(prop.nome) : "Avvia il piano"}</button>` : stato === "attivo" ? `<div class="pt-azioni"><button type="button" class="vs-btn" onclick="ptCambiaStato('sospeso')">Sospendi</button><button type="button" class="vs-btn" onclick="ptCambiaStato('concluso')">Chiudi il piano</button></div>` : stato === "sospeso" ? `<div class="pt-azioni"><button type="button" class="vs-btn pri" onclick="ptCambiaStato('attivo')">Riprendi</button><button type="button" class="vs-btn" onclick="ptCambiaStato('concluso')">Chiudi il piano</button></div>` : "";
		box.innerHTML = `<h3>Piano terapeutico${p ? ` <span class="pt-stato ${stato}">${ptEsc(PT_STATO[stato])}</span>` : ""}</h3>
    ${per ? `<div class="pt-periodo">Dal ${ptEsc(ptDataBreve(per.dal))} al ${ptEsc(ptDataBreve(per.al))}${andamento ? " · " + andamento : ""}</div>` : ""}
    ${att ? `<div class="pt-attesa">Cavallo DPA · fine del tempo di attesa: <b>${ptEsc(ptData(att))}</b></div>` : ""}
    ${voci.map(ptRiga).join("")}
    ${chiuso ? "" : `<div class="pt-aggiungi"><button type="button" class="vs-chip" onclick="ptNuovaVoce('farmaco')">+ Farmaco</button><button type="button" class="vs-chip" onclick="ptNuovaVoce('cura')">+ Cura o esercizio</button></div>`}
    ${voci.length && !chiuso ? `<label class="pt-conferme"><input type="checkbox" ${p?.chiedi_conferme ? "checked" : ""} onchange="ptConferme(this.checked)">
      <span><b>Chiedi al proprietario di confermare</b><small>Tocca «Fatto» a ogni somministrazione; dopo 12 ore senza conferma è «saltata».</small></span></label>` : ""}
    ${voci.length && !prop && !chiuso ? "<div class=\"vs-nota\">Il proprietario non usa Equo: il piano va nel referto (PDF o «Condividi»), senza promemoria.</div>" : ""}
    ${!voci.length ? "<div class=\"vs-nota\">Aggiungi i farmaci con dose, orari e giorni, oppure cure ed esercizi. La dose la scrivi tu: Equo non la calcola.</div>" : ""}
    ${azioni}`;
	}
	function ptNuovaVoce(tipo) {
		const oggi = isoLocale(/* @__PURE__ */ new Date());
		PT$1.voce = {
			tipo,
			nome: "",
			dose: "",
			via: tipo === "farmaco" ? "" : null,
			orari: tipo === "farmaco" ? PT_ORARI[1].slice() : [],
			ogni_giorni: 1,
			giorni: tipo === "farmaco" ? 5 : 7,
			inizio: oggi,
			attesa_giorni: null,
			note: ""
		};
		ptMostraVoce();
	}
	function ptModificaVoce(i) {
		const v = ptVoci()[i];
		if (!v || PT$1.piano?.stato === "concluso") return;
		PT$1.voce = JSON.parse(JSON.stringify(v));
		ptMostraVoce();
	}
	function ptMostraVoce() {
		VS.schermo = "piano-voce";
		const v = PT$1.voce, f = v.tipo === "farmaco", n = (v.orari || []).length;
		vsTesta(v.id ? "Modifica la voce" : f ? "Nuovo farmaco" : "Nuova cura o esercizio", vsNomeCavallo(VS.e) || "Piano terapeutico");
		const chip = (on, az, t) => `<button type="button" class="vs-chip${on ? " on" : ""}" aria-pressed="${!!on}" onclick="${az}">${ptEsc(t)}</button>`;
		document.getElementById("vs-corpo").innerHTML = `
    <div class="vs-campo pieno"><span class="vs-lab">Tipo</span><div class="vs-chips">${PT_TIPI.map(([k, t]) => chip(v.tipo === k, `ptCampo('tipo','${k}')`, t)).join("")}</div></div>
    <div class="vs-campo pieno"><label for="pt-nome">${f ? "Farmaco (nome commerciale o principio attivo)" : "Cosa fare"}</label><input id="pt-nome" maxlength="120" value="${ptEsc(v.nome)}" placeholder="${f ? "es. fenilbutazone" : "es. impacco al piede, passeggio a mano 10 minuti"}" oninput="PT.voce.nome=this.value"></div>
    ${f ? `<div class="vs-campo pieno"><label for="pt-dose">Dose</label><input id="pt-dose" maxlength="120" value="${ptEsc(v.dose || "")}" placeholder="come la scrivi in ricetta, es. 1 bustina" oninput="PT.voce.dose=this.value"></div>
    <div class="vs-campo pieno"><span class="vs-lab">Via</span><div class="vs-chips">${PT_VIE.map((t) => chip(v.via === t, `ptCampo('via',${ptEsc(JSON.stringify(t))})`, t)).join("")}</div></div>` : ""}
    <div class="vs-campo pieno"><span class="vs-lab">Quante volte</span><div class="vs-chips">${[
			1,
			2,
			3,
			4
		].map((k) => chip(n === k, `ptVolte(${k})`, k === 1 ? "1 volta" : k + " volte")).join("")}${chip(n === 0, "ptVolte(0)", f ? "Al bisogno" : "Senza orario")}</div></div>
    ${n ? `<div class="vs-campo pieno"><span class="vs-lab">Orari</span><div class="pt-orari">${v.orari.map((o, i) => `<input type="time" value="${ptEsc(o)}" aria-label="Orario ${i + 1}" onchange="ptOrario(${i}, this.value)">`).join("")}</div></div>
    <div class="vs-campo pieno"><span class="vs-lab">Ogni quanto</span><div class="vs-chips">${[
			[1, "Ogni giorno"],
			[2, "A giorni alterni"],
			[7, "Una volta a settimana"]
		].map(([k, t]) => chip(v.ogni_giorni === k, `ptCampo('ogni_giorni',${k})`, t)).join("")}</div></div>` : ""}
    <div class="vs-campo"><label for="pt-giorni">Per quanti giorni</label><input id="pt-giorni" type="number" inputmode="numeric" min="1" max="365" value="${ptEsc(v.giorni)}" oninput="PT.voce.giorni=Math.max(1,Math.min(365,parseInt(this.value,10)||1))"></div>
    <div class="vs-campo"><label for="pt-inizio">Dal</label><input id="pt-inizio" type="date" value="${ptEsc(v.inizio)}" onchange="PT.voce.inizio=this.value||PT.voce.inizio"></div>
    <div class="vs-campo pieno"><div class="vs-chips">${[
			3,
			5,
			7,
			10,
			14,
			30
		].map((g) => chip(v.giorni === g, `ptCampo('giorni',${g})`, g + " giorni")).join("")}</div></div>
    ${f ? `<div class="vs-campo pieno"><label for="pt-attesa">Tempo di attesa per cavallo DPA (giorni)</label><input id="pt-attesa" type="number" inputmode="numeric" min="0" max="400" value="${ptEsc(v.attesa_giorni ?? "")}" placeholder="vuoto se non DPA" oninput="PT.voce.attesa_giorni=this.value===''?null:Math.max(0,Math.min(400,parseInt(this.value,10)||0))"></div>` : ""}
    <div class="vs-campo pieno"><label for="pt-note">Note per il proprietario</label><input id="pt-note" maxlength="300" value="${ptEsc(v.note || "")}" placeholder="es. dopo il pasto" oninput="PT.voce.note=this.value"></div>
    <div class="vs-nota">La dose la scrivi tu e la controlli sull'RCP del prodotto: Equo non calcola dosi.</div>`;
		document.getElementById("vs-piede").innerHTML = (v.id ? "<button class=\"vs-btn\" onclick=\"ptEliminaVoce()\">Elimina</button>" : "<button class=\"vs-btn\" onclick=\"ptTornaScheda()\">Annulla</button>") + "<button class=\"vs-btn pri\" onclick=\"ptSalvaVoce()\">Salva</button>";
	}
	function ptLeggiCampi() {
		const v = PT$1.voce;
		if (!v) return;
		const val = (id) => document.getElementById(id)?.value;
		if (val("pt-nome") != null) v.nome = val("pt-nome");
		if (val("pt-dose") != null) v.dose = val("pt-dose");
		if (val("pt-note") != null) v.note = val("pt-note");
	}
	function ptCampo(k, val) {
		ptLeggiCampi();
		const v = PT$1.voce;
		if (k === "tipo") {
			v.tipo = val;
			if (val !== "farmaco") {
				v.via = null;
				v.dose = "";
				v.attesa_giorni = null;
			}
		} else v[k] = k === "via" && v.via === val ? null : val;
		const s = document.getElementById("vs-corpo").scrollTop;
		ptMostraVoce();
		document.getElementById("vs-corpo").scrollTop = s;
	}
	function ptVolte(n) {
		ptLeggiCampi();
		PT$1.voce.orari = n ? (PT_ORARI[n] || []).slice() : [];
		const s = document.getElementById("vs-corpo").scrollTop;
		ptMostraVoce();
		document.getElementById("vs-corpo").scrollTop = s;
	}
	function ptOrario(i, val) {
		if (/^\d\d:\d\d$/.test(val)) PT$1.voce.orari[i] = val;
	}
	function ptTornaScheda() {
		PT$1.voce = null;
		vsMostraScheda();
	}
	async function ptSalvaVoce() {
		ptLeggiCampi();
		const v = PT$1.voce;
		v.nome = String(v.nome || "").trim();
		v.dose = String(v.dose || "").trim() || null;
		v.note = String(v.note || "").trim() || null;
		if (!v.nome) return showToast(v.tipo === "farmaco" ? "Scrivi il nome del farmaco" : "Scrivi cosa fare");
		v.orari = [...new Set((v.orari || []).filter((o) => /^\d\d:\d\d$/.test(o)))].sort();
		try {
			const p = await ptAssicuraPiano();
			const { voci, ...riga } = {
				...v,
				piano_id: p.id,
				ordine: v.id ? v.ordine : ptVoci().length
			};
			const { data, error } = await DB.salvaVoceTerapia(riga);
			if (error) throw new Error(error.message);
			const i = p.voci.findIndex((x) => x.id === data.id);
			if (i >= 0) p.voci[i] = data;
			else p.voci.push(data);
			await ptAggiornaPiano();
			if (p.stato === "attivo") await ptAvvisaProprietario("aggiornato");
			PT$1.voce = null;
			vsMostraScheda();
			showToast(p.stato === "attivo" ? "Piano aggiornato" : "Aggiunto al piano");
		} catch (err) {
			showToast(err.message || "Non salvato");
		}
	}
	async function ptEliminaVoce() {
		const v = PT$1.voce;
		if (!v?.id) return ptTornaScheda();
		if (typeof chiediSiNo === "function" && !await chiediSiNo("Togli dal piano?", v.nome)) return;
		const { error } = await DB.eliminaVoceTerapia(v.id);
		if (error) return showToast("Non eliminato: " + error.message);
		PT$1.piano.voci = ptVoci().filter((x) => x.id !== v.id);
		try {
			await ptAggiornaPiano();
			if (PT$1.piano.stato === "attivo") await ptAvvisaProprietario("aggiornato");
		} catch (err) {
			showToast(err.message);
		}
		ptTornaScheda();
	}
	async function ptConferme(on) {
		if (!PT$1.piano) return;
		PT$1.piano._confermeToccate = true;
		try {
			await ptAggiornaPiano({ chiedi_conferme: !!on });
		} catch (err) {
			showToast(err.message);
		}
	}
	function ptRiassunto() {
		const voci = ptVoci(), per = ptPeriodo(voci), att = ptAttesaFino(voci);
		return voci.map((v) => "• " + v.nome + (v.dose ? " " + v.dose : "") + (v.via ? " (" + v.via.toLowerCase() + ")" : "") + ": " + testoVoceTerapia(v)).join("\n") + (per ? `\nDal ${ptDataBreve(per.dal)} al ${ptDataBreve(per.al)}.` : "") + (att ? `\nCavallo DPA: tempo di attesa fino al ${ptData(att)}.` : "");
	}
	async function ptAvvisaProprietario(cosa) {
		const prop = ptProprietario();
		if (!prop) return false;
		const cav = PT$1.piano?.cavallo_nome || vsNomeCavallo(VS.e) || "il cavallo";
		const testo = cosa === "avviato" ? `💊 Piano terapeutico di ${cav}\n${ptRiassunto()}\n\nLo trovi in Equo nella Home e nella scheda del cavallo, con i promemoria all'ora giusta.${PT$1.piano.chiedi_conferme ? " Quando dai la terapia tocca «Fatto»." : ""}` : cosa === "aggiornato" ? `💊 Ho aggiornato il piano terapeutico di ${cav}:\n${ptRiassunto()}` : cosa === "sospeso" ? `💊 Il piano terapeutico di ${cav} è sospeso: per ora non dare la terapia. Ti avviso quando riprendere.` : cosa === "attivo" ? `💊 Il piano terapeutico di ${cav} riprende da oggi:\n${ptRiassunto()}` : `💊 Il piano terapeutico di ${cav} è concluso.`;
		const { error } = await DB.insertMessaggioMascalcia({
			cliente_mascalcia_id: prop.cliente.id,
			tipo: "testo",
			testo
		});
		if (error) {
			console.warn("piano, messaggio:", error.message);
			return false;
		}
		return true;
	}
	async function ptAvvia(conMessaggio = true) {
		const p = PT$1.piano;
		if (!p?.id || !ptVoci().length) return false;
		try {
			await ptAggiornaPiano({
				stato: "attivo",
				inviato_il: p.inviato_il || (/* @__PURE__ */ new Date()).toISOString()
			});
			const msg = conMessaggio ? await ptAvvisaProprietario("avviato") : false;
			if (conMessaggio) showToast(msg ? "Piano avviato e mandato in chat" : "Piano avviato");
			if (VS.schermo === "scheda") ptDisegna$1();
			return true;
		} catch (err) {
			showToast(err.message || "Non avviato");
			return false;
		}
	}
	async function ptAvviaDaReferto$1() {
		if (PT$1.piano?.stato === "bozza" && ptVoci().length) return ptAvvia(false);
		return false;
	}
	async function ptCambiaStato(stato) {
		if (!PT$1.piano?.id) return;
		if (stato === "concluso" && typeof chiediSiNo === "function" && !await chiediSiNo("Chiudi il piano?", "Le somministrazioni future non arrivano più al proprietario.")) return;
		try {
			await ptAggiornaPiano({ stato });
			await ptAvvisaProprietario(stato);
			showToast(stato === "sospeso" ? "Piano sospeso" : stato === "attivo" ? "Piano ripreso" : "Piano chiuso");
		} catch (err) {
			showToast(err.message || "Non riuscito");
		}
		vsMostraScheda();
	}
	function ptRigheReferto$1() {
		return ptVoci().map((v) => [v.nome + (v.dose ? " · " + v.dose : "") + (v.via ? " · " + v.via.toLowerCase() : ""), testoVoceTerapia(v) + (v.note ? " · " + v.note : "")]);
	}
	function ptAttesaReferto$1() {
		const a = ptAttesaFino();
		return a ? "Cavallo DPA: tempo di attesa fino al " + ptData(a) : "";
	}
	async function ptAggiungiVoci$1(lista) {
		const oggi = isoLocale(/* @__PURE__ */ new Date());
		const p = await ptAssicuraPiano();
		for (const x of lista || []) {
			const n = Math.max(0, Math.min(4, parseInt(x.volte_giorno, 10) || 0));
			const riga = {
				piano_id: p.id,
				ordine: p.voci.length,
				tipo: PT_TIPI.some((t) => t[0] === x.tipo) ? x.tipo : "farmaco",
				nome: String(x.nome || "").trim().slice(0, 120),
				dose: x.dose ? String(x.dose).slice(0, 120) : null,
				via: PT_VIE.find((t) => t.toLowerCase() === String(x.via || "").toLowerCase()) || (x.via ? String(x.via).slice(0, 40) : null),
				orari: n ? PT_ORARI[n].slice() : [],
				ogni_giorni: 1,
				giorni: Math.max(1, Math.min(365, parseInt(x.giorni, 10) || 1)),
				inizio: oggi,
				attesa_giorni: null,
				note: x.note ? String(x.note).slice(0, 300) : null
			};
			if (!riga.nome) continue;
			const { data, error } = await DB.salvaVoceTerapia(riga);
			if (error) throw new Error(error.message);
			p.voci.push(data);
		}
		await ptAggiornaPiano();
		if (p.stato === "attivo") await ptAvvisaProprietario("aggiornato");
	}
	function ptCaricaInCorso$1(forza) {
		if (PT$1.promessa) return PT$1.promessa;
		if (PT$1.inCorso && !forza && Date.now() - PT$1.inCorso.il < 6e4) return Promise.resolve(PT$1.inCorso);
		PT$1.promessa = DB.terapieInCorso({ comePro: true }).catch(() => []).then((piani) => {
			PT$1.inCorso = {
				il: Date.now(),
				piani
			};
			PT$1.promessa = null;
			return PT$1.inCorso;
		});
		return PT$1.promessa;
	}
	function ptConteggi$1() {
		const l = PT$1.inCorso?.piani || [], ora = Date.now();
		return {
			n: l.filter((p) => p.stato === "attivo").length,
			saltate: l.reduce((t, p) => t + (p.chiedi_conferme ? p.somm.filter((s) => statoSomministrazione(s, ora) === "saltata").length : 0), 0)
		};
	}
	function ptClientiInTerapia$1() {
		const ids = /* @__PURE__ */ new Set(), cav = typeof cavalliCartella === "function" ? cavalliCartella() : [];
		(PT$1.inCorso?.piani || []).forEach((p) => {
			if (p.cliente_id) ids.add(p.cliente_id);
			const c = cav.find((x) => x.id === p.cavallo_cliente_id);
			if (c) ids.add(c.cliente_mascalcia_id);
		});
		return ids;
	}
	async function ptElenco() {
		vsFoglio().classList.add("aperto");
		document.body.classList.add("vs-aperto");
		VS.schermo = "terapie";
		vsTesta("Terapie in corso", "I tuoi piani attivi e sospesi");
		document.getElementById("vs-corpo").innerHTML = "<div class=\"vs-vuoto\">Carico…</div>";
		document.getElementById("vs-piede").innerHTML = "<button class=\"vs-btn\" onclick=\"vsChiudi()\">Chiudi</button>";
		const { piani } = await ptCaricaInCorso$1(true), ora = Date.now();
		document.getElementById("vs-corpo").innerHTML = piani.length ? piani.map((p) => {
			const per = ptPeriodo(p.voci), sal = p.chiedi_conferme ? p.somm.filter((s) => statoSomministrazione(s, ora) === "saltata").length : 0;
			const fatte = p.somm.filter((s) => s.fatto_il).length, ev = p.visite_pro?.intervento_id || (DEMO_MODE ? ptDemoIntervento(p.visita_id) : null);
			return `<button type="button" class="pt-voce" ${ev ? `onclick="ptApriVisita('${ev}')"` : "disabled"}><span class="ic" aria-hidden="true">💊</span><span class="c">
      <b>${ptEsc(p.cavallo_nome || "Cavallo")}${p.stato === "sospeso" ? " · sospeso" : ""}</b><small>${ptEsc(p.voci.map((v) => v.nome).join(", "))}</small>
      <small>${per ? "fino al " + ptEsc(ptDataBreve(per.al)) : ""}${p.chiedi_conferme ? ` · ${fatte} fatte` : ""}${sal ? ` · <b class="pt-saltate">${sal} ${sal === 1 ? "saltata" : "saltate"}</b>` : ""}</small></span><span class="fr">›</span></button>`;
		}).join("") : "<div class=\"vs-nota\">Nessuna terapia in corso. Il piano si scrive nella scheda della visita.</div>";
	}
	function ptDemoIntervento(visitaId) {
		try {
			return (demoState.visitePro?.visite || []).find((v) => v.id === visitaId)?.intervento_id || null;
		} catch (_) {
			return null;
		}
	}
	function ptApriVisita(id) {
		vsApriDaEvento(id);
	}
	// equo-app-src/src/ruoli/veterinario/moduli/12-scheda-cavallo.js
	var vcEsc = (s) => escapeHtml(s == null ? "" : String(s));
	var vcJs = (s) => vcEsc(JSON.stringify(s));
	var VC = {
		cv: null,
		visite: [],
		piani: [],
		docs: [],
		attesa: null,
		carico: false,
		giro: 0
	};
	var VC_GRUPPI = [
		["referto", "Referti"],
		["lastra", "Lastre"],
		["ecografia", "Ecografie"],
		["esame", "Esami"],
		["foto_clinica", "Foto"],
		["video", "Video"],
		["coggins", "Coggins"],
		["vaccino", "Vaccini"],
		["passaporto", "Passaporto"],
		["documento_sanitario", "Documenti sanitari"],
		["documento", "Altri documenti"],
		["seduta", "Sedute"]
	];
	var vcData = (iso) => iso ? (/* @__PURE__ */ new Date(String(iso).slice(0, 10) + "T12:00")).toLocaleDateString("it-IT", {
		day: "numeric",
		month: "short",
		year: "numeric"
	}) : "";
	function vcSezioniHtml(cv, vedi) {
		const sez = (k, id, titolo, azione) => vedi(k) ? `<div class="card cavpro-sez" id="${id}"><div class="cavpro-sez-testa"><span>${titolo}</span>${azione || ""}</div><div class="vc-corpo"><div class="muted" style="font-size:13px">Caricamento…</div></div></div>` : "";
		return {
			clinica: sez("cli", "vc-clinica", "Clinica"),
			documenti: sez("doc", "vc-documenti", "Documenti", `<button class="btn btn-outline btn-sm" onclick="vcScegli()">+ Carica</button>`) + (vedi("doc") ? `<div class="card cavpro-sez"><div class="cavpro-sez-testa"><span>Allegati condivisi</span></div><div id="vc-condivisi"><div class="muted" style="font-size:13px">Caricamento…</div></div>
        <div class="muted" style="font-size:11.5px;line-height:1.5;margin-top:8px">Gli allegati di prima: li vedono anche il proprietario collegato e la scuderia. I tuoi file nuovi vanno in «Documenti», nello spazio privato.</div></div>` : "")
		};
	}
	async function vcCarica(cv) {
		if (!cv) return;
		VC.cv = cv;
		const giro = ++VC.giro;
		const [visite, piani, docs] = await Promise.all([
			VsDB.visiteCavallo(cv.id || null, cv.horse_id || null),
			DB.terapieInCorso({ comePro: true }).catch(() => []),
			DB.listaDocumenti({
				cavallo_cliente_id: cv.id || null,
				horse_id: cv.horse_id || null
			})
		]);
		if (giro !== VC.giro) return;
		VC.visite = visite || [];
		VC.docs = docs || [];
		VC.piani = (piani || []).filter((p) => cv.id && p.cavallo_cliente_id === cv.id || cv.horse_id && p.horse_id === cv.horse_id);
		vcDisegna();
		if (document.getElementById("vc-condivisi") && typeof caricaAllegatiCavallo === "function") caricaAllegatiCavallo("vc-condivisi", "maniscalco", cv);
	}
	function vcDisegna() {
		vcDisegnaClinica();
		vcDisegnaDocumenti();
	}
	function vcDisegnaClinica() {
		const box = document.querySelector("#vc-clinica .vc-corpo");
		if (!box) return;
		const ora = Date.now();
		const terapie = VC.piani.map((p) => {
			const per = ptPeriodo(p.voci), fatte = p.somm.filter((s) => s.fatto_il).length, sal = p.chiedi_conferme ? p.somm.filter((s) => statoSomministrazione(s, ora) === "saltata").length : 0;
			return `<div class="vc-ter"><div class="vc-ter-t">💊 Terapia in corso${p.stato === "sospeso" ? " · sospesa" : ""}${per ? " · fino al " + vcEsc(vcData(per.al)) : ""}</div>
      ${p.voci.map((v) => `<div class="vc-ter-v"><b>${vcEsc(v.nome)}${v.dose ? " · " + vcEsc(v.dose) : ""}</b><small>${vcEsc(testoVoceTerapia(v))}</small></div>`).join("")}
      ${p.attesa_fino ? `<div class="vc-attesa">Fine del tempo di attesa: <b>${vcEsc(vcData(p.attesa_fino))}</b></div>` : ""}
      ${p.chiedi_conferme ? `<div class="muted" style="font-size:12px">${fatte} ${fatte === 1 ? "fatta" : "fatte"}${sal ? ` · <b class="pt-saltate">${sal} ${sal === 1 ? "saltata" : "saltate"}</b>` : ""}</div>` : ""}</div>`;
		}).join("");
		const conDpa = VC.visite.find((v) => v.dati && v.dati.dpa);
		const dpa = conDpa ? `<div class="vc-dpa"><span>Stato</span><b>${vcEsc(conDpa.dati.dpa)}</b><small>dalla visita del ${vcEsc(vcData(conDpa.data_visita))}</small></div>` : "";
		const visite = VC.visite.length ? VC.visite.slice(0, 12).map((v) => {
			const d = v.dati || {}, cosa = d.diagnosi || d.conclusioni || d.sindrome || d.motivo || "";
			return `<button type="button" class="vc-visita" ${v.intervento_id ? `onclick="vcApriVisita('${v.intervento_id}')"` : "disabled"}><span class="d">${vcEsc(vcData(v.data_visita))}</span>
        <span class="c"><b>${vcEsc(v.modello_nome || "Visita")}${v.stato === "bozza" ? " · bozza" : ""}</b>${cosa ? `<small>${vcEsc(String(cosa).slice(0, 120))}</small>` : ""}</span>${v.intervento_id ? "<span class=\"fr\">›</span>" : ""}</button>`;
		}).join("") : "<div class=\"muted\" style=\"font-size:13px\">Nessuna visita registrata per questo cavallo.</div>";
		box.innerHTML = terapie + dpa + `<div class="vc-h">Visite precedenti</div>` + visite;
	}
	function vcApriVisita(id) {
		vsApriDaEvento(id);
	}
	function vcDisegnaDocumenti() {
		const box = document.querySelector("#vc-documenti .vc-corpo");
		if (!box) return;
		const a = VC.attesa;
		const chip = (on, az, t) => `<button type="button" class="vs-chip${on ? " on" : ""}" aria-pressed="${!!on}" onclick="${az}">${vcEsc(t)}</button>`;
		const attesa = a ? `<div class="va-attesa vc-attesa-box" id="vc-attesa"><b>${a.mime.startsWith("image/") ? "Foto" : a.mime.startsWith("video/") ? "Video" : "File"} da salvare</b>
      <span class="vs-lab">Tipo</span><div class="vs-chips">${["referto", ...VA_TIPI].map((t) => chip(a.categoria === t, `vcImposta('categoria', ${vcJs(t)})`, DB.DOC_TIPI[t] || t)).join("")}</div>
      <span class="vs-lab">Zona (facoltativa)</span><div class="vs-chips">${VA_ZONE.map((z) => chip(a.zona === z, `vcImposta('zona', ${vcJs(z)})`, DB.DOC_ZONE[z])).join("")}</div>
      <div class="vs-campo pieno"><label for="vc-nota">Nota (facoltativa)</label><input id="vc-nota" maxlength="120" value="${vcEsc(a.nota)}" placeholder="es. esame del sangue del laboratorio" oninput="VC.attesa.nota=this.value;vcNomeLive()"></div>
      <div class="va-anteprima-nome">Nome: <b id="vc-nome">${vcEsc(vcTitolo())}</b></div>
      <div class="va-bott"><button class="vs-btn" onclick="vcAnnulla()">Annulla</button><button class="vs-btn pri" onclick="vcSalva()"${VC.carico ? " disabled" : ""}>${VC.carico ? "Salvo…" : "Salva"}</button></div></div>` : "";
		const gruppi = VC_GRUPPI.map(([k, t]) => [t, VC.docs.filter((d) => d.categoria === k)]).filter(([, l]) => l.length);
		box.innerHTML = attesa + (gruppi.length ? gruppi.map(([t, l]) => `<div class="vc-h">${vcEsc(t)} · ${l.length}</div>${l.map((d) => `<button type="button" class="vc-doc" onclick="apriDocumentoPrivato('${d.id}')">
      <span class="et">${/^image\//.test(d.mime || "") ? "FOTO" : /^video\//.test(d.mime || "") ? "VIDEO" : d.mime === "application/dicom" ? "DICOM" : "PDF"}</span>
      <span class="c"><b>${vcEsc(d.titolo)}</b><small>${vcEsc(d.autore_user_id === currentUser?.id ? "tuo" : d.autore_ruolo || "condiviso con te")}</small></span></button>`).join("")}`).join("") : a ? "" : "<div class=\"muted\" style=\"font-size:13px\">Nessun documento privato per questo cavallo. Referti, lastre e foto delle visite arrivano qui da soli.</div>") + "<div class=\"muted\" style=\"font-size:11.5px;line-height:1.5;margin-top:8px\">Privati: li vedete tu e il proprietario. Si aprono con un link che dura pochi minuti.</div>";
	}
	function vcTitolo() {
		const a = VC.attesa;
		return a ? DB.titoloDocumento({
			cavallo: VC.cv?.nome,
			data: isoLocale(/* @__PURE__ */ new Date()),
			categoria: a.categoria,
			zona: a.zona,
			nota: a.nota
		}) : "";
	}
	function vcNomeLive() {
		const el = document.getElementById("vc-nome");
		if (el) el.textContent = vcTitolo();
	}
	function vcScegli() {
		let i = document.getElementById("vc-in-file");
		if (!i) {
			i = document.createElement("input");
			i.type = "file";
			i.id = "vc-in-file";
			i.hidden = true;
			i.accept = "image/*,video/*,application/pdf,application/dicom,.dcm";
			i.addEventListener("change", (ev) => {
				const f = ev.target.files && ev.target.files[0];
				ev.target.value = "";
				if (f) vcFile(f);
			});
			document.body.appendChild(i);
		}
		i.click();
	}
	async function vcFile(file) {
		const video = /^video\//.test(file.type) || /\.(mp4|mov|m4v|webm|3gp)$/i.test(file.name || "");
		const pdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name || "");
		const dicom = file.type === "application/dicom" || /\.dcm$/i.test(file.name || "");
		const img = /^image\//.test(file.type) || /\.(jpe?g|png|heic|heif|webp)$/i.test(file.name || "");
		if (!video && !pdf && !dicom && !img) return showToast("Puoi caricare foto, video, PDF o lastre (DICOM)");
		if (file.size > 52428800) return showToast("File troppo pesante (massimo 50 MB)");
		if (video && await vaDurata(file) > 185) return showToast("Video troppo lungo: massimo 3 minuti");
		VC.attesa = {
			file,
			mime: file.type || (dicom ? "application/dicom" : pdf ? "application/pdf" : video ? "video/mp4" : "image/jpeg"),
			categoria: video ? "video" : dicom ? "lastra" : pdf ? "referto" : "foto_clinica",
			zona: null,
			nota: ""
		};
		vcDisegnaDocumenti();
		document.getElementById("vc-attesa")?.scrollIntoView({
			block: "center",
			behavior: "smooth"
		});
	}
	function vcImposta(k, v) {
		const a = VC.attesa;
		if (!a) return;
		a.nota = document.getElementById("vc-nota")?.value ?? a.nota;
		a[k] = k === "zona" && a.zona === v ? null : v;
		vcDisegnaDocumenti();
	}
	function vcAnnulla() {
		VC.attesa = null;
		vcDisegnaDocumenti();
	}
	async function vcSalva() {
		const a = VC.attesa, cv = VC.cv;
		if (!a || !cv || VC.carico) return;
		VC.carico = true;
		vcDisegnaDocumenti();
		try {
			const { blob, mime } = /^image\/(jpe?g|png|webp|heic|heif)$/i.test(a.mime) ? await vaRiduci(a.file) : {
				blob: a.file,
				mime: a.mime
			};
			const r = await DB.caricaDocumentoPrivato({
				blob,
				mime,
				categoria: a.categoria,
				zona: a.zona,
				nota: a.nota,
				cavallo_nome: cv.nome,
				data_documento: isoLocale(/* @__PURE__ */ new Date()),
				cavallo_cliente_id: cv.id || null,
				horse_id: cv.horse_id || null,
				autore_ruolo: "veterinario"
			});
			if (!r.id) {
				showToast(/documenti|bucket|does not exist/i.test(r.error?.message || "") ? "Lo spazio privato dei documenti non è ancora attivo." : "Caricamento non riuscito: " + (r.error?.message || "riprova"));
				return;
			}
			VC.attesa = null;
			showToast("Salvato: " + (r.titolo || "documento"));
			VC.docs = await DB.listaDocumenti({
				cavallo_cliente_id: cv.id || null,
				horse_id: cv.horse_id || null
			});
		} finally {
			VC.carico = false;
			vcDisegnaDocumenti();
		}
	}
	// equo-app-src/src/ruoli/veterinario/moduli/13a-mappe-disegni.js
	var MP_DISEGNI = {
		sx: {
			w: 1448,
			h: 1086,
			d: "M481.1,1018.3C491.8,1017.5 496.4,1016.9 497.9,1016.1C501.8,1013.9 506.9,1001.5 507.0,994.0C507.0,990.5 506.1,987.5 503.2,981.6C502.0,979.0 500.8,976.3 500.7,975.5C500.4,974.2 501.2,970.6 502.5,967.8C502.7,967.2 503.3,965.9 503.8,964.8C506.4,958.7 510.1,951.8 512.2,949.6C512.8,948.9 514.8,947.4 516.6,946.1C525.5,940.2 528.6,932.3 527.0,919.5C524.5,899.4 523.9,887.2 523.9,852.5C523.9,822.3 524.2,814.2 525.6,809.5C526.1,807.9 526.6,806.7 529.1,801.1C529.6,800.0 530.0,798.8 530.0,798.5C530.0,798.2 530.2,797.6 530.5,797.1C531.2,795.8 533.4,788.3 534.3,784.1C534.9,781.0 535.0,778.7 534.7,772.5C534.2,759.9 534.2,754.0 534.9,749.2C535.3,746.8 535.8,743.6 536.0,742.1C536.3,739.4 536.8,738.4 537.2,739.6C537.3,739.9 537.8,742.4 538.2,745.0C539.2,750.5 539.6,752.2 541.5,758.0C542.8,762.1 543.3,764.3 544.5,772.8C546.3,784.6 549.1,792.8 554.9,803.0C559.2,810.5 559.9,812.5 562.0,822.2C562.6,825.0 563.3,828.2 563.5,829.4C564.6,834.1 565.0,835.9 565.5,838.8C565.8,840.4 566.4,844.1 567.0,847.0C569.0,857.2 569.4,859.7 570.5,867.8C570.8,870.0 571.3,873.1 571.5,874.8C573.9,890.8 574.3,897.1 573.5,904.4C572.6,912.1 572.6,919.9 573.4,923.1C575.1,929.9 575.1,929.5 573.8,933.5C568.7,949.1 565.4,956.6 561.9,960.8C559.6,963.6 556.6,968.0 555.5,970.2C555.1,971.1 553.2,974.4 551.4,977.7C549.5,980.9 548.0,983.7 548.0,983.8C548.0,983.9 547.3,985.1 546.4,986.6C545.6,988.1 544.4,990.1 543.7,991.2C535.3,1006.5 534.9,1007.7 537.4,1010.1C540.7,1013.3 547.9,1014.3 567.5,1014.2C587.2,1014.1 599.2,1013.0 603.2,1010.8C604.8,1009.9 605.5,1009.0 607.3,1005.3C609.7,1000.2 611.5,993.6 611.5,989.8C611.5,985.6 610.2,981.6 606.5,975.0C603.8,970.1 603.0,968.2 603.0,966.7C603.0,961.0 606.4,947.8 609.5,941.2C610.4,939.5 612.1,937.1 613.8,935.5C617.3,932.0 619.8,927.1 620.6,921.9C621.3,917.3 620.6,913.1 617.7,903.9C612.6,887.5 605.2,851.3 601.0,821.8C598.0,801.4 598.0,800.3 600.3,788.5C601.9,780.2 602.1,777.7 602.2,771.8C602.2,764.3 601.7,761.3 599.5,754.2C597.9,749.0 597.2,741.4 596.7,722.0C596.5,710.1 596.1,700.4 594.7,671.2C593.9,652.5 593.8,637.1 594.5,630.8C595.1,625.3 596.2,621.0 597.1,620.4C597.9,619.8 617.7,620.2 625.0,620.9C634.4,621.9 642.1,622.5 648.8,623.0C652.3,623.3 658.3,623.7 662.0,624.0C711.0,627.7 758.1,627.0 793.2,621.9C808.0,619.8 821.1,617.5 829.9,615.5C832.5,614.9 834.8,614.4 841.0,613.0C845.4,612.0 858.0,608.5 861.0,607.5C861.7,607.3 863.3,606.8 864.5,606.5C866.5,605.9 873.8,603.4 882.0,600.4C891.9,596.8 913.0,586.3 926.0,578.5C939.3,570.5 956.2,562.0 958.8,562.0C959.4,562.0 960.8,566.3 964.4,578.8C966.5,585.8 971.3,595.5 976.8,603.8C979.2,607.3 981.8,611.7 982.6,613.5C984.9,619.0 987.3,628.2 989.7,640.8C996.0,673.3 1000.7,690.4 1008.8,709.3C1016.7,727.8 1018.3,733.6 1019.3,747.0C1020.5,762.8 1022.3,772.9 1026.8,788.8C1028.1,793.4 1028.2,794.3 1028.2,802.0C1028.2,806.5 1027.8,813.4 1027.3,817.2C1026.8,821.1 1025.4,832.6 1024.2,842.8C1020.4,874.8 1018.5,888.3 1017.0,897.2C1016.7,898.8 1015.5,902.8 1014.5,906.1C1012.2,913.1 1011.6,916.4 1011.4,923.5L1011.2,928.8L1006.3,937.0C997.0,952.6 995.9,954.1 991.0,959.2C988.3,962.0 985.5,965.1 984.7,966.2C983.3,968.0 976.2,979.3 972.5,985.5C971.7,986.7 970.0,989.6 968.6,991.9C967.2,994.2 966.0,996.2 966.0,996.3C966.0,996.4 965.5,997.4 964.8,998.4C960.3,1005.6 959.9,1007.8 962.4,1010.0C965.8,1013.1 973.7,1014.2 993.8,1014.2C1014.0,1014.2 1025.7,1013.1 1029.8,1010.8C1033.8,1008.4 1038.1,997.8 1038.1,990.0C1038.2,985.6 1037.7,983.9 1035.0,977.8C1032.5,972.1 1032.0,970.9 1032.0,969.8C1032.0,967.1 1037.1,955.6 1041.0,949.5C1043.9,945.0 1045.3,943.6 1048.6,942.0C1052.4,940.1 1056.5,935.9 1058.2,932.4C1060.4,927.8 1061.0,924.3 1061.0,913.8C1061.0,904.7 1061.5,896.7 1062.5,887.8C1062.8,885.5 1063.2,881.4 1063.5,878.5C1064.2,872.3 1065.3,863.5 1066.5,855.2C1066.7,853.6 1067.2,850.5 1067.5,848.2C1068.9,838.2 1071.6,821.1 1072.5,816.5C1072.7,815.3 1073.2,812.7 1073.6,810.8C1073.9,808.8 1074.7,805.1 1075.4,802.5C1076.0,799.9 1077.4,794.5 1078.3,790.5C1079.3,786.5 1080.3,782.5 1080.5,781.5C1080.7,780.5 1081.2,778.7 1081.4,777.5C1083.4,768.7 1085.2,762.4 1086.5,759.2C1086.9,758.3 1089.1,751.6 1090.6,747.0C1091.0,745.5 1091.2,742.7 1091.2,738.8C1091.1,733.3 1090.9,732.4 1089.3,728.0C1087.8,723.8 1083.8,714.0 1082.5,711.2C1080.8,707.6 1077.0,694.6 1075.5,687.2C1075.2,685.6 1074.7,683.4 1074.5,682.2C1073.7,678.5 1071.9,662.5 1072.2,662.1C1072.5,661.9 1075.5,666.5 1077.4,670.1C1079.6,674.4 1087.4,685.8 1093.3,693.3C1102.1,704.5 1109.1,714.6 1112.8,721.2C1115.5,726.3 1119.1,733.4 1120.2,736.0C1120.7,737.2 1121.3,738.7 1121.5,739.2C1122.1,740.5 1123.5,745.1 1125.3,751.8C1126.8,757.3 1128.6,762.0 1131.3,767.8C1134.1,773.6 1135.6,776.2 1143.5,788.7C1148.1,795.9 1149.7,799.1 1151.5,804.4C1154.9,814.6 1158.9,839.4 1161.7,868.2C1164.2,893.3 1164.3,900.2 1162.5,913.0C1161.8,918.1 1161.9,922.5 1163.1,928.3C1163.6,931.3 1164.1,934.3 1164.1,934.9C1164.1,935.5 1163.2,938.4 1162.1,941.4C1161.0,944.3 1159.3,949.0 1158.3,951.6C1155.8,958.4 1154.3,961.3 1152.0,964.2C1148.5,968.5 1147.2,970.5 1143.7,977.2C1141.9,980.8 1139.8,984.8 1139.1,986.0C1138.4,987.2 1135.4,993.0 1132.4,998.9C1128.2,1007.0 1126.9,1010.0 1126.9,1011.6C1126.9,1013.7 1127.8,1015.2 1130.0,1016.2C1134.9,1018.6 1154.2,1019.7 1171.2,1018.5C1189.3,1017.2 1192.4,1016.7 1195.1,1014.1C1197.5,1011.9 1201.1,1002.0 1201.8,996.0C1202.2,992.0 1201.1,987.9 1197.2,980.3C1193.9,973.8 1193.9,973.8 1194.2,970.5C1194.7,964.6 1198.5,951.6 1201.1,947.0C1201.6,946.0 1203.2,944.4 1204.6,943.3C1207.8,940.8 1211.2,936.3 1212.3,932.9C1214.0,928.0 1213.4,920.7 1210.5,910.0C1208.2,901.4 1206.8,893.4 1205.0,877.2C1203.8,866.8 1202.6,855.2 1202.0,848.3C1198.7,811.7 1198.4,804.9 1199.8,795.2C1201.1,785.8 1201.2,776.1 1200.2,765.6L1199.3,756.2L1200.7,749.5C1203.1,737.2 1203.5,731.2 1202.5,725.9C1201.7,722.2 1198.5,715.8 1195.6,712.2C1179.8,692.7 1172.8,678.6 1162.8,645.5C1157.8,628.9 1156.8,622.3 1157.5,612.4C1158.5,600.5 1161.6,590.7 1177.5,550.2C1185.5,529.9 1193.2,507.1 1196.2,494.8C1201.5,473.3 1203.2,460.4 1203.2,441.2C1203.2,424.1 1201.7,411.5 1197.9,398.8C1196.8,394.9 1196.9,393.5 1198.2,395.9C1199.6,398.5 1203.9,411.2 1205.5,417.2C1207.1,423.3 1209.0,433.3 1210.2,441.8C1212.0,454.9 1212.2,460.4 1212.2,480.5C1212.2,498.9 1212.1,501.9 1210.8,513.2C1206.4,554.4 1205.8,563.1 1205.9,586.5C1205.9,596.8 1206.1,610.1 1206.5,616.0C1207.6,637.0 1210.0,676.3 1210.2,678.8C1210.4,680.1 1210.7,684.1 1211.0,687.5C1211.3,690.9 1212.0,700.7 1212.7,709.2C1213.4,717.8 1214.2,728.2 1214.5,732.5C1215.7,750.1 1217.2,764.0 1219.3,776.9C1225.2,813.5 1233.0,842.1 1242.5,862.2C1248.8,875.5 1261.6,894.3 1266.9,898.0C1269.9,900.1 1272.3,898.5 1275.6,892.2C1279.5,884.5 1281.9,877.3 1286.0,860.5C1287.7,853.8 1289.6,846.2 1290.3,843.8C1291.0,841.3 1291.8,838.6 1292.0,837.8C1292.2,836.9 1292.9,834.5 1293.5,832.2C1294.8,827.6 1295.0,827.0 1296.7,818.2C1299.7,803.4 1301.6,786.9 1303.6,760.8C1304.9,743.2 1304.3,687.7 1302.5,660.0C1301.7,648.8 1299.9,626.6 1299.2,621.5C1299.1,620.5 1298.8,617.8 1298.5,615.5C1297.5,607.0 1296.9,602.1 1295.7,593.5C1294.5,585.2 1293.7,579.0 1292.5,569.5C1292.2,567.2 1291.7,559.3 1291.3,552.0C1290.6,540.3 1289.7,531.2 1288.0,518.5C1287.6,515.3 1286.3,507.7 1285.0,500.8C1283.2,491.3 1279.5,475.9 1275.4,461.8C1274.6,459.0 1269.3,442.7 1267.4,437.5C1265.9,433.2 1265.7,432.5 1264.3,429.5C1263.9,428.5 1262.6,425.4 1261.5,422.5C1260.4,419.6 1258.7,415.8 1257.9,414.0C1254.8,407.4 1250.8,399.2 1250.0,398.0C1249.5,397.3 1248.5,395.5 1247.6,394.0C1244.4,388.1 1242.4,384.9 1236.4,376.5C1233.8,372.8 1226.9,365.1 1222.7,361.0C1205.1,344.1 1182.7,334.5 1160.6,334.5L1155.9,334.5L1152.6,331.8C1141.4,323.0 1135.5,319.0 1123.1,311.9C1120.9,310.7 1112.0,306.2 1107.5,304.1C1071.2,287.2 1031.4,279.5 993.9,282.2C969.3,283.9 955.7,286.4 911.0,297.3C893.3,301.6 886.3,303.3 882.5,304.0C881.0,304.3 879.0,304.8 878.0,305.0C875.6,305.5 859.4,308.8 853.0,310.0C848.1,310.9 846.6,311.2 838.9,312.5C837.2,312.8 834.7,313.3 833.5,313.5C832.3,313.7 829.7,314.2 827.8,314.5C825.8,314.8 823.0,315.2 821.5,315.5C818.9,315.9 817.1,316.2 807.8,317.5C788.4,320.1 776.0,321.0 757.8,321.0C731.7,321.0 712.5,317.9 697.0,311.1C692.6,309.2 681.7,303.6 680.2,302.5C680.0,302.3 679.0,301.7 678.0,301.1C677.0,300.6 674.8,299.2 673.0,298.1C671.1,297.0 665.6,294.0 660.6,291.5C643.3,282.9 630.6,278.4 613.5,275.0C607.0,273.7 599.5,270.9 592.0,267.1C582.7,262.3 581.6,261.5 571.8,252.3C568.2,248.9 564.4,245.4 563.3,244.5C562.2,243.5 560.8,242.3 560.3,241.8C559.7,241.3 558.1,240.1 556.8,239.1C555.4,238.0 552.0,235.6 549.3,233.5C546.6,231.5 543.1,228.3 541.4,226.3C535.4,219.5 521.7,206.2 516.9,202.6C514.3,200.6 509.1,197.1 505.4,194.7C500.5,191.5 497.6,189.2 494.2,185.8C488.6,180.0 483.0,175.1 477.2,170.7C472.9,167.5 470.9,166.2 460.3,160.1C458.1,158.8 454.8,156.4 453.0,154.7C442.7,145.3 427.6,136.6 410.0,130.0C399.7,126.1 400.3,126.4 391.0,120.2C372.4,107.8 358.9,102.1 336.0,96.8C333.0,96.1 327.8,94.4 324.2,93.0C315.1,89.3 305.1,87.0 291.5,85.3C288.3,84.9 284.1,84.2 282.0,83.8C279.7,83.3 275.6,83.0 271.4,83.0L264.6,83.0L261.5,77.9C258.2,72.5 251.8,65.7 241.8,56.8C239.4,54.6 234.9,50.1 231.9,46.7C228.9,43.3 226.0,40.4 225.5,40.2C225.0,40.1 224.1,40.2 223.5,40.5C221.8,41.4 221.7,43.3 223.2,47.5C227.2,58.4 227.9,60.6 228.2,62.6C228.4,63.8 229.0,67.2 229.5,70.2C230.1,73.1 230.4,75.7 230.3,75.9C230.1,76.1 228.5,74.7 226.6,72.9C224.8,71.1 220.6,67.7 217.4,65.3C210.9,60.5 208.0,57.5 203.3,50.8C200.0,46.0 198.7,45.2 197.0,46.8C196.4,47.3 196.0,48.2 196.0,49.0C196.0,50.3 197.6,56.5 199.5,62.8C200.0,64.7 200.9,67.9 201.3,70.0C202.9,78.2 203.1,79.3 203.5,80.4C203.8,81.0 204.0,81.9 204.0,82.4C204.0,83.6 207.9,91.4 210.1,94.6L212.1,97.5L207.7,101.9C199.1,110.3 191.0,122.9 191.0,127.8C191.0,129.4 190.3,130.8 186.9,135.7C183.0,141.4 179.7,145.0 171.4,152.9C166.5,157.6 164.3,161.8 163.6,168.0C163.3,170.3 163.1,173.4 163.1,174.8C163.2,176.8 162.9,178.0 161.2,181.2C156.8,190.0 149.3,202.2 136.3,221.8C114.5,254.5 109.7,262.8 101.9,281.0C96.8,292.8 96.3,294.6 96.6,301.6C96.9,308.2 97.9,311.4 101.3,316.9C102.8,319.2 104.3,322.8 105.6,326.6C107.8,333.5 108.9,335.8 111.5,339.3C113.8,342.4 116.4,344.2 121.2,346.0C126.4,347.9 130.9,348.7 135.2,348.4C138.0,348.2 139.4,348.3 141.5,349.0C145.1,350.3 153.6,350.3 157.5,349.2C166.4,346.6 170.8,341.1 172.3,331.0C173.5,322.8 173.7,322.3 177.8,318.6C179.8,316.8 182.9,314.4 184.6,313.2C186.3,312.0 189.7,309.7 192.0,308.0C194.3,306.3 199.2,302.9 202.8,300.5C220.7,288.1 223.2,286.3 238.9,274.4C243.9,270.6 245.0,270.2 251.5,269.8C258.1,269.5 262.9,268.3 268.2,265.7C273.2,263.1 277.2,260.3 281.4,256.4C285.3,252.6 284.8,252.8 290.5,254.3C293.6,255.2 298.2,257.4 301.5,259.7C311.4,266.4 318.1,275.9 329.9,299.8C340.2,320.7 349.7,339.6 351.2,342.2C352.1,343.9 353.8,347.2 355.0,349.5C356.2,351.8 357.8,354.8 358.5,356.0C359.2,357.2 360.8,360.1 362.0,362.2C364.2,366.3 365.2,368.1 367.1,371.4C367.7,372.4 368.8,374.5 369.7,376.0C370.5,377.5 372.0,380.2 373.1,381.9C374.1,383.7 375.0,385.2 375.0,385.3C375.0,385.3 376.1,387.4 377.5,389.7C378.9,392.1 380.0,394.2 380.0,394.3C380.0,394.4 380.7,395.6 381.6,397.1C384.5,402.1 385.2,403.3 389.2,411.2C395.4,423.4 397.7,429.0 401.5,441.2C402.1,443.4 403.8,452.1 404.4,456.2C404.8,458.9 404.6,461.9 403.9,468.8C402.8,479.4 402.5,496.7 403.4,503.2C406.4,525.3 410.0,538.9 416.5,552.3C422.7,565.3 430.4,575.6 442.2,586.6C452.2,596.1 456.3,600.3 457.8,602.8C458.9,604.7 459.0,605.4 459.2,614.3C459.6,631.0 461.5,644.1 469.2,682.2C474.8,710.2 475.9,720.1 474.7,734.0C473.8,745.7 473.8,750.0 475.0,757.8C475.8,763.0 475.9,766.7 475.9,777.0C475.8,792.4 476.3,796.1 480.3,807.8C483.4,817.0 483.8,819.7 484.5,834.5C485.2,849.3 485.1,863.1 484.3,884.1C483.5,902.9 483.4,903.6 480.8,912.2C478.5,919.7 477.9,924.2 478.3,930.2L478.6,935.2L475.0,941.5C465.7,957.5 464.0,960.1 458.8,965.5C453.5,971.0 451.2,974.4 440.6,992.2C434.1,1003.3 430.5,1010.2 430.5,1011.7C430.5,1014.0 433.2,1016.3 437.2,1017.3C444.2,1019.0 464.9,1019.4 481.1,1018.3ZM445.5,1015.3C438.9,1014.5 436.6,1014.1 434.8,1013.1C433.6,1012.5 433.5,1012.2 433.7,1011.1C434.1,1009.5 439.1,1000.7 446.0,989.2L450.8,981.2L456.0,981.4C467.9,981.7 489.1,987.0 499.5,992.2L503.8,994.3L503.6,996.6C503.5,999.1 501.7,1004.9 499.7,1009.3C497.6,1013.8 496.8,1014.1 481.0,1015.3C469.7,1016.1 453.0,1016.1 445.5,1015.3ZM1140.5,1015.3C1137.1,1014.9 1133.3,1014.3 1132.2,1013.9C1129.0,1012.8 1129.2,1011.7 1134.7,1001.0C1139.7,991.2 1144.2,982.7 1145.2,981.6C1146.2,980.2 1161.1,981.7 1173.2,984.3C1179.1,985.5 1189.3,989.0 1194.2,991.5L1198.8,993.8L1198.6,996.0C1198.2,1002.2 1194.4,1011.7 1191.8,1012.9C1189.7,1013.9 1185.4,1014.4 1172.8,1015.3C1159.3,1016.1 1149.2,1016.1 1140.5,1015.3ZM553.0,1011.0C540.4,1010.1 537.6,1008.6 539.9,1004.4C540.4,1003.5 541.8,1001.0 543.0,998.8C544.2,996.5 545.9,993.3 546.9,991.5C547.8,989.7 549.6,986.7 550.7,984.8C551.8,982.8 553.3,980.2 554.0,978.9C554.6,977.6 555.4,976.5 555.7,976.5C556.0,976.4 558.3,976.5 560.8,976.5C572.4,976.6 594.4,981.9 604.5,986.9L608.2,988.8L608.4,991.0C608.6,994.9 604.1,1006.8 601.8,1008.2C600.5,1009.1 598.7,1009.4 590.1,1010.3C581.9,1011.2 560.4,1011.6 553.0,1011.0ZM981.0,1011.2C979.2,1011.1 976.1,1010.8 974.0,1010.5C966.5,1009.5 964.0,1008.4 964.0,1006.4C964.0,1005.5 972.8,990.3 979.8,979.1L981.8,976.0L985.3,976.0C997.4,976.0 1017.1,980.8 1030.4,987.0L1035.6,989.5L1035.2,992.1C1034.6,996.7 1030.7,1006.3 1028.7,1008.1C1027.7,1008.9 1024.0,1009.7 1017.0,1010.5C1012.5,1011.0 986.6,1011.5 981.0,1011.2ZM497.2,988.7C489.8,985.5 480.3,982.3 474.0,981.0C468.5,979.9 458.0,978.5 455.0,978.5C453.9,978.5 453.0,978.3 453.0,977.9C453.0,976.9 457.4,971.3 461.8,966.6C466.7,961.4 470.6,955.4 479.3,939.8L481.2,936.2L481.3,928.5C481.3,920.4 481.5,919.4 484.7,909.0C488.9,895.2 489.1,821.7 484.9,812.1C483.2,808.1 481.6,802.9 480.3,796.8C479.0,791.0 478.9,790.0 478.8,776.0C478.7,764.6 478.5,760.0 477.8,755.5C477.2,751.3 477.0,748.3 477.2,744.2C478.0,728.0 478.1,716.7 477.3,711.2C476.3,704.0 474.4,692.9 472.6,684.0C470.0,671.3 467.1,656.4 466.2,651.5C460.3,616.3 460.8,594.9 468.0,572.9C469.7,567.7 469.7,568.0 469.0,568.0C468.4,568.0 466.1,572.8 464.0,578.5C462.3,583.0 460.6,590.5 460.2,595.5C460.0,597.4 459.7,599.0 459.5,599.0C459.3,599.0 457.0,596.9 454.4,594.3C451.9,591.8 447.5,587.6 444.7,585.1C437.2,578.2 428.5,567.8 423.3,559.1C420.1,553.7 416.6,545.8 413.8,537.4C410.6,527.8 408.9,520.2 407.3,509.0C405.1,493.8 405.1,485.6 407.5,464.2C410.1,441.0 410.9,417.6 409.6,405.2C408.3,393.9 404.3,372.6 403.2,371.6C402.8,371.2 403.2,375.6 404.0,380.5C406.5,396.2 407.5,406.9 407.5,420.2C407.6,432.0 406.8,445.4 406.0,446.2C405.7,446.5 405.5,446.5 405.5,446.2C405.5,446.0 405.2,444.2 404.7,442.3C403.1,434.4 397.7,420.9 391.6,409.5C390.1,406.6 387.8,402.3 386.6,400.0C385.4,397.7 380.8,389.6 376.5,382.0C369.2,369.2 367.7,366.6 364.7,361.2C357.5,348.2 351.0,335.8 343.0,319.5C325.6,284.5 324.3,281.9 318.5,273.2C313.8,266.3 308.8,261.1 303.0,257.2C300.3,255.5 298.0,254.0 297.8,254.0C297.6,254.0 296.5,253.6 295.4,253.0C294.2,252.5 291.9,251.7 290.3,251.3C288.7,250.9 287.3,250.4 287.2,250.3C287.1,250.2 288.1,248.5 289.5,246.4C296.7,235.4 300.1,222.5 300.1,205.5C300.1,194.4 298.7,185.8 295.2,175.2C293.0,168.3 286.3,155.4 284.5,154.2C283.1,153.4 283.5,154.9 285.6,158.9C290.0,167.2 294.3,180.4 296.3,191.5C297.5,198.1 297.5,213.0 296.3,219.6C294.6,229.9 290.3,240.5 285.3,247.2C276.7,258.7 265.7,265.4 253.0,267.0C246.4,267.9 240.6,266.7 233.1,263.1C229.4,261.3 228.1,261.3 229.8,263.0C231.1,264.3 238.5,268.5 239.6,268.5C241.1,268.5 241.0,269.4 239.4,270.4C238.5,271.0 235.2,273.5 232.0,275.9C226.7,280.1 216.7,287.3 204.3,295.8C188.1,306.9 184.2,309.7 178.9,313.9C175.7,316.5 174.9,316.9 175.2,315.9C175.9,313.8 176.1,311.0 175.6,311.0C175.3,311.0 174.9,311.5 174.7,312.1C174.5,312.7 173.9,314.4 173.2,315.8C171.4,319.8 170.0,324.5 170.0,326.5C170.0,329.4 168.7,335.7 167.7,337.8C166.4,340.6 162.9,343.9 159.8,345.3C157.3,346.4 151.0,347.5 151.0,346.8C151.0,346.6 151.5,345.8 152.1,345.0C153.9,342.5 152.8,342.3 150.3,344.7C147.7,347.2 146.1,347.6 143.2,346.5L141.8,345.9L143.1,344.8C144.8,343.4 146.5,341.0 148.7,336.8C151.9,330.8 160.7,317.1 162.7,314.9C163.4,314.2 164.7,313.2 165.5,312.7C167.1,311.7 167.4,310.5 166.3,309.5C165.7,309.0 165.3,309.0 164.3,309.7C161.3,311.6 153.4,322.9 146.5,335.0C143.0,341.3 141.7,342.8 139.3,344.2C136.4,345.9 133.8,346.2 129.7,345.3C125.6,344.3 122.9,342.8 120.3,340.0C118.7,338.3 117.5,337.5 117.5,338.2C117.5,338.3 118.2,339.2 119.0,340.3C121.0,342.8 120.2,343.0 117.0,341.0C113.6,338.8 111.8,335.7 108.7,326.8C107.1,322.0 105.3,317.8 103.8,315.3C99.7,308.7 98.4,302.9 99.4,296.7C99.9,293.7 102.8,285.9 106.1,278.4C111.3,266.6 121.2,249.2 130.6,235.2C131.7,233.6 136.3,226.8 140.8,220.2C150.0,206.6 159.5,191.0 163.7,182.4C166.4,176.9 166.5,176.5 166.2,173.9C165.9,171.0 166.7,164.9 167.8,162.3C168.7,160.0 171.9,156.1 175.0,153.2C180.8,148.1 184.9,143.6 187.9,139.1C191.3,134.2 193.7,131.5 204.3,120.5C207.9,116.8 212.4,111.8 214.5,109.4C218.7,104.3 221.4,101.9 226.2,99.1C230.2,96.8 235.6,94.8 236.7,95.1C237.8,95.6 240.4,100.0 241.3,102.9C241.9,105.2 242.7,106.3 245.2,108.7C246.9,110.4 248.9,112.1 249.6,112.5C252.3,113.9 251.7,112.4 248.2,109.2C245.0,106.4 242.9,103.4 243.6,102.7C244.0,102.3 248.5,105.5 248.8,106.3C249.2,107.3 250.5,107.2 250.5,106.1C250.5,105.0 248.9,103.2 245.8,100.7C241.8,97.6 240.1,95.5 238.0,91.2C235.7,86.5 234.4,81.9 233.0,73.5C231.0,61.5 230.0,57.9 226.3,47.8C224.8,43.7 224.9,44.0 225.4,44.0C225.7,44.0 227.9,46.4 230.4,49.3C232.9,52.2 237.8,57.2 241.4,60.3C253.0,70.4 256.7,75.0 263.5,87.4C268.6,96.7 269.5,99.1 269.5,103.1C269.5,106.7 270.2,107.9 271.0,105.7C271.7,103.8 271.6,99.3 270.7,96.7C270.3,95.4 270.0,94.3 270.2,94.1C270.3,94.0 271.1,94.1 271.9,94.4C272.6,94.7 277.4,96.2 282.5,97.7C302.5,103.8 329.1,113.2 339.9,118.0C350.0,122.4 365.3,130.7 371.5,135.0C372.6,135.8 376.5,138.1 383.4,142.1C384.3,142.6 385.7,143.4 386.6,143.9C388.3,144.9 394.0,148.3 400.0,151.8C405.1,154.7 419.8,163.6 424.2,166.3C426.4,167.7 430.4,170.1 433.0,171.8C443.3,178.2 474.9,199.7 486.0,207.9C494.2,214.0 519.6,233.1 529.4,240.6C565.1,267.9 573.3,271.8 603.8,276.3C621.3,278.8 640.8,285.0 657.4,293.2C662.6,295.7 664.7,296.9 670.7,300.3C672.2,301.2 673.6,302.0 673.7,302.0C673.8,302.0 675.4,302.9 677.3,304.1C689.4,311.5 702.1,317.1 712.0,319.4C727.1,323.0 737.2,324.0 758.8,324.0C771.6,324.0 786.7,323.3 794.3,322.3C795.4,322.1 798.3,321.8 800.8,321.5C807.9,320.6 820.2,318.8 829.5,317.2C831.8,316.8 835.2,316.2 836.9,316.0C838.6,315.7 841.8,315.2 843.9,314.7C846.0,314.3 849.0,313.8 850.5,313.5C856.4,312.5 869.5,309.9 873.9,309.0C876.4,308.4 880.7,307.5 883.4,307.0C889.0,305.7 900.0,303.2 902.5,302.5C903.5,302.2 906.3,301.5 908.8,301.0C911.2,300.4 917.3,298.9 922.2,297.7C946.3,291.9 956.4,289.8 973.8,287.3C986.6,285.4 993.4,284.9 1007.5,284.9C1020.1,284.8 1025.4,285.2 1037.8,286.8C1046.8,288.0 1049.9,288.5 1056.5,290.0C1057.5,290.2 1059.0,290.6 1060.0,290.8C1061.6,291.1 1065.7,292.2 1070.8,293.6C1077.7,295.6 1092.8,300.9 1098.5,303.3C1099.5,303.8 1100.7,304.3 1101.2,304.5C1103.3,305.4 1119.8,313.5 1122.2,314.9C1138.0,323.7 1151.0,333.5 1163.3,345.7C1171.0,353.5 1174.5,357.7 1180.0,366.0C1186.4,375.7 1192.2,388.7 1195.5,400.6C1198.7,412.2 1200.9,434.4 1200.3,448.0C1198.8,479.7 1192.3,504.4 1170.7,559.2C1153.4,603.5 1151.5,614.1 1157.0,635.9C1159.0,643.8 1159.4,645.2 1165.2,663.0C1167.3,669.3 1168.5,673.7 1168.6,675.5C1168.6,677.0 1168.5,683.4 1168.3,689.8C1168.0,699.3 1168.0,702.5 1168.8,708.4C1169.5,714.4 1169.5,716.3 1169.0,719.2C1168.3,723.7 1166.7,727.2 1164.1,730.0C1162.0,732.2 1161.6,733.0 1162.4,733.0C1163.2,733.0 1166.7,730.2 1168.1,728.6C1168.8,727.7 1169.9,727.0 1170.4,727.0C1171.3,727.0 1171.4,726.5 1171.7,721.4C1171.9,718.1 1171.8,714.4 1171.5,712.5C1169.6,700.7 1169.0,689.7 1169.8,680.9C1170.2,677.2 1170.7,676.6 1171.6,679.1C1174.0,686.1 1183.1,701.3 1190.0,710.0C1195.0,716.2 1197.1,719.5 1198.4,723.2C1200.3,728.4 1200.2,737.4 1198.2,747.2L1196.7,754.2L1194.6,754.4C1193.4,754.5 1191.8,754.2 1190.6,753.7C1188.7,752.8 1183.2,747.6 1180.9,744.5C1180.2,743.5 1179.4,742.9 1179.2,743.1C1178.7,743.6 1181.1,747.4 1184.0,751.0C1186.9,754.5 1190.0,756.4 1193.9,757.2L1196.8,757.8L1197.2,763.3C1198.0,773.3 1197.8,789.2 1196.9,795.1C1195.5,803.9 1195.7,811.7 1198.3,840.8C1201.7,879.4 1203.8,895.1 1208.0,912.4C1210.5,922.9 1210.9,926.3 1209.8,930.5C1208.7,934.8 1206.5,938.1 1203.1,940.5C1200.2,942.6 1199.9,942.6 1196.6,940.4C1193.3,938.1 1189.0,936.0 1188.8,936.5C1188.5,936.9 1194.1,941.9 1196.9,943.7C1197.9,944.3 1198.4,945.1 1198.3,945.5C1198.2,945.9 1197.2,948.6 1196.1,951.5C1192.9,959.8 1191.4,965.3 1191.1,970.1L1190.9,974.5L1194.0,980.6C1197.3,987.1 1198.7,990.5 1198.0,990.5C1197.8,990.5 1195.7,989.6 1193.4,988.5C1187.9,985.9 1177.0,982.3 1171.0,981.0C1164.9,979.7 1155.3,978.5 1150.6,978.5C1147.8,978.5 1147.0,978.3 1147.0,977.8C1147.0,976.7 1149.7,972.3 1153.7,967.0C1156.9,962.7 1157.7,961.2 1160.9,953.0C1162.9,947.9 1165.0,942.3 1165.6,940.5C1166.2,938.7 1167.2,936.5 1167.8,935.7C1169.3,933.7 1169.3,933.6 1167.9,933.4C1167.0,933.3 1166.7,932.7 1166.2,930.0C1165.0,923.4 1164.9,919.0 1165.8,911.0C1167.7,894.0 1165.3,863.5 1159.2,826.0C1155.5,803.6 1154.5,800.7 1143.0,782.2C1134.5,768.6 1130.3,759.6 1127.3,748.2C1124.7,739.0 1123.9,736.8 1120.3,729.5C1114.0,716.7 1108.7,708.4 1098.2,694.7C1082.3,674.1 1080.4,671.0 1066.9,644.0C1058.5,627.2 1058.1,626.6 1049.8,619.6C1040.9,612.2 1034.0,603.8 1030.3,595.8C1026.7,588.2 1024.9,583.5 1024.8,582.3C1024.8,581.3 1024.4,580.7 1023.6,580.4C1023.0,580.2 1019.4,578.0 1015.6,575.4C1007.0,569.7 999.8,562.6 994.9,555.2C988.2,545.0 986.2,539.8 980.0,516.0C975.3,497.9 971.6,486.7 970.6,487.7C970.5,487.8 971.3,491.6 972.4,496.1C973.6,500.6 975.9,510.3 977.8,517.8C981.3,532.5 984.1,541.2 986.8,546.9C987.8,548.9 988.5,550.7 988.3,550.8C988.2,551.0 987.4,550.7 986.7,550.2C984.7,548.8 979.2,546.2 976.5,545.3C970.1,543.3 967.2,542.8 960.0,542.8C953.4,542.8 947.0,543.6 947.0,544.5C947.0,544.6 950.8,544.8 955.4,544.8C964.0,544.8 966.6,545.1 973.9,547.5C977.7,548.7 983.0,551.0 983.0,551.5C983.0,551.6 981.6,552.1 979.9,552.4C970.6,554.3 960.8,557.3 956.4,559.6C955.9,559.8 955.3,560.0 955.0,560.0C954.0,560.0 938.0,568.0 932.2,571.4C903.8,588.0 888.0,595.6 867.5,602.3C859.0,605.1 850.7,607.6 844.5,609.0C843.5,609.2 842.3,609.5 841.8,609.7C840.8,609.9 833.7,611.6 829.8,612.5C828.0,612.9 821.6,614.2 814.8,615.5C813.4,615.7 809.3,616.4 805.8,617.0C802.2,617.6 798.0,618.2 796.5,618.5C792.5,619.2 780.0,620.6 770.8,621.5C757.6,622.7 751.2,623.0 734.7,623.3C713.8,623.7 685.9,622.8 661.8,621.0C645.2,619.8 633.4,618.8 625.0,618.0C615.1,617.0 603.8,616.9 594.0,617.7C583.2,618.7 577.7,619.3 576.1,619.8C575.3,620.0 575.0,619.9 575.0,619.3C575.0,618.9 575.2,618.4 575.5,618.3C576.4,617.7 579.6,611.5 580.8,607.9C581.5,605.8 582.2,602.1 582.5,598.6C583.2,590.7 584.0,588.1 588.1,579.0C592.5,569.2 595.6,560.0 597.2,551.8C598.8,543.3 599.4,537.4 600.0,522.8C600.5,512.1 601.0,505.9 602.3,498.6C602.6,496.8 602.5,496.4 602.0,496.6C600.4,497.1 598.4,509.4 597.5,523.2C595.9,550.7 593.6,561.0 585.0,578.6C581.1,586.7 581.1,587.0 579.3,601.0C578.7,605.9 578.3,607.3 576.5,610.7C573.0,617.6 571.3,619.5 560.7,628.0C558.8,629.5 557.1,630.8 557.0,630.9C556.8,631.0 556.8,629.3 556.9,627.2C557.0,625.1 556.9,621.8 556.5,619.8C554.7,608.9 551.8,604.8 543.0,600.2C533.6,595.4 527.1,588.6 521.0,577.6C519.9,575.6 519.0,574.9 519.0,576.0C519.0,576.2 519.9,578.2 521.1,580.3C526.6,590.9 532.2,597.0 540.5,601.7C547.8,605.8 549.7,607.4 551.4,611.1C554.0,616.7 554.7,620.4 554.3,628.0C554.1,632.6 553.7,635.7 553.1,637.8C552.6,639.4 551.9,641.8 551.6,643.0C551.1,645.1 550.8,646.5 549.4,654.5C548.7,658.8 548.0,662.6 547.5,664.8C547.3,665.9 546.8,668.1 546.6,669.8C545.8,674.4 544.0,684.0 543.5,686.2C543.3,687.4 542.8,689.6 542.5,691.2C542.2,692.9 541.7,695.1 541.5,696.2C541.1,698.2 540.5,701.4 539.5,706.8C539.2,708.1 538.6,711.6 538.0,714.5C537.4,717.4 536.7,721.1 536.5,722.8C536.2,724.4 535.7,726.8 535.5,728.0C534.7,732.3 533.3,740.7 532.5,745.5C531.1,755.0 530.9,758.2 531.3,762.4C532.1,770.6 531.8,782.9 530.8,786.8C529.6,791.3 528.2,795.6 526.6,798.9C523.3,806.3 522.0,810.4 521.5,815.8C520.6,824.6 520.8,880.0 521.8,895.2C522.5,907.5 522.8,909.9 524.0,919.5C524.8,925.3 524.4,930.2 522.9,934.5C521.6,938.2 519.5,940.6 514.6,944.0L511.4,946.1L509.8,944.6C507.9,942.8 502.3,939.0 501.5,939.0C500.4,939.0 501.1,939.8 505.3,943.8L509.7,947.8L507.4,951.5C504.4,956.4 500.7,963.9 499.2,968.0C497.2,973.1 497.4,975.8 500.1,981.8C502.5,987.1 503.7,990.3 503.4,990.9C503.3,991.1 500.6,990.1 497.2,988.7ZM1032.7,985.8C1031.1,984.8 1021.6,980.7 1017.4,979.3C1007.2,975.9 994.8,973.5 987.4,973.5C985.8,973.5 984.4,973.3 984.3,973.0C983.8,972.3 989.1,965.3 993.7,960.5C996.0,958.2 998.5,955.2 999.4,954.0C1002.5,949.4 1013.2,931.2 1013.8,929.5C1014.2,928.5 1014.5,925.4 1014.5,922.5C1014.5,916.9 1015.1,913.7 1017.5,906.3C1019.6,899.9 1020.4,896.4 1021.0,892.0C1021.5,888.2 1022.7,878.7 1024.5,865.0C1026.0,854.1 1026.4,850.8 1030.3,816.0C1030.8,812.0 1031.2,805.4 1031.2,801.2L1031.2,793.8L1028.1,781.8C1024.4,767.4 1023.7,763.6 1022.7,752.1C1021.0,731.9 1020.9,731.4 1012.1,709.5C1002.8,686.3 999.6,675.2 993.5,644.6C988.3,618.6 986.6,613.4 979.8,603.0C971.9,591.0 968.2,583.0 965.3,571.4C964.4,567.7 963.3,563.9 962.8,562.8C962.4,561.7 962.0,560.8 962.1,560.7C962.6,560.3 964.9,559.3 966.2,558.9C970.8,557.5 976.0,556.2 979.8,555.5C981.7,555.2 984.2,554.7 985.4,554.4C987.4,554.0 987.8,554.1 990.1,555.6C991.5,556.4 993.5,558.4 994.6,560.0C999.9,567.2 1005.7,572.5 1015.3,578.9C1020.4,582.3 1022.0,584.3 1024.3,589.5C1029.5,602.1 1035.7,611.1 1043.8,618.2C1046.3,620.4 1049.8,623.5 1051.6,625.1C1055.6,628.6 1058.2,632.7 1064.7,646.0C1068.8,654.4 1069.0,654.9 1069.0,658.2C1069.0,661.9 1070.1,674.2 1071.0,679.2C1073.1,693.1 1076.8,705.4 1083.3,721.1C1088.1,732.7 1088.1,732.7 1088.2,739.2L1088.2,745.2L1085.3,753.5C1083.7,758.0 1081.9,763.5 1081.3,765.8C1080.2,769.5 1079.9,771.0 1078.5,777.4C1077.6,781.5 1074.6,793.6 1073.5,797.5C1072.4,801.7 1071.4,806.2 1070.5,811.0C1070.2,812.8 1069.7,815.4 1069.5,816.8C1069.2,818.1 1068.6,822.1 1068.0,825.6C1067.5,829.1 1066.5,834.9 1066.0,838.4C1065.4,841.9 1064.9,845.4 1064.7,846.2C1064.5,848.1 1063.6,854.3 1063.0,859.5C1062.7,861.6 1062.3,865.0 1062.0,867.1C1060.8,876.1 1060.5,879.0 1060.0,883.5C1058.6,896.5 1058.0,905.1 1058.0,913.6C1058.0,924.3 1057.4,927.5 1054.8,932.3C1053.1,935.4 1050.4,937.8 1045.9,940.2C1043.0,941.8 1043.7,942.1 1040.3,937.8C1039.0,936.1 1035.0,933.0 1034.3,933.0C1033.7,933.0 1034.0,934.4 1034.8,935.1C1035.3,935.4 1036.5,936.9 1037.6,938.2C1038.6,939.6 1040.0,941.3 1040.5,942.1L1041.6,943.4L1039.2,947.1C1033.7,955.6 1029.0,966.2 1029.0,969.9C1029.0,970.6 1029.9,973.3 1031.1,975.9C1033.3,981.2 1035.0,985.5 1035.0,986.1C1035.0,986.7 1033.8,986.6 1032.7,985.8ZM605.0,984.8C603.8,984.1 600.3,982.7 597.2,981.6C586.0,977.4 576.0,975.1 564.0,974.0C560.6,973.6 557.7,973.3 557.6,973.2C557.1,972.8 561.7,965.6 565.4,961.1C568.3,957.4 570.6,952.0 575.8,936.6L578.1,929.9L577.0,925.3C575.7,920.3 575.5,911.9 576.5,905.2C577.4,898.9 577.0,892.0 574.7,876.0C572.8,862.7 569.7,844.3 567.5,834.0C562.9,812.2 562.0,808.9 559.5,804.9C556.1,799.7 551.2,789.0 550.1,784.8C548.1,777.1 547.3,773.1 546.5,766.8C546.2,764.3 545.1,759.7 544.0,756.5C542.1,750.8 541.6,748.3 540.5,741.8C540.2,739.8 539.7,736.9 539.4,735.2C538.6,731.3 538.6,726.0 539.4,722.2C540.6,717.0 540.9,715.3 541.5,712.0C541.8,710.2 542.3,707.9 542.5,706.8C542.7,705.6 543.2,703.4 543.5,701.8C543.8,700.1 544.3,697.9 544.5,696.8C544.7,695.6 545.2,693.3 545.5,691.5C545.8,689.7 546.3,687.2 546.5,686.0C546.7,684.8 547.2,682.3 547.5,680.5C547.8,678.7 548.3,676.4 548.5,675.2C548.7,674.1 549.2,671.8 549.5,670.0C550.7,663.3 551.1,661.2 551.5,659.2C551.7,658.1 552.2,655.9 552.5,654.2C553.8,646.8 555.1,640.6 555.9,638.5C557.1,635.3 560.0,631.9 563.9,629.2C565.7,627.9 568.1,626.1 569.1,625.2C570.1,624.3 571.5,623.4 572.1,623.3C576.3,622.4 583.3,621.5 590.7,620.8L593.1,620.6L592.9,622.4C592.7,623.4 592.2,627.1 591.8,630.5C591.0,635.8 590.9,638.9 591.2,651.5C591.4,659.6 591.7,670.0 592.0,674.5C592.6,686.0 593.9,720.2 594.1,732.6C594.3,742.0 594.0,744.7 593.2,742.1C593.0,741.6 592.0,739.3 591.0,737.0C590.0,734.7 588.3,730.2 587.3,727.0C585.0,720.1 584.3,718.8 584.8,722.2C585.5,728.0 588.3,736.2 592.5,745.2C595.1,750.8 596.5,754.2 597.1,756.5C598.9,763.4 599.1,765.1 599.1,771.8C599.1,778.5 598.6,782.5 596.7,790.8C595.7,795.1 595.5,805.2 596.4,811.0C596.7,813.3 597.2,816.8 597.5,818.8C598.2,823.9 600.0,835.4 600.5,838.2C600.8,839.6 601.5,843.6 602.0,847.0C603.1,853.5 606.6,871.7 607.5,875.2C607.7,876.4 608.4,879.4 609.0,882.0C611.1,891.2 613.4,900.3 615.2,905.7C618.5,915.6 618.7,921.5 615.8,927.8C614.5,930.6 609.8,936.0 608.7,936.0C608.3,936.0 606.7,935.1 605.1,934.1C601.6,931.9 599.1,930.7 598.7,931.2C598.5,931.4 598.4,931.6 598.5,931.7C598.7,931.7 600.6,933.2 602.9,935.0C605.1,936.7 607.0,938.4 607.0,938.7C607.0,939.1 606.4,940.8 605.7,942.5C602.9,949.2 600.0,961.6 600.0,966.5C600.0,969.0 600.3,970.0 602.1,973.4C605.7,980.1 608.0,984.7 608.0,985.4C608.0,986.2 607.6,986.1 605.0,984.8ZM1266.4,893.6C1262.8,889.8 1256.0,880.6 1252.9,875.2C1252.3,874.1 1251.1,871.9 1250.1,870.2C1248.6,867.4 1243.4,857.1 1241.1,852.0C1240.0,849.4 1235.3,835.6 1233.9,830.6C1233.7,829.7 1233.3,828.3 1233.0,827.4C1232.1,824.0 1230.4,817.7 1229.9,815.5C1229.6,814.3 1229.2,812.5 1229.0,811.5C1228.8,810.5 1227.9,806.5 1227.0,802.5C1226.2,798.5 1225.3,794.4 1225.0,793.2C1224.7,792.1 1224.3,789.7 1224.0,787.8C1223.5,784.4 1223.2,782.9 1222.0,775.5C1220.8,768.3 1218.7,749.2 1218.0,738.8C1217.5,731.6 1216.8,722.9 1216.0,713.8C1214.8,700.0 1213.2,677.9 1212.5,668.0C1212.2,663.5 1211.8,656.5 1211.5,652.5C1211.2,648.5 1210.8,641.1 1210.5,636.0C1210.2,630.9 1209.7,622.7 1209.4,617.8C1209.1,612.8 1208.8,598.9 1208.8,586.8C1208.8,563.0 1209.1,557.2 1212.0,530.9C1214.0,512.2 1214.3,508.6 1215.0,495.5C1216.0,479.1 1215.0,454.3 1212.9,440.2C1212.7,438.3 1212.2,435.3 1212.0,433.5C1210.9,426.7 1207.2,411.2 1204.9,404.8C1203.5,400.6 1198.1,388.9 1196.1,385.2C1195.1,383.6 1192.9,380.3 1191.2,377.8C1189.4,375.4 1187.5,372.5 1186.9,371.3C1183.2,364.0 1173.6,351.6 1165.3,343.5L1159.4,337.8L1161.8,337.6C1171.0,337.0 1188.2,341.5 1198.9,347.3C1217.4,357.4 1231.5,372.1 1245.1,395.5C1246.7,398.1 1255.2,415.0 1256.1,417.2C1256.6,418.4 1257.3,420.1 1257.8,421.2C1258.6,423.2 1259.2,424.6 1260.7,428.1C1261.4,429.7 1263.1,434.3 1264.0,437.0C1264.2,437.7 1265.1,440.2 1266.0,442.5C1270.5,454.6 1276.7,476.2 1279.5,489.2C1279.8,490.9 1280.3,492.9 1280.5,493.8C1280.7,494.6 1281.1,496.6 1281.4,498.2C1281.7,499.9 1282.4,503.6 1283.0,506.5C1284.7,515.3 1284.9,516.6 1285.4,520.8C1287.0,532.9 1287.7,540.6 1288.5,555.5C1288.8,561.1 1289.3,567.5 1289.5,569.6C1290.7,578.8 1291.1,581.9 1291.5,584.5C1291.7,586.0 1292.2,589.2 1292.5,591.5C1292.8,593.8 1293.2,597.1 1293.5,598.8C1293.7,600.4 1294.2,603.9 1294.5,606.5C1294.8,609.1 1295.3,612.9 1295.5,615.0C1295.9,618.6 1296.4,623.3 1297.5,634.6C1298.2,641.8 1298.9,650.9 1299.5,660.2C1299.8,664.6 1300.3,672.5 1300.6,677.8C1301.0,683.7 1301.2,699.8 1301.2,721.0C1301.2,753.8 1301.1,758.2 1299.5,775.5C1299.0,780.4 1298.8,782.6 1297.5,793.8C1296.8,799.6 1296.1,804.6 1295.5,808.0C1295.2,809.5 1294.7,812.8 1294.3,815.2C1293.2,821.5 1292.8,823.4 1291.0,830.0C1290.1,833.2 1287.5,843.2 1285.2,852.2C1282.9,861.3 1280.8,869.6 1280.4,870.8C1276.5,884.3 1271.2,896.0 1269.1,896.0C1268.9,896.0 1267.7,894.9 1266.4,893.6ZM521.1,732.6C521.3,729.9 521.6,725.6 521.8,723.0C521.9,720.4 522.3,716.2 522.5,713.8C523.3,706.9 524.0,683.9 523.6,682.3C523.2,681.0 523.1,681.5 522.6,685.3C522.3,687.7 521.9,691.7 521.8,694.0C521.6,696.3 521.3,701.2 521.0,704.8C520.3,714.1 519.5,735.6 519.8,736.9C520.3,738.8 520.6,737.7 521.1,732.6ZM1061.5,625.7C1062.1,624.7 1062.2,622.5 1062.2,617.3C1062.2,608.9 1061.8,607.8 1056.8,601.8C1052.6,596.7 1050.9,593.1 1048.5,584.5C1047.2,579.7 1047.0,579.7 1047.2,584.0C1047.3,586.7 1047.9,589.5 1048.6,591.8C1050.7,597.7 1052.1,600.1 1056.7,605.2C1060.0,609.0 1061.3,613.6 1060.8,620.5C1060.6,623.2 1060.4,625.8 1060.2,626.2C1059.7,627.5 1060.8,627.1 1061.5,625.7ZM459.0,521.6C459.2,505.1 462.5,492.3 468.9,482.5C471.1,479.3 477.1,471.7 480.4,468.2C487.6,460.6 492.0,454.4 512.4,423.9C522.1,409.3 530.0,397.4 530.0,397.2C530.0,397.0 541.4,380.3 547.5,371.8C552.5,364.7 553.0,363.9 553.0,363.3C553.0,362.4 550.8,364.9 545.8,371.5C537.6,382.2 533.7,387.6 520.4,407.2C519.6,408.4 512.9,418.4 505.6,429.5C490.1,452.8 487.7,456.0 477.7,467.6C465.5,481.6 461.6,488.5 458.9,500.8C457.4,508.1 456.8,521.9 457.8,527.0C458.3,529.5 458.9,526.9 459.0,521.6ZM475.7,416.6C478.7,412.4 482.6,407.1 484.1,404.9C487.7,400.0 498.1,384.3 502.4,377.4C506.0,371.7 510.1,365.2 513.8,359.5C515.1,357.4 518.0,352.9 520.1,349.5C525.0,341.8 533.4,329.8 540.5,320.4C545.8,313.4 546.9,311.6 544.2,314.0C542.9,315.2 534.0,326.2 528.6,333.1C524.9,337.9 512.3,356.8 503.6,370.8C499.5,377.4 494.5,385.3 492.6,388.4C489.2,393.7 478.2,410.1 473.3,417.0C468.1,424.3 466.0,427.6 466.0,428.2C466.1,429.2 469.9,424.6 475.7,416.6ZM998.0,402.9C999.1,392.4 1000.5,386.4 1002.9,381.8C1004.9,377.8 1005.9,376.6 1011.3,372.5C1017.2,367.9 1019.2,365.8 1020.9,362.0C1022.1,359.6 1022.2,358.6 1022.2,353.8C1022.2,348.7 1022.1,348.0 1020.8,345.5C1017.1,338.3 1009.8,332.9 1002.3,331.7C998.6,331.2 999.6,332.4 1004.3,334.3C1011.0,336.9 1015.5,340.7 1018.3,346.1C1019.6,348.5 1019.7,349.2 1019.7,353.8C1019.7,357.9 1019.6,359.1 1018.6,361.0C1017.0,364.3 1014.4,367.2 1010.1,370.4C1001.5,376.6 998.8,381.6 997.2,393.1C996.4,399.3 996.3,408.0 996.9,408.0C997.2,408.0 997.6,405.7 998.0,402.9ZM124.7,318.9C127.0,317.3 127.8,316.1 129.1,313.0C130.6,309.1 130.6,301.4 129.0,297.4C127.8,294.1 124.9,291.3 122.2,290.8C118.7,290.1 114.5,292.4 114.5,295.1C114.5,296.2 115.9,296.3 116.3,295.2C116.7,294.1 119.4,292.9 120.5,293.3C121.3,293.5 121.5,294.0 121.5,295.5C121.5,297.1 121.1,297.9 118.7,300.5C115.1,304.5 114.0,306.9 114.0,310.6C114.0,314.3 114.8,316.3 117.2,318.4C119.5,320.4 122.3,320.6 124.7,318.9ZM119.1,316.7C116.6,315.0 115.8,310.2 117.2,306.7C117.7,305.7 119.2,303.6 120.6,302.1C122.0,300.5 123.5,298.5 123.8,297.6C124.2,296.7 124.7,296.0 125.0,296.0C125.3,296.0 126.0,297.0 126.6,298.1C127.5,299.9 127.7,301.0 127.7,304.8C127.7,310.4 126.6,313.8 124.2,316.0C122.3,317.7 120.8,317.9 119.1,316.7ZM136.0,297.7C136.0,296.4 135.7,294.4 135.4,293.3C134.7,291.0 130.7,286.5 129.3,286.5C128.1,286.5 128.3,287.1 130.2,288.6C131.9,290.0 134.2,294.7 134.7,298.1C135.2,300.8 136.0,300.5 136.0,297.7ZM362.5,296.8C362.2,296.5 362.0,295.8 362.0,295.1C362.0,294.5 361.8,293.6 361.5,293.1C361.3,292.6 360.6,290.6 360.0,288.5C359.4,286.4 358.6,283.9 358.2,282.8C357.7,281.6 356.5,278.1 355.5,274.9C352.7,266.5 347.4,252.3 344.7,246.0C344.2,245.0 343.7,243.8 343.5,243.2C343.3,242.7 342.6,241.2 342.0,239.9C341.5,238.6 341.0,237.4 341.0,237.3C341.0,236.9 337.4,229.2 332.2,218.8C321.6,197.0 305.5,170.4 305.5,174.4C305.5,174.6 307.5,178.2 309.9,182.3C317.7,195.5 321.9,203.3 328.5,216.4C334.4,228.2 338.0,235.7 338.0,236.2C338.0,236.3 338.9,238.4 340.0,240.8C341.2,243.3 342.4,245.9 342.7,246.8C343.8,249.0 347.0,256.9 348.2,260.2C348.9,261.9 350.3,265.6 351.5,268.5C352.7,271.4 353.8,274.3 354.0,275.0C354.2,275.7 355.6,279.5 357.0,283.5C358.4,287.5 359.7,291.2 359.8,291.8C360.1,292.8 360.4,293.7 361.4,296.0C361.7,296.7 362.1,297.7 362.3,298.2C362.6,299.2 362.7,299.2 362.9,298.3C363.0,297.8 362.8,297.1 362.5,296.8ZM586.5,270.3C583.0,269.4 578.4,268.1 576.2,267.3C571.1,265.5 562.0,260.7 555.7,256.5C550.6,253.0 532.5,239.6 514.2,225.5C494.9,210.7 472.0,194.2 453.2,181.6C445.8,176.7 432.4,168.0 432.2,168.0C432.1,168.0 431.0,167.4 429.8,166.6C427.4,164.9 421.0,161.0 420.7,161.0C420.6,161.0 419.0,160.0 417.1,158.8C415.3,157.6 409.8,154.3 405.0,151.5C395.9,146.2 366.7,128.8 361.0,125.4C348.6,117.9 324.7,108.2 297.0,99.5C292.5,98.1 286.8,96.3 284.5,95.5C282.2,94.7 277.6,93.3 274.4,92.3C268.6,90.4 268.4,90.3 267.4,88.4C266.9,87.3 266.6,86.3 266.7,86.1C266.9,85.9 269.9,85.9 273.4,85.9C278.0,86.0 281.2,86.4 284.8,87.3C287.6,88.0 290.8,88.5 292.0,88.5C295.4,88.5 303.7,89.9 310.0,91.6C316.9,93.4 318.2,93.8 324.8,96.4C327.5,97.5 332.9,99.1 336.9,99.9C355.8,104.0 375.5,112.8 391.2,124.0C395.9,127.3 399.1,129.0 403.6,130.5C405.3,131.1 407.4,131.9 408.2,132.3C409.1,132.6 410.5,133.2 411.5,133.5C424.1,138.2 440.5,147.7 449.5,155.6C453.1,158.7 459.0,163.0 459.7,163.0C459.8,163.0 462.4,164.5 465.3,166.3C474.8,172.1 480.7,176.8 491.0,186.8C496.1,191.7 499.1,194.2 503.2,196.8C516.1,204.8 527.6,214.7 536.6,225.5C541.2,230.9 542.5,232.2 547.9,236.1C556.5,242.3 559.4,244.7 567.1,252.0C576.7,261.2 582.1,265.3 588.8,268.6C591.6,270.0 593.8,271.4 593.7,271.6C593.4,272.1 593.8,272.2 586.5,270.3ZM192.5,249.7C193.5,249.0 195.7,248.1 197.3,247.7C201.6,246.5 202.8,245.8 204.9,242.6C207.7,238.5 210.2,234.0 209.8,233.7C209.3,233.2 208.5,234.1 205.7,238.0C201.8,243.6 198.5,246.0 194.6,246.0C194.0,246.0 192.9,246.9 191.8,248.2C189.2,251.4 189.4,251.8 192.5,249.7ZM218.8,180.2C221.1,179.4 222.0,178.6 228.8,171.4C230.3,169.8 231.5,168.9 235.5,166.4C236.6,165.6 237.9,164.1 239.0,161.9C241.3,157.7 241.9,156.9 245.6,155.0C249.7,152.8 252.3,150.4 253.3,147.8C254.1,145.5 254.1,143.2 253.2,143.3C253.0,143.4 252.5,144.5 252.1,145.7C251.3,148.5 249.1,150.7 245.3,152.7C241.3,154.8 239.3,156.7 238.0,159.4C236.0,163.6 232.6,166.4 230.1,165.8C229.3,165.6 227.3,164.7 225.5,163.8C220.2,161.0 215.8,159.8 212.8,160.2C209.6,160.7 207.3,161.7 205.3,163.8C203.5,165.7 202.6,167.6 201.0,172.9C200.4,174.8 199.5,176.8 198.9,177.3C197.2,178.9 197.8,179.2 202.1,179.3C204.5,179.3 207.3,179.6 208.8,180.1C212.1,181.2 215.8,181.2 218.8,180.2ZM211.0,177.2C208.0,175.9 207.0,174.6 207.0,172.1C207.0,169.2 207.7,168.1 210.2,167.0C215.2,164.7 222.0,166.9 222.0,170.9C222.0,173.1 220.0,175.9 217.7,177.0C215.1,178.2 213.4,178.2 211.0,177.2ZM203.4,176.7C203.2,176.5 203.4,175.8 203.9,175.1L204.7,173.9L205.6,175.0C206.1,175.6 206.5,176.3 206.5,176.6C206.5,177.1 203.8,177.2 203.4,176.7ZM215.2,172.7C216.2,171.7 215.8,171.0 214.2,171.0C213.5,171.0 212.5,170.7 212.0,170.4C211.5,170.1 210.9,169.9 210.7,170.1C210.2,170.7 211.0,172.3 212.1,172.9C213.7,173.7 214.3,173.6 215.2,172.7ZM224.0,171.0C224.0,169.3 224.2,169.0 225.0,169.0C226.1,169.0 226.3,169.9 225.4,171.7C224.6,173.6 224.0,173.3 224.0,171.0ZM223.3,165.7C221.6,163.9 212.7,163.0 209.8,164.2C207.5,165.1 206.8,165.2 207.3,164.4C207.9,163.4 211.8,162.0 214.0,162.0C217.3,162.0 224.5,164.4 224.5,165.6C224.5,166.1 223.8,166.1 223.3,165.7ZM198.7,156.0C201.5,150.7 207.2,147.0 213.2,146.6C216.4,146.4 219.8,146.8 222.9,147.8C224.8,148.4 224.1,147.1 221.9,145.9C220.1,145.0 218.9,144.8 215.0,144.8C211.0,144.8 209.9,144.9 207.9,145.9C206.5,146.6 205.3,147.0 205.2,146.8C205.0,146.6 205.5,144.4 206.3,141.9C207.8,137.0 208.5,132.1 207.6,132.7C207.4,132.8 206.6,134.6 206.0,136.6C203.4,145.2 202.3,148.2 200.9,149.9C198.6,152.8 197.1,155.6 196.8,157.8C196.5,160.0 196.8,159.7 198.7,156.0ZM194.5,126.2C194.5,124.8 197.5,118.7 200.3,114.4C203.1,110.2 212.3,100.8 218.5,95.8C222.5,92.7 230.8,88.0 232.6,88.0C233.0,88.0 233.7,88.9 234.2,90.1C235.2,92.2 234.9,93.0 233.0,93.0C231.8,93.0 224.6,96.9 221.2,99.3C218.6,101.1 213.1,106.7 204.7,116.0C203.6,117.2 201.0,120.0 199.0,122.2C197.0,124.5 195.1,126.5 194.9,126.7C194.7,127.0 194.5,126.8 194.5,126.2ZM214.2,95.1C210.9,92.8 206.0,81.3 204.5,72.2C203.7,67.4 203.1,65.2 200.9,57.8C199.9,54.2 199.0,51.0 199.0,50.6C199.0,49.3 199.9,50.1 201.6,53.1C204.3,57.8 208.2,61.8 217.2,68.9C225.5,75.6 229.4,79.3 231.5,82.7C232.8,84.9 232.5,85.5 229.1,86.5C226.3,87.2 220.7,90.6 217.4,93.4C216.0,94.5 214.9,95.5 214.8,95.5C214.8,95.5 214.5,95.3 214.2,95.1Z"
		},
		av: {
			w: 1086,
			h: 1448,
			d: "M446.5,1358.0C461.1,1356.9 472.5,1354.1 478.2,1350.3C481.6,1347.9 483.0,1345.7 483.0,1342.5C483.0,1339.7 482.9,1339.2 477.0,1314.2C476.3,1311.0 475.5,1306.6 475.3,1304.5C474.8,1298.8 473.1,1294.0 469.5,1288.8C466.5,1284.3 463.9,1278.6 462.6,1273.8C460.3,1265.2 459.9,1261.6 460.1,1253.2C460.3,1244.7 460.8,1242.4 463.5,1237.2L464.8,1234.8L470.0,1235.0C477.9,1235.4 488.8,1235.1 492.5,1234.5C497.5,1233.6 504.0,1232.0 506.5,1230.9C510.9,1229.0 514.0,1225.7 514.0,1223.0C514.0,1221.8 510.3,1206.4 508.7,1201.2C508.3,1199.9 507.8,1197.1 507.5,1195.2C507.1,1191.2 505.5,1187.4 502.5,1182.7C499.6,1178.3 497.7,1172.7 497.0,1166.5C496.2,1159.2 496.7,1156.2 500.2,1149.2C503.6,1142.6 504.5,1139.2 504.5,1133.5C504.5,1129.1 504.2,1127.7 500.5,1114.0C498.4,1106.3 497.5,1096.8 497.2,1079.5C496.6,1050.9 499.5,1003.5 503.5,977.1C504.7,969.8 505.3,967.6 507.4,963.8C511.5,956.7 513.2,948.0 512.8,937.8C512.5,932.4 512.7,929.8 513.3,926.8C514.2,921.9 514.3,911.2 513.5,907.7C512.9,905.3 511.7,902.5 507.6,893.2C503.2,883.2 500.2,871.5 498.7,858.0C497.7,848.5 497.9,822.8 499.1,821.7C500.4,820.6 521.3,811.5 524.5,810.8C539.9,807.2 559.2,808.3 569.1,813.3C570.3,813.9 574.8,815.9 579.1,817.8C583.3,819.6 587.0,821.3 587.3,821.7C588.3,822.6 588.7,842.2 588.0,852.5C586.8,870.4 584.3,880.9 577.3,896.5C575.8,899.9 574.2,904.0 573.8,905.5C572.4,909.8 572.2,917.3 573.3,924.0C573.8,927.9 574.2,933.2 574.2,940.2C574.3,950.1 574.4,951.0 575.6,955.1C576.4,957.6 578.0,961.5 579.2,963.9C580.4,966.4 581.7,969.7 582.0,971.3C583.9,982.1 586.3,1003.6 588.0,1025.8C589.7,1047.2 590.0,1080.4 588.7,1096.2C587.9,1105.9 587.0,1111.2 584.5,1120.2C581.8,1129.8 581.3,1135.3 582.8,1140.7C583.2,1142.3 584.9,1146.3 586.6,1149.6L589.8,1155.6L589.7,1161.9C589.6,1171.4 588.0,1176.8 582.5,1185.5C580.4,1188.9 579.0,1192.7 579.0,1195.2C579.0,1196.1 577.8,1201.7 576.2,1207.8C572.9,1220.9 572.6,1223.7 573.7,1225.9C575.6,1229.6 581.7,1232.3 592.8,1234.3C596.7,1235.1 612.5,1235.5 618.8,1235.0L621.8,1234.8L623.1,1237.3C625.6,1241.7 627.0,1247.9 627.0,1253.9C627.0,1262.6 623.9,1277.1 621.0,1282.2C620.5,1283.1 618.8,1286.0 617.2,1288.7C612.6,1296.7 611.1,1301.1 611.0,1306.4C611.0,1307.6 610.8,1309.4 610.5,1310.4C609.7,1313.5 606.7,1326.2 605.4,1332.0C605.2,1333.2 604.7,1335.0 604.5,1336.0C603.7,1339.3 603.4,1342.5 603.7,1344.3C605.7,1354.7 636.8,1361.0 668.4,1357.2C683.7,1355.4 693.6,1351.6 696.3,1346.5C697.1,1344.8 697.2,1341.7 696.5,1339.1C696.3,1338.1 695.7,1335.8 695.2,1334.0C694.8,1332.2 693.9,1328.6 693.2,1326.0C692.5,1323.4 691.1,1318.2 690.2,1314.5C689.2,1310.8 688.3,1306.8 688.2,1305.8C687.6,1300.0 685.0,1292.8 681.6,1287.9C675.5,1279.0 671.7,1267.3 670.6,1254.2C669.9,1246.0 670.5,1241.6 673.4,1234.0C677.6,1223.4 678.3,1218.7 677.2,1210.0C676.4,1203.6 676.5,1203.9 672.8,1191.2C671.9,1188.0 670.9,1183.3 670.6,1181.0C668.0,1160.5 666.8,1136.1 666.8,1102.2C666.8,1070.0 667.4,1063.5 671.4,1053.8C675.8,1042.7 677.3,1033.4 676.8,1020.3C676.6,1013.8 676.7,1010.6 677.2,1006.8C678.2,1000.6 678.2,995.5 677.3,989.2C676.5,984.3 675.0,977.9 674.0,975.2C672.4,971.2 671.9,968.2 671.7,961.2C671.3,950.0 672.5,937.6 676.5,913.5C676.7,912.0 677.2,909.0 677.5,906.8C677.8,904.5 678.3,901.9 678.5,900.8C678.7,899.6 679.2,897.1 679.5,895.0C679.8,892.9 680.3,890.1 680.5,888.8C680.8,887.4 681.2,884.5 681.5,882.2C682.1,878.5 683.0,872.9 684.0,867.2C685.0,861.4 685.6,858.8 686.1,857.6C688.5,851.4 692.5,839.7 693.8,835.2C695.2,830.1 696.4,824.6 697.0,820.5C698.4,811.5 699.0,803.9 699.0,795.9C699.0,790.6 699.2,786.9 699.5,786.8C700.6,786.1 710.6,772.3 714.3,766.2C727.6,744.9 735.3,724.3 739.4,699.8C741.7,686.5 742.2,677.8 741.8,659.5C741.3,628.9 736.4,603.5 725.7,576.5C723.1,569.9 722.2,566.5 720.8,559.8C717.2,541.8 712.4,527.7 704.3,511.8C699.8,503.0 697.0,498.2 692.2,491.5C680.6,475.2 665.6,460.2 648.6,447.8L640.5,441.8L636.9,435.9C633.4,429.9 632.8,428.4 632.0,424.1C631.4,420.3 629.0,409.1 627.7,403.5C625.1,392.4 623.6,385.9 622.5,380.2C622.2,378.6 621.7,376.6 621.5,375.8C621.3,374.9 620.8,372.9 620.5,371.2C620.2,369.6 619.7,367.6 619.5,366.8C619.3,365.9 618.9,363.9 618.6,362.2C618.3,360.6 617.6,357.0 617.1,354.2C616.5,351.5 615.8,347.6 615.5,345.5C615.2,343.4 614.7,340.7 614.5,339.5C614.1,337.2 613.8,335.7 612.9,329.0C612.2,323.2 611.6,317.5 610.7,308.0L610.0,299.3L611.3,294.2C615.7,276.4 617.0,251.8 615.0,224.9C614.2,215.5 614.6,211.8 616.8,205.2C617.5,203.2 618.0,201.1 618.0,200.5C618.0,199.5 618.6,199.1 621.7,198.2C623.8,197.6 623.9,196.4 622.0,195.3C620.6,194.5 620.5,194.2 620.8,192.8C621.4,190.3 621.1,183.9 620.3,181.1C619.9,179.7 618.5,176.5 617.3,174.1C615.3,170.2 615.0,169.3 615.0,166.4C615.0,163.4 613.9,153.8 613.2,151.0C612.3,147.4 610.7,142.8 609.0,139.4L607.1,135.6L606.9,123.9L606.8,112.2L609.6,107.6C616.0,97.1 618.6,87.0 618.6,73.0C618.5,60.0 615.0,47.5 609.0,38.4C606.2,34.3 604.2,32.1 601.9,31.0C599.6,29.8 599.1,29.8 597.1,30.8C595.3,31.7 593.9,34.0 593.0,37.5C591.8,42.2 589.7,46.4 585.4,53.1C577.6,65.2 576.0,69.8 574.5,83.5C574.1,87.9 572.4,93.5 571.5,93.5C571.3,93.5 570.9,93.2 570.6,92.8C570.3,92.5 568.2,91.3 566.0,90.3C562.6,88.7 561.3,88.4 557.6,88.2C554.7,88.0 552.6,87.6 551.5,87.0C545.7,84.0 535.8,84.5 525.8,88.3C522.1,89.6 517.4,92.1 515.9,93.4C515.3,93.9 514.8,94.0 514.5,93.7C513.4,92.6 512.1,87.8 511.5,83.2C510.7,75.3 510.0,71.6 508.7,68.0C507.3,63.6 506.7,62.5 501.2,53.9C496.0,45.8 494.9,43.7 493.3,38.0C491.9,33.3 491.0,31.8 489.0,30.7C487.7,30.1 487.1,30.1 485.8,30.5C481.4,31.9 475.2,40.2 471.5,49.5C469.1,55.5 467.0,67.0 467.0,73.7C467.0,77.6 468.2,87.2 469.3,91.5C470.5,96.3 473.4,102.7 476.7,107.7L479.6,112.1L479.7,116.7C479.7,119.2 479.5,124.5 479.3,128.5L478.9,135.8L476.2,140.2C473.5,144.9 470.9,150.2 469.1,155.0C468.6,156.5 467.7,158.7 467.3,160.0C466.8,161.2 465.6,165.6 464.5,169.7C463.4,173.9 462.2,178.4 461.8,179.8C461.4,181.1 460.9,183.3 460.7,184.6C460.2,188.1 461.4,187.7 463.5,183.7C465.1,180.8 467.0,178.3 467.0,179.2C467.0,179.4 466.6,180.8 466.2,182.4C465.6,184.3 465.4,186.4 465.6,189.6C465.8,194.0 465.8,194.1 464.4,195.1C462.2,196.6 462.6,197.8 465.4,198.5C467.5,199.1 467.9,199.3 468.3,200.9C468.6,201.9 469.5,204.8 470.3,207.2C472.0,212.6 472.1,216.8 471.1,232.2C470.3,242.7 470.6,265.4 471.5,272.2C471.8,274.4 472.3,278.2 472.6,280.5C472.9,282.8 473.9,288.0 474.8,292.0C476.4,298.4 476.5,299.6 476.3,303.5C475.6,312.2 473.5,329.7 472.1,338.8C471.8,340.4 471.3,343.2 471.1,345.0C470.4,349.6 467.6,364.1 466.7,368.0C465.9,371.3 465.4,373.8 464.5,377.8C464.2,379.0 463.8,381.0 463.5,382.2C463.2,383.5 462.8,385.5 462.5,386.8C461.2,392.4 460.9,393.9 460.5,395.5C459.1,400.8 456.8,411.6 455.2,419.6C453.4,429.3 453.1,430.1 450.6,434.2C449.3,436.2 447.7,438.9 446.9,440.1C446.1,441.5 444.5,443.1 442.4,444.5C432.2,451.4 425.4,457.1 414.8,467.5C408.5,473.7 399.9,483.3 396.8,487.7C392.1,494.4 390.8,496.3 387.5,501.8C383.1,509.0 378.4,518.7 375.0,527.2C373.2,531.8 372.7,533.2 370.6,540.2C368.0,548.9 367.5,550.5 365.5,560.3C364.0,568.0 363.1,571.0 361.2,575.3C354.4,590.9 349.1,612.3 346.3,635.0C343.6,656.7 344.0,682.5 347.3,702.0C350.0,717.6 356.1,736.3 363.6,751.1C368.6,761.1 377.7,775.4 384.3,783.6L387.5,787.5L387.7,799.4C387.9,809.5 388.5,816.0 389.7,822.0C390.8,827.7 391.3,829.9 392.6,834.5C394.1,839.7 396.7,847.8 397.5,849.8C399.7,855.0 401.3,860.4 402.5,866.5C402.8,868.3 403.3,870.8 403.5,872.0C403.7,873.2 404.2,876.0 404.5,878.2C404.8,880.5 405.5,884.6 406.0,887.5C407.0,893.1 407.6,897.0 408.5,903.0C408.8,905.1 409.2,908.1 409.5,909.8C410.0,912.9 411.7,923.9 412.5,929.5C412.7,931.3 413.2,934.9 413.5,937.5C413.8,940.1 414.3,943.9 414.6,946.0C414.9,948.1 415.1,953.4 415.1,957.8C415.1,965.4 414.8,968.0 413.0,974.1C409.1,987.9 408.8,989.8 409.2,999.2C409.3,1003.4 409.7,1013.6 409.9,1022.0C410.3,1034.3 410.6,1038.1 411.4,1041.8C412.5,1046.8 414.5,1052.8 416.3,1056.9C419.0,1063.0 420.0,1075.1 420.0,1102.0C420.0,1142.2 417.4,1179.0 413.7,1191.8C410.7,1202.3 410.2,1204.3 409.5,1208.9C408.3,1216.9 409.6,1225.6 413.2,1234.2C415.8,1240.4 416.2,1242.2 416.2,1249.2C416.2,1256.0 415.8,1259.2 413.7,1267.9C411.8,1275.9 411.3,1277.1 405.7,1286.8C402.0,1293.2 400.7,1295.6 399.7,1298.2C399.5,1298.8 399.1,1301.3 398.7,1303.8C398.2,1307.6 396.2,1316.2 393.2,1326.8C392.8,1328.4 392.2,1330.6 392.0,1331.6C391.7,1332.7 391.3,1334.5 391.0,1335.6C390.7,1336.8 390.3,1339.5 390.2,1341.8C390.0,1345.1 390.1,1346.0 391.0,1347.4C395.6,1354.7 422.2,1359.8 446.5,1358.0ZM424.3,1354.0C410.5,1353.0 398.0,1349.5 394.6,1345.6C393.5,1344.5 393.4,1344.0 393.7,1341.7C393.9,1339.6 398.1,1322.6 401.2,1311.1C402.0,1308.1 402.2,1307.8 405.8,1306.8C423.5,1301.7 451.2,1301.8 468.2,1307.2C472.3,1308.5 471.5,1306.8 475.0,1321.7C478.2,1335.1 479.5,1342.1 479.2,1343.5C478.7,1345.4 477.6,1346.4 473.9,1348.3C470.6,1350.0 463.8,1351.9 457.8,1353.0C449.9,1354.3 435.1,1354.7 424.3,1354.0ZM638.5,1354.0C628.3,1353.2 617.7,1350.9 612.6,1348.3C610.2,1347.1 607.0,1344.0 607.0,1343.0C607.0,1342.7 607.2,1341.4 607.5,1340.1C607.8,1338.8 608.2,1336.7 608.5,1335.5C608.8,1334.3 609.8,1329.9 610.8,1325.8C611.7,1321.6 612.9,1316.8 613.3,1315.0C614.9,1307.9 614.8,1308.1 617.4,1307.3C621.7,1305.9 626.8,1304.9 636.0,1303.7C649.6,1302.0 670.6,1303.5 680.7,1306.9C684.3,1308.1 684.7,1308.4 685.1,1309.8C685.3,1310.6 686.0,1312.9 686.6,1315.0C687.1,1317.1 687.8,1319.5 688.0,1320.5C688.2,1321.5 689.2,1325.4 690.2,1329.2C693.8,1343.5 693.8,1343.8 692.0,1345.8C687.6,1350.4 672.3,1353.7 653.0,1354.2C648.2,1354.3 641.7,1354.2 638.5,1354.0ZM468.2,1304.2C456.2,1299.8 428.6,1298.7 413.8,1302.0C412.6,1302.2 411.0,1302.6 410.0,1302.8C409.0,1303.0 407.1,1303.4 405.6,1303.9C404.1,1304.3 402.8,1304.5 402.7,1304.4C402.2,1303.9 403.6,1298.6 404.9,1295.7C405.7,1294.0 407.7,1290.6 409.4,1288.0C414.6,1280.0 418.1,1269.6 419.7,1257.6C421.1,1246.8 420.6,1241.9 417.1,1233.2C414.3,1226.3 413.5,1223.1 413.1,1217.2C412.8,1211.1 413.3,1208.4 416.8,1196.0C419.7,1185.6 420.6,1180.0 421.7,1166.2C423.3,1146.5 423.7,1132.6 423.7,1105.5C423.8,1071.6 423.1,1063.4 419.8,1054.8C415.0,1042.4 414.0,1037.2 414.0,1025.3C414.0,1016.1 414.1,1016.1 416.3,1019.8C417.6,1021.9 417.5,1019.8 416.3,1016.7C413.9,1010.8 413.0,1005.6 413.0,998.4C413.0,990.2 413.9,984.5 416.5,976.6C419.9,966.0 420.2,957.0 417.7,938.0C415.8,923.6 412.7,903.7 410.4,890.5C409.3,884.1 408.3,878.1 408.1,877.2C408.0,876.2 408.0,875.9 408.4,876.2C408.9,876.7 413.0,888.8 414.5,894.0C414.8,895.2 415.5,897.1 416.1,898.2L417.0,900.2L416.8,897.8C416.6,896.4 416.1,893.7 415.7,891.9C415.0,888.9 406.0,862.1 399.5,843.3C397.6,837.6 395.9,831.6 394.6,825.5C394.2,824.0 393.7,821.9 393.5,820.8C392.2,815.2 391.8,807.8 391.8,795.0C391.8,781.3 392.1,776.5 393.9,768.0C394.3,765.9 394.7,763.7 394.9,763.0C395.9,757.5 399.8,747.5 403.5,740.9C404.8,738.5 405.7,736.5 405.5,736.5C403.7,736.5 393.0,755.6 393.0,758.8C393.0,760.5 391.7,759.0 390.4,755.7C387.9,749.8 384.6,739.5 383.8,735.2C383.6,734.4 383.3,732.6 383.0,731.2C379.0,712.7 379.0,691.3 383.0,658.5C384.5,646.1 385.0,638.3 385.0,626.5C385.0,602.6 386.5,587.3 391.0,565.8C391.9,561.7 394.3,553.1 396.8,545.7C401.3,531.8 414.1,505.9 422.1,494.4C423.7,492.0 422.2,492.9 419.8,495.6C413.3,502.9 402.0,523.0 397.0,535.8C391.8,549.2 391.0,551.8 388.5,562.2C383.6,582.9 383.1,587.5 382.5,612.8C382.2,624.0 381.7,636.7 381.3,641.0C380.6,648.3 380.2,651.1 379.0,661.0C378.7,663.2 378.3,666.9 378.0,669.1C375.2,691.4 375.3,711.2 378.2,727.8C379.9,737.0 384.3,752.4 385.7,753.8C385.9,754.0 386.0,754.5 386.0,754.9C386.0,755.2 386.6,757.0 387.4,758.7C390.6,765.4 390.5,765.1 390.0,768.0C389.7,769.5 389.3,773.0 388.9,775.8C388.6,778.5 388.2,780.9 388.0,781.1C387.6,781.7 384.1,777.2 378.6,769.0C373.3,760.9 372.9,760.4 368.0,750.8C362.6,740.2 357.6,727.4 354.8,717.0C346.0,684.3 346.5,643.5 356.2,603.2C359.4,590.3 365.1,574.6 372.4,559.0C376.7,549.7 379.5,544.2 383.3,537.6C385.6,533.7 387.5,530.4 387.5,530.2C387.5,528.1 376.3,545.2 372.4,553.1C371.8,554.4 371.1,555.5 370.9,555.5C370.5,555.5 370.7,553.8 371.3,552.0C371.5,551.6 372.0,549.7 372.5,547.7C373.5,544.0 375.9,536.7 377.2,533.0C377.7,531.8 378.5,529.5 379.1,528.0C387.6,504.6 404.2,481.4 426.6,461.7C433.3,455.9 440.4,450.2 440.7,450.6C440.8,450.7 438.8,454.9 436.3,460.0C431.7,469.4 425.9,483.6 425.2,487.2C424.9,489.0 425.0,489.2 425.7,488.5C426.1,488.1 427.5,485.3 428.8,482.2C430.0,479.2 431.5,476.1 432.0,475.2C432.5,474.4 434.3,470.9 436.0,467.5C437.8,464.1 440.3,459.4 441.6,457.1C442.9,454.8 444.0,452.8 444.0,452.7C444.0,452.6 449.9,442.4 451.4,440.0C452.3,438.5 452.4,439.9 451.8,444.5C449.4,460.7 449.3,486.4 451.7,495.7C452.6,499.2 452.9,497.5 452.4,492.2C451.9,487.1 452.2,466.0 452.9,459.2C453.8,451.0 454.5,445.8 455.0,442.8C455.5,439.6 457.3,429.3 457.8,426.8C458.3,424.4 459.6,417.9 460.0,416.0C460.2,415.0 460.8,412.4 461.2,410.2C462.0,406.4 462.9,402.6 465.1,393.5C466.1,389.0 466.8,386.2 467.5,382.6C467.8,381.5 468.2,379.5 468.5,378.4C472.3,361.4 475.5,343.0 477.5,327.0C478.8,316.3 479.0,314.1 479.0,310.9C479.0,309.0 479.2,307.5 479.4,307.5C479.6,307.5 480.3,308.7 481.0,310.1C482.8,314.1 486.5,319.5 489.9,322.8L492.9,325.8L494.9,333.3C496.1,337.4 497.3,342.6 497.7,344.7L498.5,348.5L496.7,355.1C492.9,369.5 494.0,379.7 500.7,389.9C502.6,392.9 503.7,395.1 504.3,397.7C507.6,411.4 511.1,417.6 518.3,422.4C525.5,427.3 532.4,428.8 545.5,428.3C559.0,427.9 565.3,425.7 572.0,419.0C577.0,414.1 578.9,410.2 582.2,398.0C583.0,395.1 584.1,392.6 585.7,390.1C588.8,385.3 590.3,381.6 591.2,376.2C592.6,368.6 592.2,363.6 589.4,354.0C587.6,347.6 587.8,346.2 591.8,331.8C593.4,326.2 593.6,325.8 596.1,323.3C599.8,319.7 604.2,313.5 605.3,310.5C606.2,307.9 607.2,307.4 607.3,309.5C607.7,316.3 608.3,322.9 609.5,331.0C609.7,332.8 610.2,336.2 610.5,338.5C611.0,342.4 612.8,352.0 616.6,371.8C617.4,376.1 618.9,383.0 619.8,387.0C620.8,391.0 621.7,395.1 622.0,396.2C622.2,397.4 623.6,403.4 625.0,409.8C628.7,426.3 630.7,436.9 632.0,447.8C634.0,463.8 634.2,466.6 634.1,481.5C634.1,489.9 634.2,496.4 634.5,496.0C637.0,491.2 636.8,455.8 634.2,440.5L633.9,438.8L635.0,440.0C636.2,441.4 639.8,447.5 643.4,454.0C644.6,456.3 646.6,460.0 647.8,462.0C651.3,468.5 656.3,478.5 658.5,483.8C660.7,489.0 662.0,491.0 662.0,489.3C662.0,486.6 654.4,468.1 649.1,457.9C647.1,454.1 645.5,450.9 645.5,450.8C645.5,449.8 647.6,451.3 655.2,457.7C677.1,476.1 691.3,494.0 702.7,517.2C707.9,527.9 710.8,535.8 714.5,550.0C715.8,555.1 715.9,555.5 715.0,554.7C714.4,554.2 714.0,553.6 714.0,553.3C714.0,551.8 701.6,532.2 699.3,530.0C697.5,528.4 697.7,529.0 700.1,532.9C706.5,543.4 713.2,556.4 717.7,567.2C718.8,569.7 720.1,572.8 720.6,574.0C722.4,578.2 727.0,591.2 728.5,596.2C735.4,620.3 738.4,644.0 737.8,670.2C737.5,689.2 736.3,698.3 732.2,714.2C729.6,724.4 727.7,730.5 725.0,736.6C723.8,739.2 722.4,742.4 721.9,743.8C720.8,746.3 716.9,754.0 713.6,760.0C709.9,766.8 699.6,781.0 698.4,781.0C698.2,781.0 698.0,780.1 698.0,779.0C698.0,777.9 697.8,776.0 697.5,774.6C695.8,765.3 695.8,765.5 697.3,762.2C698.0,760.6 699.1,758.1 699.8,756.7C701.7,752.5 704.8,742.6 706.5,735.8C707.3,732.2 708.1,728.8 708.3,728.2C708.8,726.0 710.0,715.7 710.5,708.2C711.0,702.1 711.0,698.1 710.5,691.4C709.8,679.7 709.1,672.3 708.2,666.0C705.2,645.6 704.0,630.5 704.0,612.2C704.0,592.1 702.6,580.1 698.0,561.5C696.3,554.3 693.6,546.3 690.0,537.2C685.5,525.9 683.0,520.8 677.0,510.3C673.0,503.1 663.5,491.2 663.5,493.2C663.5,493.4 664.8,495.5 666.5,498.0C680.5,519.3 692.4,549.0 697.2,574.5C700.1,590.0 701.0,599.9 701.0,618.5C701.0,632.6 701.6,643.6 703.0,656.0C704.4,668.6 705.0,674.2 705.6,678.5C706.5,685.0 706.5,712.9 705.6,718.5C705.2,720.8 704.7,724.2 704.5,726.0C703.7,731.3 703.0,734.5 701.0,741.8C699.8,746.4 695.3,758.8 694.5,759.7C694.3,759.9 693.9,759.3 693.5,758.4C693.2,757.5 692.7,756.3 692.5,755.8C690.3,750.0 684.3,739.8 681.7,737.5C680.4,736.3 680.4,736.4 682.2,739.5C686.6,747.1 690.7,757.3 692.0,763.8C694.3,775.2 695.0,782.0 695.0,794.8C695.0,814.1 692.8,826.4 686.1,845.8C685.2,848.5 684.0,852.0 683.5,853.5C683.0,855.0 680.4,862.5 677.8,870.2C672.3,886.2 668.9,898.2 669.1,900.6C669.2,902.1 669.3,902.0 670.2,899.2C672.5,891.8 677.6,876.6 678.0,876.0C678.9,874.6 679.0,875.9 678.3,879.1C677.5,882.3 673.1,908.8 670.8,924.2C668.4,940.3 667.4,949.9 667.4,958.5L667.4,966.8L670.2,976.2C671.7,981.5 673.2,987.7 673.5,990.0C674.7,999.8 673.7,1008.8 670.7,1015.9C669.7,1018.2 669.0,1020.2 669.2,1020.3C669.3,1020.5 670.1,1019.7 670.9,1018.6C671.7,1017.4 672.5,1016.6 672.6,1016.7C673.0,1017.2 672.6,1032.6 672.0,1036.4C671.3,1041.6 669.6,1047.7 666.9,1054.5C664.3,1061.3 663.7,1065.9 663.0,1086.0C662.1,1110.5 663.6,1156.1 665.8,1175.4C666.7,1183.0 667.7,1188.3 669.9,1195.8C672.2,1203.4 672.9,1206.4 673.5,1210.8C674.1,1216.2 673.1,1223.8 671.0,1229.5C670.1,1231.8 668.9,1235.3 668.1,1237.2C665.4,1244.5 666.1,1258.4 669.8,1271.2C671.8,1278.1 673.9,1283.0 677.8,1289.0C681.3,1294.7 683.6,1299.6 683.9,1302.3C684.1,1304.4 684.1,1304.6 683.2,1304.3C667.2,1299.7 647.4,1298.7 629.2,1301.6C626.3,1302.0 619.4,1303.7 615.8,1304.9C615.0,1305.1 614.9,1304.9 615.2,1302.9C615.8,1299.3 617.3,1295.7 619.8,1291.6C624.1,1284.6 625.5,1281.8 627.0,1277.1C630.8,1265.3 631.9,1252.2 629.7,1243.7C629.3,1242.2 627.9,1238.6 626.5,1235.8C622.0,1226.3 620.8,1222.1 620.8,1214.8C620.8,1209.4 621.2,1207.5 623.8,1198.5C625.3,1193.3 626.3,1189.2 627.5,1183.8C628.0,1181.2 628.9,1172.9 629.5,1163.4C631.0,1141.4 629.0,1104.2 624.7,1075.5C622.5,1060.7 622.2,1059.4 620.5,1056.5C615.0,1047.2 612.4,1037.4 611.7,1023.4C611.3,1016.0 611.6,1015.2 613.4,1018.2C614.0,1019.2 614.7,1020.0 615.0,1020.0C615.4,1020.0 614.5,1017.0 612.7,1013.2C611.5,1010.6 610.4,1006.4 609.7,1001.5C608.2,991.0 609.2,984.2 613.8,974.2C619.4,961.9 624.0,936.7 624.0,918.3C624.0,914.9 623.8,912.5 623.6,912.8C623.3,913.0 622.9,916.0 622.6,919.2C621.6,928.7 621.0,934.6 620.7,936.0C620.4,937.2 620.4,937.2 620.0,936.2C619.8,935.7 619.5,933.0 619.3,930.2C618.8,922.8 618.2,916.4 616.5,901.4C615.7,894.5 614.3,884.0 613.5,878.2C613.3,876.6 612.8,873.5 612.5,871.2C612.2,869.0 611.7,866.2 611.5,865.0C611.3,863.8 610.8,861.2 610.5,859.2C609.0,850.6 605.5,839.6 601.7,831.2C600.7,828.9 597.5,820.5 596.4,817.2C593.8,809.2 593.3,797.4 595.3,790.0C596.7,784.8 599.7,777.8 602.3,773.9C604.5,770.6 611.7,762.9 615.2,760.1C617.7,758.0 616.1,758.3 612.7,760.5C606.2,764.7 599.6,772.3 595.9,779.8C594.3,782.9 592.7,787.8 592.0,791.9C591.1,796.5 591.6,809.6 593.0,815.5C593.5,818.0 593.9,820.3 593.8,820.4C593.7,820.5 592.4,819.9 590.9,819.1C589.5,818.2 584.1,815.7 579.1,813.5C566.7,808.1 563.3,806.3 559.5,803.5C553.2,798.8 549.6,794.2 547.3,788.1C545.0,781.5 544.8,780.3 544.7,765.8C544.3,723.4 543.8,699.1 543.5,698.3C542.7,696.1 542.4,705.7 542.0,741.0C541.7,761.2 541.3,779.2 541.1,781.0C539.8,788.9 536.5,795.5 531.4,800.3C527.3,804.1 523.1,806.5 513.5,810.7C509.2,812.6 502.8,815.6 499.1,817.3C495.4,819.1 492.3,820.5 492.2,820.4C492.1,820.2 492.2,819.6 492.4,818.9C494.9,812.4 495.5,796.2 493.6,788.3C490.9,777.5 484.9,768.8 475.2,761.6C472.0,759.2 470.4,758.5 470.5,759.4C470.6,759.6 472.2,761.1 474.2,762.8C479.0,766.9 484.6,773.8 486.9,778.7C493.8,792.8 494.3,804.3 488.6,821.8C487.6,824.7 484.1,833.9 482.7,836.8C482.0,838.4 479.9,843.9 478.7,847.4C477.7,850.1 476.8,854.5 475.5,862.0C473.8,871.7 471.7,886.5 470.5,897.8C470.2,900.5 469.7,904.5 469.5,906.8C469.2,909.0 468.8,913.5 468.5,916.8C468.2,920.0 467.8,924.8 467.5,927.3C467.2,929.9 467.0,933.2 467.0,934.7C467.0,938.1 466.3,938.4 465.8,935.1C465.7,933.8 465.3,931.0 465.0,928.8C464.7,926.5 464.3,922.2 464.0,919.1C463.8,915.8 463.3,913.1 463.0,912.8C462.5,912.4 462.4,914.2 462.7,921.5C463.1,933.9 464.4,944.7 466.5,953.8C466.7,954.9 467.3,957.3 467.8,959.2C469.0,964.7 471.2,970.8 473.5,975.7C474.7,978.2 475.9,981.3 476.3,982.7C477.9,988.7 477.6,1000.5 475.7,1007.8C475.3,1009.4 473.8,1013.0 472.5,1015.7C471.2,1018.5 470.1,1020.8 470.2,1020.9C470.4,1021.0 472.2,1019.1 474.0,1017.0L475.0,1015.8L475.0,1020.5C475.0,1026.4 473.9,1036.0 472.5,1041.1C471.4,1045.3 468.9,1052.1 467.7,1053.9C465.6,1057.2 464.4,1059.9 463.9,1062.4C463.6,1064.0 463.2,1066.4 462.9,1067.8C461.5,1075.1 460.2,1085.6 459.0,1098.2C457.0,1119.2 456.8,1124.3 456.8,1145.0C456.8,1174.7 457.6,1181.4 463.5,1200.8C466.0,1209.1 466.5,1215.0 465.3,1221.2C464.4,1225.9 463.4,1228.6 460.2,1235.5C456.7,1243.1 456.5,1244.1 456.1,1251.9C455.8,1259.3 456.4,1264.3 458.3,1272.0C460.2,1280.0 461.8,1283.8 465.6,1289.3C467.6,1292.3 470.3,1297.9 470.9,1300.2C472.1,1304.9 472.1,1305.0 471.1,1304.9C470.6,1304.9 469.4,1304.6 468.2,1304.2ZM468.9,1231.6C466.8,1231.4 466.7,1231.2 467.8,1228.1C468.2,1226.8 468.9,1223.5 469.3,1220.6C470.2,1214.1 469.6,1207.9 467.4,1200.1C466.4,1196.5 466.1,1194.7 466.4,1194.4C467.4,1193.4 487.0,1193.6 492.8,1194.6C498.6,1195.6 503.6,1196.9 504.2,1197.5C504.8,1198.1 510.5,1221.0 510.5,1222.8C510.5,1226.3 503.5,1229.4 491.2,1231.3C487.1,1231.9 473.6,1232.1 468.9,1231.6ZM595.8,1231.4C584.5,1229.8 577.0,1226.7 576.3,1223.4C576.1,1222.8 577.4,1216.6 579.1,1209.8L582.2,1197.3L584.2,1196.6C590.6,1194.5 605.2,1193.1 614.6,1193.7C620.7,1194.1 621.4,1194.4 620.5,1195.9C618.9,1199.0 617.4,1206.9 617.2,1213.5C616.9,1220.3 617.3,1222.4 619.7,1230.3C620.0,1231.2 619.8,1231.4 618.2,1231.7C615.4,1232.1 599.3,1232.0 595.8,1231.4ZM502.0,1194.0C501.6,1193.8 499.0,1193.1 496.2,1192.5C490.4,1191.3 475.8,1190.6 469.4,1191.4C466.3,1191.7 465.4,1191.7 464.9,1191.1C463.1,1189.0 461.4,1174.1 461.5,1162.0C461.5,1157.7 461.4,1148.0 461.2,1140.2C460.9,1126.8 461.4,1115.2 462.5,1106.0C462.7,1103.9 463.2,1099.0 463.5,1095.0C464.1,1087.8 465.0,1079.3 466.0,1073.0C466.5,1070.0 466.8,1068.0 467.9,1062.7C468.2,1061.6 469.6,1058.2 471.1,1055.1C474.5,1048.4 476.2,1043.6 477.2,1037.8C478.2,1031.8 479.0,1022.9 479.0,1016.6C479.0,1013.5 479.4,1009.5 480.0,1006.6C481.3,1000.1 481.7,992.6 481.1,987.7C480.5,983.3 479.4,979.9 475.6,970.5C470.3,957.8 469.5,953.1 470.4,939.6C471.5,924.0 473.3,904.8 475.0,892.8C475.3,890.5 475.7,886.9 476.0,884.7C476.2,882.5 476.6,879.8 476.7,878.7C477.1,876.3 477.8,872.0 478.5,866.8C480.4,853.6 483.3,844.1 489.9,828.9C490.9,826.7 494.0,823.7 494.9,824.2C495.1,824.3 495.1,828.6 494.9,833.8C493.9,858.7 497.4,878.9 505.7,896.9C509.2,904.5 510.0,906.9 510.5,911.7C511.0,916.0 510.3,926.5 509.4,928.1C508.7,929.5 508.3,929.2 506.6,926.6C505.7,925.3 505.0,924.5 505.0,924.8C505.0,925.4 507.0,928.7 507.6,929.1C508.5,929.6 509.5,936.6 509.5,941.6C509.5,952.4 505.7,962.6 498.9,970.5C497.6,972.1 496.5,973.5 496.5,973.7C496.5,974.4 497.5,973.9 499.2,972.5C501.3,970.6 501.7,970.6 501.3,972.6C500.7,975.4 498.1,994.4 497.3,1001.5C494.9,1022.1 493.8,1043.7 493.8,1070.0C493.7,1098.5 494.5,1105.3 499.0,1121.2C502.5,1133.4 502.3,1137.6 497.5,1147.4C495.0,1152.5 494.4,1154.2 494.0,1157.9C492.6,1168.0 494.7,1176.8 500.8,1186.3C502.5,1189.0 504.0,1192.5 504.0,1193.8C504.0,1194.6 503.1,1194.7 502.0,1194.0ZM582.7,1192.9C583.1,1191.4 584.2,1189.1 588.6,1181.0C591.1,1176.5 592.6,1170.8 592.9,1164.5C593.2,1157.6 592.5,1154.4 589.4,1148.0C585.7,1140.4 585.4,1139.3 585.4,1134.0C585.4,1130.0 585.6,1128.3 587.2,1122.8C591.8,1106.8 593.0,1096.6 593.0,1072.8C593.0,1051.1 591.8,1027.4 589.5,1003.5C588.1,989.5 586.0,973.8 585.2,971.9C584.7,970.6 585.3,970.8 587.5,972.6C588.6,973.5 589.6,974.0 589.8,973.9C590.0,973.7 588.8,972.1 587.3,970.3C584.0,966.4 580.0,958.4 578.5,952.8C577.1,947.4 576.7,940.4 577.5,934.1C578.0,929.4 578.0,928.8 577.2,927.6C576.5,926.5 576.3,924.8 576.1,918.6C575.8,909.3 576.4,906.2 580.3,898.1C588.4,880.8 591.8,862.0 591.4,836.9C591.3,829.3 591.4,824.0 591.6,824.0C592.5,824.0 596.5,827.6 596.8,828.7C596.9,829.3 597.9,831.6 598.9,834.0C603.5,845.0 605.7,852.7 607.4,864.2C607.7,866.2 608.4,870.6 608.9,874.0C609.5,877.4 610.2,882.3 610.5,884.8C610.8,887.2 611.3,890.7 611.5,892.5C611.8,894.3 612.2,897.8 612.5,900.2C612.7,902.7 613.3,907.6 613.7,911.0C615.4,924.4 616.1,934.7 616.2,944.2C616.3,957.1 615.8,959.4 610.0,973.0C604.7,985.4 604.0,993.6 606.8,1007.1C607.2,1009.1 607.6,1014.7 607.7,1020.1C608.1,1034.7 609.5,1041.7 614.1,1051.8C615.8,1055.3 617.4,1059.1 617.8,1060.1C618.8,1062.8 620.8,1074.4 622.3,1086.2C622.4,1087.2 623.0,1093.5 623.5,1100.2C625.8,1126.6 626.5,1146.7 625.4,1149.8C624.9,1151.3 624.8,1154.2 624.9,1161.9C625.0,1172.5 624.3,1181.4 622.7,1187.9L621.8,1191.5L612.8,1191.2C602.7,1190.8 595.0,1191.4 588.8,1193.0C586.5,1193.6 584.2,1194.2 583.6,1194.3C582.5,1194.6 582.4,1194.5 582.7,1192.9ZM530.6,803.5C535.8,798.8 539.9,792.4 542.0,785.6C542.6,783.6 543.3,782.1 543.5,782.2C543.7,782.4 544.0,783.3 544.2,784.4C544.6,786.9 547.6,793.0 550.3,796.8C551.5,798.5 554.0,801.3 555.9,803.0L559.2,806.0L555.5,805.6C550.6,805.1 535.1,805.1 531.0,805.7L527.8,806.1L530.6,803.5ZM449.7,744.1C437.1,732.1 426.0,715.3 418.8,697.5C415.4,689.2 414.4,687.1 414.1,688.1C413.8,689.7 418.4,702.8 423.0,712.7C426.7,721.0 433.9,731.3 440.3,737.6C445.5,742.6 452.1,748.0 453.0,748.0C453.4,748.0 451.9,746.2 449.7,744.1ZM636.5,745.9C647.8,737.4 657.1,725.8 663.5,712.4C667.4,704.2 672.0,691.4 672.0,689.0C672.0,687.0 671.2,688.4 668.2,696.0C661.2,714.0 649.3,732.0 636.8,743.9C634.7,745.9 633.0,747.6 633.0,747.8C633.0,748.3 633.9,747.9 636.5,745.9ZM508.0,616.8C505.2,609.1 495.8,591.9 489.7,583.2C485.1,576.8 473.7,559.5 471.4,555.6C468.9,551.2 464.0,541.3 461.9,536.2C461.0,533.8 460.8,536.1 461.7,538.8C465.5,550.0 474.6,566.9 484.8,581.5C495.1,596.3 500.9,605.6 504.8,613.3C508.7,621.1 510.1,622.6 508.0,616.8ZM581.4,613.6C585.6,605.3 588.9,600.0 598.1,586.3C610.4,568.4 612.4,565.2 616.9,556.3C621.9,546.7 626.4,535.4 625.9,533.9C625.7,533.3 625.1,534.5 623.5,538.2C621.8,542.1 615.7,554.4 614.0,557.2C611.3,561.7 605.2,570.8 599.0,579.8C590.2,592.4 582.6,606.0 578.7,616.1C576.9,620.8 576.8,621.0 577.4,621.0C577.6,621.0 579.4,617.7 581.4,613.6ZM566.0,568.6C577.8,539.6 583.9,512.2 587.0,475.2C588.3,459.6 588.9,436.3 588.0,433.5C587.7,432.4 587.6,432.4 587.3,434.2C587.2,435.4 586.8,441.4 586.5,447.8C585.3,474.1 583.2,493.3 579.7,511.7C577.9,520.9 574.7,535.4 573.2,540.8C571.2,547.6 568.6,556.5 567.8,558.8C567.4,559.9 566.4,562.8 565.5,565.2C564.6,567.7 563.5,570.9 563.0,572.2C562.5,573.6 561.9,575.4 561.8,576.2L561.5,577.8L562.5,576.2C563.1,575.3 564.6,571.9 566.0,568.6ZM524.3,575.4C524.1,574.5 523.7,573.3 523.5,572.8C520.5,566.0 514.3,545.6 511.0,531.8C505.2,507.5 501.9,484.7 500.3,456.8C499.9,449.9 499.4,441.9 499.2,439.1C499.0,435.8 498.7,434.1 498.4,434.3C498.0,434.5 498.0,439.7 498.1,450.4C498.9,490.8 505.3,528.1 517.0,559.9C519.6,567.0 523.9,577.0 524.4,577.0C524.5,577.0 524.4,576.3 524.3,575.4ZM531.8,424.3C527.3,423.5 523.5,422.2 523.5,421.4C523.5,421.1 524.0,421.0 524.6,421.2C528.7,422.4 532.3,422.6 545.2,422.4C552.9,422.2 559.8,422.0 560.5,421.8C561.6,421.4 561.7,421.4 561.0,422.2C560.6,422.6 558.6,423.4 556.7,423.8C551.9,424.9 537.1,425.2 531.8,424.3ZM528.8,419.4C524.0,418.8 519.9,416.7 516.4,413.1C514.9,411.5 513.1,409.2 512.5,408.0C510.9,404.9 508.0,397.2 508.0,396.1C508.0,395.6 506.9,393.4 505.5,391.3C499.8,382.6 498.3,377.8 498.3,368.5C498.4,363.0 498.6,361.3 500.2,354.8C501.8,348.2 502.1,346.5 502.3,338.6C502.5,332.2 502.4,327.3 501.8,321.0C500.8,310.0 497.9,294.8 496.0,290.2C495.4,288.9 495.3,288.8 495.1,289.9C495.0,290.5 495.4,293.7 496.0,297.1C498.2,310.1 499.0,317.6 499.3,325.9C499.5,330.6 499.5,334.5 499.4,334.5C499.2,334.5 498.3,332.0 497.3,329.0C495.6,323.7 495.4,323.3 491.9,319.5C485.4,312.6 480.2,300.8 478.0,288.5C475.2,273.1 474.9,269.3 474.7,243.8C474.5,222.2 474.4,219.9 473.4,215.6C472.8,213.0 472.5,210.8 472.7,210.6C472.9,210.5 473.7,211.0 474.6,211.9C475.5,212.7 476.9,213.7 477.7,214.0C479.4,214.6 483.9,214.6 487.0,214.0C489.1,213.6 489.4,213.6 492.2,215.5C493.8,216.6 495.2,217.4 495.4,217.3C495.5,217.2 495.0,215.5 494.4,213.7C493.7,211.8 492.4,208.0 491.5,205.2C489.6,199.5 489.0,198.1 486.7,194.9C482.9,189.7 476.3,187.7 471.3,190.3C470.5,190.7 469.7,191.0 469.4,191.0C469.2,191.0 469.0,189.6 469.0,187.8C469.0,184.6 470.4,179.3 473.1,172.8C474.6,169.3 479.2,163.3 482.1,161.1C492.6,153.4 493.0,153.1 492.0,154.9C491.8,155.4 491.2,156.1 490.8,156.5C489.5,157.6 489.9,158.1 491.4,157.3C492.2,156.9 493.6,155.6 494.6,154.4C497.9,150.1 501.5,147.7 510.5,143.9C511.5,143.5 513.3,142.6 514.6,142.1C515.9,141.5 517.2,141.0 517.5,141.0C517.8,141.0 518.4,140.8 518.9,140.5C519.4,140.3 522.5,138.8 525.8,137.3C538.8,131.6 547.2,125.3 552.2,117.6C553.0,116.5 553.8,115.6 554.0,115.8C554.3,115.9 554.9,116.9 555.3,117.9C556.5,120.4 559.9,124.8 562.6,127.3C565.9,130.4 572.6,135.2 576.7,137.6C583.0,141.2 586.0,143.2 586.4,144.2C588.9,149.6 590.5,152.3 592.5,154.6C595.2,157.6 596.5,157.6 594.1,154.6C592.0,152.0 588.9,146.1 589.2,145.5C589.5,145.0 594.8,147.6 598.3,150.1C602.3,152.8 605.7,157.2 608.3,163.2C609.6,166.2 611.8,170.9 613.2,173.5C616.0,179.1 617.4,183.2 617.8,187.1C618.3,191.4 618.0,191.7 615.1,190.2C607.0,186.2 598.3,193.0 594.3,206.5C592.8,211.8 591.8,214.6 590.9,215.9C590.2,217.1 590.7,218.0 591.7,217.2C592.1,217.0 593.3,216.0 594.5,215.1C595.7,214.2 597.0,213.6 597.4,213.7C598.7,214.2 605.9,214.6 607.7,214.3C608.7,214.1 610.3,213.3 611.3,212.4C612.2,211.6 613.2,211.0 613.3,211.2C613.5,211.3 613.3,212.9 613.0,214.6C612.6,216.6 612.2,226.7 612.0,242.0C611.7,255.3 611.4,267.3 611.3,268.5C611.1,269.7 610.8,273.1 610.5,276.0C609.9,281.4 608.6,289.4 607.2,295.0C605.9,300.2 604.1,304.8 601.1,310.7C598.9,315.0 597.5,317.0 594.6,319.9C591.1,323.5 590.9,323.7 589.2,329.1C588.2,332.1 587.3,334.5 587.1,334.3C586.3,333.4 587.6,317.5 590.0,300.4C590.5,296.5 591.0,292.6 591.0,291.8C591.0,289.0 589.9,291.2 588.7,296.4C586.0,307.8 584.6,318.5 584.2,331.0C583.8,341.1 584.4,347.4 586.5,356.0C590.2,371.2 588.4,381.2 579.8,393.1C578.8,394.5 578.2,395.9 578.3,396.4C578.6,397.3 578.0,398.8 575.0,405.2C573.3,408.8 569.9,413.6 567.8,415.2C565.6,416.9 561.5,418.7 558.8,419.3C556.1,419.8 533.2,419.9 528.8,419.4ZM520.3,390.1C520.6,389.9 521.4,389.0 521.9,388.0C522.8,386.6 523.0,385.4 523.0,382.1C523.0,376.4 522.1,373.5 517.9,366.6C515.0,361.9 514.3,360.3 514.1,358.2C513.8,354.8 515.0,352.4 516.8,352.8C518.5,353.2 518.4,351.9 516.7,350.5C514.0,348.4 511.6,348.6 508.7,351.1C502.3,356.7 501.2,373.1 506.7,381.2C509.5,385.5 513.5,388.0 517.4,388.0C519.4,388.0 519.5,388.1 519.2,389.2C518.9,390.5 519.3,390.8 520.3,390.1ZM566.9,388.9C566.8,388.0 567.0,387.8 569.2,387.8C572.4,387.7 575.1,386.4 577.6,383.8C581.8,379.5 583.2,374.8 582.9,366.1C582.6,358.6 581.5,355.2 578.5,352.1C575.0,348.5 570.5,348.3 568.2,351.7C567.1,353.4 567.9,354.4 569.4,353.4C571.0,352.4 571.7,353.5 571.9,357.1C572.1,360.5 572.1,360.4 567.6,368.1C564.5,373.5 563.5,376.3 563.1,380.6C562.9,383.9 563.5,386.7 564.9,388.9C565.8,390.3 567.0,390.3 566.9,388.9ZM514.5,386.1C513.9,386.0 512.2,384.7 510.8,383.3C508.8,381.4 507.9,380.0 507.1,377.5C504.2,369.0 505.7,357.9 510.3,353.5C512.3,351.6 512.9,351.8 512.1,354.2C511.3,356.4 511.3,359.7 512.3,361.9C512.7,362.9 514.3,365.8 515.8,368.3C519.2,374.0 520.5,377.6 520.5,381.7C520.5,386.2 519.4,387.1 514.5,386.1ZM568.1,386.1C564.2,385.4 564.8,378.1 569.4,370.2C574.4,361.6 574.6,361.1 574.4,357.5C574.3,355.7 574.0,353.9 573.8,353.4C573.2,352.0 574.6,352.3 576.1,353.9C579.3,357.2 581.3,364.2 580.8,370.6C580.1,380.2 574.4,387.2 568.1,386.1ZM520.0,280.2C520.0,279.2 519.8,277.0 519.5,275.3C519.3,273.6 518.8,270.4 518.5,268.2C517.0,257.8 511.5,238.9 510.3,240.1C510.0,240.3 510.7,243.6 512.6,251.0C515.0,260.2 516.7,268.0 518.8,280.1C519.2,282.5 520.0,282.6 520.0,280.2ZM569.0,271.2C571.0,261.6 573.1,252.7 575.0,246.3C575.8,243.4 576.5,240.7 576.5,240.2C576.5,236.9 573.2,245.1 570.5,255.0C568.0,264.1 565.7,279.5 566.4,281.5C566.7,282.4 566.8,282.1 569.0,271.2ZM487.7,211.0C487.5,210.7 487.8,210.0 488.2,209.6C488.9,208.8 489.1,208.8 489.5,209.5C489.8,209.9 490.0,210.5 490.0,210.9C490.0,211.6 488.2,211.7 487.7,211.0ZM596.0,210.9C596.0,210.5 596.2,209.9 596.5,209.5C596.9,208.8 597.1,208.8 597.8,209.6C598.2,210.0 598.5,210.7 598.3,211.0C597.8,211.7 596.0,211.6 596.0,210.9ZM477.1,209.8C473.6,207.4 471.9,201.1 473.8,197.5C474.4,196.1 474.8,196.0 477.0,196.0C479.9,196.0 482.3,197.0 484.0,198.8C486.5,201.5 487.0,202.6 487.0,205.3C487.0,207.6 486.8,208.0 485.2,209.4C483.8,210.7 483.1,211.0 481.1,211.0C479.5,210.9 478.2,210.6 477.1,209.8ZM601.9,210.0C598.7,208.3 598.2,205.0 600.8,200.6C602.6,197.5 605.3,196.0 608.9,196.0C612.5,196.0 613.0,196.5 613.3,200.1C614.1,207.8 607.9,213.2 601.9,210.0ZM601.0,196.0C601.0,195.8 601.9,194.8 603.0,193.9C606.5,190.9 610.8,190.2 614.8,192.1C617.3,193.2 617.8,194.3 615.6,193.8C610.7,192.5 604.7,193.3 602.7,195.5C601.8,196.6 601.0,196.8 601.0,196.0ZM483.5,195.0C480.9,193.1 474.7,192.5 470.6,193.8C468.6,194.4 469.4,193.0 471.6,192.0C475.5,190.2 480.1,190.9 483.4,193.8C485.4,195.5 485.5,196.5 483.5,195.0ZM466.0,174.3C466.0,174.2 467.4,170.0 469.0,164.9C473.9,150.1 479.8,139.3 490.0,126.6C495.2,119.9 517.2,97.3 520.4,95.2C531.1,88.3 547.9,86.7 552.4,92.3C557.7,98.9 554.9,110.9 545.9,120.3C539.9,126.5 531.1,131.9 519.5,136.5C517.2,137.4 514.8,138.5 514.1,138.9C511.8,140.4 512.0,139.1 514.7,136.2C516.2,134.6 517.5,133.1 517.5,132.9C517.5,132.0 516.4,132.7 512.7,135.9C507.8,140.1 503.9,143.0 501.0,144.6C494.0,148.5 488.7,152.0 483.6,156.1C481.6,157.7 480.0,158.8 480.0,158.6C480.0,158.3 481.3,156.5 482.8,154.7C484.3,152.8 486.1,150.3 486.6,149.2L487.6,147.2L486.5,148.2C482.2,152.0 475.4,160.4 471.0,167.3C469.1,170.3 467.4,173.2 467.2,173.7C466.9,174.4 466.0,174.9 466.0,174.3ZM609.0,158.4C606.1,153.2 598.7,147.2 589.6,142.5C585.3,140.4 574.8,133.7 570.2,130.1C562.5,124.2 554.0,114.0 555.2,112.1C556.2,110.5 557.1,105.2 557.1,101.2C557.2,97.6 557.0,96.3 556.1,94.5C555.5,93.3 555.0,92.1 555.0,91.9C555.0,90.7 561.4,92.2 566.1,94.5C568.4,95.7 569.7,96.9 572.8,100.9C574.9,103.6 580.4,109.5 585.0,114.0C596.0,124.8 600.1,129.9 604.1,137.5C607.4,143.7 609.1,148.9 610.3,156.2C610.4,157.3 610.7,158.8 610.8,159.4C611.3,161.2 610.3,160.7 609.0,158.4ZM483.0,122.0C483.0,117.9 483.1,114.5 483.2,114.5C483.4,114.5 483.9,115.0 484.4,115.6C485.0,116.1 485.7,116.5 486.0,116.4C486.3,116.3 484.8,113.7 482.7,110.5C474.3,98.0 471.0,87.6 471.0,74.0C471.0,59.9 475.0,47.0 482.2,37.9C484.8,34.7 486.6,33.5 487.9,34.3C488.3,34.6 489.2,36.8 489.9,39.3C491.3,44.7 493.8,49.7 498.5,56.8C500.5,59.7 502.7,63.4 503.4,64.9C507.9,75.1 508.5,87.0 505.0,98.3C503.4,103.4 503.2,104.8 504.0,104.3C505.0,103.6 507.8,96.6 508.7,92.4C509.0,91.0 510.0,90.4 510.0,91.6C510.0,91.9 510.6,93.5 511.3,95.1L512.7,98.1L503.9,106.8C496.2,114.3 486.4,125.3 484.4,128.5C484.0,129.0 483.6,129.5 483.4,129.5C483.2,129.5 483.0,126.1 483.0,122.0ZM600.3,125.7C598.9,123.9 594.6,119.2 590.7,115.2C586.7,111.3 583.5,107.9 583.5,107.6C583.5,107.3 583.1,106.9 582.5,106.8C581.5,106.4 575.7,100.6 574.6,98.8C574.0,97.8 574.0,97.3 575.3,94.1C576.1,92.1 576.8,90.5 577.0,90.5C577.1,90.5 577.7,92.1 578.2,94.1C579.2,98.2 581.9,104.5 582.6,104.5C583.1,104.5 582.9,103.5 581.2,97.5C579.4,91.3 578.8,86.5 579.2,80.2C579.7,71.2 581.6,65.7 587.4,56.9C591.9,50.2 594.6,44.8 596.0,40.0C598.1,33.1 599.1,32.6 602.9,36.7C608.5,43.1 612.4,52.5 614.3,64.2C615.2,69.9 615.2,75.6 614.3,83.0C613.1,92.7 610.4,99.5 603.7,110.0C599.9,116.0 599.0,118.1 601.2,116.0C601.9,115.4 602.6,114.9 602.8,115.1C603.2,115.5 603.4,128.5 603.0,128.7C602.8,128.9 601.6,127.5 600.3,125.7Z"
		},
		po: {
			w: 1086,
			h: 1448,
			d: "M443.6,1357.5C453.6,1356.5 459.3,1355.5 464.8,1353.7C472.2,1351.4 475.4,1349.4 477.0,1346.4L478.2,1344.1L477.3,1337.4C476.4,1330.4 475.9,1327.0 475.0,1322.4C473.7,1315.1 473.4,1313.6 473.0,1311.0C470.7,1296.8 470.2,1295.1 466.6,1287.7C463.4,1281.1 462.3,1278.1 461.1,1272.8C459.5,1265.8 459.1,1263.2 458.5,1257.0C457.8,1250.2 457.9,1248.1 459.0,1248.5C459.4,1248.6 464.9,1248.8 471.2,1248.9C485.8,1249.1 493.3,1248.2 499.3,1245.3C503.7,1243.1 504.4,1240.1 502.5,1231.1C500.5,1221.9 499.6,1219.2 496.9,1213.7C493.6,1207.2 492.5,1202.3 492.4,1194.8C492.4,1189.8 492.5,1189.7 494.7,1185.0C497.5,1179.1 498.1,1176.5 498.1,1170.8C498.1,1165.0 497.4,1161.2 495.0,1153.8C491.2,1142.0 490.5,1137.6 489.5,1117.0C488.4,1096.3 489.5,1032.9 491.2,1017.5C493.2,999.3 493.3,995.5 492.0,995.5C491.8,995.5 491.1,997.0 490.6,998.9C488.4,1006.4 486.4,1026.1 485.4,1050.4C484.8,1067.0 485.1,1123.2 486.0,1132.0C486.7,1139.4 488.1,1146.1 490.7,1154.5C493.4,1163.0 494.2,1167.6 493.8,1172.5C493.3,1179.4 491.1,1184.4 485.4,1192.2C482.5,1196.1 481.6,1198.2 480.9,1202.1C480.1,1207.3 481.5,1209.0 482.5,1204.0C483.3,1199.9 484.3,1197.1 485.8,1194.9C487.4,1192.7 488.3,1192.7 488.1,1194.9C487.9,1196.8 488.8,1203.0 489.8,1207.2C490.2,1208.9 491.7,1212.6 493.0,1215.5C496.8,1223.6 500.6,1237.9 499.5,1240.0C499.0,1241.0 496.1,1242.4 493.5,1243.1C486.6,1244.8 483.9,1245.0 472.8,1244.9C459.8,1244.9 458.2,1244.7 458.3,1243.2C458.6,1239.4 459.5,1236.5 462.0,1231.2C466.2,1222.5 467.2,1218.7 467.2,1210.8C467.2,1203.4 466.8,1201.7 463.5,1191.5C458.9,1177.8 457.9,1172.7 456.4,1154.0C455.6,1144.2 455.6,1104.2 456.4,1090.0C458.4,1055.5 459.9,1046.5 465.0,1035.7C468.5,1028.5 470.1,1023.9 471.7,1016.4C474.1,1005.2 474.8,995.3 474.0,982.9C473.5,974.1 473.5,973.9 474.7,969.4C476.6,962.5 477.2,954.9 476.5,949.0C475.8,943.0 474.6,939.1 471.2,932.2C467.5,924.6 467.3,923.7 465.4,912.2C464.5,907.0 464.5,874.8 465.4,867.5C465.7,864.6 466.3,860.0 466.6,857.2C467.5,848.3 470.4,833.5 473.0,824.2C475.6,814.8 479.1,806.3 486.8,790.9C490.5,783.4 494.5,774.6 495.4,771.8C495.6,770.9 496.0,770.3 496.2,770.4C496.4,770.4 496.7,779.1 496.8,789.6C497.1,819.6 498.5,888.3 499.0,903.8C499.8,927.3 499.7,933.9 498.3,942.1C496.2,953.9 495.5,960.7 495.5,968.0C495.5,974.8 496.0,976.9 497.0,974.4C497.6,972.9 498.8,965.9 499.5,960.0C500.5,951.6 501.0,951.5 502.5,959.1C503.5,964.2 503.6,966.1 503.6,979.8C503.6,988.1 503.4,995.5 503.2,996.1C502.9,997.5 504.2,1017.0 505.3,1027.0C508.0,1051.3 511.6,1071.9 517.8,1098.0C520.5,1109.6 529.2,1137.3 532.1,1144.0C533.3,1146.7 534.0,1148.4 534.5,1149.8C536.5,1155.2 539.6,1160.7 541.0,1161.5C544.7,1163.5 547.3,1160.3 552.5,1147.1C558.9,1131.0 564.7,1111.9 569.0,1093.3C578.1,1054.0 583.1,1014.3 584.5,970.8C584.7,962.5 585.1,957.7 585.4,957.4C585.7,957.1 586.0,956.9 586.1,957.0C586.1,957.1 586.3,962.9 586.5,969.8C586.8,981.2 587.0,982.8 588.4,988.8C589.2,992.3 590.1,996.3 590.3,997.5C590.4,998.7 591.2,1002.6 592.0,1006.0C594.4,1016.5 595.1,1025.1 596.0,1052.5C596.8,1075.3 596.4,1125.7 595.3,1134.2C594.4,1141.7 594.0,1143.3 591.0,1153.5C589.7,1158.0 588.3,1163.3 588.0,1165.2C586.8,1171.9 588.3,1180.0 591.9,1186.5L593.6,1189.7L593.4,1195.7C593.0,1203.1 591.8,1208.0 588.8,1214.2C586.3,1219.1 584.5,1225.2 583.0,1233.7C581.6,1241.1 582.3,1243.2 586.7,1245.4C592.2,1248.2 600.6,1249.2 616.1,1248.9L628.0,1248.7L628.0,1250.6C628.0,1253.4 626.4,1265.4 625.4,1269.5C623.6,1277.8 622.1,1282.3 619.4,1287.8C616.5,1293.7 615.3,1297.0 614.5,1302.0C614.2,1304.1 613.6,1307.4 613.2,1309.5C612.7,1311.6 612.2,1314.5 612.0,1316.0C611.6,1318.4 611.2,1321.2 609.5,1331.0C609.3,1332.5 608.8,1336.1 608.5,1339.0C607.9,1343.8 607.9,1344.4 608.7,1346.2C610.4,1349.7 615.4,1352.3 625.1,1354.7C632.8,1356.6 639.3,1357.5 649.2,1357.8C668.1,1358.5 684.0,1355.9 692.3,1350.9C696.3,1348.5 697.1,1347.1 697.1,1343.0C697.1,1341.1 696.8,1338.4 696.5,1336.9C695.4,1331.5 694.4,1326.2 694.0,1324.2C693.8,1323.2 693.3,1321.0 693.0,1319.5C692.7,1318.0 692.2,1315.8 692.0,1314.8C691.7,1313.7 691.3,1311.7 691.0,1310.5C690.7,1309.3 690.1,1306.0 689.6,1303.2C688.4,1297.1 687.5,1294.5 684.8,1288.8C681.1,1281.1 680.5,1279.8 678.5,1272.8C677.7,1269.8 676.3,1263.4 675.8,1260.5C674.0,1250.3 673.7,1244.4 674.5,1238.8C675.0,1235.8 677.4,1228.3 678.5,1226.8C678.7,1226.5 679.0,1225.7 679.2,1225.0C679.4,1224.3 679.9,1222.5 680.4,1221.0C681.6,1217.0 681.5,1203.4 680.3,1199.2C679.8,1197.6 679.2,1195.6 679.0,1194.8C678.8,1193.9 678.1,1191.6 677.4,1189.5C672.6,1174.9 671.7,1169.1 669.4,1135.8C668.6,1123.7 668.6,1064.8 669.4,1055.8C670.7,1041.4 671.1,1039.5 677.8,1018.8C678.7,1015.8 680.5,1008.1 681.4,1003.0C682.5,996.9 684.0,981.9 684.0,976.6C684.0,973.1 682.9,962.3 682.3,959.8C682.2,959.2 681.3,955.8 680.4,952.2C678.8,946.0 678.8,945.4 678.8,936.0C678.8,927.7 679.0,925.5 680.0,921.0C680.6,918.1 681.3,915.4 681.6,914.9C681.8,914.4 682.0,913.7 682.0,913.3C682.0,912.8 682.5,911.4 683.1,910.1C683.6,908.8 684.5,907.0 684.9,906.0C685.3,905.0 686.5,902.5 687.5,900.2C693.5,887.6 693.9,886.6 697.9,875.4C705.3,855.2 708.7,828.9 707.5,802.7C706.9,789.4 707.3,783.3 710.0,770.4C710.2,769.3 711.6,766.6 713.0,764.4C723.0,748.8 725.8,743.6 730.4,731.9C740.7,705.8 744.9,678.4 743.5,647.6C742.4,621.7 738.2,601.4 729.1,577.0C724.9,565.6 724.7,565.0 723.2,557.0C720.3,541.0 717.7,531.2 713.1,518.6C708.1,505.1 697.8,486.2 689.1,474.6C676.8,458.3 661.4,443.5 646.5,433.7L642.1,430.8L639.8,426.0C636.2,418.4 632.0,409.1 632.0,408.7C632.0,408.6 631.3,407.1 630.5,405.3C629.7,403.4 629.0,401.9 629.0,401.8C629.0,401.6 628.5,400.3 627.8,398.9C626.0,395.0 620.6,381.3 619.0,376.8C615.9,368.0 614.5,354.6 613.5,326.8C612.4,294.6 611.3,277.8 609.2,257.5C608.8,253.5 608.2,248.0 607.9,245.2C607.4,240.2 607.6,238.2 609.0,231.2C612.1,216.0 613.5,199.9 612.5,189.5C610.9,172.1 607.0,153.7 602.5,142.5C599.1,134.2 599.2,134.3 599.6,126.8C600.0,120.1 600.1,119.9 601.6,117.7C607.7,109.3 609.5,105.7 611.6,98.5C616.8,80.3 613.4,56.8 603.8,44.9C599.1,39.0 595.1,40.0 592.3,47.5C589.8,54.4 586.2,61.2 582.1,66.8C575.3,76.3 572.3,82.7 570.7,90.9C569.8,95.8 569.1,96.7 567.6,95.4C564.6,92.7 554.4,89.0 547.4,88.0C539.1,86.9 526.4,90.2 519.6,95.3C518.7,96.0 517.8,96.4 517.6,96.3C517.3,96.1 516.9,94.2 516.5,92.0C515.3,83.4 511.6,75.8 503.4,64.7C500.5,60.7 497.5,54.9 495.3,48.8C492.0,39.7 488.9,38.8 483.3,45.1C480.4,48.4 477.9,53.5 475.6,61.0C474.6,64.3 473.5,71.7 473.2,77.6C472.7,85.8 474.0,94.6 476.7,102.7C478.5,108.1 480.0,110.8 483.7,115.7L487.0,120.0L487.6,126.7L488.1,133.5L486.5,137.6C485.6,139.9 484.5,142.9 484.0,144.2C482.2,149.0 478.9,161.3 478.0,166.8C477.7,168.1 477.2,171.2 476.8,173.5C476.4,175.8 475.8,179.6 475.4,181.8C475.0,184.4 474.8,189.9 474.8,198.5C474.8,211.6 475.0,214.1 477.5,228.0C478.1,231.2 478.8,235.1 479.1,236.8C479.6,239.7 479.3,245.2 478.5,250.5C478.3,252.0 477.8,255.9 477.5,259.2C477.2,262.6 476.8,267.5 476.5,270.2C475.2,284.6 474.1,301.7 473.5,319.5C472.7,342.4 471.4,361.1 470.0,369.0C469.5,372.5 467.5,378.2 464.7,384.9C463.4,387.8 461.7,391.9 460.9,394.0C460.1,396.1 459.0,398.6 458.5,399.8C458.0,400.9 456.6,404.1 455.4,407.0C452.9,412.8 451.4,416.0 447.4,424.5L444.6,430.3L438.9,434.1C431.0,439.4 425.8,443.5 417.9,451.0C409.9,458.6 403.8,465.5 397.0,474.5C392.3,480.8 383.5,495.0 380.9,500.5C375.2,512.4 373.6,516.2 370.1,527.0C367.0,536.4 365.5,542.2 363.5,552.9C361.6,563.5 361.0,565.7 357.8,574.2C349.7,595.6 345.5,613.0 343.2,633.5C342.1,643.2 341.8,663.6 342.4,673.2C344.9,707.5 353.8,735.2 370.5,760.8C375.6,768.5 375.9,769.2 377.6,778.0C378.1,780.4 378.2,786.5 378.1,800.5C378.0,828.0 379.2,842.6 383.0,859.0C384.8,866.9 388.9,879.5 391.2,884.6C391.8,886.0 392.9,888.4 393.5,889.8C394.1,891.1 395.1,893.4 395.8,894.9C396.5,896.3 397.5,898.7 398.2,900.1C398.9,901.6 399.9,903.9 400.5,905.2C401.1,906.6 401.9,908.4 402.3,909.2C407.6,921.0 409.2,939.6 406.0,950.5C403.2,960.0 402.0,967.9 402.0,977.4C402.0,990.6 405.1,1010.0 409.2,1022.7C413.4,1035.6 414.7,1040.7 415.5,1048.2C418.0,1073.6 417.4,1135.6 414.2,1162.7C412.7,1175.3 411.5,1181.0 408.0,1191.5C404.3,1202.6 403.3,1209.7 404.5,1216.8C405.2,1220.9 406.1,1224.2 406.6,1224.7C406.8,1225.0 407.0,1225.5 407.0,1225.9C407.0,1226.2 407.8,1228.2 408.8,1230.3C411.5,1236.1 412.3,1241.1 411.6,1249.3C410.7,1259.6 408.6,1270.0 405.9,1277.8C404.9,1280.6 404.1,1282.6 400.5,1290.2C397.7,1296.2 397.4,1297.2 396.2,1303.5C395.8,1305.8 395.2,1308.7 394.9,1309.8C394.7,1310.8 394.3,1312.9 394.0,1314.2C393.7,1315.6 393.3,1317.8 393.0,1319.0C392.7,1320.2 392.3,1322.5 392.0,1324.0C391.7,1325.5 391.2,1327.9 390.9,1329.2C389.7,1335.2 389.5,1336.5 389.0,1340.2C388.4,1344.7 388.6,1346.1 390.2,1348.3C393.3,1352.3 405.7,1356.3 418.5,1357.5C425.0,1358.1 437.8,1358.1 443.6,1357.5ZM417.0,1353.0C403.5,1351.5 393.0,1347.3 393.0,1343.4C393.0,1340.3 399.0,1309.3 399.8,1308.6C399.9,1308.4 401.2,1308.9 402.6,1309.6C406.3,1311.4 410.9,1312.8 417.2,1314.1C422.0,1315.0 424.3,1315.2 433.8,1315.2C443.2,1315.2 445.5,1315.0 450.2,1314.1C456.3,1312.9 462.7,1310.9 465.7,1309.4C466.7,1308.9 467.8,1308.6 468.0,1308.8C469.0,1309.8 473.8,1342.2 473.3,1344.1C472.7,1346.5 466.1,1349.5 457.6,1351.2C447.7,1353.2 427.5,1354.1 417.0,1353.0ZM638.0,1352.7C625.2,1350.9 616.4,1348.3 613.8,1345.5C612.4,1344.1 612.4,1343.9 612.7,1340.4C613.0,1336.8 617.3,1309.8 617.7,1308.6C617.9,1308.2 618.6,1308.4 620.1,1309.2C623.9,1311.4 630.2,1313.2 638.5,1314.6C643.4,1315.4 661.0,1315.4 666.0,1314.6C671.4,1313.6 679.8,1311.2 683.1,1309.5C684.7,1308.7 686.1,1308.2 686.2,1308.4C686.3,1308.6 686.7,1310.1 687.0,1311.8C687.3,1313.4 687.8,1315.5 688.0,1316.5C689.7,1324.0 693.0,1341.5 693.0,1343.0C693.0,1344.5 692.7,1345.2 691.4,1346.2C688.8,1348.5 682.3,1350.7 674.0,1352.3C667.4,1353.5 645.5,1353.8 638.0,1352.7ZM426.2,1312.0C418.8,1311.5 414.5,1310.8 409.2,1309.1C406.3,1308.1 403.2,1306.8 401.9,1305.9C400.7,1305.1 400.6,1304.7 400.8,1303.1C401.4,1299.3 403.1,1294.5 406.0,1288.4C412.2,1275.4 415.6,1260.8 415.7,1246.9C415.7,1241.9 415.9,1239.1 416.2,1239.2C417.1,1239.4 419.0,1243.1 420.2,1247.0C421.5,1251.1 422.5,1252.1 422.5,1249.3C422.5,1246.5 420.4,1241.4 417.0,1236.2C411.9,1228.3 409.3,1221.1 408.7,1213.2C408.3,1207.8 409.1,1202.9 411.8,1194.2C416.1,1180.3 417.2,1175.9 418.5,1164.9C421.1,1143.2 422.3,1097.3 421.0,1065.2C420.3,1046.3 419.5,1040.6 416.3,1030.7C408.7,1007.0 406.0,991.0 406.7,972.5C406.9,965.2 407.2,963.4 408.9,956.2C412.2,942.7 412.7,934.0 410.8,922.8C409.4,914.9 407.2,908.9 401.1,896.0C392.2,877.3 386.6,859.5 384.5,843.0C384.2,840.7 383.7,836.6 383.4,834.0C383.0,830.8 382.8,822.2 382.9,808.2C383.0,786.7 382.6,780.0 380.8,772.8C380.4,771.1 380.0,769.2 380.0,768.6C380.0,768.0 379.1,766.2 378.1,764.6C370.0,752.7 362.6,738.8 358.6,727.9C350.7,706.8 346.5,683.1 346.5,659.3C346.5,630.7 351.8,601.7 361.3,577.0C364.8,568.3 365.4,566.0 367.3,556.5C370.9,537.9 375.2,523.6 380.6,511.5C397.1,474.7 424.2,445.1 456.0,429.2C467.6,423.4 479.0,419.6 492.8,417.2C499.6,416.0 501.5,415.9 513.2,415.8C524.5,415.8 527.4,415.9 534.6,417.0L543.0,418.2L551.4,417.0C558.5,415.9 561.6,415.8 572.5,415.8C585.6,415.8 587.7,416.0 599.2,418.3C629.6,424.4 659.0,443.7 682.1,472.7C686.3,477.9 692.7,487.3 695.4,492.0C702.2,504.1 706.6,513.5 710.4,524.0C713.2,531.7 716.9,546.3 719.0,557.8C720.3,564.8 721.1,567.7 724.7,577.5C732.4,598.1 737.1,619.2 738.5,638.5C739.5,652.8 739.6,660.4 739.0,669.2C736.6,707.1 728.0,734.2 709.6,761.6C707.8,764.3 706.2,767.4 705.9,768.5C705.7,769.6 705.3,771.5 705.0,772.6C703.4,779.7 703.0,786.1 703.0,806.5C703.0,830.4 702.4,838.5 699.5,853.0C697.2,864.7 693.7,875.8 689.4,885.4C688.6,887.1 688.0,888.6 688.0,888.7C688.0,888.9 686.9,891.2 685.6,893.9C682.3,900.6 677.8,911.9 676.5,916.8C675.2,921.9 674.0,930.9 674.0,936.1C674.0,940.5 675.1,949.3 676.2,953.2C678.9,962.9 679.2,965.3 679.2,977.5C679.1,995.9 677.3,1006.1 670.5,1027.2C666.5,1039.6 665.9,1043.1 664.9,1057.7C664.1,1069.7 664.1,1121.0 664.9,1135.2C665.6,1147.3 666.8,1161.8 667.5,1167.2C668.4,1173.4 670.6,1183.2 672.4,1188.8C677.4,1204.7 677.2,1203.8 677.2,1210.5C677.2,1215.6 677.0,1217.4 676.1,1220.5C674.3,1226.2 672.2,1230.8 668.8,1236.0C665.7,1240.9 663.9,1245.1 663.3,1248.9C663.0,1250.6 663.1,1251.0 663.7,1251.0C664.2,1251.0 664.8,1249.8 665.5,1247.6C666.7,1244.0 668.9,1239.4 669.8,1239.2C670.1,1239.1 670.3,1242.0 670.3,1247.1C670.3,1261.0 673.5,1274.8 679.5,1287.5C683.0,1294.8 684.7,1299.5 685.3,1303.4L685.6,1305.5L683.0,1306.7C681.6,1307.4 679.1,1308.4 677.4,1308.9C674.5,1309.8 673.0,1310.2 666.1,1311.5C662.8,1312.1 642.4,1312.2 639.1,1311.6C637.8,1311.3 635.2,1310.8 633.2,1310.5C627.7,1309.5 619.8,1306.6 618.9,1305.3C618.5,1304.7 618.9,1301.0 619.6,1298.5C620.2,1296.4 620.9,1294.8 625.3,1285.2C629.6,1275.8 632.3,1260.3 631.9,1246.9C631.7,1238.8 631.8,1238.7 634.6,1243.3C636.2,1246.0 637.0,1246.6 637.0,1245.2C637.0,1243.9 635.0,1240.4 631.9,1236.3C625.8,1228.2 622.8,1219.7 622.8,1210.8C622.8,1204.6 623.3,1202.0 625.8,1194.8C630.9,1180.4 632.2,1174.1 633.6,1158.0C634.5,1147.7 634.5,1101.0 633.6,1087.5C632.2,1066.4 630.4,1048.8 629.2,1045.8C628.8,1044.8 630.0,1044.7 630.9,1045.6C632.5,1047.2 631.3,1044.6 628.5,1040.5C622.3,1031.2 618.5,1020.1 616.7,1006.5C616.0,1000.5 615.7,980.0 616.4,980.0C616.6,980.0 617.5,981.5 618.4,983.3C619.4,985.0 620.4,986.5 620.8,986.5C621.7,986.5 621.5,985.6 619.6,981.6C616.7,975.2 614.3,966.3 613.5,958.9C612.4,949.8 614.3,942.0 620.7,929.2C623.0,924.6 625.6,918.8 626.4,916.5C629.1,908.8 632.1,893.7 631.3,891.6C630.8,890.3 630.3,891.5 629.5,895.8C628.5,901.4 626.1,910.5 625.2,911.7C624.5,912.7 624.5,912.5 624.9,909.8C625.6,904.3 625.2,874.4 624.3,865.8C623.1,853.6 622.4,848.5 621.0,840.9C620.7,839.3 620.3,836.8 620.0,835.4C619.2,830.4 615.1,816.0 613.5,812.2C613.3,811.7 612.7,810.2 612.3,809.0C611.0,805.7 610.3,804.2 605.0,793.2C595.8,774.4 589.7,760.1 589.2,756.3C588.7,752.7 590.0,664.7 591.0,630.0C591.5,611.7 592.0,590.8 592.0,583.5C592.0,544.2 586.9,505.2 578.2,479.2C570.4,455.7 558.4,444.8 541.3,445.6C528.8,446.2 518.5,454.2 511.8,468.2C509.8,472.4 505.5,485.3 503.8,492.2C498.0,515.4 494.5,544.9 493.7,575.2C493.4,587.6 493.7,605.8 495.0,646.2C495.3,654.2 495.7,682.2 496.1,708.5L496.7,756.2L495.0,761.0C493.2,766.4 491.9,769.7 490.5,772.8C489.9,774.0 489.0,776.1 488.5,777.4C487.9,778.7 485.1,784.4 482.3,790.0C479.5,795.6 476.9,801.0 476.5,802.0C476.1,803.0 475.2,805.1 474.5,806.8C472.6,811.0 469.4,820.7 467.6,827.5C463.8,842.2 461.7,856.3 460.4,876.5C459.9,885.3 460.1,902.4 460.8,909.2C461.0,911.1 461.0,912.0 460.6,911.8C459.9,911.4 457.0,900.4 456.2,895.1C456.0,894.0 455.6,892.6 455.2,892.1C454.5,891.4 454.5,891.7 454.8,894.8C455.6,904.1 460.1,920.1 463.5,926.2C466.2,930.8 469.7,938.6 470.8,942.2C472.0,946.3 472.2,947.5 472.2,954.5C472.2,964.4 471.1,969.3 466.0,981.7C464.9,984.3 464.3,986.6 464.5,986.7C465.0,987.1 465.5,986.4 467.5,982.6C468.4,980.9 469.3,979.6 469.4,979.7C470.1,980.4 470.0,997.3 469.3,1004.1C467.6,1020.1 464.4,1029.6 457.0,1040.7C453.8,1045.4 453.4,1046.4 455.0,1045.5C455.6,1045.2 456.2,1045.0 456.3,1045.1C456.4,1045.2 456.0,1048.1 455.5,1051.5C452.8,1068.8 451.8,1089.5 451.8,1124.0C451.8,1165.9 452.6,1173.4 460.0,1194.8C465.2,1209.9 463.8,1221.3 455.0,1234.5C451.3,1240.1 449.3,1244.0 449.9,1244.6C450.2,1244.9 450.9,1244.1 451.9,1242.5C452.8,1241.1 453.7,1240.0 453.9,1240.0C454.1,1240.0 454.2,1244.0 454.1,1248.9C453.8,1263.9 456.4,1276.7 462.4,1289.3C466.2,1297.3 466.8,1299.0 467.2,1302.6C467.4,1304.7 467.4,1305.0 466.1,1305.9C459.6,1310.4 442.7,1313.0 426.2,1312.0ZM599.0,1244.4C590.7,1242.8 588.6,1242.1 587.0,1240.4C586.0,1239.3 586.0,1239.3 587.5,1231.8C589.0,1224.8 590.3,1220.6 592.5,1216.0C593.7,1213.7 594.9,1210.8 595.3,1209.8C596.3,1206.6 597.5,1200.0 597.6,1196.6C597.7,1194.9 598.0,1193.5 598.2,1193.4C598.5,1193.4 599.5,1194.2 600.3,1195.4C601.9,1197.4 602.9,1199.7 604.1,1204.0L604.7,1206.2L604.9,1203.7C605.0,1202.2 604.7,1199.9 604.3,1198.4C603.5,1195.7 603.2,1195.2 598.8,1189.4C593.5,1182.4 591.8,1177.1 592.1,1168.8C592.3,1164.4 592.7,1162.2 594.0,1158.2C598.4,1144.5 599.3,1140.1 600.0,1129.3C600.9,1114.1 601.1,1098.2 600.6,1072.2C599.7,1031.7 598.8,1016.6 596.6,1007.0C592.2,987.8 590.5,977.6 590.5,970.3C590.5,963.8 589.6,956.0 587.7,945.2L585.9,935.2L586.5,912.2C587.8,859.2 589.1,774.9 588.7,772.1C588.4,770.3 588.5,769.9 589.1,770.1C589.4,770.2 590.0,771.0 590.2,771.8C590.5,772.6 593.7,779.5 597.4,787.2C609.3,811.9 611.4,817.6 615.5,835.8C619.5,853.4 622.4,889.0 621.1,904.8C619.9,918.6 618.9,923.1 615.1,931.0C609.9,942.1 608.7,947.0 609.1,956.6C609.3,960.3 609.9,964.5 610.5,967.2C611.5,971.4 611.6,973.1 611.7,987.8C611.8,1004.1 612.0,1006.2 614.2,1017.2C615.7,1024.5 616.8,1027.5 621.2,1036.6C623.9,1042.3 625.2,1047.1 626.5,1056.0C630.4,1084.9 631.5,1140.6 628.5,1166.0C627.3,1175.9 626.6,1178.9 623.0,1189.6C616.2,1209.6 616.4,1216.1 624.4,1232.5C626.6,1236.9 627.0,1238.3 627.1,1241.0L627.2,1244.2L625.2,1244.6C622.4,1245.1 601.7,1245.0 599.0,1244.4ZM541.3,1154.7C540.6,1153.2 540.0,1151.9 540.0,1151.8C540.0,1151.6 539.4,1150.2 538.7,1148.6C536.7,1144.4 530.6,1126.9 528.0,1118.0C527.4,1115.9 526.7,1113.7 526.5,1113.0C525.2,1108.7 520.9,1092.2 519.5,1086.2C515.3,1066.9 511.3,1042.3 509.5,1024.2C509.2,1021.2 508.8,1016.6 508.5,1014.0C508.2,1011.4 507.4,1001.8 506.7,992.8C506.1,983.7 505.1,972.0 504.7,966.8C504.2,960.9 504.0,955.1 504.2,951.5C504.4,948.3 504.2,933.6 503.8,918.8C502.2,859.1 501.6,828.8 501.0,752.8C500.5,689.6 500.0,660.5 498.7,619.5C497.7,586.3 498.1,562.1 500.0,544.0C502.5,520.3 504.4,509.0 508.3,493.2C512.3,477.5 516.9,466.2 521.7,460.4C524.7,456.8 529.4,453.1 533.1,451.6C536.0,450.3 542.3,449.3 544.8,449.8C557.2,451.8 564.6,457.9 570.2,470.8C579.2,491.4 585.3,525.2 587.0,563.8C587.7,577.1 587.5,601.4 586.5,631.8C585.5,663.1 585.0,694.5 585.0,723.8C585.0,740.2 584.8,765.2 584.5,779.2C584.2,793.3 583.8,820.7 583.5,840.2C582.8,891.9 581.5,944.6 580.5,962.8C577.4,1019.9 575.1,1041.5 567.9,1077.2C566.8,1082.8 565.6,1088.5 565.3,1090.0C564.3,1093.9 561.1,1106.1 560.0,1110.2C559.4,1112.2 558.8,1114.5 558.5,1115.5C555.4,1126.6 548.9,1145.3 545.5,1152.8C544.9,1154.0 544.3,1155.6 544.0,1156.2C543.3,1158.1 542.7,1157.8 541.3,1154.7ZM426.9,984.8C426.7,983.9 424.9,979.5 422.9,975.0C417.2,962.4 415.5,956.7 415.5,949.5C415.5,944.6 416.9,937.7 419.5,930.3C423.6,918.4 425.1,905.6 423.8,891.2C422.9,880.9 422.6,878.9 421.8,879.1C421.5,879.3 421.3,882.6 421.4,889.8C421.7,904.9 420.2,916.2 416.5,928.5C412.6,941.3 411.8,947.3 412.8,955.5C413.8,962.9 415.8,968.3 420.4,975.8C421.9,978.2 423.8,981.7 424.6,983.4C426.1,986.8 427.3,987.5 426.9,984.8ZM660.3,985.1C660.7,984.4 662.4,981.4 664.0,978.5C671.7,965.0 673.2,960.2 673.2,949.5C673.2,941.9 672.8,939.2 670.3,931.1C665.7,916.6 664.0,904.7 664.0,887.1C664.0,882.5 663.8,879.0 663.5,879.0C662.9,879.0 662.6,880.9 662.0,887.8C660.7,903.7 662.0,915.9 666.5,930.5C670.8,944.2 671.3,949.0 669.5,957.1C668.3,962.4 666.8,966.7 664.0,972.8C660.1,981.1 658.2,986.5 659.0,986.5C659.3,986.5 659.9,985.9 660.3,985.1ZM410.5,765.3C410.5,765.1 409.4,763.8 408.0,762.2C398.5,751.8 391.7,738.6 387.5,722.8C384.4,711.0 383.4,696.3 384.5,680.8C385.3,670.3 384.8,666.8 383.6,674.8C382.2,683.4 381.9,688.4 381.9,697.5C381.9,718.7 386.7,736.0 396.6,750.9C401.3,757.9 410.5,767.4 410.5,765.3ZM680.4,761.4C688.0,753.9 693.1,746.1 697.5,735.0C699.5,730.0 700.5,726.5 702.3,718.2C703.9,710.5 704.6,692.9 703.5,684.0C702.4,674.8 701.8,671.7 701.2,670.5C700.4,669.1 700.3,668.0 701.6,687.5C702.1,696.2 701.7,705.0 700.5,712.1C698.8,722.1 698.1,725.0 695.5,732.6C693.9,737.3 689.0,747.2 686.4,751.0C684.3,754.0 679.5,760.2 677.0,763.1C673.6,766.9 675.8,765.9 680.4,761.4ZM387.4,578.1C387.7,576.3 388.2,572.8 388.5,570.5C389.1,566.2 390.1,560.7 391.0,557.5C392.4,551.9 393.1,549.6 393.5,548.8C393.7,548.2 394.6,545.8 395.5,543.5C400.8,529.8 409.2,516.4 418.8,506.5C421.4,503.8 423.5,501.5 423.5,501.3C423.5,500.5 420.5,502.6 416.9,505.9C409.2,513.1 401.7,523.5 396.5,534.2C390.5,546.5 388.2,555.2 386.5,570.8C385.9,576.4 385.9,581.5 386.5,581.5C386.7,581.5 387.1,580.0 387.4,578.1ZM699.4,572.3C698.8,563.5 697.7,557.7 695.0,547.8C694.5,546.0 694.1,544.7 693.4,543.0C693.1,542.3 692.7,541.3 692.5,540.8C689.3,532.7 682.3,520.9 676.6,514.0C672.0,508.5 663.4,500.9 662.6,501.7C662.5,501.9 664.5,504.2 667.2,506.9C683.9,523.5 695.1,548.5 698.0,575.7C698.3,578.4 698.7,580.9 698.9,581.2C699.6,582.4 699.9,578.2 699.4,572.3ZM630.2,424.5C622.4,420.4 608.1,415.3 600.0,413.8C582.2,410.4 566.4,410.2 548.8,413.1C544.2,413.8 541.5,413.8 537.2,413.1C519.7,410.0 501.4,410.4 485.5,414.1C474.4,416.7 464.0,420.3 455.8,424.4C453.4,425.6 451.3,426.5 451.2,426.3C451.0,426.2 451.3,425.4 451.9,424.7C452.4,423.9 453.5,421.8 454.2,420.0C455.0,418.2 456.6,414.6 457.8,412.1C459.0,409.5 460.0,407.3 460.0,407.2C460.0,407.1 460.7,405.6 461.5,403.7C462.3,401.9 463.0,400.4 463.0,400.2C463.0,400.1 463.6,398.6 464.4,396.9C465.8,393.9 469.2,385.4 474.3,372.2C482.3,351.6 491.5,321.4 491.5,315.8C491.5,312.8 490.4,315.4 487.5,325.1C484.7,334.3 481.6,343.4 477.7,353.6C476.5,356.9 475.8,356.6 476.2,353.1C476.3,351.5 476.8,342.8 477.2,333.8C479.1,293.1 479.5,285.5 481.0,269.2C482.5,252.8 482.7,251.1 485.5,229.0C486.3,222.5 487.6,212.5 488.3,206.8C488.9,201.0 490.1,192.3 490.8,187.5C493.3,169.4 493.8,163.0 492.7,164.1C492.4,164.5 491.2,169.1 490.3,174.0C489.9,176.3 489.0,181.3 488.3,185.0C486.7,193.7 483.2,214.9 482.5,220.7C481.6,227.8 481.4,227.6 480.0,217.5C478.4,206.3 478.4,191.0 479.9,181.2C484.1,154.6 489.1,139.3 498.8,122.6C502.9,115.7 503.5,114.3 502.6,113.8C501.4,113.0 496.4,119.1 493.7,124.6C491.9,128.3 491.1,128.3 491.2,124.9C491.3,122.9 491.5,122.2 492.2,122.1C492.6,122.0 493.0,121.8 493.0,121.7C493.0,121.6 491.9,120.2 490.7,118.6C483.1,109.3 478.9,99.3 477.5,86.6C476.6,79.2 477.9,66.8 480.3,59.6C482.5,52.9 488.0,44.3 489.4,45.2C489.7,45.4 490.6,47.7 491.5,50.4C493.6,56.7 495.7,60.8 499.8,66.9C505.8,75.6 506.8,77.2 508.6,80.8C509.6,82.7 510.8,85.5 511.2,87.0C512.0,89.7 513.7,100.0 513.4,100.2C509.3,103.4 502.5,110.9 502.5,112.3C502.5,113.7 503.9,112.9 508.8,108.5C520.6,97.9 531.1,92.8 542.5,92.2C546.0,92.0 547.7,92.2 551.7,93.2C560.7,95.5 568.0,99.6 576.9,107.3C581.0,110.8 583.0,112.0 583.0,110.9C583.0,109.9 579.0,105.1 575.9,102.4C573.8,100.6 573.1,99.6 573.3,99.0C573.5,98.6 573.9,96.3 574.3,93.8C575.7,85.1 578.0,80.1 586.3,67.9C590.9,61.3 593.7,55.8 596.1,49.1C596.7,47.3 597.5,45.8 597.9,45.6C599.5,45.0 604.0,51.7 606.3,58.0C609.1,65.9 610.5,77.9 609.6,85.9C608.1,98.3 605.5,105.4 598.2,116.1C595.1,120.7 594.6,121.7 595.2,122.1C596.1,122.6 596.3,126.7 595.5,127.2C595.3,127.4 594.5,126.5 593.8,125.1C592.7,123.0 588.6,117.0 587.3,115.7C587.0,115.4 586.1,114.8 585.4,114.3C583.1,112.8 583.1,114.5 585.4,118.1C596.7,135.8 602.4,151.9 607.0,178.8C608.6,187.7 608.7,205.7 607.3,216.8C606.4,224.2 605.8,226.6 605.3,225.0C605.2,224.6 604.7,221.7 604.3,218.5C601.0,195.6 595.9,167.8 594.8,165.6C594.1,164.3 594.0,164.3 594.0,167.0C594.0,169.9 595.5,182.6 596.7,190.7C597.4,195.1 598.3,201.6 601.5,228.5C602.3,235.5 603.4,243.9 603.8,247.2C606.2,267.6 607.7,290.8 609.5,336.5C609.8,343.8 610.3,351.3 610.6,353.2C611.0,356.1 610.9,357.7 610.3,357.0C610.2,356.8 606.7,347.4 603.8,339.0C602.0,333.9 599.4,325.8 597.8,320.0C595.3,310.8 594.6,313.9 597.0,323.8C600.5,338.0 606.6,357.6 611.2,369.5C619.0,389.4 621.3,395.0 622.6,397.9C623.4,399.6 624.0,401.1 624.0,401.2C624.0,401.5 625.6,405.0 628.3,410.9C629.2,412.9 630.0,414.7 630.0,414.8C630.0,414.9 631.2,417.5 632.8,420.7C634.3,423.9 635.5,426.6 635.5,426.8C635.5,427.2 634.7,426.9 630.2,424.5ZM553.2,360.2C555.2,326.2 555.2,322.7 555.2,231.0C555.2,128.2 554.7,103.9 552.5,105.3C552.2,105.4 552.0,147.5 552.0,218.7C552.0,283.7 551.8,341.0 551.5,353.4C551.2,365.4 551.1,375.5 551.3,375.9C551.9,377.4 552.4,373.3 553.2,360.2ZM534.8,241.3C534.8,153.1 534.6,106.5 534.3,106.5C533.4,106.4 533.1,109.0 532.5,122.2C530.9,158.7 530.5,290.8 531.8,330.8C532.7,360.6 533.7,376.0 534.4,376.0C534.6,376.0 534.8,315.4 534.8,241.3Z"
		},
		al: {
			w: 887,
			h: 1774,
			d: "M446.0,1729.0C452.9,1725.3 461.1,1699.5 468.9,1657.8C484.1,1576.0 491.3,1500.4 489.0,1447.4C487.8,1421.5 486.9,1412.2 483.4,1389.1C482.0,1380.1 481.1,1372.6 481.3,1372.3C481.6,1372.1 484.4,1371.2 487.7,1370.4C496.5,1368.1 512.6,1360.0 521.5,1353.3C536.1,1342.4 548.8,1327.0 560.2,1306.1C561.5,1303.7 562.6,1303.0 564.9,1303.0C581.9,1303.0 595.5,1268.8 585.8,1250.2L583.1,1245.0L585.5,1233.3C590.4,1209.1 591.4,1198.7 591.5,1174.5C591.5,1149.3 590.8,1143.7 585.6,1128.0C582.7,1119.0 582.5,1117.7 582.5,1103.5C582.6,1084.9 583.9,1079.6 595.5,1051.1C606.2,1024.5 611.2,1008.8 615.4,987.6C620.5,962.6 621.5,952.3 621.4,927.0C621.3,885.3 613.3,845.8 595.8,801.0C582.7,767.3 580.2,759.7 578.4,748.2C576.6,736.3 576.7,734.0 580.4,708.0C581.6,699.8 582.4,697.4 586.4,690.6C595.8,674.2 597.8,662.2 592.7,651.8C589.9,646.2 582.1,638.0 579.4,638.0C578.7,638.0 577.8,636.4 577.4,634.2C573.3,610.1 566.7,592.9 554.7,575.0C548.4,565.6 543.1,559.2 530.8,546.4C520.6,535.7 520.6,535.6 517.6,521.4C515.1,509.4 514.2,502.8 510.5,467.5C508.5,448.8 505.4,419.7 503.5,402.7C499.4,366.4 496.0,331.3 496.0,324.9C496.0,322.4 497.1,317.1 498.5,313.0C505.4,292.7 506.5,268.0 501.4,246.5C500.7,243.2 500.0,237.6 500.0,234.1C500.0,228.5 500.4,227.1 503.4,222.6C512.9,208.2 516.0,186.5 511.3,167.5C509.5,160.1 507.6,156.4 504.9,154.9C503.1,154.0 502.4,154.2 500.7,155.8L498.7,157.9L490.8,134.7C486.4,121.9 481.3,106.2 479.4,99.7C476.1,88.2 476.0,87.7 477.5,83.4C480.7,74.0 479.0,66.3 472.3,58.8C470.1,56.4 467.8,53.1 467.1,51.4C465.6,47.6 460.5,42.5 456.7,41.1C455.1,40.5 449.1,40.0 443.3,40.0C434.5,40.0 431.9,40.4 428.3,42.1C424.0,44.2 419.0,50.0 419.0,53.0C419.0,53.9 417.2,56.3 415.0,58.5C409.4,63.9 407.6,69.3 408.5,77.2C410.1,90.8 409.7,93.3 402.0,116.5C398.1,128.6 393.5,141.9 392.0,146.0C390.4,150.1 388.9,154.3 388.6,155.3C388.1,157.0 387.9,157.0 385.6,155.4C383.2,153.9 383.0,153.9 380.6,156.3C377.3,159.6 374.3,169.7 373.5,180.6C372.4,195.4 375.8,210.4 382.8,221.6C386.1,226.9 386.4,228.2 386.4,234.5C386.5,238.3 385.6,245.8 384.5,251.0C383.1,257.8 382.6,264.6 382.6,275.0C382.6,290.6 384.1,300.2 388.7,314.3L391.3,322.1L389.6,341.8C388.6,352.6 385.2,385.8 382.0,415.5C378.7,445.2 375.1,478.1 374.0,488.5C371.6,510.1 367.9,530.3 365.5,535.0C364.6,536.8 358.8,543.6 352.5,550.1C346.3,556.7 338.3,566.2 334.7,571.3C322.8,587.9 313.9,608.6 310.4,628.1C308.9,636.0 308.4,637.3 306.1,638.5C299.4,642.0 292.5,652.3 291.4,660.3C290.3,668.5 294.3,680.9 302.2,693.6C304.9,697.9 306.0,700.8 306.0,703.6C306.0,705.7 306.5,710.4 307.1,714.0C309.3,727.8 309.8,735.7 308.9,744.5C307.6,757.3 306.1,762.4 296.1,787.8C291.2,800.3 285.5,815.5 283.5,821.5C277.7,838.7 271.2,865.9 268.3,885.0C266.0,900.3 265.6,905.6 265.6,927.5C265.5,955.6 266.7,966.7 272.5,993.1C276.7,1011.6 282.7,1030.5 290.5,1049.0C297.8,1066.2 302.5,1080.4 304.0,1090.2C305.7,1100.4 304.9,1118.2 302.6,1123.5C298.1,1133.7 295.8,1147.8 295.3,1168.0C294.6,1192.6 296.9,1214.3 302.5,1238.6C303.9,1244.8 303.9,1245.3 302.1,1247.8C298.7,1252.7 297.7,1257.8 298.3,1267.4C299.4,1287.2 309.8,1303.0 321.8,1303.0C324.6,1303.0 325.3,1303.6 327.4,1307.8C336.1,1324.9 356.3,1348.0 371.0,1357.5C379.6,1363.1 390.8,1368.2 399.4,1370.4C402.6,1371.3 405.5,1372.2 405.8,1372.4C406.0,1372.7 405.5,1376.9 404.6,1381.7C399.4,1410.6 397.5,1433.6 397.6,1470.0C397.6,1511.6 400.4,1543.6 409.0,1604.0C417.3,1661.6 426.7,1704.3 434.7,1720.5C439.0,1729.1 441.8,1731.2 446.0,1729.0ZM439.2,1720.2C429.6,1702.1 417.8,1644.5 408.6,1570.5C400.3,1504.0 399.1,1456.1 404.5,1409.0C409.5,1366.1 419.7,1335.0 433.6,1320.2C436.5,1317.1 438.8,1314.4 438.6,1314.2C437.9,1313.6 430.6,1318.6 427.9,1321.6C421.4,1328.6 414.9,1342.1 410.0,1358.5C407.4,1367.3 407.3,1367.5 404.4,1367.2C399.3,1366.7 386.8,1362.1 379.8,1358.2C340.4,1336.2 313.0,1285.1 301.8,1212.8C299.9,1201.0 299.6,1194.3 299.5,1174.0C299.5,1150.5 299.7,1149.0 302.3,1138.6C306.1,1123.6 311.6,1110.6 321.7,1093.2C326.4,1085.2 323.0,1089.0 316.0,1099.6L309.0,1110.2L309.0,1102.7C309.0,1087.5 304.8,1071.7 294.2,1047.0C276.3,1005.4 267.9,962.2 269.3,919.5C270.6,880.3 279.5,840.7 297.0,796.5C314.5,752.2 334.4,694.1 332.7,692.4C332.5,692.1 330.6,696.6 328.6,702.2C326.6,707.9 322.6,718.4 319.7,725.7L314.5,738.8L312.8,725.7C308.8,694.9 308.6,690.6 309.9,671.6C311.3,650.4 313.4,632.6 315.5,623.7C319.3,607.1 327.7,588.1 337.3,574.1C342.1,567.2 362.8,544.5 363.6,545.3C363.8,545.5 362.1,552.4 359.9,560.6C354.8,579.0 354.6,580.0 355.8,578.0C356.3,577.2 359.7,567.7 363.3,557.0C370.8,535.0 375.1,515.7 377.4,493.5C378.3,485.2 381.9,452.2 385.5,420.0C389.0,387.8 392.6,353.4 393.5,343.5C396.6,307.6 398.1,294.2 400.6,279.7C402.0,271.5 402.9,264.6 402.7,264.3C402.0,263.6 397.0,285.4 394.5,300.5L392.3,313.4L390.1,305.2C386.7,292.5 385.4,276.3 386.8,263.2C387.7,253.9 391.4,235.4 392.6,234.1C392.8,233.9 395.3,236.3 398.3,239.4C401.2,242.5 404.2,245.0 405.0,245.0C406.1,245.0 406.0,244.5 404.5,243.2C403.4,242.3 401.6,240.4 400.5,239.1C398.5,236.7 398.5,236.7 400.5,237.4C401.6,237.8 399.2,234.9 395.2,231.0C387.5,223.4 382.7,215.4 379.4,204.4C376.6,195.3 376.8,175.8 379.8,166.3C381.0,162.3 382.5,158.8 383.0,158.5C383.5,158.2 385.4,160.5 387.2,163.7C389.0,166.8 394.4,174.2 399.3,180.0C409.3,191.9 412.1,196.7 415.0,207.1C417.9,217.8 417.9,217.7 410.4,240.0C410.1,240.8 410.8,240.2 411.9,238.5C415.0,233.8 419.1,220.4 419.4,213.7C419.7,207.9 419.9,207.6 423.3,205.8C428.5,203.2 437.6,201.0 443.5,201.0C449.3,201.0 458.5,203.2 463.6,205.8C467.0,207.5 467.1,207.8 467.4,214.0C467.8,220.5 470.6,230.1 474.2,237.3C477.4,243.6 477.2,240.9 473.9,232.4C469.5,221.1 469.1,215.0 472.3,204.8C475.2,195.4 478.3,190.4 486.8,180.7C492.7,174.0 495.4,170.4 500.5,162.1L503.3,157.6L505.0,161.1C507.8,166.5 509.3,175.6 509.3,186.5C509.3,204.9 504.1,218.2 492.4,229.7C485.7,236.2 483.3,239.2 486.0,237.5C488.5,236.0 486.7,239.1 483.5,241.9C480.9,244.2 480.4,245.0 481.7,245.0C482.6,245.0 485.8,242.5 488.7,239.4L493.9,233.7L495.0,236.4C496.8,241.2 499.9,258.3 500.5,267.5C501.3,278.2 499.7,294.9 497.0,304.5C495.9,308.2 494.9,311.5 494.7,311.7C494.4,311.9 493.7,308.4 493.1,303.8C491.6,293.8 485.2,265.1 483.8,263.0C483.1,261.8 483.0,261.9 483.4,263.5C486.6,276.0 489.5,298.2 492.5,333.5C493.9,350.0 497.3,383.3 500.0,407.5C502.7,431.7 505.7,458.7 506.5,467.5C510.6,509.8 513.5,526.0 520.7,548.5C526.4,566.1 531.1,579.2 531.6,578.7C531.8,578.5 530.7,573.9 529.1,568.4C527.4,563.0 525.2,555.1 524.1,551.0L522.1,543.5L532.8,554.6C553.6,576.0 566.4,599.7 572.0,626.8C573.1,632.2 574.9,647.6 576.1,661.0C578.4,687.7 578.2,695.4 574.9,717.8C573.9,725.1 573.0,733.2 573.0,735.8C572.9,740.2 572.6,739.6 566.6,724.4C563.1,715.6 559.0,704.5 557.5,699.9C552.9,686.2 553.6,692.4 558.4,708.7C564.0,727.3 576.6,762.9 586.6,788.3C615.5,861.2 623.5,914.1 614.4,972.0C610.4,997.4 604.2,1018.6 591.5,1050.0C581.8,1074.1 578.9,1084.5 578.1,1099.4L577.5,1110.3L571.2,1100.2C567.7,1094.6 564.5,1089.8 564.0,1089.5C563.4,1089.2 566.4,1095.3 570.5,1103.2C584.7,1130.6 588.7,1148.3 587.7,1180.5C586.0,1235.1 568.8,1291.3 543.1,1325.5C526.5,1347.7 504.5,1362.8 482.4,1367.4L479.3,1368.1L477.1,1359.8C472.8,1344.0 465.1,1328.0 458.7,1321.2C456.0,1318.4 449.3,1314.0 447.6,1314.0C447.4,1314.0 449.5,1316.4 452.3,1319.3C473.3,1340.8 485.3,1395.4 485.3,1469.0C485.3,1499.6 483.5,1526.3 479.0,1564.2C469.0,1647.9 455.4,1712.7 445.2,1724.2C444.4,1725.2 443.4,1726.0 443.0,1726.0C442.6,1726.0 440.9,1723.4 439.2,1720.2ZM444.7,1000.0C444.7,849.0 444.5,717.4 444.1,707.5C443.5,689.6 443.5,689.5 442.5,697.5C441.1,708.5 441.1,1290.9 442.5,1300.5C443.4,1307.3 443.5,1307.1 444.1,1291.0C444.4,1281.9 444.7,1151.0 444.7,1000.0ZM316.2,1297.3C311.4,1295.0 308.2,1290.2 304.9,1280.8C302.8,1274.8 302.0,1270.6 302.0,1265.6C302.0,1258.9 303.6,1251.0 305.0,1251.0C305.4,1251.0 306.3,1253.6 307.0,1256.8C308.6,1264.2 316.4,1285.9 320.1,1293.2C322.7,1298.3 322.8,1299.0 321.3,1299.0C320.3,1299.0 318.0,1298.2 316.2,1297.3ZM566.6,1293.2C569.8,1286.2 578.4,1262.4 580.3,1255.5C581.6,1250.5 581.6,1250.5 583.0,1253.0C585.5,1257.6 585.5,1269.0 583.0,1277.1C579.3,1289.5 575.1,1295.5 568.7,1297.9C564.1,1299.7 563.9,1299.3 566.6,1293.2ZM300.8,683.0C294.3,669.8 293.6,661.7 298.0,653.0C300.0,649.1 306.8,641.5 307.6,642.3C308.0,642.6 305.7,677.7 304.7,688.0C304.5,690.0 303.7,689.0 300.8,683.0ZM581.5,689.1C582.0,688.2 581.0,669.5 579.4,649.0L578.9,641.5L583.9,646.6C590.3,653.2 592.6,660.2 591.1,668.4C590.0,674.4 583.3,690.0 581.8,690.0C581.3,690.0 581.1,689.6 581.5,689.1ZM444.9,469.0C445.0,306.0 444.4,250.6 442.7,259.0C441.4,265.1 441.2,648.5 442.5,660.5C443.5,669.3 443.5,669.1 444.1,648.5C444.4,637.0 444.8,556.2 444.9,469.0ZM415.3,196.2C413.6,192.5 409.5,186.4 406.3,182.6C394.4,168.4 392.0,164.9 392.0,161.0C392.0,157.0 395.1,147.0 397.5,143.3C398.3,142.1 399.0,140.2 399.0,139.2C399.0,138.2 401.3,130.8 404.1,122.9C409.3,108.2 415.3,86.1 416.3,78.0L416.9,73.5L415.2,77.3C413.0,82.1 412.0,81.2 412.0,74.5C412.0,70.6 412.7,68.4 414.7,65.2C416.2,62.9 418.0,61.0 418.7,61.0C419.5,61.0 420.7,59.3 421.6,57.3C424.8,49.7 425.6,48.5 429.0,46.2C432.3,44.0 433.3,43.9 444.1,44.2C454.9,44.5 455.9,44.7 459.3,47.2C461.2,48.8 463.1,51.0 463.5,52.2C464.7,56.6 467.3,61.9 468.0,61.5C469.0,60.9 472.7,65.1 473.9,68.3C475.2,71.6 475.3,78.9 474.2,80.8C473.6,81.7 472.9,80.7 472.1,77.9C468.8,66.8 470.7,82.3 474.6,97.3C476.7,105.9 487.7,139.3 490.7,146.2C494.3,154.8 495.7,162.4 494.1,165.2C493.5,166.5 489.1,172.1 484.4,177.5C475.5,188.0 472.2,193.0 469.9,199.3C468.4,203.5 468.9,203.5 459.5,199.9C454.6,197.9 451.6,197.5 443.0,197.6C433.9,197.6 431.6,197.9 425.9,200.3C422.3,201.8 419.1,203.0 418.9,203.0C418.7,203.0 417.0,200.0 415.3,196.2Z"
		}
	};
	// equo-app-src/src/ruoli/veterinario/moduli/13b-mappe-disegni.js
	var MP_DISEGNI_2 = {
		denti: {
			w: 887,
			h: 1774,
			d: "M192.1,1518.3C198.5,1515.1 202.2,1511.2 204.4,1505.5C204.8,1504.4 205.3,1496.6 205.6,1488.1C206.0,1470.3 205.2,1467.1 198.3,1460.9C190.9,1454.3 186.9,1453.5 158.5,1453.5L133.5,1453.5L126.7,1456.8C121.7,1459.3 119.2,1461.3 116.8,1464.8L113.5,1469.5L113.2,1485.5C112.8,1504.1 113.5,1507.4 119.1,1513.5C122.8,1517.5 126.4,1519.4 134.5,1521.4C135.6,1521.6 147.5,1521.8 161.0,1521.7L185.5,1521.5L192.1,1518.3ZM759.0,1519.7C764.6,1517.5 769.7,1512.7 772.0,1507.5C773.5,1504.2 773.8,1500.6 773.9,1488.0C773.9,1473.9 773.7,1472.1 771.6,1467.4C768.8,1461.3 764.4,1457.7 756.4,1454.9C751.1,1453.0 748.7,1452.9 726.1,1453.2C702.9,1453.5 701.2,1453.7 696.4,1455.8C693.6,1457.1 689.7,1459.8 687.7,1461.8C681.6,1468.0 681.0,1470.8 681.4,1488.4C681.7,1502.6 681.9,1504.4 684.2,1508.7C685.9,1512.0 688.1,1514.4 691.4,1516.4C699.1,1521.2 704.8,1521.9 731.0,1521.6C750.5,1521.4 755.3,1521.1 759.0,1519.7ZM131.1,1514.5C126.4,1513.0 122.5,1509.9 120.5,1506.0C119.0,1503.0 117.9,1476.9 119.1,1472.6C120.2,1468.8 124.4,1464.4 129.5,1461.7C133.3,1459.6 134.8,1459.5 159.0,1459.5L184.5,1459.5L190.0,1462.6C193.0,1464.3 196.5,1467.2 197.7,1469.0C199.8,1472.1 199.9,1473.0 199.6,1488.2C199.3,1502.2 199.0,1504.6 197.3,1506.9C194.7,1510.3 189.6,1513.7 185.1,1515.0C179.5,1516.5 136.4,1516.2 131.1,1514.5ZM700.1,1514.5C694.6,1512.8 689.2,1507.7 688.1,1503.0C687.6,1501.1 687.2,1493.2 687.3,1485.4C687.5,1471.8 687.6,1471.2 690.2,1467.8C691.7,1465.8 695.1,1463.1 697.7,1461.9C702.2,1459.6 703.7,1459.5 725.4,1459.2C750.4,1458.8 755.3,1459.5 760.8,1463.7C767.3,1468.6 768.0,1470.8 768.0,1487.3C768.0,1506.8 766.2,1510.9 756.1,1514.5C750.2,1516.5 706.8,1516.6 700.1,1514.5ZM193.8,1442.1C199.4,1439.6 204.2,1434.9 206.4,1429.7C207.2,1427.8 208.0,1420.2 208.4,1411.5C209.1,1396.9 209.1,1396.4 206.7,1392.0C203.8,1386.4 197.5,1381.5 190.7,1379.5C182.7,1377.1 149.7,1375.4 140.9,1376.9C129.7,1378.9 121.5,1385.7 119.0,1394.9C118.5,1396.9 118.0,1404.4 117.9,1411.6C117.7,1423.4 117.9,1425.2 119.9,1429.4C122.8,1435.2 128.1,1439.7 134.6,1441.6C141.0,1443.4 161.0,1444.9 176.5,1444.6C186.5,1444.4 189.4,1444.0 193.8,1442.1ZM745.9,1442.9C753.8,1441.7 758.6,1439.3 763.3,1434.1C768.4,1428.4 769.3,1424.6 768.9,1408.9C768.5,1396.8 768.2,1394.9 765.9,1390.5C763.0,1384.8 756.8,1379.6 750.7,1377.8C747.8,1376.9 741.0,1376.6 729.0,1376.7C699.8,1377.1 690.4,1379.4 683.1,1387.6C677.8,1393.7 676.9,1397.9 677.9,1413.0C678.8,1426.9 680.3,1431.6 685.3,1436.8C689.0,1440.7 692.4,1442.6 697.7,1444.0C702.2,1445.1 736.6,1444.3 745.9,1442.9ZM158.5,1438.3C137.7,1437.2 129.9,1434.8 125.7,1428.0C123.7,1424.8 123.5,1423.5 123.8,1410.6C124.2,1391.9 126.5,1387.6 138.1,1383.5C146.1,1380.6 182.5,1382.3 190.6,1386.0C201.6,1390.8 203.4,1394.8 202.5,1411.9C201.6,1426.3 201.1,1428.2 196.7,1432.8C191.2,1438.5 183.6,1439.6 158.5,1438.3ZM697.7,1437.8C692.5,1436.4 686.5,1430.5 685.1,1425.5C684.6,1423.3 684.0,1416.1 683.8,1409.5C683.5,1398.4 683.7,1397.2 685.8,1393.8C690.8,1385.8 699.0,1383.3 724.3,1382.4C744.0,1381.7 748.7,1382.3 755.1,1386.5C761.3,1390.5 762.9,1395.4 763.1,1410.5C763.3,1425.1 762.5,1428.1 756.8,1432.3C751.6,1436.1 747.5,1437.1 732.0,1438.0C713.9,1439.2 702.6,1439.1 697.7,1437.8ZM738.4,1366.1C747.5,1364.8 755.1,1361.0 759.0,1355.7C763.8,1349.2 764.4,1345.4 763.0,1330.5C761.3,1312.3 757.7,1306.1 746.5,1301.8C739.6,1299.1 733.0,1298.9 714.4,1300.4C694.2,1302.1 685.5,1304.3 679.8,1309.0C675.8,1312.3 672.3,1318.8 671.9,1323.5C671.6,1327.9 672.9,1343.8 674.1,1349.2C676.6,1360.3 684.7,1367.5 696.2,1368.8C702.2,1369.5 723.5,1368.1 738.4,1366.1ZM195.2,1368.0C204.5,1365.4 213.0,1354.5 213.0,1345.3C213.0,1342.9 213.5,1337.8 214.1,1334.0C216.2,1321.7 213.1,1313.1 204.6,1307.6C198.2,1303.4 191.9,1302.0 172.5,1300.3C147.8,1298.2 138.2,1299.9 130.8,1307.7C125.8,1313.0 124.2,1318.3 123.5,1333.0C122.8,1346.2 122.8,1346.7 125.3,1351.5C131.0,1362.7 136.6,1364.9 169.0,1368.3C176.7,1369.1 191.7,1368.9 195.2,1368.0ZM169.5,1362.4C148.5,1360.2 142.9,1359.1 137.6,1356.1C131.9,1352.9 128.9,1348.1 128.7,1342.2C128.5,1333.6 130.4,1319.3 132.2,1315.8C136.7,1306.7 146.7,1304.0 169.5,1306.0C187.3,1307.4 192.9,1308.4 197.7,1310.7C203.3,1313.3 207.7,1318.3 208.5,1322.9C209.1,1326.3 208.2,1337.1 206.4,1349.7C206.1,1351.6 204.4,1354.4 201.9,1356.9C195.4,1363.4 189.1,1364.5 169.5,1362.4ZM694.8,1362.6C689.0,1361.0 685.8,1359.0 682.5,1354.6C680.2,1351.6 679.7,1349.6 678.9,1340.3C678.4,1334.4 677.8,1328.9 677.5,1328.1C676.6,1325.9 678.9,1319.3 681.7,1316.0C687.0,1309.6 693.5,1307.9 718.6,1305.9C738.9,1304.4 746.4,1306.0 752.4,1313.0C755.6,1316.9 756.7,1321.0 757.5,1333.7C758.3,1346.1 757.3,1349.7 751.9,1354.3C746.9,1358.6 743.2,1359.7 726.9,1361.4C704.2,1363.8 699.8,1364.0 694.8,1362.6ZM207.8,1292.4C216.6,1288.0 219.3,1283.4 222.4,1266.9C224.5,1255.4 224.4,1250.5 221.9,1245.3C217.8,1236.8 209.4,1232.2 190.7,1228.3C182.1,1226.5 175.1,1225.7 167.0,1225.6C156.5,1225.5 155.0,1225.7 150.5,1228.1C144.8,1231.0 139.5,1237.4 138.2,1242.8C136.4,1250.3 134.5,1262.6 134.6,1266.7C134.9,1275.6 141.8,1284.2 151.8,1287.8C158.2,1290.2 186.2,1294.8 194.6,1294.9C201.3,1295.0 203.4,1294.6 207.8,1292.4ZM713.7,1292.5C734.7,1288.9 738.5,1287.6 744.7,1281.5C752.4,1274.0 753.0,1270.7 750.0,1253.0C748.2,1241.9 746.2,1237.0 741.6,1232.4C736.8,1227.5 729.7,1225.0 720.7,1225.0C714.4,1225.0 690.7,1229.0 682.4,1231.5C668.0,1235.7 659.6,1248.3 662.9,1260.6C663.5,1262.8 664.4,1267.9 665.0,1272.0C666.6,1283.6 671.5,1290.3 680.9,1293.6C686.5,1295.6 697.5,1295.2 713.7,1292.5ZM188.0,1289.3C173.8,1286.9 157.6,1283.6 154.0,1282.4C148.3,1280.5 142.3,1274.7 140.9,1269.6C140.1,1266.6 140.2,1263.5 141.5,1256.1C143.8,1243.0 145.6,1238.4 149.3,1235.6C156.7,1230.2 165.7,1229.7 185.9,1233.6C200.0,1236.3 208.1,1238.9 211.7,1241.9C215.3,1244.9 218.0,1250.3 218.0,1254.4C218.0,1258.7 215.3,1274.0 213.7,1278.2C210.8,1286.4 199.5,1291.3 188.0,1289.3ZM683.9,1288.4C678.4,1286.7 673.5,1281.7 672.1,1276.3C671.6,1274.2 670.4,1268.5 669.5,1263.6C667.4,1252.5 668.5,1247.6 673.8,1242.9C679.0,1238.3 683.9,1236.6 700.0,1233.6C719.2,1230.1 726.0,1230.2 733.1,1233.8C739.9,1237.2 741.6,1240.2 743.7,1252.1C746.3,1266.4 746.1,1270.9 742.6,1275.4C738.3,1281.1 731.9,1283.5 711.7,1286.9C691.7,1290.4 690.4,1290.4 683.9,1288.4ZM702.9,1219.4C724.9,1213.4 729.6,1210.8 734.3,1202.1C737.8,1195.7 737.8,1190.2 734.0,1177.3C730.4,1164.7 729.0,1162.0 724.3,1158.1C718.8,1153.5 712.1,1151.7 703.6,1152.2C696.6,1152.7 676.7,1158.0 667.8,1161.9C658.8,1165.7 652.1,1173.7 650.6,1182.4C649.7,1187.1 655.8,1208.3 659.8,1214.3C664.3,1221.1 674.1,1225.3 683.0,1224.2C684.9,1224.0 693.9,1221.8 702.9,1219.4ZM218.8,1220.9C224.4,1217.7 229.3,1211.4 230.6,1205.6C230.9,1203.9 232.3,1199.2 233.6,1195.2C236.6,1186.1 236.6,1181.8 233.6,1175.5C229.6,1166.8 224.6,1163.6 204.5,1156.9C192.8,1153.0 190.5,1152.6 181.5,1152.6C173.0,1152.5 170.9,1152.8 167.4,1154.7C160.2,1158.5 156.8,1163.6 153.0,1176.2C148.7,1190.1 148.6,1195.9 152.4,1202.4C157.2,1210.6 161.3,1212.8 184.0,1219.6C202.9,1225.2 210.9,1225.5 218.8,1220.9ZM191.0,1215.4C167.6,1208.6 166.4,1208.1 161.8,1204.1C158.6,1201.2 156.9,1198.8 156.0,1195.6C154.9,1191.5 155.1,1190.3 158.4,1178.9C160.9,1170.3 162.8,1165.8 164.7,1163.8C171.6,1156.6 181.1,1155.9 199.2,1161.4C205.6,1163.4 212.8,1165.9 215.3,1166.9C223.9,1170.6 230.0,1177.9 230.0,1184.6C230.0,1186.0 228.4,1192.3 226.5,1198.4C222.8,1210.2 219.8,1214.6 213.7,1216.9C209.1,1218.7 200.1,1218.1 191.0,1215.4ZM670.5,1216.2C664.9,1212.6 662.9,1209.4 659.9,1199.1C653.2,1175.7 657.1,1170.4 687.8,1161.5C703.5,1157.0 710.4,1156.9 717.4,1160.8C720.4,1162.5 723.0,1164.8 724.1,1167.0C726.9,1172.4 731.0,1187.3 731.0,1192.1C731.0,1200.1 725.0,1206.5 714.4,1209.9C690.1,1217.8 676.1,1219.8 670.5,1216.2ZM234.8,1152.1C239.2,1149.8 245.5,1143.3 246.5,1139.9C246.9,1138.6 248.7,1134.0 250.6,1129.7C257.9,1112.9 253.3,1100.7 236.2,1092.1C227.0,1087.4 213.0,1082.3 206.5,1081.1C201.6,1080.2 199.3,1080.3 194.6,1081.5C184.0,1084.3 181.2,1087.4 174.5,1103.9C169.1,1117.3 168.7,1122.1 172.6,1129.9C176.1,1136.8 181.5,1140.3 199.0,1147.1C220.7,1155.5 226.5,1156.3 234.8,1152.1ZM667.8,1154.0C673.1,1152.7 698.0,1143.6 702.9,1141.0C711.0,1136.8 717.0,1127.9 717.0,1120.0C717.0,1114.2 708.0,1092.7 703.8,1088.3C694.4,1078.5 683.8,1078.1 662.7,1086.5C644.7,1093.8 638.1,1098.4 634.4,1106.5C631.3,1113.0 631.4,1118.9 634.6,1126.5C636.0,1129.8 637.8,1134.6 638.7,1137.2C642.0,1147.0 651.6,1154.7 661.0,1154.9C662.4,1154.9 665.4,1154.5 667.8,1154.0ZM212.0,1145.6C187.7,1137.1 181.8,1133.9 177.9,1127.6C175.0,1122.9 175.5,1117.0 179.6,1106.6C184.4,1094.5 186.5,1091.3 190.9,1089.1C199.1,1084.9 205.6,1085.7 222.8,1092.6C238.7,1099.0 245.9,1104.8 247.9,1112.5C249.1,1117.2 248.0,1122.0 244.0,1130.0C243.1,1131.9 242.0,1134.7 241.6,1136.2C240.2,1142.4 231.3,1148.9 224.5,1149.0C222.8,1149.0 217.2,1147.5 212.0,1145.6ZM655.0,1147.5C649.7,1145.1 646.2,1141.2 644.4,1135.6C643.4,1132.8 641.6,1128.2 640.3,1125.5C635.7,1115.5 638.4,1106.2 647.7,1100.2C653.8,1096.3 673.7,1088.2 680.4,1086.9C687.2,1085.6 693.8,1087.2 698.4,1091.3C701.1,1093.7 703.1,1097.3 706.6,1106.0C712.0,1119.5 712.1,1123.8 707.3,1129.8C703.4,1134.6 699.4,1136.8 682.5,1143.0C666.8,1148.8 660.3,1149.9 655.0,1147.5ZM262.3,1096.6C270.4,1093.3 281.9,1074.7 284.1,1061.5C285.2,1055.2 285.1,1053.6 283.1,1046.0C280.7,1036.6 274.5,1024.8 268.8,1018.9C264.9,1014.9 260.1,1013.3 255.4,1014.4C252.0,1015.3 244.1,1023.5 239.7,1030.7C233.8,1040.3 231.7,1048.1 232.2,1058.1C232.6,1065.7 233.1,1067.7 236.7,1075.1C241.8,1085.8 248.2,1093.7 253.4,1096.1C258.3,1098.3 258.3,1098.3 262.3,1096.6ZM637.0,1092.4C645.5,1084.4 652.3,1072.0 654.1,1061.0C656.0,1049.1 650.7,1033.7 640.8,1022.6C630.9,1011.4 624.3,1011.1 615.2,1021.5C607.3,1030.5 601.0,1045.8 601.0,1056.0C601.0,1066.4 608.1,1082.0 617.0,1091.2C622.3,1096.7 622.9,1097.0 627.3,1097.0C631.6,1097.0 632.6,1096.5 637.0,1092.4ZM251.2,1086.4C241.5,1076.4 235.9,1060.9 238.1,1050.0C240.3,1038.8 249.5,1023.9 256.1,1020.4C259.1,1018.9 259.4,1018.9 261.9,1020.7C266.4,1024.1 271.9,1032.2 275.2,1040.5C280.9,1054.9 279.4,1066.2 269.8,1080.5C264.7,1088.2 260.9,1092.0 258.2,1092.0C257.3,1092.0 254.2,1089.5 251.2,1086.4ZM620.8,1086.9C618.1,1084.0 614.1,1078.0 611.9,1073.5C605.0,1059.7 605.5,1049.4 613.7,1033.8C618.0,1025.5 625.1,1018.6 628.3,1019.5C631.9,1020.5 640.7,1030.5 643.8,1037.2C649.6,1049.5 650.1,1057.0 646.0,1068.8C642.7,1078.0 631.5,1092.0 627.2,1092.0C626.3,1092.0 623.4,1089.7 620.8,1086.9ZM326.4,1049.0C343.0,1042.7 346.3,1034.4 340.0,1014.6C336.5,1003.8 334.3,1000.5 328.6,997.9C323.1,995.4 319.6,995.5 309.8,998.6C299.1,1002.0 295.3,1004.0 291.0,1008.5C287.7,1012.0 287.5,1012.4 287.5,1019.4C287.5,1026.1 287.8,1027.1 291.3,1032.4C297.1,1041.2 302.0,1046.1 307.5,1048.6C313.7,1051.5 319.3,1051.6 326.4,1049.0ZM578.5,1048.6C586.4,1045.0 596.3,1032.7 599.1,1023.2C601.6,1014.6 596.7,1007.0 585.1,1001.7C568.9,994.4 556.2,995.0 551.0,1003.5C548.5,1007.7 543.0,1026.0 543.0,1030.3C543.0,1037.4 546.4,1042.6 553.5,1046.3C563.5,1051.4 571.0,1052.2 578.5,1048.6ZM309.5,1043.6C305.3,1041.8 298.6,1033.9 295.0,1026.6C292.4,1021.4 292.1,1020.0 293.0,1017.1C294.7,1011.0 298.7,1008.1 310.9,1004.1C320.1,1001.1 325.4,1001.3 329.0,1004.8C332.5,1008.4 337.3,1022.5 337.4,1029.7C337.4,1034.1 337.0,1035.4 334.6,1037.9C329.0,1043.7 316.4,1046.6 309.5,1043.6ZM558.4,1042.1C555.0,1040.5 551.5,1038.2 550.6,1036.9C547.7,1032.7 548.8,1024.8 554.2,1010.2C556.4,1004.4 559.6,1002.0 565.3,1002.0C573.6,1002.0 590.1,1009.3 592.6,1014.1C593.4,1015.7 594.0,1018.2 594.0,1019.7C594.0,1025.6 582.6,1041.0 576.3,1043.6C571.1,1045.8 565.2,1045.3 558.4,1042.1ZM377.3,1038.0C387.3,1035.1 391.7,1026.2 390.7,1010.7C390.4,1005.8 390.3,1001.9 390.4,1002.1C390.6,1002.3 391.8,1007.4 393.0,1013.3C396.8,1031.3 400.4,1034.5 417.0,1034.5C425.7,1034.5 428.2,1034.1 431.5,1032.4C439.5,1028.2 442.2,1020.5 442.4,1000.8C442.5,990.4 442.3,988.9 440.4,986.3C436.4,981.0 432.5,979.6 420.9,979.2C401.9,978.5 393.1,982.4 390.5,992.6L389.3,997.5L388.6,994.2C388.2,992.5 386.5,989.7 384.9,988.1C380.8,984.0 375.1,983.0 364.7,984.5C348.2,986.9 341.4,990.8 338.9,998.9C337.7,1002.8 337.9,1003.8 341.7,1015.4C348.7,1036.4 353.0,1040.6 366.5,1039.6C370.4,1039.3 375.2,1038.6 377.3,1038.0ZM530.4,1038.6C535.4,1036.5 539.2,1031.0 543.4,1019.8C547.9,1007.5 549.0,999.8 546.6,995.3C544.2,990.6 534.8,986.3 522.9,984.6C502.1,981.5 497.1,986.4 496.3,1011.0C495.9,1023.7 496.0,1024.8 498.2,1028.9C499.5,1031.4 501.6,1034.2 503.0,1035.2C508.8,1039.3 524.0,1041.3 530.4,1038.6ZM483.2,1032.3C488.1,1029.5 490.6,1025.0 493.1,1014.7C497.6,995.7 496.7,987.2 489.8,983.0C482.3,978.5 459.1,977.6 451.6,981.6C445.9,984.5 444.0,988.8 444.0,998.5C444.0,1009.1 446.3,1024.0 448.4,1027.3C452.2,1033.0 458.8,1035.1 471.7,1034.6C477.5,1034.3 480.9,1033.7 483.2,1032.3ZM357.3,1033.0C354.5,1031.9 350.1,1023.2 346.6,1012.0C342.2,998.3 344.0,995.0 357.4,991.7C372.8,987.9 379.7,988.6 382.7,994.3C384.0,996.8 384.4,1000.6 384.4,1011.8L384.5,1026.1L381.3,1029.0C379.5,1030.6 376.4,1032.4 374.3,1032.9C369.8,1034.2 360.4,1034.2 357.3,1033.0ZM512.0,1032.8C502.2,1030.0 500.3,1025.3 501.9,1007.7C503.0,994.8 504.3,991.6 508.8,989.9C513.2,988.2 530.6,991.0 537.7,994.6C544.1,997.9 543.9,1003.3 536.8,1021.1C532.6,1031.8 529.9,1034.0 521.7,1033.9C518.3,1033.9 513.9,1033.4 512.0,1032.8ZM406.3,1027.6C402.2,1025.7 400.7,1022.7 398.1,1010.7C395.3,997.8 395.3,991.7 398.1,989.1C402.4,985.2 422.2,983.3 430.5,986.0C437.2,988.2 438.2,993.0 435.9,1011.1C434.0,1026.5 432.3,1028.2 418.5,1028.7C412.2,1028.9 408.5,1028.6 406.3,1027.6ZM459.5,1028.3C455.9,1027.6 452.9,1024.5 451.9,1020.5C451.4,1018.3 450.7,1010.6 450.4,1003.5C449.8,990.6 449.8,990.5 452.2,988.2C455.7,985.0 464.1,983.8 474.8,985.1C490.3,987.0 492.1,989.3 489.5,1003.5C485.1,1026.9 483.4,1029.1 469.6,1028.9C465.1,1028.8 460.6,1028.5 459.5,1028.3ZM434.7,919.3C439.5,916.8 441.8,913.6 442.9,908.0C443.8,903.6 443.8,903.6 443.9,907.0C444.1,912.1 447.1,917.1 451.6,919.4C454.9,921.2 457.3,921.5 467.0,921.4C486.6,921.3 493.9,917.1 494.1,905.6L494.2,900.5L495.4,905.0C498.9,917.4 504.8,920.5 519.5,917.5C533.7,914.6 541.8,909.4 543.6,902.4C545.5,894.7 537.7,869.8 531.8,864.8C527.4,861.0 521.4,860.3 511.1,862.4C498.6,864.9 495.1,867.3 492.4,874.7C491.7,876.8 491.1,877.7 491.0,876.8C491.0,874.0 485.2,868.2 481.2,866.9C479.2,866.2 473.2,865.6 467.9,865.6C459.8,865.6 457.7,866.0 453.5,868.1C446.0,871.8 444.7,874.2 444.0,886.2L443.5,896.5L442.7,887.0C441.7,875.1 439.9,871.3 433.6,868.1C429.6,866.0 427.4,865.7 418.7,865.6C409.7,865.5 407.9,865.8 403.5,868.0C399.7,869.9 398.0,871.5 396.2,875.0L394.0,879.4L394.0,876.1C394.0,873.6 393.1,871.8 390.2,869.0C385.9,864.7 379.0,862.2 369.0,861.4C363.5,860.9 361.8,861.2 358.0,863.2C352.5,866.0 350.9,868.7 345.9,883.6C341.5,896.8 341.3,898.8 343.9,904.7C347.0,911.4 354.6,915.5 368.5,918.0C380.4,920.1 388.4,916.2 390.8,907.3C391.7,903.9 391.8,903.8 391.9,906.3C392.2,914.1 397.4,919.2 407.1,920.9C415.5,922.4 430.4,921.5 434.7,919.3ZM407.0,915.1C401.8,914.0 399.1,912.2 398.4,909.3C398.0,907.8 398.2,900.3 398.9,892.6C399.8,882.0 400.5,877.9 401.9,876.0C406.6,869.6 428.2,869.3 434.1,875.6C436.2,877.8 436.4,879.1 436.8,893.5C437.3,911.2 436.7,913.1 430.3,914.9C426.1,916.1 412.5,916.2 407.0,915.1ZM454.3,914.6C449.7,912.5 448.9,908.4 449.7,891.7C450.2,880.5 450.7,877.4 452.1,875.6C457.0,869.4 479.5,869.7 484.2,876.0C486.6,879.3 489.7,906.1 488.1,909.7C486.3,913.6 480.7,915.3 468.5,915.7C460.4,916.0 456.7,915.7 454.3,914.6ZM364.2,911.0C355.5,908.7 350.8,906.0 349.2,902.5C347.5,898.7 347.7,897.1 351.1,886.3C354.9,874.3 357.3,869.4 360.2,867.9C363.3,866.2 375.8,867.4 381.3,869.8C388.5,873.0 389.2,874.8 388.0,887.1C386.5,902.3 385.3,907.4 382.5,910.0C379.2,913.1 373.1,913.4 364.2,911.0ZM506.5,912.1C505.3,911.6 503.8,910.5 503.1,909.6C501.1,907.2 499.2,896.9 498.4,885.0C497.8,875.4 497.9,874.3 499.7,872.8C502.6,870.2 509.7,867.9 517.1,867.3C526.8,866.5 529.1,868.0 532.8,877.7C536.9,888.4 539.2,897.5 538.4,900.5C538.1,901.9 536.5,904.1 534.8,905.5C529.5,910.0 511.3,914.2 506.5,912.1ZM334.7,901.0C338.6,898.7 340.7,894.8 345.4,880.9C349.4,869.1 349.6,867.4 347.6,862.5C344.5,855.1 323.1,846.6 313.7,849.1C306.5,851.0 303.7,854.0 299.1,864.3C291.6,881.5 294.3,890.0 310.0,898.0C320.2,903.3 329.2,904.4 334.7,901.0ZM573.4,899.2C590.7,891.1 595.4,882.0 589.4,867.7C581.2,848.1 572.9,844.6 553.3,852.5C536.6,859.2 534.9,863.8 542.1,883.3C546.5,895.0 549.8,900.5 553.4,902.1C557.4,903.8 566.2,902.6 573.4,899.2ZM321.5,896.6C315.2,894.6 307.5,890.4 304.3,887.1C298.9,881.8 299.4,876.2 306.2,862.7C309.2,856.8 312.9,854.0 318.0,854.0C321.4,854.0 335.2,858.9 339.2,861.6C344.1,864.8 344.2,867.7 339.6,880.3C335.1,892.8 333.7,895.4 330.5,896.8C327.4,898.2 326.6,898.2 321.5,896.6ZM556.0,896.7C553.1,895.3 550.6,890.4 546.0,877.1C542.7,867.4 542.6,867.2 544.4,864.5C546.5,861.4 556.8,856.4 564.5,854.7C568.9,853.8 570.2,853.9 573.6,855.6C576.9,857.2 578.2,858.9 581.8,865.9C584.4,871.2 586.0,875.6 586.0,877.9C586.0,885.2 579.8,891.1 567.2,895.7C560.0,898.3 559.4,898.4 556.0,896.7ZM282.5,878.9C288.2,873.6 295.2,862.4 298.0,854.0C302.3,841.4 299.6,825.7 290.9,812.4C284.1,801.9 278.4,798.0 272.3,799.5C265.6,801.1 252.6,819.2 249.4,831.3C246.7,841.3 248.1,853.4 253.0,863.0C256.0,868.9 263.8,878.7 267.3,880.9C272.6,884.3 277.3,883.7 282.5,878.9ZM619.8,879.9C624.8,876.3 633.0,864.3 636.0,856.3C639.0,848.5 639.0,837.8 636.0,829.0C631.8,816.4 620.2,801.1 613.6,799.4C609.4,798.4 605.8,799.9 601.5,804.4C593.2,813.2 587.4,825.8 586.3,837.5C585.1,850.0 591.8,866.7 602.4,877.6C607.0,882.4 608.1,883.0 611.6,883.0C614.5,883.0 616.8,882.1 619.8,879.9ZM271.2,876.8C268.2,875.3 260.4,864.9 257.4,858.4C250.8,844.2 253.1,829.5 264.3,814.3C272.7,803.0 276.2,802.5 283.5,811.8C293.5,824.5 296.6,841.0 291.6,854.3C288.6,862.3 283.2,870.7 278.4,875.0C274.6,878.3 274.5,878.3 271.2,876.8ZM605.9,873.1C600.4,867.4 594.5,855.9 592.8,847.8C590.6,837.3 594.4,823.5 602.5,812.2C608.7,803.6 611.9,802.9 617.6,809.2C630.9,823.7 635.6,841.2 630.2,855.5C626.6,865.0 615.9,878.0 611.6,878.0C611.1,878.0 608.5,875.8 605.9,873.1ZM241.8,822.0C245.1,820.0 248.0,814.9 248.0,811.0C248.0,807.1 243.8,796.5 241.2,793.7C235.9,788.1 226.9,788.2 221.1,794.1C215.5,799.7 216.0,807.7 222.4,816.2C228.2,823.7 235.4,825.9 241.8,822.0ZM656.3,822.6C660.2,821.0 665.7,815.0 667.7,810.1C669.8,805.2 668.9,797.6 666.0,794.5C664.7,793.1 661.8,791.3 659.5,790.4C654.4,788.5 648.6,789.7 645.2,793.3C639.4,799.5 636.8,812.9 640.4,818.4C643.6,823.4 650.3,825.1 656.3,822.6ZM230.3,816.5C226.9,814.1 223.0,806.8 223.0,802.7C223.0,795.5 231.6,792.5 237.0,797.8C240.8,801.7 243.0,811.1 240.9,814.9C239.1,818.1 233.7,818.9 230.3,816.5ZM645.6,815.8C643.6,813.0 643.6,810.7 645.5,804.2C647.9,796.1 654.3,792.7 659.8,796.6C665.1,800.3 664.3,807.9 658.0,814.2C653.4,818.8 648.1,819.5 645.6,815.8ZM193.1,794.1C197.2,793.0 206.8,790.5 214.5,788.6C241.6,781.6 253.4,772.6 254.7,758.0C255.2,752.9 248.7,730.5 245.0,724.6C237.6,712.5 223.1,710.1 200.0,717.2C193.7,719.2 184.2,721.7 179.0,722.9C150.2,729.6 140.0,743.3 148.8,763.6C150.5,767.4 152.4,772.5 153.0,775.0C157.8,793.0 171.6,799.6 193.1,794.1ZM717.5,794.3C725.1,791.8 730.4,785.7 733.0,776.8C734.2,772.8 736.3,766.8 737.8,763.5C741.5,755.0 741.5,746.3 737.8,739.9C732.9,731.5 722.2,725.9 703.5,721.9C698.5,720.8 690.2,718.5 685.0,716.8C666.3,710.8 654.1,712.0 645.0,720.9C641.3,724.5 639.7,727.0 638.1,732.0C637.0,735.6 634.9,741.9 633.4,745.9C629.2,757.8 631.3,766.4 640.3,774.7C647.7,781.5 651.9,783.2 681.0,791.1C700.6,796.4 709.2,797.2 717.5,794.3ZM174.7,789.9C165.3,787.7 162.8,785.0 158.3,772.3C150.3,750.1 150.7,751.7 152.0,746.9C154.4,738.0 163.0,732.8 184.3,727.5C191.6,725.7 201.5,723.1 206.4,721.6C218.4,718.1 226.0,718.1 233.1,721.8C239.4,725.0 241.2,728.0 245.9,743.3C250.5,758.0 249.9,763.0 242.4,770.2C237.4,775.0 230.1,778.2 216.4,781.9C189.9,789.0 186.3,789.9 182.5,790.3C180.3,790.6 176.8,790.4 174.7,789.9ZM702.0,790.3C694.7,789.0 663.4,780.4 656.5,777.8C643.6,772.8 635.8,762.9 637.3,753.5C638.3,747.6 645.4,728.7 647.6,726.0C648.9,724.5 652.3,722.2 655.2,721.0C662.1,718.0 671.8,718.6 685.0,722.9C690.2,724.5 698.8,726.8 703.9,728.0C714.5,730.2 725.1,734.7 729.3,738.8C736.0,745.2 736.5,750.5 731.6,763.5C729.7,768.4 727.7,774.4 727.1,776.6C726.5,778.9 725.1,781.9 724.0,783.3C720.2,788.0 709.2,791.6 702.0,790.3ZM176.5,712.6C205.8,706.6 212.0,704.3 219.0,696.4C227.7,686.5 227.9,678.8 220.4,653.1C218.4,646.3 212.7,640.0 205.7,636.9C198.8,633.8 187.2,633.8 173.7,636.8C168.4,638.0 159.0,639.7 152.9,640.6C127.8,644.1 116.1,651.3 112.9,665.4C112.0,669.8 112.1,671.6 113.5,677.0C114.5,680.6 116.3,687.4 117.5,692.3C119.9,701.5 120.3,702.2 125.9,708.3C135.3,718.5 143.7,719.2 176.5,712.6ZM749.1,715.3C756.7,712.9 765.1,704.4 766.9,697.5C767.6,694.8 769.3,688.5 770.6,683.7C773.6,672.7 773.7,665.1 770.9,659.4C766.3,649.8 755.7,644.1 737.0,641.0C730.1,639.9 718.5,637.8 711.1,636.4C695.0,633.2 687.7,633.5 679.5,637.4C676.5,638.9 672.5,641.9 670.7,644.1C667.4,647.9 664.0,656.1 664.0,660.4C664.0,661.5 663.1,665.7 662.0,669.5C660.9,673.3 660.0,678.0 660.0,679.9C660.0,693.0 672.0,704.4 690.0,708.4C730.4,717.4 739.3,718.4 749.1,715.3ZM137.0,708.9C127.0,704.4 126.2,702.8 118.7,673.3C116.7,665.3 122.1,656.5 131.9,651.5C136.8,649.1 149.6,646.0 155.0,646.0C156.7,646.0 164.9,644.6 173.3,642.9C190.5,639.4 197.2,639.4 204.5,643.0C211.3,646.3 214.0,650.5 216.7,662.3C220.3,677.8 220.6,681.9 218.2,686.6C213.4,695.9 205.0,700.6 186.0,704.4C179.1,705.8 169.2,707.8 164.0,708.9C151.6,711.6 142.9,711.6 137.0,708.9ZM708.5,706.4C691.8,702.9 686.0,701.2 680.0,698.2C667.3,691.8 663.6,683.5 667.8,670.0C668.8,666.4 670.0,661.4 670.4,658.9C671.4,652.1 675.8,645.7 681.5,643.0C688.7,639.5 696.6,639.3 711.6,642.3C718.7,643.8 728.3,645.4 732.8,646.0C753.7,648.8 765.4,655.9 767.5,667.1C768.0,669.7 767.4,673.6 765.6,680.1C764.2,685.3 762.5,691.3 762.0,693.6C760.1,701.5 754.0,707.8 746.1,710.0C739.5,711.8 729.7,710.9 708.5,706.4ZM153.5,625.5C182.6,623.2 186.1,622.3 194.7,615.9C201.0,611.2 205.2,603.4 205.2,596.3C205.3,586.6 203.2,570.2 201.2,565.8C196.9,555.9 186.2,549.2 173.5,548.3C161.8,547.5 122.1,549.7 116.3,551.4C105.5,554.8 97.3,562.6 94.8,572.2C93.8,576.0 93.9,578.8 95.3,588.2C96.2,594.4 97.3,601.6 97.6,604.2C98.2,610.0 103.0,617.3 108.6,621.3C116.9,627.1 124.8,627.9 153.5,625.5ZM768.8,625.5C777.9,622.8 785.9,615.1 787.9,607.1C788.4,605.1 789.6,597.4 790.6,589.9C792.0,578.6 792.1,575.6 791.0,571.2C788.5,560.6 777.6,552.4 763.0,550.1C759.4,549.5 745.0,548.9 731.0,548.8C702.0,548.5 700.5,548.8 691.7,556.9C684.9,563.2 683.0,568.7 681.8,585.4C680.8,599.0 680.8,599.7 683.0,604.8C685.9,611.4 693.2,618.2 700.5,620.9C703.6,622.1 710.9,623.4 717.2,624.0C723.4,624.6 732.5,625.4 737.5,625.9C752.4,627.3 763.2,627.1 768.8,625.5ZM120.0,620.1C109.8,617.0 103.0,608.5 103.0,599.1C103.0,597.0 102.3,591.7 101.4,587.4C100.5,583.1 100.0,577.7 100.3,575.3C101.3,565.9 109.1,559.1 121.6,556.6C125.4,555.8 138.9,554.9 151.7,554.5C171.6,553.9 175.7,554.1 180.5,555.4C186.6,557.2 193.1,562.3 195.7,567.3C197.1,570.2 199.4,588.2 199.3,596.1C199.2,603.5 193.1,611.3 184.4,615.1C176.4,618.7 127.7,622.4 120.0,620.1ZM736.5,619.9C706.7,617.1 706.7,617.1 700.3,613.9C693.4,610.6 688.7,605.0 687.5,598.8C686.4,593.1 688.8,572.1 691.2,567.2C693.8,561.7 699.2,557.3 705.8,555.4C710.3,554.1 714.9,553.9 734.3,554.5C761.2,555.2 769.7,556.6 776.7,561.3C784.2,566.4 785.5,568.9 785.5,577.8C785.5,588.7 783.2,603.8 780.9,608.7C778.6,613.5 773.9,617.4 767.9,619.5C763.3,621.1 751.3,621.3 736.5,619.9ZM175.4,531.0C182.8,528.2 188.6,522.9 191.6,516.5C193.8,511.9 194.0,510.2 194.0,495.0C194.0,475.5 193.2,473.1 185.0,465.7C177.6,459.0 171.2,457.4 149.0,456.3C112.7,454.6 106.0,455.7 96.1,464.6C88.5,471.4 87.5,475.1 87.6,494.5C87.7,504.6 88.2,512.0 89.0,514.4C90.7,519.6 97.3,526.6 103.3,529.6C109.9,533.0 115.5,533.5 144.5,533.4C168.0,533.3 169.8,533.2 175.4,531.0ZM778.4,531.6C785.7,529.5 791.6,524.7 795.4,518.0C798.4,512.7 798.4,512.3 798.7,497.0C799.0,477.8 797.9,472.9 791.4,466.0C782.4,456.4 773.8,454.6 742.9,455.9C720.7,456.9 713.9,458.0 706.8,461.6C701.7,464.2 696.7,469.4 694.4,474.5C692.2,479.1 692.0,480.8 692.0,495.6C692.0,510.8 692.1,511.9 694.6,516.8C698.9,525.4 707.5,531.3 717.9,532.9C720.4,533.3 733.8,533.5 747.7,533.4C767.3,533.2 774.1,532.8 778.4,531.6ZM114.4,526.9C109.2,526.0 103.1,523.4 100.7,521.2C99.6,520.3 97.6,517.5 96.2,515.2C93.8,511.0 93.7,510.1 93.6,494.7C93.5,479.2 93.6,478.3 96.0,474.0C97.7,470.9 100.2,468.5 103.9,466.3C112.2,461.4 118.0,460.5 135.0,461.9C143.0,462.5 152.7,463.0 156.7,463.0C171.3,463.0 181.2,467.4 186.0,476.0C188.4,480.3 188.5,481.1 188.2,495.9C187.9,512.9 187.4,514.6 181.4,520.4C175.0,526.6 171.6,527.3 143.5,527.5C129.8,527.6 116.7,527.3 114.4,526.9ZM717.7,526.9C711.8,525.5 706.5,522.4 702.6,517.9C698.6,513.1 698.3,511.9 697.6,496.2C697.0,482.3 698.3,477.0 703.7,471.8C711.8,463.9 720.5,462.1 752.0,461.8L772.5,461.5L779.5,465.0C784.6,467.6 787.3,469.7 789.5,472.8C792.5,477.1 792.5,477.3 792.7,492.3C792.9,500.7 792.5,509.2 791.9,511.4C790.5,516.8 783.0,524.1 777.0,525.9C771.8,527.5 724.2,528.3 717.7,526.9ZM751.2,440.0C762.0,438.9 772.9,437.3 775.4,436.6C786.4,433.3 793.7,426.3 796.7,416.1C798.0,411.6 798.0,409.3 797.1,402.0C796.5,397.3 796.0,391.3 796.0,388.8C796.0,376.8 788.7,366.2 777.5,362.0C770.0,359.2 757.6,358.9 747.5,361.4C743.6,362.4 734.4,363.8 727.0,364.6C707.3,366.8 697.8,371.5 692.5,382.0C691.3,384.5 690.0,388.3 689.6,390.5C688.7,395.8 692.3,420.8 694.6,425.7C698.8,434.3 708.3,440.6 719.2,441.8C726.4,442.6 725.1,442.7 751.2,440.0ZM174.1,440.5C181.1,438.1 188.1,432.2 191.2,426.0C194.1,420.3 196.6,404.4 196.4,393.5C196.2,382.5 188.7,372.5 177.4,368.1C174.1,366.9 166.2,365.3 158.7,364.4C151.6,363.6 142.8,362.2 139.1,361.3C135.5,360.4 128.2,359.7 123.0,359.6C114.8,359.6 112.7,359.9 108.0,362.1C95.3,368.0 91.3,374.7 89.7,393.2C89.1,400.0 88.6,407.8 88.7,410.5C88.8,417.2 92.1,423.9 97.7,429.0C105.3,436.1 107.2,436.6 138.5,440.4C154.1,442.3 168.7,442.3 174.1,440.5ZM137.5,434.3C130.3,433.5 121.5,432.4 117.8,431.9C104.2,429.8 94.7,420.7 94.6,409.7C94.5,400.1 96.7,381.4 98.3,378.4C100.9,373.3 107.4,368.2 113.7,366.4C120.1,364.5 129.6,364.9 139.0,367.5C142.0,368.3 149.3,369.4 155.2,370.0C172.3,371.5 179.0,373.9 185.3,380.9C190.3,386.4 191.5,391.6 190.2,401.0C189.6,405.1 188.8,410.9 188.5,413.9C188.2,416.9 187.0,421.0 186.0,423.0C183.5,427.9 177.1,433.4 172.1,434.8C167.2,436.3 154.0,436.1 137.5,434.3ZM715.0,435.1C707.6,432.8 701.1,427.0 699.1,420.8C698.6,419.0 697.6,413.7 697.0,409.0C696.4,404.3 695.7,398.4 695.3,395.9C694.9,392.5 695.3,390.2 696.7,386.9C701.3,376.6 709.3,372.4 727.9,370.5C734.9,369.7 743.6,368.4 747.1,367.4C756.5,364.9 770.3,365.0 776.0,367.6C781.8,370.3 786.6,375.2 788.4,380.4C789.2,382.7 790.3,390.7 791.0,398.2C792.1,411.4 792.1,412.0 789.9,417.0C787.3,423.1 781.6,428.3 775.1,430.5C765.4,433.8 721.8,437.1 715.0,435.1ZM178.3,351.4C184.6,349.3 192.3,342.1 195.3,335.7C196.7,332.8 198.5,326.2 199.3,321.0C200.2,315.8 201.9,308.1 203.0,304.0C204.5,298.8 205.0,294.8 204.7,290.8C203.4,275.8 189.6,264.0 169.8,260.9C165.8,260.3 158.7,258.4 154.0,256.7C142.2,252.5 130.9,252.3 123.4,256.2C113.2,261.5 106.9,271.2 103.4,286.9C102.6,290.6 100.8,297.7 99.4,302.9C96.2,314.2 96.5,319.7 100.6,327.7C105.4,337.1 116.7,343.8 130.5,345.5C133.2,345.9 139.6,347.2 144.5,348.6C149.4,349.9 155.1,351.4 157.0,351.9C162.6,353.4 173.3,353.1 178.3,351.4ZM740.0,349.2C746.3,347.4 754.8,345.5 758.9,344.9C768.9,343.4 777.2,339.0 782.6,332.3C789.1,324.3 790.6,315.5 787.5,304.0C786.6,301.0 785.1,294.4 784.0,289.5C781.2,276.0 778.5,269.7 772.9,263.6C763.0,252.8 751.1,250.7 732.5,256.7C727.0,258.5 718.9,260.6 714.6,261.5C695.5,265.1 683.6,274.9 681.0,289.2C680.1,293.9 680.3,296.0 682.5,304.6C684.0,310.0 685.7,318.0 686.5,322.4C688.3,332.6 691.9,339.8 698.0,345.3C707.5,353.9 718.9,354.9 740.0,349.2ZM150.0,343.9C144.2,342.3 135.5,340.3 130.6,339.4C119.5,337.5 116.3,336.2 111.0,331.3C106.1,326.9 103.1,321.1 103.0,315.9C103.0,311.6 111.3,278.2 113.5,274.0C116.2,268.7 121.3,263.7 126.5,261.4C133.4,258.1 140.0,258.3 150.6,262.0C155.4,263.6 163.1,265.6 167.9,266.5C178.6,268.3 189.6,273.5 193.4,278.5C199.4,286.4 200.3,292.2 197.0,303.5C195.8,307.4 194.3,314.6 193.5,319.6C191.3,334.3 187.6,340.4 178.5,344.6C171.6,347.9 163.4,347.7 150.0,343.9ZM707.5,344.6C698.7,340.5 694.9,334.6 692.6,321.4C691.7,316.5 690.1,309.4 689.0,305.5C686.3,296.0 686.4,288.5 689.3,282.9C693.5,275.0 703.9,269.1 717.5,266.8C720.8,266.3 728.4,264.3 734.3,262.3C743.3,259.4 746.3,258.8 751.5,259.2C763.1,259.9 772.3,268.1 775.9,280.8C779.1,292.1 782.4,308.2 782.8,314.2C783.7,327.2 772.8,337.6 756.5,339.5C753.2,339.9 744.5,341.7 737.2,343.6C721.2,347.7 714.5,347.9 707.5,344.6Z"
		},
		lingua: {
			w: 1086,
			h: 1448,
			d: "M556.2,1390.5C571.1,1387.9 581.7,1384.0 592.1,1377.3C609.8,1365.9 624.3,1348.6 635.8,1325.6C645.9,1304.9 655.4,1276.1 662.5,1244.0C664.4,1235.4 667.5,1219.9 670.0,1206.8C670.6,1203.7 671.3,1200.2 671.5,1199.0C672.5,1193.5 673.9,1185.4 676.2,1171.0C676.6,1168.4 677.2,1164.7 677.5,1162.8C677.8,1160.8 678.3,1157.8 678.5,1156.1C679.4,1150.6 679.9,1146.8 680.5,1142.8C680.8,1140.5 681.3,1137.4 681.5,1135.8C681.7,1134.1 682.2,1131.1 682.5,1129.0C683.2,1123.7 684.5,1114.8 685.1,1111.0C685.7,1106.3 686.4,1101.8 686.9,1097.2C687.2,1095.0 687.7,1091.5 688.0,1089.2C688.3,1087.0 688.8,1083.7 689.0,1081.8C689.5,1078.0 690.1,1073.3 691.0,1066.8C691.3,1064.5 691.8,1061.0 692.1,1058.8C692.3,1056.5 692.8,1053.2 693.0,1051.2C693.3,1049.3 693.7,1045.8 694.0,1043.5C694.2,1041.2 694.7,1037.4 695.0,1035.1C695.3,1032.9 695.7,1029.3 696.0,1027.1C696.2,1025.0 696.6,1022.4 696.7,1021.2C696.9,1020.1 697.4,1015.4 698.0,1010.8C698.5,1006.1 699.2,1000.5 699.5,998.2C699.8,996.0 700.2,992.1 700.5,989.5C700.8,986.9 701.3,983.2 701.5,981.2C702.0,977.4 702.7,972.0 703.5,964.2C703.8,961.5 704.2,957.7 704.5,955.8C704.7,953.8 705.2,949.8 705.5,946.8C705.8,943.7 706.5,937.5 707.0,933.0C708.3,922.6 708.8,918.1 710.0,906.5C710.5,901.4 711.2,895.1 711.5,892.5C712.3,884.9 712.9,878.9 714.0,868.4C714.5,862.9 715.4,854.2 716.0,848.9C717.0,838.9 717.3,835.9 718.0,827.0C718.3,824.1 718.9,817.4 719.5,812.0C720.0,806.6 720.8,798.1 721.3,793.0C721.7,787.9 722.2,781.8 722.5,779.5C722.8,777.2 723.7,767.1 724.5,757.2C725.3,747.4 726.5,734.4 727.0,728.5C727.5,722.6 728.3,713.4 728.7,708.0C729.2,702.6 729.8,694.2 730.3,689.2C731.4,675.5 733.3,649.9 734.5,633.8C735.1,625.8 735.9,614.9 736.2,609.5C736.6,604.1 737.2,595.7 737.5,590.8C737.8,585.8 738.2,578.5 738.5,574.5C738.8,570.5 739.3,561.9 739.8,555.2C741.2,532.9 742.0,520.3 743.2,503.2C743.9,493.9 744.7,483.0 745.0,479.0C745.3,475.0 746.0,466.1 746.5,459.2C747.1,452.4 747.7,444.2 748.0,441.0C749.0,427.8 751.8,399.3 753.0,388.5C753.3,386.2 753.7,382.0 754.0,379.3C754.5,374.0 756.2,360.3 757.0,355.2C757.2,353.6 757.8,349.8 758.2,346.8C758.7,343.7 759.2,340.2 759.5,339.0C759.7,337.8 760.4,334.2 761.0,331.0C762.1,324.8 762.4,323.6 764.0,316.8C765.6,310.0 766.8,305.4 769.5,295.5C770.5,292.1 773.1,283.7 773.5,282.8C773.8,282.2 774.5,280.0 775.2,278.0C775.9,275.9 777.0,272.6 777.8,270.7C778.5,268.8 779.8,265.4 780.6,263.2C782.5,258.3 782.6,258.0 784.2,254.1C787.0,247.6 792.9,230.7 795.0,223.5C797.1,215.9 799.3,205.8 800.5,197.5C802.1,186.5 801.9,168.8 800.0,156.8C796.2,133.4 784.9,112.0 768.1,96.7C755.6,85.2 746.5,79.5 731.8,73.6C720.4,69.1 710.8,67.1 688.5,64.4C681.5,63.5 649.0,63.6 640.2,64.4C628.2,65.6 623.8,66.1 611.8,67.5C584.6,70.8 573.0,71.8 554.9,72.5C530.6,73.5 511.5,72.2 465.8,66.5C461.8,66.0 456.0,65.4 446.0,64.5C432.1,63.2 406.7,63.4 391.5,65.0C371.7,67.0 353.8,72.3 339.5,80.3C318.0,92.3 300.5,111.7 292.0,133.0C285.9,148.4 283.8,160.2 283.8,179.2C283.8,189.2 284.0,192.4 284.9,198.2C287.9,217.3 291.2,228.6 301.1,253.5C303.8,260.5 306.5,267.4 307.0,268.9C307.6,270.3 308.4,272.7 309.0,274.3C311.5,281.1 312.0,282.6 313.9,288.8C315.8,294.6 318.2,303.4 319.5,308.8C321.0,315.4 322.0,319.4 322.2,320.8C323.1,324.7 323.5,327.0 324.0,329.6C324.3,331.2 324.7,333.8 325.0,335.4C326.4,342.7 328.3,355.9 329.0,362.0C329.3,364.3 330.0,370.6 330.7,376.0C331.4,381.4 332.2,388.2 332.5,391.2C332.7,394.3 333.4,401.4 334.0,407.0C336.1,428.7 338.1,452.8 339.0,466.8C339.3,470.6 339.8,478.5 340.2,484.2C341.1,497.0 342.2,513.0 343.5,534.0C344.0,542.7 344.7,553.1 345.0,557.2C345.3,561.4 345.7,568.2 346.0,572.5C346.3,576.8 346.7,583.7 347.0,588.0C347.3,592.3 347.7,599.2 348.0,603.5C349.3,622.8 350.9,646.9 352.5,668.5C355.5,708.4 356.0,715.8 356.5,722.0C356.8,725.4 357.7,736.7 358.5,747.0C359.3,757.3 360.3,769.5 360.7,774.0C361.1,778.5 361.7,785.3 362.0,789.0C362.3,792.7 363.3,804.4 364.3,815.0C365.2,825.6 366.2,837.0 366.5,840.2C366.8,843.5 367.3,848.3 367.5,850.8C368.3,858.3 369.0,865.0 369.5,870.8C369.8,873.8 370.2,878.3 370.5,880.8C370.8,883.2 371.2,888.0 371.5,891.2C372.1,898.0 374.6,921.9 375.8,931.8C376.2,935.3 377.0,942.2 377.5,947.0C378.4,955.2 378.7,957.8 380.0,968.1C380.3,970.4 380.8,974.4 381.0,977.0C381.3,979.6 381.8,983.3 382.0,985.2C383.4,996.9 383.7,999.5 385.0,1010.1C385.4,1013.9 385.8,1016.5 387.0,1026.0C387.2,1027.8 387.7,1031.3 388.0,1033.8C389.0,1042.0 389.5,1046.2 390.0,1049.8C390.3,1051.7 390.7,1055.0 391.0,1057.2C391.3,1059.5 391.7,1062.9 392.0,1065.0C392.3,1067.1 392.8,1070.4 393.0,1072.5C393.3,1074.6 393.7,1077.7 394.0,1079.5C395.1,1087.7 395.6,1091.0 396.0,1094.0C396.6,1098.4 397.4,1104.1 398.0,1108.0C398.6,1111.6 399.4,1117.3 401.2,1129.8C401.6,1132.8 402.2,1136.5 402.5,1138.0C402.7,1139.5 403.2,1142.2 403.5,1144.0C405.4,1155.0 406.6,1162.6 407.0,1165.1C408.1,1171.7 408.5,1174.0 409.5,1179.8C410.1,1183.0 410.8,1186.9 411.0,1188.2C412.2,1194.5 413.6,1202.5 414.0,1204.8C414.2,1206.1 414.9,1209.5 415.5,1212.2C416.1,1215.0 417.3,1221.0 418.2,1225.5C419.2,1230.0 420.9,1237.9 422.2,1243.0C423.4,1248.1 424.9,1254.3 425.5,1256.8C430.2,1275.9 437.5,1298.4 444.3,1314.2C457.0,1343.7 472.5,1363.6 493.4,1377.3C504.6,1384.7 521.4,1390.3 535.2,1391.2C539.8,1391.5 552.9,1391.0 556.2,1390.5ZM534.0,1383.7C520.0,1381.5 513.1,1379.6 504.8,1375.5C487.8,1366.9 474.5,1353.8 461.9,1333.0C459.1,1328.4 451.0,1312.2 451.0,1311.3C451.0,1311.1 450.5,1309.8 449.8,1308.4C447.1,1302.4 440.9,1284.1 437.4,1271.8C431.3,1250.4 424.7,1221.8 421.0,1200.5C420.7,1198.7 420.1,1195.7 419.7,1193.8C419.0,1189.9 416.6,1176.2 414.7,1164.8C414.0,1160.6 413.2,1155.3 412.8,1153.0C412.4,1150.7 411.6,1145.5 411.0,1141.5C410.4,1137.5 409.4,1131.1 408.7,1127.2C407.6,1120.8 406.2,1110.9 404.3,1097.2C403.9,1094.2 403.0,1087.8 402.3,1083.0C401.6,1078.2 400.8,1072.5 400.5,1070.2C400.2,1068.0 399.7,1064.8 399.5,1063.0C399.3,1061.2 398.8,1057.8 398.5,1055.5C398.2,1053.2 397.7,1049.8 397.5,1048.0C397.3,1046.2 396.8,1042.7 396.5,1040.2C395.7,1033.6 394.5,1024.3 394.0,1020.0C393.3,1015.2 392.6,1009.4 392.0,1004.0C391.5,999.3 390.3,989.2 389.5,983.8C389.3,981.8 388.8,977.9 388.5,975.0C388.0,969.9 387.4,965.2 386.5,958.5C386.3,956.7 385.9,954.0 385.8,952.4C385.3,947.1 384.5,940.3 384.0,936.1C383.7,933.9 383.3,930.1 383.0,927.9C382.4,922.9 381.6,915.9 381.0,909.5C380.8,906.9 380.3,902.7 380.0,900.2C379.5,896.0 379.2,892.8 378.0,881.0C377.7,878.4 377.3,874.0 377.0,871.2C376.7,868.5 376.3,863.8 376.0,860.8C375.7,857.7 375.3,853.0 375.0,850.2C374.5,845.2 373.9,838.7 373.0,828.8C372.2,819.1 371.5,811.9 371.0,806.5C370.7,803.6 370.3,798.4 370.0,795.0C369.7,791.6 369.1,783.6 368.5,777.2C367.9,770.9 367.3,763.0 367.0,759.8C366.7,756.5 366.3,751.0 366.0,747.8C365.8,744.5 365.3,738.6 365.0,734.8C364.7,730.9 364.3,725.3 364.0,722.2C363.7,719.2 363.3,713.7 363.0,710.0C362.5,702.7 361.8,693.2 361.0,684.0C360.4,676.9 359.2,660.2 358.5,648.8C358.2,644.1 357.9,639.0 357.7,637.5C357.4,633.9 356.6,622.3 356.0,612.0C355.7,607.5 355.3,600.4 355.0,596.2C353.4,571.8 352.4,557.8 352.0,550.5C347.4,473.7 342.3,409.5 338.0,373.5C335.5,352.5 331.6,328.3 328.9,317.0C326.3,305.6 324.8,299.8 322.4,291.2C321.6,288.3 320.0,283.4 319.5,282.2C319.2,281.7 318.3,278.9 317.3,275.9C316.3,273.0 314.0,266.8 312.2,262.2C310.4,257.5 308.7,253.3 308.5,252.8C307.9,251.3 307.2,249.4 306.6,248.0C305.8,246.0 304.4,242.4 304.0,241.0C303.8,240.3 302.9,237.8 302.0,235.5C298.5,226.1 297.4,222.4 293.6,206.8C293.3,205.7 292.8,202.8 292.5,200.5C292.2,198.2 291.7,194.9 291.5,193.2C290.8,189.1 290.9,168.2 291.5,164.0C292.9,154.7 293.4,152.2 294.6,147.8C295.3,145.3 296.9,140.1 297.5,138.8C297.7,138.2 298.2,137.0 298.5,136.0C299.7,132.8 305.0,122.9 307.8,118.7C317.6,103.9 334.3,90.0 350.7,82.8C363.8,77.1 375.9,74.1 394.0,72.2C400.3,71.5 406.4,71.3 419.8,71.3C441.3,71.3 447.0,71.7 482.5,76.0C511.3,79.5 524.0,80.2 549.2,79.8C569.3,79.6 576.3,79.1 600.2,76.2C627.8,73.0 632.3,72.5 639.5,71.9C649.8,71.0 680.3,71.0 688.5,71.9C711.2,74.3 725.0,77.9 739.2,85.1C757.8,94.4 774.4,110.8 783.3,128.5C785.2,132.3 785.9,133.7 787.5,137.8C789.9,143.4 791.8,151.1 793.6,162.2C794.4,167.3 794.4,189.1 793.6,195.2C791.4,211.2 786.7,228.1 779.5,245.8C779.3,246.3 778.3,248.9 777.3,251.5C776.2,254.1 775.1,256.9 774.8,257.8C771.4,265.5 763.8,287.3 761.5,295.7C761.0,297.7 760.1,300.9 759.5,303.0C756.6,313.8 753.6,328.2 751.0,343.5C748.3,360.2 746.3,377.4 742.0,422.5C741.1,431.7 737.9,472.8 736.5,492.2C736.2,496.4 735.9,500.6 735.8,501.8C735.7,502.9 735.4,506.0 735.3,508.8C735.1,511.5 734.5,520.0 734.0,527.8C733.5,535.5 732.6,549.3 732.0,558.5C731.5,567.7 730.8,578.5 730.5,582.5C730.2,586.5 729.5,596.5 729.0,604.8C727.8,623.0 727.7,625.1 727.0,632.8C726.7,636.0 726.3,642.0 726.0,646.0C725.5,653.4 724.4,668.1 723.5,678.8C723.2,682.0 722.8,688.0 722.5,692.0C722.2,696.0 721.8,701.7 721.5,704.8C721.2,707.8 720.8,713.1 720.5,716.5C720.2,719.9 719.6,726.4 719.2,730.8C718.8,735.2 718.3,741.5 718.0,744.8C717.8,748.1 717.3,753.2 717.0,756.2C716.5,761.5 715.0,777.0 714.0,788.0C713.7,790.9 713.3,795.6 713.0,798.5C712.7,801.4 712.3,806.2 712.0,809.2C711.6,814.2 711.0,820.1 709.5,834.5C708.7,842.5 708.0,849.3 707.0,860.2C705.8,872.6 705.2,879.2 704.5,885.0C704.2,887.3 703.8,891.5 703.5,894.2C703.0,899.0 702.7,902.2 701.5,912.6C701.2,915.2 700.7,919.2 700.5,921.6C699.9,927.3 699.1,933.7 698.5,939.0C698.3,941.3 697.8,945.6 697.5,948.5C697.2,951.4 696.8,955.4 696.5,957.5C696.3,959.6 695.8,963.4 695.5,966.0C694.8,972.6 694.1,978.6 693.5,983.0C693.2,985.1 692.8,988.8 692.5,991.2C692.2,993.7 691.8,997.4 691.5,999.5C691.2,1001.6 690.8,1005.3 690.5,1007.8C690.2,1010.2 689.8,1013.9 689.5,1016.0C689.2,1018.1 688.8,1021.8 688.5,1024.2C688.2,1026.7 687.7,1030.4 687.5,1032.5C687.0,1036.5 685.9,1044.9 682.2,1073.5C678.7,1101.1 672.6,1144.2 669.3,1164.8C663.1,1202.9 660.3,1217.9 655.4,1240.0C649.2,1268.3 642.5,1291.0 635.4,1308.0C635.1,1308.7 634.7,1309.7 634.5,1310.2C630.5,1320.3 624.4,1331.9 618.3,1341.0C613.9,1347.6 611.4,1350.6 605.0,1357.2C596.1,1366.3 589.4,1371.3 579.5,1375.9C567.8,1381.5 556.0,1384.0 542.5,1383.9C538.5,1383.9 534.7,1383.8 534.0,1383.7ZM544.0,1340.3C544.5,1339.7 544.6,1210.2 544.6,729.1C544.6,393.3 544.5,118.4 544.3,118.1C543.7,117.1 541.6,117.4 541.0,118.5C540.7,119.1 540.5,309.8 540.5,729.3C540.5,1148.7 540.7,1339.4 541.0,1340.0C541.6,1341.2 543.1,1341.3 544.0,1340.3Z"
		},
		arto_a: {
			w: 1448,
			h: 1086,
			d: "M406.8,1041.5C445.8,1040.6 471.5,1038.8 492.7,1035.2C504.1,1033.3 509.2,1031.7 512.9,1029.0C516.6,1026.3 517.6,1024.0 519.2,1014.2C520.1,1009.3 520.5,1007.6 522.6,999.0C524.2,992.3 526.6,984.6 528.4,980.0C529.0,978.2 529.9,975.7 530.4,974.5C530.8,973.3 531.6,971.1 532.2,969.8C532.9,968.4 533.8,966.2 534.4,965.0C534.9,963.8 536.0,961.9 536.9,960.9C538.9,958.4 542.4,951.3 543.2,948.0C545.2,940.2 545.3,934.3 543.5,925.8C541.9,918.4 536.1,907.2 529.2,898.1C522.8,889.8 519.1,872.4 520.5,857.1C521.3,847.1 522.7,839.6 525.0,832.2C528.5,821.2 529.4,818.7 531.6,813.5C534.8,806.1 535.9,803.7 537.8,800.0C540.7,794.2 540.7,794.1 545.2,786.7C553.7,772.5 561.1,764.8 571.4,759.2C584.7,752.0 591.7,745.3 596.5,735.2C602.6,722.4 605.7,704.0 604.5,687.5C603.8,678.0 602.9,671.7 599.8,656.8C594.8,632.8 590.9,603.9 587.5,566.0C587.3,563.1 586.8,558.2 586.5,555.0C585.8,547.4 584.3,527.1 583.0,509.8C582.5,502.1 581.8,492.7 581.5,489.0C580.1,469.5 579.1,448.2 578.4,422.3C577.0,366.2 581.4,308.8 590.0,272.0C592.2,262.7 593.7,257.4 595.7,252.2C596.6,249.8 598.1,245.5 598.9,242.8C599.8,240.0 601.0,237.1 601.5,236.2C603.7,233.1 605.6,228.2 606.4,224.1C607.3,219.0 606.8,214.6 604.8,210.4L603.6,207.8L605.4,206.3C613.7,199.3 619.5,189.1 623.0,175.5C623.5,173.7 624.5,172.4 628.3,168.6C637.1,159.8 639.1,152.0 636.0,137.8C632.2,120.3 629.8,107.3 628.2,95.5C627.2,87.8 627.0,71.9 627.9,66.2C628.9,60.0 632.2,47.8 635.8,37.1C639.2,26.9 639.5,25.2 638.2,24.7C636.9,24.2 635.7,25.9 633.5,31.5C625.6,51.1 621.9,69.3 622.7,83.5C623.3,92.5 625.5,109.5 627.2,117.0C628.3,122.3 628.5,123.5 628.0,123.5C627.7,123.5 626.7,121.0 625.8,117.9C622.6,108.0 619.5,101.5 619.5,105.0C619.5,105.6 620.4,108.8 621.5,112.2C625.4,124.1 626.2,127.5 625.9,133.2C625.5,140.6 622.8,147.5 620.2,147.9C618.8,148.1 615.8,144.4 611.8,137.7C606.3,128.6 602.2,124.5 595.2,121.0C588.6,117.8 586.0,117.3 576.2,117.3C568.0,117.3 567.6,117.4 562.0,119.1C558.8,120.1 554.3,121.5 551.9,122.2C549.5,122.9 545.3,123.7 542.5,124.0C537.3,124.6 535.0,125.1 535.0,125.9C535.0,126.2 534.9,126.8 534.7,127.2C534.4,127.9 534.8,128.0 537.1,128.0C541.8,128.0 547.2,126.8 557.5,123.5C567.7,120.3 575.0,119.2 581.7,120.0C595.1,121.6 603.1,126.3 606.5,134.4C608.2,138.6 611.3,143.2 615.5,147.7C617.1,149.4 618.7,151.5 619.2,152.4C619.7,153.3 620.3,154.0 620.6,154.0C620.9,154.0 621.0,153.4 620.9,152.4C620.7,151.0 620.9,150.5 623.0,148.5C625.9,145.7 627.9,140.8 628.4,135.9C628.6,132.9 628.8,132.5 629.3,133.1C630.4,134.2 632.4,142.1 632.8,146.7C633.4,153.9 631.2,159.6 625.9,164.8C623.6,167.2 622.9,167.6 622.5,167.0C622.1,166.4 622.0,166.4 621.8,167.0C621.7,167.4 621.1,169.1 620.5,170.8C619.9,172.4 618.6,175.9 617.7,178.6C613.0,191.9 606.3,201.4 599.1,204.8C596.0,206.3 588.5,207.2 588.5,206.1C588.5,205.8 589.3,204.1 590.2,202.4C592.4,198.3 593.8,193.5 594.8,186.7C595.5,181.1 596.9,175.3 598.3,172.2C598.7,171.2 599.0,169.9 599.0,169.3C599.0,168.3 599.0,168.3 598.2,169.2C596.5,171.4 594.9,175.8 592.5,184.8C590.2,193.7 589.6,195.6 587.6,200.0C586.5,202.5 584.2,205.8 581.3,209.2C574.2,217.4 561.3,222.1 549.7,220.5C544.5,219.8 542.3,219.3 532.3,215.9C525.0,213.5 517.6,212.0 512.8,212.0C508.7,212.0 502.0,213.3 497.0,215.0C491.9,216.7 485.5,219.8 485.5,220.6C485.5,221.2 486.1,221.1 488.4,220.0C494.5,217.0 503.8,215.0 511.5,215.0C520.7,215.0 528.9,217.4 539.4,223.2C547.7,227.8 557.0,229.5 565.5,227.8C570.8,226.7 575.5,225.2 577.1,223.9C578.6,222.8 577.6,222.7 573.6,223.8C567.1,225.5 553.6,226.2 550.8,224.9C549.4,224.3 549.8,224.2 555.7,224.1C559.3,224.0 562.4,223.8 562.7,223.6C563.0,223.3 564.4,222.9 565.8,222.5C571.7,220.9 578.3,217.0 582.7,212.5L585.2,210.0L590.3,210.0C593.1,210.0 596.1,209.8 596.9,209.4C598.9,208.8 599.5,209.2 601.1,212.4C602.0,214.3 602.2,215.6 602.2,219.5C602.2,225.1 601.4,228.4 598.6,232.9C594.8,239.2 592.6,241.4 583.7,248.1C573.5,255.7 568.3,260.7 563.6,267.7C560.4,272.3 557.0,278.5 557.0,279.6C557.0,280.7 557.9,279.6 559.7,276.5C564.6,267.4 571.8,260.0 583.8,251.7C588.2,248.6 592.2,245.6 592.7,245.1C594.8,242.7 594.6,244.9 591.9,252.8C590.4,257.2 586.2,265.6 582.7,271.2C569.8,292.2 559.9,313.8 555.5,330.8C552.1,343.9 551.3,347.1 550.5,352.2C550.2,354.2 549.7,356.6 549.5,357.8C547.2,367.8 544.6,398.5 543.4,430.5C542.5,452.8 542.5,539.7 543.4,555.5C545.3,589.9 548.1,610.0 553.4,627.5C555.8,635.4 556.6,637.5 564.2,656.0C567.9,664.9 570.1,672.3 571.5,680.8C572.5,686.6 573.0,686.8 572.8,681.2C572.3,672.3 569.1,660.5 563.5,647.3C557.0,632.1 553.3,619.0 550.0,599.5C545.0,570.5 543.6,497.7 546.5,421.5C548.3,373.6 553.3,342.3 563.2,315.9C564.2,313.3 565.0,311.0 565.0,310.9C565.0,310.1 572.7,294.2 575.3,289.5C579.1,282.6 584.6,273.9 584.9,274.2C585.0,274.3 584.7,275.9 584.3,277.6C583.4,281.2 581.7,289.7 581.3,293.0C581.1,294.2 580.8,296.6 580.5,298.2C576.5,324.1 574.0,363.8 574.0,400.0C574.0,418.7 574.9,451.6 575.7,465.5C575.9,467.8 576.2,473.7 576.5,478.5C577.3,491.7 578.1,502.8 580.7,537.2C583.0,565.9 585.7,594.1 588.0,611.8C588.3,614.0 588.8,617.5 589.0,619.8C590.1,628.2 592.2,640.3 595.0,654.8C600.0,680.3 600.1,681.4 600.2,693.8C600.2,702.2 600.0,706.0 599.4,710.0C596.9,724.6 594.0,732.6 588.3,740.6C584.9,745.3 579.6,749.6 571.9,753.9C568.8,755.7 565.5,757.7 564.6,758.4C562.2,760.1 562.1,759.4 564.3,756.7C565.4,755.5 566.9,753.7 567.7,752.7C568.5,751.8 569.1,750.9 568.9,750.7C568.1,749.9 558.4,759.8 552.9,767.1C549.2,771.9 542.0,783.0 538.7,789.0C535.5,794.7 530.0,805.6 530.0,806.2C530.0,806.4 529.4,807.7 528.7,809.2C527.3,812.3 526.9,813.3 524.9,818.8C517.0,840.0 514.3,859.0 516.7,875.9C517.6,882.4 518.4,885.7 519.3,887.6C519.7,888.4 519.9,889.0 519.8,889.0C519.6,889.0 518.2,887.9 516.6,886.7C512.9,883.6 505.3,878.7 500.5,876.2C493.9,872.7 482.5,868.7 480.6,869.1C479.6,869.4 481.2,870.1 487.5,872.5C507.5,880.1 524.4,895.3 534.5,914.7C538.5,922.3 540.2,928.8 540.2,936.5C540.2,941.8 539.7,945.1 538.0,949.9C537.0,952.8 534.0,958.0 533.4,958.0C533.2,958.0 532.0,956.9 530.6,955.6C526.3,951.3 518.7,946.8 508.5,942.4C504.6,940.7 494.0,937.0 490.2,936.0C484.0,934.3 474.7,932.0 472.0,931.5C470.2,931.2 467.9,930.7 466.8,930.5C462.3,929.5 451.3,927.8 441.9,926.5C435.6,925.7 430.5,925.0 427.2,924.5C425.6,924.3 422.2,923.8 419.8,923.5C417.3,923.2 414.0,922.8 412.5,922.5C411.0,922.2 408.2,921.8 406.2,921.5C400.9,920.7 397.0,920.0 394.8,919.5C393.6,919.2 391.1,918.7 389.0,918.3C379.3,916.3 370.0,913.7 366.4,911.9C364.4,910.9 363.5,909.0 363.5,905.8C363.6,901.2 366.1,897.2 374.7,888.0C396.7,864.2 409.3,847.9 421.6,827.5C429.5,814.3 430.9,811.9 436.8,800.2C447.7,778.5 454.8,760.4 459.3,742.3C460.5,737.4 461.5,732.7 461.5,731.9C461.5,730.1 462.3,730.1 463.2,731.9C463.6,732.7 464.3,733.6 464.7,734.0C465.9,734.9 465.7,733.8 464.3,729.9C461.0,721.2 459.7,712.2 460.2,701.0C460.6,689.4 462.3,682.2 468.7,665.6C478.0,641.4 479.5,628.8 482.0,555.0C482.6,538.9 483.5,515.7 484.0,503.5C485.9,459.0 486.2,447.7 486.2,416.5C486.2,386.7 485.8,371.6 484.5,356.8C484.2,353.7 483.8,348.2 483.5,344.5C482.0,324.3 478.6,299.4 476.5,291.7C476.0,289.7 474.0,284.6 472.1,280.4C464.7,264.1 463.3,259.6 463.3,250.7C463.3,246.3 463.4,244.4 463.9,243.8C464.4,243.3 464.8,243.2 465.2,243.4C465.5,243.7 467.2,244.2 468.9,244.5C473.3,245.4 480.3,244.9 485.8,243.3C490.6,241.8 502.5,236.2 502.5,235.4C502.5,235.1 502.2,235.0 501.9,235.1C501.5,235.3 498.3,236.6 494.8,238.0C485.2,241.8 483.7,242.2 476.0,242.2C469.9,242.2 469.0,242.1 466.9,241.1C462.3,238.8 459.8,235.3 457.5,228.0C453.9,216.9 454.5,204.5 459.5,189.2C460.3,186.8 461.1,183.9 461.2,183.0C461.8,179.3 466.0,174.9 469.6,174.2C471.8,173.7 471.8,173.0 469.5,173.0C467.3,173.0 463.6,174.5 462.2,176.0C461.7,176.6 461.1,177.0 460.7,177.0C459.7,177.0 457.1,171.9 456.2,168.2C455.1,163.5 455.5,159.9 458.2,149.2C461.5,136.0 463.1,127.7 465.1,113.0C466.5,101.8 466.7,79.9 465.3,70.8C463.9,61.3 462.6,54.5 460.0,43.8C456.0,27.6 454.1,22.6 452.5,25.0C451.8,26.0 452.2,29.4 453.8,36.0C456.5,47.5 459.5,62.1 460.6,69.0C461.5,75.1 461.7,78.3 461.7,89.5C461.8,103.9 461.3,109.8 458.9,123.7C457.2,134.2 456.2,139.1 453.5,149.9C450.1,163.3 450.3,168.0 455.1,177.3C456.6,180.4 457.5,182.8 457.4,183.3C457.2,183.8 456.4,185.9 455.5,188.0C452.8,194.3 451.5,201.2 451.1,210.0C450.7,223.4 453.0,233.0 458.6,240.1C459.6,241.3 459.6,241.6 459.0,246.7C458.4,250.9 458.4,252.7 458.9,256.0C459.9,262.2 461.7,268.0 465.0,275.2C469.8,286.1 471.0,289.0 472.3,293.9C475.8,307.5 479.4,340.3 481.3,375.2C482.2,393.7 482.2,441.2 481.3,466.2C480.4,488.6 479.7,505.8 479.0,520.0C478.7,525.6 478.3,536.9 478.0,545.0C475.1,631.1 474.0,640.5 463.8,666.1C458.3,679.9 456.2,689.1 455.7,700.8C455.4,708.4 455.8,714.3 457.3,721.3C458.0,724.6 457.9,725.5 457.2,730.1C454.7,746.5 447.8,767.2 438.0,787.8C436.6,790.8 434.8,794.5 434.2,795.9C432.3,800.1 424.4,814.5 419.3,822.8C405.9,844.9 396.1,858.0 376.4,879.4C364.5,892.4 363.4,893.7 361.6,897.2C358.8,902.8 358.5,905.3 359.8,911.8C360.0,913.1 358.1,916.2 341.6,941.0C317.1,977.9 312.1,985.6 303.1,1001.2C294.8,1015.6 293.2,1021.8 296.0,1027.5C297.1,1029.7 299.7,1032.1 302.5,1033.5C311.1,1037.9 333.0,1040.6 367.2,1041.5C375.2,1041.7 382.3,1041.9 383.0,1041.9C383.7,1042.0 394.4,1041.8 406.8,1041.5ZM1025.5,1039.5C1060.8,1037.7 1078.1,1034.9 1084.9,1030.0C1089.5,1026.7 1091.4,1021.9 1090.5,1016.0C1090.2,1014.2 1089.7,1011.8 1089.5,1010.6C1089.2,1009.5 1088.8,1007.5 1088.5,1006.2C1087.2,1000.6 1086.9,999.1 1086.5,997.5C1086.2,996.5 1085.7,994.3 1085.3,992.5C1084.6,989.4 1083.8,986.2 1080.7,973.2C1079.3,967.1 1078.4,963.2 1077.5,958.8C1077.1,957.1 1076.5,954.2 1076.0,952.2C1075.5,950.3 1074.9,947.4 1074.5,945.8C1074.2,944.1 1073.7,942.0 1073.5,941.0C1072.4,936.5 1072.4,934.8 1073.5,932.3C1079.2,919.5 1075.0,903.5 1062.4,889.4C1058.7,885.3 1057.8,883.5 1056.0,877.0C1051.6,860.6 1048.1,850.3 1043.5,840.2C1041.1,834.9 1036.7,821.8 1035.3,815.5C1033.2,806.5 1032.4,798.6 1032.7,790.5C1033.2,775.6 1036.7,764.5 1043.5,755.8C1051.0,746.2 1054.5,739.0 1056.9,728.2C1059.9,715.2 1059.2,700.9 1054.7,687.2C1052.2,679.6 1047.0,668.4 1041.5,659.0C1032.4,643.5 1027.9,628.5 1024.2,601.8C1018.9,562.7 1017.3,534.3 1017.3,476.2C1017.3,432.2 1017.5,426.5 1021.0,389.8C1023.7,361.1 1027.4,331.9 1030.3,315.8C1033.0,300.8 1034.8,295.6 1042.7,279.7C1046.3,272.6 1049.7,265.7 1050.2,264.5C1050.7,263.3 1051.3,261.8 1051.5,261.2C1051.9,260.1 1053.4,256.3 1055.0,251.8C1056.3,248.2 1057.7,242.9 1058.6,238.2C1059.2,234.7 1059.4,227.4 1059.0,215.2L1058.8,208.6L1062.2,202.7C1068.9,190.9 1072.9,182.0 1075.4,173.5C1076.3,170.2 1076.5,157.1 1075.7,154.7C1075.4,153.9 1074.8,152.2 1074.5,151.0C1073.7,148.2 1070.8,142.3 1068.1,137.8C1065.6,133.7 1064.6,130.4 1062.5,119.5C1060.2,107.0 1060.1,90.3 1062.3,77.6C1063.2,72.1 1065.1,64.5 1067.4,57.0C1068.0,55.2 1068.8,52.5 1069.2,51.0C1070.3,47.3 1072.0,42.5 1072.5,41.2C1072.7,40.7 1073.4,38.9 1073.9,37.2C1077.3,27.0 1077.6,25.2 1076.2,24.7C1074.2,23.9 1073.1,26.3 1064.8,50.5C1060.6,63.1 1057.6,77.1 1056.4,89.9C1055.6,99.3 1056.5,112.6 1058.5,121.9C1058.8,123.1 1058.9,124.2 1058.8,124.3C1058.5,124.7 1054.3,119.1 1051.2,114.2C1040.4,96.8 1035.4,78.0 1036.2,57.8C1036.4,53.4 1036.8,47.6 1037.2,45.0C1038.3,37.4 1038.7,33.1 1038.0,34.1C1036.2,37.0 1034.0,50.4 1033.6,60.3C1033.1,75.3 1035.7,88.4 1041.7,102.5C1044.8,109.5 1051.6,121.1 1057.3,129.1C1059.1,131.7 1061.5,135.3 1062.7,137.2C1063.8,139.2 1065.1,141.4 1065.6,142.2C1072.2,153.3 1073.6,163.3 1070.2,175.0C1068.2,181.7 1061.7,195.7 1057.8,201.4C1056.8,202.9 1055.9,204.8 1055.8,205.6C1055.3,209.2 1054.8,220.1 1054.9,225.6C1055.1,231.1 1054.6,235.7 1053.4,241.0C1051.1,251.0 1046.4,263.4 1041.1,273.2C1035.5,283.8 1030.6,294.4 1029.6,298.2C1026.6,309.7 1023.2,330.1 1020.8,351.5C1013.8,412.1 1012.8,428.2 1012.8,478.5C1012.8,528.2 1014.3,557.3 1018.8,593.8C1023.1,629.4 1026.9,641.9 1040.6,666.6C1047.9,679.7 1051.4,688.9 1053.6,700.8C1054.4,705.1 1054.4,719.2 1053.6,723.2C1051.3,734.8 1047.9,742.6 1042.0,750.4C1035.3,759.3 1032.9,763.7 1030.9,771.4C1030.7,772.3 1030.3,773.8 1030.0,774.9C1029.1,778.1 1028.0,788.0 1028.0,792.6C1028.0,802.0 1029.9,813.9 1033.1,824.8C1033.9,827.5 1037.0,835.8 1040.0,843.2C1046.0,858.4 1047.6,862.9 1050.2,872.2C1052.2,879.6 1052.7,882.0 1052.3,882.0C1052.2,882.0 1050.5,881.2 1048.5,880.3C1044.1,878.2 1037.7,876.6 1036.9,877.4C1036.5,877.8 1036.5,878.0 1037.0,878.2C1046.0,881.2 1047.1,881.8 1052.5,885.8C1055.8,888.3 1060.8,893.8 1064.0,898.6C1071.0,908.8 1073.3,919.9 1070.2,928.9C1069.1,932.1 1068.6,932.9 1066.1,935.7C1060.7,941.4 1048.0,948.4 1038.1,951.1C1037.2,951.3 1035.7,951.7 1034.6,952.0C1026.2,954.3 1013.8,954.7 1006.7,953.0C999.9,951.3 994.1,947.8 991.0,943.7C987.3,938.7 986.3,930.0 988.5,921.7C989.6,917.0 989.6,917.0 989.1,917.0C988.5,917.0 986.7,920.8 985.8,924.0C984.7,927.8 984.3,933.2 984.9,936.5C985.5,939.5 985.1,940.3 983.4,939.8C982.2,939.5 982.2,939.4 982.4,934.5C982.7,928.7 982.0,924.6 980.0,920.2C978.4,916.6 977.4,915.6 977.8,918.1C978.0,919.0 978.3,920.1 978.5,920.5C979.4,922.4 980.1,928.4 979.9,932.5C979.7,936.0 979.3,937.6 978.1,940.1C974.8,947.0 970.1,950.4 959.5,953.4C955.2,954.6 943.6,954.4 937.0,953.0C932.0,952.0 924.5,949.7 921.2,948.3C916.8,946.3 915.4,945.6 911.5,943.3C900.4,936.8 897.0,932.7 895.5,924.1C894.1,916.1 897.5,905.3 904.4,896.2C911.5,886.8 917.1,882.5 926.0,879.6C930.4,878.1 931.3,877.5 929.0,877.5C926.3,877.5 921.1,878.9 917.6,880.6C915.9,881.4 914.3,882.0 914.2,881.8C914.0,881.7 914.2,880.7 914.4,879.7C915.0,877.7 915.5,875.3 916.5,870.5C918.1,863.5 920.2,856.9 924.1,847.0C931.3,829.0 933.3,822.1 935.6,807.5C936.5,802.0 936.4,786.4 935.6,781.5C933.1,767.6 930.5,761.8 921.9,750.3C910.2,735.0 906.5,716.4 910.8,695.1C912.3,687.6 916.9,675.8 921.5,668.0C922.8,665.7 924.7,662.3 928.4,655.5C933.8,645.5 938.8,628.9 941.2,612.8C942.2,606.0 942.7,602.7 943.7,594.0C944.4,588.6 945.2,581.2 945.5,577.5C945.8,573.8 946.2,568.4 946.5,565.5C947.0,559.7 947.7,548.9 948.6,529.8C949.4,512.5 949.4,440.1 948.6,426.5C947.1,403.0 945.1,379.0 943.5,365.1C942.3,355.5 941.9,352.1 941.5,348.8C941.2,346.8 940.8,343.2 940.5,340.8C939.5,332.8 937.9,322.2 936.7,315.6C936.2,313.3 936.0,311.3 936.2,311.1C936.4,311.0 937.0,311.9 937.6,313.3C938.8,316.1 939.5,315.2 938.5,312.1C936.9,306.9 932.6,296.3 930.8,293.0C929.7,290.9 927.6,287.0 926.2,284.2C921.4,275.5 916.6,265.4 915.0,261.0C912.7,254.9 910.5,248.1 910.0,245.8C908.7,239.2 908.0,235.3 907.8,232.0L907.5,228.2L908.6,229.8C911.0,233.1 914.5,236.0 918.5,237.9C922.3,239.8 925.5,240.6 924.8,239.6C924.6,239.3 923.4,238.6 922.1,238.0C918.8,236.5 914.9,233.0 912.3,229.3C909.3,225.1 908.2,222.7 906.9,217.9C905.9,214.0 905.3,212.5 904.8,213.0C904.0,213.8 903.0,221.5 903.0,226.5C903.0,235.6 904.6,244.3 908.4,255.8C911.1,263.9 911.7,265.2 919.8,281.3C924.5,290.6 927.5,297.2 928.7,300.8C930.9,307.7 933.7,322.3 935.5,336.5C935.8,338.8 936.3,342.1 936.5,343.8C936.9,346.4 937.5,350.8 939.5,368.5C939.9,372.5 940.2,375.7 941.5,389.2C942.8,404.2 943.5,414.3 944.5,434.2C945.2,447.0 945.2,507.4 944.5,521.5C942.6,563.8 941.5,578.2 938.8,599.2C937.1,611.9 935.8,619.3 933.6,628.5C932.1,635.0 930.3,640.9 928.7,644.5C926.3,649.6 922.8,656.7 921.3,659.2C918.6,663.8 912.2,676.7 910.6,680.8C906.6,691.0 905.0,699.7 905.0,711.6C905.0,716.2 905.2,721.1 905.5,722.6C906.9,729.7 907.1,730.9 907.7,732.8C910.5,741.0 913.4,746.6 918.6,753.2C924.2,760.2 928.6,769.0 930.2,776.2C932.6,786.4 932.6,802.7 930.3,813.2C927.9,824.3 925.0,833.1 919.5,846.8C919.3,847.3 918.6,849.0 918.0,850.6C917.5,852.2 916.6,854.7 916.0,856.1C915.0,858.7 914.1,861.9 912.7,867.8C912.3,869.4 911.8,871.5 911.5,872.5C911.3,873.5 910.8,875.4 910.5,876.8C908.9,883.4 907.8,885.8 904.5,889.2C896.1,898.2 891.0,910.0 891.0,920.3C891.0,925.0 891.7,928.1 893.5,932.4L894.7,935.1L892.0,948.2C890.6,955.4 889.2,962.0 889.0,963.0C888.1,966.8 887.4,970.3 887.0,972.2C886.5,974.9 884.6,983.5 883.0,990.5C882.5,992.9 880.5,1001.9 880.0,1004.0C879.8,1005.0 879.2,1007.5 878.7,1009.8C877.5,1015.1 877.5,1023.2 878.6,1025.3C879.8,1027.5 883.2,1030.4 886.3,1031.8C889.7,1033.4 897.0,1035.2 903.6,1036.2C914.4,1037.8 942.1,1039.6 965.0,1040.2C974.9,1040.5 1015.8,1040.0 1025.5,1039.5ZM365.8,1037.0C332.0,1036.1 313.8,1033.8 304.7,1029.5C301.4,1027.9 299.9,1026.2 299.2,1023.5C297.6,1017.6 309.5,996.7 342.9,946.8C346.4,941.6 352.5,932.5 356.4,926.6C360.3,920.6 363.7,915.6 364.0,915.3C364.3,915.0 364.9,915.0 365.6,915.4C369.4,917.3 384.0,921.2 396.2,923.5C403.4,924.9 408.0,925.7 410.7,926.0C412.4,926.3 416.1,926.8 419.0,927.2C421.9,927.6 426.1,928.2 428.2,928.5C430.4,928.8 433.6,929.2 435.2,929.5C436.9,929.7 440.1,930.2 442.2,930.5C444.4,930.8 447.5,931.2 449.0,931.5C450.5,931.7 453.3,932.2 455.2,932.5C460.5,933.3 464.5,934.0 466.8,934.5C467.9,934.7 470.1,935.2 471.8,935.5C474.9,936.1 486.0,938.8 491.2,940.2C507.9,944.7 528.3,955.2 530.4,960.4C531.0,961.7 530.8,962.5 528.0,968.9C522.0,983.1 517.8,997.3 514.8,1014.0C513.4,1022.0 513.1,1022.8 511.2,1024.6C504.3,1031.1 467.1,1035.6 408.7,1037.0C397.1,1037.3 385.9,1037.5 383.9,1037.4C381.9,1037.4 373.7,1037.2 365.8,1037.0ZM967.2,1035.7C946.2,1035.4 921.1,1033.9 907.8,1032.2C893.4,1030.4 885.4,1027.7 883.1,1023.7C881.1,1020.5 881.8,1015.2 887.0,992.2C887.9,988.4 889.0,983.3 889.5,981.0C890.0,978.7 890.9,974.6 891.5,972.0C892.1,969.4 892.8,966.2 893.0,965.0C893.5,962.6 895.7,952.2 897.5,943.8C898.1,941.0 898.7,938.7 898.8,938.6C898.9,938.5 899.9,939.2 901.1,940.1C915.7,951.9 939.0,959.2 955.2,957.0C967.3,955.5 973.2,952.4 980.2,944.1C981.5,942.5 981.8,942.4 983.9,942.7C985.8,942.9 986.5,943.3 987.5,944.6C991.4,949.8 998.0,954.1 1004.5,955.7C1010.1,957.0 1016.5,957.6 1021.2,957.3C1027.4,956.9 1035.6,955.3 1041.2,953.5C1048.0,951.2 1058.1,946.1 1063.4,942.0C1066.0,940.1 1068.2,938.5 1068.3,938.6C1068.4,938.7 1069.0,941.5 1069.7,944.8C1070.5,948.1 1071.5,952.7 1072.0,955.0C1072.6,957.3 1073.3,960.3 1073.6,961.5C1073.8,962.7 1074.3,964.5 1074.5,965.5C1074.8,966.5 1075.3,968.8 1075.7,970.6C1077.8,979.6 1079.1,985.3 1083.2,1002.8C1086.5,1016.7 1086.8,1021.1 1084.9,1024.0C1082.7,1027.3 1075.7,1029.9 1064.0,1031.7C1057.9,1032.7 1037.8,1034.3 1024.2,1035.0C1012.7,1035.5 981.4,1035.9 967.2,1035.7ZM993.8,881.6C993.1,856.6 995.2,825.9 998.8,805.8C1002.4,786.2 1006.7,774.7 1017.5,756.5C1020.0,752.2 1022.4,748.0 1022.8,747.1C1025.8,740.2 1012.1,760.1 1007.2,769.7C999.4,785.3 995.6,802.0 992.4,835.2C991.5,844.3 991.5,883.7 992.4,889.6C993.1,894.1 993.4,895.5 993.9,895.5C994.0,895.5 994.0,889.3 993.8,881.6ZM973.9,890.8C975.2,884.3 975.7,867.3 975.1,853.8C973.8,825.1 971.2,806.1 966.2,789.0C963.3,779.2 961.3,774.3 957.4,767.4C953.5,760.4 942.8,745.5 942.2,746.2C941.9,746.4 943.5,749.4 945.6,752.5C950.8,760.1 956.4,770.6 959.5,778.2C963.4,788.0 964.7,792.1 966.7,802.0C971.2,823.7 973.3,849.8 972.9,878.9C972.8,887.8 972.9,894.7 973.1,894.4C973.2,894.0 973.6,892.4 973.9,890.8ZM463.0,850.3C470.2,848.8 473.6,847.7 475.1,846.5L476.2,845.4L474.8,845.8C473.9,845.9 470.9,846.6 468.0,847.3C460.8,848.9 451.2,849.7 443.1,849.3C439.1,849.1 436.5,849.1 436.7,849.4C437.0,849.9 441.5,851.0 444.8,851.2C449.2,851.5 459.2,851.0 463.0,850.3ZM503.4,789.9C511.4,774.6 521.6,763.1 531.9,757.4C534.0,756.2 538.2,754.1 541.2,752.7C547.9,749.7 552.1,746.9 556.7,742.5C561.6,737.8 567.2,729.2 568.8,724.0C569.1,722.9 569.0,722.8 568.4,723.4C567.9,723.8 567.0,725.2 566.2,726.7C562.6,733.5 557.0,740.0 550.4,744.6C548.6,746.0 544.2,748.4 540.7,750.0C529.6,755.2 528.9,755.7 521.9,761.4C516.1,766.1 510.7,773.1 505.3,783.0C503.0,787.2 500.0,793.7 500.0,794.6C500.0,795.9 501.0,794.5 503.4,789.9ZM518.8,742.2C522.9,741.1 531.2,737.0 534.8,734.3C538.6,731.5 543.1,726.7 545.6,722.9C549.6,717.0 553.6,708.4 552.8,707.6C552.4,707.2 552.4,707.2 550.0,712.0C546.9,718.2 545.0,721.0 540.9,725.3C533.8,732.8 526.3,737.3 516.5,739.8C512.2,740.9 510.1,741.2 505.0,741.2C501.6,741.2 497.5,741.1 495.9,740.9C494.2,740.6 493.0,740.7 493.0,741.0C493.0,741.5 497.1,742.9 499.8,743.2C503.8,743.6 515.8,743.0 518.8,742.2ZM965.3,732.5C960.0,712.1 958.2,696.9 958.7,676.5C958.9,664.3 959.5,657.7 961.3,644.2C966.2,607.4 969.3,574.2 971.0,542.8C972.3,516.7 972.6,501.3 972.6,461.0C972.6,421.1 972.4,407.9 971.0,372.5C968.7,314.6 963.2,272.8 955.9,257.2C955.4,256.0 954.8,255.0 954.7,255.0C954.4,255.0 954.9,257.7 955.5,259.5C960.9,275.9 965.4,311.2 967.5,353.5C967.8,359.1 968.1,365.8 968.3,368.2C969.2,384.1 970.0,428.4 970.0,463.8C970.0,518.5 969.2,540.1 965.5,584.5C964.9,591.2 962.8,610.8 962.0,617.0C961.7,619.1 961.3,622.5 961.0,624.8C960.8,627.0 960.3,630.5 960.0,632.8C955.4,667.1 954.8,688.2 958.0,708.4C958.8,713.4 960.4,721.0 961.2,724.0C961.7,725.5 962.3,727.6 962.6,728.8C963.3,731.4 964.9,736.2 965.9,739.0C967.5,743.2 967.1,739.4 965.3,732.5ZM1000.2,737.5C1003.0,730.0 1006.5,713.8 1008.1,700.8C1009.0,693.5 1009.0,668.4 1008.1,660.0C1007.7,656.6 1006.4,645.6 1005.2,635.8C1000.5,597.5 998.4,574.8 997.0,549.5C994.1,494.9 993.8,446.5 996.0,378.0C997.9,320.9 1001.8,282.8 1008.1,260.1C1009.4,255.2 1009.1,254.0 1007.3,257.9C1005.7,261.5 1002.5,274.2 1001.1,282.5C997.2,305.1 994.7,337.9 992.9,391.8C992.1,415.6 992.1,496.3 992.9,517.5C994.4,557.4 997.1,590.8 1001.2,624.0C1001.9,629.4 1002.7,635.7 1003.0,638.0C1003.2,640.3 1003.7,644.0 1004.0,646.2C1005.1,655.5 1006.0,667.4 1006.3,677.2C1006.8,694.8 1004.8,713.4 1000.3,732.0C997.9,741.8 997.9,743.6 1000.2,737.5ZM579.3,625.4C579.1,623.9 577.7,616.3 576.2,608.5C573.7,595.8 570.1,574.1 568.6,563.2C566.8,550.9 566.5,548.2 565.8,542.0C563.8,524.1 562.3,505.9 561.5,491.0C560.3,467.7 560.0,457.6 560.0,431.7C560.0,416.6 559.8,404.7 559.5,405.2C558.0,409.2 557.1,473.5 558.4,491.8C558.8,496.4 559.2,503.6 559.5,507.8C559.8,511.9 560.2,517.0 560.5,519.2C560.7,521.5 561.2,525.8 561.5,529.0C562.8,542.8 565.3,562.9 567.0,572.5C569.0,584.6 571.9,598.8 574.3,609.0C577.6,623.2 578.9,628.0 579.4,628.0C579.5,628.0 579.5,626.8 579.3,625.4ZM535.0,310.9C535.0,310.1 535.2,308.0 535.5,306.3C535.8,304.6 536.3,300.9 536.8,298.0C538.1,289.0 539.3,283.5 542.0,274.2C544.7,265.0 545.1,262.8 545.2,257.5C545.2,253.6 545.0,251.9 544.4,250.8C543.7,249.4 543.6,249.6 543.4,255.8C543.2,261.3 542.8,263.1 541.3,268.2C538.3,278.2 536.1,287.5 535.5,293.0C535.2,295.9 534.7,299.9 534.5,301.9C533.8,306.9 533.9,313.1 534.5,312.8C534.8,312.6 535.0,311.7 535.0,310.9ZM944.5,238.9C946.0,238.3 950.1,236.5 953.5,234.9C965.9,228.9 973.4,227.2 983.8,227.7C990.6,228.0 996.0,229.2 1000.8,231.5C1001.3,231.7 1004.4,233.2 1007.7,234.7C1016.8,239.1 1021.9,240.5 1028.3,240.5C1034.5,240.5 1042.2,237.7 1045.5,234.3C1047.1,232.6 1046.6,232.7 1042.2,234.8C1036.0,237.9 1030.1,238.7 1023.2,237.3C1018.4,236.4 1015.7,235.4 1008.7,232.0C997.7,226.6 991.3,225.0 981.4,225.0C972.7,225.0 964.5,226.9 957.6,230.6C947.9,235.8 945.3,237.0 941.4,238.2C939.0,239.0 937.1,239.8 937.3,240.1C937.7,240.7 941.2,240.1 944.5,238.9ZM904.4,199.1C904.1,192.9 903.9,191.6 902.1,186.0C901.0,182.6 899.9,179.1 899.8,178.4C899.4,176.6 898.5,177.1 898.5,179.0C898.5,179.8 899.1,183.1 899.8,186.3C901.8,196.1 901.3,196.3 897.0,187.3C893.3,179.5 892.5,177.0 890.4,168.0C889.2,162.3 889.9,149.6 891.8,143.7C893.7,137.9 898.0,130.1 902.5,124.2C913.7,109.9 918.5,102.2 922.2,93.0C924.1,88.0 926.5,78.4 927.1,72.8C927.7,66.7 927.3,52.6 926.3,46.2C924.8,36.8 922.5,30.1 923.2,37.0C923.3,38.8 923.8,43.1 924.2,46.5C926.0,61.1 924.8,75.6 921.0,87.5C918.8,94.2 917.7,96.8 914.6,102.0C911.5,107.1 905.9,115.0 905.4,115.0C905.1,115.0 905.0,114.3 905.2,113.4C905.9,110.3 907.0,98.2 907.0,94.6C907.0,85.8 905.4,73.7 902.9,64.5C901.2,57.9 896.6,43.2 895.5,40.8C895.3,40.2 894.7,38.7 894.3,37.5C893.2,34.1 890.5,27.4 889.6,25.9C889.2,25.1 888.4,24.5 887.9,24.5C886.4,24.5 886.8,28.2 889.0,34.5C890.0,37.7 892.1,44.0 893.5,48.5C894.9,53.0 896.5,58.0 897.0,59.5C898.3,63.4 900.8,73.9 901.6,79.0C902.5,85.0 902.4,103.4 901.3,109.2C899.4,120.1 898.7,122.2 895.6,126.7C883.6,143.9 882.1,162.9 890.9,184.5C894.9,194.2 902.1,206.0 904.1,206.0C904.5,206.0 904.6,203.9 904.4,199.1ZM1058.9,181.8C1060.6,176.6 1061.0,174.5 1061.0,171.6C1061.0,161.9 1055.2,154.5 1046.0,152.5C1043.2,151.9 1036.5,152.0 1034.9,152.7C1034.1,153.1 1034.0,152.8 1034.0,150.4C1034.0,147.1 1032.5,143.8 1029.0,139.5C1021.7,130.6 1019.0,123.8 1018.2,113.4C1018.0,111.0 1017.7,109.0 1017.4,109.0C1016.1,109.0 1016.3,118.9 1017.7,124.2C1019.0,129.0 1022.7,135.9 1026.2,140.2C1028.0,142.4 1029.9,145.0 1030.3,146.0C1031.3,147.9 1031.5,151.3 1030.8,154.2L1030.4,156.1L1033.1,155.8C1034.5,155.6 1038.3,155.3 1041.3,155.2C1046.8,154.9 1047.0,154.9 1050.2,156.5C1057.8,160.1 1060.4,166.7 1058.0,176.6C1057.4,179.2 1056.7,181.8 1056.4,182.4C1056.2,183.1 1055.8,185.0 1055.7,186.7C1055.4,189.4 1055.5,189.7 1056.1,189.0C1056.5,188.6 1057.8,185.3 1058.9,181.8ZM492.0,169.2C498.1,166.4 502.9,161.4 506.4,154.0C512.2,141.8 518.5,134.9 528.7,129.4C533.1,127.0 534.3,125.6 531.4,126.2C528.3,126.8 521.6,130.5 517.7,133.9C511.4,139.2 509.5,141.7 504.7,150.8C502.9,154.3 500.7,158.2 500.0,159.3C497.8,162.5 493.0,166.6 489.3,168.5C487.5,169.5 486.0,170.4 486.0,170.7C486.0,171.3 488.8,170.6 492.0,169.2ZM901.9,164.9C903.8,161.4 907.8,157.7 911.3,156.2C913.6,155.2 914.8,155.0 918.9,155.0C925.1,155.0 927.9,155.9 931.0,158.7C938.1,165.0 949.1,166.5 964.5,163.2C973.4,161.3 976.7,160.9 982.9,161.2C986.4,161.3 990.3,161.6 991.5,161.9C997.7,163.2 999.6,163.6 1003.5,164.3C1008.7,165.1 1012.6,165.2 1016.1,164.4C1019.5,163.7 1023.5,161.9 1024.5,160.8C1025.3,159.7 1025.7,159.7 1019.8,161.2C1014.1,162.7 1005.4,162.2 995.8,160.0C984.6,157.4 977.2,157.4 965.5,160.0C959.3,161.4 957.8,161.6 952.5,161.8C947.7,162.0 946.1,161.9 942.9,161.0C938.0,159.7 934.2,157.7 932.3,155.3C930.9,153.6 930.8,153.1 930.8,149.8C930.8,145.5 931.2,144.6 935.7,139.5C942.2,132.3 946.2,120.3 945.2,111.4C944.8,107.6 944.0,107.2 944.0,110.6C944.0,114.0 942.8,120.3 941.5,124.4C940.2,128.7 936.6,134.5 932.7,138.9C928.3,143.9 927.0,146.4 927.0,150.3L927.0,152.3L922.2,152.1C913.2,151.7 907.7,153.9 903.3,159.7C901.3,162.3 900.0,165.0 900.0,166.6C900.0,168.0 900.3,167.7 901.9,164.9ZM498.7,136.4C501.5,130.4 502.6,127.4 504.4,121.2C508.6,106.9 511.0,91.0 511.0,77.3C511.0,73.2 509.9,59.5 509.2,55.8C507.9,48.2 506.7,46.1 507.2,52.3C508.5,67.9 508.6,71.1 508.3,79.5C508.0,88.1 507.4,94.7 506.0,104.8C505.1,110.8 501.3,125.5 498.7,132.5C497.4,135.9 496.3,139.3 496.1,139.9C495.6,142.2 496.6,140.8 498.7,136.4ZM526.2,117.5C528.3,116.5 533.6,114.3 537.8,112.7C545.2,110.0 546.9,109.0 544.3,109.0C539.7,109.0 521.5,117.0 521.5,119.1C521.5,119.8 522.1,119.6 526.2,117.5ZM613.8,101.9C613.7,100.7 613.0,97.3 612.3,94.4C608.3,77.4 607.7,60.7 610.3,42.0C610.7,39.1 611.1,35.2 611.3,33.2L611.5,29.8L610.5,31.8C609.3,34.4 607.3,45.4 606.5,53.9C605.8,61.8 606.1,72.5 607.3,80.0C608.6,88.5 612.9,104.0 613.9,104.0C614.0,104.0 614.0,103.0 613.8,101.9Z"
		},
		arto_p: {
			w: 1448,
			h: 1086,
			d: "M419.5,1037.3C452.5,1035.3 473.3,1032.4 480.5,1028.7C485.5,1026.2 487.2,1023.8 489.0,1016.8C491.2,1008.7 491.4,1007.6 493.4,1001.8C495.7,994.9 498.6,987.6 501.2,981.9C502.2,979.7 503.0,977.8 503.0,977.5C503.0,977.3 504.8,975.2 506.9,972.8C512.4,967.0 514.4,962.8 515.5,954.8C516.4,948.8 515.1,941.4 512.2,934.8C511.0,932.2 508.9,928.7 505.5,923.9C502.2,919.3 501.7,918.1 500.3,912.8C496.4,898.1 497.4,883.2 504.0,859.2C505.0,855.5 508.2,846.4 510.5,840.6C510.8,840.0 511.2,838.9 511.5,838.2C511.8,837.6 512.2,836.5 512.5,835.9C513.3,833.9 518.5,823.3 519.4,821.8C519.9,820.9 521.2,818.7 522.3,816.8C523.5,814.8 525.7,811.6 527.4,809.5C534.7,800.2 541.5,795.6 551.9,792.8C557.6,791.3 560.2,790.0 563.5,787.1C570.5,781.0 575.0,770.1 577.0,754.8C577.8,749.1 577.8,735.7 577.0,729.8C576.0,722.0 573.2,712.3 569.5,704.2C566.5,697.6 564.8,692.3 562.5,681.8C560.5,672.5 558.0,654.2 556.5,637.5C554.6,616.0 553.5,598.0 552.4,569.2C551.6,548.9 551.6,484.1 552.4,470.2C552.7,464.5 553.2,454.7 553.5,448.5C554.7,424.5 556.7,403.1 559.5,386.0C560.8,378.3 561.3,375.6 562.9,367.5C563.8,362.7 564.9,356.2 565.2,353.2C565.8,348.3 566.0,347.3 567.2,346.0C571.3,341.1 573.3,332.2 572.0,324.3C571.5,321.1 571.5,320.1 572.2,317.9C573.1,314.8 573.9,313.6 579.1,307.8C587.4,298.5 592.4,284.1 590.5,275.6C590.0,273.4 590.0,273.3 592.0,271.2C595.0,268.0 596.7,264.2 598.1,257.8C598.3,256.6 598.7,249.9 599.0,242.8C599.2,235.6 599.8,227.1 600.2,223.8C603.5,199.6 611.7,174.7 626.0,146.0C635.7,126.6 638.6,119.2 639.6,112.1C640.7,103.6 638.5,96.4 633.3,91.6C626.4,85.3 618.1,84.5 609.1,89.0C603.1,92.1 597.7,97.4 586.3,111.6C584.1,114.3 582.3,116.5 582.2,116.5C582.1,116.5 580.0,115.4 577.4,114.2C573.5,112.2 572.0,111.0 568.2,107.2C563.8,102.8 558.2,95.1 552.3,85.3C547.8,77.8 541.4,65.7 537.6,57.4C536.8,55.6 535.2,52.2 534.0,49.8C532.9,47.5 532.0,45.4 532.0,45.3C532.0,45.1 531.5,43.8 530.8,42.4C530.1,40.9 529.1,38.5 528.5,37.0C524.5,26.9 523.0,24.6 521.2,26.3C520.1,27.4 520.5,29.0 523.4,36.3C525.8,42.1 528.0,47.1 532.6,57.4C534.2,61.1 539.1,70.9 541.0,74.2C541.9,75.9 543.2,78.3 543.9,79.5C544.6,80.7 545.8,83.0 546.7,84.5C548.9,88.6 556.0,99.2 559.3,103.6C565.6,111.7 571.1,116.6 576.6,119.0C578.2,119.7 579.5,120.5 579.5,120.9C579.5,122.0 568.1,135.3 561.1,142.3C549.0,154.6 537.7,162.3 526.2,166.3C521.7,167.8 520.5,168.1 512.8,169.5C504.9,170.9 501.9,171.7 497.2,174.1C491.6,176.8 486.6,181.6 483.0,187.8C477.0,197.9 471.5,203.7 464.8,207.0C458.9,209.9 455.9,210.5 445.8,211.0C436.8,211.4 434.9,211.8 430.9,213.8C430.0,214.2 428.6,215.2 427.9,215.9C426.5,217.2 426.5,217.2 425.8,216.2C423.6,213.2 422.9,205.9 424.3,200.5C424.7,198.9 426.1,194.4 427.5,190.7C432.0,178.4 433.3,170.2 432.9,156.1C432.4,140.3 429.2,128.1 421.0,110.5C419.4,107.1 417.2,102.7 416.1,100.8C410.2,90.3 405.9,82.7 405.5,82.3C404.9,81.5 396.1,65.3 394.0,61.0C389.5,52.1 383.6,38.1 381.4,31.3C380.2,27.5 379.2,26.0 378.0,26.0C376.0,26.0 376.2,28.9 378.6,36.2C380.1,40.9 380.2,41.2 382.0,45.1C382.5,46.4 383.0,47.6 383.0,47.7C383.0,47.9 383.5,49.2 384.2,50.6C384.9,52.1 385.9,54.4 386.5,55.8C389.1,61.6 393.9,70.8 399.4,80.4C401.4,83.8 403.0,86.7 403.0,86.8C403.0,86.9 403.7,88.1 404.6,89.6C405.4,91.1 406.6,93.0 407.1,93.9C408.0,95.6 409.3,97.7 411.1,100.9C418.9,114.7 424.9,130.4 427.3,143.8C428.7,151.5 428.6,168.4 427.1,175.9C426.0,181.2 424.0,187.9 421.6,193.9C419.9,198.0 419.0,202.8 419.0,207.4C419.0,212.3 419.9,215.8 421.8,218.7C423.1,220.6 423.1,220.8 422.5,223.3C422.1,224.8 422.0,227.0 422.2,228.5C422.4,230.6 422.2,231.3 421.1,233.4C419.8,235.6 419.8,236.1 419.8,242.0C419.8,247.3 420.0,248.7 421.0,251.2C422.6,255.3 424.1,257.9 428.0,263.4C434.4,272.5 435.5,274.3 437.2,277.7C439.6,282.7 440.5,286.7 441.0,294.8C441.7,306.7 444.3,311.8 452.1,316.7C453.7,317.7 455.0,318.8 455.0,319.1C455.0,319.4 454.4,321.2 453.7,323.2C452.5,326.4 452.3,327.4 452.3,333.0C452.3,339.7 452.9,342.3 455.3,346.1L456.6,348.1L455.7,351.4C454.0,358.4 454.1,361.5 457.3,378.8C461.1,399.0 463.0,417.3 464.0,439.8C464.6,455.1 464.6,500.3 464.0,524.2C462.8,570.2 460.1,636.5 458.8,653.5C458.6,655.3 458.3,660.0 458.0,664.0C456.7,681.0 454.3,695.1 451.3,703.5C450.6,705.3 448.8,709.4 447.3,712.7C443.7,720.3 441.3,727.5 440.2,733.5C439.0,740.5 439.5,750.6 441.3,757.0C443.6,765.1 443.4,774.1 440.5,785.6C438.9,791.7 434.5,803.7 430.8,811.6C429.8,813.8 429.0,815.6 429.0,815.8C429.0,816.0 425.9,822.4 422.1,830.2C415.2,844.1 407.9,858.0 404.0,864.3C402.9,866.1 402.0,867.7 402.0,867.8C402.0,868.0 399.1,872.6 394.7,879.2C390.1,886.3 384.3,893.6 376.6,902.3C370.0,909.9 365.8,915.2 364.2,918.3C361.5,923.3 360.2,930.3 361.5,933.2C362.0,934.2 361.0,936.0 349.9,952.8C343.1,962.9 336.4,973.2 334.9,975.5C333.4,977.8 330.5,982.3 328.4,985.5C320.3,997.9 311.2,1012.7 308.9,1017.2C306.5,1021.8 306.9,1027.0 309.8,1030.4C313.4,1034.6 321.9,1036.8 340.0,1038.0C349.8,1038.7 404.8,1038.2 419.5,1037.3ZM1010.2,1037.5C1053.6,1035.9 1062.8,1034.0 1066.7,1025.7C1068.4,1022.1 1068.3,1018.8 1066.0,1009.0C1064.9,1004.7 1064.6,1003.1 1064.0,1000.5C1063.7,999.0 1063.2,997.0 1063.0,996.0C1061.6,989.9 1058.6,976.1 1058.2,973.8C1058.1,972.9 1057.7,971.4 1057.5,970.2C1057.3,969.1 1056.8,967.0 1056.5,965.5C1056.2,964.0 1055.5,960.5 1055.0,957.6C1054.1,953.1 1054.0,952.4 1054.7,951.1C1057.9,944.8 1058.1,933.1 1055.1,925.4C1052.8,919.6 1049.8,915.2 1044.5,910.2C1040.6,906.5 1040.3,905.8 1035.9,895.0C1026.5,871.6 1022.6,857.1 1021.4,840.6C1020.3,825.4 1022.4,813.2 1027.8,804.0C1028.7,802.5 1031.0,799.5 1033.0,797.3C1043.1,786.0 1047.0,775.1 1047.0,757.7C1047.0,740.7 1043.7,729.4 1034.0,713.0C1024.6,697.3 1020.3,682.2 1017.3,653.8C1015.4,636.0 1014.5,622.5 1013.4,594.5C1012.5,572.6 1012.5,476.8 1013.4,458.0C1015.3,416.5 1017.3,398.0 1022.1,378.8C1024.8,367.9 1030.6,354.8 1034.1,351.6C1040.0,346.4 1042.1,343.4 1043.9,338.1C1045.6,333.2 1046.1,329.5 1045.8,324.9C1045.6,321.6 1045.7,320.4 1046.2,320.1C1047.3,319.5 1049.8,315.4 1051.0,312.2C1052.0,309.7 1052.2,308.3 1052.2,303.0C1052.2,297.7 1052.0,296.4 1051.1,294.3C1050.5,293.0 1050.0,291.0 1050.0,290.0C1050.0,285.3 1053.3,272.8 1056.2,266.3C1060.4,257.2 1063.7,247.4 1064.2,242.5C1064.6,238.4 1063.8,233.3 1062.2,230.1C1061.0,227.6 1060.9,227.1 1061.4,225.2C1061.7,224.0 1062.0,222.0 1062.0,220.7C1062.0,219.3 1062.4,217.9 1062.9,217.1C1066.2,212.3 1069.0,201.8 1069.0,194.1C1069.0,185.8 1067.7,180.2 1063.6,171.5C1062.4,168.9 1061.1,166.0 1060.6,165.0C1060.2,164.0 1059.6,162.6 1059.2,161.8C1058.6,160.4 1056.7,154.5 1055.6,150.8C1055.3,149.9 1054.9,147.8 1054.6,146.1C1054.2,144.4 1053.7,141.6 1053.4,139.9C1052.6,135.7 1052.6,115.1 1053.4,109.5C1054.2,104.2 1055.9,96.1 1056.8,92.5C1057.3,91.0 1057.8,89.1 1058.0,88.2C1059.2,83.5 1063.8,70.9 1066.3,65.1C1066.7,64.2 1067.3,62.8 1067.7,61.9C1069.0,58.8 1070.6,55.2 1072.0,52.2C1072.8,50.6 1073.8,48.2 1074.4,47.0C1074.9,45.8 1075.8,43.7 1076.4,42.5C1078.0,38.9 1080.5,32.4 1081.3,30.0C1082.0,27.5 1081.6,26.0 1080.0,26.0C1079.1,26.0 1077.7,28.5 1074.6,35.5C1073.7,37.6 1072.9,39.3 1070.6,44.6C1070.0,45.9 1069.0,48.1 1068.4,49.4C1067.9,50.7 1066.8,53.0 1066.1,54.5C1057.8,72.8 1052.1,90.0 1049.8,104.0C1047.2,119.5 1047.4,132.9 1050.2,147.2C1052.0,156.2 1054.0,161.8 1058.6,171.1C1061.1,176.3 1061.9,178.4 1063.3,183.8C1064.4,188.0 1064.6,198.9 1063.6,203.0C1062.5,207.3 1061.0,212.0 1060.5,212.0C1060.1,212.0 1059.0,209.8 1059.0,208.9C1059.0,207.6 1054.8,200.0 1052.5,197.2C1049.9,193.9 1045.0,189.9 1041.8,188.5C1040.7,188.0 1037.6,186.7 1035.0,185.7C1023.1,181.1 1015.3,173.8 1010.0,162.4C1004.8,151.1 1003.2,142.3 1003.8,127.3C1004.0,119.4 1003.9,116.2 1003.3,112.2C1001.2,98.1 994.5,89.7 983.4,86.8C975.7,84.8 967.7,87.3 961.8,93.5C958.4,97.1 956.9,99.9 955.1,105.5C953.3,111.4 953.0,113.6 952.5,126.3C952.0,141.1 951.1,146.1 947.5,155.4C942.7,167.7 934.1,177.9 924.8,182.5C923.1,183.3 919.3,184.9 916.4,186.0C908.1,189.0 905.2,190.7 900.7,195.2C896.5,199.5 894.2,203.2 892.2,209.0C891.6,210.8 890.8,212.3 890.6,212.4C890.3,212.5 889.7,211.3 889.1,209.9C886.1,202.2 885.3,194.7 886.7,187.5C888.2,180.3 888.8,178.4 892.6,170.8C896.1,163.5 898.2,158.1 899.9,151.5C900.8,147.9 901.2,146.3 902.6,137.5C903.4,132.4 903.4,111.0 902.6,105.5C901.0,95.0 899.6,88.3 897.0,78.8C896.0,75.0 892.6,65.4 890.5,60.2C890.3,59.7 888.0,54.0 885.5,47.5C883.0,41.0 880.7,35.2 880.5,34.6C880.2,34.0 879.8,33.0 879.6,32.4C877.5,27.0 875.6,24.8 874.4,26.6C873.7,27.8 874.0,29.6 875.7,34.5C877.5,39.7 881.2,49.4 882.2,51.8C883.0,53.5 888.7,68.1 890.0,71.8C892.8,79.3 896.0,92.0 897.3,100.0C897.7,102.9 898.3,106.5 898.5,108.0C899.6,114.3 898.9,135.9 897.3,143.2C894.8,154.6 892.8,160.5 888.3,169.4C883.3,179.5 881.9,184.9 881.9,194.0C881.9,202.5 883.1,207.7 886.5,214.8C888.4,218.6 889.0,220.4 889.0,222.1C889.0,223.3 889.2,225.1 889.6,225.9C890.0,227.3 890.0,227.7 889.2,228.9C886.6,232.7 885.6,238.4 886.4,244.0C887.2,248.9 890.0,257.2 893.8,265.4C894.5,266.8 895.0,268.3 895.0,268.5C895.0,268.8 895.2,269.4 895.5,269.9C895.8,270.4 896.3,271.9 896.8,273.2C900.1,283.4 900.9,291.1 899.0,296.7C896.6,303.8 898.9,315.5 903.6,320.3C905.0,321.8 905.0,322.0 904.5,323.8C903.6,327.3 904.0,331.6 905.9,337.8C907.2,342.1 910.9,347.4 914.6,350.3C916.1,351.4 917.8,353.3 918.4,354.3C925.5,366.9 930.2,382.4 932.5,401.1C933.7,411.1 934.0,413.5 934.5,419.8C939.6,484.0 939.1,598.6 933.5,654.2C932.5,664.2 931.8,668.9 930.4,677.4C929.5,683.3 926.4,694.4 924.5,699.2C923.6,701.6 918.6,711.6 916.5,715.2C914.3,719.0 910.3,727.0 909.5,729.2C907.4,734.9 905.8,740.9 904.5,749.1C903.5,755.7 904.2,769.8 906.0,776.0C906.2,777.0 906.7,778.5 906.9,779.5C908.5,785.7 912.5,792.7 917.9,798.7C925.4,807.0 928.7,821.5 927.5,839.5C927.0,845.9 926.8,847.5 925.4,855.1C924.6,859.5 922.8,866.6 921.3,871.2C920.6,873.5 919.8,876.0 919.5,877.0C919.2,878.0 918.7,879.2 918.5,879.8C918.2,880.3 917.5,882.5 916.8,884.5C916.1,886.6 915.0,889.9 914.2,891.8C913.5,893.7 912.5,896.4 912.0,897.8C908.7,907.0 908.0,908.3 904.9,911.3C898.2,918.0 894.3,926.3 893.7,935.5C893.3,940.8 894.2,946.6 896.0,950.8C896.9,952.8 897.0,953.6 896.6,955.5C896.3,956.7 895.8,959.2 895.5,961.0C894.0,969.3 892.9,975.1 891.6,981.0C891.3,982.2 890.9,984.0 890.7,985.0C890.3,987.2 888.9,993.9 887.5,1000.0C887.0,1002.6 886.2,1005.9 885.9,1007.2C885.6,1008.6 885.2,1010.6 884.9,1011.8C881.7,1025.8 885.2,1031.5 898.5,1034.3C904.9,1035.6 926.9,1037.2 945.8,1037.7C960.4,1038.0 998.5,1037.9 1010.2,1037.5ZM353.8,1034.0C336.2,1033.5 330.0,1033.0 321.8,1031.2C317.4,1030.2 315.1,1029.3 313.4,1027.6C312.2,1026.5 312.0,1025.9 312.0,1023.7C312.0,1021.5 312.4,1020.3 314.1,1017.1C315.2,1015.0 316.5,1012.7 317.0,1012.0C317.5,1011.3 319.4,1008.2 321.3,1005.0C326.8,996.0 330.8,989.8 350.5,959.9C356.7,950.4 362.4,941.7 363.1,940.4C364.8,937.5 365.3,937.2 366.7,938.2C368.3,939.2 376.8,941.8 382.8,943.0C387.9,944.0 398.0,945.5 406.5,946.5C439.7,950.5 463.2,955.5 480.9,962.5C488.9,965.7 495.4,969.1 498.1,971.5L500.2,973.4L498.9,976.3C491.7,992.4 489.1,999.5 486.0,1010.6C482.7,1022.6 482.6,1022.8 478.1,1024.8C473.0,1027.1 466.1,1028.4 448.5,1030.5C426.4,1033.0 380.7,1034.7 353.8,1034.0ZM947.5,1033.2C925.9,1032.5 908.4,1031.3 900.9,1030.0C894.3,1028.9 890.9,1027.3 889.1,1024.2C887.7,1021.8 887.8,1018.8 889.5,1011.5C891.3,1003.9 893.0,996.0 894.0,991.2C894.2,990.1 894.9,987.0 895.4,984.2C897.0,977.0 897.9,972.2 898.5,968.8C898.8,967.1 899.3,964.7 899.5,963.5C899.7,962.3 900.1,960.4 900.2,959.4C900.4,958.3 900.7,957.5 900.9,957.5C901.1,957.5 902.2,958.4 903.3,959.5C907.3,963.7 914.3,967.9 921.7,970.7C930.9,974.2 944.8,975.4 953.7,973.6C961.7,971.9 967.4,968.7 970.8,964.0C973.3,960.5 973.9,960.0 975.9,960.0C978.2,960.0 978.4,960.2 980.4,963.0C983.7,967.9 989.1,971.5 996.0,973.4C998.5,974.0 1001.2,974.2 1008.2,974.2C1016.0,974.2 1017.9,974.1 1022.0,973.0C1032.6,970.4 1042.3,965.4 1048.1,959.4C1049.2,958.2 1050.2,957.5 1050.4,957.8C1050.7,958.0 1051.1,959.9 1051.5,962.0C1052.9,970.9 1057.5,992.7 1060.8,1006.2C1063.6,1018.2 1063.9,1021.0 1062.8,1023.7C1060.6,1029.1 1052.9,1030.8 1022.8,1032.5C1014.6,1033.0 957.2,1033.5 947.5,1033.2ZM972.0,986.9C971.4,980.8 969.8,972.6 969.0,971.8C967.9,970.7 967.9,972.3 968.9,978.6C969.5,982.3 970.3,986.8 970.6,988.8C970.8,990.7 971.2,992.8 971.3,993.5L971.6,994.8L972.0,993.6C972.3,993.0 972.2,990.1 972.0,986.9ZM982.0,988.4C982.5,985.2 983.4,980.3 984.0,977.3C985.2,971.2 985.2,971.0 984.5,971.0C983.7,971.0 983.1,972.7 982.0,978.0C981.0,983.2 980.0,995.1 980.7,994.4C980.9,994.2 981.5,991.5 982.0,988.4ZM1002.3,970.5C992.0,969.4 983.7,964.2 981.0,957.1C979.2,952.7 979.1,946.4 980.6,940.8C981.3,938.3 982.0,935.9 982.2,935.4C983.0,933.6 981.5,934.6 980.3,936.6C978.2,940.3 976.9,945.9 977.1,950.9C977.2,953.3 977.4,955.6 977.5,956.0C977.7,956.5 977.3,956.8 976.1,956.9C975.2,957.0 974.5,956.9 974.5,956.8C974.5,956.7 974.7,955.4 975.0,954.0C976.1,949.3 974.1,939.3 971.4,935.4C969.8,933.1 969.5,933.8 970.8,937.5C972.8,943.3 973.2,947.0 972.5,951.4C971.3,958.9 967.5,964.1 961.0,967.2C955.3,969.9 951.1,970.6 942.5,970.4C927.5,969.9 914.3,965.0 905.5,956.5C900.2,951.3 898.0,946.0 898.0,938.0C898.0,925.1 905.4,913.6 917.6,907.8C920.9,906.2 925.0,905.0 927.5,905.0C928.5,904.9 929.7,904.7 930.2,904.5C931.2,904.1 931.1,904.1 929.8,903.5C927.7,902.7 920.5,903.6 916.5,905.2C914.9,905.8 913.5,906.2 913.5,906.1C913.5,905.9 913.8,905.2 914.2,904.5C914.5,903.8 915.0,902.8 915.1,902.2C915.3,901.7 916.4,898.7 917.5,895.5C927.1,868.9 929.6,860.2 931.3,846.5C932.5,836.4 932.1,821.5 930.4,814.5C928.7,807.3 925.8,801.1 922.1,796.8C917.1,791.0 913.3,784.4 911.3,778.4C909.1,771.8 908.8,768.9 908.8,759.0C908.9,749.7 909.4,744.8 911.0,739.0C911.2,738.0 911.6,736.7 911.8,736.0C911.9,735.3 912.3,734.3 912.5,733.8C912.7,733.2 913.2,732.0 913.5,731.0C914.4,728.5 918.9,719.6 920.0,718.0C920.6,717.2 921.0,716.5 921.0,716.3C921.0,716.2 921.9,714.6 923.0,712.8C924.1,711.0 925.0,709.4 925.0,709.3C925.0,709.2 925.8,707.4 926.7,705.4C929.2,700.0 931.9,692.2 933.0,687.2C935.7,674.0 936.9,665.7 938.5,648.8C941.2,619.1 942.2,586.9 942.2,531.8C942.2,474.8 941.2,445.5 938.5,414.5C937.8,406.7 936.5,397.7 934.9,388.8C932.6,375.7 930.1,367.7 924.9,356.9C923.5,353.9 922.5,351.4 922.6,351.2C922.8,351.1 924.1,350.8 925.6,350.7C934.8,349.7 943.5,360.9 949.4,381.2C950.5,385.0 952.1,393.0 953.2,400.5C954.3,407.5 960.6,470.4 962.0,488.5C966.9,548.6 967.4,621.4 963.2,662.2C962.7,667.6 961.5,678.5 961.3,679.9C961.1,680.6 960.8,683.2 960.5,685.5C960.2,687.8 959.5,692.5 959.0,695.8C958.5,699.0 957.7,703.9 957.3,706.5C956.0,714.4 955.1,722.9 954.7,729.2C954.2,739.2 955.8,754.2 958.3,763.9C959.0,766.6 959.8,769.4 960.0,770.2C960.5,772.3 962.4,777.6 962.7,777.9C963.3,778.5 962.9,775.8 961.8,771.4C960.4,766.1 958.9,758.8 957.9,752.5C957.5,749.7 957.3,743.5 957.3,734.5C957.3,719.8 957.1,722.0 961.0,696.0C963.4,680.4 964.0,675.3 965.5,659.8C968.8,626.6 969.4,565.4 967.0,522.5C964.4,476.4 956.8,404.7 952.7,388.0C947.6,366.7 940.9,353.9 932.4,349.4C930.6,348.5 929.4,348.3 925.4,348.2C922.7,348.1 920.0,347.9 919.4,347.7C916.1,346.7 912.0,341.7 910.0,336.0C909.0,333.4 908.8,331.7 908.8,327.4C908.7,321.3 909.0,320.8 912.8,319.5C915.9,318.5 919.8,315.6 922.9,312.1C926.7,307.8 928.3,306.2 930.8,304.5C936.4,300.6 939.1,299.8 946.3,300.1C951.0,300.2 952.2,300.5 954.8,301.7C958.7,303.5 961.7,306.5 962.4,309.5C966.4,325.3 967.6,366.7 965.0,392.2C964.0,401.3 963.9,404.3 964.4,403.8C965.1,403.0 966.8,392.3 967.8,382.2C968.9,371.4 969.0,344.7 968.1,334.8C964.7,299.4 960.5,284.1 950.2,270.0C941.7,258.2 940.3,255.5 937.5,245.0C933.9,231.3 929.0,224.8 920.4,222.5C916.9,221.6 912.8,222.5 908.3,225.5C906.4,226.7 904.1,228.1 903.4,228.5C901.6,229.4 898.0,229.4 896.3,228.6C893.6,227.1 892.4,221.9 893.5,215.8C896.1,201.4 903.0,193.1 916.1,189.0C925.9,185.9 931.7,182.7 937.6,176.9C941.2,173.4 945.4,167.5 948.2,162.2C950.1,158.7 953.6,148.8 954.2,145.3C954.5,143.8 954.7,143.5 955.1,143.9C955.5,144.3 955.8,148.7 955.9,158.1C956.1,171.7 955.8,175.9 954.2,184.8C952.9,191.7 952.4,194.2 952.0,196.5C951.0,201.3 950.0,210.4 950.0,214.0C950.0,218.0 951.2,228.3 952.0,232.0C952.3,233.2 952.7,234.9 952.8,235.6C953.0,236.4 953.4,237.2 953.8,237.5C954.4,238.0 954.5,237.9 954.3,236.7C952.9,228.4 952.3,222.7 952.4,215.5C952.4,207.0 952.7,204.1 956.2,185.5C958.3,174.0 958.8,166.3 958.1,154.0C956.5,126.0 956.4,124.3 957.0,118.5C958.3,104.7 962.6,96.2 970.4,92.4C973.5,90.9 974.1,90.8 978.5,90.8C985.8,90.9 990.0,93.1 994.1,99.2C996.3,102.4 998.1,107.1 999.0,112.1C999.9,116.8 999.7,131.7 998.5,146.0C996.9,166.3 997.2,174.8 1000.5,192.5C1003.4,208.2 1003.7,219.5 1001.5,231.2C1000.3,237.8 1000.3,238.9 1001.5,236.2C1003.3,232.2 1005.0,221.1 1005.0,213.8C1005.0,206.4 1004.4,201.4 1001.5,185.8C999.9,177.0 999.2,164.6 999.9,157.3C1000.2,154.0 1000.5,150.3 1000.5,149.1C1000.5,146.1 1001.3,146.5 1002.0,149.9C1003.6,157.5 1007.8,166.6 1012.5,172.9C1018.1,180.3 1023.4,184.1 1033.7,188.3C1037.5,189.8 1042.0,191.9 1043.8,193.1C1050.8,197.5 1055.1,204.5 1057.3,214.6C1058.3,219.5 1058.2,223.1 1057.0,225.7C1055.6,228.7 1054.9,229.2 1052.1,229.1C1049.2,229.0 1047.1,228.2 1043.1,225.3C1039.1,222.5 1035.9,221.7 1032.6,222.5C1027.5,223.7 1023.2,227.6 1020.5,233.2C1019.7,234.9 1018.0,239.9 1016.8,244.3C1014.0,253.7 1012.3,257.6 1007.7,264.2C1000.0,275.6 999.0,277.2 997.1,282.0C993.1,291.5 990.9,300.6 988.8,315.2C986.0,335.0 984.7,353.5 985.3,367.0C985.9,383.7 987.7,401.4 989.1,403.5C989.6,404.3 989.3,396.8 988.5,388.8C987.6,380.5 987.3,356.8 988.0,347.0C989.0,330.8 991.1,312.2 992.5,307.4C993.2,304.9 996.7,302.2 1001.4,300.5C1003.5,299.7 1011.3,299.7 1013.8,300.5C1019.6,302.2 1023.0,304.9 1027.6,311.1C1031.7,316.5 1033.7,318.1 1039.6,320.4C1040.7,320.9 1041.0,321.4 1041.3,323.3C1042.5,331.5 1039.0,341.7 1033.3,346.2C1031.6,347.6 1031.0,347.8 1026.6,348.1C1023.3,348.3 1021.0,348.7 1019.3,349.4C1015.7,351.0 1011.7,355.5 1008.7,361.3C1000.4,377.1 996.5,396.8 991.8,446.8C986.8,498.8 985.5,525.1 985.5,570.8C985.5,623.8 987.6,656.0 993.5,695.2C994.4,700.8 995.4,707.5 995.7,710.2C998.7,732.1 997.8,747.6 992.2,770.2C991.5,773.0 990.8,775.7 990.7,776.2C990.6,776.8 991.0,776.2 991.7,774.9C994.3,770.1 997.4,756.6 998.8,744.8C1000.3,731.3 999.6,720.1 996.0,698.5C992.6,677.7 990.5,657.7 988.9,630.0C987.9,612.1 988.0,535.2 989.1,514.8C990.5,490.5 991.7,474.2 994.0,449.8C994.3,447.0 994.7,441.9 995.0,438.5C997.7,407.2 999.2,396.1 1002.3,383.0C1004.4,374.4 1008.8,363.8 1012.5,358.5C1016.3,353.1 1021.4,350.2 1025.8,350.7C1027.3,350.9 1028.5,351.2 1028.5,351.4C1028.5,351.5 1027.8,352.7 1027.0,354.0C1021.5,362.6 1016.2,380.1 1013.5,398.2C1012.4,405.9 1010.8,422.9 1010.0,436.0C1007.7,472.6 1007.4,565.6 1009.5,609.0C1011.5,650.9 1014.6,675.9 1019.8,692.4C1022.3,700.5 1024.7,705.8 1031.0,717.0C1038.3,730.1 1040.7,736.8 1042.3,748.2C1043.1,754.7 1043.2,759.9 1042.5,765.3C1040.8,778.1 1037.2,786.0 1029.0,795.2C1027.0,797.5 1024.7,800.5 1023.8,802.0C1013.9,818.6 1014.2,846.6 1024.6,877.2C1027.4,885.6 1032.3,898.5 1034.0,902.1C1034.6,903.5 1035.0,904.7 1034.9,904.8C1034.7,904.9 1033.4,904.7 1031.9,904.3C1028.2,903.1 1021.6,902.7 1019.8,903.5C1018.4,904.1 1018.3,904.1 1019.2,904.5C1019.8,904.7 1021.3,904.9 1022.5,905.0C1030.1,905.1 1040.5,911.0 1045.9,918.2C1050.2,923.9 1053.0,931.8 1053.0,938.3C1053.0,944.3 1050.3,951.6 1046.4,955.8C1037.1,965.9 1018.3,972.2 1002.3,970.5ZM501.0,969.2C494.7,962.5 470.6,953.2 447.2,948.5C445.6,948.2 443.4,947.7 442.2,947.5C439.5,946.9 435.0,946.1 430.5,945.5C428.4,945.2 425.4,944.7 423.8,944.5C422.1,944.2 418.7,943.8 416.2,943.5C388.9,940.3 381.8,939.1 371.4,936.0C368.7,935.2 366.4,933.4 365.9,931.8C365.4,930.0 365.7,926.0 366.6,923.5C368.4,918.9 370.0,916.6 379.8,905.5C396.4,886.6 407.5,869.3 423.1,838.2C440.3,803.8 447.4,783.7 447.5,769.4C447.5,767.8 447.7,766.5 447.9,766.5C448.1,766.5 448.8,767.1 449.3,767.9C450.6,769.5 454.4,772.3 454.8,771.8C455.0,771.7 454.2,770.4 452.9,769.1C450.4,766.4 447.1,760.2 445.5,755.2C443.9,750.3 443.6,740.4 444.7,734.2C446.0,727.3 447.2,723.6 451.3,714.6C456.0,704.4 457.7,699.2 459.3,690.5C462.6,672.8 464.8,638.4 466.8,575.5C467.2,561.9 467.7,544.5 468.0,536.8C468.9,512.9 469.2,459.8 468.5,444.0C467.3,414.0 465.6,397.8 461.7,378.0C459.6,367.7 459.3,365.4 459.3,359.8C459.3,354.6 459.5,352.9 460.2,351.3C461.0,349.6 461.2,349.4 462.4,349.8C463.1,350.1 466.8,350.2 470.5,350.2C478.8,350.1 481.8,349.3 494.0,343.5C508.0,336.8 515.2,334.9 526.0,334.9C536.0,334.9 543.4,337.1 548.2,341.5C551.5,344.6 552.2,346.4 552.2,351.5C552.2,356.8 551.7,358.4 547.0,367.8C543.5,374.7 539.8,383.3 538.5,387.5C534.2,401.7 531.3,414.0 529.0,426.8C526.3,442.1 523.8,458.6 522.5,470.0C522.2,472.6 521.7,476.4 521.5,478.5C521.2,480.6 520.8,484.6 520.5,487.5C520.2,490.4 519.8,494.8 519.5,497.2C516.9,522.4 515.6,559.2 516.4,583.8C517.4,610.8 518.6,623.7 521.8,641.5C522.2,643.8 523.8,650.7 525.1,655.8C527.5,665.0 533.6,681.9 536.9,688.2C538.6,691.4 538.4,691.2 538.8,690.8C539.0,690.6 538.9,690.0 538.6,689.4C537.7,687.4 533.5,676.5 532.3,672.8C523.1,645.2 519.0,612.6 519.0,567.5C519.0,548.4 520.0,523.7 521.5,507.0C521.8,504.1 522.2,498.8 522.5,495.2C522.8,491.7 523.3,487.1 523.5,485.0C523.8,482.9 524.2,479.0 524.5,476.2C524.8,473.5 525.2,469.9 525.5,468.2C525.7,466.6 526.2,463.2 526.5,460.8C526.8,458.3 527.3,455.0 527.5,453.5C527.7,452.0 528.2,448.9 528.5,446.8C528.8,444.6 529.3,441.5 529.5,440.0C529.8,438.5 530.2,435.7 530.5,433.8C530.8,431.8 531.3,429.0 531.5,427.5C531.8,426.0 532.3,423.5 532.6,422.0C532.9,420.5 533.3,418.4 533.5,417.2C533.7,416.1 534.2,413.9 534.5,412.2C534.8,410.6 535.3,408.7 535.5,408.0C535.7,407.3 536.1,405.5 536.5,404.0C539.1,391.7 544.1,378.2 550.7,366.1C553.5,361.0 555.0,356.6 555.0,353.5C555.0,352.3 555.2,351.0 555.4,350.6C555.8,350.0 560.4,348.9 561.0,349.3C561.5,349.5 561.1,354.1 560.2,358.2C557.5,371.6 556.3,378.0 555.5,382.6C553.8,393.5 553.4,396.8 551.5,414.5C551.2,416.8 550.8,421.6 550.5,425.0C549.7,434.6 548.9,440.3 547.5,448.0C547.3,449.2 546.8,451.9 546.5,454.0C546.2,456.1 545.7,458.8 545.5,460.0C545.2,461.2 544.4,466.5 543.5,471.8C542.7,477.0 541.8,482.5 541.5,484.0C541.3,485.5 540.8,488.7 540.5,491.0C540.2,493.3 539.7,496.7 539.5,498.5C539.1,501.6 538.7,504.8 537.5,514.6C531.9,562.0 531.7,608.8 537.0,648.5C538.4,659.2 539.0,663.0 539.5,665.2C539.8,666.4 540.3,668.9 540.7,671.0C541.2,673.1 541.7,675.6 542.0,676.8C542.7,679.2 543.3,681.8 543.8,683.6C544.0,684.4 544.4,685.2 544.6,685.3C545.0,685.5 545.0,685.1 544.8,684.0C544.3,681.9 543.7,678.7 543.0,675.0C542.7,673.5 542.3,671.0 542.0,669.5C539.8,657.9 538.1,642.9 537.0,625.8C536.1,612.1 535.8,575.0 536.4,560.5C537.0,548.0 537.3,543.5 538.5,529.2C539.7,515.0 542.7,489.6 544.5,478.8C544.7,477.1 545.4,472.9 546.0,469.5C547.8,458.3 548.2,456.5 548.6,456.5C548.9,456.5 549.0,457.2 548.8,458.1C548.7,459.0 548.1,471.0 547.7,484.8C546.9,506.7 546.9,513.6 547.4,541.0C547.8,558.2 548.2,576.2 548.5,581.0C548.7,585.8 549.2,594.9 549.5,601.2C549.8,607.6 550.2,615.3 550.5,618.5C550.8,621.7 551.2,627.3 551.5,631.0C552.5,643.3 554.3,659.7 555.5,667.9C557.1,678.1 556.9,677.3 559.0,686.5C560.5,693.1 562.7,699.7 565.7,706.5C571.4,719.6 573.1,728.0 573.1,742.0C573.0,761.0 569.1,775.0 561.6,782.8C559.5,785.0 556.4,786.7 552.2,788.0C547.5,789.5 543.8,790.9 540.6,792.6C539.1,793.4 537.7,793.9 537.6,793.8C537.5,793.6 538.9,791.9 540.7,789.8C543.9,786.2 544.4,785.5 543.6,785.5C542.5,785.5 533.0,794.9 529.1,799.8C517.6,814.4 510.8,826.7 504.3,844.4C501.1,853.1 500.6,854.5 498.8,861.7C494.0,880.5 492.6,893.4 494.3,904.8C494.7,908.0 495.4,911.8 495.8,913.0C496.2,914.2 496.4,915.3 496.3,915.4C496.2,915.5 494.7,914.4 492.9,913.0C486.2,907.6 478.2,903.2 470.5,900.8C463.3,898.5 462.4,899.3 469.2,902.0C478.8,905.8 486.1,910.3 493.4,917.2C501.1,924.4 507.1,933.4 510.1,942.2C511.7,946.7 511.7,955.1 510.1,959.6C508.4,964.4 504.3,970.5 502.7,970.5C502.4,970.5 501.6,969.9 501.0,969.2ZM965.0,900.5C967.4,884.2 968.0,867.6 966.8,853.5C964.3,825.9 960.9,813.1 952.5,800.3C950.0,796.4 941.8,787.6 941.2,788.1C941.0,788.3 942.4,790.3 944.2,792.6C957.4,809.0 962.7,827.6 964.5,864.0C965.1,876.4 964.7,887.5 963.2,901.0C962.8,904.4 962.5,908.0 962.5,909.0L962.5,910.8L963.3,909.0C963.7,908.0 964.5,904.2 965.0,900.5ZM988.8,906.6C985.3,879.6 986.5,845.0 991.7,824.0C995.0,811.0 999.6,801.8 1007.7,792.0C1009.3,790.1 1010.5,788.3 1010.3,788.1C1009.8,787.6 1001.0,796.8 998.9,800.1C990.3,813.1 986.2,829.2 984.4,856.2C983.4,872.6 985.1,899.1 987.8,907.6C988.3,909.2 989.0,908.5 988.8,906.6ZM446.5,881.8C450.1,880.9 455.4,878.7 457.0,877.5C458.4,876.4 458.0,875.6 456.4,876.4C450.6,879.2 441.5,881.0 433.1,881.0C426.5,881.0 424.5,881.5 427.6,882.5C429.9,883.2 443.1,882.7 446.5,881.8ZM483.6,822.1C487.6,814.2 490.6,809.5 495.0,804.2C501.6,796.3 504.9,794.0 517.7,788.0C520.1,786.9 523.1,785.3 524.3,784.4C527.7,782.1 532.7,777.3 535.3,773.8C537.6,770.7 540.3,765.7 539.9,765.2C539.8,765.1 538.6,766.6 537.3,768.5C532.0,776.5 524.8,782.5 516.3,786.1C503.5,791.5 497.0,796.6 490.5,806.2C485.3,814.0 478.6,828.5 480.2,828.5C480.3,828.5 481.9,825.6 483.6,822.1ZM494.0,778.3C500.4,776.9 503.7,775.5 508.5,772.4C513.2,769.3 514.4,768.2 518.1,763.6C521.3,759.6 525.7,751.0 526.2,747.8C526.7,745.2 526.4,745.5 524.0,750.5C518.8,761.1 512.6,767.5 502.6,772.5C494.9,776.4 491.2,777.2 482.1,777.2C477.9,777.1 474.6,777.3 474.8,777.4C476.3,779.0 488.4,779.5 494.0,778.3ZM546.5,724.2C545.1,717.3 542.6,711.8 538.2,706.2C535.5,702.7 530.0,694.8 530.0,694.2C530.0,694.1 529.4,693.1 528.7,692.1L527.4,690.2L527.8,691.8C528.4,694.3 531.3,699.8 535.7,706.4C539.9,712.8 542.2,717.2 543.7,721.7C545.0,725.4 546.0,730.8 546.0,733.4C546.0,734.8 546.2,736.0 546.4,736.2C547.0,736.9 547.1,727.4 546.5,724.2ZM943.4,702.1C946.8,691.7 950.4,673.6 952.2,658.1C955.0,635.3 957.8,570.3 956.1,569.3C955.5,569.0 955.0,574.4 955.0,580.5C955.0,583.1 954.8,588.9 954.5,593.5C954.2,598.0 953.8,605.7 953.5,610.5C951.9,637.1 950.9,648.5 948.5,668.4C947.5,676.4 945.4,688.1 943.5,696.0C942.9,698.6 942.2,701.5 942.0,702.5C941.8,703.5 941.5,704.9 941.3,705.6C941.0,706.4 941.1,707.0 941.4,707.0C941.6,707.0 942.6,704.8 943.4,702.1ZM1008.7,703.2C1008.3,701.3 1007.7,698.9 1007.5,697.8C1007.2,696.6 1006.6,693.8 1006.0,691.5C1004.6,685.4 1003.3,677.2 1001.8,666.0C998.6,641.8 997.4,624.7 996.0,589.2C995.7,581.8 995.2,575.5 995.0,575.3C993.9,574.2 994.6,611.6 996.0,632.8C997.3,652.8 999.7,671.0 1002.6,684.2C1005.0,695.5 1008.6,707.5 1009.3,706.8C1009.4,706.7 1009.2,705.1 1008.7,703.2ZM512.0,461.0C512.0,459.5 512.2,456.5 512.5,454.3C512.8,452.1 513.2,448.0 513.5,445.2C515.3,428.5 517.9,410.7 519.5,404.8C519.7,403.9 520.2,401.9 520.5,400.2C521.3,396.2 523.8,387.5 525.2,383.5C526.9,378.9 530.0,370.9 530.5,369.9C531.1,368.8 531.1,368.0 530.6,368.0C530.1,368.0 525.3,378.2 523.3,383.5C517.4,399.7 514.3,416.7 511.8,447.5C511.0,457.3 510.8,467.2 511.5,465.0C511.7,464.3 511.9,462.5 512.0,461.0ZM464.3,347.3C461.2,346.1 459.9,344.9 458.3,341.9C456.5,338.3 456.1,332.9 457.2,327.7C457.9,324.3 461.7,313.7 462.5,312.8C462.7,312.6 463.7,313.2 464.6,314.1C467.6,317.0 473.1,319.0 478.4,319.0C482.4,319.0 488.7,317.6 497.0,315.0C501.8,313.5 505.1,312.7 511.2,311.5C522.5,309.4 526.0,308.1 531.1,303.9C536.0,299.9 544.2,297.4 548.4,298.5C552.0,299.4 554.1,300.5 555.9,302.2C557.9,304.1 558.6,305.3 560.0,309.8C561.3,313.9 562.5,316.3 565.0,320.0C567.6,324.0 568.0,325.1 568.0,329.4C567.9,338.2 563.9,345.2 558.1,346.7L555.5,347.4L554.1,344.6C551.4,338.9 545.5,334.8 537.0,332.7C532.6,331.6 519.7,331.8 513.7,333.0C506.4,334.4 503.3,335.6 492.8,340.6C487.5,343.1 481.6,345.7 479.5,346.4C474.7,347.9 467.1,348.4 464.3,347.3ZM906.4,316.6C905.9,316.1 904.9,314.4 904.2,312.7C902.9,310.0 902.8,309.2 902.8,304.0C902.8,298.8 902.9,298.0 904.2,295.3C905.9,291.7 908.4,289.3 913.6,286.2C915.9,284.9 918.9,282.6 920.4,281.1C923.3,278.1 926.7,271.8 926.4,270.0C926.3,269.0 925.9,269.5 924.5,272.2C922.1,276.9 917.8,281.2 912.5,284.0C910.2,285.2 907.5,286.9 906.4,287.9C905.4,288.8 904.5,289.5 904.5,289.4C904.4,289.3 904.3,288.0 904.2,286.5C903.7,279.3 900.2,268.0 895.2,257.0C892.2,250.6 890.9,245.5 890.8,240.5C890.8,236.6 891.0,235.3 891.9,233.3C892.9,231.1 893.1,230.9 894.4,231.2C899.2,232.5 902.4,231.8 907.1,228.6C911.4,225.6 913.6,224.8 917.0,224.8C921.2,224.8 924.2,226.2 927.5,229.8C930.6,233.2 932.5,237.1 934.5,244.2C936.5,251.4 936.9,252.9 937.8,255.0C939.6,259.1 942.2,264.0 943.7,265.9C944.5,267.0 946.6,269.7 948.2,271.8C951.8,276.6 955.2,283.4 957.9,291.0C960.3,297.9 960.8,301.0 959.8,301.0C959.4,301.0 958.9,300.8 958.8,300.5C958.6,300.3 956.7,299.4 954.4,298.5C944.5,294.7 932.4,297.5 925.0,305.3C923.2,307.2 920.9,309.8 919.8,311.1C916.7,314.8 913.9,316.4 909.0,317.2C907.6,317.4 907.0,317.3 906.4,316.6ZM1040.2,317.0C1036.2,316.0 1033.0,313.5 1029.7,308.8C1026.5,304.4 1023.4,301.5 1020.0,299.8C1015.2,297.4 1012.8,296.9 1006.9,297.1C1002.1,297.2 1001.4,297.4 998.0,299.1C995.9,300.1 994.2,300.9 994.1,300.8C993.8,300.5 996.0,292.7 997.6,288.2C999.8,281.7 1003.5,274.8 1008.2,268.3C1013.5,260.9 1017.0,253.6 1019.3,245.0C1021.2,237.7 1022.6,234.1 1024.8,231.1C1027.8,227.2 1030.5,225.2 1033.8,224.7C1036.7,224.3 1039.3,225.2 1043.2,228.0C1045.2,229.4 1047.5,230.9 1048.4,231.3C1050.5,232.2 1054.5,232.2 1056.3,231.4C1057.8,230.7 1058.1,231.1 1059.0,234.0C1061.0,240.3 1059.8,247.2 1055.2,257.4C1049.9,268.9 1046.9,278.0 1046.2,284.5C1045.8,288.7 1045.7,288.8 1043.6,287.1C1042.6,286.3 1040.3,284.7 1038.4,283.6C1034.3,280.9 1030.7,277.2 1028.2,272.8C1025.5,267.9 1025.3,269.9 1027.9,275.3C1030.5,280.5 1033.5,283.7 1038.4,286.9C1042.6,289.6 1043.7,290.7 1045.6,293.8C1048.7,298.8 1048.7,307.0 1045.7,313.2C1044.6,315.6 1042.8,317.6 1042.1,317.4C1041.9,317.4 1041.1,317.2 1040.2,317.0ZM565.9,314.8C565.0,313.6 563.7,311.1 563.1,309.4C560.2,301.6 558.7,299.7 553.5,297.3C549.3,295.4 544.0,295.3 538.8,297.0C536.9,297.6 535.3,297.9 535.1,297.8C535.0,297.6 535.1,296.9 535.5,296.1C536.3,294.1 535.9,287.0 534.8,283.2C533.4,278.6 533.4,270.2 534.9,266.0C536.6,261.5 538.5,258.1 541.6,254.7C548.7,246.7 550.2,243.9 550.2,238.1C550.2,235.9 550.4,234.0 550.6,234.0C551.1,234.0 554.8,238.5 555.9,240.6C557.7,243.8 560.0,252.1 560.0,255.6C560.0,260.2 563.5,268.0 566.9,271.0C571.4,275.0 575.4,276.1 582.0,275.4C584.1,275.2 585.8,275.2 586.0,275.3C586.6,275.9 586.1,284.4 585.3,287.1C583.4,294.2 578.2,302.9 573.5,307.1C570.7,309.5 570.1,310.6 568.4,315.2L567.6,317.2L565.9,314.8ZM471.5,315.0C467.8,313.8 465.3,311.1 464.2,307.2C463.4,304.3 463.4,304.1 464.5,298.4C465.4,293.7 465.6,291.5 465.4,287.6C464.8,277.3 459.2,267.8 449.4,260.6C440.6,254.1 437.6,246.3 441.0,239.3C442.5,236.1 445.7,234.0 448.9,234.0C456.4,234.0 465.6,230.6 471.9,225.5C476.7,221.6 481.9,213.3 482.0,209.6C482.0,208.4 482.9,208.1 483.9,209.1C484.4,209.6 484.5,209.5 484.2,208.2C483.9,207.4 483.8,204.2 483.8,201.0C483.8,194.4 484.8,190.8 487.9,186.1C492.6,179.0 499.2,175.3 511.5,173.0C520.1,171.4 521.8,171.0 526.5,169.5C538.6,165.5 549.3,158.4 562.3,145.7C571.7,136.5 576.1,131.3 590.0,114.0C601.3,99.8 605.4,95.8 612.0,92.5C614.9,91.0 615.7,90.8 619.5,90.8C623.1,90.8 624.1,91.0 626.3,92.1C629.9,94.0 631.6,95.5 633.1,98.3C638.0,107.6 635.9,116.0 621.2,145.8C612.3,163.6 606.9,177.2 602.1,193.8C599.8,201.4 599.0,204.4 598.1,209.2C595.8,220.6 595.1,227.5 594.5,243.3C594.2,252.0 593.8,257.7 593.3,259.3C591.8,265.0 588.6,269.4 584.6,271.3C583.5,271.8 581.2,272.3 579.2,272.4C576.1,272.6 575.2,272.4 572.6,271.2C567.0,268.7 563.6,263.7 562.5,256.2C560.8,244.3 561.0,245.0 558.3,239.5C555.8,234.3 547.5,226.2 541.6,223.3C538.4,221.7 532.7,220.3 526.2,219.5C516.9,218.5 511.8,216.2 506.6,210.8C504.8,209.0 503.2,207.6 503.1,207.7C502.6,208.2 506.7,213.6 509.3,215.8C513.5,219.4 518.5,221.3 527.0,222.5C539.1,224.2 545.1,227.6 547.2,234.0C549.1,239.5 547.2,245.1 541.5,251.2C533.7,259.5 531.0,265.5 531.0,274.8C531.0,278.5 531.3,281.0 532.3,284.8C533.8,290.6 533.7,294.3 531.7,298.0C529.5,302.4 523.5,306.3 517.0,307.5C515.2,307.8 512.9,308.3 511.8,308.5C510.6,308.7 508.3,309.2 506.5,309.5C504.7,309.8 502.7,310.3 502.0,310.5C501.3,310.7 499.1,311.4 497.0,312.0C494.9,312.6 492.3,313.4 491.1,313.8C483.8,316.1 476.2,316.6 471.5,315.0ZM454.5,313.1C452.0,311.5 448.9,308.3 447.8,306.1C446.5,303.6 445.5,298.5 445.5,294.2C445.4,283.3 442.2,275.4 432.9,262.8C425.3,252.5 422.6,244.4 424.5,237.4C425.2,235.0 425.7,234.7 427.4,235.9C429.7,237.5 431.8,238.1 435.5,238.2L439.1,238.2L438.7,239.8C438.5,240.6 438.3,243.2 438.3,245.5C438.2,251.2 439.8,254.3 445.0,259.2C452.5,266.4 454.9,269.0 457.2,272.7C462.2,280.6 463.5,287.9 461.6,296.8C460.9,299.9 460.5,303.2 460.6,305.3C460.7,308.3 460.6,309.0 459.4,310.8C456.6,314.9 457.0,314.7 454.5,313.1ZM433.8,235.3C432.7,235.1 431.1,234.5 430.3,234.0C426.6,232.0 425.3,225.8 427.7,221.1C430.5,215.5 435.3,213.5 445.7,213.5C455.2,213.5 459.6,212.6 466.3,209.4C470.4,207.5 473.9,204.7 477.1,200.8C478.6,199.0 480.0,197.6 480.2,197.6C480.4,197.5 480.6,199.9 480.6,202.7C480.5,207.8 480.5,208.1 478.5,212.1C476.0,217.3 473.6,220.6 469.8,223.6C464.9,227.6 460.3,229.4 452.8,230.5C447.2,231.3 445.1,232.0 442.2,233.8C439.5,235.6 436.7,236.1 433.8,235.3ZM582.0,214.6C582.0,213.9 582.2,212.6 582.5,211.8C582.7,210.9 583.8,206.9 584.9,202.8C586.9,195.2 590.3,185.2 593.1,178.8C599.4,164.1 609.9,146.1 621.6,129.8C626.4,123.1 628.8,118.8 626.7,120.5C625.5,121.5 613.6,137.6 609.6,143.6C597.9,161.2 590.4,177.4 584.6,198.0C583.8,200.9 582.9,204.7 582.5,206.5C582.2,208.3 581.7,210.7 581.5,211.8C580.9,214.6 580.9,216.6 581.5,216.2C581.8,216.1 582.0,215.4 582.0,214.6ZM467.7,170.6C471.2,167.3 475.8,164.2 481.8,161.0C487.2,158.0 489.5,156.4 493.6,152.6C499.2,147.3 504.2,139.5 506.2,132.9C507.2,129.5 506.5,129.5 504.9,133.1C499.4,144.9 492.1,152.1 476.0,161.8C471.5,164.5 462.5,173.5 464.3,173.5C464.5,173.5 466.0,172.2 467.7,170.6ZM1032.6,162.4C1028.4,156.3 1023.2,143.7 1021.1,134.2C1018.3,122.1 1017.7,116.2 1017.8,99.8C1017.8,87.7 1018.0,83.9 1018.9,77.1C1020.3,66.5 1022.8,54.2 1026.0,41.7C1029.8,26.7 1029.0,25.6 1024.6,39.9C1017.4,62.9 1014.5,80.5 1014.5,99.5C1014.5,124.6 1018.7,142.5 1028.1,157.9C1030.6,162.1 1033.6,165.8 1033.9,165.1C1034.0,164.8 1033.4,163.6 1032.6,162.4ZM921.8,162.3C930.0,152.1 936.0,136.4 938.5,118.2C940.9,100.9 940.1,80.4 936.5,63.4C935.9,60.9 935.1,57.1 934.7,55.0C933.0,46.7 928.8,32.6 927.3,29.7L926.5,28.2L926.7,30.2C927.1,32.3 927.2,33.0 929.0,39.8C931.8,50.7 933.4,59.2 935.5,74.6C937.7,91.2 937.2,109.4 933.9,127.5C932.4,136.1 931.6,138.7 928.5,146.4C926.0,152.7 924.6,155.6 921.4,160.6C920.1,162.7 919.0,164.6 919.0,164.7C919.0,165.5 920.0,164.7 921.8,162.3ZM546.4,108.9C545.6,107.4 544.5,105.7 544.0,105.0C541.8,101.9 536.9,93.1 531.8,83.2C529.2,78.1 524.3,67.5 521.2,60.2C520.9,59.4 520.1,57.7 519.6,56.5C519.0,55.2 518.1,53.0 517.5,51.5C516.9,50.0 516.0,47.9 515.5,46.8C515.0,45.7 513.5,42.0 512.2,38.8C508.9,30.2 507.9,28.0 507.4,28.0C507.1,28.0 507.1,28.4 507.3,28.9C507.5,29.4 507.8,30.4 508.0,31.2C508.7,33.9 509.8,37.1 512.0,43.0C513.1,46.2 514.8,50.5 515.6,52.8C516.4,55.0 517.2,57.2 517.5,57.8C517.7,58.3 519.2,61.8 520.8,65.5C524.8,74.9 528.9,83.3 534.0,92.2C537.6,98.6 546.7,111.5 547.5,111.5C547.8,111.5 547.3,110.3 546.4,108.9ZM1006.0,104.4C1005.7,101.3 1005.0,94.1 1004.5,88.5C1003.6,80.2 1003.4,73.5 1003.1,52.9C1003.0,38.9 1002.7,27.5 1002.5,27.5C1000.9,27.5 999.8,61.0 1001.0,72.9C1001.3,75.5 1001.8,81.3 1002.3,85.8C1002.7,90.2 1003.4,95.9 1003.8,98.5C1004.5,103.4 1006.1,110.5 1006.4,110.3C1006.5,110.2 1006.3,107.6 1006.0,104.4ZM950.1,106.9C950.3,105.7 950.8,102.8 951.2,100.5C952.8,91.2 954.4,76.1 954.8,66.1C954.9,62.3 955.1,57.6 955.2,55.5C955.4,51.1 954.7,32.7 954.2,29.6C954.0,28.5 953.7,27.5 953.5,27.5C953.3,27.5 953.0,35.8 952.8,45.9C952.4,71.0 951.8,82.2 950.0,97.8C949.0,106.2 948.8,109.7 949.4,109.3C949.6,109.2 950.0,108.1 950.1,106.9Z"
		},
		zoccoli: {
			w: 1448,
			h: 1086,
			d: "M1041.2,937.5C1057.3,935.2 1067.4,931.4 1080.0,923.0C1096.4,912.0 1103.2,911.3 1115.8,919.5C1117.7,920.8 1120.4,922.5 1121.7,923.3C1123.1,924.1 1125.2,925.4 1126.5,926.1C1132.4,929.8 1141.8,933.7 1149.8,935.7C1157.5,937.8 1174.4,938.7 1181.5,937.5C1183.0,937.3 1186.0,936.8 1188.2,936.5C1190.5,936.1 1193.5,935.5 1195.0,935.1C1196.5,934.7 1198.4,934.2 1199.2,934.0C1201.6,933.4 1211.6,930.0 1213.7,929.1C1217.2,927.6 1227.6,922.2 1231.1,920.1C1247.5,910.1 1266.0,891.9 1279.4,872.3C1282.5,867.8 1288.9,857.3 1291.9,852.0C1292.7,850.5 1294.1,847.9 1295.0,846.3C1295.9,844.6 1297.9,840.8 1299.4,837.8C1300.9,834.7 1303.4,830.3 1305.0,828.0C1319.0,807.2 1338.6,772.0 1348.8,749.4C1363.5,716.6 1374.7,680.0 1381.5,642.2C1385.0,622.7 1387.2,606.0 1388.5,589.0C1390.4,565.0 1389.9,530.3 1387.5,509.5C1384.6,484.9 1381.4,467.0 1375.9,445.2C1365.9,405.0 1352.4,369.7 1333.9,335.5C1327.2,323.2 1315.6,303.9 1309.5,295.0C1309.0,294.3 1306.9,291.2 1304.7,288.0C1282.4,255.3 1253.2,224.6 1222.8,201.7C1209.4,191.6 1188.5,178.7 1176.5,172.9C1171.7,170.6 1163.9,167.0 1163.7,167.0C1163.6,167.0 1162.1,166.4 1160.4,165.6C1158.7,164.8 1156.5,163.9 1155.5,163.5C1154.5,163.2 1153.3,162.7 1152.8,162.5C1152.2,162.3 1148.3,161.0 1144.0,159.6C1136.7,157.3 1134.6,156.7 1129.4,155.5C1112.3,151.7 1096.9,152.3 1078.2,157.5C1076.0,158.1 1073.6,158.8 1072.8,159.0C1071.9,159.2 1068.7,160.3 1065.5,161.5C1062.3,162.6 1059.2,163.8 1058.5,164.0C1056.8,164.5 1052.3,166.3 1049.5,167.6C1047.1,168.7 1044.3,169.9 1042.8,170.5C1042.2,170.7 1037.5,173.0 1032.2,175.6C987.4,197.5 948.3,230.3 915.7,273.2C909.1,281.9 889.8,310.6 886.7,316.2C886.4,316.8 885.7,318.1 885.1,319.1C884.5,320.2 883.5,321.8 882.9,322.9C882.4,323.9 881.7,325.0 881.5,325.2C881.1,325.7 879.8,328.1 875.6,335.8C871.8,342.8 861.3,364.1 858.5,370.2C841.8,408.2 827.5,454.8 821.5,490.5C819.4,503.1 817.2,521.1 816.2,533.5C815.1,546.9 815.0,579.1 815.9,592.5C819.0,637.1 826.6,678.5 838.8,717.0C841.9,726.8 847.6,742.9 849.9,748.2C850.7,750.2 852.1,753.7 853.0,756.0C858.2,769.4 872.3,798.5 881.5,814.8C884.2,819.6 884.8,820.8 886.0,823.8C890.3,834.7 898.1,849.7 907.0,864.2C922.3,889.2 940.3,907.2 963.2,920.6C964.8,921.5 972.4,925.3 975.5,926.6C986.4,931.5 1002.0,935.8 1015.0,937.5C1019.7,938.1 1036.9,938.1 1041.2,937.5ZM1019.2,934.5C1011.4,933.6 1005.5,932.6 998.5,931.0C994.1,930.0 983.3,926.4 978.0,924.1C953.3,913.6 932.7,896.0 915.3,870.5C912.2,866.0 906.0,856.1 906.0,855.7C906.0,855.5 905.6,854.8 905.1,854.1C903.1,851.3 894.1,833.8 891.8,828.5C890.9,826.3 889.6,823.3 888.1,820.1C886.6,816.6 883.8,805.7 882.5,798.1C881.3,790.6 881.0,789.0 880.5,784.5C878.4,765.4 878.4,751.3 880.5,735.2C881.2,730.3 881.7,727.7 883.6,719.5C884.4,716.2 885.7,711.9 886.6,709.6C887.8,706.6 888.0,705.9 888.5,704.9C888.7,704.3 889.3,702.7 889.8,701.5C890.8,699.2 896.4,687.9 899.7,681.8C901.6,678.2 909.1,666.8 915.4,657.9C919.5,652.1 924.3,645.7 932.0,636.0C941.4,624.1 949.5,613.3 956.0,603.5C959.8,597.9 970.4,580.2 972.5,576.0C974.4,572.2 983.0,557.7 985.7,553.8C989.4,548.2 995.0,543.0 997.2,543.0C998.3,543.0 999.5,544.8 1000.0,547.4C1001.2,552.8 998.4,562.3 990.2,580.9C985.8,590.9 973.1,616.0 968.9,622.9C967.9,624.7 967.0,626.2 967.0,626.3C967.0,626.4 963.9,631.8 956.4,644.6C950.9,654.2 950.5,654.8 947.2,660.9C946.5,662.2 945.7,663.5 945.5,663.8C944.4,665.2 934.8,683.9 932.4,689.3C931.7,690.9 930.4,693.8 929.5,695.6C928.7,697.5 928.0,699.3 928.0,699.7C928.0,700.0 927.9,700.5 927.7,700.7C926.2,702.1 919.3,725.1 918.0,732.8C916.0,744.4 915.3,760.8 916.5,769.2C917.9,778.4 918.1,779.9 918.6,782.2C918.9,783.6 919.6,786.7 920.2,789.0C921.0,792.4 921.2,794.5 921.1,799.5C920.8,815.4 924.3,825.6 933.1,833.8C936.1,836.6 941.8,840.0 945.2,841.1C951.4,843.0 952.4,843.1 960.2,843.1C965.3,843.1 970.1,842.8 973.2,842.3C976.0,841.8 979.7,841.2 981.5,840.9C987.0,840.1 990.1,839.6 995.5,838.7C1005.0,837.1 1022.5,837.5 1031.2,839.5C1045.7,842.8 1052.4,844.9 1060.0,848.6C1078.8,857.6 1088.3,869.4 1090.5,886.7C1092.1,899.3 1086.0,913.6 1075.6,921.5C1071.0,925.0 1063.7,928.5 1056.7,930.7C1045.5,934.2 1030.1,935.7 1019.2,934.5ZM1162.8,934.5C1151.0,933.1 1143.9,931.1 1134.0,926.3C1129.3,924.1 1125.6,921.5 1122.1,918.0C1114.8,910.7 1111.9,903.8 1111.9,893.5C1111.8,878.4 1119.4,864.7 1133.2,854.9C1135.6,853.2 1141.5,850.1 1145.5,848.3C1148.8,846.9 1159.7,843.5 1163.0,842.9C1163.7,842.7 1165.9,842.3 1168.0,841.9C1173.8,840.7 1178.2,840.1 1184.8,839.5C1190.7,839.0 1199.7,839.4 1212.8,841.0C1226.6,842.6 1236.6,842.8 1242.4,841.5C1257.1,838.0 1268.5,826.3 1272.2,810.8C1272.7,808.8 1273.2,806.7 1273.3,806.0C1273.5,805.3 1273.8,802.2 1274.0,799.0C1274.2,795.8 1274.6,792.5 1274.9,791.5C1282.3,767.4 1283.9,746.1 1280.1,723.5C1278.7,715.6 1274.6,700.3 1272.5,695.8C1272.3,695.2 1271.4,692.8 1270.5,690.5C1268.5,685.3 1262.3,673.1 1258.1,666.1C1256.4,663.3 1255.0,660.9 1255.0,660.8C1255.0,660.7 1253.8,658.7 1252.4,656.4C1251.0,654.1 1249.5,651.6 1249.0,650.8C1248.5,649.9 1247.0,647.4 1245.6,645.1C1244.2,642.8 1243.0,640.8 1243.0,640.7C1243.0,640.5 1242.6,639.8 1242.1,639.1C1239.9,635.9 1228.1,613.5 1225.8,608.0C1225.3,606.8 1224.2,604.4 1223.5,602.8C1221.0,597.2 1220.0,595.0 1220.0,594.8C1220.0,594.6 1219.3,593.1 1218.5,591.2C1217.7,589.4 1217.0,587.9 1217.0,587.7C1217.0,587.6 1216.6,586.5 1216.1,585.4C1215.5,584.2 1214.4,581.5 1213.6,579.2C1212.8,577.0 1211.3,573.1 1210.2,570.5C1204.6,556.0 1203.2,546.5 1206.5,543.9C1208.0,542.7 1209.8,543.5 1212.9,546.5C1216.6,550.2 1220.3,556.0 1225.9,567.5C1233.6,583.0 1238.4,592.3 1240.9,596.8C1244.1,602.4 1250.6,612.5 1253.4,616.4C1254.7,618.2 1257.6,622.2 1260.0,625.4C1262.3,628.6 1266.0,633.7 1268.3,636.8C1289.3,665.2 1300.4,683.5 1308.0,702.8C1311.2,710.9 1314.3,722.2 1315.6,730.8C1316.4,736.6 1316.5,760.5 1315.6,767.0C1314.6,774.9 1313.3,783.0 1311.9,789.8C1311.0,794.9 1310.8,795.4 1309.0,803.2C1306.6,813.4 1304.4,820.3 1302.1,825.0C1298.0,833.0 1293.0,842.6 1292.6,843.2C1292.3,843.5 1291.3,845.3 1290.3,847.2C1289.2,849.2 1287.7,852.0 1286.9,853.5C1285.1,856.8 1282.6,860.8 1277.6,868.5C1260.2,895.3 1235.6,916.6 1210.6,926.6C1210.0,926.8 1209.0,927.2 1208.4,927.5C1205.2,928.8 1195.8,931.6 1192.5,932.2C1187.2,933.2 1184.6,933.6 1178.5,934.3C1171.1,935.0 1168.0,935.1 1162.8,934.5ZM342.5,931.3C355.3,929.6 364.3,927.4 370.1,924.4C370.6,924.2 371.2,924.0 371.5,924.0C371.8,924.0 376.6,921.8 382.2,919.0C404.5,908.0 410.0,908.0 432.0,918.6C446.7,925.7 454.7,928.4 468.2,930.6C473.6,931.5 495.8,931.5 501.5,930.6C509.6,929.3 516.6,927.9 521.0,926.5C521.7,926.3 523.3,925.8 524.5,925.5C528.4,924.4 535.7,921.9 538.0,920.9C539.2,920.3 540.9,919.6 541.8,919.2C553.9,914.0 566.1,907.0 576.8,899.3C597.1,884.6 612.2,868.9 629.6,844.8C638.3,832.5 639.6,830.7 643.2,824.8C645.1,821.7 649.7,815.4 653.4,810.8C664.3,797.1 666.1,794.8 668.7,791.4C671.9,787.4 682.3,773.4 686.1,768.2C692.8,758.9 703.6,741.9 707.7,734.2C708.8,732.3 710.5,729.3 711.5,727.5C715.0,721.5 725.0,701.2 725.0,700.2C725.0,700.0 728.7,691.9 729.5,690.4C729.8,689.9 730.0,689.3 730.0,689.0C730.0,688.7 730.4,687.5 731.0,686.2C731.5,685.0 732.4,683.0 733.0,681.8C733.5,680.5 734.0,679.2 734.0,678.9C734.0,678.5 734.2,678.0 734.4,677.7C735.2,676.9 744.8,648.7 747.0,640.8C747.3,639.9 747.7,638.5 747.9,637.5C751.2,626.0 754.7,611.1 756.6,601.5C761.0,578.0 762.6,564.4 763.5,542.8C764.5,519.5 762.5,490.5 758.5,468.8C755.5,452.6 753.1,442.9 748.9,428.8C747.3,423.3 739.9,401.5 738.5,398.2C738.3,397.7 737.4,395.3 736.5,393.0C735.6,390.7 734.7,388.5 734.4,388.3C734.2,388.0 734.0,387.5 734.0,387.2C734.0,386.8 733.3,385.1 732.5,383.2C731.7,381.4 731.0,379.9 731.0,379.8C731.0,379.5 729.4,375.8 727.0,370.8C726.2,369.1 725.1,366.6 724.5,365.2C722.0,359.6 714.4,344.8 710.2,337.5C706.3,330.6 692.1,308.6 688.5,304.0C687.8,303.0 685.7,300.3 684.0,298.0C650.5,253.2 612.1,220.2 565.6,196.4C545.4,186.0 533.0,180.9 512.2,174.6C505.5,172.5 496.2,170.0 491.2,168.9C489.9,168.6 488.0,168.2 487.0,168.0C479.6,166.3 471.9,164.9 464.4,164.0C454.2,162.7 451.6,162.4 442.5,161.7C431.1,160.9 401.7,160.8 391.3,161.5C380.1,162.3 369.2,163.4 362.5,164.5C361.0,164.7 357.8,165.2 355.5,165.5C349.1,166.4 328.9,170.5 323.5,172.0C322.5,172.2 319.9,172.9 317.8,173.5C312.6,174.9 311.4,175.2 307.5,176.4C305.7,177.0 303.0,177.8 301.5,178.2C298.4,179.2 298.9,179.0 289.0,182.5C274.2,187.8 259.2,194.6 244.5,202.5C225.5,212.7 206.5,225.5 187.0,241.2C168.3,256.3 155.3,269.3 134.0,294.0C126.1,303.2 110.6,325.3 102.4,339.0C95.4,350.6 85.4,369.9 80.8,380.8C79.4,383.8 78.0,387.1 77.5,388.2C73.9,396.2 66.8,415.6 63.8,425.2C62.8,428.6 61.6,432.3 61.2,433.5C60.4,435.8 55.8,453.7 55.0,457.2C54.8,458.4 54.1,461.4 53.5,464.0C51.1,474.9 49.5,485.5 47.4,504.8C46.5,512.9 46.5,552.4 47.4,561.0C48.7,574.0 49.1,576.9 50.1,583.5C51.1,590.4 52.7,599.6 53.5,603.2C53.7,604.4 54.2,606.6 54.5,608.2C59.3,631.5 69.7,664.7 77.8,682.4C78.5,683.8 79.0,685.1 79.0,685.3C79.0,686.1 87.9,704.9 92.8,714.3C106.4,740.7 117.4,757.9 141.0,789.5C147.5,798.2 153.4,806.6 154.2,808.2C159.5,819.6 166.6,830.5 178.2,845.0C204.5,877.9 221.1,893.6 244.5,907.6C248.5,910.0 259.5,915.7 263.8,917.5C265.1,918.1 266.9,918.9 267.8,919.3C270.5,920.5 279.7,923.8 282.0,924.5C283.2,924.8 284.8,925.3 285.5,925.5C291.5,927.6 304.5,930.3 314.5,931.4C320.7,932.2 336.2,932.1 342.5,931.3ZM317.8,928.2C304.2,927.0 295.1,925.2 282.5,921.0C272.0,917.5 270.3,916.8 259.2,911.5C235.1,899.9 215.7,884.0 193.8,858.0C171.9,832.1 165.9,823.8 159.5,810.7C155.4,802.4 155.5,802.5 154.1,798.2C151.8,791.1 151.4,788.9 149.4,774.2C148.6,768.2 148.6,746.3 149.4,741.5C150.2,736.8 151.0,733.0 151.9,729.5C152.3,728.0 152.8,726.1 153.0,725.2C154.0,721.2 161.0,706.1 164.8,699.6C168.1,693.8 176.4,682.1 182.2,674.8C192.4,661.9 200.0,653.1 214.7,637.2C240.3,609.6 249.0,598.3 267.1,568.8C277.8,551.4 284.7,542.7 289.2,540.8C291.8,539.7 292.6,539.8 294.0,541.3C295.1,542.5 295.2,543.0 295.2,547.2C295.2,551.1 295.0,552.5 293.4,557.0C289.3,568.8 280.9,586.5 271.1,603.5C263.0,617.7 259.5,623.3 245.8,643.8C222.0,679.5 213.9,692.9 207.4,707.5C203.1,717.0 203.3,716.5 201.6,721.8C196.5,737.0 194.5,749.9 195.6,760.7C196.1,765.7 197.6,774.9 198.5,777.8C200.2,783.0 201.5,787.1 202.4,789.2C203.0,790.9 203.5,793.6 203.7,797.5C204.1,805.6 205.9,811.0 210.3,817.2C219.3,830.2 235.8,836.4 256.9,834.6C260.9,834.2 265.6,833.7 267.2,833.5C286.1,830.6 301.4,829.0 309.2,829.0C322.7,829.0 342.0,832.3 353.9,836.5C355.5,837.1 357.8,837.9 359.0,838.3C366.1,840.7 375.6,846.3 382.2,851.8C393.1,861.0 399.1,876.8 396.5,889.6C392.7,908.1 382.0,918.2 359.5,924.5C358.3,924.8 356.7,925.3 356.0,925.5C354.6,925.9 351.0,926.6 346.0,927.5C342.6,928.0 329.1,929.0 326.7,928.9C325.9,928.9 321.9,928.6 317.8,928.2ZM471.0,927.4C469.5,927.2 466.7,926.7 464.8,926.4C450.6,924.1 436.0,917.9 428.6,910.9C421.4,904.0 418.0,896.3 418.0,886.5C418.0,880.6 418.6,876.9 420.5,872.2C426.0,858.4 437.5,848.1 455.2,841.0C470.1,835.1 492.7,830.9 510.0,830.9C518.2,831.0 523.0,831.3 539.8,833.0C548.3,833.9 562.3,834.2 566.9,833.5C587.1,830.6 600.5,819.6 605.8,801.6C606.5,799.2 607.2,795.3 607.3,793.0C607.5,789.7 608.0,787.8 609.3,784.7C615.0,771.1 617.7,758.4 617.7,745.5C617.6,725.1 611.3,705.0 598.6,683.7C595.0,677.8 588.1,667.8 578.2,654.2C571.3,644.7 562.5,631.9 558.5,625.5C556.0,621.4 555.2,620.1 553.0,616.2C552.4,615.2 551.7,613.9 551.3,613.3C549.3,610.3 540.0,592.0 536.1,583.5C533.4,577.7 532.0,574.5 532.0,574.2C532.0,574.1 531.3,572.6 530.5,570.8C529.7,568.9 529.0,567.3 529.0,567.1C529.0,566.9 528.5,565.8 528.0,564.6C527.5,563.5 527.0,562.2 527.0,561.9C527.0,561.5 526.8,561.0 526.5,560.7C526.0,560.2 524.7,556.4 523.7,552.6C523.3,551.1 523.0,548.2 523.0,546.1C523.0,542.6 523.1,542.0 524.2,541.1C528.7,536.8 537.1,545.9 549.0,567.8C549.9,569.4 551.2,571.8 551.9,573.0C552.6,574.2 553.8,576.5 554.6,578.0C555.5,579.5 556.6,581.3 557.1,582.1C557.6,582.8 558.0,583.5 558.0,583.7C558.0,584.4 566.5,597.4 572.0,605.0C574.7,608.7 588.7,626.3 589.5,627.0C589.6,627.1 592.2,630.1 595.2,633.5C598.2,636.9 602.9,642.3 605.7,645.5C637.2,681.1 650.9,702.5 657.5,726.5C659.9,735.4 660.6,747.1 659.5,759.2C657.9,776.2 651.7,800.3 645.6,813.3C642.4,820.0 634.2,832.2 621.8,849.0C605.5,871.1 589.5,886.5 568.8,900.3C553.2,910.7 535.1,919.3 521.0,923.1C520.0,923.3 518.5,923.8 517.5,924.0C513.3,925.2 507.3,926.3 499.5,927.3C493.2,928.1 475.6,928.2 471.0,927.4ZM1087.0,914.2C1087.0,914.0 1087.6,912.8 1088.4,911.6C1090.1,908.8 1091.4,905.7 1092.2,902.2C1093.3,898.3 1094.2,889.7 1093.8,887.1C1093.6,885.8 1093.8,882.0 1094.2,878.7C1095.7,867.4 1095.1,854.8 1092.5,839.8C1091.4,833.6 1091.0,831.1 1090.0,824.5C1086.0,798.8 1086.0,776.0 1090.0,742.2C1090.3,739.8 1090.8,736.1 1091.0,734.0C1091.2,731.9 1091.7,728.7 1092.0,726.8C1092.3,724.8 1092.9,720.3 1093.5,716.6C1096.2,698.4 1096.4,697.4 1098.0,689.0C1098.2,687.8 1099.0,682.9 1099.8,678.2C1100.5,673.6 1101.3,669.6 1101.5,669.3C1101.9,668.9 1102.7,671.9 1103.5,677.8C1103.8,680.0 1104.5,684.2 1105.0,687.2C1105.9,692.8 1106.5,697.1 1107.5,704.4C1107.8,706.5 1108.3,709.6 1108.5,711.2C1108.7,712.9 1109.2,716.4 1109.5,719.0C1109.8,721.6 1110.3,725.4 1110.5,727.5C1113.3,750.7 1114.4,774.2 1113.6,793.0C1113.2,800.6 1112.7,809.0 1112.5,811.8C1111.3,823.3 1110.7,828.7 1109.7,835.4C1109.6,836.3 1109.2,838.8 1109.0,841.1C1106.7,859.9 1106.6,864.4 1107.8,875.2C1108.3,879.1 1108.7,886.2 1108.7,891.0C1108.8,897.3 1109.1,900.5 1109.6,902.5C1110.9,907.0 1112.5,910.8 1114.1,913.1C1115.3,914.8 1115.1,914.8 1111.8,913.3C1108.5,911.8 1103.3,910.5 1100.4,910.5C1097.9,910.5 1092.4,912.0 1089.4,913.6C1087.4,914.6 1087.0,914.7 1087.0,914.2ZM390.5,910.8C390.5,910.7 391.5,909.1 392.7,907.4C397.5,900.3 399.4,893.7 400.0,881.5C400.2,877.2 400.7,872.4 400.9,870.8C401.9,865.6 402.2,854.6 401.5,848.0C400.9,841.5 400.6,839.4 398.0,825.5C396.5,817.5 395.9,814.0 395.0,807.0C394.2,801.4 393.0,784.0 393.0,777.8C393.0,772.2 394.1,752.1 394.7,747.7C394.9,746.6 395.2,743.4 395.5,740.5C395.8,737.6 396.3,733.7 396.5,731.8C397.9,721.5 400.0,707.4 401.2,700.0C401.6,697.7 402.2,694.1 402.5,692.0C402.8,689.9 403.9,682.9 405.0,676.3C406.1,669.8 407.0,664.2 407.0,664.0C407.0,663.7 407.2,663.5 407.4,663.5C407.7,663.5 408.0,664.8 408.2,666.4C408.3,668.0 408.7,670.9 409.0,672.9C410.1,680.5 410.5,683.9 411.0,687.8C411.3,690.0 411.7,693.4 412.0,695.5C412.3,697.6 412.7,701.0 413.0,703.2C413.5,707.3 414.6,716.7 415.5,723.5C415.8,725.6 416.2,729.8 416.5,733.0C416.8,736.2 417.2,741.1 417.5,744.0C417.7,746.9 418.2,755.8 418.6,763.8C419.1,776.2 419.0,780.2 418.3,792.5C417.5,805.5 416.4,817.3 415.0,827.0C414.0,834.1 413.1,841.8 412.4,848.4C411.7,856.0 412.3,864.9 414.1,873.8C414.8,877.4 415.1,880.5 415.0,885.2C415.0,890.5 415.2,892.5 416.0,895.5C417.3,900.2 419.9,905.7 421.9,908.2C423.7,910.4 423.9,911.3 422.5,910.5C422.0,910.2 419.1,909.4 416.2,908.7C408.3,906.8 402.3,907.3 391.6,910.7C391.0,910.9 390.5,911.0 390.5,910.8ZM1110.8,872.6C1110.1,865.0 1110.6,851.5 1112.0,842.8C1117.3,808.9 1118.3,775.0 1115.2,741.8C1114.8,737.6 1114.3,732.5 1114.0,730.2C1113.8,728.0 1113.4,725.0 1113.3,723.5C1113.1,722.0 1112.5,717.5 1112.0,713.5C1111.4,709.5 1110.7,703.7 1110.2,700.5C1109.4,693.7 1107.8,682.9 1107.0,678.9C1106.7,677.3 1106.3,674.8 1106.0,673.4C1105.2,668.6 1104.1,663.8 1103.4,661.9C1102.8,660.4 1101.5,660.1 1100.6,661.2C1099.4,662.6 1096.8,675.1 1093.5,695.8C1092.6,701.0 1091.6,707.3 1091.2,709.8C1090.4,714.5 1089.8,718.3 1089.0,724.5C1088.7,726.6 1088.3,729.9 1088.0,732.0C1086.5,742.4 1085.6,750.9 1085.0,759.0C1084.7,762.7 1084.4,766.2 1084.2,766.9C1083.6,769.6 1084.0,802.0 1084.7,809.0C1085.7,818.6 1086.4,823.6 1087.0,827.2C1087.3,828.9 1087.8,831.5 1088.0,833.1C1088.3,834.7 1088.7,837.3 1089.0,838.9C1091.2,852.2 1092.2,862.4 1091.9,868.9C1091.8,871.4 1091.6,873.6 1091.4,873.8C1091.2,874.0 1090.6,873.0 1089.9,871.7C1086.6,864.5 1079.2,856.1 1072.1,851.4C1061.6,844.5 1044.9,838.4 1029.5,835.8C1013.3,833.0 1004.8,833.4 978.5,838.0C966.8,840.1 956.9,840.5 951.2,839.3C938.7,836.6 929.6,828.2 926.1,816.1C923.9,808.8 923.8,802.5 925.5,792.2C927.3,782.3 934.1,759.8 938.5,749.8C938.7,749.2 939.9,746.2 941.0,743.0C942.2,739.8 943.5,736.4 944.0,735.2C945.6,731.6 946.1,730.3 948.2,725.0C949.4,722.1 951.9,716.3 953.7,712.0C955.6,707.7 959.0,700.0 961.3,694.8C963.5,689.5 967.4,680.8 969.8,675.2C978.8,654.7 992.5,621.3 998.2,606.1C999.4,602.9 1002.6,595.0 1005.2,588.5C1007.8,582.0 1010.6,575.0 1011.5,572.9C1015.1,563.7 1016.2,560.9 1018.6,555.2C1023.5,543.5 1026.9,535.2 1029.0,530.0C1030.2,527.1 1031.4,524.1 1031.8,523.2C1032.4,521.8 1034.4,516.6 1037.3,509.0C1038.0,507.2 1038.9,504.7 1039.3,503.5C1039.7,502.3 1040.2,500.8 1040.5,500.2C1040.7,499.7 1041.2,498.5 1041.5,497.5C1041.8,496.5 1042.3,495.3 1042.5,494.8C1043.5,492.3 1044.7,489.0 1045.5,486.5C1046.0,485.0 1047.4,481.1 1048.7,477.8C1050.0,474.4 1051.7,470.1 1052.5,468.0C1054.2,463.4 1058.9,451.1 1059.5,449.8C1060.3,448.0 1062.5,441.5 1067.5,426.5C1070.2,418.4 1073.1,409.9 1073.9,407.7C1075.4,403.7 1075.7,402.9 1077.9,397.9C1078.5,396.6 1079.0,395.4 1079.0,395.3C1079.0,394.7 1082.4,387.9 1084.7,384.0C1089.6,375.5 1094.1,370.2 1099.2,367.2C1101.2,366.1 1102.3,365.8 1105.0,365.8C1113.8,365.7 1120.0,373.4 1131.6,399.0C1133.3,402.7 1137.3,413.1 1139.2,418.8C1139.6,419.9 1141.3,425.6 1143.0,431.5C1146.7,444.4 1150.9,457.0 1154.5,466.0C1155.8,469.3 1160.8,483.0 1165.8,497.2C1167.8,503.0 1171.8,514.5 1174.8,522.8C1179.3,535.6 1184.1,549.5 1189.2,564.5C1189.9,566.6 1193.2,576.6 1196.5,586.8C1202.2,604.0 1207.9,619.1 1214.0,633.2C1216.5,639.0 1218.3,643.2 1224.1,656.4C1225.5,659.6 1227.2,663.5 1227.9,665.0C1228.6,666.5 1230.1,670.0 1231.3,672.8C1232.4,675.5 1234.1,679.2 1234.9,681.0C1235.7,682.8 1237.4,686.6 1238.6,689.5C1239.9,692.4 1241.5,696.0 1242.2,697.6C1245.4,704.6 1246.0,706.0 1246.0,706.2C1246.0,706.4 1246.5,707.7 1247.2,709.1C1247.9,710.6 1249.1,713.5 1250.0,715.8C1250.9,718.0 1252.0,720.7 1252.5,721.8C1253.7,724.3 1255.5,728.8 1256.0,730.5C1256.2,731.2 1257.1,733.7 1258.0,736.0C1261.8,746.3 1263.2,750.8 1266.2,762.8C1268.8,773.2 1269.1,774.6 1270.5,786.5C1271.5,795.0 1270.8,805.7 1268.8,811.8C1268.3,813.1 1266.9,816.4 1265.6,819.0C1263.7,823.0 1262.6,824.4 1258.8,828.3C1249.1,838.0 1239.3,840.5 1219.8,838.2C1203.2,836.3 1198.7,836.0 1191.0,836.0C1182.2,836.0 1177.4,836.5 1169.2,838.0C1141.0,843.6 1124.2,853.4 1114.6,870.2C1113.2,872.7 1112.0,875.0 1112.0,875.4C1112.0,875.7 1111.8,876.0 1111.6,876.0C1111.3,876.0 1111.0,874.5 1110.8,872.6ZM416.3,868.6C415.6,863.2 415.4,851.0 415.9,845.8C416.2,842.7 417.4,832.9 418.5,824.0C421.5,799.6 422.2,788.8 421.8,769.8C421.5,750.7 420.3,736.0 416.5,704.5C411.8,666.3 409.6,653.5 407.5,653.5C405.8,653.5 405.0,657.1 400.2,685.8C397.6,701.5 397.5,702.0 397.0,705.5C396.7,707.3 396.3,710.2 396.1,712.0C394.0,726.0 392.2,739.9 391.5,747.2C390.2,761.1 390.0,765.7 390.0,777.3C390.0,792.3 391.0,804.1 393.5,818.2C393.7,819.6 394.2,822.3 394.5,824.2C394.8,826.2 395.3,828.6 395.5,829.8C395.8,830.9 396.2,833.7 396.5,836.0C396.8,838.3 397.3,841.4 397.6,842.8C398.3,846.3 398.6,861.2 398.1,864.8L397.7,867.8L396.4,865.0C393.9,860.0 391.0,855.8 387.0,851.9C371.8,837.1 342.8,827.0 312.8,826.2C302.0,825.8 295.5,826.3 278.8,828.8C252.6,832.5 239.6,832.3 229.0,828.1C218.4,824.0 210.3,814.8 207.7,804.0C205.9,796.8 207.5,782.8 211.5,768.8C218.0,746.5 231.3,717.7 251.5,682.2C271.8,646.7 280.4,630.6 287.4,615.0C296.4,595.0 298.6,590.2 304.1,578.6C305.1,576.4 306.0,574.4 306.0,574.3C306.0,574.1 307.4,571.0 309.2,567.4C310.9,563.7 313.3,558.8 314.4,556.4C315.6,554.0 317.4,550.1 318.5,547.9C319.5,545.6 320.9,542.6 321.5,541.2C322.1,539.9 323.4,537.1 324.3,535.1C325.2,533.1 326.6,530.3 327.3,528.7C327.9,527.2 329.1,524.8 329.8,523.2C330.4,521.7 331.0,520.4 331.0,520.2C331.0,520.1 331.6,518.6 332.4,516.9C333.8,513.8 337.2,505.3 339.1,500.0C339.6,498.5 340.3,496.7 340.6,496.0C341.3,494.4 341.6,493.7 343.5,488.5C344.4,486.2 345.3,483.8 345.5,483.2C345.7,482.7 346.3,481.2 346.7,480.0C347.2,478.8 347.9,477.0 348.3,476.0C349.4,473.6 349.5,473.4 353.0,464.2C354.7,459.9 356.3,455.7 356.6,455.0C357.8,452.1 358.5,450.3 360.0,446.2C360.6,444.6 361.3,442.8 361.5,442.2C361.8,441.7 364.1,434.8 366.7,426.9C373.3,407.1 377.7,396.5 382.9,387.8C383.9,386.1 385.0,384.2 385.4,383.5C387.8,378.9 394.4,371.4 398.7,368.6C403.0,365.7 405.0,365.0 408.5,365.0C417.0,365.0 424.5,371.6 434.0,387.1C435.1,389.0 436.0,390.6 436.0,390.7C436.0,390.9 436.6,392.1 437.4,393.4C443.7,404.1 448.8,415.6 454.5,431.8C459.6,446.8 460.7,449.5 468.7,468.8C474.9,483.4 481.1,498.8 486.7,513.5C488.6,518.3 492.6,528.5 495.6,536.2C501.3,550.9 505.1,560.7 507.5,567.0C512.5,580.4 519.0,596.8 520.5,600.2C521.2,601.9 522.3,604.3 522.8,605.5C523.8,608.1 534.8,629.9 535.5,630.7C535.7,631.0 536.9,633.3 538.3,635.8C540.9,640.6 542.3,643.2 543.9,646.1C545.9,649.5 546.8,651.2 548.9,655.1C550.1,657.3 552.2,660.9 553.5,663.3C554.9,665.7 556.0,667.7 556.0,667.8C556.0,667.8 557.1,669.8 558.4,672.1C560.8,676.2 562.7,679.6 566.3,686.4C567.3,688.2 568.3,690.0 568.5,690.2C568.7,690.5 569.9,692.5 571.0,694.8C572.2,697.0 574.2,700.5 575.4,702.8C578.3,708.3 586.5,724.5 588.2,728.5C590.5,733.8 591.4,735.9 592.6,738.4C593.2,739.7 594.3,742.5 595.1,744.8C599.3,756.1 601.9,766.1 603.5,776.4C604.3,781.4 604.3,792.5 603.6,796.8C601.7,806.8 596.9,815.1 589.6,821.0C578.0,830.2 565.6,832.3 539.0,829.6C510.0,826.6 499.7,826.8 479.5,830.8C457.7,835.0 443.3,841.2 430.5,852.0C425.8,855.9 419.2,865.2 418.1,869.3C417.5,871.5 416.7,871.2 416.3,868.6ZM1310.2,811.9C1310.4,811.3 1311.4,807.3 1312.5,803.0C1316.7,786.4 1319.4,766.2 1319.8,748.1L1320.0,737.5L1322.2,732.1C1323.4,729.2 1325.2,725.0 1326.2,722.8C1333.9,706.3 1341.6,687.1 1346.2,673.2C1365.4,615.8 1370.6,568.8 1364.5,508.2C1362.9,492.7 1361.8,485.5 1357.9,465.8C1349.2,421.7 1332.6,376.8 1310.2,337.0C1303.3,324.6 1301.9,322.4 1295.4,312.4C1285.8,297.9 1285.6,297.6 1271.8,280.3C1259.2,264.5 1242.4,247.1 1230.0,237.0C1228.5,235.8 1227.1,234.6 1227.0,234.5C1226.2,233.6 1218.5,227.6 1214.0,224.5C1211.1,222.5 1207.0,219.5 1204.8,218.0C1199.1,214.0 1185.1,205.8 1176.5,201.5C1162.6,194.6 1147.7,189.0 1133.4,185.6C1114.3,180.9 1104.7,180.6 1086.8,184.3C1079.1,185.9 1067.1,189.1 1061.0,191.3C1058.4,192.3 1055.3,193.4 1054.1,193.8C1045.3,196.9 1027.3,205.5 1015.5,212.2C994.3,224.4 972.1,241.9 955.3,259.8C945.2,270.5 932.9,285.3 925.0,296.2C923.6,298.2 922.1,300.1 921.7,300.6C920.7,301.9 909.0,319.4 909.0,319.8C909.0,319.9 907.9,321.7 906.5,323.8C905.1,325.8 904.0,327.6 904.0,327.8C904.0,328.0 903.6,328.7 903.1,329.4C902.2,330.7 901.7,331.5 898.9,336.4C898.4,337.4 897.7,338.5 897.5,338.8C897.3,339.0 896.2,340.9 895.1,343.0C894.0,345.1 892.3,348.2 891.3,350.0C887.7,356.6 880.3,372.0 875.9,382.2C855.5,429.6 843.7,476.5 839.2,527.2C838.1,539.9 837.9,575.4 838.9,586.5C843.0,632.2 852.5,670.7 870.2,714.0C872.1,718.5 874.5,724.6 875.6,727.4L877.5,732.6L876.8,740.4C875.1,757.7 876.1,782.1 879.2,798.2C880.1,802.9 880.2,804.4 879.5,803.7C878.9,803.1 867.3,780.1 865.0,775.0C864.1,772.9 862.8,770.0 862.1,768.5C861.4,767.0 860.6,765.1 860.2,764.2C859.9,763.4 859.2,761.7 858.6,760.5C857.1,757.2 852.9,746.5 850.8,740.8C849.8,738.0 848.5,734.6 848.0,733.2C837.9,706.2 829.2,671.3 824.1,637.0C822.1,623.9 821.6,619.1 819.4,593.2C818.4,581.8 818.6,544.7 819.7,532.8C821.7,510.8 823.5,497.4 827.2,479.0C831.6,457.1 839.9,428.0 848.0,406.1C848.6,404.7 849.4,402.3 850.0,400.9C851.1,397.8 857.3,381.9 858.2,379.8C858.6,378.9 859.4,377.2 859.9,375.9C860.5,374.6 861.0,373.4 861.0,373.2C861.0,372.1 876.7,340.7 880.9,333.4C882.6,330.5 884.0,328.0 885.4,325.5C886.8,323.0 889.6,318.3 893.4,312.2C903.0,296.6 911.9,283.9 923.5,269.0C947.7,237.8 978.8,210.3 1012.3,190.4C1030.5,179.5 1050.7,170.1 1067.7,164.4C1076.5,161.5 1085.7,159.1 1094.8,157.4C1099.3,156.6 1117.2,156.5 1121.2,157.4C1122.9,157.7 1125.9,158.3 1128.0,158.7C1153.0,163.8 1186.7,180.0 1216.2,201.2C1255.8,229.8 1289.1,267.1 1319.0,316.5C1341.3,353.4 1357.8,391.5 1369.2,432.8C1373.7,449.1 1378.2,469.7 1381.0,486.2C1387.8,527.7 1388.0,578.8 1381.5,621.5C1375.2,662.6 1366.7,695.7 1354.2,727.7C1348.4,742.6 1337.3,766.4 1331.5,776.5C1330.5,778.3 1328.8,781.3 1327.7,783.2C1321.2,795.5 1310.9,813.0 1310.3,813.0C1310.1,813.0 1310.0,812.5 1310.2,811.9ZM654.6,798.9C658.5,786.5 661.0,774.4 662.5,760.2C662.8,757.2 663.2,754.1 663.3,753.2C663.5,751.4 665.9,746.8 669.6,740.8C671.1,738.3 674.0,733.5 675.9,730.2C677.9,727.0 680.5,722.6 681.8,720.6C683.0,718.6 684.5,716.2 685.0,715.3C685.5,714.5 686.8,712.3 687.9,710.5C688.9,708.7 691.0,705.0 692.5,702.2C693.9,699.5 695.3,697.0 695.5,696.8C696.5,695.5 708.0,672.9 708.0,672.3C708.0,672.1 708.5,670.8 709.2,669.4C710.8,665.9 712.5,662.1 713.2,660.2C713.6,659.4 714.4,657.7 714.9,656.4C715.5,655.1 716.0,653.8 716.0,653.5C716.0,653.2 716.2,652.6 716.4,652.1C717.0,650.9 717.7,649.3 719.0,645.9C719.5,644.3 720.4,641.8 721.0,640.4C721.5,638.9 722.4,636.2 723.0,634.2C723.6,632.3 724.5,629.5 725.0,628.0C726.2,624.5 728.5,616.8 729.0,614.5C729.2,613.5 730.1,610.0 731.0,606.8C734.9,591.6 737.1,579.5 739.0,563.0C742.6,531.4 741.1,493.2 735.1,464.0C734.7,461.9 734.2,459.4 734.0,458.2C732.9,452.5 729.8,440.2 727.5,432.9C727.0,431.0 726.1,428.1 725.5,426.4C722.3,415.7 715.7,398.2 712.0,390.2C710.7,387.4 709.9,385.6 707.5,380.1C705.9,376.6 700.8,366.2 698.7,362.5C685.0,337.5 672.2,318.8 654.8,298.2C645.7,287.5 624.1,266.3 615.4,259.7C613.7,258.4 610.4,255.8 608.2,254.0C602.5,249.5 598.5,246.6 589.7,240.8C578.5,233.4 573.9,230.7 567.2,227.2C564.8,225.9 562.5,224.7 562.2,224.5C561.9,224.2 557.9,222.1 553.2,219.8C514.9,200.7 476.6,190.3 434.2,187.5C419.8,186.6 394.5,187.1 380.5,188.7C343.6,193.0 312.4,200.7 280.8,213.4C271.1,217.3 253.1,225.8 245.9,229.9C244.8,230.5 243.2,231.4 242.3,232.0C241.4,232.5 239.1,233.8 237.3,235.0C235.4,236.1 233.8,237.0 233.7,237.0C233.4,237.0 223.2,243.7 217.8,247.3C182.0,271.9 152.3,302.5 126.9,340.8C114.4,359.6 99.0,390.0 91.1,411.5C82.8,434.2 77.9,452.1 73.3,477.5C71.3,488.2 69.0,514.5 69.0,527.0C69.0,549.8 72.4,579.0 77.5,600.2C80.7,613.8 86.8,633.8 90.7,644.0C103.9,678.0 118.1,704.0 138.6,731.6L145.6,741.0L145.7,756.6C145.8,769.5 146.0,773.5 146.9,779.5C147.9,786.7 149.1,792.4 149.7,793.5C149.9,793.8 149.8,794.0 149.4,794.0C148.8,794.0 143.9,787.7 134.4,774.8C125.4,762.7 109.8,738.5 102.0,724.5C99.2,719.4 91.3,703.8 87.6,696.0C71.9,662.3 59.7,623.1 54.3,588.5C51.0,567.7 49.8,552.3 49.8,531.2C49.9,501.0 53.6,474.7 62.5,441.8C67.5,423.7 78.2,394.3 85.7,378.2C89.3,370.7 97.3,354.8 98.7,352.5C99.3,351.5 100.5,349.5 101.4,348.0C112.0,328.7 125.9,308.7 141.0,291.3C152.0,278.5 166.2,263.9 177.2,254.0C182.9,249.1 198.4,236.5 202.5,233.6C203.7,232.7 206.7,230.6 209.0,228.9C213.6,225.6 227.8,216.0 228.2,216.0C228.3,216.0 230.3,214.9 232.5,213.5C234.8,212.1 237.3,210.5 238.2,210.0C269.7,192.4 298.5,181.3 332.8,173.5C333.9,173.2 336.7,172.6 339.0,172.1C343.5,171.0 358.8,168.5 366.0,167.5C368.3,167.2 371.1,166.8 372.2,166.7C382.2,165.4 404.3,164.0 415.0,164.0C424.6,164.0 442.9,165.0 452.8,166.0C459.3,166.7 467.4,167.8 474.1,169.0C475.7,169.3 478.2,169.7 479.6,170.0C489.6,171.7 507.1,176.4 521.0,181.0C555.2,192.4 593.8,214.1 623.0,238.3C656.4,265.9 689.4,306.4 710.7,345.5C713.5,350.8 724.0,371.7 724.0,372.2C724.0,372.4 724.7,373.9 725.5,375.8C726.3,377.6 727.0,379.1 727.0,379.2C727.0,379.4 727.7,380.9 728.5,382.7C729.3,384.6 730.0,386.1 730.0,386.3C730.0,386.4 730.5,387.6 731.0,388.9C732.4,391.9 732.6,392.6 734.0,396.2C734.6,397.9 735.3,399.8 735.5,400.4C735.8,401.0 736.2,402.0 736.5,402.6C737.4,404.9 738.6,408.3 739.3,410.5C739.7,411.7 740.2,413.2 740.5,413.8C740.7,414.3 741.8,417.8 743.0,421.5C744.2,425.2 745.5,429.3 745.9,430.5C746.8,433.2 746.8,433.4 749.6,444.5C750.8,449.3 752.1,454.6 752.5,456.2C752.8,457.9 753.3,459.9 753.5,460.8C754.1,462.9 755.6,471.5 756.5,478.0C756.8,480.1 757.3,483.1 757.5,484.8C759.3,496.7 760.2,512.9 760.2,531.2C760.2,549.7 759.7,557.1 757.5,574.8C756.6,581.6 754.2,596.7 753.5,599.5C753.3,600.5 752.9,602.4 752.6,603.8C751.5,609.0 750.9,611.8 750.5,613.5C750.2,614.5 749.5,617.4 748.9,620.0C748.0,624.3 747.2,627.5 746.0,631.8C745.8,632.6 745.2,634.6 744.8,636.2C744.3,637.9 743.8,639.8 743.5,640.5C743.3,641.2 742.4,644.1 741.5,647.0C739.3,654.1 736.9,661.4 735.0,666.5C734.1,668.8 733.2,671.3 733.0,672.0C732.4,673.9 726.6,688.4 725.2,691.4C724.5,692.8 724.0,694.1 724.0,694.3C724.0,695.6 707.3,728.7 704.9,732.1C704.4,732.8 704.0,733.5 704.0,733.6C704.0,734.0 696.5,746.3 692.4,752.5C685.0,763.8 672.8,780.5 660.5,796.2C658.5,798.7 656.2,801.7 655.4,802.9C652.7,806.4 652.5,805.4 654.6,798.9ZM921.9,783.1C919.5,773.2 918.8,766.4 918.8,755.2C918.8,749.5 919.1,743.8 919.4,741.8C919.8,739.8 920.3,736.9 920.6,735.2C921.8,728.2 923.3,722.0 926.0,714.0C930.4,700.6 937.0,685.3 943.3,674.0C944.3,672.2 946.2,668.7 947.5,666.2C949.8,662.0 952.0,658.2 957.6,648.5C962.9,639.6 969.8,627.5 973.4,621.0C978.6,611.6 991.8,584.9 995.0,577.4C1000.2,565.0 1003.5,554.1 1003.5,548.7C1003.5,545.4 1001.8,542.1 999.5,540.8C993.8,537.8 986.4,545.4 974.4,566.8C964.1,584.9 961.6,589.2 954.1,600.8C948.6,609.2 940.1,620.9 933.0,629.8C930.4,633.0 927.4,636.9 920.7,645.5C912.2,656.5 901.3,672.7 894.9,684.0C892.3,688.6 887.9,697.9 885.7,703.5C883.0,710.5 882.7,711.1 882.2,709.7C882.0,709.2 881.6,708.1 881.2,707.2C876.2,695.8 869.8,677.3 866.2,664.2C865.8,662.6 865.2,660.6 865.0,659.8C855.4,626.3 850.9,594.1 850.9,559.2C850.9,533.2 852.7,513.1 857.0,488.8C857.9,484.1 858.7,479.1 859.0,477.8C860.0,471.8 864.4,454.0 868.2,439.9C869.0,436.9 876.7,413.6 877.4,411.8C878.6,409.0 879.0,408.0 880.0,405.2C880.6,403.6 881.3,401.7 881.5,401.1C881.8,400.5 882.2,399.4 882.5,398.8C882.8,398.1 883.2,397.0 883.5,396.4C883.7,395.8 884.4,394.2 885.0,392.9C885.5,391.6 886.0,390.4 886.0,390.3C886.0,390.1 886.6,388.6 887.4,386.9C888.2,385.2 889.3,382.7 889.8,381.5C891.0,378.7 902.3,356.1 904.2,352.9C904.9,351.6 906.0,349.5 906.7,348.4C907.3,347.2 908.6,345.0 909.5,343.5C910.4,342.0 911.5,340.1 912.0,339.2C921.5,322.8 931.8,308.0 945.8,290.4C960.0,272.7 979.1,254.0 996.4,241.0C1026.2,218.7 1063.5,202.0 1094.7,197.0C1104.9,195.4 1110.9,195.4 1122.0,197.3C1140.3,200.3 1162.8,209.1 1185.0,221.9C1214.4,238.8 1244.3,265.8 1267.9,296.8C1275.1,306.4 1282.9,317.3 1286.7,323.2C1297.3,340.2 1300.8,346.4 1308.4,361.5C1312.8,370.4 1314.8,374.5 1317.6,381.0C1318.2,382.2 1319.0,384.1 1319.5,385.2C1320.7,387.9 1325.5,399.9 1326.0,401.5C1326.2,402.2 1327.6,406.0 1329.0,410.0C1334.5,425.6 1338.1,437.8 1341.9,454.0C1348.5,481.9 1352.1,508.3 1353.5,538.5C1355.0,568.6 1351.7,601.6 1344.0,634.0C1340.7,647.5 1334.7,667.4 1330.1,679.2C1329.3,681.5 1327.7,685.6 1326.6,688.5C1325.5,691.4 1324.2,694.8 1323.6,696.0C1323.1,697.2 1321.7,700.6 1320.5,703.5C1317.4,711.3 1316.0,714.2 1315.6,713.7C1315.3,713.5 1314.8,712.1 1314.4,710.8C1311.3,700.7 1303.5,683.9 1297.0,673.0C1293.2,666.6 1283.8,652.5 1279.5,646.8C1276.3,642.5 1274.1,639.5 1267.7,630.6C1266.1,628.5 1264.0,625.6 1263.0,624.2C1260.1,620.4 1258.4,617.8 1252.9,609.8C1248.3,603.0 1246.6,600.2 1243.9,595.6C1243.4,594.7 1242.5,593.2 1241.9,592.1C1241.3,591.1 1237.3,583.1 1232.9,574.4C1220.3,549.1 1215.9,542.8 1209.6,540.6C1208.1,540.1 1207.5,540.2 1205.8,540.9C1202.7,542.3 1201.8,544.5 1201.8,550.2C1201.8,554.6 1202.0,555.2 1205.8,566.5C1209.8,578.0 1216.1,593.9 1219.7,601.7C1220.7,603.8 1221.5,605.7 1221.5,605.8C1221.5,606.0 1223.8,610.9 1226.7,616.7C1232.4,628.3 1235.9,634.5 1247.1,653.1C1258.3,671.7 1264.2,682.8 1268.5,693.2C1270.0,696.8 1272.5,704.5 1274.8,712.5C1276.0,716.7 1277.2,723.4 1278.5,732.3C1279.2,737.6 1279.1,756.8 1278.3,763.0C1277.6,768.2 1276.4,774.6 1275.5,778.0C1275.3,779.0 1274.8,780.7 1274.5,781.9C1273.8,784.5 1273.0,784.2 1273.0,781.2C1273.0,780.0 1272.8,777.9 1272.5,776.4C1272.2,774.9 1271.8,772.6 1271.5,771.2C1270.5,765.8 1268.9,758.7 1268.5,757.5C1268.3,756.8 1267.6,754.6 1267.0,752.5C1263.6,741.5 1258.8,728.2 1254.4,717.5C1254.1,716.8 1253.7,715.8 1253.5,715.2C1253.3,714.7 1252.6,713.2 1252.0,711.9C1251.5,710.6 1251.0,709.4 1251.0,709.2C1251.0,709.1 1250.4,707.5 1249.6,705.8C1247.3,701.0 1246.0,698.0 1246.0,697.8C1246.0,697.5 1244.4,694.0 1242.0,688.8C1239.6,683.6 1238.0,680.0 1238.0,679.7C1238.0,679.6 1237.3,678.1 1236.5,676.2C1235.7,674.4 1235.0,672.9 1235.0,672.8C1235.0,672.7 1234.1,670.7 1233.0,668.3C1231.9,666.0 1231.0,663.9 1231.0,663.8C1231.0,663.6 1230.3,662.1 1229.5,660.2C1228.7,658.4 1228.0,656.9 1228.0,656.7C1228.0,656.6 1227.3,655.0 1226.4,653.1C1225.6,651.3 1224.4,648.6 1223.7,647.2C1223.1,645.9 1222.1,643.5 1221.5,642.0C1220.3,639.0 1219.5,637.0 1217.7,633.2C1217.1,631.9 1216.1,629.5 1215.5,628.0C1214.9,626.5 1214.0,624.4 1213.5,623.3C1212.1,620.2 1207.5,608.6 1206.5,605.5C1179.4,525.2 1180.9,529.6 1167.0,490.5C1163.2,479.9 1158.9,468.1 1157.5,464.2C1152.9,451.8 1150.6,445.2 1148.2,437.1C1140.3,410.2 1137.2,401.8 1128.9,384.8C1123.3,373.4 1117.8,366.7 1111.6,363.7C1109.3,362.5 1108.1,362.3 1105.2,362.3C1095.7,362.3 1087.2,370.7 1078.6,388.6C1074.3,397.5 1073.0,400.3 1073.0,401.0C1073.0,401.3 1072.8,401.9 1072.5,402.4C1071.7,403.8 1068.9,411.8 1063.6,427.8C1060.8,436.0 1056.5,448.1 1054.0,454.8C1048.9,468.1 1040.0,491.8 1036.9,500.2C1033.1,510.6 1027.6,524.8 1023.0,535.8C1012.5,560.9 1003.3,583.7 995.4,604.0C991.6,613.9 979.6,643.7 977.5,648.8C976.3,651.5 973.9,657.1 972.1,661.2C970.4,665.4 967.9,671.1 966.7,674.0C965.4,676.9 964.0,680.1 963.5,681.2C963.0,682.4 961.6,685.5 960.5,688.2C958.4,693.1 957.6,694.9 955.4,699.9C954.9,701.2 953.9,703.3 953.4,704.5C952.8,705.7 952.0,707.6 951.5,708.8C951.0,709.9 949.9,712.5 949.0,714.8C948.1,717.0 946.9,719.9 946.2,721.4C945.5,722.8 945.0,724.1 945.0,724.3C945.0,724.4 944.5,725.6 944.0,726.9C943.4,728.2 942.7,729.7 942.5,730.2C942.3,730.8 941.9,731.8 941.6,732.5C939.1,738.4 934.1,751.6 932.7,755.9C931.7,758.9 930.8,761.7 930.5,762.2C930.3,762.8 929.8,764.0 929.5,765.0C929.3,766.0 928.6,768.1 928.0,769.8C926.4,774.9 924.1,783.2 923.9,784.7C923.6,787.4 922.7,786.6 921.9,783.1ZM202.8,781.4C200.9,775.8 199.4,768.9 198.7,762.5C196.7,745.7 201.2,726.6 212.8,703.2C219.6,689.5 225.1,680.3 242.7,654.0C264.4,621.4 273.3,606.8 283.4,586.9C293.8,566.5 298.1,554.6 298.2,546.5C298.2,541.4 297.4,539.5 294.2,538.0C292.3,537.1 291.8,537.0 290.0,537.5C283.7,539.2 278.2,545.5 265.6,565.7C247.9,594.3 239.2,606.1 222.8,624.0C220.8,626.1 218.3,628.8 217.2,630.0C216.1,631.2 211.4,636.4 206.7,641.5C199.2,649.8 190.5,659.6 184.0,667.5C177.5,675.3 168.0,688.6 162.9,697.0C158.2,704.7 152.8,716.0 150.8,722.1C150.7,722.6 150.3,723.0 150.0,723.0C148.8,723.0 132.6,700.0 128.7,692.8C128.0,691.4 123.2,683.1 122.2,681.5C120.3,678.2 111.2,659.3 108.1,652.0C97.5,627.1 89.0,597.1 85.3,571.5C82.8,554.3 82.3,546.0 82.3,527.0C82.3,516.5 82.6,507.0 82.9,503.8C83.3,500.7 83.8,496.2 84.0,493.8C89.6,443.8 108.9,392.1 138.5,347.8C160.7,314.5 185.6,288.1 217.0,264.9C234.5,252.0 257.4,238.6 275.5,230.6C278.2,229.4 283.8,227.1 285.4,226.4C286.0,226.2 287.0,225.8 287.6,225.5C298.3,221.2 310.9,217.0 320.2,214.5C322.2,214.0 326.4,212.9 329.6,212.0C332.9,211.2 338.7,209.8 342.6,209.0C394.5,197.9 438.5,198.1 485.8,209.8C499.7,213.2 518.6,219.6 529.9,224.8C531.3,225.5 532.6,226.0 532.8,226.0C533.5,226.0 552.4,235.2 558.5,238.6C602.7,262.8 642.7,299.6 670.8,341.8C681.1,357.3 689.2,371.9 699.0,392.8C702.1,399.4 708.6,416.1 711.8,426.0C713.7,431.8 717.4,445.0 718.5,449.8C718.8,451.1 719.4,453.5 719.8,455.0C720.2,456.5 720.7,458.8 720.9,460.0C721.2,461.2 721.7,464.1 722.2,466.2C726.9,489.2 729.0,519.5 727.5,542.0C726.9,551.6 726.1,560.8 725.5,564.8C725.3,566.4 724.8,569.7 724.5,572.0C723.9,576.5 721.9,586.8 720.8,591.8C720.4,593.4 719.6,596.9 719.0,599.5C718.0,603.7 717.3,606.5 715.5,613.0C711.9,626.1 703.4,649.6 698.3,660.8C694.9,668.1 694.0,670.1 692.2,673.8C687.1,684.1 675.8,703.9 667.5,717.0C665.5,720.2 663.4,723.6 662.8,724.6C661.7,726.6 661.1,726.9 660.8,725.9C660.7,725.5 659.9,723.1 659.1,720.5C654.2,704.7 642.7,684.9 627.5,666.2C622.1,659.6 607.7,642.7 602.3,636.8C600.3,634.5 596.7,630.4 594.2,627.5C591.8,624.6 588.0,620.2 585.9,617.6C577.2,607.4 566.8,592.8 560.5,582.0C557.1,576.1 554.3,571.3 547.0,558.2C542.5,550.2 534.6,540.5 530.8,538.2C525.0,534.9 520.0,538.6 520.0,546.2C520.0,551.4 523.3,562.0 527.8,572.0C528.5,573.5 530.0,576.8 531.1,579.2C533.8,585.5 533.4,584.6 539.2,596.5C542.1,602.4 545.0,608.1 545.7,609.2C546.3,610.4 547.8,613.0 548.9,615.1C550.1,617.3 552.2,620.9 553.6,623.1C555.0,625.4 556.8,628.3 557.5,629.5C560.0,633.7 567.9,645.1 576.8,657.2C598.7,687.2 607.4,703.2 611.9,722.5C615.8,738.5 615.9,752.5 612.2,766.7C609.6,777.2 607.0,782.9 607.0,778.4C607.0,775.8 604.2,762.9 602.2,756.0C597.4,739.4 587.6,717.7 573.3,692.1C572.0,689.8 571.0,687.8 571.0,687.7C571.0,687.6 569.9,685.7 568.5,683.3C567.2,680.9 565.1,677.3 563.9,675.1C560.7,669.1 559.9,667.8 559.5,667.2C559.3,667.0 557.2,663.3 554.9,659.0C548.3,647.1 542.5,636.5 541.1,634.0C537.3,627.3 536.1,625.0 532.1,616.8C527.2,606.8 524.0,600.2 524.0,599.8C524.0,599.6 523.5,598.4 522.9,597.1C521.1,593.1 520.6,591.8 519.7,589.5C519.3,588.3 518.5,586.3 517.9,585.1C517.4,584.0 517.0,582.7 517.0,582.4C517.0,582.0 516.8,581.5 516.6,581.2C516.4,581.0 515.9,579.9 515.6,578.8C515.0,577.0 512.6,570.4 511.5,567.8C511.3,567.2 510.6,565.4 510.0,563.8C509.4,562.1 508.5,559.8 507.9,558.6C507.4,557.5 507.0,556.3 507.0,556.0C507.0,555.7 506.8,555.1 506.5,554.6C506.3,554.1 505.3,551.6 504.2,549.0C503.2,546.4 502.1,543.6 501.8,542.8C501.4,541.9 500.4,539.5 499.6,537.2C498.8,535.0 496.0,528.0 493.5,521.5C491.0,515.0 487.4,505.8 485.5,501.0C478.8,483.8 473.8,471.5 470.8,464.8C467.7,457.9 461.3,441.6 458.0,431.9C451.6,413.1 446.2,401.0 437.5,386.3C429.8,373.0 424.8,367.4 417.6,363.8C413.5,361.8 413.1,361.8 408.8,361.8C404.5,361.8 404.0,361.9 399.9,363.9C391.6,367.9 385.2,375.8 377.0,391.8C375.5,394.8 373.7,398.6 373.0,400.2C372.4,401.9 371.7,403.5 371.5,403.8C371.3,404.0 370.6,405.7 370.0,407.5C369.4,409.3 368.7,411.2 368.5,411.8C367.6,413.8 364.0,424.3 362.4,429.5C361.6,432.4 357.7,443.3 356.5,446.2C356.3,446.8 355.2,449.6 354.1,452.5C353.0,455.4 349.4,464.6 346.1,473.0C342.8,481.4 339.2,490.5 338.2,493.2C335.8,499.8 329.8,515.0 328.1,518.5C327.5,520.0 325.6,524.2 324.0,527.8C322.4,531.3 318.2,540.3 314.7,547.8C306.3,565.6 298.6,582.1 294.8,590.8C293.0,594.6 290.0,601.4 288.0,605.8C282.9,617.1 272.3,638.4 267.4,647.2C263.1,654.8 257.4,665.0 249.0,680.0C246.4,684.5 242.5,691.6 240.2,695.8C235.5,704.1 222.2,730.7 220.5,735.0C219.9,736.5 219.1,738.5 218.7,739.5C218.2,740.5 217.7,741.7 217.5,742.2C217.3,742.8 216.9,743.9 216.6,744.6C213.6,751.9 210.1,761.5 209.0,765.8C208.8,766.6 208.2,768.5 207.8,770.0C206.2,775.8 205.1,780.3 204.8,782.1C204.6,783.2 204.3,784.0 204.0,784.0C203.8,784.0 203.2,782.8 202.8,781.4ZM663.0,741.5C663.0,739.8 662.7,736.9 662.4,734.9C662.0,732.1 662.0,731.2 662.5,730.4C662.8,729.8 663.5,728.7 664.0,727.8C664.5,727.0 666.0,724.4 667.4,722.1C673.3,712.8 675.0,709.9 675.0,709.8C675.0,709.7 675.9,708.1 677.1,706.2C679.0,703.0 684.7,693.3 687.3,688.8C689.2,685.3 698.8,666.3 699.5,664.5C699.9,663.5 701.0,661.0 702.0,658.8C703.0,656.5 704.3,653.4 705.0,651.8C705.6,650.1 706.4,648.0 706.8,647.1C708.9,642.4 714.9,624.8 717.1,617.0C717.3,616.0 717.8,614.5 718.0,613.6C719.1,609.8 719.5,608.5 720.5,604.8C721.5,600.7 721.7,599.8 723.5,591.5C725.0,584.6 726.3,577.5 727.1,572.5C729.7,555.3 730.7,537.7 730.3,519.0C729.8,497.4 727.4,476.6 723.5,459.5C723.2,458.3 722.7,456.4 722.5,455.2C721.6,451.2 718.9,440.2 718.5,439.0C718.3,438.3 717.9,436.9 717.6,435.8C716.9,433.3 714.3,425.0 712.7,420.2C711.8,417.3 709.2,410.5 707.5,406.2C707.3,405.7 706.6,403.9 706.0,402.2C705.3,400.6 704.0,397.4 703.0,395.2C702.0,393.1 700.7,390.2 700.2,389.0C698.7,385.3 688.1,364.6 687.0,363.0C686.5,362.2 686.0,361.4 686.0,361.2C686.0,361.1 685.6,360.3 685.1,359.6C684.6,358.8 683.5,357.0 682.6,355.5C677.1,345.4 662.2,324.2 653.2,313.8C651.1,311.3 648.2,307.9 646.8,306.2C634.1,291.3 613.0,271.9 595.6,259.2C587.6,253.3 570.6,242.0 569.7,242.0C569.5,242.0 568.8,241.5 568.0,241.0C567.2,240.4 565.4,239.3 563.9,238.6C562.4,237.8 559.8,236.3 558.0,235.3C554.0,233.1 540.0,226.2 535.2,224.1C501.7,209.6 470.3,201.7 435.5,199.0C413.5,197.3 392.0,198.2 367.2,201.8C351.1,204.1 330.4,208.7 315.8,213.1C313.0,213.9 309.4,215.0 307.8,215.5C306.1,216.0 302.2,217.3 299.0,218.5C295.8,219.6 292.7,220.8 292.0,221.0C290.1,221.6 285.6,223.4 282.6,224.8C281.2,225.5 279.9,226.0 279.7,226.0C279.6,226.0 278.1,226.7 276.2,227.5C274.4,228.3 272.9,229.0 272.7,229.0C272.2,229.0 255.9,237.1 253.0,238.8C251.5,239.7 249.2,240.9 248.0,241.6C236.9,247.8 226.8,254.4 212.8,264.7C202.2,272.5 185.4,287.1 178.5,294.3C176.7,296.2 172.9,300.2 170.0,303.3C152.7,321.5 136.3,344.1 122.2,369.1C104.7,400.2 92.8,432.0 85.6,467.0C76.0,513.0 78.0,564.2 91.0,611.0C93.7,620.8 99.8,639.1 102.0,644.3C102.6,645.7 103.7,648.3 104.3,650.2C105.9,654.4 114.5,672.8 118.4,680.0C125.9,694.2 135.6,709.3 144.2,720.5C146.5,723.4 148.5,726.1 148.7,726.4C149.2,727.2 147.0,737.1 146.4,736.9C146.0,736.7 137.7,725.8 133.2,719.5C130.6,715.9 125.2,707.4 120.0,699.0C117.0,694.2 111.7,684.3 107.6,676.0C82.1,624.7 69.5,568.2 72.0,515.7C73.6,480.0 80.6,446.9 94.0,411.2C101.4,391.6 113.0,368.0 123.9,350.5C139.2,325.9 152.6,308.9 172.4,288.8C188.4,272.7 204.1,259.6 222.0,247.7C236.2,238.2 245.7,232.7 260.8,225.3C267.4,222.0 273.9,219.0 274.2,219.0C274.4,219.0 275.7,218.5 277.1,217.8C285.5,214.0 307.1,206.4 319.0,203.1C360.1,191.7 403.9,187.3 441.5,190.8C474.9,193.9 498.0,199.4 530.2,212.2C540.2,216.2 557.7,224.5 566.2,229.5C568.6,230.9 570.6,232.0 570.7,232.0C571.0,232.0 583.8,239.9 588.8,243.1C603.9,253.0 626.6,271.9 639.8,285.6C644.9,291.0 657.8,305.8 661.3,310.2C674.1,327.0 685.4,343.6 692.0,355.8C693.2,357.9 694.6,360.5 695.2,361.5C696.5,363.8 705.1,381.1 706.5,384.2C707.1,385.6 708.1,387.9 708.8,389.4C709.5,390.8 710.0,392.1 710.0,392.3C710.0,392.4 710.5,393.7 711.2,395.1C712.6,398.1 716.4,407.6 717.0,409.5C717.2,410.2 718.1,412.7 719.0,415.0C721.2,420.9 722.8,425.9 723.7,429.0C724.1,430.5 724.9,433.3 725.5,435.2C728.6,445.4 732.5,462.4 734.0,472.0C735.4,481.5 736.3,487.8 737.6,499.8C738.5,507.2 738.5,543.7 737.6,551.8C736.7,560.3 736.0,566.3 735.5,569.8C735.3,571.4 734.8,574.5 734.5,576.8C733.6,582.6 731.9,591.6 730.3,598.5C728.3,606.9 726.0,615.9 724.5,620.8C723.9,622.7 723.2,624.9 723.0,625.8C722.8,626.6 721.7,630.0 720.5,633.2C719.4,636.5 718.2,639.8 718.0,640.5C716.7,644.6 712.2,656.0 710.5,659.8C710.0,660.9 709.1,663.0 708.5,664.5C707.3,667.7 698.2,686.1 695.9,690.2C694.9,691.9 693.3,694.9 692.2,697.0C689.8,701.5 690.3,700.6 683.4,712.0C680.4,717.1 677.1,722.6 676.1,724.2C675.1,725.9 672.4,730.4 670.0,734.2C667.6,738.1 665.3,742.0 664.8,742.9C663.6,745.3 663.0,744.9 663.0,741.5ZM1318.6,728.1C1318.3,726.8 1317.8,724.2 1317.5,722.2L1316.9,718.8L1319.8,712.0C1329.6,688.6 1332.2,681.8 1338.7,662.8C1343.7,648.3 1350.3,619.5 1352.5,603.3C1352.8,601.3 1353.2,598.2 1353.5,596.2C1355.0,586.0 1356.5,565.1 1356.5,553.2C1356.5,539.5 1355.1,516.5 1353.5,504.2C1351.3,488.1 1349.2,475.1 1347.3,466.0C1346.6,462.8 1345.6,458.6 1345.2,456.5C1341.3,437.9 1332.9,411.3 1324.0,389.0C1313.6,362.9 1296.1,331.2 1278.8,307.0C1276.0,303.0 1274.8,301.5 1268.3,293.0C1254.5,274.9 1235.6,255.6 1217.8,241.2C1206.9,232.5 1201.8,229.0 1186.8,219.9C1160.6,204.1 1128.8,193.5 1107.2,193.4C1087.7,193.3 1057.8,202.4 1029.9,216.9C1000.2,232.3 972.6,254.5 950.2,281.0C945.2,287.0 936.7,297.6 934.7,300.3C933.9,301.5 930.5,306.2 927.2,310.8C923.8,315.5 919.9,321.2 918.5,323.5C912.3,333.5 908.0,340.6 908.0,340.7C908.0,340.8 907.1,342.3 906.1,344.1C905.0,345.8 903.3,348.8 902.3,350.8C901.2,352.7 899.4,355.9 898.3,358.0C897.1,360.1 895.8,362.6 895.3,363.8C894.8,364.9 892.8,368.9 891.0,372.8C887.9,379.1 883.0,390.2 883.0,390.8C883.0,390.9 882.4,392.4 881.6,394.1C880.8,395.8 879.8,398.3 879.4,399.5C878.9,400.7 877.7,404.0 876.6,406.8C866.1,433.3 856.4,471.8 852.0,504.2C847.2,540.2 846.9,569.5 851.0,603.2C853.3,622.1 858.5,648.0 863.1,663.2C865.8,672.5 871.9,690.9 873.9,696.0C879.1,709.6 880.2,712.3 880.6,712.7C881.3,713.5 881.0,716.5 880.0,720.2C879.5,722.2 879.0,724.4 879.0,725.1C879.0,727.6 878.1,726.8 876.5,722.8C876.2,722.1 875.8,720.9 875.5,720.2C875.2,719.6 874.8,718.4 874.5,717.8C874.2,717.1 873.8,715.9 873.5,715.2C873.2,714.6 872.8,713.5 872.6,712.9C872.3,712.3 871.8,711.0 871.3,710.0C869.9,706.6 867.4,700.2 866.5,697.5C866.0,696.0 864.9,692.8 864.0,690.5C862.0,685.0 860.5,680.5 858.5,674.0C857.6,671.1 856.7,668.2 856.5,667.5C854.4,661.6 848.7,637.5 846.1,622.8C839.4,586.0 838.8,542.4 844.5,502.2C846.2,490.2 847.6,482.7 851.5,464.7C852.9,458.0 856.2,445.3 858.5,437.8C859.1,435.8 860.2,432.1 861.0,429.5C861.7,426.9 862.9,423.4 863.5,421.8C864.1,420.1 865.2,416.8 866.0,414.5C868.6,406.7 874.8,390.8 877.6,384.5C878.2,383.3 879.1,381.1 879.7,379.8C881.7,375.4 883.1,372.3 883.9,370.5C885.6,366.4 894.5,349.1 895.5,347.8C895.7,347.5 896.9,345.2 898.3,342.8C900.7,338.1 907.1,327.3 909.5,323.8C910.3,322.6 912.4,319.3 914.3,316.2C926.6,296.7 942.3,277.1 960.0,258.8C989.6,228.3 1027.7,204.6 1066.6,192.4C1091.2,184.6 1106.2,182.9 1123.5,186.0C1144.9,189.8 1171.2,200.2 1192.8,213.4C1212.8,225.7 1228.8,238.3 1245.8,255.2C1258.8,268.2 1269.0,280.2 1281.5,297.1C1288.7,306.8 1300.7,325.0 1304.3,331.8C1305.3,333.7 1306.3,335.5 1306.5,335.8C1306.9,336.2 1307.8,337.9 1312.4,346.2C1315.5,351.9 1323.9,369.2 1326.9,376.0C1332.1,388.0 1332.9,389.9 1335.5,397.0C1336.9,401.0 1338.8,406.3 1339.8,408.8C1347.1,428.9 1355.6,462.7 1359.0,485.5C1366.1,533.4 1366.1,572.0 1359.2,612.8C1354.7,639.1 1345.5,670.4 1334.1,698.0C1332.5,702.0 1329.0,709.8 1320.9,728.1C1320.3,729.4 1319.7,730.5 1319.5,730.5C1319.2,730.5 1318.9,729.4 1318.6,728.1Z"
		}
	};
	var MP_DENTI = {
		"101": {
			x: 417,
			y: 894,
			p: "404,873 400,878 399,911 410,915 433,913 436,909 435,877 431,873 424,871"
		},
		"102": {
			x: 369,
			y: 890,
			p: "361,867 354,876 348,900 356,908 371,912 380,911 385,904 388,876 380,869"
		},
		"103": {
			x: 321,
			y: 875,
			p: "312,855 308,858 301,873 301,883 308,890 328,897 333,894 342,871 342,864 324,855"
		},
		"104": {
			x: 274,
			y: 841,
			p: "276,805 271,806 259,821 253,841 254,850 259,862 267,873 273,877 285,866 293,848 291,826 285,814"
		},
		"105": {
			x: 232,
			y: 806,
			p: "226,796 223,799 225,810 230,816 238,817 241,813 238,799 233,795"
		},
		"106": {
			x: 200,
			y: 754,
			p: "239,726 227,719 214,719 161,735 154,741 151,752 162,782 170,788 181,790 221,780 238,773 248,760 247,748"
		},
		"107": {
			x: 169,
			y: 675,
			p: "211,648 200,641 186,640 144,647 128,653 123,657 118,668 127,701 132,706 141,710 155,710 198,701 209,696 219,683 219,674"
		},
		"108": {
			x: 149,
			y: 587,
			p: "194,565 187,558 175,554 127,555 114,558 104,565 100,573 104,606 112,616 122,620 166,618 183,615 195,606 199,596 197,573"
		},
		"109": {
			x: 140,
			y: 494,
			p: "97,471 93,481 93,506 98,518 106,524 118,527 164,527 177,523 187,511 187,479 184,473 173,465 117,461 109,463"
		},
		"110": {
			x: 142,
			y: 401,
			p: "99,376 96,384 94,411 99,422 105,427 121,432 169,435 175,433 184,425 188,414 190,391 187,383 180,376 167,371 149,370 128,365 110,367"
		},
		"111": {
			x: 151,
			y: 303,
			p: "122,263 114,272 110,282 103,310 103,319 106,326 118,336 160,346 173,346 182,342 190,332 198,297 198,288 192,277 179,269 158,265 142,259 131,259"
		},
		"201": {
			x: 468,
			y: 894,
			p: "454,873 450,878 449,906 451,912 457,915 475,915 485,912 488,908 484,876 473,871"
		},
		"202": {
			x: 517,
			y: 890,
			p: "524,867 509,868 498,874 501,906 505,911 523,910 537,902 538,896 529,870"
		},
		"203": {
			x: 564,
			y: 875,
			p: "570,854 553,858 543,866 551,891 558,897 574,892 585,881 585,874 578,859"
		},
		"204": {
			x: 612,
			y: 841,
			p: "609,805 604,809 596,822 592,836 592,846 599,864 612,877 619,872 627,861 631,851 632,839 628,825 620,812 613,805"
		},
		"205": {
			x: 653,
			y: 806,
			p: "659,796 652,795 647,799 644,813 647,817 653,817 660,811 663,802"
		},
		"206": {
			x: 686,
			y: 754,
			p: "646,727 637,752 638,762 646,772 667,781 704,790 716,788 724,782 734,755 734,746 726,736 710,729 671,719 659,719"
		},
		"207": {
			x: 716,
			y: 675,
			p: "673,650 666,674 666,683 670,691 676,696 687,701 729,710 747,709 758,701 767,667 763,658 757,653 741,647 701,640 682,642"
		},
		"208": {
			x: 736,
			y: 587,
			p: "691,566 687,598 692,608 703,615 721,618 764,620 776,614 781,607 785,572 783,567 771,558 759,555 709,554 700,557"
		},
		"209": {
			x: 745,
			y: 494,
			p: "790,474 782,466 767,461 728,462 713,465 707,468 698,480 699,513 707,522 721,527 768,527 783,522 791,512 792,480"
		},
		"210": {
			x: 744,
			y: 401,
			p: "786,376 779,369 767,365 718,371 705,376 698,383 695,390 698,418 701,425 707,431 717,435 766,432 779,428 787,421 791,412 789,383"
		},
		"211": {
			x: 734,
			y: 303,
			p: "762,262 755,259 743,259 724,266 704,270 691,279 687,287 687,299 694,330 703,342 712,346 724,346 749,339 762,338 777,329 782,320 782,309 777,286 772,272"
		},
		"301": {
			x: 469,
			y: 1006,
			p: "454,986 450,990 450,1009 453,1024 461,1028 477,1028 484,1023 488,1008 489,990 477,985 464,984"
		},
		"302": {
			x: 520,
			y: 1011,
			p: "507,990 502,1000 502,1025 511,1032 527,1033 534,1026 542,1000 535,993 516,989"
		},
		"303": {
			x: 570,
			y: 1023,
			p: "561,1002 554,1009 549,1025 549,1034 553,1039 561,1043 573,1044 578,1042 588,1031 593,1022 593,1016 590,1011 579,1005"
		},
		"304": {
			x: 627,
			y: 1055,
			p: "626,1019 617,1027 610,1040 607,1050 607,1061 616,1081 624,1090 628,1091 643,1074 647,1063 648,1051 644,1038 638,1028 630,1020"
		},
		"306": {
			x: 674,
			y: 1117,
			p: "697,1090 687,1086 674,1088 656,1095 642,1104 638,1111 638,1120 646,1140 651,1145 658,1148 669,1147 694,1138 707,1129 710,1123 710,1116 703,1098"
		},
		"307": {
			x: 693,
			y: 1188,
			p: "720,1162 712,1158 699,1158 664,1170 657,1179 657,1190 663,1209 673,1217 686,1217 723,1205 730,1196 730,1186 725,1169"
		},
		"308": {
			x: 707,
			y: 1260,
			p: "739,1238 727,1231 712,1231 678,1239 671,1245 668,1252 671,1274 674,1281 681,1287 695,1289 725,1284 738,1279 745,1269 742,1245"
		},
		"309": {
			x: 717,
			y: 1334,
			p: "753,1314 748,1309 736,1305 700,1307 685,1312 680,1317 677,1325 680,1351 687,1359 699,1363 747,1357 755,1350 757,1345 756,1322"
		},
		"310": {
			x: 723,
			y: 1410,
			p: "685,1394 683,1400 684,1422 687,1430 694,1436 701,1438 747,1436 756,1432 762,1424 762,1397 758,1389 751,1384 744,1382 705,1383 692,1387"
		},
		"311": {
			x: 727,
			y: 1487,
			p: "688,1470 687,1500 689,1506 697,1513 704,1515 752,1515 760,1512 766,1505 767,1472 760,1463 754,1460 705,1459 696,1462"
		},
		"401": {
			x: 416,
			y: 1006,
			p: "400,987 396,991 396,1002 402,1024 409,1028 424,1028 431,1025 434,1020 436,1005 435,989 428,985 419,984"
		},
		"402": {
			x: 366,
			y: 1010,
			p: "378,990 362,990 345,997 345,1008 356,1032 371,1033 383,1026 383,996"
		},
		"403": {
			x: 316,
			y: 1023,
			p: "316,1002 298,1009 292,1019 296,1029 307,1042 321,1044 335,1036 337,1027 330,1006 324,1002"
		},
		"404": {
			x: 258,
			y: 1055,
			p: "259,1019 254,1021 246,1030 237,1053 238,1063 245,1079 257,1091 261,1090 272,1076 278,1059 278,1051 273,1036 267,1026"
		},
		"406": {
			x: 212,
			y: 1117,
			p: "188,1090 176,1114 178,1128 190,1137 217,1147 227,1148 234,1145 239,1140 248,1117 243,1104 235,1098 211,1088 199,1086"
		},
		"407": {
			x: 192,
			y: 1187,
			p: "167,1161 161,1168 155,1189 157,1199 163,1205 199,1217 214,1216 222,1209 229,1188 229,1181 221,1170 188,1158 179,1157"
		},
		"408": {
			x: 179,
			y: 1260,
			p: "146,1238 143,1245 140,1267 142,1273 149,1280 190,1289 201,1288 210,1283 214,1276 217,1250 209,1240 174,1231 158,1231"
		},
		"409": {
			x: 168,
			y: 1334,
			p: "133,1313 130,1319 128,1342 130,1349 136,1355 146,1359 185,1363 197,1360 205,1352 208,1323 205,1316 197,1310 185,1307 150,1305 141,1307"
		},
		"410": {
			x: 163,
			y: 1410,
			p: "124,1396 124,1425 128,1431 135,1435 184,1438 193,1435 200,1427 202,1398 200,1393 189,1385 141,1382 130,1387"
		},
		"411": {
			x: 159,
			y: 1487,
			p: "119,1471 119,1503 128,1513 135,1515 182,1515 192,1511 198,1504 199,1473 194,1465 185,1460 136,1459 126,1463"
		}
	};
	var MP_LINGUA = {
		radice: {
			x: 542,
			y: 224,
			p: "306,120 293,152 291,193 298,225 324,295 339,379 746,378 757,307 787,223 794,174 790,146 779,121 760,99 745,88 720,77 683,71 644,71 564,80 401,71 364,77 341,87 322,101"
		},
		lato_dx: {
			x: 409,
			y: 675,
			p: "339,380 366,754 391,999 471,1000 459,765 447,380"
		},
		centro: {
			x: 541,
			y: 675,
			p: "448,380 460,765 472,1000 610,1000 625,705 636,380"
		},
		lato_sx: {
			x: 673,
			y: 675,
			p: "745,380 637,380 626,705 611,1000 691,999 717,752"
		},
		punta: {
			x: 541,
			y: 1166,
			p: "392,1001 424,1219 440,1282 461,1332 485,1362 511,1378 531,1383 554,1383 584,1373 610,1351 622,1334 647,1272 668,1170 690,1001"
		}
	};
	// equo-app-src/src/ruoli/veterinario/moduli/13-mappe.js
	var MP_D = {
		...MP_DISEGNI,
		...MP_DISEGNI_2
	};
	var mpEsc = (s) => escapeHtml(s == null ? "" : String(s));
	var mpJs = (s) => mpEsc(JSON.stringify(s));
	var NOTTE = "#1D2D50";
	var URG = "#A9443B";
	var ORO = "#C9A96E";
	var TIFS = "#2E8F88";
	var GRIGIO = "#677086";
	var LAB_A = ["Laterale", "Palmare"];
	var LAB_P = ["Laterale", "Plantare"];
	var MP_SET = {
		cavallo: {
			viste: [
				[
					"sx",
					"Sinistra",
					{ d: "sx" }
				],
				[
					"dx",
					"Destra",
					{
						d: "sx",
						spec: true
					}
				],
				[
					"av",
					"Davanti",
					{ d: "av" }
				],
				[
					"po",
					"Dietro",
					{ d: "po" }
				],
				[
					"al",
					"Dall'alto",
					{ d: "al" }
				]
			],
			tipi: [
				[
					"dolore",
					"Dolore",
					URG
				],
				[
					"ferita",
					"Ferita",
					ORO
				],
				[
					"gonfiore",
					"Gonfiore",
					TIFS
				],
				[
					"altro",
					"Altro",
					GRIGIO
				]
			]
		},
		arto: {
			viste: [
				[
					"as",
					"Ant. sinistro",
					{
						d: "arto_a",
						lab: LAB_A
					}
				],
				[
					"ad",
					"Ant. destro",
					{
						d: "arto_a",
						specLat: true,
						lab: LAB_A
					}
				],
				[
					"ps",
					"Post. sinistro",
					{
						d: "arto_p",
						lab: LAB_P
					}
				],
				[
					"pd",
					"Post. destro",
					{
						d: "arto_p",
						specLat: true,
						lab: LAB_P
					}
				]
			],
			tipi: [
				[
					"lesione",
					"Lesione",
					URG
				],
				[
					"gonfiore",
					"Gonfiore",
					TIFS
				],
				[
					"dolore",
					"Dolore",
					"#8A6D2E"
				],
				[
					"ferita",
					"Ferita",
					ORO
				],
				[
					"altro",
					"Altro",
					GRIGIO
				]
			]
		},
		zoccoli: {
			viste: [
				[
					"as",
					"ASx",
					{
						d: "zoccoli",
						crop: [
							15,
							130,
							770,
							830
						],
						t: "ASx"
					}
				],
				[
					"ad",
					"ADx",
					{
						d: "zoccoli",
						crop: [
							15,
							130,
							770,
							830
						],
						spec: true,
						t: "ADx"
					}
				],
				[
					"ps",
					"PSx",
					{
						d: "zoccoli",
						crop: [
							795,
							130,
							615,
							830
						],
						t: "PSx"
					}
				],
				[
					"pd",
					"PDx",
					{
						d: "zoccoli",
						crop: [
							795,
							130,
							615,
							830
						],
						spec: true,
						t: "PDx"
					}
				]
			],
			tipi: [
				[
					"ascesso",
					"Ascesso",
					URG
				],
				[
					"contusione",
					"Contusione",
					ORO
				],
				[
					"fessura",
					"Fessura",
					TIFS
				],
				[
					"altro",
					"Altro",
					GRIGIO
				]
			]
		},
		lingua: { viste: [[
			"li",
			"Lingua",
			{ d: "lingua" }
		]] },
		denti: { viste: [[
			"de",
			"Dentatura",
			{ d: "denti" }
		]] }
	};
	var MP_LAT = {
		da: 200,
		fino: 760,
		asse: 470
	};
	var mpBande = (y0, passo, pas) => {
		const n = [
			"1A",
			"1B",
			"2A",
			"2B",
			"3A",
			"3B",
			"3C"
		].map((z, i) => [
			z,
			y0 + i * passo,
			y0 + (i + 1) * passo
		]);
		const f = y0 + 7 * passo;
		return [
			...n,
			[
				"P1A",
				f,
				f + pas[0]
			],
			[
				"P1B",
				f + pas[0],
				f + pas[0] + pas[1]
			],
			[
				"P2",
				f + pas[0] + pas[1],
				f + pas[0] + pas[1] + pas[2]
			]
		];
	};
	var MP_BANDE = {
		arto_a: mpBande(255, 70, [
			55,
			50,
			50
		]),
		arto_p: mpBande(350, 61, [
			53,
			45,
			40
		])
	};
	var MP_BANDE_X = [885, 1075];
	var MP_ZONE = [
		[
			"punta",
			"Punta",
			"Cuore / Polmone"
		],
		[
			"centro",
			"Centro",
			"Milza / Stomaco"
		],
		[
			"lato_sx",
			"Lato sinistro",
			"Fegato / Vescica biliare"
		],
		[
			"lato_dx",
			"Lato destro",
			"Fegato / Vescica biliare"
		],
		[
			"radice",
			"Radice",
			"Rene"
		]
	];
	var MP_LINGUA_SCELTE = [
		[
			"colore",
			"Colore",
			[
				"Rosa",
				"Pallida",
				"Rossa",
				"Rosso scuro",
				"Viola"
			]
		],
		[
			"patina",
			"Patina",
			[
				"Assente",
				"Sottile",
				"Spessa"
			]
		],
		[
			"patina_c",
			"Colore della patina",
			[
				"Bianca",
				"Gialla",
				"Grigia"
			]
		],
		[
			"umidita",
			"Umidità",
			[
				"Secca",
				"Normale",
				"Umida"
			]
		]
	];
	var MP_LINGUA_SEGNI = [
		"Gonfia",
		"Impronte dei denti",
		"Fessure",
		"Punti rossi",
		"Macchie"
	];
	var MP_DENTE = [
		[
			"punte",
			"Punte di smalto",
			"t"
		],
		[
			"gancio",
			"Gancio",
			"t"
		],
		[
			"rampa",
			"Rampa",
			"t"
		],
		[
			"onda",
			"Onda",
			"t"
		],
		[
			"scalino",
			"Scalino",
			"t"
		],
		[
			"diastema",
			"Diastema",
			"p"
		],
		[
			"frattura",
			"Frattura",
			"p"
		],
		[
			"carie",
			"Carie",
			"p"
		],
		[
			"mobile",
			"Mobile",
			"p"
		],
		[
			"eotrh",
			"EOTRH",
			"p"
		],
		[
			"mancante",
			"Mancante",
			"m"
		],
		[
			"limato",
			"Limato oggi",
			"f"
		],
		[
			"estratto",
			"Estratto oggi",
			"f"
		]
	];
	var MP_CAT = {
		f: [TIFS, "fatto oggi"],
		p: [URG, "problema"],
		t: [ORO, "da trattare"],
		m: ["#B9C3D9", "mancante"]
	};
	var MP_NOMI_DENTE = [
		"",
		"incisivo centrale",
		"incisivo intermedio",
		"incisivo d'angolo",
		"canino",
		"primo premolare (dente di lupo)",
		"secondo premolare",
		"terzo premolare",
		"quarto premolare",
		"primo molare",
		"secondo molare",
		"terzo molare"
	];
	function mpNomeDente(n) {
		const q = +String(n)[0];
		return (MP_NOMI_DENTE[+String(n).slice(1)] || "dente") + (q <= 2 ? " sup. " : " inf. ") + (q === 1 || q === 4 ? "dx" : "sx");
	}
	function mpCatDente(s) {
		for (const c of [
			"f",
			"p",
			"t",
			"m"
		]) if ((s || []).some((x) => (MP_DENTE.find((d) => d[0] === x) || [])[2] === c)) return c;
		return null;
	}
	var MP_GRADI = [
		"#B9C3D9",
		"#7FD1C9",
		ORO,
		URG
	];
	var MP_NOMI_GRADO = [
		"0",
		"1 lieve",
		"2 media",
		"3 forte"
	];
	var MP_PUNTI = [
		["GV20", "Bai-hui"],
		["BL13", "Shu Polmone"],
		["BL14", "Shu Pericardio"],
		["BL15", "Shu Cuore"],
		["BL17", "Shu Diaframma"],
		["BL18", "Shu Fegato"],
		["BL19", "Shu Vescica biliare"],
		["BL20", "Shu Milza"],
		["BL21", "Shu Stomaco"],
		["BL22", "Shu Triplice riscaldatore"],
		["BL23", "Shu Rene"],
		["BL25", "Shu Grosso intestino"],
		["BL27", "Shu Intestino tenue"],
		["BL28", "Shu Vescica"],
		["GB21", "Base del collo"],
		["SI9", "Spalla"],
		["GB34", "Grassella"],
		["ST36", "Sotto la grassella"],
		["SP6", "Sopra il garretto"],
		["LI4", "Arto anteriore"],
		["KID1", "Bulbi del tallone"],
		["C", "Cervicale"]
	];
	var MP = {};
	var mpCampo = (k) => (VS.campi || []).find((c) => c.k === k) || {
		k,
		modo: "segni"
	};
	var mpDisegno = (c) => c.modo === "denti" ? "denti" : c.modo === "zone" ? "lingua" : MP_SET[c.disegno] ? c.disegno : "cavallo";
	var mpSet = (c) => MP_SET[mpDisegno(c)];
	var mpTipi = (c) => mpSet(c).tipi || MP_SET.cavallo.tipi;
	var mpTipo1 = (c, t) => mpTipi(c).find((x) => x[0] === t) || mpTipi(c)[mpTipi(c).length - 1];
	var mpVistaDi = (c, v) => mpSet(c).viste.find((x) => x[0] === v) || mpSet(c).viste[0];
	var mpNomeVista = (c, v) => mpVistaDi(c, v)[1];
	var mpTestoVista = (c, v) => {
		const x = mpVistaDi(c, v);
		return x[2].t || x[1].toLowerCase();
	};
	var mpStato = (k) => MP[k] = MP[k] || {
		vista: mpSet(mpCampo(k)).viste[0][0],
		tipo: mpTipi(mpCampo(k))[0][0],
		sel: null,
		zoom: false,
		attesaNome: null,
		cerca: ""
	};
	var mpOggetto = (c) => c.modo === "denti" || c.modo === "zone";
	var mpVal = (k) => {
		const v = VS.visita?.dati?.[k];
		return Array.isArray(v) ? v : [];
	};
	var mpObj = (k) => {
		const v = VS.visita?.dati?.[k];
		return v && typeof v === "object" && !Array.isArray(v) ? v : {};
	};
	var mpId = () => "m" + Math.random().toString(36).slice(2, 9);
	function mpGeo(c, vista) {
		const o = mpVistaDi(c, vista)[2], dis = MP_D[o.d];
		const [cx, cy, cw, ch] = o.crop || [
			0,
			0,
			dis.w,
			dis.h
		];
		return {
			o,
			dis,
			cx,
			cy,
			cw,
			ch
		};
	}
	function mpZonaArto(c, vista, y) {
		if (mpDisegno(c) !== "arto") return null;
		const g = mpGeo(c, vista), py = g.cy + y * g.ch, b = (MP_BANDE[g.o.d] || []).find(([, a, z]) => py >= a && py < z);
		return b ? b[0] : null;
	}
	var mpChiaveMem = () => "equo-mtc-punti-" + (currentUser?.id || "x");
	function mpMemLeggi() {
		try {
			return JSON.parse(localStorage.getItem(mpChiaveMem()) || "{}") || {};
		} catch (_) {
			return {};
		}
	}
	function mpMemScrivi(p) {
		if (!p?.n) return;
		try {
			const m = mpMemLeggi();
			m[p.n] = {
				v: p.v,
				x: p.x,
				y: p.y
			};
			localStorage.setItem(mpChiaveMem(), JSON.stringify(m));
		} catch (_) {}
	}
	function mpPosizioneNota(k, nome) {
		for (const pr of VS.precedenti || []) {
			const p = (pr.dati && Array.isArray(pr.dati[k]) ? pr.dati[k] : []).find((x) => x.n === nome);
			if (p) return {
				v: p.v,
				x: p.x,
				y: p.y
			};
		}
		return mpMemLeggi()[nome] || null;
	}
	function mpNomiNoti(k) {
		const l = MP_PUNTI.map(([c, n]) => ({
			c,
			n
		}));
		const extra = new Set(Object.keys(mpMemLeggi()));
		(VS.precedenti || []).forEach((pr) => (Array.isArray(pr.dati?.[k]) ? pr.dati[k] : []).forEach((p) => p.n && extra.add(p.n)));
		extra.forEach((c) => {
			if (!l.some((x) => x.c === c)) l.push({
				c,
				n: ""
			});
		});
		return l;
	}
	function mpDisegnoSvg(c, val, vista, opz = {}) {
		const { dis, cx, cy, cw, ch, o } = mpGeo(c, vista), uid = opz.uid || "x";
		let sag = `<path d="${dis.d}"/>`;
		if (o.spec) sag = `<g transform="translate(${2 * cx + cw},0) scale(-1,1)">${sag}</g>`;
		else if (o.specLat) sag = `<defs><clipPath id="mpcl-${uid}"><rect x="${MP_LAT.da}" y="0" width="${MP_LAT.fino - MP_LAT.da}" height="${dis.h}"/></clipPath><clipPath id="mpcr-${uid}"><rect x="${MP_LAT.fino}" y="0" width="${dis.w - MP_LAT.fino}" height="${dis.h}"/></clipPath></defs>
    <g clip-path="url(#mpcl-${uid})"><g transform="translate(${2 * MP_LAT.asse},0) scale(-1,1)">${sag}</g></g><g clip-path="url(#mpcr-${uid})">${sag}</g>`;
		const fs = Math.round(Math.max(cw, ch) * .019);
		const scritta = (x, y, t, extra = "") => `<text x="${x}" y="${y}" text-anchor="middle" font-size="${fs}" font-weight="800" fill="${NOTTE}" stroke="#FFFFFF" stroke-width="${fs * .3}" paint-order="stroke" font-family="Helvetica,Arial,sans-serif" pointer-events="none"${extra}>${mpEsc(t)}</text>`;
		let sopra = "", segni = "";
		const disegno = mpDisegno(c);
		if (disegno === "arto") {
			const l = Array.isArray(val) ? val.filter((p) => p.v === vista) : [], usate = new Set(l.map((p) => p.z).filter(Boolean));
			const [x0, x1] = MP_BANDE_X;
			sopra = (MP_BANDE[o.d] || []).map(([z, a, b]) => `${usate.has(z) ? `<rect x="${x0}" y="${a}" width="${x1 - x0}" height="${b - a}" fill="${ORO}" opacity=".4" pointer-events="none"/>` : ""}
      <path d="M${x0 - 10},${b} L${x1},${b}" stroke="${GRIGIO}" stroke-width="2.5" stroke-dasharray="9 7" pointer-events="none"/>
      <text x="${x1 + 14}" y="${(a + b) / 2 + 9}" font-size="26" font-weight="800" fill="${NOTTE}" font-family="Helvetica,Arial,sans-serif" pointer-events="none">${z}</text>`).join("") + `<path d="M${x0 - 10},${MP_BANDE[o.d][0][1]} L${x1},${MP_BANDE[o.d][0][1]}" stroke="${GRIGIO}" stroke-width="2.5" stroke-dasharray="9 7" pointer-events="none"/>` + (o.lab ? `<text x="${MP_LAT.asse}" y="1072" text-anchor="middle" font-size="28" font-weight="700" fill="${GRIGIO}" font-family="Helvetica,Arial,sans-serif" pointer-events="none">${o.lab[0].toUpperCase()}</text>
        <text x="980" y="1072" text-anchor="middle" font-size="28" font-weight="700" fill="${GRIGIO}" font-family="Helvetica,Arial,sans-serif" pointer-events="none">${o.lab[1].toUpperCase()}</text>` : "");
		}
		if (disegno === "denti") {
			const d = val && typeof val === "object" ? val : {};
			sopra = Object.entries(MP_DENTI).map(([n, t]) => {
				const cat = mpCatDente(d[n]?.s), sel = opz.sel === n;
				return `<polygon class="mp-z" data-z="${n}" points="${t.p}" fill="${cat ? MP_CAT[cat][0] : "#FFFFFF"}" fill-opacity="${cat ? cat === "m" ? .6 : .85 : .01}"${sel ? ` stroke="${NOTTE}" stroke-width="7"` : ""}/>`;
			}).join("") + Object.entries(MP_DENTI).map(([n, t]) => {
				const f = +n.slice(1) >= 6 ? 22 : 17;
				return `<text x="${t.x}" y="${t.y + f * .35}" text-anchor="middle" font-size="${f}" font-weight="800" fill="${NOTTE}" stroke="#FFFFFF" stroke-width="5" paint-order="stroke" font-family="Helvetica,Arial,sans-serif" pointer-events="none">${n}</text>`;
			}).join("") + `<text x="443" y="60" text-anchor="middle" font-size="34" font-weight="800" fill="${GRIGIO}" font-family="Helvetica,Arial,sans-serif" pointer-events="none">SUPERIORE</text>
        <text x="443" y="1745" text-anchor="middle" font-size="34" font-weight="800" fill="${GRIGIO}" font-family="Helvetica,Arial,sans-serif" pointer-events="none">INFERIORE</text>
        <text x="40" y="960" font-size="28" font-weight="700" fill="${GRIGIO}" font-family="Helvetica,Arial,sans-serif" pointer-events="none">DX</text>
        <text x="808" y="960" font-size="28" font-weight="700" fill="${GRIGIO}" font-family="Helvetica,Arial,sans-serif" pointer-events="none">SX</text>`;
		}
		if (disegno === "lingua") {
			const d = val && typeof val === "object" ? val : {};
			sopra = MP_ZONE.map(([z]) => {
				const t = MP_LINGUA[z], v = d[z], pieno = mpZonaPiena(v), sel = opz.sel === z;
				const col = !pieno ? "#FFFFFF" : /Ross/.test(v.colore || "") ? URG : v.colore === "Viola" ? NOTTE : ORO;
				const op = !pieno ? .01 : v.colore === "Rosso scuro" ? .45 : /Ross|Viola/.test(v.colore || "") ? .3 : .35;
				return `<polygon class="mp-z" data-z="${z}" points="${t.p}" fill="${col}" fill-opacity="${op}" stroke="${sel ? NOTTE : GRIGIO}" stroke-width="${sel ? 8 : 3}"${sel ? "" : " stroke-dasharray=\"14 10\""}/>`;
			}).join("") + MP_ZONE.map(([z, n]) => {
				const t = MP_LINGUA[z], v = d[z];
				const r = mpZonaPiena(v) ? mpZonaBreve(v) : "";
				return scritta(t.x, t.y, /^Lato/.test(n) ? "Lato" : n) + (r ? `<text x="${t.x}" y="${t.y + fs * 1.25}" text-anchor="middle" font-size="${fs * .8}" font-weight="700" fill="${NOTTE}" stroke="#FFFFFF" stroke-width="${fs * .25}" paint-order="stroke" font-family="Helvetica,Arial,sans-serif" pointer-events="none">${mpEsc(r)}</text>` : "");
			}).join("") + `<text x="${MP_LINGUA.lato_dx.x - 120}" y="1430" font-size="28" font-weight="700" fill="${GRIGIO}" font-family="Helvetica,Arial,sans-serif" pointer-events="none">DX</text>
        <text x="${MP_LINGUA.lato_sx.x + 80}" y="1430" font-size="28" font-weight="700" fill="${GRIGIO}" font-family="Helvetica,Arial,sans-serif" pointer-events="none">SX</text>`;
		}
		if (!mpOggetto(c)) {
			const r = Math.round(Math.max(cw, ch) * .017);
			segni = (Array.isArray(val) ? val : []).filter((p) => p.v === vista).map((p) => {
				const x = cx + p.x * cw, y = cy + p.y * ch, sel = opz.sel === p.id;
				const col = c.modo === "punti" ? p.g == null ? "#FFFFFF" : MP_GRADI[p.g] : mpTipo1(c, p.tipo)[2];
				const testo = c.modo === "punti" ? p.g > 0 || sel || opz.pdf ? p.n || "?" : "" : String(p.num || "");
				return `<g class="mp-m${sel ? " sel" : ""}" data-id="${mpEsc(p.id)}" transform="translate(${x.toFixed(1)},${y.toFixed(1)})">
        ${sel ? `<circle r="${r * 1.9}" fill="none" stroke="${NOTTE}" stroke-width="${r * .25}"/>` : ""}
        <circle r="${sel ? r * 1.3 : r}" fill="${col}" stroke="${c.modo === "punti" && p.g == null ? NOTTE : "#FFFFFF"}" stroke-width="${r * .3}"/>
        ${c.modo !== "punti" ? `<text y="${r * .42}" text-anchor="middle" font-size="${r * 1.2}" font-weight="800" fill="#FFFFFF" font-family="Helvetica,Arial,sans-serif">${mpEsc(testo)}</text>` : testo ? `<text y="${-r * 1.6}" text-anchor="middle" font-size="${r * 1.35}" font-weight="800" fill="${NOTTE}" stroke="#FFFFFF" stroke-width="${r * .45}" paint-order="stroke" font-family="Helvetica,Arial,sans-serif">${mpEsc(testo)}</text>` : ""}
      </g>`;
			}).join("");
		}
		return `<svg class="mp-svg mp-${disegno}" viewBox="${cx} ${cy} ${cw} ${ch}"${opz.pdf ? ` xmlns="http://www.w3.org/2000/svg" width="${cw}" height="${ch}" color="${NOTTE}"` : ""} data-k="${mpEsc(c.k)}" role="img" aria-label="${mpEsc(mpNomeVista(c, vista))}">
    ${opz.pdf ? `<rect x="${cx}" y="${cy}" width="${cw}" height="${ch}" fill="#FFFFFF"/>` : ""}<g class="mp-sag" fill="currentColor" fill-rule="evenodd">${sag}</g>${sopra}${segni}</svg>`;
	}
	function mpSvg(k) {
		const st = mpStato(k);
		return mpDisegnoSvg(mpCampo(k), VS.visita?.dati?.[k], st.vista, {
			sel: st.sel,
			uid: k
		});
	}
	function mpCampoHtml$1(c, val, sola) {
		const tit = c.e && c.e !== c.s ? `<span class="vs-lab">${mpEsc(c.e)}</span>` : "";
		return `<div class="vs-campo pieno mp mp-${mpDisegno(c)}-c" id="mp-${mpEsc(c.k)}">${tit ? `<div class="mp-tit">${tit}</div>` : ""}<div class="mp-dentro">${mpInterno(c.k, sola)}</div></div>`;
	}
	function mpInterno(k, sola) {
		const c = mpCampo(k);
		if (c.modo === "denti") return mpInternoDenti(k, sola);
		if (c.modo === "zone") return mpInternoZone(k, sola);
		const st = mpStato(k), l = mpVal(k), punti = c.modo === "punti", set = mpSet(c);
		const conta = (v) => l.filter((p) => p.v === v).length;
		const chip = (on, az, t, stile) => `<button type="button" class="vs-chip${on ? " on" : ""}" aria-pressed="${!!on}"${sola ? " disabled" : ""} onclick="${az}"${stile ? ` style="${stile}"` : ""}>${t}</button>`;
		const sel = l.find((p) => p.id === st.sel);
		const tipi = !punti && !sola ? `<div class="vs-chips mp-tipi">${mpTipi(c).map(([t, n, col]) => chip(st.tipo === t, `mpTipo(${mpJs(k)}, '${t}')`, mpEsc(n), st.tipo === t ? `background:${col};border-color:${col};color:#fff` : "")).join("")}</div>` : "";
		const viste = `<div class="mp-viste" role="tablist">${set.viste.map(([v, n]) => `<button type="button" role="tab" aria-selected="${st.vista === v}" class="${st.vista === v ? "on" : ""}" onclick="mpVista(${mpJs(k)}, '${v}')">${n}${conta(v) ? ` <b>${conta(v)}</b>` : ""}</button>`).join("")}</div>`;
		const dove = mpDisegno(c) === "arto" ? " Le zone dei tendini (1A–3C, pastorale) si segnano da sole." : "";
		return `${tipi}${viste}${sola ? "" : punti ? st.attesaNome ? `<div class="mp-aiuto on">Tocca il disegno dove hai trovato <b>${mpEsc(st.attesaNome)}</b>.</div>` : "<div class=\"mp-aiuto\">Tocca il disegno dove trovi il punto, poi scegli il nome e la reattività. Trascina un pallino per spostarlo.</div>" : `<div class="mp-aiuto">Tocca il disegno per segnare <b>${mpEsc(mpTipo1(c, st.tipo)[1].toLowerCase())}</b>. Trascina un segno per spostarlo.${dove}</div>`}
    <div class="mp-box${st.zoom ? " zoom" : ""}">${mpSvg(k)}</div>
    <div class="mp-barra"><button type="button" class="mp-lente" onclick="mpZoom(${mpJs(k)})">${st.zoom ? "Riduci" : "Ingrandisci"}</button>
      ${punti && !sola ? `<button type="button" class="mp-lente" onclick="mpElencoNomi(${mpJs(k)})">${st.cerca === null ? "Chiudi l'elenco" : "Scegli dall'elenco"}</button>` : ""}</div>
    ${punti && !sola && st.cerca === null && !sel ? mpScegliNome(k, null) : ""}
    ${sel && !sola ? mpPannello(k, sel) : ""}
    ${mpElenco(k)}`;
	}
	function mpPannello(k, p) {
		const c = mpCampo(k);
		if (c.modo === "punti") return `<div class="mp-pan">
      <div class="mp-pan-t"><b>${p.n ? mpEsc(p.n) + mpEsc(mpDescr(p.n) ? " · " + mpDescr(p.n) : "") : "Che punto è?"}</b><small>${mpEsc(mpNomeVista(c, p.v))}</small></div>
      ${!p.n ? mpScegliNome(k, p.id) : `<div class="mp-gradi">${[
			0,
			1,
			2,
			3
		].map((g) => `<button type="button" class="${p.g === g ? "on" : ""}" style="${p.g === g ? `background:${MP_GRADI[g]};border-color:${MP_GRADI[g]};color:${g ? "#fff" : NOTTE}` : ""}" onclick="mpGrado(${mpJs(k)}, ${g})">${g}</button>`).join("")}</div>
        <div class="mp-pan-az"><button type="button" onclick="mpRinomina(${mpJs(k)})">Cambia nome</button><button type="button" class="urg" onclick="mpTogli(${mpJs(k)})">Togli</button><button type="button" onclick="mpChiudi(${mpJs(k)})">Fatto</button></div>`}
    </div>`;
		const tipo = mpTipo1(c, p.tipo);
		return `<div class="mp-pan">
      <div class="mp-pan-t"><b>${p.num} · ${mpEsc(tipo[1])}</b><small>${mpEsc(mpNomeVista(c, p.v))}${p.z ? " · zona " + mpEsc(p.z) : ""}</small></div>
      <div class="vs-chips">${mpTipi(c).map(([t, n, col]) => `<button type="button" class="vs-chip${p.tipo === t ? " on" : ""}" style="${p.tipo === t ? `background:${col};border-color:${col};color:#fff` : ""}" onclick="mpCambiaTipo(${mpJs(k)}, '${t}')">${mpEsc(n)}</button>`).join("")}</div>
      <input class="mp-nota" maxlength="140" value="${mpEsc(p.nota || "")}" placeholder="${mpDisegno(c) === "arto" ? "Nota: struttura, com'è (es. TFDS, lesione centrale)" : "Nota: dove, com'è, da quando"}" oninput="mpNota(${mpJs(k)}, this.value)">
      <div class="mp-pan-az"><button type="button" onclick="mpFoto()">Foto</button><button type="button" class="urg" onclick="mpTogli(${mpJs(k)})">Togli</button><button type="button" onclick="mpChiudi(${mpJs(k)})">Fatto</button></div>
    </div>`;
	}
	var mpDescr = (c) => (MP_PUNTI.find((x) => x[0] === c) || [])[1] || "";
	function mpScegliNome(k, id) {
		const st = mpStato(k), q = String(st.cercaTesto || "").trim(), ql = q.toLowerCase();
		const nomi = mpNomiNoti(k).filter((x) => !ql || x.c.toLowerCase().includes(ql) || x.n.toLowerCase().includes(ql));
		const az = (c) => id ? `mpNome(${mpJs(k)}, ${mpJs(c)})` : `mpNomePrima(${mpJs(k)}, ${mpJs(c)})`;
		return `<div class="mp-nomi"><input class="mp-cerca" id="mp-cerca-${mpEsc(k)}" value="${mpEsc(q)}" placeholder="Cerca o scrivi il nome del punto" oninput="mpCerca(${mpJs(k)}, this.value)" autocomplete="off">
    <div class="vs-chips">${nomi.slice(0, 30).map((x) => `<button type="button" class="vs-chip" onclick="${az(x.c)}"><b>${mpEsc(x.c)}</b>${x.n ? " " + mpEsc(x.n) : ""}</button>`).join("")}
      ${q && !nomi.some((x) => x.c.toLowerCase() === ql) ? `<button type="button" class="vs-chip on" onclick="${az(q)}">Usa «${mpEsc(q)}»</button>` : ""}</div></div>`;
	}
	function mpElenco(k) {
		const c = mpCampo(k), l = mpVal(k);
		if (!l.length) return "";
		if (c.modo === "punti") return `<div class="mp-el">${l.filter((p) => p.n).sort((a, b) => (b.g ?? -1) - (a.g ?? -1) || a.n.localeCompare(b.n)).map((p) => `<button type="button" onclick="mpSeleziona(${mpJs(k)}, ${mpJs(p.id)})"><b>${mpEsc(p.n)}${mpDescr(p.n) ? " · " + mpEsc(mpDescr(p.n)) : ""}</b>
      <span><i style="background:${p.g == null ? "#FFFFFF" : MP_GRADI[p.g]}"></i>${p.g == null ? "da valutare" : MP_NOMI_GRADO[p.g]} · ${mpEsc(mpTestoVista(c, p.v))}</span></button>`).join("")}</div>`;
		return `<div class="mp-el">${l.slice().sort((a, b) => a.num - b.num).map((p) => {
			const t = mpTipo1(c, p.tipo);
			const dove = [mpSet(c).viste.length > 1 && mpDisegno(c) !== "cavallo" ? mpTestoVista(c, p.v) : "", p.z ? "zona " + p.z : ""].filter(Boolean).join(" · ");
			return `<button type="button" onclick="mpSeleziona(${mpJs(k)}, ${mpJs(p.id)})"><b><i style="background:${t[2]}"></i>${p.num} · ${mpEsc(t[1])}</b><span>${mpEsc([p.nota, dove].filter(Boolean).join(" · ") || mpTestoVista(c, p.v))}</span></button>`;
		}).join("")}</div>`;
	}
	function mpInternoDenti(k, sola) {
		const st = mpStato(k);
		mpCampo(k);
		const d = mpObj(k), n = st.sel && MP_DENTI[st.sel] ? st.sel : null, s = n ? d[n]?.s || [] : [];
		const pan = n && !sola ? `<div class="mp-pan"><div class="mp-pan-t"><b>${n} · ${mpEsc(mpNomeDente(n))}</b></div>
      <div class="vs-chips">${MP_DENTE.map(([id, nome, cat]) => {
			const on = s.includes(id);
			return `<button type="button" class="vs-chip${on ? " on" : ""}" aria-pressed="${on}" style="${on ? `background:${MP_CAT[cat][0]};border-color:${MP_CAT[cat][0]};color:${cat === "m" ? NOTTE : "#fff"}` : ""}" onclick="mpDente(${mpJs(k)}, '${id}')">${mpEsc(nome)}</button>`;
		}).join("")}</div>
      <input class="mp-nota" maxlength="140" value="${mpEsc(d[n]?.nota || "")}" placeholder="Nota sul dente" oninput="mpNotaOggetto(${mpJs(k)}, this.value)">
      <div class="mp-pan-az"><button type="button" onclick="mpOggettoSvuota(${mpJs(k)})">Normale</button><button type="button" onclick="mpDenteVicino(${mpJs(k)}, -1)">‹ Prima</button><button type="button" onclick="mpDenteVicino(${mpJs(k)}, 1)">Dopo ›</button><button type="button" onclick="mpChiudi(${mpJs(k)})">Fatto</button></div></div>` : "";
		const segnati = Object.keys(d).filter((x) => MP_DENTI[x] && (d[x].s?.length || d[x].nota)).sort();
		const el = segnati.length ? `<div class="mp-el">${segnati.map((x) => {
			const cat = mpCatDente(d[x].s);
			return `<button type="button" onclick="mpSelezionaZona(${mpJs(k)}, ${mpJs(x)})"><b><i style="background:${cat ? MP_CAT[cat][0] : "#FFFFFF"}"></i>${x}</b><span>${mpEsc(mpTestoDente(d[x]))}</span></button>`;
		}).join("")}</div>` : "";
		return `${sola ? "" : "<div class=\"mp-aiuto\">Tocca un dente e scegli com'è. Numeri Triadan: 100 sup. dx · 200 sup. sx · 300 inf. sx · 400 inf. dx (destra del cavallo a sinistra di chi guarda).</div>"}
    <div class="mp-box${st.zoom ? " zoom" : ""}">${mpSvg(k)}</div>
    <div class="mp-barra"><span class="mp-leg">${Object.values(MP_CAT).map(([col, t]) => `<span><i style="background:${col}"></i>${t}</span>`).join("")}</span><button type="button" class="mp-lente" onclick="mpZoom(${mpJs(k)})">${st.zoom ? "Riduci" : "Ingrandisci"}</button></div>
    ${pan}${el}`;
	}
	var mpTestoDente = (v) => [...(v?.s || []).map((x) => (MP_DENTE.find((d) => d[0] === x) || [, x])[1].toLowerCase().replace("eotrh", "EOTRH")), v?.nota || ""].filter(Boolean).join(", ");
	function mpDente(k, id) {
		const st = mpStato(k), d = { ...mpObj(k) }, v = { ...d[st.sel] || {} }, s = new Set(v.s || []);
		s.has(id) ? s.delete(id) : s.add(id);
		if (s.has(id) && ["mancante", "estratto"].includes(id)) [...s].forEach((x) => {
			if (![
				"mancante",
				"estratto",
				id
			].includes(x)) s.delete(x);
		});
		if (s.has(id) && !["mancante", "estratto"].includes(id)) s.delete("mancante");
		v.s = MP_DENTE.map((x) => x[0]).filter((x) => s.has(x));
		d[st.sel] = v;
		vsCambia(k, d);
		mpRidisegna(k);
	}
	function mpDenteVicino(k, dir) {
		const st = mpStato(k), ord = Object.keys(MP_DENTI).sort();
		st.sel = ord[(ord.indexOf(st.sel) + dir + ord.length) % ord.length];
		mpRidisegna(k);
	}
	var mpZonaPiena = (v) => !!(v && (v.colore || v.patina || v.patina_c || v.umidita || v.segni?.length || v.nota));
	var mpZonaBreve = (v) => [v.colore, v.patina && v.patina !== "Assente" ? "patina " + v.patina.toLowerCase() : ""].filter(Boolean).join(", ").toLowerCase();
	function mpTestoZona(v) {
		if (!mpZonaPiena(v)) return "";
		const patina = v.patina === "Assente" ? "senza patina" : v.patina || v.patina_c ? [
			"patina",
			v.patina,
			v.patina_c
		].filter(Boolean).join(" ").toLowerCase() : "";
		const umid = v.umidita ? v.umidita === "Normale" ? "umidità normale" : v.umidita.toLowerCase() : "";
		return [
			v.colore?.toLowerCase(),
			patina,
			umid,
			...(v.segni || []).map((x) => x.toLowerCase()),
			v.nota
		].filter(Boolean).join(", ");
	}
	function mpInternoZone(k, sola) {
		const st = mpStato(k), d = mpObj(k), z = st.sel && MP_LINGUA[st.sel] ? st.sel : null, v = z ? d[z] || {} : {}, info = MP_ZONE.find((x) => x[0] === z);
		const gruppo = (campo, nome, opz) => campo === "patina_c" && (!v.patina || v.patina === "Assente") ? "" : `<div class="mp-gr"><span>${mpEsc(nome)}</span><div class="vs-chips">${opz.map((o) => `<button type="button" class="vs-chip${v[campo] === o ? " on" : ""}" aria-pressed="${v[campo] === o}" onclick="mpZonaScegli(${mpJs(k)}, '${campo}', ${mpJs(o)})">${mpEsc(o)}</button>`).join("")}</div></div>`;
		const pan = z && !sola ? `<div class="mp-pan"><div class="mp-pan-t"><b>${mpEsc(info[1])}</b><small>${mpEsc(info[2])}</small></div>
      ${MP_LINGUA_SCELTE.map(([campo, nome, opz]) => gruppo(campo, nome, opz)).join("")}
      <div class="mp-gr"><span>Segni</span><div class="vs-chips">${MP_LINGUA_SEGNI.map((o) => {
			const on = (v.segni || []).includes(o);
			return `<button type="button" class="vs-chip${on ? " on" : ""}" aria-pressed="${on}" onclick="mpZonaSegno(${mpJs(k)}, ${mpJs(o)})">${mpEsc(o)}</button>`;
		}).join("")}</div></div>
      <input class="mp-nota" maxlength="140" value="${mpEsc(v.nota || "")}" placeholder="Nota sulla zona" oninput="mpNotaOggetto(${mpJs(k)}, this.value)">
      <div class="mp-pan-az"><button type="button" class="urg" onclick="mpOggettoSvuota(${mpJs(k)})">Svuota</button><button type="button" onclick="mpChiudi(${mpJs(k)})">Fatto</button></div></div>` : "";
		const el = MP_ZONE.filter(([x]) => mpZonaPiena(d[x])).map(([x, n, org]) => `<button type="button" onclick="mpSelezionaZona(${mpJs(k)}, ${mpJs(x)})"><b>${mpEsc(n)} · ${mpEsc(org)}</b><span>${mpEsc(mpTestoZona(d[x]))}</span></button>`).join("");
		return `${sola ? "" : "<div class=\"mp-aiuto\">Tocca una zona della lingua: colore, patina, umidità, segni. Punta in basso; destra del cavallo a sinistra di chi guarda.</div>"}
    <div class="mp-box${st.zoom ? " zoom" : ""}">${mpSvg(k)}</div>
    <div class="mp-barra"><button type="button" class="mp-lente" onclick="mpZoom(${mpJs(k)})">${st.zoom ? "Riduci" : "Ingrandisci"}</button></div>
    ${pan}${el ? `<div class="mp-el">${el}</div>` : ""}`;
	}
	function mpZonaAggiorna(k, fn) {
		const st = mpStato(k), d = { ...mpObj(k) }, v = { ...d[st.sel] || {} };
		fn(v);
		d[st.sel] = v;
		vsCambia(k, d);
	}
	function mpZonaScegli(k, campo, o) {
		mpZonaAggiorna(k, (v) => {
			v[campo] = v[campo] === o ? "" : o;
			if (campo === "patina" && v.patina === "Assente") v.patina_c = "";
		});
		mpRidisegna(k);
	}
	function mpZonaSegno(k, o) {
		mpZonaAggiorna(k, (v) => {
			const s = new Set(v.segni || []);
			s.has(o) ? s.delete(o) : s.add(o);
			v.segni = MP_LINGUA_SEGNI.filter((x) => s.has(x));
		});
		mpRidisegna(k);
	}
	function mpNotaOggetto(k, t) {
		mpZonaAggiorna(k, (v) => {
			v.nota = String(t).slice(0, 140);
		});
	}
	function mpOggettoSvuota(k) {
		const st = mpStato(k), d = { ...mpObj(k) };
		delete d[st.sel];
		vsCambia(k, d);
		mpRidisegna(k);
	}
	function mpSelezionaZona(k, z) {
		const st = mpStato(k);
		st.sel = st.sel === z ? null : z;
		mpRidisegna(k);
	}
	function mpRidisegna(k) {
		const box = document.querySelector("#mp-" + CSS.escape(k) + " .mp-dentro");
		if (!box) return;
		box.innerHTML = mpInterno(k, VS.visita?.stato === "conclusa");
		mpAttiva(k);
	}
	function mpSalva(k, l) {
		vsCambia(k, l);
	}
	function mpVista(k, v) {
		const st = mpStato(k);
		st.vista = v;
		st.sel = null;
		mpRidisegna(k);
	}
	function mpTipo(k, t) {
		mpStato(k).tipo = t;
		mpRidisegna(k);
	}
	function mpZoom(k) {
		const st = mpStato(k);
		st.zoom = !st.zoom;
		mpRidisegna(k);
	}
	function mpElencoNomi(k) {
		const st = mpStato(k);
		st.cerca = st.cerca === null ? "" : null;
		st.sel = null;
		st.cercaTesto = "";
		mpRidisegna(k);
	}
	function mpCerca(k, q) {
		const st = mpStato(k);
		st.cercaTesto = q;
		mpRidisegna(k);
		const i = document.getElementById("mp-cerca-" + k);
		if (i) {
			i.focus();
			i.setSelectionRange(q.length, q.length);
		}
	}
	function mpSeleziona(k, id) {
		const st = mpStato(k), p = mpVal(k).find((x) => x.id === id);
		if (!p) return;
		st.vista = p.v;
		st.sel = id;
		st.cerca = "";
		mpRidisegna(k);
	}
	function mpChiudi(k) {
		const st = mpStato(k);
		st.sel = null;
		st.cercaTesto = "";
		mpRidisegna(k);
	}
	function mpAggiorna(k, id, campi) {
		const l = mpVal(k).map((p) => p.id === id ? {
			...p,
			...campi
		} : p);
		mpSalva(k, l);
		const p = l.find((x) => x.id === id);
		if (mpCampo(k).modo === "punti") mpMemScrivi(p);
		return p;
	}
	function mpNome(k, nome) {
		const st = mpStato(k);
		nome = String(nome || "").trim().slice(0, 40);
		if (!nome) return;
		const gia = mpVal(k).find((p) => p.n === nome && p.v === st.vista && p.id !== st.sel);
		if (gia) {
			const nuovo = mpVal(k).find((p) => p.id === st.sel);
			mpSalva(k, mpVal(k).filter((p) => p.id !== st.sel));
			mpAggiorna(k, gia.id, {
				x: nuovo.x,
				y: nuovo.y
			});
			st.sel = gia.id;
		} else mpAggiorna(k, st.sel, { n: nome });
		st.cercaTesto = "";
		mpRidisegna(k);
	}
	function mpNomePrima(k, nome) {
		const st = mpStato(k);
		nome = String(nome || "").trim().slice(0, 40);
		if (!nome) return;
		st.cerca = "";
		st.cercaTesto = "";
		const gia = mpVal(k).find((p) => p.n === nome);
		if (gia) {
			st.vista = gia.v;
			st.sel = gia.id;
			return mpRidisegna(k);
		}
		const pos = mpPosizioneNota(k, nome);
		if (pos) {
			const p = {
				id: mpId(),
				v: pos.v,
				x: pos.x,
				y: pos.y,
				n: nome,
				g: null
			};
			mpSalva(k, [...mpVal(k), p]);
			st.vista = pos.v;
			st.sel = p.id;
			showToast("Messo dove l'avevi segnato l'ultima volta: trascinalo se serve");
		} else {
			st.attesaNome = nome;
			showToast("Tocca il disegno dove hai trovato " + nome);
		}
		mpRidisegna(k);
	}
	function mpRinomina(k) {
		mpAggiorna(k, mpStato(k).sel, { n: "" });
		mpRidisegna(k);
	}
	function mpGrado(k, g) {
		const st = mpStato(k);
		const p = mpVal(k).find((x) => x.id === st.sel);
		mpAggiorna(k, st.sel, { g: p && p.g === g ? null : g });
		mpRidisegna(k);
	}
	function mpTogli(k) {
		const st = mpStato(k);
		mpSalva(k, mpVal(k).filter((p) => p.id !== st.sel));
		st.sel = null;
		mpRidisegna(k);
	}
	function mpCambiaTipo(k, t) {
		const st = mpStato(k);
		mpAggiorna(k, st.sel, { tipo: t });
		st.tipo = t;
		mpRidisegna(k);
	}
	function mpNota(k, v) {
		mpAggiorna(k, mpStato(k).sel, { nota: String(v).slice(0, 140) });
	}
	function mpFoto() {
		if (typeof vaScegli === "function") {
			vaScegli("foto");
			setTimeout(() => document.getElementById("va-box")?.scrollIntoView({
				block: "start",
				behavior: "smooth"
			}), 400);
		}
	}
	function mpNuovo(k, x, y) {
		const st = mpStato(k), c = mpCampo(k), l = mpVal(k);
		if (c.modo === "punti") {
			const p = {
				id: mpId(),
				v: st.vista,
				x,
				y,
				n: st.attesaNome || "",
				g: null
			};
			st.attesaNome = null;
			st.cerca = "";
			mpSalva(k, [...l, p]);
			st.sel = p.id;
			if (p.n) mpMemScrivi(p);
		} else {
			const p = {
				id: mpId(),
				v: st.vista,
				x,
				y,
				tipo: st.tipo,
				num: l.reduce((m, q) => Math.max(m, q.num || 0), 0) + 1,
				nota: ""
			};
			const z = mpZonaArto(c, st.vista, y);
			if (z) p.z = z;
			mpSalva(k, [...l, p]);
			st.sel = p.id;
		}
		mpRidisegna(k);
	}
	function mpAttiva(k) {
		const svg = document.getElementById("mp-" + k)?.querySelector(".mp-svg");
		if (!svg || VS.visita?.stato === "conclusa") return;
		const vb = svg.viewBox.baseVal, c = mpCampo(k);
		const pos = (ev) => {
			const pt = svg.createSVGPoint();
			pt.x = ev.clientX;
			pt.y = ev.clientY;
			const m = svg.getScreenCTM();
			const q = m ? pt.matrixTransform(m.inverse()) : {
				x: 0,
				y: 0
			};
			return {
				x: Math.max(0, Math.min(1, (q.x - vb.x) / vb.width)),
				y: Math.max(0, Math.min(1, (q.y - vb.y) / vb.height)),
				sx: q.x,
				sy: q.y
			};
		};
		if (mpOggetto(c)) {
			let t0 = null;
			svg.addEventListener("pointerdown", (ev) => {
				t0 = {
					x: ev.clientX,
					y: ev.clientY
				};
			});
			svg.addEventListener("pointerup", (ev) => {
				if (!t0 || Math.hypot(ev.clientX - t0.x, ev.clientY - t0.y) > 10) {
					t0 = null;
					return;
				}
				t0 = null;
				let z = ev.target.closest?.("[data-z]")?.dataset.z;
				if (!z && c.modo === "denti") {
					const p = pos(ev);
					let best = null, dmin = 60;
					Object.entries(MP_DENTI).forEach(([n, t]) => {
						const d = Math.hypot(t.x - p.sx, t.y - p.sy);
						if (d < dmin) {
							dmin = d;
							best = n;
						}
					});
					z = best;
				}
				if (z) {
					mpStato(k).sel = z;
					mpRidisegna(k);
				}
			});
			return;
		}
		let tr = null;
		svg.addEventListener("pointerdown", (ev) => {
			const g = ev.target.closest(".mp-m");
			tr = {
				id: g ? g.dataset.id : null,
				g,
				x0: ev.clientX,
				y0: ev.clientY,
				mosso: false
			};
			if (g) {
				try {
					svg.setPointerCapture(ev.pointerId);
				} catch (_) {}
				ev.preventDefault();
			}
		});
		svg.addEventListener("pointermove", (ev) => {
			if (!tr || !tr.g) return;
			if (Math.hypot(ev.clientX - tr.x0, ev.clientY - tr.y0) > 6) tr.mosso = true;
			if (tr.mosso) {
				const p = pos(ev);
				tr.g.setAttribute("transform", `translate(${p.sx.toFixed(1)},${p.sy.toFixed(1)})`);
				ev.preventDefault();
			}
		});
		svg.addEventListener("pointerup", (ev) => {
			const t = tr;
			tr = null;
			if (!t) return;
			const p = pos(ev);
			if (t.id && t.mosso) {
				const campi = {
					x: p.x,
					y: p.y
				};
				if (mpDisegno(c) === "arto") campi.z = mpZonaArto(c, mpStato(k).vista, p.y) || void 0;
				mpAggiorna(k, t.id, campi);
				mpStato(k).sel = t.id;
				return mpRidisegna(k);
			}
			if (t.id) return mpSeleziona(k, t.id);
			if (Math.hypot(ev.clientX - t.x0, ev.clientY - t.y0) > 10) return;
			const st = mpStato(k);
			if (st.sel) {
				const s = mpVal(k).find((x) => x.id === st.sel);
				if (s && c.modo === "punti" && !s.n) mpSalva(k, mpVal(k).filter((x) => x.id !== st.sel));
				st.sel = null;
			}
			mpNuovo(k, p.x, p.y);
		});
	}
	function mpAttivaTutte$1() {
		document.querySelectorAll("#vs-corpo .mp").forEach((b) => mpAttiva(b.id.slice(3)));
	}
	function mpReset$1() {
		Object.keys(MP).forEach((k) => delete MP[k]);
	}
	function mpTesto$1(c, v) {
		if (c.modo === "denti") {
			const d = v && typeof v === "object" && !Array.isArray(v) ? v : {};
			const r = Object.keys(d).filter((n) => MP_DENTI[n] && (d[n].s?.length || d[n].nota)).sort().map((n) => n + " " + mpTestoDente(d[n]));
			return r.length ? r.join("; ") : null;
		}
		if (c.modo === "zone") {
			const d = v && typeof v === "object" && !Array.isArray(v) ? v : {};
			const r = MP_ZONE.filter(([z]) => mpZonaPiena(d[z])).map(([z, n, org]) => `${n} (${org.replace(" / ", "/")}): ${mpTestoZona(d[z])}`);
			return r.length ? r.join("; ") : null;
		}
		const l = Array.isArray(v) ? v : [];
		if (!l.length) return null;
		if (c.modo === "punti") {
			const r = l.filter((p) => p.n && p.g != null).sort((a, b) => b.g - a.g || a.n.localeCompare(b.n));
			return r.length ? r.map((p) => `${p.n} ${p.g}/3 (${mpTestoVista(c, p.v)})`).join(", ") : null;
		}
		return l.slice().sort((a, b) => a.num - b.num).map((p) => `${p.num}. ${mpTipo1(c, p.tipo)[1]}${p.nota ? ": " + p.nota : ""} (${mpTestoVista(c, p.v)}${p.z ? ", zona " + p.z : ""})`).join("; ");
	}
	function mpSvgInImmagine(svg, w, h) {
		return new Promise((res) => {
			try {
				const img = new Image(), url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
				img.onload = () => {
					try {
						const s = Math.min(1.6, 1500 / Math.max(w, h)), cv = document.createElement("canvas");
						cv.width = Math.round(w * s);
						cv.height = Math.round(h * s);
						const x = cv.getContext("2d");
						x.fillStyle = "#FFFFFF";
						x.fillRect(0, 0, cv.width, cv.height);
						x.drawImage(img, 0, 0, cv.width, cv.height);
						res(cv.toDataURL("image/jpeg", .88));
					} catch (_) {
						res(null);
					}
					URL.revokeObjectURL(url);
				};
				img.onerror = () => {
					URL.revokeObjectURL(url);
					res(null);
				};
				img.src = url;
			} catch (_) {
				res(null);
			}
		});
	}
	async function mpImmaginiPdf$1() {
		const d = VS.visita?.dati || {}, out = [];
		for (const c of (VS.campi || []).filter((x) => x.t === "mappa")) {
			const v = d[c.k];
			if (mpTesto$1(c, v) == null && !(Array.isArray(v) && v.length)) continue;
			const viste = mpOggetto(c) ? [mpSet(c).viste[0][0]] : mpSet(c).viste.map((x) => x[0]).filter((vi) => v.some((p) => p.v === vi));
			for (const vi of viste) {
				const g = mpGeo(c, vi), url = await mpSvgInImmagine(mpDisegnoSvg(c, v, vi, {
					pdf: true,
					uid: "pdf" + c.k + vi
				}), g.cw, g.ch);
				if (url) out.push({
					titolo: c.e + (mpSet(c).viste.length > 1 ? " · " + mpNomeVista(c, vi) : ""),
					url,
					w: g.cw,
					h: g.ch,
					grande: mpOggetto(c)
				});
			}
		}
		return out;
	}
	// equo-app-src/src/ruoli/veterinario/moduli/index.js
	Object.assign(window, {
		renderHomeVet: renderHomeVet$1,
		vhGiornata,
		vhDetta,
		vhMeteo,
		vhVai,
		vhRigheHtml,
		vdPrepara,
		vetEtichettaGruppo,
		vetTestiAgenda,
		vetRenderClienti,
		vetFiltroClienti: vetFiltroClienti$1,
		vetVaiLettera,
		vmDecora,
		vmFiltra,
		vmNuovoMessaggio,
		galenoTestata,
		vaNomeLive,
		vaScegli: vaScegli$1,
		vaFile,
		vaSalva,
		vaAnnulla,
		vaImposta,
		vaCarica: vaCarica$1,
		vaApri,
		vaSezioneHtml: vaSezioneHtml$1,
		vaModifica,
		vaSalvaModifica,
		vaElimina,
		vaChiVede,
		vaTogli,
		vaFaiVedere,
		vaReset: vaReset$1,
		VA,
		vsMostraScheda,
		vrApri: vrApri$1,
		vrInvia,
		vrCondividi,
		vrCreaPdf,
		vrSezioni,
		vrParteScritta,
		vrDestinatari: vrDestinatari$1,
		VR,
		vdVisiteRecenti,
		vdSezioneHtml: vdSezioneHtml$1,
		vdContesto,
		vdDetta,
		vdDaHome: vdDaHome$1,
		vdApriDaEvento,
		vdDopoScheda: vdDopoScheda$1,
		vdReset: vdReset$1,
		VD,
		ptCarica: ptCarica$1,
		ptReset: ptReset$1,
		ptSezioneHtml: ptSezioneHtml$1,
		ptDisegna: ptDisegna$1,
		ptNuovaVoce,
		ptModificaVoce,
		ptCampo,
		ptVolte,
		ptOrario,
		ptTornaScheda,
		ptSalvaVoce,
		ptEliminaVoce,
		ptConferme,
		ptAvvia,
		ptAvviaDaReferto: ptAvviaDaReferto$1,
		ptCambiaStato,
		ptRigheReferto: ptRigheReferto$1,
		ptAttesaReferto: ptAttesaReferto$1,
		ptAggiungiVoci: ptAggiungiVoci$1,
		ptCaricaInCorso: ptCaricaInCorso$1,
		ptConteggi: ptConteggi$1,
		ptClientiInTerapia: ptClientiInTerapia$1,
		ptElenco,
		ptApriVisita,
		ptAttesaFino,
		ptPeriodo,
		PT: PT$1,
		mpCampoHtml: mpCampoHtml$1,
		mpInterno,
		mpRidisegna,
		mpAttiva,
		mpAttivaTutte: mpAttivaTutte$1,
		mpReset: mpReset$1,
		mpTesto: mpTesto$1,
		mpVista,
		mpTipo,
		mpZoom,
		mpElencoNomi,
		mpCerca,
		mpSeleziona,
		mpChiudi,
		mpNome,
		mpNomePrima,
		mpRinomina,
		mpGrado,
		mpTogli,
		mpCambiaTipo,
		mpNota,
		mpFoto,
		mpNuovo,
		mpDente,
		mpDenteVicino,
		mpZonaScegli,
		mpZonaSegno,
		mpNotaOggetto,
		mpOggettoSvuota,
		mpSelezionaZona,
		mpImmaginiPdf: mpImmaginiPdf$1,
		mpDisegnoSvg,
		mpNomeDente,
		MP,
		MP_PUNTI,
		MP_DENTI,
		MP_SET,
		vcSezioniHtml,
		vcCarica,
		vcDisegna,
		vcApriVisita,
		vcScegli,
		vcFile,
		vcImposta,
		vcAnnulla,
		vcSalva,
		vcNomeLive,
		VC,
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

