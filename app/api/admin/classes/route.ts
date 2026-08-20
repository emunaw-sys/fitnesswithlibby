import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAuthed } from "@/app/lib/adminAuth";
import { addClass, setClassArchived, setClassStartsOn } from "@/app/lib/airtable";

// Add a new class.
export async function POST(request: Request) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const { name, day, time, capacity } = body;
  if (typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Add a class name." }, { status: 400 });
  }
  if (typeof day !== "string" || !day) {
    return NextResponse.json({ error: "Pick a day." }, { status: 400 });
  }
  if (typeof time !== "string" || !time.trim()) {
    return NextResponse.json({ error: "Add a time." }, { status: 400 });
  }
  const cap = Number(capacity);
  if (!Number.isFinite(cap) || cap < 1) {
    return NextResponse.json({ error: "Add a capacity." }, { status: 400 });
  }
  try {
    await addClass({ name: name.trim(), day, time: time.trim(), capacity: cap });
    revalidatePath("/admin");
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("add class failed:", err);
    return NextResponse.json({ error: "Could not add class." }, { status: 502 });
  }
}

// Archive/restore a class, or set the date its season starts.
export async function PATCH(request: Request) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }
  const body = (await request.json().catch(() => ({}))) as {
    id?: unknown;
    archived?: unknown;
    startsOn?: unknown;
  };
  if (typeof body.id !== "string") {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }
  try {
    if ("startsOn" in body) {
      const v = body.startsOn;
      if (v !== null && v !== "" && (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v))) {
        return NextResponse.json({ error: "Bad date." }, { status: 400 });
      }
      await setClassStartsOn(body.id, v === "" || v === null ? null : (v as string));
    } else {
      await setClassArchived(body.id, Boolean(body.archived));
    }
    revalidatePath("/admin");
    revalidatePath("/book");
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("class update failed:", err);
    return NextResponse.json({ error: "Update failed." }, { status: 502 });
  }
}
