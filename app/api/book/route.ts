import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createBooking } from "@/app/lib/airtable";

/**
 * POST /api/book
 * Body: { sessionId, name, email, phone?, firstTime? }
 * Saves the booking into Airtable's Booking table.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { sessionId, name, email, phone, firstTime } =
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
    await createBooking({
      sessionId,
      name: name.trim(),
      email: email.trim(),
      phone: typeof phone === "string" ? phone.trim() : undefined,
      firstTime: Boolean(firstTime),
    });
    // Bust the cached schedule so the new "spots left" shows immediately.
    revalidatePath("/book");
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Booking failed:", err);
    return NextResponse.json(
      { error: "Something went wrong saving your booking. Please try again." },
      { status: 502 },
    );
  }
}
