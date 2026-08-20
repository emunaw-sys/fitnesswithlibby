import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAuthed } from "@/app/lib/adminAuth";
import { setOccurrenceCancelled } from "@/app/lib/airtable";

/**
 * POST /api/admin/occurrence
 * Body: { sessionId, date: "YYYY-MM-DD", cancelled: boolean }
 *
 * Calls off one week of a class, or puts it back. Cancelling also releases
 * that week's bookings; nobody is emailed, so the response reports how many
 * people were affected and Libby contacts them herself.
 */
export async function POST(request: Request) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const { sessionId, date, cancelled } = body;

  if (typeof sessionId !== "string" || !sessionId) {
    return NextResponse.json({ error: "Missing class." }, { status: 400 });
  }
  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Missing date." }, { status: 400 });
  }

  try {
    const { affected } = await setOccurrenceCancelled(
      sessionId,
      date,
      Boolean(cancelled),
    );
    revalidatePath("/admin");
    revalidatePath("/book");
    return NextResponse.json({ ok: true, affected });
  } catch (err) {
    console.error("occurrence update failed:", err);
    return NextResponse.json({ error: "Could not update that class." }, { status: 502 });
  }
}
