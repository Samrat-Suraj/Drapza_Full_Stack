"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { userApi } from "@/lib/api";
import { AdminDashboardSkeleton } from "./skeletons";
import { AdminDashboard } from "./AdminDashboard";
import { ShieldAlert, Lock, ArrowLeft, LogIn } from "lucide-react";

interface AdminGuardProps {
  children?: React.ReactNode;
  initialTab?: string;
}

export const AdminGuard: React.FC<AdminGuardProps> = ({ children, initialTab }) => {
  const router = useRouter();
  const [authStatus, setAuthStatus] = useState<"checking" | "authorized" | "unauthorized">("checking");
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    let isMounted = true;

    const verifyAdminAuthorization = async () => {
      try {
        const res = await userApi.getProfile();
        if (!isMounted) return;

        if (res && res.success && res.user) {
          const user = res.user;
          const isAdmin =
            user.role === "admin" || user.email?.toLowerCase() === "drapza.cloth@gmail.com";

          if (isAdmin) {
            setAuthStatus("authorized");
            return;
          } else {
            setErrorMessage("Your account does not possess administrator credentials.");
            setAuthStatus("unauthorized");
          }
        } else {
          setErrorMessage("Authentication session required to access admin control center.");
          setAuthStatus("unauthorized");
        }
      } catch (err: any) {
        if (!isMounted) return;
        setErrorMessage(err.message || "Failed to verify admin credentials.");
        setAuthStatus("unauthorized");
      }
    };

    verifyAdminAuthorization();

    return () => {
      isMounted = false;
    };
  }, []);

  if (authStatus === "checking") {
    return <AdminDashboardSkeleton />;
  }

  if (authStatus === "unauthorized") {
    return (
      <div className="w-full min-h-screen bg-[#0d0d0d] text-[#edf1e8] flex flex-col items-center justify-center p-6 relative overflow-hidden select-none">
        {/* Subtle background brutalist grid */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(#edf1e8 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        <div className="relative z-10 max-w-md w-full border border-white/10 bg-[#141414] p-8 shadow-2xl flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6 text-red-400">
            <Lock className="w-6 h-6 stroke-[1.5]" />
          </div>

          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-red-400 mb-2">
            ACCESS RESTRICTED // 403 FORBIDDEN
          </span>

          <h2
            className="text-2xl font-bold uppercase tracking-tight text-[#edf1e8] mb-3"
            style={{ fontFamily: "var(--font-koulen, sans-serif)" }}
          >
            ATELIER COMMAND TERMINAL
          </h2>

          <p className="text-xs text-neutral-400 leading-relaxed mb-6 font-mono">
            {errorMessage || "You must be logged in as a verified system administrator to inspect or modify atelier operations."}
          </p>

          <div className="w-full flex flex-col gap-3">
            <button
              onClick={() => router.push("/login?redirect=/admin")}
              className="w-full py-3.5 bg-[#edf1e8] hover:bg-white text-black font-mono text-xs uppercase font-bold tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>AUTHENTICATE AS ADMIN</span>
            </button>

            <button
              onClick={() => router.push("/")}
              className="w-full py-3 border border-white/10 hover:border-white/30 text-neutral-300 hover:text-white font-mono text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer bg-white/[0.02]"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>RETURN TO BOUTIQUE</span>
            </button>
          </div>

          <div className="mt-8 pt-4 border-t border-white/5 w-full flex items-center justify-between font-mono text-[9px] text-neutral-600 uppercase">
            <span>DRAPZA PROTOCOL</span>
            <span>SEC-LEVEL 01</span>
          </div>
        </div>
      </div>
    );
  }

  return children ? <>{children}</> : <AdminDashboard initialTab={initialTab} />;
};
