import { RecipeError } from "~/lib/errors";
import { logger } from "~/lib/logger";
import { schemas } from "~/lib/schemas";
import type { FlaskApiResponse, ProcessedData } from "~/types";
import { dynamicBlurDataUrl } from "./dynamicBlurDataUrl";
import sanitizeString from "./sanitizeString";
import { uploadImage } from "./uploadImage";

const PLACEHOLDER_IMAGE_URL =
  "https://via.placeholder.com/800x600/cccccc/666666?text=No+Image+Available";

export async function processRecipeData(
  data: FlaskApiResponse,
  link: string
): Promise<ProcessedData> {
  const log = logger.forComponent("RecipeProcessing");
  const {
    imageUrl,
    instructions: rawInstructions,
    ingredients = [],
    name: rawName,
  } = data;

  const name = sanitizeString(rawName);
  const instructions = sanitizeString(rawInstructions ?? "");
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

  const finalImageUrl = imageUrl ?? PLACEHOLDER_IMAGE_URL;

  try {
    const [uploadResult, blurDataURL] = await Promise.all([
      uploadImage(finalImageUrl),
      dynamicBlurDataUrl(finalImageUrl),
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
      imageUrl: finalImageUrl,
      link,
    });
    throw new RecipeError(`Failed to process image: ${errorMessage}`, 500);
  }
}
