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
