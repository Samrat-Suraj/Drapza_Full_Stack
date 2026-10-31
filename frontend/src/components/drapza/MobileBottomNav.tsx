"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import gsap from "gsap";
import { useCart } from "../../context/CartContext";
import { whatsAppApi } from "../../lib/api";
import { audioSystem } from "./AudioSystem";

type NavTabItem = {
  id: string;
  label: string;
  href?: string;
  action?: () => void;
  icon: (isActive: boolean) => React.ReactNode;
};

export function MobileBottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { itemCount, toggleCart } = useCart();
  const navContainerRef = useRef<HTMLDivElement>(null);
  const circleRef = useRef<HTMLDivElement>(null);

  // Measure container dimensions dynamically
  const [containerWidth, setContainerWidth] = useState(360);

  // WhatsApp dynamic config from CMS
  const [waPhone, setWaPhone] = useState("918888333038");
  const [waMessage, setWaMessage] = useState("");

  useEffect(() => {
    whatsAppApi
      .getConfig()
      .then((res) => {
        const data = res?.data || res;
        if (data?.phoneNumber) setWaPhone(data.phoneNumber);
        if (data?.prefilledMessage) setWaMessage(data.prefilledMessage);
      })
      .catch(() => { });
  }, []);

  const tabs: NavTabItem[] = [
    {
      id: "home",
      label: "Home",
      href: "/",
      icon: (isActive: boolean) => (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={isActive ? "2.3" : "1.85"}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 10.5L12 3l9 7.5V20a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 20v-9.5z" />
          <path d="M9 21v-6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v6" />
        </svg>
      ),
    },
    {
      id: "whatsapp",
      label: "WhatsApp",
      action: () => {
        const cleanPhone = (waPhone || "918888333038").replace(/[^0-9]/g, "");
        const msg = waMessage ? `?text=${encodeURIComponent(waMessage)}` : "";
        window.open(`https://wa.me/${cleanPhone}${msg}`, "_blank");
      },
      icon: (isActive: boolean) => (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="currentColor"
          className={isActive ? "text-[#25D366]" : "text-inherit"}
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      ),
    },
    {
      id: "search",
      label: "Search",
      href: "/wardrobe",
      icon: (isActive: boolean) => (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={isActive ? "2.4" : "1.9"}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="7.5" />
          <line x1="16.5" y1="16.5" x2="22" y2="22" />
        </svg>
      ),
    },
    {
      id: "bag",
      label: "Bag",
      action: () => {
        toggleCart();
      },
      icon: (isActive: boolean) => (
        <div className="relative flex items-center justify-center">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={isActive ? "2.3" : "1.85"}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 0 1-8 0" />
          </svg>
          {itemCount > 0 && (
            <span
              className="absolute -top-1.5 -right-2 min-w-[16px] h-[16px] px-1 rounded-full bg-[#111111] text-white text-[9px] font-bold font-sans flex items-center justify-center shadow-xs"
              style={{ lineHeight: 1 }}
            >
              {itemCount}
            </span>
          )}
        </div>
      ),
    },
    {
      id: "profile",
      label: "Profile",
      href: "/profile",
      icon: (isActive: boolean) => (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={isActive ? "2.3" : "1.85"}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="7" r="4" />
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        </svg>
      ),
    },
  ];

  // Determine active tab index from current route
  const getInitialActiveIndex = useCallback(() => {
    if (!pathname) return 0;
    if (pathname === "/") return 0;
    if (pathname.startsWith("/wardrobe")) return 2;
    if (
      pathname.startsWith("/profile") ||
      pathname === "/login" ||
      pathname === "/signup"
    )
      return 4;
    return 0;
  }, [pathname]);

  const [activeIndex, setActiveIndex] = useState<number>(getInitialActiveIndex);

  // Sync route changes
  useEffect(() => {
    setActiveIndex(getInitialActiveIndex());
  }, [pathname, getInitialActiveIndex]);

  // Width measurement
  useEffect(() => {
    const updateWidth = () => {
      if (navContainerRef.current) {
        const measured = navContainerRef.current.clientWidth;
        if (measured > 0) {
          setContainerWidth(measured);
        }
      }
    };

    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  // Geometry parameters: clean, balanced pill dimensions with no text
  const H = 62; // Height of the sleek icon-only navbar
  const R = 31; // Semi-circular rounded pill caps (H / 2)
  const w = 28; // Half-width of the scooped notch
  const d = 18; // Depth of the scooped notch
  const c1 = 15;
  const c2 = 13;

  // Calculate tab centers with comfortable, generous spacing across container width
  const getTabCenter = useCallback(
    (idx: number, totalW: number) => {
      const edgeMargin = Math.max(38, Math.min(50, totalW * 0.11));
      const usableWidth = totalW - edgeMargin * 2;
      return edgeMargin + (idx * usableWidth) / 4;
    },
    []
  );

  // Smooth position animation using GSAP
  const posRef = useRef({ x: getTabCenter(activeIndex, containerWidth) });
  const [animatedX, setAnimatedX] = useState(() =>
    getTabCenter(activeIndex, containerWidth)
  );

  useEffect(() => {
    const targetX = getTabCenter(activeIndex, containerWidth);

    gsap.to(posRef.current, {
      x: targetX,
      duration: 0.35,
      ease: "power3.out",
      onUpdate: () => {
        setAnimatedX(posRef.current.x);
      },
    });

    if (circleRef.current) {
      gsap.fromTo(
        circleRef.current,
        { scale: 0.8 },
        { scale: 1, duration: 0.32, ease: "back.out(2)" }
      );
    }
  }, [activeIndex, containerWidth, getTabCenter]);

  // Generate SVG path for the scooped notched background
  const pathD = React.useMemo(() => {
    const X = animatedX;
    const xLeft = X - w;
    const xRight = X + w;

    return [
      `M 0,${R}`,
      `A ${R},${R} 0 0,1 ${R},0`,
      `L ${xLeft},0`,
      `C ${xLeft + c1},0 ${X - c2},${d} ${X},${d}`,
      `C ${X + c2},${d} ${xRight - c1},0 ${xRight},0`,
      `L ${containerWidth - R},0`,
      `A ${R},${R} 0 0,1 ${containerWidth},${R}`,
      `L ${containerWidth},${H - R}`,
      `A ${R},${R} 0 0,1 ${containerWidth - R},${H}`,
      `L ${R},${H}`,
      `A ${R},${R} 0 0,1 0,${H - R}`,
      "Z",
    ].join(" ");
  }, [animatedX, containerWidth, H, R, w, d, c1, c2]);

  const handleTabClick = (index: number) => {
    try {
      audioSystem.playClick(650);
    } catch (_) { }

    setActiveIndex(index);
    const tab = tabs[index];
    if (tab.action) {
      tab.action();
    } else if (tab.href) {
      router.push(tab.href);
    }
  };

  const activeTab = tabs[activeIndex] || tabs[0];

  // Do not render bottom nav on profile page (mobile profile page has its own dedicated vertical dock)
  if (pathname?.startsWith("/profile")) {
    return null;
  }

  return (
    <nav
      ref={navContainerRef}
      aria-label="Mobile Bottom Navigation"
      className="fixed bottom-[max(1.15rem,env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-[400px] md:hidden pointer-events-auto select-none"
      style={{
        height: `${H}px`,
        filter: "drop-shadow(0 12px 30px rgba(0, 0, 0, 0.10))",
      }}
    >
      {/* 1. Curved Scoop SVG Background */}
      <svg
        width={containerWidth}
        height={H}
        viewBox={`0 0 ${containerWidth} ${H}`}
        className="absolute inset-0 pointer-events-none"
        fill="none"
        style={{ willChange: "contents" }}
      >
        <path
          d={pathD}
          fill="#ffffff"
          stroke="#e2e6de"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>

      {/* 2. Elevated Floating Circle for Active Tab */}
      <div
        ref={circleRef}
        aria-hidden="true"
        className="absolute pointer-events-none z-20 flex items-center justify-center rounded-full bg-white border border-[#e2e6de] shadow-[0_8px_24px_rgba(0,0,0,0.12),0_2px_6px_rgba(0,0,0,0.05)]"
        style={{
          width: "52px",
          height: "52px",
          top: "-18px",
          left: 0,
          transform: `translateX(${animatedX - 26}px)`,
          willChange: "transform",
        }}
      >
        <span className="text-[#111111] transition-transform duration-200 flex items-center justify-center">
          {activeTab.icon(true)}
        </span>
      </div>

      {/* 3. Spacious Icon Tab Buttons (Clean, Icon-Only, No Text) */}
      <div className="relative w-full h-full flex items-center">
        {tabs.map((tab, idx) => {
          const isActive = idx === activeIndex;
          const centerX = getTabCenter(idx, containerWidth);

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabClick(idx)}
              className="absolute top-0 bottom-0 flex items-center justify-center cursor-pointer transition-opacity active:opacity-60 focus:outline-hidden"
              style={{
                width: "56px",
                left: `${centerX - 28}px`,
              }}
              aria-label={tab.label}
              title={tab.label}
              aria-selected={isActive}
              role="tab"
            >
              {/* Inactive Icon with generous sizing and smooth hover/active transition */}
              <div
                className={`flex items-center justify-center transition-all duration-200 ${
                  isActive
                    ? "opacity-0 scale-75 pointer-events-none"
                    : "opacity-100 scale-100 text-[#71717a] hover:text-[#111111]"
                }`}
              >
                <span className="flex items-center justify-center text-inherit">
                  {tab.icon(false)}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export default MobileBottomNav;
