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
    /* assets/work/ is organized by category/brand folder (not a flat dump) so
       the backend is easy to navigate — e.g. assets/work/Brand-Design/Clevia/.
       This lookup lets every img("wangwela-01") call site below stay exactly
       as-is; only this map needs updating if a project's folder ever moves. */
    const PROJECT_DIRS = {
      wangwela: "Brand-Design/Wangwela",
      dhw: "Brand-Design/DHW",
      pulse: "Brand-Design/Pulse",
      hth: "Brand-Design/HTH",
      okgo: "Brand-Design/OK-GO",
      clevia: "Brand-Design/Clevia",
      vellette: "Brand-Design/Vellette",
      leymo: "Illustration/Leymo",
      worthy: "Brand-Design/Worthy",
      bionest: "Packaging/Bionest",
      radsaebnua: "Brand-Design/RadSaebNua",
      flvor: "Brand-Design/Flvor",
      wysh: "Brand-Design/Wysh",
      kero: "Brand-Design/Kero",
    };
    const img = (name) => {
      const slug = name.replace(/-\d+$/, "");
      const dir = PROJECT_DIRS[slug];
      return { type: "image", src: `assets/work/${dir}/${name}.webp` };
    };
    const PROJECTS = {
      wangwela: {
        title: "Wangwela",
        category: "Brand-Design",
        desc: "อัตลักษณ์แบรนด์ให้ร้านนวด \"วางเวลา\" ด้วยโลโก้รูปมือที่สื่อถึงความใส่ใจและการดูแลอย่างอ่อนโยน พร้อมโทนสีเขียว-น้ำตาลอบอุ่นแบบธรรมชาติ ให้ความรู้สึกผ่อนคลายทุกจุดสัมผัสแบรนด์",
        media: [
          img("wangwela-01"), img("wangwela-02"), img("wangwela-03"), img("wangwela-04"),
          img("wangwela-05"), img("wangwela-06"), img("wangwela-07"), img("wangwela-08"),
          img("wangwela-09"), img("wangwela-10"),
        ],
      },
      dhw: {
        title: "DID Hardware House",
        category: "Brand-Design",
        desc: "รีแบรนด์ร้านฮาร์ดแวร์จากรุ่นพ่อสู่รุ่นลูก ด้วยโลโก้ทันสมัย เส้นสายชัดเจน และสีแดงที่สื่อถึงพลังและความเชื่อมั่น ประยุกต์ใช้ตั้งแต่ยูนิฟอร์มพนักงาน บัตรพนักงาน ไปจนถึงป้ายโฆษณากลางแจ้ง",
        media: [
          img("dhw-01"), img("dhw-02"), img("dhw-03"),
          img("dhw-04"), img("dhw-05"), img("dhw-06"),
        ],
      },
      leymo: {
        title: "Leymo",
        category: "Illustration",
        desc: "ออกแบบคาแรกเตอร์แมวมงสีเหลืองสดใส \"เลย์โม\" ให้เป็นตัวแทนแบรนด์ที่จดจำง่าย ใช้ได้ตั้งแต่หน้าร้าน กระเป๋าผ้า สติกเกอร์ ไปจนถึงไอคอนแอปพลิเคชัน",
        media: [
          img("leymo-01"), img("leymo-02"), img("leymo-03"),
          img("leymo-04"), img("leymo-05"), img("leymo-06"),
        ],
      },
      worthy: {
        title: "Worthy Design",
        category: "Brand-Design",
        desc: "อัตลักษณ์แบรนด์สตูดิโอตกแต่งภายใน \"Worthy Decorate Co., Ltd\" ภายใต้แนวคิด \"Design your living, Design your life\" ตั้งแต่ป้ายหน้าร้าน บรรจุภัณฑ์ Brand Concept ไปจนถึงคอนเทนต์ Before & After บนโซเชียลมีเดีย",
        media: [
          img("worthy-01"), img("worthy-02"), img("worthy-03"),
          img("worthy-04"), img("worthy-05"),
        ],
      },
      pulse: {
        title: "Pulse Fitness",
        category: "Brand-Design",
        desc: "โลโก้และอัตลักษณ์สำหรับฟิตเนสที่ต้องการความคม กระฉับกระเฉง ใช้กราฟิกคลื่นหัวใจสื่อถึงพลังและความมีชีวิตชีวา โทนสีดำ-เขียวมิ้นต์ทันสมัย ประยุกต์ใช้ตั้งแต่ขวดน้ำ ป้ายหน้าร้าน ไปจนถึงคอนเทนต์โซเชียลมีเดีย",
        media: [
          img("pulse-01"), img("pulse-02"), img("pulse-03"),
          img("pulse-04"), img("pulse-05"), img("pulse-06"),
        ],
      },
      bionest: {
        title: "Bionest",
        category: "Packaging",
        desc: "แพ็กเกจจิ้งและอัตลักษณ์เครื่องดื่มคอมบูชะ \"Bionest\" โทนสีส้ม-เหลืองอบอุ่นที่สื่อถึงความสดชื่นจากธรรมชาติ ภายใต้แนวคิด \"Crafted by nature, designed for you\"",
        media: [
          img("bionest-01"), img("bionest-02"), img("bionest-03"),
          img("bionest-04"), img("bionest-05"), img("bionest-06"),
        ],
      },
      hth: {
        title: "HTH",
        category: "Brand-Design",
        desc: "อัตลักษณ์แบรนด์เสื้อผ้ากีฬาวิ่ง \"HTH\" ภายใต้แนวคิด \"For your stronger tomorrow\" สื่อสารผ่านภาพถ่ายพลังการเคลื่อนไหวและโทนสีดำ-แดงดิบเท่ ใช้งานได้จริงทั้งบนสินค้าและสื่อโฆษณา",
        media: [
          img("hth-01"), img("hth-02"), img("hth-03"),
          img("hth-04"), img("hth-05"), img("hth-06"),
        ],
      },
      okgo: {
        title: "OK! GO",
        category: "Brand-Design",
        desc: "อัตลักษณ์แบรนด์เครื่องดื่มสมูทตี้เพื่อสุขภาพ \"OK!GO\" ตั้งแต่บรรจุภัณฑ์ ไปจนถึงการนำไปใช้บนโซเชียลมีเดีย ภายใต้แนวคิด \"Let's go feel good.\"",
        // videos left out for now — source clips are 13MB/35MB, too heavy to ship;
        // files still live in assets/work/Brand-Design/OK-GO/; re-add once
        // compressed (~3-8MB target) as:
        // { type: "video", src: "assets/work/Brand-Design/OK-GO/okgo-video-0X.mp4", poster: "assets/work/Brand-Design/OK-GO/thumb/okgo-video-0X.webp" }
        // okgo-01/07/08/09 (cover, 2 palettes, packaging labels) removed —
        // their full-size files were taken out of assets/work/Brand-Design/OK-GO/
        media: [
          img("okgo-02"),
          img("okgo-03"),
          img("okgo-04"),
          img("okgo-05"),
          img("okgo-06"),
          img("okgo-10"),
          img("okgo-11"),
          img("okgo-12"),
        ],
      },
      clevia: {
        title: "Clévia",
        category: "Brand-Design",
        desc: "อัตลักษณ์แบรนด์สกินแคร์ \"Clévia\" เน้นความหรูหราเรียบง่ายผ่านฟอนต์เซอริฟคลาสสิกและภาพถ่ายผิวสไตล์นิตยสารความงาม พร้อมบรรจุภัณฑ์โทนครีม-ดำที่ดูสะอาดน่าเชื่อถือ ภายใต้แนวคิด \"Unlock the future of skincare.\"",
        media: [
          img("clevia-01"), img("clevia-02"), img("clevia-03"),
          img("clevia-04"), img("clevia-05"), img("clevia-06"),
        ],
      },
      vellette: {
        title: "Vellette",
        category: "Brand-Design",
        desc: "อัตลักษณ์แบรนด์เครื่องประดับ/แฟชั่น \"Vellette\" ดีไซน์โมโนโครมขาว-ดำ สื่อถึงความมั่นใจแบบเงียบสงบ (a quiet vision for bold women) ผ่านฟอนต์สคริปต์หรูหราและภาพพอร์ตเทรตที่ดูมีระดับ",
        media: [
          img("vellette-01"), img("vellette-02"), img("vellette-03"),
          img("vellette-04"), img("vellette-05"), img("vellette-06"),
        ],
      },
      radsaebnua: {
        title: "แรดแซ่บนัว บันเทิงศิลป์",
        category: "Brand-Design",
        desc: "อัตลักษณ์แบรนด์ร้านส้มตำ \"แรดแซ่บนัว บันเทิงศิลป์\" ผ่านมาสคอตสาวเผ็ดร้อนและโทนสีแดงจัดจ้าน สื่อถึงรสชาติจัดจ้านแบบอีสานแท้ ประยุกต์ใช้ตั้งแต่เมนู เสื้อยืด ไปจนถึงป้ายหน้าร้าน",
        media: [
          img("radsaebnua-01"), img("radsaebnua-02"), img("radsaebnua-03"),
          img("radsaebnua-04"), img("radsaebnua-05"), img("radsaebnua-06"),
          img("radsaebnua-07"), img("radsaebnua-08"), img("radsaebnua-09"),
        ],
      },
      flvor: {
        title: "flvor",
        category: "Brand-Design",
        desc: "อัตลักษณ์แบรนด์กาแฟ \"flvor\" ภายใต้แนวคิด \"Taste your way, live the flavor you love.\" สื่อสารผ่านโลโก้วงกลมคู่มินิมอลและภาพถ่ายเมล็ดกาแฟ/เครื่องดื่มโทนน้ำตาลอบอุ่น พร้อมการ์ดแนะนำรสชาติกาแฟจากแหล่งปลูกต่างๆ",
        media: [
          img("flvor-01"), img("flvor-02"), img("flvor-03"),
          img("flvor-04"), img("flvor-05"),
        ],
      },
      wysh: {
        title: "WYSH Coffee Space",
        category: "Brand-Design",
        desc: "อัตลักษณ์แบรนด์ร้านกาแฟ \"WYSH Coffee Space\" ภายใต้แนวคิด \"A cup of Wysh.\" ตั้งแต่ป้ายห้อย แก้วบรรจุภัณฑ์ ไปจนถึงชุดสี Color Palette ที่กำหนดโทนเขียว-ส้มอบอุ่นให้แบรนด์",
        media: [
          img("wysh-01"), img("wysh-02"), img("wysh-03"),
          img("wysh-04"), img("wysh-05"),
        ],
      },
      kero: {
        title: "kerö",
        category: "Brand-Design",
        desc: "อัตลักษณ์แบรนด์ Wellness Massage & Spa \"kerö\" สื่อถึงความสงบและการฟื้นฟูผ่านโทนภาพถ่ายสีน้ำตาลอบอุ่นและฟอนต์เซอริฟหรูหรา ภายใต้แนวคิด \"Restore balance within yourself\"",
        media: [
          img("kero-01"), img("kero-02"), img("kero-03"),
          img("kero-04"), img("kero-05"),
        ],
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
    const lbDescToggle = document.getElementById("lightboxDescToggle");
    const lbScrollHint = document.getElementById("lightboxScrollHint");
    const lbPanel = lightbox.querySelector(".lightbox__panel");
    const lbPrev = lightbox.querySelector("[data-lightbox-prev]");
    const lbNext = lightbox.querySelector("[data-lightbox-next]");
    let activeSlug = null;
    let activeIndex = 0;
    let lastFocused = null;

    /* show the bounce-arrow only while there's actually more to scroll, and
       hide it once scrolled to the true bottom */
    function updateScrollHint() {
      const hasMore = lbPanel.scrollHeight - lbPanel.scrollTop - lbPanel.clientHeight > 4;
      lbScrollHint.classList.toggle("is-visible", hasMore);
    }
    lbPanel.addEventListener("scroll", updateScrollHint, { passive: true });
    /* the arrow is also a button: click/tap it to glide down one screenful,
       so scrolling doesn't depend on finding the trackpad gesture at all */
    lbScrollHint.addEventListener("click", () => {
      lbPanel.scrollBy({ top: lbPanel.clientHeight * 0.75, behavior: "smooth" });
    });

    function renderSlide(direction = 0) {
      const project = PROJECTS[activeSlug];
      const slide = project.media[activeIndex];
      const prevEl = lbStage.firstElementChild; // still-visible outgoing slide, if any

      let el;
      if (slide.type === "video") {
        el = document.createElement("video");
        el.src = slide.src;
        if (slide.poster) el.poster = slide.poster;
        el.muted = true;
        el.loop = true;
        el.playsInline = true;
        el.autoplay = true;
        el.controls = false;
        el.preload = "none";
      } else {
        el = document.createElement("img");
        el.src = slide.src;
        el.alt = `${project.title} — ${activeIndex + 1}`;
      }
      el.style.position = "absolute";
      el.style.inset = "0";

      /* crossfade instead of clear-then-insert: the old slide stays on screen
         underneath until the new one has actually decoded, so there's never a
         blank/background frame between them — that gap was the "flicker".
         Slide-in motion + slower ease keeps the same deliberate IG-carousel feel. */
      const mount = () => {
        lbStage.appendChild(el);
        if (!reduceMotion) {
          const fromX = direction === 1 ? 46 : direction === -1 ? -46 : 0;
          gsap.fromTo(el, { opacity: 0, x: fromX }, {
            opacity: 1, x: 0, duration: 0.55, ease: "power3.out",
            onComplete() { if (prevEl && prevEl.parentNode) prevEl.remove(); },
          });
          if (prevEl) gsap.to(prevEl, { opacity: 0, duration: 0.4, ease: "power2.out" });
        } else {
          if (prevEl && prevEl.parentNode) prevEl.remove();
        }
      };

      if (slide.type === "image" && el.decode) {
        el.decode().then(mount).catch(mount);
      } else if (slide.type === "image") {
        el.addEventListener("load", mount, { once: true });
      } else {
        mount();
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
      lbDesc.classList.add("is-clamped"); // reset in case the last project was left expanded
      lbCategory.textContent = project.category;
      lbPanel.scrollTop = 0;
      /* only show the "เพิ่มเติม" toggle if the description is long enough to
         overflow 2 lines. This used to be measured from the rendered DOM
         (scrollHeight vs clampedHeight), but the lightbox panel's width isn't
         fixed — it's min(400px, 92vw), so it's narrower on a phone than in a
         wide desktop window. The same description could genuinely wrap to 3
         lines on mobile but fit in 2 on desktop, so a DOM measurement gave a
         different answer per device — not a bug, just width-dependent, but
         it read as "inconsistent". Using a fixed character-count threshold
         instead makes the decision the same on every screen size. */
      lbDescToggle.classList.toggle("is-visible", project.desc.length > 70);
      lbDescToggle.textContent = "เพิ่มเติม";
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
      requestAnimationFrame(updateScrollHint);
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
      renderSlide(delta > 0 ? 1 : -1);
    }

    document.querySelectorAll(".masonry__tile[data-project]").forEach((tile) => {
      tile.addEventListener("click", () => openLightbox(tile.dataset.project, tile));
    });
    lightbox.querySelectorAll("[data-lightbox-close]").forEach((el) => el.addEventListener("click", closeLightbox));
    lbPrev.addEventListener("click", () => step(-1));
    lbNext.addEventListener("click", () => step(1));
    lbDescToggle.addEventListener("click", () => {
      const isClamped = lbDesc.classList.toggle("is-clamped");
      lbDescToggle.textContent = isClamped ? "เพิ่มเติม" : "ย่อ";
      requestAnimationFrame(updateScrollHint);
    });
    document.addEventListener("keydown", (e) => {
      if (!lightbox.classList.contains("is-open")) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") step(-1);
      if (e.key === "ArrowRight") step(1);
    });

    /* touch swipe (mobile), IG-style — lock to one axis per gesture so a
       mostly-vertical scroll never flips a slide, and a mostly-horizontal
       swipe never nudges the scroll. Vertical touch scrolling is left to the
       browser (touch-action:pan-y on .lightbox__media); we only act on a clear
       horizontal swipe. */
    let touchX = null, touchY = null, touchAxis = null;
    lbMedia.addEventListener("touchstart", (e) => {
      touchX = e.touches[0].clientX; touchY = e.touches[0].clientY; touchAxis = null;
    }, { passive: true });
    lbMedia.addEventListener("touchmove", (e) => {
      if (touchX === null || touchAxis) return;
      const dx = e.touches[0].clientX - touchX;
      const dy = e.touches[0].clientY - touchY;
      if (Math.abs(dx) > 10 || Math.abs(dy) > 10) touchAxis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
    }, { passive: true });
    lbMedia.addEventListener("touchend", (e) => {
      if (touchX !== null && touchAxis === "x") {
        const dx = e.changedTouches[0].clientX - touchX;
        if (Math.abs(dx) > 45) step(dx > 0 ? -1 : 1);
      }
      touchX = null; touchAxis = null;
    }, { passive: true });

    /* trackpad / Magic Mouse — deciding "is this tick a horizontal swipe or a
       vertical scroll" from delta values alone was unreliable, especially on
       Magic Mouse (a single curved touch surface, not a full 2D trackpad —
       its axis separation is noisier). Instead of guessing per-gesture, the
       two interactions now live in two different physical zones, matching
       what's visually there: horizontal swipe-to-change-photo only listens
       on the photo itself (.lightbox__media); vertical scroll-to-read-more is
       handled by the browser's own native scroll on the card, with no JS
       touching it at all — no shared detection, so nothing to conflict. */
    let wheelAccumX = 0;
    let wheelLocked = false;
    let wheelIdleTimer = null;
    lbMedia.addEventListener("wheel", (e) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return; // vertical — let it bubble up and scroll the card natively
      e.preventDefault();
      if (wheelLocked) return;
      wheelAccumX += e.deltaX;
      clearTimeout(wheelIdleTimer);
      wheelIdleTimer = setTimeout(() => { wheelAccumX = 0; }, 300);
      if (Math.abs(wheelAccumX) > 130) {
        step(wheelAccumX > 0 ? 1 : -1);
        wheelAccumX = 0;
        wheelLocked = true;
        setTimeout(() => { wheelLocked = false; }, 550);
      }
    }, { passive: false });

    /* category "escape hatch" — jump to any category (or home) straight from
       inside a single project, no need to close first and hunt for the filter
       bar underneath. Reuses the existing filter buttons: picking a category
       here just closes the lightbox and clicks the matching one. */
    const lbCatToggle = document.getElementById("lightboxCatToggle");
    const lbCatMenu = document.getElementById("lightboxCatMenu");
    if (lbCatToggle && lbCatMenu) {
      lbCatToggle.addEventListener("click", (e) => {
        e.stopPropagation();
        const open = lbCatMenu.classList.toggle("is-open");
        lbCatToggle.setAttribute("aria-expanded", String(open));
      });
      lbCatMenu.querySelectorAll("[data-goto-filter]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const cat = btn.dataset.gotoFilter;
          const filterBtn = document.querySelector(`.work-filter [data-filter="${cat}"]`);
          lbCatMenu.classList.remove("is-open");
          closeLightbox();
          if (filterBtn) filterBtn.click();
        });
      });
      document.addEventListener("click", (e) => {
        if (lbCatMenu.classList.contains("is-open") && !lbCatMenu.contains(e.target) && e.target !== lbCatToggle) {
          lbCatMenu.classList.remove("is-open");
        }
      });
    }

    /* deep link from the homepage: work.html#<project-slug> opens straight
       into that project's slideshow with the full grid still underneath, so
       closing it lands on "ผลงานทั้งหมด" instead of always showing the grid
       first regardless of which project the visitor actually clicked. */
    const initialSlug = location.hash.slice(1);
    if (initialSlug && PROJECTS[initialSlug]) {
      const tile = document.querySelector(`.masonry__tile[data-project="${initialSlug}"]`);
      openLightbox(initialSlug, tile);
    }
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
