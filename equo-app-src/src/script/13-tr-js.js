
(function(){
 var BK="sedute-media";
 var TR={cavalli:[],sedute:[],media:{},slot:{usati:0,limite:10},cur:null,ann:[],comm:[],vurl:null,tool:null,forme:[],lavCol:"#e2ab45",lavK:"linea",lente:null,rec:null,caricato:false,owner:false};
 var DEMO=function(){return typeof DEMO_MODE!=="undefined"&&DEMO_MODE;};
 function q(i){return document.getElementById(i);}
 function esc(s){return escapeHtml(String(s==null?"":s));}
 function isTr(){return typeof plRuolo==="function"&&plRuolo()==="istr";}
 function toast(m){if(typeof showToast==="function")showToast(m);}
 function fmt(t){t=Math.max(0,t||0);var m=Math.floor(t/60),s=Math.floor(t%60);return m+":"+String(s).padStart(2,"0");}
 var IC={film:'<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m10 9 5 3-5 3z"/></svg>',
  punto:'<svg viewBox="0 0 24 24"><path d="M12 21s7-6 7-11a7 7 0 0 0-14 0c0 5 7 11 7 11z"/><circle cx="12" cy="10" r="2.4"/></svg>',
  voce:'<svg viewBox="0 0 24 24"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>',
  lente:'<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3M8 11h6M11 8v6"/></svg>',
  lavagna:'<svg viewBox="0 0 24 24"><path d="M4 20l4-1 11-11-3-3L5 16z"/><path d="M14 6l3 3"/></svg>',
  rallenta:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="M12 7v5l3 2"/></svg>'};
 // ----- dati
 function demoDati(){
  if(!TR.demoInit){TR.demoInit=true;TR.cavalli=[{id:"dc1",nome:"Aurora",cavaliere:"Giulia Verdi",horse_id:"h1"},{id:"dc2",nome:"Rio",cavaliere:"Marco Bianchi",horse_id:"h2"},{id:"dc3",nome:"Fiamma",cavaliere:"Anna Neri"}];TR.sedute=[];TR.slot={usati:0,limite:10};TR.coll=[{id:"k1",stato:"attivo",mio_ruolo:"trainer",horse_id:"h1",cavallo:"Aurora",proprietario:"Giulia Verdi",origine:"trainer"},{id:"k2",stato:"da_confermare_proprietario",mio_ruolo:"trainer",horse_id:"h2",cavallo:"Rio",proprietario:"Marco Bianchi",origine:"trainer",da_rispondere:false},{id:"k3",stato:"da_confermare_trainer",mio_ruolo:"trainer",horse_id:"h3",cavallo:"Luna",proprietario:"Sara Rossi",origine:"proprietario",da_rispondere:true}];TR.centri=[{id:"c1",nome:"Centro Ippico Blu",ruolo:"istruttore"}];}
 }
 async function carica(){
  if(DEMO()){demoDati();TR.caricato=true;return;}
  try{
   var r=await Promise.all([
    sb.from("trainer_cavalli").select("*").is("archiviato_il",null).order("created_at"),
    sb.from("sedute").select("*, sedute_media(id,path,durata_s)").eq("trainer_id",currentUser.id).eq("nascosta",false).order("created_at",{ascending:false}).limit(100),
    sb.rpc("equo_trainer_slot"),sb.rpc("equo_miei_collegamenti"),sb.rpc("equo_trainer_miei_centri")]);
   TR.cavalli=r[0].data||[];TR.sedute=r[1].data||[];if(r[2].data)TR.slot=r[2].data;TR.coll=Array.isArray(r[3].data)?r[3].data:[];TR.centri=Array.isArray(r[4].data)?r[4].data:[];TR.caricato=true;
  }catch(e){console.error(e);}
 }
 function premium(){return typeof isPremium==="function"&&isPremium();}
 function cavNome(s){var c=TR.cavalli.find(function(x){return x.id===s.cavallo_id;});return c?c.nome:(s.cavallo_nome||"Senza cavallo");}
 function chip(s){return s.stato==="inviata"?'<span class="tr-chip i">Inviata</span>':'<span class="tr-chip b">Bozza</span>';}
 function slotHtml(){
  if(premium())return "";
  var u=TR.slot.usati||0,l=TR.slot.limite||10;
  return '<div class="tr-card"><h4><span>Prova l\'editor: '+u+' di '+l+'</span><button onclick="trPrem()">Premium</button></h4><div class="tr-slot"><i style="width:'+Math.min(100,u/l*100)+'%"></i></div><div class="muted" style="font-size:12px;line-height:1.45">Ogni seduta inviata usa uno slot. Gli slot non si cancellano e non si rinnovano. Video fino a 60 secondi.'+(u>=l?' <b>Hai finito gli slot: puoi ancora usare chat e agenda e rivedere le sedute già fatte.</b>':'')+'</div></div>';
 }
 window.trPrem=function(){if(typeof togglePiano==="function")togglePiano();};
 function righe(list){
  if(!list.length)return '<div class="tr-vuoto">Ancora nessuna seduta.<br>Filma o carica un video per cominciare.</div>';
  return list.map(function(s){return '<div class="tr-riga" onclick="trApri(\''+s.id+'\')"><div class="th">'+IC.film+'</div><div><b>'+esc(s.titolo)+'</b><small>'+esc(cavNome(s))+' · '+formatDate(s.created_at)+'</small></div>'+chip(s)+'</div>';}).join("");
 }
 // ----- Home
 function pagina(id){
  var el=q("page-"+id);if(el)return el;
  var home=q("page-pro-home");el=document.createElement("div");el.className="page-content";el.id="page-"+id;home.parentNode.insertBefore(el,home.nextSibling);return el;
 }
 window.trRenderHome=async function(){
  var home=q("page-pro-home");if(!home)return;
  var box=q("tr-home");if(!box){box=document.createElement("div");box.id="tr-home";home.appendChild(box);}
  if(!TR.caricato){box.innerHTML='<div class="loading"><div class="spinner"></div></div>';await carica();}
  var nome=(currentUser&&(currentUser.fullName||currentUser.nome||currentUser.full_name))||"";
  var ora=new Date().getHours(),sal=ora<13?"Buongiorno":ora<18?"Buon pomeriggio":"Buonasera";
  var rec=TR.sedute.slice(0,3);
  box.innerHTML='<div class="tr-h">'+sal+(nome?', '+esc(String(nome).split(" ")[0]):'')+'</div><div class="tr-sub">'+new Date().toLocaleDateString("it-IT",{weekday:"long",day:"numeric",month:"long"})+'</div>'+
   '<div class="tr-cta"><div><b>Nuova seduta</b><span>Filma o carica il video del lavoro</span></div><div class="bt"><button class="tr-btn" onclick="trNuova()">Filma / Carica</button></div></div>'+
   slotHtml()+
   '<div class="tr-card"><h4><span>Il tuo codice allenatore</span><button onclick="trMioCodice()">Mostra</button></h4><div class="muted" style="font-size:12.5px;line-height:1.5">Dallo ai proprietari dei cavalli che alleni: lo inseriscono in «I miei istruttori» e tu accetti il collegamento.</div></div>'+
   '<div class="tr-card"><h4><span>Sedute recenti</span><button onclick="showPage(\'tr-sedute\')">Vedi tutte</button></h4>'+righe(rec)+'</div>'+
   '<div class="tr-card"><h4><span>Cavalli seguiti</span><button onclick="showPage(\'tr-cavalli\')">'+TR.cavalli.length+(premium()?'':' di 10')+' ›</button></h4><div class="muted" style="font-size:12.5px">'+(TR.cavalli.length?TR.cavalli.slice(0,4).map(function(c){return esc(c.nome);}).join(", "):'Aggiungi i cavalli che alleni per collegare le sedute.')+'</div></div>';
 };
 // ----- Sedute
 window.trRenderSedute=async function(){
  var p=pagina("tr-sedute");if(!TR.caricato)await carica();
  p.innerHTML='<div class="tr-h" style="display:flex;justify-content:space-between;align-items:center"><span>Sedute</span><button class="tr-btn" onclick="trNuova()">+ Nuova</button></div><div class="tr-sub">Il lavoro con i tuoi cavalli, video e analisi.</div>'+slotHtml()+'<div class="tr-card">'+righe(TR.sedute)+'</div>';
 };
 // ----- Cavalli seguiti

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
 // ----- Nuova seduta
 window.trNuova=async function(){
  if(!TR.caricato)await carica();
  if(!premium()&&(TR.slot.usati||0)>=(TR.slot.limite||10)){toast("Hai usato i 10 slot di prova.");trPrem();return;}
  var opt=TR.cavalli.map(function(c){return '<option value="'+c.id+'">'+esc(c.nome)+'</option>';}).join("");
  diarioSheet("Nuova seduta",'<input class="tr-field" id="trs-t" placeholder="Titolo (es. Salto, lavoro in piano)">'+
   '<select class="tr-field" id="trs-c"><option value="">Scegli il cavallo…</option>'+opt+'<option value="+">+ Nuovo cavallo</option></select>'+
   '<label class="tr-btn v" style="display:block;text-align:center;margin-bottom:6px">Filma o scegli un video<input type="file" id="trs-f" accept="video/*" style="display:none" onchange="trVideoScelto(this)"></label>'+
   '<div class="muted" id="trs-i" style="font-size:12px;margin-bottom:10px">'+(premium()?'':'Nel piano Free il video dura al massimo 60 secondi. ')+'Il video resta privato finché non lo invii.</div>'+
   '<button class="btn btn-primary" style="width:100%" id="trs-ok" onclick="trCreaSeduta()" disabled>Crea la seduta</button>');
  q("trs-c").onchange=function(){if(this.value==="+"){closeModal("modal-dr-sheet");trNuovoCavallo();}};
 };
 window.trVideoScelto=function(inp){
  var f=inp.files&&inp.files[0];if(!f)return;
  var u=URL.createObjectURL(f),v=document.createElement("video");v.preload="metadata";
  v.onloadedmetadata=function(){
   var d=v.duration||0;
   if(!premium()&&d>60.5){q("trs-i").innerHTML='<b style="color:#a03028">Il video dura '+Math.round(d)+' secondi: nel piano Free il massimo è 60. Scegline uno più corto.</b>';q("trs-ok").disabled=true;TR.nuovoFile=null;return;}
   TR.nuovoFile=f;TR.nuovaDur=d;q("trs-i").textContent="Video pronto · "+fmt(d);q("trs-ok").disabled=false;
  };
  v.onerror=function(){TR.nuovoFile=f;TR.nuovaDur=null;q("trs-i").textContent="Video scelto";q("trs-ok").disabled=false;};
  v.src=u;
 };
 window.trCreaSeduta=async function(){
  var t=(q("trs-t").value||"").trim()||"Seduta del "+new Date().toLocaleDateString("it-IT"),cid=q("trs-c").value||null;
  if(!TR.nuovoFile){toast("Scegli un video");return;}
  var btn=q("trs-ok");btn.disabled=true;btn.textContent="Carico…";
  try{
   var s;
   if(DEMO()){
    s={id:"ds"+Date.now(),titolo:t,cavallo_id:cid,stato:"bozza",created_at:new Date().toISOString(),sedute_media:[{id:"dm1",path:"demo",durata_s:TR.nuovaDur}],_url:URL.createObjectURL(TR.nuovoFile)};
    TR.sedute.unshift(s);
   }else{
    var cv=TR.cavalli.find(function(c){return c.id===cid;});
    var r=await sb.from("sedute").insert({titolo:t,cavallo_id:cid,horse_id:cv&&cv.horse_id||null}).select().single();
    if(r.error)throw r.error;s=r.data;
    var ext=(TR.nuovoFile.name.split(".").pop()||"mp4").toLowerCase().replace(/[^a-z0-9]/g,"")||"mp4";
    var path=currentUser.id+"/"+s.id+"/"+Date.now()+"."+ext;
    var up=await sb.storage.from(BK).upload(path,TR.nuovoFile,{contentType:TR.nuovoFile.type||"video/mp4"});
    if(up.error)throw up.error;
    var m=await sb.from("sedute_media").insert({seduta_id:s.id,path:path,tipo:"video",durata_s:TR.nuovaDur,mime:TR.nuovoFile.type,byte:TR.nuovoFile.size}).select().single();
    if(m.error)throw m.error;
    s.sedute_media=[m.data];TR.sedute.unshift(s);
   }
   TR.nuovoFile=null;closeModal("modal-dr-sheet");trApri(s.id);trRenderHome();
  }catch(e){toast(/VIDEO_TROPPO_LUNGO/.test(e.message||"")?"Il video supera i 60 secondi del piano Free.":"Non sono riuscito a caricare: "+(e.message||"errore"));btn.disabled=false;btn.textContent="Crea la seduta";}
 };
 // ----- Editor / visualizzatore
 function ensureEd(){
  if(q("tr-ed"))return;
  var d=document.createElement("div");d.id="tr-ed";d.className="tr-ed";
  d.innerHTML='<div class="tr-top"><button class="ind" onclick="trChiudi()">‹</button><b id="tr-tit"></b><button class="tr-btn" id="tr-invia" onclick="trInvia()">Invia</button></div>'+
   '<div class="tr-stage" id="tr-stage"><video id="tr-v" playsinline webkit-playsinline></video><canvas id="tr-lente"></canvas><canvas id="tr-cv"></canvas><div id="tr-ov"></div></div>'+
   '<div class="tr-ctl"><button id="tr-play" onclick="trPlay()">▶</button><button data-v=".25" onclick="trVel(.25)">0.25×</button><button data-v=".5" onclick="trVel(.5)">0.5×</button><button data-v="1" class="on" onclick="trVel(1)">1×</button><span class="t" id="tr-t">0:00</span></div>'+
   '<div class="tr-tl" id="tr-tl"><div class="pr" id="tr-pr"></div></div>'+
   '<div class="tr-lav" id="tr-lav"><button data-k="linea" class="on" onclick="trLavK(\'linea\')">Linea</button><button data-k="freccia" onclick="trLavK(\'freccia\')">Freccia</button><button data-k="cerchio" onclick="trLavK(\'cerchio\')">Cerchio</button><i style="background:#e2ab45" onclick="trLavC(\'#e2ab45\')"></i><i style="background:#ff5a4d" onclick="trLavC(\'#ff5a4d\')"></i><i style="background:#58d68d" onclick="trLavC(\'#58d68d\')"></i><button onclick="trLavUndo()">Annulla</button><button class="on" onclick="trLavSalva()">Salva</button></div>'+
   '<div class="tr-tools" id="tr-tools"></div><div class="tr-list" id="tr-list"></div>';
  document.body.appendChild(d);
  var v=q("tr-v");
  v.addEventListener("timeupdate",trTick);v.addEventListener("play",function(){q("tr-play").textContent="❚❚";});v.addEventListener("pause",function(){q("tr-play").textContent="▶";trTick();});
  v.addEventListener("loadedmetadata",function(){trTick();trDisegnaTl();});
  var tl=q("tr-tl"),drag=false;
  function seek(e){var r=tl.getBoundingClientRect(),x=(e.touches?e.touches[0].clientX:e.clientX)-r.left;if(v.duration)v.currentTime=Math.max(0,Math.min(v.duration,x/r.width*v.duration));}
  tl.addEventListener("pointerdown",function(e){drag=true;seek(e);});window.addEventListener("pointermove",function(e){if(drag)seek(e);});window.addEventListener("pointerup",function(){drag=false;});
  var cv=q("tr-cv"),dr=null;
  function pos(e){var r=cv.getBoundingClientRect();return {x:(e.clientX-r.left)/r.width,y:(e.clientY-r.top)/r.height};}
  cv.addEventListener("pointerdown",function(e){if(TR.tool!=="lavagna"&&TR.tool!=="lente")return;dr=pos(e);dr.x2=dr.x;dr.y2=dr.y;cv.setPointerCapture(e.pointerId);});
  cv.addEventListener("pointermove",function(e){if(!dr)return;var p=pos(e);dr.x2=p.x;dr.y2=p.y;TR.bozza=dr;trDisegna();});
  cv.addEventListener("pointerup",function(){if(!dr)return;if(Math.hypot(dr.x2-dr.x,dr.y2-dr.y)>.02){if(TR.tool==="lavagna")TR.forme.push({k:TR.lavK,c:TR.lavCol,x1:dr.x,y1:dr.y,x2:dr.x2,y2:dr.y2});else if(TR.tool==="lente"){trLenteSalva(dr);}}dr=null;TR.bozza=null;trDisegna();});
 }
 window.trApri=async function(id,comeProp){
  var s=TR.sedute.find(function(x){return x.id===id;})||(TR.ricevute||[]).find(function(x){return x.id===id;});
  if(!s)return;ensureEd();TR.cur=s;TR.owner=!!comeProp;TR.tool=null;TR.forme=[];TR.ann=[];TR.comm=[];
  q("tr-ed").classList.add("on");q("tr-tit").textContent=s.titolo;
  q("tr-invia").style.display=(!comeProp&&s.stato!=="inviata")?"":"none";
  var v=q("tr-v");v.pause();v.removeAttribute("src");
  var m=(s.sedute_media||[])[0];
  if(DEMO()){v.src=s._url||"";}
  else if(m){var u=await sb.storage.from(BK).createSignedUrl(m.path,3600);if(u.data)v.src=u.data.signedUrl;else toast("Non riesco a caricare il video");}
  await caricaAnn();trTools();trLista();trDisegnaTl();
  if(comeProp&&!DEMO()){try{await sb.from("sedute_condivisioni").update({visto_il:new Date().toISOString()}).eq("seduta_id",s.id).eq("user_id",currentUser.id);}catch(e){}}
 };
 async function caricaAnn(){
  if(DEMO()){TR.ann=TR.cur._ann||(TR.cur._ann=[]);TR.comm=TR.cur._comm||(TR.cur._comm=[]);return;}
  var a=await sb.from("sedute_annotazioni").select("*").eq("seduta_id",TR.cur.id).eq("nascosta",false).order("t_sec");TR.ann=a.data||[];
  var c=await sb.from("sedute_commenti").select("*").eq("seduta_id",TR.cur.id).order("created_at");TR.comm=c.data||[];
 }
 window.trChiudi=function(){var v=q("tr-v");if(v)v.pause();q("tr-ed").classList.remove("on");TR.cur=null;if(isTr()){trRenderHome();if(q("page-tr-sedute")&&q("page-tr-sedute").classList.contains("active"))trRenderSedute();}else if(typeof trOwnerCard==="function")trOwnerCard(true);};
 function puoAnnotare(){return !TR.owner||premium();}
 function trTools(){
  var t=q("tr-tools");if(!puoAnnotare()){t.innerHTML='<div style="font-size:12px;opacity:.8;padding:4px">Puoi guardare il video e rispondere ai punti. Per aggiungere i tuoi segni serve Premium.</div>';return;}
  var def=[["punto","Punto"],["voce","Voce"],["lente","Lente"],["lavagna","Lavagna"],["rallenta","Rallenta"]];
  t.innerHTML=def.map(function(d){return '<button data-t="'+d[0]+'" class="'+(TR.tool===d[0]?"on":"")+'" onclick="trTool(\''+d[0]+'\')">'+IC[d[0]]+d[1]+'</button>';}).join("");
 }
 window.trTool=function(t){
  var v=q("tr-v");
  if(t==="punto"){v.pause();diarioSheet("Punto a "+fmt(v.currentTime),'<textarea class="tr-field" id="trp-t" rows="3" placeholder="Cosa vuoi far notare?"></textarea><button class="btn btn-primary" style="width:100%" onclick="trSalvaPunto()">Salva il punto</button>');TR.tool=null;trTools();return;}
  if(t==="voce"){trVoce();return;}
  if(t==="rallenta"){trRallenta();return;}
  TR.tool=TR.tool===t?null:t;
  if(TR.tool==="lavagna"){v.pause();TR.forme=[];q("tr-lav").classList.add("on");}else q("tr-lav").classList.remove("on");
  if(TR.tool==="lente"){v.pause();toast("Trascina sul video per scegliere cosa ingrandire");}
  trTools();trDisegna();
 };
 async function aggiungiAnn(a){
  a.t_sec=Math.round(q("tr-v").currentTime*10)/10;
  if(DEMO()){a.id="da"+Date.now();a.autore_id=currentUser.id;a.created_at=new Date().toISOString();TR.ann.push(a);}
  else{
   a.seduta_id=TR.cur.id;a.media_id=((TR.cur.sedute_media||[])[0]||{}).id||null;
   var r=await sb.from("sedute_annotazioni").insert(a).select().single();if(r.error){toast("Non sono riuscito a salvare: "+(r.error.message||"errore"));return false;}
   TR.ann.push(r.data);
  }
  TR.ann.sort(function(x,y){return x.t_sec-y.t_sec;});trLista();trDisegnaTl();trDisegna();return true;
 }
 window.trSalvaPunto=async function(){var t=(q("trp-t").value||"").trim();if(!t){toast("Scrivi una nota");return;}if(await aggiungiAnn({tipo:"punto",testo:t,payload:{}}))closeModal("modal-dr-sheet");};
 async function trRallenta(){
  var v=q("tr-v");var da=v.currentTime,a=Math.min(v.duration||da+3,da+3);
  await aggiungiAnn({tipo:"rallenta",testo:"Rallentato",payload:{da:da,a:a,vel:.5}});toast("Questo tratto va a metà velocità");
 }
 window.trLenteSalva=async function(d){
  var x=Math.min(d.x,d.x2),y=Math.min(d.y,d.y2),w=Math.abs(d.x2-d.x),h=Math.abs(d.y2-d.y);
  TR.tool=null;trTools();await aggiungiAnn({tipo:"lente",testo:"Ingrandimento",payload:{x:x,y:y,w:w,h:h}});
 };
 window.trLavK=function(k){TR.lavK=k;[].forEach.call(document.querySelectorAll("#tr-lav button[data-k]"),function(b){b.classList.toggle("on",b.dataset.k===k);});};
 window.trLavC=function(c){TR.lavCol=c;};TR.lavCol="#e2ab45";
 window.trLavUndo=function(){TR.forme.pop();trDisegna();};
 window.trLavSalva=async function(){if(!TR.forme.length){toast("Disegna qualcosa prima");return;}var f=TR.forme.slice();TR.forme=[];TR.tool=null;q("tr-lav").classList.remove("on");await aggiungiAnn({tipo:"lavagna",testo:"Lavagna",payload:{forme:f}});trTools();};
 async function trVoce(){
  var v=q("tr-v");
  if(TR.rec){TR.rec.stop();return;}
  try{
   var st=await navigator.mediaDevices.getUserMedia({audio:true});v.pause();
   var ch=[],mr=new MediaRecorder(st);TR.rec=mr;toast("Registro… tocca di nuovo Voce per fermare (max 30 s)");
   mr.ondataavailable=function(e){ch.push(e.data);};
   var stop=setTimeout(function(){if(TR.rec)TR.rec.stop();},30000);
   mr.onstop=async function(){
    clearTimeout(stop);st.getTracks().forEach(function(t){t.stop();});TR.rec=null;
    var blob=new Blob(ch,{type:mr.mimeType||"audio/webm"});
    if(DEMO()){await aggiungiAnn({tipo:"voce",testo:"Nota vocale",payload:{},audio_path:URL.createObjectURL(blob)});return;}
    var p=currentUser.id+"/"+TR.cur.id+"/voce-"+Date.now()+".webm";
    var up=await sb.storage.from(BK).upload(p,blob,{contentType:blob.type});
    if(up.error){toast("Non sono riuscito a salvare la nota vocale");return;}
    await aggiungiAnn({tipo:"voce",testo:"Nota vocale",payload:{},audio_path:p});
   };
   mr.start();
  }catch(e){toast("Microfono non disponibile");TR.rec=null;}
 }
 window.trPlayVoce=async function(id){
  var a=TR.ann.find(function(x){return x.id===id;});if(!a||!a.audio_path)return;
  var u=a.audio_path;
  if(!DEMO()){var r=await sb.storage.from(BK).createSignedUrl(a.audio_path,600);if(!r.data)return;u=r.data.signedUrl;}
  new Audio(u).play();
 };
 window.trPlay=function(){var v=q("tr-v");if(v.paused)v.play();else v.pause();};
 window.trVel=function(x){TR.manVel=x;q("tr-v").playbackRate=x;[].forEach.call(document.querySelectorAll(".tr-ctl button[data-v]"),function(b){b.classList.toggle("on",Number(b.dataset.v)===x);});};
 window.trSalta=function(t){var v=q("tr-v");v.currentTime=t;};
 function trTick(){
  var v=q("tr-v");if(!v||!v.duration){return;}
  var t=v.currentTime;q("tr-t").textContent=fmt(t)+" / "+fmt(v.duration);q("tr-pr").style.width=(t/v.duration*100)+"%";
  // rallenta
  var rl=TR.ann.find(function(a){return a.tipo==="rallenta"&&t>=a.payload.da&&t<=a.payload.a;});
  if(!v.paused){var voluta=TR.manVel||1;v.playbackRate=rl?Math.min(voluta,rl.payload.vel||.5):voluta;}
  // punti vicini
  var ov=q("tr-ov");
  ov.innerHTML=TR.ann.filter(function(a){return a.tipo==="punto"&&Math.abs(a.t_sec-t)<=2;}).map(function(a){return '<div class="bl">'+esc(a.testo)+'</div>';}).join("");
  trDisegna();
 }
 function trDisegnaTl(){
  var tl=q("tr-tl"),v=q("tr-v");if(!tl)return;
  [].slice.call(tl.querySelectorAll(".pt,.rl")).forEach(function(n){n.remove();});
  var d=v.duration||0;if(!d)return;
  var col={punto:"#e2ab45",voce:"#7fb5ff",lente:"#58d68d",lavagna:"#ff8a65",rallenta:"#c0a0ff"};
  TR.ann.forEach(function(a){
   if(a.tipo==="rallenta"){var r=document.createElement("div");r.className="rl";r.style.left=(a.payload.da/d*100)+"%";r.style.width=((a.payload.a-a.payload.da)/d*100)+"%";tl.appendChild(r);}
   var p=document.createElement("div");p.className="pt";p.style.left=(a.t_sec/d*100)+"%";p.style.background=col[a.tipo]||"#fff";tl.appendChild(p);
  });
 }
 function trDisegna(){
  var cv=q("tr-cv"),v=q("tr-v");if(!cv||!v)return;
  var r=cv.getBoundingClientRect(),W=Math.round(r.width||300),H=Math.round(r.height||200);
  if(cv.width!==W||cv.height!==H){cv.width=W;cv.height=H;}
  var c=cv.getContext("2d");c.clearRect(0,0,W,H);
  var t=v.currentTime||0,forme=[];
  TR.ann.forEach(function(a){if(a.tipo==="lavagna"&&Math.abs(a.t_sec-t)<=1.2)forme=forme.concat(a.payload.forme||[]);});
  if(TR.tool==="lavagna")forme=forme.concat(TR.forme);
  forme.concat(TR.bozza&&TR.tool==="lavagna"?[{k:TR.lavK,c:TR.lavCol,x1:TR.bozza.x,y1:TR.bozza.y,x2:TR.bozza.x2,y2:TR.bozza.y2}]:[]).forEach(function(f){
   c.strokeStyle=f.c;c.fillStyle=f.c;c.lineWidth=3;c.lineCap="round";
   var x1=f.x1*W,y1=f.y1*H,x2=f.x2*W,y2=f.y2*H;
   if(f.k==="cerchio"){c.beginPath();c.ellipse((x1+x2)/2,(y1+y2)/2,Math.abs(x2-x1)/2,Math.abs(y2-y1)/2,0,0,7);c.stroke();}
   else{c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();
    if(f.k==="freccia"){var an=Math.atan2(y2-y1,x2-x1);c.beginPath();c.moveTo(x2,y2);c.lineTo(x2-14*Math.cos(an-.45),y2-14*Math.sin(an-.45));c.lineTo(x2-14*Math.cos(an+.45),y2-14*Math.sin(an+.45));c.closePath();c.fill();}}
  });
  if(TR.tool==="lente"&&TR.bozza){c.strokeStyle="#58d68d";c.setLineDash([6,4]);c.strokeRect(Math.min(TR.bozza.x,TR.bozza.x2)*W,Math.min(TR.bozza.y,TR.bozza.y2)*H,Math.abs(TR.bozza.x2-TR.bozza.x)*W,Math.abs(TR.bozza.y2-TR.bozza.y)*H);c.setLineDash([]);}
  // lente
  var le=TR.ann.find(function(a){return a.tipo==="lente"&&t>=a.t_sec&&t<=a.t_sec+3;}),lc=q("tr-lente");
  if(le&&v.videoWidth){var p=le.payload;lc.style.display="block";lc.width=240;lc.height=180;lc.getContext("2d").drawImage(v,p.x*v.videoWidth,p.y*v.videoHeight,p.w*v.videoWidth,p.h*v.videoHeight,0,0,240,180);}else lc.style.display="none";
 }
 setInterval(function(){var e=q("tr-ed");if(e&&e.classList.contains("on")&&!q("tr-v").paused)trDisegna();},120);
 var NOMI={punto:"Punto",voce:"Nota vocale",lente:"Ingrandimento",lavagna:"Lavagna",rallenta:"Rallentato"};
 function trLista(){
  var l=q("tr-list");if(!l)return;
  l.innerHTML=(TR.ann.length?TR.ann.map(function(a){
   var cm=TR.comm.filter(function(c){return c.annotazione_id===a.id;}).map(function(c){return '<small>'+(c.autore_id===currentUser.id?"Tu":"Risposta")+': '+esc(c.testo)+'</small>';}).join("");
   return '<div class="tr-an"><span class="tm" onclick="trSalta('+a.t_sec+')">'+fmt(a.t_sec)+'</span><div class="tx"><b>'+(NOMI[a.tipo]||a.tipo)+'</b>'+(a.testo&&a.tipo==="punto"?'<br>'+esc(a.testo):'')+cm+'</div>'+
    (a.tipo==="voce"?'<button onclick="trPlayVoce(\''+a.id+'\')">▶ Ascolta</button>':'')+
    '<button onclick="trRispondi(\''+a.id+'\')">Rispondi</button>'+
    (a.autore_id===currentUser.id?'<button onclick="trNascondi(\''+a.id+'\')">Nascondi</button>':'')+'</div>';
  }).join(""):'<div class="tr-vuoto" style="color:#fbf3e2;opacity:.7">'+(TR.owner?'Il trainer non ha ancora aggiunto segni.':'Nessun segno ancora. Metti in pausa e usa gli strumenti qui sopra.')+'</div>');
 }
 window.trRispondi=function(id){diarioSheet("Rispondi",'<textarea class="tr-field" id="trr-t" rows="3" placeholder="Scrivi la tua risposta"></textarea><button class="btn btn-primary" style="width:100%" onclick="trInviaRisposta(\''+id+'\')">Invia</button>');};
 window.trInviaRisposta=async function(id){
  var t=(q("trr-t").value||"").trim();if(!t)return;
  if(DEMO()){TR.comm.push({id:"dc"+Date.now(),annotazione_id:id,autore_id:currentUser.id,testo:t});}
  else{var r=await sb.from("sedute_commenti").insert({seduta_id:TR.cur.id,annotazione_id:id,testo:t}).select().single();if(r.error){toast("Non sono riuscito a inviare");return;}TR.comm.push(r.data);}
  closeModal("modal-dr-sheet");trLista();
 };
 window.trNascondi=async function(id){
  if(!(await chiediSiNo("Nascondere questo segno?","Sparisce dal video ma resta nello storico della seduta.")))return;
  if(!DEMO())await sb.from("sedute_annotazioni").update({nascosta:true}).eq("id",id);
  TR.ann=TR.ann.filter(function(a){return a.id!==id;});if(DEMO())TR.cur._ann=TR.ann;trLista();trDisegnaTl();trDisegna();
 };

 window.trInvia=async function(){
  var s=TR.cur;if(!s)return;
  var d;
  if(DEMO()){d={proprietario:{nome:"Giulia Verdi",stato:"attivo"},membri:[{user_id:"u1",nome:"Anna Neri",ruolo:"allievo"}]};}
  else{var r=await sb.rpc("equo_destinatari_seduta",{p_seduta:s.id});if(r.error){toast("Non riesco a leggere i destinatari");return;}d=r.data||{};}
  var p=d.proprietario,att=p&&p.stato==="attivo",h="";
  if(p&&att)h+='<label class="tr-dest"><input type="checkbox" checked disabled><span><b>'+esc(p.nome)+'</b><small>Proprietario · collegato</small></span></label>';
  else if(p)h+='<div class="tr-dest-nota"><b>'+esc(p.nome)+'</b> (proprietario) non riceverà la seduta: '+(p.stato==="in_attesa"?"non ha ancora accettato il collegamento.":p.stato==="revocato"?"il collegamento è stato chiuso.":"il cavallo non è collegato.")+'</div>';
  else h+='<div class="tr-dest-nota">Questo cavallo non ha un proprietario collegato su Equo.</div>';
  var ruoli={allievo:"Allievo",veterinario:"Veterinario",maniscalco:"Maniscalco",istruttore:"Istruttore"};
  (d.membri||[]).forEach(function(m){h+='<label class="tr-dest"><input type="checkbox" class="tri-m" value="'+esc(m.user_id)+'" onchange="trInviaAgg()"><span><b>'+esc(m.nome)+'</b><small>'+(ruoli[m.ruolo]||"Centro")+' del centro</small></span></label>';});
  h+='<div class="muted" style="font-size:12px;line-height:1.45;margin:8px 0">'+(premium()?'':'Userà uno slot di prova ('+((TR.slot.usati||0)+1)+' di 10) e non si cancella. ')+'Dopo l\'invio la seduta non torna bozza.</div><button class="btn btn-primary" id="tri-ok" style="width:100%" onclick="trInviaOk()">Invia la seduta</button>';
  if(!att&&!(d.membri||[]).length)h+='<div class="muted" style="font-size:12px;margin-top:8px">Per inviarla collega il cavallo dal tuo elenco «Cavalli seguiti».</div>';
  TR.destOk=!!att;
  diarioSheet("Inviare la seduta?",h);
  trInviaAgg();
 };
 window.trInviaAgg=function(){
  var b=q("tri-ok");if(!b)return;
  var n=document.querySelectorAll(".tri-m:checked").length;
  b.disabled=!(TR.destOk||n>0);
 };
 window.trInviaOk=async function(){
  var s=TR.cur;if(!s)return;
  var ids=[].slice.call(document.querySelectorAll(".tri-m:checked")).map(function(x){return x.value;});
  var b=q("tri-ok");if(b){b.disabled=true;b.textContent="Invio…";}
  if(DEMO()){s.stato="inviata";TR.slot.usati=(TR.slot.usati||0)+1;}
  else{
   var r=await sb.rpc("equo_invia_seduta",{p_seduta:s.id,p_destinatari:ids});
   if(r.error){var m=r.error.message||"";
    toast(/SLOT_ESAURITI/.test(m)?"Hai usato i 10 slot di prova.":/SENZA_VIDEO/.test(m)?"Aggiungi almeno un video.":/NESSUN_DESTINATARIO/.test(m)?"Nessun destinatario: il proprietario non ha ancora accettato il collegamento.":/DESTINATARIO_NON_VALIDO/.test(m)?"Destinatario non valido.":"Non sono riuscito a inviare: "+m);
    if(/SLOT/.test(m))trPrem();if(b){b.disabled=false;b.textContent="Invia la seduta";}return;}
   s.stato="inviata";var sl=await sb.rpc("equo_trainer_slot");if(sl.data)TR.slot=sl.data;try{await sb.rpc("equo_chat_scheda_seduta",{p_seduta:s.id});}catch(e){}
  }
  closeModal("modal-dr-sheet");q("tr-invia").style.display="none";toast("Seduta inviata");
 };
 // ----- vista proprietario (riceve e risponde)
 window.trOwnerCard=async function(forza){
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
 var _dhr2=window.diarioHomeRender;
 if(_dhr2)window.diarioHomeRender=async function(){var r=await _dhr2.apply(this,arguments);try{trOwnerCard(true);}catch(e){}return r;};
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
 var _pna=window.plNavAltri;
 window.plNavAltri=function(){if(isTr()){navTr();return;}var n=document.getElementById("bottom-nav-pro");if(n&&n.dataset.alt==="istr2"){delete n.dataset.alt;}return _pna&&_pna.apply(this,arguments);};
 if(typeof PL_TONI!=="undefined")PL_TONI.istr={"pro-home":1,"tr-sedute":2,"pro-inbox":4,"tr-agenda":5,"tr-cavalli":5};
 var _pcm=window.plCostruisciMenu;
 window.plCostruisciMenu=function(){
  if(!isTr()){var rr=_pcm.apply(this,arguments);try{if(typeof plRuolo==="function"&&plRuolo()==="owner"){var mm=document.getElementById("hm-menu-piu");if(mm)mm.insertAdjacentHTML("beforeend",plSez("Allenamento",[plTile(IC.film.replace("<svg","<svg class=\"hm-svg\""),"I miei istruttori","trCollOwner()")]));}}catch(e){}return rr;}
  var m=document.getElementById("hm-menu-piu");if(!m)return;
  m.innerHTML=plSez("Crea subito",[plTile(IC.film.replace("<svg","<svg class=\"hm-svg\""),"Nuova seduta","trNuova()",1),plTile(HM_IC.ferro,"Cavallo seguito","trNuovoCavallo()",1),plTile('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="hm-svg"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',"Nuova lezione","trLezForm()",1)])+
   plSez("Vai a",[plTile(HM_IC.ferro,"Cavalli seguiti","showPage('tr-cavalli')"),plTile(HM_IC.inbox,"Messaggi","showPage('pro-inbox'); loadColleghiList();"),plTile(HM_IC.qr,"Il mio codice","trMioCodice()"),plTile(HM_IC.aiuto,"Serve aiuto?","apriTicketAssistenza()")]);
  m.classList.add("pl-menu");
 };
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
 // ----- Agenda
 window.trRenderAgenda=async function(){
  var p=pagina("tr-agenda");if(!TR.caricato)await carica();if(!T2.loadedL)await caricaLez();
  if(!T2.week){T2.week=lun(new Date());T2.sel=iso(new Date());}
  var oggi=iso(new Date()),days="",i;
  for(i=0;i<7;i++){var d=new Date(T2.week);d.setDate(d.getDate()+i);var k=iso(d),has=T2.lez.some(function(l){return l.data===k&&l.stato!=="annullata";});
   days+='<button class="tr2-d'+(k===T2.sel?' on':'')+(has?' h':'')+'" onclick="trAgGiorno(\''+k+'\')"><small>'+GG[d.getDay()]+'</small><b>'+d.getDate()+'</b><i></i></button>';}
  var fine=new Date(T2.week);fine.setDate(fine.getDate()+6);
  var tit=T2.week.getDate()+" "+MESI[T2.week.getMonth()].slice(0,3)+" – "+fine.getDate()+" "+MESI[fine.getMonth()].slice(0,3)+" "+fine.getFullYear();
  var del=T2.lez.filter(function(l){return l.data===T2.sel&&l.stato!=="annullata";}).sort(function(a,b){return hh(a.ora)<hh(b.ora)?-1:1;});
  var h='<div class="tr-h" style="display:flex;justify-content:space-between;align-items:center"><span>Agenda</span><button class="tr-btn" onclick="trLezForm()">+ Lezione</button></div>'+
   '<div class="tr-sub" style="display:flex;align-items:center;gap:8px"><button class="tr2-nv" onclick="trAgSett(-1)" aria-label="Settimana precedente">‹</button><span style="flex:1;text-align:center">'+tit+'</span><button class="tr2-nv" onclick="trAgSett(1)" aria-label="Settimana successiva">›</button></div>'+
   '<div class="tr2-week">'+days+'</div>'+
   '<div class="tr2-et">'+(T2.sel===oggi?"Oggi · ":"")+dataLunga(T2.sel)+'</div>';
  if(!del.length)h+='<div class="tr-card"><div class="tr-vuoto">Nessuna lezione in questo giorno.<br>Tocca «+ Lezione» per aggiungerne una.</div></div>';
  else h+=del.map(function(l){var pr=proprDi(l),cls=l.stato==="proposta"||l.stato==="altro_orario"?"pr":l.stato==="solo_tua"?"so":"";
   return '<div class="tr2-les" onclick="trLezApri(\''+l.id+'\')"><div class="t">'+hh(l.ora)+'<small>'+l.durata_min+' min</small></div><div class="c '+cls+'"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><b>'+esc(l.cavallo_nome)+'</b>'+chipL(l.stato)+'</div><div class="muted" style="font-size:12.5px;margin-top:2px">'+(pr?esc(pr)+' · ':'')+(TIPI[l.tipo]||"Lezione")+(l.luogo?' · '+esc(l.luogo):'')+'</div></div></div>';}).join("");
  p.innerHTML=h;
 };
 window.trAgGiorno=function(k){T2.sel=k;trRenderAgenda();};
 window.trAgSett=function(n){T2.week.setDate(T2.week.getDate()+7*n);T2.sel=iso(T2.week);trRenderAgenda();};
 // ----- Nuova / modifica lezione
 window.trLezForm=function(id,cavId){
  if(!TR.cavalli.length){toast("Aggiungi prima un cavallo da seguire");showPage("tr-cavalli");return;}
  var l=id?T2.lez.find(function(x){return x.id===id;}):null;
  T2.form={dur:l?l.durata_min:45,tipo:l?l.tipo:"lezione",id:id||null};
  var cur=l?l.cavallo_id:(cavId||TR.cavalli[0].id);
  var opt=TR.cavalli.map(function(c){return '<option value="'+c.id+'"'+(c.id===cur?' selected':'')+'>'+esc(c.nome)+(c.cavaliere?' · '+esc(c.cavaliere):'')+'</option>';}).join("");
  var sed=TR.sedute.map(function(s){return '<option value="'+s.id+'"'+(l&&l.seduta_id===s.id?' selected':'')+'>'+esc(s.titolo)+'</option>';}).join("");
  var luogoDef=l?l.luogo||"":((TR.centri||[])[0]?TR.centri[0].nome:"");
  function ch(g,v,t,on){return '<button type="button" class="tr2-ch'+(on?' on':'')+'" data-g="'+g+'" data-v="'+v+'" onclick="trLezCh(\''+g+'\',\''+v+'\')">'+t+'</button>';}
  var durs=[30,45,60,90].map(function(m){return ch("dur",m,m===60?"1 h":m===90?"1 h 30":m+" min",m===T2.form.dur);}).join("");
  var tipi=Object.keys(TIPI).map(function(k){return ch("tipo",k,TIPI[k],k===T2.form.tipo);}).join("");
  diarioSheet(l?"Modifica lezione":"Nuova lezione",
   '<label class="tr2-l">Cavallo</label><select class="tr-field" id="trl-c" onchange="trLezCav()">'+opt+'</select>'+
   '<div style="display:flex;gap:10px"><div style="flex:1"><label class="tr2-l">Data</label><input type="date" class="tr-field" id="trl-d" value="'+(l?l.data:T2.sel||iso(new Date()))+'"></div><div style="width:120px"><label class="tr2-l">Ora</label><input type="time" class="tr-field" id="trl-o" value="'+(l?hh(l.ora):"09:00")+'"></div></div>'+
   '<label class="tr2-l">Durata</label><div class="tr2-chs">'+durs+'</div>'+
   '<label class="tr2-l">Tipo</label><div class="tr2-chs">'+tipi+'</div>'+
   '<div style="display:flex;gap:10px"><div style="flex:1"><label class="tr2-l">Luogo</label><input class="tr-field" id="trl-l" placeholder="es. Maneggio Blu" value="'+esc(luogoDef)+'"></div><div style="width:130px"><label class="tr2-l">Ripeti</label><select class="tr-field" id="trl-r"><option value="mai"'+(l&&l.ripeti==="mai"?' selected':'')+'>Mai</option><option value="settimanale"'+(l&&l.ripeti==="settimanale"?' selected':'')+'>Ogni sett.</option></select></div></div>'+
   '<label class="tr2-l">Seduta video (facoltativa)</label><select class="tr-field" id="trl-s"><option value="">Nessuna</option>'+sed+'</select>'+
   '<textarea class="tr-field" id="trl-n" rows="2" placeholder="Note per te">'+esc(l?l.note||"":"")+'</textarea>'+
   '<div id="trl-pbox"></div>'+
   '<button class="btn btn-primary" style="width:100%" id="trl-ok" onclick="trLezSalva()">Salva lezione</button>');
  window.trLezCav(l?l.stato!=="solo_tua":true);
 };
 window.trLezCh=function(g,v){
  if(g==="dur")T2.form.dur=+v;else T2.form.tipo=v;
  [].forEach.call(document.querySelectorAll('#dr-sheet-b .tr2-ch[data-g="'+g+'"]'),function(b){b.classList.toggle("on",b.dataset.v===String(v));});
 };
 window.trLezCav=function(forzaOn){
  var cv=TR.cavalli.find(function(c){return c.id===(q("trl-c")||{}).value;}),c=collCav(cv),box=q("trl-pbox"),ok=q("trl-ok");if(!box)return;
  var prev=q("trl-p");var on=prev?prev.checked:(forzaOn===undefined?true:!!forzaOn);
  if(c){box.innerHTML='<label class="tr2-prop"><input type="checkbox" id="trl-p" '+(on?'checked':'')+' onchange="trLezPBtn()"><span><b>Proponi a '+esc(c.proprietario)+'</b><small>Riceve la proposta in chat e conferma o chiede un altro orario.</small></span></label>';}
  else box.innerHTML='<div class="muted" style="font-size:12.5px;line-height:1.5;margin:2px 0 10px">Il proprietario di questo cavallo non è collegato: la lezione resta solo tua, come promemoria.</div>';
  window.trLezPBtn();
 };
 window.trLezPBtn=function(){var ok=q("trl-ok"),p=q("trl-p");if(ok)ok.textContent=p&&p.checked?"Salva e invia la proposta":"Salva lezione";};
 window.trLezSalva=async function(){
  var cid=q("trl-c").value,d=q("trl-d").value,o=q("trl-o").value;
  if(!cid||!d||!o){toast("Scegli cavallo, data e ora");return;}
  var p=q("trl-p"),prop=!!(p&&p.checked),cv=TR.cavalli.find(function(c){return c.id===cid;}),btn=q("trl-ok");btn.disabled=true;
  var args={p_id:T2.form.id,p_cavallo:cid,p_data:d,p_ora:o,p_durata:T2.form.dur,p_tipo:T2.form.tipo,p_luogo:q("trl-l").value,p_ripeti:q("trl-r").value,p_note:q("trl-n").value,p_proponi:prop,p_seduta:q("trl-s").value||null};
  var stato=prop?"proposta":"solo_tua",c=collCav(cv);
  if(DEMO()){
   var l=T2.form.id?T2.lez.find(function(x){return x.id===T2.form.id;}):null;
   if(!l){l={id:"dl"+Date.now(),trainer_id:"demo-user"};T2.lez.push(l);}
   Object.assign(l,{cavallo_id:cid,horse_id:cv.horse_id||null,collegamento_id:c?c.id:null,cavallo_nome:cv.nome,tipo:args.p_tipo,data:d,ora:o,durata_min:args.p_durata,luogo:args.p_luogo,ripeti:args.p_ripeti,note:args.p_note,stato:stato,seduta_id:args.p_seduta});
  }else{
   var r=await sb.rpc("equo_lezione_salva",args);
   if(r.error){btn.disabled=false;var m=r.error.message||"";toast(/NESSUN_PROPRIETARIO/.test(m)?"Il proprietario non è collegato: salva la lezione come solo tua.":/LEZIONE_ANNULLATA/.test(m)?"Questa lezione è stata annullata.":"Non sono riuscito a salvare: "+m);return;}
   stato=r.data&&r.data.stato||stato;
  }
  closeModal("modal-dr-sheet");T2.sel=d;T2.week=lun(pIso(d));await caricaLez();
  toast(stato==="proposta"?"Proposta inviata a "+(c?c.proprietario:"il proprietario"):"Lezione salvata");
  if(q("page-tr-agenda")&&q("page-tr-agenda").classList.contains("active"))trRenderAgenda();
  if(q("page-pro-home")&&q("page-pro-home").classList.contains("active"))trRenderHome();
  if(T2.cur)chatCarica(true);
 };
 window.trLezApri=function(id){
  var l=T2.lez.find(function(x){return x.id===id;});if(!l)return;
  var c=l.collegamento_id?collId(l.collegamento_id,"trainer"):null,att=c&&c.stato==="attivo";
  var s=l.seduta_id?TR.sedute.find(function(x){return x.id===l.seduta_id;}):null;
  function r(a,b){return '<div style="display:flex;justify-content:space-between;gap:10px;font-size:14px;padding:5px 0"><span class="muted">'+a+'</span><b style="text-align:right">'+b+'</b></div>';}
  var h='<div style="margin-bottom:6px">'+chipL(l.stato)+'</div>'+
   r("Quando",dataLunga(l.data)+" · "+hh(l.ora)+"–"+fineOra(l.ora,l.durata_min))+r("Tipo",TIPI[l.tipo]||"Lezione")+(l.luogo?r("Luogo",esc(l.luogo)):"")+(c?r("Proprietario",esc(c.proprietario)+(att?" · collegato":"")):"")+(l.ripeti==="settimanale"?r("Ripete","Ogni settimana"):"")+
   (s?'<div class="tr-riga" style="margin-top:8px" onclick="closeModal(\'modal-dr-sheet\');trApri(\''+s.id+'\')"><div class="th">'+IC.film+'</div><div><b>'+esc(s.titolo)+'</b><small>Seduta video collegata</small></div></div>':"")+
   (l.note?'<div class="muted" style="font-size:13px;line-height:1.5;margin:8px 0">'+esc(l.note)+'</div>':"")+
   (l.stato==="altro_orario"?'<div style="font-size:13px;line-height:1.5;margin:8px 0;color:#8a6516"><b>'+esc(c?c.proprietario:"Il proprietario")+'</b> chiede un altro orario: scrivigli in chat e poi sposta la lezione.</div>':"")+
   '<div style="display:flex;flex-direction:column;gap:8px;margin-top:12px">'+
   (att?'<button class="btn btn-primary" style="width:100%" onclick="closeModal(\'modal-dr-sheet\');trChatApri(\''+c.id+'\',\'trainer\')">Scrivi a '+esc(c.proprietario)+'</button>':"")+
   '<div style="display:flex;gap:8px"><button class="btn btn-outline" style="flex:1" onclick="trLezForm(\''+l.id+'\')">Sposta o modifica</button><button class="btn btn-outline" style="flex:1;color:#a03028;border-color:#a03028" onclick="trLezAnnulla(\''+l.id+'\')">Annulla lezione</button></div></div>';
  diarioSheet("Lezione · "+esc(l.cavallo_nome),h);
 };
 window.trLezAnnulla=async function(id){
  if(!(await chiediSiNo("Annullare la lezione?","Se era stata proposta al proprietario, lui vede l'annullamento in chat.")))return;
  if(DEMO()){var l=T2.lez.find(function(x){return x.id===id;});if(l)l.stato="annullata";T2.lez=T2.lez.filter(function(x){return x.stato!=="annullata";});}
  else{var r=await sb.rpc("equo_lezione_annulla",{p_id:id});if(r.error){toast("Non sono riuscito ad annullare");return;}await caricaLez();}
  closeModal("modal-dr-sheet");toast("Lezione annullata");trRenderAgenda();if(T2.cur)chatCarica(true);
 };
 // Home: prossime lezioni
 var _trh=window.trRenderHome;
 window.trRenderHome=async function(){
  await _trh.apply(this,arguments);
  try{
   caricaMsgTutti().then(badgeInbox).catch(function(){});
   if(!T2.loadedL)await caricaLez();
   var box=q("tr-home"),cta=box&&box.querySelector(".tr-cta");if(!cta)return;
   var old=q("tr2-hl");if(old)old.remove();
   var oggi=iso(new Date()),p=T2.lez.filter(function(l){return l.data>=oggi&&l.stato!=="annullata";}).sort(function(a,b){return (a.data+hh(a.ora))<(b.data+hh(b.ora))?-1:1;}).slice(0,3);
   var d=document.createElement("div");d.id="tr2-hl";d.className="tr-card";
   d.innerHTML='<h4><span>Prossime lezioni</span><button onclick="showPage(\'tr-agenda\')">Agenda ›</button></h4>'+(p.length?p.map(function(l){return '<div class="tr-riga" onclick="trLezApri(\''+l.id+'\')"><div class="th" style="font-size:11px;font-weight:800;line-height:1.1;text-align:center">'+hh(l.ora)+'</div><div><b>'+esc(l.cavallo_nome)+'</b><small>'+(l.data===oggi?"Oggi":dataLunga(l.data))+' · '+(TIPI[l.tipo]||"Lezione")+'</small></div>'+chipL(l.stato)+'</div>';}).join(""):'<div class="muted" style="font-size:12.5px">Nessuna lezione in programma. <a href="#" onclick="trLezForm();return false" style="color:#8a6516;font-weight:800">Aggiungine una</a></div>');
   cta.insertAdjacentElement("afterend",d);
  }catch(e){console.error(e);}
 };
 // ----- Chat con i proprietari
 function chatSez(){
  var pg=q("page-pro-inbox");if(!pg)return null;
  var s=pg.querySelector('.chat-sez[data-sez="proprietari"]');
  if(!s){s=document.createElement("div");s.className="chat-sez";s.dataset.sez="proprietari";s.id="tr-chatprop";var col=pg.querySelector('.chat-sez[data-sez="colleghi"]');col.parentNode.insertBefore(s,col);}
  return s;
 }
 async function caricaMsgTutti(){
  var ids=collT2().map(function(c){return c.id;});
  if(DEMO()){demoSeed();T2.msgs=T2.dm;return;}
  if(!ids.length){T2.msgs={};return;}
  var r=await sb.from("trainer_messaggi").select("*").in("collegamento_id",ids).order("created_at",{ascending:false}).limit(600);
  var g={};(r.data||[]).forEach(function(m){(g[m.collegamento_id]=g[m.collegamento_id]||[]).unshift(m);});T2.msgs=g;
 }
 function nonLetti(cid){return (T2.msgs[cid]||[]).filter(function(m){return !m.letto&&m.mittente_id!==currentUser.id;}).length;}
 function badgeInbox(){
  var n=Object.keys(T2.msgs).reduce(function(t,k){return t+nonLetti(k);},0);
  if(typeof chatContatori!=="undefined"){chatContatori.proprietari={n:collT2().filter(function(c){return c.stato==="attivo";}).length,nonLetti:n};}
  var b=document.getElementById("inbox-nav-badge");if(b&&isTr()){b.textContent=n>9?"9+":String(n);b.style.display=n>0?"":"none";}
 }
 window.trRenderChatProp=async function(forza){
  var s=chatSez();if(!s)return;
  if(!TR.caricato)await carica();
  if(forza||Date.now()-T2.lastFetch>4000){T2.lastFetch=Date.now();await caricaMsgTutti();badgeInbox();}
  var righe=collT2().map(function(c){var m=T2.msgs[c.id]||[],ul=m[m.length-1];return {c:c,m:ul,t:ul?ul.created_at:c.created_at,n:nonLetti(c.id)};})
   .filter(function(x){return x.c.stato==="attivo"||x.m||x.c.stato.indexOf("da_confermare")===0;}).sort(function(a,b){return a.t<b.t?1:-1;});
  var h='<div class="card" style="margin-bottom:14px">'+(righe.length?righe.map(function(x){
   var c=x.c,att=c.stato==="attivo",prev=x.m?(x.m.tipo==="seduta"?"Seduta inviata":x.m.tipo==="lezione"?"Proposta di lezione":(x.m.mittente_id===currentUser.id?"Tu: ":"")+(x.m.testo||"")):(att?"Inizia la conversazione":c.stato==="revocato"?"Collegamento interrotto":c.da_rispondere?"Invito da accettare in Cavalli seguiti":"In attesa che accetti");
   return '<div class="inbox-item'+(x.n?' unread':'')+'"'+(att||x.m?' onclick="trChatApri(\''+c.id+'\',\'trainer\')"':' style="opacity:.75"')+'><div class="horse-avatar" style="font-weight:800;font-size:14px">'+esc(iniz(c.proprietario))+'</div><div style="flex:1;min-width:0"><div class="inbox-name" style="font-size:14px">'+esc(c.proprietario)+'</div><div class="muted" style="font-size:11.5px;color:#8a6516;font-weight:700">'+esc(c.cavallo)+'</div><div class="inbox-preview muted" style="font-size:12.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+esc(prev)+'</div></div>'+(x.n?'<span class="inbox-unread-dot"></span>':'')+'</div>';}).join(""):'<div class="muted" style="font-size:13px;line-height:1.6;text-align:center;padding:6px 0">Nessun proprietario collegato ancora.<br>Collega un cavallo da «Cavalli seguiti»: quando il proprietario accetta potete scrivervi qui.</div>')+'</div>'+
   '<div class="muted" style="font-size:12px;line-height:1.6;text-align:center">Si scrive solo con i proprietari collegati. Se il proprietario interrompe il collegamento, lo storico resta ma non si può più scrivere.</div>';
  s.innerHTML=h;
  try{_rcc.call(window);}catch(e){}
 };
 var _rcc=window.renderChatCartelle;
 window.renderChatCartelle=function(){
  _rcc.apply(this,arguments);
  if(isTr()){chatSez();trRenderChatProp();}
 };
 // schermata chat (allenatore e proprietario)
 function ensureChat(){
  if(q("tr2-chat"))return;
  var d=document.createElement("div");d.id="tr2-chat";d.className="tr2-chat";
  d.innerHTML='<div class="tr2-ct"><button class="tr2-bk" onclick="trChatChiudi()" aria-label="Indietro">‹</button><div class="tr2-av" id="tr2-av"></div><div style="flex:1;min-width:0"><b id="tr2-cn" style="font-size:16px;display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis"></b><small id="tr2-cc" style="font-size:12px;color:#8a6516;font-weight:700"></small></div><span class="tr-chip i" id="tr2-st">Collegato</span></div>'+
   '<div class="tr2-cm" id="tr2-cm"></div><div class="tr2-nota" id="tr2-nota" style="display:none"></div>'+
   '<div class="tr2-cp" id="tr2-cp"><button class="tr2-pl" id="tr2-pl" onclick="trChatPlus()" aria-label="Allega">+</button><input id="tr2-in" placeholder="Scrivi un messaggio…" autocomplete="off" onkeydown="if(event.key===\'Enter\')trChatInvia()"><button class="tr2-sd" onclick="trChatInvia()" aria-label="Invia">→</button></div>';
  document.body.appendChild(d);
 }
 function chatInfo(cid,ruolo){
  var c=collId(cid,ruolo)||{};
  return ruolo==="owner"?{nome:c.trainer||"Istruttore",sotto:"Il tuo istruttore"+(c.cavallo?" · segue "+c.cavallo:""),att:c.stato==="attivo",horse:c.horse_id}:{nome:c.proprietario||"Proprietario",sotto:"Proprietario di "+(c.cavallo||"il cavallo"),att:c.stato==="attivo",horse:c.horse_id};
 }
 window.trChatApri=async function(cid,ruolo){
  ensureChat();T2.cur={id:cid,ruolo:ruolo,n:-1};var i=chatInfo(cid,ruolo);
  q("tr2-cn").textContent=i.nome;q("tr2-cc").textContent=i.sotto;q("tr2-av").textContent=iniz(i.nome);
  var st=q("tr2-st");st.textContent=i.att?"Collegato":"Interrotto";st.className="tr-chip "+(i.att?"i":"n");
  q("tr2-cp").style.display=i.att?"flex":"none";q("tr2-nota").style.display=i.att?"none":"block";
  q("tr2-nota").textContent="Collegamento interrotto: puoi rileggere lo storico ma non scrivere.";
  q("tr2-pl").style.display=ruolo==="trainer"?"":"none";
  q("tr2-cm").innerHTML='<div class="loading"><div class="spinner"></div></div>';
  q("tr2-chat").classList.add("on");
  await chatCarica(true);
  clearInterval(T2.poll);T2.poll=setInterval(function(){chatCarica(false);},6000);
 };
 window.trChatChiudi=function(){
  clearInterval(T2.poll);var c=T2.cur;T2.cur=null;var e=q("tr2-chat");if(e)e.classList.remove("on");
  if(c&&c.ruolo==="trainer"){trRenderChatProp(true);}else if(c){trOwnerLezCard();}
 };
 async function carSed(ids){
  var mancano=ids.filter(function(i){return !T2.sed[i]&&!TR.sedute.find(function(s){return s.id===i;})&&!(TR.ricevute||[]).find(function(s){return s.id===i;});});
  if(!mancano.length||DEMO())return;
  var r=await sb.from("sedute").select("id,titolo,stato,inviata_il,horse_id,created_at,sedute_media(id,path,durata_s)").in("id",mancano);
  (r.data||[]).forEach(function(s){T2.sed[s.id]=s;TR.ricevute=TR.ricevute||[];if(!TR.ricevute.find(function(x){return x.id===s.id;}))TR.ricevute.push(Object.assign({},s,{_nuova:false}));});
 }
 async function carLez(ids){
  var mancano=ids.filter(function(i){return !T2.lezC[i];});
  if(DEMO()){T2.lez.forEach(function(l){T2.lezC[l.id]=l;});return;}
  if(!mancano.length)return;
  var r=await sb.from("trainer_lezioni").select("*").in("id",mancano);(r.data||[]).forEach(function(l){T2.lezC[l.id]=l;});
 }
 async function chatCarica(forza){
  var cur=T2.cur;if(!cur)return;var m;
  if(DEMO()){demoSeed();m=T2.dm[cur.id]=T2.dm[cur.id]||[];}
  else{var r=await sb.from("trainer_messaggi").select("*").eq("collegamento_id",cur.id).order("created_at").limit(300);m=r.data||[];}
  if(!T2.cur||T2.cur.id!==cur.id)return;
  var cambia=forza||m.length!==cur.n||m.some(function(x,i){return false;});
  T2.msgs[cur.id]=m;
  if(!cambia){return;}
  cur.n=m.length;
  await carSed(m.filter(function(x){return x.tipo==="seduta"&&x.seduta_id;}).map(function(x){return x.seduta_id;}));
  await carLez(m.filter(function(x){return x.tipo==="lezione"&&x.lezione_id;}).map(function(x){return x.lezione_id;}));
  chatDisegna();
  var nl=m.some(function(x){return !x.letto&&x.mittente_id!==currentUser.id;});
  if(nl){m.forEach(function(x){if(x.mittente_id!==currentUser.id)x.letto=true;});if(!DEMO()){try{await sb.rpc("equo_chat_letti",{p_coll:cur.id});}catch(e){}}badgeInbox();}
 }
 function ora(t){var d=new Date(t);return String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0");}
 function chatDisegna(){
  var cur=T2.cur,box=q("tr2-cm");if(!cur||!box)return;
  var m=T2.msgs[cur.id]||[],vicino=box.scrollHeight-box.scrollTop-box.clientHeight<120||!box.children.length,ultimoG="",h="";
  if(!m.length)h='<div class="tr-vuoto">Nessun messaggio.<br>'+(cur.ruolo==="trainer"?"Scrivi al proprietario o proponi una lezione.":"Scrivi al tuo istruttore.")+'</div>';
  m.forEach(function(x){
   var d=new Date(x.created_at),g=d.getDate()+" "+MESI[d.getMonth()];
   if(g!==ultimoG){ultimoG=g;h+='<div class="tr2-g">'+(iso(d)===iso(new Date())?"Oggi":g)+'</div>';}
   var me=x.mittente_id===currentUser.id,cl=me?"me":"lei";
   if(x.tipo==="seduta"){var s=TR.sedute.find(function(z){return z.id===x.seduta_id;})||T2.sed[x.seduta_id]||(TR.ricevute||[]).find(function(z){return z.id===x.seduta_id;})||{};var dur=((s.sedute_media||[])[0]||{}).durata_s;
    h+='<div class="tr2-b '+cl+' sc" onclick="trApri(\''+x.seduta_id+'\','+(cur.ruolo==="owner"?"true":"false")+')"><div class="th">'+IC.film+'</div><div><b>'+esc(s.titolo||"Seduta")+'</b><small>'+(dur?fmt(dur)+' · ':'')+'Guarda la seduta</small></div></div>';}
   else if(x.tipo==="lezione"){var l=T2.lezC[x.lezione_id];
    if(!l)h+='<div class="tr2-b '+cl+'">Proposta di lezione</div>';
    else{var pend=l.stato==="proposta"&&cur.ruolo==="owner";
     h+='<div class="tr2-b '+cl+' lc"><small>'+(me?'PROPOSTA DI LEZIONE':'TI PROPONE UNA LEZIONE')+'</small><b>'+dataLunga(l.data)+' · '+hh(l.ora)+'–'+fineOra(l.ora,l.durata_min)+'</b><span>'+esc(l.cavallo_nome)+(l.luogo?' · '+esc(l.luogo):'')+(l.ripeti==="settimanale"?' · ogni settimana':'')+'</span>'+
      (pend?'<div class="az"><button class="tr-btn" onclick="trLezRisp(\''+l.id+'\',true)">Conferma</button><button class="tr-btn o" onclick="trLezRisp(\''+l.id+'\',false)">Altro orario</button></div>':'<em>'+({proposta:"In attesa di risposta",confermata:"Confermata",altro_orario:"Chiesto un altro orario",annullata:"Annullata",solo_tua:""}[l.stato]||"")+'</em>')+'</div>';}}
   else h+='<div class="tr2-b '+cl+'">'+esc(x.testo||"")+'<small class="tr2-o">'+ora(x.created_at)+'</small></div>';
  });
  box.innerHTML=h;if(vicino)box.scrollTop=box.scrollHeight;
 }
 window.trChatInvia=async function(){
  var cur=T2.cur,i=q("tr2-in");if(!cur||!i)return;var t=(i.value||"").trim();if(!t)return;i.value="";
  if(DEMO()){(T2.dm[cur.id]=T2.dm[cur.id]||[]).push({id:"m"+Date.now(),collegamento_id:cur.id,mittente_id:currentUser.id,tipo:"testo",testo:t,letto:true,created_at:new Date().toISOString()});}
  else{var r=await sb.rpc("equo_chat_invia",{p_coll:cur.id,p_testo:t});
   if(r.error){i.value=t;toast(/NON_ATTIVO/.test(r.error.message||"")?"Il collegamento è stato interrotto: non si può più scrivere.":"Non sono riuscito a inviare");return;}}
  await chatCarica(true);
 };
 window.trChatPlus=function(){
  var cur=T2.cur;if(!cur||cur.ruolo!=="trainer")return;
  diarioSheet("Allega alla chat",'<button class="tr-riga" style="width:100%;text-align:left;background:none;border:0;border-bottom:1px solid var(--border)" onclick="trChatSedute()"><div class="th">'+IC.film+'</div><div><b>Una seduta già inviata</b><small>La seduta compare come scheda nella chat</small></div></button>'+
   '<button class="tr-riga" style="width:100%;text-align:left;background:none;border:0" onclick="trChatLezione()"><div class="th" style="font-weight:800">+</div><div><b>Proponi una lezione</b><small>Il proprietario conferma o chiede un altro orario</small></div></button>'+
   '<div class="muted" style="font-size:12px;margin-top:10px">Foto, video e vocali nella chat arriveranno con Premium.</div>');
 };
 window.trChatLezione=function(){var cur=T2.cur,c=collId(cur.id,"trainer")||{},cv=TR.cavalli.find(function(x){return x.horse_id&&x.horse_id===c.horse_id;});closeModal("modal-dr-sheet");trLezForm(null,cv&&cv.id);};
 window.trChatSedute=function(){
  var c=collId(T2.cur.id,"trainer")||{},l=TR.sedute.filter(function(s){return s.stato==="inviata"&&s.horse_id&&s.horse_id===c.horse_id;});
  diarioSheet("Scegli la seduta",l.length?l.map(function(s){return '<div class="tr-riga" onclick="trChatSeduta(\''+s.id+'\')"><div class="th">'+IC.film+'</div><div><b>'+esc(s.titolo)+'</b><small>'+formatDate(s.inviata_il||s.created_at)+'</small></div></div>';}).join(""):'<div class="tr-vuoto">Nessuna seduta inviata per questo cavallo.<br>Invia prima una seduta dall\'editor.</div>');
 };
 window.trChatSeduta=async function(sid){
  closeModal("modal-dr-sheet");
  if(DEMO()){(T2.dm[T2.cur.id]=T2.dm[T2.cur.id]||[]).push({id:"m"+Date.now(),collegamento_id:T2.cur.id,mittente_id:currentUser.id,tipo:"seduta",seduta_id:sid,letto:true,created_at:new Date().toISOString()});}
  else{var r=await sb.rpc("equo_chat_scheda_seduta",{p_seduta:sid});if(r.error){toast("Non sono riuscito ad allegare la seduta");return;}if(!r.data)toast("Questa seduta è già nella chat");}
  await chatCarica(true);
 };
 window.trLezRisp=async function(id,ok){
  if(DEMO()){var l=T2.lezC[id];if(l)l.stato=ok?"confermata":"altro_orario";}
  else{var r=await sb.rpc("equo_lezione_rispondi",{p_id:id,p_accetta:ok});if(r.error){toast(/NON_ATTIVO/.test(r.error.message||"")?"Il collegamento è stato interrotto.":"Operazione non riuscita");return;}delete T2.lezC[id];}
  toast(ok?"Lezione confermata":"Hai chiesto un altro orario");
  if(T2.cur)await chatCarica(true);trOwnerLezCard();
 };
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
 var _toc=window.trOwnerCard;
 window.trOwnerCard=async function(){var r=await _toc.apply(this,arguments);try{await trOwnerLezCard();}catch(e){}return r;};

 try{["tr-sedute","tr-cavalli","tr-agenda"].forEach(pagina);}catch(e){}
})();
