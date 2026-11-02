// PIANO TERAPEUTICO (2/11/2026, SQL 34) — funzione PROGRAMMATA ogni 5 minuti (netlify.toml).
// All'ora di una somministrazione del piano (terapie_somministrazioni, non fatta e non ancora avvisata) il PROPRIETARIO
// su Equo riceve la notifica push; se la push non parte (notifiche spente, iPhone senza app installata) un'email.
// Le somministrazioni dello stesso piano alla stessa ora diventano UN solo avviso. Solo piani attivi e già mandati dal veterinario.
// La somministrazione si «prenota» (avvisato_il) prima dell'invio, così due giri sovrapposti non la mandano due volte.
// Più vecchie di un'ora non si mandano più (il proprietario le vede comunque in Home).
const { createClient } = require("@supabase/supabase-js");
const { URL_APP, esc, inviaPush, inviaEmail } = require("../agente/avvisi");
const TEMPO_MAX_MS = 20000;
const oraIt = (iso) => new Date(iso).toLocaleTimeString("it-IT", { timeZone: "Europe/Rome", hour: "2-digit", minute: "2-digit" });

function testoVoci(voci) { return voci.map((v) => v.nome + (v.dose ? " " + v.dose : "")).join(", "); }

async function avvisa(admin, gruppo) {
  const { piano, previsto_il, righe } = gruppo;
  // prenotazione: solo un giro le prende
  const { data: prese } = await admin.from("terapie_somministrazioni").update({ avvisato_il: new Date().toISOString() })
    .in("id", righe.map((r) => r.id)).is("avvisato_il", null).is("fatto_il", null).select("id");
  if (!prese || !prese.length) return "gia_preso";
  const { data: owner } = await admin.rpc("equo_terapia_owner", { p_piano: piano.id });
  if (!owner) return "senza_proprietario";
  const cavallo = piano.cavallo_nome || "il tuo cavallo";
  const voci = righe.filter((r) => prese.some((p) => p.id === r.id)).map((r) => r.voce);
  const testo = `${oraIt(previsto_il)} · ${testoVoci(voci)}`;
  const push = await inviaPush({ userId: owner, titolo: `💊 Terapia di ${cavallo}`, testo, etichetta: "terapia " + piano.id,
    dati: { apri: "terapie", id: piano.id }, url: `${URL_APP}/?apri=terapie&id=${piano.id}` });
  if (push) return "push";
  const { data: prof } = await admin.from("profiles").select("email, full_name").eq("id", owner).maybeSingle();
  const nome = prof?.full_name ? String(prof.full_name).split(" ")[0] : "";
  const html = `<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:520px;margin:auto;color:#1c2b22;font-size:15px;line-height:1.5">
<p>Ciao${nome ? " " + esc(nome) : ""},</p>
<p style="font-size:17px;margin:14px 0"><b>💊 È ora della terapia di ${esc(cavallo)}</b></p>
<p>${voci.map((v) => `<b>${esc(v.nome)}</b>${v.dose ? " · " + esc(v.dose) : ""}${v.via ? " · " + esc(v.via) : ""}`).join("<br>")}</p>
<p style="color:#6b7a70">Ore ${esc(oraIt(previsto_il))}, come nel piano del veterinario.${piano.chiedi_conferme ? " Quando l'hai data, tocca «Fatto» in Equo." : ""}</p>
<p style="margin:22px 0"><a href="${URL_APP}/?apri=terapie&id=${piano.id}" style="background:#1D2D50;color:#fff;padding:11px 18px;border-radius:10px;text-decoration:none;font-weight:600">Apri Equo</a></p>
<p style="color:#6b7a70;font-size:12px">Ti arriva per email perché le notifiche di Equo su questo telefono non sono attive. Attivale da Equo (menu profilo) per riceverle lì.</p></div>`;
  const email = await inviaEmail({ to: prof?.email, oggetto: `💊 Terapia di ${cavallo} · ore ${oraIt(previsto_il)}`, html, etichetta: "terapia" });
  return email ? "email" : "non_consegnato";
}

exports.handler = async () => {
  const inizio = Date.now();
  const admin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  const { data, error } = await admin.from("terapie_somministrazioni")
    .select("id, previsto_il, piano_id, voce:piani_terapia_voci(nome, dose, via), piano:piani_terapia!inner(id, cavallo_nome, stato, inviato_il, chiedi_conferme)")
    .is("fatto_il", null).is("avvisato_il", null)
    .lte("previsto_il", new Date(Date.now() + 2 * 60000).toISOString())
    .gte("previsto_il", new Date(Date.now() - 60 * 60000).toISOString())
    .eq("piano.stato", "attivo").not("piano.inviato_il", "is", null)
    .order("previsto_il", { ascending: true }).limit(500);
  if (error) { console.error("invia-terapie:", error.message); return { statusCode: 200, body: "tabella non pronta" }; }
  // un avviso per piano e orario
  const gruppi = new Map();
  for (const r of data || []) {
    const k = r.piano_id + "|" + r.previsto_il;
    if (!gruppi.has(k)) gruppi.set(k, { piano: r.piano, previsto_il: r.previsto_il, righe: [] });
    gruppi.get(k).righe.push(r);
  }
  const esiti = {};
  for (const g of gruppi.values()) {
    if (Date.now() - inizio > TEMPO_MAX_MS) { esiti.rimandati = (esiti.rimandati || 0) + 1; continue; }
    const r = await avvisa(admin, g).catch((e) => { console.error("invia-terapie", g.piano?.id, e); return "errore"; });
    esiti[r] = (esiti[r] || 0) + 1;
  }
  if (gruppi.size) console.log("invia-terapie", JSON.stringify(esiti));
  return { statusCode: 200, body: JSON.stringify(esiti) };
};

exports._interni = { avvisa, testoVoci };
