"use client";

import React from "react";
import { Skeleton } from "./Skeleton";

interface AddressesSkeletonProps {
  count?: number;
  className?: string;
  isCheckoutVariant?: boolean;
}

export const AddressesSkeleton: React.FC<AddressesSkeletonProps> = ({
  count = 3,
  className = "",
  isCheckoutVariant = false,
}) => {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading saved addresses..."
      className={
        className ||
        (isCheckoutVariant
          ? "grid grid-cols-1 sm:grid-cols-2 gap-3"
          : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4")
      }
    >
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className={`p-4 sm:p-5 bg-white border ${
            isCheckoutVariant ? "border-neutral-200" : "border-[#d7dbd2]"
          } rounded-none shadow-xs space-y-3.5 relative`}
        >
          {/* Header Row: Full Name & Tag */}
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-neutral-100">
            <div className="flex items-center gap-2">
              <Skeleton variant="circular" width={16} height={16} />
              <Skeleton width={130} height={16} />
            </div>
            <Skeleton width={54} height={18} contrast={idx === 0} />
          </div>

          {/* Address Line 1 & Line 2 */}
          <div className="space-y-1.5 pt-1">
            <Skeleton width="92%" height={13} />
            <Skeleton width="75%" height={13} />
            <Skeleton width="55%" height={13} />
          </div>

          {/* Phone Number */}
          <div className="flex items-center gap-2 pt-1">
            <Skeleton width={70} height={12} subtle />
            <Skeleton width={95} height={13} />
          </div>

          {/* Action Buttons Footer */}
          <div className="pt-2 border-t border-neutral-100 flex items-center justify-between gap-2">
            <Skeleton width={80} height={24} subtle />
            <div className="flex items-center gap-2">
              <Skeleton width={44} height={24} subtle />
              <Skeleton width={44} height={24} subtle />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AddressesSkeleton;
