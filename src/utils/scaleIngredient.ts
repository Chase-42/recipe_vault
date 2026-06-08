// Matches a leading quantity at the start of an ingredient line.
// Groups: (1) whole-number part of mixed number, (2) fraction part, (3) standalone fraction or decimal/int
const QUANTITY_RE =
  /^(\d+)\s+(\d+\/\d+)|^(\d+\/\d+|\d+(?:\.\d+)?)/;

const FRACTIONS: [number, string][] = [
  [1 / 4, "1/4"],
  [1 / 3, "1/3"],
  [1 / 2, "1/2"],
  [2 / 3, "2/3"],
  [3 / 4, "3/4"],
];

function formatQuantity(value: number): string {
  if (value <= 0) return "0";

  const whole = Math.floor(value);
  const remainder = value - whole;

  if (remainder < 0.01) return String(whole);

  for (const [frac, label] of FRACTIONS) {
    if (Math.abs(remainder - frac) < 0.05) {
      return whole > 0 ? `${whole} ${label}` : label;
    }
  }

  // No clean fraction — round to two significant digits for cooking
  const rounded = Math.round(value * 100) / 100;
  return String(rounded);
}

function parseLeadingQuantity(line: string): { value: number; rest: string } | null {
  const match = line.match(QUANTITY_RE);
  if (!match) return null;

  let value: number;
  let matchedLength: number;

  if (match[1] !== undefined && match[2] !== undefined) {
    // Mixed number: "2 1/2"
    const [num, den] = match[2].split("/").map(Number);
    value = Number(match[1]) + (num ?? 0) / (den ?? 1);
    matchedLength = match[0].length;
  } else if (match[3] !== undefined) {
    if (match[3].includes("/")) {
      const [num, den] = match[3].split("/").map(Number);
      value = (num ?? 0) / (den ?? 1);
    } else {
      value = Number(match[3]);
    }
    matchedLength = match[0].length;
  } else {
    return null;
  }

  if (!isFinite(value) || value === 0) return null;

  const rest = line.slice(matchedLength);
  return { value, rest };
}

export function scaleIngredientLine(line: string, scale: number): string {
  if (scale === 1) return line;

  const parsed = parseLeadingQuantity(line.trim());
  if (!parsed) return line;

  return formatQuantity(parsed.value * scale) + parsed.rest;
}
