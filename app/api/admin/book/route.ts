import { NextResponse } from "next/server";
import { isAuthed } from "@/app/lib/adminAuth";
import { createManualBooking } from "@/app/lib/airtable";

// Create a manual booking (optionally repeating for several weeks).
export async function POST(request: Request) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const { sessionId, name, email, phone, weeks } = body;

  if (typeof sessionId !== "string" || !sessionId) {
    return NextResponse.json({ error: "Pick a class." }, { status: 400 });
  }
  if (typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Add a name." }, { status: 400 });
  }
  try {
    const created = await createManualBooking({
      sessionId,
      name: name.trim(),
      email: typeof email === "string" ? email.trim() : undefined,
      phone: typeof phone === "string" ? phone.trim() : undefined,
      weeks: typeof weeks === "number" ? weeks : 1,
    });
    return NextResponse.json({ ok: true, created });
  } catch (err) {
    console.error("manual booking failed:", err);
    return NextResponse.json({ error: "Could not book." }, { status: 502 });
  }
}
