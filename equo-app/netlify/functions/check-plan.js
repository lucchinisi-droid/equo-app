// Funzione dismessa (mai collegata all'app): il piano si legge da profiles.piano con le regole del database.
exports.handler = async () => ({ statusCode: 410, body: JSON.stringify({ error: "Funzione non più disponibile" }) });
