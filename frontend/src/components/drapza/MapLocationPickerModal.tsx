"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  X,
  MapPin,
  Navigation,
  Search,
  Check,
  Compass,
  Layers,
  Loader2,
  AlertCircle,
  Building,
} from "lucide-react";
import { audioSystem } from "./AudioSystem";
import { useLockBodyScroll } from "./useLockBodyScroll";

export interface SelectedLocationData {
  street: string;
  landmark: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  lat: number;
  lng: number;
  formattedAddress: string;
}

interface MapLocationPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLocation: (data: SelectedLocationData) => void;
  initialCoords?: { lat: number; lng: number } | null;
  initialAddress?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
  };
}

export function MapLocationPickerModal({
  isOpen,
  onClose,
  onSelectLocation,
  initialCoords,
  initialAddress,
}: MapLocationPickerModalProps) {
  useLockBodyScroll(isOpen);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Initialize coords from prop, localStorage, or fallback
  const [coords, setCoords] = useState<{ lat: number; lng: number }>(() => {
    if (initialCoords && initialCoords.lat && initialCoords.lng) {
      return initialCoords;
    }
    try {
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("drapza_saved_geo_coords");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.lat && parsed.lng) return parsed;
        }
      }
    } catch (e) {}
    return { lat: 18.5204, lng: 73.8567 }; // Central default
  });

  const [isLocating, setIsLocating] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [parsedLocation, setParsedLocation] = useState<SelectedLocationData>({
    street: initialAddress?.street || "",
    landmark: "",
    city: initialAddress?.city || "",
    state: initialAddress?.state || "",
    postalCode: initialAddress?.postalCode || "",
    country: "India",
    lat: coords.lat,
    lng: coords.lng,
    formattedAddress: "Position pin on your exact doorstep...",
  });

  // Reverse geocode using OpenStreetMap Nominatim with fallback
  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    setIsGeocoding(true);
    setErrorMessage("");
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&addressdetails=1`;
      const res = await fetch(url, {
        headers: {
          "Accept-Language": "en",
        },
      });
      if (!res.ok) throw new Error("Reverse geocoding failed");
      const data = await res.json();

      const addr = data.address || {};
      const streetParts = [
        addr.house_number || addr.building,
        addr.road || addr.street || addr.residential,
        addr.suburb || addr.neighbourhood || addr.subdistrict,
      ].filter(Boolean);

      const street = streetParts.join(", ") || data.name || "Street Address";
      const landmark = addr.amenity || addr.landmark || addr.commercial || "";
      const city =
        addr.city ||
        addr.town ||
        addr.municipality ||
        addr.village ||
        addr.county ||
        addr.state_district ||
        "";
      const state = addr.state || "";
      const postalCode = addr.postcode || "";
      const country = addr.country || "India";

      setParsedLocation({
        street,
        landmark,
        city,
        state,
        postalCode,
        country,
        lat,
        lng,
        formattedAddress: data.display_name || `${street}, ${city}, ${state} ${postalCode}`,
      });
    } catch (err: any) {
      console.warn("Geocode error, setting coordinate fallback", err);
      setParsedLocation((prev) => ({
        ...prev,
        lat,
        lng,
        formattedAddress: `Coordinates: ${lat.toFixed(5)}, ${lng.toFixed(5)}`,
      }));
    } finally {
      setIsGeocoding(false);
    }
  }, []);

  // Initialize Leaflet Map dynamically
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;

    const initMap = async () => {
      // 1. Inject Leaflet CSS if not already loaded
      if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link");
        link.id = "leaflet-css";
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }

      // 2. Inject Leaflet JS if not already loaded
      if (!(window as any).L) {
        await new Promise<void>((resolve) => {
          const script = document.createElement("script");
          script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
          script.async = true;
          script.onload = () => resolve();
          document.body.appendChild(script);
        });
      }

      const L = (window as any).L;
      if (!L || !mapContainerRef.current || !isMounted) return;

      // Cleanup existing map if any
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      // Custom high-contrast Atelier Pin icon
      const customPin = L.divIcon({
        className: "custom-leaflet-pin",
        html: `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%);">
            <div style="background: #0f0f0f; color: #fff; padding: 4px 8px; border-radius: 6px; font-family: monospace; font-size: 9px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em; border: 1px solid rgba(255,255,255,0.4); box-shadow: 0 4px 12px rgba(0,0,0,0.5); white-space: nowrap; margin-bottom: 4px;">
              DISPATCH PIN
            </div>
            <div style="width: 28px; height: 28px; background: #0f0f0f; border: 3px solid #10b981; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; box-shadow: 0 6px 16px rgba(0,0,0,0.6);">
              <div style="width: 8px; height: 8px; background: #fff; border-radius: 50%; transform: rotate(45deg);"></div>
            </div>
            <div style="width: 14px; height: 4px; background: rgba(0,0,0,0.3); border-radius: 50%; margin-top: -2px; filter: blur(1px);"></div>
          </div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });

      // Initialize map instance
      const map = L.map(mapContainerRef.current, {
        center: [coords.lat, coords.lng],
        zoom: 15,
        zoomControl: false,
      });

      // Add Zoom Control at bottom right
      L.control.zoom({ position: "bottomright" }).addTo(map);

      // Google Maps Direct Street Tiles (No watermark, 100% clean & fast)
      L.tileLayer("https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}", {
        attribution: '&copy; Google Maps',
        maxZoom: 20,
        subdomains: ["mt0", "mt1", "mt2", "mt3"],
      }).addTo(map);

      // Marker
      const marker = L.marker([coords.lat, coords.lng], {
        draggable: true,
        icon: customPin,
      }).addTo(map);

      markerRef.current = marker;
      mapInstanceRef.current = map;

      // Handle marker drag end
      marker.on("dragend", (e: any) => {
        const newPos = e.target.getLatLng();
        setCoords({ lat: newPos.lat, lng: newPos.lng });
        reverseGeocode(newPos.lat, newPos.lng);
        audioSystem.playClick(700, 0.02);
      });

      // Handle map click
      map.on("click", (e: any) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        setCoords({ lat, lng });
        reverseGeocode(lat, lng);
        audioSystem.playClick(600, 0.02);
      });

      // Fetch initial geocoding for default coords
      reverseGeocode(coords.lat, coords.lng);

      // Force recalculate dimensions after modal mount
      setTimeout(() => {
        map.invalidateSize();
      }, 250);
    };

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isOpen]);

  // GPS Auto-detect handler
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      setErrorMessage("Geolocation is not supported by your browser hardware.");
      return;
    }

    setIsLocating(true);
    setErrorMessage("");
    audioSystem.playClick(850, 0.03);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCoords({ lat: latitude, lng: longitude });

        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.flyTo([latitude, longitude], 17, { duration: 1.2 });
          markerRef.current.setLatLng([latitude, longitude]);
        }

        reverseGeocode(latitude, longitude);
        setIsLocating(false);
      },
      (error) => {
        console.error("GPS location error:", error);
        setIsLocating(false);
        setErrorMessage("Could not detect GPS location. Please ensure location permission is allowed.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Search Address / Place Query
  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setErrorMessage("");
    audioSystem.playClick(700, 0.02);

    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        searchQuery
      )}&limit=5&countrycodes=in`;
      const res = await fetch(url);
      const data = await res.json();

      if (data && data.length > 0) {
        setSearchResults(data);
      } else {
        setSearchResults([]);
        setErrorMessage("No matching landmarks found. Try searching by city or pincode.");
      }
    } catch (err) {
      setErrorMessage("Search service unavailable. Please drag the pin on map.");
    } finally {
      setIsSearching(false);
    }
  };

  // Pick search suggestion
  const handleSelectSearchResult = (result: any) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);

    setCoords({ lat, lng });
    setSearchResults([]);
    setSearchQuery(result.display_name.split(",")[0] || searchQuery);

    if (mapInstanceRef.current && markerRef.current) {
      mapInstanceRef.current.flyTo([lat, lng], 17, { duration: 1 });
      markerRef.current.setLatLng([lat, lng]);
    }

    reverseGeocode(lat, lng);
    audioSystem.playClick(900, 0.03);
  };

  // Confirm selection and apply to checkout form
  const handleConfirm = () => {
    audioSystem.playClick(1000, 0.04);
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(
          "drapza_saved_geo_coords",
          JSON.stringify({ lat: coords.lat, lng: coords.lng })
        );
      }
    } catch (e) {}
    onSelectLocation(parsedLocation);
    onClose();
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto overscroll-contain">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={() => {
          audioSystem.playClick(400);
          onClose();
        }}
      />

      {/* Modal Card */}
      <div className="relative z-10 w-full max-w-4xl my-auto h-[92vh] max-h-[750px] overflow-hidden rounded-none bg-[#0e0f12] text-white border border-white/20 shadow-2xl flex flex-col overscroll-contain">
        
        {/* Top Header */}
        <div className="p-3.5 sm:p-5 border-b border-white/15 flex items-center justify-between bg-[#14161a] shrink-0">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-none bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <MapPin className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="font-mono-technical text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-neutral-400 block truncate">
                [ ATELIER GEO-COORDINATES ]
              </span>
              <h2 className="font-display text-lg sm:text-2xl uppercase tracking-tight text-white leading-tight truncate">
                PICK DELIVERY PIN
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              audioSystem.playClick(400);
              onClose();
            }}
            className="p-1.5 sm:p-2 rounded-none hover:bg-white/10 text-neutral-400 hover:text-white transition-colors cursor-pointer shrink-0 ml-2"
            aria-label="Close Map Picker"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar & Live GPS Actions Bar */}
        <div className="p-2.5 sm:p-4 bg-[#181a1f] border-b border-white/10 flex flex-col sm:flex-row gap-2 shrink-0">
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search area, landmark, or pincode..."
              className="w-full pl-8 sm:pl-9 pr-20 sm:pr-24 py-2 sm:py-2.5 rounded-none bg-[#0f1013] border border-white/15 text-xs font-mono-technical text-white placeholder:text-neutral-500 focus:outline-none focus:border-white transition-colors"
            />
            <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-neutral-500 absolute left-2.5 sm:left-3 top-2.5 sm:top-3 pointer-events-none" />
            <button
              type="submit"
              disabled={isSearching}
              className="absolute right-1 sm:right-1.5 top-1 sm:top-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-none bg-white/10 hover:bg-white/20 text-[9px] sm:text-[10px] font-mono-technical uppercase tracking-wider text-white transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSearching ? <Loader2 className="w-3 h-3 animate-spin" /> : "SEARCH"}
            </button>

            {/* Search Dropdown Results */}
            {searchResults.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-none bg-[#14161a] border border-white/20 shadow-2xl overflow-hidden max-h-48 overflow-y-auto divide-y divide-white/5">
                {searchResults.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectSearchResult(item)}
                    className="w-full p-2.5 text-left text-xs font-mono-technical text-neutral-300 hover:text-white hover:bg-white/10 transition-colors flex items-start gap-2 cursor-pointer"
                  >
                    <Building className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span className="line-clamp-1">{item.display_name}</span>
                  </button>
                ))}
              </div>
            )}
          </form>

          <button
            type="button"
            onClick={handleLocateMe}
            disabled={isLocating}
            className="px-4 py-2.5 rounded-none bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-400 font-mono-technical text-xs uppercase tracking-wider font-medium flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm shrink-0 disabled:opacity-50"
          >
            {isLocating ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>DETECTING GPS...</span>
              </>
            ) : (
              <>
                <Navigation className="w-3.5 h-3.5" />
                <span>DETECT MY LIVE LOCATION</span>
              </>
            )}
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="px-4 py-2 bg-red-950/60 border-b border-red-500/30 text-red-400 text-xs font-mono-technical flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Main Map Container Canvas */}
        <div className="relative flex-1 w-full min-h-[260px] bg-[#1a1c22]">
          <div ref={mapContainerRef} className="w-full h-full" />

          {/* Draggable Guide Tooltip Overlay */}
          <div className="absolute top-3 left-3 z-[400] px-3 py-1.5 rounded-none bg-black/80 backdrop-blur border border-white/20 text-[10px] font-mono-technical text-neutral-300 flex items-center gap-2 shadow-lg pointer-events-none">
            <Compass className="w-3.5 h-3.5 text-emerald-400 animate-spin" style={{ animationDuration: "12s" }} />
            <span>CLICK MAP OR DRAG PIN TO FINE-TUNE PRECISION</span>
          </div>
        </div>

        {/* Bottom Address Confirmation Bar */}
        <div className="p-4 sm:p-5 bg-[#121418] border-t border-white/15 shrink-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="font-mono-technical text-[10px] uppercase text-emerald-400 tracking-wider font-bold">
                {isGeocoding ? "CALIBRATING ADDRESS..." : "SELECTED DISPATCH DESTINATION"}
              </span>
              {isGeocoding && <Loader2 className="w-3 h-3 text-emerald-400 animate-spin" />}
            </div>

            <p className="font-body text-xs sm:text-sm text-neutral-200 line-clamp-2">
              {parsedLocation.formattedAddress}
            </p>

            <div className="flex flex-wrap gap-2 text-[10px] font-mono-technical text-neutral-400 pt-0.5">
              {parsedLocation.city && <span className="bg-white/5 px-2 py-0.5 rounded-none">City: {parsedLocation.city}</span>}
              {parsedLocation.state && <span className="bg-white/5 px-2 py-0.5 rounded-none">State: {parsedLocation.state}</span>}
              {parsedLocation.postalCode && (
                <span className="bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-none font-bold">
                  PIN: {parsedLocation.postalCode}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => {
                audioSystem.playClick(400);
                onClose();
              }}
              className="flex-1 sm:flex-initial px-4 py-3 rounded-none border border-white/20 hover:bg-white/10 text-neutral-300 font-mono-technical text-xs uppercase tracking-wider transition-colors cursor-pointer"
            >
              CANCEL
            </button>

            <button
              type="button"
              onClick={handleConfirm}
              disabled={isGeocoding}
              className="flex-1 sm:flex-initial px-6 py-3 rounded-none bg-white hover:bg-neutral-200 text-black font-mono-technical text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xl hover:shadow-2xl disabled:opacity-60"
            >
              <Check className="w-4 h-4" />
              <span>APPLY TO CHECKOUT</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
