/* ---------- chiamate ---------- */
async function rpc(nome, args){
  if(DEMO) return demoRpc(nome, args);
  const r = await fetch(`${SB_URL}/rest/v1/rpc/${nome}`, { method:"POST", headers:{ "Content-Type":"application/json", apikey:SB_KEY, Authorization:"Bearer " + SB_KEY }, body: JSON.stringify(args) });
  const j = await r.json().catch(() => null);
  if(!r.ok){ const e = new Error(j?.message || ("HTTP " + r.status)); e.server = true; throw e; }
  return j;
}

