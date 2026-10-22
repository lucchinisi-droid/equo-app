/* ---------- demo (anteprima dal gestionale: /groom?demo=1) ---------- */
function demoRpc(nome, a){
  if(!window.__demo){
    const ora = (h, m) => String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0");
    window.__demo = { groom:"Rahim", centro:"Centro Ippico Demo", oggi: oggiRoma(), icone_extra:["coperta"], box:[
      { id:"d1", numero:1, zona:"Scuderia A", cavallo:"Athos", stato:"in_box", nota:"Solo fieno bagnato, niente avena. Coperta leggera la notte.", fatte:[{ tipo:"pasto_mattina", ora:ora(7,10), da:"Rahim" }, { tipo:"acqua", ora:ora(7,12), da:"Rahim" }] },
      { id:"d2", numero:2, zona:"Scuderia A", cavallo:"Luna Blu", stato:"paddock", fatte:[{ tipo:"pasto_mattina", ora:ora(7,15), da:"Ion" }, { tipo:"paddock", ora:ora(9,0), da:"Ion" }] },
      { id:"d3", numero:3, zona:"Scuderia A", cavallo:"Zeus", stato:"in_box", nota:"Antibiotico alle 8 e alle 20.", fatte:[] },
      { id:"d4", numero:4, zona:"Scuderia B", cavallo:null, fatte:[] },
      { id:"d5", numero:5, zona:"Scuderia B", manutenzione:true, fatte:[] } ] };
  }
  if(nome === "groom_info") return { valido:true, nome:"Rahim", centro:"Centro Ippico Demo", lingua: S.lang, pin_da_creare:false };
  if(nome === "groom_stalla") return JSON.parse(JSON.stringify(window.__demo));
  if(nome === "groom_segna"){ const b = window.__demo.box.find(x => x.id === a.p_box); b.fatte = b.fatte.filter(x => x.tipo !== a.p_tipo); if(a.p_fatto) b.fatte.push({ tipo:a.p_tipo, ora:oraAdesso(), da:"Rahim" }); return { ok:true }; }
  return {};
}
if(DEMO){ S.nome = "Rahim"; rpc("groom_stalla", {}).then(ricevi); applicaLingua(); } else avvio();
