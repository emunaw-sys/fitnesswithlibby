"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ClassRun, DaySchedule } from "@/app/lib/airtable";
import {
  PRICE,
  monthKey,
  monthName,
  nextMonthKey,
  nextMonthOpen,
  singleClassRate,
  type Price,
} from "@/app/lib/pricing";

/* ------------------------------------------------------------------ *
 * BOOKING FLOW
 * ------------------------------------------------------------------
 * The live schedule comes in as a prop from the server (app/book/page),
 * which reads it from Airtable. `spotsLeft` is Airtable's computed
 * "Spots Left" (capacity − bookings). On submit we POST to /api/book,
 * which writes the booking row back into Airtable.
 *
 * Anyone can book a single class or the whole month. Libby works month
 * by month, so a month booking covers the classes left in that calendar
 * month — never a rolling run of weeks that spills into the next one.
 * ------------------------------------------------------------------ */

const LOW_SPOTS = 3; // at or below this we nudge "only N places left"

/* "single" for one class, or a month key ("2026-11") for the month. */
type PlanKey = string;

type PlanOption = {
  key: PlanKey;
  label: string;
  /** Every date the plan covers, full ones included so we can say so. */
  dates: ClassRun[];
};

/**
 * What this class can be booked as. This month is offered while it has at
 * least two classes left (one class is just a single class). Next month opens
 * in the last week of this one, or straight away when this class has nothing
 * left this month — a season that starts next month, say.
 */
function planOptions(runs: ClassRun[]): PlanOption[] {
  if (runs.length === 0) return [];
  const opts: PlanOption[] = [
    { key: "single", label: "Just this class", dates: runs.slice(0, 1) },
  ];
  const thisMonth = monthKey(new Date());
  const nextMonth = nextMonthKey(thisMonth);
  const open = (dates: ClassRun[]) => dates.filter((r) => r.spots > 0).length;

  const nowDates = runs.filter((r) => r.iso.startsWith(thisMonth));
  if (open(nowDates) >= 2) {
    opts.push({ key: thisMonth, label: `Rest of ${monthName(thisMonth)}`, dates: nowDates });
  }
  const nextDates = runs.filter((r) => r.iso.startsWith(nextMonth));
  if (open(nextDates) > 0 && (nextMonthOpen() || open(nowDates) === 0)) {
    opts.push({ key: nextMonth, label: `All of ${monthName(nextMonth)}`, dates: nextDates });
  }
  return opts;
}

/* ₪160 */
const shekels = (n: number) => `₪${n}`;

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
  // The email we've confirmed belongs to an active member. Membership is then
  // derived rather than mirrored, so a changed address can't leave a stale
  // "you're a member" behind.
  const [memberEmail, setMemberEmail] = useState<string | null>(null);
  const [plan, setPlan] = useState<PlanKey>("single");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Spam filter: the hidden honeypot, and when the form loaded (see app/lib/spam.ts).
  const honeypot = useRef<HTMLInputElement>(null);
  const loadedAt = useRef(0);
  useEffect(() => {
    loadedAt.current = Date.now();
  }, []);
  const [confirmed, setConfirmed] = useState<{
    className: string;
    when: string;
    dates: string[];
    added: number;
    alreadyHeld: number;
    name: string;
    email: string;
    price: Price | null;
  } | null>(null);

  /* Members pay the member rate for a single class rather than the drop-in
   * price. We ask the server once the email looks complete, debounced so
   * typing doesn't spend the free plan's API budget. */
  const email = details.email.trim();
  const isMember = memberEmail !== null && memberEmail === email;

  useEffect(() => {
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return;
    let live = true;
    const t = setTimeout(async () => {
      try {
        const res = await fetch("/api/membership", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        const data = await res.json();
        if (live) setMemberEmail(data?.member ? email : null);
      } catch {
        if (live) setMemberEmail(null); // never block a booking over this
      }
    }, 500);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [email]);

  const selectedDay = dayIdx === null ? null : schedule[dayIdx];
  const selectedClass =
    selectedDay && classIdx !== null ? selectedDay.classes[classIdx] : null;

  const options = useMemo(
    () => planOptions(selectedClass?.runs ?? []),
    [selectedClass],
  );
  // A plan that's no longer on offer (a different class was picked) falls
  // back to a single class rather than booking something unseen.
  const chosen = options.find((o) => o.key === plan) ?? options[0] ?? null;
  const isMonth = chosen !== null && chosen.key !== "single";

  /* The summary before booking. Full weeks aren't booked or charged. The
   * twice-a-week rate depends on their other bookings, which only the server
   * sees, so the confirmation has the final figure. */
  const quote = useMemo(() => {
    if (!chosen) return null;
    const open = chosen.dates.filter((r) => r.spots > 0);
    const perClass = isMonth ? PRICE.monthly : singleClassRate(isMember);
    return { open, full: chosen.dates.length - open.length, perClass, total: perClass * open.length };
  }, [chosen, isMonth, isMember]);

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
    setPlan("single");
  }

  function pickClass(i: number) {
    setClassIdx(i);
    setPlan("single");
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
          month: isMonth ? chosen.key : undefined,
          website: honeypot.current?.value ?? "",
          elapsedMs: Date.now() - loadedAt.current,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Something went wrong. Please try again.");
      }
      const data = await res.json().catch(() => null);
      setConfirmed({
        className: selectedClass.name,
        when: `${selectedDay.day} ${selectedDay.nextDate}, ${selectedClass.time}`,
        // The server is the authority on what got booked — a week can fill up
        // between the page loading and the request landing.
        dates: Array.isArray(data?.dates) ? (data.dates as string[]) : [],
        added: Number(data?.added ?? 0),
        alreadyHeld: Number(data?.alreadyHeld ?? 0),
        name: details.name.trim(),
        email: details.email.trim(),
        price: data?.price ?? null,
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
    setPlan("single");
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
          {confirmed.added === 0 ? (
            <>
              You were already booked in — we haven&rsquo;t taken a second
              place, and your original confirmation still stands.
            </>
          ) : (
            <>
              {confirmed.dates.length > 1
                ? `You're booked into ${confirmed.dates.length} classes. `
                : ""}
              A confirmation is on its way to{" "}
              <strong>{confirmed.email}</strong>.
              {confirmed.alreadyHeld > 0 && (
                <>
                  {" "}
                  {confirmed.alreadyHeld === 1
                    ? "One of these you had already booked, so we didn't take a second place for it."
                    : `${confirmed.alreadyHeld} of these you had already booked, so we didn't take second places for them.`}
                </>
              )}
            </>
          )}
        </p>

        <div className="bf-summary">
          <dl>
            <dt>Class</dt>
            <dd>{confirmed.className}</dd>
            <dt>When</dt>
            <dd>
              {confirmed.dates.length > 1 ? (
                <>
                  {confirmed.dates.map((d) => (
                    <span key={d} className="bf-date-row">
                      {d}
                    </span>
                  ))}
                </>
              ) : (
                confirmed.when
              )}
            </dd>
            <dt>Where</dt>
            <dd>Beit Shemesh, Gimmel 2</dd>
            <dt>Name</dt>
            <dd>{confirmed.name}</dd>
          </dl>
          {confirmed.price && confirmed.price.classes > 0 && (
            <div className="bf-total">
              <span className="bf-total-lab">To pay</span>
              <span className="bf-total-sum">{shekels(confirmed.price.total)}</span>
              <span className="bf-total-calc">
                {confirmed.price.classes}{" "}
                {confirmed.price.classes === 1 ? "class" : "classes"} ×{" "}
                {shekels(confirmed.price.perClass)}
                {confirmed.price.twiceAWeek && " — your twice-a-week rate"}
              </span>
            </div>
          )}

          <div className="bf-next">
            <strong>How to pay</strong>
            <br />
            Payment can be done in one of three ways:
            <ol className="bf-pay">
              <li>Pay on site, in cash, to Libby.</li>
              <li>
                Pay via Bit to <strong>055 684 0335</strong>.
              </li>
              <li>
                Bank transfer to <strong>Solomons</strong> — Mizrahi 20, snif
                594, account 180913.
              </li>
            </ol>
          </div>

          <div className="bf-next">
            <strong>Need to change or cancel?</strong>
            <br />
            Cancellations can be done up to 24 hours before the booking. Any
            class not cancelled within 24 hours will be charged in full.
            <br />
            Email or contact Libby directly to cancel — she needs to know.
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
                  onClick={() => pickClass(i)}
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

      {/* Step 3 — one class or the month */}
      <section className={`bf-step${selectedClass ? "" : " off"}`}>
        <div className="bf-lab">
          <span className="bf-n">3</span>
          <h2>Just this class, or the month?</h2>
        </div>
        {selectedClass && chosen ? (
          <div className="bf-plan">
            <div className="bf-grid">
              {options.map((o) => {
                const open = o.dates.filter((r) => r.spots > 0).length;
                return (
                  <button
                    key={o.key}
                    type="button"
                    className={`bf-pick${chosen.key === o.key ? " sel" : ""}`}
                    onClick={() => setPlan(o.key)}
                  >
                    <span className="bf-pick-d">{o.label}</span>
                    <span className="bf-pick-t">
                      {o.key === "single"
                        ? o.dates[0].label
                        : `${open} ${open === 1 ? "class" : "classes"}`}
                    </span>
                    <span className="bf-pick-cap">
                      {o.key === "single"
                        ? `${shekels(singleClassRate(isMember))} ${isMember ? "member rate" : "drop-in"}`
                        : `${shekels(PRICE.monthly)} a class`}
                    </span>
                  </button>
                );
              })}
            </div>
            {options.length === 1 && (
              <p className="bf-series-note">
                Month bookings for this class open in the last week of the month.
              </p>
            )}
          </div>
        ) : (
          <p className="bf-empty">Choose a class above first.</p>
        )}
      </section>

      {/* Step 4 — details */}
      <section className={`bf-step${selectedClass ? "" : " off"}`}>
        <div className="bf-lab">
          <span className="bf-n">4</span>
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
          {/* Honeypot: hidden from people, but bots fill it in. */}
          <div className="c-hp" aria-hidden="true">
            <label htmlFor="bf-website">Website</label>
            <input
              id="bf-website"
              ref={honeypot}
              type="text"
              tabIndex={-1}
              autoComplete="off"
            />
          </div>
          {details.firstTime && (
            <div className="bf-note">
              <strong>Lovely — Libby will look out for you.</strong> Come in
              whatever you&rsquo;re comfortable moving in, bring water,
              and arrive five minutes early so she can say hello properly. No
              experience needed, and nobody is watching anyone else.
            </div>
          )}
        </div>
      </section>

      {selectedClass && chosen && quote && (
        <div className="bf-quote" aria-live="polite">
          <div className="bf-quote-head">
            <span>
              {isMonth ? chosen.label : "Your class"} · {selectedClass.name},{" "}
              {selectedClass.time}
            </span>
            <strong>{shekels(quote.total)}</strong>
          </div>
          <p className="bf-quote-calc">
            {quote.open.length} {quote.open.length === 1 ? "class" : "classes"} ×{" "}
            {shekels(quote.perClass)}
          </p>
          <ul className="bf-quote-dates">
            {chosen.dates.map((r) => (
              <li key={r.iso} className={r.spots > 0 ? "" : "full"}>
                {r.label}
                {r.spots > 0 ? "" : " — full"}
              </li>
            ))}
          </ul>
          {quote.full > 0 && (
            <p className="bf-series-note">
              Full weeks aren&rsquo;t booked or charged.
            </p>
          )}
          {isMonth && (
            <p className="bf-series-note">
              Coming twice a week? Booking a second class for {monthName(chosen.key)}{" "}
              drops it to {shekels(PRICE.twiceWeekly)} a class — worked out when you
              book.
            </p>
          )}
        </div>
      )}

      <button
        type="button"
        className="bf-go"
        disabled={!detailsValid || submitting}
        onClick={submit}
      >
        {submitting
          ? "Booking…"
          : isMonth && quote
            ? `Book ${quote.open.length} classes · ${shekels(quote.total)}`
            : "Book my place"}
      </button>
      {error && <p className="bf-hint bf-error">{error}</p>}
      {hint && !error && <p className="bf-hint">{hint}</p>}
    </div>
  );
}
