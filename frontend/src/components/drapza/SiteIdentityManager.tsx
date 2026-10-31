"use client";

import { useEffect, useRef } from "react";
import { siteConfigApi, DEFAULT_SITE_CONFIG, SiteConfigData } from "@/lib/api";

const CACHE_KEY = "drapza_site_identity_config";

export function SiteIdentityManager() {
  const configRef = useRef<SiteConfigData>(DEFAULT_SITE_CONFIG);

  const applyConfig = (config: SiteConfigData, broadcast = true) => {
    configRef.current = config;

    // 1. Update Browser Tab Title
    if (config.siteTitle) {
      document.title = config.siteTitle;
    }

    // 2. Update Favicon
    if (config.faviconUrl) {
      let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
      if (!link) {
        link = document.createElement("link");
        link.type = "image/x-icon";
        link.rel = "shortcut icon";
        document.getElementsByTagName("head")[0].appendChild(link);
      }
      link.href = config.faviconUrl;
    }

    // 3. Update Meta Description
    if (config.siteDescription) {
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement("meta");
        metaDesc.setAttribute("name", "description");
        document.getElementsByTagName("head")[0].appendChild(metaDesc);
      }
      metaDesc.setAttribute("content", config.siteDescription);
    }

    // 4. Update OpenGraph Tags
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle && config.siteTitle) {
      ogTitle.setAttribute("content", config.siteTitle);
    }

    // 5. Broadcast to all mounted components (Headers, Footers, Logos)
    if (broadcast && typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("drapza_site_config_updated", { detail: config })
      );
    }
  };

  useEffect(() => {
    // A. Read cached config immediately to prevent title flicker
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        applyConfig(parsed);
      }
    } catch (e) {
      // fallback
    }

    // B. Fetch fresh configuration from server
    let isMounted = true;
    const fetchFresh = async () => {
      try {
        const res = await siteConfigApi.getSiteConfig();
        if (isMounted && res.success && res.data) {
          applyConfig(res.data);
          try {
            localStorage.setItem(CACHE_KEY, JSON.stringify(res.data));
          } catch (e) {}
        }
      } catch (err) {
        // Fallback silently
      }
    };
    fetchFresh();

    // C. Listen for Admin live update event
    const handleUpdate = (e: any) => {
      if (e.detail) {
        applyConfig(e.detail, false);
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(e.detail));
        } catch (err) {}
      } else {
        fetchFresh();
      }
    };

    // D. Inactive Tab Title switcher (e.g. Come back to Atelier)
    const handleVisibilityChange = () => {
      const cfg = configRef.current;
      if (!cfg.enableInactiveTabNotice || !cfg.inactiveTabTitle) return;

      if (document.hidden) {
        document.title = cfg.inactiveTabTitle;
      } else {
        document.title = cfg.siteTitle || DEFAULT_SITE_CONFIG.siteTitle;
      }
    };

    window.addEventListener("drapza_site_config_updated", handleUpdate);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      isMounted = false;
      window.removeEventListener("drapza_site_config_updated", handleUpdate);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return null;
}
