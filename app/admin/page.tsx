import type { Metadata } from "next";
import { isAuthed } from "@/app/lib/adminAuth";
import { getRoster, getMembers } from "@/app/lib/airtable";
import AdminLogin from "./AdminLogin";
import AdminDashboard from "./AdminDashboard";
import "./admin.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Studio Admin — Fitness With Libby",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  if (!(await isAuthed())) {
    return <AdminLogin />;
  }
  const [roster, members] = await Promise.all([getRoster(), getMembers()]);
  return <AdminDashboard roster={roster} members={members} />;
}
