// Equo · funzioni Netlify · AVVISI comuni (2/11/2026): notifica push (OneSignal) ed email (Resend).
// Usati da invia-promemoria (promemoria di Hammer) e invia-terapie (piano terapeutico del veterinario).
const URL_APP = "https://app.equohub.com";
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

// push a un utente (external_id = id utente); true solo se consegnata a qualche dispositivo
async function inviaPush({ userId, titolo, testo, dati, url, etichetta }) {
  if (!process.env.ONESIGNAL_APP_ID || !process.env.ONESIGNAL_REST_API_KEY || !userId) return false;
  try {
    const res = await fetch("https://api.onesignal.com/notifications?c=push", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Key ${process.env.ONESIGNAL_REST_API_KEY}` },
      body: JSON.stringify({ app_id: process.env.ONESIGNAL_APP_ID, target_channel: "push", include_aliases: { external_id: [userId] },
        headings: { en: titolo }, contents: { en: String(testo || "").slice(0, 140) }, data: dati || {}, url: url || URL_APP }),
    });
    const j = await res.json().catch(() => ({}));
    // OneSignal risponde 200 anche senza destinatari: in quel caso id vuoto o errors («not subscribed»)
    const ok = res.ok && !!j.id && !(Array.isArray(j.errors) ? j.errors.length : j.errors);
    if (!ok) console.log((etichetta || "avviso") + " push non consegnata:", JSON.stringify(j).slice(0, 200));
    return ok;
  } catch (e) { console.error((etichetta || "avviso") + " push:", e); return false; }
}

async function inviaEmail({ to, oggetto, html, etichetta }) {
  if (!to || !process.env.RESEND_API_KEY || !process.env.EMAIL_MITTENTE) return false;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
      body: JSON.stringify({ from: process.env.EMAIL_MITTENTE, reply_to: process.env.EMAIL_RISPOSTE || "gestione.equo@gmail.com", to: [to], subject: oggetto, html }),
    });
    if (!res.ok) console.error((etichetta || "avviso") + " email:", await res.text());
    return res.ok;
  } catch (e) { console.error((etichetta || "avviso") + " email:", e); return false; }
}

module.exports = { URL_APP, esc, inviaPush, inviaEmail };
