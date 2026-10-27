// Equo App · maniscalco · STATO CONDIVISO: variabili che anche altre parti dell'app leggono o cambiano.
// Script classico caricato PRIMA dei moduli del maniscalco e dello script principale: qui solo dati, nessuna funzione.
// da 031-mascalcia-clienti-interventi-del-profess.js
let clientiMascalcia = [];
// da 031-mascalcia-clienti-interventi-del-profess.js
let proUnreadTotal = 0;
// da 031-mascalcia-clienti-interventi-del-profess.js
let currentClienteId = null;
// da 031-mascalcia-clienti-interventi-del-profess.js
const TIPO_FERRATURA_LABELS = { ferratura: "Ferratura", mezza_ferratura: "Mezza ferratura", pareggio: "Pareggio", altro: "Altro" };
// da 031-mascalcia-clienti-interventi-del-profess.js
const TIPO_FERRATURA_INTERVALLI = { ferratura: 35, mezza_ferratura: 35, pareggio: 56 };
// da 033-clienti-a-cartelle-stile-telegram-cavall.js
let cliCartella = "cavalli", cliCavalliEquo = [], cliInterventi = [];
// da 033-clienti-a-cartelle-stile-telegram-cavall.js
let schedaDaCartella = false;
// da 034-strutture-collegate-a-equo-scuderia-prof.js
const LIMITE_CLIENTI_FREE = 10;
// da 034-strutture-collegate-a-equo-scuderia-prof.js
let clienteInterventiCache = [];
// da 036-archivia-elimina-cliente.js
let storicoFiltroCavallo = "tutti";
// da 037-scheda-cliente-a-box-scheda-del-cavallo.js
let schedaCavalli = [], schedaFoto = {}, schedaCavalloKey = null, schedaCavalloTab = "tutto", schedaStoricoCavallo = [], schedaSpostamenti = [];
// da 038-avviso-sembra-lo-stesso-cavallo.js
let storicoClienteId = null;
// da 040-home-pro-prossimi-appuntamenti-da-richia.js
let hpAppuntamenti = [], hpRichiami = {}, hpRichiamiLista = [], hpRichiamoId = null, hpListaTipo = null, hpListaFiltro = "tutti";
// da 047-incassi-saldati-per-periodo-da-saldare-p.js
let incPeriodo = "oggi", incTutti = [], incElencoTutto = false, incCavalli = [];
// da 047-incassi-saldati-per-periodo-da-saldare-p.js
let incVista = (() => { try { return localStorage.getItem("equo-inc-vista") || "semplice"; } catch(e){ return "semplice"; } })();
// da 047-incassi-saldati-per-periodo-da-saldare-p.js
let incAperta = "dasaldare", incCliTutti = false;
// da 050-sposta-cavallo-dove-sta-il-cavallo-a-cas.js
const UBIC_CAMPI = ["ubicazione_tipo", "ubicazione_cliente_id", "ubicazione_nome", "ubicazione_indirizzo", "ubicazione_dal"];
// da 050-sposta-cavallo-dove-sta-il-cavallo-a-cas.js
let cavalliMieiCache = null, cavalliMieiTs = 0, cavalliMieiById = {}, cavalliMieiByHorse = {};
// da 051-modal-appuntamento-maniscalco-nuovo-modi.js
const MISURA_INDICE_PARTENZA = 3;
// da 051-modal-appuntamento-maniscalco-nuovo-modi.js
let misuraIndiceCorrente = MISURA_INDICE_PARTENZA;
// da 051-modal-appuntamento-maniscalco-nuovo-modi.js
let cavalliClienteCorrente = [];
// da 051-modal-appuntamento-maniscalco-nuovo-modi.js
let interventoInModifica = null;
// da 051-modal-appuntamento-maniscalco-nuovo-modi.js
let interventoPreset = null;
// da 051-modal-appuntamento-maniscalco-nuovo-modi.js
let misuraIndiceFerro = MISURA_INDICE_PARTENZA;
// da 053-agenda-settimanale-maniscalco.js
let agSettimanaOffset = 0;
// da 053-agenda-settimanale-maniscalco.js
let agGiorniAperti = null;
// da 053-agenda-settimanale-maniscalco.js
let agEventiCache = {};
// da 053-agenda-settimanale-maniscalco.js
let agEventoAzioniId = null;
// da 054-richieste-di-appuntamento-step-5d.js
const STATI_NON_CONFERMATI = ["richiesto", "rifiutato", "proposto", "annullato"];
// da 055-appuntamenti-con-strutture-equo-scuderia.js
let agGiorniDati = [], agLuoghi = {};
// da 057-pdf-appuntamento-invio-in-chat-maniscalc.js
let chatAllegatoEvento = null;
// da 057-pdf-appuntamento-invio-in-chat-maniscalc.js
let contoCtx = null;
// da 057-pdf-appuntamento-invio-in-chat-maniscalc.js
let contoAperto = null;
// da 094-arrivo-sul-posto-se-apri-l-app-vicino-a.js
let mlArrivoKey = null;
// da 094-arrivo-sul-posto-se-apri-l-app-vicino-a.js
let hmTappe = [];
// da 098-professionista.js
let wgPro = { incassatoMese: 0, daIncassareMese: 0, unread: 0, ultimo: null, settimana: null, settimanaChiave: null };
