// Equo App · allenatore · modulo "vista-proprietario-riceve-e-risponde" (moduli ES, costruiti con Vite in ruoli/allenatore/costruito.js)
import { TR } from "./stato.js";
import { DEMO, IC, esc, isTr, q } from "./00-strumenti.js";
import { trOwnerCollCard } from "./09-lato-proprietario-richieste-di-collegame.js";
 // ----- vista proprietario (riceve e risponde)
 window.trOwnerCard=async function(forza){ var r=await trOwnerCardBase(forza); await eseguiEstensioni(estensioniDopo,"trOwnerCard",[forza]); return r; };
 async function trOwnerCardBase(forza){
  if(isTr()||DEMO())return;
  try{
   if(TR.ricevuteOk&&!forza)return;
   var r=await sb.from("sedute_condivisioni").select("seduta_id,visto_il,sedute(id,titolo,inviata_il,horse_id,stato,sedute_media(id,path,durata_s))").eq("user_id",currentUser.id).order("created_at",{ascending:false}).limit(20);
   var l=(r.data||[]).filter(function(x){return x.sedute;});TR.ricevuteOk=true;
   TR.ricevute=l.map(function(x){return Object.assign({},x.sedute,{_nuova:!x.visto_il});});
   var box=q("hv3-sopra");if(!box)return;var old=q("tr-own");if(old)old.remove();
   trOwnerCollCard();if(!TR.ricevute.length)return;
   var nuove=TR.ricevute.filter(function(s){return s._nuova;}).length;
   var d=document.createElement("div");d.id="tr-own";d.className="tr-card";
   d.innerHTML='<h4><span>Sedute del tuo trainer'+(nuove?' · '+nuove+' nuove':'')+'</span></h4>'+TR.ricevute.slice(0,3).map(function(s){return '<div class="tr-riga" onclick="trApri(\''+s.id+'\',true)"><div class="th">'+IC.film+'</div><div><b>'+esc(s.titolo)+'</b><small>'+formatDate(s.inviata_il||s.created_at)+'</small></div>'+(s._nuova?'<span class="tr-chip n">Nuova</span>':'')+'</div>';}).join("");
   box.appendChild(d);
  }catch(e){console.error(e);}
 };

