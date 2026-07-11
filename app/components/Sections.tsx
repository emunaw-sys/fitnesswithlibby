/* eslint-disable @next/next/no-img-element */

/* ============ SECTION 2 — A PLACE TO GROW ============ */
export function Values() {
  return (
    <section className="grow">
      <div className="grow-kicker">
        <div className="rule" />
        <span>A Place to Grow</span>
        <div className="rule" />
      </div>

      <h2 className="grow-title">
        <span className="gt-line">Warm Welcome. Real Work.</span>
        <span className="gt-line line2">
          Stronger Every <span className="script">week</span>
          <span className="dot">.</span>
        </span>
      </h2>

      <p className="grow-sub">
        Real workouts. Real strength. A supportive community where you can
        challenge yourself and feel stronger every week.
      </p>

      <div className="cards">
        <div className="card card-1">
          <div className="card-num">01</div>
          <svg className="doodle tr" width="26" height="18" viewBox="0 0 26 18" fill="none">
            <circle cx="4" cy="4" r="2" fill="#fff" opacity=".9" />
            <circle cx="14" cy="9" r="2" fill="#fff" opacity=".9" />
            <circle cx="6" cy="14" r="2" fill="#fff" opacity=".9" />
          </svg>
          <div className="card-body">
            <div className="card-word">Strength</div>
            <div className="card-text">
              <h3>Build Real Strength</h3>
              <p>
                Not the kind you do once and forget. The kind that stays with
                you during the week that makes you feel energized!
              </p>
            </div>
          </div>
        </div>

        <div className="card card-2">
          <div className="card-num">02</div>
          <div className="card-body">
            <div className="card-word">Kosher</div>
            <div className="card-text">
              <h3>Kosher Environment</h3>
              <p>
                Only Jewish music. A tzniusdik, spiritually aligned space where
                you can focus on working out — not at the detriment of your
                ruchniyos.
              </p>
            </div>
          </div>
        </div>

        <div className="card card-3">
          <div className="card-num">03</div>
          <div className="card-body">
            <div className="card-word">Together</div>
            <div className="card-text">
              <h3>Supportive Community</h3>
              <p>
                Women who cheer each other on, build each other up, and leave
                competition at the door.
              </p>
            </div>
          </div>
        </div>

        <div className="card card-4">
          <div className="card-num">04</div>
          <div className="card-body">
            <div className="card-word">Have Fun</div>
            <div className="card-text">
              <h3>Have Fun Doing It</h3>
              <p>
                If it never feels good, you won&rsquo;t keep coming.
                Libby&rsquo;s classes are hard — and genuinely fun. That
                combination is rare.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============ SECTION 3 — MEET LIBBY ============ */
export function About() {
  return (
    <section className="meet" id="about">
      <div className="meet-inner">
        <div className="meet-photo">
          <img src="/libby.png" alt="Libby, founder of Fitness With Libby" />
        </div>

        <div className="meet-copy">
          <div className="meet-kicker">
            <div className="rule" />
            <span>The Woman Behind It</span>
            <div className="rule" />
          </div>

          <h2 className="meet-title">
            Hi, I&rsquo;m <span className="script">Libby</span>
          </h2>

          <p>
            I&rsquo;ll tell you a secret: I never liked to exercise. Growing up,
            I was a dancer — not a gym person. Movement had to feel like
            something, or I wasn&rsquo;t interested.
          </p>
          <p>
            After training in fitness, personal training, TRX, and kickboxing at
            Wingate College, and Pilates at MG Studios in Jerusalem, everything
            changed. I learned that when a workout actually feels good — when you
            look forward to it — you keep showing up. And that consistency is
            what changes everything.
          </p>
          <p>
            Today I&rsquo;m an exercise fanatic, which still makes me laugh. I
            built this studio because I wanted a place I&rsquo;d actually love to
            go to: warm, fun, and built for women like us. When you come to
            class, you&rsquo;re not a number. You&rsquo;re someone I&rsquo;m
            genuinely glad showed up.
          </p>

          <div className="meet-creds">
            <div className="cred c1">
              <div className="ico">
                <svg width="22" height="18" viewBox="0 0 24 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 1 L23 6 L12 11 L1 6 Z" fill="#fff" />
                  <path
                    d="M5 8.5 V13.5 C5 15 8 17 12 17 C16 17 19 15 19 13.5 V8.5"
                    stroke="#fff"
                    strokeWidth="1.6"
                    fill="none"
                  />
                  <line x1="23" y1="6" x2="23" y2="12" stroke="#fff" strokeWidth="1.6" />
                </svg>
              </div>
              <div>
                <span>Trained At</span>
                <b>Wingate College</b>
              </div>
            </div>
            <div className="cred c2">
              <div className="ico">
                <svg width="24" height="16" viewBox="0 0 26 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="5" cy="4" r="2.4" fill="#fff" />
                  <path d="M7 7 C 10 9, 15 9, 19 8" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" fill="none" />
                  <line x1="1" y1="13" x2="25" y2="13" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
                  <line x1="4" y1="13" x2="4" y2="15.5" stroke="#fff" strokeWidth="1.6" />
                  <line x1="22" y1="13" x2="22" y2="15.5" stroke="#fff" strokeWidth="1.6" />
                </svg>
              </div>
              <div>
                <span>Pilates</span>
                <b>MG Studios, Jerusalem</b>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============ SECTION 4 — CLASSES (BENTO) ============ */
export function Classes() {
  return (
    <section className="classes" id="classes">
      <div className="bento">
        <div className="b-head">
          <div>
            <div className="b-kicker">
              <div className="rule" />
              <span>Movement That Moves You</span>
            </div>
            <h2>
              Real Classes, <span>Morning and Evening</span>
            </h2>
          </div>
          <div>
            <p>
              Libby&rsquo;s classes bring together a range of movement styles —
              strength training, dance, cardio, kickboxing, step, and more —
              woven into sessions that challenge your whole body.
            </p>
            <p style={{ marginTop: 14 }}>
              Every session is a full experience, and every woman shows up when
              her week allows. With morning and evening slots, there&rsquo;s
              always a time that fits around your family and your life.
            </p>
          </div>
        </div>

        <div className="b-style s1">
          <img className="ph" src="/style-strengthen-tone.png" alt="" />
          <div className="shade" />
          <span className="num">01</span>
          <svg className="doodle br" width="26" height="18" viewBox="0 0 26 18" fill="none">
            <circle cx="4" cy="4" r="2" fill="currentColor" opacity=".8" />
            <circle cx="14" cy="9" r="2" fill="currentColor" opacity=".8" />
            <circle cx="6" cy="14" r="2" fill="currentColor" opacity=".8" />
          </svg>
          <span className="name">
            Strengthen &amp; <i>Tone</i>
          </span>
        </div>

        <div className="b-style s2">
          <span className="num">02</span>
          <span className="name">
            Dance <i>Fit</i>
          </span>
        </div>

        <div className="b-style s3">
          <img className="ph" src="/style-pilates.png" alt="" />
          <div className="shade" />
          <span className="num">03</span>
          <span className="name">Pilates</span>
        </div>

        <div className="b-style s4">
          <span className="num">04</span>
          <span className="name">
            Teens <i>Dance</i>
          </span>
        </div>

        <div className="b-style s5">
          <span className="num">05</span>
          <span className="name">Cardio</span>
        </div>

        <div className="b-style s6">
          <span className="num">06</span>
          <span className="name">Kickboxing</span>
        </div>

        <div className="b-style s7">
          <img className="ph" src="/style-step.png" alt="" />
          <div className="shade" />
          <span className="num">07</span>
          <span className="name">Step</span>
        </div>
      </div>
    </section>
  );
}

/* ============ SECTION 5 — PERSONAL TRAINING ============ */
export function PersonalTraining() {
  return (
    <section className="train" id="training">
      <div className="train-inner">
        <div className="train-copy">
          <div className="train-kicker">
            <div className="rule" />
            <span>For When You Want More</span>
          </div>

          <h2 className="train-title">
            Personal Training
            <span className="script">with Libby</span>
          </h2>

          <p>
            Group classes are where the energy is. Personal training is where
            the real transformation happens.
          </p>
          <p>
            If you want a programme designed entirely around your body, your
            goals, and your schedule — Libby works with a small number of women
            one-on-one.
          </p>
          <p>
            Whether you&rsquo;re working through something — recovery, a health
            goal, a season of life that needs something more intentional —
            personal training gives you that space.
          </p>

          <div className="train-cta">
            <a className="btn-primary" href="/#contact">
              <span>Enquire About Personal Training</span>
            </a>
          </div>
        </div>

        <div className="train-plan">
          <p className="plan-lead">
            want something built just for you?
            <svg width="30" height="34" viewBox="0 0 30 34" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 2 C 16 8, 22 18, 22 30" stroke="#DE2160" strokeWidth="2" strokeLinecap="round" />
              <path d="M22 30 L16.5 26.5 M22 30 L26.5 25.5" stroke="#DE2160" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </p>
          <div className="plan-card">
            <details className="step">
              <summary>
                <span className="n">01</span>
                <span className="divider" />
                <h4>Personal Assessment</h4>
                <span className="plus">+</span>
              </summary>
              <p>We start with where you are now – your body, goals and lifestyle.</p>
            </details>
            <details className="step">
              <summary>
                <span className="n">02</span>
                <span className="divider" />
                <h4>Custom Plan</h4>
                <span className="plus">+</span>
              </summary>
              <p>A program designed for you. No cookie-cutter anything.</p>
            </details>
            <details className="step">
              <summary>
                <span className="n">03</span>
                <span className="divider" />
                <h4>Real Accountability</h4>
                <span className="plus">+</span>
              </summary>
              <p>Consistent support and guidance to keep moving you forward.</p>
            </details>
            <details className="step">
              <summary>
                <span className="n">04</span>
                <span className="divider" />
                <h4>Focused Coaching</h4>
                <span className="plus">+</span>
              </summary>
              <p>A dedicated space where you are seen, supported and challenged.</p>
            </details>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============ SECTION 6 — TESTIMONIALS ============ */
export function Testimonials() {
  return (
    <section className="testi" id="reviews">
      <div className="testi-head">
        <div className="testi-kicker">
          <div className="rule" />
          <span>Reviews</span>
          <div className="rule" />
        </div>
        <h2 className="testi-title">
          What The Women Are <em>Saying</em>
        </h2>
        <p className="testi-sub">
          <span className="script">Real women.</span> Real results. In their own
          words.
        </p>
      </div>

      <div className="testi-stage">
        <div className="testi-bg-words">
          <div className="bg-col bg-left">
            <span>Real</span>
            <span>Women.</span>
          </div>
          <div className="bg-col bg-right">
            <span>Real</span>
            <span>Results.</span>
          </div>
        </div>

        <button className="t-arrow prev" aria-label="Previous review">
          &#8249;
        </button>

        <div className="deck" id="deck">
          <div className="t-card grad" data-pos="0">
            <span className="qmark">&ldquo;</span>
            <blockquote>
              I never enjoyed hard classes before I came here.
            </blockquote>
            <div className="sig">
              <span className="sig-name">Tehilla</span>
              <span className="sig-sub">Tehilla G. · Studio Member</span>
            </div>
          </div>
          <div className="t-card v-plum" data-pos="1">
            <span className="qmark">&ldquo;</span>
            <blockquote>I never knew strength could be so fun.</blockquote>
            <div className="sig">
              <span className="sig-name">Tali</span>
              <span className="sig-sub">Tali · Studio Member</span>
            </div>
          </div>
          <div className="t-card v-magenta" data-pos="2">
            <span className="qmark">&ldquo;</span>
            <blockquote>
              This is something so unique — real strength and real fun all
              rolled into one.
            </blockquote>
            <div className="sig">
              <span className="sig-name">Yehudit</span>
              <span className="sig-sub">Yehudit S. · Studio Member</span>
            </div>
          </div>
          <div className="t-card v-cream" data-pos="3">
            <span className="qmark">&ldquo;</span>
            <blockquote>
              Libby&rsquo;s classes are truly the highlight of my week. She is so
              in tune with the women who come, and she gives such thoughtful
              attention to each person. You can really feel how much she cares,
              and she creates an atmosphere that makes everyone feel seen,
              supported, and motivated.
            </blockquote>
            <div className="sig">
              <span className="sig-name">Shani</span>
              <span className="sig-sub">Shani K. · Studio Member</span>
            </div>
          </div>
        </div>

        <button className="t-arrow next" aria-label="Next review">
          &#8250;
        </button>
      </div>

      <div className="t-dots" id="tDots" />
    </section>
  );
}

/* ============ SECTION 7 — READY TO START ============ */
export function GetStarted() {
  return (
    <section className="ready">
      <div className="ready-head">
        <div className="ready-kicker">
          <div className="rule" />
          <span>Let&rsquo;s Make It Happen</span>
          <div className="rule" />
        </div>
        <h2 className="ready-title">Ready To Start?</h2>
        <p className="ready-script">book it. show up. feel amazing.</p>
        <p className="ready-sub">
          No pressure, no complicated plans — just choose what works for your
          schedule and start moving.
        </p>
      </div>

      <div className="r-cards">
        <div className="r-card rc-1">
          <div className="r-body">
            <div className="r-num">01</div>
            <h3>Book Your First Class</h3>
            <p>Pick a time that fits your week. No commitment, no pressure.</p>
          </div>
          <div className="r-float">
            <img className="r-img" src="/calendar-3d.png" alt="Calendar" />
          </div>
        </div>

        <div className="r-card rc-2">
          <div className="r-body">
            <div className="r-num">02</div>
            <h3>Come And Feel It For Yourself</h3>
            <p>
              Warm welcome, real women, and a class that will genuinely
              challenge you — in the best way.
            </p>
          </div>
          <div className="r-float">
            <img className="r-img" src="/dumbbells.png" alt="Dumbbells" />
          </div>
        </div>

        <div className="r-card rc-3">
          <div className="r-body">
            <div className="r-num">03</div>
            <h3>Make It Your Thing</h3>
            <p>
              Love it? Join the membership. Want more? Ask Libby about personal
              training.
            </p>
            <a className="r-cta" href="/book">
              Book Your First Class &#8250;
            </a>
          </div>
          <div className="r-float">
            <span>feel amazing.</span>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============ SECTION 8 — MEMBERSHIP ============ */
export function Membership() {
  return (
    <section className="member" id="membership">
      <div className="member-head">
        <div className="member-kicker">
          <div className="rule" />
          <span>Membership</span>
          <div className="rule" />
        </div>
        <h2 className="member-title">
          Simple Membership.
          <br />
          Come At <span className="script">your pace.</span>
        </h2>
      </div>

      <div className="m-cards">
        <div className="m-card light">
          <div className="m-label">1 Class / Week</div>
          <div className="m-price">
            ₪160 <small>/ MONTH</small>
          </div>
          <p>Your weekly reset. One class, every week, consistently.</p>
        </div>
        <div className="m-card feature">
          <div className="m-label">2 Classes / Week</div>
          <div className="m-price">
            ₪280 <small>/ MONTH</small>
          </div>
          <p>
            For when you&rsquo;re ready to go further. Twice the sessions, twice
            the results.
          </p>
        </div>
      </div>

      <p className="m-foot">
        Your first class is a single drop-in — no membership required. When
        you&rsquo;re ready, join a membership and keep coming. No payment runs on
        the site; Libby will be in touch.
      </p>
      <p className="m-pt">
        Personal training available separately — enquire directly for details
        and availability.
      </p>
    </section>
  );
}

/* ============ SECTION 9 — FINAL CTA + CONTACT ============ */
export function FinalCta() {
  return (
    <section className="contact" id="contact">
      <div className="contact-inner">
        <div className="contact-copy">
          <div className="contact-kicker">
            <div className="rule" />
            <span>Ready When You Are</span>
          </div>
          <h2>
            Let&rsquo;s Move, Get Stronger, And Have Fun{" "}
            <span className="script">together.</span>
          </h2>
          <p>
            There&rsquo;s a warm welcome waiting, and no commitment to start.
            Tell Libby what you&rsquo;re looking for, and{" "}
            <span className="hl">she&rsquo;ll help you find the right fit.</span>
          </p>
        </div>

        <form className="c-form">
          <label htmlFor="cf-name">Name *</label>
          <input id="cf-name" type="text" required />

          <label htmlFor="cf-email">Email *</label>
          <input id="cf-email" type="email" required />

          <label htmlFor="cf-phone">Phone</label>
          <input id="cf-phone" type="tel" />

          <label>I&rsquo;m interested in</label>
          <div className="c-interest">
            <span className="c-chip active">First Class</span>
            <span className="c-chip">Membership</span>
            <span className="c-chip">Personal Training</span>
            <span className="c-chip">Not Sure Yet</span>
          </div>

          <label htmlFor="cf-msg">Message</label>
          <textarea id="cf-msg" rows={3} />

          <button className="c-submit" type="submit">
            Let&rsquo;s Talk
          </button>
          <p className="c-note">
            No payment runs on the site — Libby will be in touch.
          </p>
        </form>
      </div>
    </section>
  );
}

/* ============ SECTION 10 — FOOTER ============ */
export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-top">
          <div className="footer-brand">
            <img className="footer-logo" src="/logo-libby-black.png" alt="Fitness With Libby" />
            <p className="footer-mission">
              Movement that builds you up — physically and mentally. A warm,
              private studio in Beit Shemesh.
            </p>

            <div className="footer-details">
              <a className="footer-detail" href="mailto:Libbysolomons71@gmail.com">
                <svg className="footer-ico" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="3" y="5" width="18" height="14" rx="2.5" stroke="currentColor" strokeWidth="1.6" />
                  <path d="M4 7.5 12 13l8-5.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>Libbysolomons71@gmail.com</span>
              </a>
              <p className="footer-detail">
                <svg className="footer-ico" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                  <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.6" />
                </svg>
                <span>Beit Shemesh, Gimmel 2</span>
              </p>
            </div>
          </div>

          <div className="footer-nav" role="navigation" aria-label="Footer">
            <span className="footer-col-title">Explore</span>
            <a href="/">Home</a>
            <a href="/book">Classes &amp; Booking</a>
            <a href="/#about">About Libby</a>
            <a href="/#training">Personal Training</a>
            <a href="/#contact">Contact</a>
          </div>

          <div className="footer-contact">
            <a className="btn-primary footer-cta" href="/#contact">
              <span>Get In Touch</span>
            </a>
            <a className="footer-member" href="/book">
              Already a member? Book your class <span className="arr">&#8594;</span>
            </a>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="footer-copy">
            &copy; {new Date().getFullYear()} Fitness With Libby. All rights
            reserved.
          </p>

          <p className="footer-credit">
            Designed by <span className="footer-credit-name">Emuna Stein</span>
            {" — Web & Design Strategist"}
          </p>

          <div className="footer-legal">
            <a href="#">Privacy Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
