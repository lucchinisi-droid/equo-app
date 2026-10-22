// Equo App · allenatore · modulo "lato-proprietario-richieste-di-collegame" (moduli ES, costruiti con Vite in ruoli/allenatore/costruito.js)
import { TR } from "./stato.js";
import { DEMO, IC, esc, isTr, q, toast } from "./00-strumenti.js";
 // ----- lato proprietario: richieste di collegamento e «I miei istruttori»
 async function ownerColl(){var r=await sb.rpc("equo_miei_collegamenti");return (Array.isArray(r.data)?r.data:[]).filter(function(x){return x.mio_ruolo==="proprietario";});}
 async function trOwnerCollCard(){
  if(isTr()||DEMO())return;
  try{
   var old=q("tr-own-coll");if(old)old.remove();
   var box=q("hv3-sopra");if(!box)return;
   var l=await ownerColl();TR.collO=l;
   var inv=l.filter(function(x){return x.da_rispondere;});if(!inv.length)return;
   old=q("tr-own-coll");if(old)old.remove();
   var d=document.createElement("div");d.id="tr-own-coll";d.className="tr-card";
   d.innerHTML='<h4><span>Richieste dei tuoi istruttori</span></h4>'+inv.map(function(c){return '<div class="tr-riga" style="cursor:default"><div class="th">'+IC.film+'</div><div><b>'+esc(c.trainer)+'</b><small>vuole seguire '+esc(c.cavallo)+' e inviarti le sedute</small></div><div class="tr-az"><button class="tr-btn" onclick="trCollRispO(\''+c.id+'\',true)">Accetta</button><button class="tr-btn o" onclick="trCollRispO(\''+c.id+'\',false)">No</button></div></div>';}).join("");
   box.appendChild(d);
  }catch(e){console.error(e);}
 }
 window.trCollRispO=async function(id,ok){
  var r=await sb.rpc("equo_rispondi_collegamento",{p_id:id,p_accetta:ok});
  if(r.error){toast("Operazione non riuscita");return;}
  toast(ok?"Istruttore collegato: riceverai le sue sedute":"Richiesta rifiutata");
  trOwnerCollCard();if(q("modal-dr-sheet")&&q("modal-dr-sheet").classList.contains("active"))trCollOwner();
 };
 window.trCollRevocaO=async function(id){
  if(!(await chiediSiNo("Interrompere il collegamento?","L'istruttore non potrà più inviarti sedute. Quelle già ricevute restano tue.")))return;
  var r=await sb.rpc("equo_revoca_collegamento",{p_id:id});
  if(r.error){toast("Operazione non riuscita");return;}
  toast("Collegamento interrotto");trOwnerCollCard();trCollOwner();
 };
 window.trCollInvita=async function(){
  var hid=q("tri-h")&&q("tri-h").value,k=(q("tri-k").value||"").trim();
  if(!hid){toast("Scegli il cavallo");return;}if(!k){toast("Scrivi il codice dell'istruttore (EQUO-TRA-…)");return;}
  var r=await sb.rpc("equo_proprietario_invita_trainer",{p_horse:hid,p_codice:k});
  if(r.error){var m=r.error.message||"";toast(/NON_TROVATO/.test(m)?"Codice non trovato: chiedi all'istruttore di mostrarti il suo codice EQUO-TRA-… nell'app Equo.":/PROPRIO/.test(m)?"Questo è il tuo stesso codice.":"Invito non riuscito");return;}
  toast(r.data&&r.data.stato==="attivo"?(r.data.trainer||"L'istruttore")+" è collegato":"Invito inviato a "+(r.data&&r.data.trainer||"all'istruttore")+": deve accettare lui");
  trCollOwner();
 };
 window.trCollOwner=async function(){
  if(DEMO()){diarioSheet("I miei istruttori",'<div class="tr-vuoto">Disponibile con un account reale.</div>');return;}
  diarioSheet("I miei istruttori",'<div class="loading"><div class="spinner"></div></div>');
  var l=[];try{l=await ownerColl();}catch(e){}
  var hs=(typeof horses!=="undefined"&&horses)||[];
  var att=l.filter(function(x){return x.stato==="attivo";}),ric=l.filter(function(x){return x.da_rispondere;}),sent=l.filter(function(x){return x.stato==="da_confermare_trainer"&&!x.da_rispondere;}),h="";
  if(ric.length)h+='<h5 style="margin:6px 0">Richieste da accettare</h5>'+ric.map(function(c){return '<div class="tr-riga" style="cursor:default"><div><b>'+esc(c.trainer)+'</b><small>vuole seguire '+esc(c.cavallo)+'</small></div><div class="tr-az" style="margin-left:auto;display:flex;gap:6px"><button class="tr-btn" onclick="trCollRispO(\''+c.id+'\',true)">Accetta</button><button class="tr-btn o" onclick="trCollRispO(\''+c.id+'\',false)">No</button></div></div>';}).join("");
  h+='<h5 style="margin:10px 0 6px">Collegati</h5>'+(att.length?att.map(function(c){return '<div class="tr-riga" style="cursor:default"><div><b>'+esc(c.trainer)+'</b><small>segue '+esc(c.cavallo)+(c.centro?' · '+esc(c.centro):'')+'</small></div><div style="margin-left:auto;display:flex;gap:6px"><button class="tr-btn" onclick="closeModal(\'modal-dr-sheet\');trChatApri(\''+c.id+'\',\'owner\')">Chat</button><button class="tr-btn o" onclick="trCollRevocaO(\''+c.id+'\')">Revoca</button></div></div>';}).join(""):'<div class="muted" style="font-size:12.5px">Nessun istruttore collegato. Senza il tuo consenso nessuno può inviarti sedute.</div>');
  if(sent.length)h+='<h5 style="margin:10px 0 6px">Inviti in attesa</h5>'+sent.map(function(c){return '<div class="tr-riga" style="cursor:default"><div><b>'+esc(c.trainer)+'</b><small>per '+esc(c.cavallo)+' · deve ancora accettare</small></div><button class="tr-btn o" style="margin-left:auto" onclick="trCollRevocaO(\''+c.id+'\')">Annulla</button></div>';}).join("");
  h+='<h5 style="margin:12px 0 6px">Invita il tuo istruttore</h5><select class="tr-field" id="tri-h"><option value="">Scegli il cavallo…</option>'+hs.map(function(x){return '<option value="'+x.id+'">'+esc(x.name)+'</option>';}).join("")+'</select><input class="tr-field" id="tri-k" placeholder="Codice dell\'istruttore (EQUO-TRA-…)" autocapitalize="characters"><button class="btn btn-primary" style="width:100%" onclick="trCollInvita()">Invita</button><div class="muted" style="font-size:12px;line-height:1.5;margin-top:8px">L\'istruttore trova il suo codice nell\'app Trainer → Cavalli seguiti → «Il tuo codice trainer».</div>';
  diarioSheet("I miei istruttori",h);
 };
 estendiDopo("diarioHomeRender",function(){trOwnerCard(true);});

export { ownerColl, trOwnerCollCard };
