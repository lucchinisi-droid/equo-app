// Equo App · cavalli · modulo (moduli ES, costruiti con Vite in ruoli/cavalli/costruito.js)
import { closeCavalloDetail, scadenzarioFor } from "./039-cavalli-salute.js";
import { etichettaStato, refreshSchedaPdfUI } from "./041-scheda-cavallo-pdf-brandizzato-equo-qr-s.js";
import { currentMembroId } from "./050-import-cavalli-dopo-collegamento-proprie.js";
/* ---------- ALLEGATI DEL CAVALLO (condivisi con proprietario e maniscalco; spazio file privato) ---------- */
let allegatiScud = [], allegatiScudCavallo = null;
async function caricaAllegatiScud(cavalloId){
  allegatiScudCavallo = cavalloId;
  const box = document.getElementById("scud-allegati");
  if(!box) return;
  if(DEMO_MODE){ box.innerHTML = '<div style="color:var(--muted);font-size:13px">In demo gli allegati non sono disponibili.</div>'; return; }
  const { data, error } = await sb.rpc("equo_allegati_cavallo", { p_vista: "scuderia", p_id: cavalloId });
  if(allegatiScudCavallo !== cavalloId) return;
  if(error){ box.innerHTML = '<div style="color:var(--muted);font-size:13px">Allegati non disponibili ora. Riprova più tardi.</div>'; return; }
  allegatiScud = data || [];
  const chi = { maniscalco: "dal maniscalco", proprietario: "dal proprietario", scuderia: "dalla scuderia" };
  box.innerHTML = allegatiScud.length ? allegatiScud.map(a => {
    const pdf = (a.mime || "").includes("pdf") || /\.pdf$/i.test(a.nome);
    const kb = a.byte ? (a.byte > 1048576 ? (a.byte / 1048576).toFixed(1).replace(".", ",") + " MB" : Math.max(1, Math.round(a.byte / 1024)) + " KB") : "";
    return `<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border)">
      <div style="width:38px;height:38px;border-radius:10px;background:var(--muted-bg);display:flex;align-items:center;justify-content:center;font-size:10.5px;font-weight:800;flex-shrink:0">${pdf ? "PDF" : "FOTO"}</div>
      <div style="flex:1;min-width:0"><div style="font-weight:600;font-size:13.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHtml(a.nome)}</div>
        <div style="color:var(--muted);font-size:12px">${a.mio ? "caricato da te" : "caricato " + (chi[a.autore_ruolo] || "") + (a.autore_nome ? " " + escapeHtml(a.autore_nome) : "")} · ${new Date(a.created_at).toLocaleDateString("it-IT")}${kb ? " · " + kb : ""}</div></div>
      <button class="btn btn-outline btn-sm" onclick="apriAllegatoScud('${a.id}', this)">Apri</button>
      ${a.mio ? `<button class="btn btn-outline btn-sm" style="color:var(--danger, #c0392b)" onclick="eliminaAllegatoScud('${a.id}')">Elimina</button>` : ""}
    </div>`;
  }).join("") : '<div style="color:var(--muted);font-size:13px">Nessun allegato per questo cavallo.</div>';
}
async function caricaAllegatoScud(input){
  const f = input.files && input.files[0];
  input.value = "";
  const id = allegatiScudCavallo;
  if(!f || !id) return;
  if(DEMO_MODE){ showToast("In demo gli allegati non sono disponibili."); return; }
  if(f.size > 15 * 1048576){ showToast("File troppo grande: massimo 15 MB"); return; }
  if(!/^(application\/pdf|image\/)/.test(f.type || "")){ showToast("Puoi caricare PDF o foto"); return; }
  showToast("Caricamento in corso…");
  const est = (f.name.match(/\.[a-z0-9]{1,5}$/i) || [""])[0].toLowerCase();
  const path = `${currentUser.id}/${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}${est}`;
  const up = await sb.storage.from("cavalli-allegati").upload(path, f, { contentType: f.type || undefined });
  if(up.error){ showToast("Caricamento non riuscito: " + up.error.message); return; }
  const { data, error } = await sb.rpc("equo_aggiungi_allegato", { p_vista: "scuderia", p_id: id, p_nome: f.name, p_path: path, p_mime: f.type || null, p_byte: f.size });
  if(error || !data?.ok){ await sb.storage.from("cavalli-allegati").remove([path]); showToast((data && data.errore) || "Caricamento non riuscito, riprova."); return; }
  showToast("Allegato caricato");
  await caricaAllegatiScud(id);
}
async function apriAllegatoScud(id, btn){
  const a = allegatiScud.find(x => x.id === id);
  if(!a) return;
  const w = window.open("", "_blank");
  if(btn) btn.disabled = true;
  const { data, error } = await sb.storage.from("cavalli-allegati").createSignedUrl(a.path, 600);
  if(btn) btn.disabled = false;
  if(error || !data?.signedUrl){ if(w) w.close(); showToast("Non riesco ad aprire il file, riprova."); return; }
  if(w) w.location.href = data.signedUrl; else window.location.href = data.signedUrl;
}
async function eliminaAllegatoScud(id){
  const a = allegatiScud.find(x => x.id === id);
  if(!a) return;
  if(!confirm(`Eliminare «${a.nome}»? Sparisce anche per il proprietario e il maniscalco; l'eliminazione resta nello storico del cavallo.`)) return;
  const { data, error } = await sb.rpc("equo_elimina_allegato", { p_id: id });
  if(error || !data?.ok){ showToast((data && data.errore) || "Non riuscito, riprova."); return; }
  if(data.path) await sb.storage.from("cavalli-allegati").remove([data.path]);
  showToast("Allegato eliminato");
  await caricaAllegatiScud(allegatiScudCavallo);
}

function renderCavalloDetail(){
  const c = cavalliList.find(x => x.id === currentCavalloId);
  if(!c){ closeCavalloDetail(); return; }

  document.getElementById("detail-cavallo-nome").innerHTML = escapeHtml(c.nome) + " " + pallinoHtml(c.id);
  const sub = [c.razza, c.mantello, TIPO_PROPRIETA_LABELS[c.tipo_proprieta] || null, c.proprietario ? "proprietario: " + c.proprietario : null].filter(Boolean).join(" · ");
  document.getElementById("detail-cavallo-sub").textContent = sub || "Nessun dettaglio aggiuntivo";
  const info = [
    c.codice_equo ? "Codice Equo: " + c.codice_equo : null,
    c.data_nascita ? "Nato il " + formatDate(c.data_nascita) : null,
    c.microchip ? "Microchip: " + c.microchip : null,
    c.gruppo_sanguigno ? "Gruppo sanguigno: " + c.gruppo_sanguigno : null,
  ].filter(Boolean).join(" · ");
  document.getElementById("detail-cavallo-info").textContent = info;
  const fotoEl = document.getElementById("detail-cavallo-foto");
  if(c.foto_url){
    fotoEl.style.backgroundImage = `url('${c.foto_url}')`;
    fotoEl.innerHTML = "";
  } else {
    fotoEl.style.backgroundImage = "";
    fotoEl.innerHTML = `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:var(--muted)"><i class="fa-solid fa-horse-head"></i></div>`;
  }
  refreshSchedaPdfUI(c);
  if(typeof renderCodiceScud === "function") renderCodiceScud(c);

  const scad = scadenzarioFor(c.id);
  const grid = document.getElementById("scadenzario-grid");
  grid.innerHTML = TIPO_ORDER.map(tipo => {
    const s = scad[tipo];
    const meta = s.ultimo
      ? `Ultimo: ${formatDate(s.ultimo.data_evento)}${s.ultimo.data_scadenza ? " · Scadenza: " + formatDate(s.ultimo.data_scadenza) : ""}`
      : "Nessun evento registrato";
    return `
      <div class="scad-tile">
        <div class="t">
          <span class="lbl">${iconHtml(TIPO_ICONS[tipo])} ${TIPO_LABELS[tipo]}</span>
          <span class="badge-pill badge-${s.status}">${etichettaStato(s)}</span>
        </div>
        <div class="meta">${meta}</div>
      </div>`;
  }).join("");

  renderEventiTable(c.id);
}

function canDeleteEvento(e){
  // voce scritta dal proprietario o dal maniscalco: può cancellarla solo chi l'ha registrata
  if(e && e.origine && e.origine !== "scuderia") return false;
  if(currentMembro?.ruolo === "admin") return true;
  return e.creato_da && e.creato_da === currentMembroId();
}

function renderEventiTable(cavalloId){
  const eventi = eventiAll.filter(e => e.cavallo_id === cavalloId)
    .sort((a,b) => new Date(b.data_evento) - new Date(a.data_evento));
  const body = document.getElementById("eventi-table-body");
  const empty = document.getElementById("eventi-empty");
  body.innerHTML = "";
  empty.style.display = eventi.length === 0 ? "block" : "none";

  eventi.forEach(e => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${iconHtml(TIPO_ICONS[e.tipo], "color:var(--muted);margin-right:6px")}${e.tipo === "altro" ? escapeHtml(e.tipo_altro || "Altro") : TIPO_LABELS[e.tipo]}</td>
      <td>${formatDate(e.data_evento)}</td>
      <td>${e.data_scadenza ? formatDate(e.data_scadenza) : "—"}</td>
      <td style="color:var(--muted)">${escapeHtml(e.note || "—")}</td>
      <td style="text-align:right;white-space:nowrap">
        ${memberCanUI("eventi") ? `<button class="btn btn-ghost btn-sm" onclick="openEventoForm('${e.id}')"><i class="fa-solid fa-pen"></i></button>` : ""}
        ${canDeleteEvento(e) ? `<button class="btn btn-ghost btn-sm" onclick="askDeleteEvento('${e.id}')"><i class="fa-solid fa-trash"></i></button>` : ""}
      </td>`;
    body.appendChild(tr);
  });
}


export { apriAllegatoScud, caricaAllegatiScud, caricaAllegatoScud, eliminaAllegatoScud, renderCavalloDetail };
