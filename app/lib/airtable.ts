/* ------------------------------------------------------------------ *
 * AIRTABLE DATA LAYER  (server-only)
 * ------------------------------------------------------------------
 * Talks to the "Fitness with Libby" base. Import only from server code
 * (server components / route handlers) so the token never reaches the
 * browser.
 *
 *   getSchedule()   -> live schedule grouped by day. Dates are computed
 *                      here (next Sunday, next Monday, …) so Libby never
 *                      updates them. "Spots Left" is Capacity minus the
 *                      bookings made *for the upcoming occurrence*, so
 *                      availability resets automatically each week
 *                      without deleting any history.
 *   createBooking() -> writes a Booking row, stamps which class date it
 *                      was for, and marks it "Booked".
 * ------------------------------------------------------------------ */

/* ====================================================================== *
 *  🔑 SWITCHING AIRTABLE ACCOUNTS (e.g. handing off to Libby)
 * ----------------------------------------------------------------------
 *  The two values below come from environment variables — NOT hardcoded —
 *  so moving to a new Airtable account is just a config change, no code
 *  edits. To switch:
 *    1. In the new/owner account, create a Personal Access Token at
 *       https://airtable.com/create/tokens with scopes:
 *         data.records:read, data.records:write, schema.bases:read
 *       and access to the "Fitness with Libby" base.
 *    2. Get the base id (starts with "app…"). It stays the same if the
 *       base is *transferred*; it changes if the base is *duplicated*.
 *    3. Update AIRTABLE_TOKEN and AIRTABLE_BASE_ID in BOTH places:
 *         • .env.local            (for local development)
 *         • your hosting provider's Environment Variables  (for the live
 *           site) — then trigger a redeploy.
 *  See .env.example for the same checklist.
 * ====================================================================== */
const TOKEN = process.env.AIRTABLE_TOKEN;
const BASE = process.env.AIRTABLE_BASE_ID;
const API = `https://api.airtable.com/v0/${BASE}`;

export type ClassSession = {
  id: string; // Airtable record id, used to link the booking
  name: string;
  time: string;
  spotsLeft: number;
};

export type DaySchedule = {
  day: string;
  tag: string; // little script accent under the day name
  nextDate: string; // e.g. "10 Aug"
  classes: ClassSession[];
};

/* Day ordering, the script accent per day, and JS weekday numbers. */
const DAY_ORDER = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const DAY_TAG: Record<string, string> = {
  Sunday: "Start strong",
  Monday: "New week",
  Tuesday: "Dance it out",
  Wednesday: "Midweek boost",
  Thursday: "Keep it going",
  Friday: "Finish the week",
  Saturday: "Weekend energy",
};
const DAY_INDEX: Record<string, number> = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
};

/* The next date (today or later) that lands on the given weekday. */
function nextOccurrence(day: string): Date {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = DAY_INDEX[day];
  if (target === undefined) return d;
  const diff = (target - d.getDay() + 7) % 7; // 0..6 days ahead
  d.setDate(d.getDate() + diff);
  return d;
}

/* Date -> "2026-08-10" (used to match + stamp bookings). */
function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/* Date -> "10 Aug" (used for display). */
function formatDate(d: Date): string {
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

/* "9:00 am" / "8:30 pm" -> minutes since midnight, for sorting. */
function timeToMinutes(t: string): number {
  const m = t.trim().match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/i);
  if (!m) return 0;
  let h = parseInt(m[1], 10) % 12;
  if (m[3].toLowerCase() === "pm") h += 12;
  return h * 60 + parseInt(m[2], 10);
}

type AirtableRecord = {
  id: string;
  fields: Record<string, unknown>;
};

const authHeaders = { Authorization: `Bearer ${TOKEN}` };

/* Admin reads are cached for a short window and tagged so any write can
 * bust them instantly (see revalidateTag in the admin API routes). This
 * keeps Libby's admin page from re-reading Airtable on every single load,
 * which protects the free plan's monthly API-call budget. */
export const ADMIN_TAG = "admin-data";
const ADMIN_TTL = 60; // seconds

/* Read every record from a table (following pagination).
 * `revalidate` caches the result for N seconds so we don't hit Airtable's
 * API on every single page view — important for staying inside the free
 * plan's monthly API-call limit. A booking busts this cache immediately
 * (see revalidatePath in app/api/book/route.ts), so spots still update
 * right after someone books. */
async function fetchAll(
  table: string,
  params: Record<string, string> = {},
  revalidate = 60,
  tags?: string[],
): Promise<AirtableRecord[]> {
  const out: AirtableRecord[] = [];
  let offset: string | undefined;
  do {
    const sp = new URLSearchParams(params);
    if (offset) sp.set("offset", offset);
    const res = await fetch(`${API}/${encodeURIComponent(table)}?${sp}`, {
      headers: authHeaders,
      next: tags ? { revalidate, tags } : { revalidate },
    });
    if (!res.ok) {
      throw new Error(
        `Airtable read of "${table}" failed (${res.status}): ${await res.text()}`,
      );
    }
    const data = (await res.json()) as {
      records: AirtableRecord[];
      offset?: string;
    };
    out.push(...data.records);
    offset = data.offset;
  } while (offset);
  return out;
}

/** Find a Member record id whose email matches (case-insensitive), if any. */
async function findMemberIdByEmail(email: string): Promise<string | undefined> {
  if (!email) return undefined;
  try {
    const safe = email.toLowerCase().replace(/['\\]/g, "");
    const res = await fetch(
      `${API}/Members?maxRecords=1&filterByFormula=${encodeURIComponent(
        `LOWER({Email}) = '${safe}'`,
      )}`,
      { headers: authHeaders, cache: "no-store" },
    );
    if (!res.ok) return undefined;
    const data = (await res.json()) as { records?: { id: string }[] };
    return data.records?.[0]?.id;
  } catch {
    return undefined; // non-fatal
  }
}

/**
 * The live schedule. Dates auto-advance week to week, and each class's
 * "Spots Left" reflects only the bookings for its upcoming occurrence.
 */
export async function getSchedule(): Promise<DaySchedule[]> {
  // Only fetch bookings for today or later — past bookings (attendance
  // history) never affect availability and keep this query small forever.
  const [sessions, bookings] = await Promise.all([
    // Classes rarely change, so cache them for 10 minutes.
    fetchAll("Sessions", {}, 600),
    // Bookings drive "spots left" — refresh every 60s (and instantly on a
    // new booking, via revalidatePath).
    fetchAll(
      "Booking",
      { filterByFormula: "IS_AFTER({Class Date}, DATEADD(TODAY(), -1, 'days'))" },
      60,
    ),
  ]);

  // Count current bookings per (session, class date). Cancelled bookings
  // don't hold a spot, so they're skipped and the place frees up.
  const counts = new Map<string, number>();
  for (const b of bookings) {
    if (b.fields["Attendance"] === "Cancelled") continue;
    const classDate = b.fields["Class Date"];
    const sessionLinks = b.fields["Sessions"];
    if (typeof classDate !== "string" || !Array.isArray(sessionLinks)) continue;
    for (const sid of sessionLinks) {
      const key = `${sid}|${classDate}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }

  // Group sessions into day cards with computed dates + spots.
  const byDay = new Map<string, DaySchedule>();
  for (const rec of sessions) {
    const day = rec.fields.Day as string | undefined;
    const name = rec.fields.Name as string | undefined;
    if (!day || !name || rec.fields.Archived) continue;

    const occ = nextOccurrence(day);
    const capacity = (rec.fields.Capacity as number | undefined) ?? 0;
    const booked = counts.get(`${rec.id}|${toISO(occ)}`) ?? 0;

    if (!byDay.has(day)) {
      byDay.set(day, {
        day,
        tag: DAY_TAG[day] ?? "",
        nextDate: formatDate(occ),
        classes: [],
      });
    }
    byDay.get(day)!.classes.push({
      id: rec.id,
      name,
      time: (rec.fields.Time as string | undefined) ?? "",
      spotsLeft: Math.max(0, capacity - booked),
    });
  }

  const schedule = Array.from(byDay.values()).sort(
    (a, b) => DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day),
  );
  for (const d of schedule) {
    d.classes.sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));
  }
  return schedule;
}

export type NewBooking = {
  sessionId: string;
  name: string;
  email: string;
  phone?: string;
  firstTime?: boolean;
};

/**
 * Create a booking, linked to its session, stamped with the class date
 * it was made for, and marked "Booked" (Libby updates this to Attended /
 * No-show after class).
 */
export async function createBooking(booking: NewBooking): Promise<void> {
  // Look up the session's day so we stamp the correct upcoming date.
  const sres = await fetch(`${API}/Sessions/${booking.sessionId}`, {
    headers: authHeaders,
    next: { revalidate: 600 },
  });
  if (!sres.ok) {
    throw new Error(
      `Airtable session lookup failed (${sres.status}): ${await sres.text()}`,
    );
  }
  const srec = (await sres.json()) as AirtableRecord;
  const day = srec.fields?.Day as string | undefined;
  const classDate = day ? toISO(nextOccurrence(day)) : undefined;
  const className = srec.fields?.Name as string | undefined;
  const classTime = srec.fields?.Time as string | undefined;

  // If this email matches a member on file, link the booking to them so
  // Libby can tell members apart from drop-ins.
  const memberId = await findMemberIdByEmail(booking.email);
  const memberIds = memberId ? [memberId] : undefined;

  const res = await fetch(`${API}/Booking`, {
    method: "POST",
    headers: { ...authHeaders, "Content-Type": "application/json" },
    body: JSON.stringify({
      fields: {
        Name: booking.name,
        Email: booking.email,
        Phone: booking.phone || undefined,
        "First time?": Boolean(booking.firstTime),
        Sessions: [booking.sessionId],
        "Class Date": classDate,
        "Class Name": className,
        "Class Time": classTime,
        Attendance: "Booked",
        Source: "Website",
        Member: memberIds,
      },
    }),
  });

  if (!res.ok) {
    throw new Error(
      `Airtable createBooking failed (${res.status}): ${await res.text()}`,
    );
  }
}

/* ================================================================== *
 *  ADMIN  — data for Libby's studio admin page (app/admin)
 * ================================================================== */

export type RosterBooking = {
  id: string;
  name: string;
  phone: string;
  firstTime: boolean;
  isMember: boolean;
  attendance: string; // Booked | Attended | No-show | Cancelled
};

export type RosterClass = {
  sessionId: string;
  day: string;
  name: string;
  time: string;
  date: string; // e.g. "17 Aug"
  capacity: number;
  spotsLeft: number;
  bookings: RosterBooking[];
};

/** This week's classes, each with the people booked in — for the roster. */
export async function getRoster(weekOffset = 0): Promise<RosterClass[]> {
  const [sessions, bookings] = await Promise.all([
    fetchAll("Sessions", {}, ADMIN_TTL, [ADMIN_TAG]),
    fetchAll(
      "Booking",
      { filterByFormula: "IS_AFTER({Class Date}, DATEADD(TODAY(), -1, 'days'))" },
      ADMIN_TTL,
      [ADMIN_TAG],
    ),
  ]);

  // Index bookings by session + class date.
  const byKey = new Map<string, RosterBooking[]>();
  for (const b of bookings) {
    const classDate = b.fields["Class Date"];
    const links = b.fields["Sessions"];
    if (typeof classDate !== "string" || !Array.isArray(links)) continue;
    const rb: RosterBooking = {
      id: b.id,
      name: (b.fields["Name"] as string) ?? "",
      phone: (b.fields["Phone"] as string) ?? "",
      firstTime: Boolean(b.fields["First time?"]),
      isMember:
        Array.isArray(b.fields["Member"]) &&
        (b.fields["Member"] as unknown[]).length > 0,
      attendance: (b.fields["Attendance"] as string) ?? "Booked",
    };
    for (const sid of links as string[]) {
      const key = `${sid}|${classDate}`;
      const arr = byKey.get(key);
      if (arr) arr.push(rb);
      else byKey.set(key, [rb]);
    }
  }

  const result: RosterClass[] = [];
  for (const rec of sessions) {
    const day = rec.fields.Day as string | undefined;
    const name = rec.fields.Name as string | undefined;
    if (!day || !name || rec.fields.Archived) continue;
    const occ = nextOccurrence(day);
    occ.setDate(occ.getDate() + 7 * weekOffset);
    const list = byKey.get(`${rec.id}|${toISO(occ)}`) ?? [];
    const active = list.filter((b) => b.attendance !== "Cancelled").length;
    const capacity = (rec.fields.Capacity as number | undefined) ?? 0;
    result.push({
      sessionId: rec.id,
      day,
      name,
      time: (rec.fields.Time as string | undefined) ?? "",
      date: formatDate(occ),
      capacity,
      spotsLeft: Math.max(0, capacity - active),
      bookings: list.sort((a, b) => a.name.localeCompare(b.name)),
    });
  }
  result.sort(
    (a, b) =>
      DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day) ||
      timeToMinutes(a.time) - timeToMinutes(b.time),
  );
  return result;
}

const ATTENDANCE_VALUES = ["Booked", "Attended", "No-show", "Cancelled"];

/** Update one booking's attendance/cancellation status. */
export async function setAttendance(
  bookingId: string,
  status: string,
): Promise<void> {
  if (!ATTENDANCE_VALUES.includes(status)) throw new Error("Invalid status");
  const res = await fetch(`${API}/Booking/${bookingId}`, {
    method: "PATCH",
    headers: { ...authHeaders, "Content-Type": "application/json" },
    body: JSON.stringify({ fields: { Attendance: status } }),
  });
  if (!res.ok) {
    throw new Error(`setAttendance failed (${res.status}): ${await res.text()}`);
  }
}

export type ManualBooking = {
  sessionId: string;
  name: string;
  email?: string;
  phone?: string;
  weeks?: number; // consecutive weeks to book (1–8)
};

/** Create one (or several consecutive weeks of) manual booking(s). */
export async function createManualBooking(b: ManualBooking): Promise<number> {
  const sres = await fetch(`${API}/Sessions/${b.sessionId}`, {
    headers: authHeaders,
    cache: "no-store",
  });
  if (!sres.ok) throw new Error(`session lookup failed (${sres.status})`);
  const srec = (await sres.json()) as AirtableRecord;
  const day = srec.fields?.Day as string | undefined;
  if (!day) throw new Error("That class has no day set.");
  const className = srec.fields?.Name as string | undefined;
  const classTime = srec.fields?.Time as string | undefined;

  const weeks = Math.min(Math.max(Math.round(b.weeks ?? 1), 1), 8);
  const first = nextOccurrence(day);
  const memberId = b.email ? await findMemberIdByEmail(b.email) : undefined;

  const records = Array.from({ length: weeks }, (_, k) => {
    const d = new Date(first);
    d.setDate(d.getDate() + 7 * k);
    return {
      fields: {
        Name: b.name,
        Email: b.email || undefined,
        Phone: b.phone || undefined,
        Sessions: [b.sessionId],
        "Class Date": toISO(d),
        "Class Name": className,
        "Class Time": classTime,
        Attendance: "Booked",
        Source: "Manual",
        Member: memberId ? [memberId] : undefined,
      },
    };
  });

  const res = await fetch(`${API}/Booking`, {
    method: "POST",
    headers: { ...authHeaders, "Content-Type": "application/json" },
    body: JSON.stringify({ records }),
  });
  if (!res.ok) {
    throw new Error(
      `createManualBooking failed (${res.status}): ${await res.text()}`,
    );
  }
  return weeks;
}

export type MonthTally = {
  attended: number;
  noShow: number;
  cancelled: number;
  booked: number;
};

export type Member = {
  id: string;
  name: string;
  status: string;
  email: string;
  phone: string;
  type: string;
  renewal: string | null;
  month: MonthTally; // this calendar month's attendance
};

const MEMBER_STATUSES = ["Active", "Inactive", "Paused"];

export async function getMembers(): Promise<Member[]> {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1–12

  const [recs, bookings] = await Promise.all([
    fetchAll("Members", {}, 0),
    fetchAll(
      "Booking",
      {
        filterByFormula: `AND(YEAR({Class Date}) = ${year}, MONTH({Class Date}) = ${month})`,
      },
      ADMIN_TTL,
      [ADMIN_TAG],
    ),
  ]);

  // Tally this month's bookings per member, by attendance status.
  const tally = new Map<string, MonthTally>();
  for (const b of bookings) {
    const links = b.fields["Member"];
    if (!Array.isArray(links)) continue;
    const status = (b.fields["Attendance"] as string) ?? "Booked";
    for (const mid of links as string[]) {
      const t =
        tally.get(mid) ?? { attended: 0, noShow: 0, cancelled: 0, booked: 0 };
      if (status === "Attended") t.attended++;
      else if (status === "No-show") t.noShow++;
      else if (status === "Cancelled") t.cancelled++;
      else t.booked++;
      tally.set(mid, t);
    }
  }

  return recs
    .filter((r) => r.fields.Name)
    .map((r) => ({
      id: r.id,
      name: (r.fields.Name as string) ?? "",
      status: (r.fields.Status as string) ?? "",
      email: (r.fields.Email as string) ?? "",
      phone: (r.fields.Phone as string) ?? "",
      type: (r.fields["Membership Type"] as string) ?? "",
      renewal: (r.fields["Renewal Date"] as string) ?? null,
      month: tally.get(r.id) ?? {
        attended: 0,
        noShow: 0,
        cancelled: 0,
        booked: 0,
      },
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function addMember(m: {
  name: string;
  email?: string;
  phone?: string;
  type?: string;
}): Promise<void> {
  const res = await fetch(`${API}/Members`, {
    method: "POST",
    headers: { ...authHeaders, "Content-Type": "application/json" },
    body: JSON.stringify({
      typecast: true,
      fields: {
        Name: m.name,
        Email: m.email || undefined,
        Phone: m.phone || undefined,
        "Membership Type": m.type || undefined,
        Status: "Active",
        "Start Date": toISO(new Date()),
      },
    }),
  });
  if (!res.ok) {
    throw new Error(`addMember failed (${res.status}): ${await res.text()}`);
  }
}

export async function setMemberStatus(
  id: string,
  status: string,
): Promise<void> {
  if (!MEMBER_STATUSES.includes(status)) throw new Error("Invalid status");
  const res = await fetch(`${API}/Members/${id}`, {
    method: "PATCH",
    headers: { ...authHeaders, "Content-Type": "application/json" },
    body: JSON.stringify({ fields: { Status: status } }),
  });
  if (!res.ok) {
    throw new Error(`setMemberStatus failed (${res.status}): ${await res.text()}`);
  }
}

/* ---------------- Admin: classes (add / archive) ---------------- */

export type StudioClass = {
  id: string;
  day: string;
  time: string;
  name: string;
  capacity: number;
};

/** Active (non-archived) classes, for the manage-classes screen. */
export async function getClasses(): Promise<StudioClass[]> {
  const recs = await fetchAll("Sessions", {}, ADMIN_TTL, [ADMIN_TAG]);
  return recs
    .filter((r) => r.fields.Name && !r.fields.Archived)
    .map((r) => ({
      id: r.id,
      day: (r.fields.Day as string) ?? "",
      time: (r.fields.Time as string) ?? "",
      name: (r.fields.Name as string) ?? "",
      capacity: (r.fields.Capacity as number) ?? 0,
    }))
    .sort(
      (a, b) =>
        DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day) ||
        timeToMinutes(a.time) - timeToMinutes(b.time),
    );
}

export async function addClass(c: {
  name: string;
  day: string;
  time: string;
  capacity: number;
}): Promise<void> {
  const res = await fetch(`${API}/Sessions`, {
    method: "POST",
    headers: { ...authHeaders, "Content-Type": "application/json" },
    body: JSON.stringify({
      typecast: true, // create the Day option if it's new
      fields: {
        Name: c.name,
        Day: c.day,
        Time: c.time,
        Capacity: c.capacity,
      },
    }),
  });
  if (!res.ok) {
    throw new Error(`addClass failed (${res.status}): ${await res.text()}`);
  }
}

/** Archive (hide) or restore a class. Bookings/history are preserved. */
export async function setClassArchived(
  id: string,
  archived: boolean,
): Promise<void> {
  const res = await fetch(`${API}/Sessions/${id}`, {
    method: "PATCH",
    headers: { ...authHeaders, "Content-Type": "application/json" },
    body: JSON.stringify({ fields: { Archived: archived } }),
  });
  if (!res.ok) {
    throw new Error(`setClassArchived failed (${res.status}): ${await res.text()}`);
  }
}

/* ---------------- Admin: whole-month overview ---------------- */

export type MonthClass = {
  sessionId: string;
  name: string;
  time: string;
  booked: number;
  capacity: number;
};

export type MonthDay = {
  date: string; // ISO
  label: string; // e.g. "Sun 3 Aug"
  classes: MonthClass[];
};

/** Every class date in the current calendar month, with booked counts. */
export async function getMonthRoster(): Promise<MonthDay[]> {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1–12

  const [sessions, bookings] = await Promise.all([
    fetchAll("Sessions", {}, ADMIN_TTL, [ADMIN_TAG]),
    fetchAll(
      "Booking",
      {
        filterByFormula: `AND(YEAR({Class Date}) = ${year}, MONTH({Class Date}) = ${month})`,
      },
      ADMIN_TTL,
      [ADMIN_TAG],
    ),
  ]);

  const counts = new Map<string, number>();
  for (const b of bookings) {
    if (b.fields["Attendance"] === "Cancelled") continue;
    const cd = b.fields["Class Date"];
    const links = b.fields["Sessions"];
    if (typeof cd !== "string" || !Array.isArray(links)) continue;
    for (const sid of links as string[]) {
      const key = `${sid}|${cd}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }

  const active = sessions.filter((s) => s.fields.Name && !s.fields.Archived);
  const first = new Date(year, month - 1, 1);
  const last = new Date(year, month, 0); // last day of the month
  const days: MonthDay[] = [];

  for (let d = new Date(first); d <= last; d.setDate(d.getDate() + 1)) {
    const dayName = DAY_ORDER[d.getDay()];
    const iso = toISO(d);
    const classes = active
      .filter((s) => s.fields.Day === dayName)
      .map((s) => ({
        sessionId: s.id,
        name: (s.fields.Name as string) ?? "",
        time: (s.fields.Time as string) ?? "",
        capacity: (s.fields.Capacity as number) ?? 0,
        booked: counts.get(`${s.id}|${iso}`) ?? 0,
      }))
      .sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));
    if (classes.length) {
      days.push({
        date: iso,
        label: `${d.toLocaleDateString("en-GB", { weekday: "short" })} ${formatDate(d)}`,
        classes,
      });
    }
  }
  return days;
}

/* ---------------- Website contact form ---------------- */

export type Enquiry = {
  name: string;
  email: string;
  phone?: string;
  interest?: string;
  message?: string;
};

/** Save a contact-form submission to the Enquiries table. */
export async function createEnquiry(e: Enquiry): Promise<void> {
  const res = await fetch(`${API}/Enquiries`, {
    method: "POST",
    headers: { ...authHeaders, "Content-Type": "application/json" },
    body: JSON.stringify({
      typecast: true,
      fields: {
        Name: e.name,
        Email: e.email,
        Phone: e.phone || undefined,
        "Interested In": e.interest || undefined,
        Message: e.message || undefined,
        Status: "New",
      },
    }),
  });
  if (!res.ok) {
    throw new Error(`createEnquiry failed (${res.status}): ${await res.text()}`);
  }
}
