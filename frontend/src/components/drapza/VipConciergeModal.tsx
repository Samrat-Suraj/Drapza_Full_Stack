"use client";

import { useState, useEffect, useRef } from "react";
import {
  X,
  MessageSquare,
  Scissors,
  Shield,
  Clock,
  ArrowUpRight,
  Check,
} from "lucide-react";
import { audioSystem } from "./AudioSystem";
import { useLockBodyScroll } from "./useLockBodyScroll";

interface VipConciergeModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTopic?: string;
}

const CONCIERGE_TOPICS = [
  {
    id: "bespoke-sizing",
    title: "BESPOKE SIZING & MEASUREMENTS",
    subtext: "Connect with a Master Tailor for customized shoulder drop and torso fit.",
    message: "Hello Drapza Atelier, I require bespoke sizing consultation for my upcoming custom fit.",
  },
  {
    id: "capsule-styling",
    title: "PERSONAL SILHOUETTE STYLING",
    subtext: "Request a 1-on-1 private styling curation for formal or nocturnal events.",
    message: "Hello Drapza Atelier, I would like personal stylist assistance to curate a capsule wardrobe.",
  },
  {
    id: "white-glove-delivery",
    title: "EXPEDITED WHITE GLOVE LOGISTICS",
    subtext: "Inquire about priority dispatch and private atelier courier services.",
    message: "Hello Drapza Atelier, I have an expedited order inquiry regarding white glove delivery.",
  },
  {
    id: "fabric-inquiry",
    title: "480 GSM FABRIC & MONOGRAM INQUIRY",
    subtext: "Ask about fabric weight, custom embroidery tags, and material care.",
    message: "Hello Drapza Atelier, I would like to consult on your 480 GSM fabric standards and custom monogramming.",
  },
];

export function VipConciergeModal({ isOpen, onClose, defaultTopic = "bespoke-sizing" }: VipConciergeModalProps) {
  useLockBodyScroll(isOpen);

  const [selectedTopicId, setSelectedTopicId] = useState(defaultTopic);
  const [clientName, setClientName] = useState("");
  const [city, setCity] = useState("");

  const modalCardRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Mouse wheel listener with requestAnimationFrame
  useEffect(() => {
    if (!isOpen) return;
    const el = scrollContainerRef.current;
    const cardEl = modalCardRef.current;
    if (!el || !cardEl) return;

    let target = el.scrollTop;
    let current = el.scrollTop;
    let running = false;
    let animId: number | null = null;

    const loop = () => {
      const diff = target - current;
      if (Math.abs(diff) > 0.5) {
        current += diff * 0.25;
        el.scrollTop = current;
        animId = requestAnimationFrame(loop);
      } else {
        current = target;
        el.scrollTop = target;
        running = false;
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.stopPropagation();
      e.preventDefault();
      const max = el.scrollHeight - el.clientHeight;
      if (max <= 0) return;
      if (!running) {
        target = el.scrollTop;
        current = el.scrollTop;
        running = true;
        animId = requestAnimationFrame(loop);
      }
      target = Math.max(0, Math.min(max, target + e.deltaY));
    };

    cardEl.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      cardEl.removeEventListener("wheel", onWheel);
      if (animId) cancelAnimationFrame(animId);
    };
  }, [isOpen]);

  const handleLaunchWhatsApp = () => {
    audioSystem.playClick(900);
    const selected = CONCIERGE_TOPICS.find((t) => t.id === selectedTopicId) || CONCIERGE_TOPICS[0];
    
    let text = selected.message;
    if (clientName.trim()) {
      text += ` Client Name: ${clientName.trim()}.`;
    }
    if (city.trim()) {
      text += ` Location: ${city.trim()}.`;
    }

    const encoded = encodeURIComponent(text);
    const waUrl = `https://wa.me/918888333038?text=${encoded}`;
    window.open(waUrl, "_blank", "noopener,noreferrer");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      data-lenis-prevent="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto overscroll-contain font-mono text-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalCardRef}
        data-lenis-prevent="true"
        className="relative w-full max-w-xl bg-[#141518] border border-neutral-700 shadow-2xl animate-scaleUp my-auto flex flex-col max-h-[90vh] overflow-hidden rounded-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          data-lenis-prevent="true"
          className="flex items-center justify-between border-b border-neutral-800 px-6 py-4 sm:px-7 sm:py-5 shrink-0 bg-[#141518]"
        >
          <div className="flex items-center gap-3">
            <span className="p-2 bg-neutral-900 border border-neutral-700 text-white">
              <MessageSquare className="w-4 h-4" />
            </span>
            <div>
              <span className="text-[10px] text-neutral-400 uppercase tracking-widest font-bold block">
                DIRECT ATELIER LINK
              </span>
              <h2 className="text-sm sm:text-base font-bold uppercase text-white">
                VIP MASTER TAILOR CONCIERGE
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div
          ref={scrollContainerRef}
          data-lenis-prevent="true"
          className="overflow-y-auto flex-1 p-6 sm:p-8 space-y-6 dark-scrollbar min-h-0"
        >
          {/* Atelier Status Banner */}
          <div className="p-4 bg-[#18191d] border border-neutral-800 flex items-center justify-between text-neutral-400 text-[10px] uppercase">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-white font-bold">ATELIER DESK ACTIVE</span>
            </div>
            <span>MON - SAT • 10:00 - 20:00 IST</span>
          </div>

          {/* Consultation Topic Selector */}
          <div className="space-y-2">
            <span className="text-neutral-300 uppercase font-bold block text-xs">
              SELECT CONSULTATION SUBJECT
            </span>

            <div className="space-y-2.5">
              {CONCIERGE_TOPICS.map((topic) => (
                <button
                  key={topic.id}
                  type="button"
                  onClick={() => {
                    audioSystem.playClick(650);
                    setSelectedTopicId(topic.id);
                  }}
                  className={`w-full text-left p-3.5 border transition-all cursor-pointer ${
                    selectedTopicId === topic.id
                      ? "bg-white text-black border-white"
                      : "bg-[#18191d] text-neutral-300 border-neutral-800 hover:border-neutral-600"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold uppercase text-xs">
                      {topic.title}
                    </span>
                    {selectedTopicId === topic.id && <Check className="w-4 h-4 shrink-0 stroke-[2.5]" />}
                  </div>
                  <p
                    className={`text-[10px] mt-1 leading-relaxed ${
                      selectedTopicId === topic.id ? "text-neutral-800" : "text-neutral-500"
                    }`}
                  >
                    {topic.subtext}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Client Details (Optional) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-neutral-300 uppercase font-bold block text-xs">
                CLIENT NAME (OPTIONAL)
              </label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value.toUpperCase())}
                placeholder="e.g. VIKRAM S."
                className="w-full bg-[#1c1d22] border border-neutral-700 focus:border-white p-2.5 text-white font-mono uppercase text-xs rounded-none focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-neutral-300 uppercase font-bold block text-xs">
                CITY / LOCATION
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value.toUpperCase())}
                placeholder="e.g. MUMBAI"
                className="w-full bg-[#1c1d22] border border-neutral-700 focus:border-white p-2.5 text-white font-mono uppercase text-xs rounded-none focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Pinned Action Buttons */}
        <div
          data-lenis-prevent="true"
          className="p-4 sm:px-7 sm:py-4 border-t border-neutral-800 bg-[#101114] flex items-center justify-between gap-3 shrink-0"
        >
          <span className="text-[10px] text-neutral-500 uppercase">
            END-TO-END ENCRYPTED CONCIERGE
          </span>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 font-bold uppercase cursor-pointer transition-colors"
            >
              CANCEL
            </button>

            <button
              type="button"
              onClick={handleLaunchWhatsApp}
              className="px-6 py-2.5 bg-white hover:bg-neutral-200 text-black font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-colors"
            >
              <span>CONNECT ON WHATSAPP</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

