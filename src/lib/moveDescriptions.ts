export type MoveInfo = {
  move: string;
  face: "top" | "bottom" | "left" | "right" | "front" | "back";
  direction: "clockwise" | "counter" | "twice";
  title: string;
  description: string;
  emoji: string;
  arrowDir: "cw" | "ccw" | "two";
  color: string; // Tailwind bg color for the face highlight
};

export const MOVE_DESCRIPTIONS: Record<string, MoveInfo> = {
  // ── RIGHT face ───────────────────────────────────────────────────────────
  R: {
    move: "R",
    face: "right",
    direction: "clockwise",
    title: "Right side → UP",
    description: "Grab the RIGHT side and push it UP",
    emoji: "⬆️",
    arrowDir: "cw",
    color: "bg-red-500",
  },
  "R'": {
    move: "R'",
    face: "right",
    direction: "counter",
    title: "Right side → DOWN",
    description: "Grab the RIGHT side and pull it DOWN",
    emoji: "⬇️",
    arrowDir: "ccw",
    color: "bg-red-500",
  },
  R2: {
    move: "R2",
    face: "right",
    direction: "twice",
    title: "Right side → UP TWICE",
    description: "Grab the RIGHT side and push it UP — TWO times!",
    emoji: "⬆️⬆️",
    arrowDir: "two",
    color: "bg-red-500",
  },

  // ── LEFT face ────────────────────────────────────────────────────────────
  L: {
    move: "L",
    face: "left",
    direction: "clockwise",
    title: "Left side → DOWN",
    description: "Grab the LEFT side and push it DOWN",
    emoji: "⬇️",
    arrowDir: "cw",
    color: "bg-orange-500",
  },
  "L'": {
    move: "L'",
    face: "left",
    direction: "counter",
    title: "Left side → UP",
    description: "Grab the LEFT side and pull it UP",
    emoji: "⬆️",
    arrowDir: "ccw",
    color: "bg-orange-500",
  },
  L2: {
    move: "L2",
    face: "left",
    direction: "twice",
    title: "Left side → DOWN TWICE",
    description: "Grab the LEFT side and push it DOWN — TWO times!",
    emoji: "⬇️⬇️",
    arrowDir: "two",
    color: "bg-orange-500",
  },

  // ── UP (top) face ────────────────────────────────────────────────────────
  U: {
    move: "U",
    face: "top",
    direction: "clockwise",
    title: "Top layer → RIGHT",
    description: "Slide the TOP layer to the RIGHT",
    emoji: "➡️",
    arrowDir: "cw",
    color: "bg-gray-100",
  },
  "U'": {
    move: "U'",
    face: "top",
    direction: "counter",
    title: "Top layer → LEFT",
    description: "Slide the TOP layer to the LEFT",
    emoji: "⬅️",
    arrowDir: "ccw",
    color: "bg-gray-100",
  },
  U2: {
    move: "U2",
    face: "top",
    direction: "twice",
    title: "Top layer → TWICE",
    description: "Slide the TOP layer to the right — TWO times!",
    emoji: "↔️",
    arrowDir: "two",
    color: "bg-gray-100",
  },

  // ── DOWN (bottom) face ───────────────────────────────────────────────────
  D: {
    move: "D",
    face: "bottom",
    direction: "clockwise",
    title: "Bottom layer → LEFT",
    description: "Slide the BOTTOM layer to the LEFT",
    emoji: "⬅️",
    arrowDir: "cw",
    color: "bg-yellow-400",
  },
  "D'": {
    move: "D'",
    face: "bottom",
    direction: "counter",
    title: "Bottom layer → RIGHT",
    description: "Slide the BOTTOM layer to the RIGHT",
    emoji: "➡️",
    arrowDir: "ccw",
    color: "bg-yellow-400",
  },
  D2: {
    move: "D2",
    face: "bottom",
    direction: "twice",
    title: "Bottom layer → TWICE",
    description: "Slide the BOTTOM layer — TWO times!",
    emoji: "↔️",
    arrowDir: "two",
    color: "bg-yellow-400",
  },

  // ── FRONT face ───────────────────────────────────────────────────────────
  F: {
    move: "F",
    face: "front",
    direction: "clockwise",
    title: "Front face → Clockwise",
    description: "Turn the FRONT face like a clock (↻)",
    emoji: "↻",
    arrowDir: "cw",
    color: "bg-green-500",
  },
  "F'": {
    move: "F'",
    face: "front",
    direction: "counter",
    title: "Front face → Counter-clockwise",
    description: "Turn the FRONT face backwards (↺)",
    emoji: "↺",
    arrowDir: "ccw",
    color: "bg-green-500",
  },
  F2: {
    move: "F2",
    face: "front",
    direction: "twice",
    title: "Front face → TWICE",
    description: "Turn the FRONT face — TWO times!",
    emoji: "🔄",
    arrowDir: "two",
    color: "bg-green-500",
  },

  // ── BACK face ────────────────────────────────────────────────────────────
  B: {
    move: "B",
    face: "back",
    direction: "clockwise",
    title: "Back face → top goes RIGHT",
    description: "Keep GREEN toward you! Reach to the BLUE face at the back and turn it so its top edge goes RIGHT",
    emoji: "➡️",
    arrowDir: "cw",
    color: "bg-blue-500",
  },
  "B'": {
    move: "B'",
    face: "back",
    direction: "counter",
    title: "Back face → top goes LEFT",
    description: "Keep GREEN toward you! Reach to the BLUE face at the back and turn it so its top edge goes LEFT",
    emoji: "⬅️",
    arrowDir: "ccw",
    color: "bg-blue-500",
  },
  B2: {
    move: "B2",
    face: "back",
    direction: "twice",
    title: "Back face → TWICE",
    description: "Keep GREEN toward you! Reach to the BLUE face at the back and turn it twice (top goes right, then right again)",
    emoji: "🔄",
    arrowDir: "two",
    color: "bg-blue-500",
  },
};

export function getMoveInfo(move: string): MoveInfo {
  return (
    MOVE_DESCRIPTIONS[move] ?? {
      move,
      face: "front",
      direction: "clockwise",
      title: move,
      description: `Do move: ${move}`,
      emoji: "🔄",
      arrowDir: "cw",
      color: "bg-gray-400",
    }
  );
}
