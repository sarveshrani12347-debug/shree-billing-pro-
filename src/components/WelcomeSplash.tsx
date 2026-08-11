import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Building2,
  Lock,
  ArrowRight,
  ShieldCheck,
  Zap,
  Mail,
  User as UserIcon,
  Phone,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  KeyRound,
  RotateCcw,
  Megaphone,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { soundEffects } from "../utils/audio";

export const WelcomeSplash: React.FC = () => {
  const {
    isSplashOpen,
    setIsSplashOpen,
    loginWithEmail,
    signUpWithEmail,
    sendPasswordReset,
    showToast,
    currentUser,
    advertisements,
    recordAdClick,
  } = useApp();

  // Phase: true = showing 2-3s opening splash screen animation, false = auth forms (login/signup)
  const [showOpeningSplash, setShowOpeningSplash] = useState(true);

  // Mode: "login" | "signup" | "forgot"
  const [authMode, setAuthMode] = useState<"login" | "signup" | "forgot">("login");

  // Form Fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [rememberMe, setRememberMe] = useState(true);

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Banner rotation state
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const [isBannerPaused, setIsBannerPaused] = useState(false);

  // Auto-close opening splash animation after 2.5s
  useEffect(() => {
    if (!isSplashOpen) return;
    setShowOpeningSplash(true);
    const timer = setTimeout(() => {
      setShowOpeningSplash(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, [isSplashOpen]);

  // Filter advertisements for bottom banner / login welcome screen
  const filteredAds = advertisements.filter(
    (ad) =>
      ad.isActive &&
      (ad.displayLocations.includes("bottom_banner") ||
        ad.displayLocations.includes("login_welcome_screen"))
  );

  // Default fallback 2 promotional banners if none configured or inactive
  const defaultBanners = [
    {
      id: "promo-banner-1",
      title: "Shree Billing Pro+ — Special Upgrade & GST Auto-Filing Offer",
      companyName: "Shree Billing Pro+ Enterprise",
      description: "Upgrade now to unlock Multi-User Staff Access, E-Way Bill Auto Generation & Real-time Cloud Backup.",
      imageUrl: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=600&auto=format&fit=crop&q=80",
      websiteUrl: "https://example.com/vyapar-loan",
      cta: "Special Offer →",
    },
    {
      id: "promo-banner-2",
      title: "Smart UPI Soundbox & POS Thermal Printer Bundle",
      companyName: "Shree POS Technologies",
      description: "Get instant voice payment alerts in Hindi, English & Gujarati with 48-hr battery backup.",
      imageUrl: "https://images.unsplash.com/photo-1556742049-0a67daf40026?w=600&auto=format&fit=crop&q=80",
      websiteUrl: "https://example.com/shree-pos",
      cta: "Explore POS →",
    },
  ];

  const activeBanners = filteredAds.length > 0 ? filteredAds : defaultBanners;

  // Banner auto rotation interval (3.5 seconds)
  useEffect(() => {
    if (activeBanners.length <= 1 || isBannerPaused) return;

    const interval = setInterval(() => {
      setActiveBannerIndex((prev) => (prev + 1) % activeBanners.length);
    }, 3500);

    return () => clearInterval(interval);
  }, [activeBanners.length, isBannerPaused]);

  if (!isSplashOpen && currentUser) return null;

  // Clear messages when switching tabs
  const handleSwitchTab = (mode: "login" | "signup" | "forgot") => {
    setAuthMode(mode);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleBannerClick = (banner: any) => {
    const targetUrl = banner.websiteUrl || banner.whatsappNumber || banner.contactNumber;
    if (targetUrl) {
      if (banner.websiteUrl) {
        window.open(banner.websiteUrl, "_blank");
      } else if (banner.whatsappNumber) {
        window.open(`https://wa.me/${banner.whatsappNumber}`, "_blank");
      } else if (banner.contactNumber) {
        window.open(`tel:${banner.contactNumber}`, "_self");
      }
    }
    if (banner.id && recordAdClick) {
      recordAdClick(banner.id, "banner_click", "bottom_banner");
    }
  };

  // 1. LOGIN HANDLER
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email || !password) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    setIsSubmitting(true);
    soundEffects.playWelcomeChime();

    const res = await loginWithEmail(email, password, rememberMe);
    setIsSubmitting(false);

    if (res.success) {
      setIsSplashOpen(false);
      showToast("Logged in successfully to Billing Pro+!");
    } else {
      setErrorMessage(res.message || "Failed to log in. Please check your credentials.");
      soundEffects.playErrorSound();
    }
  };

  // 2. SIGN UP HANDLER
  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Validations
    if (!fullName.trim()) {
      setErrorMessage("Please enter your Full Name.");
      return;
    }
    if (!businessName.trim()) {
      setErrorMessage("Please enter your Business Name.");
      return;
    }
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setErrorMessage("Please enter a valid email address (e.g. name@domain.com).");
      return;
    }
    if (!mobileNumber.trim() || mobileNumber.replace(/\D/g, "").length < 10) {
      setErrorMessage("Please enter a valid 10-digit mobile phone number.");
      return;
    }
    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match. Please re-enter your password.");
      return;
    }

    setIsSubmitting(true);
    soundEffects.playWelcomeChime();

    const res = await signUpWithEmail(
      fullName,
      businessName,
      email,
      mobileNumber,
      password,
      confirmPassword
    );
    setIsSubmitting(false);

    if (res.success) {
      setIsSplashOpen(false);
      showToast(`Welcome to Billing Pro+, ${fullName}!`);
    } else {
      setErrorMessage(res.message || "Sign up failed.");
      soundEffects.playErrorSound();
    }
  };

  // 3. FORGOT PASSWORD HANDLER
  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);
    const res = await sendPasswordReset(email);
    setIsSubmitting(false);

    if (res.success) {
      setSuccessMessage(
        res.message || "Password reset email sent! Check your inbox for reset instructions."
      );
    } else {
      setErrorMessage(res.message || "Could not send reset email. Verify email address.");
      soundEffects.playErrorSound();
    }
  };

  // Demo guest bypass
  const handleGuestBypass = () => {
    soundEffects.playWelcomeChime();
    setIsSplashOpen(false);
    showToast("Entered Billing Pro+ in Demo Sandbox Mode");
  };

  // Current active banner
  const currentBanner = activeBanners[activeBannerIndex % activeBanners.length];

  // Render Bottom Red Promotional Banner
  const renderBottomRedBanner = () => {
    if (!currentBanner || activeBanners.length === 0) return null;

    return (
      <div
        onMouseEnter={() => setIsBannerPaused(true)}
        onMouseLeave={() => setIsBannerPaused(false)}
        onTouchStart={() => setIsBannerPaused(true)}
        onTouchEnd={() => setIsBannerPaused(false)}
        className="fixed bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 w-[92%] max-w-xl z-50 pointer-events-auto"
      >
        <div
          onClick={() => handleBannerClick(currentBanner)}
          className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white rounded-2xl p-2.5 sm:p-3 shadow-2xl shadow-red-950/50 border border-red-400/40 backdrop-blur-md relative overflow-hidden cursor-pointer hover:brightness-105 transition-all group"
        >
          {/* Subtle Ambient Red Glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />

          <div className="flex items-center gap-2.5 sm:gap-3.5 relative z-10">
            {/* Banner Icon / Image Thumbnail */}
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
              {currentBanner.imageUrl ? (
                <img
                  src={currentBanner.imageUrl}
                  alt={currentBanner.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Megaphone className="w-5 h-5 text-white" />
              )}
            </div>

            {/* Banner Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-white/20 text-white border border-white/30">
                  PROMO
                </span>
                <span className="text-[10px] font-bold text-red-100 truncate">
                  {currentBanner.companyName || "Billing Pro+"}
                </span>
                {activeBanners.length > 1 && (
                  <span className="ml-auto text-[9px] font-extrabold text-red-100/90 bg-red-950/40 px-1.5 py-0.5 rounded-full border border-red-400/30">
                    {activeBannerIndex + 1}/{activeBanners.length}
                  </span>
                )}
              </div>

              <h4 className="text-xs sm:text-sm font-extrabold text-white truncate mt-0.5 leading-tight">
                {currentBanner.title}
              </h4>
              <p className="text-[11px] text-red-100/90 truncate hidden sm:block">
                {currentBanner.description}
              </p>
            </div>

            {/* CTA Arrow / Controls */}
            <div className="flex items-center gap-1 shrink-0">
              {activeBanners.length > 1 && (
                <div className="hidden sm:flex items-center gap-1 mr-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveBannerIndex(
                        (prev) => (prev - 1 + activeBanners.length) % activeBanners.length
                      );
                    }}
                    className="p-1 rounded-lg bg-black/20 hover:bg-black/40 text-white transition-colors"
                    title="Previous banner"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveBannerIndex((prev) => (prev + 1) % activeBanners.length);
                    }}
                    className="p-1 rounded-lg bg-black/20 hover:bg-black/40 text-white transition-colors"
                    title="Next banner"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <div className="px-2.5 py-1.5 rounded-xl bg-white text-red-700 font-black text-[11px] shadow-sm flex items-center gap-1 group-hover:bg-red-50 transition-colors">
                <span>View</span>
                <ExternalLink className="w-3 h-3" />
              </div>
            </div>
          </div>

          {/* Dots Indicator for Multiple Banners */}
          {activeBanners.length > 1 && (
            <div className="flex items-center justify-center gap-1 mt-1.5 pt-1 border-t border-white/10">
              {activeBanners.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveBannerIndex(idx);
                  }}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    idx === activeBannerIndex ? "w-5 bg-white" : "w-1.5 bg-white/40 hover:bg-white/70"
                  }`}
                  title={`Go to banner ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <AnimatePresence mode="wait">
      {/* ---------------- MAIN SPLASH SCREEN ANIMATION ---------------- */}
      {showOpeningSplash ? (
        <motion.div
          key="splash-opening-screen"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.4 }}
          onClick={() => setShowOpeningSplash(false)}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white text-slate-900 p-6 select-none cursor-pointer"
        >
          {/* Subtle Soft Blue Background Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Center Brand Animation Box */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="text-center relative z-10 max-w-md mx-auto"
          >
            {/* Emblem / Logo Icon */}
            <div className="relative inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-blue-600 text-white shadow-2xl shadow-blue-600/40 mb-6 ring-8 ring-blue-500/15">
              <Building2 className="w-10 h-10 sm:w-12 sm:h-12" />
              <motion.div
                animate={{ scale: [1, 1.25, 1], opacity: [0.3, 0.7, 0.3] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -inset-3 rounded-full bg-blue-500/20 blur-md pointer-events-none"
              />
            </div>

            {/* Main Title "Shree Billing Pro+" in Blue */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-blue-600 tracking-tight drop-shadow-xs mb-2">
              Shree Billing Pro+
            </h1>

            {/* Subtitle / Tagline */}
            <p className="text-xs sm:text-sm font-semibold text-slate-500 tracking-wide">
              Smart Invoicing, GST Billing & Multi-Device Business ERP
            </p>

            {/* Smooth Progress Line */}
            <div className="w-48 sm:w-60 h-1.5 bg-slate-100 rounded-full mx-auto mt-7 overflow-hidden border border-slate-200 shadow-inner">
              <motion.div
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 2.5, ease: "linear" }}
                className="h-full bg-blue-600 rounded-full"
              />
            </div>

            {/* Skip Option */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowOpeningSplash(false);
              }}
              className="mt-5 text-xs font-bold text-blue-600/80 hover:text-blue-700 hover:underline cursor-pointer tracking-wide flex items-center justify-center gap-1 mx-auto"
            >
              <span>Continue to Login</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </motion.div>

          {/* Bottom Red Banner during Splash Animation */}
          {renderBottomRedBanner()}
        </motion.div>
      ) : (
        /* ---------------- LOGIN / SIGN UP / FORGOT PASSWORD SCREEN ---------------- */
        <motion.div
          key="auth-forms-screen"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, y: "-100%" }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950 text-slate-100 overflow-y-auto p-4 sm:p-6 pb-24 sm:pb-28"
        >
          {/* Decorative Gradients */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/40 via-slate-950 to-slate-950 pointer-events-none" />
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative w-full max-w-xl mx-auto my-auto z-10 py-4">
            <motion.div
              initial={{ scale: 0.96, y: 12 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-slate-900/95 border border-slate-800 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 shadow-2xl shadow-indigo-950/60"
            >
              {/* Header / Billing Pro+ Branding */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-purple-600 text-white shadow-xl shadow-indigo-600/30 mb-3 ring-8 ring-indigo-500/10">
                  <Building2 className="w-8 h-8" />
                </div>

                <div className="flex items-center justify-center gap-2 mb-1.5">
                  <span className="px-3 py-0.5 rounded-full text-[11px] font-black uppercase tracking-widest bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>Shree Billing Pro+</span>
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold text-slate-400 bg-slate-800/80 border border-slate-700">
                    Firebase Cloud Auth
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Welcome to Billing Pro+
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-md mx-auto">
                  Secure Invoicing, Stock Management, Cashbook & Multi-Device Cloud Sync
                </p>
              </div>

              {/* Auth Mode Toggle Tabs (LOGIN vs SIGN UP) */}
              {authMode !== "forgot" && (
                <div className="flex bg-slate-800/90 p-1.5 rounded-2xl border border-slate-700/80 mb-6 gap-1">
                  <button
                    type="button"
                    onClick={() => handleSwitchTab("login")}
                    className={`flex-1 py-2.5 rounded-xl font-extrabold text-xs transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      authMode === "login"
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                        : "text-slate-400 hover:text-white hover:bg-slate-700/50"
                    }`}
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Login</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSwitchTab("signup")}
                    className={`flex-1 py-2.5 rounded-xl font-extrabold text-xs transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      authMode === "signup"
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                        : "text-slate-400 hover:text-white hover:bg-slate-700/50"
                    }`}
                  >
                    <UserIcon className="w-3.5 h-3.5" />
                    <span>Sign Up</span>
                  </button>
                </div>
              )}

              {/* Error Message Alert */}
              {errorMessage && (
                <div className="mb-5 p-3.5 rounded-2xl bg-rose-950/80 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-2.5 animate-fadeIn">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-bold">Authentication Notice</p>
                    <p className="mt-0.5 text-rose-300/90">{errorMessage}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setErrorMessage(null)}
                    className="text-rose-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Success Message Alert */}
              {successMessage && (
                <div className="mb-5 p-3.5 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-xs flex items-start gap-2.5 animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-bold">Success</p>
                    <p className="mt-0.5 text-emerald-300/90">{successMessage}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSuccessMessage(null)}
                    className="text-emerald-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* ---------------- LOGIN FORM ---------------- */}
              {authMode === "login" && (
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3.5 py-2.5 pl-10 rounded-xl bg-slate-800/90 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder-slate-500"
                        placeholder="owner@mybusiness.com"
                        required
                      />
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-300">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => handleSwitchTab("forgot")}
                        className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 hover:underline cursor-pointer"
                      >
                        Forgot Password?
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-3.5 py-2.5 pl-10 pr-10 rounded-xl bg-slate-800/90 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder-slate-500"
                        placeholder="••••••••"
                        required
                      />
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="text-slate-400 hover:text-slate-200 absolute right-3.5 top-3 cursor-pointer"
                        title={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Remember Me Checkbox */}
                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 font-medium">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500 accent-indigo-600 cursor-pointer"
                      />
                      <span>Remember Me on this device</span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-extrabold text-sm shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Authenticating Account...
                      </span>
                    ) : (
                      <>
                        <span>Login to Billing Pro+</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* ---------------- SIGN UP FORM ---------------- */}
              {authMode === "signup" && (
                <form onSubmit={handleSignUpSubmit} className="space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        Full Name *
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="w-full px-3.5 py-2.5 pl-10 rounded-xl bg-slate-800/90 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-500"
                          placeholder="Rajesh Kumar"
                          required
                        />
                        <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        Business Name *
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={businessName}
                          onChange={(e) => setBusinessName(e.target.value)}
                          className="w-full px-3.5 py-2.5 pl-10 rounded-xl bg-slate-800/90 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-500"
                          placeholder="Shree Traders"
                          required
                        />
                        <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        Email Address *
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full px-3.5 py-2.5 pl-10 rounded-xl bg-slate-800/90 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-500"
                          placeholder="rajesh@shreetraders.com"
                          required
                        />
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        Mobile Number *
                      </label>
                      <div className="relative">
                        <input
                          type="tel"
                          value={mobileNumber}
                          onChange={(e) => setMobileNumber(e.target.value)}
                          className="w-full px-3.5 py-2.5 pl-10 rounded-xl bg-slate-800/90 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-500"
                          placeholder="9876543210"
                          required
                        />
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        Password (min 6 chars) *
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full px-3.5 py-2.5 pl-10 pr-10 rounded-xl bg-slate-800/90 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-500"
                          placeholder="••••••••"
                          required
                        />
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                        <button
                          type="button"
                          onClick={() => setShowPassword((prev) => !prev)}
                          className="text-slate-400 hover:text-slate-200 absolute right-3.5 top-3 cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        Confirm Password *
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full px-3.5 py-2.5 pl-10 pr-10 rounded-xl bg-slate-800/90 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-500"
                          placeholder="••••••••"
                          required
                        />
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword((prev) => !prev)}
                          className="text-slate-400 hover:text-slate-200 absolute right-3.5 top-3 cursor-pointer"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 pt-1">
                    By registering, your account will be encrypted with Firebase Authentication and allocated a dedicated multi-tenant business context.
                  </p>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-extrabold text-sm shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Creating Account & Provisioning Business...
                      </span>
                    ) : (
                      <>
                        <span>Register & Create Business Account</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* ---------------- FORGOT PASSWORD FORM ---------------- */}
              {authMode === "forgot" && (
                <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                  <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-800/50 flex items-start gap-3">
                    <KeyRound className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-xs font-black text-white">Reset Password</h3>
                      <p className="text-[11px] text-indigo-200/80 mt-0.5">
                        Enter your registered account email address. We will send a secure password reset link directly to your inbox.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Registered Email Address
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3.5 py-2.5 pl-10 rounded-xl bg-slate-800/90 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-500"
                        placeholder="your-registered-email@domain.com"
                        required
                      />
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => handleSwitchTab("login")}
                      className="px-4 py-2.5 rounded-xl border border-slate-700 text-xs font-bold text-slate-300 hover:bg-slate-800 flex items-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Back to Login</span>
                    </button>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isSubmitting ? (
                        <span>Sending Reset Email...</span>
                      ) : (
                        <>
                          <Mail className="w-4 h-4" />
                          <span>Send Reset Link</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* Divider / Demo Bypass */}
              <div className="relative my-5 text-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-800" />
                </div>
                <span className="relative px-3 bg-slate-900 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Or Quick Demo Sandbox
                </span>
              </div>

              {/* Guest Sandbox Button */}
              <motion.button
                type="button"
                onClick={handleGuestBypass}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="w-full py-2.5 px-4 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-amber-500/30 text-amber-300 font-extrabold text-xs shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer group"
              >
                <Zap className="w-4 h-4 text-amber-400 fill-amber-400/30 group-hover:animate-bounce" />
                <span>⚡ Enter Guest Demo Sandbox (Explore Offline)</span>
              </motion.button>

              {/* Footer security badge */}
              <div className="mt-5 text-center flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Firebase Auth UID Security • Multi-Tenant Enterprise Isolation</span>
              </div>
            </motion.div>
          </div>

          {/* Bottom Red Banner during Auth Form View */}
          {renderBottomRedBanner()}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

