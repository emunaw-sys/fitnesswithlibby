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
// Shared by the public forms (contact, booking); each sends a hidden
// `website` honeypot and `elapsedMs` since the form loaded.
export function isSpam(body: Record<string, unknown>): boolean {
  const { name, message, website, elapsedMs } = body;
  // Honeypot field is hidden from people; only bots fill it.
  if (typeof website === "string" && website.trim()) return true;
  // Missing timing means the API was hit directly, not via the site's form.
  // Anything under 3 seconds is faster than a person can type.
  if (typeof elapsedMs !== "number" || elapsedMs < 3000) return true;
  return looksRandom(name) || looksRandom(message);
}
