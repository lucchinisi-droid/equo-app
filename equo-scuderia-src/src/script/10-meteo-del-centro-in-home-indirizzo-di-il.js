
/* Meteo del centro in Home (indirizzo di «Il tuo Centro») */
function meteoScud(forza){
  const el = document.getElementById("meteo-scud");
  if(!el || typeof EquoMeteo === "undefined") return;
  EquoMeteo.monta(el, {
    endpoint: "/api/meteo",
    token: async () => { try{ return (await sb.auth.getSession()).data.session?.access_token || ""; }catch(e){ return ""; } },
    posizione: async () => {
      if(DEMO_MODE) return { demo: true };
      const c = currentCentro || {};
      if(!c.indirizzo && !c.citta) return { messaggio: { testo: "Aggiungi l'indirizzo del centro per vedere il meteo:", link: "Il tuo Centro", icona: "fa-location-dot", azione: () => showModule("centro") } };
      return { indirizzo: c.indirizzo || "", citta: [c.citta, c.provincia].filter(Boolean).join(", "), luogo: c.citta || c.nome || "" };
    },
    nonTrovato: { testo: "Indirizzo del centro non trovato per il meteo:", link: "controllalo", icona: "fa-location-dot", azione: () => showModule("centro") },
  });
  if(forza) EquoMeteo.ricarica(el);
}
document.addEventListener("visibilitychange", () => { if(document.visibilityState === "visible" && document.getElementById("module-home")?.style.display !== "none") try{ meteoScud(); }catch(e){} });
