"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Send,
  User,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
  Package,
  TrendingUp,
  RefreshCw,
  Printer,
  FileText,
  X,
  ChevronDown,
  ChevronUp,
  Sliders,
  Play,
  Settings2,
  Radio,
  Zap,
  ExternalLink,
  Navigation,
  LayoutDashboard,
  Scissors,
  RotateCcw,
  Truck,
  LifeBuoy,
  Star,
  Globe,
  Eye,
  Quote,
  Layers,
  Mail,
  Timer,
  Tag,
  Gift,
  Camera,
  CreditCard,
  Users,
  ShieldAlert,
  Power,
  Activity,
  AudioWaveform,
  Check,
  Search,
  Bot,
  MessageSquare,
  ArrowRight,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { audioSystem } from "./AudioSystem";
import { downloadOrderInvoice } from "@/lib/invoiceDownload";
import { aiActionEngine, performPageScroll } from "./ai-admin/AIActionEngine";
import { adminContextMemory } from "./ai-admin/AdminContextMemory";
import { adminCapabilityRegistry } from "./ai-admin/AdminCapabilityRegistry";
import { adminUIDiscoveryEngine } from "./ai-admin/AdminUIDiscoveryEngine";
import { aiActionBridge } from "./ai-admin/AIActionBridge";

export interface AdminAIAssistantProps {
  handleScrollPage?: (direction: "up" | "down" | "top" | "bottom") => void;
  orders: any[];
  products: any[];
  users: any[];
  coupons: any[];
  visitorStats: { total: number; guests: number; registered: number; gpsVerified: number };
  activeTab: string;
  setActiveTab: (tab: any) => void;
  handleUpdateOrderStatus: (orderId: string, newStatus: string) => Promise<void>;
  setSelectedOrder: (order: any) => void;
  setSelectedThermalOrder: (order: any) => void;
  fetchData: () => Promise<void>;
  gstConfig?: any;
  paymentConfig?: any;
  setPaymentConfig?: (config: any) => void;
  setSidebarMode?: (mode: "full" | "compact" | "hidden") => void;
  handleOpenCreateProductModal?: () => void;
  handleOpenEditProductModal?: (prod: any) => void;
  handleDuplicateProduct?: (prod: any) => void;
  handleSeedDefaultCoupons?: () => Promise<void>;
  setBulkProductModalOpen?: (open: boolean) => void;
  setBulkDiscountOpen?: (open: boolean) => void;
  setOrderStatusFilter?: (filter: string) => void;
  setOrderSearch?: (search: string) => void;
  setProductSearch?: (search: string) => void;
  setProductCategoryFilter?: (category: string) => void;
  setProductStockFilter?: (stock: "ALL" | "IN_STOCK" | "OUT_OF_STOCK" | "LOW_STOCK") => void;
  setUserSearch?: (search: string) => void;
  setUserStatusFilter?: (filter: string) => void;
  setCouponSearch?: (search: string) => void;
  handleDeleteProduct?: (id: string, name?: string) => Promise<void>;
  handleToggleBlockUser?: (id: string) => Promise<void>;
  handleToggleVerifyUser?: (id: string) => Promise<void>;
}

interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  text: string;
  spokenHindi?: string;
  timestamp: string;
  actionTaken?: string;
  actionDetails?: any;
  dataCard?: {
    type: "order_summary" | "order_card" | "stock_alert" | "revenue_card" | "quick_actions" | "product_card" | "confirmation_card";
    data?: any;
  };
  requiresConfirmation?: boolean;
}

// Convert Roman Hinglish text to fluent Devanagari Hindi for native TTS pronunciation
function toFluentDevanagari(text: string): string {
  if (/[\u0900-\u097F]/.test(text)) return text;

  let h = text;
  h = h.replace(/₹\s*([0-9,]+)/g, "$1 रुपये ");
  h = h.replace(/#/g, "नंबर ");

  const dictionary: [RegExp, string][] = [
    [/\bnamaste\b/gi, "नमस्ते"],
    [/\badmin\b/gi, "एडमिन सर"],
    [/\border\b/gi, "ऑर्डर"],
    [/\borders\b/gi, "ऑर्डर्स"],
    [/\bconfirm\b/gi, "कन्फर्म"],
    [/\bdispatch\b/gi, "डिस्पैच"],
    [/\bshipped\b/gi, "शिप"],
    [/\bdelivered\b/gi, "डिलीवर"],
    [/\bcancel\b/gi, "कैंसिल"],
    [/\bpending\b/gi, "पेंडिंग"],
    [/\bstock\b/gi, "स्टॉक"],
    [/\binventory\b/gi, "इन्वेंटरी"],
    [/\bout of stock\b/gi, "आउट ऑफ स्टॉक"],
    [/\brevenue\b/gi, "रेवेन्यू कमाई"],
    [/\bsales\b/gi, "सेल्स"],
    [/\bproduct\b/gi, "प्रोडक्ट"],
    [/\bproducts\b/gi, "प्रोडक्ट्स"],
    [/\bcoupon\b/gi, "कूपन"],
    [/\bcoupons\b/gi, "कूपन्स"],
    [/\breports\b/gi, "रिपोर्ट्स"],
    [/\bradar\b/gi, "रडार"],
    [/\buser\b/gi, "यूजर"],
    [/\busers\b/gi, "कस्टमर्स"],
    [/\bdone\b/gi, "हो गया सर"],
    [/\bho gaya\b/gi, "हो गया"],
    [/\bkar diya\b/gi, "कर दिया"],
    [/\bkholo\b/gi, "खोल दिया"],
    [/\bopen\b/gi, "ओपन"],
    [/\blatest\b/gi, "लेटेस्ट"],
    [/\bclient\b/gi, "क्लाइंट"],
    [/\bcustomer\b/gi, "कस्टमर"],
  ];

  for (const [regex, replacement] of dictionary) {
    h = h.replace(regex, replacement);
  }

  return h;
}

function toPhoneticRomanHinglish(hindiText: string): string {
  if (!hindiText) return "";
  let s = hindiText;
  const wordMap: [RegExp, string][] = [
    [/नमस्ते/g, "Namaste "],
    [/हाँ|हां/g, "Haan "],
    [/नहीं/g, "Nahi "],
    [/जी/g, "Ji "],
    [/सर/g, "Sir "],
    [/ऑर्डर्स|ऑर्डर/g, "Orders "],
    [/प्रोडक्ट्स|प्रोडक्ट/g, "Products "],
    [/कूपन्स|कूपन/g, "Coupons "],
    [/इनवॉइस|बिल/g, "Invoice "],
    [/दिखाओ|दिखाइए|दिखा/g, "Dikhao "],
    [/खोलो|खोलिए|खोल/g, "Kholo "],
    [/कर/g, "Kar "],
    [/दिया|दी/g, "Diya "],
    [/गया|गई/g, "Gaya "],
    [/रुपये/g, "Rupees "],
    [/कुल/g, "Total "],
  ];

  for (const [re, rep] of wordMap) {
    s = s.replace(re, rep);
  }
  return s.replace(/[\u0900-\u097F]/g, "").replace(/\s+/g, " ").trim();
}

export function AdminAIAssistant(props: AdminAIAssistantProps) {
  const router = useRouter();

  // Floating & Drawer State
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // 1-Click Always-Listening Mode
  const [isAlwaysListening, setIsAlwaysListening] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      try {
        return localStorage.getItem("drapza_ai_always_listening") === "true";
      } catch (e) { }
    }
    return false;
  });

  // Speech Recognition Input Language Mode ("en-IN" = Hinglish / English, "hi-IN" = Hindi Native Devanagari)
  const [speechInputLang, setSpeechInputLang] = useState<string>(() => {
    if (typeof window !== "undefined") {
      try {
        return localStorage.getItem("drapza_ai_speech_input_lang") || "en-IN";
      } catch (e) { }
    }
    return "en-IN";
  });

  // Natural Female Voices
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>("");
  const [speechPitch, setSpeechPitch] = useState<number>(1.18);
  const [speechSpeed, setSpeechSpeed] = useState<number>(1.02);

  // HUD & Chat State
  const [inputQuery, setInputQuery] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome-msg",
      sender: "assistant",
      text: "Namaste Admin Sir! Main aapka AI Operating System hoon. Boliye, pure admin dashboard mein kya karna hai?",
      spokenHindi: "नमस्ते एडमिन सर! मैं आपका एआई ऑपरेटिंग सिस्टम हूँ। बोलिए, क्या आदेश है?",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [lastAiResponse, setLastAiResponse] = useState<{
    text: string;
    spokenHindi?: string;
    actionTaken?: string;
    timestamp: string;
  } | null>(null);
  const [showHudCard, setShowHudCard] = useState<boolean>(false);
  const hudTimerRef = useRef<NodeJS.Timeout | null>(null);

  const recognitionRef = useRef<any>(null);
  const isRecognitionActiveRef = useRef<boolean>(false);
  const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const speechSilenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const speakingSafetyTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [micPermissionError, setMicPermissionError] = useState<boolean>(false);
  const [liveHeardSubtitle, setLiveHeardSubtitle] = useState<string>("");
  const [showAuditLogs, setShowAuditLogs] = useState<boolean>(false);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isSpeakingRef = useRef<boolean>(false);
  isSpeakingRef.current = isSpeaking;
  const currentSpeakingTextRef = useRef<string>("");

  const isAlwaysListeningRef = useRef<boolean>(isAlwaysListening);
  isAlwaysListeningRef.current = isAlwaysListening;

  const speechInputLangRef = useRef<string>(speechInputLang);
  speechInputLangRef.current = speechInputLang;

  const lastProcessedQueryRef = useRef<{ text: string; time: number }>({ text: "", time: 0 });

  // Scroll chat drawer to bottom on new messages
  useEffect(() => {
    if (isConsoleOpen && chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isConsoleOpen]);

  // Sync memory active tab & dynamically learn/inspect current page UI
  useEffect(() => {
    adminContextMemory.setTab(props.activeTab);
    aiActionBridge.setContext(props as any);
    const timer = setTimeout(() => {
      adminUIDiscoveryEngine.inspectCurrentUI(props.activeTab);
    }, 400);
    return () => clearTimeout(timer);
  }, [props.activeTab, props]);

  // Load browser voices
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      setAvailableVoices(voices);

      try {
        const savedVoice = localStorage.getItem("drapza_egirl_voice_uri");
        const savedPitch = localStorage.getItem("drapza_egirl_voice_pitch");
        const savedRate = localStorage.getItem("drapza_egirl_voice_rate");
        if (savedPitch) setSpeechPitch(parseFloat(savedPitch));
        if (savedRate) setSpeechSpeed(parseFloat(savedRate));

        if (savedVoice && voices.some((v) => v.voiceURI === savedVoice)) {
          setSelectedVoiceURI(savedVoice);
          return;
        }
      } catch (e) { }

      const bestHindiVoice =
        voices.find((v) => {
          const name = v.name.toLowerCase();
          const lang = v.lang.toLowerCase();
          return (
            (lang.includes("hi-in") || lang.includes("hi_in") || name.includes("hindi") || name.includes("हिन्दी")) &&
            (name.includes("natural") || name.includes("swara") || name.includes("neerja") || name.includes("female") || name.includes("lekha"))
          );
        }) ||
        voices.find((v) => v.lang.toLowerCase().includes("hi")) ||
        voices.find((v) => v.lang.toLowerCase().includes("en-in") && v.name.toLowerCase().includes("female")) ||
        voices.find((v) => v.name.toLowerCase().includes("female")) ||
        voices[0];

      if (bestHindiVoice) {
        setSelectedVoiceURI(bestHindiVoice.voiceURI);
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    const unlockAudio = () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
      }
    };
    window.addEventListener("click", unlockAudio, { once: true });
    window.addEventListener("keydown", unlockAudio, { once: true });

    return () => {
      window.removeEventListener("click", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
    };
  }, []);

  const femaleVoices = useMemo(() => {
    const filtered = availableVoices.filter((v) => {
      const name = v.name.toLowerCase();
      const lang = v.lang.toLowerCase();
      return (
        lang.includes("hi") ||
        name.includes("हिन्दी") ||
        name.includes("hindi") ||
        name.includes("female") ||
        name.includes("natural") ||
        name.includes("swara") ||
        name.includes("neerja") ||
        name.includes("jenny") ||
        name.includes("aria") ||
        (lang.includes("en-in") && !name.includes("male") && !name.includes("david"))
      );
    });
    return filtered.length > 0 ? filtered : availableVoices;
  }, [availableVoices]);

  const handleSelectVoice = (voiceURI: string) => {
    setSelectedVoiceURI(voiceURI);
    try {
      localStorage.setItem("drapza_egirl_voice_uri", voiceURI);
    } catch (e) { }
  };

  // 360-degree Circular Sound Wave Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let step = 0;

    const renderWave = () => {
      const dpr = window.devicePixelRatio || 1;
      const size = 130;
      const width = (canvas.width = size * dpr);
      const height = (canvas.height = size * dpr);

      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;
      const baseRadius = size * 0.32 * dpr;

      const isLive = isListening || isSpeaking;
      const baseAmp = isSpeaking ? 16 * dpr : isListening ? 14 * dpr : isAlwaysListening ? 6 * dpr : 3.5 * dpr;
      const speed = isSpeaking ? 0.06 : isListening ? 0.045 : 0.02;

      step += speed;

      // Radial aura
      const auraGrad = ctx.createRadialGradient(centerX, centerY, 5 * dpr, centerX, centerY, size * 0.48 * dpr);
      if (isListening) {
        auraGrad.addColorStop(0, "rgba(255, 255, 255, 0.35)");
        auraGrad.addColorStop(0.6, "rgba(200, 200, 200, 0.12)");
        auraGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
      } else if (isSpeaking) {
        auraGrad.addColorStop(0, "rgba(255, 255, 255, 0.45)");
        auraGrad.addColorStop(0.6, "rgba(180, 180, 180, 0.18)");
        auraGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
      } else if (isAlwaysListening) {
        auraGrad.addColorStop(0, "rgba(255, 255, 255, 0.25)");
        auraGrad.addColorStop(0.6, "rgba(150, 150, 150, 0.08)");
        auraGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
      } else {
        auraGrad.addColorStop(0, "rgba(255, 255, 255, 0.15)");
        auraGrad.addColorStop(0.6, "rgba(255, 255, 255, 0.03)");
        auraGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
      }
      ctx.fillStyle = auraGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, size * 0.48 * dpr, 0, Math.PI * 2);
      ctx.fill();

      // Sine Wave Rings
      const layers = [
        { color: "rgba(255, 255, 255, 0.98)", freq: 4, offset: 0, ampMult: 1.0, lineWidth: 2.0 * dpr },
        { color: "rgba(220, 220, 220, 0.85)", freq: 5, offset: Math.PI / 3, ampMult: 0.85, lineWidth: 1.5 * dpr },
        { color: "rgba(180, 180, 180, 0.7)", freq: 6, offset: (2 * Math.PI) / 3, ampMult: 0.7, lineWidth: 1.2 * dpr },
      ];

      const totalPoints = 120;
      layers.forEach((layer) => {
        ctx.beginPath();
        ctx.strokeStyle = layer.color;
        ctx.lineWidth = layer.lineWidth;

        for (let i = 0; i <= totalPoints; i++) {
          const angle = (i / totalPoints) * Math.PI * 2;
          const wave =
            Math.sin(angle * layer.freq + step + layer.offset) *
            Math.cos(angle * 2 - step * 0.4);
          const r = baseRadius + wave * baseAmp * layer.ampMult;

          const x = centerX + Math.cos(angle) * r;
          const y = centerY + Math.sin(angle) * r;

          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
      });

      // Nodes
      if (isLive || isAlwaysListening) {
        const nodeCount = isLive ? 24 : 12;
        for (let j = 0; j < nodeCount; j++) {
          const angle = (j / nodeCount) * Math.PI * 2 + step * 0.15;
          const nodePulse = Math.sin(angle * 5 + step * 2) * 0.5 + 0.5;
          const r = baseRadius + (baseAmp * 0.8 + nodePulse * 6 * dpr);
          const nx = centerX + Math.cos(angle) * r;
          const ny = centerY + Math.sin(angle) * r;

          ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
          ctx.beginPath();
          ctx.arc(nx, ny, 1.8 * dpr, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      animationId = requestAnimationFrame(renderWave);
    };

    renderWave();
    return () => cancelAnimationFrame(animationId);
  }, [isListening, isSpeaking, isAlwaysListening]);

  // Speech Recognition Loop
  const startListening = useCallback(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Browser Web Speech Recognition support nahi karta. Chrome ya Edge browser use karein.");
      return;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.onstart = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.abort();
      } catch (e) { }
      recognitionRef.current = null;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = speechInputLangRef.current || "en-IN";
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        isRecognitionActiveRef.current = true;
        setIsListening(true);
        setMicPermissionError(false);
      };

      recognition.onresult = (event: any) => {
        let interim = "";
        let final = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }

        const heardChunk = (interim || final).trim();
        if (heardChunk) {
          setLiveHeardSubtitle(heardChunk);

          // If assistant is currently speaking and user speaks, immediately interrupt & stop TTS
          if (
            isSpeakingRef.current ||
            (typeof window !== "undefined" && window.speechSynthesis?.speaking)
          ) {
            stopSpeaking();
            const lowerHeard = heardChunk.toLowerCase();
            const isExplicitInterrupt =
              lowerHeard === "ruko" ||
              lowerHeard === "ruk jao" ||
              lowerHeard === "stop" ||
              lowerHeard === "chup" ||
              lowerHeard === "shant" ||
              lowerHeard === "bas";

            if (isExplicitInterrupt) {
              setLiveHeardSubtitle("✓ Stopped");
              setTimeout(() => setLiveHeardSubtitle(""), 1500);
              return;
            }
          }
        }

        if (interim) {
          if (speechSilenceTimerRef.current) clearTimeout(speechSilenceTimerRef.current);
          speechSilenceTimerRef.current = setTimeout(() => {
            const pendingText = interim.trim();
            if (pendingText) {
              setLiveHeardSubtitle("");
              handleProcessCommand(pendingText);
            }
          }, 1400);
        }

        if (final) {
          if (speechSilenceTimerRef.current) clearTimeout(speechSilenceTimerRef.current);
          const trimmedFinal = final.trim();
          if (trimmedFinal) {
            setLiveHeardSubtitle(`✓ ${trimmedFinal}`);
            setTimeout(() => setLiveHeardSubtitle(""), 2000);
            handleProcessCommand(trimmedFinal);
          }
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error === "no-speech" || event.error === "aborted") return;
        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          setMicPermissionError(true);
          return;
        }
      };

      recognition.onend = () => {
        isRecognitionActiveRef.current = false;
        setIsListening(false);

        if (isAlwaysListeningRef.current) {
          if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
          restartTimeoutRef.current = setTimeout(() => {
            if (isAlwaysListeningRef.current) {
              startListening();
            }
          }, 200);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
      isRecognitionActiveRef.current = true;
    } catch (err: any) {
      isRecognitionActiveRef.current = false;
      setIsListening(false);
    }
  }, []);

  const stopListening = useCallback(() => {
    isRecognitionActiveRef.current = false;
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }
    if (speechSilenceTimerRef.current) {
      clearTimeout(speechSilenceTimerRef.current);
      speechSilenceTimerRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onstart = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.abort();
      } catch (e) { }
      recognitionRef.current = null;
    }
    setIsListening(false);
    setLiveHeardSubtitle("");
  }, []);

  const handleSetSpeechInputLang = useCallback((lang: string) => {
    setSpeechInputLang(lang);
    speechInputLangRef.current = lang;
    try {
      localStorage.setItem("drapza_ai_speech_input_lang", lang);
    } catch (e) { }

    // If active, cleanly reboot recognition with the new language
    if (isRecognitionActiveRef.current && recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) { }
      setTimeout(() => {
        startListening();
      }, 150);
    }
  }, [startListening]);

  const toggleAlwaysListening = () => {
    const nextState = !isAlwaysListening;
    setIsAlwaysListening(nextState);
    audioSystem.playClick(950);

    try {
      localStorage.setItem("drapza_ai_always_listening", String(nextState));
    } catch (e) { }

    if (nextState) {
      startListening();
      speakText("Always Listening Mode ON ho gaya hai.", "सर, ऑलवेज लिसनिंग मोड ऑन हो गया है।");
    } else {
      stopListening();
      speakText("Always Listening Mode OFF kar diya gaya hai.", "ऑलवेज लिसनिंग मोड ऑफ कर दिया गया है।");
    }
  };

  useEffect(() => {
    if (isAlwaysListening) {
      const timer = setTimeout(() => startListening(), 1000);
      return () => clearTimeout(timer);
    }
  }, [isAlwaysListening, startListening]);

  // TTS Speech Output
  const speakText = (text: string, customHindiText?: string, actionBadge?: string) => {
    const devanagariHindi = customHindiText || toFluentDevanagari(text);
    const romanHinglish = text || toPhoneticRomanHinglish(devanagariHindi);

    currentSpeakingTextRef.current = (devanagariHindi + " " + romanHinglish).toLowerCase();

    setLastAiResponse({
      text: romanHinglish,
      spokenHindi: devanagariHindi,
      actionTaken: actionBadge,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    });
    setShowHudCard(true);
    if (hudTimerRef.current) clearTimeout(hudTimerRef.current);
    hudTimerRef.current = setTimeout(() => {
      setShowHudCard(false);
    }, 8000);

    if (isMuted || typeof window === "undefined" || !("speechSynthesis" in window)) return;

    setIsSpeaking(true);
    isSpeakingRef.current = true;
    if (speechSilenceTimerRef.current) {
      clearTimeout(speechSilenceTimerRef.current);
      speechSilenceTimerRef.current = null;
    }

    try {
      window.speechSynthesis.cancel();
      const liveVoices = availableVoices.length > 0 ? availableVoices : window.speechSynthesis.getVoices();

      let targetVoice: SpeechSynthesisVoice | undefined;
      if (selectedVoiceURI) {
        targetVoice = liveVoices.find((v) => v.voiceURI === selectedVoiceURI);
      }
      if (!targetVoice) {
        targetVoice = liveVoices.find((v) => (v.lang || "").toLowerCase().startsWith("hi"));
      }
      if (!targetVoice && liveVoices.length > 0) {
        targetVoice = liveVoices.find((v) => v.name.toLowerCase().includes("female")) || liveVoices[0];
      }

      const hasHindiVoice = (targetVoice?.lang || "").toLowerCase().startsWith("hi");
      let textToPronounce = "";
      let langToSet = "hi-IN";

      if (hasHindiVoice) {
        textToPronounce = devanagariHindi.replace(/[*#_~`]/g, "").replace(/₹/g, " रुपये ").replace(/\n+/g, "। ");
        langToSet = targetVoice ? targetVoice.lang : "hi-IN";
      } else {
        const base = romanHinglish.trim() || toPhoneticRomanHinglish(devanagariHindi);
        textToPronounce = base.replace(/[*#_~`]/g, "").replace(/₹/g, " rupees ").replace(/[\u0900-\u097F]/g, "").replace(/\n+/g, ". ").trim();
        langToSet = targetVoice ? targetVoice.lang : "en-IN";
      }

      const utterance = new SpeechSynthesisUtterance(textToPronounce);
      utterance.rate = speechSpeed;
      utterance.pitch = speechPitch;
      utterance.volume = 1.0;
      utterance.lang = langToSet;
      if (targetVoice) utterance.voice = targetVoice;

      currentUtteranceRef.current = utterance;

      const finishSpeech = () => {
        setIsSpeaking(false);
        isSpeakingRef.current = false;
        currentSpeakingTextRef.current = "";
        currentUtteranceRef.current = null;
        if (speakingSafetyTimerRef.current) {
          clearTimeout(speakingSafetyTimerRef.current);
          speakingSafetyTimerRef.current = null;
        }
        if (isAlwaysListeningRef.current && !isRecognitionActiveRef.current) {
          startListening();
        }
      };

      utterance.onend = finishSpeech;
      utterance.onerror = () => finishSpeech();

      if (speakingSafetyTimerRef.current) clearTimeout(speakingSafetyTimerRef.current);
      const estimatedMs = Math.max(3500, textToPronounce.length * 85);
      speakingSafetyTimerRef.current = setTimeout(finishSpeech, estimatedMs);

      setTimeout(() => {
        if (typeof window !== "undefined" && "speechSynthesis" in window) {
          try {
            window.speechSynthesis.speak(utterance);
          } catch (e) {
            finishSpeech();
          }
        }
      }, 40);
    } catch (err) {
      setIsSpeaking(false);
      isSpeakingRef.current = false;
    }
  };

  const stopSpeaking = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      if (speakingSafetyTimerRef.current) {
        clearTimeout(speakingSafetyTimerRef.current);
        speakingSafetyTimerRef.current = null;
      }
      setIsSpeaking(false);
      isSpeakingRef.current = false;
      currentSpeakingTextRef.current = "";
      currentUtteranceRef.current = null;
    }
  };

  // Main Command Processing Pipeline
  const handleProcessCommand = async (rawQuery: string) => {
    const trimmed = rawQuery.trim();
    if (!trimmed) return;

    // Suppress rapid duplicates within 1.5 seconds
    const now = Date.now();
    const last = lastProcessedQueryRef.current;
    if (
      last.text.toLowerCase() === trimmed.toLowerCase() &&
      now - last.time < 1500
    ) {
      return;
    }
    lastProcessedQueryRef.current = { text: trimmed, time: now };

    audioSystem.playClick(600);
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: "user",
      text: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery("");

    try {
      const handleScrollPage = (direction: "up" | "down" | "top" | "bottom" = "down") => {
        if (props.handleScrollPage) {
          props.handleScrollPage(direction);
        } else {
          performPageScroll(direction);
        }
      };

      // Execute via AI Action Engine
      const res = await aiActionEngine.execute(trimmed, { ...props, handleScrollPage });

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: "assistant",
        text: res.text,
        spokenHindi: res.spokenHindi,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        actionTaken: res.actionTaken,
        dataCard: res.dataCard,
        requiresConfirmation: res.requiresConfirmation,
      };

      setMessages((prev) => [...prev, aiMsg]);
      speakText(res.text, res.spokenHindi, res.actionTaken);
    } catch (err: any) {
      const errMsg: ChatMessage = {
        id: `ai-err-${Date.now()}`,
        sender: "assistant",
        text: `Command execute nahi ho saka: ${err?.message || "Server error"}`,
        spokenHindi: "कमांड पूरी नहीं हो पाई, सर्वर एरर आ गया।",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errMsg]);
      speakText(errMsg.text, errMsg.spokenHindi);
    }
  };

  const currentMem = adminContextMemory.getState();

  return (
    <>
      {/* ================= VOICE STUDIO SETTINGS POPOVER (MONOCHROME) ================= */}
      {showVoiceSettings && (
        <div className="fixed bottom-28 right-6 z-50 w-[92vw] sm:w-[360px] bg-black/95 text-white border border-neutral-700 shadow-[0_25px_70px_rgba(0,0,0,0.95)] backdrop-blur-3xl p-4 rounded-2xl font-mono text-xs space-y-3.5 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-2.5">
            <div className="flex items-center gap-1.5 text-white font-bold uppercase text-[11px] tracking-wider">
              <Sliders className="w-4 h-4 text-white" />
              <span>VOICE STUDIO CONFIGURATION</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => speakText("Namaste admin sir! Sound system 100% active hai.", "नमस्ते एडमिन सर! साउंड सिस्टम एक्टिव है।")}
                className="px-2.5 py-1 rounded-full bg-white hover:bg-neutral-200 text-black text-[9.5px] font-bold uppercase flex items-center gap-1 transition-all cursor-pointer shadow-sm"
              >
                <Play className="w-3 h-3 fill-black text-black" />
                <span>TEST</span>
              </button>
              <button
                type="button"
                onClick={() => setShowVoiceSettings(false)}
                className="p-1 text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[9.5px] text-neutral-400 uppercase tracking-wider block">
              CHOOSE FEMALE HINDI VOICE MODEL
            </label>
            <select
              value={selectedVoiceURI}
              onChange={(e) => handleSelectVoice(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-700 text-white text-[11px] p-2 rounded-xl focus:outline-none focus:border-white cursor-pointer font-sans"
            >
              {femaleVoices.map((v) => (
                <option key={v.voiceURI} value={v.voiceURI}>
                  {v.name} ({v.lang}) {v.lang.includes("hi") ? "🇮🇳 HINDI NATIVE" : ""}
                </option>
              ))}
              {femaleVoices.length === 0 && (
                <option value="">Default Browser Voice Engine</option>
              )}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[9.5px] text-neutral-400 uppercase tracking-wider block">
              SPEECH RECOGNITION INPUT LANGUAGE
            </label>
            <select
              value={speechInputLang}
              onChange={(e) => handleSetSpeechInputLang(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-700 text-white text-[11px] p-2 rounded-xl focus:outline-none focus:border-white cursor-pointer font-sans"
            >
              <option value="en-IN">🇮🇳 English / Hinglish (en-IN) — Best for mixed Hindi & English commands</option>
              <option value="hi-IN">🇮🇳 Hindi Native (hi-IN) — Pure Devanagari Hindi transcription</option>
              <option value="en-US">🌐 English Global (en-US) — Standard US English</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <div className="flex justify-between text-[9.5px] text-neutral-400 mb-1">
                <span>PITCH</span>
                <span className="text-white font-bold">{speechPitch.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="0.9"
                max="1.5"
                step="0.02"
                value={speechPitch}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setSpeechPitch(val);
                  try {
                    localStorage.setItem("drapza_egirl_voice_pitch", String(val));
                  } catch (err) { }
                }}
                className="w-full accent-white cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-[9.5px] text-neutral-400 mb-1">
                <span>SPEED</span>
                <span className="text-white font-bold">{speechSpeed.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="0.8"
                max="1.3"
                step="0.02"
                value={speechSpeed}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setSpeechSpeed(val);
                  try {
                    localStorage.setItem("drapza_egirl_voice_rate", String(val));
                  } catch (err) { }
                }}
                className="w-full accent-white cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {/* ================= INTERACTIVE ADMIN COMMAND DRAWER / CONSOLE ================= */}
      {isConsoleOpen && (
        <div className="fixed bottom-28 right-6 z-50 w-[94vw] sm:w-[460px] h-[580px] max-h-[80vh] bg-black/95 text-white border border-neutral-700/80 shadow-[0_30px_90px_rgba(0,0,0,0.95)] backdrop-blur-3xl rounded-3xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 font-sans">
          {/* Header */}
          <div className="p-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/60">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-white text-black flex items-center justify-center font-bold text-xs">
                AI
              </div>
              <div>
                <h3 className="text-xs font-bold tracking-wider uppercase text-white flex items-center gap-1.5">
                  <span>ATELIER COMMAND OS</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </h3>
                <p className="text-[10px] text-neutral-400 font-mono">
                  Full Dashboard & Business Control
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleSetSpeechInputLang(speechInputLang === "en-IN" ? "hi-IN" : "en-IN")}
                className="text-[9.5px] font-mono px-2 py-1 rounded-md border border-neutral-700 bg-neutral-900 hover:border-neutral-500 text-neutral-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1"
                title="Click to Switch Speech Recognition Language (Hinglish/English vs Hindi Devanagari)"
              >
                <span className={`w-1.5 h-1.5 rounded-full ${speechInputLang === "en-IN" ? "bg-cyan-400" : "bg-amber-400"}`} />
                <span>{speechInputLang === "en-IN" ? "HINGLISH" : "हिंदी"}</span>
              </button>
              <button
                type="button"
                onClick={() => setShowAuditLogs(!showAuditLogs)}
                className={`text-[9.5px] font-mono px-2 py-1 rounded-md border transition-colors cursor-pointer ${showAuditLogs
                    ? "bg-white text-black border-white font-bold"
                    : "text-neutral-400 hover:text-white border-neutral-800 hover:bg-neutral-800"
                  }`}
                title="View AI Telemetry & Audit Logs"
              >
                <span>{showAuditLogs ? "CHAT" : "AUDIT LOGS"}</span>
              </button>
              <button
                type="button"
                onClick={() => setIsConsoleOpen(false)}
                className="p-1.5 text-neutral-400 hover:text-white transition-colors cursor-pointer rounded-lg hover:bg-neutral-800"
                title="Close Command Console"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Real-Time Context Pill Banner */}
          <div className="px-4 py-2 bg-neutral-900/90 border-b border-neutral-800/80 flex items-center justify-between text-[10.5px] font-mono text-neutral-300">
            <div className="flex items-center gap-1.5 truncate">
              <span className="text-neutral-500">TAB:</span>
              <span className="text-white font-bold uppercase">{props.activeTab}</span>
              {currentMem.currentProduct && (
                <>
                  <span className="text-neutral-600">•</span>
                  <span className="text-neutral-500">PROD:</span>
                  <span className="text-white truncate max-w-[120px]">{currentMem.currentProduct.name}</span>
                </>
              )}
              {currentMem.currentOrder && (
                <>
                  <span className="text-neutral-600">•</span>
                  <span className="text-neutral-500">ORD:</span>
                  <span className="text-white font-mono">#{currentMem.currentOrder.orderNumber || String(currentMem.currentOrder._id).slice(-4)}</span>
                </>
              )}
            </div>
            <button
              type="button"
              onClick={() => handleProcessCommand("refresh")}
              className="text-[9.5px] text-neutral-400 hover:text-white flex items-center gap-1 cursor-pointer"
              title="Sync Store Data"
            >
              <RefreshCw className="w-3 h-3" />
              <span>SYNC</span>
            </button>
          </div>

          {/* Quick Action Chips */}
          <div className="px-4 py-2 border-b border-neutral-800/60 flex items-center gap-1.5 overflow-x-auto scrollbar-none text-[10px] font-mono text-neutral-300 bg-neutral-950/40">
            <button
              type="button"
              onClick={() => handleProcessCommand("page scroll kro")}
              className="px-2.5 py-1 rounded-full bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/80 whitespace-nowrap cursor-pointer transition-colors text-cyan-300"
            >
              ↓ Scroll Page
            </button>
            <button
              type="button"
              onClick={() => handleProcessCommand("upar scroll karo")}
              className="px-2.5 py-1 rounded-full bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/80 whitespace-nowrap cursor-pointer transition-colors text-cyan-300"
            >
              ↑ Scroll Top
            </button>
            <button
              type="button"
              onClick={() => handleProcessCommand("website logo control studio kholo")}
              className="px-2.5 py-1 rounded-full bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/80 whitespace-nowrap cursor-pointer transition-colors text-amber-300"
            >
              Logo Studio
            </button>
            <button
              type="button"
              onClick={() => handleProcessCommand("orders mein pending orders dikhao")}
              className="px-2.5 py-1 rounded-full bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/80 whitespace-nowrap cursor-pointer transition-colors"
            >
              Pending Orders
            </button>
            <button
              type="button"
              onClick={() => handleProcessCommand("out of stock products dikhao")}
              className="px-2.5 py-1 rounded-full bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/80 whitespace-nowrap cursor-pointer transition-colors"
            >
              Out of Stock
            </button>
            <button
              type="button"
              onClick={() => handleProcessCommand("saare orders ke bulk invoices download karo")}
              className="px-2.5 py-1 rounded-full bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/80 whitespace-nowrap cursor-pointer transition-colors"
            >
              Bulk Invoices
            </button>
            <button
              type="button"
              onClick={() => handleProcessCommand("aaj kitne orders aaye?")}
              className="px-2.5 py-1 rounded-full bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/80 whitespace-nowrap cursor-pointer transition-colors"
            >
              Today Orders
            </button>
            <button
              type="button"
              onClick={() => handleProcessCommand("COD on hai?")}
              className="px-2.5 py-1 rounded-full bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/80 whitespace-nowrap cursor-pointer transition-colors"
            >
              COD Status
            </button>
          </div>

          {/* Main Body: Audit Logs View or Messages Feed */}
          {showAuditLogs ? (
            <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs font-mono">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                <span className="text-[11px] font-bold text-neutral-300">
                  AI TELEMETRY AUDIT LOG ({adminContextMemory.getAuditLogs().length})
                </span>
                <button
                  type="button"
                  onClick={() => {
                    adminContextMemory.clearAuditLogs();
                    setMessages((prev) => [...prev]);
                  }}
                  className="text-[10px] text-red-400 hover:text-red-300 cursor-pointer"
                >
                  Clear Logs
                </button>
              </div>

              {adminContextMemory.getAuditLogs().length === 0 ? (
                <div className="text-center py-16 text-neutral-500 text-[11px]">
                  No AI audit logs recorded yet. Speak or type commands to see telemetry.
                </div>
              ) : (
                adminContextMemory.getAuditLogs().map((entry) => (
                  <div key={entry.id} className="p-3 bg-neutral-900/90 border border-neutral-800 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300 uppercase font-bold text-[9px]">
                        {entry.detectedLanguage}
                      </span>
                      <span className="text-neutral-500 text-[9px]">{new Date(entry.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <div className="text-[11px] text-neutral-200">
                      <span className="text-neutral-500">RAW: </span>&quot;{entry.userInput}&quot;
                    </div>
                    <div className="text-[11px] text-emerald-400">
                      <span className="text-neutral-500">CANONICAL: </span>{entry.canonicalCommand}
                    </div>
                    <div className="flex items-center gap-2 text-[9.5px] text-neutral-400">
                      <span>INTENT: <strong className="text-neutral-300">{entry.intent}</strong></span>
                      <span>•</span>
                      <span>MODULE: <strong className="text-neutral-300">{entry.module}</strong></span>
                    </div>
                    {entry.actionTaken && (
                      <div className="text-[9.5px] text-neutral-300 pt-1 border-t border-neutral-800/80">
                        RESULT: <span className={entry.success ? "text-emerald-400" : "text-red-400"}>{entry.actionTaken}</span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          ) : (
            /* Messages Feed */
            <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs">
              {messages.map((msg) => {
                const isUser = msg.sender === "user";
                return (
                  <div key={msg.id} className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}>
                    <div
                      className={`max-w-[85%] rounded-2xl p-3 leading-relaxed ${isUser
                          ? "bg-white text-black font-medium rounded-br-sm shadow-md"
                          : "bg-neutral-900 border border-neutral-800 text-neutral-200 rounded-bl-sm"
                        }`}
                    >
                      <p className="whitespace-pre-line">{msg.text}</p>

                      {/* Action Taken Badge */}
                      {msg.actionTaken && (
                        <div className="mt-2 pt-2 border-t border-neutral-800 flex items-center gap-1.5 text-[9.5px] font-mono text-emerald-400">
                          <CheckCircle2 className="w-3 h-3 shrink-0" />
                          <span>{msg.actionTaken}</span>
                        </div>
                      )}

                      {/* Interactive Confirmation Prompt Buttons */}
                      {msg.requiresConfirmation && (
                        <div className="mt-3 pt-2.5 border-t border-neutral-800 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleProcessCommand("haan")}
                            className="px-3 py-1.5 rounded-xl bg-white hover:bg-neutral-200 text-black font-bold text-[10.5px] font-mono flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Check className="w-3 h-3" />
                            <span>Haan, Kar do</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleProcessCommand("nahi")}
                            className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-mono text-[10.5px] cursor-pointer transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                    <span className="text-[9px] font-mono text-neutral-500 mt-1 px-1">{msg.timestamp}</span>
                  </div>
                );
              })}
              <div ref={chatBottomRef} />
            </div>
          )}

          {/* Command Input Bar */}
          <div className="p-3 border-t border-neutral-800 bg-neutral-950/80">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (inputQuery.trim()) {
                  handleProcessCommand(inputQuery);
                }
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder="Type command e.g. 'Orders mein pending dikhao'..."
                className="flex-1 bg-neutral-900 border border-neutral-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white transition-colors"
              />
              <button
                type="button"
                onClick={() => {
                  if (isListening) stopListening();
                  else startListening();
                }}
                className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${isListening
                    ? "bg-white text-black border-white animate-pulse"
                    : "bg-neutral-900 text-neutral-300 hover:text-white border-neutral-700"
                  }`}
                title="Voice Input"
              >
                <Mic className="w-4 h-4" />
              </button>
              <button
                type="submit"
                disabled={!inputQuery.trim()}
                className="p-2.5 rounded-xl bg-white disabled:bg-neutral-800 text-black disabled:text-neutral-600 transition-colors cursor-pointer"
                title="Send Command"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ================= 360° CIRCULAR SOUND WAVE ORB WIDGET ================= */}
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 select-none">
        {/* Floating Controls Satellite Pills */}
        <div className="flex flex-col items-end gap-1.5">
          {/* Always-Listening Toggle */}
          <button
            type="button"
            onClick={toggleAlwaysListening}
            className={`group flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-[10.5px] font-mono font-bold transition-all shadow-xl backdrop-blur-xl cursor-pointer ${isAlwaysListening
                ? "bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.7)] animate-pulse"
                : "bg-black/90 hover:bg-neutral-900 text-neutral-300 border-neutral-700 hover:border-neutral-500"
              }`}
            title={isAlwaysListening ? "Turn OFF Always Listening" : "Turn ON Always Listening"}
          >
            <Power className={`w-3 h-3 ${isAlwaysListening ? "animate-spin text-black" : "text-white"}`} />
            <span>{isAlwaysListening ? "ALWAYS LISTENING: ON" : "ALWAYS LISTENING: OFF"}</span>
          </button>

          <div className="flex items-center gap-1.5">
            {/* Quick Speech Input Language Switcher */}
            <button
              type="button"
              onClick={() => handleSetSpeechInputLang(speechInputLang === "en-IN" ? "hi-IN" : "en-IN")}
              className="px-2.5 py-1 rounded-full border backdrop-blur-xl transition-all shadow-lg cursor-pointer bg-black/90 text-white border-neutral-700 hover:border-neutral-400 flex items-center gap-1 font-mono text-[9.5px] font-bold tracking-wider"
              title="Click to Switch Speech Recognition Language: Hinglish (en-IN) / Hindi Native (hi-IN)"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${speechInputLang === "en-IN" ? "bg-cyan-400" : "bg-amber-400"} animate-pulse`} />
              <span>{speechInputLang === "en-IN" ? "HINGLISH" : "हिंदी"}</span>
            </button>

            {/* Open Console Drawer */}
            <button
              type="button"
              onClick={() => setIsConsoleOpen(!isConsoleOpen)}
              className={`p-2 rounded-full border backdrop-blur-xl transition-all shadow-lg cursor-pointer ${isConsoleOpen
                  ? "bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.6)]"
                  : "bg-black/90 text-neutral-300 hover:text-white border-neutral-700 hover:border-neutral-500"
                }`}
              title="Open Command Console Drawer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
            </button>

            {/* Voice Settings */}
            <button
              type="button"
              onClick={() => setShowVoiceSettings(!showVoiceSettings)}
              className={`p-2 rounded-full border backdrop-blur-xl transition-all shadow-lg cursor-pointer ${showVoiceSettings
                  ? "bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.6)]"
                  : "bg-black/90 text-neutral-300 hover:text-white border-neutral-700 hover:border-neutral-500"
                }`}
              title="Voice Settings"
            >
              <Settings2 className="w-3.5 h-3.5" />
            </button>

            {/* Mute Audio */}
            <button
              type="button"
              onClick={() => {
                if (!isMuted) stopSpeaking();
                setIsMuted(!isMuted);
              }}
              className={`p-2 rounded-full border backdrop-blur-xl transition-all shadow-lg cursor-pointer ${isMuted
                  ? "bg-neutral-800 text-neutral-400 border-neutral-700"
                  : "bg-black/90 text-white hover:text-neutral-200 border-neutral-700 hover:border-neutral-500"
                }`}
              title={isMuted ? "Unmute Voice" : "Mute Voice"}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* 360° Polar Visualizer Orb Container */}
        <div className="relative flex items-center justify-center">
          {/* Subtitle Capsule */}
          {(isListening || liveHeardSubtitle || micPermissionError) && (
            <div className="absolute -top-10 right-0 flex items-center gap-2 bg-black/95 border border-neutral-700/80 px-3.5 py-1.5 rounded-full shadow-[0_10px_35px_rgba(0,0,0,0.95)] backdrop-blur-2xl text-[10.5px] font-mono text-white max-w-[280px] sm:max-w-[340px] truncate animate-in fade-in slide-in-from-bottom-2 duration-150 pointer-events-none z-30">
              {micPermissionError ? (
                <span className="text-red-400 font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping shrink-0" />
                  <span>Mic blocked: Allow mic in browser bar</span>
                </span>
              ) : liveHeardSubtitle ? (
                <span className="text-white flex items-center gap-1.5 truncate font-medium">
                  <AudioWaveform className="w-3.5 h-3.5 text-white animate-pulse shrink-0" />
                  <span className="truncate">"{liveHeardSubtitle}"</span>
                </span>
              ) : (
                <span className="text-neutral-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse shrink-0" />
                  <span>Listening... Speak command</span>
                </span>
              )}
            </div>
          )}

          {/* Glowing Aura Ring */}
          <div
            className={`absolute -inset-2.5 rounded-full transition-all duration-500 blur-md ${isListening
                ? "bg-white/30 animate-pulse"
                : isSpeaking
                  ? "bg-white/40 animate-pulse"
                  : isAlwaysListening
                    ? "bg-white/20"
                    : "bg-white/10"
              }`}
          />

          {/* Canvas Waveform */}
          <div className="relative w-[130px] h-[130px] rounded-full bg-black/95 border border-neutral-700 shadow-[0_15px_50px_rgba(0,0,0,0.95)] backdrop-blur-3xl flex items-center justify-center overflow-hidden">
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />

            {/* Core Action Button */}
            <button
              type="button"
              onClick={() => {
                if (isSpeaking) {
                  stopSpeaking();
                } else if (isListening) {
                  stopListening();
                } else {
                  startListening();
                }
                audioSystem.playClick(950);
              }}
              className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-105 active:scale-95 cursor-pointer border shadow-2xl ${isListening
                  ? "bg-white text-black border-white shadow-[0_0_25px_rgba(255,255,255,0.8)] animate-pulse"
                  : isSpeaking
                    ? "bg-white text-black border-white shadow-[0_0_25px_rgba(255,255,255,0.9)] animate-pulse"
                    : isAlwaysListening
                      ? "bg-neutral-900 text-white border-white/70 shadow-[0_0_20px_rgba(255,255,255,0.4)]"
                      : "bg-black text-white border-neutral-700 hover:border-white shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                }`}
              title={
                isSpeaking
                  ? "Click to Stop Speaking"
                  : isListening
                    ? "Listening... Click to Stop"
                    : "Click to Speak Command"
              }
              aria-label="AI Voice Trigger"
            >
              {isSpeaking ? (
                <AudioWaveform className="w-5 h-5 animate-bounce" />
              ) : isListening ? (
                <Mic className="w-5 h-5 animate-pulse" />
              ) : isAlwaysListening ? (
                <Mic className="w-5 h-5 text-white" />
              ) : (
                <Mic className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

