// Equo App · allenatore · modulo "chat-con-i-proprietari" (moduli ES, costruiti con Vite in ruoli/allenatore/costruito.js)
import { T2, TR } from "./stato.js";
import { DEMO, IC, esc, fmt, isTr, q, toast } from "./00-strumenti.js";
import { carica } from "./01-dati.js";
import { MESI, collId, collT2, dataLunga, demoSeed, fineOra, hh, iniz, iso } from "./10-barra-e-pagine-del-trainer.js";
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
  try{renderChatCartelleBase.call(window);}catch(e){}
 };
 estendiDopo("renderChatCartelle",function(){if(isTr()){chatSez();trRenderChatProp();}});
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

export { badgeInbox, caricaMsgTutti, chatCarica };
