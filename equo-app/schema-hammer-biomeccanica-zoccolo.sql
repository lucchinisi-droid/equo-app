-- Equo: conoscenze di HAMMER — biomeccanica dello zoccolo secondo Luciano Di Francesco (29 ottobre 2026) · SQL 28
-- Fonte: documento «Hammer_Knowledge_Biomeccanica_Zoccolo.md» (Google Drive di Equo), sintesi dell'articolo
-- «La conformazione dello zoccolo è condizionata dal ferro» (blog di Luciano Di Francesco, 24/11/2020).
-- Tre schede per Hammer (ambito maniscalco). Sono indicazioni di esperienza di un maniscalco, non studi controllati.
-- Rieseguibile: se il titolo esiste già, la scheda si aggiorna.

insert into public.ai_conoscenze (ambito, categoria, titolo, contenuto, fonte_titolo, fonte_url, verificato_il, attivo) values
('maniscalco', 'valutazione',
 'Forma dello zoccolo: piede scalzo, terreno, conformazione e influenza del ferro (Di Francesco)',
 $t$Orientamento da esperienza di campo (Luciano Di Francesco), non da studi controllati.
- Cavallo scalzo, adattamento naturale: gli anteriori portano più peso in stazione e all'atterraggio, quindi sono larghi e rotondi; i posteriori spingono, quindi sono più alti, ovali e appuntiti.
- Terreno: terreni soffici danno piedi larghi e piatti; terreni duri o sassosi piedi alti e stretti.
- Conformazione: dritto giuntato tende ad avere talloni alti; obliquo giuntato talloni bassi.
- Cavallo ferrato: forma e crescita della scatola cornea dipendono direttamente da pareggio, tipo di ferro e posizione del ferro. La scatola cornea si modella sui punti in cui il carico arriva a terra: spostando il punto di carico del ferro cambiano velocità e direzione di crescita della parete.
- Pareggio e ferratura vanno tenuti distinti: il pareggio segue punti anatomici precisi (terza falange parallela al suolo in senso latero-mediale, angolo palmare/plantare positivo adatto all'asse dell'arto); la ferratura è lo strumento con cui, nel tempo, si corregge la forma dello zoccolo.$t$,
 'Luciano Di Francesco, «La conformazione dello zoccolo è condizionata dal ferro» (blog, 24/11/2020)', null, '2026-10-29', true),

('maniscalco', 'pareggio',
 'Mappatura palmare e centro di equilibrio del piede: centro reale più caudale (Di Francesco)',
 $t$Mappatura palmare (metodo di W. Russell, 1903, aggiornato): si fa SOLO a piede già pareggiato.
1. Traccia la bisettrice sulla lacuna mediana del fettone (asse latero-mediale).
2. Traccia la perpendicolare nel punto più largo della superficie palmare/plantare (asse cranio-caudale).
3. Traccia la perpendicolare alla base del fettone.
4. Dalle due estremità del fettone traccia due parallele alla bisettrice, alla stessa distanza da essa.
5. Le diagonali del riquadro si incrociano nel centro della mappatura.
Secondo l'esperienza radiografica di Di Francesco, il vero centro articolare (proiezione dell'asse P2-P3-navicolare) cade da 5 a 15 mm più indietro (caudale) rispetto al centro della mappatura o al punto più largo del piede. Per questo, nel posizionare il ferro, tiene conto di questo scostamento invece di centrare il ferro sul solo punto più largo.
Se hai una radiografia laterale, usala per verificare dove cade davvero il centro articolare: la stima di 5-15 mm è un orientamento, non una misura valida per ogni cavallo.$t$,
 'Luciano Di Francesco, «La conformazione dello zoccolo è condizionata dal ferro» (blog, 24/11/2020); W. Russell (1903)', null, '2026-10-29', true),

('maniscalco', 'ferratura',
 'Centro di carico del ferro e ripartizione craniale/caudale: punta lunga, talloni alti, interferenze (Di Francesco)',
 $t$Orientamento da esperienza di campo (Luciano Di Francesco), non da studi controllati.
- Centro di carico del ferro: con un ferro a binda uniforme coincide con il centro geometrico del ferro; con ferri modificati (rullati, con biette o rampe) si misura sulla superficie che tocca davvero il terreno.
- Regola di base: il centro di carico del ferro va sovrapposto al centro di equilibrio del piede, con il carico ripartito circa 50% davanti e 50% dietro. Se la ripartizione è sbagliata la scatola cornea cresce storta: punte lunghe con talloni sfuggenti e bassi, oppure punte corte con talloni contratti e alti.
- Punta lunga e talloni bassi: ferro arretrato e stacco facilitato (punta rullata); obiettivo accorciare la leva digitale, ridurre lo sforzo dei flessori e far crescere i talloni; ripartizione indicativa 40% davanti / 60% dietro.
- Punta corta e talloni alti: superficie d'appoggio più avanzata o rullatura modificata per favorire lo stacco e la crescita della punta; ripartizione indicativa 60% davanti / 40% dietro.
- Interferenze (il cavallo «fabbrica»): cambiare leve e superficie d'appoggio del ferro modifica tempi di atterraggio e stacco e la traiettoria dell'arto; va personalizzato osservando il cavallo in movimento.
- Esempi: reining (anteriore) ferro in lega leggera, punta squadrata con rampa e biette ai talloni, posizionato più indietro della mappatura classica; endurance (anteriore) ferro tipo Natural Balance, punta molto raccordata e appoggio palmare uniforme.
- Barbette in punta: Di Francesco le sconsiglia, salvo pochi casi (circa 1 su 10) in cui si vuole spostare il carico in avanti o per cavalli da lavoro pesante.$t$,
 'Luciano Di Francesco, «La conformazione dello zoccolo è condizionata dal ferro» (blog, 24/11/2020)', null, '2026-10-29', true)
on conflict (titolo) do update set ambito = excluded.ambito, categoria = excluded.categoria, contenuto = excluded.contenuto,
  fonte_titolo = excluded.fonte_titolo, fonte_url = excluded.fonte_url, verificato_il = excluded.verificato_il, attivo = true, aggiornato_il = now();
