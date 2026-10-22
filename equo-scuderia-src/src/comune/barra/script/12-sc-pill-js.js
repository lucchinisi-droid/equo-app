
(function(){
 var VOCI=[["centro","fa-house-chimney","Il tuo Centro"],["pacchetti","fa-ticket","Pacchetti"],["magazzino","fa-boxes-stacked","Magazzino"],["statistiche","fa-chart-line","Statistiche"],["professionisti","fa-user-doctor","Professionisti"],["groom","fa-id-badge","Groom"],["ai","fa-wand-magic-sparkles","Agenti AI"],["store","fa-store","Store","SOON"],["fatturazione","fa-file-invoice","SDI","SOON"]];
 window.scPiu=function(forza){
  var m=document.getElementById("sc-menu"),v=document.getElementById("sc-velo"),b=document.getElementById("sc-piu");
  var apri=typeof forza==="boolean"?forza:!m.classList.contains("aperto");
  if(apri){
   m.innerHTML=VOCI.filter(function(x){return typeof scModuloOk!=="function"||["store","fatturazione"].indexOf(x[0])>=0||scModuloOk(x[0]);}).map(function(x){
    return '<button onclick="scPiu(false);showModule(\''+x[0]+'\')"><i class="fa-solid '+x[1]+'"></i>'+x[2]+(x[3]?'<small>'+x[3]+'</small>':'')+'</button>';}).join("");
  }
  m.classList.toggle("aperto",apri);v.classList.toggle("aperto",apri);b.classList.toggle("aperto",apri);
 };
 function agg(key){
  document.querySelectorAll("#sc-pill button[data-m]").forEach(function(b){b.classList.toggle("on",b.dataset.m===key);});
  var n=document.getElementById("chat-nav-unread-badge"),d=document.getElementById("sc-pill-dot");
  if(d)d.classList.toggle("on",!!(n&&parseInt(n.textContent,10)>0));
 }
 quandoApriSezione(function(key){agg(key);scPiu(false);});
 setInterval(function(){var a=document.querySelector(".nav-item.active");agg(a&&a.dataset.module);},3000);
 // card Athena nella sidebar desktop
 var nav=document.querySelector(".sidebar-nav");
 if(nav&&!document.getElementById("sc-side-ath")){
  var b=document.createElement("button");b.id="sc-side-ath";b.className="sc-side-ath";
  b.innerHTML='<i></i><span><b>Athena</b><small>La tua segreteria</small></span>';b.onclick=function(){apriAthena();};
  nav.parentNode.insertBefore(b,nav);
 }
 // pagina Agenti AI: icone nuove
 var oldR=window.renderModuloAgenti;
 window.renderModuloAgenti=function(){
  oldR.apply(this,arguments);
  var img={athena:"athena",merlino:"merlino",ermes:"ermes",galeno:"galeno",hammer:"hammer",ares:"ares"};
  document.querySelectorAll("#module-ai .ag-card").forEach(function(c){
   var nome=(c.querySelector(".top div:last-child div")||{}).textContent||"";var k=nome.trim().toLowerCase();
   if(img[k]){var av=c.querySelector(".av");av.className="av img";av.innerHTML="";av.style.backgroundImage="url(assets/agenti/"+img[k]+".webp)";}
   if(k==="ermes"){var st=c.querySelector(".stato");if(st){st.textContent="Add-on 9 € + IVA al mese · presto disponibile";}}
   if(k==="merlino"){var p=c.querySelector("p");if(p&&p.textContent.indexOf("Radar")<0)p.insertAdjacentHTML("afterend",'<p style="font-size:12px"><b>Radar di Merlino</b>: ogni settimana ti dice cosa fanno i centri vicini.</p>');}
  });
 };
 agg("home");
})();
