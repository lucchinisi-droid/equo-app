/* ---------- DB: tutte le letture e scritture su Supabase dell'app ----------
   Un solo oggetto DB, diviso per argomento nei file core/dati/db-*.js: ogni file aggiunge le sue funzioni
   con Object.assign(DB, {...}). Si usa sempre come DB.nomeFunzione(...). */
const DB = {};
