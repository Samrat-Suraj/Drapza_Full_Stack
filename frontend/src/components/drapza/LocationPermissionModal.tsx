"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { MapPin, Navigation, ShieldCheck, CheckCircle2, AlertCircle, RefreshCw, X } from "lucide-react";
import { telemetryApi } from "@/lib/api";
import { useLockBodyScroll, forceUnlockBodyScroll } from "./useLockBodyScroll";

export interface UserDetectedLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  formattedAddress: string;
  clientIp: string;
  timestamp: number;
}

export function LocationPermissionModal() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  useLockBodyScroll(isOpen);
  const [isLocating, setIsLocating] = useState(false);
  const [locationSuccess, setLocationSuccess] = useState<UserDetectedLocation | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    // Generate or retrieve persistent guest session ID
    let sessionId = localStorage.getItem("drapza_session_id");
    if (!sessionId) {
      sessionId = `DPZ-GST-${Math.random().toString(36).substring(2, 9).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
      localStorage.setItem("drapza_session_id", sessionId);
    }

    // Check if session has already logged its visit
    const alreadyPingedInSession = typeof window !== "undefined" ? sessionStorage.getItem("drapza_telemetry_pinged") : null;
    const lastPingTime = typeof window !== "undefined" ? localStorage.getItem("drapza_last_telemetry_time") : null;
    const isStale = !lastPingTime || Date.now() - Number(lastPingTime) > 4 * 60 * 60 * 1000;

    // Auto-capture IP and approximate location for ALL visitors (Guest & Registered)
    const logInitialVisitor = async () => {
      try {
        let clientIp = "127.0.0.1";
        let city = "New Delhi";
        let state = "Delhi";
        let country = "India";
        let postalCode = "";
        let latitude = 28.6139;
        let longitude = 77.2090;

        // Fetch IP & approximate regional details
        try {
          const ipRes = await fetch("https://ipapi.co/json/");
          if (ipRes.ok) {
            const data = await ipRes.json();
            clientIp = data.ip || clientIp;
            city = data.city || city;
            state = data.region || state;
            country = data.country_name || country;
            postalCode = data.postal || postalCode;
            if (data.latitude && data.longitude) {
              latitude = data.latitude;
              longitude = data.longitude;
            }
          }
        } catch (e) {
          // Fallback to basic ipify
          try {
            const ipifyRes = await fetch("https://api.ipify.org?format=json");
            if (ipifyRes.ok) {
              const d = await ipifyRes.json();
              clientIp = d.ip || clientIp;
            }
          } catch (err) {}
        }

        // Determine if user is registered from localStorage
        let userType: "guest" | "registered" = "guest";
        let userName = "Guest Visitor";
        let userEmail = "";

        const savedUser = localStorage.getItem("drapza_user");
        if (savedUser) {
          try {
            const u = JSON.parse(savedUser);
            if (u.name || u.email) {
              userType = "registered";
              userName = u.name || "Client Member";
              userEmail = u.email || "";
            }
          } catch (e) {}
        }

        // Send Initial Telemetry Ping
        await telemetryApi.recordLocation({
          latitude,
          longitude,
          accuracy: 500,
          city,
          state,
          postalCode,
          country,
          formattedAddress: `${city}, ${state}, ${country}`,
          clientIp,
          precisionType: "IP_APPROXIMATE",
          sessionId,
          userType,
          userName,
          userEmail,
        });

        sessionStorage.setItem("drapza_telemetry_pinged", "true");
        localStorage.setItem("drapza_last_telemetry_time", Date.now().toString());
      } catch (err) {
        console.warn("[SILENT VISITOR TELEMETRY]:", err);
      }
    };

    if (!alreadyPingedInSession || isStale) {
      logInitialVisitor();
    }

    // Check if high-precision GPS location was already captured in the last 24 hours
    const saved = localStorage.getItem("drapza_user_location");
    const dismissed = localStorage.getItem("drapza_location_dismissed");

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
          return;
        }
      } catch (e) {}
    }

    // Check if modal was already prompted in this browser session
    const alreadyPrompted = typeof window !== "undefined" ? sessionStorage.getItem("drapza_location_prompted") : null;

    // Helper to detect 404 route dynamically
    const is404Active = () => typeof window !== "undefined" && Boolean(
      (window as any).__drapzaIs404 ||
      (typeof document !== "undefined" && document.querySelector("[data-drapza-404]"))
    );

    // Do not auto-open on admin pages, 404 pages, or if already dismissed/prompted
    if (pathname?.startsWith("/admin") || is404Active()) return;

    if (!dismissed && !alreadyPrompted) {
      sessionStorage.setItem("drapza_location_prompted", "true");
      const timer = setTimeout(() => {
        if (typeof document !== "undefined" && (is404Active() || window.location.pathname.startsWith("/admin"))) return;
        setIsOpen(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  // Instantly close modal and release scroll if transitioning to admin or 404 page
  useEffect(() => {
    const is404 = typeof window !== "undefined" && Boolean(
      (window as any).__drapzaIs404 ||
      (typeof document !== "undefined" && document.querySelector("[data-drapza-404]"))
    );
    if (pathname?.startsWith("/admin") || is404) {
      setIsOpen(false);
      forceUnlockBodyScroll();
    }
  }, [pathname]);

  const requestExactLocation = async () => {
    setIsLocating(true);
    setErrorMessage(null);

    if (typeof window === "undefined" || !navigator.geolocation) {
      setErrorMessage("Geolocation is not supported by your browser.");
      setIsLocating(false);
      return;
    }

    // 1. Fetch public IP simultaneously
    let publicIp = "127.0.0.1";
    try {
      const ipRes = await fetch("https://api.ipify.org?format=json");
      if (ipRes.ok) {
        const ipData = await ipRes.json();
        publicIp = ipData.ip || "127.0.0.1";
      }
    } catch (e) {
      console.warn("[IP FETCH] Fallback to backend header IP");
    }

    // 2. Request 100% High-Accuracy GPS Sensor / Satellite Fix
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;

        let city = "New Delhi";
        let state = "Delhi";
        let postalCode = "";
        let country = "India";
        let formattedAddress = "";

        // 3. High-Accuracy Reverse Geocoding via Nominatim
        try {
          const geoRes = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
            { headers: { "Accept-Language": "en" } }
          );

          if (geoRes.ok) {
            const geoData = await geoRes.json();
            const addr = geoData.address || {};
            city =
              addr.city ||
              addr.town ||
              addr.village ||
              addr.suburb ||
              addr.city_district ||
              addr.county ||
              "Delhi";
            state = addr.state || "Delhi";
            postalCode = addr.postcode || "";
            country = addr.country || "India";
            formattedAddress = geoData.display_name || `${city}, ${state}, ${country}`;
          }
        } catch (err) {
          console.warn("[REVERSE GEOCODE] Error:", err);
        }

        // Determine user identity
        let userType: "guest" | "registered" = "guest";
        let userName = "Guest Visitor";
        let userEmail = "";

        const savedUser = localStorage.getItem("drapza_user");
        if (savedUser) {
          try {
            const u = JSON.parse(savedUser);
            if (u.name || u.email) {
              userType = "registered";
              userName = u.name || "Client Member";
              userEmail = u.email || "";
            }
          } catch (e) {}
        }

        const sessionId = localStorage.getItem("drapza_session_id") || "";

        const locationPayload: UserDetectedLocation = {
          latitude,
          longitude,
          accuracy: Math.round(accuracy),
          city,
          state,
          postalCode,
          country,
          formattedAddress,
          clientIp: publicIp,
          timestamp: Date.now(),
        };

        // 4. Save to Client Storage
        localStorage.setItem("drapza_user_location", JSON.stringify(locationPayload));
        localStorage.setItem("drapza_location_permission", "granted");

        // 5. Transmit 100% Verified Telemetry to Backend
        try {
          await telemetryApi.recordLocation({
            ...locationPayload,
            precisionType: "GPS_HIGH_ACCURACY",
            userType,
            userName,
            userEmail,
            sessionId,
          });
        } catch (apiErr) {
          console.warn("[TELEMETRY POST] Error:", apiErr);
        }

        setLocationSuccess(locationPayload);
        setIsLocating(false);

        // Auto-close after 3 seconds of showing success confirmation
        setTimeout(() => {
          setIsOpen(false);
          forceUnlockBodyScroll();
        }, 3000);
      },
      (error) => {
        setIsLocating(false);
        let msg = "Location permission was denied.";
        if (error.code === error.TIMEOUT) {
          msg = "Location request timed out. Please retry.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = "Position satellite signal unavailable.";
        }
        setErrorMessage(msg);
      },
      {
        enableHighAccuracy: true, // 100% Accurate GPS Hardware Sensor
        timeout: 15000,
        maximumAge: 0, // Fresh coordinates
      }
    );
  };

  const handleDismiss = () => {
    localStorage.setItem("drapza_location_dismissed", "true");
    setIsOpen(false);
    forceUnlockBodyScroll();
  };

  const is404 = typeof window !== "undefined" && Boolean(
    (window as any).__drapzaIs404 ||
    (typeof document !== "undefined" && document.querySelector("[data-drapza-404]"))
  );

  if (pathname?.startsWith("/admin") || is404 || !isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="location-modal-title"
      aria-describedby="location-modal-desc"
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn select-none font-mono"
    >
      <div className="relative w-full max-w-md bg-[#0e0f12] border border-white/20 rounded-3xl p-6 sm:p-7 shadow-[0_25px_60px_rgba(0,0,0,0.8)] text-white space-y-5 overflow-hidden">
        
        {/* Ambient Top Glow Line */}
        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-white to-transparent" />

        {/* Header Icon & Close */}
        <div className="flex items-start justify-between">
          <div className="w-12 h-12 rounded-2xl bg-white text-black flex items-center justify-center shadow-xl">
            <Navigation className="w-6 h-6 animate-pulse" />
          </div>

          <button
            onClick={handleDismiss}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white transition-all cursor-pointer"
            aria-label="Dismiss location request"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Title & Dispatch Context */}
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-white text-[10px] font-bold tracking-widest uppercase">
            <ShieldCheck className="w-3 h-3 text-white" />
            <span>100% PRECISE DISPATCH SYNC</span>
          </div>
          <h2 id="location-modal-title" className="text-xl font-bold font-mono uppercase tracking-tight text-white">
            ENABLE PRECISE LOCATION
          </h2>
          <p id="location-modal-desc" className="text-xs text-neutral-300 leading-relaxed">
            Drapza requires high-accuracy GPS and IP telemetry to compute exact delivery dispatch, express route logistics, and live waypoint tracking to your doorstep.
          </p>
        </div>

        {/* Success State Confirmation */}
        {locationSuccess && (
          <div className="p-4 rounded-2xl bg-white/10 border border-white/40 text-white space-y-2 text-xs animate-fadeIn">
            <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-white">
              <CheckCircle2 className="w-4 h-4 text-white" />
              <span>100% LOCATION VERIFIED ✓</span>
            </div>
            <div className="space-y-0.5 text-[11px] text-neutral-100 font-medium">
              <div>
                <strong className="text-white">Region: </strong>
                {locationSuccess.city}, {locationSuccess.state} {locationSuccess.postalCode}
              </div>
              <div className="truncate text-neutral-100">
                <strong className="text-white">GPS: </strong>
                {locationSuccess.latitude.toFixed(4)}° N, {locationSuccess.longitude.toFixed(4)}° E (±{locationSuccess.accuracy}m)
              </div>
              <div>
                <strong className="text-white">IP: </strong>
                {locationSuccess.clientIp}
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-white/5 border border-white/30 text-neutral-300 text-xs flex items-center gap-2 animate-shake">
            <AlertCircle className="w-4 h-4 text-white shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Action Buttons */}
        {!locationSuccess && (
          <div className="flex flex-col gap-2.5 pt-2">
            <button
              type="button"
              onClick={requestExactLocation}
              disabled={isLocating}
              className="w-full py-3.5 px-6 rounded-2xl bg-white hover:bg-neutral-200 text-black font-mono text-xs font-bold uppercase tracking-widest transition-all cursor-pointer shadow-2xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLocating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>CALIBRATING SATELLITE GPS (100%)...</span>
                </>
              ) : (
                <>
                  <MapPin className="w-4 h-4" />
                  <span>ALLOW PRECISE 100% LOCATION</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDismiss}
              className="w-full py-2.5 px-4 text-center text-white hover:text-neutral-200 text-[11px] font-mono font-semibold transition-colors uppercase tracking-wider cursor-pointer"
            >
              CONTINUE AS GUEST REGION
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
