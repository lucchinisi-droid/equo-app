/* ---------- Indice dei cavalli dei clienti (professionista) ---------- */
let cavalliMieiIndice = {}; // cliente_mascalcia_id → [nomi cavalli]
let cavalliMieiLista = [];
async function caricaCavalliMiei(){
  try{
    const lista = await DB.listCavalliMiei();
    cavalliMieiLista = lista || [];
    const idx = {};
    cavalliMieiLista.forEach(c => { if(!c.cliente_mascalcia_id) return; (idx[c.cliente_mascalcia_id] = idx[c.cliente_mascalcia_id] || []).push(c.nome || ""); });
    cavalliMieiIndice = idx;
  }catch(e){ console.warn("caricaCavalliMiei:", e); }
  return cavalliMieiLista;
}
function nomiCavalliCliente(c){
  const da = cavalliMieiIndice[c.id] || [];
  const testo = typeof nomiCavalliDaTesto === "function" ? nomiCavalliDaTesto(c.nome_cavallo || "") : [];
  return [...new Set([...da, ...(Array.isArray(testo) ? testo : [])].map(n => String(n || "").trim()).filter(Boolean))];
}
function paroleCercaCliente(c){
  return [c.nome_cavallo, ...nomiCavalliCliente(c), c.telefono, isStruttura(c) ? "struttura scuderia maneggio" : "proprietario"].filter(Boolean).join(" ");
}

