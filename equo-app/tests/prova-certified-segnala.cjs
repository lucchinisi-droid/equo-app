// 30/10/2026: Equo Certified nel menu e nel banner dei professionisti; «Segnala un maneggio» e partner per il proprietario
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
const ok=(c,m)=>console.log((c?"OK  ":"ERR ")+m);
const aperta=id=>pg.evaluate(id=>document.getElementById(id).classList.contains("active"),id);
const davanti=sel=>pg.evaluate(sel=>{const e=document.querySelector(sel);if(!e)return false;const r=e.getBoundingClientRect();const t=document.elementFromPoint(r.x+r.width/2,r.y+Math.min(r.height/2,20));return !!t&&(t===e||e.contains(t))},sel);
// ---------- proprietario
await pg.evaluate(()=>{ (demoState.horses||[]).forEach(h=>delete h.stable_id); renderHome(); });await pg.waitForTimeout(500);
ok(/scuderia non è su Equo/.test(await pg.evaluate(()=>document.getElementById("home-segnala").innerText)),"Home proprietario: carta «La tua scuderia non è su Equo?»");
await pg.evaluate(()=>document.getElementById("home-segnala").scrollIntoView({block:"center"}));await pg.screenshot({path:SP+"cs-home-own.png"});
await pg.click("#home-segnala button");await pg.waitForTimeout(500);
ok(await aperta("modal-segnala-maneggio"),"tocco: apre Segnala un maneggio");
await pg.evaluate(()=>closeModal("modal-segnala-maneggio"));
await pg.evaluate(()=>{ demoState.horses[0].stable_id="st1"; renderHome(); });await pg.waitForTimeout(300);
ok((await pg.evaluate(()=>document.getElementById("home-segnala").innerText))==="","con un cavallo in scuderia su Equo la carta sparisce");
await pg.evaluate(()=>{ delete demoState.horses[0].stable_id; });
await pg.evaluate(()=>{ renderMenuDualRole(); openModal("modal-menu"); });await pg.waitForTimeout(600);
const own=await pg.evaluate(()=>({equo:getComputedStyle(document.getElementById("menu-owner-equo")).display,testo:document.getElementById("menu-owner-equo").innerText.replace(/\s+/g," "),pro:getComputedStyle(document.getElementById("menu-pro-section")).display}));
console.log(own);ok(own.equo!=="none"&&/Segnala un maneggio/.test(own.testo)&&/attività per cavalli e cavalieri/.test(own.testo)&&own.pro==="none","menu proprietario: sezione Equo");
await pg.evaluate(()=>document.getElementById("menu-owner-equo").scrollIntoView({block:"center"}));await pg.screenshot({path:SP+"cs-menu-own.png"});
await pg.click("#menu-owner-equo .menu-riga-big.oro");await pg.waitForTimeout(500);
ok(await aperta("modal-segnala-maneggio")&&!(await aperta("modal-menu")),"riga Segnala: chiude il menu e apre il modulo");
await pg.evaluate(()=>closeModal("modal-segnala-maneggio"));
// ---------- maniscalco
await pg.evaluate(async()=>{currentUser.ruolo="maniscalco";currentUser.certificazioneStato="nessuno";await enterApp("maniscalco");});await pg.waitForTimeout(2500);
const ban=await pg.evaluate(()=>[...document.querySelectorAll("#hm-slides .hm-slide")].map(s=>s.className+":"+s.innerText.replace(/\s+/g," ")));
console.log(ban);ok(/cert/.test(ban[0]||"")&&/Diventa Equo Certified/.test(ban[0]),"banner: primo riquadro Equo Certified");
await pg.screenshot({path:SP+"cs-home-man.png"});
await pg.click("#hm-slides .hm-slide.cert");await pg.waitForTimeout(500);
ok(await aperta("modal-certified")&&/Diventa Equo Certified/.test(await pg.evaluate(()=>document.getElementById("certified-card").innerText)),"tocco sul banner: foglio Equo Certified");
await pg.screenshot({path:SP+"cs-foglio.png"});
await pg.evaluate(()=>closeModal("modal-certified"));
await pg.evaluate(()=>{ renderMenuDualRole(); openModal("modal-menu"); });await pg.waitForTimeout(600);
const man=await pg.evaluate(()=>({riga:document.getElementById("menu-cert-row").innerText.replace(/\s+/g," "),equo:getComputedStyle(document.getElementById("menu-owner-equo")).display}));
console.log(man);ok(/Diventa Equo Certified/.test(man.riga)&&/passaggi fatti/.test(man.riga)&&man.equo==="none","menu professionista: riga Equo Certified, niente sezione proprietario");
await pg.screenshot({path:SP+"cs-menu-man.png"});
await pg.click("#menu-cert-row button");await pg.waitForTimeout(500);
ok(await aperta("modal-certified")&&await davanti("#certified-card"),"riga: foglio sopra il menu");
await pg.evaluate(()=>closeModal("modal-certified"));
for(const [st,re] of [["in_verifica",/in verifica/],["verificato",/Sei Equo Certified/],["respinto",/non approvata/]]){
  await pg.evaluate(s=>{currentUser.certificazioneStato=s;renderCertRiga();},st);
  ok(re.test(await pg.evaluate(()=>document.getElementById("menu-cert-row").innerText)),"stato "+st);
}
ok(!(await pg.$("#page-pro-home #certified-card")),"la carta non è più nella Home vecchia");
await pg.evaluate(()=>closeModal("modal-menu"));
// ---------- veterinario
await pg.evaluate(async()=>{currentUser.ruolo="veterinario";currentUser.certificazioneStato="nessuno";await enterApp("veterinario");});await pg.waitForTimeout(2000);
await pg.evaluate(()=>{ renderMenuDualRole(); openModal("modal-menu"); });await pg.waitForTimeout(500);
ok(/Diventa Equo Certified/.test(await pg.evaluate(()=>document.getElementById("menu-cert-row").innerText)),"veterinario: riga Equo Certified nel menu");
await pg.screenshot({path:SP+"cs-menu-vet.png"});
console.log("errori:",err);await b.close();})();
