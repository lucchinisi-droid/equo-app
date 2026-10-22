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
