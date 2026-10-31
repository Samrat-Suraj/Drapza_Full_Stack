import type { Metadata } from "next";
import { AdminGuard } from "@/components/drapza/AdminGuard";

export const metadata: Metadata = {
  title: "Marquee Banner CMS Studio • Admin Dashboard — Drapza",
  description: "Live 1:1 visual canvas editor and parameter controller for the Marquee Banner section.",
};

export default function AdminMarqueePage() {
  return (
    <main data-admin-root="true" className="w-full min-h-screen bg-[#edf1e8] text-[#0f0f0f] font-sans antialiased">
      <AdminGuard initialTab="marquee" />
    </main>
  );
}
