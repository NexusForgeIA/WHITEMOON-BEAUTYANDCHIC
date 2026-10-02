/* =========================================================================
   Beauty and Chic — interacciones
   Sin librerías externas. Respeta prefers-reduced-motion.
   ========================================================================= */
(() => {
  "use strict";
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  /* ---------- Scroll: un solo listener, agrupado en rAF ---------- */
  const nav = $("#nav");
  const onScrollFns = [];
  let ticking = false;
  window.addEventListener(
    "scroll",
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        onScrollFns.forEach((fn) => fn(y));
        ticking = false;
      });
    },
    { passive: true }
  );
  if (nav) onScrollFns.push((y) => nav.classList.toggle("scrolled", y > 20));

  /* ---------- Menú móvil ---------- */
  const burger = $("#burger");
  const menu = $("#mobileMenu");
  if (burger && menu) {
    const setMenu = (open) => {
      menu.classList.toggle("open", open);
      burger.setAttribute("aria-expanded", String(open));
      burger.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
      document.body.style.overflow = open ? "hidden" : "";
    };
    burger.addEventListener("click", () => setMenu(!menu.classList.contains("open")));
    $$("a, .btn", menu).forEach((el) => el.addEventListener("click", () => setMenu(false)));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && menu.classList.contains("open")) {
        setMenu(false);
        burger.focus();
      }
    });
  }

  /* ---------- Scroll-spy del nav: "la última sección rebasada" ---------- */
  const spy = $$("#navLinks a");
  const sections = spy.map((a) => $(a.getAttribute("href"))).filter(Boolean);
  if (spy.length && sections.length) {
    let marks = [];
    let last = null;
    const measure = () => {
      marks = sections.map((s) => ({ id: s.id, top: s.offsetTop - 180 }));
    };
    const sync = (y) => {
      let current = null;
      for (let i = 0; i < marks.length; i++) if (y >= marks[i].top) current = marks[i].id;
      if (current === last) return;
      last = current;
      spy.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "#" + current));
    };
    const remeasure = () => { measure(); last = undefined; sync(window.scrollY); };
    requestAnimationFrame(remeasure);
    onScrollFns.push(sync);
    window.addEventListener("load", () => requestAnimationFrame(remeasure));
    let rt;
    window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(remeasure, 150); }, { passive: true });
  }

  /* ---------- Marquee: duplicar para bucle continuo ---------- */
  const marquee = $("#marquee");
  if (marquee && !reduced) marquee.innerHTML += marquee.innerHTML;

  /* ---------- Palabra rotativa del hero ---------- */
  const rot = $("#rotWord");
  if (rot && !reduced) {
    const words = ["peluquería", "estética", "uñas y pestañas", "maquillaje", "reiki y masajes"];
    let i = 0;
    setInterval(() => {
      rot.classList.add("out");
      setTimeout(() => {
        i = (i + 1) % words.length;
        rot.textContent = words[i];
        rot.classList.remove("out");
      }, 420);
    }, 2600);
  }

  /* ---------- Reveal al hacer scroll ---------- */
  const reveals = $$(".reveal");
  if (reveals.length && "IntersectionObserver" in window && !reduced) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e, n) => {
          if (!e.isIntersecting) return;
          e.target.style.transitionDelay = Math.min(n * 70, 280) + "ms";
          e.target.classList.add("in");
          io.unobserve(e.target);
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -6% 0px" }
    );
    reveals.forEach((el) => io.observe(el));

    /* Al entrar por un ancla o restaurar el scroll, lo que queda por encima
       nunca interseca: se revela de golpe lo que ya está en pantalla o antes. */
    const revealPasados = () => {
      const limite = window.innerHeight * 0.94;
      const pendientes = reveals.filter((el) => !el.classList.contains("in"));
      const tops = pendientes.map((el) => el.getBoundingClientRect().top);
      pendientes.forEach((el, i) => {
        if (tops[i] < limite) {
          el.style.transitionDelay = "0ms";
          el.classList.add("in");
          io.unobserve(el);
        }
      });
    };
    requestAnimationFrame(revealPasados);
    window.addEventListener("load", () => requestAnimationFrame(revealPasados));
    window.addEventListener("hashchange", () => setTimeout(revealPasados, 420));
  } else {
    reveals.forEach((el) => el.classList.add("in"));
  }
})();
