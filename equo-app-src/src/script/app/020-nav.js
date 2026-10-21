/* ---------- NAV ---------- */
function showPage(page){
  if(page === "home" || page === "pro-home") setTimeout(() => { try{ meteoHome(); }catch(e){} }, 0);
  Registro.pagina(page);
  document.querySelectorAll(".page-content").forEach(el => el.classList.remove("active"));
  document.getElementById("page-" + page).classList.add("active");
  document.querySelectorAll(".nav-btn").forEach(btn => btn.classList.toggle("active", btn.dataset.page === page));
  if(typeof hmNavAttivo === "function") hmNavAttivo(page);
  if(page === "pro-agenda" && typeof renderAgendaSettimana === "function"){ agGiorniAperti = null; renderAgendaSettimana(); }  // entrando si apre oggi
}

function openModal(id){ document.getElementById(id).classList.add("active"); }
function closeModal(id){ document.getElementById(id).classList.remove("active"); }
function closeOut(e, id){ if(e.target.id === id) closeModal(id); }

