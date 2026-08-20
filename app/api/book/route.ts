import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { BookingFullError, createBooking } from "@/app/lib/airtable";

/**
 * POST /api/book
 * Body: { sessionId, name, email, phone?, firstTime?, weeks? }
 * Saves the booking into Airtable's Booking table.
 *
 * `weeks` books that many consecutive occurrences, but it is a request, not
 * an instruction: createBooking only honours it for an active member, and
 * silently drops weeks that have since filled up. The response reports the
 * dates actually booked so the UI can show what really happened.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { sessionId, name, email, phone, firstTime, weeks } =
    (body as Record<string, unknown>) ?? {};

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
    const { dates, alreadyBooked } = await createBooking({
      sessionId,
      name: name.trim(),
      email: email.trim(),
      phone: typeof phone === "string" ? phone.trim() : undefined,
      firstTime: Boolean(firstTime),
      weeks: typeof weeks === "number" ? weeks : 1,
    });
    // Bust the cached schedule so the new "spots left" shows immediately,
    // and the admin roster too.
    revalidatePath("/book");
    revalidatePath("/admin");
    return NextResponse.json({ ok: true, dates, alreadyBooked: !!alreadyBooked });
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
