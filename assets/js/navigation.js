(function () {
  "use strict";

  const sections = ['#header', '#about', '#portfolio', '#testimonial', '#Console', '#contact'];
  // Tab order inside #about: About=0, Skills=1, Experience=2, Certifications=3
  const EXPERIENCE_TAB_INDEX = 2;

  let isAnimating = false;
  let lastJumpTime = 0;
  const SECTION_COOLDOWN = 600; // Snappier section jumps
  const KEY_COOLDOWN = 300;

  // Experience-specific scroll stability
  let lastExpStepTime = 0;
  let wheelDeltaAccum = 0;
  const EXP_COOLDOWN = 400;  // ms between experience steps (faster handoff)
  const EXP_DELTA_THRESHOLD = 80;   // lower threshold for easier scrolling

  /* ─── helpers ─────────────────────────────────────────────────── */

  const getSectionIndex = () => {
    const activeLink = document.querySelector('#navbar .nav-link.active');
    if (!activeLink) return 0;
    const idx = sections.indexOf(activeLink.hash);
    return idx === -1 ? 0 : idx;
  };

  const getActiveTabIndex = () => {
    const current = document.querySelector('.tab ul.tabs li.current');
    if (!current) return -1;
    return Array.from(current.parentElement.children).indexOf(current);
  };

  const isAboutSection = () => sections[getSectionIndex()] === '#about';

  const getExpTimeline = () => {
    if (!isAboutSection()) return null;
    if (getActiveTabIndex() !== EXPERIENCE_TAB_INDEX) return null;
    return document.querySelector('.exp-timeline');
  };

  const expCurrent = (tl) => parseInt(tl.dataset.current ?? '0', 10);
  const expTotal = (tl) => parseInt(tl.dataset.total ?? '1', 10);

  const stepExperience = (direction /* 'next' | 'prev' */) => {
    const tl = getExpTimeline();
    if (!tl) return false;

    const cur = expCurrent(tl);
    const total = expTotal(tl);

    if (direction === 'next' && cur < total - 1) {
      tl.querySelector('.exp-next')?.click();
      return true;
    }
    if (direction === 'prev' && cur > 0) {
      tl.querySelector('.exp-prev')?.click();
      return true;
    }
    return false;
  };

  /* ─── section navigation ──────────────────────────────────────── */

  const navigateToSection = (index) => {
    if (index < 0 || index >= sections.length || isAnimating) return;
    isAnimating = true;
    const navLink = document.querySelector(`#navbar .nav-link[href="${sections[index]}"]`);
    if (navLink) navLink.click();
    setTimeout(() => { isAnimating = false; }, 800);
  };

  const goNext = () => {
    const sectionIdx = getSectionIndex();

    if (sections[sectionIdx] === '#about') {
      const tabIdx = getActiveTabIndex();

      if (tabIdx === EXPERIENCE_TAB_INDEX) {
        if (stepExperience('next')) return;
      }

      const currentTab = document.querySelector('.tab ul.tabs li.current');
      if (currentTab && currentTab.nextElementSibling) {
        currentTab.nextElementSibling.click();
        return;
      }
    }

    navigateToSection(sectionIdx + 1);
  };

  const goPrev = () => {
    const sectionIdx = getSectionIndex();

    if (sections[sectionIdx] === '#about') {
      const tabIdx = getActiveTabIndex();

      if (tabIdx === EXPERIENCE_TAB_INDEX) {
        if (stepExperience('prev')) return;
      }

      const currentTab = document.querySelector('.tab ul.tabs li.current');
      if (currentTab && currentTab.previousElementSibling) {
        currentTab.previousElementSibling.click();
        return;
      }
    }

    navigateToSection(sectionIdx - 1);
  };

  /* ─── wheel ───────────────────────────────────────────────────── */

  // Accumulator reset timer — clears partial scroll if user pauses
  let accumResetTimer = null;

  const handleScroll = (e) => {
    const now = Date.now();

    // ── Experience timeline wheel handling ──
    const tl = getExpTimeline();
    if (tl) {
      const activeSlide = tl.querySelector('.exp-slide.active');
      if (activeSlide) {
        const atTop = activeSlide.scrollTop <= 2;
        const atBottom = activeSlide.scrollTop + activeSlide.clientHeight >= activeSlide.scrollHeight - 4;

        // Slide has internal scroll and we're not at the boundary → let it scroll naturally
        if (activeSlide.scrollHeight > activeSlide.clientHeight) {
          if (!(atTop && e.deltaY < 0) && !(atBottom && e.deltaY > 0)) {
            // Reset both accumulators while scrolling inside content
            wheelDeltaAccum = 0;
            lastJumpTime = now;
            return;
          }
        }

        // We're at the slide boundary — accumulate delta until threshold is met
        e.preventDefault();

        // Reset accumulator if direction changed
        if ((e.deltaY > 0 && wheelDeltaAccum < 0) ||
          (e.deltaY < 0 && wheelDeltaAccum > 0)) {
          wheelDeltaAccum = 0;
        }

        wheelDeltaAccum += e.deltaY;

        // Reset accumulator after a pause so a slow scroll doesn't carry over
        clearTimeout(accumResetTimer);
        accumResetTimer = setTimeout(() => { wheelDeltaAccum = 0; }, 400);

        // Not enough scroll gesture yet — wait
        if (Math.abs(wheelDeltaAccum) < EXP_DELTA_THRESHOLD) return;

        // Enough delta accumulated — check cooldown
        if (now - lastExpStepTime < EXP_COOLDOWN) return;

        const direction = wheelDeltaAccum > 0 ? 'next' : 'prev';
        wheelDeltaAccum = 0; // reset after consuming

        if (stepExperience(direction)) {
          lastExpStepTime = now;
          lastJumpTime = now; // also block section/tab jumps during cooldown
          return;
        }

        // Timeline boundary exhausted — fall through to tab/section navigation
        // but only after the section cooldown
        if (now - lastJumpTime < SECTION_COOLDOWN) return;
        lastJumpTime = now;
        if (direction === 'next') goNext();
        else goPrev();
        return;
      }
    }

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

    // Keyboard steps experience with its own cooldown
    const tl = getExpTimeline();
    if (tl) {
      if (now - lastExpStepTime < EXP_COOLDOWN) return;
      const direction = isDown ? 'next' : 'prev';
      if (stepExperience(direction)) {
        lastExpStepTime = now;
        lastJumpTime = now;
        return;
      }
      // Boundary — fall through to tab/section with section cooldown
    }

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

    // Experience tab: apply its own cooldown for touch too
    const tl = getExpTimeline();
    if (tl) {
      if (now - lastExpStepTime < EXP_COOLDOWN) return;
      if (stepExperience(direction)) {
        lastExpStepTime = now;
        lastJumpTime = now;
        return;
      }
      // Boundary — fall through
    }

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

