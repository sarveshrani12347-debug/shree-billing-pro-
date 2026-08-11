import React, { useEffect, useRef, useState } from "react";
import { Sparkles, ArrowRight, Zap, X, ExternalLink, MessageSquare, Phone } from "lucide-react";
import { useApp } from "../context/AppContext";
import { AdLocation } from "../types";

export const AdBanner: React.FC<{ location?: AdLocation | string }> = ({
  location = "dashboard_banner",
}) => {
  const {
    adSettings,
    advertisements,
    recordAdImpression,
    recordAdClick,
    upgradeToPremium,
  } = useApp();

  const [dismissed, setDismissed] = useState(false);
  const trackedRef = useRef<string | null>(null);

  const shouldShow = adSettings.showAds && !adSettings.isPremium && !dismissed;

  const today = new Date().toISOString().split("T")[0];

  // Map generic location names if needed
  let targetLocation: AdLocation = "dashboard_banner";
  if (location === "dashboard" || location === "dashboard_banner") targetLocation = "dashboard_banner";
  else if (location === "invoice" || location === "invoice_screen") targetLocation = "invoice_screen";
  else if (location === "quotation" || location === "quotation_screen") targetLocation = "quotation_screen";
  else if (location === "challan" || location === "challan_screen") targetLocation = "challan_screen";
  else if (location === "purchase" || location === "purchase_screen") targetLocation = "purchase_screen";
  else if (location === "product" || location === "product_screen") targetLocation = "product_screen";
  else if (location === "reports" || location === "reports_screen") targetLocation = "reports_screen";
  else if (location === "login" || location === "login_welcome_screen") targetLocation = "login_welcome_screen";
  else if (location === "between_cards" || location === "dashboard_between_cards") targetLocation = "dashboard_between_cards";
  else if (location === "bottom" || location === "bottom_banner") targetLocation = "bottom_banner";

  // Filter matching active ads
  const activeAds = advertisements.filter((ad) => {
    if (!ad.isActive) return false;
    if (ad.startDate && ad.startDate > today) return false;
    if (ad.endDate && ad.endDate < today) return false;
    if (ad.displayLocations && ad.displayLocations.length > 0) {
      return ad.displayLocations.includes(targetLocation);
    }
    return true;
  });

  // Pick top priority ad
  activeAds.sort((a, b) => (a.priority || 1) - (b.priority || 1));
  const activeAd = shouldShow ? activeAds[0] : undefined;

  useEffect(() => {
    if (shouldShow && activeAd && trackedRef.current !== activeAd.id) {
      trackedRef.current = activeAd.id;
      recordAdImpression(activeAd.id);
    }
  }, [shouldShow, activeAd, recordAdImpression]);

  if (!shouldShow || !activeAd) {
    return null;
  }

  const handleWebsiteClick = () => {
    if (!activeAd.websiteUrl) return;
    recordAdClick(activeAd.id, "website_click", targetLocation);
    window.open(activeAd.websiteUrl, "_blank", "noopener,noreferrer");
  };

  const handleWhatsappClick = () => {
    if (!activeAd.whatsappNumber) return;
    recordAdClick(activeAd.id, "whatsapp_click", targetLocation);
    window.open(`https://wa.me/${activeAd.whatsappNumber}`, "_blank", "noopener,noreferrer");
  };

  const handlePhoneClick = () => {
    if (!activeAd.contactNumber) return;
    recordAdClick(activeAd.id, "phone_call", targetLocation);
    window.location.href = `tel:${activeAd.contactNumber}`;
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-blue-500/10 border border-amber-500/30 p-4 sm:p-5 shadow-sm my-4 transition-all">
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-2 right-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
        title="Hide advertisement"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pr-6">
        <div className="flex items-start gap-3">
          <img
            src={activeAd.imageUrl}
            alt={activeAd.title}
            className="w-14 h-12 rounded-xl object-cover border border-amber-400/40 shadow-sm flex-shrink-0"
          />
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500 text-white flex items-center gap-1 shadow-xs">
                <Zap className="w-3 h-3 fill-white" />
                SPONSORED
              </span>
              <span className="text-xs font-extrabold text-amber-700 dark:text-amber-300">
                {activeAd.companyName}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 hidden sm:inline-block">
                {activeAd.category}
              </span>
            </div>
            <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-snug">
              {activeAd.title}
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 line-clamp-2">
              {activeAd.description}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {activeAd.websiteUrl && (
            <button
              onClick={handleWebsiteClick}
              className="flex-1 md:flex-initial px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Visit Link</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}

          {activeAd.whatsappNumber && (
            <button
              onClick={handleWhatsappClick}
              className="flex-1 md:flex-initial px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>WhatsApp</span>
              <MessageSquare className="w-3.5 h-3.5" />
            </button>
          )}

          {activeAd.contactNumber && (
            <button
              onClick={handlePhoneClick}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Call</span>
              <Phone className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={upgradeToPremium}
            className="px-2.5 py-2 rounded-xl bg-slate-200/80 dark:bg-slate-800/80 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-bold transition-all border border-slate-300 dark:border-slate-700 whitespace-nowrap cursor-pointer"
            title="Remove all ads for your account"
          >
            Remove Ads
          </button>
        </div>
      </div>
    </div>
  );
};
