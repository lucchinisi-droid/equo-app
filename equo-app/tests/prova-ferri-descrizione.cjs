// 03/11/2026: la descrizione del lavoro (resoconto, conto, PDF, agenda) dice anche il ferro correttivo
const path=require("path");const {chromium}=require("playwright");
const APP=path.resolve(__dirname,"..","index.html");
const SUPA=path.join(path.dirname(require.resolve("@supabase/supabase-js/package.json")),"dist","umd","supabase.js");
(async()=>{const b=await chromium.launch({args:["--allow-file-access-from-files"]});
const pg=await (await b.newContext({viewport:{width:390,height:844}})).newPage();
const err=[];pg.on("pageerror",e=>err.push(String(e.message)));
await pg.route("**/*",r=>{const u=r.request().url();if(u.includes("supabase-js"))return r.fulfill({path:SUPA,contentType:"application/javascript"});if(u.startsWith("file://")||u.startsWith("data:"))return r.continue();return r.abort();});
await pg.goto("file://"+APP);await pg.waitForTimeout(1200);
await pg.evaluate(()=>startDemo());await pg.waitForTimeout(800);
await pg.evaluate(async()=>{currentUser.ruolo="maniscalco";await enterApp("maniscalco");});await pg.waitForTimeout(2000);
const ok=(c,m)=>console.log((c?"OK  ":"ERR ")+m);
const r=await pg.evaluate(()=>({
  base:agDescrizioneTipo({tipo_ferratura:"ferratura",quantita_ferri:4}),
  corr:agDescrizioneTipo({tipo_ferratura:"ferratura",quantita_ferri:4,ferro_tipo:"corr_davanti",ferro_note:"Binda larga in punta, Pad"}),
  std:agDescrizioneTipo({tipo_ferratura:"ferratura",quantita_ferri:4,ferro_tipo:"standard"}),
  mezza:agDescrizioneTipo({tipo_ferratura:"mezza_ferratura",quantita_ferri:2,ferro_tipo:"correttivo"}),
  par:agDescrizioneTipo({tipo_ferratura:"pareggio"})}));
console.log(r);
ok(r.base==="Ferratura · 4 ferri","ferratura semplice");
ok(/4 ferri · correttivo davanti \(Binda larga in punta, Pad\)$/.test(r.corr),"correttivo davanti con dettagli");
ok(r.std==="Ferratura · 4 ferri","standard: niente in più");
ok(/2 ferri · correttivo$/.test(r.mezza),"mezza correttivo");
ok(!/ferri/.test(r.par),"pareggio senza ferri");
console.log("errori:",err);await b.close();})();
