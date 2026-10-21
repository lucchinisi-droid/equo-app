
(function(){
 var IC={foto:'<svg viewBox="0 0 24 24"><use href="#i-camera"/></svg>',vocale:'<svg viewBox="0 0 24 24"><use href="#i-mic"/></svg>',
  nota:'<svg viewBox="0 0 24 24"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/></svg>',
  video:'<svg viewBox="0 0 24 24"><rect x="3" y="6" width="13" height="12" rx="2"/><path d="m16 10 5-3v10l-5-3"/></svg>'};
 var ICK={pren:'<svg viewBox="0 0 24 24"><use href="#i-calendar"/></svg>',msg:'<svg viewBox="0 0 24 24"><use href="#i-inbox"/></svg>',
  sch:'<svg viewBox="0 0 24 24"><use href="#i-ferro"/></svg>',spe:'<svg viewBox="0 0 24 24"><use href="#i-wallet"/></svg>'};
 function q(i){return document.getElementById(i);}
 // 1) BUG foto: dopo la firma, le prime immagini si scaricano e diventano blob (il link firmato sul telefono a volte non carica)
 var blobTent={};
 var _firma=window.firmaUrl;
 window.firmaUrl=async function(bucket,paths,mappa){
  await _firma.apply(this,arguments);
  try{
   var da=(paths||[]).filter(function(p){return p&&!blobTent[bucket+"/"+p];}).slice(0,12);
   await Promise.all(da.map(async function(p){
    blobTent[bucket+"/"+p]=1;
    try{var r=await sb.storage.from(bucket).download(p);if(r&&r.data&&r.data.size)mappa[p]=URL.createObjectURL(r.data);}catch(e){}
   }));
  }catch(e){}
 };
 // 2) meteo a pastiglia
 function meteoPastiglia(){
  var m=q("meteo-owner");if(!m||m.parentNode.classList.contains("hv3-met"))return;
  var w=document.createElement("div");w.className="hv3-met";m.parentNode.insertBefore(w,m);w.appendChild(m);
  m.style.display="";m.classList.add("hm-meteo");
  w.onclick=function(e){if(e.target!==m&&!m.contains(e.target))m.click();};
 }
 // 3) storie + card
 function dd(v){var d=new Date(v.data_voce);return String(d.getDate()).padStart(2,"0")+"/"+String(d.getMonth()+1).padStart(2,"0");}
 window.homeV3Storie=function(){
  var voci=(typeof diarioVoci!=="undefined"?diarioVoci:[]).slice(0,5);
  if(!voci.length)return '<div class="hv3-stor"><button class="hv3-st vuoto" onclick="homeV3Vuoto()"><div class="c"><span>VUOTO</span></div><small>Ultimi momenti</small></button></div>';
  return '<div class="hv3-stor">'+voci.map(function(v){
   var u=typeof diarioFotoUrl==="function"?diarioFotoUrl(v):null;
   return '<button class="hv3-st" onclick="diarioDettaglio(\''+v.id+'\')"><div class="c"><span'+(u?' style="background-image:url(\''+u+'\')"':'')+'>'+(u?'':(IC[v.tipo]||IC.nota))+'</span></div><small>'+dd(v)+'</small></button>';
  }).join("")+'</div>';
 };
 window.homeV3Vuoto=function(){
  diarioSheet("Ultimi momenti",'<p style="line-height:1.6">Qui compaiono gli ultimi 5 momenti del tuo cavallo: foto, video, vocali, note, ferrature, vaccini e lezioni.</p><p style="line-height:1.6">Ogni cerchio mostra la data e il tipo di momento. Per iniziare, scrivi il primo nel Diario.</p><button class="btn btn-primary" style="width:100%" onclick="closeModal(\'modal-dr-sheet\');diarioApri(\'foto\')">Aggiungi un momento</button>');
 };
 function cardHtml(){
  var h=typeof diarioCavallo==="function"?diarioCavallo():null;
  var uno=typeof horses!=="undefined"&&horses.length===1;
  var spese=(q("stat-expenses")||{}).textContent||"€ 0";
  var lm=typeof homeLastMessageTarget!=="undefined"?homeLastMessageTarget:null,msg=lm?('<b>'+escapeHtml(lm.nome)+'</b><span>'+escapeHtml(lm.testo||"")+'</span>'):'<b>Messaggi</b><span>Nessun messaggio per ora</span>';
  return '<div class="hv3-due"><button class="hv3-k pren" onclick="showPage(\'prenotazioni\')"><i>'+ICK.pren+'</i><b>Prenotazioni</b><span>Le tue lezioni in scuderia</span></button>'+
   '<button class="hv3-k msg" id="hv3-msg" onclick="'+(lm?'goToLastMessage()':"showPage('chat')")+'"><i>'+ICK.msg+'</i><small style="font-size:9.5px;font-weight:800;letter-spacing:.06em;color:#8a6516">ULTIMO MESSAGGIO</small>'+msg+'</button></div>'+
   '<div class="hv3-due"><button class="hv3-k sch" onclick="apriSchedaCavallo('+(uno?"'"+horses[0].id+"'":"null")+')"><i>'+ICK.sch+'</i><b>'+(uno&&h?'Scheda di '+escapeHtml(h.name):'I miei cavalli')+'</b><span>Libretto, salute e storico</span></button>'+
   '<button class="hv3-k spe" onclick="showPage(\'spese\')"><i>'+ICK.spe+'</i><b>Spese</b><span>Questo mese '+escapeHtml(spese)+'</span></button></div>';
 }
 // 4) scadenze chiuse + chat preferite + Da Equo in basso
 function scadenze(){
  var dl=q("home-deadlines");if(!dl)return;var card=dl.closest(".card");if(!card||card.id==="hv3-scad")return;
  card.id="hv3-scad";card.className="hv3-scad";
  var p=document.createElement("div");p.className="poster";
  p.innerHTML='<div><b>Prossime scadenze</b><span>Tocca per vedere le prossime 5</span></div><em id="hv3-scn"></em>';
  p.onclick=function(){card.classList.toggle("aperta");};
  var corpo=document.createElement("div");corpo.className="corpo";
  while(card.firstChild)corpo.appendChild(card.firstChild);
  card.appendChild(p);card.appendChild(corpo);
 }
 function contaScad(){var dl=q("home-deadlines"),n=q("hv3-scn");if(!dl||!n)return;var c=dl.querySelectorAll(".deadline-item,.dl-item,.card").length||0;n.textContent=c?c:"";n.style.display=c?"":"none";}
 function chiavi(){try{return JSON.parse(localStorage.getItem("equo-chat-pref-"+(currentUser&&currentUser.id))||"null");}catch(e){return null;}}
 function key(c){return c.tipo+":"+((c.target&&(c.target.membro_id||c.target.cliente_mascalcia_id||c.target.id))||c.nome);}
 window.homeV3Chat=function(){
  var main=q("home-main");if(!main)return;
  var box=q("hv3-pref");if(!box){box=document.createElement("div");box.id="hv3-pref";box.className="hv3-pref";main.appendChild(box);}
  var tutte=window.homeChatTutte||[],ch=chiavi(),scelte;
  if(ch)scelte=ch.map(function(k){return tutte.find(function(c){return key(c)===k;});}).filter(Boolean);
  else scelte=tutte.slice(0,5);
  var cerchi=scelte.slice(0,5).map(function(c,i){return '<button class="hv3-p" onclick="homeV3Apri('+tutte.indexOf(c)+')"><div class="c">'+escapeHtml((c.nome||"?").trim().charAt(0).toUpperCase())+'</div><small>'+escapeHtml((c.nome||"").split(" ")[0])+'</small></button>';});
  while(cerchi.length<5)cerchi.push('<button class="hv3-p vuota" onclick="homeV3Scegli()"><div class="c">+</div><small>Preferita</small></button>');
  box.innerHTML='<h4>Chat preferite<button onclick="homeV3Scegli()">Modifica</button></h4><div class="hv3-pr">'+cerchi.join("")+'</div>';
  var m=q("hv3-msg");if(m){var nuovo=document.createElement("div");nuovo.innerHTML=cardHtml();var n2=nuovo.querySelector("#hv3-msg");if(n2)m.replaceWith(n2);}
 };
 window.homeV3Apri=function(i){var c=(window.homeChatTutte||[])[i];if(!c)return;homeLastMessageTarget=c;goToLastMessage();};
 window.homeV3Scegli=function(){
  var tutte=window.homeChatTutte||[];
  if(!tutte.length){showToast("Quando avrai delle chat potrai sceglierne 5 da tenere qui.");return;}
  var ch=chiavi()||tutte.slice(0,5).map(key);
  diarioSheet("Chat preferite",'<p class="muted" style="font-size:13px">Scegli fino a 5 chat da avere sempre a portata di mano.</p>'+tutte.map(function(c){var k=key(c);return '<label class="hv3-sel"><input type="checkbox" '+(ch.indexOf(k)>=0?"checked":"")+' data-k="'+escapeHtml(k)+'"> '+escapeHtml(c.nome)+'</label>';}).join("")+'<button class="btn btn-primary" style="width:100%;margin-top:12px" onclick="homeV3Salva()">Salva</button>');
 };
 window.homeV3Salva=function(){
  var sel=[].slice.call(document.querySelectorAll("#dr-sheet-b input[data-k]:checked")).map(function(x){return x.dataset.k;}).slice(0,5);
  try{localStorage.setItem("equo-chat-pref-"+(currentUser&&currentUser.id),JSON.stringify(sel));}catch(e){}
  closeModal("modal-dr-sheet");homeV3Chat();
 };
 // aggancio dopo il disegno della Home
 function post(){
  meteoPastiglia();scadenze();contaScad();
  var o=q("home-oggi"),main=q("home-main");if(!o)return;
  var oggi=o.querySelector(".dr-oggi");
  if(oggi&&!o.querySelector(".hv3-stor")){
   var w=document.createElement("div");w.id="hv3-sopra";w.innerHTML=homeV3Storie()+cardHtml();oggi.after(w);
  }
  var tit=o.querySelector(":scope > .eq-tit"),sc=o.querySelector(":scope > .eq-scroll");
  if(tit&&sc&&main){var f=q("hv3-daequo");if(!f){f=document.createElement("div");f.id="hv3-daequo";main.appendChild(f);}f.innerHTML="";f.appendChild(tit);f.appendChild(sc);}
  homeV3Chat();
 }
 var _dhr=window.diarioHomeRender;
 window.diarioHomeRender=async function(){var r=await _dhr.apply(this,arguments);try{post();}catch(e){console.error(e);}return r;};
 setInterval(function(){try{meteoPastiglia();scadenze();contaScad();}catch(e){}},2000);
})();
