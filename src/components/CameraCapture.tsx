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
  holdText: string;    // how to hold the cube
  topColor: Color;     // color that should appear at the top edge of the grid
  ringClass: string;
}[] = [
  {
    face: "U",
    label: "White face (top)",
    holdText: "Lay the cube flat and look straight down at the WHITE face",
    topColor: "B",   // Blue face is at the far/top edge
    ringClass: "ring-gray-300",
  },
  {
    face: "F",
    label: "Green face (front)",
    holdText: "Hold cube upright, GREEN face toward camera, WHITE on top",
    topColor: "W",
    ringClass: "ring-green-400",
  },
  {
    face: "R",
    label: "Red face (right)",
    holdText: "Hold cube upright, RED face toward camera, WHITE on top",
    topColor: "W",
    ringClass: "ring-red-400",
  },
  {
    face: "D",
    label: "Yellow face (bottom)",
    holdText: "Flip cube over and look straight down at the YELLOW face",
    topColor: "G",   // Green face is at the far/top edge when flipped
    ringClass: "ring-yellow-400",
  },
  {
    face: "L",
    label: "Orange face (left)",
    holdText: "Hold cube upright, ORANGE face toward camera, WHITE on top",
    topColor: "W",
    ringClass: "ring-orange-400",
  },
  {
    face: "B",
    label: "Blue face (back)",
    holdText: "Hold cube upright, BLUE face toward camera, WHITE on top",
    topColor: "W",
    ringClass: "ring-blue-400",
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
  const [phase, setPhase] = useState<"capture" | "confirm">("capture");
  const [detectedColors, setDetectedColors] = useState<Color[]>([]);
  const [selectedSquare, setSelectedSquare] = useState<number | null>(null);
  const [capturedFaces, setCapturedFaces] = useState<Partial<Record<FaceKey, Face>>>({});

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

    // Draw video frame to canvas with cover-fit
    const scale = Math.max(CANVAS_SIZE / vw, CANVAS_SIZE / vh);
    const dw = vw * scale;
    const dh = vh * scale;
    const dx = (CANVAS_SIZE - dw) / 2;
    const dy = (CANVAS_SIZE - dh) / 2;
    ctx.drawImage(video, dx, dy, dw, dh);

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
      // Re-enforce center color after rotation (it maps to itself, but be explicit)
      rotated[4] = FACE_CENTERS[face];
      return rotated;
    });
    setSelectedSquare(null);
  }

  async function handleConfirm() {
    const step = CAPTURE_STEPS[stepIndex];
    const faceColors = detectedColors as Face;
    const newFaces = { ...capturedFaces, [step.face]: faceColors };

    if (stepIndex < CAPTURE_STEPS.length - 1) {
      setCapturedFaces(newFaces);
      setStepIndex((i) => i + 1);
      setPhase("capture");
      setDetectedColors([]);
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

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-md mx-auto px-3 page-enter">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-black text-indigo-700">
          🎲 Rubik&apos;s Cube Solver
        </h1>
        <p className="text-base font-semibold text-gray-500 mt-1">
          📷 Scan face {stepIndex + 1} of 6 — {step.label}
        </p>
      </div>

      {/* Progress dots */}
      <div className="flex gap-2">
        {CAPTURE_STEPS.map((s, i) => (
          <div
            key={s.face}
            className={`w-3 h-3 rounded-full transition-colors ${
              i < stepIndex
                ? "bg-green-500"
                : i === stepIndex
                ? "bg-indigo-600"
                : "bg-gray-200"
            }`}
          />
        ))}
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

          {/* Orientation instruction */}
          <div className="bg-indigo-50 border-2 border-indigo-200 rounded-2xl px-4 py-3 w-full">
            <p className="font-black text-indigo-900 text-sm text-center">
              {step.holdText}
            </p>
            <div className="flex items-center justify-center gap-2 mt-2">
              <span className="text-xs font-semibold text-indigo-600">Top of grid →</span>
              <div className={`w-5 h-5 rounded ${colorBg(step.topColor)} border-2 border-gray-400 flex-shrink-0`} />
              <span className="text-xs font-bold text-indigo-800">
                {COLOR_META[step.topColor].label} face
              </span>
            </div>
          </div>

          {/* Capture button */}
          <button
            onClick={handleCapture}
            className="w-full max-w-sm py-5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-2xl shadow-lg active:scale-95 transition-transform"
          >
            📸 Capture!
          </button>

          <button
            onClick={onCancel}
            className="text-sm text-gray-400 underline"
          >
            Switch to manual input
          </button>
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

          <button
            onClick={() => {
              setPhase("capture");
              setSelectedSquare(null);
              setSolveError(null);
            }}
            className="text-sm text-gray-500 underline"
          >
            ← Retake this face
          </button>
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
