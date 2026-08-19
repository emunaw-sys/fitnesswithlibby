import type { Metadata } from "next";
import { isAuthed } from "@/app/lib/adminAuth";
import { getRoster, getMembers, getClasses } from "@/app/lib/airtable";
import AdminLogin from "./AdminLogin";
import AdminDashboard from "./AdminDashboard";
import "./admin.css";

// Reading the auth cookie already makes this page render per-request, so we
// don't force-dynamic — that lets the Airtable reads use their cached tags
// (see ADMIN_TAG) to stay inside the free plan's API budget.

export const metadata: Metadata = {
  title: "Studio Admin — Fitness With Libby",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  if (!(await isAuthed())) {
    return <AdminLogin />;
  }
  const [roster, members, classes] = await Promise.all([
    getRoster(),
    getMembers(),
    getClasses(),
  ]);
  return (
    <AdminDashboard roster={roster} members={members} classes={classes} />
  );
}
