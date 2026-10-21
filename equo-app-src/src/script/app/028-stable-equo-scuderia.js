/* ---------- STABLE (Equo Scuderia) ---------- */
async function joinStable(){
  const code = document.getElementById("stable-code").value.trim().toUpperCase();
  const errBox = document.getElementById("stable-error");
  errBox.style.display = "none";
  if(!code) return;
  const stable = await DB.findStableByCode(code);
  if(!stable){
    errBox.textContent = "Codice non valido." + (DEMO_MODE ? " (in demo prova EQUO-DEMO)" : "");
    errBox.style.display = "block";
    return;
  }
  if(currentHorseId || horses[0]){
    const horseId = currentHorseId || horses[0].id;
    await DB.linkHorseToStable(horseId, stable.id);
  }
  closeModal("modal-join-stable");
  alert("Collegato a " + stable.name + "!");
}

