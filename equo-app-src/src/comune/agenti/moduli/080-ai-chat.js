// Equo App · agenti · modulo (moduli ES, costruiti con Vite in ruoli/agenti/costruito.js)
/* ---------- AI CHAT ---------- */
// Parole chiave molto semplici usate SOLO in DEMO_MODE per simulare la proposta
// di un evento sanitario, così il flusso di conferma è testabile senza API key.
const DEMO_EVENT_TYPES = { vaccino: "vaccino", coggins: "coggins", ferratura: "ferratura", sverminazione: "sverminazione" };

function detectDemoEvent(text){
  const t = text.toLowerCase();
  const type = Object.keys(DEMO_EVENT_TYPES).find(k => t.includes(k));
  if(!type) return null;
  const dateMatch = t.match(/(\d{4}-\d{2}-\d{2})|(\d{1,2}\/\d{1,2}\/\d{2,4})/);
  const horse = horses.find(h => t.includes((h.name || "").toLowerCase()));
  if(!horse) return null;
  let date = isoLocale(new Date());
  if(dateMatch){
    if(dateMatch[1]) date = dateMatch[1];
    else if(dateMatch[2]){
      const [d,m,y] = dateMatch[2].split("/");
      const yyyy = y.length === 2 ? "20" + y : y;
      date = `${yyyy}-${m.padStart(2,"0")}-${d.padStart(2,"0")}`;
    }
  }
  return { horse_name: horse.name, type, date, next_due_date: null, notes: null };
}


export { detectDemoEvent };
