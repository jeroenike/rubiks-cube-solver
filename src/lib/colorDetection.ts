import { Color } from "./types";

// Convert RGB to HSL
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) return [0, 0, l];

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h: number;
  switch (max) {
    case r:
      h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
      break;
    case g:
      h = ((b - r) / d + 2) / 6;
      break;
    default:
      h = ((r - g) / d + 4) / 6;
      break;
  }

  return [h * 360, s, l];
}

// Fallback: nearest neighbor in RGB space
const REFERENCE_COLORS: [Color, number, number, number][] = [
  ["W", 240, 240, 240],
  ["Y", 255, 210, 0],
  ["R", 200, 30, 50],
  ["O", 255, 100, 0],
  ["B", 0, 80, 200],
  ["G", 0, 160, 70],
];

function nearestColor(r: number, g: number, b: number): Color {
  let minDist = Infinity;
  let best: Color = "W";
  for (const [color, cr, cg, cb] of REFERENCE_COLORS) {
    const dist = (r - cr) ** 2 + (g - cg) ** 2 + (b - cb) ** 2;
    if (dist < minDist) {
      minDist = dist;
      best = color;
    }
  }
  return best;
}

// Classify an RGB pixel to one of the 6 cube colors using HSL thresholds
export function classifyColor(r: number, g: number, b: number): Color {
  const [h, s, l] = rgbToHsl(r, g, b);

  // White: high lightness, low saturation
  if (l > 0.72 && s < 0.3) return "W";

  // Yellow: hue 40–75, decent saturation
  if (h >= 40 && h <= 75 && s > 0.4) return "Y";

  // Orange: hue 18–40, high saturation
  if (h >= 18 && h <= 40 && s > 0.55) return "O";

  // Red: hue < 18 or hue > 335, decent saturation
  if ((h < 18 || h > 335) && s > 0.45) return "R";

  // Green: hue 90–160
  if (h >= 90 && h <= 160 && s > 0.3) return "G";

  // Blue: hue 190–260
  if (h >= 190 && h <= 260 && s > 0.3) return "B";

  // Fallback to nearest-neighbor in RGB
  return nearestColor(r, g, b);
}

// Sample the average RGB of a square region centered at (cx, cy)
function sampleRegion(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number
): [number, number, number] {
  const x = Math.max(0, Math.round(cx - radius));
  const y = Math.max(0, Math.round(cy - radius));
  const w = Math.round(radius * 2);
  const h = Math.round(radius * 2);
  const data = ctx.getImageData(x, y, w, h).data;

  let rSum = 0,
    gSum = 0,
    bSum = 0,
    count = 0;
  for (let i = 0; i < data.length; i += 4) {
    rSum += data[i];
    gSum += data[i + 1];
    bSum += data[i + 2];
    count++;
  }

  if (count === 0) return [128, 128, 128];
  return [
    Math.round(rSum / count),
    Math.round(gSum / count),
    Math.round(bSum / count),
  ];
}

// Extract 9 colors from a face region on the canvas.
// gridX/gridY: top-left corner of the 3×3 grid; gridSize: total size of the grid.
export function extractFaceColors(
  ctx: CanvasRenderingContext2D,
  gridX: number,
  gridY: number,
  gridSize: number
): Color[] {
  const cellSize = gridSize / 3;
  const sampleRadius = cellSize * 0.25;
  const colors: Color[] = [];

  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const cx = gridX + col * cellSize + cellSize / 2;
      const cy = gridY + row * cellSize + cellSize / 2;
      const [r, g, b] = sampleRegion(ctx, cx, cy, sampleRadius);
      colors.push(classifyColor(r, g, b));
    }
  }

  return colors;
}
