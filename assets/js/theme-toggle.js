// assets/js/theme-toggle.js
// Plain ES6 script — NOT a module

class ThemeToggle {
  constructor() {
    this.currentTheme = 'dark';
    this.rotationDeg = 0;
    this.isTransitioning = false;
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.btn = null;
  }

  // Pure function — returns 'dark' for any value that is not exactly 'dark' or 'light'
  readStoredTheme(value) {
    return (value === 'dark' || value === 'light') ? value : 'dark';
  }

  getTheme() {
    return this.currentTheme;
  }

  applyTheme(theme) {
    this.currentTheme = theme;

    // Set data-theme attribute on <html>
    try {
      document.documentElement.setAttribute('data-theme', theme);
    } catch (e) {
      // Silent — keep existing CSS variables active
    }

    // Persist to localStorage
    try {
      localStorage.setItem('theme-preference', theme);
    } catch (e) {
      // Silent — SecurityError or quota exceeded
    }

    // Update aria-label on all toggle buttons
    const label = theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme';
    document.querySelectorAll('.theme-toggle-btn').forEach(btn => {
      btn.setAttribute('aria-label', label);
    });

    // Notify the rest of the page so background layers stay in sync
    try {
      document.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
    } catch (e) {
      // Silent — keep theme state updates local if CustomEvent is unavailable
    }
  }

  _rotateButton() {
    if (this.reducedMotion) {
      document.querySelectorAll('.theme-toggle-btn').forEach(btn => {
        btn.style.transitionDuration = '0s';
      });
    } else {
      document.querySelectorAll('.theme-toggle-btn').forEach(btn => {
        btn.style.transitionDuration = '';
      });
    }
    this.rotationDeg += 180;
    document.documentElement.style.setProperty('--btn-rotation', `${this.rotationDeg}deg`);
  }

  _pulseButton() {
    if (!this.btn || this.reducedMotion) return;
    // Use a separate wrapper element for pulse so it doesn't fight the rotation transform
    this.btn.classList.remove('pulse');
    // Force reflow to restart animation
    void this.btn.offsetWidth;
    this.btn.classList.add('pulse');
    setTimeout(() => {
      if (this.btn) this.btn.classList.remove('pulse');
    }, 400);
  }

  toggle() {
    // 1. Guard against double-clicks during transition
    if (this.isTransitioning) return;

    // 2. Set transitioning flag
    this.isTransitioning = true;

    const html = document.documentElement;
    const currentTheme = this.readStoredTheme(html.getAttribute('data-theme') || this.currentTheme);
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    // 3. Add .theme-transitioning BEFORE changing data-theme (Req 2.2)
    html.classList.add('theme-transitioning');

    // 4. Apply theme and notify the rest of the page
    this.applyTheme(newTheme);

    // 5. Animate button
    this._rotateButton();
    this._pulseButton();

    // 6. Remove .theme-transitioning after 400ms, reset flag
    setTimeout(() => {
      html.classList.remove('theme-transitioning');
      this.isTransitioning = false;
    }, 400);
  }

  init() {
    // Read current theme from DOM (set by FOUC guard)
    const domTheme = document.documentElement.getAttribute('data-theme');
    this.currentTheme = this.readStoredTheme(domTheme || window.__INITIAL_THEME__ || 'dark');

    // Handle WebGL fallback
    const bgCanvas = document.getElementById('bg-canvas');
    if (bgCanvas && bgCanvas.getContext('webgl') === null) {
      document.body.style.background = 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)';
    }

    // Build Yin-Yang SVG button
    const btn = document.createElement('button');
    btn.className = 'theme-toggle-btn';
    btn.setAttribute('tabindex', '0');

    const label =
      this.currentTheme === 'light'
        ? 'Switch to dark theme'
        : 'Switch to light theme';

    btn.setAttribute('aria-label', label);

    btn.innerHTML = `
    <svg class="yin-yang-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="whiteGrad" cx="35%" cy="35%" r="70%">
          <stop offset="0%" stop-color="#ffffff"/>
          <stop offset="100%" stop-color="#e6e6e6"/>
        </radialGradient>

        <radialGradient id="blackGrad" cx="65%" cy="65%" r="70%">
          <stop offset="0%" stop-color="#2a2a2a"/>
          <stop offset="100%" stop-color="#000000"/>
        </radialGradient>

        <filter id="glow">
          <feGaussianBlur stdDeviation="1.5" result="blur"/>
          <feMerge>
            <feMergeNode in="blur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      <!-- OUTER -->
      <circle cx="50" cy="50" r="48"
        fill="none"
        stroke="#111"
        stroke-width="2"
      />

      <!-- ✅ WHITE GROUP -->
      <g class="yin-half yin-light-group">
        <path
          d="M50 2
            A48 48 0 0 1 50 98
            A24 24 0 0 0 50 50
            A24 24 0 0 1 50 2Z"
          fill="url(#whiteGrad)"
          filter="url(#glow)"
        />

        <circle cx="50" cy="26" r="7" fill="#f8f8f8"/>
        <circle cx="50" cy="26" r="2" fill="#000000" opacity="0.25"/>
      </g>

      <!-- ✅ BLACK GROUP -->
      <g class="yin-half yin-dark-group">
        <path
          d="M50 2
            A24 24 0 0 0 50 50
            A24 24 0 0 1 50 98
            A48 48 0 0 1 50 2Z"
          fill="url(#blackGrad)"
          filter="url(#glow)"
        />

        <circle cx="50" cy="74" r="7" fill="#111111"/>
        <circle cx="50" cy="74" r="2" fill="#ffffff" opacity="0.2"/>
      </g>

    </svg>`;

    let angle = 0;

    const svg = btn.querySelector(".yin-yang-svg");

    // const light = svg.querySelector(".yin-light-group");
    // const dark = svg.querySelector(".yin-dark-group");

    // light.addEventListener("mouseenter", () => {
    //   svg.appendChild(light);
    // });

    // dark.addEventListener("mouseenter", () => {
    //   svg.appendChild(dark);
    // });

    btn.addEventListener("click", (e) => {
      e.stopPropagation();

      angle += 180;

      svg.style.transition = "transform 0.7s cubic-bezier(.2,.8,.2,1)";
      svg.style.transformOrigin = "50% 50%";
      svg.style.transform = `rotate(${angle}deg) scale(1.05)`;

      setTimeout(() => {
        svg.style.transform = `rotate(${angle}deg) scale(1)`;
      }, 700);
    });


    this.btn = btn;


    const navbar = document.getElementById('navbar');
    if (navbar) navbar.appendChild(btn);

    // Also inject a clone into mobile navbar overlay if it exists
    const mobileNavUl = document.querySelector('.navbar-mobile ul');
    if (mobileNavUl) {
      const mobileBtn = btn.cloneNode(true);
      const mobileItem = document.createElement('li');
      mobileItem.className = 'theme-toggle-menu-item';
      mobileItem.appendChild(mobileBtn);
      mobileNavUl.appendChild(mobileItem);
      mobileBtn.addEventListener('click', () => this.toggle());
      mobileBtn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.toggle();
        }
      });
    }


    // Bind click handler
    btn.addEventListener('click', () => this.toggle());

    // Bind keyboard handler (Enter and Space)
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.toggle();
      }
    });

    // Also watch for dynamically created mobile nav and inject button
    const observer = new MutationObserver(() => {
      try {
        const mobileNav = document.querySelector('.navbar-mobile');
        if (!mobileNav || typeof mobileNav.querySelector !== 'function') return;
        if (!mobileNav.querySelector('.theme-toggle-btn')) {
          const mobileBtn = btn.cloneNode(true);
          const mobileItem = document.createElement('li');
          mobileItem.className = 'theme-toggle-menu-item';
          mobileItem.appendChild(mobileBtn);
          mobileBtn.addEventListener('click', () => this.toggle());
          mobileBtn.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              this.toggle();
            }
          });
          const ul = mobileNav.querySelector('ul');
          if (ul) {
            ul.appendChild(mobileItem);
          } else {
            mobileNav.appendChild(mobileItem);
          }
        }
      } catch (e) {
        // Silent — ignore transient DOM mutations during teardown
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }
}
