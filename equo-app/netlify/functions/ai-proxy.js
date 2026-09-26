// DISMESSA il 27/09/2026: sostituita da agent.js (login verificato, limiti lato server,
// dati dell'utente, schede verificate, memoria). Questa vecchia funzione non verificava
// chi la chiamava: chiunque poteva usarla a spese di Equo. Ora risponde sempre 410.
exports.handler = async () => ({ statusCode: 410, body: JSON.stringify({ error: "Funzione dismessa: usa /.netlify/functions/agent" }) });
