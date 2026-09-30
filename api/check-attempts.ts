export default function handler(req: any, res: any) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const rawEnrollment = String(req.query?.enrollmentNumber || "").trim().toUpperCase();
  if (!rawEnrollment) {
    return res.status(400).json({ error: "Parameter 'enrollmentNumber' is required." });
  }

  // Candidate attempts are verified against client-side persistent storage and Google Sheet
  return res.json({
    enrollmentNumber: rawEnrollment,
    attemptCount: 0,
    maxAttempts: 2,
    canAttempt: true,
    remainingAttempts: 2,
    isBlocked: false,
    pastAttempts: [],
  });
}
