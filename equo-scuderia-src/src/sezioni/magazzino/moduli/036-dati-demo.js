// Equo App · magazzino · modulo (moduli ES, costruiti con Vite in ruoli/magazzino/costruito.js)
/* ---------------- dati demo ---------------- */
function magDemoSeed(){
  const ub = [
    { id:"u1", nome:"Fienile", tipo:"deposito", parent_id:null }, { id:"u2", nome:"Magazzino mangimi", tipo:"deposito", parent_id:null },
    { id:"u3", nome:"Selleria", tipo:"deposito", parent_id:null }, { id:"u4", nome:"Armadio farmaci", tipo:"zona", parent_id:"u3" },
    { id:"u5", nome:"Scaffale coperte", tipo:"scaffale", parent_id:"u3" }, { id:"u6", nome:"Officina mascalcia", tipo:"deposito", parent_id:null },
  ];
  const fo = [
    { id:"f1", nome:"Consorzio Agrario Colleferro", referente:"Paolo", telefono:"+39 333 1234567", email:"ordini@consorzio.it", note:"Consegna il martedì" },
    { id:"f2", nome:"Farmacia Veterinaria San Giorgio", telefono:"+39 06 7654321", email:"info@farmaciavet.it" },
    { id:"f3", nome:"Selleria Il Galoppo", telefono:"+39 347 1112223" },
    { id:"f4", nome:"Forniture Mascalcia Italia", email:"shop@mascalcia.it" },
  ];
  const A = (id, categoria, sottocategoria, nome, extra) => ({ id, centro_id:"demo-centro", categoria, sottocategoria, nome, unita: MAG_CATEGORIE[categoria].unita, soglia_minima:0, gestisce_lotti:false, archiviato:false, ...extra });
  const ar = [
    A("a1","alimentazione","Fieno","Fieno di prato polifita",{ formato:"balla 25 kg", unita:"balle", soglia_minima:40, scorta_ottimale:120, ubicazione_id:"u1", fornitore_id:"f1", costo_unitario:6.5 }),
    A("a2","alimentazione","Mangimi","Mangime fioccato sport",{ marca:"Cavalor", formato:"sacco 20 kg", unita:"sacchi", soglia_minima:8, scorta_ottimale:25, ubicazione_id:"u2", fornitore_id:"f1", costo_unitario:24 }),
    A("a3","alimentazione","Cereali e fioccati","Orzo schiacciato",{ formato:"sacco 25 kg", unita:"sacchi", soglia_minima:4, scorta_ottimale:12, ubicazione_id:"u2", fornitore_id:"f1", costo_unitario:14 }),
    A("a4","alimentazione","Mash e crusca","Mash digestivo",{ formato:"sacco 15 kg", unita:"sacchi", soglia_minima:2, scorta_ottimale:6, ubicazione_id:"u2", fornitore_id:"f1", costo_unitario:28 }),
    A("a5","alimentazione","Snack e carote","Carote",{ unita:"kg", soglia_minima:10, scorta_ottimale:40, ubicazione_id:"u2", fornitore_id:"f1", costo_unitario:0.9 }),
    A("a6","lettiera","Paglia","Paglia di frumento",{ formato:"balla piccola", unita:"balle", soglia_minima:30, scorta_ottimale:100, ubicazione_id:"u1", fornitore_id:"f1", costo_unitario:4 }),
    A("a7","lettiera","Truciolo","Truciolo depolverato",{ formato:"balla 20 kg", unita:"balle", soglia_minima:15, scorta_ottimale:40, ubicazione_id:"u1", fornitore_id:"f1", costo_unitario:9.5 }),
    A("a8","integratori","Articolazioni","Integratore articolare",{ marca:"Equistro", formato:"secchio 1,8 kg", unita:"conf", soglia_minima:2, scorta_ottimale:5, ubicazione_id:"u4", fornitore_id:"f2", costo_unitario:62, gestisce_lotti:true }),
    A("a9","integratori","Elettroliti","Sali minerali elettroliti",{ formato:"barattolo 3 kg", unita:"conf", soglia_minima:2, scorta_ottimale:4, ubicazione_id:"u4", fornitore_id:"f2", costo_unitario:35, gestisce_lotti:true }),
    A("a10","farmaci","Vermifughi","Vermifugo pasta ivermectina",{ unita:"siringhe", soglia_minima:5, scorta_ottimale:15, ubicazione_id:"u4", fornitore_id:"f2", costo_unitario:11, gestisce_lotti:true }),
    A("a11","farmaci","Disinfettanti e medicazioni","Iodopovidone 10%",{ formato:"flacone 1 l", unita:"flaconi", soglia_minima:1, scorta_ottimale:3, ubicazione_id:"u4", fornitore_id:"f2", costo_unitario:14, gestisce_lotti:true }),
    A("a12","farmaci","Bende e fasce","Fasce coesive",{ unita:"rotoli", soglia_minima:10, scorta_ottimale:30, ubicazione_id:"u4", fornitore_id:"f2", costo_unitario:3.2 }),
    A("a13","mascalcia","Ferri","Ferri anteriori",{ marca:"Mustad", formato:"misura 2", unita:"paia", soglia_minima:6, scorta_ottimale:20, ubicazione_id:"u6", fornitore_id:"f4", costo_unitario:9 }),
    A("a14","mascalcia","Chiodi","Chiodi E-head",{ marca:"Mustad", formato:"E5 · scatola 250", unita:"scatole", soglia_minima:2, scorta_ottimale:6, ubicazione_id:"u6", fornitore_id:"f4", costo_unitario:22 }),
    A("a15","coperte","Coperte impermeabili","Coperta impermeabile 200 g",{ formato:"145 cm", unita:"pz", ubicazione_id:"u5", fornitore_id:"f3", costo_unitario:89, condizione:"ok", cavallo_id:"c1" }),
    A("a16","coperte","Coperte da box","Coperta da box pile",{ formato:"155 cm", unita:"pz", ubicazione_id:"u5", fornitore_id:"f3", costo_unitario:45, condizione:"da_lavare" }),
    A("a17","selleria","Selle","Sella da salto scuola",{ marca:"Prestige", formato:"17,5\"", unita:"pz", ubicazione_id:"u3", costo_unitario:1200, condizione:"da_riparare" }),
    A("a18","selleria","Sottosella","Sottosella bianco",{ unita:"pz", soglia_minima:4, ubicazione_id:"u3", fornitore_id:"f3", costo_unitario:25, condizione:"ok" }),
    A("a19","pulizia","Grasso e olio per zoccoli","Grasso per zoccoli",{ formato:"barattolo 1 l", unita:"conf", soglia_minima:2, scorta_ottimale:5, ubicazione_id:"u3", fornitore_id:"f3", costo_unitario:12 }),
    A("a20","pulizia","Shampoo e prodotti","Shampoo cavalli",{ formato:"flacone 1 l", unita:"flaconi", soglia_minima:2, scorta_ottimale:4, ubicazione_id:"u3", fornitore_id:"f3", costo_unitario:9 }),
    A("a21","attrezzatura","Carriole e forche","Forca da letame",{ unita:"pz", ubicazione_id:"u1", costo_unitario:18, condizione:"da_sostituire" }),
    A("a22","attrezzatura","Secchi e mangiatoie","Secchi 12 l",{ unita:"pz", soglia_minima:5, ubicazione_id:"u2", costo_unitario:4, condizione:"ok" }),
    A("a23","personale","Polo e magliette","Polo staff con logo",{ formato:"taglie S·M·L·XL", unita:"pz", soglia_minima:4, ubicazione_id:"u3", costo_unitario:18, condizione:"ok" }),
    A("a24","personale","Caschi","Casco da equitazione scuola",{ formato:"taglia 56", unita:"pz", ubicazione_id:"u3", costo_unitario:65, condizione:"da_sostituire" }),
    A("a25","ufficio","Carta","Carta A4",{ formato:"risma 500 fogli", unita:"conf", soglia_minima:3, scorta_ottimale:10, costo_unitario:4.5 }),
    A("a26","ufficio","Toner e cartucce","Toner stampante",{ marca:"Brother", formato:"TN-2420", unita:"pz", soglia_minima:1, scorta_ottimale:2, costo_unitario:39 }),
    A("a27","pulizia_struttura","Detersivi","Detersivo pavimenti",{ formato:"tanica 5 l", unita:"pz", soglia_minima:2, scorta_ottimale:6, costo_unitario:11 }),
    A("a28","pulizia_struttura","Sacchi","Sacchi neri 110 l",{ formato:"rotolo 20 pz", unita:"rotoli", soglia_minima:4, scorta_ottimale:12, costo_unitario:3 }),
  ];
  const oggi = new Date();
  const g = (d, h = 9) => { const x = new Date(oggi); x.setDate(x.getDate() - d); x.setHours(h, (d * 7) % 60, 0, 0); return x.toISOString(); };
  const sc = (d) => { const x = new Date(oggi); x.setDate(x.getDate() + d); return isoLoc(x); };
  const mv = []; let n = 0;
  const M = (articolo_id, tipo, quantita, giorni, extra = {}) => mv.push({ id: "m" + (++n), centro_id:"demo-centro", articolo_id, tipo, quantita, created_at: g(giorni, 8 + (n % 9)), creato_da_nome: ["Marco Bianchi","Tu (admin)","Giulia"][n % 3], ...extra });
  // giacenze iniziali (60 giorni fa)
  [["a23",6],["a24",3],["a25",4],["a26",1],["a27",5],["a28",3],["a1",150],["a2",30],["a3",12],["a4",6],["a5",40],["a6",110],["a7",30],["a12",25],["a13",14],["a14",4],["a15",1],["a16",2],["a17",1],["a18",10],["a19",4],["a20",3],["a21",2],["a22",8]]
    .forEach(([id, q]) => M(id, "carico", q, 60, { fornitore_id: ar.find(a => a.id === id).fornitore_id, nota:"Giacenza iniziale" }));
  M("a8","carico",4,60,{ lotto:"EQ2291", scadenza: sc(18), fornitore_id:"f2" }); M("a8","carico",3,20,{ lotto:"EQ2340", scadenza: sc(300), fornitore_id:"f2" });
  M("a9","carico",3,50,{ lotto:"EL771", scadenza: sc(-4), fornitore_id:"f2" });
  M("a10","carico",10,55,{ lotto:"IV0923", scadenza: sc(210), fornitore_id:"f2" });
  M("a11","carico",2,40,{ lotto:"PV118", scadenza: sc(420), fornitore_id:"f2" });
  // consumi giornalieri/settimanali
  for(let d = 56; d >= 0; d--){
    M("a1","scarico",2.2 + (d % 3) * .3,d); if(d % 2 === 0) M("a6","scarico",1.6,d);
    if(d % 2 === 1) M("a2","scarico",0.45,d); if(d % 4 === 0) M("a3","scarico",0.3,d); if(d % 3 === 0) M("a5","scarico",1.5,d);
    if(d % 5 === 0) M("a7","scarico",0.9,d);
  }
  M("a1","carico",60,30,{ fornitore_id:"f1" }); M("a5","carico",25,14,{ fornitore_id:"f1" });
  M("a8","scarico",3,15,{ lotto:"EQ2291", scadenza: sc(18) }); M("a10","scarico",4,25,{ lotto:"IV0923", scadenza: sc(210), cavallo_id:"c1" }); M("a10","scarico",2,6,{ lotto:"IV0923", scadenza: sc(210), cavallo_id:"c2" });
  M("a12","scarico",8,20); M("a12","scarico",6,7); M("a13","scarico",5,21); M("a13","scarico",4,6); M("a14","scarico",1,21); M("a14","scarico",1.5,6);
  M("a19","scarico",1,30); M("a19","scarico",1,10); M("a20","scarico",1,12); M("a2","scarico",4,3); M("a4","scarico",2,9);
  mv.sort((x, y) => y.created_at.localeCompare(x.created_at));
  return { articoli: ar, movimenti: mv, ubicazioni: ub, fornitori: fo, categorie: [],
    ordini: [{ id:"o1", centro_id:"demo-centro", fornitore_id:"f4", stato:"inviato", righe:[{ articolo_id:"a13", quantita:10 }], created_at: g(2), inviato_at: g(2) }] };
}


export { magDemoSeed };
