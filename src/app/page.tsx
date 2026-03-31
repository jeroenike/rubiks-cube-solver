"use client";

import { useState } from "react";
import CubeInput from "@/components/CubeInput";
import CameraCapture from "@/components/CameraCapture";
import SolutionViewer from "@/components/SolutionViewer";

type Screen = "choose" | "camera" | "manual" | "solution";

export default function Home() {
  const [screen, setScreen] = useState<Screen>("choose");
  const [moves, setMoves] = useState<string[]>([]);

  function handleSolve(solutionMoves: string[]) {
    setMoves(solutionMoves);
    setScreen("solution");
  }

  function handleBack() {
    setScreen("choose");
    setMoves([]);
  }

  return (
    <main className="min-h-dvh py-6 px-2 flex flex-col items-center">
      {screen === "choose" && (
        <div className="flex flex-col items-center gap-8 w-full max-w-md mx-auto px-4 page-enter">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl font-black text-indigo-700 mb-2">
              🎲 Rubik&apos;s Cube Solver
            </h1>
            <p className="text-base sm:text-lg font-semibold text-gray-600">
              How do you want to set up your cube?
            </p>
          </div>

          <div className="flex flex-col gap-4 w-full">
            <button
              onClick={() => setScreen("camera")}
              className="w-full py-6 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xl shadow-lg active:scale-95 transition-all flex flex-col items-center gap-1"
            >
              <span className="text-4xl">📷</span>
              <span>Scan with camera</span>
              <span className="text-sm font-semibold opacity-80">
                Point your camera at each face
              </span>
            </button>

            <button
              onClick={() => setScreen("manual")}
              className="w-full py-6 rounded-2xl border-3 border-indigo-300 bg-white hover:bg-indigo-50 text-indigo-700 font-black text-xl shadow active:scale-95 transition-all flex flex-col items-center gap-1"
            >
              <span className="text-4xl">✏️</span>
              <span>Enter manually</span>
              <span className="text-sm font-semibold opacity-70">
                Tap to paint each square
              </span>
            </button>
          </div>
        </div>
      )}

      {screen === "camera" && (
        <CameraCapture
          onSolve={handleSolve}
          onCancel={() => setScreen("choose")}
        />
      )}

      {screen === "manual" && (
        <CubeInput onSolve={handleSolve} />
      )}

      {screen === "solution" && (
        <SolutionViewer moves={moves} onBack={handleBack} />
      )}
    </main>
  );
}
