"use client";

import React from "react";
import { Skeleton } from "./Skeleton";

interface AdminKpiSkeletonProps {
  count?: number;
  className?: string;
}

export const AdminKpiSkeleton: React.FC<AdminKpiSkeletonProps> = ({
  count = 6,
  className = "",
}) => {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading analytics indicators..."
      className={
        className ||
        "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-3.5"
      }
    >
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="p-3.5 sm:p-4 rounded-none bg-white border border-neutral-200 shadow-xs flex flex-col justify-between min-h-[168px]"
        >
          <div>
            <div className="flex items-start justify-between gap-1.5 mb-2">
              <Skeleton width="65%" height={10} subtle />
              <Skeleton width={26} height={26} subtle className="shrink-0" />
            </div>
            <div className="py-2">
              <Skeleton width="80%" height={26} />
            </div>
          </div>
          <div className="mt-auto pt-2 border-t border-neutral-100 space-y-1.5">
            <div className="flex items-center justify-between gap-1">
              <Skeleton width={60} height={11} subtle />
              <Skeleton width={42} height={16} subtle />
            </div>
            <Skeleton width="75%" height={9} subtle />
          </div>
        </div>
      ))}
    </div>
  );
};

export default AdminKpiSkeleton;
