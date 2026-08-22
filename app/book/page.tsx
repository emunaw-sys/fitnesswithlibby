import type { Metadata } from "next";
import Navbar from "../components/Navbar";
import { Footer } from "../components/Sections";
import BookingFlow from "../components/BookingFlow";
import { getSchedule, type DaySchedule } from "../lib/airtable";

const TITLE = "Book a Class — Fitness With Libby";
const DESCRIPTION =
  "Book your class at Fitness With Libby in Beit Shemesh. New here? Your first class is a single drop-in — no membership required.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/book" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/book" },
};

// Render on request (not at build time), so the deploy never depends on
// Airtable being reachable. The Airtable reads are still cached (see
// app/lib/airtable.ts), so this doesn't add API calls.
export const dynamic = "force-dynamic";

export default async function BookPage() {
  let schedule: DaySchedule[] = [];
  let loadError = false;
  try {
    schedule = await getSchedule();
  } catch (err) {
    console.error("Could not load the class schedule from Airtable:", err);
    loadError = true;
  }

  return (
    <main className="book-page">
      <Navbar />

      <header className="book-header">
        <div className="book-kicker">
          <div className="rule" />
          <span>Booking</span>
          <div className="rule" />
        </div>
        <h1 className="book-title">
          Book Your <span className="script">Class</span>
        </h1>
        <p className="book-sub">
          New here? Pick a time below — your first class is a single drop-in, no
          membership required.
        </p>
      </header>

      <section className="book-paths-wrap">
        <div className="book-paths">
          <div className="book-path path-new">
            <span className="book-path-label">New here?</span>
            <p>
              Book your <strong>first class</strong> — a single drop-in. No
              membership, no commitment.
            </p>
          </div>
          <div className="book-path path-member">
            <span className="book-path-label">Already a member?</span>
            <p>
              Book <strong>this week&rsquo;s class</strong> straight from the
              live schedule.
            </p>
          </div>
        </div>
      </section>

      <section className="book-widget-section">
        <div className="book-card">
          {loadError ? (
            <p className="bf-empty" style={{ textAlign: "center" }}>
              Online booking is briefly unavailable. Please try again in a few
              minutes, or email Libby at{" "}
              <a href="mailto:Libbysolomons71@gmail.com">
                Libbysolomons71@gmail.com
              </a>{" "}
              to book your place.
            </p>
          ) : (
            <BookingFlow schedule={schedule} />
          )}
        </div>

        <p className="book-outro">
          Loved your class?{" "}
          <a href="/#membership">Memberships start at ₪160/month.</a> Want
          one-on-one? <a href="/#contact">Ask about personal training.</a>
        </p>
      </section>

      <Footer />
    </main>
  );
}
