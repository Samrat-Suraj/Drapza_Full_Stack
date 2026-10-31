"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

interface AccessibilitySettings {
  highContrast: boolean;
  fontSize: "normal" | "large" | "larger";
  dyslexicSpacing: boolean;
  reduceMotion: boolean;
  focusHighlight: boolean;
  underlineLinks: boolean;
}

interface AuditStats {
  checked: boolean;
  violationsCount: number;
  passesCount: number;
  incompleteCount: number;
  lastRunTime?: string;
  violationsList?: Array<{ id: string; impact: string; description: string; helpUrl: string }>;
}

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  updateSetting: <K extends keyof AccessibilitySettings>(key: K, value: AccessibilitySettings[K]) => void;
  resetSettings: () => void;
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  toggleModal: () => void;
  auditStats: AuditStats;
  runAxeAudit: () => Promise<void>;
  isAuditing: boolean;
}

const defaultSettings: AccessibilitySettings = {
  highContrast: false,
  fontSize: "normal",
  dyslexicSpacing: false,
  reduceMotion: false,
  focusHighlight: false,
  underlineLinks: false,
};

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AccessibilitySettings>(defaultSettings);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditStats, setAuditStats] = useState<AuditStats>({
    checked: false,
    violationsCount: 0,
    passesCount: 0,
    incompleteCount: 0,
  });

  // Load saved preferences
  useEffect(() => {
    try {
      const saved = localStorage.getItem("drapza_a11y_settings");
      if (saved) {
        setSettings({ ...defaultSettings, ...JSON.parse(saved) });
      }
    } catch {
      // ignore
    }
  }, []);

  // Sync DOM classes whenever settings change
  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;

    // High Contrast
    if (settings.highContrast) {
      root.classList.add("a11y-high-contrast");
    } else {
      root.classList.remove("a11y-high-contrast");
    }

    // Font Size
    root.classList.remove("a11y-text-large", "a11y-text-larger");
    if (settings.fontSize === "large") root.classList.add("a11y-text-large");
    if (settings.fontSize === "larger") root.classList.add("a11y-text-larger");

    // Dyslexic Spacing
    if (settings.dyslexicSpacing) {
      root.classList.add("a11y-dyslexic-spacing");
    } else {
      root.classList.remove("a11y-dyslexic-spacing");
    }

    // Reduce Motion
    if (settings.reduceMotion) {
      root.classList.add("a11y-reduce-motion");
    } else {
      root.classList.remove("a11y-reduce-motion");
    }

    // Focus Highlight
    if (settings.focusHighlight) {
      root.classList.add("a11y-focus-highlight");
    } else {
      root.classList.remove("a11y-focus-highlight");
    }

    // Underline Links
    if (settings.underlineLinks) {
      root.classList.add("a11y-underline-links");
    } else {
      root.classList.remove("a11y-underline-links");
    }

    try {
      localStorage.setItem("drapza_a11y_settings", JSON.stringify(settings));
    } catch {
      // ignore
    }
  }, [settings]);

  const updateSetting = <K extends keyof AccessibilitySettings>(key: K, value: AccessibilitySettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
  };

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);
  const toggleModal = () => setIsModalOpen((prev) => !prev);

  // Run Axe-Core audit on demand
  const runAxeAudit = useCallback(async () => {
    if (typeof window === "undefined") return;
    setIsAuditing(true);
    try {
      // @ts-ignore
      const axe = await import("axe-core" as any);
      const results = await axe.run(document, {
        runOnly: {
          type: "tag",
          values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"],
        },
      });

      const formattedViolations = results.violations.map((v) => ({
        id: v.id,
        impact: v.impact || "moderate",
        description: v.description,
        helpUrl: v.helpUrl,
      }));

      setAuditStats({
        checked: true,
        violationsCount: results.violations.length,
        passesCount: results.passes.length,
        incompleteCount: results.incomplete.length,
        lastRunTime: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        violationsList: formattedViolations,
      });

      console.groupCollapsed(
        `%c[axe-core] Accessibility Audit Report: ${results.violations.length} violations, ${results.passes.length} passed`,
        "color: #10b981; font-weight: bold;"
      );
      if (results.violations.length > 0) {
        console.warn("Axe-Core Violations:", results.violations);
      } else {
        console.info("Congratulations! 100% WCAG checks passed with axe-core.");
      }
      console.groupEnd();
    } catch (err) {
      console.error("Axe-Core audit error:", err);
    } finally {
      setIsAuditing(false);
    }
  }, []);

  return (
    <AccessibilityContext.Provider
      value={{
        settings,
        updateSetting,
        resetSettings,
        isModalOpen,
        openModal,
        closeModal,
        toggleModal,
        auditStats,
        runAxeAudit,
        isAuditing,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error("useAccessibility must be used within an AccessibilityProvider");
  }
  return context;
}
