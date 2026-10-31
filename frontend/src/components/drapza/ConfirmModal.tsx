"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  AlertTriangle,
  RotateCcw,
  Trash2,
  HelpCircle,
  X,
  Check,
  ShieldAlert,
  Info,
} from "lucide-react";
import { audioSystem } from "./AudioSystem";
import { useLockBodyScroll } from "./useLockBodyScroll";

export interface ConfirmModalProps {
  isOpen: boolean;
  title?: string;
  subtitle?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  variant?: "warning" | "danger" | "reset" | "info" | "prompt";
  type?: "confirm" | "alert" | "prompt";
  theme?: "drapza" | "dark" | "auto";
  promptPlaceholder?: string;
  initialPromptValue?: string;
  onConfirm: (promptValue?: string) => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title = "CONFIRMATION REQUIRED",
  subtitle = "[ ATELIER PROTOCOL ]",
  message,
  confirmLabel = "PROCEED",
  cancelLabel = "CANCEL",
  isDestructive = false,
  variant = "warning",
  type = "confirm",
  theme = "auto",
  promptPlaceholder = "Enter value...",
  initialPromptValue = "",
  onConfirm,
  onCancel,
}) => {
  useLockBodyScroll(isOpen);
  const [promptText, setPromptText] = useState(initialPromptValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPromptText(initialPromptValue);
      audioSystem.playClick(600, 0.04);
      if (type === "prompt") {
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    }
  }, [isOpen, initialPromptValue, type]);

  // Keyboard accessibility
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        audioSystem.playClick(350, 0.05);
        onCancel();
      } else if (e.key === "Enter" && (type !== "prompt" || promptText.trim())) {
        audioSystem.playClick(850, 0.05);
        onConfirm(promptText.trim());
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onCancel, onConfirm, promptText, type]);

  if (!isOpen) return null;

  // Detect whether we are on the storefront (drapza theme) or admin dashboard
  const isDrapzaTheme =
    theme === "drapza" ||
    (theme === "auto" && typeof document !== "undefined" && !document.querySelector("[data-admin-root]"));

  if (isDrapzaTheme) {
    return (
      <div
        role="dialog"
        aria-modal="true"
        data-lenis-prevent="true"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            audioSystem.playClick(350, 0.05);
            onCancel();
          }
        }}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 99999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1.25rem",
          backgroundColor: "rgba(15, 15, 15, 0.68)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
          userSelect: "none",
        }}
      >
        <div
          data-lenis-prevent="true"
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "relative",
            width: "100%",
            maxWidth: "460px",
            backgroundColor: "var(--base-100, #edf1e8)",
            border: "1px solid var(--base-300, #afb3ab)",
            borderRadius: "0.75rem",
            padding: "1.75rem 2rem",
            boxShadow: "0 20px 50px rgba(0, 0, 0, 0.28)",
            fontFamily: "var(--font-dm-mono), monospace",
            boxSizing: "border-box",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: "0.85rem",
              paddingBottom: "1.15rem",
              borderBottom: "1px solid var(--base-300, #afb3ab)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  minWidth: "40px",
                  borderRadius: "8px",
                  border: "1px solid var(--base-300, #afb3ab)",
                  backgroundColor: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {isDestructive || variant === "danger" ? (
                  <Trash2 size={18} color="#dc2626" stroke="#dc2626" style={{ width: "18px", height: "18px", flexShrink: 0 }} />
                ) : variant === "reset" ? (
                  <RotateCcw size={18} color="#d97706" stroke="#d97706" style={{ width: "18px", height: "18px", flexShrink: 0 }} />
                ) : (
                  <AlertTriangle size={18} color="#d97706" stroke="#d97706" style={{ width: "18px", height: "18px", flexShrink: 0 }} />
                )}
              </div>
              <div>
                <span
                  style={{
                    display: "block",
                    fontFamily: "var(--font-dm-mono), monospace",
                    fontSize: "0.68rem",
                    fontWeight: 600,
                    color: "var(--base-500, #7d807a)",
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                    marginBottom: "0.2rem",
                    lineHeight: 1.2,
                  }}
                >
                  {subtitle}
                </span>
                <h3
                  style={{
                    margin: 0,
                    fontFamily: "var(--font-dm-mono), monospace",
                    fontSize: "1.02rem",
                    fontWeight: 700,
                    color: "var(--base-700, #0f0f0f)",
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                    lineHeight: 1.25,
                  }}
                >
                  {title}
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                audioSystem.playClick(350, 0.05);
                onCancel();
              }}
              aria-label="Close"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--base-500, #7d807a)",
                padding: "0.25rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <X size={18} strokeWidth={2} style={{ width: "18px", height: "18px" }} />
            </button>
          </div>

          {/* Message Content */}
          <div style={{ padding: "1.25rem 0" }}>
            <p
              style={{
                margin: 0,
                fontFamily: "var(--font-dm-mono), monospace",
                fontSize: "0.8rem",
                fontWeight: 400,
                color: "var(--base-600, #1f1f1f)",
                lineHeight: 1.5,
                textTransform: "none",
              }}
            >
              {message}
            </p>

            {type === "prompt" && (
              <div style={{ marginTop: "1rem" }}>
                <input
                  ref={inputRef}
                  type="text"
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  placeholder={promptPlaceholder}
                  style={{
                    width: "100%",
                    height: "44px",
                    padding: "0 1rem",
                    borderRadius: "0.5rem",
                    border: "1px solid var(--base-300, #afb3ab)",
                    backgroundColor: "#ffffff",
                    color: "var(--base-700, #0f0f0f)",
                    fontFamily: "var(--font-dm-mono), monospace",
                    fontSize: "0.82rem",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            )}
          </div>

          {/* Modal Actions */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: "0.75rem",
              paddingTop: "0.5rem",
            }}
          >
            {type !== "alert" && (
              <button
                type="button"
                onClick={() => {
                  audioSystem.playClick(400, 0.04);
                  onCancel();
                }}
                style={{
                  height: "44px",
                  borderRadius: "0.5rem",
                  border: "1px solid var(--base-300, #afb3ab)",
                  backgroundColor: "#ffffff",
                  color: "var(--base-700, #0f0f0f)",
                  fontFamily: "var(--font-dm-mono), monospace",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                  padding: "0 1.25rem",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  boxSizing: "border-box",
                }}
              >
                {cancelLabel}
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                audioSystem.playSuccess();
                onConfirm(promptText.trim());
              }}
              style={{
                height: "44px",
                borderRadius: "0.5rem",
                border: isDestructive || variant === "danger" ? "1px solid #dc2626" : "1px solid var(--base-700, #0f0f0f)",
                backgroundColor: isDestructive || variant === "danger" ? "#dc2626" : "var(--base-700, #0f0f0f)",
                color: "#ffffff",
                fontFamily: "var(--font-dm-mono), monospace",
                fontSize: "0.78rem",
                fontWeight: 600,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                padding: "0 1.35rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                transition: "all 0.15s ease",
                boxSizing: "border-box",
              }}
            >
              {isDestructive || variant === "danger" ? (
                <Trash2 size={14} color="#ffffff" stroke="#ffffff" style={{ width: "14px", height: "14px", minWidth: "14px", flexShrink: 0 }} />
              ) : (
                <Check size={14} strokeWidth={2.5} color="#ffffff" stroke="#ffffff" style={{ width: "14px", height: "14px", minWidth: "14px", flexShrink: 0 }} />
              )}
              <span style={{ color: "#ffffff", fontFamily: "var(--font-dm-mono), monospace", fontWeight: 600 }}>
                {confirmLabel}
              </span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Dark Admin Theme with bulletproof inline styles to prevent global typography overrides
  const getIcon = () => {
    switch (variant) {
      case "danger":
        return <Trash2 className="w-5 h-5 text-red-500" style={{ width: "20px", height: "20px" }} />;
      case "reset":
        return <RotateCcw className="w-5 h-5 text-amber-400" style={{ width: "20px", height: "20px" }} />;
      case "info":
        return <Info className="w-5 h-5 text-neutral-300" style={{ width: "20px", height: "20px" }} />;
      case "prompt":
        return <ShieldAlert className="w-5 h-5 text-amber-400" style={{ width: "20px", height: "20px" }} />;
      default:
        return <AlertTriangle className="w-5 h-5 text-amber-400" style={{ width: "20px", height: "20px" }} />;
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      data-lenis-prevent="true"
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 select-none animate-fadeIn"
    >
      {/* Dimmed Blurred Backdrop */}
      <div
        onClick={() => {
          audioSystem.playClick(350, 0.05);
          onCancel();
        }}
        className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-300"
      />

      {/* Luxury Atelier Modal Card */}
      <div
        data-lenis-prevent="true"
        className="relative w-full max-w-md bg-[#121316] border border-[#26272e] rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/80 space-y-6 transform transition-all duration-300 animate-scaleUp"
      >
        {/* Subtle decorative grid lines */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-halftone opacity-20 pointer-events-none rounded-tr-3xl" />

        {/* Modal Header */}
        <div className="flex items-start justify-between gap-3 pb-4 border-b border-[#24252d]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#1c1d24] border border-[#2b2c36]">
              {getIcon()}
            </div>
            <div>
              <span
                style={{ color: "#a1a1aa", fontSize: "10px", lineHeight: "1.2" }}
                className="font-mono-technical tracking-widest uppercase block mb-0.5"
              >
                {subtitle}
              </span>
              <h3
                style={{ fontSize: "1.1rem", lineHeight: "1.25", margin: 0, color: "#ffffff" }}
                className="font-display uppercase tracking-tight"
              >
                {title}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              audioSystem.playClick(350, 0.05);
              onCancel();
            }}
            className="text-neutral-400 hover:text-white p-1.5 rounded-xl hover:bg-[#1c1d24] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" style={{ width: "16px", height: "16px" }} />
          </button>
        </div>

        {/* Message Content */}
        <div className="space-y-4">
          <p
            style={{ color: "#d4d4d8", fontSize: "0.82rem", lineHeight: "1.5", margin: 0 }}
            className="font-mono-technical leading-relaxed"
          >
            {message}
          </p>

          {/* Optional Prompt Input */}
          {type === "prompt" && (
            <div className="space-y-1.5 pt-1">
              <input
                ref={inputRef}
                type="text"
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                placeholder={promptPlaceholder}
                className="w-full px-4 py-3 rounded-xl bg-[#1c1d24] border border-[#30313d] text-white font-mono-technical text-xs placeholder:text-neutral-500 focus:outline-none focus:border-white transition-colors"
              />
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          {type !== "alert" && (
            <button
              type="button"
              onClick={() => {
                audioSystem.playClick(400, 0.04);
                onCancel();
              }}
              style={{ color: "#e4e4e7" }}
              className="px-5 py-2.5 rounded-xl bg-[#1c1d24] hover:bg-[#252731] border border-[#2b2c36] font-mono-technical text-xs uppercase tracking-wider font-bold transition-all cursor-pointer"
            >
              {cancelLabel}
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              audioSystem.playSuccess();
              onConfirm(promptText.trim());
            }}
            style={{ color: "#ffffff" }}
            className={`px-6 py-2.5 rounded-xl font-mono-technical text-xs uppercase tracking-wider font-bold transition-all flex items-center gap-2 cursor-pointer shadow-lg ${
              isDestructive || variant === "danger"
                ? "bg-red-600 hover:bg-red-500 shadow-red-950/40"
                : "bg-white hover:bg-neutral-100 text-black shadow-white/10"
            }`}
          >
            <Check className="w-3.5 h-3.5" style={{ width: "14px", height: "14px", flexShrink: 0 }} />
            <span style={{ color: isDestructive || variant === "danger" ? "#ffffff" : "#000000" }}>{confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
