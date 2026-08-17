import { NextResponse } from "next/server";
import { isAuthed } from "@/app/lib/adminAuth";
import { getRoster, getMonthRoster } from "@/app/lib/airtable";

// Fetch a roster for a period: this week, next week, or the whole month.
export async function GET(request: Request) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }
  const period = new URL(request.url).searchParams.get("period");
  try {
    if (period === "month") {
      return NextResponse.json({ month: await getMonthRoster() });
    }
    const weekOffset = period === "next" ? 1 : 0;
    return NextResponse.json({ roster: await getRoster(weekOffset) });
  } catch (err) {
    console.error("roster fetch failed:", err);
    return NextResponse.json({ error: "Could not load." }, { status: 502 });
  }
}
