/* ------------------------------------------------------------------ *
 * PRICING — Libby charges per class, by how someone books.
 * ------------------------------------------------------------------
 * A month booking pays for the classes that month actually has, so a
 * month with five Sundays costs more than one with four. Shared by the
 * booking form (the summary before booking) and the server (the figure
 * on the confirmation), so the two can never disagree on the rates.
 * ------------------------------------------------------------------ */

export const PRICE = {
  /** A single class, no commitment. */
  dropIn: 45,
  /** Per class, booked for the month, once a week. */
  monthly: 40,
  /** Per class, booked for the month, twice a week or more. */
  twiceWeekly: 35,
};

/** Members booking a one-off still pay the member rate. */
export function singleClassRate(member: boolean): number {
  return member ? PRICE.monthly : PRICE.dropIn;
}

export function monthRate(twiceAWeek: boolean): number {
  return twiceAWeek ? PRICE.twiceWeekly : PRICE.monthly;
}

export type Price = {
  perClass: number;
  classes: number;
  total: number;
  twiceAWeek: boolean;
};

/* "2026-11-03" or a Date -> "2026-11" */
export function monthKey(d: string | Date): string {
  if (typeof d === "string") return d.slice(0, 7);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/* "2026-11" -> "November" */
export function monthName(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-GB", { month: "long" });
}

/* The month after "2026-12" is "2027-01". */
export function nextMonthKey(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return monthKey(new Date(y, m, 1));
}

/**
 * Next month opens for booking in the last week of this one — the week
 * Libby reaches out to everyone about renewing.
 */
export function nextMonthOpen(today = new Date()): boolean {
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  return lastDay - today.getDate() < 7;
}
