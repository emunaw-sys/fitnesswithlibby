import { NextResponse } from "next/server";
import { isAuthed } from "@/app/lib/adminAuth";
import { refreshTables } from "@/app/lib/refreshTables";

// Drop every cached Airtable read, so changes Libby made directly in Airtable
// show up now instead of when the cache window runs out. Costs one call per
// table on the next page load — the website and the admin page both catch up.
export async function POST() {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }
  refreshTables("Sessions", "Booking", "Members");
  return NextResponse.json({ ok: true });
}
