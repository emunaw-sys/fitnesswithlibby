import type { Metadata } from "next";
import Navbar from "./components/Navbar";
import { Footer } from "./components/Sections";

export const metadata: Metadata = {
  title: "Page Not Found — Fitness With Libby",
  // A 404 should never be indexed — it has no content worth ranking, and an
  // indexed one shows up in search results as a dead end.
  robots: { index: false, follow: false },
};

/**
 * Shown for any URL that doesn't exist. Keeping the real nav and footer means a
 * mistyped or out-of-date link (an old flyer, a stale WhatsApp forward) still
 * lands someone inside the site with a way to book, instead of dead-ending.
 */
export default function NotFound() {
  return (
    <main>
      <Navbar />

      <section className="notfound">
        <p className="notfound-code">404</p>
        <h1 className="notfound-title">
          This page took a<span className="notfound-script">rest day</span>
        </h1>
        <p className="notfound-body">
          The page you were looking for isn&rsquo;t here — it may have moved, or
          the link may be out of date. The schedule and everything else is still
          exactly where you left it.
        </p>

        <div className="cta-row notfound-cta">
          <a className="btn-primary" href="/book">
            <span>See The Schedule</span>
          </a>
          <a className="btn-text" href="/">
            Back to the homepage<span className="arr">&#8594;</span>
          </a>
        </div>
      </section>

      <Footer />
    </main>
  );
}
