const path=require("path");const {chromium}=require("playwright");
const APP=path.resolve(__dirname,"..","index.html");
const SUPA=path.join(path.dirname(require.resolve("@supabase/supabase-js/package.json")),"dist","umd","supabase.js");
(async()=>{const b=await chromium.launch({args:["--allow-file-access-from-files"]});
const ctx=await b.newContext({viewport:{width:390,height:844},userAgent:"Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Mobile Safari/537.36",hasTouch:true});
const pg=await ctx.newPage();const err=[];pg.on("pageerror",e=>err.push(String(e.message)));
await pg.route("**/*",r=>{const u=r.request().url();if(u.includes("supabase-js"))return r.fulfill({path:SUPA,contentType:"application/javascript"});if(u.startsWith("file://")||u.startsWith("data:"))return r.continue();return r.abort();});
await pg.goto("file://"+APP);await pg.waitForTimeout(1200);
await pg.evaluate(()=>startDemo());await pg.waitForTimeout(600);
const pagina=()=>pg.evaluate(()=>document.querySelector(".page-content.active")?.id);
const indietro=async()=>{await pg.mouse.click(200,400);await pg.waitForTimeout(150);await pg.goBack().catch(()=>{});await pg.waitForTimeout(700);};
for(const primario of ["maniscalco","proprietario"]){
  await pg.evaluate(async p=>{currentUser.ruolo=p;currentUser.ruoloSecondario=p==="maniscalco"?"proprietario":"maniscalco";await enterApp("maniscalco");},primario);await pg.waitForTimeout(2200);
  await pg.evaluate(()=>document.querySelectorAll("[id*=cookie],.modal-overlay.active").forEach(e=>e.classList?e.classList.remove("active"):0));
  for(const p of ["pro-agenda","pro-clienti","pro-incassi","pro-inbox"]){
    await pg.evaluate(p=>showPage(p),p);await pg.waitForTimeout(400);
    await indietro();
    console.log(`ruolo principale ${primario} · da ${p} → ${await pagina()} · barra maniscalco visibile: ${await pg.isVisible("#bottom-nav-pro")} · barra proprietario: ${await pg.isVisible("#bottom-nav-owner")}`);
  }
  // scheda cliente → elenco
  await pg.evaluate(async()=>{showPage("pro-clienti");await openClienteDetail(clientiMascalcia[0].id);});await pg.waitForTimeout(800);
  await indietro();
  console.log(`  scheda cliente → ${await pagina()} · scheda ancora aperta: ${await pg.isVisible("#clienti-detail-view")}`);
}
console.log("errori:",err);await b.close();})();
