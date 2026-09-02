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

  /* ---------- language switch ----------
     Thai is the source language and stays in the HTML, so the English pass only
     needs a lookup table (i18n.js). The original Thai is captured once at load
     and restored on the way back, which keeps the two directions symmetrical
     and means a missing translation degrades to Thai rather than to nothing. */
  const langButtons = document.querySelectorAll(".nav__lang-btn");
  if (langButtons.length) {
    const nodes = document.querySelectorAll("[data-i18n]");
    const original = new Map();
    nodes.forEach((el) => original.set(el, el.innerHTML));
    const docTitle = document.title;

    const applyLang = (lang) => {
      const en = window.I18N_EN || {};
      nodes.forEach((el) => {
        const key = el.dataset.i18n;
        if (lang === "en" && en[key]) el.innerHTML = en[key];
        else el.innerHTML = original.get(el);
      });
      // <title> lives outside the body, so it is swapped by hand
      const titleEl = document.querySelector("title[data-i18n]");
      if (titleEl) document.title = titleEl.textContent;
      else document.title = docTitle;

      document.documentElement.lang = lang;
      langButtons.forEach((b) => b.classList.toggle("is-active", b.dataset.lang === lang));
      try { localStorage.setItem("mestyle-lang", lang); } catch {}
      ScrollTrigger.refresh();
    };

    langButtons.forEach((b) => b.addEventListener("click", () => applyLang(b.dataset.lang)));

    let saved = "th";
    try { saved = localStorage.getItem("mestyle-lang") || "th"; } catch {}
    if (saved === "en") applyLang("en");
  }

  /* ---------- mobile nav ----------
     The bar collapses to a hamburger under 820px; the links drop in as a sheet
     with the rows trailing in after it (CSS handles the stagger). Scroll is
     locked while open so the page behind doesn't move under the sheet. */
  const burger = document.getElementById("navBurger");
  const navLinks = document.getElementById("navLinks");
  const navScrim = document.getElementById("navScrim");
  if (burger && navLinks) {
    const setNav = (open) => {
      burger.classList.toggle("is-open", open);
      navLinks.classList.toggle("is-open", open);
      burger.setAttribute("aria-expanded", String(open));
      document.body.classList.toggle("nav-open", open);
      if (navScrim) {
        if (open) {
          navScrim.hidden = false;
          requestAnimationFrame(() => navScrim.classList.add("is-open"));
        } else {
          navScrim.classList.remove("is-open");
          setTimeout(() => { navScrim.hidden = true; }, 350);
        }
      }
      if (open) lenis.stop(); else lenis.start();
    };
    burger.addEventListener("click", () => setNav(!burger.classList.contains("is-open")));
    navScrim?.addEventListener("click", () => setNav(false));
    navLinks.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => setNav(false)));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && burger.classList.contains("is-open")) setNav(false);
    });
    // leaving the mobile breakpoint should never strand the sheet open
    window.addEventListener("resize", () => {
      if (window.innerWidth > 820 && burger.classList.contains("is-open")) setNav(false);
    });
  }

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

  /* ---------- generic [data-reveal] fade-up on scroll ----------
     One ScrollTrigger per element (there can be 50+ on a page) means 50+
     separate scroll listeners doing their own math every frame. batch() groups
     them under a single shared listener instead — same visual result, far
     less continuous work for a phone's main thread to do while scrolling. */
  const revealEls = Array.from(document.querySelectorAll("[data-reveal]")).filter(
    (el) => !el.closest(".hero") && !el.closest(".nav") // hero handled separately, nav visible immediately
  );
  gsap.set(revealEls, { opacity: 0, y: 40 });
  ScrollTrigger.batch(revealEls, {
    start: "top 88%",
    once: true,
    onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, duration: 0.9, ease: "power3.out", stagger: 0.06 }),
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

  /* ---------- work masonry: balanced column packing ----------
     Tiles used to be hard-assigned to a fixed column in the HTML. That looked
     fine for "ทั้งหมด" but broke on every filter: picking "Packaging" left two
     of the four columns completely empty, so the grid showed a tall hole
     instead of a row. Columns are now filled at runtime by shortest-column-
     first packing over whichever tiles are currently visible, so the grid stays
     balanced for every filter and at every breakpoint. */
  const masonry = document.querySelector(".work__masonry");
  if (masonry) {
    const RATIO = { "masonry__tile--tall": 4 / 3, "masonry__tile--med": 5 / 4, "masonry__tile--short": 1 };
    const tileHeight = (tile) => {
      for (const cls in RATIO) if (tile.classList.contains(cls)) return RATIO[cls];
      return 5 / 4;
    };
    // canonical order, captured once before any re-parenting shuffles the DOM
    const allTiles = Array.from(masonry.querySelectorAll(".masonry__tile"));
    let driftTweens = [];

    const columnCount = () => {
      const w = window.innerWidth;
      if (w <= 560) return 1;
      if (w <= 820) return 2;
      if (w <= 1100) return 3;
      return 4;
    };

    function layoutMasonry() {
      const visible = allTiles.filter((t) => t.dataset.hidden !== "true");
      // never open more columns than there are tiles to fill them, otherwise a
      // filter with 3 results renders 3 narrow tiles beside one empty column
      const n = Math.max(1, Math.min(columnCount(), visible.length));
      driftTweens.forEach((t) => t.kill());
      driftTweens = [];

      masonry.innerHTML = "";
      const cols = [];
      for (let i = 0; i < n; i++) {
        const col = document.createElement("div");
        col.className = "masonry__col";
        col.dataset.drift = i % 2 === 0 ? "1" : "-1";
        masonry.appendChild(col);
        cols.push({ el: col, h: 0 });
      }

      visible.forEach((tile) => {
        const target = cols.reduce((a, b) => (b.h < a.h ? b : a));
        target.el.appendChild(tile);
        target.h += tileHeight(tile);
      });

      if (!reduceMotion) {
        cols.forEach((c, i) => {
          if (!c.el.children.length) return;
          driftTweens.push(
            gsap.to(c.el, {
              y: (c.el.dataset.drift === "-1" ? -1 : 1) * 26,
              duration: 6 + i * 1.3,
              ease: "sine.inOut",
              repeat: -1,
              yoyo: true,
            })
          );
        });
      }
      ScrollTrigger.refresh();
    }

    layoutMasonry();

    let resizeTimer = null;
    let lastCols = columnCount();
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (columnCount() !== lastCols) {
          lastCols = columnCount();
          layoutMasonry();
        }
      }, 180);
    });

    /* ---------- work filter tabs (work.html only) ---------- */
    const filterBar = document.querySelector(".work-filter");
    if (filterBar) {
      const buttons = filterBar.querySelectorAll("button");

      /* the services list on the homepage links here as
         work.html?filter=Packaging, so arriving from a service row lands on
         that category already applied instead of the full grid. */
      const wanted = new URLSearchParams(location.search).get("filter");
      if (wanted) {
        const match = filterBar.querySelector(`[data-filter="${CSS.escape(wanted)}"]`);
        if (match) {
          buttons.forEach((b) => b.classList.remove("is-active"));
          match.classList.add("is-active");
          allTiles.forEach((tile) => {
            tile.dataset.hidden = tile.dataset.category === wanted ? "false" : "true";
          });
          layoutMasonry();
        }
      }

      buttons.forEach((btn) => {
        btn.addEventListener("click", () => {
          buttons.forEach((b) => b.classList.remove("is-active"));
          btn.classList.add("is-active");
          const cat = btn.dataset.filter;
          allTiles.forEach((tile) => {
            const show = cat === "all" || tile.dataset.category === cat;
            tile.dataset.hidden = show ? "false" : "true";
          });
          layoutMasonry();
          gsap.fromTo(
            masonry.querySelectorAll(".masonry__tile"),
            { opacity: 0, y: 14 },
            { opacity: 1, y: 0, duration: 0.45, stagger: 0.035, ease: "power2.out", overwrite: true }
          );
        });
      });
    }
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
      thedispensary: "Social-Media/TheDispensary",
      scope: "Social-Media/ScopeCollection",
      compoundgenetics: "Social-Media/compoundgenetics.th",
      mayuree: "Social-Media/มยุรี",
      mamaoden: "Illustration/Mama oden",
    };
    const asset = (path) => ({ type: "image", src: encodeURI(`assets/work/${path}`) });
    const video = (path, poster) => ({
      type: "video",
      src: encodeURI(`assets/work/${path}`),
      poster: poster ? encodeURI(`assets/work/${poster}`) : undefined,
    });
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
        desc: "บรรจุภัณฑ์และอัตลักษณ์เครื่องดื่มคอมบูชะ \"Bionest\" โทนสีส้ม-เหลืองอบอุ่นที่สื่อถึงความสดชื่นจากธรรมชาติ ภายใต้แนวคิด \"Crafted by nature, designed for you\"",
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
      thedispensary: {
        title: "The Dispensary",
        category: "Social Media",
        desc: "คอนเทนต์โซเชียลมีเดียแคมเปญ \"Fresh from the Farm\" ให้ร้าน The Dispensary เล่าเรื่องตั้งแต่แปลงปลูกกัญชาไปจนถึงเคาน์เตอร์บริการลูกค้า จัดวางเป็นมอคอัพหน้าโปรไฟล์ Instagram พร้อมภาพถ่ายจริงแต่ละโพสต์",
        media: [
          img("thedispensary-01"), img("thedispensary-02"), img("thedispensary-03"),
          img("thedispensary-04"), img("thedispensary-05"), img("thedispensary-06"),
          img("thedispensary-07"), img("thedispensary-08"), img("thedispensary-09"),
          img("thedispensary-10"),
        ],
      },
      scope: {
        title: "Scope Collection",
        category: "Social Media",
        desc: "คอนเทนต์โซเชียลมีเดียไลฟ์สไตล์ให้ \"Scope Collection\" ดีเวลลอปเปอร์คอนโดมิเนียมระดับพรีเมียม จัดวางเป็นมอคอัพหน้าโปรไฟล์ Instagram พร้อมภาพถ่ายไลฟ์สไตล์แต่ละโพสต์",
        media: [
          img("scope-01"), img("scope-02"), img("scope-03"),
          img("scope-04"), img("scope-05"), img("scope-06"),
          img("scope-07"), img("scope-08"), img("scope-09"),
          img("scope-10"),
        ],
      },
      jokerz31: {
        title: "JOKERZ31",
        category: "Illustration",
        desc: "งานภาพประกอบคาแรกเตอร์ JOKERZ31 ที่ใช้เส้นและสีสร้างบุคลิกเฉพาะตัว ให้ภาพมีพลัง สนุก และต่อยอดเป็นงานสื่อสารของแบรนด์ได้หลากหลายรูปแบบ",
        media: [
          asset("Illustration/JOKERZ31/JOKERZ31.jpg"),
        ],
      },
      "kk-event": {
        title: "KK Event",
        category: "Packaging",
        desc: "ชุดงานออกแบบสำหรับอีเวนต์ KK ตั้งแต่การ์ดเชิญไปจนถึงชิ้นงานประกอบบรรยากาศงาน จัดวางให้ภาพรวมดูโดดเด่นและสื่อสารคอนเซปต์เดียวกัน",
        media: [
          asset("Packaging/Packaging_KK Event/A4-KK-invited.jpg"),
          asset("Packaging/Packaging_KK Event/X I P - 0098.jpg"),
          asset("Packaging/Packaging_KK Event/X I P - 0004.jpg"),
          asset("Packaging/Packaging_KK Event/SCR-20260828-kmpf.jpeg"),
          asset("Packaging/Packaging_KK Event/X I P - 0019.jpg"),
        ],
      },
      "compoundgenetics-packaging": {
        title: "Compound Genetics.th",
        category: "Packaging",
        desc: "งานบรรจุภัณฑ์และสื่อเปิดตัวผลิตภัณฑ์ Pre-Roll ของ Compound Genetics.th ถ่ายทอดคาแรกเตอร์แบรนด์ผ่านภาพสินค้าและงานโปรโมตที่มีความชัดเจนและโดดเด่น",
        media: [
          asset("Packaging/compoundgenetics.th/compoundgenetics-preroll-product.webp"),
          video("Packaging/compoundgenetics.th/PRE-ROLL-COMPOUND-รวม1.mp4", "Packaging/compoundgenetics.th/compoundgenetics-preroll-video.webp"),
        ],
      },
      compoundgenetics: {
        title: "Compound Genetics.th",
        category: "Social Media",
        desc: "คอนเทนต์โซเชียลมีเดียสำหรับ Compound Genetics.th ครอบคลุมทั้งคีย์อาร์ตแคมเปญ \"Apples & Bananas Collection Drop\" และคอนเทนต์บรรจุภัณฑ์เมล็ดพันธุ์ จัดวางเป็นมอคอัพหน้าโปรไฟล์ Instagram บนพื้นหลังโทนม่วง-ทองตามอัตลักษณ์แบรนด์",
        media: [
          img("compoundgenetics-01"), img("compoundgenetics-02"), img("compoundgenetics-03"),
          img("compoundgenetics-04"), img("compoundgenetics-05"), img("compoundgenetics-06"),
          img("compoundgenetics-07"), img("compoundgenetics-08"), img("compoundgenetics-09"),
          img("compoundgenetics-10"),
        ],
      },
      mayuree: {
        title: "มยุรี ข้าวตังทรงเครื่อง",
        category: "Social Media",
        desc: "คอนเทนต์โซเชียลมีเดียสำหรับมยุรี ข้าวตังทรงเครื่อง ครอบคลุมทั้งภาพสินค้า คอนเทนต์ไลฟ์สไตล์ และกราฟิกแคมเปญ จัดวางเป็นมอคอัพหน้าโปรไฟล์ Instagram",
        media: [
          img("mayuree-01"), img("mayuree-02"), img("mayuree-03"),
          img("mayuree-04"), img("mayuree-05"), img("mayuree-06"),
          img("mayuree-07"), img("mayuree-08"), img("mayuree-09"),
          img("mayuree-10"),
        ],
      },
      mamaoden: {
        title: "Mama Oden",
        category: "Illustration",
        desc: "ออกแบบคาแรกเตอร์และอัตลักษณ์แบรนด์ให้ Mama Oden ร้านโอเด้งสไตล์ญี่ปุ่น ตั้งแต่คาแรกเตอร์มาสคอต โลโก้ ไปจนถึงงานบรรจุภัณฑ์ ถุงกระดาษ ป้ายร้าน และสติกเกอร์ ให้ครบทุกจุดสัมผัสของแบรนด์",
        media: [
          img("mamaoden-01"), img("mamaoden-02"), img("mamaoden-03"),
          img("mamaoden-04"), img("mamaoden-05"), img("mamaoden-06"),
          img("mamaoden-07"), img("mamaoden-08"),
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
      lbStage.classList.toggle("is-video", slide.type === "video");
      lbStage.style.setProperty("--media-bg", slide.poster ? `url("${slide.poster}")` : "none");

      let el;
      if (slide.type === "video") {
        el = document.createElement("video");
        el.src = slide.src;
        if (slide.poster) el.poster = slide.poster;
        el.muted = true;
        el.loop = true;
        el.playsInline = true;
        el.setAttribute("webkit-playsinline", ""); // older iOS Safari looks for this attribute specifically
        el.autoplay = true;
        el.controls = false;
        el.preload = "auto"; // "none" left the browser with nothing buffered, so
                              // the autoplay attribute alone never had a frame to
                              // start playing — it just sat on the poster image
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
        if (slide.type === "video") {
          // the autoplay attribute is unreliable on a <video> that was created
          // and appended via JS rather than present at parse time — call
          // play() ourselves once it's actually in the DOM. Browsers can still
          // reject this (autoplay policy quirks), so swallow the rejection
          // rather than throwing an unhandled promise error.
          const p = el.play();
          if (p && p.catch) p.catch(() => {});
        }
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

    function openLightbox(slug, triggerEl, fromHistory) {
      const project = PROJECTS[slug];
      if (!project) return;
      /* keep the URL in step with what's on screen so the browser Back button
         closes the project instead of leaving the site, and so a project can be
         linked/shared directly. fromHistory guards against re-pushing when the
         open was itself triggered by a popstate. */
      if (!fromHistory) history.pushState({ lb: slug }, "", "#" + slug);
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

    function closeLightbox(fromHistory) {
      if (!lightbox.classList.contains("is-open")) return;
      lightbox.classList.remove("is-open");
      lightbox.setAttribute("aria-hidden", "true");
      lbStage.innerHTML = ""; // stop any playing video
      lenis.start();
      document.body.style.overflow = "";
      if (lastFocused) lastFocused.focus();
      // drop the #slug so a refresh lands on the grid, not back inside the project
      if (!fromHistory && history.state && history.state.lb) history.back();
    }

    window.addEventListener("popstate", (e) => {
      const slug = e.state && e.state.lb;
      if (slug && PROJECTS[slug]) {
        openLightbox(slug, document.querySelector(`.masonry__tile[data-project="${slug}"]`), true);
      } else {
        closeLightbox(true);
      }
    });

    function step(delta) {
      const project = PROJECTS[activeSlug];
      activeIndex = (activeIndex + delta + project.media.length) % project.media.length;
      renderSlide(delta > 0 ? 1 : -1);
    }

    document.querySelectorAll(".masonry__tile[data-project]").forEach((tile) => {
      tile.addEventListener("click", () => openLightbox(tile.dataset.project, tile));
    });
    // wrapped, not passed by reference: a bare handler receives the click Event
    // as closeLightbox's first argument, which reads as fromHistory=true and
    // silently skips the history cleanup that drops the #slug.
    lightbox.querySelectorAll("[data-lightbox-close]").forEach((el) => el.addEventListener("click", () => closeLightbox()));
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
      /* rewrite the landing entry to the bare grid first, then push the project
         on top of it. Closing then steps back onto "ผลงานทั้งหมด" (still on this
         page) and only a second Back returns to wherever the visitor came from. */
      history.replaceState({}, "", location.pathname);
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

  /* ---------- CV page motion ----------
     This page is the one that gets sent out as a portfolio, so the motion has a
     job: pull the eye down the page in the intended reading order. Each device
     is scroll-triggered and plays once — nothing loops, nothing distracts from
     the content itself. */
  if (document.querySelector(".cv-hero")) {
    // 1. headline rides up line by line, out of its own clipped box
    if (reduceMotion) {
      gsap.set(".cv-line > span", { yPercent: 0 });
    } else {
      gsap.fromTo(
        ".cv-line > span",
        { yPercent: 110 },
        { yPercent: 0, duration: 1.05, ease: "power4.out", stagger: 0.09, delay: 0.15 }
      );
    }

    // 2. selected-work tiles wipe in together, then lift one after another
    gsap.utils.toArray("[data-cv-tile]").forEach((tile, i) => {
      gsap.fromTo(
        tile,
        { opacity: 0, y: 44, clipPath: "inset(12% 0% 12% 0% round 16px)" },
        {
          opacity: 1, y: 0, clipPath: "inset(0% 0% 0% 0% round 16px)",
          duration: 0.85, ease: "power3.out", delay: i * 0.08,
          scrollTrigger: { trigger: tile.parentElement, start: "top 85%", once: true },
        }
      );
    });

    // 3. timeline entries walk in from the left, dot first
    gsap.utils.toArray("[data-cv-step]").forEach((item) => {
      gsap.fromTo(
        item,
        { opacity: 0, x: -26 },
        {
          opacity: 1, x: 0, duration: 0.7, ease: "power3.out",
          scrollTrigger: { trigger: item, start: "top 88%", once: true },
        }
      );
    });

    // 4. skill / client lists pop their items in sequence
    gsap.utils.toArray("[data-cv-stagger]").forEach((group) => {
      gsap.fromTo(
        group.querySelectorAll("li"),
        { opacity: 0, y: 14 },
        {
          opacity: 1, y: 0, duration: 0.5, ease: "power2.out", stagger: 0.045,
          scrollTrigger: { trigger: group, start: "top 88%", once: true },
        }
      );
      const h = group.querySelector("h3");
      if (h) {
        gsap.fromTo(
          h,
          { opacity: 0, y: 12 },
          { opacity: 1, y: 0, duration: 0.5, ease: "power2.out",
            scrollTrigger: { trigger: group, start: "top 88%", once: true } }
        );
      }
    });
  }

  /* ---------- CV portrait: desaturated until touched, tilts with the pointer ----------
     One handler set for both input types via Pointer Events: on a mouse the
     photo lights up on hover and follows the cursor; on touch it lights up
     while a finger is down. Reduced-motion keeps the colour change but drops
     the tilt. */
  const portrait = document.getElementById("cvPortrait");
  if (portrait) {
    const img = portrait.querySelector("img");
    const MAX_TILT = 7;   // degrees
    const MAX_SHIFT = 10; // px of counter-parallax on the image itself

    const tilt = (e) => {
      if (reduceMotion) return;
      const r = portrait.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;  // -0.5 .. 0.5
      const py = (e.clientY - r.top) / r.height - 0.5;
      gsap.to(img, {
        rotationY: px * MAX_TILT * 2,
        rotationX: -py * MAX_TILT * 2,
        x: px * MAX_SHIFT,
        y: py * MAX_SHIFT,
        scale: 1.08,
        duration: 0.5,
        ease: "power2.out",
        transformPerspective: 900,
      });
    };
    const reset = () => {
      portrait.classList.remove("is-lit");
      if (reduceMotion) return;
      gsap.to(img, { rotationY: 0, rotationX: 0, x: 0, y: 0, scale: 1.04, duration: 0.7, ease: "power3.out" });
    };
    const light = (e) => { portrait.classList.add("is-lit"); tilt(e); };

    portrait.addEventListener("pointerenter", light);
    portrait.addEventListener("pointermove", (e) => {
      if (portrait.classList.contains("is-lit")) tilt(e);
    });
    portrait.addEventListener("pointerleave", reset);
    // touch: light up while the finger is down, and keep it lit briefly after
    portrait.addEventListener("pointerdown", light);
    portrait.addEventListener("pointerup", (e) => {
      if (e.pointerType !== "mouse") setTimeout(reset, 1400);
    });
    portrait.addEventListener("pointercancel", reset);
  }

  /* ---------- brief form: 4-step guided project inquiry ----------
     Static site, so there's no server to POST to. The form instead assembles a
     readable brief and hands it off through channels the studio already uses —
     a prefilled mail draft, or clipboard for Line/IG/Facebook. Nothing is sent
     anywhere until the visitor themselves presses send in their own app. */
  const briefForm = document.getElementById("briefForm");
  if (briefForm) {
    const steps = Array.from(briefForm.querySelectorAll(".brief__step"));
    const barFill = document.getElementById("briefBarFill");
    const stepNow = document.getElementById("briefStepNow");
    const prevBtn = document.getElementById("briefPrev");
    const nextBtn = document.getElementById("briefNext");
    const navBox = document.getElementById("briefNav");
    const doneBox = document.getElementById("briefDone");
    const summaryEl = document.getElementById("briefSummary");
    const errorEl = document.getElementById("briefError");
    const mailBtn = document.getElementById("briefMail");
    const copyBtn = document.getElementById("briefCopy");
    const restartBtn = document.getElementById("briefRestart");
    const STUDIO_EMAIL = "stifper@gmail.com";
    let current = 0;

    /* opt-in gate — the questions only appear once someone says they're
       interested, so the section reads as an invitation rather than a form */
    const gate = document.getElementById("briefGate");
    const openBtn = document.getElementById("briefOpen");
    if (gate && openBtn) {
      openBtn.addEventListener("click", () => {
        gate.hidden = true;
        briefForm.hidden = false;
        if (!reduceMotion) {
          gsap.fromTo(briefForm, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" });
        }
        briefForm.querySelector(".brief__opt input")?.focus({ preventScroll: true });
        ScrollTrigger.refresh();
      });
    }

    function showStep(i) {
      steps.forEach((s, n) => s.classList.toggle("is-active", n === i));
      current = i;
      stepNow.textContent = i + 1;
      barFill.style.width = ((i + 1) / steps.length) * 100 + "%";
      prevBtn.disabled = i === 0;
      nextBtn.textContent = i === steps.length - 1 ? "สรุปบรีฟ" : "ถัดไป";
      errorEl.textContent = "";
    }

    const vals = (name) =>
      Array.from(briefForm.querySelectorAll(`[name="${name}"]`))
        .filter((el) => (el.type === "checkbox" || el.type === "radio" ? el.checked : el.value.trim()))
        .map((el) => (el.type === "checkbox" || el.type === "radio" ? el.value : el.value.trim()));

    function buildSummary() {
      const line = (label, arr) => (arr.length ? `${label}: ${arr.join(", ")}` : null);
      return [
        "— บรีฟโปรเจกต์จากเว็บไซต์ MeStyle Studio —",
        "",
        line("บริการที่สนใจ", vals("service")),
        line("ชื่อแบรนด์/ธุรกิจ", vals("brand")),
        line("ประเภทธุรกิจ", vals("industry")),
        line("ขั้นของแบรนด์", vals("stage")),
        line("ต้องการใช้งาน", vals("timing")),
        line("งบประมาณที่วางไว้", vals("budget")),
        "",
        line("ชื่อผู้ติดต่อ", vals("name")),
        line("ช่องทางติดต่อ", vals("contact")),
        line("รายละเอียดเพิ่มเติม", vals("detail")),
      ]
        .filter((l) => l !== null)
        .join("\n");
    }

    function finish() {
      const text = buildSummary();
      summaryEl.textContent = text;
      mailBtn.href =
        `mailto:${STUDIO_EMAIL}?subject=` +
        encodeURIComponent("บรีฟโปรเจกต์ใหม่ — " + (vals("brand")[0] || vals("name")[0] || "ไม่ระบุชื่อ")) +
        "&body=" + encodeURIComponent(text);
      steps.forEach((s) => s.classList.remove("is-active"));
      navBox.hidden = true;
      doneBox.hidden = false;
      barFill.style.width = "100%";
      stepNow.textContent = steps.length;
    }

    nextBtn.addEventListener("click", () => {
      if (current === steps.length - 1) {
        // only the contact step is mandatory — everything before it is optional
        // so a visitor who just wants to say hello isn't blocked by the funnel
        if (!vals("name").length || !vals("contact").length) {
          errorEl.textContent = "กรุณากรอกชื่อและช่องทางติดต่อกลับ";
          return;
        }
        finish();
        return;
      }
      showStep(current + 1);
    });
    prevBtn.addEventListener("click", () => showStep(Math.max(0, current - 1)));

    copyBtn.addEventListener("click", async () => {
      const text = summaryEl.textContent;
      try {
        await navigator.clipboard.writeText(text);
        copyBtn.textContent = "คัดลอกแล้ว ✓";
      } catch {
        // clipboard API needs a secure context; fall back to selecting the text
        const r = document.createRange();
        r.selectNodeContents(summaryEl);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(r);
        copyBtn.textContent = "กด Cmd/Ctrl + C เพื่อคัดลอก";
      }
      setTimeout(() => { copyBtn.textContent = "คัดลอกไปวางใน Line"; }, 2600);
    });

    restartBtn.addEventListener("click", () => {
      briefForm.reset();
      doneBox.hidden = true;
      navBox.hidden = false;
      showStep(0);
      briefForm.scrollIntoView({ behavior: "smooth", block: "center" });
    });

    showStep(0);
  }

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
