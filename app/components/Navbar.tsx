"use client";

import { useState } from "react";

const LINKS: { href: string; label: string }[] = [
  { href: "#about", label: "About" },
  { href: "#classes", label: "Classes" },
  { href: "#training", label: "Personal Training" },
  { href: "#membership", label: "Membership" },
  { href: "#reviews", label: "Reviews" },
  { href: "#contact", label: "Contact" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <nav>
      <a className="logo" href="#" onClick={close}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-libby-black.png" alt="Fitness With Libby" />
      </a>

      {/* Desktop links */}
      <ul className="nav-links">
        {LINKS.map((l) => (
          <li key={l.href}>
            <a href={l.href}>{l.label}</a>
          </li>
        ))}
      </ul>

      {/* Desktop CTA */}
      <a className="nav-cta" href="#contact">
        Book a Class
      </a>

      {/* Mobile hamburger */}
      <button
        type="button"
        className="nav-toggle"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span />
        <span />
        <span />
      </button>

      {/* Mobile slide-down menu */}
      <div className={`nav-mobile${open ? " open" : ""}`}>
        {LINKS.map((l) => (
          <a key={l.href} href={l.href} onClick={close}>
            {l.label}
          </a>
        ))}
        <a className="nav-cta-mobile" href="#contact" onClick={close}>
          Book a Class
        </a>
      </div>
    </nav>
  );
}
