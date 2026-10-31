"use client";

import React from "react";
import { Skeleton } from "./Skeleton";

export const ProfileSkeleton: React.FC = () => {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading client profile..."
      className="profile-ui"
      style={{
        maxWidth: "1200px",
        margin: "0 auto",
        width: "100%",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: "2rem",
        alignItems: "start",
        boxSizing: "border-box",
      }}
    >
      {/* 1. Left Sidebar matching ProfilePage.jsx */}
      <aside
        className="profile-sidebar"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1.25rem",
          width: "100%",
          maxWidth: "320px",
        }}
      >
        {/* User Identity Mini Card */}
        <div
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid var(--base-200, #d7dbd2)",
            borderRadius: "12px",
            padding: "1.2rem",
            display: "flex",
            alignItems: "center",
            gap: "0.85rem",
          }}
        >
          <Skeleton
            variant="circular"
            width={48}
            height={48}
            style={{ border: "2px solid #0f0f0f", flexShrink: 0 }}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", flex: 1, minWidth: 0 }}>
            <Skeleton width="75%" height={16} />
            <Skeleton width="90%" height={12} subtle />
          </div>
        </div>

        {/* Sidebar Nav Buttons List */}
        <nav
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid var(--base-200, #d7dbd2)",
            borderRadius: "12px",
            padding: "0.65rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.35rem",
          }}
        >
          {["My Orders", "My Cart", "Personal Info", "Addresses", "Preferences"].map((label, idx) => (
            <div
              key={label}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0.68rem 0.9rem",
                borderRadius: "8px",
                backgroundColor: idx === 2 ? "var(--base-700, #0f0f0f)" : "transparent",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
                <Skeleton
                  variant="circular"
                  width={15}
                  height={15}
                  subtle={idx !== 2}
                  contrast={idx === 2}
                />
                <Skeleton
                  width={idx === 2 ? 110 : 90}
                  height={14}
                  subtle={idx !== 2}
                  contrast={idx === 2}
                />
              </div>
            </div>
          ))}

          {/* Sign Out Button Placeholder */}
          <div style={{ borderTop: "1px solid var(--base-200, #d7dbd2)", paddingTop: "0.5rem", marginTop: "0.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", padding: "0.68rem 0.9rem" }}>
              <Skeleton variant="circular" width={15} height={15} subtle />
              <Skeleton width={70} height={14} subtle />
            </div>
          </div>
        </nav>
      </aside>

      {/* 2. Right Main Profile Card matching ProfilePage.jsx */}
      <main
        className="profile-card"
        style={{
          flex: 1,
          minWidth: 0,
          backgroundColor: "#ffffff",
          border: "1px solid var(--base-200, #d7dbd2)",
          borderRadius: "12px",
          padding: "2.5rem 2.8rem",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.03)",
          boxSizing: "border-box",
        }}
      >
        {/* Header: Box Icon + Title + Subtitle */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.85rem",
            marginBottom: "1.75rem",
            paddingBottom: "1.25rem",
            borderBottom: "1px solid #edf1e8",
          }}
        >
          <Skeleton
            width={42}
            height={42}
            style={{ borderRadius: "4px", backgroundColor: "#f0f3eb", border: "1px solid #d7dbd2", flexShrink: 0 }}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            <Skeleton width={260} height={32} />
            <Skeleton width={380} height={12} subtle style={{ maxWidth: "100%" }} />
          </div>
        </div>

        {/* Form Fields: Row 1 First Name & Last Name */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", marginBottom: "1.2rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <Skeleton width={80} height={12} subtle />
            <Skeleton height={48} style={{ borderRadius: "8px", border: "1px solid var(--base-200, #d7dbd2)" }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <Skeleton width={80} height={12} subtle />
            <Skeleton height={48} style={{ borderRadius: "8px", border: "1px solid var(--base-200, #d7dbd2)" }} />
          </div>
        </div>

        {/* Form Fields: Row 2 Email & Phone */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", marginBottom: "1.4rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <Skeleton width={60} height={12} subtle />
            <Skeleton height={48} style={{ borderRadius: "8px", border: "1px solid var(--base-200, #d7dbd2)" }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <Skeleton width={110} height={12} subtle />
            <Skeleton height={48} style={{ borderRadius: "8px", border: "1px solid var(--base-200, #d7dbd2)" }} />
          </div>
        </div>

        {/* Gender Selection Tiles matching ProfilePage.jsx */}
        <div style={{ marginBottom: "1.5rem" }}>
          <Skeleton width={130} height={12} subtle style={{ marginBottom: "0.6rem" }} />
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            {[1, 2, 3].map((g) => (
              <div
                key={g}
                style={{
                  width: "120px",
                  height: "82px",
                  borderRadius: "8px",
                  border: "1px solid var(--base-200, #d7dbd2)",
                  backgroundColor: g === 1 ? "#121316" : "#ffffff",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.35rem",
                }}
              >
                <Skeleton variant="circular" width={22} height={22} contrast={g === 1} subtle={g !== 1} />
                <Skeleton width={50} height={12} contrast={g === 1} subtle={g !== 1} />
              </div>
            ))}
          </div>
        </div>

        {/* Date of Birth & Save Button */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "1rem", marginTop: "1rem" }}>
          <div style={{ width: "240px", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <Skeleton width={90} height={12} subtle />
            <Skeleton height={48} style={{ borderRadius: "8px", border: "1px solid var(--base-200, #d7dbd2)" }} />
          </div>
          <Skeleton
            variant="button"
            height={48}
            contrast
            style={{ width: "160px", borderRadius: "8px" }}
          />
        </div>
      </main>
    </div>
  );
};

export default ProfileSkeleton;
