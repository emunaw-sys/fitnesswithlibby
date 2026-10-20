import { NextResponse } from "next/server";
import { createEnquiry } from "@/app/lib/airtable";

// Random-string spam like "tiIoWjctURESQIeKIqwiug": one long word with no
// spaces that flips between upper and lower case several times.
function looksRandom(s: unknown): boolean {
  if (typeof s !== "string") return false;
  const t = s.trim();
  if (t.length < 12 || /\s/.test(t) || !/^[A-Za-z]+$/.test(t)) return false;
  const flips = t.match(/[a-z][A-Z]|[A-Z][a-z]/g)?.length ?? 0;
  return flips >= 4;
}

// Is this submission from a bot? Checked silently so bots don't adapt.
function isSpam(body: Record<string, unknown>): boolean {
  const { name, message, website, elapsedMs } = body;
  // Honeypot field is hidden from people; only bots fill it.
  if (typeof website === "string" && website.trim()) return true;
  // Missing timing means the API was hit directly, not via the site's form.
  // Anything under 3 seconds is faster than a person can type.
  if (typeof elapsedMs !== "number" || elapsedMs < 3000) return true;
  return looksRandom(name) || looksRandom(message);
}

// Save a contact-form submission from the website to Airtable.
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const { name, email, phone, interest, message } = body;

  // Pretend it worked, but don't save it.
  if (isSpam(body)) return NextResponse.json({ ok: true });

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
