"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import gsap from "gsap";
import {
  Search,
  Truck,
  Package,
  CheckCircle2,
  Clock,
  MapPin,
  ShieldCheck,
  Copy,
  ExternalLink,
  ArrowRight,
  Scissors,
  Check,
  AlertCircle,
  FileText,
  Download,
  PhoneCall,
  RotateCcw,
  Navigation,
  Layers,
  Tag,
  Plane,
  Bell,
  CheckCheck,
} from "lucide-react";
import { audioSystem } from "./AudioSystem";
import { downloadInvoicePdf, InvoiceData } from "@/lib/invoiceDownload";
import { TrackOrderSkeleton } from "./skeletons";
import { orderApi } from "@/lib/api";
import { trackOrderInputSchema, getZodErrorMessage } from "@/lib/validation";
import { useToast } from "./ToastNotification";

// Order Database Specifications
interface Checkpoint {
  title: string;
  location: string;
  timestamp: string;
  description: string;
  completed: boolean;
  active?: boolean;
}

interface OrderData {
  orderId: string;
  trackingNumber: string;
  carrier: string;
  status: "IN_TRANSIT" | "OUT_FOR_DELIVERY" | "DELIVERED" | "PROCESSING";
  statusLabel: string;
  estimatedDelivery: string;
  origin: string;
  destination: string;
  recipientName: string;
  items: {
    name: string;
    size: string;
    color: string;
    weightSpec: string;
    qty: number;
    price: string;
    image: string;
    lotNumber: string;
  }[];
  checkpoints: Checkpoint[];
}

// Comprehensive Helper to Map Backend Orders directly from MongoDB / Admin
function mapBackendOrderToOrderData(o: any): OrderData {
  const statusStr = String(o.orderStatus || "placed").toLowerCase();
  
  let status: OrderData["status"] = "PROCESSING";
  let statusLabel = "ORDER PLACED • ATELIER RECORDED";
  
  if (statusStr === "delivered") {
    status = "DELIVERED";
    statusLabel = "DELIVERED • SIGNED & VERIFIED";
  } else if (statusStr === "shipped") {
    status = "OUT_FOR_DELIVERY";
    statusLabel = "IN TRANSIT • AIR CARGO EN ROUTE";
  } else if (statusStr === "processing") {
    status = "IN_TRANSIT";
    statusLabel = "HANDCRAFTED • QUALITY INSPECTION PASSED";
  } else if (statusStr === "confirmed") {
    status = "PROCESSING";
    statusLabel = "CONFIRMED • ATELIER SCHEDULED";
  } else if (statusStr === "cancelled") {
    status = "PROCESSING";
    statusLabel = "CANCELLED • ARCHIVE TERMINATED";
  }

  // Estimated delivery calculation
  let estimatedDelivery = o.estimatedDelivery || "";
  if (!estimatedDelivery) {
    if (statusStr === "delivered") {
      estimatedDelivery = o.deliveredAt
        ? `Delivered on ${new Date(o.deliveredAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
        : "Delivered • Signed & Verified";
    } else {
      const futureDate = new Date(new Date(o.createdAt || Date.now()).getTime() + 86400000 * 3);
      estimatedDelivery = `${futureDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} • by 7:00 PM`;
    }
  }

  // Checkpoints: Use backend checkpoints if provided; otherwise fallback to dynamic generated milestones
  let checkpoints: Checkpoint[] = [];
  if (o.checkpoints && Array.isArray(o.checkpoints) && o.checkpoints.length > 0) {
    checkpoints = o.checkpoints.map((cp: any) => ({
      title: cp.title,
      location: cp.location || "Drapza Atelier Logistics Node",
      timestamp: cp.timestamp || "Logged",
      description: cp.description || "",
      completed: Boolean(cp.completed),
      active: Boolean(cp.active),
    }));
  } else {
    const createdDate = new Date(o.createdAt || Date.now());
    const isConfirmed = ["confirmed", "processing", "shipped", "delivered"].includes(statusStr);
    const isProcessing = ["processing", "shipped", "delivered"].includes(statusStr);
    const isShipped = ["shipped", "delivered"].includes(statusStr);
    const isDelivered = statusStr === "delivered";

    const formatTime = (d: Date, timeStr: string) =>
      `${d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} • ${timeStr}`;

    checkpoints = [
      {
        title: "ORDER RECEIVED & ATELIER RECORDED",
        location: "Drapza Digital Vault",
        timestamp: formatTime(createdDate, "10:14 AM"),
        description: "Payment verified. Garment cutting tickets dispatched to atelier production line.",
        completed: true,
        active: statusStr === "placed",
      },
      {
        title: "CONFIRMED & ATELIER SCHEDULED",
        location: "Drapza Atelier Suite A",
        timestamp: isConfirmed ? formatTime(new Date(createdDate.getTime() + 3600000 * 3), "02:30 PM") : "Pending Confirmation",
        description: "Pattern alignment and precision fabric allocation locked into production queue.",
        completed: isConfirmed,
        active: statusStr === "confirmed",
      },
      {
        title: "HANDCRAFTED & QUALITY INSPECTED",
        location: "Drapza Atelier Suite A",
        timestamp: isProcessing ? formatTime(new Date(createdDate.getTime() + 3600000 * 12), "04:30 PM") : "Pending Quality Inspection",
        description: "Seam strength 12 SPI verified. Woven care label affixed. 100% Quality inspection passed.",
        completed: isProcessing,
        active: statusStr === "processing",
      },
      {
        title: "DISPATCHED FROM DRAPZA ATELIER",
        location: "Central Distribution Hub",
        timestamp: isShipped ? formatTime(new Date(createdDate.getTime() + 3600000 * 24), "08:00 AM") : "Pending Dispatch",
        description: "Package sealed in vacuum anti-static garment sheath and handed over to express carrier.",
        completed: isShipped,
        active: false,
      },
      {
        title: "IN TRANSIT • AIR CARGO HUB",
        location: "Western Aviation Logistics Node",
        timestamp: isShipped ? formatTime(new Date(createdDate.getTime() + 3600000 * 32), "02:45 PM") : "Pending Air Transit",
        description: "High-altitude climate-controlled air cargo in transit.",
        completed: isShipped,
        active: statusStr === "shipped",
      },
      {
        title: "OUT FOR DELIVERY • SECURE COURIER",
        location: `${o.shippingAddress?.city || "Destination"} Delivery Station`,
        timestamp: isDelivered ? formatTime(new Date(o.deliveredAt || createdDate.getTime() + 3600000 * 48), "09:00 AM") : "Expected Upon Station Arrival",
        description: "Courier assigned with one-time SMS verification code.",
        completed: isDelivered,
        active: statusStr === "shipped",
      },
      {
        title: "DELIVERED & VERIFIED",
        location: `${o.shippingAddress?.city || "Destination"}, ${o.shippingAddress?.state || "India"}`,
        timestamp: isDelivered ? formatTime(new Date(o.deliveredAt || Date.now()), "01:15 PM") : "Pending Delivery",
        description: "Garments successfully received by client. Delivery receipt authenticated.",
        completed: isDelivered,
        active: isDelivered,
      },
    ];
  }

  const items = (o.orderItems || []).map((it: any, idx: number) => ({
    name: it.name || `ARCHIVE GARMENT #${idx + 1}`,
    size: it.size ? (it.size.toUpperCase().startsWith("SIZE") ? it.size : `SIZE ${it.size}`) : "SIZE STANDARD",
    color: it.color || "SIGNATURE NOIR",
    weightSpec: "480 GSM • 100% ORGANIC COMBED COTTON",
    qty: Number(it.quantity) || 1,
    price: `₹${(Number(it.price) || 0).toLocaleString("en-IN")}`,
    image: it.image || "/images/drapza/products/product_1.png",
    lotNumber: `LOT #${o.orderNumber || "DPZ-2026"}`,
  }));

  return {
    orderId: o.orderNumber || (o._id ? String(o._id).slice(-8).toUpperCase() : "DPZ-ORDER"),
    trackingNumber: o.trackingNumber || `TRK-${o.orderNumber || "DPZ"}`,
    carrier: o.carrier || "Drapza Express Air Cargo • BlueDart",
    status,
    statusLabel,
    estimatedDelivery,
    origin: "Drapza Atelier Central Vault [HUB-01]",
    destination: o.shippingAddress
      ? `${o.shippingAddress.street || ""}, ${o.shippingAddress.city}, ${o.shippingAddress.state} - ${o.shippingAddress.postalCode}`
      : "Verified Client Delivery Address",
    recipientName: o.shippingAddress?.fullName || o.customerName || "Verified Client",
    items: items.length > 0 ? items : [
      {
        name: "DRAPZA BESPOKE ARCHIVE GARMENT",
        size: "SIZE 02 • M-L",
        color: "SIGNATURE NOIR",
        weightSpec: "480 GSM • 100% ORGANIC COMBED COTTON",
        qty: 1,
        price: `₹${(o.totalPrice || 2400).toLocaleString("en-IN")}`,
        image: "/images/drapza/products/product_1.png",
        lotNumber: `LOT #${o.orderNumber || "DPZ-FW26"}`,
      }
    ],
    checkpoints,
  };
}

const demoOrders: Record<string, OrderData> = {
  "DPZ-9842": {
    orderId: "DPZ-9842",
    trackingNumber: "DHL-EXP-884920194",
    carrier: "DHL Express Priority Air",
    status: "IN_TRANSIT",
    statusLabel: "IN TRANSIT • AIR CARGO EN ROUTE",
    estimatedDelivery: "Aug 29, 2026 • by 7:00 PM",
    origin: "Drapza Atelier Central Vault [HUB-01]",
    destination: "742 Evergreen Terrace, Sector 4, Mumbai, MH",
    recipientName: "Suraj Kumar",
    items: [
      {
        name: "HEAVYWEIGHT FRENCH TERRY HOODIE",
        size: "SIZE 03 • L-XL",
        color: "RAW CHARCOAL",
        weightSpec: "480 GSM • 100% ORGANIC COMBED COTTON",
        qty: 1,
        price: "₹2,800",
        image: "/images/drapza/products/product_1.png",
        lotNumber: "LOT #DPZ-FW26-042",
      },
      {
        name: "STRUCTURED OVERSIZED KNIT TEE",
        size: "SIZE 02 • M-L",
        color: "VINTAGE SAGE",
        weightSpec: "420 GSM • DOUBLE-KNIT INTERLOCK",
        qty: 1,
        price: "₹1,600",
        image: "/images/drapza/products/product_18.png",
        lotNumber: "LOT #DPZ-FW26-089",
      },
    ],
    checkpoints: [
      {
        title: "ORDER RECEIVED & ATELIER RECORDED",
        location: "Drapza Digital Vault",
        timestamp: "Aug 26, 2026 • 10:14 AM",
        description: "Payment verified. Garment cutting tickets dispatched to atelier production line.",
        completed: true,
      },
      {
        title: "HANDCRAFTED & QUALITY INSPECTED",
        location: "Drapza Atelier Suite A",
        timestamp: "Aug 26, 2026 • 04:30 PM",
        description: "Seam strength 12 SPI verified. Woven care label affixed. 100% Cotton inspection passed.",
        completed: true,
      },
      {
        title: "DISPATCHED FROM DRAPZA ATELIER",
        location: "Central Distribution Hub",
        timestamp: "Aug 27, 2026 • 08:00 AM",
        description: "Package sealed in vacuum anti-static garment sheath and handed over to DHL Express.",
        completed: true,
      },
      {
        title: "IN TRANSIT • AIR CARGO HUB",
        location: "Western Aviation Logistics Node",
        timestamp: "Aug 27, 2026 • 02:45 PM",
        description: "Flight DPZ-Cargo-702 departed. High-altitude climate-controlled transit active.",
        completed: true,
        active: true,
      },
      {
        title: "OUT FOR DELIVERY • SECURE COURIER",
        location: "Destination Delivery Station",
        timestamp: "Expected Aug 29, 2026",
        description: "Courier assigned with one-time SMS verification code.",
        completed: false,
      },
      {
        title: "DELIVERED & VERIFIED",
        location: "742 Evergreen Terrace, Mumbai, MH",
        timestamp: "Pending Final Handover",
        description: "Garments delivered and verified with signature capture.",
        completed: false,
      },
    ],
  },
  "DPZ-7714": {
    orderId: "DPZ-7714",
    trackingNumber: "FEDEX-PRIO-9912048",
    carrier: "FedEx Custom Critical",
    status: "OUT_FOR_DELIVERY",
    statusLabel: "OUT FOR DELIVERY • TODAY",
    estimatedDelivery: "Today • by 5:30 PM",
    origin: "Drapza Atelier Central Vault [HUB-01]",
    destination: "128 Bandra West, Mumbai, MH",
    recipientName: "Aarav Sharma",
    items: [
      {
        name: "STRUCTURED RAW FLEECE CREWNECK",
        size: "SIZE 02 • M-L",
        color: "NATURAL ECRU",
        weightSpec: "450 GSM • ZERO PIGMENT WEAVE",
        qty: 1,
        price: "₹2,400",
        image: "/images/drapza/products/product_11.png",
        lotNumber: "LOT #DPZ-FW26-015",
      },
    ],
    checkpoints: [
      {
        title: "ORDER RECEIVED & ATELIER RECORDED",
        location: "Drapza Digital Vault",
        timestamp: "Aug 27, 2026 • 09:30 AM",
        description: "Payment verified. Atelier fabric selection assigned.",
        completed: true,
      },
      {
        title: "HANDCRAFTED & QUALITY INSPECTED",
        location: "Drapza Atelier Suite A",
        timestamp: "Aug 27, 2026 • 02:15 PM",
        description: "Hand finishing complete.",
        completed: true,
      },
      {
        title: "DISPATCHED FROM DRAPZA ATELIER",
        location: "Central Hub",
        timestamp: "Aug 28, 2026 • 07:00 AM",
        description: "Handed over to FedEx logistics.",
        completed: true,
      },
      {
        title: "IN TRANSIT • AIR CARGO HUB",
        location: "Mumbai Gateway",
        timestamp: "Aug 28, 2026 • 06:00 PM",
        description: "Arrived at destination airport.",
        completed: true,
      },
      {
        title: "OUT FOR DELIVERY • SECURE COURIER",
        location: "Bandra Delivery Station",
        timestamp: "Today • 08:30 AM",
        description: "Courier assigned with one-time SMS verification code.",
        completed: true,
        active: true,
      },
      {
        title: "DELIVERED & VERIFIED",
        location: "128 Bandra West, Mumbai, MH",
        timestamp: "Pending Signature",
        description: "Delivery expected within 2 hours.",
        completed: false,
      },
    ],
  },
  "DPZ-3391": {
    orderId: "DPZ-3391",
    trackingNumber: "BLUEDART-EXP-110294",
    carrier: "Blue Dart Apex Air",
    status: "DELIVERED",
    statusLabel: "DELIVERED • SIGNED & VERIFIED",
    estimatedDelivery: "Delivered on Aug 24, 2026",
    origin: "Drapza Atelier Central Vault [HUB-01]",
    destination: "Flat 4B, Sky Towers, Bangalore, KA",
    recipientName: "Rohan Varma",
    items: [
      {
        name: "ARCHITECTURAL OVERSIZED BOMBER",
        size: "SIZE 01 • S-M",
        color: "STEALTH NOIR",
        weightSpec: "520 GSM • BONDED NYLON SILK",
        qty: 1,
        price: "₹4,200",
        image: "/images/drapza/products/product_5.png",
        lotNumber: "LOT #DPZ-FW26-003",
      },
    ],
    checkpoints: [
      {
        title: "ORDER RECEIVED & ATELIER RECORDED",
        location: "Drapza Digital Vault",
        timestamp: "Aug 22, 2026 • 11:00 AM",
        description: "Order confirmed.",
        completed: true,
      },
      {
        title: "HANDCRAFTED & QUALITY INSPECTED",
        location: "Drapza Atelier Suite A",
        timestamp: "Aug 22, 2026 • 05:00 PM",
        description: "Seam inspections passed.",
        completed: true,
      },
      {
        title: "DISPATCHED FROM DRAPZA ATELIER",
        location: "Central Hub",
        timestamp: "Aug 23, 2026 • 09:00 AM",
        description: "Dispatched to carrier.",
        completed: true,
      },
      {
        title: "IN TRANSIT • AIR CARGO HUB",
        location: "Bangalore Air Hub",
        timestamp: "Aug 23, 2026 • 08:00 PM",
        description: "Arrived in destination city.",
        completed: true,
      },
      {
        title: "OUT FOR DELIVERY • SECURE COURIER",
        location: "Indiranagar Station",
        timestamp: "Aug 24, 2026 • 08:30 AM",
        description: "Courier out for delivery.",
        completed: true,
      },
      {
        title: "DELIVERED & VERIFIED",
        location: "Flat 4B, Sky Towers, Bangalore, KA",
        timestamp: "Aug 24, 2026 • 01:15 PM",
        description: "Package received and signature captured.",
        completed: true,
        active: true,
      },
    ],
  },
};

export function TrackOrderContainer() {
  const searchParams = useSearchParams();
  const urlRef = searchParams.get("orderId") || searchParams.get("trackingRef") || searchParams.get("ref") || searchParams.get("id") || "";
  const toast = useToast();

  const [searchInput, setSearchInput] = useState(urlRef || "DPZ-9842");
  const [activeOrder, setActiveOrder] = useState<OrderData | null>(demoOrders["DPZ-9842"]);
  const [isSearching, setIsSearching] = useState(false);
  const [copiedTracking, setCopiedTracking] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [isDownloadingInvoice, setIsDownloadingInvoice] = useState(false);
  const [subscribedAlerts, setSubscribedAlerts] = useState(false);

  // Map activeOrder into high-fidelity InvoiceBerry Template 1 format
  const invoiceData: InvoiceData | null = activeOrder
    ? {
        invoiceNumber: `INV-${activeOrder.orderId}`,
        orderId: activeOrder.orderId,
        date: new Date().toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        }),
        clientName: activeOrder.recipientName || "Valued Client",
        clientEmail: "client@drapza.com",
        clientPhone: "+91 9794603102",
        billingAddress: {
          street: activeOrder.destination,
          city: "India",
        },
        shippingAddress: {
          name: activeOrder.recipientName,
          street: activeOrder.destination,
          city: "India",
        },
        salesperson: "Drapza Atelier Direct",
        poNumber: activeOrder.trackingNumber,
        requisitioner: activeOrder.recipientName || "Client",
        shippedVia: activeOrder.carrier || "Air Express Priority",
        fobPoint: "FOB ATELIER",
        terms: "Prepaid / Settled",
        items: activeOrder.items.map((it) => {
          const numPrice = parseFloat(String(it.price).replace(/[^0-9.]/g, "")) || 2400;
          const qty = it.qty || 1;
          return {
            name: it.name,
            size: it.size,
            color: it.color,
            quantity: qty,
            unitPrice: numPrice,
            totalPrice: qty * numPrice,
          };
        }),
        subtotal: activeOrder.items.reduce((acc, it) => {
          const numPrice = parseFloat(String(it.price).replace(/[^0-9.]/g, "")) || 2400;
          return acc + (it.qty || 1) * numPrice;
        }, 0),
        tax: 0,
        shippingCost: 0,
        total: activeOrder.items.reduce((acc, it) => {
          const numPrice = parseFloat(String(it.price).replace(/[^0-9.]/g, "")) || 2400;
          return acc + (it.qty || 1) * numPrice;
        }, 0),
        paymentMethod: "Encrypted Pre-paid",
        paymentStatus: "PAID",
        comments:
          "Authentic Drapza Atelier Noir production garment. Retain this invoice for all complimentary tailoring adjustments, concierge support, and authenticity verification.",
      }
    : null;

  const containerRef = useRef<HTMLDivElement>(null);
  const timelineProgressRef = useRef<HTMLDivElement>(null);
  const orderDetailsRef = useRef<HTMLDivElement>(null);

  // Auto load order from URL query param or user's latest DB order on mount
  useEffect(() => {
    const fetchInitialOrder = async () => {
      const targetQuery = urlRef.trim().toUpperCase();
      if (targetQuery) {
        setSearchInput(targetQuery);
        executeTrackQuery(targetQuery);
      } else {
        // Try loading user's latest order from DB
        try {
          const myOrdersRes = await orderApi.getMyOrders();
          if (myOrdersRes && myOrdersRes.success && myOrdersRes.orders && myOrdersRes.orders.length > 0) {
            const latest = myOrdersRes.orders[0];
            const mapped = mapBackendOrderToOrderData(latest);
            setSearchInput(mapped.orderId);
            setActiveOrder(mapped);
          }
        } catch {
          // Keep default demo
        }
      }
    };
    fetchInitialOrder();
  }, [urlRef]);

  // Initial GSAP Entrance Animation
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.from(".track-bg-elem", {
        opacity: 0,
        scale: 0.95,
        duration: 0.8,
        stagger: 0.08,
      });

      tl.from(".track-header-anim", {
        y: 30,
        opacity: 0,
        duration: 0.7,
        stagger: 0.08,
      }, "-=0.5");

      tl.from(".track-search-card", {
        y: 25,
        opacity: 0,
        duration: 0.6,
      }, "-=0.4");

      tl.from(".track-main-card", {
        y: 30,
        opacity: 0,
        duration: 0.7,
        stagger: 0.1,
      }, "-=0.3");
    }, containerRef);

    return () => ctx.revert();
  }, []);

  // GSAP Animation when Order changes
  useEffect(() => {
    if (!activeOrder) return;

    if (orderDetailsRef.current) {
      gsap.fromTo(
        orderDetailsRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }
      );
    }

    // Animate progress line
    const completedCount = activeOrder.checkpoints.filter((c) => c.completed).length;
    const progressPercent = Math.min(
      100,
      Math.max(15, (completedCount / Math.max(1, activeOrder.checkpoints.length - 1)) * 100)
    );

    if (timelineProgressRef.current) {
      gsap.fromTo(
        timelineProgressRef.current,
        { height: "0%" },
        { height: `${progressPercent}%`, duration: 1.2, ease: "power2.out" }
      );
    }
  }, [activeOrder]);

  const executeTrackQuery = async (queryStr: string) => {
    setSearchError("");
    const cleanQuery = queryStr.trim().toUpperCase();
    if (!cleanQuery) return;

    setIsSearching(true);
    try {
      const backendRes = await orderApi.trackOrder(cleanQuery);
      if (backendRes && backendRes.success && backendRes.order) {
        const mappedOrder = mapBackendOrderToOrderData(backendRes.order);
        setIsSearching(false);
        setActiveOrder(mappedOrder);
        audioSystem.playOpen();
        toast.success("Order Telemetry Synchronized", {
          description: `${mappedOrder.orderId} • ${mappedOrder.statusLabel}`,
        });
        return;
      }
    } catch (err) {
      console.warn("Backend track order fallback:", err);
    }

    setIsSearching(false);
    // Check demo database or fuzzy match
    const matched =
      demoOrders[cleanQuery] ||
      Object.values(demoOrders).find(
        (o) => o.trackingNumber.toUpperCase() === cleanQuery || o.orderId === cleanQuery
      );

    if (matched) {
      setActiveOrder(matched);
      audioSystem.playOpen();
      toast.success("Shipment Telemetry Found", {
        description: `${matched.orderId} • ${matched.statusLabel}`,
      });
    } else {
      // Fallback realistic dynamic generation for any random ID
      const dynamicOrder: OrderData = {
        orderId: cleanQuery.startsWith("DPZ-") ? cleanQuery : `DPZ-${cleanQuery}`,
        trackingNumber: `DHL-EXP-${Math.floor(100000000 + Math.random() * 900000000)}`,
        carrier: "DHL Express Priority Air",
        status: "IN_TRANSIT",
        statusLabel: "IN TRANSIT • LOGISTICS NODE ACTIVE",
        estimatedDelivery: "3 Business Days • by 6:00 PM",
        origin: "Drapza Atelier Central Vault [HUB-01]",
        destination: "Verified Client Delivery Address",
        recipientName: "Verified Drapza Client",
        items: [
          {
            name: "HEAVYWEIGHT FRENCH TERRY HOODIE",
            size: "SIZE 02 • M-L",
            color: "RAW CHARCOAL",
            weightSpec: "480 GSM • 100% ORGANIC COMBED COTTON",
            qty: 1,
            price: "₹2,800",
            image: "/images/drapza/products/product_1.png",
            lotNumber: "LOT #DPZ-FW26-042",
          },
        ],
        checkpoints: [
          {
            title: "ORDER RECEIVED & ATELIER RECORDED",
            location: "Drapza Digital Vault",
            timestamp: "Recent Activity",
            description: "Garment specifications verified in atelier queue.",
            completed: true,
          },
          {
            title: "CONFIRMED & ATELIER SCHEDULED",
            location: "Drapza Atelier Suite A",
            timestamp: "Active",
            description: "Material allocation approved.",
            completed: true,
            active: true,
          },
          {
            title: "DISPATCHED FROM ATELIER",
            location: "Central Hub",
            timestamp: "Pending",
            description: "Handover to express courier.",
            completed: false,
          },
          {
            title: "DELIVERED & VERIFIED",
            location: "Client Destination",
            timestamp: "Pending",
            description: "Final client handover.",
            completed: false,
          },
        ],
      };
      setActiveOrder(dynamicOrder);
      audioSystem.playOpen();
      toast.info("Generated Flight Waybill", {
        description: `${dynamicOrder.orderId} • Live Radar Active`,
      });
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError("");

    const validation = trackOrderInputSchema.safeParse({ trackingRef: searchInput.trim() });
    if (!validation.success) {
      setSearchError(getZodErrorMessage(validation.error));
      audioSystem.playClick(300, 0.08);
      toast.error("Invalid Tracking Input", {
        description: getZodErrorMessage(validation.error),
      });
      return;
    }

    audioSystem.playClick(900, 0.03);
    await executeTrackQuery(searchInput);
  };

  const handleCopyTracking = () => {
    if (!activeOrder) return;
    navigator.clipboard.writeText(activeOrder.trackingNumber);
    setCopiedTracking(true);
    audioSystem.playClick(1200, 0.02);
    toast.info("Waybill Copied to Clipboard", {
      description: `${activeOrder.trackingNumber}`,
    });
    setTimeout(() => setCopiedTracking(false), 2000);
  };

  const handleToggleAlerts = () => {
    if (!activeOrder) return;
    const nextState = !subscribedAlerts;
    setSubscribedAlerts(nextState);
    if (nextState) {
      audioSystem.playClick(950);
      toast.success("Live Dispatch Alerts Activated", {
        description: `Automated tracking SMS & Email notifications enabled for ${activeOrder.orderId}`,
      });
    } else {
      audioSystem.playClick(500);
      toast.info("Notifications Muted", {
        description: `Dispatch alerts paused for ${activeOrder.orderId}`,
      });
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative min-h-[calc(100vh-80px)] pt-20 sm:pt-24 pb-16 sm:pb-20 px-3 sm:px-6 lg:px-12 bg-base-100 selection:bg-base-700 selection:text-base-100 overflow-hidden"
    >
      {/* Pattern & Measurement Rulers in Background */}
      <div className="track-bg-elem absolute inset-0 pointer-events-none bg-halftone opacity-35 z-0" />
      <div className="track-bg-elem absolute top-0 left-10 w-[1px] h-full border-l border-dashed border-base-300/60 pointer-events-none hidden md:block" />
      <div className="track-bg-elem absolute top-0 right-10 w-[1px] h-full border-r border-dashed border-base-300/60 pointer-events-none hidden md:block" />

      {/* Top Header Seam */}
      <div className="track-bg-elem absolute top-20 left-0 right-0 h-4 border-b border-dashed border-base-300 pointer-events-none flex justify-between px-4 sm:px-8 text-[8px] sm:text-[9px] font-mono-technical text-base-400 select-none">
        <span>[00CM]</span>
        <span className="hidden sm:inline">[LOGISTICS TELEMETRY]</span>
        <span>[GLOBAL DISPATCH]</span>
        <span>[100CM]</span>
      </div>

      <div className="relative z-10 w-full max-w-6xl mx-auto space-y-8">
        
        {/* ================= EDITORIAL PAGE HEADER ================= */}
        <div className="text-center space-y-3 max-w-2xl mx-auto pt-2">
          <div className="track-header-anim inline-flex items-center gap-2 px-3 py-1 rounded-full bg-base-200 border border-base-300 text-base-600 font-mono-technical text-[10px] sm:text-xs uppercase tracking-widest">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>GLOBAL DISPATCH • LIVE RADAR</span>
          </div>

          <h1 className="track-header-anim font-display text-4xl sm:text-5xl md:text-6xl text-base-700 uppercase tracking-tight leading-none">
            TRACK SHIPMENT
          </h1>

          <p className="track-header-anim font-mono-technical text-xs sm:text-sm text-base-500 uppercase tracking-wider">
            Real-time atelier tailoring status, dispatch checkpoints, and air cargo waybill tracking.
          </p>
        </div>

        {/* ================= SEARCH BAR & SAMPLE CHIPS ================= */}
        <div className="track-search-card max-w-2xl mx-auto bg-white rounded-2xl p-4 sm:p-5 shadow-xl border border-base-300">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <label htmlFor="track-order-input" className="sr-only">
                Order ID or Tracking Number
              </label>
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-base-400" aria-hidden="true">
                <Search className="w-4 h-4" />
              </div>
              <input
                id="track-order-input"
                name="trackingQuery"
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Enter Order ID (e.g. DPZ-9842) or Tracking No."
                aria-label="Enter Order ID or Tracking Number"
                title="Enter Order ID or Tracking Number"
                className="w-full pl-10 pr-4 py-3 bg-base-100/60 border border-base-300 rounded-xl font-mono-technical text-xs sm:text-sm text-base-700 placeholder:text-base-400 focus:outline-none focus:border-base-700 focus:bg-white uppercase tracking-wider"
              />
            </div>
            <button
              type="submit"
              disabled={isSearching}
              aria-label="Track Shipment"
              title="Track Shipment"
              className="py-3 px-6 rounded-xl bg-base-700 hover:bg-base-600 text-base-100 font-display text-lg uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer disabled:opacity-75"
            >
              {isSearching ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true" />
                  <span className="sr-only">Searching order tracking...</span>
                </>
              ) : (
                <>
                  <span>TRACK</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </>
              )}
            </button>
          </form>

          {/* Search Error */}
          {searchError && (
            <p className="mt-2 text-xs text-red-500 font-mono-technical uppercase tracking-wide" role="alert">
              {searchError}
            </p>
          )}
        </div>

        {/* ================= MAIN ORDER TELEMETRY DASHBOARD ================= */}
        {isSearching && (
          <TrackOrderSkeleton />
        )}

        {!isSearching && activeOrder && (
          <div ref={orderDetailsRef} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* ================= LEFT 7 COLS: SHIPMENT TIMELINE ================= */}
            <div className="track-main-card lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-base-300 space-y-6">
              
              {/* Order Status Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-base-700 text-base-100">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" aria-hidden="true" />
                    <span className="font-mono-technical text-[11px] text-emerald-300 font-medium uppercase tracking-widest">
                      {activeOrder.statusLabel}
                    </span>
                  </div>
                  <h2 className="font-display text-2xl uppercase tracking-tight font-normal">
                    ORDER #{activeOrder.orderId}
                  </h2>
                </div>

                <div className="text-left sm:text-right border-t sm:border-t-0 sm:border-l border-base-600/70 pt-2 sm:pt-0 sm:pl-4">
                  <span className="font-mono-technical text-[10px] text-neutral-300 uppercase tracking-widest block">
                    ESTIMATED ARRIVAL
                  </span>
                  <span className="font-mono-technical text-sm font-medium text-base-100">
                    {activeOrder.estimatedDelivery}
                  </span>
                </div>
              </div>

              {/* Courier & Tracking Waybill Box */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-base-100/70 rounded-2xl border border-base-300 font-mono-technical text-xs">
                <div>
                  <span className="text-neutral-600 text-[10px] uppercase tracking-wider block font-medium">
                    CARRIER SERVICE
                  </span>
                  <span className="font-medium text-base-700 uppercase flex items-center gap-1.5 mt-0.5">
                    <Truck className="w-3.5 h-3.5" aria-hidden="true" />
                    {activeOrder.carrier}
                  </span>
                </div>

                <div>
                  <span className="text-neutral-600 text-[10px] uppercase tracking-wider block font-medium">
                    AIR WAYBILL / TRACKING CODE
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-medium text-base-700 tracking-wider">
                      {activeOrder.trackingNumber}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyTracking}
                      aria-label="Copy Tracking Number"
                      title="Copy Tracking Number"
                      className="p-1 rounded bg-white hover:bg-base-200 border border-base-300 text-base-600 transition-colors cursor-pointer"
                    >
                      {copiedTracking ? (
                        <Check className="w-3 h-3 text-emerald-600" aria-hidden="true" />
                      ) : (
                        <Copy className="w-3 h-3" aria-hidden="true" />
                      )}
                      <span className="sr-only">Copy Tracking Number</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Real-time Push & SMS Notification Control Card */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-neutral-900 text-white border border-white/15">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${subscribedAlerts ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-white/10 text-neutral-300 border border-white/10"}`}>
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-mono-technical text-[10px] uppercase tracking-wider text-neutral-400 block font-semibold">
                      AUTOMATED DISPATCH TELEMETRY
                    </span>
                    <p className="font-mono-technical text-xs font-bold uppercase text-white">
                      {subscribedAlerts ? "LIVE TRACKING NOTIFICATIONS ACTIVE" : "REAL-TIME DISPATCH ALERTS"}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleToggleAlerts}
                  className={`px-3.5 py-1.5 rounded-xl font-mono-technical text-[11px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm ${
                    subscribedAlerts
                      ? "bg-emerald-500 text-black hover:bg-emerald-400"
                      : "bg-white text-black hover:bg-neutral-200"
                  }`}
                >
                  {subscribedAlerts ? (
                    <>
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>SUBSCRIBED</span>
                    </>
                  ) : (
                    <>
                      <Bell className="w-3.5 h-3.5" />
                      <span>SUBSCRIBE ALERTS</span>
                    </>
                  )}
                </button>
              </div>

              {/* Interactive Vector Route HUD */}
              <div className="p-4 rounded-2xl bg-[#0e1014] border border-white/10 text-white shadow-inner space-y-3">
                <div className="flex items-center justify-between font-mono-technical text-[10px] uppercase text-neutral-300">
                  <span className="flex items-center gap-1.5 text-emerald-400 font-bold tracking-wider">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    LIVE AIRWAY ROUTE TELEMETRY
                  </span>
                  <span>
                    CARGO VELOCITY: {activeOrder.status === "DELIVERED" ? "DELIVERED" : activeOrder.status === "OUT_FOR_DELIVERY" ? "LAST MILE" : "HIGH-PRIORITY"}
                  </span>
                </div>

                {/* 4-Stage Route Stepper */}
                <div className="grid grid-cols-4 gap-2 pt-2 relative">
                  {[
                    { id: "PROCESSING", label: "VAULT HUB", icon: Package },
                    { id: "IN_TRANSIT", label: "AIR CARGO", icon: Plane },
                    { id: "OUT_FOR_DELIVERY", label: "LOCAL DISPATCH", icon: Truck },
                    { id: "DELIVERED", label: "DOORSTEP", icon: MapPin },
                  ].map((stage, sIdx) => {
                    const statusOrder = ["PROCESSING", "IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED"];
                    const currentIdx = statusOrder.indexOf(activeOrder.status);
                    const isDone = sIdx <= currentIdx;
                    const isCurrent = sIdx === currentIdx;
                    const StageIcon = stage.icon;

                    return (
                      <div key={stage.id} className="flex flex-col items-center text-center relative z-10">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center mb-1.5 transition-all shadow-md ${
                            isCurrent
                              ? "bg-white text-black font-bold ring-4 ring-white/30 scale-110"
                              : isDone
                              ? "bg-white text-black font-semibold"
                              : "bg-white/10 text-neutral-400 border border-white/15"
                          }`}
                        >
                          <StageIcon className="w-4 h-4" />
                        </div>
                        <span
                          className={`font-mono-technical text-[9px] sm:text-[10px] uppercase tracking-wider ${
                            isCurrent
                              ? "text-white font-bold"
                              : isDone
                              ? "text-neutral-200 font-medium"
                              : "text-neutral-400 font-medium"
                          }`}
                        >
                          {stage.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Checkpoint Milestones Progress Vertical List */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-4 border-b border-base-200 pb-2">
                  <span className="font-mono-technical text-xs font-bold uppercase tracking-wider text-base-700 flex items-center gap-1.5">
                    <Navigation className="w-4 h-4" />
                    DISPATCH CHECKPOINTS
                  </span>
                  <span className="font-mono-technical text-[10px] text-base-400 uppercase">
                    UTC TELEMETRY
                  </span>
                </div>

                <div className="relative pl-6 space-y-6">
                  {/* Background Progress Rail */}
                  <div className="absolute left-[11px] top-2 bottom-4 w-[2px] bg-base-200" />
                  {/* Animated Foreground Progress Bar */}
                  <div
                    ref={timelineProgressRef}
                    className="absolute left-[11px] top-2 w-[2px] bg-base-700 transition-all origin-top"
                  />

                  {activeOrder.checkpoints.map((step, idx) => (
                    <div key={idx} className="relative group">
                      {/* Node Circle */}
                      <div
                        className={`absolute -left-[23px] top-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                          step.completed
                            ? "bg-base-700 border-base-700 text-base-100"
                            : step.active
                            ? "bg-emerald-500 border-emerald-400 text-white shadow-lg animate-pulse"
                            : "bg-white border-base-300 text-transparent"
                        }`}
                      >
                        {step.completed ? (
                          <Check className="w-3 h-3 stroke-[3]" />
                        ) : step.active ? (
                          <div className="w-2 h-2 rounded-full bg-white" />
                        ) : null}
                      </div>

                      {/* Content */}
                      <div className="bg-base-100/40 p-3 rounded-xl border border-base-200 hover:border-base-400 transition-colors">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <h3 className="font-mono-technical text-xs sm:text-sm font-bold uppercase tracking-wide text-base-700">
                            {step.title}
                          </h3>
                          <span className="font-mono-technical text-[10px] text-base-400 uppercase">
                            {step.timestamp}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-neutral-700 font-mono-technical text-[11px] font-medium mt-1">
                          <MapPin className="w-3 h-3 text-neutral-600 shrink-0" />
                          <span>{step.location}</span>
                        </div>
                        <p className="font-body text-xs text-neutral-800 font-medium mt-1 leading-relaxed">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery Destination Address */}
              <div className="p-4 rounded-2xl bg-base-100 border border-base-300 flex items-start gap-3 text-xs font-mono-technical">
                <MapPin className="w-4 h-4 text-base-700 shrink-0 mt-0.5" />
                <div>
                  <span className="text-base-400 text-[10px] uppercase tracking-wider block">
                    DELIVERY DESTINATION
                  </span>
                  <p className="font-bold text-base-700 uppercase mt-0.5">{activeOrder.recipientName}</p>
                  <p className="text-neutral-700 font-medium text-[11px]">{activeOrder.destination}</p>
                </div>
              </div>
            </div>

            {/* ================= RIGHT 5 COLS: GARMENT MANIFEST ================= */}
            <div className="track-main-card lg:col-span-5 space-y-6">
              
              {/* Garment Manifest Card */}
              <div className="bg-base-700 text-base-100 rounded-3xl p-6 sm:p-8 shadow-2xl border border-base-600 relative overflow-hidden">
                <div className="absolute inset-0 bg-halftone-lg opacity-15 pointer-events-none" />

                <div className="relative z-10 flex items-center justify-between border-b border-base-600/70 pb-3 mb-5">
                  <div className="flex items-center gap-2">
                    <Scissors className="w-4 h-4 text-base-200" />
                    <span className="font-mono-technical text-xs tracking-widest text-base-200 uppercase font-bold">
                      GARMENT MANIFEST
                    </span>
                  </div>
                  <span className="font-mono-technical text-[10px] text-neutral-300 uppercase font-medium">
                    {activeOrder.items.length} PIECE(S)
                  </span>
                </div>

                {/* Items List */}
                <div className="relative z-10 space-y-4">
                  {activeOrder.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 bg-base-600/60 backdrop-blur rounded-2xl border border-base-500/50 flex gap-3.5 items-center"
                    >
                      {/* Product Thumbnail */}
                      <div className="w-16 h-16 rounded-xl bg-base-700 p-1 flex items-center justify-center shrink-0 border border-base-500/40">
                        <Image
                          src={item.image}
                          alt={item.name}
                          width={60}
                          height={60}
                          className="object-contain max-h-14 drop-shadow-md"
                        />
                      </div>

                      {/* Specs */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-display text-base uppercase tracking-tight text-white truncate">
                          {item.name}
                        </h4>
                        <p className="font-mono-technical text-[10px] text-base-300 uppercase mt-0.5">
                          {item.size} // {item.color}
                        </p>
                        <p className="font-mono-technical text-[9px] text-neutral-300 mt-0.5">
                          {item.weightSpec}
                        </p>
                        <div className="flex items-center justify-between mt-1 pt-1 border-t border-base-500/40 text-[10px] font-mono-technical">
                          <span className="text-neutral-300 font-bold">{item.lotNumber}</span>
                          <span className="text-base-100 font-bold">{item.price}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Barcode & Quality Seal */}
                <div className="relative z-10 mt-6 pt-4 border-t border-base-600/70 flex flex-col items-center justify-center text-center">
                  <div className="font-mono-technical text-base-300 text-[9px] tracking-[0.25em] select-none">
                    ||||||| | ||||| |||||| |||| | |||||||||||
                  </div>
                  <span className="font-mono-technical text-[8px] text-neutral-300 uppercase tracking-widest mt-1">
                    AUTHENTICATED DRAPZA ATELIER DISPATCH
                  </span>
                </div>
              </div>

              {/* Concierge & Support Quick Card */}
              <div className="bg-white rounded-3xl p-6 shadow-xl border border-base-300 space-y-4">
                <h3 className="font-mono-technical text-xs font-bold uppercase tracking-wider text-base-700 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  CONCIERGE &amp; DELIVERY ASSISTANCE
                </h3>

                <p className="font-mono-technical text-xs text-base-500 leading-relaxed">
                  Need to update delivery instructions, gate access codes, or schedule evening drop-off?
                </p>

                <div className="grid grid-cols-2 gap-2 pt-1 font-mono-technical text-xs">
                  <button
                    type="button"
                    disabled={isDownloadingInvoice}
                    onClick={async () => {
                      if (invoiceData) {
                        try {
                          setIsDownloadingInvoice(true);
                          await downloadInvoicePdf(invoiceData);
                        } catch (e) {
                          console.error("Invoice download error:", e);
                        } finally {
                          setIsDownloadingInvoice(false);
                        }
                      }
                    }}
                    className="py-2.5 px-3 rounded-xl border border-base-300 hover:border-base-700 bg-base-100/50 hover:bg-base-200 transition-all uppercase tracking-wider text-base-700 flex items-center justify-center gap-1.5 cursor-pointer text-[11px] disabled:opacity-60"
                    title="Direct Download Invoice as PDF"
                  >
                    <Download className={`w-3.5 h-3.5 ${isDownloadingInvoice ? "animate-bounce" : ""}`} />
                    <span>{isDownloadingInvoice ? "DOWNLOADING..." : "DOWNLOAD INVOICE"}</span>
                  </button>

                  <a
                    href="https://wa.me/918888333038?text=Hello%20Drapza%20Support%2C%20I%20need%20help%20with%20my%20order"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2.5 px-3 rounded-xl border border-base-300 hover:border-base-700 bg-base-100/50 hover:bg-base-200 transition-all uppercase tracking-wider text-base-700 flex items-center justify-center gap-1.5 cursor-pointer text-[11px]"
                    title="Live WhatsApp Support: +91 8888333038"
                  >
                    <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
                    <span>SUPPORT</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
