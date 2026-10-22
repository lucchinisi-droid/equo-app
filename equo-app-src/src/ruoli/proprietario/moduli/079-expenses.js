// Equo App · proprietario · modulo (moduli ES, costruiti con Vite in ruoli/proprietario/costruito.js)
/* ---------- EXPENSES ---------- */
async function loadExpensesSummary(){
  const horseIds = horses.map(h => h.id);
  if(horseIds.length === 0) return;
  const startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0,0,0,0);
  const all = await DB.listExpenses();
  const total = all.filter(e => new Date(e.date) >= startOfMonth).reduce((sum, e) => sum + Number(e.amount || 0), 0);
  document.getElementById("stat-expenses").textContent = "€ " + total.toFixed(0);
}

async function loadExpenses(){
  const box = document.getElementById("expenses-list");
  box.innerHTML = '<div class="loading"><div class="spinner"></div> Caricamento...</div>';
  const data = await DB.listExpenses();
  currentExpensesData = data || [];
  if(!data || data.length === 0){
    box.innerHTML = '<div class="empty-state"><div class="icon" style="width:32px;height:32px;margin:0 auto 10px"><svg><use href="#i-wallet"/></svg></div>Nessuna spesa registrata.</div>';
    document.getElementById("expenses-month-total").textContent = "€ 0";
    return;
  }
  const startOfMonth = new Date(); startOfMonth.setDate(1);
  const monthTotal = data.filter(e => new Date(e.date) >= startOfMonth).reduce((s,e)=>s+Number(e.amount||0),0);
  document.getElementById("expenses-month-total").textContent = "€ " + monthTotal.toFixed(2);
  box.innerHTML = data.map(e => `
    <div class="event-item" style="cursor:pointer" onclick="openEditExpenseModal('${e.id}')">
      <div>
        <div style="font-weight:600;font-size:14px;text-transform:capitalize">${escapeHtml(e.category)}${e.horses?.name ? " · " + escapeHtml(e.horses.name) : ""}</div>
        <div class="muted" style="font-size:12px">${formatDate(e.date)}${e.notes ? " · " + escapeHtml(e.notes) : ""}</div>
      </div>
      <div style="font-weight:700">€ ${Number(e.amount).toFixed(2)}</div>
    </div>
  `).join("");
}

let editingExpenseId = null;
/* -> stato-condiviso.js */
function openAddExpenseModal(){
  editingExpenseId = null;
  document.getElementById("modal-add-expense-title").textContent = "Nuova spesa";
  document.getElementById("expense-category").value = "pensione";
  document.getElementById("expense-amount").value = "";
  document.getElementById("expense-date").value = "";
  document.getElementById("expense-notes").value = "";
  document.getElementById("expense-delete-btn").style.display = "none";
  openModal("modal-add-expense");
}

function openEditExpenseModal(id){
  const e = currentExpensesData.find(x => x.id === id);
  if(!e) return;
  editingExpenseId = id;
  document.getElementById("modal-add-expense-title").textContent = "Modifica spesa";
  document.getElementById("expense-category").value = e.category;
  document.getElementById("expense-amount").value = e.amount;
  document.getElementById("expense-date").value = e.date;
  document.getElementById("expense-notes").value = e.notes || "";
  document.getElementById("expense-delete-btn").style.display = "block";
  openModal("modal-add-expense");
}

async function saveExpense(){
  const category = document.getElementById("expense-category").value;
  const amount = parseFloat(document.getElementById("expense-amount").value);
  const date = document.getElementById("expense-date").value;
  const notes = document.getElementById("expense-notes").value.trim();
  if(!amount || !date) return;
  const existing = editingExpenseId ? currentExpensesData.find(x => x.id === editingExpenseId) : null;
  const horse_id = existing ? existing.horse_id : (currentHorseId || (horses[0] ? horses[0].id : null));
  const payload = { horse_id, category, amount, date, notes };
  const { error } = editingExpenseId ? await DB.updateExpense(editingExpenseId, payload) : await DB.insertExpense(payload);
  if(error){ alert("Errore: " + error.message); return; }
  document.getElementById("expense-amount").value = "";
  document.getElementById("expense-date").value = "";
  document.getElementById("expense-notes").value = "";
  editingExpenseId = null;
  closeModal("modal-add-expense");
  await loadExpenses();
  await loadExpensesSummary();
}

async function deleteExpenseFromModal(){
  if(!editingExpenseId) return;
  if(!confirm("Eliminare questa spesa?")) return;
  await DB.deleteExpense(editingExpenseId);
  editingExpenseId = null;
  closeModal("modal-add-expense");
  await loadExpenses();
  await loadExpensesSummary();
}
// nome vecchio
const createExpense = saveExpense;


export { deleteExpenseFromModal, loadExpenses, loadExpensesSummary, openAddExpenseModal, openEditExpenseModal, saveExpense };
