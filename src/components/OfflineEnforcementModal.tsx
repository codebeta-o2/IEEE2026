import React, { useEffect } from "react";
import { 
  Plane, 
  WifiOff, 
  Wifi, 
  Smartphone, 
  ShieldAlert, 
  CheckCircle2, 
  ArrowRight, 
  RotateCw, 
  AlertTriangle,
  Lock,
  User,
  MapPin
} from "lucide-react";
import { StudentDetails, NetworkCheckStatus } from "../types";

interface OfflineEnforcementModalProps {
  isOpen: boolean;
  student: StudentDetails;
  roomNumber: string;
  isOnline: boolean;
  networkCheckStatus: NetworkCheckStatus;
  isCheckingNetwork: boolean;
  onCheckNetworkNow: () => void;
  onConfirmStartExam: () => void;
  onCancel: () => void;
}

export const OfflineEnforcementModal: React.FC<OfflineEnforcementModalProps> = ({
  isOpen,
  student,
  roomNumber,
  isOnline,
  networkCheckStatus,
  isCheckingNetwork,
  onCheckNetworkNow,
  onConfirmStartExam,
  onCancel,
}) => {
  useEffect(() => {
    if (isOpen) {
      onCheckNetworkNow();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        id="offline-enforcement-notification-modal"
        className="bg-white rounded-3xl shadow-2xl border-2 border-amber-300 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 p-6 text-white text-center relative">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3 backdrop-blur-xs ring-4 ring-white/30 shadow-lg">
            <Plane className="w-9 h-9 text-white -rotate-45" />
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-black/25 text-amber-100 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-300" />
            Mandatory Offline Protocol
          </span>

          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            Switch to Airplane Mode
          </h2>
          <p className="text-xs sm:text-sm text-amber-100 mt-1 max-w-sm mx-auto">
            Please turn ON Airplane Mode or turn OFF all network connections before starting the exam.
          </p>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Candidate Info Badge */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600" />
              <span className="font-bold text-slate-800">{student.name}</span>
              <span className="text-slate-400 font-mono">({student.roll})</span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold text-[11px] flex items-center gap-1">
              <MapPin className="w-3 h-3 text-amber-700" />
              Room {roomNumber}
            </span>
          </div>

          {/* Device Network Readiness Alert Box */}
          <div className={`p-4 rounded-2xl border-2 transition-all ${
            isOnline 
              ? "bg-rose-50 border-rose-300 text-rose-950" 
              : "bg-emerald-50 border-emerald-300 text-emerald-950"
          }`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className={`p-2.5 rounded-xl ${
                  isOnline ? "bg-rose-200 text-rose-800" : "bg-emerald-200 text-emerald-800"
                }`}>
                  {isOnline ? (
                    networkCheckStatus.isMobileNetwork ? (
                      <Smartphone className="w-5 h-5 text-rose-700 animate-pulse" />
                    ) : (
                      <Wifi className="w-5 h-5 text-rose-700" />
                    )
                  ) : (
                    <WifiOff className="w-5 h-5 text-emerald-700" />
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                    <span>Current Device Status:</span>
                    <span className={isOnline ? "text-rose-700 font-extrabold" : "text-emerald-700 font-extrabold"}>
                      {isOnline ? "ONLINE (Connected)" : "OFFLINE (Ready ✓)"}
                    </span>
                  </h4>
                  <p className="text-xs mt-0.5 opacity-90">
                    {isOnline
                      ? networkCheckStatus.isMobileNetwork
                        ? "Mobile Data (Cellular) connection detected!"
                        : "Wi-Fi internet connection detected!"
                      : "Device is disconnected from the internet. Exam ready."}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onCheckNetworkNow}
                disabled={isCheckingNetwork}
                className="px-2.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1 shadow-2xs cursor-pointer disabled:opacity-50 shrink-0"
              >
                <RotateCw className={`w-3.5 h-3.5 ${isCheckingNetwork ? "animate-spin text-blue-600" : ""}`} />
                <span>{isCheckingNetwork ? "Checking..." : "Re-Check"}</span>
              </button>
            </div>
          </div>

          {/* Action Checklist Instructions */}
          <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl text-xs text-amber-950 space-y-2.5 leading-relaxed">
            <h4 className="font-bold text-amber-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Before You Start: Follow These 2 Steps
            </h4>

            <div className="space-y-2">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-900 font-black text-xs flex items-center justify-center shrink-0">1</span>
                <div>
                  <p className="font-bold text-amber-950">Turn ON Airplane Mode</p>
                  <p className="text-amber-800 text-[11px]">
                    Open your device quick settings and enable <strong>Airplane Mode</strong>, or switch OFF both <strong>Wi-Fi</strong> and <strong>Mobile Data</strong>.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-900 font-black text-xs flex items-center justify-center shrink-0">2</span>
                <div>
                  <p className="font-bold text-amber-950">Watchdog Auto-Submit Warning</p>
                  <p className="text-amber-800 text-[11px]">
                    The exam runs strictly offline. If you turn on Wi-Fi or mobile data during the exam, the proctoring watchdog will <strong>auto-submit immediately</strong>.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-300 rounded-xl transition-colors cursor-pointer text-center"
          >
            ← Back to Room Scanner
          </button>

          <button
            type="button"
            id="btn-confirm-offline-start-exam"
            onClick={onConfirmStartExam}
            className={`w-full sm:w-auto px-6 py-3 font-bold text-xs sm:text-sm text-white rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
              isOnline
                ? "bg-amber-600 hover:bg-amber-700"
                : "bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800"
            }`}
          >
            <span>I Am in Airplane Mode / Offline → Start Exam</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
