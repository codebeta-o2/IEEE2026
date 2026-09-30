import React, { useState } from "react";
import { 
  Code2, 
  Terminal, 
  CheckCircle2, 
  ArrowUp, 
  ArrowDown, 
  RotateCcw, 
  Play, 
  Sparkles, 
  MapPin, 
  ArrowRight,
  Lightbulb,
  Check,
  AlertCircle,
  HelpCircle,
  Lock
} from "lucide-react";
import { StudentDetails } from "../types";

interface PythonBlockGameProps {
  student: StudentDetails;
  onSolved: (roomNumber: string) => void;
}

interface CodeBlock {
  id: string;
  correctIndex: number;
  text: string;
  stepName: string;
  hint: string;
}

// 3 beginner-friendly Python blocks without exposing room number prematurely
const EASY_PUZZLE_BLOCKS: CodeBlock[] = [
  {
    id: "b1",
    correctIndex: 0,
    text: 'event = "IEEE DAY SPECIAL"',
    stepName: "Step 1: Set Event Variable",
    hint: "Assigns the event title string",
  },
  {
    id: "b2",
    correctIndex: 1,
    text: "room = unlock_allocated_room()",
    stepName: "Step 2: Call Room Allocation",
    hint: "Executes room assignment logic",
  },
  {
    id: "b3",
    correctIndex: 2,
    text: 'print("Assigned Exam Room:", room)',
    stepName: "Step 3: Print Room Output",
    hint: "Outputs the allocated room number to terminal",
  },
];

// Initial scrambled order: [Step 3, Step 1, Step 2]
const SHUFFLED_ORDER = [2, 0, 1];

export const PythonBlockGame: React.FC<PythonBlockGameProps> = ({
  student,
  onSolved,
}) => {
  const [blocks, setBlocks] = useState<CodeBlock[]>(() =>
    SHUFFLED_ORDER.map((idx) => EASY_PUZZLE_BLOCKS[idx])
  );

  const [terminalOutput, setTerminalOutput] = useState<{
    isRunning: boolean;
    logs: string[];
    isError: boolean;
    isSolved: boolean;
  }>({
    isRunning: false,
    logs: [
      "$ python3 --version",
      "Python 3.12.2",
      'Tip: Use the ▲ and ▼ buttons (or click "Auto-Solve") to arrange the 3 lines: Step 1 -> Step 2 -> Step 3.',
    ],
    isError: false,
    isSolved: false,
  });

  const [isRoomRevealed, setIsRoomRevealed] = useState<boolean>(false);
  const ASSIGNED_ROOM = "B2LG2.8";

  // Check if each block is in its correct slot right now
  const isAllCorrect = blocks.every((block, idx) => block.correctIndex === idx);

  // Move block up
  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    setBlocks((prev) => {
      const next = [...prev];
      const temp = next[index - 1];
      next[index - 1] = next[index];
      next[index] = temp;
      return next;
    });
  };

  // Move block down
  const handleMoveDown = (index: number) => {
    if (index >= blocks.length - 1) return;
    setBlocks((prev) => {
      const next = [...prev];
      const temp = next[index + 1];
      next[index + 1] = next[index];
      next[index] = temp;
      return next;
    });
  };

  // 1-Click Auto Arrange / Solve
  const handleAutoArrange = () => {
    setBlocks([EASY_PUZZLE_BLOCKS[0], EASY_PUZZLE_BLOCKS[1], EASY_PUZZLE_BLOCKS[2]]);
    setTerminalOutput({
      isRunning: false,
      logs: [
        "$ python3 --version",
        "Python 3.12.2",
        "✓ Auto-arranged into correct sequence! Click 'Run Python Code & Verify' below.",
      ],
      isError: false,
      isSolved: false,
    });
  };

  // Reset to initial scrambled state
  const handleReset = () => {
    setBlocks(SHUFFLED_ORDER.map((idx) => EASY_PUZZLE_BLOCKS[idx]));
    setTerminalOutput({
      isRunning: false,
      logs: [
        "$ python3 --version",
        "Python 3.12.2",
        "Blocks reset. Sequence required: Step 1 -> Step 2 -> Step 3.",
      ],
      isError: false,
      isSolved: false,
    });
    setIsRoomRevealed(false);
  };

  // Run & verify code
  const handleRunCode = () => {
    setTerminalOutput({
      isRunning: true,
      logs: ["$ python3 solution.py", "Compiling & executing script in sandbox..."],
      isError: false,
      isSolved: false,
    });

    setTimeout(() => {
      const correctlyOrdered = blocks.every((block, idx) => block.correctIndex === idx);

      if (correctlyOrdered) {
        setTerminalOutput({
          isRunning: false,
          logs: [
            "$ python3 solution.py",
            'event = "IEEE DAY SPECIAL"',
            "room = unlock_allocated_room()",
            'print("Assigned Exam Room:", room)',
            "---------------------------------------",
            `Output: Assigned Exam Room: ${ASSIGNED_ROOM}`,
            "[SUCCESS] Python script executed with Exit Code 0!",
            `✓ Condition satisfied! Room ${ASSIGNED_ROOM} unlocked. Proceed to next gate.`,
          ],
          isError: false,
          isSolved: true,
        });
        setIsRoomRevealed(true);
      } else {
        setTerminalOutput({
          isRunning: false,
          logs: [
            "$ python3 solution.py",
            "Traceback (most recent call last):",
            `  File "solution.py", line 1, in <module>`,
            "  NameError: name 'room' is not defined before print().",
            "---------------------------------------",
            "[ERROR] Order incorrect. Place Step 1 and Step 2 before Step 3 (print).",
          ],
          isError: true,
          isSolved: false,
        });
      }
    }, 350);
  };

  const handleProceedToRoom = () => {
    onSolved(ASSIGNED_ROOM);
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-8 px-4">
      {/* Step Breadcrumbs without exposing room number before condition is met */}
      <div className="mb-6 flex items-center justify-between text-xs text-slate-500 font-medium overflow-x-auto pb-2">
        <div className="flex items-center gap-1.5 text-emerald-600 font-bold">
          <CheckCircle2 className="w-4 h-4" />
          <span>1. Registration</span>
        </div>
        <span className="text-slate-300">→</span>
        <div className="flex items-center gap-1.5 text-emerald-600 font-bold">
          <CheckCircle2 className="w-4 h-4" />
          <span>2. Desk QR</span>
        </div>
        <span className="text-slate-300">→</span>
        <div className="flex items-center gap-1.5 text-blue-600 font-bold">
          <Code2 className="w-4 h-4 text-blue-600" />
          <span>3. Python Problem</span>
        </div>
        <span className="text-slate-300">→</span>
        <div className="flex items-center gap-1.5 text-slate-400">
          <MapPin className="w-4 h-4" />
          <span>4. Room Gate QR</span>
        </div>
        <span className="text-slate-300">→</span>
        <div className="flex items-center gap-1.5 text-slate-400">
          <span>5. Exam</span>
        </div>
      </div>

      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Code2 className="w-3.5 h-3.5" />
                IEEE DAY SPECIAL · Stage 3
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                Python Code Block Assembly
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
              Python Code Block Assembly
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Candidate: <strong>{student.name}</strong> · Phone: <strong className="font-mono">{student.phone}</strong> · Dept: <strong>{student.department}</strong>
            </p>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-2xl text-xs space-y-1 self-start sm:self-center">
            <span className="text-[10px] uppercase font-bold text-emerald-700 block flex items-center gap-1">
              <Lightbulb className="w-3.5 h-3.5 text-emerald-600" />
              Easy Rule
            </span>
            <span className="font-semibold text-emerald-950">Arrange lines: Step 1 → Step 2 → Step 3</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Code Blocks & Terminal */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Code Blocks Assembly */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Code2 className="w-4 h-4 text-emerald-600" />
                Arrange 3 Code Blocks in Sequence
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Click ▲ or ▼ to move, or click <strong>Auto-Solve</strong> for instant arrangement.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                id="btn-auto-arrange-python"
                onClick={handleAutoArrange}
                className="px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer border border-blue-200 shadow-2xs"
                title="Arrange blocks in correct order automatically"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Auto-Solve</span>
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center gap-1 transition-colors cursor-pointer"
                title="Scramble blocks"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>
          </div>

          {/* Quick Target Roadmap without revealing room code prematurely */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs">
            <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1.5">Expected Program Flow:</span>
            <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
              <div className="p-2 rounded-xl bg-white border border-slate-200 text-slate-800 font-mono font-medium">
                Line 1: <strong>event = ...</strong>
              </div>
              <div className="p-2 rounded-xl bg-white border border-slate-200 text-slate-800 font-mono font-medium">
                Line 2: <strong>room = ...</strong>
              </div>
              <div className="p-2 rounded-xl bg-white border border-slate-200 text-slate-800 font-mono font-medium">
                Line 3: <strong>print(...)</strong>
              </div>
            </div>
          </div>

          {/* High-Visibility Draggable/Clickable Code Blocks */}
          <div className="space-y-3.5">
            {blocks.map((block, index) => {
              const isSlotCorrect = block.correctIndex === index;
              return (
                <div
                  key={block.id}
                  className={`p-4 rounded-2xl border-2 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs ${
                    isSlotCorrect
                      ? "bg-emerald-50/80 border-emerald-400 ring-2 ring-emerald-200/60"
                      : "bg-white border-slate-200 hover:border-blue-300"
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    {/* Slot Position Badge */}
                    <div className="flex flex-col items-center justify-center shrink-0">
                      <span className={`w-8 h-8 rounded-xl font-bold flex items-center justify-center text-sm shadow-2xs ${
                        isSlotCorrect
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-200 text-slate-800"
                      }`}>
                        {index + 1}
                      </span>
                      <span className="text-[9px] uppercase font-bold text-slate-400 mt-1">Line</span>
                    </div>

                    {/* Code Text and Details - Crystal Clear High Contrast */}
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                          isSlotCorrect
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                            : "bg-amber-100 text-amber-800 border border-amber-300"
                        }`}>
                          {isSlotCorrect ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-700" />
                              <span>✓ Correct (Line {block.correctIndex + 1})</span>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-3 h-3 text-amber-700" />
                              <span>Move to Line {block.correctIndex + 1}</span>
                            </>
                          )}
                        </span>
                        <span className="text-xs font-semibold text-slate-600">
                          {block.stepName}
                        </span>
                      </div>

                      {/* HIGH-VISIBILITY CODE SNIPPET (Fix for Issue 1) */}
                      <div className="w-full bg-slate-950 p-3 sm:p-3.5 rounded-xl border border-slate-800 shadow-inner overflow-x-auto">
                        <span className="font-mono text-sm sm:text-base font-bold text-emerald-300 tracking-wide select-all block whitespace-pre">
                          {block.text}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Move Up / Down Buttons */}
                  <div className="flex sm:flex-col items-center justify-end gap-1.5 shrink-0 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                      className={`p-2.5 rounded-xl transition-colors cursor-pointer border ${
                        index === 0
                          ? "text-slate-300 bg-slate-50 border-slate-200 cursor-not-allowed"
                          : "text-slate-700 bg-slate-100 border-slate-300 hover:bg-blue-600 hover:text-white hover:border-blue-600 active:bg-blue-700"
                      }`}
                      title="Move block up"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveDown(index)}
                      disabled={index === blocks.length - 1}
                      className={`p-2.5 rounded-xl transition-colors cursor-pointer border ${
                        index === blocks.length - 1
                          ? "text-slate-300 bg-slate-50 border-slate-200 cursor-not-allowed"
                          : "text-slate-700 bg-slate-100 border-slate-300 hover:bg-blue-600 hover:text-white hover:border-blue-600 active:bg-blue-700"
                      }`}
                      title="Move block down"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Run / Verify Action Button */}
          <div className="pt-2">
            <button
              type="button"
              id="btn-run-python-code"
              onClick={handleRunCode}
              disabled={terminalOutput.isRunning}
              className={`w-full py-4 px-4 font-bold rounded-2xl text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md ${
                isAllCorrect
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white animate-pulse"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
            >
              {terminalOutput.isRunning ? (
                <>
                  <RotateCcw className="w-4 h-4 animate-spin" />
                  <span>Executing Python Script in Sandbox...</span>
                </>
              ) : isAllCorrect ? (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>✓ All 3 Lines in Order! Run & Reveal Room Number</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>Run Python Code & Verify</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Terminal Output & Condition-Gated Room Reveal */}
        <div className="lg:col-span-5 space-y-4">
          {/* Simulated Terminal */}
          <div className="bg-slate-950 text-slate-100 rounded-3xl p-5 font-mono text-xs shadow-xl border border-slate-800">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800 text-[11px] text-slate-400">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span className="font-semibold text-slate-200">Terminal (Python 3.12)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              </div>
            </div>

            <div className="space-y-1.5 min-h-[160px] max-h-[220px] overflow-y-auto leading-relaxed">
              {terminalOutput.logs.map((log, i) => {
                const isSuccess = log.includes("[SUCCESS]") || log.includes("Output:") || log.includes("✓");
                const isFail = log.includes("[ERROR]") || log.includes("Traceback") || log.includes("NameError");
                const isCmd = log.startsWith("$");

                return (
                  <div
                    key={i}
                    className={`${
                      isSuccess
                        ? "text-emerald-400 font-bold"
                        : isFail
                        ? "text-rose-400 font-bold"
                        : isCmd
                        ? "text-blue-400"
                        : "text-slate-300"
                    }`}
                  >
                    {log}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Condition-Gated Room Reveal: ONLY shown after puzzle is solved */}
          {isRoomRevealed ? (
            <div className="p-5 rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-lg space-y-4 animate-in fade-in zoom-in-95 duration-300">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-white/20">
                  <CheckCircle2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-200 block">
                    Condition Fulfilled!
                  </span>
                  <h3 className="text-lg font-black tracking-tight">
                    Allocated Room Revealed
                  </h3>
                </div>
              </div>

              {/* Big Room Number Box */}
              <div className="p-4 rounded-2xl bg-white text-slate-900 text-center shadow-inner">
                <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                  Your Verified Room Allocation
                </span>
                <div className="text-3xl sm:text-4xl font-black text-emerald-700 tracking-wider font-mono flex items-center justify-center gap-2">
                  <MapPin className="w-7 h-7 text-emerald-600" />
                  <span>{ASSIGNED_ROOM}</span>
                </div>
                <p className="text-xs text-slate-600 mt-2 font-medium">
                  Proceed to Room <strong>{ASSIGNED_ROOM}</strong> and scan the examination gate QR code on your desk.
                </p>
              </div>

              <button
                type="button"
                id="btn-proceed-to-room-qr"
                onClick={handleProceedToRoom}
                className="w-full py-4 px-4 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-slate-950 font-black rounded-2xl text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <span>Proceed to Room {ASSIGNED_ROOM} & Scan Exam QR</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="p-5 rounded-3xl bg-slate-50 border border-slate-200 text-slate-600 text-xs space-y-2.5">
              <div className="flex items-center gap-2 font-bold text-slate-800">
                <Lock className="w-4 h-4 text-amber-600" />
                <span>Room Number Locked</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Your assigned examination room number is currently hidden. Fulfill the condition by ordering the 3 code lines and clicking <strong>Run Python Code & Verify</strong> to reveal your room allocation.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
