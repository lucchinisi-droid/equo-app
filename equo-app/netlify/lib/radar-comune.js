// Radar di Merlino — parti comuni (firma interna tra funzioni, zona del centro)
const crypto = require("crypto");
const firma = (centroId) => crypto.createHash("sha256").update(`${process.env.SUPABASE_SERVICE_ROLE_KEY}:radar:${centroId}`).digest("hex");
const zonaCentro = (c) => [c.citta, c.provincia ? `(${c.provincia})` : "", c.regione].filter(Boolean).join(" ").trim() || (c.indirizzo || "").trim();
async function avviaRadar(centroId, richiestoDa) {
  const base = process.env.URL || "https://app.equohub.com";
  const res = await fetch(`${base}/.netlify/functions/radar-merlino-background`, {
    method: "POST", headers: { "Content-Type": "application/json", "x-equo-firma": firma(centroId) },
    body: JSON.stringify({ centro_id: centroId, richiesto_da: richiestoDa || null }),
  });
  return res.status === 202 || res.ok;
}
module.exports = { firma, zonaCentro, avviaRadar };
