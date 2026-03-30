import { NextRequest, NextResponse } from "next/server";

// We use require() because cubejs is CommonJS and has no named exports
// eslint-disable-next-line @typescript-eslint/no-require-imports
const Cube = require("cubejs");

let solverReady = false;

function ensureSolver() {
  if (!solverReady) {
    Cube.initSolver(); // loads ~5 MB pruning table once
    solverReady = true;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cubeString } = body as { cubeString: string };

    if (!cubeString || cubeString.length !== 54) {
      return NextResponse.json(
        { error: "I need exactly 54 color squares to solve the cube. Please make sure every square is colored!" },
        { status: 400 }
      );
    }

    // Validate that only valid letters are used
    if (!/^[URFDLB]+$/.test(cubeString)) {
      return NextResponse.json(
        { error: "Some squares have an unknown color. Please check and try again!" },
        { status: 400 }
      );
    }

    // Validate that each color appears exactly 9 times
    const counts: Record<string, number> = {};
    for (const ch of cubeString) {
      counts[ch] = (counts[ch] ?? 0) + 1;
    }
    for (const [ch, count] of Object.entries(counts)) {
      if (count !== 9) {
        const names: Record<string, string> = {
          U: "White (Top)",
          R: "Red (Right)",
          F: "Green (Front)",
          D: "Yellow (Bottom)",
          L: "Orange (Left)",
          B: "Blue (Back)",
        };
        return NextResponse.json(
          {
            error: `The color ${names[ch] ?? ch} appears ${count} times. Each color must appear exactly 9 times!`,
          },
          { status: 400 }
        );
      }
    }

    ensureSolver();

    let solution: string;
    try {
      const cube = Cube.fromString(cubeString);
      solution = cube.solve() as string;
    } catch {
      return NextResponse.json(
        {
          error:
            "Hmm, this cube combination doesn't look right. Maybe some colors are wrong? Double-check every square and try again!",
        },
        { status: 422 }
      );
    }

    if (!solution || solution.trim() === "") {
      // Already solved!
      return NextResponse.json({ moves: [], alreadySolved: true });
    }

    const moves = solution
      .trim()
      .split(/\s+/)
      .filter((m) => m.length > 0);

    return NextResponse.json({ moves, alreadySolved: false });
  } catch (err) {
    console.error("Solve error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again!" },
      { status: 500 }
    );
  }
}
