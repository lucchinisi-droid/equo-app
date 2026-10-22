 // ----- Sedute
 window.trRenderSedute=async function(){
  var p=pagina("tr-sedute");if(!TR.caricato)await carica();
  p.innerHTML='<div class="tr-h" style="display:flex;justify-content:space-between;align-items:center"><span>Sedute</span><button class="tr-btn" onclick="trNuova()">+ Nuova</button></div><div class="tr-sub">Il lavoro con i tuoi cavalli, video e analisi.</div>'+slotHtml()+'<div class="tr-card">'+righe(TR.sedute)+'</div>';
 };
