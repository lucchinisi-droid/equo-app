/* ---- aggancio a Home e navigazione ---- */
(function(){
  estendiDopo("renderHome", function(){ diarioHomeRender(); });
  quandoApriPagina(function(p){ if(p === "diario") diarioCarica(); });
  estendiDopo("openHorseDetail", function(id){ albumRender(id); });
})();

