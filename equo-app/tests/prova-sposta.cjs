// 11/11/2026: «Sposta» appuntamenti — uno, alcuni o tutta la giornata
const path=require("path");const {chromium}=require("playwright");
const APP=path.resolve(__dirname,"..","index.html");
const SUPA=path.join(path.dirname(require.resolve("@supabase/supabase-js/package.json")),"dist","umd","supabase.js");
const SP=process.env.SP||"/tmp/";
(async()=>{const b=await chromium.launch({args:["--allow-file-access-from-files"]});
const pg=await (await b.newContext({viewport:{width:390,height:844}})).newPage();
const err=[];pg.on("pageerror",e=>err.push(String(e.message)));
await pg.route("**/*",r=>{const u=r.request().url();if(u.includes("supabase-js"))return r.fulfill({path:SUPA,contentType:"application/javascript"});if(u.startsWith("file://")||u.startsWith("data:"))return r.continue();return r.abort();});
await pg.goto("file://"+APP);await pg.waitForTimeout(1200);
await pg.evaluate(()=>startDemo());await pg.waitForTimeout(800);
await pg.evaluate(()=>document.querySelectorAll("[id*=cookie]").forEach(e=>e.remove()));
await pg.evaluate(async()=>{currentUser.ruolo="maniscalco";await enterApp("maniscalco");});await pg.waitForTimeout(2500);
const ok=(c,m)=>console.log((c?"OK  ":"ERR ")+m);
// tre cavalli dello stesso cliente lo stesso giorno + uno di un altro cliente
const info=await pg.evaluate(()=>{
  const cli=demoState.clientiMascalcia[0], altro=demoState.clientiMascalcia[1];
  const d=new Date();d.setDate(d.getDate()+3);const giorno=d.toLocaleDateString("sv-SE");
  const cav=["Boston","Quintano","Giorgia"].map((n,k)=>{const id="spc"+k;demoState.cavalliClientiMascalcia.push({id,cliente_mascalcia_id:cli.id,nome:n});return id;});
  demoState.cavalliClientiMascalcia.push({id:"spcx",cliente_mascalcia_id:altro.id,nome:"Estraneo"});
  cav.forEach((c,k)=>demoState.interventiMascalcia.push({id:"spi"+k,cliente_mascalcia_id:cli.id,cavallo_cliente_id:c,tipo_ferratura:"ferratura",quantita_ferri:4,data_intervento:giorno,ora:"09:00",stato:"programmato",stato_pagamento:"da_saldare"}));
  demoState.interventiMascalcia.push({id:"spix",cliente_mascalcia_id:altro.id,cavallo_cliente_id:"spcx",tipo_ferratura:"pareggio",data_intervento:giorno,stato:"programmato",stato_pagamento:"da_saldare"});
  const e=demoState.interventiMascalcia.find(x=>x.id==="spi0");
  agEventiCache["spi0"]={...e,cavalli_clienti_mascalcia:{nome:"Boston"},clienti_mascalcia:{nome:cli.nome}};
  apriAzioniEvento("spi0");
  return {giorno,cli:cli.nome};
});
await pg.waitForTimeout(400);
ok(await pg.evaluate(()=>getComputedStyle(document.getElementById("azioni-evento-sposta")).display!=="none"),"finestra appuntamento: tasto Sposta");
await pg.screenshot({path:SP+"sp-azioni.png"});
await pg.click("#azioni-evento-sposta");await pg.waitForTimeout(600);
ok(await pg.evaluate(()=>document.getElementById("modal-sposta").classList.contains("active")),"apre «Sposta appuntamento»");
let st=await pg.evaluate(()=>({righe:[...document.querySelectorAll(".sp-riga")].map(r=>r.innerText.replace(/\s+/g," ").trim()),spuntati:[...document.querySelectorAll(".sp-riga input:checked")].length,btn:document.getElementById("sp-vai").innerText,link:document.querySelector(".sp-link")?.innerText,nota:document.querySelector(".sp-nota")?.innerText}));
console.log(st);
ok(st.righe.length===3&&/^Boston/.test(st.righe[0])&&!st.righe.some(r=>/Estraneo/.test(r)),"elenco: i 3 cavalli di quel cliente, il toccato per primo, niente altri clienti");
ok(st.spuntati===1&&st.btn==="Sposta 1 cavallo","di partenza spuntato solo il cavallo toccato");
ok(/Seleziona tutti \(3\)/.test(st.link)&&/Gli altri 2 cavalli restano/.test(st.nota),"«Seleziona tutti (3)» e nota sugli altri");
await pg.screenshot({path:SP+"sp-uno.png"});
// sposta solo Boston
const nuova=await pg.evaluate(()=>{const d=new Date();d.setDate(d.getDate()+5);return d.toLocaleDateString("sv-SE");});
await pg.fill("#sp-data",nuova);await pg.dispatchEvent("#sp-data","change");
await pg.click("#sp-vai");await pg.waitForTimeout(800);
let date=await pg.evaluate(()=>["spi0","spi1","spi2","spix"].map(id=>demoState.interventiMascalcia.find(x=>x.id===id).data_intervento));
ok(date[0]===nuova&&date[1]===info.giorno&&date[2]===info.giorno&&date[3]===info.giorno,"«Sposta 1 cavallo»: solo Boston cambia data");
// tutta la giornata: riapro da Quintano, seleziona tutti
await pg.evaluate(()=>{const e=demoState.interventiMascalcia.find(x=>x.id==="spi1");apriSposta({...e,cavalli_clienti_mascalcia:{nome:"Quintano"}});});await pg.waitForTimeout(500);
await pg.click(".sp-link");await pg.waitForTimeout(200);
st=await pg.evaluate(()=>({spuntati:[...document.querySelectorAll(".sp-riga input:checked")].length,btn:document.getElementById("sp-vai").innerText,link:document.querySelector(".sp-link")?.innerText}));
ok(st.spuntati===2&&st.btn==="Sposta 2 cavalli"&&st.link==="Togli tutti","«Seleziona tutti»: tutti spuntati, tasto «Sposta 2 cavalli»");
await pg.screenshot({path:SP+"sp-tutti.png"});
await pg.click(".sp-link");await pg.waitForTimeout(200);
ok(await pg.evaluate(()=>document.getElementById("sp-vai").disabled),"nessuno spuntato: tasto spento");
await pg.click(".sp-link");await pg.fill("#sp-data",nuova);await pg.dispatchEvent("#sp-data","change");
await pg.click("#sp-vai");await pg.waitForTimeout(800);
date=await pg.evaluate(()=>["spi0","spi1","spi2","spix"].map(id=>demoState.interventiMascalcia.find(x=>x.id===id).data_intervento));
ok(date[1]===nuova&&date[2]===nuova&&date[3]===info.giorno,"tutta la giornata: si spostano gli altri 2, l'altro cliente resta");
// fatto: niente Sposta
await pg.evaluate(()=>{agEventiCache["spi0"].stato="fatto";apriAzioniEvento("spi0");});await pg.waitForTimeout(300);
ok(await pg.evaluate(()=>getComputedStyle(document.getElementById("azioni-evento-sposta")).display==="none"),"appuntamento fatto: niente Sposta");
console.log("errori:",err);await b.close();})();
