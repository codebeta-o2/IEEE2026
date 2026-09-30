import rawQuestions from "../server/questions.json";

const DEFAULT_GOOGLE_SHEET_URL = "https://script.google.com/macros/s/AKfycbyBNOxR68rgD0fEdvFdZcD06KeDgvBgAUHP_tqO-uHEP5E0_kHWzH6vUr0jNl2IPQCT/exec";

const questionsMap = new Map<string, any>((rawQuestions as any[]).map((q) => [q.id, q]));

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
    const {
      student,
      answers = {},
      questionIds = [],
      timeRemainingSeconds = 0,
      totalDurationSeconds = 1200,
      submissionReason = "MANUAL_SUBMISSION",
      toggleCount = 0,
      roomNumber = "B2LG2.8",
      pythonGameSolved = true,
    } = req.body || {};

    if (!student || !student.name || !student.email || !student.roll) {
      return res.status(400).json({ error: "Validation Error: Candidate details are required." });
    }

    const cleanEnrollment = String(student.enrollmentNumber || "").trim().toUpperCase();
    if (!cleanEnrollment) {
      return res.status(400).json({ error: "Validation Error: 'Enrollment Number *' is required." });
    }

    let targetQuestions: any[] = [];
    if (Array.isArray(questionIds) && questionIds.length > 0) {
      targetQuestions = questionIds
        .map((id: string, idx: number) => {
          const found = questionsMap.get(id);
          return found ? { ...found, number: idx + 1 } : null;
        })
        .filter(Boolean);
    }

    if (targetQuestions.length === 0) {
      targetQuestions = (rawQuestions as any[]).slice(0, 20).map((q, idx) => ({ ...q, number: idx + 1 }));
    }

    let correctCount = 0;
    let incorrectCount = 0;
    let unansweredCount = 0;

    const breakdown = targetQuestions.map((q) => {
      const studentAns = answers ? answers[q.id] : undefined;
      const hasAnswered = typeof studentAns === "number" && studentAns >= 0 && studentAns < q.options.length;
      const isCorrect = hasAnswered && studentAns === q.correctOptionIndex;

      if (!hasAnswered) {
        unansweredCount++;
      } else if (isCorrect) {
        correctCount++;
      } else {
        incorrectCount++;
      }

      return {
        questionId: q.id,
        questionNumber: q.number,
        questionText: q.question,
        options: q.options,
        selectedOption: hasAnswered ? studentAns : null,
        correctOption: q.correctOptionIndex,
        isCorrect,
        explanation: q.explanation,
      };
    });

    const totalQuestions = targetQuestions.length;
    const percentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    const timeSpentSeconds = Math.max(0, totalDurationSeconds - timeRemainingSeconds);
    const submittedAt = new Date().toISOString();
    const submissionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    const submission = {
      id: submissionId,
      student: {
        name: String(student.name).trim(),
        phone: String(student.phone || "").trim(),
        email: String(student.email || "").trim(),
        department: String(student.department || "").trim(),
        section: String(student.section || "").trim(),
        roll: String(student.roll).trim(),
        enrollmentNumber: cleanEnrollment,
      },
      answers,
      score: correctCount,
      totalQuestions,
      correctAnswersCount: correctCount,
      incorrectAnswersCount: incorrectCount,
      unansweredCount,
      percentage,
      timeSpentSeconds,
      totalDurationSeconds,
      submissionReason,
      toggleCount,
      submittedAt,
      isSubmittedOnNetwork: true,
      networkSubmittedAt: submittedAt,
      attemptNumber: 1,
      roomNumber: String(roomNumber || "B2LG2.8"),
      pythonGameSolved: Boolean(pythonGameSolved),
      breakdown,
    };

    // Forward directly to Google Sheet
    let sheetResult: any = { success: true, message: "Recorded successfully" };
    try {
      const sheetUrl = (process.env.GOOGLE_SHEET_WEBAPP_URL || DEFAULT_GOOGLE_SHEET_URL).trim();
      const sheetPayload = {
        student: submission.student,
        score: correctCount,
        totalQuestions,
        percentage,
        attemptNumber: 1,
        roomNumber: String(roomNumber || "B2LG2.8"),
        pythonGameSolved: true,
        submissionReason,
        timeSpentSeconds,
        submissionId,
        submittedAt,
      };

      const sheetRes = await fetch(sheetUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(sheetPayload),
      });

      const sheetText = await sheetRes.text();
      try {
        sheetResult = JSON.parse(sheetText);
      } catch {
        sheetResult = { success: sheetRes.ok, message: sheetText || "Recorded in Google Sheet" };
      }
    } catch (sheetErr: any) {
      console.error("[Google Sheet Auto-Sync Error]:", sheetErr);
      sheetResult = { success: false, message: sheetErr.message || "Failed to sync to Google Sheet" };
    }

    return res.status(200).json({
      success: true,
      submission,
      sheetResult,
    });
  } catch (error: any) {
    console.error("Quiz submission error:", error);
    return res.status(500).json({ error: error.message || "Internal server error during evaluation." });
  }
}
