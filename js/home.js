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

  /* Anti-flou : le navigateur rasterise l'élément à sa taille de départ puis étire le bitmap
     pendant scale(). On rend donc le blason à sa taille MAX (×K) et on l'affiche réduit (scale 1/K) :
     le bitmap est déjà net à la résolution finale, le zoom ne fait que le "dé-réduire". */
  var K = 3.4;
  var baseSize = logoHero.getBoundingClientRect().width;
  gsap.set(logoHero, { width: baseSize * K, height: baseSize * K, scale: 1 / K,
    marginLeft: -(baseSize * K - baseSize) / 2, marginRight: -(baseSize * K - baseSize) / 2,
    marginTop: -(baseSize * K - baseSize) / 2, marginBottom: -(baseSize * K - baseSize) / 2 });
  window.addEventListener("resize", function () {
    var s = Math.min(window.innerWidth * 0.84, 560, window.innerHeight * 0.62);
    gsap.set(logoHero, { width: s * K, height: s * K,
      marginLeft: -(s * K - s) / 2, marginRight: -(s * K - s) / 2, marginTop: -(s * K - s) / 2, marginBottom: -(s * K - s) / 2 });
    baseSize = s;
  });

  var dive = gsap.timeline({
    scrollTrigger: {
      trigger: intro,
      start: "top top",
      end: "+=220%",
      pin: true,
      pinSpacing: true,
      scrub: 0.6,
      anticipatePin: 1,
      onEnter: function () { intro.classList.add("is-diving"); logoHero.classList.add("diving"); backdrop.classList.add("on"); if (hi.complete) logoImg.src = hi.src; },
      onLeaveBack: function () { intro.classList.remove("is-diving"); logoHero.classList.remove("diving"); backdrop.classList.remove("on"); },
      onEnterBack: function () { backdrop.classList.add("on"); },
      invalidateOnRefresh: true
    }
  });
  // décor fixe (aperçu du hall) visible à travers l'iris pendant la plongée
  var backdrop = document.createElement("div");
  backdrop.className = "dive-backdrop"; backdrop.setAttribute("aria-hidden", "true");
  backdrop.innerHTML =
    '<span class="bd-charcut"><b><i>Univers 01</i>Charcuterie</b></span>' +
    '<span class="bd-fromage"><b><i>Univers 02</i>Fromage</b></span>';
  document.body.appendChild(backdrop);

  dive
    .to([tagline, indicator], { opacity: 0, y: -16, duration: 0.05, ease: "power2.out" }, 0)
    .set([tagline, indicator], { visibility: "hidden" }, 0.06)
    // 1) plongée : le blason grossit jusqu'à envelopper l'écran
    .to(logoHero, { scale: function () { return diveScale(); }, ease: "power2.in", duration: 0.62 }, 0)
    // 2) une fois « dedans », l'image se fond dans le crème…
    .to(logoHero, { opacity: 0, duration: 0.14, ease: "power1.inOut" }, 0.54)
    // 3) …et le crème se retire (iris) : le hall apparaît par les bords puis plein écran
    .fromTo(intro, { "--iris": "150%" }, { "--iris": "0%", ease: "power3.inOut", duration: 0.32 }, 0.68);

  // le backdrop s'efface seulement quand le vrai hall couvre l'écran (raccord invisible)
  ScrollTrigger.create({
    trigger: ".hall", start: "top top",
    onEnter: function () { backdrop.classList.remove("on"); },
    onLeaveBack: function () { backdrop.classList.add("on"); }
  });

  /* ---------- Hall : portails ---------- */
  gsap.utils.toArray(".portal").forEach(function (portal, i) {
    gsap.from(portal.querySelector(".portal-inner"), {
      y: 70, opacity: 0, duration: 1.0, delay: i * 0.12, ease: "power3.out",
      scrollTrigger: { trigger: ".hall", start: "top 40%" }
    });
    gsap.from(portal.querySelector(".portal-bg"), {
      scale: 1.12, duration: 1.6, delay: i * 0.12, ease: "power2.out",
      scrollTrigger: { trigger: ".hall", start: "top 40%" }
    });
  });

  /* ---------- Bandeau histoire ---------- */
  gsap.from(".story-band > *", {
    y: 40, opacity: 0, stagger: 0.12, duration: 0.9, ease: "power3.out",
    scrollTrigger: { trigger: ".story-band", start: "top 75%" }
  });
})();
