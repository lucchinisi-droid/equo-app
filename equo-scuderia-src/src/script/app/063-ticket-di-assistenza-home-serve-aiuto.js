/* ---------- TICKET DI ASSISTENZA (Home → "Serve aiuto?") ---------- */
function apriTicketAssistenza(){
  document.getElementById("tk-categoria").value = "problema";
  ["tk-oggetto","tk-descrizione","tk-telefono"].forEach(id => document.getElementById(id).value = "");
  document.getElementById("tk-email").value = DEMO_MODE ? "" : (currentUser?.email || "");
  document.getElementById("tk-error").style.display = "none";
  document.getElementById("tk-form").style.display = "block";
  document.getElementById("tk-ok").style.display = "none";
  openModal("modal-ticket");
}
async function inviaTicketAssistenza(){
  const v = id => document.getElementById(id).value.trim();
  const errBox = document.getElementById("tk-error");
  const errore = t => { errBox.textContent = t; errBox.style.display = "block"; };
  errBox.style.display = "none";
  const row = { app: "scuderia", vista: currentMembro?.ruolo || null, centro_id: DEMO_MODE ? null : (currentCentro?.id || null),
    categoria: v("tk-categoria"), oggetto: v("tk-oggetto"), descrizione: v("tk-descrizione"), email: v("tk-email"),
    telefono: v("tk-telefono") || null, nome: currentMembro?.nome_visualizzato || null,
    dispositivo: (navigator.userAgent || "").slice(0, 300) + " · " + window.innerWidth + "×" + window.innerHeight };
  if(row.oggetto.length < 3) return errore("Scrivi un oggetto (almeno 3 caratteri).");
  if(row.descrizione.length < 10) return errore("Descrivi il problema in qualche parola in più.");
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) return errore("Controlla l'indirizzo email.");
  const btn = document.getElementById("tk-btn"); btn.disabled = true;
  let numero = null;
  if(!DEMO_MODE){
    const { data, error } = await sb.from("ticket_assistenza").insert({ ...row, user_id: currentUser.id }).select("numero").single();
    btn.disabled = false;
    if(error){ console.error("ticket:", error); return errore(error.message?.includes("5 ticket") ? error.message : "Invio non riuscito, riprova o scrivi a gestione.equo@gmail.com."); }
    numero = data?.numero;
  } else btn.disabled = false;
  document.getElementById("tk-ok-titolo").textContent = numero ? `Ticket #${numero} inviato` : "Ticket inviato (demo)";
  document.getElementById("tk-form").style.display = "none";
  document.getElementById("tk-ok").style.display = "block";
}
function closeModal(id){ document.getElementById(id).classList.remove("active"); }
function closeOut(e, id){ if(e.target.id === id) closeModal(id); }

