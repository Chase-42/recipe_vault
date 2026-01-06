import getRecipeData from "@rethora/url-recipe-scraper";
import { logger } from "~/lib/logger";
import { schemas } from "~/lib/schemas";
import { validateUrl } from "~/lib/validation";
import type { FallbackApiResponse, FlaskApiResponse } from "~/types";
import { processInstructions } from "./instruction-processor";
import { fetchRecipeImages, tryHtmlScraper } from "./scraper";

const FLASK_API_TIMEOUT_MS = 10_000; // 10 seconds
const SCRAPER_TIMEOUT_MS = 15_000; // 15 seconds

/**
 * Creates a timeout promise that rejects after the specified duration
 */
function createTimeout<T>(ms: number, message: string): Promise<T> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(message)), ms);
  });
}

/**
 * Fetches data with a timeout
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number
): Promise<Response> {
  return Promise.race([
    fetch(url, options),
    createTimeout<Response>(timeoutMs, `Request timeout after ${timeoutMs}ms`),
  ]);
}

/**
 * Main Scraper: JS Package (@rethora/url-recipe-scraper)
 * This is the primary scraper we rely on
 */
export async function tryJsPackageScraper(
  link: string
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
        "Scraper timeout"
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
    const transformedInstructions: Array<{ "@type": "HowToStep"; text: string }> = [];
    
    if (data.recipeInstructions) {
      if (Array.isArray(data.recipeInstructions)) {
        for (const instruction of data.recipeInstructions) {
          if (typeof instruction === "string") {
            const trimmed = instruction.trim();
            if (trimmed) {
              transformedInstructions.push({
                "@type": "HowToStep",
                text: trimmed,
              });
            }
          } else if (
            typeof instruction === "object" &&
            instruction !== null &&
            "text" in instruction
          ) {
            const text = String((instruction as { text?: unknown }).text ?? "").trim();
            if (text) {
              transformedInstructions.push({
                "@type": "HowToStep",
                text,
              });
            }
          }
        }
      } else if (typeof data.recipeInstructions === "string") {
        const steps = data.recipeInstructions.split("\n");
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
    log.warn("Scraper failed", {
      error: error instanceof Error ? error.message : String(error),
      link,
    });
    return null;
  }
}

/**
 * Fallback 1: Flask API
 */
export async function tryFlaskApiScraper(
  link: string,
  baseUrl: string
): Promise<FlaskApiResponse> {
  const log = logger.forComponent("FlaskApiScraper");

  try {
    const url = new URL(
      `/api/scraper?url=${encodeURIComponent(link)}`,
      baseUrl
    ).toString();

    const response = await fetchWithTimeout(
      url,
      {
        headers: { Accept: "application/json" },
        next: { revalidate: 0 },
      },
      FLASK_API_TIMEOUT_MS
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
    const processedInstructions = Array.isArray(rawInstructions)
      ? (rawInstructions as string[]).join("\n")
      : typeof rawInstructions === "string"
        ? rawInstructions
        : undefined;

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

/**
 * Scraped recipe data from any source
 */
export interface ScrapedRecipeData {
  name: string;
  instructions: string;
  ingredients: string[];
  imageUrl?: string;
}

/**
 * Orchestrates recipe scraping with main scraper and two fallbacks
 * Returns the first successful result
 */
export async function scrapeRecipe(
  link: string,
  flaskBaseUrl: string
): Promise<ScrapedRecipeData> {
  const log = logger.forComponent("RecipeScraper");

  // Try main scraper first
  log.debug("Attempting JS package scraper", { link });
  const mainResult = await tryJsPackageScraper(link);
  if (mainResult?.name && mainResult.recipeInstructions && mainResult.recipeIngredient.length) {
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

  // Try Flask API fallback
  log.debug("Attempting Flask API scraper", { link });
  const flaskResult = await tryFlaskApiScraper(link, flaskBaseUrl);
  if (flaskResult.name && flaskResult.instructions && flaskResult.ingredients?.length) {
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
    let imageUrl = htmlResult.image?.url;
    if (!imageUrl) {
      const imageUrls = await fetchRecipeImages(link);
      imageUrl = imageUrls[0] ?? undefined;
    }
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
    `Failed to extract recipe data from all scrapers. Missing: ${missing.join(", ")}`
  );
}

