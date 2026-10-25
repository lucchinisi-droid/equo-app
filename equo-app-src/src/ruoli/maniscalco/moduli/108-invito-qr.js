// Equo App · maniscalco · modulo (moduli ES, costruiti con Vite in ruoli/maniscalco/costruito.js)
import { isStruttura } from "./033-clienti-a-cartelle-stile-telegram-cavall.js";
/* ---------- «COLLEGHIAMOCI SU EQUO» (25/10/2026) ----------
   Link di invito app.equohub.com/?invito=EQUO-XXXXX: chi lo apre arriva su Equo, crea l'account e si collega da solo
   (l'app del proprietario ricorda il codice e chiama riscatta_codice_maniscalco). Usato nel QR dei PDF (appuntamento,
   conto, resoconto), nel QR della scheda cliente e in «Condividi l'invito». Solo per clienti proprietari non ancora collegati:
   le scuderie si collegano con Equo Scuderia. */
const URL_APP_EQUO = "https://app.equohub.com/";
function linkInvito(codice){ return URL_APP_EQUO + "?invito=" + encodeURIComponent(String(codice || "").toUpperCase()); }
function clienteDaInvitare(c){
  return c && !c.cliente_user_id && !c.centro_id && !isStruttura(c) && c.codice_invito ? c : null;
}
// «Maniscalco», «Veterinario», «Istruttore» nei PDF
function etichettaPro(){
  const r = currentUser?.vistaAttiva || currentUser?.ruolo;
  return { maniscalco: "Maniscalco", veterinario: "Veterinario", istruttore: "Istruttore" }[r] || "Professionista";
}
// moduli del QR (stessa libreria della scheda cliente), per disegnarlo nel PDF come quadratini: nitido anche in stampa
function moduliQr(testo){
  if(typeof QRCode !== "function") return null;
  try{
    const div = document.createElement("div");
    new QRCode(div, { text: testo, width: 64, height: 64 });
    const svg = div.querySelector("svg"), path = svg && svg.querySelector("path");
    if(!svg || !path) return null;
    const n = Number(String(svg.getAttribute("viewBox")).split(" ")[2]);
    const punti = [...String(path.getAttribute("d")).matchAll(/M(\d+),(\d+)/g)].map(m => [Number(m[1]), Number(m[2])]);
    return n > 0 && punti.length ? { n, punti } : null;
  }catch(e){ return null; }
}
// QR disegnato nel PDF a quadratini (nitido in stampa): Equo Pass ed Equo CV
function disegnaQrPdf(doc, testo, x, y, lato){
  const q = moduliQr(testo);
  if(!q) return false;
  doc.setFillColor(255, 255, 255); doc.rect(x - 1.5, y - 1.5, lato + 3, lato + 3, "F");
  doc.setFillColor(0, 0, 0);
  const m = lato / q.n;
  q.punti.forEach(([cx, cy]) => doc.rect(x + cx * m, y + cy * m, m + 0.02, m + 0.02, "F"));
  return true;
}
// riquadro in fondo al PDF; nuovaPagina() deve aggiungere la pagina e ritornare la nuova y
function riquadroInvitoPdf(doc, cli, y, W, M, nuovaPagina){
  const c = clienteDaInvitare(cli);
  if(!c) return y;
  const q = moduliQr(linkInvito(c.codice_invito));
  if(!q) return y;
  const H = 46;
  if(y + H > 274) y = nuovaPagina();
  const verde = [20, 49, 42], oro = [201, 143, 46], grigio = [95, 111, 103];
  y += 4;
  doc.setFillColor(248, 246, 240); doc.setDrawColor(...oro); doc.setLineWidth(0.5);
  doc.roundedRect(M, y, W - M * 2, H, 3, 3, "FD");
  const lato = 36, x0 = M + 5, y0 = y + 5, m = lato / q.n;
  doc.setFillColor(255, 255, 255); doc.rect(x0 - 1.5, y0 - 1.5, lato + 3, lato + 3, "F");
  doc.setFillColor(0, 0, 0);
  q.punti.forEach(([cx, cy]) => doc.rect(x0 + cx * m, y0 + cy * m, m + 0.02, m + 0.02, "F"));
  const xt = x0 + lato + 8, lw = W - M - 5 - xt;
  doc.setFont("helvetica", "bold"); doc.setFontSize(14); doc.setTextColor(...verde);
  doc.text("Colleghiamoci su Equo", xt, y + 12);
  doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(...grigio);
  const righe = doc.splitTextToSize("Inquadra il codice con la fotocamera del telefono: si apre Equo, crei il tuo account gratuito e siamo collegati. Vedrai lavori, scadenze e pagamenti dei tuoi cavalli.", lw);
  doc.text(righe, xt, y + 19);
  doc.setFont("helvetica", "bold"); doc.setFontSize(10.5); doc.setTextColor(...oro);
  doc.text("Codice invito: " + c.codice_invito, xt, y + H - 6);
  return y + H + 4;
}
// «Condividi l'invito» dalla scheda cliente: condivisione di sistema (WhatsApp, SMS...) con il link
function condividiInvitoCliente(){
  const c = clienteDaInvitare((typeof clientiMascalcia !== "undefined" ? clientiMascalcia : []).find(x => x.id === currentClienteId));
  if(!c) return;
  const testo = c.codice_invito + "\n" + linkInvito(c.codice_invito);
  if(navigator.share){ navigator.share({ text: testo }).catch(() => {}); return; }
  window.open("https://wa.me/?text=" + encodeURIComponent(testo), "_blank");
}

export { disegnaQrPdf, clienteDaInvitare, condividiInvitoCliente, etichettaPro, linkInvito, riquadroInvitoPdf };
