"use client";

import React, { useState, useEffect } from "react";
import { Skeleton } from "./Skeleton";

export const AdminDashboardSkeleton: React.FC = () => {
  const [sidebarMode, setSidebarMode] = useState<"full" | "compact" | "hidden">("full");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("drapza_admin_sidebar_mode");
      if (saved === "compact" || saved === "hidden" || saved === "full") {
        setSidebarMode(saved as any);
      }
    } catch (e) {}
  }, []);

  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading administrative workspace..."
      className="w-full min-h-screen bg-[#edf1e8] text-[#0f0f0f] font-sans pt-24 sm:pt-28 pb-20 px-3 sm:px-6 lg:px-8"
    >
      <div className="max-w-[1720px] mx-auto flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
        {/* ================= LEFT SIDEBAR SKELETON ================= */}
        {sidebarMode !== "hidden" && (
          <aside
            aria-label="Admin Navigation Skeleton"
            className={`
              hidden lg:flex lg:shrink-0 lg:sticky lg:top-24 bg-white border border-neutral-200 rounded-none shadow-xs flex-col lg:h-fit justify-between
              ${sidebarMode === "compact" ? "lg:w-[84px] lg:p-3 items-center" : "lg:w-72 xl:w-80 lg:p-5"}
            `}
          >
            {sidebarMode === "compact" ? (
              // Compact Skeleton Rail
              <div className="w-full flex flex-col items-center space-y-4">
                <Skeleton width={36} height={36} />
                <Skeleton width={24} height={24} subtle />
                <div className="w-full space-y-2 py-2">
                  {Array.from({ length: 8 }).map((_, idx) => (
                    <Skeleton key={idx} width={40} height={40} subtle className="mx-auto" />
                  ))}
                </div>
              </div>
            ) : (
              // Full Sidebar Skeleton
              <>
                {/* Brand & System Status */}
                <div className="space-y-2 pb-4 border-b border-neutral-200 w-full">
                  <div className="flex items-center gap-2">
                    <Skeleton variant="circular" width={8} height={8} />
                    <Skeleton width={96} height={12} subtle />
                  </div>
                  <Skeleton width={140} height={20} />
                  <Skeleton width={180} height={12} subtle />
                </div>

                {/* Navigation Links Skeleton */}
                <div className="space-y-2 w-full my-4">
                  {Array.from({ length: 9 }).map((_, idx) => (
                    <div
                      key={idx}
                      className={`h-11 rounded-none flex items-center px-3 gap-3 ${
                        idx === 0 ? "bg-neutral-900/10" : "bg-neutral-50/60"
                      }`}
                    >
                      <Skeleton width={16} height={16} subtle className="shrink-0" />
                      <Skeleton width={112} height={14} />
                    </div>
                  ))}
                </div>

                {/* Bottom Telemetry Card */}
                <div className="mt-auto pt-4 border-t border-neutral-200 space-y-2 w-full">
                  <Skeleton width={112} height={12} subtle />
                  <Skeleton width="100%" height={32} subtle />
                </div>
              </>
            )}
          </aside>
        )}

        {/* ================= MAIN CONTENT WORKSPACE SKELETON ================= */}
        <section aria-label="Admin Workspace Skeleton" className="flex-1 min-w-0 w-full space-y-6">
          {/* Header Control Card */}
          <div className="p-5 sm:p-6 bg-white border border-neutral-200 rounded-none shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <Skeleton width={192} height={24} />
              <Skeleton width={256} height={14} subtle />
            </div>
            <div className="flex items-center gap-2.5">
              <Skeleton width={112} height={40} subtle />
              <Skeleton width={128} height={40} contrast />
            </div>
          </div>

          {/* 4 Metric Stat Cards (Overview KPI Grid) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={idx}
                className="p-5 rounded-none bg-white border border-neutral-200 shadow-xs flex flex-col justify-between gap-4"
              >
                <div className="flex items-center justify-between">
                  <Skeleton width={96} height={14} subtle />
                  <Skeleton width={36} height={36} subtle />
                </div>
                <div className="space-y-1.5">
                  <Skeleton width={128} height={30} />
                  <Skeleton width={80} height={12} subtle />
                </div>
              </div>
            ))}
          </div>

          {/* Main Data Table Panel Card */}
          <div className="bg-white border border-neutral-200 rounded-none shadow-xs overflow-hidden">
            {/* Filter & Action Toolbar */}
            <div className="p-5 border-b border-neutral-200 flex flex-wrap items-center justify-between gap-4">
              <Skeleton width={160} height={20} />
              <Skeleton width={240} height={36} subtle />
            </div>

            {/* Table Rows */}
            <div className="divide-y divide-neutral-100">
              {Array.from({ length: 7 }).map((_, idx) => (
                <div key={idx} className="p-4 sm:p-5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <Skeleton width={40} height={40} subtle className="shrink-0" />
                    <div className="space-y-1 min-w-0">
                      <Skeleton width={160} height={14} />
                      <Skeleton width={96} height={12} subtle />
                    </div>
                  </div>
                  <Skeleton width={80} height={14} subtle className="hidden sm:block" />
                  <Skeleton width={80} height={24} subtle className="shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminDashboardSkeleton;
