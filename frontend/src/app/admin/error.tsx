"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error("[ADMIN ROUTE ACCESS EXCEPTION INTERCEPTED]:", error);
    if (process.env.NODE_ENV === "production") {
      const isLocal =
        typeof window !== "undefined" &&
        (window.location.hostname === "localhost" ||
          window.location.hostname === "127.0.0.1");
      if (!isLocal) {
        window.location.replace("/");
      }
    }
  }, [error, router]);

  return (
    <div className="w-full min-h-screen bg-[#111] text-white flex flex-col items-center justify-center p-6 text-center select-none font-mono">
      <div className="max-w-md w-full bg-[#181818] border border-white/10 p-6 space-y-4 text-left shadow-2xl">
        <div className="flex items-center gap-2 text-red-400">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <h2 className="text-xs font-bold uppercase tracking-wider">
            Admin Route Exception
          </h2>
        </div>
        <p className="text-neutral-400 text-xs font-sans break-words leading-relaxed">
          {error?.message || "An unexpected error occurred while loading the Atelier Control Center."}
        </p>
        <div className="flex items-center gap-2 pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="px-4 py-2 bg-white text-black text-xs font-bold uppercase hover:bg-neutral-200 transition-colors"
          >
            Retry
          </button>
          <button
            type="button"
            onClick={() => {
              if (typeof window !== "undefined") window.location.href = "/";
            }}
            className="px-4 py-2 border border-white/20 text-neutral-300 text-xs font-bold uppercase hover:bg-white/5 transition-colors"
          >
            Home Archive
          </button>
        </div>
      </div>
    </div>
  );
}

