import { NextResponse } from "next/server";
import { isAuthed } from "@/app/lib/adminAuth";
import { addMember, setMemberStatus } from "@/app/lib/airtable";

// Add a new member.
export async function POST(request: Request) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const { name, email, phone, type } = body;
  if (typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Add a name." }, { status: 400 });
  }
  try {
    await addMember({
      name: name.trim(),
      email: typeof email === "string" ? email.trim() : undefined,
      phone: typeof phone === "string" ? phone.trim() : undefined,
      type: typeof type === "string" ? type : undefined,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("add member failed:", err);
    return NextResponse.json({ error: "Could not add member." }, { status: 502 });
  }
}

// Change a member's status (Active / Inactive / Paused).
export async function PATCH(request: Request) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }
  const body = (await request.json().catch(() => ({}))) as {
    id?: unknown;
    status?: unknown;
  };
  if (typeof body.id !== "string" || typeof body.status !== "string") {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }
  try {
    await setMemberStatus(body.id, body.status);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("member status update failed:", err);
    return NextResponse.json({ error: "Update failed." }, { status: 502 });
  }
}
