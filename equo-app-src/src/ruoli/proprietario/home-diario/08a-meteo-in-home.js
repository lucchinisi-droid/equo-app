
/* Meteo in Home: posizione del telefono (si chiede il permesso solo con un tocco; poi si usa l'ultima posizione nota) */
let meteoPosChiesta = false;
function meteoUltimaPos(){ try{ return JSON.parse(localStorage.getItem("equo-meteo-pos") || "null"); }catch(e){ return null; } }
async function meteoPosizioneTelefono(){
  if(DEMO_MODE) return { demo: true };
  if(!navigator.geolocation) return { messaggio: { testo: "Questo dispositivo non fornisce la posizione per il meteo.", icona: "fa-location-crosshairs" } };
  const ult = meteoUltimaPos();
  let stato = "prompt";
  try{ stato = (await navigator.permissions.query({ name: "geolocation" })).state; }catch(e){ stato = ult ? "granted" : "prompt"; }
  if(stato === "denied") return ult || { messaggio: { testo: "Posizione non consentita: attivala nelle impostazioni del telefono per vedere il meteo.", icona: "fa-location-dot" } };
  if(stato === "prompt" && !meteoPosChiesta){
    if(ult) return ult;
    return { messaggio: { testo: "Meteo dei prossimi 7 giorni:", link: "tocca per usare la tua posizione", icona: "fa-cloud-sun", azione: () => { meteoPosChiesta = true; meteoHome(true); } } };
  }
  const p = await new Promise(res => navigator.geolocation.getCurrentPosition(x => res(x), () => res(null), { enableHighAccuracy: false, timeout: 10000, maximumAge: 30 * 60e3 }));
  if(!p) return ult || { messaggio: { testo: "Non riesco a leggere la posizione.", link: "Riprova", icona: "fa-location-dot", azione: () => { meteoPosChiesta = true; meteoHome(true); } } };
  const pos = { lat: Math.round(p.coords.latitude * 100) / 100, lon: Math.round(p.coords.longitude * 100) / 100 };
  try{ localStorage.setItem("equo-meteo-pos", JSON.stringify(pos)); }catch(e){}
  return pos;
}
function meteoHome(forza){
  if(typeof EquoMeteo === "undefined" || !currentUser) return;
  const pro = document.getElementById("page-pro-home")?.classList.contains("active");
  const el = document.getElementById(pro ? (document.body.classList.contains("home-man") ? "hm-meteo" : "meteo-pro") : "meteo-owner");
  if(!el) return;
  EquoMeteo.monta(el, {
    endpoint: "/.netlify/functions/meteo",
    token: async () => { try{ return (await sb.auth.getSession()).data.session?.access_token || ""; }catch(e){ return ""; } },
    posizione: meteoPosizioneTelefono,
  });
  if(forza) EquoMeteo.ricarica(el);
}
document.addEventListener("visibilitychange", () => { if(document.visibilityState === "visible") try{ meteoHome(); }catch(e){} });

