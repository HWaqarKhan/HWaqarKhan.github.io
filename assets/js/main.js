
document.addEventListener('DOMContentLoaded', function () {
  var consoleEl = document.querySelector('.console');
  if (consoleEl) consoleEl.classList.add('hidden');
});

/**
 * Smoothly scrolls a section element to the top using requestAnimationFrame.
 */
function smoothScrollToTop(el) {
  if (!el || el.scrollTop === 0) return;
  const start = el.scrollTop;
  const duration = 400;
  const startTime = performance.now();

  function step(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // Ease out cubic
    const ease = 1 - Math.pow(1 - progress, 3);
    el.scrollTop = start * (1 - ease);
    if (progress < 1) {
      requestAnimationFrame(step);
    }
  }
  requestAnimationFrame(step);
}

(function () {
  "use strict";

  /**
   * Easy selector helper function
   */
  const select = (el, all = false) => {
    el = el.trim()
    if (all) {
      return [...document.querySelectorAll(el)]
    } else {
      return document.querySelector(el)
    }
  }

  /**
   * Easy event listener function
   */
  const on = (type, el, listener, all = false) => {
    let selectEl = select(el, all)

    if (selectEl) {
      if (all) {
        selectEl.forEach(e => e.addEventListener(type, listener))
      } else {
        selectEl.addEventListener(type, listener)
      }
    }
  }

  /**
   * Mobile nav toggle
   */
  on('click', '.mobile-nav-toggle', function (e) {
    select('#navbar').classList.toggle('navbar-mobile')
    document.body.classList.toggle('mobile-nav-active')
    this.classList.toggle('bi-list')
    this.classList.toggle('bi-x')
    // $('#Console').classList.add('hidden');
  })
  /**
   * Scrool with ofset on links with a class name .scrollto
   */
  on('click', '#navbar .nav-link', function (e) {
    this.blur();
    let section = select(this.hash)
    if (section) {
      e.preventDefault()

      let navbar = select('#navbar')
      let header = select('#header')
      let sections = select('section', true)
      let navlinks = select('#navbar .nav-link', true)

      navlinks.forEach((item) => {
        item.classList.remove('active')
      })

      this.classList.add('active')

      if (navbar.classList.contains('navbar-mobile')) {
        navbar.classList.remove('navbar-mobile')
        document.body.classList.remove('mobile-nav-active')
        let navbarToggle = select('.mobile-nav-toggle')
        navbarToggle.classList.toggle('bi-list')
        navbarToggle.classList.toggle('bi-x')
      }
      if (this.hash == "#Console") {
        document.querySelector('.console').classList.remove('hidden');
        konsole.elem.html(""); // Clear any previous prints to start fresh
        konsole.print("Initializing Waqar OS terminal...")
          .then(() => {
            setTimeout(() => {
              konsole.exec("neofetch");
            }, 600);
          });
        konsole.elem.focus();
      } else {
        document.querySelector('.console').classList.add('hidden');
        konsole.elem.html("");
      }

      if (this.hash == '#header') {
        header.classList.remove('header-top')
        sections.forEach((item) => {
          item.classList.remove('section-show')
        })
        return;
      }

      const isExpClick = this.classList.contains('scrollto-exp');

      if (!header.classList.contains('header-top')) {
        header.classList.add('header-top')
        setTimeout(function () {
          sections.forEach((item) => {
            item.classList.remove('section-show')
          })
          section.classList.add('section-show')
          if (isExpClick) {
            setTimeout(() => {
              const expTitle = document.getElementById('experience-title');
              if (expTitle) expTitle.scrollIntoView({ behavior: 'smooth' });
            }, 100);
          } else {
            smoothScrollToTop(section);
          }
        }, 350);
      } else {
        sections.forEach((item) => {
          item.classList.remove('section-show')
        })
        section.classList.add('section-show')
        if (isExpClick) {
          setTimeout(() => {
            const expTitle = document.getElementById('experience-title');
            if (expTitle) expTitle.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        } else {
          smoothScrollToTop(section);
        }
      }

      // scrollto(this.hash)
    }
  }, true)

  /*
  new Swiper('.testimonials-swiper', {
    keyboard: {
      enabled: true,
    },
    grabCursor: true,
    pagination: {
      el: ".swiper-pagination",
      clickable: true,
      dynamicBullets: true,
    },
    navigation: {
      nextEl: ".swiper-button-next",
      prevEl: ".swiper-button-prev",
    },
  });
  */

  /**
   * Preloader
   */
  let preloader = select('#preloader');
  if (preloader) {
    window.addEventListener('load', () => {
      preloader.style.opacity = '0';
      preloader.style.visibility = 'hidden';
      setTimeout(() => {
        preloader.remove();
      }, 500);
    });
  }

  /**
   * Animation Intersection Observer
   */
  const animateElements = document.querySelectorAll('.section-title, .info-box, .about-me .content, .skill-category, .experience-item, .portfolio-item');
  animateElements.forEach((el, index) => {
    el.classList.add('animate-element');
    // Alternate fade directions based on type
    if (el.classList.contains('section-title')) {
      el.classList.add('animate-fade-down');
    } else {
      el.classList.add('animate-fade-up');
    }
  });

  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
  };

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-in');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll('.animate-element').forEach(el => {
    observer.observe(el);
  });

})()

// Tabs removed in favor of single-page vertical scrolling layout
// Sending Email
const form = document.querySelector('.contact_form');

function showFormFeedback(type, message) {
  const feedback = form.querySelector('.form-feedback');
  const btn = form.querySelector('.btn-send-msg');
  feedback.className = 'form-feedback mt-3';

  if (type === 'loading') {
    feedback.classList.add('loading');
    feedback.style.display = 'block';
    feedback.textContent = '';
    btn.disabled = true;
    btn.textContent = 'Sending...';
  } else if (type === 'success') {
    feedback.classList.add('sent-message');
    feedback.style.display = 'block';
    feedback.textContent = message;
    btn.disabled = false;
    btn.textContent = 'Send Message';
  } else if (type === 'error') {
    feedback.classList.add('error-message');
    feedback.style.display = 'block';
    feedback.textContent = message;
    btn.disabled = false;
    btn.textContent = 'Send Message';
  } else {
    feedback.style.display = 'none';
    btn.disabled = false;
    btn.textContent = 'Send Message';
  }
}

function sendEmail() {
  emailjs.init("jZodjXjZwfNf2QSco");
  var params = {
    userName: $('.userName').val(),
    userEmail: $('.sender').val(),
    subject: $('.senderSubject').val(),
    message: $('.message').val()
  };

  showFormFeedback('loading');

  emailjs.send("service_wjphzpa", "template_iwtvq1f", params).then(function (res) {
    if (res.status == 200) {
      form.reset();
      showFormFeedback('success', "Message sent successfully! I'll get back to you soon.");
      setTimeout(() => showFormFeedback('hide'), 6000);
    } else {
      showFormFeedback('error', 'Something went wrong. Please try again.');
    }
  }).catch(function () {
    showFormFeedback('error', 'Failed to send message. Please check your connection and try again.');
  });
}