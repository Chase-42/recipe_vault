import sanitizeString from "./sanitizeString";

// Recipe instruction step structure
export interface RecipeStep {
  text?: string;
  "@type"?: string;
  name?: string;
  itemListElement?: RecipeStep[];
  image?: unknown;
}

// Processes recipe instructions from various formats into a single string
export function processInstructions(
  instructions: RecipeStep[] | string | undefined
): string {
  if (!instructions) return "";

  // Handle string format
  if (typeof instructions === "string") {
    return sanitizeString(instructions);
  }

  // Handle array format
  if (!Array.isArray(instructions)) {
    return "";
  }

  const allSteps: string[] = [];

  const extractSteps = (step: RecipeStep): void => {
    if (step.text) {
      allSteps.push(sanitizeString(step.text));
    }
    if (Array.isArray(step.itemListElement)) {
      step.itemListElement.forEach(extractSteps);
    }
  };

  instructions.forEach(extractSteps);
  return allSteps.filter(Boolean).join("\n");
}

