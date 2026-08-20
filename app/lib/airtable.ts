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

/* How many consecutive weeks an active member may book in one go. */
export const SERIES_WEEKS = 4;

export type ClassSession = {
  id: string; // Airtable record id, used to link the booking
  name: string;
  time: string;
  spotsLeft: number;
  /**
   * Spots free for each of the next SERIES_WEEKS occurrences, index 0 being
   * the same one `spotsLeft` describes. Members booking a series need to know
   * week 3 is full before they commit, and the counts are already in memory
   * here, so this costs no extra Airtable calls.
   */
  weekSpots: number[];
  /** "Tue 25 Aug" for each of those weeks, for the series picker. */
  weekDates: string[];
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
/**
 * The next date this class runs.
 *
 * Pass the class time wherever it's known: on the day itself, a class whose
 * start time has already gone by belongs to *next* week, not today —
 * otherwise a 9am class stays bookable until midnight and lands on Libby's
 * roster for a session that finished that morning.
 *
 * A time we can't parse is left alone rather than guessed at. Rolling a class
 * forward on a bad read would hide it for a whole week, which is far worse
 * than the stale-by-a-few-hours behaviour it replaces.
 */
function nextOccurrence(day: string, time?: string): Date {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = DAY_INDEX[day];
  if (target === undefined) return d;
  let diff = (target - d.getDay() + 7) % 7; // 0..6 days ahead
  if (diff === 0 && time) {
    const startsAt = parseTime(time);
    const nowMins = now.getHours() * 60 + now.getMinutes();
    if (startsAt !== null && nowMins >= startsAt) diff = 7;
  }
  d.setDate(d.getDate() + diff);
  return d;
}

/**
 * The dates a class actually runs, soonest first.
 *
 * Starts from the next occurrence of its weekday, then skips anything the
 * class isn't running: dates before its "Starts On" (a season start), and any
 * date in "Skip Dates" (a chag, illness, a one-off closure).
 *
 * This is the single source of truth for "when does this class run". The
 * public schedule, the series picker and the booking write all call it, so
 * the page can never offer a date the server would refuse.
 */
function bookableDates(
  day: string,
  time: string | undefined,
  startsOn: string | undefined,
  skip: Set<string>,
  count: number,
): Date[] {
  const out: Date[] = [];
  let d = nextOccurrence(day, time);
  // Two years of weeks is far past any real season start, and stops a bad
  // "Starts On" (a typo'd year, say) from spinning forever.
  for (let guard = 0; guard < 104 && out.length < count; guard++) {
    const iso = toISO(d);
    const toosoon = startsOn ? iso < startsOn : false;
    if (!toosoon && !skip.has(iso)) out.push(new Date(d));
    d = addWeeks(d, 1);
  }
  return out;
}

/* Parse the Skip Dates textarea into a set of ISO dates. */
function parseSkipDates(raw: unknown): Set<string> {
  if (typeof raw !== "string") return new Set();
  return new Set(
    raw
      .split(/[\n,]/)
      .map((x) => x.trim())
      .filter((x) => /^\d{4}-\d{2}-\d{2}$/.test(x)),
  );
}

/* Same weekday, k weeks later. */
function addWeeks(d: Date, k: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + 7 * k);
  return out;
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

/* "2026-08-25" -> "Tuesday 25 August" (used in the confirmation email). */
function formatLongDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

/**
 * Class times are typed by hand in Airtable and are not consistent —
 * "9:00 am", "8:45pm" and "9.00am" are all in the base today. Accept a
 * colon or a dot, an optional space, and an optional :mm.
 * Returns null when it genuinely can't be read, so callers can decide
 * whether guessing is safe.
 */
function parseTime(t: string): number | null {
  const m = t.trim().match(/^(\d{1,2})(?:[:.](\d{2}))?\s*([ap])\.?m\.?$/i);
  if (!m) return null;
  const hour = parseInt(m[1], 10);
  const min = parseInt(m[2] ?? "0", 10);
  if (hour < 1 || hour > 12 || min > 59) return null;
  const h = hour % 12;
  return (m[3].toLowerCase() === "p" ? h + 12 : h) * 60 + min;
}

/* Minutes since midnight, for sorting. Unreadable times sort first. */
function timeToMinutes(t: string): number {
  return parseTime(t) ?? 0;
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

/**
 * Look up a Member by email (case-insensitive).
 * Returns the record id and whether their membership is currently Active —
 * "Paused" and "Inactive" both count as not active. We key the series
 * entitlement off Status alone (not Renewal Date) because Status is the field
 * Libby actually maintains; a stale renewal date would lock out a paying member.
 */
async function findMemberByEmail(
  email: string,
): Promise<{ id: string; active: boolean } | undefined> {
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
    const data = (await res.json()) as {
      records?: { id: string; fields?: Record<string, unknown> }[];
    };
    const rec = data.records?.[0];
    if (!rec) return undefined;
    return { id: rec.id, active: rec.fields?.["Status"] === "Active" };
  } catch {
    return undefined; // non-fatal
  }
}

async function findMemberIdByEmail(email: string): Promise<string | undefined> {
  return (await findMemberByEmail(email))?.id;
}

/**
 * Is this email an active member? Backs the booking form's series option.
 * Deliberately returns a bare boolean and never a name — the endpoint is
 * public, so it must not become a way to look people up.
 */
export async function isActiveMember(email: string): Promise<boolean> {
  return (await findMemberByEmail(email))?.active === true;
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

  /* Each class has its own next occurrence, because a class that has already
   * started today belongs to next week while a later class the same day does
   * not. So build the classes first, then let each day card take the earliest
   * date among them.
   *
   * A class whose own date is later than its day card's has already run today:
   * it is left off rather than shown under the wrong date, and reappears on
   * that card tomorrow once the whole day has rolled forward together. */
  type Entry = { day: string; occ: Date; cls: ClassSession };
  const entries: Entry[] = [];

  for (const rec of sessions) {
    const day = rec.fields.Day as string | undefined;
    const name = rec.fields.Name as string | undefined;
    if (!day || !name || rec.fields.Archived) continue;

    const time = (rec.fields.Time as string | undefined) ?? "";
    const runs = bookableDates(
      day,
      time,
      rec.fields["Starts On"] as string | undefined,
      parseSkipDates(rec.fields["Skip Dates"]),
      SERIES_WEEKS,
    );
    if (runs.length === 0) continue; // nothing scheduled within two years
    const occ = runs[0];
    const capacity = (rec.fields.Capacity as number | undefined) ?? 0;
    const booked = counts.get(`${rec.id}|${toISO(occ)}`) ?? 0;

    // Availability across the next few dates it actually runs — cancelled
    // weeks are skipped, so a series never straddles a week with no class.
    // `counts` already holds every future booking, so this costs no API calls.
    const weekSpots: number[] = [];
    const weekDates: string[] = [];
    for (const d of runs) {
      const taken = counts.get(`${rec.id}|${toISO(d)}`) ?? 0;
      weekSpots.push(Math.max(0, capacity - taken));
      weekDates.push(formatDate(d));
    }

    entries.push({
      day,
      occ,
      cls: {
        id: rec.id,
        name,
        time,
        spotsLeft: Math.max(0, capacity - booked),
        weekSpots,
        weekDates,
      },
    });
  }

  const cards: { on: Date; card: DaySchedule }[] = [];
  for (const day of new Set(entries.map((e) => e.day))) {
    const forDay = entries.filter((e) => e.day === day);
    const soonest = forDay.reduce(
      (min, e) => (e.occ < min ? e.occ : min),
      forDay[0].occ,
    );
    const stillToCome = forDay.filter((e) => toISO(e.occ) === toISO(soonest));
    if (stillToCome.length === 0) continue;
    cards.push({
      on: soonest,
      card: {
        day,
        tag: DAY_TAG[day] ?? "",
        nextDate: formatDate(soonest),
        classes: stillToCome.map((e) => e.cls),
      },
    });
  }

  /* Soonest first, by real date — not by weekday name. Sorting Sunday-to-
   * Saturday puts a class running today *below* one next Tuesday whenever
   * today falls late in the week, which reads as though the page is broken. */
  const schedule = cards
    .sort((a, b) => a.on.getTime() - b.on.getTime())
    .map((c) => c.card);
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
  /** Consecutive weeks to book. Honoured only for active members. */
  weeks?: number;
};

/** The requested class(es) filled up — a user-fixable problem, not a fault. */
export class BookingFullError extends Error {
  readonly userFacing = true;
}

/**
 * Live state for one session across the given dates, read uncached:
 * how many places are taken, and which of those dates this person already
 * holds. Cancelled bookings release their place, matching getSchedule.
 */
async function readSessionState(
  sessionId: string,
  isoDates: string[],
  email: string,
): Promise<{ taken: Map<string, number>; held: Set<string> }> {
  const taken = new Map<string, number>(isoDates.map((d) => [d, 0]));
  const held = new Set<string>();
  const mine = email.trim().toLowerCase();
  const rows = await fetchAll(
    "Booking",
    { filterByFormula: "IS_AFTER({Class Date}, DATEADD(TODAY(), -1, 'days'))" },
    0, // no cache: this decides whether someone gets the last place
  );
  for (const b of rows) {
    if (b.fields["Attendance"] === "Cancelled") continue;
    const date = b.fields["Class Date"];
    const links = b.fields["Sessions"];
    if (typeof date !== "string" || !Array.isArray(links)) continue;
    if (!links.includes(sessionId)) continue;
    if (!taken.has(date)) continue;
    taken.set(date, (taken.get(date) ?? 0) + 1);
    const rowEmail = b.fields["Email"];
    if (mine && typeof rowEmail === "string" && rowEmail.trim().toLowerCase() === mine) {
      held.add(date);
    }
  }
  return { taken, held };
}

/**
 * Create a booking, linked to its session, stamped with the class date
 * it was made for, and marked "Booked" (Libby updates this to Attended /
 * No-show after class).
 */
export async function createBooking(
  booking: NewBooking,
): Promise<{ dates: string[]; added: number; alreadyHeld: number }> {
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
  if (!day) throw new Error("That class has no day set.");
  const className = srec.fields?.Name as string | undefined;
  const classTime = srec.fields?.Time as string | undefined;
  const capacity = (srec.fields?.Capacity as number | undefined) ?? 0;
  const startsOn = srec.fields?.["Starts On"] as string | undefined;
  const skip = parseSkipDates(srec.fields?.["Skip Dates"]);

  // If this email matches a member on file, link the booking to them so
  // Libby can tell members apart from drop-ins.
  const member = await findMemberByEmail(booking.email);
  const memberIds = member ? [member.id] : undefined;

  // Booking a series is a members-only entitlement, re-checked here rather
  // than trusted from the request — the client can send anything.
  const wanted = Math.min(Math.max(Math.round(booking.weeks ?? 1), 1), SERIES_WEEKS);
  const weeks = member?.active ? wanted : 1;

  // Which of those weeks actually have room. Availability is re-read
  // uncached: the cached schedule the client saw may be up to 60s stale, and
  // two people can pick the last place in that window.
  // The same dates the schedule offered — computed here rather than trusted,
  // and skipping any week the class isn't running.
  const wantedDates = bookableDates(day, classTime, startsOn, skip, weeks).map(
    toISO,
  );
  if (wantedDates.length === 0) {
    throw new BookingFullError("That class isn't running at the moment.");
  }
  const { taken, held } = await readSessionState(
    booking.sessionId,
    wantedDates,
    booking.email,
  );

  // Never sell someone the same place twice. A double-tapped button, an
  // impatient refresh and a re-submitted form all land here, and without this
  // each one takes another spot out of the class.
  const openDates = wantedDates.filter(
    (d) => !held.has(d) && (taken.get(d) ?? 0) < capacity,
  );

  if (openDates.length === 0) {
    // Already booked for everything they asked for: show them the booking
    // they have rather than an error, and don't email them a second time.
    if (held.size > 0) {
      const mine = wantedDates.filter((d) => held.has(d));
      return {
        dates: mine.map(formatLongDate),
        added: 0,
        alreadyHeld: mine.length,
      };
    }
    throw new BookingFullError(
      weeks > 1
        ? "Those classes filled up while you were booking. Please pick another time."
        : "That class just filled up. Please pick another time.",
    );
  }

  // One email per booking, not per class: only the first record is flagged
  // for the automation, and it carries the full list of dates.
  const confirmed = wantedDates.filter(
    (d) => held.has(d) || openDates.includes(d),
  );
  const seriesDates = confirmed
    .map((iso) => `${formatLongDate(iso)}${classTime ? `, ${classTime}` : ""}`)
    .join("\n");

  const records = openDates.map((iso, i) => ({
    fields: {
      Name: booking.name,
      Email: booking.email,
      Phone: booking.phone || undefined,
      "First time?": Boolean(booking.firstTime) && i === 0,
      Sessions: [booking.sessionId],
      "Class Date": iso,
      "Class Name": className,
      "Class Time": classTime,
      Attendance: "Booked",
      Source: "Website",
      Member: memberIds,
      Notify: i === 0,
      "Series Dates": i === 0 ? seriesDates : undefined,
    },
  }));

  const res = await fetch(`${API}/Booking`, {
    method: "POST",
    headers: { ...authHeaders, "Content-Type": "application/json" },
    body: JSON.stringify({ records }),
  });

  if (!res.ok) {
    throw new Error(
      `Airtable createBooking failed (${res.status}): ${await res.text()}`,
    );
  }
  return {
    dates: confirmed.map(formatLongDate),
    added: openDates.length,
    alreadyHeld: confirmed.length - openDates.length,
  };
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
  /** ISO date of this occurrence, for cancelling/restoring it. */
  dateISO: string;
  /** True when Libby has called this particular week off. */
  cancelled: boolean;
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
    // Deliberately not time-aware, unlike the public schedule: Libby still
    // needs today's class on her roster after it has finished so she can mark
    // who turned up. Cancelled weeks stay on the roster too — hiding them
    // would take away the list of people to tell and the way to undo.
    const occ = nextOccurrence(day);
    occ.setDate(occ.getDate() + 7 * weekOffset);
    const skip = parseSkipDates(rec.fields["Skip Dates"]);
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
      dateISO: toISO(occ),
      cancelled: skip.has(toISO(occ)),
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
  const runs = bookableDates(
    day,
    classTime,
    srec.fields?.["Starts On"] as string | undefined,
    parseSkipDates(srec.fields?.["Skip Dates"]),
    weeks,
  );
  if (runs.length === 0) throw new Error("That class isn't running at the moment.");
  const memberId = b.email ? await findMemberIdByEmail(b.email) : undefined;

  const records = runs.map((d) => {
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
        Notify: false,
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
  return runs.length;
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
  startsOn: string | null; // ISO, or null when it runs continuously
  archived: boolean;
};

/** Every class, active and archived — the manage-classes screen shows both. */
export async function getClasses(): Promise<StudioClass[]> {
  const recs = await fetchAll("Sessions", {}, ADMIN_TTL, [ADMIN_TAG]);
  return recs
    .filter((r) => r.fields.Name)
    .map((r) => ({
      id: r.id,
      day: (r.fields.Day as string) ?? "",
      time: (r.fields.Time as string) ?? "",
      name: (r.fields.Name as string) ?? "",
      capacity: (r.fields.Capacity as number) ?? 0,
      startsOn: (r.fields["Starts On"] as string) ?? null,
      archived: Boolean(r.fields.Archived),
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

/** Set or clear a class's season start. Pass null to clear it. */
export async function setClassStartsOn(
  id: string,
  startsOn: string | null,
): Promise<void> {
  const res = await fetch(`${API}/Sessions/${id}`, {
    method: "PATCH",
    headers: { ...authHeaders, "Content-Type": "application/json" },
    body: JSON.stringify({ fields: { "Starts On": startsOn } }),
  });
  if (!res.ok) {
    throw new Error(`setClassStartsOn failed (${res.status}): ${await res.text()}`);
  }
}

/**
 * Call off (or reinstate) one week of a class.
 *
 * Cancelling also marks that week's bookings Cancelled, which releases the
 * places and keeps the monthly attendance tallies honest. Nobody is emailed —
 * Libby tells them herself, which is why the roster keeps showing the class
 * and the people who were booked into it.
 *
 * Reinstating clears the skip date but deliberately does NOT un-cancel the
 * bookings: those people have been told the class was off, so they have to
 * choose to come back rather than be silently rebooked.
 */
export async function setOccurrenceCancelled(
  sessionId: string,
  isoDate: string,
  cancelled: boolean,
): Promise<{ affected: number }> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) throw new Error("Bad date.");

  const sres = await fetch(`${API}/Sessions/${sessionId}`, {
    headers: authHeaders,
    cache: "no-store",
  });
  if (!sres.ok) throw new Error(`session lookup failed (${sres.status})`);
  const srec = (await sres.json()) as AirtableRecord;

  const skip = parseSkipDates(srec.fields?.["Skip Dates"]);
  if (cancelled) skip.add(isoDate);
  else skip.delete(isoDate);

  const pres = await fetch(`${API}/Sessions/${sessionId}`, {
    method: "PATCH",
    headers: { ...authHeaders, "Content-Type": "application/json" },
    body: JSON.stringify({
      fields: { "Skip Dates": Array.from(skip).sort().join("\n") },
    }),
  });
  if (!pres.ok) {
    throw new Error(`skip-date update failed (${pres.status}): ${await pres.text()}`);
  }

  if (!cancelled) return { affected: 0 };

  // Release the places held for that week.
  const rows = await fetchAll(
    "Booking",
    { filterByFormula: "IS_AFTER({Class Date}, DATEADD(TODAY(), -1, 'days'))" },
    0,
  );
  const doomed = rows.filter((b) => {
    const links = b.fields["Sessions"];
    return (
      b.fields["Class Date"] === isoDate &&
      Array.isArray(links) &&
      links.includes(sessionId) &&
      b.fields["Attendance"] !== "Cancelled"
    );
  });

  for (let i = 0; i < doomed.length; i += 10) {
    const batch = doomed.slice(i, i + 10);
    const res = await fetch(`${API}/Booking`, {
      method: "PATCH",
      headers: { ...authHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({
        records: batch.map((b) => ({
          id: b.id,
          fields: { Attendance: "Cancelled" },
        })),
      }),
    });
    if (!res.ok) {
      throw new Error(`cancelling bookings failed (${res.status}): ${await res.text()}`);
    }
  }
  return { affected: doomed.length };
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
