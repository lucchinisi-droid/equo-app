// Equo App · allenatore · modulo "lato-proprietario-i-tuoi-istruttori-lezi" (moduli ES, costruiti con Vite in ruoli/allenatore/costruito.js)
import { DEMO, TR, esc, isTr, q } from "./00-strumenti.js";
import { pagina } from "./02-home.js";
import { ownerColl } from "./09-lato-proprietario-richieste-di-collegame.js";
import { TIPI, chipL, dataLunga, iniz } from "./10-barra-e-pagine-del-trainer.js";
 // ----- lato proprietario: I tuoi istruttori + lezioni
 window.trOwnerLezCard=async function(){
  if(isTr()||DEMO())return;
  try{
   var box=q("hv3-sopra");if(!box)return;
   var l=await ownerColl();TR.collO=l;
   var att=l.filter(function(x){return x.stato==="attivo";});
   var rl=await sb.rpc("equo_lezioni_proprietario"),les=Array.isArray(rl.data)?rl.data:[];
   var un=await sb.from("trainer_messaggi").select("collegamento_id").eq("letto",false).neq("mittente_id",currentUser.id).limit(200),nn={};
   (un.data||[]).forEach(function(x){nn[x.collegamento_id]=(nn[x.collegamento_id]||0)+1;});
   var old=q("tr-own-lez");if(old)old.remove();
   if(!att.length&&!les.length)return;
   var d=document.createElement("div");d.id="tr-own-lez";d.className="tr-card";
   var h='<h4><span>I tuoi istruttori</span></h4>'+att.map(function(c){var n=nn[c.id]||0;return '<div class="tr-riga" onclick="trChatApri(\''+c.id+'\',\'owner\')"><div class="th" style="font-weight:800;font-size:13px">'+esc(iniz(c.trainer))+'</div><div><b>'+esc(c.trainer)+'</b><small>segue '+esc(c.cavallo)+'</small></div>'+(n?'<span class="tr-chip n">'+n+(n===1?' nuovo':' nuovi')+'</span>':'<span class="tr-chip i">Chat</span>')+'</div>';}).join("");
   if(les.length)h+='<div class="tr2-et" style="margin-top:10px">Lezioni</div>'+les.slice(0,5).map(function(x){var p=x.stato==="proposta";return '<div class="tr-riga" style="cursor:default;flex-wrap:wrap"><div class="th" style="font-size:11px;font-weight:800;line-height:1.1;text-align:center">'+esc(x.ora)+'</div><div><b>'+esc(x.cavallo)+' · '+dataLunga(x.data)+'</b><small>'+esc(x.trainer)+' · '+(TIPI[x.tipo]||"Lezione")+(x.luogo?' · '+esc(x.luogo):'')+'</small></div>'+(p?'':chipL(x.stato))+(p?'<div class="tr-az" style="width:100%;display:flex;gap:8px;margin-top:8px"><button class="tr-btn" onclick="trLezRisp(\''+x.id+'\',true)">Conferma</button><button class="tr-btn o" onclick="trLezRisp(\''+x.id+'\',false)">Altro orario</button></div>':'')+'</div>';}).join("");
   d.innerHTML=h;box.appendChild(d);
  }catch(e){console.error(e);}
 };
 // aggancio: card del proprietario e chat dal menu «I miei istruttori»
 estendiDopo("trOwnerCard",function(){return trOwnerLezCard();});

 try{["tr-sedute","tr-cavalli","tr-agenda"].forEach(pagina);}catch(e){}
