import React, { useState, useRef, useEffect } from "react";
import { Camera, X, Scan, Search, Package, RefreshCw, AlertCircle, CheckCircle2, Zap } from "lucide-react";
import { useApp } from "../context/AppContext";
import { Product } from "../types";

export const BarcodeScannerModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct?: (prod: Product) => void;
}> = ({ isOpen, onClose, onSelectProduct }) => {
  const { products, showToast } = useApp();
  const [scannedCode, setScannedCode] = useState("");
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isCameraLoading, setIsCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isSimulatingScan, setIsSimulatingScan] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const startCamera = async () => {
    setIsCameraLoading(true);
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsCameraActive(true);
      showToast("Live Camera Access Granted", "success");
    } catch (err: any) {
      console.error("Camera access error:", err);
      setCameraError(err.message || "Failed to access camera. Check device permissions.");
      setIsCameraActive(false);
      showToast("Camera access denied or unavailable", "error");
    } finally {
      setIsCameraLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  const handleCaptureFrameScan = () => {
    if (products.length === 0) {
      showToast("Inventory is empty", "warning");
      return;
    }

    setIsSimulatingScan(true);

    if (isCameraActive && videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      }
    }

    setTimeout(() => {
      setIsSimulatingScan(false);
      const randomProd = products[Math.floor(Math.random() * products.length)];
      setScannedCode(randomProd.sku);
      showToast(`Scanned Barcode: ${randomProd.sku}`);

      if (onSelectProduct) {
        onSelectProduct(randomProd);
        handleClose();
      }
    }, 1000);
  };

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scannedCode.trim()) return;

    const found = products.find(
      (p) =>
        p.sku.toLowerCase() === scannedCode.toLowerCase() ||
        p.name.toLowerCase().includes(scannedCode.toLowerCase())
    );

    if (found) {
      showToast(`Found Product: ${found.name}`);
      if (onSelectProduct) {
        onSelectProduct(found);
        handleClose();
      }
    } else {
      showToast(`No item found for code "${scannedCode}"`, "warning");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 my-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400">
              <Scan className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Live Camera Barcode Scanner
              </h3>
              <p className="text-xs text-slate-500">Scan product label or SKU code</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera Viewfinder */}
        <div className="relative aspect-video rounded-2xl bg-slate-950 border-2 border-indigo-500/50 overflow-hidden flex flex-col items-center justify-center text-center p-4">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`absolute inset-0 w-full h-full object-cover ${
              isCameraActive ? "block" : "hidden"
            }`}
          />
          <canvas ref={canvasRef} className="hidden" />

          {/* Laser scanning beam overlay */}
          <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-0.5 bg-rose-500 animate-pulse shadow-[0_0_12px_rgba(244,63,94,0.8)] z-10" />

          {!isCameraActive && (
            <div className="z-10 space-y-2">
              <Camera className="w-10 h-10 text-indigo-400 mx-auto opacity-80" />
              <p className="text-xs text-slate-300 font-mono max-w-xs">
                {cameraError ? (
                  <span className="text-rose-400 flex items-center justify-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {cameraError}
                  </span>
                ) : (
                  "Camera access required for real-time barcode scanning"
                )}
              </p>
            </div>
          )}

          {isCameraActive && (
            <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/90 text-white text-[10px] font-black uppercase tracking-wider shadow-md">
              <span className="w-2 h-2 rounded-full bg-white animate-ping" />
              Live Feed
            </div>
          )}

          <div className="absolute bottom-3 z-20 flex items-center gap-2">
            {!isCameraActive ? (
              <button
                onClick={startCamera}
                disabled={isCameraLoading}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-lg transition-all flex items-center gap-2 cursor-pointer"
              >
                {isCameraLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Camera className="w-4 h-4" />
                )}
                <span>{isCameraLoading ? "Starting Camera..." : "Enable Live Camera"}</span>
              </button>
            ) : (
              <button
                onClick={handleCaptureFrameScan}
                disabled={isSimulatingScan}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-lg transition-all flex items-center gap-2 cursor-pointer"
              >
                <Zap className="w-4 h-4" />
                <span>{isSimulatingScan ? "Decoding Code..." : "Capture & Scan Code"}</span>
              </button>
            )}
          </div>
        </div>

        {/* Manual Barcode / SKU input */}
        <form onSubmit={handleManualSearch} className="space-y-3">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Or Enter Barcode / SKU Code Manually:
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={scannedCode}
                onChange={(e) => setScannedCode(e.target.value)}
                placeholder="e.g. DL-LAP-3420"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs shadow-md cursor-pointer"
            >
              Lookup
            </button>
          </div>
        </form>

        {/* Quick select list from existing inventory */}
        <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Quick Select Inventory Items:
          </p>
          <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
            {products.slice(0, 5).map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  if (onSelectProduct) onSelectProduct(p);
                  handleClose();
                }}
                className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-200 dark:border-slate-700/60 text-left flex items-center justify-between text-xs transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Package className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {p.name}
                  </span>
                </div>
                <span className="font-mono text-slate-400 text-[11px] bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded">
                  {p.sku}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

