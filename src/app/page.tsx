"use client";

import { useState } from "react";
import CubeInput from "@/components/CubeInput";
import SolutionViewer from "@/components/SolutionViewer";

type Screen = "input" | "solution";

export default function Home() {
  const [screen, setScreen] = useState<Screen>("input");
  const [moves, setMoves] = useState<string[]>([]);

  function handleSolve(solutionMoves: string[]) {
    setMoves(solutionMoves);
    setScreen("solution");
  }

  function handleBack() {
    setScreen("input");
    setMoves([]);
  }

  return (
    <main className="min-h-dvh py-6 px-2 flex flex-col items-center">
      {screen === "input" ? (
        <CubeInput onSolve={handleSolve} />
      ) : (
        <SolutionViewer moves={moves} onBack={handleBack} />
      )}
    </main>
  );
}
