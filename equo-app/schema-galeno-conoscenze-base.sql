-- Equo: conoscenze di GALENO, versione base (2 novembre 2026) · SQL 30
-- Elenco approvato da Simone il 2/11 (claude/Galeno_Elenco_schede_base.md).
-- 1. cerca_conoscenze: le schede «professionista» valgono anche per il veterinario (prima solo maniscalco).
-- 2. 19 schede cliniche (ambito veterinario): sintesi in italiano scritte da noi, con autori, rivista, DOI e licenza.
--    Gli articoli della cartella Drive GALENO_KNOWLEDGE_BASE sono CC BY: ogni scheda è dichiarata «adattamento in italiano».
--    Per la PPID è usata la linea guida BEVA 2023 (sintesi nostra con citazione, decisione di Simone del 2/11).
-- 3. 7 schede di normativa (leggi e atti ufficiali).
-- 4. 6 guide all'uso dell'app per il veterinario (categoria guida).
-- Nessuna dose, nessuna prescrizione. Le schede vanno rilette da un veterinario (Riccardo o Laura) prima dell'apertura.
-- Galeno legge anche le schede «tutti» già presenti (anagrafe, Coggins/AIE, vaccino antinfluenzale FEI, sverminazione,
-- colica, laminite, parametri vitali): qui non sono ripetute.
-- Rieseguibile: se il titolo esiste già, la scheda si aggiorna.

-- 1 · ricerca: «professionista» anche per il veterinario ------------------------------------------
create or replace function public.cerca_conoscenze(p_query text, p_ambito text default null::text, p_limite integer default 4)
 returns json
 language sql
 stable
 set search_path to 'public'
as $function$
  with q as (
    select nullif(replace(plainto_tsquery('italian', coalesce(p_query,''))::text, '&', '|'), '')::tsquery as tq
  )
  select coalesce(json_agg(x), '[]'::json) from (
    select k.titolo, k.categoria, k.contenuto, k.fonte_titolo, k.fonte_url, k.verificato_il
    from public.ai_conoscenze k, q
    where k.attivo and q.tq is not null and k.tsv @@ q.tq and k.categoria is distinct from 'guida'
      and (p_ambito is null or k.ambito in ('tutti', p_ambito)
           or (p_ambito in ('maniscalco', 'veterinario') and k.ambito = 'professionista'))
    order by ts_rank(k.tsv, q.tq) desc
    limit greatest(1, least(coalesce(p_limite, 4), 8))
  ) x;
$function$;

-- 2 · schede cliniche -------------------------------------------------------------------------------
insert into public.ai_conoscenze (ambito, categoria, titolo, contenuto, fonte_titolo, fonte_url, verificato_il, attivo) values

('veterinario', 'urgenze',
 'Colica: valutare il dolore con la scala EAAPS',
 $t$Scala EAAPS (Equine Acute Abdominal Pain Scale): si osserva il cavallo, si segnano i comportamenti visti e il punteggio è quello del comportamento più grave. Non servono calcoli.
0 = nessun segno di dolore · 1 = si guarda il fianco, flehmen · 2 = decubito sternale o si stira, irrequietezza · 3 = calcia l'addome, raspa · 4 = cerca di sdraiarsi, si accuccia, decubito laterale · 5 = si rotola.
Studio prospettico (231 coliche, UK e Israele): scala giudicata rapida e facile da chi la usava la prima volta; buon accordo con la scala visiva analogica (kappa 0,64); associata alla chirurgia (AUC 0,69, soglia 3,5) ma meno della VAS nel prevedere la mortalità (AUC 0,65 contro 0,82). La frequenza cardiaca correlava poco con entrambe.
Uso pratico: serve a graduare il dolore e a seguirne l'andamento, non a fare diagnosi né da sola a decidere la prognosi. Il cavallo nel travaglio mostra meno comportamenti. Non è ancora validata dai veterinari ambulatoriali in campo.
Limiti: campione di un solo ospedale per la maggior parte, nessuna prova di ripetibilità in questo studio. La rettifica del 2022 aggiunge solo la dichiarazione etica, le conclusioni non cambiano.
Adattamento in italiano; sintesi da confermare dal veterinario.$t$,
 'Maskato Y, Dugdale AHA, Singer ER, Kelmer G, Sutton GA. Animals 2020;10(12):2242, doi:10.3390/ani10122242 (rettifica Animals 2022;12(8):1001) · CC BY 4.0',
 'https://doi.org/10.3390/ani10122242', '2026-11-02', true),

('veterinario', 'urgenze',
 'Colica: fattori di rischio legati alla gestione',
 $t$Revisione (scoping review su 52 studi + revisione sistematica su 14 studi, 1990-2008) dei fattori di rischio di colica nel cavallo adulto.
Fattori più ricorrenti negli studi (rapporti di rischio da singoli studi, non stime cumulative):
- colica nei 12 mesi precedenti;
- cambio di alimentazione nelle 2 settimane prima, cambio di partita di fieno;
- cambio di sistemazione (box, paddock) nelle 2 settimane prima;
- trasporto nelle 24 ore precedenti (associazione forte ma imprecisa);
- molto concentrato, poca acqua bevuta, alcuni tipi di foraggio;
- ticchio d'appoggio/aerofagia, legato soprattutto all'intrappolamento nel forame epiploico;
- età, problemi dentali, ricovero, storia dei trattamenti antiparassitari: risultati diversi tra gli studi.
Conclusione degli autori: i fattori che si possono modificare, soprattutto i CAMBI di gestione, sono il bersaglio della prevenzione. Utile per i consigli al proprietario: cambi graduali di fieno e alimentazione, attenzione dopo trasporti e cambi di box, acqua sempre disponibile.
Limiti: studi vecchi, diversi tra loro, spesso senza controllo dei fattori confondenti (8 su 14); nessuna meta-analisi possibile.
Adattamento in italiano; sintesi da confermare dal veterinario.$t$,
 'Curtis L, Burford JH, England GCW, Freeman SL. PLoS ONE 2019;14(7):e0219307, doi:10.1371/journal.pone.0219307 · CC BY 4.0',
 'https://doi.org/10.1371/journal.pone.0219307', '2026-11-02', true),

('veterinario', 'urgenze',
 'SIRS e sepsi nel cavallo adulto: criteri e segnali',
 $t$Nel cavallo non esiste una definizione di sepsi condivisa: di solito si intende una risposta infiammatoria sistemica sregolata dovuta a un'infezione.
Criteri SIRS usati negli studi sull'adulto (servono almeno 2 su 4):
- versione Epstein: temperatura > 38,6 °C, frequenza cardiaca > 60, respiratoria > 30, globuli bianchi > 12.500 o < 4.500/µL o > 10% di neutrofili a banda;
- versione Roy 2017 (464 urgenze): FC > 52, FR > 20, temperatura fuori da 37,0-38,5 °C, globuli bianchi fuori da 5,0-12,5 × 10⁹/L. Il 31% aveva 2 o più criteri all'arrivo; con 3-4 criteri il rischio di morte era molto più alto.
Cause frequenti nell'adulto: colica (soprattutto lesioni strangolanti), colite, pleuropolmonite, tenosinovite settica. Complicanza temuta: laminite da sepsi.
Altri indicatori di rischio citati: lattato elevato, colore delle mucose, neutrofili a banda sullo striscio all'arrivo, punteggi di insufficienza d'organo.
Limiti: i criteri SIRS sono sensibili ma poco specifici; l'emocoltura ha bassa sensibilità; molti dati vengono da modelli sperimentali.
Adattamento in italiano; sintesi da confermare dal veterinario.$t$,
 'Sheats MK. A Comparative Review of Equine SIRS, Sepsis, and Neutrophils. Front Vet Sci 2019;6:69, doi:10.3389/fvets.2019.00069 · CC BY',
 'https://doi.org/10.3389/fvets.2019.00069', '2026-11-02', true),

('veterinario', 'riproduzione',
 'Puledro neonato: sepsi, punteggio di Brewer-Koterba e NGAL',
 $t$Studio retrospettivo su 91 puledri ≤ 14 giorni (ospedale universitario di Copenaghen, 2007-2017).
- Sepsi definita con il punteggio di Brewer e Koterba (14 parametri, 0-16 punti): sepsi se ≥ 11.
- NGAL nel siero all'arrivo più alta nei puledri settici. Con soglia 455 µg/L: sensibilità 71%, specificità 100% (AUC 0,80).
- NGAL più alta nei non sopravvissuti; soglia 1104 µg/L: sensibilità 39%, specificità 95%.
- La SAA ha dato risultati simili per la sepsi (soglia 62 mg/L: sensibilità 86%, specificità 88%).
Uso pratico: NGAL e SAA sono indicatori in più, non sostituiscono visita, emocoltura e punteggio clinico. Per la NGAL non ci sono ancora valori di riferimento neonatali né un test da campo.
Limiti: pochi puledri settici (21) e non settici (8), molti di stato incerto (62), campioni conservati a lungo, un solo centro.
Nel puledro i segni di sepsi possono essere sfumati: se dubiti, è un caso da riferire alla clinica.
Adattamento in italiano; sintesi da confermare dal veterinario.$t$,
 'Laurberg M, Saegerman C, Jacobsen S, et al. PLoS ONE 2023;18(5):e0285819, doi:10.1371/journal.pone.0285819 · CC BY 4.0',
 'https://doi.org/10.1371/journal.pone.0285819', '2026-11-02', true),

('veterinario', 'infettive',
 'Herpesvirus EHV-1: diagnosi e gestione di un focolaio (consenso ACVIM 2024)',
 $t$Forme: rinopolmonite, aborto a fine gravidanza, morte neonatale, mieloencefalopatia (EHM).
Diagnosi:
- quando possibile qPCR su tampone nasale E sangue intero; con risorse limitate o tanti cavalli, solo tampone nasale;
- un solo prelievo: il tampone nasale rileva più spesso il virus nei febbrili e nei sospetti EHM; dopo aborto il sangue è più sensibile;
- l'eliminazione nasale compare circa 2 giorni dopo il contagio e dura 3-7 giorni; la viremia 2-4 giorni;
- sierologia: due prelievi a 15-21 giorni di distanza, prova solo presuntiva;
- non si consiglia la qPCR di routine sui cavalli senza segni.
Focolaio: diagnosi precoce, isolare sospetti e confermati, fermare gli spostamenti dei cavalli a contatto fino ai risultati o alla fine della quarantena, temperatura rettale due volte al giorno.
Fine quarantena: 28 giorni dall'ultimo caso nuovo, oppure 14 giorni seguiti da qPCR su tampone nasale per 2-4 giorni di fila.
Ambiente: il virus resiste almeno 48 ore nell'ambiente e fino a 14 giorni in acqua; difficilmente è ancora infettivo 21 giorni dopo lo svuotamento. Pulire e disinfettare.
Obblighi di segnalazione: verificali con i servizi veterinari della tua ASL.
Adattamento in italiano; sintesi da confermare dal veterinario.$t$,
 'Lunn DP, Burgess BA, Dorman DC, et al. Updated ACVIM consensus statement on equine herpesvirus-1. J Vet Intern Med 2024;38(3):1290-1299, doi:10.1111/jvim.17047 · CC BY 4.0',
 'https://doi.org/10.1111/jvim.17047', '2026-11-02', true),

('veterinario', 'infettive',
 'Herpesvirus EHV-1: cosa dicono gli studi su vaccini e farmaci',
 $t$Il consenso ACVIM 2024 si basa su quattro revisioni sistematiche. Conclusione generale: le prove che vaccini o farmaci funzionino contro EHV-1 sono LIMITATE.
Vaccini:
- riducono poco la malattia clinica; qualche prova che riducano febbre, segni respiratori e quantità/durata dell'eliminazione nasale (più per i vaccini vivi modificati e deleti);
- qualche prova limitata che i vaccini inattivati riducano gli aborti;
- nessuna prova che prevengano la forma neurologica (EHM); non impediscono del tutto la viremia;
- indicazione: vaccinare i cavalli a rischio dopo una valutazione del rischio, dentro un programma di biosicurezza, sapendo che la protezione è parziale.
Farmaci:
- valaciclovir: prove moderate che, dato PRIMA dell'esposizione, limiti lo sviluppo di EHM; da considerare in un focolaio quando si può intervenire presto;
- aciclovir per bocca: livelli nel sangue molto variabili, scarso assorbimento;
- altri prodotti (immunomodulatori, interferone, eparina, integratori): beneficio minimo o limitato;
- iniziare la terapia dopo la comparsa dei segni non previene né cambia il decorso dell'EHM;
- corticosteroidi riservati ai cavalli in decubito o con atassia grave.
Dosi e protocolli: non sono in questa scheda; vanno decisi dal veterinario sul prodotto autorizzato.
Adattamento in italiano; sintesi da confermare dal veterinario.$t$,
 'Lunn DP, et al. J Vet Intern Med 2024;38(3):1290-1299, doi:10.1111/jvim.17047, basato anche sulle revisioni sistematiche dello stesso numero (vaccinazione; trattamenti farmacologici) · CC BY 4.0',
 'https://doi.org/10.1111/jvim.17047', '2026-11-02', true),

('veterinario', 'infettive',
 'Influenza equina: quanto proteggono i vaccini',
 $t$Revisione sistematica e meta-analisi degli studi controllati sui vaccini contro l'influenza equina pubblicati fino a dicembre 2020 (43 articoli, 38 usati per il calcolo).
Efficacia misurata come riduzione dell'eliminazione del virus dal naso:
- vaccini commerciali (21 studi): in media 50% (intervallo di confidenza 23-77%), con risultati da 0 a 100%;
- vaccini sperimentali (17 studi): in media 40%;
- protezione completa dall'eliminazione in 5 studi.
Conclusioni degli autori: in alcune condizioni i vaccini commerciali possono prevenire del tutto l'infezione, ma per limitare eliminazione e contagio in campo serve vaccinare con frequenza.
Limiti: studi da pochi centri e con disegni molto diversi; grande variabilità.
Per le regole di gara (FEI e FISE: intervalli dei richiami, 7 giorni prima dell'evento) vedi la scheda sul vaccino antinfluenzale per le gare FEI.
Adattamento in italiano; sintesi da confermare dal veterinario.$t$,
 'Elliott S, Olufemi OT, Daly JM. Viruses 2023;15(12):2337, doi:10.3390/v15122337 · CC BY 4.0',
 'https://doi.org/10.3390/v15122337', '2026-11-02', true),

('veterinario', 'medicina interna',
 'Asma equina: diagnosi e forme subcliniche',
 $t$Due forme: asma lieve-moderata (prima «IAD»: spesso cavalli giovani, molti guariscono) e asma grave (prima «RAO/bolsaggine»: cavalli più anziani, cronica, dispnea a riposo).
Esami:
- anamnesi e visita respiratoria (anche con sacco di rebreathing) restano la base; l'emogasanalisi è spesso normale nella forma lieve;
- endoscopia: quantità e densità del muco (anche cavalli sani possono averne un po');
- aspirato tracheale: neutrofili > 20% indicano infiammazione, ma non distingue le forme eosinofiliche/mastocitarie;
- lavaggio broncoalveolare (BAL), più sensibile: forma lieve-moderata se neutrofili > 10% e/o eosinofili o mastociti > 5%; asma grave in crisi se neutrofili > 25%. Usare 250-500 mL e recuperarne almeno metà.
Cosa falsa i risultati: sedazione (prelevare l'emogas prima), esercizio, trasporto e stress (far riposare il cavallo prima), aria fredda. Gli emosiderofagi nel BAL di un cavallo non da corsa fanno cercare altre cause.
Forme subcliniche: gli esami di routine sono spesso normali; conviene combinare più esami invece di fidarsi di uno solo.
Limiti: revisione narrativa, molti dati da cavalli sani o da altre specie.
Adattamento in italiano; sintesi da confermare dal veterinario.$t$,
 'Lendl L, Barton AK. Equine Asthma Diagnostics: Review of Influencing Factors and Difficulties in Diagnosing Subclinical Disease. Animals 2024;14(23):3504, doi:10.3390/ani14233504 · CC BY',
 'https://doi.org/10.3390/ani14233504', '2026-11-02', true),

('veterinario', 'medicina interna',
 'Asma equina: gestione dell''ambiente (fieno, lettiera, aria)',
 $t$L'asma equina nasce soprattutto dalle polveri respirate: la gestione dell'ambiente è la base della terapia.
Cosa dice la revisione:
- foraggio: contano tipo, modo di produzione e contaminazione in lavorazione o magazzino. Bagnare o trattare a vapore il fieno migliora l'igiene ma ne riduce il valore nutritivo: può servire integrare la dieta;
- scuderia: i risultati degli studi non sono tutti concordi, ma restano consigliati evitare la paglia come lettiera e migliorare la ventilazione quando il paddock non è possibile;
- il fattore più importante è che il proprietario applichi davvero le misure: spiegarle bene e ricontrollarle nel tempo.
Consigli pratici da dare: più tempo all'aperto possibile, fieno pulito o trattato, lettiera poco polverosa, non pulire il box con il cavallo dentro, buon ricambio d'aria.
Adattamento in italiano; sintesi da confermare dal veterinario.$t$,
 'Diez de Castro E, Fernandez-Molina JM. Environmental Management of Equine Asthma. Animals 2024;14(3):446, doi:10.3390/ani14030446 · CC BY',
 'https://doi.org/10.3390/ani14030446', '2026-11-02', true),

('veterinario', 'medicina interna',
 'PPID (Cushing equino): quando sospettarla, test e terapia (linee guida BEVA 2023)',
 $t$Quando testare: scegli i cavalli in base a segni clinici ED età. Pelo lungo (ipertricosi) e muta in ritardo o incompleta danno un sospetto alto. Sotto i 10 anni cerca prima altre cause e testa la PPID solo con più segni compatibili.
Sovrapposizione con la sindrome metabolica: laminite, grasso sopra gli occhi e adiposità regionale si vedono anche nella EMS, quindi in questi cavalli va cercata anche la disregolazione insulinica.
Test:
- ACTH di base: non subito dopo un trasporto; i valori cambiano con stagione, razza (soprattutto in autunno) e latitudine, quindi servono intervalli di riferimento stagionali del laboratorio;
- test di stimolazione con TRH: non ripeterlo entro 24 ore; in autunno è meno affidabile per la variabilità.
Terapia: la pergolide migliora la maggior parte dei segni nella maggior parte dei cavalli, ma non la laminite. Si controlla l'effetto rimisurando l'ACTH.
Qualità delle prove: raccomandazioni graduate con GRADE; gli autori chiedono studi migliori su diagnosi e terapia.
Sintesi nostra della linea guida (non riproduzione); dosi non riportate, sintesi da confermare dal veterinario.$t$,
 'Menzies-Gow NJ, Banse HE, Duff A, et al. BEVA primary care clinical guidelines: Diagnosis and management of equine pituitary pars intermedia dysfunction. Equine Vet J 2023, doi:10.1111/evj.14009',
 'https://doi.org/10.1111/evj.14009', '2026-11-02', true),

('veterinario', 'medicina interna',
 'Sindrome metabolica equina (EMS): definizione, razze a rischio, genetica',
 $t$EMS: insieme di disregolazione insulinica (iperinsulinemia a digiuno o dopo il pasto, insulino-resistenza), obesità generale o grasso localizzato e rischio di laminite. Il centro è la disregolazione insulinica: l'obesità è frequente ma NON sempre presente, quindi non basta guardare il peso.
Diagnosi citate: insulina a digiuno (indicazione del consenso ACVIM), test dello zucchero per bocca (glicemia e insulina a 75 minuti negli studi genetici), punteggio della cresta del collo e della condizione corporea. Nei pony, leptina e insulina alte aiutano a prevedere la laminite.
Razze a rischio discusse: pony (circa il doppio di laminite da pascolo), Arabi, Morgan, pony Welsh e Shetland.
Genetica: malattia poligenica, con geni diversi da razza a razza (es. regione FAM174A negli Arabi; HMGA2 nei Welsh e nei Morgan); l'ereditabilità è significativa per diversi tratti. I marcatori potrebbero un giorno aiutare a riconoscere prima i soggetti a rischio, ma non sono ancora uno strumento clinico.
Gestione: dieta (meno zuccheri e amidi) ed esercizio; la revisione non dà protocolli dettagliati.
Adattamento in italiano; sintesi da confermare dal veterinario.$t$,
 'Stefaniuk-Szmukier M, Piórkowska K, Ropka-Molik K. Equine Metabolic Syndrome: A Complex Disease Influenced by Multifactorial Genetic Factors. Genes 2023;14(8):1544, doi:10.3390/genes14081544 · CC BY',
 'https://doi.org/10.3390/genes14081544', '2026-11-02', true),

('veterinario', 'riproduzione',
 'Fattrice obesa o con disregolazione insulinica: fertilità, gravidanza, puledro',
 $t$Revisione degli studi su obesità e disregolazione insulinica nella fattrice.
- Ciclo: le fattrici in carne ciclano più spesso anche d'inverno; obesità e insulino-resistenza allungano gli intervalli tra ovulazioni e la fase luteale.
- Fertilità: nessun calo netto dimostrato; qualche segnale su embrioni più fragili e infiammazione dell'endometrio.
- Gravidanza: la laminite cronica nella fattrice gravida è stata associata a gestazione più corta, placenta e puledro più leggeri.
- Perdere condizione durante la gravidanza è stato associato a meno gravidanze e a morte embrionale precoce.
- Puledri di fattrici obese e insulino-resistenti: sensibilità all'insulina ridotta fino a 6 mesi (normale a 12); in uno studio piccolo più lesioni osteocondrali a 12 mesi (30% contro 10%).
Indicazioni della revisione: mantenere una condizione corporea adeguata (almeno 6/9 al parto per non perdere troppo dopo), evitare dimagrimenti prima del parto, attenzione alla dieta più che al solo punteggio; rischio di laminite da gestire con cura.
Limiti: pochi studi misurano davvero l'insulina, campioni piccoli, mancano studi a lungo termine sui puledri.
Adattamento in italiano; sintesi da confermare dal veterinario.$t$,
 'Hallman I, Karikoski N, Kareskoski M. Front Vet Sci 2023;10:1180622, doi:10.3389/fvets.2023.1180622 · CC BY',
 'https://doi.org/10.3389/fvets.2023.1180622', '2026-11-02', true),

('veterinario', 'farmacologia',
 'Resistenza agli antibiotici nel cavallo e uso prudente',
 $t$Batteri resistenti segnalati nel cavallo: E. coli produttori di ESBL, MRSA, Rhodococcus equi resistente, Salmonella multiresistente, streptococchi (anche S. equi) con resistenze in aumento.
Cosa la favorisce: uso eccessivo o scorretto di antibiotici importanti, terapie senza diagnosi, biofilm e batteri dormienti (es. endometriti croniche).
Uso prudente secondo la revisione:
- trattare solo infezioni batteriche dimostrate o molto probabili;
- coltura e antibiogramma per scegliere il principio attivo;
- preferire farmaci di prima scelta e a spettro ristretto (categoria D delle linee EMA); categoria B (critici per l'uomo) solo se non c'è alternativa adeguata o la malattia è grave;
- scalare a una categoria più bassa quando arriva l'antibiogramma;
- evitare l'antibiotico di routine per ascessi del piede, ferite non gravi e castrazioni senza complicazioni;
- igiene, biosicurezza e vaccinazioni per ridurre le infezioni.
One Health: il cavallo può trasmettere batteri resistenti a chi lo gestisce e all'ambiente.
In Italia/UE: alcuni antimicrobici sono riservati all'uomo e non si usano negli animali (vedi la scheda di normativa sugli antimicrobici).
Adattamento in italiano; sintesi da confermare dal veterinario.$t$,
 'Kabir A, Lamichhane B, Habib T, et al. Antimicrobial Resistance in Equines: A Growing Threat to Horse Health and Beyond. Antibiotics 2024;13(8):713, doi:10.3390/antibiotics13080713 · CC BY',
 'https://doi.org/10.3390/antibiotics13080713', '2026-11-02', true),

('veterinario', 'infettive',
 'Parassiti: trattamento selettivo basato sull''esame delle feci (10 anni in Svezia)',
 $t$In Svezia gli antiparassitari per cavalli si usano con un approccio selettivo: si decide in base agli esami delle feci. Studio su 43.330 campioni di 26.625 cavalli in 935 allevamenti (2008-2017), analizzati dall'istituto veterinario nazionale due volte l'anno, con consigli su misura per ogni allevamento.
Risultati:
- Strongylus vulgaris trovato nel 4-11% dei cavalli (coprocoltura o PCR); circa 3 positivi su 4 erano arrivati da poco nel gruppo;
- uova di tenia nel 3-10%;
- alcuni cavalli restano sempre forti o deboli eliminatori nel tempo;
- con i campioni singoli si trovano più allevamenti positivi per S. vulgaris che con i campioni misti;
- in base a S. vulgaris e al conteggio delle uova (soglia usata di solito: oltre 200 uova di strongili per grammo), il 59% dei cavalli non aveva bisogno di essere sverminato.
Uso pratico: esame delle feci prima di trattare, attenzione ai cavalli nuovi (quarantena ed esame all'arrivo), cercare S. vulgaris quando si riducono i trattamenti. Per i dettagli delle linee AAEP vedi la scheda sulla sverminazione.
Adattamento in italiano; sintesi da confermare dal veterinario.$t$,
 'Osterman-Lind E, Holmberg M, Grandi G. Selective Anthelmintic Treatment in Horses in Sweden Based on Coprological Analyses: Ten-Year Results. Animals 2023;13(17):2741, doi:10.3390/ani13172741 · CC BY',
 'https://doi.org/10.3390/ani13172741', '2026-11-02', true),

('veterinario', 'chirurgia',
 'Ferite: guarigione per seconda intenzione, cosa è provato',
 $t$Revisione della letteratura 2000-2023 sulle ferite cutanee del cavallo lasciate guarire per seconda intenzione. Conclusione: un protocollo ideale dimostrato NON esiste ancora.
- Tessuto di granulazione esuberante: l'asportazione chirurgica dell'eccesso resta la scelta standard (in uno studio ha accelerato la guarigione). Il nitrato d'argento ha dato necrosi, dolore e zoppia. Medicazioni al silicone e laser a bassa potenza lo hanno ridotto in singoli studi.
- Bendaggi: associati a più granulazione, guarigione più lenta e più biofilm nelle ferite degli arti; cambi più frequenti forse aiutano (prove scarse).
- Prodotti topici: il miele di Manuka ha le prove migliori (ferite più piccole nelle prime fasi, ma in uno studio tempo totale non più breve); il miele generico non ha studi controllati; gli antimicrobici topici in genere non migliorano la guarigione.
- PRP e pressione negativa: risultati discordanti. Il fenilbutazone è stato associato a guarigione più lenta.
- Le ferite della parte bassa degli arti sono le più studiate e le più difficili; sul corpo i dati sono pochi.
Per il proprietario c'è già la scheda su quando chiamare per una ferita.
Adattamento in italiano; sintesi da confermare dal veterinario.$t$,
 'Ribeiro G, Carvalho L, Borges J, Prazeres J. Animals 2024;14(10):1500, doi:10.3390/ani14101500 · CC BY',
 'https://doi.org/10.3390/ani14101500', '2026-11-02', true),

('veterinario', 'ortopedia',
 'Legamento sospensore: lesioni, diagnosi e recupero',
 $t$Il sospensore si lesiona spesso in cavalli di ogni età e disciplina. Di solito si lesiona di più l'anteriore; nel dressage il posteriore. Nei cavalli da corsa è circa l'11% delle lesioni di tendini e legamenti; il rischio cresce con l'età.
Diagnosi:
- i segni localizzati spesso mancano nei casi cronici: servono anestesie diagnostiche più immagini;
- le anestesie sono poco precise (varianti anatomiche, comunicazione con l'articolazione carpo-metacarpica nell'anteriore);
- ecografia: esame di base, ma dipende dall'operatore, poco specifica nella parte prossimale e con alterazioni anche in cavalli non zoppi;
- risonanza magnetica: più sensibile, soprattutto per prossimale e rami.
Prognosi: fino al 68% dei purosangue non torna a correre; nei cavalli da diporto il 24% torna allo stesso livello a 2 anni, il 41% a un livello più basso.
Terapie: riposo in box, esercizio controllato e ferratura che riduce la tensione sono la base, ma i protocolli sono poco studiati. Neurectomia del ramo profondo del nervo plantare laterale nel posteriore: 43-78% torna al lavoro (possibile atrofia, mancano dati a lungo termine). Onde d'urto, laser, PRP: prove discordanti o non controllate. Cellule stromali mesenchimali: l'unico studio randomizzato ha mostrato più miglioramento e meno recidive del placebo.
Adattamento in italiano; sintesi da confermare dal veterinario.$t$,
 'Guest DJ, Birch HL, Thorpe CT. A review of the equine suspensory ligament: Injury prone yet understudied. Equine Vet J 2024, doi:10.1111/evj.14447 · CC BY 4.0',
 'https://doi.org/10.1111/evj.14447', '2026-11-02', true),

('veterinario', 'riabilitazione',
 'Riabilitazione del cavallo: cosa c''è di provato',
 $t$Revisione di 49 pubblicazioni: metà sono revisioni narrative, solo il 10% studi randomizzati, e piccoli.
Metodi usati: esercizio controllato (programmi di passo e trotto, esercizi di mobilizzazione dinamica, lavoro sul core e sull'equilibrio, tapis roulant in acqua), terapie fisiche (campi magnetici pulsati, TENS, ultrasuoni, laser, onde d'urto, vibrazione), idroterapia, freddo e caldo, terapia manuale, bendaggi e taping.
Qualche prova:
- esercizi di mobilizzazione dinamica: aumentano la sezione del multifido (anche in uno studio randomizzato);
- esercizi addominali dopo chirurgia della colica: ritorno al lavoro più rapido (studio retrospettivo);
- manipolazione vertebrale aggiunta alla mobilizzazione: rigidità ridotta (studio randomizzato);
- kinesiotape: meno gonfiore dopo artroscopia (uno studio).
Prove deboli o negative: campi magnetici pulsati non diversi dal placebo nel mal di schiena; vibrazione senza beneficio in uno studio pilota. Il nuoto è sconsigliato nei cavalli con mal di schiena.
Parametri (durata, frequenza, profondità dell'acqua) quasi sempre presi da sondaggi o esperienza, non da studi.
Adattamento in italiano; sintesi da confermare dal veterinario.$t$,
 'Atalaia T, Prazeres J, Abrantes J, Clayton HM. Equine Rehabilitation: A Scoping Review of the Literature. Animals 2021;11(6):1508, doi:10.3390/ani11061508 · CC BY',
 'https://doi.org/10.3390/ani11061508', '2026-11-02', true),

('veterinario', 'nutrizione',
 'Alimentazione dopo la chirurgia della colica: cosa fanno gli specialisti',
 $t$Sondaggio online tra specialisti europei e americani di chirurgia e medicina interna equina (123-178 risposte per domanda, adesione 12,6%). È un'OPINIONE sulla pratica corrente, non uno studio clinico.
Dopo chirurgia senza complicazioni, nel cavallo adulto:
- dislocazione del grosso colon: acqua per lo più a volontà entro 3 ore; cibo più spesso a 6-12 ore, di solito fieno a manciate o in un piccolo secchio;
- lesione strangolante del tenue: acqua in piccole quantità (meno di 2 litri) per lo più a 12-24 ore; cibo a 24-48 ore;
- lesioni del piccolo colon o del cieco: cibo a manciate, all'inizio spesso erba; per il piccolo colon a 24-48 ore.
Le risposte variano molto: non c'è un protocollo unico. Il sondaggio non considera le complicazioni postoperatorie, che cambiano la gestione.
Uso pratico: dopo il rientro a casa segui le indicazioni della clinica che ha operato.
Adattamento in italiano; sintesi da confermare dal veterinario.$t$,
 'Lawson AL, Sherlock CE, Ireland JL, Mair TS. Equine Vet J 2021;53(5):1015-1024, doi:10.1111/evj.13381 · CC BY',
 'https://doi.org/10.1111/evj.13381', '2026-11-02', true),

('veterinario', 'agopuntura',
 'Agopuntura e laminite: cosa dice la meta-analisi (prove limitate)',
 $t$Revisione sistematica e meta-analisi del 2025: 7 studi selezionati su 145.
- Miglioramento della laminite: odds ratio 2,25 (intervallo 1,17-4,36).
- Punteggio di zoppia: differenza media -5,0 (intervallo da -8,1 a -1,9).
- Gli autori concludono che l'agopuntura (due volte a settimana per quattro settimane negli studi) può migliorare la zoppia e la possibilità di recupero; citano ago secco, emoagopuntura, acquapuntura, elettroagopuntura.
Come leggerla:
- pochi studi, piccoli; la certezza delle prove non è stata valutata; nell'abstract non ci sono i limiti;
- è un trattamento COMPLEMENTARE: non sostituisce gestione del piede, controllo del dolore e cura della causa (sindrome metabolica, PPID, sepsi);
- Galeno distingue sempre medicina tradizionale cinese, ipotesi e risultati sperimentali, e non ricostruisce punti, formule o procedure.
Adattamento in italiano; sintesi da confermare dal veterinario.$t$,
 'Fikri F, Purnomo A, Maslamama ST, Purnama MTE. Effectiveness of acupuncture for equine laminitis: Systematic review and meta-analysis. Vet World 2025;18(1):60-66, doi:10.14202/vetworld.2025.60-66 · CC BY',
 'https://doi.org/10.14202/vetworld.2025.60-66', '2026-11-02', true),

-- 3 · normativa --------------------------------------------------------------------------------------

('veterinario', 'normativa',
 'Farmaco veterinario: Regolamento UE 2019/6 e D.Lgs. 218/2023',
 $t$Quadro: il Regolamento (UE) 2019/6 sui medicinali veterinari si applica dal 28 gennaio 2022; in Italia è attuato dal D.Lgs. 7 dicembre 2023 n. 218 (in Gazzetta il 3 gennaio 2024, in vigore dal 18 gennaio 2024), che ha sostituito il D.Lgs. 193/2006.
Punti da ricordare:
- si usa il medicinale secondo l'autorizzazione (art. 106 Reg. 2019/6); l'uso in deroga («a cascata») è ammesso solo per un reale bisogno clinico, quando non c'è un medicinale autorizzato adatto al caso, seguendo l'ordine previsto dal Regolamento;
- nell'equide conta lo stato DPA/non DPA (vedi la scheda dedicata): cambia cosa si può usare e i tempi di attesa;
- prescrizione con la ricetta elettronica veterinaria (REV), che traccia prescrizioni, forniture e uso;
- validità delle ricette indicata dal Ministero: 30 giorni per quelle non ripetibili; 6 mesi, fino a dieci utilizzi, per quelle ripetibili;
- farmacovigilanza: segnalare i sospetti eventi avversi (artt. 73-79 Reg. 2019/6); la mancata segnalazione è sanzionata;
- antimicrobici: uso prudente, alcune molecole riservate all'uomo (vedi scheda).
Sanzioni del D.Lgs. 218/2023 elevate anche per irregolarità formali.
Prima di decidere controlla sempre il testo vigente su Normattiva/EUR-Lex e l'RCP del prodotto.$t$,
 'Regolamento (UE) 2019/6; D.Lgs. 7 dicembre 2023 n. 218 (Normattiva); FNOVI-ENPAV, Farmaco veterinario (aprile 2026); Ministero della Salute, nota sulle ricette',
 'https://www.normattiva.it/eli/id/2024/01/03/23G00225/CONSOLIDATED', '2026-11-02', true),

('veterinario', 'normativa',
 'Equide DPA o non DPA: cosa fa il veterinario PRIMA di trattare',
 $t$Riferimenti: D.M. 30 settembre 2021 (anagrafe degli equidi), Reg. (UE) 2019/6, Reg. di esecuzione (UE) 2021/963 (passaporto), lista delle sostanze essenziali per gli equidi.
Prima della terapia serve il consenso del proprietario (o di chi lo rappresenta). Tutti i cambi di stato si fanno PRIMA di iniziare il trattamento.
Caso A · sostanza non ammessa negli equidi destinati alla produzione di alimenti (DPA):
- il cavallo va dichiarato NON DPA in modo definitivo, in BDN e nella Sezione II del passaporto;
- il veterinario compila e firma la Sezione II, Parte II. Il cambio è irreversibile.
Caso B · medicinale con sostanze della lista «essenziali per gli equidi»:
- il cavallo resta DPA con tempo di attesa di 6 mesi, registrato in BDN e nella Sezione II;
- il veterinario scrive nella Sezione II, Parte III i dati del medicinale e la data dell'ultima somministrazione;
- lo stato DPA è sospeso per 6 mesi.
Se il veterinario non ha accesso diretto alla BDN: entro 3 giorni dalla modifica sul passaporto lo comunica all'ente che ha rilasciato il passaporto o alla ASL; l'ente aggiorna la BDN (le istruzioni dicono 7 giorni dal ricevimento, il decreto 7 giorni dal trattamento: verifica con la tua ASL).$t$,
 'D.M. 30/09/2021 anagrafe equidi; Reg. (UE) 2021/963; Istruzioni per il veterinario prescrittore in caso di modifica dello status di equide da DPA a non DPA',
 'https://www.alimenti-salute.it/doc/ISTRUZIONI_PER_IL_VETERINARIO_PRESCRITTORE_IN_CASO_DI_MODIFICA_TEMPORANEA_O_DEFINITIVA_DELLO_STATUS_DI_EQUIDE,_DA_DPA_A_NON_DPA.pdf', '2026-11-02', true),

('veterinario', 'normativa',
 'Sostanze essenziali per gli equidi: nuova lista UE e tempo di attesa di 6 mesi',
 $t$Base: art. 115(5) del Reg. (UE) 2019/6. La Commissione stabilisce una lista di sostanze essenziali per il trattamento degli equidi, o che danno un beneficio clinico in più rispetto alle alternative. Per queste, nell'equide DPA, il tempo di attesa è di 6 mesi.
- Nuova lista: Reg. di esecuzione (UE) 2025/901 del 19 maggio 2025, che sostituisce quella del vecchio Reg. (CE) 1950/2006.
- Modifica: Reg. di esecuzione (UE) 2026/1810 del 24 luglio 2026 (in vigore dal 28 luglio 2026). Aggiunge a 2025/901 ketoconazolo (solo uso topico), midazolam e sevoflurano. Toglie dal 1950/2006 digossina, dorzolamide, griseofulvina, imipramina, ketoconazolo, fenitoina e ticarcillina.
- Transizione: le sostanze ancora presenti nel 1950/2006 si possono usare fino al 21 maggio 2027.
- Parere EMA (aprile 2026): la griseofulvina è utile in alcune tigne sistemiche, ma comporta un rischio inaccettabile per il consumatore negli equidi DPA anche con 6 mesi di attesa. La rifampicina non soddisfa i criteri di essenzialità.
Uso pratico: prima di usare una di queste sostanze in un DPA, registra il trattamento nella Sezione II, Parte III del passaporto (vedi la scheda DPA/non DPA). Controlla sempre l'elenco aggiornato su EUR-Lex.$t$,
 'Reg. di esecuzione (UE) 2025/901; Reg. di esecuzione (UE) 2026/1810; EMA/CVMP/382370/2025 (aprile 2026); AGRINFO',
 'https://eur-lex.europa.eu/eli/reg_impl/2025/901/oj', '2026-11-02', true),

('veterinario', 'normativa',
 'Antimicrobici riservati all''uomo e uso in deroga degli antimicrobici',
 $t$- Reg. di esecuzione (UE) 2022/1255 del 19 luglio 2022, in vigore dal 9 febbraio 2023: elenca gli antimicrobici o gruppi di antimicrobici riservati al trattamento di alcune infezioni nell'uomo. Le molecole dell'elenco NON si possono usare negli animali, cavallo compreso, nemmeno in deroga.
- Reg. di esecuzione (UE) 2024/1973: fissa le condizioni per usare antimicrobici in deroga alle autorizzazioni (uso «a cascata»), con valutazione caso per caso secondo l'allegato.
- Categorie EMA (AMEG): A evitare, B limitare (critici per l'uomo, solo con antibiogramma o senza alternative), C cautela, D prudenza. Preferire D e farmaci a spettro ristretto.
- In Italia: Piano nazionale di contrasto all'antibiotico-resistenza (PNCAR) e tracciamento con ricetta elettronica.
Prima di prescrivere un antibiotico «insolito», controlla che non sia nell'allegato del 2022/1255 e che la deroga rispetti il 2024/1973.
Vedi anche la scheda clinica sulla resistenza agli antibiotici nel cavallo.$t$,
 'Reg. di esecuzione (UE) 2022/1255; Reg. di esecuzione (UE) 2024/1973; FNOVI-ENPAV, Farmaco veterinario (aprile 2026)',
 'https://eur-lex.europa.eu/eli/reg_impl/2022/1255/oj', '2026-11-02', true),

('veterinario', 'normativa',
 'Anemia infettiva equina (AIE): cosa deve sapere il veterinario',
 $t$Base: D.Lgs. 136/2022, Reg. (UE) 2016/429 (artt. 124-125), Reg. (UE) 2018/1882 (AIE in categoria D ed E), indicazioni operative del Ministero della Salute per la sorveglianza e il controllo dell'AIE.
- Si testano tutti gli equidi sopra i 12 mesi, se possibile prima della stagione dei vettori (maggio-ottobre).
- Allevamenti ad alto rischio (agriturismo o maneggio con lavoro, area di sorveglianza attiva, indirizzo produttivo non assegnato in BDN, presenza di muli): test annuale per i cavalli che si spostano non verso il macello e per gli stalloni da monta pubblica. Basso rischio: il test vale 3 anni per gli spostamenti non al macello.
- Area di sorveglianza attiva (3 km attorno a un focolaio): ELISA a tutti gli equidi sopra i 12 mesi entro 30 giorni, poi ogni anno fino alla chiusura.
- Diagnosi: ELISA con lotti approvati dal centro di referenza (CRAIE); se reattivo, AGID e poi immunoblotting.
- Prelievi: veterinari ufficiali della ASL o da essa incaricati, con i moduli A e B.
- Caso sospetto: niente spostamenti (salvo macello o benessere), nota «Caso sospetto di Anemia Infettiva Equina» sui documenti.
- Positivo: isolamento a 200 m da altri equidi con doppia recinzione, oppure al chiuso protetto dagli insetti; spostamenti solo verso il macello o per motivi di benessere; il focolaio resta aperto finché ci sono positivi.
Per il proprietario c'è la scheda sul test Coggins.$t$,
 'Ministero della Salute, Indicazioni operative per la sorveglianza ed il controllo dell''AIE (testo pubblicato da FNOVI); D.Lgs. 136/2022; Reg. (UE) 2016/429 e 2018/1882',
 'https://fnovi.it/sites/default/files/Indicazioni_operative_per_la_sorveglianza_ed_il_controllo_dell_AIE.pdf', '2026-11-02', true),

('veterinario', 'normativa',
 'West Nile nel cavallo: sintomi nervosi da segnalare e sorveglianza',
 $t$Il cavallo è un ospite «a fondo cieco»: si ammala ma non ritrasmette il virus alle zanzare. Solo circa il 10% degli equidi infetti mostra segni nervosi, dall'atassia alla paralisi degli arti e ai deficit dei nervi cranici.
Regole (linee guida veterinarie del Ministero della Salute, agosto 2026, seconda revisione della procedura del Piano Nazionale Arbovirosi 2020-2025):
- sorveglianza passiva obbligatoria TUTTO l'anno: i sintomi nervosi negli equidi vanno segnalati ai servizi veterinari;
- nelle aree a rischio medio o alto la ASL fa anche sorveglianza attiva con prelievi sugli equidi;
- conferma del sospetto con ELISA, RT-PCR o segni clinici; il centro di referenza (CESME) conferma entro 7 giorni lavorativi dal campione;
- la ASL registra il sospetto in SIMAN entro 24 ore e, se confermato, fa l'indagine epidemiologica entro 48 ore.
West Nile è in categoria E (Reg. di esecuzione (UE) 2018/1882; obblighi dal Reg. (UE) 2016/429).
Uso pratico: un cavallo con atassia o debolezza improvvisa in stagione di zanzare va considerato anche per West Nile (oltre a EHV-1 e altre cause) e segnalato.$t$,
 'Ministero della Salute, linee guida per la prevenzione, sorveglianza e controllo di West Nile e Usutu (agosto 2026); Piano Nazionale Arbovirosi 2020-2025; Quotidiano Sanità 5/8/2026',
 'https://www.quotidianosanita.it/scienza-e-farmaci/west-nile-e-usutu-pronte-le-nuove-linee-guida-veterinarie-sorveglianza-modulata-sul-rischio/', '2026-11-02', true),

('veterinario', 'normativa',
 'Antidoping FEI: dove controllare una sostanza prima di una gara',
 $t$Per i cavalli in gara FEI le sostanze sono classificate in «vietate» (Banned: mai ammesse) e «controllate» (Controlled Medication: ammesse in terapia ma non in gara).
Dove controllare: la banca dati ufficiale FEI Equine Prohibited Substances Database, che si aggiorna nel tempo. Cerca per principio attivo o nome commerciale.
Cosa ricordare:
- i tempi di rilevazione indicati non sono una garanzia di negatività: dipendono da dose, via, durata, formulazione e cavallo;
- per terapie vicino a una gara valuta con il cavaliere se è meglio non gareggiare;
- le regole FEI non sostituiscono quelle italiane (FISE, ippica, stato DPA): Galeno non applica i tempi di rilevazione come se fossero tempi di attesa per gli alimenti.
Per i vaccini antinfluenzali richiesti in gara vedi la scheda sul vaccino FEI.$t$,
 'FEI Equine Prohibited Substances Database (FEI Clean Sport)',
 'https://prohibitedsubstancesdatabase.feicleansport.org/', '2026-11-02', true)

on conflict (titolo) do update set ambito = excluded.ambito, categoria = excluded.categoria, contenuto = excluded.contenuto,
  fonte_titolo = excluded.fonte_titolo, fonte_url = excluded.fonte_url, verificato_il = excluded.verificato_il, attivo = true, aggiornato_il = now();

-- 4 · guide all'uso dell'app per il veterinario ---------------------------------------------------
insert into public.ai_conoscenze (ambito, categoria, titolo, contenuto, attivo) values

('veterinario', 'guida', 'Home del veterinario: il giro di oggi',
 $t$Dove: Home (prima pagina dell'app).
Passi:
1. In alto il riquadro «Il giro di oggi»: quante visite hai oggi, i km stimati del giro e l'ora della prima visita.
2. Tocca «Giornata» o il numero delle urgenze: si apre l'Agenda di oggi con le visite raggruppate per posto.
3. Tocca il numero dei richiami: si aprono le Scadenze (richiami dei prossimi 7 giorni).
4. I tasti tondi: «Portami da» (navigatore verso la prossima visita), «Detta» (apre Galeno), «Scadenze», «Da incassare», «Altro».
5. Sotto, «Prossime visite»: le prime tre, l'urgenza in rosso. Tocca una visita per le azioni.
Esempio: Laura apre l'app alle 7, vede «5 visite · 62 km · prima alle 8:30» e tocca «Portami da».
Note: se hai messaggi da leggere o cavalli in ritardo con il richiamo, sotto le visite compare un avviso di Galeno: toccalo per aprire messaggi o scadenze. Senza visite trovi «Aggiungine una».
Parole chiave: home, giro, giro di oggi, km, chilometri, prossime visite, giornata, portami da, detta, urgenze, richiami$t$, true),

('veterinario', 'guida', 'Nuovo appuntamento e agenda della settimana',
 $t$Dove: tasto «+» del menu (prima voce «Nuovo appuntamento») oppure pagina Agenda.
Passi:
1. Tocca «+» e scegli «Nuovo appuntamento».
2. Scegli cliente e cavallo, il tipo di visita (es. controllo, vaccino, urgenza, MTC, fisio, terapia) e scrivi il «Motivo».
3. Scegli giorno e ora e salva.
4. In Agenda vedi la settimana su una riga: tocca un giorno per le visite, raggruppate per posto.
5. Ogni gruppo ha un'etichetta: «Urgente», «MTC · Fisio», «paga la scuderia» o il numero di cavalli.
6. Nella scheda «Da fissare» trovi le visite ancora senza data.
Esempio: Riccardo segna «Nerone · colica lieve» come urgenza per oggi alle 15: in Home diventa la prima del giro.
Note: il motivo compare accanto al nome del cavallo in Home e in Agenda. Le visite «fatte», annullate o rifiutate non contano nel giro.
Parole chiave: nuovo appuntamento, aggiungi visita, agenda, settimana, da fissare, motivo, urgenza, vaccino, MTC, fisioterapia$t$, true),

('veterinario', 'guida', 'Clienti e cavalli: cercare, filtrare, aggiungere',
 $t$Dove: pagina Clienti.
Passi:
1. In alto i filtri: «Tutti», «Privati», «Scuderie», «Crediti» (chi ti deve ancora pagare).
2. Sotto vedi quanti clienti e cavalli hai; «+ Cliente» per aggiungerne uno.
3. Cerca per nome, cavallo o microchip nella barra di ricerca.
4. Con molti clienti compare l'indice delle lettere a lato: tocca una lettera per saltare lì.
5. Tocca un cliente per aprire la sua scheda con i cavalli.
Esempio: Laura cerca il microchip letto in scuderia e trova subito il cavallo e il proprietario.
Note: l'app ricorda l'ultimo filtro scelto. I clienti archiviati sono in fondo, in un elenco a parte.
Parole chiave: clienti, cerca cliente, microchip, privati, scuderie, crediti, nuovo cliente, aggiungi cliente, lettere$t$, true),

('veterinario', 'guida', 'Messaggi con proprietari e scuderie',
 $t$Dove: pagina Messaggi.
Passi:
1. Scorri le conversazioni: accanto al nome vedi i cavalli della persona e, se c'è, l'etichetta «Urgente».
2. Usa «Cerca persona o cavallo» per trovare una conversazione.
3. Tocca la matita in alto per un nuovo messaggio e scegli il cliente.
Esempio: Riccardo cerca «Nerone» e apre subito la chat con la proprietaria.
Note: i messaggi da leggere compaiono anche come avviso di Galeno in Home.
Parole chiave: messaggi, chat, scrivi al cliente, nuovo messaggio, matita, cerca chat, urgente$t$, true),

('veterinario', 'guida', 'Entrare come veterinario con il codice di prova',
 $t$Dove: scelta del profilo alla registrazione («Veterinario · Entra con il codice di prova o candidati») oppure dal menu, aggiungendo un profilo.
Passi:
1. Scegli «Veterinario»: si apre la finestra «Hai un codice di prova?».
2. Scrivi il codice che ti abbiamo mandato (es. GALENO26) e tocca «Entra».
3. Se non hai il codice tocca «Non hai il codice? Chiedicelo via email»: si apre una mail a gestione.equo@gmail.com.
4. In alternativa lascia i tuoi contatti nel modulo sotto.
Esempio: Laura riceve il codice per email, lo scrive e entra subito nell'app per veterinari.
Note: prima del codice vanno accettati Termini e Informativa Privacy. Su Equo si può avere una sola professione: se l'account è già da maniscalco o istruttore, scrivici. Messaggi possibili: codice non valido, scaduto o già usato.
Parole chiave: codice di prova, codice, GALENO26, entrare, registrazione veterinario, profilo veterinario, accesso, candidatura$t$, true),

('veterinario', 'guida', 'Galeno: cosa fa e cosa non fa',
 $t$Dove: tasto «Detta» in Home, oppure l'assistente AI dell'app.
Cosa fa:
1. Risponde con le schede di conoscenze approvate e dice sempre la fonte (autori, rivista, legge).
2. Distingue prove, consenso degli esperti, opinione e tradizione (es. MTC).
3. Chiede i dati del paziente che cambiano la risposta (età, peso, stato DPA, segni).
4. Segnala le situazioni urgenti.
Cosa non fa:
- non prescrive e non propone dosi se le fonti non le sostengono; non converte mg/kg in mL senza dati completi;
- non applica norme di altri Paesi all'Italia né i tempi di rilevazione antidoping come tempi di attesa;
- non inventa citazioni: se una fonte manca lo dice.
Esempio: «Che test faccio per la PPID in autunno?» → Galeno riassume la linea guida BEVA, ricorda la variabilità stagionale dell'ACTH e cita la fonte.
Note: le schede sono in revisione con i veterinari della prova: segnala a gestione.equo@gmail.com una risposta sbagliata.
Parole chiave: galeno, assistente, intelligenza artificiale, cosa sa fare, dosi, prescrizione, fonti, detta$t$, true)

on conflict (titolo) do update set ambito = excluded.ambito, categoria = excluded.categoria, contenuto = excluded.contenuto,
  attivo = true, aggiornato_il = now();
