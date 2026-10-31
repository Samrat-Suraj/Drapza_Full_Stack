"use client";

import React from "react";
import { Skeleton } from "./Skeleton";

export const CartPageSkeleton: React.FC = () => {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading shopping bag..."
      className="min-h-screen bg-white text-black pt-28 sm:pt-36 pb-24 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto"
    >
      {/* Top Header & Free Shipping Bar */}
      <div className="space-y-4 mb-8">
        <div className="space-y-1">
          <Skeleton width={140} height={12} subtle />
          <Skeleton width={280} height={38} className="mt-2" />
        </div>

        {/* Free Shipping Progress Bar Skeleton */}
        <div className="p-3.5 bg-neutral-50 border border-neutral-200 space-y-2">
          <div className="flex items-center justify-between">
            <Skeleton width={180} height={13} subtle />
            <Skeleton width={64} height={13} />
          </div>
          <div className="h-1.5 w-full bg-neutral-200 overflow-hidden">
            <Skeleton width="65%" height="100%" contrast />
          </div>
        </div>
      </div>

      {/* Main Cart Grid (12 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column: Items List (8 Cols) */}
        <div className="lg:col-span-8 divide-y divide-neutral-200 border-t border-b border-neutral-200">
          {[1, 2, 3].map((idx) => (
            <div
              key={idx}
              className="py-6 flex flex-col sm:flex-row gap-6 items-start justify-between"
            >
              <div className="flex gap-4 sm:gap-6 w-full sm:w-auto">
                {/* Garment Image Placeholder */}
                <Skeleton
                  width={110}
                  height={140}
                  className="shrink-0 border border-neutral-200"
                />

                {/* Details */}
                <div className="flex flex-col justify-between flex-1 space-y-3 py-1">
                  <div className="space-y-1.5">
                    <Skeleton width={100} height={11} subtle />
                    <Skeleton width={220} height={18} />
                    <Skeleton width={80} height={16} />
                  </div>

                  {/* Quantity & Actions */}
                  <div className="flex items-center gap-4 pt-2">
                    <Skeleton width={96} height={32} subtle />
                    <Skeleton width={56} height={12} subtle />
                  </div>
                </div>
              </div>

              {/* Total Item Price & Remove */}
              <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3">
                <Skeleton width={80} height={18} />
                <Skeleton width={18} height={18} subtle />
              </div>
            </div>
          ))}
        </div>

        {/* Right Column: Order Summary Card (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="p-6 bg-neutral-50 border border-neutral-200 space-y-4">
            <div className="pb-2 border-b border-neutral-200">
              <Skeleton width={140} height={18} />
            </div>

            <div className="space-y-2.5 font-mono text-xs">
              <div className="flex justify-between items-center">
                <Skeleton width={80} height={12} subtle />
                <Skeleton width={60} height={12} />
              </div>
              <div className="flex justify-between items-center">
                <Skeleton width={90} height={12} subtle />
                <Skeleton width={50} height={12} />
              </div>
              <div className="flex justify-between items-center">
                <Skeleton width={70} height={12} subtle />
                <Skeleton width={55} height={12} />
              </div>
              <div className="border-t border-neutral-200 pt-3 flex justify-between items-center">
                <Skeleton width={70} height={16} />
                <Skeleton width={90} height={20} />
              </div>
            </div>

            {/* Checkout Button Placeholder */}
            <Skeleton variant="button" height={48} contrast className="mt-4" />
          </div>
        </div>
      </div>
    </div>
  );
};

export const CartDrawerSkeleton: React.FC = () => {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading bag drawer..."
      className="space-y-4 p-4 divide-y divide-neutral-100"
    >
      {[1, 2, 3].map((idx) => (
        <div key={idx} className="pt-4 first:pt-0 flex gap-3.5 items-start">
          <Skeleton width={72} height={90} className="shrink-0" />
          <div className="flex-1 space-y-2 min-w-0">
            <Skeleton width="80%" height={14} />
            <Skeleton width="45%" height={11} subtle />
            <div className="flex items-center justify-between pt-1">
              <Skeleton width={50} height={14} />
              <Skeleton width={70} height={26} subtle />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CartPageSkeleton;
