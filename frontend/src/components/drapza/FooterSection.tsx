"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowUpRight, Check, Loader2, Scissors } from "lucide-react";
import { Reveal } from "./Reveal";
import { useRouter, usePathname } from "next/navigation";
import { audioSystem } from "./AudioSystem";
import { newsletterSchema, getZodErrorMessage } from "@/lib/validation";
import { newsletterApi, footerConfigApi, DEFAULT_FOOTER_CONFIG, FooterConfigData, userApi } from "@/lib/api";
import { useToast } from "./ToastNotification";
import { BookCustomSizeModal } from "./BookCustomSizeModal";
import { DrapzaLogo } from "./DrapzaLogo";

export interface FooterSectionProps {
  initialUser?: any;
}

export function FooterSection({ initialUser }: FooterSectionProps = {}) {
  const { showToast } = useToast();
  const [config, setConfig] = useState<FooterConfigData>(DEFAULT_FOOTER_CONFIG);
  const [currentUser, setCurrentUser] = useState<any>(initialUser || null);
  const [isMounted, setIsMounted] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setIsMounted(true);
    let isMountedFlag = true;
    const loadConfig = async () => {
      try {
        const [footerRes, userRes] = await Promise.allSettled([
          footerConfigApi.getFooterConfig(),
          userApi.getProfile(),
        ]);
        if (isMountedFlag && footerRes.status === "fulfilled" && footerRes.value?.success && footerRes.value.data) {
          setConfig(footerRes.value.data);
        }
        if (isMountedFlag && userRes.status === "fulfilled" && userRes.value?.success && userRes.value.user) {
          setCurrentUser(userRes.value.user);
        }
      } catch (e) {
        // Fallback silently
      }
    };
    loadConfig();

    const handleUpdate = (e: any) => {
      if (e.detail) {
        setConfig(e.detail);
      } else {
        loadConfig();
      }
    };

    window.addEventListener("drapza_footer_config_updated", handleUpdate);
    return () => {
      isMountedFlag = false;
      window.removeEventListener("drapza_footer_config_updated", handleUpdate);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || subscribed) return;

    setEmailError("");
    setStatusMessage("");

    const cleanEmail = emailInput.trim();
    const validation = newsletterSchema.safeParse({ email: cleanEmail });
    if (!validation.success) {
      setEmailError(getZodErrorMessage(validation.error));
      audioSystem.playClick(300, 0.08);
      return;
    }

    setIsSubmitting(true);
    audioSystem.playClick(600, 0.02);

    try {
      const response = await newsletterApi.subscribe(cleanEmail, "footer_dispatch");

      if (response.success) {
        audioSystem.playSuccess();
        setSubscribed(true);
        setStatusMessage(
          response.alreadySubscribed
            ? "DISPATCH CHANNEL ALREADY ACTIVE"
            : "SIGNAL RECEIVED • CONFIRMATION TRANSMITTED"
        );
        showToast({
          title: "VIP Dispatch Channel",
          description: "Subscribed to Atelier secret drops & private releases",
          type: "success",
        });
      } else {
        audioSystem.playClick(300, 0.08);
        setEmailError(response.message || "Failed to establish connection. Please retry.");
      }
    } catch (err: any) {
      audioSystem.playClick(300, 0.08);
      setEmailError("Transmission failed. Please check network.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    audioSystem.playClick(500);
    setEmailInput("");
    setSubscribed(false);
    setStatusMessage("");
    setEmailError("");
  };

  const handleNavigate = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    audioSystem.playClick(650);

    if (
      href === "#book-appointment" ||
      href === "#appointment" ||
      href === "/appointment" ||
      href === "#custom-size-fittings" ||
      href === "/custom-size-fittings"
    ) {
      setAppointmentModalOpen(true);
      return;
    }

    if (href.startsWith("http")) {
      window.open(href, "_blank", "noopener,noreferrer");
      return;
    }

    if (href === "/") {
      router.push("/");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (href === "/wardrobe") {
      router.push("/wardrobe");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (href.startsWith("/") && !href.includes("#")) {
      router.push(href);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

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

  if (pathname?.startsWith("/admin") || !config.isEnabled) {
    return null;
  }

  const cleanPhone = (config.phone || "+91 8888333038").replace(/\s+/g, "");
  const cleanWa = (config.whatsapp || "+91 8888333038").replace(/[^0-9]/g, "");
  const waEncodedMsg = encodeURIComponent(config.whatsappMessage || "Hello Drapza Atelier");

  return (
    <footer id="footer" className="bg-base-100 relative">
      {/* ─── 1. HERO PARALLAX HEADER ─── */}
      {config.showHeroBanner && (
        <div
          style={{ backgroundColor: config.heroBgColor || "#f4f4f4" }}
          className="relative h-[45vh] sm:h-[60vh] md:h-[68vh] min-h-[340px] sm:min-h-[500px] md:min-h-[620px] border-b border-base-200 overflow-hidden flex flex-col justify-between"
        >
          {/* Layer 1: Giant Background Typography — bottom aligned behind models */}
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 z-0 flex items-end justify-center select-none overflow-hidden"
            aria-hidden="true"
          >
            <span
              style={{ color: config.heroTextColor ? `${config.heroTextColor}26` : undefined }}
              className="font-display text-[clamp(6rem,32vw,36rem)] leading-[0.85] uppercase tracking-tighter text-black/15 whitespace-nowrap w-full text-center block translate-y-[15%]"
            >
              {config.heroBannerText || "DRAPZA"}
            </span>
          </div>

          {/* Layer 2: Models PNG cutout image in front of text (z-10 over z-0 text) */}
          {config.heroBannerImage && (
            <div className="pointer-events-none absolute inset-0 z-10">
              <img
                src={config.heroBannerImage}
                alt="Drapza models in neutral campaign silhouettes"
                aria-hidden="true"
                className="h-full w-full object-cover object-center filter contrast-105 brightness-100"
              />
            </div>
          )}
        </div>
      )}

      {/* ─── 2. FOOTER SECTION (Positioning Context for Top-Right Newsletter Overlay) ─── */}
      <div className="relative pt-8 sm:pt-16 md:pt-20 pb-12 sm:pb-16 md:pb-20 bg-base-100">

        {/* Layer 50: Absolute Newsletter Card */}
        {config.showNewsletterCard && (
          <div
            className={`relative z-50 w-full max-w-[480px] mx-auto md:mx-0 px-4 md:px-0 pointer-events-auto ${
              config.showHeroBanner
                ? "md:absolute md:right-[6%] md:-top-36 lg:-top-44 -mt-12 sm:-mt-16 md:mt-0 pb-6 sm:pb-8 md:pb-0"
                : "md:float-right md:mr-[6%] mb-8 sm:mb-12"
            }`}
          >
            <Reveal variant="up">
              <div
                style={{ backgroundColor: config.newsletterBgColor || "#0b0b0b" }}
                className="rounded-3xl p-6 sm:p-9 shadow-2xl text-white border border-white/10 flex flex-col items-center text-center"
              >
                {/* Top Mono Tag */}
                {config.newsletterTag && (
                  <span className="font-mono-technical text-[10px] sm:text-xs uppercase tracking-[0.2em] sm:tracking-[0.25em] text-neutral-300 block mb-2 sm:mb-3 font-semibold text-center">
                    {config.newsletterTag}
                  </span>
                )}

                {/* Main Heading */}
                <h2 className="font-display text-[clamp(1.8rem,4vw,3.1rem)] uppercase leading-[0.92] text-white font-light tracking-tight text-center max-w-[440px]">
                  {config.newsletterHeadingLine1}
                  {config.newsletterHeadingLine2 && (
                    <>
                      <br />
                      {config.newsletterHeadingLine2}
                    </>
                  )}
                  {config.newsletterHeadingLine3 && (
                    <>
                      <br />
                      {config.newsletterHeadingLine3}
                    </>
                  )}
                </h2>

                {/* Description */}
                {config.newsletterDescription && (
                  <p className="mt-2.5 sm:mt-3 font-body text-xs sm:text-sm text-neutral-300 leading-relaxed text-center max-w-[420px]">
                    {config.newsletterDescription}
                  </p>
                )}

                {/* Form: Centered Input & Centered Arrow Button Directly Below */}
                {!subscribed ? (
                  <form onSubmit={handleSubmit} noValidate className="mt-5 sm:mt-6 w-full max-w-[440px] flex flex-col items-center text-center">
                    <input
                      type="email"
                      value={emailInput}
                      disabled={isSubmitting}
                      onChange={(e) => {
                        setEmailInput(e.target.value);
                        if (emailError) setEmailError("");
                      }}
                      placeholder={config.newsletterPlaceholder || "ENTER SIGNAL ADDRESS"}
                      className={`w-full max-w-[440px] h-[50px] sm:h-[56px] rounded-xl bg-[#1a1a1a] border ${
                        emailError ? "border-red-500" : "border-dashed border-neutral-600"
                      } px-4 sm:px-5 py-3 sm:py-4 font-mono-technical text-[11px] sm:text-xs uppercase tracking-[0.15em] text-white placeholder:text-neutral-300 text-center focus:outline-none focus:border-white transition-colors disabled:opacity-50`}
                    />

                    {emailError && (
                      <span style={{ color: "#ef4444", fontSize: "0.68rem", fontFamily: "var(--font-dm-mono), monospace", marginTop: "0.35rem", fontWeight: 500, display: "block" }}>
                        ✕ {emailError}
                      </span>
                    )}

                    {/* Submit Arrow Circle Button Centered Directly Below Input */}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      aria-label="Submit email address"
                      className="h-12 w-12 sm:h-13 sm:w-13 rounded-full bg-neutral-200 text-black flex items-center justify-center font-bold hover:bg-white hover:scale-105 active:scale-95 transition-all shadow-lg mx-auto mt-3.5 sm:mt-4 cursor-pointer disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <Loader2 className="h-5 w-5 animate-spin text-black" />
                      ) : (
                        <ArrowUpRight className="h-5 w-5 sm:h-6 sm:w-6 stroke-[2.5]" />
                      )}
                    </button>

                    <span className="font-mono-technical text-[10px] sm:text-[11px] uppercase tracking-wider text-white font-semibold text-center mt-2">
                      {isSubmitting ? "TRANSMITTING SIGNAL..." : (config.newsletterButtonText || "READY TO TRANSMIT")}
                    </span>
                  </form>
                ) : (
                  <div className="mt-6 w-full max-w-[440px] flex flex-col items-center text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center shadow-lg">
                      <Check className="w-6 h-6 stroke-[3]" />
                    </div>

                    <div className="space-y-1">
                      <span className="font-mono-technical text-xs uppercase tracking-widest text-white font-bold block">
                        {statusMessage || "SIGNAL RECEIVED"}
                      </span>
                      <p className="font-mono-technical text-[11px] text-neutral-100 uppercase tracking-wider font-medium">
                        Transmission dispatched to <strong className="text-white">{emailInput}</strong>
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleResetForm}
                      className="mt-2 text-[10px] font-mono-technical text-neutral-200 hover:text-white uppercase tracking-wider underline cursor-pointer font-medium"
                    >
                      [ TRANSMIT ANOTHER ADDRESS ]
                    </button>
                  </div>
                )}

                {/* Dashed Divider & Bottom Text */}
                {config.newsletterBottomText && (
                  <div className="w-full max-w-[440px] border-t border-dashed border-neutral-800 my-4 sm:my-5 pt-3 sm:pt-4 text-center">
                    <p className="font-mono-technical text-[9px] sm:text-[10px] uppercase tracking-wider text-neutral-200 text-center font-semibold">
                      {config.newsletterBottomText}
                    </p>
                  </div>
                )}

              </div>
            </Reveal>
          </div>
        )}

        {/* Footer Navigation Columns — full width, no clip */}
        <div className="mx-auto max-w-[1800px] w-full px-4 sm:px-6 md:px-10">
          <div id="footer-nav" className="w-full md:max-w-[58%] lg:max-w-[65%] xl:max-w-[60%]">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 sm:gap-8 items-start">
              {/* Column 1 */}
              <div>
                <p className="font-mono-technical text-xs uppercase tracking-[0.2em] text-neutral-900 font-bold">
                  {config.col1Title || "Root"}
                </p>
                <ul className="mt-5 space-y-3 list-none p-0 m-0">
                  <li className="opacity-100 visible">
                    <button
                      type="button"
                      onClick={() => {
                        audioSystem.playClick(600);
                        setAppointmentModalOpen(true);
                      }}
                      className="font-mono-technical text-xs sm:text-sm uppercase tracking-wider text-neutral-900 hover:text-black font-bold transition-colors cursor-pointer flex items-center gap-1.5 text-left group"
                    >
                      <Scissors className="w-3.5 h-3.5 text-neutral-500 group-hover:text-black transition-colors" />
                      <span>CUSTOM SIZE FITTINGS</span>
                      <span className="text-[9px] bg-black text-white px-1.5 py-0.5 rounded-none font-bold tracking-wider">
                        BESPOKE
                      </span>
                    </button>
                  </li>
                  <li className="opacity-100 visible">
                    <button
                      type="button"
                      onClick={() => {
                        audioSystem.playClick(600);
                        setAppointmentModalOpen(true);
                      }}
                      className="font-mono-technical text-xs sm:text-sm uppercase tracking-wider text-neutral-800 hover:text-black font-semibold transition-colors cursor-pointer block text-left"
                    >
                      BOOK APPOINTMENT
                    </button>
                  </li>
                  {(config.col1Links || [])
                    .filter(
                      (item) =>
                        item.href !== "#book-appointment" &&
                        item.href !== "#custom-size-fittings" &&
                        !item.label.includes("BOOK BESPOKE APPOINTMENT") &&
                        !item.label.includes("CUSTOM SIZE FITTINGS")
                    )
                    .map((item, idx) => (
                    <li key={`${item.label}-${idx}`} className="opacity-100 visible">
                      <a
                        href={item.href}
                        onClick={(e) => handleNavigate(e, item.href)}
                        className="font-mono-technical text-xs sm:text-sm uppercase tracking-wider text-neutral-800 hover:text-black font-semibold transition-colors cursor-pointer block"
                      >
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Column 2 */}
              <div>
                <p className="font-mono-technical text-xs uppercase tracking-[0.2em] text-neutral-900 font-bold">
                  {config.col2Title || "Connect Feed"}
                </p>
                <ul className="mt-5 space-y-3 list-none p-0 m-0">
                  {(config.col2Links || []).map((item, idx) => (
                    <li key={`${item.label}-${idx}`} className="opacity-100 visible">
                      <a
                        href={item.href}
                        onClick={(e) => handleNavigate(e, item.href)}
                        className="font-mono-technical text-xs sm:text-sm uppercase tracking-wider text-neutral-800 hover:text-black font-semibold transition-colors cursor-pointer block"
                      >
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Column 3 */}
              <div>
                <p className="font-mono-technical text-xs uppercase tracking-[0.2em] text-neutral-900 font-bold">
                  {config.col3Title || "Open Line & Hotline"}
                </p>
                <ul className="mt-5 space-y-3 list-none p-0 m-0">
                  {config.phone && (
                    <li className="opacity-100 visible">
                      <a
                        href={`tel:${cleanPhone}`}
                        className="font-mono-technical text-xs sm:text-sm uppercase tracking-wider text-neutral-900 font-bold hover:text-black transition-colors block"
                      >
                        TEL: {config.phone}
                      </a>
                    </li>
                  )}
                  {config.whatsapp && (
                    <li className="opacity-100 visible">
                      <a
                        href={`https://wa.me/${cleanWa}?text=${waEncodedMsg}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono-technical text-xs sm:text-sm uppercase tracking-wider text-black font-bold hover:underline block"
                      >
                        WA: {config.whatsapp} (↗)
                      </a>
                    </li>
                  )}
                  {config.addressText && (
                    <li className="opacity-100 visible">
                      <span className="font-mono-technical text-xs sm:text-sm uppercase tracking-wider text-neutral-800 font-semibold block">
                        {config.addressText}
                      </span>
                    </li>
                  )}
                  {(config.showTermsLink ?? true) && (
                    <li className="opacity-100 visible pt-1">
                      <a
                        href={config.termsLinkHref || "/terms"}
                        onClick={(e) => handleNavigate(e, config.termsLinkHref || "/terms")}
                        className="font-mono-technical text-xs sm:text-sm uppercase tracking-wider text-neutral-800 hover:text-black font-semibold transition-colors cursor-pointer block"
                      >
                        {config.termsLinkText || "TERMS & CONDITIONS"}
                      </a>
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>

          {/* DRAPZA Brand Logo with 3D Emblem & Tagline */}
          <div id="footer-logo" className="mt-10 sm:mt-14 overflow-hidden select-none opacity-100 visible">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <DrapzaLogo
                theme="dark"
                emblemSize={48}
                showTagline={true}
                wordmarkClassName="text-3xl sm:text-4xl md:text-5xl tracking-[0.16em]"
                taglineClassName="text-[10px] sm:text-xs text-neutral-800 font-bold tracking-[0.4em] pt-1.5"
              />
            </div>
          </div>

          {/* Copyright Bar & Subtle Divider */}
          <div suppressHydrationWarning className="mt-8 border-t border-neutral-300/70 pt-6 pb-2 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="font-mono-technical text-xs text-neutral-700 uppercase tracking-[0.15em] font-medium">
              {config.copyrightText || "© 2026 DRAPZA ATELIER. ALL MODULES RESERVED."}
            </p>
            {isMounted &&
              config.showAdminLink &&
              (currentUser?.role === "admin" ||
                currentUser?.email?.toLowerCase() === "drapza.cloth@gmail.com") && (
                <Link
                  href={config.adminLinkHref || "/admin"}
                  className="font-mono-technical text-[11px] text-neutral-800 hover:text-black uppercase tracking-[0.2em] font-bold transition-colors cursor-pointer"
                >
                  {config.adminLinkText || "[ ATELIER ADMIN CONTROL ]"}
                </Link>
              )}
          </div>
        </div>
      </div>

      {/* BESPOKE CUSTOM SIZE APPOINTMENT MODAL */}
      <BookCustomSizeModal
        isOpen={appointmentModalOpen}
        onClose={() => setAppointmentModalOpen(false)}
      />
    </footer>
  );
}

