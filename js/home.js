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
    // facteur pour que le cercle du logo couvre toute la diagonale de l'écran
    var r = logoHero.getBoundingClientRect();
    var d = Math.hypot(window.innerWidth, window.innerHeight);
    return (d / Math.max(1, r.width)) * 1.6;
  }

  var dive = gsap.timeline({
    scrollTrigger: {
      trigger: intro,
      start: "top top",
      end: "+=220%",
      pin: true,
      pinSpacing: true,
      scrub: 0.6,
      anticipatePin: 1,
      onEnter: function () { intro.classList.add("is-diving"); logoHero.classList.add("diving"); backdrop.classList.add("on"); },
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
    .to(logoHero, { scale: function () { return diveScale(); }, ease: "power2.in", duration: 0.66 }, 0)
    // 2) une fois « dedans », l'image se fond dans le crème…
    .to(logoHero, { opacity: 0, duration: 0.14, ease: "power1.inOut" }, 0.56)
    // 3) …et le crème se retire (iris) : le hall apparaît par les bords puis plein écran
    .fromTo(intro, { "--iris": "150%" }, { "--iris": "0%", ease: "power3.inOut", duration: 0.30 }, 0.70);

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
