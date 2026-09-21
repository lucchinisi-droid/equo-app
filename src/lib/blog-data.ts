export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  category: "Salute & Prevenzione" | "Gestione Scuderia" | "Normative & Fisco" | "Tecnologia Equestre";
  date: string;
  readTime: string;
  author: {
    name: string;
    role: string;
  };
  image: string;
  featured?: boolean;
  content: string[];
  tags: string[];
}

export const blogPosts: BlogPost[] = [
  {
    slug: "calendario-sanitario-cavallo-vaccini-coggins",
    title: "Il calendario sanitario del cavallo: vaccini, test Coggins e ferrature",
    excerpt:
      "Tutto quello che ogni proprietario e scuderia deve monitorare per legge e per il benessere del cavallo: scadenze indispensabili e come evitare sanzioni o problemi in gara.",
    category: "Salute & Prevenzione",
    date: "12 Settembre 2026",
    readTime: "6 min lettura",
    author: {
      name: "Dott.ssa Elena Moretti",
      role: "Veterinaria Equestre & Consulente Equo",
    },
    image: "/images/6.png",
    featured: true,
    tags: ["Vaccinazioni", "Coggins Test", "Sanità Animale", "FISE"],
    content: [
      "La gestione sanitaria del cavallo richiede una pianificazione rigorosa. Dalle vaccinazioni obbligatorie per il trasporto e la partecipazione alle manifestazioni sportive, fino agli interventi di routine come il pareggio e la ferratura, ogni ritardo può compromettere il benessere del cavallo o impedire la partecipazione alle gare.",
      "Il Test di Coggins (anemia infettiva equina) è uno degli adempimenti più stringenti previsti dal Ministero della Salute: ha una validità variabile a seconda del territorio e della categoria del cavallo (12 o 24 mesi). Dimenticare la data di scadenza significa trovarsi con il cavallo bloccato in scuderia, impossibilitato a viaggiare o a partecipare a gare ufficiali.",
      "Per quanto riguarda l'influenza equina e il tetano, i richiami devono seguire scadenze precise: per i cavalli sportivi registrati FISE o FEI, il richiamo influenzale deve essere effettuato entro 6 mesi + 21 giorni dalla somministrazione precedente.",
      "Anche il maniscalco gioca un ruolo cruciale: un ciclo di ferratura medio dura tra le 5 e le 7 settimane. Superare questo intervallo altera l'asse appiombo-falangeo e predispone a tendiniti, sobbattiture e zoppie.",
      "Con Equo App puoi impostare queste scadenze una sola volta: riceverai promemoria automatici via email e notifica con 30, 15 e 7 giorni di anticipo, permettendoti di concordare per tempo la visita con il tuo veterinario e il tuo maniscalco di fiducia.",
    ],
  },
  {
    slug: "digitalizzare-scuderia-gestione-box-lezioni",
    title: "Digitalizzare la scuderia: stop a fogli volanti, quaderni e chat WhatsApp",
    excerpt:
      "Come i moderni centri ippici stanno ottimizzando le ore di lavoro degli istruttori, il carico dei cavalli della scuola e la rendicontazione delle pensioni.",
    category: "Gestione Scuderia",
    date: "5 Settembre 2026",
    readTime: "8 min lettura",
    author: {
      name: "Marco Brambilla",
      role: "Istruttore Federale & Gestore Centro Ippico",
    },
    image: "/images/17.png",
    featured: true,
    tags: ["Scuderia", "Maneggio", "Gestione Box", "Software Gestionale"],
    content: [
      "La vita in scuderia comincia presto la mattina e raramente finisce prima del tramonto. Chi gestisce un centro ippico conosce bene la fatica di dover dividere le giornate tra il lavoro in campo con gli allievi, la cura degli animali e una mole infinita di adempimenti burocratici.",
      "Tradizionalmente, la gestione delle lezioni e dei carnet abbonamento si basa su lavagne in segreteria o interminabili gruppi WhatsApp dove messaggi di disdetta si perdono tra richieste di orari.",
      "Equo Scuderia nasce proprio per risolvere questa frammentazione: offre un calendario condiviso in tempo reale dove gli allievi possono prenotare o richiedere cancellazioni direttamente dalla loro app, con aggiornamento automatico del saldo lezioni.",
      "Una delle funzioni più apprezzate dai gestori è il cruscotto a semaforo per la conformità sanitaria: a colpo d'occhio è possibile sapere quali cavalli hanno il Coggins in scadenza, quali allievi non hanno ancora rinnovato il certificato medico sportivo o il tesseramento, azzerando il rischio di sanzioni o problemi assicurativi.",
      "Inoltre, a fine mese il sistema aggrega le spese di pensione, lezioni e servizi extra (tosatura, paddock, somministrazione farmaci) generando un estratto conto trasparente e inviabile via email con un solo click.",
    ],
  },
  {
    slug: "cura-del-piede-ferratura-e-benessere-del-cavallo",
    title: "La cura del piede e il lavoro del maniscalco: la base del movimento",
    excerpt:
      "'Nessun piede, nessun cavallo': come la regolarità del pareggio, la qualità della ferratura e l'alimentazione influenzano direttamente la salute dell'arto.",
    category: "Salute & Prevenzione",
    date: "28 Agosto 2026",
    readTime: "5 min lettura",
    author: {
      name: "Roberto Riva",
      role: "Maestro Maniscalco",
    },
    image: "/images/10.png",
    featured: false,
    tags: ["Maniscalco", "Ferratura", "Pareggio", "Salute Zoccolo"],
    content: [
      "L'antico adagio inglese 'No foot, no horse' racchiude una verità biologica inconfutabile. Lo zoccolo del cavallo non è una semplice struttura rigida, ma una complessa pompa idraulica ed elastica che ammortizza tonnellate di peso ad ogni falcata.",
      "Un corretto equilibrio del piede richiede visite regolari del maniscalco: in media ogni 5-6 settimane per cavalli ferrati e 4-6 settimane per cavalli scalzi. Trascendere queste tempistiche porta a sbilanciamenti medio-laterali o dorsopalmari che si ripercuotono fino alla schiena e al collo dell'animale.",
      "Accanto al lavoro meccanico del professionista, gioca un ruolo determinante l'igiene della lettiera, la gestione dell'umidità (evitando il marcire del fettone) e una corretta integrazione alimentare ricca di biotina, zinco e metionina.",
      "Tenere traccia delle date di ferratura, dei tipi di ferro impiegati (es. rullati, con solette o a uovo) e dei costi storici consente al proprietario di monitorare l'evoluzione biomeccanica del cavallo nel tempo.",
    ],
  },
  {
    slug: "intelligenza-artificiale-supporto-proprietario-cavallo",
    title: "Come l'Intelligenza Artificiale può supportare la cura quotidiana del cavallo",
    excerpt:
      "Dall'analisi delle razioni alimentari al primo orientamento sui sintomi comportamentali: l'assistente AI di Equo spiegato nei dettagli.",
    category: "Tecnologia Equestre",
    date: "18 Agosto 2026",
    readTime: "7 min lettura",
    author: {
      name: "Simone Lucchini",
      role: "Fondatore Equo",
    },
    image: "/images/5.png",
    featured: false,
    tags: ["Intelligenza Artificiale", "Tecnologia", "Assistente Virtuale", "Equo App"],
    content: [
      "Avere un cavallo significa trovarsi costantemente di fronte a scelte e piccoli dubbi: perché oggi lascia il fieno? Questa fiaccatura richiede riposo assoluto o solo una crema protettiva? Come devo calibrare il pastone dopo una sessione intensa di lavoro?",
      "L'assistente AI integrato in Equo non si sostituisce mai al medico veterinario o all'istruttore federale, ma agisce come una guida h24 pronta a chiarire concetti, calcolare dosaggi nutrizionali indicativi e suggerire le migliori buone pratiche etologiche e gestionali.",
      "Grazie all'integrazione di modelli linguistici addestrati sulla letteratura scientifica equestre, l'assistente riconosce quando una situazione descritta dall'utente presenta caratteri di urgenza (come i primi segnali di una colica o di una laminite) e invita immediatamente a contattare il veterinario o la clinica h24 più vicina.",
      "Inoltre, l'AI è in grado di comprendere comandi in linguaggio naturale per programmare promemoria sanitari o registrare spese, rendendo l'esperienza d'uso fluida e accessibile direttamente da scuderia.",
    ],
  },
];

export function getPostBySlug(slug: string): BlogPost | undefined {
  return blogPosts.find((p) => p.slug === slug);
}

export function getRelatedPosts(currentSlug: string, limit = 3): BlogPost[] {
  return blogPosts.filter((p) => p.slug !== currentSlug).slice(0, limit);
}
