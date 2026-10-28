// 28/10/2026: un solo modo di aggiungere un cavallo («Nuovo cavallo»), anche da «Modifica» cliente e dalla scheda del cliente
const path=require("path");const {chromium}=require("playwright");
const APP=path.resolve(__dirname,"..","index.html");
const SUPA=path.join(path.dirname(require.resolve("@supabase/supabase-js/package.json")),"dist","umd","supabase.js");
const SP="/tmp/claude-0/-home-claude/eaacefa9-026a-5679-baea-57c377c34999/scratchpad/";
(async()=>{const b=await chromium.launch({args:["--allow-file-access-from-files"]});
const pg=await (await b.newContext({viewport:{width:390,height:844}})).newPage();
const err=[];pg.on("pageerror",e=>err.push(String(e.message)));
await pg.route("**/*",r=>{const u=r.request().url();if(u.includes("supabase-js"))return r.fulfill({path:SUPA,contentType:"application/javascript"});if(u.startsWith("file://")||u.startsWith("data:"))return r.continue();return r.abort();});
await pg.goto("file://"+APP);await pg.waitForTimeout(1200);
await pg.evaluate(()=>startDemo());await pg.waitForTimeout(600);
await pg.evaluate(async()=>{currentUser.ruolo="maniscalco";await enterApp("maniscalco");});await pg.waitForTimeout(2500);
await pg.evaluate(()=>document.querySelectorAll("[id*=cookie]").forEach(e=>e.remove()));
const ok=(c,m)=>console.log((c?"OK  ":"ERR ")+m);
const aperta=id=>pg.evaluate(id=>document.getElementById(id).classList.contains("active"),id);
await pg.evaluate(async()=>{showPage("pro-clienti");await openClienteDetail("dc-s1");});await pg.waitForTimeout(1200);
// 1) da «Modifica» della scuderia
await pg.evaluate(()=>openEditCliente());await pg.waitForTimeout(1000);
ok(!(await pg.$("#edit-cliente-nuovo-cavallo"))&&!(await pg.$("#edit-cliente-codice-cavallo")),"Modifica: niente più campi nome / codice");
await pg.click("#modal-edit-cliente >> text=+ Aggiungi cavallo");await pg.waitForTimeout(600);
const st=await pg.evaluate(()=>{const r=document.getElementById("ncav-nome").getBoundingClientRect();const top=document.elementFromPoint(r.x+10,r.y+r.height/2);return {cli:document.getElementById("ncav-cliente").value,dichi:document.getElementById("ncav-dichi-box").style.display,sopra:!!top&&top.id==="ncav-nome"}});
ok(await aperta("modal-nuovo-cavallo")&&await aperta("modal-edit-cliente"),"Nuovo cavallo aperto sopra Modifica");
ok(st.cli==="dc-s1"&&st.dichi==="block"&&st.sopra,"scuderia già scelta, «Di chi è?» visibile, finestra davanti "+JSON.stringify(st));
await pg.screenshot({path:SP+"aggcav.png"});
await pg.fill("#ncav-nome","Tornado");
await pg.click("#modal-nuovo-cavallo .btn-primary");await pg.waitForTimeout(1500);
ok(!(await aperta("modal-nuovo-cavallo"))&&await aperta("modal-edit-cliente"),"salvato: resta aperta Modifica");
ok(/Tornado/.test(await pg.evaluate(()=>document.getElementById("edit-cliente-cavalli").innerText)),"elenco di Modifica aggiornato");
// 2) «Di chi è?» un cliente privato
await pg.click("#modal-edit-cliente >> text=+ Aggiungi cavallo");await pg.waitForTimeout(600);
await pg.fill("#ncav-nome","Pegaso");await pg.selectOption("#ncav-dichi","dc-1");
await pg.click("#modal-nuovo-cavallo .btn-primary");await pg.waitForTimeout(1500);
const peg=await pg.evaluate(()=>demoState.cavalliClientiMascalcia.filter(c=>c.nome==="Pegaso").map(c=>c.cliente_mascalcia_id+"@"+(c.ubicazione_cliente_id||"")).join(","));
ok(/^dc-1@dc-s1$/.test(peg),"Pegaso di Marco Bianchi, sta nella scuderia: "+peg);
await pg.evaluate(()=>closeModal("modal-edit-cliente"));await pg.waitForTimeout(300);
// 3) dal riquadro «+ Aggiungi cavallo» della scheda
await pg.evaluate(()=>aggiungiCavalloDaScheda());await pg.waitForTimeout(600);
ok(await aperta("modal-nuovo-cavallo")&&!(await aperta("modal-edit-cliente"))&&(await pg.evaluate(()=>document.getElementById("ncav-cliente").value))==="dc-s1","scheda: apre Nuovo cavallo con la scuderia scelta");
await pg.fill("#ncav-nome","Zefiro");await pg.click("#modal-nuovo-cavallo .btn-primary");await pg.waitForTimeout(1800);
ok(/Zefiro/.test(await pg.evaluate(()=>document.getElementById("clienti-detail-view").innerText)),"scheda aggiornata con Zefiro");
// 4) dalla cartella Cavalli: nessun cliente scelto
await pg.evaluate(()=>apriNuovoCavalloCartella());await pg.waitForTimeout(400);
ok((await pg.evaluate(()=>document.getElementById("ncav-cliente").value))==="","cartella: cliente da scegliere");
console.log("errori:",err);await b.close();})();
