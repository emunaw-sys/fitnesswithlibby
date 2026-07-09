/* eslint-disable @next/next/no-img-element */
import Navbar from "./Navbar";

export default function Hero() {
  return (
    <section className="hero">
      <div className="hero-bg" />

      <Navbar />

      <div className="hero-content">
        <div className="kicker">
          <span>
            Women-Only Fitness Studio &nbsp;·&nbsp; <em>In Beit Shemesh</em>
          </span>
        </div>

        <div className="sx sx-r">
          <h1>
            <span className="l1">Where Fitness Meets</span>
          </h1>
        </div>
        <div className="sx sx-l">
          <span className="fun fun-wrap">fun</span>
        </div>

        <p className="hero-sub">
          Group classes in a warm, private studio in Beit Shemesh. Strength
          training, cardio, dance — real work that leaves you stronger every
          time. Come exactly as you are.
        </p>
        <p className="hero-tag">
          It&rsquo;s not about being strong. It&rsquo;s about building strength.
        </p>

        <div className="cta-row">
          <a className="btn-primary" href="/book">
            <span>Book Your First Class</span>
          </a>
          <a className="btn-text" href="/book">
            Already a member? Book your class<span className="arr">&#8594;</span>
          </a>
        </div>
      </div>
    </section>
  );
}
