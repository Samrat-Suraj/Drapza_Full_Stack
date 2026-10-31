"use client";

import React from "react";
import { Skeleton } from "./Skeleton";

export const TrackOrderSkeleton: React.FC = () => {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Tracking order dispatch telemetry..."
      style={{
        backgroundColor: "#ffffff",
        border: "1px solid rgba(15, 15, 15, 0.08)",
        borderRadius: "24px",
        padding: "3rem 3.5rem",
        boxShadow: "0 10px 40px -10px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02)",
        maxWidth: "850px",
        margin: "0 auto",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      {/* 1. Header: Reference Code & Current Status Badge matching TrackPage.jsx */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid rgba(15, 15, 15, 0.08)",
          paddingBottom: "1.8rem",
          marginBottom: "2.5rem",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
          <Skeleton width={80} height={11} subtle />
          <Skeleton width={180} height={24} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.35rem" }}>
          <Skeleton width={90} height={11} subtle />
          <Skeleton
            width={140}
            height={28}
            style={{ borderRadius: "999px" }}
          />
        </div>
      </div>

      {/* 2. Checkpoints Vertical Timeline matching TrackPage.jsx */}
      <div style={{ display: "flex", flexDirection: "column", gap: "2.4rem", position: "relative" }}>
        {[
          { title: 140, desc: 240 },
          { title: 160, desc: 210 },
          { title: 180, desc: 260 },
          { title: 150, desc: 230 },
          { title: 130, desc: 190 },
        ].map((step, idx) => (
          <div key={idx} style={{ display: "flex", gap: "1.6rem", alignItems: "flex-start", position: "relative" }}>
            {/* Step Icon & Connecting Line */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", position: "relative", width: "38px", flexShrink: 0 }}>
              <Skeleton
                variant="circular"
                width={38}
                height={38}
                subtle={idx > 2}
                contrast={idx <= 2}
              />
              {idx < 4 && (
                <div
                  style={{
                    position: "absolute",
                    top: "38px",
                    width: "2px",
                    height: "2.4rem",
                    backgroundColor: "rgba(0, 0, 0, 0.08)",
                    zIndex: 1,
                  }}
                />
              )}
            </div>

            {/* Step Title & Description */}
            <div style={{ flex: 1, paddingTop: "0.35rem", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <Skeleton width={step.title} height={16} />
              <Skeleton width={step.desc} height={13} subtle />
            </div>
          </div>
        ))}
      </div>

      {/* 3. Bottom Dispatch Metadata Row matching TrackPage.jsx */}
      <div
        style={{
          marginTop: "2.5rem",
          paddingTop: "1.8rem",
          borderTop: "1px solid rgba(15, 15, 15, 0.08)",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: "1.5rem",
        }}
      >
        {[1, 2, 3, 4].map((i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
            <Skeleton width={70} height={11} subtle />
            <Skeleton width={120} height={15} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrackOrderSkeleton;
