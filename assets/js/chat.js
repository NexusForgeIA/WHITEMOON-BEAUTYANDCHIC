/* =========================================================================
   Asistente de Beauty and Chic — guion de botones
   Sin IA, sin backend y sin ninguna petición de red: no pide datos, no
   guarda nada (ni cookies ni localStorage). Su única salida es abrir
   WhatsApp con el mensaje ya escrito.
   ========================================================================= */
(() => {
  "use strict";
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const WA = {
    pelu: { num: "34669106695", quien: "Patricia" },
    est: { num: "34633740099", quien: "Rebeca" },
  };
  const MAPA = "https://www.google.com/maps/search/?api=1&query=Calle%20Eduardo%20Chillida%2012%2C%2028981%20Parla";

  /* Una frase por servicio: sin precios y sin promesas de resultado. */
  const AREAS = {
    peluqueria: {
      label: "Peluquería",
      wa: "pelu",
      intro: "En peluquería trabajamos para mujer y para hombre. ¿Qué te interesa?",
      items: [
        { label: "Tratamientos capilares", tema: "tratamientos capilares", txt: "Células madre, reconstructores, ácido hialurónico e hidratantes. En el centro te aconsejan cuál encaja con tu pelo." },
        { label: "Alisados", tema: "alisados", txt: "Alisados para melena larga o corta. Te cuentan qué opción va mejor con tu tipo de pelo." },
        { label: "Coloración", tema: "coloración", txt: "Tinte, mechas o baño de color, trabajados con productos de calidad." },
        { label: "Cortes y peinados", tema: "cortes y peinados", txt: "Cortes clásicos o actuales, peinados para bodas, bautizos y comuniones, y cortes de caballero." },
      ],
    },
    estetica: {
      label: "Estética",
      wa: "est",
      intro: "Tratamientos de estética para mujeres y hombres. ¿Sobre cuál quieres información?",
      items: [
        { label: "Faciales", tema: "tratamientos faciales", txt: "Protocolos adaptados a cada piel: fundamental; específicos Xebo-equilibrium, Sensitive y Alfa-hidroxiácidos; e intensivos Firmezza, Lifting, Ritual luz de Asia y Flash vitaminas." },
        { label: "Corporales", tema: "tratamientos corporales", txt: "Un protocolo a medida tras valorar qué buscas, que puede incluir presoterapia, cavitación, radiofrecuencia o saco-sauna." },
        { label: "Uñas y pestañas", tema: "uñas y pestañas", txt: "Manicura, uñas de gel y de acrílico, y tratamientos para pestañas." },
        { label: "Maquillaje", tema: "maquillaje", txt: "Maquillaje social, de noche, de ceremonia y de novia; permanente y tinte de pestañas, y micropigmentación." },
      ],
    },
    terapias: {
      label: "Terapias",
      wa: "est",
      intro: "Terapias alternativas para relajarte y soltar tensión. ¿Cuál te interesa?",
      items: [
        { label: "Reiki", tema: "reiki", txt: "Práctica japonesa que se hace con las manos. La ofrecemos como relajación, sin fines curativos." },
        { label: "Quiromasaje", tema: "quiromasaje", txt: "Masaje con las manos para trabajar la tensión muscular del día a día." },
        { label: "Masajes descontracturantes", tema: "masajes descontracturantes", txt: "Sesiones centradas en las zonas cargadas por el estrés o las malas posturas." },
      ],
    },
  };

  const panel = document.getElementById("chat");
  const fab = document.getElementById("chat-open");
  if (!panel || !fab) return;
  const log = panel.querySelector(".chat-log");
  const opts = panel.querySelector(".chat-opts");
  const closeBtn = panel.querySelector(".chat-close");
  let opener = null;
  let started = false;
  let timer = null;

  /* ---------- Piezas ---------- */
  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };
  const icon = (id) => {
    const ns = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(ns, "svg");
    svg.setAttribute("aria-hidden", "true");
    const use = document.createElementNS(ns, "use");
    use.setAttribute("href", "#" + id);
    svg.appendChild(use);
    return svg;
  };
  const scrollDown = () => { log.scrollTop = log.scrollHeight; };

  const userSays = (text) => {
    log.appendChild(el("div", "msg user", text));
    scrollDown();
  };

  /* Mensaje del asistente: lista de párrafos. Cada párrafo es texto o
     [texto normal, texto destacado, texto normal…] para poner negritas sin
     usar innerHTML. */
  const botSays = (parts) => {
    const m = el("div", "msg bot");
    parts.forEach((p) => {
      const para = el("p");
      (Array.isArray(p) ? p : [p]).forEach((chunk, i) => {
        para.appendChild(i % 2 ? el("b", null, chunk) : document.createTextNode(chunk));
      });
      m.appendChild(para);
    });
    log.appendChild(m);
    scrollDown();
  };

  /* Opciones: botones de acción o enlaces (WhatsApp, mapa). */
  const setOptions = (list) => {
    opts.textContent = "";
    list.forEach((o) => {
      let n;
      if (o.href) {
        n = el("a", "opt" + (o.cls ? " " + o.cls : ""));
        n.href = o.href;
        n.target = "_blank";
        n.rel = "noopener";
      } else {
        n = el("button", "opt" + (o.cls ? " " + o.cls : ""));
        n.type = "button";
        n.addEventListener("click", o.run);
      }
      if (o.icon) n.appendChild(icon(o.icon));
      n.appendChild(document.createTextNode(o.label));
      opts.appendChild(n);
    });
    /* Tras cada paso el foco va a la primera opción nueva: con teclado no
       hay que volver a buscarla. */
    if (panel.classList.contains("open")) {
      const first = opts.querySelector(".opt");
      if (first) first.focus({ preventScroll: true });
    }
  };

  /* El asistente "escribe" un instante antes de contestar. Con movimiento
     reducido, responde al momento. */
  const reply = (fn) => {
    clearTimeout(timer);
    opts.textContent = "";
    if (reduced) { fn(); return; }
    const t = el("div", "typing");
    t.setAttribute("aria-hidden", "true");
    t.append(el("span"), el("span"), el("span"));
    log.appendChild(t);
    scrollDown();
    timer = setTimeout(() => { t.remove(); fn(); }, 450);
  };

  const homeOpt = { label: "Volver al inicio", icon: "ic-home", cls: "opt--quiet", run: () => { userSays("Volver al inicio"); reply(home); } };

  /* ---------- Pasos del guion ---------- */
  function home() {
    botSays(["¿Sobre qué quieres información?"]);
    setOptions([
      ...Object.keys(AREAS).map((k) => ({ label: AREAS[k].label, run: () => goArea(k, true) })),
      { label: "Horario y dirección", icon: "ic-clock", run: () => { userSays("Horario y dirección"); reply(horario); } },
    ]);
  }

  function goArea(key, echo) {
    if (echo) userSays(AREAS[key].label);
    reply(() => area(key));
  }

  function area(key) {
    const a = AREAS[key];
    botSays([a.intro]);
    setOptions([
      ...a.items.map((it) => ({ label: it.label, run: () => { userSays(it.label); reply(() => servicio(key, it)); } })),
      homeOpt,
    ]);
  }

  function servicio(key, it) {
    const a = AREAS[key];
    const c = WA[a.wa];
    const texto = "Hola, quiero información sobre " + it.tema;
    botSays([it.txt, ["Te atiende ", c.quien, " por WhatsApp."]]);
    setOptions([
      { label: "Pedir cita por WhatsApp", icon: "ic-wa", cls: "opt--main", href: "https://wa.me/" + c.num + "?text=" + encodeURIComponent(texto) },
      { label: "Ver más de " + a.label.toLowerCase(), icon: "ic-back", run: () => { userSays("Ver más de " + a.label.toLowerCase()); reply(() => area(key)); } },
      homeOpt,
    ]);
  }

  function horario() {
    botSays([
      ["", "Horario"],
      "Martes a viernes: 10:00–20:00",
      "Sábado: 9:30–14:00",
      "Domingo y lunes: cerrado",
      ["", "Dirección", ": Calle Eduardo Chillida, 12 · 28981 Parla (Madrid)"],
    ]);
    setOptions([
      { label: "Ver en el mapa", icon: "ic-pin", cls: "opt--main", href: MAPA },
      homeOpt,
    ]);
  }

  function start() {
    log.textContent = "";
    botSays(["Hola, soy el asistente de Beauty and Chic. Te oriento sobre los servicios y te paso con quien te puede dar cita."]);
    home();
    started = true;
  }

  /* ---------- Abrir y cerrar ---------- */
  function open(areaKey, from) {
    opener = from || document.activeElement;
    panel.inert = false;
    panel.classList.add("open");
    fab.hidden = true;
    fab.setAttribute("aria-expanded", "true");
    if (!started) start();
    if (areaKey && AREAS[areaKey]) {
      clearTimeout(timer);
      log.querySelectorAll(".typing").forEach((n) => n.remove());
      userSays(AREAS[areaKey].label);
      area(areaKey);
    } else {
      const first = opts.querySelector(".opt") || closeBtn;
      first.focus({ preventScroll: true });
    }
  }

  function close() {
    panel.classList.remove("open");
    panel.inert = true;
    fab.hidden = false;
    fab.setAttribute("aria-expanded", "false");
    const visible = (n) => n && document.contains(n) && (n.checkVisibility ? n.checkVisibility({ visibilityProperty: true }) : n.offsetParent !== null);
    const back = visible(opener) ? opener : fab;
    back.focus({ preventScroll: true });
  }

  fab.setAttribute("aria-expanded", "false");
  fab.addEventListener("click", () => open(null, fab));
  closeBtn.addEventListener("click", close);
  panel.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { e.stopPropagation(); close(); }
  });

  /* Todos los "Pedir cita" de la web abren el asistente. data-chat="peluqueria"
     (o estetica / terapias) entra directo en esa área. */
  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-chat]");
    if (!t) return;
    e.preventDefault();
    open(t.getAttribute("data-chat") || null, t);
  });
})();
