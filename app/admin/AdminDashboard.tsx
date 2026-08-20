"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type {
  RosterClass,
  Member,
  StudioClass,
  MonthDay,
} from "@/app/lib/airtable";

type View = "home" | "week" | "members" | "classes";
type Act = (u: string, m: string, b: Record<string, unknown>) => Promise<boolean>;

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export default function AdminDashboard({
  roster,
  members,
  classes,
}: {
  roster: RosterClass[];
  members: Member[];
  classes: StudioClass[];
}) {
  const router = useRouter();
  const [view, setView] = useState<View>("home");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [, startTransition] = useTransition();

  const act: Act = async (url, method, body) => {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const d = (await res.json().catch(() => null)) as { error?: string } | null;
        setMsg(d?.error ?? "Something went wrong.");
        return false;
      }
      startTransition(() => router.refresh());
      return true;
    } catch {
      setMsg("Something went wrong.");
      return false;
    } finally {
      setBusy(false);
    }
  };

  async function logout() {
    await fetch("/api/admin/login", { method: "DELETE" });
    router.refresh();
  }

  if (view === "home") {
    return <Home members={members} classes={classes} onGo={setView} onLogout={logout} />;
  }

  const titles: Record<View, string> = {
    home: "",
    week: "Classes & bookings",
    members: "Members",
    classes: "Manage classes",
  };

  return (
    <div className="ad">
      <div className="ad-top">
        <div className="ad-head-left">
          <button className="ad-back" onClick={() => setView("home")}>
            ← Home
          </button>
          <h1>{titles[view]}</h1>
        </div>
        <button className="ad-logout" onClick={logout}>
          Log out
        </button>
      </div>

      {msg && <p className="ad-msg">{msg}</p>}

      {view === "week" && <WeekView thisWeek={roster} act={act} busy={busy} />}
      {view === "members" && (
        <MembersView members={members} act={act} busy={busy} />
      )}
      {view === "classes" && (
        <ClassesView classes={classes} act={act} busy={busy} />
      )}
    </div>
  );
}

/* ------------------------------- Home -------------------------------- */

function Home({
  members,
  classes,
  onGo,
  onLogout,
}: {
  members: Member[];
  classes: StudioClass[];
  onGo: (v: View) => void;
  onLogout: () => void;
}) {
  const activeMembers = members.filter((m) => m.status === "Active").length;
  return (
    <div className="ad">
      <div className="ad-home-top">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="ad-logo"
          src="/logo-libby-black.webp"
          alt="Fitness with Libby"
        />
        <button className="ad-logout" onClick={onLogout}>
          Log out
        </button>
      </div>
      <div className="ad-welcome">
        <p className="ad-hello">Welcome back</p>
        <h1 className="ad-libby">Libby!</h1>
        <p>What would you like to do today?</p>
      </div>
      <div className="ad-home">
        <button className="ad-home-card" onClick={() => onGo("week")}>
          <span className="ad-home-title">This week&rsquo;s classes</span>
          <span className="ad-home-sub">
            See who&rsquo;s booked, mark attendance, add bookings
          </span>
        </button>
        <button className="ad-home-card" onClick={() => onGo("members")}>
          <span className="ad-home-title">Members</span>
          <span className="ad-home-sub">
            {members.length} member{members.length === 1 ? "" : "s"} ·{" "}
            {activeMembers} active
          </span>
        </button>
        <button className="ad-home-card" onClick={() => onGo("classes")}>
          <span className="ad-home-title">Manage classes</span>
          <span className="ad-home-sub">
            {classes.length} class{classes.length === 1 ? "" : "es"} · add or
            remove
          </span>
        </button>
      </div>
    </div>
  );
}

/* ---------------------------- Week view ------------------------------ */

function WeekView({
  thisWeek,
  act,
  busy,
}: {
  thisWeek: RosterClass[];
  act: Act;
  busy: boolean;
}) {
  const [period, setPeriod] = useState<"this" | "next" | "month">("this");
  const [nextWeek, setNextWeek] = useState<RosterClass[] | null>(null);
  const [month, setMonth] = useState<MonthDay[] | null>(null);
  const [loading, setLoading] = useState(false);

  async function pick(p: "this" | "next" | "month") {
    setPeriod(p);
    if (p === "next" && !nextWeek) await load("next");
    if (p === "month" && !month) await load("month");
  }

  async function load(p: "next" | "month") {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/roster?period=${p}`);
      const data = await res.json();
      if (p === "next") setNextWeek(data.roster ?? []);
      else setMonth(data.month ?? []);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="ad-period">
        <button className={period === "this" ? "on" : ""} onClick={() => pick("this")}>
          This week
        </button>
        <button className={period === "next" ? "on" : ""} onClick={() => pick("next")}>
          Next week
        </button>
        <button className={period === "month" ? "on" : ""} onClick={() => pick("month")}>
          This month
        </button>
      </div>

      {period !== "month" && (
        <AddBooking roster={thisWeek} act={act} busy={busy} />
      )}

      {loading && <p className="ad-empty">Loading…</p>}

      {period === "this" && <RosterGrid classes={thisWeek} act={act} busy={busy} />}
      {period === "next" && nextWeek && (
        <RosterGrid classes={nextWeek} act={act} busy={busy} />
      )}
      {period === "month" && month && <MonthView days={month} />}
    </div>
  );
}

function RosterGrid({
  classes,
  act,
  busy,
}: {
  classes: RosterClass[];
  act: Act;
  busy: boolean;
}) {
  if (classes.length === 0)
    return <p className="ad-empty">No classes set up yet.</p>;
  return (
    <div className="ad-classes">
      {classes.map((c) => (
        <section className="ad-class" key={c.sessionId}>
          <div className="ad-class-head">
            <div>
              <h2>{c.name}</h2>
              <span className="ad-when">
                {c.day} {c.date} · {c.time}
              </span>
            </div>
            <span className={`ad-spots${c.spotsLeft === 0 ? " full" : ""}`}>
              {c.spotsLeft} left
            </span>
          </div>
          {c.bookings.length === 0 ? (
            <p className="ad-none">No one booked yet.</p>
          ) : (
            <ul className="ad-people">
              {c.bookings.map((b) => (
                <li key={b.id} className={b.attendance === "Cancelled" ? "cancelled" : ""}>
                  <div className="ad-person">
                    <span className="ad-name">
                      {b.name}
                      {b.isMember && <span className="ad-badge member">Member</span>}
                      {b.firstTime && <span className="ad-badge first">1st time</span>}
                    </span>
                    {b.phone && <span className="ad-phone">{b.phone}</span>}
                  </div>
                  <div className="ad-actions">
                    {(["Attended", "No-show", "Cancelled"] as const).map((s) => (
                      <button
                        key={s}
                        disabled={busy}
                        className={`ad-mark ${s.toLowerCase().replace("-", "")}${
                          b.attendance === s ? " on" : ""
                        }`}
                        onClick={() =>
                          act("/api/admin/attendance", "POST", {
                            bookingId: b.id,
                            status: b.attendance === s ? "Booked" : s,
                          })
                        }
                      >
                        {s === "Cancelled" ? "Cancel" : s}
                      </button>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}

function MonthView({ days }: { days: MonthDay[] }) {
  if (days.length === 0) return <p className="ad-empty">No classes this month.</p>;
  return (
    <div className="ad-month">
      {days.map((d) => (
        <div className="ad-month-day" key={d.date}>
          <h3>{d.label}</h3>
          <ul>
            {d.classes.map((c) => (
              <li key={c.sessionId}>
                <span className="ad-mc-name">
                  {c.name} <span className="ad-mc-time">{c.time}</span>
                </span>
                <span className="ad-mc-count">
                  {c.booked}/{c.capacity} booked
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function AddBooking({
  roster,
  act,
  busy,
}: {
  roster: RosterClass[];
  act: Act;
  busy: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [weeks, setWeeks] = useState(1);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const ok = await act("/api/admin/book", "POST", {
      sessionId,
      name,
      phone,
      email,
      weeks,
    });
    if (ok) {
      setName("");
      setPhone("");
      setEmail("");
      setWeeks(1);
      setOpen(false);
    }
  }

  if (!open) {
    return (
      <button className="ad-add-toggle" onClick={() => setOpen(true)}>
        + Add a booking
      </button>
    );
  }

  return (
    <form className="ad-form" onSubmit={submit}>
      <h3>Add a booking</h3>
      <label>
        Class
        <select value={sessionId} onChange={(e) => setSessionId(e.target.value)} required>
          <option value="">Choose a class…</option>
          {roster.map((c) => (
            <option key={c.sessionId} value={c.sessionId}>
              {c.day} {c.time} — {c.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Name
        <input value={name} onChange={(e) => setName(e.target.value)} required />
      </label>
      <label>
        Phone <span className="ad-opt">optional</span>
        <input value={phone} onChange={(e) => setPhone(e.target.value)} />
      </label>
      <label>
        Email <span className="ad-opt">optional — links to a member</span>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      <label>
        Book for
        <select value={weeks} onChange={(e) => setWeeks(Number(e.target.value))}>
          <option value={1}>Just this week</option>
          <option value={2}>2 weeks</option>
          <option value={3}>3 weeks</option>
          <option value={4}>4 weeks</option>
        </select>
      </label>
      <div className="ad-form-actions">
        <button type="button" className="ad-cancel" onClick={() => setOpen(false)}>
          Cancel
        </button>
        <button type="submit" disabled={busy || !sessionId || !name}>
          {busy ? "Saving…" : "Book"}
        </button>
      </div>
    </form>
  );
}

/* ---------------------------- Members -------------------------------- */

function MembersView({
  members,
  act,
  busy,
}: {
  members: Member[];
  act: Act;
  busy: boolean;
}) {
  return (
    <div>
      <AddMember act={act} busy={busy} />
      {members.length === 0 && <p className="ad-empty">No members yet.</p>}
      <ul className="ad-mlist">
        {members.map((m) => (
          <li key={m.id}>
            <div className="ad-person">
              <span className="ad-name">{m.name}</span>
              <span className="ad-phone">
                {m.type}
                {m.email ? ` · ${m.email}` : ""}
              </span>
              {!m.email && (
                <span className="ad-warn">
                  No email — can&rsquo;t book multiple weeks online
                </span>
              )}
              <span className="ad-tally">
                This month: <strong>{m.month.attended}</strong> attended ·{" "}
                {m.month.noShow} no-show · {m.month.cancelled} cancelled
              </span>
            </div>
            <div className="ad-actions">
              {(["Active", "Paused", "Inactive"] as const).map((s) => (
                <button
                  key={s}
                  disabled={busy}
                  className={`ad-mark ${s.toLowerCase()}${m.status === s ? " on" : ""}`}
                  onClick={() =>
                    act("/api/admin/members", "PATCH", { id: m.id, status: s })
                  }
                >
                  {s}
                </button>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function AddMember({ act, busy }: { act: Act; busy: boolean }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [type, setType] = useState("Monthly");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const ok = await act("/api/admin/members", "POST", { name, email, phone, type });
    if (ok) {
      setName("");
      setEmail("");
      setPhone("");
      setType("Monthly");
      setOpen(false);
    }
  }

  if (!open) {
    return (
      <button className="ad-add-toggle" onClick={() => setOpen(true)}>
        + Add a member
      </button>
    );
  }

  return (
    <form className="ad-form" onSubmit={submit}>
      <h3>Add a member</h3>
      <label>
        Name
        <input value={name} onChange={(e) => setName(e.target.value)} required />
      </label>
      <label>
        Email <span className="ad-opt">needed to book online</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </label>
      <label>
        Phone <span className="ad-opt">optional</span>
        <input value={phone} onChange={(e) => setPhone(e.target.value)} />
      </label>
      <label>
        Membership
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="Monthly">Monthly</option>
          <option value="Class Pack">Class Pack</option>
          <option value="Other">Other</option>
        </select>
      </label>
      <div className="ad-form-actions">
        <button type="button" className="ad-cancel" onClick={() => setOpen(false)}>
          Cancel
        </button>
        <button type="submit" disabled={busy || !name || !email}>
          {busy ? "Saving…" : "Add member"}
        </button>
      </div>
    </form>
  );
}

/* ----------------------------- Classes ------------------------------- */

function ClassesView({
  classes,
  act,
  busy,
}: {
  classes: StudioClass[];
  act: Act;
  busy: boolean;
}) {
  return (
    <div>
      <AddClass act={act} busy={busy} />
      {classes.length === 0 && <p className="ad-empty">No classes yet.</p>}
      <ul className="ad-mlist">
        {classes.map((c) => (
          <li key={c.id}>
            <div className="ad-person">
              <span className="ad-name">{c.name}</span>
              <span className="ad-phone">
                {c.day} · {c.time} · up to {c.capacity}
              </span>
            </div>
            <div className="ad-actions">
              <button
                disabled={busy}
                className="ad-mark"
                onClick={() => {
                  if (
                    confirm(
                      `Remove "${c.name}" (${c.day} ${c.time})? Past bookings are kept.`,
                    )
                  ) {
                    act("/api/admin/classes", "PATCH", { id: c.id, archived: true });
                  }
                }}
              >
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function AddClass({ act, busy }: { act: Act; busy: boolean }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [day, setDay] = useState("Sunday");
  const [time, setTime] = useState("");
  const [capacity, setCapacity] = useState(8);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const ok = await act("/api/admin/classes", "POST", {
      name,
      day,
      time,
      capacity,
    });
    if (ok) {
      setName("");
      setTime("");
      setCapacity(8);
      setOpen(false);
    }
  }

  if (!open) {
    return (
      <button className="ad-add-toggle" onClick={() => setOpen(true)}>
        + Add a class
      </button>
    );
  }

  return (
    <form className="ad-form" onSubmit={submit}>
      <h3>Add a class</h3>
      <label>
        Class name
        <input value={name} onChange={(e) => setName(e.target.value)} required />
      </label>
      <label>
        Day
        <select value={day} onChange={(e) => setDay(e.target.value)}>
          {DAYS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </label>
      <label>
        Time <span className="ad-opt">e.g. 9:00 am</span>
        <input
          value={time}
          onChange={(e) => setTime(e.target.value)}
          placeholder="9:00 am"
          required
        />
      </label>
      <label>
        Capacity
        <input
          type="number"
          min={1}
          value={capacity}
          onChange={(e) => setCapacity(Number(e.target.value))}
        />
      </label>
      <div className="ad-form-actions">
        <button type="button" className="ad-cancel" onClick={() => setOpen(false)}>
          Cancel
        </button>
        <button type="submit" disabled={busy || !name || !time}>
          {busy ? "Saving…" : "Add class"}
        </button>
      </div>
    </form>
  );
}
