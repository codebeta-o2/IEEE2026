import React, { useState, useEffect } from "react";
import { 
  Plane, 
  WifiOff, 
  Wifi, 
  AlertTriangle, 
  CheckCircle2, 
  RotateCw, 
  ShieldAlert, 
  Clock, 
  ArrowRight,
  Smartphone,
  Info
} from "lucide-react";
import { NetworkCheckStatus, StudentDetails } from "../types";

interface OfflineAeroplaneModalProps {
  student: StudentDetails;
  isOnline: boolean;
  networkCheckStatus: NetworkCheckStatus;
  isCheckingNetwork: boolean;
  onCheckNetworkNow: () => void;
  onConfirmAndStartExam: () => void;
}

export const OfflineAeroplaneModal: React.FC<OfflineAeroplaneModalProps> = ({
  student,
  isOnline,
  networkCheckStatus,
  isCheckingNetwork,
  onCheckNetworkNow,
  onConfirmAndStartExam,
}) => {
  const [acknowledged, setAcknowledged] = useState(false);

  return (
    <div className="w-full max-w-2xl mx-auto py-8 px-4 animate-in fade-in duration-300">
      {/* Step Breadcrumbs */}
      <div className="mb-6 flex items-center justify-between text-xs text-slate-500 font-medium overflow-x-auto pb-2">
        <div className="flex items-center gap-1.5 text-emerald-600 font-bold">
          <CheckCircle2 className="w-4 h-4" />
          <span>1. Registration</span>
        </div>
        <span className="text-slate-300">→</span>
        <div className="flex items-center gap-1.5 text-emerald-600 font-bold">
          <CheckCircle2 className="w-4 h-4" />
          <span>2. Python QR</span>
        </div>
        <span className="text-slate-300">→</span>
        <div className="flex items-center gap-1.5 text-emerald-600 font-bold">
          <CheckCircle2 className="w-4 h-4" />
          <span>3. Python Problem</span>
        </div>
        <span className="text-slate-300">→</span>
        <div className="flex items-center gap-1.5 text-emerald-600 font-bold">
          <CheckCircle2 className="w-4 h-4" />
          <span>4. Room B3LG2.8 QR</span>
        </div>
        <span className="text-slate-300">→</span>
        <div className="flex items-center gap-1.5 text-amber-600 font-bold">
          <Plane className="w-4 h-4 text-amber-600" />
          <span>5. Airplane Mode Notice</span>
        </div>
      </div>

      <div className="bg-white border-2 border-amber-300 rounded-3xl shadow-xl overflow-hidden">
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-amber-500 via-orange-600 to-rose-600 p-6 text-white text-center">
          <div className="w-16 h-16 rounded-3xl bg-white/20 backdrop-blur-md mx-auto flex items-center justify-center mb-3 shadow-inner">
            <Plane className="w-10 h-10 text-white animate-pulse" />
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-white/25 text-white uppercase tracking-wider mb-2">
            <AlertTriangle className="w-3.5 h-3.5" />
            Mandatory Examination Protocol
          </span>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            SWITCH TO AIRPLANE / OFFLINE MODE
          </h1>
          <p className="text-xs sm:text-sm text-amber-100 font-medium mt-1.5 max-w-lg mx-auto">
            Please turn ON Airplane Mode (Aeroplane mode) or disconnect both Mobile Data and Wi-Fi before starting the quiz.
          </p>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {/* Candidate Identification */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Candidate</span>
              <span className="font-bold text-slate-800 text-sm">{student.name}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Phone Number</span>
              <span className="font-mono font-bold text-slate-800">{student.phone}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Assigned Room</span>
              <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md font-mono">B3LG2.8</span>
            </div>
          </div>

          {/* Real-time Network Watchdog Status Box */}
          <div className={`p-5 rounded-2xl border-2 transition-all ${
            isOnline
              ? "bg-rose-50 border-rose-400 text-rose-950"
              : "bg-emerald-50 border-emerald-400 text-emerald-950"
          }`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                  isOnline ? "bg-rose-200 text-rose-800" : "bg-emerald-200 text-emerald-800"
                }`}>
                  {isOnline ? <Wifi className="w-6 h-6 animate-pulse" /> : <WifiOff className="w-6 h-6" />}
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
                    {isOnline ? (
                      <>
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping" />
                        <span>Warning: Device is Currently ONLINE!</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Ready: Device is OFFLINE / In Airplane Mode</span>
                      </>
                    )}
                  </h3>
                  <p className="text-xs mt-1 leading-relaxed">
                    {isOnline ? (
                      <>
                        Active internet connection detected on this device. <strong>Please turn ON Airplane Mode now.</strong> If internet is active during questions, the system will instantly auto-submit your exam!
                      </>
                    ) : (
                      <>
                        No network connection detected. Your device is in offline mode and safe from premature auto-submission.
                      </>
                    )}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onCheckNetworkNow}
                disabled={isCheckingNetwork}
                className="px-3 py-1.5 text-xs font-bold bg-white rounded-xl border border-slate-300 hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 shadow-2xs"
                title="Refresh network status check"
              >
                <RotateCw className={`w-3.5 h-3.5 text-slate-700 ${isCheckingNetwork ? "animate-spin" : ""}`} />
                <span>Check Status</span>
              </button>
            </div>
          </div>

          {/* Quick Instructions on How to Enable Airplane Mode */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-2">
            <h4 className="font-bold text-slate-900 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-blue-600" />
              How to Turn On Airplane Mode:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600">
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <strong className="text-slate-900 block mb-0.5">Android / iPhone:</strong>
                Swipe down from the top of the screen (or Control Center) and tap the <strong>Airplane ✈️ icon</strong> to turn it ON.
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <strong className="text-slate-900 block mb-0.5">Alternative Method:</strong>
                Turn off both <strong>Wi-Fi</strong> and <strong>Mobile Data (Cellular)</strong> in your device settings.
              </div>
            </div>
          </div>

          {/* Strict Auto-Submission Warning Box */}
          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-950 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1 text-[11px] leading-relaxed">
              <strong className="text-amber-900 font-bold block text-xs">
                Background Proctoring Watchdog Notice:
              </strong>
              <p>
                The examination operates in strictly offline mode. If you turn off Airplane Mode or connect to any Wi-Fi or mobile network during the exam, <strong>the proctor watchdog will trigger instant auto-submission</strong>.
              </p>
            </div>
          </div>

          {/* User Acknowledgment Checkbox */}
          <div className="pt-2">
            <label className="flex items-start gap-3 cursor-pointer group select-none p-3 rounded-2xl hover:bg-slate-50 border border-slate-200 transition-colors">
              <input
                type="checkbox"
                id="checkbox-airplane-confirm"
                checked={acknowledged}
                onChange={(e) => setAcknowledged(e.target.checked)}
                className="mt-1 w-5 h-5 text-amber-600 rounded-md border-slate-300 focus:ring-amber-500 cursor-pointer"
              />
              <span className="text-xs text-slate-700 leading-relaxed font-medium">
                I have turned ON <strong>Airplane Mode</strong> (or disabled Wi-Fi and Mobile Data). I understand that reconnecting to the internet while taking the exam will cause an immediate auto-submission.
              </span>
            </label>
          </div>

          {/* Action Button: Start Active Timed Quiz */}
          <button
            type="button"
            id="btn-start-exam-offline"
            onClick={onConfirmAndStartExam}
            disabled={!acknowledged}
            className={`w-full py-4 px-6 font-black rounded-2xl text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md ${
              acknowledged
                ? "bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white"
                : "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
            }`}
          >
            <span>Start Timed MCQ Quiz (20 Mins · Offline)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
