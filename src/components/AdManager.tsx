import React, { useState } from "react";
import {
  Megaphone,
  Plus,
  Search,
  Eye,
  MousePointerClick,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
  ShieldAlert,
  ExternalLink,
  Phone,
  MessageSquare,
  Calendar,
  Layers,
  Sparkles,
  Info,
  X,
  FileCheck,
  Building2,
  Tag,
  Clock,
  Filter,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { Advertisement, AdCategory, AdLocation } from "../types";

const ALL_LOCATIONS: { id: AdLocation; label: string }[] = [
  { id: "dashboard_banner", label: "Dashboard Top Banner" },
  { id: "dashboard_between_cards", label: "Between Dashboard Cards" },
  { id: "invoice_screen", label: "Invoice Screen" },
  { id: "quotation_screen", label: "Quotation Screen" },
  { id: "challan_screen", label: "Delivery Challan Screen" },
  { id: "purchase_screen", label: "Purchase Order Screen" },
  { id: "product_screen", label: "Product & Inventory Screen" },
  { id: "reports_screen", label: "Reports Screen" },
  { id: "login_welcome_screen", label: "Login / Welcome Screen" },
  { id: "bottom_banner", label: "Global Bottom Banner" },
];

const ALL_CATEGORIES: AdCategory[] = [
  "Offers & Discounts",
  "B2B Supplies & Raw Materials",
  "Machinery & Equipment",
  "Software & Services",
  "Logistics & Transport",
  "Financial & Banking",
  "Events & Trade Fairs",
  "General Business",
];

const PRESET_BANNER_IMAGES = [
  {
    name: "Business Finance & Loan",
    url: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=600&auto=format&fit=crop&q=80",
  },
  {
    name: "POS Soundbox & Hardware",
    url: "https://images.unsplash.com/photo-1556742049-0a67daf40026?w=600&auto=format&fit=crop&q=80",
  },
  {
    name: "Factory Raw Materials",
    url: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&auto=format&fit=crop&q=80",
  },
  {
    name: "Logistics & Transport Truck",
    url: "https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=600&auto=format&fit=crop&q=80",
  },
  {
    name: "Office Software & Tech",
    url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&auto=format&fit=crop&q=80",
  },
];

export const AdManager: React.FC = () => {
  const {
    advertisements,
    addAdvertisement,
    updateAdvertisement,
    deleteAdvertisement,
    toggleAdStatus,
    adClickLogs,
    showToast,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState<string>("all");

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<Advertisement | null>(null);
  const [previewAd, setPreviewAd] = useState<Advertisement | null>(null);
  const [viewAnalyticsAd, setViewAnalyticsAd] = useState<Advertisement | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [category, setCategory] = useState<AdCategory>("Offers & Discounts");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 365 * 86400000).toISOString().split("T")[0]
  );
  const [displayLocations, setDisplayLocations] = useState<AdLocation[]>([
    "dashboard_banner",
    "bottom_banner",
  ]);
  const [displayFrequency, setDisplayFrequency] = useState<"always" | "once_per_session" | "hourly">(
    "always"
  );
  const [isActive, setIsActive] = useState(true);
  const [priority, setPriority] = useState<number>(1);

  // Legal & Compliance fields
  const [advertiserName, setAdvertiserName] = useState("");
  const [advertiserContact, setAdvertiserContact] = useState("");
  const [permissionReference, setPermissionReference] = useState("");
  const [campaignAgreementNo, setCampaignAgreementNo] = useState("");
  const [hasLegalAuthorization, setHasLegalAuthorization] = useState(false);

  // Calculate High-level Analytics
  const totalAds = advertisements.length;
  const activeAdsCount = advertisements.filter((a) => a.isActive).length;
  const totalImpressions = advertisements.reduce((acc, a) => acc + a.impressions, 0);
  const totalClicks = advertisements.reduce((acc, a) => acc + a.clicks, 0);
  const avgCtr =
    totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : "0.00";

  // Open Form for Adding
  const handleOpenAdd = () => {
    setEditingAd(null);
    setTitle("");
    setCompanyName("");
    setDescription("");
    setImageUrl(PRESET_BANNER_IMAGES[0].url);
    setContactNumber("");
    setWebsiteUrl("");
    setWhatsappNumber("");
    setCategory("Offers & Discounts");
    setStartDate(new Date().toISOString().split("T")[0]);
    setEndDate(new Date(Date.now() + 365 * 86400000).toISOString().split("T")[0]);
    setDisplayLocations(["dashboard_banner", "bottom_banner"]);
    setDisplayFrequency("always");
    setIsActive(true);
    setPriority(1);
    setAdvertiserName("");
    setAdvertiserContact("");
    setPermissionReference("");
    setCampaignAgreementNo("");
    setHasLegalAuthorization(false);
    setIsModalOpen(true);
  };

  // Open Form for Editing
  const handleOpenEdit = (ad: Advertisement) => {
    setEditingAd(ad);
    setTitle(ad.title);
    setCompanyName(ad.companyName);
    setDescription(ad.description);
    setImageUrl(ad.imageUrl);
    setContactNumber(ad.contactNumber || "");
    setWebsiteUrl(ad.websiteUrl || "");
    setWhatsappNumber(ad.whatsappNumber || "");
    setCategory(ad.category);
    setStartDate(ad.startDate);
    setEndDate(ad.endDate);
    setDisplayLocations(ad.displayLocations || ["dashboard_banner"]);
    setDisplayFrequency(ad.displayFrequency || "always");
    setIsActive(ad.isActive);
    setPriority(ad.priority || 1);
    setAdvertiserName(ad.advertiserName || "");
    setAdvertiserContact(ad.advertiserContact || "");
    setPermissionReference(ad.permissionReference || "");
    setCampaignAgreementNo(ad.campaignAgreementNo || "");
    setHasLegalAuthorization(ad.hasLegalAuthorization || false);
    setIsModalOpen(true);
  };

  const handleSaveAd = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !companyName.trim() || !description.trim()) {
      showToast("Please fill in Title, Company Name, and Description", "error");
      return;
    }

    if (displayLocations.length === 0) {
      showToast("Please select at least 1 target display location", "error");
      return;
    }

    if (!hasLegalAuthorization) {
      showToast(
        "Legal confirmation is required! Please confirm that you have permission/authorization to publish this ad.",
        "error"
      );
      return;
    }

    if (editingAd) {
      updateAdvertisement({
        ...editingAd,
        title,
        companyName,
        description,
        imageUrl: imageUrl || PRESET_BANNER_IMAGES[0].url,
        contactNumber,
        websiteUrl,
        whatsappNumber,
        category,
        startDate,
        endDate,
        displayLocations,
        displayFrequency,
        isActive,
        priority,
        advertiserName: advertiserName || companyName,
        advertiserContact,
        permissionReference,
        campaignAgreementNo,
        hasLegalAuthorization,
      });
    } else {
      addAdvertisement({
        title,
        companyName,
        description,
        imageUrl: imageUrl || PRESET_BANNER_IMAGES[0].url,
        contactNumber,
        websiteUrl,
        whatsappNumber,
        category,
        startDate,
        endDate,
        displayLocations,
        displayFrequency,
        isActive,
        priority,
        advertiserName: advertiserName || companyName,
        advertiserContact,
        permissionReference,
        campaignAgreementNo,
        hasLegalAuthorization,
      });
    }

    setIsModalOpen(false);
  };

  const toggleLocationSelect = (locId: AdLocation) => {
    if (displayLocations.includes(locId)) {
      if (displayLocations.length === 1) {
        showToast("At least 1 location required", "warning");
        return;
      }
      setDisplayLocations(displayLocations.filter((l) => l !== locId));
    } else {
      setDisplayLocations([...displayLocations, locId]);
    }
  };

  // Filtered Advertisements
  const filteredAds = advertisements.filter((ad) => {
    const matchesSearch =
      ad.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ad.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ad.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all"
        ? true
        : statusFilter === "active"
        ? ad.isActive
        : !ad.isActive;

    const matchesCategory =
      categoryFilter === "all" ? true : ad.category === categoryFilter;

    const matchesLocation =
      locationFilter === "all"
        ? true
        : ad.displayLocations.includes(locationFilter as AdLocation);

    return matchesSearch && matchesStatus && matchesCategory && matchesLocation;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2.5 rounded-2xl bg-amber-500 text-white shadow-lg shadow-amber-500/20">
              <Megaphone className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Public Advertisement Manager
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Create, schedule, and track sponsored banners across all app screens with legal compliance
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-lg shadow-amber-500/25 transition-all active:scale-95 cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          <span>Add New Advertisement</span>
        </button>
      </div>

      {/* Admin Disclaimer & Compliance Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/5 border border-amber-500/30 text-xs space-y-2">
        <div className="flex items-start gap-2.5 text-amber-800 dark:text-amber-300 font-bold">
          <ShieldAlert className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <span>Legal & Compliance Disclaimer for App Owner / Administrator:</span>
        </div>
        <p className="text-slate-600 dark:text-slate-300 leading-relaxed pl-6">
          "The app owner is responsible for ensuring that advertisements published through this system comply with applicable laws, intellectual-property rights, advertising rules, platform policies, and any agreement with the advertiser. The system provides the technical ability to display ads, but only advertisements with verified legal permissions should be activated."
        </p>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
            <Megaphone className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Campaigns</div>
            <div className="text-xl font-black text-slate-900 dark:text-white mt-0.5">{totalAds}</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Active Ads</div>
            <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
              {activeAdsCount}
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
          <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
            <Eye className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Impressions</div>
            <div className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
              {totalImpressions.toLocaleString("en-IN")}
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
            <MousePointerClick className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Clicks (CTR: {avgCtr}%)
            </div>
            <div className="text-xl font-black text-amber-600 dark:text-amber-400 mt-0.5">
              {totalClicks.toLocaleString("en-IN")}
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search bar */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search ad by title, company, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 w-full md:w-auto">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === "all"
                  ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              }`}
            >
              All ({totalAds})
            </button>
            <button
              onClick={() => setStatusFilter("active")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === "active"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              }`}
            >
              Active ({activeAdsCount})
            </button>
            <button
              onClick={() => setStatusFilter("inactive")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === "inactive"
                  ? "bg-rose-600 text-white shadow-sm"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              }`}
            >
              Inactive ({totalAds - activeAdsCount})
            </button>
          </div>
        </div>

        {/* Category & Location Dropdowns */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:outline-none"
            >
              <option value="all">All Categories</option>
              {ALL_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500">Target Location:</span>
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:outline-none"
            >
              <option value="all">All Screen Locations</option>
              {ALL_LOCATIONS.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Advertisements Table / List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-amber-500" />
            <span>Advertisement Campaigns ({filteredAds.length})</span>
          </h3>
        </div>

        {filteredAds.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center mx-auto">
              <Megaphone className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No Advertisements Found</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Create your first sponsored campaign or adjust filter parameters to display advertisements.
            </p>
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md"
            >
              + Add Advertisement
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="p-4">Ad Details</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Target Locations</th>
                  <th className="p-4">Schedule & Priority</th>
                  <th className="p-4 text-center">Impressions / Clicks</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                {filteredAds.map((ad) => {
                  const ctr =
                    ad.impressions > 0
                      ? ((ad.clicks / ad.impressions) * 100).toFixed(1)
                      : "0.0";

                  return (
                    <tr key={ad.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      {/* Title & Image */}
                      <td className="p-4">
                        <div className="flex items-start gap-3">
                          <img
                            src={ad.imageUrl}
                            alt={ad.title}
                            className="w-14 h-10 rounded-lg object-cover border border-slate-200 dark:border-slate-700 flex-shrink-0"
                          />
                          <div className="space-y-0.5 max-w-xs">
                            <h4 className="font-bold text-slate-900 dark:text-white line-clamp-1">
                              {ad.title}
                            </h4>
                            <p className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                              <Building2 className="w-3 h-3" />
                              <span>{ad.companyName}</span>
                            </p>
                            {ad.permissionReference && (
                              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono flex items-center gap-1">
                                <FileCheck className="w-3 h-3" />
                                <span>Lic: {ad.permissionReference}</span>
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                          {ad.category}
                        </span>
                      </td>

                      {/* Target Locations */}
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {ad.displayLocations.map((loc) => {
                            const found = ALL_LOCATIONS.find((l) => l.id === loc);
                            return (
                              <span
                                key={loc}
                                className="px-2 py-0.5 rounded text-[9px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 whitespace-nowrap"
                              >
                                {found?.label || loc}
                              </span>
                            );
                          })}
                        </div>
                      </td>

                      {/* Schedule */}
                      <td className="p-4">
                        <div className="space-y-0.5 text-[11px]">
                          <div className="flex items-center gap-1 text-slate-500">
                            <Calendar className="w-3 h-3" />
                            <span>
                              {ad.startDate} to {ad.endDate}
                            </span>
                          </div>
                          <div className="text-[10px] font-bold text-slate-400">
                            Priority: <span className="text-slate-700 dark:text-slate-200">Level {ad.priority}</span>
                          </div>
                        </div>
                      </td>

                      {/* Performance */}
                      <td className="p-4 text-center">
                        <div className="font-mono space-y-0.5">
                          <div className="text-xs font-bold text-slate-900 dark:text-white">
                            {ad.impressions.toLocaleString("en-IN")}{" "}
                            <span className="text-[10px] font-normal text-slate-400">views</span>
                          </div>
                          <div className="text-[11px] font-extrabold text-amber-600 dark:text-amber-400">
                            {ad.clicks.toLocaleString("en-IN")}{" "}
                            <span className="text-[9px] font-normal text-slate-400">clicks ({ctr}% CTR)</span>
                          </div>
                        </div>
                      </td>

                      {/* Status Toggle */}
                      <td className="p-4 text-center">
                        <button
                          onClick={() => toggleAdStatus(ad.id)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                            ad.isActive
                              ? "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-300 dark:border-slate-700"
                          }`}
                        >
                          {ad.isActive ? "ACTIVE" : "INACTIVE"}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setPreviewAd(ad)}
                            className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition-colors cursor-pointer"
                            title="Preview Ad Layout"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleOpenEdit(ad)}
                            className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 hover:bg-amber-100 transition-colors cursor-pointer"
                            title="Edit Campaign"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => deleteAdvertisement(ad.id)}
                            className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition-colors cursor-pointer"
                            title="Delete Campaign"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE / EDIT ADVERTISEMENT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500 text-white">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                    {editingAd ? "Edit Advertisement Campaign" : "Publish New Advertisement"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Set up creative banner, call-to-actions, screen placements, and legal authorization
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAd} className="space-y-6 mt-4 text-xs">
              {/* SECTION 1: CREATIVE & CONTENT */}
              <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>1. Creative & Brand Content</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 dark:text-slate-300 font-bold mb-1">
                      Advertisement Title *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Instant Business Loan up to ₹5 Lakhs"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 dark:text-slate-300 font-bold mb-1">
                      Company / Brand Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Vyapar Merchant Finance Pvt Ltd"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-300 font-bold mb-1">
                    Advertisement Description / Offer Body *
                  </label>
                  <textarea
                    required
                    rows={2}
                    placeholder="Brief highlight of the offer, product feature, or service..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 dark:text-slate-300 font-bold mb-1">
                      Category *
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as AdCategory)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-medium focus:outline-none"
                    >
                      {ALL_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 dark:text-slate-300 font-bold mb-1">
                      Banner Image URL
                    </label>
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/..."
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-medium focus:outline-none"
                    />
                  </div>
                </div>

                {/* Preset Banner Selector */}
                <div>
                  <span className="block text-[11px] font-bold text-slate-500 mb-1.5">
                    Or Select High-Quality Stock Banner Template:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {PRESET_BANNER_IMAGES.map((preset) => (
                      <button
                        type="button"
                        key={preset.name}
                        onClick={() => setImageUrl(preset.url)}
                        className={`p-1.5 rounded-xl border text-left transition-all cursor-pointer ${
                          imageUrl === preset.url
                            ? "border-amber-500 bg-amber-50 dark:bg-amber-950/60 ring-2 ring-amber-500/20"
                            : "border-slate-200 dark:border-slate-700 hover:border-slate-300"
                        }`}
                      >
                        <img
                          src={preset.url}
                          alt={preset.name}
                          className="w-full h-10 object-cover rounded-lg mb-1"
                        />
                        <span className="text-[9px] font-bold text-slate-700 dark:text-slate-300 line-clamp-1">
                          {preset.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* SECTION 2: CALL TO ACTION BUTTONS */}
              <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm">
                  <ExternalLink className="w-4 h-4 text-blue-500" />
                  <span>2. Call-To-Action Links & Contact Actions</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-600 dark:text-slate-300 font-bold mb-1 flex items-center gap-1">
                      <ExternalLink className="w-3.5 h-3.5 text-blue-500" />
                      <span>Website / Landing Page URL</span>
                    </label>
                    <input
                      type="text"
                      placeholder="https://example.com/offer"
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-medium focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 dark:text-slate-300 font-bold mb-1 flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
                      <span>WhatsApp Contact Number</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 919820011223"
                      value={whatsappNumber}
                      onChange={(e) => setWhatsappNumber(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-medium focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 dark:text-slate-300 font-bold mb-1 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-purple-500" />
                      <span>Direct Phone Call Number</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. +91 98200 11223"
                      value={contactNumber}
                      onChange={(e) => setContactNumber(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-medium focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: PLACEMENT & SCHEDULING */}
              <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm">
                  <Layers className="w-4 h-4 text-purple-500" />
                  <span>3. Screen Placement & Campaign Schedule</span>
                </h4>

                <div>
                  <label className="block text-slate-600 dark:text-slate-300 font-bold mb-2">
                    Target Display Locations in App *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {ALL_LOCATIONS.map((loc) => {
                      const selected = displayLocations.includes(loc.id);
                      return (
                        <button
                          type="button"
                          key={loc.id}
                          onClick={() => toggleLocationSelect(loc.id)}
                          className={`p-2.5 rounded-xl text-left border flex items-center justify-between transition-all cursor-pointer ${
                            selected
                              ? "bg-purple-50 dark:bg-purple-950/60 border-purple-500 text-purple-900 dark:text-purple-200 font-bold"
                              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                          }`}
                        >
                          <span className="text-[11px]">{loc.label}</span>
                          {selected && <CheckCircle2 className="w-4 h-4 text-purple-600 flex-shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div>
                    <label className="block text-slate-600 dark:text-slate-300 font-bold mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      required
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-medium focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 dark:text-slate-300 font-bold mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      required
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-medium focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 dark:text-slate-300 font-bold mb-1">
                      Priority Rank (1 = Top)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={priority}
                      onChange={(e) => setPriority(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-medium focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 4: LEGAL & COMPLIANCE (MANDATORY) */}
              <div className="space-y-3 p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-800/60">
                <h4 className="font-bold text-amber-900 dark:text-amber-300 flex items-center gap-2 text-sm">
                  <ShieldAlert className="w-4 h-4 text-amber-500" />
                  <span>4. Legal Authorization & Compliance Records</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                      Advertiser Legal Entity Name
                    </label>
                    <input
                      type="text"
                      placeholder="Legal company or individual name"
                      value={advertiserName}
                      onChange={(e) => setAdvertiserName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-medium focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                      Advertiser Contact Email / Phone
                    </label>
                    <input
                      type="text"
                      placeholder="Contact details for audit trail"
                      value={advertiserContact}
                      onChange={(e) => setAdvertiserContact(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-medium focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                      Permission / Licence Reference No.
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. AUTH-2026-0891"
                      value={permissionReference}
                      onChange={(e) => setPermissionReference(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-medium focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                      Campaign Agreement Reference No.
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. AGR-2026-PROMO-01"
                      value={campaignAgreementNo}
                      onChange={(e) => setCampaignAgreementNo(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-medium focus:outline-none"
                    />
                  </div>
                </div>

                {/* MANDATORY LEGAL CONFIRMATION CHECKBOX */}
                <div className="pt-2">
                  <label className="flex items-start gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800 cursor-pointer">
                    <input
                      type="checkbox"
                      required
                      checked={hasLegalAuthorization}
                      onChange={(e) => setHasLegalAuthorization(e.target.checked)}
                      className="mt-0.5 rounded text-amber-500 focus:ring-amber-500 w-4 h-4"
                    />
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-snug">
                      "I confirm that I have the necessary permission, authorization, licence, or other legal right to publish and display this advertisement and its content."
                    </span>
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
                >
                  {editingAd ? "Save Changes" : "Publish Advertisement"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AD PREVIEW MODAL */}
      {previewAd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Live Preview — {previewAd.title}
                </h3>
              </div>

              <button
                onClick={() => setPreviewAd(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Banner Layout Preview */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-blue-500/10 border border-amber-500/30 shadow-md">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <img
                    src={previewAd.imageUrl}
                    alt={previewAd.title}
                    className="w-16 h-12 rounded-xl object-cover border border-amber-300 shadow-sm flex-shrink-0"
                  />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500 text-white">
                        SPONSORED
                      </span>
                      <span className="text-[11px] font-extrabold text-amber-700 dark:text-amber-300">
                        {previewAd.companyName}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {previewAd.title}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 line-clamp-2">
                      {previewAd.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                  {previewAd.websiteUrl && (
                    <a
                      href={previewAd.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md flex items-center gap-1"
                    >
                      <span>Visit Site</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}

                  {previewAd.whatsappNumber && (
                    <a
                      href={`https://wa.me/${previewAd.whatsappNumber}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md flex items-center gap-1"
                    >
                      <span>WhatsApp</span>
                      <MessageSquare className="w-3.5 h-3.5" />
                    </a>
                  )}

                  {previewAd.contactNumber && (
                    <a
                      href={`tel:${previewAd.contactNumber}`}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 text-white text-xs font-bold shadow-md flex items-center gap-1"
                    >
                      <span>Call</span>
                      <Phone className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            </div>

            <div className="text-right pt-2">
              <button
                onClick={() => setPreviewAd(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
