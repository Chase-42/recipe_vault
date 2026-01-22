import { UploadClient, type UploadcareFile } from "@uploadcare/upload-client";
import { RecipeError, ValidationError } from "~/lib/errors";
import { logger } from "~/lib/logger";

const publicKey = process.env.NEXT_PUBLIC_UPLOADCARE_PUBLIC_KEY;

if (!publicKey) {
  throw new ValidationError("Uploadcare public key is not defined");
}

const client = new UploadClient({ publicKey });

const MAX_DIMENSION = 800;
const JPEG_QUALITY = 85;

interface UploadResponse extends UploadcareFile {
  cdnUrl: string;
}

export interface UploadResult {
  url: string;
  width: number;
  height: number;
}

export const uploadImage = async (imageUrl: string): Promise<UploadResult> => {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) throw new RecipeError("Failed to download image", 500);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer) as Buffer;

    const sharp = await import("sharp");

    // Get original dimensions
    const metadata = await sharp.default(buffer).metadata();
    const originalWidth = metadata.width ?? 800;
    const originalHeight = metadata.height ?? 600;

    // Calculate new dimensions, constraining to MAX_DIMENSION
    let width = originalWidth;
    let height = originalHeight;

    if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
      if (width > height) {
        height = Math.round((height / width) * MAX_DIMENSION);
        width = MAX_DIMENSION;
      } else {
        width = Math.round((width / height) * MAX_DIMENSION);
        height = MAX_DIMENSION;
      }
    }

    // Resize and convert to JPEG (new sharp instance from buffer)
    const finalBuffer = await sharp
      .default(buffer)
      .resize(width, height, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: JPEG_QUALITY })
      .toBuffer();

    const file: UploadResponse = (await client.uploadFile(finalBuffer, {
      fileName: "recipe-image.jpg",
    })) as UploadResponse;

    if (!file.cdnUrl) {
      throw new RecipeError("Failed to upload image: No CDN URL returned", 500);
    }

    const transformedUrl = `${file.cdnUrl}-/quality/best/-/format/auto/`;

    return { url: transformedUrl, width, height };
  } catch (error) {
    logger.error(
      "Failed to upload image to Uploadcare",
      error instanceof Error ? error : new Error(String(error)),
      { imageUrl },
    );
    throw new RecipeError("Failed to upload image", 500);
  }
};
