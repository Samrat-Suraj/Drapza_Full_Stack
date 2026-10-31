"use client";

import React from "react";
import { Skeleton } from "./Skeleton";

export const CheckoutSkeleton: React.FC = () => {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading checkout..."
      className="checkout-page"
      style={{
        backgroundColor: "var(--base-100, #edf1e8)",
        minHeight: "100vh",
        padding: "6.5rem 1.5rem 5rem",
        boxSizing: "border-box",
      }}
    >
      <div
        className="checkout-inner"
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "2.5rem",
          alignItems: "start",
        }}
      >
        {/* Left Column: Shipping Form Section matching CheckoutPage.jsx */}
        <div
          className="checkout-form-section"
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            padding: "2rem 2.25rem",
            border: "1px solid rgba(0, 0, 0, 0.08)",
            boxSizing: "border-box",
          }}
        >
          {/* Header */}
          <div style={{ paddingBottom: "16px", borderBottom: "1px dashed rgba(0, 0, 0, 0.15)", marginBottom: "22px" }}>
            <Skeleton width={280} height={32} />
            <Skeleton width={320} height={12} subtle style={{ marginTop: "8px", maxWidth: "100%" }} />
          </div>

          {/* Form Fields: First Name & Last Name */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.2rem" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <Skeleton width={80} height={12} subtle />
              <Skeleton height={46} style={{ borderRadius: "8px" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <Skeleton width={80} height={12} subtle />
              <Skeleton height={46} style={{ borderRadius: "8px" }} />
            </div>
          </div>

          {/* Email */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", marginBottom: "1.2rem" }}>
            <Skeleton width={60} height={12} subtle />
            <Skeleton height={46} style={{ borderRadius: "8px" }} />
          </div>

          {/* Phone */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", marginBottom: "1.2rem" }}>
            <Skeleton width={90} height={12} subtle />
            <Skeleton height={46} style={{ borderRadius: "8px" }} />
          </div>

          {/* Address */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", marginBottom: "1.2rem" }}>
            <Skeleton width={110} height={12} subtle />
            <Skeleton height={46} style={{ borderRadius: "8px" }} />
          </div>

          {/* City, State, PIN Code */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", marginBottom: "1.75rem" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <Skeleton width={50} height={12} subtle />
              <Skeleton height={46} style={{ borderRadius: "8px" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <Skeleton width={50} height={12} subtle />
              <Skeleton height={46} style={{ borderRadius: "8px" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <Skeleton width={60} height={12} subtle />
              <Skeleton height={46} style={{ borderRadius: "8px" }} />
            </div>
          </div>

          {/* Place Order Button */}
          <Skeleton
            variant="button"
            height={54}
            contrast
            style={{ width: "100%", borderRadius: "8px" }}
          />
        </div>

        {/* Right Column: Order Summary Section matching CheckoutPage.jsx */}
        <div
          className="checkout-summary"
          style={{
            backgroundColor: "#0a0a0c",
            borderRadius: "16px",
            padding: "2rem 2.25rem",
            color: "#ffffff",
            boxSizing: "border-box",
          }}
        >
          {/* Header */}
          <div style={{ paddingBottom: "16px", borderBottom: "1px dashed rgba(255, 255, 255, 0.18)", marginBottom: "20px" }}>
            <Skeleton dark width={200} height={30} />
          </div>

          {/* Cart Item Row Skeletons */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", marginBottom: "1.75rem" }}>
            {[1, 2].map((item) => (
              <div key={item} style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <Skeleton dark width={64} height={76} style={{ borderRadius: "8px", flexShrink: 0 }} />
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  <Skeleton dark width="80%" height={15} />
                  <Skeleton dark width="40%" height={12} subtle />
                </div>
                <Skeleton dark width={55} height={16} />
              </div>
            ))}
          </div>

          {/* Totals Breakdown */}
          <div style={{ borderTop: "1px dashed rgba(255, 255, 255, 0.18)", paddingTop: "1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <Skeleton dark width={80} height={14} subtle />
              <Skeleton dark width={70} height={14} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <Skeleton dark width={70} height={14} subtle />
              <Skeleton dark width={50} height={14} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid rgba(255, 255, 255, 0.12)", paddingTop: "0.75rem", marginTop: "0.25rem" }}>
              <Skeleton dark width={60} height={18} />
              <Skeleton dark width={90} height={22} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutSkeleton;
