/* ---------- vista box ---------- */
function iconeAttive(){ const ex = dati?.icone_extra || []; return Object.keys(ICONE).filter(k => !ICONE[k].extra || ex.includes(k)); }
function fattaIn(b, tipo){ return (b.fatte || []).find(a => a.tipo === tipo); }
function inAttesa(b, tipo){ return coda.some(x => x.box === b.id && x.tipo === tipo); }
function glifo(icona){ return icona === "svg" ? FERRO : `<i class="fa-solid ${icona}"></i>`; }
function disegna(){
  if(!dati) return;
  if(dati.oggi && dati.oggi !== oggiRoma()){ dati.box.forEach(b => b.fatte = []); }
  const ico = iconeAttive();
  const conCav = dati.box.filter(b => b.cavallo && !b.manutenzione);
  const tot = conCav.length * ico.length, fatte = conCav.reduce((s, b) => s + ico.filter(k => fattaIn(b, k)).length, 0);
  let lista = dati.box;
  if(focusBox) lista = lista.filter(b => b.id === focusBox);
  else if(filtro === "da_fare") lista = lista.filter(b => b.cavallo && !b.manutenzione && ico.some(k => !fattaIn(b, k)));
  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent) && !navigator.standalone;
  const installato = window.matchMedia("(display-mode: standalone)").matches || navigator.standalone;
  document.getElementById("app").innerHTML = `
  <div class="top"><div class="top-riga"><img src="/assets/icona-equo.png" alt="">
    <div class="tit"><b>${esc(dati.centro || "")}</b><span>${esc(dati.groom || "")} · ${tr("oggi")}</span></div>
    <button class="ib" onclick="apriLingue()" aria-label="${tr("lingua")}"><i class="fa-solid fa-language"></i></button>
    <button class="ib" onclick="apriMenu()" aria-label="${tr("esci")}"><i class="fa-solid fa-ellipsis-vertical"></i></button></div>
    <div class="prog"><i style="width:${tot ? Math.round(fatte / tot * 100) : 0}%"></i></div>
    <div class="prog-txt"><span>${tr("fatti", { a: fatte, b: tot })}</span><span>${ultimoAgg ? tr("aggiornato", { o: ultimoAgg }) : ""}</span></div></div>
  ${coda.length ? `<div class="banner off"><i class="fa-solid fa-wifi"></i><span>${tr("offline", { n: coda.length })}</span></div>` : ""}
  ${!installato && !DEMO && (installEvt || isIos) ? `<div class="banner inst"><i class="fa-solid fa-mobile-screen"></i><span>${installEvt ? tr("installa") : tr("installa_ios")}</span>${installEvt ? `<button onclick="installa()">${tr("installa_btn")}</button>` : ""}</div>` : ""}
  ${focusBox ? `<div class="focus-bar"><button onclick="focusBox=null;disegna()"><i class="fa-solid fa-table-cells-large"></i> ${tr("tutti_box")}</button></div>`
    : `<div class="filtri"><button class="${filtro === "tutti" ? "on" : ""}" onclick="filtro='tutti';disegna()">${tr("tutti")}</button><button class="${filtro === "da_fare" ? "on" : ""}" onclick="filtro='da_fare';disegna()">${tr("da_fare")}</button></div>`}
  <div class="lista">${lista.length ? lista.map(b => boxHtml(b, ico)).join("") : `<div class="vuota">${dati.box.length ? `<i class="fa-solid fa-circle-check" style="font-size:40px;color:var(--ok)"></i><br><br>${tr("tutto_fatto")}` : tr("nessun_box")}</div>`}</div>
  <button class="fab" onclick="apriScanner()"><i class="fa-solid fa-qrcode"></i> ${tr("scansiona")}</button>`;
  if(focusBox){ const el = document.querySelector(".box"); el?.classList.add("evid"); }
}
function boxHtml(b, ico){
  const num = `<div class="box-num"><div><small>${tr("box")}</small>${esc(b.numero ?? "")}</div></div>`;
  const sotto = [b.nome, b.zona].filter(Boolean).map(esc).join(" · ");
  if(b.manutenzione) return `<div class="box manut" id="b-${b.id}"><div class="box-h">${num}<div class="box-cav"><b><i class="fa-solid fa-wrench"></i> ${tr("manut")}</b><span>${sotto}</span></div></div></div>`;
  if(!b.cavallo) return `<div class="box" id="b-${b.id}"><div class="box-h">${num}<div class="box-cav"><b style="color:var(--muted)">${tr("vuoto")}</b><span>${sotto}</span></div></div></div>`;
  const st = b.stato && L().st[b.stato] ? `<div class="box-stato">${glifo(STATI_ICONA[b.stato])} ${esc(L().st[b.stato])}</div>` : "";
  const finito = ico.every(k => fattaIn(b, k));
  return `<div class="box${finito ? " finito" : ""}" id="b-${b.id}"><div class="box-h">${num}<div class="box-cav"><b>${esc(b.cavallo)}</b>${sotto ? `<span>${sotto}</span>` : ""}${st}</div>
    ${b.nota ? `<button class="nota-btn" onclick="apriNota('${b.id}')" aria-label="${tr("nota")}">N</button>` : ""}</div>
    <div class="icone">${ico.map(k => { const a = fattaIn(b, k), d = ICONE[k];
      return `<button class="ic${a ? " fatto" : ""}${inAttesa(b, k) ? " attesa" : ""}" style="--c:${d.c}" onclick="tocca('${b.id}','${k}')">
        <span class="g">${glifo(d.i)}</span><span class="n">${esc(L().att[k])}</span>${a ? `<span class="chi">${esc((a.da || "").split(" ")[0])} ${esc(a.ora || "")}</span>` : ""}</button>`; }).join("")}</div></div>`;
}

