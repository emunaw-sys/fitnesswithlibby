import type { Metadata } from "next";
import Navbar from "../components/Navbar";
import { Footer } from "../components/Sections";
import BookingWidget from "../components/BookingWidget";

export const metadata: Metadata = {
  title: "Book a Class — Fitness With Libby",
  description:
    "Book your class at Fitness With Libby in Beit Shemesh. New here? Your first class is a single drop-in — no membership required.",
};

export default function BookPage() {
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
          <BookingWidget />
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
