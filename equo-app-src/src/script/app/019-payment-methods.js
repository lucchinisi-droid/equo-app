/* ---------- PAYMENT METHODS ---------- */
let selectedPmType = "carta";
const PM_LABELS = { carta: "Carta", paypal: "PayPal", iban: "IBAN" };

function selectPmType(type){
  selectedPmType = type;
  document.querySelectorAll(".pm-type-btn").forEach(b => b.classList.toggle("active", b.dataset.pmType === type));
  ["carta","paypal","iban"].forEach(t => {
    document.getElementById("pm-form-" + t).style.display = t === type ? "block" : "none";
  });
}

async function addPaymentMethod(type){
  let detail = "";
  if(type === "paypal"){
    detail = document.getElementById("pm-paypal-email").value.trim();
    if(!detail) return;
  } else if(type === "iban"){
    detail = document.getElementById("pm-iban").value.trim().toUpperCase();
    if(!detail) return;
  } else {
    detail = "•••• in attesa di Stripe";
  }
  // NOTA: per le carte non salvare mai il numero completo — questo è solo
  // un placeholder finché non colleghiamo Stripe (Setup Intent). Non è
  // ancora persistito su Supabase: quando lo colleghiamo, IBAN/email vanno
  // protetti con RLS (idealmente cifrati) prima di andare in produzione.
  demoState.paymentMethods = demoState.paymentMethods || [];
  demoState.paymentMethods.push({ id: "pm-" + Date.now(), type, detail });
  closeModal("modal-add-payment");
  renderPaymentMethods();
}

function removePaymentMethod(id){
  demoState.paymentMethods = (demoState.paymentMethods || []).filter(p => p.id !== id);
  renderPaymentMethods();
}

function renderPaymentMethods(){
  const box = document.getElementById("payment-methods-list");
  const methods = demoState.paymentMethods || [];
  if(methods.length === 0){
    box.innerHTML = "Nessun metodo salvato.";
    return;
  }
  const iconFor = { carta: "i-card", paypal: "i-paypal", iban: "i-bank" };
  box.innerHTML = methods.map(m => `
    <div class="pm-item">
      <div class="pm-icon"><span class="icon"><svg><use href="#${iconFor[m.type]}"/></svg></span></div>
      <div style="flex:1">
        <div style="font-weight:600;font-size:13px">${PM_LABELS[m.type]}</div>
        <div class="muted" style="font-size:12px">${escapeHtml(m.detail)}</div>
      </div>
      <button class="pm-remove" onclick="removePaymentMethod('${m.id}')">
        <span class="icon"><svg><use href="#i-x"/></svg></span>
      </button>
    </div>
  `).join("");
}

