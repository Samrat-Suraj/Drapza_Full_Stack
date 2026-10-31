"use client";

import { useState } from "react";
import {
  X,
  Scissors,
  Check,
  Building2,
  Video,
  MapPin,
  Link2,
  Zap,
  ShieldCheck,
  Globe,
  ArrowRight,
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Mail,
  Phone,
  Hash,
  CheckCircle2,
  Copy,
  Info,
} from "lucide-react";
import { audioSystem } from "./AudioSystem";
import { appointmentApi, AppointmentBookingPayload, AppointmentMeasurements } from "@/lib/api";
import { appointmentBookingSchema, getZodErrorMessage, getZodFieldErrors } from "@/lib/validation";
import { useLockBodyScroll } from "./useLockBodyScroll";
import Image from "next/image";

interface BookCustomSizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: {
    id?: string;
    name?: string;
    image?: string;
    price?: number | string;
    color?: string;
  };
}

export function BookCustomSizeModal({
  isOpen,
  onClose,
  product,
}: BookCustomSizeModalProps) {
  // Steps: 1 = Consultation Format, 2 = Your Details, 3 = Confirmation
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [bookedAppointment, setBookedAppointment] = useState<any>(null);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);

  // Step 1: Format Selection (Atelier Visit selected by default)
  const [appointmentType, setAppointmentType] = useState<"atelier_visit" | "virtual_consultation">(
    "atelier_visit"
  );

  // Step 2: Details & Scheduling
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("Mumbai / Flagship Studio");
  const [address, setAddress] = useState("");
  const [pincode, setPincode] = useState("");

  const [preferredDate, setPreferredDate] = useState<string>(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  });
  const [preferredTimeSlot, setPreferredTimeSlot] = useState<string>("12:00 PM - 01:30 PM");

  // Optional Measurements
  const [heightCm, setHeightCm] = useState(178);
  const [weightKg, setWeightKg] = useState(72);
  const [chestInches, setChestInches] = useState<number | "">("");
  const [waistInches, setWaistInches] = useState<number | "">("");
  const [hipsInches, setHipsInches] = useState<number | "">("");
  const [shoulderInches, setShoulderInches] = useState<number | "">("");
  const [inseamInches, setInseamInches] = useState<number | "">("");
  const [fitPreference, setFitPreference] = useState<"bespoke" | "boxy" | "oversized" | "tapered">("bespoke");
  const [customNotes, setCustomNotes] = useState("");

  useLockBodyScroll(isOpen);

  if (!isOpen) return null;

  const timeSlots = [
    "10:30 AM - 12:00 PM",
    "12:00 PM - 01:30 PM",
    "02:30 PM - 04:00 PM",
    "04:30 PM - 06:00 PM",
    "06:30 PM - 08:00 PM",
  ];

  const availableDates = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    return {
      iso: d.toISOString().split("T")[0],
      dayName: d.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase(),
      dayNumber: d.getDate(),
      month: d.toLocaleDateString("en-US", { month: "short" }).toUpperCase(),
    };
  });

  const handleNext = () => {
    setErrorMsg(null);
    audioSystem.playClick(600);
    setCurrentStep(2);
  };

  const handleBack = () => {
    setErrorMsg(null);
    audioSystem.playClick(400);
    setCurrentStep(1);
  };

  const handleCopyId = () => {
    if (bookedAppointment?.appointmentId) {
      navigator.clipboard.writeText(bookedAppointment.appointmentId);
      setCopiedId(true);
      audioSystem.playSuccess();
      setTimeout(() => setCopiedId(false), 2500);
    }
  };

  const handleCopyAll = () => {
    if (!bookedAppointment) return;
    const modeLabel =
      bookedAppointment.appointmentType === "home_fitting"
        ? "Home Concierge Fitting"
        : bookedAppointment.appointmentType === "virtual_consultation"
        ? "Virtual Master Tailor Consultation"
        : "Private Flagship Atelier Visit";

    const text = [
      "=== DRAPZA BESPOKE CONSULTATION DOSSIER ===",
      `Reference: ${bookedAppointment.appointmentId}`,
      `Client: ${bookedAppointment.fullName}`,
      `Email: ${bookedAppointment.email}`,
      `Phone: ${bookedAppointment.phone}`,
      `Experience: ${modeLabel}`,
      `Date: ${bookedAppointment.preferredDate}`,
      `Time Window: ${bookedAppointment.preferredTimeSlot}`,
      bookedAppointment.city ? `City: ${bookedAppointment.city}` : "",
      bookedAppointment.address ? `Address: ${bookedAppointment.address}` : "",
      bookedAppointment.pincode ? `Pincode: ${bookedAppointment.pincode}` : "",
      bookedAppointment.productName ? `Garment: ${bookedAppointment.productName}` : "",
      bookedAppointment.measurements?.fitPreference ? `Silhouette: ${bookedAppointment.measurements.fitPreference.toUpperCase()}` : "",
      "============================================",
    ]
      .filter(Boolean)
      .join("\n");

    navigator.clipboard.writeText(text);
    setCopiedAll(true);
    audioSystem.playSuccess();
    setTimeout(() => setCopiedAll(false), 2500);
  };

  const handleSubmitBooking = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);

    const measurementsData: AppointmentMeasurements = {
      heightCm,
      weightKg,
      chestInches: chestInches ? Number(chestInches) : undefined,
      waistInches: waistInches ? Number(waistInches) : undefined,
      hipsInches: hipsInches ? Number(hipsInches) : undefined,
      shoulderInches: shoulderInches ? Number(shoulderInches) : undefined,
      inseamInches: inseamInches ? Number(inseamInches) : undefined,
      fitPreference,
      customNotes: customNotes.trim(),
    };

    const validationPayload = {
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      appointmentType,
      preferredDate,
      preferredTimeSlot,
      city: city.trim(),
      address: address.trim(),
      pincode: pincode.trim(),
      heightCm,
      weightKg,
      chestInches: chestInches ? Number(chestInches) : undefined,
      waistInches: waistInches ? Number(waistInches) : undefined,
      hipsInches: hipsInches ? Number(hipsInches) : undefined,
      shoulderInches: shoulderInches ? Number(shoulderInches) : undefined,
      inseamInches: inseamInches ? Number(inseamInches) : undefined,
      fitPreference,
      customNotes,
    };

    setFieldErrors({});
    const validation = appointmentBookingSchema.safeParse(validationPayload);
    if (!validation.success) {
      setFieldErrors(getZodFieldErrors(validation.error));
      const err = getZodErrorMessage(validation.error);
      setErrorMsg(err);
      audioSystem.playError();
      return;
    }

    setLoading(true);
    try {
      const payload: AppointmentBookingPayload = {
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        appointmentType,
        preferredDate,
        preferredTimeSlot,
        city: city.trim(),
        address: address.trim(),
        pincode: pincode.trim(),
        productId: product?.id,
        productName: product?.name || "Bespoke Silhouette Consultation",
        productImage: product?.image,
        productPrice: product?.price,
        measurements: measurementsData,
      };

      const res = await appointmentApi.bookAppointment(payload);
      if (res && res.appointment) {
        setBookedAppointment(res.appointment);
        setCurrentStep(3); // Confirmation
        audioSystem.playSuccess();
      } else {
        throw new Error((res as any)?.message || "Failed to schedule appointment");
      }
    } catch (err: any) {
      console.error("[BOOKING ERROR]:", err);
      setErrorMsg(err.message || "Failed to submit booking. Please verify inputs.");
      audioSystem.playError();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Book Custom Size Consultation"
      className="bespoke-atelier-modal fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6 md:p-8 lg:p-10 overflow-y-auto"
      style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      }}
    >
      {/* 1. Background Overlay: Darkened and heavily blurred glass effect */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-md transition-opacity duration-300"
        onClick={() => {
          audioSystem.playClick(400);
          onClose();
        }}
      />

      {/* 2. Side-by-Side Container (Sidebar + Main Modal) */}
      <div
        className="bespoke-atelier-modal relative z-10 flex flex-row items-stretch justify-center gap-5 lg:gap-6 w-full max-w-[1240px] my-auto"
        style={{ display: "flex", flexDirection: "row", alignItems: "stretch" }}
      >
        {/* 4. Left Step Progress Sidebar (Floating Dark Forest Green Card) */}
        <aside
          className="flex flex-col justify-center shrink-0 shadow-2xl text-white"
          style={{
            display: "flex",
            width: "215px",
            minWidth: "215px",
            backgroundColor: "#0f0f0f",
            borderRadius: "24px",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            padding: "44px 26px",
          }}
        >
          <div className="flex flex-col gap-8 py-2">
            {/* Step 1 */}
            <div className="flex items-center gap-3.5">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 shadow transition-all"
                style={{
                  backgroundColor: currentStep === 1 ? "#ffffff" : "#262626",
                  color: currentStep === 1 ? "#0f0f0f" : "#FFFFFF",
                }}
              >
                {currentStep > 1 ? <Check className="w-4 h-4 stroke-[2.5]" /> : "1"}
              </div>
              <div className="flex flex-col leading-snug">
                <span
                  style={{
                    color: "#FFFFFF",
                    fontSize: "14px",
                    fontWeight: currentStep === 1 ? 700 : 500,
                    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                  }}
                >
                  Consultation
                </span>
                <span
                  style={{
                    color: "#FFFFFF",
                    fontSize: "14px",
                    fontWeight: currentStep === 1 ? 700 : 500,
                    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                  }}
                >
                  Format
                </span>
              </div>
            </div>

            {/* Connecting Line - precisely centered under circle */}
            <div className="w-[1.5px] h-10 bg-white/20 ml-[17px]" />

            {/* Step 2 */}
            <div className="flex items-center gap-3.5">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium shrink-0 transition-all"
                style={{
                  backgroundColor: currentStep === 2 ? "#ffffff" : currentStep > 2 ? "#262626" : "transparent",
                  color: currentStep === 2 ? "#0f0f0f" : "rgba(255, 255, 255, 0.75)",
                  border: currentStep >= 2 ? "none" : "1.5px solid rgba(255, 255, 255, 0.35)",
                }}
              >
                {currentStep > 2 ? <Check className="w-4 h-4 stroke-[2.5]" /> : "2"}
              </div>
              <span
                style={{
                  color: currentStep === 2 ? "#FFFFFF" : "rgba(255, 255, 255, 0.7)",
                  fontSize: "14px",
                  fontWeight: currentStep === 2 ? 700 : 500,
                  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                }}
              >
                Your Details
              </span>
            </div>

            {/* Connecting Line - precisely centered under circle */}
            <div className="w-[1.5px] h-10 bg-white/20 ml-[17px]" />

            {/* Step 3 */}
            <div className="flex items-center gap-3.5">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium shrink-0 transition-all"
                style={{
                  backgroundColor: currentStep === 3 ? "#ffffff" : "transparent",
                  color: currentStep === 3 ? "#0f0f0f" : "rgba(255, 255, 255, 0.75)",
                  border: currentStep === 3 ? "none" : "1.5px solid rgba(255, 255, 255, 0.35)",
                }}
              >
                {currentStep === 3 ? <Check className="w-4 h-4 stroke-[2.5]" /> : "3"}
              </div>
              <span
                style={{
                  color: currentStep === 3 ? "#FFFFFF" : "rgba(255, 255, 255, 0.7)",
                  fontSize: "14px",
                  fontWeight: currentStep === 3 ? 700 : 500,
                  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                }}
              >
                Confirmation
              </span>
            </div>
          </div>
        </aside>

        {/* Right Main Modal Card (Warm Ivory #edf1e8) */}
        <div
          className="flex-1 flex flex-col justify-between shadow-2xl overflow-y-auto max-h-[94vh]"
          style={{
            backgroundColor: "#edf1e8",
            borderRadius: "26px",
            border: "1px solid #d7dbd2",
            color: "#111816",
            padding: "28px 36px 26px 36px",
          }}
        >
          <div>
            {/* 3. Header Bar */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div
                  className="w-12 h-12 rounded-[14px] flex items-center justify-center shrink-0 shadow-sm mt-0.5"
                  style={{ backgroundColor: "#0f0f0f", color: "#ffffff" }}
                >
                  <Scissors className="w-6 h-6 text-white" />
                </div>
                <div>
                  <span
                    style={{
                      color: "#0f0f0f",
                      letterSpacing: "0.16em",
                      fontSize: "11px",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      display: "block",
                      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                    }}
                  >
                    BESPOKE ATELIER
                  </span>
                  <h1
                    style={{
                      fontFamily: "var(--font-dm-mono), monospace",
                      fontSize: "27px",
                      lineHeight: "1.2",
                      fontWeight: 700,
                      letterSpacing: "-0.01em",
                      color: "#111816",
                      margin: "3px 0 0 0",
                    }}
                  >
                    {currentStep === 3
                      ? "Appointment Confirmed"
                      : "Book Custom Size Consultation"}
                  </h1>
                  <p
                    style={{
                      fontSize: "13px",
                      color: "#52525b",
                      lineHeight: "1.45",
                      margin: "5px 0 0 0",
                      maxWidth: "540px",
                      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                    }}
                  >
                    {currentStep === 1 &&
                      "Select consultation format and tell us how you would like our master tailor to assess your measurements and bespoke silhouette."}
                    {currentStep === 2 &&
                      "Provide your concierge contact details, scheduling preferences, and dimension metrics for tailored calibration."}
                    {currentStep === 3 &&
                      "Your bespoke sizing session has been reserved. An atelier concierge invitation has been dispatched."}
                  </p>
                </div>
              </div>

              {/* Minimal Sleek Close Button in Top-Right */}
              <button
                type="button"
                onClick={() => {
                  audioSystem.playClick(400);
                  onClose();
                }}
                className="text-neutral-400 hover:text-neutral-900 transition-colors p-1.5 cursor-pointer shrink-0"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Selected Product Capsule (if launched from garment page) */}
            {product && currentStep < 3 && (
              <div className="mt-4 p-3.5 rounded-xl bg-white border border-[#d7dbd2] flex items-center justify-between text-xs font-sans">
                <div className="flex items-center gap-3">
                  {product.image && (
                    <div className="w-9 h-9 rounded-lg overflow-hidden relative border border-[#d7dbd2] shrink-0">
                      <Image
                        src={product.image}
                        alt={product.name || "Garment"}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  )}
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#0f0f0f]/70 tracking-wider block">
                      GARMENT SELECTED FOR FITTING
                    </span>
                    <span className="font-bold text-[#111816] uppercase truncate max-w-[280px] block">
                      {product.name} {product.color ? `(${product.color})` : ""}
                    </span>
                  </div>
                </div>
                {product.price && (
                  <span className="font-bold text-[#0f0f0f] text-sm font-mono">
                    {typeof product.price === "number" ? `₹${product.price}` : product.price}
                  </span>
                )}
              </div>
            )}

            {/* Error Message */}
            {errorMsg && (
              <div className="mt-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 font-sans">
                <Info className="w-4 h-4 text-red-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}            {/* ================= STEP 1: CONSULTATION FORMAT ================= */}
            {currentStep === 1 && (
              <div style={{ marginTop: "24px" }}>
                {/* 5. Consultation Option Cards + 6. Luxury Promo Panel (3 Columns) */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 lg:gap-5">
                  {/* CARD A — Atelier Lounge (Selected by default) */}
                  <div
                    onClick={() => {
                      audioSystem.playClick(600);
                      setAppointmentType("atelier_visit");
                    }}
                    className={`md:col-span-5 rounded-[22px] overflow-hidden cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                      appointmentType === "atelier_visit"
                        ? "shadow-xl ring-2 ring-[#0f0f0f]/20"
                        : "bg-white text-[#111816] border border-[#d7dbd2] hover:border-[#0f0f0f]/40 shadow-sm"
                    }`}
                    style={{
                      backgroundColor: appointmentType === "atelier_visit" ? "#0f0f0f" : "#FFFFFF",
                      color: appointmentType === "atelier_visit" ? "#FFFFFF" : "#111816",
                      border:
                        appointmentType === "atelier_visit"
                          ? "2px solid #0f0f0f"
                          : "1px solid #d7dbd2",
                    }}
                  >
                    <div>
                      {/* Photographic Banner */}
                      <div className="relative h-[136px] w-full overflow-hidden bg-neutral-900">
                        <Image
                          src="/images/bespoke/atelier-lounge.jpg"
                          alt="Professional tailor measuring client in luxury studio"
                          fill
                          className="object-cover"
                          unoptimized
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                        {/* Top Left Badge */}
                        <div className="absolute top-3.5 left-3.5">
                          <span
                            style={{
                              backgroundColor: "#FFFFFF",
                              color: "#111816",
                              fontSize: "10px",
                              fontWeight: 700,
                              letterSpacing: "0.08em",
                              textTransform: "uppercase",
                              padding: "4px 11px",
                              borderRadius: "9999px",
                              fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                            }}
                            className="shadow-sm"
                          >
                            MOST POPULAR
                          </span>
                        </div>

                        {/* Top Right Check Indicator */}
                        <div className="absolute top-3.5 right-3.5">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                              appointmentType === "atelier_visit"
                                ? "bg-[#0f0f0f] text-white shadow"
                                : "border-2 border-white/60 bg-black/30"
                            }`}
                          >
                            {appointmentType === "atelier_visit" && (
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Card Body */}
                      <div style={{ padding: "16px 20px 10px 20px" }}>
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center mb-2.5"
                          style={{
                            backgroundColor:
                              appointmentType === "atelier_visit"
                                ? "rgba(255, 255, 255, 0.12)"
                                : "rgba(8, 45, 32, 0.08)",
                            color: appointmentType === "atelier_visit" ? "#FFFFFF" : "#0f0f0f",
                          }}
                        >
                          <Building2 className="w-5 h-5" />
                        </div>
                        <h2
                          style={{
                            fontFamily: "var(--font-dm-mono), monospace",
                            fontSize: "21px",
                            lineHeight: "1.25",
                            fontWeight: 700,
                            color: appointmentType === "atelier_visit" ? "#FFFFFF" : "#111816",
                            margin: 0,
                          }}
                        >
                          Atelier Lounge
                        </h2>

                        <p
                          style={{
                            color:
                              appointmentType === "atelier_visit"
                                ? "rgba(233, 239, 231, 0.88)"
                                : "#525252",
                            fontSize: "12px",
                            lineHeight: "1.4",
                            margin: "5px 0 0 0",
                            fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                          }}
                        >
                          Visit our private design house showroom for a full sensory fitting &amp; fabric
                          tactile preview.
                        </p>

                        {/* Feature Checklist */}
                        <div className="mt-3 space-y-2 font-sans text-xs">
                          <div className="flex items-center gap-2.5">
                            <div className="w-4 h-4 rounded-full bg-white/15 border border-white/25 flex items-center justify-center shrink-0">
                              <Check className="w-2.5 h-2.5 text-white stroke-[2.5]" />
                            </div>
                            <span
                              style={{
                                color: appointmentType === "atelier_visit" ? "#edf1e8" : "#374151",
                                fontSize: "12px",
                                fontWeight: 500,
                                fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                              }}
                            >
                              Personalized fitting session
                            </span>
                          </div>
                          <div className="flex items-center gap-2.5">
                            <div className="w-4 h-4 rounded-full bg-white/15 border border-white/25 flex items-center justify-center shrink-0">
                              <Check className="w-2.5 h-2.5 text-white stroke-[2.5]" />
                            </div>
                            <span
                              style={{
                                color: appointmentType === "atelier_visit" ? "#edf1e8" : "#374151",
                                fontSize: "12px",
                                fontWeight: 500,
                                fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                              }}
                            >
                              Premium fabric showcase
                            </span>
                          </div>
                          <div className="flex items-center gap-2.5">
                            <div className="w-4 h-4 rounded-full bg-white/15 border border-white/25 flex items-center justify-center shrink-0">
                              <Check className="w-2.5 h-2.5 text-white stroke-[2.5]" />
                            </div>
                            <span
                              style={{
                                color: appointmentType === "atelier_visit" ? "#edf1e8" : "#374151",
                                fontSize: "12px",
                                fontWeight: 500,
                                fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                              }}
                            >
                              Expert style consultation
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card Metadata Bottom Pills */}
                    <div
                      className="flex items-center gap-2.5 text-[11px] font-sans font-bold tracking-wider uppercase shrink-0"
                      style={{
                        padding: "10px 20px 14px 20px",
                        color: appointmentType === "atelier_visit" ? "#edf1e8" : "#0f0f0f",
                      }}
                    >
                      <span
                        className="flex items-center gap-1.5"
                        style={{
                          color: appointmentType === "atelier_visit" ? "#edf1e8" : "#0f0f0f",
                          fontSize: "11px",
                          fontWeight: 700,
                          letterSpacing: "0.06em",
                          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                        }}
                      >
                        <MapPin className="w-3.5 h-3.5 text-[#ffffff]" /> FLAGSHIP STUDIO
                      </span>
                      <span className="opacity-30 text-white">|</span>
                      <span
                        className="px-2.5 py-0.5 rounded text-[10px] font-bold"
                        style={{
                          backgroundColor:
                            appointmentType === "atelier_visit"
                              ? "rgba(46, 139, 87, 0.35)"
                              : "rgba(8, 45, 32, 0.08)",
                          border:
                            appointmentType === "atelier_visit"
                              ? "1px solid rgba(46, 139, 87, 0.5)"
                              : "1px solid rgba(8, 45, 32, 0.12)",
                          color: appointmentType === "atelier_visit" ? "#ffffff" : "#0f0f0f",
                          letterSpacing: "0.06em",
                          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                        }}
                      >
                        RECOMMENDED
                      </span>
                    </div>
                  </div>

                  {/* CARD B — Video Studio */}
                  <div
                    onClick={() => {
                      audioSystem.playClick(600);
                      setAppointmentType("virtual_consultation");
                    }}
                    className={`md:col-span-4 rounded-[22px] overflow-hidden cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                      appointmentType === "virtual_consultation"
                        ? "shadow-xl ring-2 ring-[#0f0f0f]/20"
                        : "bg-white text-[#111816] border border-[#d7dbd2] hover:border-[#0f0f0f]/40 shadow-sm"
                    }`}
                    style={{
                      backgroundColor:
                        appointmentType === "virtual_consultation" ? "#0f0f0f" : "#FFFFFF",
                      color: appointmentType === "virtual_consultation" ? "#FFFFFF" : "#111816",
                      border:
                        appointmentType === "virtual_consultation"
                          ? "2px solid #0f0f0f"
                          : "1px solid #d7dbd2",
                    }}
                  >
                    <div>
                      {/* Photographic Banner with soft curved bottom wave */}
                      <div className="relative h-[136px] w-full overflow-hidden bg-neutral-900">
                        <Image
                          src="/images/bespoke/video-studio.jpg"
                          alt="Professional tailor conducting virtual video consultation"
                          fill
                          className="object-cover"
                          unoptimized
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                        {/* Soft curved wave overlay at bottom */}
                        <svg
                          viewBox="0 0 320 28"
                          preserveAspectRatio="none"
                          className="absolute bottom-0 left-0 w-full h-6 pointer-events-none"
                          style={{
                            fill:
                              appointmentType === "virtual_consultation"
                                ? "#0f0f0f"
                                : "#FFFFFF",
                          }}
                        >
                          <path d="M0,28 C60,2 140,24 320,12 L320,28 L0,28 Z" />
                        </svg>

                        {/* Top Right Indicator */}
                        <div className="absolute top-3.5 right-3.5">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                              appointmentType === "virtual_consultation"
                                ? "bg-[#0f0f0f] text-white shadow"
                                : "border-2 border-neutral-400 bg-white/40"
                            }`}
                          >
                            {appointmentType === "virtual_consultation" && (
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Card Body with Floating Camera Badge */}
                      <div style={{ padding: "6px 20px 10px 20px" }}>
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center -mt-5 mb-2.5 shadow-md relative z-10 transition-all"
                          style={{
                            backgroundColor:
                              appointmentType === "virtual_consultation"
                                ? "rgba(255, 255, 255, 0.15)"
                                : "#FFFFFF",
                            border:
                              appointmentType === "virtual_consultation"
                                ? "1px solid rgba(255, 255, 255, 0.2)"
                                : "1px solid #d7dbd2",
                            color:
                              appointmentType === "virtual_consultation" ? "#FFFFFF" : "#0f0f0f",
                          }}
                        >
                          <Video className="w-4 h-4" />
                        </div>

                        <h2
                          style={{
                            fontFamily: "var(--font-dm-mono), monospace",
                            fontSize: "21px",
                            lineHeight: "1.25",
                            fontWeight: 700,
                            color:
                              appointmentType === "virtual_consultation" ? "#FFFFFF" : "#111816",
                            margin: 0,
                          }}
                        >
                          Video Studio
                        </h2>

                        <p
                          style={{
                            color:
                              appointmentType === "virtual_consultation"
                                ? "rgba(233, 239, 231, 0.88)"
                                : "#525252",
                            fontSize: "12px",
                            lineHeight: "1.4",
                            margin: "5px 0 0 0",
                            fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                          }}
                        >
                          1-on-1 private video stream with our senior pattern designer for guided
                          self-calibration.
                        </p>

                        {/* Feature Checklist */}
                        <div className="mt-3 space-y-2 font-sans text-xs">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                              style={{
                                backgroundColor:
                                  appointmentType === "virtual_consultation" ? "#0f0f0f" : "#111816",
                              }}
                            >
                              <Check className="w-2.5 h-2.5 text-white stroke-[3]" />
                            </div>
                            <span
                              style={{
                                color:
                                  appointmentType === "virtual_consultation"
                                    ? "#edf1e8"
                                    : "#374151",
                                fontSize: "12px",
                                fontWeight: 500,
                                fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                              }}
                            >
                              Live video consultation
                            </span>
                          </div>
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                              style={{
                                backgroundColor:
                                  appointmentType === "virtual_consultation" ? "#0f0f0f" : "#111816",
                              }}
                            >
                              <Check className="w-2.5 h-2.5 text-white stroke-[3]" />
                            </div>
                            <span
                              style={{
                                color:
                                  appointmentType === "virtual_consultation"
                                    ? "#edf1e8"
                                    : "#374151",
                                fontSize: "12px",
                                fontWeight: 500,
                                fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                              }}
                            >
                              Guided measurements
                            </span>
                          </div>
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                              style={{
                                backgroundColor:
                                  appointmentType === "virtual_consultation" ? "#0f0f0f" : "#111816",
                              }}
                            >
                              <Check className="w-2.5 h-2.5 text-white stroke-[3]" />
                            </div>
                            <span
                              style={{
                                color:
                                  appointmentType === "virtual_consultation"
                                    ? "#edf1e8"
                                    : "#374151",
                                fontSize: "12px",
                                fontWeight: 500,
                                fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                              }}
                            >
                              Instant expert feedback
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card Metadata Bottom Pills */}
                    <div
                      className="flex items-center gap-2 text-[11px] font-sans font-bold tracking-wider uppercase shrink-0"
                      style={{
                        padding: "10px 20px 14px 20px",
                        color:
                          appointmentType === "virtual_consultation" ? "#edf1e8" : "#111816",
                      }}
                    >
                      <span
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold"
                        style={{
                          backgroundColor:
                            appointmentType === "virtual_consultation"
                              ? "rgba(255, 255, 255, 0.12)"
                              : "#f4f6f2",
                          border:
                            appointmentType === "virtual_consultation"
                              ? "1px solid rgba(255, 255, 255, 0.2)"
                              : "1px solid #d7dbd2",
                          color:
                            appointmentType === "virtual_consultation" ? "#FFFFFF" : "#111816",
                          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                        }}
                      >
                        <Link2 className="w-3.5 h-3.5" /> REMOTE / HD LINK
                      </span>
                      <span
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold"
                        style={{
                          backgroundColor:
                            appointmentType === "virtual_consultation"
                              ? "rgba(255, 255, 255, 0.12)"
                              : "#f4f6f2",
                          border:
                            appointmentType === "virtual_consultation"
                              ? "1px solid rgba(255, 255, 255, 0.2)"
                              : "1px solid #d7dbd2",
                          color:
                            appointmentType === "virtual_consultation" ? "#FFFFFF" : "#111816",
                          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                        }}
                      >
                        <Zap className="w-3 h-3 text-[#111816]" /> INSTANT
                      </span>
                    </div>
                  </div>

                  {/* CARD C — 6. Luxury Promotional Panel (Right Column) */}
                  <div
                    className="md:col-span-3 rounded-[22px] overflow-hidden relative shadow-md flex flex-col justify-between"
                    style={{
                      backgroundColor: "#111816",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                    }}
                  >
                    <div className="relative h-[136px] w-full overflow-hidden bg-neutral-900">
                      <Image
                        src="/images/bespoke/fabric-panel.jpg"
                        alt="Dark green luxury fabric and measuring tape"
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>

                    <div style={{ padding: "16px 18px 14px 18px" }} className="flex flex-col justify-between flex-1 text-white shrink-0">
                      <div>
                        <h3
                          style={{
                            fontFamily: "var(--font-dm-mono), monospace",
                            fontStyle: "italic",
                            fontSize: "21px",
                            lineHeight: "1.25",
                            color: "#edf1e8",
                            margin: 0,
                            fontWeight: 400,
                          }}
                        >
                          Perfect Fit.<br />Timeless Style.
                        </h3>
                        <div
                          style={{
                            width: "30px",
                            height: "1.5px",
                            backgroundColor: "#7d807a",
                            margin: "10px 0",
                          }}
                        />
                      </div>
                      <p
                        style={{
                          color: "#a1a1aa",
                          fontSize: "12px",
                          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                          lineHeight: "1.5",
                          margin: 0,
                        }}
                      >
                        Expert guidance.<br />
                        Your measurements.<br />
                        Our craftsmanship.
                      </p>
                    </div>
                  </div>
                </div>

                {/* 7. Complimentary Consultation Banner (Sage-Tinted Panel) */}
                <div
                  className="rounded-2xl flex items-start gap-3.5 shadow-sm font-sans"
                  style={{
                    marginTop: "20px",
                    backgroundColor: "#f4f6f2",
                    border: "1px solid #d7dbd2",
                    padding: "13px 20px",
                  }}
                >
                  <ShieldCheck className="w-5 h-5 text-[#0f0f0f] shrink-0 mt-0.5" />
                  <div>
                    <h4
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        letterSpacing: "0.08em",
                        color: "#0f0f0f",
                        textTransform: "uppercase",
                        margin: 0,
                        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                      }}
                    >
                      ZERO FITTING CHARGE
                    </h4>
                    <p
                      style={{
                        color: "#0f0f0f",
                        fontSize: "11.5px",
                        lineHeight: "1.4",
                        margin: "2px 0 0 0",
                        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                      }}
                    >
                      Bespoke consultations are completely complimentary. Your calibrated measurements will
                      be archived into your private Drapza atelier profile for all future garments.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ================= STEP 2: YOUR DETAILS & CALIBRATION ================= */}
            {currentStep === 2 && (
              <form onSubmit={handleSubmitBooking} noValidate className="font-sans" style={{ marginTop: "16px" }}>
                {/* Format Recap Pill */}
                <div
                  className="flex items-center justify-between border border-[#d7dbd2] shadow-sm"
                  style={{
                    backgroundColor: "#f4f6f2",
                    borderRadius: "14px",
                    padding: "10px 16px",
                    marginBottom: "18px",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0 shadow-sm"
                      style={{ backgroundColor: "#0f0f0f" }}
                    >
                      {appointmentType === "atelier_visit" ? (
                        <Building2 className="w-3.5 h-3.5 text-white" />
                      ) : (
                        <Video className="w-3.5 h-3.5 text-white" />
                      )}
                    </div>
                    <div>
                      <span
                        className="text-[9.5px] font-bold uppercase tracking-wider block"
                        style={{ color: "#52525b", letterSpacing: "0.06em" }}
                      >
                        SELECTED CONSULTATION FORMAT
                      </span>
                      <span
                        className="text-xs font-bold block"
                        style={{ color: "#0f0f0f" }}
                      >
                        {appointmentType === "atelier_visit"
                          ? "Atelier Lounge (Flagship Studio)"
                          : "Video Studio (Virtual HD Link)"}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      audioSystem.playClick(400);
                      setCurrentStep(1);
                    }}
                    className="text-[11px] font-bold underline hover:opacity-80 transition-opacity cursor-pointer shrink-0"
                    style={{ color: "#0f0f0f" }}
                  >
                    Change Format
                  </button>
                </div>

                {/* 1. Client Contact */}
                <div>
                  <div className="flex items-center justify-between" style={{ marginBottom: "12px" }}>
                    <h3
                      style={{
                        fontFamily: "var(--font-dm-mono), monospace",
                        fontSize: "17.5px",
                        fontWeight: 700,
                        color: "#111816",
                        margin: 0,
                      }}
                    >
                      Client Information
                    </h3>
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: 700,
                        color: "#7d807a",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                      }}
                    >
                      * Required fields
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "5px",
                          fontSize: "10.5px",
                          fontWeight: 700,
                          color: "#0f0f0f",
                          textTransform: "uppercase",
                          letterSpacing: "0.07em",
                          marginBottom: "5px",
                        }}
                      >
                        <User className="w-3.5 h-3.5 text-[#0f0f0f]" /> Full Name *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Vikramaditya Singhania"
                        value={fullName}
                        onChange={(e) => {
                          setFullName(e.target.value);
                          if (fieldErrors.fullName) setFieldErrors((prev) => ({ ...prev, fullName: "" }));
                        }}
                        style={{
                          width: "100%",
                          padding: "8.5px 12px",
                          borderRadius: "10px",
                          border: fieldErrors.fullName ? "1px solid #ef4444" : "1px solid #d7dbd2",
                          backgroundColor: "#FFFFFF",
                          fontSize: "12px",
                          color: "#111816",
                          outline: "none",
                          boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
                        }}
                        className="focus:border-[#0f0f0f] focus:ring-1 focus:ring-[#0f0f0f]/20 transition-all"
                      />
                      {fieldErrors.fullName && (
                        <span style={{ color: "#ef4444", fontSize: "0.68rem", fontFamily: "var(--font-dm-mono), monospace", marginTop: "0.2rem", fontWeight: 500, display: "block" }}>
                          {fieldErrors.fullName}
                        </span>
                      )}
                    </div>

                    <div>
                      <label
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "5px",
                          fontSize: "10.5px",
                          fontWeight: 700,
                          color: "#0f0f0f",
                          textTransform: "uppercase",
                          letterSpacing: "0.07em",
                          marginBottom: "5px",
                        }}
                      >
                        <Phone className="w-3.5 h-3.5 text-[#0f0f0f]" /> Phone / WhatsApp *
                      </label>
                      <input
                        type="tel"
                        placeholder="+91 98765 43210"
                        value={phone}
                        onChange={(e) => {
                          setPhone(e.target.value);
                          if (fieldErrors.phone) setFieldErrors((prev) => ({ ...prev, phone: "" }));
                        }}
                        style={{
                          width: "100%",
                          padding: "8.5px 12px",
                          borderRadius: "10px",
                          border: fieldErrors.phone ? "1px solid #ef4444" : "1px solid #d7dbd2",
                          backgroundColor: "#FFFFFF",
                          fontSize: "12px",
                          color: "#111816",
                          fontFamily: "monospace",
                          outline: "none",
                          boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
                        }}
                        className="focus:border-[#0f0f0f] focus:ring-1 focus:ring-[#0f0f0f]/20 transition-all"
                      />
                      {fieldErrors.phone && (
                        <span style={{ color: "#ef4444", fontSize: "0.68rem", fontFamily: "var(--font-dm-mono), monospace", marginTop: "0.2rem", fontWeight: 500, display: "block" }}>
                          {fieldErrors.phone}
                        </span>
                      )}
                    </div>

                    <div className="sm:col-span-2">
                      <label
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "5px",
                          fontSize: "10.5px",
                          fontWeight: 700,
                          color: "#0f0f0f",
                          textTransform: "uppercase",
                          letterSpacing: "0.07em",
                          marginBottom: "5px",
                        }}
                      >
                        <Mail className="w-3.5 h-3.5 text-[#0f0f0f]" /> Email Address *
                      </label>
                      <input
                        type="email"
                        placeholder="client@luxury-bespoke.com"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: "" }));
                        }}
                        style={{
                          width: "100%",
                          padding: "8.5px 12px",
                          borderRadius: "10px",
                          border: fieldErrors.email ? "1px solid #ef4444" : "1px solid #d7dbd2",
                          backgroundColor: "#FFFFFF",
                          fontSize: "12px",
                          color: "#111816",
                          outline: "none",
                          boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
                        }}
                        className="focus:border-[#0f0f0f] focus:ring-1 focus:ring-[#0f0f0f]/20 transition-all"
                      />
                      {fieldErrors.email && (
                        <span style={{ color: "#ef4444", fontSize: "0.68rem", fontFamily: "var(--font-dm-mono), monospace", marginTop: "0.2rem", fontWeight: 500, display: "block" }}>
                          {fieldErrors.email}
                        </span>
                      )}
                    </div>

                    <div>
                      <label
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "5px",
                          fontSize: "10.5px",
                          fontWeight: 700,
                          color: "#0f0f0f",
                          textTransform: "uppercase",
                          letterSpacing: "0.07em",
                          marginBottom: "5px",
                        }}
                      >
                        <MapPin className="w-3.5 h-3.5 text-[#0f0f0f]" /> City / Location *
                      </label>
                      <input
                        type="text"
                        placeholder="Mumbai / Delhi / Bengaluru"
                        value={city}
                        onChange={(e) => {
                          setCity(e.target.value);
                          if (fieldErrors.city) setFieldErrors((prev) => ({ ...prev, city: "" }));
                        }}
                        style={{
                          width: "100%",
                          padding: "8.5px 12px",
                          borderRadius: "10px",
                          border: fieldErrors.city ? "1px solid #ef4444" : "1px solid #d7dbd2",
                          backgroundColor: "#FFFFFF",
                          fontSize: "12px",
                          color: "#111816",
                          outline: "none",
                          boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
                        }}
                        className="focus:border-[#0f0f0f] focus:ring-1 focus:ring-[#0f0f0f]/20 transition-all"
                      />
                      {fieldErrors.city && (
                        <span style={{ color: "#ef4444", fontSize: "0.68rem", fontFamily: "var(--font-dm-mono), monospace", marginTop: "0.2rem", fontWeight: 500, display: "block" }}>
                          {fieldErrors.city}
                        </span>
                      )}
                    </div>

                    <div>
                      <label
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "5px",
                          fontSize: "10.5px",
                          fontWeight: 700,
                          color: "#0f0f0f",
                          textTransform: "uppercase",
                          letterSpacing: "0.07em",
                          marginBottom: "5px",
                        }}
                      >
                        <Hash className="w-3.5 h-3.5 text-[#0f0f0f]" /> Pincode *
                      </label>
                      <input
                        type="text"
                        placeholder="400001"
                        value={pincode}
                        onChange={(e) => {
                          setPincode(e.target.value);
                          if (fieldErrors.pincode) setFieldErrors((prev) => ({ ...prev, pincode: "" }));
                        }}
                        style={{
                          width: "100%",
                          padding: "8.5px 12px",
                          borderRadius: "10px",
                          border: fieldErrors.pincode ? "1px solid #ef4444" : "1px solid #d7dbd2",
                          backgroundColor: "#FFFFFF",
                          fontSize: "12px",
                          color: "#111816",
                          fontFamily: "monospace",
                          outline: "none",
                          boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
                        }}
                        className="focus:border-[#0f0f0f] focus:ring-1 focus:ring-[#0f0f0f]/20 transition-all"
                      />
                      {fieldErrors.pincode && (
                        <span style={{ color: "#ef4444", fontSize: "0.68rem", fontFamily: "var(--font-dm-mono), monospace", marginTop: "0.2rem", fontWeight: 500, display: "block" }}>
                          {fieldErrors.pincode}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. Scheduling */}
                <div style={{ marginTop: "18px", paddingTop: "16px", borderTop: "1px solid #d7dbd2" }}>
                  <div className="flex items-center gap-2" style={{ marginBottom: "12px" }}>
                    <Calendar className="w-4 h-4 text-[#0f0f0f]" />
                    <h3
                      style={{
                        fontFamily: "var(--font-dm-mono), monospace",
                        fontSize: "17.5px",
                        fontWeight: 700,
                        color: "#111816",
                        margin: 0,
                      }}
                    >
                      Consultation Schedule
                    </h3>
                  </div>

                  {/* Date Selector */}
                  <div style={{ marginBottom: "14px" }}>
                    <label
                      style={{
                        display: "block",
                        fontSize: "10.5px",
                        fontWeight: 700,
                        color: "#52525b",
                        textTransform: "uppercase",
                        letterSpacing: "0.07em",
                        marginBottom: "7px",
                      }}
                    >
                      Select Date
                    </label>
                    <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                      {availableDates.map((item) => {
                        const isSelected = preferredDate === item.iso;
                        return (
                          <button
                            key={item.iso}
                            type="button"
                            onClick={() => {
                              audioSystem.playClick(600);
                              setPreferredDate(item.iso);
                            }}
                            style={{
                              backgroundColor: isSelected ? "#0f0f0f" : "#FFFFFF",
                              border: isSelected ? "1.5px solid #0f0f0f" : "1px solid #d7dbd2",
                              borderRadius: "12px",
                              padding: "8px 4px 6px 4px",
                              boxShadow: isSelected
                                ? "0 4px 12px rgba(8, 45, 32, 0.2)"
                                : "0 1px 2px rgba(0,0,0,0.02)",
                              cursor: "pointer",
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              justifyContent: "center",
                              transition: "all 0.2s ease",
                            }}
                            className="hover:border-[#0f0f0f]/50"
                          >
                            <span
                              style={{
                                color: isSelected ? "#ffffff" : "#71717a",
                                fontSize: "9.5px",
                                fontWeight: 700,
                                textTransform: "uppercase",
                                letterSpacing: "0.06em",
                              }}
                            >
                              {item.dayName}
                            </span>
                            <span
                              style={{
                                color: isSelected ? "#FFFFFF" : "#111816",
                                fontFamily: "var(--font-dm-mono), monospace",
                                fontSize: "16px",
                                fontWeight: 700,
                                margin: "1px 0",
                              }}
                            >
                              {item.dayNumber}
                            </span>
                            <span
                              style={{
                                color: isSelected ? "#f4f6f2" : "#7d807a",
                                fontSize: "9.5px",
                                fontWeight: 700,
                                textTransform: "uppercase",
                                letterSpacing: "0.06em",
                              }}
                            >
                              {item.month}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Time Slot Selector */}
                  <div style={{ marginTop: "18px" }}>
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "11px",
                        fontWeight: 700,
                        color: "#0f0f0f",
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        marginBottom: "10px",
                      }}
                    >
                      <Clock className="w-3.5 h-3.5 text-[#0f0f0f]" /> Available Time Window
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {timeSlots.map((slot) => {
                        const isSelected = preferredTimeSlot === slot;
                        return (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => {
                              audioSystem.playClick(600);
                              setPreferredTimeSlot(slot);
                            }}
                            style={{
                              backgroundColor: isSelected ? "#0f0f0f" : "#FFFFFF",
                              border: isSelected ? "1.5px solid #0f0f0f" : "1px solid #d7dbd2",
                              borderRadius: "14px",
                              padding: "10.5px 18px 10.5px 24px",
                              paddingLeft: "24px",
                              paddingRight: "18px",
                              minHeight: "42px",
                              boxShadow: isSelected
                                ? "0 4px 14px rgba(8, 45, 32, 0.2)"
                                : "0 1px 2px rgba(0,0,0,0.02)",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              transition: "all 0.2s ease",
                            }}
                            className="atelier-time-slot-btn hover:border-[#0f0f0f]/50"
                          >
                            <span
                              style={{
                                color: isSelected ? "#FFFFFF" : "#111816",
                                fontWeight: isSelected ? 700 : 600,
                                fontSize: "12px",
                                letterSpacing: "0.02em",
                                paddingLeft: "4px",
                              }}
                            >
                              {slot}
                            </span>
                            {isSelected ? (
                              <div className="w-4 h-4 rounded-full bg-[#ffffff]/20 flex items-center justify-center shrink-0 ml-3">
                                <Check className="w-3 h-3 text-[#ffffff] stroke-[3]" />
                              </div>
                            ) : (
                              <Clock className="w-3.5 h-3.5 text-[#7d807a] opacity-60 shrink-0 ml-3" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* 3. Optional Fit & Measurements */}
                <div style={{ marginTop: "24px", paddingTop: "20px", borderTop: "1px solid #d7dbd2" }}>
                  <div className="flex items-center gap-2" style={{ marginBottom: "12px" }}>
                    <Scissors className="w-4 h-4 text-[#0f0f0f]" />
                    <h3
                      style={{
                        fontFamily: "var(--font-dm-mono), monospace",
                        fontSize: "17.5px",
                        fontWeight: 700,
                        color: "#111816",
                        margin: 0,
                      }}
                    >
                      Bespoke Sizing Notes{" "}
                      <span style={{ fontSize: "11.5px", fontWeight: 400, color: "#71717a" }}>
                        (Optional)
                      </span>
                    </h3>
                  </div>

                  {/* 4 Measurements */}
                  <div style={{ marginBottom: "12px" }}>
                    <label
                      style={{
                        display: "block",
                        fontSize: "10.5px",
                        fontWeight: 700,
                        color: "#52525b",
                        textTransform: "uppercase",
                        letterSpacing: "0.07em",
                        marginBottom: "6px",
                      }}
                    >
                      Calibrated Dimension Metrics (Inches)
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {[
                        { label: "Chest", val: chestInches, setVal: setChestInches, ph: "40" },
                        { label: "Waist", val: waistInches, setVal: setWaistInches, ph: "32" },
                        { label: "Hips", val: hipsInches, setVal: setHipsInches, ph: "38" },
                        { label: "Inseam", val: inseamInches, setVal: setInseamInches, ph: "30" },
                      ].map((item, idx) => (
                        <div key={idx}>
                          <label
                            style={{
                              display: "block",
                              fontSize: "10px",
                              fontWeight: 700,
                              color: "#71717a",
                              textTransform: "uppercase",
                              letterSpacing: "0.06em",
                              marginBottom: "4px",
                            }}
                          >
                            {item.label} (IN)
                          </label>
                          <input
                            type="number"
                            placeholder={item.ph}
                            value={item.val}
                            onChange={(e) =>
                              item.setVal(e.target.value ? Number(e.target.value) : "")
                            }
                            style={{
                              width: "100%",
                              padding: "7.5px 10px",
                              borderRadius: "10px",
                              border: "1px solid #d7dbd2",
                              backgroundColor: "#FFFFFF",
                              fontSize: "12px",
                              fontFamily: "monospace",
                              color: "#111816",
                              outline: "none",
                              boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
                            }}
                            className="focus:border-[#0f0f0f] focus:ring-1 focus:ring-[#0f0f0f]/20 transition-all"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Silhouette Preference */}
                  <div style={{ marginBottom: "12px" }}>
                    <label
                      style={{
                        display: "block",
                        fontSize: "10.5px",
                        fontWeight: 700,
                        color: "#52525b",
                        textTransform: "uppercase",
                        letterSpacing: "0.07em",
                        marginBottom: "6px",
                      }}
                    >
                      Silhouette Cut Preference
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: "bespoke", label: "100% BESPOKE" },
                        { id: "boxy", label: "BOXY ARCHITECTURAL" },
                        { id: "oversized", label: "OVERSIZED RELAXED" },
                        { id: "tapered", label: "STRUCTURED SLIM" },
                      ].map((item) => {
                        const isSelected = fitPreference === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              audioSystem.playClick(600);
                              setFitPreference(item.id as any);
                            }}
                            style={{
                              backgroundColor: isSelected ? "#0f0f0f" : "#FFFFFF",
                              border: isSelected ? "1.5px solid #0f0f0f" : "1px solid #d7dbd2",
                              borderRadius: "10px",
                              padding: "8px 12px",
                              minHeight: "36px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer",
                              boxShadow: isSelected
                                ? "0 4px 12px rgba(8, 45, 32, 0.18)"
                                : "0 1px 2px rgba(0,0,0,0.02)",
                              transition: "all 0.2s ease",
                            }}
                            className="hover:border-[#0f0f0f]/50"
                          >
                            <span
                              style={{
                                color: isSelected ? "#FFFFFF" : "#374151",
                                fontSize: "10.5px",
                                fontWeight: isSelected ? 700 : 600,
                                letterSpacing: "0.06em",
                                textTransform: "uppercase",
                              }}
                            >
                              {item.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Special Tailoring Notes */}
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "10.5px",
                        fontWeight: 700,
                        color: "#52525b",
                        textTransform: "uppercase",
                        letterSpacing: "0.07em",
                        marginBottom: "5px",
                      }}
                    >
                      Special Tailoring Requests / Fabric Notes
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Broader shoulders, extra jacket sleeve length, lightweight English wool..."
                      value={customNotes}
                      onChange={(e) => setCustomNotes(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        borderRadius: "10px",
                        border: "1px solid #d7dbd2",
                        backgroundColor: "#FFFFFF",
                        fontSize: "12px",
                        color: "#111816",
                        outline: "none",
                        resize: "none",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
                      }}
                      className="focus:border-[#0f0f0f] focus:ring-1 focus:ring-[#0f0f0f]/20 transition-all"
                    />
                  </div>
                </div>
              </form>
            )}

            {/* ================= STEP 3: CONFIRMATION DOSSIER ================= */}
            {currentStep === 3 && bookedAppointment && (
              <div
                style={{
                  marginTop: "20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "18px",
                  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                }}
              >
                {/* 1. Status & Reference Header Bar */}
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "12px",
                    padding: "12px 18px",
                    backgroundColor: "#FFFFFF",
                    border: "1px solid #d7dbd2",
                    borderRadius: "14px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
                    <div
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "50%",
                        backgroundColor: "#f4f6f2",
                        color: "#0f0f0f",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Check className="w-4 h-4 text-[#0f0f0f] stroke-[3]" />
                    </div>
                    <div>
                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: 700,
                          letterSpacing: "0.06em",
                          textTransform: "uppercase",
                          color: "#0f0f0f",
                          display: "block",
                          lineHeight: 1.2,
                        }}
                      >
                        Bespoke Consultation Confirmed
                      </span>
                      <span style={{ fontSize: "11px", color: "#71717a" }}>
                        Master pattern maker reserved for your session
                      </span>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "6px 12px",
                      borderRadius: "10px",
                      backgroundColor: "#edf1e8",
                      border: "1px solid #d7dbd2",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "10.5px",
                        fontWeight: 700,
                        color: "#71717a",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      REF:
                    </span>
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: 700,
                        fontFamily: "var(--font-dm-mono), 'DM Mono', monospace",
                        color: "#0f0f0f",
                        letterSpacing: "0.04em",
                      }}
                    >
                      {bookedAppointment.appointmentId}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyId}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        padding: "4px 8px",
                        borderRadius: "6px",
                        backgroundColor: copiedId ? "#edf1e8" : "#FFFFFF",
                        border: "1px solid #d7dbd2",
                        fontSize: "11px",
                        fontWeight: 600,
                        color: copiedId ? "#0f0f0f" : "#0f0f0f",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                      title="Copy Appointment Reference"
                    >
                      {copiedId ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-[#0f0f0f] stroke-[2.5]" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* 2. Main Dossier Card (2-Column Grid) */}
                <div
                  style={{
                    backgroundColor: "#FFFFFF",
                    border: "1px solid #d7dbd2",
                    borderRadius: "18px",
                    padding: "22px 24px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                    gap: "24px",
                  }}
                >
                  {/* Left Column: Schedule & Venue */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: "#0f0f0f",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        paddingBottom: "8px",
                        borderBottom: "1px solid #f4f6f2",
                      }}
                    >
                      <Calendar className="w-3.5 h-3.5 text-[#0f0f0f]" />
                      Session & Schedule
                    </div>

                    {/* Format */}
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                      <div
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "10px",
                          backgroundColor: "#f4f6f2",
                          color: "#0f0f0f",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        {bookedAppointment.appointmentType === "home_fitting" ? (
                          <Building2 className="w-4 h-4 text-[#0f0f0f]" />
                        ) : bookedAppointment.appointmentType === "virtual_consultation" ? (
                          <Video className="w-4 h-4 text-[#0f0f0f]" />
                        ) : (
                          <Scissors className="w-4 h-4 text-[#0f0f0f]" />
                        )}
                      </div>
                      <div>
                        <span
                          style={{
                            fontSize: "10px",
                            fontWeight: 700,
                            letterSpacing: "0.05em",
                            color: "#7d807a",
                            textTransform: "uppercase",
                            display: "block",
                          }}
                        >
                          Experience Mode
                        </span>
                        <span style={{ fontSize: "13.5px", fontWeight: 700, color: "#111816", display: "block" }}>
                          {bookedAppointment.appointmentType === "home_fitting"
                            ? "Home Concierge Fitting"
                            : bookedAppointment.appointmentType === "virtual_consultation"
                            ? "Virtual Master Pattern Consultation"
                            : "Private Flagship Atelier Visit"}
                        </span>
                        <span style={{ fontSize: "11.5px", color: "#52525b" }}>
                          {bookedAppointment.appointmentType === "home_fitting"
                            ? "Private Fitting at Your Residence"
                            : bookedAppointment.appointmentType === "virtual_consultation"
                            ? "HD Video Consultation with Master Tailor"
                            : "Atelier Lounge (Flagship Studio)"}
                        </span>
                      </div>
                    </div>

                    {/* Date & Time */}
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                      <div
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "10px",
                          backgroundColor: "#f4f6f2",
                          color: "#0f0f0f",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <Clock className="w-4 h-4 text-[#0f0f0f]" />
                      </div>
                      <div>
                        <span
                          style={{
                            fontSize: "10px",
                            fontWeight: 700,
                            letterSpacing: "0.05em",
                            color: "#7d807a",
                            textTransform: "uppercase",
                            display: "block",
                          }}
                        >
                          Reserved Window
                        </span>
                        <span style={{ fontSize: "13.5px", fontWeight: 700, color: "#111816", display: "block" }}>
                          {bookedAppointment.preferredDate}
                        </span>
                        <span
                          style={{
                            fontSize: "12px",
                            fontWeight: 600,
                            color: "#0f0f0f",
                            backgroundColor: "#f4f6f2",
                            padding: "2px 8px",
                            borderRadius: "6px",
                            display: "inline-block",
                            marginTop: "3px",
                          }}
                        >
                          {bookedAppointment.preferredTimeSlot}
                        </span>
                      </div>
                    </div>

                    {/* Venue / Address */}
                    {(bookedAppointment.city || bookedAppointment.address) && (
                      <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                        <div
                          style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "10px",
                            backgroundColor: "#f4f6f2",
                            color: "#0f0f0f",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <MapPin className="w-4 h-4 text-[#0f0f0f]" />
                        </div>
                        <div>
                          <span
                            style={{
                              fontSize: "10px",
                              fontWeight: 700,
                              letterSpacing: "0.05em",
                              color: "#7d807a",
                              textTransform: "uppercase",
                              display: "block",
                            }}
                          >
                            Destination & Coordinates
                          </span>
                          <span style={{ fontSize: "13px", fontWeight: 600, color: "#111816", display: "block" }}>
                            {bookedAppointment.city}
                            {bookedAppointment.pincode ? ` (${bookedAppointment.pincode})` : ""}
                          </span>
                          {bookedAppointment.address && (
                            <span style={{ fontSize: "11.5px", color: "#52525b", display: "block" }}>
                              {bookedAppointment.address}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Client & Tailoring Directives */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: "#0f0f0f",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        paddingBottom: "8px",
                        borderBottom: "1px solid #f4f6f2",
                      }}
                    >
                      <User className="w-3.5 h-3.5 text-[#0f0f0f]" />
                      Client & Directives
                    </div>

                    {/* Client Identity */}
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                      <div
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "10px",
                          backgroundColor: "#f4f6f2",
                          color: "#0f0f0f",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <User className="w-4 h-4 text-[#0f0f0f]" />
                      </div>
                      <div>
                        <span
                          style={{
                            fontSize: "10px",
                            fontWeight: 700,
                            letterSpacing: "0.05em",
                            color: "#7d807a",
                            textTransform: "uppercase",
                            display: "block",
                          }}
                        >
                          Patron
                        </span>
                        <span style={{ fontSize: "13.5px", fontWeight: 700, color: "#111816", display: "block" }}>
                          {bookedAppointment.fullName}
                        </span>
                        <span style={{ fontSize: "11.5px", color: "#52525b", display: "block" }}>
                          {bookedAppointment.email} • {bookedAppointment.phone}
                        </span>
                      </div>
                    </div>

                    {/* Garment & Silhouette */}
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                      <div
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "10px",
                          backgroundColor: "#f4f6f2",
                          color: "#0f0f0f",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <Scissors className="w-4 h-4 text-[#0f0f0f]" />
                      </div>
                      <div>
                        <span
                          style={{
                            fontSize: "10px",
                            fontWeight: 700,
                            letterSpacing: "0.05em",
                            color: "#7d807a",
                            textTransform: "uppercase",
                            display: "block",
                          }}
                        >
                          Garment Reference
                        </span>
                        <span style={{ fontSize: "13.5px", fontWeight: 700, color: "#111816", display: "block" }}>
                          {bookedAppointment.productName || "Bespoke Silhouette Consultation"}
                        </span>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "4px" }}>
                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: 700,
                              textTransform: "uppercase",
                              letterSpacing: "0.05em",
                              backgroundColor: "#edf1e8",
                              border: "1px solid #d7dbd2",
                              padding: "2px 8px",
                              borderRadius: "6px",
                              color: "#0f0f0f",
                            }}
                          >
                            {bookedAppointment.measurements?.fitPreference
                              ? `${bookedAppointment.measurements.fitPreference.toUpperCase()} FIT`
                              : "BESPOKE FIT"}
                          </span>
                          {bookedAppointment.measurements?.heightCm && (
                            <span
                              style={{
                                fontSize: "11px",
                                fontWeight: 600,
                                backgroundColor: "#edf1e8",
                                border: "1px solid #d7dbd2",
                                padding: "2px 8px",
                                borderRadius: "6px",
                                color: "#52525b",
                              }}
                            >
                              Height: {bookedAppointment.measurements.heightCm} cm
                            </span>
                          )}
                          {bookedAppointment.measurements?.weightKg && (
                            <span
                              style={{
                                fontSize: "11px",
                                fontWeight: 600,
                                backgroundColor: "#edf1e8",
                                border: "1px solid #d7dbd2",
                                padding: "2px 8px",
                                borderRadius: "6px",
                                color: "#52525b",
                              }}
                            >
                              Weight: {bookedAppointment.measurements.weightKg} kg
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Reassuring Concierge Notice Banner */}
                <div
                  style={{
                    backgroundColor: "#f4f6f2",
                    border: "1px solid #d7dbd2",
                    borderRadius: "14px",
                    padding: "14px 18px",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                  }}
                >
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      backgroundColor: "#0f0f0f",
                      color: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Mail className="w-4 h-4 text-[#ffffff]" />
                  </div>
                  <p style={{ margin: 0, fontSize: "12px", lineHeight: "1.5", color: "#52525b" }}>
                    An official calendar invitation and bespoke checklist have been dispatched to{" "}
                    <strong style={{ color: "#0f0f0f" }}>{bookedAppointment.email}</strong>. Our concierge will contact
                    you via phone/WhatsApp (<strong>{bookedAppointment.phone}</strong>) prior to your appointment.
                  </p>
                </div>

                {/* 4. Action CTA Buttons */}
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "12px",
                    marginTop: "6px",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      audioSystem.playClick(400);
                      onClose();
                    }}
                    className="btn-atelier-return"
                  >
                    <Scissors className="w-4 h-4 text-[#ffffff]" />
                    <span>RETURN TO ATELIER</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyAll}
                    style={{
                      backgroundColor: copiedAll ? "#f4f6f2" : "#FFFFFF",
                      border: copiedAll ? "1.5px solid #ffffff" : "1px solid #d7dbd2",
                      color: "#0f0f0f",
                      padding: "12px 22px",
                      borderRadius: "14px",
                      fontSize: "12.5px",
                      fontWeight: 700,
                      letterSpacing: "0.04em",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {copiedAll ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
                        <span>Dossier Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copy Dossier Summary</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 8. Footer (Matching Prompt Requirements & Reference Mockup) */}
          {currentStep < 3 && (
            <div
              className="flex flex-col sm:flex-row items-center justify-between gap-4 font-sans shrink-0"
              style={{
                marginTop: "26px",
                paddingTop: "0px",
              }}
            >
              {/* Left Side: Trust & Certification */}
              <div className="flex items-center gap-2 text-xs">
                <div className="flex items-center gap-1.5 font-bold tracking-wider text-[#111816]">
                  <ShieldCheck className="w-4 h-4 text-[#111816]" />
                  <span style={{ color: "#111816", fontWeight: 700, fontSize: "11px", letterSpacing: "0.08em" }}>
                    ATELIER CERTIFIED
                  </span>
                </div>
                <span style={{ color: "#d7dbd2", margin: "0 6px" }}>|</span>
                <div className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wider text-neutral-500 uppercase">
                  <Globe className="w-3.5 h-3.5 text-[#7d807a]" />
                  <span style={{ color: "#71717a", fontSize: "10.5px", fontWeight: 600, letterSpacing: "0.06em" }}>
                    TRUSTED BY DISCERNING CLIENTS WORLDWIDE
                  </span>
                </div>
              </div>

              {/* Right Side: Action CTA Button */}
              <div className="flex items-center gap-3 shrink-0">
                {currentStep === 2 && (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="px-6 py-3 rounded-xl border border-[#d7dbd2] bg-white text-[#111816] hover:bg-neutral-100 text-xs font-bold tracking-wider uppercase transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back
                  </button>
                )}

                {currentStep === 1 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="btn-continue"
                    style={{
                      backgroundColor: "#0f0f0f",
                      color: "#FFFFFF",
                      padding: "12px 32px",
                      borderRadius: "12px",
                      fontSize: "14px",
                      fontWeight: 600,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      width: "auto",
                      boxShadow: "0 4px 14px rgba(8, 45, 32, 0.25)",
                    }}
                  >
                    <span style={{ color: "#FFFFFF", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>Continue</span>
                    <ArrowRight className="w-4 h-4 text-white" style={{ color: "#FFFFFF" }} />
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleSubmitBooking}
                    className="btn-continue"
                    style={{
                      backgroundColor: "#0f0f0f",
                      color: "#FFFFFF",
                      padding: "12px 32px",
                      borderRadius: "12px",
                      fontSize: "14px",
                      fontWeight: 600,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      width: "auto",
                      boxShadow: "0 4px 14px rgba(8, 45, 32, 0.25)",
                    }}
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span style={{ color: "#FFFFFF" }}>Reserving Atelier...</span>
                      </>
                    ) : (
                      <>
                        <span style={{ color: "#FFFFFF", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>Confirm Consultation</span>
                        <ArrowRight className="w-4 h-4 text-white" style={{ color: "#FFFFFF" }} />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
