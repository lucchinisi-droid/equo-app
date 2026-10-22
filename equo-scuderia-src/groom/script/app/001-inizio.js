
/* ===================== EQUO GROOM =====================
   App semplificata per il personale di stalla: niente account, QR personale + PIN di 4 cifre.
   Vede solo i box di oggi e segna le attività con un tocco. Funziona anche senza rete (coda). */
const SB_URL = "https://ncbdrhbpgdcaentoxlfz.supabase.co";
const SB_KEY = "sb_publishable_Qf-UTipNPe4Z8g6VpmW8Ag_8zCbNnBC";
const K_STATO = "equo-groom", K_CODA = "equo-groom-coda", K_CACHE = "equo-groom-cache";

const ICONE = {
  pasto_mattina:{ i:"fa-bowl-food", c:"#b7862b" }, pasto_sera:{ i:"fa-bowl-rice", c:"#8a5a2b" }, fieno:{ i:"fa-wheat-awn", c:"#9a7b2f" },
  acqua:{ i:"fa-droplet", c:"#2f79b7" }, paddock:{ i:"fa-tree", c:"#3f7a45" }, lavorato:{ i:"fa-horse", c:"#1d4a35" },
  farmaco:{ i:"fa-pills", c:"#c0473d" }, box_pulito:{ i:"fa-broom", c:"#6b4fa0" },
  integratore:{ i:"fa-capsules", c:"#5d8f4e", extra:true }, coperta:{ i:"fa-rug", c:"#7a6a55", extra:true },
  zoccoli:{ i:"svg", c:"#5f6b73", extra:true }, grooming:{ i:"fa-brush", c:"#b0567a", extra:true },
};
const FERRO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round"><path d="M6 20 L6 12 A6 6 0 0 1 18 12 L18 20"/><circle cx="6" cy="20.3" r="1.15" fill="currentColor" stroke="none"/><circle cx="18" cy="20.3" r="1.15" fill="currentColor" stroke="none"/></svg>';
const STATI_ICONA = { in_box:"fa-house", paddock:"fa-tree", lavoro:"fa-horse", maniscalco:"svg", veterinario:"fa-stethoscope", riposo:"fa-bed", isolamento:"fa-shield-virus", fuori_sede:"fa-truck" };

const LINGUE = { it:"Italiano", en:"English", ro:"Română", hi:"हिन्दी", pa:"ਪੰਜਾਬੀ", bn:"বাংলা", ar:"العربية" };
const T = {
it:{ app:"Equo Groom", benvenuto:"Inquadra con la fotocamera il QR personale che ti ha dato il responsabile della scuderia.", non_valido:"Questo QR non è più valido. Chiedi un nuovo QR al responsabile.", bloccato:"Troppi PIN sbagliati. Chiedi un nuovo QR al responsabile.",
  ciao:"Ciao {n}", crea_pin:"Scegli un PIN di 4 cifre", ripeti_pin:"Ripeti lo stesso PIN", pin_diversi:"I due PIN non sono uguali. Riprova.", inserisci_pin:"Inserisci il tuo PIN", pin_errato:"PIN sbagliato",
  fatti:"{a} di {b} fatte", tutti:"Tutti", da_fare:"Da fare", vuoto:"Box vuoto", manut:"In manutenzione", nota:"Nota", togli_q:"Togliere la spunta?", fatto_da:"Fatto da {n} alle {o}", si_togli:"Sì, togli", no:"No", chiudi:"Chiudi",
  offline:"Senza rete: {n} spunte in attesa. Le invio appena torna la rete.", aggiornato:"Aggiornato alle {o}", scansiona:"Scansiona box", tutti_box:"Tutti i box", box_no:"Questo box non è della tua scuderia.", camera_no:"Non riesco ad aprire la fotocamera. Usa la fotocamera del telefono sul QR del box.",
  inquadra:"Inquadra il QR attaccato al box", lingua:"Lingua", installa:"Metti Equo Groom nella schermata Home", installa_btn:"Installa", installa_ios:"Tocca Condividi e poi «Aggiungi alla schermata Home».", esci:"Esci", esci_q:"Vuoi uscire? Per rientrare servono di nuovo il QR e il PIN.",
  nessun_box:"Nessun box ancora. Il responsabile li crea nel gestionale.", errore:"Problema di collegamento. Riprovo tra poco.", tutto_fatto:"Tutto fatto in questo box", box:"Box", oggi:"Oggi",
  att:{ pasto_mattina:"Pasto mattina", pasto_sera:"Pasto sera", fieno:"Fieno", acqua:"Acqua", paddock:"Paddock", lavorato:"Lavorato", farmaco:"Farmaco", box_pulito:"Box pulito", integratore:"Integratore", coperta:"Coperta", zoccoli:"Zoccoli", grooming:"Grooming" },
  st:{ in_box:"In box", paddock:"Al paddock", lavoro:"In lavoro", maniscalco:"Dal maniscalco", veterinario:"Visita veterinaria", riposo:"A riposo", isolamento:"In isolamento", fuori_sede:"Fuori sede" } },
en:{ app:"Equo Groom", benvenuto:"Scan the personal QR code your stable manager gave you with the camera.", non_valido:"This QR code is no longer valid. Ask your manager for a new one.", bloccato:"Too many wrong PINs. Ask your manager for a new QR code.",
  ciao:"Hi {n}", crea_pin:"Choose a 4-digit PIN", ripeti_pin:"Repeat the same PIN", pin_diversi:"The two PINs don't match. Try again.", inserisci_pin:"Enter your PIN", pin_errato:"Wrong PIN",
  fatti:"{a} of {b} done", tutti:"All", da_fare:"To do", vuoto:"Empty box", manut:"Under maintenance", nota:"Note", togli_q:"Remove the tick?", fatto_da:"Done by {n} at {o}", si_togli:"Yes, remove", no:"No", chiudi:"Close",
  offline:"No connection: {n} ticks waiting. They will be sent when the connection is back.", aggiornato:"Updated at {o}", scansiona:"Scan box", tutti_box:"All boxes", box_no:"This box is not in your stable.", camera_no:"Can't open the camera. Use the phone camera on the box QR code.",
  inquadra:"Point at the QR code on the box", lingua:"Language", installa:"Put Equo Groom on your Home screen", installa_btn:"Install", installa_ios:"Tap Share, then “Add to Home Screen”.", esci:"Log out", esci_q:"Log out? You will need the QR code and PIN again to come back.",
  nessun_box:"No boxes yet. The manager creates them in the management app.", errore:"Connection problem. Trying again shortly.", tutto_fatto:"Everything done in this box", box:"Box", oggi:"Today",
  att:{ pasto_mattina:"Morning feed", pasto_sera:"Evening feed", fieno:"Hay", acqua:"Water", paddock:"Paddock", lavorato:"Worked", farmaco:"Medicine", box_pulito:"Box cleaned", integratore:"Supplement", coperta:"Rug", zoccoli:"Hooves", grooming:"Grooming" },
  st:{ in_box:"In the box", paddock:"In the paddock", lavoro:"Working", maniscalco:"At the farrier", veterinario:"Vet visit", riposo:"Resting", isolamento:"In isolation", fuori_sede:"Away" } },
ro:{ app:"Equo Groom", benvenuto:"Scanează cu camera codul QR personal primit de la responsabilul grajdului.", non_valido:"Acest cod QR nu mai este valabil. Cere un cod nou responsabilului.", bloccato:"Prea multe PIN-uri greșite. Cere un cod QR nou responsabilului.",
  ciao:"Salut {n}", crea_pin:"Alege un PIN din 4 cifre", ripeti_pin:"Repetă același PIN", pin_diversi:"Cele două PIN-uri nu se potrivesc. Mai încearcă.", inserisci_pin:"Introdu PIN-ul tău", pin_errato:"PIN greșit",
  fatti:"{a} din {b} făcute", tutti:"Toate", da_fare:"De făcut", vuoto:"Boxă goală", manut:"În reparație", nota:"Notă", togli_q:"Ștergi bifa?", fatto_da:"Făcut de {n} la {o}", si_togli:"Da, șterge", no:"Nu", chiudi:"Închide",
  offline:"Fără internet: {n} bife în așteptare. Le trimit când revine conexiunea.", aggiornato:"Actualizat la {o}", scansiona:"Scanează boxa", tutti_box:"Toate boxele", box_no:"Această boxă nu este din grajdul tău.", camera_no:"Nu pot deschide camera. Folosește camera telefonului pe codul QR al boxei.",
  inquadra:"Îndreaptă camera spre codul QR de pe boxă", lingua:"Limba", installa:"Pune Equo Groom pe ecranul principal", installa_btn:"Instalează", installa_ios:"Apasă Partajează, apoi „Adaugă pe ecranul principal”.", esci:"Ieșire", esci_q:"Ieși? Pentru a reveni îți trebuie din nou codul QR și PIN-ul.",
  nessun_box:"Încă nu există boxe. Responsabilul le creează în aplicația de gestiune.", errore:"Problemă de conexiune. Reîncerc imediat.", tutto_fatto:"Totul este făcut la această boxă", box:"Boxa", oggi:"Azi",
  att:{ pasto_mattina:"Masa de dimineață", pasto_sera:"Masa de seară", fieno:"Fân", acqua:"Apă", paddock:"Padoc", lavorato:"Lucrat", farmaco:"Medicament", box_pulito:"Boxă curățată", integratore:"Supliment", coperta:"Pătură", zoccoli:"Copite", grooming:"Țesălat" },
  st:{ in_box:"În boxă", paddock:"La padoc", lavoro:"La lucru", maniscalco:"La potcovar", veterinario:"La veterinar", riposo:"În repaus", isolamento:"În izolare", fuori_sede:"Plecat" } },
hi:{ app:"Equo Groom", benvenuto:"अस्तबल के मैनेजर ने जो निजी QR कोड दिया है, उसे कैमरे से स्कैन करें।", non_valido:"यह QR कोड अब मान्य नहीं है। मैनेजर से नया QR कोड माँगें।", bloccato:"बहुत बार गलत PIN डाला गया। मैनेजर से नया QR कोड माँगें।",
  ciao:"नमस्ते {n}", crea_pin:"4 अंकों का PIN चुनें", ripeti_pin:"वही PIN फिर से डालें", pin_diversi:"दोनों PIN एक जैसे नहीं हैं। फिर से कोशिश करें।", inserisci_pin:"अपना PIN डालें", pin_errato:"गलत PIN",
  fatti:"{b} में से {a} हो गए", tutti:"सभी", da_fare:"बाकी काम", vuoto:"खाली बॉक्स", manut:"मरम्मत में", nota:"नोट", togli_q:"निशान हटाएँ?", fatto_da:"{n} ने {o} बजे किया", si_togli:"हाँ, हटाएँ", no:"नहीं", chiudi:"बंद करें",
  offline:"इंटरनेट नहीं है: {n} निशान बाकी हैं। इंटरनेट आते ही भेज दिए जाएँगे।", aggiornato:"{o} बजे अपडेट हुआ", scansiona:"बॉक्स स्कैन करें", tutti_box:"सभी बॉक्स", box_no:"यह बॉक्स आपके अस्तबल का नहीं है।", camera_no:"कैमरा नहीं खुल रहा। बॉक्स के QR कोड पर फ़ोन का कैमरा इस्तेमाल करें।",
  inquadra:"बॉक्स पर लगे QR कोड की ओर कैमरा करें", lingua:"भाषा", installa:"Equo Groom को होम स्क्रीन पर रखें", installa_btn:"इंस्टॉल", installa_ios:"शेयर दबाएँ, फिर “होम स्क्रीन में जोड़ें”।", esci:"बाहर निकलें", esci_q:"बाहर निकलना है? वापस आने के लिए फिर से QR कोड और PIN चाहिए।",
  nessun_box:"अभी कोई बॉक्स नहीं है। मैनेजर इन्हें प्रबंधन ऐप में बनाता है।", errore:"कनेक्शन की समस्या। थोड़ी देर में फिर कोशिश होगी।", tutto_fatto:"इस बॉक्स का सारा काम हो गया", box:"बॉक्स", oggi:"आज",
  att:{ pasto_mattina:"सुबह का दाना", pasto_sera:"शाम का दाना", fieno:"सूखी घास", acqua:"पानी", paddock:"पैडॉक", lavorato:"काम कराया", farmaco:"दवा", box_pulito:"बॉक्स साफ़", integratore:"सप्लीमेंट", coperta:"कंबल", zoccoli:"खुर", grooming:"ग्रूमिंग" },
  st:{ in_box:"बॉक्स में", paddock:"पैडॉक में", lavoro:"काम पर", maniscalco:"नालबंद के पास", veterinario:"डॉक्टर की जाँच", riposo:"आराम पर", isolamento:"अलग रखा गया", fuori_sede:"बाहर गया" } },
pa:{ app:"Equo Groom", benvenuto:"ਤਬੇਲੇ ਦੇ ਮੈਨੇਜਰ ਵੱਲੋਂ ਦਿੱਤਾ ਨਿੱਜੀ QR ਕੋਡ ਕੈਮਰੇ ਨਾਲ ਸਕੈਨ ਕਰੋ।", non_valido:"ਇਹ QR ਕੋਡ ਹੁਣ ਨਹੀਂ ਚੱਲਦਾ। ਮੈਨੇਜਰ ਤੋਂ ਨਵਾਂ QR ਕੋਡ ਮੰਗੋ।", bloccato:"ਬਹੁਤ ਵਾਰ ਗਲਤ PIN ਪਾਇਆ ਗਿਆ। ਮੈਨੇਜਰ ਤੋਂ ਨਵਾਂ QR ਕੋਡ ਮੰਗੋ।",
  ciao:"ਜੀ ਆਇਆਂ ਨੂੰ {n}", crea_pin:"4 ਅੰਕਾਂ ਦਾ PIN ਚੁਣੋ", ripeti_pin:"ਉਹੀ PIN ਦੁਬਾਰਾ ਪਾਓ", pin_diversi:"ਦੋਵੇਂ PIN ਇੱਕੋ ਜਿਹੇ ਨਹੀਂ। ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ।", inserisci_pin:"ਆਪਣਾ PIN ਪਾਓ", pin_errato:"ਗਲਤ PIN",
  fatti:"{b} ਵਿੱਚੋਂ {a} ਹੋ ਗਏ", tutti:"ਸਾਰੇ", da_fare:"ਬਾਕੀ ਕੰਮ", vuoto:"ਖਾਲੀ ਬਾਕਸ", manut:"ਮੁਰੰਮਤ ਵਿੱਚ", nota:"ਨੋਟ", togli_q:"ਨਿਸ਼ਾਨ ਹਟਾਉਣਾ ਹੈ?", fatto_da:"{n} ਨੇ {o} ਵਜੇ ਕੀਤਾ", si_togli:"ਹਾਂ, ਹਟਾਓ", no:"ਨਹੀਂ", chiudi:"ਬੰਦ ਕਰੋ",
  offline:"ਇੰਟਰਨੈੱਟ ਨਹੀਂ: {n} ਨਿਸ਼ਾਨ ਬਾਕੀ ਹਨ। ਇੰਟਰਨੈੱਟ ਆਉਂਦੇ ਹੀ ਭੇਜ ਦਿੱਤੇ ਜਾਣਗੇ।", aggiornato:"{o} ਵਜੇ ਅੱਪਡੇਟ ਹੋਇਆ", scansiona:"ਬਾਕਸ ਸਕੈਨ ਕਰੋ", tutti_box:"ਸਾਰੇ ਬਾਕਸ", box_no:"ਇਹ ਬਾਕਸ ਤੁਹਾਡੇ ਤਬੇਲੇ ਦਾ ਨਹੀਂ ਹੈ।", camera_no:"ਕੈਮਰਾ ਨਹੀਂ ਖੁੱਲ੍ਹ ਰਿਹਾ। ਬਾਕਸ ਦੇ QR ਕੋਡ ਤੇ ਫ਼ੋਨ ਦਾ ਕੈਮਰਾ ਵਰਤੋ।",
  inquadra:"ਬਾਕਸ ਤੇ ਲੱਗੇ QR ਕੋਡ ਵੱਲ ਕੈਮਰਾ ਕਰੋ", lingua:"ਭਾਸ਼ਾ", installa:"Equo Groom ਨੂੰ ਹੋਮ ਸਕ੍ਰੀਨ ਤੇ ਰੱਖੋ", installa_btn:"ਇੰਸਟਾਲ", installa_ios:"ਸ਼ੇਅਰ ਦਬਾਓ, ਫਿਰ “ਹੋਮ ਸਕ੍ਰੀਨ ਤੇ ਜੋੜੋ”।", esci:"ਬਾਹਰ ਨਿਕਲੋ", esci_q:"ਬਾਹਰ ਨਿਕਲਣਾ ਹੈ? ਵਾਪਸ ਆਉਣ ਲਈ ਫਿਰ QR ਕੋਡ ਅਤੇ PIN ਚਾਹੀਦਾ ਹੈ।",
  nessun_box:"ਹਾਲੇ ਕੋਈ ਬਾਕਸ ਨਹੀਂ। ਮੈਨੇਜਰ ਇਹਨਾਂ ਨੂੰ ਪ੍ਰਬੰਧਨ ਐਪ ਵਿੱਚ ਬਣਾਉਂਦਾ ਹੈ।", errore:"ਕੁਨੈਕਸ਼ਨ ਦੀ ਸਮੱਸਿਆ। ਥੋੜ੍ਹੀ ਦੇਰ ਬਾਅਦ ਫਿਰ ਕੋਸ਼ਿਸ਼ ਹੋਵੇਗੀ।", tutto_fatto:"ਇਸ ਬਾਕਸ ਦਾ ਸਾਰਾ ਕੰਮ ਹੋ ਗਿਆ", box:"ਬਾਕਸ", oggi:"ਅੱਜ",
  att:{ pasto_mattina:"ਸਵੇਰ ਦਾ ਦਾਣਾ", pasto_sera:"ਸ਼ਾਮ ਦਾ ਦਾਣਾ", fieno:"ਸੁੱਕਾ ਘਾਹ", acqua:"ਪਾਣੀ", paddock:"ਪੈਡੌਕ", lavorato:"ਕੰਮ ਕਰਾਇਆ", farmaco:"ਦਵਾਈ", box_pulito:"ਬਾਕਸ ਸਾਫ਼", integratore:"ਸਪਲੀਮੈਂਟ", coperta:"ਕੰਬਲ", zoccoli:"ਖੁਰ", grooming:"ਗਰੂਮਿੰਗ" },
  st:{ in_box:"ਬਾਕਸ ਵਿੱਚ", paddock:"ਪੈਡੌਕ ਵਿੱਚ", lavoro:"ਕੰਮ ਤੇ", maniscalco:"ਨਾਲਬੰਦ ਕੋਲ", veterinario:"ਡਾਕਟਰ ਦੀ ਜਾਂਚ", riposo:"ਆਰਾਮ ਤੇ", isolamento:"ਵੱਖਰਾ ਰੱਖਿਆ", fuori_sede:"ਬਾਹਰ ਗਿਆ" } },
bn:{ app:"Equo Groom", benvenuto:"আস্তাবলের ম্যানেজার যে ব্যক্তিগত QR কোড দিয়েছেন, ক্যামেরা দিয়ে সেটি স্ক্যান করুন।", non_valido:"এই QR কোড আর কাজ করে না। ম্যানেজারের কাছে নতুন QR কোড চান।", bloccato:"অনেকবার ভুল PIN দেওয়া হয়েছে। ম্যানেজারের কাছে নতুন QR কোড চান।",
  ciao:"স্বাগতম {n}", crea_pin:"৪ অঙ্কের একটি PIN বেছে নিন", ripeti_pin:"একই PIN আবার দিন", pin_diversi:"দুটি PIN মিলছে না। আবার চেষ্টা করুন।", inserisci_pin:"আপনার PIN দিন", pin_errato:"ভুল PIN",
  fatti:"{b}টির মধ্যে {a}টি হয়েছে", tutti:"সব", da_fare:"বাকি কাজ", vuoto:"খালি বক্স", manut:"মেরামত চলছে", nota:"নোট", togli_q:"টিক চিহ্ন সরাবেন?", fatto_da:"{n} {o}-এ করেছেন", si_togli:"হ্যাঁ, সরান", no:"না", chiudi:"বন্ধ করুন",
  offline:"ইন্টারনেট নেই: {n}টি টিক অপেক্ষায়। ইন্টারনেট এলেই পাঠানো হবে।", aggiornato:"{o}-এ আপডেট হয়েছে", scansiona:"বক্স স্ক্যান করুন", tutti_box:"সব বক্স", box_no:"এই বক্সটি আপনার আস্তাবলের নয়।", camera_no:"ক্যামেরা খুলছে না। বক্সের QR কোডে ফোনের ক্যামেরা ব্যবহার করুন।",
  inquadra:"বক্সে লাগানো QR কোডের দিকে ক্যামেরা ধরুন", lingua:"ভাষা", installa:"Equo Groom হোম স্ক্রিনে রাখুন", installa_btn:"ইনস্টল", installa_ios:"শেয়ার চাপুন, তারপর “হোম স্ক্রিনে যোগ করুন”।", esci:"বের হন", esci_q:"বের হবেন? ফিরে আসতে আবার QR কোড আর PIN লাগবে।",
  nessun_box:"এখনও কোনো বক্স নেই। ম্যানেজার এগুলো ম্যানেজমেন্ট অ্যাপে তৈরি করেন।", errore:"সংযোগে সমস্যা। একটু পরে আবার চেষ্টা হবে।", tutto_fatto:"এই বক্সের সব কাজ হয়ে গেছে", box:"বক্স", oggi:"আজ",
  att:{ pasto_mattina:"সকালের খাবার", pasto_sera:"সন্ধ্যার খাবার", fieno:"খড়", acqua:"পানি", paddock:"প্যাডক", lavorato:"কাজ করানো", farmaco:"ওষুধ", box_pulito:"বক্স পরিষ্কার", integratore:"সাপ্লিমেন্ট", coperta:"কম্বল", zoccoli:"খুর", grooming:"গ্রুমিং" },
  st:{ in_box:"বক্সে", paddock:"প্যাডকে", lavoro:"কাজে", maniscalco:"নালবন্দের কাছে", veterinario:"ডাক্তারের চেকআপ", riposo:"বিশ্রামে", isolamento:"আলাদা রাখা", fuori_sede:"বাইরে গেছে" } },
ar:{ app:"Equo Groom", benvenuto:"امسح بالكاميرا رمز QR الشخصي الذي أعطاك إياه مسؤول الإسطبل.", non_valido:"رمز QR هذا لم يعد صالحًا. اطلب رمزًا جديدًا من المسؤول.", bloccato:"أُدخل رقم PIN خاطئ مرات كثيرة. اطلب رمز QR جديدًا من المسؤول.",
  ciao:"مرحبًا {n}", crea_pin:"اختر رقم PIN من 4 أرقام", ripeti_pin:"أعد إدخال نفس الرقم", pin_diversi:"الرقمان غير متطابقين. حاول مرة أخرى.", inserisci_pin:"أدخل رقم PIN", pin_errato:"رقم PIN خاطئ",
  fatti:"تم {a} من {b}", tutti:"الكل", da_fare:"المتبقي", vuoto:"مربط فارغ", manut:"تحت الصيانة", nota:"ملاحظة", togli_q:"إزالة علامة الإنجاز؟", fatto_da:"أنجزه {n} الساعة {o}", si_togli:"نعم، أزل", no:"لا", chiudi:"إغلاق",
  offline:"لا يوجد اتصال: {n} علامات في الانتظار. سترسل عند عودة الاتصال.", aggiornato:"آخر تحديث {o}", scansiona:"امسح المربط", tutti_box:"كل المرابط", box_no:"هذا المربط ليس في إسطبلك.", camera_no:"تعذر فتح الكاميرا. استخدم كاميرا الهاتف على رمز QR الخاص بالمربط.",
  inquadra:"وجّه الكاميرا نحو رمز QR الملصق على المربط", lingua:"اللغة", installa:"ضع Equo Groom على الشاشة الرئيسية", installa_btn:"تثبيت", installa_ios:"اضغط مشاركة ثم «إضافة إلى الشاشة الرئيسية».", esci:"خروج", esci_q:"هل تريد الخروج؟ ستحتاج رمز QR ورقم PIN من جديد للعودة.",
  nessun_box:"لا توجد مرابط بعد. ينشئها المسؤول في برنامج الإدارة.", errore:"مشكلة في الاتصال. سنحاول مرة أخرى بعد قليل.", tutto_fatto:"تم كل العمل في هذا المربط", box:"مربط", oggi:"اليوم",
  att:{ pasto_mattina:"وجبة الصباح", pasto_sera:"وجبة المساء", fieno:"تبن", acqua:"ماء", paddock:"الحقل", lavorato:"تم تدريبه", farmaco:"دواء", box_pulito:"تنظيف المربط", integratore:"مكمل غذائي", coperta:"غطاء", zoccoli:"الحوافر", grooming:"تمشيط" },
  st:{ in_box:"في المربط", paddock:"في الحقل", lavoro:"في التدريب", maniscalco:"عند الحداد", veterinario:"عند البيطري", riposo:"في راحة", isolamento:"في العزل", fuori_sede:"خارج المركز" } },
};

