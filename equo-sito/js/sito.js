(function () {
  "use strict";

  // Link di accesso, conferma email o recupero password finiti sul sito: li passiamo all'app
  if (/access_token=|type=recovery|type=signup|error_code=/.test(location.hash) || /[?&]code=/.test(location.search)) {
    location.replace("https://app.equohub.com/" + location.search + location.hash);
    return;
  }

  // Menu su telefono
  var btn = document.querySelector(".nav-menu-btn");
  var tendina = document.getElementById("tendina");
  if (btn && tendina) {
    btn.addEventListener("click", function () {
      var aperta = tendina.classList.toggle("aperta");
      btn.setAttribute("aria-expanded", aperta ? "true" : "false");
      document.body.style.overflow = aperta ? "hidden" : "";
    });
    tendina.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        tendina.classList.remove("aperta");
        btn.setAttribute("aria-expanded", "false");
        document.body.style.overflow = "";
      }
    });
  }

  // Anno nel piè di pagina
  var anno = document.getElementById("anno");
  if (anno) anno.textContent = new Date().getFullYear();

  // Comparsa allo scorrimento
  var blocchi = document.querySelectorAll(".appare");
  if ("IntersectionObserver" in window) {
    var oss = new IntersectionObserver(function (voci) {
      voci.forEach(function (v) {
        if (v.isIntersecting) { v.target.classList.add("visto"); oss.unobserve(v.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    blocchi.forEach(function (b) { oss.observe(b); });
  } else {
    blocchi.forEach(function (b) { b.classList.add("visto"); });
  }

  // Video di apertura: parte solo se l'utente non ha chiesto meno animazioni e la connessione non è in risparmio dati
  var video = document.getElementById("video-apertura");
  var menoMoto = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var risparmio = navigator.connection && navigator.connection.saveData;
  if (video && !menoMoto && !risparmio) {
    video.preload = "auto";
    var p = video.play();
    if (p && p.catch) p.catch(function () {});
  }

  // Contatori Early Adopter (dati reali)
  var URL_RPC = "https://ncbdrhbpgdcaentoxlfz.supabase.co/rest/v1/rpc/promo_posti";
  var CHIAVE = "sb_publishable_Qf-UTipNPe4Z8g6VpmW8Ag_8zCbNnBC";

  function mostra(tipo, dati) {
    var box = document.querySelector('[data-promo="' + tipo + '"]');
    if (!box) return;
    var nRim = box.querySelector("[data-rimasti]");
    var nTot = box.querySelector("[data-totale]");
    var nota = box.querySelector("[data-nota]");
    var barra = box.querySelector(".barra i");
    if (!dati) {
      nRim.textContent = "—";
      nota.textContent = "Posti limitati. Il contatore non è disponibile in questo momento.";
      return;
    }
    var tot = Number(dati.totale) || 0;
    var rim = Math.max(0, Number(dati.rimasti) || 0);
    nTot.textContent = tot;
    if (rim === 0) {
      nRim.textContent = "0";
      nota.textContent = "Posti esauriti. Grazie a tutti gli Early Adopter.";
      var cta = document.querySelector('[data-cta="' + tipo + '"]');
      if (cta) { cta.textContent = "Posti esauriti"; cta.removeAttribute("href"); cta.classList.add("esaurito"); cta.setAttribute("aria-disabled", "true"); }
    } else {
      anima(nRim, rim);
      nota.textContent = "Aggiornato in tempo reale. " + (Number(dati.riservati) || 0) + " posti sono già stati assegnati a tester e partner della beta.";
    }
    if (barra && tot > 0) {
      var usati = Math.round(((tot - rim) / tot) * 100);
      setTimeout(function () { barra.style.width = usati + "%"; }, 150);
    }
  }

  function anima(el, fine) {
    if (menoMoto) { el.textContent = fine; return; }
    var inizio = null, durata = 900;
    function passo(t) {
      if (!inizio) inizio = t;
      var k = Math.min(1, (t - inizio) / durata);
      el.textContent = Math.round(fine * (1 - Math.pow(1 - k, 3)));
      if (k < 1) requestAnimationFrame(passo);
    }
    requestAnimationFrame(passo);
  }

  function caricaContatori() {
    var ctrl = "AbortController" in window ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 8000);
    fetch(URL_RPC, {
      method: "POST",
      headers: { "apikey": CHIAVE, "Authorization": "Bearer " + CHIAVE, "Content-Type": "application/json" },
      body: "{}",
      signal: ctrl ? ctrl.signal : undefined
    })
      .then(function (r) { if (!r.ok) throw new Error("http " + r.status); return r.json(); })
      .then(function (d) {
        clearTimeout(timer);
        mostra("proprietari", d && d.proprietari);
        mostra("professionisti", d && d.professionisti);
      })
      .catch(function () {
        clearTimeout(timer);
        mostra("proprietari", null);
        mostra("professionisti", null);
      });
  }
  caricaContatori();
})();
