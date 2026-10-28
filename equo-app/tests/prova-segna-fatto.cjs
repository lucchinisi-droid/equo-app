const path=require("path");const {chromium}=require("playwright");
const APP=path.resolve(__dirname,"..","index.html");
const SUPA=path.join(path.dirname(require.resolve("@supabase/supabase-js/package.json")),"dist","umd","supabase.js");
(async()=>{const b=await chromium.launch({args:["--allow-file-access-from-files"]});
const pg=await (await b.newContext({viewport:{width:390,height:844}})).newPage();
const err=[],dialoghi=[];pg.on("pageerror",e=>err.push(String(e.message)));pg.on("dialog",d=>{dialoghi.push(d.message().slice(0,60));d.accept()});
await pg.route("**/*",r=>{const u=r.request().url();if(u.includes("supabase-js"))return r.fulfill({path:SUPA,contentType:"application/javascript"});if(u.startsWith("file://")||u.startsWith("data:"))return r.continue();return r.abort();});
await pg.goto("file://"+APP);await pg.waitForTimeout(1200);
await pg.evaluate(()=>startDemo());await pg.waitForTimeout(600);
const iso=d=>new Date(Date.now()+d*864e5).toISOString().slice(0,10);
await pg.evaluate(({f1,f2})=>{demoState.clientiMascalcia.push({id:"dc-f",nome:"Fabio Verdi",tipo_cliente:"proprietario",maniscalco_id:currentUser.id,codice_invito:"EQUOF1"});
 demoState.cavalliClientiMascalcia.push({id:"cvf",nome:"Furia",cliente_mascalcia_id:"dc-f"},{id:"cvg",nome:"Gitano",cliente_mascalcia_id:"dc-f"});
 demoState.interventiMascalcia.push({id:"if1",cliente_mascalcia_id:"dc-f",cavallo_cliente_id:"cvf",tipo_ferratura:"ferratura",quantita_ferri:4,data_intervento:f1,stato:"programmato",stato_pagamento:"da_saldare",importo:null},
  {id:"if2",cliente_mascalcia_id:"dc-f",cavallo_cliente_id:"cvg",tipo_ferratura:"pareggio",data_intervento:f2,stato:"programmato",stato_pagamento:"da_saldare",importo:null});},{f1:iso(2),f2:iso(2)});
await pg.evaluate(async()=>{currentUser.ruolo="maniscalco";await enterApp("maniscalco");});await pg.waitForTimeout(2500);
await pg.evaluate(async()=>{showPage("pro-agenda");});await pg.waitForTimeout(1500);
for(const [id,via] of [["if1","tasto Fatto"],["if2","finestra appuntamento"]]){
  await pg.evaluate(async id=>{await renderAgendaSettimana(); },id).catch(()=>{});
  await pg.evaluate(({id,via})=>{ if(via==="tasto Fatto") segnaFattoAgenda(id); else { apriAzioniEvento(id); azioneEvento("fatto"); } },{id,via});
  await pg.waitForTimeout(700);
  const sino=await pg.evaluate(()=>document.getElementById("eq-pop-sino").classList.contains("attivo")?document.getElementById("sino-tit").textContent:"(nessun Sì/No)");
  await pg.evaluate(()=>rispondiSiNo(true));await pg.waitForTimeout(900);
  const riquadro=await pg.evaluate(()=>[...document.querySelectorAll(".modal-overlay.active")].map(m=>m.id).join(","));
  await pg.evaluate(()=>{ if(typeof richiamoConferma==="function") richiamoConferma(); });await pg.waitForTimeout(1200);
  const i=await pg.evaluate(id=>demoState.interventiMascalcia.find(x=>x.id===id),id);
  console.log(via,"| domanda:",sino,"| aperto:",riquadro,"| stato:",i.stato,i.data_intervento,"prossima:",i.prossima_scadenza);
}
await pg.evaluate(async()=>{await renderAgendaSettimana(); apriAzioniEvento("if1"); await azioneEvento("fatto");});await pg.waitForTimeout(800);
console.log("rimetti da fare:",await pg.evaluate(()=>demoState.interventiMascalcia.find(x=>x.id==="if1").stato));
console.log("finestrelle del telefono:",dialoghi);
console.log("errori:",err);await b.close();})();
