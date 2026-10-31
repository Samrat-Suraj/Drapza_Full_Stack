"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import gsap from "gsap";
import { useRouter, useSearchParams } from "next/navigation";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Check,
  AlertCircle,
  X,
  KeyRound,
  ShieldAlert,
  Scissors,
  Ruler,
  Layers,
  Shirt,
  Tag,
  PackageCheck,
  Sparkle,
} from "lucide-react";
import { audioSystem } from "./AudioSystem";
import { userApi, authPortalApi, AuthPortalConfigData, DEFAULT_AUTH_PORTAL_CONFIG, FabricSwatchData } from "@/lib/api";
import { useLockBodyScroll } from "./useLockBodyScroll";
import { signupSchema, loginSchema, forgotPasswordSchema, otpVerificationSchema, getZodErrorMessage } from "@/lib/validation";
import { normalizeImageUrl, handleImageFallbackError } from "@/lib/imageUtils";

interface AuthContainerProps {
  initialMode?: "login" | "signup";
}

export function AuthContainer({ initialMode = "login" }: AuthContainerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams?.get("redirect") || "/wardrobe";

  const [config, setConfig] = useState<AuthPortalConfigData>(DEFAULT_AUTH_PORTAL_CONFIG);
  const activeSwatches: FabricSwatchData[] =
    config.fabricSwatches && config.fabricSwatches.length > 0
      ? config.fabricSwatches
      : (DEFAULT_AUTH_PORTAL_CONFIG.fabricSwatches || []);

  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [selectedFabric, setSelectedFabric] = useState<FabricSwatchData>(activeSwatches[0]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  useLockBodyScroll(forgotPasswordOpen);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);
  const [currentTime, setCurrentTime] = useState("");

  // Form Fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Mandatory Email OTP State
  const [requireOtp, setRequireOtp] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [otpEmail, setOtpEmail] = useState("");
  const [otpCountdown, setOtpCountdown] = useState(60);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isResendingOtp, setIsResendingOtp] = useState(false);
  const [otpInfoMessage, setOtpInfoMessage] = useState("");
  const otpInputRef = useRef<HTMLInputElement>(null);

  // Load Google Identity Services SDK
  useEffect(() => {
    if (typeof window === "undefined") return;
    if ((window as any).google?.accounts?.id || (window as any).google?.accounts?.oauth2) return;

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
  }, []);

  // Check if user is already authenticated & redirect away from login/signup
  useEffect(() => {
    let isMounted = true;
    const verifyExistingSession = async () => {
      try {
        const res = await userApi.getProfile();
        if (res && res.success && res.user && isMounted) {
          const userObj = res.user;
          try {
            localStorage.setItem("drapza_user", JSON.stringify(userObj));
            window.dispatchEvent(new CustomEvent("drapza_auth_state_changed", { detail: userObj }));
          } catch (e) { }
          const isAdmin =
            userObj.role === "admin" || userObj.email?.toLowerCase() === "drapza.cloth@gmail.com";
          if (isAdmin) {
            router.replace("/admin");
          } else {
            const safeTarget =
              redirectUrl === "/admin" || redirectUrl.startsWith("/admin/")
                ? "/"
                : redirectUrl;
            router.replace(safeTarget);
          }
          return;
        }
      } catch (err) {
        // Not authenticated, proceed to render form
      } finally {
        if (isMounted) {
          setIsCheckingAuth(false);
        }
      }
    };

    verifyExistingSession();
    return () => {
      isMounted = false;
    };
  }, [router]);

  // Refs for GSAP animations
  const containerRef = useRef<HTMLDivElement>(null);
  const formCardRef = useRef<HTMLDivElement>(null);
  const visualCardRef = useRef<HTMLDivElement>(null);
  const tiltGraphicRef = useRef<HTMLDivElement>(null);
  const hangtagRef = useRef<HTMLDivElement>(null);
  const garmentImgRef = useRef<HTMLImageElement>(null);
  const titleTextRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const modeSliderRef = useRef<HTMLDivElement>(null);
  const formFieldsRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const modalBackdropRef = useRef<HTMLDivElement>(null);
  const strengthBarRef = useRef<HTMLDivElement>(null);

  // Live Atelier Production Clock
  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      setCurrentTime(
        d.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" }) +
        " [DRAPZA ATELIER]"
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // OTP Resend Countdown Timer
  useEffect(() => {
    if (!requireOtp || otpCountdown <= 0) return;
    const interval = setInterval(() => {
      setOtpCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [requireOtp, otpCountdown]);

  // Focus OTP Input on Screen Entry
  useEffect(() => {
    if (requireOtp) {
      const t = setTimeout(() => {
        otpInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(t);
    }
  }, [requireOtp]);

  // Fetch live Auth Portal CMS Config
  useEffect(() => {
    let isMounted = true;
    const loadPortalConfig = async () => {
      try {
        const res = await authPortalApi.getConfig();
        if (res && res.success && res.data && isMounted) {
          setConfig(res.data);
          if (res.data.fabricSwatches && res.data.fabricSwatches.length > 0) {
            setSelectedFabric(res.data.fabricSwatches[0]);
          }
        }
      } catch (err) {
        // Fall back gracefully to defaults
      }
    };
    loadPortalConfig();
    return () => {
      isMounted = false;
    };
  }, []);

  // Audio System Trigger Helper with config mute support
  const playSound = (freq = 800, dur = 0.02) => {
    if (config.enableSoundEffects !== false) {
      audioSystem.playClick(freq, dur);
    }
  };

  const playAudioOpen = () => {
    if (config.enableSoundEffects !== false) {
      audioSystem.playOpen();
    }
  };

  // Dynamic Aesthetics Corner Radius Classes
  const cardRadiusClass =
    config.cardStyle === "curved"
      ? "rounded-2xl"
      : config.cardStyle === "subtle-rounded"
        ? "rounded-md"
        : "rounded-none";

  const buttonRadiusClass =
    config.cardStyle === "curved"
      ? "rounded-xl"
      : config.cardStyle === "subtle-rounded"
        ? "rounded"
        : "rounded-none";

  // Synchronize mode
  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  // Master Entrance Animation & Hangtag Sway
  useEffect(() => {
    if (isCheckingAuth || !containerRef.current) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      // Ambient background elements
      const bgElems = containerRef.current?.querySelectorAll(".auth-bg-elem");
      if (bgElems && bgElems.length > 0) {
        tl.from(bgElems, {
          opacity: 0,
          scale: 0.96,
          duration: 0.8,
          stagger: 0.08,
        });
      }

      // Left Apparel Visual Card
      if (visualCardRef.current) {
        tl.from(
          visualCardRef.current,
          {
            x: -30,
            opacity: 0,
            duration: 0.9,
            ease: "power4.out",
          },
          "-=0.5"
        );
      }

      // Right Atelier Form Card
      if (formCardRef.current) {
        tl.from(
          formCardRef.current,
          {
            x: 30,
            opacity: 0,
            duration: 0.9,
            ease: "power4.out",
          },
          "-=0.7"
        );
      }

      // Hanging Fabric Tag pendulum swing on entrance
      if (hangtagRef.current) {
        gsap.fromTo(
          hangtagRef.current,
          { rotate: -18, transformOrigin: "top center" },
          {
            rotate: 0,
            duration: 1.8,
            ease: "elastic.out(1.2, 0.3)",
          }
        );
      }

      // Staggered Title & Badges
      const staggerTexts = containerRef.current?.querySelectorAll(".auth-stagger-text");
      if (staggerTexts && staggerTexts.length > 0) {
        tl.from(
          staggerTexts,
          {
            y: 20,
            opacity: 0,
            duration: 0.5,
            stagger: 0.05,
          },
          "-=0.6"
        );
      }

      // Form Elements Stagger
      const fieldItems = containerRef.current?.querySelectorAll(".auth-field-item");
      if (fieldItems && fieldItems.length > 0) {
        tl.from(
          fieldItems,
          {
            y: 18,
            opacity: 0,
            duration: 0.45,
            stagger: 0.04,
          },
          "-=0.4"
        );
      }
    }, containerRef);

    return () => ctx.revert();
  }, [isCheckingAuth]);

  // Interactive 3D Cursor Parallax on Apparel Visual
  useEffect(() => {
    if (isCheckingAuth || config.enableTilt3D === false) return;
    const visual = visualCardRef.current;
    if (!visual) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = visual.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;

      gsap.to(tiltGraphicRef.current, {
        rotateY: (x / rect.width) * 14,
        rotateX: -(y / rect.height) * 14,
        transformPerspective: 900,
        ease: "power2.out",
        duration: 0.4,
      });

      // Subtle hangtag sway with mouse movement
      if (hangtagRef.current) {
        gsap.to(hangtagRef.current, {
          rotate: (x / rect.width) * 10,
          transformOrigin: "top center",
          duration: 0.6,
          ease: "power2.out",
        });
      }
    };

    const handleMouseLeave = () => {
      gsap.to(tiltGraphicRef.current, {
        rotateY: 0,
        rotateX: 0,
        ease: "power3.out",
        duration: 0.8,
      });
      if (hangtagRef.current) {
        gsap.to(hangtagRef.current, {
          rotate: 0,
          transformOrigin: "top center",
          duration: 1.2,
          ease: "elastic.out(1, 0.4)",
        });
      }
    };

    visual.addEventListener("mousemove", handleMouseMove);
    visual.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      visual.removeEventListener("mousemove", handleMouseMove);
      visual.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [isCheckingAuth, config.enableTilt3D]);

  // Fabric Swatch Switcher with Smooth GSAP transition
  const handleSwatchChange = (swatch: FabricSwatchData) => {
    if (swatch.id === selectedFabric.id) return;
    playSound(850, 0.03);

    // Garment image quick fade/scale transition
    if (garmentImgRef.current) {
      gsap.timeline()
        .to(garmentImgRef.current, {
          scale: 0.92,
          opacity: 0,
          duration: 0.2,
          ease: "power2.in",
          onComplete: () => setSelectedFabric(swatch),
        })
        .to(garmentImgRef.current, {
          scale: 1,
          opacity: 1,
          duration: 0.4,
          ease: "power3.out",
        });
    } else {
      setSelectedFabric(swatch);
    }
  };

  // Mode Switch Animation (Login <-> Signup)
  const handleModeSwitch = (newMode: "login" | "signup") => {
    setErrorMessage("");
    setFieldErrors({});
    setRequireOtp(false);
    setOtpValue("");
    if (newMode === mode) return;
    playSound(600, 0.03);
    setSubmitStatus("idle");

    if (formFieldsRef.current) {
      gsap.timeline()
        .to(formFieldsRef.current, {
          opacity: 0,
          y: newMode === "signup" ? 15 : -15,
          duration: 0.2,
          ease: "power2.in",
          onComplete: () => {
            setMode(newMode);
            const targetQuery = redirectUrl && redirectUrl !== "/wardrobe" ? `?redirect=${encodeURIComponent(redirectUrl)}` : "";
            window.history.replaceState(null, "", `/${newMode}${targetQuery}`);
          },
        })
        .to(formFieldsRef.current, {
          opacity: 1,
          y: 0,
          duration: 0.35,
          ease: "power3.out",
        });
    } else {
      setMode(newMode);
      const targetQuery = redirectUrl && redirectUrl !== "/wardrobe" ? `?redirect=${encodeURIComponent(redirectUrl)}` : "";
      window.history.replaceState(null, "", `/${newMode}${targetQuery}`);
    }
  };

  // Password Strength Calculation (5 Criteria: length >= 8, uppercase, lowercase, number, special char)
  const calculateStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 8) score += 20;
    if (/[A-Z]/.test(pwd)) score += 20;
    if (/[a-z]/.test(pwd)) score += 20;
    if (/[0-9]/.test(pwd)) score += 20;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 20;
    return score;
  };

  const strengthScore = calculateStrength(password);

  useEffect(() => {
    if (strengthBarRef.current && mode === "signup") {
      gsap.to(strengthBarRef.current, {
        width: `${strengthScore}%`,
        duration: 0.4,
        ease: "power2.out",
      });
    }
  }, [strengthScore, mode]);

  const getStrengthLabel = () => {
    if (password.length === 0) return { text: "NO KEY ENTERED", color: "text-base-400", bg: "bg-base-300" };
    if (strengthScore <= 40) return { text: "WEAK THREAD (MIN 8 CHARS & MIXED)", color: "text-red-500", bg: "bg-red-500" };
    if (strengthScore <= 60) return { text: "STANDARD WEAVE", color: "text-amber-500", bg: "bg-amber-500" };
    if (strengthScore <= 80) return { text: "REINFORCED SEAM", color: "text-blue-500", bg: "bg-blue-500" };
    return { text: "BULLETPROOF 480 GSM LOCK", color: "text-emerald-500", bg: "bg-emerald-500" };
  };

  // Form Submit Handler with Zod Validation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setFieldErrors({});

    if (mode === "signup") {
      const validation = signupSchema.safeParse({
        name: name.trim(),
        email: email.trim(),
        password,
        confirmPassword,
        agreeTerms,
      });

      if (!validation.success) {
        const errors: Record<string, string> = {};
        const issues = (validation.error as any).issues || (validation.error as any).errors || [];
        issues.forEach((iss: any) => {
          const k = iss.path[0] as string;
          if (k && !errors[k]) errors[k] = iss.message;
        });
        setFieldErrors(errors);
        triggerError(getZodErrorMessage(validation.error));
        return;
      }
    } else {
      const validation = loginSchema.safeParse({
        email: email.trim(),
        password,
      });

      if (!validation.success) {
        const errors: Record<string, string> = {};
        const issues = (validation.error as any).issues || (validation.error as any).errors || [];
        issues.forEach((iss: any) => {
          const k = iss.path[0] as string;
          if (k && !errors[k]) errors[k] = iss.message;
        });
        setFieldErrors(errors);
        triggerError(getZodErrorMessage(validation.error));
        return;
      }
    }

    // Begin Submit
    audioSystem.playClick(1100, 0.04);
    setIsSubmitting(true);

    try {
      let res;
      if (mode === "signup") {
        res = await userApi.register({ name, email, password });
      } else {
        res = await userApi.login({ email, password });
      }

      if (!res.success) {
        setIsSubmitting(false);
        triggerError(res.message || "Authentication failed. Please check credentials.");
        return;
      }

      // STRICT TWO-STEP VALIDATION: Handle mandatory email OTP
      if (res.requireOtp) {
        setIsSubmitting(false);
        setRequireOtp(true);
        setOtpEmail(res.email || email.trim());
        setOtpInfoMessage(res.message || "One-time security key dispatched to your email.");
        setOtpCountdown(60);
        setOtpValue("");
        audioSystem.playOpen();
        return;
      }

      setIsSubmitting(false);
      setSubmitStatus("success");
      audioSystem.playOpen();

      const userObj = res.user;
      if (userObj) {
        try {
          localStorage.setItem("drapza_user", JSON.stringify(userObj));
          window.dispatchEvent(new CustomEvent("drapza_auth_state_changed", { detail: userObj }));
        } catch (e) { }
      }
      const isAdmin = userObj?.role === "admin" || userObj?.email?.toLowerCase() === "drapza.cloth@gmail.com";

      gsap.fromTo(
        formCardRef.current,
        { filter: "brightness(1.4)" },
        { filter: "brightness(1)", duration: 0.5 }
      );

      setTimeout(() => {
        if (isAdmin) {
          router.push("/admin");
        } else {
          const safeTarget =
            redirectUrl === "/admin" || redirectUrl.startsWith("/admin/")
              ? "/"
              : redirectUrl;
          router.push(safeTarget);
        }
      }, 1000);
    } catch (err: any) {
      setIsSubmitting(false);
      triggerError(err.message || "An unexpected error occurred.");
    }
  };

  // Verify Mandatory 6-Digit Email OTP with Zod
  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const validation = otpVerificationSchema.safeParse({ otp: otpValue.trim() });
    if (!validation.success) {
      triggerError(getZodErrorMessage(validation.error));
      return;
    }

    setErrorMessage("");
    audioSystem.playClick(1100, 0.04);
    setIsVerifyingOtp(true);

    try {
      const res = await userApi.verifyOtp({
        email: otpEmail || email.trim(),
        otp: otpValue.trim(),
      });

      if (!res.success) {
        setIsVerifyingOtp(false);
        triggerError(res.message || "Invalid or expired security key.");
        return;
      }

      setIsVerifyingOtp(false);
      setSubmitStatus("success");
      audioSystem.playOpen();

      const userObj = res.user;
      if (userObj) {
        try {
          localStorage.setItem("drapza_user", JSON.stringify(userObj));
          window.dispatchEvent(new CustomEvent("drapza_auth_state_changed", { detail: userObj }));
        } catch (e) { }
      }
      const isAdmin =
        userObj?.role === "admin" || userObj?.email?.toLowerCase() === "drapza.cloth@gmail.com";

      gsap.fromTo(
        formCardRef.current,
        { filter: "brightness(1.4)" },
        { filter: "brightness(1)", duration: 0.5 }
      );

      setTimeout(() => {
        if (isAdmin) {
          router.push("/admin");
        } else {
          const safeTarget =
            redirectUrl === "/admin" || redirectUrl.startsWith("/admin/")
              ? "/"
              : redirectUrl;
          router.push(safeTarget);
        }
      }, 1000);
    } catch (err: any) {
      setIsVerifyingOtp(false);
      triggerError(err.message || "Failed to verify security key.");
    }
  };

  // Resend OTP with Cooldown
  const handleResendOtp = async () => {
    if (otpCountdown > 0 || isResendingOtp) return;
    audioSystem.playClick(900, 0.03);
    setIsResendingOtp(true);
    setErrorMessage("");

    try {
      const res = await userApi.resendOtp({ email: otpEmail || email.trim() });
      if (res.success) {
        setOtpCountdown(60);
        setOtpInfoMessage("A fresh 6-digit security key has been dispatched to your email.");
      } else {
        triggerError(res.message || "Failed to resend security key.");
      }
    } catch (err: any) {
      triggerError(err.message || "Failed to resend security key.");
    } finally {
      setIsResendingOtp(false);
    }
  };

  // Back from OTP to Credential Form
  const handleBackFromOtp = () => {
    audioSystem.playClick(700, 0.03);
    setRequireOtp(false);
    setOtpValue("");
    setErrorMessage("");
    setSubmitStatus("idle");
  };

  // Google OAuth Popup Login Handler
  const handleGoogleLogin = () => {
    playSound(600, 0.03);
    setErrorMessage("");
    setFieldErrors({});

    const clientId =
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
      "";

    const gsi = (window as any).google?.accounts;

    if (!gsi) {
      triggerError("Google Services SDK is initializing. Please click again in a moment.");
      return;
    }

    setIsGoogleLoading(true);

    try {
      if (gsi.oauth2) {
        const tokenClient = gsi.oauth2.initTokenClient({
          client_id: clientId,
          scope: "email profile openid",
          callback: async (tokenResponse: any) => {
            if (tokenResponse && tokenResponse.access_token) {
              try {
                const res = await userApi.googleAuth({ accessToken: tokenResponse.access_token });
                if (res.success) {
                  setSubmitStatus("success");
                  playAudioOpen();
                  const userObj = res.user;
                  if (userObj) {
                    try {
                      localStorage.setItem("drapza_user", JSON.stringify(userObj));
                      window.dispatchEvent(new CustomEvent("drapza_auth_state_changed", { detail: userObj }));
                    } catch (e) { }
                  }
                  const isAdmin =
                    userObj?.role === "admin" ||
                    userObj?.email?.toLowerCase() === "drapza.cloth@gmail.com";
                  setTimeout(() => {
                    if (isAdmin) {
                      router.push("/admin");
                    } else {
                      const safeTarget =
                        redirectUrl === "/admin" || redirectUrl.startsWith("/admin/")
                          ? "/"
                          : redirectUrl;
                      router.push(safeTarget);
                    }
                  }, 800);
                } else {
                  triggerError(res.message || "Google authentication failed.");
                }
              } catch (err: any) {
                triggerError(err.message || "Failed to communicate with atelier vault.");
              } finally {
                setIsGoogleLoading(false);
              }
            } else {
              setIsGoogleLoading(false);
              if (tokenResponse?.error && tokenResponse.error !== "popup_closed_by_user") {
                triggerError("Google authentication failed. Please try again.");
              }
            }
          },
          error_callback: (error: any) => {
            setIsGoogleLoading(false);
            console.error("Google OAuth error:", error);
            if (error?.type !== "popup_closed") {
              triggerError("Google login popup was closed or blocked.");
            }
          },
        });

        tokenClient.requestAccessToken({ prompt: "select_account" });
      } else if (gsi.id) {
        gsi.id.initialize({
          client_id: clientId,
          callback: async (response: any) => {
            if (response && response.credential) {
              try {
                const res = await userApi.googleAuth({ credential: response.credential });
                if (res.success) {
                  setSubmitStatus("success");
                  playAudioOpen();
                  const userObj = res.user;
                  if (userObj) {
                    try {
                      localStorage.setItem("drapza_user", JSON.stringify(userObj));
                      window.dispatchEvent(new CustomEvent("drapza_auth_state_changed", { detail: userObj }));
                    } catch (e) { }
                  }
                  const isAdmin =
                    userObj?.role === "admin" ||
                    userObj?.email?.toLowerCase() === "drapza.cloth@gmail.com";
                  setTimeout(() => {
                    if (isAdmin) {
                      router.push("/admin");
                    } else {
                      router.push("/");
                    }
                  }, 800);
                } else {
                  triggerError(res.message || "Google authentication failed.");
                }
              } catch (err: any) {
                triggerError(err.message || "Failed to communicate with atelier vault.");
              } finally {
                setIsGoogleLoading(false);
              }
            }
          },
        });
        gsi.id.prompt();
      }
    } catch (err: any) {
      setIsGoogleLoading(false);
      console.error("Google login initiation error:", err);
      triggerError("Could not open Google popup. Please try again.");
    }
  };

  const triggerError = (msg: string) => {
    setErrorMessage(msg);
    setSubmitStatus("error");
    playSound(300, 0.08);

    if (formCardRef.current) {
      gsap.timeline()
        .to(formCardRef.current, { x: -8, duration: 0.06 })
        .to(formCardRef.current, { x: 8, duration: 0.06 })
        .to(formCardRef.current, { x: -5, duration: 0.06 })
        .to(formCardRef.current, { x: 5, duration: 0.06 })
        .to(formCardRef.current, { x: 0, duration: 0.06 });
    }
  };

  // Forgot Password Modal
  const handleOpenForgot = () => {
    setForgotPasswordOpen(true);
    setForgotSent(false);
    playSound(700, 0.03);

    setTimeout(() => {
      if (modalBackdropRef.current && modalRef.current) {
        gsap.to(modalBackdropRef.current, { opacity: 1, duration: 0.3 });
        gsap.fromTo(
          modalRef.current,
          { y: 30, opacity: 0, scale: 0.96 },
          { y: 0, opacity: 1, scale: 1, duration: 0.4, ease: "back.out(1.5)" }
        );
      }
    }, 10);
  };

  const handleCloseForgot = () => {
    if (modalBackdropRef.current && modalRef.current) {
      gsap.to(modalRef.current, { y: 20, opacity: 0, scale: 0.96, duration: 0.25, ease: "power2.in" });
      gsap.to(modalBackdropRef.current, {
        opacity: 0,
        duration: 0.25,
        onComplete: () => setForgotPasswordOpen(false),
      });
    } else {
      setForgotPasswordOpen(false);
    }
  };

  const handleSendForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = forgotPasswordSchema.safeParse({ email: forgotEmail });
    if (!validation.success) {
      triggerError(getZodErrorMessage(validation.error));
      return;
    }

    audioSystem.playClick(900, 0.04);
    try {
      await userApi.forgotPassword(forgotEmail);
    } catch (e) {
      console.error(e);
    }
    setForgotSent(true);
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-white text-black flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto" />
          <span className="font-mono-technical text-[10px] uppercase tracking-[0.25em] text-neutral-500 block">
            VERIFYING IDENTITY • DRAPZA ARCHIVE
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative min-h-[calc(100vh-80px)] pt-20 sm:pt-24 pb-12 sm:pb-16 px-3 sm:px-6 lg:px-12 flex items-center justify-center overflow-hidden bg-base-100 selection:bg-base-700 selection:text-base-100"
    >
      {/* Pattern Cutting Measurement Markings Background */}
      {config.backgroundPatternEnabled !== false && (
        <>
          <div className="auth-bg-elem absolute inset-0 pointer-events-none bg-halftone opacity-40 z-0" />
          <div className="auth-bg-elem absolute top-0 left-12 w-[1px] h-full border-l border-dashed border-base-400/40 pointer-events-none hidden md:block" />
          <div className="auth-bg-elem absolute top-0 right-12 w-[1px] h-full border-r border-dashed border-base-400/40 pointer-events-none hidden md:block" />
          <div className="auth-bg-elem absolute top-20 left-0 right-0 h-4 border-b border-dashed border-base-300 pointer-events-none flex justify-between px-4 sm:px-8 text-[8px] sm:text-[9px] font-mono-technical text-base-400 select-none">
            {config.rulerMeasurementText
              ? config.rulerMeasurementText.split("|").map((part, idx) => (
                <span key={idx} className={idx % 2 === 1 ? "hidden sm:inline" : ""}>
                  {part.trim()}
                </span>
              ))
              : (
                <>
                  <span>[00CM]</span>
                  <span className="hidden sm:inline">[25CM • CHEST]</span>
                  <span>[50CM • SEAM]</span>
                  <span className="hidden sm:inline">[75CM • HEM]</span>
                  <span>[100CM]</span>
                </>
              )}
          </div>
        </>
      )}

      {/* Main Responsive Grid */}
      <div className="relative z-10 w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-stretch">

        {/* ================= LEFT APPAREL & GARMENT SHOWCASE ================= */}
        <div
          ref={visualCardRef}
          className={`lg:col-span-5 flex flex-col justify-between p-5 sm:p-8 ${cardRadiusClass} bg-base-700 text-base-100 shadow-2xl relative overflow-hidden group border border-base-600 min-h-[380px] sm:min-h-[520px] lg:min-h-[660px]`}
        >
          {/* Subtle Fabric Twill / Halftone Texture Overlay */}
          <div className="absolute inset-0 bg-halftone-lg opacity-15 pointer-events-none" />

          {/* Top Atelier Bar */}
          <div className="relative z-10 flex items-center justify-between border-b border-base-600/70 pb-3">
            <div className="flex items-center gap-2">
              <span className={`inline-block w-2 h-2 ${buttonRadiusClass} bg-emerald-400 animate-pulse`} />
              <span className="font-mono-technical text-[10px] sm:text-xs tracking-widest text-base-300 uppercase flex items-center gap-1.5">
                <Shirt className="w-3.5 h-3.5" />
                {config.atelierBadgeText || "DRAPZA ATELIER • FW26"}
              </span>
            </div>
            <span className="font-mono-technical text-[10px] tracking-wider text-base-400">
              {currentTime || config.atelierSeasonText || "ATELIER ACTIVE"}
            </span>
          </div>

          {/* Hanging Wash-Care Fabric Tag (Sways with GSAP) */}
          {config.hangtagEnabled !== false && (
            <div
              ref={hangtagRef}
              className="absolute top-14 right-6 z-20 hidden sm:flex flex-col items-center select-none cursor-pointer"
              onClick={() => playSound(1000, 0.02)}
            >
              {/* Hanging String */}
              <div className="w-[1.5px] h-6 bg-base-400/80" />
              {/* Eyelet */}
              <div className={`w-3 h-3 border border-base-400 bg-base-700 flex items-center justify-center -mb-1 z-10 ${buttonRadiusClass}`}>
                <div className="w-1.5 h-1.5 bg-base-400" />
              </div>
              {/* Woven Fabric Wash Label Card */}
              <div className={`w-32 bg-[#e8e4de] text-[#1a1a1a] p-2.5 ${buttonRadiusClass} shadow-xl border border-stone-300 font-mono-technical text-[8px] leading-tight flex flex-col gap-1 tracking-wider uppercase`}>
                <div className="flex justify-between items-center border-b border-stone-300 pb-1 font-bold text-[9px] font-display">
                  <span>{config.hangtagBrand || "DRAPZA"}</span>
                  <span>{config.hangtagLot || "LOT #042"}</span>
                </div>
                <p className="text-[7.5px] text-stone-600 font-medium">{config.hangtagFabric || "100% HEAVYWEIGHT COTTON"}</p>
                <div className="flex items-center justify-between text-[7px] text-stone-500 pt-0.5">
                  <span>{config.hangtagGsm || "480 GSM"}</span>
                  <span>{config.hangtagCare || "WASH 30°C"}</span>
                </div>
                <div className="text-[6px] tracking-widest text-stone-400 pt-0.5 border-t border-stone-200">
                  ||||||||||||||||||||||||||||||
                </div>
              </div>
            </div>
          )}

          {/* 3D Centerpiece: Interactive Apparel Showcase */}
          <div
            ref={tiltGraphicRef}
            className="relative z-10 my-auto py-4 flex flex-col items-center justify-center text-center select-none"
            style={{ transformStyle: "preserve-3d" }}
          >
            {/* Floating Garment Silhouette Cutout with Measurement Grid */}
            <div className="relative w-48 h-56 sm:w-56 sm:h-64 flex items-center justify-center mb-2">
              {/* Background Measurement Blueprint & Technical Stitch Guide */}
              <div className={`absolute inset-0 ${cardRadiusClass} border border-dashed border-base-500/40`} />
              <div className={`absolute inset-4 ${buttonRadiusClass} border border-base-500/20`} />

              {/* Garment Cutout Image */}
              <div className="relative w-full h-full flex items-center justify-center p-2">
                <Image
                  ref={garmentImgRef}
                  src={normalizeImageUrl(selectedFabric.image || "/images/drapza/products/product_1.png")}
                  alt="Drapza Garment Silhouette"
                  width={220}
                  height={240}
                  unoptimized
                  onError={handleImageFallbackError}
                  className="object-contain max-h-52 drop-shadow-[0_20px_25px_rgba(0,0,0,0.65)] filter transition-all duration-300"
                  priority
                />
              </div>

              {/* Floating Spec Badges */}
              <div className={`absolute -left-2 top-8 px-2 py-0.5 ${buttonRadiusClass} bg-base-600/90 border border-base-500/70 backdrop-blur text-base-200 font-mono-technical text-[9px] uppercase tracking-wider shadow-md`}>
                {selectedFabric.accentBadge}
              </div>
              <div className={`absolute -right-2 bottom-6 px-2 py-0.5 ${buttonRadiusClass} bg-base-100 text-base-700 font-mono-technical text-[9px] uppercase tracking-widest font-bold shadow-md`}>
                CUSTOM FIT
              </div>
            </div>

            {/* Dynamic Headline Based on Mode */}
            <div className="overflow-hidden">
              <h2
                ref={titleTextRef}
                className="font-display text-3xl sm:text-4xl md:text-5xl uppercase tracking-tight leading-none text-base-100"
              >
                {mode === "login" ? (config.loginTitle || "WARDROBE ACCESS") : (config.registerTitle || "JOIN THE COLLECTIVE")}
              </h2>
            </div>
            <p
              ref={subtitleRef}
              className="mt-2 font-mono-technical text-xs text-base-300 uppercase tracking-wider max-w-xs"
            >
              {mode === "login"
                ? (config.loginSubtitle || "Sign in to access your curated fits, order tracking, and bespoke tailoring specs.")
                : (config.registerSubtitle || "Create an identity to unlock member-only 500-piece numbered garment drops.")}
            </p>

            {/* Interactive Fabric Textile Palette Switcher */}
            <div className="mt-4 pt-3 border-t border-base-600/60 w-full">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono-technical text-[9px] text-base-400 uppercase tracking-widest flex items-center gap-1">
                  <Layers className="w-3 h-3" />
                  TEXTURE ARCHIVE:
                </span>
                <span className="font-mono-technical text-[9px] text-base-300 font-bold uppercase">
                  {selectedFabric.name}
                </span>
              </div>
              <div className="flex items-center justify-center gap-2 flex-wrap">
                {activeSwatches.map((swatch) => (
                  <button
                    key={swatch.id}
                    type="button"
                    onClick={() => handleSwatchChange(swatch)}
                    aria-label={`Select ${swatch.name} fabric texture`}
                    title={swatch.name}
                    className={`group relative flex items-center gap-1.5 px-2.5 py-1 ${buttonRadiusClass} border transition-all cursor-pointer font-mono-technical text-[10px] uppercase ${selectedFabric.id === swatch.id
                      ? "border-base-100 bg-base-600 text-base-100 shadow-md scale-105"
                      : "border-base-600 bg-base-700/60 text-base-400 hover:border-base-400"
                      }`}
                  >
                    <span
                      className={`w-2.5 h-2.5 ${buttonRadiusClass} border border-base-400/60 shrink-0`}
                      style={{ backgroundColor: swatch.colorHex }}
                    />
                    <span className="text-[9px]">{swatch.name.split(" ")[1] || swatch.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Card Footer: Garment Composition Spec */}
          <div className="relative z-10 pt-3 border-t border-base-600/70 flex items-center justify-between text-base-400 font-mono-technical text-[10px] uppercase tracking-wider">
            <div className="flex items-center gap-1.5 text-base-300">
              <Scissors className="w-3.5 h-3.5" />
              <span>{selectedFabric.weight}</span>
            </div>
            <span className="hidden sm:inline text-base-500">[{config.atelierSeasonText || "ATELIER SPEC"}]</span>
          </div>
        </div>

        {/* ================= RIGHT ATELIER FORM COLUMN ================= */}
        <div
          ref={formCardRef}
          className={`lg:col-span-7 bg-white ${cardRadiusClass} p-6 sm:p-8 md:p-10 shadow-2xl border border-base-300 flex flex-col justify-between relative overflow-hidden`}
        >
          {/* Subtle Garment Pattern Marks on Corner */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-halftone opacity-30 pointer-events-none" />

          {/* Top Notch Stitch Accent */}
          <div className={`absolute top-0 left-8 px-3 py-1 bg-neutral-100 border-b border-x border-neutral-300 ${buttonRadiusClass} text-[9px] font-mono-technical text-neutral-800 font-semibold uppercase tracking-widest hidden sm:block`}>
            {config.stitchSpecText || "STITCH SPEC: 12 SPI HEAVY SEAM"}
          </div>

          {/* Form Header & Segmented Pill Switcher */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-base-200 pt-2">
              <div>
                <span className="auth-stagger-text font-mono-technical text-[10px] sm:text-xs tracking-widest text-base-500 uppercase block mb-1">
                  {requireOtp ? "SECURITY TELEMETRY // ONE-TIME KEY" : "MEMBER PROTOCOL"}
                </span>
                <h1 className="auth-stagger-text font-display text-2xl sm:text-3xl md:text-4xl text-base-700 uppercase tracking-tight">
                  {requireOtp ? "VERIFY 6-DIGIT OTP KEY" : mode === "login" ? (config.loginFormHeading || "WARDROBE SIGN IN") : (config.registerFormHeading || "REGISTER")}
                </h1>
              </div>

              {/* Segmented Mode Switcher or Back Button */}
              {!requireOtp ? (
                <div className={`auth-stagger-text relative grid grid-cols-2 bg-base-200 p-1 ${buttonRadiusClass} w-full sm:w-[290px] border border-base-300/80 overflow-hidden select-none shrink-0`}>
                  {/* Sliding Background Indicator */}
                  <div
                    className={`absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] bg-base-700 ${buttonRadiusClass} shadow-sm pointer-events-none transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${mode === "login" ? "translate-x-0" : "translate-x-full"
                      }`}
                  />

                  <button
                    type="button"
                    onClick={() => handleModeSwitch("login")}
                    aria-label="Switch to Sign In"
                    className={`relative z-10 w-full py-2.5 px-3 text-center whitespace-nowrap text-xs font-mono-technical font-bold uppercase tracking-wider transition-colors duration-200 cursor-pointer flex items-center justify-center ${mode === "login" ? "text-base-100" : "text-base-600 hover:text-base-700"
                      }`}
                  >
                    {config.loginTabLabel || "[01] Sign In"}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleModeSwitch("signup")}
                    aria-label="Switch to Register"
                    className={`relative z-10 w-full py-2.5 px-3 text-center whitespace-nowrap text-xs font-mono-technical font-bold uppercase tracking-wider transition-colors duration-200 cursor-pointer flex items-center justify-center ${mode === "signup" ? "text-base-100" : "text-base-600 hover:text-base-700"
                      }`}
                  >
                    {config.registerTabLabel || "[02] Register"}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleBackFromOtp}
                  className={`py-2 px-3.5 ${buttonRadiusClass} border border-neutral-300 hover:border-black bg-neutral-100 hover:bg-neutral-200 font-mono-technical text-xs font-bold uppercase tracking-wider text-neutral-800 transition-colors flex items-center gap-1.5 cursor-pointer shrink-0`}
                >
                  <span>&larr; BACK</span>
                </button>
              )}
            </div>

            {/* Error Message Banner */}
            {errorMessage && (
              <div className="mt-4 p-3.5 bg-red-50 border border-red-200 border-l-4 border-l-red-600 rounded-none flex items-center gap-3 text-red-600 text-xs sm:text-sm font-mono-technical uppercase tracking-wide animate-fadeIn">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="flex-1">{errorMessage}</span>
                <button
                  type="button"
                  onClick={() => setErrorMessage("")}
                  aria-label="Dismiss error message"
                  className="text-red-400 hover:text-red-700 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Success Feedback Banner */}
            {submitStatus === "success" && (
              <div className="mt-4 p-4 bg-emerald-50 border border-emerald-300 border-l-4 border-l-emerald-600 rounded-none flex items-center gap-3 text-emerald-800 text-xs sm:text-sm font-mono-technical uppercase tracking-wide">
                <Check className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <p className="font-bold">
                    {mode === "login" ? "WARDROBE VAULT UNLOCKED" : "ACCOUNT REGISTERED"}
                  </p>
                  <p className="text-[11px] text-emerald-600">Loading custom garment catalog...</p>
                </div>
              </div>
            )}

            {/* ================= DYNAMIC FORM CONTAINER ================= */}
            {requireOtp ? (
              <form onSubmit={handleVerifyOtp} className="mt-6 space-y-5 animate-fadeIn" noValidate>
                <div className="p-4 bg-neutral-50 border border-neutral-200 text-neutral-800 text-xs sm:text-sm font-mono-technical uppercase tracking-wide space-y-1">
                  <div className="flex items-center gap-2 font-bold text-black">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>AUTHENTICATION KEY DISPATCHED</span>
                  </div>
                  <p className="text-[12px] text-neutral-600 normal-case leading-relaxed">
                    A confidential 6-digit one-time access key has been dispatched to <strong className="text-black font-semibold">{otpEmail}</strong>. Please enter the key below to authorize your session.
                  </p>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="auth-otp-input"
                    className="block font-mono-technical text-[11px] uppercase tracking-wider text-neutral-700 font-medium"
                  >
                    6-DIGIT SECURITY KEY <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      ref={otpInputRef}
                      id="auth-otp-input"
                      name="otp"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      autoComplete="one-time-code"
                      value={otpValue}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "");
                        setOtpValue(val);
                        if (errorMessage) setErrorMessage("");
                      }}
                      placeholder="••••••"
                      className={`w-full py-4 px-4 text-center font-mono-technical text-2xl sm:text-3xl font-black tracking-[0.45em] border border-black bg-white text-black focus:outline-none focus:ring-2 focus:ring-black ${buttonRadiusClass} shadow-inner`}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono-technical text-neutral-500 uppercase tracking-wider pt-1">
                    <span>STATUS: VALID FOR 10 MINUTES</span>
                    <span>CONFIDENTIAL KEY</span>
                  </div>
                </div>

                <div className="pt-2 space-y-3">
                  <button
                    type="submit"
                    disabled={isVerifyingOtp || otpValue.length < 4 || submitStatus === "success"}
                    className={`relative w-full py-4 px-6 ${buttonRadiusClass} bg-base-700 hover:bg-base-600 text-base-100 font-display text-xl sm:text-2xl uppercase tracking-wider flex items-center justify-center gap-3 transition-all duration-300 shadow-xl hover:shadow-2xl hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 cursor-pointer`}
                  >
                    {isVerifyingOtp ? (
                      <div className="flex items-center gap-2 font-mono-technical text-sm uppercase tracking-widest">
                        <span className="inline-block w-4 h-4 border-2 border-base-100 border-t-transparent rounded-full animate-spin" />
                        <span>VERIFYING ATELIER KEY...</span>
                      </div>
                    ) : submitStatus === "success" ? (
                      <div className="flex items-center gap-2 text-emerald-400">
                        <Check className="w-6 h-6" />
                        <span>ACCESS GRANTED</span>
                      </div>
                    ) : (
                      <>
                        <span>VERIFY KEY &amp; ENTER ATELIER</span>
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={handleBackFromOtp}
                      className="font-mono-technical text-xs uppercase tracking-wider text-neutral-600 hover:text-black font-semibold underline cursor-pointer"
                    >
                      &larr; EDIT CREDENTIALS
                    </button>

                    <button
                      type="button"
                      disabled={otpCountdown > 0 || isResendingOtp}
                      onClick={handleResendOtp}
                      className={`font-mono-technical text-xs uppercase tracking-wider font-semibold cursor-pointer ${otpCountdown > 0
                          ? "text-neutral-400 cursor-not-allowed"
                          : "text-black hover:underline"
                        }`}
                    >
                      {isResendingOtp
                        ? "DISPATCHING..."
                        : otpCountdown > 0
                          ? `RESEND KEY (${otpCountdown}S)`
                          : "RESEND SECURITY KEY"}
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
                <div ref={formFieldsRef} className="space-y-4">

                  {/* Full Name Field (Signup Only) */}
                  {mode === "signup" && (
                    <div className="auth-field-item space-y-1.5">
                      <label
                        htmlFor="auth-client-name"
                        className="block font-mono-technical text-[11px] uppercase tracking-wider text-neutral-700 font-medium"
                      >
                        CLIENT / OPERATOR NAME <span className="text-red-500">*</span>
                      </label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-base-400 group-focus-within:text-base-700 transition-colors">
                          <User className="w-4 h-4" />
                        </div>
                        <input
                          id="auth-client-name"
                          name="name"
                          aria-label="Client / Operator Name"
                          type="text"
                          value={name}
                          onChange={(e) => {
                            setName(e.target.value);
                            if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: "" }));
                          }}
                          placeholder="Suraj Kumar"
                          className={`w-full pl-10 pr-4 py-3 border ${buttonRadiusClass} font-body text-sm text-base-700 placeholder:text-base-400 focus:outline-none transition-all shadow-sm ${fieldErrors.name
                              ? "bg-red-50/40 border-red-400 focus:border-red-600"
                              : "bg-base-100/60 border-base-300 focus:border-base-700 focus:bg-white"
                            }`}
                        />
                      </div>
                      {fieldErrors.name && (
                        <p className="font-mono-technical text-[10px] text-red-500 uppercase tracking-wide animate-fadeIn">
                          ✕ {fieldErrors.name}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Email Field */}
                  <div className="auth-field-item space-y-1.5">
                    <label
                      htmlFor="auth-email-address"
                      className="block font-mono-technical text-[11px] uppercase tracking-wider text-neutral-700 font-medium"
                    >
                      EMAIL ADDRESS / WARDROBE HANDLE <span className="text-red-500">*</span>
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-base-400 group-focus-within:text-base-700 transition-colors">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        id="auth-email-address"
                        name="email"
                        aria-label="Email address / wardrobe handle"
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: "" }));
                        }}
                        placeholder="client@drapza.com"
                        className={`w-full pl-10 pr-4 py-3 border ${buttonRadiusClass} font-body text-sm text-base-700 placeholder:text-base-400 focus:outline-none transition-all shadow-sm ${fieldErrors.email
                            ? "bg-red-50/40 border-red-400 focus:border-red-600"
                            : "bg-base-100/60 border-base-300 focus:border-base-700 focus:bg-white"
                          }`}
                      />
                    </div>
                    {fieldErrors.email && (
                      <p className="font-mono-technical text-[10px] text-red-500 uppercase tracking-wide animate-fadeIn">
                        ✕ {fieldErrors.email}
                      </p>
                    )}
                  </div>

                  {/* Password Field */}
                  <div className="auth-field-item space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor="auth-password-key"
                        className="block font-mono-technical text-[11px] uppercase tracking-wider text-neutral-700 font-medium"
                      >
                        PASSWORD KEY <span className="text-red-500">*</span>
                      </label>
                      {mode === "login" && (
                        <button
                          type="button"
                          onClick={handleOpenForgot}
                          className="font-mono-technical text-[11px] uppercase tracking-wider text-neutral-700 hover:text-black font-medium transition-colors underline cursor-pointer"
                        >
                          LOST PASSKEY?
                        </button>
                      )}
                    </div>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-base-400 group-focus-within:text-base-700 transition-colors">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        id="auth-password-key"
                        name="password"
                        aria-label="Password key"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: "" }));
                        }}
                        placeholder="••••••••••••"
                        className={`w-full pl-10 pr-11 py-3 border ${buttonRadiusClass} font-body text-sm text-base-700 placeholder:text-base-400 focus:outline-none transition-all shadow-sm ${fieldErrors.password
                            ? "bg-red-50/40 border-red-400 focus:border-red-600"
                            : "bg-base-100/60 border-base-300 focus:border-base-700 focus:bg-white"
                          }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? "Hide password key" : "Show password key"}
                        title={showPassword ? "Hide password key" : "Show password key"}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-base-400 hover:text-base-700 transition-colors cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {fieldErrors.password && (
                      <p className="font-mono-technical text-[10px] text-red-500 uppercase tracking-wide animate-fadeIn">
                        ✕ {fieldErrors.password}
                      </p>
                    )}
                  </div>

                  {/* Password Strength Indicator (Signup Only) */}
                  {mode === "signup" && password.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-[10px] font-mono-technical uppercase tracking-wider">
                        <span className="text-base-500">SEAM ENCRYPTION STRENGTH:</span>
                        <span className={`font-bold ${getStrengthLabel().color}`}>
                          {getStrengthLabel().text}
                        </span>
                      </div>
                      <div className={`w-full h-1.5 bg-base-200 ${buttonRadiusClass} overflow-hidden`}>
                        <div
                          ref={strengthBarRef}
                          className={`h-full transition-colors duration-300 ${getStrengthLabel().bg}`}
                          style={{ width: `${strengthScore}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Confirm Password Field (Signup Only) */}
                  {mode === "signup" && (
                    <div className="auth-field-item space-y-1.5">
                      <label
                        htmlFor="auth-confirm-password-key"
                        className="block font-mono-technical text-[11px] uppercase tracking-wider text-neutral-700 font-medium"
                      >
                        CONFIRM PASSWORD KEY <span className="text-red-500">*</span>
                      </label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-base-400 group-focus-within:text-base-700 transition-colors">
                          <KeyRound className="w-4 h-4" />
                        </div>
                        <input
                          id="auth-confirm-password-key"
                          name="confirmPassword"
                          aria-label="Confirm password key"
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => {
                            setConfirmPassword(e.target.value);
                            if (fieldErrors.confirmPassword) setFieldErrors((prev) => ({ ...prev, confirmPassword: "" }));
                          }}
                          placeholder="••••••••••••"
                          className={`w-full pl-10 pr-11 py-3 border ${buttonRadiusClass} font-body text-sm text-base-700 placeholder:text-base-400 focus:outline-none transition-all shadow-sm ${fieldErrors.confirmPassword
                              ? "bg-red-50/40 border-red-400 focus:border-red-600"
                              : "bg-base-100/60 border-base-300 focus:border-base-700 focus:bg-white"
                            }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          aria-label={showConfirmPassword ? "Hide confirm password key" : "Show confirm password key"}
                          title={showConfirmPassword ? "Hide confirm password key" : "Show confirm password key"}
                          className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-base-400 hover:text-base-700 transition-colors cursor-pointer"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {fieldErrors.confirmPassword && (
                        <p className="font-mono-technical text-[10px] text-red-500 uppercase tracking-wide animate-fadeIn">
                          ✕ {fieldErrors.confirmPassword}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Auxiliary Options & Member Perks Checkbox */}
                  {mode === "login" ? (
                    <div className="auth-field-item flex items-center justify-between pt-1">
                      <label
                        htmlFor="auth-remember-me"
                        className="flex items-center gap-2 cursor-pointer select-none"
                      >
                        <input
                          id="auth-remember-me"
                          name="rememberMe"
                          aria-label="Remember hardware atelier session"
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => {
                            setRememberMe(e.target.checked);
                            playSound(800, 0.02);
                          }}
                          className={`w-4 h-4 ${buttonRadiusClass} border-base-300 text-base-700 focus:ring-base-700 accent-base-700`}
                        />
                        <span className="font-mono-technical text-xs text-neutral-800 font-medium uppercase tracking-wide">
                          REMEMBER HARDWARE / ATELIER SESSION
                        </span>
                      </label>
                    </div>
                  ) : (
                    <div className="auth-field-item space-y-1 pt-1">
                      <div className="flex items-start gap-2">
                        <input
                          type="checkbox"
                          id="terms"
                          name="terms"
                          aria-label="Agree to Drapza Atelier Manifesto, Fit Vault Terms and Privacy Policy"
                          checked={agreeTerms}
                          onChange={(e) => {
                            setAgreeTerms(e.target.checked);
                            if (fieldErrors.agreeTerms) setFieldErrors((prev) => ({ ...prev, agreeTerms: "" }));
                            playSound(800, 0.02);
                          }}
                          className={`mt-0.5 w-4 h-4 ${buttonRadiusClass} border-base-300 text-base-700 focus:ring-base-700 accent-base-700 cursor-pointer`}
                        />
                        <label
                          htmlFor="terms"
                          className="font-mono-technical text-[11px] text-neutral-700 font-medium uppercase tracking-wide leading-tight cursor-pointer select-none"
                        >
                          {config.termsText ? (
                            <span>{config.termsText}</span>
                          ) : (
                            <>
                              I agree to the{" "}
                              <a
                                href={config.termsLinkUrl || "/terms"}
                                target="_blank"
                                rel="noreferrer"
                                className="underline text-black font-semibold hover:text-neutral-600"
                              >
                                Drapza Atelier Manifesto
                              </a>
                              , Fit Vault Terms &amp; Privacy Policy.
                            </>
                          )}
                        </label>
                      </div>
                      {fieldErrors.agreeTerms && (
                        <p className="font-mono-technical text-[10px] text-red-500 uppercase tracking-wide animate-fadeIn pl-6">
                          ✕ {fieldErrors.agreeTerms}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Submit Action Button with Laser Scan & Audio FX */}
                  <div className="auth-field-item pt-3">
                    <button
                      type="submit"
                      disabled={isSubmitting || submitStatus === "success"}
                      className={`relative w-full py-4 px-6 ${buttonRadiusClass} bg-base-700 hover:bg-base-600 text-base-100 font-display text-xl sm:text-2xl uppercase tracking-wider flex items-center justify-center gap-3 transition-all duration-300 shadow-xl hover:shadow-2xl hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-75 cursor-pointer overflow-hidden group`}
                    >
                      {/* Laser scanning beam */}
                      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />

                      {isSubmitting ? (
                        <div className="flex items-center gap-2 font-mono-technical text-sm uppercase tracking-widest">
                          <span className="inline-block w-4 h-4 border-2 border-base-100 border-t-transparent rounded-full animate-spin" />
                          <span>PROCESSING GARMENT ACCESS...</span>
                        </div>
                      ) : submitStatus === "success" ? (
                        <div className="flex items-center gap-2 text-emerald-400">
                          <Check className="w-6 h-6" />
                          <span>ACCESS GRANTED</span>
                        </div>
                      ) : (
                        <>
                          <span>
                            {mode === "login"
                              ? (config.loginButtonText || "ENTER WARDROBE VAULT")
                              : (config.registerButtonText || "REGISTER")}
                          </span>
                          <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1.5" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>

          {/* Social & Passkey Access Options */}
          {!requireOtp && config.enableGoogleLogin !== false && (
            <div className="mt-8 pt-6 border-t border-dashed border-base-300">
              <div className="flex items-center justify-center relative mb-4">
                <span className="bg-white px-3 font-mono-technical text-[10px] uppercase tracking-widest text-base-400 flex items-center gap-1.5">
                  <Tag className="w-3 h-3" />
                  OR CONTINUE WITH GOOGLE
                </span>
              </div>

              {/* Google SSO */}
              <div className="w-full">
                <button
                  type="button"
                  aria-label="Continue with Google authentication"
                  disabled={isGoogleLoading || isSubmitting || submitStatus === "success"}
                  onClick={handleGoogleLogin}
                  className={`w-full flex items-center justify-center gap-3 py-3.5 px-4 ${buttonRadiusClass} border border-base-300 hover:border-base-700 bg-base-100/60 hover:bg-base-200/80 transition-all font-mono-technical text-xs sm:text-sm font-bold uppercase tracking-wider text-base-700 cursor-pointer shadow-sm group disabled:opacity-60 disabled:cursor-not-allowed`}
                >
                  {isGoogleLoading ? (
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-base-700 border-t-transparent rounded-full animate-spin" />
                      <span>AUTHENTICATING VIA GOOGLE POPUP...</span>
                    </div>
                  ) : (
                    <>
                      <svg className="w-4 h-4 shrink-0 fill-current" viewBox="0 0 24 24">
                        <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
                      </svg>
                      <span>{config.googleButtonText || "Continue with Google"}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Member Atelier Perks Callout */}
              {config.memberPerksEnabled !== false && (
                <div className={`mt-6 p-3 bg-neutral-100 ${buttonRadiusClass} border border-neutral-300 flex items-center justify-between text-[11px] font-mono-technical uppercase tracking-wider text-neutral-800 font-semibold`}>
                  <div className="flex items-center gap-2">
                    <PackageCheck className="w-4 h-4 text-black shrink-0" />
                    <span>{config.memberPerksText || "MEMBER PRIVILEGE: BESPOKE SIZING & EARLY LIMITED DROPS"}</span>
                  </div>
                  <span className="font-bold text-black hidden sm:inline">{config.memberPerksBadge || "[ATELIER VIP]"}</span>
                </div>
              )}
            </div>
          )}

          {config.enableGoogleLogin === false && config.memberPerksEnabled !== false && (
            <div className="mt-8 pt-6 border-t border-dashed border-base-300">
              <div className={`p-3 bg-neutral-100 ${buttonRadiusClass} border border-neutral-300 flex items-center justify-between text-[11px] font-mono-technical uppercase tracking-wider text-neutral-800 font-semibold`}>
                <div className="flex items-center gap-2">
                  <PackageCheck className="w-4 h-4 text-black shrink-0" />
                  <span>{config.memberPerksText || "MEMBER PRIVILEGE: BESPOKE SIZING & EARLY LIMITED DROPS"}</span>
                </div>
                <span className="font-bold text-black hidden sm:inline">{config.memberPerksBadge || "[ATELIER VIP]"}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ================= FORGOT PASSWORD MODAL ================= */}
      {forgotPasswordOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            ref={modalBackdropRef}
            onClick={handleCloseForgot}
            className="absolute inset-0 bg-base-700/80 backdrop-blur-md opacity-0 transition-opacity"
          />

          <div
            ref={modalRef}
            className={`relative z-10 w-full max-w-md bg-white ${cardRadiusClass} p-6 sm:p-8 shadow-2xl border border-base-300`}
          >
            <div className="flex items-center justify-between border-b border-base-200 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-base-700" />
                <h3 className="font-display text-2xl text-base-700 uppercase tracking-tight">
                  RECOVER PASSKEY
                </h3>
              </div>
              <button
                type="button"
                onClick={handleCloseForgot}
                aria-label="Close passkey recovery modal"
                className={`p-1.5 ${buttonRadiusClass} hover:bg-base-200 text-base-500 hover:text-base-700 transition-colors cursor-pointer`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {forgotSent ? (
              <div className="py-6 text-center space-y-3">
                <div className={`w-12 h-12 ${buttonRadiusClass} bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-300`}>
                  <Check className="w-6 h-6" />
                </div>
                <h4 className="font-display text-xl uppercase tracking-tight text-base-700">
                  RESET LINK DISPATCHED
                </h4>
                <p className="font-mono-technical text-xs text-base-500 uppercase tracking-wider">
                  Verification sent to <strong>{forgotEmail}</strong>. Follow the secure link to update your passkey.
                </p>
                <button
                  type="button"
                  onClick={handleCloseForgot}
                  className={`mt-4 w-full py-3 bg-base-700 text-base-100 ${buttonRadiusClass} font-display text-lg uppercase tracking-wider hover:bg-base-600 cursor-pointer`}
                >
                  RETURN TO LOGIN
                </button>
              </div>
            ) : (
              <form onSubmit={handleSendForgot} className="space-y-4" noValidate>
                <p className="font-mono-technical text-xs text-neutral-700 font-medium uppercase tracking-wider">
                  Enter your registered Drapza email address. A one-time cryptographic reset token will be transmitted.
                </p>
                <div className="space-y-1.5">
                  <label
                    htmlFor="forgot-password-email"
                    className="block font-mono-technical text-[11px] uppercase tracking-wider text-neutral-700 font-medium"
                  >
                    EMAIL IDENTIFIER
                  </label>
                  <input
                    id="forgot-password-email"
                    name="forgotEmail"
                    aria-label="Email identifier for password recovery"
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="client@drapza.com"
                    className={`w-full px-4 py-3 bg-white border border-neutral-300 ${buttonRadiusClass} font-body text-sm text-black placeholder:text-neutral-500 focus:outline-none focus:border-black`}
                  />
                </div>
                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={handleCloseForgot}
                    className={`flex-1 py-3 border border-neutral-300 ${buttonRadiusClass} font-mono-technical text-xs uppercase tracking-wider text-neutral-800 font-semibold hover:bg-neutral-100 cursor-pointer`}
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    className={`flex-1 py-3 bg-base-700 hover:bg-base-600 text-base-100 ${buttonRadiusClass} font-display text-lg uppercase tracking-wider cursor-pointer`}
                  >
                    SEND LINK
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
