/* eslint-disable @next/next/no-img-element */
import "./hero.css";

const NAV_LINKS = [
  "Classes",
  "Studio",
  "About",
  "Membership",
  "Reviews",
  "Contact",
];

export default function Hero() {
  return (
    <section className="hero">
      {/* decorative layers */}
      <img className="hero__studio" src="/hero/studio.png" alt="" aria-hidden />
      <img className="hero__ring" src="/hero/gold-ring.png" alt="" aria-hidden />
      <img className="hero__floral" src="/hero/floral.png" alt="" aria-hidden />
      <img className="hero__wave" src="/hero/wave.png" alt="" aria-hidden />
      <img
        className="hero__streak"
        src="/hero/gold-streak.png"
        alt=""
        aria-hidden
      />
      <img
        className="hero__bottle"
        src="/hero/bottle.png"
        alt=""
        aria-hidden
      />

      <div className="hero__inner">
        {/* navigation */}
        <nav className="hero__nav" aria-label="Primary">
          <a className="hero__logo" href="#" aria-label="Fitness With Libby — home">
            <img src="/logo-libby.png" alt="Fitness With Libby" />
          </a>

          <ul className="hero__links">
            {NAV_LINKS.map((label) => (
              <li key={label}>
                <a href={`#${label.toLowerCase()}`}>{label}</a>
              </li>
            ))}
          </ul>

          <a className="btn-primary hero__cta-top" href="#book">
            Book a trial class <span className="arrow">&rarr;</span>
          </a>

          <button className="hero__menu" aria-label="Open menu">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path
                d="M3 6h18M3 12h18M3 18h18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </nav>

        {/* hero copy */}
        <div className="hero__content">
          <p className="hero__eyebrow">
            <span className="ink">Women-Only Fitness Studio</span>{" "}
            <span className="pink">in Beit Shemesh</span>
          </p>

          <h1 className="hero__title">
            <span className="line">Where</span>
            <span className="line">
              Fitness <span className="spark">&#10022;</span>
            </span>
            <span className="line meets-line">
              <span className="meets">Meets</span>
              <span className="script">fun</span>
            </span>
          </h1>

          <div className="hero__dash">
            <span />
            <i className="spark spark--coral" aria-hidden>
              &#10022;
            </i>
          </div>

          <p className="hero__lead">
            Women-only group classes &mdash; strengthen &amp; tone and dance fit
            &mdash; in a warm, private studio in Beit Shemesh.
          </p>

          <p className="hero__note">
            <span className="spark" aria-hidden>
              &#10022;
            </span>
            Come exactly as you are. Your first class is on us.
          </p>

          <div className="hero__actions">
            <a className="btn-primary" href="#book">
              Book a trial class <span className="arrow">&rarr;</span>
            </a>
            <a className="btn-text" href="#classes">
              View classes <span className="arrow">&rarr;</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
