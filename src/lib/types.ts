// Color codes for each square on the cube
// W=White, Y=Yellow, R=Red, O=Orange, B=Blue, G=Green
export type Color = "W" | "Y" | "R" | "O" | "B" | "G";

// Each face has 9 squares (3x3)
export type Face = [
  Color, Color, Color,
  Color, Color, Color,
  Color, Color, Color
];

// The full cube state: 6 faces
export type CubeState = {
  U: Face; // Up / Top    — White center
  R: Face; // Right       — Red center
  F: Face; // Front       — Green center
  D: Face; // Down/Bottom — Yellow center
  L: Face; // Left        — Orange center
  B: Face; // Back        — Blue center
};

export type FaceKey = keyof CubeState;

// Color metadata for display
export const COLOR_META: Record<Color, { label: string; bg: string; border: string; text: string }> = {
  W: { label: "White",  bg: "bg-white",       border: "border-gray-400",  text: "text-gray-800" },
  Y: { label: "Yellow", bg: "bg-yellow-400",   border: "border-yellow-600", text: "text-yellow-900" },
  R: { label: "Red",    bg: "bg-red-500",      border: "border-red-700",   text: "text-white" },
  O: { label: "Orange", bg: "bg-orange-500",   border: "border-orange-700", text: "text-white" },
  B: { label: "Blue",   bg: "bg-blue-500",     border: "border-blue-700",  text: "text-white" },
  G: { label: "Green",  bg: "bg-green-500",    border: "border-green-700", text: "text-white" },
};

// Fixed center colors for each face (index 4 in each face array)
export const FACE_CENTERS: Record<FaceKey, Color> = {
  U: "W",
  R: "R",
  F: "G",
  D: "Y",
  L: "O",
  B: "B",
};

export const FACE_NAMES: Record<FaceKey, string> = {
  U: "Top",
  R: "Right",
  F: "Front",
  D: "Bottom",
  L: "Left",
  B: "Back",
};

// Creates a solved (default) cube state
export function createDefaultCube(): CubeState {
  const makeFace = (color: Color): Face =>
    [color, color, color, color, color, color, color, color, color];

  return {
    U: makeFace("W"),
    R: makeFace("R"),
    F: makeFace("G"),
    D: makeFace("Y"),
    L: makeFace("O"),
    B: makeFace("B"),
  };
}

// Convert our CubeState to the 54-char string cubejs expects
// cubejs uses U/R/F/D/L/B as color codes (matching center sticker of each face)
export function toCubejsString(state: CubeState): string {
  const colorToFaceLetter: Record<Color, string> = {
    W: "U",
    R: "R",
    G: "F",
    Y: "D",
    O: "L",
    B: "B",
  };

  const faceOrder: FaceKey[] = ["U", "R", "F", "D", "L", "B"];
  return faceOrder
    .flatMap((face) => state[face].map((color) => colorToFaceLetter[color]))
    .join("");
}

// Validate that each color appears exactly 9 times
export function validateCube(state: CubeState): string | null {
  const counts: Record<Color, number> = { W: 0, Y: 0, R: 0, O: 0, B: 0, G: 0 };
  const faces: FaceKey[] = ["U", "R", "F", "D", "L", "B"];

  for (const face of faces) {
    for (const color of state[face]) {
      counts[color]++;
    }
  }

  for (const [color, count] of Object.entries(counts)) {
    if (count !== 9) {
      return `Color ${COLOR_META[color as Color].label} appears ${count} times (should be exactly 9)`;
    }
  }
  return null;
}
