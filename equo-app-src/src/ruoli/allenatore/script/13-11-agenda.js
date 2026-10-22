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
