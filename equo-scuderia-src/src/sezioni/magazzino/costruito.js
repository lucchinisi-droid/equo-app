
// === GENERATO da equo-app-src/strumenti/costruisci-moduli.mjs: NON modificare qui, modificare equo-scuderia-src/src/sezioni/magazzino/moduli/ ===
(function() {
	// equo-scuderia-src/src/sezioni/magazzino/moduli/036-dati-demo.js
	function magDemoSeed() {
		const ub = [
			{
				id: "u1",
				nome: "Fienile",
				tipo: "deposito",
				parent_id: null
			},
			{
				id: "u2",
				nome: "Magazzino mangimi",
				tipo: "deposito",
				parent_id: null
			},
			{
				id: "u3",
				nome: "Selleria",
				tipo: "deposito",
				parent_id: null
			},
			{
				id: "u4",
				nome: "Armadio farmaci",
				tipo: "zona",
				parent_id: "u3"
			},
			{
				id: "u5",
				nome: "Scaffale coperte",
				tipo: "scaffale",
				parent_id: "u3"
			},
			{
				id: "u6",
				nome: "Officina mascalcia",
				tipo: "deposito",
				parent_id: null
			}
		];
		const fo = [
			{
				id: "f1",
				nome: "Consorzio Agrario Colleferro",
				referente: "Paolo",
				telefono: "+39 333 1234567",
				email: "ordini@consorzio.it",
				note: "Consegna il martedì"
			},
			{
				id: "f2",
				nome: "Farmacia Veterinaria San Giorgio",
				telefono: "+39 06 7654321",
				email: "info@farmaciavet.it"
			},
			{
				id: "f3",
				nome: "Selleria Il Galoppo",
				telefono: "+39 347 1112223"
			},
			{
				id: "f4",
				nome: "Forniture Mascalcia Italia",
				email: "shop@mascalcia.it"
			}
		];
		const A = (id, categoria, sottocategoria, nome, extra) => ({
			id,
			centro_id: "demo-centro",
			categoria,
			sottocategoria,
			nome,
			unita: MAG_CATEGORIE[categoria].unita,
			soglia_minima: 0,
			gestisce_lotti: false,
			archiviato: false,
			...extra
		});
		const ar = [
			A("a1", "alimentazione", "Fieno", "Fieno di prato polifita", {
				formato: "balla 25 kg",
				unita: "balle",
				soglia_minima: 40,
				scorta_ottimale: 120,
				ubicazione_id: "u1",
				fornitore_id: "f1",
				costo_unitario: 6.5
			}),
			A("a2", "alimentazione", "Mangimi", "Mangime fioccato sport", {
				marca: "Cavalor",
				formato: "sacco 20 kg",
				unita: "sacchi",
				soglia_minima: 8,
				scorta_ottimale: 25,
				ubicazione_id: "u2",
				fornitore_id: "f1",
				costo_unitario: 24
			}),
			A("a3", "alimentazione", "Cereali e fioccati", "Orzo schiacciato", {
				formato: "sacco 25 kg",
				unita: "sacchi",
				soglia_minima: 4,
				scorta_ottimale: 12,
				ubicazione_id: "u2",
				fornitore_id: "f1",
				costo_unitario: 14
			}),
			A("a4", "alimentazione", "Mash e crusca", "Mash digestivo", {
				formato: "sacco 15 kg",
				unita: "sacchi",
				soglia_minima: 2,
				scorta_ottimale: 6,
				ubicazione_id: "u2",
				fornitore_id: "f1",
				costo_unitario: 28
			}),
			A("a5", "alimentazione", "Snack e carote", "Carote", {
				unita: "kg",
				soglia_minima: 10,
				scorta_ottimale: 40,
				ubicazione_id: "u2",
				fornitore_id: "f1",
				costo_unitario: .9
			}),
			A("a6", "lettiera", "Paglia", "Paglia di frumento", {
				formato: "balla piccola",
				unita: "balle",
				soglia_minima: 30,
				scorta_ottimale: 100,
				ubicazione_id: "u1",
				fornitore_id: "f1",
				costo_unitario: 4
			}),
			A("a7", "lettiera", "Truciolo", "Truciolo depolverato", {
				formato: "balla 20 kg",
				unita: "balle",
				soglia_minima: 15,
				scorta_ottimale: 40,
				ubicazione_id: "u1",
				fornitore_id: "f1",
				costo_unitario: 9.5
			}),
			A("a8", "integratori", "Articolazioni", "Integratore articolare", {
				marca: "Equistro",
				formato: "secchio 1,8 kg",
				unita: "conf",
				soglia_minima: 2,
				scorta_ottimale: 5,
				ubicazione_id: "u4",
				fornitore_id: "f2",
				costo_unitario: 62,
				gestisce_lotti: true
			}),
			A("a9", "integratori", "Elettroliti", "Sali minerali elettroliti", {
				formato: "barattolo 3 kg",
				unita: "conf",
				soglia_minima: 2,
				scorta_ottimale: 4,
				ubicazione_id: "u4",
				fornitore_id: "f2",
				costo_unitario: 35,
				gestisce_lotti: true
			}),
			A("a10", "farmaci", "Vermifughi", "Vermifugo pasta ivermectina", {
				unita: "siringhe",
				soglia_minima: 5,
				scorta_ottimale: 15,
				ubicazione_id: "u4",
				fornitore_id: "f2",
				costo_unitario: 11,
				gestisce_lotti: true
			}),
			A("a11", "farmaci", "Disinfettanti e medicazioni", "Iodopovidone 10%", {
				formato: "flacone 1 l",
				unita: "flaconi",
				soglia_minima: 1,
				scorta_ottimale: 3,
				ubicazione_id: "u4",
				fornitore_id: "f2",
				costo_unitario: 14,
				gestisce_lotti: true
			}),
			A("a12", "farmaci", "Bende e fasce", "Fasce coesive", {
				unita: "rotoli",
				soglia_minima: 10,
				scorta_ottimale: 30,
				ubicazione_id: "u4",
				fornitore_id: "f2",
				costo_unitario: 3.2
			}),
			A("a13", "mascalcia", "Ferri", "Ferri anteriori", {
				marca: "Mustad",
				formato: "misura 2",
				unita: "paia",
				soglia_minima: 6,
				scorta_ottimale: 20,
				ubicazione_id: "u6",
				fornitore_id: "f4",
				costo_unitario: 9
			}),
			A("a14", "mascalcia", "Chiodi", "Chiodi E-head", {
				marca: "Mustad",
				formato: "E5 · scatola 250",
				unita: "scatole",
				soglia_minima: 2,
				scorta_ottimale: 6,
				ubicazione_id: "u6",
				fornitore_id: "f4",
				costo_unitario: 22
			}),
			A("a15", "coperte", "Coperte impermeabili", "Coperta impermeabile 200 g", {
				formato: "145 cm",
				unita: "pz",
				ubicazione_id: "u5",
				fornitore_id: "f3",
				costo_unitario: 89,
				condizione: "ok",
				cavallo_id: "c1"
			}),
			A("a16", "coperte", "Coperte da box", "Coperta da box pile", {
				formato: "155 cm",
				unita: "pz",
				ubicazione_id: "u5",
				fornitore_id: "f3",
				costo_unitario: 45,
				condizione: "da_lavare"
			}),
			A("a17", "selleria", "Selle", "Sella da salto scuola", {
				marca: "Prestige",
				formato: "17,5\"",
				unita: "pz",
				ubicazione_id: "u3",
				costo_unitario: 1200,
				condizione: "da_riparare"
			}),
			A("a18", "selleria", "Sottosella", "Sottosella bianco", {
				unita: "pz",
				soglia_minima: 4,
				ubicazione_id: "u3",
				fornitore_id: "f3",
				costo_unitario: 25,
				condizione: "ok"
			}),
			A("a19", "pulizia", "Grasso e olio per zoccoli", "Grasso per zoccoli", {
				formato: "barattolo 1 l",
				unita: "conf",
				soglia_minima: 2,
				scorta_ottimale: 5,
				ubicazione_id: "u3",
				fornitore_id: "f3",
				costo_unitario: 12
			}),
			A("a20", "pulizia", "Shampoo e prodotti", "Shampoo cavalli", {
				formato: "flacone 1 l",
				unita: "flaconi",
				soglia_minima: 2,
				scorta_ottimale: 4,
				ubicazione_id: "u3",
				fornitore_id: "f3",
				costo_unitario: 9
			}),
			A("a21", "attrezzatura", "Carriole e forche", "Forca da letame", {
				unita: "pz",
				ubicazione_id: "u1",
				costo_unitario: 18,
				condizione: "da_sostituire"
			}),
			A("a22", "attrezzatura", "Secchi e mangiatoie", "Secchi 12 l", {
				unita: "pz",
				soglia_minima: 5,
				ubicazione_id: "u2",
				costo_unitario: 4,
				condizione: "ok"
			}),
			A("a23", "personale", "Polo e magliette", "Polo staff con logo", {
				formato: "taglie S·M·L·XL",
				unita: "pz",
				soglia_minima: 4,
				ubicazione_id: "u3",
				costo_unitario: 18,
				condizione: "ok"
			}),
			A("a24", "personale", "Caschi", "Casco da equitazione scuola", {
				formato: "taglia 56",
				unita: "pz",
				ubicazione_id: "u3",
				costo_unitario: 65,
				condizione: "da_sostituire"
			}),
			A("a25", "ufficio", "Carta", "Carta A4", {
				formato: "risma 500 fogli",
				unita: "conf",
				soglia_minima: 3,
				scorta_ottimale: 10,
				costo_unitario: 4.5
			}),
			A("a26", "ufficio", "Toner e cartucce", "Toner stampante", {
				marca: "Brother",
				formato: "TN-2420",
				unita: "pz",
				soglia_minima: 1,
				scorta_ottimale: 2,
				costo_unitario: 39
			}),
			A("a27", "pulizia_struttura", "Detersivi", "Detersivo pavimenti", {
				formato: "tanica 5 l",
				unita: "pz",
				soglia_minima: 2,
				scorta_ottimale: 6,
				costo_unitario: 11
			}),
			A("a28", "pulizia_struttura", "Sacchi", "Sacchi neri 110 l", {
				formato: "rotolo 20 pz",
				unita: "rotoli",
				soglia_minima: 4,
				scorta_ottimale: 12,
				costo_unitario: 3
			})
		];
		const oggi = /* @__PURE__ */ new Date();
		const g = (d, h = 9) => {
			const x = new Date(oggi);
			x.setDate(x.getDate() - d);
			x.setHours(h, d * 7 % 60, 0, 0);
			return x.toISOString();
		};
		const sc = (d) => {
			const x = new Date(oggi);
			x.setDate(x.getDate() + d);
			return isoLoc(x);
		};
		const mv = [];
		let n = 0;
		const M = (articolo_id, tipo, quantita, giorni, extra = {}) => mv.push({
			id: "m" + ++n,
			centro_id: "demo-centro",
			articolo_id,
			tipo,
			quantita,
			created_at: g(giorni, 8 + n % 9),
			creato_da_nome: [
				"Marco Bianchi",
				"Tu (admin)",
				"Giulia"
			][n % 3],
			...extra
		});
		[
			["a23", 6],
			["a24", 3],
			["a25", 4],
			["a26", 1],
			["a27", 5],
			["a28", 3],
			["a1", 150],
			["a2", 30],
			["a3", 12],
			["a4", 6],
			["a5", 40],
			["a6", 110],
			["a7", 30],
			["a12", 25],
			["a13", 14],
			["a14", 4],
			["a15", 1],
			["a16", 2],
			["a17", 1],
			["a18", 10],
			["a19", 4],
			["a20", 3],
			["a21", 2],
			["a22", 8]
		].forEach(([id, q]) => M(id, "carico", q, 60, {
			fornitore_id: ar.find((a) => a.id === id).fornitore_id,
			nota: "Giacenza iniziale"
		}));
		M("a8", "carico", 4, 60, {
			lotto: "EQ2291",
			scadenza: sc(18),
			fornitore_id: "f2"
		});
		M("a8", "carico", 3, 20, {
			lotto: "EQ2340",
			scadenza: sc(300),
			fornitore_id: "f2"
		});
		M("a9", "carico", 3, 50, {
			lotto: "EL771",
			scadenza: sc(-4),
			fornitore_id: "f2"
		});
		M("a10", "carico", 10, 55, {
			lotto: "IV0923",
			scadenza: sc(210),
			fornitore_id: "f2"
		});
		M("a11", "carico", 2, 40, {
			lotto: "PV118",
			scadenza: sc(420),
			fornitore_id: "f2"
		});
		for (let d = 56; d >= 0; d--) {
			M("a1", "scarico", 2.2 + d % 3 * .3, d);
			if (d % 2 === 0) M("a6", "scarico", 1.6, d);
			if (d % 2 === 1) M("a2", "scarico", .45, d);
			if (d % 4 === 0) M("a3", "scarico", .3, d);
			if (d % 3 === 0) M("a5", "scarico", 1.5, d);
			if (d % 5 === 0) M("a7", "scarico", .9, d);
		}
		M("a1", "carico", 60, 30, { fornitore_id: "f1" });
		M("a5", "carico", 25, 14, { fornitore_id: "f1" });
		M("a8", "scarico", 3, 15, {
			lotto: "EQ2291",
			scadenza: sc(18)
		});
		M("a10", "scarico", 4, 25, {
			lotto: "IV0923",
			scadenza: sc(210),
			cavallo_id: "c1"
		});
		M("a10", "scarico", 2, 6, {
			lotto: "IV0923",
			scadenza: sc(210),
			cavallo_id: "c2"
		});
		M("a12", "scarico", 8, 20);
		M("a12", "scarico", 6, 7);
		M("a13", "scarico", 5, 21);
		M("a13", "scarico", 4, 6);
		M("a14", "scarico", 1, 21);
		M("a14", "scarico", 1.5, 6);
		M("a19", "scarico", 1, 30);
		M("a19", "scarico", 1, 10);
		M("a20", "scarico", 1, 12);
		M("a2", "scarico", 4, 3);
		M("a4", "scarico", 2, 9);
		mv.sort((x, y) => y.created_at.localeCompare(x.created_at));
		return {
			articoli: ar,
			movimenti: mv,
			ubicazioni: ub,
			fornitori: fo,
			categorie: [],
			ordini: [{
				id: "o1",
				centro_id: "demo-centro",
				fornitore_id: "f4",
				stato: "inviato",
				righe: [{
					articolo_id: "a13",
					quantita: 10
				}],
				created_at: g(2),
				inviato_at: g(2)
			}]
		};
	}
	// equo-scuderia-src/src/sezioni/magazzino/moduli/023-dati.js
	async function loadMagazzino() {
		if (!currentCentro) return;
		if (DEMO_MODE) {
			if (!demoState.mag) demoState.mag = magDemoSeed();
			Object.assign(mag, JSON.parse(JSON.stringify(demoState.mag)));
		} else {
			const cid = currentCentro.id;
			const [a, m, u, f, o, kc] = await Promise.all([
				sb.from("mag_articoli").select("*").eq("centro_id", cid).eq("archiviato", false).order("nome"),
				sb.from("mag_movimenti").select("*").eq("centro_id", cid).order("created_at", { ascending: false }).limit(5e3),
				sb.from("mag_ubicazioni").select("*").eq("centro_id", cid).order("ordine").order("nome"),
				sb.from("mag_fornitori").select("*").eq("centro_id", cid).eq("archiviato", false).order("nome"),
				sb.from("mag_ordini").select("*").eq("centro_id", cid).order("created_at", { ascending: false }).limit(100),
				sb.from("mag_categorie").select("*").eq("centro_id", cid).order("ordine").order("nome")
			]);
			[
				a,
				m,
				u,
				f,
				o
			].forEach((r) => {
				if (r.error) console.error("magazzino:", r.error);
			});
			mag.articoli = a.data || [];
			mag.movimenti = m.data || [];
			mag.ubicazioni = u.data || [];
			mag.fornitori = f.data || [];
			mag.ordini = o.data || [];
			if (kc.error) console.error("magazzino categorie:", kc.error);
			mag.categorie = kc.data || [];
		}
		magCalcola();
		mag.caricato = true;
	}
	function magCalcola() {
		const oggi = oggiLocaleIso();
		const da30 = (/* @__PURE__ */ new Date(Date.now() - 2592e6)).toISOString();
		const calc = {};
		mag.articoli.forEach((a) => {
			calc[a.id] = {
				giacenza: 0,
				lotti: {},
				consumo30: 0,
				ultimoMov: null
			};
		});
		mag.movimenti.forEach((m) => {
			const c = calc[m.articolo_id];
			if (!c) return;
			const q = Number(m.quantita || 0);
			const delta = m.tipo === "carico" ? q : m.tipo === "scarico" ? -q : m.tipo === "rettifica" ? q : 0;
			c.giacenza += delta;
			if (!c.ultimoMov) c.ultimoMov = m.created_at;
			if (m.tipo === "scarico" && m.created_at >= da30) c.consumo30 += q;
			if (m.lotto || m.scadenza) {
				const k = (m.lotto || "—") + "|" + (m.scadenza || "");
				const l = c.lotti[k] = c.lotti[k] || {
					lotto: m.lotto || null,
					scadenza: m.scadenza || null,
					qta: 0
				};
				l.qta += delta;
			}
		});
		mag.articoli.forEach((a) => {
			const c = calc[a.id];
			c.giacenza = Math.round(c.giacenza * 1e3) / 1e3;
			c.lottiAttivi = Object.values(c.lotti).filter((l) => l.qta > 1e-4).sort((x, y) => (x.scadenza || "9999").localeCompare(y.scadenza || "9999"));
			c.mediaGiorno = c.consumo30 / 30;
			c.copertura = c.mediaGiorno > 0 ? Math.floor(c.giacenza / c.mediaGiorno) : null;
			c.valore = Math.max(c.giacenza, 0) * Number(a.costo_unitario || 0);
			const soglia = Number(a.soglia_minima || 0);
			const scaduti = c.lottiAttivi.filter((l) => l.scadenza && l.scadenza < oggi);
			const inScadenza = c.lottiAttivi.filter((l) => l.scadenza && l.scadenza >= oggi && magGiorniA(l.scadenza) <= 30);
			c.scaduti = scaduti;
			c.inScadenza = inScadenza;
			const durevole = magCats()[a.categoria]?.durevole;
			let stato = "verde", motivo = "In ordine";
			if (!durevole && c.giacenza <= 0) {
				stato = "rosso";
				motivo = "Esaurito";
			} else if (soglia > 0 && c.giacenza < soglia) {
				stato = "rosso";
				motivo = "Sotto la soglia minima";
			} else if (scaduti.length) {
				stato = "rosso";
				motivo = "Lotto scaduto";
			} else if (a.condizione === "da_sostituire") {
				stato = "rosso";
				motivo = "Da sostituire";
			} else if (soglia > 0 && c.giacenza < soglia * 1.5) {
				stato = "giallo";
				motivo = "In esaurimento";
			} else if (c.copertura !== null && c.copertura < 7 && !durevole) {
				stato = "giallo";
				motivo = `Scorta per ${c.copertura} ${c.copertura === 1 ? "giorno" : "giorni"}`;
			} else if (inScadenza.length) {
				stato = "giallo";
				motivo = "Lotto in scadenza";
			} else if (a.condizione === "da_riparare" || a.condizione === "da_lavare") {
				stato = "giallo";
				motivo = MAG_COND[a.condizione];
			}
			c.stato = stato;
			c.motivo = motivo;
			const target = Number(a.scorta_ottimale || 0) || soglia * 2;
			c.daOrdinare = stato !== "verde" && !durevole && target > c.giacenza ? Math.ceil(target - Math.max(c.giacenza, 0)) : 0;
		});
		mag.calc = calc;
		magAggiornaContatore();
	}
	function magStatoGruppo(articoli) {
		const st = articoli.map((a) => mag.calc[a.id]?.stato || "verde");
		return {
			rosso: st.filter((s) => s === "rosso").length,
			giallo: st.filter((s) => s === "giallo").length,
			verde: st.filter((s) => s === "verde").length,
			colore: st.includes("rosso") ? "rosso" : st.includes("giallo") ? "giallo" : "verde"
		};
	}
	function magAggiornaContatore() {
		const g = magStatoGruppo(mag.articoli);
		if (typeof impostaContatoreNav === "function") impostaContatoreNav("magazzino-nav-badge", g.rosso + g.giallo, g.colore);
	}
	// equo-scuderia-src/src/sezioni/magazzino/moduli/028-articoli.js
	function magRender() {
		const grid = document.getElementById("mag-grid");
		if (!grid) return;
		document.getElementById("mag-vista-griglia").classList.toggle("active", magUI.layout === "griglia");
		document.getElementById("mag-vista-elenco").classList.toggle("active", magUI.layout === "elenco");
		grid.classList.toggle("mag-list", magUI.layout === "elenco");
		const q = (document.getElementById("mag-cerca").value || "").trim().toLowerCase();
		const filtro = document.getElementById("mag-filtro").value;
		const ordina = document.getElementById("mag-ordina").value;
		let lista = mag.articoli.filter((a) => (magUI.cat === "tutte" || a.categoria === magUI.cat) && (!magUI.sub || a.sottocategoria === magUI.sub));
		if (q) lista = lista.filter((a) => [
			a.nome,
			a.marca,
			a.formato,
			a.sottocategoria,
			magUbiNome(a.ubicazione_id),
			magCats()[a.categoria]?.nome
		].filter(Boolean).join(" ").toLowerCase().includes(q));
		if (filtro === "scadenze") lista = lista.filter((a) => mag.calc[a.id].inScadenza.length || mag.calc[a.id].scaduti.length);
		else if (filtro) lista = lista.filter((a) => mag.calc[a.id].stato === filtro);
		const peso = {
			rosso: 0,
			giallo: 1,
			verde: 2
		};
		lista.sort((x, y) => {
			const cx = mag.calc[x.id], cy = mag.calc[y.id];
			if (ordina === "nome") return x.nome.localeCompare(y.nome);
			if (ordina === "copertura") return (cx.copertura ?? 9999) - (cy.copertura ?? 9999);
			if (ordina === "valore") return cy.valore - cx.valore;
			return peso[cx.stato] - peso[cy.stato] || x.nome.localeCompare(y.nome);
		});
		const vuoto = document.getElementById("mag-vuoto");
		if (!lista.length) {
			grid.innerHTML = "";
			vuoto.style.display = "block";
			vuoto.innerHTML = !mag.articoli.length ? `<i class="fa-solid fa-boxes-stacked"></i><div style="font-weight:700;color:var(--text);margin-bottom:6px">Il magazzino è vuoto</div>
         <div style="max-width:440px;margin:0 auto 14px">Inizia dai depositi (fienile, selleria, armadio farmaci…), poi aggiungi gli articoli con la quantità che hai oggi. Da lì in poi basta registrare carichi e scarichi.</div>
         ${magPuoGestire() ? `<div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap"><button class="btn btn-outline" onclick="magVista('depositi')"><i class="fa-solid fa-warehouse"></i> Crea i depositi</button><button class="btn btn-primary" onclick="magApriArticolo()"><i class="fa-solid fa-plus"></i> Primo articolo</button></div>` : ""}` : `<i class="fa-solid fa-magnifying-glass"></i><div>Nessun articolo con questi filtri.</div>`;
			return;
		}
		vuoto.style.display = "none";
		grid.innerHTML = lista.map((a, i) => magCardArticolo(a, i)).join("");
	}
	function magCardArticolo(a, i) {
		const c = mag.calc[a.id];
		const cat = magCats()[a.categoria];
		const soglia = Number(a.soglia_minima || 0);
		const target = Math.max(Number(a.scorta_ottimale || 0), soglia * 2, c.giacenza, 1);
		const perc = Math.max(0, Math.min(100, c.giacenza / target * 100));
		const colore = c.stato === "rosso" ? "var(--danger)" : c.stato === "giallo" ? "#e0a100" : "#2f8a4e";
		const tags = [];
		const ubi = magUbiNome(a.ubicazione_id);
		if (ubi) tags.push(`<span class="mag-tag"><i class="fa-solid fa-location-dot"></i>${escapeHtml(ubi)}</span>`);
		if (c.lottiAttivi[0]?.scadenza) {
			const l = c.lottiAttivi[0];
			const gg = magGiorniA(l.scadenza);
			tags.push(`<span class="mag-tag ${gg < 0 ? "rosso" : gg <= 30 ? "giallo" : ""}"><i class="fa-solid fa-calendar"></i>${gg < 0 ? "scaduto" : "scad. " + magDataIt(l.scadenza)}</span>`);
		}
		if (a.condizione && a.condizione !== "ok" && c.motivo !== MAG_COND[a.condizione]) tags.push(`<span class="mag-tag ${a.condizione === "da_sostituire" ? "rosso" : "giallo"}">${MAG_COND[a.condizione]}</span>`);
		if (a.cavallo_id) {
			const cv = (cavalliList || []).find((x) => x.id === a.cavallo_id);
			if (cv) tags.push(`<span class="mag-tag"><i class="fa-solid fa-horse-head"></i>${escapeHtml(cv.nome)}</span>`);
		}
		const copertura = c.copertura !== null ? `≈ ${c.copertura} gg di scorta<br>${magFmt(c.mediaGiorno, 1)} ${escapeHtml(a.unita)}/giorno` : cat?.durevole ? "" : "nessun consumo<br>negli ultimi 30 gg";
		return `<div class="mag-art ${c.stato}" style="animation-delay:${Math.min(i, 20) * 18}ms" onclick="magApriDettaglio('${a.id}')">
    <div class="top">${magIcona(a.categoria)}<div style="min-width:0;flex:1"><div class="nome">${escapeHtml(a.nome)}</div>
      <div class="sub">${escapeHtml([
			a.sottocategoria,
			a.marca,
			a.formato
		].filter(Boolean).join(" · "))}</div></div><i class="mag-sem ${c.stato}${c.stato === "rosso" ? " pulse" : ""}"></i></div>
    <div class="qta"><b>${magFmt(c.giacenza)}</b><span>${escapeHtml(a.unita)}</span>${magEquivalente(c.giacenza, a) ? `<span class="equiv">${magEquivalente(c.giacenza, a)}</span>` : ""}<div class="copertura">${copertura}</div></div>
    <div class="mag-livello" title="Giacenza rispetto alla scorta ottimale"><i style="width:${perc}%;background:${colore}"></i>${soglia > 0 ? `<span class="soglia" style="left:${Math.min(100, soglia / target * 100)}%"></span>` : ""}</div>
    <div class="motivo">${c.stato === "verde" ? "" : escapeHtml(c.motivo)}</div>
    ${tags.length ? `<div class="meta">${tags.join("")}</div>` : ""}
    <div class="azioni" onclick="event.stopPropagation()">
      <button class="meno" onclick="magApriMovimento('${a.id}','scarico')"><i class="fa-solid fa-minus"></i> Usa</button>
      <button class="piu" onclick="magApriMovimento('${a.id}','carico')"><i class="fa-solid fa-plus"></i> Carica</button>
    </div>
  </div>`;
	}
	// equo-scuderia-src/src/sezioni/magazzino/moduli/027-categorie-e-sottocategorie.js
	function magRenderCategorie() {
		const tutte = magStatoGruppo(mag.articoli);
		const tile = (key, nome, icona, colore, arts, g) => {
			const tot = arts.length || 1;
			const cnt = g.rosso ? `<span class="cnt">${g.rosso}</span>` : g.giallo ? `<span class="cnt g">${g.giallo}</span>` : "";
			return `<button class="mag-cat ${magUI.cat === key ? "active" : ""}" onclick="magSelCat('${key}')">
      <span class="ic" style="background:${colore}">${icona}</span>${cnt}<i class="mag-sem ${arts.length ? g.colore : "verde"}${g.rosso ? " pulse" : ""}"></i>
      <div class="nome">${escapeHtml(nome)}</div><div class="info">${arts.length} ${arts.length === 1 ? "articolo" : "articoli"}</div>
      <div class="salute"><i style="width:${g.verde / tot * 100}%;background:#2f8a4e"></i><i style="width:${g.giallo / tot * 100}%;background:#e0a100"></i><i style="width:${g.rosso / tot * 100}%;background:var(--danger)"></i></div>
    </button>`;
		};
		let html = tile("tutte", "Tutto il magazzino", "<i class=\"fa-solid fa-boxes-stacked\"></i>", "var(--primary)", mag.articoli, tutte);
		Object.entries(magCats()).forEach(([k, c]) => {
			if (c.nascosta) return;
			const arts = mag.articoli.filter((a) => a.categoria === k);
			html += tile(k, c.nome, iconHtml(c.icon), c.colore, arts, magStatoGruppo(arts));
		});
		if (magPuoGestire()) html += `<button class="mag-cat mag-cat-nuova" onclick="magApriCategoria()"><span class="ic"><i class="fa-solid fa-plus"></i></span><div class="nome">Nuova categoria</div><div class="info">es. Trattori, Eventi, Bar…</div></button>`;
		document.getElementById("mag-cats").innerHTML = html;
		const box = document.getElementById("mag-subcats");
		if (magUI.cat === "tutte") {
			box.innerHTML = "";
			box.style.display = "none";
			return;
		}
		box.style.display = "flex";
		const c = magCats()[magUI.cat];
		const arts = mag.articoli.filter((a) => a.categoria === magUI.cat);
		const subs = [.../* @__PURE__ */ new Set([...c.sub, ...arts.map((a) => a.sottocategoria)])];
		box.innerHTML = `<button class="mag-chip ${!magUI.sub ? "active" : ""}" onclick="magSelSub('')">Tutte</button>` + subs.map((s) => {
			const as = arts.filter((a) => a.sottocategoria === s);
			const g = magStatoGruppo(as);
			return `<button class="mag-chip ${magUI.sub === s ? "active" : ""}" onclick="magSelSub(${escapeHtml(JSON.stringify(s))})">${as.length ? `<i class="mag-sem ${g.colore}"></i>` : ""}${escapeHtml(s)} <span style="opacity:.6">${as.length}</span></button>`;
		}).join("") + (c.custom && magPuoGestire() ? `<button class="mag-chip" style="margin-left:auto" onclick="magApriCategoria('${c.custom.id}')"><i class="fa-solid fa-pen"></i> Modifica categoria</button>` : "");
	}
	function magSelCat(k) {
		magUI.cat = k;
		magUI.sub = "";
		magRenderCategorie();
		magRender();
	}
	function magSelSub(s) {
		magUI.sub = s;
		magRenderCategorie();
		magRender();
	}
	function magLayout(l) {
		magUI.layout = l;
		try {
			localStorage.setItem("equo-mag-layout", l);
		} catch (e) {}
		magRender();
	}
	// equo-scuderia-src/src/sezioni/magazzino/moduli/026-colpo-d-occhio.js
	function magRenderHero() {
		const g = magStatoGruppo(mag.articoli);
		const tot = mag.articoli.length;
		const perc = tot ? Math.round(g.verde / tot * 100) : 100;
		const R = 62, C = 2 * Math.PI * R;
		const seg = (n, col, off) => n ? `<circle cx="75" cy="75" r="${R}" fill="none" stroke="${col}" stroke-width="14" stroke-dasharray="${n / tot * C - 3} ${C}" stroke-dashoffset="${-off}" stroke-linecap="round"/>` : "";
		let off = 0;
		let archi = "";
		[
			[g.verde, "#2f8a4e"],
			[g.giallo, "#e0a100"],
			[g.rosso, "var(--danger)"]
		].forEach(([n, col]) => {
			if (tot) {
				archi += seg(n, col, off);
				off += n / tot * C;
			}
		});
		document.getElementById("mag-ring").innerHTML = `<svg viewBox="0 0 150 150"><circle cx="75" cy="75" r="${R}" fill="none" stroke="var(--muted-bg)" stroke-width="14"/>${archi}</svg>
    <div class="centro"><b>${tot ? perc + "%" : "—"}</b><span>${tot ? "in ordine" : "vuoto"}</span></div>`;
		document.getElementById("mag-legenda").innerHTML = `<span><i class="mag-sem verde"></i><b>${g.verde}</b> ok</span><span><i class="mag-sem giallo"></i><b>${g.giallo}</b> attenzione</span><span><i class="mag-sem rosso"></i><b>${g.rosso}</b> critici</span>`;
		const valore = mag.articoli.reduce((t, a) => t + (mag.calc[a.id]?.valore || 0), 0);
		const riordino = mag.articoli.filter((a) => mag.calc[a.id]?.daOrdinare > 0);
		const lottiScad = mag.articoli.reduce((t, a) => t + (mag.calc[a.id]?.inScadenza.length || 0) + (mag.calc[a.id]?.scaduti.length || 0), 0);
		const settimane = magConsumiSettimane();
		const cons30 = mag.movimenti.filter((m) => m.tipo === "scarico" && m.created_at >= (/* @__PURE__ */ new Date(Date.now() - 2592e6)).toISOString()).reduce((t, m) => t + Number(m.quantita || 0) * Number(mag.articoli.find((a) => a.id === m.articolo_id)?.costo_unitario || 0), 0);
		const spark = magSparkline(settimane.map((s) => s.totale));
		const kpi = (cls, icon, l, v, s, onclick, extra = "") => `<div class="mag-kpi ${cls}" onclick="${onclick}"><div class="l"><i class="fa-solid ${icon}"></i> ${l}</div><div class="v">${v}</div><div class="s">${s}</div>${extra}</div>`;
		document.getElementById("mag-kpis").innerHTML = kpi("rosso", "fa-triangle-exclamation", "Critici", g.rosso, g.rosso ? "esauriti o sotto soglia" : "nessuno 👏", "magFiltraStato('rosso')") + kpi("giallo", "fa-hourglass-half", "Attenzione", g.giallo, "in esaurimento o da controllare", "magFiltraStato('giallo')") + kpi("blu", "fa-truck-ramp-box", "Da riordinare", riordino.length, riordino.length ? `${new Set(riordino.map((a) => a.fornitore_id || "-")).size} fornitori` : "tutto coperto", "magVista('ordini')") + kpi(lottiScad ? "giallo" : "verde", "fa-calendar-xmark", "Lotti in scadenza", lottiScad, "scaduti o entro 30 giorni", "magFiltraStato('scadenze')") + kpi("verde", "fa-coins", "Valore scorte", magEuro(valore), `consumi 30 gg: ${magEuro(cons30)}`, "magFiltraStato('')", spark);
		const todo = [];
		const perForn = {};
		riordino.forEach((a) => {
			const k = a.fornitore_id || "-";
			(perForn[k] = perForn[k] || []).push(a);
		});
		Object.entries(perForn).forEach(([fid, arts]) => {
			const f = mag.fornitori.find((x) => x.id === fid);
			todo.push({
				sem: arts.some((a) => mag.calc[a.id].stato === "rosso") ? "rosso" : "giallo",
				t: `Riordina ${arts.length} ${arts.length === 1 ? "articolo" : "articoli"}${f ? " da " + escapeHtml(f.nome) : ""}`,
				s: arts.slice(0, 3).map((a) => escapeHtml(a.nome)).join(", ") + (arts.length > 3 ? "…" : ""),
				btn: `<button class="btn btn-sm btn-outline" onclick="magVista('ordini')">Prepara</button>`
			});
		});
		mag.articoli.forEach((a) => {
			const c = mag.calc[a.id];
			c.scaduti.forEach((l) => todo.push({
				sem: "rosso",
				t: `${escapeHtml(a.nome)}: lotto scaduto`,
				s: `${l.lotto ? "Lotto " + escapeHtml(l.lotto) + " · " : ""}scaduto il ${magDataIt(l.scadenza)} · ${magFmt(l.qta)} ${escapeHtml(a.unita)}`,
				btn: `<button class="btn btn-sm btn-outline" onclick="magApriDettaglio('${a.id}')">Vedi</button>`
			}));
			c.inScadenza.forEach((l) => todo.push({
				sem: "giallo",
				t: `${escapeHtml(a.nome)}: scade tra ${magGiorniA(l.scadenza)} gg`,
				s: `${l.lotto ? "Lotto " + escapeHtml(l.lotto) + " · " : ""}${magFmt(l.qta)} ${escapeHtml(a.unita)} · usalo per primo`,
				btn: `<button class="btn btn-sm btn-outline" onclick="magApriDettaglio('${a.id}')">Vedi</button>`
			}));
			if ([
				"da_riparare",
				"da_lavare",
				"da_sostituire"
			].includes(a.condizione)) todo.push({
				sem: a.condizione === "da_sostituire" ? "rosso" : "giallo",
				t: `${escapeHtml(a.nome)}: ${MAG_COND[a.condizione].toLowerCase()}`,
				s: magUbiNome(a.ubicazione_id) || "",
				btn: `<button class="btn btn-sm btn-outline" onclick="magApriDettaglio('${a.id}')">Vedi</button>`
			});
		});
		mag.ordini.filter((o) => o.stato === "inviato").forEach((o) => {
			const f = mag.fornitori.find((x) => x.id === o.fornitore_id);
			todo.push({
				sem: "giallo",
				t: `Ordine in arrivo${f ? " da " + escapeHtml(f.nome) : ""}`,
				s: `${(o.righe || []).length} righe · inviato il ${magDataIt(o.inviato_at)}`,
				btn: `<button class="btn btn-sm btn-outline" onclick="magRiceviOrdine('${o.id}')">Ricevuto</button>`
			});
		});
		todo.sort((x, y) => (x.sem === "rosso" ? 0 : 1) - (y.sem === "rosso" ? 0 : 1));
		document.getElementById("mag-todo").innerHTML = todo.length ? todo.slice(0, 12).map((x) => `
    <div class="mag-todo-item"><i class="mag-sem ${x.sem}${x.sem === "rosso" ? " pulse" : ""}"></i><div class="t"><b>${x.t}</b><small>${escapeHtml(x.s)}</small></div>${x.btn}</div>`).join("") : `<div class="mag-todo-vuoto"><i class="fa-solid fa-circle-check" style="color:#2f8a4e;font-size:22px"></i> Tutto in ordine: nessuna scorta critica, nessun lotto in scadenza.</div>`;
		const max = Math.max(1, ...settimane.map((s) => s.totale));
		const catUsate = [...new Set(settimane.flatMap((s) => Object.keys(s.perCat)))];
		document.getElementById("mag-bars").innerHTML = settimane.map((s) => `
    <div class="mag-bar" title="${s.etichetta}: ${magEuro(s.totale)}">
      <div class="col" style="height:${Math.max(3, s.totale / max * 100)}%">${catUsate.map((k) => s.perCat[k] ? `<i style="height:${s.perCat[k] / (s.totale || 1) * 100}%;background:${magCats()[k].colore}"></i>` : "").join("")}</div>
      <small>${s.etichetta}</small></div>`).join("");
		document.getElementById("mag-bars-leg").innerHTML = catUsate.length ? catUsate.map((k) => `<span><i style="background:${magCats()[k].colore}"></i>${escapeHtml(magCats()[k].nome)}</span>`).join("") : "<span>Registra gli scarichi per vedere i consumi (inserisci anche il costo unitario degli articoli).</span>";
	}
	function magConsumiSettimane() {
		const out = [];
		const lun = /* @__PURE__ */ new Date();
		lun.setHours(0, 0, 0, 0);
		lun.setDate(lun.getDate() - (lun.getDay() + 6) % 7);
		for (let i = 7; i >= 0; i--) {
			const da = new Date(lun);
			da.setDate(da.getDate() - i * 7);
			const a = new Date(da);
			a.setDate(a.getDate() + 7);
			const s = {
				etichetta: da.getDate() + "/" + (da.getMonth() + 1),
				totale: 0,
				perCat: {}
			};
			mag.movimenti.forEach((m) => {
				if (m.tipo !== "scarico") return;
				const t = new Date(m.created_at);
				if (t < da || t >= a) return;
				const art = mag.articoli.find((x) => x.id === m.articolo_id);
				if (!art) return;
				const v = Number(m.quantita || 0) * Number(art.costo_unitario || 0);
				s.totale += v;
				s.perCat[art.categoria] = (s.perCat[art.categoria] || 0) + v;
			});
			out.push(s);
		}
		return out;
	}
	function magSparkline(valori) {
		if (!valori.some((v) => v > 0)) return "";
		const max = Math.max(...valori), w = 70;
		return `<svg class="spark" viewBox="0 0 ${w} 26"><polyline points="${valori.map((v, i) => `${(i / (valori.length - 1) * w).toFixed(1)},${(24 - v / max * 22).toFixed(1)}`).join(" ")}" fill="none" stroke="#2f8a4e" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/></svg>`;
	}
	function magFiltraStato(s) {
		magVista("giacenze");
		magUI.cat = "tutte";
		magUI.sub = "";
		document.getElementById("mag-filtro").value = s;
		magRenderCategorie();
		magRender();
		document.getElementById("mag-cats").scrollIntoView({
			behavior: "smooth",
			block: "start"
		});
	}
	// equo-scuderia-src/src/sezioni/magazzino/moduli/037-categorie-personalizzate.js
	var magCatEdit = null;
	async function magAggiungiSottocategoria(cat, nome) {
		const k = (mag.categorie || []).find((x) => x.chiave === cat);
		if (!k || (k.sottocategorie || []).includes(nome)) return;
		const nuove = [...k.sottocategorie || [], nome];
		if (!DEMO_MODE) {
			const { error } = await sb.from("mag_categorie").update({ sottocategorie: nuove }).eq("id", k.id);
			if (error) {
				console.error(error);
				return;
			}
		}
		k.sottocategorie = nuove;
	}
	function magApriCategoria(id) {
		if (!magPuoGestire()) {
			showToast("Solo l'amministratore o un membro di livello 2-3 può creare categorie.");
			return;
		}
		magCatEdit = id ? (mag.categorie || []).find((k) => k.id === id) : null;
		const k = magCatEdit || {
			icona: "fa-box",
			colore: MAG_COLORI_CAT[(mag.categorie || []).length % MAG_COLORI_CAT.length],
			durevole: false,
			unita: "pz",
			sottocategorie: []
		};
		document.getElementById("mag-cat-titolo").textContent = magCatEdit ? "Modifica categoria" : "Nuova categoria";
		document.getElementById("mag-cat-nome").value = k.nome || "";
		document.getElementById("mag-cat-sub").value = (k.sottocategorie || []).join(", ");
		document.getElementById("mag-cat-unita").innerHTML = MAG_UNITA.map((u) => `<option>${u}</option>`).join("");
		document.getElementById("mag-cat-unita").value = k.unita || "pz";
		document.querySelectorAll("input[name=\"mag-cat-tipo\"]").forEach((r) => r.checked = r.value === "durevole" === !!k.durevole);
		document.getElementById("mag-cat-icone").innerHTML = MAG_ICONE_CAT.map((ic) => `<button type="button" class="mag-scelta-ic ${ic === k.icona ? "sel" : ""}" data-ic="${ic}" onclick="magCatScegli(this)"><i class="fa-solid ${ic}"></i></button>`).join("");
		document.getElementById("mag-cat-colori").innerHTML = MAG_COLORI_CAT.map((c) => `<button type="button" class="mag-scelta-col ${c === k.colore ? "sel" : ""}" data-col="${c}" style="background:${c}" onclick="magCatScegli(this)"></button>`).join("");
		const nasc = document.getElementById("mag-cat-nascondi");
		nasc.style.display = magCatEdit ? "" : "none";
		nasc.innerHTML = magCatEdit?.nascosta ? "<i class=\"fa-solid fa-eye\"></i> Mostra" : "<i class=\"fa-solid fa-eye-slash\"></i> Nascondi";
		document.getElementById("mag-cat-err").style.display = "none";
		magCatAnteprima();
		openModal("modal-mag-categoria");
	}
	function magCatScegli(btn) {
		btn.parentElement.querySelectorAll("button").forEach((b) => b.classList.remove("sel"));
		btn.classList.add("sel");
		magCatAnteprima();
	}
	function magCatAnteprima() {
		const ic = document.querySelector("#mag-cat-icone .sel")?.dataset.ic || "fa-box";
		const col = document.querySelector("#mag-cat-colori .sel")?.dataset.col || "#6b746f";
		const nome = document.getElementById("mag-cat-nome").value.trim() || "Nuova categoria";
		const durevole = document.querySelector("input[name=\"mag-cat-tipo\"]:checked")?.value === "durevole";
		document.getElementById("mag-cat-anteprima").innerHTML = `<span class="ic" style="background:${col}"><i class="fa-solid ${ic}"></i></span><i class="mag-sem verde"></i><div class="nome">${escapeHtml(nome)}</div><div class="info">${durevole ? "beni durevoli" : "scorte di consumo"}</div><div class="salute"><i style="width:100%;background:#2f8a4e"></i></div>`;
	}
	async function magSalvaCategoria() {
		const err = document.getElementById("mag-cat-err");
		err.style.display = "none";
		const nome = document.getElementById("mag-cat-nome").value.trim().replace(/\s+/g, " ").slice(0, 60);
		if (!nome) {
			err.textContent = "Scrivi il nome della categoria.";
			err.style.display = "block";
			return;
		}
		if (Object.entries(magCats()).find(([key, c]) => c.nome.toLowerCase() === nome.toLowerCase() && (!magCatEdit || key !== magCatEdit.chiave))) {
			err.textContent = "Esiste già una categoria con questo nome.";
			err.style.display = "block";
			return;
		}
		const sub = [...new Set(document.getElementById("mag-cat-sub").value.split(/[,\n]/).map((x) => x.trim().replace(/\s+/g, " ").slice(0, 60)).filter(Boolean))];
		const row = {
			nome,
			icona: document.querySelector("#mag-cat-icone .sel")?.dataset.ic || "fa-box",
			colore: document.querySelector("#mag-cat-colori .sel")?.dataset.col || "#6b746f",
			durevole: document.querySelector("input[name=\"mag-cat-tipo\"]:checked")?.value === "durevole",
			unita: document.getElementById("mag-cat-unita").value,
			sottocategorie: sub.length ? sub : ["Altro"]
		};
		if (!magCatEdit) {
			const base = nome.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 30) || "cat";
			row.chiave = "c_" + (base.length >= 2 ? base : base + "x") + "_" + Math.random().toString(36).slice(2, 6);
			row.centro_id = currentCentro.id;
			row.ordine = (mag.categorie || []).length;
		}
		let salvata;
		if (DEMO_MODE) {
			if (magCatEdit) {
				Object.assign(magCatEdit, row);
				salvata = magCatEdit;
			} else {
				salvata = {
					id: "dk" + Math.random().toString(36).slice(2),
					nascosta: false,
					...row
				};
				mag.categorie.push(salvata);
			}
			demoState.mag.categorie = JSON.parse(JSON.stringify(mag.categorie));
		} else {
			const r = magCatEdit ? await sb.from("mag_categorie").update(row).eq("id", magCatEdit.id).select().single() : await sb.from("mag_categorie").insert(row).select().single();
			if (r.error) {
				err.textContent = "Non salvata: " + r.error.message;
				err.style.display = "block";
				return;
			}
			salvata = r.data;
			const i = mag.categorie.findIndex((x) => x.id === salvata.id);
			if (i >= 0) mag.categorie[i] = salvata;
			else mag.categorie.push(salvata);
		}
		const eraModifica = !!magCatEdit;
		closeModal("modal-mag-categoria");
		magUI.cat = salvata.chiave;
		magUI.sub = "";
		magCalcola();
		magRenderTutto();
		showToast(eraModifica ? "Categoria aggiornata." : `Categoria "${nome}" creata: ora aggiungi i suoi articoli.`);
	}
	async function magNascondiCategoria() {
		if (!magCatEdit) return;
		const nascosta = !magCatEdit.nascosta;
		if (nascosta && !confirm(`Nascondere "${magCatEdit.nome}"? Non comparirà più tra le schede e nei nuovi articoli; gli articoli già presenti restano visibili in "Tutto il magazzino".`)) return;
		if (DEMO_MODE) magCatEdit.nascosta = nascosta;
		else {
			const { error } = await sb.from("mag_categorie").update({ nascosta }).eq("id", magCatEdit.id);
			if (error) {
				showToast("Non riuscito: " + error.message);
				return;
			}
			magCatEdit.nascosta = nascosta;
		}
		if (nascosta && magUI.cat === magCatEdit.chiave) {
			magUI.cat = "tutte";
			magUI.sub = "";
		}
		closeModal("modal-mag-categoria");
		magCalcola();
		magRenderTutto();
		showToast(nascosta ? "Categoria nascosta." : "Categoria di nuovo visibile.");
	}
	// equo-scuderia-src/src/sezioni/magazzino/moduli/031-articolo-nuovo-modifica.js
	var magArtEdit = null;
	function magOpzioniUbicazioni() {
		const figli = (pid, liv) => mag.ubicazioni.filter((u) => (u.parent_id || null) === pid).map((u) => `<option value="${u.id}">${"  ".repeat(liv)}${liv ? "└ " : ""}${escapeHtml(u.nome)}</option>` + figli(u.id, liv + 1)).join("");
		return `<option value="">—</option>` + figli(null, 0);
	}
	function magApriArticolo(id) {
		if (!magPuoGestire()) {
			showToast("Solo l'amministratore o un membro di livello 2-3 può gestire gli articoli.");
			return;
		}
		magArtEdit = id ? mag.articoli.find((a) => a.id === id) : null;
		const a = magArtEdit || {};
		document.getElementById("mag-art-titolo").textContent = magArtEdit ? "Modifica articolo" : "Nuovo articolo";
		document.getElementById("mag-art-cat").innerHTML = Object.entries(magCats()).filter(([k, c]) => !c.nascosta || k === a.categoria).map(([k, c]) => `<option value="${k}">${escapeHtml(c.nome)}</option>`).join("");
		document.getElementById("mag-art-cat").value = a.categoria || (magUI.cat !== "tutte" ? magUI.cat : "alimentazione");
		magArtCatCambiata(a.sottocategoria || magUI.sub || null, !magArtEdit);
		document.getElementById("mag-art-nome").value = a.nome || "";
		document.getElementById("mag-art-marca").value = a.marca || "";
		document.getElementById("mag-art-formato").value = a.formato || "";
		if (a.unita) document.getElementById("mag-art-unita").value = a.unita;
		magArtUnitaScelta = !!magArtEdit;
		magArtAggiornaUnita();
		document.getElementById("mag-art-costo").value = a.costo_unitario ?? "";
		document.getElementById("mag-art-soglia").value = a.soglia_minima ?? 0;
		document.getElementById("mag-art-ottimale").value = a.scorta_ottimale ?? "";
		document.getElementById("mag-art-ubicazione").innerHTML = magOpzioniUbicazioni();
		document.getElementById("mag-art-ubicazione").value = a.ubicazione_id || "";
		document.getElementById("mag-art-fornitore").innerHTML = `<option value="">—</option>` + mag.fornitori.map((f) => `<option value="${f.id}">${escapeHtml(f.nome)}</option>`).join("");
		document.getElementById("mag-art-fornitore").value = a.fornitore_id || "";
		document.getElementById("mag-art-condizione").value = a.condizione || "";
		document.getElementById("mag-art-cavallo").innerHTML = `<option value="">—</option>` + (cavalliList || []).map((c) => `<option value="${c.id}">${escapeHtml(c.nome)}</option>`).join("");
		document.getElementById("mag-art-cavallo").value = a.cavallo_id || "";
		if (magArtEdit) document.getElementById("mag-art-lotti").checked = !!a.gestisce_lotti;
		document.getElementById("mag-art-note").value = a.note || "";
		document.getElementById("mag-art-iniziale").value = 0;
		document.getElementById("mag-art-iniziale-box").style.display = magArtEdit ? "none" : "block";
		document.getElementById("mag-art-archivia").style.display = magArtEdit ? "" : "none";
		document.getElementById("mag-art-err").style.display = "none";
		openModal("modal-mag-articolo");
	}
	function magArtCatCambiata(subScelta, impostaDefault = true) {
		const k = document.getElementById("mag-art-cat").value;
		const c = magCats()[k];
		const subs = [.../* @__PURE__ */ new Set([...c.sub, ...typeof subScelta === "string" && subScelta ? [subScelta] : []])];
		const usate = mag.articoli.filter((a) => a.categoria === k).map((a) => a.sottocategoria);
		const tutte = [.../* @__PURE__ */ new Set([...subs, ...usate])];
		document.getElementById("mag-art-sub").innerHTML = tutte.map((s) => `<option>${escapeHtml(s)}</option>`).join("") + (magPuoGestire() ? `<option value="__nuova__">+ Nuova sottocategoria…</option>` : "");
		if (typeof subScelta === "string" && subScelta) document.getElementById("mag-art-sub").value = subScelta;
		document.getElementById("mag-art-sub-nuova").value = "";
		magArtSubCambiata();
		document.getElementById("mag-art-unita").innerHTML = MAG_UNITA.map((u) => `<option>${u}</option>`).join("");
		if (impostaDefault !== false) {
			document.getElementById("mag-art-unita").value = c.unita;
			magArtUnitaScelta = false;
			if (document.getElementById("mag-art-formato").value) magArtFormatoCambiato();
			document.getElementById("mag-art-lotti").checked = ["farmaci", "integratori"].includes(k);
		}
		document.getElementById("mag-art-durevoli").style.display = c.durevole ? "grid" : "none";
	}
	function magArtSubCambiata() {
		const nuova = document.getElementById("mag-art-sub").value === "__nuova__";
		document.getElementById("mag-art-sub-nuova-box").style.display = nuova ? "block" : "none";
		if (nuova) setTimeout(() => document.getElementById("mag-art-sub-nuova").focus(), 30);
	}
	async function magSalvaArticolo() {
		const err = document.getElementById("mag-art-err");
		err.style.display = "none";
		const v = (id) => document.getElementById(id).value;
		const num = (id) => v(id) === "" ? null : Number(v(id));
		const cat = v("mag-art-cat");
		let sottocategoria = v("mag-art-sub");
		if (sottocategoria === "__nuova__") {
			sottocategoria = v("mag-art-sub-nuova").trim().replace(/\s+/g, " ").slice(0, 60);
			if (!sottocategoria) {
				err.textContent = "Scrivi il nome della nuova sottocategoria.";
				err.style.display = "block";
				return;
			}
			await magAggiungiSottocategoria(cat, sottocategoria);
		}
		const row = {
			centro_id: currentCentro.id,
			categoria: cat,
			sottocategoria,
			nome: v("mag-art-nome").trim(),
			marca: v("mag-art-marca").trim() || null,
			formato: v("mag-art-formato").trim() || null,
			unita: v("mag-art-unita"),
			costo_unitario: num("mag-art-costo"),
			soglia_minima: num("mag-art-soglia") || 0,
			scorta_ottimale: num("mag-art-ottimale"),
			ubicazione_id: v("mag-art-ubicazione") || null,
			fornitore_id: v("mag-art-fornitore") || null,
			condizione: magCats()[cat].durevole ? v("mag-art-condizione") || null : null,
			cavallo_id: magCats()[cat].durevole ? v("mag-art-cavallo") || null : null,
			gestisce_lotti: document.getElementById("mag-art-lotti").checked,
			note: v("mag-art-note").trim() || null
		};
		if (!row.nome) {
			err.textContent = "Scrivi il nome dell'articolo.";
			err.style.display = "block";
			return;
		}
		const iniziale = Number(v("mag-art-iniziale")) || 0;
		const btn = document.getElementById("mag-art-salva");
		btn.disabled = true;
		let salvato = null, errore = null;
		if (DEMO_MODE) {
			if (magArtEdit) {
				Object.assign(magArtEdit, row);
				salvato = magArtEdit;
			} else {
				salvato = {
					id: "da" + Math.random().toString(36).slice(2),
					created_at: (/* @__PURE__ */ new Date()).toISOString(),
					archiviato: false,
					...row
				};
				mag.articoli.push(salvato);
			}
			demoState.mag = JSON.parse(JSON.stringify({
				articoli: mag.articoli,
				movimenti: mag.movimenti,
				ubicazioni: mag.ubicazioni,
				fornitori: mag.fornitori,
				ordini: mag.ordini,
				categorie: mag.categorie
			}));
		} else {
			const r = magArtEdit ? await sb.from("mag_articoli").update(row).eq("id", magArtEdit.id).select().single() : await sb.from("mag_articoli").insert(row).select().single();
			if (r.error) errore = r.error.message;
			else salvato = r.data;
			if (salvato) {
				const i = mag.articoli.findIndex((x) => x.id === salvato.id);
				if (i >= 0) mag.articoli[i] = salvato;
				else mag.articoli.push(salvato);
			}
		}
		if (!errore && salvato && !magArtEdit && iniziale > 0) errore = await magInserisciMovimenti([{
			centro_id: currentCentro.id,
			articolo_id: salvato.id,
			tipo: "carico",
			quantita: iniziale,
			costo_unitario: row.costo_unitario,
			fornitore_id: row.fornitore_id,
			nota: "Giacenza iniziale"
		}]);
		btn.disabled = false;
		if (errore) {
			err.textContent = "Non salvato: " + errore;
			err.style.display = "block";
			return;
		}
		closeModal("modal-mag-articolo");
		magCalcola();
		magRenderTutto();
		showToast(magArtEdit ? "Articolo aggiornato." : "Articolo aggiunto al magazzino.");
	}
	async function magArchiviaArticolo() {
		if (!magArtEdit) return;
		if (!confirm(`Archiviare "${magArtEdit.nome}"? Sparisce dal magazzino ma lo storico dei movimenti resta.`)) return;
		if (DEMO_MODE) {
			mag.articoli = mag.articoli.filter((a) => a.id !== magArtEdit.id);
			demoState.mag.articoli = demoState.mag.articoli.filter((a) => a.id !== magArtEdit.id);
		} else {
			const { error } = await sb.from("mag_articoli").update({ archiviato: true }).eq("id", magArtEdit.id);
			if (error) {
				showToast("Non riuscito: " + error.message);
				return;
			}
			mag.articoli = mag.articoli.filter((a) => a.id !== magArtEdit.id);
		}
		closeModal("modal-mag-articolo");
		magCalcola();
		magRenderTutto();
		showToast("Articolo archiviato.");
	}
	// equo-scuderia-src/src/sezioni/magazzino/moduli/030-movimento-rapido.js
	var magMov = {
		tipo: "scarico",
		articolo: null
	};
	function magApriMovimento(articoloId, tipo) {
		magMov = {
			tipo: tipo || "scarico",
			articolo: articoloId ? mag.articoli.find((a) => a.id === articoloId) : null
		};
		document.getElementById("mag-mov-q").value = "";
		document.getElementById("mag-mov-nota").value = "";
		document.getElementById("mag-mov-err").style.display = "none";
		document.getElementById("mag-mov-cavallo").innerHTML = `<option value="">—</option>` + (cavalliList || []).map((c) => `<option value="${c.id}">${escapeHtml(c.nome)}</option>`).join("");
		document.getElementById("mag-mov-fornitore").innerHTML = `<option value="">—</option>` + mag.fornitori.map((f) => `<option value="${f.id}">${escapeHtml(f.nome)}</option>`).join("");
		document.getElementById("mag-mov-ubicazione").innerHTML = magOpzioniUbicazioni();
		magMovTipo(magMov.tipo, true);
		magMovMostra();
		openModal("modal-mag-movimento");
		if (!magMov.articolo) setTimeout(() => document.getElementById("mag-mov-q").focus(), 80);
	}
	function magMovTipo(t, silenzioso) {
		magMov.tipo = t;
		document.querySelectorAll("#mag-mov-seg button").forEach((b) => b.classList.toggle("active", b.dataset.t === t));
		document.getElementById("mag-mov-extra-carico").style.display = t === "carico" ? "grid" : "none";
		document.getElementById("mag-mov-extra-scarico").style.display = t === "scarico" ? "block" : "none";
		document.getElementById("mag-mov-extra-sposta").style.display = t === "trasferimento" ? "block" : "none";
		document.getElementById("mag-mov-q-box").style.display = t === "trasferimento" ? "none" : "block";
		document.getElementById("mag-mov-q-label").textContent = t === "rettifica" ? "Quantità contata realmente (inventario)" : t === "carico" ? "Quantità arrivata" : "Quantità usata";
		const btn = document.getElementById("mag-mov-salva");
		btn.className = "btn btn-block " + (t === "scarico" ? "btn-danger" : "btn-primary");
		btn.innerHTML = t === "scarico" ? "<i class=\"fa-solid fa-minus\"></i> Registra scarico" : t === "carico" ? "<i class=\"fa-solid fa-plus\"></i> Registra carico" : t === "rettifica" ? "<i class=\"fa-solid fa-scale-balanced\"></i> Salva inventario" : "<i class=\"fa-solid fa-right-left\"></i> Sposta";
		if (!silenzioso) magMovMostra();
	}
	function magMovMostra() {
		const a = magMov.articolo;
		document.getElementById("mag-mov-pick-box").style.display = a ? "none" : "block";
		document.getElementById("mag-mov-corpo").style.display = a ? "block" : "none";
		if (!a) {
			magMovRenderPick();
			return;
		}
		const c = mag.calc[a.id];
		document.getElementById("mag-mov-sel").innerHTML = `${magIcona(a.categoria)}<div class="t">${escapeHtml(a.nome)}<small>${escapeHtml([a.formato, magUbiNome(a.ubicazione_id)].filter(Boolean).join(" · ") || a.sottocategoria)} · tocca per cambiare</small></div>
    <div class="q"><i class="mag-sem ${c.stato}"></i> ${magFmt(c.giacenza)} ${escapeHtml(a.unita)}</div>`;
		document.getElementById("mag-mov-unita").textContent = a.unita;
		const qta = document.getElementById("mag-mov-qta");
		qta.value = magMov.tipo === "rettifica" ? magFmt(Math.max(c.giacenza, 0), 3).replace(/\./g, "").replace(",", ".") : 1;
		const rapidi = magMov.tipo === "rettifica" ? [] : a.unita === "kg" ? [
			1,
			5,
			10,
			25
		] : [
			1,
			2,
			5,
			10
		];
		document.getElementById("mag-mov-rapidi").innerHTML = rapidi.map((n) => `<button type="button" onclick="document.getElementById('mag-mov-qta').value=${n};magMovAnteprima()">${n}</button>`).join("");
		document.getElementById("mag-mov-costo").value = a.costo_unitario ?? "";
		document.getElementById("mag-mov-fornitore").value = a.fornitore_id || "";
		document.getElementById("mag-mov-lotto").value = "";
		document.getElementById("mag-mov-scadenza").value = "";
		document.getElementById("mag-mov-cavallo").value = a.cavallo_id || "";
		document.getElementById("mag-mov-ubicazione").value = a.ubicazione_id || "";
		const lotto = c.lottiAttivi[0];
		document.getElementById("mag-mov-lotto-info").innerHTML = lotto ? `<i class="fa-solid fa-circle-info"></i> Scarico dal lotto che scade prima: <b>${escapeHtml(lotto.lotto || "senza lotto")}</b>${lotto.scadenza ? " (scad. " + magDataIt(lotto.scadenza) + ")" : ""}` : "";
		qta.oninput = magMovAnteprima;
		magMovAnteprima();
	}
	function magMovAnteprima() {
		const a = magMov.articolo;
		if (!a) return;
		const c = mag.calc[a.id];
		const q = Number(String(document.getElementById("mag-mov-qta").value).replace(",", ".")) || 0;
		const dopo = magMov.tipo === "scarico" ? c.giacenza - q : magMov.tipo === "carico" ? c.giacenza + q : q;
		const soglia = Number(a.soglia_minima || 0);
		const col = dopo <= 0 || soglia && dopo < soglia ? "var(--danger)" : soglia && dopo < soglia * 1.5 ? "#a07400" : "#2f8a4e";
		document.getElementById("mag-mov-anteprima").innerHTML = `Dopo: <b style="color:${col}">${magFmt(dopo)} ${escapeHtml(a.unita)}</b>` + (magEquivalente(dopo, a) ? ` <span style="color:var(--muted)">(${magEquivalente(dopo, a)})</span>` : "") + (magMov.tipo === "rettifica" ? ` · differenza ${dopo - c.giacenza >= 0 ? "+" : ""}${magFmt(dopo - c.giacenza)}` : "") + (magMov.tipo === "scarico" && q > c.giacenza ? ` · <span style="color:var(--danger)">più di quello che risulta!</span>` : "");
	}
	function magMovStep(d) {
		const el = document.getElementById("mag-mov-qta");
		const v = Math.max(0, (Number(String(el.value).replace(",", ".")) || 0) + d);
		el.value = Math.round(v * 1e3) / 1e3;
		magMovAnteprima();
	}
	function magMovCambiaArticolo() {
		magMov.articolo = null;
		magMovMostra();
		setTimeout(() => document.getElementById("mag-mov-q").focus(), 50);
	}
	function magMovRenderPick() {
		const q = (document.getElementById("mag-mov-q").value || "").trim().toLowerCase();
		const recenti = [...new Set(mag.movimenti.map((m) => m.articolo_id))];
		let lista = mag.articoli.slice();
		if (q) lista = lista.filter((a) => [
			a.nome,
			a.marca,
			a.formato,
			a.sottocategoria,
			magCats()[a.categoria]?.nome
		].filter(Boolean).join(" ").toLowerCase().includes(q));
		else lista.sort((x, y) => {
			const ix = recenti.indexOf(x.id), iy = recenti.indexOf(y.id);
			return (ix < 0 ? 9999 : ix) - (iy < 0 ? 9999 : iy);
		});
		document.getElementById("mag-mov-pick").innerHTML = lista.slice(0, 30).map((a) => {
			const c = mag.calc[a.id];
			return `<div class="mag-pick" onclick="magMovScegli('${a.id}')">${magIcona(a.categoria)}<div class="t">${escapeHtml(a.nome)}<small>${escapeHtml([a.sottocategoria, a.formato].filter(Boolean).join(" · "))}</small></div>
      <div class="q"><i class="mag-sem ${c.stato}"></i> ${magFmt(c.giacenza)} ${escapeHtml(a.unita)}</div></div>`;
		}).join("") || `<div style="color:var(--muted);font-size:13px;padding:10px">Nessun articolo trovato.${magPuoGestire() ? ` <a href="#" onclick="event.preventDefault();closeModal('modal-mag-movimento');magApriArticolo()">Crealo</a>` : ""}</div>`;
	}
	function magMovScegli(id) {
		magMov.articolo = mag.articoli.find((a) => a.id === id);
		magMovMostra();
	}
	async function magSalvaMovimento() {
		const a = magMov.articolo;
		if (!a) return;
		const err = document.getElementById("mag-mov-err");
		err.style.display = "none";
		const c = mag.calc[a.id];
		const q = Number(String(document.getElementById("mag-mov-qta").value).replace(",", ".")) || 0;
		const nota = document.getElementById("mag-mov-nota").value.trim() || null;
		const righe = [];
		const base = {
			centro_id: currentCentro.id,
			articolo_id: a.id,
			nota
		};
		if (magMov.tipo === "trasferimento") {
			const u = document.getElementById("mag-mov-ubicazione").value;
			if (!u) {
				err.textContent = "Scegli la nuova ubicazione.";
				err.style.display = "block";
				return;
			}
			righe.push({
				...base,
				tipo: "trasferimento",
				quantita: Math.max(c.giacenza, 1),
				ubicazione_a: u
			});
		} else if (magMov.tipo === "rettifica") {
			const delta = Math.round((q - c.giacenza) * 1e3) / 1e3;
			if (!delta) {
				closeModal("modal-mag-movimento");
				showToast("Inventario confermato: nessuna differenza.");
				return;
			}
			righe.push({
				...base,
				tipo: "rettifica",
				quantita: delta,
				nota: nota || `Inventario: contati ${magFmt(q)} ${a.unita}`
			});
		} else {
			if (q <= 0) {
				err.textContent = "Inserisci una quantità maggiore di zero.";
				err.style.display = "block";
				return;
			}
			if (magMov.tipo === "carico") {
				const costo = document.getElementById("mag-mov-costo").value;
				righe.push({
					...base,
					tipo: "carico",
					quantita: q,
					lotto: document.getElementById("mag-mov-lotto").value.trim() || null,
					scadenza: document.getElementById("mag-mov-scadenza").value || null,
					costo_unitario: costo === "" ? null : Number(costo),
					fornitore_id: document.getElementById("mag-mov-fornitore").value || null
				});
			} else {
				const cavallo = document.getElementById("mag-mov-cavallo").value || null;
				let resto = q;
				for (const l of c.lottiAttivi) {
					if (resto <= 0) break;
					const usa = Math.min(resto, l.qta);
					righe.push({
						...base,
						tipo: "scarico",
						quantita: Math.round(usa * 1e3) / 1e3,
						lotto: l.lotto,
						scadenza: l.scadenza,
						cavallo_id: cavallo
					});
					resto -= usa;
				}
				if (resto > 1e-4) righe.push({
					...base,
					tipo: "scarico",
					quantita: Math.round(resto * 1e3) / 1e3,
					cavallo_id: cavallo
				});
			}
		}
		const btn = document.getElementById("mag-mov-salva");
		btn.disabled = true;
		const errore = await magInserisciMovimenti(righe);
		btn.disabled = false;
		if (errore) {
			err.textContent = "Non salvato: " + errore;
			err.style.display = "block";
			return;
		}
		closeModal("modal-mag-movimento");
		magCalcola();
		magRenderTutto();
		const cn = mag.calc[a.id];
		showToast(`${MAG_TIPI_MOV[magMov.tipo]} registrato · ${a.nome}: ${magFmt(cn.giacenza)} ${a.unita}` + (cn.stato === "rosso" ? " ⚠️ da riordinare" : ""));
	}
	async function magInserisciMovimenti(righe) {
		if (DEMO_MODE) {
			righe.forEach((r) => {
				const m = {
					id: "dm" + Math.random().toString(36).slice(2),
					created_at: (/* @__PURE__ */ new Date()).toISOString(),
					creato_da_nome: currentMembro?.nome_visualizzato || "Tu",
					...r
				};
				if (m.tipo === "trasferimento") {
					const art = mag.articoli.find((x) => x.id === m.articolo_id);
					if (art) art.ubicazione_id = m.ubicazione_a;
				}
				mag.movimenti.unshift(m);
			});
			demoState.mag = JSON.parse(JSON.stringify({
				articoli: mag.articoli,
				movimenti: mag.movimenti,
				ubicazioni: mag.ubicazioni,
				fornitori: mag.fornitori,
				ordini: mag.ordini,
				categorie: mag.categorie
			}));
			return null;
		}
		const { data, error } = await sb.from("mag_movimenti").insert(righe).select();
		if (error) {
			console.error("mag_movimenti:", error);
			return error.message;
		}
		mag.movimenti.unshift(...(data || []).reverse());
		if (righe.some((r) => r.tipo === "trasferimento")) {
			const r = righe[0];
			const art = mag.articoli.find((x) => x.id === r.articolo_id);
			if (art) art.ubicazione_id = r.ubicazione_a;
		}
		return null;
	}
	// equo-scuderia-src/src/sezioni/magazzino/moduli/032-movimenti.js
	function magRigaMovimento(m, compatto) {
		const a = mag.articoli.find((x) => x.id === m.articolo_id);
		const q = Number(m.quantita || 0);
		const segno = m.tipo === "carico" || m.tipo === "rettifica" && q > 0 ? "+" : m.tipo === "trasferimento" ? "" : "−";
		const cls = segno === "+" ? "piu" : segno === "−" ? "meno" : "";
		const icone = {
			carico: "fa-truck-ramp-box",
			scarico: "fa-arrow-up-from-bracket",
			rettifica: "fa-scale-balanced",
			trasferimento: "fa-right-left"
		};
		const cav = m.cavallo_id ? (cavalliList || []).find((c) => c.id === m.cavallo_id) : null;
		const dettagli = [
			new Date(m.created_at).toLocaleString("it-IT", {
				day: "numeric",
				month: "short",
				hour: "2-digit",
				minute: "2-digit"
			}),
			m.creato_da_nome,
			m.lotto ? "lotto " + m.lotto : null,
			cav ? "🐴 " + cav.nome : null,
			m.tipo === "trasferimento" ? "→ " + (magUbiNome(m.ubicazione_a) || "nuova ubicazione") : null,
			m.nota
		].filter(Boolean).map(escapeHtml).join(" · ");
		return `<div class="mag-mov"><span class="ic ${m.tipo}"><i class="fa-solid ${icone[m.tipo]}"></i></span>
    <div class="t">${compatto ? `<b>${MAG_TIPI_MOV[m.tipo]}</b>` : `<b>${escapeHtml(a?.nome || "Articolo archiviato")}</b> <span style="color:var(--muted)">· ${MAG_TIPI_MOV[m.tipo]}</span>`}<small>${dettagli}</small></div>
    <div class="q ${cls}">${m.tipo === "trasferimento" ? "" : segno + magFmt(Math.abs(q)) + " " + escapeHtml(a?.unita || "")}</div></div>`;
	}
	function magRenderMovimenti() {
		const box = document.getElementById("mag-mov-lista");
		const q = (document.getElementById("mag-mov-cerca").value || "").trim().toLowerCase();
		const tipo = document.getElementById("mag-mov-tipo").value;
		let lista = mag.movimenti.filter((m) => !tipo || m.tipo === tipo);
		if (q) lista = lista.filter((m) => {
			const a = mag.articoli.find((x) => x.id === m.articolo_id);
			const cav = (cavalliList || []).find((c) => c.id === m.cavallo_id);
			return [
				a?.nome,
				m.creato_da_nome,
				m.nota,
				m.lotto,
				cav?.nome
			].filter(Boolean).join(" ").toLowerCase().includes(q);
		});
		lista = lista.slice(0, 300);
		if (!lista.length) {
			box.innerHTML = `<div class="empty-state"><i class="fa-solid fa-arrow-right-arrow-left"></i><div>Nessun movimento${q || tipo ? " con questi filtri" : " ancora: usa \"Movimento rapido\" per registrare carichi e scarichi"}.</div></div>`;
			return;
		}
		let giorno = null, html = "";
		lista.forEach((m) => {
			const g = new Date(m.created_at).toLocaleDateString("it-IT", {
				weekday: "long",
				day: "numeric",
				month: "long"
			});
			if (g !== giorno) {
				html += `<div class="mag-giorno">${g}</div>`;
				giorno = g;
			}
			html += magRigaMovimento(m);
		});
		box.innerHTML = html;
	}
	// equo-scuderia-src/src/sezioni/magazzino/moduli/033-riordini-e-ordini.js
	function magRenderOrdini() {
		const box = document.getElementById("mag-ordini");
		const daOrd = mag.articoli.filter((a) => mag.calc[a.id].daOrdinare > 0);
		const gruppi = {};
		daOrd.forEach((a) => {
			const k = a.fornitore_id || "-";
			(gruppi[k] = gruppi[k] || []).push(a);
		});
		let html = "";
		if (daOrd.length) {
			html += `<div style="font-size:13px;color:var(--muted)">Quantità suggerite per tornare alla scorta ottimale (o al doppio della soglia minima). Modificale se serve, poi crea l'ordine: puoi mandarlo al fornitore via WhatsApp o email.</div>`;
			Object.entries(gruppi).forEach(([fid, arts]) => {
				const f = mag.fornitori.find((x) => x.id === fid);
				const totale = arts.reduce((t, a) => t + mag.calc[a.id].daOrdinare * Number(a.costo_unitario || 0), 0);
				html += `<div class="card mag-riordino-g"><h3><i class="fa-solid fa-truck-ramp-box" style="color:var(--primary)"></i> ${f ? escapeHtml(f.nome) : "Senza fornitore"}
        <span class="badge-pill badge-gray" style="margin-left:auto">${arts.length} articoli${totale ? " · ≈ " + magEuro(totale) : ""}</span></h3>
        <div style="margin-top:8px">${arts.map((a) => {
					const c = mag.calc[a.id];
					return `<div class="mag-riordino-row"><div><i class="mag-sem ${c.stato}" style="margin-right:6px"></i><b>${escapeHtml(a.nome)}</b>
          <div style="color:var(--muted);font-size:12px;margin-left:16px">ora ${magFmt(c.giacenza)} ${escapeHtml(a.unita)} · soglia ${magFmt(a.soglia_minima)}</div></div>
          <div style="color:var(--muted);font-size:12px;text-align:right">${escapeHtml(a.unita)}</div><input type="number" min="0" step="any" data-ord-art="${a.id}" data-ord-forn="${fid}" value="${c.daOrdinare}"></div>`;
				}).join("")}</div>
        ${magPuoGestire() ? `<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px;flex-wrap:wrap">
          <button class="btn btn-sm btn-outline" onclick="magCopiaOrdine('${fid}')"><i class="fa-solid fa-copy"></i> Copia testo</button>
          <button class="btn btn-sm btn-primary" onclick="magCreaOrdine('${fid}')"><i class="fa-solid fa-paper-plane"></i> Crea e invia ordine</button></div>` : ""}
      </div>`;
			});
		} else html += `<div class="card" style="display:flex;gap:12px;align-items:center"><i class="fa-solid fa-circle-check" style="color:#2f8a4e;font-size:26px"></i><div><b>Niente da riordinare</b><div style="color:var(--muted);font-size:13px">Tutte le scorte sono sopra la soglia. Imposta soglia minima e scorta ottimale negli articoli per ricevere i suggerimenti.</div></div></div>`;
		const ordini = mag.ordini.filter((o) => o.stato !== "annullato");
		if (ordini.length) html += `<h3 style="margin:10px 0 0;font-size:15px">Ordini</h3>` + ordini.map((o) => {
			const f = mag.fornitori.find((x) => x.id === o.fornitore_id);
			const pill = {
				bozza: ["badge-gray", "Bozza"],
				inviato: ["badge-yellow", "Inviato · in arrivo"],
				ricevuto: ["badge-green", "Ricevuto"]
			}[o.stato] || ["badge-gray", o.stato];
			const righe = (o.righe || []).map((r) => {
				const a = mag.articoli.find((x) => x.id === r.articolo_id);
				return `${magFmt(r.quantita)} ${escapeHtml(a?.unita || "")} ${escapeHtml(a?.nome || "articolo")}`;
			}).join(", ");
			return `<div class="card mag-ordine"><div class="t"><b>${f ? escapeHtml(f.nome) : "Ordine"}</b> <span class="badge-pill ${pill[0]}">${pill[1]}</span>
        <div style="color:var(--muted);font-size:12.5px;margin-top:4px">${magDataIt(o.created_at)} · ${righe}</div></div>
        ${o.stato === "inviato" ? `<button class="btn btn-sm btn-primary" onclick="magRiceviOrdine('${o.id}')"><i class="fa-solid fa-box-open"></i> Ricevuto: carica in magazzino</button>` : ""}
        ${o.stato === "bozza" && magPuoGestire() ? `<button class="btn btn-sm btn-outline" onclick="magInviaOrdine('${o.id}')"><i class="fa-solid fa-paper-plane"></i> Invia</button>` : ""}</div>`;
		}).join("");
		box.innerHTML = html;
	}
	function magRigheOrdine(fid) {
		return [...document.querySelectorAll(`[data-ord-forn="${fid}"]`)].map((i) => ({
			articolo_id: i.dataset.ordArt,
			quantita: Number(i.value) || 0
		})).filter((r) => r.quantita > 0);
	}
	function magTestoOrdine(fid, righe) {
		const f = mag.fornitori.find((x) => x.id === fid);
		return `Buongiorno${f?.referente ? " " + f.referente : ""},\nvorremmo ordinare:\n` + righe.map((r) => {
			const a = mag.articoli.find((x) => x.id === r.articolo_id);
			return `- ${magFmt(r.quantita)} ${a.unita} ${a.nome}${a.marca ? " (" + a.marca + ")" : ""}${a.formato ? " – " + a.formato : ""}`;
		}).join("\n") + `\n\nConsegna presso ${currentCentro?.nome || "il nostro centro"}${currentCentro?.indirizzo ? ", " + currentCentro.indirizzo : ""}.\nGrazie!`;
	}
	function magCopiaOrdine(fid) {
		const righe = magRigheOrdine(fid);
		if (!righe.length) {
			showToast("Nessuna quantità da ordinare.");
			return;
		}
		navigator.clipboard?.writeText(magTestoOrdine(fid, righe)).then(() => showToast("Testo dell'ordine copiato.")).catch(() => showToast("Copia non riuscita."));
	}
	async function magCreaOrdine(fid) {
		const righe = magRigheOrdine(fid);
		if (!righe.length) {
			showToast("Nessuna quantità da ordinare.");
			return;
		}
		const row = {
			centro_id: currentCentro.id,
			fornitore_id: fid === "-" ? null : fid,
			stato: "bozza",
			righe
		};
		let ordine;
		if (DEMO_MODE) {
			ordine = {
				id: "do" + Math.random().toString(36).slice(2),
				created_at: (/* @__PURE__ */ new Date()).toISOString(),
				...row
			};
			mag.ordini.unshift(ordine);
		} else {
			const { data, error } = await sb.from("mag_ordini").insert(row).select().single();
			if (error) {
				showToast("Ordine non creato: " + error.message);
				return;
			}
			ordine = data;
			mag.ordini.unshift(data);
		}
		await magInviaOrdine(ordine.id);
	}
	async function magInviaOrdine(id) {
		const o = mag.ordini.find((x) => x.id === id);
		if (!o) return;
		const f = mag.fornitori.find((x) => x.id === o.fornitore_id);
		const testo = magTestoOrdine(o.fornitore_id || "-", o.righe || []);
		const tel = (f?.telefono || "").replace(/[^\d+]/g, "").replace(/^\+/, "");
		if (tel) window.open(`https://wa.me/${tel.startsWith("39") || tel.length > 10 ? tel : "39" + tel}?text=${encodeURIComponent(testo)}`, "_blank");
		else if (f?.email) window.location.href = `mailto:${f.email}?subject=${encodeURIComponent("Ordine " + (currentCentro?.nome || ""))}&body=${encodeURIComponent(testo)}`;
		else navigator.clipboard?.writeText(testo).catch(() => {});
		const agg = {
			stato: "inviato",
			inviato_at: (/* @__PURE__ */ new Date()).toISOString()
		};
		if (DEMO_MODE) Object.assign(o, agg);
		else {
			const { error } = await sb.from("mag_ordini").update(agg).eq("id", id);
			if (error) {
				showToast("Stato ordine non aggiornato: " + error.message);
				return;
			}
			Object.assign(o, agg);
		}
		magRenderTutto();
		showToast(tel ? "Ordine aperto in WhatsApp: segnato come inviato." : f?.email ? "Ordine aperto nella tua email: segnato come inviato." : "Testo copiato: incollalo dove vuoi. Ordine segnato come inviato.");
	}
	async function magRiceviOrdine(id) {
		const o = mag.ordini.find((x) => x.id === id);
		if (!o) return;
		if (!confirm("Merce arrivata? Le quantità dell'ordine vengono caricate in magazzino.")) return;
		if (DEMO_MODE) {
			await magInserisciMovimenti((o.righe || []).map((r) => ({
				centro_id: currentCentro.id,
				articolo_id: r.articolo_id,
				tipo: "carico",
				quantita: r.quantita,
				fornitore_id: o.fornitore_id,
				nota: "Ricevuto da ordine"
			})));
			o.stato = "ricevuto";
			o.ricevuto_at = (/* @__PURE__ */ new Date()).toISOString();
		} else {
			const { data, error } = await sb.rpc("mag_ricevi_ordine", { p_ordine_id: id });
			if (error || !data?.ok) {
				showToast(data && data.errore || "Non riuscito: " + (error?.message || ""));
				return;
			}
			await loadMagazzino();
		}
		magCalcola();
		magRenderTutto();
		showToast("Merce caricata in magazzino ✅");
	}
	// equo-scuderia-src/src/sezioni/magazzino/moduli/034-depositi.js
	var magUbiEdit = null;
	function magRenderDepositi() {
		const box = document.getElementById("mag-depositi");
		const conta = (id) => {
			const ids = [id, ...mag.ubicazioni.filter((u) => u.parent_id === id).flatMap((u) => [u.id, ...mag.ubicazioni.filter((x) => x.parent_id === u.id).map((x) => x.id)])];
			return mag.articoli.filter((a) => ids.includes(a.ubicazione_id));
		};
		const depositi = mag.ubicazioni.filter((u) => !u.parent_id);
		let html = magPuoGestire() ? `<div><button class="btn btn-primary" onclick="magApriUbicazione()"><i class="fa-solid fa-plus"></i> Nuovo deposito</button></div>` : "";
		if (!depositi.length) html += `<div class="card empty-state"><i class="fa-solid fa-warehouse"></i><div>Nessun deposito. Crea i posti dove tieni le cose (es. Fienile, Selleria, Magazzino mangimi, Armadio farmaci) e, se vuoi, zone e scaffali al loro interno.</div></div>`;
		html += depositi.map((d) => {
			const arts = conta(d.id), g = magStatoGruppo(arts);
			const figli = mag.ubicazioni.filter((u) => u.parent_id === d.id);
			return `<div class="mag-ubi"><h4><i class="mag-sem ${arts.length ? g.colore : "verde"}"></i><i class="fa-solid fa-warehouse" style="color:var(--primary)"></i> ${escapeHtml(d.nome)}
      <span class="badge-pill badge-gray" style="margin-left:auto">${arts.length} articoli</span>
      ${magPuoGestire() ? `<button class="btn btn-sm btn-ghost" onclick="magApriUbicazione('${d.id}')"><i class="fa-solid fa-pen"></i></button>` : ""}</h4>
      ${d.note ? `<div style="color:var(--muted);font-size:12.5px;margin-top:4px">${escapeHtml(d.note)}</div>` : ""}
      <div class="figli">${figli.map((z) => {
				const az = conta(z.id), gz = magStatoGruppo(az);
				const sub = mag.ubicazioni.filter((u) => u.parent_id === z.id);
				return `<span class="figlio" onclick="${magPuoGestire() ? `magApriUbicazione('${z.id}')` : ""}"><i class="mag-sem ${az.length ? gz.colore : "verde"}" style="width:8px;height:8px"></i>${escapeHtml(z.nome)} <span style="color:var(--muted)">${az.length}</span>${sub.length ? ` <span style="color:var(--muted)">· ${sub.map((s) => escapeHtml(s.nome)).join(", ")}</span>` : ""}</span>`;
			}).join("")}
        ${magPuoGestire() ? `<span class="figlio" onclick="magApriUbicazione(null,'${d.id}')" style="color:var(--primary)"><i class="fa-solid fa-plus"></i> zona / scaffale</span>` : ""}</div>
      ${arts.length ? `<div style="margin-top:10px;display:flex;gap:6px;flex-wrap:wrap">${arts.slice(0, 12).map((a) => `<span class="mag-tag" style="cursor:pointer" onclick="magApriDettaglio('${a.id}')"><i class="mag-sem ${mag.calc[a.id].stato}" style="width:7px;height:7px"></i>${escapeHtml(a.nome)}</span>`).join("")}${arts.length > 12 ? `<span class="mag-tag">+${arts.length - 12}</span>` : ""}</div>` : ""}
    </div>`;
		}).join("");
		box.innerHTML = html;
	}
	function magApriUbicazione(id, parentId) {
		magUbiEdit = id ? mag.ubicazioni.find((u) => u.id === id) : null;
		const u = magUbiEdit || {};
		document.getElementById("mag-ubi-titolo").textContent = magUbiEdit ? "Modifica ubicazione" : parentId ? "Nuova zona / scaffale" : "Nuovo deposito";
		document.getElementById("mag-ubi-tipo").value = u.tipo || (parentId ? "zona" : "deposito");
		document.getElementById("mag-ubi-parent").innerHTML = mag.ubicazioni.filter((x) => x.id !== u.id && x.tipo !== "scaffale").map((x) => `<option value="${x.id}">${escapeHtml(magUbiNome(x.id))}</option>`).join("");
		document.getElementById("mag-ubi-parent").value = u.parent_id || parentId || "";
		document.getElementById("mag-ubi-nome").value = u.nome || "";
		document.getElementById("mag-ubi-note").value = u.note || "";
		document.getElementById("mag-ubi-elimina").style.display = magUbiEdit ? "" : "none";
		document.getElementById("mag-ubi-err").style.display = "none";
		magUbiTipoCambiato();
		openModal("modal-mag-ubicazione");
	}
	function magUbiTipoCambiato() {
		document.getElementById("mag-ubi-parent-box").style.display = document.getElementById("mag-ubi-tipo").value === "deposito" ? "none" : "block";
	}
	async function magSalvaUbicazione() {
		const err = document.getElementById("mag-ubi-err");
		err.style.display = "none";
		const tipo = document.getElementById("mag-ubi-tipo").value;
		const row = {
			centro_id: currentCentro.id,
			tipo,
			nome: document.getElementById("mag-ubi-nome").value.trim(),
			parent_id: tipo === "deposito" ? null : document.getElementById("mag-ubi-parent").value || null,
			note: document.getElementById("mag-ubi-note").value.trim() || null
		};
		if (!row.nome) {
			err.textContent = "Scrivi il nome.";
			err.style.display = "block";
			return;
		}
		if (tipo !== "deposito" && !row.parent_id) {
			err.textContent = "Scegli dove si trova (dentro a quale deposito).";
			err.style.display = "block";
			return;
		}
		if (DEMO_MODE) {
			if (magUbiEdit) Object.assign(magUbiEdit, row);
			else mag.ubicazioni.push({
				id: "du" + Math.random().toString(36).slice(2),
				...row
			});
			demoState.mag.ubicazioni = JSON.parse(JSON.stringify(mag.ubicazioni));
		} else {
			const r = magUbiEdit ? await sb.from("mag_ubicazioni").update(row).eq("id", magUbiEdit.id).select().single() : await sb.from("mag_ubicazioni").insert(row).select().single();
			if (r.error) {
				err.textContent = "Non salvato: " + r.error.message;
				err.style.display = "block";
				return;
			}
			const i = mag.ubicazioni.findIndex((x) => x.id === r.data.id);
			if (i >= 0) mag.ubicazioni[i] = r.data;
			else mag.ubicazioni.push(r.data);
		}
		closeModal("modal-mag-ubicazione");
		magRenderTutto();
		showToast("Salvato.");
	}
	async function magEliminaUbicazione() {
		if (!magUbiEdit) return;
		if (!confirm(`Eliminare "${magUbiEdit.nome}" (e le zone al suo interno)? Gli articoli restano in magazzino, senza ubicazione.`)) return;
		if (DEMO_MODE) {
			const via = /* @__PURE__ */ new Set([magUbiEdit.id, ...mag.ubicazioni.filter((u) => u.parent_id === magUbiEdit.id).map((u) => u.id)]);
			mag.ubicazioni = mag.ubicazioni.filter((u) => !via.has(u.id));
			demoState.mag.ubicazioni = JSON.parse(JSON.stringify(mag.ubicazioni));
		} else {
			const { error } = await sb.from("mag_ubicazioni").delete().eq("id", magUbiEdit.id);
			if (error) {
				showToast("Non eliminato: " + error.message);
				return;
			}
			await loadMagazzino();
		}
		closeModal("modal-mag-ubicazione");
		magRenderTutto();
	}
	// equo-scuderia-src/src/sezioni/magazzino/moduli/035-fornitori.js
	var magFornEdit = null;
	function magRenderFornitori() {
		const box = document.getElementById("mag-fornitori");
		let html = magPuoGestire() ? `<div><button class="btn btn-primary" onclick="magApriFornitore()"><i class="fa-solid fa-plus"></i> Nuovo fornitore</button></div>` : "";
		if (!mag.fornitori.length) html += `<div class="card empty-state"><i class="fa-solid fa-handshake"></i><div>Aggiungi i tuoi fornitori (consorzio agrario, farmacia veterinaria, selleria…): gli ordini partono da qui via WhatsApp o email.</div></div>`;
		html += mag.fornitori.map((f) => {
			const arts = mag.articoli.filter((a) => a.fornitore_id === f.id), g = magStatoGruppo(arts);
			const tel = (f.telefono || "").replace(/[^\d+]/g, "");
			return `<div class="card mag-forn"><i class="mag-sem ${arts.length ? g.colore : "verde"}"></i><div class="t"><b>${escapeHtml(f.nome)}</b>
      <small>${escapeHtml([
				f.referente,
				f.telefono,
				f.email
			].filter(Boolean).join(" · ") || "Nessun contatto")}</small>
      <small>${arts.length} articoli${g.rosso + g.giallo ? ` · <span style="color:var(--danger)">${g.rosso + g.giallo} da riordinare/controllare</span>` : ""}${f.note ? " · " + escapeHtml(f.note) : ""}</small></div>
      ${tel ? `<a class="btn btn-sm btn-outline" href="tel:${escapeHtml(tel)}"><i class="fa-solid fa-phone"></i></a><a class="btn btn-sm btn-outline" target="_blank" rel="noopener" href="https://wa.me/${escapeHtml(tel.replace(/^\+/, ""))}"><i class="fa-brands fa-whatsapp"></i></a>` : ""}
      ${f.email ? `<a class="btn btn-sm btn-outline" href="mailto:${escapeHtml(f.email)}"><i class="fa-solid fa-envelope"></i></a>` : ""}
      ${magPuoGestire() ? `<button class="btn btn-sm btn-ghost" onclick="magApriFornitore('${f.id}')"><i class="fa-solid fa-pen"></i></button>` : ""}</div>`;
		}).join("");
		box.innerHTML = html;
	}
	function magApriFornitore(id) {
		magFornEdit = id ? mag.fornitori.find((f) => f.id === id) : null;
		const f = magFornEdit || {};
		document.getElementById("mag-forn-titolo").textContent = magFornEdit ? "Modifica fornitore" : "Nuovo fornitore";
		[
			"nome",
			"referente",
			"telefono",
			"email",
			"note"
		].forEach((k) => document.getElementById("mag-forn-" + k).value = f[k] || "");
		document.getElementById("mag-forn-archivia").style.display = magFornEdit ? "" : "none";
		document.getElementById("mag-forn-err").style.display = "none";
		openModal("modal-mag-fornitore");
	}
	async function magSalvaFornitore() {
		const err = document.getElementById("mag-forn-err");
		err.style.display = "none";
		const row = { centro_id: currentCentro.id };
		[
			"nome",
			"referente",
			"telefono",
			"email",
			"note"
		].forEach((k) => row[k] = document.getElementById("mag-forn-" + k).value.trim() || null);
		if (!row.nome) {
			err.textContent = "Scrivi il nome del fornitore.";
			err.style.display = "block";
			return;
		}
		if (DEMO_MODE) {
			if (magFornEdit) Object.assign(magFornEdit, row);
			else mag.fornitori.push({
				id: "df" + Math.random().toString(36).slice(2),
				...row
			});
			demoState.mag.fornitori = JSON.parse(JSON.stringify(mag.fornitori));
		} else {
			const r = magFornEdit ? await sb.from("mag_fornitori").update(row).eq("id", magFornEdit.id).select().single() : await sb.from("mag_fornitori").insert(row).select().single();
			if (r.error) {
				err.textContent = "Non salvato: " + r.error.message;
				err.style.display = "block";
				return;
			}
			const i = mag.fornitori.findIndex((x) => x.id === r.data.id);
			if (i >= 0) mag.fornitori[i] = r.data;
			else mag.fornitori.push(r.data);
		}
		closeModal("modal-mag-fornitore");
		magRenderTutto();
		showToast("Fornitore salvato.");
	}
	async function magArchiviaFornitore() {
		if (!magFornEdit || !confirm(`Archiviare "${magFornEdit.nome}"?`)) return;
		if (DEMO_MODE) {
			mag.fornitori = mag.fornitori.filter((f) => f.id !== magFornEdit.id);
			demoState.mag.fornitori = JSON.parse(JSON.stringify(mag.fornitori));
		} else {
			const { error } = await sb.from("mag_fornitori").update({ archiviato: true }).eq("id", magFornEdit.id);
			if (error) {
				showToast("Non riuscito: " + error.message);
				return;
			}
			mag.fornitori = mag.fornitori.filter((f) => f.id !== magFornEdit.id);
		}
		closeModal("modal-mag-fornitore");
		magRenderTutto();
	}
	// equo-scuderia-src/src/sezioni/magazzino/moduli/025-vista-semplice-completa-magazzino-e-stat.js
	function vistaChiave(modulo) {
		return `equo-vista-${modulo}-${currentUser?.id || "demo"}`;
	}
	function vistaSemplice(modulo) {
		let v = null;
		try {
			v = localStorage.getItem(vistaChiave(modulo));
		} catch (e) {}
		if (v) return v === "semplice";
		return !(currentMembro?.ruolo === "admin" || [
			"admin",
			"2",
			"3"
		].includes(String(currentMembro?.livello)) || currentCentro?.owner_id === currentUser?.id);
	}
	function vistaCambia(modulo, completa) {
		try {
			localStorage.setItem(vistaChiave(modulo), completa ? "completa" : "semplice");
		} catch (e) {}
		if (typeof Registro !== "undefined") Registro.azione(`vista-${modulo}:${completa ? "completa" : "semplice"}`);
		if (modulo === "magazzino") magRenderTutto();
		else if (statDati) renderStatistiche(statDati);
	}
	function vistaSincronizza(modulo) {
		const t = document.getElementById("vs-" + modulo);
		if (t) t.checked = !vistaSemplice(modulo);
	}
	function magRenderSemplice() {
		const box = document.getElementById("mag-semplice");
		const durevole = (a) => !!magCats()[a.categoria]?.durevole;
		const ordine = {
			rosso: 0,
			giallo: 1,
			verde: 2
		};
		const daComprare = mag.articoli.filter((a) => !durevole(a) && (mag.calc[a.id]?.daOrdinare > 0 || mag.calc[a.id]?.stato === "rosso")).sort((x, y) => ordine[mag.calc[x.id].stato] - ordine[mag.calc[y.id].stato]);
		const g = magStatoGruppo(mag.articoli.filter((a) => !durevole(a)));
		const q = magSempliceCerca.trim().toLowerCase();
		const lista = mag.articoli.filter((a) => !q || [
			a.nome,
			a.marca,
			a.sottocategoria
		].filter(Boolean).join(" ").toLowerCase().includes(q)).sort((x, y) => ordine[mag.calc[x.id].stato] - ordine[mag.calc[y.id].stato] || x.nome.localeCompare(y.nome, "it"));
		const forn = (id) => mag.fornitori.find((f) => f.id === id)?.nome;
		const riga = (a) => {
			const c = mag.calc[a.id];
			return `<div class="ms-riga"><i class="mag-sem ${c.stato}" data-tip="${escapeHtml(c.motivo)}"></i>
      <div class="ms-t" onclick="magApriDettaglio('${a.id}')"><b>${escapeHtml(a.nome)}</b><span>${magFmt(c.giacenza)} ${escapeHtml(a.unita)}${c.stato !== "verde" ? " · " + escapeHtml(c.motivo) : ""}</span></div>
      <button class="ms-btn meno" data-tip="Ne ho usato 1 ${escapeHtml(MAG_SINGOLARE[a.unita] || a.unita)}" onclick="magRapido('${a.id}','scarico')">−</button>
      <button class="ms-btn piu" data-tip="Ne è arrivato 1 ${escapeHtml(MAG_SINGOLARE[a.unita] || a.unita)}" onclick="magRapido('${a.id}','carico')">+</button></div>`;
		};
		box.innerHTML = `
    <div class="card ms-testa ${g.rosso ? "rosso" : g.giallo ? "giallo" : "verde"}"><i class="fa-solid ${g.rosso ? "fa-triangle-exclamation" : g.giallo ? "fa-hourglass-half" : "fa-circle-check"}"></i>
      <div><b>${g.rosso || g.giallo ? [g.rosso ? `${g.rosso} ${g.rosso === 1 ? "articolo" : "articoli"} da comprare` : "", g.giallo ? `${g.giallo} ${g.giallo === 1 ? "sta" : "stanno"} finendo` : ""].filter(Boolean).join(" · ") : "Il magazzino è a posto"}</b>
      <span>Tocca − quando usi qualcosa, + quando arriva.</span></div></div>
    ${daComprare.length ? `<div class="card ms-sez"><h3><i class="fa-solid fa-cart-shopping"></i> Da comprare</h3>${daComprare.map((a) => {
			const c = mag.calc[a.id];
			return `<div class="ms-riga"><i class="mag-sem ${c.stato}"></i><div class="ms-t"><b>${escapeHtml(a.nome)}</b><span>ne hai ${magFmt(c.giacenza)} ${escapeHtml(a.unita)}${c.daOrdinare ? ` · compra ${magFmt(c.daOrdinare)}` : ""}${forn(a.fornitore_id) ? " · " + escapeHtml(forn(a.fornitore_id)) : ""}</span></div>
        <button class="btn btn-primary btn-conferma btn-sm" data-tip="Registra l'arrivo della merce" onclick="magComprato('${a.id}')"><i class="fa-solid fa-check"></i> Comprato</button></div>`;
		}).join("")}</div>` : ""}
    <div class="card ms-sez"><div class="mag-search" style="margin-bottom:8px"><i class="fa-solid fa-magnifying-glass"></i><input class="input" id="ms-cerca" placeholder="Cerca un articolo…" value="${escapeHtml(magSempliceCerca)}" oninput="magSempliceCerca=this.value;magRenderSemplice();const i=document.getElementById('ms-cerca');i.focus();i.setSelectionRange(i.value.length,i.value.length)"></div>
      ${lista.length ? lista.map(riga).join("") : `<div style="color:var(--muted);font-size:13.5px;padding:10px 0">${mag.articoli.length ? "Nessun articolo trovato." : "Ancora nessun articolo: passa alla vista Completa per aggiungerli."}</div>`}</div>`;
	}
	async function magRapido(id, tipo) {
		const a = mag.articoli.find((x) => x.id === id), c = mag.calc[id];
		if (!a) return;
		if (tipo === "scarico" && c.giacenza <= 0) {
			showToast(`${a.nome}: non risulta disponibile.`);
			return;
		}
		const base = {
			centro_id: currentCentro.id,
			articolo_id: id,
			quantita: 1,
			tipo
		};
		if (tipo === "scarico") {
			const l = c.lottiAttivi.find((x) => x.qta >= 1);
			if (l) {
				base.lotto = l.lotto;
				base.scadenza = l.scadenza;
			}
		}
		const errore = await magInserisciMovimenti([base]);
		if (errore) {
			showToast("Non salvato: " + errore);
			return;
		}
		magCalcola();
		magRenderTutto();
		const cn = mag.calc[id];
		showToast(`${tipo === "scarico" ? "−1" : "+1"} ${MAG_SINGOLARE[a.unita] || a.unita} · ${a.nome}: ${magFmt(cn.giacenza)} ${a.unita}${cn.stato === "rosso" ? " ⚠️ da comprare" : ""}`);
	}
	function magComprato(id) {
		const q = mag.calc[id]?.daOrdinare || "";
		magApriMovimento(id, "carico");
		setTimeout(() => {
			const i = document.getElementById("mag-mov-qta");
			if (i && q) {
				i.value = q;
				if (typeof magMovAnteprima === "function") magMovAnteprima();
			}
		}, 60);
	}
	function magRenderTutto() {
		vistaSincronizza("magazzino");
		const semplice = vistaSemplice("magazzino");
		document.getElementById("mag-semplice").style.display = semplice ? "" : "none";
		[
			"mag-hero",
			"mag-subnav",
			"mag-v-giacenze",
			"mag-v-movimenti",
			"mag-v-ordini",
			"mag-v-depositi",
			"mag-v-fornitori"
		].forEach((id) => {
			const el = document.getElementById(id);
			if (!el) return;
			if (semplice) {
				if (el.style.display !== "none") el.dataset.vsPrima = el.style.display || "show";
				el.style.display = "none";
			} else if (el.dataset.vsPrima) {
				el.style.display = el.dataset.vsPrima === "show" ? "" : el.dataset.vsPrima;
				delete el.dataset.vsPrima;
			}
		});
		if (semplice) {
			magRenderSemplice();
			return;
		}
		magRenderHero();
		magRenderCategorie();
		magRender();
		if (magUI.vista === "movimenti") magRenderMovimenti();
		if (magUI.vista === "ordini") magRenderOrdini();
		if (magUI.vista === "depositi") magRenderDepositi();
		if (magUI.vista === "fornitori") magRenderFornitori();
		const nRiordino = mag.articoli.filter((a) => mag.calc[a.id]?.daOrdinare > 0).length;
		const b = document.getElementById("mag-n-riordino");
		b.textContent = nRiordino;
		b.style.display = nRiordino ? "" : "none";
	}
	function magVista(v) {
		magUI.vista = v;
		document.querySelectorAll("#mag-subnav button").forEach((b) => b.classList.toggle("active", b.dataset.magVista === v));
		[
			"giacenze",
			"movimenti",
			"ordini",
			"depositi",
			"fornitori"
		].forEach((x) => {
			document.getElementById("mag-v-" + x).style.display = x === v ? "block" : "none";
		});
		magRenderTutto();
	}
	// equo-scuderia-src/src/sezioni/magazzino/moduli/024-modulo.js
	async function refreshMagazzinoModule() {
		if (!mag.caricato) document.getElementById("mag-grid").innerHTML = "<div class=\"empty-state\" style=\"grid-column:1/-1\"><i class=\"fa-solid fa-spinner fa-spin\"></i><div>Carico il magazzino…</div></div>";
		await loadMagazzino();
		document.getElementById("mag-btn-articolo").style.display = magPuoGestire() ? "" : "none";
		magRenderTutto();
	}
	// equo-scuderia-src/src/sezioni/magazzino/moduli/029-dettaglio-articolo.js
	function magApriDettaglio(id) {
		const a = mag.articoli.find((x) => x.id === id);
		if (!a) return;
		const c = mag.calc[a.id];
		const f = mag.fornitori.find((x) => x.id === a.fornitore_id);
		const movs = mag.movimenti.filter((m) => m.articolo_id === id).slice(0, 12);
		document.getElementById("mag-det-corpo").innerHTML = `
    <div class="mag-det-head">${magIcona(a.categoria).replace("class=\"ic\"", "class=\"ic\"")}
      <div style="flex:1;min-width:0"><div style="font-size:18px;font-weight:800">${escapeHtml(a.nome)}</div>
      <div style="color:var(--muted);font-size:12.5px">${escapeHtml([
			magCats()[a.categoria]?.nome,
			a.sottocategoria,
			a.marca,
			a.formato
		].filter(Boolean).join(" · "))}</div></div>
      <span class="badge-pill ${c.stato === "rosso" ? "badge-red" : c.stato === "giallo" ? "badge-yellow" : "badge-green"}"><i class="mag-sem ${c.stato}" style="width:8px;height:8px"></i> ${escapeHtml(c.motivo)}</span></div>
    <div class="mag-det-nums">
      <div><b>${magFmt(c.giacenza)}</b><small>${escapeHtml(a.unita)} in magazzino${magEquivalente(c.giacenza, a) ? "<br>" + magEquivalente(c.giacenza, a) : ""}</small></div>
      <div><b>${magFmt(a.soglia_minima)}</b><small>soglia minima</small></div>
      <div><b>${c.copertura !== null ? c.copertura + " gg" : "—"}</b><small>di scorta</small></div>
      <div><b>${a.costo_unitario ? magEuro(c.valore) : "—"}</b><small>valore</small></div>
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <button class="btn btn-sm btn-outline" onclick="closeModal('modal-mag-dettaglio');magApriMovimento('${a.id}','scarico')" style="color:var(--danger)"><i class="fa-solid fa-minus"></i> Usa / scarica</button>
      <button class="btn btn-sm btn-outline" onclick="closeModal('modal-mag-dettaglio');magApriMovimento('${a.id}','carico')" style="color:#2f8a4e"><i class="fa-solid fa-plus"></i> Carica</button>
      <button class="btn btn-sm btn-outline" onclick="closeModal('modal-mag-dettaglio');magApriMovimento('${a.id}','rettifica')"><i class="fa-solid fa-scale-balanced"></i> Inventario</button>
      ${magPuoGestire() ? `<button class="btn btn-sm btn-ghost btn-variazione" onclick="closeModal('modal-mag-dettaglio');magApriArticolo('${a.id}')"><i class="fa-solid fa-pen"></i> Modifica</button>` : ""}
    </div>
    <div class="mag-det-sez">Dove e da chi</div>
    <div style="font-size:13.5px;line-height:1.7">
      <div><i class="fa-solid fa-location-dot" style="width:18px;color:var(--muted)"></i> ${escapeHtml(magUbiNome(a.ubicazione_id) || "Ubicazione non indicata")}</div>
      <div><i class="fa-solid fa-handshake" style="width:18px;color:var(--muted)"></i> ${f ? escapeHtml(f.nome) + (f.telefono ? ` · <a href="tel:${escapeHtml(f.telefono)}">${escapeHtml(f.telefono)}</a>` : "") : "Fornitore non indicato"}</div>
      ${a.costo_unitario ? `<div><i class="fa-solid fa-tag" style="width:18px;color:var(--muted)"></i> ${magEuro(a.costo_unitario)} per ${escapeHtml(a.unita)}</div>` : ""}
      ${c.consumo30 ? `<div><i class="fa-solid fa-chart-line" style="width:18px;color:var(--muted)"></i> Consumo ultimi 30 giorni: ${magFmt(c.consumo30)} ${escapeHtml(a.unita)} (${magFmt(c.mediaGiorno, 1)} al giorno)</div>` : ""}
      ${a.note ? `<div><i class="fa-solid fa-note-sticky" style="width:18px;color:var(--muted)"></i> ${escapeHtml(a.note)}</div>` : ""}
    </div>
    ${c.lottiAttivi.length ? `<div class="mag-det-sez">Lotti in magazzino (usa prima quelli in alto)</div>` + c.lottiAttivi.map((l) => {
			const gg = l.scadenza ? magGiorniA(l.scadenza) : null;
			return `<div class="mag-lotto"><span><b>${escapeHtml(l.lotto || "senza lotto")}</b> · ${magFmt(l.qta)} ${escapeHtml(a.unita)}</span>
        <span class="mag-tag ${gg !== null && gg < 0 ? "rosso" : gg !== null && gg <= 30 ? "giallo" : ""}">${l.scadenza ? (gg < 0 ? "scaduto il " : "scade il ") + magDataIt(l.scadenza) : "senza scadenza"}</span></div>`;
		}).join("") : ""}
    <div class="mag-det-sez">Ultimi movimenti</div>
    ${movs.length ? movs.map((m) => magRigaMovimento(m, true)).join("") : `<div style="color:var(--muted);font-size:13px">Nessun movimento registrato.</div>`}`;
		openModal("modal-mag-dettaglio");
	}
	// equo-scuderia-src/src/sezioni/magazzino/moduli/index.js
	Object.assign(window, {
		loadMagazzino,
		magApriArticolo,
		magApriCategoria,
		magApriDettaglio,
		magApriFornitore,
		magApriMovimento,
		magApriUbicazione,
		magArchiviaArticolo,
		magArchiviaFornitore,
		magArtCatCambiata,
		magArtSubCambiata,
		magCatAnteprima,
		magCatScegli,
		magComprato,
		magCopiaOrdine,
		magCreaOrdine,
		magEliminaUbicazione,
		magFiltraStato,
		magInviaOrdine,
		magLayout,
		magMovAnteprima,
		magMovCambiaArticolo,
		magMovRenderPick,
		magMovScegli,
		magMovStep,
		magMovTipo,
		magNascondiCategoria,
		magRapido,
		magRender,
		magRenderMovimenti,
		magRenderSemplice,
		magRiceviOrdine,
		magSalvaArticolo,
		magSalvaCategoria,
		magSalvaFornitore,
		magSalvaMovimento,
		magSalvaUbicazione,
		magSelCat,
		magSelSub,
		magUbiTipoCambiato,
		magVista,
		refreshMagazzinoModule,
		vistaCambia,
		vistaSemplice,
		vistaSincronizza
	});
})();

