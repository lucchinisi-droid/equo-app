/* ---------- LEZIONI MANUALI (calendario proprietario) ---------- */
const LEZIONE_TIPO_LABELS = { lezione: "Lezione", allenamento: "Allenamento libero", gara: "Gara", altro: "Altro" };
let lezioniCache = [];
let editingLezioneId = null;

async function loadLezioni(){
  loadCalendarioScuderia();
  const box = document.getElementById("lezioni-list");
  box.innerHTML = '<div class="loading"><div class="spinner"></div> Caricamento...</div>';
  const data = await DB.listLezioni();
  lezioniCache = data || [];
  if(lezioniCache.length === 0){
    box.innerHTML = '<div class="empty-state"><div class="icon" style="width:32px;height:32px;margin:0 auto 10px"><svg><use href="#i-calendar"/></svg></div>Nessuna lezione registrata. Aggiungine una per iniziare.</div>';
    return;
  }
  box.innerHTML = lezioniCache.map(l => `
    <div class="event-item" style="cursor:pointer" onclick="openAddLezioneModal('${l.id}')">
      <div>
        <div style="font-weight:600;font-size:14px">${LEZIONE_TIPO_LABELS[l.tipo] || l.tipo}${l.horses?.name ? " · " + escapeHtml(l.horses.name) : ""}</div>
        <div class="muted" style="font-size:12px">${formatDate(l.data)}${l.note ? " · " + escapeHtml(l.note) : ""}</div>
      </div>
      <span class="icon"><svg><use href="#i-chevron"/></svg></span>
    </div>
  `).join("");
}

