"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { RosterClass, Member } from "@/app/lib/airtable";

type Tab = "week" | "members";

export default function AdminDashboard({
  roster,
  members,
}: {
  roster: RosterClass[];
  members: Member[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("week");
  const [msg, setMsg] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);

  async function act(
    url: string,
    method: string,
    body: Record<string, unknown>,
  ): Promise<boolean> {
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
  }

  async function logout() {
    await fetch("/api/admin/login", { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="ad">
      <div className="ad-top">
        <div>
          <span className="ad-kicker">Fitness with Libby</span>
          <h1>Studio Admin</h1>
        </div>
        <button className="ad-logout" onClick={logout}>
          Log out
        </button>
      </div>

      <div className="ad-tabs" role="tablist">
        <button
          className={tab === "week" ? "on" : ""}
          onClick={() => setTab("week")}
        >
          This Week
        </button>
        <button
          className={tab === "members" ? "on" : ""}
          onClick={() => setTab("members")}
        >
          Members
        </button>
      </div>

      {msg && <p className="ad-msg">{msg}</p>}

      {tab === "week" ? (
        <WeekTab roster={roster} act={act} busy={busy} />
      ) : (
        <MembersTab members={members} act={act} busy={busy} />
      )}
    </div>
  );
}

/* ----------------------------- This Week ----------------------------- */

function WeekTab({
  roster,
  act,
  busy,
}: {
  roster: RosterClass[];
  act: (u: string, m: string, b: Record<string, unknown>) => Promise<boolean>;
  busy: boolean;
}) {
  return (
    <div className="ad-week">
      <AddBooking roster={roster} act={act} busy={busy} />
      {roster.length === 0 && <p className="ad-empty">No classes set up yet.</p>}
      <div className="ad-classes">
      {roster.map((c) => (
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
                <li
                  key={b.id}
                  className={b.attendance === "Cancelled" ? "cancelled" : ""}
                >
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
                            // tapping the active status again clears it back to Booked
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
    </div>
  );
}

function AddBooking({
  roster,
  act,
  busy,
}: {
  roster: RosterClass[];
  act: (u: string, m: string, b: Record<string, unknown>) => Promise<boolean>;
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
        <select
          value={sessionId}
          onChange={(e) => setSessionId(e.target.value)}
          required
        >
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
        Email <span className="ad-opt">optional — links them to a member</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </label>
      <label>
        Book for
        <select
          value={weeks}
          onChange={(e) => setWeeks(Number(e.target.value))}
        >
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

/* ------------------------------ Members ------------------------------ */

function MembersTab({
  members,
  act,
  busy,
}: {
  members: Member[];
  act: (u: string, m: string, b: Record<string, unknown>) => Promise<boolean>;
  busy: boolean;
}) {
  return (
    <div className="ad-members">
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
            </div>
            <div className="ad-actions">
              {(["Active", "Paused", "Inactive"] as const).map((s) => (
                <button
                  key={s}
                  disabled={busy}
                  className={`ad-mark ${s.toLowerCase()}${
                    m.status === s ? " on" : ""
                  }`}
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

function AddMember({
  act,
  busy,
}: {
  act: (u: string, m: string, b: Record<string, unknown>) => Promise<boolean>;
  busy: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [type, setType] = useState("Monthly");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const ok = await act("/api/admin/members", "POST", {
      name,
      email,
      phone,
      type,
    });
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
        Email <span className="ad-opt">optional</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
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
        <button type="submit" disabled={busy || !name}>
          {busy ? "Saving…" : "Add member"}
        </button>
      </div>
    </form>
  );
}
