// Equo App · allenatore · modulo "barra-e-pagine-del-trainer" (moduli ES, costruiti con Vite in ruoli/allenatore/costruito.js)
import { DEMO, IC, TR, isTr } from "./00-strumenti.js";
import { pagina } from "./02-home.js";
 // ----- barra, «+» e pagine del trainer
 function navTr(){
  var nav=document.getElementById("bottom-nav-pro");if(!nav||!isTr()||nav.dataset.alt==="istr2")return;
  nav.innerHTML='<button class="nav-btn" data-page="pro-home" onclick="showPage(\'pro-home\')"><span class="icon"><svg><use href="#i-home"/></svg></span><small>Home</small></button>'+
   '<button class="nav-btn" data-page="tr-sedute" onclick="showPage(\'tr-sedute\')"><span class="icon hm-ico">'+IC.film.replace("<svg","<svg class=\"hm-svg\"")+'</span><small>Sedute</small></button>'+
   '<button class="nav-btn nav-hammer" id="nav-hammer" onclick="openAiSheet()" aria-label="Ares, agente AI"><span class="hm-ham"><i class="hm-ham-dot"></i></span><small>Ares</small></button>'+
   '<button class="nav-btn" data-page="pro-inbox" onclick="showPage(\'pro-inbox\'); loadColleghiList();"><span class="icon hm-ico">'+HM_IC.inbox+'</span><small>Messaggi</small><span class="inbox-nav-badge" id="inbox-nav-badge" style="display:none"></span></button>'+
   '<button class="nav-btn" data-page="tr-agenda" onclick="showPage(\'tr-agenda\')"><span class="icon hm-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="hm-svg"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg></span><small>Agenda</small></button>';
  nav.dataset.alt="istr2";delete nav.dataset.man;
  var pg=typeof plPagina==="function"?plPagina():"";nav.querySelectorAll(".nav-btn[data-page]").forEach(function(b){b.classList.toggle("active",b.dataset.page===pg);});
 }
 registraPerRuolo("plNavAltri","istr",function(){navTr();});
 estendiPrima("plNavAltri",function(){if(isTr())return;var n=document.getElementById("bottom-nav-pro");if(n&&n.dataset.alt==="istr2"){delete n.dataset.alt;}});
 if(typeof PL_TONI!=="undefined")PL_TONI.istr={"pro-home":1,"tr-sedute":2,"pro-inbox":4,"tr-agenda":5,"tr-cavalli":5};
 estendiDopo("plCostruisciMenu",function(){if(isTr())return;try{if(typeof plRuolo==="function"&&plRuolo()==="owner"){var mm=document.getElementById("hm-menu-piu");if(mm)mm.insertAdjacentHTML("beforeend",plSez("Allenamento",[plTile(IC.film.replace("<svg","<svg class=\"hm-svg\""),"I miei istruttori","trCollOwner()")]));}}catch(e){}});
 registraPerRuolo("plCostruisciMenu","istr",function(){
  var m=document.getElementById("hm-menu-piu");if(!m)return;
  m.innerHTML=plSez("Crea subito",[plTile(IC.film.replace("<svg","<svg class=\"hm-svg\""),"Nuova seduta","trNuova()",1),plTile(HM_IC.ferro,"Cavallo seguito","trNuovoCavallo()",1),plTile('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="hm-svg"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',"Nuova lezione","trLezForm()",1)])+
   plSez("Vai a",[plTile(HM_IC.ferro,"Cavalli seguiti","showPage('tr-cavalli')"),plTile(HM_IC.inbox,"Messaggi","showPage('pro-inbox'); loadColleghiList();"),plTile(HM_IC.qr,"Il mio codice","trMioCodice()"),plTile(HM_IC.aiuto,"Serve aiuto?","apriTicketAssistenza()")]);
  m.classList.add("pl-menu");
 });
 quandoApriPagina(function(p){
  try{
   if(isTr()){ if(p==="pro-home")trRenderHome(); else if(p==="tr-sedute")trRenderSedute(); else if(p==="tr-cavalli")trRenderCavalli(); else if(p==="tr-agenda")trRenderAgenda(); else if(p==="pro-inbox")setTimeout(function(){try{renderChatCartelle();}catch(e){}},60); }
   else if(p==="home"&&typeof trOwnerCard==="function")trOwnerCard(true);
  }catch(e){console.error(e);}
 });
 // Ares: l'immagine al centro (stile come Galeno/Hammer)
 document.addEventListener("DOMContentLoaded",function(){["tr-sedute","tr-cavalli","tr-agenda"].forEach(pagina);});
  /* ===== AGENDA LEZIONI + CHAT CON I PROPRIETARI (17/10/2026) ===== */
 var T2={lez:[],week:null,sel:null,msgs:{},cur:null,poll:null,loadedL:false,sed:{},lezC:{},form:{dur:45,tipo:"lezione",id:null},lastFetch:0,dm:{},dl:false};
 var GG=["Dom","Lun","Mar","Mer","Gio","Ven","Sab"],MESI=["gennaio","febbraio","marzo","aprile","maggio","giugno","luglio","agosto","settembre","ottobre","novembre","dicembre"];
 var TIPI={lezione:"Lezione",piano:"Lavoro in piano",salto:"Salto",passeggiata:"Passeggiata",altro:"Altro"};
 var STL={solo_tua:["Solo tua","so"],proposta:["In attesa","pr"],confermata:["Confermata",""],altro_orario:["Chiede altro orario","pr"],annullata:["Annullata","an"]};
 function iso(d){var m=d.getMonth()+1,g=d.getDate();return d.getFullYear()+"-"+(m<10?"0":"")+m+"-"+(g<10?"0":"")+g;}
 function pIso(s){var p=String(s).split("-");return new Date(+p[0],+p[1]-1,+p[2]);}
 function lun(d){var x=new Date(d.getFullYear(),d.getMonth(),d.getDate()),w=(x.getDay()+6)%7;x.setDate(x.getDate()-w);return x;}
 function hh(t){return String(t||"").slice(0,5);}
 function fineOra(o,m){var p=hh(o).split(":"),t=(+p[0])*60+(+p[1])+(m||0);return String(Math.floor(t/60)%24).padStart(2,"0")+":"+String(t%60).padStart(2,"0");}
 function dataLunga(s){var d=pIso(s);return GG[d.getDay()]+" "+d.getDate()+" "+MESI[d.getMonth()].slice(0,3);}
 function iniz(n){return String(n||"?").trim().split(/\s+/).slice(0,2).map(function(x){return x.charAt(0).toUpperCase();}).join("");}
 function collT2(){return (TR.coll||[]).filter(function(x){return x.mio_ruolo==="trainer";});}
 function collCav(cv){return cv&&cv.horse_id?collT2().find(function(x){return x.horse_id===cv.horse_id&&x.stato==="attivo";}):null;}
 function collId(id,ruolo){var l=ruolo==="owner"?(TR.collO||[]):(TR.coll||[]);return l.find(function(x){return x.id===id;});}
 function demoSeed(){
  if(T2.dl)return;T2.dl=true;var oggi=new Date(),dom=new Date();dom.setDate(dom.getDate()+1);
  T2.lez=[{id:"dl1",trainer_id:"demo-user",cavallo_id:"dc1",horse_id:"h1",collegamento_id:"k1",cavallo_nome:"Aurora",tipo:"lezione",data:iso(oggi),ora:"09:00",durata_min:45,luogo:"Maneggio Blu",ripeti:"settimanale",stato:"confermata",note:""},
   {id:"dl2",trainer_id:"demo-user",cavallo_id:"dc2",horse_id:"h2",collegamento_id:null,cavallo_nome:"Rio",tipo:"piano",data:iso(oggi),ora:"11:30",durata_min:45,luogo:"",ripeti:"mai",stato:"solo_tua",note:""},
   {id:"dl3",trainer_id:"demo-user",cavallo_id:"dc3",horse_id:null,collegamento_id:null,cavallo_nome:"Fiamma",tipo:"salto",data:iso(dom),ora:"15:00",durata_min:60,luogo:"",ripeti:"mai",stato:"solo_tua",note:""}];
  T2.dm={k1:[{id:"m1",collegamento_id:"k1",mittente_id:"demo-user",tipo:"testo",testo:"Ciao Giulia, ti ho mandato la seduta di ieri.",letto:true,created_at:new Date(Date.now()-3600e3).toISOString()},{id:"m2",collegamento_id:"k1",mittente_id:"altro",tipo:"testo",testo:"Grazie! Sabato alle 9 va benissimo.",letto:false,created_at:new Date().toISOString()}]};
 }
 async function caricaLez(){
  if(DEMO()){demoSeed();T2.loadedL=true;return;}
  var d=new Date();d.setDate(d.getDate()-14);
  var r=await sb.from("trainer_lezioni").select("*").eq("trainer_id",currentUser.id).neq("stato","annullata").gte("data",iso(d)).order("data").order("ora").limit(400);
  T2.lez=r.data||[];T2.loadedL=true;
 }
 function proprDi(l){var c=l.collegamento_id?collId(l.collegamento_id,"trainer"):null;return c?c.proprietario:"";}
 function cavDi(l){return TR.cavalli.find(function(c){return c.id===l.cavallo_id;});}
 function chipL(s){var t=STL[s]||["",""];return '<span class="tr-chip '+(s==="confermata"?"i":s==="annullata"?"n":s==="solo_tua"?"s":"b")+'">'+t[0]+'</span>';}

export { GG, MESI, T2, TIPI, caricaLez, chipL, collCav, collId, collT2, dataLunga, demoSeed, fineOra, hh, iniz, iso, lun, pIso, proprDi };
