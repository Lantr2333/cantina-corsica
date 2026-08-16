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

  /* ---------- Intro parallax au scroll (conteneur ≠ cibles de l'intro) ---------- */
  gsap.to(".intro-inner", {
    y: -70, opacity: 0, scale: 0.98,
    ease: "none",
    scrollTrigger: { trigger: ".intro-panel", start: "top top", end: "75% top", scrub: true }
  });

  /* ---------- Hall : portails ---------- */
  gsap.utils.toArray(".portal").forEach(function (portal, i) {
    gsap.from(portal.querySelector(".portal-inner"), {
      y: 70, opacity: 0, duration: 1.0, delay: i * 0.12, ease: "power3.out",
      scrollTrigger: { trigger: ".hall", start: "top 65%" }
    });
    gsap.from(portal.querySelector(".portal-bg"), {
      scale: 1.12, duration: 1.6, delay: i * 0.12, ease: "power2.out",
      scrollTrigger: { trigger: ".hall", start: "top 65%" }
    });
  });

  /* ---------- Bandeau histoire ---------- */
  gsap.from(".story-band > *", {
    y: 40, opacity: 0, stagger: 0.12, duration: 0.9, ease: "power3.out",
    scrollTrigger: { trigger: ".story-band", start: "top 75%" }
  });
})();
