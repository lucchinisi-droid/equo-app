// Equo App · maniscalco · modulo (moduli ES, costruiti con Vite in ruoli/maniscalco/costruito.js)
/* ---------- «📍 Usa la mia posizione attuale» nell'indirizzo del cliente o della struttura (24/10/2026) ----------
   Il maniscalco è sul posto e non conosce la via: salva il punto dove si trova. Nel campo indirizzo va
   «Via Casilina, Colleferro (41.83412, 12.98765)» (via e comune SENZA numero civico, presi dalla funzione meteo);
   Naviga, meteo e «Sei arrivato» usano le coordinate esatte. */
function coordDaIndirizzo(t){
  const m = String(t || "").match(/(-?\d{1,2}\.\d{3,})\s*,\s*(-?\d{1,3}\.\d{3,})/);
  if(!m) return null;
  const lat = Number(m[1]), lon = Number(m[2]);
  return Math.abs(lat) <= 90 && Math.abs(lon) <= 180 ? { lat, lon } : null;
}
async function usaPosizioneQui(inputId, btn){
  const inp = document.getElementById(inputId);
  const nota = document.getElementById(inputId + "-pos-nota");
  const scrivi = (t, cls) => { if(nota){ nota.textContent = t; nota.className = "pos-nota" + (cls ? " " + cls : ""); } };
  if(!navigator.geolocation){ scrivi("Questo telefono non dà la posizione.", "male"); return; }
  if(btn) btn.disabled = true;
  scrivi("Cerco la posizione…");
  const pos = await new Promise(res => navigator.geolocation.getCurrentPosition(p => res(p.coords), e => res({ errore: e }), { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }));
  if(btn) btn.disabled = false;
  if(!pos || pos.errore){
    scrivi(pos?.errore?.code === 1 ? "Posizione non permessa: attivala nelle impostazioni del telefono per Equo." : "Posizione non trovata: riprova all'aperto.", "male");
    return;
  }
  const lat = pos.latitude.toFixed(5), lon = pos.longitude.toFixed(5), prec = Math.round(pos.accuracy || 0);
  let via = "";
  if(!DEMO_MODE){
    try{
      const tk = (await sb.auth.getSession()).data.session?.access_token || "";
      const r = await fetch("/.netlify/functions/meteo", { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + tk }, body: JSON.stringify({ azione: "via", lat: Number(lat), lon: Number(lon) }) });
      const d = r.ok ? await r.json() : {};
      via = [d.via, d.comune].filter(Boolean).join(", ");
    }catch(e){ via = ""; }
  }
  inp.value = (via ? via + " " : "📍 ") + `(${lat}, ${lon})`;
  inp.dispatchEvent(new Event("input", { bubbles: true }));
  if(prec > 100) scrivi(`Posizione salvata, ma la precisione è bassa (circa ${prec} m): se puoi, riprova all'aperto.`, "male");
  else scrivi(`Posizione salvata · precisione circa ${prec || "?"} m. Ricordati di salvare la scheda.`, "ok");
}

export { coordDaIndirizzo, usaPosizioneQui };
