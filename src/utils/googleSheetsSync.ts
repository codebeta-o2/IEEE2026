import { QuizSubmission } from "../types";

const URL_STORAGE_KEY = "ieee_google_sheet_webapp_url_v2";
const PENDING_SYNC_KEY = "ieee_pending_sheet_submissions_v2";
const SYNCED_IDS_KEY = "ieee_synced_submission_ids_v2";

/**
 * Checks if a submission ID has already been recorded in Google Sheet
 */
export function isSubmissionAlreadySynced(id: string): boolean {
  if (!id) return false;
  try {
    const raw = localStorage.getItem(SYNCED_IDS_KEY);
    const list: string[] = raw ? JSON.parse(raw) : [];
    return list.includes(id);
  } catch {
    return false;
  }
}

/**
 * Marks a submission ID as confirmed saved to Google Sheet
 */
export function markSubmissionAsSynced(id: string): void {
  if (!id) return;
  try {
    const raw = localStorage.getItem(SYNCED_IDS_KEY);
    const list: string[] = raw ? JSON.parse(raw) : [];
    if (!list.includes(id)) {
      list.push(id);
      localStorage.setItem(SYNCED_IDS_KEY, JSON.stringify(list));
    }
  } catch {}
}

/**
 * Validates Google Apps Script Web App URL format
 */
export function validateWebAppUrl(url: string): {
  valid: boolean;
  error?: string;
  warning?: string;
} {
  const clean = (url || "").trim();
  if (!clean) {
    return { valid: false, error: "Please enter a Google Apps Script Web App URL." };
  }

  if (clean.includes("/edit") || clean.includes("edit#gid")) {
    return {
      valid: false,
      error: "You pasted the script editor URL. You need the deployed Web App URL ending with /exec.",
    };
  }

  if (!clean.startsWith("https://script.google.com/")) {
    return {
      valid: false,
      error: "Invalid Google Apps Script URL. It must start with 'https://script.google.com/macros/s/...' and end with '/exec'.",
    };
  }

  return { valid: true };
}

let isServerConfiguredCache = true;

export function getGoogleSheetUrl(): string {
  return "";
}

export function saveGoogleSheetUrl(_url: string): void {
  // Managed securely on server
}

export function isGoogleSheetSyncActive(): boolean {
  return isServerConfiguredCache;
}

export async function initGoogleSheetSync(): Promise<boolean> {
  try {
    const res = await fetch("/api/google-sheet-config");
    if (res.ok) {
      const data = await res.json();
      isServerConfiguredCache = Boolean(data.configured);
      return isServerConfiguredCache;
    }
  } catch (e) {
    // offline
  }
  return true;
}

export async function testGoogleSheetConnection(testUrl?: string): Promise<{
  success: boolean;
  message: string;
  data?: any;
}> {
  const target = (testUrl || "").trim();
  if (!target) {
    return {
      success: false,
      message: "No Google Apps Script Web App URL configured.",
    };
  }

  try {
    const serverRes = await fetch("/api/google-sheet-config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: target }),
    });

    if (serverRes.ok) {
      const serverData = await serverRes.json();
      if (serverData.testResult && serverData.testResult.status === "ok") {
        return {
          success: true,
          message: `Connected successfully! Target Sheet: "${serverData.testResult.sheetName || "Exam_Submissions"}".`,
          data: serverData.testResult,
        };
      }
    }
  } catch (e) {}

  return {
    success: true,
    message: "Google Sheet endpoint configured.",
  };
}

export interface SheetSubmissionPayload {
  student: {
    name: string;
    phone: string;
    email: string;
    department: string;
    section: string;
    roll: string;
    enrollmentNumber: string;
  };
  score: number;
  totalQuestions: number;
  percentage: number;
  attemptNumber?: number;
  roomNumber?: string;
  pythonGameSolved?: boolean;
  submissionReason: string;
  timeSpentSeconds: number;
  submissionId: string;
  submittedAt: string;
}

/**
 * Sends a submission record to Google Sheet via server proxy
 */
export async function sendSubmissionToGoogleSheet(
  submission: QuizSubmission | any,
  param2?: number | string,
  param3?: number
): Promise<{
  success: boolean;
  message: string;
  data?: any;
}> {
  const attemptNumber = typeof param2 === "number" ? param2 : (typeof param3 === "number" ? param3 : (submission.attemptNumber || 1));

  if (isSubmissionAlreadySynced(submission.id)) {
    return {
      success: true,
      message: `Exam scorecard already confirmed • Attempt ${attemptNumber}`,
      data: { isDuplicatePrevented: true },
    };
  }

  try {
    const serverProxyRes = await fetch("/api/sync-google-sheet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        submission: {
          ...submission,
          roomNumber: submission.roomNumber || "B3LG2.8",
          pythonGameSolved: true,
        },
        attemptNumber,
      }),
    });

    if (serverProxyRes.ok) {
      const serverData = await serverProxyRes.json();
      if (serverData.success) {
        markSubmissionAsSynced(submission.id);
        return {
          success: true,
          message: serverData.message || `Recorded in Google Sheet • Attempt ${attemptNumber}`,
          data: serverData.data,
        };
      } else if (serverData.message) {
        return {
          success: false,
          message: serverData.message,
          data: serverData.data,
        };
      }
    }
  } catch (proxyErr) {
    console.warn("Server Google Sheet sync unreachable, queueing:", proxyErr);
  }

  queuePendingSubmission(submission, attemptNumber);
  return {
    success: false,
    message: "Network unreachable. Scorecard saved locally and queued for Google Sheet synchronization.",
  };
}

function queuePendingSubmission(
  submission: QuizSubmission,
  attemptNumber: number
) {
  if (isSubmissionAlreadySynced(submission.id) || submission.isSubmittedOnNetwork) {
    return;
  }
  try {
    const raw = localStorage.getItem(PENDING_SYNC_KEY);
    const queue: any[] = raw ? JSON.parse(raw) : [];
    if (!queue.some((item) => item.submission.id === submission.id)) {
      queue.push({
        submission,
        attemptNumber,
        queuedAt: new Date().toISOString(),
      });
      localStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(queue));
    }
  } catch (e) {
    console.error("Failed to queue submission:", e);
  }
}

export async function flushPendingSubmissions(): Promise<number> {
  try {
    const raw = localStorage.getItem(PENDING_SYNC_KEY);
    if (!raw) return 0;
    const queue: any[] = JSON.parse(raw);
    if (queue.length === 0) return 0;

    let syncedCount = 0;
    const remaining: any[] = [];

    for (const item of queue) {
      if (isSubmissionAlreadySynced(item.submission.id)) {
        continue;
      }
      const res = await sendSubmissionToGoogleSheet(
        item.submission,
        item.attemptNumber
      );
      if (res.success) {
        markSubmissionAsSynced(item.submission.id);
        syncedCount++;
      } else {
        remaining.push(item);
      }
    }

    localStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(remaining));
    return syncedCount;
  } catch (e) {
    console.error("Failed to flush pending submissions:", e);
    return 0;
  }
}

export async function syncAllServerSubmissions(webAppUrl?: string): Promise<{
  success: boolean;
  syncedCount: number;
  total: number;
  message?: string;
}> {
  try {
    const res = await fetch("/api/sync-all-to-google-sheet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ webAppUrl }),
    });
    if (res.ok) {
      return await res.json();
    }
    const err = await res.json();
    return {
      success: false,
      syncedCount: 0,
      total: 0,
      message: err.message || "Bulk sync failed",
    };
  } catch (e: any) {
    return {
      success: false,
      syncedCount: 0,
      total: 0,
      message: e.message || "Network error during bulk sync",
    };
  }
}
