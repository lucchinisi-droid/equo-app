/* ---------- DB · Profilo: avatar, dati di pagamento, codice personale ---------- */
Object.assign(DB, {
  /* -- Profilo: avatar, dati di pagamento, codice personale -- */
  async uploadAvatar(file){
    if(DEMO_MODE){
      return { url: URL.createObjectURL(file), error: null };
    }
    const ext = (file.name || "").split(".").pop() || "jpg";
    const path = `${currentUser.id}/avatar.${ext}`;
    const { error } = await sb.storage.from("avatar-utenti").upload(path, file, { upsert: true, contentType: file.type || "image/jpeg" });
    if(error) return { url: null, error };
    const { data } = sb.storage.from("avatar-utenti").getPublicUrl(path);
    const url = data?.publicUrl ? data.publicUrl + "?t=" + Date.now() : null; // cache-bust dopo un re-upload
    if(url) await sb.from("profiles").update({ avatar_url: url }).eq("id", currentUser.id);
    return { url, error: null };
  },
  async updateDatiPagamento({ tipo, nome, piva_cf, iban, paypal }){
    if(DEMO_MODE){
      Object.assign(currentUser, { datiPagamentoTipo: tipo, datiPagamentoNome: nome, datiPagamentoPivaCf: piva_cf, datiPagamentoIban: iban, datiPagamentoPaypal: paypal });
      return { error: null };
    }
    const { error } = await sb.from("profiles").update({
      dati_pagamento_tipo: tipo, dati_pagamento_nome: nome, dati_pagamento_piva_cf: piva_cf,
      dati_pagamento_iban: iban, dati_pagamento_paypal: paypal,
    }).eq("id", currentUser.id);
    return { error };
  },
  async ensureCodiceProfessionista(){
    // PRO = maniscalchi, TRA = allenatori, MED = veterinari
    const ruoliPro = [currentUser.ruolo, currentUser.ruoloSecondario];
    const pref = ruoliPro.includes("maniscalco") ? "PRO" : ruoliPro.includes("istruttore") ? "TRA" : ruoliPro.includes("veterinario") ? "MED" : "PRO";
    if(pref === "TRA" && !DEMO_MODE && tipoCodiceEquo(currentUser.codiceProfessionista) !== "tra"){
      const r = await sb.rpc("equo_mio_codice_trainer");
      if(!r.error && r.data) currentUser.codiceProfessionista = r.data;
      return currentUser.codiceProfessionista;
    }
    if(currentUser.codiceProfessionista) return currentUser.codiceProfessionista;
    const codice = nuovoCodiceEquo(pref);
    if(DEMO_MODE){
      currentUser.codiceProfessionista = codice;
      return codice;
    }
    const { error } = await sb.from("profiles").update({ codice_professionista: codice }).eq("id", currentUser.id);
    if(!error) currentUser.codiceProfessionista = codice;
    return currentUser.codiceProfessionista;
  },
});
