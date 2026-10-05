/* ------------------------------------------------------------------ *
 * CACHE REFRESH  (server-only)
 * ------------------------------------------------------------------
 * Kept out of airtable.ts on purpose: BookingFlow, a client component,
 * imports a constant from there, and next/cache can't be bundled for the
 * browser.
 * ------------------------------------------------------------------ */
import { revalidateTag } from "next/cache";
import { tableTag, type Table } from "./airtable";

/** Expire the cached reads of these tables, so the next page load shows the
 * write that was just made. `expire: 0` rather than the stale-while-revalidate
 * default: Libby should see her change on the very next render, not the one
 * after. */
export function refreshTables(...tables: Table[]) {
  for (const t of tables) revalidateTag(tableTag(t), { expire: 0 });
}
