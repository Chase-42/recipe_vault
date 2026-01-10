import getRecipeData from "@rethora/url-recipe-scraper";
import { logger } from "~/lib/logger";
import { schemas } from "~/lib/schemas";
import { validateUrl } from "~/lib/validation";
import type { FallbackApiResponse, FlaskApiResponse } from "~/types";
import { processInstructions } from "./instruction-processor";
import { fetchRecipeImages, tryHtmlScraper } from "./scraper";

const FLASK_API_TIMEOUT_MS = 10_000; // 10 seconds
const SCRAPER_TIMEOUT_MS = 15_000; // 15 seconds

// Fixes instruction strings that were incorrectly split by the scraper
function fixInstructionString(instructions: string): string {
  const lines = instructions
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) return instructions;

  const fixedSteps: string[] = [];
  let currentStep = "";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;

    const nextLine = i < lines.length - 1 ? (lines[i + 1] ?? null) : null;

    // If line starts with lowercase, it's a continuation of the previous step
    const startsWithLowercase = /^[a-z]/.test(line);
    const isContinuation = startsWithLowercase && currentStep.length > 0;

    // Short header-like lines (1-4 words, title case, no punctuation)
    const words = line.split(/\s+/);
    const isShortHeader =
      words.length <= 4 &&
      words[0]?.[0] &&
      /^[A-Z]/.test(words[0]) &&
      !line.match(/[.!?]$/) &&
      line.length < 50;

    // Next line is substantial (likely content for the header)
    const hasSubstantialNextLine = nextLine && nextLine.length > 30;

    if (isContinuation) {
      // Merge continuation with current step (space separator)
      currentStep = currentStep ? `${currentStep} ${line}` : line;
    } else if (isShortHeader && hasSubstantialNextLine && nextLine) {
      // Merge short header with next line (space separator)
      if (currentStep) {
        fixedSteps.push(currentStep);
      }
      currentStep = `${line} ${nextLine}`;
      i++; // Skip next line since we merged it
    } else {
      // Normal line - save current and start new
      if (currentStep) {
        fixedSteps.push(currentStep);
      }
      currentStep = line;
    }
  }

  // Don't forget the last step
  if (currentStep) {
    fixedSteps.push(currentStep);
  }

  return fixedSteps.join("\n");
}

// Creates a timeout promise that rejects after the specified duration
function createTimeout<T>(ms: number, message: string): Promise<T> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(message)), ms);
  });
}

// Fetches data with a timeout
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  return Promise.race([
    fetch(url, options),
    createTimeout<Response>(timeoutMs, `Request timeout after ${timeoutMs}ms`),
  ]);
}

// Main Scraper: JS Package (@rethora/url-recipe-scraper) - primary scraper
export async function tryJsPackageScraper(
  link: string,
): Promise<FallbackApiResponse | null> {
  const log = logger.forComponent("JsPackageScraper");

  if (!validateUrl(link)) {
    log.warn("Invalid URL provided", { link });
    return null;
  }

  try {
    const data = await Promise.race([
      getRecipeData(link),
      createTimeout<Awaited<ReturnType<typeof getRecipeData>>>(
        SCRAPER_TIMEOUT_MS,
        "Scraper timeout",
      ),
    ]);

    if (!data?.name || !data?.recipeIngredient?.length) {
      log.warn("Incomplete data returned", {
        hasName: !!data?.name,
        ingredientsCount: data?.recipeIngredient?.length ?? 0,
      });
      return null;
    }

    // Transform instructions to the expected format
    const transformedInstructions: Array<{
      "@type": "HowToStep";
      text: string;
    }> = [];

    const recipeInstructions = data.recipeInstructions;
    if (recipeInstructions) {
      if (Array.isArray(recipeInstructions)) {
        for (const instruction of recipeInstructions) {
          // Handle HowToStep
          if (
            instruction &&
            typeof instruction === "object" &&
            "text" in instruction
          ) {
            const text = instruction.text;
            if (typeof text === "string" && text.trim()) {
              transformedInstructions.push({
                "@type": "HowToStep",
                text: text.trim(),
              });
            }
          }
          // Handle HowToSection
          if (
            instruction &&
            typeof instruction === "object" &&
            "itemListElement" in instruction
          ) {
            const items = instruction.itemListElement;
            if (Array.isArray(items)) {
              for (const item of items) {
                if (item && typeof item === "object" && "text" in item) {
                  const text = item.text;
                  if (typeof text === "string" && text.trim()) {
                    transformedInstructions.push({
                      "@type": "HowToStep",
                      text: text.trim(),
                    });
                  }
                }
              }
            }
          }
        }
      } else if (typeof recipeInstructions === "string") {
        const steps = (recipeInstructions as string).split("\n");
        for (const step of steps) {
          const trimmed = step.trim();
          if (trimmed) {
            transformedInstructions.push({
              "@type": "HowToStep",
              text: trimmed,
            });
          }
        }
      }
    }

    const ingredients =
      data.recipeIngredient
        ?.map((ing) => (typeof ing === "string" ? ing : String(ing)))
        .filter(Boolean) ?? [];

    if (!transformedInstructions.length || !ingredients.length) {
      log.warn("Transformed data incomplete", {
        instructionsCount: transformedInstructions.length,
        ingredientsCount: ingredients.length,
      });
      return null;
    }

    return {
      name: data.name,
      image: { url: data.image?.url ?? "" },
      recipeInstructions: transformedInstructions,
      recipeIngredient: ingredients,
    };
  } catch (error) {
    // Handle specific error from @rethora/url-recipe-scraper when step.image is not an array
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (
      errorMessage.includes("step.image") &&
      errorMessage.includes("map is not a function")
    ) {
      log.warn("Scraper failed due to malformed instruction image data", {
        error: errorMessage,
        link,
      });
    } else {
      log.warn("Scraper failed", {
        error: errorMessage,
        link,
      });
    }
    return null;
  }
}

// Fallback 1: Flask API
export async function tryFlaskApiScraper(
  link: string,
  baseUrl: string,
): Promise<FlaskApiResponse> {
  const log = logger.forComponent("FlaskApiScraper");

  try {
    const url = new URL(
      `/api/scraper?url=${encodeURIComponent(link)}`,
      baseUrl,
    ).toString();

    const response = await fetchWithTimeout(
      url,
      {
        headers: { Accept: "application/json" },
        next: { revalidate: 0 },
      },
      FLASK_API_TIMEOUT_MS,
    );

    if (!response.ok) {
      log.warn("Flask API returned error status", {
        status: response.status,
        link,
      });
      return schemas.flaskApiResponse.parse({});
    }

    const rawData: unknown = await response.json();

    // Normalize instructions format
    const rawInstructions = (rawData as { instructions?: unknown })
      ?.instructions;

    let processedInstructions: string | undefined;

    if (Array.isArray(rawInstructions)) {
      // If it's an array, join with newlines (already structured)
      processedInstructions = (rawInstructions as string[]).join("\n");
    } else if (typeof rawInstructions === "string") {
      // If it's a string, fix incorrectly split instructions
      processedInstructions = fixInstructionString(rawInstructions);
    }

    const validatedData = schemas.flaskApiResponse.parse({
      ...(rawData as Record<string, unknown>),
      instructions: processedInstructions,
    });

    const ingredients = Array.isArray(validatedData.ingredients)
      ? validatedData.ingredients
      : [];

    // Validate required fields
    if (
      validatedData.name &&
      validatedData.instructions &&
      ingredients.length > 0
    ) {
      return {
        name: validatedData.name,
        imageUrl: validatedData.imageUrl ?? undefined,
        instructions: validatedData.instructions,
        ingredients,
      };
    }

    log.warn("Flask API returned incomplete data", {
      hasName: !!validatedData.name,
      hasInstructions: !!validatedData.instructions,
      ingredientsCount: ingredients.length,
    });

    return schemas.flaskApiResponse.parse({});
  } catch (error) {
    log.warn("Flask API request failed", {
      error: error instanceof Error ? error.message : String(error),
      link,
    });
    return schemas.flaskApiResponse.parse({});
  }
}

// Scraped recipe data from any source
export interface ScrapedRecipeData {
  name: string;
  instructions: string;
  ingredients: string[];
  imageUrl?: string;
}

// Orchestrates recipe scraping with Flask as primary scraper and two fallbacks
export async function scrapeRecipe(
  link: string,
  flaskBaseUrl: string,
): Promise<ScrapedRecipeData> {
  const log = logger.forComponent("RecipeScraper");

  // Try Flask API first (primary scraper)
  log.debug("Attempting Flask API scraper", { link });
  const flaskResult = await tryFlaskApiScraper(link, flaskBaseUrl);
  if (
    flaskResult.name &&
    flaskResult.instructions &&
    flaskResult.ingredients?.length
  ) {
    log.info("Flask API scraper succeeded", { link });
    let imageUrl = flaskResult.imageUrl ?? undefined;
    if (!imageUrl) {
      const imageUrls = await fetchRecipeImages(link);
      imageUrl = imageUrls[0] ?? undefined;
    }
    return {
      name: flaskResult.name,
      instructions: flaskResult.instructions,
      ingredients: flaskResult.ingredients,
      imageUrl,
    };
  }

  // Try JS package scraper fallback
  log.debug("Attempting JS package scraper", { link });
  const mainResult = await tryJsPackageScraper(link);
  if (
    mainResult?.name &&
    mainResult.recipeInstructions &&
    mainResult.recipeIngredient.length
  ) {
    log.info("JS package scraper succeeded", { link });
    let imageUrl = mainResult.image?.url;
    if (!imageUrl) {
      const imageUrls = await fetchRecipeImages(link);
      imageUrl = imageUrls[0] ?? undefined;
    }
    return {
      name: mainResult.name,
      instructions: processInstructions(mainResult.recipeInstructions),
      ingredients: mainResult.recipeIngredient,
      imageUrl,
    };
  }

  // Try HTML scraper fallback
  log.debug("Attempting HTML scraper", { link });
  const htmlResult = await tryHtmlScraper(link);
  if (
    htmlResult?.name &&
    htmlResult.recipeInstructions &&
    htmlResult.recipeInstructions.length > 0 &&
    htmlResult.recipeIngredient &&
    htmlResult.recipeIngredient.length > 0
  ) {
    log.info("HTML scraper succeeded", { link });
    // HTML scraper already extracts images from the page it fetches
    const imageUrl = htmlResult.image?.url;
    return {
      name: htmlResult.name,
      instructions: processInstructions(htmlResult.recipeInstructions),
      ingredients: htmlResult.recipeIngredient,
      imageUrl,
    };
  }

  // All scrapers failed - throw error with details
  const missing = [];
  if (!mainResult?.name && !flaskResult.name && !htmlResult?.name) {
    missing.push("name");
  }
  if (
    !mainResult?.recipeInstructions &&
    !flaskResult.instructions &&
    !htmlResult?.recipeInstructions
  ) {
    missing.push("instructions");
  }
  if (
    (mainResult?.recipeIngredient?.length ?? 0) === 0 &&
    (flaskResult.ingredients?.length ?? 0) === 0 &&
    (htmlResult?.recipeIngredient?.length ?? 0) === 0
  ) {
    missing.push("ingredients");
  }

  throw new Error(
    `Failed to extract recipe data from all scrapers. Missing: ${missing.join(", ")}`,
  );
}
