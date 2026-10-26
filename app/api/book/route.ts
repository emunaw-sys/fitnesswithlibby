import { NextResponse } from "next/server";
import { BookingFullError, createBooking } from "@/app/lib/airtable";
import { refreshTables } from "@/app/lib/refreshTables";
import { isSpam } from "@/app/lib/spam";

/**
 * POST /api/book
 * Body: { sessionId, name, email, phone?, firstTime?, month? }
 * Saves the booking into Airtable's Booking table.
 *
 * `month` ("2026-11") books every class left in that month, but it is a
 * request, not an instruction: createBooking only accepts this month or next,
 * and silently drops dates that have since filled up. The response reports
 * the dates actually booked, and what they cost, so the UI can show what
 * really happened.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const fields = (body as Record<string, unknown>) ?? {};
  const { sessionId, name, email, phone, firstTime, month } = fields;

  // Pretend it worked, but don't save it — a bot must not take up a place.
  if (isSpam(fields)) return NextResponse.json({ ok: true, dates: [] });

  if (typeof sessionId !== "string" || !sessionId) {
    return NextResponse.json({ error: "Missing class." }, { status: 400 });
  }
  if (typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Please add your name." }, { status: 400 });
  }
  if (typeof email !== "string" || !email.trim()) {
    return NextResponse.json({ error: "Please add your email." }, { status: 400 });
  }

  try {
    const { dates, added, alreadyHeld, price } = await createBooking({
      sessionId,
      name: name.trim(),
      email: email.trim(),
      phone: typeof phone === "string" ? phone.trim() : undefined,
      firstTime: Boolean(firstTime),
      month: typeof month === "string" ? month : undefined,
    });
    // Bust the cached schedule so the new "spots left" shows immediately,
    // and the admin roster too.
    refreshTables("Booking");
    return NextResponse.json({ ok: true, dates, added, alreadyHeld, price });
  } catch (err) {
    // "That class just filled up" is the user's problem to fix, not a fault —
    // show them the real reason instead of a generic failure.
    if (err instanceof BookingFullError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    console.error("Booking failed:", err);
    return NextResponse.json(
      { error: "Something went wrong saving your booking. Please try again." },
      { status: 502 },
    );
  }
}
