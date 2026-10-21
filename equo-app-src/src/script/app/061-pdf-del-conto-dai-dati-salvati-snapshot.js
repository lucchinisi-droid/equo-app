/* ---- PDF del conto: dai dati salvati (snapshot), mai ferri nuovi né note private ---- */
async function creaPdfConto(c){
  const JsPDF = await caricaJsPdf();
  const doc = new JsPDF({ unit: "mm", format: "a4" });
  const W = 210, M = 18, verde = [20, 49, 42], oro = [201, 143, 46], grigio = [95, 111, 103];
  const cli = clienteDiId(c.cliente_mascalcia_id);
  const piede = () => {
    doc.setDrawColor(227, 221, 204); doc.line(M, 280, W - M, 280);
    doc.setFont("helvetica", "normal"); doc.setFontSize(8.5); doc.setTextColor(...grigio);
    doc.text("Resoconto generato con Equo — equohub.com. Non è una fattura e non ha valore fiscale.", M, 285);
  };
  doc.setFillColor(...verde); doc.rect(0, 0, W, 32, "F");
  doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(22); doc.text("Equo", M, 20);
  doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.text("Prenditi cura del tuo cavallo", M, 26);
  doc.text(contoData(c.creato_il), W - M, 20, { align: "right" });
  doc.setFillColor(...oro); doc.rect(0, 32, W, 1.5, "F");
  let y = 48;
  doc.setTextColor(...verde); doc.setFont("helvetica", "bold"); doc.setFontSize(17); doc.text("Resoconto lavori", M, y);
  doc.setFontSize(12); doc.setTextColor(...oro); doc.text(contoCodice(c), W - M, y, { align: "right" });
  y += 9; doc.setFontSize(15); doc.setTextColor(...verde); doc.text(cli?.nome || "", M, y);
  const pro = currentUser?.datiPagamentoNome || currentUser?.fullName || currentUser?.full_name || "";
  doc.setFont("helvetica", "normal"); doc.setFontSize(10.5); doc.setTextColor(...grigio);
  if(pro){ y += 6; doc.text("Maniscalco: " + pro + (currentUser?.certificazioneStato === "verificato" ? "  ·  Equo Certified" : ""), M, y); }
  if(c.periodo_da || c.periodo_a){ y += 5.5; doc.text("Periodo: " + (c.periodo_da ? "dal " + contoData(c.periodo_da) + " " : "") + (c.periodo_a ? "al " + contoData(c.periodo_a) : ""), M, y); }
  y += 10;
  const colData = M + 2, colCav = M + 26, colLav = M + 78, colImp = W - M - 2;
  const testa = () => {
    doc.setFillColor(...verde); doc.rect(M, y - 5, W - M * 2, 8, "F");
    doc.setFont("helvetica", "bold"); doc.setFontSize(9.5); doc.setTextColor(255, 255, 255);
    doc.text("DATA", colData, y); doc.text("CAVALLO", colCav, y); doc.text("LAVORO", colLav, y); doc.text("IMPORTO", colImp, y, { align: "right" });
    y += 8;
  };
  testa();
  const nuovaPagina = () => { piede(); doc.addPage(); y = 22; testa(); };
  const gruppi = {};
  (c.righe || []).forEach(r => { (gruppi[r.proprietario_nome || "—"] = gruppi[r.proprietario_nome || "—"] || []).push(r); });
  const nomi = Object.keys(gruppi).sort((a, b) => a.localeCompare(b, "it"));
  const conGruppi = c.modo === "unico" && nomi.length > 1 || nomi.length > 1;
  let k = 0;
  nomi.forEach(n => {
    const lista = gruppi[n].slice().sort((a, b) => String(a.data_intervento).localeCompare(String(b.data_intervento)));
    if(conGruppi){
      if(y > 262) nuovaPagina();
      doc.setFont("helvetica", "bold"); doc.setFontSize(10.5); doc.setTextColor(...oro); doc.text(n, colData, y); y += 6;
    }
    lista.forEach(r => {
      const lav = doc.splitTextToSize(String(r.descrizione || ""), colImp - colLav - 24);
      const h = Math.max(7.5, lav.length * 4.8 + 2.6);
      if(y + h > 268) nuovaPagina();
      if(k++ % 2 === 0){ doc.setFillColor(248, 246, 240); doc.rect(M, y - 4.6, W - M * 2, h, "F"); }
      doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(...grigio); doc.text(contoData(r.data_intervento), colData, y);
      doc.setFont("helvetica", "bold"); doc.setTextColor(...verde); doc.text(doc.splitTextToSize(String(r.cavallo_nome || ""), colLav - colCav - 3), colCav, y);
      doc.setFont("helvetica", "normal"); doc.setTextColor(...grigio); doc.text(lav, colLav, y);
      doc.setFont("helvetica", "bold"); doc.setTextColor(...verde); doc.text(contoEuro(r.importo), colImp, y, { align: "right" });
      y += h;
    });
    if(conGruppi){
      const sub = gruppi[n].reduce((s, r) => s + Number(r.importo), 0);
      doc.setFont("helvetica", "normal"); doc.setFontSize(9.5); doc.setTextColor(...grigio); doc.text("Subtotale " + n, colLav + 40, y, { align: "left" });
      doc.setFont("helvetica", "bold"); doc.text(contoEuro(sub), colImp, y, { align: "right" }); y += 8;
    }
  });
  if(y > 246) nuovaPagina();
  y += 4;
  doc.setDrawColor(...oro); doc.setLineWidth(0.6); doc.line(M, y, W - M, y); y += 9;
  doc.setFont("helvetica", "bold"); doc.setFontSize(12); doc.setTextColor(...grigio); doc.text(contoLavori(c.n_lavori), M, y);
  doc.setFontSize(17); doc.setTextColor(...verde); doc.text("TOTALE  " + contoEuro(c.totale), W - M, y, { align: "right" });
  y += 12;
  if(c.stato !== "pagato" && (currentUser?.datiPagamentoIban || currentUser?.datiPagamentoPaypal)){
    if(y > 250) nuovaPagina();
    doc.setFont("helvetica", "bold"); doc.setFontSize(12); doc.setTextColor(...verde); doc.text("Dati per il pagamento", M, y); y += 7;
    doc.setFont("helvetica", "normal"); doc.setFontSize(10.5); doc.setTextColor(...grigio);
    if(currentUser.datiPagamentoNome){ doc.text("Intestatario: " + currentUser.datiPagamentoNome, M, y); y += 6; }
    if(currentUser.datiPagamentoIban){ doc.text("IBAN: " + currentUser.datiPagamentoIban, M, y); y += 6; }
    if(currentUser.datiPagamentoPaypal){ doc.text("PayPal: " + currentUser.datiPagamentoPaypal, M, y); y += 6; }
    doc.text("Causale: Conto " + contoCodice(c), M, y);
  } else if(c.stato === "pagato"){
    doc.setFont("helvetica", "bold"); doc.setFontSize(12); doc.setTextColor(...verde); doc.text("Conto saldato" + (c.pagato_il ? " il " + contoData(c.pagato_il) : ""), M, y);
  }
  piede();
  return { blob: doc.output("blob"), nome: contoNomeFile(c) };
}

