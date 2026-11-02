// Equo App · veterinario · Galeno nella chat dell'assistente (2/11/2026)
// Il server sceglie Galeno per chi ha il profilo veterinario (netlify/functions/agent.js); qui solo testata, benvenuto e segnaposto,
// come fa Ares per gli istruttori (ruoli/allenatore/script/14-ares-js.js).

const GALENO_BENVENUTO = 'Ciao, sono <strong>Galeno</strong>, l\'agente di Equo per i veterinari. Cerco nelle schede verificate (clinica, prevenzione, normativa italiana ed europea) e ti dico sempre la fonte; ti spiego anche come usare l\'app. Prova <em>"criteri SIRS nel cavallo adulto"</em>, <em>"cosa faccio prima di trattare un cavallo DPA?"</em> o <em>"come aggiungo un appuntamento?"</em>. Non prescrivo e non do dosi: la decisione clinica resta tua.';

function galenoTestata(){
  if(typeof eVeterinario !== "function" || !eVeterinario()) return;
  const t = document.getElementById("ai-sheet-titolo"); if(t) t.textContent = "Galeno · veterinaria";
  const b = document.getElementById("ai-benvenuto"); if(b) b.innerHTML = GALENO_BENVENUTO;
  const i = document.getElementById("chat-input"); if(i) i.placeholder = "Chiedi a Galeno…";
}

try{ estendiDopo("aggiornaTestataAi", function(){ try{ galenoTestata(); }catch(e){ console.error("galeno:", e); } }); }catch(e){ console.error("galeno:", e); }

export { galenoTestata };
