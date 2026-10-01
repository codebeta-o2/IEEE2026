import { QuestionData, QuestionBreakdown } from "../types";
import { SANITIZED_QUESTIONS_POOL } from "../data/sanitizedQuestions";

/**
 * =========================================================================
 * CLIENT-SIDE SECURE QUESTION SERVICE
 * =========================================================================
 * CRITICAL SECURITY ARCHITECTURE:
 * - Master questions.json, answer keys (correctOptionIndex), and explanations
 *   are strictly retained on the backend (/api/submit-quiz and /server).
 * - Browser bundles and DevTools contain ZERO correct answer keys.
 * - Evaluation and scoring take place securely on the backend (/api/submit-quiz).
 * =========================================================================
 */

let cachedSanitizedQuestions: QuestionData[] = [...SANITIZED_QUESTIONS_POOL];
const MAX_EXAM_QUESTIONS = 20;

// Eagerly refresh randomized questions from server if online
if (typeof window !== "undefined") {
  fetch("/api/questions?count=20")
    .then((r) => (r.ok ? r.json() : null))
    .then((data) => {
      if (data?.questions && Array.isArray(data.questions) && data.questions.length > 0) {
        cachedSanitizedQuestions = data.questions;
      }
    })
    .catch((err) => console.warn("[Security Engine] Questions network refresh deferred (using offline bank):", err));
}

/**
 * Fetches randomized, sanitized questions from the backend.
 * All answer keys and explanations are omitted by the server.
 */
export async function fetchExamQuestions(count: number = 20): Promise<QuestionData[]> {
  const requestedCount = Math.min(Math.max(Math.floor(count) || MAX_EXAM_QUESTIONS, 1), MAX_EXAM_QUESTIONS);
  try {
    const res = await fetch(`/api/questions?count=${requestedCount}`);
    if (res.ok) {
      const data = await res.json();
      if (data.questions && Array.isArray(data.questions) && data.questions.length > 0) {
        cachedSanitizedQuestions = data.questions.slice(0, MAX_EXAM_QUESTIONS);
        return cachedSanitizedQuestions.slice(0, requestedCount);
      }
    }
  } catch (err) {
    console.warn("[Security Engine] Network question fetch fallback to cache:", err);
  }
  return selectRandomQuestions(requestedCount);
}

/**
 * Synchronously provides sanitized questions from memory cache.
 */
export function selectRandomQuestions(count: number = 20): QuestionData[] {
  const requestedCount = Math.min(Math.max(Math.floor(count) || MAX_EXAM_QUESTIONS, 1), MAX_EXAM_QUESTIONS);
  if (cachedSanitizedQuestions.length > 0) {
    const pool = [...cachedSanitizedQuestions];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, Math.min(requestedCount, pool.length)).map((q, idx) => ({
      ...q,
      number: idx + 1,
    }));
  }

  // Fallback initial placeholder structure if server fetch hasn't completed yet
  return Array.from({ length: requestedCount }, (_, i) => ({
    id: `q${i + 1}`,
    number: i + 1,
    subject: "Computer Science & Engineering",
    question: `Examination Question ${i + 1}`,
    options: ["Option A", "Option B", "Option C", "Option D"],
  }));
}

/**
 * Evaluates exam answers safely.
 * Since answers are evaluated on the server, this produces the client breakdown
 * structure until the server's authoritative evaluation response is returned.
 */
export function evaluateExamAnswers(
  answers: Record<string, number>,
  questions: QuestionData[]
): {
  breakdown: QuestionBreakdown[];
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
} {
  let answeredCount = 0;
  let unansweredCount = 0;

  const breakdown: QuestionBreakdown[] = questions.map((q) => {
    const studentAns = answers[q.id];
    const hasAnswered = typeof studentAns === "number" && studentAns >= 0 && studentAns < q.options.length;

    if (hasAnswered) {
      answeredCount++;
    } else {
      unansweredCount++;
    }

    return {
      questionId: q.id,
      questionNumber: q.number,
      questionText: q.question,
      options: q.options,
      selectedOption: hasAnswered ? studentAns : null,
      correctOption: null, // Hidden on client; authoritative key evaluated on server
      isCorrect: false,
      explanation: "Official explanation is verified and unlocked on the server upon submission.",
    };
  });

  return {
    breakdown,
    correctCount: 0,
    incorrectCount: answeredCount,
    unansweredCount,
  };
}
