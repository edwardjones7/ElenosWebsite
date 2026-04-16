/* ============================================
   PROJECT 16 — Main Script
   ============================================ */

const projects = [
  {
    id: "bathroom-1",
    category: "bathroom",
    title: "Full Bathroom Renovation",
    description: "Custom tile flooring, recessed lighting, wainscoting & new vanity",
    images: [
      "images/bathroom/project1/Full bathroom renovation completed.New tile flooringRecessed lightingCustom wainscotingNew vanit.jpg",
      "images/bathroom/project1/Full bathroom renovation completed.New tile flooringRecessed lightingCustom wainscotingNew vanit (1).jpg",
      "images/bathroom/project1/Full bathroom renovation completed.New tile flooringRecessed lightingCustom wainscotingNew vanit (3).jpg",
      "images/bathroom/project1/Full bathroom renovation completed.New tile flooringRecessed lightingCustom wainscotingNew vanit (4).jpg",
      "images/bathroom/project1/Full bathroom renovation completed.New tile flooringRecessed lightingCustom wainscotingNew vanit (5).jpg",
      "images/bathroom/project1/Full bathroom renovation completed.New tile flooringRecessed lightingCustom wainscotingNew vanit (6).jpg"
    ]
  },
  {
    id: "bathroom-2",
    category: "bathroom",
    title: "Shower & Ceiling Repair",
    description: "Complete shower rebuild to fix a ceiling leak, with premium finishes",
    images: [
      "images/bathroom/project2/Another project complete!This client\u2019s old shower had been leaking through the ceiling due to po.jpg",
      "images/bathroom/project2/Another project complete!This client\u2019s old shower had been leaking through the ceiling due to po (1).jpg",
      "images/bathroom/project2/Another project complete!This client\u2019s old shower had been leaking through the ceiling due to po (2).jpg",
      "images/bathroom/project2/Another project complete!This client\u2019s old shower had been leaking through the ceiling due to po (3).jpg",
      "images/bathroom/project2/Another project complete!This client\u2019s old shower had been leaking through the ceiling due to po (4).jpg",
      "images/bathroom/project2/Another project complete!This client\u2019s old shower had been leaking through the ceiling due to po (5).jpg",
      "images/bathroom/project2/Another project complete!This client\u2019s old shower had been leaking through the ceiling due to po (6).jpg",
      "images/bathroom/project2/Another project complete!This client\u2019s old shower had been leaking through the ceiling due to po (7).jpg",
      "images/bathroom/project2/Another project complete!This client\u2019s old shower had been leaking through the ceiling due to po (8).jpg"
    ]
  },
  {
    id: "kitchen-1",
    category: "kitchen",
    title: "Kitchen Refresh",
    description: "Brightened the space and improved flow with updated lighting and design",
    images: [
      "images/kitchen/Just finished up our latest project. Kitchen refresh that brightened the space and improved flow.jpg",
      "images/kitchen/Just finished up our latest project. Kitchen refresh that brightened the space and improved flow (1).jpg",
      "images/kitchen/Just finished up our latest project. Kitchen refresh that brightened the space and improved flow (2).jpg",
      "images/kitchen/Just finished up our latest project. Kitchen refresh that brightened the space and improved flow (3).jpg",
      "images/kitchen/Just finished up our latest project. Kitchen refresh that brightened the space and improved flow (4).jpg",
      "images/kitchen/Just finished up our latest project. Kitchen refresh that brightened the space and improved flow (5).jpg",
      "images/kitchen/Just finished up our latest project. Kitchen refresh that brightened the space and improved flow (6).jpg",
      "images/kitchen/Just finished up our latest project. Kitchen refresh that brightened the space and improved flow (7).jpg"
    ]
  },
  {
    id: "sunroom-1",
    category: "sunroom",
    title: "Sunroom Remodel",
    description: "Down to the framing — new flooring, windows, recessed lighting",
    images: [
      "images/sunroon/Our first job of 2026 is a wrap! We took this sunroom remodel all the way down to the framing. T.jpg",
      "images/sunroon/Our first job of 2026 is a wrap! We took this sunroom remodel all the way down to the framing. T (1).jpg",
      "images/sunroon/Our first job of 2026 is a wrap! We took this sunroom remodel all the way down to the framing. T (2).jpg",
      "images/sunroon/Our first job of 2026 is a wrap! We took this sunroom remodel all the way down to the framing. T (3).jpg",
      "images/sunroon/Our first job of 2026 is a wrap! We took this sunroom remodel all the way down to the framing. T (4).jpg",
      "images/sunroon/Our first job of 2026 is a wrap! We took this sunroom remodel all the way down to the framing. T (5).jpg",
      "images/sunroon/Our first job of 2026 is a wrap! We took this sunroom remodel all the way down to the framing. T (6).jpg"
    ]
  },
  {
    id: "deck-1",
    category: "deck",
    title: "Deck Refresh",
    description: "Cleaned, removed mold and mildew, and applied a fresh stain",
    images: [
      "images/deck/Quick deck refresh just in time for fall. We cleaned, removed mold and mildew, and applied a fre.jpg",
      "images/deck/Quick deck refresh just in time for fall. We cleaned, removed mold and mildew, and applied a fre (1).jpg",
      "images/deck/Quick deck refresh just in time for fall. We cleaned, removed mold and mildew, and applied a fre (2).jpg",
      "images/deck/Quick deck refresh just in time for fall. We cleaned, removed mold and mildew, and applied a fre (3).jpg"
    ]
  },
  {
    id: "custom-1",
    category: "custom",
    title: "Custom Walnut Front Desk",
    description: "Fully custom walnut front desk for a retail location",
    images: [
      "images/customDesk/Custom walnut front desk for a retail location. This is fully custom to fit the needs of a speci.jpg"
    ]
  }
];

// ---- Init ----
document.addEventListener("DOMContentLoaded", () => {
  initNav();
  initHeroSlider();
  initReveal();
  initGallery();
  initLightbox();
  initReviews();
  initCounters();
  initServiceLinks();
});

/* ============================================
   HERO SLIDER
   ============================================ */
function initHeroSlider() {
  const imgs = document.querySelectorAll(".showcase-img");
  const bar = document.getElementById("heroBar");
  const label = document.getElementById("heroLabel");
  const thumbs = document.querySelectorAll(".showcase-thumb");
  if (!imgs.length) return;

  const labels = ["Bathroom Renovation", "Kitchen Refresh", "Sunroom Remodel", "Custom Walnut Desk", "Deck Refinishing"];
  const duration = 4500; // ms per slide
  let current = 0;
  let startTime = null;
  let rafId = null;

  function goTo(index) {
    imgs.forEach(img => img.classList.remove("active"));
    thumbs.forEach(t => t.classList.remove("active"));
    current = index;
    imgs[current].classList.add("active");
    if (thumbs[Math.min(current, thumbs.length - 1)]) {
      // Map: 0->0, 1->1, 2->2, 3->2, 4->2 (only 3 thumbs)
      thumbs.forEach(t => t.classList.remove("active"));
      const thumbIdx = Math.min(current, thumbs.length - 1);
      thumbs[thumbIdx].classList.add("active");
    }
    label.textContent = labels[current] || "";
    startTime = null;
  }

  function tick(now) {
    if (!startTime) startTime = now;
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    bar.style.width = (progress * 100) + "%";

    if (progress >= 1) {
      goTo((current + 1) % imgs.length);
    }
    rafId = requestAnimationFrame(tick);
  }

  // Thumb click
  thumbs.forEach(t => {
    t.addEventListener("click", () => {
      const idx = parseInt(t.dataset.index);
      goTo(idx);
    });
  });

  rafId = requestAnimationFrame(tick);
}

/* ============================================
   NAVIGATION
   ============================================ */
function initNav() {
  const nav = document.getElementById("navbar");
  const ham = document.querySelector(".hamburger");
  const menu = document.getElementById("mobileMenu");

  window.addEventListener("scroll", () => {
    nav.classList.toggle("scrolled", window.scrollY > 60);
  }, { passive: true });

  ham.addEventListener("click", () => {
    const open = ham.classList.toggle("active");
    menu.classList.toggle("active");
    ham.setAttribute("aria-expanded", open);
    document.body.style.overflow = open ? "hidden" : "";
  });

  menu.querySelectorAll("a").forEach(a => {
    a.addEventListener("click", () => {
      ham.classList.remove("active");
      menu.classList.remove("active");
      ham.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
    });
  });
}

/* ============================================
   SCROLL REVEAL
   ============================================ */
function initReveal() {
  const els = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window)) {
    els.forEach(e => e.classList.add("visible"));
    return;
  }
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add("visible");
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });
  els.forEach(e => obs.observe(e));
}

/* ============================================
   GALLERY
   ============================================ */
function initGallery() {
  const grid = document.getElementById("galleryGrid");
  projects.forEach(p => {
    const item = document.createElement("div");
    item.className = "gallery-item";
    item.dataset.category = p.category;
    item.dataset.id = p.id;

    const img = document.createElement("img");
    img.src = p.images[0];
    img.alt = p.title;
    img.loading = "lazy";

    const ov = document.createElement("div");
    ov.className = "gallery-overlay";
    ov.innerHTML = `
      <span class="g-cat">${catLabel(p.category)}</span>
      <h3>${p.title}</h3>
      <span class="g-count">${p.images.length} photo${p.images.length > 1 ? "s" : ""}</span>
    `;

    item.append(img, ov);
    grid.appendChild(item);
    item.addEventListener("click", () => openLightbox(p.id));
  });

  document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.addEventListener("click", () => filterGallery(btn.dataset.filter));
  });
}

function catLabel(c) {
  return { bathroom: "Bathroom", kitchen: "Kitchen", sunroom: "Sunroom", deck: "Deck", custom: "Custom Woodwork" }[c] || c;
}

function filterGallery(f) {
  document.querySelectorAll(".filter-btn").forEach(b => b.classList.toggle("active", b.dataset.filter === f));
  document.querySelectorAll(".gallery-item").forEach(item => {
    item.classList.toggle("hidden", f !== "all" && item.dataset.category !== f);
  });
}

/* Service card links -> gallery filter */
function initServiceLinks() {
  document.querySelectorAll(".service-card[data-filter]").forEach(card => {
    card.addEventListener("click", (e) => {
      e.preventDefault();
      const f = card.dataset.filter;
      document.getElementById("gallery").scrollIntoView({ behavior: "smooth" });
      setTimeout(() => filterGallery(f), 400);
    });
  });
}

/* ============================================
   LIGHTBOX
   ============================================ */
let lbProject = null;
let lbIdx = 0;
let touchX = 0;

function initLightbox() {
  const lb = document.getElementById("lightbox");
  lb.querySelector(".lightbox-close").addEventListener("click", closeLb);
  lb.querySelector(".lightbox-prev").addEventListener("click", () => navLb(-1));
  lb.querySelector(".lightbox-next").addEventListener("click", () => navLb(1));

  lb.addEventListener("click", e => {
    if (e.target === lb || e.target.classList.contains("lightbox-main")) closeLb();
  });

  document.addEventListener("keydown", e => {
    if (!lb.classList.contains("active")) return;
    if (e.key === "Escape") closeLb();
    if (e.key === "ArrowLeft") navLb(-1);
    if (e.key === "ArrowRight") navLb(1);
  });

  const main = lb.querySelector(".lightbox-main");
  main.addEventListener("touchstart", e => { touchX = e.changedTouches[0].screenX; }, { passive: true });
  main.addEventListener("touchend", e => {
    const d = touchX - e.changedTouches[0].screenX;
    if (Math.abs(d) > 50) navLb(d > 0 ? 1 : -1);
  }, { passive: true });
}

function openLightbox(id) {
  lbProject = projects.find(p => p.id === id);
  if (!lbProject) return;
  lbIdx = 0;
  updateLb();
  renderThumbs();
  document.getElementById("lightbox").classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeLb() {
  document.getElementById("lightbox").classList.remove("active");
  document.body.style.overflow = "";
}

function navLb(dir) {
  if (!lbProject) return;
  lbIdx = (lbIdx + dir + lbProject.images.length) % lbProject.images.length;
  updateLb();
  updateThumbActive();
}

function updateLb() {
  const img = document.getElementById("lbImage");
  img.style.opacity = "0";
  setTimeout(() => {
    img.src = lbProject.images[lbIdx];
    img.alt = lbProject.title;
    img.style.opacity = "1";
  }, 120);
  document.getElementById("lbCurrent").textContent = lbIdx + 1;
  document.getElementById("lbTotal").textContent = lbProject.images.length;
  document.getElementById("lbTitle").textContent = lbProject.title;
  document.getElementById("lbDesc").textContent = lbProject.description;

  const single = lbProject.images.length <= 1;
  document.querySelector(".lightbox-prev").style.display = single ? "none" : "";
  document.querySelector(".lightbox-next").style.display = single ? "none" : "";
}

function renderThumbs() {
  const c = document.getElementById("lbThumbs");
  c.innerHTML = "";
  if (lbProject.images.length <= 1) { c.style.display = "none"; return; }
  c.style.display = "flex";
  lbProject.images.forEach((src, i) => {
    const t = document.createElement("img");
    t.className = "lb-thumb" + (i === 0 ? " active" : "");
    t.src = src;
    t.alt = `Photo ${i + 1}`;
    t.loading = "lazy";
    t.addEventListener("click", () => { lbIdx = i; updateLb(); updateThumbActive(); });
    c.appendChild(t);
  });
}

function updateThumbActive() {
  document.querySelectorAll(".lb-thumb").forEach((t, i) => t.classList.toggle("active", i === lbIdx));
}

/* ============================================
   REVIEWS CAROUSEL
   ============================================ */
function initReviews() {
  const track = document.getElementById("reviewsTrack");
  const cards = track.querySelectorAll(".review-card");
  const dotsContainer = document.getElementById("carouselDots");
  const prevBtn = document.querySelector(".carousel-prev");
  const nextBtn = document.querySelector(".carousel-next");

  let perView = getPerView();
  let current = 0;
  let totalPages = Math.ceil(cards.length / perView);
  let autoTimer;

  function getPerView() {
    if (window.innerWidth < 768) return 1;
    if (window.innerWidth < 1024) return 2;
    return 3;
  }

  function buildDots() {
    dotsContainer.innerHTML = "";
    for (let i = 0; i < totalPages; i++) {
      const d = document.createElement("button");
      d.className = "dot" + (i === 0 ? " active" : "");
      d.addEventListener("click", () => goTo(i));
      dotsContainer.appendChild(d);
    }
  }

  function goTo(page) {
    current = Math.max(0, Math.min(page, totalPages - 1));
    const cardWidth = cards[0].offsetWidth + 20; // gap
    track.style.transform = `translateX(-${current * perView * cardWidth}px)`;
    dotsContainer.querySelectorAll(".dot").forEach((d, i) => d.classList.toggle("active", i === current));
  }

  function next() { goTo((current + 1) % totalPages); }
  function prev() { goTo((current - 1 + totalPages) % totalPages); }

  function startAuto() { autoTimer = setInterval(next, 5000); }
  function stopAuto() { clearInterval(autoTimer); }

  prevBtn.addEventListener("click", () => { prev(); stopAuto(); startAuto(); });
  nextBtn.addEventListener("click", () => { next(); stopAuto(); startAuto(); });

  const carousel = document.getElementById("reviewsCarousel");
  carousel.addEventListener("mouseenter", stopAuto);
  carousel.addEventListener("mouseleave", startAuto);

  // Touch swipe
  let tx = 0;
  carousel.addEventListener("touchstart", e => { tx = e.changedTouches[0].screenX; stopAuto(); }, { passive: true });
  carousel.addEventListener("touchend", e => {
    const d = tx - e.changedTouches[0].screenX;
    if (Math.abs(d) > 50) d > 0 ? next() : prev();
    startAuto();
  }, { passive: true });

  function handleResize() {
    const newPV = getPerView();
    if (newPV !== perView) {
      perView = newPV;
      totalPages = Math.ceil(cards.length / perView);
      current = 0;
      buildDots();
      goTo(0);
    }
  }

  window.addEventListener("resize", handleResize);
  buildDots();
  startAuto();
}

/* ============================================
   COUNTER ANIMATION
   ============================================ */
function initCounters() {
  const counters = document.querySelectorAll(".counter");
  if (!counters.length) return;

  let done = false;
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting && !done) {
        done = true;
        animateCounters(counters);
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.5 });

  obs.observe(counters[0].closest(".about-stats"));
}

function animateCounters(counters) {
  counters.forEach(el => {
    const target = parseInt(el.dataset.target);
    const suffix = el.dataset.suffix || "";
    const start = performance.now();
    const dur = 1800;

    function tick(now) {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(eased * target) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });
}

