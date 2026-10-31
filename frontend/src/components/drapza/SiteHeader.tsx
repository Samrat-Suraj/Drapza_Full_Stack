"use client";

import { useState, useRef, useEffect } from "react";
import gsap from "gsap";
import { audioSystem } from "./AudioSystem";
import { useRouter, usePathname } from "next/navigation";
import {
  ShoppingBag,
  Crown,
  LogOut,
  User,
  Camera,
  Scan,
  Search,
  X,
  ArrowRight,
  ArrowUpRight,
  ShieldCheck,
  Package,
  MapPin,
  Lock,
  Heart,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { userApi } from "@/lib/api";
import { useUserProfileQuery, useAuthCacheActions } from "@/lib/react-query";
import { VisualSearchModal } from "./VisualSearchModal";
import { useLockBodyScroll } from "./useLockBodyScroll";
import { ConfirmModal } from "./ConfirmModal";
import { DrapzaLogo } from "./DrapzaLogo";

const primaryLinks = [
  { num: "01", label: "HOME ARCHIVE", href: "/" },
  { num: "02", label: "ALL GARMENTS", href: "/wardrobe" },
  { num: "03", label: "CLIENT PROFILE", href: "/profile" },

  { num: "04", label: "VIP MEMBERSHIP CLUB", href: "/membership" },
  { num: "05", label: "CHECKOUT DESK", href: "/checkout" },
  { num: "06", label: "TRACK SHIPMENT", href: "/track" },
  { num: "07", label: "VIP CONCIERGE", href: "/support" },
];

const secondaryLinks = [
  { label: "KURTI & SAREE", href: "/wardrobe?category=Kurti" },
  { label: "JEANS & PALAZZO", href: "/wardrobe?category=Jeans" },
  { label: "LEGGINGS & TOPS", href: "/wardrobe?category=Tops" },
  { label: "CO-ORD & DUPATTA", href: "/wardrobe?category=Co-ord%20Set" },
  { label: "SHARARA & LEHENGA", href: "/wardrobe?category=Sharara/Lehenga" },
  { label: "INTIMATES (BRA & PANTIES)", href: "/wardrobe?category=Bra" },
];

const socials = [
  { label: "INSTAGRAM", href: "https://www.instagram.com" },
  { label: "FACEBOOK", href: "https://www.facebook.com" },
  { label: "YOUTUBE", href: "https://www.youtube.com" },
];

export interface HeaderProps {
  initialUser?: any;
}

export function SiteHeader({ initialUser }: HeaderProps = {}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [headerVisible, setHeaderVisible] = useState(true);
  const [visualSearchOpen, setVisualSearchOpen] = useState(false);
  const [searchInitialTab, setSearchInitialTab] = useState<"text" | "upload">("text");

  const router = useRouter();
  const pathname = usePathname();
  const { data: cachedUser } = useUserProfileQuery({ initialData: initialUser });
  const { clearProfile } = useAuthCacheActions();
  const [currentUser, setCurrentUser] = useState<any>(initialUser || null);

  // Sync client-side auth state with localStorage on mount (prevents SSR hydration mismatch)
  useEffect(() => {
    if (initialUser) {
      try {
        localStorage.setItem("drapza_user", JSON.stringify(initialUser));
      } catch (e) {}
    } else {
      try {
        const stored = localStorage.getItem("drapza_user");
        if (stored) {
          setCurrentUser(JSON.parse(stored));
        }
      } catch (e) {}
    }
  }, [initialUser]);

  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [terminatedModal, setTerminatedModal] = useState<{ isOpen: boolean; message: string }>({
    isOpen: false,
    message: "",
  });
  const { itemCount, toggleCart } = useCart();
  const { wishlistCount, toggleWishlistDrawer } = useWishlist();

  // Sync cached user profile from React Query
  useEffect(() => {
    if (cachedUser !== undefined) {
      setCurrentUser(cachedUser);
    }
  }, [cachedUser]);

  // Sync auth state changes across components and storage
  useEffect(() => {
    const handleAuthChange = (e: any) => {
      if (e.detail !== undefined) {
        setCurrentUser(e.detail);
      }
    };
    window.addEventListener("drapza_auth_state_changed", handleAuthChange);
    return () => window.removeEventListener("drapza_auth_state_changed", handleAuthChange);
  }, []);

  useEffect(() => {
    setSoundEnabled(audioSystem.enabled);
    const handleAudioToggle = (e: any) => {
      if (e.detail?.enabled !== undefined) {
        setSoundEnabled(e.detail.enabled);
      }
    };
    window.addEventListener("drapza:audio-toggle", handleAudioToggle);
    return () => window.removeEventListener("drapza:audio-toggle", handleAudioToggle);
  }, []);

  // Track last visited non-admin route for instant redirect and close open mobile navigation
  useEffect(() => {
    setMenuOpen(false);
    if (pathname && !pathname.startsWith("/admin")) {
      try {
        sessionStorage.setItem("drapza_last_route", pathname);
      } catch (e) {}
    }
  }, [pathname]);

  // Handle administrator session termination
  useEffect(() => {
    let isMounted = true;
    const handleTerminated = (e: any) => {
      if (isMounted) {
        clearProfile();
        setCurrentUser(null);
        const msg = e.detail?.message || "Your active session has been terminated by an administrator. Please log in again to continue.";
        setTerminatedModal({ isOpen: true, message: msg });
      }
    };

    window.addEventListener("drapza_session_terminated", handleTerminated);

    return () => {
      isMounted = false;
      window.removeEventListener("drapza_session_terminated", handleTerminated);
    };
  }, [clearProfile]);

  // Listen to site identity updates for logo alignment
  const [logoAlignment, setLogoAlignment] = useState<"left" | "center" | "right">("left");
  useEffect(() => {
    const readCached = () => {
      try {
        const cached = localStorage.getItem("drapza_site_identity_config");
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed.logoAlignment) setLogoAlignment(parsed.logoAlignment);
        }
      } catch (e) {}
    };
    readCached();
    const handleUpdate = (e: any) => {
      if (e.detail?.logoAlignment) setLogoAlignment(e.detail.logoAlignment);
      else readCached();
    };
    window.addEventListener("drapza_site_config_updated", handleUpdate);
    return () => window.removeEventListener("drapza_site_config_updated", handleUpdate);
  }, []);

  const containerRef = useRef<HTMLDivElement>(null);
  const menuWrapperRef = useRef<HTMLDivElement>(null);
  const lineTopRef = useRef<SVGLineElement>(null);
  const lineBottomRef = useRef<SVGLineElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const lastScrollY = useRef(0);

  // Scroll direction listener: hides header when scrolling down, shows when scrolling up
  useEffect(() => {
    const handleScroll = () => {
      if (menuOpen) {
        setHeaderVisible(true);
        return;
      }

      const currentScrollY = window.scrollY;

      if (currentScrollY <= 40) {
        setHeaderVisible(true);
      } else if (currentScrollY > lastScrollY.current + 8) {
        setHeaderVisible(false);
      } else if (currentScrollY < lastScrollY.current - 8) {
        setHeaderVisible(true);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [menuOpen]);

  // Set initial hamburger position (=) on mount
  useEffect(() => {
    if (lineTopRef.current && lineBottomRef.current) {
      gsap.set(lineTopRef.current, { y: -3.5, rotate: 0, transformOrigin: "12px 12px" });
      gsap.set(lineBottomRef.current, { y: 3.5, rotate: 0, transformOrigin: "12px 12px" });
    }
  }, []);

  // Lock body scroll and pause Lenis when menu is open
  useLockBodyScroll(menuOpen);

  // Master GSAP Timeline construction & management
  useEffect(() => {
    if (!menuOpen || !containerRef.current || !menuWrapperRef.current) return;

    const ctx = gsap.context(() => {
      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

      // Master Timeline
      const tl = gsap.timeline({
        paused: true,
        onStart: () => setIsAnimating(true),
        onComplete: () => setIsAnimating(false),
        onReverseComplete: () => {
          setIsAnimating(false);
          setMenuOpen(false);
        },
      });

      timelineRef.current = tl;

      if (prefersReducedMotion) {
        tl.set(menuWrapperRef.current, { height: "auto", opacity: 1 });
        if (lineTopRef.current && lineBottomRef.current) {
          tl.set(lineTopRef.current, { rotate: 45, y: 0, transformOrigin: "12px 12px" });
          tl.set(lineBottomRef.current, { rotate: -45, y: 0, transformOrigin: "12px 12px" });
        }
        tl.play();
        return;
      }

      // PHASE 1: Icon Morph (Hamburger '=' to Perfect 'X')
      if (lineTopRef.current && lineBottomRef.current) {
        tl.fromTo(
          lineTopRef.current,
          { y: -3.5, rotate: 0 },
          {
            y: 0,
            rotate: 45,
            transformOrigin: "12px 12px",
            duration: 0.4,
            ease: "power3.inOut",
          },
          0
        );
        tl.fromTo(
          lineBottomRef.current,
          { y: 3.5, rotate: 0 },
          {
            y: 0,
            rotate: -45,
            transformOrigin: "12px 12px",
            duration: 0.4,
            ease: "power3.inOut",
          },
          0
        );
      }

      // PHASE 2: Overlay Expansion (height + clipPath reveal)
      tl.fromTo(
        menuWrapperRef.current,
        {
          height: 0,
          opacity: 0,
          clipPath: "inset(0% 0% 100% 0%)",
        },
        {
          height: "auto",
          opacity: 1,
          clipPath: "inset(0% 0% 0% 0%)",
          duration: 0.5,
          ease: "power3.inOut",
        },
        0
      );

      // PHASE 3: Top Labels Fade Up ("ROOT", "SUBROUTINE")
      tl.fromTo(
        ".menu-label",
        {
          opacity: 0,
          y: 10,
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.35,
          stagger: 0.05,
          ease: "power3.out",
        },
        "-=0.25"
      );

      // PHASE 4: Left Side Large Navigation Text Masked Reveal
      tl.fromTo(
        ".menu-primary-text",
        {
          yPercent: 110,
          opacity: 0,
        },
        {
          yPercent: 0,
          opacity: 1,
          duration: 0.45,
          stagger: 0.06,
          ease: "power3.out",
        },
        "-=0.3"
      );

      // PHASE 5: Right Side Secondary Navigation Text Masked Reveal
      tl.fromTo(
        ".menu-secondary-text",
        {
          yPercent: 110,
          opacity: 0,
        },
        {
          yPercent: 0,
          opacity: 1,
          duration: 0.4,
          stagger: 0.05,
          ease: "power3.out",
        },
        "-=0.35"
      );

      // PHASE 6: Divider Lines Scale Reveal
      tl.fromTo(
        ".menu-divider",
        {
          scaleX: 0,
          transformOrigin: "left center",
        },
        {
          scaleX: 1,
          duration: 0.4,
          stagger: 0.05,
          ease: "power3.inOut",
        },
        "-=0.35"
      );

      // PHASE 7: Bottom Social Links Reveal
      tl.fromTo(
        ".menu-social-text",
        {
          opacity: 0,
          y: 12,
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.35,
          stagger: 0.04,
          ease: "power3.out",
        },
        "-=0.25"
      );

      // Play forward upon initialization
      tl.play();
    }, containerRef);

    return () => {
      ctx.revert();
    };
  }, [menuOpen]);

  const toggleMenu = () => {
    if (isAnimating) return;

    if (!menuOpen) {
      setMenuOpen(true);
    } else if (timelineRef.current) {
      timelineRef.current.reverse();
    } else {
      setMenuOpen(false);
    }
  };

  const handleNavigate = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    audioSystem.playClick(650);

    // Smoothly close the menu
    if (menuOpen && !isAnimating && timelineRef.current) {
      timelineRef.current.reverse();
    } else {
      setMenuOpen(false);
    }

    // Handle external links
    if (href.startsWith("http")) {
      window.open(href, "_blank", "noopener,noreferrer");
      return;
    }

    // Handle route navigation vs hash scrolling
    if (!href.includes("#")) {
      router.push(href);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // Handle Hash Anchor links (e.g. /#lookbook, /#products, /#about, /#footer)
    const hashTarget = href.replace(/^\/?#/, "");
    if (hashTarget) {
      if (pathname === "/") {
        const elem = document.getElementById(hashTarget);
        if (elem) {
          elem.scrollIntoView({ behavior: "smooth" });
        }
      } else {
        router.push("/");
        setTimeout(() => {
          const elem = document.getElementById(hashTarget);
          if (elem) {
            elem.scrollIntoView({ behavior: "smooth" });
          }
        }, 350);
      }
    }
  };

  const handleLogout = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    audioSystem.playClick(450, 0.05);
    try {
      await userApi.logout();
    } catch (err) {
      console.error("Logout error:", err);
    }
    clearProfile();
    setCurrentUser(null);
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("drapza_user");
        window.dispatchEvent(new CustomEvent("drapza_auth_state_changed", { detail: null }));
      } catch (e) {}
    }
    if (menuOpen && timelineRef.current) {
      timelineRef.current.reverse();
    } else {
      setMenuOpen(false);
    }
    router.push("/login");
  };

  return (
    <header
      suppressHydrationWarning
      className={`fixed top-0 left-0 right-0 z-50 px-3 pt-2.5 sm:px-6 sm:pt-3 md:px-10 md:pt-4 transition-transform duration-500 ease-in-out ${
        headerVisible ? "translate-y-0" : "-translate-y-[150%]"
      }`}
    >
      <div className="mx-auto max-w-[1800px]">
        <div
          ref={containerRef}
          className="overflow-hidden rounded-[6px] bg-base-700 text-base-100 shadow-2xl transition-shadow duration-300 border border-white/10"
        >
          {/* Top Bar */}
          <div suppressHydrationWarning className="relative flex items-center justify-between px-3.5 py-2 sm:px-7 sm:py-3">
            <div
              className={`flex items-center gap-3 sm:gap-6 shrink-0 transition-all ${
                logoAlignment === "center"
                  ? "md:absolute md:left-1/2 md:-translate-x-1/2 md:z-20 pointer-events-auto"
                  : logoAlignment === "right"
                  ? "md:order-2"
                  : ""
              }`}
            >
              <a
                href="/"
                onClick={(e) => handleNavigate(e, "/")}
                className="block cursor-pointer group"
                aria-label="DRAPZA Home"
              >
                <DrapzaLogo
                  theme="light"
                  emblemSize={25}
                  showTagline={false}
                  wordmarkClassName="text-white group-hover:opacity-90 transition-opacity"
                />
              </a>
            </div>

            <div className="flex items-center gap-1 sm:gap-2 md:gap-2.5 shrink-0">
              {/* Product Text Search Button (Desktop & Tablet) */}
              <button
                type="button"
                onClick={() => {
                  audioSystem.playClick(750);
                  router.push("/wardrobe");
                }}
                className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] border border-white/15 hover:border-white/40 bg-white/5 hover:bg-white/10 font-mono-technical text-xs uppercase tracking-wider text-neutral-200 hover:text-white transition-all cursor-pointer shadow-sm group"
                aria-label="Browse Wardrobe Collection"
                title="Browse Wardrobe Collection"
              >
                <Search className="w-3.5 h-3.5 group-hover:scale-110 transition-transform text-neutral-200 group-hover:text-white" />
                <span>SEARCH</span>
              </button>

              {/* Visual AI Search Button (Desktop & Tablet) */}
              <button
                onClick={() => {
                  audioSystem.playClick(750);
                  setSearchInitialTab("upload");
                  setVisualSearchOpen(true);
                }}
                className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] border border-white/15 hover:border-white/40 bg-white/5 hover:bg-white/10 text-neutral-200 hover:text-white font-mono-technical text-xs uppercase tracking-wider transition-all cursor-pointer shadow-sm group"
                aria-label="Search clothes by image using AI Visual Lens"
                title="Search Clothes by Image • AI Visual Lens"
              >
                <Camera className="w-3.5 h-3.5 group-hover:scale-110 transition-transform text-neutral-300 group-hover:text-white" />
                <span>AI LENS</span>
              </button>

              {/* Wishlist Button with Counter (Desktop & Tablet) */}
              <button
                onClick={() => {
                  audioSystem.playClick(650);
                  toggleWishlistDrawer();
                }}
                className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] border border-white/15 hover:border-white/40 bg-white/5 hover:bg-white/10 font-mono-technical text-xs uppercase tracking-wider text-neutral-200 hover:text-white transition-all cursor-pointer shadow-sm group"
                aria-label={`Open wishlist, ${wishlistCount} saved garments`}
                title="Saved Garments • Wishlist"
              >
                <Heart className={`w-3.5 h-3.5 group-hover:scale-110 transition-transform ${wishlistCount > 0 ? "fill-white text-white" : "text-neutral-300 group-hover:text-white"}`} />
                <span>WISHLIST</span>
                {wishlistCount > 0 && (
                  <span className="inline-flex items-center justify-center h-4.5 min-w-[18px] px-1 rounded-[3px] bg-white text-black text-[10px] font-bold font-mono-technical shadow-sm">
                    {wishlistCount}
                  </span>
                )}
              </button>

              {/* Sound Toggle (Tactile Audio Mute/Unmute) */}
              <button
                onClick={() => {
                  const newState = audioSystem.toggle();
                  setSoundEnabled(newState);
                }}
                className={`inline-flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-[4px] border font-mono-technical text-xs uppercase tracking-wider transition-all cursor-pointer shadow-sm group ${
                  soundEnabled
                    ? "border-white/15 hover:border-white/40 bg-white/5 hover:bg-white/10 text-neutral-200 hover:text-white"
                    : "border-red-500/30 bg-red-500/10 text-red-300 hover:text-white hover:border-red-500/60"
                }`}
                aria-label={soundEnabled ? "Mute interactive tactical sound effects" : "Enable interactive sound effects"}
                title={soundEnabled ? "Sound ON • Click to Mute" : "Sound MUTED • Click to Enable"}
              >
                {soundEnabled ? (
                  <Volume2 className="w-3.5 h-3.5 group-hover:scale-110 transition-transform text-neutral-300 group-hover:text-white" />
                ) : (
                  <VolumeX className="w-3.5 h-3.5 group-hover:scale-110 transition-transform text-red-400 group-hover:text-red-200" />
                )}
                <span className="hidden xl:inline text-[10px]">{soundEnabled ? "SFX" : "MUTED"}</span>
              </button>

              {/* Shopping Bag Button (Desktop & Tablet) */}
              <button
                id="header-bag-button"
                onClick={() => {
                  audioSystem.playClick(600);
                  toggleCart();
                }}
                className="hidden md:inline-flex items-center gap-2 px-3 py-1.5 rounded-[4px] border border-white/15 hover:border-white/40 bg-white/5 hover:bg-white/10 font-mono-technical text-xs uppercase tracking-wider text-neutral-200 hover:text-white transition-all cursor-pointer shadow-sm group"
                aria-label={`Open shopping bag, ${itemCount} items`}
                title="Open Shopping Bag"
              >
                <ShoppingBag className="w-3.5 h-3.5 group-hover:scale-110 transition-transform text-neutral-300 group-hover:text-white" />
                <span className="hidden lg:inline">BAG</span>
                <span className="inline-flex items-center justify-center h-4.5 min-w-[20px] px-1.5 rounded-[3px] bg-white text-black text-[10px] font-bold font-mono-technical shadow-sm">
                  {itemCount}
                </span>
              </button>

              <div suppressHydrationWarning className="inline-flex items-center">
                {currentUser ? (
                  <div className="flex items-center gap-1 sm:gap-2">
                    <a
                      href="/profile"
                      onClick={(e) => handleNavigate(e, "/profile")}
                      className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] border border-white/20 hover:border-white/50 bg-white/10 text-white font-mono-technical text-xs uppercase tracking-wider transition-all cursor-pointer shadow-sm group"
                      aria-label={`Open profile for ${currentUser.name || "User"}`}
                      title="Open My Profile & Orders"
                    >
                      <User className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                      <span className="hidden xs:inline">[ME]</span>
                      <span className="max-w-[45px] sm:max-w-[100px] truncate font-bold text-white">
                        {currentUser.name?.split(" ")[0] || "ME"}
                      </span>
                    </a>

                    {currentUser.role === "admin" && (
                      <a
                        href="/admin"
                        onClick={(e) => handleNavigate(e, "/admin")}
                        className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-[4px] border border-white/40 hover:border-white bg-white/10 hover:bg-white text-white hover:text-black font-mono-technical text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-sm"
                        aria-label="Open Admin Control Center"
                        title="Open Admin Control Center"
                      >
                        <span>ADMIN</span>
                      </a>
                    )}

                    <button
                      onClick={handleLogout}
                      className="hidden sm:inline-flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-[4px] border border-white/20 hover:border-white/40 bg-white/5 hover:bg-white/15 text-neutral-300 hover:text-white font-mono-technical text-xs uppercase tracking-wider transition-all cursor-pointer shadow-sm"
                      aria-label="Log out of session"
                      title="Terminate Session • Logout"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span className="hidden md:inline">LOGOUT</span>
                    </button>
                  </div>
                ) : (
                  <a
                    href="/login"
                    onClick={(e) => handleNavigate(e, "/login")}
                    className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] border border-base-500/50 hover:border-base-300 font-mono-technical text-xs uppercase tracking-wider text-base-200 hover:text-white transition-all cursor-pointer"
                  >
                    <span>[AUTH] LOGIN</span>
                  </a>
                )}
              </div>

              {/* Menu Drawer Toggle Button */}
              <button
                className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center bg-transparent border-none text-white hover:opacity-75 transition-opacity focus:outline-none cursor-pointer group"
                onClick={() => {
                  toggleMenu();
                }}
                aria-label={menuOpen ? "Close menu" : "Open menu"}
                title={menuOpen ? "Close Navigation Menu" : "Open Navigation Menu"}
              >
                {menuOpen ? (
                  <X className="w-5 h-5 text-white transition-transform duration-300 rotate-0 group-hover:rotate-90" />
                ) : (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-white group-hover:scale-110 transition-transform"
                  >
                    <line x1="4" y1="8" x2="20" y2="8" />
                    <line x1="4" y1="16" x2="20" y2="16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          {/* Expanded Menu Panel */}
          {menuOpen && (
            <div
              ref={menuWrapperRef}
              className="overflow-hidden"
              style={{ height: 0, opacity: 0 }}
            >
              <div className="px-4 pb-6 pt-3 sm:px-8 sm:pb-10 max-h-[85vh] overflow-y-auto overscroll-contain dark-scrollbar">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 pt-2">
                  
                  {/* Left Column: Primary Navigation (7 cols) */}
                  <div className="lg:col-span-7 flex flex-col justify-start">
                    <div className="menu-label flex items-center justify-between border-b border-white/10 pb-2 mb-3">
                      <span className="font-mono-technical text-[10px] sm:text-xs tracking-[0.2em] text-neutral-300 uppercase font-bold">
                        [ DIRECTORY • CORE 01 ]
                      </span>
                      <span className="font-mono-technical text-[10px] text-neutral-300 uppercase">
                        ATELIER ARCHIVE
                      </span>
                    </div>

                    <nav aria-label="Main Navigation" className="flex flex-col">
                      {primaryLinks.map((link) => (
                        <div key={link.label} className="overflow-hidden">
                          <a
                            href={link.href}
                            onClick={(e) => handleNavigate(e, link.href)}
                            className="menu-primary-text group flex items-center justify-between py-2 sm:py-3 border-b border-white/5 hover:border-white/40 transition-all cursor-pointer"
                          >
                            <div className="flex items-center gap-2.5 sm:gap-5">
                              <span className="font-mono-technical text-[11px] sm:text-sm font-bold text-neutral-300 group-hover:text-white transition-colors min-w-[20px] sm:min-w-[24px]">
                                {link.num}
                              </span>
                              <span className="font-display text-xl sm:text-3xl md:text-4xl uppercase tracking-tight text-white group-hover:text-white group-hover:translate-x-2 transition-all duration-300 font-normal">
                                {link.label}
                              </span>
                            </div>
                            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-white opacity-0 -translate-x-3 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                          </a>
                        </div>
                      ))}
                    </nav>
                  </div>

                  {/* Right Column: Intelligence, Vault & Quick Links (5 cols) */}
                  <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
                    
                    {/* User Identity or Sign In Prompt */}
                    <div suppressHydrationWarning className="menu-secondary-text">
                      {currentUser ? (
                        <div className="p-4 sm:p-5 rounded-[6px] bg-white/5 border border-white/10 space-y-3 shadow-lg">
                          <div className="flex items-center justify-between text-xs font-mono-technical">
                            <span className="flex items-center gap-1.5 text-white font-bold">
                              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                              AUTHENTICATED CLIENT
                            </span>
                            <span className="px-2 py-0.5 rounded-[3px] bg-white text-black font-bold uppercase text-[10px]">
                              {currentUser.role === "admin" ? "ADMIN" : "VIP ARCHIVIST"}
                            </span>
                          </div>

                          <div className="space-y-0.5">
                            <p className="font-display text-xl text-white uppercase tracking-tight truncate">
                              {currentUser.name}
                            </p>
                            <p className="font-mono-technical text-xs text-neutral-300 truncate">
                              {currentUser.email}
                            </p>
                          </div>

                          <div className="pt-2 flex flex-wrap gap-2">
                            {currentUser.role === "admin" && (
                              <a
                                href="/admin"
                                onClick={(e) => handleNavigate(e, "/admin")}
                                className="w-full py-2 px-3 rounded-[4px] bg-white text-black font-mono-technical text-xs font-bold uppercase tracking-wider text-center hover:bg-neutral-200 transition-all flex items-center justify-center gap-1.5 shadow-sm"
                              >
                                <ShieldCheck className="w-3.5 h-3.5" />
                                <span>ADMIN CONTROL</span>
                              </a>
                            )}

                            <a
                              href="/profile"
                              onClick={(e) => handleNavigate(e, "/profile")}
                              className="flex-1 py-2 px-3 rounded-[4px] bg-white text-black font-mono-technical text-xs font-bold uppercase tracking-wider text-center hover:bg-neutral-200 transition-all flex items-center justify-center gap-1.5 shadow-sm"
                            >
                              <User className="w-3.5 h-3.5" />
                              <span>VIEW PROFILE</span>
                            </a>

                            <button
                              type="button"
                              onClick={handleLogout}
                              className="py-2 px-3 rounded-[4px] bg-white/5 hover:bg-white/15 border border-white/20 text-neutral-300 font-mono-technical text-xs uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                              title="Terminate Session"
                            >
                              <LogOut className="w-3.5 h-3.5" />
                              <span>LOGOUT</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 sm:p-5 rounded-[6px] bg-white/5 border border-white/10 flex items-center justify-between gap-3 shadow-lg">
                          <div className="space-y-1">
                            <span className="font-mono-technical text-[10px] uppercase tracking-wider text-neutral-300 font-bold block">
                              CLIENT PORTAL
                            </span>
                            <p className="font-display text-lg text-white uppercase">
                              AUTHENTICATE ACCOUNT
                            </p>
                          </div>
                          <a
                            href="/login"
                            onClick={(e) => handleNavigate(e, "/login")}
                            className="px-4 py-2.5 rounded-[4px] bg-white text-black font-mono-technical text-xs font-bold uppercase tracking-wider hover:bg-neutral-200 transition-all flex items-center gap-1.5 shadow-md shrink-0"
                          >
                            <Lock className="w-3.5 h-3.5" />
                            <span>SIGN IN</span>
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Visual AI Search Camera Banner */}
                    <div className="menu-secondary-text">
                      <button
                        type="button"
                        onClick={() => {
                          audioSystem.playClick(750);
                          setMenuOpen(false);
                          setVisualSearchOpen(true);
                        }}
                        className="w-full p-4 rounded-[6px] bg-white/5 hover:bg-white/10 border border-white/20 text-white font-mono-technical text-xs uppercase tracking-wider flex items-center justify-between transition-all cursor-pointer shadow-md group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-[4px] bg-white/10 border border-white/20 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                            <Camera className="w-4 h-4" />
                          </div>
                          <div className="text-left">
                            <span className="font-bold block text-white group-hover:text-neutral-200">
                              SEARCH CLOTHES BY IMAGE
                            </span>
                            <span className="text-[10px] text-neutral-300 block font-normal">
                              Multi-Vector Visual AI Garment Lens
                            </span>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>

                    {/* Secondary Collections Directory */}
                    <div className="space-y-2.5 menu-secondary-text">
                      <span className="font-mono-technical text-[10px] sm:text-xs tracking-[0.2em] text-neutral-300 uppercase font-bold block">
                        [ ATELIER CAPSULES • 02 ]
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        {secondaryLinks.map((link) => (
                          <a
                            key={link.label}
                            href={link.href}
                            onClick={(e) => handleNavigate(e, link.href)}
                            className="p-3 rounded-[4px] bg-white/5 hover:bg-white/10 border border-white/10 font-mono-technical text-xs uppercase tracking-wider text-neutral-200 hover:text-white transition-all flex items-center justify-between group cursor-pointer"
                          >
                            <span className="truncate">{link.label}</span>
                            <ArrowUpRight className="w-3.5 h-3.5 text-neutral-200 group-hover:text-white transition-colors shrink-0 ml-1" />
                          </a>
                        ))}
                      </div>
                    </div>

                    {/* VIP Hotline Notice */}
                    <div className="p-3 rounded-[4px] bg-black/40 border border-white/10 flex items-center justify-between text-xs font-mono-technical menu-secondary-text">
                      <span className="text-neutral-200 uppercase text-[10px]">
                        HOTLINE DESK:
                      </span>
                      <a
                        href="tel:+918888333038"
                        className="font-bold text-white hover:underline transition-colors"
                      >
                        +91 8888333038
                      </a>
                    </div>
                  </div>
                </div>

                {/* Bottom Footer Telemetry Strip */}
                <div className="menu-divider mt-8 border-t border-white/10 pt-5 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono-technical text-xs text-neutral-200">
                  <div className="menu-social-text flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    <span className="uppercase text-[11px] tracking-wider text-white font-semibold">
                      DRAPZA HEAVYWEIGHT STREETWEAR ATELIER • DISPATCH ACTIVE
                    </span>
                  </div>

                  <div className="flex items-center gap-6">
                    {socials.map((item) => (
                      <a
                        key={item.label}
                        href={item.href}
                        onClick={(e) => handleNavigate(e, item.href)}
                        className="menu-social-text uppercase tracking-widest text-neutral-200 hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <span>{item.label}</span>
                        <ArrowUpRight className="w-3 h-3 text-neutral-200" />
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Visual AI Garment Search Modal */}
      <VisualSearchModal
        isOpen={visualSearchOpen}
        onClose={() => setVisualSearchOpen(false)}
        initialTab={searchInitialTab}
      />

      {/* Session Terminated Notice Modal */}
      <ConfirmModal
        isOpen={terminatedModal.isOpen}
        type="alert"
        variant="danger"
        title="SESSION TERMINATED"
        subtitle="[ ACCESS REVOCATION ]"
        message={terminatedModal.message}
        confirmLabel="ACKNOWLEDGE & LOGIN"
        onConfirm={() => {
          setTerminatedModal({ isOpen: false, message: "" });
          router.push("/login");
        }}
        onCancel={() => {
          setTerminatedModal({ isOpen: false, message: "" });
          router.push("/login");
        }}
      />
    </header>
  );
}

export { SiteHeader as Header };
