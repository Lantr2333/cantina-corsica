/* A Cantina di Corsica — accueil : intro blason + hall des univers */
(function () {
  "use strict";

  gsap.registerPlugin(ScrollTrigger);

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Lenis smooth scroll ---------- */
  var lenis = new Lenis({
    duration: 1.2,
    easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
    smoothWheel: true
  });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
  gsap.ticker.lagSmoothing(0);

  if (reduceMotion) return;

  /* ---------- Intro : blason + nom ---------- */
  var tl = gsap.timeline({ delay: 0.15 });
  // (le "souffle" continu est en CSS ; GSAP n'anime que l'entrée via un wrapper implicite : opacité + filtre)
  tl.from(".logo-hero", { opacity: 0, filter: "blur(10px) drop-shadow(0 0 0 rgba(0,0,0,0))", duration: 1.5, ease: "power3.out" })
    .from(".intro-tagline", { y: 24, opacity: 0, duration: 0.8, ease: "power3.out" }, "-=0.5")
    .from(".intro-panel .scroll-indicator", { opacity: 0, duration: 0.7 }, "-=0.3");

  /* ---------- Plongée dans le logo ----------
     Le scroll fait grossir le blason jusqu'à ce qu'il englobe l'écran,
     puis le panneau crème s'ouvre en iris (cercle) et révèle le hall dessous. */
  var intro = document.querySelector(".intro-panel");
  var inner = document.querySelector(".intro-inner");
  var logoHero = document.querySelector(".logo-hero");
  var tagline = document.querySelector(".intro-tagline");
  var indicator = document.querySelector(".intro-panel .scroll-indicator");

  function diveScale() {
    // scale final (relatif à l'élément ×K) : couvrir la diagonale de l'écran, plafonné à 1 (= taille native nette)
    var d = Math.hypot(window.innerWidth, window.innerHeight);
    return Math.min(1, (d / Math.max(1, baseSize)) * 1.05 / K);
  }
  // pendant la plongée, on affiche la version 2000px (nette une fois agrandie)
  var logoImg = document.querySelector(".logo-img");
  var hi = new Image(); hi.src = "assets/logo-cantina-2k.webp";

  /* Anti-flou pendant la plongée : au repos, l'élément est à sa taille naturelle (net, aucun transform).
     Dès que la plongée démarre (>0), on le passe en "pré-rendu grand" (×K) affiché réduit (1/K),
     pour que le zoom ne fasse que dé-réduire un bitmap déjà net. Retour à l'état naturel à 0. */
  var K = 3.4;
  var baseSize = logoHero.getBoundingClientRect().width;
  var bigMode = false;
  function enterBig() {
    if (bigMode) return; bigMode = true;
    baseSize = Math.min(window.innerWidth * 0.84, 560, window.innerHeight * 0.62);
    var m = -(baseSize * K - baseSize) / 2;
    gsap.set(logoHero, { width: baseSize * K, height: baseSize * K, marginLeft: m, marginRight: m, marginTop: m, marginBottom: m });
    if (hi.complete) logoImg.src = hi.src;
  }
  function exitBig() {
    if (!bigMode) return; bigMode = false;
    gsap.set(logoHero, { clearProps: "width,height,marginLeft,marginRight,marginTop,marginBottom,scale,transform" });
    logoImg.src = "assets/logo-cantina.webp";
  }

  var dive = gsap.timeline({
    scrollTrigger: {
      trigger: intro,
      start: "top top",
      end: "+=180%",
      pin: true,
      pinSpacing: true,
      scrub: 0.6,
      anticipatePin: 1,
      onEnter: function () { intro.classList.add("is-diving"); logoHero.classList.add("diving"); backdrop.classList.add("on"); },
      onLeaveBack: function () { intro.classList.remove("is-diving"); logoHero.classList.remove("diving"); backdrop.classList.remove("on"); exitBig(); },
      onUpdate: function (self) {
        var p = self.progress;
        if (p > 0.002) {
          enterBig();
          // zoom : de 1/K (taille visuelle normale) à diveScale(), easing power2.in sur les 62% premiers du pin
          var t = Math.min(1, p / 0.62); var e = t * t;
          var s = (1 / K) + (diveScale() - 1 / K) * e;
          gsap.set(logoHero, { scale: s });
        } else {
          exitBig();
        }
      },
      onEnterBack: function () { backdrop.classList.add("on"); },
      invalidateOnRefresh: true
    }
  });
  // décor fixe (aperçu du hall) visible à travers l'iris pendant la plongée
  var backdrop = document.createElement("div");
  backdrop.className = "dive-backdrop"; backdrop.setAttribute("aria-hidden", "true");
  backdrop.innerHTML = document.querySelector(".hall").innerHTML; // copie exacte (mêmes visuels, textes, boutons)
  document.body.appendChild(backdrop);

  dive
    .to([tagline, indicator], { opacity: 0, y: -16, duration: 0.05, ease: "power2.out" }, 0)
    .set([tagline, indicator], { visibility: "hidden" }, 0.06)
    // 1) plongée : le blason grossit jusqu'à envelopper l'écran
    // (le zoom du blason est piloté à la main dans onUpdate — voir plus bas — pour rester net au repos)
    .to({}, { duration: 0.62 }, 0)
    // 2) l'iris s'ouvre PENDANT la fin de la plongée (pas de temps mort crème) : les univers apparaissent
    //    à travers le blason qui finit de grossir…
    .fromTo(intro, { "--iris": "150%" }, { "--iris": "0%", ease: "power2.inOut", duration: 0.34 }, 0.50)
    // 3) …et le blason se fond en dernier, rapidement
    .to(logoHero, { opacity: 0, duration: 0.12, ease: "power1.in" }, 0.60);

  // le backdrop s'efface seulement quand le vrai hall couvre l'écran (raccord invisible)
  ScrollTrigger.create({
    trigger: ".hall", start: "top top",
    onEnter: function () { backdrop.classList.remove("on"); },
    onLeaveBack: function () { backdrop.classList.add("on"); }
  });

  /* ---------- Bandeau histoire ---------- */
  gsap.from(".story-band > *", {
    y: 40, opacity: 0, stagger: 0.12, duration: 0.9, ease: "power3.out",
    scrollTrigger: { trigger: ".story-band", start: "top 75%" }
  });
})();
