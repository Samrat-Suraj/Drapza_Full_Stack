"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  FileText,
  Clock,
  Download,
  Loader2,
  Search,
  ChevronRight,
  ArrowUpRight,
  Mail,
  Phone,
  HelpCircle,
  CheckCircle2,
  Lock,
  Compass,
  ArrowUp,
} from "lucide-react";
import { termsConfigApi, TermsConfigData, DEFAULT_TERMS_CONFIG } from "@/lib/api";
import { audioSystem } from "./AudioSystem";

export function TermsContainer() {
  const [config, setConfig] = useState<TermsConfigData>(DEFAULT_TERMS_CONFIG);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSectionId, setActiveSectionId] = useState<string>("");
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  useEffect(() => {
    const fetchTerms = async () => {
      try {
        const res = await termsConfigApi.getTermsConfig();
        if (res && res.success && res.data) {
          setConfig(res.data);
        }
      } catch (err) {
        console.error("Failed to load Terms & Conditions config:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTerms();
  }, []);

  const handleDownloadPdf = async () => {
    setIsDownloadingPdf(true);
    audioSystem.playClick(750);

    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 18;
      const contentWidth = pageWidth - margin * 2;
      let y = margin;

      const checkPageBreak = (neededHeight: number) => {
        if (y + neededHeight > pageHeight - margin) {
          doc.addPage();
          y = margin;
          doc.setFont("helvetica", "bold");
          doc.setFontSize(8);
          doc.setTextColor(150, 150, 150);
          doc.text("DRAPZA ATELIER • TERMS & CONDITIONS", margin, y);
          doc.text(config.versionTag || "ATELIER PROTOCOL", pageWidth - margin, y, { align: "right" });
          y += 10;
        }
      };

      // Header Bar
      doc.setFillColor(15, 15, 15);
      doc.rect(margin, y, contentWidth, 22, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(255, 255, 255);
      doc.text(config.pageTitle || "TERMS & CONDITIONS", margin + 6, y + 9);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(200, 200, 200);
      doc.text(
        `${config.versionTag || "ATELIER PROTOCOL"}  |  EFFECTIVE: ${config.effectiveDate || "MARCH 2026"}  |  UPDATED: ${config.lastUpdated || "2026"}`,
        margin + 6,
        y + 16
      );
      y += 30;

      // Summary
      if (config.heroSummary) {
        checkPageBreak(25);
        doc.setFont("helvetica", "italic");
        doc.setFontSize(8.5);
        doc.setTextColor(70, 70, 70);
        const summaryLines = doc.splitTextToSize(config.heroSummary, contentWidth);
        doc.text(summaryLines, margin, y);
        y += summaryLines.length * 4.5 + 8;
      }

      // Sections
      (config.sections || []).forEach((sec) => {
        checkPageBreak(20);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.text(`ARTICLE ${sec.sectionNumber}: ${sec.title}`, margin, y);
        y += 5.5;

        if (sec.subtitle) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);
          doc.setTextColor(120, 120, 120);
          doc.text(sec.subtitle, margin, y);
          y += 4.5;
        }

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(50, 50, 50);
        (sec.content || []).forEach((para) => {
          checkPageBreak(15);
          const lines = doc.splitTextToSize(para, contentWidth);
          doc.text(lines, margin, y);
          y += lines.length * 4 + 2.5;
        });

        if (sec.bulletPoints && sec.bulletPoints.length > 0) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(7.5);
          doc.setTextColor(60, 60, 60);
          sec.bulletPoints.forEach((bullet) => {
            checkPageBreak(10);
            const bulletLines = doc.splitTextToSize(`• ${bullet}`, contentWidth - 4);
            doc.text(bulletLines, margin + 3, y);
            y += bulletLines.length * 3.8 + 1.5;
          });
        }

        if (sec.highlightBox) {
          checkPageBreak(15);
          doc.setFillColor(245, 245, 245);
          const boxLines = doc.splitTextToSize(`ATELIER MANDATE: ${sec.highlightBox}`, contentWidth - 6);
          const boxHeight = boxLines.length * 3.8 + 6;
          doc.rect(margin, y, contentWidth, boxHeight, "F");
          doc.setFont("helvetica", "bold");
          doc.setFontSize(7.5);
          doc.setTextColor(30, 30, 30);
          doc.text(boxLines, margin + 3, y + 4.5);
          y += boxHeight + 4;
        }

        y += 4;
      });

      // Governance Footer
      checkPageBreak(25);
      doc.setDrawColor(220, 220, 220);
      doc.line(margin, y, pageWidth - margin, y);
      y += 5;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(90, 90, 90);
      doc.text("LEGAL CONCIERGE & GOVERNING JURISDICTION", margin, y);
      y += 4;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(120, 120, 120);
      doc.text(`Email: ${config.supportEmail || "support@drapza.com"} | Hotline: ${config.supportPhone || "+91 8888333038"}`, margin, y);
      y += 3.5;
      doc.text(config.governingLaw || "Republic of India • Exclusive Court Jurisdiction Applicable", margin, y);

      doc.save("DRAPZA_TERMS_AND_CONDITIONS_2026.pdf");
      audioSystem.playSuccess();
    } catch (error) {
      console.error("PDF generation failed:", error);
      window.print();
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 400) {
        setShowBackToTop(true);
      } else {
        setShowBackToTop(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    audioSystem.playClick(600);
    setActiveSectionId(id);
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -120;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  const scrollToTop = () => {
    audioSystem.playClick(750);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return config.sections || [];
    const q = searchQuery.toLowerCase();
    return (config.sections || []).filter(
      (sec) =>
        sec.title.toLowerCase().includes(q) ||
        sec.sectionNumber.toLowerCase().includes(q) ||
        (sec.subtitle && sec.subtitle.toLowerCase().includes(q)) ||
        sec.content.some((p) => p.toLowerCase().includes(q)) ||
        (sec.bulletPoints && sec.bulletPoints.some((b) => b.toLowerCase().includes(q))) ||
        (sec.highlightBox && sec.highlightBox.toLowerCase().includes(q))
    );
  }, [config.sections, searchQuery]);

  return (
    <div className="min-h-screen bg-[#fafafc] text-neutral-900 font-sans selection:bg-black selection:text-white flex flex-col justify-between">
      <main className="flex-1 pt-28 sm:pt-36 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {/* 1. HERO HEADER BANNER (CLEAN LUXURY WHITE LOOK) */}
        <div className="relative rounded-3xl bg-white text-neutral-900 p-6 sm:p-10 md:p-12 overflow-hidden border border-neutral-200/90 shadow-sm mb-10 sm:mb-14">
          <div className="absolute top-0 right-0 w-96 h-96 bg-neutral-100/70 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-neutral-50 rounded-full blur-2xl pointer-events-none -ml-20 -mb-20" />

          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-neutral-100 text-neutral-900 font-mono text-xs font-bold tracking-widest uppercase border border-neutral-200 flex items-center gap-1.5 shadow-xs">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                {config.versionTag || "ATELIER PROTOCOL V2.6"}
              </span>

              <span className="px-3 py-1 rounded-full bg-neutral-50 text-neutral-600 font-mono text-xs tracking-wider uppercase border border-neutral-200">
                EFFECTIVE: {config.effectiveDate || "MARCH 2026"}
              </span>

              <span className="px-3 py-1 rounded-full bg-neutral-50 text-neutral-500 font-mono text-xs tracking-wider uppercase border border-neutral-200">
                UPDATED: {config.lastUpdated || "SEPTEMBER 20, 2026"}
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold uppercase tracking-tight font-mono text-black leading-tight">
              {config.pageTitle || "TERMS & CONDITIONS"}
            </h1>

            <p className="text-xs sm:text-sm font-mono tracking-widest text-neutral-500 uppercase">
              {config.pageSubtitle || "ATELIER PROTOCOL & COMMERCIAL GOVERNANCE"}
            </p>

            <p className="text-sm sm:text-base text-neutral-600 leading-relaxed pt-1 font-normal">
              {config.heroSummary}
            </p>

            <div className="pt-4 flex items-center gap-3 flex-wrap text-xs font-mono">
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={isDownloadingPdf}
                className="px-5 py-2.5 rounded-xl bg-black hover:bg-neutral-800 text-white font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-md hover:scale-105 active:scale-95 disabled:opacity-50"
              >
                {isDownloadingPdf ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                ) : (
                  <Download className="w-3.5 h-3.5 text-white" />
                )}
                <span>{isDownloadingPdf ? "DOWNLOADING..." : "DOWNLOAD PDF"}</span>
              </button>

              <Link
                href="/support"
                className="px-5 py-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border border-neutral-200 uppercase tracking-wider transition-all flex items-center gap-1.5 font-bold hover:border-neutral-300"
              >
                <HelpCircle className="w-3.5 h-3.5 text-neutral-600" />
                <span>SUPPORT CONCIERGE</span>
                <ArrowUpRight className="w-3 h-3 text-neutral-500" />
              </Link>
            </div>
          </div>
        </div>

        {/* 2. SEARCH & NAVIGATION TOOLBAR */}
        <div className="sticky top-20 sm:top-24 z-30 bg-white/90 backdrop-blur-md rounded-2xl border border-neutral-200 p-3 sm:p-4 shadow-sm mb-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80 md:w-96">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-neutral-400" />
            <input
              type="text"
              placeholder="Search legal clauses, returns, pricing, IP..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-neutral-50 border border-neutral-200 rounded-xl pl-10 pr-4 py-2 text-xs font-mono text-black placeholder-neutral-400 focus:outline-none focus:border-black shadow-xs"
            />
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-neutral-500 w-full sm:w-auto justify-between sm:justify-end">
            <span>
              Showing {filteredSections.length} of {config.sections.length} Clauses
            </span>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="text-neutral-900 underline font-bold cursor-pointer hover:text-black ml-2"
              >
                Clear Search
              </button>
            )}
          </div>
        </div>

        {/* 3. MAIN CONTENT GRID: SIDEBAR TOC + CLAUSE SECTIONS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Table of Contents (Sticky on Desktop) */}
          <aside className="hidden lg:block lg:col-span-4 sticky top-40 space-y-3 font-mono">
            <div className="p-5 rounded-2xl bg-white border border-neutral-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                <span className="text-[11px] font-bold uppercase tracking-widest text-neutral-500 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-black" />
                  <span>TABLE OF CLAUSES</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600 font-bold">
                  {config.sections.length} ARTICLES
                </span>
              </div>

              <nav className="space-y-1 max-h-[60vh] overflow-y-auto custom-scrollbar pr-1">
                {config.sections.map((sec) => {
                  const isActive = activeSectionId === sec.id;
                  return (
                    <button
                      key={sec.id}
                      type="button"
                      onClick={() => scrollToSection(sec.id)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-all cursor-pointer flex items-center justify-between group ${
                        isActive
                          ? "bg-black text-white font-bold shadow-xs"
                          : "text-neutral-600 hover:text-black hover:bg-neutral-100"
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className={`text-[10px] font-mono shrink-0 ${isActive ? "text-neutral-300 font-bold" : "text-neutral-400"}`}>
                          §{sec.sectionNumber}
                        </span>
                        <span className="truncate text-[11px] tracking-wide uppercase">{sec.title}</span>
                      </div>
                      <ChevronRight className={`w-3 h-3 shrink-0 transition-transform ${isActive ? "text-white" : "opacity-0 group-hover:opacity-100"}`} />
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Quick Support Badge */}
            <div className="p-4 rounded-2xl bg-neutral-100 border border-neutral-200 text-xs space-y-2">
              <div className="font-bold uppercase text-black flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-black" />
                <span>LEGAL GOVERNANCE</span>
              </div>
              <p className="text-neutral-600 text-[11px] leading-relaxed">
                {config.governingLaw || "Governed by the laws of the Republic of India."}
              </p>
            </div>
          </aside>

          {/* Clauses List */}
          <div className="lg:col-span-8 space-y-8">
            {filteredSections.length === 0 ? (
              <div className="p-12 text-center rounded-3xl bg-white border border-neutral-200 shadow-sm space-y-4 font-mono">
                <Search className="w-10 h-10 text-neutral-400 mx-auto" />
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-black uppercase">No Matching Clauses Found</h3>
                  <p className="text-xs text-neutral-500">
                    No articles or legal provisions match &quot;{searchQuery}&quot;.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="px-4 py-2 bg-neutral-100 hover:bg-black hover:text-white rounded-xl text-xs font-bold uppercase transition-all"
                >
                  View All Clauses
                </button>
              </div>
            ) : (
              filteredSections.map((sec) => (
                <section
                  key={sec.id}
                  id={sec.id}
                  className="p-6 sm:p-8 rounded-3xl bg-white border border-neutral-200 shadow-sm space-y-4 scroll-mt-32 transition-all hover:border-neutral-300"
                >
                  {/* Section Header */}
                  <div className="space-y-1.5 border-b border-neutral-100 pb-4">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-md bg-black text-white font-mono text-[10px] font-bold tracking-widest uppercase">
                        ARTICLE {sec.sectionNumber}
                      </span>
                    </div>

                    <h2 className="text-lg sm:text-xl font-bold uppercase tracking-tight font-mono text-black">
                      {sec.title}
                    </h2>

                    {sec.subtitle && (
                      <p className="text-xs text-neutral-500 font-mono tracking-wide">
                        {sec.subtitle}
                      </p>
                    )}
                  </div>

                  {/* Section Paragraphs */}
                  <div className="space-y-3 text-neutral-700 text-xs sm:text-sm leading-relaxed">
                    {sec.content.map((paragraph, pIdx) => (
                      <p key={pIdx}>{paragraph}</p>
                    ))}
                  </div>

                  {/* Bullet Points */}
                  {sec.bulletPoints && sec.bulletPoints.length > 0 && (
                    <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80 space-y-2">
                      <div className="text-[10.5px] font-bold font-mono uppercase tracking-widest text-neutral-500">
                        KEY PROVISIONS:
                      </div>
                      <ul className="space-y-2 text-xs text-neutral-800">
                        {sec.bulletPoints.map((bullet, bIdx) => (
                          <li key={bIdx} className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-black shrink-0 mt-0.5" />
                            <span className="leading-snug">{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Highlight Callout Box */}
                  {sec.highlightBox && (
                    <div className="p-4 rounded-2xl bg-black text-white text-xs font-mono space-y-1 shadow-md">
                      <div className="flex items-center gap-2 text-neutral-400 text-[10px] font-bold uppercase tracking-widest">
                        <Compass className="w-3 h-3 text-white" />
                        <span>ATELIER MANDATE</span>
                      </div>
                      <p className="text-neutral-200 leading-relaxed font-normal">{sec.highlightBox}</p>
                    </div>
                  )}
                </section>
              ))
            )}

            {/* 4. LEGAL INQUIRY & SUPPORT DESK CARD */}
            <div className="p-6 sm:p-8 rounded-3xl bg-neutral-950 text-white border border-neutral-800 shadow-xl space-y-6 font-mono">
              <div className="space-y-2">
                <span className="px-2.5 py-1 rounded-md bg-white/10 text-white text-[10px] font-bold tracking-widest uppercase border border-white/10">
                  LEGAL CONCIERGE DESK
                </span>
                <h3 className="text-lg sm:text-xl font-bold uppercase tracking-tight text-white">
                  QUESTIONS REGARDING ATELIER PROTOCOLS?
                </h3>
                <p className="text-xs text-neutral-400 leading-relaxed max-w-xl">
                  {config.supportDeskText ||
                    "Our legal and client advisory team is available to address corporate, bespoke trade, or transactional inquiries."}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs">
                <a
                  href={`mailto:${config.supportEmail || "support@drapza.com"}`}
                  className="p-4 rounded-2xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-600 transition-all flex items-center gap-3 group"
                >
                  <div className="w-9 h-9 rounded-xl bg-white text-black flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] text-neutral-400 uppercase tracking-wider">Email Protocol</div>
                    <div className="font-bold text-white truncate">{config.supportEmail || "support@drapza.com"}</div>
                  </div>
                </a>

                <a
                  href={`tel:${config.supportPhone || "+918888333038"}`}
                  className="p-4 rounded-2xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-600 transition-all flex items-center gap-3 group"
                >
                  <div className="w-9 h-9 rounded-xl bg-white text-black flex items-center justify-center shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] text-neutral-400 uppercase tracking-wider">Hotline / WhatsApp</div>
                    <div className="font-bold text-white truncate">{config.supportPhone || "+91 8888333038"}</div>
                  </div>
                </a>
              </div>

              <div className="pt-4 border-t border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11px] text-neutral-400">
                <span>{config.governingLaw || "Republic of India • Exclusive Court Jurisdiction Applicable"}</span>
                <Link href="/support" className="text-white underline hover:text-neutral-300 font-bold flex items-center gap-1">
                  <span>Visit Customer Support</span>
                  <ArrowUpRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Floating Back to Top Button */}
      {showBackToTop && (
        <button
          type="button"
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-40 p-3 rounded-2xl bg-black text-white border border-neutral-700 shadow-2xl hover:scale-110 active:scale-95 transition-all cursor-pointer flex items-center justify-center"
          title="Scroll to top"
          aria-label="Scroll to top"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
