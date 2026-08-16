/* A Cantina di Corsica — ambiance sonore optionnelle (coupée par défaut)
   Chaque page déclare son fichier via <body data-ambience="assets/audio/xxx.mp3">.
   Si le fichier n'existe pas encore, le bouton ne s'affiche pas. */
(function () {
  "use strict";

  var src = document.body.dataset.ambience;
  if (!src) return;

  var audio = null;
  var playing = false;

  var btn = document.createElement("button");
  btn.className = "ambience-toggle";
  btn.type = "button";
  btn.setAttribute("aria-label", "Activer le son d'ambiance");
  btn.setAttribute("aria-pressed", "false");
  btn.innerHTML =
    '<svg class="icon-on" width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
    '<path d="M11 5 6 9H2v6h4l5 4V5z" fill="currentColor"/>' +
    '<path d="M15.5 8.5a5 5 0 0 1 0 7M18 6a8.5 8.5 0 0 1 0 12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>' +
    '<svg class="icon-off" width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
    '<path d="M11 5 6 9H2v6h4l5 4V5z" fill="currentColor"/>' +
    '<path d="M16 9l6 6M22 9l-6 6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';

  // n'afficher le bouton que si le fichier audio existe
  fetch(src, { method: "HEAD" }).then(function (r) {
    if (!r.ok) return;
    document.body.appendChild(btn);
  }).catch(function () { /* pas de fichier → pas de bouton */ });

  function fadeTo(target, ms) {
    if (!audio) return;
    var from = audio.volume;
    var start = performance.now();
    function step(now) {
      var t = Math.min(1, (now - start) / ms);
      audio.volume = from + (target - from) * t;
      if (t < 1) requestAnimationFrame(step);
      else if (target === 0) audio.pause();
    }
    requestAnimationFrame(step);
  }

  btn.addEventListener("click", function () {
    if (!audio) {
      audio = new Audio(src);
      audio.loop = true;
      audio.volume = 0;
    }
    playing = !playing;
    btn.classList.toggle("is-on", playing);
    btn.setAttribute("aria-pressed", String(playing));
    btn.setAttribute("aria-label", playing ? "Couper le son d'ambiance" : "Activer le son d'ambiance");
    if (playing) {
      audio.play().then(function () { fadeTo(0.35, 900); }).catch(function () {
        playing = false;
        btn.classList.remove("is-on");
        btn.setAttribute("aria-pressed", "false");
      });
    } else {
      fadeTo(0, 600);
    }
  });

  // couper proprement quand on quitte la page
  window.addEventListener("pagehide", function () { if (audio) audio.pause(); });
})();
