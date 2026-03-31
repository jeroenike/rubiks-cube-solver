"use client";

import { useState, useEffect, useCallback } from "react";
import { getMoveInfo } from "@/lib/moveDescriptions";
import MovesGuide from "@/components/MovesGuide";

// ─── Cube SVG visual ──────────────────────────────────────────────────────────
function CubeVisual({ face, arrowDir }: { face: string; arrowDir: "cw" | "ccw" | "two" }) {
  // Isometric face polygons
  const topFace   = "60,10 110,40 60,70 10,40";
  const rightFace = "110,40 110,100 60,130 60,70";
  const leftFace  = "10,40 60,70 60,130 10,100";

  // Face fill colors (active face is vivid, others are muted grey)
  const GREY = "#d1d5db";
  const fills = {
    top:    face === "top"    ? "#fbbf24" : GREY,
    right:  face === "right"  ? "#ef4444" : GREY,
    left:   face === "left"   ? "#f97316" : face === "front" ? "#22c55e" : GREY,
  };

  // Badge colors
  const badgeBg:    Record<string, string> = { top:"#fef3c7", right:"#fee2e2", front:"#dcfce7", left:"#ffedd5", bottom:"#fef9c3", back:"#dbeafe" };
  const badgeColor: Record<string, string> = { top:"#92400e", right:"#991b1b", front:"#14532d", left:"#7c2d12",  bottom:"#713f12", back:"#1e3a8a" };
  const faceLabel:  Record<string, string> = { top:"TOP", right:"RIGHT", front:"FRONT", left:"LEFT", bottom:"BOTTOM", back:"BACK" };

  // ── Circular sweep arrow (F / U / R / L) ────────────────────────────────
  // The arc is drawn centred at (60,75) with r=30; rotating the whole group
  // makes the arrowhead orbit continuously in the correct direction.
  const arcCw  = "M 60 45 A 30 30 0 1 1 59.9 45";   // nearly full CW arc
  const arcCcw = "M 60 45 A 30 30 0 1 0 60.1 45";   // nearly full CCW arc
  const useCircularArrow = face === "front" || face === "top" || face === "right" || face === "left";

  // spin style — transform-origin at the arc centre (60,75) within the viewBox
  const spinStyle = (dir: "cw" | "ccw"): React.CSSProperties => ({
    transformBox: "view-box",
    transformOrigin: "60px 75px",
    animation: `${dir === "cw" ? "spin-cw" : "spin-ccw"} 2s linear infinite`,
  });

  const pulseStyle: React.CSSProperties = {
    transformBox: "fill-box",
    transformOrigin: "center",
    animation: "pulse-scale 1.8s ease-in-out infinite",
  };

  // ── Straight bounce arrow (B / D straight moves) ─────────────────────────
  // Each entry: [x1,y1,x2,y2, bounceAnimation, arrowhead polygon points]
  type SA = { x1:number; y1:number; x2:number; y2:number; anim:string; head:string };
  const straightMap: Record<string, SA> = {
    back_cw:    { x1:15,y1:22, x2:105,y2:22, anim:"bounce-right", head:"95,14 107,22 95,30" },
    back_ccw:   { x1:105,y1:22, x2:15,y2:22, anim:"bounce-left",  head:"25,14 13,22 25,30"  },
    bottom_cw:  { x1:95,y1:120, x2:25,y2:120, anim:"bounce-left", head:"35,112 23,120 35,128" },
    bottom_ccw: { x1:25,y1:120, x2:95,y2:120, anim:"bounce-right",head:"85,112 97,120 85,128" },
  };
  const saKey = `${face}_${arrowDir}`;
  const sa: SA | null = straightMap[saKey] ?? null;

  return (
    <div className="flex flex-col items-center gap-2">
      <svg viewBox="0 0 120 140" className="w-40 h-40 sm:w-48 sm:h-48 drop-shadow-lg">

        {/* ── Cube faces ── */}
        <polygon points={leftFace}  fill={fills.left}  stroke="#374151" strokeWidth="2"
          style={face === "left" || face === "front" ? { animation:"face-glow 1.2s ease-in-out infinite" } : undefined} />
        <polygon points={rightFace} fill={fills.right} stroke="#374151" strokeWidth="2"
          style={face === "right"  ? { animation:"face-glow 1.2s ease-in-out infinite" } : undefined} />
        <polygon points={topFace}   fill={fills.top}   stroke="#374151" strokeWidth="2"
          style={face === "top"    ? { animation:"face-glow 1.2s ease-in-out infinite" } : undefined} />

        {/* ── Back / bottom labels (not visible on the isometric cube) ── */}
        {face === "back" && (
          <text x="60" y="108" textAnchor="middle" fontSize="9" fill="#1e3a8a" fontWeight="bold">BACK FACE</text>
        )}
        {face === "bottom" && (
          <text x="60" y="108" textAnchor="middle" fontSize="9" fill="#78350f" fontWeight="bold">BOTTOM FACE</text>
        )}

        {/* ── Circular sweep arrow (F / U / R / L) ── */}
        {useCircularArrow && arrowDir !== "two" && (
          <g style={spinStyle(arrowDir as "cw"|"ccw")} opacity="0.92">
            <path d={arrowDir === "cw" ? arcCw : arcCcw}
              fill="none" stroke="#1e40af" strokeWidth="3.5" strokeLinecap="round" />
            {/* Static arrowhead at the top of the arc */}
            <polygon points={arrowDir === "cw" ? "54,44 69,38 67,53" : "66,44 51,38 53,53"} fill="#1e40af" />
          </g>
        )}

        {/* ── ×2 pulse arrows ── */}
        {arrowDir === "two" && useCircularArrow && (
          <g style={pulseStyle} opacity="0.92">
            <line x1="30" y1="75" x2="90" y2="75" stroke="#1e40af" strokeWidth="3" />
            <polygon points="84,67 96,75 84,83" fill="#1e40af" />
            <polygon points="36,67 24,75 36,83" fill="#1e40af" />
          </g>
        )}

        {/* ── Straight bounce arrow (B / D) ── */}
        {sa && (
          <g style={{ animation:`${sa.anim} 0.9s ease-in-out infinite` }} opacity="0.95">
            <line x1={sa.x1} y1={sa.y1} x2={sa.x2} y2={sa.y2} stroke="#1e40af" strokeWidth="3.5" strokeLinecap="round" />
            <polygon points={sa.head} fill="#1e40af" />
          </g>
        )}
        {face === "back" && arrowDir === "two" && (
          <g style={pulseStyle} opacity="0.92">
            <line x1="15" y1="22" x2="105" y2="22" stroke="#1e40af" strokeWidth="3" />
            <polygon points="95,14 107,22 95,30" fill="#1e40af" />
            <polygon points="25,14 13,22 25,30" fill="#1e40af" />
          </g>
        )}
      </svg>

      {/* Face badge */}
      <div className="px-4 py-1.5 rounded-full font-black text-sm shadow"
        style={{ backgroundColor: badgeBg[face] ?? "#f3f4f6", color: badgeColor[face] ?? "#1f2937" }}>
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

              {/* Back face reminder — don't rotate the cube */}
              {info.face === "back" && (
                <div className="mt-3 bg-blue-50 border border-blue-300 rounded-xl px-4 py-2 text-blue-800 font-bold text-sm">
                  🟩 Keep <strong>GREEN toward you</strong> — reach around to the BLUE face at the back. Do <strong>not</strong> rotate the whole cube!
                </div>
              )}

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
