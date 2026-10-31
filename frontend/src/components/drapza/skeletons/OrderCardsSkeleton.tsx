"use client";

import React from "react";
import { Skeleton } from "./Skeleton";

interface OrderCardsSkeletonProps {
  count?: number;
  className?: string;
}

export const OrderCardsSkeleton: React.FC<OrderCardsSkeletonProps> = ({
  count = 3,
  className = "",
}) => {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading atelier dispatches..."
      className={`space-y-4 ${className}`.trim()}
    >
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="rounded-none bg-white border border-[#d7dbd2] p-5 sm:p-7 shadow-xs space-y-5"
        >
          {/* Top Row: Ref & Actions Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#d7dbd2]">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Skeleton width={110} height={12} subtle />
                <Skeleton width={130} height={20} contrast={idx === 0} />
              </div>
              <Skeleton width={160} height={12} subtle />
            </div>

            <div className="flex items-center gap-2">
              <Skeleton width={88} height={30} subtle />
              <Skeleton width={110} height={36} contrast />
              <Skeleton width={120} height={36} subtle className="hidden sm:block" />
            </div>
          </div>

          {/* Garments Preview Grid (1 to 3 items) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-2.5 rounded-none bg-[#f7f9f5] border border-[#d7dbd2]"
              >
                <Skeleton width={50} height={58} className="shrink-0" />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <Skeleton width="80%" height={14} />
                  <Skeleton width="50%" height={10} subtle />
                  <Skeleton width={64} height={13} />
                </div>
              </div>
            ))}
          </div>

          {/* Total & Destination Breakdown */}
          <div className="pt-3 border-t border-dashed border-[#d7dbd2] flex flex-wrap items-center justify-between gap-3">
            <Skeleton width={200} height={13} subtle />
            <Skeleton width={110} height={16} />
          </div>
        </div>
      ))}
    </div>
  );
};

export default OrderCardsSkeleton;
