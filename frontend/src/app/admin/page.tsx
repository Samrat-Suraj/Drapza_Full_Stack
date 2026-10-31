import type { Metadata } from "next";
import { AdminGuard } from "@/components/drapza/AdminGuard";

export const metadata: Metadata = {
  title: "Atelier Control Center • Admin Dashboard — Drapza",
  description: "Drapza luxury streetwear administration, inventory command, and dispatch telemetry.",
};

export default function AdminPage() {
  return (
    <main data-admin-root="true" className="w-full min-h-screen bg-[#edf1e8] text-[#0f0f0f] font-sans antialiased">
      <AdminGuard />
    </main>
  );
}
