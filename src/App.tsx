import React, { useState, useEffect, useCallback, useRef } from "react";
import { 
  StudentDetails, 
  QuestionData, 
  QuizSubmission, 
  ExamStep, 
  QuestionViewMode, 
  SubmissionReason,
  NetworkMode,
  NetworkCheckStatus
} from "./types";
import { 
  probeDeviceConnectivity, 
  subscribeToNetworkEvents, 
  inspectConnectionDetails 
} from "./utils/networkMonitor";
import { setupAntiCopyPasteGuard } from "./utils/antiCheating";
import { AntiCheatNotification } from "./components/AntiCheatNotification";
import { selectRandomQuestions, evaluateExamAnswers, fetchExamQuestions } from "./utils/questionSelector";
import { RegistrationForm } from "./components/RegistrationForm";
import { QrCodeScannerView } from "./components/QrCodeScannerView";
import { PythonBlockGame } from "./components/PythonBlockGame";
import { QuizHeader } from "./components/QuizHeader";
import { ToggledQuestionView } from "./components/ToggledQuestionView";
import { QuestionPalette } from "./components/QuestionPalette";
import { SubmissionModal } from "./components/SubmissionModal";
import { GoogleSheetSuccessModal } from "./components/GoogleSheetSuccessModal";
import { ResultView } from "./components/ResultView";
import { InvigilatorModal } from "./components/InvigilatorModal";
import { OfflineAeroplaneModal } from "./components/OfflineAeroplaneModal";
import { recordLocalAttempt, getLocalAttempts } from "./utils/attemptTracker";
import { 
  sendSubmissionToGoogleSheet, 
  flushPendingSubmissions, 
  initGoogleSheetSync 
} from "./utils/googleSheetsSync";
import { 
  ShieldAlert, 
  Wifi, 
  WifiOff, 
  Clock, 
  FileText, 
  CheckCircle2, 
  AlertTriangle,
  QrCode,
  Code2,
  MapPin
} from "lucide-react";

const TOTAL_DURATION_SECONDS = 1200; // 20 minutes (1 minute per question for 20 questions)

export default function App() {
  // Core Navigation State
  const [step, setStep] = useState<ExamStep>("REGISTRATION");

  // Student details
  const [student, setStudent] = useState<StudentDetails | null>(null);

  // Verification stage details - room is locked until Python challenge condition is fulfilled
  const [assignedRoom, setAssignedRoom] = useState<string>("");
  const [isPythonSolved, setIsPythonSolved] = useState<boolean>(false);

  // Questions state: automatically selected 20 questions randomly from JSON bank
  const [questions, setQuestions] = useState<QuestionData[]>(() => selectRandomQuestions(20));
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Student Answers state
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [markedForReview, setMarkedForReview] = useState<Set<string>>(new Set());
  const [visitedQuestions, setVisitedQuestions] = useState<Set<string>>(() => {
    const initial = selectRandomQuestions(20);
    return new Set([initial[0]?.id || "q1"]);
  });

  // Toggled Question and Option View
  const [viewMode, setViewMode] = useState<QuestionViewMode>("QUESTION");
  const [toggleCount, setToggleCount] = useState<number>(0);

  // Time limit state
  const [timeRemaining, setTimeRemaining] = useState<number>(TOTAL_DURATION_SECONDS);

  // Network State & Offline Proctoring
  const [networkMode, setNetworkMode] = useState<NetworkMode>("REAL_DEVICE");
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== "undefined" ? navigator.onLine : false;
  });
  const [hasNetworkTriggered, setHasNetworkTriggered] = useState<boolean>(false);
  const [isCheckingNetwork, setIsCheckingNetwork] = useState<boolean>(false);
  const [networkCheckStatus, setNetworkCheckStatus] = useState<NetworkCheckStatus>(() => {
    const details = inspectConnectionDetails();
    return {
      isOnline: details.isOnline,
      isMobileNetwork: details.isMobileNetwork,
      connectionType: details.connectionType,
      effectiveType: details.effectiveType,
      networkLabel: details.networkLabel,
      isMobileDevice: details.isMobileDevice,
      lastChecked: null,
      checkMethod: "navigator",
      checksCount: 0,
    };
  });

  // Anti-Cheating Protection
  useEffect(() => {
    const teardownAntiCheat = setupAntiCopyPasteGuard();
    return () => {
      teardownAntiCheat();
    };
  }, []);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submissionModalOpen, setSubmissionModalOpen] = useState<boolean>(false);
  const [submissionReason, setSubmissionReason] = useState<SubmissionReason>("MANUAL_SUBMISSION");
  const [submissionResult, setSubmissionResult] = useState<QuizSubmission | null>(null);

  // Google Sheet Success Feedback Popup
  const [sheetSuccessModalOpen, setSheetSuccessModalOpen] = useState<boolean>(false);
  const [sheetSuccessData, setSheetSuccessData] = useState<{ rowNumber?: number; message?: string } | null>(null);

  // Invigilator / Server Log Modal
  const [invigilatorModalOpen, setInvigilatorModalOpen] = useState<boolean>(false);

  // Refs for tracking active state in listeners
  const activeStepRef = useRef(step);
  activeStepRef.current = step;

  const isSubmittingRef = useRef(isSubmitting);
  isSubmittingRef.current = isSubmitting;

  const isOnlineRef = useRef(isOnline);
  isOnlineRef.current = isOnline;

  const submissionResultRef = useRef(submissionResult);
  submissionResultRef.current = submissionResult;

  const answersRef = useRef(answers);
  answersRef.current = answers;

  const studentRef = useRef(student);
  studentRef.current = student;

  const timeRemainingRef = useRef(timeRemaining);
  timeRemainingRef.current = timeRemaining;

  const toggleCountRef = useRef(toggleCount);
  toggleCountRef.current = toggleCount;

  const assignedRoomRef = useRef(assignedRoom);
  assignedRoomRef.current = assignedRoom;

  // Single-submission safeguard ref to prevent duplicate submissions
  const hasCompletedSubmissionRef = useRef(false);

  // Load questions from server if accessible and sync Google Sheet URL
  useEffect(() => {
    initGoogleSheetSync();

    fetch("/api/questions")
      .then((res) => res.json())
      .then((data) => {
        if (data.questions && data.questions.length > 0) {
          setQuestions(data.questions);
        }
      })
      .catch((err) => {
        console.log("Using built-in question bank:", err);
      });
  }, []);

  // Server Submission Pipeline
  const executeSubmission = useCallback(async (reason: SubmissionReason) => {
    if (isSubmittingRef.current || hasCompletedSubmissionRef.current) return;
    isSubmittingRef.current = true;
    hasCompletedSubmissionRef.current = true;
    setIsSubmitting(true);
    setSubmissionReason(reason);

    const currentStudent = studentRef.current;
    if (!currentStudent) {
      isSubmittingRef.current = false;
      hasCompletedSubmissionRef.current = false;
      setIsSubmitting(false);
      return;
    }

    const isNetworkActive = isOnlineRef.current || reason === "AUTO_NETWORK_DETECTED";

    // If on network (or network auto-detected trigger), submit directly to server & Google Sheet!
    if (isNetworkActive) {
      try {
        const payload = {
          student: currentStudent,
          answers: answersRef.current,
          questionIds: questions.map((q) => q.id),
          timeRemainingSeconds: timeRemainingRef.current,
          totalDurationSeconds: TOTAL_DURATION_SECONDS,
          submissionReason: reason,
          toggleCount: toggleCountRef.current,
          roomNumber: assignedRoomRef.current || "B2LG2.8",
          pythonGameSolved: true,
        };

        const response = await fetch("/api/submit-quiz", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error("Server rejected submission");
        }

        const data = await response.json();
        const attemptNum = data.submission.attemptNumber || 1;

        recordLocalAttempt(currentStudent.enrollmentNumber, {
          attemptNumber: attemptNum,
          timestamp: data.submission.submittedAt || new Date().toISOString(),
          score: data.submission.score,
          totalQuestions: data.submission.totalQuestions,
          percentage: data.submission.percentage,
          submissionId: data.submission.id,
        });

        const normalizedBreakdown = Array.isArray(data.submission?.breakdown) && data.submission.breakdown.length > 0
          ? data.submission.breakdown
          : questions.map((q, index) => ({
              questionId: q.id,
              questionNumber: index + 1,
              questionText: q.question,
              options: q.options,
              selectedOption: typeof answersRef.current[q.id] === "number" ? answersRef.current[q.id] : null,
              correctOption: 0,
              isCorrect: false,
              explanation: "Official solution is still being verified by the exam server.",
            }));

        const finalSubmission: QuizSubmission = {
          ...data.submission,
          score: data.submission?.score ?? data.submission?.correctAnswersCount ?? 0,
          totalQuestions: data.submission?.totalQuestions ?? questions.length,
          correctAnswersCount: data.submission?.correctAnswersCount ?? 0,
          incorrectAnswersCount: data.submission?.incorrectAnswersCount ?? 0,
          unansweredCount: data.submission?.unansweredCount ?? 0,
          percentage: data.submission?.percentage ?? 0,
          breakdown: normalizedBreakdown,
          attemptNumber: attemptNum,
          roomNumber: assignedRoomRef.current || "B2LG2.8",
          pythonGameSolved: true,
          isSubmittedOnNetwork: true,
          networkSubmittedAt: data.submission?.networkSubmittedAt || new Date().toISOString(),
          sheetSyncResult: data.sheetResult || null,
        };

        setSubmissionResult(finalSubmission);
        setSubmissionModalOpen(false);
        setStep("SUBMISSION_RESULT");
        setIsSubmitting(false);

        if (data.sheetResult?.success) {
          setSheetSuccessData({
            rowNumber: data.sheetResult.data?.rowNumber,
            message: data.sheetResult.message || "Successfully recorded in Google Sheet",
          });
          setSheetSuccessModalOpen(true);
        }
        return;
      } catch (error) {
        console.error("Online submission failed, falling back to local evaluation:", error);
      }
    }

    // Offline mode conclusion
    const evaluation = evaluateExamAnswers(answersRef.current, questions);
    const fallbackBreakdown = evaluation.breakdown.map((b) => ({
      ...b,
      explanation: "Official explanation is locked and will be unlocked once submitted to the exam server over the network.",
    }));

    const percentage = Math.round((evaluation.correctCount / questions.length) * 100);
    const priorLocal = getLocalAttempts(currentStudent.enrollmentNumber);
    const attemptNum = priorLocal.length + 1;

    const offlineSubmission: QuizSubmission = {
      id: `sub_${Date.now()}`,
      student: currentStudent,
      answers: answersRef.current,
      score: evaluation.correctCount,
      totalQuestions: questions.length,
      correctAnswersCount: evaluation.correctCount,
      incorrectAnswersCount: evaluation.incorrectCount,
      unansweredCount: evaluation.unansweredCount,
      percentage,
      timeSpentSeconds: Math.max(0, TOTAL_DURATION_SECONDS - timeRemainingRef.current),
      totalDurationSeconds: TOTAL_DURATION_SECONDS,
      submissionReason: reason,
      toggleCount: toggleCountRef.current,
      submittedAt: new Date().toISOString(),
      isSubmittedOnNetwork: false,
      attemptNumber: attemptNum,
      roomNumber: assignedRoomRef.current || "B2LG2.8",
      pythonGameSolved: true,
      breakdown: fallbackBreakdown,
    };

    recordLocalAttempt(currentStudent.enrollmentNumber, {
      attemptNumber: attemptNum,
      timestamp: offlineSubmission.submittedAt,
      score: offlineSubmission.score,
      totalQuestions: offlineSubmission.totalQuestions,
      percentage: offlineSubmission.percentage,
      submissionId: offlineSubmission.id,
    });

    sendSubmissionToGoogleSheet(offlineSubmission, attemptNum);

    setSubmissionResult(offlineSubmission);
    setSubmissionModalOpen(false);
    setStep("SUBMISSION_RESULT");
    setIsSubmitting(false);
  }, [questions]);

  // Submit to Server on Network
  const handleSubmitToNetwork = useCallback(async () => {
    const currentSub = submissionResultRef.current;
    if (!currentSub || isSubmittingRef.current) return;
    setIsSubmitting(true);

    try {
      const payload = {
        student: currentSub.student,
        answers: currentSub.answers,
        questionIds: currentSub.breakdown.map((b) => b.questionId),
        timeRemainingSeconds: Math.max(0, TOTAL_DURATION_SECONDS - currentSub.timeSpentSeconds),
        totalDurationSeconds: TOTAL_DURATION_SECONDS,
        submissionReason: currentSub.submissionReason,
        toggleCount: currentSub.toggleCount,
        roomNumber: currentSub.roomNumber || assignedRoomRef.current || "B2LG2.8",
        pythonGameSolved: true,
      };

      const response = await fetch("/api/submit-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Server rejected submission");
      }

      const data = await response.json();
      setIsOnline(true);

      const normalizedBreakdown = Array.isArray(data.submission?.breakdown) && data.submission.breakdown.length > 0
        ? data.submission.breakdown
        : currentSub.breakdown;

      const updatedSub: QuizSubmission = {
        ...data.submission,
        score: data.submission?.score ?? data.submission?.correctAnswersCount ?? currentSub.score,
        totalQuestions: data.submission?.totalQuestions ?? currentSub.totalQuestions,
        correctAnswersCount: data.submission?.correctAnswersCount ?? currentSub.correctAnswersCount,
        incorrectAnswersCount: data.submission?.incorrectAnswersCount ?? currentSub.incorrectAnswersCount,
        unansweredCount: data.submission?.unansweredCount ?? currentSub.unansweredCount,
        percentage: data.submission?.percentage ?? currentSub.percentage,
        breakdown: normalizedBreakdown,
        attemptNumber: data.submission?.attemptNumber || currentSub.attemptNumber || 1,
        roomNumber: assignedRoomRef.current || "B2LG2.8",
        pythonGameSolved: true,
        isSubmittedOnNetwork: true,
        networkSubmittedAt: new Date().toISOString(),
        sheetSyncResult: data.sheetResult || null,
      };

      setSubmissionResult(updatedSub);
      if (data.sheetResult?.success) {
        setSheetSuccessData({
          rowNumber: data.sheetResult.data?.rowNumber,
          message: data.sheetResult.message || "Successfully recorded in Google Sheet",
        });
        setSheetSuccessModalOpen(true);
      }
      flushPendingSubmissions();
    } catch (error) {
      console.error("Failed to submit to server on network:", error);
      alert("Could not connect to the exam server. Please check your connection and retry.");
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  // Active Network Checker
  const performNetworkCheck = useCallback(async (source: "watchdog" | "manual" | "event" = "watchdog") => {
    setIsCheckingNetwork(true);
    try {
      const probe = await probeDeviceConnectivity(1800);
      const isDevOnline = probe.isOnline;
      setIsOnline(isDevOnline);

      setNetworkCheckStatus((prev) => ({
        isOnline: isDevOnline,
        lastChecked: new Date(),
        checkMethod: probe.method,
        latencyMs: probe.latencyMs,
        checksCount: prev.checksCount + 1,
        isMobileNetwork: probe.isMobileNetwork,
        connectionType: probe.connectionType,
        effectiveType: probe.effectiveType,
        networkLabel: probe.networkLabel,
        isMobileDevice: probe.isMobileDevice,
      }));

      // WATCHDOG AUTO-SUBMIT: If during active quiz, the device is detected online, trigger auto-submit!
      if (activeStepRef.current === "QUIZ_ACTIVE" && isDevOnline && !isSubmittingRef.current && !hasCompletedSubmissionRef.current) {
        console.warn("[Network Watchdog] Network connectivity detected during active offline exam! Auto-submitting...");
        setHasNetworkTriggered(true);
        executeSubmission("AUTO_NETWORK_DETECTED");
      }
    } catch (err) {
      console.error("Network probe error:", err);
    } finally {
      setIsCheckingNetwork(false);
    }
  }, [executeSubmission]);

  // Periodic Watchdog timer during active exam
  useEffect(() => {
    if (step !== "QUIZ_ACTIVE") return;

    const interval = setInterval(() => {
      performNetworkCheck("watchdog");
    }, 1800);

    return () => clearInterval(interval);
  }, [step, performNetworkCheck]);

  // Countdown Timer
  useEffect(() => {
    if (step !== "QUIZ_ACTIVE" || isSubmitting) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          executeSubmission("TIMER_EXPIRED");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [step, isSubmitting, executeSubmission]);

  // Stage 1: Registration Form Submission -> Transitions to Scan QR: "IEEE-PYTHON-GAME"
  const handleRegistrationSubmit = (details: StudentDetails) => {
    setStudent(details);
    setStep("SCAN_PYTHON_QR");
  };

  // Stage 2: QR "IEEE-PYTHON-GAME" Scanned -> Transitions to Python Block Assembly Challenge
  const handlePythonQrScanned = (_code: string) => {
    setStep("PYTHON_GAME");
  };

  // Stage 3: Python Challenge Solved -> Shows Room "B2LG2.8", transitions to Scan QR "IEEE-EXAM-START"
  const handlePythonGameSolved = (room: string) => {
    setAssignedRoom(room);
    setIsPythonSolved(true);
    setStep("SCAN_EXAM_QR");
  };

  // Stage 4: QR "IEEE-EXAM-START" Scanned -> Notifies candidate to switch to offline / airplane mode!
  const handleExamQrScanned = async (_code: string) => {
    if (!student) return;
    performNetworkCheck("event");
    setStep("OFFLINE_WARNING");
  };

  // Start Exam Handler
  const handleStartExam = async (details: StudentDetails) => {
    hasCompletedSubmissionRef.current = false;
    isSubmittingRef.current = false;
    setIsSubmitting(false);

    const sessionQuestions = await fetchExamQuestions(20);
    setQuestions(sessionQuestions);
    setStudent(details);
    setTimeRemaining(TOTAL_DURATION_SECONDS);
    setAnswers({});
    setMarkedForReview(new Set());
    setVisitedQuestions(new Set([sessionQuestions[0]?.id || "q1"]));
    setCurrentQuestionIndex(0);
    setViewMode("QUESTION");
    setToggleCount(0);
    setNetworkMode("REAL_DEVICE");
    setHasNetworkTriggered(false);
    performNetworkCheck("event");
    setStep("QUIZ_ACTIVE");
  };

  // Retake / New Candidate Handler
  const handleRetakeExam = async () => {
    hasCompletedSubmissionRef.current = false;
    isSubmittingRef.current = false;
    setIsSubmitting(false);

    const freshQuestions = await fetchExamQuestions(20);
    setQuestions(freshQuestions);
    setVisitedQuestions(new Set([freshQuestions[0]?.id || "q1"]));
    setStudent(null);
    setSubmissionResult(null);
    setAssignedRoom("");
    setIsPythonSolved(false);
    setStep("REGISTRATION");
  };

  // Option selection
  const handleSelectOption = (optionIndex: number) => {
    const currentQ = questions[currentQuestionIndex];
    if (!currentQ) return;
    setAnswers((prev) => ({
      ...prev,
      [currentQ.id]: optionIndex,
    }));
  };

  // Clear answer
  const handleClearOption = () => {
    const currentQ = questions[currentQuestionIndex];
    if (!currentQ) return;
    setAnswers((prev) => {
      const next = { ...prev };
      delete next[currentQ.id];
      return next;
    });
  };

  // Toggle Mark for Review
  const handleToggleMarkReview = () => {
    const currentQ = questions[currentQuestionIndex];
    if (!currentQ) return;
    setMarkedForReview((prev) => {
      const next = new Set(prev);
      if (next.has(currentQ.id)) {
        next.delete(currentQ.id);
      } else {
        next.add(currentQ.id);
      }
      return next;
    });
  };

  // Navigation handlers
  const handleNavigateToQuestion = (index: number) => {
    if (index < 0 || index >= questions.length) return;
    setCurrentQuestionIndex(index);
    const targetQ = questions[index];
    setVisitedQuestions((prev) => new Set(prev).add(targetQ.id));
    setViewMode("QUESTION");
  };

  const handleNextQuestion = () => {
    handleNavigateToQuestion(currentQuestionIndex + 1);
  };

  const handlePrevQuestion = () => {
    handleNavigateToQuestion(currentQuestionIndex - 1);
  };

  const currentQ = questions[currentQuestionIndex] || questions[0];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Top Global Bar */}
      <nav className="bg-slate-900 text-white px-4 py-2.5 text-xs flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="font-bold tracking-tight">Offline MCQ Examination System</span>
          <span className="text-slate-500 hidden sm:inline">|</span>
          <span className="text-slate-400 hidden sm:inline">IEEE Student Examination System</span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div
            id="badge-server-sync"
            className="text-xs text-emerald-300 flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 border border-emerald-900/50"
            title="Google Sheet integration active"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Google Sheet Synced</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>

          <button
            type="button"
            id="btn-nav-server-logs"
            onClick={() => setInvigilatorModalOpen(true)}
            className="text-xs text-slate-300 hover:text-white flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-blue-400" />
            <span>Examiner Logs</span>
          </button>
        </div>
      </nav>

      {/* Main View Router */}
      <main className="flex-1 flex flex-col">
        {/* Step 1: Candidate Registration Form */}
        {step === "REGISTRATION" && (
          <RegistrationForm
            onStartExam={handleRegistrationSubmit}
            isOnline={isOnline}
            networkMode={networkMode}
            networkCheckStatus={networkCheckStatus}
            isCheckingNetwork={isCheckingNetwork}
            onToggleNetworkMode={setNetworkMode}
            onCheckNetworkNow={() => performNetworkCheck("manual")}
          />
        )}

        {/* Step 2: Scan QR "IEEE-PYTHON-GAME" */}
        {step === "SCAN_PYTHON_QR" && student && (
          <QrCodeScannerView
            targetCode="IEEE-PYTHON-GAME"
            student={student}
            onSuccess={handlePythonQrScanned}
            onBackToRegistration={() => setStep("REGISTRATION")}
          />
        )}

        {/* Step 3: Python Code Block Assembly Challenge */}
        {step === "PYTHON_GAME" && student && (
          <PythonBlockGame
            student={student}
            onSolved={handlePythonGameSolved}
          />
        )}

        {/* Step 4: Scan QR "IEEE-EXAM-START" inside Room B2LG2.8 */}
        {step === "SCAN_EXAM_QR" && student && (
          <QrCodeScannerView
            targetCode="IEEE-EXAM-START"
            student={student}
            roomNumber={assignedRoom}
            onSuccess={handleExamQrScanned}
            onBackToRegistration={() => setStep("REGISTRATION")}
          />
        )}

        {/* Step 5: Mandatory Offline / Airplane Mode Notification */}
        {step === "OFFLINE_WARNING" && student && (
          <OfflineAeroplaneModal
            student={student}
            isOnline={isOnline}
            networkCheckStatus={networkCheckStatus}
            isCheckingNetwork={isCheckingNetwork}
            onCheckNetworkNow={() => performNetworkCheck("manual")}
            onConfirmAndStartExam={() => handleStartExam(student)}
          />
        )}

        {/* Step 6: Active Timed Offline MCQ Exam */}
        {step === "QUIZ_ACTIVE" && student && (
          <div className="flex-1 flex flex-col">
            <QuizHeader
              student={student}
              timeRemainingSeconds={timeRemaining}
              totalDurationSeconds={TOTAL_DURATION_SECONDS}
              isOnline={isOnline}
              networkMode={networkMode}
              networkCheckStatus={networkCheckStatus}
              isCheckingNetwork={isCheckingNetwork}
              onToggleNetworkMode={setNetworkMode}
              onCheckNetworkNow={() => performNetworkCheck("manual")}
              onRequestManualSubmit={() => {
                setSubmissionReason("MANUAL_SUBMISSION");
                setSubmissionModalOpen(true);
              }}
              totalQuestions={questions.length}
              answeredCount={Object.keys(answers).length}
            />

            {/* Offline Proctoring Alert Banner */}
            <div className="bg-blue-50/70 border-b border-blue-200/60 py-2 px-4 text-xs text-blue-900">
              <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
                  <span>
                    <strong>Room {assignedRoom} Active Watchdog:</strong> Offline exam mode enforced. Connecting to Wi-Fi or mobile data triggers instant auto-submission.
                  </span>
                </div>
                <div className="flex items-center gap-3 text-slate-600">
                  <span>Press <kbd className="px-1.5 py-0.5 bg-white rounded border border-slate-300 text-[10px] font-mono">Space</kbd> or <kbd className="px-1.5 py-0.5 bg-white rounded border border-slate-300 text-[10px] font-mono">T</kbd> to toggle Question / Options</span>
                </div>
              </div>
            </div>

            {/* Quiz Work Area */}
            <div className="max-w-7xl mx-auto w-full p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-start">
              {/* Left Column: Toggled Question and Option View */}
              <div className="lg:col-span-8">
                <ToggledQuestionView
                  question={currentQ}
                  currentIndex={currentQuestionIndex}
                  totalQuestions={questions.length}
                  selectedOption={answers[currentQ.id]}
                  isMarkedForReview={markedForReview.has(currentQ.id)}
                  viewMode={viewMode}
                  onSetViewMode={setViewMode}
                  onSelectOption={handleSelectOption}
                  onClearOption={handleClearOption}
                  onToggleMarkReview={handleToggleMarkReview}
                  onNext={handleNextQuestion}
                  onPrev={handlePrevQuestion}
                  toggleCount={toggleCount}
                  onIncrementToggle={() => setToggleCount((c) => c + 1)}
                  onRequestSubmit={() => {
                    setSubmissionReason("MANUAL_SUBMISSION");
                    setSubmissionModalOpen(true);
                  }}
                />
              </div>

              {/* Right Column: Question Palette & Instructions */}
              <div className="lg:col-span-4 space-y-4">
                <QuestionPalette
                  questions={questions}
                  currentIndex={currentQuestionIndex}
                  answers={answers}
                  markedForReview={markedForReview}
                  visitedQuestions={visitedQuestions}
                  onSelectQuestion={handleNavigateToQuestion}
                />

                <div className="bg-slate-100 border border-slate-200 rounded-2xl p-4 text-xs text-slate-600 space-y-2">
                  <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-blue-600" />
                    Cognitive Toggle Rule
                  </h4>
                  <p className="leading-relaxed">
                    Either the question or options are visible at one time. Once you read the question statement, switch to Options View to choose A, B, C, or D.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 6: Final Submission Scorecard & Solutions Review */}
        {step === "SUBMISSION_RESULT" && submissionResult && (
          <ResultView
            submission={submissionResult}
            onRetakeExam={handleRetakeExam}
            onOpenInvigilatorLog={() => setInvigilatorModalOpen(true)}
            onSubmitToNetwork={handleSubmitToNetwork}
            isSubmittingToNetwork={isSubmitting}
          />
        )}
      </main>

      {/* Submission Confirmation & Emergency Network Modal */}
      <SubmissionModal
        isOpen={submissionModalOpen}
        reason={submissionReason}
        isSubmitting={isSubmitting}
        answeredCount={Object.keys(answers).length}
        totalQuestions={questions.length}
        isOnline={isOnline}
        student={student}
        networkCheckStatus={networkCheckStatus}
        onConfirm={() => executeSubmission(submissionReason)}
        onCancel={() => setSubmissionModalOpen(false)}
        onCheckNetworkNow={() => performNetworkCheck("manual")}
        isCheckingNetwork={isCheckingNetwork}
      />

      {/* Real-time Anti-Cheat Security Notification Toast */}
      <AntiCheatNotification />

      {/* Google Sheet Success Popup Notification */}
      <GoogleSheetSuccessModal
        isOpen={sheetSuccessModalOpen}
        submission={submissionResult}
        sheetData={sheetSuccessData}
        onClose={() => setSheetSuccessModalOpen(false)}
      />

      {/* Invigilator / Server Audit Log Drawer */}
      <InvigilatorModal
        isOpen={invigilatorModalOpen}
        onClose={() => setInvigilatorModalOpen(false)}
        onViewSubmissionDetails={(sub) => {
          setSubmissionResult(sub);
          setStep("SUBMISSION_RESULT");
          setInvigilatorModalOpen(false);
        }}
      />
    </div>
  );
}
