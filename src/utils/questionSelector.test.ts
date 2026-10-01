import test from "node:test";
import assert from "node:assert/strict";

import { normalizeQuestionRecord } from "./questionSelector";

test("normalizeQuestionRecord accepts updated question state with alternate field names", () => {
  const normalized = normalizeQuestionRecord({
    id: "q42",
    question: "What is 2 + 2?",
    text: "What is 2 + 2?",
    options: ["3", "4", "5", "6"],
    correctOption: 1,
    explanation: "Basic arithmetic.",
    state: { visited: true },
  } as any);

  assert.equal(normalized.id, "q42");
  assert.equal(normalized.question, "What is 2 + 2?");
  assert.deepEqual(normalized.options, ["3", "4", "5", "6"]);
  assert.equal(normalized.number, 1);
});
