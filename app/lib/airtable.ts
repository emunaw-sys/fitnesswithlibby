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
): Promise<AirtableRecord[]> {
  const out: AirtableRecord[] = [];
  let offset: string | undefined;
  do {
    const sp = new URLSearchParams(params);
    if (offset) sp.set("offset", offset);
    const res = await fetch(`${API}/${encodeURIComponent(table)}?${sp}`, {
      headers: authHeaders,
      next: { revalidate },
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

  // Count current bookings per (session, class date).
  const counts = new Map<string, number>();
  for (const b of bookings) {
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
    if (!day || !name) continue;

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
      },
    }),
  });

  if (!res.ok) {
    throw new Error(
      `Airtable createBooking failed (${res.status}): ${await res.text()}`,
    );
  }
}
