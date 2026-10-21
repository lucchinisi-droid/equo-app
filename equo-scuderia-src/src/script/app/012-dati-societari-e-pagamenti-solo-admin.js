/* ---------- DATI SOCIETARI E PAGAMENTI (solo admin) ---------- */
const DATI_FISCALI_FIELDS = ["denominazione","piva","cod_rea","iban","pec","sdi","indirizzo","telefono_fisso","cellulare"];
const DATI_FISCALI_LABELS = { denominazione:"Denominazione", piva:"P.IVA", cod_rea:"Cod. REA", iban:"IBAN", pec:"PEC", sdi:"SDI", indirizzo:"Indirizzo", telefono_fisso:"Telefono fisso", cellulare:"Cellulare" };

async function refreshDatiFiscaliCard(){
  const isAdminUser = currentMembro?.ruolo === "admin";
  document.getElementById("card-dati-fiscali").style.display = isAdminUser ? "block" : "none";
  if(!isAdminUser) return;
  await loadDatiFiscali();
  renderDatiFiscali();
}

async function loadDatiFiscali(){
  if(DEMO_MODE){ datiFiscali = demoState.datiFiscali; return; }
  const { data, error } = await sb.from("scuderia_dati_fiscali")
    .select("id, centro_id, denominazione, piva, cod_rea, iban, pec, sdi, indirizzo, telefono_fisso, cellulare")
    .eq("centro_id", currentCentro.id)
    .maybeSingle();
  if(!error) datiFiscali = data || null;
}

function renderDatiFiscali(){
  DATI_FISCALI_FIELDS.forEach(f => {
    const val = datiFiscali?.[f];
    document.getElementById("df-view-" + f).textContent = val ? val : "—";
  });
}

function openDatiFiscaliForm(){
  document.getElementById("dati-fiscali-error").style.display = "none";
  DATI_FISCALI_FIELDS.forEach(f => {
    document.getElementById("df-" + f).value = datiFiscali?.[f] || "";
  });
  openModal("modal-dati-fiscali");
}

async function saveDatiFiscali(){
  const errBox = document.getElementById("dati-fiscali-error");
  errBox.style.display = "none";
  const payload = {};
  DATI_FISCALI_FIELDS.forEach(f => {
    payload[f] = document.getElementById("df-" + f).value.trim() || null;
  });

  try{
    if(DEMO_MODE){
      demoState.datiFiscali = { ...demoState.datiFiscali, ...payload };
      datiFiscali = demoState.datiFiscali;
    } else if(datiFiscali?.id){
      const { error } = await sb.from("scuderia_dati_fiscali").update(payload).eq("id", datiFiscali.id);
      if(error) throw error;
      await loadDatiFiscali();
    } else {
      const { error } = await sb.from("scuderia_dati_fiscali").insert({ centro_id: currentCentro.id, ...payload });
      if(error) throw error;
      await loadDatiFiscali();
    }
    renderDatiFiscali();
    closeModal("modal-dati-fiscali");
    showToast("Dati aggiornati.");
  } catch(err){
    errBox.textContent = err.message || "Errore nel salvataggio.";
    errBox.style.display = "block";
  }
}

function copyDatiFiscali(){
  if(!datiFiscali){ showToast("Nessun dato da copiare."); return; }
  const lines = DATI_FISCALI_FIELDS
    .filter(f => datiFiscali[f])
    .map(f => `${DATI_FISCALI_LABELS[f]}: ${datiFiscali[f]}`);
  if(lines.length === 0){ showToast("Nessun dato da copiare."); return; }
  navigator.clipboard?.writeText(lines.join("\n")).then(() => showToast("Dati copiati negli appunti!"));
}

