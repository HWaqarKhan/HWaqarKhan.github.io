var profile;
target = "_blank";
getPlatformName = (data) => data[3].url;

function RenderList(list, template) {
  var res = "";
  $.each(list, function (i, e) {
    if (template === consts.SKILLS) res += getSkillsTemplate(e);
    if (template === consts.EXPERIENCES) res += getExperienceTemplate(e);
    if (template === consts.EDUCATION) res += getEducationTemplate(e);
    if (template === consts.CERTIFICATION) res += getCertificationTemplate(e);
    if (template === consts.PORTFOLIO) res += getPortfolios(e);
    if (template === consts.PROGRESS) res += getProgress(e);
    if (template === consts.TESTIMONIAL) res += getTestimonials(e);
    if (template === consts.LINKS) res += getLinks(e);
  });
  return res;
}

const consts = {
  SKILLS: "skills",
  LANGUAGES: "languages",
  EXPERIENCES: "experiences",
  EDUCATION: "education",
  CERTIFICATION: "certification",
  PORTFOLIO: "portfolio",
  PROGRESS: "progress",
  TESTIMONIAL: "testimonial",
  LINKS: "links",
};

var title = "#title";
var fav = "#fav";
var nameSelector = "#name";
var skills = "#skills_data";
var education = "#education-history";
var exps = ".experiences";
var cert = "#certifications";
var portfolio = ".projects";
var progress = "#progress";
var testimonial = "#testimonial-nebula";
var links = ".social-links";

(async () => {
  $.getJSON("./assets/data/profile.json", function (profile) {
    var p = profile.profile;
    $(title).text(p.name);
    $(".emailLink").attr("href", `mailto:${p.email}`);
    $(fav).attr("href", p.favicon);
    $(nameSelector).text(p.name);
    $("#tagLine").html(p.tagLine);
    $("#designation").text(p.designation);
    $("#aboutMe").text(p.about);
    $(".myEmail").text(p.email);
    $("#phoneNo").text(p.phone);
    $("#degree").text(p.degree);
    $("#address").text(p.address);
    $(".time-js").text(new Date().getFullYear());

    // Render Components
    $(skills).html(RenderList(p.skill_categories, consts.SKILLS));
    $(exps).html(buildExperienceTimeline(p.experiences));
    $(education).html(RenderList(p.education_history, consts.EDUCATION));
    $(cert).html(RenderList(p.certifications, consts.CERTIFICATION));
    $(progress).html(RenderList(p.progress, consts.PROGRESS));
    $(testimonial).html(RenderList(p.testimonial, consts.TESTIMONIAL));
    $(portfolio).html(RenderList(p.projects, consts.PORTFOLIO));
    $(links).html(RenderList(p.links, consts.LINKS));

    // Initialize Hero & Nebula
    if (window.initHeroNebula) initHeroNebula();
    new LiquidNebula('#testimonial-nebula', '.testimonial-bubble');

    // PDF Info
    $(".username_pdf").text(p.name);
    $(".tagline_pdf").text(p.tagLine);
    $(".mail_pdf").text(p.email);
    $(".mobileNumber_pdf").text(p.phone);
  });
})();

// Templates
function getSkillsTemplate(e) {
  let itemsHtml = e.items.map(item => `<span class="skill-tag">${item}</span>`).join('');
  return `<div class="col-12 mb-4"><div class="skill-category"><h3 class="skill-category-title">${e.category}</h3><div class="skill-category-items">${itemsHtml}</div></div></div>`;
}

function getEducationTemplate(e) {
  return `<div class="card col-lg-5 col-md-12 mx-auto mb-3"><div class="row education"><div class="col-md-4 degree"><div class="card-body cc-education-header"><p class="fw-bold d-flex align-content-center">${e.from} - ${e.to}</p></div></div><div class="col-md-8"><div class="card-body"><div class="h5">${e.type}</div><p class="category">${e.institute_name}</p></div></div></div></div>`;
}

function getExperienceTemplate(e) {
  return `<div class="experience-item"><h4>${e.designation}</h4><h5>${e.from} — ${e.isCurrent ? "Present" : e.to}</h5><p><em>${e.company}</em></p><div class="experience-description">${e.description}</div></div>`;
}

function getCertificationTemplate(e) {
  return `
    <div class="col-lg-6 col-md-12 mb-3">
      <div class="cert-card">
        <div class="cert-icon">
          <img src="${e.img}" alt="${e.name}">
        </div>
        <div class="cert-info">
          <h4>${e.name}</h4>
          <p>${e.source}</p>
        </div>
        <div class="cert-link">
          <a href="${e.url}" target="_blank"><i class="bi bi-box-arrow-up-right"></i></a>
        </div>
      </div>
    </div>`;
}

function getPortfolios(e) {
  const techBadges = String(e.tech || '').split(',').filter(t => t.trim()).map(t => `<span class="portfolio-tech-badge">${t.trim()}</span>`).join('');
  return `
    <div class="col-lg-4 col-md-6 portfolio-item filter-app" 
         data-name="${e.name}" 
         data-img="${e.img}" 
         data-tech="${e.tech}" 
         data-url="${e.url}" 
         data-description="${e.description || ''}"
         data-problem="${e.problem || 'Coming soon...'}"
         data-solution="${e.solution || 'Coming soon...'}"
         data-role="${e.role || 'Senior Developer'}"
         data-impact="${e.impact || 'Successful deployment and positive user feedback.'}">
      <div class="portfolio-wrap tilt-card">
        <img src="${e.img}" alt="${e.name}" class="img-fluid">
        <div class="portfolio-info">
          <h4>${e.name}</h4>
          <div class="portfolio-links">
          <a href="javascript:void(0)" class="project-details-btn" title="View Details"><i class="bi bi-eye"></i></a>
          <a href="${e.url}" target="_blank" title="Live Demo"><i class="bi bi-link-45deg"></i></a>
          </div>
          </div>
          </div>
          </div>`;
  // <div class="portfolio-tech-list">${techBadges}</div>
}

function getProgress(e) {
  return `<div class="col-lg-3 col-md-6"><div class="count-box"><i class="${e.icon}"></i><span>${e.count}</span><p>${e.name}</p></div></div>`;
}

function getTestimonials(e) {
  const data = btoa(unescape(encodeURIComponent(JSON.stringify(e))));
  return `<div class="testimonial-bubble" data-testimonial="${data}"><img src="${e.img}" alt="${e.name}"><div class="bubble-name">${e.name}</div></div>`;
}

function getLinks(e) {
  return `<a href="${e.url}" target="_blank" class="${e.name}"><i class="${e.icon}"></i></a>`;
}

/**
 * REFINED LIQUID NEBULA PHYSICS
 */
class LiquidNebula {
  constructor(container, items, options = {}) {
    this.container = $(container);
    this.items = $(items);
    this.physics = [];
    this.mouse = { x: -1000, y: -1000, active: false };
    this.config = { drift: 0.04, friction: 0.992, boundaryBounce: 0.7, rippleStrength: 0.4, rippleRadius: 200, cruiseSpeed: 0.5, ...options };
    this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    this.init();
  }

  init() {
    const width = this.container.width() || window.innerWidth;
    const height = this.container.height() || 600;

    this.items.each((i, el) => {
      const $el = $(el);
      const state = { el: $el, x: Math.random() * (width - 100), y: Math.random() * (height - 100), vx: (Math.random() - 0.5) * 2, vy: (Math.random() - 0.5) * 2, radius: 55, mass: 1 + Math.random(), isDragging: false, isHovered: false };
      this.setupInteraction($el, state);
      this.physics.push(state);
      $el.css({ position: 'absolute', left: 0, top: 0, transition: 'none' });
    });

    this.container.on('mousemove touchmove', (e) => {
      const rect = this.container[0].getBoundingClientRect();
      const x = e.type === 'touchmove' ? e.originalEvent.touches[0].clientX : e.clientX;
      const y = e.type === 'touchmove' ? e.originalEvent.touches[0].clientY : e.clientY;
      this.mouse.x = x - rect.left;
      this.mouse.y = y - rect.top;
      this.mouse.active = true;
    }).on('mouseleave touchend', () => { this.mouse.x = -1000; this.mouse.y = -1000; });

    requestAnimationFrame(() => this.update());
  }

  setupInteraction($el, state) {
    let startX, startY, origX, origY, dist = 0;
    $el.on('mouseenter', () => state.isHovered = true);
    $el.on('mouseleave', () => state.isHovered = false);

    $el.on('mousedown touchstart', (e) => {
      e.preventDefault();
      state.isDragging = true;
      dist = 0;
      $el.addClass('dragging');
      const rect = this.container[0].getBoundingClientRect();
      const x = e.type === 'touchstart' ? e.originalEvent.touches[0].clientX : e.clientX;
      const y = e.type === 'touchstart' ? e.originalEvent.touches[0].clientY : e.clientY;
      startX = x - rect.left; startY = y - rect.top;
      origX = state.x; origY = state.y;

      let lastX = x, lastY = y;

      $(document).on('mousemove.drag touchmove.drag', (me) => {
        const mx = me.type === 'touchmove' ? me.originalEvent.touches[0].clientX : me.clientX;
        const my = me.type === 'touchmove' ? me.originalEvent.touches[0].clientY : me.clientY;

        const dx = (mx - rect.left) - startX;
        const dy = (my - rect.top) - startY;
        dist += Math.sqrt(Math.pow(mx - lastX, 2) + Math.pow(my - lastY, 2));

        // Momentum calculation: how fast is the mouse moving?
        state.vx = (mx - lastX) * 0.8;
        state.vy = (my - lastY) * 0.8;

        state.x = origX + dx;
        state.y = origY + dy;

        lastX = mx; lastY = my;
      });

      $(document).on('mouseup.drag touchend.drag', () => {
        state.isDragging = false;
        $el.removeClass('dragging');
        $(document).off('.drag');

        // If moved less than 7 pixels, it's a click
        if (dist < 7) {
          this.openModal($el);
        }
      });
    });
  }

  openModal($el) {
    const raw = $el.data('testimonial');
    if (!raw) return;
    const data = JSON.parse(decodeURIComponent(escape(atob(raw))));

    $('#expanded-content').html(`
      <div class="expanded-header">
        <img src="${data.img}" alt="${data.name}">
        <div class="expanded-info">
          <h4>${data.name}</h4>
          <h5>${data.designation}</h5>
        </div>
      </div>
      <div class="expanded-text">
        <i class="bi bi-quote"></i>
        ${data.endorsement}
      </div>
    `);
    $('#testimonial-overlay').addClass('active');
    $('body').css('overflow', 'hidden');
  }

  playChime(vol) {
    if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
    const now = this.audioCtx.currentTime;
    [1, 3.2, 5.5].forEach((r, i) => {
      const osc = this.audioCtx.createOscillator(); const gain = this.audioCtx.createGain();
      osc.type = 'sine'; osc.frequency.setValueAtTime(600 * r, now);
      gain.gain.setValueAtTime(0, now); gain.gain.linearRampToValueAtTime((0.03 / (i + 1)) * vol, now + 0.01); gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5 / r);
      osc.connect(gain); gain.connect(this.audioCtx.destination); osc.start(now); osc.stop(now + 0.6);
    });
  }

  update() {
    const w = this.container.width(), h = this.container.height() || 600;
    for (let i = 0; i < this.physics.length; i++) {
      for (let j = i + 1; j < this.physics.length; j++) {
        const p1 = this.physics[i], p2 = this.physics[j];
        const dx = (p2.x + p2.radius) - (p1.x + p1.radius), dy = (p2.y + p2.radius) - (p1.y + p1.radius);
        const dist = Math.sqrt(dx * dx + dy * dy), min = p1.radius + p2.radius;
        if (dist < min && dist > 0) {
          const nx = dx / dist, ny = dy / dist, overlap = min - dist;
          if (!p1.isDragging && !p2.isDragging) { p1.x -= nx * overlap * 0.5; p1.y -= ny * overlap * 0.5; p2.x += nx * overlap * 0.5; p2.y += ny * overlap * 0.5; }
          const relVX = p1.vx - p2.vx, relVY = p1.vy - p2.vy, velN = relVX * nx + relVY * ny;
          if (velN > 0) {
            const imp = 1.8 * velN / (1 / p1.mass + 1 / p2.mass);
            if (!p1.isDragging) { p1.vx -= (imp / p1.mass) * nx; p1.vy -= (imp / p1.mass) * ny; }
            if (!p2.isDragging) { p2.vx += (imp / p2.mass) * nx; p2.vy += (imp / p2.mass) * ny; }
            if (velN > 0.4) this.playChime(Math.min(velN, 0.4));
          }
        }
      }
    }
    this.physics.forEach(p => {
      if (p.isDragging) {
        p.el.css('transform', `translate(${p.x}px, ${p.y}px) scale(1.1)`);
        return;
      }

      // Idle drift
      p.vx += (Math.random() - 0.5) * 0.04; p.vy += (Math.random() - 0.5) * 0.04;

      const dx = (p.x + p.radius) - this.mouse.x, dy = (p.y + p.radius) - this.mouse.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      let scale = 1.0;

      // LIQUID DISPLACEMENT LOGIC
      if (this.mouse.active && d < 350) {
        const influence = Math.exp(-(d * d) / (250 * 250 * 0.5));

        // Repulsion (Displacement)
        if (d > p.radius * 1.2) {
          p.vx += (dx / d) * influence * 0.6;
          p.vy += (dy / d) * influence * 0.6;
        }

        // Compression (Scaling)
        // Bubbles near the mouse "squeeze" down to 0.85, then expand back
        const scaleTarget = 1.0 - (influence * 0.15);
        scale = scaleTarget;
      }

      p.vx *= 0.992; p.vy *= 0.992; p.x += p.vx; p.y += p.vy;

      const maxX = w - p.radius * 2, maxY = h - p.radius * 2;
      if (p.x < 0) { p.x = 0; p.vx = Math.abs(p.vx) * 0.7; } else if (p.x > maxX) { p.x = maxX; p.vx = -Math.abs(p.vx) * 0.7; }
      if (p.y < 0) { p.y = 0; p.vy = Math.abs(p.vy) * 0.7; } else if (p.y > maxY) { p.y = maxY; p.vy = -Math.abs(p.vy) * 0.7; }

      // Final transform with dynamic scale
      p.el.css('transform', `translate(${p.x}px, ${p.y}px) scale(${scale})`);
    });
    requestAnimationFrame(() => this.update());
  }
}

// Experience Timeline Slide Logic
function buildExperienceTimeline(exps) {
  if (!exps || exps.length === 0) return '';
  let nodes = '', slides = '';
  exps.forEach((e, i) => {
    nodes += `<div class="exp-timeline-node ${i === 0 ? 'active' : ''}" data-index="${i}"></div>`;
    slides += `<div class="exp-slide ${i === 0 ? 'active' : ''}" data-index="${i}"><div class="exp-slide-header"><span class="exp-period">${e.from} — ${e.isCurrent ? 'Present' : e.to}</span></div><h4 class="exp-designation">${e.designation}</h4><p class="exp-company">${e.company}</p><div class="exp-body">${e.description}</div></div>`;
  });
  return `<div class="exp-timeline" data-total="${exps.length}" data-current="0"><div class="exp-spine"><div class="exp-spine-track"></div><div class="exp-spine-fill"></div>${nodes}</div><div class="exp-slides-wrap">${slides}</div><div class="exp-nav"><button class="exp-nav-btn exp-prev" disabled><i class="bi bi-chevron-up"></i></button><span class="exp-counter"><span class="exp-current-num">1</span> / ${exps.length}</span><button class="exp-nav-btn exp-next"><i class="bi bi-chevron-down"></i></button></div></div>`;
}

function initExperienceTimeline() {
  const timeline = $('.exp-timeline'); if (!timeline.length) return;
  const total = parseInt(timeline.data('total')), slides = timeline.find('.exp-slide'), nodes = timeline.find('.exp-timeline-node'), fill = timeline.find('.exp-spine-fill');
  let current = 0;
  function goTo(idx) {
    if (idx < 0 || idx >= total || idx === current) return;
    const dir = idx > current ? 'down' : 'up';
    slides.eq(current).removeClass('active').addClass(dir === 'down' ? 'exit-up' : 'exit-down');
    nodes.eq(current).removeClass('active'); current = idx;
    slides.eq(current).addClass('active ' + (dir === 'down' ? 'enter-down' : 'enter-up'));
    nodes.eq(current).addClass('active');
    setTimeout(() => slides.removeClass('exit-up exit-down enter-up enter-down'), 400);
    fill.css('height', (current / (total - 1) * 100) + '%');
    timeline.find('.exp-current-num').text(current + 1);
    timeline.find('.exp-prev').prop('disabled', false); // Never disable, use for tab handoff
    timeline.find('.exp-next').prop('disabled', false);
  }

  timeline.find('.exp-prev').on('click', () => {
    if (current === 0) {
      // Go to Skills Tab (Index 1)
      $('.tab ul.tabs li').eq(1).click();
    } else {
      goTo(current - 1);
    }
  });

  timeline.find('.exp-next').on('click', () => {
    if (current === total - 1) {
      // Go to Certifications Tab (Index 3)
      $('.tab ul.tabs li').eq(3).click();
    } else {
      goTo(current + 1);
    }
  });

  // Mouse Wheel Support
  let lastWheelTime = 0;
  timeline.on('wheel', function(e) {
    const now = Date.now();
    if (now - lastWheelTime < 250) return; // Snappier debounce
    
    if (e.originalEvent.deltaY > 0) {
      if (current < total - 1) {
        e.preventDefault();
        goTo(current + 1);
        lastWheelTime = now;
      }
    } else {
      if (current > 0) {
        e.preventDefault();
        goTo(current - 1);
        lastWheelTime = now;
      }
    }
  });

  // Touch Swipe Support
  let touchStartY = 0;
  timeline.on('touchstart', function(e) {
    touchStartY = e.originalEvent.touches[0].clientY;
  });

  timeline.on('touchend', function(e) {
    const touchEndY = e.originalEvent.changedTouches[0].clientY;
    const diff = touchStartY - touchEndY;
    
    if (Math.abs(diff) > 50) { // Swipe threshold
      if (diff > 0) { // Swipe Up -> Next
        if (current < total - 1) goTo(current + 1);
        else $('.tab ul.tabs li').eq(3).click();
      } else { // Swipe Down -> Prev
        if (current > 0) goTo(current - 1);
        else $('.tab ul.tabs li').eq(1).click();
      }
    }
  });

  nodes.on('click', function () { goTo($(this).data('index')); });
}

// Modal & Interaction Logic
$(document).ready(function () {
  // Project Modal
  $(document).on('click', '.project-details-btn', function (e) {
    e.preventDefault();
    const item = $(this).closest('.portfolio-item');
    $('#projectModalTitle').text(item.data('name'));
    $('#projectModalImage').attr('src', item.data('img'));
    const tech = String(item.data('tech') || '').split(',').filter(t => t.trim()).map(t => `<span class="modal-tech-badge">${t.trim()}</span>`).join('');
    $('#projectModalTech').html(tech);
    $('#projectModalDesc').html(item.data('description') || 'No description available.');
    $('#projectProblem').text(item.data('problem'));
    $('#projectSolution').text(item.data('solution'));
    $('#projectRole').text(item.data('role'));
    $('#projectImpact').text(item.data('impact'));
    $('#projectLiveDemo').attr('href', item.data('url'));
    $('#projectModalBackdrop').addClass('show');
    $('body').css('overflow', 'hidden');
  });

  const closeProject = () => { $('#projectModalBackdrop').removeClass('show'); $('body').css('overflow', ''); };
  $(document).on('click', '#projectModalClose', closeProject);
  $(document).on('click', '#projectModalBackdrop', (e) => { if ($(e.target).is('#projectModalBackdrop')) closeProject(); });

  const closeTestimonial = () => { $('#testimonial-overlay').removeClass('active'); $('body').css('overflow', ''); };
  $(document).on('click', '.close-testimonial, #testimonial-overlay', function (e) {
    if (e.target === this || $(e.target).closest('.close-testimonial').length) closeTestimonial();
  });

  $(document).on('keydown', (e) => {
    if (e.key === 'Escape') { closeProject(); closeTestimonial(); }
  });

  // 3D Tilt Effect Logic
  $(document).on('mousemove', '.tilt-card', function (e) {
    const card = $(this);
    const rect = this.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = (y - centerY) / 10;
    const rotateY = (centerX - x) / 10;

    card.css('transform', `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`);
  });

  $(document).on('mouseleave', '.tilt-card', function () {
    $(this).css('transform', 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)');
  });
});

$(document).on('click', '.tab ul.tabs li', function () { if ($(this).index() === 2) setTimeout(initExperienceTimeline, 50); });
