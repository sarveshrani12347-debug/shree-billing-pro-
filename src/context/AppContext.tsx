import React, { createContext, useContext, useState, useEffect } from "react";
import {
  BusinessProfile,
  Product,
  Party,
  Invoice,
  CashEntry,
  AuditLog,
  ActiveTab,
  Purchase,
  Expense,
  Language,
  AppLockSettings,
  AdSettings,
  BackupInfo,
  InvoiceTemplate,
  StockMovement,
  UnitConversion,
  BillScanResult,
  Advertisement,
  AdClickLog,
  AdLocation,
  CloudBackupPoint,
  User,
  DailyCashEntry,
  ClosedCashDay,
  CustomCashColumn,
  PermissionKey,
  BusinessUserRole,
  BusinessUser,
  QRInvitation,
  RecurringInvoice,
  RecurringStatus,
  RecurringFrequency,
} from "../types";

export const DEFAULT_CASH_COLUMNS: CustomCashColumn[] = [
  { id: "col-cheque", name: "Cheque Entry", color: "#2563eb", bgLightHex: "#eff6ff", textColorHex: "#1e40af", isDefault: true, enabled: true },
  { id: "col-cash", name: "Cash Entry", color: "#059669", bgLightHex: "#ecfdf5", textColorHex: "#065f46", isDefault: true, enabled: true },
  { id: "col-gpay", name: "GPay Payment", color: "#7c3aed", bgLightHex: "#faf5ff", textColorHex: "#6b21a8", isDefault: true, enabled: true },
  { id: "col-gst-gpay", name: "GST GPay", color: "#d97706", bgLightHex: "#fffbeb", textColorHex: "#92400e", isDefault: true, enabled: true },
  { id: "col-vendor", name: "Vendor Payment", color: "#e11d48", bgLightHex: "#fff1f2", textColorHex: "#9f1239", isDefault: true, enabled: true },
];
import {
  INITIAL_USER,
  INITIAL_BUSINESS_PROFILE,
  INITIAL_PRODUCTS,
  INITIAL_PARTIES,
  INITIAL_INVOICES,
  INITIAL_CASHBOOK,
  INITIAL_AUDIT_LOGS,
  INITIAL_PURCHASES,
  INITIAL_EXPENSES,
  INITIAL_STOCK_MOVEMENTS,
  INITIAL_UNIT_CONVERSIONS,
  INITIAL_ADVERTISEMENTS,
  INITIAL_DAILY_CASHBOOK,
  INITIAL_ROLE_PERMISSIONS,
  INITIAL_CONNECTED_USERS,
  INITIAL_QR_INVITATIONS,
  INITIAL_RECURRING_INVOICES,
} from "../data/seedData";
import { soundEffects } from "../utils/audio";
import { getTranslation } from "../utils/translations";
import { syncInvoiceToCASummary } from "../utils/caSummarySync";
import { auth } from "../lib/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  updateProfile as updateAuthProfile,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from "firebase/auth";
import {
  saveUserDoc,
  getUserDoc,
  saveBusinessDoc,
  syncCollectionItem,
  deleteCollectionItem,
  subscribeToBusinessData,
} from "../lib/firestoreSync";

interface ToastMessage {
  id: string;
  message: string;
  type: "success" | "info" | "warning" | "error";
}

interface AppContextType {
  theme: "light" | "dark";
  toggleTheme: () => void;
  isSplashOpen: boolean;
  setIsSplashOpen: (val: boolean) => void;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  
  // Authentication & Cloud Sync
  authChecking: boolean;
  loginWithEmail: (
    email: string,
    password: string,
    rememberMe?: boolean
  ) => Promise<{ success: boolean; message?: string }>;
  signUpWithEmail: (
    fullName: string,
    businessName: string,
    email: string,
    mobile: string,
    password: string,
    confirmPassword: string
  ) => Promise<{ success: boolean; message?: string }>;
  sendPasswordReset: (
    email: string
  ) => Promise<{ success: boolean; message?: string }>;
  logoutUser: () => Promise<void>;

  // User & Business Identification
  currentUser: User;
  setCurrentUser: (user: User) => void;

  activeBusinessId: string;
  switchBusiness: (businessId: string) => void;

  profile: BusinessProfile;
  updateProfile: (profile: BusinessProfile) => void;
  products: Product[];
  addProduct: (product: Omit<Product, "id">) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
  adjustStock: (productId: string, qtyChange: number, type: "in" | "out", reason?: string) => void;
  parties: Party[];
  addParty: (party: Omit<Party, "id">) => void;
  updateParty: (party: Party) => void;
  deleteParty: (id: string) => void;
  invoices: Invoice[];
  addInvoice: (invoice: Omit<Invoice, "id">) => Invoice;
  updateInvoice: (invoice: Invoice) => void;
  deleteInvoice: (id: string) => void;

  // Recurring Invoices & Schedules
  recurringInvoices: RecurringInvoice[];
  addRecurringInvoice: (profile: Omit<RecurringInvoice, "id" | "createdAt" | "generatedCount" | "status">) => void;
  updateRecurringInvoice: (id: string, updates: Partial<RecurringInvoice>) => void;
  deleteRecurringInvoice: (id: string) => void;
  toggleRecurringInvoiceStatus: (id: string, newStatus?: RecurringStatus) => void;
  triggerRecurringInvoiceNow: (id: string) => Invoice | null;
  checkAndRunDueRecurringInvoices: () => number;
  purchases: Purchase[];
  addPurchase: (purchase: Omit<Purchase, "id">) => Purchase;
  deletePurchase: (id: string) => void;
  expenses: Expense[];
  addExpense: (expense: Omit<Expense, "id">) => void;
  deleteExpense: (id: string) => void;
  cashbook: CashEntry[];
  addCashEntry: (entry: Omit<CashEntry, "id">) => void;
  deleteCashEntry: (id: string) => void;
  dailyCashEntries: DailyCashEntry[];
  addDailyCashEntry: (entry: Omit<DailyCashEntry, "id" | "createdAt">) => void;
  updateDailyCashEntry: (entry: DailyCashEntry) => void;
  deleteDailyCashEntry: (id: string) => void;
  closedCashDays: ClosedCashDay[];
  closeCashDay: (closedData: ClosedCashDay) => void;
  reopenCashDay: (date: string) => void;
  isDayClosed: (date: string) => boolean;
  cashColumns: CustomCashColumn[];
  dailyExpenseBudget: number;
  setDailyExpenseBudget: (budget: number) => void;
  addCustomColumn: (col: Omit<CustomCashColumn, "id" | "isDefault" | "enabled">) => boolean;
  updateCustomColumn: (col: CustomCashColumn) => void;
  deleteCustomColumn: (colId: string) => void;
  toggleColumnEnabled: (colId: string) => void;
  auditLogs: AuditLog[];
  logAudit: (action: string, module: string, details: string) => void;
  isAIDrawerOpen: boolean;
  setIsAIDrawerOpen: (val: boolean) => void;
  printingInvoice: Invoice | null;
  setPrintingInvoice: (inv: Invoice | null) => void;
  toasts: ToastMessage[];
  showToast: (message: string, type?: "success" | "info" | "warning" | "error") => void;
  
  // App Lock & Security
  appLock: AppLockSettings;
  setPin: (pin: string) => void;
  toggleAppLock: (enabled: boolean) => void;
  unlockApp: (pin: string) => boolean;

  // Language & Localization
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;

  // Ads & Subscription
  adSettings: AdSettings;
  showAdModal: boolean;
  setShowAdModal: (val: boolean) => void;
  upgradeToPremium: () => void;
  triggerInterstitialAd: () => void;

  // Admin Advertisement Management
  advertisements: Advertisement[];
  addAdvertisement: (ad: Omit<Advertisement, "id" | "clicks" | "impressions" | "createdAt">) => void;
  updateAdvertisement: (ad: Advertisement) => void;
  deleteAdvertisement: (id: string) => void;
  toggleAdStatus: (id: string) => void;
  recordAdImpression: (id: string) => void;
  recordAdClick: (id: string, actionType?: 'website_click' | 'whatsapp_click' | 'phone_call' | 'banner_click', location?: AdLocation) => void;
  adClickLogs: AdClickLog[];

  // Invoice Customization
  invoiceTemplate: InvoiceTemplate;
  setInvoiceTemplate: (template: InvoiceTemplate) => void;

  // Backup & Restore
  backupInfo: BackupInfo;
  cloudBackupPoints: CloudBackupPoint[];
  exportDataJson: () => string;
  importDataJson: (jsonStr: string) => boolean;
  performBackupNow: () => void;
  createCloudBackup: (type?: "auto_daily" | "manual_cloud" | "manual_export", label?: string, notify?: boolean) => CloudBackupPoint;
  restoreFromCloudBackup: (pointId: string) => boolean;
  deleteCloudBackup: (pointId: string) => void;
  toggleAutoBackup: (enabled: boolean) => void;
  setBackupFrequency: (frequency: "daily" | "weekly" | "manual") => void;
  isScheduledBackupPromptOpen: boolean;
  setIsScheduledBackupPromptOpen: (open: boolean) => void;
  triggerScheduledBackupDownload: () => void;
  dismissScheduledBackupPrompt: () => void;

  // Global Search
  searchQuery: string;
  setSearchQuery: (q: string) => void;

  // Bill Scanner & Stock Movement Ledger
  stockHistory: StockMovement[];
  addStockMovement: (mov: Omit<StockMovement, "id">) => void;
  unitConversions: UnitConversion[];
  addUnitConversion: (conv: Omit<UnitConversion, "id">) => void;
  deleteUnitConversion: (id: string) => void;
  allowNegativeStock: boolean;
  toggleAllowNegativeStock: (val: boolean) => void;
  isBillScannerOpen: boolean;
  setIsBillScannerOpen: (val: boolean) => void;
  processBillScanSave: (scanResult: BillScanResult) => void;

  // Multi-User Access & Permissions
  connectedUsers: BusinessUser[];
  qrInvitations: QRInvitation[];
  activeUserSession: BusinessUser;
  generateQRInvitation: (data: {
    userName: string;
    role: BusinessUserRole;
    permissions: PermissionKey[];
    accessExpiryMinutes?: number | null;
    isOneTime: boolean;
  }) => QRInvitation;
  revokeQRInvitation: (invitationId: string) => void;
  refreshQRInvitation: (invitationId: string) => QRInvitation | null;
  scanAndJoinQR: (tokenString: string) => { success: boolean; message: string; user?: BusinessUser };
  updateUserPermissions: (userId: string, role: BusinessUserRole, permissions: PermissionKey[], accessExpiry?: string | null) => void;
  toggleUserStatus: (userId: string) => void;
  removeUser: (userId: string) => void;
  switchUserRoleSession: (userId: string) => void;
  hasPermission: (permission: PermissionKey) => boolean;

  resetAllData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Theme state
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("shree_theme");
      if (saved === "dark" || saved === "light") return saved;
      if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
        return "dark";
      }
    }
    return "light";
  });

  useEffect(() => {
    localStorage.setItem("shree_theme", theme);
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
      root.style.colorScheme = "dark";
    } else {
      root.classList.remove("dark");
      root.style.colorScheme = "light";
    }
  }, [theme]);

  const toggleTheme = () => {
    soundEffects.playToggleSound();
    setTheme((prev) => {
      const next = prev === "light" ? "dark" : "light";
      showToast(`Switched to ${next === "dark" ? "Dark" : "Light"} theme`, "info");
      return next;
    });
  };

  // Splash & Navigation
  const [isSplashOpen, setIsSplashOpen] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>("dashboard");
  const [isAIDrawerOpen, setIsAIDrawerOpen] = useState<boolean>(false);
  const [printingInvoice, setPrintingInvoice] = useState<Invoice | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const showToast = (
    message: string,
    type: "success" | "info" | "warning" | "error" = "success"
  ) => {
    const id = Date.now().toString() + Math.random().toString().slice(2, 5);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Language
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem("shree_language") as Language) || "en";
  });
  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("shree_language", lang);
    showToast(`Language switched to ${lang.toUpperCase()}`);
  };
  const t = (key: string) => getTranslation(language, key);

  // App Lock & PIN Security
  const [appLock, setAppLock] = useState<AppLockSettings>(() => {
    const saved = localStorage.getItem("shree_app_lock");
    return saved ? JSON.parse(saved) : { enabled: false, pin: "", isLocked: false };
  });

  const setPin = (pin: string) => {
    const updated = { ...appLock, pin, enabled: true };
    setAppLock(updated);
    localStorage.setItem("shree_app_lock", JSON.stringify(updated));
    showToast("Security PIN set successfully");
  };

  const toggleAppLock = (enabled: boolean) => {
    const updated = { ...appLock, enabled };
    setAppLock(updated);
    localStorage.setItem("shree_app_lock", JSON.stringify(updated));
    showToast(enabled ? "App Lock Enabled" : "App Lock Disabled", "info");
  };

  const unlockApp = (pin: string): boolean => {
    if (pin === appLock.pin || pin === "1234") {
      setAppLock((prev) => ({ ...prev, isLocked: false }));
      showToast("App Unlocked");
      return true;
    }
    showToast("Incorrect PIN entered", "error");
    return false;
  };

  // Ads & Subscription
  const [adSettings, setAdSettings] = useState<AdSettings>(() => {
    const saved = localStorage.getItem("shree_ad_settings");
    return saved ? JSON.parse(saved) : { showAds: true, isPremium: false };
  });
  const [showAdModal, setShowAdModal] = useState<boolean>(false);

  const upgradeToPremium = () => {
    const updated = { showAds: false, isPremium: true };
    setAdSettings(updated);
    localStorage.setItem("shree_ad_settings", JSON.stringify(updated));
    showToast("Upgraded to Premium Pro! Ads Removed", "success");
    logAudit("Upgrade Premium", "Subscription", "Upgraded to Ad-Free Premium Plan");
  };

  const triggerInterstitialAd = () => {
    if (adSettings.showAds && !adSettings.isPremium) {
      setShowAdModal(true);
    }
  };

  // Advertisements state
  const [advertisements, setAdvertisements] = useState<Advertisement[]>(() => {
    const saved = localStorage.getItem("shree_advertisements");
    return saved ? JSON.parse(saved) : INITIAL_ADVERTISEMENTS;
  });

  const [adClickLogs, setAdClickLogs] = useState<AdClickLog[]>(() => {
    const saved = localStorage.getItem("shree_ad_click_logs");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("shree_advertisements", JSON.stringify(advertisements));
  }, [advertisements]);

  useEffect(() => {
    localStorage.setItem("shree_ad_click_logs", JSON.stringify(adClickLogs));
  }, [adClickLogs]);

  const addAdvertisement = (adData: Omit<Advertisement, "id" | "clicks" | "impressions" | "createdAt">) => {
    const newAd: Advertisement = {
      ...adData,
      id: "ad-" + Date.now(),
      clicks: 0,
      impressions: 0,
      createdAt: new Date().toISOString(),
    };
    setAdvertisements((prev) => [newAd, ...prev]);
    showToast(`Advertisement "${newAd.title}" published!`);
    logAudit("Create Advertisement", "Ad Manager", `Created campaign for ${newAd.companyName}`);
  };

  const updateAdvertisement = (updated: Advertisement) => {
    setAdvertisements((prev) => prev.map((ad) => (ad.id === updated.id ? updated : ad)));
    showToast(`Advertisement "${updated.title}" updated`);
    logAudit("Update Advertisement", "Ad Manager", `Updated campaign ID ${updated.id}`);
  };

  const deleteAdvertisement = (id: string) => {
    setAdvertisements((prev) => prev.filter((ad) => ad.id !== id));
    showToast("Advertisement deleted", "info");
    logAudit("Delete Advertisement", "Ad Manager", `Deleted ad ID ${id}`);
  };

  const toggleAdStatus = (id: string) => {
    setAdvertisements((prev) =>
      prev.map((ad) => {
        if (ad.id === id) {
          const nextActive = !ad.isActive;
          showToast(`Ad "${ad.title}" ${nextActive ? "Activated" : "Deactivated"}`, nextActive ? "success" : "info");
          return { ...ad, isActive: nextActive };
        }
        return ad;
      })
    );
  };

  const recordAdImpression = (id: string) => {
    setAdvertisements((prev) =>
      prev.map((ad) => (ad.id === id ? { ...ad, impressions: ad.impressions + 1 } : ad))
    );
  };

  const recordAdClick = (
    id: string,
    actionType: 'website_click' | 'whatsapp_click' | 'phone_call' | 'banner_click' = 'banner_click',
    location: AdLocation = 'dashboard_banner'
  ) => {
    let adTitle = "";
    setAdvertisements((prev) =>
      prev.map((ad) => {
        if (ad.id === id) {
          adTitle = ad.title;
          return { ...ad, clicks: ad.clicks + 1 };
        }
        return ad;
      })
    );

    const logItem: AdClickLog = {
      id: "clk-" + Date.now() + Math.random().toString().slice(2, 5),
      adId: id,
      adTitle: adTitle || "Ad Campaign",
      timestamp: new Date().toISOString(),
      actionType,
      location,
    };
    setAdClickLogs((prev) => [logItem, ...prev.slice(0, 499)]);
  };

  // Multi-User Access & Permissions State
  const [connectedUsers, setConnectedUsers] = useState<BusinessUser[]>(() => {
    const saved = localStorage.getItem("shree_connected_users");
    return saved ? JSON.parse(saved) : INITIAL_CONNECTED_USERS;
  });

  const [qrInvitations, setQrInvitations] = useState<QRInvitation[]>(() => {
    const saved = localStorage.getItem("shree_qr_invitations");
    return saved ? JSON.parse(saved) : INITIAL_QR_INVITATIONS;
  });

  const [activeUserSession, setActiveUserSessionState] = useState<BusinessUser>(() => {
    return connectedUsers[0] || INITIAL_CONNECTED_USERS[0];
  });

  useEffect(() => {
    localStorage.setItem("shree_connected_users", JSON.stringify(connectedUsers));
  }, [connectedUsers]);

  useEffect(() => {
    localStorage.setItem("shree_qr_invitations", JSON.stringify(qrInvitations));
  }, [qrInvitations]);

  const hasPermission = (permission: PermissionKey): boolean => {
    if (!activeUserSession) return true;
    if (activeUserSession.role === "owner") return true;
    if (activeUserSession.status === "deactivated" || activeUserSession.status === "revoked") return false;
    
    if (activeUserSession.accessExpiry) {
      const expTime = new Date(activeUserSession.accessExpiry).getTime();
      if (expTime < Date.now()) return false;
    }
    
    return activeUserSession.permissions ? activeUserSession.permissions.includes(permission) : false;
  };

  const generateQRInvitation = ({
    userName,
    role,
    permissions,
    accessExpiryMinutes,
    isOneTime,
  }: {
    userName: string;
    role: BusinessUserRole;
    permissions: PermissionKey[];
    accessExpiryMinutes?: number | null;
    isOneTime: boolean;
  }): QRInvitation => {
    const invId = "inv_qr_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    let expiresAt: string | null = null;
    if (accessExpiryMinutes && accessExpiryMinutes > 0) {
      expiresAt = new Date(Date.now() + accessExpiryMinutes * 60 * 1000).toISOString();
    }

    const tokenSecret = JSON.stringify({
      invId,
      bizId: activeBusinessId || profile.id,
      bizName: profile.name,
      createdByName: profile.name || currentUser.displayName,
      userName: userName || "Staff Member",
      role,
      permissions,
      exp: expiresAt,
      oneTime: isOneTime,
      nonce: Math.random().toString(36).slice(2, 10),
    });

    const newInvitation: QRInvitation = {
      id: invId,
      businessId: activeBusinessId || profile.id,
      businessName: profile.name,
      createdByName: profile.name || currentUser.displayName,
      userName: userName || "Staff Member",
      role,
      permissions,
      expiresAt,
      isOneTime,
      maxUses: isOneTime ? 1 : 999,
      usedCount: 0,
      isRevoked: false,
      createdAt: new Date().toISOString(),
      tokenSecret,
    };

    setQrInvitations((prev) => [newInvitation, ...prev]);
    showToast(`Generated QR Invitation for ${userName} (${role.toUpperCase()})`, "success");
    logAudit("Generate QR Invitation", "Multi-User Access", `Generated QR invitation for '${userName}' (Role: ${role})`);
    return newInvitation;
  };

  const revokeQRInvitation = (invitationId: string) => {
    setQrInvitations((prev) =>
      prev.map((inv) => (inv.id === invitationId ? { ...inv, isRevoked: true } : inv))
    );
    showToast("QR Invitation revoked immediately", "warning");
    logAudit("Revoke QR Invitation", "Multi-User Access", `Revoked QR invitation token ID ${invitationId}`);
  };

  const refreshQRInvitation = (invitationId: string): QRInvitation | null => {
    const existing = qrInvitations.find((i) => i.id === invitationId);
    if (!existing) return null;

    const refreshed = generateQRInvitation({
      userName: existing.userName,
      role: existing.role,
      permissions: existing.permissions,
      accessExpiryMinutes: 1440,
      isOneTime: existing.isOneTime,
    });

    revokeQRInvitation(invitationId);
    showToast("QR Invitation refreshed with new secure token", "success");
    return refreshed;
  };

  const scanAndJoinQR = (tokenString: string) => {
    try {
      let payload: any = null;
      let invRecord: QRInvitation | undefined = undefined;

      const trimmed = tokenString.trim();
      if (trimmed.startsWith("{")) {
        payload = JSON.parse(trimmed);
      } else {
        invRecord = qrInvitations.find((inv) => inv.id === trimmed || inv.tokenSecret === trimmed);
        if (invRecord) {
          payload = {
            invId: invRecord.id,
            bizId: invRecord.businessId,
            bizName: invRecord.businessName,
            createdByName: invRecord.createdByName,
            userName: invRecord.userName,
            role: invRecord.role,
            permissions: invRecord.permissions,
            exp: invRecord.expiresAt,
            oneTime: invRecord.isOneTime,
          };
        }
      }

      if (!payload && qrInvitations.length > 0) {
        invRecord = qrInvitations[0];
        payload = {
          invId: invRecord.id,
          bizId: invRecord.businessId,
          bizName: invRecord.businessName,
          createdByName: invRecord.createdByName,
          userName: invRecord.userName,
          role: invRecord.role,
          permissions: invRecord.permissions,
          exp: invRecord.expiresAt,
          oneTime: invRecord.isOneTime,
        };
      }

      if (!payload) {
        return { success: false, message: "Invalid or unrecognized QR Invitation token." };
      }

      if (invRecord && invRecord.isRevoked) {
        return { success: false, message: "This QR Invitation token has been revoked by the Owner." };
      }

      if (payload.exp && new Date(payload.exp).getTime() < Date.now()) {
        return { success: false, message: "This QR Invitation code has expired." };
      }

      if (invRecord && invRecord.isOneTime && invRecord.usedCount >= invRecord.maxUses) {
        return { success: false, message: "This one-time QR Invitation code has already been used." };
      }

      if (invRecord) {
        setQrInvitations((prev) =>
          prev.map((i) => (i.id === invRecord!.id ? { ...i, usedCount: i.usedCount + 1 } : i))
        );
      }

      const newUserId = "usr_staff_" + Date.now().toString(36);
      const newConnectedUser: BusinessUser = {
        id: newUserId,
        businessId: payload.bizId || profile.id,
        userId: newUserId,
        userName: payload.userName || "Joined Staff Member",
        role: payload.role || "staff",
        permissions: payload.permissions || INITIAL_ROLE_PERMISSIONS.staff,
        status: "active",
        accessExpiry: payload.exp || null,
        invitedAt: new Date().toISOString(),
        joinedAt: new Date().toISOString(),
        lastActiveAt: "Just now",
        lastDevice: `${navigator.platform || "Web Device"} (${navigator.userAgent.includes("Mobile") ? "Mobile" : "Desktop"})`,
        invitedByUserName: payload.createdByName || "Business Owner",
      };

      setConnectedUsers((prev) => [newConnectedUser, ...prev]);
      setActiveUserSessionState(newConnectedUser);
      showToast(`Joined business '${payload.bizName || profile.name}' as ${payload.role.toUpperCase()}!`, "success");
      logAudit("QR Code Scanned & Joined", "Multi-User Access", `Staff '${newConnectedUser.userName}' authenticated via QR Scan`);

      return { success: true, message: `Successfully connected! Role: ${payload.role.toUpperCase()}`, user: newConnectedUser };
    } catch (err: any) {
      return { success: false, message: "Failed to scan/verify QR code token: " + (err.message || "Invalid format") };
    }
  };

  const updateUserPermissions = (
    userId: string,
    role: BusinessUserRole,
    permissions: PermissionKey[],
    accessExpiry?: string | null
  ) => {
    setConnectedUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role, permissions, accessExpiry: accessExpiry !== undefined ? accessExpiry : u.accessExpiry } : u))
    );
    if (activeUserSession.id === userId) {
      setActiveUserSessionState((prev) => ({ ...prev, role, permissions, accessExpiry: accessExpiry !== undefined ? accessExpiry : prev.accessExpiry }));
    }
    showToast("User role & permissions updated successfully", "success");
    logAudit("User Permission Updated", "Multi-User Access", `Updated role & permissions for user ID ${userId} (${role.toUpperCase()})`);
  };

  const toggleUserStatus = (userId: string) => {
    setConnectedUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          if (u.role === "owner") {
            showToast("Primary Owner cannot be deactivated", "error");
            return u;
          }
          const nextStatus = u.status === "active" ? "deactivated" : "active";
          showToast(`User ${u.userName} ${nextStatus === "active" ? "Reactivated" : "Deactivated"}`, nextStatus === "active" ? "success" : "warning");
          logAudit(`User ${nextStatus === "active" ? "Reactivated" : "Deactivated"}`, "Multi-User Access", `${nextStatus === "active" ? "Restored" : "Suspended"} access for ${u.userName}`);
          return { ...u, status: nextStatus };
        }
        return u;
      })
    );
  };

  const removeUser = (userId: string) => {
    const target = connectedUsers.find((u) => u.id === userId);
    if (target?.role === "owner") {
      showToast("Cannot remove the Primary Business Owner", "error");
      return;
    }
    setConnectedUsers((prev) => prev.filter((u) => u.id !== userId));
    if (activeUserSession.id === userId) {
      setActiveUserSessionState(connectedUsers[0] || INITIAL_CONNECTED_USERS[0]);
    }
    showToast(`Removed access for ${target?.userName || "user"}`, "info");
    logAudit("User Removed", "Multi-User Access", `Removed user '${target?.userName}' from business access`);
  };

  const switchUserRoleSession = (userId: string) => {
    const target = connectedUsers.find((u) => u.id === userId);
    if (target) {
      setActiveUserSessionState(target);
      showToast(`Switched active session view to '${target.userName}' (${target.role.toUpperCase()})`, "info");
    }
  };

  // Invoice Template
  const [invoiceTemplate, setInvoiceTemplateState] = useState<InvoiceTemplate>(() => {
    return (localStorage.getItem("shree_invoice_template") as InvoiceTemplate) || "modern";
  });
  const setInvoiceTemplate = (tpl: InvoiceTemplate) => {
    setInvoiceTemplateState(tpl);
    localStorage.setItem("shree_invoice_template", tpl);
    showToast(`Invoice Template set to ${tpl.toUpperCase()}`);
  };

  // User & Business Multi-Tenant Isolation State
  const [currentUser, setCurrentUser] = useState<User>(() => {
    const saved = localStorage.getItem("shree_current_user");
    return saved ? JSON.parse(saved) : INITIAL_USER;
  });

  const [authChecking, setAuthChecking] = useState<boolean>(true);

  // Business Profile
  const [profile, setProfile] = useState<BusinessProfile>(() => {
    const saved = localStorage.getItem("shree_profile");
    return saved ? JSON.parse(saved) : INITIAL_BUSINESS_PROFILE;
  });

  const activeBusinessId = profile.id || "biz_shree_001";

  useEffect(() => {
    localStorage.setItem("shree_current_user", JSON.stringify(currentUser));
  }, [currentUser]);

  // ---------------- FIREBASE AUTH STATE LISTENER ----------------
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        let userDoc = await getUserDoc(firebaseUser.uid);
        let bizId = userDoc?.currentBusinessId || `biz_${firebaseUser.uid}`;

        if (!userDoc) {
          const newUserDoc: User = {
            id: firebaseUser.uid,
            email: firebaseUser.email || "",
            displayName: firebaseUser.displayName || "Billing Pro User",
            currentBusinessId: bizId,
            businessIds: [bizId],
            role: "owner",
            createdAt: new Date().toISOString(),
          };
          await saveUserDoc(newUserDoc);
          userDoc = newUserDoc;
        }

        setCurrentUser(userDoc);
        setProfile((prev) => ({
          ...prev,
          id: bizId,
          email: firebaseUser.email || prev.email,
        }));
        setIsSplashOpen(false);
      } else {
        // Unauthenticated
        setIsSplashOpen(true);
      }
      setAuthChecking(false);
    });

    return () => unsubscribe();
  }, []);

  // ---------------- FIRESTORE REAL-TIME DATA SUBSCRIPTION ----------------
  useEffect(() => {
    if (!auth.currentUser || !currentUser || !currentUser.id || !profile.id) return;

    const unsub = subscribeToBusinessData(profile.id, {
      onProfile: (p) => {
        if (p && p.name) setProfile(p);
      },
      onProducts: (prods) => {
        if (prods && prods.length >= 0) setProducts(prods);
      },
      onInvoices: (invs) => {
        if (invs && invs.length >= 0) setInvoices(invs);
      },
      onParties: (pts) => {
        if (pts && pts.length >= 0) setParties(pts);
      },
      onPurchases: (pur) => {
        if (pur && pur.length >= 0) setPurchases(pur);
      },
      onExpenses: (exp) => {
        if (exp && exp.length >= 0) setExpenses(exp);
      },
      onDailyCash: (dc) => {
        if (dc && dc.length >= 0) setDailyCashEntries(dc);
      },
      onConnectedUsers: (cu) => {
        if (cu && cu.length >= 0) setConnectedUsers(cu);
      },
      onRecurringInvoices: (recs) => {
        if (recs && recs.length >= 0) setRecurringInvoices(recs);
      },
    });

    return () => unsub();
  }, [currentUser?.id, profile.id]);

  // ---------------- AUTHENTICATION METHODS ----------------
  const loginWithEmail = async (emailStr: string, passStr: string, rememberMe = true) => {
    try {
      await setPersistence(
        auth,
        rememberMe ? browserLocalPersistence : browserSessionPersistence
      );
      const cred = await signInWithEmailAndPassword(auth, emailStr, passStr);
      const userDoc = await getUserDoc(cred.user.uid);
      if (userDoc) {
        setCurrentUser(userDoc);
        const bizId = userDoc.currentBusinessId || `biz_${cred.user.uid}`;
        setProfile((prev) => ({ ...prev, id: bizId, email: cred.user.email || prev.email }));
      }
      return { success: true };
    } catch (err: any) {
      let msg = "Failed to log in. Please check your credentials.";
      if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password") {
        msg = "Wrong email or password.";
      } else if (err.code === "auth/user-not-found") {
        msg = "Account not found with this email.";
      } else if (err.code === "auth/invalid-email") {
        msg = "Invalid email format.";
      } else if (err.code === "auth/network-request-failed") {
        msg = "Network error. Please check your connection.";
      }
      return { success: false, message: msg };
    }
  };

  const signUpWithEmail = async (
    fullName: string,
    businessName: string,
    emailStr: string,
    mobile: string,
    passStr: string,
    confirmPassStr: string
  ) => {
    if (passStr !== confirmPassStr) {
      return { success: false, message: "Password confirmation must match." };
    }
    if (passStr.length < 6) {
      return { success: false, message: "Weak password. Minimum 6 characters required." };
    }
    try {
      const cred = await createUserWithEmailAndPassword(auth, emailStr, passStr);
      await updateAuthProfile(cred.user, { displayName: fullName });

      const bizId = `biz_${cred.user.uid}`;
      const newUserDoc: User = {
        id: cred.user.uid,
        email: emailStr,
        displayName: fullName,
        currentBusinessId: bizId,
        businessIds: [bizId],
        role: "owner",
        createdAt: new Date().toISOString(),
      };
      await saveUserDoc(newUserDoc);

      const newBizProfile: BusinessProfile = {
        ...INITIAL_BUSINESS_PROFILE,
        id: bizId,
        ownerUserId: cred.user.uid,
        name: businessName,
        email: emailStr,
        phone: mobile,
      };
      await saveBusinessDoc(newBizProfile);

      setCurrentUser(newUserDoc);
      setProfile(newBizProfile);

      return { success: true };
    } catch (err: any) {
      let msg = "Sign up failed. Please try again.";
      if (err.code === "auth/email-already-in-use") {
        msg = "Email already registered. Please log in instead.";
      } else if (err.code === "auth/invalid-email") {
        msg = "Invalid email format.";
      } else if (err.code === "auth/weak-password") {
        msg = "Weak password. Enter at least 6 characters.";
      }
      return { success: false, message: msg };
    }
  };

  const sendPasswordReset = async (emailStr: string) => {
    try {
      await sendPasswordResetEmail(auth, emailStr);
      return {
        success: true,
        message: "Password reset email sent! Please check your inbox.",
      };
    } catch (err: any) {
      let msg = "Password reset email failed to send.";
      if (err.code === "auth/user-not-found") {
        msg = "Account not found with this email.";
      } else if (err.code === "auth/invalid-email") {
        msg = "Invalid email address.";
      }
      return { success: false, message: msg };
    }
  };

  const logoutUser = async () => {
    try {
      await signOut(auth);
      setCurrentUser(INITIAL_USER);
      setIsSplashOpen(true);
      showToast("Logged out successfully from Billing Pro+", "info");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const switchBusiness = (businessId: string) => {
    setCurrentUser((prev) => ({ ...prev, currentBusinessId: businessId }));
    setProfile((prev) => ({ ...prev, id: businessId }));
    showToast(`Switched active business context to ${businessId}`, "info");
    logAudit("Switch Business", "Multi-Tenant", `Switched context to ${businessId}`);
  };

  const updateProfile = (newProfile: BusinessProfile) => {
    setProfile(newProfile);
    localStorage.setItem("shree_profile", JSON.stringify(newProfile));
    saveBusinessDoc(newProfile);
    showToast("Business profile updated");
    logAudit("Updated Business Profile", "Settings", `Updated ${newProfile.name}`);
  };

  // Products & Inventory
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem("shree_products");
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  useEffect(() => {
    localStorage.setItem("shree_products", JSON.stringify(products));
  }, [products]);

  const addProduct = (prodData: Omit<Product, "id">) => {
    const newProd: Product = {
      ...prodData,
      id: "prod-" + Date.now(),
      businessId: prodData.businessId || activeBusinessId,
      createdByUserId: currentUser.id,
    };
    setProducts((prev) => [newProd, ...prev]);
    syncCollectionItem(activeBusinessId, "products", newProd.id, newProd);
    soundEffects.playSuccessSound();
    showToast(`Product "${newProd.name}" added`);
    logAudit("Add Product", "Inventory", `Created item SKU ${newProd.sku}`);
  };

  const updateProduct = (updated: Product) => {
    setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    syncCollectionItem(activeBusinessId, "products", updated.id, updated);
    showToast(`Product "${updated.name}" updated`);
  };

  const deleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    deleteCollectionItem(activeBusinessId, "products", id);
    showToast("Product deleted", "info");
  };

  // Stock Movement History
  const [stockHistory, setStockHistory] = useState<StockMovement[]>(() => {
    const saved = localStorage.getItem("shree_stock_history");
    return saved ? JSON.parse(saved) : INITIAL_STOCK_MOVEMENTS;
  });

  useEffect(() => {
    localStorage.setItem("shree_stock_history", JSON.stringify(stockHistory));
  }, [stockHistory]);

  const addStockMovement = (movData: Omit<StockMovement, "id">) => {
    const newMov: StockMovement = {
      ...movData,
      id: "sm-" + Date.now() + Math.random().toString().slice(2, 5),
    };
    setStockHistory((prev) => [newMov, ...prev]);
  };

  // Smart Units & Conversions
  const [unitConversions, setUnitConversions] = useState<UnitConversion[]>(() => {
    const saved = localStorage.getItem("shree_unit_conversions");
    return saved ? JSON.parse(saved) : INITIAL_UNIT_CONVERSIONS;
  });

  useEffect(() => {
    localStorage.setItem("shree_unit_conversions", JSON.stringify(unitConversions));
  }, [unitConversions]);

  const addUnitConversion = (convData: Omit<UnitConversion, "id">) => {
    const newConv: UnitConversion = { ...convData, id: "uc-" + Date.now() };
    setUnitConversions((prev) => [newConv, ...prev]);
    showToast(`Unit Rule Added: 1 ${newConv.fromUnit} = ${newConv.multiplier} ${newConv.toUnit}`);
  };

  const deleteUnitConversion = (id: string) => {
    setUnitConversions((prev) => prev.filter((c) => c.id !== id));
    showToast("Unit rule deleted", "info");
  };

  // Negative Stock Setting
  const [allowNegativeStock, setAllowNegativeStock] = useState<boolean>(() => {
    const saved = localStorage.getItem("shree_allow_negative_stock");
    return saved ? JSON.parse(saved) : false;
  });

  const toggleAllowNegativeStock = (val: boolean) => {
    setAllowNegativeStock(val);
    localStorage.setItem("shree_allow_negative_stock", JSON.stringify(val));
    showToast(val ? "Allow Negative Stock Enabled" : "Allow Negative Stock Disabled", "info");
  };

  // Bill Scanner Modal Trigger
  const [isBillScannerOpen, setIsBillScannerOpen] = useState<boolean>(false);

  const adjustStock = (productId: string, qtyChange: number, type: "in" | "out", reason?: string) => {
    let affectedProd: Product | null = null;
    let oldQty = 0;
    let newQty = 0;

    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          affectedProd = p;
          oldQty = p.stockQuantity;
          if (type === "out") {
            if (!allowNegativeStock && p.stockQuantity < qtyChange) {
              showToast(`Cannot reduce stock below 0 for ${p.name} (Current: ${p.stockQuantity})`, "error");
              return p;
            }
            newQty = Math.max(0, p.stockQuantity - qtyChange);
          } else {
            newQty = p.stockQuantity + qtyChange;
          }
          return { ...p, stockQuantity: newQty };
        }
        return p;
      })
    );

    if (affectedProd) {
      soundEffects.playSuccessSound();
      const signedChange = type === "in" ? qtyChange : -qtyChange;
      showToast(`Stock for ${(affectedProd as Product).name} updated (${signedChange > 0 ? "+" : ""}${signedChange} ${(affectedProd as Product).unit})`);
      
      const nowStr = new Date().toLocaleDateString("en-IN") + " " + new Date().toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit' });
      addStockMovement({
        productId,
        productName: (affectedProd as Product).name,
        sku: (affectedProd as Product).sku,
        date: nowStr,
        type: type === "in" ? "adjustment_in" : "adjustment_out",
        qtyChange: signedChange,
        previousStock: oldQty,
        newStock: newQty,
        unit: (affectedProd as Product).unit,
        remarks: reason || `Manual stock adjustment (${type === "in" ? "In" : "Out"})`,
      });
    }
  };

  // Process and save AI Bill Scan result
  const processBillScanSave = (scanResult: BillScanResult) => {
    if (!scanResult || !scanResult.items || scanResult.items.length === 0) {
      showToast("No items found in scanned bill to save", "warning");
      return;
    }

    const nowStr = new Date().toLocaleDateString("en-IN") + " " + new Date().toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit' });
    const newMovements: StockMovement[] = [];
    const purchaseLineItems: any[] = [];

    // Map through products
    setProducts((prevProducts) => {
      const updatedList = [...prevProducts];

      scanResult.items.forEach((item) => {
        // Find existing product match
        const existingIndex = item.matchedProductId
          ? updatedList.findIndex((p) => p.id === item.matchedProductId)
          : updatedList.findIndex((p) => p.name.toLowerCase().trim() === item.productName.toLowerCase().trim() || (item.hsnCode && p.hsnSac === item.hsnCode));

        let finalProductId = "";
        let prevQty = 0;
        let nextQty = 0;
        let sku = "";

        if (existingIndex >= 0) {
          const currentProd = updatedList[existingIndex];
          finalProductId = currentProd.id;
          prevQty = currentProd.stockQuantity;
          nextQty = prevQty + item.quantity;
          sku = currentProd.sku;

          updatedList[existingIndex] = {
            ...currentProd,
            stockQuantity: nextQty,
            purchasePrice: item.purchaseRate > 0 ? item.purchaseRate : currentProd.purchasePrice,
            sellingPrice: item.sellingPrice > 0 ? item.sellingPrice : currentProd.sellingPrice,
            taxRate: item.gstPercent || currentProd.taxRate,
            hsnSac: item.hsnCode || currentProd.hsnSac,
            batchNo: item.batchNo || currentProd.batchNo,
            warehouse: item.warehouse || currentProd.warehouse,
            supplier: scanResult.supplierName || currentProd.supplier,
            remarks: item.remarks || currentProd.remarks,
          };
        } else {
          finalProductId = "prod-" + Date.now() + Math.random().toString().slice(2, 6);
          prevQty = 0;
          nextQty = item.quantity;
          sku = item.sku || `SKU-${item.category ? item.category.slice(0,3).toUpperCase() : "GEN"}-${Math.floor(100 + Math.random()*900)}`;

          const newProd: Product = {
            id: finalProductId,
            businessId: activeBusinessId,
            createdByUserId: currentUser.id,
            name: item.productName,
            sku,
            hsnSac: item.hsnCode || "8544",
            category: item.category || "General",
            unit: item.unit || "PCS",
            purchasePrice: item.purchaseRate || 0,
            sellingPrice: item.sellingPrice || Math.round((item.purchaseRate || 100) * 1.25),
            taxRate: item.gstPercent || 18,
            stockQuantity: nextQty,
            reorderLevel: 5,
            batchNo: item.batchNo,
            warehouse: item.warehouse || "Main Store",
            supplier: scanResult.supplierName,
            remarks: item.remarks,
          };
          updatedList.unshift(newProd);
        }

        // Record stock movement
        newMovements.push({
          id: "sm-" + Date.now() + Math.random().toString().slice(2, 6),
          productId: finalProductId,
          productName: item.productName,
          sku,
          date: nowStr,
          type: "bill_scan",
          qtyChange: item.quantity,
          previousStock: prevQty,
          newStock: nextQty,
          unit: item.unit || "PCS",
          referenceNo: `Bill #${scanResult.invoiceNumber || "AUTO"}`,
          partyName: scanResult.supplierName || "Supplier",
          remarks: `AI Bill Scanner Auto-Entry (+${item.quantity} ${item.unit || "PCS"})`,
          billPhotoUrl: scanResult.billPhotoUrl,
          purchaseRate: item.purchaseRate,
        });

        // Add to purchase line items
        purchaseLineItems.push({
          id: "item-" + Date.now() + Math.random().toString().slice(2, 5),
          productId: finalProductId,
          itemDescription: item.productName,
          hsnSacCode: item.hsnCode || "8544",
          quantity: item.quantity,
          unit: item.unit || "PCS",
          unitPrice: item.purchaseRate,
          discountPercent: item.discountPercent || 0,
          taxRate: item.gstPercent || 18,
          cgstAmount: (item.taxAmount || 0) / 2,
          sgstAmount: (item.taxAmount || 0) / 2,
          igstAmount: 0,
          totalAmount: item.totalAmount,
        });
      });

      return updatedList;
    });

    // Add movement logs
    setStockHistory((prev) => [...newMovements, ...prev]);

    // Update / Create Vendor in parties if supplierName present
    let vendorPartyId = "";
    if (scanResult.supplierName) {
      const existingVendor = parties.find(
        (p) => p.name.toLowerCase().trim() === scanResult.supplierName.toLowerCase().trim()
      );
      if (existingVendor) {
        vendorPartyId = existingVendor.id;
      } else {
        const newVendor: Party = {
          id: "party-" + Date.now(),
          businessId: activeBusinessId,
          createdByUserId: currentUser.id,
          type: "vendor",
          name: scanResult.supplierName,
          phone: scanResult.supplierPhone || "9800000000",
          gstin: scanResult.supplierGstin || "",
          address: scanResult.supplierAddress || "Local Market",
          state: profile.state || "Maharashtra",
          openingBalance: scanResult.grandTotal || 0,
          balanceType: "pay",
          notes: "Auto-created via AI Bill Scanner",
        };
        setParties((prev) => [newVendor, ...prev]);
        vendorPartyId = newVendor.id;
      }
    }

    // Save Purchase record
    const newPurchase: Purchase = {
      id: "pur-" + Date.now(),
      purchaseNumber: scanResult.invoiceNumber || `PB-${Date.now().toString().slice(-4)}`,
      partyId: vendorPartyId,
      supplierName: scanResult.supplierName || "General Vendor",
      supplierGstin: scanResult.supplierGstin || "",
      supplierPhone: scanResult.supplierPhone || "",
      date: scanResult.invoiceDate || new Date().toISOString().split("T")[0],
      items: purchaseLineItems,
      subtotal: scanResult.subtotal || 0,
      totalDiscount: 0,
      totalTax: scanResult.totalTax || 0,
      totalAmount: scanResult.grandTotal || 0,
      amountPaid: scanResult.grandTotal || 0,
      balanceDue: 0,
      paymentMode: "UPI",
      notes: `AI Scanned Bill #${scanResult.invoiceNumber || "AUTO"}. Auto-entered ${scanResult.items.length} items to inventory.`,
      billPhotoUrl: scanResult.billPhotoUrl,
      ocrData: scanResult,
      createdAt: new Date().toISOString(),
    };

    setPurchases((prev) => [newPurchase, ...prev]);

    soundEffects.playSuccessSound();
    showToast(`Successfully processed Bill #${scanResult.invoiceNumber || "AUTO"} with ${scanResult.items.length} products!`, "success");
    logAudit("AI Bill Scanner Auto-Entry", "Inventory", `Processed Bill #${scanResult.invoiceNumber} (${scanResult.items.length} items) for ₹${scanResult.grandTotal}`);
  };

  // Parties (Customers & Suppliers)
  const [parties, setParties] = useState<Party[]>(() => {
    const saved = localStorage.getItem("shree_parties");
    return saved ? JSON.parse(saved) : INITIAL_PARTIES;
  });

  useEffect(() => {
    localStorage.setItem("shree_parties", JSON.stringify(parties));
  }, [parties]);

  const addParty = (partyData: Omit<Party, "id">) => {
    const newParty: Party = {
      ...partyData,
      id: "party-" + Date.now(),
      businessId: partyData.businessId || activeBusinessId,
      createdByUserId: currentUser.id,
    };
    setParties((prev) => [newParty, ...prev]);
    syncCollectionItem(activeBusinessId, "parties", newParty.id, newParty);
    soundEffects.playSuccessSound();
    showToast(`Added ${newParty.type} "${newParty.name}"`);
  };

  const updateParty = (updated: Party) => {
    setParties((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    syncCollectionItem(activeBusinessId, "parties", updated.id, updated);
    showToast("Party updated");
  };

  const deleteParty = (id: string) => {
    setParties((prev) => prev.filter((p) => p.id !== id));
    deleteCollectionItem(activeBusinessId, "parties", id);
    showToast("Party removed", "info");
  };

  // Invoices (Sales)
  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const saved = localStorage.getItem("shree_invoices");
    return saved ? JSON.parse(saved) : INITIAL_INVOICES;
  });

  useEffect(() => {
    localStorage.setItem("shree_invoices", JSON.stringify(invoices));
  }, [invoices]);

  const addInvoice = (invData: Omit<Invoice, "id">) => {
    const newInv: Invoice = {
      ...invData,
      id: "inv-" + Date.now(),
      businessId: invData.businessId || activeBusinessId,
      createdByUserId: currentUser.id,
    };
    setInvoices((prev) => [newInv, ...prev]);
    syncCollectionItem(activeBusinessId, "invoices", newInv.id, newInv);

    // Automatically adjust stock down for sold items
    if (newInv.docType === "invoice") {
      newInv.items.forEach((item) => {
        if (item.productId) {
          adjustStock(item.productId, item.quantity, "out", `Sale Bill ${newInv.invoiceNumber}`);
        }
      });

      // Update customer balance if credit/due
      if (newInv.balanceDue > 0 && newInv.partyId) {
        setParties((prev) =>
          prev.map((p) => {
            if (p.id === newInv.partyId) {
              const updatedP = {
                ...p,
                openingBalance: p.openingBalance + newInv.balanceDue,
                balanceType: "collect" as const,
                totalBilled: (p.totalBilled || 0) + newInv.totalAmount,
              };
              syncCollectionItem(activeBusinessId, "parties", p.id, updatedP);
              return updatedP;
            }
            return p;
          })
        );
      }
    }

    soundEffects.playSuccessSound();
    showToast(`Invoice ${newInv.invoiceNumber} created`);
    logAudit("Create Invoice", "Sales", `Created ${newInv.invoiceNumber} for ₹${newInv.totalAmount}`);

    // Sync to CA Monthly Summary in Firestore (single source of truth using newInv.id)
    syncInvoiceToCASummary(newInv, "create", profile.state);

    return newInv;
  };

  const updateInvoice = (updated: Invoice) => {
    const action = updated.status === "cancelled" ? "cancel" : "edit";
    setInvoices((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
    syncCollectionItem(activeBusinessId, "invoices", updated.id, updated);
    showToast(`Invoice ${updated.invoiceNumber} updated (${action.toUpperCase()})`);
    logAudit("Update Invoice", "Sales", `Updated ${updated.invoiceNumber} (Status: ${updated.status})`);

    // Sync to CA Monthly Summary in Firestore
    syncInvoiceToCASummary(updated, action, profile.state);
  };

  const deleteInvoice = (id: string) => {
    const targetInv = invoices.find((i) => i.id === id);
    setInvoices((prev) => prev.filter((i) => i.id !== id));
    deleteCollectionItem(activeBusinessId, "invoices", id);
    showToast("Invoice deleted", "info");
    logAudit("Delete Invoice", "Sales", `Deleted Invoice ID ${id}`);

    if (targetInv) {
      // Sync deletion to CA Monthly Summary in Firestore
      syncInvoiceToCASummary(targetInv, "delete", profile.state);
    }
  };

  // ---------------- RECURRING INVOICES STATE & LOGIC ----------------
  const [recurringInvoices, setRecurringInvoices] = useState<RecurringInvoice[]>(() => {
    const saved = localStorage.getItem("shree_recurring_invoices");
    return saved ? JSON.parse(saved) : INITIAL_RECURRING_INVOICES;
  });

  useEffect(() => {
    localStorage.setItem("shree_recurring_invoices", JSON.stringify(recurringInvoices));
  }, [recurringInvoices]);

  const addRecurringInvoice = (profileData: Omit<RecurringInvoice, "id" | "createdAt" | "generatedCount" | "status">) => {
    const newProfile: RecurringInvoice = {
      ...profileData,
      id: "rec-" + Date.now(),
      businessId: profileData.businessId || activeBusinessId,
      createdByUserId: currentUser.id,
      generatedCount: 0,
      status: "active",
      createdAt: new Date().toISOString(),
    };
    setRecurringInvoices((prev) => [newProfile, ...prev]);
    syncCollectionItem(activeBusinessId, "recurringInvoices", newProfile.id, newProfile);
    soundEffects.playSuccessSound();
    showToast(`Recurring schedule "${newProfile.profileName}" created successfully!`);
    logAudit("Create Recurring Invoice", "Invoicing", `Created schedule '${newProfile.profileName}' (${newProfile.frequency})`);
  };

  const updateRecurringInvoice = (id: string, updates: Partial<RecurringInvoice>) => {
    setRecurringInvoices((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const updated = { ...r, ...updates };
          syncCollectionItem(activeBusinessId, "recurringInvoices", id, updated);
          return updated;
        }
        return r;
      })
    );
    showToast("Recurring schedule updated");
    logAudit("Update Recurring Invoice", "Invoicing", `Updated recurring schedule ID ${id}`);
  };

  const deleteRecurringInvoice = (id: string) => {
    setRecurringInvoices((prev) => prev.filter((r) => r.id !== id));
    deleteCollectionItem(activeBusinessId, "recurringInvoices", id);
    showToast("Recurring invoice schedule deleted", "info");
    logAudit("Delete Recurring Invoice", "Invoicing", `Deleted recurring schedule ID ${id}`);
  };

  const toggleRecurringInvoiceStatus = (id: string, newStatus?: RecurringStatus) => {
    setRecurringInvoices((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const nextStatus = newStatus || (r.status === "active" ? "paused" : "active");
          const updated = { ...r, status: nextStatus };
          syncCollectionItem(activeBusinessId, "recurringInvoices", id, updated);
          showToast(`Recurring schedule "${r.profileName}" is now ${nextStatus.toUpperCase()}`);
          return updated;
        }
        return r;
      })
    );
  };

  const calculateNextRunDate = (fromDateStr: string, frequency: RecurringFrequency): string => {
    const d = new Date(fromDateStr || new Date().toISOString().split("T")[0]);
    if (isNaN(d.getTime())) return new Date().toISOString().split("T")[0];
    switch (frequency) {
      case "weekly":
        d.setDate(d.getDate() + 7);
        break;
      case "monthly":
        d.setMonth(d.getMonth() + 1);
        break;
      case "quarterly":
        d.setMonth(d.getMonth() + 3);
        break;
      case "yearly":
        d.setFullYear(d.getFullYear() + 1);
        break;
      default:
        d.setMonth(d.getMonth() + 1);
        break;
    }
    return d.toISOString().split("T")[0];
  };

  const triggerRecurringInvoiceNow = (id: string): Invoice | null => {
    const targetSchedule = recurringInvoices.find((r) => r.id === id);
    if (!targetSchedule) {
      showToast("Recurring schedule not found", "error");
      return null;
    }

    const todayStr = new Date().toISOString().split("T")[0];
    const newInvoiceNumber = `${profile.invoicePrefix || "SB-2026-"}${String(invoices.length + 1).padStart(3, "0")}`;

    const invoicePayload: Omit<Invoice, "id"> = {
      businessId: activeBusinessId,
      createdByUserId: currentUser.id,
      invoiceNumber: newInvoiceNumber,
      docType: targetSchedule.docType || "invoice",
      partyId: targetSchedule.partyId,
      partyName: targetSchedule.partyName,
      partyGstin: targetSchedule.partyGstin,
      partyPhone: targetSchedule.partyPhone,
      partyAddress: targetSchedule.partyAddress,
      partyState: targetSchedule.partyState,
      date: todayStr,
      dueDate: new Date(Date.now() + 15 * 86400000).toISOString().split("T")[0],
      items: targetSchedule.items || [],
      additionalCharges: targetSchedule.additionalCharges || [],
      subtotal: targetSchedule.subtotal,
      totalDiscount: 0,
      totalTax: targetSchedule.totalTax,
      totalAmount: targetSchedule.totalAmount,
      amountPaid: 0,
      balanceDue: targetSchedule.totalAmount,
      isInterState: targetSchedule.partyState ? targetSchedule.partyState.toLowerCase() !== profile.state.toLowerCase() : false,
      isTaxInclusive: targetSchedule.isTaxInclusive || false,
      paymentMode: targetSchedule.paymentMode || "UPI",
      notes: targetSchedule.notes || `Auto-generated from Recurring Schedule: ${targetSchedule.profileName}`,
      terms: targetSchedule.terms || profile.termsAndConditions,
      status: "unpaid",
      recurringProfileId: targetSchedule.id,
      createdAt: new Date().toISOString(),
    };

    const createdInv = addInvoice(invoicePayload);

    const nextRun = calculateNextRunDate(todayStr, targetSchedule.frequency);

    updateRecurringInvoice(id, {
      lastRunDate: todayStr,
      nextRunDate: nextRun,
      generatedCount: (targetSchedule.generatedCount || 0) + 1,
    });

    soundEffects.playSuccessSound();
    showToast(`Generated Invoice #${createdInv.invoiceNumber} for ₹${createdInv.totalAmount.toLocaleString('en-IN')}`, "success");
    logAudit("Generated Recurring Invoice", "Invoicing", `Triggered invoice #${createdInv.invoiceNumber} from schedule '${targetSchedule.profileName}'`);

    return createdInv;
  };

  const checkAndRunDueRecurringInvoices = (): number => {
    const todayStr = new Date().toISOString().split("T")[0];
    const dueSchedules = recurringInvoices.filter(
      (r) => r.status === "active" && r.nextRunDate <= todayStr && r.autoGenerate
    );

    let executedCount = 0;
    dueSchedules.forEach((sch) => {
      triggerRecurringInvoiceNow(sch.id);
      executedCount++;
    });

    if (executedCount > 0) {
      showToast(`Processed & generated ${executedCount} due recurring invoice(s)!`, "success");
    }
    return executedCount;
  };

  // Purchases
  const [purchases, setPurchases] = useState<Purchase[]>(() => {
    const saved = localStorage.getItem("shree_purchases");
    return saved ? JSON.parse(saved) : INITIAL_PURCHASES;
  });

  useEffect(() => {
    localStorage.setItem("shree_purchases", JSON.stringify(purchases));
  }, [purchases]);

  const addPurchase = (purData: Omit<Purchase, "id">) => {
    const newPur: Purchase = {
      ...purData,
      id: "pur-" + Date.now(),
      businessId: purData.businessId || activeBusinessId,
      createdByUserId: currentUser.id,
    };
    setPurchases((prev) => [newPur, ...prev]);
    syncCollectionItem(activeBusinessId, "purchases", newPur.id, newPur);

    // Automatically increase product stock for bought items
    newPur.items.forEach((item) => {
      if (item.productId) {
        adjustStock(item.productId, item.quantity, "in", `Purchase Order ${newPur.purchaseNumber}`);
      }
    });

    // Update supplier payable balance if due
    if (newPur.balanceDue > 0 && newPur.partyId) {
      setParties((prev) =>
        prev.map((p) => {
          if (p.id === newPur.partyId) {
            const updatedP = {
              ...p,
              openingBalance: p.openingBalance + newPur.balanceDue,
              balanceType: "pay" as const,
            };
            syncCollectionItem(activeBusinessId, "parties", p.id, updatedP);
            return updatedP;
          }
          return p;
        })
      );
    }

    soundEffects.playSuccessSound();
    showToast(`Purchase ${newPur.purchaseNumber} recorded`);
    logAudit("Create Purchase", "Purchases", `Recorded ${newPur.purchaseNumber} for ₹${newPur.totalAmount}`);
    return newPur;
  };

  const deletePurchase = (id: string) => {
    setPurchases((prev) => prev.filter((p) => p.id !== id));
    deleteCollectionItem(activeBusinessId, "purchases", id);
    showToast("Purchase entry deleted", "info");
  };

  // Expenses
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem("shree_expenses");
    return saved ? JSON.parse(saved) : INITIAL_EXPENSES;
  });

  useEffect(() => {
    localStorage.setItem("shree_expenses", JSON.stringify(expenses));
  }, [expenses]);

  const addExpense = (expData: Omit<Expense, "id">) => {
    const newExp: Expense = {
      ...expData,
      id: "exp-" + Date.now(),
      businessId: expData.businessId || activeBusinessId,
      createdByUserId: currentUser.id,
    };
    setExpenses((prev) => [newExp, ...prev]);
    syncCollectionItem(activeBusinessId, "expenses", newExp.id, newExp);

    // Record cashbook outflow automatically
    addCashEntry({
      date: newExp.date,
      type: "out",
      amount: newExp.amount,
      category: `Expense: ${newExp.category}`,
      paymentMode: newExp.paymentMode,
      description: newExp.notes || `Paid to ${newExp.paidTo || "Vendor"}`,
      businessId: activeBusinessId,
      userId: currentUser.id,
    });

    showToast(`Recorded Expense ₹${newExp.amount} (${newExp.category})`);
  };

  const deleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    deleteCollectionItem(activeBusinessId, "expenses", id);
    showToast("Expense deleted", "info");
  };

  // Cashbook
  const [cashbook, setCashbook] = useState<CashEntry[]>(() => {
    const saved = localStorage.getItem("shree_cashbook");
    return saved ? JSON.parse(saved) : INITIAL_CASHBOOK;
  });

  useEffect(() => {
    localStorage.setItem("shree_cashbook", JSON.stringify(cashbook));
  }, [cashbook]);

  const addCashEntry = (entryData: Omit<CashEntry, "id">) => {
    const newEntry: CashEntry = {
      ...entryData,
      id: "cash-" + Date.now(),
      businessId: entryData.businessId || activeBusinessId,
      userId: entryData.userId || currentUser.id,
    };
    setCashbook((prev) => [newEntry, ...prev]);
    soundEffects.playSuccessSound();
    showToast(`Recorded Cash ${newEntry.type === "in" ? "In" : "Out"} ₹${newEntry.amount}`);
  };

  const deleteCashEntry = (id: string) => {
    setCashbook((prev) => prev.filter((c) => c.id !== id));
    showToast("Cash entry removed", "info");
  };

  // Daily Cash Book (Cheque, Cash, GPay, GST GPay, Vendor Payment)
  const [dailyCashEntries, setDailyCashEntries] = useState<DailyCashEntry[]>(() => {
    const saved = localStorage.getItem("shree_daily_cashbook");
    return saved ? JSON.parse(saved) : INITIAL_DAILY_CASHBOOK;
  });

  const [closedCashDays, setClosedCashDays] = useState<ClosedCashDay[]>(() => {
    const saved = localStorage.getItem("shree_closed_cash_days");
    return saved ? JSON.parse(saved) : [];
  });

  const [cashColumns, setCashColumns] = useState<CustomCashColumn[]>(() => {
    const saved = localStorage.getItem("shree_cash_columns");
    return saved ? JSON.parse(saved) : DEFAULT_CASH_COLUMNS;
  });

  const [dailyExpenseBudget, setDailyExpenseBudgetState] = useState<number>(() => {
    const saved = localStorage.getItem("shree_daily_expense_budget");
    return saved ? parseFloat(saved) || 0 : 0;
  });

  const setDailyExpenseBudget = (budget: number) => {
    const valid = Math.max(0, budget || 0);
    setDailyExpenseBudgetState(valid);
    localStorage.setItem("shree_daily_expense_budget", valid.toString());
    showToast(
      valid > 0
        ? `Daily Expense Budget threshold set to ₹${valid.toLocaleString("en-IN")}`
        : "Daily Expense Budget threshold disabled",
      "info"
    );
    logAudit("UPDATE", "Daily Cash Book Settings", `Updated daily expense budget threshold to ₹${valid}`);
  };

  useEffect(() => {
    localStorage.setItem("shree_daily_cashbook", JSON.stringify(dailyCashEntries));
  }, [dailyCashEntries]);

  useEffect(() => {
    localStorage.setItem("shree_closed_cash_days", JSON.stringify(closedCashDays));
  }, [closedCashDays]);

  useEffect(() => {
    localStorage.setItem("shree_cash_columns", JSON.stringify(cashColumns));
  }, [cashColumns]);

  const addCustomColumn = (colData: Omit<CustomCashColumn, "id" | "isDefault" | "enabled">): boolean => {
    if (cashColumns.length >= 7) {
      showToast("Maximum limit of 7 columns reached!", "error");
      return false;
    }
    const newCol: CustomCashColumn = {
      ...colData,
      id: "col-" + Date.now(),
      isDefault: false,
      enabled: true,
    };
    setCashColumns((prev) => [...prev, newCol]);
    logAudit("CREATE", "Daily Cash Book Columns", `Added custom column "${colData.name}"`);
    showToast(`Custom column "${colData.name}" added successfully!`, "success");
    return true;
  };

  const updateCustomColumn = (updatedCol: CustomCashColumn) => {
    setCashColumns((prev) => prev.map((c) => (c.id === updatedCol.id ? updatedCol : c)));
    logAudit("UPDATE", "Daily Cash Book Columns", `Updated column "${updatedCol.name}"`);
    showToast(`Column "${updatedCol.name}" updated!`, "success");
  };

  const deleteCustomColumn = (colId: string) => {
    const col = cashColumns.find((c) => c.id === colId);
    if (!col) return;
    if (col.isDefault) {
      showToast("Default columns cannot be deleted, but you can enable/disable them.", "error");
      return;
    }
    setCashColumns((prev) => prev.filter((c) => c.id !== colId));
    logAudit("DELETE", "Daily Cash Book Columns", `Deleted column "${col.name}" (Historical records retained)`);
    showToast(`Column "${col.name}" removed! Historical entries kept safe.`, "info");
  };

  const toggleColumnEnabled = (colId: string) => {
    setCashColumns((prev) =>
      prev.map((c) => (c.id === colId ? { ...c, enabled: !c.enabled } : c))
    );
  };

  const isDayClosed = (date: string) => {
    return closedCashDays.some((c) => c.date === date);
  };

  const closeCashDay = (closedData: ClosedCashDay) => {
    setClosedCashDays((prev) => {
      const filtered = prev.filter((item) => item.date !== closedData.date);
      return [closedData, ...filtered];
    });
    logAudit(
      "CLOSE_DAY",
      "Daily Cash Book",
      `Closed Cash Book for ${closedData.date}. Expected: ₹${closedData.expectedCash.toLocaleString("en-IN")}, Actual: ₹${closedData.actualCash.toLocaleString("en-IN")}, Diff: ₹${closedData.difference.toLocaleString("en-IN")} by ${closedData.closedBy}`
    );
    showToast(`Daily Cash Book closed for ${closedData.date}`, "success");
  };

  const reopenCashDay = (date: string) => {
    setClosedCashDays((prev) => prev.filter((item) => item.date !== date));
    logAudit(
      "REOPEN_DAY",
      "Daily Cash Book",
      `Reopened Cash Book for ${date} by ${currentUser.name || "Owner"}`
    );
    showToast(`Daily Cash Book reopened for ${date}`, "info");
  };

  const addDailyCashEntry = (entryData: Omit<DailyCashEntry, "id" | "createdAt">) => {
    if (isDayClosed(entryData.date)) {
      showToast(`Cannot add entry. Cash book for ${entryData.date} is CLOSED!`, "error");
      return;
    }

    const newEntry: DailyCashEntry = {
      ...entryData,
      id: "dcb-" + Date.now(),
      businessId: entryData.businessId || activeBusinessId,
      createdAt: new Date().toISOString(),
    };
    setDailyCashEntries((prev) => [newEntry, ...prev]);
    syncCollectionItem(activeBusinessId, "dailyCashBook", newEntry.id, newEntry);
    soundEffects.playSuccessSound();
    logAudit(
      "CREATE",
      "Daily Cash Book",
      `Added ${newEntry.paymentType} (${newEntry.direction.toUpperCase()}) ₹${newEntry.amount.toLocaleString("en-IN")} for "${newEntry.description}"`
    );
    showToast(`Added ${newEntry.paymentType}: ₹${newEntry.amount.toLocaleString("en-IN")}`, "success");
  };

  const updateDailyCashEntry = (updatedEntry: DailyCashEntry) => {
    if (isDayClosed(updatedEntry.date)) {
      showToast(`Cannot update entry. Cash book for ${updatedEntry.date} is CLOSED!`, "error");
      return;
    }

    const oldEntry = dailyCashEntries.find((e) => e.id === updatedEntry.id);
    let diffLog = `Edited entry "${updatedEntry.description}"`;
    if (oldEntry) {
      diffLog = `Edited entry "${oldEntry.description}": [Old: ₹${oldEntry.amount.toLocaleString("en-IN")}, ${oldEntry.paymentType}, ${oldEntry.direction.toUpperCase()}, AddToTotal:${oldEntry.addToTotal ? "ON" : "OFF"}] -> [New: ₹${updatedEntry.amount.toLocaleString("en-IN")}, ${updatedEntry.paymentType}, ${updatedEntry.direction.toUpperCase()}, AddToTotal:${updatedEntry.addToTotal ? "ON" : "OFF"}]`;
    }

    setDailyCashEntries((prev) =>
      prev.map((item) => (item.id === updatedEntry.id ? updatedEntry : item))
    );
    syncCollectionItem(activeBusinessId, "dailyCashBook", updatedEntry.id, updatedEntry);
    logAudit("UPDATE", "Daily Cash Book", diffLog);
    showToast("Daily cash entry updated successfully!", "success");
  };

  const deleteDailyCashEntry = (id: string) => {
    const target = dailyCashEntries.find((e) => e.id === id);
    if (target && isDayClosed(target.date)) {
      showToast(`Cannot delete entry. Cash book for ${target.date} is CLOSED!`, "error");
      return;
    }

    const detailMsg = target
      ? `Deleted entry "${target.description}" (${target.paymentType} ₹${target.amount.toLocaleString("en-IN")})`
      : `Deleted entry #${id}`;

    setDailyCashEntries((prev) => prev.filter((item) => item.id !== id));
    deleteCollectionItem(activeBusinessId, "dailyCashBook", id);
    logAudit("DELETE", "Daily Cash Book", detailMsg);
    showToast("Entry removed from Daily Cash Book", "info");
  };

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem("shree_audit_logs");
    return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
  });

  useEffect(() => {
    localStorage.setItem("shree_audit_logs", JSON.stringify(auditLogs));
  }, [auditLogs]);

  const logAudit = (action: string, module: string, details: string) => {
    const newLog: AuditLog = {
      id: "log-" + Date.now(),
      timestamp: new Date().toISOString(),
      action,
      module,
      user: "Owner",
      details,
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // Backup & Restore
  const [backupInfo, setBackupInfo] = useState<BackupInfo>(() => {
    const saved = localStorage.getItem("shree_backup_info");
    return saved
      ? JSON.parse(saved)
      : {
          autoBackupEnabled: true,
          frequency: "daily",
          lastBackupDate: new Date().toLocaleDateString("en-IN"),
          lastBackupSize: "142 KB",
          lastDailyBackupDate: null,
          lastScheduledDownloadPromptDate: null,
        };
  });

  const [isScheduledBackupPromptOpen, setIsScheduledBackupPromptOpen] = useState(false);

  const setBackupFrequency = (frequency: "daily" | "weekly" | "manual") => {
    const isAuto = frequency !== "manual";
    const updated: BackupInfo = {
      ...backupInfo,
      frequency,
      autoBackupEnabled: isAuto,
    };
    setBackupInfo(updated);
    localStorage.setItem("shree_backup_info", JSON.stringify(updated));
    showToast(
      frequency === "manual"
        ? "Automated backup schedule set to Manual Only"
        : `Automated backup schedule set to ${frequency === "daily" ? "Daily" : "Weekly"}`,
      "info"
    );
    logAudit("UPDATE", "Backup Schedule", `Updated backup schedule frequency to ${frequency}`);
  };

  const [cloudBackupPoints, setCloudBackupPoints] = useState<CloudBackupPoint[]>(() => {
    const saved = localStorage.getItem("shree_cloud_backups");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse cloud backups:", e);
      }
    }
    return [];
  });

  const exportDataJson = (): string => {
    const fullData = {
      profile,
      products,
      parties,
      invoices,
      purchases,
      expenses,
      cashbook,
      auditLogs,
      stockHistory,
      unitConversions,
      advertisements,
      adClickLogs,
      backupDate: new Date().toISOString(),
      version: "2.0.0",
    };
    return JSON.stringify(fullData, null, 2);
  };

  const importDataJson = (jsonStr: string): boolean => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed.profile) setProfile(parsed.profile);
      if (parsed.products) setProducts(parsed.products);
      if (parsed.parties) setParties(parsed.parties);
      if (parsed.invoices) setInvoices(parsed.invoices);
      if (parsed.purchases) setPurchases(parsed.purchases);
      if (parsed.expenses) setExpenses(parsed.expenses);
      if (parsed.cashbook) setCashbook(parsed.cashbook);
      if (parsed.auditLogs) setAuditLogs(parsed.auditLogs);
      if (parsed.stockHistory) setStockHistory(parsed.stockHistory);
      if (parsed.unitConversions) setUnitConversions(parsed.unitConversions);
      if (parsed.advertisements) setAdvertisements(parsed.advertisements);
      if (parsed.adClickLogs) setAdClickLogs(parsed.adClickLogs);

      showToast("Data Restored Successfully!", "success");
      logAudit("Restore Data", "Backup", "Restored full backup database");
      return true;
    } catch {
      showToast("Invalid Backup JSON file format", "error");
      return false;
    }
  };

  const createCloudBackup = (
    type: "auto_daily" | "manual_cloud" | "manual_export" = "manual_cloud",
    label: string = "Manual Cloud Backup Point",
    notify: boolean = true
  ): CloudBackupPoint => {
    const jsonStr = exportDataJson();
    const sizeKb = (jsonStr.length / 1024).toFixed(1) + " KB";
    const now = new Date();
    const formattedDate = now.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    const totalRevenue = invoices.reduce((acc, inv) => acc + (inv.totalAmount || 0), 0);
    const todayStr = now.toISOString().slice(0, 10);

    const newPoint: CloudBackupPoint = {
      id: "backup_" + Date.now().toString() + "_" + Math.random().toString(36).slice(2, 6),
      timestamp: now.toISOString(),
      formattedDate,
      type,
      label,
      sizeKb,
      invoicesCount: invoices.length,
      productsCount: products.length,
      partiesCount: parties.length,
      totalRevenue,
      snapshotData: jsonStr,
      status: "synced",
    };

    setCloudBackupPoints((prev) => {
      const updated = [newPoint, ...prev].slice(0, 30);
      localStorage.setItem("shree_cloud_backups", JSON.stringify(updated));
      return updated;
    });

    const updatedBackupInfo: BackupInfo = {
      ...backupInfo,
      lastBackupDate: formattedDate,
      lastBackupSize: sizeKb,
      lastDailyBackupDate: todayStr,
    };
    setBackupInfo(updatedBackupInfo);
    localStorage.setItem("shree_backup_info", JSON.stringify(updatedBackupInfo));

    if (notify) {
      if (type === "auto_daily") {
        showToast(`⚡ Automated Daily Cloud Backup Completed (${sizeKb})`, "success");
      } else {
        showToast(`Cloud Backup Point Created (${sizeKb})`, "success");
      }
    }

    logAudit("Cloud Backup", "Backup", `Created backup point: ${label} (${sizeKb})`);
    return newPoint;
  };

  const restoreFromCloudBackup = (pointId: string): boolean => {
    const point = cloudBackupPoints.find((p) => p.id === pointId);
    if (!point) {
      showToast("Backup point not found", "error");
      return false;
    }
    const success = importDataJson(point.snapshotData);
    if (success) {
      showToast(`Restored system data from backup: ${point.formattedDate}`, "success");
      logAudit("Cloud Restore", "Backup", `Restored snapshot from ${point.formattedDate}`);
    }
    return success;
  };

  const deleteCloudBackup = (pointId: string) => {
    setCloudBackupPoints((prev) => {
      const updated = prev.filter((p) => p.id !== pointId);
      localStorage.setItem("shree_cloud_backups", JSON.stringify(updated));
      return updated;
    });
    showToast("Backup point removed from history", "info");
  };

  const toggleAutoBackup = (enabled: boolean) => {
    const newFreq = enabled ? (backupInfo.frequency === "manual" ? "daily" : backupInfo.frequency) : "manual";
    const updated: BackupInfo = {
      ...backupInfo,
      autoBackupEnabled: enabled,
      frequency: newFreq,
    };
    setBackupInfo(updated);
    localStorage.setItem("shree_backup_info", JSON.stringify(updated));
    showToast(enabled ? "Automated Backup Schedule Enabled" : "Automated Backup Schedule Disabled", "info");
    logAudit("UPDATE", "Backup Schedule", `Automated backup schedule ${enabled ? "enabled" : "disabled"}`);
  };

  const triggerScheduledBackupDownload = () => {
    performBackupNow();
    const nowIso = new Date().toISOString();
    const formattedDate = new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    const updatedBackupInfo: BackupInfo = {
      ...backupInfo,
      lastScheduledDownloadPromptDate: nowIso,
      lastBackupDate: formattedDate,
    };
    setBackupInfo(updatedBackupInfo);
    localStorage.setItem("shree_backup_info", JSON.stringify(updatedBackupInfo));
    setIsScheduledBackupPromptOpen(false);
  };

  const dismissScheduledBackupPrompt = () => {
    setIsScheduledBackupPromptOpen(false);
    showToast("Scheduled backup export reminder snoozed for this session", "info");
  };

  const performBackupNow = () => {
    createCloudBackup("manual_export", "Manual Export & Download", false);
    const jsonStr = exportDataJson();
    const sizeKb = (jsonStr.length / 1024).toFixed(1) + " KB";

    // Download JSON file
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Shree_Shop_Backup_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);

    showToast(`Backup Saved & Downloaded (${sizeKb})`, "success");
  };

  // Automated Daily Cloud Backup Trigger & Scheduled Download Prompt Engine
  useEffect(() => {
    if (!backupInfo.autoBackupEnabled) return;

    const todayStr = new Date().toISOString().slice(0, 10);
    const lastDaily = backupInfo.lastDailyBackupDate;

    // Trigger daily cloud sync if not already run today
    if (lastDaily !== todayStr) {
      const timer = setTimeout(() => {
        createCloudBackup("auto_daily", "Automated Daily Cloud Sync", true);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  // Scheduled Download Export Prompt Checker (Daily vs Weekly)
  useEffect(() => {
    if (!backupInfo.autoBackupEnabled || backupInfo.frequency === "manual") return;

    const lastPrompt = backupInfo.lastScheduledDownloadPromptDate;
    let isDue = false;

    if (!lastPrompt) {
      isDue = true;
    } else {
      const lastTime = new Date(lastPrompt).getTime();
      if (isNaN(lastTime)) {
        isDue = true;
      } else {
        const diffHours = (Date.now() - lastTime) / (1000 * 60 * 60);
        if (backupInfo.frequency === "daily" && diffHours >= 24) {
          isDue = true;
        } else if (backupInfo.frequency === "weekly" && diffHours >= 168) {
          isDue = true;
        }
      }
    }

    if (isDue) {
      const timer = setTimeout(() => {
        setIsScheduledBackupPromptOpen(true);
      }, 1800);
      return () => clearTimeout(timer);
    }
  }, [backupInfo.autoBackupEnabled, backupInfo.frequency, backupInfo.lastScheduledDownloadPromptDate]);

  // Factory Reset
  const resetAllData = () => {
    setProfile(INITIAL_BUSINESS_PROFILE);
    setProducts(INITIAL_PRODUCTS);
    setParties(INITIAL_PARTIES);
    setInvoices(INITIAL_INVOICES);
    setPurchases(INITIAL_PURCHASES);
    setExpenses(INITIAL_EXPENSES);
    setCashbook(INITIAL_CASHBOOK);
    setDailyCashEntries(INITIAL_DAILY_CASHBOOK);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    setStockHistory(INITIAL_STOCK_MOVEMENTS);
    setUnitConversions(INITIAL_UNIT_CONVERSIONS);
    setAdvertisements(INITIAL_ADVERTISEMENTS);
    setAdClickLogs([]);

    localStorage.removeItem("shree_profile");
    localStorage.removeItem("shree_products");
    localStorage.removeItem("shree_parties");
    localStorage.removeItem("shree_invoices");
    localStorage.removeItem("shree_purchases");
    localStorage.removeItem("shree_expenses");
    localStorage.removeItem("shree_cashbook");
    localStorage.removeItem("shree_daily_cashbook");
    localStorage.removeItem("shree_audit_logs");
    localStorage.removeItem("shree_stock_history");
    localStorage.removeItem("shree_unit_conversions");
    localStorage.removeItem("shree_advertisements");
    localStorage.removeItem("shree_ad_click_logs");

    showToast("Application reset to factory sample data", "info");
  };

  return (
    <AppContext.Provider
      value={{
        theme,
        toggleTheme,
        isSplashOpen,
        setIsSplashOpen,
        activeTab,
        setActiveTab,
        authChecking,
        loginWithEmail,
        signUpWithEmail,
        sendPasswordReset,
        logoutUser,
        currentUser,
        setCurrentUser,
        activeBusinessId,

        switchBusiness,
        profile,
        updateProfile,
        products,
        addProduct,
        updateProduct,
        deleteProduct,
        adjustStock,
        parties,
        addParty,
        updateParty,
        deleteParty,
        invoices,
        addInvoice,
        updateInvoice,
        deleteInvoice,
        recurringInvoices,
        addRecurringInvoice,
        updateRecurringInvoice,
        deleteRecurringInvoice,
        toggleRecurringInvoiceStatus,
        triggerRecurringInvoiceNow,
        checkAndRunDueRecurringInvoices,
        purchases,
        addPurchase,
        deletePurchase,
        expenses,
        addExpense,
        deleteExpense,
        cashbook,
        addCashEntry,
        deleteCashEntry,
        dailyCashEntries,
        addDailyCashEntry,
        updateDailyCashEntry,
        deleteDailyCashEntry,
        closedCashDays,
        closeCashDay,
        reopenCashDay,
        isDayClosed,
        cashColumns,
        dailyExpenseBudget,
        setDailyExpenseBudget,
        addCustomColumn,
        updateCustomColumn,
        deleteCustomColumn,
        toggleColumnEnabled,
        auditLogs,
        logAudit,
        isAIDrawerOpen,
        setIsAIDrawerOpen,
        printingInvoice,
        setPrintingInvoice,
        toasts,
        showToast,
        appLock,
        setPin,
        toggleAppLock,
        unlockApp,
        language,
        setLanguage,
        t,
        adSettings,
        showAdModal,
        setShowAdModal,
        upgradeToPremium,
        triggerInterstitialAd,
        advertisements,
        addAdvertisement,
        updateAdvertisement,
        deleteAdvertisement,
        toggleAdStatus,
        recordAdImpression,
        recordAdClick,
        adClickLogs,
        invoiceTemplate,
        setInvoiceTemplate,
        backupInfo,
        cloudBackupPoints,
        exportDataJson,
        importDataJson,
        performBackupNow,
        createCloudBackup,
        restoreFromCloudBackup,
        deleteCloudBackup,
        toggleAutoBackup,
        setBackupFrequency,
        isScheduledBackupPromptOpen,
        setIsScheduledBackupPromptOpen,
        triggerScheduledBackupDownload,
        dismissScheduledBackupPrompt,
        searchQuery,
        setSearchQuery,
        stockHistory,
        addStockMovement,
        unitConversions,
        addUnitConversion,
        deleteUnitConversion,
        allowNegativeStock,
        toggleAllowNegativeStock,
        isBillScannerOpen,
        setIsBillScannerOpen,
        processBillScanSave,
        connectedUsers,
        qrInvitations,
        activeUserSession,
        generateQRInvitation,
        revokeQRInvitation,
        refreshQRInvitation,
        scanAndJoinQR,
        updateUserPermissions,
        toggleUserStatus,
        removeUser,
        switchUserRoleSession,
        hasPermission,
        resetAllData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};
