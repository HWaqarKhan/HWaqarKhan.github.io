// assets/js/light-background.js
// Plain ES6 script — NOT a module
// Light theme background: DevDay ASCII Galaxy (from background_animation.html)
// No particles — uses the same web component animation as the reference file.

const CROSSFADE_DURATION_MS = 800;
const CROSSFADE_REDUCED_MS = 0;

// ─── DevDay ASCII Galaxy Web Component ───────────────────────────────────────
// Ported directly from background_animation.html, adapted to run inside a
// regular <div id="light-bg-canvas"> container instead of a custom element.

class LightBackground {
  constructor() {
    this.container = document.getElementById('light-bg-canvas');
    this.canvas = null;
    this.ctx = null;
    this.rafId = null;
    this.running = false;
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Galaxy state
    this.nodes = [];
    this.time = 0;
    this.mouse = { x: -1000, y: -1000, drag: false, sx: 0, sy: 0, rx: 0, ry: 0, trx: 0, try: 0, activeTime: 0 };

    // Color palette from background_animation.html
    this.theme = {
      base: '#059669',
      connector: '#0284C7',
      head: '#0D9488',
      text: '#1F2937',
      glow: 'rgba(16, 185, 129, 0.4)'
    };

    if (this.container) {
      this._buildCanvas();
      this._buildGalaxyModel();
      this._bindEvents();
      window.addEventListener('resize', () => this._resize());
    }
  }

  _buildCanvas() {
    this.canvas = document.createElement('canvas');
    this.canvas.style.cssText = 'display:block;width:100%;height:100%;cursor:grab;';
    this.container.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');
    this._resize();
  }

  _resize() {
    if (!this.canvas || !this.container) return;
    this.canvas.width = this.container.clientWidth * window.devicePixelRatio;
    this.canvas.height = this.container.clientHeight * window.devicePixelRatio;
    if (this.ctx) this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  }

  _bindEvents() {
    if (!this.container) return;

    window.addEventListener('pointermove', e => {
      if (!this.running || !this.canvas) return;
      const r = this.canvas.getBoundingClientRect();
      this.mouse.x = e.clientX - r.left;
      this.mouse.y = e.clientY - r.top;
      this.mouse.activeTime = 1.0;
      if (this.mouse.drag) {
        this.mouse.trx += (e.clientX - this.mouse.sx) * 0.008;
        this.mouse.try += (e.clientY - this.mouse.sy) * 0.008;
        this.mouse.sx = e.clientX;
        this.mouse.sy = e.clientY;
      }
    });

    window.addEventListener('pointerdown', e => {
      if (!this.running) return;
      // Do not trigger grab/drag if the click is on an interactive element
      if (e.target.closest('a, button, input, textarea, select, .theme-toggle-btn, .portfolio-item, .testimonial-bubble, .modal-close, .mobile-nav-toggle, #download, #gPDF')) {
        return;
      }
      this.mouse.drag = true;
      this.mouse.sx = e.clientX;
      this.mouse.sy = e.clientY;
      document.documentElement.classList.add('grabbing');
    });

    window.addEventListener('pointerup', () => {
      this.mouse.drag = false;
      document.documentElement.classList.remove('grabbing');
    });

    window.addEventListener('pointercancel', () => {
      this.mouse.drag = false;
      document.documentElement.classList.remove('grabbing');
    });

    document.addEventListener('pointerleave', () => {
      this.mouse.x = this.mouse.y = -1000;
    });
  }

  _buildGalaxyModel() {
    this.nodes = [];
    const addNode = (char, x, y, z, type, size, glow = false, orbital = false, speed = 0, plane = 'h') => {
      this.nodes.push({
        baseX: x, baseY: y, baseZ: z,
        x, y, z,
        char, type, size, glow, orbital, speed, plane,
        angle: Math.atan2(z, x) || Math.random(),
        noiseOffset: Math.random() * Math.PI * 2
      });
    };

    // Core DevDay Cup
    const coreCup = [
      { c: '^', x: -36, y: 35 }, { c: '^', x: -28, y: 35 }, { c: '^', x: -20, y: 35 },
      { c: '^', x: 20, y: 35 }, { c: '^', x: 28, y: 35 }, { c: '^', x: 36, y: 35 },
      { c: '(', x: -28, y: 15, s: 16 }, { c: ',', x: -18, y: 18 }, { c: '_', x: -9, y: 15 },
      { c: '.', x: 0, y: 16, s: 18, g: true }, { c: '_', x: 9, y: 15 }, { c: ',', x: 18, y: 18 }, { c: ')', x: 28, y: 15, s: 16 }
    ];
    coreCup.forEach(n => addNode(n.c, n.x, n.y, 0, n.g ? 'head' : 'base', n.s || 14, n.g));

    // Rotating horizontal ring
    '---==---&*---==---&*'.split('').forEach((c, i, a) => {
      const ang = (i / a.length) * Math.PI * 2;
      addNode(c, Math.cos(ang) * 40, -5, Math.sin(ang) * 40, (c === '&' || c === '*') ? 'head' : 'connector', 13, false, true, 0.012);
    });

    // Tilted ring
    '/--+--\\o•/--+--\\o•'.split('').forEach((c, i, a) => {
      const ang = (i / a.length) * Math.PI * 2;
      addNode(c, Math.cos(ang) * 35, -28, Math.sin(ang) * 35, (c === '+' || c === 'o') ? 'head' : 'connector', 12, false, true, -0.010, 't');
    });

    // Galaxy background density
    const symbols = ['•', '*', 'o', '+', '.', '1', '0', '{', '}', '[', ']'];
    for (let i = 0; i < 95; i++) {
      const ang = Math.random() * Math.PI * 2;
      const r = 25 + Math.random() * 65;
      const y = -65 + Math.random() * 110;
      const char = symbols[Math.floor(Math.random() * symbols.length)];
      addNode(char, Math.cos(ang) * r, y, Math.sin(ang) * r, 'connector', 9 + Math.random() * 4, Math.random() > 0.6, true, 0.005 + Math.random() * 0.01);
    }
  }

  _tick() {
    if (!this.running || !this.ctx || !this.canvas) return;

    this.time += this.reducedMotion ? 0.002 : 0.02;

    // Soft white clear for motion-blur trail effect
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    const w = this.canvas.width / window.devicePixelRatio;
    const h = this.canvas.height / window.devicePixelRatio;
    const cx = w / 2, cy = h / 2;
    const scale = Math.max(0.75, Math.min(2.0, Math.min(w, h) / 380));
    const sx = Math.sin(this.time * 0.5) * 10 * scale;
    const sy = Math.cos(this.time * 0.7) * 4 * scale;

    if (this.mouse.activeTime > 0) this.mouse.activeTime -= 0.008;
    this.mouse.rx += (this.mouse.trx - this.mouse.rx) * 0.1;
    this.mouse.ry += (this.mouse.try - this.mouse.ry) * 0.1;

    const ay = this.time * 0.3 + this.mouse.rx;
    const ax = Math.sin(this.time * 0.15) * 0.1 + this.mouse.ry;
    const projected = [];

    this.nodes.forEach(n => {
      if (n.orbital) {
        n.angle += n.speed;
        const radius = Math.sqrt(n.baseX * n.baseX + n.baseZ * n.baseZ) || 30;
        n.baseX = Math.cos(n.angle) * radius;
        n.baseZ = Math.sin(n.angle) * radius;
        if (n.plane === 't') n.baseY = -28 + n.baseZ * 0.22;
      }

      let targetX = n.baseX, targetY = n.baseY, targetZ = n.baseZ;

      if (this.mouse.x > -500 && this.mouse.activeTime > 0.01) {
        const gx = cx + sx + n.x * scale;
        const gy = cy + sy + n.y * scale;
        const dx = gx - this.mouse.x, dy = gy - this.mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const influenceRadius = Math.max(w, h) * 0.85;
        if (dist < influenceRadius) {
          const strength = (1.0 - dist / influenceRadius) * this.mouse.activeTime;
          const waveAngle = n.noiseOffset + this.time * 1.5;
          targetX = n.baseX + (Math.cos(waveAngle) * w * 0.45 * strength) / scale;
          targetY = n.baseY + (Math.sin(waveAngle) * h * 0.45 * strength) / scale;
          targetZ = n.baseZ + Math.sin(waveAngle) * 80 * strength;
        }
      }

      n.x += (targetX - n.x) * 0.08;
      n.y += (targetY - n.y) * 0.08;
      n.z += (targetZ - n.z) * 0.08;

      let rx = n.x, ry = n.y, rz = n.z;
      if (n.orbital) {
        const x1 = rx * Math.cos(ay) - rz * Math.sin(ay);
        const z1 = rx * Math.sin(ay) + rz * Math.cos(ay);
        ry = ry * Math.cos(ax) - z1 * Math.sin(ax);
        rz = ry * Math.sin(ax) + z1 * Math.cos(ax);
        rx = x1;
      } else {
        ry = ry * Math.cos(ax * 0.3) - rz * Math.sin(ax * 0.3);
        rz = ry * Math.sin(ax * 0.3) + rz * Math.cos(ax * 0.3);
      }

      const zScale = 160 / (160 + rz);
      projected.push({
        x: cx + sx + rx * scale * zScale,
        y: cy + sy + ry * scale * zScale,
        z: rz,
        sz: n.size * zScale * scale,
        n
      });
    });

    // Z-sort and draw
    projected.sort((a, b) => b.z - a.z).forEach(p => {
      this.ctx.save();
      this.ctx.font = `${p.n.glow ? 'bold' : 'normal'} ${p.sz}px "JetBrains Mono", monospace`;
      const color = this.theme[p.n.type] || this.theme.text;
      this.ctx.fillStyle = color;
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      const normZ = (p.z + 80) / 160;
      this.ctx.globalAlpha = Math.max(0.18, 1.0 - normZ * 0.65);
      if (p.n.glow) {
        this.ctx.shadowColor = color;
        this.ctx.shadowBlur = 8 * (160 / (160 + p.z));
      }
      this.ctx.fillText(p.n.char, p.x, p.y);
      this.ctx.restore();
    });

    this.rafId = requestAnimationFrame(() => this._tick());
  }

  start() {
    if (this.running) return;
    if (!this.ctx || !this.container) return;
    const duration = this.reducedMotion ? CROSSFADE_REDUCED_MS : CROSSFADE_DURATION_MS;

    this.container.style.display = 'block';
    this.container.getBoundingClientRect(); // force reflow
    this.container.style.transition = `opacity ${duration}ms ease`;
    this.container.style.opacity = '1';

    // Re-sync canvas size in case window changed while hidden
    this._resize();

    this.running = true;
    this.rafId = null;
    this._tick();
  }

  stop() {
    const duration = this.reducedMotion ? CROSSFADE_REDUCED_MS : CROSSFADE_DURATION_MS;
    if (!this.container) return;

    this.container.style.transition = `opacity ${duration}ms ease`;
    this.container.style.opacity = '0';

    this.running = false; // stop RAF immediately to save CPU during fade-out

    const onEnd = () => {
      this.container.style.display = 'none';
      if (this.rafId !== null) {
        cancelAnimationFrame(this.rafId);
        this.rafId = null;
      }
    };

    if (duration === 0) {
      onEnd();
    } else {
      this.container.addEventListener('transitionend', onEnd, { once: true });
    }
  }
}

// Expose globally after DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.lightBackground = new LightBackground();
});
