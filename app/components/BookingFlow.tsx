"use client";

import { useMemo, useState } from "react";
import type { DaySchedule } from "@/app/lib/airtable";

/* ------------------------------------------------------------------ *
 * BOOKING FLOW
 * ------------------------------------------------------------------
 * The live schedule comes in as a prop from the server (app/book/page),
 * which reads it from Airtable. `spotsLeft` is Airtable's computed
 * "Spots Left" (capacity − bookings). On submit we POST to /api/book,
 * which writes the booking row back into Airtable.
 * ------------------------------------------------------------------ */

const LOW_SPOTS = 3; // at or below this we nudge "only N places left"

type Details = {
  name: string;
  email: string;
  phone: string;
  firstTime: boolean;
};

const EMPTY_DETAILS: Details = {
  name: "",
  email: "",
  phone: "",
  firstTime: false,
};

export default function BookingFlow({ schedule }: { schedule: DaySchedule[] }) {
  const [dayIdx, setDayIdx] = useState<number | null>(null);
  const [classIdx, setClassIdx] = useState<number | null>(null);
  const [details, setDetails] = useState<Details>(EMPTY_DETAILS);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<{
    className: string;
    when: string;
    name: string;
    email: string;
  } | null>(null);

  const selectedDay = dayIdx === null ? null : schedule[dayIdx];
  const selectedClass =
    selectedDay && classIdx !== null ? selectedDay.classes[classIdx] : null;

  const detailsValid =
    selectedClass !== null &&
    details.name.trim() !== "" &&
    details.email.trim() !== "";

  const hint = useMemo(() => {
    if (dayIdx === null) return "Choose a day to get started";
    if (classIdx === null) return "Now pick which class";
    if (!detailsValid) return "Add your name and email to finish";
    return "";
  }, [dayIdx, classIdx, detailsValid]);

  function pickDay(i: number) {
    setDayIdx(i);
    setClassIdx(null);
  }

  function changeDay() {
    setDayIdx(null);
    setClassIdx(null);
  }

  async function submit() {
    if (!selectedDay || !selectedClass || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: selectedClass.id,
          name: details.name.trim(),
          email: details.email.trim(),
          phone: details.phone.trim(),
          firstTime: details.firstTime,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Something went wrong. Please try again.");
      }
      setConfirmed({
        className: selectedClass.name,
        when: `${selectedDay.day} ${selectedDay.nextDate}, ${selectedClass.time}`,
        name: details.name.trim(),
        email: details.email.trim(),
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setDayIdx(null);
    setClassIdx(null);
    setDetails(EMPTY_DETAILS);
    setConfirmed(null);
    setError(null);
  }

  /* ---------------------------- confirmation --------------------------- */
  if (confirmed) {
    return (
      <div className="bf-done">
        <div className="bf-mark" aria-hidden>
          ✓
        </div>
        <h2 className="bf-done-title">
          You&rsquo;re <span className="script">in</span>
        </h2>
        <p className="bf-done-script">See you in class!</p>
        <p className="bf-done-lead">
          A confirmation is on its way to <strong>{confirmed.email}</strong>.
          Libby will send a reminder the evening before.
        </p>

        <div className="bf-summary">
          <dl>
            <dt>Class</dt>
            <dd>{confirmed.className}</dd>
            <dt>When</dt>
            <dd>{confirmed.when}</dd>
            <dt>Where</dt>
            <dd>Beit Shemesh, Gimmel 2</dd>
            <dt>Name</dt>
            <dd>{confirmed.name}</dd>
          </dl>
          <div className="bf-next">
            <strong>Need to change or cancel?</strong>
            <br />
            Reply to your confirmation email or message Libby directly — she
            would always rather know, so someone else can take the place.
          </div>
        </div>

        <button type="button" className="bf-link" onClick={reset}>
          Book another class
        </button>
      </div>
    );
  }

  /* ------------------------------- form -------------------------------- */
  return (
    <div className="bf">
      {/* Step 1 — day */}
      <section className="bf-step">
        <div className="bf-lab">
          <span className="bf-n">1</span>
          <h2>Which day?</h2>
        </div>
        <div className="bf-grid">
          {schedule.map((d, i) => {
            const total = d.classes.reduce((a, c) => a + c.spotsLeft, 0);
            const full = total === 0;
            const selected = dayIdx === i;
            return (
              <button
                key={d.day}
                type="button"
                className={`bf-pick${selected ? " sel" : ""}${full ? " full" : ""}`}
                disabled={full}
                onClick={() => pickDay(i)}
              >
                <span className="bf-pick-d">{d.day}</span>
                <span className="bf-pick-s">{d.tag}</span>
                <span className="bf-pick-t">{d.nextDate}</span>
                <span className="bf-pick-cap">
                  {full
                    ? "Fully booked"
                    : `${d.classes.length} ${d.classes.length > 1 ? "classes" : "class"}`}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Step 2 — class */}
      <section className={`bf-step${selectedDay ? "" : " off"}`}>
        <div className="bf-lab">
          <span className="bf-n">2</span>
          <h2>Which class?</h2>
          {selectedDay && (
            <button type="button" className="bf-edit" onClick={changeDay}>
              Change day
            </button>
          )}
        </div>
        {selectedDay ? (
          <div className="bf-grid">
            {selectedDay.classes.map((c, i) => {
              const full = c.spotsLeft === 0;
              const low = c.spotsLeft > 0 && c.spotsLeft <= LOW_SPOTS;
              const selected = classIdx === i;
              return (
                <button
                  key={c.id}
                  type="button"
                  className={`bf-pick${selected ? " sel" : ""}${full ? " full" : ""}`}
                  disabled={full}
                  onClick={() => setClassIdx(i)}
                >
                  <span className="bf-pick-d">{c.name}</span>
                  <span className="bf-pick-t">{c.time}</span>
                  <span className={`bf-pick-cap${low ? " low" : ""}`}>
                    {full ? "Class full" : `${c.spotsLeft} places left`}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <p className="bf-empty">Choose a day above first.</p>
        )}
      </section>

      {/* Step 3 — details */}
      <section className={`bf-step${selectedClass ? "" : " off"}`}>
        <div className="bf-lab">
          <span className="bf-n">3</span>
          <h2>Your details</h2>
        </div>
        <div className="bf-fields">
          <div>
            <label htmlFor="bf-name">Your name</label>
            <input
              id="bf-name"
              type="text"
              autoComplete="name"
              placeholder="Rivky Cohen"
              value={details.name}
              onChange={(e) => setDetails({ ...details, name: e.target.value })}
            />
          </div>
          <div>
            <label htmlFor="bf-email">
              Email <span className="bf-opt">— for your confirmation and a reminder</span>
            </label>
            <input
              id="bf-email"
              type="email"
              autoComplete="email"
              placeholder="rivky@example.com"
              value={details.email}
              onChange={(e) => setDetails({ ...details, email: e.target.value })}
            />
          </div>
          <div>
            <label htmlFor="bf-phone">
              Phone <span className="bf-opt">— optional</span>
            </label>
            <input
              id="bf-phone"
              type="tel"
              autoComplete="tel"
              placeholder="050 000 0000"
              value={details.phone}
              onChange={(e) => setDetails({ ...details, phone: e.target.value })}
            />
          </div>
          <label className="bf-check" htmlFor="bf-first">
            <input
              id="bf-first"
              type="checkbox"
              checked={details.firstTime}
              onChange={(e) =>
                setDetails({ ...details, firstTime: e.target.checked })
              }
            />
            <span>This is my first class at the studio</span>
          </label>
          {details.firstTime && (
            <div className="bf-note">
              <strong>Lovely — Libby will look out for you.</strong>{" "}
              Come in whatever you&rsquo;re comfortable moving in, bring water and a
              towel, and arrive five minutes early so she can say hello properly.
              No experience needed, and nobody is watching anyone else.
            </div>
          )}
        </div>
      </section>

      <button
        type="button"
        className="bf-go"
        disabled={!detailsValid || submitting}
        onClick={submit}
      >
        {submitting ? "Booking…" : "Book my place"}
      </button>
      {error && <p className="bf-hint bf-error">{error}</p>}
      {hint && !error && <p className="bf-hint">{hint}</p>}
    </div>
  );
}
