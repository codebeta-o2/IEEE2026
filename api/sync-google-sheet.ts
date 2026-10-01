import "dotenv/config";

const DEFAULT_GOOGLE_SHEET_URL = "https://script.google.com/macros/s/AKfycbyBNOxR68rgD0fEdvFdZcD06KeDgvBgAUHP_tqO-uHEP5E0_kHWzH6vUr0jNl2IPQCT/exec";

export default async function handler(req: any, res: any) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  try {
    const { submission, attemptNumber = 1 } = req.body || {};
    if (!submission || !submission.student) {
      return res.status(400).json({ success: false, message: "Invalid submission payload" });
    }

    const sheetUrl = (process.env.GOOGLE_SHEET_WEBAPP_URL || DEFAULT_GOOGLE_SHEET_URL).trim();
    const payload = {
      student: submission.student,
      score: submission.score,
      totalQuestions: submission.totalQuestions,
      percentage: submission.percentage,
      attemptNumber,
      roomNumber: submission.roomNumber || "B2LG2.8",
      pythonGameSolved: true,
      submissionReason: submission.submissionReason,
      timeSpentSeconds: submission.timeSpentSeconds,
      submissionId: submission.id,
      submittedAt: submission.submittedAt,
    };

    const response = await fetch(sheetUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
    });

    const text = await response.text();
    let resJson: any = {};
    try {
      resJson = JSON.parse(text);
    } catch {
      resJson = { status: "success", message: "Recorded" };
    }

    return res.status(200).json({
      success: response.ok && resJson.status === "success",
      message: resJson.message || "Saved successfully!",
      data: resJson,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to sync to Google Sheet",
    });
  }
}
