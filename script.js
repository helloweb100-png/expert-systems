/* ==========================================================================
   EXPERT SYSTEM · «NÚCLEO» — script.js (vanilla, sin librerías)
   Un solo bucle requestAnimationFrame. Lecturas de layout primero, escrituras después.
   Todo el contenido es visible si algo falla: los estados ocultos viven bajo html.js
   y cada revelado tiene respaldo por geometría.
   ========================================================================== */

/* ÚNICA fuente del número de WhatsApp. Formato: 52 + 10 dígitos (ej. "52" y luego el número).
   Mientras esté vacío, el botón flotante y el formulario se ocultan y los CTA llevan a #visitanos. */
const WHATSAPP_NUMBER = "";

(() => {
  'use strict';

  const root = document.documentElement;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const rmQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const fineQuery = window.matchMedia('(pointer: fine)');
  const RM = rmQuery.matches;
  const FINE = fineQuery.matches;

  root.classList.add('js', 'js-ok');
  if (RM) root.classList.add('rm');

  /* ------------------------------------------------------------------ WhatsApp */
  const waDigits = String(WHATSAPP_NUMBER).replace(/\D/g, '');
  const waNumber = waDigits.length === 10 ? '52' + waDigits : waDigits;
  const HAS_WA = waNumber.length >= 12;
  const waUrl = (msg) => `https://wa.me/${waNumber}?text=${encodeURIComponent(msg)}`;

  if (HAS_WA) {
    root.classList.remove('no-wa');
    $$('[data-cta]').forEach((a) => {
      a.href = waUrl(a.dataset.msg || 'Hola Expert System, quiero más información.');
      a.target = '_blank';
      a.rel = 'noopener';
    });
    const f = $('#waFloat');
    if (f) { f.href = waUrl('Hola Expert System, quiero más información.'); }
    const bubble = $('#waBubble');
    if (bubble && !RM) {
      setTimeout(() => { bubble.classList.add('show'); setTimeout(() => bubble.classList.remove('show'), 5200); }, 6000);
    }
  }

  /* ------------------------------------------------------------------ Cargador */
  const loader = $('#loader');
  function openLoader() {
    if (!loader || loader.classList.contains('is-done')) return;
    loader.classList.add('is-done');
    root.classList.add('is-ready');
    setTimeout(() => loader.classList.add('is-hidden'), 750);
  }
  (function runLoader() {
    if (!loader) { root.classList.add('is-ready'); return; }
    const pct = $('#ldPct');
    const lines = $$('.ld__line', loader);
    if (RM) {
      lines.forEach((l) => l.classList.add('on'));
      if (pct) pct.textContent = '100%';
      setTimeout(openLoader, 200);
      return;
    }
    const t0 = performance.now();
    const dur = 1400;
    (function step(now) {
      const p = clamp((now - t0) / dur);
      if (pct) pct.textContent = Math.round(p * 100) + '%';
      if (p < 1) requestAnimationFrame(step);
    })(t0);
    lines.forEach((l, i) => setTimeout(() => l.classList.add('on'), 150 + i * 400));
    setTimeout(openLoader, 1650);
    setTimeout(openLoader, 1900); // tope duro
  })();

  /* ------------------------------------------------------------------ Estado vivo (horario) */
  const SCHEDULE = { 0: null, 1: [11, 19], 2: [11, 19], 3: [11, 19], 4: [11, 19], 5: [11, 19], 6: [11, 16] };
  const DAY_NAMES = ['el domingo', 'el lunes', 'el martes', 'el miércoles', 'el jueves', 'el viernes', 'el sábado'];
  const dtf = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Mexico_City', weekday: 'short', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' });
  const WD = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const pad = (n) => String(n).padStart(2, '0');

  function nowMX() {
    const parts = dtf.formatToParts(new Date());
    const g = (t) => (parts.find((p) => p.type === t) || {}).value;
    return { day: WD[g('weekday')] ?? new Date().getDay(), minutes: (parseInt(g('hour'), 10) % 24) * 60 + parseInt(g('minute'), 10) };
  }
  function statusInfo() {
    const { day, minutes } = nowMX();
    const today = SCHEDULE[day];
    if (today && minutes >= today[0] * 60 && minutes < today[1] * 60) {
      return { open: true, day, text: `Abierto ahora · cierra a las ${pad(today[1])}:00` };
    }
    let text;
    if (today && minutes < today[0] * 60) {
      text = `Cerrado ahora · abrimos hoy a las ${pad(today[0])}:00`;
    } else {
      let d = 1, next = null;
      for (; d <= 7; d++) { next = SCHEDULE[(day + d) % 7]; if (next) break; }
      const when = d === 1 ? 'mañana' : DAY_NAMES[(day + d) % 7];
      text = `Cerrado ahora · abrimos ${when} a las ${pad(next ? next[0] : 11)}:00`;
    }
    return { open: false, day, text };
  }
  function updateStatus() {
    const s = statusInfo();
    $$('[data-status]').forEach((el) => { el.textContent = s.text; });
    $$('[data-dot]').forEach((el) => el.classList.toggle('is-closed', !s.open));
    $$('.hours tr').forEach((tr) => {
      const days = (tr.dataset.days || '').split(',').map(Number);
      tr.classList.toggle('is-today', days.includes(s.day));
    });
  }
  updateStatus();
  setInterval(updateStatus, 60000);

  /* ------------------------------------------------------------------ Menú móvil */
  const burger = $('#burger');
  const menu = $('#menu');
  function setMenu(open) {
    if (!burger || !menu) return;
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    menu.classList.toggle('open', open);
    menu.setAttribute('aria-hidden', String(!open));
    root.classList.toggle('menu-open', open);
  }
  if (burger) {
    burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
    $$('a', menu).forEach((a) => a.addEventListener('click', () => setMenu(false)));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
    window.addEventListener('resize', () => { if (innerWidth >= 1100) setMenu(false); });
  }

  /* ------------------------------------------------------------------ Riel de secciones */
  const SECS = $$('main > section[id]');
  const rail = $('#rail');
  const railLinks = [];
  if (rail) {
    SECS.forEach((s) => {
      const a = document.createElement('a');
      a.href = '#' + s.id;
      a.dataset.label = s.dataset.label || s.id;
      a.setAttribute('aria-label', 'Ir a ' + (s.dataset.label || s.id));
      rail.appendChild(a);
      railLinks.push(a);
    });
  }

  /* ------------------------------------------------------------------ Bucle maestro */
  const readers = [];      // cada lector devuelve una función de escritura (o null)
  const anims = [];        // (t, dt) por frame
  let dirty = true;
  let lastT = 0;
  const markDirty = () => { dirty = true; };
  window.addEventListener('scroll', markDirty, { passive: true });
  window.addEventListener('resize', markDirty);

  function frame(t) {
    const dt = Math.min(0.05, (t - lastT) / 1000 || 0.016);
    lastT = t;
    if (dirty) {
      dirty = false;
      const ctx = { vh: window.innerHeight, vw: window.innerWidth, y: window.scrollY };
      const writers = [];
      for (const r of readers) { const w = r(ctx); if (w) writers.push(w); }
      for (const w of writers) w(ctx);
    }
    for (const a of anims) a(t, dt);
    requestAnimationFrame(frame);
  }

  /* ------------------------------------------------------------------ Revelados + respaldo por geometría */
  const revealables = $$('[data-reveal]');
  let pending = new Set(revealables);
  const reveal = (el) => { el.classList.add('in'); pending.delete(el); if (io) io.unobserve(el); };
  let io = null;
  if ('IntersectionObserver' in window) {
    io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) reveal(e.target); });
    }, { threshold: 0.05, rootMargin: '0px 0px -4% 0px' });
    revealables.forEach((el) => io.observe(el));
  }
  function revealByGeometry(vh, vw) {
    if (!pending.size) return;
    pending.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.bottom > 0 && r.top < vh * 0.97 && r.right > 0 && r.left < vw) reveal(el);
    });
  }
  readers.push((c) => { revealByGeometry(c.vh, c.vw); return null; });
  window.addEventListener('load', () => setTimeout(() => { revealByGeometry(innerHeight, innerWidth); }, 2000));
  setTimeout(() => { revealByGeometry(innerHeight, innerWidth); markDirty(); }, 2200);

  /* ------------------------------------------------------------------ Progreso, encabezado, riel */
  const bar = $('#progressBar');
  const hdr = $('#hdr');
  readers.push((c) => {
    const max = Math.max(1, root.scrollHeight - c.vh);
    const prog = clamp(c.y / max);
    let active = 0;
    for (let i = 0; i < SECS.length; i++) { if (SECS[i].getBoundingClientRect().top <= c.vh * 0.4) active = i; }
    return () => {
      if (bar) bar.style.transform = `scaleX(${prog.toFixed(4)})`;
      if (hdr) hdr.classList.toggle('is-compact', c.y > 80);
      railLinks.forEach((a, i) => a.classList.toggle('on', i === active));
    };
  });

  /* ------------------------------------------------------------------ Manifiesto: palabras que se encienden */
  (function manifesto() {
    const sec = $('#manifiesto');
    const text = $('#mText');
    if (!sec || !text) return;
    const words = [];
    function splitNode(node, isKw) {
      Array.from(node.childNodes).forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            const s = document.createElement('span');
            s.className = 'w' + (isKw ? ' w--kw' : '');
            s.textContent = part;
            frag.appendChild(s);
            words.push(s);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) {
          splitNode(n, isKw || n.classList.contains('kw'));
        }
      });
    }
    splitNode(text, false);
    const N = words.length;
    const cache = new Array(N).fill(-1);
    const dots = $('#dotgrid');
    readers.push((c) => {
      const r = sec.getBoundingClientRect();
      const p = clamp(-r.top / Math.max(1, r.height - c.vh));
      return () => {
        const span = 0.62; // el texto se completa hacia el 70% del recorrido
        words.forEach((w, i) => {
          const start = (i / N) * span;
          const o = 0.18 + 0.82 * clamp((p * 1 - start) / 0.06);
          const q = Math.round(o * 50);
          if (q !== cache[i]) {
            cache[i] = q;
            w.style.opacity = o.toFixed(2);
            if (w.classList.contains('w--kw')) w.classList.toggle('lit', o > 0.95);
          }
        });
        if (dots) dots.style.setProperty('--bgy', (p * -120).toFixed(1) + 'px');
      };
    });
  })();

  /* Count-up de estadísticas */
  (function counters() {
    const els = $$('[data-count]');
    if (!els.length) return;
    const run = (el) => {
      const end = parseInt(el.dataset.count, 10);
      if (RM) { el.textContent = end; return; }
      const t0 = performance.now();
      (function step(now) {
        const p = clamp((now - t0) / 1300);
        el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(step);
      })(t0);
    };
    if ('IntersectionObserver' in window) {
      const o = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { run(e.target); o.unobserve(e.target); } }), { threshold: 0.6 });
      els.forEach((el) => o.observe(el));
    }
  })();

  /* ------------------------------------------------------------------ Servicios: pin horizontal */
  (function services() {
    const sv = $('#servicios');
    const track = $('#track');
    if (!sv || !track) return;
    const panels = $$('.panel', track);
    const segs = $$('.seg', sv);
    const segName = $('#svName');
    const NAMES = ['Introducción', 'Soporte y reparación de computadoras', 'Electrónica de todos los días', 'Redes y proyectos', 'Domótica', 'Licencias y protección', 'Accesorios y micas'];
    let pinOn = false, travel = 0, lefts = [], widths = [], lastActive = -1;

    function setActive(i) {
      if (i === lastActive) return;
      lastActive = i;
      segs.forEach((s, k) => s.classList.toggle('on', k <= i));
      if (segName) segName.textContent = NAMES[i] || '';
    }
    function layout() {
      pinOn = innerWidth >= 900 && !rmQuery.matches;
      sv.classList.toggle('is-pin', pinOn);
      track.style.transform = '';
      if (pinOn) {
        travel = Math.max(0, track.offsetWidth - innerWidth);
        sv.style.height = (travel + innerHeight) + 'px';
        lefts = panels.map((p) => p.offsetLeft);
        widths = panels.map((p) => p.offsetWidth);
      } else {
        sv.style.height = '';
        panels.forEach((p) => { p.style.removeProperty('--px'); p.classList.add('in'); });
      }
      markDirty();
    }
    layout();
    window.addEventListener('resize', layout);
    window.addEventListener('load', layout);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);

    readers.push((c) => {
      if (pinOn) {
        const r = sv.getBoundingClientRect();
        const p = clamp(-r.top / Math.max(1, r.height - c.vh));
        return () => {
          track.style.transform = `translate3d(${(-p * travel).toFixed(1)}px,0,0)`;
          panels.forEach((pn, i) => {
            const cx = lefts[i] + widths[i] / 2 - p * travel;
            pn.style.setProperty('--px', clamp((cx - c.vw / 2) / c.vw, -1, 1).toFixed(3));
          });
          setActive(Math.round(p * (panels.length - 1)));
        };
      }
      return null;
    });

    // Modo carrusel (móvil / reduced motion): activo según scroll horizontal
    track.addEventListener('scroll', () => {
      if (pinOn) return;
      const mid = track.scrollLeft + track.clientWidth / 2;
      let best = 0, bd = 1e9;
      panels.forEach((p, i) => { const d = Math.abs(p.offsetLeft + p.offsetWidth / 2 - mid); if (d < bd) { bd = d; best = i; } });
      setActive(best);
      markDirty();
    }, { passive: true });
    setActive(0);
  })();

  /* ------------------------------------------------------------------ Imagen que se abre */
  (function frameOpen() {
    const sec = $('#pantallas');
    const frameEl = $('#frame');
    const giant = $('#giant');
    const text = $('#frameText');
    if (!sec || !frameEl) return;
    readers.push((c) => {
      const r = sec.getBoundingClientRect();
      const p = clamp(-r.top / Math.max(1, r.height - c.vh));
      return () => {
        if (RM) return;
        const mobile = c.vw < 768;
        const q = clamp(p / 0.6);
        const e = q * q * (3 - 2 * q);
        const w0 = mobile ? c.vw * 0.72 : c.vw * 0.36;
        const h0 = mobile ? c.vh * 0.4 : c.vh * 0.52;
        frameEl.style.setProperty('--w', lerp(w0, c.vw, e).toFixed(1) + 'px');
        frameEl.style.setProperty('--h', lerp(h0, c.vh, e).toFixed(1) + 'px');
        frameEl.style.setProperty('--r', lerp(28, 0, e).toFixed(1) + 'px');
        const t = clamp((p - 0.6) / 0.3);
        frameEl.style.setProperty('--t', t.toFixed(3));
        if (text) text.classList.toggle('is-on', t > 0.35);
        if (giant) giant.style.setProperty('--gx', lerp(c.vw * 0.18, -c.vw * 0.9, p).toFixed(1));
      };
    });
  })();

  /* ------------------------------------------------------------------ Protocolo: traza PCB */
  (function protocolo() {
    const steps = $('#steps');
    const svg = $('#traceSvg');
    const live = $('#traceLive');
    const base = $('#traceBase');
    const dot = $('#traceDot');
    const pinsRow = $('.pinrow');
    if (pinsRow) {
      for (let i = 0; i < 24; i++) { const s = document.createElement('i'); s.style.setProperty('--n', i); pinsRow.appendChild(s); }
    }
    if (!steps || !svg || !live) return;
    const stepEls = $$('.step', steps);
    let H = 0, len = 0, nodeY = [];

    function build() {
      H = steps.offsetHeight;
      svg.setAttribute('height', H);
      svg.setAttribute('viewBox', `0 0 40 ${H}`);
      let d = 'M20 0';
      const jogs = 5;
      for (let i = 1; i <= jogs; i++) {
        const y = (H * i) / (jogs + 1);
        d += ` V${(y - 14).toFixed(1)} L28 ${(y - 6).toFixed(1)} V${(y + 22).toFixed(1)} L20 ${(y + 30).toFixed(1)}`;
      }
      d += ` V${H}`;
      live.setAttribute('d', d);
      base.setAttribute('d', d);
      len = live.getTotalLength();
      live.style.strokeDasharray = len;
      live.style.strokeDashoffset = RM ? 0 : len;
      const sr = steps.getBoundingClientRect();
      nodeY = stepEls.map((s) => { const n = $('.step__node', s).getBoundingClientRect(); return n.top - sr.top + n.height / 2; });
      markDirty();
    }
    build();
    window.addEventListener('resize', build);
    window.addEventListener('load', build);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(build);

    readers.push((c) => {
      const r = steps.getBoundingClientRect();
      const p = RM ? 1 : clamp((c.vh * 0.62 - r.top) / Math.max(1, r.height));
      return () => {
        if (!len) return;
        live.style.strokeDashoffset = (len * (1 - p)).toFixed(1);
        const pt = live.getPointAtLength(len * p);
        dot.style.left = pt.x + 'px';
        dot.style.top = pt.y + 'px';
        dot.classList.toggle('on', p > 0.005 && p < 0.995);
        stepEls.forEach((s, i) => s.classList.toggle('lit', pt.y >= nodeY[i] - 2 && p > 0.005));
      };
    });
  })();

  /* ------------------------------------------------------------------ Taller: parallax de columnas */
  (function gallery() {
    const sec = $('#taller');
    const cols = $$('#gallery .col');
    if (!sec || !cols.length || RM) return;
    readers.push((c) => {
      const r = sec.getBoundingClientRect();
      if (r.bottom < -200 || r.top > c.vh + 200) return null;
      const off = c.vh / 2 - (r.top + r.height / 2);
      const k = c.vw < 768 ? 0.5 : 1;
      return () => {
        cols.forEach((col) => {
          const sp = parseFloat(col.dataset.speed || '0');
          col.style.transform = `translate3d(0,${(off * sp * k).toFixed(1)}px,0)`;
        });
      };
    });
  })();

  /* ------------------------------------------------------------------ Diferencia: tarjetas apiladas */
  (function stack() {
    const cards = $$('#stack .scard');
    if (cards.length < 2) return;
    const inners = cards.map((c) => $('.scard__in', c));
    readers.push((c) => {
      const rects = cards.map((el) => el.getBoundingClientRect());
      return () => {
        cards.forEach((el, i) => {
          let d = 0;
          const next = rects[i + 1];
          if (next) {
            const h = rects[i].height || 1;
            const gap = next.top - rects[i].top;
            d = clamp((h - gap) / h);
          }
          inners[i].style.transform = `scale(${(1 - 0.04 * d).toFixed(4)})`;
          inners[i].style.setProperty('--dim', (d * 0.5).toFixed(3));
        });
      };
    });
  })();

  /* Mica de hidrogel: película ligada al scroll */
  (function mica() {
    const el = $('.micafx');
    if (!el || RM) return;
    readers.push((c) => {
      const r = el.getBoundingClientRect();
      if (r.bottom < -100 || r.top > c.vh + 100) return null;
      const m = clamp(((r.top + r.height / 2) - c.vh / 2) / c.vh, -1, 1);
      return () => {
        el.style.setProperty('--mica', (-m).toFixed(3));
        el.style.setProperty('--mica-l', (1 - Math.abs(m)).toFixed(3));
      };
    });
  })();

  /* Palabra gigante del pie */
  (function footer() {
    const w = $('#footWord');
    if (!w) return;
    readers.push((c) => {
      const r = w.getBoundingClientRect();
      if (r.top > c.vh + 100) return null;
      const p = RM ? 1 : clamp((c.vh - r.top) / (c.vh * 0.45));
      return () => w.style.setProperty('--fill', (p * 100).toFixed(1) + '%');
    });
  })();

  /* ------------------------------------------------------------------ Campo de trazas (canvas) */
  class TraceField {
    constructor(canvas, opts) {
      this.c = canvas;
      this.ctx = canvas.getContext('2d');
      this.opts = opts;
      this.visible = true;
      this.ox = 0; this.oy = 0; this.tx = 0; this.ty = 0;
      this.w = 0; this.h = 0;
      this.paths = [];
      this.packets = [];
      this.resize();
    }
    resize() {
      const mobile = innerWidth < 768;
      const dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2);
      const r = this.c.getBoundingClientRect();
      const w = Math.max(1, Math.round(r.width)), h = Math.max(1, Math.round(r.height));
      if (this.w === w && Math.abs(this.h - h) < 120 && this.dpr === dpr) return;
      this.w = w; this.h = h; this.dpr = dpr;
      this.c.width = Math.round(w * dpr);
      this.c.height = Math.round(h * dpr);
      this.build(mobile);
      this.drawStatic();
      if (RM) this.draw(0);
    }
    build(mobile) {
      const G = 40, M = 30;
      const cols = Math.ceil(this.w / G), rows = Math.ceil(this.h / G);
      const count = mobile ? this.opts.mobile : this.opts.desktop;
      const cx = Math.round(cols / 2), cy = Math.round(rows / 2);
      const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
      this.paths = [];
      for (let n = 0; n < count; n++) {
        // punto de salida en un borde
        let x, y; const side = rnd(0, 3);
        if (side === 0) { x = rnd(0, cols); y = 0; }
        else if (side === 1) { x = cols; y = rnd(0, rows); }
        else if (side === 2) { x = rnd(0, cols); y = rows; }
        else { x = 0; y = rnd(0, rows); }
        const pts = [[x, y]];
        const steps = rnd(5, 10);
        for (let s = 0; s < steps; s++) {
          const dx = Math.sign(cx - x), dy = Math.sign(cy - y);
          if (!dx && !dy) break;
          const mode = Math.random();
          let seg = rnd(2, 6);
          if (mode < 0.35 && dx && dy) { // diagonal 45°
            const k = Math.min(seg, Math.abs(cx - x), Math.abs(cy - y)) || 1;
            x += dx * k; y += dy * k;
          } else if ((mode < 0.7 && dx) || !dy) {
            x += dx * Math.min(seg, Math.abs(cx - x) || seg);
          } else {
            y += dy * Math.min(seg, Math.abs(cy - y) || seg);
          }
          pts.push([x, y]);
          // detenerse al acercarse al centro para no saturar el núcleo
          if (Math.abs(cx - x) + Math.abs(cy - y) < (mobile ? 5 : 9) && s > 2) break;
        }
        if (pts.length < 3) continue;
        const P = pts.map(([px, py]) => [px * G, py * G]);
        const cum = [0];
        for (let i = 1; i < P.length; i++) cum.push(cum[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
        const total = cum[cum.length - 1];
        this.paths.push({ P, cum, total, alpha: 0.1 + Math.random() * 0.06 });
        const np = this.opts.packets || 1;
        for (let k = 0; k < np; k++) {
          this.packets.push({ path: this.paths[this.paths.length - 1], d: Math.random() * total, v: 60 + Math.random() * 80 });
        }
      }
      this.packets = this.packets.filter((p) => this.paths.includes(p.path));
      this.G = G; this.M = M;
    }
    drawStatic() {
      const M = this.M;
      const off = document.createElement('canvas');
      off.width = Math.round((this.w + M * 2) * this.dpr);
      off.height = Math.round((this.h + M * 2) * this.dpr);
      const o = off.getContext('2d');
      o.scale(this.dpr, this.dpr);
      o.translate(M, M);
      o.lineJoin = 'round'; o.lineCap = 'round';
      this.paths.forEach((pa) => {
        o.strokeStyle = `rgba(62,175,184,${pa.alpha})`;
        o.lineWidth = 1.4;
        o.beginPath();
        pa.P.forEach(([x, y], i) => (i ? o.lineTo(x, y) : o.moveTo(x, y)));
        o.stroke();
        o.lineWidth = 1;
        o.strokeStyle = `rgba(123,232,238,${pa.alpha + 0.08})`;
        for (let i = 1; i < pa.P.length - 1; i++) { o.beginPath(); o.arc(pa.P[i][0], pa.P[i][1], 2.6, 0, 6.2832); o.stroke(); }
        const e = pa.P[pa.P.length - 1];
        o.beginPath(); o.arc(e[0], e[1], 4, 0, 6.2832); o.stroke();
      });
      this.off = off;
    }
    pos(pa, d) {
      const { P, cum } = pa;
      let i = 1;
      while (i < cum.length - 1 && cum[i] < d) i++;
      const seg = cum[i] - cum[i - 1] || 1;
      const t = clamp((d - cum[i - 1]) / seg);
      return [lerp(P[i - 1][0], P[i][0], t), lerp(P[i - 1][1], P[i][1], t)];
    }
    draw(dt) {
      const ctx = this.ctx, M = this.M;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, this.c.width, this.c.height);
      ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      this.ox = lerp(this.ox, this.tx, 0.05); this.oy = lerp(this.oy, this.ty, 0.05);
      ctx.drawImage(this.off, 0, 0, this.off.width, this.off.height, -M + this.ox, -M + this.oy, this.w + M * 2, this.h + M * 2);
      ctx.globalCompositeOperation = 'lighter';
      ctx.translate(this.ox, this.oy);
      for (const pk of this.packets) {
        pk.d += pk.v * dt;
        if (pk.d > pk.path.total + 60) pk.d = -Math.random() * 120;
        for (let k = 0; k < 9; k++) {
          const dd = pk.d - k * 7;
          if (dd < 0 || dd > pk.path.total) continue;
          const [x, y] = this.pos(pk.path, dd);
          const a = (1 - k / 9);
          ctx.fillStyle = `rgba(123,232,238,${(a * 0.85).toFixed(3)})`;
          ctx.beginPath(); ctx.arc(x, y, 2.6 - k * 0.2, 0, 6.2832); ctx.fill();
        }
      }
      ctx.globalCompositeOperation = 'source-over';
    }
    point(nx, ny, amp) { this.tx = nx * amp; this.ty = ny * amp; }
  }

  const fields = [];
  function mountField(sel, opts, hostSel) {
    const canvas = $(sel);
    if (!canvas || !canvas.getContext) return null;
    const tf = new TraceField(canvas, opts);
    const host = $(hostSel) || canvas.parentElement;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((es) => { tf.visible = es[0].isIntersecting; }, { threshold: 0 }).observe(host);
    }
    if (!RM) anims.push((t, dt) => { if (tf.visible && !document.hidden) tf.draw(dt); });
    fields.push(tf);
    return tf;
  }
  const heroField = mountField('#traces', { desktop: 28, mobile: 14, packets: 1 }, '#inicio');
  mountField('#tracesB', { desktop: 10, mobile: 6, packets: 1 }, '#contacto');
  let rzT = 0;
  window.addEventListener('resize', () => { clearTimeout(rzT); rzT = setTimeout(() => fields.forEach((f) => f.resize()), 150); });

  /* ------------------------------------------------------------------ Puntero: núcleo 3D, parallax, spot */
  const coreTilt = $('#coreTilt');
  const spot = $('#spot');
  let ptrX = 0, ptrY = 0, lastMove = -1e9, sx = 0, sy = 0, spotTick = false;
  let coreVisible = true;
  const heroEl = $('#inicio');
  if (heroEl && 'IntersectionObserver' in window) {
    new IntersectionObserver((es) => { coreVisible = es[0].isIntersecting; }).observe(heroEl);
  }
  if (FINE) {
    window.addEventListener('pointermove', (e) => {
      ptrX = (e.clientX / innerWidth - 0.5) * 2;
      ptrY = (e.clientY / innerHeight - 0.5) * 2;
      lastMove = performance.now();
      if (heroField) heroField.point(ptrX, ptrY, -10);
      if (spot) {
        sx = e.clientX; sy = e.clientY;
        if (!spotTick) { spotTick = true; requestAnimationFrame(() => { spotTick = false; spot.style.setProperty('--sx', sx + 'px'); spot.style.setProperty('--sy', sy + 'px'); spot.classList.add('on'); }); }
      }
    }, { passive: true });
    document.addEventListener('pointerleave', () => spot && spot.classList.remove('on'));
  }
  let cRX = 0, cRY = 0;
  if (coreTilt && !RM) {
    anims.push((t) => {
      if (!coreVisible || document.hidden) return;
      let tx, ty;
      if (FINE && t - lastMove < 2500) { ty = ptrX * 14; tx = -ptrY * 14; }
      else { ty = Math.sin((t / 1000) * (Math.PI * 2) / 9) * 8; tx = Math.sin((t / 1000) * (Math.PI * 2) / 13) * 3; }
      cRX = lerp(cRX, tx, 0.06); cRY = lerp(cRY, ty, 0.06);
      coreTilt.style.transform = `rotateX(${cRX.toFixed(2)}deg) rotateY(${cRY.toFixed(2)}deg)`;
    });
  }

  /* Botones magnéticos y tilt de tarjetas (solo puntero fino) */
  if (FINE && !RM) {
    $$('[data-magnetic]').forEach((b) => {
      b.addEventListener('pointermove', (e) => {
        const r = b.getBoundingClientRect();
        const x = clamp((e.clientX - (r.left + r.width / 2)) / (r.width / 2), -1, 1) * 8;
        const y = clamp((e.clientY - (r.top + r.height / 2)) / (r.height / 2), -1, 1) * 8;
        b.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px)`;
      });
      b.addEventListener('pointerleave', () => { b.style.transform = ''; });
    });
    $$('[data-tilt]').forEach((card) => {
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        card.style.setProperty('--ry', ((px - 0.5) * 16).toFixed(2) + 'deg');
        card.style.setProperty('--rx', ((0.5 - py) * 16).toFixed(2) + 'deg');
        card.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
        card.style.setProperty('--my', (py * 100).toFixed(1) + '%');
      });
      card.addEventListener('pointerleave', () => { card.style.setProperty('--rx', '0deg'); card.style.setProperty('--ry', '0deg'); });
    });
  }

  /* ------------------------------------------------------------------ HUD terminal (hero) */
  (function hud() {
    const box = $('#hudLines');
    if (!box || RM || getComputedStyle(box.parentElement).display === 'none') return;
    const lines = ['$ diagnosticar --equipo', '> placa ......... OK', '> memoria ....... OK', '> sistema ....... analizando', '> falla .......... encontrada', '> reparación .... en proceso', '> equipo ......... listo ✓'];
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    let vis = true;
    if ('IntersectionObserver' in window) new IntersectionObserver((es) => { vis = es[0].isIntersecting; }).observe(box);
    (async function loop() {
      for (;;) {
        box.textContent = '';
        for (const ln of lines) {
          const row = document.createElement('div');
          row.className = 'cur';
          box.appendChild(row);
          for (let i = 1; i <= ln.length; i++) {
            while (!vis || document.hidden) await sleep(400);
            row.textContent = ln.slice(0, i);
            await sleep(26);
          }
          row.classList.remove('cur');
          await sleep(260);
        }
        box.lastChild.classList.add('cur');
        await sleep(2600);
      }
    })();
  })();

  /* ------------------------------------------------------------------ Domótica día / noche */
  (function domotica() {
    const stage = $('#stage');
    const slider = $('#dayNight');
    if (!stage || !slider) return;
    const setNight = (v) => {
      stage.style.setProperty('--night', v.toFixed(3));
      slider.setAttribute('aria-valuetext', v < 0.34 ? 'Día' : v < 0.67 ? 'Atardecer' : 'Noche');
    };
    slider.addEventListener('input', () => { demoCancel = true; setNight(slider.value / 100); });
    let demoCancel = false, demoDone = false;
    function demo() {
      if (demoDone || RM) return;
      demoDone = true;
      const t0 = performance.now();
      (function step(now) {
        if (demoCancel) return;
        const p = clamp((now - t0) / 3000);
        const v = p < 0.5 ? p * 2 : (1 - p) * 2;
        const e = v * v * (3 - 2 * v);
        slider.value = Math.round(e * 100);
        setNight(e);
        if (p < 1) requestAnimationFrame(step);
      })(t0);
    }
    if ('IntersectionObserver' in window) {
      const o = new IntersectionObserver((es) => { if (es[0].isIntersecting) { setTimeout(demo, 500); o.disconnect(); } }, { threshold: 0.5 });
      o.observe(stage);
    }

    const hots = $$('.hot', stage);
    const items = $$('.dlist button');
    function setHot(i) {
      hots.forEach((h) => { const on = Number(h.dataset.hot) === i; h.classList.toggle('is-open', on); h.setAttribute('aria-expanded', String(on)); });
      items.forEach((b) => b.classList.toggle('on', Number(b.dataset.hot) === i));
    }
    hots.forEach((h) => {
      const i = Number(h.dataset.hot);
      h.addEventListener('click', () => setHot(h.classList.contains('is-open') ? -1 : i));
      if (FINE) { h.addEventListener('mouseenter', () => setHot(i)); }
      h.addEventListener('focus', () => setHot(i));
    });
    items.forEach((b) => b.addEventListener('click', () => setHot(Number(b.dataset.hot))));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setHot(-1); });
  })();

  /* ------------------------------------------------------------------ Preguntas (acordeón) */
  $$('.qa').forEach((qa) => {
    const btn = $('.qa__q', qa);
    if (!btn) return;
    btn.addEventListener('click', () => {
      const open = !qa.classList.contains('open');
      qa.classList.toggle('open', open);
      btn.setAttribute('aria-expanded', String(open));
    });
  });

  /* ------------------------------------------------------------------ Formulario → WhatsApp */
  (function form() {
    const f = $('#waForm');
    if (!f) return;
    const err = $('#formErr');
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!HAS_WA) return;
      const name = $('#fName').value.trim();
      if (!name) {
        err.textContent = 'Cuéntanos tu nombre para poder atenderte.';
        $('#fName').focus();
        return;
      }
      err.textContent = '';
      const needs = $$('input[name="need"]:checked', f).map((i) => i.value);
      const msg = $('#fMsg').value.trim();
      let text = `Hola Expert System, soy ${name}.`;
      if (needs.length) text += ` Me interesa: ${needs.join(', ')}.`;
      if (msg) text += ` ${msg}`;
      window.open(waUrl(text), '_blank', 'noopener');
    });
  })();

  /* Volver arriba */
  const toTop = $('#toTop');
  if (toTop) toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: RM ? 'auto' : 'smooth' }));

  /* ------------------------------------------------------------------ Arranque */
  requestAnimationFrame(frame);
  window.addEventListener('load', markDirty);
  window.addEventListener('pageshow', markDirty);
})();
