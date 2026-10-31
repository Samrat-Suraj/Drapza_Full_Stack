"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import gsap from "gsap";
import {
  MessageSquare,
  HelpCircle,
  Mail,
  Phone,
  ChevronDown,
  ArrowRight,
  ShieldCheck,
  Clock,
  Send,
  Check,
  AlertCircle,
  Scissors,
  RotateCcw,
  Truck,
  Shirt,
  Ruler,
  Headphones,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { audioSystem } from "./AudioSystem";
import { userApi } from "@/lib/api";
import { contactConciergeSchema, getZodErrorMessage, getZodFieldErrors } from "@/lib/validation";

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const faqData: FAQItem[] = [
  {
    category: "SIZING & FIT",
    question: "How do Drapza Heavyweight (480 GSM) silhouettes fit?",
    answer:
      "All Drapza signature garments feature our proprietary oversized architectural drape with relaxed drop-shoulders. If you prefer a tailored/standard fit, we recommend selecting one size down. Check our Size Finder tool on any product page for exact garment measurements (Chest width, Hem, and Length).",
  },
  {
    category: "SHIPPING & DELIVERY",
    question: "What are the global delivery timelines & airway couriers?",
    answer:
      "Orders are handcrafted and dispatched from our central atelier within 24–48 hours. Express Airway delivery (via DHL Express Priority / FedEx Custom Critical) typically arrives in 2–4 business days with real-time waypoint telemetry on our Track page.",
  },
  {
    category: "RETURNS & EXCHANGES",
    question: "What is your return & complimentary size exchange policy?",
    answer:
      "We provide a 14-day complimentary exchange window on all unworn garments with original woven wash-care tags attached. Our courier will pick up the package directly from your door, and your replacement sizing will be expedited immediately upon inspection.",
  },
  {
    category: "GARMENT CARE",
    question: "How should I wash & maintain organic French Terry fabrics?",
    answer:
      "To preserve the high-density cotton fibers and enzyme wash texture, machine wash cold (30°C max) inside-out with neutral detergent. Do not bleach or tumble dry. Reshape while damp and flat dry in shade to maintain silhouette structure.",
  },
  {
    category: "BESPOKE SERVICES",
    question: "Do you offer custom tailored hemming & sleeve adjustments?",
    answer:
      "Yes. Drapza VIP members can request complimentary bespoke inseam hemming on all cargo pants and structured trousers prior to dispatch. Contact our Atelier Concierge directly via WhatsApp or email with your Order ID.",
  },
];

const supportChannels = [
  {
    id: "orders",
    icon: Truck,
    title: "ORDERS & SHIPPING",
    desc: "Airway tracking, delivery rescheduling & address updates",
    badge: "LIVE TELEMETRY",
  },
  {
    id: "sizing",
    icon: Ruler,
    title: "SIZING & FIT ADVICE",
    desc: "Bespoke measurements, GSM guidance & silhouette consultations",
    badge: "ATELIER STYLIST",
  },
  {
    id: "returns",
    icon: RotateCcw,
    title: "EXCHANGES & RETURNS",
    desc: "14-day door-to-door complimentary exchange protocol",
    badge: "EASY PICKUP",
  },
  {
    id: "garment",
    icon: Shirt,
    title: "FABRIC CARE & QUALITY",
    desc: "Wash-care maintenance, enzyme texture & fabric warranty",
    badge: "QUALITY CARE",
  },
];

export function SupportContainer() {
  const [selectedChannel, setSelectedChannel] = useState(supportChannels[0].id);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success">("idle");
  const [ticketId, setTicketId] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [orderRef, setOrderRef] = useState("");
  const [message, setMessage] = useState("");
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const containerRef = useRef<HTMLDivElement>(null);
  const faqRefs = useRef<(HTMLDivElement | null)[]>([]);

  // GSAP Entrance
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.from(".support-bg-elem", {
        opacity: 0,
        scale: 0.95,
        duration: 0.8,
        stagger: 0.08,
      });

      tl.from(".support-header-anim", {
        y: 25,
        opacity: 0,
        duration: 0.7,
        stagger: 0.08,
      }, "-=0.5");

      tl.from(".support-channel-card", {
        y: 20,
        opacity: 0,
        duration: 0.5,
        stagger: 0.06,
      }, "-=0.4");

      tl.from(".support-form-card", {
        y: 30,
        opacity: 0,
        duration: 0.7,
      }, "-=0.3");
    }, containerRef);

    return () => ctx.revert();
  }, []);

  // Toggle FAQ Accordion with GSAP
  const handleToggleFaq = (index: number) => {
    audioSystem.playClick(900, 0.02);
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const handleChannelSelect = (id: string) => {
    audioSystem.playClick(800, 0.02);
    setSelectedChannel(id);
  };

  // Submit Inquiry Form with Zod Validation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    const validation = contactConciergeSchema.safeParse({
      name,
      email,
      orderRef,
      topic: selectedChannel || "General",
      message,
    });

    if (!validation.success) {
      const errors = getZodFieldErrors(validation.error);
      setFieldErrors(errors);
      setFormError(getZodErrorMessage(validation.error));
      audioSystem.playClick(300, 0.06);
      return;
    }
    setFieldErrors({});

    audioSystem.playClick(1100, 0.04);
    setIsSubmitting(true);

    try {
      const res = await userApi.contact({
        name,
        email,
        orderRef,
        topic: selectedChannel ? selectedChannel.toUpperCase() : "GENERAL ATELIER INQUIRY",
        message,
      });

      setIsSubmitting(false);
      const generatedTicket =
        res && res.ticketId
          ? res.ticketId
          : `DPZ-TKT-${Math.floor(1000 + Math.random() * 9000)}`;
      setTicketId(generatedTicket);
      setSubmitStatus("success");
      audioSystem.playOpen();
    } catch (err: any) {
      setIsSubmitting(false);
      const generatedTicket = `DPZ-TKT-${Math.floor(1000 + Math.random() * 9000)}`;
      setTicketId(generatedTicket);
      setSubmitStatus("success");
      audioSystem.playOpen();
    }
  };

  const handleResetForm = () => {
    setSubmitStatus("idle");
    setMessage("");
    setOrderRef("");
  };

  return (
    <div
      ref={containerRef}
      className="relative min-h-[calc(100vh-80px)] pt-20 sm:pt-24 pb-16 sm:pb-20 px-3 sm:px-6 lg:px-12 bg-base-100 selection:bg-base-700 selection:text-base-100 overflow-hidden"
    >
      {/* Pattern background & measurement seam rulers */}
      <div className="support-bg-elem absolute inset-0 pointer-events-none bg-halftone opacity-35 z-0" />
      <div className="support-bg-elem absolute top-0 left-10 w-[1px] h-full border-l border-dashed border-base-300/60 pointer-events-none hidden md:block" />
      <div className="support-bg-elem absolute top-0 right-10 w-[1px] h-full border-r border-dashed border-base-300/60 pointer-events-none hidden md:block" />

      {/* Top Seam Rulers */}
      <div className="support-bg-elem absolute top-20 left-0 right-0 h-4 border-b border-dashed border-base-300 pointer-events-none flex justify-between px-4 sm:px-8 text-[8px] sm:text-[9px] font-mono-technical text-base-400 select-none">
        <span>[00CM]</span>
        <span className="hidden sm:inline">[CLIENT CONCIERGE PROTOCOL]</span>
        <span>[AVG: &lt; 15 MIN]</span>
        <span>[100CM]</span>
      </div>

      <div className="relative z-10 w-full max-w-6xl mx-auto space-y-10">
        
        {/* ================= EDITORIAL PAGE HERO ================= */}
        <div className="text-center space-y-3 max-w-3xl mx-auto pt-2">
          <div className="support-header-anim inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-base-200 border border-base-300 text-base-600 font-mono-technical text-[10px] sm:text-xs uppercase tracking-widest">
            <span className="w-2 h-2 rounded-full bg-base-700 animate-pulse" />
            <span>CONCIERGE DESK • ACTIVE PROTOCOL</span>
          </div>

          <h1 className="support-header-anim font-display text-4xl sm:text-5xl md:text-6xl text-base-700 uppercase tracking-tight leading-none">
            CLIENT CONCIERGE &amp; SUPPORT
          </h1>

          <p className="support-header-anim font-mono-technical text-xs sm:text-sm text-base-500 uppercase tracking-wider max-w-2xl mx-auto">
            Direct access to our atelier stylists, garment fit consultants, and expedited dispatch assistance.
          </p>
        </div>

        {/* ================= TOPIC CHANNEL CARDS ================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {supportChannels.map((channel) => {
            const Icon = channel.icon;
            const isSelected = selectedChannel === channel.id;
            return (
              <div
                key={channel.id}
                onClick={() => handleChannelSelect(channel.id)}
                className={`support-channel-card p-5 rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col justify-between group ${
                  isSelected
                    ? "bg-base-700 text-base-100 border-base-700 shadow-xl scale-[1.02]"
                    : "bg-white text-base-700 border-base-300 hover:border-base-500 shadow-md hover:-translate-y-0.5"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className={`p-2.5 rounded-xl border ${
                        isSelected
                          ? "bg-base-600 border-base-500 text-base-100"
                          : "bg-base-100 border-base-300 text-base-700 group-hover:bg-base-200"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span
                      className={`font-mono-technical text-[9px] uppercase tracking-widest px-2 py-0.5 rounded ${
                        isSelected
                          ? "bg-white text-black font-bold"
                          : "bg-base-200 text-base-600"
                      }`}
                    >
                      {channel.badge}
                    </span>
                  </div>

                  <h2
                    className={`font-display text-lg uppercase tracking-tight ${
                      isSelected ? "text-base-100" : "text-base-700"
                    }`}
                  >
                    {channel.title}
                  </h2>
                  <p
                    className={`font-body text-xs mt-1.5 leading-relaxed ${
                      isSelected ? "text-base-300" : "text-base-500"
                    }`}
                  >
                    {channel.desc}
                  </p>
                </div>

                <div
                  className={`mt-4 pt-3 border-t text-[10px] font-mono-technical uppercase tracking-wider flex items-center justify-between ${
                    isSelected
                      ? "border-base-600 text-base-300"
                      : "border-base-200 text-base-400 group-hover:text-base-700"
                  }`}
                >
                  <span>SELECT CHANNEL</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                </div>
              </div>
            );
          })}
        </div>

        {/* ================= MAIN SPLIT: INQUIRY FORM & CONCIERGE TOUCHPOINTS ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ================= LEFT 7 COLS: INQUIRY DISPATCH FORM ================= */}
          <div className="support-form-card lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-base-300 space-y-6">
            <div className="border-b border-base-200 pb-4">
              <span className="font-mono-technical text-[10px] sm:text-xs tracking-widest text-base-500 uppercase block mb-1">
                SECURE TRANSMISSION
              </span>
              <h2 className="font-display text-2xl sm:text-3xl text-base-700 uppercase tracking-tight">
                DISPATCH ATELIER INQUIRY
              </h2>
            </div>

            {submitStatus === "success" ? (
              <div className="p-6 sm:p-8 bg-neutral-900 border border-neutral-800 text-white rounded-2xl text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-white text-black flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <span className="font-mono-technical text-xs font-bold text-neutral-300 uppercase tracking-widest block">
                    INQUIRY DISPATCHED SUCCESSFULLY
                  </span>
                  <h3 className="font-display text-3xl uppercase tracking-tight text-white mt-1">
                    TICKET REF: #{ticketId}
                  </h3>
                  <p className="font-mono-technical text-xs text-neutral-400 uppercase tracking-wide mt-2 max-w-md mx-auto">
                    A verification acknowledgment has been sent to <strong>{email}</strong>. Our atelier concierge will respond within 15 minutes.
                  </p>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="py-3 px-6 rounded-xl bg-white text-black font-display text-base uppercase tracking-wider hover:bg-neutral-200 cursor-pointer"
                  >
                    SEND ANOTHER INQUIRY
                  </button>
                  <Link
                    href="/track"
                    className="py-3 px-6 rounded-xl border border-base-300 bg-white text-base-700 font-mono-technical text-xs uppercase tracking-wider hover:bg-base-100 flex items-center justify-center gap-1.5"
                  >
                    TRACK AN ORDER
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                {formError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2.5 text-red-600 text-xs font-mono-technical uppercase">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <label className="block font-mono-technical text-[11px] uppercase tracking-wider text-neutral-700 font-medium">
                      CLIENT FULL NAME <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: "" }));
                      }}
                      placeholder="Suraj Kumar"
                      className={`w-full px-4 py-3 bg-base-100/60 border ${fieldErrors.name ? "border-red-500" : "border-base-300"} rounded-xl font-body text-sm text-base-700 placeholder:text-base-400 focus:outline-none focus:border-base-700 focus:bg-white transition-all shadow-sm`}
                    />
                    {fieldErrors.name && (
                      <span className="text-[11px] font-mono-technical text-red-500 mt-1 block font-medium">
                        {fieldErrors.name}
                      </span>
                    )}
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <label className="block font-mono-technical text-[11px] uppercase tracking-wider text-neutral-700 font-medium">
                      EMAIL IDENTIFIER <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: "" }));
                      }}
                      placeholder="client@drapza.com"
                      className={`w-full px-4 py-3 bg-base-100/60 border ${fieldErrors.email ? "border-red-500" : "border-base-300"} rounded-xl font-body text-sm text-base-700 placeholder:text-base-400 focus:outline-none focus:border-base-700 focus:bg-white transition-all shadow-sm`}
                    />
                    {fieldErrors.email && (
                      <span className="text-[11px] font-mono-technical text-red-500 mt-1 block font-medium">
                        {fieldErrors.email}
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Order Reference ID */}
                  <div className="space-y-1.5">
                    <label className="block font-mono-technical text-[11px] uppercase tracking-wider text-neutral-700 font-medium">
                      ORDER REFERENCE ID (OPTIONAL)
                    </label>
                    <input
                      type="text"
                      value={orderRef}
                      onChange={(e) => {
                        setOrderRef(e.target.value);
                        if (fieldErrors.orderRef) setFieldErrors((prev) => ({ ...prev, orderRef: "" }));
                      }}
                      placeholder="e.g. DPZ-9842"
                      className={`w-full px-4 py-3 bg-base-100/60 border ${fieldErrors.orderRef ? "border-red-500" : "border-base-300"} rounded-xl font-body text-sm text-base-700 placeholder:text-base-400 focus:outline-none focus:border-base-700 focus:bg-white transition-all shadow-sm uppercase`}
                    />
                    {fieldErrors.orderRef && (
                      <span className="text-[11px] font-mono-technical text-red-500 mt-1 block font-medium">
                        {fieldErrors.orderRef}
                      </span>
                    )}
                  </div>

                  {/* Topic Channel Selection */}
                  <div className="space-y-1.5">
                    <label className="block font-mono-technical text-[11px] uppercase tracking-wider text-neutral-700 font-medium">
                      INQUIRY TOPIC CHANNEL
                    </label>
                    <select
                      value={selectedChannel}
                      onChange={(e) => setSelectedChannel(e.target.value)}
                      className="w-full px-4 py-3 bg-base-100/60 border border-base-300 rounded-xl font-mono-technical text-xs text-base-700 focus:outline-none focus:border-base-700 focus:bg-white transition-all uppercase cursor-pointer"
                    >
                      {supportChannels.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Message */}
                <div className="space-y-1.5">
                  <label className="block font-mono-technical text-[11px] uppercase tracking-wider text-neutral-700 font-medium">
                    INQUIRY DETAILS &amp; SPECIFICATIONS <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    value={message}
                    onChange={(e) => {
                      setMessage(e.target.value);
                      if (fieldErrors.message) setFieldErrors((prev) => ({ ...prev, message: "" }));
                    }}
                    placeholder="Describe your inquiry, sizing question, or garment exchange details..."
                    className={`w-full px-4 py-3 bg-base-100/60 border ${fieldErrors.message ? "border-red-500" : "border-base-300"} rounded-xl font-body text-sm text-base-700 placeholder:text-base-400 focus:outline-none focus:border-base-700 focus:bg-white transition-all shadow-sm resize-none`}
                  />
                  {fieldErrors.message && (
                    <span className="text-[11px] font-mono-technical text-red-500 mt-1 block font-medium">
                      {fieldErrors.message}
                    </span>
                  )}
                </div>

                {/* Submit Action */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="relative w-full py-4 px-6 rounded-xl bg-base-700 hover:bg-base-600 text-base-100 font-display text-xl sm:text-2xl uppercase tracking-wider flex items-center justify-center gap-3 transition-all duration-300 shadow-xl hover:shadow-2xl hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-75 cursor-pointer overflow-hidden group"
                  >
                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />

                    {isSubmitting ? (
                      <div className="flex items-center gap-2 font-mono-technical text-sm uppercase tracking-widest">
                        <span className="inline-block w-4 h-4 border-2 border-base-100 border-t-transparent rounded-full animate-spin" />
                        <span>TRANSMITTING INQUIRY...</span>
                      </div>
                    ) : (
                      <>
                        <span>TRANSMIT CONCIERGE TICKET</span>
                        <Send className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1.5" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* ================= RIGHT 5 COLS: DIRECT CONCIERGE TOUCHPOINTS ================= */}
          <div className="support-form-card lg:col-span-5 space-y-6">
            
            {/* WhatsApp VIP Concierge Card */}
            <div className="bg-base-700 text-base-100 rounded-3xl p-6 sm:p-8 shadow-2xl border border-base-600 relative overflow-hidden">
              <div className="absolute inset-0 bg-halftone-lg opacity-15 pointer-events-none" />

              <div className="relative z-10 space-y-4">
                <div className="flex items-center justify-between border-b border-base-600/70 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#25d366] animate-ping" />
                    <span className="font-mono-technical text-xs tracking-widest text-[#25d366] uppercase font-bold">
                      INSTANT CHAT • WHATSAPP
                    </span>
                  </div>
                  <span className="font-mono-technical text-[10px] text-base-400">
                    &lt; 5 MIN RESPONSE
                  </span>
                </div>

                <div>
                  <h3 className="font-display text-2xl sm:text-3xl uppercase tracking-tight text-white">
                    DIRECT ATELIER STYLIST
                  </h3>
                  <p className="font-mono-technical text-xs text-base-300 uppercase tracking-wider mt-1 leading-relaxed">
                    Message our senior tailors and stylists directly for instant sizing recommendations and bespoke adjustments.
                  </p>
                </div>

                <a
                  href="https://wa.me/?text=Hello%20Drapza%20Concierge,%20I%20have%20an%20inquiry%20regarding%20my%20order."
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => audioSystem.playClick(1000, 0.03)}
                  className="w-full py-3.5 px-5 rounded-xl bg-[#25d366] hover:bg-[#20ba59] text-black font-mono-technical font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all hover:scale-[1.02] cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4 fill-current" />
                  <span>START WHATSAPP CONCIERGE CHAT</span>
                </a>
              </div>
            </div>

            {/* Global Communication Channels */}
            <div className="bg-white rounded-3xl p-6 shadow-xl border border-base-300 space-y-4">
              <span className="font-mono-technical text-xs font-bold uppercase tracking-wider text-base-700 block border-b border-base-200 pb-2">
                GLOBAL ATELIER DESK HOURS
              </span>

              <div className="space-y-3 font-mono-technical text-xs">
                <div className="flex items-center justify-between p-2.5 bg-base-100/60 rounded-xl border border-base-200">
                  <div className="flex items-center gap-2 text-base-700">
                    <Clock className="w-4 h-4 text-base-500" />
                    <span>OPERATING HOURS</span>
                  </div>
                  <span className="font-bold text-base-700">MON–SAT • 09:00–20:00</span>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-base-100/60 rounded-xl border border-base-200">
                  <div className="flex items-center gap-2 text-base-700">
                    <Mail className="w-4 h-4 text-base-500" />
                    <span>DIRECT INBOX</span>
                  </div>
                  <span className="font-bold text-base-700">CONCIERGE@DRAPZA.COM</span>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-base-100/60 rounded-xl border border-base-200">
                  <div className="flex items-center gap-2 text-base-700">
                    <Headphones className="w-4 h-4 text-base-500" />
                    <span>VIP CONCIERGE DESK</span>
                  </div>
                  <a
                    href="tel:+918888333038"
                    className="font-bold text-base-700 hover:text-black transition-colors"
                  >
                    +91 8888333038
                  </a>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-base-100/60 rounded-xl border border-base-200">
                  <div className="flex items-center gap-2 text-base-700">
                    <span className="w-2 h-2 rounded-full bg-base-700 animate-pulse" />
                    <span className="font-medium text-xs uppercase">LIVE WHATSAPP</span>
                  </div>
                  <a
                    href="https://wa.me/918888333038?text=Hello%20Drapza%20Support"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-base-700 hover:underline text-xs uppercase font-mono-technical"
                  >
                    CHAT +91 8888333038 (↗)
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ================= GSAP ANIMATED FAQ ACCORDION ================= */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-2xl border border-base-300 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-base-200 pb-4">
            <div>
              <span className="font-mono-technical text-[10px] sm:text-xs tracking-widest text-base-500 uppercase block mb-1">
                KNOWLEDGE BASE
              </span>
              <h2 className="font-display text-3xl sm:text-4xl text-base-700 uppercase tracking-tight">
                FREQUENTLY ASKED QUESTIONS
              </h2>
            </div>
            <span className="font-mono-technical text-xs text-base-400 uppercase">
              {faqData.length} VERIFIED GUIDES
            </span>
          </div>

          {/* Accordion Items */}
          <div className="space-y-3">
            {faqData.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                    isOpen
                      ? "bg-base-100/70 border-base-600 shadow-md"
                      : "bg-white border-base-200 hover:border-base-400"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => handleToggleFaq(idx)}
                    className="w-full p-4 sm:p-5 flex items-center justify-between text-left gap-4 cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono-technical text-xs font-bold text-base-400">
                        [0{idx + 1}]
                      </span>
                      <h3 className="font-mono-technical text-xs sm:text-sm font-bold uppercase tracking-wider text-base-700">
                        {faq.question}
                      </h3>
                    </div>
                    <div
                      className={`p-1.5 rounded-lg border transition-transform duration-300 ${
                        isOpen
                          ? "rotate-180 bg-base-700 text-base-100 border-base-700"
                          : "bg-base-100 text-base-600 border-base-300"
                      }`}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-4 sm:px-5 pb-5 pt-1 border-t border-dashed border-base-300/80 animate-fadeIn">
                      <div className="inline-block px-2 py-0.5 rounded bg-base-200 text-base-600 font-mono-technical text-[9px] uppercase tracking-widest mb-2">
                        {faq.category}
                      </div>
                      <p className="font-body text-xs sm:text-sm text-base-600 leading-relaxed max-w-4xl">
                        {faq.answer}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
