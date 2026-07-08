"use client";

import { useEffect } from "react";

/**
 * All the imperative behaviour from the original single-file mockup:
 *  - hero headline splits apart on scroll
 *  - "Ready to start" scroll-stacking cards
 *  - testimonial deck (auto-advance, arrows, dots)
 *  - Meet-Libby photo fly-in on scroll
 *  - contact-form interest chips + submit guard
 *
 * Rendered once from the page. Everything is queried after mount and every
 * listener/timer/observer is torn down on unmount (StrictMode-safe).
 */
export default function SiteInteractions() {
  useEffect(() => {
    const cleanups: Array<() => void> = [];

    /* ---- scroll-driven effects ---- */
    const sxr = document.querySelector<HTMLElement>(".sx-r");
    const sxl = document.querySelector<HTMLElement>(".sx-l");
    const stack = Array.from(document.querySelectorAll<HTMLElement>(".r-card"));
    let ticking = false;

    const update = () => {
      const y = window.scrollY;
      const vh = window.innerHeight;

      // headline fades apart: line right, "fun" left
      const p = Math.min(y / (vh * 0.55), 1);
      if (sxr) {
        sxr.style.transform = `translateX(${p * 280}px)`;
        sxr.style.opacity = String(Math.max(1 - p * 1.15, 0));
      }
      if (sxl) {
        sxl.style.transform = `translateX(${-p * 280}px)`;
        sxl.style.opacity = String(Math.max(1 - p * 1.15, 0));
      }

      // scroll-stack: cards scale back slightly as the next slides over
      stack.forEach((card, i) => {
        if (i === stack.length - 1) {
          card.style.transform = "";
          return;
        }
        const nextTop = stack[i + 1].getBoundingClientRect().top;
        const myTop = card.getBoundingClientRect().top;
        const h = card.offsetHeight || 1;
        let prog = 1 - (nextTop - myTop) / h;
        prog = Math.max(0, Math.min(1, prog));
        card.style.transform = `scale(${1 - prog * 0.06})`;
        card.style.filter = `brightness(${1 - prog * 0.12})`;
      });

      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", update);
    update();
    cleanups.push(() => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", update);
    });

    /* ---- testimonial deck ---- */
    const deck = document.getElementById("deck");
    if (deck) {
      const cards = Array.from(deck.children) as HTMLElement[];
      const n = cards.length;
      let cur = 0;

      const dotsWrap = document.getElementById("tDots");
      const dots: HTMLButtonElement[] = [];
      if (dotsWrap) {
        dotsWrap.innerHTML = ""; // reset (StrictMode re-run safety)
        cards.forEach((_, i) => {
          const d = document.createElement("button");
          d.type = "button";
          d.className = "dot";
          d.setAttribute("aria-label", `Go to review ${i + 1}`);
          d.addEventListener("click", () => {
            cur = i;
            render();
            resetTimer();
          });
          dotsWrap.appendChild(d);
          dots.push(d);
        });
      }

      const render = () => {
        cards.forEach((c, i) => {
          c.dataset.pos = String(((i - cur) % n + n) % n);
        });
        dots.forEach((d, i) => d.classList.toggle("active", i === cur));
      };
      const next = () => {
        cur = (cur + 1) % n;
        render();
      };
      const prev = () => {
        cur = (cur - 1 + n) % n;
        render();
      };

      // auto-advance; pause on hover; stop after two full loops
      let autoCount = 0;
      let timer: ReturnType<typeof setInterval>;
      const autoNext = () => {
        next();
        if (++autoCount >= n * 2) clearInterval(timer);
      };
      timer = setInterval(autoNext, 5500);
      const resetTimer = () => {
        clearInterval(timer);
        autoCount = 0;
        timer = setInterval(autoNext, 5500);
      };

      const onEnter = () => clearInterval(timer);
      const onLeave = () => resetTimer();
      deck.addEventListener("mouseenter", onEnter);
      deck.addEventListener("mouseleave", onLeave);

      const nextBtn = document.querySelector<HTMLButtonElement>(".t-arrow.next");
      const prevBtn = document.querySelector<HTMLButtonElement>(".t-arrow.prev");
      const onNext = () => {
        next();
        resetTimer();
      };
      const onPrev = () => {
        prev();
        resetTimer();
      };
      nextBtn?.addEventListener("click", onNext);
      prevBtn?.addEventListener("click", onPrev);

      const onDeckClick = (e: MouseEvent) => {
        const card = (e.target as HTMLElement).closest<HTMLElement>(".t-card");
        if (card && card.dataset.pos === "0") {
          next();
          resetTimer();
        }
      };
      deck.addEventListener("click", onDeckClick);

      render();

      cleanups.push(() => {
        clearInterval(timer);
        deck.removeEventListener("mouseenter", onEnter);
        deck.removeEventListener("mouseleave", onLeave);
        deck.removeEventListener("click", onDeckClick);
        nextBtn?.removeEventListener("click", onNext);
        prevBtn?.removeEventListener("click", onPrev);
        if (dotsWrap) dotsWrap.innerHTML = "";
      });
    }

    /* ---- Meet-Libby photo fly-in ---- */
    const meetPhoto = document.querySelector<HTMLElement>(".meet-photo");
    if (meetPhoto && "IntersectionObserver" in window) {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((en) => {
            if (en.isIntersecting) {
              meetPhoto.classList.add("in-view");
              io.disconnect();
            }
          });
        },
        { threshold: 0.35 }
      );
      io.observe(meetPhoto);
      cleanups.push(() => io.disconnect());
    } else if (meetPhoto) {
      meetPhoto.classList.add("in-view");
    }

    /* ---- scroll-in reveal: grow title + cards (staggered) ---- */
    const revealEls = Array.from(
      document.querySelectorAll<HTMLElement>(".grow-title, .grow .cards .card")
    );
    if (revealEls.length) {
      if ("IntersectionObserver" in window) {
        const rio = new IntersectionObserver(
          (entries) => {
            entries.forEach((en) => {
              if (en.isIntersecting) {
                en.target.classList.add("is-in");
                rio.unobserve(en.target);
              }
            });
          },
          { threshold: 0.2, rootMargin: "0px 0px -8% 0px" }
        );
        revealEls.forEach((el) => rio.observe(el));
        cleanups.push(() => rio.disconnect());
      } else {
        // no IntersectionObserver — just show everything
        revealEls.forEach((el) => el.classList.add("is-in"));
      }
    }

    /* ---- contact form interest chips + submit guard ---- */
    const chips = Array.from(document.querySelectorAll<HTMLElement>(".c-chip"));
    const chipHandlers = chips.map((chip) => {
      const h = () => chip.classList.toggle("active");
      chip.addEventListener("click", h);
      return { chip, h };
    });
    cleanups.push(() =>
      chipHandlers.forEach(({ chip, h }) => chip.removeEventListener("click", h))
    );

    const form = document.querySelector<HTMLFormElement>(".c-form");
    const onSubmit = (e: Event) => e.preventDefault();
    form?.addEventListener("submit", onSubmit);
    cleanups.push(() => form?.removeEventListener("submit", onSubmit));

    return () => cleanups.forEach((fn) => fn());
  }, []);

  return null;
}
