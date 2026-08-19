import { NextResponse } from "next/server";
import { createEnquiry } from "@/app/lib/airtable";

// Save a contact-form submission from the website to Airtable.
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const { name, email, phone, interest, message } = body;

  if (typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Please add your name." }, { status: 400 });
  }
  if (typeof email !== "string" || !/.+@.+\..+/.test(email.trim())) {
    return NextResponse.json(
      { error: "Please add a valid email." },
      { status: 400 },
    );
  }

  try {
    await createEnquiry({
      name: name.trim(),
      email: email.trim(),
      phone: typeof phone === "string" ? phone.trim() : undefined,
      interest: typeof interest === "string" ? interest.trim() : undefined,
      message: typeof message === "string" ? message.trim() : undefined,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Enquiry failed:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 502 },
    );
  }
}
