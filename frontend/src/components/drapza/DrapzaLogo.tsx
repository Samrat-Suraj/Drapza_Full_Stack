"use client";

import React from "react";
import Image from "next/image";

export interface DrapzaLogoProps {
  className?: string;
  showTagline?: boolean;
  showEmblem?: boolean;
  showWordmark?: boolean;
  emblemSize?: number;
  wordmarkClassName?: string;
  taglineClassName?: string;
  theme?: "dark" | "light" | "auto";
  customLogoUrl?: string;
  customLogoDarkUrl?: string;
  customLogoType?: "image" | "hybrid" | "text";
  customLogoText?: string;
  customLogoTagline?: string;
  customLogoWidth?: number;
  customLogoScale?: number;
  customLogoMobileScale?: number;
  customLogoAlignment?: "left" | "center" | "right";
  customLogoOffsetX?: number;
  customLogoOffsetY?: number;
  customLogoGap?: number;
  customLogoLayout?: "horizontal" | "vertical";
  customLogoBorderRadius?: number;
  customLogoOpacity?: number;
  customLogoShadow?: "none" | "subtle" | "medium" | "strong" | "glow";
  customLogoAutoInvertDark?: boolean;
  customLogoWordmarkSize?: number;
  customLogoLetterSpacing?: number;
  customLogoFontWeight?: "normal" | "medium" | "semibold" | "bold" | "black";
  customLogoShowTagline?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}

/**
 * Precision Vector & Hybrid Logo Component for DRAPZA ATELIER
 * Incorporates the 3D folded ribbon 'D' emblem + DRΛPZΛ wordmark + 'WEAR YOUR STORY' tagline
 * Seamlessly integrates live Admin custom website logo and full geometry/typography overrides.
 */
export function DrapzaLogo({
  className = "",
  showTagline = false,
  showEmblem = true,
  showWordmark = true,
  emblemSize = 34,
  wordmarkClassName = "",
  taglineClassName = "",
  theme = "auto",
  customLogoUrl,
  customLogoDarkUrl,
  customLogoType,
  customLogoText,
  customLogoTagline,
  customLogoWidth,
  customLogoScale,
  customLogoMobileScale,
  customLogoAlignment,
  customLogoOffsetX,
  customLogoOffsetY,
  customLogoGap,
  customLogoLayout,
  customLogoBorderRadius,
  customLogoOpacity,
  customLogoShadow,
  customLogoAutoInvertDark,
  customLogoWordmarkSize,
  customLogoLetterSpacing,
  customLogoFontWeight,
  customLogoShowTagline,
  onClick,
}: DrapzaLogoProps) {
  const [siteConfig, setSiteConfig] = React.useState<{
    logoUrl?: string;
    logoDarkUrl?: string;
    logoType?: "image" | "hybrid" | "text";
    logoText?: string;
    logoTagline?: string;
    logoWidth?: number;
    logoScale?: number;
    logoMobileScale?: number;
    logoAlignment?: "left" | "center" | "right";
    logoOffsetX?: number;
    logoOffsetY?: number;
    logoGap?: number;
    logoLayout?: "horizontal" | "vertical";
    logoBorderRadius?: number;
    logoOpacity?: number;
    logoShadow?: "none" | "subtle" | "medium" | "strong" | "glow";
    logoAutoInvertDark?: boolean;
    logoWordmarkSize?: number;
    logoLetterSpacing?: number;
    logoFontWeight?: "normal" | "medium" | "semibold" | "bold" | "black";
    logoShowTagline?: boolean;
  }>({});

  React.useEffect(() => {
    const readCachedConfig = () => {
      try {
        const cached = localStorage.getItem("drapza_site_identity_config");
        if (cached) {
          const parsed = JSON.parse(cached);
          setSiteConfig({
            logoUrl: parsed.logoUrl,
            logoDarkUrl: parsed.logoDarkUrl,
            logoType: parsed.logoType,
            logoText: parsed.logoText,
            logoTagline: parsed.logoTagline,
            logoWidth: parsed.logoWidth,
            logoScale: parsed.logoScale,
            logoMobileScale: parsed.logoMobileScale,
            logoAlignment: parsed.logoAlignment,
            logoOffsetX: parsed.logoOffsetX,
            logoOffsetY: parsed.logoOffsetY,
            logoGap: parsed.logoGap,
            logoLayout: parsed.logoLayout,
            logoBorderRadius: parsed.logoBorderRadius,
            logoOpacity: parsed.logoOpacity,
            logoShadow: parsed.logoShadow,
            logoAutoInvertDark: parsed.logoAutoInvertDark,
            logoWordmarkSize: parsed.logoWordmarkSize,
            logoLetterSpacing: parsed.logoLetterSpacing,
            logoFontWeight: parsed.logoFontWeight,
            logoShowTagline: parsed.logoShowTagline,
          });
        }
      } catch (e) {}
    };

    readCachedConfig();

    const handleUpdate = (e: any) => {
      if (e.detail) {
        setSiteConfig({
          logoUrl: e.detail.logoUrl,
          logoDarkUrl: e.detail.logoDarkUrl,
          logoType: e.detail.logoType,
          logoText: e.detail.logoText,
          logoTagline: e.detail.logoTagline,
          logoWidth: e.detail.logoWidth,
          logoScale: e.detail.logoScale,
          logoMobileScale: e.detail.logoMobileScale,
          logoAlignment: e.detail.logoAlignment,
          logoOffsetX: e.detail.logoOffsetX,
          logoOffsetY: e.detail.logoOffsetY,
          logoGap: e.detail.logoGap,
          logoLayout: e.detail.logoLayout,
          logoBorderRadius: e.detail.logoBorderRadius,
          logoOpacity: e.detail.logoOpacity,
          logoShadow: e.detail.logoShadow,
          logoAutoInvertDark: e.detail.logoAutoInvertDark,
          logoWordmarkSize: e.detail.logoWordmarkSize,
          logoLetterSpacing: e.detail.logoLetterSpacing,
          logoFontWeight: e.detail.logoFontWeight,
          logoShowTagline: e.detail.logoShowTagline,
        });
      } else {
        readCachedConfig();
      }
    };

    window.addEventListener("drapza_site_config_updated", handleUpdate);
    return () => window.removeEventListener("drapza_site_config_updated", handleUpdate);
  }, []);

  const effectiveLogoUrl = customLogoUrl !== undefined ? customLogoUrl : (siteConfig.logoUrl || "");
  const effectiveDarkUrl = customLogoDarkUrl !== undefined ? customLogoDarkUrl : (siteConfig.logoDarkUrl || "");
  const effectiveLogoType = customLogoType !== undefined ? customLogoType : (siteConfig.logoType || "hybrid");
  const effectiveLogoText = customLogoText !== undefined ? customLogoText : (siteConfig.logoText || "DRAPZA");
  const effectiveLogoTagline = customLogoTagline !== undefined ? customLogoTagline : (siteConfig.logoTagline || "WEAR YOUR STORY");
  const effectiveEmblemSize = customLogoWidth !== undefined ? customLogoWidth : (siteConfig.logoWidth || emblemSize || 34);
  const effectiveScale = customLogoScale !== undefined ? customLogoScale : (siteConfig.logoScale ?? 100);
  const effectiveAlignment = customLogoAlignment !== undefined ? customLogoAlignment : (siteConfig.logoAlignment || "left");
  const effectiveOffsetX = customLogoOffsetX !== undefined ? customLogoOffsetX : (siteConfig.logoOffsetX ?? 0);
  const effectiveOffsetY = customLogoOffsetY !== undefined ? customLogoOffsetY : (siteConfig.logoOffsetY ?? 0);
  const effectiveGap = customLogoGap !== undefined ? customLogoGap : (siteConfig.logoGap ?? 10);
  const effectiveLayout = customLogoLayout !== undefined ? customLogoLayout : (siteConfig.logoLayout || "horizontal");
  const effectiveBorderRadius = customLogoBorderRadius !== undefined ? customLogoBorderRadius : (siteConfig.logoBorderRadius ?? 0);
  const effectiveOpacity = customLogoOpacity !== undefined ? customLogoOpacity : (siteConfig.logoOpacity ?? 1);
  const effectiveShadow = customLogoShadow !== undefined ? customLogoShadow : (siteConfig.logoShadow || "subtle");
  const effectiveAutoInvertDark = customLogoAutoInvertDark !== undefined ? customLogoAutoInvertDark : (siteConfig.logoAutoInvertDark ?? false);
  const effectiveWordmarkSize = customLogoWordmarkSize !== undefined ? customLogoWordmarkSize : (siteConfig.logoWordmarkSize ?? 24);
  const effectiveLetterSpacing = customLogoLetterSpacing !== undefined ? customLogoLetterSpacing : (siteConfig.logoLetterSpacing ?? 0.14);
  const effectiveFontWeight = customLogoFontWeight !== undefined ? customLogoFontWeight : (siteConfig.logoFontWeight || "bold");
  const effectiveShowTagline = customLogoShowTagline !== undefined ? customLogoShowTagline : (siteConfig.logoShowTagline ?? false);

  const isDark = theme === "dark";
  const isLight = theme === "light";

  const textColorClass = isLight
    ? "text-white"
    : isDark
    ? "text-black"
    : "text-current";

  // Filter calculation for shadow & dark inversion
  const getFilterStyle = () => {
    let parts: string[] = [];
    if (isLight && effectiveAutoInvertDark) {
      parts.push("invert(1)");
    }
    switch (effectiveShadow) {
      case "none":
        break;
      case "medium":
        parts.push("drop-shadow(0 4px 6px rgba(0,0,0,0.28))");
        break;
      case "strong":
        parts.push("drop-shadow(0 8px 16px rgba(0,0,0,0.45))");
        break;
      case "glow":
        parts.push(isLight ? "drop-shadow(0 0 10px rgba(255,255,255,0.7))" : "drop-shadow(0 0 8px rgba(0,0,0,0.35))");
        break;
      case "subtle":
      default:
        parts.push("drop-shadow(0 1px 2px rgba(0,0,0,0.18))");
        break;
    }
    return parts.length > 0 ? parts.join(" ") : undefined;
  };

  const imageFilter = getFilterStyle();

  // Pick emblem image source (dark variant if on dark header, else primary logo or default)
  const emblemSrc = (isLight && effectiveDarkUrl)
    ? effectiveDarkUrl
    : (effectiveLogoUrl || (isLight ? "/images/drapza/logo-icon-light.png" : "/images/drapza/logo-icon.png"));

  const transformOrigin =
    effectiveAlignment === "center"
      ? "center center"
      : effectiveAlignment === "right"
      ? "right center"
      : "left center";

  const containerStyle: React.CSSProperties = {
    transform: `translate(${effectiveOffsetX}px, ${effectiveOffsetY}px) scale(${effectiveScale / 100})`,
    transformOrigin,
    opacity: effectiveOpacity,
    gap: `${effectiveGap}px`,
    transition: "transform 0.15s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.15s ease-out",
  };

  const wordmarkStyle: React.CSSProperties = {
    fontSize: `${effectiveWordmarkSize}px`,
    letterSpacing: `${effectiveLetterSpacing}em`,
    fontWeight:
      effectiveFontWeight === "black"
        ? 900
        : effectiveFontWeight === "bold"
        ? 700
        : effectiveFontWeight === "semibold"
        ? 600
        : effectiveFontWeight === "medium"
        ? 500
        : 400,
  };

  const isVertical = effectiveLayout === "vertical";
  const shouldRenderTagline = showTagline || effectiveShowTagline;

  // Mode 1: Pure Image Logo
  if (effectiveLogoType === "image" && effectiveLogoUrl) {
    return (
      <div
        onClick={onClick}
        style={containerStyle}
        className={`select-none ${isVertical ? "flex flex-col items-center justify-center text-center" : "inline-flex items-center"} ${className}`}
      >
        <img
          src={emblemSrc}
          alt={effectiveLogoText || "Brand Logo"}
          style={{
            height: `${effectiveEmblemSize}px`,
            maxHeight: "96px",
            width: "auto",
            borderRadius: `${effectiveBorderRadius}px`,
            filter: imageFilter,
          }}
          className="object-contain transition-transform hover:scale-105"
        />
        {shouldRenderTagline && effectiveLogoTagline && (
          <span
            className={`font-mono-technical text-[8px] sm:text-[9.5px] uppercase tracking-[0.38em] ${
              isDark ? "text-neutral-800 font-semibold" : isLight ? "text-neutral-300 font-medium" : "text-neutral-700 font-semibold"
            } pt-1 ${taglineClassName}`}
          >
            {effectiveLogoTagline}
          </span>
        )}
      </div>
    );
  }

  // Mode 2: Pure Typographic Wordmark
  if (effectiveLogoType === "text") {
    return (
      <div
        onClick={onClick}
        style={containerStyle}
        className={`select-none ${isVertical ? "flex flex-col items-center justify-center text-center" : "inline-flex items-center"} ${className}`}
      >
        <div className={`flex flex-col ${isVertical ? "items-center text-center" : "justify-center"}`}>
          <span
            style={wordmarkStyle}
            className={`font-display uppercase leading-none ${textColorClass} ${wordmarkClassName}`}
          >
            {effectiveLogoText}
          </span>
          {shouldRenderTagline && effectiveLogoTagline && (
            <span
              className={`font-mono-technical text-[8px] sm:text-[9.5px] uppercase tracking-[0.38em] ${
                isDark ? "text-neutral-800 font-semibold" : isLight ? "text-neutral-300 font-medium" : "text-neutral-700 font-semibold"
              } pt-1 ${taglineClassName}`}
            >
              {effectiveLogoTagline}
            </span>
          )}
        </div>
      </div>
    );
  }

  // Mode 3: Hybrid (Architectural Emblem + Wordmark + Tagline)
  const isDefaultDrapzaWordmark = effectiveLogoText.toUpperCase() === "DRAPZA";

  return (
    <div
      suppressHydrationWarning
      onClick={onClick}
      style={containerStyle}
      className={`select-none ${isVertical ? "flex flex-col items-center justify-center text-center" : "inline-flex items-center"} ${className}`}
    >
      {/* 3D Folded Architectural / Custom Emblem */}
      {showEmblem && (
        <div
          suppressHydrationWarning
          className="relative shrink-0 flex items-center justify-center transition-transform hover:scale-105"
          style={{ width: effectiveEmblemSize, height: effectiveEmblemSize }}
        >
          <img
            src={emblemSrc}
            alt={`${effectiveLogoText} Emblem`}
            style={{
              borderRadius: `${effectiveBorderRadius}px`,
              filter: imageFilter,
            }}
            className="w-full h-full object-contain"
          />
        </div>
      )}

      {/* Typography: Wordmark + Optional Tagline */}
      {(showWordmark || shouldRenderTagline) && (
        <div className={`flex flex-col ${isVertical ? "items-center text-center" : "justify-center"}`}>
          {showWordmark && (
            <span
              style={wordmarkStyle}
              className={`font-display uppercase leading-none ${textColorClass} ${wordmarkClassName}`}
            >
              {isDefaultDrapzaWordmark ? (
                <>
                  DR<span className="inline-block tracking-[0.08em]">Λ</span>PZ<span className="inline-block tracking-[0.08em]">Λ</span>
                </>
              ) : (
                effectiveLogoText
              )}
            </span>
          )}
          {shouldRenderTagline && (
            <span
              className={`font-mono-technical text-[8px] sm:text-[9.5px] uppercase tracking-[0.38em] ${
                isDark ? "text-neutral-800 font-semibold" : isLight ? "text-neutral-300 font-medium" : "text-neutral-700 font-semibold"
              } pt-1 ${taglineClassName}`}
            >
              {effectiveLogoTagline}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Pure SVG D-Emblem for ultra-lightweight vector iconography (Favicon, Badges, Watermarks)
 */
export function DrapzaRibbonD({
  className = "w-8 h-8",
  color = "currentColor",
}: {
  className?: string;
  color?: string;
}) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="drapza_ribbon_grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1a1a1a" />
          <stop offset="50%" stopColor="#4a4a4a" />
          <stop offset="100%" stopColor="#0d0d0d" />
        </linearGradient>
        <linearGradient id="drapza_ribbon_grad2" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#666666" />
          <stop offset="60%" stopColor="#2b2b2b" />
          <stop offset="100%" stopColor="#0a0a0a" />
        </linearGradient>
        <linearGradient id="drapza_ribbon_facet" x1="0%" y1="50%" x2="100%" y2="50%">
          <stop offset="0%" stopColor="#777777" />
          <stop offset="100%" stopColor="#333333" />
        </linearGradient>
      </defs>

      {/* Top Sweep / Header Ribbon */}
      <path
        d="M 28 20 L 58 20 C 74 20 84 32 84 48 C 84 64 74 76 56 76 L 36 76 C 30 76 26 71 28 64 L 38 40 L 48 40 L 40 60 C 39 63 41 65 44 65 L 56 65 C 67 65 72 57 72 48 C 72 38 66 31 56 31 L 36 31 Z"
        fill="url(#drapza_ribbon_grad1)"
      />
      {/* Chamfered 3D Fold Facet */}
      <path
        d="M 28 64 L 44 38 L 48 40 L 36 76 C 30 76 26 71 28 64 Z"
        fill="url(#drapza_ribbon_facet)"
        opacity="0.9"
      />
      {/* Front Outer Arch */}
      <path
        d="M 58 20 C 76 20 86 33 86 48 C 86 63 76 76 56 76 L 50 76 C 68 74 76 62 76 48 C 76 34 68 22 50 22 Z"
        fill="url(#drapza_ribbon_grad2)"
      />
    </svg>
  );
}
