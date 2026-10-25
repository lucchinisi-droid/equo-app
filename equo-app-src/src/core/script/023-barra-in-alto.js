/* ---------- BARRA IN ALTO UNICA (26/10/2026) ----------
   profilo (foto o iniziali, pallino arancione se ci sono messaggi non letti) · Cerca · meteo di oggi (al tocco il dettaglio
   ora per ora e i 7 giorni) · quarta icona: proprietario = Equo Card (card dei cavalli), professionisti = Card (Equo Pass ed Equo CV). */
const TB_ICONA_CARD = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="2.5" y="5" width="19" height="14" rx="3"/><rect x="2.5" y="8.6" width="19" height="2.6" fill="#000" opacity=".35"/><rect x="6" y="14" width="6" height="1.8" rx=".9" fill="#000" opacity=".35"/></svg>';
const TB_ICONA_PASS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="3.5" width="14" height="18" rx="2.5"/><path d="M9.5 3.5h5v2.6h-5z" fill="currentColor"/><circle cx="12" cy="11" r="2.4"/><path d="M8.3 17c.6-1.9 2-2.9 3.7-2.9s3.1 1 3.7 2.9"/></svg>';
function barraVistaPro(){ return !!(currentUser && currentUser.vistaAttiva && currentUser.vistaAttiva !== "proprietario"); }
function barraAggiornaVista(){
  const b = document.getElementById("topbar-card");
  if(!b) return;
  const pro = barraVistaPro();
  b.innerHTML = pro ? TB_ICONA_PASS : TB_ICONA_CARD;
  b.setAttribute("aria-label", pro ? "Card: Equo Pass ed Equo CV" : "Equo Card dei tuoi cavalli");
  barraMeteo();
  barraPallino();
}
function apriCardTopbar(){
  if(barraVistaPro()){ if(typeof apriCardPro === "function") return apriCardPro(); }
  else if(typeof apriEquoCard === "function") return apriEquoCard();
  showToast("In arrivo");
}
// meteo di oggi nella barra: stessa previsione e stessa posizione del riquadro che c'era in Home
function barraMeteo(forza){
  const el = document.getElementById("topbar-meteo");
  if(!el || typeof EquoMeteo === "undefined" || !currentUser) return;
  EquoMeteo.monta(el, {
    soloIcona: true,
    endpoint: "/.netlify/functions/meteo",
    token: async () => { try{ return (await sb.auth.getSession()).data.session?.access_token || ""; }catch(e){ return ""; } },
    posizione: typeof meteoPosizioneTelefono === "function" ? meteoPosizioneTelefono : async () => null,
  });
  if(forza) EquoMeteo.ricarica(el);
}
// pallino arancione sull'avatar: messaggi non letti
let barraPallinoTs = 0;
async function barraPallino(){
  const p = document.getElementById("tb-pallino");
  if(!p || !currentUser) return;
  if(Date.now() - barraPallinoTs < 20000) return;
  barraPallinoTs = Date.now();
  let n = 0;
  try{ n = DEMO_MODE ? 1 : Number(typeof computeChatUnreadTotal === "function" ? await computeChatUnreadTotal() : 0) || 0; }catch(e){ n = 0; }
  p.hidden = !n;
  p.title = n ? (n === 1 ? "1 messaggio non letto" : n + " messaggi non letti") : "";
}
document.addEventListener("visibilitychange", () => { if(document.visibilityState === "visible") try{ barraPallinoTs = 0; barraPallino(); barraMeteo(); }catch(e){} });
setInterval(() => { try{ if(document.visibilityState === "visible") barraPallino(); }catch(e){} }, 60000);
