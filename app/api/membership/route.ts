import { NextResponse } from "next/server";
import { getHeldMonths, isActiveMember, type HeldMonth } from "@/app/lib/airtable";

/**
 * POST /api/membership
 * Body: { email }
 * -> { member: boolean, held: HeldMonth[] }
 *
 * Backs the price shown in the booking form: a member pays the member rate
 * for a single class rather than the drop-in price, and someone already
 * booked into another class that month pays the twice-a-week rate.
 *
 * Deliberately a POST with the address in the body, never a GET with it in
 * the query string, so the email never lands in a URL, a log line or a
 * referrer header. The response never carries a name or a date: this
 * endpoint is public, so it must not become a way to look people up — `held`
 * is only class ids, months and counts. The server re-prices the booking
 * when it is actually written, so a forged answer here buys nothing.
 *
 * The held-classes read shares the schedule's cached bookings query, so it
 * costs no extra Airtable calls between bookings.
 *
 * spam-filter: not needed — a read-only lookup that saves nothing.
 */
export async function POST(request: Request) {
  const none: { member: boolean; held: HeldMonth[] } = { member: false, held: [] };
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(none);
  }

  const { email } = (body as Record<string, unknown>) ?? {};
  if (typeof email !== "string" || !email.trim()) {
    return NextResponse.json(none);
  }

  try {
    const [member, held] = await Promise.all([
      isActiveMember(email.trim()),
      getHeldMonths(email.trim()),
    ]);
    return NextResponse.json({ member, held });
  } catch (err) {
    // Never block a booking because the lookup had a bad day — the caller
    // just sees the standard prices, and the server prices it properly.
    console.error("Membership check failed:", err);
    return NextResponse.json(none);
  }
}
