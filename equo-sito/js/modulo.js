// Moduli di contatto del sito: invio a /api/contatto (proxy verso la funzione contatto-sito dell'app)
(function () {
  var form = document.querySelector("form.modulo");
  if (!form) return;
  var inizio = Date.now();
  var errBox = form.querySelector(".errore");
  var btn = form.querySelector("button[type=submit]");
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  var q = new URLSearchParams(location.search);
  var prof = q.get("professione");
  if (prof) { var r = form.querySelector('input[name=professione][value="' + prof.replace(/[^a-z]/g, "") + '"]'); if (r) r.checked = true; }

  function val(n) { var el = form.elements[n]; return el ? String(el.value || "").trim() : ""; }
  function errore(t, campo) {
    errBox.textContent = t; errBox.style.display = "block";
    if (campo && form.elements[campo] && form.elements[campo].focus) form.elements[campo].focus();
    else errBox.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    errBox.style.display = "none";
    var modulo = form.getAttribute("data-modulo");
    var dati = {
      modulo: modulo, nome: val("nome"), email: val("email"), telefono: val("telefono"), citta: val("citta"),
      provincia: val("provincia"), messaggio: val("messaggio"), privacy: !!(form.elements.privacy && form.elements.privacy.checked),
      sito_web: val("sito_web"), ms: Date.now() - inizio, pagina: location.href.slice(0, 300),
    };
    var obbl = [["nome", "il nome e cognome"]];
    if (modulo === "candidatura") {
      var p = form.querySelector("input[name=professione]:checked");
      dati.professione = p ? p.value : "";
      dati.specializzazione = val("specializzazione"); dati.esperienza = val("esperienza");
      if (!dati.professione) return errore("Scegli la tua professione.");
    } else {
      dati.struttura = val("struttura"); dati.ruolo = val("ruolo"); dati.box = val("box");
      dati.interessi = Array.prototype.map.call(form.querySelectorAll("input[name=interessi]:checked"), function (x) { return x.value; });
      obbl.push(["struttura", "il nome della struttura"]);
    }
    obbl.push(["citta", "la città"], ["provincia", "la provincia"], ["email", "l'email"], ["telefono", "il telefono"]);
    for (var i = 0; i < obbl.length; i++) if (!val(obbl[i][0])) return errore("Manca " + obbl[i][1] + ".", obbl[i][0]);
    if (!EMAIL_RE.test(dati.email)) return errore("Controlla l'indirizzo email.", "email");
    if (dati.telefono.replace(/\D/g, "").length < 6) return errore("Controlla il numero di telefono.", "telefono");
    if (!dati.privacy) return errore("Per inviare serve accettare l'informativa privacy.");

    btn.disabled = true; var testoBtn = btn.textContent; btn.textContent = "Invio in corso…";
    fetch("/api/contatto", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(dati) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok && j.ok, j: j }; }); })
      .then(function (res) {
        if (!res.ok) throw new Error(res.j.errore || "Invio non riuscito.");
        form.style.display = "none";
        var ok = document.querySelector(".modulo-ok");
        ok.style.display = "block";
        ok.scrollIntoView({ behavior: "smooth", block: "center" });
        if (typeof window.gtag === "function") window.gtag("event", "modulo_inviato", { modulo: modulo });
      })
      .catch(function (e) {
        errore((e && e.message) || "Invio non riuscito. Riprova o scrivi a gestione.equo@gmail.com.");
        btn.disabled = false; btn.textContent = testoBtn;
      });
  });
})();
