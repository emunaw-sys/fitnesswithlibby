import { NextResponse } from "next/server";
import { isActiveMember } from "@/app/lib/airtable";

/**
 * POST /api/membership
 * Body: { email }
 * -> { member: boolean }
 *
 * Backs the "book the next 4 weeks" option in the booking form.
 *
 * Deliberately a POST with the address in the body, never a GET with it in
 * the query string, so the email never lands in a URL, a log line or a
 * referrer header. The response is a bare boolean and never a name: this
 * endpoint is public, so it must not become a way to look people up. The
 * server re-checks membership when the booking is actually written, so a
 * forged `true` here buys nothing.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ member: false });
  }

  const { email } = (body as Record<string, unknown>) ?? {};
  if (typeof email !== "string" || !email.trim()) {
    return NextResponse.json({ member: false });
  }

  try {
    return NextResponse.json({ member: await isActiveMember(email.trim()) });
  } catch (err) {
    // Never block a booking because the membership lookup had a bad day —
    // the caller just doesn't see the series option.
    console.error("Membership check failed:", err);
    return NextResponse.json({ member: false });
  }
}
