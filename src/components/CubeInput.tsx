"use client";

import { useState } from "react";
import {
  Color,
  CubeState,
  FaceKey,
  COLOR_META,
  FACE_CENTERS,
  FACE_NAMES,
  createDefaultCube,
  toCubejsString,
  validateCube,
} from "@/lib/types";

const COLORS: Color[] = ["W", "Y", "R", "O", "B", "G"];

// Visual layout: which faces appear in which grid position [row, col]
const FACE_LAYOUT: { face: FaceKey; row: number; col: number }[] = [
  { face: "U", row: 0, col: 1 },
  { face: "L", row: 1, col: 0 },
  { face: "F", row: 1, col: 1 },
  { face: "R", row: 1, col: 2 },
  { face: "B", row: 1, col: 3 },
  { face: "D", row: 2, col: 1 },
];

const FACE_COLORS: Record<FaceKey, string> = {
  U: "border-gray-400",
  R: "border-red-400",
  F: "border-green-400",
  D: "border-yellow-400",
  L: "border-orange-400",
  B: "border-blue-400",
};

// Square bg color (tailwind class from color code)
function colorClass(c: Color): string {
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

interface Props {
  onSolve: (moves: string[]) => void;
}

export default function CubeInput({ onSolve }: Props) {
  const [cube, setCube] = useState<CubeState>(createDefaultCube());
  const [selectedColor, setSelectedColor] = useState<Color>("R");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function paintSquare(face: FaceKey, index: number) {
    // Don't allow painting the center
    if (index === 4) return;
    setCube((prev) => {
      const newFace = [...prev[face]] as CubeState[FaceKey];
      newFace[index] = selectedColor;
      return { ...prev, [face]: newFace };
    });
  }

  function resetCube() {
    setCube(createDefaultCube());
    setError(null);
  }

  async function handleSolve() {
    setError(null);

    // Validate color counts
    const validationError = validateCube(cube);
    if (validationError) {
      setError(validationError);
      return;
    }

    const cubeString = toCubejsString(cube);
    setLoading(true);

    try {
      const res = await fetch("/api/solve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cubeString }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again!");
        return;
      }

      if (data.alreadySolved) {
        setError("🎉 Your cube is already solved! Great job!");
        return;
      }

      onSolve(data.moves as string[]);
    } catch {
      setError("Could not connect. Please check your internet and try again!");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-2xl mx-auto px-3 page-enter">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl sm:text-4xl font-black text-indigo-700 mb-1">
          🎲 Rubik&apos;s Cube Solver
        </h1>
        <p className="text-base sm:text-lg font-semibold text-gray-600">
          Color your cube, then press <strong>Solve!</strong>
        </p>
      </div>

      {/* Orientation guide */}
      <div className="bg-indigo-50 border-2 border-indigo-200 rounded-2xl px-4 py-3 text-sm sm:text-base font-semibold text-indigo-800 text-center w-full">
        <span className="text-lg">📌</span> Hold your cube with{" "}
        <span className="text-gray-700 font-black">WHITE on TOP</span> and{" "}
        <span className="text-green-700 font-black">GREEN facing YOU</span>
      </div>

      {/* Color picker */}
      <div className="flex gap-3 flex-wrap justify-center">
        {COLORS.map((c) => {
          const meta = COLOR_META[c];
          const isSelected = selectedColor === c;
          return (
            <button
              key={c}
              onClick={() => setSelectedColor(c)}
              className={`
                w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border-4 font-black text-xs flex items-center justify-center
                transition-all duration-150 active:scale-90 shadow-md
                ${colorClass(c)}
                ${meta.text}
                ${isSelected
                  ? "border-indigo-600 scale-110 shadow-lg ring-4 ring-indigo-400"
                  : `${meta.border}`
                }
              `}
            >
              {isSelected ? "✓" : meta.label.charAt(0)}
            </button>
          );
        })}
      </div>
      <p className="text-sm font-semibold text-gray-500 -mt-3">
        ☝️ Tap a color above, then tap the squares to paint them!
      </p>

      {/* Cube net */}
      <div className="relative w-full overflow-x-auto pb-2">
        <div className="grid gap-1 mx-auto"
          style={{
            gridTemplateColumns: "repeat(4, auto)",
            gridTemplateRows: "repeat(3, auto)",
            width: "fit-content",
          }}
        >
          {FACE_LAYOUT.map(({ face, row, col }) => (
            <div
              key={face}
              className={`border-2 rounded-xl p-1 ${FACE_COLORS[face]}`}
              style={{ gridRow: row + 1, gridColumn: col + 1 }}
            >
              {/* Face label */}
              <p className="text-center text-xs font-black text-gray-500 mb-1 leading-none">
                {FACE_NAMES[face]}
              </p>
              {/* 3×3 grid */}
              <div className="grid grid-cols-3 gap-0.5">
                {cube[face].map((color, i) => {
                  const isCenter = i === 4;
                  const center = FACE_CENTERS[face];
                  return (
                    <button
                      key={i}
                      onClick={() => paintSquare(face, i)}
                      disabled={isCenter}
                      className={`
                        cube-square w-9 h-9 sm:w-11 sm:h-11 rounded-md border-2 shadow-inner
                        ${colorClass(isCenter ? center : color)}
                        ${isCenter
                          ? "border-gray-600 cursor-default opacity-90"
                          : "border-gray-300 cursor-pointer hover:brightness-90"
                        }
                      `}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border-2 border-red-300 rounded-2xl px-4 py-3 text-red-700 font-bold text-center w-full text-sm sm:text-base">
          ⚠️ {error}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-4 w-full max-w-sm">
        <button
          onClick={resetCube}
          className="flex-1 py-4 rounded-2xl border-3 border-gray-300 bg-white text-gray-600 font-black text-lg active:scale-95 transition-transform shadow"
        >
          🔄 Reset
        </button>
        <button
          onClick={handleSolve}
          disabled={loading}
          className={`
            flex-2 flex-grow py-4 rounded-2xl font-black text-xl text-white shadow-lg active:scale-95 transition-all
            ${loading
              ? "bg-indigo-300 cursor-not-allowed"
              : "bg-indigo-600 hover:bg-indigo-500"
            }
          `}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="inline-block w-5 h-5 border-4 border-white border-t-transparent rounded-full animate-spin" />
              Thinking…
            </span>
          ) : (
            "🧩 Solve!"
          )}
        </button>
      </div>

      {/* Tip */}
      <p className="text-xs text-gray-400 font-semibold text-center pb-4">
        Tip: The center square of each face stays fixed — it shows that face&apos;s color!
      </p>
    </div>
  );
}
