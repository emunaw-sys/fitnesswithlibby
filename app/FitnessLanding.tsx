/* eslint-disable @next/next/no-img-element */
"use client";

// Fitness With Libby — landing page.
// Recreated from the Claude Design handoff bundle as a single client component.
// Tokens + fonts live in ./fitness.css (scoped under .fwl-root).

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "fwl-bookings";

const POPPINS = "'Poppins', sans-serif";
const DM_SANS = "'DM Sans', sans-serif";
const SCRIPT = "'Great Vibes', cursive";

type Bookings = Record<string, boolean>;

type ClassItem = {
  id: string;
  time: string;
  dur: string;
  name: string;
  tag: "Strength" | "Wellness" | "Balance" | "Cardio";
  level: string;
  spots: number;
};

type DayItem = {
  key: string;
  short: string;
  name: string;
  classes: ClassItem[];
};

/* ------------------------------------------------------------------ data */

const TAG_STYLES: Record<ClassItem["tag"], { bg: string; color: string }> = {
  Strength: { bg: "linear-gradient(135deg,#FF5CA8,#A873D8)", color: "white" },
  Wellness: { bg: "linear-gradient(135deg,#FFD889,#FF8FA3)", color: "#5B2D6E" },
  Balance: { bg: "rgba(168,115,216,0.16)", color: "#8A4FC4" },
  Cardio: { bg: "#5B2D6E", color: "white" },
};

const WEEK: DayItem[] = [
  {
    key: "sun",
    short: "SUN",
    name: "Sunday",
    classes: [
      { id: "sun-1", time: "06:30", dur: "45 min", name: "Sunrise Strength", tag: "Strength", level: "All levels", spots: 4 },
      { id: "sun-2", time: "09:30", dur: "50 min", name: "Mums & Movement", tag: "Wellness", level: "Beginner", spots: 6 },
      { id: "sun-3", time: "19:30", dur: "45 min", name: "Power & Conditioning", tag: "Strength", level: "Intermediate", spots: 3 },
    ],
  },
  {
    key: "mon",
    short: "MON",
    name: "Monday",
    classes: [
      { id: "mon-1", time: "08:00", dur: "40 min", name: "Core & Stability", tag: "Balance", level: "All levels", spots: 5 },
      { id: "mon-2", time: "20:00", dur: "50 min", name: "Dance Cardio", tag: "Cardio", level: "All levels", spots: 8 },
    ],
  },
  {
    key: "tue",
    short: "TUE",
    name: "Tuesday",
    classes: [
      { id: "tue-1", time: "06:30", dur: "40 min", name: "HIIT & Burn", tag: "Strength", level: "Intermediate", spots: 2 },
      { id: "tue-2", time: "10:00", dur: "55 min", name: "Mind & Body Reset", tag: "Wellness", level: "Beginner", spots: 6 },
      { id: "tue-3", time: "19:30", dur: "45 min", name: "Strong & Sculpt", tag: "Strength", level: "Intermediate", spots: 4 },
    ],
  },
  {
    key: "wed",
    short: "WED",
    name: "Wednesday",
    classes: [
      { id: "wed-1", time: "08:30", dur: "45 min", name: "Mobility & Flow", tag: "Balance", level: "All levels", spots: 7 },
      { id: "wed-2", time: "20:00", dur: "45 min", name: "Power & Conditioning", tag: "Strength", level: "Intermediate", spots: 0 },
    ],
  },
  {
    key: "thu",
    short: "THU",
    name: "Thursday",
    classes: [
      { id: "thu-1", time: "06:30", dur: "45 min", name: "Sunrise Strength", tag: "Strength", level: "All levels", spots: 5 },
      { id: "thu-2", time: "09:30", dur: "50 min", name: "Mums & Movement", tag: "Wellness", level: "Beginner", spots: 4 },
      { id: "thu-3", time: "19:30", dur: "40 min", name: "HIIT & Burn", tag: "Strength", level: "Intermediate", spots: 3 },
    ],
  },
  {
    key: "fri",
    short: "FRI",
    name: "Friday",
    classes: [
      { id: "fri-1", time: "08:00", dur: "45 min", name: "Stretch & Restore", tag: "Wellness", level: "All levels", spots: 6 },
      { id: "fri-2", time: "09:30", dur: "40 min", name: "Pre-Shabbat Flow", tag: "Balance", level: "All levels", spots: 5 },
    ],
  },
];

const ALL_CLASSES: (ClassItem & { day: string; short: string })[] = WEEK.flatMap((d) =>
  d.classes.map((c) => ({ ...c, day: d.name, short: d.short }))
);

const NAV_ITEMS = [
  { label: "HOME", href: "#hero" },
  { label: "ABOUT", href: "#about" },
  { label: "SCHEDULE", href: "#schedule" },
  { label: "MOTTO", href: "#motto" },
  { label: "CONTACT", href: "#footer" },
];

const aboutPillars = [
  { label: "Faith-Centered", sub: "Mind, body & neshama" },
  { label: "Women-Only", sub: "Modest. Supportive. Uplifting." },
  { label: "Community First", sub: "Friendships that uplift" },
  { label: "Stronger Together", sub: "Every rep, every step" },
];

const VALUES = ["Movement", "Strength", "Balance", "Growth", "Confidence", "Wellness"];

const FOOTER_COLS = [
  { title: "Classes", links: ["Strength", "Balance", "Wellness", "Dance Cardio", "Full schedule"] },
  { title: "Studio", links: ["About Libby", "Beit Shemesh", "Free trial", "Pricing", "Contact"] },
  { title: "Connect", links: ["Instagram", "WhatsApp", "Newsletter", "Community", "Refer a friend"] },
];

/* ------------------------------------------------------------------ nav */

function LibbyMark({ white = false }: { white?: boolean }) {
  return (
    <img
      src={white ? "/logo-libby-white.png" : "/logo-libby.png"}
      alt="Fitness With Libby"
      style={{ height: 56, width: "auto", display: "block", flexShrink: 0 }}
    />
  );
}

function StickyNav({ onBook }: { onBook: () => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > window.innerHeight * 0.7);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 200,
        background: "rgba(255,250,245,0.92)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        boxShadow: "0 1px 24px rgba(91,45,110,0.10)",
        borderBottom: "1px solid rgba(168,115,216,0.14)",
        transform: visible ? "translateY(0)" : "translateY(-105%)",
        transition: "transform 0.45s cubic-bezier(0.4,0,0.2,1)",
        padding: "0 clamp(20px, 4vw, 48px)",
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: 74,
        }}
      >
        <a href="#hero" style={{ textDecoration: "none" }}>
          <LibbyMark />
        </a>

        <nav style={{ display: "flex", alignItems: "center", gap: "clamp(16px, 2.4vw, 34px)" }}>
          {NAV_ITEMS.map((item) => (
            <a
              key={item.label}
              href={item.href}
              style={{
                fontFamily: POPPINS,
                fontWeight: 600,
                fontSize: 11.5,
                letterSpacing: "0.13em",
                textDecoration: "none",
                color: "#2A1535",
                paddingBottom: 2,
                borderBottom: "2px solid transparent",
                transition: "color 0.2s, border-color 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#FF5CA8";
                e.currentTarget.style.borderColor = "#FF5CA8";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "#2A1535";
                e.currentTarget.style.borderColor = "transparent";
              }}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <button
          onClick={onBook}
          style={{
            padding: "11px 26px",
            borderRadius: 9999,
            background: "linear-gradient(135deg, #FF5CA8, #A873D8)",
            color: "white",
            fontFamily: POPPINS,
            fontWeight: 700,
            fontSize: 11,
            letterSpacing: "0.1em",
            border: "none",
            cursor: "pointer",
            boxShadow: "0 4px 16px rgba(255,92,168,0.38)",
            transition: "transform 0.15s, box-shadow 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-1px)";
            e.currentTarget.style.boxShadow = "0 6px 22px rgba(255,92,168,0.48)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "none";
            e.currentTarget.style.boxShadow = "0 4px 16px rgba(255,92,168,0.38)";
          }}
        >
          BOOK A TRIAL
        </button>
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ hero */

function Hero() {
  return (
    <section id="hero" className="hero-wrap">
      <img src="/hero.png" alt="Fitness With Libby — Move together. Feel fabulous." />
      <a href="#about" className="scroll-cue" aria-label="Scroll down">
        <div
          style={{
            width: 30,
            height: 48,
            borderRadius: 9999,
            border: "2px solid rgba(255,255,255,0.8)",
            display: "flex",
            justifyContent: "center",
            paddingTop: 8,
          }}
        >
          <div style={{ width: 4, height: 9, borderRadius: 9999, background: "rgba(255,255,255,0.95)" }} />
        </div>
      </a>
    </section>
  );
}

/* ------------------------------------------------------------------ about */

function PillarIcon() {
  return (
    <div
      style={{
        width: 46,
        height: 46,
        borderRadius: "50%",
        flexShrink: 0,
        border: "1.5px solid rgba(168,115,216,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, rgba(255,216,137,0.18), rgba(255,92,168,0.14))",
      }}
    >
      <span style={{ fontFamily: SCRIPT, fontWeight: 700, fontSize: 22, color: "#FF5CA8", lineHeight: 1 }}>f</span>
    </div>
  );
}

function About() {
  return (
    <section id="about" style={{ background: "var(--color-cream)", padding: "clamp(72px, 9vw, 120px) clamp(20px, 5vw, 48px)" }}>
      <div
        className="about-grid"
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "minmax(280px, 0.85fr) 1fr",
          gap: "clamp(40px, 6vw, 88px)",
          alignItems: "center",
        }}
      >
        {/* Portrait */}
        <div style={{ position: "relative" }}>
          {/* gradient halo */}
          <div
            style={{
              position: "absolute",
              inset: "-18px -18px auto -18px",
              height: "78%",
              top: "11%",
              background: "var(--gradient-warm)",
              borderRadius: "var(--radius-xl)",
              transform: "rotate(-3deg)",
              filter: "blur(2px)",
              opacity: 0.55,
              zIndex: 0,
            }}
          />
          {/* portrait placeholder — swap for a real photo of Libby */}
          <div
            style={{
              position: "relative",
              zIndex: 1,
              width: "100%",
              height: "clamp(380px, 46vw, 520px)",
              borderRadius: 20,
              boxShadow: "var(--shadow-lg)",
              background: "var(--gradient-cool)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              overflow: "hidden",
            }}
          >
            <span style={{ fontFamily: SCRIPT, fontWeight: 400, fontSize: 64, color: "rgba(255,255,255,0.95)", lineHeight: 1 }}>
              Libby
            </span>
            <span
              style={{
                fontFamily: POPPINS,
                fontWeight: 600,
                fontSize: 11,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.75)",
              }}
            >
              Portrait coming soon
            </span>
          </div>
          {/* floating script badge */}
          <div
            style={{
              position: "absolute",
              zIndex: 2,
              right: "clamp(-6px, -1vw, -18px)",
              bottom: 26,
              background: "white",
              borderRadius: "var(--radius-lg)",
              padding: "14px 22px",
              boxShadow: "var(--shadow-lg)",
              textAlign: "center",
            }}
          >
            <div style={{ fontFamily: SCRIPT, fontWeight: 700, fontSize: 30, color: "#FF5CA8", lineHeight: 1 }}>Libby</div>
            <div
              style={{
                fontFamily: POPPINS,
                fontWeight: 700,
                fontSize: 8.5,
                letterSpacing: "0.18em",
                color: "#7A6A8A",
                textTransform: "uppercase",
                marginTop: 4,
              }}
            >
              Founder & Head Coach
            </div>
          </div>
        </div>

        {/* Copy */}
        <div>
          <div className="eyebrow" style={{ marginBottom: 16 }}>
            Meet your coach
          </div>
          <h2
            style={{
              fontFamily: POPPINS,
              fontWeight: 900,
              fontSize: "clamp(34px, 4.6vw, 52px)",
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              color: "var(--color-dark)",
              marginBottom: 6,
            }}
          >
            Train with{" "}
            <span style={{ fontFamily: SCRIPT, fontWeight: 700, fontSize: "1.18em", color: "#FF5CA8" }}>Libby</span>
          </h2>
          <p
            style={{
              fontFamily: DM_SANS,
              fontSize: "clamp(16px, 1.7vw, 18px)",
              lineHeight: 1.75,
              color: "var(--color-dark)",
              marginBottom: 18,
              maxWidth: 540,
            }}
          >
            I&apos;m Libby — a certified coach and a mum who knows what it takes to show up for yourself when life is full. I
            built a space in Beit Shemesh where Orthodox women can move, sweat and laugh together, exactly as they are.
          </p>
          <p
            style={{
              fontFamily: DM_SANS,
              fontSize: "clamp(15px, 1.6vw, 17px)",
              lineHeight: 1.75,
              color: "var(--color-gray-text)",
              marginBottom: 34,
              maxWidth: 540,
            }}
          >
            Every class is women-only, modest and welcoming — designed to build real strength, balance and confidence, body
            and soul. No judgement, no pressure. Just you, getting
            <span style={{ fontStyle: "italic", color: "#A873D8" }}> stronger every day.</span>
          </p>

          <div
            className="pillar-grid"
            style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "20px 28px", maxWidth: 540 }}
          >
            {aboutPillars.map((p) => (
              <div key={p.label} style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <PillarIcon />
                <div>
                  <div
                    style={{
                      fontFamily: POPPINS,
                      fontWeight: 700,
                      fontSize: 13,
                      letterSpacing: "0.06em",
                      color: "var(--color-dark)",
                      textTransform: "uppercase",
                    }}
                  >
                    {p.label}
                  </div>
                  <div style={{ fontFamily: DM_SANS, fontSize: 13, color: "var(--color-gray-text)", marginTop: 2 }}>{p.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ schedule */

function ClassRow({ c, booked, onToggle }: { c: ClassItem; booked: boolean; onToggle: (id: string) => void }) {
  const tag = TAG_STYLES[c.tag];
  const full = c.spots === 0 && !booked;
  const remaining = c.spots - (booked ? 1 : 0);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "clamp(14px, 2vw, 26px)",
        background: "white",
        borderRadius: "var(--radius-lg)",
        padding: "clamp(16px, 2vw, 22px) clamp(18px, 2.4vw, 26px)",
        boxShadow: booked ? "0 0 0 2px #FF5CA8, 0 8px 26px rgba(255,92,168,0.16)" : "var(--shadow-sm)",
        border: "1px solid rgba(168,115,216,0.10)",
        transition: "box-shadow 0.2s, transform 0.2s",
        flexWrap: "wrap",
      }}
    >
      {/* Time */}
      <div style={{ minWidth: 78 }}>
        <div
          style={{
            fontFamily: POPPINS,
            fontWeight: 800,
            fontSize: "clamp(20px, 2.2vw, 26px)",
            color: "var(--color-dark)",
            lineHeight: 1,
            letterSpacing: "-0.02em",
          }}
        >
          {c.time}
        </div>
        <div style={{ fontFamily: DM_SANS, fontSize: 12, color: "var(--color-gray-text)", marginTop: 5 }}>{c.dur}</div>
      </div>

      {/* Divider */}
      <div style={{ width: 1, alignSelf: "stretch", background: "rgba(168,115,216,0.16)" }} />

      {/* Details */}
      <div style={{ flex: 1, minWidth: 150 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
          <span
            style={{
              display: "inline-block",
              padding: "4px 11px",
              borderRadius: 9999,
              background: tag.bg,
              color: tag.color,
              fontFamily: POPPINS,
              fontWeight: 700,
              fontSize: 9,
              letterSpacing: "0.08em",
            }}
          >
            {c.tag.toUpperCase()}
          </span>
          <span style={{ fontFamily: DM_SANS, fontSize: 12, color: "#A873D8", fontWeight: 600, whiteSpace: "nowrap" }}>
            {c.level}
          </span>
        </div>
        <div
          style={{
            fontFamily: POPPINS,
            fontWeight: 700,
            fontSize: "clamp(16px, 1.8vw, 19px)",
            color: "var(--color-dark)",
            lineHeight: 1.2,
          }}
        >
          {c.name}
        </div>
        <div style={{ fontFamily: DM_SANS, fontSize: 12.5, color: "var(--color-gray-text)", marginTop: 3 }}>
          with Libby · Beit Shemesh studio
        </div>
      </div>

      {/* Spots */}
      <div style={{ textAlign: "right", minWidth: 84 }}>
        {full ? (
          <div
            style={{
              fontFamily: POPPINS,
              fontWeight: 700,
              fontSize: 11,
              letterSpacing: "0.06em",
              color: "#A873D8",
              textTransform: "uppercase",
            }}
          >
            Waitlist
          </div>
        ) : (
          <>
            <div style={{ fontFamily: POPPINS, fontWeight: 800, fontSize: 17, color: remaining <= 2 ? "#FF5CA8" : "var(--color-dark)" }}>
              {remaining}
            </div>
            <div style={{ fontFamily: DM_SANS, fontSize: 11, color: "var(--color-gray-text)" }}>spots left</div>
          </>
        )}
      </div>

      {/* Book button */}
      <button
        onClick={() => !full && onToggle(c.id)}
        disabled={full}
        style={{
          padding: "12px 24px",
          borderRadius: 9999,
          border: "none",
          cursor: full ? "not-allowed" : "pointer",
          minWidth: 116,
          fontFamily: POPPINS,
          fontWeight: 700,
          fontSize: 11,
          letterSpacing: "0.06em",
          background: full ? "rgba(212,200,224,0.4)" : booked ? "rgba(255,92,168,0.12)" : "linear-gradient(135deg,#FF5CA8,#A873D8)",
          color: full ? "#9A8AAA" : booked ? "#FF5CA8" : "white",
          boxShadow: full || booked ? "none" : "0 4px 14px rgba(255,92,168,0.32)",
          transition: "all 0.18s",
        }}
        onMouseEnter={(e) => {
          if (!full && !booked) e.currentTarget.style.transform = "translateY(-1px)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "none";
        }}
      >
        {full ? "Join Waitlist" : booked ? "✓ Booked" : "Book"}
      </button>
    </div>
  );
}

function Schedule({ bookings, onToggle }: { bookings: Bookings; onToggle: (id: string) => void }) {
  const [dayIdx, setDayIdx] = useState(0);
  const day = WEEK[dayIdx];

  return (
    <section id="schedule" style={{ background: "var(--bg-section-alt)", padding: "clamp(72px, 9vw, 116px) clamp(20px, 5vw, 48px)" }}>
      <div style={{ maxWidth: 980, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "clamp(36px, 5vw, 52px)" }}>
          <div className="eyebrow" style={{ marginBottom: 14 }}>
            Weekly Schedule
          </div>
          <h2
            style={{
              fontFamily: POPPINS,
              fontWeight: 900,
              fontSize: "clamp(34px, 4.8vw, 52px)",
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              color: "var(--color-dark)",
              marginBottom: 12,
            }}
          >
            Find your{" "}
            <span style={{ fontFamily: SCRIPT, fontWeight: 700, fontSize: "1.18em", color: "#FF5CA8" }}>spot</span>
          </h2>
          <p
            style={{
              fontFamily: DM_SANS,
              fontSize: "clamp(15px, 1.7vw, 17px)",
              color: "var(--color-gray-text)",
              maxWidth: 460,
              margin: "0 auto",
              lineHeight: 1.7,
            }}
          >
            Women-only classes every day but Shabbat. Tap a day, reserve your place, and we&apos;ll see you on the mat.
          </p>
        </div>

        {/* Day tabs */}
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: "clamp(28px, 4vw, 40px)", flexWrap: "wrap" }}>
          {WEEK.map((d, i) => {
            const active = i === dayIdx;
            const dayBooked = d.classes.filter((c) => bookings[c.id]).length;
            return (
              <button
                key={d.key}
                onClick={() => setDayIdx(i)}
                style={{
                  position: "relative",
                  padding: "12px 20px",
                  borderRadius: 9999,
                  border: "none",
                  cursor: "pointer",
                  background: active ? "linear-gradient(135deg,#FF5CA8,#A873D8)" : "white",
                  color: active ? "white" : "var(--color-gray-text)",
                  fontFamily: POPPINS,
                  fontWeight: 700,
                  fontSize: 12,
                  letterSpacing: "0.08em",
                  boxShadow: active ? "0 6px 18px rgba(255,92,168,0.32)" : "var(--shadow-sm)",
                  transition: "all 0.2s",
                }}
              >
                {d.short}
                {dayBooked > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: -5,
                      right: -5,
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      background: active ? "white" : "#FF5CA8",
                      color: active ? "#FF5CA8" : "white",
                      fontSize: 10,
                      fontWeight: 800,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: POPPINS,
                      boxShadow: "0 2px 6px rgba(91,45,110,0.25)",
                    }}
                  >
                    {dayBooked}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Day label */}
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 18, paddingLeft: 4 }}>
          <h3 style={{ fontFamily: POPPINS, fontWeight: 700, fontSize: 22, color: "var(--color-dark)" }}>{day.name}</h3>
          <span style={{ fontFamily: DM_SANS, fontSize: 14, color: "var(--color-gray-text)" }}>{day.classes.length} classes</span>
        </div>

        {/* Class list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {day.classes.map((c) => (
            <ClassRow key={c.id} c={c} booked={!!bookings[c.id]} onToggle={onToggle} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ booking bar + modal */

function BookingBar({ bookings, onClear, onConfirm }: { bookings: Bookings; onClear: () => void; onConfirm: () => void }) {
  const ids = Object.keys(bookings).filter((id) => bookings[id]);
  const items = ids.map((id) => ALL_CLASSES.find((c) => c.id === id)).filter(Boolean) as (ClassItem & { short: string })[];
  const show = items.length > 0;

  return (
    <div
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 180,
        display: "flex",
        justifyContent: "center",
        padding: "0 16px 18px",
        transform: show ? "translateY(0)" : "translateY(160%)",
        transition: "transform 0.4s cubic-bezier(0.4,0,0.2,1)",
        pointerEvents: show ? "auto" : "none",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 760,
          background: "var(--color-dark)",
          borderRadius: "var(--radius-xl)",
          boxShadow: "0 14px 50px rgba(91,45,110,0.45)",
          padding: "clamp(14px, 2vw, 18px) clamp(16px, 2.4vw, 24px)",
          display: "flex",
          alignItems: "center",
          gap: 18,
          flexWrap: "wrap",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14, flex: 1, minWidth: 200 }}>
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: "50%",
              flexShrink: 0,
              background: "linear-gradient(135deg,#FFD889,#FF5CA8,#5B2D6E)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: POPPINS,
              fontWeight: 800,
              fontSize: 18,
              color: "white",
            }}
          >
            {items.length}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: POPPINS, fontWeight: 700, fontSize: 14, color: "white" }}>
              {items.length} {items.length === 1 ? "session" : "sessions"} selected
            </div>
            <div
              style={{
                fontFamily: DM_SANS,
                fontSize: 12.5,
                color: "rgba(255,255,255,0.55)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                maxWidth: 360,
              }}
            >
              {items.map((c) => `${c.short} ${c.time} ${c.name}`).join("  ·  ")}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={onClear}
            style={{
              padding: "11px 18px",
              borderRadius: 9999,
              border: "1px solid rgba(255,255,255,0.22)",
              background: "transparent",
              color: "rgba(255,255,255,0.8)",
              cursor: "pointer",
              fontFamily: POPPINS,
              fontWeight: 600,
              fontSize: 11,
              letterSpacing: "0.06em",
            }}
          >
            Clear
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: "13px 28px",
              borderRadius: 9999,
              border: "none",
              cursor: "pointer",
              background: "linear-gradient(135deg,#FF5CA8,#A873D8)",
              color: "white",
              fontFamily: POPPINS,
              fontWeight: 700,
              fontSize: 12,
              letterSpacing: "0.07em",
              boxShadow: "0 6px 20px rgba(255,92,168,0.4)",
            }}
          >
            CONFIRM BOOKING
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmModal({ open, count, onClose }: { open: boolean; count: number; onClose: () => void }) {
  if (!open) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 300,
        background: "rgba(42,21,53,0.55)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        animation: "fwlFade 0.25s ease",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 440,
          background: "white",
          borderRadius: "var(--radius-xl)",
          padding: "clamp(32px, 5vw, 48px)",
          textAlign: "center",
          boxShadow: "var(--shadow-lg)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 6, background: "var(--gradient-brand-h)" }} />
        <div
          style={{
            width: 76,
            height: 76,
            borderRadius: "50%",
            margin: "6px auto 22px",
            background: "linear-gradient(135deg,#FFD889,#FF5CA8,#A873D8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 8px 28px rgba(255,92,168,0.4)",
          }}
        >
          <span style={{ color: "white", fontSize: 38, fontWeight: 800, lineHeight: 1 }}>✓</span>
        </div>
        <h3 style={{ fontFamily: POPPINS, fontWeight: 800, fontSize: 26, color: "var(--color-dark)", marginBottom: 8 }}>
          You&apos;re all booked in!
        </h3>
        <div style={{ fontFamily: SCRIPT, fontWeight: 700, fontSize: 26, color: "#FF5CA8", marginBottom: 14 }}>See you on the mat.</div>
        <p style={{ fontFamily: DM_SANS, fontSize: 15, color: "var(--color-gray-text)", lineHeight: 1.7, marginBottom: 28 }}>
          {count} {count === 1 ? "session is" : "sessions are"}{" "}
          reserved. We&apos;ve sent the details to your inbox — come as you are, and let&apos;s get stronger together.
        </p>
        <button
          onClick={onClose}
          style={{
            padding: "14px 36px",
            borderRadius: 9999,
            border: "none",
            cursor: "pointer",
            background: "linear-gradient(135deg,#FF5CA8,#A873D8)",
            color: "white",
            fontFamily: POPPINS,
            fontWeight: 700,
            fontSize: 12,
            letterSpacing: "0.08em",
            boxShadow: "0 6px 20px rgba(255,92,168,0.38)",
          }}
        >
          WONDERFUL
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ motto / cta / footer */

function Motto() {
  const streaks: { w: number; h: number; top: string; left: string; rot: number; o: number }[] = [
    { w: 620, h: 130, top: "12%", left: "8%", rot: -12, o: 0.3 },
    { w: 460, h: 96, top: "62%", left: "52%", rot: 9, o: 0.22 },
    { w: 520, h: 110, top: "38%", left: "30%", rot: -5, o: 0.2 },
  ];
  return (
    <section
      id="motto"
      style={{
        background: "linear-gradient(135deg, #FF5CA8 0%, #A873D8 52%, #5B2D6E 100%)",
        padding: "clamp(80px, 10vw, 130px) clamp(20px, 5vw, 48px)",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {streaks.map((s, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            width: s.w,
            height: s.h,
            top: s.top,
            left: s.left,
            background: "linear-gradient(90deg, rgba(255,255,255,0.6), rgba(255,255,255,0) 80%)",
            borderRadius: "50%",
            filter: "blur(22px)",
            transform: `rotate(${s.rot}deg)`,
            opacity: s.o,
          }}
        />
      ))}
      <div style={{ position: "relative", zIndex: 2, maxWidth: 820, margin: "0 auto" }}>
        <div
          style={{
            fontFamily: POPPINS,
            fontWeight: 700,
            fontSize: 11,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.78)",
            marginBottom: 22,
          }}
        >
          Libby&apos;s Motto
        </div>
        <div
          style={{
            fontFamily: SCRIPT,
            fontWeight: 700,
            fontSize: "clamp(46px, 8vw, 84px)",
            color: "white",
            lineHeight: 1.08,
            marginBottom: 24,
            textShadow: "0 3px 28px rgba(91,45,110,0.35)",
          }}
        >
          Stronger every day.
          <br />
          Inside and out.
        </div>
        <p
          style={{
            fontFamily: DM_SANS,
            fontSize: "clamp(16px, 1.9vw, 19px)",
            color: "rgba(255,255,255,0.9)",
            maxWidth: 560,
            margin: "0 auto 44px",
            lineHeight: 1.75,
          }}
        >
          It&apos;s never only about the workout. It&apos;s about walking out taller than you walked in — carrying that strength
          home to your family, your faith and yourself.
        </p>
        <div style={{ display: "flex", gap: "clamp(18px, 3vw, 40px)", justifyContent: "center", flexWrap: "wrap" }}>
          {VALUES.map((v) => (
            <div key={v} style={{ textAlign: "center" }}>
              <div
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: "50%",
                  border: "1.5px solid rgba(255,255,255,0.5)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 10px",
                }}
              >
                <span style={{ fontFamily: SCRIPT, fontWeight: 700, fontSize: 24, color: "white", lineHeight: 1 }}>f</span>
              </div>
              <div
                style={{
                  fontFamily: POPPINS,
                  fontWeight: 700,
                  fontSize: 9.5,
                  letterSpacing: "0.13em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.82)",
                }}
              >
                {v}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA({ onBook }: { onBook: () => void }) {
  return (
    <section
      style={{
        padding: "clamp(80px, 10vw, 124px) clamp(20px, 5vw, 48px)",
        textAlign: "center",
        background: "radial-gradient(ellipse at 50% 40%, #FFD889 0%, #FF8FA3 35%, #FF5CA8 62%, #5B2D6E 100%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{ position: "relative", zIndex: 2, maxWidth: 720, margin: "0 auto" }}>
        <div
          style={{
            fontFamily: POPPINS,
            fontWeight: 700,
            fontSize: 11,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.85)",
            marginBottom: 18,
          }}
        >
          Your first class is on us
        </div>
        <h2
          style={{
            fontFamily: POPPINS,
            fontWeight: 900,
            fontSize: "clamp(40px, 6.4vw, 72px)",
            color: "white",
            lineHeight: 1.02,
            letterSpacing: "-0.02em",
            marginBottom: 18,
            textShadow: "0 3px 26px rgba(91,45,110,0.35)",
          }}
        >
          Move together.
          <br />
          Feel fabulous.
        </h2>
        <p
          style={{
            fontFamily: DM_SANS,
            fontSize: "clamp(16px, 1.9vw, 19px)",
            color: "rgba(255,255,255,0.92)",
            maxWidth: 480,
            margin: "0 auto 38px",
            lineHeight: 1.7,
          }}
        >
          Come try a women-only class in Beit Shemesh — no commitment, just bring yourself and a water bottle.
        </p>
        <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
          <button
            onClick={onBook}
            style={{
              padding: "18px 46px",
              borderRadius: 9999,
              background: "white",
              color: "#FF5CA8",
              fontFamily: POPPINS,
              fontWeight: 800,
              fontSize: 14,
              letterSpacing: "0.08em",
              border: "none",
              cursor: "pointer",
              boxShadow: "0 10px 40px rgba(91,45,110,0.32)",
              transition: "transform 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "none")}
          >
            BOOK A FREE TRIAL
          </button>
          <a
            href="#schedule"
            style={{
              padding: "18px 40px",
              borderRadius: 9999,
              background: "transparent",
              color: "white",
              fontFamily: POPPINS,
              fontWeight: 700,
              fontSize: 14,
              letterSpacing: "0.08em",
              border: "1.5px solid rgba(255,255,255,0.6)",
              cursor: "pointer",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
            }}
          >
            VIEW SCHEDULE
          </a>
        </div>
      </div>
    </section>
  );
}

function SiteFooter() {
  return (
    <footer
      id="footer"
      style={{ background: "var(--color-dark)", color: "white", padding: "clamp(56px, 7vw, 76px) clamp(20px, 5vw, 48px) 32px" }}
    >
      <div style={{ maxWidth: 1180, margin: "0 auto" }}>
        <div
          className="footer-grid"
          style={{ display: "grid", gridTemplateColumns: "1.7fr 1fr 1fr 1fr", gap: "clamp(28px, 4vw, 56px)", marginBottom: 48 }}
        >
          <div>
            <div style={{ marginBottom: 18 }}>
              <img src="/logo-libby-white.png" alt="Fitness With Libby" style={{ height: 64, width: "auto", display: "block" }} />
            </div>
            <p style={{ fontFamily: DM_SANS, fontSize: 14, color: "rgba(255,255,255,0.6)", lineHeight: 1.75, marginBottom: 18, maxWidth: 300 }}>
              Empowering Orthodox women in Beit Shemesh with strength, balance and confidence — body and soul.
            </p>
            <div style={{ fontFamily: SCRIPT, fontWeight: 400, fontSize: 26, color: "#FF8FA3" }}>Stronger every day.</div>
          </div>
          {FOOTER_COLS.map((col) => (
            <div key={col.title}>
              <div
                style={{
                  fontFamily: POPPINS,
                  fontWeight: 700,
                  fontSize: 10,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  color: "#FF8FA3",
                  marginBottom: 16,
                }}
              >
                {col.title}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                {col.links.map((l) => (
                  <a
                    key={l}
                    href="#"
                    style={{
                      fontFamily: DM_SANS,
                      fontSize: 13.5,
                      color: "rgba(255,255,255,0.6)",
                      textDecoration: "none",
                      transition: "color 0.2s",
                      width: "fit-content",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "white")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.6)")}
                  >
                    {l}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div
          style={{
            borderTop: "1px solid rgba(255,255,255,0.1)",
            paddingTop: 24,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div style={{ fontFamily: DM_SANS, fontSize: 12.5, color: "rgba(255,255,255,0.4)" }}>
            © 2026 Fitness With Libby. All rights reserved.
          </div>
          <div style={{ display: "flex", gap: 24 }}>
            {["Privacy", "Terms", "Accessibility"].map((l) => (
              <a key={l} href="#" style={{ fontFamily: DM_SANS, fontSize: 12.5, color: "rgba(255,255,255,0.4)", textDecoration: "none" }}>
                {l}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ------------------------------------------------------------------ app */

export default function FitnessLanding() {
  const [bookings, setBookings] = useState<Bookings>({});
  const [modal, setModal] = useState(false);
  const [confirmedCount, setConfirmedCount] = useState(0);

  // Load persisted bookings after mount. Reading localStorage during render
  // would cause an SSR/client hydration mismatch, so we sync it in once here.
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration from an external store (localStorage)
      if (stored) setBookings(JSON.parse(stored) as Bookings);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
    } catch {
      /* ignore */
    }
  }, [bookings]);

  const toggle = useCallback((id: string) => {
    setBookings((prev) => {
      const next = { ...prev };
      if (next[id]) delete next[id];
      else next[id] = true;
      return next;
    });
  }, []);

  const clear = useCallback(() => setBookings({}), []);

  const goSchedule = useCallback(() => {
    document.getElementById("schedule")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const confirm = useCallback(() => {
    setConfirmedCount(Object.values(bookings).filter(Boolean).length);
    setModal(true);
  }, [bookings]);

  const closeModal = useCallback(() => {
    setModal(false);
    setBookings({});
  }, []);

  return (
    <div className="fwl-root">
      <StickyNav onBook={goSchedule} />
      <Hero />
      <About />
      <Schedule bookings={bookings} onToggle={toggle} />
      <Motto />
      <CTA onBook={goSchedule} />
      <SiteFooter />
      <BookingBar bookings={bookings} onClear={clear} onConfirm={confirm} />
      <ConfirmModal open={modal} count={confirmedCount} onClose={closeModal} />
    </div>
  );
}
