/* MeStyle Studio — interactions: Lenis smooth scroll + GSAP ScrollTrigger reveals */

document.addEventListener("DOMContentLoaded", () => {
  gsap.registerPlugin(ScrollTrigger);

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const canHover = window.matchMedia("(pointer: fine)").matches;

  /* ---------- Lenis smooth scroll ---------- */
  const lenis = new Lenis({
    duration: 1.1,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
  });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  /* smooth anchor links */
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (id.length > 1 && document.querySelector(id)) {
        e.preventDefault();
        lenis.scrollTo(id, { offset: -20 });
      }
    });
  });

  /* ---------- scroll progress bar ---------- */
  const bar = document.getElementById("progressBar");
  ScrollTrigger.create({
    trigger: document.body,
    start: "top top",
    end: "bottom bottom",
    onUpdate: (self) => { bar.style.width = self.progress * 100 + "%"; },
  });

  /* ---------- custom cursor (skip entirely on touch — no pointer to follow, just wasted cycles) ---------- */
  if (canHover) {
    const dot = document.getElementById("cursorDot");
    const label = document.getElementById("cursorLabel");
    let mx = 0, my = 0;
    window.addEventListener("mousemove", (e) => { mx = e.clientX; my = e.clientY; });
    gsap.ticker.add(() => {
      gsap.set(dot, { x: mx, y: my });
      gsap.set(label, { x: mx, y: my });
    });
    document.querySelectorAll(".masonry__tile").forEach((el) => {
      el.addEventListener("mouseenter", () => {
        gsap.to(label, { scale: 1, opacity: 1, duration: 0.35, ease: "power3.out" });
        gsap.to(dot, { opacity: 0, duration: 0.2 });
      });
      el.addEventListener("mouseleave", () => {
        gsap.to(label, { scale: 0, opacity: 0, duration: 0.3, ease: "power3.in" });
        gsap.to(dot, { opacity: 1, duration: 0.2 });
      });
    });

    /* ---------- magnetic buttons ---------- */
    document.querySelectorAll(".magnetic").forEach((el) => {
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        const relX = e.clientX - r.left - r.width / 2;
        const relY = e.clientY - r.top - r.height / 2;
        gsap.to(el, { x: relX * 0.35, y: relY * 0.45, duration: 0.4, ease: "power3.out" });
      });
      el.addEventListener("mouseleave", () => {
        gsap.to(el, { x: 0, y: 0, duration: 0.5, ease: "elastic.out(1,0.4)" });
      });
    });
  }

  /* ---------- hero intro motion (skipped/short-circuited for prefers-reduced-motion) ---------- */
  if (reduceMotion) {
    gsap.set(".hero__title .line", { yPercent: 0, scale: 1 });
  } else {
    gsap.set(".hero__title .line", { yPercent: 110, scale: (i) => (i === 1 ? 0.96 : 1) });
    gsap.set(".hero__badge-row .mark-circle", { opacity: 0, scale: 0.6 });

    const tl = gsap.timeline({ delay: 0.15 });
    tl.to(".hero__title .line", { yPercent: 0, scale: 1, duration: 1.1, ease: "power4.out", stagger: 0.1 })
      .from(".hero__badge-row .pill:first-of-type", { opacity: 0, x: -50, duration: 0.6, ease: "power3.out" }, 0.1)
      .to(".hero__badge-row .mark-circle", { opacity: 1, scale: 1, duration: 0.5, ease: "back.out(2)" }, 0.22)
      .from(".hero__badge-row .pill:last-of-type", { opacity: 0, x: 50, duration: 0.6, ease: "power3.out" }, 0.1)
      .from(".hero__eyebrow", { opacity: 0, y: 14, duration: 0.6, ease: "power2.out" }, 0.2)
      .from(".hero__tagline", { opacity: 0, y: 14, duration: 0.6, ease: "power2.out" }, 0.55)
      .from(".hero__tags .pill", {
        opacity: 0,
        x: (i) => (i % 2 === 0 ? -70 : 70),
        duration: 0.7,
        stagger: 0.05,
        ease: "power3.out",
      }, 0.6)
      .from(".scroll-cue", { opacity: 0, duration: 0.6 }, 1);
  }

  /* ---------- generic [data-reveal] fade-up on scroll ---------- */
  document.querySelectorAll("[data-reveal]").forEach((el) => {
    if (el.closest(".hero") || el.closest(".nav")) return; // hero handled separately, nav visible immediately
    gsap.fromTo(
      el,
      { opacity: 0, y: 40 },
      {
        opacity: 1, y: 0, duration: 0.9, ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 88%", toggleActions: "play none none none" },
      }
    );
  });

  /* ---------- stats counter: run 0 -> target on scroll into view ---------- */
  document.querySelectorAll(".stats__num").forEach((num) => {
    const target = parseInt(num.dataset.count, 10);
    const counter = { val: 0 };
    num.textContent = "0";
    ScrollTrigger.create({
      trigger: num,
      start: "top 85%",
      once: true,
      onEnter: () => {
        gsap.to(counter, {
          val: target,
          duration: 1.8,
          ease: "power2.out",
          onUpdate() { num.textContent = Math.round(counter.val); },
        });
      },
    });
  });

  /* ---------- work masonry: tile reveal + gentle ambient column drift ---------- */
  if (!reduceMotion) {
    gsap.utils.toArray(".masonry__col").forEach((col, i) => {
      const dir = col.dataset.drift === "-1" ? -1 : 1;
      gsap.to(col, {
        y: dir * 26,
        duration: 6 + i * 1.3,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
      });
    });
  }

  /* ---------- work filter tabs (work.html only) ---------- */
  const filterBar = document.querySelector(".work-filter");
  if (filterBar) {
    const buttons = filterBar.querySelectorAll("button");
    const tiles = document.querySelectorAll(".masonry__tile[data-category]");
    buttons.forEach((btn) => {
      btn.addEventListener("click", () => {
        buttons.forEach((b) => b.classList.remove("is-active"));
        btn.classList.add("is-active");
        const cat = btn.dataset.filter;
        tiles.forEach((tile) => {
          const show = cat === "all" || tile.dataset.category === cat;
          gsap.to(tile, {
            opacity: show ? 1 : 0,
            scale: show ? 1 : 0.92,
            duration: 0.3,
            ease: "power2.out",
            onStart() { if (show) tile.style.display = ""; },
            onComplete() { if (!show) tile.style.display = "none"; },
          });
        });
      });
    });
  }

  /* ---------- project lightbox (work.html only) ---------- */
  const lightbox = document.getElementById("lightbox");
  if (lightbox) {
    /* media: mix of images and videos, IG-post style. video slides only fetch
       their file once they become the active slide (preload="none" + src set
       on demand) so a project with a clip doesn't cost anything until opened. */
    const img = (name) => ({ type: "image", src: `assets/work/${name}.webp` });
    const PROJECTS = {
      wangwela: {
        title: "Wangwela",
        category: "Brand-Design",
        desc: "อัตลักษณ์แบรนด์ให้ร้านนวด \"วางเวลา\" ด้วยโลโก้รูปมือที่สื่อถึงความใส่ใจและการดูแลอย่างอ่อนโยน พร้อมชุดโทนสีเขียวธรรมชาติ",
        media: [img("wangwela-01"), img("wangwela-02"), img("wangwela-03")],
      },
      dhw: {
        title: "DID Hardware House",
        category: "Brand-Design",
        desc: "รีแบรนด์ร้านฮาร์ดแวร์จากรุ่นพ่อสู่รุ่นลูก ด้วยโลโก้ทันสมัย เส้นสายชัดเจน และสีแดงที่สื่อถึงพลังและความเชื่อมั่น",
        media: [img("dhw-01"), img("dhw-02"), img("dhw-03")],
      },
      leymo: {
        title: "Leymo",
        category: "Illustration",
        desc: "ออกแบบคาแรกเตอร์แมวมงสีเหลืองสดใส ให้เป็นตัวแทนแบรนด์ที่จดจำง่าย ใช้ได้ตั้งแต่นามบัตรไปจนถึงเว็บไซต์และของพรีเมียม",
        media: [img("leymo-01")],
      },
      worthy: {
        title: "Worthy Design",
        category: "Social Media",
        desc: "คอนเทนต์ Before & After สำหรับสตูดิโอตกแต่งภายใน จัดวางเลย์เอาต์ให้ดูพรีเมียมและน่าเชื่อถือทุกโพสต์",
        media: [img("worthy-01")],
      },
      pulse: {
        title: "Pulse Fitness",
        category: "Brand-Design",
        desc: "โลโก้และอัตลักษณ์สำหรับฟิตเนสที่ต้องการความคม กระฉับกระเฉง ใช้กราฟิกคลื่นหัวใจสื่อถึงพลังและความมีชีวิตชีวา",
        media: [img("pulse-01")],
      },
      bionest: {
        title: "Bionest",
        category: "Packaging",
        desc: "แพ็กเกจจิ้งเครื่องดื่มเพื่อสุขภาพ พร้อมโปสเตอร์เกรเดียนต์สีสันสดใส ภายใต้แนวคิด \"Crafted by nature, designed for you\"",
        media: [img("bionest-01")],
      },
      hth: {
        title: "HTH",
        category: "Brand-Design",
        desc: "อัตลักษณ์แบรนด์เสื้อผ้าสำหรับคนที่รักการวิ่ง ดีไซน์โลโก้ที่เรียบ ทันสมัย ใช้งานได้จริงทั้งบนสินค้าและสื่อโฆษณา",
        media: [img("hth-01")],
      },
      // to add a video slide to a project later: { type: "video", src: "assets/work/xxx.mp4", poster: "assets/work/thumb/xxx.webp" }
    };

    const lbStage = document.getElementById("lightboxStage");
    const lbDots = document.getElementById("lightboxDots");
    const lbTitle = document.getElementById("lightboxTitle");
    const lbDesc = document.getElementById("lightboxDesc");
    const lbCategory = document.getElementById("lightboxCategory");
    const lbCount = document.getElementById("lightboxCount");
    const lbMedia = document.getElementById("lightboxMedia");
    const lbPrev = lightbox.querySelector("[data-lightbox-prev]");
    const lbNext = lightbox.querySelector("[data-lightbox-next]");
    let activeSlug = null;
    let activeIndex = 0;
    let lastFocused = null;

    function renderSlide() {
      const project = PROJECTS[activeSlug];
      const slide = project.media[activeIndex];

      lbStage.innerHTML = "";
      if (slide.type === "video") {
        const video = document.createElement("video");
        video.src = slide.src;
        if (slide.poster) video.poster = slide.poster;
        video.muted = true;
        video.loop = true;
        video.playsInline = true;
        video.autoplay = true;
        video.controls = false;
        video.preload = "none";
        lbStage.appendChild(video);
      } else {
        const image = document.createElement("img");
        image.src = slide.src;
        image.alt = `${project.title} — ${activeIndex + 1}`;
        lbStage.appendChild(image);
      }

      const multi = project.media.length > 1;
      lbCount.textContent = multi ? `${activeIndex + 1} / ${project.media.length}` : "";
      lbPrev.style.display = multi ? "" : "none";
      lbNext.style.display = multi ? "" : "none";

      lbDots.querySelectorAll(".lightbox__dot").forEach((dot, i) => {
        dot.classList.toggle("is-active", i === activeIndex);
      });
    }

    function buildDots(project) {
      lbDots.innerHTML = "";
      if (project.media.length <= 1) return;
      project.media.forEach((_, i) => {
        const dot = document.createElement("button");
        dot.type = "button";
        dot.className = "lightbox__dot";
        dot.setAttribute("aria-label", `ไปที่รูป ${i + 1}`);
        dot.addEventListener("click", () => { activeIndex = i; renderSlide(); });
        lbDots.appendChild(dot);
      });
    }

    function openLightbox(slug, triggerEl) {
      const project = PROJECTS[slug];
      if (!project) return;
      activeSlug = slug;
      activeIndex = 0;
      lastFocused = triggerEl || document.activeElement;
      lbTitle.textContent = project.title;
      lbDesc.textContent = project.desc;
      lbCategory.textContent = project.category;
      buildDots(project);
      renderSlide();
      lightbox.classList.add("is-open");
      lightbox.setAttribute("aria-hidden", "false");
      lightbox.querySelector(".lightbox__close").focus();
      lenis.stop();
      document.body.style.overflow = "hidden";
      if (!reduceMotion) {
        gsap.fromTo(".lightbox__panel", { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: "power3.out" });
      }
    }

    function closeLightbox() {
      lightbox.classList.remove("is-open");
      lightbox.setAttribute("aria-hidden", "true");
      lbStage.innerHTML = ""; // stop any playing video
      lenis.start();
      document.body.style.overflow = "";
      if (lastFocused) lastFocused.focus();
    }

    function step(delta) {
      const project = PROJECTS[activeSlug];
      activeIndex = (activeIndex + delta + project.media.length) % project.media.length;
      renderSlide();
    }

    document.querySelectorAll(".masonry__tile[data-project]").forEach((tile) => {
      tile.addEventListener("click", () => openLightbox(tile.dataset.project, tile));
    });
    lightbox.querySelectorAll("[data-lightbox-close]").forEach((el) => el.addEventListener("click", closeLightbox));
    lbPrev.addEventListener("click", () => step(-1));
    lbNext.addEventListener("click", () => step(1));
    document.addEventListener("keydown", (e) => {
      if (!lightbox.classList.contains("is-open")) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") step(-1);
      if (e.key === "ArrowRight") step(1);
    });

    /* swipe left/right, IG-style */
    let touchStartX = null;
    lbMedia.addEventListener("touchstart", (e) => { touchStartX = e.touches[0].clientX; }, { passive: true });
    lbMedia.addEventListener("touchend", (e) => {
      if (touchStartX === null) return;
      const dx = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(dx) > 50) step(dx > 0 ? -1 : 1);
      touchStartX = null;
    }, { passive: true });
  }

  /* ---------- work divider script text scale-in ---------- */
  gsap.fromTo(
    ".work-divider__script",
    { scale: 0.85, opacity: 0 },
    {
      scale: 1, opacity: 1, duration: 1.2, ease: "power3.out",
      scrollTrigger: { trigger: ".work-divider", start: "top 70%" },
    }
  );

  /* ---------- pricing card stagger ---------- */
  ScrollTrigger.batch(".price-card", {
    start: "top 88%",
    onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, duration: 0.7, stagger: 0.12, ease: "power3.out" }),
  });
  gsap.set(".price-card", { opacity: 0, y: 40 });

  /* ---------- service rows stagger ---------- */
  ScrollTrigger.batch(".service-row", {
    start: "top 90%",
    onEnter: (batch) => gsap.to(batch, { opacity: 1, x: 0, duration: 0.6, stagger: 0.08, ease: "power3.out" }),
  });
  gsap.set(".service-row", { opacity: 0, x: -30 });

  /* ---------- FAQ accordion ---------- */
  document.querySelectorAll(".faq-item").forEach((item) => {
    const q = item.querySelector(".faq-item__q");
    const a = item.querySelector(".faq-item__a");
    q.addEventListener("click", () => {
      const isOpen = item.classList.contains("open");
      document.querySelectorAll(".faq-item.open").forEach((openItem) => {
        if (openItem !== item) {
          openItem.classList.remove("open");
          gsap.to(openItem.querySelector(".faq-item__a"), { height: 0, duration: 0.4, ease: "power2.inOut" });
        }
      });
      if (isOpen) {
        item.classList.remove("open");
        gsap.to(a, { height: 0, duration: 0.4, ease: "power2.inOut" });
      } else {
        item.classList.add("open");
        gsap.set(a, { height: "auto" });
        const h = a.offsetHeight;
        gsap.fromTo(a, { height: 0 }, { height: h, duration: 0.45, ease: "power2.inOut" });
      }
    });
  });

  /* ---------- nav background on scroll ---------- */
  const nav = document.querySelector(".nav");
  ScrollTrigger.create({
    start: 60,
    end: 99999,
    onUpdate: (self) => {
      if (self.scroll() > 60) nav.style.background = "rgba(236,231,220,.85)";
      else nav.style.background = "transparent";
      nav.style.backdropFilter = self.scroll() > 60 ? "blur(10px)" : "none";
    },
  });

  /* refresh on load */
  window.addEventListener("load", () => ScrollTrigger.refresh());
});
