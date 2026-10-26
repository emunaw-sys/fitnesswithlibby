import { NextResponse } from "next/server";
import { isAuthed } from "@/app/lib/adminAuth";
import { PAYMENT_METHODS, setPayment } from "@/app/lib/airtable";
import { refreshTables } from "@/app/lib/refreshTables";

// Record a payment: the total paid for the month so far, and how.
// { id, paid: 0, method: "" } clears it again.
export async function PATCH(request: Request) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }
  const body = (await request.json().catch(() => ({}))) as {
    id?: unknown;
    paid?: unknown;
    method?: unknown;
  };
  const { id, paid, method } = body;
  const validMethod =
    method === "" ||
    (typeof method === "string" &&
      (PAYMENT_METHODS as readonly string[]).includes(method));
  if (
    typeof id !== "string" ||
    typeof paid !== "number" ||
    !Number.isFinite(paid) ||
    paid < 0 ||
    !validMethod
  ) {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }
  try {
    await setPayment(id, paid, method as string);
    refreshTables("Payments");
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("payment update failed:", err);
    return NextResponse.json({ error: "Update failed." }, { status: 502 });
  }
}
