import React, { useState, useRef, useEffect } from "react";
import {
  QrCode,
  Users,
  UserCheck,
  ShieldAlert,
  ShieldCheck,
  Plus,
  Copy,
  Share2,
  RefreshCw,
  Trash2,
  Power,
  Edit3,
  Camera,
  CheckCircle2,
  AlertTriangle,
  X,
  Scan,
  Clock,
  Laptop,
  Smartphone,
  Lock,
  ChevronRight,
  Sparkles,
  Info,
  Check,
  Key,
  Shield,
  FileText,
  UserPlus,
  Search,
  CheckSquare,
  Square,
  Download,
} from "lucide-react";
import QRCode from "qrcode";
import { useApp } from "../context/AppContext";
import { BusinessUser, BusinessUserRole, PermissionKey, QRInvitation } from "../types";
import { INITIAL_ROLE_PERMISSIONS } from "../data/seedData";

const ALL_PERMISSIONS: { key: PermissionKey; label: string; desc: string; category: string }[] = [
  { key: "dashboard", label: "Dashboard", desc: "View store KPI overview & sales charts", category: "Core Modules" },
  { key: "invoice", label: "Invoice & Sales", desc: "Create, view & print Sales Invoices and Credit Notes", category: "Core Modules" },
  { key: "quotation", label: "Quotation & Estimates", desc: "Generate Quotations and Proforma Invoices", category: "Core Modules" },
  { key: "challan", label: "Delivery Challan", desc: "Generate Goods Delivery Challans", category: "Core Modules" },
  { key: "purchase", label: "Stock Purchase", desc: "Record Supplier Purchases & Purchase Orders", category: "Core Modules" },
  { key: "products", label: "Products / Stock", desc: "Manage Inventory, Stock Movements & Barcodes", category: "Core Modules" },
  { key: "customers", label: "Customers & Vendors", desc: "Access Customer directory and Supplier contacts", category: "Master Data" },
  { key: "ledger", label: "Party Ledger", desc: "View Customer/Vendor payment ledgers & cashbook", category: "Financials" },
  { key: "daily_cashbook", label: "Daily Cash Book", desc: "Manage multi-column Daily Cash Register", category: "Financials" },
  { key: "reports", label: "Reports & Analytics", desc: "View P&L, Sales Reports & GST Analytics", category: "Financials" },
  { key: "gst_summary", label: "GST / CA Summary", desc: "Generate Monthly GST & CA Return summaries", category: "Financials" },
  { key: "settings", label: "System Settings", desc: "Modify Business Profile, Printers & Multi-User controls", category: "Administration" },
  { key: "edit_records", label: "Edit Records", desc: "Modify existing Invoices, Products and Entries", category: "Action Controls" },
  { key: "delete_records", label: "Delete Records", desc: "Delete Invoices, Bills or Master Data", category: "Action Controls" },
  { key: "export_pdf_excel", label: "Export PDF / Excel", desc: "Download PDF documents and Excel files", category: "Action Controls" },
];

export const MultiUserAccess: React.FC = () => {
  const {
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
    profile,
    showToast,
    auditLogs,
  } = useApp();

  const [activeTab, setActiveTab] = useState<"users" | "qr_generator" | "scan_qr" | "audit">("users");
  const [searchTerm, setSearchTerm] = useState("");

  // QR Generation State
  const [genName, setGenName] = useState("Counter Staff Member");
  const [genRole, setGenRole] = useState<BusinessUserRole>("staff");
  const [genPermissions, setGenPermissions] = useState<PermissionKey[]>(INITIAL_ROLE_PERMISSIONS.staff);
  const [genExpiryMins, setGenExpiryMins] = useState<number | null>(1440); // default 24h
  const [genIsOneTime, setGenIsOneTime] = useState(true);
  const [activeGeneratedQR, setActiveGeneratedQR] = useState<QRInvitation | null>(null);

  // Scanner State
  const [inputToken, setInputToken] = useState("");
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Edit User Modal State
  const [editingUser, setEditingUser] = useState<BusinessUser | null>(null);
  const [editRole, setEditRole] = useState<BusinessUserRole>("staff");
  const [editPermissions, setEditPermissions] = useState<PermissionKey[]>([]);

  // Confirmation Modals State
  const [userToRemove, setUserToRemove] = useState<BusinessUser | null>(null);
  const [qrToRevoke, setQrToRevoke] = useState<QRInvitation | null>(null);

  // QR Canvas Ref for rendering active QR
  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Handle Role Change in Generator
  const handleRoleSelectInGenerator = (role: BusinessUserRole) => {
    setGenRole(role);
    setGenPermissions(INITIAL_ROLE_PERMISSIONS[role]);
  };

  // Toggle Single Permission in Generator
  const toggleGenPermission = (key: PermissionKey) => {
    if (genPermissions.includes(key)) {
      setGenPermissions(genPermissions.filter((p) => p !== key));
    } else {
      setGenPermissions([...genPermissions, key]);
    }
  };

  // Select All / Deselect All in Generator
  const toggleAllGenPermissions = () => {
    if (genPermissions.length === ALL_PERMISSIONS.length) {
      setGenPermissions([]);
    } else {
      setGenPermissions(ALL_PERMISSIONS.map((p) => p.key));
    }
  };

  // Handle Generate QR Submit
  const handleGenerateQR = (e: React.FormEvent) => {
    e.preventDefault();
    if (!genName.trim()) {
      showToast("Please enter user / staff designation name", "warning");
      return;
    }

    const newQr = generateQRInvitation({
      userName: genName.trim(),
      role: genRole,
      permissions: genPermissions,
      accessExpiryMinutes: genExpiryMins,
      isOneTime: genIsOneTime,
    });

    setActiveGeneratedQR(newQr);
    showToast(`QR Code created for ${genName}!`, "success");
  };

  // Render QR Canvas whenever activeGeneratedQR changes
  useEffect(() => {
    if (activeGeneratedQR && qrCanvasRef.current) {
      QRCode.toCanvas(
        qrCanvasRef.current,
        activeGeneratedQR.tokenSecret || activeGeneratedQR.id,
        {
          width: 220,
          margin: 2,
          color: { dark: "#1e1b4b", light: "#ffffff" },
        },
        (err) => {
          if (err) console.error("QR Code Render error:", err);
        }
      );
    }
  }, [activeGeneratedQR]);

  // Camera Control for Scanning
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsCameraActive(true);
      showToast("Live Camera stream active for QR scanning", "info");
    } catch (err: any) {
      showToast("Camera access unavailable. Use manual token input below.", "warning");
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Handle Scan Submit
  const handleVerifyTokenSubmit = (tokenStr: string) => {
    if (!tokenStr.trim()) {
      showToast("Please paste or scan a QR Invitation token", "warning");
      return;
    }

    setIsScanning(true);
    setTimeout(() => {
      const res = scanAndJoinQR(tokenStr.trim());
      setIsScanning(false);
      if (res.success) {
        stopCamera();
        setInputToken("");
        setActiveTab("users");
      } else {
        showToast(res.message, "error");
      }
    }, 600);
  };

  // Handle Copy Invite Link
  const handleCopyInvite = (inv: QRInvitation) => {
    const textToCopy = `SHREE BILLING QR ACCESS INVITATION\nBusiness: ${profile.name}\nDesignation: ${inv.userName}\nRole: ${inv.role.toUpperCase()}\nToken: ${inv.tokenSecret}\nExpires: ${inv.expiresAt ? new Date(inv.expiresAt).toLocaleString() : "Never"}`;
    navigator.clipboard.writeText(textToCopy);
    showToast("Invitation details & token copied to clipboard!", "success");
  };

  // Handle Share QR Code
  const handleShareQR = async (inv: QRInvitation) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join ${profile.name} Staff Access`,
          text: `Scan QR code or use token: ${inv.tokenSecret} to join ${profile.name} as ${inv.role.toUpperCase()}`,
        });
        showToast("QR Invitation shared successfully", "success");
      } catch (err) {
        handleCopyInvite(inv);
      }
    } else {
      handleCopyInvite(inv);
    }
  };

  // Handle Download QR Image
  const handleDownloadQR = async (inv: QRInvitation) => {
    try {
      const dataUrl = await QRCode.toDataURL(inv.tokenSecret, { width: 400, margin: 2 });
      const link = document.createElement("a");
      link.download = `QR_Invite_${inv.userName.replace(/\s+/g, "_")}_${inv.role}.png`;
      link.href = dataUrl;
      link.click();
      showToast("QR Code image downloaded!", "success");
    } catch (err) {
      showToast("Failed to download QR image", "error");
    }
  };

  // Filter Connected Users
  const filteredUsers = connectedUsers.filter(
    (u) =>
      u.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-500/20 via-transparent to-transparent pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-200 text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              <span>Multi-User Access & Granular Permissions</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Multi-User Access & QR Scanner
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl font-medium">
              Securely connect staff, managers, and accountants via QR scan. Control granular permissions across all 15 business modules without sharing private passwords.
            </p>
          </div>

          {/* Quick Active Session Switcher Box */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl flex flex-col sm:items-end gap-2 shrink-0">
            <div className="text-xs text-slate-300 font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Active Session:</span>
              <strong className="text-white font-extrabold">{activeUserSession.userName}</strong>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-lg bg-purple-500 text-white font-black text-[10px] uppercase">
                Role: {activeUserSession.role}
              </span>
              <span className="text-[11px] text-slate-300">
                ({activeUserSession.permissions.length} Modules Authorized)
              </span>
            </div>
            {/* Session Simulator Dropdown */}
            <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-300">
              <span className="text-slate-400">Simulate View:</span>
              <select
                value={activeUserSession.id}
                onChange={(e) => switchUserRoleSession(e.target.value)}
                className="bg-slate-900/90 text-purple-200 border border-purple-400/40 rounded-lg px-2 py-1 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-purple-400 cursor-pointer"
              >
                {connectedUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.userName} ({u.role.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Quick KPI Stats Bar */}
        <div className="mt-6 pt-6 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
            <p className="text-[10px] uppercase font-bold text-slate-400">Connected Users</p>
            <p className="text-xl font-black text-white">{connectedUsers.length}</p>
          </div>
          <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
            <p className="text-[10px] uppercase font-bold text-slate-400">Active QR Invites</p>
            <p className="text-xl font-black text-purple-300">
              {qrInvitations.filter((i) => !i.isRevoked).length}
            </p>
          </div>
          <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
            <p className="text-[10px] uppercase font-bold text-slate-400">Owner Account</p>
            <p className="text-sm font-bold text-emerald-300 truncate">{profile.name}</p>
          </div>
          <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
            <p className="text-[10px] uppercase font-bold text-slate-400">Security Rule</p>
            <p className="text-xs font-bold text-amber-300">Token Auth + Zero Passwords</p>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab("users")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer ${
              activeTab === "users"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Connected Users ({connectedUsers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("qr_generator")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer ${
              activeTab === "qr_generator"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>Generate QR Invitation</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("scan_qr");
              startCamera();
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer ${
              activeTab === "scan_qr"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                : "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
            }`}
          >
            <Scan className="w-4 h-4" />
            <span>Scan QR to Join</span>
          </button>

          <button
            onClick={() => setActiveTab("audit")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer ${
              activeTab === "audit"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Security Logs</span>
          </button>
        </div>

        {/* Generate Quick QR Trigger */}
        <button
          onClick={() => setActiveTab("qr_generator")}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-extrabold transition-all shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Generate QR Code</span>
        </button>
      </div>

      {/* VIEW 1: CONNECTED USERS LIST */}
      {activeTab === "users" && (
        <div className="space-y-6">
          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search staff name, role, email..."
                className="w-full pl-10 pr-4 py-2 text-xs font-bold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-bold">
              Showing {filteredUsers.length} of {connectedUsers.length} users
            </div>
          </div>

          {/* User Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredUsers.map((user) => {
              const isOwner = user.role === "owner";
              const isActive = user.status === "active";

              return (
                <div
                  key={user.id}
                  className={`bg-white dark:bg-slate-900 rounded-3xl p-5 border transition-all shadow-sm flex flex-col justify-between ${
                    isOwner
                      ? "border-purple-300 dark:border-purple-800 ring-2 ring-purple-500/20"
                      : isActive
                      ? "border-slate-200 dark:border-slate-800 hover:border-purple-400 dark:hover:border-purple-700"
                      : "border-rose-200 dark:border-rose-950/80 bg-slate-50/50 dark:bg-slate-900/40 opacity-75"
                  }`}
                >
                  <div>
                    {/* Top User Info Header */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-11 h-11 rounded-2xl font-black text-sm flex items-center justify-center text-white shadow-md ${
                            isOwner
                              ? "bg-gradient-to-tr from-purple-600 to-indigo-600"
                              : user.role === "admin"
                              ? "bg-blue-600"
                              : user.role === "manager"
                              ? "bg-emerald-600"
                              : "bg-slate-700"
                          }`}
                        >
                          {user.userName.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <span>{user.userName}</span>
                            {isOwner && (
                              <span className="text-[10px] bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded-md font-black border border-purple-300 dark:border-purple-800">
                                OWNER
                              </span>
                            )}
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                            {user.email || user.phone || "Internal Staff Account"}
                          </p>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          isActive
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300"
                            : "bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300"
                        }`}
                      >
                        {user.status}
                      </span>
                    </div>

                    {/* Role & Expiry Pill */}
                    <div className="flex flex-wrap items-center gap-2 mb-4 text-xs">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border border-slate-200 dark:border-slate-700 uppercase text-[11px]">
                        Role: {user.role}
                      </span>
                      <span className="text-[11px] text-slate-500 font-semibold flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {user.accessExpiry ? `Expires: ${new Date(user.accessExpiry).toLocaleDateString()}` : "Access: Unlimited"}
                      </span>
                    </div>

                    {/* Device & Active Time */}
                    <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl mb-4 text-xs space-y-1">
                      <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 font-semibold">
                        <span className="flex items-center gap-1.5 text-[11px]">
                          <Laptop className="w-3.5 h-3.5 text-indigo-500" />
                          Device:
                        </span>
                        <span className="font-extrabold text-[11px] text-slate-800 dark:text-slate-200 truncate max-w-[150px]">
                          {user.lastDevice || "Windows Chrome"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-slate-500 text-[11px]">
                        <span>Last Active:</span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">{user.lastActiveAt || "Just now"}</span>
                      </div>
                    </div>

                    {/* Permissions Summary Tags */}
                    <div className="mb-4">
                      <p className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider mb-1.5">
                        Assigned Permissions ({user.permissions.length} / 15):
                      </p>
                      <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto pr-1">
                        {user.permissions.map((pKey) => {
                          const info = ALL_PERMISSIONS.find((item) => item.key === pKey);
                          return (
                            <span
                              key={pKey}
                              className="px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-900 text-purple-700 dark:text-purple-300 text-[10px] font-bold"
                            >
                              {info?.label || pKey}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Fully Functional Action Buttons */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      {/* Edit User Button */}
                      <button
                        type="button"
                        onClick={() => {
                          setEditingUser(user);
                          setEditRole(user.role);
                          setEditPermissions(user.permissions);
                        }}
                        className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-slate-700 dark:text-slate-300 hover:text-purple-600 transition-colors cursor-pointer"
                        title="Edit User & Permissions"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      {/* Deactivate / Reactivate Button */}
                      {!isOwner && (
                        <button
                          type="button"
                          onClick={() => toggleUserStatus(user.id)}
                          className={`p-2 rounded-xl transition-colors cursor-pointer ${
                            isActive
                              ? "bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 text-amber-700 dark:text-amber-300"
                              : "bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300"
                          }`}
                          title={isActive ? "Deactivate User Access" : "Reactivate User Access"}
                        >
                          <Power className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {!isOwner && (
                      <button
                        type="button"
                        onClick={() => setUserToRemove(user)}
                        className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900 text-rose-700 dark:text-rose-300 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                        title="Remove User Access"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove User</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 2: GENERATE QR INVITATION */}
      {activeTab === "qr_generator" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Form (7 Cols) */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400">
                <QrCode className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white">
                  Generate Secure QR Code Invitation
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Configure role, granular permissions, and expiration for new staff member
                </p>
              </div>
            </div>

            <form onSubmit={handleGenerateQR} className="space-y-5">
              {/* Staff / User Name */}
              <div>
                <label className="block text-xs font-extrabold uppercase text-slate-700 dark:text-slate-300 mb-1.5">
                  Staff Member / Designation Name *
                </label>
                <input
                  type="text"
                  required
                  value={genName}
                  onChange={(e) => setGenName(e.target.value)}
                  placeholder="e.g. Rahul Sharma - Counter Staff"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Role Preset Selector */}
              <div>
                <label className="block text-xs font-extrabold uppercase text-slate-700 dark:text-slate-300 mb-1.5">
                  Select Permission Role Preset
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(["admin", "manager", "staff", "view_only"] as BusinessUserRole[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => handleRoleSelectInGenerator(r)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        genRole === r
                          ? "bg-purple-50 dark:bg-purple-950/80 border-purple-500 ring-2 ring-purple-500/20 text-purple-900 dark:text-purple-200 font-extrabold"
                          : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                      }`}
                    >
                      <p className="text-xs font-black uppercase">{r.replace("_", " ")}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {INITIAL_ROLE_PERMISSIONS[r].length} Permissions
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Access Expiration Duration */}
              <div>
                <label className="block text-xs font-extrabold uppercase text-slate-700 dark:text-slate-300 mb-1.5">
                  Access Expiration / Validity
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  {[
                    { label: "15 Minutes", val: 15 },
                    { label: "1 Hour", val: 60 },
                    { label: "24 Hours (1 Day)", val: 1440 },
                    { label: "7 Days", val: 10080 },
                    { label: "Never (Unlimited)", val: null },
                  ].map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => setGenExpiryMins(item.val)}
                      className={`py-2 px-3 rounded-xl border font-bold transition-all text-center cursor-pointer ${
                        genExpiryMins === item.val
                          ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                          : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* One-Time Use Checkbox */}
              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-purple-50/60 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900">
                <input
                  type="checkbox"
                  id="one-time-check"
                  checked={genIsOneTime}
                  onChange={(e) => setGenIsOneTime(e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500 cursor-pointer"
                />
                <label htmlFor="one-time-check" className="text-xs font-bold text-purple-900 dark:text-purple-200 cursor-pointer">
                  One-Time Scan QR Code (QR automatically expires after staff scans it once)
                </label>
              </div>

              {/* Granular Permission Checklist */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-extrabold uppercase text-slate-700 dark:text-slate-300">
                    Granular Module Permissions ({genPermissions.length} / {ALL_PERMISSIONS.length})
                  </label>
                  <button
                    type="button"
                    onClick={toggleAllGenPermissions}
                    className="text-xs text-purple-600 dark:text-purple-400 font-bold hover:underline cursor-pointer"
                  >
                    {genPermissions.length === ALL_PERMISSIONS.length ? "Deselect All" : "Select All"}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto p-1 border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-slate-800/40">
                  {ALL_PERMISSIONS.map((perm) => {
                    const isChecked = genPermissions.includes(perm.key);
                    return (
                      <div
                        key={perm.key}
                        onClick={() => toggleGenPermission(perm.key)}
                        className={`p-2.5 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-all ${
                          isChecked
                            ? "bg-white dark:bg-slate-800 border-purple-400 dark:border-purple-700 shadow-2xs text-slate-900 dark:text-white"
                            : "bg-transparent border-transparent text-slate-500 dark:text-slate-400 opacity-70 hover:opacity-100"
                        }`}
                      >
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-purple-600 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400 shrink-0" />
                        )}
                        <div>
                          <p className="text-xs font-bold leading-tight">{perm.label}</p>
                          <p className="text-[10px] text-slate-400">{perm.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black text-sm transition-all shadow-lg shadow-purple-600/25 flex items-center justify-center gap-2 cursor-pointer"
              >
                <QrCode className="w-5 h-5" />
                <span>Generate QR Code</span>
              </button>
            </form>
          </div>

          {/* Right Rendered QR Preview Card (5 Cols) */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center text-center space-y-6">
            <div className="w-full text-left">
              <span className="text-xs font-extrabold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                Live QR Code Card
              </span>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {activeGeneratedQR ? activeGeneratedQR.userName : "Generated QR Display"}
              </h3>
            </div>

            {/* QR Canvas Box */}
            <div className="p-6 bg-white rounded-3xl border-2 border-purple-200 shadow-inner flex flex-col items-center justify-center">
              <canvas ref={qrCanvasRef} className="w-56 h-56" />
              <p className="text-[11px] font-mono text-slate-500 mt-2">
                Business: <strong className="text-slate-900">{profile.name}</strong>
              </p>
            </div>

            {/* QR Details */}
            {activeGeneratedQR ? (
              <div className="w-full space-y-3 text-left bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-bold">Role:</span>
                  <span className="font-extrabold uppercase text-purple-600 bg-purple-100 dark:bg-purple-950 px-2 py-0.5 rounded-md">
                    {activeGeneratedQR.role}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-bold">Expires:</span>
                  <span className="font-extrabold text-slate-800 dark:text-slate-200">
                    {activeGeneratedQR.expiresAt ? new Date(activeGeneratedQR.expiresAt).toLocaleString() : "Never"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-bold">One-Time Scan:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {activeGeneratedQR.isOneTime ? "Yes (1 Use Only)" : "Multi-Device Allowed"}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-400 uppercase font-extrabold">Token Code:</span>
                  <p className="font-mono text-[10px] text-slate-700 dark:text-slate-300 break-all bg-white dark:bg-slate-900 p-2 rounded-lg mt-1 border border-slate-200 dark:border-slate-800">
                    {activeGeneratedQR.tokenSecret}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400">
                Click &quot;Generate QR Code&quot; on the left to render staff invitation QR
              </p>
            )}

            {/* Functional Buttons for Active Generated QR */}
            {activeGeneratedQR && (
              <div className="w-full grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleCopyInvite(activeGeneratedQR)}
                  className="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Copy className="w-4 h-4 text-purple-500" />
                  <span>Copy Invite</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleShareQR(activeGeneratedQR)}
                  className="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Share2 className="w-4 h-4 text-indigo-500" />
                  <span>Share QR</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDownloadQR(activeGeneratedQR)}
                  className="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-4 h-4 text-emerald-500" />
                  <span>Download Image</span>
                </button>

                <button
                  type="button"
                  onClick={() => setQrToRevoke(activeGeneratedQR)}
                  className="py-2.5 px-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-700 dark:text-rose-300 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Revoke QR</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 3: STAFF SCAN QR TO JOIN */}
      {activeTab === "scan_qr" && (
        <div className="max-w-2xl mx-auto bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-md space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400">
              <Scan className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              Scan Owner&apos;s QR Code to Join Business
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Scan the QR code displayed on owner&apos;s device or paste the token code to authenticate securely.
            </p>
          </div>

          {/* WebCam Feed Box */}
          <div className="relative rounded-3xl overflow-hidden bg-slate-900 border-2 border-emerald-500/40 h-64 flex items-center justify-center">
            {isCameraActive ? (
              <video ref={videoRef} className="w-full h-full object-cover" />
            ) : (
              <div className="text-center space-y-3 p-4">
                <Camera className="w-12 h-12 text-emerald-400 mx-auto animate-pulse" />
                <p className="text-xs font-bold text-slate-300">Camera stream ready</p>
                <button
                  type="button"
                  onClick={startCamera}
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-colors cursor-pointer"
                >
                  Enable Camera Stream
                </button>
              </div>
            )}

            {/* Scanner Viewfinder Overlay */}
            <div className="absolute inset-0 border-4 border-emerald-400/60 rounded-3xl pointer-events-none flex items-center justify-center">
              <div className="w-48 h-48 border-2 border-dashed border-emerald-300 rounded-2xl animate-pulse" />
            </div>
          </div>

          {/* Manual Token Code Input */}
          <div className="space-y-3 pt-2">
            <label className="block text-xs font-extrabold uppercase text-slate-700 dark:text-slate-300">
              Or Paste QR Invitation Token Code:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={inputToken}
                onChange={(e) => setInputToken(e.target.value)}
                placeholder="Paste token or token ID (e.g. inv_qr_counter_88)..."
                className="flex-1 px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="button"
                onClick={() => handleVerifyTokenSubmit(inputToken)}
                disabled={isScanning}
                className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs transition-all shadow-md shadow-emerald-600/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isScanning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                <span>Verify QR</span>
              </button>
            </div>
          </div>

          {/* Quick Demo Test Buttons */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
            <p className="text-[11px] font-extrabold uppercase text-slate-500">Quick Demo Scanner Shortcuts:</p>
            <div className="flex flex-wrap gap-2">
              {qrInvitations.map((inv) => (
                <button
                  key={inv.id}
                  type="button"
                  onClick={() => handleVerifyTokenSubmit(inv.tokenSecret)}
                  className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold hover:bg-emerald-50 cursor-pointer"
                >
                  Scan Demo: {inv.userName} ({inv.role.toUpperCase()})
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 4: SECURITY AUDIT LOG */}
      {activeTab === "audit" && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Access Audit Logs & Multi-User Events
              </h3>
              <p className="text-xs text-slate-500">
                Logged events for logins, QR invitations, permissions, and revocations
              </p>
            </div>
            <span className="text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-xl">
              {auditLogs.filter((l) => l.module === "Multi-User Access").length} Logs
            </span>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {auditLogs
              .filter((l) => l.module === "Multi-User Access" || l.module === "Subscription")
              .map((log) => (
                <div
                  key={log.id}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs flex items-start justify-between gap-3"
                >
                  <div className="space-y-1">
                    <span className="px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-extrabold text-[10px] uppercase">
                      {log.action}
                    </span>
                    <p className="font-bold text-slate-800 dark:text-slate-200">{log.details}</p>
                    <p className="text-[10px] text-slate-400">By {log.user}</p>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 shrink-0">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* MODAL 1: EDIT USER & PERMISSIONS */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Edit User & Module Permissions
                </h3>
                <p className="text-xs text-slate-500">
                  User: <strong className="text-purple-600">{editingUser.userName}</strong>
                </p>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Role Preset */}
            <div>
              <label className="block text-xs font-extrabold uppercase text-slate-700 dark:text-slate-300 mb-2">
                User Role Preset
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {(["admin", "manager", "staff", "view_only"] as BusinessUserRole[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      setEditRole(r);
                      setEditPermissions(INITIAL_ROLE_PERMISSIONS[r]);
                    }}
                    className={`py-2 px-3 rounded-xl border font-bold uppercase transition-all cursor-pointer ${
                      editRole === r
                        ? "bg-purple-600 text-white border-purple-600"
                        : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {r.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>

            {/* Granular Permission Toggles */}
            <div>
              <label className="block text-xs font-extrabold uppercase text-slate-700 dark:text-slate-300 mb-2">
                Granular Permission Matrix ({editPermissions.length} / 15 Enabled)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto p-1 border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-slate-800/40">
                {ALL_PERMISSIONS.map((perm) => {
                  const isChecked = editPermissions.includes(perm.key);
                  return (
                    <div
                      key={perm.key}
                      onClick={() => {
                        if (isChecked) {
                          setEditPermissions(editPermissions.filter((p) => p !== perm.key));
                        } else {
                          setEditPermissions([...editPermissions, perm.key]);
                        }
                      }}
                      className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                        isChecked
                          ? "bg-white dark:bg-slate-800 border-purple-400 dark:border-purple-700 shadow-2xs"
                          : "bg-transparent border-transparent text-slate-400"
                      }`}
                    >
                      {isChecked ? (
                        <CheckSquare className="w-4 h-4 text-purple-600 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                      <div>
                        <p className="text-xs font-bold leading-tight text-slate-900 dark:text-white">{perm.label}</p>
                        <p className="text-[10px] text-slate-400">{perm.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  updateUserPermissions(editingUser.id, editRole, editPermissions);
                  setEditingUser(null);
                }}
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs shadow-md shadow-purple-600/20 cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL 1: REMOVE USER */}
      {userToRemove && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 max-w-md w-full rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Confirm Remove User
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
              Are you sure you want to remove business access for <strong className="text-slate-900 dark:text-white">{userToRemove.userName}</strong>?
              They will immediately lose access to all modules and reports.
            </p>
            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setUserToRemove(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  removeUser(userToRemove.id);
                  setUserToRemove(null);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md shadow-rose-600/20 cursor-pointer"
              >
                Remove User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL 2: REVOKE QR */}
      {qrToRevoke && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 max-w-md w-full rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <ShieldAlert className="w-6 h-6" />
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Confirm Revoke QR Code
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
              Are you sure you want to revoke the QR Code invitation for <strong className="text-slate-900 dark:text-white">{qrToRevoke.userName}</strong>?
              No one will be able to join using this token anymore.
            </p>
            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setQrToRevoke(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  revokeQRInvitation(qrToRevoke.id);
                  setQrToRevoke(null);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md shadow-rose-600/20 cursor-pointer"
              >
                Revoke QR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
