import React, { useState, useEffect } from "react";
import { NetworkCheckStatus, NetworkMode, StudentDetails } from "../types";
import { checkEnrollmentAttempts, AttemptCheckResult } from "../utils/attemptTracker";
import { 
  User, 
  Mail, 
  Phone,
  Building2, 
  Grid3X3, 
  Hash, 
  IdCard, 
  WifiOff, 
  Wifi,
  Clock, 
  EyeOff, 
  ShieldAlert, 
  CheckCircle2, 
  ArrowRight,
  RotateCw, 
  Lock, 
  History,
  AlertOctagon,
  KeyRound,
  Smartphone,
  ShieldCheck,
  QrCode
} from "lucide-react";

interface RegistrationFormProps {
  onStartExam: (details: StudentDetails, mode?: NetworkMode) => void;
  isOnline: boolean;
  networkMode?: NetworkMode;
  networkCheckStatus: NetworkCheckStatus;
  isCheckingNetwork: boolean;
  onToggleNetworkMode?: (mode: NetworkMode) => void;
  onCheckNetworkNow: () => void;
  onToggleNetworkSim?: (online: boolean) => void;
}

export const RegistrationForm: React.FC<RegistrationFormProps> = ({
  onStartExam,
  isOnline,
  networkCheckStatus,
  isCheckingNetwork,
  onToggleNetworkMode,
  onCheckNetworkNow,
}) => {
  const [formData, setFormData] = useState<StudentDetails>({
    name: "",
    phone: "",
    email: "",
    department: "",
    section: "",
    roll: "",
    enrollmentNumber: "",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof StudentDetails, string>>>({});
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Attempt verification state
  const [attemptCheck, setAttemptCheck] = useState<AttemptCheckResult | null>(null);
  const [isCheckingAttempts, setIsCheckingAttempts] = useState(false);

  // Check attempts whenever enrollmentNumber changes (debounced)
  useEffect(() => {
    const raw = formData.enrollmentNumber.trim();
    if (!raw) {
      setAttemptCheck(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsCheckingAttempts(true);
      try {
        const result = await checkEnrollmentAttempts(raw);
        setAttemptCheck(result);
      } catch (err) {
        console.error("Failed to check attempts:", err);
      } finally {
        setIsCheckingAttempts(false);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [formData.enrollmentNumber]);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof StudentDetails, string>> = {};

    if (!formData.name.trim()) newErrors.name = "Full name is required";
    
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (formData.phone.replace(/[^0-9]/g, "").length < 7) {
      newErrors.phone = "Please enter a valid phone number (at least 7 digits)";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.department.trim()) {
      newErrors.department = "Department name is required";
    }

    if (!formData.section.trim()) {
      newErrors.section = "Section is required";
    }

    if (!formData.roll.trim()) {
      newErrors.roll = "Roll number is required";
    }

    if (!formData.enrollmentNumber.trim()) {
      newErrors.enrollmentNumber = "Enrollment Number (Primary Key) is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    if (attemptCheck && attemptCheck.isBlocked) {
      alert(
        `Access Denied: Enrollment Number "${formData.enrollmentNumber.trim()}" has already completed all 2 allowed attempts.\n\n` +
        "Policy: Exactly two attempts are permitted per candidate."
      );
      return;
    }

    if (!termsAccepted) {
      alert("Please review and accept the examination rules before proceeding.");
      return;
    }

    if (onToggleNetworkMode) onToggleNetworkMode("REAL_DEVICE");
    onStartExam(formData, "REAL_DEVICE");
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-6 px-4">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-5 sm:p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                <ShieldAlert className="w-3.5 h-3.5" />
                IEEE Proctored Examination System
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                <Lock className="w-3 h-3" />
                Max 2 Attempts Policy
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
              IEEE DAY SPECIAL
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              GRSS/MTTS/SPS/APS/TEMS
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap self-start sm:self-center">
            <div
              id="badge-sync-status"
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-300 rounded-xl shadow-2xs"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>System Ready</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Column */}
        <div className="lg:col-span-7">
          <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl shadow-xs p-6">
            <h2 className="text-base font-semibold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" />
                Candidate Identity Information
              </span>
              <span className="text-[11px] text-slate-400 font-normal">
                All fields are mandatory
              </span>
            </h2>

            <div className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5" htmlFor="input-candidate-name">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
                  <input
                    id="input-candidate-name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Subhankar Das Adhikary"
                    className={`w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 border rounded-lg focus:outline-hidden focus:ring-2 focus:bg-white transition-all ${
                      errors.name ? "border-rose-400 focus:ring-rose-200" : "border-slate-300 focus:ring-blue-200 focus:border-blue-500"
                    }`}
                  />
                </div>
                {errors.name && <p className="text-xs text-rose-500 mt-1">{errors.name}</p>}
              </div>

              {/* Phone Number & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Phone Number Input */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5" htmlFor="input-candidate-phone">
                    Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
                    <input
                      id="input-candidate-phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="e.g. +91 9876543210"
                      className={`w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 border rounded-lg focus:outline-hidden focus:ring-2 focus:bg-white transition-all ${
                        errors.phone ? "border-rose-400 focus:ring-rose-200" : "border-slate-300 focus:ring-blue-200 focus:border-blue-500"
                      }`}
                    />
                  </div>
                  {errors.phone && <p className="text-xs text-rose-500 mt-1">{errors.phone}</p>}
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5" htmlFor="input-candidate-email">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
                    <input
                      id="input-candidate-email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="e.g. subhankar@gmail.com"
                      className={`w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 border rounded-lg focus:outline-hidden focus:ring-2 focus:bg-white transition-all ${
                        errors.email ? "border-rose-400 focus:ring-rose-200" : "border-slate-300 focus:ring-blue-200 focus:border-blue-500"
                      }`}
                    />
                  </div>
                  {errors.email && <p className="text-xs text-rose-500 mt-1">{errors.email}</p>}
                </div>
              </div>

              {/* Department Name & Section as User Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Department Name Input */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5" htmlFor="input-candidate-department">
                    Department Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
                    <input
                      id="input-candidate-department"
                      type="text"
                      list="department-suggestions"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      placeholder="e.g. Computer Science & Engg"
                      className={`w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 border rounded-lg focus:outline-hidden focus:ring-2 focus:bg-white transition-all ${
                        errors.department ? "border-rose-400 focus:ring-rose-200" : "border-slate-300 focus:ring-blue-200 focus:border-blue-500"
                      }`}
                    />
                    <datalist id="department-suggestions">
                      <option value="Computer Science & Engineering" />
                      <option value="Information Technology" />
                      <option value="Electronics & Communication Engineering" />
                      <option value="Electrical Engineering" />
                      <option value="Mechanical Engineering" />
                      <option value="Civil Engineering" />
                      <option value="Data Science & Artificial Intelligence" />
                    </datalist>
                  </div>
                  {errors.department && <p className="text-xs text-rose-500 mt-1">{errors.department}</p>}
                </div>

                {/* Section Input */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5" htmlFor="input-candidate-section">
                    Section <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Grid3X3 className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
                    <input
                      id="input-candidate-section"
                      type="text"
                      value={formData.section}
                      onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                      placeholder="e.g. Section A or 3B"
                      className={`w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 border rounded-lg focus:outline-hidden focus:ring-2 focus:bg-white transition-all ${
                        errors.section ? "border-rose-400 focus:ring-rose-200" : "border-slate-300 focus:ring-blue-200 focus:border-blue-500"
                      }`}
                    />
                  </div>
                  {errors.section && <p className="text-xs text-rose-500 mt-1">{errors.section}</p>}
                </div>
              </div>

              {/* Roll Number & Enrollment Number (Primary Key) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5" htmlFor="input-roll-number">
                    Roll Number <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
                    <input
                      id="input-roll-number"
                      type="text"
                      value={formData.roll}
                      onChange={(e) => setFormData({ ...formData, roll: e.target.value })}
                      placeholder="e.g. CSE-3A-42"
                      className={`w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 border rounded-lg focus:outline-hidden focus:ring-2 focus:bg-white transition-all ${
                        errors.roll ? "border-rose-400 focus:ring-rose-200" : "border-slate-300 focus:ring-blue-200 focus:border-blue-500"
                      }`}
                    />
                  </div>
                  {errors.roll && <p className="text-xs text-rose-500 mt-1">{errors.roll}</p>}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1" htmlFor="input-enrollment-number">
                      <span>Enrollment Number</span>
                      <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded-md border border-blue-200 flex items-center gap-0.5">
                      <KeyRound className="w-3 h-3 text-blue-600" />
                      PRIMARY KEY
                    </span>
                  </div>
                  <div className="relative">
                    <IdCard className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
                    <input
                      id="input-enrollment-number"
                      type="text"
                      value={formData.enrollmentNumber}
                      onChange={(e) => setFormData({ ...formData, enrollmentNumber: e.target.value.toUpperCase() })}
                      placeholder="e.g. EN2024CS089"
                      className={`w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 border rounded-lg focus:outline-hidden focus:ring-2 focus:bg-white font-mono uppercase transition-all ${
                        errors.enrollmentNumber || (attemptCheck && attemptCheck.isBlocked)
                          ? "border-rose-400 focus:ring-rose-200 bg-rose-50/40"
                          : "border-slate-300 focus:ring-blue-200 focus:border-blue-500"
                      }`}
                    />
                  </div>
                  {errors.enrollmentNumber && <p className="text-xs text-rose-500 mt-1">{errors.enrollmentNumber}</p>}
                </div>
              </div>

              {/* Attempt Tracker Status Card */}
              {formData.enrollmentNumber.trim() && (
                <div className="mt-2">
                  {isCheckingAttempts ? (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2 text-xs text-slate-500">
                      <RotateCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
                      <span>Checking attempt history for <strong>{formData.enrollmentNumber}</strong>...</span>
                    </div>
                  ) : attemptCheck ? (
                    <div className={`p-3.5 rounded-xl border transition-all ${
                      attemptCheck.isBlocked
                        ? "bg-rose-50 border-rose-300 text-rose-900"
                        : attemptCheck.attemptCount === 1
                        ? "bg-amber-50 border-amber-300 text-amber-900"
                        : "bg-emerald-50 border-emerald-300 text-emerald-900"
                    }`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                          <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                            attemptCheck.isBlocked 
                              ? "bg-rose-200 text-rose-800" 
                              : attemptCheck.attemptCount === 1 
                              ? "bg-amber-200 text-amber-800" 
                              : "bg-emerald-200 text-emerald-800"
                          }`}>
                            {attemptCheck.isBlocked ? (
                              <AlertOctagon className="w-4 h-4" />
                            ) : (
                              <History className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-bold text-xs">
                                {attemptCheck.isBlocked
                                  ? "Attempt Limit Reached (2 of 2 Attempts Completed)"
                                  : attemptCheck.attemptCount === 1
                                  ? "Final Attempt 2 of 2 Available"
                                  : "Candidate Verified: Attempt 1 of 2 Available"}
                              </h4>
                              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                                attemptCheck.isBlocked
                                  ? "bg-rose-100 text-rose-800 border-rose-300"
                                  : attemptCheck.attemptCount === 1
                                  ? "bg-amber-100 text-amber-800 border-amber-300"
                                  : "bg-emerald-100 text-emerald-800 border-emerald-300"
                              }`}>
                                {attemptCheck.attemptCount} / 2 USED
                              </span>
                            </div>
                            <p className="text-[11px] mt-0.5 leading-relaxed opacity-90">
                              {attemptCheck.message}
                            </p>

                            {/* Past attempt detail */}
                            {attemptCheck.pastAttempts && attemptCheck.pastAttempts.length > 0 && (
                              <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center gap-3 text-[11px] font-mono">
                                <span>Past Attempt 1: <strong>{attemptCheck.pastAttempts[0].score}/{attemptCheck.pastAttempts[0].totalQuestions} ({attemptCheck.pastAttempts[0].percentage}%)</strong></span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}

              {/* Anti-Copy Protection Integrity Notice */}
              <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-700">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  <strong>QR Code clue:</strong>Tired of solving clues? Don’t worry, this one needs no coding! 
Go to the place where students fight with
T-squares, scales, pencils & impossible angles. 
Your next clue is hiding there!
Near b3 1st floor  faculty rooms!!!!!
                </span>
              </div>

              {/* Terms Acceptance */}
              <div className="pt-2">
                <label className="flex items-start gap-3 cursor-pointer group select-none">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="mt-1 w-4 h-4 text-blue-600 rounded-sm border-slate-300 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="text-xs text-slate-600 group-hover:text-slate-900 leading-relaxed">
                    I verify that my candidate details (Phone, Department, Section, Roll No, and Enrollment Number) are accurate and that all examination responses will be securely recorded in the official Google Sheet.
                  </span>
                </label>
              </div>

              {/* Action Button: Moves to scan IEEE-PYTHON-GAME */}
              <button
                type="submit"
                id="btn-start-examination"
                disabled={Boolean(attemptCheck && attemptCheck.isBlocked)}
                className={`w-full py-3 px-4 text-white font-semibold rounded-xl text-sm shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  attemptCheck && attemptCheck.isBlocked
                    ? "bg-slate-400 cursor-not-allowed opacity-60"
                    : "bg-blue-600 hover:bg-blue-700 active:bg-blue-800"
                }`}
              >
                {attemptCheck && attemptCheck.isBlocked ? (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Attempts Limit Reached (2/2 Completed)</span>
                  </>
                ) : (
                  <>
                    <QrCode className="w-4 h-4" />
                    <span>Proceed to Step 2: Scan Desk QR Code</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Instructions & Stage Workflow Column */}
        <div className="lg:col-span-5 space-y-4">
          {/* Progression Workflow Card */}
          <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl p-5 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-300 mb-3 flex items-center gap-2">
              <QrCode className="w-4 h-4" />
              Examination Gate Progression
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-white/10 border border-white/15">
                <span className="w-5 h-5 rounded-full bg-blue-500 text-white font-bold flex items-center justify-center text-[10px] shrink-0">1</span>
                <div>
                  <h4 className="font-bold text-white">Fill Registration Details</h4>
                  <p className="text-white/80 text-[11px] mt-0.5">Submit Name, Phone, Dept, Section, Roll No & Enrollment No.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-white/10 border border-white/15">
                <span className="w-5 h-5 rounded-full bg-blue-500 text-white font-bold flex items-center justify-center text-[10px] shrink-0">2</span>
                <div>
                  <h4 className="font-bold text-amber-300">Scan Desk Check-In QR</h4>
                  <p className="text-white/80 text-[11px] mt-0.5">Scan desk QR code with your camera to begin qualification.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-white/10 border border-white/15">
                <span className="w-5 h-5 rounded-full bg-blue-500 text-white font-bold flex items-center justify-center text-[10px] shrink-0">3</span>
                <div>
                  <h4 className="font-bold text-white">Python Block Assembly Puzzle</h4>
                  <p className="text-white/80 text-[11px] mt-0.5">Solve the code block puzzle to compute and reveal your assigned room.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-white/10 border border-white/15">
                <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-900 font-bold flex items-center justify-center text-[10px] shrink-0">4</span>
                <div>
                  <h4 className="font-bold text-amber-300">Allocated Room Gate QR</h4>
                  <p className="text-white/80 text-[11px] mt-0.5">Enter your unlocked room and scan the desk QR to initiate the exam.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-white/10 border border-white/15">
                <span className="w-5 h-5 rounded-full bg-emerald-500 text-white font-bold flex items-center justify-center text-[10px] shrink-0">5</span>
                <div>
                  <h4 className="font-bold text-emerald-300">Timed Offline MCQ Portal</h4>
                  <p className="text-white/80 text-[11px] mt-0.5">20 Questions · Toggled View · Network Tamper Safeguard.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Protocols Card */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-500" />
              Examination Protocols
            </h3>

            <div className="space-y-3">
              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-blue-50/60 border border-blue-200/80">
                <div className="p-1.5 bg-blue-100 text-blue-800 rounded-lg shrink-0 mt-0.5">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-blue-900">Strictly 2 Attempts Per Person</h4>
                  <p className="text-xs text-blue-800 mt-0.5 leading-relaxed">
                    <strong>Enrollment Number *</strong> serves as the Primary Key. All records are sent to Google Sheet.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-rose-50/70 border border-rose-200/90">
                <div className="p-1.5 bg-rose-100 text-rose-800 rounded-lg shrink-0 mt-0.5">
                  <WifiOff className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-rose-900">Offline Proctoring & Auto-Submit</h4>
                  <p className="text-xs text-rose-800 mt-0.5 leading-relaxed">
                    The exam must be taken offline. If mobile data or Wi-Fi is turned on during questions, the system triggers instant auto-submission.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-indigo-50/70 border border-indigo-200/90">
                <div className="p-1.5 bg-indigo-100 text-indigo-800 rounded-lg shrink-0 mt-0.5">
                  <EyeOff className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-indigo-900">Cognitive Toggled View</h4>
                  <p className="text-xs text-indigo-800 mt-0.5 leading-relaxed">
                    At any time, either the question or options are displayed to evaluate retention and focus.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
