"use client";

import React from "react";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "text" | "rectangular" | "circular" | "pill" | "button" | "card";
  width?: string | number;
  height?: string | number;
  dark?: boolean;
  contrast?: boolean;
  subtle?: boolean;
  className?: string;
  style?: React.CSSProperties;
  ariaLabel?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = "rectangular",
  width,
  height,
  dark = false,
  contrast = false,
  subtle = false,
  className = "",
  style = {},
  ariaLabel = "Loading content...",
  ...rest
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case "text":
        return "h-3.5 w-full rounded-none my-1";
      case "circular":
        return "rounded-full shrink-0 aspect-square";
      case "pill":
        return "h-6 rounded-none px-3 inline-block";
      case "button":
        return "h-11 sm:h-12 w-full rounded-none";
      case "card":
        return "w-full rounded-none border border-neutral-200/80 bg-white p-4";
      case "rectangular":
      default:
        return "rounded-none";
    }
  };

  const getShimmerClass = () => {
    if (dark) return "skeleton-shimmer-dark";
    if (contrast) return "skeleton-shimmer-contrast";
    if (subtle) return "skeleton-shimmer-subtle";
    return "skeleton-shimmer";
  };

  const inlineStyles: React.CSSProperties = {
    ...(width !== undefined ? { width: typeof width === "number" ? `${width}px` : width } : {}),
    ...(height !== undefined ? { height: typeof height === "number" ? `${height}px` : height } : {}),
    ...style,
  };

  return (
    <div
      role="status"
      aria-busy="true"
      aria-label={ariaLabel}
      className={`${getShimmerClass()} ${getVariantClasses()} ${className}`.trim()}
      style={inlineStyles}
      {...rest}
    >
      <span className="sr-only">{ariaLabel}</span>
    </div>
  );
};

export default Skeleton;
