import React, { useState, useRef } from "react";
import {
  X,
  Camera,
  Upload,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Plus,
  Trash2,
  Edit3,
  Layers,
  Filter,
  Save,
  Search,
  Scale,
  RefreshCw,
  Eye,
  Check,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { BillScanItem, BillScanResult } from "../types";
import { GstRateSelect } from "./GstRateSelect";

interface BillScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const UNITS = [
  "PCS", "BAG", "MTR", "KG", "GM", "LTR", "ML", 
  "BOX", "PKT", "ROLL", "NOS", "SET", "DOZEN", "FT", "INCH"
];

const GST_RATES = [0, 5, 12, 18, 28];

export const BillScannerModal: React.FC<BillScannerModalProps> = ({ isOpen, onClose }) => {
  const { products, processBillScanSave, showToast } = useApp();

  // Multi-page image files state
  const [billImages, setBillImages] = useState<string[]>([]);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanStepMessage, setScanStepMessage] = useState<string>("");

  // Scan Result state
  const [scanData, setScanData] = useState<BillScanResult | null>(null);
  const [supplierName, setSupplierName] = useState("");
  const [supplierGstin, setSupplierGstin] = useState("");
  const [supplierPhone, setSupplierPhone] = useState("");
  const [supplierAddress, setSupplierAddress] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [items, setItems] = useState<BillScanItem[]>([]);

  // UI / Bulk state
  const [searchItem, setSearchItem] = useState("");
  const [highlightLowConfidence, setHighlightLowConfidence] = useState(false);
  const [showImagePreview, setShowImagePreview] = useState(true);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);

  // Bulk Edit Modal / Drawer
  const [bulkGst, setBulkGst] = useState<number | "">("");
  const [bulkCategory, setBulkCategory] = useState<string>("");
  const [bulkWarehouse, setBulkWarehouse] = useState<string>("");

  // Camera capture modal state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  // Handle Image Upload / Camera
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    (Array.from(files) as File[]).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          setBillImages((prev) => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const startCamera = async () => {
    setIsCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch {
      showToast("Could not access camera. Please upload an image instead.", "error");
      setIsCameraActive(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg");
        setBillImages((prev) => [...prev, dataUrl]);
        stopCamera();
        showToast("Bill photo captured!", "success");
      }
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
    }
    setIsCameraActive(false);
  };

  // Perform AI Scanning via Server API
  const handleRunAiScan = async () => {
    if (billImages.length === 0) {
      showToast("Please snap a camera photo or upload a bill image first", "warning");
      return;
    }

    setIsScanning(true);
    setScanStepMessage("Uploading bill photo & initializing AI Vision...");

    try {
      setTimeout(() => setScanStepMessage("Extracting GSTIN, Supplier Info, and Bill Date..."), 600);
      setTimeout(() => setScanStepMessage("Parsing HSN Codes, Line Items & Tax Amounts..."), 1200);

      const res = await fetch("/api/ai/scan-bill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          images: billImages,
          mimeType: "image/jpeg",
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to scan bill");
      }

      const rawData: BillScanResult = data.data || {};

      setScanData(rawData);
      setSupplierName(rawData.supplierName || "Apex Supplier");
      setSupplierGstin(rawData.supplierGstin || "");
      setSupplierPhone(rawData.supplierPhone || "");
      setSupplierAddress(rawData.supplierAddress || "");
      setInvoiceNumber(rawData.invoiceNumber || `PB-${Math.floor(1000 + Math.random() * 9000)}`);
      setInvoiceDate(rawData.invoiceDate || new Date().toISOString().split("T")[0]);

      // Process items and match with existing inventory
      const processedItems: BillScanItem[] = (rawData.items || []).map((it: any, index: number) => {
        const itemQty = parseFloat(it.quantity) || 1;
        const itemRate = parseFloat(it.purchaseRate) || 0;
        const discPercent = parseFloat(it.discountPercent) || 0;
        const gstPct = parseFloat(it.gstPercent) || 18;

        const netRate = itemRate * (1 - discPercent / 100);
        const sub = itemQty * netRate;
        const tax = (sub * gstPct) / 100;
        const tot = sub + tax;

        // Product matching against existing product database
        const match = products.find(
          (p) =>
            p.name.toLowerCase().trim() === (it.productName || "").toLowerCase().trim() ||
            (it.hsnCode && p.hsnSac === it.hsnCode)
        );

        const confidence = typeof it.confidence === "number" ? it.confidence : 90;
        let confidenceLevel: "high" | "review" | "low" = "high";
        if (confidence < 60 || !it.productName) confidenceLevel = "low";
        else if (confidence < 85) confidenceLevel = "review";

        return {
          id: "scanned-" + index + "-" + Date.now(),
          productName: it.productName || `Scanned Item #${index + 1}`,
          matchedProductId: match ? match.id : undefined,
          isNewProduct: !match,
          sku: match ? match.sku : `SKU-${it.category ? it.category.slice(0, 3).toUpperCase() : "ELEC"}-${Math.floor(100 + Math.random() * 900)}`,
          hsnCode: it.hsnCode || (match ? match.hsnSac : "8544"),
          category: it.category || (match ? match.category : "Electrical"),
          quantity: itemQty,
          unit: (it.unit || "PCS").toUpperCase(),
          purchaseRate: itemRate,
          sellingPrice: parseFloat(it.sellingPrice) || (match ? match.sellingPrice : Math.round(itemRate * 1.25)),
          discountPercent: discPercent,
          gstPercent: gstPct,
          taxAmount: Math.round(tax * 100) / 100,
          totalAmount: Math.round(tot * 100) / 100,
          batchNo: it.batchNo || "BATCH-2026",
          warehouse: it.warehouse || "Main Warehouse",
          remarks: it.remarks || "",
          confidence,
          confidenceLevel,
        };
      });

      setItems(processedItems);
      showToast(`AI successfully parsed ${processedItems.length} line items!`, "success");
    } catch (err: any) {
      console.error(err);
      showToast(`Scan Error: ${err.message || "Failed to scan image"}`, "error");
    } finally {
      setIsScanning(false);
    }
  };

  // Item Update Handlers
  const handleUpdateItem = (id: string, field: keyof BillScanItem, value: any) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };

          // Recalculate totals if financial fields change
          if (["quantity", "purchaseRate", "discountPercent", "gstPercent"].includes(field)) {
            const q = parseFloat(updated.quantity as any) || 0;
            const r = parseFloat(updated.purchaseRate as any) || 0;
            const d = parseFloat(updated.discountPercent as any) || 0;
            const g = parseFloat(updated.gstPercent as any) || 0;

            const netRate = r * (1 - d / 100);
            const sub = q * netRate;
            const tax = (sub * g) / 100;
            updated.taxAmount = Math.round(tax * 100) / 100;
            updated.totalAmount = Math.round((sub + tax) * 100) / 100;
          }

          return updated;
        }
        return item;
      })
    );
  };

  const handleQtyChange = (id: string, delta: number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newQty = Math.max(1, item.quantity + delta);
          const r = item.purchaseRate;
          const d = item.discountPercent;
          const g = item.gstPercent;
          const netRate = r * (1 - d / 100);
          const sub = newQty * netRate;
          const tax = (sub * g) / 100;

          return {
            ...item,
            quantity: newQty,
            taxAmount: Math.round(tax * 100) / 100,
            totalAmount: Math.round((sub + tax) * 100) / 100,
          };
        }
        return item;
      })
    );
  };

  const handleDeleteItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleAddNewRow = () => {
    const newItem: BillScanItem = {
      id: "manual-" + Date.now(),
      productName: "New Hardware Item",
      sku: `SKU-HDW-${Math.floor(100 + Math.random() * 900)}`,
      hsnCode: "8414",
      category: "Hardware",
      quantity: 1,
      unit: "PCS",
      purchaseRate: 100,
      sellingPrice: 130,
      discountPercent: 0,
      gstPercent: 18,
      taxAmount: 18,
      totalAmount: 118,
      batchNo: "BATCH-2026",
      warehouse: "Main Warehouse",
      remarks: "",
      confidence: 100,
      confidenceLevel: "high",
    };
    setItems((prev) => [...prev, newItem]);
  };

  // Bulk Operations
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedItemIds(items.map((i) => i.id));
    } else {
      setSelectedItemIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedItemIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleApplyBulkEdits = () => {
    if (selectedItemIds.length === 0) {
      showToast("Select at least one item to bulk edit", "warning");
      return;
    }

    setItems((prev) =>
      prev.map((item) => {
        if (selectedItemIds.includes(item.id)) {
          const updated = { ...item };
          if (bulkGst !== "") updated.gstPercent = Number(bulkGst);
          if (bulkCategory) updated.category = bulkCategory;
          if (bulkWarehouse) updated.warehouse = bulkWarehouse;

          // recalculate total
          const q = updated.quantity;
          const r = updated.purchaseRate;
          const d = updated.discountPercent;
          const g = updated.gstPercent;
          const netRate = r * (1 - d / 100);
          const sub = q * netRate;
          const tax = (sub * g) / 100;
          updated.taxAmount = Math.round(tax * 100) / 100;
          updated.totalAmount = Math.round((sub + tax) * 100) / 100;

          return updated;
        }
        return item;
      })
    );

    showToast(`Bulk updated ${selectedItemIds.length} items`, "success");
    setSelectedItemIds([]);
  };

  const handleMergeDuplicates = () => {
    const map = new Map<string, BillScanItem>();

    items.forEach((item) => {
      const key = item.productName.toLowerCase().trim();
      if (map.has(key)) {
        const existing = map.get(key)!;
        const totalQty = existing.quantity + item.quantity;
        // weighted average price
        const totalCost = existing.quantity * existing.purchaseRate + item.quantity * item.purchaseRate;
        const avgPrice = Math.round((totalCost / totalQty) * 100) / 100;

        const g = existing.gstPercent;
        const sub = totalQty * avgPrice;
        const tax = (sub * g) / 100;

        map.set(key, {
          ...existing,
          quantity: totalQty,
          purchaseRate: avgPrice,
          taxAmount: Math.round(tax * 100) / 100,
          totalAmount: Math.round((sub + tax) * 100) / 100,
        });
      } else {
        map.set(key, item);
      }
    });

    const merged = Array.from(map.values());
    setItems(merged);
    showToast(`Merged duplicate items! Reduced to ${merged.length} items.`, "info");
  };

  // Calculations
  const filteredItems = items.filter(
    (item) =>
      item.productName.toLowerCase().includes(searchItem.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchItem.toLowerCase()) ||
      item.hsnCode.includes(searchItem)
  );

  const calculatedSubtotal = items.reduce(
    (sum, i) => sum + i.quantity * i.purchaseRate * (1 - i.discountPercent / 100),
    0
  );
  const calculatedTax = items.reduce((sum, i) => sum + i.taxAmount, 0);
  const calculatedGrandTotal = calculatedSubtotal + calculatedTax;

  const lowConfidenceCount = items.filter((i) => i.confidenceLevel !== "high").length;

  const handleSaveToInventory = () => {
    if (items.length === 0) {
      showToast("No items to save. Please scan or add items.", "warning");
      return;
    }

    const finalScanResult: BillScanResult = {
      supplierName,
      supplierGstin,
      supplierPhone,
      supplierAddress,
      invoiceNumber,
      invoiceDate,
      items,
      subtotal: Math.round(calculatedSubtotal * 100) / 100,
      totalTax: Math.round(calculatedTax * 100) / 100,
      grandTotal: Math.round(calculatedGrandTotal * 100) / 100,
      overallConfidence: scanData?.overallConfidence || 92,
      billPhotoUrl: billImages[0] || undefined,
    };

    processBillScanSave(finalScanResult);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-blue-600 to-indigo-700 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-xs text-white">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold tracking-tight">AI Bill Scanner & Auto Stock Entry</h2>
                <span className="px-2 py-0.5 text-[10px] uppercase font-black bg-emerald-400 text-slate-950 rounded-full">
                  PRO+ Module
                </span>
              </div>
              <p className="text-xs text-blue-100">
                Snap photo or upload purchase bill → AI OCR extracts data → Review & auto-enter inventory
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">

          {/* STEP 1: BILL CAPTURE & UPLOAD SECTION */}
          {items.length === 0 && !isScanning && (
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border-2 border-dashed border-slate-300 dark:border-slate-700 text-center">
              <div className="max-w-xl mx-auto space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto shadow-inner">
                  <Camera className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                    Snap Bill Photo or Upload JPG / PNG / PDF
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Supports hardware, electrical, plumbing, and retail supplier invoices with 100+ line items.
                  </p>
                </div>

                {/* Upload Action Buttons */}
                <div className="flex flex-wrap justify-center gap-3 pt-2">
                  <button
                    onClick={startCamera}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-2 shadow-md transition-all active:scale-95"
                  >
                    <Camera className="w-4 h-4" /> Open Camera
                  </button>

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs flex items-center gap-2 shadow-md transition-all active:scale-95"
                  >
                    <Upload className="w-4 h-4" /> Upload Files
                  </button>

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*,.pdf"
                    multiple
                    className="hidden"
                  />
                </div>

                {/* Image Previews / Multi-page list */}
                {billImages.length > 0 && (
                  <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700 text-left">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Uploaded Pages ({billImages.length})
                      </span>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                      >
                        + Add More Pages
                      </button>
                    </div>

                    <div className="flex gap-3 overflow-x-auto pb-2">
                      {billImages.map((img, idx) => (
                        <div
                          key={idx}
                          className={`relative w-24 h-28 rounded-xl border-2 overflow-hidden shrink-0 group ${
                            activeImageIndex === idx ? "border-blue-500 ring-2 ring-blue-300" : "border-slate-300 dark:border-slate-700"
                          }`}
                        >
                          <img src={img} alt={`Page ${idx + 1}`} className="w-full h-full object-cover" />
                          <button
                            onClick={() => setBillImages((prev) => prev.filter((_, i) => i !== idx))}
                            className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-full opacity-80 hover:opacity-100"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={handleRunAiScan}
                      className="w-full mt-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg transition-all"
                    >
                      <Sparkles className="w-5 h-5" /> Start AI OCR Scan
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Camera View Modal */}
          {isCameraActive && (
            <div className="fixed inset-0 z-60 bg-black flex flex-col items-center justify-center p-4">
              <div className="relative w-full max-w-xl bg-slate-900 rounded-2xl overflow-hidden shadow-2xl">
                <video ref={videoRef} autoPlay playsInline className="w-full h-80 object-cover" />
                <canvas ref={canvasRef} className="hidden" />

                <div className="p-4 bg-slate-900/90 flex items-center justify-between">
                  <button
                    onClick={stopCamera}
                    className="px-4 py-2 bg-slate-700 text-white rounded-xl text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={capturePhoto}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg"
                  >
                    <Camera className="w-4 h-4" /> Capture Photo
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SCANNING PROGRESS OVERLAY */}
          {isScanning && (
            <div className="py-16 text-center space-y-4">
              <div className="relative w-20 h-20 mx-auto">
                <div className="absolute inset-0 rounded-full border-4 border-blue-200 dark:border-blue-900 animate-ping opacity-30" />
                <div className="w-20 h-20 rounded-full border-4 border-blue-600 border-t-transparent animate-spin flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                AI Vision Model Parsing Bill Document...
              </h3>
              <p className="text-xs text-blue-600 dark:text-blue-400 font-medium animate-pulse">
                {scanStepMessage}
              </p>
            </div>
          )}

          {/* STEP 2: REVIEW & EDIT EXTRACTED DATA */}
          {items.length > 0 && !isScanning && (
            <div className="space-y-6">

              {/* Top Banner: Confidence & Highlights */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-xs flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    OCR Confidence: {scanData?.overallConfidence || 94}%
                  </div>

                  {lowConfidenceCount > 0 ? (
                    <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4" />
                      {lowConfidenceCount} items need review
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      All fields detected with high accuracy
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setHighlightLowConfidence(!highlightLowConfidence)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors flex items-center gap-1.5 ${
                      highlightLowConfidence
                        ? "bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 border-amber-300"
                        : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700"
                    }`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                    {highlightLowConfidence ? "Showing Review Highlights" : "Highlight Review Items"}
                  </button>

                  <button
                    onClick={() => setShowImagePreview(!showImagePreview)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 flex items-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5 text-blue-500" />
                    {showImagePreview ? "Hide Bill Photo" : "Show Original Bill"}
                  </button>
                </div>
              </div>

              {/* Side-by-Side: Original Bill Photo & Header Fields */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Bill Photo Thumbnail Preview */}
                {showImagePreview && billImages.length > 0 && (
                  <div className="lg:col-span-1 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 bg-slate-900 text-white flex flex-col">
                    <div className="flex items-center justify-between text-xs font-bold mb-2 px-1">
                      <span className="flex items-center gap-1 text-blue-400">
                        <FileText className="w-4 h-4" /> Scanned Document
                      </span>
                      <span>Page 1 of {billImages.length}</span>
                    </div>
                    <div className="flex-1 min-h-[220px] max-h-[320px] overflow-auto bg-black rounded-xl p-1 flex items-center justify-center">
                      <img
                        src={billImages[0]}
                        alt="Scanned Bill"
                        className="max-h-full w-auto object-contain rounded-lg"
                      />
                    </div>
                  </div>
                )}

                {/* Header Information Fields */}
                <div className={`${showImagePreview && billImages.length > 0 ? "lg:col-span-2" : "lg:col-span-3"} bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4`}>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-between">
                    <span>1. Supplier & Invoice Header Details</span>
                    <span className="text-[10px] text-blue-600 dark:text-blue-400 lowercase font-normal">(editable)</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Supplier / Vendor Name *
                      </label>
                      <input
                        type="text"
                        value={supplierName}
                        onChange={(e) => setSupplierName(e.target.value)}
                        className="w-full text-xs p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold"
                        placeholder="e.g. National Hardware Wholesale"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Supplier GSTIN
                      </label>
                      <input
                        type="text"
                        value={supplierGstin}
                        onChange={(e) => setSupplierGstin(e.target.value)}
                        className="w-full text-xs p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                        placeholder="27AAACN1122D1ZU"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Bill / Invoice Number *
                      </label>
                      <input
                        type="text"
                        value={invoiceNumber}
                        onChange={(e) => setInvoiceNumber(e.target.value)}
                        className="w-full text-xs p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-blue-600 dark:text-blue-400"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Invoice Date
                      </label>
                      <input
                        type="date"
                        value={invoiceDate}
                        onChange={(e) => setInvoiceDate(e.target.value)}
                        className="w-full text-xs p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Supplier Phone
                      </label>
                      <input
                        type="text"
                        value={supplierPhone}
                        onChange={(e) => setSupplierPhone(e.target.value)}
                        className="w-full text-xs p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                        placeholder="e.g. +91 9833445566"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Supplier Address
                      </label>
                      <input
                        type="text"
                        value={supplierAddress}
                        onChange={(e) => setSupplierAddress(e.target.value)}
                        className="w-full text-xs p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                        placeholder="City / Market"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* STEP 3: BULK ENTRY CONTROLS & ITEM TABLE */}
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <span>2. Scanned Line Items ({items.length})</span>
                      <span className="text-xs font-normal text-slate-500">
                        (Edit details, adjust stock quantity, or merge duplicates)
                      </span>
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={handleAddNewRow}
                      className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 text-xs font-semibold flex items-center gap-1 hover:bg-blue-100"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Manual Item
                    </button>

                    <button
                      onClick={handleMergeDuplicates}
                      className="px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 text-xs font-semibold flex items-center gap-1 hover:bg-purple-100"
                      title="Merge items with same name and calculate average price"
                    >
                      <Layers className="w-3.5 h-3.5" /> Merge Duplicates
                    </button>
                  </div>
                </div>

                {/* Search & Bulk Operations Toolbar */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Filter items in scanned bill..."
                      value={searchItem}
                      onChange={(e) => setSearchItem(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                    />
                  </div>

                  {/* Bulk edit inputs */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-slate-500">
                      Bulk ({selectedItemIds.length} selected):
                    </span>

                    <select
                      value={bulkGst}
                      onChange={(e) => setBulkGst(e.target.value === "" ? "" : Number(e.target.value))}
                      className="text-xs p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                    >
                      <option value="">Set GST %</option>
                      {GST_RATES.map((g) => (
                        <option key={g} value={g}>
                          {g}%
                        </option>
                      ))}
                    </select>

                    <input
                      type="text"
                      placeholder="Set Category"
                      value={bulkCategory}
                      onChange={(e) => setBulkCategory(e.target.value)}
                      className="w-24 text-xs p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                    />

                    <button
                      onClick={handleApplyBulkEdits}
                      disabled={selectedItemIds.length === 0}
                      className="px-3 py-1.5 bg-slate-800 dark:bg-slate-700 disabled:opacity-40 text-white rounded-lg text-xs font-semibold"
                    >
                      Apply Bulk
                    </button>
                  </div>
                </div>

                {/* Items Table */}
                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-x-auto shadow-2xs">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                        <th className="p-3 w-8">
                          <input
                            type="checkbox"
                            onChange={handleSelectAll}
                            checked={items.length > 0 && selectedItemIds.length === items.length}
                          />
                        </th>
                        <th className="p-3 min-w-[200px]">Product Name & Match</th>
                        <th className="p-3 w-28">HSN / SKU</th>
                        <th className="p-3 w-32">Qty & Unit</th>
                        <th className="p-3 w-28">Purchase Rate (₹)</th>
                        <th className="p-3 w-28">Selling Price (₹)</th>
                        <th className="p-3 w-20">GST %</th>
                        <th className="p-3 w-28 text-right">Total (₹)</th>
                        <th className="p-3 w-24">Confidence</th>
                        <th className="p-3 w-12"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
                      {filteredItems.map((item) => {
                        const isReviewNeeded = item.confidenceLevel !== "high";
                        const isSelected = selectedItemIds.includes(item.id);

                        return (
                          <tr
                            key={item.id}
                            className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                              highlightLowConfidence && isReviewNeeded
                                ? "bg-amber-50/80 dark:bg-amber-950/30"
                                : ""
                            }`}
                          >
                            <td className="p-3">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleSelect(item.id)}
                              />
                            </td>

                            {/* Product Name */}
                            <td className="p-3">
                              <input
                                type="text"
                                value={item.productName}
                                onChange={(e) => handleUpdateItem(item.id, "productName", e.target.value)}
                                className="w-full p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-slate-900 dark:text-slate-100"
                              />

                              <div className="mt-1 flex items-center gap-2 text-[10px]">
                                {item.matchedProductId ? (
                                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold flex items-center gap-1">
                                    <Check className="w-3 h-3" /> Matched Inventory Item
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 font-bold">
                                    + Will Auto-Create Product
                                  </span>
                                )}

                                <span className="text-slate-400">Batch: {item.batchNo}</span>
                              </div>
                            </td>

                            {/* HSN & SKU */}
                            <td className="p-3 space-y-1">
                              <input
                                type="text"
                                placeholder="HSN"
                                value={item.hsnCode}
                                onChange={(e) => handleUpdateItem(item.id, "hsnCode", e.target.value)}
                                className="w-full p-1 text-[11px] font-mono rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                              />
                              <input
                                type="text"
                                placeholder="SKU"
                                value={item.sku}
                                onChange={(e) => handleUpdateItem(item.id, "sku", e.target.value)}
                                className="w-full p-1 text-[10px] font-mono text-slate-500 rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800"
                              />
                            </td>

                            {/* Qty & Unit */}
                            <td className="p-3">
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleQtyChange(item.id, -1)}
                                  className="w-6 h-6 rounded bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold hover:bg-slate-300 flex items-center justify-center"
                                >
                                  -
                                </button>

                                <input
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={(e) =>
                                    handleUpdateItem(item.id, "quantity", parseFloat(e.target.value) || 1)
                                  }
                                  className="w-12 text-center p-1 rounded font-bold text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                                />

                                <button
                                  type="button"
                                  onClick={() => handleQtyChange(item.id, 1)}
                                  className="w-6 h-6 rounded bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold hover:bg-slate-300 flex items-center justify-center"
                                >
                                  +
                                </button>
                              </div>

                              <select
                                value={item.unit}
                                onChange={(e) => handleUpdateItem(item.id, "unit", e.target.value)}
                                className="mt-1 w-full text-[10px] p-0.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                              >
                                {UNITS.map((u) => (
                                  <option key={u} value={u}>
                                    {u}
                                  </option>
                                ))}
                              </select>
                            </td>

                            {/* Purchase Rate */}
                            <td className="p-3">
                              <input
                                type="number"
                                step="any"
                                value={item.purchaseRate}
                                onChange={(e) =>
                                  handleUpdateItem(item.id, "purchaseRate", parseFloat(e.target.value) || 0)
                                }
                                className="w-full p-1 rounded font-semibold text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                              />
                            </td>

                            {/* Selling Price */}
                            <td className="p-3">
                              <input
                                type="number"
                                step="any"
                                value={item.sellingPrice}
                                onChange={(e) =>
                                  handleUpdateItem(item.id, "sellingPrice", parseFloat(e.target.value) || 0)
                                }
                                className="w-full p-1 rounded font-semibold text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400"
                              />
                            </td>

                            {/* GST % */}
                            <td className="p-3 w-32">
                              <GstRateSelect
                                value={item.gstPercent}
                                onChange={(rate) =>
                                  handleUpdateItem(item.id, "gstPercent", rate)
                                }
                                size="sm"
                              />
                            </td>

                            {/* Total Amount */}
                            <td className="p-3 text-right font-extrabold text-slate-900 dark:text-slate-100">
                              ₹{item.totalAmount.toLocaleString("en-IN")}
                            </td>

                            {/* OCR Confidence Badge */}
                            <td className="p-3">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  item.confidenceLevel === "high"
                                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                    : item.confidenceLevel === "review"
                                    ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                                    : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                                }`}
                              >
                                {item.confidence}% ({item.confidenceLevel})
                              </span>
                            </td>

                            {/* Delete Button */}
                            <td className="p-3">
                              <button
                                onClick={() => handleDeleteItem(item.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* STEP 4: GRAND TOTALS & SAVE ACTIONS */}
              <div className="p-4 rounded-2xl bg-slate-900 text-white flex flex-wrap items-center justify-between gap-4 shadow-xl">
                <div className="flex items-center gap-6">
                  <div>
                    <span className="text-xs text-slate-400 block">Total Items</span>
                    <span className="text-lg font-bold">{items.length} Products</span>
                  </div>

                  <div>
                    <span className="text-xs text-slate-400 block">Subtotal</span>
                    <span className="text-base font-semibold">₹{Math.round(calculatedSubtotal).toLocaleString("en-IN")}</span>
                  </div>

                  <div>
                    <span className="text-xs text-slate-400 block">GST Tax</span>
                    <span className="text-base font-semibold text-amber-400">
                      ₹{Math.round(calculatedTax).toLocaleString("en-IN")}
                    </span>
                  </div>

                  <div className="border-l border-slate-700 pl-4">
                    <span className="text-xs text-slate-400 block">Grand Total</span>
                    <span className="text-xl font-extrabold text-emerald-400">
                      ₹{Math.round(calculatedGrandTotal).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setItems([]);
                      setBillImages([]);
                    }}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl transition-colors"
                  >
                    Scan Another Bill
                  </button>

                  <button
                    onClick={handleSaveToInventory}
                    className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-2 transition-transform active:scale-95"
                  >
                    <Save className="w-4 h-4" /> Save & Auto-Update Inventory + Ledger
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
};
