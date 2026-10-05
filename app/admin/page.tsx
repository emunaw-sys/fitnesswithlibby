import type { Metadata } from "next";
import { isAuthed } from "@/app/lib/adminAuth";
import { getRoster, getMembers, getClasses } from "@/app/lib/airtable";
import AdminLogin from "./AdminLogin";
import AdminDashboard from "./AdminDashboard";
import "./admin.css";

// Reading the auth cookie already makes this page render per-request, so we
// don't force-dynamic — that lets the Airtable reads use their cached,
// per-table tags (see refreshTables) to stay inside the free plan's API budget.

export const metadata: Metadata = {
  title: "Studio Admin — Fitness With Libby",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  if (!(await isAuthed())) {
    return <AdminLogin />;
  }
  let data;
  try {
    const [roster, members, classes] = await Promise.all([
      getRoster(),
      getMembers(),
      getClasses(),
    ]);
    data = { roster, members, classes };
  } catch (err) {
    // Without this, any Airtable failure (an expired token, Airtable being
    // down, the free plan's monthly limit running out) shows Libby a bare
    // "server error" page with nothing to go on.
    console.error("Could not load the admin data from Airtable:", err);
  }

  if (!data) {
    return (
      <div className="ad-login">
        <div className="ad-login-card">
          <h1>Can&rsquo;t load the studio right now</h1>
          <p>
            The website couldn&rsquo;t reach Airtable. Nothing is lost &mdash;
            every booking is still in Airtable, and you can open it there
            directly in the meantime.
          </p>
          <p>
            Try again in a few minutes. If it keeps happening, the monthly
            Airtable limit may have run out &mdash; let Emuna know.
          </p>
        </div>
      </div>
    );
  }
  return (
    <AdminDashboard
      roster={data.roster}
      members={data.members}
      classes={data.classes}
    />
  );
}
