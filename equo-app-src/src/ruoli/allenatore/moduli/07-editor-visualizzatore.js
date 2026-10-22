// Equo App · allenatore · modulo "editor-visualizzatore" (moduli ES, costruiti con Vite in ruoli/allenatore/costruito.js)
import { BK, DEMO, IC, TR, esc, fmt, isTr, q, toast } from "./00-strumenti.js";
import { premium } from "./01-dati.js";
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
