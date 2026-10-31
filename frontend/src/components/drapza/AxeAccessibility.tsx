"use client";

import { useEffect } from "react";
import React from "react";

export function AxeAccessibility() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" && typeof window !== "undefined") {
      // @ts-ignore
      import("@axe-core/react" as any)
        .then((axeModule: any) => {
          const axeFn = axeModule.default || axeModule;
          if (typeof axeFn === "function") {
            axeFn(React, (React as any), 2000, {
              rules: [
                { id: "color-contrast", enabled: false }, // Avoid false-positive spam during dynamic scroll/opacity animations
                { id: "image-alt", enabled: true },
                { id: "button-name", enabled: true },
                { id: "link-name", enabled: true },
              ],
            });
            console.log(
              "%c[axe-core/react]%c Accessibility auditing active on DOM updates.",
              "background: #10b981; color: #fff; font-weight: bold; padding: 2px 6px; border-radius: 4px;",
              "color: inherit; margin-left: 6px;"
            );
          }
        })
        .catch((err) => {
          console.warn("[axe-core/react] Notice:", err);
        });
    }
  }, []);

  return null;
}
