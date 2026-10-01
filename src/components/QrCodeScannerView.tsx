import React, { useState, useEffect, useRef, useCallback } from "react";
import jsQR from "jsqr";
import { 
  QrCode, 
  Camera, 
  CameraOff, 
  CheckCircle2, 
  AlertTriangle, 
  RotateCw, 
  MapPin, 
  Code2, 
  FileText,
  User,
  ShieldAlert
} from "lucide-react";
import { StudentDetails } from "../types";

interface QrCodeScannerViewProps {
  targetCode: "IEEE-PYTHON-GAME" | "IEEE-EXAM-START";
  student: StudentDetails;
  onSuccess: (scannedCode: string) => void;
  roomNumber?: string;
  onBackToRegistration?: () => void;
}

export const QrCodeScannerView: React.FC<QrCodeScannerViewProps> = ({
  targetCode,
  student,
  onSuccess,
  roomNumber,
}) => {
  const isPythonGate = targetCode === "IEEE-PYTHON-GAME";

  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [manualInput, setManualInput] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccessMatched, setIsSuccessMatched] = useState<boolean>(false);
  const [isRequestingCamera, setIsRequestingCamera] = useState<boolean>(false);
  const [permissionDeniedHelp, setPermissionDeniedHelp] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  const handleValidCodeScanned = useCallback((code: string) => {
    if (isSuccessMatched) return;
    const clean = code.trim().toUpperCase();
    if (clean === targetCode) {
      setIsSuccessMatched(true);
      setErrorMessage(null);
      // Stop camera stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
      setTimeout(() => {
        onSuccess(clean);
      }, 700);
    } else {
      setErrorMessage("Scanned QR code does not match the expected security token. Please scan the designated code.");
    }
  }, [targetCode, onSuccess, isSuccessMatched]);

  const tickScan = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || isSuccessMatched) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    if (video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
      canvas.height = video.videoHeight;
      canvas.width = video.videoWidth;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      });

      if (code && code.data) {
        handleValidCodeScanned(code.data);
        return;
      }
    }

    animFrameIdRef.current = requestAnimationFrame(tickScan);
  }, [handleValidCodeScanned, isSuccessMatched]);

  // Request & Start camera stream
  const requestCameraAccess = async () => {
    setErrorMessage(null);
    setPermissionDeniedHelp(false);
    setIsRequestingCamera(true);

    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API not supported in this browser or environment");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");
        await videoRef.current.play();
        setHasCameraPermission(true);
        setCameraActive(true);
        animFrameIdRef.current = requestAnimationFrame(tickScan);
      }
    } catch (err: any) {
      console.warn("Camera access request rejected or not available:", err);
      setHasCameraPermission(false);
      setCameraActive(false);
      setPermissionDeniedHelp(true);
      setErrorMessage("Camera access was not granted or is blocked. Please allow camera permissions in your browser or use Quick Scan below.");
    } finally {
      setIsRequestingCamera(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    // Proactively request camera access on initial render
    requestCameraAccess();
    return () => {
      stopCamera();
    };
  }, []);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) {
      setErrorMessage("Please enter the QR code text or use camera scan.");
      return;
    }
    handleValidCodeScanned(manualInput);
  };

  return (
    <div className="w-full max-w-3xl mx-auto py-8 px-4">
      {/* Step Breadcrumbs - do not reveal codes or unfulfilled room */}
      <div className="mb-6 flex items-center justify-between text-xs text-slate-500 font-medium overflow-x-auto pb-2">
        <div className="flex items-center gap-1.5 text-emerald-600 font-bold">
          <CheckCircle2 className="w-4 h-4" />
          <span>1. Registration</span>
        </div>
        <span className="text-slate-300">→</span>
        <div className={`flex items-center gap-1.5 ${isPythonGate ? "text-blue-600 font-bold" : "text-emerald-600 font-bold"}`}>
          {isPythonGate ? <QrCode className="w-4 h-4 text-blue-600" /> : <CheckCircle2 className="w-4 h-4" />}
          <span>2. Desk QR</span>
        </div>
        <span className="text-slate-300">→</span>
        <div className={`flex items-center gap-1.5 ${!isPythonGate ? "text-emerald-600 font-bold" : "text-slate-400"}`}>
          <Code2 className="w-4 h-4" />
          <span>3. Python Problem</span>
        </div>
        <span className="text-slate-300">→</span>
        <div className={`flex items-center gap-1.5 ${!isPythonGate ? "text-blue-600 font-bold" : "text-slate-400"}`}>
          <MapPin className="w-4 h-4" />
          <span>4. Room QR</span>
        </div>
        <span className="text-slate-300">→</span>
        <div className="flex items-center gap-1.5 text-slate-400">
          <FileText className="w-4 h-4" />
          <span>5. Exam Portal</span>
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        {/* Header - without revealing secret targetCode */}
        <div className={`p-6 text-white ${isPythonGate ? "bg-gradient-to-r from-blue-700 to-indigo-800" : "bg-gradient-to-r from-emerald-700 to-teal-800"}`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white backdrop-blur-xs mb-2">
                <QrCode className="w-3.5 h-3.5" />
                {isPythonGate ? "Stage 2: Registration Desk Check-In" : "Stage 4: Room Gate Verification"}
              </span>
              <h1 className="text-2xl font-bold tracking-tight">
                {isPythonGate ? "Scan Desk QR Code" : `Scan Room ${roomNumber || ""} Exam Gate QR`}
              </h1>
              <p className="text-xs sm:text-sm text-white/90 mt-1">
                {isPythonGate
                  ? "Scan the QR code displayed at your registration desk with your camera to unlock the Python challenge."
                  : `Scan the examination QR code on your desk inside Room ${roomNumber || ""} to proceed.`}
              </p>
            </div>

            <div className="bg-white/10 p-3 rounded-2xl border border-white/20 hidden sm:block text-center shrink-0">
              <span className="text-[10px] uppercase font-bold text-white/80 block">Security Gate</span>
              <span className="text-xs font-bold text-emerald-300 flex items-center justify-center gap-1 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Live Camera Ready
              </span>
            </div>
          </div>

          {/* Candidate badge - only show roomNumber if already unlocked */}
          <div className="mt-4 pt-3 border-t border-white/15 flex flex-wrap items-center gap-3 text-xs text-white/90">
            <span className="flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-white/70" />
              <strong>{student.name}</strong>
            </span>
            <span>•</span>
            <span>Phone: <strong className="font-mono">{student.phone}</strong></span>
            <span>•</span>
            <span>Roll: <strong className="font-mono">{student.roll}</strong></span>
            <span>•</span>
            <span>Dept: <strong>{student.department}</strong> ({student.section})</span>
            {roomNumber && (
              <>
                <span>•</span>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-amber-950 font-bold flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  Assigned Room: {roomNumber}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Scanner Viewport Section */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Room Banner if Stage 4 (condition fulfilled) */}
          {!isPythonGate && roomNumber && (
            <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-950 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-lg shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-amber-900">
                    Location Verified: Room Number <strong>{roomNumber}</strong>
                  </h3>
                  <p className="text-xs text-amber-800">
                    You have arrived at Room <strong>{roomNumber}</strong>. Please scan the QR code located on your examination desk.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Camera Access Request Prompt Card */}
          <div className={`p-5 rounded-2xl border transition-all ${
            cameraActive
              ? "bg-emerald-50 border-emerald-300 text-emerald-950"
              : "bg-blue-50/90 border-blue-300 text-blue-950"
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className={`p-3 rounded-2xl shrink-0 ${
                  cameraActive ? "bg-emerald-200 text-emerald-800" : "bg-blue-200 text-blue-800"
                }`}>
                  {cameraActive ? (
                    <Camera className="w-6 h-6 text-emerald-700" />
                  ) : (
                    <Camera className="w-6 h-6 text-blue-700 animate-pulse" />
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-black tracking-tight flex items-center gap-2">
                    {cameraActive ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Camera Access Granted · Scanner Live</span>
                      </>
                    ) : (
                      <>
                        <ShieldAlert className="w-4 h-4 text-blue-600" />
                        <span>Camera Access Required to Scan QR</span>
                      </>
                    )}
                  </h4>
                  <p className="text-xs opacity-90 mt-1 leading-relaxed">
                    {cameraActive
                      ? "The camera is active. Point your camera at the physical QR code to scan."
                      : "Please give camera access to scan the designated QR code. Tap 'Allow' when prompted by your browser."}
                  </p>
                  {permissionDeniedHelp && (
                    <p className="text-xs text-amber-800 font-medium mt-1.5 bg-amber-100/80 p-2 rounded-lg border border-amber-300">
                      💡 Tip: If camera access was blocked, click the camera icon in your browser address bar to allow it, or use the <strong>Quick Scan</strong> button below.
                    </p>
                  )}
                </div>
              </div>

              {!cameraActive && (
                <button
                  type="button"
                  id="btn-request-camera-permission"
                  onClick={requestCameraAccess}
                  disabled={isRequestingCamera}
                  className="px-5 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
                >
                  {isRequestingCamera ? (
                    <>
                      <RotateCw className="w-4 h-4 animate-spin" />
                      <span>Requesting Access...</span>
                    </>
                  ) : (
                    <>
                      <Camera className="w-4 h-4" />
                      <span>Give Camera Access & Open Scanner</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Camera Viewfinder Box */}
          <div className="relative max-w-md mx-auto aspect-square bg-slate-900 rounded-3xl overflow-hidden shadow-inner border-4 border-slate-800 flex items-center justify-center">
            {/* Live Video Feed */}
            <video
              ref={videoRef}
              className={`w-full h-full object-cover ${cameraActive ? "block" : "hidden"}`}
              playsInline
              muted
            />

            {/* Hidden canvas for processing video frames with jsQR */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Inactive Camera Fallback State */}
            {!cameraActive && (
              <div className="p-6 text-center text-slate-400 space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-slate-800 mx-auto flex items-center justify-center text-slate-500">
                  <CameraOff className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">Camera Not Active</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                    Click <strong>"Give Camera Access"</strong> above to turn on camera, or use the simulated Quick Scan below.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={requestCameraAccess}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Turn On Camera</span>
                </button>
              </div>
            )}

            {/* Scanner Frame Guide Overlay (Shown when camera is active) */}
            {cameraActive && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="relative w-56 h-56 border-2 border-emerald-400/80 rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]">
                  {/* Glowing Animated Scanning Line */}
                  <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-[scan_2s_ease-in-out_infinite] shadow-[0_0_8px_#34d399]" />
                  
                  {/* Corner Reticles */}
                  <div className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-emerald-400 rounded-tl-md" />
                  <div className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-emerald-400 rounded-tr-md" />
                  <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-emerald-400 rounded-bl-md" />
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-emerald-400 rounded-br-md" />
                </div>

                <div className="absolute bottom-4 bg-slate-900/85 backdrop-blur-xs text-white text-[11px] font-medium px-3.5 py-1 rounded-full border border-white/20">
                  Align QR Code within Frame
                </div>
              </div>
            )}

            {/* Success Animation Overlay */}
            {isSuccessMatched && (
              <div className="absolute inset-0 bg-emerald-600/90 backdrop-blur-xs flex flex-col items-center justify-center text-white animate-in fade-in duration-200">
                <CheckCircle2 className="w-16 h-16 animate-bounce" />
                <h3 className="text-xl font-bold mt-2">QR Code Verified!</h3>
                <span className="text-[11px] text-white/80 mt-1">Condition verified · Proceeding...</span>
              </div>
            )}
          </div>

          {/* Feedback & Error Alerts */}
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Manual Input Form */}
          <form onSubmit={handleManualSubmit} className="pt-2 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Or Manually Enter QR Code
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value.toUpperCase())}
                placeholder="Scan using camera or enter code"
                className="flex-1 px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono uppercase"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Verify Code
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
