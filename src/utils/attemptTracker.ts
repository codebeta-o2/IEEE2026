export interface PastAttemptRecord {
  attemptNumber: number;
  timestamp: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  submissionId: string;
}

export interface AttemptCheckResult {
  enrollmentNumber: string;
  attemptCount: number;
  maxAttempts: number;
  canAttempt: boolean;
  remainingAttempts: number;
  isBlocked: boolean;
  message: string;
  pastAttempts: PastAttemptRecord[];
  source: "local" | "server" | "google_sheet";
}

const STORAGE_KEY = "ieee_exam_attempts_ledger_v2";

export function getLocalLedger(): Record<string, PastAttemptRecord[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (err) {
    console.warn("Failed to read local attempts ledger:", err);
    return {};
  }
}

export function getLocalAttempts(enrollmentNumber: string): PastAttemptRecord[] {
  const key = enrollmentNumber.trim().toUpperCase();
  const ledger = getLocalLedger();
  return ledger[key] || [];
}

export function recordLocalAttempt(
  enrollmentNumber: string,
  record: PastAttemptRecord
): void {
  try {
    const key = enrollmentNumber.trim().toUpperCase();
    const ledger = getLocalLedger();
    const existing = ledger[key] || [];
    
    if (!existing.some((r) => r.submissionId === record.submissionId)) {
      existing.push(record);
      ledger[key] = existing;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ledger));
    }
  } catch (err) {
    console.warn("Failed to write to local attempts ledger:", err);
  }
}

export async function checkEnrollmentAttempts(
  rawEnrollment: string
): Promise<AttemptCheckResult> {
  const enrollment = rawEnrollment.trim().toUpperCase();
  if (!enrollment) {
    return {
      enrollmentNumber: "",
      attemptCount: 0,
      maxAttempts: 2,
      canAttempt: true,
      remainingAttempts: 2,
      isBlocked: false,
      message: "Please enter an Enrollment Number to check eligibility.",
      pastAttempts: [],
      source: "local",
    };
  }

  const ledger = getLocalLedger();
  const localAttempts = ledger[enrollment] || [];

  // Query backend server API
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const res = await fetch(`/api/check-attempts?enrollmentNumber=${encodeURIComponent(enrollment)}`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const serverData = await res.json();
      const count = Math.max(serverData.attemptCount || 0, localAttempts.length);
      const can = count < 2;

      return {
        enrollmentNumber: enrollment,
        attemptCount: count,
        maxAttempts: 2,
        canAttempt: can,
        remainingAttempts: Math.max(0, 2 - count),
        isBlocked: !can,
        message: can
          ? `Eligible: Attempt ${count + 1} of 2 available.`
          : `Access Blocked: Maximum 2 attempts reached for Enrollment No: ${enrollment}.`,
        pastAttempts: serverData.pastAttempts && serverData.pastAttempts.length > 0
          ? serverData.pastAttempts
          : localAttempts,
        source: "server",
      };
    }
  } catch (serverErr) {
    // Offline
  }

  const count = localAttempts.length;
  const can = count < 2;

  return {
    enrollmentNumber: enrollment,
    attemptCount: count,
    maxAttempts: 2,
    canAttempt: can,
    remainingAttempts: Math.max(0, 2 - count),
    isBlocked: !can,
    message: can
      ? `Local Status: Attempt ${count + 1} of 2 available.`
      : `Access Blocked: Maximum 2 attempts recorded locally for ${enrollment}.`,
    pastAttempts: localAttempts,
    source: "local",
  };
}
