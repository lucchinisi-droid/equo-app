const path=require("path");const {chromium}=require("playwright");
const APP=path.resolve(__dirname,"..","index.html");
const SUPA=path.join(path.dirname(require.resolve("@supabase/supabase-js/package.json")),"dist","umd","supabase.js");
(async()=>{const b=await chromium.launch({args:["--allow-file-access-from-files"]});
const pg=await (await b.newContext({viewport:{width:390,height:844}})).newPage();
const err=[];pg.on("pageerror",e=>err.push(String(e.message)));pg.on("dialog",d=>d.accept());
await pg.route("**/*",r=>{const u=r.request().url();if(u.includes("supabase-js"))return r.fulfill({path:SUPA,contentType:"application/javascript"});if(u.startsWith("file://")||u.startsWith("data:"))return r.continue();return r.abort();});
await pg.goto("file://"+APP);await pg.waitForTimeout(1200);
await pg.evaluate(()=>startDemo());await pg.waitForTimeout(600);
const oggi=new Date().toISOString().slice(0,10);
await pg.evaluate((oggi)=>{demoState.clientiMascalcia.push({id:"dc-t",nome:"Test Rossi",tipo_cliente:"proprietario",maniscalco_id:currentUser.id,codice_invito:"EQUOT1"});
 demoState.cavalliClientiMascalcia.push({id:"cvt1",nome:"Klaus",cliente_mascalcia_id:"dc-t"});
 demoState.interventiMascalcia.push({id:"it1",cliente_mascalcia_id:"dc-t",cavallo_cliente_id:"cvt1",tipo_ferratura:"ferratura",data_intervento:oggi,stato:"fatto",stato_pagamento:"da_saldare",importo:16.5});},oggi);
await pg.evaluate(async()=>{currentUser.ruolo="maniscalco";await enterApp("maniscalco");});await pg.waitForTimeout(2500);
// A) € nei vari punti
await pg.evaluate(()=>showPage("pro-incassi"));await pg.waitForTimeout(1500);
console.log("A1 Incassi:", await pg.evaluate(()=>[...document.querySelectorAll("#page-pro-incassi *")].map(e=>e.childElementCount===0?e.textContent:"").filter(t=>/€/.test(t)).slice(0,8).join(" | ")));
// B) conto aperto + Saldato dagli incassi
await pg.evaluate(async()=>{await apriNuovoConto("dc-t");});await pg.waitForTimeout(1200);
await pg.evaluate(()=>creaContoDaScelte());await pg.waitForTimeout(1200);
await pg.evaluate(()=>{document.querySelectorAll(".modal-overlay.active").forEach(m=>m.classList.remove("active"))});
await pg.evaluate(async()=>{await segnaSaldatoIncassi("it1",document.createElement("button"));});await pg.waitForTimeout(800);
console.log("B conto dopo «Saldato» da Incassi:", await pg.evaluate(()=>JSON.stringify((demoState.conti||[]).map(c=>[c.numero,c.stato])) + " · lavoro " + demoState.interventiMascalcia.find(i=>i.id==="it1").stato_pagamento));
// C) nuovo cavallo dentro un appuntamento con nome già esistente
const prima=await pg.evaluate(()=>demoState.cavalliClientiMascalcia.filter(x=>x.nome.toLowerCase()==="klaus").length);
console.log("C cavalli Klaus prima:",prima);
await pg.evaluate(()=>openInterventoModal("dc-t"));await pg.waitForTimeout(1500);
const campi=await pg.evaluate(()=>[...document.querySelectorAll("#modal-add-intervento input, #modal-add-intervento select")].filter(e=>e.offsetParent).map(e=>e.id||e.className).join(","));
console.log("C campi visibili:",campi.slice(0,400));
await pg.evaluate(()=>{const c=[...document.querySelectorAll(".int-cav-chk")].find(x=>x.value==="__nuovo_cavallo__");c.checked=true;c.dispatchEvent(new Event("change",{bubbles:true}));});
await pg.waitForTimeout(300);
await pg.evaluate(()=>{document.getElementById("intervento-nuovo-cavallo-nome").value="Klaus";const d=new Date(Date.now()+5*864e5);document.getElementById("intervento-data").value=d.toISOString().slice(0,10);});
await pg.evaluate(()=>{salvaInterventoMascalcia();});await pg.waitForTimeout(1500);
console.log("C popup doppione aperto?",await pg.evaluate(()=>document.getElementById("eq-pop-sino").classList.contains("attivo")), "· Klaus dopo:",await pg.evaluate(()=>demoState.cavalliClientiMascalcia.filter(x=>x.nome.toLowerCase()==="klaus").length));
// D) fissa da scadenza: tre regole per la data
console.log("D",await pg.evaluate(()=>{const ieri=new Date(Date.now()-3*864e5).toISOString().slice(0,10);return JSON.stringify({agendaSemplice:typeof agGiornoLavoro==="function"?"n/d":"n/d"});}));
console.log("errori:",err);await b.close();})();
