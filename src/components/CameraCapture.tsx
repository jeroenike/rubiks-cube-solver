"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import {
  Color,
  CubeState,
  Face,
  FaceKey,
  COLOR_META,
  FACE_CENTERS,
  toCubejsString,
  validateCube,
} from "@/lib/types";
import { extractFaceColors } from "@/lib/colorDetection";

// ─── Constants ───────────────────────────────────────────────────────────────

const COLORS: Color[] = ["W", "Y", "R", "O", "B", "G"];

// Hidden capture canvas is always 300×300 px
const CANVAS_SIZE = 300;
const GRID_OFFSET = 45;
const GRID_SIZE = 210;

const CAPTURE_STEPS: {
  face: FaceKey;
  label: string;
  holdText: string;         // how to hold the cube
  transition: string;       // how to get here from the previous step
  topColor: Color;
  ringClass: string;
  neighbors: { top: Color; right: Color; bottom: Color; left: Color };
}[] = [
  {
    face: "U",
    label: "White face",
    holdText: "Lay the cube flat on a table and look straight down at the WHITE face",
    transition: "",           // first step, no transition needed
    topColor: "B",
    ringClass: "ring-gray-300",
    neighbors: { top: "B", right: "R", bottom: "G", left: "O" },
  },
  {
    face: "F",
    label: "Green face",
    holdText: "Hold the cube upright with GREEN facing the camera and WHITE on top",
    transition: "Tilt the cube toward you — the GREEN face rises up, the BLUE face drops to the bottom",
    topColor: "W",
    ringClass: "ring-green-400",
    neighbors: { top: "W", right: "R", bottom: "Y", left: "O" },
  },
  {
    face: "R",
    label: "Red face",
    holdText: "Keep WHITE on top, rotate so the RED face is now toward the camera",
    transition: "Keep it upright and rotate 90° to the left — RED now faces the camera",
    topColor: "W",
    ringClass: "ring-red-400",
    neighbors: { top: "W", right: "B", bottom: "Y", left: "G" },
  },
  {
    face: "B",
    label: "Blue face",
    holdText: "Keep WHITE on top, rotate so the BLUE face is now toward the camera",
    transition: "Keep it upright and rotate 90° to the left again — BLUE now faces the camera",
    topColor: "W",
    ringClass: "ring-blue-400",
    neighbors: { top: "W", right: "O", bottom: "Y", left: "R" },
  },
  {
    face: "L",
    label: "Orange face",
    holdText: "Keep WHITE on top, rotate so the ORANGE face is now toward the camera",
    transition: "Keep it upright and rotate 90° to the left again — ORANGE now faces the camera",
    topColor: "W",
    ringClass: "ring-orange-400",
    neighbors: { top: "W", right: "G", bottom: "Y", left: "B" },
  },
  {
    face: "D",
    label: "Yellow face",
    holdText: "Tilt the cube forward so YELLOW faces up, then look straight down at it",
    transition: "Tilt the cube forward/away from you — WHITE goes to the back, YELLOW comes to the top",
    topColor: "G",
    ringClass: "ring-yellow-400",
    neighbors: { top: "G", right: "R", bottom: "B", left: "O" },
  },
];

// 90° clockwise:  new[i] = old[CW[i]]
// 90° counter-CW: new[i] = old[CCW[i]]
const ROT_CW  = [6, 3, 0, 7, 4, 1, 8, 5, 2];
const ROT_CCW = [2, 5, 8, 1, 4, 7, 0, 3, 6];

function rotateFace(colors: Color[], dir: "cw" | "ccw"): Color[] {
  const map = dir === "cw" ? ROT_CW : ROT_CCW;
  return map.map((src) => colors[src]);
}

function colorBg(c: Color): string {
  const map: Record<Color, string> = {
    W: "bg-white",
    Y: "bg-yellow-400",
    R: "bg-red-500",
    O: "bg-orange-500",
    B: "bg-blue-500",
    G: "bg-green-500",
  };
  return map[c];
}

// Hex fills for SVG (Tailwind classes don't work inside SVG)
const COLOR_HEX: Record<Color, string> = {
  W: "#e5e7eb",
  Y: "#facc15",
  R: "#ef4444",
  O: "#f97316",
  B: "#3b82f6",
  G: "#22c55e",
};

// Small colored square used in the orientation cross diagram
function DiagramCell({ color, label, highlight = false }: { color: Color; label: string; highlight?: boolean }) {
  return (
    <div
      className={`rounded flex items-center justify-center text-[9px] font-black leading-none ${colorBg(color)} ${COLOR_META[color].text} ${highlight ? "ring-2 ring-indigo-500 ring-offset-1" : "opacity-90"}`}
    >
      {label === "scan" ? "📷" : ""}
    </div>
  );
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface Props {
  onSolve: (moves: string[]) => void;
  onCancel: () => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function CameraCapture({ onSolve, onCancel }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Re-attach stream whenever the video element mounts (it unmounts between phases)
  const setVideoRef = useCallback((el: HTMLVideoElement | null) => {
    videoRef.current = el;
    if (el && streamRef.current) {
      el.srcObject = streamRef.current;
      el.play().catch(() => {});
    }
  }, []);
  const captureCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [stepIndex, setStepIndex] = useState(0);
  const [phase, setPhase] = useState<"capture" | "confirm" | "review">("capture");
  const [detectedColors, setDetectedColors] = useState<Color[]>([]);
  const [selectedSquare, setSelectedSquare] = useState<number | null>(null);
  const [capturedFaces, setCapturedFaces] = useState<Partial<Record<FaceKey, Face>>>({});
  const [reviewSelection, setReviewSelection] = useState<{ face: FaceKey; index: number } | null>(null);

  const [mirrored, setMirrored] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [solveError, setSolveError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // ─── Camera lifecycle ───────────────────────────────────────────────────

  useEffect(() => {
    let mounted = true;

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          // Explicit play() is needed when the component remounts on some browsers
          videoRef.current.play().catch(() => {});
        }
      } catch {
        if (mounted) {
          setCameraError(
            "Could not access camera. Please allow camera access and try again."
          );
        }
      }
    }

    startCamera();

    return () => {
      mounted = false;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, []);

  // ─── Capture ────────────────────────────────────────────────────────────

  function handleCapture() {
    const video = videoRef.current;
    const canvas = captureCanvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const vw = video.videoWidth;
    const vh = video.videoHeight;
    if (!vw || !vh) return;

    // Draw video frame to canvas with cover-fit, mirroring horizontally if needed
    const scale = Math.max(CANVAS_SIZE / vw, CANVAS_SIZE / vh);
    const dw = vw * scale;
    const dh = vh * scale;
    const dx = (CANVAS_SIZE - dw) / 2;
    const dy = (CANVAS_SIZE - dh) / 2;
    if (mirrored) {
      ctx.save();
      ctx.translate(CANVAS_SIZE, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, dx, dy, dw, dh);
      ctx.restore();
    } else {
      ctx.drawImage(video, dx, dy, dw, dh);
    }

    const colors = extractFaceColors(ctx, GRID_OFFSET, GRID_OFFSET, GRID_SIZE);
    // Always force center to match the known face center color
    colors[4] = FACE_CENTERS[CAPTURE_STEPS[stepIndex].face];

    setDetectedColors(colors);
    setSelectedSquare(null);
    setSolveError(null);
    setPhase("confirm");
  }

  // ─── Confirm / color correction ─────────────────────────────────────────

  function handleSquareTap(i: number) {
    if (i === 4) return; // center is fixed
    setSelectedSquare((prev) => (prev === i ? null : i));
  }

  function handleColorPick(color: Color) {
    if (selectedSquare === null) return;
    setDetectedColors((prev) => {
      const next = [...prev];
      next[selectedSquare] = color;
      return next as Color[];
    });
    setSelectedSquare(null);
  }

  function handleRotate(dir: "cw" | "ccw") {
    const face = CAPTURE_STEPS[stepIndex].face;
    setDetectedColors((prev) => {
      const rotated = rotateFace(prev, dir);
      rotated[4] = FACE_CENTERS[face];
      return rotated;
    });
    setSelectedSquare(null);
  }

  // Navigate to a specific step index. Saves current edits if in confirm phase.
  function goToStep(targetIndex: number) {
    const currentFace = CAPTURE_STEPS[stepIndex].face;
    let updatedFaces = capturedFaces;

    // Persist any edits made to the current face before navigating away
    if (phase === "confirm" && detectedColors.length === 9) {
      updatedFaces = { ...capturedFaces, [currentFace]: detectedColors as Face };
      setCapturedFaces(updatedFaces);
    }

    const targetFace = CAPTURE_STEPS[targetIndex].face;
    const saved = updatedFaces[targetFace];
    if (saved) {
      setDetectedColors([...saved]);
      setPhase("confirm");
    } else {
      setDetectedColors([]);
      setPhase("capture");
    }
    setStepIndex(targetIndex);
    setSelectedSquare(null);
    setSolveError(null);
  }

  function openReview() {
    // Save current edits before entering review
    const currentFace = CAPTURE_STEPS[stepIndex].face;
    if (phase === "confirm" && detectedColors.length === 9) {
      setCapturedFaces((prev) => ({ ...prev, [currentFace]: detectedColors as Face }));
    }
    setReviewSelection(null);
    setSolveError(null);
    setPhase("review");
  }

  function closeReview() {
    // Return to confirm for current step (reload saved colors)
    const currentFace = CAPTURE_STEPS[stepIndex].face;
    const saved = capturedFaces[currentFace];
    if (saved) {
      setDetectedColors([...saved]);
      setPhase("confirm");
    } else {
      setPhase("capture");
    }
    setReviewSelection(null);
  }

  function handleReviewSquareTap(face: FaceKey, index: number) {
    if (index === 4) return; // center locked
    setReviewSelection((prev) =>
      prev && prev.face === face && prev.index === index ? null : { face, index }
    );
  }

  function handleReviewColorPick(color: Color) {
    if (!reviewSelection) return;
    const { face, index } = reviewSelection;
    setCapturedFaces((prev) => {
      const faceArr = [...(prev[face] ?? [])] as Color[];
      faceArr[index] = color;
      return { ...prev, [face]: faceArr as Face };
    });
    setReviewSelection(null);
  }

  async function handleReviewSolve() {
    const cube = capturedFaces as CubeState;
    const err = validateCube(cube);
    if (err) {
      setSolveError(err + " — tap squares to fix the colors.");
      return;
    }
    setLoading(true);
    setSolveError(null);
    try {
      const res = await fetch("/api/solve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cubeString: toCubejsString(cube) }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSolveError(data.error ?? "Something went wrong. Try again!");
        return;
      }
      if (data.alreadySolved) {
        setSolveError("🎉 Your cube is already solved! Great job!");
        return;
      }
      streamRef.current?.getTracks().forEach((t) => t.stop());
      onSolve(data.moves as string[]);
    } catch {
      setSolveError("Could not connect. Check your internet and try again!");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm() {
    const step = CAPTURE_STEPS[stepIndex];
    const faceColors = detectedColors as Face;
    const newFaces = { ...capturedFaces, [step.face]: faceColors };

    if (stepIndex < CAPTURE_STEPS.length - 1) {
      setCapturedFaces(newFaces);
      const nextIndex = stepIndex + 1;
      const nextFace = CAPTURE_STEPS[nextIndex].face;
      const savedNext = newFaces[nextFace];
      setDetectedColors(savedNext ? [...savedNext] : []);
      setPhase(savedNext ? "confirm" : "capture");
      setStepIndex(nextIndex);
      setSelectedSquare(null);
    } else {
      // All 6 faces captured — validate and solve
      const cube = newFaces as CubeState;
      const err = validateCube(cube);
      if (err) {
        setSolveError(err + " — tap squares to fix the colors.");
        return;
      }

      setLoading(true);
      setSolveError(null);
      try {
        const res = await fetch("/api/solve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cubeString: toCubejsString(cube) }),
        });
        const data = await res.json();

        if (!res.ok) {
          setSolveError(data.error ?? "Something went wrong. Try again!");
          return;
        }

        if (data.alreadySolved) {
          setSolveError("🎉 Your cube is already solved! Great job!");
          return;
        }

        streamRef.current?.getTracks().forEach((t) => t.stop());
        onSolve(data.moves as string[]);
      } catch {
        setSolveError("Could not connect. Check your internet and try again!");
      } finally {
        setLoading(false);
      }
    }
  }

  // ─── Camera error state ──────────────────────────────────────────────────

  if (cameraError) {
    return (
      <div className="flex flex-col items-center gap-6 w-full max-w-md mx-auto px-4 page-enter">
        <div className="bg-red-50 border-2 border-red-300 rounded-2xl px-6 py-8 text-center w-full">
          <p className="text-5xl mb-4">📷</p>
          <p className="text-red-700 font-bold text-lg mb-6">{cameraError}</p>
          <button
            onClick={onCancel}
            className="w-full py-4 rounded-2xl bg-indigo-600 text-white font-black text-lg active:scale-95 transition-transform"
          >
            Enter colors manually instead
          </button>
        </div>
      </div>
    );
  }

  // ─── Render ──────────────────────────────────────────────────────────────

  const step = CAPTURE_STEPS[stepIndex];
  const isLastFace = stepIndex === CAPTURE_STEPS.length - 1;
  const capturedCount = CAPTURE_STEPS.filter((s) => capturedFaces[s.face]).length;
  const allCaptured = capturedCount === CAPTURE_STEPS.length;

  // Face layout for the cube net overview (same as CubeInput)
  const FACE_LAYOUT: { face: FaceKey; row: number; col: number }[] = [
    { face: "U", row: 0, col: 1 },
    { face: "L", row: 1, col: 0 },
    { face: "F", row: 1, col: 1 },
    { face: "R", row: 1, col: 2 },
    { face: "B", row: 1, col: 3 },
    { face: "D", row: 2, col: 1 },
  ];
  const FACE_BORDER: Record<FaceKey, string> = {
    U: "border-gray-400", R: "border-red-400", F: "border-green-400",
    D: "border-yellow-400", L: "border-orange-400", B: "border-blue-400",
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-md mx-auto px-3 page-enter">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-black text-indigo-700">
          🎲 Rubik&apos;s Cube Solver
        </h1>
        <p className="text-base font-semibold text-gray-500 mt-1">
          {phase === "review"
            ? `👁 Overview — ${capturedCount} of 6 faces scanned`
            : `📷 Scan face ${stepIndex + 1} of 6 — ${step.label}`}
        </p>
      </div>

      {/* Progress dots — tappable for already-visited faces */}
      <div className="flex items-center gap-2">
        {CAPTURE_STEPS.map((s, i) => {
          const isDone = i < stepIndex || !!capturedFaces[s.face];
          const isCurrent = i === stepIndex && phase !== "review";
          return (
            <button
              key={s.face}
              onClick={() => { if (isDone || isCurrent) goToStep(i); }}
              disabled={!isDone && !isCurrent}
              title={s.label}
              className={`w-4 h-4 rounded-full transition-all ${
                isCurrent
                  ? "bg-indigo-600 scale-125"
                  : isDone
                  ? "bg-green-500 cursor-pointer hover:scale-110"
                  : "bg-gray-200 cursor-default"
              }`}
            />
          );
        })}
        {capturedCount > 0 && phase !== "review" && (
          <button
            onClick={openReview}
            className="ml-2 px-3 py-1 rounded-xl border-2 border-indigo-300 bg-indigo-50 text-indigo-700 font-black text-xs active:scale-95 transition-transform"
          >
            👁 Overview
          </button>
        )}
      </div>

      {phase === "capture" ? (
        <>
          {/* Camera view with grid overlay + edge color hints */}
          <div
            className={`relative w-full aspect-square max-w-sm rounded-2xl overflow-hidden bg-black shadow-xl ring-4 ${step.ringClass}`}
          >
            <video
              ref={setVideoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover"
              style={mirrored ? { transform: "scaleX(-1)" } : undefined}
            />
            {/* SVG overlay: dim, grid lines, edge color indicators */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              viewBox={`0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}`}
              preserveAspectRatio="none"
            >
              {/* Dim outside grid */}
              <path
                fillRule="evenodd"
                d={`M0 0 H${CANVAS_SIZE} V${CANVAS_SIZE} H0 Z M${GRID_OFFSET} ${GRID_OFFSET} H${GRID_OFFSET + GRID_SIZE} V${GRID_OFFSET + GRID_SIZE} H${GRID_OFFSET} Z`}
                fill="rgba(0,0,0,0.45)"
              />
              {/* Vertical grid lines */}
              {[1, 2].map((i) => (
                <line
                  key={`v${i}`}
                  x1={GRID_OFFSET + (GRID_SIZE / 3) * i}
                  y1={GRID_OFFSET}
                  x2={GRID_OFFSET + (GRID_SIZE / 3) * i}
                  y2={GRID_OFFSET + GRID_SIZE}
                  stroke="white"
                  strokeWidth="2"
                  opacity="0.85"
                />
              ))}
              {/* Horizontal grid lines */}
              {[1, 2].map((i) => (
                <line
                  key={`h${i}`}
                  x1={GRID_OFFSET}
                  y1={GRID_OFFSET + (GRID_SIZE / 3) * i}
                  x2={GRID_OFFSET + GRID_SIZE}
                  y2={GRID_OFFSET + (GRID_SIZE / 3) * i}
                  stroke="white"
                  strokeWidth="2"
                  opacity="0.85"
                />
              ))}
              {/* Guide border */}
              <rect
                x={GRID_OFFSET}
                y={GRID_OFFSET}
                width={GRID_SIZE}
                height={GRID_SIZE}
                fill="none"
                stroke="white"
                strokeWidth="3"
                rx="4"
              />
              {/* TOP color indicator — shows which color should be at the top edge */}
              <rect
                x={CANVAS_SIZE / 2 - 30}
                y={8}
                width={60}
                height={20}
                rx={5}
                fill={COLOR_HEX[step.topColor]}
                stroke="white"
                strokeWidth="1.5"
              />
              <text
                x={CANVAS_SIZE / 2}
                y={22}
                textAnchor="middle"
                fontSize="10"
                fontWeight="bold"
                fill={["W"].includes(step.topColor) ? "#374151" : "white"}
              >
                TOP
              </text>
            </svg>
          </div>

          {/* Transition instruction — how to get here from the previous step */}
          {step.transition && (
            <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl px-4 py-3 w-full text-center">
              <p className="text-xs font-black text-amber-700 uppercase tracking-wide mb-0.5">From previous step</p>
              <p className="font-bold text-amber-900 text-sm">{step.transition}</p>
            </div>
          )}

          {/* Orientation diagram */}
          <div className="bg-indigo-50 border-2 border-indigo-200 rounded-2xl px-4 py-3 w-full">
            <p className="font-black text-indigo-900 text-sm text-center mb-3">
              {step.holdText}
            </p>
            {/* Cross diagram: center = face being scanned, 4 sides = adjacent faces */}
            <div className="flex items-center justify-center gap-4">
              <div className="grid gap-0.5" style={{ gridTemplateColumns: "repeat(3, 2.5rem)", gridTemplateRows: "repeat(3, 2.5rem)" }}>
                {/* Row 0 */}
                <div />
                <DiagramCell color={step.neighbors.top} label="top" />
                <div />
                {/* Row 1 */}
                <DiagramCell color={step.neighbors.left} label="left" />
                <DiagramCell color={FACE_CENTERS[step.face]} label="scan" highlight />
                <DiagramCell color={step.neighbors.right} label="right" />
                {/* Row 2 */}
                <div />
                <DiagramCell color={step.neighbors.bottom} label="btm" />
                <div />
              </div>
              <div className="text-xs text-indigo-700 font-semibold space-y-1 leading-tight">
                <div className="flex items-center gap-1.5">
                  <span className="inline-block w-3 h-3 rounded-sm border border-gray-400 flex-shrink-0" style={{ background: COLOR_HEX[step.neighbors.top] }} />
                  <span>Top: <strong>{COLOR_META[step.neighbors.top].label}</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="inline-block w-3 h-3 rounded-sm border border-gray-400 flex-shrink-0" style={{ background: COLOR_HEX[step.neighbors.right] }} />
                  <span>Right: <strong>{COLOR_META[step.neighbors.right].label}</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="inline-block w-3 h-3 rounded-sm border border-gray-400 flex-shrink-0" style={{ background: COLOR_HEX[step.neighbors.bottom] }} />
                  <span>Bottom: <strong>{COLOR_META[step.neighbors.bottom].label}</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="inline-block w-3 h-3 rounded-sm border border-gray-400 flex-shrink-0" style={{ background: COLOR_HEX[step.neighbors.left] }} />
                  <span>Left: <strong>{COLOR_META[step.neighbors.left].label}</strong></span>
                </div>
              </div>
            </div>
          </div>

          {/* Capture button */}
          <button
            onClick={handleCapture}
            className="w-full max-w-sm py-5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-2xl shadow-lg active:scale-95 transition-transform"
          >
            📸 Capture!
          </button>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setMirrored((m) => !m)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 font-bold text-sm active:scale-95 transition-all shadow-sm ${
                mirrored
                  ? "border-indigo-500 bg-indigo-100 text-indigo-700"
                  : "border-gray-300 bg-white text-gray-600"
              }`}
            >
              ⇆ {mirrored ? "Mirrored on" : "Mirror image"}
            </button>
            <button
              onClick={onCancel}
              className="text-sm text-gray-400 underline"
            >
              Manual input
            </button>
          </div>
        </>
      ) : (
        <>
          {/* Confirm phase */}
          <div className="bg-indigo-50 border-2 border-indigo-200 rounded-2xl px-4 py-3 text-center w-full">
            <p className="font-black text-indigo-900 text-lg">
              Does this look right?
            </p>
            <p className="text-sm text-indigo-600 mt-1">
              {selectedSquare !== null
                ? "Pick the correct color below ↓"
                : "Rotate or tap a square to fix its color"}
            </p>
          </div>

          {/* Detected face grid */}
          <div className="grid grid-cols-3 gap-2 w-60 mx-auto">
            {detectedColors.map((color, i) => {
              const isCenter = i === 4;
              const isSelected = selectedSquare === i;
              return (
                <button
                  key={i}
                  onClick={() => handleSquareTap(i)}
                  disabled={isCenter}
                  className={`
                    aspect-square rounded-xl border-4 shadow-md transition-all text-xl font-bold
                    ${colorBg(color)}
                    ${COLOR_META[color].text}
                    ${isCenter ? "border-gray-700 cursor-default" : "cursor-pointer active:scale-90"}
                    ${isSelected ? "border-indigo-600 scale-110 ring-4 ring-indigo-400 shadow-xl" : isCenter ? "" : "border-gray-300"}
                  `}
                >
                  {isCenter ? "★" : isSelected ? "?" : ""}
                </button>
              );
            })}
          </div>

          {/* Rotate buttons */}
          {selectedSquare === null && (
            <div className="flex gap-3 w-60 mx-auto">
              <button
                onClick={() => handleRotate("ccw")}
                className="flex-1 py-2 rounded-xl border-2 border-gray-300 bg-white text-gray-700 font-black text-base active:scale-95 transition-transform shadow"
              >
                ↺ Rotate left
              </button>
              <button
                onClick={() => handleRotate("cw")}
                className="flex-1 py-2 rounded-xl border-2 border-gray-300 bg-white text-gray-700 font-black text-base active:scale-95 transition-transform shadow"
              >
                ↻ Rotate right
              </button>
            </div>
          )}

          {/* Color picker (shown when a square is selected) */}
          {selectedSquare !== null && (
            <div className="flex gap-3 flex-wrap justify-center">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => handleColorPick(c)}
                  className={`
                    w-12 h-12 rounded-xl border-4 font-black text-xs shadow active:scale-90 transition-transform
                    ${colorBg(c)} ${COLOR_META[c].text} ${COLOR_META[c].border}
                  `}
                >
                  {COLOR_META[c].label.charAt(0)}
                </button>
              ))}
            </div>
          )}

          {/* Solve error */}
          {solveError && (
            <div className="bg-red-50 border-2 border-red-300 rounded-2xl px-4 py-3 text-red-700 font-bold text-center w-full text-sm">
              ⚠️ {solveError}
            </div>
          )}

          {/* Confirm button */}
          <button
            onClick={handleConfirm}
            disabled={loading || selectedSquare !== null}
            className={`
              w-full max-w-sm py-5 rounded-2xl font-black text-2xl text-white shadow-lg active:scale-95 transition-all
              ${loading || selectedSquare !== null ? "bg-green-300 cursor-not-allowed" : "bg-green-600 hover:bg-green-500"}
            `}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="inline-block w-5 h-5 border-4 border-white border-t-transparent rounded-full animate-spin" />
                Thinking…
              </span>
            ) : isLastFace ? (
              "🧩 Solve it!"
            ) : (
              "✅ Next face!"
            )}
          </button>

          <div className="flex gap-4 justify-center">
            {stepIndex > 0 && (
              <button
                onClick={() => goToStep(stepIndex - 1)}
                className="text-sm text-indigo-500 underline font-semibold"
              >
                ← Previous face
              </button>
            )}
            <button
              onClick={() => {
                setPhase("capture");
                setSelectedSquare(null);
                setSolveError(null);
              }}
              className="text-sm text-gray-500 underline"
            >
              ↺ Retake photo
            </button>
          </div>
        </>
      )}

      {/* ── Review phase: full cube net ─────────────────────────────────── */}
      {phase === "review" && (
        <>
          <div className="bg-indigo-50 border-2 border-indigo-200 rounded-2xl px-4 py-3 text-center w-full">
            <p className="font-black text-indigo-900 text-base">
              {reviewSelection ? "Pick the correct color ↓" : "Tap any square to correct its color"}
            </p>
          </div>

          {/* Cube net */}
          <div className="overflow-x-auto w-full pb-1">
            <div
              className="grid gap-1 mx-auto"
              style={{ gridTemplateColumns: "repeat(4, auto)", gridTemplateRows: "repeat(3, auto)", width: "fit-content" }}
            >
              {FACE_LAYOUT.map(({ face, row, col }) => {
                const faceColors = capturedFaces[face];
                const center = FACE_CENTERS[face];
                return (
                  <div
                    key={face}
                    className={`border-2 rounded-xl p-1 ${FACE_BORDER[face]}`}
                    style={{ gridRow: row + 1, gridColumn: col + 1 }}
                  >
                    <p className="text-center text-xs font-black text-gray-500 mb-1 leading-none">
                      {COLOR_META[center].label}
                    </p>
                    {faceColors ? (
                      <div className="grid grid-cols-3 gap-0.5">
                        {faceColors.map((color, i) => {
                          const isCenter = i === 4;
                          const isSelected = reviewSelection?.face === face && reviewSelection?.index === i;
                          return (
                            <button
                              key={i}
                              onClick={() => handleReviewSquareTap(face, i)}
                              disabled={isCenter}
                              className={`
                                w-8 h-8 sm:w-9 sm:h-9 rounded-md border-2 shadow-inner transition-all
                                ${colorBg(isCenter ? center : color)}
                                ${isCenter ? "border-gray-600 cursor-default opacity-90" : "border-gray-300 cursor-pointer"}
                                ${isSelected ? "border-indigo-600 scale-110 ring-2 ring-indigo-400" : ""}
                              `}
                            />
                          );
                        })}
                      </div>
                    ) : (
                      // Face not yet scanned — show placeholder grid
                      <div className="grid grid-cols-3 gap-0.5">
                        {Array.from({ length: 9 }).map((_, i) => (
                          <button
                            key={i}
                            onClick={() => { const si = CAPTURE_STEPS.findIndex(s => s.face === face); if (si !== -1) goToStep(si); }}
                            className="w-8 h-8 sm:w-9 sm:h-9 rounded-md border-2 border-dashed border-gray-300 bg-gray-100 flex items-center justify-center text-gray-400 text-xs"
                          >
                            {i === 4 ? <span className={`w-4 h-4 rounded-sm ${colorBg(center)}`} /> : ""}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Color picker when a square is selected */}
          {reviewSelection && (
            <div className="flex gap-3 flex-wrap justify-center">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => handleReviewColorPick(c)}
                  className={`w-12 h-12 rounded-xl border-4 font-black text-xs shadow active:scale-90 transition-transform ${colorBg(c)} ${COLOR_META[c].text} ${COLOR_META[c].border}`}
                >
                  {COLOR_META[c].label.charAt(0)}
                </button>
              ))}
            </div>
          )}

          {/* Solve error */}
          {solveError && (
            <div className="bg-red-50 border-2 border-red-300 rounded-2xl px-4 py-3 text-red-700 font-bold text-center w-full text-sm">
              ⚠️ {solveError}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col gap-3 w-full max-w-sm">
            {allCaptured && (
              <button
                onClick={handleReviewSolve}
                disabled={loading || !!reviewSelection}
                className={`w-full py-5 rounded-2xl font-black text-2xl text-white shadow-lg active:scale-95 transition-all ${loading || reviewSelection ? "bg-green-300 cursor-not-allowed" : "bg-green-600 hover:bg-green-500"}`}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="inline-block w-5 h-5 border-4 border-white border-t-transparent rounded-full animate-spin" />
                    Thinking…
                  </span>
                ) : "🧩 Solve it!"}
              </button>
            )}
            <button
              onClick={closeReview}
              className="w-full py-3 rounded-2xl border-2 border-indigo-300 bg-white text-indigo-700 font-black text-lg active:scale-95 transition-transform"
            >
              ← Back to scanning
            </button>
          </div>
        </>
      )}

      {/* Hidden canvas for color sampling */}
      <canvas
        ref={captureCanvasRef}
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        className="hidden"
      />
    </div>
  );
}
