"use client";

import React from "react";
import { Skeleton } from "./Skeleton";

interface AdminTableSkeletonProps {
  columns?: number;
  rows?: number;
  showToolbar?: boolean;
  showPills?: boolean;
  className?: string;
  ariaLabel?: string;
}

export const AdminTableSkeleton: React.FC<AdminTableSkeletonProps> = ({
  columns = 6,
  rows = 6,
  showToolbar = false,
  showPills = false,
  className = "",
  ariaLabel = "Loading administrative data...",
}) => {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label={ariaLabel}
      className={`w-full bg-white border border-neutral-200 rounded-none shadow-xs overflow-hidden ${className}`.trim()}
    >
      {/* Optional Filter/Search Toolbar Skeleton */}
      {showToolbar && (
        <div className="p-4 sm:p-5 border-b border-neutral-200 flex flex-wrap items-center justify-between gap-4 bg-neutral-50/50">
          <div className="flex items-center gap-2.5 flex-1 min-w-[240px] max-w-md">
            <Skeleton width="100%" height={38} />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton width={90} height={38} subtle />
            <Skeleton width={110} height={38} />
          </div>
        </div>
      )}

      {/* Optional Status Filter Pills */}
      {showPills && (
        <div className="p-3.5 border-b border-neutral-100 flex flex-wrap items-center gap-2 bg-white">
          {[80, 100, 95, 85, 110].map((w, i) => (
            <Skeleton key={i} width={w} height={28} subtle={i !== 0} contrast={i === 0} />
          ))}
        </div>
      )}

      {/* Table Structure */}
      <div className="overflow-x-auto">
        <table className="w-full text-left font-mono text-xs">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50/70 text-neutral-500 uppercase text-[10px] tracking-wider">
              {Array.from({ length: columns }).map((_, colIdx) => (
                <th key={colIdx} className="py-3 px-4 sm:px-5 font-bold">
                  <Skeleton width={colIdx === 0 ? 80 : colIdx === columns - 1 ? 60 : 70} height={12} subtle />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {Array.from({ length: rows }).map((_, rowIdx) => (
              <tr key={rowIdx} className="hover:bg-neutral-50/40 transition-colors">
                {Array.from({ length: columns }).map((_, colIdx) => (
                  <td key={colIdx} className="py-3.5 px-4 sm:px-5 align-middle">
                    {colIdx === 0 ? (
                      <div className="flex items-center gap-3">
                        <Skeleton width={32} height={32} subtle className="shrink-0" />
                        <div className="space-y-1 min-w-0">
                          <Skeleton width={90 + (rowIdx % 3) * 20} height={13} />
                          <Skeleton width={60} height={10} subtle />
                        </div>
                      </div>
                    ) : colIdx === 1 ? (
                      <div className="space-y-1">
                        <Skeleton width={110} height={12} />
                        <Skeleton width={75} height={10} subtle />
                      </div>
                    ) : colIdx === columns - 2 ? (
                      <Skeleton width={72} height={20} subtle />
                    ) : colIdx === columns - 1 ? (
                      <div className="flex items-center gap-1.5 justify-end">
                        <Skeleton width={28} height={28} subtle />
                        <Skeleton width={28} height={28} subtle />
                      </div>
                    ) : (
                      <Skeleton width={65 + (colIdx % 2) * 25} height={12} />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Table Pagination / Footer Bar Skeleton */}
      <div className="p-3.5 sm:p-4 border-t border-neutral-100 bg-neutral-50/30 flex items-center justify-between gap-4">
        <Skeleton width={140} height={12} subtle />
        <div className="flex items-center gap-1.5">
          <Skeleton width={28} height={28} subtle />
          <Skeleton width={28} height={28} subtle />
          <Skeleton width={28} height={28} subtle />
        </div>
      </div>
    </div>
  );
};

export default AdminTableSkeleton;
