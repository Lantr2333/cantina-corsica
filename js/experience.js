/* A Cantina di Corsica — scroll-driven universe experience (charcuterie / fromage) */
(function () {
  "use strict";

  gsap.registerPlugin(ScrollTrigger);

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var isMobile = window.innerWidth < 768;

  /* ---------- Lenis smooth scroll ---------- */
  var lenis = new Lenis({
    duration: 1.2,
    easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
    smoothWheel: true
  });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
  gsap.ticker.lagSmoothing(0);

  /* ---------- Page config (from <body data-*>) ---------- */
  var FRAMES_PATH = document.body.dataset.framesPath || "frames/";
  var TOTAL_FILES = parseInt(document.body.dataset.framesTotal || "0", 10);
  var FRAME_STEP = isMobile ? 2 : 1;          // mobile loads every 2nd frame (memory cap)
  var FRAME_COUNT = Math.floor(TOTAL_FILES / FRAME_STEP);
  var FRAME_SPEED = 1.9;                      // product animation done by ~53% scroll

  var frames = new Array(FRAME_COUNT);
  var loaded = 0;
  var currentFrame = 0;

  var canvas = document.getElementById("canvas");
  var ctx = canvas.getContext("2d");
  var canvasWrap = document.getElementById("canvas-wrap");
  var loader = document.getElementById("loader");
  var loaderBar = document.getElementById("loader-bar");
  var loaderPercent = document.getElementById("loader-percent");
  var scrollContainer = document.getElementById("scroll-container");
  var heroSection = document.getElementById("hero");

  function frameSrc(i) {
    var file = i * FRAME_STEP + 1;
    if (file > TOTAL_FILES) file = TOTAL_FILES;
    return FRAMES_PATH + "frame_" + String(file).padStart(4, "0") + ".jpg";
  }

  /* ---------- Canvas sizing ---------- */
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  function sizeCanvas() {
    canvas.width = Math.round(window.innerWidth * dpr);
    canvas.height = Math.round(window.innerHeight * dpr);
    drawFrame(currentFrame);
  }
  window.addEventListener("resize", function () { sizeCanvas(); });

  /* ---------- Background color sampling (top edge of frame) ---------- */
  var bgColor = "#17120d";
  var sampleCanvas = document.createElement("canvas");
  var sampleCtx = sampleCanvas.getContext("2d", { willReadFrequently: true });
  function sampleBgColor(img) {
    try {
      sampleCanvas.width = 8; sampleCanvas.height = 8;
      sampleCtx.drawImage(img, 0, 0, img.naturalWidth, Math.max(1, img.naturalHeight * 0.1), 0, 0, 8, 8);
      var d = sampleCtx.getImageData(0, 0, 8, 8).data;
      var r = 0, g = 0, b = 0, n = d.length / 4;
      for (var i = 0; i < d.length; i += 4) { r += d[i]; g += d[i + 1]; b += d[i + 2]; }
      bgColor = "rgb(" + Math.round(r / n) + "," + Math.round(g / n) + "," + Math.round(b / n) + ")";
    } catch (e) { /* keep previous color */ }
  }

  /* ---------- Draw : landscape frames, cover on all viewports ---------- */
  function drawFrame(index) {
    var img = frames[index];
    if (!img) {
      // nearest loaded neighbour (progressive loading)
      for (var k = index - 1; k >= 0; k--) { if (frames[k]) { img = frames[k]; break; } }
      if (!img) return;
    }
    var iw = img.naturalWidth, ih = img.naturalHeight;
    if (iw <= 0 || ih <= 0) return;
    var cw = canvas.width, ch = canvas.height;

    sampleBgColorFromCache(index);
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, cw, ch);

    var scale = Math.max(cw / iw, ch / ih);
    // on very tall (portrait) viewports, soften the crop: pad slightly and blend edges
    if (cw / ch < 0.8) scale *= 1.0; else scale *= 0.96;
    var dw = iw * scale, dh = ih * scale;
    var dx = (cw - dw) / 2, dy = (ch - dh) / 2;
    ctx.drawImage(img, dx, dy, dw, dh);
  }

  // resample bg every ~15 frames while scrubbing (fromage bg drifts black → gold)
  var lastSampled = -99;
  function sampleBgColorFromCache(index) {
    if (Math.abs(index - lastSampled) < 15) return;
    var img = frames[index];
    if (!img) return;
    lastSampled = index;
    sampleBgColor(img);
  }

  /* ---------- Preload ---------- */
  function updateLoader() {
    var pct = Math.round((loaded / FRAME_COUNT) * 100);
    loaderBar.style.width = pct + "%";
    loaderPercent.textContent = pct + "%";
    if (loaded >= FRAME_COUNT) finishLoading();
  }

  var finished = false;
  function finishLoading() {
    if (finished) return;
    finished = true;
    sampleBgColor(frames[0]);
    drawFrame(0);
    loader.classList.add("done");
    introAnimation();
  }

  function loadFrame(i) {
    var img = new Image();
    img.decoding = "async";
    img.onload = function () {
      frames[i] = img;
      loaded++;
      updateLoader();
    };
    img.onerror = function () { loaded++; updateLoader(); };
    img.src = frameSrc(i);
  }

  var head = Math.min(10, FRAME_COUNT);
  for (var i = 0; i < head; i++) loadFrame(i);
  setTimeout(function () {
    for (var j = head; j < FRAME_COUNT; j++) loadFrame(j);
  }, 60);

  /* ---------- Hero intro ---------- */
  function introAnimation() {
    if (reduceMotion) return;
    gsap.from(".hero-heading .word", { y: 90, opacity: 0, stagger: 0.12, duration: 1.1, ease: "power4.out", delay: 0.15 });
    gsap.from(".hero-standalone .section-label", { y: 20, opacity: 0, duration: 0.8, ease: "power3.out", delay: 0.1 });
    gsap.from(".hero-tagline", { y: 30, opacity: 0, duration: 0.9, ease: "power3.out", delay: 0.55 });
  }

  /* ---------- Frame ↔ scroll binding + hero circle wipe ---------- */
  ScrollTrigger.create({
    trigger: scrollContainer,
    start: "top bottom",
    end: "bottom bottom",
    scrub: true,
    onUpdate: function (self) {
      var p = self.progress;

      var accelerated = Math.min(p * FRAME_SPEED, 1);
      var index = Math.min(Math.floor(accelerated * FRAME_COUNT), FRAME_COUNT - 1);
      if (index !== currentFrame) {
        currentFrame = index;
        requestAnimationFrame(function () { drawFrame(currentFrame); });
      }

      heroSection.style.opacity = Math.max(0, 1 - p * 14);
      var wipe = Math.min(1, Math.max(0, (p - 0.005) / 0.055));
      var radius = wipe * 80;
      canvasWrap.style.clipPath = "circle(" + radius + "% at 50% 50%)";
    }
  });

  /* ---------- Sections ---------- */
  var statsSection = document.querySelector(".section-stats");
  var sections = document.querySelectorAll(".scroll-section");
  sections.forEach(function (section) {
    var enter = parseFloat(section.dataset.enter) / 100;
    var leave = parseFloat(section.dataset.leave) / 100;
    if (isNaN(enter) || isNaN(leave)) return;
    var persist = section.dataset.persist === "true";
    var type = section.dataset.animation || "fade-up";

    var mid = (enter + leave) / 2;
    if (persist) {
      section.style.top = "calc(100% - " + Math.round(window.innerHeight / 2) + "px)";
    } else {
      section.style.top = "calc(" + (mid * 100) + "% - " + Math.round(window.innerHeight / 2) + "px)";
    }

    var children = section.querySelectorAll(".section-label, .section-heading, .section-body, .section-note, .cta-button, .text-link, .stat");
    var tl = gsap.timeline({ paused: true });

    switch (type) {
      case "slide-left":
        tl.from(children, { x: -80, opacity: 0, stagger: 0.14, duration: 0.9, ease: "power3.out" }); break;
      case "slide-right":
        tl.from(children, { x: 80, opacity: 0, stagger: 0.14, duration: 0.9, ease: "power3.out" }); break;
      case "scale-up":
        tl.from(children, { scale: 0.85, opacity: 0, stagger: 0.12, duration: 1.0, ease: "power2.out" }); break;
      case "rotate-in":
        tl.from(children, { y: 40, rotation: 3, opacity: 0, stagger: 0.1, duration: 0.9, ease: "power3.out" }); break;
      case "stagger-up":
        tl.from(children, { y: 60, opacity: 0, stagger: 0.15, duration: 0.8, ease: "power3.out" }); break;
      case "clip-reveal":
        tl.from(children, { clipPath: "inset(100% 0 0 0)", opacity: 0, stagger: 0.15, duration: 1.2, ease: "power4.inOut" }); break;
      default:
        tl.from(children, { y: 50, opacity: 0, stagger: 0.12, duration: 0.9, ease: "power3.out" });
    }

    if (reduceMotion) { tl.progress(1); }

    var visible = false;
    ScrollTrigger.create({
      trigger: scrollContainer,
      start: "top bottom",
      end: "bottom bottom",
      scrub: true,
      onUpdate: function (self) {
        var p = self.progress;
        var inRange = p >= enter && (persist ? true : p <= leave);
        if (inRange && !visible) { visible = true; tl.play(); }
        else if (!inRange && visible) {
          visible = false;
          if (!reduceMotion) tl.reverse();
        }
      }
    });
  });

  /* ---------- Counters ---------- */
  var counterPlayed = false;
  function playCounters() {
    if (counterPlayed) return;
    counterPlayed = true;
    document.querySelectorAll(".scroll-section .stat-number").forEach(function (el) {
      var target = parseFloat(el.dataset.value);
      var decimals = parseInt(el.dataset.decimals || "0", 10);
      if (isNaN(target)) return;
      var obj = { v: 0 };
      gsap.to(obj, {
        v: target, duration: 1.8, ease: "power1.out",
        onUpdate: function () { el.textContent = obj.v.toFixed(decimals); }
      });
    });
  }

  /* ---------- Dark overlay (derived from stats section range) ---------- */
  var overlay = document.getElementById("dark-overlay");
  if (overlay && statsSection) {
    var OVERLAY_ENTER = parseFloat(statsSection.dataset.enter) / 100 - 0.01;
    var OVERLAY_LEAVE = parseFloat(statsSection.dataset.leave) / 100 + 0.01;
    var FADE = 0.04;
    ScrollTrigger.create({
      trigger: scrollContainer,
      start: "top bottom",
      end: "bottom bottom",
      scrub: true,
      onUpdate: function (self) {
        var p = self.progress;
        var o = 0;
        if (p >= OVERLAY_ENTER - FADE && p < OVERLAY_ENTER) o = (p - (OVERLAY_ENTER - FADE)) / FADE;
        else if (p >= OVERLAY_ENTER && p <= OVERLAY_LEAVE) o = 1;
        else if (p > OVERLAY_LEAVE && p <= OVERLAY_LEAVE + FADE) o = 1 - (p - OVERLAY_LEAVE) / FADE;
        overlay.style.opacity = (o * 0.92).toFixed(3);
        if (p >= OVERLAY_ENTER) playCounters();
      }
    });
  }

  /* ---------- Marquee ---------- */
  var marquee = document.getElementById("marquee");
  if (marquee) {
    var speed = parseFloat(marquee.dataset.scrollSpeed) || -30;
    var M_IN = parseFloat(marquee.dataset.in || "0.30");
    var M_OUT = parseFloat(marquee.dataset.out || "0.52");
    gsap.to(marquee.querySelector(".marquee-text"), {
      xPercent: speed,
      ease: "none",
      scrollTrigger: { trigger: scrollContainer, start: "top bottom", end: "bottom bottom", scrub: true }
    });
    ScrollTrigger.create({
      trigger: scrollContainer,
      start: "top bottom",
      end: "bottom bottom",
      scrub: true,
      onUpdate: function (self) {
        var p = self.progress;
        var o = 0;
        if (p >= M_IN && p <= M_OUT) {
          var edge = 0.05;
          o = Math.min(1, Math.min((p - M_IN) / edge, (M_OUT - p) / edge));
        }
        marquee.style.opacity = o.toFixed(3);
      }
    });
  }

  /* ---------- Smooth anchor (CTA → produits) ---------- */
  document.querySelectorAll("[data-scroll-to]").forEach(function (a) {
    a.addEventListener("click", function (e) {
      var target = document.querySelector(a.getAttribute("href"));
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target, { offset: -20, duration: 1.6 });
    });
  });

  /* ---------- Products zone reveal ---------- */
  gsap.from(".products-zone .product-card", {
    y: 60, opacity: 0, stagger: 0.1, duration: 0.9, ease: "power3.out",
    scrollTrigger: { trigger: ".products-zone", start: "top 70%" }
  });

  sizeCanvas();
})();
