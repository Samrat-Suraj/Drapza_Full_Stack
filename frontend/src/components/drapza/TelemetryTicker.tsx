"use client";

import { useEffect, useState } from "react";
import { Radio } from "lucide-react";
import { siteConfigApi } from "@/lib/api";
import Link from "next/link";

const DEFAULT_MESSAGES = [
  "BATCH #04 DISPATCH LIVE — LIMITED QUANTITIES AVAILABLE",
  "WORLDWIDE EXPRESS SHIPPING ACTIVE FOR ALL MODULES",
  "ARCHIVAL NEUTRAL OVERSHIRTS RESTOCKED IN SECTOR N",
  "SYSTEM 021 READY FOR FRICTIONLESS TRANSMISSION",
];

export function TelemetryTicker() {
  const [messages, setMessages] = useState<string[]>(DEFAULT_MESSAGES);
  const [enabled, setEnabled] = useState(true);
  const [linkUrl, setLinkUrl] = useState("/wardrobe");
  const [intervalSec, setIntervalSec] = useState(4.5);
  const [msgIdx, setMsgIdx] = useState(0);

  useEffect(() => {
    siteConfigApi
      .getSiteConfig()
      .then((res) => {
        const cfg = (res as any).config || res.data;
        if (cfg) {
          if (cfg.announcementEnabled !== undefined) setEnabled(cfg.announcementEnabled);
          if (Array.isArray(cfg.announcementMessages) && cfg.announcementMessages.length > 0) {
            setMessages(cfg.announcementMessages);
          }
          if (cfg.announcementLinkUrl) setLinkUrl(cfg.announcementLinkUrl);
          if (cfg.announcementIntervalSeconds) setIntervalSec(cfg.announcementIntervalSeconds);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!messages.length) return;
    const timer = setInterval(() => {
      setMsgIdx((prev) => (prev + 1) % messages.length);
    }, intervalSec * 1000);
    return () => clearInterval(timer);
  }, [messages, intervalSec]);

  if (!enabled || !messages.length) return null;

  return (
    <Link
      href={linkUrl}
      className="w-full bg-[#0a0a0a] hover:bg-black text-neutral-300 hover:text-white py-2 px-4 border-b border-white/10 flex items-center justify-center gap-3 overflow-hidden select-none transition-colors group cursor-pointer z-50 relative"
    >
      <Radio className="h-3 w-3 text-white animate-pulse flex-shrink-0" />
      <span className="font-mono-technical text-[10px] sm:text-xs uppercase tracking-[0.2em] font-medium transition-all duration-500 animate-fade-in text-center group-hover:underline">
        {messages[msgIdx]}
      </span>
    </Link>
  );
}
