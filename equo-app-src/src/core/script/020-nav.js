/* ---------- NAV ---------- */
// NAVIGAZIONE UNICA (21/10/2026). showPage mostra la pagina e poi avvisa, in ordine, chi si e iscritto
// con quandoApriPagina(fn). NON riassegnare mai showPage in altri file: per fare qualcosa quando
// si apre una pagina usare quandoApriPagina(function(pagina){ ... }). Un errore in un iscritto
// non blocca la navigazione ne gli altri iscritti.
const ascoltiPagina = [];
function quandoApriPagina(fn){ ascoltiPagina.push(fn); }
function showPage(page){
  if(page === "home" || page === "pro-home") setTimeout(() => { try{ meteoHome(); }catch(e){} }, 0);
  Registro.pagina(page);
  document.querySelectorAll(".page-content").forEach(el => el.classList.remove("active"));
  document.getElementById("page-" + page).classList.add("active");
  document.querySelectorAll(".nav-btn").forEach(btn => btn.classList.toggle("active", btn.dataset.page === page));
  if(typeof hmNavAttivo === "function") hmNavAttivo(page);
  if(page === "pro-agenda" && typeof renderAgendaSettimana === "function"){ agGiorniAperti = null; renderAgendaSettimana(); }  // entrando si apre oggi
  for(const fn of ascoltiPagina){ try{ fn(page); }catch(e){ console.error("quandoApriPagina:", e); } }
}

// ESTENSIONI (22/10/2026): per fare qualcosa PRIMA o DOPO una funzione definita in un altro file
// NON la si riassegna: ci si iscrive con estendiPrima("nome", fn) / estendiDopo("nome", fn).
// La funzione originale esegue gli iscritti in ordine; un errore in uno non blocca gli altri ne la funzione.
// Oggi le usano: renderHome, openHorseDetail, diarioHomeRender, firmaUrl, trRenderHome, applicaHomeMan, hmPiu,
// aggiornaSwitchHome, renderChatCartelle, aggiornaTestataAi, renderHorseInfoBox, eseguiSalvataggioHorse, plCostruisciMenu, plNavAltri.
const estensioniPrima = {}, estensioniDopo = {};
function estendiPrima(nome, fn){ (estensioniPrima[nome] = estensioniPrima[nome] || []).push(fn); }
function estendiDopo(nome, fn){ (estensioniDopo[nome] = estensioniDopo[nome] || []).push(fn); }
async function eseguiEstensioni(elenco, nome, args){ for(const fn of (elenco[nome] || [])){ try{ await fn.apply(null, args || []); }catch(e){ console.error("estensione " + nome + ":", e); } } }
function eseguiEstensioniSubito(elenco, nome, args){ for(const fn of (elenco[nome] || [])){ try{ fn.apply(null, args || []); }catch(e){ console.error("estensione " + nome + ":", e); } } }
// "prima" che puo fermare la funzione: se un iscritto restituisce false, la funzione non prosegue
async function eseguiPrimaConStop(nome, args){ for(const fn of (estensioniPrima[nome] || [])){ try{ if(await fn.apply(null, args || []) === false) return false; }catch(e){ console.error("estensione " + nome + ":", e); } } return true; }
// SOSTITUZIONI PER RUOLO (22/10/2026): una funzione puo avere una versione diversa per un ruolo (plRuolo(): owner, man, vet, istr, pro).
// Si registra con registraPerRuolo("nome", ["vet","istr"], fn): l'ultima registrazione per un ruolo vince.
const sostituzioniPerRuolo = {};
function registraPerRuolo(nome, ruoli, fn){ for(const r of [].concat(ruoli)) (sostituzioniPerRuolo[nome] = sostituzioniPerRuolo[nome] || {})[r] = fn; }
function versioneDelRuolo(nome){ const r = typeof plRuolo === "function" ? plRuolo() : null; return (sostituzioniPerRuolo[nome] || {})[r] || null; }

function openModal(id){ document.getElementById(id).classList.add("active"); }
function closeModal(id){ document.getElementById(id).classList.remove("active"); }
function closeOut(e, id){ if(e.target.id === id) closeModal(id); }

