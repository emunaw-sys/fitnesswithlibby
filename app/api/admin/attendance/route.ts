import { NextResponse } from "next/server";
import { isAuthed } from "@/app/lib/adminAuth";
import { setAttendance } from "@/app/lib/airtable";

// Mark a booking Attended / No-show / Cancelled (or back to Booked).
export async function POST(request: Request) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }
  const body = (await request.json().catch(() => ({}))) as {
    bookingId?: unknown;
    status?: unknown;
  };
  if (typeof body.bookingId !== "string" || typeof body.status !== "string") {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }
  try {
    await setAttendance(body.bookingId, body.status);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("attendance update failed:", err);
    return NextResponse.json({ error: "Update failed." }, { status: 502 });
  }
}
