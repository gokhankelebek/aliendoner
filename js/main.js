/* ================================================================
   ALIEN DÖNER — interactions
   ================================================================ */
(() => {
  "use strict";

  /* ---------- block pinch / double-tap zoom (iOS Safari ignores the
     viewport meta, so we stop the gestures directly) ---------- */
  // Safari-specific pinch gesture events
  ["gesturestart", "gesturechange", "gestureend"].forEach((evt) => {
    document.addEventListener(evt, (e) => e.preventDefault(), { passive: false });
  });
  // Two-finger pinch on touch devices (single-finger scroll stays unaffected)
  document.addEventListener("touchmove", (e) => {
    if (e.touches.length > 1) e.preventDefault();
  }, { passive: false });
  // Double-tap to zoom
  let lastTouchEnd = 0;
  document.addEventListener("touchend", (e) => {
    const now = performance.now();
    if (now - lastTouchEnd <= 300) e.preventDefault();
    lastTouchEnd = now;
  }, { passive: false });

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- starfield canvas ---------- */
  const canvas = document.getElementById("starfield");
  if (canvas && !reduceMotion) {
    const ctx = canvas.getContext("2d");
    let stars = [];
    let shooting = [];
    let w, h, dpr;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(220, Math.floor((w * h) / 6500));
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.3 + 0.3,
        depth: Math.random() * 0.7 + 0.3, // parallax factor
        tw: Math.random() * Math.PI * 2,  // twinkle phase
        twSpeed: Math.random() * 0.03 + 0.008
      }));
    };

    let scrollY = 0;
    window.addEventListener("scroll", () => { scrollY = window.scrollY; }, { passive: true });
    window.addEventListener("resize", resize);
    resize();

    const spawnShootingStar = () => {
      if (document.hidden) return;
      shooting.push({
        x: Math.random() * w * 0.8,
        y: Math.random() * h * 0.35,
        vx: 6 + Math.random() * 5,
        vy: 2.5 + Math.random() * 2,
        life: 1
      });
    };
    setInterval(spawnShootingStar, 7000 + Math.random() * 6000);

    const frame = () => {
      ctx.clearRect(0, 0, w, h);

      for (const s of stars) {
        s.tw += s.twSpeed;
        const alpha = 0.35 + Math.sin(s.tw) * 0.3 + 0.3;
        // parallax: deeper stars scroll slower
        const py = (s.y - scrollY * s.depth * 0.25) % h;
        const y = py < 0 ? py + h : py;
        ctx.beginPath();
        ctx.arc(s.x, y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(226, 232, 255, ${Math.min(alpha, 0.95)})`;
        ctx.fill();
      }

      shooting = shooting.filter((m) => m.life > 0);
      for (const m of shooting) {
        const grad = ctx.createLinearGradient(m.x, m.y, m.x - m.vx * 12, m.y - m.vy * 12);
        grad.addColorStop(0, `rgba(185, 245, 255, ${m.life})`);
        grad.addColorStop(1, "rgba(185, 245, 255, 0)");
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(m.x, m.y);
        ctx.lineTo(m.x - m.vx * 12, m.y - m.vy * 12);
        ctx.stroke();
        m.x += m.vx;
        m.y += m.vy;
        m.life -= 0.02;
      }

      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }

  /* ---------- nav scroll state ---------- */
  const nav = document.getElementById("nav");
  const onScroll = () => nav.classList.toggle("is-scrolled", window.scrollY > 24);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- mobile menu ---------- */
  const burger = document.getElementById("navBurger");
  const navLinks = document.getElementById("navLinks");
  burger.addEventListener("click", () => {
    const open = navLinks.classList.toggle("is-open");
    burger.setAttribute("aria-expanded", String(open));
  });
  navLinks.addEventListener("click", (e) => {
    if (e.target.tagName === "A") {
      navLinks.classList.remove("is-open");
      burger.setAttribute("aria-expanded", "false");
    }
  });

  /* ---------- menu filters ---------- */
  const chips = document.querySelectorAll(".menu-filters .chip");
  const cards = document.querySelectorAll(".menu-grid .card");
  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      chips.forEach((c) => {
        c.classList.toggle("is-active", c === chip);
        c.setAttribute("aria-selected", String(c === chip));
      });
      const filter = chip.dataset.filter;
      cards.forEach((card) => {
        card.classList.toggle("is-hidden", filter !== "all" && card.dataset.cat !== filter);
      });
    });
  });

  /* ---------- reveal on scroll ---------- */
  const revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }

  /* ---------- footer year ---------- */
  document.getElementById("year").textContent = new Date().getFullYear();
})();
