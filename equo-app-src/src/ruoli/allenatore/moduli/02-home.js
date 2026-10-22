// Equo App · allenatore · modulo "home" (moduli ES, costruiti con Vite in ruoli/allenatore/costruito.js)
import { TR, esc, q } from "./00-strumenti.js";
import { carica, premium, righe, slotHtml } from "./01-dati.js";
 // ----- Home
 function pagina(id){
  var el=q("page-"+id);if(el)return el;
  var home=q("page-pro-home");el=document.createElement("div");el.className="page-content";el.id="page-"+id;home.parentNode.insertBefore(el,home.nextSibling);return el;
 }
 window.trRenderHome=async function(){ await trRenderHomeBase(); await eseguiEstensioni(estensioniDopo,"trRenderHome"); };
 async function trRenderHomeBase(){
  var home=q("page-pro-home");if(!home)return;
  var box=q("tr-home");if(!box){box=document.createElement("div");box.id="tr-home";home.appendChild(box);}
  if(!TR.caricato){box.innerHTML='<div class="loading"><div class="spinner"></div></div>';await carica();}
  var nome=(currentUser&&(currentUser.fullName||currentUser.nome||currentUser.full_name))||"";
  var ora=new Date().getHours(),sal=ora<13?"Buongiorno":ora<18?"Buon pomeriggio":"Buonasera";
  var rec=TR.sedute.slice(0,3);
  box.innerHTML='<div class="tr-h">'+sal+(nome?', '+esc(String(nome).split(" ")[0]):'')+'</div><div class="tr-sub">'+new Date().toLocaleDateString("it-IT",{weekday:"long",day:"numeric",month:"long"})+'</div>'+
   '<div class="tr-cta"><div><b>Nuova seduta</b><span>Filma o carica il video del lavoro</span></div><div class="bt"><button class="tr-btn" onclick="trNuova()">Filma / Carica</button></div></div>'+
   '<div id="tr-conferme"></div>'+slotHtml()+
   '<div class="tr-card"><h4><span>Il tuo codice allenatore</span><button onclick="trMioCodice()">Mostra</button></h4><div class="muted" style="font-size:12.5px;line-height:1.5">Dallo ai proprietari dei cavalli che alleni: lo inseriscono in «I miei istruttori» e tu accetti il collegamento.</div></div>'+
   '<div class="tr-card"><h4><span>Sedute recenti</span><button onclick="showPage(\'tr-sedute\')">Vedi tutte</button></h4>'+righe(rec)+'</div>'+
   '<div class="tr-card"><h4><span>Cavalli seguiti</span><button onclick="showPage(\'tr-cavalli\')">'+TR.cavalli.length+(premium()?'':' di 10')+' ›</button></h4><div class="muted" style="font-size:12.5px">'+(TR.cavalli.length?TR.cavalli.slice(0,4).map(function(c){return esc(c.nome);}).join(", "):'Aggiungi i cavalli che alleni per collegare le sedute.')+'</div></div>';
  if(typeof caricaConfermePro==="function")caricaConfermePro(true,"tr-conferme");
 };

export { pagina };
