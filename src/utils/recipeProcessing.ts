import { RecipeError } from "~/lib/errors";
import { logger } from "~/lib/logger";
import { schemas } from "~/lib/schemas";
import type { ProcessedData, ScrapedRecipeData } from "~/types";
import { dynamicBlurDataUrl, FALLBACK_BLUR_DATA_URL } from "./dynamicBlurDataUrl";
import sanitizeString from "./sanitizeString";
import { uploadImage } from "./uploadImage";

// Local fallback served from /public when scraping returns no image.
// Matches the dimensions of the file actually on disk.
const PLACEHOLDER_IMAGE_URL = "/recipe-placeholder.png";
const PLACEHOLDER_IMAGE_WIDTH = 800;
const PLACEHOLDER_IMAGE_HEIGHT = 600;

export async function processRecipeData(
  data: ScrapedRecipeData,
  link: string
): Promise<ProcessedData> {
  const log = logger.forComponent("RecipeProcessing");
  const { imageUrl, instructions: rawInstructions, ingredients, name: rawName } = data;

  const name = sanitizeString(rawName);
  const instructions = sanitizeString(rawInstructions);
  const sanitizedIngredients = ingredients.map(sanitizeString).filter(Boolean);

  const missingFields: string[] = [];
  if (!name) missingFields.push("name");
  if (!instructions) missingFields.push("instructions");
  if (!sanitizedIngredients.length) missingFields.push("ingredients");

  if (missingFields.length > 0) {
    log.warn("Missing required fields", { missingFields, link });
    throw new RecipeError(
      `Failed to extract complete recipe data. Missing: ${missingFields.join(", ")}`,
      422
    );
  }

  if (!imageUrl) {
    return schemas.processedData.parse({
      name,
      imageUrl: PLACEHOLDER_IMAGE_URL,
      imageWidth: PLACEHOLDER_IMAGE_WIDTH,
      imageHeight: PLACEHOLDER_IMAGE_HEIGHT,
      blurDataURL: FALLBACK_BLUR_DATA_URL,
      instructions,
      ingredients: sanitizedIngredients,
    });
  }

  try {
    const [uploadResult, blurDataURL] = await Promise.all([
      uploadImage(imageUrl),
      dynamicBlurDataUrl(imageUrl),
    ]);

    return schemas.processedData.parse({
      name,
      imageUrl: uploadResult.url,
      imageWidth: uploadResult.width,
      imageHeight: uploadResult.height,
      blurDataURL,
      instructions,
      ingredients: sanitizedIngredients,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log.error("Failed to process image", error as Error, {
      imageUrl,
      link,
    });
    throw new RecipeError(`Failed to process image: ${errorMessage}`, 500);
  }
}
