"use client";

import React from "react";
import { Skeleton } from "./skeletons/Skeleton";

export function ProductDetailSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading product details"
      aria-busy="true"
      className="page"
      style={{ minHeight: "100svh" }}
    >
      {/* 1. Top Breadcrumb matching UnitPage.jsx */}
      <div className="pd-breadcrumb" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <Skeleton width={80} height={14} subtle />
        <span style={{ opacity: 0.3 }}>/</span>
        <Skeleton width={140} height={14} />
      </div>

      {/* 2. Product Hero matching 1:1 .product-hero layout */}
      <section className="product-hero">
        {/* Left Column: Product Snapshots Gallery */}
        <div className="product-hero-col product-snapshots">
          <div
            className="product-snapshot active-slide"
            style={{
              width: "100%",
              height: "100%",
              minHeight: "100%",
              position: "absolute",
              top: 0,
              left: 0,
              transform: "translateY(0%)",
            }}
          >
            <Skeleton
              className="w-full h-full"
              ariaLabel="Loading product visual..."
            />
          </div>

          {/* Minimap Thumbnails matching UnitPage.jsx */}
          <div className="product-snapshot-minimap">
            {[1, 2, 3, 4, 5].map((idx) => (
              <div
                key={idx}
                className={`product-snapshot-minimap-img ${idx === 1 ? "active" : ""}`}
                style={{ overflow: "hidden" }}
              >
                <Skeleton className="w-full h-full" subtle={idx !== 1} />
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Product Meta Details matching .product-meta */}
        <div className="product-hero-col product-meta">
          <div className="product-meta-container">
            {/* Title & Price Header */}
            <div className="product-meta-header">
              <Skeleton width="85%" height={38} className="mb-2" />
              <div style={{ display: "flex", alignItems: "baseline", gap: "0.65rem", flexWrap: "wrap" }}>
                <Skeleton width={110} height={28} />
                <Skeleton width={70} height={18} subtle />
                <Skeleton width={85} height={20} subtle />
              </div>
            </div>

            <div className="product-meta-header-divider" />

            {/* Category Tag & Rating Strip */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
              <Skeleton width={90} height={22} subtle />
              <span style={{ opacity: 0.3 }}>•</span>
              <Skeleton width={110} height={16} subtle />
              <span style={{ opacity: 0.3 }}>•</span>
              <Skeleton width={80} height={16} subtle />
            </div>

            {/* Description Paragraphs */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", margin: "0.75rem 0" }}>
              <Skeleton width="100%" height={14} subtle />
              <Skeleton width="92%" height={14} subtle />
              <Skeleton width="75%" height={14} subtle />
            </div>

            {/* Color Swatches Strip */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <Skeleton width={90} height={13} subtle />
              <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
                {[1, 2, 3].map((i) => (
                  <Skeleton
                    key={i}
                    variant="circular"
                    width={34}
                    height={34}
                    subtle={i !== 1}
                  />
                ))}
              </div>
            </div>

            {/* Size Options Selector */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.35rem" }}>
              <Skeleton width={75} height={13} subtle />
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                {["S", "M", "L", "XL"].map((sz) => (
                  <Skeleton
                    key={sz}
                    width={52}
                    height={44}
                    subtle
                    style={{ borderRadius: "4px" }}
                  />
                ))}
              </div>
            </div>

            {/* Action Buttons: Add to Bag & Buy Now */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem", marginTop: "1rem" }}>
              <Skeleton variant="button" height={52} contrast style={{ width: "100%", borderRadius: "6px" }} />
              <Skeleton variant="button" height={52} subtle style={{ width: "100%", borderRadius: "6px" }} />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default ProductDetailSkeleton;
