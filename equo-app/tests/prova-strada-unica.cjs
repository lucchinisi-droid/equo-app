const path=require("path");const {chromium}=require("playwright");
const APP=path.resolve(__dirname,"..","index.html");
const SUPA=path.join(path.dirname(require.resolve("@supabase/supabase-js/package.json")),"dist","umd","supabase.js");
(async()=>{const b=await chromium.launch({args:["--allow-file-access-from-files"]});
const pg=await (await b.newContext({viewport:{width:390,height:844}})).newPage();
const err=[];pg.on("pageerror",e=>err.push(String(e.message)));pg.on("dialog",d=>d.accept());pg.on("console",m=>{if(m.type()==="error"||m.type()==="warning")err.push(m.type()+": "+m.text().slice(0,200))});
await pg.route("**/*",r=>{const u=r.request().url();if(u.includes("supabase-js"))return r.fulfill({path:SUPA,contentType:"application/javascript"});if(u.startsWith("file://")||u.startsWith("data:"))return r.continue();return r.abort();});
await pg.goto("file://"+APP);await pg.waitForTimeout(1200);
await pg.evaluate(()=>startDemo());await pg.waitForTimeout(600);
await pg.evaluate(()=>{demoState.clientiMascalcia.push({id:"dc-a",nome:"Anna Neri",tipo_cliente:"proprietario",maniscalco_id:currentUser.id,codice_invito:"EQUOA1"},{id:"dc-b",nome:"Bruno Gialli",tipo_cliente:"proprietario",maniscalco_id:currentUser.id,codice_invito:"EQUOB1"});
 demoState.cavalliClientiMascalcia.push({id:"cva",nome:"Klaus",cliente_mascalcia_id:"dc-a"});});
await pg.evaluate(async()=>{currentUser.ruolo="maniscalco";await enterApp("maniscalco");});await pg.waitForTimeout(2500);
const nK=()=>pg.evaluate(()=>demoState.cavalliClientiMascalcia.filter(x=>x.nome.toLowerCase()==="klaus").length);
const domani=new Date(Date.now()+3*864e5).toISOString().slice(0,10);
async function appuntamento(cliente, nomeNuovoCliente){
  await pg.evaluate(c=>openInterventoModal(c),cliente);await pg.waitForTimeout(1200);
  if(nomeNuovoCliente){await pg.evaluate(()=>{const s=document.getElementById("intervento-cliente-select");s.value="__nuovo__";s.dispatchEvent(new Event("change",{bubbles:true}));});await pg.waitForTimeout(800);
    await pg.fill("#intervento-nuovo-cliente-nome",nomeNuovoCliente);await pg.fill("#intervento-nuovo-cliente-email","test@prova.it");}
  await pg.evaluate(()=>{const c=[...document.querySelectorAll(".int-cav-chk")].find(x=>x.value==="__nuovo_cavallo__");c.checked=true;c.dispatchEvent(new Event("change",{bubbles:true}));});await pg.waitForTimeout(300);
  await pg.evaluate(d=>{document.getElementById("intervento-nuovo-cavallo-nome").value="Klaus";document.getElementById("intervento-data").value=d;},domani);
  await pg.evaluate(()=>{salvaInterventoMascalcia();});await pg.waitForTimeout(1200);
  return pg.evaluate(()=>[document.getElementById("eq-pop-sino").classList.contains("attivo"),document.getElementById("sino-tit").textContent]);
}
// 1) stesso cliente, «No» → usa il Klaus che c'è
console.log("1 popup:",await appuntamento("dc-a"));await pg.evaluate(()=>rispondiSiNo(false));await pg.waitForTimeout(1200);
if(await pg.isVisible("#prezzi-no")){await pg.click("#prezzi-no");await pg.waitForTimeout(1500);}
console.log("1 secondo popup:",await pg.evaluate(()=>[document.getElementById("eq-pop-sino").classList.contains("attivo"),document.getElementById("sino-tit").textContent,document.getElementById("sino-testo").textContent]));
console.log("1 modal aperto:",await pg.evaluate(()=>document.getElementById("modal-add-intervento").classList.contains("active")), await pg.evaluate(d=>JSON.stringify(demoState.interventiMascalcia.filter(i=>i.data_intervento===d)),domani));
console.log("1 dettaglio:",await pg.evaluate(()=>JSON.stringify(demoState.interventiMascalcia.filter(i=>i.cliente_mascalcia_id==="dc-a").map(i=>[i.cavallo_cliente_id,i.stato,i.data_intervento]))), await pg.evaluate(()=>document.getElementById("intervento-error").textContent));
console.log("1 Klaus:",await nK(),"· appuntamento sul cavallo esistente:",await pg.evaluate(()=>demoState.interventiMascalcia.some(i=>i.cavallo_cliente_id==="cva"&&i.stato!=="fatto")));
// 2) altro cliente, «No» → si ferma con il messaggio
await pg.evaluate(()=>closeModal("modal-add-intervento"));
console.log("2 popup:",await appuntamento("dc-b"));await pg.evaluate(()=>rispondiSiNo(false));await pg.waitForTimeout(800);
console.log("2 errore:",await pg.evaluate(()=>document.getElementById("intervento-error").textContent),"· Klaus:",await nK());
// 3) nuovo cliente dentro l'appuntamento: tipo dal nome + email
await pg.evaluate(()=>closeModal("modal-add-intervento"));
await pg.evaluate(()=>openInterventoModal(null));await pg.waitForTimeout(1000);
await pg.evaluate(()=>{const s=document.getElementById("intervento-cliente-select");s.value="__nuovo__";s.dispatchEvent(new Event("change",{bubbles:true}));});await pg.waitForTimeout(600);
await pg.type("#intervento-nuovo-cliente-nome","Scuderia Le Rose");
console.log("3 tipo:",await pg.evaluate(()=>document.getElementById("intervento-nuovo-cliente-tipo").value),await pg.isVisible("#intervento-nuovo-cliente-tipo-auto"));
// 4) Hammer: stessa strada
const r=await pg.evaluate(()=>{const p=creaCavalloUnico({cliente_mascalcia_id:"dc-b",nome:"Klaus"},{usaEsistente:true});return new Promise(res=>setTimeout(()=>res([document.getElementById("eq-pop-sino").classList.contains("attivo")]),600));});
console.log("4 Hammer popup:",r);
console.log("errori:",err);await b.close();})();
