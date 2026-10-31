"use client";

import { useEffect, useRef } from "react";
import {
  X,
  Eye,
  Type,
  ZapOff,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sliders,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { useAccessibility } from "@/context/AccessibilityContext";
import { audioSystem } from "./AudioSystem";

export function AccessibilityModal() {
  const {
    settings,
    updateSetting,
    resetSettings,
    isModalOpen,
    closeModal,
    auditStats,
    runAxeAudit,
    isAuditing,
  } = useAccessibility();

  const modalRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isModalOpen) {
        audioSystem.playClick(500);
        closeModal();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isModalOpen, closeModal]);

  // Run initial audit on first open if not run yet
  useEffect(() => {
    if (isModalOpen && !auditStats.checked && !isAuditing) {
      runAxeAudit();
    }
  }, [isModalOpen, auditStats.checked, isAuditing, runAxeAudit]);

  if (!isModalOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md transition-opacity duration-300"
      role="dialog"
      aria-modal="true"
      aria-labelledby="a11y-modal-title"
    >
      {/* Backdrop click */}
      <div
        className="absolute inset-0"
        onClick={() => {
          audioSystem.playClick(500);
          closeModal();
        }}
        aria-hidden="true"
      />

      {/* Modal Card */}
      <div
        ref={modalRef}
        className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto custom-modal-scrollbar bg-neutral-950 text-white rounded-3xl border border-white/20 shadow-2xl p-5 sm:p-8 flex flex-col gap-6 z-10"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-white/10 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white shrink-0">
              <Sliders className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono-technical text-[10px] sm:text-xs uppercase tracking-widest text-emerald-400 font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  AXE-CORE ACTIVE
                </span>
                <span className="font-mono-technical text-[9px] uppercase px-2 py-0.5 rounded-full bg-white/10 text-neutral-300">
                  WCAG 2.1 AA
                </span>
              </div>
              <h2
                id="a11y-modal-title"
                className="text-xl sm:text-2xl font-bold font-display tracking-tight text-white mt-1"
              >
                ACCESSIBILITY & DISPLAY ENHANCER
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              audioSystem.playClick(600);
              closeModal();
            }}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-white/10"
            aria-label="Close accessibility modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Axe-Core Live Scanner Panel */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-neutral-900 to-neutral-950 border border-white/15">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <p className="text-xs sm:text-sm font-semibold text-white">
                  Deque axe-core® Verification Engine
                </p>
                <p className="text-[11px] text-neutral-400">
                  Real-time automated WCAG 2.1 accessibility evaluation
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                audioSystem.playClick(750);
                runAxeAudit();
              }}
              disabled={isAuditing}
              className="px-3.5 py-1.5 rounded-xl bg-white text-black text-xs font-semibold hover:bg-neutral-200 transition-all active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5 self-start sm:self-auto shadow"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isAuditing ? "animate-spin" : ""}`} />
              {isAuditing ? "Auditing DOM..." : "Re-Scan Page"}
            </button>
          </div>

          {auditStats.checked && (
            <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
                <div className="text-base sm:text-lg font-bold text-emerald-400 flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  {auditStats.passesCount}
                </div>
                <div className="text-[10px] text-neutral-400 uppercase font-mono-technical">
                  Passed Rules
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
                <div
                  className={`text-base sm:text-lg font-bold flex items-center justify-center gap-1 ${
                    auditStats.violationsCount > 0 ? "text-amber-400" : "text-emerald-400"
                  }`}
                >
                  {auditStats.violationsCount > 0 ? (
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  )}
                  {auditStats.violationsCount}
                </div>
                <div className="text-[10px] text-neutral-400 uppercase font-mono-technical">
                  Violations
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
                <div className="text-base sm:text-lg font-bold text-neutral-300 font-mono">
                  {auditStats.lastRunTime || "Recent"}
                </div>
                <div className="text-[10px] text-neutral-400 uppercase font-mono-technical">
                  Audit Timestamp
                </div>
              </div>
            </div>
          )}

          {auditStats.violationsList && auditStats.violationsList.length > 0 && (
            <div className="mt-3 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 flex flex-col gap-1 max-h-32 overflow-y-auto">
              <div className="font-semibold text-xs flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" /> Detected Accessibility Items:
              </div>
              {auditStats.violationsList.slice(0, 3).map((item) => (
                <div key={item.id} className="text-neutral-300 flex items-start gap-1">
                  <span>•</span>
                  <span>{item.description}</span>
                  <a
                    href={item.helpUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="underline text-amber-400 ml-1 inline-flex items-center"
                    aria-label={`Learn more about ${item.id}`}
                  >
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Feature Toggles List */}
        <div className="flex flex-col gap-3">
          <p className="font-mono-technical text-xs uppercase tracking-widest text-neutral-400">
            Personalized Accessibility Enhancements
          </p>

          {/* 1. High Contrast */}
          <div className="flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors border border-white/10">
            <div className="flex items-center gap-3">
              <Eye className="w-5 h-5 text-neutral-300" />
              <div>
                <h3 className="text-sm font-semibold text-white">High Contrast Mode</h3>
                <p className="text-xs text-neutral-400">
                  Increases contrast for stark legibility and visible borders
                </p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings.highContrast}
              onClick={() => {
                audioSystem.playClick(700);
                updateSetting("highContrast", !settings.highContrast);
              }}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                settings.highContrast ? "bg-emerald-500" : "bg-neutral-700"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  settings.highContrast ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* 2. Font Size Scaling */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3.5 sm:p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors border border-white/10">
            <div className="flex items-center gap-3">
              <Type className="w-5 h-5 text-neutral-300" />
              <div>
                <h3 className="text-sm font-semibold text-white">Font Size Scaling</h3>
                <p className="text-xs text-neutral-400">
                  Scale overall text size for comfortable reading
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 self-end sm:self-auto">
              {(["normal", "large", "larger"] as const).map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => {
                    audioSystem.playClick(650);
                    updateSetting("fontSize", size);
                  }}
                  className={`px-3 py-1 text-xs rounded-xl font-mono-technical uppercase transition-all cursor-pointer ${
                    settings.fontSize === size
                      ? "bg-white text-black font-bold shadow"
                      : "bg-white/10 text-neutral-300 hover:bg-white/20"
                  }`}
                >
                  {size === "normal" ? "100%" : size === "large" ? "115%" : "130%"}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Dyslexia / Legibility Spacing */}
          <div className="flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors border border-white/10">
            <div className="flex items-center gap-3">
              <span className="font-mono text-base font-bold text-neutral-300">Ab</span>
              <div>
                <h3 className="text-sm font-semibold text-white">Enhanced Letter Spacing</h3>
                <p className="text-xs text-neutral-400">
                  Widens line heights and letter spacing for readability
                </p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings.dyslexicSpacing}
              onClick={() => {
                audioSystem.playClick(700);
                updateSetting("dyslexicSpacing", !settings.dyslexicSpacing);
              }}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                settings.dyslexicSpacing ? "bg-emerald-500" : "bg-neutral-700"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  settings.dyslexicSpacing ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* 4. Reduce Motion */}
          <div className="flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors border border-white/10">
            <div className="flex items-center gap-3">
              <ZapOff className="w-5 h-5 text-neutral-300" />
              <div>
                <h3 className="text-sm font-semibold text-white">Reduce Motion</h3>
                <p className="text-xs text-neutral-400">
                  Turns off rapid animations and smooth parallax scrolling
                </p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings.reduceMotion}
              onClick={() => {
                audioSystem.playClick(700);
                updateSetting("reduceMotion", !settings.reduceMotion);
              }}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                settings.reduceMotion ? "bg-emerald-500" : "bg-neutral-700"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  settings.reduceMotion ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* 5. Highlight Focus Outlines */}
          <div className="flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors border border-white/10">
            <div className="flex items-center gap-3">
              <span className="w-5 h-5 rounded border-2 border-dashed border-emerald-400 shrink-0" />
              <div>
                <h3 className="text-sm font-semibold text-white">Prominent Focus Outlines</h3>
                <p className="text-xs text-neutral-400">
                  Highlights keyboard and screen-reader focused elements
                </p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings.focusHighlight}
              onClick={() => {
                audioSystem.playClick(700);
                updateSetting("focusHighlight", !settings.focusHighlight);
              }}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                settings.focusHighlight ? "bg-emerald-500" : "bg-neutral-700"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  settings.focusHighlight ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* 6. Underline Links */}
          <div className="flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors border border-white/10">
            <div className="flex items-center gap-3">
              <span className="underline font-bold text-sm text-neutral-300">A</span>
              <div>
                <h3 className="text-sm font-semibold text-white">Underline All Hyperlinks</h3>
                <p className="text-xs text-neutral-400">
                  Provides high visibility for navigation links throughout the site
                </p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings.underlineLinks}
              onClick={() => {
                audioSystem.playClick(700);
                updateSetting("underlineLinks", !settings.underlineLinks);
              }}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                settings.underlineLinks ? "bg-emerald-500" : "bg-neutral-700"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  settings.underlineLinks ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          <button
            type="button"
            onClick={() => {
              audioSystem.playClick(500);
              resetSettings();
            }}
            className="flex items-center gap-2 text-xs font-mono-technical uppercase text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset Preferences
          </button>

          <button
            type="button"
            onClick={() => {
              audioSystem.playClick(700);
              closeModal();
            }}
            className="px-5 py-2 rounded-xl bg-white text-black font-semibold text-xs uppercase tracking-wider hover:bg-neutral-200 transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
