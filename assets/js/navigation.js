(function () {
  "use strict";

  const getActiveSections = () => {
    // Hide Console completely on mobile screens (< 768px), but keep it visible on tablets/desktops (>= 768px)
    if (window.innerWidth < 768) {
      return ['#header', '#about', '#portfolio', '#testimonial', '#contact'];
    }
    return ['#header', '#about', '#portfolio', '#testimonial', '#Console', '#contact'];
  };

  let isAnimating = false;
  let lastJumpTime = 0;
  const SECTION_COOLDOWN = 600; // Snappier section jumps
  const KEY_COOLDOWN = 300;

  /* ─── helpers ────────────────────────────────────────────────── */

  const getSectionIndex = () => {
    const activeLink = document.querySelector('#navbar .nav-link.active');
    if (!activeLink) return 0;
    const activeSecs = getActiveSections();
    const idx = activeSecs.indexOf(activeLink.hash);
    return idx === -1 ? 0 : idx;
  };

  /* ─── section navigation ──────────────────────────────────────── */

  const navigateToSection = (index) => {
    const activeSecs = getActiveSections();
    if (index < 0 || index >= activeSecs.length || isAnimating) return;
    isAnimating = true;
    const navLink = document.querySelector(`#navbar .nav-link[href="${activeSecs[index]}"]`);
    if (navLink) navLink.click();
    setTimeout(() => { isAnimating = false; }, 800);
  };

  const goNext = () => {
    const sectionIdx = getSectionIndex();
    navigateToSection(sectionIdx + 1);
  };

  const goPrev = () => {
    const sectionIdx = getSectionIndex();
    navigateToSection(sectionIdx - 1);
  };

  /* ─── wheel ───────────────────────────────────────────────────── */

  const handleScroll = (e) => {
    const now = Date.now();

    // ── Generic inner-scroll detection (non-experience sections) ──
    let isInnerScroll = false;
    let target = e.target;
    while (target && target !== document.body) {
      if (target.scrollHeight > target.clientHeight) {
        const style = window.getComputedStyle(target);
        if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
          const atTop = target.scrollTop <= 5;
          const atBottom = target.scrollTop + target.clientHeight >= target.scrollHeight - 10;
          if (!(atTop && e.deltaY < 0) && !(atBottom && e.deltaY > 0)) {
            isInnerScroll = true;
          }
          break;
        }
      }
      target = target.parentElement;
    }

    if (isInnerScroll) {
      lastJumpTime = now;
      return;
    }

    if (now - lastJumpTime < SECTION_COOLDOWN) return;

    lastJumpTime = now;
    if (e.deltaY > 0) goNext();
    else if (e.deltaY < 0) goPrev();
  };

  /* ─── keyboard ────────────────────────────────────────────────── */

  const handleKeydown = (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    const consoleSection = document.getElementById('Console');
    if (consoleSection && consoleSection.classList.contains('section-show')) {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
        'Backspace', 'Enter', 'Tab', ' '].includes(e.key)) return;
    }

    const isDown = e.key === 'ArrowDown' || e.key === 'ArrowRight';
    const isUp = e.key === 'ArrowUp' || e.key === 'ArrowLeft';
    if (!isDown && !isUp) return;

    e.preventDefault();

    const now = Date.now();

    if (now - lastJumpTime < KEY_COOLDOWN) return;
    lastJumpTime = now;

    if (isDown) goNext();
    else goPrev();
  };

  /* ─── touch ───────────────────────────────────────────────────── */

  let touchStartY = 0;
  let touchStartX = 0;

  const handleTouchStart = (e) => {
    touchStartY = e.changedTouches[0].screenY;
    touchStartX = e.changedTouches[0].screenX;
  };

  const handleTouchEnd = (e) => {
    if (e.target.closest('.swiper')) return;

    const now = Date.now();

    const touchEndY = e.changedTouches[0].screenY;
    const touchEndX = e.changedTouches[0].screenX;
    const diffY = touchStartY - touchEndY;
    const diffX = touchStartX - touchEndX;

    const isVertical = Math.abs(diffY) > Math.abs(diffX) && Math.abs(diffY) > 40;
    const isHorizontal = Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 40;

    if (!isVertical && !isHorizontal) return;

    const direction = (isVertical && diffY > 0) || (isHorizontal && diffX > 0) ? 'next' : 'prev';

    if (now - lastJumpTime < 800) return;
    lastJumpTime = now;

    if (direction === 'next') goNext();
    else goPrev();
  };

  /* ─── bind ────────────────────────────────────────────────────── */

  window.addEventListener('wheel', handleScroll, { passive: false });
  window.addEventListener('keydown', handleKeydown);
  window.addEventListener('touchstart', handleTouchStart, { passive: true });
  window.addEventListener('touchend', handleTouchEnd, { passive: true });

})();
