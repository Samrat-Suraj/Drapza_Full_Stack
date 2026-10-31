"use client";

import React from "react";
import { Skeleton } from "./Skeleton";

interface ProductGridSkeletonProps {
  count?: number;
  gridClassName?: string;
  ariaLabel?: string;
}

export const ProductGridSkeleton: React.FC<ProductGridSkeletonProps> = ({
  count = 8,
  gridClassName = "wardrobe-product-grid",
  ariaLabel = "Loading atelier garments...",
}) => {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label={ariaLabel}
      className={gridClassName}
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
        gap: "2rem",
        width: "100%",
        alignItems: "stretch",
      }}
    >
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="product"
          style={{
            minWidth: 0,
            width: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            height: "100%",
            backgroundColor: "var(--base-200, #d7dbd2)",
            borderRadius: "0.75rem",
            overflow: "hidden",
            boxSizing: "border-box",
          }}
        >
          {/* Garment Image Area matching ProductCard.tsx */}
          <div
            className="product-img"
            style={{
              position: "relative",
              width: "100%",
              flex: "1 1 auto",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              padding: "1.5rem 1.5rem 1rem",
              backgroundColor: "var(--base-200, #d7dbd2)",
              overflow: "hidden",
              minHeight: "280px",
            }}
          >
            <Skeleton
              className="w-full h-full"
              style={{
                height: "260px",
                borderRadius: "0.5rem",
                backgroundColor: "rgba(0, 0, 0, 0.06)",
              }}
              ariaLabel="Loading product visual..."
            />
          </div>

          {/* Product Info & Action matching ProductCard.tsx */}
          <div
            className="product-info"
            style={{
              width: "100%",
              minWidth: 0,
              backgroundColor: "var(--base-200, #d7dbd2)",
              padding: "0 1rem 1rem",
              boxSizing: "border-box",
            }}
          >
            {/* Title & Price Row */}
            <div
              className="product-info-wrapper"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
                gap: "0.5rem",
                marginBottom: "0.75rem",
              }}
            >
              <Skeleton width="60%" height={16} subtle />
              <Skeleton width="28%" height={16} />
            </div>

            {/* ADD TO CART Button matching ProductCard.tsx */}
            <Skeleton
              variant="button"
              height={46}
              contrast
              style={{
                width: "100%",
                borderRadius: "0.5rem",
                backgroundColor: "var(--base-700, #0f0f0f)",
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProductGridSkeleton;
