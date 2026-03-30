"use client";

import { useState, useEffect, useCallback } from "react";
import { getMoveInfo } from "@/lib/moveDescriptions";

// ─── Cube SVG visual ──────────────────────────────────────────────────────────
// Shows a simplified isometric cube; highlights the active face.
function CubeVisual({ face, arrowDir }: { face: string; arrowDir: "cw" | "ccw" | "two" }) {
  const faceColors: Record<string, { top: string; right: string; front: string }> = {
    top:    { top: "#f59e0b",   right: "#e5e7eb", front: "#e5e7eb" },
    right:  { top: "#e5e7eb",   right: "#ef4444", front: "#e5e7eb" },
    front:  { top: "#e5e7eb",   right: "#e5e7eb", front: "#22c55e" },
    bottom: { top: "#e5e7eb",   right: "#e5e7eb", front: "#e5e7eb" },
    left:   { top: "#e5e7eb",   right: "#e5e7eb", front: "#e5e7eb" },
    back:   { top: "#e5e7eb",   right: "#e5e7eb", front: "#e5e7eb" },
  };

  const faceLabel: Record<string, string> = {
    top: "TOP", right: "RIGHT", front: "FRONT",
    bottom: "BOTTOM", left: "LEFT", back: "BACK",
  };

  const faceLabelColor: Record<string, string> = {
    top: "#92400e", right: "#991b1b", front: "#14532d",
    bottom: "#713f12", left: "#7c2d12", back: "#1e3a8a",
  };

  const c = faceColors[face] ?? faceColors.front;

  // Isometric cube points
  const topFace = "60,10 110,40 60,70 10,40";
  const rightFace = "110,40 110,100 60,130 60,70";
  const leftFace = "10,40 60,70 60,130 10,100";

  // Arrow for each direction
  const arrowPath =
    arrowDir === "cw"
      ? "M 60 75 A 30 30 0 1 1 59 75"   // almost-full clockwise circle
      : arrowDir === "ccw"
      ? "M 60 75 A 30 30 0 1 0 61 75"   // counter
      : "M 40 75 L 80 75 M 70 65 L 80 75 L 70 85"; // double arrow

  const arrowheadCw =  "M 60 45 L 70 40 L 65 52 Z";
  const arrowheadCcw = "M 60 45 L 50 40 L 55 52 Z";

  // For bottom/left/back, show a note
  const showNote = face === "bottom" || face === "left" || face === "back";
  const noteText: Record<string, string> = {
    bottom: "↓ Look at the bottom",
    left:   "← Look at the left side",
    back:   "↩ Look at the back",
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <svg viewBox="0 0 120 140" className="w-36 h-36 sm:w-44 sm:h-44 drop-shadow-lg">
        {/* Left face */}
        <polygon points={leftFace} fill={face === "left" ? "#f97316" : c.right} stroke="#374151" strokeWidth="2" />
        {/* Right face */}
        <polygon points={rightFace} fill={face === "right" ? "#ef4444" : c.right} stroke="#374151" strokeWidth="2" />
        {/* Top face */}
        <polygon points={topFace} fill={face === "top" ? "#fbbf24" : c.top} stroke="#374151" strokeWidth="2" />
        {/* Front face highlight label */}
        {face === "front" && (
          <polygon points={leftFace} fill="#22c55e" stroke="#374151" strokeWidth="2" />
        )}
        {/* Back/bottom indicators */}
        {face === "back" && (
          <text x="60" y="120" textAnchor="middle" fontSize="10" fill="#1e3a8a" fontWeight="bold">BACK ↩</text>
        )}
        {face === "bottom" && (
          <text x="60" y="120" textAnchor="middle" fontSize="10" fill="#713f12" fontWeight="bold">BOTTOM ↓</text>
        )}
        {/* Arrow */}
        {(face === "front" || face === "top" || face === "right") && (
          <g opacity="0.9">
            <path d={arrowPath} fill="none" stroke="#1e40af" strokeWidth="3" strokeLinecap="round" />
            {arrowDir === "cw" && <polygon points="55,44 70,38 68,52" fill="#1e40af" />}
            {arrowDir === "ccw" && <polygon points="65,44 50,38 52,52" fill="#1e40af" />}
            {arrowDir === "two" && (
              <>
                <line x1="35" y1="75" x2="85" y2="75" stroke="#1e40af" strokeWidth="3" />
                <polygon points="80,68 90,75 80,82" fill="#1e40af" />
                <polygon points="40,68 30,75 40,82" fill="#1e40af" />
              </>
            )}
          </g>
        )}
      </svg>

      {/* Highlighted face badge */}
      <div
        className="px-4 py-1.5 rounded-full font-black text-sm shadow"
        style={{ backgroundColor: c.top === "#f59e0b" ? "#fef3c7" : c.right === "#ef4444" ? "#fee2e2" : "#dcfce7",
                 color: faceLabelColor[face] ?? "#1f2937" }}
      >
        ➡ {faceLabel[face] ?? face.toUpperCase()}
      </div>

      {showNote && (
        <p className="text-xs font-bold text-gray-500 text-center">{noteText[face]}</p>
      )}
    </div>
  );
}

// ─── Main SolutionViewer ──────────────────────────────────────────────────────
interface Props {
  moves: string[];
  onBack: () => void;
}

export default function SolutionViewer({ moves, onBack }: Props) {
  const [step, setStep] = useState(0);
  const [key, setKey] = useState(0); // triggers re-animation

  const current = moves[step];
  const info = getMoveInfo(current ?? "");
  const isFirst = step === 0;
  const isLast = step === moves.length - 1;
  const isDone = step >= moves.length;

  const goNext = useCallback(() => {
    if (step < moves.length) {
      setStep((s) => s + 1);
      setKey((k) => k + 1);
    }
  }, [step, moves.length]);

  const goPrev = useCallback(() => {
    if (step > 0) {
      setStep((s) => s - 1);
      setKey((k) => k + 1);
    }
  }, [step]);

  // Keyboard support
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight" || e.key === " ") goNext();
      if (e.key === "ArrowLeft") goPrev();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goNext, goPrev]);

  return (
    <div className="flex flex-col items-center gap-5 w-full max-w-xl mx-auto px-3 page-enter">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl sm:text-4xl font-black text-indigo-700">
          🧩 Let&apos;s Solve It!
        </h1>
        <p className="text-base font-semibold text-gray-500 mt-1">
          {moves.length} steps total — you can do it! 💪
        </p>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-4 shadow-inner overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
          style={{ width: `${(step / moves.length) * 100}%` }}
        />
      </div>
      <p className="text-sm font-bold text-gray-500 -mt-3">
        Step {Math.min(step + 1, moves.length)} of {moves.length}
      </p>

      {/* Step card */}
      {isDone ? (
        // ── Celebration screen ─────────────────────────────────────────────
        <div className="step-animate w-full bg-gradient-to-br from-yellow-400 to-orange-400 rounded-3xl p-8 text-center shadow-2xl">
          <div className="text-7xl mb-4">🎉</div>
          <h2 className="text-3xl font-black text-white mb-2">
            YOU DID IT!
          </h2>
          <p className="text-white font-bold text-lg mb-4">
            Amazing job! Your Rubik&apos;s Cube is now solved! 🌟
          </p>
          <div className="flex justify-center gap-2 text-4xl">
            {"🎊🏆🎊".split("").map((e, i) => (
              <span
                key={i}
                className="confetti-piece inline-block"
                style={{ animationDelay: `${i * 0.3}s` }}
              >
                {e}
              </span>
            ))}
          </div>
        </div>
      ) : (
        // ── Step display ───────────────────────────────────────────────────
        <div key={key} className="step-animate w-full">
          {/* Step number pill */}
          <div className="flex justify-center mb-3">
            <span className="bg-indigo-100 text-indigo-700 font-black text-sm px-4 py-1 rounded-full">
              Move {step + 1} / {moves.length}: <code className="font-mono font-black">{current}</code>
            </span>
          </div>

          {/* Main card */}
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden border-2 border-indigo-100">
            {/* Top: visual */}
            <div className="flex justify-center items-center py-6 bg-gradient-to-b from-indigo-50 to-white">
              <CubeVisual face={info.face} arrowDir={info.arrowDir} />
            </div>

            {/* Bottom: text */}
            <div className="px-6 py-5 text-center">
              <h2 className="text-2xl sm:text-3xl font-black text-gray-800 mb-2 leading-tight">
                {info.emoji} {info.title}
              </h2>
              <p className="text-base sm:text-lg font-semibold text-gray-600 leading-snug">
                {info.description}
              </p>

              {/* Repetition hint */}
              {info.direction === "twice" && (
                <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 text-amber-800 font-bold text-sm">
                  ⚡ Do this move <strong>TWO times</strong> in a row!
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex gap-4 w-full">
        {!isDone ? (
          <>
            <button
              onClick={goPrev}
              disabled={isFirst}
              className={`
                flex-1 py-5 rounded-2xl font-black text-xl shadow transition-all active:scale-95
                ${isFirst
                  ? "bg-gray-100 text-gray-300 cursor-not-allowed"
                  : "bg-white text-indigo-600 border-2 border-indigo-200 hover:bg-indigo-50"
                }
              `}
            >
              ⬅️ Back
            </button>
            <button
              onClick={goNext}
              className={`
                flex-[2] py-5 rounded-2xl font-black text-xl shadow-lg transition-all active:scale-95
                ${isLast
                  ? "bg-green-500 hover:bg-green-400 text-white"
                  : "bg-indigo-600 hover:bg-indigo-500 text-white"
                }
              `}
            >
              {isLast ? "✅ Done!" : "Next ➡️"}
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => { setStep(0); setKey((k) => k + 1); }}
              className="flex-1 py-5 rounded-2xl font-black text-xl shadow bg-white text-indigo-600 border-2 border-indigo-200 active:scale-95 transition-all"
            >
              🔁 Again
            </button>
            <button
              onClick={onBack}
              className="flex-1 py-5 rounded-2xl font-black text-xl shadow bg-indigo-600 text-white active:scale-95 transition-all"
            >
              🎲 New Cube
            </button>
          </>
        )}
      </div>

      {/* All moves overview (collapsible) */}
      <details className="w-full bg-white rounded-2xl shadow border border-gray-100">
        <summary className="px-5 py-4 font-black text-gray-600 cursor-pointer text-sm select-none">
          📋 See all {moves.length} moves
        </summary>
        <div className="px-5 pb-4 flex flex-wrap gap-2">
          {moves.map((m, i) => (
            <button
              key={i}
              onClick={() => { setStep(i); setKey((k) => k + 1); }}
              className={`
                px-3 py-1.5 rounded-xl font-black text-sm transition-all active:scale-95
                ${i === step
                  ? "bg-indigo-600 text-white shadow-md scale-105"
                  : i < step
                  ? "bg-green-100 text-green-700 line-through"
                  : "bg-gray-100 text-gray-600"
                }
              `}
            >
              {i + 1}. {m}
            </button>
          ))}
        </div>
      </details>

      {/* Back to input */}
      <button
        onClick={onBack}
        className="text-sm text-gray-400 font-bold underline pb-4 active:text-gray-600"
      >
        ← Start over with a new cube
      </button>
    </div>
  );
}
