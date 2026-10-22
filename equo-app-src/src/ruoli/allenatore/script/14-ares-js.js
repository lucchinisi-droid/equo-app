
/* Ares · agente degli istruttori/trainer: testata, benvenuto e segnaposto della chat */
(function(){
  estendiDopo("aggiornaTestataAi", function(){
    try{
      if(typeof plRuolo === "function" && plRuolo() === "istr"){
        var t = document.getElementById("ai-sheet-titolo"); if(t) t.textContent = "Ares · allenamento e sedute";
        var b = document.getElementById("ai-benvenuto");
        if(b) b.innerHTML = 'Ciao, sono <strong>Ares</strong> 🏇, l\'agente di Equo per istruttori e trainer. Ti aiuto a preparare una seduta, a decidere cosa annotare su un video e a spiegare l\'esercizio a chi ti guarda: prova <em>"come imposto una seduta sul galoppo?"</em> o <em>"cosa devo guardare nel video di oggi?"</em>. Le annotazioni le fai tu nell\'editor: io non invio nulla da solo.';
        var i = document.getElementById("chat-input"); if(i) i.placeholder = "Chiedi ad Ares…";
      }
    }catch(e){ console.error("ares-js:", e); }
  });
  try{ VERSIONI.ares = "1.0"; }catch(e){}
})();
