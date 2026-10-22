
/* ---------- TASTO INDIETRO DI ANDROID ----------
   La freccia/il gesto «indietro» del telefono non fa più uscire dall'app di colpo:
   1) chiude la finestra o la chat aperta; 2) torna all'elenco o alla Home;
   3) in Home mostra «Premi di nuovo indietro per uscire»: solo il secondo indietro (entro 2,5 s) esce.
   Funziona con una voce «sentinella» nella cronologia, rimessa a ogni tocco (Chrome ignora le voci create senza un tocco). */
(function(){
  if(!/Android/i.test(navigator.userAgent)) return;
  let armato = false, avvisoAl = 0;
  const arma = () => {
    if(armato || Date.now() - avvisoAl < 2500) return;
    try{ history.pushState({ equoIndietro: 1 }, "", location.href); armato = true; } catch(e){}
  };
  ["click", "touchend", "keydown"].forEach(ev => addEventListener(ev, arma, { capture: true, passive: true }));
  const visibile = el => !!el && getComputedStyle(el).display !== "none";
  function overlayInCima(){
    const aperti = [...document.querySelectorAll(".modal-overlay.active, [id$='-overlay'].active")].filter(visibile);
    if(!aperti.length) return null;
    const z = el => parseInt(getComputedStyle(el).zIndex, 10) || 0;
    return aperti.reduce((a, b) => z(b) >= z(a) ? b : a);
  }
  function indietroDentroApp(){
    const ov = overlayInCima();
    if(ov){
      const speciale = (window.EQUO_INDIETRO_CHIUDI || {})[ov.id];
      if(speciale){ try{ speciale(); } catch(e){ console.warn("indietro:", e); } }
      else ov.dispatchEvent(new MouseEvent("click", { bubbles: true }));   // come un tocco fuori: chiude solo le finestre che si possono chiudere così
      return true;   // anche se la finestra è obbligatoria, l'indietro non fa uscire
    }
    try{ return !!(window.EQUO_INDIETRO_PAGINA && window.EQUO_INDIETRO_PAGINA()); } catch(e){ return false; }
  }
  addEventListener("popstate", () => {
    if(!armato) return;
    armato = false;
    if(indietroDentroApp()){ arma(); return; }
    avvisoAl = Date.now();
    try{ showToast("Premi di nuovo indietro per uscire"); } catch(e){}
  });
})();
