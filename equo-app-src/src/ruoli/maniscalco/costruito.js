
// === GENERATO da equo-app-src/strumenti/costruisci-moduli.mjs: NON modificare qui, modificare ruoli/maniscalco/moduli/ ===
(function() {
	// equo-app-src/src/ruoli/maniscalco/moduli/108-invito-qr.js
	function linkInvito(codice) {
		return "https://app.equohub.com/?invito=" + encodeURIComponent(String(codice || "").toUpperCase());
	}
	function clienteDaInvitare(c) {
		return c && !c.cliente_user_id && !c.centro_id && !isStruttura(c) && c.codice_invito ? c : null;
	}
	function etichettaPro() {
		return {
			maniscalco: "Maniscalco",
			veterinario: "Veterinario",
			istruttore: "Istruttore"
		}[currentUser?.vistaAttiva || currentUser?.ruolo] || "Professionista";
	}
	function moduliQr(testo) {
		if (typeof QRCode !== "function") return null;
		try {
			const div = document.createElement("div");
			new QRCode(div, {
				text: testo,
				width: 64,
				height: 64
			});
			const svg = div.querySelector("svg"), path = svg && svg.querySelector("path");
			if (!svg || !path) return null;
			const n = Number(String(svg.getAttribute("viewBox")).split(" ")[2]);
			const punti = [...String(path.getAttribute("d")).matchAll(/M(\d+),(\d+)/g)].map((m) => [Number(m[1]), Number(m[2])]);
			return n > 0 && punti.length ? {
				n,
				punti
			} : null;
		} catch (e) {
			return null;
		}
	}
	function disegnaQrPdf(doc, testo, x, y, lato) {
		const q = moduliQr(testo);
		if (!q) return false;
		doc.setFillColor(255, 255, 255);
		doc.rect(x - 1.5, y - 1.5, lato + 3, lato + 3, "F");
		doc.setFillColor(0, 0, 0);
		const m = lato / q.n;
		q.punti.forEach(([cx, cy]) => doc.rect(x + cx * m, y + cy * m, m + .02, m + .02, "F"));
		return true;
	}
	function riquadroInvitoPdf(doc, cli, y, W, M, nuovaPagina) {
		const c = clienteDaInvitare(cli);
		if (!c) return y;
		const q = moduliQr(linkInvito(c.codice_invito));
		if (!q) return y;
		const H = 46;
		if (y + H > 274) y = nuovaPagina();
		const verde = [
			20,
			49,
			42
		], oro = [
			201,
			143,
			46
		], grigio = [
			95,
			111,
			103
		];
		y += 4;
		doc.setFillColor(248, 246, 240);
		doc.setDrawColor(...oro);
		doc.setLineWidth(.5);
		doc.roundedRect(M, y, W - M * 2, H, 3, 3, "FD");
		const lato = 36, x0 = M + 5, y0 = y + 5, m = lato / q.n;
		doc.setFillColor(255, 255, 255);
		doc.rect(x0 - 1.5, y0 - 1.5, 39, 39, "F");
		doc.setFillColor(0, 0, 0);
		q.punti.forEach(([cx, cy]) => doc.rect(x0 + cx * m, y0 + cy * m, m + .02, m + .02, "F"));
		const xt = x0 + lato + 8, lw = W - M - 5 - xt;
		doc.setFont("helvetica", "bold");
		doc.setFontSize(14);
		doc.setTextColor(...verde);
		doc.text("Colleghiamoci su Equo", xt, y + 12);
		doc.setFont("helvetica", "normal");
		doc.setFontSize(10);
		doc.setTextColor(...grigio);
		const righe = doc.splitTextToSize("Inquadra il codice con la fotocamera del telefono: si apre Equo, crei il tuo account gratuito e siamo collegati. Vedrai lavori, scadenze e pagamenti dei tuoi cavalli.", lw);
		doc.text(righe, xt, y + 19);
		doc.setFont("helvetica", "bold");
		doc.setFontSize(10.5);
		doc.setTextColor(...oro);
		doc.text("Codice invito: " + c.codice_invito, xt, y + H - 6);
		return y + H + 4;
	}
	function condividiInvitoCliente() {
		const c = clienteDaInvitare((typeof clientiMascalcia !== "undefined" ? clientiMascalcia : []).find((x) => x.id === currentClienteId));
		if (!c) return;
		const testo = c.codice_invito + "\n" + linkInvito(c.codice_invito);
		if (navigator.share) {
			navigator.share({ text: testo }).catch(() => {});
			return;
		}
		window.open("https://wa.me/?text=" + encodeURIComponent(testo), "_blank");
	}
	// equo-app-src/src/ruoli/maniscalco/moduli/039-razza-menu-con-ricerca-stesso-codice-in.js
	var RAZZE_EQUO = [
		[
			"Avelignese",
			"AVE",
			1,
			["haflinger italiano"]
		],
		[
			"Bardigiano",
			"BAR",
			1,
			[]
		],
		[
			"Calabrese",
			"CAL",
			1,
			[]
		],
		[
			"Catria",
			"CTR",
			1,
			[]
		],
		[
			"Cavallo del Delta",
			"DEL",
			1,
			["delta"]
		],
		[
			"Cavallo del Ventasso",
			"VEN",
			1,
			["ventasso"]
		],
		[
			"Esperia",
			"ESP",
			1,
			["pony esperia"]
		],
		[
			"Cavallino della Giara",
			"GIA",
			1,
			["giara"]
		],
		[
			"Lipizzano",
			"LIP",
			1,
			["lipizzaner"]
		],
		[
			"Maremmano",
			"MAR",
			1,
			["maremma"]
		],
		[
			"Monterufolino",
			"MTR",
			1,
			[]
		],
		[
			"Murgese",
			"MUR",
			1,
			[]
		],
		[
			"Napoletano",
			"NAP",
			1,
			[]
		],
		[
			"Norico",
			"NOR",
			1,
			["noriker"]
		],
		[
			"Pentro",
			"PEN",
			1,
			[]
		],
		[
			"Persano",
			"PRS",
			1,
			[]
		],
		[
			"Salernitano",
			"SAL",
			1,
			[]
		],
		[
			"Sanfratellano",
			"SFT",
			1,
			["san fratellano"]
		],
		[
			"Sarcidano",
			"SRC",
			1,
			[]
		],
		[
			"Sella Italiano",
			"SIT",
			1,
			["sella italiana", "si"]
		],
		[
			"Purosangue Orientale Siciliano",
			"SIC",
			1,
			["siciliano", "orientale siciliano"]
		],
		[
			"Tolfetano",
			"TOL",
			1,
			[]
		],
		[
			"Trottatore Italiano",
			"TIT",
			1,
			["trottatore"]
		],
		[
			"Anglo-Arabo Sardo",
			"AAS",
			1,
			["anglo arabo sardo"]
		],
		[
			"Tiro Pesante Rapido",
			"TPR",
			1,
			["tpr"]
		],
		[
			"Purosangue Inglese",
			"PSI",
			0,
			[
				"psi",
				"purosangue",
				"thoroughbred",
				"inglese"
			]
		],
		[
			"Purosangue Arabo",
			"PSA",
			0,
			[
				"arabo",
				"psa",
				"arabian"
			]
		],
		[
			"Anglo-Arabo",
			"AAR",
			0,
			["anglo arabo"]
		],
		[
			"Shagya",
			"SHA",
			0,
			["arabo shagya"]
		],
		[
			"Akhal-Teke",
			"AKT",
			0,
			["akhal teke"]
		],
		[
			"Barbero",
			"BRB",
			0,
			["barbo"]
		],
		[
			"Standardbred",
			"STB",
			0,
			["trottatore americano"]
		],
		[
			"Trottatore Francese",
			"TFR",
			0,
			["trotteur francais"]
		],
		[
			"Orlov",
			"ORL",
			0,
			["trottatore russo"]
		],
		[
			"Hannover",
			"HAN",
			0,
			["hannoveraner", "annover"]
		],
		[
			"Holsteiner",
			"HOL",
			0,
			["holstein"]
		],
		[
			"Oldenburg",
			"OLD",
			0,
			["oldenburger"]
		],
		[
			"Westfalen",
			"WES",
			0,
			["westfalico"]
		],
		[
			"Trakehner",
			"TRK",
			0,
			["trakener"]
		],
		[
			"Hessen",
			"HES",
			0,
			[]
		],
		[
			"Brandenburg",
			"BRA",
			0,
			[]
		],
		[
			"Mecklenburg",
			"MEC",
			0,
			[]
		],
		[
			"Württemberg",
			"WUR",
			0,
			["wurttemberg"]
		],
		[
			"Bayerisches Warmblut",
			"BAY",
			0,
			["bavarese"]
		],
		[
			"Zangersheide",
			"ZAN",
			0,
			[]
		],
		[
			"KWPN",
			"KWP",
			0,
			[
				"sella olandese",
				"dutch warmblood",
				"olandese"
			]
		],
		[
			"BWP",
			"BWP",
			0,
			["sella belga"]
		],
		[
			"Selle Français",
			"SFR",
			0,
			["sella francese", "selle francais"]
		],
		[
			"Sella Svedese",
			"SWB",
			0,
			["swb"]
		],
		[
			"Sella Danese",
			"DWB",
			0,
			["dwb"]
		],
		[
			"Irish Sport Horse",
			"ISH",
			0,
			["irlandese"]
		],
		[
			"Irish Draught",
			"IRD",
			0,
			[]
		],
		[
			"Wielkopolski",
			"WIE",
			0,
			[]
		],
		[
			"Małopolski",
			"MAL",
			0,
			["malopolski"]
		],
		[
			"Kisbéri",
			"KIS",
			0,
			["kisberi"]
		],
		[
			"Nonius",
			"NON",
			0,
			[]
		],
		[
			"Furioso-North Star",
			"FUR",
			0,
			["furioso"]
		],
		[
			"Lusitano",
			"LUS",
			0,
			[]
		],
		[
			"PRE (Pura Raza Española)",
			"PRE",
			0,
			[
				"andaluso",
				"pura raza espanola",
				"spagnolo"
			]
		],
		[
			"Hispano-Arabo",
			"HIS",
			0,
			[]
		],
		[
			"Frisone",
			"FRI",
			0,
			["friesian"]
		],
		[
			"Gelderlander",
			"GEL",
			0,
			[]
		],
		[
			"Groninger",
			"GRO",
			0,
			[]
		],
		[
			"Kladruber",
			"KLA",
			0,
			[]
		],
		[
			"Cleveland Bay",
			"CLE",
			0,
			[]
		],
		[
			"Hackney",
			"HAC",
			0,
			[]
		],
		[
			"Quarter Horse",
			"QTR",
			0,
			["quarter", "qh"]
		],
		[
			"Paint Horse",
			"PNT",
			0,
			["paint"]
		],
		[
			"Appaloosa",
			"APP",
			0,
			[]
		],
		[
			"Mustang",
			"MUS",
			0,
			[]
		],
		[
			"Morgan",
			"MOR",
			0,
			[]
		],
		[
			"Tennessee Walking Horse",
			"TWH",
			0,
			[]
		],
		[
			"American Saddlebred",
			"ASB",
			0,
			["saddlebred"]
		],
		[
			"Missouri Fox Trotter",
			"MFT",
			0,
			[]
		],
		[
			"Rocky Mountain Horse",
			"RMH",
			0,
			[]
		],
		[
			"Palomino",
			"PAL",
			0,
			[]
		],
		[
			"Buckskin",
			"BUC",
			0,
			[]
		],
		[
			"Pinto",
			"PIN",
			0,
			[]
		],
		[
			"Criollo",
			"CRI",
			0,
			[]
		],
		[
			"Paso Fino",
			"PSF",
			0,
			[]
		],
		[
			"Paso Peruviano",
			"PSP",
			0,
			[]
		],
		[
			"Mangalarga Marchador",
			"MNG",
			0,
			["mangalarga"]
		],
		[
			"Campolina",
			"CMP",
			0,
			[]
		],
		[
			"Azteca",
			"AZT",
			0,
			[]
		],
		[
			"Bretone",
			"BRE",
			0,
			[]
		],
		[
			"Percheron",
			"PER",
			0,
			[]
		],
		[
			"Ardennese",
			"ARD",
			0,
			["ardennes"]
		],
		[
			"Comtois",
			"CMT",
			0,
			[]
		],
		[
			"Boulonnais",
			"BOU",
			0,
			[]
		],
		[
			"Belga da tiro",
			"BEL",
			0,
			["brabante"]
		],
		[
			"Clydesdale",
			"CLY",
			0,
			[]
		],
		[
			"Shire",
			"SHI",
			0,
			[]
		],
		[
			"Suffolk Punch",
			"SUF",
			0,
			["suffolk"]
		],
		[
			"Schwarzwälder Fuchs",
			"SWF",
			0,
			["schwarzwalder"]
		],
		[
			"Freiberger",
			"FRB",
			0,
			["franches-montagnes", "franches montagnes"]
		],
		[
			"Fjord",
			"FJO",
			0,
			["fiordo", "fjord norvegese"]
		],
		[
			"Döle",
			"DOL",
			0,
			["dole"]
		],
		[
			"Jutland",
			"JUT",
			0,
			[]
		],
		[
			"Vladimir",
			"VLA",
			0,
			[]
		],
		[
			"Shetland",
			"SHE",
			0,
			[]
		],
		[
			"Welsh",
			"WEL",
			0,
			["welsh pony", "welsh cob"]
		],
		[
			"Connemara",
			"CON",
			0,
			[]
		],
		[
			"New Forest",
			"NFO",
			0,
			[]
		],
		[
			"Dartmoor",
			"DAR",
			0,
			[]
		],
		[
			"Exmoor",
			"EXM",
			0,
			[]
		],
		[
			"Highland",
			"HIG",
			0,
			[]
		],
		[
			"Fell",
			"FEL",
			0,
			[]
		],
		[
			"Dales",
			"DAL",
			0,
			[]
		],
		[
			"Eriskay",
			"ERI",
			0,
			[]
		],
		[
			"Haflinger",
			"HAF",
			0,
			["avelignese haflinger"]
		],
		[
			"Islandese",
			"ISL",
			0,
			["icelandic"]
		],
		[
			"Pony Tedesco da Sella",
			"DRP",
			0,
			["deutsches reitpony"]
		],
		[
			"Pony Olandese",
			"PON",
			0,
			[]
		],
		[
			"Pony Francese da Sella",
			"PFS",
			0,
			["poney francais de selle"]
		],
		[
			"Falabella",
			"FAL",
			0,
			[]
		],
		[
			"Miniature Horse",
			"MIN",
			0,
			["cavallo miniatura", "mini horse"]
		],
		[
			"Pony Americano",
			"PAM",
			0,
			[]
		],
		[
			"Pony of the Americas",
			"POA",
			0,
			["poa"]
		],
		[
			"Bosniaco",
			"BOS",
			0,
			[]
		],
		[
			"Huzul",
			"HUZ",
			0,
			["hucul"]
		],
		[
			"Konik",
			"KON",
			0,
			[]
		],
		[
			"Landais",
			"LAN",
			0,
			[]
		],
		[
			"Pottok",
			"POT",
			0,
			[]
		],
		[
			"Caspio",
			"CAS",
			0,
			[]
		],
		[
			"Berbero",
			"BER",
			0,
			["barb"]
		],
		[
			"Arabo-Berbero",
			"ABB",
			0,
			["arabo berbero"]
		],
		[
			"Turkmeno",
			"TUR",
			0,
			[]
		],
		[
			"Marwari",
			"MRW",
			0,
			[]
		],
		[
			"Kathiawari",
			"KAT",
			0,
			[]
		],
		[
			"Mongolo",
			"MNL",
			0,
			[]
		],
		[
			"Przewalski",
			"PRZ",
			0,
			[]
		],
		[
			"Yakuto",
			"YAK",
			0,
			[]
		],
		[
			"Don",
			"DON",
			0,
			[]
		],
		[
			"Budyonny",
			"BUD",
			0,
			["budenny"]
		],
		[
			"Kabardino",
			"KAB",
			0,
			[]
		],
		[
			"Karabakh",
			"KRB",
			0,
			[]
		],
		[
			"Lokai",
			"LOK",
			0,
			[]
		],
		[
			"Kustanai",
			"KUS",
			0,
			[]
		],
		[
			"Waler",
			"WAL",
			0,
			[]
		],
		[
			"Brumby",
			"BRU",
			0,
			[]
		],
		[
			"Australian Stock Horse",
			"ASH",
			0,
			[]
		],
		[
			"Kiger Mustang",
			"KIG",
			0,
			[]
		],
		[
			"Camargue",
			"CAM",
			0,
			[]
		],
		[
			"Merens",
			"MER",
			0,
			["merens"]
		],
		[
			"Henson",
			"HEN",
			0,
			[]
		],
		[
			"Auxois",
			"AUX",
			0,
			[]
		],
		[
			"Poitevin",
			"POI",
			0,
			[]
		],
		[
			"Sorraia",
			"SOR",
			0,
			[]
		],
		[
			"Garrano",
			"GAR",
			0,
			[]
		],
		[
			"Asturcón",
			"AST",
			0,
			["asturcon"]
		],
		[
			"Losino",
			"LOS",
			0,
			[]
		],
		[
			"Marismeño",
			"MRS",
			0,
			["marismeno"]
		],
		[
			"Meticcio / Incrocio",
			"MET",
			0,
			[
				"meticcio",
				"incrocio",
				"mezzosangue"
			]
		],
		[
			"Sella (razza non indicata)",
			"SEL",
			0,
			["sella", "cavallo da sella"]
		],
		[
			"Pony (razza non indicata)",
			"PNY",
			0,
			["pony"]
		]
	].map(([nome, sigla, italiana, alias]) => ({
		nome,
		sigla,
		italiana: !!italiana,
		alias
	}));
	var RAZZE_DIFFUSE = [
		"PSI",
		"PSA",
		"SIT",
		"MAR",
		"QTR",
		"HAF",
		"AVE",
		"TIT",
		"TFR",
		"AAR",
		"SFR",
		"KWP",
		"HAN",
		"HOL",
		"OLD",
		"PRE",
		"LUS",
		"FRI",
		"APP",
		"PNT",
		"SHE",
		"WEL",
		"MUR",
		"BAR",
		"MET",
		"SEL",
		"PNY"
	];
	var RAZZE_FISSE = [
		"Meticcio / Incrocio",
		"Sella (razza non indicata)",
		"Pony (razza non indicata)"
	];
	var razzeCaricate = false;
	async function caricaRazzeEquo() {
		if (razzeCaricate || typeof DEMO_MODE === "undefined" || DEMO_MODE || typeof sb === "undefined") return;
		razzeCaricate = true;
		try {
			const { data } = await sb.from("equo_razze").select("nome, sigla, italiana, alias, ordine").order("ordine");
			if (data && data.length) RAZZE_EQUO = data.map((r) => ({
				nome: r.nome,
				sigla: r.sigla,
				italiana: r.italiana,
				alias: r.alias || []
			}));
		} catch (e) {
			razzeCaricate = false;
		}
	}
	function razzaNorm(t) {
		return String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ł/g, "l").replace(/Ł/g, "L").toLowerCase().replace(/[^a-z0-9]/g, "");
	}
	function razzaTrova(testo) {
		const n = razzaNorm(testo);
		if (!n) return null;
		return RAZZE_EQUO.find((r) => razzaNorm(r.nome) === n || (r.alias || []).some((a) => razzaNorm(a) === n)) || null;
	}
	function razzaCerca(testo) {
		const n = razzaNorm(testo);
		if (!n) return RAZZE_EQUO.filter((r) => r.italiana).slice(0, 8);
		const parole = String(testo).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").split(/[^a-z0-9]+/).filter(Boolean);
		const punteggio = (r) => {
			const nome = razzaNorm(r.nome), w = r.nome.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").split(/[^a-z0-9]+/);
			if (nome.startsWith(n)) return 0;
			if (parole.every((p) => w.some((x) => x.startsWith(p)))) return 1;
			if (nome.includes(n)) return 2;
			if ((r.alias || []).some((a) => razzaNorm(a).startsWith(n))) return 3;
			if ((r.alias || []).some((a) => razzaNorm(a).includes(n))) return 4;
			return 9;
		};
		return RAZZE_EQUO.map((r, i) => ({
			r,
			p: punteggio(r),
			i
		})).filter((x) => x.p < 9).sort((a, b) => a.p - b.p || (RAZZE_DIFFUSE.indexOf(a.r.sigla) < 0) - (RAZZE_DIFFUSE.indexOf(b.r.sigla) < 0) || b.r.italiana - a.r.italiana || a.i - b.i).slice(0, 8).map((x) => x.r);
	}
	function razzaCampo(id) {
		const inp = document.getElementById(id);
		if (!inp || inp.dataset.razza) return;
		inp.dataset.razza = "1";
		inp.setAttribute("autocomplete", "off");
		const box = document.createElement("div");
		box.className = "rz-wrap";
		inp.parentNode.insertBefore(box, inp);
		box.appendChild(inp);
		const lista = document.createElement("div");
		lista.className = "rz-lista";
		box.appendChild(lista);
		const nota = document.createElement("div");
		nota.className = "rz-nota";
		box.appendChild(nota);
		const mostra = () => {
			caricaRazzeEquo();
			const t = inp.value.trim();
			const trov = razzaCerca(t);
			const fisse = RAZZE_FISSE.filter((f) => !trov.some((r) => r.nome === f)).map((nome) => ({
				nome,
				fissa: true
			}));
			lista.innerHTML = trov.map((r) => `<button type="button" data-v="${escapeHtml(r.nome)}"><span>${escapeHtml(r.nome)}</span><small>${escapeHtml(r.sigla)}</small></button>`).join("") + (trov.length ? "" : "<div class=\"rz-vuoto\">Nessuna razza trovata con «" + escapeHtml(t) + "»</div>") + "<div class=\"rz-sep\"></div>" + fisse.map((f) => `<button type="button" class="rz-fissa" data-v="${escapeHtml(f.nome)}">${escapeHtml(f.nome)}</button>`).join("") + (t.length >= 3 && !trov.length ? `<button type="button" class="rz-altra" data-altra="${escapeHtml(t)}">La mia razza non c'è: «${escapeHtml(t)}»</button>` : "");
			lista.classList.add("aperta");
		};
		const scegli = (valore, altra) => {
			inp.value = valore;
			inp.dataset.ok = "1";
			inp.dataset.altra = altra || "";
			lista.classList.remove("aperta");
			box.classList.remove("rz-errore");
			nota.textContent = altra ? "Razza fuori elenco: avvisiamo Equo per aggiungerla." : "";
			if (altra) razzaSegnala(altra);
		};
		inp.addEventListener("focus", mostra);
		inp.addEventListener("input", () => {
			inp.dataset.ok = "";
			inp.dataset.altra = "";
			nota.textContent = "";
			mostra();
		});
		lista.addEventListener("mousedown", (e) => e.preventDefault());
		lista.addEventListener("click", (e) => {
			const b = e.target.closest("button");
			if (!b) return;
			if (b.dataset.altra) scegli("Altra razza (" + b.dataset.altra + ")", b.dataset.altra);
			else scegli(b.dataset.v);
		});
		inp.addEventListener("blur", () => setTimeout(() => {
			lista.classList.remove("aperta");
			if (!inp.dataset.ok && inp.value.trim()) {
				const r = razzaTrova(inp.value);
				if (r) scegli(r.nome);
			}
		}, 120));
	}
	function razzaImposta(id, valore) {
		razzaCampo(id);
		const inp = document.getElementById(id);
		const r = razzaTrova(valore);
		inp.value = r ? r.nome : valore || "";
		inp.dataset.ok = r || !valore ? "1" : "";
		inp.dataset.iniziale = inp.value;
		inp.dataset.altra = "";
		inp.parentNode.classList.remove("rz-errore");
		inp.parentNode.querySelector(".rz-nota").textContent = "";
	}
	function razzaValore(id) {
		const inp = document.getElementById(id);
		const t = inp.value.trim();
		if (!t) return null;
		if (inp.dataset.ok === "1" || t === inp.dataset.iniziale) return t;
		const r = razzaTrova(t);
		if (r) {
			inp.value = r.nome;
			return r.nome;
		}
		inp.parentNode.classList.add("rz-errore");
		inp.parentNode.querySelector(".rz-nota").textContent = "Scegli la razza dall'elenco (oppure «La mia razza non c'è»).";
		inp.focus();
		return false;
	}
	var razzeSegnalate = /* @__PURE__ */ new Set();
	async function razzaSegnala(testo) {
		const k = razzaNorm(testo);
		if (razzeSegnalate.has(k) || typeof DEMO_MODE === "undefined" || DEMO_MODE || !currentUser) return;
		razzeSegnalate.add(k);
		try {
			await sb.from("ticket_assistenza").insert({
				user_id: currentUser.id,
				app: "app",
				categoria: "suggerimento",
				oggetto: "Nuova razza da aggiungere: " + testo.slice(0, 80),
				descrizione: "Un utente ha inserito una razza che non è nell'elenco Equo: «" + testo + "». Se è una razza vera, aggiungila alla tabella equo_razze con la sua sigla di 3 lettere: i cavalli con quella razza prenderanno la sigla al prossimo salvataggio.",
				email: currentUser.email || "gestione.equo@gmail.com"
			});
		} catch (e) {
			console.warn("razzaSegnala:", e);
		}
	}
	// equo-app-src/src/ruoli/maniscalco/moduli/051-modal-appuntamento-maniscalco-nuovo-modi.js
	var MISURE_FERRO = {
		italiana: [
			"1",
			"2",
			"3",
			"4",
			"5",
			"6",
			"7",
			"8",
			"9"
		],
		olandese: [
			"4x0",
			"3x0",
			"2x0",
			"0",
			"1",
			"2",
			"3",
			"4",
			"5"
		],
		tedesca: [
			"2x0",
			"0",
			"1",
			"2",
			"3",
			"4",
			"5",
			"6",
			"7"
		]
	};
	var MISURA_SISTEMA_LABEL = {
		italiana: "italiana",
		olandese: "olandese",
		tedesca: "tedesca"
	};
	function misuraNorm(n) {
		return n == null ? n : String(n).replace("/", "x");
	}
	var misuraScrollTimer = null;
	function isoLocale(d) {
		const p = (n) => String(n).padStart(2, "0");
		return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate());
	}
	function aggiungiGiorniIso(iso, giorni) {
		const [y, m, d] = iso.split("-").map(Number);
		return isoLocale(new Date(y, m - 1, d + giorni));
	}
	function misuraIdx(p) {
		return p === "ferro" ? misuraIndiceFerro : misuraIndiceCorrente;
	}
	function renderMisuraWheel(p = "intervento") {
		const sistema = document.getElementById(p + "-misura-sistema").value;
		const wheel = document.getElementById(p + "-misura-wheel");
		const cur = misuraIdx(p);
		wheel.innerHTML = MISURE_FERRO[sistema].map((v, i) => `<div class="misura-wheel-item${i === cur ? " sel" : ""}" data-i="${i}" onclick="selezionaMisura(${i}, true, '${p}')">${v}</div>`).join("");
		requestAnimationFrame(() => {
			wheel.scrollTop = cur * 44;
		});
		aggiornaEquivalenzeMisura(p);
		wheel.onscroll = () => {
			clearTimeout(misuraScrollTimer);
			misuraScrollTimer = setTimeout(() => {
				selezionaMisura(Math.max(0, Math.min(8, Math.round(wheel.scrollTop / 44))), false, p);
			}, 80);
		};
	}
	function selezionaMisura(i, scroll, p = "intervento") {
		if (p === "ferro") misuraIndiceFerro = i;
		else misuraIndiceCorrente = i;
		const wheel = document.getElementById(p + "-misura-wheel");
		wheel.querySelectorAll(".misura-wheel-item").forEach((el) => el.classList.toggle("sel", Number(el.dataset.i) === i));
		if (scroll) wheel.scrollTo({
			top: i * 44,
			behavior: "smooth"
		});
		aggiornaEquivalenzeMisura(p);
	}
	function aggiornaEquivalenzeMisura(p = "intervento") {
		const sistema = document.getElementById(p + "-misura-sistema").value;
		const altri = Object.keys(MISURE_FERRO).filter((k) => k !== sistema).map((k) => MISURA_SISTEMA_LABEL[k] + " " + MISURE_FERRO[k][misuraIdx(p)]);
		document.getElementById(p + "-misura-equivalenze").textContent = "Equivale a: " + altri.join(" · ");
	}
	function onMisuraSistemaChange(p = "intervento") {
		renderMisuraWheel(p);
	}
	function aggiornaGiaFatto() {
		const riga = document.getElementById("intervento-gia-fatto-row");
		if (!riga) return;
		const d = document.getElementById("intervento-data").value;
		if (document.getElementById("modal-add-intervento")?.classList.contains("int-lavoro-fatto")) {
			riga.style.display = "none";
			document.getElementById("intervento-gia-fatto").checked = true;
			return;
		}
		const vedi = !interventoInModifica && d === isoLocale(/* @__PURE__ */ new Date());
		riga.style.display = vedi ? "flex" : "none";
		if (!vedi) document.getElementById("intervento-gia-fatto").checked = false;
	}
	function misuraPredefinita(ripiego = "olandese") {
		return currentUser && MISURE_FERRO[currentUser.ferroSistema] ? currentUser.ferroSistema : ripiego;
	}
	// equo-app-src/src/ruoli/maniscalco/moduli/042-incassi-pro.js
	function premiumSoloProprietario() {
		return !!(currentUser && currentUser.piano === "premium" && currentUser.premiumLivello === "proprietario");
	}
	function isPremium() {
		if (!(currentUser && currentUser.piano === "premium")) return false;
		if (premiumSoloProprietario() && PRO_ROLES.includes(currentUser.vistaAttiva || currentUser.ruolo)) return false;
		return true;
	}
	// equo-app-src/src/ruoli/maniscalco/moduli/054-richieste-di-appuntamento-step-5d.js
	var richiesteCache = {};
	function formatDataBreve(iso) {
		if (!iso) return "";
		const [y, m, d] = String(iso).slice(0, 10).split("-").map(Number);
		return `${AG_GIORNI[(new Date(y, m - 1, d).getDay() + 6) % 7].toLowerCase()} ${d} ${AG_MESI[m - 1]}`;
	}
	function testoRichiesta(prefisso, i, nomeCavallo) {
		let tipo = TIPO_FERRATURA_LABELS[i.tipo_ferratura] || i.tipo_ferratura || "";
		if (i.tipo_ferratura === "altro" && i.tipo_altro) tipo = i.tipo_altro;
		return `${prefisso}: ${tipo}${nomeCavallo ? " per " + nomeCavallo : ""}, ${formatDataBreve(i.data_intervento)}${i.ora ? " ore " + String(i.ora).slice(0, 5) : ""}.${i.note ? " Note: " + i.note : ""}`;
	}
	async function renderRichiestePendenti() {
		const box = document.getElementById("ag-richieste");
		if (!box) return;
		const tutte = await DB.listRichiestePendenti();
		richiesteCache = {};
		tutte.forEach((r) => {
			richiesteCache[r.id] = r;
		});
		const visti = {};
		const lista = [];
		tutte.forEach((r) => {
			if (!r.gruppo_id) {
				lista.push(r);
				return;
			}
			if (visti[r.gruppo_id]) {
				visti[r.gruppo_id]._cavalli.push(agNomeCavallo(r));
				return;
			}
			visti[r.gruppo_id] = {
				...r,
				_cavalli: [agNomeCavallo(r)]
			};
			lista.push(visti[r.gruppo_id]);
		});
		if (!lista.length) {
			box.style.display = "none";
			box.innerHTML = "";
			return;
		}
		box.style.display = "block";
		box.innerHTML = `
    <div style="font-weight:800;font-size:14px;margin-bottom:4px">📅 ${lista.length === 1 ? "1 richiesta da confermare" : lista.length + " richieste da confermare"}</div>
    ${lista.map((r) => `
      <div class="rich-item">
        <div style="flex:1;min-width:0;cursor:pointer" onclick="vaiAllaDataAgenda('${r.data_intervento}')">
          <div style="font-size:13.5px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHtml(r.clienti_mascalcia?.nome || "")}${(r._cavalli ? r._cavalli.filter(Boolean).join(", ") : agNomeCavallo(r)) ? " · " + escapeHtml(r._cavalli ? r._cavalli.filter(Boolean).join(", ") : agNomeCavallo(r)) : ""}</div>
          <div class="muted" style="font-size:12px">${formatDataBreve(r.data_intervento)}${r.ora ? " · " + String(r.ora).slice(0, 5) : ""} · ${escapeHtml(agDescrizioneTipoPro(r))}${r.note ? " · " + escapeHtml(r.note) : ""}</div>
        </div>
        <button class="btn btn-outline btn-sm" onclick="rifiutaRichiesta('${r.id}')">Rifiuta</button>
        <button class="btn btn-primary btn-sm btn-conferma" onclick="accettaRichiesta('${r.id}')">Accetta</button>
      </div>`).join("")}`;
	}
	// equo-app-src/src/ruoli/maniscalco/moduli/086-indice-dei-cavalli-dei-clienti-professio.js
	var cavalliMieiIndice = {};
	var cavalliMieiLista = [];
	async function caricaCavalliMiei() {
		try {
			cavalliMieiLista = await DB.listCavalliMiei() || [];
			const idx = {};
			cavalliMieiLista.forEach((c) => {
				if (!c.cliente_mascalcia_id) return;
				(idx[c.cliente_mascalcia_id] = idx[c.cliente_mascalcia_id] || []).push(c.nome || "");
			});
			cavalliMieiIndice = idx;
		} catch (e) {
			console.warn("caricaCavalliMiei:", e);
		}
		return cavalliMieiLista;
	}
	function nomiCavalliCliente(c) {
		const da = cavalliMieiIndice[c.id] || [];
		const testo = typeof nomiCavalliDaTesto === "function" ? nomiCavalliDaTesto(c.nome_cavallo || "") : [];
		return [...new Set([...da, ...Array.isArray(testo) ? testo : []].map((n) => String(n || "").trim()).filter(Boolean))];
	}
	function paroleCercaCliente(c) {
		return [
			c.nome_cavallo,
			...nomiCavalliCliente(c),
			c.telefono,
			isStruttura(c) ? "struttura scuderia maneggio" : "proprietario"
		].filter(Boolean).join(" ");
	}
	// equo-app-src/src/ruoli/maniscalco/moduli/048-vista-completa-premium-previsionale-clie.js
	var INC_TIPI_CAVALLO = [
		"ferratura",
		"mezza_ferratura",
		"pareggio"
	];
	function ferriIntervento(i) {
		return Number(i.quantita_ferri) || (i.tipo_ferratura === "mezza_ferratura" ? 2 : 4);
	}
	function incFinestra(mesi, primo) {
		const oggi = isoLocale(/* @__PURE__ */ new Date());
		const d = /* @__PURE__ */ new Date();
		d.setMonth(d.getMonth() - mesi);
		let da = isoLocale(d);
		const tagliata = !!(primo && primo > da);
		if (tagliata) da = primo;
		return {
			da,
			a: oggi,
			giorni: Math.max(7, giorniTra(da, oggi) + 1),
			tagliata
		};
	}
	var incData = (iso) => (/* @__PURE__ */ new Date(iso + "T12:00")).toLocaleDateString("it-IT", {
		day: "numeric",
		month: "short"
	});
	var incNum = (n, dec = 0) => (Number(n) || 0).toLocaleString("it-IT", {
		maximumFractionDigits: dec,
		minimumFractionDigits: 0
	});
	function incPct(v, prima) {
		if (!prima) return "";
		const d = Math.round((v - prima) / prima * 100);
		return `<span class="${d >= 0 ? "su" : "giu"}">${d >= 0 ? "▲" : "▼"} ${Math.abs(d)}%</span>`;
	}
	function statFinte() {
		const k = (l, v) => `<div class="k"><div class="l">${l}</div><div class="v">${v}</div></div>`;
		return `<div class="card inc-card"><div class="inc-tit"><span>Previsionale</span></div><div class="inc-stat-kpis"><div class="k grande"><div class="l">Incasso in arrivo</div><div class="v">2.380 €</div></div></div></div>
    <div class="card inc-card"><div class="inc-tit"><span>Medie operative</span></div><div class="inc-stat-kpis">${k("Cavalli a settimana", "14,5")}${k("Guadagno al mese", "6.090 €")}</div></div>
    <div class="card inc-card"><div class="inc-tit"><span>Consumo ferri</span></div><div class="inc-stat-kpis">${k("A settimana", "38")}${k("Al mese", "164")}</div></div>`;
	}
	async function renderIncassiCompleta() {
		const box = document.getElementById("inc-stat");
		if (!box) return;
		const mesiBox = document.getElementById("inc-mesi");
		if (!isPremium()) {
			mesiBox.innerHTML = "";
			box.innerHTML = `<div class="inc-bloccata"><div class="sotto" aria-hidden="true">${statFinte()}</div>
      <div class="lucchetto"><div style="font-size:30px">📊</div><h3>Statistiche complete</h3><p>Con Premium vedi il tuo lavoro come un'azienda:</p>
        <ul><li>quanto incasserai con gli appuntamenti in agenda</li><li>prezzo medio per cliente</li><li>cavalli e guadagno medi a settimana e al mese</li><li>quanti ferri usi e quanti comprarne</li></ul>
        <button class="btn btn-primary" style="width:100%" onclick="togglePiano()">Passa a Premium</button>
        <button class="btn btn-outline" style="width:100%;margin-top:6px" onclick="sceltaVistaIncassi('semplice')">Torna alla vista Semplice</button></div></div>`;
			return;
		}
		mesiBox.innerHTML = [
			3,
			6,
			12
		].map((n) => `<button class="${incMesi === n ? "on" : ""}" onclick="sceltaMesiIncassi(${n})">${n} mesi</button>`).join("");
		try {
			incCavalli = await DB.listCavalliMiei();
		} catch (e) {
			incCavalli = [];
		}
		const oggi = isoLocale(/* @__PURE__ */ new Date());
		const fatti = incTutti.filter((i) => i.stato === "fatto");
		const primo = fatti.reduce((m, i) => !m || i.data_intervento < m ? i.data_intervento : m, null);
		const W = incFinestra(incMesi, primo);
		const settimane = W.giorni / 7, mesiEff = W.giorni / 30.44;
		const inFin = fatti.filter((i) => i.data_intervento >= W.da && i.data_intervento <= W.a);
		const nomeFin = W.tagliata ? `dal ${incData(W.da)}` : `ultimi ${incMesi} mesi`;
		const fineOr = aggiungiGiorniIso(oggi, 27);
		const futuri = incTutti.filter((i) => i.stato === "programmato" && i.stato_pagamento !== "saldato" && i.data_intervento >= oggi);
		const nelleSett = futuri.filter((i) => i.data_intervento <= fineOr);
		const conPrezzo = nelleSett.filter((i) => Number(i.importo) > 0), senzaPrezzo = nelleSett.filter((i) => !(Number(i.importo) > 0));
		const piuAvanti = incSomma(futuri.filter((i) => i.data_intervento > fineOr && Number(i.importo) > 0));
		const settBarre = [
			0,
			1,
			2,
			3
		].map((w) => {
			const da = aggiungiGiorniIso(oggi, w * 7), a = aggiungiGiorniIso(oggi, w * 7 + 6);
			return [Number(da.slice(8)) + "–" + incData(a), incSomma(conPrezzo.filter((i) => i.data_intervento >= da && i.data_intervento <= a))];
		});
		const maxB = Math.max(1, ...settBarre.map((b) => b[1]));
		const fmtK = (v) => v >= 1e3 ? (v / 1e3).toFixed(1).replace(".", ",").replace(",0", "") + "k" : String(Math.round(v));
		const prev = `<div class="card inc-card"><div class="inc-tit"><span>Previsionale</span><em>prossime 4 settimane</em></div>
    <div class="inc-stat-kpis"><div class="k grande"><div class="l">Incasso in arrivo</div><div class="v">${euroTondo(incSomma(conPrezzo))}</div>
      <div class="d">${conPrezzo.length} ${conPrezzo.length === 1 ? "appuntamento" : "appuntamenti"} con prezzo${piuAvanti ? ` · più avanti in agenda altri ${euroTondo(piuAvanti)}` : ""}</div></div></div>
    <div class="inc-grafico" style="height:96px;margin-top:8px">${settBarre.map(([l, v]) => `<div class="c" title="${escapeHtml(l)}: ${euroTondo(v)}"><small>${v ? fmtK(v) : ""}</small><div class="b${v ? "" : " zero"}" style="height:${Math.max(2, Math.round(v / maxB * 62))}px"></div><small>${escapeHtml(l)}</small></div>`).join("")}</div>
    ${senzaPrezzo.length ? `<div class="inc-avviso">⚠️ <span><b>${senzaPrezzo.length} ${senzaPrezzo.length === 1 ? "appuntamento senza prezzo" : "appuntamenti senza prezzo"}</b><br>non ${senzaPrezzo.length === 1 ? "è contato" : "sono contati"}</span><button class="btn btn-outline btn-sm" onclick="aggiungiPrezziMancanti()">Aggiungi</button></div>` : ""}</div>`;
		const attivi = clientiAttivi();
		const idAttivi = new Set(attivi.map((c) => c.id));
		const cavAttivi = incCavalli.filter((c) => idAttivi.has(c.cliente_mascalcia_id));
		const media = (l) => {
			const v = l.filter((i) => Number(i.importo) > 0);
			return v.length ? incSomma(v) / v.length : null;
		};
		const righeCli = attivi.map((c) => {
			const suoi = inFin.filter((i) => i.cliente_mascalcia_id === c.id);
			return {
				id: c.id,
				nome: c.nome,
				scuderia: c.tipo_cliente === "struttura" || !!c.centro_id,
				cav: cavAttivi.filter((x) => x.cliente_mascalcia_id === c.id).length,
				fer: media(suoi.filter((i) => i.tipo_ferratura === "ferratura")),
				par: media(suoi.filter((i) => i.tipo_ferratura === "pareggio")),
				lavori: suoi.length
			};
		}).filter((r) => r.cav || r.lavori).sort((a, b) => b.cav - a.cav || b.lavori - a.lavori || a.nome.localeCompare(b.nome));
		const visCli = incCliTutti ? righeCli : righeCli.slice(0, 8);
		const mF = media(inFin.filter((i) => i.tipo_ferratura === "ferratura")), mM = media(inFin.filter((i) => i.tipo_ferratura === "mezza_ferratura")), mP = media(inFin.filter((i) => i.tipo_ferratura === "pareggio"));
		const medieTot = [
			mF != null ? `ferratura <b>${euroTondo(Math.round(mF))}</b>` : "",
			mM != null ? `mezza <b>${euroTondo(Math.round(mM))}</b>` : "",
			mP != null ? `pareggio <b>${euroTondo(Math.round(mP))}</b>` : ""
		].filter(Boolean).join(" · ");
		const cli = `<div class="card inc-card"><div class="inc-tit"><span>Clienti e prezzi</span><em>${cavAttivi.length} ${cavAttivi.length === 1 ? "cavallo" : "cavalli"} · ${attivi.length} ${attivi.length === 1 ? "cliente" : "clienti"}</em></div>
    ${righeCli.length ? `<table class="inc-tab"><tr><th>Cliente</th><th>Cavalli</th><th>Ferratura media</th></tr>
      ${visCli.map((r) => `<tr class="cli" onclick="showPage('pro-clienti'); openClienteDetail('${r.id}')"><td>${escapeHtml(r.nome)}${r.scuderia ? "<small>scuderia</small>" : r.par != null && r.fer == null ? `<small>pareggio ${euroTondo(Math.round(r.par))}</small>` : ""}</td><td>${r.cav}</td><td>${r.fer != null ? euroTondo(Math.round(r.fer)) : "—"}</td></tr>`).join("")}</table>
      ${righeCli.length > visCli.length ? `<button class="btn btn-ghost btn-sm" style="width:100%;margin-top:6px" onclick="incCliTutti=true;renderIncassiCompleta()">Mostra tutti (${righeCli.length})</button>` : ""}` : "<div class=\"muted\" style=\"font-size:13px\">Ancora nessun cliente con cavalli.</div>"}
    <div class="inc-nota">${medieTot ? `Media di tutti i clienti (${escapeHtml(nomeFin)}): ${medieTot}. ` : ""}Conta solo i lavori fatti con il prezzo. Tocca un cliente per aprire la scheda.</div></div>`;
		const cavLav = inFin.filter((i) => INC_TIPI_CAVALLO.includes(i.tipo_ferratura));
		const valore = incSomma(inFin), conImp = inFin.filter((i) => Number(i.importo) > 0);
		const pDa = aggiungiGiorniIso(W.da, -W.giorni), pA = aggiungiGiorniIso(W.da, -1);
		const primaFin = fatti.filter((i) => i.data_intervento >= pDa && i.data_intervento <= pA);
		const cavPrima = primaFin.filter((i) => INC_TIPI_CAVALLO.includes(i.tipo_ferratura)).length, valPrima = incSomma(primaFin);
		const kk = (l, v, d) => `<div class="k"><div class="l">${l}</div><div class="v">${v}</div><div class="d">${d}</div></div>`;
		const med = `<div class="card inc-card"><div class="inc-tit"><span>Medie operative</span><em>${escapeHtml(nomeFin)}</em></div>
    ${cavLav.length || valore ? `<div class="inc-stat-kpis">
      ${kk("Cavalli a settimana", incNum(cavLav.length / settimane, 1), "ferrati e pareggiati")}
      ${kk("Cavalli al mese", incNum(cavLav.length / mesiEff), incPct(cavLav.length, cavPrima) ? incPct(cavLav.length, cavPrima) + " sul periodo prima" : `${cavLav.length} in tutto`)}
      ${kk("Guadagno a settimana", euroTondo(Math.round(valore / settimane)), "valore dei lavori fatti")}
      ${kk("Guadagno al mese", euroTondo(Math.round(valore / mesiEff)), [conImp.length ? euroTondo(Math.round(valore / conImp.length)) + " a lavoro" : "", incPct(valore, valPrima)].filter(Boolean).join(" · "))}
    </div>` : "<div class=\"muted\" style=\"font-size:13px\">Nessun lavoro fatto nel periodo.</div>"}
    ${W.tagliata ? `<div class="inc-nota">Medie calcolate dal ${incData(W.da)}, il primo lavoro registrato in Equo.</div>` : ""}</div>`;
		const conFerri = inFin.filter((i) => i.tipo_ferratura === "ferratura" || i.tipo_ferratura === "mezza_ferratura");
		let nuovi = 0, rimessi = 0;
		const perMisura = /* @__PURE__ */ new Map();
		conFerri.forEach((i) => {
			const n = ferriIntervento(i);
			if (i.ferri_nuovi === false) {
				rimessi += n;
				return;
			}
			nuovi += n;
			const k = i.numero_ferro ? "n. " + i.numero_ferro + (i.misura_sistema ? " " + (MISURA_SISTEMA_LABEL[i.misura_sistema] || "") : "") : "?";
			perMisura.set(k, (perMisura.get(k) || 0) + n);
		});
		const quotaNuovi = nuovi + rimessi ? nuovi / (nuovi + rimessi) : 1;
		const inAgenda = futuri.filter((i) => i.data_intervento <= aggiungiGiorniIso(oggi, 29) && (i.tipo_ferratura === "ferratura" || i.tipo_ferratura === "mezza_ferratura")).reduce((t, i) => t + ferriIntervento(i), 0);
		const agendaNuovi = Math.round(inAgenda * quotaNuovi), mediaMese = Math.round(nuovi / mesiEff);
		const stima = Math.max(agendaNuovi, mediaMese);
		const misure = [...perMisura.entries()].map(([k, v]) => [k, v / mesiEff]).sort((a, b) => (a[0] === "?") - (b[0] === "?") || b[1] - a[1]).slice(0, 10);
		const maxM = Math.max(1, ...misure.map((m) => m[1]));
		const ferri = `<div class="card inc-card"><div class="inc-tit"><span>Consumo ferri</span><em>${escapeHtml(nomeFin)}</em></div>
    ${nuovi + rimessi ? `<div class="inc-stat-kpis">
      ${kk("Ferri nuovi a settimana", incNum(nuovi / settimane), `rimessi: ${incNum(rimessi / settimane)}`)}
      ${kk("Ferri nuovi al mese", incNum(nuovi / mesiEff), `${Math.round(quotaNuovi * 100)}% nuovi · ${100 - Math.round(quotaNuovi * 100)}% rimessi`)}
      <div class="k grande"><div class="l">Te ne servono nel prossimo mese</div><div class="v">≈ ${incNum(stima)} ferri</div>
        <div class="d">in agenda: ${incNum(agendaNuovi)} · tua media: ${incNum(mediaMese)} al mese</div></div>
    </div>
    ${misure.length ? `<div class="inc-tit" style="margin-top:12px"><span>Per misura · al mese</span></div><div class="inc-misure">${misure.map(([k, v]) => `<div class="inc-misura"><span>${escapeHtml(k)}</span><div class="f"><i style="width:${Math.round(v / maxM * 100)}%${k === "?" ? ";opacity:.5" : ""}"></i></div><b>${incNum(v)}</b></div>`).join("")}</div>` : ""}
    <div class="inc-nota">${perMisura.has("?") ? "«?» = ferrature senza misura del ferro: aggiungila nella scheda del cavallo. " : ""}Conta i ferri degli appuntamenti fatti: ferratura completa 4, mezza 2, o il numero indicato. Questi dati li vedi solo tu.</div>` : "<div class=\"muted\" style=\"font-size:13px\">Nessuna ferratura fatta nel periodo.</div>"}</div>`;
		box.innerHTML = prev + cli + med + ferri;
	}
	// equo-app-src/src/ruoli/maniscalco/moduli/091-conferma-a-scorrimento-niente-tocco-sing.js
	function mlSlider(testo, fn, tipo) {
		return `<div class="ml-slider ${tipo}" data-fn="${fn}"><button type="button" class="ml-pom" aria-label="${escapeHtml(testo)}">${tipo === "verde" ? ML_IC.check : ML_IC.dx}</button><b>${escapeHtml(testo)}</b></div>`;
	}
	function mlAttivaSlider(root) {
		root.querySelectorAll(".ml-slider").forEach((sl) => {
			const pom = sl.querySelector(".ml-pom");
			let x0 = null, dx = 0;
			const max = () => sl.clientWidth - pom.offsetWidth - 16;
			const fine = (ok) => {
				x0 = null;
				if (ok) {
					pom.style.transform = `translateX(${max()}px)`;
					const f = window[sl.dataset.fn];
					setTimeout(() => f && f(), 120);
				} else {
					pom.style.transition = "transform .25s";
					pom.style.transform = "";
					setTimeout(() => pom.style.transition = "", 260);
				}
			};
			pom.addEventListener("pointerdown", (ev) => {
				x0 = ev.clientX;
				dx = 0;
				pom.setPointerCapture(ev.pointerId);
			});
			pom.addEventListener("pointermove", (ev) => {
				if (x0 == null) return;
				dx = Math.max(0, Math.min(max(), ev.clientX - x0));
				pom.style.transform = `translateX(${dx}px)`;
			});
			pom.addEventListener("pointerup", () => {
				if (x0 != null) fine(dx > max() * .8);
			});
			pom.addEventListener("pointercancel", () => fine(false));
			pom.addEventListener("keydown", (ev) => {
				if (ev.key === "Enter") {
					ev.preventDefault();
					fine(true);
				}
			});
		});
	}
	// equo-app-src/src/ruoli/maniscalco/moduli/093-problema-su-un-piede.js
	function mlApriProblema(evId) {
		const e = mlEventi.find((x) => x.id === evId);
		if (!e) return;
		const cav = mlCavId(e);
		if (!cav) {
			showToast("Questo appuntamento non ha un cavallo: aprilo in agenda per assegnarlo.");
			return;
		}
		mlProb = {
			ev: evId,
			cav,
			passo: 1,
			piedi: [],
			voci: [],
			nota: "",
			foto: null,
			fotoUrl: null,
			ric: 14,
			avvisa: false,
			vet: false
		};
		mlRender();
	}
	function mlRenderProblema(el, testa) {
		const e = mlEventi.find((x) => x.id === mlProb.ev), r = mlRigaCavallo(e), inf = mlInfo[mlProb.cav] || { anno: [] };
		const volte = (k) => inf.anno.filter((p) => p.piede === k).length;
		if (mlProb.passo === 1) {
			const piede = ([k, t]) => {
				const sel = mlProb.piedi.includes(k), n = volte(k);
				return `<button type="button" class="ml-piede p-${k}${sel ? " sel" : ""}" onclick="mlPiede('${k}')">${ML_IC.ferro}<b>${t}</b><small>${sel ? "PROBLEMA" : "REGOLARE"}</small>${sel ? `<i class="ml-ok">${ML_IC.check}</i>` : ""}${n ? `<em>già ${n} ${n === 1 ? "volta" : "volte"} quest'anno</em>` : ""}</button>`;
			};
			const dove = mlProb.piedi.length === 1 ? " · " + mlNomePiede(mlProb.piedi[0]).replace("anteriore", "ant.").replace("posteriore", "post.").replace("sinistro", "sx").replace("destro", "dx") : "";
			el.innerHTML = testa("Segna un problema", ml.nome) + `<button class="ml-esci" onclick="mlProb=null;mlRender()" aria-label="Annulla">${ML_IC.x}</button><div class="ml-corpo"><div class="ml-cav"><span class="ml-av grande">${iniziale(r.nome)}</span><div><h3>${escapeHtml(r.nome)}</h3><p>${escapeHtml(agDescrizioneTipoPro(e))}</p></div></div>
        <div class="ml-piedi">${ML_PIEDI.map(piede).join("")}<div class="ml-dd">▲<br>DAVANTI<br><br><br>DIETRO<br>▼</div></div>
        <div class="ml-lab">Cosa è successo${escapeHtml(dove)}</div>
        <div class="ml-voci">${ML_VOCI.map(([v, ic]) => `<button type="button" class="${mlProb.voci.includes(v) ? "on" : ""}" onclick="mlVoce('${v}')">${ML_IC[ic]}${v.replace(/^./, (c) => c.toUpperCase())}</button>`).join("")}</div></div>` + (mlProb.piedi.length && mlProb.voci.length ? mlSlider("Avanti", "mlProbAvanti", "oro") : `<div class="ml-sugg">Tocca il piede e cosa è successo</div>`);
		} else {
			const piedi = mlProb.piedi.map(mlNomePiede).join(" e ");
			const prima = inf.anno.filter((p) => mlProb.piedi.includes(p.piede));
			const stor = prima.length ? `<b>Storico di ${mlProb.piedi.length > 1 ? "questi piedi" : "questo piede"}:</b> ${prima.length} ${prima.length === 1 ? "problema" : "problemi"} nell'ultimo anno (${prima.slice(0, 4).map((p) => formatDataBreve(String(p.creato_il).slice(0, 10)) + " " + (p.voci || []).join(", ")).join("; ")}).` : "<b>Storico:</b> è la prima volta che segni un problema qui.";
			const coll = clienteCollegatoEquo(e.cliente_mascalcia_id);
			el.innerHTML = testa(r.nome + " · " + mlProb.piedi.map(mlSigla).join(" "), mlProb.voci.join(" · ")) + `<button class="ml-esci" onclick="mlProb.passo=1;mlRender()" aria-label="Indietro">${ML_IC.indietro}</button><div class="ml-corpo"><div class="ml-lab">Se serve</div>
        <div class="ml-racc"><button type="button" class="${mlProb.foto ? "fatto" : ""}" onclick="document.getElementById('ml-foto').click()">${ML_IC.cam}Foto${mlProb.foto ? " ✓" : ""}</button>
          <button type="button" class="ham" onclick="mlHammer()">${ML_IC.hammer}Hammer</button></div>
        <input type="file" id="ml-foto" accept="image/*" capture="environment" hidden onchange="mlFoto(this)">
        ${mlProb.fotoUrl ? `<img class="ml-fotoprev" src="${mlProb.fotoUrl}" alt="">` : ""}
        <textarea class="ml-nota" rows="2" maxlength="300" placeholder="Nota (anche a voce: tocca il microfono della tastiera)" oninput="mlProb.nota=this.value">${escapeHtml(mlProb.nota)}</textarea>
        <div class="ml-stor">${stor}</div>
        <div class="ml-lab">E adesso</div>
        <div class="ml-ric">${ML_IC.cal}<span>Ricontrolla</span>${[
				0,
				7,
				14,
				30
			].map((g) => `<button type="button" class="${mlProb.ric === g ? "on" : ""}" onclick="mlProb.ric=${g};mlRender()">${g ? g + " gg" : "No"}</button>`).join("")}</div>
        ${coll ? `<button type="button" class="ml-tg${mlProb.avvisa ? " on" : ""}" onclick="mlProb.avvisa=!mlProb.avvisa;mlRender()">${ML_IC.chat}<span>Avvisa il proprietario</span><i></i></button>` : `<div class="ml-sugg piccolo">Il proprietario non usa Equo: l'avviso in chat non è possibile.</div>`}
        <button type="button" class="ml-tg${mlProb.vet ? " on" : ""}" onclick="mlProb.vet=!mlProb.vet;mlRender()">${ML_IC.alert}<span>Serve il veterinario</span><i></i></button>
        <div class="ml-sugg piccolo">Resta nello storico del ${escapeHtml(piedi)}. Il proprietario lo vede solo se lo avvisi.</div></div>` + mlSlider("Salva il problema", "mlSalvaProblema", "verde");
		}
		mlAttivaSlider(el);
	}
	function mlPiede(k) {
		const a = mlProb.piedi;
		const i = a.indexOf(k);
		if (i >= 0) a.splice(i, 1);
		else a.push(k);
		mlRender();
	}
	function mlVoce(v) {
		const a = mlProb.voci;
		const i = a.indexOf(v);
		if (i >= 0) a.splice(i, 1);
		else a.push(v);
		mlRender();
	}
	function mlProbAvanti() {
		mlProb.passo = 2;
		mlRender();
	}
	async function mlFoto(input) {
		const f = input.files && input.files[0];
		input.value = "";
		if (!f) return;
		try {
			mlProb.fotoUrl = await riduciImmagine(f);
			mlProb.foto = true;
		} catch (e) {
			showToast("Non riesco a leggere la foto, riprova.");
			return;
		}
		mlRender();
	}
	function mlHammer() {
		const e = mlEventi.find((x) => x.id === mlProb.ev), r = mlRigaCavallo(e), inf = mlInfo[mlProb.cav] || { anno: [] };
		const testo = `Problema appena visto su ${r.nome} (${agDescrizioneTipoPro(e)}), piede ${mlProb.piedi.map(mlNomePiede).join(" e ")}: ${mlProb.voci.join(", ")}${mlProb.nota ? ". Nota: " + mlProb.nota : ""}.` + (inf.anno.length ? ` Problemi dell'ultimo anno: ${inf.anno.map((p) => String(p.creato_il).slice(0, 10) + " " + mlNomePiede(p.piede) + " " + (p.voci || []).join(", ")).join("; ")}.` : "");
		openAiSheet().then(() => {
			hpContesto = {
				tipo: "cavallo",
				nome: r.nome,
				testo,
				cv: typeof cavalliMieiById !== "undefined" && cavalliMieiById[mlProb.cav] || {
					id: mlProb.cav,
					nome: r.nome
				},
				clienteId: e.cliente_mascalcia_id
			};
			const sb2 = document.getElementById("hp-btn-storico");
			if (sb2) sb2.hidden = false;
			const c = document.getElementById("hp-ctx");
			if (c) {
				c.hidden = false;
				document.getElementById("hp-ctx-nome").textContent = hpContesto.nome;
			}
			const i = document.getElementById("chat-input");
			if (i) i.value = `Cosa mi consigli per il ${mlProb.piedi.map(mlNomePiede).join(" e ")} di ${r.nome}?`;
			if (mlProb.fotoUrl) {
				aiAllegati = [{
					media_type: "image/jpeg",
					data: mlProb.fotoUrl.split(",")[1],
					anteprima: mlProb.fotoUrl,
					nome: "piede.jpg"
				}];
				renderAllegatiAi();
			}
		});
	}
	async function mlSalvaProblema() {
		const p = mlProb, e = mlEventi.find((x) => x.id === p.ev), r = mlRigaCavallo(e);
		const ric = p.ric ? aggiungiGiorniIso(mlOggi(), p.ric) : null;
		let fotoPath = null;
		try {
			if (p.fotoUrl && !DEMO_MODE) {
				const blob = await (await fetch(p.fotoUrl)).blob();
				fotoPath = `${currentUser.id}/piede-${Date.now().toString(36)}.jpg`;
				const up = await sb.storage.from("cavalli-allegati").upload(fotoPath, blob, { contentType: "image/jpeg" });
				if (up.error) {
					console.warn("foto problema:", up.error.message);
					fotoPath = null;
				}
			}
			if (!DEMO_MODE) for (const k of p.piedi) {
				const { error } = await sb.rpc("equo_segna_problema_piede", {
					p_cavallo: p.cav,
					p_piede: k,
					p_voci: p.voci,
					p_nota: p.nota || null,
					p_foto: fotoPath,
					p_ricontrolla: ric,
					p_avvisa: !!p.avvisa,
					p_vet: !!p.vet,
					p_intervento: e.id
				});
				if (error) {
					showToast(/does not exist|schema cache/.test(error.message || "") ? "Manca un aggiornamento del database: avvisa l'assistenza Equo." : "Non salvato: " + error.message);
					return;
				}
			}
			if (ric) {
				const { error } = await DB.insertInterventoMascalcia({
					cliente_mascalcia_id: e.cliente_mascalcia_id,
					cavallo_cliente_id: p.cav,
					horse_id: e.horse_id || null,
					tipo_ferratura: "altro",
					tipo_altro: "Ricontrollo " + p.piedi.map(mlNomePiede).join(" e ") + " · " + p.voci.join(", "),
					data_intervento: ric,
					stato: "programmato",
					note: p.nota || null
				});
				if (error) console.warn("ricontrollo:", error.message);
			}
			if (p.avvisa && clienteCollegatoEquo(e.cliente_mascalcia_id)) {
				const testo = `🔎 ${r.nome} · ${p.piedi.map(mlNomePiede).join(" e ")}: ${p.voci.join(", ")}.${p.nota ? " " + p.nota : ""}` + (ric ? ` Lo ricontrollo il ${formatDataBreve(ric)}.` : "") + (p.vet ? " Ti consiglio di sentire anche il veterinario." : "");
				await DB.insertMessaggioMascalcia({
					cliente_mascalcia_id: e.cliente_mascalcia_id,
					tipo: "testo",
					testo
				});
				if (fotoPath) await sb.rpc("equo_aggiungi_allegato", {
					p_vista: "maniscalco",
					p_id: p.cav,
					p_nome: `Problema ${p.piedi.map(mlSigla).join("-")} ${mlOggi()}.jpg`,
					p_path: fotoPath,
					p_mime: "image/jpeg",
					p_byte: null
				}).then(() => {}, () => {});
			}
		} catch (err) {
			console.error("problema piede:", err);
			showToast("Non salvato, riprova.");
			return;
		}
		ml.problemi = (ml.problemi || []).concat(p.piedi.map((k) => ({
			ev: p.ev,
			cav: p.cav,
			piede: k
		})));
		const inf = mlInfo[p.cav];
		if (inf) p.piedi.forEach((k) => inf.anno.unshift({
			piede: k,
			voci: p.voci,
			creato_il: (/* @__PURE__ */ new Date()).toISOString()
		}));
		mlProb = null;
		mlSalva();
		mlRender();
		showToast(`Problema segnato su ${r.nome}`);
	}
	// equo-app-src/src/ruoli/maniscalco/moduli/090-disegno.js
	function mlRender() {
		let el = document.getElementById("ml");
		if (!ml) {
			if (el) el.hidden = true;
			document.body.classList.remove("ml-on");
			return;
		}
		if (!el) {
			el = document.createElement("div");
			el.id = "ml";
			el.className = "ml";
			el.setAttribute("role", "dialog");
			el.setAttribute("aria-modal", "true");
			document.body.appendChild(el);
		}
		el.hidden = false;
		document.body.classList.add("ml-on");
		const testa = (t, d) => `<div class="ml-barra"><span class="ml-pul"></span><b>${escapeHtml(t)}</b><span>${escapeHtml(d || "")}</span></div>`;
		if (mlProb) return mlRenderProblema(el, testa);
		if (ml.fase === "prima") {
			const card = mlEventi.map((e) => {
				const r = mlRigaCavallo(e), id = mlCavId(e), inf = mlInfo[id] || { aperti: [] };
				const av = [];
				if (inf.avviso) av.push(`<div class="ml-al sic">${ML_IC.alert}<span>${escapeHtml(inf.avviso)}</span></div>`);
				inf.aperti.forEach((p) => av.push(`<div class="ml-al pie"><span class="ml-sig">${mlSigla(p.piede)}</span><span>${escapeHtml(mlNomePiede(p.piede).replace(/^./, (c) => c.toUpperCase()))}: ${escapeHtml((p.voci || []).join(", ") || "da controllare")}${p.nota ? " — " + escapeHtml(p.nota) : ""} (${formatDataBreve(String(p.creato_il).slice(0, 10))}).${p.ricontrolla_il && p.ricontrolla_il <= mlOggi() ? " <b>Ricontrollare oggi.</b>" : ""}</span></div>`));
				if (!av.length) av.push(`<div class="ml-al ok">${ML_IC.check}<span>Nessun problema l'ultima volta.</span></div>`);
				return `<div class="ml-card"><div class="ml-h"><span class="ml-av">${iniziale(r.nome)}</span><b>${escapeHtml(r.nome)}</b><small>${escapeHtml(agDescrizioneTipoPro(e))}</small></div>${av.join("")}</div>`;
			}).join("");
			el.innerHTML = testa(ml.nome, mlEventi.length + (mlEventi.length === 1 ? " cavallo" : " cavalli")) + `<button class="ml-esci" onclick="mlAnnulla()" aria-label="Esci dalla modalità Lavoro">${ML_IC.x}</button><div class="ml-corpo">${card || "<div class=\"ml-vuoto\">Nessun appuntamento in questa tappa.</div>"}</div>` + mlSlider("Ho letto · al lavoro", "mlAlLavoro", "oro");
		} else if (ml.fase === "durante") el.innerHTML = `<button class="ml-esci" onclick="mlAnnulla()" aria-label="Esci dalla modalità Lavoro">${ML_IC.x}</button><div class="ml-quiete"><div class="ml-cer">${ML_IC.ferro}</div><h3>Al lavoro</h3><p>${escapeHtml(ml.nome)}<br>Notifiche dei messaggi in pausa finché non chiudi la tappa. Il telefono può restare in tasca.</p></div>` + mlSlider("Ho finito · chiudi la tappa", "mlHoFinito", "");
		else {
			const righe = mlEventi.map((e) => {
				const r = mlRigaCavallo(e), id = mlCavId(e);
				const pb = (ml.problemi || []).filter((p) => p.ev === e.id);
				const imp = incassiNascosti() ? "" : `<label class="ml-imp"><span>€</span><input type="number" inputmode="decimal" step="0.01" min="0" value="${escapeHtml(ml.importi[e.id] ?? "")}" oninput="mlImporto('${e.id}', this.value)" aria-label="Importo ${escapeHtml(r.nome)}"></label>`;
				return `<div class="ml-riga"><span class="ml-av">${iniziale(r.nome)}</span><div class="ml-t"><b>${escapeHtml(r.nome)}</b><span>${escapeHtml(agDescrizioneTipoPro(e))}</span></div>${imp}
        ${pb.length ? `<button class="ml-st pb" onclick="mlApriProblema('${e.id}')">${pb.map((p) => `<span class="ml-sig">${mlSigla(p.piede)}</span>`).join("")}Problema</button>` : `<span class="ml-st ok">${ML_IC.check}Regolare</span>${id ? `<button class="ml-pbb" onclick="mlApriProblema('${e.id}')" aria-label="Segna un problema su ${escapeHtml(r.nome)}">${ML_IC.alert}</button>` : ""}`}</div>`;
			}).join("");
			const tot = mlEventi.reduce((t, e) => t + (Number(ml.importi[e.id]) || 0), 0);
			el.innerHTML = testa("Chiudi la tappa", ml.nome) + `<button class="ml-esci" onclick="ml.fase='durante';mlSalva();mlRender()" aria-label="Indietro">${ML_IC.indietro}</button><div class="ml-corpo">${righe}
        ${incassiNascosti() ? "" : `<div class="ml-tot"><span>Totale tappa</span><b>${formatEuro(tot)}</b></div>
        <div class="ml-pag"><button class="${ml.pag === "saldato" ? "on" : ""}" onclick="mlPag('saldato')">Saldato<small>pagato ora</small></button><button class="${ml.pag === "da_saldare" ? "on" : ""}" onclick="mlPag('da_saldare')">Da saldare<small>lo segna da incassare</small></button></div>`}
        <div class="ml-prox">${ML_IC.cal}<span id="ml-prox">Prossima volta: come l'ultima volta per ogni cavallo</span></div></div>` + mlSlider("Scorri per chiudere", "mlChiudi", "verde");
			mlProssima();
		}
		mlAttivaSlider(el);
	}
	async function mlProssima() {
		const e = mlEventi.find((x) => TIPO_FERRATURA_INTERVALLI[x.tipo_ferratura]);
		const el = document.getElementById("ml-prox");
		if (!e || !el) return;
		const s = await giorniRichiamoSuggeriti(e.tipo_ferratura, e.cavallo_cliente_id, e.horse_id, e.id, e.cliente_mascalcia_id);
		if (s.giorni && document.getElementById("ml-prox")) el.textContent = `Prossima volta qui: tra ${s.giorni} giorni · ${formatDataBreve(aggiungiGiorniIso(mlOggi(), s.giorni))}`;
	}
	function mlImporto(id, v) {
		ml.importi[id] = v;
		mlSalva();
		const t = document.querySelector("#ml .ml-tot b");
		if (t) t.textContent = formatEuro(mlEventi.reduce((s, e) => s + (Number(ml.importi[e.id]) || 0), 0));
	}
	function mlPag(v) {
		ml.pag = v;
		mlSalva();
		document.querySelectorAll("#ml .ml-pag button").forEach((b, i) => b.classList.toggle("on", i === 0 === (v === "saldato")));
	}
	// equo-app-src/src/ruoli/maniscalco/moduli/092-fasi.js
	async function mlPausaNotifiche(on) {
		if (DEMO_MODE || !currentUser) return;
		const { error } = await sb.from("profiles").update({ lavoro_fino: on ? new Date(Date.now() + 144e5).toISOString() : null }).eq("id", currentUser.id);
		if (error) console.warn("lavoro_fino:", error.message);
	}
	function mlAlLavoro() {
		ml.fase = "durante";
		mlSalva();
		mlRender();
		mlPausaNotifiche(true);
	}
	function mlHoFinito() {
		ml.fase = "dopo";
		mlSalva();
		mlRender();
	}
	async function mlAnnulla() {
		if (!await chiediSiNo("Uscire dalla modalità Lavoro?", "La tappa resta in agenda da fare; le notifiche tornano attive.")) return;
		ml = null;
		mlProb = null;
		mlSalva();
		mlRender();
		mlPausaNotifiche(false);
	}
	async function mlChiudi() {
		const oggi = mlOggi();
		let errori = 0;
		for (const e of mlEventi) {
			if (e.stato === "fatto") continue;
			const upd = { stato: "fatto" };
			if (e.data_intervento !== oggi) upd.data_intervento = oggi;
			if (!incassiNascosti()) {
				const v = ml.importi[e.id];
				upd.importo = v === "" || v == null || isNaN(Number(v)) ? null : Math.round(Number(v) * 100) / 100;
				upd.stato_pagamento = ml.pag;
			}
			if (TIPO_FERRATURA_INTERVALLI[e.tipo_ferratura]) {
				const s = await giorniRichiamoSuggeriti(e.tipo_ferratura, e.cavallo_cliente_id, e.horse_id, e.id, e.cliente_mascalcia_id);
				upd.prossima_scadenza = upd.importo === 0 && s.prima ? s.prima : s.giorni ? aggiungiGiorniIso(oggi, s.giorni) : null;
			}
			const { error } = await DB.updateInterventoMascalcia(e.id, upd);
			if (error) {
				errori++;
				console.error("chiudi tappa:", error);
			}
		}
		if (!DEMO_MODE) {
			const conProblema = new Set((ml.problemi || []).map((p) => p.cav));
			const regolari = [...new Set(mlEventi.map(mlCavId).filter((id) => id && !conProblema.has(id)))];
			if (regolari.length) {
				const { error } = await sb.from("cavalli_problemi_piede").update({ risolto_il: (/* @__PURE__ */ new Date()).toISOString() }).in("cavallo_cliente_id", regolari).is("risolto_il", null);
				if (error) console.warn("problemi risolti:", error.message);
			}
		}
		await mlPausaNotifiche(false);
		const n = mlEventi.length;
		ml = null;
		mlProb = null;
		mlSalva();
		mlRender();
		showToast(errori ? `Tappa chiusa, ma ${errori} lavori non salvati: controlla in agenda` : `Tappa chiusa: ${n} ${n === 1 ? "lavoro fatto" : "lavori fatti"}`);
		try {
			await renderProDeadlines();
			await renderIncassi$1();
			if (typeof renderAgendaSettimana$1 === "function") await renderAgendaSettimana$1();
		} catch (e) {}
	}
	// equo-app-src/src/ruoli/maniscalco/moduli/097-versione-semplice-completa-dell-app-mani.js
	function vistaCompleta() {
		return !!(currentUser && currentUser.vistaMan === "completa");
	}
	function applicaVistaManiscalco() {
		document.body.classList.toggle("vm-completa", vistaCompleta());
		document.body.classList.toggle("vm-semplice", !vistaCompleta());
		if (!vistaCompleta() && typeof incVista !== "undefined" && incVista === "completa") incVista = "semplice";
	}
	async function cambiaVistaManiscalco(v, daScelta) {
		if (!currentUser) return;
		currentUser.vistaMan = v === "completa" ? "completa" : "semplice";
		applicaVistaManiscalco();
		aggiornaSwitchHome();
		if (!DEMO_MODE) {
			const { error } = await sb.from("profiles").update({ vista_maniscalco: currentUser.vistaMan }).eq("id", currentUser.id);
			if (error) console.warn("vista_maniscalco:", error.message);
		}
		if (typeof renderIncassi$1 === "function" && document.getElementById("page-pro-incassi")?.classList.contains("active")) renderIncassi$1();
		showToast(currentUser.vistaMan === "completa" ? "Versione Completa attiva" : "Versione Semplice attiva" + (daScelta ? "" : ": la Completa la riaccendi dal menu"));
	}
	var vistaManScelta = "semplice";
	function mostraSceltaVistaManiscalco() {
		if (DEMO_MODE || !currentUser || currentUser.vistaMan || vistaAi() !== "professionista") return;
		if (document.getElementById("eq-pop-vista")?.classList.contains("attivo")) return;
		sceltaVistaMan("semplice");
		document.getElementById("eq-pop-vista").classList.add("attivo");
	}
	function sceltaVistaMan(v) {
		vistaManScelta = v;
		document.querySelectorAll("#eq-pop-vista .vm-opz").forEach((b) => b.classList.toggle("on", b.dataset.v === v));
	}
	async function confermaVistaMan() {
		document.getElementById("eq-pop-vista").classList.remove("attivo");
		await cambiaVistaManiscalco(vistaManScelta, true);
	}
	async function cambiaPromemoriaPagamenti(on) {
		if (DEMO_MODE) {
			currentUser.promemoriaPagamenti = on;
			showToast(on ? "Promemoria pagamenti attivi" : "Promemoria pagamenti spenti");
			return;
		}
		const { error } = await sb.from("profiles").update({ promemoria_pagamenti: on }).eq("id", currentUser.id);
		if (error) {
			showToast("Errore: " + error.message);
			const sp = document.getElementById("promemoria-switch");
			if (sp) sp.checked = !on;
			return;
		}
		currentUser.promemoriaPagamenti = on;
		showToast(on ? "Promemoria pagamenti attivi: i clienti su Equo ricevono un avviso per i lavori da saldare" : "Promemoria pagamenti spenti per tutti i clienti");
	}
	// equo-app-src/src/ruoli/maniscalco/moduli/099-meteo-accanto-agli-appuntamenti-indirizz.js
	var wgMeteo = {};
	async function wgMeteoPos(c) {
		if (DEMO_MODE) return { demo: true };
		const proprio = (c?.indirizzo || "").trim();
		if (proprio) return {
			indirizzo: proprio,
			luogo: c.nome
		};
		const st = await wgIndirizzoStruttura(c);
		if (st && (st.indirizzo || st.citta)) return {
			indirizzo: st.indirizzo || "",
			citta: [st.citta, st.provincia].filter(Boolean).join(", "),
			luogo: st.citta || c?.nome || ""
		};
		return null;
	}
	function wgMeteoCarica(ids) {
		if (typeof EquoMeteo === "undefined") return;
		ids.forEach((id) => {
			const m = wgMeteo[id];
			if (m && Date.now() - m.t < 18e5) return;
			wgMeteo[id] = {
				stato: "carico",
				t: Date.now()
			};
			(async () => {
				const c = wgClienteDi(id);
				const pos = c ? await wgMeteoPos(c) : null;
				if (!pos) wgMeteo[id] = {
					stato: "nd",
					motivo: "Meteo non disponibile: manca l'indirizzo del cliente (Clienti → Modifica → Indirizzo)",
					t: Date.now()
				};
				else {
					const d = await EquoMeteo.previsione(pos, {
						endpoint: "/.netlify/functions/meteo",
						token: async () => {
							try {
								return (await sb.auth.getSession()).data.session?.access_token || "";
							} catch (e) {
								return "";
							}
						}
					});
					wgMeteo[id] = d && d.giorni ? {
						stato: "ok",
						d,
						t: Date.now()
					} : {
						stato: "nd",
						motivo: d && d.non_trovato ? "Meteo non disponibile: indirizzo del cliente non trovato" : "Meteo non disponibile in questo momento",
						t: d ? Date.now() : Date.now() - 15e5
					};
				}
				try {
					if (document.getElementById("wh-pro")) renderWidgetPro();
				} catch (e) {}
			})();
		});
	}
	function wgMeteoIcona(e) {
		if (!e || typeof EquoMeteo === "undefined") return "";
		const m = wgMeteo[e.cliente_mascalcia_id];
		if (!m || m.stato === "carico") return "";
		if (m.stato === "nd") return `<span class="wg-meteo">${EquoMeteo.iconaNd(m.motivo)}</span>`;
		const o = EquoMeteo.alle(m.d, e.data_intervento, e.ora ? String(e.ora).slice(0, 5) : "10:00");
		if (!o) return `<span class="wg-meteo">${EquoMeteo.iconaNd("Meteo non disponibile per questa data")}</span>`;
		return `<span class="wg-meteo">${EquoMeteo.icona(o.sim, o.notte)}${o.temp != null ? `<small>${o.temp}°</small>` : ""}</span>`;
	}
	// equo-app-src/src/ruoli/maniscalco/moduli/094-arrivo-sul-posto-se-apri-l-app-vicino-a.js
	var mlArrivoT = 0;
	async function mlControllaArrivo() {
		if (ml || DEMO_MODE || !currentUser || !agenteAiHammer() || Date.now() - mlArrivoT < 3e5 || !navigator.geolocation) return;
		mlArrivoT = Date.now();
		let stato = "prompt";
		try {
			stato = (await navigator.permissions.query({ name: "geolocation" })).state;
		} catch (e) {
			return;
		}
		if (stato !== "granted") return;
		const tappe = await mlTappeOggi();
		if (!tappe.length) return;
		const pos = await new Promise((res) => navigator.geolocation.getCurrentPosition((x) => res(x.coords), () => res(null), {
			maximumAge: 12e4,
			timeout: 8e3
		}));
		if (!pos) return;
		const visti = (() => {
			try {
				return JSON.parse(localStorage.getItem("equo-lavoro-visti") || "{}");
			} catch (e) {
				return {};
			}
		})();
		for (const t of tappe) {
			const k = mlOggi() + "|" + t.l.key;
			if (visti[k]) continue;
			const c = t.l.clienteId ? clienteDiId(t.l.clienteId) : null;
			const p = t.l.indirizzo ? { indirizzo: t.l.indirizzo } : c ? await wgMeteoPos(c) : null;
			if (!p) continue;
			const d = await EquoMeteo.previsione(p, {
				endpoint: "/.netlify/functions/meteo",
				token: async () => {
					try {
						return (await sb.auth.getSession()).data.session?.access_token || "";
					} catch (e) {
						return "";
					}
				}
			});
			if (!d || d.lat == null) continue;
			if (mlDistanza(pos.latitude, pos.longitude, d.lat, d.lon) < 1.5) {
				visti[k] = 1;
				try {
					localStorage.setItem("equo-lavoro-visti", JSON.stringify(visti));
				} catch (e) {}
				return mlMostraArrivo(t);
			}
		}
	}
	function mlDistanza(a1, o1, a2, o2) {
		const R = 6371, r = (x) => x * Math.PI / 180;
		const dA = r(a2 - a1), dO = r(o2 - o1);
		const h = Math.sin(dA / 2) ** 2 + Math.cos(r(a1)) * Math.cos(r(a2)) * Math.sin(dO / 2) ** 2;
		return 2 * R * Math.asin(Math.sqrt(h));
	}
	function mlMostraArrivo(t) {
		mlArrivoKey = t.l.key;
		const nomi = [...new Set(t.eventi.map((e) => agNomeCavallo(e)).filter(Boolean))];
		hmFoglio("Sei arrivato?", t.l.nome, `<div class="ml-arr">${nomi.map((n) => `<span>${iniziale(n)} ${escapeHtml(n)}</span>`).join("")}</div>
    <button class="hm-tappa su" onclick="hmChiudi();mlApri(mlArrivoKey)"><span class="o">${ML_IC.ferro}</span><span class="c"><b>Inizia il lavoro</b><span>${t.eventi.length} ${t.eventi.length === 1 ? "cavallo" : "cavalli"} · leggi gli avvisi prima di cominciare</span></span></button>`);
	}
	async function mlRiprendi() {
		if (ml || !currentUser) return;
		let s = null;
		try {
			s = JSON.parse(localStorage.getItem("equo-lavoro") || "null");
		} catch (e) {}
		if (!s || s.uid !== currentUser.id) return;
		if (s.giorno !== mlOggi()) {
			try {
				localStorage.removeItem("equo-lavoro");
			} catch (e) {}
			mlPausaNotifiche(false);
			return;
		}
		ml = s;
		await mlCarica();
		mlRender();
	}
	async function hmPortami() {
		try {
			await caricaUbicazioni();
		} catch (e) {}
		const oggi = isoLocale(/* @__PURE__ */ new Date()), adesso = (/* @__PURE__ */ new Date()).toTimeString().slice(0, 5);
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
				ora: e.ora ? String(e.ora).slice(0, 5) : "",
				cavalli: []
			});
			const t = per.get(l.key);
			const n = agNomeCavallo(e);
			if (n && !t.cavalli.includes(n)) t.cavalli.push(n);
		});
		hmTappe = [...per.values()];
		const prossima = hmTappe.findIndex((t) => !t.ora || t.ora >= adesso);
		const corpo = hmTappe.map((t, i) => `<button class="hm-tappa${i === (prossima < 0 ? 0 : prossima) ? " su" : ""}" onclick="hmVai(${i})">
      <span class="o">${t.ora ? escapeHtml(t.ora) : HM_IC.cal}</span>
      <span class="c"><b>${escapeHtml(t.l.nome)}</b><span>${escapeHtml([t.cavalli.join(", "), t.l.indirizzo].filter(Boolean).join(" · "))}</span></span>
      <span class="vai">${HM_IC.nav}Vai</span></button>${agenteAiHammer() ? `<button class="hm-tappa ml-tappa" onclick="hmChiudi();mlApri(hmTappe[${i}].l.key)"><span class="o"><svg viewBox="0 0 24 24" fill="currentColor" style="width:20px;height:20px"><use href="#i-ferro"/></svg></span><span class="c"><b>Lavoro a ${escapeHtml(t.l.nome)}</b><span>avvisi prima di cominciare · chiudi la tappa dopo</span></span></button>` : ""}`).join("") + `<button class="hm-tappa" onclick="hmChiudi();apriCercaTutto()"><span class="o">${HM_IC.cerca}</span><span class="c"><b>Un altro cliente o scuderia…</b><span>cerca per nome</span></span></button>`;
		hmFoglio("Portami da…", hmTappe.length ? "Scegli la tappa: si apre il tuo navigatore" : "Oggi non hai appuntamenti da fare", corpo);
	}
	function hmVai(i) {
		const t = hmTappe[i];
		if (!t) return;
		hmChiudi();
		navigaLuogo(t.l);
	}
	function hmScadenze() {
		const ric = hpRichiamiLista || [];
		const corpo = ric.length ? hpGiri().map(hpRigaGiro).join("") + hpListaRic(ric) : "<div class=\"muted\" style=\"font-size:13.5px;padding:8px 0 4px\">Nessun cavallo da richiamare nei prossimi 30 giorni.</div>";
		hmFoglio("Scadenze", "Cavalli da richiamare: in rosso quelli in ritardo", corpo);
	}
	function hmAltro() {
		const v = (ic, t, az, cls) => `<button class="${cls || ""}" onclick="hmChiudi();${az}"><span>${ic}</span>${t}</button>`;
		hmFoglio("Altro", "", `<div class="hm-griglia">
    ${v(HM_IC.wallet, "Incassi", "showPage('pro-incassi')", "solo-incassi")}
    ${v(HM_IC.cal, "Agenda", "showPage('pro-agenda')")}
    ${v(HM_IC.inbox, "Messaggi", "hmMessaggi()")}
    ${v(HM_IC.qr, "Il mio codice e QR", "openCodicePersonaleModal()")}
    ${v(HM_IC.slider, vistaCompleta() ? "Passa alla Semplice" : "Passa alla Completa", "cambiaVistaManiscalco(vistaCompleta() ? 'semplice' : 'completa')")}
    ${v(HM_IC.aiuto, "Aiuto", "apriTicketAssistenza()")}
    ${v(HM_IC.menu, "Menu e impostazioni", "openMenu()")}
  </div>`);
	}
	// equo-app-src/src/ruoli/maniscalco/moduli/095-banner-riquadri-dalla-tabella-home-banne.js
	var HM_BANNER_BASE = [
		{
			id: null,
			tipo: "foto",
			immagine: "assets/banner/cavallo.webp",
			titolo: "La cura del cavallo inizia dai dettagli."
		},
		{
			id: null,
			tipo: "oggi"
		},
		{
			id: null,
			tipo: "hammer",
			immagine: "assets/banner/hammer.webp",
			titolo: "Chiedi a Hammer:<br>«Chi devo richiamare questa settimana?»",
			testo: "Prova Hammer"
		}
	];
	var hmBanner = null;
	var hmBannerTimer = null;
	var hmBannerVisti = /* @__PURE__ */ new Set();
	var hmBannerFermo = 0;
	async function hmCaricaBanner() {
		if (hmBanner) return hmBanner;
		hmBanner = HM_BANNER_BASE;
		if (DEMO_MODE) return hmBanner;
		try {
			const oggi = isoLocale(/* @__PURE__ */ new Date());
			const { data, error } = await sb.from("home_banner").select("id, tipo, titolo, testo, immagine, link, dal, al, pubblico, ordine").eq("app", "maniscalco").eq("attivo", true).order("ordine", { ascending: true });
			if (!error && data && data.length) {
				const prem = isPremium();
				const validi = data.filter((b) => (!b.dal || b.dal <= oggi) && (!b.al || b.al >= oggi) && (b.pubblico === "tutti" || !b.pubblico || b.pubblico === "premium" === prem));
				if (validi.length) hmBanner = validi;
			}
		} catch (e) {}
		return hmBanner;
	}
	function hmTestoBanner(t) {
		return escapeHtml(t || "").replace(/&lt;(\/?)(br|b|i)\s*\/?&gt;/gi, "<$1$2>");
	}
	function hmSlideHtml(b, i) {
		const img = b.immagine ? ` style="background-image:url('${String(b.immagine).replace(/['"()\\]/g, "")}')"` : "";
		if (b.tipo === "oggi") {
			const oggi = isoLocale(/* @__PURE__ */ new Date());
			const app = agOrdinaGiro((hpAppuntamenti || []).filter((e) => e.data_intervento === oggi && !["annullato", "rifiutato"].includes(e.stato)));
			const righe = app.slice(0, 3).map((e) => `<div class="r"><b>${e.ora ? String(e.ora).slice(0, 5) : "—"}</b>${escapeHtml(agNomeCavallo(e) || TIPO_FERRATURA_LABELS[e.tipo_ferratura] || "")} <span>· ${escapeHtml(e.clienti_mascalcia?.nome || "")}</span></div>`).join("");
			return `<div class="hm-slide" data-i="${i}" onclick="hmToccaBanner(${i})"><div class="cerchio-oro"></div>${HM_IC.cal.replace("class=\"hm-svg\"", "class=\"hm-svg ombra\"")}
      <div class="eti">${HM_IC.cal}Oggi${app.length ? " · " + app.length + (app.length === 1 ? " appuntamento" : " appuntamenti") : ""}</div>
      ${app.length ? `<div class="lista">${righe}${app.length > 3 ? `<div class="r"><b>+${app.length - 3}</b><span>altri in agenda</span></div>` : ""}</div>` : `<div class="vuoto">Oggi niente in agenda.<small>Tocca per aprire l'agenda della settimana</small></div>`}</div>`;
		}
		if (b.tipo === "hammer") return `<div class="hm-slide foto" data-i="${i}"${img} onclick="hmToccaBanner(${i})"><div class="frase">${hmTestoBanner(b.titolo)}</div><div class="chip">${HM_IC.hammer}${escapeHtml(b.testo || "Prova Hammer")}</div></div>`;
		if (b.tipo === "foto") return `<div class="hm-slide foto" data-i="${i}"${img} onclick="hmToccaBanner(${i})"><div class="frase">${hmTestoBanner(b.titolo)}</div><div class="marchio"><img src="assets/icona-equo.png" alt="">Equo</div></div>`;
		return `<div class="hm-slide foto" data-i="${i}"${img} onclick="hmToccaBanner(${i})"><div class="frase">${hmTestoBanner(b.titolo)}</div>${b.testo ? `<div class="chip">${escapeHtml(b.testo)}</div>` : ""}</div>`;
	}
	function hmToccaBanner(i) {
		const b = (hmBanner || [])[i];
		if (!b) return;
		hmBannerEvento(b, "tocco");
		if (b.tipo === "oggi") return showPage("pro-agenda");
		if (b.tipo === "hammer") return openAiSheet();
		if (b.link && /^https:\/\//.test(b.link)) return window.open(b.link, "_blank", "noopener");
	}
	function hmBannerEvento(b, tipo) {
		if (!b || !b.id || DEMO_MODE) return;
		if (tipo === "vista") {
			if (hmBannerVisti.has(b.id)) return;
			hmBannerVisti.add(b.id);
		}
		sb.rpc("equo_banner_evento", {
			p_banner: b.id,
			p_tipo: tipo
		}).then(() => {}, () => {});
	}
	async function hmRenderBanner() {
		const box = document.getElementById("hm-slides"), pall = document.getElementById("hm-pall");
		if (!box) return;
		const lista = await hmCaricaBanner();
		const pos = box.scrollLeft;
		box.innerHTML = lista.map(hmSlideHtml).join("");
		box.scrollLeft = pos;
		pall.innerHTML = lista.length > 1 ? lista.map((_, i) => `<i${i === hmBannerIdx() ? " class=\"on\"" : ""}></i>`).join("") : "";
		if (!box.dataset.pronto) {
			box.dataset.pronto = "1";
			box.addEventListener("scroll", () => {
				clearTimeout(box._t);
				box._t = setTimeout(hmBannerAggiornaPallini, 80);
			}, { passive: true });
			["touchstart", "pointerdown"].forEach((ev) => box.addEventListener(ev, () => {
				hmBannerFermo = Date.now();
			}, { passive: true }));
		}
		hmBannerAggiornaPallini();
		if (!hmBannerTimer) hmBannerTimer = setInterval(hmBannerAvanti, 6e3);
	}
	function hmBannerIdx() {
		const box = document.getElementById("hm-slides");
		return box && box.clientWidth ? Math.round(box.scrollLeft / box.clientWidth) : 0;
	}
	function hmBannerAggiornaPallini() {
		const i = hmBannerIdx();
		document.querySelectorAll("#hm-pall i").forEach((p, k) => p.classList.toggle("on", k === i));
		if (document.body.classList.contains("home-man") && document.getElementById("page-pro-home")?.classList.contains("active")) hmBannerEvento((hmBanner || [])[i], "vista");
	}
	function hmBannerAvanti() {
		const box = document.getElementById("hm-slides");
		if (!box || !box.clientWidth || document.hidden || !document.getElementById("page-pro-home")?.classList.contains("active")) return;
		if (Date.now() - hmBannerFermo < 8e3) return;
		const n = (hmBanner || []).length;
		if (n < 2) return;
		const i = (hmBannerIdx() + 1) % n;
		const ridotto = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
		box.scrollTo({
			left: i * box.clientWidth,
			behavior: ridotto ? "auto" : "smooth"
		});
	}
	function hmContaConferme() {
		const n = document.querySelectorAll("#hm-conferme button").length, el = document.getElementById("hm-n-conf");
		if (el) {
			el.textContent = n;
			el.hidden = !n;
		}
	}
	async function hmConferme() {
		hmFoglio("Da confermare", "Conferma che nome, razza e data di nascita sono giusti: con quella del proprietario arriva il codice definitivo.", "<div id=\"hm-conferme-foglio\"><div class=\"loading\"><div class=\"spinner\"></div></div></div>");
		await caricaConfermePro(true, "hm-conferme-foglio");
		const box = document.getElementById("hm-conferme-foglio");
		if (box && !box.querySelector("button")) box.innerHTML = "<div class=\"muted\" style=\"font-size:13.5px;padding:8px 0 4px\">✓ Tutto confermato: nessun cavallo in attesa.</div>";
		else if (box) {
			const t = box.querySelector(".section-title");
			if (t) t.remove();
			const d = box.querySelector(".card > .muted");
			if (d) d.remove();
		}
	}
	function renderHomeMan() {
		if (!document.getElementById("hm")) return;
		Promise.resolve(caricaConfermePro(false, "hm-conferme")).then(hmContaConferme).catch(() => {});
		if (typeof pmRenderHome === "function") pmRenderHome();
		document.getElementById("hm-saluto").textContent = testoSaluto();
		document.getElementById("hm-data").textContent = (/* @__PURE__ */ new Date()).toLocaleDateString("it-IT", {
			weekday: "long",
			day: "numeric",
			month: "long"
		});
		const nScad = (hpRichiamiLista || []).filter((r) => r.giorni <= 7).length;
		const ns = document.getElementById("hm-n-scad");
		ns.hidden = !nScad;
		ns.textContent = nScad;
		const attivi = typeof clientiAttivi === "function" ? clientiAttivi() : [];
		const nCav = typeof cavalliCartella === "function" ? cavalliCartella().length : 0;
		const nCli = attivi.filter((c) => !isStruttura(c)).length, nScu = attivi.filter(isStruttura).length;
		document.getElementById("hm-r-cav").innerHTML = `<strong>${nCav}</strong> ${nCav === 1 ? "cavallo che segui" : "cavalli che segui"}`;
		document.getElementById("hm-r-cli").innerHTML = `<strong>${nCli}</strong> ${nCli === 1 ? "proprietario" : "proprietari"}`;
		document.getElementById("hm-r-scu").innerHTML = `<strong>${nScu}</strong> ${nScu === 1 ? "scuderia o maneggio" : "scuderie e maneggi"}`;
		const mese = (/* @__PURE__ */ new Date()).toLocaleDateString("it-IT", { month: "long" });
		document.getElementById("hm-r-inc").innerHTML = `${mese} <strong>${wgEuro(wgPro.incassatoMese)}</strong>` + (wgPro.daIncassareMese ? ` · da incassare <strong>${wgEuro(wgPro.daIncassareMese)}</strong>` : "");
		const n = wgPro.unread || 0, b = document.getElementById("hm-msg-n");
		if (b) {
			b.hidden = !n;
			b.textContent = n > 99 ? "99+" : n;
		}
		hmRenderBanner();
		hmTemperatura();
		if (agenteAiHammer()) {
			if (!mlRipresa) {
				mlRipresa = true;
				mlRiprendi().then(() => mlControllaArrivo()).catch((e) => console.warn("lavoro:", e));
			} else mlControllaArrivo().catch((e) => console.warn("arrivo:", e));
		}
	}
	var mlRipresa = false;
	var hmTempT = 0;
	async function hmTemperatura() {
		const el = document.getElementById("hm-temp");
		if (!el || typeof EquoMeteo === "undefined" || Date.now() - hmTempT < 6e4) return;
		hmTempT = Date.now();
		const pos = DEMO_MODE ? { demo: true } : typeof meteoUltimaPos === "function" ? meteoUltimaPos() : null;
		if (!pos) return;
		const d = await EquoMeteo.previsione(pos, {
			endpoint: "/.netlify/functions/meteo",
			token: async () => {
				try {
					return (await sb.auth.getSession()).data.session?.access_token || "";
				} catch (e) {
					return "";
				}
			}
		});
		const ora = (/* @__PURE__ */ new Date()).toTimeString().slice(0, 5);
		const o = d && d.giorni ? EquoMeteo.alle(d, isoLocale(/* @__PURE__ */ new Date()), ora) : null;
		el.innerHTML = o && o.temp != null ? `${Math.round(o.temp)}°${d.luogo && !d.demo ? `<small>${escapeHtml(String(d.luogo).split(",")[0])}</small>` : ""}` : "";
	}
	// equo-app-src/src/ruoli/maniscalco/moduli/096-vista-applica-cambia-salva.js
	function applicaVistaHome() {
		document.body.classList.toggle("vista-widget", vistaWidgetAttiva());
		document.body.classList.toggle("incassi-nascosti", incassiNascosti());
		if (incassiNascosti() && document.getElementById("page-pro-incassi")?.classList.contains("active")) showPage("pro-home");
		if (vistaWidgetAttiva()) wgRidisegna();
	}
	function wgRidisegna() {
		if (currentUser && document.body.classList.contains("home-man")) try {
			renderHomeMan();
		} catch (e) {
			console.error("renderHomeMan:", e);
		}
		if (!currentUser || !vistaWidgetAttiva()) return;
		if (vistaAi() === "professionista") renderWidgetPro();
		else renderWidgetOwner();
	}
	function aggiornaSwitchHome() {
		const x = aggiornaSwitchHomeBase.apply(this, arguments);
		eseguiEstensioniSubito(estensioniDopo, "aggiornaSwitchHome");
		return x;
	}
	function aggiornaSwitchHomeBase() {
		const sw = document.getElementById("vista-widget-switch");
		if (sw) sw.checked = vistaWidgetAttiva();
		const rw = sw && sw.closest(".menu-row");
		if (rw) rw.style.display = typeof agenteAiHammer === "function" && agenteAiHammer() ? "none" : "";
		const pro = vistaAi() === "professionista";
		const riga = document.getElementById("menu-incassi-row");
		if (riga) riga.style.display = pro ? "" : "none";
		const si = document.getElementById("incassi-switch");
		if (si) si.checked = !incassiNascosti();
		const rp = document.getElementById("menu-promemoria-row");
		if (rp) rp.style.display = pro ? "" : "none";
		const sp = document.getElementById("promemoria-switch");
		if (sp) sp.checked = currentUser?.promemoriaPagamenti !== false;
		const rv = document.getElementById("menu-vista-man-row");
		if (rv) rv.style.display = pro ? "" : "none";
		const sv = document.getElementById("vista-man-switch");
		if (sv) sv.checked = vistaCompleta();
		const rm = document.getElementById("menu-misura-row");
		if (rm) rm.style.display = typeof agenteAiHammer === "function" && agenteAiHammer() ? "" : "none";
		const sm = document.getElementById("misura-pref-select");
		if (sm) sm.value = currentUser?.ferroSistema || "";
	}
	// equo-app-src/src/ruoli/maniscalco/moduli/057-pdf-appuntamento-invio-in-chat-maniscalc.js
	var jsPdfPromise = null;
	function caricaJsPdf() {
		if (window.jspdf?.jsPDF) return Promise.resolve(window.jspdf.jsPDF);
		if (!jsPdfPromise) jsPdfPromise = new Promise((resolve, reject) => {
			const sc = document.createElement("script");
			sc.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
			sc.onload = () => window.jspdf?.jsPDF ? resolve(window.jspdf.jsPDF) : reject(/* @__PURE__ */ new Error("jsPDF non disponibile"));
			sc.onerror = () => {
				jsPdfPromise = null;
				reject(/* @__PURE__ */ new Error("impossibile scaricare la libreria PDF (sei offline?)"));
			};
			document.head.appendChild(sc);
		});
		return jsPdfPromise;
	}
	function pdfNomeFile(e) {
		const pulisci = (t) => String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "");
		return [
			"Equo",
			pulisci(e.clienti_mascalcia?.nome),
			pulisci(agNomeCavallo(e)),
			e.data_intervento
		].filter(Boolean).join("_") + ".pdf";
	}
	function testoRiepilogoEvento(e) {
		const [y, m, d] = e.data_intervento.split("-").map(Number);
		const quando = `${AG_GIORNI[(new Date(y, m - 1, d).getDay() + 6) % 7]} ${d} ${AG_MESI_LUNGHI[m - 1]}${e.ora ? " ore " + String(e.ora).slice(0, 5) : ""}`;
		const cav = agNomeCavallo(e);
		const parti = [(e.stato === "fatto" ? "Intervento del " : "Appuntamento: ") + quando, (cav ? cav + " — " : "") + agDescrizioneTipo(e)];
		if (e.importo != null) parti.push("€ " + Number(e.importo).toFixed(2).replace(".", ",") + (e.stato_pagamento === "saldato" ? " (saldato)" : " (da saldare)"));
		if (e.aiutante_nome) parti.push(e.stato === "fatto" ? `Intervento eseguito con l'aiutante ${e.aiutante_nome}` : `con l'aiutante ${e.aiutante_nome}`);
		return parti.join(" · ");
	}
	async function creaPdfEvento(e) {
		const doc = new (await (caricaJsPdf()))({
			unit: "mm",
			format: "a4"
		});
		const W = 210, M = 18;
		const verde = [
			20,
			49,
			42
		], oro = [
			201,
			143,
			46
		], grigio = [
			95,
			111,
			103
		];
		doc.setFillColor(...verde);
		doc.rect(0, 0, W, 32, "F");
		doc.setTextColor(255, 255, 255);
		doc.setFont("helvetica", "bold");
		doc.setFontSize(22);
		doc.text("Equo", M, 20);
		doc.setFont("helvetica", "normal");
		doc.setFontSize(10);
		doc.text("Prenditi cura del tuo cavallo", M, 26);
		doc.setFontSize(10);
		doc.text((/* @__PURE__ */ new Date()).toLocaleDateString("it-IT"), 192, 20, { align: "right" });
		doc.setFillColor(...oro);
		doc.rect(0, 32, W, 1.5, "F");
		let y = 48;
		doc.setTextColor(...verde);
		doc.setFont("helvetica", "bold");
		doc.setFontSize(17);
		doc.text(e.stato === "fatto" ? "Riepilogo intervento" : "Conferma appuntamento", M, y);
		if (agNomeCavallo(e)) {
			y += 9;
			doc.setFont("helvetica", "bold");
			doc.setFontSize(20);
			doc.setTextColor(...oro);
			doc.text(agNomeCavallo(e), M, y);
		}
		y += 6;
		const professionista = currentUser?.datiPagamentoNome || currentUser?.fullName || currentUser?.full_name || currentUser?.email || "";
		if (professionista) {
			doc.setFont("helvetica", "normal");
			doc.setFontSize(10.5);
			doc.setTextColor(...grigio);
			doc.text(etichettaPro() + ": " + professionista + (currentUser?.certificazioneStato === "verificato" ? "  ·  Equo Certified" : ""), M, y + 2);
			y += 6;
		}
		y += 6;
		const [yy, mm, dd] = e.data_intervento.split("-").map(Number);
		const dataTxt = `${[
			"Lunedì",
			"Martedì",
			"Mercoledì",
			"Giovedì",
			"Venerdì",
			"Sabato",
			"Domenica"
		][(new Date(yy, mm - 1, dd).getDay() + 6) % 7]} ${dd} ${AG_MESI_LUNGHI[mm - 1]} ${yy}`;
		let tipoTxt = TIPO_FERRATURA_LABELS[e.tipo_ferratura] || e.tipo_ferratura || "";
		if (e.tipo_ferratura === "altro" && e.tipo_altro) tipoTxt = "Altro — " + e.tipo_altro;
		let misuraTxt = "";
		if (e.numero_ferro) {
			const sis = e.misura_sistema || "italiana";
			const idx = MISURE_FERRO[sis] ? MISURE_FERRO[sis].indexOf(misuraNorm(e.numero_ferro)) : -1;
			misuraTxt = misuraNorm(e.numero_ferro) + " (" + {
				italiana: "italiana",
				olandese: "olandese",
				tedesca: "tedesca"
			}[sis] + ")";
			if (idx >= 0) misuraTxt += " — italiana " + MISURE_FERRO.italiana[idx] + " · olandese " + MISURE_FERRO.olandese[idx] + " · tedesca " + MISURE_FERRO.tedesca[idx];
		}
		const righe = [
			["Cavallo", agNomeCavallo(e) || "—"],
			["Cliente", e.clienti_mascalcia?.nome || "—"],
			["Data", dataTxt],
			["Ora", e.ora ? String(e.ora).slice(0, 5) : "—"],
			["Tipo intervento", tipoTxt],
			misuraTxt ? ["Misura ferro", misuraTxt] : null,
			e.quantita_ferri ? ["Quantità ferri", String(e.quantita_ferri)] : null,
			["Importo", e.importo != null ? "€ " + Number(e.importo).toFixed(2).replace(".", ",") : "—"],
			["Pagamento", e.stato_pagamento === "saldato" ? "Saldato" : "Da saldare"],
			["Stato", e.stato === "fatto" ? "Eseguito" : "Programmato"],
			e.aiutante_nome ? ["Aiutante", e.stato === "fatto" ? `Intervento eseguito con l'aiutante ${e.aiutante_nome}` : `Con l'aiutante ${e.aiutante_nome}`] : null,
			e.prossima_scadenza && e.stato === "fatto" ? ["Prossimo intervento consigliato", (/* @__PURE__ */ new Date(e.prossima_scadenza + "T00:00")).toLocaleDateString("it-IT")] : null,
			e.note ? ["Note", e.note] : null
		].filter(Boolean);
		doc.setFontSize(11);
		righe.forEach(([k, v], idx) => {
			const valore = doc.splitTextToSize(String(v), 112);
			const h = Math.max(9, valore.length * 5.2 + 3.8);
			if (idx % 2 === 0) {
				doc.setFillColor(248, 246, 240);
				doc.rect(M, y - 5.6, 174, h, "F");
			}
			doc.setFont("helvetica", "bold");
			doc.setTextColor(...grigio);
			doc.text(k, 21, y);
			doc.setFont("helvetica", "normal");
			doc.setTextColor(...verde);
			doc.text(valore, 80, y);
			y += h;
		});
		if (e.stato_pagamento !== "saldato" && (currentUser?.datiPagamentoIban || currentUser?.datiPagamentoPaypal)) {
			y += 8;
			doc.setFont("helvetica", "bold");
			doc.setFontSize(12);
			doc.setTextColor(...verde);
			doc.text("Dati per il pagamento", M, y);
			y += 7;
			doc.setFont("helvetica", "normal");
			doc.setFontSize(10.5);
			doc.setTextColor(...grigio);
			if (currentUser.datiPagamentoNome) {
				doc.text("Intestatario: " + currentUser.datiPagamentoNome, M, y);
				y += 6;
			}
			if (currentUser.datiPagamentoIban) {
				doc.text("IBAN: " + currentUser.datiPagamentoIban, M, y);
				y += 6;
			}
			if (currentUser.datiPagamentoPaypal) {
				doc.text("PayPal: " + currentUser.datiPagamentoPaypal, M, y);
				y += 6;
			}
		}
		const piede = () => {
			doc.setDrawColor(227, 221, 204);
			doc.setLineWidth(.2);
			doc.line(M, 280, 192, 280);
			doc.setFont("helvetica", "normal");
			doc.setFontSize(8.5);
			doc.setTextColor(...grigio);
			doc.text("Documento generato con Equo — equohub.com. Non ha valore fiscale.", M, 285);
		};
		y = riquadroInvitoPdf(doc, (typeof clientiMascalcia !== "undefined" ? clientiMascalcia : []).find((x) => x.id === e.cliente_mascalcia_id), y + 4, W, M, () => {
			piede();
			doc.addPage();
			return 22;
		});
		piede();
		const nome = pdfNomeFile(e);
		return {
			blob: doc.output("blob"),
			nome
		};
	}
	async function generaPdfEvento(e) {
		closeModal("modal-azioni-evento");
		showToast("Creo il PDF…");
		try {
			const { blob, nome } = await creaPdfEvento(e);
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
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = nome;
			document.body.appendChild(a);
			a.click();
			a.remove();
			setTimeout(() => URL.revokeObjectURL(url), 3e4);
		} catch (err) {
			console.error("generaPdfEvento:", err);
			showToast("Impossibile creare il PDF: " + (err?.message || err));
		}
	}
	async function inviaEventoInChat(e) {
		closeModal("modal-azioni-evento");
		await openChatThread(e.cliente_mascalcia_id);
		document.getElementById("mchat-input").value = testoRiepilogoEvento(e);
		chatAllegatoEvento = e;
		document.getElementById("mchat-allegato-nome").textContent = pdfNomeFile(e);
		document.getElementById("mchat-allegato").classList.add("active");
	}
	function rimuoviAllegatoChat() {
		chatAllegatoEvento = null;
		const el = document.getElementById("mchat-allegato");
		if (el) el.classList.remove("active");
	}
	var contoCodice = (c) => "C-" + c.anno + "-" + String(c.numero).padStart(3, "0");
	var contoLavori = (n) => n + (n === 1 ? " lavoro" : " lavori");
	var contoEuro = (n) => "€ " + Number(n || 0).toFixed(2).replace(".", ",");
	var contoData = (iso) => {
		const [y, m, d] = String(iso).slice(0, 10).split("-");
		return `${d}/${m}/${y}`;
	};
	var ContoDB = {
		async lavoriLiberi(clienteId) {
			let righe, usati = /* @__PURE__ */ new Set();
			if (DEMO_MODE) {
				righe = demoState.interventiMascalcia.filter((i) => i.cliente_mascalcia_id === clienteId || i.luogo_cliente_id === clienteId).map((i) => ({
					...i,
					cavalli_clienti_mascalcia: demoState.cavalliClientiMascalcia.find((x) => x.id === i.cavallo_cliente_id) ? { nome: demoState.cavalliClientiMascalcia.find((x) => x.id === i.cavallo_cliente_id).nome } : null
				}));
				(demoState.conti || []).filter((c) => c.stato !== "annullato").forEach((c) => c.righe.forEach((r) => usati.add(r.intervento_id)));
			} else {
				const { data, error } = await sb.from("interventi_mascalcia").select("*, cavalli_clienti_mascalcia(nome)").eq("maniscalco_id", currentUser.id).eq("stato", "fatto").or(`cliente_mascalcia_id.eq.${clienteId},luogo_cliente_id.eq.${clienteId}`).order("data_intervento", { ascending: true });
				if (error) {
					console.error("lavoriLiberi:", error);
					return [];
				}
				righe = data || [];
				const ids = righe.map((r) => r.id);
				if (ids.length) ((await sb.from("conti_mascalcia_righe").select("intervento_id, conti_mascalcia!inner(stato)").in("intervento_id", ids).neq("conti_mascalcia.stato", "annullato")).data || []).forEach((r) => usati.add(r.intervento_id));
			}
			return righe.filter((i) => i.stato === "fatto" && i.stato_pagamento !== "saldato" && Number(i.importo) > 0 && !usati.has(i.id));
		},
		async crea(clienteId, modo, da, a, righe) {
			if (DEMO_MODE) {
				demoState.conti = demoState.conti || [];
				const anno = (/* @__PURE__ */ new Date()).getFullYear();
				const numero = demoState.conti.filter((c) => c.anno === anno).length + 1;
				const c = {
					id: "dc-" + Date.now().toString(36) + numero,
					cliente_mascalcia_id: clienteId,
					anno,
					numero,
					modo,
					periodo_da: da,
					periodo_a: a,
					stato: "da_incassare",
					creato_il: (/* @__PURE__ */ new Date()).toISOString(),
					righe: righe.map((r) => {
						const i = demoState.interventiMascalcia.find((x) => x.id === r.intervento_id);
						return {
							...r,
							data_intervento: i.data_intervento,
							importo: Number(i.importo)
						};
					})
				};
				c.totale = c.righe.reduce((s, r) => s + r.importo, 0);
				c.n_lavori = c.righe.length;
				demoState.conti.push(c);
				return {
					data: {
						id: c.id,
						anno,
						numero,
						totale: c.totale,
						n_lavori: c.n_lavori
					},
					error: null
				};
			}
			const { data, error } = await sb.rpc("equo_crea_conto", {
				p_cliente: clienteId,
				p_modo: modo,
				p_da: da || null,
				p_a: a || null,
				p_righe: righe
			});
			if (error) console.error("equo_crea_conto:", error);
			return {
				data,
				error
			};
		},
		async lista(clienteId) {
			if (DEMO_MODE) return (demoState.conti || []).filter((c) => c.cliente_mascalcia_id === clienteId).sort((a, b) => b.creato_il.localeCompare(a.creato_il));
			const { data, error } = await sb.from("conti_mascalcia").select("*").eq("maniscalco_id", currentUser.id).eq("cliente_mascalcia_id", clienteId).order("creato_il", { ascending: false }).limit(30);
			if (error) {
				console.error("lista conti:", error);
				return [];
			}
			return data || [];
		},
		async aperti(clienteId) {
			if (DEMO_MODE) return (demoState.conti || []).filter((c) => c.stato === "da_incassare" && (!clienteId || c.cliente_mascalcia_id === clienteId)).sort((a, b) => a.creato_il.localeCompare(b.creato_il));
			let q = sb.from("conti_mascalcia").select("*").eq("maniscalco_id", currentUser.id).eq("stato", "da_incassare");
			if (clienteId) q = q.eq("cliente_mascalcia_id", clienteId);
			const { data, error } = await q.order("creato_il", { ascending: true }).limit(100);
			if (error) {
				console.error("conti aperti:", error);
				return [];
			}
			return data || [];
		},
		async completo(id) {
			if (DEMO_MODE) return (demoState.conti || []).find((c) => c.id === id) || null;
			const [c, r] = await Promise.all([sb.from("conti_mascalcia").select("*").eq("id", id).single(), sb.from("conti_mascalcia_righe").select("*").eq("conto_id", id).order("proprietario_nome").order("data_intervento")]);
			if (c.error || !c.data) return null;
			return {
				...c.data,
				righe: r.data || []
			};
		},
		async pagato(id) {
			if (DEMO_MODE) {
				const c = demoState.conti.find((x) => x.id === id);
				c.stato = "pagato";
				c.pagato_il = (/* @__PURE__ */ new Date()).toISOString();
				c.righe.forEach((r) => {
					const i = demoState.interventiMascalcia.find((x) => x.id === r.intervento_id);
					if (i) {
						i.stato_pagamento = "saldato";
						i.saldato_il = c.pagato_il;
					}
				});
				return { error: null };
			}
			const { error } = await sb.rpc("equo_conto_pagato", { p_conto: id });
			if (error) console.error("equo_conto_pagato:", error);
			return { error };
		},
		async annulla(id) {
			if (DEMO_MODE) {
				const c = demoState.conti.find((x) => x.id === id);
				c.stato = "annullato";
				c.annullato_il = (/* @__PURE__ */ new Date()).toISOString();
				return { error: null };
			}
			const { error } = await sb.rpc("equo_conto_annulla", { p_conto: id });
			if (error) console.error("equo_conto_annulla:", error);
			return { error };
		}
	};
	// equo-app-src/src/ruoli/maniscalco/moduli/058-scheda-cliente-pulsante-elenco-dei-conti.js
	async function caricaContiCliente(clienteId) {
		const box = document.getElementById("cliente-conti-box");
		if (!box) return;
		if (incassiNascosti()) {
			box.innerHTML = "";
			return;
		}
		const lista = await ContoDB.lista(clienteId);
		if (currentClienteId !== clienteId) return;
		const badge = (s) => s === "pagato" ? "<span class=\"badge badge-green\">Pagato</span>" : s === "annullato" ? "<span class=\"badge\" style=\"opacity:.7\">Annullato</span>" : "<span class=\"badge badge-red\">Da incassare</span>";
		box.innerHTML = `<div class="card" style="margin:14px 0">
    <div style="display:flex;gap:8px"><button class="btn btn-primary" style="flex:1" onclick="apriNuovoConto('${clienteId}')">Fai il conto</button>
      <button class="btn btn-outline" style="flex:1" onclick="apriResoconto('${clienteId}')"><span class="fa-icon"><i class="fa-solid fa-file-pdf"></i></span> Resoconto PDF</button></div>
    ${lista.length ? `<div class="clienti-sez-title" style="margin:14px 0 6px">CONTI FATTI</div>` + lista.map((c) => `
      <div onclick="apriInvioConto('${c.id}')" style="display:flex;align-items:center;gap:10px;padding:9px 0;border-top:1px solid var(--border);cursor:pointer">
        <div style="flex:1;min-width:0"><b>${contoCodice(c)}</b><div class="muted" style="font-size:12px">${contoData(c.creato_il)} · ${contoLavori(c.n_lavori)}</div></div>
        <div style="text-align:right"><b>${contoEuro(c.totale)}</b><div style="margin-top:2px">${badge(c.stato)}</div></div>
      </div>`).join("") : ""}
  </div>`;
	}
	function htmlContiAperti(lista, conCliente) {
		if (!lista || !lista.length) return "";
		const tot = lista.reduce((t, c) => t + (Number(c.totale) || 0), 0);
		return `<div class="conti-aperti">
    <div class="conti-aperti-t"><b>Conti mandati, da incassare</b><span>${lista.length} · ${contoEuro(tot)}</span></div>
    ${lista.map((c) => `<button type="button" class="conti-aperti-r" onclick="apriInvioConto('${c.id}')">
      <span class="c"><b>${contoCodice(c)}${conCliente ? " · " + escapeHtml(clienteDiId(c.cliente_mascalcia_id)?.nome || "Cliente") : ""}</b><small>${contoData(c.creato_il)} · ${contoLavori(c.n_lavori)}</small></span>
      <span class="e">${contoEuro(c.totale)}<small>Apri</small></span></button>`).join("")}
  </div>`;
	}
	async function caricaContiAperti(boxId) {
		const box = document.getElementById(boxId);
		if (!box) return;
		if (incassiNascosti()) {
			box.innerHTML = "";
			return;
		}
		box.innerHTML = htmlContiAperti(await ContoDB.aperti(), true);
	}
	// equo-app-src/src/ruoli/maniscalco/moduli/047-incassi-saldati-per-periodo-da-saldare-p.js
	var incMesi = (() => {
		try {
			return Number(localStorage.getItem("equo-inc-mesi")) || 6;
		} catch (e) {
			return 6;
		}
	})();
	var INC_PERIODI = [
		[
			"oggi",
			"Oggi",
			false
		],
		[
			"settimana",
			"Settimana",
			true
		],
		[
			"mese",
			"Mese",
			false
		],
		[
			"anno",
			"Anno",
			true
		],
		[
			"date",
			"Scegli date…",
			true
		]
	];
	function euroTondo(n) {
		return (Number(n) || 0).toLocaleString("it-IT", {
			style: "currency",
			currency: "EUR",
			maximumFractionDigits: Number(n) % 1 ? 2 : 0
		});
	}
	function giornoPagamento(i) {
		return i.saldato_il ? isoLocale(new Date(i.saldato_il)) : i.data_intervento || "";
	}
	function incIntervallo(per) {
		const oggi = /* @__PURE__ */ new Date(), iso = isoLocale(oggi);
		if (per === "oggi") return {
			da: iso,
			a: iso,
			prevDa: aggiungiGiorniIso(iso, -1),
			prevA: aggiungiGiorniIso(iso, -1),
			nome: "oggi",
			prevNome: "ieri"
		};
		if (per === "settimana") {
			const lun = isoLocale(agLunedi(0));
			return {
				da: lun,
				a: aggiungiGiorniIso(lun, 6),
				prevDa: aggiungiGiorniIso(lun, -7),
				prevA: aggiungiGiorniIso(lun, -1),
				nome: "questa settimana",
				prevNome: "la settimana scorsa"
			};
		}
		if (per === "anno") {
			const y = oggi.getFullYear();
			return {
				da: y + "-01-01",
				a: y + "-12-31",
				prevDa: y - 1 + "-01-01",
				prevA: y - 1 + "-12-31",
				nome: String(y),
				prevNome: String(y - 1)
			};
		}
		if (per === "date") {
			const da = document.getElementById("inc-dal").value || aggiungiGiorniIso(iso, -29), a = document.getElementById("inc-al").value || iso;
			const n = giorniTra(da, a) + 1;
			return {
				da,
				a,
				prevDa: aggiungiGiorniIso(da, -n),
				prevA: aggiungiGiorniIso(da, -1),
				nome: formatDataBreve(da) + " – " + formatDataBreve(a),
				prevNome: `i ${n} giorni prima`
			};
		}
		const y = oggi.getFullYear(), m = oggi.getMonth();
		return {
			da: isoLocale(new Date(y, m, 1)),
			a: isoLocale(new Date(y, m + 1, 0)),
			prevDa: isoLocale(new Date(y, m - 1, 1)),
			prevA: isoLocale(new Date(y, m, 0)),
			nome: new Date(y, m, 1).toLocaleDateString("it-IT", { month: "long" }),
			prevNome: new Date(y, m - 1, 1).toLocaleDateString("it-IT", { month: "long" })
		};
	}
	function incSaldatiTra(da, a) {
		return incTutti.filter((i) => i.stato_pagamento === "saldato" && i.stato === "fatto" && (() => {
			const g = giornoPagamento(i);
			return g >= da && g <= a;
		})());
	}
	var incSomma = (l) => l.reduce((t, i) => t + (Number(i.importo) || 0), 0);
	async function renderIncassi$1() {
		const box = document.getElementById("incassi-mese-incassato");
		if (!box) return;
		incTutti = await DB.listInterventiMascalciaTutti();
		const iso = isoLocale(/* @__PURE__ */ new Date()), mese = iso.slice(0, 7);
		const incassatoMese = incSomma(incTutti.filter((i) => i.stato_pagamento === "saldato" && i.stato === "fatto" && giornoPagamento(i).startsWith(mese)));
		const fattiNonSaldati = incTutti.filter((i) => i.stato === "fatto" && i.stato_pagamento !== "saldato");
		const daIncassare = incSomma(fattiNonSaldati);
		const previstoTot = incSomma(incTutti.filter((i) => i.stato === "programmato" && i.stato_pagamento !== "saldato" && Number(i.importo) > 0).sort((a, b) => (a.data_intervento + (a.ora || "")).localeCompare(b.data_intervento + (b.ora || ""))));
		box.textContent = formatEuro(incassatoMese);
		if (typeof wgPro !== "undefined") {
			wgPro.incassatoMese = incassatoMese;
			wgPro.daIncassareMese = daIncassare;
			wgPro.previsto = previstoTot;
			if (typeof wgRidisegna === "function") wgRidisegna();
		}
		const homeTeaser = document.getElementById("home-pro-incassi-mese");
		if (homeTeaser) homeTeaser.textContent = formatEuro(incassatoMese) + " incassati";
		const totalUnread = proUnreadTotal;
		const homeUnread = document.getElementById("home-pro-unread");
		if (homeUnread) homeUnread.textContent = totalUnread > 0 ? `${totalUnread} messagg${totalUnread === 1 ? "io" : "i"} non lett${totalUnread === 1 ? "o" : "i"}` : "Nessun messaggio non letto";
		if (!vistaCompleta() && incVista === "completa") incVista = "semplice";
		document.getElementById("inc-vista").style.display = vistaCompleta() ? "" : "none";
		const prem = isPremium();
		document.getElementById("inc-vista").innerHTML = [["semplice", "Semplice"], ["completa", "Completa"]].map(([k, t]) => `<button role="tab" aria-selected="${incVista === k}" class="${incVista === k ? "on" : ""}" onclick="sceltaVistaIncassi('${k}')">${t}${k === "completa" && !prem ? "<span class=\"stella\" aria-label=\"Premium\">★</span>" : ""}</button>`).join("");
		document.getElementById("inc-titolo").textContent = incVista === "completa" ? "Statistiche" : "Incassi";
		document.getElementById("inc-semplice").hidden = incVista !== "semplice";
		document.getElementById("inc-completa").hidden = incVista !== "completa";
		const oggiIso = iso;
		const perCli = /* @__PURE__ */ new Map();
		fattiNonSaldati.forEach((i) => {
			const k = i.cliente_mascalcia_id || "?";
			if (!perCli.has(k)) perCli.set(k, {
				id: k,
				nome: i.clienti_mascalcia?.nome || "Cliente",
				righe: []
			});
			perCli.get(k).righe.push(i);
		});
		const gruppiDs = [...perCli.values()].map((g) => ({
			...g,
			tot: incSomma(g.righe),
			righe: g.righe.sort((a, b) => a.data_intervento.localeCompare(b.data_intervento))
		})).sort((a, b) => b.tot - a.tot);
		const piuVecchio = fattiNonSaldati.reduce((m, i) => Math.max(m, giorniTra(i.data_intervento, oggiIso)), 0);
		const cDs = document.getElementById("inc-cassa-dasaldare");
		cDs.classList.toggle("aperta", incAperta === "dasaldare");
		cDs.setAttribute("aria-expanded", String(incAperta === "dasaldare"));
		cDs.innerHTML = `<span class="l"><span>Da incassare</span><span>${incAperta === "dasaldare" ? "⌃" : "⌄"}</span></span><span class="v">${euroTondo(daIncassare)}</span>
    <span class="d">${fattiNonSaldati.length ? `${fattiNonSaldati.length} ${fattiNonSaldati.length === 1 ? "lavoro già fatto" : "lavori già fatti"} · ${gruppiDs.length} ${gruppiDs.length === 1 ? "cliente" : "clienti"} · il più vecchio da ${piuVecchio} ${piuVecchio === 1 ? "giorno" : "giorni"}` : "Tutto incassato 👍"}</span>`;
		document.getElementById("inc-det-dasaldare").hidden = incAperta !== "dasaldare";
		document.getElementById("incassi-da-saldare-list").innerHTML = !gruppiDs.length ? "<div class=\"muted\" style=\"font-size:13px\">Nessun pagamento in sospeso.</div>" : gruppiDs.map((g) => `<div class="inc-gruppo"><span>${escapeHtml(g.nome)}</span><span style="display:flex;align-items:center;gap:10px">${euroTondo(g.tot)}${g.id && g.id !== "?" ? `<button type="button" class="btn btn-outline btn-sm" onclick="apriNuovoConto('${g.id}')">Fai il conto</button>` : ""}</span></div>` + g.righe.map((i) => {
			const gg = giorniTra(i.data_intervento, oggiIso);
			return `<div class="inc-voce" data-cerca="${escapeHtml(TIPO_FERRATURA_LABELS[i.tipo_ferratura] || "")}">
          <div class="c"><b>${escapeHtml([i.cavalli_clienti_mascalcia?.nome, TIPO_FERRATURA_LABELS[i.tipo_ferratura] || i.tipo_ferratura].filter(Boolean).join(" · "))}</b>
            <span>${formatDataBreve(i.data_intervento)} · <span class="${gg > 30 ? "inc-vecchio" : ""}">${gg <= 0 ? "oggi" : "da " + gg + (gg === 1 ? " giorno" : " giorni")}</span></span></div>
          <span class="imp">${i.importo != null ? euroTondo(i.importo) : "—"}</span>
          <button class="btn btn-primary btn-sm inc-saldato" onclick="segnaSaldatoIncassi('${i.id}', this)">Saldato</button></div>`;
		}).join("")).join("");
		caricaContiAperti("inc-conti-aperti");
		if (incVista === "completa") await renderIncassiCompleta();
		renderIncassiSaldati();
	}
	function renderIncassiSaldati() {
		const prem = isPremium();
		if (!prem && INC_PERIODI.find((p) => p[0] === incPeriodo)?.[2]) incPeriodo = "mese";
		document.getElementById("inc-periodi").innerHTML = INC_PERIODI.map(([k, t, p]) => `<button class="${incPeriodo === k ? "on" : ""}" onclick="sceltaPeriodoIncassi('${k}')">${t}${p && !prem ? " <span class=\"inc-lucchetto\" aria-label=\"Premium\">🔒</span>" : ""}</button>`).join("");
		document.getElementById("inc-date").hidden = incPeriodo !== "date";
		const r = incIntervallo(incPeriodo);
		const lista = incSaldatiTra(r.da, r.a).sort((a, b) => giornoPagamento(b).localeCompare(giornoPagamento(a)));
		const prev = incSaldatiTra(r.prevDa, r.prevA);
		const tot = incSomma(lista), totPrev = incSomma(prev);
		const diff = totPrev > 0 ? Math.round((tot - totPrev) / totPrev * 100) : null;
		const conImporto = lista.filter((i) => Number(i.importo) > 0);
		const cIn = document.getElementById("inc-cassa-incassati");
		cIn.classList.toggle("aperta", incAperta === "incassati");
		cIn.setAttribute("aria-expanded", String(incAperta === "incassati"));
		cIn.innerHTML = `<span class="l"><span>Incassati · ${escapeHtml(r.nome)}</span><span>${incAperta === "incassati" ? "⌃" : "⌄"}</span></span><span class="v">${euroTondo(tot)}</span>
    <span class="d">${lista.length} ${lista.length === 1 ? "lavoro pagato" : "lavori pagati"}${diff === null ? "" : ` · <span class="${diff >= 0 ? "su" : "giu"}" style="color:var(--${diff >= 0 ? "green" : "red"})">${diff >= 0 ? "▲" : "▼"} ${Math.abs(diff)}%</span> rispetto a ${escapeHtml(r.prevNome)}`}</span>`;
		document.getElementById("inc-det-incassati").hidden = incAperta !== "incassati";
		document.getElementById("inc-kpis").innerHTML = `
    <div class="inc-kpi"><div class="l">${escapeHtml(r.prevNome.charAt(0).toUpperCase() + r.prevNome.slice(1))}</div><div class="v">${euroTondo(totPrev)}</div></div>
    <div class="inc-kpi"><div class="l">Media a lavoro</div><div class="v">${conImporto.length ? euroTondo(Math.round(tot / conImporto.length)) : "—"}</div></div>`;
		const barre = [];
		if (incPeriodo === "settimana" || incPeriodo === "date" && giorniTra(r.da, r.a) <= 31) for (let g = r.da; g <= r.a; g = aggiungiGiorniIso(g, 1)) {
			const d = /* @__PURE__ */ new Date(g + "T12:00");
			barre.push([incPeriodo === "settimana" ? AG_GIORNI[(d.getDay() + 6) % 7].charAt(0) : String(d.getDate()), incSomma(lista.filter((i) => giornoPagamento(i) === g))]);
		}
		else if (incPeriodo === "mese") {
			const fine = Number(r.a.slice(8));
			for (let s0 = 1; s0 <= fine; s0 += 7) {
				const s1 = Math.min(s0 + 6, fine);
				r.da.slice(0, 8);
				barre.push([s0 + "-" + s1, incSomma(lista.filter((i) => {
					const g = Number(giornoPagamento(i).slice(8));
					return g >= s0 && g <= s1;
				}))]);
			}
		} else if (incPeriodo === "anno" || incPeriodo === "date") {
			const mesi = [];
			for (let d = /* @__PURE__ */ new Date(r.da.slice(0, 7) + "-01T12:00"); isoLocale(d).slice(0, 7) <= r.a.slice(0, 7); d.setMonth(d.getMonth() + 1)) mesi.push(isoLocale(d).slice(0, 7));
			mesi.forEach((m) => barre.push([(/* @__PURE__ */ new Date(m + "-01T12:00")).toLocaleDateString("it-IT", { month: "narrow" }), incSomma(lista.filter((i) => giornoPagamento(i).startsWith(m)))]));
		}
		const gc = document.getElementById("inc-grafico-card");
		gc.style.display = barre.length > 1 ? "" : "none";
		const max = Math.max(1, ...barre.map((b) => b[1]));
		const fmtK = (v) => v >= 1e3 ? (v / 1e3).toFixed(1).replace(".", ",").replace(",0", "") + "k" : String(Math.round(v));
		document.getElementById("inc-grafico").innerHTML = barre.map(([l, v]) => `<div class="c" title="${escapeHtml(l)}: ${euroTondo(v)}"><small>${v ? fmtK(v) : ""}</small><div class="b${v ? "" : " zero"}" style="height:${Math.max(2, Math.round(v / max * 78))}px"></div><small>${escapeHtml(l)}</small></div>`).join("");
		const barra = (t, v, maxV) => `<div class="inc-riga"><div class="t"><i style="transform:scaleX(${maxV ? (v / maxV).toFixed(3) : 0})"></i><span>${escapeHtml(t)}</span></div><b>${euroTondo(v)}</b></div>`;
		const perTipo = Object.keys(TIPO_FERRATURA_LABELS).map((k) => [TIPO_FERRATURA_LABELS[k], incSomma(lista.filter((i) => i.tipo_ferratura === k))]).filter((x) => x[1] > 0);
		const mt = Math.max(0, ...perTipo.map((x) => x[1]));
		document.getElementById("inc-per-tipo").innerHTML = perTipo.length ? perTipo.map(([t, v]) => barra(t, v, mt)).join("") : "<div class=\"muted\" style=\"font-size:13px\">Nessun incasso nel periodo.</div>";
		const cli = /* @__PURE__ */ new Map();
		lista.forEach((i) => {
			const n = i.clienti_mascalcia?.nome || "Cliente";
			cli.set(n, (cli.get(n) || 0) + (Number(i.importo) || 0));
		});
		const cliOrd = [...cli.entries()].sort((a, b) => b[1] - a[1]);
		const top = cliOrd.slice(0, 5), altri = cliOrd.slice(5);
		if (altri.length) top.push([`Altri ${altri.length} ${altri.length === 1 ? "cliente" : "clienti"}`, altri.reduce((t, x) => t + x[1], 0)]);
		const mc = Math.max(0, ...top.map((x) => x[1]));
		document.getElementById("inc-per-cliente").innerHTML = top.length ? top.map(([t, v]) => barra(t, v, mc)).join("") : "<div class=\"muted\" style=\"font-size:13px\">Nessun incasso nel periodo.</div>";
		document.getElementById("inc-elenco-n").textContent = lista.length ? String(lista.length) : "";
		const vis = incElencoTutto ? lista : lista.slice(0, 30);
		document.getElementById("inc-elenco").innerHTML = !lista.length ? "<div class=\"muted\" style=\"font-size:13px\">Nessun lavoro saldato nel periodo.</div>" : vis.map((i) => `<div class="inc-voce"><div class="c"><b>${escapeHtml(i.clienti_mascalcia?.nome || "")}${i.cavalli_clienti_mascalcia?.nome ? " · " + escapeHtml(i.cavalli_clienti_mascalcia.nome) : ""}</b>
        <span>${escapeHtml(TIPO_FERRATURA_LABELS[i.tipo_ferratura] || i.tipo_ferratura)} · lavoro ${formatDataBreve(i.data_intervento)}${i.saldato_il ? " · pagato " + formatDataBreve(giornoPagamento(i)) : ""}</span></div>
        <span class="imp">${i.importo != null ? euroTondo(i.importo) : "—"}</span></div>`).join("") + (lista.length > vis.length ? `<button class="btn btn-ghost btn-sm" style="width:100%;margin-top:6px" onclick="incElencoTutto=true;renderIncassiSaldati()">Mostra tutti (${lista.length})</button>` : "");
	}
	function sceltaPeriodoIncassi(k) {
		const p = INC_PERIODI.find((x) => x[0] === k);
		if (p && p[2] && !isPremium()) {
			showToast("Settimana, Anno e date a scelta sono con Premium");
			setTimeout(() => togglePiano(), 400);
			return;
		}
		incPeriodo = k;
		incElencoTutto = false;
		if (k === "date" && !document.getElementById("inc-dal").value) {
			const iso = isoLocale(/* @__PURE__ */ new Date());
			document.getElementById("inc-dal").value = aggiungiGiorniIso(iso, -29);
			document.getElementById("inc-al").value = iso;
		}
		renderIncassi$1();
	}
	function incApri(k) {
		incAperta = incAperta === k ? null : k;
		renderIncassi$1();
	}
	function sceltaVistaIncassi(k) {
		incVista = k;
		try {
			localStorage.setItem("equo-inc-vista", k);
		} catch (e) {}
		renderIncassi$1();
	}
	function sceltaMesiIncassi(n) {
		incMesi = n;
		try {
			localStorage.setItem("equo-inc-mesi", String(n));
		} catch (e) {}
		renderIncassiCompleta();
	}
	// equo-app-src/src/ruoli/maniscalco/moduli/061-pdf-del-conto-dai-dati-salvati-snapshot.js
	async function creaPdfConto(c) {
		const doc = new (await (caricaJsPdf()))({
			unit: "mm",
			format: "a4"
		});
		const W = 210, M = 18, verde = [
			20,
			49,
			42
		], oro = [
			201,
			143,
			46
		], grigio = [
			95,
			111,
			103
		];
		const cli = clienteDiId(c.cliente_mascalcia_id);
		const piede = () => {
			doc.setDrawColor(227, 221, 204);
			doc.line(M, 280, 192, 280);
			doc.setFont("helvetica", "normal");
			doc.setFontSize(8.5);
			doc.setTextColor(...grigio);
			doc.text("Resoconto generato con Equo — equohub.com. Non è una fattura e non ha valore fiscale.", M, 285);
		};
		doc.setFillColor(...verde);
		doc.rect(0, 0, W, 32, "F");
		doc.setTextColor(255, 255, 255);
		doc.setFont("helvetica", "bold");
		doc.setFontSize(22);
		doc.text("Equo", M, 20);
		doc.setFont("helvetica", "normal");
		doc.setFontSize(10);
		doc.text("Prenditi cura del tuo cavallo", M, 26);
		doc.text(contoData(c.creato_il), 192, 20, { align: "right" });
		doc.setFillColor(...oro);
		doc.rect(0, 32, W, 1.5, "F");
		let y = 48;
		doc.setTextColor(...verde);
		doc.setFont("helvetica", "bold");
		doc.setFontSize(17);
		doc.text("Resoconto lavori", M, y);
		doc.setFontSize(12);
		doc.setTextColor(...oro);
		doc.text(contoCodice(c), 192, y, { align: "right" });
		y += 9;
		doc.setFontSize(15);
		doc.setTextColor(...verde);
		doc.text(cli?.nome || "", M, y);
		const pro = currentUser?.datiPagamentoNome || currentUser?.fullName || currentUser?.full_name || "";
		doc.setFont("helvetica", "normal");
		doc.setFontSize(10.5);
		doc.setTextColor(...grigio);
		if (pro) {
			y += 6;
			doc.text(etichettaPro() + ": " + pro + (currentUser?.certificazioneStato === "verificato" ? "  ·  Equo Certified" : ""), M, y);
		}
		if (c.periodo_da || c.periodo_a) {
			y += 5.5;
			doc.text("Periodo: " + (c.periodo_da ? "dal " + contoData(c.periodo_da) + " " : "") + (c.periodo_a ? "al " + contoData(c.periodo_a) : ""), M, y);
		}
		y += 10;
		const colData = 20, colCav = 44, colLav = 96, colImp = 190;
		const testa = () => {
			doc.setFillColor(...verde);
			doc.rect(M, y - 5, 174, 8, "F");
			doc.setFont("helvetica", "bold");
			doc.setFontSize(9.5);
			doc.setTextColor(255, 255, 255);
			doc.text("DATA", colData, y);
			doc.text("CAVALLO", colCav, y);
			doc.text("LAVORO", colLav, y);
			doc.text("IMPORTO", colImp, y, { align: "right" });
			y += 8;
		};
		testa();
		const nuovaPagina = () => {
			piede();
			doc.addPage();
			y = 22;
			testa();
		};
		const gruppi = {};
		(c.righe || []).forEach((r) => {
			(gruppi[r.proprietario_nome || "—"] = gruppi[r.proprietario_nome || "—"] || []).push(r);
		});
		const nomi = Object.keys(gruppi).sort((a, b) => a.localeCompare(b, "it"));
		const conGruppi = c.modo === "unico" && nomi.length > 1 || nomi.length > 1;
		let k = 0;
		nomi.forEach((n) => {
			const lista = gruppi[n].slice().sort((a, b) => String(a.data_intervento).localeCompare(String(b.data_intervento)));
			if (conGruppi) {
				if (y > 262) nuovaPagina();
				doc.setFont("helvetica", "bold");
				doc.setFontSize(10.5);
				doc.setTextColor(...oro);
				doc.text(n, colData, y);
				y += 6;
			}
			lista.forEach((r) => {
				const lav = doc.splitTextToSize(String(r.descrizione || ""), 70);
				const h = Math.max(7.5, lav.length * 4.8 + 2.6);
				if (y + h > 268) nuovaPagina();
				if (k++ % 2 === 0) {
					doc.setFillColor(248, 246, 240);
					doc.rect(M, y - 4.6, 174, h, "F");
				}
				doc.setFont("helvetica", "normal");
				doc.setFontSize(10);
				doc.setTextColor(...grigio);
				doc.text(contoData(r.data_intervento), colData, y);
				doc.setFont("helvetica", "bold");
				doc.setTextColor(...verde);
				doc.text(doc.splitTextToSize(String(r.cavallo_nome || ""), 49), colCav, y);
				doc.setFont("helvetica", "normal");
				doc.setTextColor(...grigio);
				doc.text(lav, colLav, y);
				doc.setFont("helvetica", "bold");
				doc.setTextColor(...verde);
				doc.text(contoEuro(r.importo), colImp, y, { align: "right" });
				y += h;
			});
			if (conGruppi) {
				const sub = gruppi[n].reduce((s, r) => s + Number(r.importo), 0);
				doc.setFont("helvetica", "normal");
				doc.setFontSize(9.5);
				doc.setTextColor(...grigio);
				doc.text("Subtotale " + n, 136, y, { align: "left" });
				doc.setFont("helvetica", "bold");
				doc.text(contoEuro(sub), colImp, y, { align: "right" });
				y += 8;
			}
		});
		if (y > 246) nuovaPagina();
		y += 4;
		doc.setDrawColor(...oro);
		doc.setLineWidth(.6);
		doc.line(M, y, 192, y);
		y += 9;
		doc.setFont("helvetica", "bold");
		doc.setFontSize(12);
		doc.setTextColor(...grigio);
		doc.text(contoLavori(c.n_lavori), M, y);
		doc.setFontSize(17);
		doc.setTextColor(...verde);
		doc.text("TOTALE  " + contoEuro(c.totale), 192, y, { align: "right" });
		y += 12;
		if (c.stato !== "pagato" && (currentUser?.datiPagamentoIban || currentUser?.datiPagamentoPaypal)) {
			if (y > 250) nuovaPagina();
			doc.setFont("helvetica", "bold");
			doc.setFontSize(12);
			doc.setTextColor(...verde);
			doc.text("Dati per il pagamento", M, y);
			y += 7;
			doc.setFont("helvetica", "normal");
			doc.setFontSize(10.5);
			doc.setTextColor(...grigio);
			if (currentUser.datiPagamentoNome) {
				doc.text("Intestatario: " + currentUser.datiPagamentoNome, M, y);
				y += 6;
			}
			if (currentUser.datiPagamentoIban) {
				doc.text("IBAN: " + currentUser.datiPagamentoIban, M, y);
				y += 6;
			}
			if (currentUser.datiPagamentoPaypal) {
				doc.text("PayPal: " + currentUser.datiPagamentoPaypal, M, y);
				y += 6;
			}
			doc.text("Causale: Conto " + contoCodice(c), M, y);
		} else if (c.stato === "pagato") {
			doc.setFont("helvetica", "bold");
			doc.setFontSize(12);
			doc.setTextColor(...verde);
			doc.text("Conto saldato" + (c.pagato_il ? " il " + contoData(c.pagato_il) : ""), M, y);
		}
		y = riquadroInvitoPdf(doc, cli, y + 6, W, M, () => {
			piede();
			doc.addPage();
			return 22;
		});
		piede();
		return {
			blob: doc.output("blob"),
			nome: contoNomeFile(c)
		};
	}
	// equo-app-src/src/ruoli/maniscalco/moduli/060-foglio-di-invio-gestione-del-conto.js
	async function apriInvioConto(id) {
		const c = await ContoDB.completo(id);
		if (!c) {
			showToast("Conto non trovato");
			return;
		}
		contoAperto = c;
		const cli = clienteDiId(c.cliente_mascalcia_id);
		const stato = c.stato === "pagato" ? "<span class=\"badge badge-green\">Pagato</span>" : c.stato === "annullato" ? "<span class=\"badge\">Annullato</span>" : "<span class=\"badge badge-red\">Da incassare</span>";
		document.getElementById("conto-invio-titolo").textContent = "Conto " + contoCodice(c);
		document.getElementById("conto-invio-corpo").innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><div><b>${escapeHtml(cli?.nome || "")}</b><div class="muted" style="font-size:12px">${contoLavori(c.n_lavori)} · ${contoData(c.creato_il)}</div></div><div style="text-align:right"><b style="font-size:20px">${contoEuro(c.totale)}</b><div>${stato}</div></div></div>
    <div class="ag-azioni" style="margin-top:14px">
      ${c.stato !== "annullato" ? `
      <button class="btn btn-primary" onclick="contoInviaChat()"><span class="fa-icon"><i class="fa-solid fa-comment"></i></span> Invia in chat Equo</button>
      <button class="btn btn-outline" onclick="contoCondividi()"><span class="fa-icon"><i class="fa-solid fa-share-nodes"></i></span> Email, WhatsApp, altro…</button>
      <button class="btn btn-outline" onclick="contoScarica()"><span class="fa-icon"><i class="fa-solid fa-file-pdf"></i></span> Scarica il PDF</button>` : ""}
      ${c.stato === "da_incassare" ? `
      <button class="btn btn-outline" onclick="contoSegnaPagato()"><span class="fa-icon"><i class="fa-solid fa-check"></i></span> Segna pagato</button>
      <button class="btn btn-outline" style="color:var(--red)" onclick="contoAnnulla()"><span class="fa-icon"><i class="fa-solid fa-ban"></i></span> Annulla il conto</button>` : ""}
    </div>`;
		openModal("modal-conto-invio");
	}
	async function contoInviaChat() {
		const c = contoAperto;
		if (!c) return;
		closeModal("modal-conto-invio");
		await openChatThread(c.cliente_mascalcia_id);
		document.getElementById("mchat-input").value = `Conto ${contoCodice(c)}: ${c.n_lavori} lavori · totale ${contoEuro(c.totale)}`;
		chatAllegatoEvento = { __conto: c };
		document.getElementById("mchat-allegato-nome").textContent = contoNomeFile(c);
		document.getElementById("mchat-allegato").classList.add("active");
	}
	function contoNomeFile(c) {
		const n = String(clienteDiId(c.cliente_mascalcia_id)?.nome || "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "");
		return [
			"Equo",
			"Conto",
			contoCodice(c),
			n
		].filter(Boolean).join("_") + ".pdf";
	}
	async function contoCondividi() {
		const c = contoAperto;
		if (!c) return;
		showToast("Creo il PDF…");
		try {
			const { blob, nome } = await creaPdfConto(c);
			const file = new File([blob], nome, { type: "application/pdf" });
			if (navigator.canShare && navigator.canShare({ files: [file] })) try {
				await navigator.share({
					files: [file],
					title: nome,
					text: `Conto ${contoCodice(c)} · totale ${contoEuro(c.totale)}`
				});
				return;
			} catch (err) {
				if (err?.name === "AbortError") return;
			}
			contoScaricaBlob(blob, nome);
			showToast("Il PDF è stato scaricato: allegalo alla tua email o a WhatsApp.");
		} catch (err) {
			console.error("contoCondividi:", err);
			showToast("Impossibile creare il PDF: " + (err?.message || err));
		}
	}
	function contoScaricaBlob(blob, nome) {
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = nome;
		document.body.appendChild(a);
		a.click();
		a.remove();
		setTimeout(() => URL.revokeObjectURL(url), 3e4);
	}
	async function contoScarica() {
		const c = contoAperto;
		if (!c) return;
		try {
			const { blob, nome } = await creaPdfConto(c);
			contoScaricaBlob(blob, nome);
		} catch (err) {
			console.error("contoScarica:", err);
			showToast("Impossibile creare il PDF: " + (err?.message || err));
		}
	}
	async function contoSegnaPagato() {
		const c = contoAperto;
		if (!c) return;
		if (!await chiediSiNo("Conto pagato?", `${c.n_lavori === 1 ? "Il lavoro" : "Tutti i " + c.n_lavori + " lavori"} del conto ${contoCodice(c)} (${contoEuro(c.totale)}) ${c.n_lavori === 1 ? "risulterà saldato" : "risulteranno saldati"}.`)) return;
		const { error } = await ContoDB.pagato(c.id);
		if (error) {
			showToast("Errore: " + (error.message || "riprova"));
			return;
		}
		closeModal("modal-conto-invio");
		showToast("Conto pagato: lavori saldati");
		if (currentClienteId) {
			caricaContiCliente(currentClienteId);
			loadClienteInterventi(currentClienteId);
		}
		if (typeof renderIncassi$1 === "function") renderIncassi$1();
		if (typeof agAggiornaSchede === "function") agAggiornaSchede();
	}
	async function contoAnnulla() {
		const c = contoAperto;
		if (!c) return;
		if (!await chiediSiNo("Annullare il conto?", `Il conto ${contoCodice(c)} resta nell'elenco come «annullato» e i suoi lavori tornano da saldare: potrai rifarlo.`)) return;
		const { error } = await ContoDB.annulla(c.id);
		if (error) {
			showToast("Errore: " + (error.message || "riprova"));
			return;
		}
		closeModal("modal-conto-invio");
		showToast("Conto annullato");
		if (currentClienteId) caricaContiCliente(currentClienteId);
		if (typeof renderIncassi$1 === "function") renderIncassi$1();
		if (typeof agAggiornaSchede === "function") agAggiornaSchede();
	}
	// equo-app-src/src/ruoli/maniscalco/moduli/059-foglio-fai-il-conto.js
	async function apriNuovoConto(clienteId) {
		if (incassiNascosti()) {
			showToast("Hai nascosto gli incassi: mostrali dal menu (serve il PIN) per fare il conto.");
			return;
		}
		if (!clienteDiId(clienteId)) await loadClientiMascalcia().catch(() => {});
		const cli = clienteDiId(clienteId);
		contoCtx = {
			clienteId,
			scuderia: eLuogoScuderia(cli),
			modo: "unico",
			periodo: "tutto",
			da: "",
			a: "",
			tutti: [],
			lavori: [],
			sel: /* @__PURE__ */ new Set()
		};
		document.getElementById("conto-nuovo-titolo").textContent = "Conto · " + (cli?.nome || "cliente");
		document.getElementById("conto-nuovo-corpo").innerHTML = "<div class=\"loading\"><div class=\"spinner\"></div> Carico i lavori…</div>";
		openModal("modal-conto-nuovo");
		await caricaCavalliMiei().catch(() => {});
		[contoCtx.tutti, contoCtx.aperti] = await Promise.all([ContoDB.lavoriLiberi(clienteId), ContoDB.aperti(clienteId)]);
		contoApplicaPeriodo();
	}
	function contoApriEsistente(id) {
		closeModal("modal-conto-nuovo");
		apriInvioConto(id);
	}
	async function contoAnnullaERifai(id) {
		const c = (contoCtx?.aperti || []).find((x) => x.id === id);
		if (!c) return;
		if (!await chiediSiNo("Annullare e rifare il conto?", `Il conto ${contoCodice(c)} diventa «annullato» e i suoi ${contoLavori(c.n_lavori)} tornano liberi: subito dopo puoi fare il conto nuovo, anche con i lavori aggiunti nel frattempo.`)) return;
		const { error } = await ContoDB.annulla(id);
		if (error) {
			showToast("Errore: " + (error.message || "riprova"));
			return;
		}
		showToast("Conto " + contoCodice(c) + " annullato");
		[contoCtx.tutti, contoCtx.aperti] = await Promise.all([ContoDB.lavoriLiberi(contoCtx.clienteId), ContoDB.aperti(contoCtx.clienteId)]);
		contoApplicaPeriodo();
		if (currentClienteId) caricaContiCliente(currentClienteId);
		if (typeof renderIncassi$1 === "function") renderIncassi$1();
	}
	function contoApplicaPeriodo() {
		const c = contoCtx;
		if (!c) return;
		const oggi = /* @__PURE__ */ new Date(), iso = isoLocale;
		let da = "", a = "";
		if (c.periodo === "mese") {
			da = iso(new Date(oggi.getFullYear(), oggi.getMonth(), 1));
			a = iso(new Date(oggi.getFullYear(), oggi.getMonth() + 1, 0));
		} else if (c.periodo === "scorso") {
			da = iso(new Date(oggi.getFullYear(), oggi.getMonth() - 1, 1));
			a = iso(new Date(oggi.getFullYear(), oggi.getMonth(), 0));
		} else if (c.periodo === "date") {
			da = c.da;
			a = c.a;
		}
		c.pDa = da;
		c.pA = a;
		c.lavori = c.tutti.filter((i) => (!da || i.data_intervento >= da) && (!a || i.data_intervento <= a));
		c.sel = new Set(c.lavori.map((i) => i.id));
		renderNuovoConto();
	}
	function contoSetPeriodo(p) {
		contoCtx.periodo = p;
		if (p !== "date") contoApplicaPeriodo();
		else renderNuovoConto();
	}
	function contoSetDate() {
		contoCtx.da = document.getElementById("conto-da").value;
		contoCtx.a = document.getElementById("conto-a").value;
		contoApplicaPeriodo();
	}
	function contoSetModo(m) {
		contoCtx.modo = m;
		renderNuovoConto();
	}
	function contoToggleGruppo(nome) {
		const c = contoCtx;
		if (!c) return;
		const ids = c.lavori.filter((i) => contoNomeProprietario(i) === nome).map((i) => i.id);
		const tutti = ids.every((id) => c.sel.has(id));
		ids.forEach((id) => tutti ? c.sel.delete(id) : c.sel.add(id));
		renderNuovoConto();
	}
	function contoToggle(id) {
		contoCtx.sel.has(id) ? contoCtx.sel.delete(id) : contoCtx.sel.add(id);
		renderNuovoConto();
	}
	function contoNomeProprietario(i) {
		return clienteDiId(i.cliente_mascalcia_id)?.nome || "Cliente";
	}
	function contoNomeCavallo(i) {
		return agNomeCavallo(i) || clienteDiId(i.cliente_mascalcia_id)?.nome_cavallo || "Cavallo";
	}
	function renderNuovoConto() {
		const c = contoCtx;
		if (!c) return;
		const chip = (k, t) => `<button type="button" class="btn ${c.periodo === k ? "btn-primary" : "btn-outline"} btn-sm" onclick="contoSetPeriodo('${k}')">${t}</button>`;
		const scelti = c.lavori.filter((i) => c.sel.has(i.id));
		const tot = scelti.reduce((s, i) => s + Number(i.importo), 0);
		const gruppi = {};
		c.lavori.forEach((i) => {
			(gruppi[contoNomeProprietario(i)] = gruppi[contoNomeProprietario(i)] || []).push(i);
		});
		const nomi = Object.keys(gruppi).sort((a, b) => a.localeCompare(b, "it"));
		const nPag = new Set(scelti.map((i) => i.cliente_mascalcia_id)).size;
		const modoHtml = c.scuderia ? `<div class="clienti-sez-title" style="margin:14px 0 6px">CHI PAGA</div>
    <div style="display:flex;gap:6px;flex-wrap:wrap">
      <button type="button" class="btn ${c.modo === "unico" ? "btn-primary" : "btn-outline"} btn-sm" onclick="contoSetModo('unico')">Paga la scuderia · conto unico</button>
      <button type="button" class="btn ${c.modo === "per_proprietario" ? "btn-primary" : "btn-outline"} btn-sm" onclick="contoSetModo('per_proprietario')">Un conto per proprietario</button>
    </div>` : "";
		document.getElementById("conto-nuovo-corpo").innerHTML = `
    ${modoHtml}
    <div class="clienti-sez-title" style="margin:14px 0 6px">PERIODO</div>
    <div style="display:flex;gap:6px;flex-wrap:wrap">${chip("tutto", "Non ancora saldato")}${chip("mese", "Questo mese")}${chip("scorso", "Mese scorso")}${chip("date", "Scegli le date")}</div>
    ${c.periodo === "date" ? `<div style="display:flex;gap:8px;margin-top:8px"><input class="input" type="date" id="conto-da" value="${c.da}" onchange="contoSetDate()"><input class="input" type="date" id="conto-a" value="${c.a}" onchange="contoSetDate()"></div>` : ""}
    <div class="clienti-sez-title" style="margin:14px 0 6px">LAVORI INCLUSI (${scelti.length} di ${c.lavori.length})</div>
    ${c.lavori.length ? nomi.map((n) => `
      ${c.scuderia || nomi.length > 1 ? `<label style="display:flex;align-items:center;gap:10px;margin:10px 0 2px;font-size:13px;font-weight:700;color:var(--accent)">
        <input type="checkbox" data-gruppo="${escapeHtml(n)}" ${gruppi[n].every((i) => c.sel.has(i.id)) ? "checked" : ""} onchange="contoToggleGruppo(this.dataset.gruppo)">
        <span style="flex:1">${escapeHtml(n)}</span><span class="muted" style="font-size:12px;font-weight:600">${gruppi[n].filter((i) => c.sel.has(i.id)).length}/${gruppi[n].length}</span></label>` : ""}
      ${gruppi[n].map((i) => `<label style="display:flex;align-items:center;gap:10px;padding:7px 0;border-top:1px solid var(--border)">
        <input type="checkbox" ${c.sel.has(i.id) ? "checked" : ""} onchange="contoToggle('${i.id}')">
        <span style="flex:1;min-width:0"><b>${escapeHtml(contoNomeCavallo(i))}</b><span class="muted" style="font-size:12px;display:block">${contoData(i.data_intervento)} · ${escapeHtml(agDescrizioneTipo(i))}</span></span>
        <b>${contoEuro(i.importo)}</b></label>`).join("")}`).join("") : (c.aperti || []).length ? `<div class="conto-gia">
          <b>${c.tutti.length ? "In questo periodo non ci sono altri lavori da mettere nel conto." : "Tutti i lavori da saldare sono già in un conto."}</b>
          ${c.aperti.map((k) => `<div class="conto-gia-r"><span><b>${contoCodice(k)}</b> del ${contoData(k.creato_il)} · ${contoLavori(k.n_lavori)} · ${contoEuro(k.totale)}<small>Da incassare</small></span>
            <span class="conto-gia-a"><button type="button" class="btn btn-primary btn-sm" onclick="contoApriEsistente('${k.id}')">Apri il conto</button><button type="button" class="btn btn-outline btn-sm" onclick="contoAnnullaERifai('${k.id}')">Annulla e rifai</button></span></div>`).join("")}
        </div>` : "<div class=\"muted\" style=\"font-size:13px;padding:8px 0\">Nessun lavoro da saldare in questo periodo.</div>"}
    <div style="display:flex;justify-content:space-between;align-items:center;margin-top:14px;padding-top:12px;border-top:2px solid var(--border)"><span style="font-weight:700">Totale</span><b style="font-size:20px">${contoEuro(tot)}</b></div>
    ${c.scuderia && c.modo === "per_proprietario" && nPag > 1 ? `<div class="muted" style="font-size:12px;margin-top:6px">Verranno creati ${nPag} conti, uno per ciascun proprietario.</div>` : ""}
    <button class="btn btn-primary" id="conto-crea-btn" style="width:100%;margin-top:14px" ${scelti.length ? "" : "disabled"} onclick="creaContoDaScelte()">Crea il PDF</button>
    <div class="muted" style="font-size:11.5px;line-height:1.5;margin-top:8px">Il conto prende un numero e resta salvato. Non è una fattura.</div>`;
		document.querySelectorAll("#conto-nuovo-corpo input[data-gruppo]").forEach((cb) => {
			const l = gruppi[cb.dataset.gruppo] || [], n = l.filter((i) => c.sel.has(i.id)).length;
			cb.indeterminate = n > 0 && n < l.length;
		});
	}
	async function creaContoDaScelte() {
		const c = contoCtx;
		if (!c) return;
		const btn = document.getElementById("conto-crea-btn");
		btn.disabled = true;
		const scelti = c.lavori.filter((i) => c.sel.has(i.id));
		const riga = (i) => ({
			intervento_id: i.id,
			cavallo_nome: contoNomeCavallo(i),
			proprietario_nome: contoNomeProprietario(i),
			descrizione: agDescrizioneTipo(i)
		});
		const per = c.scuderia && c.modo === "per_proprietario";
		const mappa = /* @__PURE__ */ new Map();
		scelti.forEach((i) => {
			const k = per ? i.cliente_mascalcia_id : c.clienteId;
			(mappa.get(k) || mappa.set(k, []).get(k)).push(i);
		});
		const creati = [];
		for (const [clienteId, lav] of mappa) {
			const { data, error } = await ContoDB.crea(clienteId, per ? "per_proprietario" : "unico", c.pDa || null, c.pA || null, lav.map(riga));
			if (error) {
				showToast("Conto non creato: " + (error.message || "riprova"));
				btn.disabled = false;
				break;
			}
			creati.push(data);
		}
		if (!creati.length) return;
		closeModal("modal-conto-nuovo");
		contoCtx = null;
		if (currentClienteId) caricaContiCliente(currentClienteId);
		if (typeof renderIncassi$1 === "function") renderIncassi$1();
		if (creati.length === 1) return apriInvioConto(creati[0].id);
		showToast(creati.length + " conti creati: li trovi nella scheda di ogni proprietario");
	}
	// equo-app-src/src/ruoli/maniscalco/moduli/111-promemoria-personali.js
	var PM_AZIONI = {
		conto: "Fai il conto",
		chat: "Scrivi al cliente",
		naviga: "Naviga"
	};
	var pmCache = {};
	var pmInModifica = null;
	var pmOra = (q) => new Date(q).toLocaleTimeString("it-IT", {
		hour: "2-digit",
		minute: "2-digit"
	});
	var pmGiorno = (q) => isoLocale(new Date(q));
	var pmNomeCliente = (p) => p?.clienti_mascalcia?.nome || clientiMascalcia?.find?.((c) => c.id === p?.cliente_mascalcia_id)?.nome || "";
	var PmDB = {
		async periodo(daIso, aIso) {
			if (DEMO_MODE) return (demoState.promemoria || []).filter((p) => p.stato !== "annullato" && pmGiorno(p.quando) >= daIso && pmGiorno(p.quando) <= aIso);
			const da = (/* @__PURE__ */ new Date(daIso + "T00:00:00")).toISOString(), a = (/* @__PURE__ */ new Date(aIso + "T23:59:59")).toISOString();
			const { data, error } = await sb.from("promemoria_personali").select("*, clienti_mascalcia(nome)").eq("user_id", currentUser.id).neq("stato", "annullato").gte("quando", da).lte("quando", a).order("quando", { ascending: true }).limit(200);
			if (error) {
				if (!/does not exist|schema cache/i.test(error.message || "")) console.warn("promemoria:", error.message);
				return [];
			}
			return data || [];
		},
		async daFareFinoAOggi() {
			if (DEMO_MODE) return (demoState.promemoria || []).filter((p) => p.stato === "attivo" && pmGiorno(p.quando) <= isoLocale(/* @__PURE__ */ new Date()));
			const fine = (/* @__PURE__ */ new Date(isoLocale(/* @__PURE__ */ new Date()) + "T23:59:59")).toISOString();
			const { data, error } = await sb.from("promemoria_personali").select("*, clienti_mascalcia(nome)").eq("user_id", currentUser.id).eq("stato", "attivo").lte("quando", fine).order("quando", { ascending: true }).limit(30);
			if (error) return [];
			return data || [];
		},
		async uno(id) {
			if (pmCache[id]) return pmCache[id];
			if (DEMO_MODE) return (demoState.promemoria || []).find((p) => p.id === id) || null;
			const { data } = await sb.from("promemoria_personali").select("*, clienti_mascalcia(nome)").eq("id", id).maybeSingle();
			if (data) pmCache[id] = data;
			return data || null;
		},
		async salva(id, campi) {
			if (DEMO_MODE) {
				demoState.promemoria = demoState.promemoria || [];
				if (id) {
					Object.assign(demoState.promemoria.find((p) => p.id === id) || {}, campi);
					return { error: null };
				}
				demoState.promemoria.push({
					id: "pm" + Date.now(),
					stato: "attivo",
					user_id: currentUser.id,
					...campi
				});
				return { error: null };
			}
			const { error } = await (id ? sb.from("promemoria_personali").update(campi).eq("id", id) : sb.from("promemoria_personali").insert({
				user_id: currentUser.id,
				...campi
			}));
			if (id) delete pmCache[id];
			return { error };
		}
	};
	var pmTabellaMancante = (e) => /does not exist|schema cache|promemoria_personali/i.test(e?.message || "");
	function pmApriNuovo(preset) {
		pmInModifica = null;
		pmRiempi(preset || {});
	}
	async function pmModifica(id) {
		const p = await PmDB.uno(id);
		if (!p) return;
		pmInModifica = p;
		pmRiempi({
			testo: p.testo,
			data: pmGiorno(p.quando),
			ora: pmOra(p.quando),
			cliente_mascalcia_id: p.cliente_mascalcia_id,
			azione: p.azione
		});
	}
	function pmRiempi(x) {
		document.getElementById("pm-tit").textContent = pmInModifica ? "Modifica promemoria" : "Nuovo promemoria";
		document.getElementById("pm-testo").value = x.testo || "";
		document.getElementById("pm-data").value = x.data || aggiungiGiorniIso(isoLocale(/* @__PURE__ */ new Date()), 1);
		document.getElementById("pm-data").min = isoLocale(/* @__PURE__ */ new Date());
		document.getElementById("pm-ora").value = x.ora || "08:00";
		const sel = document.getElementById("pm-cliente");
		sel.innerHTML = "<option value=\"\">Nessun cliente</option>" + (clientiMascalcia || []).filter((c) => !c.archiviato_il).slice().sort((a, b) => (a.nome || "").localeCompare(b.nome || "", "it", { sensitivity: "base" })).map((c) => `<option value="${c.id}">${escapeHtml(c.nome)}</option>`).join("");
		sel.value = x.cliente_mascalcia_id || "";
		document.getElementById("pm-azione").value = x.azione || "";
		pmAggiornaAzione();
		pmAggiornaQuando();
		document.getElementById("pm-errore").style.display = "none";
		document.getElementById("pm-elimina").style.display = pmInModifica ? "" : "none";
		openModal("modal-promemoria");
		if (!pmInModifica) setTimeout(() => document.getElementById("pm-testo").focus(), 250);
	}
	function pmQuando(g) {
		document.getElementById("pm-data").value = aggiungiGiorniIso(isoLocale(/* @__PURE__ */ new Date()), g);
		pmAggiornaQuando();
	}
	function pmAggiornaQuando() {
		const v = document.getElementById("pm-data").value, oggi = isoLocale(/* @__PURE__ */ new Date());
		document.querySelectorAll("#pm-quando button").forEach((b) => b.classList.toggle("on", v === aggiungiGiorniIso(oggi, Number(b.dataset.q))));
	}
	function pmAggiornaAzione() {
		const c = document.getElementById("pm-cliente").value;
		document.getElementById("pm-azione-box").style.display = c ? "" : "none";
		if (!c) document.getElementById("pm-azione").value = "";
	}
	async function pmSalva() {
		const err = document.getElementById("pm-errore");
		const testo = document.getElementById("pm-testo").value.replace(/\s+/g, " ").trim();
		const data = document.getElementById("pm-data").value, ora = document.getElementById("pm-ora").value || "08:00";
		const mostra = (t) => {
			err.textContent = t;
			err.style.display = "block";
		};
		if (!testo) return mostra("Scrivi cosa devo ricordarti.");
		if (!data) return mostra("Scegli il giorno.");
		const quando = /* @__PURE__ */ new Date(data + "T" + ora);
		if (quando.getTime() < Date.now() - 6e4) return mostra("Scegli un'ora che non sia già passata.");
		const cliente = document.getElementById("pm-cliente").value || null;
		const campi = {
			testo: testo.slice(0, 300),
			quando: quando.toISOString(),
			cliente_mascalcia_id: cliente,
			azione: cliente ? document.getElementById("pm-azione").value || null : null,
			stato: "attivo"
		};
		if (!pmInModifica) campi.creato_da = "utente";
		const btn = document.getElementById("pm-salva");
		btn.disabled = true;
		const { error } = await PmDB.salva(pmInModifica?.id || null, campi);
		btn.disabled = false;
		if (error) return mostra(pmTabellaMancante(error) ? "I promemoria saranno disponibili dopo l'aggiornamento di Equo." : "Non salvato: " + error.message);
		closeModal("modal-promemoria");
		showToast(`Promemoria ${pmInModifica ? "aggiornato" : "salvato"}: ${formatDataBreve(data)} ore ${ora}`);
		pmInModifica = null;
		pmAggiornaViste();
	}
	async function pmElimina() {
		if (!pmInModifica) return;
		if (!confirm("Eliminare questo promemoria?")) return;
		const { error } = await PmDB.salva(pmInModifica.id, { stato: "annullato" });
		if (error) {
			showToast("Errore: " + error.message);
			return;
		}
		closeModal("modal-promemoria");
		pmInModifica = null;
		showToast("Promemoria eliminato");
		pmAggiornaViste();
	}
	async function pmFatto(id, btn) {
		if (btn) btn.disabled = true;
		const fatto = (await PmDB.uno(id))?.stato === "fatto";
		const { error } = await PmDB.salva(id, { stato: fatto ? "attivo" : "fatto" });
		if (error) {
			if (btn) btn.disabled = false;
			showToast("Errore: " + error.message);
			return;
		}
		showToast(fatto ? "Rimesso da fare" : "✓ Fatto");
		pmSegnaInChat(id, fatto ? null : "✓ Fatto");
		pmAggiornaViste();
	}
	async function pmDomani(id, btn) {
		if (btn) btn.disabled = true;
		const p = await PmDB.uno(id);
		if (!p) {
			if (btn) btn.disabled = false;
			return;
		}
		const base = new Date(Math.max(Date.now(), new Date(p.quando).getTime()));
		const d = new Date(base);
		d.setDate(d.getDate() + 1);
		if (d.getDay() === 0) d.setDate(d.getDate() + 1);
		const ora = pmOra(p.quando);
		const quando = /* @__PURE__ */ new Date(isoLocale(d) + "T" + ora);
		const { error } = await PmDB.salva(id, {
			quando: quando.toISOString(),
			stato: "attivo"
		});
		if (error) {
			if (btn) btn.disabled = false;
			showToast("Errore: " + error.message);
			return;
		}
		showToast(`Rimandato a ${formatDataBreve(isoLocale(d))} ore ${ora}`);
		pmSegnaInChat(id, `↻ Rimandato a ${formatDataBreve(isoLocale(d))} ore ${ora}`);
		pmAggiornaViste();
	}
	async function pmEsegui(id) {
		const p = await PmDB.uno(id);
		if (!p) return;
		const cid = p.cliente_mascalcia_id;
		if (!cid || !p.azione) return pmModifica(id);
		if (typeof closeAiSheet === "function" && document.body.classList.contains("ai-aperta")) closeAiSheet();
		if (p.azione === "conto") return apriNuovoConto(cid);
		if (p.azione === "chat") {
			if (typeof showPage === "function") showPage("pro-inbox");
			return typeof openChatThread === "function" ? openChatThread(cid) : null;
		}
		if (p.azione === "naviga") return typeof wgNaviga === "function" ? wgNaviga(cid) : null;
	}
	function pmSegnaInChat(id, esito) {
		document.querySelectorAll(`.pm-tasti[data-pm="${id}"]`).forEach((el) => {
			if (esito) el.innerHTML = `<span class="pm-esito">${escapeHtml(esito)}</span>`;
		});
	}
	function pmTastiHtml(p, compatto) {
		const az = p.azione && p.cliente_mascalcia_id ? `<button type="button" class="btn btn-primary btn-sm" onclick="pmEsegui('${p.id}')">${PM_AZIONI[p.azione]}</button>` : "";
		if (p.stato === "fatto") return `<span class="pm-esito">✓ Fatto</span>`;
		return `${az}<button type="button" class="btn btn-outline btn-sm" onclick="pmFatto('${p.id}', this)">Fatto</button>${compatto ? "" : `<button type="button" class="btn btn-outline btn-sm" onclick="pmDomani('${p.id}', this)">Domani</button>`}`;
	}
	function pmTastiChat(azione) {
		if (!azione || azione.tipo !== "promemoria" || !azione.id) return "";
		const p = {
			id: azione.id,
			azione: azione.azione,
			cliente_mascalcia_id: azione.cliente_mascalcia_id,
			stato: "attivo"
		};
		return `<div class="pm-tasti" data-pm="${azione.id}">${pmTastiHtml(p)}</div>`;
	}
	async function pmRenderHome$1() {
		const box = document.getElementById("hm-promemoria");
		if (!box || !currentUser) return;
		const lista = await PmDB.daFareFinoAOggi();
		lista.forEach((p) => {
			pmCache[p.id] = p;
		});
		const oggi = isoLocale(/* @__PURE__ */ new Date());
		box.innerHTML = !lista.length ? "" : `<div class="pm-home">
    <div class="pm-home-t"><b>🔔 Da ricordare</b><button type="button" onclick="pmApriNuovo()">+ Nuovo</button></div>
    ${lista.map((p) => {
			const g = pmGiorno(p.quando), cli = pmNomeCliente(p);
			return `<div class="pm-riga"><div class="pm-riga-c" onclick="pmModifica('${p.id}')"><b>${escapeHtml(p.testo)}</b><small>${g < oggi ? `<span class="pm-ritardo">${formatDataBreve(g)}</span> · ` : ""}ore ${pmOra(p.quando)}${cli ? " · " + escapeHtml(cli) : ""}</small></div><div class="pm-tasti">${pmTastiHtml(p, true)}</div></div>`;
		}).join("")}
  </div>`;
	}
	async function pmCaricaSettimana(daIso, aIso) {
		const lista = await PmDB.periodo(daIso, aIso);
		lista.forEach((p) => {
			pmCache[p.id] = p;
		});
		return lista;
	}
	function pmPannelloGiorno(lista) {
		if (!lista || !lista.length) return "";
		return `<div class="pm-giorno"><div class="pm-giorno-t">🔔 Promemoria</div>
    ${lista.map((p) => {
			const cli = pmNomeCliente(p);
			return `<div class="pm-riga${p.stato === "fatto" ? " fatto" : ""}"><span class="pm-ora">${pmOra(p.quando)}</span><div class="pm-riga-c" onclick="pmModifica('${p.id}')"><b>${escapeHtml(p.testo)}</b>${cli ? `<small>${escapeHtml(cli)}</small>` : ""}</div><div class="pm-tasti">${pmTastiHtml(p, true)}</div></div>`;
		}).join("")}
  </div>`;
	}
	function pmAggiornaViste() {
		pmCache = {};
		pmRenderHome$1();
		if (typeof renderAgendaSettimana === "function" && document.getElementById("page-pro-agenda")?.classList.contains("active")) renderAgendaSettimana();
	}
	async function pmSalvaDaHammer(x) {
		const quando = /* @__PURE__ */ new Date(x.data + "T" + (x.ora || "08:00"));
		if (quando.getTime() < Date.now() - 6e4) return { error: { message: "l'ora è già passata" } };
		const r = await PmDB.salva(null, {
			testo: x.testo,
			quando: quando.toISOString(),
			cliente_mascalcia_id: x.cliente_mascalcia_id || null,
			azione: x.cliente_mascalcia_id ? x.azione || null : null,
			creato_da: "hammer",
			stato: "attivo"
		});
		if (r.error && pmTabellaMancante(r.error)) return { error: { message: "i promemoria saranno disponibili dopo l'aggiornamento di Equo" } };
		if (!r.error) pmAggiornaViste();
		return r;
	}
	// equo-app-src/src/ruoli/maniscalco/moduli/055-appuntamenti-con-strutture-equo-scuderia.js
	async function azioneGruppoStruttura(gruppoId, azione) {
		const { data, error } = await sb.rpc("pro_azione_appuntamento_struttura", {
			p_gruppo_id: gruppoId,
			p_azione: azione
		});
		if (error || !data?.ok) {
			showToast(data && data.errore || "Operazione non riuscita: " + (error?.message || "riprova"));
			return;
		}
		showToast(azione === "conferma" ? "Confermato: la scuderia riceve l'avviso." : azione === "rifiuta" ? "Richiesta rifiutata." : "Appuntamento annullato.");
		await renderAgendaSettimana$1();
		await renderProDeadlines();
		if (currentClienteId) await loadClienteInterventi(currentClienteId);
	}
	var propStrutturaClienteId = null;
	async function apriPropostaStruttura(clienteId, preset) {
		propStrutturaClienteId = clienteId;
		const c = clientiMascalcia.find((x) => x.id === clienteId);
		document.getElementById("prop-str-nome").textContent = c?.nome || "Scuderia";
		const p = preset || {};
		document.getElementById("prop-str-tipo").value = p.tipo_ferratura || "ferratura";
		document.getElementById("prop-str-tipo-altro").value = p.tipo_altro || "";
		document.getElementById("prop-str-tipo-altro-group").style.display = p.tipo_ferratura === "altro" ? "flex" : "none";
		document.getElementById("prop-str-data").value = p.data_intervento || "";
		document.getElementById("prop-str-data").min = isoLocale(/* @__PURE__ */ new Date());
		document.getElementById("prop-str-ora").value = p.ora ? String(p.ora).slice(0, 5) : "";
		document.getElementById("prop-str-importo").value = "";
		document.getElementById("prop-str-note").value = "";
		document.getElementById("prop-str-error").style.display = "none";
		const box = document.getElementById("prop-str-cavalli");
		box.innerHTML = "<div class=\"muted\" style=\"font-size:13px\">Caricamento…</div>";
		openModal("modal-proponi-struttura");
		const { data } = DEMO_MODE ? { data: [] } : await sb.rpc("pro_cavalli_struttura", { p_cliente_id: clienteId });
		const cav = data || [];
		box.innerHTML = cav.length ? cav.map((x) => `<label style="display:flex;align-items:center;gap:10px;padding:7px 2px;font-size:14px"><input type="checkbox" class="prop-str-cav" value="${x.id}" style="width:18px;height:18px"${p.cavallo_cliente_id === x.id || (p.cavalli || []).includes(x.id) ? " checked" : ""}> ${escapeHtml(x.nome)}${x.in_scuderia === false ? " <span class=\"muted\" style=\"font-size:11.5px\">(inserito da te, non nella scheda della scuderia)</span>" : ""}</label>`).join("") : "<div class=\"muted\" style=\"font-size:13px\">La scuderia non ha ancora cavalli in scheda: l'appuntamento sarà generico.</div>";
	}
	async function inviaPropostaStruttura() {
		const err = document.getElementById("prop-str-error");
		err.style.display = "none";
		const tipo = document.getElementById("prop-str-tipo").value;
		const tipoAltro = document.getElementById("prop-str-tipo-altro").value.trim();
		const data = document.getElementById("prop-str-data").value;
		const ora = document.getElementById("prop-str-ora").value;
		const importo = document.getElementById("prop-str-importo").value;
		const note = document.getElementById("prop-str-note").value.trim();
		const cavalli = Array.from(document.querySelectorAll(".prop-str-cav:checked")).map((el) => el.value);
		if (!data) {
			err.textContent = "Scegli la data.";
			err.style.display = "block";
			return;
		}
		if (tipo === "altro" && !tipoAltro) {
			err.textContent = "Specifica il tipo di intervento.";
			err.style.display = "block";
			return;
		}
		const { data: res, error } = await sb.rpc("pro_proponi_appuntamento_struttura", {
			p_cliente_id: propStrutturaClienteId,
			p_tipo: tipo,
			p_tipo_altro: tipoAltro || null,
			p_data: data,
			p_ora: ora || null,
			p_cavalli: cavalli,
			p_note: note || null,
			p_importo: importo ? Number(importo) : null
		});
		if (error || !res?.ok) {
			err.textContent = res && res.errore || "Invio non riuscito: " + (error?.message || "riprova");
			err.style.display = "block";
			return;
		}
		closeModal("modal-proponi-struttura");
		showToast("Proposta inviata: la scuderia deve confermarla.");
		if (document.getElementById("ag-week")) await renderAgendaSettimana$1();
		if (currentClienteId) await loadClienteInterventi(currentClienteId);
	}
	function vaiAllaDataAgenda(iso) {
		const lunCorrente = agLunedi(0);
		const [y, m, d] = iso.split("-").map(Number);
		const target = new Date(y, m - 1, d);
		const diffGiorni = Math.round((target - lunCorrente) / 864e5);
		agSettimanaOffset = Math.floor(diffGiorni / 7);
		agGiorniAperti = /* @__PURE__ */ new Set([iso]);
		renderAgendaSettimana$1();
	}
	function accettaRichiesta(id) {
		const r = richiesteCache[id] || agEventiCache[id];
		if (!r) return;
		if (r.gruppo_id) return azioneGruppoStruttura(r.gruppo_id, "conferma");
		openInterventoModal(null, r);
	}
	async function rifiutaRichiesta(id) {
		const r = richiesteCache[id] || agEventiCache[id];
		if (!r) return;
		if (r.gruppo_id) {
			if (!confirm("Rifiutare la richiesta della scuderia? Riceve un messaggio in chat per trovare un'altra data.")) return;
			return azioneGruppoStruttura(r.gruppo_id, "rifiuta");
		}
		if (!confirm("Rifiutare la richiesta? Il cliente riceve un messaggio in chat per trovare un'altra data.")) return;
		const { error } = await DB.updateInterventoMascalcia(id, { stato: "rifiutato" });
		if (error) {
			showToast("Errore: " + error.message);
			return;
		}
		await DB.insertMessaggioMascalcia({
			cliente_mascalcia_id: r.cliente_mascalcia_id,
			tipo: "testo",
			testo: testoRichiesta("❌ Non riesco per questa richiesta", r, agNomeCavallo(r)) + " Scrivimi qui per trovare un'altra data."
		});
		showToast("Richiesta rifiutata");
		await renderAgendaSettimana$1();
		await renderProDeadlines();
		if (currentClienteId === r.cliente_mascalcia_id) await loadClienteInterventi(r.cliente_mascalcia_id);
	}
	function agRigaEvento(e, di) {
		const cav = agNomeCavallo(e);
		return `
      <div class="ag-ev${e.stato === "fatto" ? " fatto" : e.stato === "richiesto" || e.stato === "proposto" ? " richiesta" : ""}" data-ev="${e.id}">
        <span class="ag-mani" data-drag="ev" aria-label="Trascina per cambiare l'ordine" title="Trascina per cambiare l'ordine">⋮⋮</span>
        <div class="ag-ev-time">${e.ora ? String(e.ora).slice(0, 5) : "—"}</div>
        <div class="ag-ev-main" onclick="apriAzioniEvento('${e.id}')">
          <div class="ag-ev-title">${cav ? escapeHtml(cav) : "<span style=\"color:var(--muted);font-weight:500\">Cavallo non indicato</span>"}</div>
          <div class="ag-ev-sub">${di ? `<span class="ag-di">di ${escapeHtml(di)}</span> · ` : ""}${e.stato === "richiesto" ? "Richiesta · " : e.stato === "proposto" ? "In attesa della scuderia · " : ""}${escapeHtml(agDescrizioneTipoPro(e))}${e.aiutante_nome ? " · con " + escapeHtml(e.aiutante_nome) : ""}${e.note ? " · " + escapeHtml(e.note) : ""}</div>
          ${notaModificaMan(e)}
        </div>
        ${e.stato === "fatto" ? "<span class=\"ag-ev-done\">✓ Fatto</span>" : e.stato === "proposto" ? "<span class=\"ag-ev-done\" style=\"color:var(--accent)\">attesa</span>" : e.stato === "richiesto" ? `<button class="ag-ev-fatto" onclick="accettaRichiesta('${e.id}')">Accetta</button>` : `<button class="ag-ev-fatto" onclick="segnaFattoAgenda('${e.id}')">Fatto</button>`}
        <button class="ag-ev-menu" onclick="apriAzioniEvento('${e.id}')" aria-label="Azioni">⋯</button>
      </div>`;
	}
	function agendaCompleta() {
		try {
			return localStorage.getItem("equo-agenda-vista") === "completa";
		} catch (e) {
			return false;
		}
	}
	var agScadGiorno = (d) => agendaCompleta() ? [] : d.sc;
	var agDaFare = (d) => d.ev.filter((e) => e.stato !== "fatto");
	function agTile(d) {
		const daFare = agDaFare(d).length, sc = agScadGiorno(d).length, fatti = d.ev.length - daFare, aperto = agGiorniAperti.has(d.iso);
		const riposo = d.k === 6 && !d.ev.length;
		return `<button type="button" class="ag-tile${d.oggi ? " today" : ""}${aperto ? " aperto" : ""}${d.k === 6 ? " dom" : ""}${riposo ? " riposo" : ""}" data-iso="${d.iso}" aria-expanded="${aperto}" onclick="toggleGiornoAgenda('${d.iso}')">
      <span class="ag-tile-gg"><span class="ag-tile-nome">${AG_GIORNI[d.k]}</span><span class="ag-tile-data">${d.g.getDate()} ${AG_MESI[d.g.getMonth()]}</span>${d.oggi ? "<span class=\"ag-tile-oggi\">oggi</span>" : ""}</span>
      ${sc ? `<span class="ag-scad" role="button" tabindex="0" aria-label="${sc} ${sc === 1 ? "cavallo da fissare" : "cavalli da fissare"}" onclick="event.stopPropagation();apriDaFissare('${d.iso}')">${sc}<span aria-hidden="true">⚠</span></span>` : ""}
      ${fatti && agendaCompleta() ? `<span class="ag-fatti">✓ ${fatti}</span>` : ""}
      ${(d.pm || []).some((p) => p.stato === "attivo") ? `<span class="ag-pm" title="Promemoria">🔔${(d.pm || []).filter((p) => p.stato === "attivo").length}</span>` : ""}
      ${riposo ? "<span class=\"ag-riposo\">Riposo</span>" : `<span class="ag-count${daFare ? "" : " zero"}" aria-label="${daFare} da fare">${daFare}</span>`}<span class="ag-chev">▾</span>
    </button>`;
	}
	function agPannello(d) {
		const gruppi = /* @__PURE__ */ new Map();
		const metti = (x, attuale, riga) => {
			const l = luogoEvento(x, attuale);
			if (!gruppi.has(l.key)) {
				gruppi.set(l.key, {
					nome: l.nome,
					l,
					righe: []
				});
				agLuoghi[l.key] = l;
			}
			const di = l.key !== "c:" + x.cliente_mascalcia_id ? x.clienti_mascalcia?.nome || clienteDiId(x.cliente_mascalcia_id)?.nome || "" : "";
			gruppi.get(l.key).righe.push(riga(x, di));
		};
		agOrdinaGiro(d.ev).forEach((e) => metti(e, false, agRigaEvento));
		const scad = agScadGiorno(d);
		const cavalli = new Set([...d.ev].map((x) => x.cavallo_cliente_id || x.horse_id || "r:" + x.id)).size;
		const nCli = gruppi.size;
		const nomeEsteso = [
			"Lunedì",
			"Martedì",
			"Mercoledì",
			"Giovedì",
			"Venerdì",
			"Sabato",
			"Domenica"
		][d.k];
		const corpo = [...gruppi.entries()].map(([k, gr]) => `
      <div class="ag-gblock" data-cli="${escapeHtml(k)}">
        <div class="ag-cli">${d.ev.length > 1 ? "<span class=\"ag-mani\" data-drag=\"gr\" aria-label=\"Trascina il luogo\" title=\"Trascina il luogo\">⋮⋮</span>" : ""}<span class="ag-cli-nome">${escapeHtml(gr.nome)}</span><span>${gr.righe.length}</span>
          <button class="ag-cli-nav" onclick="event.stopPropagation();navigaLuogo(agLuoghi[this.closest('.ag-gblock').dataset.cli])" aria-label="Naviga">Naviga</button>${d.oggi && agenteAiHammer() && d.ev.some((e) => e.stato !== "fatto" && luogoEvento(e, false).key === k) ? `<button class="ag-cli-lav" onclick="event.stopPropagation();mlApri(this.closest('.ag-gblock').dataset.cli)" aria-label="Modalità Lavoro"><svg viewBox="0 0 24 24"><use href="#i-ferro"/></svg>Lavoro</button>` : ""}</div>
        <div class="ag-gr">${gr.righe.join("")}</div>
      </div>`).join("");
		return `<div class="ag-pannello" data-iso="${d.iso}">
      <div class="ag-pannello-testa"><b>${nomeEsteso} ${d.g.getDate()} ${AG_MESI[d.g.getMonth()]}${d.oggi ? " · oggi" : ""}</b>
        <span>${nCli ? `${nCli} ${nCli === 1 ? "tappa" : "tappe"} · ${cavalli} ${cavalli === 1 ? "cavallo" : "cavalli"}` : ""}</span></div>
      ${pmPannelloGiorno(d.pm)}
      <div class="ag-gruppi">${corpo || `<div class="ag-empty">${d.k === 6 ? "Domenica: riposo" : "Nessun appuntamento"}</div>`}</div>
      ${scad.length ? `<button type="button" class="ag-dafissare" onclick="apriDaFissare('${d.iso}')"><span>⚠</span>${scad.length} ${scad.length === 1 ? "cavallo da fissare" : "cavalli da fissare"} in questo giorno<b>Vedi</b></button>` : ""}
      ${d.ev.length > 1 ? "<div class=\"ag-sugger\">Tieni premuto ⋮⋮ e trascina per cambiare l'ordine del giro.</div>" : ""}
      <button class="btn btn-outline btn-sm ag-add-day" onclick="nuovoAppuntamentoGiorno('${d.iso}')">+ Aggiungi in questo giorno</button>
    </div>`;
	}
	function agDisegnaGriglia() {
		const box = document.getElementById("ag-week");
		if (!box || !agGiorniDati.length) return;
		let html = "";
		for (const coppia of [
			[0, 1],
			[2, 3],
			[4, 5],
			[6]
		]) {
			const gg = coppia.map((k) => agGiorniDati[k]);
			html += gg.map(agTile).join("");
			const ap = gg.find((d) => agGiorniAperti.has(d.iso));
			if (ap) html += agPannello(ap);
		}
		box.innerHTML = `<div class="ag-griglia">${html}</div>`;
		agAttivaTrascina(box);
	}
	// equo-app-src/src/ruoli/maniscalco/moduli/056-ordine-del-giro-trascina-un-cavallo-nel.js
	function agOrdinaGiro(l) {
		return (l || []).slice().sort((a, b) => (a.data_intervento || "").localeCompare(b.data_intervento || "") || (a.ordine_giro ?? 1e9) - (b.ordine_giro ?? 1e9) || String(a.ora || "99").localeCompare(String(b.ora || "99")) || String(a.created_at || "").localeCompare(String(b.created_at || "")));
	}
	var agTrascina = null;
	function agAttivaTrascina(box) {
		if (box.dataset.trascina) return;
		box.dataset.trascina = "1";
		box.addEventListener("pointerdown", (e) => {
			const h = e.target.closest(".ag-mani");
			if (!h) return;
			e.preventDefault();
			const tipo = h.dataset.drag;
			const el = tipo === "gr" ? h.closest(".ag-gblock") : h.closest(".ag-ev");
			const cont = el && el.parentElement;
			if (!el || !cont) return;
			const r = el.getBoundingClientRect();
			const posto = document.createElement("div");
			posto.className = "ag-posto";
			posto.style.height = r.height + "px";
			cont.insertBefore(posto, el);
			el.classList.add("ag-preso");
			el.style.width = r.width + "px";
			el.style.left = r.left + "px";
			el.style.top = r.top + "px";
			agTrascina = {
				el,
				cont,
				posto,
				tipo,
				y0: e.clientY,
				top0: r.top,
				ordinePrima: agOrdineDom()
			};
			try {
				h.setPointerCapture(e.pointerId);
			} catch (_) {}
			if (navigator.vibrate) try {
				navigator.vibrate(15);
			} catch (_) {}
		});
		box.addEventListener("pointermove", (e) => {
			const t = agTrascina;
			if (!t) return;
			e.preventDefault();
			t.el.style.top = t.top0 + e.clientY - t.y0 + "px";
			const fratelli = [...t.cont.children].filter((x) => x !== t.el && x !== t.posto && (t.tipo === "gr" ? x.classList.contains("ag-gblock") : x.classList.contains("ag-ev") && x.dataset.ev));
			let prima = null;
			for (const f of fratelli) {
				const rr = f.getBoundingClientRect();
				if (e.clientY < rr.top + rr.height / 2) {
					prima = f;
					break;
				}
			}
			if (prima) t.cont.insertBefore(t.posto, prima);
			else {
				const ultimo = fratelli[fratelli.length - 1];
				if (ultimo) t.cont.insertBefore(t.posto, ultimo.nextSibling);
			}
		});
		const fine = async () => {
			const t = agTrascina;
			if (!t) return;
			agTrascina = null;
			t.cont.insertBefore(t.el, t.posto);
			t.posto.remove();
			t.el.classList.remove("ag-preso");
			t.el.style.width = t.el.style.left = t.el.style.top = "";
			const dopo = agOrdineDom();
			if (dopo.join() === t.ordinePrima.join()) return;
			await agSalvaOrdine(dopo, t.tipo === "ev" ? t.el.dataset.ev : null);
		};
		box.addEventListener("pointerup", fine);
		box.addEventListener("pointercancel", fine);
	}
	function agOrdineDom() {
		return [...document.querySelectorAll(".ag-pannello .ag-ev[data-ev]")].map((x) => x.dataset.ev);
	}
	async function agSalvaOrdine(ids, spostato) {
		const ev = (id) => agEventiCache[id];
		let scambio = null;
		if (spostato && ev(spostato)?.ora) {
			const m = ev(spostato), pos = ids.indexOf(spostato);
			const stessoCli = (x) => ev(x) && ev(x).cliente_mascalcia_id === m.cliente_mascalcia_id && ev(x).ora && x !== spostato;
			const dopo = ids.slice(pos + 1).find(stessoCli), prima = ids.slice(0, pos).reverse().find(stessoCli);
			const hm = (x) => String(ev(x).ora).slice(0, 5);
			if (dopo && hm(dopo) < hm(spostato)) scambio = dopo;
			else if (prima && hm(prima) > hm(spostato)) scambio = prima;
		}
		const cambi = ids.map((id, n) => ({
			id,
			n
		})).filter((x) => ev(x.id) && ev(x.id).ordine_giro !== x.n);
		for (const c of cambi) {
			const { error } = await DB.updateInterventoMascalcia(c.id, { ordine_giro: c.n });
			if (error) {
				showToast("Ordine non salvato: " + error.message);
				break;
			}
			ev(c.id).ordine_giro = c.n;
		}
		if (scambio) {
			const a = ev(spostato), b = ev(scambio), oa = String(a.ora).slice(0, 5), ob = String(b.ora).slice(0, 5);
			if (await chiediSiNo("Scambiare anche gli orari?", `Hai messo ${agNomeCavallo(a) || "questo cavallo"} (${oa}) ${ids.indexOf(spostato) < ids.indexOf(scambio) ? "prima" : "dopo"} di ${agNomeCavallo(b) || "un altro"} (${ob}). Sì: ${agNomeCavallo(a) || "il primo"} alle ${ob} e ${agNomeCavallo(b) || "l'altro"} alle ${oa}; i clienti collegati ricevono l'avviso. No: cambia solo l'ordine del giro.`)) {
				for (const [x, nuova] of [[a, ob], [b, oa]]) {
					const prec = {
						data: x.data_intervento,
						ora: String(x.ora).slice(0, 5),
						cliente: x.cliente_mascalcia_id,
						tipo_ferratura: x.tipo_ferratura,
						tipo_altro: x.tipo_altro || ""
					};
					const { error } = await DB.updateInterventoMascalcia(x.id, { ora: nuova });
					if (error) {
						showToast("Orario non cambiato: " + error.message);
						continue;
					}
					x.ora = nuova;
					if (!x.gruppo_id && x.stato === "programmato") await avvisaClienteAppuntamento("modificato", {
						cliente_mascalcia_id: x.cliente_mascalcia_id,
						tipo_ferratura: x.tipo_ferratura,
						tipo_altro: x.tipo_altro,
						data_intervento: x.data_intervento,
						ora: nuova,
						cavallo: agNomeCavallo(x)
					}, prec);
				}
				showToast("Orari scambiati");
			}
		}
		if (!scambio) showToast("Ordine del giro salvato");
		await renderAgendaSettimana$1();
		try {
			await renderProDeadlines();
		} catch (_) {}
	}
	function toggleGiornoAgenda(iso) {
		agGiorniAperti = agGiorniAperti && agGiorniAperti.has(iso) ? /* @__PURE__ */ new Set() : /* @__PURE__ */ new Set([iso]);
		agDisegnaGriglia();
		const t = document.querySelector(`.ag-tile[data-iso="${iso}"]`);
		if (t) {
			t.focus({ preventScroll: true });
			if (t.getBoundingClientRect().top < 60) t.scrollIntoView({
				block: "start",
				behavior: "smooth"
			});
		}
	}
	function cambiaSettimanaAgenda(delta) {
		agSettimanaOffset += delta;
		agGiorniAperti = /* @__PURE__ */ new Set();
		renderAgendaSettimana$1(delta);
	}
	function tornaSettimanaCorrente() {
		const delta = -agSettimanaOffset;
		agSettimanaOffset = 0;
		agGiorniAperti = null;
		renderAgendaSettimana$1(delta || null);
	}
	function agAttivaSwipe(box) {
		if (box.dataset.swipe) return;
		box.dataset.swipe = "1";
		let x0 = null, y0 = null, t0 = 0;
		box.addEventListener("touchstart", (e) => {
			if (e.target.closest && e.target.closest(".ag-mani")) {
				x0 = null;
				return;
			}
			const t = e.touches[0];
			x0 = t.clientX;
			y0 = t.clientY;
			t0 = Date.now();
		}, { passive: true });
		box.addEventListener("touchend", (e) => {
			if (x0 === null) return;
			const t = e.changedTouches[0];
			const dx = t.clientX - x0, dy = t.clientY - y0;
			x0 = null;
			if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5 && Date.now() - t0 < 800) cambiaSettimanaAgenda(dx < 0 ? 1 : -1);
		}, { passive: true });
	}
	function nuovoAppuntamentoGiorno(iso) {
		openInterventoModal(null, null, { data_intervento: iso });
	}
	function fissaDaScadenza(id) {
		const sc = agEventiCache["sc:" + id];
		if (!sc) return;
		openInterventoModal(sc.cliente_mascalcia_id, null, {
			tipo_ferratura: sc.tipo_ferratura,
			tipo_altro: sc.tipo_altro,
			misura_sistema: sc.misura_sistema,
			numero_ferro: sc.numero_ferro,
			quantita_ferri: sc.quantita_ferri,
			data_intervento: sc.data_vista || sc.prossima_scadenza,
			cavallo_cliente_id: sc.cavallo_cliente_id,
			horse_id: sc.horse_id
		});
	}
	function fattoInAnticipo(e) {
		const oggi = isoLocale(/* @__PURE__ */ new Date());
		if (!e || !e.data_intervento || e.data_intervento <= oggi) return {};
		if (e.gruppo_id) {
			showToast("È un appuntamento con la scuderia: segnalo fatto il giorno dell'intervento.");
			return null;
		}
		const quando = formatDataBreve(e.data_intervento);
		if (!confirm(`Questo appuntamento è per ${quando}. L'hai già fatto oggi?\n\nSe confermi lo segno fatto con la data di oggi.`)) return null;
		return { data_intervento: oggi };
	}
	async function segnaFattoAgenda(id) {
		const e = agEventiCache[id];
		const anticipo = fattoInAnticipo(e);
		if (anticipo === null) return;
		const upd = {
			stato: "fatto",
			...anticipo
		};
		if (e) {
			const ps = await richiamoPerFatto({
				...e,
				...anticipo
			});
			if (TIPO_FERRATURA_INTERVALLI[e.tipo_ferratura]) upd.prossima_scadenza = ps;
			const pag = prendiPagamentoScelto();
			if (pag) upd.stato_pagamento = pag;
			const imp = prendiImportiScelti();
			if (imp) upd.importo = imp[0];
			const fs = prendiFerriScelti();
			if (fs) {
				upd.ferri_nuovi = fs.nuovi;
				if (fs.nuovi) upd.quantita_ferri = fs.n;
			}
		}
		const { error } = await DB.updateInterventoMascalcia(id, upd);
		if (error) {
			showToast("Errore: " + error.message);
			return;
		}
		showToast("Segnato come fatto");
		await renderAgendaSettimana$1();
		await renderIncassi$1();
		await renderProDeadlines();
	}
	function apriAzioniEvento(id) {
		const e = agEventiCache[id];
		if (!e) return;
		agEventoAzioniId = id;
		const [y, m, d] = e.data_intervento.split("-").map(Number);
		const dt = new Date(y, m - 1, d);
		document.getElementById("azioni-evento-titolo").textContent = (e.clienti_mascalcia?.nome || "Appuntamento") + (agNomeCavallo(e) ? " · " + agNomeCavallo(e) : "");
		document.getElementById("azioni-evento-dettaglio").innerHTML = [
			`${AG_GIORNI[(dt.getDay() + 6) % 7]} ${d} ${AG_MESI_LUNGHI[m - 1]}${e.ora ? " · ore " + String(e.ora).slice(0, 5) : ""}`,
			escapeHtml(agDescrizioneTipoPro(e)),
			"<span class=\"solo-incassi\">" + (e.importo != null ? "€ " + Number(e.importo).toFixed(2) + " · " : "") + (e.stato_pagamento === "saldato" ? "Saldato" : "Da saldare") + "</span>",
			e.stato === "fatto" ? "<span style=\"color:var(--green);font-weight:700\">✓ Fatto</span>" : e.stato === "richiesto" ? "<span style=\"color:var(--accent);font-weight:700\">Richiesta del cliente · da confermare</span>" : e.stato === "proposto" ? "<span style=\"color:var(--accent);font-weight:700\">In attesa della conferma della scuderia</span>" : "Da fare",
			notaModificaMan(e, true),
			e.gruppo_id ? "<span class=\"muted\" style=\"font-size:12px\">Appuntamento con una scuderia su Equo Scuderia: se cambi servizio, data o ora, la scuderia deve riconfermare.</span>" : "",
			e.note ? escapeHtml(e.note) : ""
		].filter(Boolean).join("<br>");
		const btnFatto = document.getElementById("azioni-evento-fatto");
		btnFatto.textContent = e.stato === "richiesto" ? "Accetta e conferma" : e.stato === "fatto" ? "Rimetti da fare" : "Segna come fatto";
		btnFatto.style.display = e.stato === "proposto" ? "none" : "";
		const btnAnnStr = document.getElementById("azioni-evento-annulla-struttura");
		if (btnAnnStr) btnAnnStr.style.display = e.gruppo_id && ["proposto", "programmato"].includes(e.stato) ? "" : "none";
		const btnElim = document.getElementById("azioni-evento-elimina");
		if (btnElim) btnElim.style.display = e.gruppo_id && e.stato !== "fatto" ? "none" : "";
		openModal("modal-azioni-evento");
	}
	async function azioneEvento(tipo) {
		const e = agEventiCache[agEventoAzioniId];
		if (!e) return;
		if (tipo === "modifica") {
			closeModal("modal-azioni-evento");
			openInterventoModal(null, e);
		} else if (tipo === "annulla_struttura" && e.gruppo_id) {
			if (!confirm("Annullare l'appuntamento con la scuderia (tutti i cavalli)? La scuderia riceve un avviso in chat.")) return;
			closeModal("modal-azioni-evento");
			await azioneGruppoStruttura(e.gruppo_id, "annulla");
		} else if (tipo === "fatto" && e.stato === "richiesto") {
			closeModal("modal-azioni-evento");
			accettaRichiesta(e.id);
		} else if (tipo === "fatto") {
			const nuovo = e.stato === "fatto" ? "programmato" : "fatto";
			const anticipo = nuovo === "fatto" ? fattoInAnticipo(e) : {};
			if (anticipo === null) return;
			const upd = {
				stato: nuovo,
				...anticipo
			};
			if (nuovo === "fatto") {
				closeModal("modal-azioni-evento");
				const ps = await richiamoPerFatto({
					...e,
					...anticipo
				});
				if (TIPO_FERRATURA_INTERVALLI[e.tipo_ferratura]) upd.prossima_scadenza = ps;
				const pag = prendiPagamentoScelto();
				if (pag) upd.stato_pagamento = pag;
				const imp = prendiImportiScelti();
				if (imp) upd.importo = imp[0];
				const fs = prendiFerriScelti();
				if (fs) {
					upd.ferri_nuovi = fs.nuovi;
					if (fs.nuovi) upd.quantita_ferri = fs.n;
				}
			}
			const { error } = await DB.updateInterventoMascalcia(e.id, upd);
			if (error) {
				showToast("Errore: " + error.message);
				return;
			}
			closeModal("modal-azioni-evento");
			showToast(nuovo === "fatto" ? "Segnato come fatto" : "Rimesso da fare");
			await renderAgendaSettimana$1();
			await renderIncassi$1();
			await renderProDeadlines();
		} else if (tipo === "elimina") {
			if (!confirm(deveAvvisareAnnullo(e) ? "Eliminare questo appuntamento? Il cliente riceve l'avviso in chat." : "Eliminare questo appuntamento?")) return;
			const { error } = await DB.deleteInterventoMascalcia(e.id);
			if (error) {
				showToast("Errore: " + error.message);
				return;
			}
			if (deveAvvisareAnnullo(e)) await avvisaClienteAppuntamento("annullato", {
				...e,
				cavallo: agNomeCavallo(e)
			});
			closeModal("modal-azioni-evento");
			showToast("Appuntamento eliminato");
			await renderAgendaSettimana$1();
			await renderIncassi$1();
			await renderProDeadlines();
		} else if (tipo === "pdf") {
			if (typeof generaPdfEvento === "function") return generaPdfEvento(e);
			showToast("PDF disponibile a breve");
		} else if (tipo === "chat") {
			if (typeof inviaEventoInChat === "function") return inviaEventoInChat(e);
			showToast("Invio in chat disponibile a breve");
		}
	}
	// equo-app-src/src/ruoli/maniscalco/moduli/098-professionista.js
	function wgTipoApp(e) {
		return typeof agDescrizioneTipoPro === "function" ? agDescrizioneTipoPro(e) : hpTipo(e);
	}
	function wgClienteDi(id) {
		return (clientiMascalcia || []).find((c) => c.id === id) || null;
	}
	var wgScelto = null;
	function wgScegli(id) {
		wgScelto = id;
		renderWidgetPro();
	}
	function renderWidgetPro() {
		const box = document.getElementById("wh-pro");
		if (!box || !currentUser) return;
		const oggi = isoLocale(/* @__PURE__ */ new Date());
		const adesso = (/* @__PURE__ */ new Date()).toTimeString().slice(0, 5);
		const app = (hpAppuntamenti || []).filter((e) => e.stato !== "annullato" && e.stato !== "rifiutato");
		const diOggi = agOrdinaGiro(app.filter((e) => e.data_intervento === oggi));
		const prossimoOggi = diOggi.find((e) => !e.ora || String(e.ora).slice(0, 5) >= adesso) || null;
		const futuri = agOrdinaGiro(app.filter((e) => e.data_intervento > oggi));
		const scelto = wgScelto ? app.find((e) => e.id === wgScelto && e.data_intervento >= oggi) : null;
		if (wgScelto && !scelto) wgScelto = null;
		const prossimo = scelto || prossimoOggi || futuri[0] || null;
		const cavalliOggi = diOggi.length;
		const strutture = new Set(diOggi.filter((e) => isStruttura(wgClienteDi(e.cliente_mascalcia_id))).map((e) => e.cliente_mascalcia_id)).size;
		const ric = (hpRichiamiLista || []).slice().sort((a, b) => a.giorni - b.giorni);
		const giro = (typeof hpGiri === "function" ? hpGiri() : [])[0] || null;
		const quando = (e) => {
			if (!e) return "";
			const ora = e.ora ? String(e.ora).slice(0, 5) : "";
			if (scelto && e.id === scelto.id) return e.data_intervento === oggi ? `In evidenza · oggi${ora ? " " + ora : ""}` : `In evidenza · ${hpGiornoEtichetta(e.data_intervento).toLowerCase()}${ora ? " " + ora : ""}`;
			if (e.data_intervento === oggi && ora) {
				const [h, m] = ora.split(":").map(Number);
				const d = /* @__PURE__ */ new Date();
				d.setHours(h, m, 0, 0);
				const min = Math.round((d - /* @__PURE__ */ new Date()) / 6e4);
				return min > 0 && min < 180 ? `Prossimo · tra ${min} min · ${ora}` : `Prossimo · oggi ${ora}`;
			}
			return e.data_intervento === oggi ? "Prossimo · oggi" : `Prossimo · ${hpGiornoEtichetta(e.data_intervento).toLowerCase()}${ora ? " " + ora : ""}`;
		};
		wgMeteoCarica([...new Set([...diOggi, prossimo].filter(Boolean).map((e) => e.cliente_mascalcia_id))]);
		let oggiHtml;
		if (prossimo) {
			const c = wgClienteDi(prossimo.cliente_mascalcia_id);
			const cav = agNomeCavallo(prossimo);
			const lp = cavalliMieiCache ? luogoEvento(prossimo, true) : null;
			const dove = lp && lp.key !== "c:" + prossimo.cliente_mascalcia_id ? [
				lp.nome,
				lp.indirizzo,
				"di " + (prossimo.clienti_mascalcia?.nome || c?.nome || "")
			].filter(Boolean).join(" · ") : [prossimo.clienti_mascalcia?.nome || c?.nome, c?.indirizzo].filter(Boolean).join(" · ");
			const altri = diOggi.filter((e) => e.id !== prossimo.id).slice(0, 6);
			oggiHtml = `
      <div class="wg-prossimo" onclick="apriAzioniEvento('${prossimo.id}')">
        <div class="wg-quando">${wgEsc(quando(prossimo))}</div>
        <div class="wg-chi">${wgEsc(cav || prossimo.clienti_mascalcia?.nome || "Appuntamento")} · ${wgEsc(wgTipoApp(prossimo).toLowerCase())}${wgMeteoIcona(prossimo)}</div>
        <div class="wg-dove">${wgEsc(dove)}</div>
        <div class="wg-azioni">
          <button class="oro" onclick="event.stopPropagation();wgNavigaEvento('${prossimo.id}')">${WG_IC.mappa}Naviga</button>
          <button onclick="event.stopPropagation();openChatThread('${prossimo.cliente_mascalcia_id}')">${WG_IC.msg}Chatta</button>
          ${prossimo.stato === "programmato" ? `<button onclick="event.stopPropagation();hpSegnaFatto('${prossimo.id}')">${WG_IC.ok}Fatto</button>` : `<button onclick="event.stopPropagation();apriAzioniEvento('${prossimo.id}')">Apri</button>`}
        </div>
      </div>
      ${altri.map((e) => `<div class="wg-voce" onclick="wgScegli('${e.id}')">${e.ora ? `<span class="wg-ora">${String(e.ora).slice(0, 5)}</span>` : ""}<span class="wg-t">${wgEsc(agNomeCavallo(e) || "")} · ${wgEsc(wgTipoApp(e).toLowerCase())} <small>· ${wgEsc(e.clienti_mascalcia?.nome || "")}</small></span>${wgMeteoIcona(e)}<button class="wg-piu" aria-label="Modifica appuntamento" onclick="event.stopPropagation();apriAzioniEvento('${e.id}')">⋯</button></div>`).join("")}
      ${altri.length ? "<div class=\"wg-nota\">Tocca un appuntamento per metterlo in evidenza con Naviga, Chatta e Fatto.</div>" : ""}
      ${!prossimoOggi && prossimo ? "<div class=\"wg-nota\">Oggi nessun appuntamento: questo è il prossimo in agenda.</div>" : ""}`;
		} else oggiHtml = `<div class="wg-vuoto">Nessun appuntamento in agenda.<br><button class="wg-link" onclick="openInterventoModal(null)">+ Fissane uno</button></div>`;
		const ricHtml = ric.length ? ric.slice(0, 3).map((r) => `<div class="wg-ric" onclick="apriRichiamo('${r.intervento_id}')"><span class="wg-sem ${hpColoreRic(r)}"></span><span class="wg-t"><b>${wgEsc(r.cavallo_nome || "Cavallo")}</b> · ${wgEsc(r.cliente_nome || "")}<small>${wgEsc(hpTipo(r).toLowerCase())} · ${wgEsc(hpQuando(r))}</small></span><button class="wg-scrivi" onclick="event.stopPropagation();wgScriviRichiamo('${r.intervento_id}')">Scrivi</button></div>`).join("") : "<div class=\"wg-vuoto piccolo\">Nessun cavallo da richiamare nei prossimi 30 giorni.</div>";
		const sett = wgPro.settimana;
		const lun = wgLunedi(oggi);
		const giorni = [
			"L",
			"M",
			"M",
			"G",
			"V",
			"S",
			"D"
		].map((g, i) => {
			const iso = aggiungiGiorniIso(lun, i);
			return {
				g,
				iso,
				n: sett ? sett[iso] || 0 : 0
			};
		});
		const max = Math.max(4, ...giorni.map((x) => x.n));
		const totSett = giorni.reduce((t, x) => t + x.n, 0);
		if (wgPro.settimanaChiave !== lun) wgCaricaSettimana(lun);
		box.innerHTML = `
    <div class="wg wg-grande">
      <div class="wg-testa"><span class="wg-et">${WG_IC.cal}Oggi</span><span class="wg-meta">${cavalliOggi ? `${cavalliOggi} ${cavalliOggi === 1 ? "appuntamento" : "appuntamenti"}${strutture ? " · " + strutture + (strutture === 1 ? " scuderia" : " scuderie") : ""}` : ""}</span></div>
      ${oggiHtml}
    </div>
    <div class="wg wg-piccolo" onclick="document.querySelector('[data-page=&quot;pro-inbox&quot;]')?.click()">
      <span class="wg-et">${WG_IC.msg}Messaggi</span>${wgPro.unread ? `<span class="wg-badge">${wgPro.unread}</span>` : ""}
      <div class="wg-num">${wgPro.unread} <small>${wgPro.unread === 1 ? "non letto" : "non letti"}</small></div>
      <div class="wg-riga">${wgPro.ultimo ? `<b>${wgEsc(wgPro.ultimo.nome)}:</b> ${wgEsc(wgPro.ultimo.testo)}` : "Nessun messaggio"}</div>
    </div>
    <div class="wg wg-piccolo wg-pieno solo-incassi" onclick="showPage('pro-incassi')">
      <span class="wg-cerchio">${WG_IC.euro}</span>
      <div class="wg-num">${wgEuro(wgPro.incassatoMese)}</div>
      <div class="wg-riga">incassati a ${(/* @__PURE__ */ new Date()).toLocaleDateString("it-IT", { month: "long" })}</div>
      <div class="wg-riga evid">${wgPro.daIncassareMese ? wgEuro(wgPro.daIncassareMese) + " da incassare" : "Tutto incassato"}</div>
      ${wgPro.previsto ? `<div class="wg-riga">${wgEuro(wgPro.previsto)} previsti in agenda</div>` : ""}
    </div>
    <div class="wg wg-medio">
      <div class="wg-testa"><span class="wg-et">${WG_IC.camp}Da richiamare</span>${ric.length > 3 ? `<button class="wg-link" onclick="apriListaHome('ric')">${ric.length} in tutto ›</button>` : ""}</div>
      ${ricHtml}
    </div>
    <div class="wg wg-piccolo wg-pieno wg-azione" onclick="openInterventoModal(null)">
      <span class="wg-cerchio grande">${WG_IC.piu}</span>
      <div class="wg-riga forte">Nuovo appuntamento</div>
    </div>
    <div class="wg wg-piccolo" onclick="${giro ? `apriGiro('${giro[0].cliente_mascalcia_id}')` : "showToast('Nessun giro da organizzare: ti avvisiamo quando più cavalli dello stesso cliente scadono insieme')"}">
      ${isPremium() ? "" : "<span class=\"wg-premium\">PREMIUM</span>"}
      <span class="wg-et">${WG_IC.giro}Giro</span>
      <div class="wg-num">${giro ? giro.length : 0} <small>cavalli</small></div>
      <div class="wg-riga">${giro ? `da <b>${wgEsc(giro[0].cliente_nome || "")}</b>: un solo appuntamento` : "Nessun giro da organizzare"}</div>
    </div>
    <div class="wg wg-medio" onclick="showPage('pro-agenda')">
      <div class="wg-testa"><span class="wg-et">${WG_IC.sett}Settimana</span><span class="wg-meta">${sett ? totSett + (totSett === 1 ? " appuntamento" : " appuntamenti") : ""}</span></div>
      <div class="wg-barre">${giorni.map((x) => `<div class="wg-barra${x.iso === oggi ? " oggi" : ""}"><b>${x.n || "–"}</b><i style="height:${x.n ? Math.max(12, Math.round(x.n / max * 100)) : 6}%"></i><small>${x.g}</small></div>`).join("")}</div>
    </div>`;
	}
	function wgLunedi(iso) {
		const [y, m, d] = iso.split("-").map(Number);
		return aggiungiGiorniIso(iso, -((new Date(y, m - 1, d).getDay() + 6) % 7));
	}
	var wgSettInCorso = false;
	async function wgCaricaSettimana(lun) {
		if (wgSettInCorso) return;
		wgSettInCorso = true;
		try {
			const lista = await DB.listInterventiPeriodo(lun, aggiungiGiorniIso(lun, 6));
			const per = {};
			(lista || []).filter((i) => !["rifiutato", "annullato"].includes(i.stato)).forEach((i) => {
				per[i.data_intervento] = (per[i.data_intervento] || 0) + 1;
			});
			wgPro.settimana = per;
			wgPro.settimanaChiave = lun;
		} catch (e) {
			wgPro.settimana = wgPro.settimana || {};
			wgPro.settimanaChiave = lun;
		} finally {
			wgSettInCorso = false;
		}
		if (vistaWidgetAttiva() && vistaAi() === "professionista") renderWidgetPro();
	}
	function wgScriviRichiamo(id) {
		apriRichiamo(id);
		richiamoAzione("scrivi");
	}
	// equo-app-src/src/ruoli/maniscalco/moduli/106-posizione-attuale.js
	function coordDaIndirizzo(t) {
		const m = String(t || "").match(/(-?\d{1,2}\.\d{3,})\s*,\s*(-?\d{1,3}\.\d{3,})/);
		if (!m) return null;
		const lat = Number(m[1]), lon = Number(m[2]);
		return Math.abs(lat) <= 90 && Math.abs(lon) <= 180 ? {
			lat,
			lon
		} : null;
	}
	async function usaPosizioneQui(inputId, btn) {
		const inp = document.getElementById(inputId);
		const nota = document.getElementById(inputId + "-pos-nota");
		const scrivi = (t, cls) => {
			if (nota) {
				nota.textContent = t;
				nota.className = "pos-nota" + (cls ? " " + cls : "");
			}
		};
		if (!navigator.geolocation) {
			scrivi("Questo telefono non dà la posizione.", "male");
			return;
		}
		if (btn) btn.disabled = true;
		scrivi("Cerco la posizione…");
		const pos = await new Promise((res) => navigator.geolocation.getCurrentPosition((p) => res(p.coords), (e) => res({ errore: e }), {
			enableHighAccuracy: true,
			timeout: 15e3,
			maximumAge: 0
		}));
		if (btn) btn.disabled = false;
		if (!pos || pos.errore) {
			scrivi(pos?.errore?.code === 1 ? "Posizione non permessa: attivala nelle impostazioni del telefono per Equo." : "Posizione non trovata: riprova all'aperto.", "male");
			return;
		}
		const lat = pos.latitude.toFixed(5), lon = pos.longitude.toFixed(5), prec = Math.round(pos.accuracy || 0);
		let via = "";
		if (!DEMO_MODE) try {
			const tk = (await sb.auth.getSession()).data.session?.access_token || "";
			const r = await fetch("/.netlify/functions/meteo", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: "Bearer " + tk
				},
				body: JSON.stringify({
					azione: "via",
					lat: Number(lat),
					lon: Number(lon)
				})
			});
			const d = r.ok ? await r.json() : {};
			via = [d.via, d.comune].filter(Boolean).join(", ");
		} catch (e) {
			via = "";
		}
		inp.value = (via ? via + " " : "📍 ") + `(${lat}, ${lon})`;
		inp.dispatchEvent(new Event("input", { bubbles: true }));
		if (prec > 100) scrivi(`Posizione salvata, ma la precisione è bassa (circa ${prec} m): se puoi, riprova all'aperto.`, "male");
		else scrivi(`Posizione salvata · precisione circa ${prec || "?"} m. Ricordati di salvare la scheda.`, "ok");
	}
	// equo-app-src/src/ruoli/maniscalco/moduli/100-naviga.js
	var wgIndirizziStrutture = null;
	async function wgIndirizzoStruttura(c) {
		if (!c?.centro_id || DEMO_MODE) return null;
		if (!wgIndirizziStrutture) try {
			const { data, error } = await sb.rpc("pro_indirizzi_strutture");
			wgIndirizziStrutture = error ? [] : data || [];
		} catch (_) {
			wgIndirizziStrutture = [];
		}
		return wgIndirizziStrutture.find((x) => (x.cliente_id || x.id) === c.id) || null;
	}
	async function wgNaviga$1(clienteId) {
		const c = wgClienteDi(clienteId);
		if (!c) {
			showToast("Cliente non trovato");
			return;
		}
		const proprio = (c.indirizzo || "").trim();
		if (proprio) return wgMostraMappe(c, proprio);
		const st = await wgIndirizzoStruttura(c);
		const via = (st?.indirizzo || "").trim();
		const citta = [st?.citta, st?.provincia ? "(" + st.provincia + ")" : ""].filter(Boolean).join(" ").trim();
		if (via) return wgMostraMappe(c, [via, citta].filter(Boolean).join(", "), "Indirizzo indicato dalla scuderia in Equo Scuderia");
		wgCercaLuogo(c, [st?.nome || c.nome, st?.citta].filter(Boolean).join(", "));
	}
	function wgMappeOv() {
		let ov = document.getElementById("modal-naviga");
		if (!ov) {
			ov = document.createElement("div");
			ov.className = "modal-overlay";
			ov.id = "modal-naviga";
			ov.addEventListener("click", (ev) => {
				if (ev.target === ov) closeModal("modal-naviga");
			});
			document.body.appendChild(ov);
		}
		return ov;
	}
	function wgMostraMappe(c, indirizzo, nota) {
		const xy = coordDaIndirizzo(indirizzo);
		const q = encodeURIComponent(xy ? xy.lat + "," + xy.lon : indirizzo);
		const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
		const app = [
			[
				"Google Maps",
				`https://www.google.com/maps/dir/?api=1&destination=${q}`,
				"linear-gradient(135deg,#34a853 0 33%,#fbbc04 33% 66%,#4285f4 66%)"
			],
			...ios ? [[
				"Apple Mappe",
				`https://maps.apple.com/?daddr=${q}`,
				"linear-gradient(160deg,#7fd27b,#3aa0f0)"
			]] : [],
			[
				"Waze",
				xy ? `https://waze.com/ul?ll=${q}&navigate=yes` : `https://waze.com/ul?q=${q}&navigate=yes`,
				"#33ccff"
			]
		];
		const ov = wgMappeOv();
		ov.innerHTML = `<div class="modal"><div class="modal-handle"></div>
    <div class="modal-title" style="margin-bottom:2px">Indicazioni per ${wgEsc(c?.nome || "il cliente")}</div>
    <div class="muted" style="font-size:13px;margin-bottom:${nota ? 2 : 14}px">${wgEsc(indirizzo)}</div>
    ${nota ? `<div class="muted" style="font-size:12px;margin-bottom:14px">${wgEsc(nota)}</div>` : ""}
    ${app.map(([n, u, bg]) => `<a class="wg-app-mappa" href="${u}" target="_blank" rel="noopener" onclick="closeModal('modal-naviga')"><i style="background:${bg}"></i>${n}</a>`).join("")}
    <button class="btn btn-outline" style="width:100%;margin-top:6px" onclick="closeModal('modal-naviga')">Annulla</button></div>`;
		openModal("modal-naviga");
	}
	var wgLuogo = {
		cliente: null,
		risultati: []
	};
	function wgCercaLuogo(c, testo) {
		wgLuogo = {
			cliente: c,
			risultati: []
		};
		const ov = wgMappeOv();
		ov.innerHTML = `<div class="modal"><div class="modal-handle"></div>
    <div class="modal-title" style="margin-bottom:2px">Dove si trova ${wgEsc(c.nome || "il cliente")}?</div>
    <div class="muted" style="font-size:13px;margin-bottom:12px">Manca l'indirizzo. Cerca il luogo e tocca quello giusto: lo salvo nella scheda del cliente.</div>
    <form onsubmit="event.preventDefault();wgCercaLuogoVai()" style="display:flex;gap:8px;margin-bottom:12px">
      <input class="input" id="wg-luogo-testo" style="flex:1" placeholder="Nome del maneggio o della via, città" value="${wgEsc(testo || "")}">
      <button class="btn btn-primary" type="submit" style="flex-shrink:0">Cerca</button>
    </form>
    <div id="wg-luogo-esiti"></div>
    <button class="btn btn-outline" style="width:100%;margin-top:6px" onclick="wgLuogoAMano()">Scrivo l'indirizzo a mano</button>
    <button class="btn btn-outline" style="width:100%;margin-top:8px" onclick="closeModal('modal-naviga')">Annulla</button></div>`;
		openModal("modal-naviga");
		if ((testo || "").trim().length >= 3) wgCercaLuogoVai();
		else setTimeout(() => document.getElementById("wg-luogo-testo")?.focus(), 250);
	}
	async function wgCercaLuogoVai() {
		const testo = (document.getElementById("wg-luogo-testo")?.value || "").trim();
		const box = document.getElementById("wg-luogo-esiti");
		if (!box) return;
		if (testo.length < 3) {
			box.innerHTML = `<div class="muted" style="font-size:13px;margin-bottom:10px">Scrivi almeno 3 lettere.</div>`;
			return;
		}
		box.innerHTML = `<div class="muted" style="font-size:13px;margin-bottom:10px">Cerco…</div>`;
		let d = {};
		if (DEMO_MODE) {
			await new Promise((r) => setTimeout(r, 400));
			d = { risultati: [
				{
					nome: testo.split(",")[0] + " (scuderia)",
					indirizzo: "Via Casilina km 51, 00034 Colleferro RM, Italia"
				},
				{
					nome: testo.split(",")[0],
					indirizzo: "Via dei Prati 12, 00038 Valmontone RM, Italia"
				},
				{
					nome: "Centro ippico " + testo.split(",")[0],
					indirizzo: "Strada provinciale 600, 03012 Anagni FR, Italia"
				}
			] };
		} else try {
			const res = await fetch("/.netlify/functions/cerca-luogo", {
				method: "POST",
				headers: await authHeaders(),
				body: JSON.stringify({ testo })
			});
			d = await res.json().catch(() => ({}));
			if (res.status === 401) d = {
				errore: true,
				sessione: true
			};
		} catch (_) {
			d = { errore: true };
		}
		const apriMappe = `<a class="wg-app-mappa" href="${`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(testo)}`}" target="_blank" rel="noopener"><i style="background:linear-gradient(135deg,#34a853 0 33%,#fbbc04 33% 66%,#4285f4 66%)"></i>Cerca su Google Maps</a>`;
		if (d.non_configurato || d.errore || d.limite_raggiunto) {
			box.innerHTML = `<div class="muted" style="font-size:13px;margin-bottom:10px">${d.limite_raggiunto ? "Hai fatto molte ricerche oggi: riprova domani." : d.sessione ? "Sessione scaduta: esci e rientra." : !navigator.onLine ? "Sei offline: la ricerca riparte con la rete." : "La ricerca non è disponibile in questo momento."} Puoi cercare il luogo direttamente nelle mappe.</div>${apriMappe}`;
			return;
		}
		wgLuogo.risultati = d.risultati || [];
		if (!wgLuogo.risultati.length) {
			box.innerHTML = `<div class="muted" style="font-size:13px;margin-bottom:10px">Nessun luogo trovato. Prova con il nome del maneggio e la città, oppure scrivi l'indirizzo a mano.</div>${apriMappe}`;
			return;
		}
		box.innerHTML = wgLuogo.risultati.map((r, i) => `<button class="wg-app-mappa wg-luogo" type="button" onclick="wgSceltaLuogo(${i})">
      <span class="wg-luogo-ico"><i class="fa-solid fa-location-dot"></i></span>
      <span style="min-width:0"><span style="display:block">${wgEsc(r.nome || r.indirizzo)}</span><span class="muted" style="display:block;font-weight:400;font-size:12.5px">${wgEsc(r.indirizzo)}</span></span></button>`).join("");
	}
	async function wgSceltaLuogo(i) {
		const r = wgLuogo.risultati[i], c = wgLuogo.cliente;
		if (!r || !c) return;
		if (!DEMO_MODE) {
			const { error } = await DB.updateClienteMascalcia(c.id, { indirizzo: r.indirizzo });
			if (error) showToast("Non sono riuscito a salvare l'indirizzo, ma ti porto lo stesso");
			else showToast("Indirizzo salvato nella scheda del cliente");
		}
		c.indirizzo = r.indirizzo;
		closeModal("modal-naviga");
		setTimeout(() => wgMostraMappe(c, r.indirizzo), 200);
	}
	function wgLuogoAMano() {
		const c = wgLuogo.cliente;
		closeModal("modal-naviga");
		if (!c) return;
		showPage("pro-clienti");
		openClienteDetail(c.id).then(() => {
			if (typeof openEditCliente === "function") openEditCliente().then(() => document.getElementById("edit-cliente-indirizzo")?.focus());
		});
	}
	// equo-app-src/src/ruoli/maniscalco/moduli/050-sposta-cavallo-dove-sta-il-cavallo-a-cas.js
	function ubicDi(r, clienteId) {
		const o = { cliente_mascalcia_id: r && r.cliente_mascalcia_id || clienteId || null };
		UBIC_CAMPI.forEach((k) => {
			o[k] = r ? r[k] ?? null : null;
		});
		return o;
	}
	async function caricaUbicazioni(forza) {
		if (!forza && cavalliMieiCache && Date.now() - cavalliMieiTs < 6e4) return cavalliMieiCache;
		try {
			cavalliMieiCache = await DB.listCavalliMiei();
		} catch (e) {
			cavalliMieiCache = cavalliMieiCache || [];
		}
		cavalliMieiTs = Date.now();
		cavalliMieiById = {};
		cavalliMieiByHorse = {};
		(cavalliMieiCache || []).forEach((c) => {
			cavalliMieiById[c.id] = c;
			if (c.horse_id && !cavalliMieiByHorse[c.horse_id]) cavalliMieiByHorse[c.horse_id] = c;
		});
		return cavalliMieiCache;
	}
	function clienteDiId(id) {
		return (clientiMascalcia || []).find((x) => x.id === id) || null;
	}
	function eLuogoScuderia(c) {
		return !!(c && (c.tipo_cliente === "struttura" || c.centro_id));
	}
	function nomeLuogoCliente(c) {
		return c ? eLuogoScuderia(c) ? c.nome : "A casa · " + c.nome : "Cliente";
	}
	function luogoDi(r) {
		const cli = clienteDiId(r?.cliente_mascalcia_id);
		const dal = r?.ubicazione_dal || null;
		if (r?.ubicazione_tipo === "scuderia") {
			const u = clienteDiId(r.ubicazione_cliente_id);
			return {
				key: r.ubicazione_cliente_id ? "c:" + r.ubicazione_cliente_id : "n:" + (r.ubicazione_nome || ""),
				nome: u?.nome || r.ubicazione_nome || "Scuderia",
				indirizzo: u?.indirizzo || null,
				clienteId: r.ubicazione_cliente_id || null,
				scuderia: true,
				casa: false,
				dal
			};
		}
		if (r?.ubicazione_tipo === "casa") {
			const struttura = eLuogoScuderia(cli);
			return {
				key: "casa:" + r.cliente_mascalcia_id + ":" + (r.ubicazione_indirizzo || ""),
				nome: "A casa · " + (r.ubicazione_nome || (struttura ? "privato" : cli?.nome || "")),
				indirizzo: r.ubicazione_indirizzo || (struttura ? null : cli?.indirizzo || null),
				clienteId: struttura ? null : r.cliente_mascalcia_id,
				scuderia: false,
				casa: true,
				dal
			};
		}
		return {
			key: "c:" + (r?.cliente_mascalcia_id || ""),
			nome: nomeLuogoCliente(cli),
			indirizzo: cli?.indirizzo || null,
			clienteId: cli?.id || null,
			scuderia: eLuogoScuderia(cli),
			casa: !eLuogoScuderia(cli),
			dal
		};
	}
	function luogoEvento(e, attuale) {
		if (!attuale && e.stato === "fatto" && e.luogo_nome) {
			const lc = e.luogo_cliente_id ? clienteDiId(e.luogo_cliente_id) : null;
			if (lc) return {
				key: "c:" + lc.id,
				nome: nomeLuogoCliente(lc),
				indirizzo: lc.indirizzo || null,
				clienteId: lc.id,
				scuderia: eLuogoScuderia(lc)
			};
			if (/^A casa/.test(e.luogo_nome)) return luogoDi({ cliente_mascalcia_id: e.cliente_mascalcia_id });
			return {
				key: "n:" + e.luogo_nome,
				nome: e.luogo_nome,
				indirizzo: null,
				clienteId: null,
				scuderia: true
			};
		}
		const riga = e.cavallo_cliente_id && cavalliMieiById[e.cavallo_cliente_id] || e.horse_id && cavalliMieiByHorse[e.horse_id] || null;
		return luogoDi(riga ? {
			...ubicDi(riga),
			cliente_mascalcia_id: riga.ubicazione_tipo ? riga.cliente_mascalcia_id : e.cliente_mascalcia_id
		} : { cliente_mascalcia_id: e.cliente_mascalcia_id });
	}
	function navigaLuogo(l) {
		if (!l) return;
		if (l.indirizzo) return wgMostraMappe({ nome: l.nome }, l.indirizzo);
		if (l.clienteId) return wgNaviga$1(l.clienteId);
		wgMostraMappe({ nome: l.nome }, l.nome, "Indirizzo non indicato: ricerca per nome, controlla nelle mappe che sia il posto giusto.");
	}
	async function wgNavigaEvento(id) {
		const e = agEventiCache[id] || (typeof hpAppuntamenti !== "undefined" ? hpAppuntamenti : []).find((x) => x.id === id);
		if (!e) return;
		await caricaUbicazioni();
		navigaLuogo(luogoEvento(e, true));
	}
	function doveStaHtml(l, azione) {
		const sotto = [l.indirizzo, l.dal ? "dal " + formatDataBreve(l.dal) : ""].filter(Boolean).join(" · ");
		return `<div class="dove-sta"><span class="ic">${l.scuderia ? "🐴" : "🏠"}</span>
    <div class="c"><b>${escapeHtml(l.nome)}</b>${sotto ? `<span>${escapeHtml(sotto)}</span>` : ""}</div>${azione || ""}</div>`;
	}
	function renderDoveCavalloPro(cv) {
		const box = document.getElementById("cavpro-dove");
		if (!box) return;
		box.innerHTML = doveStaHtml(luogoDi(cv.ub || { cliente_mascalcia_id: currentClienteId }), `<button class="btn btn-primary btn-sm" onclick="apriSpostaCavalloPro()">Sposta</button>`);
	}
	var spCtx = null;
	var spCercaT = null;
	function spOverlay() {
		let ov = document.getElementById("modal-sposta");
		if (!ov) {
			ov = document.createElement("div");
			ov.className = "modal-overlay";
			ov.id = "modal-sposta";
			ov.addEventListener("click", (ev) => {
				if (ev.target === ov) closeModal("modal-sposta");
			});
			document.body.appendChild(ov);
		}
		return ov;
	}
	async function apriSpostaCavalloPro() {
		const cv = schedaCavalli.find((c) => c.key === schedaCavalloKey);
		if (!cv) return;
		let id = cv.id;
		if (!id) {
			({cavallo_cliente_id: id} = await DB.risolviCavalloPerIntervento(currentClienteId, cv));
			if (id) cv.id = id;
		}
		if (!id) {
			showToast("Non riuscito, riprova.");
			return;
		}
		await caricaUbicazioni();
		const ub = cv.ub || { cliente_mascalcia_id: currentClienteId };
		const att = luogoDi(ub), pagante = clienteDiId(ub.cliente_mascalcia_id || currentClienteId);
		const scuderie = clientiAttivi().filter((c) => eLuogoScuderia(c)).sort((a, b) => a.nome.localeCompare(b.nome, "it")).map((c) => ({
			v: "cli:" + c.id,
			nome: c.nome,
			sotto: [c.indirizzo, (() => {
				const n = (cavalliMieiCache || []).filter((x) => x.cliente_mascalcia_id === c.id || x.ubicazione_cliente_id === c.id).length;
				return n ? n + (n === 1 ? " cavallo che segui" : " cavalli che segui") : "";
			})()].filter(Boolean).join(" · "),
			equo: !!(c.centro_id && c.collegamento_stato === "attivo"),
			attuale: att.key === "c:" + c.id
		}));
		spCtx = {
			vista: "maniscalco",
			id,
			nome: cv.nome,
			att,
			pagante,
			scuderie,
			casaInd: eLuogoScuderia(pagante) ? "" : pagante?.indirizzo || "",
			collegato: clienteCollegatoEquo(pagante?.id)
		};
		spDisegna();
	}
	async function apriSpostaCavalloProprietario() {
		const h = (horses || []).find((x) => x.id === currentHorseId);
		if (!h) return;
		let mie = [];
		if (!DEMO_MODE) try {
			mie = (await sb.rpc("prop_indirizzi_scuderie")).data || [];
		} catch (e) {}
		else mie = (demoState.stables || []).map((s) => ({
			id: s.id,
			nome: s.name,
			citta: ""
		}));
		spCtx = {
			vista: "proprietario",
			id: h.id,
			nome: h.name,
			att: {
				nome: luogoProprietario(h).nome,
				key: h.ubicazione_centro_id ? "centro:" + h.ubicazione_centro_id : ""
			},
			scuderie: mie.map((c) => ({
				v: "centro:" + c.id,
				nome: c.nome,
				sotto: [c.indirizzo, c.citta].filter(Boolean).join(", "),
				equo: true,
				attuale: h.ubicazione_centro_id === c.id
			})),
			casaInd: h.ubicazione_tipo === "casa" ? h.ubicazione_indirizzo || "" : ""
		};
		spDisegna();
	}
	function spDisegna() {
		const c = spCtx, pro = c.vista === "maniscalco";
		const ov = spOverlay();
		ov.innerHTML = `<div class="modal sp-modal"><div class="modal-handle"></div>
    <div class="modal-title" style="margin-bottom:2px">Dove va ${escapeHtml(c.nome)}?</div>
    <div class="muted" style="font-size:12.5px;margin-bottom:12px">Adesso: ${escapeHtml(c.att.nome || "non indicato")}</div>
    <label class="sp-o"><input type="radio" name="sp-dest" value="casa" onchange="spAggiorna()"><span class="c"><b>🏠 A casa / privato</b><span>${pro ? `Indirizzo di ${escapeHtml(c.pagante?.nome || "proprietario")} o un altro` : "Il tuo indirizzo o un altro"}</span></span></label>
    <div class="sp-extra" id="sp-casa-extra" hidden><input class="input" id="sp-casa-ind" maxlength="160" placeholder="Indirizzo (facoltativo)" value="${escapeHtml(c.casaInd || "")}"></div>
    <div class="sp-sez">${pro ? "Le tue scuderie" : "Scuderie su Equo"}</div>
    <input class="input" id="sp-cerca" placeholder="${pro ? "Cerca scuderia, maneggio, centro ippico…" : "Cerca per nome o città…"}" oninput="spCerca()" autocomplete="off" style="margin-bottom:6px">
    <div id="sp-lista" class="sp-lista"></div>
    <label class="sp-o"><input type="radio" name="sp-dest" value="nuova" onchange="spAggiorna()"><span class="c"><b>${pro ? "+ Nuova scuderia" : "Altra scuderia"}</b><span>${pro ? "Nome e indirizzo, la crei adesso" : "Non è su Equo: scrivi nome e indirizzo"}</span></span></label>
    <div class="sp-extra" id="sp-nuova-extra" hidden>
      <input class="input" id="sp-nuova-nome" maxlength="80" placeholder="Nome (es. Maneggio Il Poggio)" style="margin-bottom:6px">
      <input class="input" id="sp-nuova-ind" maxlength="160" placeholder="Indirizzo (facoltativo)"></div>
    <label class="sp-dal">Dal giorno <input type="date" class="input" id="sp-dal" value="${isoLocale(/* @__PURE__ */ new Date())}"></label>
    <div class="sp-info" id="sp-info" hidden></div>
    <div class="auth-error" id="sp-err" style="display:none"></div>
    <button class="btn btn-primary" id="sp-ok" style="width:100%;margin-top:12px" onclick="confermaSposta(this)">Sposta ${escapeHtml(c.nome)}</button>
    <button class="btn btn-outline" style="width:100%;margin-top:8px" onclick="closeModal('modal-sposta')">Annulla</button></div>`;
		spLista(c.scuderie);
		openModal("modal-sposta");
	}
	function spLista(lista) {
		const box = document.getElementById("sp-lista");
		if (!box) return;
		const scelto = document.querySelector("input[name=\"sp-dest\"]:checked")?.value;
		box.innerHTML = lista.length ? lista.map((s) => `<label class="sp-o${s.attuale ? " attuale" : ""}"><input type="radio" name="sp-dest" value="${s.v}"${scelto === s.v ? " checked" : ""}${s.attuale ? " disabled" : ""} onchange="spAggiorna()">
      <span class="c"><b>${escapeHtml(s.nome)}</b><span>${s.attuale ? "è qui adesso" : escapeHtml(s.sotto || "")}</span></span>${s.equo ? `<span class="sp-pill">${spCtx.vista === "maniscalco" ? "Equo Scuderia" : "Equo"}</span>` : ""}</label>`).join("") : `<div class="muted" style="font-size:12.5px;padding:4px 2px 8px">${spCtx.vista === "maniscalco" ? "Nessuna scuderia con questo nome: usa «+ Nuova scuderia»." : "Scrivi almeno 2 lettere per cercare, oppure usa «Altra scuderia»."}</div>`;
	}
	function spCerca() {
		const q = document.getElementById("sp-cerca").value.trim();
		if (spCtx.vista === "maniscalco") {
			const n = (s) => (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
			spLista(spCtx.scuderie.filter((s) => !q || n(s.nome + " " + s.sotto).includes(n(q))));
			return;
		}
		clearTimeout(spCercaT);
		if (q.length < 2) {
			spLista(spCtx.scuderie);
			return;
		}
		spCercaT = setTimeout(async () => {
			const r = await DB.cercaCentri(q);
			if (document.getElementById("sp-cerca")?.value.trim() !== q) return;
			spLista(r.map((c) => ({
				v: "centro:" + c.id,
				nome: c.nome,
				sotto: [c.citta, c.provincia ? "(" + c.provincia + ")" : ""].filter(Boolean).join(" "),
				equo: true,
				attuale: spCtx.att.key === "centro:" + c.id
			})));
		}, 300);
	}
	function spScelta() {
		const v = document.querySelector("input[name=\"sp-dest\"]:checked")?.value || "";
		const s = [...spCtx.scuderie || []].find((x) => x.v === v) || null;
		return {
			v,
			nome: v === "casa" ? "A casa" : v === "nuova" ? document.getElementById("sp-nuova-nome")?.value.trim() || "la nuova scuderia" : s?.nome || document.querySelector(`input[name="sp-dest"][value="${v}"]`)?.closest(".sp-o")?.querySelector("b")?.textContent || "",
			equo: !!document.querySelector(`input[name="sp-dest"][value="${v}"]`)?.closest(".sp-o")?.querySelector(".sp-pill")
		};
	}
	function spAggiorna() {
		const sc = spScelta(), c = spCtx;
		document.getElementById("sp-casa-extra").hidden = sc.v !== "casa";
		document.getElementById("sp-nuova-extra").hidden = sc.v !== "nuova";
		if (sc.v === "nuova") setTimeout(() => document.getElementById("sp-nuova-nome")?.focus(), 50);
		document.querySelectorAll("#modal-sposta .sp-o").forEach((l) => l.classList.toggle("on", !!l.querySelector("input:checked")));
		const info = document.getElementById("sp-info");
		if (!sc.v) {
			info.hidden = true;
			return;
		}
		info.innerHTML = (c.vista === "maniscalco" ? [
			`Resta cliente <b>${escapeHtml(c.pagante?.nome || "lo stesso")}</b>: incassi e chat non cambiano.`,
			`I prossimi appuntamenti di ${escapeHtml(c.nome)} passano sotto <b>${escapeHtml(sc.v === "casa" ? "A casa" : sc.nome)}</b> in agenda.`,
			c.collegato ? `${escapeHtml(c.pagante.nome)} riceve un messaggio e lo vede nel libretto.` : "",
			sc.equo ? `${escapeHtml(sc.nome)} usa Equo Scuderia: riceve la richiesta di accogliere ${escapeHtml(c.nome)}.` : ""
		] : [
			`I maniscalchi che seguono ${escapeHtml(c.nome)} lo vedono subito e ricevono un messaggio.`,
			sc.equo ? `${escapeHtml(sc.nome)} riceve la richiesta di accogliere ${escapeHtml(c.nome)}.` : "",
			"Resta nel libretto del cavallo."
		]).filter(Boolean).map((t) => "✓ " + t).join("<br>");
		info.hidden = false;
	}
	async function confermaSposta(btn) {
		const sc = spScelta(), c = spCtx;
		const err = document.getElementById("sp-err");
		const errore = (m) => {
			err.textContent = m;
			err.style.display = "block";
		};
		err.style.display = "none";
		if (!sc.v) return errore("Scegli dove va " + c.nome + ".");
		const p = {
			vista: c.vista,
			id: c.id,
			dest: sc.v === "casa" ? "casa" : sc.v === "nuova" ? "nuova" : "scuderia",
			dal: document.getElementById("sp-dal").value || null
		};
		if (sc.v === "casa") p.indirizzo = document.getElementById("sp-casa-ind").value.trim() || null;
		if (sc.v === "nuova") {
			p.nome = document.getElementById("sp-nuova-nome").value.trim();
			p.indirizzo = document.getElementById("sp-nuova-ind").value.trim() || null;
			if (!p.nome) return errore("Scrivi il nome della scuderia.");
		}
		if (sc.v.startsWith("cli:")) p.cliente = sc.v.slice(4);
		if (sc.v.startsWith("centro:")) p.centro = sc.v.slice(7);
		btn.disabled = true;
		const r = await DB.spostaCavallo(p);
		btn.disabled = false;
		if (!r || !r.ok) return errore(r && r.errore || "Non riuscito, riprova.");
		closeModal("modal-sposta");
		const trovalo = c.vista === "maniscalco" && r.luogo !== "A casa" ? ` · lo trovi anche nella scheda di ${r.luogo}, sotto «Qui stanno»` : "";
		showToast(`${c.nome}: ${r.luogo === "A casa" ? "a casa" : "ora sta a " + r.luogo}${r.arrivo ? " · la scuderia riceve la richiesta" : ""}${trovalo}`);
		if (c.vista === "maniscalco") {
			if (r.scuderia_cliente_id && !clienteDiId(r.scuderia_cliente_id)) await loadClientiMascalcia();
			await caricaUbicazioni(true);
			await caricaCavalliMiei();
			if (typeof renderClientiList === "function") renderClientiList();
			if (currentClienteId) await loadClienteInterventi(currentClienteId);
			if (typeof renderAgendaSettimana$1 === "function") renderAgendaSettimana$1();
		} else {
			await loadHorses();
			if (currentHorseId) await openHorseDetail(currentHorseId);
		}
	}
	function luogoProprietario(h) {
		if (h?.ubicazione_tipo === "scuderia") return {
			nome: h.ubicazione_nome || "Scuderia",
			scuderia: true,
			indirizzo: h.ubicazione_indirizzo,
			dal: h.ubicazione_dal
		};
		if (h?.ubicazione_tipo === "casa") return {
			nome: "A casa",
			scuderia: false,
			indirizzo: h.ubicazione_indirizzo,
			dal: h.ubicazione_dal
		};
		return {
			nome: "Non indicato",
			scuderia: false,
			indirizzo: null,
			dal: null,
			vuoto: true
		};
	}
	async function renderDoveStaProprietario(h) {
		const box = document.getElementById("horse-dove");
		if (!box) return;
		const l = luogoProprietario(h);
		box.innerHTML = doveStaHtml({
			...l,
			nome: l.vuoto ? "Dove sta? Non ancora indicato" : l.scuderia ? "Sta a: " + l.nome : l.nome
		}, `<button class="btn btn-primary btn-sm" onclick="apriSpostaCavalloProprietario()">${l.vuoto ? "Indica" : "Sposta"}</button>`);
		const arr = await DB.arriviCavallo(h.id);
		if (currentHorseId !== h.id) return;
		if (arr.some((a) => a.stato === "in_attesa")) box.insertAdjacentHTML("beforeend", `<div class="dove-attesa">⏳ In attesa che ${escapeHtml(l.nome)} confermi l'arrivo.</div>`);
		else if (arr[0] && arr[0].stato === "rifiutato" && Date.now() - new Date(arr[0].risposto_il || 0).getTime() < 6048e5) box.insertAdjacentHTML("beforeend", `<div class="dove-attesa no">⚠️ La scuderia ha risposto che ${escapeHtml(h.name)} non è da loro: è tornato dov'era.</div>`);
	}
	function spostamentoHtml(s) {
		const d = new Date(s.creato);
		const ic = {
			spostamento: "📍",
			uscita: "↗️",
			arrivo: "✅",
			arrivo_rifiutato: "⚠️"
		}[s.tipo] || "📍";
		return `<div class="sposta-voce"><span class="data"><b>${d.getDate()}</b>${AG_MESI[d.getMonth()]} ${d.getFullYear()}</span><span class="t">${ic} ${escapeHtml(s.descrizione)}</span></div>`;
	}
	// equo-app-src/src/ruoli/maniscalco/moduli/053-agenda-settimanale-maniscalco.js
	var AG_GIORNI = [
		"Lun",
		"Mar",
		"Mer",
		"Gio",
		"Ven",
		"Sab",
		"Dom"
	];
	var AG_MESI = [
		"gen",
		"feb",
		"mar",
		"apr",
		"mag",
		"giu",
		"lug",
		"ago",
		"set",
		"ott",
		"nov",
		"dic"
	];
	var AG_MESI_LUNGHI = [
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
	var agRenderToken = 0;
	function agLunedi(offset) {
		const oggi = /* @__PURE__ */ new Date();
		const d = new Date(oggi.getFullYear(), oggi.getMonth(), oggi.getDate());
		const dow = (d.getDay() + 6) % 7;
		d.setDate(d.getDate() - dow + offset * 7);
		return d;
	}
	function agEtichettaSettimana(lun) {
		const dom = new Date(lun.getFullYear(), lun.getMonth(), lun.getDate() + 6);
		if (lun.getMonth() === dom.getMonth()) return `${lun.getDate()} – ${dom.getDate()} ${AG_MESI_LUNGHI[dom.getMonth()]} ${dom.getFullYear()}`;
		return `${lun.getDate()} ${AG_MESI[lun.getMonth()]} – ${dom.getDate()} ${AG_MESI[dom.getMonth()]} ${dom.getFullYear()}`;
	}
	function agNomeCavallo(i) {
		if (i.cavalli_clienti_mascalcia?.nome) return i.cavalli_clienti_mascalcia.nome;
		const elenco = i.clienti_mascalcia?.nome_cavallo || "";
		return !i.cavallo_cliente_id && elenco && !elenco.includes(",") ? elenco : "";
	}
	function agDescrizioneTipoPro(i) {
		const t = agDescrizioneTipo(i);
		if (i.ferri_nuovi === false) return t + " · rimessa";
		if (i.ferri_nuovi === true && i.quantita_ferri) return t.replace(/(\d+) ferri$/, "$1 ferri nuovi");
		return t;
	}
	function agDescrizioneTipo(i) {
		let t = TIPO_FERRATURA_LABELS[i.tipo_ferratura] || i.tipo_ferratura || "";
		if (i.tipo_ferratura === "altro" && i.tipo_altro) t = i.tipo_altro;
		const extra = [];
		if (i.numero_ferro) extra.push("n. " + i.numero_ferro + (i.misura_sistema ? " " + MISURA_SISTEMA_LABEL[i.misura_sistema] : ""));
		if (i.quantita_ferri) extra.push(i.quantita_ferri + " ferri");
		return [t, ...extra].join(" · ");
	}
	function agGiornoLavoro(iso) {
		if (!iso) return iso;
		const [y, m, d] = iso.split("-").map(Number);
		return new Date(y, m - 1, d).getDay() === 0 ? aggiungiGiorniIso(iso, 1) : iso;
	}
	async function renderAgendaSettimana$1(direzione) {
		const box = document.getElementById("ag-week");
		if (!box) return;
		const token = ++agRenderToken;
		const lun = agLunedi(agSettimanaOffset);
		const giorni = Array.from({ length: 7 }, (_, k) => new Date(lun.getFullYear(), lun.getMonth(), lun.getDate() + k));
		const isoGiorni = giorni.map(isoLocale);
		const oggiIso = isoLocale(/* @__PURE__ */ new Date());
		document.getElementById("ag-week-label").textContent = agEtichettaSettimana(lun);
		document.getElementById("ag-oggi-btn").style.display = agSettimanaOffset === 0 ? "none" : "inline-block";
		if (!agGiorniAperti) agGiorniAperti = /* @__PURE__ */ new Set([oggiIso]);
		renderRichiestePendenti();
		const pmAttesa = pmCaricaSettimana(isoGiorni[0], isoGiorni[6]).catch(() => []);
		const [eventi, scadenze] = await Promise.all([
			DB.listInterventiPeriodo(isoGiorni[0], isoGiorni[6]),
			DB.listScadenzePeriodo(aggiungiGiorniIso(isoGiorni[0], -1), isoGiorni[6]),
			caricaUbicazioni()
		]);
		const promemoria2 = await pmAttesa;
		if (token !== agRenderToken) return;
		agEventiCache = {};
		(typeof hpAppuntamenti !== "undefined" ? hpAppuntamenti : []).forEach((e) => {
			agEventiCache[e.id] = e;
		});
		eventi.forEach((e) => {
			agEventiCache[e.id] = e;
		});
		scadenze.forEach((sc) => {
			sc.data_vista = agGiornoLavoro(sc.prossima_scadenza);
			agEventiCache["sc:" + sc.id] = sc;
		});
		agGiorniDati = giorni.map((g, k) => {
			const iso = isoGiorni[k];
			return {
				iso,
				k,
				g,
				oggi: iso === oggiIso,
				ev: eventi.filter((e) => e.data_intervento === iso),
				sc: scadenze.filter((sc) => sc.data_vista === iso),
				pm: promemoria2.filter((p) => isoLocale(new Date(p.quando)) === iso)
			};
		});
		agDisegnaGriglia();
		if (typeof agAggiornaSchede === "function") agAggiornaSchede();
		box.classList.remove("slide-l", "slide-r");
		if (direzione) {
			box.offsetWidth;
			box.classList.add(direzione > 0 ? "slide-l" : "slide-r");
		}
		agAttivaSwipe(box);
	}
	// equo-app-src/src/ruoli/maniscalco/moduli/041-giro-della-zona-premium.js
	var GIRO_GIORNI = 14;
	function hpGiri() {
		const per = {};
		hpRichiamiLista.filter((r) => r.giorni <= GIRO_GIORNI).forEach((r) => {
			(per[r.cliente_mascalcia_id] = per[r.cliente_mascalcia_id] || []).push(r);
		});
		return Object.values(per).filter((l) => l.length >= 2).sort((a, b) => b.length - a.length);
	}
	function hpRigaGiro(l) {
		const nomi = l.map((r) => r.cavallo_nome || "cavallo").join(", ");
		const ritardo = l.some((r) => r.giorni < 0);
		return `<div class="hp-giro" onclick="apriGiro('${l[0].cliente_mascalcia_id}')">
    <div class="hp-giro-ic"><i class="fa-solid fa-route"></i></div>
    <div class="hp-main"><b>Giro · ${escapeHtml(l[0].cliente_nome || "")}</b>
      <span>${l.length} cavalli ${ritardo ? "da fare (alcuni in ritardo)" : "entro 14 giorni"}: ${escapeHtml(nomi)}</span></div>
    ${isPremium() ? "" : "<span class=\"hp-prem\">PREMIUM</span>"}<span class="ag-chev" style="color:var(--muted)">›</span></div>`;
	}
	function giroDataProposta(l) {
		const oggi = isoLocale(/* @__PURE__ */ new Date());
		const future = l.map((r) => r.scadenza).filter((d) => d >= oggi).sort();
		return l.some((r) => r.giorni < 0) || !future.length ? aggiungiGiorniIso(oggi, 1) : future[0];
	}
	function giroTipoPrevalente(l) {
		const n = {};
		l.forEach((r) => {
			n[r.tipo_ferratura] = (n[r.tipo_ferratura] || 0) + 1;
		});
		return Object.entries(n).sort((a, b) => b[1] - a[1])[0][0];
	}
	var giroCorrente = null;
	async function apriGiro(clienteId) {
		if (!isPremium()) {
			showToast("Il giro della zona è incluso in Equo Premium");
			togglePiano();
			return;
		}
		const l = hpGiri().find((g) => g[0].cliente_mascalcia_id === clienteId);
		if (!l) return;
		if (!clientiMascalcia || !clientiMascalcia.some((x) => x.id === clienteId)) clientiMascalcia = await DB.listClientiMascalcia();
		const tipo = giroTipoPrevalente(l);
		if (isStrutturaCollegata(clienteId)) {
			const diversi = l.filter((r) => r.tipo_ferratura !== tipo).map((r) => `${r.cavallo_nome}: ${hpTipo(r).toLowerCase()}`);
			await apriPropostaStruttura(clienteId, {
				tipo_ferratura: tipo,
				data_intervento: giroDataProposta(l),
				cavalli: l.map((r) => r.cavallo_cliente_id).filter(Boolean)
			});
			if (diversi.length) document.getElementById("prop-str-note").value = diversi.join(" · ");
			return;
		}
		giroCorrente = {
			clienteId,
			lista: l
		};
		document.getElementById("giro-nome").textContent = l[0].cliente_nome || "cliente";
		document.getElementById("giro-data").value = giroDataProposta(l);
		document.getElementById("giro-data").min = isoLocale(/* @__PURE__ */ new Date());
		document.getElementById("giro-ora").value = "";
		document.getElementById("giro-error").style.display = "none";
		document.getElementById("giro-cavalli").innerHTML = l.map((r) => `<label class="giro-cav"><input type="checkbox" class="giro-cav-ck" value="${r.intervento_id}" checked style="width:18px;height:18px">
    <span><b>${escapeHtml(r.cavallo_nome || "Cavallo")}</b> · ${escapeHtml(hpTipo(r))}</span><small class="${hpColoreRic(r) === "rosso" ? "" : ""}">${hpQuando(r)}</small></label>`).join("");
		openModal("modal-giro");
	}
	async function confermaGiro() {
		const g = giroCorrente;
		if (!g) return;
		const err = document.getElementById("giro-error");
		err.style.display = "none";
		const data = document.getElementById("giro-data").value;
		const ora = document.getElementById("giro-ora").value || null;
		const scelti = Array.from(document.querySelectorAll(".giro-cav-ck:checked")).map((el) => el.value);
		if (!data) {
			err.textContent = "Scegli la data.";
			err.style.display = "block";
			return;
		}
		if (!scelti.length) {
			err.textContent = "Seleziona almeno un cavallo.";
			err.style.display = "block";
			return;
		}
		const righe = g.lista.filter((r) => scelti.includes(r.intervento_id));
		for (const r of righe) {
			const { error } = await DB.insertInterventoMascalcia({
				cliente_mascalcia_id: r.cliente_mascalcia_id,
				cavallo_cliente_id: r.cavallo_cliente_id,
				horse_id: r.horse_id,
				tipo_ferratura: r.tipo_ferratura,
				tipo_altro: r.tipo_altro,
				misura_sistema: r.misura_sistema,
				numero_ferro: r.numero_ferro,
				quantita_ferri: r.quantita_ferri,
				data_intervento: data,
				ora,
				stato: "programmato",
				prossima_scadenza: null,
				importo: null,
				stato_pagamento: "da_saldare",
				note: null
			});
			if (error) {
				err.textContent = "Non sono riuscito a salvare: " + error.message;
				err.style.display = "block";
				await renderProDeadlines();
				return;
			}
		}
		closeModal("modal-giro");
		showToast(`Giro fissato: ${righe.length} cavalli ${formatDataBreve(data)}${ora ? " ore " + ora : ""}`);
		giroCorrente = null;
		await renderProDeadlines();
		if (document.getElementById("ag-week")) renderAgendaSettimana$1();
		if (document.getElementById("giro-avvisa").checked) {
			const nome = (righe[0].cliente_nome || "").split(" ")[0];
			const elenco = righe.map((r) => `${r.cavallo_nome || "cavallo"} (${hpTipo(r).toLowerCase()})`).join(", ");
			await openChatThread(g.clienteId);
			const inp = document.getElementById("mchat-input");
			if (inp) {
				inp.value = `Ciao${nome && righe[0].tipo_cliente !== "struttura" ? " " + nome : ""}, passo ${formatDataBreve(data)}${ora ? " alle " + ora : ""} per ${elenco}. Ti va bene?`;
				inp.focus();
			}
		}
	}
	async function hpSegnaFatto(id) {
		await segnaFattoAgenda(id);
	}
	function apriListaHome(tipo) {
		hpListaTipo = tipo;
		hpListaFiltro = "tutti";
		document.getElementById("hp-lista-titolo").textContent = tipo === "app" ? "Prossimi appuntamenti" : "Da richiamare";
		renderListaHome();
		openModal("modal-hp-lista");
	}
	function hpFiltra(f) {
		hpListaFiltro = f;
		renderListaHome();
	}
	function renderListaHome() {
		const filtri = hpListaTipo === "app" ? [
			["tutti", "Tutti"],
			["rosso", "Da chiudere"],
			["ocra", "Da confermare"],
			["verde", "Confermati"]
		] : [
			["tutti", "Tutti"],
			["rosso", "In ritardo"],
			["ocra", "Questa settimana"],
			["verde", "Prossimi 30 giorni"]
		];
		document.getElementById("hp-lista-filtri").innerHTML = filtri.map(([k, t]) => `<button class="${hpListaFiltro === k ? "on" : ""}" onclick="hpFiltra('${k}')">${t}</button>`).join("");
		const corpo = document.getElementById("hp-lista-corpo");
		if (hpListaTipo === "app") {
			const l = hpAppuntamenti.filter((e) => hpListaFiltro === "tutti" || hpColoreApp(e) === hpListaFiltro);
			corpo.innerHTML = l.length ? hpListaApp(l) : "<div class=\"muted\" style=\"font-size:13px;padding:10px 0\">Nessun appuntamento.</div>";
		} else {
			const l = hpRichiamiLista.filter((r) => hpListaFiltro === "tutti" || hpColoreRic(r) === hpListaFiltro);
			corpo.innerHTML = l.length ? hpListaRic(l) : "<div class=\"muted\" style=\"font-size:13px;padding:10px 0\">Nessun cavallo in questo gruppo.</div>";
		}
	}
	function apriRichiamo(id) {
		const r = hpRichiami[id];
		if (!r) return;
		hpRichiamoId = id;
		document.getElementById("ricaz-titolo").textContent = (r.cliente_nome || "Cliente") + (r.cavallo_nome ? " · " + r.cavallo_nome : "");
		document.getElementById("ricaz-dettaglio").innerHTML = [
			`<span class="hp-dot ${hpColoreRic(r)}" style="display:inline-block;vertical-align:-1px;margin-right:6px"></span><b>${escapeHtml(hpTipo(r))}</b> · ${hpQuando(r)} (${formatDate(r.scadenza)})`,
			`Ultimo intervento: ${formatDate(r.data_intervento)}`,
			r.rimandato ? `Rimandato: in origine era il ${formatDate(r.prossima_scadenza)}` : "",
			r.tipo_cliente === "struttura" ? "<span style=\"font-size:12px\">Cliente scuderia: l'appuntamento va confermato dalla scuderia.</span>" : ""
		].filter(Boolean).join("<br>");
		document.getElementById("ricaz-scrivi").innerHTML = "<span class=\"fa-icon\"><i class=\"fa-solid fa-comment\"></i></span> Scrivi al cliente" + (isPremium() ? "" : "<span class=\"hp-prem\">PREMIUM</span>");
		richiamoMostraAzioni();
		openModal("modal-richiamo-az");
	}
	function richiamoMostraAzioni() {
		document.getElementById("ricaz-azioni").style.display = "";
		document.getElementById("ricaz-rimanda").style.display = "none";
	}
	async function richiamoAzione(tipo) {
		const r = hpRichiami[hpRichiamoId];
		if (!r) return;
		if (tipo === "fissa") {
			closeModal("modal-richiamo-az");
			const oggi = isoLocale(/* @__PURE__ */ new Date());
			openInterventoModal(r.cliente_mascalcia_id, null, {
				tipo_ferratura: r.tipo_ferratura,
				tipo_altro: r.tipo_altro,
				misura_sistema: r.misura_sistema,
				numero_ferro: r.numero_ferro,
				quantita_ferri: r.quantita_ferri,
				data_intervento: r.scadenza > oggi ? r.scadenza : oggi,
				cavallo_cliente_id: r.cavallo_cliente_id,
				horse_id: r.horse_id
			});
		} else if (tipo === "scrivi") {
			closeModal("modal-richiamo-az");
			if (!isPremium()) {
				await openChatThread(r.cliente_mascalcia_id);
				showToast("Con Equo Premium trovi il messaggio già pronto da inviare");
				return;
			}
			const nome = (r.cliente_nome || "").split(" ")[0];
			const testo = `Ciao${nome && r.tipo_cliente !== "struttura" ? " " + nome : ""}, ${r.giorni < 0 ? "è ora di rifare" : "si avvicina"} ${hpTipo(r).toLowerCase()}${r.cavallo_nome ? " di " + r.cavallo_nome : ""}${r.giorni < 0 ? "" : " (" + formatDataBreve(r.scadenza) + ")"}. Quando ti va bene che passi?`;
			await openChatThread(r.cliente_mascalcia_id);
			const inp = document.getElementById("mchat-input");
			if (inp) {
				inp.value = testo;
				inp.focus();
			}
		} else if (tipo === "rimanda") {
			document.getElementById("ricaz-azioni").style.display = "none";
			document.getElementById("ricaz-rimanda").style.display = "block";
			const inp = document.getElementById("ricaz-data");
			inp.min = isoLocale(/* @__PURE__ */ new Date());
			inp.value = r.scadenza < inp.min ? inp.min : r.scadenza;
			document.getElementById("ricaz-attuale").textContent = "Scadenza attuale: " + formatDataBreve(r.scadenza) + " (" + hpQuando(r) + ")";
			richiamoAnteprima();
		} else if (tipo === "chiudi") {
			if (!confirm(`Non ricordarti più ${hpTipo(r).toLowerCase()}${r.cavallo_nome ? " di " + r.cavallo_nome : ""}? Tornerà solo quando registrerai un nuovo intervento.`)) return;
			const { error } = await DB.setRichiamoStato(r.intervento_id, { chiuso_il: (/* @__PURE__ */ new Date()).toISOString() });
			if (error) {
				showToast("Errore: " + error.message);
				return;
			}
			closeModal("modal-richiamo-az");
			showToast("Fatto, non te lo ricordo più");
			await renderProDeadlines();
		}
	}
	function richiamoSposta(d) {
		const r = hpRichiami[hpRichiamoId];
		if (!r) return;
		const inp = document.getElementById("ricaz-data"), oggi = isoLocale(/* @__PURE__ */ new Date());
		let v = aggiungiGiorniIso(inp.value || r.scadenza, d);
		if (v < oggi) v = oggi;
		inp.value = v;
		richiamoAnteprima();
	}
	function richiamoAnteprima() {
		const v = document.getElementById("ricaz-data").value, box = document.getElementById("ricaz-anteprima");
		if (!v) {
			box.textContent = "";
			return;
		}
		const g = giorniTra(isoLocale(/* @__PURE__ */ new Date()), v);
		box.textContent = "Nuova scadenza: " + formatDataBreve(v) + " (" + (g < 0 ? "nel passato" : g === 0 ? "oggi" : g === 1 ? "domani" : "tra " + g + " giorni") + ")";
		box.style.color = g < 0 ? "var(--red)" : "";
	}
	async function richiamoCambiaData() {
		const r = hpRichiami[hpRichiamoId];
		if (!r) return;
		const data = document.getElementById("ricaz-data").value;
		if (!data) {
			showToast("Scegli la data");
			return;
		}
		if (data < isoLocale(/* @__PURE__ */ new Date())) {
			showToast("La scadenza non può essere nel passato");
			return;
		}
		const { error } = await DB.updateInterventoMascalcia(r.intervento_id, { prossima_scadenza: data });
		if (error) {
			showToast("Errore: " + error.message);
			return;
		}
		if (r.rimandato) await DB.setRichiamoStato(r.intervento_id, { rimandato_al: null });
		closeModal("modal-richiamo-az");
		showToast("Nuova scadenza" + (r.cavallo_nome ? " di " + r.cavallo_nome : "") + ": " + formatDataBreve(data));
		await renderProDeadlines();
		if (schedaCavalloKey && document.getElementById("cavallo-pro-view")?.style.display === "block") await apriSchedaCavalloPro(schedaCavalloKey, true);
	}
	async function apriScadenzaCavallo() {
		const cv = schedaCavalli.find((c) => c.key === schedaCavalloKey);
		if (!cv) return;
		const st = statoCavalloPro(cv, schedaStoricoCavallo || []);
		if (st.prossimo?.fissato) {
			const app = (schedaStoricoCavallo || []).filter((i) => [
				"programmato",
				"richiesto",
				"proposto"
			].includes(i.stato) && i.data_intervento === st.prossimo.data)[0];
			if (app) return openInterventoModal(null, app);
		}
		const u = st.ultimo;
		if (!u || !u.prossima_scadenza) {
			showToast("Nessuna scadenza: si crea quando segni fatto un lavoro.");
			return;
		}
		if (!hpRichiami[u.id]) {
			const cli = clientiMascalcia.find((c) => c.id === u.cliente_mascalcia_id);
			hpRichiami[u.id] = {
				intervento_id: u.id,
				cliente_mascalcia_id: u.cliente_mascalcia_id,
				cliente_nome: cli?.nome || "",
				tipo_cliente: cli?.tipo_cliente || null,
				cavallo_cliente_id: u.cavallo_cliente_id,
				horse_id: u.horse_id,
				cavallo_nome: cv.nome,
				tipo_ferratura: u.tipo_ferratura,
				tipo_altro: u.tipo_altro,
				misura_sistema: u.misura_sistema,
				numero_ferro: u.numero_ferro,
				quantita_ferri: u.quantita_ferri,
				data_intervento: u.data_intervento,
				prossima_scadenza: u.prossima_scadenza,
				scadenza: u.prossima_scadenza,
				rimandato: false,
				giorni: giorniTra(isoLocale(/* @__PURE__ */ new Date()), u.prossima_scadenza)
			};
		}
		apriRichiamo(u.id);
	}
	async function richiamoRimanda(giorni) {
		const r = hpRichiami[hpRichiamoId];
		if (!r) return;
		const data = giorni ? aggiungiGiorniIso(isoLocale(/* @__PURE__ */ new Date()), giorni) : document.getElementById("ricaz-data").value;
		if (!data) {
			showToast("Scegli una data");
			return;
		}
		const { error } = await DB.setRichiamoStato(r.intervento_id, { rimandato_al: data });
		if (error) {
			showToast("Errore: " + error.message);
			return;
		}
		closeModal("modal-richiamo-az");
		showToast("Te lo ricordo " + formatDataBreve(data));
		await renderProDeadlines();
	}
	// equo-app-src/src/ruoli/maniscalco/moduli/040-home-pro-prossimi-appuntamenti-da-richia.js
	var HP_IN_HOME = 5;
	function hpTipo(i) {
		if (i.tipo_ferratura === "altro" && i.tipo_altro) return i.tipo_altro;
		return TIPO_FERRATURA_LABELS[i.tipo_ferratura] || i.tipo_ferratura || "Intervento";
	}
	function hpGiornoEtichetta(iso) {
		const g = giorniTra(isoLocale(/* @__PURE__ */ new Date()), iso);
		if (g === 0) return "Oggi";
		if (g === 1) return "Domani";
		if (g < 0) return "Da chiudere";
		const [y, m, d] = iso.split("-").map(Number);
		return `${AG_GIORNI[(new Date(y, m - 1, d).getDay() + 6) % 7]} ${d} ${AG_MESI[m - 1]}`;
	}
	function hpColoreApp(e) {
		if (e.data_intervento < isoLocale(/* @__PURE__ */ new Date())) return "rosso";
		return e.stato === "richiesto" || e.stato === "proposto" ? "ocra" : "verde";
	}
	function hpColoreRic(r) {
		return r.giorni < 0 ? "rosso" : r.giorni <= 7 ? "ocra" : "verde";
	}
	function hpQuando(r) {
		if (r.giorni < 0) return `in ritardo di ${-r.giorni} ${-r.giorni === 1 ? "giorno" : "giorni"}`;
		if (r.giorni === 0) return "scade oggi";
		if (r.giorni === 1) return "scade domani";
		return `tra ${r.giorni} giorni`;
	}
	function hpPill(n, col, txt) {
		return n ? `<span class="hp-pill"><i style="background:${col}"></i>${n} ${txt}</span>` : "";
	}
	function hpRigaApp(e) {
		const col = hpColoreApp(e);
		const cav = agNomeCavallo(e);
		const stato = col === "rosso" ? "<span class=\"rosso\">" + formatDataBreve(e.data_intervento) + " · non ancora segnato fatto</span>" : e.stato === "richiesto" ? "<span class=\"ocra\">Richiesta del cliente · da confermare</span>" : e.stato === "proposto" ? "<span class=\"ocra\">In attesa della scuderia</span>" : `<span>${escapeHtml(agDescrizioneTipoPro(e))}</span>`;
		const btn = e.stato === "richiesto" ? `<button class="ag-ev-fatto" onclick="event.stopPropagation();accettaRichiesta('${e.id}')">Accetta</button>` : e.stato === "proposto" ? "" : `<button class="ag-ev-fatto" onclick="event.stopPropagation();hpSegnaFatto('${e.id}')">Fatto</button>`;
		return `<div class="hp-riga" onclick="apriAzioniEvento('${e.id}')">
    <span class="hp-dot ${col}"></span>
    <div class="hp-ora">${e.ora ? String(e.ora).slice(0, 5) : "—"}</div>
    <div class="hp-main"><b>${escapeHtml(e.clienti_mascalcia?.nome || "")}${cav ? " · " + escapeHtml(cav) : ""}</b>${stato}</div>
    ${btn}</div>`;
	}
	function hpListaApp(lista) {
		let html = "", ultimo = null;
		lista.forEach((e) => {
			const et = hpGiornoEtichetta(e.data_intervento);
			if (et !== ultimo) {
				html += `<div class="hp-gruppo">${et}</div>`;
				ultimo = et;
			}
			html += hpRigaApp(e);
		});
		return html;
	}
	function hpRigaRic(r) {
		const col = hpColoreRic(r);
		return `<div class="hp-riga" onclick="apriRichiamo('${r.intervento_id}')">
    <span class="hp-dot ${col}"></span>
    <div class="hp-main"><b>${escapeHtml(r.cliente_nome || "")}${r.cavallo_nome ? " · " + escapeHtml(r.cavallo_nome) : ""}</b>
      <span class="${col === "verde" ? "" : col}">${escapeHtml(hpTipo(r))} · ${hpQuando(r)}${r.rimandato ? "<span class=\"hp-tag\">rimandato</span>" : ""}</span></div>
    <span class="ag-chev" style="color:var(--muted)">›</span></div>`;
	}
	function hpGruppoRic(r) {
		return r.giorni < 0 ? "In ritardo" : r.giorni <= 7 ? "Questa settimana" : "Prossimi 30 giorni";
	}
	function hpListaRic(lista) {
		let html = "", ultimo = null;
		lista.forEach((r) => {
			const g = hpGruppoRic(r);
			if (g !== ultimo) {
				html += `<div class="hp-gruppo">${g}</div>`;
				ultimo = g;
			}
			html += hpRigaRic(r);
		});
		return html;
	}
	async function renderProDeadlines() {
		const boxApp = document.getElementById("home-pro-appuntamenti");
		const boxRic = document.getElementById("home-pro-deadlines");
		if (!boxApp && !boxRic) return;
		const [app0, ric] = await Promise.all([DB.listProssimiAppuntamenti(50), DB.listRichiami(30)]);
		const app = agOrdinaGiro(app0);
		hpAppuntamenti = app;
		app.forEach((e) => {
			agEventiCache[e.id] = e;
		});
		hpRichiamiLista = ric;
		hpRichiami = {};
		ric.forEach((r) => {
			hpRichiami[r.intervento_id] = r;
		});
		if (boxApp) {
			const n = {
				rosso: 0,
				ocra: 0
			};
			app.forEach((e) => {
				const c = hpColoreApp(e);
				if (n[c] != null) n[c]++;
			});
			document.getElementById("hp-app-conta").innerHTML = hpPill(n.rosso, "#c0473d", "da chiudere") + hpPill(n.ocra, "#d9a13b", "da confermare");
			boxApp.innerHTML = !app.length ? "<div class=\"muted\" style=\"font-size:13px\">Nessun appuntamento in agenda. <a href=\"#\" onclick=\"event.preventDefault();openInterventoModal(null)\" style=\"color:var(--accent);font-weight:700\">Aggiungine uno</a></div>" : hpListaApp(app.slice(0, HP_IN_HOME)) + (app.length > HP_IN_HOME ? `<button class="btn btn-outline btn-sm hp-vedi" onclick="apriListaHome('app')">Vedi tutti (${app.length}${app.length >= 50 ? "+" : ""})</button>` : "");
		}
		if (boxRic) {
			const n = {
				rosso: 0,
				ocra: 0
			};
			ric.forEach((r) => {
				const c = hpColoreRic(r);
				if (n[c] != null) n[c]++;
			});
			document.getElementById("hp-ric-conta").innerHTML = hpPill(n.rosso, "#c0473d", "in ritardo") + hpPill(n.ocra, "#d9a13b", "questa settimana");
			boxRic.innerHTML = !ric.length ? "<div class=\"muted\" style=\"font-size:13px\">Nessun cavallo da richiamare nei prossimi 30 giorni.</div>" : hpGiri().map(hpRigaGiro).join("") + hpListaRic(ric.slice(0, HP_IN_HOME)) + (ric.length > HP_IN_HOME ? `<button class="btn btn-outline btn-sm hp-vedi" onclick="apriListaHome('ric')">Vedi tutti (${ric.length})</button>` : "");
		}
		if (document.getElementById("modal-hp-lista")?.classList.contains("active")) renderListaHome();
		if (typeof wgRidisegna === "function") wgRidisegna();
	}
	// equo-app-src/src/ruoli/maniscalco/moduli/102-scadenze-della-struttura.js
	var CICLO_MIN = 7;
	var CICLO_MAX = 180;
	var CICLO_PARTENZA = 35;
	var TIPI_CICLO = [
		"ferratura",
		"mezza_ferratura",
		"pareggio"
	];
	var cicloTimer = null;
	function intervalloStruttura(clienteId) {
		const c = (clientiMascalcia || []).find((x) => x.id === clienteId);
		const g = c ? Number(c.intervallo_giorni) : NaN;
		return g >= CICLO_MIN && g <= CICLO_MAX ? g : null;
	}
	function renderCicloStruttura(c) {
		const box = document.getElementById("cli-ciclo");
		if (!box) return;
		if (!c || !isStruttura(c) || c.archiviato_il) {
			box.innerHTML = "";
			box.style.display = "none";
			return;
		}
		box.style.display = "";
		const g = intervalloStruttura(c.id);
		box.innerHTML = `<div class="ciclo-tit">Scadenze della struttura</div>
    <div class="ciclo-riga"><span>Ferratura ogni</span>
      ${g ? `<div class="ciclo-step"><button type="button" onclick="cicloCambia(-1)" aria-label="Meno giorni">−</button><b id="ciclo-val">${g}</b><button type="button" onclick="cicloCambia(1)" aria-label="Più giorni">+</button></div><span>giorni</span>` : `<button type="button" class="btn btn-outline btn-sm" onclick="cicloCambia(0)">Imposta</button>`}</div>
    <div class="ciclo-nota">${g ? `Quando segni fatto un cavallo di questa struttura, la prossima scadenza è tra ${g} giorni. <button type="button" class="ciclo-link" onclick="cicloTogli()">Togli</button>` : "Non impostato: ogni cavallo usa il suo intervallo."}</div>
    <button type="button" class="btn btn-outline btn-sm ciclo-allinea" onclick="apriAllineaScadenze()">Allinea le scadenze dei cavalli</button>`;
	}
	function cicloCambia(d) {
		const c = clientiMascalcia.find((x) => x.id === currentClienteId);
		if (!c) return;
		const g = intervalloStruttura(c.id);
		const nuovo = !g ? CICLO_PARTENZA : Math.max(CICLO_MIN, Math.min(CICLO_MAX, g + d));
		c.intervallo_giorni = nuovo;
		renderCicloStruttura(c);
		clearTimeout(cicloTimer);
		cicloTimer = setTimeout(() => cicloSalva(c.id, nuovo), 700);
	}
	async function cicloSalva(id, v) {
		const { error } = await DB.updateClienteMascalcia(id, { intervallo_giorni: v });
		if (error) {
			showToast(/intervallo_giorni/.test(error.message || "") ? "Manca un aggiornamento del database: avvisa l'assistenza Equo." : "Errore: " + error.message);
			return;
		}
		showToast(v ? `Struttura: ferratura ogni ${v} giorni` : "Intervallo della struttura tolto");
	}
	function cicloTogli() {
		const c = clientiMascalcia.find((x) => x.id === currentClienteId);
		if (!c) return;
		clearTimeout(cicloTimer);
		c.intervallo_giorni = null;
		renderCicloStruttura(c);
		cicloSalva(c.id, null);
	}
	var allineaLista = [];
	async function apriAllineaScadenze() {
		const c = clientiMascalcia.find((x) => x.id === currentClienteId);
		if (!c) return;
		document.getElementById("all-tit").textContent = "Allinea le scadenze · " + c.nome;
		document.getElementById("all-righe").innerHTML = "<div class=\"loading\"><div class=\"spinner\"></div> Caricamento...</div>";
		document.getElementById("all-ok").disabled = true;
		openModal("modal-allinea");
		const tutti = await DB.ultimiFattiCliente(c.id, TIPI_CICLO);
		const visti = /* @__PURE__ */ new Set();
		allineaLista = [];
		tutti.forEach((i) => {
			const k = i.cavallo_cliente_id || i.horse_id;
			if (!k || visti.has(k)) return;
			visti.add(k);
			if (i.prossima_scadenza) allineaLista.push(i);
		});
		allineaLista.sort((a, b) => a.prossima_scadenza.localeCompare(b.prossima_scadenza) || nomeAll(a).localeCompare(nomeAll(b)));
		const inp = document.getElementById("all-data");
		const oggi = isoLocale(/* @__PURE__ */ new Date());
		const prima = allineaLista.length ? allineaLista[0].prossima_scadenza : aggiungiGiorniIso(oggi, intervalloStruttura(c.id) || CICLO_PARTENZA);
		inp.min = oggi;
		inp.value = prima < oggi ? oggi : prima;
		allineaRender();
	}
	function nomeAll(i) {
		return i.cavalli_clienti_mascalcia?.nome || "Cavallo";
	}
	function allineaRender() {
		const d = document.getElementById("all-data").value;
		const box = document.getElementById("all-righe"), ok = document.getElementById("all-ok");
		if (!allineaLista.length) {
			box.innerHTML = "<div class=\"muted\" style=\"font-size:13px\">Nessun cavallo di questa struttura ha una prossima scadenza: prima segna fatta una ferratura.</div>";
			ok.disabled = true;
			ok.textContent = "Allinea";
			return;
		}
		const daCambiare = allineaLista.filter((i) => i.prossima_scadenza !== d).length;
		box.innerHTML = allineaLista.map((i) => `<div class="all-riga${i.prossima_scadenza === d ? " uguale" : ""}"><b>${escapeHtml(nomeAll(i))}</b>
      <span>${escapeHtml(formatDataBreve(i.prossima_scadenza))}${i.prossima_scadenza === d ? "" : " → " + escapeHtml(formatDataBreve(d))}</span></div>`).join("");
		ok.disabled = !d || !daCambiare;
		ok.textContent = !daCambiare ? "Già tutte allineate" : `Allinea ${daCambiare === 1 ? "1 cavallo" : daCambiare + " cavalli"} al ${formatDataBreve(d)}`;
	}
	async function confermaAllineaScadenze() {
		const d = document.getElementById("all-data").value;
		if (!d) {
			showToast("Scegli la data");
			return;
		}
		const ids = allineaLista.filter((i) => i.prossima_scadenza !== d).map((i) => i.id);
		if (!ids.length) return;
		const ok = document.getElementById("all-ok");
		ok.disabled = true;
		const { error } = await DB.allineaScadenze(ids, d);
		if (error) {
			ok.disabled = false;
			showToast("Errore: " + error.message);
			return;
		}
		closeModal("modal-allinea");
		showToast(`${ids.length === 1 ? "1 cavallo" : ids.length + " cavalli"}: prossima scadenza ${formatDataBreve(d)}`);
		try {
			await openClienteDetail(currentClienteId);
			await renderProDeadlines();
		} catch (e) {}
	}
	// equo-app-src/src/ruoli/maniscalco/moduli/103-intervallo-prezzo-anagrafica-cavallo.js
	var INT_MIN = 7;
	var INT_MAX = 180;
	var TIPO_DI_LAVORO = {
		completa: "ferratura",
		mezza: "mezza_ferratura",
		pareggio: "pareggio"
	};
	function intervalloCavallo(cv) {
		const g = cv ? Number(cv.intervallo_giorni) : NaN;
		return g >= INT_MIN && g <= INT_MAX ? g : null;
	}
	function intervalloEffettivo(cv, clienteId, storico) {
		const gc = intervalloCavallo(cv);
		if (gc) return {
			giorni: gc,
			da: "cavallo"
		};
		const gs = intervalloStruttura(clienteId);
		if (gs) return {
			giorni: gs,
			da: "struttura"
		};
		const tipo = TIPO_DI_LAVORO[cv?.ferratura_tipo] || "ferratura";
		const ult = (storico || []).filter((i) => i.stato === "fatto" && i.tipo_ferratura === tipo && i.prossima_scadenza).sort((a, b) => b.data_intervento.localeCompare(a.data_intervento))[0];
		const gu = ult ? giorniTra(ult.data_intervento, ult.prossima_scadenza) : null;
		if (gu >= 1 && gu <= 60) return {
			giorni: gu,
			da: "ultima"
		};
		return {
			giorni: intervalloPredefinito(tipo),
			da: "predefinito"
		};
	}
	var TESTO_DA = {
		struttura: "della struttura",
		ultima: "come l'ultima volta",
		predefinito: "il tuo predefinito"
	};
	function riquadroIntervalloPrezzo(cv, clienteId, storico) {
		const e = intervalloEffettivo(cv, clienteId, storico);
		const mio = e.da === "cavallo";
		const prezzo = cv.prezzo_ferratura != null && cv.prezzo_ferratura !== "" ? Number(cv.prezzo_ferratura) : null;
		return `<div class="cav-int">
      <span class="cav-int-ic" aria-hidden="true">📅</span>
      <span class="cav-int-t">Intervallo di ferratura: <b id="cav-int-val">${e.giorni} giorni</b>${mio ? "" : ` <small>(${TESTO_DA[e.da]})</small>`}</span>
      <span class="cav-int-step"><button type="button" onclick="cavIntervalloCambia(-1)" aria-label="Meno giorni">−</button><button type="button" onclick="cavIntervalloCambia(1)" aria-label="Più giorni">+</button></span>
    </div>
    <div class="cav-prezzo" id="cav-prezzo">${prezzoRigaHtml(prezzo)}</div>`;
	}
	function prezzoRigaHtml(prezzo) {
		return `<button type="button" class="cav-prezzo-riga" onclick="cavPrezzoModifica()">Prezzo abituale: ${prezzo != null ? `<b>${escapeHtml(formatEuro(prezzo))}</b>` : "<i>non impostato</i>"} <span>✎</span></button>`;
	}
	function cavPrezzoModifica() {
		const cv = schedaCavalli.find((c) => c.key === schedaCavalloKey);
		const box = document.getElementById("cav-prezzo");
		if (!cv || !box) return;
		box.innerHTML = `<div class="cav-prezzo-edit"><label class="prezzi-campo"><span>€</span><input type="number" min="0" max="10000" step="0.5" inputmode="decimal" id="cav-prezzo-val" value="${cv.prezzo_ferratura != null && cv.prezzo_ferratura !== "" ? Number(cv.prezzo_ferratura) : ""}" placeholder="es. 12"
      onkeydown="if(event.key==='Enter')cavPrezzoSalva();if(event.key==='Escape')renderCorpoCavalloPro()"></label>
    <button type="button" class="btn btn-primary btn-sm" onclick="cavPrezzoSalva()">Salva</button><button type="button" class="btn btn-outline btn-sm" onclick="renderCorpoCavalloPro()">Annulla</button></div>`;
		document.getElementById("cav-prezzo-val").focus();
	}
	async function cavPrezzoSalva() {
		const cv = schedaCavalli.find((c) => c.key === schedaCavalloKey);
		const inp = document.getElementById("cav-prezzo-val");
		if (!cv || !inp) return;
		const raw = inp.value.trim();
		if (raw !== "" && !(Number(raw) >= 0 && Number(raw) <= 1e4)) {
			showToast("Controlla il prezzo");
			inp.focus();
			return;
		}
		const v = raw === "" ? null : Math.round(Number(raw) * 100) / 100;
		if ((cv.prezzo_ferratura == null || cv.prezzo_ferratura === "" ? null : Number(cv.prezzo_ferratura)) === v) {
			renderCorpoCavalloPro();
			return;
		}
		await salvaCampiCavallo(cv, { prezzo_ferratura: v }, v == null ? `${cv.nome}: prezzo abituale tolto` : `${cv.nome}: prezzo abituale ${formatEuro(v)}`);
	}
	var cavIntTimer = null;
	function cavIntervalloCambia(d) {
		const cv = schedaCavalli.find((c) => c.key === schedaCavalloKey);
		if (!cv) return;
		const base = intervalloCavallo(cv) || intervalloEffettivo(cv, currentClienteId, schedaStoricoCavallo).giorni;
		const nuovo = Math.max(INT_MIN, Math.min(INT_MAX, base + d));
		cv.intervallo_giorni = nuovo;
		const v = document.getElementById("cav-int-val");
		if (v) v.textContent = nuovo + " giorni";
		const nota = v?.parentNode?.querySelector("small");
		if (nota) nota.remove();
		clearTimeout(cavIntTimer);
		cavIntTimer = setTimeout(() => salvaCampiCavallo(cv, { intervallo_giorni: nuovo }, `${cv.nome}: ferratura ogni ${nuovo} giorni`), 700);
	}
	async function salvaCampiCavallo(cv, campi, messaggio) {
		let id = cv.id;
		if (!id) ({cavallo_cliente_id: id} = await DB.risolviCavalloPerIntervento(currentClienteId, cv));
		if (!id) {
			showToast("Non riuscito, riprova.");
			return false;
		}
		const { error } = await DB.updateCavalloCliente(id, campi);
		if (error) {
			showToast(/intervallo_giorni|prezzo_ferratura/.test(error.message || "") ? "Manca un aggiornamento del database: avvisa l'assistenza Equo." : "Errore: " + error.message);
			return false;
		}
		Object.assign(cv, campi, { id });
		[schedaCavalli, cavalliMieiLista].forEach((l) => (l || []).forEach((x) => {
			if (x !== cv && x.id === id) Object.assign(x, campi);
		}));
		if (messaggio) showToast(messaggio);
		if (document.getElementById("cavallo-pro-view")?.style.display === "block") renderCorpoCavalloPro();
		return true;
	}
	function prezzoCavallo(cv, tipo) {
		if (!cv || cv.prezzo_ferratura == null || cv.prezzo_ferratura === "") return null;
		if (tipo && TIPO_DI_LAVORO[cv.ferratura_tipo || "completa"] !== tipo) return null;
		const v = Number(cv.prezzo_ferratura);
		return v >= 0 ? v : null;
	}
	var SESSO_TESTO = {
		femmina: "Femmina",
		castrone: "Castrone",
		stallone: "Stallone"
	};
	var acavSessoScelto = null;
	function acavSesso(v) {
		acavSessoScelto = acavSessoScelto === v ? null : v;
		document.querySelectorAll("#acav-sesso button").forEach((b) => b.classList.toggle("on", b.dataset.v === acavSessoScelto));
	}
	function apriAnagraficaCavallo() {
		const cv = schedaCavalli.find((c) => c.key === schedaCavalloKey);
		if (!cv) return;
		const manuale = cv.tipo === "manuale" && !cv.horse_id && !cv.scuderia_cavallo_id;
		document.getElementById("acav-tit").textContent = "Anagrafica · " + (cv.nome || "Cavallo");
		document.getElementById("acav-base").hidden = !manuale;
		document.getElementById("acav-equo-nota").hidden = manuale;
		if (manuale) {
			document.getElementById("acav-nome").value = cv.nome || "";
			document.getElementById("acav-chip").value = cv.microchip || "";
			razzaImposta("acav-razza", cv.razza || "");
			document.getElementById("acav-anno").value = cv.anno_nascita || "";
			document.getElementById("acav-mantello").value = cv.mantello || "";
		}
		document.getElementById("acav-altezza").value = cv.altezza_cm || "";
		document.getElementById("acav-peso").value = cv.peso_kg || "";
		document.getElementById("acav-disciplina").value = cv.disciplina || "";
		document.getElementById("acav-segni").value = cv.segni_particolari || "";
		acavSessoScelto = null;
		acavSesso(cv.sesso || null);
		document.getElementById("acav-errore").style.display = "none";
		openModal("modal-anagrafica-cavallo");
	}
	async function salvaAnagraficaCavallo(btn) {
		const cv = schedaCavalli.find((c) => c.key === schedaCavalloKey);
		if (!cv) return;
		const manuale = cv.tipo === "manuale" && !cv.horse_id && !cv.scuderia_cavallo_id;
		const err = document.getElementById("acav-errore");
		const errore = (t) => {
			err.textContent = t;
			err.style.display = "block";
		};
		const num = (id, min, max, nome) => {
			const v = document.getElementById(id).value.trim();
			if (v === "") return null;
			const n = Math.round(Number(v));
			if (!(n >= min && n <= max)) throw new Error(nome);
			return n;
		};
		const testo = (id) => document.getElementById(id).value.trim() || null;
		const campi = {};
		try {
			if (manuale) {
				const nome = document.getElementById("acav-nome").value.trim();
				if (!nome) return errore("Scrivi il nome del cavallo.");
				const razza = razzaValore("acav-razza");
				if (razza === false) return;
				Object.assign(campi, {
					nome,
					microchip: testo("acav-chip"),
					razza: razza || null,
					anno_nascita: num("acav-anno", 1970, (/* @__PURE__ */ new Date()).getFullYear(), "Controlla l'anno di nascita (es. 2017)."),
					mantello: testo("acav-mantello")
				});
			}
			Object.assign(campi, {
				altezza_cm: num("acav-altezza", 50, 220, "Controlla l'altezza: in centimetri al garrese (es. 165)."),
				peso_kg: num("acav-peso", 30, 1500, "Controlla il peso: in kg (es. 520)."),
				sesso: acavSessoScelto,
				disciplina: testo("acav-disciplina"),
				segni_particolari: testo("acav-segni")
			});
		} catch (e) {
			return errore(e.message);
		}
		err.style.display = "none";
		Object.keys(campi).forEach((k) => {
			if (String(cv[k] ?? "") === String(campi[k] ?? "")) delete campi[k];
		});
		if (!Object.keys(campi).length) {
			closeModal("modal-anagrafica-cavallo");
			return;
		}
		btn.disabled = true;
		try {
			if (!await salvaCampiCavallo(cv, campi, "Anagrafica di " + (campi.nome || cv.nome) + " salvata")) return;
			closeModal("modal-anagrafica-cavallo");
			await apriSchedaCavalloPro(cv.key, true);
		} finally {
			btn.disabled = false;
		}
	}
	function anagraficaRighe(cv) {
		const anno = cv.anno_nascita || (cv.nascita ? Number(String(cv.nascita).slice(0, 4)) : null);
		const r = [];
		if (anno) r.push(["Anno di nascita", anno + " (" + Math.max(0, (/* @__PURE__ */ new Date()).getFullYear() - anno) + " anni)"]);
		if (cv.sesso) r.push(["Sesso", SESSO_TESTO[cv.sesso] || cv.sesso]);
		if (cv.mantello) r.push(["Mantello", cv.mantello]);
		if (cv.altezza_cm) r.push(["Altezza", cv.altezza_cm + " cm"]);
		if (cv.peso_kg) r.push(["Peso stimato", "≈ " + cv.peso_kg + " kg"]);
		if (cv.disciplina) r.push(["Disciplina", cv.disciplina]);
		if (cv.segni_particolari) r.push(["Segni particolari", cv.segni_particolari]);
		return r;
	}
	function testoAnagraficaCavallo(cv) {
		return anagraficaRighe(cv || {}).map(([k, v]) => k.toLowerCase() + " " + v).join(", ");
	}
	// equo-app-src/src/ruoli/maniscalco/moduli/038-avviso-sembra-lo-stesso-cavallo.js
	function nomeConfronto(s) {
		return String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
	}
	function distanzaNomi(a, b) {
		const m = a.length, n = b.length;
		if (!m) return n;
		if (!n) return m;
		let prev = Array.from({ length: n + 1 }, (_, j) => j);
		for (let i = 1; i <= m; i++) {
			const cur = [i];
			for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
			prev = cur;
		}
		return prev[n];
	}
	function nomiSimili(a, b) {
		const x = nomeConfronto(a), y = nomeConfronto(b);
		if (!x || !y) return false;
		if (x === y) return true;
		const corto = x.length <= y.length ? x : y, lungo = x.length <= y.length ? y : x;
		if (corto.length >= 3 && lungo.startsWith(corto + " ")) return true;
		return corto.length >= 4 && distanzaNomi(x, y) <= 1;
	}
	function simiIgnorati() {
		try {
			return new Set(JSON.parse(localStorage.getItem("eq_simili_no") || "[]"));
		} catch (e) {
			return /* @__PURE__ */ new Set();
		}
	}
	function ignoraSimili(chiave) {
		try {
			const s = simiIgnorati();
			s.add(chiave);
			localStorage.setItem("eq_simili_no", JSON.stringify([...s].slice(-200)));
		} catch (e) {}
		renderAvvisoSimili();
	}
	var similiCorrenti = [];
	function renderAvvisoSimili() {
		const box = document.getElementById("cliente-simili-box");
		if (!box) return;
		const no = simiIgnorati();
		const manuali = (schedaCavalli || []).filter((c) => c.id && !c.horse_id && !c.scuderia_cavallo_id && !c.presso);
		const collegati = (schedaCavalli || []).filter((c) => c.horse_id && !c.presso && c.tipo === "equo");
		const usati = /* @__PURE__ */ new Set(), coppie = [];
		manuali.forEach((m) => {
			const c = collegati.find((x) => !usati.has(x.horse_id) && nomiSimili(m.nome, x.nome) && !no.has(m.id + "|" + x.horse_id));
			if (c) {
				usati.add(c.horse_id);
				coppie.push({
					m,
					c,
					chiave: m.id + "|" + c.horse_id
				});
			}
		});
		similiCorrenti = coppie;
		box.innerHTML = coppie.slice(0, 3).map((p, i) => `<div style="background:var(--surface2);border:1px solid var(--border);border-left:3px solid var(--accent);border-radius:10px;padding:12px 14px;margin:0 0 10px">
    <div style="font-weight:600;font-size:14px;margin-bottom:4px">È lo stesso cavallo?</div>
    <div style="font-size:13px;color:var(--muted);line-height:1.5">«${escapeHtml(p.m.nome)}» (l'hai inserito tu) e «${escapeHtml(p.c.nome)}» (inserito dal proprietario) sembrano lo stesso cavallo. Se li unisci resta una scheda sola, con il nome del proprietario: lavori e avvisi si conservano.</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">
      <button type="button" class="btn btn-primary btn-sm" onclick="unisciSimili(${i})">Unisci in «${escapeHtml(p.c.nome)}»</button>
      <button type="button" class="btn btn-outline btn-sm" onclick="ignoraSimili('${p.chiave}')">Sono diversi</button>
    </div></div>`).join("");
	}
	async function unisciSimili(i) {
		const p = similiCorrenti[i];
		if (!p || !currentClienteId) return;
		if (!confirm(`Unire «${p.m.nome}» in «${p.c.nome}»? Resta una scheda sola, con lavori e avvisi di entrambe.`)) return;
		if (DEMO_MODE) {
			demoState.interventiMascalcia.forEach((x) => {
				if (x.cavallo_cliente_id === p.m.id) x.cavallo_cliente_id = p.c.id || null;
			});
			demoState.cavalliClientiMascalcia = demoState.cavalliClientiMascalcia.filter((x) => x.id !== p.m.id);
		} else {
			const { data, error } = await sb.rpc("equo_unisci_cavalli_cliente", {
				p_togli: p.m.id,
				p_tieni: p.c.id || null,
				p_horse: p.c.id ? null : p.c.horse_id
			});
			if (error || !data || data.ok === false) {
				console.error("equo_unisci_cavalli_cliente:", error || data);
				showToast("Non sono riuscito a unire le schede, riprova");
				return;
			}
		}
		showToast("Schede unite in «" + p.c.nome + "»");
		schedaCavalli = [];
		await loadClienteInterventi(currentClienteId);
	}
	function renderBoxCavalliCliente() {
		const grid = document.getElementById("cliente-cavalli-grid");
		if (!grid) return;
		const cerca = document.getElementById("cliente-cavalli-cerca");
		const qui = currentClienteId ? cavalliQuiStanno(currentClienteId) : [];
		cerca.style.display = schedaCavalli.length + qui.length > 4 ? "block" : "none";
		const q = cerca.value.trim().toLowerCase();
		document.getElementById("cliente-cavalli-titolo").textContent = `CAVALLI (${schedaCavalli.length + qui.length})`;
		const ordinati = schedaCavalli.slice().sort((a, b) => (a.nome || "").localeCompare(b.nome || "", "it", { sensitivity: "base" })).concat(qui.map((c) => ({
			...c,
			quiDi: c.cliente_mascalcia_id
		}))).sort((a, b) => (a.nome || "").localeCompare(b.nome || "", "it", { sensitivity: "base" })).filter((c) => !q || (c.nome || "").toLowerCase().includes(q) || (c.codice_equo || "").toLowerCase().includes(q));
		const boxQui = (c) => {
			const foto = fotoCavalloPro(c), ferro = descrFerroBreve(c), prop = (clientiMascalcia || []).find((x) => x.id === c.quiDi);
			const st = statoCavalloPro(c, quiInterventiCache);
			return `<button type="button" class="cav-box" onclick="apriCavalloDaCartella('${c.quiDi}', '${c.id || ""}', '${c.horse_id || ""}')">
      <span class="cav-box-foto"${foto ? ` style="background-image:${cssUrlApp(foto)}"` : ""}>${foto ? "" : iniziale(c.nome)}${st.sem ? `<i class="cav-sem ${st.sem}"></i>` : ""}</span>
      <span class="cav-box-nome">${escapeHtml(c.nome)}</span>
      <span class="cav-box-cod">${escapeHtml([c.codice_equo, ferro ? "ferro " + ferro : ""].filter(Boolean).join(" · ") || "—")}</span>
      <span class="cav-box-riga">👤 di <b>${escapeHtml(prop ? prop.nome : "un altro cliente")}</b> · paga lui</span>
      <span class="cav-box-riga">Ultimo: <b>${st.ultimo ? escapeHtml((TIPO_FERRATURA_LABELS[st.ultimo.tipo_ferratura] || st.ultimo.tipo_ferratura) + " · " + formatDataBreve(st.ultimo.data_intervento)) : "—"}</b></span>
      <span class="cav-box-riga">Prossimo: <b>${st.prossimo ? escapeHtml((st.prossimo.fissato ? st.prossimo.testo + " · " : "") + formatDataBreve(st.prossimo.data)) : "—"}</b></span>
    </button>`;
		};
		const box = (c) => {
			if (c.quiDi) return boxQui(c);
			const st = statoCavalloPro(c, clienteInterventiCache), foto = fotoCavalloPro(c), ferro = descrFerroBreve(c);
			return `<button type="button" class="cav-box" onclick="apriSchedaCavalloPro('${c.key}')">
      <span class="cav-box-foto"${foto ? ` style="background-image:${cssUrlApp(foto)}"` : ""}>${foto ? "" : iniziale(c.nome)}${st.sem ? `<i class="cav-sem ${st.sem}"></i>` : ""}</span>
      <span class="cav-box-nome">${escapeHtml(c.nome)}</span>
      <span class="cav-box-cod">${escapeHtml([c.codice_equo, ferro ? "ferro " + ferro : ""].filter(Boolean).join(" · ") || (c.tipo === "equo" ? "su Equo" : "—"))}</span>
      <span class="cav-box-riga">${c.presso ? `📍 presso ${escapeHtml(c.presso)}` : `Ultimo: <b>${st.ultimo ? escapeHtml((TIPO_FERRATURA_LABELS[st.ultimo.tipo_ferratura] || st.ultimo.tipo_ferratura) + " · " + formatDataBreve(st.ultimo.data_intervento)) : "—"}</b>`}</span>
      ${c.presso ? "" : `<span class="cav-box-riga">Prossimo: <b>${st.prossimo ? escapeHtml((st.prossimo.fissato ? st.prossimo.testo + " · " : "") + formatDataBreve(st.prossimo.data)) : "—"}</b></span>`}
    </button>`;
		};
		grid.innerHTML = `<button type="button" class="cav-box nuovo" onclick="aggiungiCavalloDaScheda()"><span class="cav-box-piu">+</span><span class="cav-box-nome">Aggiungi cavallo</span><span class="cav-box-cod">nuovo o con codice Equo</span></button>` + (ordinati.length ? ordinati.map(box).join("") : q ? "<div class=\"muted\" style=\"font-size:13px;padding:10px 4px;grid-column:1/-1\">Nessun cavallo con questo nome.</div>" : "");
	}
	function cssUrlApp(u) {
		return "url('" + String(u).replace(/['\\()]/g, (c) => "\\" + c) + "')";
	}
	async function aggiungiCavalloDaScheda() {
		await openEditCliente();
		setTimeout(() => {
			const el = document.getElementById("edit-cliente-nuovo-cavallo");
			if (el) {
				el.scrollIntoView({ block: "center" });
				el.focus();
			}
		}, 250);
	}
	function renderInterventiSenzaCavallo() {
		const box = document.getElementById("cliente-orfani");
		const orfani = (clienteInterventiCache || []).filter((i) => !i.cavallo_cliente_id && !i.horse_id);
		if (!orfani.length) {
			box.style.display = "none";
			box.innerHTML = "";
			return;
		}
		const opz = schedaCavalli.slice().sort((a, b) => (a.nome || "").localeCompare(b.nome || "", "it")).map((c) => `<option value="${c.key}">${escapeHtml(c.nome)}</option>`).join("");
		box.style.display = "block";
		box.innerHTML = `<div class="clienti-sez-title" style="margin-bottom:8px">INTERVENTI SENZA CAVALLO (${orfani.length})</div>
    <div class="muted" style="font-size:12px;line-height:1.5;margin-bottom:6px">Registrati senza indicare il cavallo: assegnali al cavallo giusto così entrano nel suo storico.</div>
    ${orfani.map((i) => `<div class="orfano-riga">
      <div style="flex:1;min-width:0"><div style="font-weight:600;font-size:13.5px">${escapeHtml(TIPO_FERRATURA_LABELS[i.tipo_ferratura] || i.tipo_ferratura)}${i.tipo_ferratura === "altro" && i.tipo_altro ? " · " + escapeHtml(i.tipo_altro) : ""} · ${formatDate(i.data_intervento)}</div>
        <div class="muted" style="font-size:11.5px">${i.stato === "fatto" ? "fatto" : "da fare"}${i.importo != null ? " · " + Number(i.importo).toLocaleString("it-IT") + " € · " + (i.stato_pagamento === "saldato" ? "saldato" : "da saldare") : ""}${i.note ? " · " + escapeHtml(i.note) : ""}</div>
        ${opz ? `<div style="display:flex;gap:6px;margin-top:6px"><select class="input" id="orfano-${i.id}" style="flex:1;padding:6px 8px;font-size:13px"><option value="">Scegli il cavallo…</option>${opz}</select>
          <button class="btn btn-outline btn-sm" onclick="assegnaInterventoCavallo('${i.id}', this)">Assegna</button></div>` : ""}
      </div>
      <button class="btn btn-ghost btn-sm" style="color:var(--red);align-self:flex-start" onclick="eliminaInterventoOrfano('${i.id}', this)">Elimina</button>
    </div>`).join("")}`;
	}
	async function assegnaInterventoCavallo(id, btn) {
		const k = document.getElementById("orfano-" + id)?.value;
		if (!k) {
			showToast("Scegli il cavallo");
			return;
		}
		const cv = schedaCavalli.find((c) => c.key === k);
		if (!cv) return;
		btn.disabled = true;
		try {
			const { cavallo_cliente_id, horse_id } = await DB.risolviCavalloPerIntervento(currentClienteId, cv);
			const { error } = await DB.updateInterventoMascalcia(id, {
				cavallo_cliente_id,
				horse_id
			});
			if (error) {
				showToast("Errore: " + error.message);
				return;
			}
			showToast(`Assegnato a ${cv.nome}`);
			await loadClienteInterventi(currentClienteId);
		} finally {
			btn.disabled = false;
		}
	}
	async function eliminaInterventoOrfano(id, btn) {
		const i = (clienteInterventiCache || []).find((x) => x.id === id);
		if (!i) return;
		if (!await chiediSiNo("Eliminare questo intervento?", `${TIPO_FERRATURA_LABELS[i.tipo_ferratura] || i.tipo_ferratura} del ${formatDate(i.data_intervento)}${i.importo != null ? " (" + i.importo + " €)" : ""}: sparisce anche da incassi e scadenze.`)) return;
		btn.disabled = true;
		const { error } = await DB.deleteInterventoMascalcia(id);
		btn.disabled = false;
		if (error) {
			showToast("Errore: " + error.message);
			return;
		}
		showToast("Intervento eliminato");
		await loadClienteInterventi(currentClienteId);
		try {
			await renderProDeadlines();
			await renderIncassi$1();
		} catch (e) {}
	}
	var allegatiCtx = {};
	async function chiaveAllegati(vista, cv) {
		if (vista !== "maniscalco") return cv.id;
		if (cv.id) return cv.id;
		const r = await DB.risolviCavalloPerIntervento(currentClienteId, cv);
		if (r.cavallo_cliente_id) cv.id = r.cavallo_cliente_id;
		return cv.id;
	}
	async function caricaAllegatiCavallo(boxId, vista, cv) {
		allegatiCtx[boxId] = {
			vista,
			cv
		};
		const box = document.getElementById(boxId);
		if (DEMO_MODE) {
			if (box) box.innerHTML = "<div class=\"muted\" style=\"font-size:13px\">In demo gli allegati non sono disponibili.</div>";
			return;
		}
		const id = await chiaveAllegati(vista, cv);
		if (!id) {
			if (box) box.innerHTML = "<div class=\"muted\" style=\"font-size:13px\">Nessun allegato.</div>";
			return;
		}
		const { data, error } = await sb.rpc("equo_allegati_cavallo", {
			p_vista: vista,
			p_id: id
		});
		const b = document.getElementById(boxId);
		if (!b || allegatiCtx[boxId]?.cv !== cv) return;
		if (error) {
			b.innerHTML = "<div class=\"muted\" style=\"font-size:13px\">Allegati non disponibili ora. Riprova più tardi.</div>";
			return;
		}
		allegatiCtx[boxId].lista = data || [];
		const chi = {
			maniscalco: "dal maniscalco",
			proprietario: "dal proprietario",
			scuderia: "dalla scuderia"
		};
		b.innerHTML = (data || []).length ? data.map((a) => {
			return `<div class="allegato-riga"><div class="allegato-ic">${(a.mime || "").includes("pdf") || /\.pdf$/i.test(a.nome) ? "PDF" : "FOTO"}</div>
      <div style="flex:1;min-width:0"><div style="font-weight:700;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHtml(a.nome)}</div>
        <div class="muted" style="font-size:11.5px">${a.mio ? "caricato da te" : "caricato " + (chi[a.autore_ruolo] || "") + (a.autore_nome ? " " + escapeHtml(a.autore_nome) : "")} · ${formatDataBreve(String(a.created_at).slice(0, 10))}${a.byte ? " · " + (a.byte > 1048576 ? (a.byte / 1048576).toFixed(1).replace(".", ",") + " MB" : Math.max(1, Math.round(a.byte / 1024)) + " KB") : ""}</div></div>
      <button class="btn btn-outline btn-sm" onclick="apriAllegato('${boxId}', '${a.id}', this)">Apri</button>
      ${a.mio ? `<button class="btn btn-ghost btn-sm" style="color:var(--red);padding:6px" aria-label="Elimina" onclick="eliminaAllegato('${boxId}', '${a.id}')">✕</button>` : ""}
    </div>`;
		}).join("") : "<div class=\"muted\" style=\"font-size:13px\">Nessun allegato. Carica lastre, referti o foto: li vedranno anche gli altri che seguono il cavallo.</div>";
	}
	async function caricaAllegatoCavallo(input, boxId, vista) {
		const f = input.files && input.files[0];
		input.value = "";
		const ctx = allegatiCtx[boxId];
		if (!f || !ctx) return;
		if (DEMO_MODE) {
			showToast("In demo gli allegati non sono disponibili.");
			return;
		}
		if (f.size > 15728640) {
			showToast("File troppo grande: massimo 15 MB");
			return;
		}
		if (!/^(application\/pdf|image\/)/.test(f.type || "")) {
			showToast("Puoi caricare PDF o foto");
			return;
		}
		const id = await chiaveAllegati(vista, ctx.cv);
		if (!id) {
			showToast("Non riuscito, riprova.");
			return;
		}
		showToast("Caricamento in corso…");
		const est = (f.name.match(/\.[a-z0-9]{1,5}$/i) || [""])[0].toLowerCase();
		const path = `${currentUser.id}/${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}${est}`;
		const up = await sb.storage.from("cavalli-allegati").upload(path, f, { contentType: f.type || void 0 });
		if (up.error) {
			showToast("Caricamento non riuscito: " + up.error.message);
			return;
		}
		const { data, error } = await sb.rpc("equo_aggiungi_allegato", {
			p_vista: vista,
			p_id: id,
			p_nome: f.name,
			p_path: path,
			p_mime: f.type || null,
			p_byte: f.size
		});
		if (error || !data?.ok) {
			await sb.storage.from("cavalli-allegati").remove([path]);
			showToast(data && data.errore || "Caricamento non riuscito, riprova.");
			return;
		}
		showToast("Allegato caricato");
		await caricaAllegatiCavallo(boxId, vista, ctx.cv);
	}
	async function apriAllegato(boxId, id, btn) {
		const a = (allegatiCtx[boxId]?.lista || []).find((x) => x.id === id);
		if (!a) return;
		const w = window.open("", "_blank");
		if (btn) btn.disabled = true;
		const { data, error } = await sb.storage.from("cavalli-allegati").createSignedUrl(a.path, 600);
		if (btn) btn.disabled = false;
		if (error || !data?.signedUrl) {
			if (w) w.close();
			showToast("Non riesco ad aprire il file, riprova.");
			return;
		}
		if (w) w.location.href = data.signedUrl;
		else window.location.href = data.signedUrl;
	}
	async function eliminaAllegato(boxId, id) {
		const a = (allegatiCtx[boxId]?.lista || []).find((x) => x.id === id);
		if (!a) return;
		if (!await chiediSiNo("Eliminare questo allegato?", `«${a.nome}» sparisce per tutti quelli che seguono il cavallo. L'eliminazione resta nello storico.`)) return;
		const { data, error } = await sb.rpc("equo_elimina_allegato", { p_id: id });
		if (error || !data?.ok) {
			showToast(data && data.errore || "Non riuscito, riprova.");
			return;
		}
		if (data.path) await sb.storage.from("cavalli-allegati").remove([data.path]);
		showToast("Allegato eliminato");
		const ctx = allegatiCtx[boxId];
		await caricaAllegatiCavallo(boxId, ctx.vista, ctx.cv);
	}
	async function apriSchedaCavalloPro(key, soloAggiorna) {
		const cv = schedaCavalli.find((c) => c.key === key);
		if (!cv) return;
		schedaCavalloKey = key;
		if (!soloAggiorna) schedaCavalloTab = "tutto";
		const cli = clientiMascalcia.find((x) => x.id === currentClienteId);
		document.getElementById("clienti-detail-view").style.display = "none";
		document.getElementById("cavallo-pro-view").style.display = "block";
		document.getElementById("cavpro-cliente").textContent = cli ? cli.nome : "Cliente";
		const st = statoCavalloPro(cv, clienteInterventiCache), foto = fotoCavalloPro(cv);
		document.getElementById("cavpro-hero").innerHTML = `
    <span class="cav-box-foto grande"${foto ? ` style="background-image:${cssUrlApp(foto)}"` : ""}>${foto ? "" : iniziale(cv.nome)}${st.sem ? `<i class="cav-sem ${st.sem}"></i>` : ""}</span>
    <div style="min-width:0"><div class="cavpro-nome">${escapeHtml(cv.nome)}</div>
      <div class="muted" style="font-size:12.5px">${escapeHtml([cv.codice_equo, cv.razza].filter(Boolean).join(" · ") || (cv.tipo === "equo" ? "cavallo del proprietario su Equo" : ""))}</div>
      ${cv.presso ? `<div class="muted" style="font-size:12.5px">Riga del maniscalco presso ${escapeHtml(cv.presso)}</div>` : ""}</div>`;
		renderDoveCavalloPro(cv);
		if (!soloAggiorna) window.scrollTo({ top: 0 });
		if (!soloAggiorna) document.getElementById("cavpro-corpo").innerHTML = "<div class=\"loading\"><div class=\"spinner\"></div> Caricamento...</div>";
		renderTabCavalloPro();
		[schedaStoricoCavallo, schedaSpostamenti] = await Promise.all([DB.listInterventiCavallo(cv), DB.spostamentiCavallo("maniscalco", cv.id)]);
		if (schedaCavalloKey !== key) return;
		renderCorpoCavalloPro();
	}
	function chiudiSchedaCavalloPro() {
		schedaCavalloKey = null;
		if (schedaDaCartella) {
			schedaDaCartella = false;
			document.getElementById("cavallo-pro-view").style.display = "none";
			closeClienteDetail();
			renderClientiList();
			return;
		}
		document.getElementById("cavallo-pro-view").style.display = "none";
		document.getElementById("clienti-detail-view").style.display = "block";
		renderBoxCavalliCliente();
	}
	function renderTabCavalloPro() {
		const tabs = [
			["tutto", "Tutto"],
			["ana", "Anagrafica"],
			["fer", "Ferratura"],
			["sto", "Storico"],
			["all", "Allegati"]
		];
		document.getElementById("cavpro-tab").innerHTML = tabs.map(([k, t]) => `<button class="${schedaCavalloTab === k ? "on" : ""}" onclick="schedaCavalloTab='${k}';renderTabCavalloPro();renderCorpoCavalloPro()">${t}</button>`).join("");
	}
	function renderCorpoCavalloPro() {
		const cv = schedaCavalli.find((c) => c.key === schedaCavalloKey);
		if (!cv) return;
		const vedi = (k) => schedaCavalloTab === "tutto" || schedaCavalloTab === k;
		const sez = (k, titolo, azione, corpo) => vedi(k) ? `<div class="card cavpro-sez"><div class="cavpro-sez-testa"><span>${titolo}</span>${azione || ""}</div>${corpo}</div>` : "";
		const st = statoCavalloPro(cv, schedaStoricoCavallo);
		const ultimiNuovi = schedaStoricoCavallo.filter((i) => i.stato === "fatto" && i.ferri_nuovi === true).sort((a, b) => b.data_intervento.localeCompare(a.data_intervento))[0];
		const modificabile = cv.tipo === "manuale";
		const allegatiPrima = document.getElementById("cavpro-allegati")?.innerHTML;
		document.getElementById("cavpro-corpo").innerHTML = sez("ana", "Anagrafica", `<button class="btn btn-outline btn-sm" onclick="modificaAnagraficaCavalloPro()">Modifica</button>`, `
      <dl class="cavpro-kv">
        <dt>Codice Equo</dt><dd>${escapeHtml(cv.codice_equo || "—")}</dd>
        <dt>Microchip</dt><dd>${escapeHtml(cv.microchip || "—")}</dd>
        <dt>Razza</dt><dd>${escapeHtml(cv.razza || "—")}</dd>
        ${anagraficaRighe(cv).map(([k, v]) => `<dt>${escapeHtml(k)}</dt><dd>${escapeHtml(String(v))}</dd>`).join("")}
        <dt>Proprietario</dt><dd>${cv.tipo === "equo" ? "su Equo (collegato)" : escapeHtml(clientiMascalcia.find((x) => x.id === currentClienteId)?.nome || "—")}${modificabile && !cv.horse_id ? ` <button type="button" class="cavpro-link" onclick="apriCambiaProprietario(false)">Cambia</button>` : ""}</dd>
        <dt>Dove sta</dt><dd>${escapeHtml(luogoDi(cv.ub || { cliente_mascalcia_id: currentClienteId }).nome)}</dd>
      </dl>
      ${cv.tipo === "equo" || cv.horse_id || cv.scuderia_cavallo_id ? "<div class=\"muted\" style=\"font-size:11.5px;margin-top:8px\">Nome, razza e nascita li gestisce " + (cv.tipo !== "equo" && !cv.horse_id ? "la scuderia" : "il proprietario") + " nella sua app; con «Modifica» aggiungi altezza, peso, sesso, disciplina e segni particolari.</div>" : ""}`) + sez("fer", "Ferratura", `<button class="btn btn-outline btn-sm" onclick="apriFerroCavallo('${cv.key}')">Modifica</button>`, `
      <div class="cavpro-ferro"><div class="cavpro-ferro-n">${lavoroCav(cv) === "pareggio" ? "Pareggio" : cv.ferro_numero ? escapeHtml(cv.ferro_numero + " " + (MISURA_SISTEMA_LABEL[cv.ferro_sistema || "italiana"] || "")) : "—"}</div>
        <div class="muted" style="font-size:12.5px;line-height:1.5"><b style="color:var(--text)">${escapeHtml(descrFerraturaCavallo(cv))}</b><br>
        ${ultimiNuovi ? "<span class=\"solo-completa\">Ultimi ferri nuovi: " + formatDataBreve(ultimiNuovi.data_intervento) + "<br></span>" : ""}
        ${st.prossimo ? (() => {
			const g = giorniTra(isoLocale(/* @__PURE__ */ new Date()), st.prossimo.data);
			const q = g < 0 ? `scaduta da ${-g} ${-g === 1 ? "giorno" : "giorni"}` : g === 0 ? "oggi" : g === 1 ? "domani" : `tra ${g} giorni`;
			return `<button type="button" class="cav-prox${g < 0 ? " scad" : ""}" onclick="apriScadenzaCavallo()">Prossima: <b>${formatDataBreve(st.prossimo.data)}</b> · ${q}${st.prossimo.fissato ? " · appuntamento" : ""} <span>›</span></button>`;
		})() : "Prossima: <b style=\"color:var(--text)\">—</b>"}</div></div>
      ${riquadroIntervalloPrezzo(cv, currentClienteId, schedaStoricoCavallo)}
      <div class="muted" style="font-size:11.5px;line-height:1.5;margin-top:8px">Vale per tutti i suoi appuntamenti: nel nuovo appuntamento basta scegliere il cavallo. Lavoro e tipo di ferro vanno anche nel libretto del proprietario e nella scheda della scuderia; «ferri nuovi/rimessa» resta solo tuo.</div>`) + sez("sto", "Storico di " + escapeHtml(cv.nome), `<span style="display:flex;gap:6px"><button class="btn btn-outline btn-sm solo-completa" onclick="nuovoInterventoCavalloPro('straordinario')">Straordinario</button><button class="btn btn-outline btn-sm" onclick="nuovoInterventoCavalloPro()">+ Intervento</button></span>`, storicoCavalloHtml(schedaStoricoCavallo, schedaSpostamenti)) + (vedi("all") ? `<div class="card cavpro-sez"><div class="cavpro-sez-testa"><span>Allegati</span><button class="btn btn-outline btn-sm" onclick="document.getElementById('cavpro-allegati-file').click()">+ Carica</button></div>
        <input type="file" id="cavpro-allegati-file" accept="application/pdf,image/*" style="display:none" onchange="caricaAllegatoCavallo(this, 'cavpro-allegati', 'maniscalco')">
        <div id="cavpro-allegati">${allegatiPrima || "<div class=\"muted\" style=\"font-size:13px\">Caricamento…</div>"}</div>
        <div class="muted" style="font-size:11.5px;line-height:1.5;margin-top:8px">Li vedono anche il proprietario collegato e la scuderia dove sta il cavallo. Ognuno può eliminare solo i file caricati da lui.</div></div>` : "");
		if (vedi("all") && (!allegatiPrima || allegatiCtx["cavpro-allegati"]?.cv !== cv)) caricaAllegatiCavallo("cavpro-allegati", "maniscalco", cv);
	}
	function storicoCavalloHtml(lista, spostamenti) {
		if (!lista.length && !(spostamenti || []).length) return "<div class=\"muted\" style=\"font-size:13px\">Nessun intervento per questo cavallo.</div>";
		return [...lista.map((i) => ({
			d: i.data_intervento || "",
			i
		})), ...(spostamenti || []).map((s) => ({
			d: isoLocale(new Date(s.creato)),
			s
		}))].sort((a, b) => b.d.localeCompare(a.d)).map(({ i, s }) => {
			if (s) return spostamentoHtml(s);
			const d = /* @__PURE__ */ new Date(i.data_intervento + "T12:00");
			const ferro = i.tipo_ferratura === "ferratura" || i.tipo_ferratura === "mezza_ferratura" ? [i.quantita_ferri ? i.quantita_ferri + " ferri" : null, i.numero_ferro ? siglaFerro(i.misura_sistema, i.numero_ferro) : null].filter(Boolean).join(" ") : "";
			const extra = [
				i.ferri_nuovi === true ? "ferri nuovi" : i.ferri_nuovi === false ? "rimessa" : null,
				testoFerroIntervento(i),
				i.importo != null ? Number(i.importo).toLocaleString("it-IT") + " €" : null,
				i.luogo_nome ? /^A casa/.test(i.luogo_nome) ? "a casa" : "presso " + i.luogo_nome : i.clienti_mascalcia?.nome && i.cliente_mascalcia_id !== currentClienteId ? "presso " + i.clienti_mascalcia.nome : null,
				i.note || null
			].filter(Boolean).join(" · ");
			return `<div class="cavpro-int" onclick="openInterventoModal(null, schedaStoricoCavallo.find(x => x.id === '${i.id}'))">
      <div class="cavpro-int-data"><b>${d.getDate()}</b>${AG_MESI[d.getMonth()]} ${d.getFullYear()}</div>
      <div style="flex:1;min-width:0"><div style="font-weight:700;font-size:13.5px">${escapeHtml(TIPO_FERRATURA_LABELS[i.tipo_ferratura] || i.tipo_ferratura)}${i.tipo_ferratura === "altro" && i.tipo_altro ? " · " + escapeHtml(i.tipo_altro) : ""}${ferro ? " · " + escapeHtml(ferro) : ""}</div>
        <div class="muted" style="font-size:12px">${i.stato !== "fatto" ? i.stato === "richiesto" ? "richiesta da confermare · " : "da fare · " : ""}${escapeHtml(extra)}</div></div>
      ${i.stato === "fatto" ? `<span class="badge solo-incassi ${i.stato_pagamento === "saldato" ? "badge-green" : "badge-red"}" style="align-self:flex-start">${i.stato_pagamento === "saldato" ? "Saldato" : "Da saldare"}</span>` : ""}
    </div>`;
		}).join("");
	}
	function nuovoInterventoCavalloPro(modo) {
		const cv = schedaCavalli.find((c) => c.key === schedaCavalloKey);
		if (!cv) return;
		openInterventoModal(currentClienteId, null, {
			cavallo_cliente_id: cv.id || null,
			horse_id: cv.horse_id || null,
			modo: modo || null
		});
	}
	function modificaAnagraficaCavalloPro() {
		apriAnagraficaCavallo();
	}
	function storicoNomeCavallo(i) {
		return i.cavalli_clienti_mascalcia?.nome || "";
	}
	function filtraStoricoCavallo(k) {
		storicoFiltroCavallo = k;
		renderStoricoCliente();
	}
	function renderStoricoCliente() {
		const box = document.getElementById("cliente-interventi-list");
		const data = clienteInterventiCache || [];
		const nomi = [...new Set(data.map(storicoNomeCavallo).filter(Boolean))].sort((a, b) => a.localeCompare(b, "it"));
		const senza = data.some((i) => !storicoNomeCavallo(i));
		if (storicoFiltroCavallo !== "tutti" && storicoFiltroCavallo !== "__senza__" && !nomi.includes(storicoFiltroCavallo)) storicoFiltroCavallo = "tutti";
		box.innerHTML = (nomi.length > 1 || nomi.length && senza ? `<div class="hp-filtri" style="margin:0 0 8px">${[
			["tutti", "Tutti (" + data.length + ")"],
			...nomi.map((n) => [n, n + " (" + data.filter((i) => storicoNomeCavallo(i) === n).length + ")"]),
			...senza ? [["__senza__", "Senza cavallo"]] : []
		].map(([k, t]) => `<button class="${storicoFiltroCavallo === k ? "on" : ""}" onclick="filtraStoricoCavallo(${escapeHtml(JSON.stringify(k))})">${escapeHtml(t)}</button>`).join("")}</div>` : "") + data.filter((i) => storicoFiltroCavallo === "tutti" || (storicoFiltroCavallo === "__senza__" ? !storicoNomeCavallo(i) : storicoNomeCavallo(i) === storicoFiltroCavallo)).map((i) => {
			const ferroInfo = (i.tipo_ferratura === "ferratura" || i.tipo_ferratura === "mezza_ferratura") && (i.numero_ferro || i.quantita_ferri) ? " · " + [
				i.numero_ferro ? "n. " + escapeHtml(i.numero_ferro) + (i.misura_sistema ? " " + MISURA_SISTEMA_LABEL[i.misura_sistema] : "") : null,
				i.quantita_ferri ? i.quantita_ferri + (i.ferri_nuovi === true ? " ferri nuovi" : " ferri") : null,
				i.ferri_nuovi === false ? "rimessa" : null
			].filter(Boolean).join(", ") : "";
			const cav = storicoNomeCavallo(i);
			return `
    <div class="event-item" style="cursor:pointer" onclick="openInterventoModal(null, clienteInterventiCache.find(x => x.id === '${i.id}'))">
      <div style="min-width:0">
        <div class="storico-cav${cav ? "" : " vuoto"}"><span class="fa-icon"><i class="fa-solid fa-horse-head"></i></span> ${cav ? escapeHtml(cav) : "Cavallo non indicato"}</div>
        <div style="font-weight:600;font-size:13.5px">${TIPO_FERRATURA_LABELS[i.tipo_ferratura] || i.tipo_ferratura}${i.tipo_ferratura === "altro" && i.tipo_altro ? " · " + escapeHtml(i.tipo_altro) : ""}${ferroInfo}</div>
        <div class="muted" style="font-size:12px">${formatDate(i.data_intervento)}${i.ora ? " · " + String(i.ora).slice(0, 5) : ""}${i.stato === "programmato" ? " · da fare" : i.stato === "richiesto" ? " · richiesta da confermare" : ""}${i.note ? " · " + escapeHtml(i.note) : ""}</div>
      </div>
      <span class="badge solo-incassi ${i.stato_pagamento === "saldato" ? "badge-green" : "badge-red"}">${i.stato_pagamento === "saldato" ? "Saldato" : "Da saldare"}</span>
    </div>
  `;
		}).join("");
	}
	// equo-app-src/src/ruoli/maniscalco/moduli/037-scheda-cliente-a-box-scheda-del-cavallo.js
	async function loadClienteInterventi(clienteId) {
		const grid = document.getElementById("cliente-cavalli-grid");
		if (!grid) return;
		if (!schedaCavalli.length || storicoClienteId !== clienteId) grid.innerHTML = "<div class=\"loading\" style=\"grid-column:1/-1\"><div class=\"spinner\"></div> Caricamento...</div>";
		storicoClienteId = clienteId;
		const [cav, data] = await Promise.all([DB.listCavalliCliente(clienteId), DB.listInterventiMascalcia(clienteId)]);
		if (currentClienteId !== clienteId) return;
		schedaCavalli = cav || [];
		clienteInterventiCache = data || [];
		schedaFoto = {};
		const ids = schedaCavalli.map((x) => x.id).filter(Boolean);
		if (ids.length && !DEMO_MODE) try {
			((await sb.rpc("pro_foto_cavalli", { p_righe: ids })).data || []).forEach((f) => {
				schedaFoto[f.cavallo_cliente_id] = f.foto_url;
			});
		} catch (e) {}
		renderBoxCavalliCliente();
		renderAvvisoSimili();
		renderInterventiSenzaCavallo();
		const boxQui = document.getElementById("cliente-qui-box");
		if (boxQui) boxQui.innerHTML = "";
		caricaCavalliMiei().then(() => {
			if (currentClienteId === clienteId) renderCavalliQui(clienteId);
		}).catch(() => {});
		caricaContiCliente(clienteId);
		if (schedaCavalloKey && document.getElementById("cavallo-pro-view").style.display === "block") await apriSchedaCavalloPro(schedaCavalloKey, true);
	}
	function cavalliQuiStanno(luogoId) {
		return (cavalliMieiLista || []).filter((c) => c.ubicazione_tipo === "scuderia" && c.ubicazione_cliente_id === luogoId && c.cliente_mascalcia_id !== luogoId).sort((a, b) => (a.nome || "").localeCompare(b.nome || "", "it", { sensitivity: "base" }));
	}
	var quiInterventiCache = [];
	async function renderCavalliQui(clienteId) {
		const box = document.getElementById("cliente-qui-box");
		if (box) box.innerHTML = "";
		quiInterventiCache = [];
		if (typeof renderBoxCavalliCliente === "function") renderBoxCavalliCliente();
		const ids = cavalliQuiStanno(clienteId).map((c) => c.id).filter(Boolean);
		if (!ids.length) return;
		let lista = [];
		if (DEMO_MODE) lista = (demoState.interventiMascalcia || []).filter((i) => ids.includes(i.cavallo_cliente_id) && i.stato !== "rifiutato");
		else {
			const { data, error } = await sb.from("interventi_mascalcia").select("*").eq("maniscalco_id", currentUser.id).in("cavallo_cliente_id", ids).not("stato", "in", "(rifiutato,annullato)").order("data_intervento", { ascending: false }).limit(500);
			if (error) console.warn("lavori dei cavalli che stanno qui:", error.message);
			lista = data || [];
		}
		if (currentClienteId !== clienteId) return;
		quiInterventiCache = lista;
		if (typeof renderBoxCavalliCliente === "function") renderBoxCavalliCliente();
	}
	function interventiDelCavallo(cv, lista) {
		return (lista || []).filter((i) => cv.id && i.cavallo_cliente_id === cv.id || cv.horse_id && i.horse_id === cv.horse_id);
	}
	function statoCavalloPro(cv, lista) {
		const oggi = isoLocale(/* @__PURE__ */ new Date());
		const mie = interventiDelCavallo(cv, lista);
		const fatti = mie.filter((i) => i.stato === "fatto").sort((a, b) => (b.data_intervento || "").localeCompare(a.data_intervento || ""));
		const prossimi = mie.filter((i) => [
			"programmato",
			"richiesto",
			"proposto"
		].includes(i.stato) && i.data_intervento >= oggi).sort((a, b) => a.data_intervento.localeCompare(b.data_intervento));
		const ultimo = fatti[0] || null;
		const prossimo = prossimi[0] ? {
			data: prossimi[0].data_intervento,
			testo: TIPO_FERRATURA_LABELS[prossimi[0].tipo_ferratura] || prossimi[0].tipo_ferratura,
			fissato: true
		} : ultimo && ultimo.prossima_scadenza ? {
			data: ultimo.prossima_scadenza,
			testo: "scadenza",
			fissato: false
		} : null;
		let sem = null;
		if (prossimo) {
			const g = giorniTra(oggi, prossimo.data);
			sem = prossimo.fissato ? "verde" : g < 0 ? "rosso" : g <= 7 ? "arancio" : "verde";
		}
		return {
			ultimo,
			prossimo,
			sem
		};
	}
	function fotoCavalloPro(cv) {
		return cv.id ? schedaFoto[cv.id] || null : null;
	}
	function iniziale(n) {
		return escapeHtml(String(n || "?").trim().charAt(0).toUpperCase() || "?");
	}
	function descrFerroBreve(cv) {
		const p = [];
		if (cv.ferro_numero) p.push(siglaFerro(cv.ferro_sistema, cv.ferro_numero));
		if (cv.ferratura_tipo === "mezza") p.push("mezza");
		if (cv.ferratura_tipo === "pareggio") return "pareggio";
		if (cv.ferro_tipo === "correttivo" || cv.ferro_tipo_post === "correttivo") p.push("correttivo");
		return p.join(" · ");
	}
	// equo-app-src/src/ruoli/maniscalco/moduli/049-prezzo-mancante-promemoria-salvando-un-a.js
	var prezziResolve = null;
	function prezzoSuggerito(clienteId, cavalloId, tipo) {
		const ab = cavalloId ? prezzoCavallo((cavalliMieiLista || []).find((c) => c.id === cavalloId), tipo) : null;
		if (ab != null) return {
			v: ab,
			fonte: "prezzo abituale del cavallo"
		};
		const conPrezzo = (incTutti || []).filter((i) => Number(i.importo) > 0 && i.cliente_mascalcia_id === clienteId && i.tipo_ferratura === tipo).sort((a, b) => b.data_intervento.localeCompare(a.data_intervento));
		const stesso = cavalloId ? conPrezzo.find((i) => i.cavallo_cliente_id === cavalloId) : null;
		const x = stesso || conPrezzo[0];
		return x ? {
			v: Number(x.importo),
			fonte: stesso ? "ultimo prezzo per questo cavallo" : "ultimo prezzo di questo cliente"
		} : null;
	}
	function chiediPrezzi(righe, { salvataggio = true } = {}) {
		return new Promise((resolve) => {
			prezziResolve = {
				resolve,
				n: righe.length,
				salvataggio
			};
			document.getElementById("prezzi-tit").textContent = salvataggio ? "Manca il prezzo" : "Aggiungi i prezzi";
			document.getElementById("prezzi-testo").textContent = salvataggio ? "Con l'importo Equo ti dice quanto incasserai nei prossimi giorni e chi deve ancora pagarti. Senza, questo appuntamento non entra nel previsionale." : "Gli appuntamenti delle prossime 4 settimane senza importo. Quelli che lasci vuoti restano senza prezzo.";
			document.getElementById("prezzi-righe").innerHTML = righe.map((r, n) => {
				const sug = prezzoSuggerito(r.clienteId, r.cavalloId, r.tipo);
				return `<div class="prezzi-riga"><div class="n"><b>${escapeHtml(r.nome || "Appuntamento")}</b> · ${escapeHtml(TIPO_FERRATURA_LABELS[r.tipo] || r.tipo || "")}${r.sotto ? " · " + escapeHtml(r.sotto) : ""}</div>
        <label class="prezzi-campo"><span>€</span><input type="number" min="0" step="0.01" inputmode="decimal" id="prezzi-v-${n}" placeholder="importo" value="${sug ? sug.v : ""}">${sug ? `<small>${sug.fonte}</small>` : ""}</label></div>`;
			}).join("");
			document.getElementById("prezzi-mai-box").hidden = !salvataggio;
			document.getElementById("prezzi-mai").checked = false;
			document.getElementById("prezzi-ok").textContent = salvataggio ? "Salva con prezzo" : "Salva prezzi";
			document.getElementById("prezzi-no").textContent = salvataggio ? "Salva senza prezzo" : "Più tardi";
			openModal("modal-prezzi");
		});
	}
	function rispondiPrezzi(ok) {
		const p = prezziResolve;
		prezziResolve = null;
		closeModal("modal-prezzi");
		if (!p) return;
		if (p.salvataggio && document.getElementById("prezzi-mai").checked) try {
			localStorage.setItem("equo-no-promemoria-prezzo", "1");
		} catch (e) {}
		if (!ok) return p.resolve(null);
		const v = [];
		for (let n = 0; n < p.n; n++) {
			const raw = document.getElementById("prezzi-v-" + n).value;
			v.push(raw === "" || !(Number(raw) >= 0) ? null : Number(raw));
		}
		p.resolve(v);
	}
	function promemoriaPrezzoAttivo() {
		try {
			return localStorage.getItem("equo-no-promemoria-prezzo") !== "1";
		} catch (e) {
			return true;
		}
	}
	async function aggiungiPrezziMancanti() {
		const oggi = isoLocale(/* @__PURE__ */ new Date()), fine = aggiungiGiorniIso(oggi, 27);
		const lista = incTutti.filter((i) => i.stato === "programmato" && i.stato_pagamento !== "saldato" && i.data_intervento >= oggi && i.data_intervento <= fine && !(Number(i.importo) > 0)).sort((a, b) => (a.data_intervento + (a.ora || "")).localeCompare(b.data_intervento + (b.ora || ""))).slice(0, 40);
		if (!lista.length) return;
		const v = await chiediPrezzi(lista.map((i) => ({
			nome: [i.clienti_mascalcia?.nome, i.cavalli_clienti_mascalcia?.nome].filter(Boolean).join(" · "),
			tipo: i.tipo_ferratura,
			clienteId: i.cliente_mascalcia_id,
			cavalloId: i.cavallo_cliente_id,
			sotto: formatDataBreve(i.data_intervento) + (i.ora ? " " + String(i.ora).slice(0, 5) : "")
		})), { salvataggio: false });
		if (!v) return;
		let n = 0;
		for (let k = 0; k < lista.length; k++) {
			if (v[k] == null) continue;
			const { error } = await DB.updateInterventoMascalcia(lista[k].id, { importo: v[k] });
			if (error) {
				showToast("Errore: " + error.message);
				break;
			}
			if (DEMO_MODE) lista[k].importo = v[k];
			n++;
		}
		if (n) showToast(n === 1 ? "Prezzo salvato" : `${n} prezzi salvati`);
		await renderIncassi$1();
	}
	async function segnaSaldatoIncassi(id, btn) {
		btn.disabled = true;
		const { error } = await DB.updateInterventoMascalcia(id, { stato_pagamento: "saldato" });
		if (error) {
			btn.disabled = false;
			showToast("Errore: " + error.message);
			return;
		}
		const i = incTutti.find((x) => x.id === id);
		if (i && DEMO_MODE) i.saldato_il = (/* @__PURE__ */ new Date()).toISOString();
		showToast("Segnato come saldato");
		await renderIncassi$1();
	}
	// equo-app-src/src/ruoli/maniscalco/moduli/087-2-scelta-del-cliente-nell-appuntamento.js
	function cercaClienteIntervento() {
		const sel = document.getElementById("intervento-cliente-select");
		const grp = document.getElementById("intervento-cliente-group");
		if (!sel || !grp) return;
		let wrap = document.getElementById("int-cerca-wrap");
		if (!wrap) {
			wrap = document.createElement("div");
			wrap.id = "int-cerca-wrap";
			wrap.className = "rz-wrap int-cerca";
			wrap.innerHTML = `<span class="cerca-lente">${CERCA_LENTE_SVG}</span><input class="input cerca-input" id="int-cerca-input" type="search" autocomplete="off" autocorrect="off" spellcheck="false" placeholder="Cerca cliente o cavallo…" aria-label="Cerca cliente o cavallo"><div class="rz-lista" id="int-cerca-lista"></div>`;
			sel.parentNode.insertBefore(wrap, sel);
			const inp = wrap.querySelector("input"), lista = wrap.querySelector(".rz-lista");
			const mostra = () => {
				const parole = cercaParole(inp.value);
				if (!parole.length) {
					lista.classList.remove("aperta");
					lista.innerHTML = "";
					return;
				}
				const righe = [];
				clientiAttivi().forEach((c) => {
					const cavalli = nomiCavalliCliente(c);
					if (cercaCorrisponde(parole, c.nome + " " + (c.telefono || ""))) righe.push({
						c,
						cav: null,
						p: cercaNorm(c.nome).startsWith(parole[0]) ? 0 : 1
					});
					cavalli.forEach((n) => {
						if (cercaCorrisponde(parole, n + " " + c.nome)) righe.push({
							c,
							cav: n,
							p: cercaNorm(n).startsWith(parole[0]) ? 0 : 2
						});
					});
				});
				const unici = [];
				const visti = /* @__PURE__ */ new Set();
				righe.sort((a, b) => a.p - b.p || (a.cav || a.c.nome).localeCompare(b.cav || b.c.nome, "it")).forEach((r) => {
					const k = r.c.id + "|" + (r.cav || "");
					if (!visti.has(k)) {
						visti.add(k);
						unici.push(r);
					}
				});
				lista.innerHTML = unici.slice(0, 10).map((r) => r.cav ? `<button type="button" data-id="${escapeHtml(r.c.id)}" data-cav="${escapeHtml(r.cav)}"><span><b>${escapeHtml(r.cav)}</b> <span class="muted">· ${escapeHtml(r.c.nome)}</span></span><small>Cavallo</small></button>` : `<button type="button" data-id="${escapeHtml(r.c.id)}"><span><b>${escapeHtml(r.c.nome)}</b></span><small>${isStruttura(r.c) ? "Scuderia" : "Cliente"}</small></button>`).join("") || `<div class="rz-vuoto">Nessun cliente con «${escapeHtml(inp.value.trim())}»</div><button type="button" data-nuovo="1"><span>+ Nuovo cliente</span></button>`;
				lista.classList.add("aperta");
			};
			inp.addEventListener("input", mostra);
			inp.addEventListener("focus", mostra);
			lista.addEventListener("mousedown", (e) => e.preventDefault());
			lista.addEventListener("click", async (e) => {
				const b = e.target.closest("button");
				if (!b) return;
				lista.classList.remove("aperta");
				if (b.dataset.nuovo) {
					const nome = inp.value.trim();
					sel.value = "__nuovo__";
					inp.value = "";
					await onInterventoClienteChange();
					const campo = document.getElementById("intervento-nuovo-cliente-nome");
					if (campo && nome && !campo.value) campo.value = nome;
					return;
				}
				const c = clientiMascalcia.find((x) => x.id === b.dataset.id);
				if (!c) return;
				sel.value = c.id;
				inp.value = b.dataset.cav ? b.dataset.cav + " · " + c.nome : c.nome;
				await onInterventoClienteChange();
				if (b.dataset.cav) selezionaCavalloIntervento(b.dataset.cav);
			});
			inp.addEventListener("blur", () => setTimeout(() => lista.classList.remove("aperta"), 150));
		}
		const inp = document.getElementById("int-cerca-input");
		inp.value = "";
		document.getElementById("int-cerca-lista").classList.remove("aperta");
		wrap.style.display = !sel.disabled && clientiAttivi().length >= CERCA_MIN ? "block" : "none";
	}
	// equo-app-src/src/ruoli/maniscalco/moduli/052-ferro-standard-nella-scheda-del-cavallo.js
	var ferroOverride = {};
	var ferroEditKey = null;
	var quantitaToccata = false;
	function siglaFerro(s, n) {
		return n ? "n. " + misuraNorm(n) + " " + (MISURA_SISTEMA_LABEL[s || "italiana"] || "") : "";
	}
	function ferroStd(c) {
		return c && c.ferro_numero ? {
			s: c.ferro_sistema || "italiana",
			n: String(c.ferro_numero)
		} : null;
	}
	function ferroUguale(a, b) {
		if (!a || !b) return !a && !b;
		const ia = MISURE_FERRO[a.s] ? MISURE_FERRO[a.s].indexOf(misuraNorm(a.n)) : -1;
		const ib = MISURE_FERRO[b.s] ? MISURE_FERRO[b.s].indexOf(misuraNorm(b.n)) : -1;
		return a.s === b.s ? String(a.n) === String(b.n) : ia >= 0 && ia === ib;
	}
	function cavalliSceltiIntervento() {
		if (interventoInModifica) return [document.getElementById("intervento-cavallo-select").value || ""];
		return [...document.querySelectorAll("#intervento-cavalli-multi .int-cav-chk:checked")].map((x) => x.value);
	}
	function renderFerroRighe() {
		const box = document.getElementById("intervento-scheda-righe");
		if (!box) return;
		box.innerHTML = cavalliSceltiIntervento().filter((k) => k && k !== "__nuovo_cavallo__").map((k) => {
			const cv = cavalliClienteCorrente.find((c) => c.key === k);
			if (!cv) return "";
			const tenuto = interventoInModifica && (interventoInModifica.stato === "fatto" || interventoInModifica.gruppo_id) && tipoOriginaleIntervento !== "altro";
			const dett = tenuto ? (TIPO_FERRATURA_LABELS[tipoOriginaleIntervento] || tipoOriginaleIntervento) + " · come registrato quel giorno" : descrFerraturaCavallo(cv);
			return `<div class="int-scheda-riga"><span class="av">${iniziale(cv.nome)}</span><span class="tx"><b>${escapeHtml(cv.nome)}</b>${escapeHtml(dett)}</span>${tenuto ? "" : `<button type="button" onclick="modificaFerraturaDaIntervento('${k}')">Modifica</button>`}</div>`;
		}).join("");
	}
	function modificaFerraturaDaIntervento(k) {
		const cv = cavalliClienteCorrente.find((c) => c.key === k);
		if (!cv) return;
		const clienteId = document.getElementById("intervento-cliente-select").value;
		apriSchedaFerratura(cv, clienteId && clienteId !== "__nuovo__" ? clienteId : null, () => renderFerroRighe());
	}
	function chiudiEditorFerro(usa) {
		const k = ferroEditKey;
		ferroEditKey = null;
		document.getElementById("intervento-ferro-editor").style.display = "none";
		if (usa && k) {
			const s = document.getElementById("intervento-misura-sistema").value;
			const nuovo = {
				s,
				n: MISURE_FERRO[s][misuraIndiceCorrente]
			};
			if (ferroUguale(nuovo, ferroStd(cavalliClienteCorrente.find((c) => c.key === k)))) delete ferroOverride[k];
			else ferroOverride[k] = nuovo;
		}
		renderFerroRighe();
	}
	function selezionaQuantita(v, scroll) {
		const w = document.getElementById("intervento-quantita-wheel");
		w.querySelectorAll(".misura-wheel-item").forEach((el) => el.classList.toggle("sel", Number(el.dataset.v) === v));
		if (scroll) {
			quantitaToccata = true;
			w.scrollTo({
				top: (v - 1) * 44,
				behavior: "smooth"
			});
		}
	}
	function aggiornaIncassoForm() {
		const g = document.getElementById("intervento-incasso-group");
		if (g) g.style.display = interventoInModifica && interventoInModifica.stato === "fatto" ? "block" : "none";
	}
	async function openInterventoModal(clienteId, intervento, preset) {
		interventoInModifica = intervento || null;
		interventoPreset = intervento ? null : preset || null;
		const inModifica = !!interventoInModifica;
		const daConfermare = inModifica && interventoInModifica.stato === "richiesto";
		const lavoroFatto = !inModifica && !!(preset && preset.modo_fatto);
		document.getElementById("modal-add-intervento").classList.toggle("int-lavoro-fatto", lavoroFatto);
		document.getElementById("intervento-data").max = lavoroFatto ? isoLocale(/* @__PURE__ */ new Date()) : "";
		document.getElementById("intervento-modal-title").textContent = daConfermare ? "Conferma richiesta" : inModifica ? "Modifica appuntamento" : lavoroFatto ? "Registra un lavoro fatto" : "Nuovo appuntamento";
		document.getElementById("intervento-save-btn").textContent = daConfermare ? "Conferma appuntamento" : inModifica ? "Salva modifiche" : lavoroFatto ? "Salva il lavoro fatto" : "Salva appuntamento";
		document.getElementById("intervento-delete-btn").style.display = inModifica ? "block" : "none";
		const select = document.getElementById("intervento-cliente-select");
		const opzCli = (lista) => lista.slice().sort((a, b) => (a.nome || "").localeCompare(b.nome || "", "it", { sensitivity: "base" })).map((c) => `<option value="${c.id}">${escapeHtml(c.nome)}</option>`).join("");
		const clientiScelta = clientiMascalcia.filter((c) => !c.archiviato_il || c.id === clienteId || inModifica && c.id === inModifica.cliente_mascalcia_id);
		const propr = clientiScelta.filter((c) => !isStruttura(c)), strutt = clientiScelta.filter(isStruttura);
		const opzioniClienti = strutt.length ? `<optgroup label="Proprietari">${opzCli(propr)}</optgroup><optgroup label="Scuderie e centri ippici">${opzCli(strutt)}</optgroup>` : opzCli(propr);
		select.innerHTML = (!inModifica && !clienteId && clientiScelta.length ? "<option value=\"\" disabled>Scegli il cliente…</option>" : "") + (inModifica ? "" : "<option value=\"__nuovo__\">+ Nuovo cliente</option>") + opzioniClienti;
		select.disabled = inModifica;
		cercaClienteIntervento();
		if (inModifica) select.value = interventoInModifica.cliente_mascalcia_id;
		else if (clienteId) select.value = clienteId;
		else if (clientiMascalcia.length === 0) select.value = "__nuovo__";
		else select.value = "";
		const i = interventoInModifica || preset || {};
		document.getElementById("intervento-nuovo-cliente-nome").value = "";
		document.getElementById("intervento-nuovo-cliente-tipo").value = "proprietario";
		document.getElementById("intervento-nuovo-cavallo-nome").value = "";
		document.getElementById("intervento-nuovo-cavallo-microchip").value = "";
		tipoOriginaleIntervento = interventoInModifica ? interventoInModifica.tipo_ferratura : null;
		document.getElementById("intervento-tipo").value = i.tipo_ferratura || "ferratura";
		document.getElementById("intervento-tipo-altro").value = i.tipo_altro || "";
		intModo = "scheda";
		intStr = {
			preset: null,
			zoccolo: null
		};
		if (interventoInModifica && interventoInModifica.tipo_ferratura === "altro" && vistaCompleta()) {
			const l = leggiStraordinario(interventoInModifica.tipo_altro);
			intModo = "straordinario";
			intStr = {
				preset: l.preset,
				zoccolo: l.zoccolo
			};
			document.getElementById("intervento-tipo-altro").value = l.preset === "altro" ? l.libero : "";
		}
		if (!interventoInModifica && preset && preset.modo === "straordinario" && vistaCompleta()) intModo = "straordinario";
		nuovoCavalloLavoro("completa");
		ferroOverride = {};
		ferroEditKey = null;
		document.getElementById("intervento-ferro-editor").style.display = "none";
		const q = Number(i.quantita_ferri);
		quantitaToccata = q >= 1 && q <= 4;
		quantitaToccata || i.tipo_ferratura;
		quantitaDaScheda = !quantitaToccata && !interventoInModifica;
		document.getElementById("intervento-ferri-nuovi").checked = interventoInModifica ? interventoInModifica.ferri_nuovi !== false : true;
		document.getElementById("intervento-data").value = i.data_intervento || isoLocale(/* @__PURE__ */ new Date());
		document.getElementById("intervento-ora").value = i.ora ? String(i.ora).slice(0, 5) : "";
		aggiornaQuando();
		document.getElementById("intervento-importo").value = interventoInModifica?.importo ?? "";
		document.getElementById("intervento-pagamento").value = interventoInModifica?.stato_pagamento || "da_saldare";
		aggiornaIncassoForm();
		document.getElementById("intervento-note").value = i.note || "";
		const boxRich = document.getElementById("intervento-richiesta-box");
		if (boxRich) {
			const rich = daConfermare && !interventoInModifica.gruppo_id;
			boxRich.style.display = rich ? "block" : "none";
			if (rich) {
				const dOrig = interventoInModifica.data_intervento, oOrig = interventoInModifica.ora ? String(interventoInModifica.ora).slice(0, 5) : "";
				const aggiorna = () => {
					const d = document.getElementById("intervento-data").value, o = document.getElementById("intervento-ora").value;
					const cambiata = d !== dOrig || (o || "") !== oOrig;
					document.getElementById("modal-add-intervento").classList.toggle("int-cambiata", cambiata);
					boxRich.innerHTML = cambiata ? `<b>📅 Nuova data: ${formatDataBreve(d)}${o ? " ore " + o : ""}</b>Il cliente aveva chiesto ${formatDataBreve(dOrig)}${oOrig ? " ore " + oOrig : ""}: riceverà in chat la data che salvi.` : `<b>📅 Il cliente chiede ${formatDataBreve(dOrig)}${oOrig ? " ore " + oOrig : ""}</b>Puoi cambiare data e ora più in basso: il cliente riceve in chat la data che salvi.`;
				};
				document.getElementById("intervento-data").oninput = aggiorna;
				document.getElementById("intervento-ora").oninput = aggiorna;
				aggiorna();
			} else {
				document.getElementById("modal-add-intervento").classList.remove("int-cambiata");
				document.getElementById("intervento-data").oninput = null;
				document.getElementById("intervento-ora").oninput = null;
			}
		}
		document.getElementById("intervento-error").style.display = "none";
		document.getElementById("intervento-gia-fatto").checked = lavoroFatto;
		aggiornaGiaFatto();
		if (typeof ofPreparaAiutanteAppuntamento === "function") ofPreparaAiutanteAppuntamento(interventoInModifica).catch(() => {});
		if (lavoroFatto) document.getElementById("intervento-ora").value = "";
		openModal("modal-add-intervento");
		await onInterventoClienteChange();
		toggleInterventoTipoFields();
	}
	async function onInterventoClienteChange() {
		const clienteId = document.getElementById("intervento-cliente-select").value;
		if (!interventoInModifica && clienteId !== "__nuovo__" && isStrutturaCollegata(clienteId) && !lavoroFattoAttivo()) {
			const preset = {
				...interventoPreset || {},
				tipo_ferratura: document.getElementById("intervento-tipo").value,
				data_intervento: document.getElementById("intervento-data").value,
				ora: document.getElementById("intervento-ora").value
			};
			closeModal("modal-add-intervento");
			return apriPropostaStruttura(clienteId, preset);
		}
		const isNuovo = clienteId === "__nuovo__";
		document.getElementById("intervento-nuovo-cliente-group").style.display = isNuovo ? "flex" : "none";
		const sel = document.getElementById("intervento-cavallo-select");
		const multi = document.getElementById("intervento-cavalli-multi");
		const inMod = !!interventoInModifica;
		sel.style.display = inMod ? "" : "none";
		multi.style.display = inMod ? "none" : "block";
		document.getElementById("intervento-cavallo-label").textContent = inMod ? "Cavallo" : "Cavalli";
		ferroOverride = {};
		if (!clienteId) {
			cavalliClienteCorrente = [];
			sel.innerHTML = "<option value=\"\">Scegli prima il cliente</option>";
			sel.value = "";
			multi.innerHTML = "<div class=\"muted\" style=\"font-size:13px;padding:9px 0\">Scegli prima il cliente</div>";
			toggleInterventoNuovoCavallo();
			return;
		}
		sel.innerHTML = "<option value=\"\">Caricamento…</option>";
		multi.innerHTML = "<div class=\"muted\" style=\"font-size:13px;padding:9px 0\">Caricamento…</div>";
		cavalliClienteCorrente = isNuovo ? [] : await DB.listCavalliCliente(clienteId);
		const cliSc = !isNuovo && !inMod ? (clientiMascalcia || []).find((c) => c.id === clienteId) : null;
		if (cliSc && isStruttura(cliSc)) {
			await caricaCavalliMiei().catch(() => {});
			if (document.getElementById("intervento-cliente-select").value !== clienteId) return;
			cavalliQuiStanno(clienteId).forEach((r) => {
				if (cavalliClienteCorrente.some((c) => c.id === r.id)) return;
				const prop = (clientiMascalcia || []).find((c) => c.id === r.cliente_mascalcia_id);
				cavalliClienteCorrente.push({
					...r,
					key: "q:" + r.id,
					tipo: r.horse_id ? "equo" : "manuale",
					id: r.id,
					proprietarioId: r.cliente_mascalcia_id,
					proprietarioNome: prop?.nome || "altro cliente",
					ferratura_tipo: r.ferratura_tipo || "completa",
					ferro_tipo: r.ferro_tipo || "standard"
				});
			});
			cavalliClienteCorrente.sort((a, b) => (a.nome || "").localeCompare(b.nome || "", "it", { sensitivity: "base" }));
		}
		const diChi = (c) => c.proprietarioId ? " · di " + c.proprietarioNome : "";
		const opzioni = cavalliClienteCorrente.map((c) => `<option value="${c.key}">${escapeHtml(c.nome)}${c.tipo === "equo" ? " · su Equo" : ""}${escapeHtml(diChi(c))}</option>`).join("");
		sel.innerHTML = (cavalliClienteCorrente.length ? "" : "<option value=\"\">— nessun cavallo —</option>") + opzioni + "<option value=\"__nuovo_cavallo__\">+ Aggiungi cavallo</option>";
		let valore = "";
		const rif = interventoInModifica || interventoPreset;
		const mRif = rif && (rif.cavallo_cliente_id || rif.horse_id) ? cavalliClienteCorrente.find((c) => rif.cavallo_cliente_id && c.id === rif.cavallo_cliente_id || rif.horse_id && c.horse_id === rif.horse_id) : null;
		if (inMod || mRif) {
			if (mRif) valore = mRif.key;
		} else if (isNuovo || !cavalliClienteCorrente.length) valore = "__nuovo_cavallo__";
		else if (cavalliClienteCorrente.length === 1) valore = cavalliClienteCorrente[0].key;
		sel.value = valore;
		const presetCavalli = new Set([valore].concat(interventoPreset?.cavalli || []).filter(Boolean));
		multi.innerHTML = cavalliClienteCorrente.map((c) => `<label class="int-cav"><input type="checkbox" class="int-cav-chk" value="${c.key}"${presetCavalli.has(c.key) ? " checked" : ""} onchange="onCavalliMultiChange()"> <span>${escapeHtml(c.nome)}${c.tipo === "equo" ? " <small>· su Equo</small>" : ""}${c.presso ? " <small>· 📍 " + escapeHtml(c.presso) + "</small>" : ""}${c.proprietarioId ? " <small>· 👤 di " + escapeHtml(c.proprietarioNome) + "</small>" : ""}</span></label>`).join("") + `<label class="int-cav nuovo"><input type="checkbox" class="int-cav-chk" value="__nuovo_cavallo__"${presetCavalli.has("__nuovo_cavallo__") ? " checked" : ""} onchange="onCavalliMultiChange()"> <span>+ Aggiungi cavallo</span></label>`;
		if (inMod && mRif && interventoInModifica.numero_ferro) {
			const usato = {
				s: interventoInModifica.misura_sistema || "italiana",
				n: String(interventoInModifica.numero_ferro),
				origine: "intervento"
			};
			if (!ferroUguale(usato, ferroStd(mRif))) ferroOverride[mRif.key] = usato;
		}
		toggleInterventoNuovoCavallo();
	}
	function selezionaCavalloIntervento(nome) {
		const k = cercaNorm(nome);
		const c = cavalliClienteCorrente.find((x) => cercaNorm(x.nome) === k);
		if (!c) return;
		const sel = document.getElementById("intervento-cavallo-select");
		if (sel) sel.value = c.key;
		document.querySelectorAll("#intervento-cavalli-multi .int-cav-chk").forEach((x) => {
			x.checked = x.value === c.key;
		});
		toggleInterventoNuovoCavallo();
	}
	var tipoOriginaleIntervento = null;
	var quantitaDaScheda = false;
	var intModo = "scheda";
	var intStr = {
		preset: null,
		zoccolo: null
	};
	var nuovoCavLavoro = "completa";
	function intConCavalli() {
		return cavalliSceltiIntervento().some(Boolean);
	}
	function intTipoManuale() {
		if (!intConCavalli()) return true;
		return !!(interventoInModifica && tipoOriginaleIntervento === "altro" && !vistaCompleta());
	}
	function intStraordinario() {
		return vistaCompleta() && intConCavalli() && !intTipoManuale() && intModo === "straordinario";
	}
	function tipoPerCavallo(_tipo, k) {
		if (intTipoManuale()) return document.getElementById("intervento-tipo").value;
		if (intStraordinario()) return "altro";
		if (interventoInModifica && (interventoInModifica.stato === "fatto" || interventoInModifica.gruppo_id) && tipoOriginaleIntervento && tipoOriginaleIntervento !== "altro") return tipoOriginaleIntervento;
		if (k === "__nuovo_cavallo__") return LAVORO_CAV[nuovoCavLavoro].tipo;
		const cv = cavalliClienteCorrente.find((c) => c.key === k);
		return cv ? tipoDaScheda(cv) : document.getElementById("intervento-tipo").value;
	}
	function onCavalliMultiChange() {
		toggleInterventoNuovoCavallo();
	}
	function nuovoCavalloLavoro(v) {
		nuovoCavLavoro = LAVORO_CAV[v] ? v : "completa";
		document.querySelectorAll("#intervento-nuovo-cavallo-lavoro button").forEach((b) => b.classList.toggle("on", b.dataset.v === nuovoCavLavoro));
	}
	function toggleInterventoNuovoCavallo() {
		const nuovo = cavalliSceltiIntervento().includes("__nuovo_cavallo__");
		document.getElementById("intervento-nuovo-cavallo-group").style.display = nuovo ? "flex" : "none";
		document.getElementById("intervento-nuovo-cavallo-lavoro-group").style.display = nuovo ? "flex" : "none";
		renderFerroRighe();
		toggleInterventoTipoFields();
	}
	var STR_PRESET = [
		{
			k: "perso",
			t: "Ferro perso / rimesso",
			zoccolo: true,
			ic: "<path d=\"M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.8-3.8a6 6 0 0 1-7.9 7.9l-6.9 6.9a2.1 2.1 0 0 1-3-3l6.9-6.9a6 6 0 0 1 7.9-7.9z\"/>"
		},
		{
			k: "tolti",
			t: "Ferri tolti (lastre, riposo)",
			ic: "<rect x=\"3\" y=\"3\" width=\"18\" height=\"18\" rx=\"2\"/><path d=\"M9 3v18M15 3v18M3 9h18M3 15h18\"/>"
		},
		{
			k: "pareggio",
			t: "Pareggio su cavallo ferrato",
			ic: "<circle cx=\"6\" cy=\"6\" r=\"3\"/><circle cx=\"6\" cy=\"18\" r=\"3\"/><path d=\"M20 4 8.1 15.9M14.5 14.5 20 20M8.1 8.1 12 12\"/>"
		},
		{
			k: "corr",
			t: "Correttivo provvisorio",
			ic: "<path d=\"M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6\"/><path d=\"M15 3h6v6M10 14 21 3\"/>"
		},
		{
			k: "urg",
			t: "Urgenza / con il veterinario",
			ic: "<path d=\"M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.2 16.2l2.8 2.8M2 12h4M18 12h4\"/><circle cx=\"12\" cy=\"12\" r=\"3\"/>"
		},
		{
			k: "altro",
			t: "Altro",
			ic: "<path d=\"M12 20h9\"/><path d=\"M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z\"/>"
		}
	];
	var STR_ZOCCOLI = [
		"Anteriore sx",
		"Anteriore dx",
		"Posteriore sx",
		"Posteriore dx"
	];
	function sceltaModoIntervento(m) {
		intModo = m === "straordinario" ? "straordinario" : "scheda";
		toggleInterventoTipoFields();
	}
	function sceltaStraordinario(k) {
		intStr.preset = k;
		if (k !== "perso") intStr.zoccolo = null;
		toggleInterventoTipoFields();
	}
	function sceltaZoccolo(z) {
		intStr.zoccolo = intStr.zoccolo === z ? null : z;
		toggleInterventoTipoFields();
	}
	function testoStraordinario() {
		const p = STR_PRESET.find((x) => x.k === intStr.preset);
		if (!p) return null;
		if (p.k === "altro") return document.getElementById("intervento-tipo-altro").value.trim() || null;
		return p.t + (p.zoccolo && intStr.zoccolo ? " · " + intStr.zoccolo.toLowerCase() : "");
	}
	function leggiStraordinario(testo) {
		const t = String(testo || "");
		const p = STR_PRESET.find((x) => x.k !== "altro" && t.startsWith(x.t));
		if (!p) return {
			preset: "altro",
			zoccolo: null,
			libero: t
		};
		const z = STR_ZOCCOLI.find((z) => t.toLowerCase().endsWith(z.toLowerCase()));
		return {
			preset: p.k,
			zoccolo: z || null,
			libero: ""
		};
	}
	function toggleInterventoTipoFields() {
		const manuale = intTipoManuale();
		const str = intStraordinario();
		const conCav = intConCavalli();
		[
			"intervento-ferro-group",
			"intervento-quantita-group",
			"intervento-ferri-nuovi-row"
		].forEach((id) => {
			const el = document.getElementById(id);
			if (el) el.style.display = "none";
		});
		document.getElementById("intervento-tipo-group").style.display = manuale ? "flex" : "none";
		const tipo = document.getElementById("intervento-tipo").value;
		const modoVis = vistaCompleta() && conCav && !manuale;
		document.getElementById("intervento-modo-group").style.display = modoVis ? "flex" : "none";
		document.querySelectorAll("#intervento-modo button").forEach((b) => b.classList.toggle("on", b.dataset.v === (str ? "straordinario" : "scheda")));
		const sg = document.getElementById("intervento-str-group");
		sg.style.display = str ? "flex" : "none";
		if (str) {
			document.getElementById("intervento-str-preset").innerHTML = STR_PRESET.map((p) => `<button type="button" class="${intStr.preset === p.k ? "on" : ""}" onclick="sceltaStraordinario('${p.k}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${p.ic}</svg><span>${p.t}</span></button>`).join("");
			const conZ = STR_PRESET.find((p) => p.k === intStr.preset)?.zoccolo;
			document.getElementById("intervento-str-zoccoli-box").style.display = conZ ? "block" : "none";
			document.getElementById("intervento-str-zoccoli").innerHTML = STR_ZOCCOLI.map((z) => `<button type="button" class="${intStr.zoccolo === z ? "on" : ""}" onclick="sceltaZoccolo('${z}')">${z}</button>`).join("");
		}
		document.getElementById("intervento-tipo-altro-group").style.display = manuale && tipo === "altro" || str && intStr.preset === "altro" ? "flex" : "none";
		renderFerroRighe();
	}
	function quandoIntervento(q) {
		const inp = document.getElementById("intervento-data");
		if (q === "x") try {
			inp.showPicker ? inp.showPicker() : inp.focus();
		} catch (e) {
			inp.focus();
		}
		else {
			const d = /* @__PURE__ */ new Date();
			d.setDate(d.getDate() + q);
			inp.value = isoLocale(d);
			aggiornaGiaFatto();
		}
		aggiornaQuando(q === "x");
	}
	function aggiornaQuando(forzaScegli) {
		const v = document.getElementById("intervento-data").value;
		const oggi = isoLocale(/* @__PURE__ */ new Date()), dom = aggiungiGiorniIso(oggi, 1), ieri = aggiungiGiorniIso(oggi, -1);
		const lf = lavoroFattoAttivo();
		const q = forzaScegli && v !== oggi && v !== dom && v !== ieri ? "x" : v === oggi ? "0" : v === dom && !lf ? "1" : v === ieri && lf ? "-1" : "x";
		document.querySelectorAll("#intervento-quando button").forEach((b) => b.classList.toggle("on", b.dataset.q === q));
	}
	function lavoroFattoAttivo() {
		return !!document.getElementById("modal-add-intervento")?.classList.contains("int-lavoro-fatto");
	}
	var sinoResolve = null;
	function chiediSiNo(titolo, testo) {
		return new Promise((resolve) => {
			sinoResolve = resolve;
			document.getElementById("sino-tit").textContent = titolo;
			document.getElementById("sino-testo").textContent = testo || "";
			document.getElementById("eq-pop-sino").classList.add("attivo");
		});
	}
	function rispondiSiNo(si) {
		document.getElementById("eq-pop-sino").classList.remove("attivo");
		const r = sinoResolve;
		sinoResolve = null;
		if (r) r(!!si);
	}
	async function salvaInterventoMascalcia() {
		const errBox = document.getElementById("intervento-error");
		const errore = (msg) => {
			errBox.textContent = msg;
			errBox.style.display = "block";
		};
		errBox.style.display = "none";
		const saveBtn = document.getElementById("intervento-save-btn");
		let cliente_mascalcia_id = document.getElementById("intervento-cliente-select").value;
		if (!cliente_mascalcia_id) return errore("Scegli il cliente (oppure \"+ Nuovo cliente\").");
		let scelti = cavalliSceltiIntervento();
		if (!scelti.length) scelti = [""];
		if (scelti.length > 1) scelti = scelti.filter(Boolean);
		const straord = intStraordinario();
		if (straord && !intStr.preset) return errore("Scegli il lavoro straordinario.");
		const tipo_ferratura = tipoPerCavallo(null, scelti.find(Boolean) || "");
		const tipo_altro = tipo_ferratura === "altro" ? straord ? testoStraordinario() : document.getElementById("intervento-tipo-altro").value.trim() || null : null;
		const conFerri = (t) => t === "ferratura" || t === "mezza_ferratura";
		const data_intervento = document.getElementById("intervento-data").value;
		const ora = document.getElementById("intervento-ora").value || null;
		const conIncassoForm = !!(interventoInModifica && interventoInModifica.stato === "fatto");
		const importoRaw = conIncassoForm ? document.getElementById("intervento-importo").value : "";
		let importoForm = importoRaw === "" ? interventoInModifica && !conIncassoForm ? interventoInModifica.importo ?? null : null : Number(importoRaw);
		let statoPagamento = conIncassoForm ? document.getElementById("intervento-pagamento").value : interventoInModifica?.stato_pagamento || "da_saldare";
		const note = document.getElementById("intervento-note").value.trim();
		if (!cliente_mascalcia_id || !data_intervento) return errore("Seleziona cliente e data.");
		if (tipo_ferratura === "altro" && !tipo_altro) return errore(straord ? "Scrivi che lavoro hai fatto." : "Specifica il tipo di intervento.");
		const nuovoCavalloNome = document.getElementById("intervento-nuovo-cavallo-nome").value.trim();
		const nuovoCavalloChip = document.getElementById("intervento-nuovo-cavallo-microchip").value.trim();
		if (scelti.includes("__nuovo_cavallo__") && !nuovoCavalloNome) return errore("Inserisci il nome del cavallo.");
		const ferri = {};
		for (const k of scelti) {
			if (!k) continue;
			if (interventoInModifica && interventoInModifica.stato === "fatto" && interventoInModifica.numero_ferro) {
				ferri[k] = {
					s: interventoInModifica.misura_sistema || "italiana",
					n: String(interventoInModifica.numero_ferro)
				};
				continue;
			}
			const std = ferroStd(cavalliClienteCorrente.find((c) => c.key === k));
			if (std) ferri[k] = {
				s: std.s,
				n: std.n
			};
		}
		saveBtn.disabled = true;
		let clienteCreatoOra = false;
		let salvati = 0;
		try {
			if (cliente_mascalcia_id === "__nuovo__") {
				const nome = document.getElementById("intervento-nuovo-cliente-nome").value.trim();
				if (!nome) return errore("Inserisci il nome del cliente.");
				const tipo_cliente = document.getElementById("intervento-nuovo-cliente-tipo").value;
				const { error: clienteError, data: nuovoCliente } = await DB.insertClienteMascalcia({
					nome,
					nome_cavallo: nuovoCavalloNome,
					telefono: "",
					note: "",
					tipo_cliente
				});
				if (clienteError || !nuovoCliente) return errore("Errore nel creare il cliente: " + (clienteError?.message || ""));
				cliente_mascalcia_id = nuovoCliente.id;
				clienteCreatoOra = true;
			}
			const righe = [];
			for (const k of scelti) {
				let cavallo_cliente_id = null, horse_id = null, nome = "", cliente = cliente_mascalcia_id;
				if (k === "__nuovo_cavallo__") {
					const { error: cvErr, data: cv } = await DB.insertCavalloCliente({
						cliente_mascalcia_id,
						nome: nuovoCavalloNome,
						microchip: nuovoCavalloChip || null,
						ferratura_tipo: nuovoCavLavoro
					});
					if (cvErr || !cv) return errore("Errore nel salvare il cavallo: " + (cvErr?.message || ""));
					cavallo_cliente_id = cv.id;
					nome = nuovoCavalloNome;
				} else if (k) {
					const scelto = cavalliClienteCorrente.find((c) => c.key === k);
					({cavallo_cliente_id, horse_id} = await DB.risolviCavalloPerIntervento(cliente_mascalcia_id, scelto));
					nome = scelto?.nome || "";
					if (scelto?.proprietarioId) cliente = scelto.proprietarioId;
				}
				const f = ferri[k];
				righe.push({
					key: k,
					cliente,
					cavallo_cliente_id,
					horse_id,
					nome,
					tipo: tipoPerCavallo(null, k),
					misura_sistema: f ? f.s : null,
					numero_ferro: f ? f.n : null
				});
			}
			const nomiCavalli = righe.map((r) => r.nome).filter(Boolean).join(", ");
			const oggiIso = isoLocale(/* @__PURE__ */ new Date());
			const giaFatto = lavoroFattoAttivo() || !!document.getElementById("intervento-gia-fatto")?.checked;
			if (!interventoInModifica && lavoroFattoAttivo() && data_intervento > oggiIso) return errore("Un lavoro già fatto non può avere una data futura: per il futuro crea un appuntamento.");
			const futuro = interventoInModifica ? (/* @__PURE__ */ new Date(data_intervento + "T" + (ora || "00:00"))).getTime() > Date.now() : data_intervento > oggiIso || data_intervento === oggiIso && !giaFatto;
			const statoPrec = interventoInModifica ? interventoInModifica.stato || "fatto" : null;
			const diGruppo = !!(interventoInModifica && interventoInModifica.gruppo_id);
			const precInfo = interventoInModifica ? {
				data: interventoInModifica.data_intervento,
				ora: interventoInModifica.ora ? String(interventoInModifica.ora).slice(0, 5) : "",
				cliente: interventoInModifica.cliente_mascalcia_id,
				tipo_ferratura: interventoInModifica.tipo_ferratura,
				tipo_altro: interventoInModifica.tipo_altro || ""
			} : null;
			const eraRichiesta = !diGruppo && STATI_NON_CONFERMATI.includes(statoPrec);
			const stato = diGruppo ? statoPrec : eraRichiesta ? data_intervento >= isoLocale(/* @__PURE__ */ new Date()) ? "programmato" : "fatto" : futuro ? "programmato" : statoPrec || "fatto";
			const diventaFatto = stato === "fatto" && statoPrec !== "fatto";
			let scadenzaComune = null, importi = null, ferriScelti = null;
			if (diventaFatto) {
				const r0 = righe[0] || {};
				const rFerri = righe.filter((r) => conFerri(r.tipo));
				const ps = await richiamoPerFatto({
					id: interventoInModifica?.id,
					cliente_mascalcia_id,
					tipo_ferratura,
					tipo_altro,
					data_intervento,
					cavallo_cliente_id: r0.cavallo_cliente_id,
					horse_id: r0.horse_id,
					cavallo: nomiCavalli,
					stato_pagamento: statoPagamento,
					importo: importoForm,
					ferri: rFerri.length ? {
						q: rFerri.every((r) => r.tipo === "mezza_ferratura") ? 2 : 4,
						nome: rFerri.length === 1 ? rFerri[0].nome : null,
						nuovi: interventoInModifica?.ferri_nuovi
					} : null,
					cavalli: righe.map((r) => ({
						nome: r.nome || "Intervento",
						cavallo_cliente_id: r.cavallo_cliente_id,
						horse_id: r.horse_id,
						importo: interventoInModifica ? interventoInModifica.importo : null
					}))
				});
				if (TIPO_FERRATURA_INTERVALLI[tipo_ferratura]) scadenzaComune = ps;
				statoPagamento = prendiPagamentoScelto() || statoPagamento;
				importi = prendiImportiScelti();
				ferriScelti = prendiFerriScelti();
			}
			if (!interventoInModifica && stato === "programmato" && importoForm == null && !importi && tipo_ferratura !== "altro" && promemoriaPrezzoAttivo()) {
				if (!incTutti.length) try {
					incTutti = await DB.listInterventiMascalciaTutti();
				} catch (e) {}
				const nomeCli = clientiMascalcia.find((c) => c.id === cliente_mascalcia_id)?.nome || "";
				importi = await chiediPrezzi(righe.map((r) => ({
					nome: r.nome || nomeCli,
					tipo: r.tipo,
					clienteId: r.cliente || cliente_mascalcia_id,
					cavalloId: r.cavallo_cliente_id
				})));
			}
			if (!interventoInModifica) {
				const stessoGiorno = await DB.listInterventiPeriodo(data_intervento, data_intervento).catch(() => []);
				const doppi = righe.map((r) => (stessoGiorno || []).find((i) => i.cliente_mascalcia_id === (r.cliente || cliente_mascalcia_id) && i.tipo_ferratura === tipo_ferratura && (r.cavallo_cliente_id && i.cavallo_cliente_id === r.cavallo_cliente_id || r.horse_id && i.horse_id === r.horse_id || !r.cavallo_cliente_id && !r.horse_id && !i.cavallo_cliente_id && !i.horse_id))).filter(Boolean);
				if (doppi.length) {
					const cv = doppi.map((d) => d.cavalli_clienti_mascalcia?.nome || agNomeCavallo(d) || "questo cavallo").join(", ");
					if (!confirm(`C'è già ${TIPO_MAN_LABEL[tipo_ferratura] ? TIPO_MAN_LABEL[tipo_ferratura].toLowerCase() : "un intervento"} per ${cv} il ${formatDataBreve(data_intervento)}.\n\nVuoi salvare comunque?`)) return errore("Non salvato: c'era già lo stesso appuntamento.");
				}
			}
			for (let n = 0; n < righe.length; n++) {
				const r = righe[n];
				let prossima_scadenza = null;
				if (TIPO_FERRATURA_INTERVALLI[r.tipo]) {
					if (interventoInModifica && statoPrec === "fatto" && interventoInModifica.prossima_scadenza && interventoInModifica.tipo_ferratura === r.tipo) prossima_scadenza = aggiungiGiorniIso(data_intervento, giorniTra(interventoInModifica.data_intervento, interventoInModifica.prossima_scadenza));
					else if (diventaFatto) prossima_scadenza = scadenzaComune;
					else if (stato === "fatto") prossima_scadenza = interventoInModifica?.prossima_scadenza || null;
					else {
						const sg = await giorniRichiamoSuggeriti(r.tipo, r.cavallo_cliente_id, r.horse_id, interventoInModifica?.id, r.cliente || cliente_mascalcia_id);
						prossima_scadenza = sg.giorni ? aggiungiGiorniIso(data_intervento, sg.giorni) : null;
					}
				}
				const importo = importi ? importi[n] ?? null : importoForm;
				const tipoRiga = r.tipo;
				const fr = conFerri(tipoRiga);
				const qScheda = tipoRiga === "mezza_ferratura" ? 2 : 4;
				const quantitaRiga = !fr ? null : ferriScelti && ferriScelti.nuovi ? Math.max(1, Math.min(4, Number(ferriScelti.n) || qScheda)) : interventoInModifica && Number(interventoInModifica.quantita_ferri) >= 1 && interventoInModifica.tipo_ferratura === tipoRiga ? Number(interventoInModifica.quantita_ferri) : qScheda;
				const ferri_nuovi = !fr ? null : ferriScelti ? ferriScelti.nuovi : interventoInModifica ? interventoInModifica.ferri_nuovi ?? null : null;
				const payload = {
					cavallo_cliente_id: r.cavallo_cliente_id,
					horse_id: r.horse_id,
					tipo_ferratura: tipoRiga,
					tipo_altro: tipoRiga === "altro" ? tipo_altro : null,
					misura_sistema: fr ? r.misura_sistema : null,
					numero_ferro: fr ? r.numero_ferro : null,
					quantita_ferri: quantitaRiga,
					ferri_nuovi,
					data_intervento,
					ora,
					stato,
					prossima_scadenza,
					importo,
					stato_pagamento: statoPagamento,
					note,
					...typeof ofCampiAiutanteIntervento === "function" ? ofCampiAiutanteIntervento(interventoInModifica) : {}
				};
				const { error } = interventoInModifica ? await DB.updateInterventoMascalcia(interventoInModifica.id, payload) : await DB.insertInterventoMascalcia({
					cliente_mascalcia_id: r.cliente || cliente_mascalcia_id,
					...payload
				});
				if (error) return errore("Errore: " + error.message + (salvati ? ` (salvati ${salvati} su ${righe.length})` : ""));
				salvati++;
			}
			closeModal("modal-add-intervento");
			const nomeCv = nomiCavalli;
			if (eraRichiesta) {
				const spostata = precInfo && (precInfo.data !== data_intervento || (precInfo.ora || "") !== (ora || ""));
				await DB.insertMessaggioMascalcia({
					cliente_mascalcia_id,
					tipo: "testo",
					testo: spostata ? testoRichiesta("✅ Appuntamento confermato con nuova data", {
						tipo_ferratura,
						tipo_altro,
						data_intervento,
						ora
					}, nomeCv).replace(/\.$/, "") + ` (avevi chiesto ${formatDataBreve(precInfo.data)}${precInfo.ora ? " ore " + precInfo.ora : ""}).` : testoRichiesta("✅ Appuntamento confermato", {
						tipo_ferratura,
						tipo_altro,
						data_intervento,
						ora
					}, nomeCv)
				});
				showToast("Richiesta confermata: il cliente riceve un messaggio in chat");
			} else if (precInfo && diGruppo && [
				"programmato",
				"richiesto",
				"proposto"
			].includes(statoPrec) && (precInfo.data !== data_intervento || (precInfo.ora || "") !== (ora || "") || servizioCambiato(precInfo, {
				tipo_ferratura,
				tipo_altro
			}))) showToast("Appuntamento modificato: la scuderia riceve l'avviso e deve riconfermarlo");
			else if (precInfo && !diGruppo && statoPrec === "programmato" && stato === "programmato" && (precInfo.data !== data_intervento || (precInfo.ora || "") !== (ora || "") || precInfo.cliente !== cliente_mascalcia_id || servizioCambiato(precInfo, {
				tipo_ferratura,
				tipo_altro
			}))) {
				await avvisaClienteAppuntamento("modificato", {
					cliente_mascalcia_id,
					tipo_ferratura,
					tipo_altro,
					data_intervento,
					ora,
					cavallo: nomeCv
				}, precInfo);
				showToast(clienteCollegatoEquo(cliente_mascalcia_id) ? "Appuntamento modificato: il cliente riceve l'avviso e lo conferma con «Ok, ho visto»" : "Appuntamento modificato: avviso salvato nella chat del cliente");
			} else if (!interventoInModifica && stato === "programmato" && [...new Set(righe.map((r) => r.cliente || cliente_mascalcia_id))].some(clienteCollegatoEquo)) {
				for (const cid of [...new Set(righe.map((r) => r.cliente || cliente_mascalcia_id))].filter(clienteCollegatoEquo)) await avvisaClienteAppuntamento("nuovo", {
					cliente_mascalcia_id: cid,
					tipo_ferratura,
					tipo_altro,
					data_intervento,
					ora,
					cavallo: righe.filter((r) => (r.cliente || cliente_mascalcia_id) === cid).map((r) => r.nome).filter(Boolean).join(", ")
				});
				showToast(righe.length > 1 ? `${righe.length} appuntamenti salvati: il cliente riceve l'avviso in chat` : "Appuntamento salvato: il cliente riceve l'avviso in chat");
			} else showToast(interventoInModifica ? "Appuntamento aggiornato" : righe.length > 1 ? `${righe.length} ${stato === "programmato" ? "appuntamenti salvati" : "interventi registrati"} (uno per cavallo)` : stato === "programmato" ? "Appuntamento salvato" : "Intervento registrato");
			interventoInModifica = null;
			if (clienteCreatoOra) await loadClientiMascalcia();
			await renderProDeadlines();
			await renderIncassi$1();
			if (typeof renderAgendaSettimana$1 === "function") await renderAgendaSettimana$1();
			if (currentClienteId === cliente_mascalcia_id) await loadClienteInterventi(cliente_mascalcia_id);
		} finally {
			saveBtn.disabled = false;
			if (clienteCreatoOra && !salvati && cliente_mascalcia_id && cliente_mascalcia_id !== "__nuovo__") {
				await DB.deleteCavalliClienteNuovo(cliente_mascalcia_id);
				await DB.deleteClienteMascalcia(cliente_mascalcia_id);
				document.getElementById("intervento-cliente-select").value = "__nuovo__";
			}
		}
	}
	async function avvisaClienteAppuntamento(tipo, i, prec) {
		if (!i?.cliente_mascalcia_id) return;
		const cav = i.cavallo || "";
		let testo;
		if (tipo === "nuovo") testo = testoRichiesta("📅 Nuovo appuntamento", {
			tipo_ferratura: i.tipo_ferratura,
			tipo_altro: i.tipo_altro,
			data_intervento: i.data_intervento,
			ora: i.ora
		}, cav).replace(/\.$/, "") + ". Se non ti va bene scrivimi qui.";
		else if (tipo === "spostato" || tipo === "modificato") {
			const righe = [];
			if (prec && servizioCambiato(prec, i)) righe.push(`• Servizio: ${etichettaServizio(prec.tipo_ferratura, prec.tipo_altro)} → ${etichettaServizio(i.tipo_ferratura, i.tipo_altro)}`);
			if (prec && (prec.data !== i.data_intervento || (prec.ora || "") !== (i.ora ? String(i.ora).slice(0, 5) : ""))) righe.push(`• Data: ${formatDataBreve(prec.data)}${prec.ora ? " ore " + prec.ora : ""} → ${formatDataBreve(i.data_intervento)}${i.ora ? " ore " + String(i.ora).slice(0, 5) : ""}`);
			testo = `✏️ APPUNTAMENTO MODIFICATO${cav ? " · " + cav : ""}` + (righe.length ? "\n" + righe.join("\n") : "") + "\n" + testoRichiesta("Ora", {
				tipo_ferratura: i.tipo_ferratura,
				tipo_altro: i.tipo_altro,
				data_intervento: i.data_intervento,
				ora: i.ora
			}, "") + (clienteCollegatoEquo(i.cliente_mascalcia_id) ? "\n👉 Tocca «Ok, ho visto» nell'appuntamento per confermare, o scrivimi qui se non ti va bene." : "\nSe non ti va bene scrivimi qui.");
		} else testo = testoRichiesta("❌ Appuntamento annullato", {
			tipo_ferratura: i.tipo_ferratura,
			tipo_altro: i.tipo_altro,
			data_intervento: i.data_intervento,
			ora: i.ora
		}, cav) + " Scrivimi qui se vuoi fissare un'altra data.";
		const { error } = await DB.insertMessaggioMascalcia({
			cliente_mascalcia_id: i.cliente_mascalcia_id,
			tipo: "testo",
			testo
		});
		if (error) console.error("avvisaClienteAppuntamento:", error);
	}
	function etichettaServizio(t, altro) {
		return t === "altro" && altro ? altro : TIPO_FERRATURA_LABELS[t] || t || "Appuntamento";
	}
	function servizioCambiato(a, b) {
		return (a.tipo_ferratura || "") !== (b.tipo_ferratura || "") || (a.tipo_altro || "") !== (b.tipo_altro || "");
	}
	function testoPrimaModifica(m) {
		const p = m && m.prima;
		if (!p) return "";
		return `${etichettaServizio(p.tipo, p.tipo_altro)}, ${formatDataBreve(p.data)}${p.ora ? " ore " + p.ora : ""}`;
	}
	function notaModificaMan(e, lungo) {
		if (!e || !e.modifica || !e.modifica.prima || e.stato === "fatto") return "";
		const daStruttura = e.modifica.da === "struttura";
		const chi = e.gruppo_id ? daStruttura ? "Proposta della scuderia" : "In attesa della scuderia" : clienteCollegatoEquo(e.cliente_mascalcia_id) ? "Il cliente non l'ha ancora visto" : "";
		if (!e.gruppo_id && !clienteCollegatoEquo(e.cliente_mascalcia_id)) return "";
		return `<div class="nota-modifica${lungo ? " lunga" : ""}">✏️ Modificato · prima: ${escapeHtml(testoPrimaModifica(e.modifica))}${chi ? " · " + chi : ""}</div>`;
	}
	function clienteCollegatoEquo(id) {
		const c = (clientiMascalcia || []).find((x) => x.id === id);
		return !!(c && c.cliente_user_id && !c.centro_id);
	}
	function deveAvvisareAnnullo(e) {
		return e && !e.gruppo_id && e.stato === "programmato" && e.data_intervento >= isoLocale(/* @__PURE__ */ new Date());
	}
	async function eliminaInterventoInModifica() {
		if (!interventoInModifica) return;
		if (!confirm(deveAvvisareAnnullo(interventoInModifica) ? "Eliminare questo appuntamento? Il cliente riceve l'avviso in chat." : "Eliminare questo appuntamento?")) return;
		const clienteId = interventoInModifica.cliente_mascalcia_id;
		const daAvvisare = deveAvvisareAnnullo(interventoInModifica) ? {
			...interventoInModifica,
			cavallo: agNomeCavalloSicuro(interventoInModifica) || (cavalliClienteCorrente.find((c) => c.id === interventoInModifica.cavallo_cliente_id) || {}).nome || ""
		} : null;
		const { error } = await DB.deleteInterventoMascalcia(interventoInModifica.id);
		if (error) {
			showToast("Errore: " + error.message);
			return;
		}
		if (daAvvisare) await avvisaClienteAppuntamento("annullato", daAvvisare);
		interventoInModifica = null;
		closeModal("modal-add-intervento");
		showToast("Appuntamento eliminato");
		await renderProDeadlines();
		await renderIncassi$1();
		if (typeof renderAgendaSettimana$1 === "function") await renderAgendaSettimana$1();
		if (currentClienteId === clienteId) await loadClienteInterventi(clienteId);
	}
	// equo-app-src/src/ruoli/maniscalco/moduli/035-ferratura-del-cavallo-scheda-libretto-fe.js
	var LAVORO_CAV = {
		completa: {
			t: "Ferrato",
			s: "4 ferri",
			q: 4,
			tipo: "ferratura"
		},
		mezza: {
			t: "Mezza",
			s: "2 davanti",
			q: 2,
			tipo: "mezza_ferratura"
		},
		pareggio: {
			t: "Pareggio",
			s: "senza ferri",
			q: null,
			tipo: "pareggio"
		}
	};
	function lavoroCav(cv) {
		return cv && LAVORO_CAV[cv.ferratura_tipo] ? cv.ferratura_tipo : "completa";
	}
	function tipoDaScheda(cv) {
		return LAVORO_CAV[lavoroCav(cv)].tipo;
	}
	var DETTAGLI_CORRETTIVO = [
		"Pad",
		"Soletta",
		"Alluminio",
		"Pianella",
		"Banda larga in punta",
		"Ferro asimmetrico"
	];
	function testoDettagliFerro(det, detp, note) {
		const l = (a) => (a || []).map((x) => String(x).toLowerCase()).join(", ");
		return [(detp || []).length ? [det && det.length ? "davanti: " + l(det) : "", "dietro: " + l(detp)].filter(Boolean).join("; ") : l(det), (note || "").trim()].filter(Boolean).join(" · ");
	}
	function testoTipoFerro(ft, ftp, note, det, detp) {
		let t = ftp && ftp !== ft ? ft === "correttivo" ? "correttivo davanti" : "correttivo dietro" : ft === "correttivo" ? "correttivo" : "standard";
		const extra = testoDettagliFerro(det, detp, note);
		if (extra && t !== "standard") t += " (" + extra + ")";
		return t;
	}
	function testoFerroIntervento(i) {
		if (!i || !i.ferro_tipo || i.ferro_tipo === "standard") return null;
		return (i.ferro_tipo === "corr_davanti" ? "correttivo davanti" : i.ferro_tipo === "corr_dietro" ? "correttivo dietro" : "correttivo") + (i.ferro_note ? " (" + i.ferro_note + ")" : "");
	}
	function descrFerraturaCavallo(cv) {
		const k = lavoroCav(cv), l = LAVORO_CAV[k];
		if (k === "pareggio") return "Pareggio · senza ferri";
		return [
			l.t,
			l.s + (cv.ferro_numero ? " " + siglaFerro(cv.ferro_sistema, cv.ferro_numero) : ""),
			testoTipoFerro(cv.ferro_tipo, k === "completa" ? cv.ferro_tipo_post : null, cv.ferro_note, cv.ferro_dettagli, k === "completa" ? cv.ferro_dettagli_post : null)
		].join(" · ");
	}
	var ferStato = null;
	function apriSchedaFerratura(cv, clienteId, dopo, extra) {
		if (!cv) return;
		const n = cv.ferro_numero ? MISURE_FERRO[cv.ferro_sistema || "italiana"]?.indexOf(misuraNorm(cv.ferro_numero)) : -1;
		ferStato = {
			cv,
			clienteId,
			dopo,
			lavoro: lavoroCav(cv),
			s: cv.ferro_numero ? cv.ferro_sistema || "italiana" : misuraPredefinita(),
			idx: n >= 0 ? n : -1,
			ft: cv.ferro_tipo || "standard",
			ftp: cv.ferro_tipo_post || null,
			det: (cv.ferro_dettagli || []).slice(),
			detp: (cv.ferro_dettagli_post || []).slice(),
			int: intervalloCavallo(cv),
			intEff: intervalloEffettivo({
				...cv,
				intervallo_giorni: null
			}, clienteId || currentClienteId, schedaStoricoCavallo)
		};
		document.getElementById("fer-prezzo").value = cv.prezzo_ferratura != null && cv.prezzo_ferratura !== "" ? Number(cv.prezzo_ferratura) : "";
		document.getElementById("fer-titolo").textContent = (cv.nome || "Cavallo") + " · Ferratura";
		document.getElementById("fer-sistema").value = ferStato.s;
		document.getElementById("fer-note").value = cv.ferro_note || "";
		const av = document.getElementById("fer-avviso");
		av.value = cv.avviso_sicurezza || "";
		ferStato.avviso = cv.avviso_sicurezza || "";
		if (cv.id && cv.avviso_sicurezza === void 0 && !DEMO_MODE) sb.from("cavalli_clienti_mascalcia").select("avviso_sicurezza").eq("id", cv.id).maybeSingle().then(({ data }) => {
			if (data && ferStato && ferStato.cv === cv && !av.value) {
				av.value = data.avviso_sicurezza || "";
				ferStato.avviso = av.value;
			}
		}, () => {});
		document.getElementById("fer-errore").style.display = "none";
		document.getElementById("fer-dati").innerHTML = extra || "";
		ferRender();
		openModal("modal-ferratura");
	}
	function ferRender() {
		const f = ferStato;
		if (!f) return;
		document.querySelectorAll("#fer-lavoro button").forEach((b) => b.classList.toggle("on", b.dataset.v === f.lavoro));
		document.getElementById("fer-con-ferri").style.display = f.lavoro === "pareggio" ? "none" : "";
		document.getElementById("fer-misura").textContent = f.idx >= 0 ? "n. " + MISURE_FERRO[f.s][f.idx] + " " + MISURA_SISTEMA_LABEL[f.s] : "non impostata";
		const dd = vistaCompleta() && f.lavoro === "completa";
		document.getElementById("fer-tipo-label").textContent = dd ? "Tipo di ferro · davanti e dietro" : "Tipo di ferro";
		document.querySelector("#fer-riga-unico span").textContent = dd ? "Davanti" : "";
		document.getElementById("fer-riga-dietro").style.display = dd ? "" : "none";
		const ftp = f.ftp || f.ft;
		document.querySelectorAll("#modal-ferratura .fer-scelta[data-k=\"ft\"] button").forEach((b) => b.classList.toggle("on", b.dataset.v === f.ft));
		document.querySelectorAll("#modal-ferratura .fer-scelta[data-k=\"ftp\"] button").forEach((b) => b.classList.toggle("on", b.dataset.v === ftp));
		const chips = (lato, lista) => DETTAGLI_CORRETTIVO.map((v) => `<button type="button" class="${lista.includes(v) ? "on" : ""}" onclick="ferDettaglio('${lato}','${v}')">${escapeHtml(v)}</button>`).join("");
		const bu = document.getElementById("fer-det-unico"), bd = document.getElementById("fer-det-dietro");
		bu.style.display = f.ft === "correttivo" ? "" : "none";
		bu.innerHTML = f.ft === "correttivo" ? chips("det", f.det) : "";
		bd.style.display = dd && ftp === "correttivo" ? "" : "none";
		bd.innerHTML = dd && ftp === "correttivo" ? chips("detp", f.detp) : "";
		const da = {
			struttura: "della struttura",
			ultima: "come l'ultima volta",
			predefinito: "il tuo predefinito"
		};
		document.getElementById("fer-int-val").textContent = (f.int || f.intEff.giorni) + " giorni";
		document.getElementById("fer-int-rapidi").innerHTML = [
			30,
			35,
			40,
			45
		].map((g) => `<button type="button" class="${f.int === g ? "on" : ""}" onclick="ferIntervalloImposta(${g})">${g}</button>`).join("") + (f.int ? `<button type="button" class="togli" onclick="ferIntervalloImposta(null)">Togli</button>` : "");
		document.getElementById("fer-int-nota").textContent = f.int ? "Vale dalla prossima ferratura: la prossima data già fissata non cambia." : `Non impostato: usa ${f.intEff.giorni} giorni (${da[f.intEff.da] || ""}). Tocca − o + per fissarlo per questo cavallo.`;
		const pref = document.getElementById("fer-sistema-pref");
		if (pref) pref.innerHTML = currentUser && currentUser.ferroSistema === f.s ? "<i class=\"fa-solid fa-check\"></i> La tua misura di sempre" : `<button type="button" onclick="impostaMisuraPredefinita(ferStatoSistema())">Usa sempre la ${escapeHtml(TESTO_MISURA[f.s] || f.s)}</button>`;
	}
	function ferIntervallo(d) {
		const f = ferStato;
		if (!f) return;
		const base = f.int || f.intEff.giorni;
		f.int = Math.max(7, Math.min(180, base + d));
		ferRender();
	}
	function ferIntervalloImposta(v) {
		const f = ferStato;
		if (!f) return;
		f.int = v;
		ferRender();
	}
	var TESTO_MISURA = {
		italiana: "misura italiana",
		olandese: "misura olandese / internazionale",
		tedesca: "misura tedesca"
	};
	function ferStatoSistema() {
		return ferStato ? ferStato.s : null;
	}
	function ferDettaglio(lato, v) {
		const f = ferStato;
		if (!f || !DETTAGLI_CORRETTIVO.includes(v)) return;
		const l = f[lato] || [];
		f[lato] = l.includes(v) ? l.filter((x) => x !== v) : DETTAGLI_CORRETTIVO.filter((x) => x === v || l.includes(x));
		ferRender();
	}
	async function impostaMisuraPredefinita(v) {
		if (!currentUser || !MISURE_FERRO[v]) return;
		if (!DEMO_MODE) {
			const { error } = await sb.from("profiles").update({ ferro_sistema_predefinito: v }).eq("id", currentUser.id);
			if (error) {
				showToast(/ferro_sistema_predefinito/.test(error.message || "") ? "Manca un aggiornamento del database: avvisa l'assistenza Equo." : "Errore: " + error.message);
				return;
			}
		}
		currentUser.ferroSistema = v;
		const sel = document.getElementById("misura-pref-select");
		if (sel) sel.value = v;
		if (document.getElementById("modal-ferratura")?.classList.contains("active")) ferRender();
		showToast("Da ora i cavalli senza misura partono dalla " + (TESTO_MISURA[v] || v));
	}
	function ferLavoro(v) {
		if (ferStato) {
			ferStato.lavoro = v;
			ferRender();
		}
	}
	function ferSistema() {
		const f = ferStato;
		if (!f) return;
		const nuovo = document.getElementById("fer-sistema").value;
		if (f.idx >= 0) {
			const i = f.idx;
			f.s = nuovo;
			f.idx = Math.min(i, MISURE_FERRO[nuovo].length - 1);
		} else f.s = nuovo;
		ferRender();
	}
	function ferMisura(d) {
		const f = ferStato;
		if (!f) return;
		const max = MISURE_FERRO[f.s].length - 1;
		f.idx = f.idx < 0 ? MISURA_INDICE_PARTENZA : Math.max(0, Math.min(max, f.idx + d));
		ferRender();
	}
	function ferTipo(k, v) {
		const f = ferStato;
		if (!f) return;
		if (k === "ft") {
			const dietro = f.ftp || f.ft;
			f.ft = v;
			if (vistaCompleta() && f.lavoro === "completa") f.ftp = dietro;
			else f.ftp = null;
		} else f.ftp = v;
		if (f.ftp === f.ft) f.ftp = null;
		ferRender();
	}
	async function salvaSchedaFerratura() {
		const f = ferStato;
		if (!f) return;
		const cv = f.cv;
		const err = (m) => {
			const e = document.getElementById("fer-errore");
			e.textContent = m;
			e.style.display = "block";
		};
		const campi = { ferratura_tipo: f.lavoro };
		if (f.lavoro !== "pareggio") {
			if (f.idx >= 0) {
				campi.ferro_sistema = f.s;
				campi.ferro_numero = MISURE_FERRO[f.s][f.idx];
			}
			campi.ferro_tipo = f.ft;
			if (vistaCompleta() && f.lavoro === "completa") campi.ferro_tipo_post = f.ftp || null;
			else if (f.ft !== (cv.ferro_tipo || "standard")) campi.ferro_tipo_post = null;
			campi.ferro_note = document.getElementById("fer-note").value.trim() || null;
			campi.ferro_dettagli = f.ft === "correttivo" && f.det.length ? f.det.slice() : null;
			if (vistaCompleta() && f.lavoro === "completa") campi.ferro_dettagli_post = (f.ftp || f.ft) === "correttivo" && f.detp.length ? f.detp.slice() : null;
			else if (f.ft !== (cv.ferro_tipo || "standard")) campi.ferro_dettagli_post = null;
		}
		campi.intervallo_giorni = f.int || null;
		const pz = document.getElementById("fer-prezzo").value;
		if (pz !== "" && !(Number(pz) >= 0 && Number(pz) <= 1e4)) return err("Controlla il prezzo.");
		campi.prezzo_ferratura = pz === "" ? null : Math.round(Number(pz) * 100) / 100;
		const avviso = document.getElementById("fer-avviso").value.trim();
		if (avviso !== (f.avviso || "")) campi.avviso_sicurezza = avviso || null;
		Object.keys(campi).forEach((k) => {
			const prima = k === "ferratura_tipo" ? lavoroCav(cv) : k === "ferro_tipo" ? cv.ferro_tipo || "standard" : k === "avviso_sicurezza" ? f.avviso || null : cv[k] ?? null;
			if (k === "prezzo_ferratura" || k === "intervallo_giorni") {
				if ((prima == null || prima === "" ? null : Number(prima)) === (campi[k] == null ? null : Number(campi[k]))) delete campi[k];
				return;
			}
			if (String(prima ?? "") === String(campi[k] ?? "")) delete campi[k];
		});
		if (!Object.keys(campi).length) {
			closeModal("modal-ferratura");
			if (f.dopo) f.dopo(cv, false);
			return;
		}
		const btn = document.getElementById("fer-salva");
		btn.disabled = true;
		try {
			let id = cv.id;
			if (!id && f.clienteId) ({cavallo_cliente_id: id} = await DB.risolviCavalloPerIntervento(f.clienteId, cv));
			if (!id) return err("Non riuscito, riprova.");
			const { error } = await DB.updateCavalloCliente(id, campi);
			if (error) return err(/ferratura_tipo|ferro_tipo_post|ferro_dettagli|intervallo_giorni|prezzo_ferratura/.test(error.message || "") || /avviso_sicurezza/.test(error.message || "") ? "Manca un aggiornamento del database: avvisa l'assistenza Equo." : "Errore: " + error.message);
			Object.assign(cv, campi, { id });
			[
				schedaCavalli,
				cavalliEditCache,
				cavalliClienteCorrente,
				cavalliMieiLista
			].forEach((l) => (l || []).forEach((x) => {
				if (x !== cv && x.id === id) Object.assign(x, campi);
			}));
			closeModal("modal-ferratura");
			showToast(`${cv.nome || "Cavallo"}: ${descrFerraturaCavallo(cv)}`);
			if (f.dopo) f.dopo(cv, true);
		} finally {
			btn.disabled = false;
		}
	}
	async function syncNomeCavalloCliente() {
		const nome_cavallo = (await DB.listCavalliCliente(currentClienteId)).map((x) => x.nome).join(", ");
		await DB.updateClienteMascalcia(currentClienteId, { nome_cavallo });
	}
	async function aggiungiCavalloCodice(btn) {
		const inp = document.getElementById("edit-cliente-codice-cavallo");
		const codice = inp.value.trim();
		if (!codice) {
			showToast("Scrivi il codice Equo del cavallo");
			inp.focus();
			return;
		}
		if (DEMO_MODE) {
			showToast("In demo l'aggiunta con codice non è disponibile.");
			return;
		}
		if (btn) btn.disabled = true;
		try {
			let { data, error } = await sb.rpc("pro_cavallo_da_codice", {
				p_cliente_id: currentClienteId,
				p_codice: codice,
				p_conferma: false
			});
			if (error) {
				showToast("Errore: " + error.message);
				return;
			}
			if (data && data.chiedi) {
				if (!confirm(`${data.nome} (${data.codice}) ora è tra i cavalli di ${data.da}.\n\nVuoi spostarlo in ${data.a}? Storico e interventi restano con il cavallo${data.da ? "; se è lo stesso cavallo già presente qui con un altro codice, le due schede diventano una." : "."}`)) return;
				({data, error} = await sb.rpc("pro_cavallo_da_codice", {
					p_cliente_id: currentClienteId,
					p_codice: codice,
					p_conferma: true
				}));
				if (error) {
					showToast("Errore: " + error.message);
					return;
				}
			}
			if (!data?.ok) {
				showToast(data?.errore || "Non riuscito, riprova.");
				return;
			}
			inp.value = "";
			showToast(data.azione === "gia" ? `${data.nome} è già tra i cavalli di questo cliente.` : data.azione === "spostato" ? `${data.nome} spostato qui da ${data.da} (codice ${data.codice}).` : `${data.nome} aggiunto (codice ${data.codice}).`);
			await renderCavalliEditCliente();
			await syncNomeCavalloCliente();
			try {
				await loadClientiMascalcia();
			} catch (e) {}
		} finally {
			if (btn) btn.disabled = false;
		}
	}
	async function aggiungiCavalloEditCliente() {
		const nome = document.getElementById("edit-cliente-nuovo-cavallo").value.trim();
		const chip = document.getElementById("edit-cliente-nuovo-chip").value.trim();
		if (!nome) {
			showToast("Inserisci il nome del cavallo");
			return;
		}
		const razza = razzaValore("edit-cliente-nuovo-razza");
		if (razza === false) return;
		const { error } = await DB.insertCavalloCliente({
			cliente_mascalcia_id: currentClienteId,
			nome,
			microchip: chip || null,
			razza
		});
		if (error) {
			showToast("Errore: " + error.message);
			return;
		}
		document.getElementById("edit-cliente-nuovo-cavallo").value = "";
		document.getElementById("edit-cliente-nuovo-chip").value = "";
		razzaImposta("edit-cliente-nuovo-razza", "");
		await renderCavalliEditCliente();
		await syncNomeCavalloCliente();
	}
	async function eliminaCavalloEditCliente(id) {
		if (!confirm("Eliminare questo cavallo? Gli interventi già registrati restano nello storico.")) return;
		const { error } = await DB.deleteCavalloCliente(id);
		if (error) {
			showToast("Errore: " + error.message);
			return;
		}
		await renderCavalliEditCliente();
		await syncNomeCavalloCliente();
	}
	async function salvaEditCliente() {
		const errBox = document.getElementById("edit-cliente-error");
		errBox.style.display = "none";
		const nome = document.getElementById("edit-cliente-nome").value.trim();
		const telefono = document.getElementById("edit-cliente-telefono").value.trim();
		const note = document.getElementById("edit-cliente-note").value.trim();
		if (!nome) {
			errBox.textContent = "Il nome del cliente è obbligatorio.";
			errBox.style.display = "block";
			return;
		}
		const tipo_cliente = document.getElementById("edit-cliente-tipo").value;
		const codiceEquo = document.getElementById("edit-cliente-codice-equo").value.trim().toUpperCase();
		const campiCli = {
			telefono,
			note
		};
		if (!document.getElementById("edit-cliente-nome").disabled) campiCli.nome = nome;
		if (!document.getElementById("edit-cliente-tipo").disabled) campiCli.tipo_cliente = tipo_cliente;
		const { error } = await DB.updateClienteMascalcia(currentClienteId, campiCli);
		if (error) {
			errBox.textContent = "Errore: " + error.message;
			errBox.style.display = "block";
			return;
		}
		const indirizzo = document.getElementById("edit-cliente-indirizzo").value.trim();
		const cPrima = clientiMascalcia.find((x) => x.id === currentClienteId);
		if ((cPrima?.indirizzo || "") !== indirizzo) await DB.updateClienteMascalcia(currentClienteId, { indirizzo: indirizzo || null });
		if (cPrima?.cliente_user_id) {
			const prom = !!document.getElementById("edit-cliente-promemoria").checked;
			if (cPrima.promemoria_pagamenti !== false !== prom) await DB.updateClienteMascalcia(currentClienteId, { promemoria_pagamenti: prom });
		}
		if (codiceEquo) {
			const res = await DB.collegaClienteDaCodice(currentClienteId, codiceEquo);
			if (!res.ok) {
				errBox.textContent = "Dati salvati, ma " + messaggioErroreCollegaCliente(res).replace(/^./, (x) => x.toLowerCase());
				errBox.style.display = "block";
				await loadClientiMascalcia();
				return;
			}
			showToast("Collegato a Equo: gli è arrivato il tuo primo messaggio");
		}
		closeModal("modal-edit-cliente");
		if (!codiceEquo) showToast("Cliente aggiornato");
		const id = currentClienteId;
		await loadClientiMascalcia();
		await openClienteDetail(id);
	}
	function closeClienteDetail() {
		currentClienteId = null;
		schedaDaCartella = false;
		schedaCavalloKey = null;
		const vp = document.getElementById("cavallo-pro-view");
		if (vp) vp.style.display = "none";
		document.getElementById("clienti-list-view").style.display = "block";
		document.getElementById("clienti-detail-view").style.display = "none";
	}
	// equo-app-src/src/ruoli/maniscalco/moduli/034-strutture-collegate-a-equo-scuderia-prof.js
	function isManiscalcoUtente() {
		return !!currentUser && [
			currentUser.ruolo,
			currentUser.ruoloSecondario,
			currentUser.ruolo_secondario
		].includes("maniscalco");
	}
	function badgeCollegamentoCliente(c) {
		if (c.collegamento_stato === "attivo") return "<span class=\"badge badge-green\" style=\"font-size:10.5px;flex-shrink:0\">Equo Scuderia</span>";
		if (c.collegamento_stato === "da_confermare_pro") return "<span class=\"badge badge-red\" style=\"font-size:10.5px;flex-shrink:0\">Invito</span>";
		if (c.collegamento_stato === "da_confermare_struttura") return "<span class=\"badge badge-accent\" style=\"font-size:10.5px;flex-shrink:0\">In attesa</span>";
		return c.cliente_user_id ? "<span class=\"badge badge-green\" style=\"font-size:10.5px;flex-shrink:0\">su Equo</span>" : "";
	}
	async function rispondiInvitoStruttura(clienteId, accetta, btn) {
		if (window.event) window.event.stopPropagation();
		if (btn) btn.disabled = true;
		const { data, error } = await sb.rpc("pro_rispondi_collegamento_struttura", {
			p_cliente_id: clienteId,
			p_accetta: accetta
		});
		if (error || !data?.ok) {
			showToast(data && data.errore || "Operazione non riuscita. Riprova.");
			if (btn) btn.disabled = false;
			return;
		}
		showToast(accetta ? "Scuderia collegata: trovi la chat in Messaggi → Scuderie." : "Invito rifiutato.");
		await loadClientiMascalcia();
	}
	var collegaStrutturaClienteId = null;
	function apriCollegaStruttura(clienteId) {
		collegaStrutturaClienteId = clienteId || null;
		document.getElementById("collega-struttura-codice").value = "";
		document.getElementById("collega-struttura-error").style.display = "none";
		openModal("modal-collega-struttura");
	}
	async function inviaRichiestaStruttura() {
		const input = document.getElementById("collega-struttura-codice");
		const err = document.getElementById("collega-struttura-error");
		const codice = input.value.trim().toUpperCase();
		err.style.display = "none";
		if (!codice) {
			err.textContent = "Inserisci il codice della scuderia.";
			err.style.display = "block";
			return;
		}
		if (DEMO_MODE) {
			closeModal("modal-collega-struttura");
			showToast("In demo il collegamento non è disponibile.");
			return;
		}
		const { data, error } = await sb.rpc("pro_richiedi_collegamento_struttura", {
			p_codice: codice,
			p_cliente_id: collegaStrutturaClienteId
		});
		if (error || !data?.ok) {
			err.textContent = data && data.errore || "Non è stato possibile inviare la richiesta. Riprova.";
			err.style.display = "block";
			return;
		}
		closeModal("modal-collega-struttura");
		showToast(data.gia ? data.stato === "attivo" ? `Sei già collegato a ${data.nome}.` : `C'è già una richiesta in corso con ${data.nome}.` : `Richiesta inviata a ${data.nome}: la scuderia deve accettarla.`);
		if (data.senza_piva && !data.gia) setTimeout(() => showToast("Consiglio: aggiungi la P.IVA in menu profilo → Dati per i pagamenti per avere il badge Equo Certified."), 3200);
		await loadClientiMascalcia();
		if (currentClienteId && document.getElementById("clienti-detail-view")?.style.display === "block") openClienteDetail(currentClienteId);
	}
	function scollegaStrutturaCorrente() {
		const c = clientiMascalcia.find((x) => x.id === currentClienteId);
		if (!c || !c.centro_id) return;
		const attivo = c.collegamento_stato === "attivo";
		const nome = escapeHtml(c.nome || "la scuderia");
		document.getElementById("scollega-struttura-titolo").textContent = attivo ? "Chiudi collegamento" : "Annulla richiesta";
		document.getElementById("scollega-struttura-testo").innerHTML = attivo ? `Vuoi chiudere il collegamento con <strong>${nome}</strong>?<br>Lo staff non vedrà più la chat e gli appuntamenti con te. La scheda cliente, gli interventi e i messaggi restano tuoi. Per ricollegarti servirà di nuovo il codice della scuderia e la sua conferma.` : `Vuoi annullare la richiesta di collegamento con <strong>${nome}</strong>?`;
		const ok = document.getElementById("scollega-struttura-ok");
		ok.textContent = attivo ? "Chiudi collegamento" : "Annulla richiesta";
		ok.disabled = false;
		openModal("modal-scollega-struttura");
	}
	async function confermaScollegaStruttura() {
		const c = clientiMascalcia.find((x) => x.id === currentClienteId);
		if (!c || !c.centro_id) {
			closeModal("modal-scollega-struttura");
			return;
		}
		const ok = document.getElementById("scollega-struttura-ok");
		ok.disabled = true;
		try {
			const { data, error } = await sb.rpc("pro_scollega_struttura", { p_cliente_id: c.id });
			if (error || !data?.ok) {
				showToast(data && data.errore || "Operazione non riuscita. Riprova.");
				return;
			}
			closeModal("modal-scollega-struttura");
			showToast("Collegamento chiuso. La scheda cliente resta tua.");
			await loadClientiMascalcia();
			openClienteDetail(c.id);
		} finally {
			ok.disabled = false;
		}
	}
	var ERRORI_COLLEGA_CLIENTE = {
		codice_non_valido: "Codice Equo non trovato. Controlla di averlo scritto bene.",
		codice_tuo: "Questo è il tuo codice: serve quello del cliente.",
		codice_professionista: "Questo è il codice di un professionista, non di un cliente. Il cliente trova il suo codice in Equo, menu → «Il tuo codice».",
		gia_collegato_altro: "Questo cliente è già collegato a un altro account Equo.",
		cliente_non_trovato: "Cliente non trovato.",
		non_autenticato: "Sessione scaduta: esci e rientra."
	};
	function messaggioErroreCollegaCliente(res) {
		if (res?.errore === "gia_tuo_cliente") return `Questo account è già collegato al tuo cliente "${res.nome_cliente || ""}".`;
		return ERRORI_COLLEGA_CLIENTE[res?.errore] || "Collegamento non riuscito." + (res?.messaggio ? " (" + res.messaggio + ")" : "");
	}
	function mostraLimiteClienti() {
		openModal("modal-limite-clienti");
	}
	function apriNuovoCliente(tipo) {
		if (!isPremium() && clientiAttivi().length >= LIMITE_CLIENTI_FREE) {
			mostraLimiteClienti();
			return;
		}
		[
			"cliente-nome",
			"cliente-cavallo",
			"cliente-telefono",
			"cliente-indirizzo",
			"cliente-note",
			"cliente-codice-equo"
		].forEach((id) => document.getElementById(id).value = "");
		{
			const n = document.getElementById("cliente-indirizzo-pos-nota");
			if (n) {
				n.textContent = "";
				n.className = "pos-nota";
			}
		}
		document.getElementById("cliente-error").style.display = "none";
		document.getElementById("cliente-tipo").value = tipo === "struttura" ? "struttura" : "proprietario";
		aggiornaEtichetteNuovoCliente();
		openModal("modal-add-cliente");
	}
	function aggiornaEtichetteNuovoCliente() {
		const struttura = document.getElementById("cliente-tipo").value === "struttura";
		document.getElementById("cliente-nome-label").textContent = struttura ? "Nome scuderia o centro ippico" : "Nome cliente";
		document.getElementById("cliente-nome").placeholder = struttura ? "es. Scuderia Le Querce" : "es. Marco Bianchi";
		const tit = document.getElementById("cliente-modal-titolo");
		if (tit) tit.textContent = struttura ? "Nuova scuderia" : "Nuovo cliente";
		const btn = document.getElementById("cliente-save-btn");
		if (btn) btn.textContent = struttura ? "Salva scuderia" : "Salva cliente";
	}
	function nomiCavalliDaTesto(testo) {
		const visti = /* @__PURE__ */ new Set();
		return String(testo || "").split(/[,;\n]+/).map((x) => x.trim()).filter((x) => x && !visti.has(x.toLowerCase()) && visti.add(x.toLowerCase())).slice(0, 30);
	}
	async function creaCavalliDaTesto(clienteId, testo) {
		const creati = [];
		for (const nome of nomiCavalliDaTesto(testo)) {
			const { data, error } = await DB.insertCavalloCliente({
				cliente_mascalcia_id: clienteId,
				nome
			});
			if (!error && data) creati.push(data);
		}
		return creati;
	}
	async function createClienteMascalcia() {
		const nome = document.getElementById("cliente-nome").value.trim();
		if (!nome) return;
		const nome_cavallo = document.getElementById("cliente-cavallo").value.trim();
		const telefono = document.getElementById("cliente-telefono").value.trim();
		const note = document.getElementById("cliente-note").value.trim();
		const tipo_cliente = document.getElementById("cliente-tipo").value;
		const codiceEquo = document.getElementById("cliente-codice-equo").value.trim().toUpperCase();
		const errBox = document.getElementById("cliente-error");
		errBox.style.display = "none";
		const btn = document.getElementById("cliente-save-btn");
		btn.disabled = true;
		try {
			const { error, data: nuovo } = await DB.insertClienteMascalcia({
				nome,
				nome_cavallo,
				telefono,
				note,
				tipo_cliente
			});
			if (error || !nuovo) {
				errBox.textContent = "Errore: " + (error?.message || "salvataggio non riuscito");
				errBox.style.display = "block";
				return;
			}
			await creaCavalliDaTesto(nuovo.id, nome_cavallo);
			const indirizzoNuovo = document.getElementById("cliente-indirizzo")?.value.trim();
			if (indirizzoNuovo) await DB.updateClienteMascalcia(nuovo.id, { indirizzo: indirizzoNuovo });
			let msgCollegamento = "";
			if (codiceEquo) {
				const res = await DB.collegaClienteDaCodice(nuovo.id, codiceEquo);
				msgCollegamento = res.ok ? " e collegato a Equo: gli è arrivato il tuo primo messaggio" : " — codice non collegato: " + messaggioErroreCollegaCliente(res);
			}
			[
				"cliente-nome",
				"cliente-cavallo",
				"cliente-telefono",
				"cliente-indirizzo",
				"cliente-note",
				"cliente-codice-equo"
			].forEach((id) => document.getElementById(id).value = "");
			closeModal("modal-add-cliente");
			showToast("Cliente salvato" + msgCollegamento);
			await loadClientiMascalcia();
		} finally {
			btn.disabled = false;
		}
	}
	async function openClienteDetail(id) {
		currentClienteId = id;
		const c = clientiMascalcia.find((x) => x.id === id);
		if (!c) return;
		document.getElementById("clienti-list-view").style.display = "none";
		document.getElementById("clienti-detail-view").style.display = "block";
		document.getElementById("detail-cliente-nome").textContent = c.nome;
		document.getElementById("detail-cliente-info").innerHTML = `
    <div style="font-size:13.5px;line-height:1.8">
      ${c.archiviato_il ? `<div style="color:var(--muted)"><strong>Archiviato</strong> il ${new Date(c.archiviato_il).toLocaleDateString("it-IT")}: non compare nella lista né nelle scadenze.</div>` : ""}
      <div><strong>Tipo:</strong> ${isStruttura(c) ? "Scuderia / centro ippico" : "Proprietario"} ${badgeCollegamentoCliente(c)}</div>
      ${c.telefono ? `<div><strong>Telefono:</strong> <a href="tel:${escapeHtml(c.telefono)}" style="color:inherit">${escapeHtml(c.telefono)}</a></div>` : ""}
      ${c.indirizzo ? `<div><strong>Indirizzo:</strong> ${escapeHtml(c.indirizzo)}</div>` : ""}
      ${c.note ? `<div><strong>Note:</strong> ${escapeHtml(c.note)}</div>` : ""}
    </div>
    <div class="cli-chip-row">
      <button class="cli-chip" onclick="openChatThread(currentClienteId)"><span class="icon"><svg><use href="#i-inbox"/></svg></span> Messaggi</button>
      <button class="cli-chip" id="cli-chip-qr" onclick="toggleQrCliente()">QR e codice invito</button>
      ${isStruttura(c) && !c.archiviato_il ? `<button class="cli-chip" onclick="apriCambiaProprietario(true)"><span class="fa-icon"><i class="fa-solid fa-user"></i></span> Proprietari dei cavalli</button>` : ""}
    </div>
    <div class="cli-ciclo" id="cli-ciclo" style="display:none"></div>`;
		renderCicloStruttura(c);
		renderProposteCliente(c);
		const chipQr = document.getElementById("cli-chip-qr");
		if (chipQr) chipQr.style.display = isStruttura(c) && c.centro_id ? "none" : "";
		qrClienteAperto = false;
		document.querySelectorAll(".btn-archivia-cliente").forEach((b) => b.textContent = c.archiviato_il ? "Ripristina cliente" : "Archivia cliente");
		document.getElementById("detail-cliente-code").textContent = c.codice_invito;
		const linkHint = document.getElementById("detail-cliente-link-hint");
		if (linkHint) linkHint.innerHTML = c.cliente_user_id ? "<strong style=\"color:var(--primary)\">✓ Collegato a Equo</strong> — riceve i tuoi messaggi e PDF nell'app." : isStruttura(c) ? "Dai questo codice alla scuderia: può collegarsi da Equo App (Chat → \"Il tuo maniscalco\" → Collega), presto anche da Equo Scuderia." : "Fallo inquadrare al cliente con la fotocamera: si apre Equo, crea l'account e siete collegati. Oppure condividi l'invito.";
		const daInvitare = clienteDaInvitare(c);
		const qrBox = document.getElementById("detail-cliente-qr");
		qrBox.innerHTML = "";
		if (window.QRCode) new QRCode(qrBox, {
			text: daInvitare ? linkInvito(c.codice_invito) : c.codice_invito,
			width: 140,
			height: 140
		});
		{
			const b = document.getElementById("detail-cliente-invia-invito");
			if (b) b.style.display = daInvitare ? "" : "none";
		}
		const qrCard = document.getElementById("detail-cliente-qr-card");
		let boxScud = document.getElementById("detail-cliente-scuderia");
		if (!boxScud) {
			boxScud = document.createElement("div");
			boxScud.id = "detail-cliente-scuderia";
			boxScud.className = "card";
			boxScud.style.marginBottom = "14px";
			qrCard.parentNode.insertBefore(boxScud, qrCard);
		}
		if (isStruttura(c) && c.centro_id) {
			if (qrCard) qrCard.style.display = "none";
			boxScud.style.display = "block";
			boxScud.style.display = "block";
			const statoTxt = c.collegamento_stato === "attivo" ? "<strong style=\"color:var(--green)\">✓ Collegata a Equo Scuderia</strong> — chat e appuntamenti con la scuderia con doppia conferma." : c.collegamento_stato === "da_confermare_pro" ? "La scuderia ti ha invitato: accetta per collegarti." : "Richiesta inviata: in attesa che la scuderia accetti.";
			boxScud.innerHTML = `<div style="font-size:13.5px;line-height:1.6;margin-bottom:10px">${statoTxt}</div>
      ${c.collegamento_stato === "da_confermare_pro" ? `<div style="display:flex;gap:8px;margin-bottom:8px">
        <button class="btn btn-primary btn-sm btn-conferma" style="flex:1" onclick="rispondiInvitoStruttura('${c.id}', true, this).then(() => openClienteDetail('${c.id}'))">Accetta</button>
        <button class="btn btn-outline btn-sm" style="flex:1" onclick="rispondiInvitoStruttura('${c.id}', false, this).then(() => closeClienteDetail())">Rifiuta</button></div>` : ""}
      <button class="btn btn-ghost btn-sm" id="cliente-scollega-btn" style="width:100%;color:var(--red)" onclick="scollegaStrutturaCorrente()">${c.collegamento_stato === "attivo" ? "Scollega da Equo Scuderia" : "Annulla richiesta"}</button>`;
		} else if (isStruttura(c) && isManiscalcoUtente()) {
			if (qrCard) qrCard.style.display = "none";
			boxScud.style.display = "block";
			boxScud.innerHTML = `<div style="font-size:13.5px;line-height:1.6;margin-bottom:10px">La scuderia usa <strong>Equo Scuderia</strong>? Collegala per chattare con lo staff e fissare gli appuntamenti con doppia conferma.</div>
      <button class="btn btn-outline btn-sm" style="width:100%" onclick="apriCollegaStruttura('${c.id}')"><span class="fa-icon" style="width:13px;height:13px"><i class="fa-solid fa-link"></i></span> Collega a Equo Scuderia</button>`;
		} else {
			if (qrCard) qrCard.style.display = "none";
			boxScud.style.display = "none";
		}
		document.getElementById("cliente-cavalli-cerca").value = "";
		document.getElementById("cavallo-pro-view").style.display = "none";
		await loadClienteInterventi(id);
	}
	var qrClienteAperto = false;
	function toggleQrCliente() {
		qrClienteAperto = !qrClienteAperto;
		const card = document.getElementById("detail-cliente-qr-card");
		if (card) card.style.display = qrClienteAperto ? "block" : "none";
		const chip = document.getElementById("cli-chip-qr");
		if (chip) chip.classList.toggle("on", qrClienteAperto);
	}
	async function openEditCliente() {
		const c = clientiMascalcia.find((x) => x.id === currentClienteId);
		if (!c) return;
		document.getElementById("edit-cliente-tipo").value = isStruttura(c) ? "struttura" : "proprietario";
		{
			const bloccato = !!(c.cliente_user_id || c.centro_id);
			document.getElementById("edit-cliente-tipo").disabled = bloccato;
			document.getElementById("edit-cliente-nome").disabled = bloccato;
			const n = document.getElementById("edit-cliente-tipo-nota");
			if (n) n.style.display = bloccato ? "block" : "none";
		}
		razzaImposta("edit-cliente-nuovo-razza", "");
		document.getElementById("edit-cliente-codice-equo").value = "";
		document.getElementById("edit-cliente-codice-group").style.display = c.cliente_user_id ? "none" : "flex";
		document.getElementById("edit-cliente-collegato").style.display = c.cliente_user_id ? "flex" : "none";
		document.getElementById("edit-cliente-promemoria").checked = c.promemoria_pagamenti !== false;
		document.getElementById("edit-cliente-nome").value = c.nome || "";
		document.getElementById("edit-cliente-telefono").value = c.telefono || "";
		document.getElementById("edit-cliente-indirizzo").value = c.indirizzo || "";
		{
			const n = document.getElementById("edit-cliente-indirizzo-pos-nota");
			if (n) {
				n.textContent = "";
				n.className = "pos-nota";
			}
		}
		document.getElementById("edit-cliente-note").value = c.note || "";
		document.getElementById("edit-cliente-nuovo-cavallo").value = "";
		document.getElementById("edit-cliente-nuovo-chip").value = "";
		document.getElementById("edit-cliente-error").style.display = "none";
		openModal("modal-edit-cliente");
		await renderCavalliEditCliente();
	}
	var cavalliEditCache = [];
	async function renderCavalliEditCliente() {
		const box = document.getElementById("edit-cliente-cavalli");
		box.innerHTML = "<div class=\"muted\" style=\"font-size:13px\">Caricamento…</div>";
		const [cav, attesa, arch] = await Promise.all([
			DB.listCavalliCliente(currentClienteId),
			DB.listLasciatiInAttesa(),
			DB.listCavalliArchiviati(currentClienteId)
		]);
		cavalliEditCache = cav;
		const collegato = (x) => !!(x.tipo === "equo" || x.horse_id || x.scuderia_cavallo_id);
		const tastoLascia = (x) => x.id && attesa.has(x.id) ? `<button class="btn btn-ghost btn-sm" onclick="annullaLasciaCavallo('${x.id}')">Annulla richiesta</button>` : `<button class="btn btn-outline btn-sm" onclick="apriLasciaCavallo('${x.key}')" aria-label="${collegato(x) ? "Non lo seguo più" : "Archivia cavallo"}" title="${collegato(x) ? "Non lo seguo più" : "Archivia"}"><span class="fa-icon"><i class="fa-solid ${collegato(x) ? "fa-user-slash" : "fa-box-archive"}"></i></span></button>`;
		box.innerHTML = (cav.length ? cav.map((x) => `
    <div class="event-item" style="padding:8px 0">
      <div style="font-size:14px">${escapeHtml(x.nome)}${x.tipo === "equo" ? " <span class=\"badge badge-accent\" style=\"font-size:10.5px\">su Equo</span>" : ""}${x.id && attesa.has(x.id) ? " <span class=\"badge\" style=\"font-size:10.5px\">In attesa di conferma</span>" : ""}
        <div class="muted" style="font-size:11.5px">${[
			x.codice_equo ? "<b class=\"cod-equo\">" + escapeHtml(x.codice_equo) + "</b>" : "",
			x.razza ? escapeHtml(x.razza) : "",
			x.microchip ? "chip " + escapeHtml(x.microchip) : "",
			x.presso ? "📍 presso " + escapeHtml(x.presso) : "",
			x.ferro_numero ? "ferro " + escapeHtml(siglaFerro(x.ferro_sistema, x.ferro_numero)) : ""
		].filter(Boolean).join(" · ")}</div></div>
      <div style="display:flex;gap:6px;flex-shrink:0"><button class="btn btn-outline btn-sm btn-variazione" onclick="apriFerroCavallo('${x.key}')" aria-label="Ferro standard">${x.ferro_numero ? "Ferro" : "+ Ferro"}</button>${x.tipo === "manuale" && !x.horse_id && !x.scuderia_cavallo_id ? `<button class="btn btn-outline btn-sm btn-variazione" onclick="apriRazzaCavallo('${x.id}')" aria-label="Razza">${x.razza ? "Razza" : "+ Razza"}</button>` : ""}${tastoLascia(x)}</div>
    </div>
    <div class="rz-riga" id="rz-riga-${x.id}" style="display:none">
      <input class="input" id="rz-cv-${x.id}" placeholder="Scrivi per cercare la razza">
      <button class="btn btn-primary btn-sm btn-conferma" onclick="salvaRazzaCavallo('${x.id}')">OK</button>
    </div>`).join("") : "<div class=\"muted\" style=\"font-size:13px\">Nessun cavallo.</div>") + (arch.length ? `<details class="cav-archiviati" style="margin-top:8px"><summary class="muted" style="font-size:13px;cursor:pointer">Cavalli archiviati (${arch.length})</summary>
      ${arch.map((a) => `<div class="event-item" style="padding:6px 0"><div style="font-size:14px">${escapeHtml(a.nome || "")}
        <div class="muted" style="font-size:11.5px">${a.horse_id || a.scuderia_cavallo_id ? "Non lo segui più" : "Archiviato"}${a.archiviato_il ? " dal " + formatDate(String(a.archiviato_il).slice(0, 10)) : ""}</div></div>
        <button class="btn btn-outline btn-sm" onclick="ripristinaCavallo('${a.id}')">Ripristina</button></div>`).join("")}</details>` : "");
		return cav;
	}
	function apriRazzaCavallo(id) {
		const riga = document.getElementById("rz-riga-" + id);
		if (!riga) return;
		const aperta = riga.style.display !== "none";
		riga.style.display = aperta ? "none" : "flex";
		if (!aperta) {
			const cv = (cavalliEditCache || []).find((x) => x.id === id);
			razzaImposta("rz-cv-" + id, cv?.razza || "");
			document.getElementById("rz-cv-" + id).focus();
		}
	}
	async function salvaRazzaCavallo(id) {
		const razza = razzaValore("rz-cv-" + id);
		if (razza === false) return;
		const { error } = await DB.updateCavalloCliente(id, { razza });
		if (error) {
			showToast("Errore: " + error.message);
			return;
		}
		showToast(razza ? "Razza salvata: il codice del cavallo si aggiorna" : "Razza tolta");
		await renderCavalliEditCliente();
	}
	var ferroCavalloKey = null;
	function cavalloPerChiaveFerro(key) {
		return (document.getElementById("cavallo-pro-view")?.style.display === "block" ? schedaCavalli : cavalliEditCache || []).find((x) => x.key === key) || (cavalliEditCache || []).find((x) => x.key === key) || (schedaCavalli || []).find((x) => x.key === key);
	}
	function apriFerroCavallo(key) {
		const cv = cavalloPerChiaveFerro(key);
		if (!cv) return;
		if (typeof apriSchedaFerratura === "function") return apriSchedaFerratura(cv, currentClienteId, () => {
			if (document.getElementById("cavallo-pro-view")?.style.display === "block") renderCorpoCavalloPro();
			else renderCavalliEditCliente();
		});
		ferroCavalloKey = key;
		document.getElementById("ferro-cav-titolo").textContent = "Ferro standard · " + cv.nome;
		const f = ferroStd(cv) || {
			s: misuraPredefinita("olandese"),
			n: null
		};
		document.getElementById("ferro-misura-sistema").value = f.s;
		const idx = f.n ? MISURE_FERRO[f.s].indexOf(misuraNorm(f.n)) : -1;
		misuraIndiceFerro = idx >= 0 ? idx : MISURA_INDICE_PARTENZA;
		document.getElementById("ferro-cav-togli").style.display = cv.ferro_numero ? "block" : "none";
		openModal("modal-ferro-cavallo");
		renderMisuraWheel("ferro");
	}
	async function salvaFerroCavallo(togli) {
		const cv = cavalloPerChiaveFerro(ferroCavalloKey);
		if (!cv) return;
		const btn = document.getElementById("ferro-cav-salva");
		btn.disabled = true;
		try {
			let id = cv.id;
			if (!id) ({cavallo_cliente_id: id} = await DB.risolviCavalloPerIntervento(currentClienteId, cv));
			if (!id) {
				showToast("Non riuscito, riprova.");
				return;
			}
			const s = document.getElementById("ferro-misura-sistema").value;
			const campi = togli ? {
				ferro_sistema: null,
				ferro_numero: null
			} : {
				ferro_sistema: s,
				ferro_numero: MISURE_FERRO[s][misuraIndiceFerro]
			};
			const { error } = await DB.updateCavalloCliente(id, campi);
			if (error) {
				showToast("Errore: " + error.message);
				return;
			}
			closeModal("modal-ferro-cavallo");
			showToast(togli ? "Ferro standard tolto" : `Ferro standard di ${cv.nome}: ${siglaFerro(campi.ferro_sistema, campi.ferro_numero)}`);
			Object.assign(cv, campi, { id });
			if (document.getElementById("cavallo-pro-view")?.style.display === "block") renderCorpoCavalloPro();
			else await renderCavalliEditCliente();
		} finally {
			btn.disabled = false;
		}
	}
	// equo-app-src/src/ruoli/maniscalco/moduli/033-clienti-a-cartelle-stile-telegram-cavall.js
	try {
		cliCartella = localStorage.getItem("equo-cli-cartella") || "cavalli";
	} catch (_) {}
	function cavalliCartella() {
		const attiviId = new Set(clientiAttivi().map((c) => c.id));
		const righe = (cavalliMieiLista || []).filter((c) => attiviId.has(c.cliente_mascalcia_id)).map((c) => ({
			...c,
			key: "m:" + c.id
		}));
		const conHorse = new Set(righe.map((r) => r.horse_id).filter(Boolean));
		cliCavalliEquo.forEach((h) => {
			if (!conHorse.has(h.horse_id) && attiviId.has(h.cliente_mascalcia_id)) righe.push(h);
		});
		return righe.sort((a, b) => (a.nome || "").localeCompare(b.nome || "", "it", { sensitivity: "base" }));
	}
	async function caricaCartellaCavalli() {
		const collegati = clientiAttivi().filter((c) => c.cliente_user_id && !c.centro_id);
		const [eq, inter] = await Promise.all([Promise.all(collegati.map((c) => DEMO_MODE ? Promise.resolve([]) : sb.rpc("cavalli_condivisi_cliente", { p_cliente_id: c.id }).then((r) => (r.data || []).map((h) => ({
			key: "h:" + h.id,
			id: null,
			horse_id: h.id,
			nome: h.name,
			microchip: h.microchip,
			razza: h.breed,
			cliente_mascalcia_id: c.id,
			tipo: "equo"
		}))).catch(() => []))), DB.listInterventiMascalciaTutti().catch(() => [])]);
		cliCavalliEquo = eq.flat();
		cliInterventi = (inter || []).concat(await DB.listProssimiAppuntamenti(200).catch(() => []));
	}
	function sceltaCartellaClienti(k) {
		cliCartella = k;
		try {
			localStorage.setItem("equo-cli-cartella", k);
		} catch (_) {}
		if (typeof cercaAzzera === "function") cercaAzzera("clienti");
		renderClientiList();
	}
	function renderClientiList() {
		const box = document.getElementById("clienti-list");
		if (!box) return;
		const attivi = clientiAttivi();
		const alfabetico = (a, b) => (a.nome || "").localeCompare(b.nome || "", "it", { sensitivity: "base" });
		const proprietari = attivi.filter((c) => !isStruttura(c)).sort(alfabetico);
		const scuderie = attivi.filter(isStruttura).sort(alfabetico);
		const cavalli = cavalliCartella();
		if (![
			"cavalli",
			"clienti",
			"scuderie"
		].includes(cliCartella)) cliCartella = "cavalli";
		document.getElementById("cli-cartelle").innerHTML = [
			[
				"cavalli",
				"Cavalli",
				cavalli.length
			],
			[
				"clienti",
				"Clienti",
				proprietari.length
			],
			[
				"scuderie",
				"Scuderie",
				scuderie.length
			]
		].map(([k, t, n]) => `<button role="tab" aria-selected="${cliCartella === k}" class="${cliCartella === k ? "on" : ""}" onclick="sceltaCartellaClienti('${k}')">${t}<span class="n">${n}</span></button>`).join("");
		document.getElementById("cli-cartella-sotto").textContent = {
			cavalli: "Tutti i cavalli che segui",
			clienti: "Proprietari",
			scuderie: "Scuderie, maneggi e centri ippici"
		}[cliCartella];
		const collega = document.getElementById("cli-collega-btn");
		if (collega) collega.style.display = cliCartella === "scuderie" && isManiscalcoUtente() ? "" : "none";
		const f = typeof cercaFiltri !== "undefined" && cercaFiltri.clienti;
		if (f) f.inp.placeholder = {
			cavalli: "Cerca cavallo, cliente o microchip",
			clienti: "Cerca cliente, cavallo o telefono",
			scuderie: "Cerca scuderia o cavallo"
		}[cliCartella];
		const nuovo = (t, sotto, az) => `<div class="cli-riga nuovo cerca-ignora" onclick="${az}"><span class="cli-av">+</span><span class="cli-c"><b>${t}</b><span>${sotto}</span></span></div>`;
		const nomeCli = (id) => (clientiMascalcia.find((c) => c.id === id) || {}).nome || "";
		let html = "";
		if (cliCartella === "cavalli") {
			html = nuovo("Aggiungi cavallo", "nuovo o con codice Equo", "apriNuovoCavalloCartella()");
			let lettera = "";
			const oggi = isoLocale(/* @__PURE__ */ new Date());
			cavalli.forEach((cv) => {
				const l = (cv.nome || "?").trim().charAt(0).toUpperCase();
				if (l !== lettera) {
					lettera = l;
					html += `<div class="cli-lettera">${escapeHtml(l)}</div>`;
				}
				const st = statoCavalloPro(cv, cliInterventi);
				const cli = clientiMascalcia.find((c) => c.id === cv.cliente_mascalcia_id);
				const ferro = descrFerroBreve(cv);
				const pros = st.prossimo ? st.prossimo.data < oggi ? "scaduta" : formatDataBreve(st.prossimo.data) : "";
				html += `<div class="cli-riga" data-cerca="${escapeHtml([
					cv.microchip,
					cv.codice_equo,
					cli?.nome,
					cv.ubicazione_nome
				].filter(Boolean).join(" "))}" onclick="apriCavalloDaCartella('${cv.cliente_mascalcia_id}', '${cv.id || ""}', '${cv.horse_id || ""}')">
        <span class="cli-av">${iniziale(cv.nome)}${st.sem ? `<i class="cav-sem ${st.sem}"></i>` : ""}</span>
        <span class="cli-c"><b>${escapeHtml(cv.nome || "")}</b><span>${cli && isStruttura(cli) ? "📍 " : ""}${escapeHtml(nomeCli(cv.cliente_mascalcia_id))}${cv.tipo === "equo" ? " · su Equo" : ""}${cv.ubicazione_tipo === "scuderia" && cv.ubicazione_cliente_id && cv.ubicazione_cliente_id !== cv.cliente_mascalcia_id ? " · 📍 sta a " + escapeHtml(nomeCli(cv.ubicazione_cliente_id) || cv.ubicazione_nome || "una scuderia") : ""}</span></span>
        <span class="cli-dx">${escapeHtml(ferro || "")}${pros ? `<b class="${st.sem === "rosso" ? "rosso" : ""}">${escapeHtml(pros)}</b>` : ""}</span></div>`;
			});
			if (!cavalli.length) html += "<div class=\"cli-vuoto cerca-ignora\">Nessun cavallo ancora: aggiungilo qui sopra o dalla scheda di un cliente.</div>";
		} else {
			const struttura = cliCartella === "scuderie";
			const lista = struttura ? scuderie : proprietari;
			html = struttura ? nuovo("Aggiungi scuderia", "scuderia, maneggio o centro ippico", "apriNuovoCliente('struttura')") : nuovo("Aggiungi cliente", "proprietario di uno o più cavalli", "apriNuovoCliente('proprietario')");
			lista.forEach((c) => {
				const nomi = nomiCavalliCliente(c);
				const qui = struttura ? cavalliQuiStanno(c.id) : [];
				const sottoTesto = [nomi.length ? nomi.join(", ") : qui.length ? "" : struttura ? "Nessun cavallo indicato" : "Cavallo non indicato", qui.length ? `${qui.length} ${qui.length === 1 ? "cavallo" : "cavalli"} di altri clienti: ${qui.map((x) => x.nome).slice(0, 4).join(", ")}${qui.length > 4 ? "…" : ""}` : ""].filter(Boolean).join(" · ");
				html += `<div class="cli-riga" data-cerca="${escapeHtml(paroleCercaCliente(c) + " " + qui.map((x) => x.nome).join(" "))}" onclick="openClienteDetail('${c.id}')">
        <span class="cli-av"><i class="fa-solid ${struttura ? "fa-building" : "fa-user"}"></i></span>
        <span class="cli-c"><b>${escapeHtml(c.nome)}</b><span>${escapeHtml(sottoTesto)}</span></span>
        ${badgeCollegamentoCliente(c) || "<span class=\"cli-dx\">›</span>"}</div>
        ${c.collegamento_stato === "da_confermare_pro" ? `<div class="cli-invito">
          <div style="font-size:13px;line-height:1.5;margin-bottom:10px"><strong>${escapeHtml(c.nome)}</strong> ti ha invitato a collegarti come maniscalco su Equo Scuderia: chat e appuntamenti con la scuderia con doppia conferma.</div>
          <div style="display:flex;gap:8px"><button class="btn btn-primary btn-sm btn-conferma" style="flex:1" onclick="rispondiInvitoStruttura('${c.id}', true, this)">Accetta</button>
          <button class="btn btn-outline btn-sm" style="flex:1" onclick="rispondiInvitoStruttura('${c.id}', false, this)">Rifiuta</button></div></div>` : ""}`;
			});
			if (!lista.length) html += `<div class="cli-vuoto cerca-ignora">${struttura ? "Nessuna scuderia ancora. Aggiungi le scuderie e i centri ippici in cui lavori." : "Nessun proprietario ancora."}</div>`;
		}
		box.innerHTML = html;
		const arch = (clientiMascalcia || []).filter((c) => c.archiviato_il && cliCartella !== "cavalli" && cliCartella === "scuderie" === isStruttura(c));
		const card = (c) => `<div class="cli-riga" onclick="openClienteDetail('${c.id}')"><span class="cli-av"><i class="fa-solid ${isStruttura(c) ? "fa-building" : "fa-user"}"></i></span><span class="cli-c"><b>${escapeHtml(c.nome)}</b><span>${escapeHtml(c.nome_cavallo || "")}</span></span><span class="cli-dx">›</span></div>`;
		document.getElementById("clienti-archiviati-box").innerHTML = arch.length ? `<details class="clienti-archiviati" style="margin-top:14px">
      <summary class="clienti-sez-title" style="cursor:pointer;padding:6px 0">ARCHIVIATI (${arch.length})</summary>
      <div class="muted" style="font-size:12.5px;line-height:1.5;margin:4px 0 8px">Cavalli e storico sono al sicuro. Apri un cliente per ripristinarlo.</div>
      <div class="cli-lista" style="opacity:.72">${arch.sort(alfabetico).map(card).join("")}</div></details>` : "";
	}
	async function apriCavalloDaCartella(clienteId, cvId, horseId) {
		if (!clienteId) return;
		await openClienteDetail(clienteId);
		const cv = schedaCavalli.find((c) => cvId && c.id === cvId || horseId && c.horse_id === horseId);
		if (!cv) return;
		schedaDaCartella = true;
		await apriSchedaCavalloPro(cv.key);
	}
	function apriNuovoCavalloCartella() {
		[
			"ncav-nome",
			"ncav-chip",
			"ncav-codice"
		].forEach((id) => {
			document.getElementById(id).value = "";
		});
		razzaImposta("ncav-razza", "");
		const alf = (a, b) => (a.nome || "").localeCompare(b.nome || "", "it", { sensitivity: "base" });
		const pr = clientiAttivi().filter((c) => !isStruttura(c)).sort(alf), sc = clientiAttivi().filter(isStruttura).sort(alf);
		document.getElementById("ncav-cliente").innerHTML = "<option value=\"\">Scegli il cliente o la scuderia…</option>" + (pr.length ? `<optgroup label="Clienti">${pr.map((c) => `<option value="${c.id}">${escapeHtml(c.nome)}</option>`).join("")}</optgroup>` : "") + (sc.length ? `<optgroup label="Scuderie">${sc.map((c) => `<option value="${c.id}">${escapeHtml(c.nome)}</option>`).join("")}</optgroup>` : "") + "<option value=\"__nuovo_p\">+ Nuovo cliente</option><option value=\"__nuovo_s\">+ Nuova scuderia</option>";
		document.getElementById("ncav-errore").style.display = "none";
		openModal("modal-nuovo-cavallo");
	}
	function ncavClienteCambiato(sel) {
		if (sel.value === "__nuovo_p" || sel.value === "__nuovo_s") {
			const tipo = sel.value === "__nuovo_s" ? "struttura" : "proprietario";
			sel.value = "";
			closeModal("modal-nuovo-cavallo");
			showToast(tipo === "struttura" ? "Crea la scuderia: poi aggiungi il cavallo dalla sua scheda" : "Crea il cliente: poi aggiungi il cavallo dalla sua scheda");
			apriNuovoCliente(tipo);
		}
	}
	async function salvaNuovoCavalloCartella(btn) {
		const err = document.getElementById("ncav-errore");
		err.style.display = "none";
		const errore = (t) => {
			err.textContent = t;
			err.style.display = "block";
		};
		const clienteId = document.getElementById("ncav-cliente").value;
		const codice = document.getElementById("ncav-codice").value.trim();
		const nome = document.getElementById("ncav-nome").value.trim();
		if (!clienteId) return errore("Scegli di chi è o dove sta il cavallo.");
		if (!codice && !nome) return errore("Scrivi il nome del cavallo (oppure il suo codice Equo).");
		btn.disabled = true;
		try {
			if (codice) {
				if (DEMO_MODE) return errore("In demo l'aggiunta con codice non è disponibile.");
				let { data, error } = await sb.rpc("pro_cavallo_da_codice", {
					p_cliente_id: clienteId,
					p_codice: codice,
					p_conferma: false
				});
				if (error) return errore("Errore: " + error.message);
				if (data && data.chiedi) {
					if (!await chiediSiNo(`Spostare ${data.nome}?`, `${data.nome} (${data.codice}) ora è tra i cavalli di ${data.da}. Sì: lo sposti in ${data.a}, storico e interventi restano con il cavallo.`)) return;
					({data, error} = await sb.rpc("pro_cavallo_da_codice", {
						p_cliente_id: clienteId,
						p_codice: codice,
						p_conferma: true
					}));
					if (error) return errore("Errore: " + error.message);
				}
				if (!data?.ok) return errore(data?.errore || "Non riuscito, riprova.");
				showToast(data.azione === "gia" ? `${data.nome} è già tra i cavalli di questo cliente.` : `${data.nome} aggiunto (codice ${data.codice}).`);
			} else {
				const razza = razzaValore("ncav-razza");
				if (razza === false) return;
				const { error } = await DB.insertCavalloCliente({
					cliente_mascalcia_id: clienteId,
					nome,
					microchip: document.getElementById("ncav-chip").value.trim() || null,
					razza
				});
				if (error) return errore("Errore: " + error.message);
				showToast(`${nome} aggiunto`);
			}
			const cav = await DB.listCavalliCliente(clienteId);
			await DB.updateClienteMascalcia(clienteId, { nome_cavallo: cav.map((x) => x.nome).join(", ") });
			closeModal("modal-nuovo-cavallo");
			await loadClientiMascalcia();
		} finally {
			btn.disabled = false;
		}
	}
	function isStruttura(c) {
		return c && c.tipo_cliente === "struttura";
	}
	function isStrutturaCollegata(clienteId) {
		const c = clientiMascalcia.find((x) => x.id === clienteId);
		return !!(c && c.centro_id && c.collegamento_stato === "attivo");
	}
	// equo-app-src/src/ruoli/maniscalco/moduli/032-richiamo-prossimo-intervento-sempre-in-g.js
	var richiamiPredefiniti = null;
	var richiamoStato = null;
	async function caricaRichiamiPredefiniti() {
		const box = document.getElementById("menu-richiami");
		const pro = currentUser && (currentUser.ruolo === "maniscalco" || currentUser.ruoloSecondario === "maniscalco");
		if (box) box.style.display = pro && vistaAi() === "professionista" ? "block" : "none";
		if (!richiamiPredefiniti) {
			richiamiPredefiniti = { ...TIPO_FERRATURA_INTERVALLI };
			if (!DEMO_MODE && currentUser) {
				const { data } = await sb.from("profiles").select("intervalli_richiamo").eq("id", currentUser.id).maybeSingle();
				if (data?.intervalli_richiamo) richiamiPredefiniti = {
					...richiamiPredefiniti,
					...data.intervalli_richiamo
				};
			}
		}
		Object.keys(TIPO_FERRATURA_INTERVALLI).forEach((k) => {
			const el = document.getElementById("ric-def-" + k);
			if (el) el.value = richiamiPredefiniti[k];
		});
	}
	async function salvaRichiamiPredefiniti() {
		const v = {};
		for (const k of Object.keys(TIPO_FERRATURA_INTERVALLI)) {
			const n = Math.round(Number(document.getElementById("ric-def-" + k).value));
			if (!(n >= 1 && n <= 60)) {
				showToast("Scegli un numero di giorni tra 1 e 60.");
				return caricaRichiamiPredefiniti();
			}
			v[k] = n;
		}
		richiamiPredefiniti = v;
		if (!DEMO_MODE && currentUser) {
			const { error } = await sb.from("profiles").update({ intervalli_richiamo: v }).eq("id", currentUser.id);
			if (error) {
				showToast("Non sono riuscito a salvare, riprova.");
				return;
			}
		}
		showToast("Richiami predefiniti salvati");
	}
	function giorniTra(a, b) {
		const [y1, m1, d1] = a.split("-").map(Number), [y2, m2, d2] = b.split("-").map(Number);
		return Math.round((new Date(y2, m2 - 1, d2) - new Date(y1, m1 - 1, d1)) / 864e5);
	}
	async function giorniRichiamoSuggeriti(tipo, cavallo_cliente_id, horse_id, escludiId, clienteId) {
		if (!TIPO_FERRATURA_INTERVALLI[tipo]) return { giorni: null };
		if (!richiamiPredefiniti) await caricaRichiamiPredefiniti();
		const base = Number(richiamiPredefiniti?.[tipo]) || TIPO_FERRATURA_INTERVALLI[tipo];
		if (!cavallo_cliente_id && !horse_id) return { giorni: base };
		let prec = null;
		if (DEMO_MODE) prec = (demoState.interventiMascalcia || []).filter((i) => i.id !== escludiId && i.stato === "fatto" && i.tipo_ferratura === tipo && i.prossima_scadenza && (cavallo_cliente_id && i.cavallo_cliente_id === cavallo_cliente_id || horse_id && i.horse_id === horse_id)).sort((a, b) => b.data_intervento.localeCompare(a.data_intervento))[0] || null;
		else {
			let q = sb.from("interventi_mascalcia").select("id, data_intervento, prossima_scadenza, importo").eq("maniscalco_id", currentUser.id).eq("stato", "fatto").eq("tipo_ferratura", tipo).not("prossima_scadenza", "is", null);
			q = cavallo_cliente_id ? q.eq("cavallo_cliente_id", cavallo_cliente_id) : q.eq("horse_id", horse_id);
			if (escludiId) q = q.neq("id", escludiId);
			const { data } = await q.order("data_intervento", { ascending: false }).limit(1);
			prec = (data || [])[0] || null;
		}
		const g = prec ? giorniTra(prec.data_intervento, prec.prossima_scadenza) : null;
		const prima = prec ? prec.prossima_scadenza : null;
		const gc = intervalloCavallo(await cavalloPerIntervallo(cavallo_cliente_id, horse_id));
		if (gc) return {
			giorni: gc,
			daCavalloFisso: true,
			prima
		};
		const gs = clienteId ? intervalloStruttura(clienteId) : null;
		if (gs) return {
			giorni: gs,
			daStruttura: true,
			prima
		};
		return g >= 1 && g <= 60 ? {
			giorni: g,
			daCavallo: true,
			prima
		} : {
			giorni: base,
			prima
		};
	}
	async function cavalloPerIntervallo(cavallo_cliente_id, horse_id) {
		if (!cavallo_cliente_id && !horse_id) return null;
		if (DEMO_MODE) return (demoState.cavalliClientiMascalcia || []).find((c) => cavallo_cliente_id && c.id === cavallo_cliente_id || horse_id && c.horse_id === horse_id) || null;
		try {
			let q = sb.from("cavalli_clienti_mascalcia").select("id, horse_id, intervallo_giorni, prezzo_ferratura, ferratura_tipo").eq("maniscalco_id", currentUser.id);
			q = cavallo_cliente_id ? q.eq("id", cavallo_cliente_id) : q.eq("horse_id", horse_id);
			const { data, error } = await q.limit(1);
			return error ? null : (data || [])[0] || null;
		} catch (e) {
			return null;
		}
	}
	function intervalloPredefinito(tipo) {
		return Number(richiamiPredefiniti?.[tipo]) || TIPO_FERRATURA_INTERVALLI[tipo] || 35;
	}
	function dataRichiamoTesto(iso, giorni) {
		const [y, m, d] = aggiungiGiorniIso(iso, giorni).split("-").map(Number);
		return new Date(y, m - 1, d).toLocaleDateString("it-IT", {
			weekday: "long",
			day: "numeric",
			month: "long",
			year: "numeric"
		});
	}
	function chiediRichiamo({ tipo, tipo_altro, data_intervento, cavallo, giorni, daCavallo, daCavalloFisso, daStruttura, pagamento, importo, importi, prima, ferri }) {
		return new Promise((resolve) => {
			richiamoStato = {
				resolve,
				giorni,
				data_intervento,
				etichetta: [TIPO_INTERVENTO_LABEL_APP[tipo] || tipo_altro || "Intervento", cavallo].filter(Boolean).join(" · "),
				daCavallo,
				daCavalloFisso,
				daStruttura,
				pagamento,
				prima: prima && giorni != null ? prima : null,
				comePrima: false,
				ferri: ferri && vistaCompleta() ? {
					...ferri,
					n: ferri.q || 4
				} : null
			};
			const conRichiamo = giorni != null;
			document.getElementById("ric-tit").textContent = conRichiamo ? "Prossimo intervento" : "Intervento fatto";
			document.getElementById("ric-grande").style.display = conRichiamo ? "" : "none";
			document.getElementById("ric-btn-cambia").style.display = conRichiamo ? "" : "none";
			const conPag = pagamento !== void 0 && !incassiNascosti();
			document.getElementById("ric-pag").style.display = conPag ? "block" : "none";
			const righe = importi && importi.length ? importi : [{
				nome: cavallo || "Importo",
				importo
			}];
			richiamoStato.nImporti = righe.length;
			const fmt = (v) => v != null && v !== "" && !isNaN(Number(v)) ? String(Number(v)) : "";
			document.getElementById("ric-pag").classList.toggle("in-riga", righe.length === 1);
			if (conPag) document.getElementById("ric-pag").style.display = righe.length === 1 ? "flex" : "block";
			document.getElementById("ric-importi").innerHTML = righe.length === 1 ? `<label class="ric-euro"><span>€</span><input type="number" step="0.01" min="0" inputmode="decimal" class="ric-imp" data-i="0" value="${fmt(righe[0].importo)}" placeholder="0" oninput="richiamoTotale()" aria-label="Importo"></label>` : righe.map((r, i) => `<div class="ric-imp-riga"><span>${escapeHtml(r.nome || "Cavallo " + (i + 1))}</span><label class="ric-euro"><span>€</span><input type="number" step="0.01" min="0" inputmode="decimal" class="ric-imp" data-i="${i}" value="${fmt(r.importo)}" placeholder="0" oninput="richiamoTotale()"></label></div>`).join("") + "<div class=\"ric-imp-tot\"><span>Totale</span><span id=\"ric-imp-tot\"></span></div>";
			const rf = richiamoStato.ferri;
			document.getElementById("ric-ferri").style.display = rf ? "block" : "none";
			if (rf) {
				document.getElementById("ric-ferri-chk").checked = rf.nuovi === true;
				document.getElementById("ric-ferri-su").textContent = `ferri nuovi (su ${rf.q}${rf.nome ? " di " + rf.nome : " per cavallo"})`;
				richiamoFerriRender();
			}
			richiamoTotale();
			document.getElementById("ric-pag-imp").textContent = "Pagamento";
			if (conPag) richiamoPagamento(pagamento === "saldato" ? "saldato" : "da_saldare");
			document.getElementById("ric-passo1").style.display = "block";
			document.getElementById("ric-passo2").style.display = "none";
			document.getElementById("ric-passo3").style.display = "none";
			if (conRichiamo) richiamoAggiornaTesti();
			else document.getElementById("ric-dettaglio").textContent = `${richiamoStato.etichetta} · ${formatDataBreve(data_intervento)}`;
			document.getElementById("eq-pop-richiamo").classList.add("attivo");
		});
	}
	function richiamoFerriRender() {
		const r = richiamoStato;
		if (!r || !r.ferri) return;
		const on = document.getElementById("ric-ferri-chk").checked;
		document.getElementById("ric-ferri-num").style.display = on ? "block" : "none";
		document.getElementById("ric-ferri-val").textContent = r.ferri.n;
	}
	function richiamoFerriN(d) {
		const r = richiamoStato;
		if (!r || !r.ferri) return;
		r.ferri.n = Math.max(1, Math.min(4, r.ferri.n + d));
		richiamoFerriRender();
	}
	var richiamoFerriScelti = null;
	function prendiFerriScelti() {
		const v = richiamoFerriScelti;
		richiamoFerriScelti = null;
		return v;
	}
	function richiamoTotale() {
		const r = richiamoStato;
		if (r && r.prima) {
			const inp = [...document.querySelectorAll("#ric-importi .ric-imp")];
			const zero = inp.length === 1 && inp[0].value !== "" && Number(inp[0].value) === 0;
			if (zero !== r.comePrima) {
				r.comePrima = zero;
				richiamoAggiornaTesti();
			}
		}
		const el = document.getElementById("ric-imp-tot");
		if (!el) return;
		const tot = [...document.querySelectorAll("#ric-importi .ric-imp")].reduce((t, x) => t + (Number(x.value) || 0), 0);
		el.textContent = formatEuro(tot);
	}
	var richiamoImportiScelti = null;
	function prendiImportiScelti() {
		const v = richiamoImportiScelti;
		richiamoImportiScelti = null;
		return v;
	}
	async function importiSuggeriti(e, cavalli) {
		let storico = [];
		try {
			if (DEMO_MODE) storico = (demoState.interventiMascalcia || []).filter((i) => i.cliente_mascalcia_id === e.cliente_mascalcia_id && i.tipo_ferratura === e.tipo_ferratura && i.importo != null && i.id !== e.id).sort((a, b) => b.data_intervento.localeCompare(a.data_intervento));
			else if (e.cliente_mascalcia_id || cavalli.some((c) => c.cavallo_cliente_id)) {
				let q = sb.from("interventi_mascalcia").select("id, cliente_mascalcia_id, cavallo_cliente_id, horse_id, importo, data_intervento").eq("maniscalco_id", currentUser.id).eq("tipo_ferratura", e.tipo_ferratura).not("importo", "is", null);
				const ids = cavalli.map((c) => c.cavallo_cliente_id).filter(Boolean);
				q = e.cliente_mascalcia_id && ids.length ? q.or(`cliente_mascalcia_id.eq.${e.cliente_mascalcia_id},cavallo_cliente_id.in.(${ids.join(",")})`) : e.cliente_mascalcia_id ? q.eq("cliente_mascalcia_id", e.cliente_mascalcia_id) : q.in("cavallo_cliente_id", ids);
				if (e.id) q = q.neq("id", e.id);
				const { data } = await q.order("data_intervento", { ascending: false }).limit(60);
				storico = data || [];
			}
		} catch (x) {
			storico = [];
		}
		const delCliente = storico.find((i) => i.cliente_mascalcia_id === e.cliente_mascalcia_id);
		const abituali = await Promise.all(cavalli.map((c) => c.importo != null && c.importo !== "" ? null : cavalloPerIntervallo(c.cavallo_cliente_id, c.horse_id).then((cv) => prezzoCavallo(cv, e.tipo_ferratura))));
		return cavalli.map((c, n) => {
			if (c.importo != null && c.importo !== "") return Number(c.importo);
			if (abituali[n] != null) return abituali[n];
			const v = (storico.find((i) => c.cavallo_cliente_id && i.cavallo_cliente_id === c.cavallo_cliente_id || c.horse_id && i.horse_id === c.horse_id) || delCliente || {}).importo;
			return v != null ? Number(v) : null;
		});
	}
	var TIPO_INTERVENTO_LABEL_APP = {
		ferratura: "Ferratura",
		mezza_ferratura: "Mezza ferratura",
		pareggio: "Pareggio"
	};
	function richiamoPagamento(v) {
		if (richiamoStato) richiamoStato.pagamento = v;
		document.querySelectorAll("#ric-pag .ric-pag-scelte button").forEach((b) => b.classList.toggle("on", b.dataset.p === v));
	}
	var richiamoPagamentoScelto = null;
	function prendiPagamentoScelto() {
		const v = richiamoPagamentoScelto;
		richiamoPagamentoScelto = null;
		return v;
	}
	function richiamoAggiornaTesti() {
		const r = richiamoStato;
		if (!r) return;
		const cp = document.getElementById("ric-come-prima");
		const gr = document.getElementById("ric-grande").firstChild;
		if (gr && gr.nodeType === 3) gr.textContent = r.comePrima && r.prima ? "La prossima data resta" : "Inserisco il prossimo intervento tra";
		if (r.comePrima && r.prima) {
			const [y, m, d] = r.prima.split("-").map(Number);
			document.getElementById("ric-giorni-txt").textContent = "Come prima";
			document.getElementById("ric-dettaglio").textContent = `${r.etichetta} · ${new Date(y, m - 1, d).toLocaleDateString("it-IT", {
				weekday: "long",
				day: "numeric",
				month: "long"
			})}`;
			cp.style.display = "block";
			cp.textContent = "Lavoro senza compenso: non è la ferratura del ciclo, la prossima data resta quella di prima. Per cambiarla tocca CAMBIA.";
			return;
		}
		if (cp) cp.style.display = "none";
		if (r.giorni == null) return;
		document.getElementById("ric-giorni-txt").textContent = r.giorni + (r.giorni === 1 ? " giorno" : " giorni");
		const quando = dataRichiamoTesto(r.data_intervento, r.giorni);
		document.getElementById("ric-dettaglio").textContent = `${r.etichetta} · ${quando}` + (r.daCavalloFisso ? " (intervallo del cavallo)" : r.daStruttura ? " (intervallo della struttura)" : r.daCavallo ? " (come l'ultima volta)" : "");
		document.getElementById("ric-dettaglio2").textContent = `Prossimo intervento: ${quando}`;
	}
	function richiamoCambia() {
		if (richiamoStato) richiamoStato.comePrima = false, richiamoStato.prima = null;
		const ruota = document.getElementById("ric-ruota");
		ruota.innerHTML = "<div class=\"pad\"></div>" + Array.from({ length: 60 }, (_, i) => `<div class="n" data-g="${i + 1}" onclick="richiamoVaiA(${i + 1})">${i + 1}</div>`).join("") + "<div class=\"pad\"></div>";
		document.getElementById("ric-passo1").style.display = "none";
		document.getElementById("ric-passo3").style.display = "none";
		document.getElementById("ric-passo2").style.display = "block";
		requestAnimationFrame(() => {
			ruota.scrollTop = (richiamoStato.giorni - 1) * 40;
			richiamoRuotaScroll();
		});
	}
	function richiamoVaiA(g) {
		document.getElementById("ric-ruota").scrollTo({
			top: (g - 1) * 40,
			behavior: "smooth"
		});
	}
	function richiamoRuotaScroll() {
		const ruota = document.getElementById("ric-ruota");
		const g = Math.min(60, Math.max(1, Math.round(ruota.scrollTop / 40) + 1));
		if (richiamoStato) richiamoStato.giorni = g;
		ruota.querySelectorAll(".n").forEach((el) => el.classList.toggle("sel", Number(el.dataset.g) === g));
		richiamoAggiornaTesti();
	}
	var RICHIAMO_MIN_GIORNI = 10;
	function richiamoConferma(confermatoPoco) {
		const r = richiamoStato;
		if (!r) return;
		if (!confermatoPoco && !r.comePrima && r.giorni != null && r.giorni < RICHIAMO_MIN_GIORNI) {
			document.getElementById("ric-poco-txt").textContent = r.giorni + (r.giorni === 1 ? " giorno" : " giorni");
			document.getElementById("ric-poco-dett").textContent = `${r.etichetta} · ${dataRichiamoTesto(r.data_intervento, r.giorni)}. Di solito tra un intervento e l'altro passano almeno ${RICHIAMO_MIN_GIORNI} giorni: confermi?`;
			document.getElementById("ric-passo1").style.display = "none";
			document.getElementById("ric-passo2").style.display = "none";
			document.getElementById("ric-passo3").style.display = "block";
			return;
		}
		richiamoStato = null;
		richiamoPagamentoScelto = r.pagamento !== void 0 && !incassiNascosti() ? r.pagamento || null : null;
		richiamoImportiScelti = r.pagamento !== void 0 && !incassiNascosti() ? [...document.querySelectorAll("#ric-importi .ric-imp")].map((x) => x.value === "" || isNaN(Number(x.value)) ? null : Math.round(Number(x.value) * 100) / 100) : null;
		richiamoFerriScelti = r.ferri ? {
			nuovi: !!document.getElementById("ric-ferri-chk").checked,
			n: r.ferri.n
		} : null;
		richiamoComePrimaScelto = r.comePrima && r.prima ? r.prima : null;
		document.getElementById("eq-pop-richiamo").classList.remove("attivo");
		r.resolve(r.giorni);
	}
	var richiamoComePrimaScelto = null;
	async function richiamoPerFatto(e) {
		const s = await giorniRichiamoSuggeriti(e.tipo_ferratura, e.cavallo_cliente_id, e.horse_id, e.id, e.cliente_mascalcia_id);
		richiamoPagamentoScelto = null;
		richiamoImportiScelti = null;
		richiamoFerriScelti = null;
		richiamoComePrimaScelto = null;
		const conFerri = e.tipo_ferratura === "ferratura" || e.tipo_ferratura === "mezza_ferratura";
		const ferri = e.ferri !== void 0 ? e.ferri : conFerri ? {
			q: Number(e.quantita_ferri) || (e.tipo_ferratura === "mezza_ferratura" ? 2 : 4),
			nome: e.cavallo || agNomeCavalloSicuro(e) || null,
			nuovi: e.ferri_nuovi
		} : null;
		if (!s.giorni && incassiNascosti() && !(ferri && vistaCompleta())) return e.prossima_scadenza || null;
		const cavalli = e.cavalli && e.cavalli.length ? e.cavalli : [{
			nome: e.cavallo || agNomeCavalloSicuro(e),
			cavallo_cliente_id: e.cavallo_cliente_id,
			horse_id: e.horse_id,
			importo: e.importo
		}];
		const proposti = incassiNascosti() ? cavalli.map(() => null) : await importiSuggeriti(e, cavalli);
		const giorni = await chiediRichiamo({
			tipo: e.tipo_ferratura,
			tipo_altro: e.tipo_altro,
			data_intervento: e.data_intervento,
			cavallo: e.cavallo || agNomeCavalloSicuro(e),
			giorni: s.giorni || null,
			daCavallo: s.daCavallo,
			daCavalloFisso: s.daCavalloFisso,
			daStruttura: s.daStruttura,
			pagamento: e.stato_pagamento || "da_saldare",
			prima: s.prima,
			ferri,
			importi: cavalli.map((c, i) => ({
				nome: c.nome,
				importo: proposti[i]
			}))
		});
		const comePrima = richiamoComePrimaScelto;
		richiamoComePrimaScelto = null;
		if (comePrima) return comePrima;
		return giorni != null ? aggiungiGiorniIso(e.data_intervento, giorni) : e.prossima_scadenza || null;
	}
	function agNomeCavalloSicuro(e) {
		try {
			return typeof agNomeCavallo === "function" ? agNomeCavallo(e) : "";
		} catch (x) {
			return "";
		}
	}
	async function loadClientiMascalcia() {
		const [cli] = await Promise.all([DB.listClientiMascalcia(), caricaCavalliMiei()]);
		clientiMascalcia = cli;
		renderClientiList();
		caricaCartellaCavalli().then(() => renderClientiList()).catch(() => {});
		await renderProDeadlines();
	}
	function clientiAttivi() {
		return (clientiMascalcia || []).filter((c) => !c.archiviato_il);
	}
	// equo-app-src/src/ruoli/maniscalco/moduli/036-archivia-elimina-cliente.js
	var archiviaModo = "archivia";
	var archiviaCavalli = [];
	async function deleteCurrentCliente() {
		if (!currentClienteId) return;
		const c = clientiMascalcia.find((x) => x.id === currentClienteId);
		if (!c) return;
		if (c.archiviato_il) return ripristinaClienteCorrente();
		const [cav, inter] = await Promise.all([DB.listCavalliCliente(c.id), DB.listInterventiMascalcia(c.id)]);
		archiviaCavalli = cav.filter((x) => x.id && !x.presso);
		const nCav = cav.filter((x) => !x.presso).length;
		impostaDialogoArchivia(c, nCav === 0 && inter.length === 0 ? "elimina" : "archivia", cav.filter((x) => !x.presso), inter.length);
		closeModal("modal-edit-cliente");
		openModal("modal-archivia-cliente");
	}
	function impostaDialogoArchivia(c, modo, cavalli, nInterventi) {
		archiviaModo = modo;
		const nome = escapeHtml(c.nome || "il cliente");
		const err = document.getElementById("archivia-cliente-error");
		err.style.display = "none";
		document.getElementById("archivia-cliente-sposta").style.display = "none";
		const ok = document.getElementById("archivia-cliente-ok");
		ok.disabled = false;
		const altri = clientiAttivi().filter((x) => x.id !== c.id);
		document.getElementById("archivia-cliente-btn-sposta").style.display = modo === "archivia" && archiviaCavalli.length && altri.length ? "block" : "none";
		if (modo === "elimina") {
			document.getElementById("archivia-cliente-titolo").textContent = "Elimina cliente";
			document.getElementById("archivia-cliente-testo").innerHTML = `<strong>${nome}</strong> non ha cavalli né interventi: puoi eliminarlo definitivamente (ad esempio se l'hai creato per sbaglio).`;
			ok.textContent = "Elimina cliente";
			ok.className = "btn btn-danger";
			return;
		}
		const nomiCav = (cavalli || []).map((x) => escapeHtml(x.nome)).join(", ");
		const parti = [];
		if (nomiCav) parti.push(`${cavalli.length === 1 ? "il cavallo " : "i cavalli "}<strong>${nomiCav}</strong>`);
		if (nInterventi) parti.push(nInterventi === 1 ? "l'intervento registrato" : `i ${nInterventi} interventi registrati`);
		document.getElementById("archivia-cliente-titolo").textContent = "Archivia cliente";
		document.getElementById("archivia-cliente-testo").innerHTML = `${parti.length ? parti.join(" e ").replace(/^./, (x) => x.toUpperCase()) + (parti.length > 1 || (cavalli || []).length > 1 || nInterventi > 1 ? " restano" : " resta") + " nello storico: non si cancella niente." : "Lo storico resta: non si cancella niente."}<br><strong>${nome}</strong> sparisce dalla lista e dalle scadenze; lo ritrovi in fondo a Clienti in «Clienti archiviati» e puoi ripristinarlo.` + (archiviaCavalli.length && altri.length ? `<br><span class="muted">Se i cavalli ora li segui presso un altro cliente (es. la scuderia dove stanno), spostali prima.</span>` : "");
		ok.textContent = "Archivia cliente";
		ok.className = "btn btn-primary";
	}
	function mostraSpostaCavalli() {
		const c = clientiMascalcia.find((x) => x.id === currentClienteId);
		if (!c) return;
		document.getElementById("archivia-cliente-cavalli").innerHTML = archiviaCavalli.map((x) => `<label style="display:flex;align-items:center;gap:8px;font-size:13.5px"><input type="checkbox" value="${x.id}" checked> ${escapeHtml(x.nome)}${x.codice_equo ? ` <span class="muted" style="font-size:11.5px">${escapeHtml(x.codice_equo)}</span>` : ""}</label>`).join("");
		const alf = (a, b) => (a.nome || "").localeCompare(b.nome || "", "it", { sensitivity: "base" });
		const altri = clientiAttivi().filter((x) => x.id !== c.id).sort(alf);
		document.getElementById("archivia-cliente-dest").innerHTML = "<option value=\"\">Scegli dove spostarli…</option>" + altri.map((x) => `<option value="${x.id}">${escapeHtml(x.nome)}${isStruttura(x) ? " (scuderia)" : ""}</option>`).join("");
		document.getElementById("archivia-cliente-sposta").style.display = "block";
		document.getElementById("archivia-cliente-btn-sposta").style.display = "none";
	}
	async function spostaCavalliCliente(btn) {
		const err = document.getElementById("archivia-cliente-error");
		err.style.display = "none";
		const ids = [...document.querySelectorAll("#archivia-cliente-cavalli input:checked")].map((i) => i.value);
		const dest = document.getElementById("archivia-cliente-dest").value;
		if (!ids.length) {
			err.textContent = "Scegli almeno un cavallo.";
			err.style.display = "block";
			return;
		}
		if (!dest) {
			err.textContent = "Scegli il cliente in cui spostarli.";
			err.style.display = "block";
			return;
		}
		btn.disabled = true;
		const res = await DB.spostaCavalli(ids, dest);
		btn.disabled = false;
		if (!res || !res.ok) {
			err.textContent = res && res.errore || "Spostamento non riuscito. Riprova.";
			err.style.display = "block";
			return;
		}
		const nomeDest = clientiMascalcia.find((x) => x.id === dest)?.nome || "l'altro cliente";
		showToast(`${res.spostati === 1 ? "Cavallo spostato" : (res.spostati || ids.length) + " cavalli spostati"} in «${nomeDest}»`);
		await loadClientiMascalcia();
		await deleteCurrentCliente();
	}
	async function confermaArchiviaCliente(btn) {
		const id = currentClienteId;
		const c = clientiMascalcia.find((x) => x.id === id);
		if (!c) return;
		const err = document.getElementById("archivia-cliente-error");
		err.style.display = "none";
		btn.disabled = true;
		if (archiviaModo === "elimina") {
			const { error } = await DB.deleteClienteMascalcia(id);
			if (error) {
				btn.disabled = false;
				impostaDialogoArchivia(c, "archivia", [], 0);
				err.textContent = "Questo cliente ha dei messaggi in chat: non si può eliminare, ma puoi archiviarlo.";
				err.style.display = "block";
				return;
			}
			showToast("Cliente eliminato");
		} else {
			const { error } = await DB.archiviaClienteMascalcia(id, true);
			if (error) {
				btn.disabled = false;
				err.textContent = "Archiviazione non riuscita. Riprova.";
				err.style.display = "block";
				return;
			}
			showToast("Cliente archiviato: cavalli e storico restano");
		}
		closeModal("modal-archivia-cliente");
		closeClienteDetail();
		await loadClientiMascalcia();
	}
	async function ripristinaClienteCorrente() {
		const id = currentClienteId;
		if (!isPremium() && clientiAttivi().length >= LIMITE_CLIENTI_FREE) {
			mostraLimiteClienti();
			return;
		}
		const { error } = await DB.archiviaClienteMascalcia(id, false);
		if (error) {
			if (String(error.message || "").includes("LIMITE_CLIENTI_FREE")) mostraLimiteClienti();
			else showToast("Ripristino non riuscito. Riprova.");
			return;
		}
		closeModal("modal-edit-cliente");
		showToast("Cliente ripristinato");
		await loadClientiMascalcia();
		await openClienteDetail(id);
	}
	// equo-app-src/src/ruoli/maniscalco/moduli/074-abbinamento-cavalli-del-maniscalco-caval.js
	var abbinaPendenti = [];
	var abbinaOnDone = null;
	async function proponiAbbinamentoCavalli(clienteId, nomeManiscalco, onDone) {
		try {
			if (!horses || horses.length === 0) horses = await DB.listHorses();
			const pendenti = horses && horses.length ? await DB.listCavalliDaAbbinare(clienteId) : [];
			if (!pendenti.length) {
				if (onDone) onDone();
				return false;
			}
			abbinaPendenti = pendenti;
			abbinaOnDone = onDone || null;
			renderAbbinamentoCavalli(nomeManiscalco);
			openModal("modal-abbina-cavalli");
			return true;
		} catch (err) {
			console.error("proponiAbbinamentoCavalli:", err);
			if (onDone) onDone();
			return false;
		}
	}
	function renderAbbinamentoCavalli(nomeManiscalco) {
		const n = abbinaPendenti.length;
		document.getElementById("abbina-cavalli-error").style.display = "none";
		document.getElementById("abbina-cavalli-intro").textContent = `${nomeManiscalco} ha registrato ${n === 1 ? "questo cavallo" : "questi cavalli"}. Abbinali ai tuoi: gli interventi di mascalcia finiranno sul cavallo giusto.`;
		const opzioni = (sel) => ["<option value=\"\">— non abbinare —</option>"].concat(horses.map((h) => `<option value="${escapeHtml(h.id)}" ${h.id === sel ? "selected" : ""}>${escapeHtml(h.name || "Cavallo")}${h.microchip ? " · " + escapeHtml(h.microchip) : ""}</option>`)).join("");
		document.getElementById("abbina-cavalli-list").innerHTML = abbinaPendenti.map((cv, i) => {
			const badge = cv.match_tipo === "microchip" ? "<span class=\"badge badge-green\" style=\"font-size:10.5px\">stesso microchip</span>" : cv.match_tipo === "nome" ? "<span class=\"badge badge-accent\" style=\"font-size:10.5px\">stesso nome</span>" : "";
			return `
    <div style="padding:10px 2px;border-bottom:1px solid var(--border)">
      <label style="display:flex;align-items:center;gap:10px">
        <input type="checkbox" class="abbina-check" data-i="${i}" ${cv.match_tipo === "microchip" ? "checked" : ""} style="width:18px;height:18px;flex-shrink:0">
        <div style="flex:1;min-width:0">
          <div style="font-weight:600;font-size:14px">${escapeHtml(cv.nome || "Cavallo")} ${badge}</div>
          <div class="muted" style="font-size:12px">${cv.microchip ? "Microchip " + escapeHtml(cv.microchip) : "Senza microchip"}</div>
        </div>
      </label>
      <select class="input abbina-select" data-i="${i}" style="margin-top:8px" onchange="document.querySelector('.abbina-check[data-i=&quot;${i}&quot;]').checked = !!this.value">${opzioni(cv.proposto_horse_id)}</select>
    </div>`;
		}).join("");
	}
	async function confermaAbbinamentoCavalli() {
		const errBox = document.getElementById("abbina-cavalli-error");
		errBox.style.display = "none";
		const scelte = [];
		document.querySelectorAll(".abbina-check").forEach((chk) => {
			if (!chk.checked) return;
			const i = chk.dataset.i;
			const horseId = document.querySelector(`.abbina-select[data-i="${i}"]`).value;
			if (horseId) scelte.push({
				cv: abbinaPendenti[i],
				horseId
			});
		});
		const usati = scelte.map((x) => x.horseId);
		if (new Set(usati).size !== usati.length) {
			errBox.textContent = "Hai scelto lo stesso cavallo per due righe: correggi e riprova.";
			errBox.style.display = "block";
			return;
		}
		const btn = document.getElementById("abbina-cavalli-btn");
		btn.disabled = true;
		let ok = 0, falliti = 0;
		for (const x of scelte) {
			const { error } = await DB.abbinaCavalloManiscalco(x.cv.id, x.horseId);
			if (error) falliti++;
			else ok++;
		}
		btn.disabled = false;
		if (falliti > 0) showToast(`${falliti} abbinament${falliti === 1 ? "o non riuscito" : "i non riusciti"}, riprova da "Cavalli" nella chat.`);
		else if (ok > 0) showToast(ok === 1 ? "Cavallo abbinato." : `${ok} cavalli abbinati.`);
		chiudiAbbinamento();
	}
	function saltaAbbinamentoCavalli() {
		chiudiAbbinamento();
	}
	function chiudiAbbinamento() {
		closeModal("modal-abbina-cavalli");
		abbinaPendenti = [];
		const onDone = abbinaOnDone;
		abbinaOnDone = null;
		if (onDone) onDone();
	}
	async function apriAbbinamentoDaChat() {
		if (!currentFarrier) return;
		if (!await proponiAbbinamentoCavalli(currentFarrier.cliente_mascalcia_id, currentFarrier.nome || "Il tuo maniscalco", null)) showToast(horses && horses.length ? "Nessun cavallo da abbinare." : "Aggiungi prima i tuoi cavalli in Equo.");
	}
	async function openFarrierChatThread(clienteId, nome, certificato) {
		if (certificato === void 0) certificato = !!(await DB.listManiscalchiCollegati()).find((x) => x.cliente_mascalcia_id === clienteId)?.certificato;
		currentFarrier = {
			cliente_mascalcia_id: clienteId,
			nome,
			certificato
		};
		document.getElementById("fchat-nome").innerHTML = escapeHtml(nome || "Il tuo maniscalco") + (certificato ? "<br>" + BADGE_CERTIFIED_HTML : "");
		document.getElementById("fchat-input").value = "";
		document.getElementById("fchat-overlay").classList.add("active");
		await renderFarrierChatThread();
		avviaChatLive({
			chiave: "fchat:" + clienteId,
			tabella: "messaggi_mascalcia",
			colonna: "cliente_mascalcia_id",
			valore: clienteId,
			overlay: "fchat-overlay",
			aggiorna: () => currentFarrier ? renderFarrierChatThread() : null,
			segnaLetti: () => DB.segnaLettiDalManiscalco(clienteId)
		});
		await DB.segnaLettiDalManiscalco(clienteId);
		loadFarrierChatSection();
		refreshChatBadge();
	}
	function closeFarrierChatThread() {
		document.getElementById("fchat-overlay").classList.remove("active");
		fermaChatLive();
		currentFarrier = null;
	}
	async function renderFarrierChatThread() {
		if (!currentFarrier) return;
		const box = document.getElementById("fchat-messages");
		const chiaveThread = "fchat:" + currentFarrier.cliente_mascalcia_id;
		inizioThread(box, chiaveThread);
		const data = await DB.listThreadMascalcia(currentFarrier.cliente_mascalcia_id);
		if (!data || data.length === 0) {
			box.innerHTML = "<div class=\"muted\" style=\"font-size:13px;text-align:center;margin-top:20px\">Nessun messaggio ancora.<br>Scrivi al tuo maniscalco qui sotto.</div>";
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
			const out = m.mittente_tipo === "cliente";
			const body = m.tipo === "audio" ? `<div class="mchat-audio-bubble"><audio controls src="${escapeHtml(m.audio_url)}"></audio></div>` : m.tipo === "documento" || m.tipo === "foto" || m.tipo === "video" ? bollaAllegato(m.tipo, m.file_url, m.file_nome, m.testo) : `<div class="mchat-bubble-text">${escapeHtml(m.testo || "")}</div>`;
			html += `
      <div class="mchat-bubble ${out ? "out" : "in"}"${attrBolla(m, out, "messaggi_mascalcia")}>
        ${citazioneHtml(m)}${body}
        ${oraBolla(m, out)}
      </div>`;
		});
		applicaThread(box, chiaveThread, html);
	}
	async function sendFarrierChatMessage() {
		const input = document.getElementById("fchat-input");
		const testo = input.value.trim();
		if (!testo || !currentFarrier) return;
		input.value = "";
		input.focus();
		const bolla = bollaInAttesa("fchat-messages", testo);
		const { error } = await DB.inviaMessaggioAlManiscalco(currentFarrier.cliente_mascalcia_id, testo);
		if (error) {
			bollaNonInviata(bolla);
			showToast("Non inviato: " + error.message);
			return;
		}
		if (currentFarrier) await aggiornaChatLive(false);
		loadFarrierChatSection();
	}
	// equo-app-src/src/ruoli/maniscalco/moduli/076-scanner-qr-ripristinato-27-09.js
	var qrScanStream = null;
	var qrScanRAF = null;
	function openQrScanner() {
		if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
			showToast("Il tuo browser non supporta la fotocamera.");
			return;
		}
		openModal("modal-qr-scan");
		const video = document.getElementById("qr-scan-video");
		navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } }).then((stream) => {
			qrScanStream = stream;
			video.srcObject = stream;
			video.setAttribute("playsinline", true);
			video.play();
			qrRilevatore = null;
			try {
				if ("BarcodeDetector" in window) qrRilevatore = new BarcodeDetector({ formats: ["qr_code"] });
			} catch (e) {
				qrRilevatore = null;
			}
			qrScanRAF = requestAnimationFrame(scanQrLoop);
		}).catch(() => {
			showToast("Non riesco ad accedere alla fotocamera.");
			closeQrScanner();
		});
	}
	function closeQrScanner() {
		if (qrScanRAF) cancelAnimationFrame(qrScanRAF);
		qrScanRAF = null;
		if (qrScanStream) {
			qrScanStream.getTracks().forEach((t) => t.stop());
			qrScanStream = null;
		}
		closeModal("modal-qr-scan");
	}
	var qrRilevatore = null;
	var qrInLettura = false;
	function qrTrovato(testo) {
		if (!qrScanStream) return;
		closeQrScanner();
		gestisciCodiceScansionato(testo);
	}
	async function scanQrLoop() {
		const video = document.getElementById("qr-scan-video");
		const canvas = document.getElementById("qr-scan-canvas");
		if (!qrScanStream) return;
		if (!video || video.readyState !== video.HAVE_ENOUGH_DATA || qrInLettura) {
			qrScanRAF = requestAnimationFrame(scanQrLoop);
			return;
		}
		qrInLettura = true;
		try {
			if (qrRilevatore) try {
				const trovati = await qrRilevatore.detect(video);
				if (trovati && trovati[0] && trovati[0].rawValue) {
					qrTrovato(trovati[0].rawValue);
					return;
				}
			} catch (e) {
				qrRilevatore = null;
			}
			if (window.jsQR) {
				const lato = Math.max(video.videoWidth, video.videoHeight) || 1;
				const k = Math.min(1, 720 / lato);
				canvas.width = Math.round(video.videoWidth * k);
				canvas.height = Math.round(video.videoHeight * k);
				const ctx = canvas.getContext("2d", { willReadFrequently: true });
				ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
				const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
				const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "attemptBoth" });
				if (code && code.data) {
					qrTrovato(code.data);
					return;
				}
			}
		} finally {
			qrInLettura = false;
		}
		if (qrScanStream) qrScanRAF = requestAnimationFrame(scanQrLoop);
	}
	function gestisciCodiceScansionato(testo) {
		const codice = String(codiceEquoDaTesto(testo) || "").trim().toUpperCase();
		const tipo = tipoCodiceEquo(codice);
		if (tipo === "own") {
			closeModal("modal-collega-maniscalco");
			document.getElementById("new-chat-codice").value = codice;
			document.getElementById("new-chat-error").style.display = "none";
			openModal("modal-new-chat");
			startNewChat();
			return;
		}
		if (tipo === "tra" && typeof trCollOwner === "function") {
			closeModal("modal-new-chat");
			trCollOwner().then(() => {
				const k = document.getElementById("tri-k");
				if (k) k.value = codice;
			});
			return;
		}
		closeModal("modal-new-chat");
		document.getElementById("collega-maniscalco-codice").value = codice;
		document.getElementById("collega-maniscalco-error").style.display = "none";
		openModal("modal-collega-maniscalco");
		collegaManiscalco();
	}
	// equo-app-src/src/ruoli/maniscalco/moduli/104-cambia-proprietario.js
	var cpCtx = null;
	async function apriCambiaProprietario(daStruttura) {
		const cli = clienteDiId(currentClienteId);
		if (!cli) return;
		let cavalli;
		if (daStruttura) {
			await caricaCavalliMiei().catch(() => {});
			cavalli = (cavalliMieiLista || []).filter((c) => c.cliente_mascalcia_id === cli.id && !c.horse_id).sort((a, b) => (a.nome || "").localeCompare(b.nome || "", "it", { sensitivity: "base" }));
			if (!cavalli.length) {
				showToast("In questa struttura non ci sono cavalli da assegnare.");
				return;
			}
		} else {
			const cv = schedaCavalli.find((c) => c.key === schedaCavalloKey);
			if (!cv) return;
			if (cv.tipo !== "manuale" || cv.horse_id) {
				showToast("Questo cavallo è collegato al suo proprietario su Equo: il proprietario non si cambia da qui.");
				return;
			}
			if (!cv.id) {
				showToast("Salva prima il cavallo, poi cambia il proprietario.");
				return;
			}
			cavalli = [cv];
		}
		cpCtx = {
			daId: cli.id,
			daNome: cli.nome,
			struttura: isStruttura(cli),
			cavalli,
			sel: new Set(daStruttura ? [] : [cavalli[0].id]),
			multi: !!daStruttura,
			aperti: null
		};
		document.getElementById("cp-tit").textContent = daStruttura ? "Proprietari dei cavalli · " + cli.nome : "Cambia proprietario · " + (cavalli[0].nome || "cavallo");
		const alf = (a, b) => (a.nome || "").localeCompare(b.nome || "", "it", { sensitivity: "base" });
		const pr = clientiAttivi().filter((c) => c.id !== cli.id && !isStruttura(c)).sort(alf), sc = clientiAttivi().filter((c) => c.id !== cli.id && isStruttura(c)).sort(alf);
		document.getElementById("cp-dest").innerHTML = "<option value=\"\">Scegli il proprietario…</option><option value=\"__nuovo\">+ Nuovo proprietario</option>" + (pr.length ? `<optgroup label="Proprietari">${pr.map((c) => `<option value="${c.id}">${escapeHtml(c.nome)}</option>`).join("")}</optgroup>` : "") + (sc.length ? `<optgroup label="Altre scuderie">${sc.map((c) => `<option value="${c.id}">${escapeHtml(c.nome)}</option>`).join("")}</optgroup>` : "");
		document.getElementById("cp-nuovo").hidden = true;
		document.getElementById("cp-nuovo-nome").value = "";
		document.getElementById("cp-nuovo-tel").value = "";
		document.getElementById("cp-errore").style.display = "none";
		document.getElementById("cp-nota").textContent = cpCtx.struttura ? `${daStruttura ? "I cavalli scelti restano" : "Il cavallo resta"} in «${cli.nome}» (lo trovi in «Qui stanno»): cambia solo chi paga. Gli appuntamenti futuri passano al nuovo proprietario.` : "Cambia solo chi paga: gli appuntamenti futuri passano al nuovo proprietario.";
		cpRenderCavalli();
		openModal("modal-cambia-proprietario");
		await cpContaAperti();
	}
	function cpRenderCavalli() {
		const c = cpCtx;
		if (!c) return;
		const box = document.getElementById("cp-cavalli");
		box.hidden = !c.multi;
		if (c.multi) box.innerHTML = `<div class="cp-sez">Quali cavalli? <span class="muted">(${c.sel.size} scelti)</span></div>` + c.cavalli.map((cv) => `<label class="cp-cav">
      <input type="checkbox" ${c.sel.has(cv.id) ? "checked" : ""} onchange="cpScegliCavallo('${cv.id}', this.checked)"><b>${escapeHtml(cv.nome || "Cavallo")}</b>
      ${cv.codice_equo ? `<small>${escapeHtml(cv.codice_equo)}</small>` : ""}</label>`).join("");
	}
	function cpScegliCavallo(id, on) {
		if (!cpCtx) return;
		on ? cpCtx.sel.add(id) : cpCtx.sel.delete(id);
		const t = document.querySelector("#cp-cavalli .cp-sez .muted");
		if (t) t.textContent = `(${cpCtx.sel.size} scelti)`;
		clearTimeout(cpCtx.timer);
		cpCtx.timer = setTimeout(cpContaAperti, 300);
	}
	function cpDestCambiata(sel) {
		document.getElementById("cp-nuovo").hidden = sel.value !== "__nuovo";
		if (sel.value === "__nuovo") document.getElementById("cp-nuovo-nome").focus();
	}
	async function cpContaAperti() {
		const c = cpCtx;
		if (!c) return;
		const ids = [...c.sel];
		const box = document.getElementById("cp-aperti");
		if (!ids.length || incassiNascosti()) {
			c.aperti = null;
			box.hidden = true;
			return;
		}
		const lav = await DB.lavoriApertiCavalli(ids, c.daId);
		if (cpCtx !== c) return;
		c.aperti = lav;
		if (!lav.length) {
			box.hidden = true;
			return;
		}
		const tot = lav.reduce((s, i) => s + (Number(i.importo) || 0), 0);
		box.hidden = false;
		box.innerHTML = `<div class="cp-sez">${lav.length === 1 ? "C'è 1 lavoro già fatto" : "Ci sono " + lav.length + " lavori già fatti"} e da saldare (${escapeHtml(contoEuro(tot))}). Chi li paga?</div>
    <label class="cp-opz"><input type="radio" name="cp-aperti" value="si" checked> Il nuovo proprietario</label>
    <label class="cp-opz"><input type="radio" name="cp-aperti" value="no"> Restano a «${escapeHtml(c.daNome)}»</label>
    <div class="muted" style="font-size:12px;margin-top:4px">I lavori già saldati restano sempre a «${escapeHtml(c.daNome)}».</div>`;
	}
	async function confermaCambiaProprietario(btn) {
		const c = cpCtx;
		if (!c) return;
		const err = document.getElementById("cp-errore");
		const errore = (t) => {
			err.textContent = t;
			err.style.display = "block";
		};
		err.style.display = "none";
		const ids = [...c.sel];
		if (!ids.length) return errore("Scegli almeno un cavallo.");
		let dest = document.getElementById("cp-dest").value;
		if (!dest) return errore("Scegli il proprietario (oppure «+ Nuovo proprietario»).");
		const aperti = !!(c.aperti && c.aperti.length && document.querySelector("input[name=\"cp-aperti\"]:checked")?.value === "si");
		btn.disabled = true;
		try {
			if (dest === "__nuovo") {
				const nome = document.getElementById("cp-nuovo-nome").value.trim();
				if (!nome) return errore("Scrivi il nome del nuovo proprietario.");
				const { data, error } = await DB.insertClienteMascalcia({
					nome,
					telefono: document.getElementById("cp-nuovo-tel").value.trim() || null,
					tipo_cliente: "proprietario"
				});
				if (error || !data) return errore(error?.message || "Proprietario non creato, riprova.");
				dest = data.id;
			}
			const res = await DB.cambiaProprietario(ids, dest, aperti);
			if (!res || !res.ok) return errore(res?.errore || "Non riuscito, riprova.");
			closeModal("modal-cambia-proprietario");
			await loadClientiMascalcia();
			await caricaCavalliMiei().catch(() => {});
			const nomeDest = clienteDiId(dest)?.nome || "nuovo proprietario";
			showToast(`${res.spostati === 1 ? "1 cavallo" : res.spostati + " cavalli"} intestati a «${nomeDest}»` + (res.lavori ? ` · ${res.lavori === 1 ? "1 lavoro da saldare passato" : res.lavori + " lavori da saldare passati"}` : ""));
			cpCtx = null;
			await openClienteDetail(c.daId);
		} finally {
			btn.disabled = false;
		}
	}
	// equo-app-src/src/ruoli/maniscalco/moduli/109-equo-cv-pass.js
	var ECV_SPEC = {
		maniscalco: [
			"Ferratura correttiva",
			"Ferratura ortopedica",
			"Pareggio naturale",
			"Ferri incollati",
			"Puledri",
			"Cavalli sportivi",
			"Eventi e gare",
			"Trotto",
			"Galoppo",
			"Western",
			"Endurance",
			"Ferri in alluminio"
		],
		veterinario: [
			"Medicina sportiva",
			"Ortopedia",
			"Chirurgia",
			"Riproduzione",
			"Odontoiatria",
			"Diagnostica per immagini",
			"Medicina interna",
			"Fisioterapia",
			"Agopuntura"
		],
		istruttore: [
			"Salto ostacoli",
			"Dressage",
			"Completo",
			"Monta western",
			"Endurance",
			"Volteggio",
			"Doma",
			"Bambini e principianti",
			"Preparazione gare"
		]
	};
	var ECV_LINGUE = [
		"Italiano",
		"Inglese",
		"Francese",
		"Spagnolo",
		"Tedesco",
		"Portoghese"
	];
	var ECV_MODELLI = {
		classico: [
			29,
			42,
			58
		],
		moderno: [
			22,
			53,
			43
		],
		elegante: [
			43,
			31,
			8
		]
	};
	var ECV_NOME_MODELLI = {
		classico: "Classico",
		moderno: "Moderno",
		elegante: "Elegante"
	};
	var ecv = null;
	var ecvVista = "scelta";
	var ecvTimer = null;
	var ecvGirato = false;
	var ecvUrl = {};
	var e_ = (s) => escapeHtml(s == null ? "" : String(s));
	var ecvCorta = (s) => {
		const t = String(s || "").replace(/^Ferratura /, "");
		return t.charAt(0).toUpperCase() + t.slice(1);
	};
	var ecvId = () => Math.random().toString(36).slice(2, 10);
	function ecvRuolo() {
		const r = currentUser?.vistaAttiva || currentUser?.ruolo;
		return ECV_SPEC[r] ? r : "maniscalco";
	}
	function ecvNome() {
		return currentUser?.fullName || currentUser?.full_name || currentUser?.datiPagamentoNome || "Il tuo nome";
	}
	function ecvIniziali() {
		return ecvNome().split(/\s+/).filter(Boolean).slice(0, 2).map((x) => x[0].toUpperCase()).join("");
	}
	function ecvCodice() {
		return currentUser?.codiceProfessionista || "";
	}
	function ecvLink() {
		return ecvCodice() ? "https://app.equohub.com/?invito=" + encodeURIComponent(ecvCodice()) : "https://app.equohub.com";
	}
	function ecvAvatar() {
		return currentUser?.avatarUrl || currentUser?.avatar_url || null;
	}
	function ecvBase() {
		return {
			titolo: "",
			presentazione: "",
			presentazione_en: "",
			contatti: {
				telefono: {
					v: "",
					m: true
				},
				email: {
					v: currentUser?.email || "",
					m: true
				},
				instagram: {
					v: "",
					m: true
				},
				sito: {
					v: "",
					m: true
				},
				indirizzo: {
					v: "",
					m: false
				}
			},
			zone: [],
			trasferte: false,
			mostra_zona: true,
			spec: [],
			formazione: [],
			esperienze: [],
			lingue: ["Italiano"],
			numeri: {
				cavalli: true,
				interventi: true,
				clienti: true,
				discipline: true
			},
			modello: "classico",
			lingua_pdf: "it"
		};
	}
	function ecvDati() {
		return ecv.dati;
	}
	function ecvCompleto() {
		const d = ecvDati();
		const voci = [
			d.titolo,
			d.presentazione,
			Object.values(d.contatti || {}).some((c) => c && c.v),
			(d.zone || []).length,
			(d.spec || []).length,
			(d.formazione || []).length,
			(d.esperienze || []).length,
			(d.lingue || []).length
		];
		return Math.round(voci.filter(Boolean).length / voci.length * 100);
	}
	async function ecvCarica() {
		if (DEMO_MODE) {
			if (!ecv) ecv = {
				dati: Object.assign(ecvBase(), {
					titolo: "Maniscalco · ferratura correttiva e sportiva",
					presentazione: "Seguo cavalli sportivi e da diporto. Lavoro con veterinari e istruttori per ferrature correttive e ortopediche.",
					zone: ["Roma"],
					spec: ["Ferratura correttiva", "Cavalli sportivi"],
					esperienze: [{
						id: "e1",
						titolo: "Concorso ippico nazionale",
						ruolo: "Servizio di mascalcia",
						luogo: "Roma",
						anno: "2022",
						foto: []
					}]
				}),
				slug: "demo-maniscalco",
				pubblica: false,
				premium: false,
				verifiche: /* @__PURE__ */ new Set(),
				numeri: {
					cavalli: 24,
					interventi: 180,
					clienti: 9,
					dal: 2026,
					discipline: ["Salto ostacoli"]
				},
				referenze: [{
					id: "r1",
					autore: "Marco R.",
					tipo: "proprietario",
					testo: "Preciso e puntuale.",
					stato: "da_approvare"
				}]
			};
			return true;
		}
		const { data, error } = await sb.rpc("equo_mio_cv");
		if (error || !data) {
			showToast(/equo_mio_cv/.test(error?.message || "") ? "Funzione non ancora attiva: serve l'aggiornamento del database." : "Non riesco a caricare il CV, riprova.");
			return false;
		}
		const base = ecvBase(), d = data.dati || {};
		ecv = {
			dati: Object.assign(base, d, {
				contatti: Object.assign(base.contatti, d.contatti || {}),
				numeri: Object.assign(base.numeri, d.numeri || {})
			}),
			slug: data.slug,
			pubblica: !!data.pubblica,
			premium: !!data.premium,
			verifiche: new Set(data.verifiche || []),
			numeri: data.numeri || {},
			referenze: data.referenze || [],
			aggiornato_il: data.aggiornato_il
		};
		const paths = [...(ecv.dati.esperienze || []).flatMap((x) => x.foto || []), ...(ecv.dati.formazione || []).map((x) => x.file).filter(Boolean)];
		if (paths.length) try {
			((await sb.storage.from("pro-cv").createSignedUrls(paths, 3600)).data || []).forEach((x) => {
				if (x.signedUrl) ecvUrl[x.path] = x.signedUrl;
			});
		} catch (e) {}
		return true;
	}
	function ecvSalva(subito) {
		clearTimeout(ecvTimer);
		const st = document.getElementById("ecv-salvato");
		if (st) st.textContent = "Salvataggio…";
		const fai = async () => {
			if (DEMO_MODE) {
				if (st) st.textContent = "Salvato ✓";
				return;
			}
			const { error } = await sb.from("pro_cv").update({ dati: ecv.dati }).eq("user_id", currentUser.id);
			if (st) st.textContent = error ? "Non salvato: riprova" : "Salvato ✓";
			if (!error) ecv.aggiornato_il = (/* @__PURE__ */ new Date()).toISOString();
		};
		if (subito) return fai();
		ecvTimer = setTimeout(fai, 700);
	}
	function ecvCampo(chiave, valore) {
		const d = ecvDati(), parti = chiave.split(".");
		let o = d;
		parti.slice(0, -1).forEach((p) => {
			o[p] = o[p] || {};
			o = o[p];
		});
		o[parti[parti.length - 1]] = valore;
		ecvSalva();
		ecvAggiornaCompleto();
	}
	function ecvAggiornaCompleto() {
		const p = ecvCompleto();
		document.querySelectorAll(".ecv-perc").forEach((el) => el.textContent = p + "%");
		document.querySelectorAll(".ecv-barra i").forEach((el) => el.style.width = p + "%");
	}
	async function apriCardPro(vista) {
		const box = document.getElementById("ecv");
		if (!box) return;
		box.classList.add("on");
		document.body.classList.add("ecv-aperta");
		document.getElementById("ecv-corpo").innerHTML = "<div class=\"ecv-attesa\"><div class=\"spinner\"></div></div>";
		if (!ecv && !await ecvCarica()) {
			chiudiCardPro();
			return;
		}
		if (!ecvCodice() && typeof DB !== "undefined" && DB.ensureCodiceProfessionista) try {
			await DB.ensureCodiceProfessionista();
		} catch (e) {}
		ecvMostra(vista || "scelta");
	}
	function chiudiCardPro() {
		document.getElementById("ecv")?.classList.remove("on");
		document.body.classList.remove("ecv-aperta");
		ecvGirato = false;
	}
	function ecvMostra(v) {
		ecvVista = v;
		const tit = {
			scelta: "Card",
			pass: "Equo Pass",
			cv: "Equo CV"
		}[v];
		document.getElementById("ecv-tit").textContent = tit;
		document.getElementById("ecv-indietro").style.visibility = v === "scelta" ? "hidden" : "visible";
		const c = document.getElementById("ecv-corpo");
		c.innerHTML = v === "pass" ? ecvHtmlPass() : v === "cv" ? ecvHtmlCv() : ecvHtmlScelta();
		c.scrollTop = 0;
		document.getElementById("ecv").scrollTop = 0;
	}
	function ecvIndietro() {
		ecvMostra("scelta");
	}
	function ecvHtmlScelta() {
		return `<div class="ecv-sotto">Il tuo biglietto da visita su Equo. Il Pass prende i dati dal CV: aggiorni il CV e il Pass si aggiorna da solo.</div>
  <div class="ecv-tessere">
    <button type="button" class="ecv-tessera" onclick="ecvMostra('pass')"><span class="ecv-ico">🪪</span><span><b>Equo Pass</b><small>Il tuo badge con foto, ruolo e QR. Mostralo o condividilo.</small></span><span class="ecv-fr">›</span></button>
    <button type="button" class="ecv-tessera" onclick="ecvMostra('cv')"><span class="ecv-ico">📄</span><span><b>Equo CV</b><small>Il tuo curriculum: specializzazioni, formazione, eventi, numeri Equo. Completo al <span class="ecv-perc">${ecvCompleto()}%</span>.</small></span><span class="ecv-fr">›</span></button>
    <button type="button" class="ecv-tessera" onclick="ecvMostra('cv');setTimeout(()=>{const s=document.getElementById('ecv-sez-pubblica');if(s){s.open=true;s.scrollIntoView({behavior:'smooth'});}},80)"><span class="ecv-ico ecv-ico-p">🌐</span><span><b>Pagina pubblica <span class="ecv-badge p">PREMIUM</span></b><small>${ecv.pubblica ? "Online: " : ""}app.equohub.com/pro/${e_(ecv.slug || "")}</small></span><span class="ecv-fr">›</span></button>
  </div>`;
	}
	function ecvZonaTesto() {
		const d = ecvDati();
		if (!d.mostra_zona) return "Italia";
		return ((d.zone || []).slice(0, 2).join(" · ") || "Italia") + (d.trasferte ? " · trasferte" : "");
	}
	function ecvNumeriVisibili() {
		const d = ecvDati(), n = ecv.numeri || {}, out = [];
		if (d.numeri.cavalli && n.cavalli) out.push([Number(n.cavalli).toLocaleString("it-IT"), "cavalli seguiti"]);
		if (d.numeri.interventi && n.interventi) out.push([Number(n.interventi).toLocaleString("it-IT"), "interventi registrati"]);
		if (d.numeri.clienti && n.clienti) out.push([Number(n.clienti).toLocaleString("it-IT"), "scuderie e clienti"]);
		if (n.dal) out.push([String(n.dal), "su Equo dal"]);
		return out.slice(0, 4);
	}
	function ecvQrSvg(testo) {
		if (typeof QRCode !== "function") return "";
		const d = document.createElement("div");
		new QRCode(d, {
			text: testo,
			width: 120,
			height: 120
		});
		return d.querySelector("svg")?.outerHTML || "";
	}
	function ecvHtmlPass() {
		const d = ecvDati(), av = ecvAvatar(), cert = currentUser?.certificazioneStato === "verificato";
		const esp = (d.esperienze || []).slice(0, 2), num = ecvNumeriVisibili();
		return `<div class="ecv-sotto" style="text-align:center">Tocca il Pass per girarlo.</div>
  <div class="ecv-pass-zona"><div class="ecv-pass${ecvGirato ? " girato" : ""}" id="ecv-pass" onclick="ecvGiraPass()">
    <div class="ecv-lato">
      <div class="ecv-foro"></div>
      <div class="ecv-band"><div class="ecv-logo"><img src="assets/equo-card-cavallo.png" alt=""><div><b>Equo</b><span>PASS</span></div></div><div class="ecv-anno">${(/* @__PURE__ */ new Date()).getFullYear()}</div></div>
      <div class="ecv-pcorpo">
        <div class="ecv-foto"${av ? ` style="background-image:url('${e_(av)}')"` : ""}>${av ? "" : e_(ecvIniziali())}</div>
        <div class="ecv-pdati">
          <div class="ecv-ruolo">${e_(etichettaPro().toUpperCase())}</div>
          <div class="ecv-nome">${e_(ecvNome())}</div>
          <div class="ecv-zona">${e_(ecvZonaTesto())}</div>
          ${cert ? "<div class=\"ecv-cert\"><i>✓</i>EQUO CERTIFIED</div>" : ""}
        </div>
      </div>
      <div class="ecv-spec">${(d.spec || []).slice(0, 4).map((s) => `<span>${e_(ecvCorta(s))}</span>`).join("")}</div>
      <div class="ecv-piede"><div class="ecv-cod">${e_(ecvCodice())}<small>Inquadra per collegarti su Equo</small></div><div class="ecv-qr">${ecvQrSvg(ecvLink())}</div></div>
    </div>
    <div class="ecv-lato ecv-retro">
      <div class="ecv-foro"></div>
      ${num.length ? `<div class="ecv-rtit">NUMERI EQUO · VERIFICATI</div><div class="ecv-numeri">${num.map(([v, t]) => `<div><b>${e_(v)}</b><small>${e_(t)}</small></div>`).join("")}</div>` : ""}
      <div class="ecv-rtit">ESPERIENZA</div>
      <div class="ecv-rlista">${esp.map((x) => `<div><b>${e_(x.titolo)}</b><span>${e_([x.luogo, x.anno].filter(Boolean).join(" "))}</span></div>`).join("") || "<div><span>Aggiungi esperienze ed eventi nel CV</span></div>"}
        ${(d.lingue || []).length ? `<div><b>Lingue</b><span>${e_(d.lingue.join(" · "))}</span></div>` : ""}
        ${(ecv.numeri?.discipline || []).length && d.numeri.discipline ? `<div><b>Discipline</b><span>${e_(ecv.numeri.discipline.join(" · "))}</span></div>` : ""}</div>
      <div class="ecv-verifica">Inquadra il QR sul fronte: apre Equo e ti collega a ${e_(ecvNome().split(" ")[0])}.</div>
    </div>
  </div></div>
  <div class="ecv-azioni"><button type="button" class="princ" onclick="ecvPdfPass()">Scarica PDF</button><button type="button" onclick="ecvPdfPass(true)">Condividi</button></div>
  <div class="ecv-azioni"><button type="button" disabled>Aggiungi al Wallet · presto</button><button type="button" onclick="ecvMostra('cv')">Modifica dati</button></div>
  <div class="ecv-nota">Il QR resta sempre lo stesso: anche un Pass stampato mesi fa porta al tuo profilo aggiornato.</div>`;
	}
	function ecvGiraPass() {
		ecvGirato = !ecvGirato;
		document.getElementById("ecv-pass")?.classList.toggle("girato", ecvGirato);
	}
	function ecvInt(chiave, on, extra) {
		return `<button type="button" class="ecv-int${on ? " on" : ""}" onclick="ecvInterruttore(this,'${chiave}')" aria-label="Mostra o nascondi"${extra || ""}></button>`;
	}
	function ecvInterruttore(el, chiave) {
		el.classList.toggle("on");
		ecvCampo(chiave, el.classList.contains("on"));
		if (ecvVista === "pass") ecvMostra("pass");
	}
	function ecvChips(lista, scelte, fn) {
		return `<div class="ecv-chips">${lista.map((v) => `<button type="button" class="${scelte.includes(v) ? "on" : ""}" onclick="${fn}(this)">${e_(v)}</button>`).join("")}</div>`;
	}
	function ecvToggleLista(chiave, el) {
		const d = ecvDati(), v = el.textContent, arr = d[chiave] = d[chiave] || [];
		const i = arr.indexOf(v);
		if (i >= 0) arr.splice(i, 1);
		else arr.push(v);
		el.classList.toggle("on", i < 0);
		ecvSalva();
		ecvAggiornaCompleto();
	}
	function ecvSpec(el) {
		ecvToggleLista("spec", el);
	}
	function ecvLingua(el) {
		ecvToggleLista("lingue", el);
	}
	function ecvAggiungiVoce(chiave, idInput) {
		const inp = document.getElementById(idInput), v = (inp.value || "").trim().slice(0, 50);
		if (!v) return;
		const arr = ecvDati()[chiave] = ecvDati()[chiave] || [];
		if (!arr.includes(v)) arr.push(v);
		inp.value = "";
		ecvSalva();
		ecvAggiornaCompleto();
		ecvRidisegnaSez(chiave);
	}
	function ecvTogliVoce(chiave, i) {
		ecvDati()[chiave].splice(i, 1);
		ecvSalva();
		ecvAggiornaCompleto();
		ecvRidisegnaSez(chiave);
	}
	function ecvRidisegnaSez(chiave) {
		const el = document.getElementById("ecv-lista-" + chiave);
		if (!el) return;
		el.innerHTML = ecvHtmlLista(chiave);
	}
	function ecvHtmlLista(chiave) {
		const d = ecvDati();
		if (chiave === "zone") return (d.zone || []).map((z, i) => `<span class="ecv-tag">${e_(z)}<button type="button" onclick="ecvTogliVoce('zone',${i})" aria-label="Togli">×</button></span>`).join("") || "<span class=\"ecv-muted\">Nessuna zona: sul Pass compare «Italia».</span>";
		if (chiave === "spec") {
			const pred = ECV_SPEC[ecvRuolo()], extra = (d.spec || []).filter((s) => !pred.includes(s));
			return ecvChips(pred.concat(extra), d.spec || [], "ecvSpec");
		}
		if (chiave === "formazione") return (d.formazione || []).map((x) => {
			const ver = ecv.verifiche.has(x.id);
			return `<div class="ecv-voce"><span class="ecv-mini v">🎓</span><span class="ecv-vtxt"><b>${e_(x.titolo)}</b><small>${e_([x.ente, x.anno].filter(Boolean).join(" · "))}${x.file ? " · attestato allegato" : ""}</small>
      <span class="ecv-badge ${ver ? "v" : x.file ? "a" : "g"}">${ver ? "VERIFICATO DA EQUO" : x.file ? "IN VERIFICA" : "ALLEGA L'ATTESTATO PER LA VERIFICA"}</span></span>
      <button type="button" class="ecv-x" onclick="ecvTogliElemento('formazione','${x.id}')" aria-label="Elimina">×</button></div>`;
		}).join("") || "<div class=\"ecv-muted\">Aggiungi diplomi, corsi e certificati.</div>";
		if (chiave === "esperienze") return (d.esperienze || []).map((x) => `<div class="ecv-voce"><span class="ecv-mini">${(x.foto || []).length && ecvUrl[x.foto[0]] ? `<img src="${e_(ecvUrl[x.foto[0]])}" alt="">` : "🏆"}</span><span class="ecv-vtxt"><b>${e_(x.titolo)}</b><small>${e_([
			x.ruolo,
			x.luogo,
			x.anno
		].filter(Boolean).join(" · "))}${(x.foto || []).length ? " · " + x.foto.length + " foto" : ""}</small></span>
      <button type="button" class="ecv-x" onclick="ecvTogliElemento('esperienze','${x.id}')" aria-label="Elimina">×</button></div>`).join("") || "<div class=\"ecv-muted\">Aggiungi gare, eventi, scuderie e collaborazioni.</div>";
		if (chiave === "referenze") return (ecv.referenze || []).map((r) => `<div class="ecv-voce"><span class="ecv-vtxt"><b>${e_(r.autore || "Cliente")}</b><small>${r.testo ? "«" + e_(r.testo) + "»" : "Richiesta inviata: in attesa che la scriva"}</small>
      <span class="ecv-badge ${r.stato === "pubblicata" ? "v" : r.stato === "da_approvare" ? "a" : "g"}">${r.stato === "pubblicata" ? "PUBBLICATA" : r.stato === "da_approvare" ? "NUOVA · DA APPROVARE" : r.stato === "nascosta" ? "NASCOSTA" : "RICHIESTA"}</span></span>
      ${r.testo ? `<button type="button" class="ecv-int${r.stato === "pubblicata" ? " on" : ""}" onclick="ecvReferenza(this,'${r.id}')" aria-label="Pubblica o nascondi" style="margin-left:auto"></button>` : ""}</div>`).join("") || "<div class=\"ecv-muted\">Nessuna referenza: chiedila a un cliente collegato su Equo.</div>";
		return "";
	}
	function ecvTogliElemento(chiave, id) {
		const arr = ecvDati()[chiave] || [];
		const i = arr.findIndex((x) => x.id === id);
		if (i < 0) return;
		if (!confirm("Eliminare questa voce dal CV?")) return;
		arr.splice(i, 1);
		ecvSalva();
		ecvAggiornaCompleto();
		ecvRidisegnaSez(chiave);
	}
	async function ecvCaricaFile(file) {
		if (DEMO_MODE) return null;
		if (file.size > 8388608) {
			showToast("File troppo grande (massimo 8 MB).");
			return null;
		}
		const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5) || "jpg";
		const path = `${currentUser.id}/${Date.now()}-${ecvId()}.${ext}`;
		const { error } = await sb.storage.from("pro-cv").upload(path, file, { contentType: file.type || void 0 });
		if (error) {
			showToast("Caricamento non riuscito: " + (error.message || ""));
			return null;
		}
		try {
			const r = await sb.storage.from("pro-cv").createSignedUrl(path, 3600);
			if (r.data?.signedUrl) ecvUrl[path] = r.data.signedUrl;
		} catch (e) {}
		return path;
	}
	async function ecvAggiungiFormazione(btn) {
		const t = document.getElementById("ecv-f-titolo").value.trim();
		if (!t) {
			showToast("Scrivi il nome del corso o del diploma.");
			return;
		}
		btn.disabled = true;
		try {
			const f = document.getElementById("ecv-f-file").files[0];
			const file = f ? await ecvCaricaFile(f) : null;
			(ecvDati().formazione = ecvDati().formazione || []).push({
				id: ecvId(),
				titolo: t.slice(0, 120),
				ente: document.getElementById("ecv-f-ente").value.trim().slice(0, 120),
				anno: document.getElementById("ecv-f-anno").value.trim().slice(0, 4),
				file
			});
			[
				"ecv-f-titolo",
				"ecv-f-ente",
				"ecv-f-anno",
				"ecv-f-file"
			].forEach((id) => document.getElementById(id).value = "");
			ecvSalva(true);
			ecvAggiornaCompleto();
			ecvRidisegnaSez("formazione");
		} finally {
			btn.disabled = false;
		}
	}
	async function ecvAggiungiEsperienza(btn) {
		const t = document.getElementById("ecv-e-titolo").value.trim();
		if (!t) {
			showToast("Scrivi il nome dell'evento o dell'esperienza.");
			return;
		}
		btn.disabled = true;
		try {
			const files = [...document.getElementById("ecv-e-foto").files].slice(0, 3), foto = [];
			for (const f of files) {
				const p = await ecvCaricaFile(f);
				if (p) foto.push(p);
			}
			(ecvDati().esperienze = ecvDati().esperienze || []).unshift({
				id: ecvId(),
				titolo: t.slice(0, 120),
				ruolo: document.getElementById("ecv-e-ruolo").value.trim().slice(0, 120),
				luogo: document.getElementById("ecv-e-luogo").value.trim().slice(0, 80),
				anno: document.getElementById("ecv-e-anno").value.trim().slice(0, 15),
				foto
			});
			[
				"ecv-e-titolo",
				"ecv-e-ruolo",
				"ecv-e-luogo",
				"ecv-e-anno",
				"ecv-e-foto"
			].forEach((id) => document.getElementById(id).value = "");
			ecvSalva(true);
			ecvAggiornaCompleto();
			ecvRidisegnaSez("esperienze");
		} finally {
			btn.disabled = false;
		}
	}
	async function ecvReferenza(el, id) {
		const stato = !el.classList.contains("on") ? "pubblicata" : "nascosta";
		const r = (ecv.referenze || []).find((x) => x.id === id);
		if (DEMO_MODE) {
			if (r) r.stato = stato;
			ecvRidisegnaSez("referenze");
			return;
		}
		const { data, error } = await sb.rpc("equo_referenza_stato", {
			p_id: id,
			p_stato: stato
		});
		if (error || !data?.ok) {
			showToast("Operazione non riuscita, riprova.");
			return;
		}
		if (r) r.stato = stato;
		ecvRidisegnaSez("referenze");
	}
	async function ecvChiediReferenza() {
		const sel = document.getElementById("ecv-ref-cliente");
		if (!sel || !sel.value) {
			showToast("Scegli un cliente collegato su Equo.");
			return;
		}
		if (DEMO_MODE) {
			showToast("In demo la richiesta non parte.");
			return;
		}
		const { data, error } = await sb.rpc("equo_chiedi_referenza", { p_cliente: sel.value });
		if (error || !data?.ok) {
			showToast(data?.motivo === "non_collegato" ? "Il cliente non è ancora collegato su Equo." : "Richiesta non inviata, riprova.");
			return;
		}
		showToast("Richiesta inviata: il cliente la trova nella sua Home e in chat.");
		await ecvCarica();
		ecvRidisegnaSez("referenze");
	}
	async function ecvHammer(azione, btn) {
		const d = ecvDati();
		if (DEMO_MODE) {
			showToast("In demo Hammer non scrive.");
			return;
		}
		const testoBtn = btn.textContent;
		btn.disabled = true;
		btn.textContent = "✨ Hammer sta scrivendo…";
		try {
			const tk = (await sb.auth.getSession()).data.session?.access_token || "";
			const r = await fetch("/.netlify/functions/cv-scrivi", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: "Bearer " + tk
				},
				body: JSON.stringify({
					azione,
					dati: {
						ruolo: etichettaPro(),
						titolo: d.titolo,
						presentazione: d.presentazione,
						spec: d.spec,
						zone: d.zone,
						trasferte: d.trasferte,
						lingue: d.lingue,
						esperienze: (d.esperienze || []).map((x) => ({
							t: x.titolo,
							r: x.ruolo,
							l: x.luogo,
							a: x.anno
						})),
						formazione: (d.formazione || []).map((x) => ({
							t: x.titolo,
							e: x.ente,
							a: x.anno
						})),
						numeri: ecv.numeri
					}
				})
			});
			const j = await r.json().catch(() => ({}));
			if (!r.ok || !j.testo) {
				showToast(j.error || "Hammer non ha risposto, riprova.");
				return;
			}
			ecvCampo(azione === "traduci" ? "presentazione_en" : "presentazione", j.testo);
			const ta = document.getElementById(azione === "traduci" ? "ecv-pres-en" : "ecv-pres");
			if (ta) {
				ta.value = j.testo;
				ta.closest(".ecv-campo").style.display = "";
			}
		} catch (e) {
			showToast("Hammer non è raggiungibile ora.");
		} finally {
			btn.disabled = false;
			btn.textContent = testoBtn;
		}
	}
	async function ecvPubblica(el) {
		if (!ecv.premium) {
			el.classList.remove("on");
			if (typeof apriUpgradePro === "function") apriUpgradePro();
			return;
		}
		const on = !el.classList.contains("on");
		if (DEMO_MODE) {
			ecv.pubblica = on;
			el.classList.toggle("on", on);
			return;
		}
		const { error } = await sb.from("pro_cv").update({ pubblica: on }).eq("user_id", currentUser.id);
		if (error) {
			showToast("Non salvato, riprova.");
			return;
		}
		ecv.pubblica = on;
		el.classList.toggle("on", on);
		showToast(on ? "Pagina pubblica online" : "Pagina pubblica nascosta");
	}
	async function ecvSlug() {
		const inp = document.getElementById("ecv-slug"), v = (inp.value || "").trim().toLowerCase();
		if (v === ecv.slug) return;
		if (DEMO_MODE) {
			ecv.slug = v;
			return;
		}
		const { data, error } = await sb.from("pro_cv").update({ slug: v || null }).eq("user_id", currentUser.id).select("slug").single();
		if (error) {
			showToast(/SLUG_USATO/.test(error.message || "") ? "Questo indirizzo è già usato: scegline un altro." : "Indirizzo non valido: usa lettere, numeri e trattini.");
			inp.value = ecv.slug;
			return;
		}
		ecv.slug = data.slug;
		inp.value = data.slug;
		showToast("Indirizzo salvato");
	}
	function ecvCopiaLink() {
		const l = "https://app.equohub.com/pro/" + ecv.slug;
		if (navigator.share) {
			navigator.share({ text: l }).catch(() => {});
			return;
		}
		try {
			navigator.clipboard.writeText(l);
			showToast("Link copiato");
		} catch (e) {
			showToast(l);
		}
	}
	function ecvHtmlCv() {
		const d = ecvDati(), c = d.contatti, n = ecv.numeri || {};
		const clientiCollegati = (typeof clientiMascalcia !== "undefined" ? clientiMascalcia : []).filter((x) => x.cliente_user_id && !x.archiviato_il);
		const cont = (k, label, ph) => `<div class="ecv-riga"><div class="ecv-campo" style="flex:1;margin:0"><label>${label}</label><input value="${e_(c[k]?.v || "")}" placeholder="${ph}" onchange="ecvCampo('contatti.${k}.v', this.value.trim())"></div>${ecvInt("contatti." + k + ".m", c[k]?.m !== false)}</div>`;
		const numRiga = (k, label, v) => `<div class="ecv-riga"><div>${label}<small>${e_(v)}</small></div>${ecvInt("numeri." + k, d.numeri[k] !== false)}</div>`;
		return `
  <div class="ecv-compl"><b class="ecv-perc">${ecvCompleto()}%</b><div class="ecv-barra"><i style="width:${ecvCompleto()}%"></i></div><small id="ecv-salvato">Salvato ✓</small></div>
  <div class="ecv-azioni" style="padding-top:0"><button type="button" class="princ" onclick="ecvPdfCv()">Scarica PDF</button><button type="button" onclick="ecvPdfCv(true)">Condividi</button><button type="button" onclick="ecvMostra('pass')">Vedi il Pass</button></div>

  <details class="ecv-sez" open><summary>👤 Profilo</summary><div class="ecv-dentro">
    <div class="ecv-campo"><label>Titolo (sotto il nome)</label><input value="${e_(d.titolo)}" maxlength="90" placeholder="es. ${e_(etichettaPro())} · ferratura correttiva e sportiva" onchange="ecvCampo('titolo', this.value.trim())"></div>
    <div class="ecv-campo"><label>Presentazione</label><textarea id="ecv-pres" maxlength="900" placeholder="Chi sei, come lavori, con chi collabori…" onchange="ecvCampo('presentazione', this.value.trim())">${e_(d.presentazione)}</textarea></div>
    <div class="ecv-campo"${d.presentazione_en ? "" : " style=\"display:none\""}><label>Presentazione in inglese</label><textarea id="ecv-pres-en" maxlength="1200" onchange="ecvCampo('presentazione_en', this.value.trim())">${e_(d.presentazione_en)}</textarea></div>
    <button type="button" class="ecv-hammer" onclick="ecvHammer('presentazione', this)">✨ Scrivi con Hammer</button><button type="button" class="ecv-hammer" onclick="ecvHammer('traduci', this)">🇬🇧 Versione in inglese</button>
    <div class="ecv-muted" style="margin-top:4px">Foto e nome vengono dal tuo profilo (menu profilo).</div>
  </div></details>

  <details class="ecv-sez"><summary>📇 Contatti</summary><div class="ecv-dentro">
    ${cont("telefono", "Telefono", "333 123 4567")}${cont("email", "Email", "nome@esempio.it")}${cont("instagram", "Instagram", "@nome")}${cont("sito", "Sito web", "www.esempio.it")}${cont("indirizzo", "Indirizzo o officina", "Comune (provincia)")}
    <div class="ecv-muted">L'interruttore decide se il contatto compare su Pass e CV. Sulla pagina pubblica telefono, email e indirizzo non compaiono mai: li vede chi si collega su Equo.</div>
  </div></details>

  <details class="ecv-sez"><summary>📍 Dove lavoro</summary><div class="ecv-dentro">
    <div class="ecv-campo"><label>Zone abituali (puoi metterne più di una)</label><div class="ecv-riga" style="border:0;padding:0"><input id="ecv-zona" placeholder="es. Roma, Frosinone…" maxlength="40" onkeydown="if(event.key==='Enter'){event.preventDefault();ecvAggiungiVoce('zone','ecv-zona')}"><button type="button" class="ecv-piccolo" onclick="ecvAggiungiVoce('zone','ecv-zona')">Aggiungi</button></div></div>
    <div id="ecv-lista-zone" class="ecv-tags">${ecvHtmlLista("zone")}</div>
    <div class="ecv-riga"><div>Disponibile per trasferte ed eventi<small>sul Pass: «trasferte»</small></div>${ecvInt("trasferte", !!d.trasferte)}</div>
    <div class="ecv-riga"><div>Mostra la zona su Pass e CV<small>se spento compare solo «Italia»</small></div>${ecvInt("mostra_zona", d.mostra_zona !== false)}</div>
  </div></details>

  <details class="ecv-sez"><summary>🔧 Specializzazioni</summary><div class="ecv-dentro">
    <div id="ecv-lista-spec">${ecvHtmlLista("spec")}</div>
    <div class="ecv-riga" style="border:0"><input id="ecv-spec-nuova" placeholder="Un'altra specializzazione" maxlength="50"><button type="button" class="ecv-piccolo" onclick="ecvAggiungiVoce('spec','ecv-spec-nuova')">Aggiungi</button></div>
  </div></details>

  <details class="ecv-sez"><summary>🎓 Formazione e certificazioni</summary><div class="ecv-dentro">
    <div id="ecv-lista-formazione">${ecvHtmlLista("formazione")}</div>
    <div class="ecv-nuovo"><input id="ecv-f-titolo" placeholder="Diploma, corso o certificato" maxlength="120"><div class="ecv-due"><input id="ecv-f-ente" placeholder="Scuola o ente" maxlength="120"><input id="ecv-f-anno" placeholder="Anno" inputmode="numeric" maxlength="4"></div>
      <label class="ecv-file">Attestato (PDF o foto, per la verifica di Equo)<input type="file" id="ecv-f-file" accept="application/pdf,image/*"></label>
      <button type="button" class="ecv-agg" onclick="ecvAggiungiFormazione(this)">+ Aggiungi corso o certificato</button></div>
  </div></details>

  <details class="ecv-sez"><summary>🏆 Esperienze, eventi e gare</summary><div class="ecv-dentro">
    <div id="ecv-lista-esperienze">${ecvHtmlLista("esperienze")}</div>
    <div class="ecv-nuovo"><input id="ecv-e-titolo" placeholder="Evento, gara o esperienza (es. FEI Jumping European Championship)" maxlength="120"><input id="ecv-e-ruolo" placeholder="Il tuo ruolo (es. Farrier ufficiale)" maxlength="120">
      <div class="ecv-due"><input id="ecv-e-luogo" placeholder="Luogo" maxlength="80"><input id="ecv-e-anno" placeholder="Anno (es. 2023 o 2018 — oggi)" maxlength="15"></div>
      <label class="ecv-file">Foto (fino a 3)<input type="file" id="ecv-e-foto" accept="image/*" multiple></label>
      <button type="button" class="ecv-agg" onclick="ecvAggiungiEsperienza(this)">+ Aggiungi esperienza o evento</button></div>
  </div></details>

  <details class="ecv-sez"><summary>🌍 Lingue</summary><div class="ecv-dentro">${ecvChips(ECV_LINGUE.concat((d.lingue || []).filter((l) => !ECV_LINGUE.includes(l))), d.lingue || [], "ecvLingua")}</div></details>

  <details class="ecv-sez"><summary>📊 Numeri Equo</summary><div class="ecv-dentro">
    ${numRiga("cavalli", "Cavalli seguiti", n.cavalli ?? 0)}${numRiga("interventi", "Interventi registrati", n.interventi ?? 0)}${numRiga("clienti", "Scuderie e clienti", n.clienti ?? 0)}${numRiga("discipline", "Discipline principali", (n.discipline || []).join(" · ") || "–")}
    <div class="ecv-muted">Non si scrivono a mano: vengono dal lavoro registrato in Equo. Scegli tu quali mostrare.</div>
  </div></details>

  <details class="ecv-sez"><summary>💬 Referenze</summary><div class="ecv-dentro">
    <div id="ecv-lista-referenze">${ecvHtmlLista("referenze")}</div>
    ${clientiCollegati.length ? `<div class="ecv-riga" style="border:0"><select id="ecv-ref-cliente"><option value="">Scegli un cliente collegato…</option>${clientiCollegati.map((x) => `<option value="${x.id}">${e_(x.nome)}</option>`).join("")}</select><button type="button" class="ecv-piccolo" onclick="ecvChiediReferenza()">Chiedi</button></div>` : "<div class=\"ecv-muted\">Le referenze si chiedono ai clienti collegati su Equo.</div>"}
    <div class="ecv-muted">Il cliente la scrive dalla sua Home; la pubblichi solo se vuoi.</div>
  </div></details>

  <details class="ecv-sez"><summary>🎨 Aspetto del PDF</summary><div class="ecv-dentro">
    <div class="ecv-modelli">${Object.keys(ECV_MODELLI).map((m) => `<button type="button" class="${(d.modello || "classico") === m ? "on" : ""}" onclick="ecvModello(this,'${m}')"><i style="background:linear-gradient(90deg,rgb(${ECV_MODELLI[m].join(",")}) 36%,#fff 36%)"></i>${ECV_NOME_MODELLI[m]}</button>`).join("")}</div>
    <div class="ecv-riga"><div>Lingua del PDF</div><select onchange="ecvCampo('lingua_pdf', this.value)"><option value="it"${d.lingua_pdf === "it" ? " selected" : ""}>Italiano</option><option value="en"${d.lingua_pdf === "en" ? " selected" : ""}>Inglese</option></select></div>
  </div></details>

  <details class="ecv-sez" id="ecv-sez-pubblica"><summary>🌐 Pagina pubblica <span class="ecv-badge p">PREMIUM</span></summary><div class="ecv-dentro">
    <div class="ecv-muted" style="margin-bottom:8px">Il tuo CV online: la vede chi inquadra il tuo QR senza avere Equo, con il pulsante «Collegati». Puoi metterla su Instagram o WhatsApp.</div>
    <div class="ecv-riga"><div>Pagina online<small>${ecv.premium ? "visibile a tutti" : "disponibile con Premium"}</small></div><button type="button" class="ecv-int${ecv.pubblica ? " on" : ""}" onclick="ecvPubblica(this)" aria-label="Pagina pubblica"></button></div>
    <div class="ecv-campo"><label>Indirizzo</label><div class="ecv-riga" style="border:0;padding:0"><span class="ecv-muted" style="white-space:nowrap">app.equohub.com/pro/</span><input id="ecv-slug" value="${e_(ecv.slug || "")}" maxlength="60" onchange="ecvSlug()"></div></div>
    <div class="ecv-azioni" style="padding:4px 0 0">${ecv.premium ? `<button type="button" onclick="ecvCopiaLink()">Condividi il link</button><button type="button" onclick="window.open('https://app.equohub.com/pro/'+encodeURIComponent('${e_(ecv.slug || "")}'),'_blank')">Apri</button>` : `<button type="button" class="princ ecv-prem" onclick="apriUpgradePro()">Passa a Premium</button>`}</div>
  </div></details>
  <div class="ecv-nota">Ultimo aggiornamento: ${ecv.aggiornato_il ? new Date(ecv.aggiornato_il).toLocaleDateString("it-IT", {
			day: "numeric",
			month: "long",
			year: "numeric"
		}) : "oggi"} · compare sul PDF</div>`;
	}
	function ecvModello(el, m) {
		document.querySelectorAll(".ecv-modelli button").forEach((b) => b.classList.remove("on"));
		el.classList.add("on");
		ecvCampo("modello", m);
	}
	async function ecvImmagine(url) {
		if (!url) return null;
		try {
			const b = await (await fetch(url, { mode: "cors" })).blob();
			return await new Promise((res) => {
				const r = new FileReader();
				r.onload = () => res(r.result);
				r.onerror = () => res(null);
				r.readAsDataURL(b);
			});
		} catch (e) {
			return null;
		}
	}
	function ecvFormato(dataUrl) {
		return /^data:image\/png/.test(dataUrl || "") ? "PNG" : "JPEG";
	}
	async function ecvCondividiPdf(doc, nome, condividi) {
		const blob = doc.output("blob");
		const file = new File([blob], nome, { type: "application/pdf" });
		if (condividi && navigator.canShare && navigator.canShare({ files: [file] })) try {
			await navigator.share({
				files: [file],
				title: nome
			});
			return;
		} catch (e) {
			if (e?.name === "AbortError") return;
		}
		const url = URL.createObjectURL(blob), a = document.createElement("a");
		a.href = url;
		a.download = nome;
		document.body.appendChild(a);
		a.click();
		a.remove();
		setTimeout(() => URL.revokeObjectURL(url), 3e4);
	}
	var ecvTesto = (s) => String(s || "").replace(/[^\x20-\x7E -ÿ€–—«»’‘“”…·]/g, "").trim();
	function ecvNomeFile(tipo) {
		return "Equo-" + tipo + "-" + ecvNome().replace(/[^A-Za-z0-9]+/g, "-") + ".pdf";
	}
	async function ecvPdfPass(condividi) {
		showToast("Creo il PDF del Pass…");
		try {
			const JsPDF = await caricaJsPdf();
			const W = 86, H = 135, doc = new JsPDF({
				unit: "mm",
				format: [W, H]
			});
			const d = ecvDati(), oro = [
				201,
				143,
				46
			], scuro = [
				43,
				31,
				8
			], grigio = [
				122,
				106,
				74
			];
			doc.setFillColor(251, 246, 234);
			doc.rect(0, 0, W, H, "F");
			doc.setFillColor(...scuro);
			doc.rect(0, 0, W, 30, "F");
			doc.triangle(0, 30, W, 30, W / 2, 38, "F");
			doc.setFillColor(...oro);
			doc.rect(0, 29.4, W, .6, "F");
			doc.setFillColor(210, 200, 175);
			doc.roundedRect(W / 2 - 7, 3, 14, 2.2, 1.1, 1.1, "F");
			const logo = await ecvImmagine("assets/equo-card-cavallo.png");
			if (logo) doc.addImage(logo, "PNG", 6, 9, 11, 11);
			doc.setTextColor(255, 255, 255);
			doc.setFont("helvetica", "bold");
			doc.setFontSize(13);
			doc.text("Equo", 19, 15);
			doc.setFont("helvetica", "normal");
			doc.setFontSize(6.5);
			doc.text("P A S S", 19, 19);
			doc.setFontSize(7);
			doc.text(String((/* @__PURE__ */ new Date()).getFullYear()), 79, 15, { align: "right" });
			const av = await ecvImmagine(ecvAvatar());
			doc.setFillColor(205, 192, 165);
			doc.roundedRect(6, 42, 27, 33, 3, 3, "F");
			if (av) try {
				doc.addImage(av, ecvFormato(av), 6, 42, 27, 33);
			} catch (e) {}
			else {
				doc.setTextColor(255, 255, 255);
				doc.setFont("helvetica", "bold");
				doc.setFontSize(18);
				doc.text(ecvIniziali(), 19.5, 61, { align: "center" });
			}
			let y = 42;
			doc.setFillColor(...oro);
			doc.rect(36, y, 44, 6, "F");
			doc.setTextColor(...scuro);
			doc.setFontSize(7.5);
			doc.setFont("helvetica", "bold");
			doc.text(ecvTesto(etichettaPro().toUpperCase()), 38, y + 4.2);
			y += 8;
			const nome = doc.splitTextToSize(ecvTesto(ecvNome().toUpperCase()), 40);
			doc.setFillColor(...scuro);
			doc.rect(36, y, 44, 4 + nome.length * 4.4, "F");
			doc.setTextColor(255, 255, 255);
			doc.setFontSize(9.5);
			doc.text(nome, 38, y + 5);
			y += 6 + nome.length * 4.4;
			doc.setFillColor(239, 228, 204);
			doc.rect(36, y, 44, 6, "F");
			doc.setTextColor(...scuro);
			doc.setFontSize(6.5);
			doc.setFont("helvetica", "normal");
			doc.text(ecvTesto(ecvZonaTesto()), 38, y + 4.1, { maxWidth: 40 });
			if (currentUser?.certificazioneStato === "verificato") {
				y += 9;
				doc.setTextColor(29, 122, 76);
				doc.setFont("helvetica", "bold");
				doc.setFontSize(6.8);
				doc.text("EQUO CERTIFIED", 38, y + 2);
			}
			let x = 6;
			y = 82;
			doc.setFontSize(6.3);
			doc.setFont("helvetica", "bold");
			(d.spec || []).slice(0, 4).forEach((s) => {
				const t = ecvTesto(ecvCorta(s));
				const w = doc.getTextWidth(t) + 4;
				if (x + w > 80) {
					x = 6;
					y += 6;
				}
				doc.setFillColor(...scuro);
				doc.roundedRect(x, y, w, 4.6, 1, 1, "F");
				doc.setTextColor(242, 217, 166);
				doc.text(t, x + 2, y + 3.2);
				x += w + 1.6;
			});
			disegnaQrPdf(doc, ecvLink(), 57, 105, 23);
			doc.setTextColor(...scuro);
			doc.setFont("courier", "bold");
			doc.setFontSize(8);
			doc.text(ecvTesto(ecvCodice()), 6, 124);
			doc.setFont("helvetica", "normal");
			doc.setFontSize(5.8);
			doc.setTextColor(...grigio);
			doc.text("Inquadra per collegarti su Equo", 6, 128);
			doc.addPage([W, H]);
			doc.setFillColor(251, 246, 234);
			doc.rect(0, 0, W, H, "F");
			let yr = 14;
			const num = ecvNumeriVisibili();
			if (num.length) {
				doc.setFont("helvetica", "bold");
				doc.setFontSize(6.5);
				doc.setTextColor(...grigio);
				doc.text("NUMERI EQUO · VERIFICATI", 6, yr);
				yr += 3;
				num.forEach(([v, t], i) => {
					const cx = 6 + i % 2 * 38, cy = yr + Math.floor(i / 2) * 15;
					doc.setFillColor(239, 228, 204);
					doc.roundedRect(cx, cy, 36, 13, 2, 2, "F");
					doc.setTextColor(...scuro);
					doc.setFontSize(12);
					doc.text(ecvTesto(v), cx + 3, cy + 6.5);
					doc.setFont("helvetica", "normal");
					doc.setFontSize(5.8);
					doc.setTextColor(...grigio);
					doc.text(ecvTesto(t), cx + 3, cy + 10.5);
					doc.setFont("helvetica", "bold");
				});
				yr += Math.ceil(num.length / 2) * 15 + 6;
			}
			doc.setFontSize(6.5);
			doc.setTextColor(...grigio);
			doc.text("ESPERIENZA", 6, yr);
			yr += 4;
			const righe = (d.esperienze || []).slice(0, 4).map((e) => [e.titolo, [e.luogo, e.anno].filter(Boolean).join(" ")]);
			if ((d.lingue || []).length) righe.push(["Lingue", d.lingue.join(" · ")]);
			righe.forEach(([a, b]) => {
				doc.setFont("helvetica", "bold");
				doc.setFontSize(7);
				doc.setTextColor(...scuro);
				doc.text(doc.splitTextToSize(ecvTesto(a), 44)[0] || "", 6, yr);
				doc.setFont("helvetica", "normal");
				doc.setTextColor(...grigio);
				doc.text(ecvTesto(b), 80, yr, { align: "right" });
				doc.setDrawColor(234, 223, 198);
				doc.line(6, yr + 1.8, 80, yr + 1.8);
				yr += 6;
			});
			doc.setFontSize(5.8);
			doc.setTextColor(...grigio);
			doc.text("Equo Pass · equohub.com", W / 2, 128, { align: "center" });
			await ecvCondividiPdf(doc, ecvNomeFile("Pass"), condividi);
		} catch (e) {
			console.error("ecvPdfPass:", e);
			showToast("Impossibile creare il PDF: " + (e?.message || e));
		}
	}
	async function ecvPdfCv(condividi) {
		showToast("Creo il PDF del CV…");
		try {
			const doc = new (await (caricaJsPdf()))({
				unit: "mm",
				format: "a4"
			}), d = ecvDati(), H = 297, SX = 70, col = ECV_MODELLI[d.modello] || ECV_MODELLI.classico, en = d.lingua_pdf === "en";
			const T = en ? {
				prof: "PROFILE",
				esp: "EXPERIENCE AND EVENTS",
				form: "EDUCATION AND CERTIFICATIONS",
				num: "EQUO NUMBERS",
				ref: "REFERENCES",
				cont: "CONTACTS",
				zona: "WHERE I WORK",
				spec: "SPECIALTIES",
				lingue: "LANGUAGES",
				qr: "Scan to connect on Equo",
				ver: "verified by Equo",
				agg: "Equo CV · updated on ",
				trasf: "Available for travel and events",
				nota: "Equo numbers are calculated from the work recorded in the app"
			} : {
				prof: "PROFILO",
				esp: "ESPERIENZE ED EVENTI",
				form: "FORMAZIONE E CERTIFICAZIONI",
				num: "NUMERI EQUO",
				ref: "REFERENZE",
				cont: "CONTATTI",
				zona: "DOVE LAVORO",
				spec: "SPECIALIZZAZIONI",
				lingue: "LINGUE",
				qr: "Inquadra e collegati su Equo",
				ver: "verificato da Equo",
				agg: "Equo CV · aggiornato il ",
				trasf: "Disponibile per trasferte ed eventi",
				nota: "I numeri Equo sono calcolati dal lavoro registrato in app"
			};
			doc.setFillColor(...col);
			doc.rect(0, 0, SX, H, "F");
			const av = await ecvImmagine(ecvAvatar());
			doc.setFillColor(205, 192, 165);
			doc.circle(SX / 2, 30, 17, "F");
			if (av) {
				try {
					doc.addImage(av, ecvFormato(av), SX / 2 - 17, 13, 34, 34);
				} catch (e) {}
				doc.setDrawColor(...col);
				doc.setLineWidth(4);
				doc.circle(SX / 2, 30, 19, "S");
				doc.setLineWidth(.2);
			} else {
				doc.setTextColor(255, 255, 255);
				doc.setFont("helvetica", "bold");
				doc.setFontSize(20);
				doc.text(ecvIniziali(), SX / 2, 33, { align: "center" });
			}
			doc.setTextColor(255, 255, 255);
			doc.setFont("helvetica", "bold");
			doc.setFontSize(12.5);
			const nomeR = doc.splitTextToSize(ecvTesto(ecvNome().toUpperCase()), 58);
			doc.text(nomeR, SX / 2, 56, { align: "center" });
			let y = 56 + nomeR.length * 5.5;
			doc.setFont("helvetica", "normal");
			doc.setFontSize(7.2);
			const tit = doc.splitTextToSize(ecvTesto((d.titolo || etichettaPro()).toUpperCase()), 58);
			doc.text(tit, SX / 2, y, { align: "center" });
			y += tit.length * 3.5 + 2;
			if (currentUser?.certificazioneStato === "verificato") {
				doc.setFillColor(29, 154, 93);
				doc.roundedRect(SX / 2 - 15, y, 30, 5, 2.5, 2.5, "F");
				doc.setFont("helvetica", "bold");
				doc.setFontSize(6.5);
				doc.text("EQUO CERTIFIED", SX / 2, y + 3.5, { align: "center" });
				y += 8;
			}
			const testa = (t) => {
				y += 5;
				doc.setFont("helvetica", "bold");
				doc.setFontSize(8.5);
				doc.setTextColor(255, 255, 255);
				doc.text(t, 7, y);
				doc.setDrawColor(255, 255, 255);
				doc.setLineWidth(.25);
				doc.line(7, y + 1.5, 63, y + 1.5);
				y += 6;
				doc.setFont("helvetica", "normal");
				doc.setFontSize(7.6);
			};
			const contatti = [
				"telefono",
				"email",
				"instagram",
				"sito",
				"indirizzo"
			].filter((k) => d.contatti[k]?.v && d.contatti[k]?.m !== false).map((k) => d.contatti[k].v);
			if (contatti.length) {
				testa(T.cont);
				contatti.forEach((v) => {
					doc.text(doc.splitTextToSize(ecvTesto(v), 56), 7, y);
					y += 4.6;
				});
			}
			testa(T.zona);
			doc.text(doc.splitTextToSize(ecvTesto(d.mostra_zona === false ? "Italia" : (d.zone || []).join(" · ") || "Italia"), 56), 7, y);
			y += 4.6;
			if (d.trasferte) {
				doc.text(doc.splitTextToSize(T.trasf, 56), 7, y);
				y += 8;
			}
			if ((d.spec || []).length) {
				testa(T.spec);
				d.spec.slice(0, 9).forEach((s) => {
					doc.text(doc.splitTextToSize("• " + ecvTesto(s), 56), 7, y);
					y += 4.4;
				});
			}
			if ((d.lingue || []).length) {
				testa(T.lingue);
				doc.text(doc.splitTextToSize(ecvTesto(d.lingue.join(" · ")), 56), 7, y);
				y += 4.6;
			}
			doc.setFillColor(255, 255, 255);
			doc.roundedRect(SX / 2 - 17, 239, 34, 34, 2, 2, "F");
			disegnaQrPdf(doc, ecvLink(), SX / 2 - 14.5, 241.5, 29);
			doc.setTextColor(255, 255, 255);
			doc.setFontSize(6.5);
			doc.text(T.qr, SX / 2, 278, { align: "center" });
			doc.setFont("courier", "bold");
			doc.text(ecvTesto(ecvCodice()), SX / 2, 282, { align: "center" });
			const X = 80, L = 118;
			let yr = 20;
			const sez = (t) => {
				if (yr > 267) {
					doc.addPage();
					yr = 20;
				}
				doc.setFont("helvetica", "bold");
				doc.setFontSize(10.5);
				doc.setTextColor(...col);
				doc.text(t, X, yr);
				doc.setDrawColor(...col);
				doc.setLineWidth(.5);
				doc.line(X, yr + 1.8, 198, yr + 1.8);
				doc.setLineWidth(.2);
				yr += 8;
				doc.setTextColor(40, 40, 46);
				doc.setFont("helvetica", "normal");
				doc.setFontSize(8.8);
			};
			const pres = en && d.presentazione_en ? d.presentazione_en : d.presentazione;
			if (pres) {
				sez(T.prof);
				const r = doc.splitTextToSize(ecvTesto(pres), L);
				doc.text(r, X, yr);
				yr += r.length * 4.2 + 4;
			}
			if ((d.esperienze || []).length) {
				sez(T.esp);
				d.esperienze.forEach((e) => {
					if (yr > 277) {
						doc.addPage();
						yr = 20;
					}
					doc.setFont("helvetica", "bold");
					doc.text(doc.splitTextToSize(ecvTesto(e.ruolo || e.titolo), L)[0], X, yr);
					yr += 4.3;
					doc.setFont("helvetica", "normal");
					doc.setTextColor(110, 110, 110);
					doc.text(doc.splitTextToSize(ecvTesto([
						e.ruolo ? e.titolo : "",
						e.luogo,
						e.anno
					].filter(Boolean).join(" · ")), L), X, yr);
					doc.setTextColor(40, 40, 46);
					yr += 6.5;
				});
				yr += 2;
			}
			if ((d.formazione || []).length) {
				sez(T.form);
				d.formazione.forEach((f) => {
					if (yr > 277) {
						doc.addPage();
						yr = 20;
					}
					const ver = ecv.verifiche.has(f.id);
					doc.setFont("helvetica", "bold");
					doc.text(doc.splitTextToSize(ecvTesto(f.titolo), L)[0], X, yr);
					yr += 4.3;
					doc.setFont("helvetica", "normal");
					doc.setTextColor(110, 110, 110);
					doc.text(ecvTesto([
						f.ente,
						f.anno,
						ver ? T.ver : ""
					].filter(Boolean).join(" · ")), X, yr);
					doc.setTextColor(40, 40, 46);
					yr += 6.5;
				});
				yr += 2;
			}
			const num = ecvNumeriVisibili().filter((n) => !/su Equo dal/.test(n[1]));
			if (num.length) {
				sez(T.num);
				const w = (L - (num.length - 1) * 3) / num.length;
				num.forEach(([v, t], i) => {
					const cx = X + i * (w + 3);
					doc.setFillColor(242, 239, 232);
					doc.roundedRect(cx, yr - 4, w, 15, 2, 2, "F");
					doc.setFont("helvetica", "bold");
					doc.setFontSize(13);
					doc.setTextColor(...col);
					doc.text(ecvTesto(v), cx + w / 2, yr + 3, { align: "center" });
					doc.setFont("helvetica", "normal");
					doc.setFontSize(6.8);
					doc.setTextColor(90, 90, 90);
					doc.text(ecvTesto(t), cx + w / 2, yr + 8, { align: "center" });
				});
				yr += 18;
				doc.setFontSize(8.8);
				doc.setTextColor(40, 40, 46);
			}
			const refs = (ecv.referenze || []).filter((r) => r.stato === "pubblicata" && r.testo);
			if (refs.length) {
				sez(T.ref);
				refs.slice(0, 4).forEach((r) => {
					doc.setFont("helvetica", "italic");
					const t = doc.splitTextToSize("«" + ecvTesto(r.testo) + "» — " + ecvTesto(r.autore || ""), L);
					if (yr + t.length * 4.2 > 281) {
						doc.addPage();
						yr = 20;
					}
					doc.text(t, X, yr);
					yr += t.length * 4.2 + 3;
				});
				doc.setFont("helvetica", "normal");
			}
			const pagine = doc.getNumberOfPages();
			for (let p = 1; p <= pagine; p++) {
				doc.setPage(p);
				doc.setFontSize(6.5);
				doc.setTextColor(140, 140, 140);
				doc.text(T.agg + new Date(ecv.aggiornato_il || Date.now()).toLocaleDateString(en ? "en-GB" : "it-IT") + " · " + T.nota, 198, 290, { align: "right" });
			}
			await ecvCondividiPdf(doc, ecvNomeFile("CV"), condividi);
		} catch (e) {
			console.error("ecvPdfCv:", e);
			showToast("Impossibile creare il PDF: " + (e?.message || e));
		}
	}
	// equo-app-src/src/ruoli/maniscalco/moduli/112-officina-mobile.js
	var OGGI = () => isoLocale(/* @__PURE__ */ new Date());
	var OF = {
		caricato: false,
		sqlOk: true,
		imp: null,
		mezzi: [],
		aiutanti: [],
		materiali: [],
		spese: [],
		interventi: [],
		giornate: {},
		scheda: "mezzi",
		mese: OGGI().slice(0, 7),
		vista: "home",
		mezzoAperto: null,
		kmStime: {},
		lavoriMese: null
	};
	var ofForm = null;
	var TIPI_MEZZO = {
		furgone: "Furgone",
		auto: "Auto",
		carrello: "Carrello",
		altro: "Altro"
	};
	var ALIM = {
		diesel: "Diesel",
		benzina: "Benzina",
		gpl: "GPL",
		metano: "Metano",
		ibrido: "Ibrido",
		elettrico: "Elettrico"
	};
	var CARBURANTE = {
		diesel: "Gasolio",
		benzina: "Benzina",
		gpl: "GPL",
		metano: "Metano",
		ibrido: "Benzina",
		elettrico: "Ricarica"
	};
	var COMPENSO = {
		giornata: "a giornata",
		cavallo: "a cavallo",
		ora: "all'ora"
	};
	var CAT_MAT = {
		ferri: "Ferri",
		chiodi: "Chiodi",
		prodotti: "Prodotti",
		attrezzi: "Attrezzi",
		altro: "Altro"
	};
	var UNITA = {
		pezzo: "pezzo",
		paio: "paio",
		scatola: "scatola",
		barattolo: "barattolo",
		confezione: "confezione",
		kg: "kg",
		litro: "litro"
	};
	var CAT_SPESA = {
		aiutanti: ["Aiutanti", "#2f5a3f"],
		carburante: ["Carburante", "#d76b3a"],
		materiali: ["Materiali", "#c9973f"],
		mezzo: ["Mezzo", "#8a7d66"],
		altro: ["Altro", "#5c7a8a"]
	};
	var INT_TIPI = {
		tagliando: "Tagliando",
		revisione: "Revisione",
		pneumatici: "Gomme",
		pasticche: "Pasticche",
		cinghia: "Cinghia distribuzione",
		tagliando_cambio: "Tagliando cambio automatico",
		manutenzione_ordinaria: "Manutenzione ordinaria",
		manutenzione_straordinaria: "Manutenzione straordinaria",
		riparazione: "Riparazione",
		bombole: "Collaudo bombole",
		altro: "Altro"
	};
	var INT_ICO = {
		tagliando: "⚙️",
		revisione: "📋",
		pneumatici: "🛞",
		pasticche: "🛑",
		cinghia: "⛓️",
		tagliando_cambio: "🕹️",
		manutenzione_ordinaria: "🧰",
		manutenzione_straordinaria: "🔩",
		riparazione: "🔧",
		bombole: "🧯",
		altro: "•"
	};
	var MAT_RAPIDI = [
		[
			"Ferri",
			"ferri",
			"paio"
		],
		[
			"Chiodi",
			"chiodi",
			"scatola"
		],
		[
			"Raspe",
			"attrezzi",
			"pezzo"
		],
		[
			"Nastro smerigliatrice",
			"attrezzi",
			"pezzo"
		],
		[
			"Scarpe antinfortunistiche",
			"altro",
			"paio"
		],
		[
			"Bombola gas",
			"altro",
			"pezzo"
		],
		[
			"Grembiule",
			"altro",
			"pezzo"
		]
	];
	var KM_AVVISO = {
		tagliando: 1e3,
		cinghia: 3e3,
		cambio_aut: 2e3
	};
	var giorniA = (iso) => iso ? Math.round((/* @__PURE__ */ new Date(iso + "T12:00") - /* @__PURE__ */ new Date(OGGI() + "T12:00")) / 864e5) : null;
	var num = (v) => {
		const n = Number(String(v ?? "").replace(",", "."));
		return Number.isFinite(n) ? n : null;
	};
	var fmtKm = (n) => n == null ? "—" : Math.round(n).toLocaleString("it-IT");
	var meseNome = (ym) => {
		const [y, m] = ym.split("-").map(Number);
		return new Date(y, m - 1, 1).toLocaleDateString("it-IT", {
			month: "long",
			year: "numeric"
		});
	};
	var sqlMancante = (e) => /officina_|does not exist|schema cache|aiutante_/i.test(e?.message || "");
	var esc = (s) => escapeHtml(s == null ? "" : String(s));
	var OfDB = {
		demo() {
			return demoState.officina = demoState.officina || {
				officina_impostazioni: [],
				officina_mezzi: [],
				officina_interventi: [],
				officina_aiutanti: [],
				officina_materiali: [],
				officina_giornate: [],
				officina_spese: []
			};
		},
		async lista(t, filtri) {
			if (DEMO_MODE) return (this.demo()[t] || []).filter((r) => !filtri || Object.entries(filtri).every(([k, v]) => r[k] === v));
			let q = sb.from(t).select("*").eq("user_id", currentUser.id);
			Object.entries(filtri || {}).forEach(([k, v]) => {
				q = q.eq(k, v);
			});
			const { data, error } = await q.limit(2e3);
			if (error) {
				if (sqlMancante(error)) OF.sqlOk = false;
				else console.warn("officina", t, error.message);
				return [];
			}
			return data || [];
		},
		async salva(t, riga) {
			if (DEMO_MODE) {
				const tab = this.demo()[t];
				if (riga.id) {
					const r = tab.find((x) => x.id === riga.id);
					Object.assign(r, riga);
					return {
						data: r,
						error: null
					};
				}
				const r = {
					id: "of" + Math.random().toString(36).slice(2, 10),
					user_id: currentUser.id,
					creato_il: (/* @__PURE__ */ new Date()).toISOString(),
					...riga
				};
				tab.push(r);
				return {
					data: r,
					error: null
				};
			}
			const { id, ...campi } = riga;
			const { data, error } = await (id ? sb.from(t).update(campi).eq("id", id) : sb.from(t).insert({
				user_id: currentUser.id,
				...campi
			})).select().single();
			return {
				data,
				error
			};
		},
		async elimina(t, id) {
			if (DEMO_MODE) {
				const d = this.demo();
				d[t] = d[t].filter((r) => r.id !== id);
				return { error: null };
			}
			return await sb.from(t).delete().eq("id", id);
		},
		async impostazioni(campi) {
			if (DEMO_MODE) {
				const d = this.demo();
				if (!d.officina_impostazioni[0]) d.officina_impostazioni.push({ user_id: currentUser.id });
				Object.assign(d.officina_impostazioni[0], campi);
				return {
					data: d.officina_impostazioni[0],
					error: null
				};
			}
			const { data, error } = await sb.from("officina_impostazioni").upsert({
				user_id: currentUser.id,
				...campi,
				aggiornato_il: (/* @__PURE__ */ new Date()).toISOString()
			}, { onConflict: "user_id" }).select().single();
			return {
				data,
				error
			};
		},
		async giornata(riga) {
			if (DEMO_MODE) {
				const d = this.demo();
				const r = d.officina_giornate.find((x) => x.giorno === riga.giorno);
				if (r) Object.assign(r, riga);
				else d.officina_giornate.push({
					user_id: currentUser.id,
					...riga
				});
				return { error: null };
			}
			const { error } = await sb.from("officina_giornate").upsert({
				user_id: currentUser.id,
				...riga,
				salvata_il: (/* @__PURE__ */ new Date()).toISOString()
			}, { onConflict: "user_id,giorno" });
			return { error };
		},
		async spesaAuto(fonte, riga) {
			if (DEMO_MODE) {
				const d = this.demo();
				const r = d.officina_spese.find((x) => x.fonte === fonte);
				if (!riga) {
					d.officina_spese = d.officina_spese.filter((x) => x.fonte !== fonte);
					return { error: null };
				}
				if (r) Object.assign(r, riga);
				else d.officina_spese.push({
					id: "of" + Math.random().toString(36).slice(2, 10),
					user_id: currentUser.id,
					fonte,
					automatica: true,
					...riga
				});
				return { error: null };
			}
			if (!riga) return await sb.from("officina_spese").delete().eq("user_id", currentUser.id).eq("fonte", fonte);
			return await sb.from("officina_spese").upsert({
				user_id: currentUser.id,
				fonte,
				automatica: true,
				...riga
			}, { onConflict: "user_id,fonte" });
		}
	};
	async function ofCarica(forza) {
		if (OF.caricato && !forza) return;
		if (!currentUser) return;
		OF.sqlOk = true;
		const da = aggiungiGiorniIso(OGGI(), -400);
		const [imp, mezzi, aiutanti, materiali, interventi, giornate] = await Promise.all([
			OfDB.lista("officina_impostazioni"),
			OfDB.lista("officina_mezzi"),
			OfDB.lista("officina_aiutanti"),
			OfDB.lista("officina_materiali"),
			OfDB.lista("officina_interventi"),
			OfDB.lista("officina_giornate")
		]);
		OF.imp = imp[0] || null;
		OF.mezzi = mezzi.filter((m) => !m.archiviato).sort((a, b) => (a.creato_il || "").localeCompare(b.creato_il || ""));
		OF.aiutanti = aiutanti.filter((a) => a.attivo !== false).sort((a, b) => a.nome.localeCompare(b.nome, "it"));
		OF.materiali = materiali.filter((m) => m.attivo !== false).sort((a, b) => (a.categoria + a.nome).localeCompare(b.categoria + b.nome, "it"));
		OF.interventi = interventi.sort((a, b) => b.data.localeCompare(a.data));
		OF.giornate = {};
		giornate.filter((g) => g.giorno >= da).forEach((g) => {
			OF.giornate[g.giorno] = g;
		});
		await ofCaricaSpese();
		OF.caricato = true;
	}
	async function ofCaricaSpese() {
		OF.spese = (await OfDB.lista("officina_spese")).sort((a, b) => (b.data + (b.creato_il || "")).localeCompare(a.data + (a.creato_il || "")));
	}
	var ofConfigurata = () => !!OF.imp?.configurata_il;
	var ofMezzo = (id) => OF.mezzi.find((m) => m.id === id) || null;
	var ofAiutante = (id) => OF.aiutanti.find((a) => a.id === id) || null;
	var ofMezzoPred = () => ofMezzo(OF.imp?.mezzo_predefinito) || OF.mezzi[0] || null;
	var ofAiutantePred = () => ofAiutante(OF.imp?.aiutante_predefinito) || null;
	var nomeMezzo = (m) => m ? [m.marca, m.modello].filter(Boolean).join(" ") || TIPI_MEZZO[m.tipo] || "Mezzo" : "—";
	var icoMezzo = (m) => m?.tipo === "auto" ? "🚗" : m?.tipo === "carrello" ? "🛻" : "🚐";
	function revisioneCalcolata(m) {
		if (m.revisione_data) return m.revisione_data;
		if (!m.immatricolazione) return null;
		const d = /* @__PURE__ */ new Date(m.immatricolazione + "T12:00");
		d.setFullYear(d.getFullYear() + 4);
		const oggi = /* @__PURE__ */ new Date(OGGI() + "T12:00");
		while (d < oggi) d.setFullYear(d.getFullYear() + 2);
		return isoLocale(d);
	}
	function ciclo(m, ogniKm, ogniMesi, ultData, ultKm) {
		ogniKm = ogniKm || null;
		ogniMesi = ogniMesi || null;
		const kmFatti = m.km_attuali != null && ultKm != null ? m.km_attuali - ultKm : null;
		const kmMancano = ogniKm && kmFatti != null ? ogniKm - kmFatti : null;
		let data = null;
		if (ogniMesi && ultData) {
			const d = /* @__PURE__ */ new Date(ultData + "T12:00");
			d.setMonth(d.getMonth() + ogniMesi);
			data = isoLocale(d);
		}
		const pKm = ogniKm && kmFatti != null ? Math.min(1, Math.max(0, kmFatti / ogniKm)) : null;
		let pT = null;
		if (ogniMesi && ultData) {
			const tot = ogniMesi * 30.4, fatto = -giorniA(ultData);
			pT = Math.min(1, Math.max(0, fatto / tot));
		}
		return {
			ogniKm,
			ogniMesi,
			kmFatti,
			kmMancano,
			data,
			perc: Math.max(pKm ?? 0, pT ?? 0),
			conDati: pKm != null || pT != null
		};
	}
	var tagliando = (m) => ciclo(m, m.tagliando_km, m.tagliando_mesi, m.ultimo_tagliando_data, m.ultimo_tagliando_km);
	function cambioAut(m) {
		if (m.cambio !== "automatico" || !m.cambio_aut_km && !m.cambio_aut_anni) return { conDati: false };
		const daImm = !m.ultimo_cambio_aut_data && m.ultimo_cambio_aut_km == null;
		return {
			...ciclo(m, m.cambio_aut_km, m.cambio_aut_anni ? m.cambio_aut_anni * 12 : null, daImm ? m.immatricolazione : m.ultimo_cambio_aut_data, daImm ? m.immatricolazione ? 0 : null : m.ultimo_cambio_aut_km),
			daImm
		};
	}
	function cinghia(m) {
		if (!m.cinghia_km && !m.cinghia_anni) return { conDati: false };
		const daImm = !m.ultima_cinghia_data && m.ultima_cinghia_km == null;
		return {
			...ciclo(m, m.cinghia_km, m.cinghia_anni ? m.cinghia_anni * 12 : null, daImm ? m.immatricolazione : m.ultima_cinghia_data, daImm ? m.immatricolazione ? 0 : null : m.ultima_cinghia_km),
			daImm
		};
	}
	function scadenzeMezzo(m) {
		const out = [];
		const add = (k, titolo, data, extra) => {
			if (data) out.push({
				k,
				titolo,
				data,
				giorni: giorniA(data),
				mezzo: m,
				...extra || {}
			});
		};
		add("revisione", "Revisione", revisioneCalcolata(m));
		const t = tagliando(m);
		if (t.conDati) out.push({
			k: "tagliando",
			titolo: "Tagliando",
			data: t.data,
			giorni: t.data ? giorniA(t.data) : null,
			km: t.kmMancano,
			perc: t.perc,
			mezzo: m
		});
		const c = cinghia(m);
		const ca = cambioAut(m);
		if (ca.conDati) out.push({
			k: "cambio_aut",
			titolo: "Tagliando cambio automatico",
			data: ca.data,
			giorni: ca.data ? giorniA(ca.data) : null,
			km: ca.kmMancano,
			perc: ca.perc,
			mezzo: m
		});
		if (c.conDati) out.push({
			k: "cinghia",
			titolo: "Cinghia distribuzione",
			data: c.data,
			giorni: c.data ? giorniA(c.data) : null,
			km: c.kmMancano,
			perc: c.perc,
			mezzo: m
		});
		add("assicurazione", "Assicurazione", m.assicurazione_data);
		add("bollo", "Bollo", m.bollo_data);
		if (["gpl", "metano"].includes(m.alimentazione)) add("bombole", "Collaudo bombole", m.bombole_data);
		OF.interventi.filter((i) => i.mezzo_id === m.id && i.stato === "da_fare").forEach((i) => add("int:" + i.id, i.titolo, i.data, { intervento: i }));
		return out;
	}
	function statoScadenza(s) {
		if (KM_AVVISO[s.k]) {
			const urg = s.km != null && s.km <= KM_AVVISO[s.k] || s.giorni != null && s.giorni <= 15;
			return {
				perc: s.perc ?? 0,
				colore: s.km != null && s.km <= 0 || s.giorni != null && s.giorni < 0 ? "#b5432f" : urg ? "#d76b3a" : "#c9973f"
			};
		}
		const g = s.giorni;
		return {
			perc: g == null ? 0 : g <= 0 ? 1 : Math.max(.05, 1 - g / 365),
			colore: g < 0 ? "#b5432f" : g <= 15 ? "#d76b3a" : g <= 60 ? "#c9973f" : "#3d7a4f"
		};
	}
	var dataScad = (iso) => iso && iso.slice(0, 4) !== OGGI().slice(0, 4) ? (/* @__PURE__ */ new Date(iso + "T12:00")).toLocaleDateString("it-IT", {
		day: "numeric",
		month: "short",
		year: "numeric"
	}) : formatDataBreve(iso);
	function testoScadenza(s) {
		if (KM_AVVISO[s.k]) {
			const parti = [];
			if (s.km != null) parti.push(s.km <= 0 ? `superato di ${fmtKm(-s.km)} km` : `tra ${fmtKm(s.km)} km`);
			if (s.giorni != null) parti.push(s.giorni < 0 ? `scaduto da ${-s.giorni} gg` : `entro ${dataScad(s.data)}`);
			return parti.join(" · ") || (s.k === "tagliando" ? "imposta l'ultimo tagliando" : "imposta l'ultima sostituzione");
		}
		const g = s.giorni;
		return g < 0 ? `scaduta da ${-g} ${-g === 1 ? "giorno" : "giorni"}` : g === 0 ? "oggi" : g <= 60 ? `tra ${g} ${g === 1 ? "giorno" : "giorni"}` : dataScad(s.data);
	}
	function anello(perc, colore, d) {
		d = d || 40;
		const r = d / 2 - 4, c = 2 * Math.PI * r;
		return `<svg width="${d}" height="${d}" viewBox="0 0 ${d} ${d}" aria-hidden="true"><circle cx="${d / 2}" cy="${d / 2}" r="${r}" stroke="#eadfc2" stroke-width="5" fill="none"/><circle cx="${d / 2}" cy="${d / 2}" r="${r}" stroke="${colore}" stroke-width="5" fill="none" stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${(c * (1 - perc)).toFixed(1)}" stroke-linecap="round" transform="rotate(-90 ${d / 2} ${d / 2})"/></svg>`;
	}
	async function ofPromemoriaScadenze(m) {
		if (DEMO_MODE || !m || !OF.sqlOk) return;
		for (const s of scadenzeMezzo(m)) {
			if (!s.data || s.k.startsWith("int:")) continue;
			for (const [quanto, etichetta] of [[15, "tra 15 giorni"], [0, "oggi"]]) {
				const giorno = aggiungiGiorniIso(s.data, -quanto);
				const quando = /* @__PURE__ */ new Date(giorno + "T08:00");
				const fonte = `mezzo:${m.id}:${s.k}:${quanto}`;
				if (quando.getTime() < Date.now()) continue;
				await sb.from("promemoria_personali").upsert({
					user_id: currentUser.id,
					fonte,
					testo: `${s.titolo} ${nomeMezzo(m)}${m.targa ? " (" + m.targa + ")" : ""}: scade ${etichetta} (${dataScad(s.data)})`.slice(0, 300),
					quando: quando.toISOString(),
					stato: "attivo",
					creato_da: "utente"
				}, { onConflict: "user_id,fonte" }).then((r) => {
					if (r.error && !sqlMancante(r.error)) console.warn("promemoria mezzo:", r.error.message);
				});
			}
		}
	}
	async function ofControllaTagliandoKm(m) {
		if (DEMO_MODE || !m) return;
		const c = cinghia(m);
		if (c.kmMancano != null && c.kmMancano <= 3e3) await sb.from("promemoria_personali").upsert({
			user_id: currentUser.id,
			fonte: `mezzo:${m.id}:cinghia_km:${m.ultima_cinghia_km ?? 0}`,
			testo: `Cinghia distribuzione ${nomeMezzo(m)}: ${c.kmMancano <= 0 ? "hai superato i km" : "mancano circa " + fmtKm(c.kmMancano) + " km"} (ogni ${fmtKm(c.ogniKm)} km · km in Beta)`,
			quando: new Date(Date.now() + 6e4).toISOString(),
			stato: "attivo",
			creato_da: "utente"
		}, {
			onConflict: "user_id,fonte",
			ignoreDuplicates: true
		});
		const ca = cambioAut(m);
		if (ca.kmMancano != null && ca.kmMancano <= KM_AVVISO.cambio_aut) await sb.from("promemoria_personali").upsert({
			user_id: currentUser.id,
			fonte: `mezzo:${m.id}:cambio_km:${m.ultimo_cambio_aut_km ?? 0}`,
			testo: `Tagliando cambio automatico ${nomeMezzo(m)}: ${ca.kmMancano <= 0 ? "hai superato i km" : "mancano circa " + fmtKm(ca.kmMancano) + " km"} (ogni ${fmtKm(ca.ogniKm)} km · km in Beta)`,
			quando: new Date(Date.now() + 6e4).toISOString(),
			stato: "attivo",
			creato_da: "utente"
		}, {
			onConflict: "user_id,fonte",
			ignoreDuplicates: true
		});
		const t = tagliando(m);
		if (t.kmMancano == null || t.kmMancano > 1e3) return;
		await sb.from("promemoria_personali").upsert({
			user_id: currentUser.id,
			fonte: `mezzo:${m.id}:tagliando_km:${m.ultimo_tagliando_km}`,
			testo: `Tagliando ${nomeMezzo(m)}: ${t.kmMancano <= 0 ? "hai superato i km" : "mancano circa " + fmtKm(t.kmMancano) + " km"} (ogni ${fmtKm(t.ogniKm)} km · km in Beta)`,
			quando: new Date(Date.now() + 6e4).toISOString(),
			stato: "attivo",
			creato_da: "utente"
		}, {
			onConflict: "user_id,fonte",
			ignoreDuplicates: true
		});
	}
	async function ofLavoriGiorno(giorno) {
		return (await DB.listInterventiPeriodo(giorno, giorno).catch(() => [])).filter((e) => ![
			"rifiutato",
			"annullato",
			"richiesto",
			"proposto"
		].includes(e.stato));
	}
	async function ofStimaKm(giorno, lavori) {
		if (OF.kmStime[giorno] !== void 0) return OF.kmStime[giorno];
		const lista = agOrdinaGiro(lavori || await ofLavoriGiorno(giorno));
		const tappe = [];
		lista.forEach((e) => {
			const l = luogoEvento(e, false);
			const testo = (l.indirizzo || l.nome || "").trim();
			if (testo && tappe[tappe.length - 1] !== testo) tappe.push(testo);
		});
		if (!tappe.length) {
			OF.kmStime[giorno] = {
				km: 0,
				metodo: "nessuno",
				tappe: 0
			};
			return OF.kmStime[giorno];
		}
		const base = OF.imp?.base_lat ? {
			lat: OF.imp.base_lat,
			lon: OF.imp.base_lon
		} : OF.imp?.base_indirizzo ? { testo: OF.imp.base_indirizzo } : null;
		const punti = [
			...base ? [base] : [],
			...tappe.map((t) => ({ testo: t })),
			...base ? [base] : []
		];
		let r = {
			km: null,
			metodo: "nessuno"
		};
		if (DEMO_MODE) r = {
			km: Math.round(18 + tappe.length * 21),
			metodo: "stima"
		};
		else try {
			r = await (await fetch("/.netlify/functions/km-giro", {
				method: "POST",
				headers: await authHeaders(),
				body: JSON.stringify({ punti })
			})).json();
		} catch (e) {
			r = {
				km: null,
				metodo: "errore"
			};
		}
		OF.kmStime[giorno] = {
			km: r.km ?? null,
			metodo: r.metodo,
			mancanti: r.mancanti || 0,
			tappe: tappe.length,
			senzaBase: !base,
			giro: tappe
		};
		return OF.kmStime[giorno];
	}
	function ofMaterialiDaLavori(lavori) {
		const out = {};
		lavori.filter((e) => e.stato === "fatto" && e.ferri_nuovi === true && Number(e.quantita_ferri) > 0).forEach((e) => {
			const mis = String(e.numero_ferro || "").toLowerCase().replace(/\s+/g, "");
			const m = OF.materiali.find((x) => x.categoria === "ferri" && x.misura && String(x.misura).toLowerCase().replace(/\s+/g, "") === mis) || (OF.materiali.filter((x) => x.categoria === "ferri").length === 1 ? OF.materiali.find((x) => x.categoria === "ferri") : null);
			if (!m) return;
			const q = m.unita === "paio" ? Number(e.quantita_ferri) / 2 : Number(e.quantita_ferri);
			out[m.id] = (out[m.id] || 0) + q;
		});
		return Object.entries(out).map(([materiale_id, quantita]) => ({
			materiale_id,
			quantita,
			auto: true
		}));
	}
	async function ofGiornataProposta(giorno) {
		const salvata = OF.giornate[giorno];
		const lavori = await ofLavoriGiorno(giorno);
		if (salvata) return {
			...salvata,
			materiali: salvata.materiali || [],
			lavori,
			salvata: true
		};
		const km = await ofStimaKm(giorno, lavori);
		return {
			giorno,
			mezzo_id: ofMezzoPred()?.id || null,
			aiutante_id: ofAiutantePred()?.id || null,
			ore: 8,
			km: km.km,
			km_stimati: km.km,
			km_corretti: false,
			materiali: ofMaterialiDaLavori(lavori),
			lavori,
			salvata: false
		};
	}
	var cavalliFatti = (lavori) => (lavori || []).filter((e) => e.stato === "fatto").length || (lavori || []).length;
	function costoAiutante(a, g) {
		if (!a) return 0;
		const n = Number(a.compenso) || 0;
		return a.compenso_tipo === "cavallo" ? n * cavalliFatti(g.lavori) : a.compenso_tipo === "ora" ? n * (Number(g.ore) || 0) : n;
	}
	function costoCarburante(m, km) {
		const prezzo = Number(OF.imp?.prezzo_carburante) || 0, cons = Number(m?.consumo_l100) || 0;
		return km && prezzo && cons ? Math.round(km * cons / 100 * prezzo * 100) / 100 : 0;
	}
	async function ofSalvaGiornata(g, automatica) {
		const prec = OF.giornate[g.giorno] || null;
		const riga = {
			giorno: g.giorno,
			mezzo_id: g.mezzo_id || null,
			aiutante_id: g.aiutante_id || null,
			ore: g.ore ?? null,
			km: g.km != null ? Math.round(g.km * 10) / 10 : null,
			km_stimati: g.km_stimati ?? null,
			km_corretti: !!g.km_corretti,
			materiali: (g.materiali || []).filter((x) => Number(x.quantita) > 0).map((x) => ({
				materiale_id: x.materiale_id,
				quantita: Number(x.quantita),
				auto: !!x.auto
			})),
			automatica: !!automatica
		};
		const { error } = await OfDB.giornata(riga);
		if (error) {
			if (!automatica) showToast("Non salvata: " + error.message);
			return false;
		}
		OF.giornate[g.giorno] = {
			...riga,
			user_id: currentUser.id
		};
		const a = ofAiutante(riga.aiutante_id), m = ofMezzo(riga.mezzo_id);
		const ca = costoAiutante(a, g);
		await OfDB.spesaAuto(`aiutante:${g.giorno}`, a && ca > 0 ? {
			data: g.giorno,
			categoria: "aiutanti",
			descrizione: `${a.nome} · ${a.compenso_tipo === "cavallo" ? cavalliFatti(g.lavori) + " cavalli" : a.compenso_tipo === "ora" ? (g.ore || 0) + " ore" : "giornata"}`,
			importo: ca
		} : null);
		const cc = costoCarburante(m, riga.km);
		await OfDB.spesaAuto(`carburante:${g.giorno}`, cc > 0 ? {
			data: g.giorno,
			categoria: "carburante",
			descrizione: `${CARBURANTE[m?.alimentazione] || "Carburante"} stimato · ${fmtKm(riga.km)} km (Beta)`,
			importo: cc,
			mezzo_id: m?.id || null
		} : null);
		const voci = riga.materiali.map((x) => ({
			...x,
			m: OF.materiali.find((y) => y.id === x.materiale_id)
		})).filter((x) => x.m);
		const cm = Math.round(voci.reduce((t, x) => t + x.quantita * (Number(x.m.costo) || 0), 0) * 100) / 100;
		await OfDB.spesaAuto(`materiali:${g.giorno}`, cm > 0 ? {
			data: g.giorno,
			categoria: "materiali",
			descrizione: voci.map((x) => `${x.m.nome} × ${String(x.quantita).replace(".", ",")}`).join(", ").slice(0, 120),
			importo: cm
		} : null);
		const prima = {};
		(prec?.materiali || []).forEach((x) => {
			prima[x.materiale_id] = (prima[x.materiale_id] || 0) + Number(x.quantita);
		});
		const ora = {};
		riga.materiali.forEach((x) => {
			ora[x.materiale_id] = (ora[x.materiale_id] || 0) + Number(x.quantita);
		});
		for (const id of /* @__PURE__ */ new Set([...Object.keys(prima), ...Object.keys(ora)])) {
			const delta = (ora[id] || 0) - (prima[id] || 0), mat = OF.materiali.find((y) => y.id === id);
			if (delta && mat) {
				mat.scorta = Math.round((Number(mat.scorta) - delta) * 100) / 100;
				await OfDB.salva("officina_materiali", {
					id,
					scorta: mat.scorta
				});
			}
		}
		const dKm = (riga.km || 0) - (prec && prec.mezzo_id === riga.mezzo_id ? prec.km || 0 : 0);
		if (m && m.km_attuali != null && dKm) {
			m.km_attuali = Math.round(m.km_attuali + dKm);
			await OfDB.salva("officina_mezzi", {
				id: m.id,
				km_attuali: m.km_attuali,
				km_aggiornati_il: g.giorno
			});
			await ofControllaTagliandoKm(m);
		}
		if (!DEMO_MODE && (g.lavori || []).length) {
			const daAggiornare = g.lavori.filter((e) => !e.aiutante_id || e.aiutante_id === prec?.aiutante_id).map((e) => e.id);
			if (daAggiornare.length) await sb.from("interventi_mascalcia").update({
				aiutante_id: a?.id || null,
				aiutante_nome: a?.nome || null
			}).in("id", daAggiornare).then((r) => {
				if (r.error) console.warn("aiutante appuntamenti:", r.error.message);
			});
		}
		await ofCaricaSpese();
		return true;
	}
	var ofChiusuraInCorso = false;
	async function ofChiudiGiorniPassati() {
		if (ofChiusuraInCorso || !ofConfigurata() || !OF.sqlOk) return;
		ofChiusuraInCorso = true;
		try {
			const inizio = [isoLocale(new Date(OF.imp.configurata_il)), aggiungiGiorniIso(OGGI(), -14)].sort().pop();
			let fatti = 0;
			for (let d = inizio; d < OGGI() && fatti < 5; d = aggiungiGiorniIso(d, 1)) {
				if (OF.giornate[d]) continue;
				const g = await ofGiornataProposta(d);
				if (!g.lavori.some((e) => e.stato === "fatto")) continue;
				await ofSalvaGiornata(g, true);
				fatti++;
			}
			if (fatti && document.getElementById("page-pro-officina")?.classList.contains("active")) ofDisegna();
		} finally {
			ofChiusuraInCorso = false;
		}
	}
	async function ofApri() {
		const root = document.getElementById("of-root");
		if (!root) return;
		if (!OF.caricato) root.innerHTML = "<div class=\"loading\"><div class=\"spinner\"></div> Carico la tua officina…</div>";
		await ofCarica(true);
		OF.vista = "home";
		ofDisegna();
		ofChiudiGiorniPassati();
	}
	function ofDisegna() {
		const root = document.getElementById("of-root");
		if (!root) return;
		if (!OF.sqlOk) {
			root.innerHTML = `<div class="of-vuoto"><b>🚐 Officina mobile</b><span>Arriva con l'aggiornamento di Equo: tra poco potrai gestire furgone, aiutanti, materiali e spese.</span></div>`;
			return;
		}
		if (OF.vista === "mezzo" && ofMezzo(OF.mezzoAperto)) return ofDisegnaMezzo();
		if (!ofConfigurata() && !OF.mezzi.length && !OF.aiutanti.length) return ofDisegnaBenvenuto();
		const m = ofMezzoPred();
		const scad = OF.mezzi.flatMap(scadenzeMezzo).sort((a, b) => (a.giorni ?? 9999) - (b.giorni ?? 9999));
		const t = m ? tagliando(m) : null, rev = m ? scadenzeMezzo(m).find((s) => s.k === "revisione") : null;
		root.innerHTML = `
    <div class="of-hero">
      <div class="of-hero-lin"></div>
      <div class="of-k">OFFICINA MOBILE</div>
      <h3>${m ? esc(nomeMezzo(m)) : "Nessun mezzo"}</h3>
      <div class="of-t">${m ? [
			m.targa,
			m.km_attuali != null ? fmtKm(m.km_attuali) + " km" : null,
			ALIM[m.alimentazione]
		].filter(Boolean).map(esc).join(" · ") : "Aggiungi il tuo furgone per le scadenze e i costi"}</div>
      ${ofDisegnoMezzo(m)}
      <div class="of-pill">${t?.conDati ? `<span>⚙️ Tagliando ${Math.round(t.perc * 100)}%</span>` : ""}${rev ? `<span>📋 Revisione ${rev.giorni < 0 ? "scaduta" : rev.giorni <= 60 ? "tra " + rev.giorni + " gg" : dataScad(rev.data)}</span>` : ""}${!m ? `<span onclick="ofFormMezzo()">+ Aggiungi mezzo</span>` : ""}</div>
    </div>
    <div class="of-oggi" id="of-oggi"><div class="loading"><div class="spinner"></div></div></div>
    ${scad.length ? `<div class="of-sez">Scadenze <span onclick="ofScheda('mezzi')">${OF.mezzi.length > 1 ? "per mezzo" : ""}</span></div>
    <div class="of-scad">${scad.slice(0, 6).map((s) => {
			const st = statoScadenza(s);
			return `<button type="button" class="of-sc${st.colore === "#b5432f" || st.colore === "#d76b3a" ? " allerta" : ""}" onclick="ofApriMezzo('${s.mezzo.id}')">${anello(st.perc, st.colore)}<span><b>${esc(s.titolo)}</b><small>${esc(testoScadenza(s))}${OF.mezzi.length > 1 ? " · " + esc(nomeMezzo(s.mezzo)) : ""}</small></span></button>`;
		}).join("")}</div>` : ""}
    <div class="of-tabs" role="tablist">${[
			["mezzi", "Mezzi"],
			["aiutanti", "Aiutanti"],
			["materiali", "Materiali"],
			["spese", "Spese"]
		].map(([k, t]) => `<button type="button" role="tab" class="${OF.scheda === k ? "on" : ""}" onclick="ofScheda('${k}')">${t}</button>`).join("")}</div>
    <div id="of-scheda"></div>
    ${!ofConfigurata() ? `<button type="button" class="of-link" onclick="ofOnboarding(1)">Completa la configurazione guidata →</button>` : ""}`;
		ofDisegnaScheda();
		ofDisegnaOggi();
	}
	function ofDisegnoMezzo(m) {
		const carrello = m?.tipo === "carrello";
		return `<svg class="of-van" viewBox="0 0 200 100" fill="none" stroke="#e2b867" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${m?.tipo === "auto" ? "<path d=\"M14 70V56c0-5 3-8 8-9l22-4 20-15h56l24 15 20 4c5 1 8 5 8 10v13\"/><path d=\"M68 30l-14 15h72l-12-15z\" opacity=\".6\"/><circle cx=\"50\" cy=\"74\" r=\"11\"/><circle cx=\"150\" cy=\"74\" r=\"11\"/><path d=\"M61 74h78M14 70h25M161 74h25\"/>" : carrello ? "<path d=\"M30 70V40h110v30z\"/><path d=\"M140 62h40\"/><circle cx=\"85\" cy=\"76\" r=\"10\"/><path d=\"M30 70h45M95 70h45\"/><path d=\"M45 48h80M45 58h80\" opacity=\".5\"/>" : "<path d=\"M10 72V38c0-6 4-10 10-10h92l26 22h34c8 0 14 6 14 14v8\"/><path d=\"M112 28v22h52\"/><path d=\"M28 36h66v16H28z\" opacity=\".6\"/><circle cx=\"48\" cy=\"76\" r=\"11\"/><circle cx=\"160\" cy=\"76\" r=\"11\"/><path d=\"M59 76h90M10 72h27M171 76h15\"/><path d=\"M146 58h12\" opacity=\".7\"/>"}<path d="M18 90h170" stroke-dasharray="3 6" opacity=".5"/></svg>`;
	}
	function ofDisegnaBenvenuto() {
		document.getElementById("of-root").innerHTML = `
    <div class="of-hero of-benv"><div class="of-hero-lin"></div>
      <div class="of-k">NUOVO · OFFICINA MOBILE</div><h3>Il tuo lavoro dietro le quinte</h3>
      <div class="of-t">Furgone e scadenze, aiutanti, ferri e materiali, spese automatiche e guadagno netto. Bastano 2 minuti.</div>
      ${ofDisegnoMezzo(null)}
      <button type="button" class="of-cta" onclick="ofOnboarding(1)">Configura in 4 passi →</button>
    </div>
    <div class="of-passi-anteprima">${[
			[
				"📍",
				"Base",
				"da dove parti al mattino, per i km"
			],
			[
				"🚐",
				"Mezzi",
				"furgone, scadenze e tagliando"
			],
			[
				"👥",
				"Aiutanti",
				"chi lavora con te e quanto costa"
			],
			[
				"🧲",
				"Materiali",
				"ferri, chiodi, prodotti e scorte"
			]
		].map(([i, t, s], n) => `<div><span>${i}</span><b>${n + 1} · ${t}</b><small>${s}</small></div>`).join("")}</div>`;
	}
	async function ofDisegnaOggi() {
		const box = document.getElementById("of-oggi");
		if (!box) return;
		const g = await ofGiornataProposta(OGGI());
		if (!g.salvata && ofScelteOggi) Object.assign(g, ofScelteOggi);
		OF.oggi = g;
		const m = ofMezzo(g.mezzo_id);
		ofAiutante(g.aiutante_id);
		const km = g.km, stima = OF.kmStime[OGGI()];
		const mat = (g.materiali || []).map((x) => ({
			...x,
			m: OF.materiali.find((y) => y.id === x.materiale_id)
		})).filter((x) => x.m);
		box.innerHTML = `
    <div class="of-oggi-t"><b>Oggi, ${(/* @__PURE__ */ new Date()).toLocaleDateString("it-IT", {
			weekday: "long",
			day: "numeric"
		})}</b><button type="button" onclick="ofApriGiornata()">${g.salvata ? "Modifica" : "Tocca per cambiare"}</button></div>
    <div class="of-lab">MEZZO</div><div class="of-chips">${OF.mezzi.length ? OF.mezzi.map((x) => `<button type="button" class="${x.id === g.mezzo_id ? "on" : ""}" onclick="ofOggiScegli('mezzo','${x.id}')">${icoMezzo(x)} ${esc(nomeMezzo(x))}</button>`).join("") : "<button type=\"button\" onclick=\"ofFormMezzo()\">+ Aggiungi mezzo</button>"}</div>
    <div class="of-lab">AIUTANTE</div><div class="of-chips">${OF.aiutanti.map((x) => `<button type="button" class="${x.id === g.aiutante_id ? "on" : ""}" onclick="ofOggiScegli('aiutante','${x.id}')">${esc(x.nome)}${x.id === g.aiutante_id && costoAiutante(x, g) ? " · " + euroTondo(costoAiutante(x, g)) : ""}</button>`).join("")}<button type="button" class="${!g.aiutante_id ? "on" : ""}" onclick="ofOggiScegli('aiutante','')">Da solo</button>${!OF.aiutanti.length ? "<button type=\"button\" onclick=\"ofFormAiutante()\">+ Aiutante</button>" : ""}</div>
    <div class="of-km"><div><small>${stima?.tappe ? `Km di oggi dal giro (${stima.tappe} ${stima.tappe === 1 ? "tappa" : "tappe"}${stima.senzaBase ? "" : " + ritorno"})` : "Km di oggi"}</small><b>${km != null ? fmtKm(km) + " km" : "—"}</b><small>${km && m && costoCarburante(m, km) ? "≈ " + euroTondo(costoCarburante(m, km)) + " di " + (CARBURANTE[m.alimentazione] || "carburante").toLowerCase() : stima?.senzaBase ? "imposta la base per contare anche andata e ritorno" : stima?.tappe === 0 ? "nessuna tappa in agenda oggi" : ""}</small></div><span class="of-beta">BETA</span></div>
    <div class="of-beta-nota">Funzione in Beta · calcoli approssimativi${stima?.mancanti ? ` · ${stima.mancanti} indirizzi non trovati` : ""} · <button type="button" onclick="ofApriGiornata()">correggi</button></div>
    ${mat.length ? `<div class="of-lab">MATERIALI USATI</div><div class="of-chips">${mat.map((x) => `<span class="of-chip-f">${esc(x.m.nome)} · ${String(x.quantita).replace(".", ",")} ${esc(UNITA[x.m.unita] || "")}</span>`).join("")}</div>` : ""}
    ${!g.salvata && g.lavori.length ? `<button type="button" class="of-cta piccolo" onclick="ofSalvaOggi()">Salva la giornata</button>` : g.salvata ? "<div class=\"of-salvata\">✓ Giornata salvata: spese aggiornate</div>" : ""}`;
	}
	var ofScelteOggi = null;
	async function ofOggiScegli(cosa, id) {
		const g = OF.oggi;
		if (!g) return;
		const k = cosa === "mezzo" ? "mezzo_id" : "aiutante_id";
		g[k] = id || null;
		if (g.salvata) {
			await ofSalvaGiornata(g);
			showToast("Giornata aggiornata");
		} else ofScelteOggi = {
			...ofScelteOggi || {},
			[k]: g[k]
		};
		ofDisegnaOggi();
		ofAggiornaRiepiloghi();
		ofStriscia();
	}
	async function ofSalvaOggi() {
		const g = OF.oggi;
		if (!g) return;
		if (await ofSalvaGiornata(g)) {
			ofScelteOggi = null;
			showToast("Giornata salvata: spese aggiornate");
			ofDisegnaOggi();
			ofDisegnaScheda();
			ofAggiornaRiepiloghi();
		}
	}
	function ofScheda(k) {
		OF.scheda = k;
		OF.vista = "home";
		document.querySelectorAll(".of-tabs button").forEach((b, i) => b.classList.toggle("on", [
			"mezzi",
			"aiutanti",
			"materiali",
			"spese"
		][i] === k));
		ofDisegnaScheda();
	}
	function ofDisegnaScheda() {
		const box = document.getElementById("of-scheda");
		if (!box) return;
		if (OF.scheda === "mezzi") box.innerHTML = OF.mezzi.map((m) => {
			const s = scadenzeMezzo(m).sort((a, b) => (a.giorni ?? 9999) - (b.giorni ?? 9999))[0];
			return `<button type="button" class="of-riga" onclick="ofApriMezzo('${m.id}')"><span class="of-ic">${icoMezzo(m)}</span><span class="of-c"><b>${esc(nomeMezzo(m))}${m.id === ofMezzoPred()?.id && OF.mezzi.length > 1 ? " <i class=\"of-pred\">PREDEFINITO</i>" : ""}</b><small>${[
				TIPI_MEZZO[m.tipo],
				m.targa,
				m.km_attuali != null ? fmtKm(m.km_attuali) + " km" : null
			].filter(Boolean).map(esc).join(" · ")}${s ? " · " + esc(s.titolo.toLowerCase()) + " " + esc(testoScadenza(s)) : ""}</small></span><span class="of-fr">›</span></button>`;
		}).join("") + `<button type="button" class="of-agg" onclick="ofFormMezzo()">+ Aggiungi mezzo</button>`;
		else if (OF.scheda === "aiutanti") box.innerHTML = OF.aiutanti.map((a) => `<button type="button" class="of-riga" onclick="ofFormAiutante('${a.id}')"><span class="of-av">${esc((a.nome || "?").trim()[0].toUpperCase())}</span><span class="of-c"><b>${esc(a.nome)}${a.id === OF.imp?.aiutante_predefinito ? " <i class=\"of-pred\">PREDEFINITO</i>" : ""}</b><small>${euroTondo(a.compenso)} ${COMPENSO[a.compenso_tipo]} · ${ofGiorniAiutanteMese(a.id)} giorni a ${(/* @__PURE__ */ new Date()).toLocaleDateString("it-IT", { month: "long" })}</small></span><span class="of-fr">›</span></button>`).join("") + `<button type="button" class="of-agg" onclick="ofFormAiutante()">+ Aggiungi aiutante</button>
       <div class="of-nota">Il cliente vede <b>«Intervento eseguito con l'aiutante ${esc(ofAiutantePred()?.nome || OF.aiutanti[0]?.nome || "Marco")}»</b> nel PDF e nel messaggio in chat; nell'appuntamento solo «con ${esc(ofAiutantePred()?.nome || OF.aiutanti[0]?.nome || "Marco")}».</div>`;
		else if (OF.scheda === "materiali") {
			const bassi = OF.materiali.filter((m) => m.scorta_minima != null && Number(m.scorta) <= Number(m.scorta_minima));
			box.innerHTML = (bassi.length ? `<div class="of-allerta"><b>Stanno finendo:</b> ${bassi.map((m) => `${esc(m.nome)} (${String(m.scorta).replace(".", ",")})`).join(" · ")}</div>` : "") + OF.materiali.map((m) => {
				const max = Math.max(Number(m.scorta_minima || 0) * 3, Number(m.scorta) || 0, 1), basso = m.scorta_minima != null && Number(m.scorta) <= Number(m.scorta_minima);
				return `<div class="of-mat"><span class="of-mat-i">${{
					ferri: "🧲",
					chiodi: "📌",
					prodotti: "🧴",
					attrezzi: "🛠️",
					altro: "📦"
				}[m.categoria]}</span><button type="button" class="of-c" onclick="ofFormMateriale('${m.id}')"><b>${esc(m.nome)}${m.misura ? " · n. " + esc(m.misura) : ""}</b><small>${euroTondo(m.costo)} ${UNITA[m.unita] === "paio" ? "al paio" : "a " + esc(UNITA[m.unita])}</small></button>
          <span class="of-liv${basso ? " basso" : ""}"><i style="width:${Math.round(Math.min(1, Math.max(0, Number(m.scorta) / max)) * 100)}%"></i></span>
          <span class="of-q"><button type="button" onclick="ofScorta('${m.id}',-1)" aria-label="Meno">−</button><b class="${basso ? "rosso" : ""}">${String(Number(m.scorta)).replace(".", ",")}</b><button type="button" onclick="ofScorta('${m.id}',1)" aria-label="Più">+</button></span></div>`;
			}).join("") + `<button type="button" class="of-agg" onclick="ofFormMateriale()">+ Aggiungi materiale</button>`;
		} else ofDisegnaSpese(box);
	}
	function ofGiorniAiutanteMese(id) {
		const ym = OGGI().slice(0, 7);
		return Object.values(OF.giornate).filter((g) => g && g.aiutante_id === id && String(g.giorno).startsWith(ym)).length;
	}
	async function ofScorta(id, d) {
		const m = OF.materiali.find((x) => x.id === id);
		if (!m) return;
		m.scorta = Math.max(0, Math.round((Number(m.scorta) + d) * 100) / 100);
		ofDisegnaScheda();
		const { error } = await OfDB.salva("officina_materiali", {
			id,
			scorta: m.scorta
		});
		if (error) showToast("Non salvato: " + error.message);
	}
	async function ofLavoriMese(ym) {
		if (OF.lavoriMese?.ym === ym) return OF.lavoriMese.tot;
		const [y, m] = ym.split("-").map(Number);
		const tot = (await DB.listInterventiPeriodo(ym + "-01", isoLocale(new Date(y, m, 0))).catch(() => [])).filter((e) => e.stato === "fatto").reduce((t, e) => t + (Number(e.importo) || 0), 0);
		OF.lavoriMese = {
			ym,
			tot
		};
		return tot;
	}
	async function ofDisegnaSpese(box) {
		const ym = OF.mese;
		const spese = OF.spese.filter((s) => s.data.startsWith(ym));
		const tot = spese.reduce((t, s) => t + Number(s.importo), 0);
		const perCat = {};
		spese.forEach((s) => {
			perCat[s.categoria] = (perCat[s.categoria] || 0) + Number(s.importo);
		});
		const nasc = typeof incassiNascosti === "function" && incassiNascosti();
		box.innerHTML = `<div class="of-mesi"><button type="button" onclick="ofMese(-1)" aria-label="Mese prima">‹</button><b>${meseNome(ym)}</b><button type="button" onclick="ofMese(1)" aria-label="Mese dopo">›</button></div>
    <div class="of-netto"><div class="of-lab2">GUADAGNO NETTO</div><div class="of-big" id="of-netto-v">${nasc ? "—" : "…"}</div>
      <div class="of-cmp"><span>Lavori fatti<b class="verde" id="of-lavori-v">…</b></span><span>Spese<b class="rosso">− ${euroTondo(tot)}</b></span></div>
      ${tot ? `<div class="of-ciamb">${ofCiambella(perCat, tot)}<div class="of-leg">${Object.entries(perCat).sort((a, b) => b[1] - a[1]).map(([k, v]) => `<div><i style="background:${CAT_SPESA[k][1]}"></i>${CAT_SPESA[k][0]} ${euroTondo(v)}${k === "carburante" ? " <span class=\"of-beta\">BETA</span>" : ""}</div>`).join("")}</div></div>` : ""}
    </div>
    <div class="of-sez">Spese del mese <span onclick="ofFormSpesa()">+ Spesa</span></div>
    ${spese.length ? spese.map((s) => `<button type="button" class="of-voce" onclick="ofFormSpesa('${s.id}')"><span><b>${esc(s.descrizione)}</b><small>${formatDataBreve(s.data)} · ${CAT_SPESA[s.categoria][0]}</small></span><b>${euroTondo(s.importo)}${s.automatica ? "<i class=\"of-auto\">AUTO</i>" : ""}</b></button>`).join("") : "<div class=\"of-nota\">Nessuna spesa in questo mese.</div>"}`;
		if (nasc) return;
		const lav = await ofLavoriMese(ym);
		const lv = document.getElementById("of-lavori-v"), nv = document.getElementById("of-netto-v");
		if (lv) lv.textContent = euroTondo(lav);
		if (nv) nv.textContent = euroTondo(lav - tot);
	}
	function ofCiambella(perCat, tot) {
		const r = 15.9, c = 2 * Math.PI * r;
		let off = 0;
		return `<svg width="88" height="88" viewBox="0 0 42 42" aria-hidden="true"><circle cx="21" cy="21" r="${r}" fill="none" stroke="#eadfc2" stroke-width="6"/>${Object.entries(perCat).sort((a, b) => b[1] - a[1]).map(([k, v]) => {
			const l = v / tot * c;
			const s = `<circle cx="21" cy="21" r="${r}" fill="none" stroke="${CAT_SPESA[k][1]}" stroke-width="6" stroke-dasharray="${l.toFixed(2)} ${(c - l).toFixed(2)}" stroke-dashoffset="${(-off + c / 4).toFixed(2)}"/>`;
			off += l;
			return s;
		}).join("")}</svg>`;
	}
	function ofMese(d) {
		const [y, m] = OF.mese.split("-").map(Number);
		OF.mese = isoLocale(new Date(y, m - 1 + d, 1)).slice(0, 7);
		ofDisegnaScheda();
	}
	function ofApriMezzo(id) {
		OF.vista = "mezzo";
		OF.mezzoAperto = id;
		ofDisegna();
		document.getElementById("page-pro-officina")?.scrollTo?.(0, 0);
		window.scrollTo(0, 0);
	}
	function ofTornaOfficina() {
		OF.vista = "home";
		ofDisegna();
	}
	function ofDisegnaMezzo() {
		const m = ofMezzo(OF.mezzoAperto), t = tagliando(m);
		const storia = OF.interventi.filter((i) => i.mezzo_id === m.id).sort((a, b) => (a.stato === "da_fare" ? 0 : 1) - (b.stato === "da_fare" ? 0 : 1) || (a.stato === "da_fare" ? a.data.localeCompare(b.data) : b.data.localeCompare(a.data)));
		const scad = scadenzeMezzo(m).filter((s) => !s.k.startsWith("int:"));
		document.getElementById("of-root").innerHTML = `
    <div class="of-testa-m"><button type="button" class="of-tondo" onclick="ofTornaOfficina()" aria-label="Indietro">‹</button><div><b>${esc(nomeMezzo(m))}</b><small>${[
			TIPI_MEZZO[m.tipo],
			ALIM[m.alimentazione],
			m.cambio === "automatico" ? "automatico" : null,
			m.targa
		].filter(Boolean).map(esc).join(" · ")}</small></div><button type="button" class="of-tondo" onclick="ofFormMezzo('${m.id}')" aria-label="Modifica">✎</button></div>
    <div class="of-netto">
      <div class="of-lab2">TAGLIANDO · ${[t.ogniKm ? "OGNI " + fmtKm(t.ogniKm) + " KM" : null, t.ogniMesi ? t.ogniMesi + " MESI" : null].filter(Boolean).join(" O ") || "INTERVALLO NON IMPOSTATO"}</div>
      ${t.conDati ? `<div class="of-tg-r"><b>${t.kmFatti != null && t.ogniKm ? fmtKm(Math.max(0, t.kmFatti)) + " / " + fmtKm(t.ogniKm) + " km" : Math.round(t.perc * 100) + "%"}</b>${t.ogniKm ? "<span class=\"of-beta\">KM BETA</span>" : ""}</div>
      <div class="of-barra"><i style="width:${Math.round(t.perc * 100)}%"></i></div>
      <div class="of-tg-s"><span>ultimo: ${[m.ultimo_tagliando_km != null ? fmtKm(m.ultimo_tagliando_km) + " km" : null, m.ultimo_tagliando_data ? dataScad(m.ultimo_tagliando_data) : null].filter(Boolean).join(" · ") || "—"}</span><span>${t.data ? "entro " + dataScad(t.data) : ""}</span></div>` : "<div class=\"of-nota\" style=\"margin:6px 0\">Scrivi quando hai fatto l'ultimo tagliando (data e km) per vedere quanto manca.</div>"}
      <div class="of-az"><button type="button" class="btn btn-outline btn-sm" onclick="ofFormMezzo('${m.id}','tagliando')">Modifica intervallo</button><button type="button" class="btn btn-primary btn-sm" onclick="ofFormIntervento('${m.id}',null,'tagliando')">Tagliando fatto</button></div>
    </div>
    <div class="of-scad">${scad.filter((s) => s.k !== "tagliando").map((s) => {
			const st = statoScadenza(s);
			return `<div class="of-sc${st.colore === "#b5432f" || st.colore === "#d76b3a" ? " allerta" : ""}">${anello(st.perc, st.colore)}<span><b>${esc(s.titolo)}</b><small>${esc(testoScadenza(s))}</small></span></div>`;
		}).join("")}</div>
    <div class="of-sez">Storico e prossime <span onclick="ofFormIntervento('${m.id}')">+ intervento</span></div>
    <div class="of-time">${storia.length ? storia.map((i) => `<button type="button" class="of-ev${i.stato === "da_fare" ? " dafare" : ""}" onclick="ofFormIntervento('${m.id}','${i.id}')"><b>${INT_ICO[i.tipo] || "•"} ${esc(i.titolo)}</b> · ${formatDataBreve(i.data)}${i.km ? " · " + fmtKm(i.km) + " km" : ""}<small>${i.stato === "da_fare" ? "Da fare" : INT_TIPI[i.tipo]}${i.importo != null ? " · " + euroTondo(i.importo) + " · spesa registrata" : ""}${i.note ? " · " + esc(i.note) : ""}</small></button>`).join("") : "<div class=\"of-nota\">Ancora nessun intervento: aggiungi tagliandi, revisioni e riparazioni.</div>"}</div>
    <div class="of-box">
      <div class="of-rr"><span><b>Consumo medio</b><small>${m.consumo_l100 ? String(m.consumo_l100).replace(".", ",") + " l/100 km" : "non impostato"}${OF.imp?.prezzo_carburante ? " · " + (CARBURANTE[m.alimentazione] || "carburante").toLowerCase() + " " + String(OF.imp.prezzo_carburante).replace(".", ",") + " €/l" : ""}</small></span><button type="button" class="btn btn-outline btn-sm" onclick="ofFormMezzo('${m.id}')">Modifica</button></div>
      <div class="of-rr"><span><b>Mostra ai clienti</b><small>«${m.tipo === "furgone" ? "Furgone attrezzato " : ""}${esc(nomeMezzo(m))}» nella tua pagina pubblica</small></span><button type="button" class="of-tg${m.mostra_clienti ? " on" : ""}" onclick="ofMostraMezzo('${m.id}')" aria-label="Mostra ai clienti"></button></div>
    </div>`;
	}
	async function ofMostraMezzo(id) {
		const m = ofMezzo(id);
		if (!m) return;
		m.mostra_clienti = !m.mostra_clienti;
		const { error } = await OfDB.salva("officina_mezzi", {
			id,
			mostra_clienti: m.mostra_clienti
		});
		if (error) {
			m.mostra_clienti = !m.mostra_clienti;
			showToast("Non salvato");
		} else showToast(m.mostra_clienti ? "I clienti vedono il tuo mezzo nella pagina pubblica" : "Mezzo nascosto ai clienti");
		ofDisegna();
	}
	function ofModale(titolo, corpo, tasti) {
		document.getElementById("of-modal-tit").textContent = titolo;
		document.getElementById("of-modal-corpo").innerHTML = corpo;
		document.getElementById("of-modal-tasti").innerHTML = tasti || "";
		document.getElementById("of-modal-err").style.display = "none";
		openModal("modal-officina");
	}
	function ofErrore(t) {
		const e = document.getElementById("of-modal-err");
		e.textContent = t;
		e.style.display = "block";
	}
	var val = (id) => (document.getElementById(id)?.value ?? "").trim();
	var seg = (nome, opz, scelto) => `<div class="of-seg" data-seg="${nome}">${Object.entries(opz).map(([k, t]) => `<button type="button" data-v="${k}" class="${k === scelto ? "on" : ""}" onclick="ofSeg(this)">${t}</button>`).join("")}</div>`;
	function ofSeg(b) {
		b.parentElement.querySelectorAll("button").forEach((x) => x.classList.toggle("on", x === b));
		const s = b.parentElement.dataset.seg;
		if (s === "alim") ofMostraBombole();
		if (s === "tkm") document.getElementById("of-tkm-altro").style.display = b.dataset.v === "altro" ? "" : "none";
		if (s === "ckm") document.getElementById("of-ckm-altro").style.display = b.dataset.v === "altro" ? "" : "none";
		if (s === "cakm") document.getElementById("of-cakm-altro").style.display = b.dataset.v === "altro" ? "" : "none";
		if (s === "cambio") document.getElementById("of-box-cambio").style.display = b.dataset.v === "automatico" ? "" : "none";
		if (s === "itipo") ofTitoloDaTipo(b.dataset.v);
		if (s === "ctipo") ofAggiornaCompenso();
		if (s === "mcat") ofAggiornaMisura();
	}
	var segVal = (nome) => document.querySelector(`.of-seg[data-seg="${nome}"] .on`)?.dataset.v || null;
	var campo = (id, et, v, extra) => `<div class="of-campo"><label for="${id}">${et}</label><input class="input" id="${id}" value="${esc(v ?? "")}" ${extra || ""}></div>`;
	var toggle = (id, et, sotto, on) => `<div class="of-rr"><span><b>${et}</b>${sotto ? `<small>${sotto}</small>` : ""}</span><button type="button" class="of-tg${on ? " on" : ""}" id="${id}" onclick="this.classList.toggle('on')" aria-label="${et}"></button></div>`;
	var tgOn = (id) => !!document.getElementById(id)?.classList.contains("on");
	function ofCampiMezzo(m) {
		m = m || {
			tipo: "furgone",
			alimentazione: "diesel",
			tagliando_km: 15e3,
			tagliando_mesi: 12
		};
		const tkm = [
			1e4,
			15e3,
			2e4,
			3e4
		].includes(Number(m.tagliando_km)) ? String(m.tagliando_km) : m.tagliando_km ? "altro" : "";
		const ckm = [
			12e4,
			15e4,
			18e4,
			24e4
		].includes(Number(m.cinghia_km)) ? String(m.cinghia_km) : m.cinghia_km ? "altro" : "no";
		const cakm = [
			4e4,
			6e4,
			8e4,
			1e5
		].includes(Number(m.cambio_aut_km)) ? String(m.cambio_aut_km) : m.cambio_aut_km ? "altro" : "no";
		return `
    <div class="of-campo"><label>TIPO</label>${seg("tipo", TIPI_MEZZO, m.tipo)}</div>
    <div class="of-due">${campo("of-marca", "MARCA", m.marca, "placeholder=\"es. Fiat\" maxlength=\"40\"")}${campo("of-modello", "MODELLO", m.modello, "placeholder=\"es. Ducato\" maxlength=\"60\"")}</div>
    <div class="of-due">${campo("of-targa", "TARGA", m.targa, "placeholder=\"AA 123 BB\" maxlength=\"15\" style=\"text-transform:uppercase\"")}${campo("of-imm", "IMMATRICOLATO", m.immatricolazione ? m.immatricolazione.slice(0, 7) : "", "type=\"month\"")}</div>
    <div class="of-campo"><label>ALIMENTAZIONE</label>${seg("alim", ALIM, m.alimentazione)}</div>
    <div class="of-campo"><label>CAMBIO</label>${seg("cambio", {
			manuale: "Manuale",
			automatico: "Automatico"
		}, m.cambio || "manuale")}</div>
    <div class="of-due">${campo("of-km", "KM ATTUALI", m.km_attuali, "inputmode=\"numeric\" placeholder=\"es. 128400\"")}${campo("of-cons", "CONSUMO L/100 KM", m.consumo_l100 != null ? String(m.consumo_l100).replace(".", ",") : "", "inputmode=\"decimal\" placeholder=\"es. 9,5\"")}</div>
    <div class="of-box" id="of-box-tagliando">
      <div class="of-rr"><span><b>Tagliando ogni</b><small>vale quello che arriva prima, km o mesi</small></span></div>
      ${seg("tkm", {
			1e4: "10.000",
			15e3: "15.000 km",
			2e4: "20.000",
			3e4: "30.000",
			altro: "Altro…"
		}, tkm)}
      <div class="of-campo" id="of-tkm-altro" style="${tkm === "altro" ? "" : "display:none"};margin-top:6px">${campo("of-tkm-n", "KM (es. 12000)", tkm === "altro" ? m.tagliando_km : "", "inputmode=\"numeric\"").replace("<div class=\"of-campo\">", "").replace(/<\/div>$/, "")}</div>
      <div style="margin-top:6px">${seg("tmesi", {
			6: "6 mesi",
			12: "12 mesi",
			24: "24 mesi",
			0: "solo km"
		}, String(m.tagliando_mesi ?? 0))}</div>
      <div class="of-due" style="margin-top:8px">${campo("of-ult-data", "ULTIMO TAGLIANDO", m.ultimo_tagliando_data, "type=\"date\"")}${campo("of-ult-km", "A QUANTI KM", m.ultimo_tagliando_km, "inputmode=\"numeric\"")}</div>
    </div>
    <div class="of-box" id="of-box-cambio" style="${m.cambio === "automatico" ? "" : "display:none"}">
      <div class="of-rr"><span><b>Tagliando cambio automatico ogni</b><small>vale quello che arriva prima, km o anni · se non l'hai mai fatto si conta dall'immatricolazione</small></span></div>
      ${seg("cakm", {
			4e4: "40.000",
			6e4: "60.000",
			8e4: "80.000",
			1e5: "100.000",
			altro: "Altro…",
			no: "Non so"
		}, cakm)}
      <div class="of-campo" id="of-cakm-altro" style="${cakm === "altro" ? "" : "display:none"};margin-top:6px">${campo("of-cakm-n", "KM (es. 70000)", cakm === "altro" ? m.cambio_aut_km : "", "inputmode=\"numeric\"").replace("<div class=\"of-campo\">", "").replace(/<\/div>$/, "")}</div>
      <div style="margin-top:6px">${seg("caanni", {
			4: "4 anni",
			5: "5 anni",
			6: "6 anni",
			0: "solo km"
		}, String(m.cambio_aut_anni ?? 0))}</div>
      <div class="of-due" style="margin-top:8px">${campo("of-ca-data", "ULTIMO TAGLIANDO CAMBIO", m.ultimo_cambio_aut_data, "type=\"date\"")}${campo("of-ca-km", "A QUANTI KM", m.ultimo_cambio_aut_km, "inputmode=\"numeric\"")}</div>
    </div>
    <div class="of-box" id="of-box-cinghia">
      <div class="of-rr"><span><b>Cinghia distribuzione ogni</b><small>vale quello che arriva prima, km o anni · se non l'hai mai cambiata si conta dall'immatricolazione</small></span></div>
      ${seg("ckm", {
			12e4: "120.000",
			15e4: "150.000",
			18e4: "180.000",
			24e4: "240.000",
			altro: "Altro…",
			no: "Catena / non so"
		}, ckm)}
      <div class="of-campo" id="of-ckm-altro" style="${ckm === "altro" ? "" : "display:none"};margin-top:6px">${campo("of-ckm-n", "KM (es. 200000)", ckm === "altro" ? m.cinghia_km : "", "inputmode=\"numeric\"").replace("<div class=\"of-campo\">", "").replace(/<\/div>$/, "")}</div>
      <div style="margin-top:6px">${seg("canni", {
			5: "5 anni",
			6: "6 anni",
			8: "8 anni",
			10: "10 anni",
			0: "solo km"
		}, String(m.cinghia_anni ?? 0))}</div>
      <div class="of-due" style="margin-top:8px">${campo("of-cin-data", "ULTIMA SOSTITUZIONE", m.ultima_cinghia_data, "type=\"date\"")}${campo("of-cin-km", "A QUANTI KM", m.ultima_cinghia_km, "inputmode=\"numeric\"")}</div>
    </div>
    <div class="of-box">
      <div class="of-due">${campo("of-rev", "REVISIONE", m.revisione_data || "", "type=\"date\"")}${campo("of-ass", "ASSICURAZIONE", m.assicurazione_data, "type=\"date\"")}</div>
      <div class="of-nota" style="margin:-2px 0 6px">Senza data la revisione si calcola dall'immatricolazione: dopo 4 anni, poi ogni 2.</div>
      <div class="of-due">${campo("of-bollo", "BOLLO", m.bollo_data, "type=\"date\"")}<div id="of-bombole-box">${campo("of-bomb", "COLLAUDO BOMBOLE", m.bombole_data, "type=\"date\"")}</div></div>
      ${toggle("of-mostra", "Mostra ai clienti", "marca e modello nella tua pagina pubblica", m.mostra_clienti)}
      ${OF.mezzi.length > (m.id ? 1 : 0) ? toggle("of-pred-m", "Mezzo predefinito", "proposto ogni giorno", m.id ? m.id === OF.imp?.mezzo_predefinito : !OF.mezzi.length) : ""}
    </div>`;
	}
	function ofMostraBombole() {
		const b = document.getElementById("of-bombole-box");
		if (b) b.style.visibility = ["gpl", "metano"].includes(segVal("alim")) ? "visible" : "hidden";
	}
	function ofLeggiMezzo() {
		const tkm = segVal("tkm");
		const imm = val("of-imm");
		const kmAltro = num(val("of-tkm-n")), ckm = segVal("ckm"), ckmAltro = num(val("of-ckm-n"));
		const cambio = segVal("cambio") || "manuale", aut = cambio === "automatico", cakm = segVal("cakm"), cakmAltro = num(val("of-cakm-n"));
		const riga = {
			tipo: segVal("tipo") || "furgone",
			marca: val("of-marca") || null,
			modello: val("of-modello") || null,
			targa: val("of-targa").toUpperCase() || null,
			immatricolazione: imm ? imm + "-01" : null,
			alimentazione: segVal("alim"),
			km_attuali: num(val("of-km")) != null ? Math.round(num(val("of-km"))) : null,
			consumo_l100: num(val("of-cons")),
			tagliando_km: tkm === "altro" ? kmAltro ? Math.round(kmAltro) : null : tkm ? Number(tkm) : null,
			tagliando_mesi: Number(segVal("tmesi")) || null,
			ultimo_tagliando_data: val("of-ult-data") || null,
			ultimo_tagliando_km: num(val("of-ult-km")) != null ? Math.round(num(val("of-ult-km"))) : null,
			cinghia_km: ckm === "altro" ? ckmAltro ? Math.round(ckmAltro) : null : ckm && ckm !== "no" ? Number(ckm) : null,
			cinghia_anni: Number(segVal("canni")) || null,
			cambio,
			cambio_aut_km: !aut ? null : cakm === "altro" ? cakmAltro ? Math.round(cakmAltro) : null : cakm && cakm !== "no" ? Number(cakm) : null,
			cambio_aut_anni: aut ? Number(segVal("caanni")) || null : null,
			ultimo_cambio_aut_data: aut ? val("of-ca-data") || null : null,
			ultimo_cambio_aut_km: aut && num(val("of-ca-km")) != null ? Math.round(num(val("of-ca-km"))) : null,
			ultima_cinghia_data: val("of-cin-data") || null,
			ultima_cinghia_km: num(val("of-cin-km")) != null ? Math.round(num(val("of-cin-km"))) : null,
			revisione_data: val("of-rev") || null,
			assicurazione_data: val("of-ass") || null,
			bollo_data: val("of-bollo") || null,
			bombole_data: ["gpl", "metano"].includes(segVal("alim")) ? val("of-bomb") || null : null,
			mostra_clienti: tgOn("of-mostra")
		};
		if (!riga.marca && !riga.modello) return { errore: "Scrivi almeno marca o modello." };
		if (riga.tagliando_km != null && (riga.tagliando_km < 1e3 || riga.tagliando_km > 1e5)) return { errore: "Tagliando: scegli tra 1.000 e 100.000 km." };
		if (riga.cambio_aut_km != null && (riga.cambio_aut_km < 1e4 || riga.cambio_aut_km > 3e5)) return { errore: "Tagliando del cambio: scegli tra 10.000 e 300.000 km." };
		if (riga.cinghia_km != null && (riga.cinghia_km < 1e4 || riga.cinghia_km > 4e5)) return { errore: "Cinghia: scegli tra 10.000 e 400.000 km." };
		if (riga.km_attuali != null) riga.km_aggiornati_il = OGGI();
		return {
			riga,
			predefinito: document.getElementById("of-pred-m") ? tgOn("of-pred-m") : !OF.mezzi.length
		};
	}
	function ofFormMezzo(id, focus) {
		const m = id ? ofMezzo(id) : null;
		ofForm = {
			tipo: "mezzo",
			id
		};
		ofModale(m ? "Modifica " + nomeMezzo(m) : "Nuovo mezzo", ofCampiMezzo(m), `${m ? `<button type="button" class="btn btn-ghost" style="color:var(--red)" onclick="ofArchiviaMezzo('${m.id}')">Archivia</button>` : ""}<button type="button" class="btn btn-primary" onclick="ofSalvaMezzo()">Salva</button>`);
		ofMostraBombole();
		if (focus === "tagliando" || focus === "cinghia") setTimeout(() => document.getElementById("of-box-" + focus)?.scrollIntoView({ block: "center" }), 200);
	}
	async function ofSalvaMezzo(dalWizard) {
		const r = ofLeggiMezzo();
		if (r.errore) {
			ofErrore(r.errore);
			return false;
		}
		const { data, error } = await OfDB.salva("officina_mezzi", {
			...ofForm?.id ? { id: ofForm.id } : {},
			...r.riga,
			aggiornato_il: (/* @__PURE__ */ new Date()).toISOString()
		});
		if (error) {
			ofErrore("Non salvato: " + error.message);
			return false;
		}
		if (r.predefinito || !OF.imp?.mezzo_predefinito) {
			const imp = await OfDB.impostazioni({ mezzo_predefinito: data.id });
			if (!imp.error) OF.imp = imp.data;
		}
		const i = OF.mezzi.findIndex((x) => x.id === data.id);
		if (i >= 0) OF.mezzi[i] = data;
		else OF.mezzi.push(data);
		ofPromemoriaScadenze(data);
		if (!dalWizard) {
			closeModal("modal-officina");
			showToast("Mezzo salvato: scadenze e promemoria aggiornati");
			ofDisegna();
			ofAggiornaRiepiloghi();
		}
		return true;
	}
	async function ofArchiviaMezzo(id) {
		if (!confirm("Archiviare questo mezzo? Lo storico e le spese restano.")) return;
		await OfDB.salva("officina_mezzi", {
			id,
			archiviato: true
		});
		OF.mezzi = OF.mezzi.filter((m) => m.id !== id);
		OF.vista = "home";
		closeModal("modal-officina");
		ofDisegna();
		ofAggiornaRiepiloghi();
	}
	function ofFormIntervento(mezzoId, id, tipo) {
		const i = id ? OF.interventi.find((x) => x.id === id) : null, m = ofMezzo(mezzoId);
		ofForm = {
			tipo: "intervento",
			id,
			mezzoId
		};
		const t = i?.tipo || tipo || "altro";
		ofModale(i ? "Modifica intervento" : t === "tagliando" ? "Tagliando fatto" : t === "tagliando_cambio" ? "Tagliando del cambio fatto" : t === "cinghia" ? "Cinghia cambiata" : "Nuovo intervento", `
    <div class="of-campo"><label>TIPO</label>${seg("itipo", Object.fromEntries(Object.entries(INT_TIPI).filter(([k]) => k !== "tagliando_cambio" || m?.cambio === "automatico" || t === k)), t)}</div>
    ${campo("of-i-tit", "DESCRIZIONE", i?.titolo || (t !== "altro" ? INT_TIPI[t] : ""), "maxlength=\"80\" placeholder=\"es. Cambio gomme invernali\"")}
    <div class="of-campo"><label>STATO</label>${seg("istato", {
			fatto: "Fatto",
			da_fare: "Da fare"
		}, i?.stato || "fatto")}</div>
    <div class="of-due">${campo("of-i-data", "DATA", i?.data || OGGI(), "type=\"date\"")}${campo("of-i-km", "KM DEL MEZZO", i?.km ?? m?.km_attuali ?? "", "inputmode=\"numeric\"")}</div>
    <div class="of-due">${campo("of-i-eur", "COSTO €", i?.importo != null ? String(i.importo).replace(".", ",") : "", "inputmode=\"decimal\" placeholder=\"es. 380\"")}${campo("of-i-note", "OFFICINA / NOTE", i?.note, "maxlength=\"300\"")}</div>
    <div class="of-nota">Con il costo diventa una spesa «Mezzo». Tagliando, revisione, cinghia e tagliando del cambio fatti aggiornano da soli le scadenze.</div>`, `${i ? `<button type="button" class="btn btn-ghost" style="color:var(--red)" onclick="ofEliminaIntervento('${i.id}')">Elimina</button>` : ""}<button type="button" class="btn btn-primary" onclick="ofSalvaIntervento()">Salva</button>`);
	}
	function ofTitoloDaTipo(t) {
		const el = document.getElementById("of-i-tit");
		if (!el) return;
		if (!el.value || Object.values(INT_TIPI).includes(el.value)) el.value = t !== "altro" ? INT_TIPI[t] : "";
	}
	async function ofSalvaIntervento() {
		const f = ofForm, m = ofMezzo(f.mezzoId);
		const riga = {
			mezzo_id: f.mezzoId,
			tipo: segVal("itipo") || "altro",
			titolo: val("of-i-tit") || INT_TIPI[segVal("itipo")] || "Intervento",
			stato: segVal("istato") || "fatto",
			data: val("of-i-data") || OGGI(),
			km: num(val("of-i-km")) != null ? Math.round(num(val("of-i-km"))) : null,
			importo: num(val("of-i-eur")),
			note: val("of-i-note") || null
		};
		const { data, error } = await OfDB.salva("officina_interventi", {
			...f.id ? { id: f.id } : {},
			...riga
		});
		if (error) {
			ofErrore("Non salvato: " + error.message);
			return;
		}
		const k = OF.interventi.findIndex((x) => x.id === data.id);
		if (k >= 0) OF.interventi[k] = data;
		else OF.interventi.unshift(data);
		await OfDB.spesaAuto(`int:${data.id}`, riga.stato === "fatto" && riga.importo ? {
			data: riga.data,
			categoria: "mezzo",
			descrizione: `${riga.titolo} · ${nomeMezzo(m)}`.slice(0, 120),
			importo: riga.importo,
			mezzo_id: m?.id || null
		} : null);
		if (m && riga.stato === "fatto") {
			const agg = {};
			if (riga.tipo === "tagliando") {
				agg.ultimo_tagliando_data = riga.data;
				if (riga.km != null) agg.ultimo_tagliando_km = riga.km;
			}
			if (riga.tipo === "tagliando_cambio") {
				agg.ultimo_cambio_aut_data = riga.data;
				if (riga.km != null) agg.ultimo_cambio_aut_km = riga.km;
			}
			if (riga.tipo === "cinghia") {
				agg.ultima_cinghia_data = riga.data;
				if (riga.km != null) agg.ultima_cinghia_km = riga.km;
			}
			if (riga.tipo === "revisione") {
				const d = /* @__PURE__ */ new Date(riga.data + "T12:00");
				d.setFullYear(d.getFullYear() + 2);
				agg.revisione_data = isoLocale(d);
			}
			if (riga.tipo === "bombole") {
				const d = /* @__PURE__ */ new Date(riga.data + "T12:00");
				d.setFullYear(d.getFullYear() + 4);
				agg.bombole_data = isoLocale(d);
			}
			if (riga.km != null && (m.km_attuali == null || riga.km > m.km_attuali)) {
				agg.km_attuali = riga.km;
				agg.km_aggiornati_il = OGGI();
			}
			if (Object.keys(agg).length) {
				const r = await OfDB.salva("officina_mezzi", {
					id: m.id,
					...agg
				});
				if (!r.error) Object.assign(m, r.data || agg);
				ofPromemoriaScadenze(m);
			}
		}
		await ofCaricaSpese();
		closeModal("modal-officina");
		showToast("Intervento salvato");
		ofDisegna();
		ofAggiornaRiepiloghi();
	}
	async function ofEliminaIntervento(id) {
		if (!confirm("Eliminare questo intervento? Si toglie anche la sua spesa.")) return;
		await OfDB.elimina("officina_interventi", id);
		await OfDB.spesaAuto(`int:${id}`, null);
		OF.interventi = OF.interventi.filter((x) => x.id !== id);
		await ofCaricaSpese();
		closeModal("modal-officina");
		ofDisegna();
	}
	function ofCampiAiutante(a, prefisso) {
		const p = prefisso || "of-a";
		return `${campo(p + "-nome", "NOME", a?.nome, "maxlength=\"60\" placeholder=\"es. Marco Neri\"")}
    ${campo(p + "-tel", "TELEFONO (FACOLTATIVO)", a?.telefono, "inputmode=\"tel\" maxlength=\"30\"")}
    <div class="of-campo"><label>COMPENSO</label>${seg("ctipo", {
			giornata: "A giornata",
			cavallo: "A cavallo",
			ora: "All'ora"
		}, a?.compenso_tipo || "giornata")}</div>
    ${campo(p + "-eur", "EURO A GIORNATA", a?.compenso != null ? String(a.compenso).replace(".", ",") : "", "inputmode=\"decimal\" placeholder=\"es. 80\"")}`;
	}
	function ofAggiornaCompenso() {
		const l = document.querySelector("label[for=\"of-a-eur\"]");
		if (l) l.textContent = {
			giornata: "EURO A GIORNATA",
			cavallo: "EURO A CAVALLO",
			ora: "EURO ALL'ORA"
		}[segVal("ctipo")] || "EURO";
	}
	function ofFormAiutante(id) {
		const a = id ? ofAiutante(id) : null;
		ofForm = {
			tipo: "aiutante",
			id
		};
		ofModale(a ? "Modifica aiutante" : "Nuovo aiutante", ofCampiAiutante(a) + toggle("of-a-pred", "Aiutante predefinito", "proposto ogni giorno, lo cambi con un tocco", a ? a.id === OF.imp?.aiutante_predefinito : !OF.aiutanti.length) + `<div class="of-nota">Il cliente vede «Intervento eseguito con l'aiutante ${esc(a?.nome || "…")}» nel PDF e nel messaggio in chat.</div>`, `${a ? `<button type="button" class="btn btn-ghost" style="color:var(--red)" onclick="ofTogliAiutante('${a.id}')">Togli</button>` : ""}<button type="button" class="btn btn-primary" onclick="ofSalvaAiutante()">Salva</button>`);
		ofAggiornaCompenso();
	}
	async function ofSalvaAiutante(dalWizard) {
		const nome = val("of-a-nome");
		if (!nome) {
			ofErrore("Scrivi il nome dell'aiutante.");
			return false;
		}
		const riga = {
			nome: nome.slice(0, 60),
			telefono: val("of-a-tel") || null,
			compenso_tipo: segVal("ctipo") || "giornata",
			compenso: num(val("of-a-eur")) || 0
		};
		const { data, error } = await OfDB.salva("officina_aiutanti", {
			...ofForm?.id ? { id: ofForm.id } : {},
			...riga
		});
		if (error) {
			ofErrore("Non salvato: " + error.message);
			return false;
		}
		const i = OF.aiutanti.findIndex((x) => x.id === data.id);
		if (i >= 0) OF.aiutanti[i] = data;
		else OF.aiutanti.push(data);
		if (document.getElementById("of-a-pred") ? tgOn("of-a-pred") : !OF.imp?.aiutante_predefinito) {
			const r = await OfDB.impostazioni({ aiutante_predefinito: data.id });
			if (!r.error) OF.imp = r.data;
		} else if (OF.imp?.aiutante_predefinito === data.id) {
			const r = await OfDB.impostazioni({ aiutante_predefinito: null });
			if (!r.error) OF.imp = r.data;
		}
		if (!dalWizard) {
			closeModal("modal-officina");
			showToast("Aiutante salvato");
			ofDisegna();
		}
		return true;
	}
	async function ofTogliAiutante(id) {
		if (!confirm("Togliere questo aiutante? Le spese e gli appuntamenti passati restano.")) return;
		await OfDB.salva("officina_aiutanti", {
			id,
			attivo: false
		});
		OF.aiutanti = OF.aiutanti.filter((a) => a.id !== id);
		if (OF.imp?.aiutante_predefinito === id) {
			const r = await OfDB.impostazioni({ aiutante_predefinito: null });
			if (!r.error) OF.imp = r.data;
		}
		closeModal("modal-officina");
		ofDisegna();
	}
	function ofCampiMateriale(m) {
		return `${m ? "" : `<div class="of-campo"><label>SCELTE RAPIDE</label><div class="of-seg of-rapidi">${MAT_RAPIDI.map((r, i) => `<button type="button" onclick="ofMatRapido(${i})">${esc(r[0])}</button>`).join("")}</div></div>`}
    <div class="of-campo"><label>CATEGORIA</label>${seg("mcat", CAT_MAT, m?.categoria || "ferri")}</div>
    <div class="of-due">${campo("of-m-nome", "NOME", m?.nome, "maxlength=\"60\" placeholder=\"es. Ferri anteriori\"")}<div id="of-m-mis-box">${campo("of-m-mis", "MISURA", m?.misura, "maxlength=\"20\" placeholder=\"es. 2 o 4x0\"")}</div></div>
    <div class="of-due"><div class="of-campo"><label for="of-m-un">UNITÀ</label><select class="input" id="of-m-un">${Object.entries(UNITA).map(([k, t]) => `<option value="${k}"${(m?.unita || "paio") === k ? " selected" : ""}>${t}</option>`).join("")}</select></div>${campo("of-m-eur", "COSTO € PER UNITÀ", m?.costo != null ? String(m.costo).replace(".", ",") : "", "inputmode=\"decimal\"")}</div>
    <div class="of-due">${campo("of-m-sc", "SCORTA ATTUALE", m?.scorta != null ? String(m.scorta).replace(".", ",") : "", "inputmode=\"decimal\"")}${campo("of-m-min", "AVVISAMI SOTTO", m?.scorta_minima != null ? String(m.scorta_minima).replace(".", ",") : "", "inputmode=\"decimal\"")}</div>
    <div class="of-nota">I ferri con la misura uguale a quella dei lavori («ferri nuovi») si scalano da soli dalla scorta e diventano spesa.</div>`;
	}
	function ofMatRapido(i) {
		const [nome, cat, un] = MAT_RAPIDI[i] || [];
		if (!nome) return;
		document.getElementById("of-m-nome").value = nome;
		document.querySelector(`.of-seg[data-seg="mcat"] [data-v="${cat}"]`)?.click();
		const u = document.getElementById("of-m-un");
		if (u) u.value = un;
		document.querySelectorAll(".of-rapidi button").forEach((b, k) => b.classList.toggle("on", k === i));
		document.getElementById(cat === "ferri" ? "of-m-mis" : "of-m-eur")?.focus();
	}
	function ofAggiornaMisura() {
		const b = document.getElementById("of-m-mis-box");
		if (b) b.style.visibility = segVal("mcat") === "ferri" ? "visible" : "hidden";
	}
	function ofFormMateriale(id) {
		const m = id ? OF.materiali.find((x) => x.id === id) : null;
		ofForm = {
			tipo: "materiale",
			id
		};
		ofModale(m ? "Modifica materiale" : "Nuovo materiale", ofCampiMateriale(m), `${m ? `<button type="button" class="btn btn-ghost" style="color:var(--red)" onclick="ofTogliMateriale('${m.id}')">Togli</button>` : ""}<button type="button" class="btn btn-primary" onclick="ofSalvaMateriale()">Salva</button>`);
		ofAggiornaMisura();
	}
	async function ofSalvaMateriale(dalWizard) {
		const nome = val("of-m-nome");
		if (!nome) {
			ofErrore("Scrivi il nome del materiale.");
			return false;
		}
		const cat = segVal("mcat") || "altro";
		const riga = {
			categoria: cat,
			nome: nome.slice(0, 60),
			misura: cat === "ferri" ? val("of-m-mis") || null : null,
			unita: val("of-m-un") || "pezzo",
			costo: num(val("of-m-eur")) || 0,
			scorta: num(val("of-m-sc")) || 0,
			scorta_minima: num(val("of-m-min"))
		};
		const { data, error } = await OfDB.salva("officina_materiali", {
			...ofForm?.id ? { id: ofForm.id } : {},
			...riga
		});
		if (error) {
			ofErrore("Non salvato: " + error.message);
			return false;
		}
		const i = OF.materiali.findIndex((x) => x.id === data.id);
		if (i >= 0) OF.materiali[i] = data;
		else OF.materiali.push(data);
		if (!dalWizard) {
			closeModal("modal-officina");
			showToast("Materiale salvato");
			ofDisegna();
		}
		return true;
	}
	async function ofTogliMateriale(id) {
		if (!confirm("Togliere questo materiale dall'elenco?")) return;
		await OfDB.salva("officina_materiali", {
			id,
			attivo: false
		});
		OF.materiali = OF.materiali.filter((m) => m.id !== id);
		closeModal("modal-officina");
		ofDisegna();
	}
	async function ofFormSpesa(id) {
		if (!OF.caricato) await ofCarica();
		if (!OF.sqlOk) {
			showToast("Le spese arrivano con l'aggiornamento di Equo.");
			return;
		}
		const s = id ? OF.spese.find((x) => x.id === id) : null;
		ofForm = {
			tipo: "spesa",
			id
		};
		ofModale(s ? "Modifica spesa" : "Nuova spesa", `
    <div class="of-campo"><label>CATEGORIA</label>${seg("scat", Object.fromEntries(Object.entries(CAT_SPESA).map(([k, v]) => [k, v[0]])), s?.categoria || "materiali")}</div>
    ${campo("of-s-desc", "DESCRIZIONE", s?.descrizione, "maxlength=\"120\" placeholder=\"es. Pneumatici invernali\"")}
    <div class="of-due">${campo("of-s-eur", "IMPORTO €", s?.importo != null ? String(s.importo).replace(".", ",") : "", "inputmode=\"decimal\"")}${campo("of-s-data", "DATA", s?.data || OGGI(), "type=\"date\"")}</div>
    ${OF.mezzi.length ? `<div class="of-campo"><label for="of-s-mezzo">MEZZO (FACOLTATIVO)</label><select class="input" id="of-s-mezzo"><option value="">—</option>${OF.mezzi.map((m) => `<option value="${m.id}"${s?.mezzo_id === m.id ? " selected" : ""}>${esc(nomeMezzo(m))}</option>`).join("")}</select></div>` : ""}
    ${s?.automatica ? "<div class=\"of-nota\">Spesa automatica: se la cambi a mano, si ricalcola quando salvi di nuovo quella giornata.</div>" : ""}`, `${s ? `<button type="button" class="btn btn-ghost" style="color:var(--red)" onclick="ofEliminaSpesa('${s.id}')">Elimina</button>` : ""}<button type="button" class="btn btn-primary" onclick="ofSalvaSpesa()">Salva</button>`);
	}
	async function ofSalvaSpesa() {
		const desc = val("of-s-desc"), imp = num(val("of-s-eur"));
		if (!desc) {
			ofErrore("Scrivi cosa hai pagato.");
			return;
		}
		if (imp == null || imp < 0) {
			ofErrore("Scrivi l'importo.");
			return;
		}
		const riga = {
			categoria: segVal("scat") || "altro",
			descrizione: desc.slice(0, 120),
			importo: Math.round(imp * 100) / 100,
			data: val("of-s-data") || OGGI(),
			mezzo_id: val("of-s-mezzo") || null
		};
		const { error } = await OfDB.salva("officina_spese", {
			...ofForm?.id ? { id: ofForm.id } : {},
			...riga
		});
		if (error) {
			ofErrore("Non salvata: " + error.message);
			return;
		}
		await ofCaricaSpese();
		closeModal("modal-officina");
		showToast("Spesa salvata");
		OF.scheda = "spese";
		OF.mese = riga.data.slice(0, 7);
		if (document.getElementById("page-pro-officina")?.classList.contains("active")) ofDisegna();
		ofAggiornaRiepiloghi();
	}
	async function ofEliminaSpesa(id) {
		if (!confirm("Eliminare questa spesa?")) return;
		await OfDB.elimina("officina_spese", id);
		await ofCaricaSpese();
		closeModal("modal-officina");
		ofDisegna();
		ofAggiornaRiepiloghi();
	}
	async function ofApriGiornata(giorno) {
		if (!OF.caricato) await ofCarica();
		if (!OF.sqlOk) {
			showToast("Officina mobile arriva con l'aggiornamento di Equo.");
			return;
		}
		giorno = giorno || OGGI();
		const g = await ofGiornataProposta(giorno);
		ofForm = {
			tipo: "giornata",
			g
		};
		const stima = OF.kmStime[giorno];
		const mat = g.materiali || [];
		ofModale(giorno === OGGI() ? "La tua giornata" : "Giornata del " + formatDataBreve(giorno), `
    <div class="of-nota" style="margin-top:-4px">Vale per tutti gli appuntamenti del giorno; il singolo appuntamento si cambia aprendolo.</div>
    <div class="of-lab">MEZZO</div><div class="of-chips" data-seg="gm">${OF.mezzi.map((m) => `<button type="button" data-v="${m.id}" class="${m.id === g.mezzo_id ? "on" : ""}" onclick="ofSeg(this)">${icoMezzo(m)} ${esc(nomeMezzo(m))}</button>`).join("") || "<span class=\"of-nota\">Nessun mezzo</span>"}</div>
    <div class="of-lab">AIUTANTE</div><div class="of-chips" data-seg="ga">${OF.aiutanti.map((a) => `<button type="button" data-v="${a.id}" class="${a.id === g.aiutante_id ? "on" : ""}" onclick="ofSeg(this)">${esc(a.nome)}</button>`).join("")}<button type="button" data-v="" class="${!g.aiutante_id ? "on" : ""}" onclick="ofSeg(this)">Da solo</button></div>
    ${OF.aiutanti.some((a) => a.compenso_tipo === "ora") ? campo("of-g-ore", "ORE DI LAVORO (AIUTANTE ALL'ORA)", g.ore ?? 8, "inputmode=\"decimal\"") : ""}
    <div class="of-lab">CHILOMETRI <span class="of-beta">BETA</span></div>
    <div class="of-km"><div style="flex:1"><small>${stima?.giro?.length ? esc([
			"Base",
			...stima.giro.map((t) => t.split(",")[0]),
			stima.senzaBase ? null : "Base"
		].filter(Boolean).join(" → ")) : "Nessuna tappa in agenda"}</small>
      <input class="input of-km-inp" id="of-g-km" inputmode="decimal" value="${g.km != null ? String(g.km).replace(".", ",") : ""}" placeholder="km"></div></div>
    <div class="of-beta-nota">Funzione in Beta · calcoli approssimativi sulle strade${g.km_stimati != null ? ` · stima: ${fmtKm(g.km_stimati)} km` : ""}</div>
    <div class="of-lab">MATERIALI USATI</div>
    <div id="of-g-mat">${mat.map((x, i) => ofRigaMatGiorno(x, i)).join("")}</div>
    ${OF.materiali.length ? `<div class="of-due"><select class="input" id="of-g-add">${OF.materiali.map((m) => `<option value="${m.id}">${esc(m.nome)}${m.misura ? " n. " + esc(m.misura) : ""}</option>`).join("")}</select><button type="button" class="btn btn-outline btn-sm" onclick="ofAggiungiMatGiorno()">+ Aggiungi</button></div>` : "<div class=\"of-nota\">Aggiungi i materiali nella scheda «Materiali».</div>"}`, `<button type="button" class="btn btn-primary" style="width:100%" onclick="ofSalvaGiornataDaForm()">Salva la giornata</button>`);
	}
	function ofRigaMatGiorno(x, i) {
		const m = OF.materiali.find((y) => y.id === x.materiale_id);
		return `<div class="of-g-mat" data-i="${i}" data-id="${x.materiale_id}"><span>${esc(m?.nome || "Materiale")}${x.auto ? " <i class=\"of-auto\">DAI LAVORI</i>" : ""}</span><input class="input" inputmode="decimal" value="${String(x.quantita).replace(".", ",")}"><small>${esc(UNITA[m?.unita] || "")}</small></div>`;
	}
	function ofAggiungiMatGiorno() {
		const id = val("of-g-add");
		if (!id) return;
		const box = document.getElementById("of-g-mat");
		box.insertAdjacentHTML("beforeend", ofRigaMatGiorno({
			materiale_id: id,
			quantita: 1
		}, box.children.length));
	}
	async function ofSalvaGiornataDaForm() {
		const g = ofForm.g;
		g.mezzo_id = document.querySelector("[data-seg=\"gm\"] .on")?.dataset.v || null;
		g.aiutante_id = document.querySelector("[data-seg=\"ga\"] .on")?.dataset.v || null;
		if (document.getElementById("of-g-ore")) g.ore = num(val("of-g-ore"));
		const km = num(val("of-g-km"));
		g.km_corretti = km != null && km !== g.km_stimati;
		g.km = km;
		g.materiali = [...document.querySelectorAll("#of-g-mat .of-g-mat")].map((r) => ({
			materiale_id: r.dataset.id,
			quantita: num(r.querySelector("input").value) || 0,
			auto: !!r.querySelector(".of-auto")
		}));
		if (await ofSalvaGiornata(g)) {
			closeModal("modal-officina");
			showToast("Giornata salvata: spese aggiornate");
			if (document.getElementById("page-pro-officina")?.classList.contains("active")) ofDisegna();
			ofAggiornaRiepiloghi();
			ofStriscia();
		}
	}
	var ofPasso = 1;
	async function ofOnboarding(p) {
		if (!OF.caricato) await ofCarica();
		if (!OF.sqlOk) {
			showToast("Officina mobile arriva con l'aggiornamento di Equo.");
			return;
		}
		ofPasso = p || 1;
		const barra = `<div class="of-passi">${[
			1,
			2,
			3,
			4
		].map((n) => `<i class="${n <= ofPasso ? "ok" : ""}"></i>`).join("")}</div><div class="of-passo-k">PASSO ${ofPasso} DI 4 · ${[
			"BASE",
			"MEZZI",
			"AIUTANTI",
			"MATERIALI"
		][ofPasso - 1]}</div>`;
		const avanti = (t, fn) => `<button type="button" class="btn btn-ghost" onclick="ofOnboarding(${ofPasso + 1 > 4 ? 4 : ofPasso + 1})${ofPasso === 4 ? ";ofFineOnboarding()" : ""}">Salta</button><button type="button" class="btn btn-primary" onclick="${fn}">${t}</button>`;
		if (ofPasso === 1) {
			ofForm = { tipo: "base" };
			ofModale("La tua base", barra + `<div class="of-nota">Da dove parti la mattina (casa o officina). Serve a contare i chilometri del giro, andata e ritorno compresi.</div>
      ${campo("of-b-ind", "INDIRIZZO", OF.imp?.base_indirizzo, "maxlength=\"300\" placeholder=\"es. Via Roma 10, Colleferro\"")}
      <div id="of-b-ind-pos-nota" class="pos-nota"></div>
      <button type="button" class="of-link" onclick="usaPosizioneQui('of-b-ind', this)">📍 Usa la mia posizione attuale</button>
      ${campo("of-b-carb", "PREZZO DEL CARBURANTE €/L (FACOLTATIVO)", OF.imp?.prezzo_carburante != null ? String(OF.imp.prezzo_carburante).replace(".", ",") : "", "inputmode=\"decimal\" placeholder=\"es. 1,72\"")}
      <div class="of-nota">Serve per stimare il costo dei km (Beta). Lo cambi quando vuoi.</div>`, avanti("Avanti · Mezzi →", "ofSalvaBase()"));
		} else if (ofPasso === 2) {
			ofForm = {
				tipo: "mezzo",
				id: OF.mezzi[0]?.id || null
			};
			ofModale("Il tuo furgone", barra + `<div class="of-nota">Lo usiamo per le scadenze e per stimare i costi dei chilometri. Puoi aggiungere altri mezzi dopo.</div>` + ofCampiMezzo(OF.mezzi[0]), avanti("Avanti · Aiutanti →", "ofPassoMezzo()"));
			ofMostraBombole();
		} else if (ofPasso === 3) {
			ofForm = { tipo: "aiutante" };
			ofModale("Chi lavora con te", barra + `<div class="of-nota">Aggiungi i tuoi aiutanti: il compenso diventa una spesa automatica nei giorni in cui lavorano con te.</div>
      <div id="of-w-lista">${OF.aiutanti.map((a) => `<div class="of-w-r">👤 <b>${esc(a.nome)}</b> · ${euroTondo(a.compenso)} ${COMPENSO[a.compenso_tipo]}${a.id === OF.imp?.aiutante_predefinito ? " <i class=\"of-pred\">PREDEFINITO</i>" : ""}</div>`).join("")}</div>
      ${ofCampiAiutante(null)}<button type="button" class="btn btn-outline btn-sm" style="width:100%;margin:2px 0 6px" onclick="ofWizardAggiungi('aiutante')">+ Aggiungi questo aiutante</button>`, `<button type="button" class="btn btn-ghost" onclick="ofOnboarding(4)">${OF.aiutanti.length ? "Avanti" : "Lavoro da solo"}</button><button type="button" class="btn btn-primary" onclick="ofPassoAiutante()">Avanti · Materiali →</button>`);
			ofAggiornaCompenso();
		} else {
			ofForm = { tipo: "materiale" };
			ofModale("Ferri e materiali", barra + `<div class="of-nota">Ferri (per misura), chiodi e prodotti con costo e scorta: ti avviso quando stanno finendo e diventano spese da soli.</div>
      <div id="of-w-lista">${OF.materiali.map((m) => `<div class="of-w-r">${{
				ferri: "🧲",
				chiodi: "📌",
				prodotti: "🧴",
				attrezzi: "🛠️",
				altro: "📦"
			}[m.categoria]} <b>${esc(m.nome)}${m.misura ? " n. " + esc(m.misura) : ""}</b> · ${euroTondo(m.costo)} · scorta ${String(m.scorta).replace(".", ",")}</div>`).join("")}</div>
      ${ofCampiMateriale(null)}<button type="button" class="btn btn-outline btn-sm" style="width:100%;margin:2px 0 6px" onclick="ofWizardAggiungi('materiale')">+ Aggiungi questo materiale</button>`, `<button type="button" class="btn btn-ghost" onclick="ofFineOnboarding()">Salta</button><button type="button" class="btn btn-primary" onclick="ofPassoMateriale()">Fine</button>`);
			ofAggiornaMisura();
		}
	}
	async function ofSalvaBase() {
		const ind = val("of-b-ind");
		const xy = coordDaIndirizzo(ind);
		const r = await OfDB.impostazioni({
			base_indirizzo: ind || null,
			base_lat: xy?.lat ?? null,
			base_lon: xy?.lon ?? null,
			prezzo_carburante: num(val("of-b-carb"))
		});
		if (r.error) {
			ofErrore("Non salvato: " + r.error.message);
			return;
		}
		OF.imp = r.data;
		OF.kmStime = {};
		ofOnboarding(2);
	}
	async function ofPassoMezzo() {
		if (!val("of-marca") && !val("of-modello")) return ofOnboarding(3);
		if (await ofSalvaMezzo(true)) ofOnboarding(3);
	}
	async function ofWizardAggiungi(tipo) {
		ofForm = { tipo };
		if (tipo === "aiutante" ? await ofSalvaAiutante(true) : await ofSalvaMateriale(true)) {
			showToast(tipo === "aiutante" ? "Aiutante aggiunto" : "Materiale aggiunto");
			ofOnboarding(ofPasso);
		}
	}
	async function ofPassoAiutante() {
		if (val("of-a-nome") && !await ofSalvaAiutante(true)) return;
		ofOnboarding(4);
	}
	async function ofPassoMateriale() {
		if (val("of-m-nome") && !await ofSalvaMateriale(true)) return;
		ofFineOnboarding();
	}
	async function ofFineOnboarding() {
		const r = await OfDB.impostazioni({ configurata_il: OF.imp?.configurata_il || (/* @__PURE__ */ new Date()).toISOString() });
		if (!r.error) OF.imp = r.data;
		closeModal("modal-officina");
		showToast("Officina mobile pronta 🚐");
		if (typeof showPage === "function" && !document.getElementById("page-pro-officina")?.classList.contains("active")) showPage("pro-officina");
		else ofDisegna();
		ofAggiornaRiepiloghi();
	}
	async function ofAggiornaRiepiloghi() {
		const el = document.getElementById("hm-r-off");
		if (!el) return;
		if (!OF.caricato) await ofCarica();
		if (!OF.sqlOk) {
			el.textContent = "furgone, aiutanti, materiali e spese";
			return;
		}
		if (!ofConfigurata() && !OF.mezzi.length) {
			el.textContent = "Configura furgone, aiutanti e materiali";
			return;
		}
		const s = OF.mezzi.flatMap(scadenzeMezzo).filter((x) => x.giorni != null).sort((a, b) => a.giorni - b.giorni)[0];
		const g = OF.giornate[OGGI()] || { aiutante_id: ofAiutantePred()?.id };
		const a = ofAiutante(g.aiutante_id), km = g.km ?? OF.kmStime[OGGI()]?.km;
		el.textContent = [
			s ? `${s.titolo} ${testoScadenza(s)}` : null,
			a ? "oggi con " + a.nome : "oggi da solo",
			km ? fmtKm(km) + " km" : null
		].filter(Boolean).join(" · ");
	}
	async function ofStriscia() {
		const el = document.getElementById("ag-officina");
		if (!el) return;
		if (!OF.caricato) await ofCarica();
		if (!OF.sqlOk || !ofConfigurata() && !OF.mezzi.length) {
			el.innerHTML = "";
			return;
		}
		const g = OF.giornate[OGGI()] || {
			mezzo_id: ofMezzoPred()?.id,
			aiutante_id: ofAiutantePred()?.id
		};
		const m = ofMezzo(g.mezzo_id), a = ofAiutante(g.aiutante_id), km = g.km ?? OF.kmStime[OGGI()]?.km;
		el.innerHTML = `<button type="button" class="of-striscia" onclick="ofApriGiornata()"><span class="of-k">🚐 OGGI IN OFFICINA MOBILE</span><b>${esc(m ? nomeMezzo(m) : "Nessun mezzo")} · ${a ? "con " + esc(a.nome) : "da solo"}${km ? " · " + fmtKm(km) + " km" : ""}</b><small>tocca per cambiare</small></button>`;
	}
	function ofAiutantePerData(giorno) {
		const g = OF.giornate[giorno];
		return g ? ofAiutante(g.aiutante_id) : ofAiutantePred();
	}
	async function ofPreparaAiutanteAppuntamento$1(intervento) {
		const box = document.getElementById("intervento-aiutante-box"), sel = document.getElementById("intervento-aiutante");
		if (!box || !sel) return;
		if (!OF.caricato) await ofCarica().catch(() => {});
		if (!OF.sqlOk || !OF.aiutanti.length) {
			box.style.display = "none";
			sel.value = "";
			return;
		}
		box.style.display = "";
		const giorno = document.getElementById("intervento-data")?.value || OGGI();
		const scelto = intervento ? intervento.aiutante_id || "" : ofAiutantePerData(giorno)?.id || "";
		sel.innerHTML = "<option value=\"\">Da solo</option>" + (intervento?.aiutante_id && !ofAiutante(intervento.aiutante_id) ? `<option value="${intervento.aiutante_id}">${esc(intervento.aiutante_nome || "Aiutante")}</option>` : "") + OF.aiutanti.map((a) => `<option value="${a.id}">${esc(a.nome)}</option>`).join("");
		sel.value = scelto;
		sel.dataset.toccato = "";
	}
	function ofAggiornaAiutanteData() {
		const sel = document.getElementById("intervento-aiutante");
		if (!sel || sel.dataset.toccato || typeof interventoInModifica !== "undefined" && interventoInModifica?.id) return;
		const a = ofAiutantePerData(document.getElementById("intervento-data")?.value || OGGI());
		sel.value = a && [...sel.options].some((o) => o.value === a.id) ? a.id : "";
	}
	async function ofSalvaSpesaDaHammer(x) {
		if (!OF.caricato) await ofCarica().catch(() => {});
		if (!OF.sqlOk) return { error: { message: "Officina mobile arriva con l'aggiornamento di Equo" } };
		const riga = {
			categoria: CAT_SPESA[x?.categoria] ? x.categoria : "altro",
			descrizione: String(x?.descrizione || "Spesa").slice(0, 120),
			importo: Math.round(Number(x?.importo || 0) * 100) / 100,
			data: /^\d{4}-\d{2}-\d{2}$/.test(x?.data || "") ? x.data : OGGI(),
			mezzo_id: ofMezzoPred()?.id || null
		};
		const { error } = await OfDB.salva("officina_spese", riga);
		if (error) return { error };
		await ofCaricaSpese();
		if (document.getElementById("page-pro-officina")?.classList.contains("active")) ofDisegna();
		ofAggiornaRiepiloghi();
		return { error: null };
	}
	function ofCampiAiutanteIntervento$1(inModifica) {
		const box = document.getElementById("intervento-aiutante-box"), sel = document.getElementById("intervento-aiutante");
		if (!OF.sqlOk || !box || box.style.display === "none" || !sel) return {};
		const id = sel.value || null;
		if (!id && !inModifica?.aiutante_id && !sel.dataset.toccato) return {};
		return {
			aiutante_id: id,
			aiutante_nome: ofAiutante(id)?.nome || (id ? inModifica?.aiutante_nome || null : null)
		};
	}
	setTimeout(() => quandoApriPagina((p) => {
		if (p === "pro-officina") ofApri();
		if (p === "pro-agenda") ofStriscia();
		if (p === "pro-home") ofAggiornaRiepiloghi();
	}), 0);
	// equo-app-src/src/ruoli/maniscalco/moduli/110-agenda-semplice-completa.js
	var agScheda = (() => {
		try {
			return localStorage.getItem("equo-agenda-scheda") || "app";
		} catch (e) {
			return "app";
		}
	})();
	var agProgFiltro = "tutti";
	var agDati = {
		prog: [],
		nonfatti: [],
		saldare: []
	};
	var agDsAperto = null;
	var agTokenSchede = 0;
	var oggiIso = () => isoLocale(/* @__PURE__ */ new Date());
	var nascosti = () => typeof incassiNascosti === "function" && incassiNascosti();
	function scegliVistaAgenda(v) {
		try {
			localStorage.setItem("equo-agenda-vista", v === "completa" ? "completa" : "semplice");
		} catch (e) {}
		if (v !== "completa") agScheda = "app";
		agApplicaVistaAgenda();
		agDisegnaGriglia();
		agAggiornaSchede$1();
	}
	function scegliSchedaAgenda(s) {
		agScheda = s;
		try {
			localStorage.setItem("equo-agenda-scheda", s);
		} catch (e) {}
		agApplicaVistaAgenda();
		agDisegnaScheda();
	}
	function agApplicaVistaAgenda() {
		const comp = agendaCompleta();
		if (!comp) agScheda = "app";
		document.querySelectorAll("#ag-vista button").forEach((b) => {
			const on = b.dataset.v === (comp ? "completa" : "semplice");
			b.classList.toggle("on", on);
			b.setAttribute("aria-selected", String(on));
		});
		const schede = document.getElementById("ag-schede");
		if (schede) schede.hidden = !comp;
		document.querySelectorAll("#ag-schede button").forEach((b) => b.classList.toggle("on", b.dataset.s === agScheda));
		for (const s of [
			"app",
			"prog",
			"nonfatti",
			"saldare"
		]) {
			const el = document.getElementById("ag-sez-" + s);
			if (el) el.hidden = s !== agScheda;
		}
	}
	async function agAggiornaSchede$1() {
		agApplicaVistaAgenda();
		if (!agendaCompleta() || DEMO_MODE && !currentUser) return;
		const token = ++agTokenSchede, oggi = oggiIso();
		const [prog, nonfatti, saldare] = await Promise.all([
			DB.listScadenzePeriodo(aggiungiGiorniIso(oggi, -365), aggiungiGiorniIso(oggi, 30)),
			agListaNonFatti(oggi),
			agListaDaSaldare()
		]);
		if (token !== agTokenSchede) return;
		agDati = {
			prog: prog.sort((a, b) => a.prossima_scadenza.localeCompare(b.prossima_scadenza)),
			nonfatti,
			saldare
		};
		const settimana = (typeof agGiorniDati !== "undefined" ? agGiorniDati : []).reduce((t, d) => t + d.ev.filter((e) => e.stato !== "fatto").length, 0);
		const metti = (id, v, vuoto) => {
			const el = document.getElementById(id);
			if (el) {
				el.textContent = v;
				el.classList.toggle("zero", !!vuoto);
			}
		};
		metti("ag-n-app", settimana, !settimana);
		metti("ag-n-prog", prog.length, !prog.length);
		metti("ag-n-nonfatti", nonfatti.length, !nonfatti.length);
		const tot = saldare.reduce((t, i) => t + (Number(i.importo) || 0), 0);
		metti("ag-n-saldare", nascosti() ? saldare.length || "0" : euroTondo(tot), !saldare.length);
		agDisegnaScheda();
	}
	async function agListaNonFatti(oggi) {
		if (DEMO_MODE) return (demoState.interventiMascalcia || []).filter((i) => i.stato === "programmato" && i.data_intervento < oggi).map((i) => ({
			...i,
			clienti_mascalcia: { nome: demoState.clientiMascalcia.find((c) => c.id === i.cliente_mascalcia_id)?.nome },
			cavalli_clienti_mascalcia: { nome: (demoState.cavalliClientiMascalcia || []).find((c) => c.id === i.cavallo_cliente_id)?.nome }
		}));
		const { data, error } = await sb.from("interventi_mascalcia").select("*, clienti_mascalcia(nome, nome_cavallo), cavalli_clienti_mascalcia(nome)").eq("maniscalco_id", currentUser.id).eq("stato", "programmato").lt("data_intervento", oggi).order("data_intervento", { ascending: false }).limit(500);
		if (error) console.warn("agListaNonFatti:", error.message);
		return data || [];
	}
	async function agListaDaSaldare() {
		if (DEMO_MODE) return (demoState.interventiMascalcia || []).filter((i) => i.stato === "fatto" && i.stato_pagamento !== "saldato").map((i) => ({
			...i,
			clienti_mascalcia: { nome: demoState.clientiMascalcia.find((c) => c.id === i.cliente_mascalcia_id)?.nome },
			cavalli_clienti_mascalcia: { nome: (demoState.cavalliClientiMascalcia || []).find((c) => c.id === i.cavallo_cliente_id)?.nome }
		}));
		const { data, error } = await sb.from("interventi_mascalcia").select("*, clienti_mascalcia(nome), cavalli_clienti_mascalcia(nome)").eq("maniscalco_id", currentUser.id).eq("stato", "fatto").neq("stato_pagamento", "saldato").order("data_intervento", { ascending: true }).limit(2e3);
		if (error) console.warn("agListaDaSaldare:", error.message);
		return data || [];
	}
	function agDisegnaScheda() {
		if (!agendaCompleta()) return;
		if (agScheda === "prog") agDisegnaProg();
		else if (agScheda === "nonfatti") agDisegnaNonFatti();
		else if (agScheda === "saldare") agDisegnaSaldare();
	}
	var nomeCli = (x) => x.clienti_mascalcia?.nome || "Cliente";
	var nomeCav = (x) => agNomeCavallo(x) || "Cavallo non indicato";
	var tipoLav = (x) => (TIPO_FERRATURA_LABELS[x.tipo_ferratura] || x.tipo_ferratura || "Intervento") + (x.tipo_ferratura === "altro" && x.tipo_altro ? " · " + x.tipo_altro : "");
	function perCliente(lista) {
		const m = /* @__PURE__ */ new Map();
		lista.forEach((x) => {
			const k = x.cliente_mascalcia_id || "?";
			if (!m.has(k)) m.set(k, {
				id: k,
				nome: nomeCli(x),
				righe: []
			});
			m.get(k).righe.push(x);
		});
		return [...m.values()];
	}
	function agDataProposta(iso) {
		const oggi = oggiIso();
		return agGiornoLavoro(!iso || iso < oggi ? oggi : iso);
	}
	function agDisegnaProg() {
		const box = document.getElementById("ag-sez-prog");
		if (!box) return;
		const oggi = oggiIso();
		const conta = {
			tutti: agDati.prog.length,
			scaduti: 0,
			d7: 0,
			d30: 0
		};
		agDati.prog.forEach((sc) => {
			const g = giorniTra(oggi, sc.prossima_scadenza);
			if (g < 0) conta.scaduti++;
			else if (g <= 7) conta.d7++;
			else conta.d30++;
		});
		const filtro = (sc) => {
			const g = giorniTra(oggi, sc.prossima_scadenza);
			return agProgFiltro === "tutti" || (agProgFiltro === "scaduti" ? g < 0 : agProgFiltro === "d7" ? g >= 0 && g <= 7 : g > 7);
		};
		const gruppi = perCliente(agDati.prog.filter(filtro));
		const pill = (sc) => {
			const g = giorniTra(oggi, sc.prossima_scadenza);
			return g < 0 ? `<span class="ag-pill r">scaduta da ${-g} ${g === -1 ? "giorno" : "giorni"}</span>` : g === 0 ? "<span class=\"ag-pill o\">oggi</span>" : `<span class="ag-pill ${g <= 7 ? "o" : "v"}">tra ${g} ${g === 1 ? "giorno" : "giorni"}</span>`;
		};
		box.innerHTML = `<p class="ag-nota">Cavalli con la scadenza passata o nei prossimi 30 giorni, secondo l'intervallo della loro scheda. «Fissa» crea l'appuntamento (la domenica è riposo: la data proposta slitta al lunedì, puoi cambiarla).</p>
    <div class="ag-filtri">${[
			["tutti", "Tutti"],
			["scaduti", "Scaduti"],
			["d7", "7 giorni"],
			["d30", "30 giorni"]
		].map(([k, t]) => `<button type="button" class="${agProgFiltro === k ? "on" : ""}" onclick="agFiltroProg('${k}')">${t} <b>${conta[k]}</b></button>`).join("")}</div>
    ${gruppi.length ? gruppi.map((g) => `<div class="ag-gruppo">
        <div class="ag-gruppo-t"><div><b>${escapeHtml(g.nome)}</b><small>${g.righe.length} ${g.righe.length === 1 ? "cavallo" : "cavalli"}</small></div>${g.righe.length > 1 && g.id !== "?" ? `<button type="button" class="btn btn-outline btn-sm" onclick="agFissaTutti('${g.id}')">Fissa tutti</button>` : ""}</div>
        ${g.righe.map((sc) => `<div class="ag-riga"><div class="ag-riga-c"><b>${escapeHtml(nomeCav(sc))}</b><small>${escapeHtml(tipoLav(sc))} · ${giorniTra(oggi, sc.prossima_scadenza) < 0 ? "scaduta" : "scade"} ${formatDataBreve(sc.prossima_scadenza)}</small></div>${pill(sc)}<button type="button" class="btn btn-primary btn-sm" onclick="agFissaScadenza('${sc.id}')">Fissa</button></div>`).join("")}
      </div>`).join("") : `<div class="ag-vuoto">✓ ${agDati.prog.length ? "Nessun cavallo in questo filtro" : "Nessun cavallo da programmare"}</div>`}`;
	}
	function agFiltroProg(k) {
		agProgFiltro = k;
		agDisegnaProg();
	}
	function agPresetScadenza(sc, data) {
		return {
			tipo_ferratura: sc.tipo_ferratura,
			tipo_altro: sc.tipo_altro,
			misura_sistema: sc.misura_sistema,
			numero_ferro: sc.numero_ferro,
			quantita_ferri: sc.quantita_ferri,
			data_intervento: data,
			cavallo_cliente_id: sc.cavallo_cliente_id,
			horse_id: sc.horse_id
		};
	}
	function agFissaScadenza(id) {
		const sc = agDati.prog.find((x) => x.id === id);
		if (!sc) return;
		openInterventoModal(sc.cliente_mascalcia_id, null, agPresetScadenza(sc, agDataProposta(sc.prossima_scadenza)));
	}
	function agFissaTutti(clienteId, daGiorno) {
		const righe = daGiorno ? agScadDelGiorno(daGiorno).filter((x) => x.cliente_mascalcia_id === clienteId) : agDati.prog.filter((x) => x.cliente_mascalcia_id === clienteId);
		if (!righe.length) return;
		if (daGiorno) closeModal("modal-da-fissare");
		const prima = righe.slice().sort((a, b) => a.prossima_scadenza.localeCompare(b.prossima_scadenza))[0];
		const preset = agPresetScadenza(prima, daGiorno || agDataProposta(prima.prossima_scadenza));
		if (isStrutturaCollegata(clienteId)) return apriPropostaStruttura(clienteId, {
			...preset,
			cavalli: righe.map((r) => r.cavallo_cliente_id).filter(Boolean)
		});
		openInterventoModal(clienteId, null, {
			...preset,
			cavalli: righe.map((r) => r.cavallo_cliente_id ? "m:" + r.cavallo_cliente_id : r.horse_id ? "h:" + r.horse_id : null).filter(Boolean)
		});
	}
	function agScadDelGiorno(iso) {
		const d = (typeof agGiorniDati !== "undefined" ? agGiorniDati : []).find((x) => x.iso === iso);
		return d ? d.sc : [];
	}
	function apriDaFissare(iso) {
		const lista = agScadDelGiorno(iso);
		if (!lista.length) return;
		const [y, m, g] = iso.split("-").map(Number);
		document.getElementById("df-tit").textContent = `Da fissare · ${formatDataBreve(iso)}`;
		const oggi = oggiIso();
		document.getElementById("df-lista").innerHTML = perCliente(lista).map((gr) => `<div class="ag-gruppo">
      <div class="ag-gruppo-t"><div><b>${escapeHtml(gr.nome)}</b><small>${gr.righe.length} ${gr.righe.length === 1 ? "cavallo" : "cavalli"}</small></div>${gr.righe.length > 1 && gr.id !== "?" ? `<button type="button" class="btn btn-outline btn-sm" onclick="agFissaTutti('${gr.id}', '${iso}')">Fissa tutti</button>` : ""}</div>
      ${gr.righe.map((sc) => {
			const gg = giorniTra(oggi, sc.prossima_scadenza);
			return `<div class="ag-riga"><div class="ag-riga-c"><b>${escapeHtml(nomeCav(sc))}</b><small>${escapeHtml(tipoLav(sc))} · ultimo ${formatDataBreve(sc.data_intervento)}${sc.prossima_scadenza !== iso ? " · scade " + formatDataBreve(sc.prossima_scadenza) : ""}</small></div>${gg < 0 ? `<span class="ag-pill r">scaduta</span>` : ""}<button type="button" class="btn btn-primary btn-sm" onclick="closeModal('modal-da-fissare');fissaDaScadenza('${sc.id}')">Fissa</button></div>`;
		}).join("")}
    </div>`).join("");
		openModal("modal-da-fissare");
	}
	function agGruppiNonFatti() {
		const m = /* @__PURE__ */ new Map();
		agDati.nonfatti.forEach((e) => {
			const k = e.data_intervento + "|" + (e.cliente_mascalcia_id || "?");
			if (!m.has(k)) m.set(k, {
				k,
				data: e.data_intervento,
				nome: nomeCli(e),
				righe: []
			});
			m.get(k).righe.push(e);
		});
		return [...m.values()].sort((a, b) => b.data.localeCompare(a.data));
	}
	function agDisegnaNonFatti() {
		const box = document.getElementById("ag-sez-nonfatti");
		if (!box) return;
		const oggi = oggiIso();
		agDati.nonfatti.forEach((e) => {
			if (typeof agEventiCache !== "undefined") agEventiCache[e.id] = e;
		});
		const gruppi = agGruppiNonFatti();
		box.innerHTML = `<p class="ag-nota">Appuntamenti con la data passata che non hai segnato né fatti né annullati. Sistemali con un tocco: «Fatto» sul singolo cavallo, oppure sposta o annulla tutto il gruppo.</p>
    ${gruppi.length ? gruppi.map((g, n) => {
			const gg = giorniTra(g.data, oggi);
			return `<div class="ag-gruppo">
        <div class="ag-gruppo-t"><div><b>${escapeHtml(formatDataBreve(g.data))} · ${escapeHtml(g.nome)}</b><small>${g.righe.length} ${g.righe.length === 1 ? "cavallo" : "cavalli"}</small></div><span class="ag-pill r">${gg === 1 ? "ieri" : gg + " giorni fa"}</span></div>
        ${g.righe.map((e) => `<div class="ag-riga"><div class="ag-riga-c" onclick="apriAzioniEvento('${e.id}')"><b>${escapeHtml(nomeCav(e))}</b><small>${escapeHtml(tipoLav(e))}${e.gruppo_id ? " · con la scuderia" : ""}</small></div><button type="button" class="btn btn-primary btn-sm" onclick="segnaFattoAgenda('${e.id}')">Fatto</button><button type="button" class="ag-piu" onclick="apriAzioniEvento('${e.id}')" aria-label="Altre azioni">⋯</button></div>`).join("")}
        <div class="agc-azioni"><label class="ag-sposta"><span>Sposta al</span><input type="date" id="ag-nf-data-${n}" min="${oggi}" value="${agDataProposta(oggi)}"></label><button type="button" class="btn btn-outline btn-sm" onclick="agNfSposta(${n})">Sposta</button><button type="button" class="btn btn-outline btn-sm ag-rosso" onclick="agNfAnnulla(${n})">Annulla</button></div>
      </div>`;
		}).join("") : "<div class=\"ag-vuoto\">✓ Tutto in ordine</div>"}`;
	}
	async function agNfAggiorna(righe, upd, testo) {
		const conScuderia = [...new Set(righe.filter((e) => e.gruppo_id).map((e) => e.gruppo_id))];
		const libere = righe.filter((e) => !e.gruppo_id);
		for (const e of libere) {
			const { error } = await DB.updateInterventoMascalcia(e.id, upd);
			if (error) {
				showToast("Errore: " + error.message);
				break;
			}
		}
		if (conScuderia.length && upd.stato === "annullato") for (const g of conScuderia) await azioneGruppoStruttura(g, "annulla");
		else if (conScuderia.length) showToast("Gli appuntamenti con la scuderia si spostano dal tasto ⋯ (la scuderia deve riconfermare)");
		if (libere.length) showToast(testo);
		await renderAgendaSettimana$1();
	}
	async function agNfSposta(n) {
		const g = agGruppiNonFatti()[n];
		const data = document.getElementById("ag-nf-data-" + n)?.value;
		if (!g || !data) return;
		if (data < oggiIso()) {
			showToast("Scegli oggi o un giorno futuro");
			return;
		}
		await agNfAggiorna(g.righe, { data_intervento: data }, `Spostato a ${formatDataBreve(data)}`);
	}
	async function agNfAnnulla(n) {
		const g = agGruppiNonFatti()[n];
		if (!g) return;
		if (!confirm(`Annullare ${g.righe.length === 1 ? "questo appuntamento" : "questi " + g.righe.length + " appuntamenti"} di ${formatDataBreve(g.data)} (${g.nome})?`)) return;
		await agNfAggiorna(g.righe, { stato: "annullato" }, "Appuntamento annullato");
	}
	function agDisegnaSaldare() {
		const box = document.getElementById("ag-sez-saldare");
		if (!box) return;
		if (nascosti()) {
			box.innerHTML = "<div class=\"ag-vuoto\">Hai nascosto gli incassi: mostrali dal menu (serve il PIN).</div>";
			return;
		}
		const oggi = oggiIso();
		const gruppi = perCliente(agDati.saldare).map((g) => ({
			...g,
			tot: g.righe.reduce((t, i) => t + (Number(i.importo) || 0), 0),
			vecchio: g.righe[0]?.data_intervento
		})).sort((a, b) => (a.vecchio || "").localeCompare(b.vecchio || ""));
		const tot = gruppi.reduce((t, g) => t + g.tot, 0);
		box.innerHTML = `<div class="ag-totale"><div><small>Da incassare · ${gruppi.length} ${gruppi.length === 1 ? "cliente" : "clienti"} · ${agDati.saldare.length} ${agDati.saldare.length === 1 ? "lavoro" : "lavori"}</small><b>${euroTondo(tot)}</b></div></div>
    <div id="ag-conti-aperti"></div>
    <p class="ag-nota">Dal debito più vecchio. Tocca un cliente per vedere i lavori e segnarli saldati.</p>
    ${gruppi.length ? gruppi.map((g) => {
			const gg = g.vecchio ? giorniTra(g.vecchio, oggi) : 0, aperto = agDsAperto === g.id;
			return `<div class="agc-cli${aperto ? " aperto" : ""}">
        <button type="button" class="agc-cli-t" onclick="agDsApri('${g.id}')"><span class="ag-ini">${escapeHtml((g.nome.match(/\b\p{L}/gu) || ["?"]).slice(0, 2).join("").toUpperCase())}</span>
          <span class="ag-riga-c"><b>${escapeHtml(g.nome)}</b><small>${g.righe.length} ${g.righe.length === 1 ? "lavoro" : "lavori"} · dal ${formatDataBreve(g.vecchio)}</small></span>
          <span class="ag-eu">${euroTondo(g.tot)}${gg > 30 ? `<small>da ${gg} giorni</small>` : ""}</span></button>
        ${aperto ? `<div class="agc-cli-d">${g.righe.map((i) => `<div class="ag-riga"><div class="ag-riga-c"><b>${escapeHtml(nomeCav(i))}</b><small>${escapeHtml(tipoLav(i))} · ${formatDataBreve(i.data_intervento)}</small></div><span class="ag-eu">${i.importo != null ? euroTondo(i.importo) : "—"}</span><button type="button" class="btn btn-primary btn-sm" onclick="agDsSaldato('${i.id}', this)">Saldato</button></div>`).join("")}
          ${g.id !== "?" ? `<div class="agc-azioni"><button type="button" class="btn btn-outline btn-sm" onclick="apriNuovoConto('${g.id}')">Fai il conto</button><button type="button" class="btn btn-outline btn-sm" onclick="apriResoconto('${g.id}')">Resoconto PDF</button></div>` : ""}</div>` : ""}
      </div>`;
		}).join("") : "<div class=\"ag-vuoto\">✓ Tutto incassato</div>"}`;
		caricaContiAperti("ag-conti-aperti");
	}
	function agDsApri(id) {
		agDsAperto = agDsAperto === id ? null : id;
		agDisegnaSaldare();
	}
	async function agDsSaldato(id, btn) {
		btn.disabled = true;
		const { error } = await DB.updateInterventoMascalcia(id, { stato_pagamento: "saldato" });
		if (error) {
			btn.disabled = false;
			showToast("Errore: " + error.message);
			return;
		}
		showToast("Segnato come saldato");
		agDati.saldare = agDati.saldare.filter((i) => i.id !== id);
		agAggiornaSchede$1();
		if (typeof renderIncassi === "function") renderIncassi();
	}
	async function condividiInvitoAgenda() {
		if (!currentUser.codiceProfessionista && !DEMO_MODE) currentUser.codiceProfessionista = await DB.ensureCodiceProfessionista();
		if (typeof shareCodicePersonale === "function") shareCodicePersonale();
	}
	// equo-app-src/src/ruoli/maniscalco/moduli/107-lascia-cavallo.js
	var lasciaSel = null;
	function apriLasciaCavallo(key) {
		const x = (cavalliEditCache || []).find((c) => c.key === key);
		if (!x) return;
		lasciaSel = x;
		const coll = !!(x.tipo === "equo" || x.horse_id || x.scuderia_cavallo_id);
		document.getElementById("lc-tit").textContent = coll ? "Non seguo più " + x.nome : "Archivia " + x.nome;
		document.getElementById("lc-testo").textContent = coll ? "Il cavallo è collegato al proprietario o alla scuderia: riceveranno la tua richiesta e la confermeranno. Finché non rispondono, il cavallo resta nella tua lista. Il suo storico non si cancella." : "Il cavallo esce dalla tua lista, ma il suo storico resta. Lo ritrovi in «Cavalli archiviati» e puoi ripristinarlo quando vuoi.";
		document.getElementById("lc-motivo-box").style.display = coll ? "block" : "none";
		document.getElementById("lc-motivo").value = "";
		const ok = document.getElementById("lc-ok");
		ok.textContent = coll ? "Invia la richiesta" : "Archivia";
		ok.disabled = false;
		openModal("modal-lascia-cavallo");
	}
	async function aggiornaDopoLascia() {
		await renderCavalliEditCliente();
		await syncNomeCavalloCliente().catch(() => {});
		await caricaCavalliMiei().catch(() => {});
	}
	async function confermaLasciaCavallo() {
		const x = lasciaSel;
		if (!x) return;
		const ok = document.getElementById("lc-ok");
		ok.disabled = true;
		let id = x.id;
		if (!id) id = (await DB.risolviCavalloPerIntervento(currentClienteId, x)).cavallo_cliente_id;
		if (!id) {
			ok.disabled = false;
			showToast("Operazione non riuscita. Riprova.");
			return;
		}
		const res = await DB.lasciaCavallo(id, document.getElementById("lc-motivo").value.trim());
		ok.disabled = false;
		if (!res || !res.ok) {
			showToast(res?.motivo === "manca_db" ? "Funzione non ancora attiva: serve l'aggiornamento del database." : "Operazione non riuscita. Riprova.");
			return;
		}
		closeModal("modal-lascia-cavallo");
		lasciaSel = null;
		showToast(res.archiviato ? "Cavallo archiviato" : "Richiesta inviata: aspetta la conferma del proprietario o della scuderia");
		await aggiornaDopoLascia();
	}
	async function annullaLasciaCavallo(id) {
		const res = await DB.riprendiCavallo(id);
		if (!res || !res.ok) {
			showToast("Operazione non riuscita. Riprova.");
			return;
		}
		showToast("Richiesta annullata: continui a seguirlo");
		await aggiornaDopoLascia();
	}
	async function ripristinaCavallo(id) {
		const res = await DB.riprendiCavallo(id);
		if (!res || !res.ok) {
			showToast("Operazione non riuscita. Riprova.");
			return;
		}
		showToast("Cavallo ripristinato");
		await aggiornaDopoLascia();
	}
	// equo-app-src/src/ruoli/maniscalco/moduli/105-resoconto-pdf.js
	var resCtx = null;
	async function apriResoconto(clienteId) {
		if (incassiNascosti()) {
			showToast("Hai nascosto gli incassi: mostrali dal menu (serve il PIN) per fare il resoconto.");
			return;
		}
		const cli = clienteDiId(clienteId);
		if (!cli) return;
		resCtx = {
			clienteId,
			struttura: isStruttura(cli),
			periodo: "mese",
			da: "",
			a: "",
			chi: "tutti",
			tutti: [],
			lavori: []
		};
		document.getElementById("res-tit").textContent = "Resoconto · " + cli.nome;
		document.getElementById("res-corpo").innerHTML = "<div class=\"loading\"><div class=\"spinner\"></div> Carico gli interventi…</div>";
		openModal("modal-resoconto");
		resCtx.tutti = await DB.interventiResoconto(clienteId, null, null);
		resApplica();
	}
	function resPeriodo(p) {
		if (!resCtx) return;
		resCtx.periodo = p;
		if (p !== "date") resApplica();
		else resRender();
	}
	function resDate() {
		if (!resCtx) return;
		resCtx.da = document.getElementById("res-da").value;
		resCtx.a = document.getElementById("res-a").value;
		resApplica();
	}
	function resChi(v) {
		if (!resCtx) return;
		resCtx.chi = v;
		resApplica();
	}
	function resIntervallo() {
		const c = resCtx, oggi = /* @__PURE__ */ new Date(), iso = isoLocale;
		if (c.periodo === "mese") return [iso(new Date(oggi.getFullYear(), oggi.getMonth(), 1)), iso(new Date(oggi.getFullYear(), oggi.getMonth() + 1, 0))];
		if (c.periodo === "scorso") return [iso(new Date(oggi.getFullYear(), oggi.getMonth() - 1, 1)), iso(new Date(oggi.getFullYear(), oggi.getMonth(), 0))];
		if (c.periodo === "tre") return [iso(new Date(oggi.getFullYear(), oggi.getMonth() - 2, 1)), iso(new Date(oggi.getFullYear(), oggi.getMonth() + 1, 0))];
		if (c.periodo === "date") return [c.da || "", c.a || ""];
		return ["", ""];
	}
	function resProprietario(i) {
		return clienteDiId(i.cliente_mascalcia_id)?.nome || "Cliente";
	}
	function resApplica() {
		const c = resCtx;
		if (!c) return;
		const [da, a] = resIntervallo();
		c.pDa = da;
		c.pA = a;
		c.lavori = c.tutti.filter((i) => (!da || i.data_intervento >= da) && (!a || i.data_intervento <= a) && (c.chi === "tutti" || i.cliente_mascalcia_id === c.chi));
		resRender();
	}
	function resTotali(l) {
		const tot = l.reduce((s, i) => s + (Number(i.importo) || 0), 0);
		const pag = l.filter((i) => i.stato_pagamento === "saldato").reduce((s, i) => s + (Number(i.importo) || 0), 0);
		return {
			tot,
			pag,
			da: tot - pag
		};
	}
	function resRender() {
		const c = resCtx;
		if (!c) return;
		const chip = (k, t) => `<button type="button" class="btn ${c.periodo === k ? "btn-primary" : "btn-outline"} btn-sm" onclick="resPeriodo('${k}')">${t}</button>`;
		const proprietari = [...new Map(c.tutti.map((i) => [i.cliente_mascalcia_id, resProprietario(i)])).entries()].sort((x, y) => x[1].localeCompare(y[1], "it"));
		const t = resTotali(c.lavori);
		const nProp = new Set(c.lavori.map((i) => i.cliente_mascalcia_id)).size;
		document.getElementById("res-corpo").innerHTML = `
    ${c.struttura && proprietari.length > 1 ? `<div class="clienti-sez-title" style="margin:4px 0 6px">PER CHI</div>
      <select class="input" onchange="resChi(this.value)"><option value="tutti"${c.chi === "tutti" ? " selected" : ""}>Tutta la struttura (diviso per proprietario)</option>
      ${proprietari.map(([id, n]) => `<option value="${id}"${c.chi === id ? " selected" : ""}>Solo ${escapeHtml(n)}</option>`).join("")}</select>` : ""}
    <div class="clienti-sez-title" style="margin:14px 0 6px">PERIODO</div>
    <div style="display:flex;gap:6px;flex-wrap:wrap">${chip("mese", "Questo mese")}${chip("scorso", "Mese scorso")}${chip("tre", "Ultimi 3 mesi")}${chip("tutto", "Tutto")}${chip("date", "Scegli le date")}</div>
    ${c.periodo === "date" ? `<div style="display:flex;gap:8px;margin-top:8px"><input class="input" type="date" id="res-da" value="${c.da}" onchange="resDate()"><input class="input" type="date" id="res-a" value="${c.a}" onchange="resDate()"></div>` : ""}
    <div class="res-riep">
      <div><span>Interventi</span><b>${c.lavori.length}</b></div>
      <div><span>Totale</span><b>${contoEuro(t.tot)}</b></div>
      <div><span>Pagato</span><b>${contoEuro(t.pag)}</b></div>
      <div class="da"><span>Da pagare</span><b>${contoEuro(t.da)}</b></div>
    </div>
    ${c.struttura && c.chi === "tutti" && nProp > 1 ? `<div class="muted" style="font-size:12px;margin-top:6px">Nel PDF gli interventi sono divisi per i ${nProp} proprietari, con i totali di ognuno.</div>` : ""}
    <div class="ag-azioni" style="margin-top:14px">
      <button class="btn btn-primary" ${c.lavori.length ? "" : "disabled"} onclick="resCondividi()"><span class="fa-icon"><i class="fa-solid fa-share-nodes"></i></span> Condividi il PDF (WhatsApp, email…)</button>
      <button class="btn btn-outline" ${c.lavori.length ? "" : "disabled"} onclick="resScarica()"><span class="fa-icon"><i class="fa-solid fa-file-pdf"></i></span> Scarica il PDF</button>
    </div>
    <div class="muted" style="font-size:11.5px;line-height:1.5;margin-top:8px">Il resoconto riepiloga tutti gli interventi del periodo, pagati e da pagare. Non cambia i pagamenti e non è una fattura. Per chiedere il pagamento usa «Fai il conto».</div>`;
	}
	function resNomeFile() {
		const c = resCtx;
		const chi = c.chi === "tutti" ? clienteDiId(c.clienteId)?.nome : clienteDiId(c.chi)?.nome;
		return [
			"Equo",
			"Resoconto",
			String(chi || "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, ""),
			c.pDa || "",
			c.pA || ""
		].filter(Boolean).join("_") + ".pdf";
	}
	async function creaPdfResoconto() {
		const c = resCtx;
		const doc = new (await (caricaJsPdf()))({
			unit: "mm",
			format: "a4"
		});
		const W = 210, M = 18, verde = [
			20,
			49,
			42
		], oro = [
			201,
			143,
			46
		], grigio = [
			95,
			111,
			103
		], rosso = [
			163,
			59,
			43
		];
		const piede = () => {
			doc.setDrawColor(227, 221, 204);
			doc.line(M, 280, 192, 280);
			doc.setFont("helvetica", "normal");
			doc.setFontSize(8.5);
			doc.setTextColor(...grigio);
			doc.text("Resoconto generato con Equo — equohub.com. Non è una fattura e non ha valore fiscale.", M, 285);
		};
		doc.setFillColor(...verde);
		doc.rect(0, 0, W, 32, "F");
		doc.setTextColor(255, 255, 255);
		doc.setFont("helvetica", "bold");
		doc.setFontSize(22);
		doc.text("Equo", M, 20);
		doc.setFont("helvetica", "normal");
		doc.setFontSize(10);
		doc.text("Prenditi cura del tuo cavallo", M, 26);
		doc.text(contoData(isoLocale(/* @__PURE__ */ new Date())), 192, 20, { align: "right" });
		doc.setFillColor(...oro);
		doc.rect(0, 32, W, 1.5, "F");
		let y = 48;
		const luogo = clienteDiId(c.clienteId);
		const solo = c.chi !== "tutti" ? clienteDiId(c.chi) : null;
		doc.setTextColor(...verde);
		doc.setFont("helvetica", "bold");
		doc.setFontSize(17);
		doc.text("Resoconto interventi", M, y);
		y += 9;
		doc.setFontSize(15);
		doc.text(solo ? solo.nome : luogo?.nome || "", M, y);
		doc.setFont("helvetica", "normal");
		doc.setFontSize(10.5);
		doc.setTextColor(...grigio);
		if (solo && c.struttura && solo.id !== c.clienteId) {
			y += 6;
			doc.text("Cavalli presso " + (luogo?.nome || ""), M, y);
		}
		const pro = currentUser?.datiPagamentoNome || currentUser?.fullName || currentUser?.full_name || "";
		if (pro) {
			y += 6;
			doc.text(etichettaPro() + ": " + pro + (currentUser?.certificazioneStato === "verificato" ? "  ·  Equo Certified" : ""), M, y);
		}
		y += 5.5;
		doc.text("Periodo: " + (c.pDa || c.pA ? (c.pDa ? "dal " + contoData(c.pDa) + " " : "") + (c.pA ? "al " + contoData(c.pA) : "") : "tutti gli interventi"), M, y);
		y += 10;
		const colData = 20, colCav = 42, colLav = 84, colStato = 162, colImp = 190;
		const testa = () => {
			doc.setFillColor(...verde);
			doc.rect(M, y - 5, 174, 8, "F");
			doc.setFont("helvetica", "bold");
			doc.setFontSize(9.5);
			doc.setTextColor(255, 255, 255);
			doc.text("DATA", colData, y);
			doc.text("CAVALLO", colCav, y);
			doc.text("LAVORO", colLav, y);
			doc.text("STATO", colStato, y);
			doc.text("IMPORTO", colImp, y, { align: "right" });
			y += 8;
		};
		testa();
		const nuovaPagina = () => {
			piede();
			doc.addPage();
			y = 22;
			testa();
		};
		const gruppi = /* @__PURE__ */ new Map();
		c.lavori.forEach((i) => {
			const n = resProprietario(i);
			(gruppi.get(n) || gruppi.set(n, []).get(n)).push(i);
		});
		const nomi = [...gruppi.keys()].sort((a, b) => a.localeCompare(b, "it"));
		const conGruppi = nomi.length > 1;
		let k = 0;
		nomi.forEach((n) => {
			const lista = gruppi.get(n).slice().sort((a, b) => (agNomeCavallo(a) || "").localeCompare(agNomeCavallo(b) || "", "it") || String(a.data_intervento).localeCompare(String(b.data_intervento)));
			if (conGruppi) {
				if (y > 262) nuovaPagina();
				doc.setFont("helvetica", "bold");
				doc.setFontSize(10.5);
				doc.setTextColor(...oro);
				doc.text(n, colData, y);
				y += 6;
			}
			lista.forEach((i) => {
				const lav = doc.splitTextToSize(String(agDescrizioneTipo(i) || ""), 75);
				const h = Math.max(7.5, lav.length * 4.8 + 2.6);
				if (y + h > 268) nuovaPagina();
				if (k++ % 2 === 0) {
					doc.setFillColor(248, 246, 240);
					doc.rect(M, y - 4.6, 174, h, "F");
				}
				doc.setFont("helvetica", "normal");
				doc.setFontSize(10);
				doc.setTextColor(...grigio);
				doc.text(contoData(i.data_intervento), colData, y);
				doc.setFont("helvetica", "bold");
				doc.setTextColor(...verde);
				doc.text(doc.splitTextToSize(String(agNomeCavallo(i) || "—"), 39), colCav, y);
				doc.setFont("helvetica", "normal");
				doc.setTextColor(...grigio);
				doc.text(lav, colLav, y);
				const saldato = i.stato_pagamento === "saldato";
				doc.setFont("helvetica", "bold");
				doc.setFontSize(9);
				doc.setTextColor(...saldato ? verde : rosso);
				doc.text(saldato ? "Pagato" : "Da pagare", colStato, y);
				doc.setFontSize(10);
				doc.setTextColor(...verde);
				doc.text(Number(i.importo) > 0 ? contoEuro(i.importo) : "—", colImp, y, { align: "right" });
				y += h;
			});
			if (conGruppi) {
				const t = resTotali(gruppi.get(n));
				doc.setFont("helvetica", "normal");
				doc.setFontSize(9.5);
				doc.setTextColor(...grigio);
				doc.text(`Totale ${n}: ${contoEuro(t.tot)}  ·  pagato ${contoEuro(t.pag)}  ·  da pagare`, 44, y);
				doc.setFont("helvetica", "bold");
				doc.setTextColor(...t.da > 0 ? rosso : verde);
				doc.text(contoEuro(t.da), colImp, y, { align: "right" });
				y += 8;
			}
		});
		if (y > 240) nuovaPagina();
		const t = resTotali(c.lavori);
		y += 4;
		doc.setDrawColor(...oro);
		doc.setLineWidth(.6);
		doc.line(M, y, 192, y);
		y += 8;
		doc.setFont("helvetica", "normal");
		doc.setFontSize(11);
		doc.setTextColor(...grigio);
		doc.text(`${c.lavori.length === 1 ? "1 intervento" : c.lavori.length + " interventi"}`, M, y);
		doc.text("Totale", 147, y);
		doc.setFont("helvetica", "bold");
		doc.setTextColor(...verde);
		doc.text(contoEuro(t.tot), 192, y, { align: "right" });
		y += 6.5;
		doc.setFont("helvetica", "normal");
		doc.setTextColor(...grigio);
		doc.text("Pagato", 147, y);
		doc.setFont("helvetica", "bold");
		doc.setTextColor(...verde);
		doc.text(contoEuro(t.pag), 192, y, { align: "right" });
		y += 8;
		doc.setFontSize(15);
		doc.setTextColor(...t.da > 0 ? rosso : verde);
		doc.text("DA PAGARE  " + contoEuro(t.da), 192, y, { align: "right" });
		y += 12;
		if (t.da > 0 && (currentUser?.datiPagamentoIban || currentUser?.datiPagamentoPaypal)) {
			if (y > 250) nuovaPagina();
			doc.setFont("helvetica", "bold");
			doc.setFontSize(12);
			doc.setTextColor(...verde);
			doc.text("Dati per il pagamento", M, y);
			y += 7;
			doc.setFont("helvetica", "normal");
			doc.setFontSize(10.5);
			doc.setTextColor(...grigio);
			if (currentUser.datiPagamentoNome) {
				doc.text("Intestatario: " + currentUser.datiPagamentoNome, M, y);
				y += 6;
			}
			if (currentUser.datiPagamentoIban) {
				doc.text("IBAN: " + currentUser.datiPagamentoIban, M, y);
				y += 6;
			}
			if (currentUser.datiPagamentoPaypal) {
				doc.text("PayPal: " + currentUser.datiPagamentoPaypal, M, y);
				y += 6;
			}
		}
		y = riquadroInvitoPdf(doc, solo || luogo, y + 4, W, M, () => {
			piede();
			doc.addPage();
			return 22;
		});
		piede();
		return {
			blob: doc.output("blob"),
			nome: resNomeFile()
		};
	}
	function resScaricaBlob(blob, nome) {
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = nome;
		document.body.appendChild(a);
		a.click();
		a.remove();
		setTimeout(() => URL.revokeObjectURL(url), 3e4);
	}
	async function resCondividi() {
		if (!resCtx) return;
		showToast("Creo il PDF…");
		try {
			const { blob, nome } = await creaPdfResoconto();
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
			resScaricaBlob(blob, nome);
			showToast("Il PDF è stato scaricato: allegalo alla tua email o a WhatsApp.");
		} catch (err) {
			console.error("resCondividi:", err);
			showToast("Impossibile creare il PDF: " + (err?.message || err));
		}
	}
	async function resScarica() {
		if (!resCtx) return;
		try {
			const { blob, nome } = await creaPdfResoconto();
			resScaricaBlob(blob, nome);
		} catch (err) {
			console.error("resScarica:", err);
			showToast("Impossibile creare il PDF: " + (err?.message || err));
		}
	}
	// equo-app-src/src/ruoli/maniscalco/moduli/101-importazione-vecchia-app.js
	var impScelte = [];
	var impDate = [];
	var impFatte = 0;
	var impTotScelte = 0;
	var impRimandato = false;
	var impInCorso = false;
	function impManiscalco() {
		return !DEMO_MODE && !!currentUser && vistaAi() === "professionista" && (currentUser.vistaAttiva || currentUser.ruolo) === "maniscalco";
	}
	async function impCarica() {
		const [s, d] = await Promise.all([DB.importScelteAperte(), DB.importDateDaConfermare()]);
		impScelte = s;
		impDate = d;
	}
	async function controllaImportVecchiaApp() {
		if (impRimandato || impInCorso || !impManiscalco()) return;
		if (document.getElementById("eq-pop-vista")?.classList.contains("attivo")) {
			setTimeout(controllaImportVecchiaApp, 3e3);
			return;
		}
		impInCorso = true;
		try {
			await impCarica();
			if (!impScelte.length && !impDate.length) return;
			impFatte = 0;
			impTotScelte = impScelte.length;
			impDisegna();
			openModal("modal-import-vecchia");
		} catch (e) {
			console.warn("importazione vecchia app:", e);
		} finally {
			impInCorso = false;
		}
	}
	function impPiuTardi() {
		impRimandato = true;
		closeModal("modal-import-vecchia");
		const n = impScelte.length, d = impDate.length;
		const parti = [];
		if (n) parti.push(n === 1 ? "1 scelta" : n + " scelte");
		if (d) parti.push(d === 1 ? "1 data" : d + " date");
		if (parti.length) showToast("Ti mancano " + parti.join(" e ") + ": te le richiedo al prossimo accesso");
	}
	function impDisegna() {
		const tit = document.getElementById("imp-tit"), corpo = document.getElementById("imp-corpo");
		if (impScelte.length) {
			const s = impScelte[0];
			tit.textContent = "Dalla vecchia app: " + (impFatte + 1) + " di " + impTotScelte;
			const intro = impFatte === 0 ? `<p class="imp-intro">Abbiamo portato su Equo strutture, cavalli, scadenze e pagamenti della tua vecchia app. Su alcune cose decidi tu: una alla volta, poi controlli le date.</p>` : "";
			const bottoni = (s.opzioni || []).map((o) => {
				if (s.tipo === "pagamento_ignoto" && o.k === "da_saldare") return `<div class="imp-importo"><label class="prezzi-campo"><span>€</span><input type="number" min="0" step="0.01" inputmode="decimal" id="imp-importo" placeholder="importo"></label>
          <button class="btn btn-outline" onclick="impScegli('${o.k}')">${escapeHtml(o.t)}</button></div>`;
				return `<button class="btn btn-outline" onclick="impScegli('${o.k}')">${escapeHtml(o.t)}</button>`;
			}).join("");
			corpo.innerHTML = `${intro}<div class="imp-scheda"><div class="imp-cosa">${escapeHtml(s.titolo)}</div>
      <p>${escapeHtml(s.testo || "")}</p><div class="imp-opz">${bottoni}</div></div>`;
			return;
		}
		tit.textContent = "Le date delle ultime ferrature";
		const gruppi = /* @__PURE__ */ new Map();
		impDate.forEach((i) => {
			const k = i.cliente_mascalcia_id || "-";
			if (!gruppi.has(k)) gruppi.set(k, {
				nome: i.clienti_mascalcia?.nome || "Senza struttura",
				righe: []
			});
			gruppi.get(k).righe.push(i);
		});
		const oggi = isoLocale(/* @__PURE__ */ new Date());
		const elenco = [...gruppi.entries()].sort((a, b) => a[1].nome.localeCompare(b[1].nome));
		corpo.innerHTML = `<p class="imp-intro">La vecchia app segnava solo la prossima scadenza: la data dell'ultima ferratura l'abbiamo stimata.
      Apri ogni struttura, correggi le date sbagliate e tocca «Confermo». Le scadenze restano quelle della vecchia app.</p>
    <div class="imp-resta">${impDate.length === 1 ? "Manca 1 cavallo" : "Mancano " + impDate.length + " cavalli"} in ${elenco.length === 1 ? "1 struttura" : elenco.length + " strutture"}</div>
    ${elenco.map(([, g]) => `<details class="imp-gruppo"><summary><b>${escapeHtml(g.nome)}</b><span>${g.righe.length}</span></summary>
      ${g.righe.sort((a, b) => (a.cavalli_clienti_mascalcia?.nome || "").localeCompare(b.cavalli_clienti_mascalcia?.nome || "")).map((i) => `<div class="imp-riga">
        <div class="n"><b>${escapeHtml(i.cavalli_clienti_mascalcia?.nome || "Cavallo")}</b>${i.prossima_scadenza ? `<small>scade ${escapeHtml(formatDataBreve(i.prossima_scadenza))}</small>` : ""}</div>
        <input type="date" data-id="${i.id}" value="${String(i.data_intervento || "").slice(0, 10)}" min="2020-01-01" max="${oggi}"></div>`).join("")}
      <button class="btn btn-primary imp-conferma" onclick="impConfermaGruppo(this)">Confermo ${g.righe.length === 1 ? "la data" : "le " + g.righe.length + " date"}</button></details>`).join("")}`;
	}
	async function impScegli(k) {
		const s = impScelte[0];
		if (!s) return;
		let importo = null;
		if (s.tipo === "pagamento_ignoto" && k === "da_saldare") {
			importo = Number(document.getElementById("imp-importo")?.value);
			if (!(importo > 0)) {
				showToast("Scrivi l'importo da saldare");
				document.getElementById("imp-importo")?.focus();
				return;
			}
		}
		document.querySelectorAll("#imp-corpo button").forEach((b) => b.disabled = true);
		const { data, error } = await DB.importDecidi(s.id, k, importo);
		if (error || !data || data.ok === false) {
			document.querySelectorAll("#imp-corpo button").forEach((b) => b.disabled = false);
			showToast("Non sono riuscito a salvare: " + (error?.message || data?.motivo || "riprova"));
			return;
		}
		impScelte.shift();
		impFatte++;
		if (!impScelte.length) impDate = await DB.importDateDaConfermare();
		if (!impScelte.length && !impDate.length) return impFinito();
		impDisegna();
	}
	async function impConfermaGruppo(btn) {
		const box = btn.closest(".imp-gruppo");
		const oggi = isoLocale(/* @__PURE__ */ new Date());
		const righe = [...box.querySelectorAll("input[type=date]")].map((x) => ({
			id: x.dataset.id,
			data: x.value
		}));
		if (righe.some((r) => !r.data || r.data > oggi || r.data < "2020-01-01")) {
			showToast("Controlla le date: non possono essere vuote né nel futuro");
			return;
		}
		btn.disabled = true;
		const { data, error } = await DB.importConfermaDate(righe);
		if (error) {
			btn.disabled = false;
			showToast("Non sono riuscito a salvare: " + error.message);
			return;
		}
		const fatte = new Set(righe.map((r) => r.id));
		impDate = impDate.filter((i) => !fatte.has(i.id));
		showToast((data === 1 ? "1 data confermata" : (data || righe.length) + " date confermate") + " · " + (box.querySelector("summary b")?.textContent || ""));
		if (!impDate.length) return impFinito();
		box.remove();
		const nStr = document.querySelectorAll("#imp-corpo .imp-gruppo").length, resta = document.querySelector("#imp-corpo .imp-resta");
		if (resta) resta.textContent = (impDate.length === 1 ? "Manca 1 cavallo" : "Mancano " + impDate.length + " cavalli") + " in " + (nStr === 1 ? "1 struttura" : nStr + " strutture");
	}
	async function impFinito() {
		closeModal("modal-import-vecchia");
		showToast("Fatto: i dati della vecchia app sono a posto");
		try {
			await loadClientiMascalcia();
			await renderIncassi$1();
			await renderProDeadlines();
		} catch (e) {}
	}
	// equo-app-src/src/ruoli/maniscalco/moduli/index.js
	Object.assign(window, {
		cavPrezzoModifica,
		cavPrezzoSalva,
		apriScadenzaCavallo,
		richiamoAnteprima,
		richiamoCambiaData,
		richiamoSposta,
		acavSesso,
		testoAnagraficaCavallo,
		usaPosizioneQui,
		apriCambiaProprietario,
		confermaCambiaProprietario,
		cpDestCambiata,
		cpScegliCavallo,
		apriResoconto,
		resChi,
		resCondividi,
		resDate,
		resPeriodo,
		resScarica,
		ferIntervallo,
		ferIntervalloImposta,
		apriAnagraficaCavallo,
		cavIntervalloCambia,
		salvaAnagraficaCavallo,
		allineaRender,
		apriAllineaScadenze,
		cicloCambia,
		cicloTogli,
		confermaAllineaScadenze,
		ferDettaglio,
		ferStatoSistema,
		impostaMisuraPredefinita,
		controllaImportVecchiaApp,
		impConfermaGruppo,
		impPiuTardi,
		impScegli,
		accettaRichiesta,
		agNomeCavallo,
		agOrdinaGiro,
		aggiornaEtichetteNuovoCliente,
		aggiornaGiaFatto,
		aggiornaQuando,
		aggiornaSwitchHome,
		aggiungiCavalloCodice,
		aggiungiCavalloDaScheda,
		aggiungiCavalloEditCliente,
		aggiungiGiorniIso,
		aggiungiPrezziMancanti,
		applicaVistaHome,
		applicaVistaManiscalco,
		apriAbbinamentoDaChat,
		apriAllegato,
		apriAzioniEvento,
		apriCavalloDaCartella,
		apriCollegaStruttura,
		apriFerroCavallo,
		apriGiro,
		apriInvioConto,
		apriListaHome,
		apriNuovoCavalloCartella,
		apriNuovoCliente,
		apriNuovoConto,
		apriPropostaStruttura,
		apriRazzaCavallo,
		apriRichiamo,
		apriSchedaCavalloPro,
		apriSpostaCavalloPro,
		apriSpostaCavalloProprietario,
		assegnaInterventoCavallo,
		avvisaClienteAppuntamento,
		azioneEvento,
		cambiaPromemoriaPagamenti,
		cambiaSettimanaAgenda,
		cambiaVistaManiscalco,
		caricaAllegatiCavallo,
		caricaAllegatoCavallo,
		caricaCavalliMiei,
		caricaJsPdf,
		caricaRichiamiPredefiniti,
		caricaUbicazioni,
		chiediSiNo,
		chiudiEditorFerro,
		chiudiSchedaCavalloPro,
		clienteDiId,
		clientiAttivi,
		closeClienteDetail,
		closeFarrierChatThread,
		closeQrScanner,
		confermaAbbinamentoCavalli,
		confermaArchiviaCliente,
		confermaGiro,
		confermaScollegaStruttura,
		confermaSposta,
		confermaVistaMan,
		contoAnnulla,
		contoCondividi,
		contoInviaChat,
		contoScarica,
		contoSegnaPagato,
		contoSetDate,
		contoSetModo,
		contoSetPeriodo,
		contoToggle,
		contoToggleGruppo,
		creaCavalliDaTesto,
		creaContoDaScelte,
		creaPdfConto,
		creaPdfEvento,
		createClienteMascalcia,
		deleteCurrentCliente,
		descrFerraturaCavallo,
		eliminaAllegato,
		eliminaCavalloEditCliente,
		eliminaInterventoInModifica,
		eliminaInterventoOrfano,
		ferLavoro,
		ferMisura,
		ferSistema,
		ferTipo,
		filtraStoricoCavallo,
		fissaDaScadenza,
		formatDataBreve,
		generaPdfEvento,
		gestisciCodiceScansionato,
		giorniRichiamoSuggeriti,
		giorniTra,
		hmAltro,
		hmPortami,
		hmScadenze,
		hmToccaBanner,
		hmVai,
		hpFiltra,
		hpGiornoEtichetta,
		hpSegnaFatto,
		ignoraSimili,
		importiSuggeriti,
		incApri,
		inviaEventoInChat,
		inviaPropostaStruttura,
		inviaRichiestaStruttura,
		isPremium,
		isStruttura,
		isStrutturaCollegata,
		isoLocale,
		loadClienteInterventi,
		loadClientiMascalcia,
		luogoDi,
		luogoEvento,
		luogoProprietario,
		mlAlLavoro,
		mlAnnulla,
		mlApriProblema,
		mlChiudi,
		mlFoto,
		mlHammer,
		mlHoFinito,
		mlImporto,
		mlPag,
		mlPiede,
		mlProbAvanti,
		mlRender,
		mlSalvaProblema,
		mlVoce,
		modificaAnagraficaCavalloPro,
		modificaFerraturaDaIntervento,
		mostraLimiteClienti,
		mostraSceltaVistaManiscalco,
		mostraSpostaCavalli,
		navigaLuogo,
		ncavClienteCambiato,
		nomiCavalliCliente,
		nuovoAppuntamentoGiorno,
		nuovoCavalloLavoro,
		nuovoInterventoCavalloPro,
		onCavalliMultiChange,
		onInterventoClienteChange,
		onMisuraSistemaChange,
		openClienteDetail,
		openEditCliente,
		openFarrierChatThread,
		openInterventoModal,
		openQrScanner,
		paroleCercaCliente,
		proponiAbbinamentoCavalli,
		quandoIntervento,
		razzaImposta,
		razzaSegnala,
		razzaValore,
		renderAgendaSettimana: renderAgendaSettimana$1,
		renderBoxCavalliCliente,
		renderCorpoCavalloPro,
		renderDoveStaProprietario,
		renderFarrierChatThread,
		renderHomeMan,
		renderIncassi: renderIncassi$1,
		renderIncassiCompleta,
		renderIncassiSaldati,
		renderProDeadlines,
		renderTabCavalloPro,
		richiamoAzione,
		richiamoCambia,
		richiamoConferma,
		richiamoFerriN,
		richiamoFerriRender,
		richiamoMostraAzioni,
		richiamoPagamento,
		richiamoRimanda,
		richiamoRuotaScroll,
		richiamoTotale,
		richiamoVaiA,
		rifiutaRichiesta,
		rimuoviAllegatoChat,
		rispondiInvitoStruttura,
		rispondiPrezzi,
		rispondiSiNo,
		saltaAbbinamentoCavalli,
		salvaEditCliente,
		salvaFerroCavallo,
		salvaInterventoMascalcia,
		salvaNuovoCavalloCartella,
		salvaRazzaCavallo,
		salvaRichiamiPredefiniti,
		salvaSchedaFerratura,
		sceltaCartellaClienti,
		sceltaMesiIncassi,
		sceltaModoIntervento,
		sceltaPeriodoIncassi,
		sceltaStraordinario,
		sceltaVistaIncassi,
		sceltaVistaMan,
		sceltaZoccolo,
		scollegaStrutturaCorrente,
		segnaFattoAgenda,
		segnaSaldatoIncassi,
		selezionaMisura,
		selezionaQuantita,
		sendFarrierChatMessage,
		siglaFerro,
		spAggiorna,
		spCerca,
		spostaCavalliCliente,
		spostamentoHtml,
		statoCavalloPro,
		testoFerroIntervento,
		testoPrimaModifica,
		testoRichiesta,
		toggleGiornoAgenda,
		toggleInterventoNuovoCavallo,
		toggleInterventoTipoFields,
		toggleQrCliente,
		tornaSettimanaCorrente,
		ubicDi,
		unisciSimili,
		vaiAllaDataAgenda,
		vistaCompleta,
		wgCercaLuogoVai,
		wgClienteDi,
		wgLuogoAMano,
		wgMostraMappe,
		wgNaviga: wgNaviga$1,
		wgNavigaEvento,
		wgRidisegna,
		wgScegli,
		wgSceltaLuogo,
		wgScriviRichiamo,
		annullaLasciaCavallo,
		apriLasciaCavallo,
		confermaLasciaCavallo,
		ripristinaCavallo,
		condividiInvitoCliente,
		apriCardPro,
		chiudiCardPro,
		ecvAggiungiEsperienza,
		ecvAggiungiFormazione,
		ecvAggiungiVoce,
		ecvCampo,
		ecvChiediReferenza,
		ecvCopiaLink,
		ecvGiraPass,
		ecvHammer,
		ecvIndietro,
		ecvInterruttore,
		ecvLingua,
		ecvModello,
		ecvMostra,
		ecvPdfCv,
		ecvPdfPass,
		ecvPubblica,
		ecvReferenza,
		ecvSlug,
		ecvSpec,
		ecvTogliElemento,
		ecvTogliVoce,
		apriDaFissare,
		agAggiornaSchede: agAggiornaSchede$1,
		agApplicaVistaAgenda,
		agDsApri,
		agDsSaldato,
		agFiltroProg,
		agFissaScadenza,
		agFissaTutti,
		agNfAnnulla,
		agNfSposta,
		condividiInvitoAgenda,
		scegliSchedaAgenda,
		scegliVistaAgenda,
		contoAnnullaERifai,
		contoApriEsistente,
		pmAggiornaAzione,
		pmAggiornaQuando,
		pmApriNuovo,
		pmDomani,
		pmElimina,
		pmEsegui,
		pmFatto,
		pmModifica,
		pmQuando,
		pmRenderHome: pmRenderHome$1,
		pmSalva,
		pmSalvaDaHammer,
		pmTastiChat,
		ofAggiornaAiutanteData,
		ofSalvaSpesaDaHammer,
		ofMatRapido,
		ofTitoloDaTipo,
		ofAggiornaRiepiloghi,
		ofAggiungiMatGiorno,
		ofApri,
		ofApriGiornata,
		ofApriMezzo,
		ofArchiviaMezzo,
		ofCampiAiutanteIntervento: ofCampiAiutanteIntervento$1,
		ofEliminaIntervento,
		ofEliminaSpesa,
		ofFineOnboarding,
		ofFormAiutante,
		ofFormIntervento,
		ofFormMateriale,
		ofFormMezzo,
		ofFormSpesa,
		ofMese,
		ofMostraMezzo,
		ofOggiScegli,
		ofOnboarding,
		ofPassoAiutante,
		ofPassoMateriale,
		ofPassoMezzo,
		ofPreparaAiutanteAppuntamento: ofPreparaAiutanteAppuntamento$1,
		ofSalvaAiutante,
		ofSalvaBase,
		ofSalvaGiornataDaForm,
		ofSalvaIntervento,
		ofSalvaMateriale,
		ofSalvaMezzo,
		ofSalvaOggi,
		ofSalvaSpesa,
		ofScheda,
		ofScorta,
		ofSeg,
		ofStriscia,
		ofTogliAiutante,
		ofTogliMateriale,
		ofTornaOfficina,
		ofWizardAggiungi,
		hmConferme,
		hmContaConferme
	});
})();

