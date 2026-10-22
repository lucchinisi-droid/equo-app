// Equo · agenti AI (netlify/functions/agent.js) · configurazione: modello, prezzi, limiti, costanti
const { createClient } = require("@supabase/supabase-js");

const MODELLO = process.env.EQUO_AI_MODEL || "claude-sonnet-5";
// $ per milione di token (listino Anthropic verificato il 27/09/2026) — solo per stimare i costi
const PREZZI = {
  "claude-sonnet-5": { in: 2, out: 10, cacheRead: 0.2, cacheWrite: 2.5 },
  "claude-haiku-4-5-20251001": { in: 1, out: 5, cacheRead: 0.1, cacheWrite: 1.25 },
};
const LIMITI = { free: 5, premium: 500 };
const MAX_GIRI_TOOL = 6;
const CHIAVE_PUBBLICA = "sb_publishable_Qf-UTipNPe4Z8g6VpmW8Ag_8zCbNnBC";
// Hammer: ricerca web di Anthropic SOLO su questi siti ($10 ogni 1000 ricerche + token dei risultati)
const HAMMER_SITI = ["mustad.com", "kerckhaert.com", "equipodiatry.com", "americanfarriers.com", "ilportaledelcavallo.it"];
const HAMMER_MAX_RICERCHE = 3;
const COSTO_RICERCA_USD = 0.01;
const TIPI_EVENTO = { vaccino: "Vaccino", coggins: "Test Coggins (AIE)", ferratura: "Ferratura", sverminazione: "Sverminazione" };


// ---------------------------------------------------------------- regole comuni a TUTTI gli agenti
// Proattività + "Messaggero dei Boss" (richieste, problemi e idee degli utenti girati ai fondatori).

module.exports = { CHIAVE_PUBBLICA, COSTO_RICERCA_USD, HAMMER_MAX_RICERCHE, HAMMER_SITI, LIMITI, MAX_GIRI_TOOL, MODELLO, PREZZI, TIPI_EVENTO };
