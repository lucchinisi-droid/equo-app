// 30/10/2026: all'ingresso del maniscalco non deve comparire la Home vecchia mentre arrivano i dati
const path=require("path");const {chromium}=require("playwright");
const APP=path.resolve(__dirname,"..","index.html");
const SUPA=path.join(path.dirname(require.resolve("@supabase/supabase-js/package.json")),"dist","umd","supabase.js");
(async()=>{const b=await chromium.launch({args:["--allow-file-access-from-files"]});
const pg=await (await b.newContext({viewport:{width:390,height:844}})).newPage();
const err=[];pg.on("pageerror",e=>err.push(String(e.message)));
await pg.route("**/*",r=>{const u=r.request().url();if(u.includes("supabase-js"))return r.fulfill({path:SUPA,contentType:"application/javascript"});if(u.startsWith("file://")||u.startsWith("data:"))return r.continue();return r.abort();});
await pg.goto("file://"+APP);await pg.waitForTimeout(1200);
await pg.evaluate(()=>startDemo());await pg.waitForTimeout(600);
const ok=(c,m)=>console.log((c?"OK  ":"ERR ")+m);
const stato=()=>pg.evaluate(()=>{const vis=id=>{const e=document.getElementById(id);return !!e&&e.offsetParent!==null&&getComputedStyle(e).display!=="none"};
  return {homeMan:document.body.classList.contains("home-man"),hm:vis("hm"),vecchiaCert:vis("certified-card"),vecchiaInc:vis("home-pro-incassi-mese"),vecchiApp:vis("home-pro-appuntamenti"),nav:document.getElementById("bottom-nav-pro").innerText.replace(/\s+/g," ").trim()}});
for(const ruolo of ["maniscalco","veterinario"]){
  // dati lenti come su un telefono in 4G: i clienti arrivano dopo 2 secondi
  await pg.evaluate(()=>{ if(!window.__lento){ window.__lento=true; const o=loadClientiMascalcia; window.loadClientiMascalcia=async(...a)=>{ await new Promise(r=>setTimeout(r,2000)); return o(...a); }; } });
  await pg.evaluate(r=>{currentUser.ruolo=r; enterApp(r);},ruolo);
  await pg.waitForTimeout(500);
  const s=await stato(); console.log(ruolo,"dopo 0,5 s:",JSON.stringify(s));
  if(ruolo==="maniscalco") ok(s.homeMan&&s.hm&&!s.vecchiaInc&&!s.vecchiApp&&/Hammer/i.test(s.nav),"maniscalco: subito Home nuova e barra con Hammer");
  else ok(!s.vecchiaInc&&!s.vecchiApp&&!s.homeMan,"veterinario: niente Home vecchia né del maniscalco");
  await pg.waitForTimeout(2600);
  const f=await stato(); console.log(ruolo,"alla fine:",JSON.stringify(f));
  if(ruolo==="maniscalco") ok(f.homeMan&&f.hm&&/Hammer/i.test(f.nav),"maniscalco: Home nuova anche alla fine");
}
console.log("errori:",err);await b.close();})();
