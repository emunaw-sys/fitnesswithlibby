"use client";
/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from "react";
import "./hero.css";

const NAV_LINKS = ["Classes", "Studio", "About", "Membership", "Reviews", "Contact"];

export default function Hero() {
  const [scrolled, setScrolled] = useState(false);
  const mainRef = useRef<HTMLSpanElement>(null);
  const funRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let raf = 0;

    const update = () => {
      raf = 0;
      const y = window.scrollY;
      setScrolled(y > 88);

      // Scroll-out: "WHERE FITNESS MEETS" slides left, "fun" slides right.
      const vh = window.innerHeight || 1;
      const progress = Math.min(Math.max(y / (vh * 0.7), 0), 1);
      const main = mainRef.current;
      const fun = funRef.current;

      if (progress <= 0) {
        // At the top, let the CSS entrance animation / resting styles control.
        if (main) { main.style.transform = ""; main.style.opacity = ""; }
        if (fun) { fun.style.transform = ""; fun.style.opacity = ""; }
        return;
      }

      const shift = progress * 80; // vw travelled
      const fade = String(1 - progress);
      if (main) {
        main.style.transform = `translateX(${-shift}vw)`;
        main.style.opacity = fade;
      }
      if (fun) {
        // keep the resting tilt while sliding out to the right
        fun.style.transform = `translateX(${shift}vw) rotate(-3deg)`;
        fun.style.opacity = fade;
      }
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section className="hero">
      {/* Background image (photo + gradient + streak baked in) */}
      <div className="hero__bg" aria-hidden />
      {/* Center scrim to lift headline contrast */}
      <div className="hero__scrim" aria-hidden />

      {/* Nav */}
      <nav className={`hero__nav${scrolled ? " hero__nav--scrolled" : ""}`} aria-label="Primary">
        <a className="hero__logo" href="#" aria-label="Fitness With Libby — home">
          <img src="/logo-libby-black.png" alt="Fitness With Libby" />
        </a>

        <ul className="hero__links">
          {NAV_LINKS.map((label) => (
            <li key={label}>
              <a href={`#${label.toLowerCase()}`}>{label}</a>
            </li>
          ))}
        </ul>

        <a className="btn-primary btn-primary--sm hero__cta-nav" href="#book">
          Book your first class
        </a>

        <button className="hero__menu" aria-label="Open menu">
          <svg width="26" height="20" viewBox="0 0 26 20" fill="none" aria-hidden>
            <path d="M1 2h24M1 10h24M1 18h24" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
          </svg>
        </button>
      </nav>

      {/* Hero content */}
      <div className="hero__content">

        {/* Eyebrow */}
        <p className="hero__eyebrow anim-line anim-left" style={{ "--delay": "0ms" } as React.CSSProperties}>
          WOMEN-ONLY FITNESS STUDIO{" "}
          <span className="hero__eyebrow-accent">IN BEIT SHEMESH</span>
        </p>

        {/* Headline + script lockup */}
        <h1 className="hero__headline">
          <span ref={mainRef} className="hero__main anim-main" style={{ "--delay": "150ms" } as React.CSSProperties}>
            WHERE FITNESS MEETS
          </span>
          <span ref={funRef} className="hero__script anim-fun" style={{ "--delay": "400ms" } as React.CSSProperties}>
            <img src="/fun%20main%20hero.svg" alt="fun" />
          </span>
        </h1>

        {/* Subhead */}
        <p className="hero__subhead anim-line anim-left" style={{ "--delay": "560ms" } as React.CSSProperties}>
          Women-only group classes in a warm, private studio in Beit Shemesh. Strength training,
          cardio, dance — real work that leaves you stronger every time. Come exactly as you are.
        </p>

        {/* Secondary subhead */}
        <p className="hero__tagline anim-line anim-left" style={{ "--delay": "680ms" } as React.CSSProperties}>
          It&apos;s not about being strong. It&apos;s about building strength.
        </p>

        {/* CTA row */}
        <div className="hero__ctas anim-line anim-left" style={{ "--delay": "800ms" } as React.CSSProperties}>
          <a className="btn-primary" href="#book">Book your first class</a>
          <a className="btn-text" href="#classes">Already a member? Book your class →</a>
        </div>

      </div>
    </section>
  );
}
