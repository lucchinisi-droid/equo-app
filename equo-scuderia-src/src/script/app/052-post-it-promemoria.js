/* ---------- POST-IT PROMEMORIA ---------- */
let notaColoreSelezionato = "giallo";

async function loadNote(){
  if(DEMO_MODE){ noteList = demoState.note; return; }
  const { data, error } = await sb.from("scuderia_note")
    .select("id, centro_id, testo, colore, created_at, ordine")
    .eq("centro_id", currentCentro.id)
    .order("ordine", { ascending: true })
    .order("created_at", { ascending: false });
  if(!error) noteList = data || [];
}

function renderNote(){
  const board = document.getElementById("note-board");
  const empty = document.getElementById("note-empty");
  board.innerHTML = "";
  empty.style.display = noteList.length === 0 ? "block" : "none";

  noteList.forEach((n, idx) => {
    const rot = (idx % 2 === 0 ? -1 : 1) * (1 + (idx % 3));
    const div = document.createElement("div");
    div.className = `postit postit-${n.colore}`;
    div.dataset.id = n.id;
    div.style.setProperty("--postit-rot", rot + "deg");
    div.innerHTML = `<div class="close-x" onclick="deleteNota('${n.id}')"><i class="fa-solid fa-xmark"></i></div>${escapeHtml(n.testo)}`;
    div.addEventListener("pointerdown", onPostitPointerDown);
    board.appendChild(div);
  });
}

