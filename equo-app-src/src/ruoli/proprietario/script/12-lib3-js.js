
(function(){
 var TAB="identita";
 function q(i){return document.getElementById(i);}
 var POS=[["fronte","Fronte"],["sinistra","Sinistra"],["destra","Destra"],["particolari","Particolari"]];
 function schede(){
  var v=q("cavalli-detail-view");if(!v)return;
  if(!q("lb-tabs")){
   var t=document.createElement("div");t.id="lb-tabs";t.className="lb-tabs";
   t.innerHTML='<button data-t="identita" class="on">Identità</button><button data-t="salute">Salute</button><button data-t="sport">Sport</button>';
   t.onclick=function(e){var b=e.target.closest("button[data-t]");if(b)libTab(b.dataset.t);};
   v.querySelector(".detail-header").after(t);
   var cards=[].slice.call(v.children);
   cards.forEach(function(c){
    if(c===t||c.classList.contains("detail-header"))return;
    var txt=(c.textContent||"");
    var tab="identita";
    if(c.id==="horse-dove")tab="identita";
    else if(/Libretto sanitario|Allegati/.test(txt.slice(0,40)))tab="salute";
    c.dataset.lbtab=tab;
   });
   var nuove=document.createElement("div");nuove.id="lb-nuove-identita";nuove.dataset.lbtab="identita";nuove.innerHTML='<div class="card" id="lb-foto-card" style="margin-bottom:14px"></div><div class="card" id="lb-vis-card" style="margin-bottom:14px"></div><div class="card" id="lb-storico-card" style="margin-bottom:14px;display:none"></div>';
   q("horse-dove").after(nuove);
   var sp=document.createElement("div");sp.id="lb-sport";sp.dataset.lbtab="sport";sp.innerHTML="";
   t.after(sp);
  }
  libTab(TAB,true);
 }
 window.libTab=function(t,nofocus){
  TAB=t;var v=q("cavalli-detail-view");
  [].forEach.call(q("lb-tabs").children,function(b){b.classList.toggle("on",b.dataset.t===t);});
  [].forEach.call(v.children,function(c){if(c.dataset&&c.dataset.lbtab)c.style.display=c.dataset.lbtab===t?"":"none";});
  var sc=q("lb-storico-card");if(sc&&t==="identita"&&sc.dataset.ha!=="1")sc.style.display="none";
  if(t==="sport")libSport();
 };
 // ---- Identità
 function h(){return (typeof horses!=="undefined"&&typeof currentHorseId!=="undefined")?horses.find(function(x){return x.id===currentHorseId;}):null;}
 var _ri=window.renderHorseInfoBox;
 window.renderHorseInfoBox=function(hh){
  _ri.apply(this,arguments);
  try{
   var box=q("horse-info-box");if(!box)return;
   var rows=box.children;
   for(var i=0;i<rows.length;i++){var l=rows[i].firstElementChild;if(l&&l.textContent==="Microchip"&&hh.microchip){
    var b=document.createElement("span");b.className="lb-badge "+(hh.microchip_verificato?"ok":"dic");b.textContent=hh.microchip_verificato?"verificato":"dichiarato";
    rows[i].lastElementChild.appendChild(b);}}
   libFoto(hh);libVis(hh);libStorico(hh);
  }catch(e){console.error(e);}
 };
 var _ohd=window.openHorseDetail;
 window.openHorseDetail=async function(id){schede();TAB="identita";var r=await _ohd.apply(this,arguments);schede();return r;};
 async function libUrl(path){try{var r=await sb.storage.from("cavalli-album").createSignedUrl(path,3600);return r.data&&r.data.signedUrl;}catch(e){return null;}}
 async function libFoto(hh){
  var c=q("lb-foto-card");if(!c)return;
  var f=hh.foto_riconoscimento||{};
  c.innerHTML='<div style="font-weight:700;font-size:14px;margin-bottom:4px">Foto di riconoscimento</div><div class="muted" style="font-size:12px;line-height:1.5;margin-bottom:10px">Quattro foto per riconoscere il cavallo: fronte, lato sinistro, lato destro e particolari (stelle, balzane, segni).</div><div class="lb-foto" id="lb-foto-g">'+POS.map(function(p){return '<button data-p="'+p[0]+'" onclick="libFotoScegli(\''+p[0]+'\')">'+p[1]+'</button>';}).join("")+'</div><input type="file" id="lb-foto-file" accept="image/*" style="display:none" onchange="libFotoCarica(this)">';
  if(typeof DEMO_MODE!=="undefined"&&DEMO_MODE)return;
  POS.forEach(async function(p){if(!f[p[0]])return;var u=await libUrl(f[p[0]]);var b=document.querySelector('#lb-foto-g button[data-p="'+p[0]+'"]');if(u&&b){b.style.backgroundImage="url('"+u+"')";b.classList.add("piena");}});
 }
 var posAtt=null;
 window.libFotoScegli=function(p){posAtt=p;q("lb-foto-file").click();};
 window.libFotoCarica=async function(inp){
  var file=inp.files&&inp.files[0];inp.value="";if(!file||!posAtt)return;
  if(typeof DEMO_MODE!=="undefined"&&DEMO_MODE){showToast("Nella demo le foto non si salvano");return;}
  var hh=h();if(!hh)return;
  try{
   showToast("Carico la foto…");
   var blob=await diarioComprimi(file);
   var path=currentUser.id+"/riconoscimento/"+hh.id+"-"+posAtt+"-"+Date.now()+".jpg";
   var up=await sb.storage.from("cavalli-album").upload(path,blob,{contentType:"image/jpeg"});if(up.error)throw up.error;
   var nf=Object.assign({},hh.foto_riconoscimento||{});nf[posAtt]=path;
   var r=await sb.from("horses").update({foto_riconoscimento:nf}).eq("id",hh.id);if(r.error)throw r.error;
   hh.foto_riconoscimento=nf;libFoto(hh);showToast("Foto salvata");
  }catch(e){showToast("Non sono riuscito a salvare la foto: "+(e.message||"errore"));}
 };
 // visibilità per i professionisti
 function libVis(hh){
  var c=q("lb-vis-card");if(!c)return;
  var v=(hh.libretto_visibilita||{})._tutti||{identita:true,salute:true,sport:false};
  function tg(k,t){return '<label class="lb-tg"><span>'+t+'</span><input type="checkbox" '+(v[k]?"checked":"")+' onchange="libVisSalva(\''+k+'\',this.checked)"></label>';}
  c.innerHTML='<div style="font-weight:700;font-size:14px;margin-bottom:2px">Cosa vedono i professionisti</div><div class="muted" style="font-size:12px;line-height:1.5;margin-bottom:6px">Scegli quali schede del libretto possono consultare maniscalco, veterinario e istruttore collegati. Spese, note private e incassi non si vedono mai.</div>'+tg("identita","Identità")+tg("salute","Salute")+tg("sport","Sport");
 }
 window.libVisSalva=async function(k,val){
  var hh=h();if(!hh)return;
  var lv=Object.assign({},hh.libretto_visibilita||{});var t=Object.assign({identita:true,salute:true,sport:false},lv._tutti||{});t[k]=val;lv._tutti=t;
  if(typeof DEMO_MODE!=="undefined"&&DEMO_MODE){hh.libretto_visibilita=lv;return;}
  var r=await sb.from("horses").update({libretto_visibilita:lv}).eq("id",hh.id);
  if(r.error){showToast("Non sono riuscito a salvare");libVis(hh);return;}
  hh.libretto_visibilita=lv;showToast("Salvato");
 };
 async function libStorico(hh){
  var c=q("lb-storico-card");if(!c||(typeof DEMO_MODE!=="undefined"&&DEMO_MODE))return;
  try{
   var r=await sb.from("cavalli_storico").select("*").eq("horse_id",hh.id).order("created_at",{ascending:false}).limit(10);
   var d=r.data||[];c.dataset.ha=d.length?"1":"0";c.style.display=d.length&&TAB==="identita"?"":"none";if(!d.length)return;
   c.innerHTML='<div style="font-weight:700;font-size:14px;margin-bottom:6px">Storico dei cambi</div>'+d.map(function(x){return '<div class="lb-riga"><span class="muted">'+escapeHtml(x.campo)+' · '+formatDate(x.created_at)+'</span><span style="text-align:right">'+escapeHtml(x.valore_prima||"—")+' → '+escapeHtml(x.valore_dopo||"—")+'</span></div>';}).join("");
  }catch(e){}
 }
 // avviso quando si cambia il microchip
 var _es=window.eseguiSalvataggioHorse;
 window.eseguiSalvataggioHorse=async function(payload){
  try{
   if(typeof editingHorseId!=="undefined"&&editingHorseId){
    var vecchio=(horses.find(function(x){return x.id===editingHorseId;})||{}).microchip;
    if(vecchio&&payload.microchip&&String(vecchio).trim()!==String(payload.microchip).trim()){
     var ok=await chiediSiNo("Cambiare il microchip?","Il numero resta nello storico del cavallo (prima e dopo) e il nuovo numero risulterà «dichiarato» finché un professionista non lo verifica. Chi segue il cavallo vede il cambio.");
     if(!ok)return;
    }
   }
  }catch(e){}
  return _es.apply(this,arguments);
 };
 // ---- Sport (Premium)
 async function libSport(){
  var c=q("lb-sport");if(!c)return;var hh=h();if(!hh)return;
  var prem=typeof isPremium==="function"&&isPremium();
  if(!prem){
   c.innerHTML='<div class="card lb-blocco"><div style="font-weight:700;font-size:15px">La scheda Sport è Premium</div><p>Discipline, livello, tessera federale e risultati di gara: tutta la carriera sportiva di '+escapeHtml(hh.name)+' in un posto solo, che lo segue anche se cambia proprietario.</p><button class="btn btn-primary" style="width:100%" onclick="closeModal(\'modal-dr-sheet\');togglePiano()">Passa a Premium</button></div>';
   return;
  }
  c.innerHTML='<div class="loading"><div class="spinner"></div></div>';
  var disc=[],voci=[];
  if(!(typeof DEMO_MODE!=="undefined"&&DEMO_MODE)){
   var a=await sb.from("cavalli_sport").select("*").eq("horse_id",hh.id).order("created_at");disc=a.data||[];
   var b=await sb.from("sport_voci").select("*").eq("horse_id",hh.id).order("data",{ascending:false}).limit(50);voci=b.data||[];
  }
  c.innerHTML='<div class="card" style="margin-bottom:14px"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><div style="font-weight:700;font-size:14px">Discipline</div><button class="btn btn-outline btn-sm" onclick="libSportForm(\'disc\')">+ Disciplina</button></div>'+
   (disc.length?disc.map(function(d){return '<div class="lb-riga"><span><b>'+escapeHtml(d.disciplina)+'</b>'+(d.livello?' · '+escapeHtml(d.livello):'')+'</span><span class="muted">'+escapeHtml(d.tessera||"")+'</span></div>';}).join(""):'<div class="muted" style="font-size:13px">Nessuna disciplina ancora.</div>')+'</div>'+
   '<div class="card" style="margin-bottom:14px"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><div style="font-weight:700;font-size:14px">Gare e risultati</div><button class="btn btn-outline btn-sm" onclick="libSportForm(\'voce\')">+ Risultato</button></div>'+
   (voci.length?voci.map(function(x){return '<div class="lb-riga"><span><b>'+escapeHtml(x.titolo)+'</b><br><span class="muted">'+formatDate(x.data)+(x.luogo?' · '+escapeHtml(x.luogo):'')+'</span></span><span style="text-align:right">'+escapeHtml(x.esito||"")+'</span></div>';}).join(""):'<div class="muted" style="font-size:13px">Nessun risultato registrato.</div>')+'</div>';
 }
 window.libSportForm=function(tipo){
  var f=tipo==="disc"
   ?'<input class="input" id="sp-1" placeholder="Disciplina (es. Salto ostacoli)" style="margin-bottom:8px"><input class="input" id="sp-2" placeholder="Livello (es. C130)" style="margin-bottom:8px"><input class="input" id="sp-3" placeholder="Tessera federale" style="margin-bottom:8px">'
   :'<input class="input" id="sp-1" placeholder="Gara o evento" style="margin-bottom:8px"><input class="input" type="date" id="sp-2" style="margin-bottom:8px"><input class="input" id="sp-3" placeholder="Luogo" style="margin-bottom:8px"><input class="input" id="sp-4" placeholder="Esito (es. 2° classificato)" style="margin-bottom:8px">';
  diarioSheet(tipo==="disc"?"Nuova disciplina":"Nuovo risultato",f+'<button class="btn btn-primary" style="width:100%" onclick="libSportSalva(\''+tipo+'\')">Salva</button>');
 };
 window.libSportSalva=async function(tipo){
  var hh=h();if(!hh)return;var g=function(i){var e=q("sp-"+i);return e?e.value.trim():"";};
  if(!g(1)){showToast("Scrivi almeno il nome");return;}
  if(typeof DEMO_MODE!=="undefined"&&DEMO_MODE){showToast("Nella demo non si salva");return;}
  var r=tipo==="disc"?await sb.from("cavalli_sport").insert({horse_id:hh.id,disciplina:g(1),livello:g(2)||null,tessera:g(3)||null}):await sb.from("sport_voci").insert({horse_id:hh.id,titolo:g(1),data:g(2)||new Date().toISOString().slice(0,10),luogo:g(3)||null,esito:g(4)||null});
  if(r.error){showToast("Non sono riuscito a salvare: "+(r.error.message||"errore"));return;}
  closeModal("modal-dr-sheet");libSport();
 };
})();
