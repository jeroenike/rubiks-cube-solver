"use client";

import { useState, useEffect, useCallback } from "react";
import { getMoveInfo } from "@/lib/moveDescriptions";
import MovesGuide from "@/components/MovesGuide";

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

  // Straight arrows for L, B, D (described from the front perspective)
  // L cw  = front-left column goes DOWN  → arrow pointing down on left face
  // L ccw = front-left column goes UP    → arrow pointing up on left face
  // B cw  = top edge goes RIGHT          → arrow pointing right at top
  // B ccw = top edge goes LEFT           → arrow pointing left at top
  // D cw  = front-bottom row goes LEFT   → arrow pointing left on bottom
  // D ccw = front-bottom row goes RIGHT  → arrow pointing right on bottom
  const straightArrow: Record<string, { x1:number;y1:number;x2:number;y2:number;hx:number;hy:number } | null> = {
    left_cw:     { x1:18, y1:52, x2:18, y2:98, hx:18, hy:98 },  // down
    left_ccw:    { x1:18, y1:98, x2:18, y2:52, hx:18, hy:52 },  // up
    left_two:    null,
    back_cw:     { x1:20, y1:25, x2:90, y2:25, hx:90, hy:25 },  // right
    back_ccw:    { x1:90, y1:25, x2:20, y2:25, hx:20, hy:25 },  // left
    back_two:    null,
    bottom_cw:   { x1:85, y1:115, x2:35, y2:115, hx:35, hy:115 }, // left
    bottom_ccw:  { x1:35, y1:115, x2:85, y2:115, hx:85, hy:115 }, // right
    bottom_two:  null,
  };

  const needsStraightArrow = face === "left" || face === "back" || face === "bottom";
  const straightKey = needsStraightArrow ? `${face}_${arrowDir}` : "";
  const sa = straightArrow[straightKey] ?? null;

  return (
    <div className="flex flex-col items-center gap-2">
      <svg viewBox="0 0 120 140" className="w-36 h-36 sm:w-44 sm:h-44 drop-shadow-lg">
        {/* Left face */}
        <polygon points={leftFace}  fill={face === "left"  ? "#f97316" : face === "front" ? "#22c55e" : c.right} stroke="#374151" strokeWidth="2" />
        {/* Right face */}
        <polygon points={rightFace} fill={face === "right" ? "#ef4444" : c.right} stroke="#374151" strokeWidth="2" />
        {/* Top face */}
        <polygon points={topFace}   fill={face === "top"   ? "#fbbf24" : c.top}   stroke="#374151" strokeWidth="2" />

        {/* Circular arrow for front/top/right */}
        {(face === "front" || face === "top" || face === "right") && (
          <g opacity="0.9">
            <path d={arrowPath} fill="none" stroke="#1e40af" strokeWidth="3" strokeLinecap="round" />
            {arrowDir === "cw"  && <polygon points="55,44 70,38 68,52" fill="#1e40af" />}
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

        {/* Straight arrow for left/back/bottom */}
        {needsStraightArrow && sa && (
          <g opacity="0.95">
            <line x1={sa.x1} y1={sa.y1} x2={sa.x2} y2={sa.y2} stroke="#1e40af" strokeWidth="3" strokeLinecap="round" />
            {/* Arrowhead */}
            {sa.hx === sa.x2 && sa.hy > sa.y1 && <polygon points={`${sa.hx-6},${sa.hy-10} ${sa.hx+6},${sa.hy-10} ${sa.hx},${sa.hy+2}`} fill="#1e40af" />}
            {sa.hx === sa.x2 && sa.hy < sa.y1 && <polygon points={`${sa.hx-6},${sa.hy+10} ${sa.hx+6},${sa.hy+10} ${sa.hx},${sa.hy-2}`} fill="#1e40af" />}
            {sa.hy === sa.y2 && sa.hx > sa.x1 && <polygon points={`${sa.hx-10},${sa.hy-6} ${sa.hx-10},${sa.hy+6} ${sa.hx+2},${sa.hy}`} fill="#1e40af" />}
            {sa.hy === sa.y2 && sa.hx < sa.x1 && <polygon points={`${sa.hx+10},${sa.hy-6} ${sa.hx+10},${sa.hy+6} ${sa.hx-2},${sa.hy}`} fill="#1e40af" />}
          </g>
        )}
        {/* X2 double arrow for left/back/bottom */}
        {needsStraightArrow && arrowDir === "two" && (
          <g opacity="0.9">
            <line x1="35" y1="75" x2="85" y2="75" stroke="#1e40af" strokeWidth="3" />
            <polygon points="80,68 90,75 80,82" fill="#1e40af" />
            <polygon points="40,68 30,75 40,82" fill="#1e40af" />
          </g>
        )}
      </svg>

      {/* Highlighted face badge */}
      <div
        className="px-4 py-1.5 rounded-full font-black text-sm shadow"
        style={{ backgroundColor: face === "top" ? "#fef3c7" : face === "right" ? "#fee2e2" : face === "front" ? "#dcfce7" : face === "left" ? "#ffedd5" : face === "bottom" ? "#fef9c3" : "#dbeafe",
                 color: faceLabelColor[face] ?? "#1f2937" }}
      >
        ➡ {faceLabel[face] ?? face.toUpperCase()} face
      </div>
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
  const [showGuide, setShowGuide] = useState(false);

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
    <>
      {showGuide && <MovesGuide onClose={() => setShowGuide(false)} />}

    <div className="flex flex-col items-center gap-5 w-full max-w-xl mx-auto px-3 page-enter">
      {/* Header */}
      <div className="w-full flex items-start justify-between gap-2">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-indigo-700">
            🧩 Let&apos;s Solve It!
          </h1>
          <p className="text-base font-semibold text-gray-500 mt-1">
            {moves.length} steps total — you can do it! 💪
          </p>
        </div>
        <button
          onClick={() => setShowGuide(true)}
          className="shrink-0 mt-1 flex items-center gap-1.5 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-black text-sm px-3 py-2 rounded-2xl active:scale-95 transition-all shadow-sm"
        >
          📖 <span className="hidden sm:inline">Move</span> Guide
        </button>
      </div>

      {/* Orientation reminder — must hold cube consistently throughout */}
      <div className="w-full bg-amber-50 border-2 border-amber-300 rounded-2xl px-4 py-3 flex items-center gap-3">
        <span className="text-2xl flex-shrink-0">📌</span>
        <p className="text-sm font-bold text-amber-900 leading-snug">
          Hold your cube with{" "}
          <span className="text-gray-800 font-black">WHITE on TOP</span> and{" "}
          <span className="text-green-700 font-black">GREEN facing YOU</span>{" "}
          for <em>every</em> move — don&apos;t rotate the whole cube!
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

      {/* Confused? hint */}
      {!isDone && (
        <button
          onClick={() => setShowGuide(true)}
          className="w-full text-center text-sm font-bold text-indigo-400 hover:text-indigo-600 transition-colors -mt-2"
        >
          😕 Not sure what <code className="font-mono bg-indigo-50 px-1 rounded">{current}</code> means? Tap here for help!
        </button>
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
    </>
  );
}
