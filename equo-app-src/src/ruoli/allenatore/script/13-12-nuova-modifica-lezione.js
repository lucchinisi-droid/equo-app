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
 estendiDopo("trRenderHome",async function(){
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
 });
