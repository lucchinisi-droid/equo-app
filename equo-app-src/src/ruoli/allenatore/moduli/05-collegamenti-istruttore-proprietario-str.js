// Equo App · allenatore · modulo "collegamenti-istruttore-proprietario-str" (moduli ES, costruiti con Vite in ruoli/allenatore/costruito.js)
import { TR } from "./stato.js";
import { DEMO, IC, esc, q, toast } from "./00-strumenti.js";
import { carica, premium } from "./01-dati.js";
import { pagina } from "./02-home.js";
 // ----- COLLEGAMENTI istruttore ↔ proprietario ↔ struttura
 function collT(){return (TR.coll||[]).filter(function(x){return x.mio_ruolo==="trainer";});}
 function collDi(hid){return hid?collT().find(function(x){return x.horse_id===hid;}):null;}
 function msgColl(m){
  if(/RIFIUTATO/.test(m))return "Il proprietario ha chiuso il collegamento: deve invitarti lui con il tuo codice trainer.";
  if(/NON_TROVATO/.test(m))return "Il codice non corrisponde a nessun cavallo.";
  if(/NON_VALIDO/.test(m))return "Il codice non è valido.";
  if(/LIMITE_CAVALLI/.test(m))return "Hai raggiunto i 10 cavalli del piano Free.";
  return "Operazione non riuscita.";
 }
 function esitoColl(d){
  var st=d&&d.stato,n=d&&d.nome||"il cavallo";
  return st==="attivo"?"Collegato a "+n+".":"Richiesta inviata: le sedute di "+n+" arriveranno al proprietario solo quando avrà accettato.";
 }
 function chipColl(c,cv){
  if(!c)return cv&&cv.horse_id?'<span class="tr-chip b">Da collegare</span>':'';
  if(c.stato==="attivo")return '<span class="tr-chip i">'+(c.origine==="centro"?'Centro':'Collegato')+'</span>';
  if(c.stato==="revocato")return '<span class="tr-chip n">Chiuso</span>';
  return '<span class="tr-chip b">'+(c.da_rispondere?'Invito':'In attesa')+'</span>';
 }
 async function ricarica(){TR.caricato=false;await carica();trRenderCavalli();trRenderHome();}
 window.trRenderCavalli=async function(){
  var p=pagina("tr-cavalli");if(!TR.caricato)await carica();
  var inv=collT().filter(function(x){return x.da_rispondere;});
  var h='<div class="tr-h" style="display:flex;justify-content:space-between;align-items:center"><span>Cavalli seguiti</span><button class="tr-btn" onclick="trNuovoCavallo()">+ Cavallo</button></div><div class="tr-sub">'+TR.cavalli.length+(premium()?'':' di 10')+' cavalli</div>';
  if(inv.length)h+='<div class="tr-card"><h4><span>Inviti dei proprietari</span></h4>'+inv.map(function(c){return '<div class="tr-riga" style="cursor:default"><div class="th">'+IC.film+'</div><div><b>'+esc(c.cavallo)+'</b><small>'+esc(c.proprietario)+' ti invita a seguire il suo cavallo</small></div><div class="tr-az"><button class="tr-btn" onclick="trCollRisp(\''+c.id+'\',true)">Accetta</button><button class="tr-btn o" onclick="trCollRisp(\''+c.id+'\',false)">No</button></div></div>';}).join("")+'</div>';
  h+='<div class="tr-card">'+(TR.cavalli.length?TR.cavalli.map(function(c){var k=collDi(c.horse_id);return '<div class="tr-riga" onclick="trCavSheet(\''+c.id+'\')"><div class="th">'+IC.film+'</div><div><b>'+esc(c.nome)+'</b><small>'+esc(c.cavaliere||"Cavaliere non indicato")+(c.centro_id?" · centro":"")+'</small></div>'+chipColl(k,c)+'</div>';}).join(""):'<div class="tr-vuoto">Nessun cavallo ancora.</div>')+'</div>';
  h+='<div class="tr-card"><h4><span>Strutture</span><button onclick="trEntraCentro()">+ Entra</button></h4>'+
   ((TR.centri||[]).length?TR.centri.map(function(c){return '<div class="tr-riga" onclick="trCentroSheet(\''+c.id+'\')"><div class="th">'+IC.film+'</div><div><b>'+esc(c.nome)+'</b><small>Tocca per seguire i cavalli del centro</small></div></div>';}).join(""):'<div class="muted" style="font-size:12.5px;line-height:1.5">Lavori in un centro ippico? Entra con il suo codice invito: potrai seguire i suoi cavalli e inviare le sedute anche agli allievi e allo staff.</div>')+'</div>';
  h+='<div class="tr-card"><h4><span>Il tuo codice trainer</span><button onclick="trMioCodice()">Mostra</button></h4><div class="muted" style="font-size:12.5px;line-height:1.5">Un proprietario può invitarti con questo codice (EQUO-TRA-…): tu accetti e il cavallo compare qui. Nessuna seduta arriva a un proprietario senza il suo consenso.</div></div>';
  p.innerHTML=h;
 };
 window.trCavSheet=function(id){
  var cv=TR.cavalli.find(function(x){return x.id===id;});if(!cv)return;
  var c=collDi(cv.horse_id),h='<div class="muted" style="font-size:13px;margin-bottom:10px">'+esc(cv.cavaliere||"Cavaliere non indicato")+'</div>';
  if(c&&c.stato==="attivo")h+='<div style="font-size:13.5px;line-height:1.5;margin-bottom:12px">Collegato a <b>'+esc(c.proprietario)+'</b>'+(c.origine==="centro"?' tramite il centro':'')+'. Le sedute che invii le vede lui.</div><button class="tr-btn o" style="width:100%" onclick="trCollRevoca(\''+c.id+'\')">Interrompi il collegamento</button>';
  else if(c&&c.stato==="da_confermare_proprietario")h+='<div style="font-size:13.5px;line-height:1.5;margin-bottom:12px">In attesa che <b>'+esc(c.proprietario)+'</b> accetti la richiesta. Finché non accetta non può ricevere sedute.</div><button class="tr-btn o" style="width:100%" onclick="trCollRevoca(\''+c.id+'\')">Annulla la richiesta</button>';
  else if(c&&c.stato==="da_confermare_trainer")h+='<div style="font-size:13.5px;line-height:1.5;margin-bottom:12px"><b>'+esc(c.proprietario)+'</b> ti invita a seguire questo cavallo.</div><div class="tr-az" style="display:flex;gap:8px"><button class="tr-btn" style="flex:1" onclick="trCollRisp(\''+c.id+'\',true)">Accetta</button><button class="tr-btn o" style="flex:1" onclick="trCollRisp(\''+c.id+'\',false)">Rifiuta</button></div>';
  else h+=(c&&c.stato==="revocato"?'<div style="font-size:13px;margin-bottom:10px;color:#8a2a22">Il collegamento è stato chiuso.</div>':'')+'<div style="font-size:13px;line-height:1.5;margin-bottom:10px">Per inviare le sedute al proprietario inserisci il codice Equo del cavallo: il proprietario riceve una richiesta e deve accettarla.</div><input class="tr-field" id="trk-k" placeholder="Codice Equo (es. MAR-000123)"><button class="btn btn-primary" style="width:100%" onclick="trCollegaCodice(\''+id+'\')">Invia richiesta</button>';
  diarioSheet(esc(cv.nome),h);
 };
 window.trCollegaCodice=async function(id){
  var k=(q("trk-k").value||"").trim();if(!k){toast("Scrivi il codice Equo");return;}
  if(DEMO()){var cv=TR.cavalli.find(function(x){return x.id===id;});cv.horse_id="h"+Date.now();TR.coll.push({id:"k"+Date.now(),stato:"da_confermare_proprietario",mio_ruolo:"trainer",horse_id:cv.horse_id,cavallo:cv.nome,proprietario:"Proprietario",origine:"trainer"});closeModal("modal-dr-sheet");toast(esitoColl({stato:"da_confermare_proprietario",nome:cv.nome}));trRenderCavalli();return;}
  var r=await sb.rpc("equo_trainer_collega_cavallo",{p_cavallo:id,p_codice:k});
  if(r.error){toast(msgColl(r.error.message||""));return;}
  closeModal("modal-dr-sheet");toast(esitoColl(r.data));await ricarica();
 };
 window.trCollRisp=async function(id,ok){
  if(DEMO()){var c=TR.coll.find(function(x){return x.id===id;});if(c){c.stato=ok?"attivo":"revocato";c.da_rispondere=false;}closeModal("modal-dr-sheet");toast(ok?"Collegamento attivo":"Invito rifiutato");trRenderCavalli();return;}
  var r=await sb.rpc("equo_rispondi_collegamento",{p_id:id,p_accetta:ok});
  if(r.error){toast(/LIMITE_CAVALLI/.test(r.error.message||"")?"Hai raggiunto i 10 cavalli del piano Free.":"Operazione non riuscita");return;}
  closeModal("modal-dr-sheet");toast(ok?"Collegamento attivo":"Invito rifiutato");await ricarica();
 };
 window.trCollRevoca=async function(id){
  if(!(await chiediSiNo("Interrompere il collegamento?","Non potrai più inviargli sedute. Quelle già inviate restano al proprietario e tutto resta nello storico.")))return;
  if(DEMO()){var c=TR.coll.find(function(x){return x.id===id;});if(c)c.stato="revocato";closeModal("modal-dr-sheet");trRenderCavalli();return;}
  var r=await sb.rpc("equo_revoca_collegamento",{p_id:id});
  if(r.error){toast("Operazione non riuscita");return;}
  closeModal("modal-dr-sheet");await ricarica();
 };
 window.trMioCodice=async function(){
  var cod="";
  if(DEMO())cod="EQUO-TRA-7K2M9";
  else{var r=await sb.rpc("equo_mio_codice_trainer");if(r.error||!r.data){toast("Non riesco a creare il codice");return;}cod=r.data;}
  diarioSheet("Il tuo codice trainer",'<div style="text-align:center;font-size:24px;font-weight:900;letter-spacing:1px;color:#14482c;margin:6px 0 10px">'+esc(cod)+'</div><div style="font-size:13px;line-height:1.5;margin-bottom:12px">Dallo a un proprietario: nell\'app Equo va su «+» → <b>I miei istruttori</b>, sceglie il cavallo e inserisce questo codice. Poi tu accetti qui in Cavalli seguiti.</div><button class="btn btn-primary" style="width:100%" onclick="trCopiaCodice(\''+esc(cod)+'\')">Copia / condividi</button>');
 };
 window.trCopiaCodice=function(c){
  var t="Il mio codice trainer su Equo: "+c;
  if(navigator.share){navigator.share({text:t}).catch(function(){});return;}
  try{navigator.clipboard.writeText(t);toast("Codice copiato");}catch(e){toast(t);}
 };
 window.trEntraCentro=function(){
  diarioSheet("Entra in una struttura",'<div style="font-size:13px;line-height:1.5;margin-bottom:10px">Inserisci il codice invito che ti ha dato il centro (lo trova in Equo Scuderia → Il tuo Centro). Entrerai come istruttore e potrai seguire i cavalli del centro.</div><input class="tr-field" id="trc-cod" placeholder="Codice invito del centro" autocapitalize="characters"><button class="btn btn-primary" style="width:100%" onclick="trEntraCentroOk()">Entra</button>');
 };
 window.trEntraCentroOk=async function(){
  var k=(q("trc-cod").value||"").trim();if(!k){toast("Scrivi il codice del centro");return;}
  if(DEMO()){TR.centri.push({id:"c"+Date.now(),nome:"Nuovo centro",ruolo:"istruttore"});closeModal("modal-dr-sheet");toast("Sei entrato nel centro");trRenderCavalli();return;}
  var r=await sb.rpc("join_centro_by_code",{p_join_code:k,p_ruolo:"istruttore"});
  if(r.error){toast(/non valido/i.test(r.error.message||"")?"Codice del centro non valido.":"Non sono riuscito a entrare nel centro.");return;}
  closeModal("modal-dr-sheet");toast("Sei entrato nel centro");await ricarica();
 };
 window.trCentroSheet=async function(cid){
  var c=(TR.centri||[]).find(function(x){return x.id===cid;});if(!c)return;
  diarioSheet(esc(c.nome),'<div class="loading"><div class="spinner"></div></div>');
  var l=[];
  if(DEMO())l=[{id:"s1",nome:"Luna",proprietario:"Anna Neri",su_equo:true,seguito:false},{id:"s2",nome:"Tempesta",proprietario:"Luca Gori",su_equo:false,seguito:true}];
  else{var r=await sb.rpc("equo_trainer_cavalli_centro",{p_centro:cid});if(r.error){closeModal("modal-dr-sheet");toast("Non riesco a leggere i cavalli del centro");return;}l=r.data||[];}
  var h='<div class="muted" style="font-size:12.5px;line-height:1.5;margin-bottom:8px">Seguire un cavallo del centro ti collega al suo proprietario (se è su Equo), che può sempre revocare. Il titolare del centro vede le sedute che invii su questi cavalli.</div>'+
   (l.length?l.map(function(x){return '<div class="tr-riga" style="cursor:default"><div class="th">'+IC.film+'</div><div><b>'+esc(x.nome)+'</b><small>'+esc(x.proprietario||"Proprietario non indicato")+(x.su_equo?' · su Equo':'')+'</small></div>'+(x.seguito?'<span class="tr-chip i">Seguito</span>':'<button class="tr-btn" onclick="trSeguiCentro(\''+cid+'\',\''+x.id+'\')">Segui</button>')+'</div>';}).join(""):'<div class="tr-vuoto">Il centro non ha ancora cavalli in Equo Scuderia.</div>');
  diarioSheet(esc(c.nome),h);
 };
 window.trSeguiCentro=async function(cid,sid){
  if(!premium()&&TR.cavalli.length>=10){closeModal("modal-dr-sheet");toast("Nel piano Free puoi seguire 10 cavalli.");trPrem();return;}
  if(DEMO()){TR.cavalli.push({id:"dc"+Date.now(),nome:"Luna",cavaliere:"Anna Neri",horse_id:"h9",centro_id:cid});TR.coll.push({id:"k"+Date.now(),stato:"attivo",mio_ruolo:"trainer",horse_id:"h9",cavallo:"Luna",proprietario:"Anna Neri",origine:"centro"});closeModal("modal-dr-sheet");toast("Seguito: collegato al proprietario tramite il centro");trRenderCavalli();return;}
  var r=await sb.rpc("equo_trainer_segui_cavallo_centro",{p_centro:cid,p_scuderia:sid});
  if(r.error){toast(msgColl(r.error.message||""));return;}
  closeModal("modal-dr-sheet");toast(r.data&&r.data.collegamento==="attivo"?"Seguito: collegato al proprietario tramite il centro":"Seguito. Il cavallo non è ancora su Equo: puoi inviare le sedute allo staff e agli allievi del centro.");await ricarica();
 };
 window.trNuovoCavallo=function(){
  diarioSheet("Nuovo cavallo seguito",'<input class="tr-field" id="trc-n" placeholder="Nome del cavallo"><input class="tr-field" id="trc-c" placeholder="Cavaliere o proprietario (facoltativo)"><input class="tr-field" id="trc-k" placeholder="Codice Equo (facoltativo, es. MAR-000123)"><button class="btn btn-primary" style="width:100%" onclick="trSalvaCavallo()">Salva</button>');
 };
 window.trSalvaCavallo=async function(){
  var n=(q("trc-n").value||"").trim(),c=(q("trc-c").value||"").trim(),k=(q("trc-k").value||"").trim();
  if(!n){toast("Scrivi il nome del cavallo");return;}
  if(!premium()&&TR.cavalli.length>=10){closeModal("modal-dr-sheet");toast("Nel piano Free puoi seguire 10 cavalli. Passa a Premium per aggiungerne altri.");trPrem();return;}
  if(DEMO()){TR.cavalli.push({id:"dc"+Date.now(),nome:n,cavaliere:c});}
  else{
   var r=await sb.from("trainer_cavalli").insert({nome:n,cavaliere:c||null}).select().single();
   if(r.error){toast(/LIMITE_CAVALLI/.test(r.error.message||"")?"Hai raggiunto i 10 cavalli del piano Free.":"Non sono riuscito a salvare: "+(r.error.message||"errore"));return;}
   TR.cavalli.push(r.data);
   if(k){var lk=await sb.rpc("equo_trainer_collega_cavallo",{p_cavallo:r.data.id,p_codice:k});
    if(lk.error)toast(msgColl(lk.error.message||"")+" Il cavallo è salvato senza collegamento.");
    else{toast(esitoColl(lk.data));}
    await carica();}
  }
  closeModal("modal-dr-sheet");trRenderCavalli();trRenderHome();
 };
