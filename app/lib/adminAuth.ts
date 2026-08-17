/* ------------------------------------------------------------------ *
 * ADMIN AUTH  (server-only)
 * ------------------------------------------------------------------
 * A simple single-password gate for Libby's admin page. The password
 * lives in the ADMIN_PASSWORD env var. On login we set an httpOnly
 * cookie holding a hash derived from the password (never the password
 * itself), and verify it by recomputing — no session store needed.
 * ------------------------------------------------------------------ */
import { cookies } from "next/headers";
import crypto from "crypto";

const PASSWORD = process.env.ADMIN_PASSWORD ?? "";
export const ADMIN_COOKIE = "fwl_admin";

export function sessionToken(): string {
  return crypto
    .createHash("sha256")
    .update("fwl-admin-v1:" + PASSWORD)
    .digest("hex");
}

export function checkPassword(input: string): boolean {
  // Constant-ish comparison; fine for a low-stakes single-password gate.
  return PASSWORD.length > 0 && input === PASSWORD;
}

export async function isAuthed(): Promise<boolean> {
  if (PASSWORD.length === 0) return false;
  const store = await cookies();
  return store.get(ADMIN_COOKIE)?.value === sessionToken();
}
