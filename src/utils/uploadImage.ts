import { UploadClient, type UploadcareFile } from "@uploadcare/upload-client";

const publicKey = process.env.NEXT_PUBLIC_UPLOADCARE_PUBLIC_KEY;

if (!publicKey) {
  throw new Error("Uploadcare public key is not defined");
}

const client = new UploadClient({ publicKey });

interface UploadResponse extends UploadcareFile {
  cdnUrl: string;
}

export const uploadImage = async (imageUrl: string): Promise<string> => {
  try {
    // Download the image
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error("Failed to download image");
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(new Uint8Array(arrayBuffer));

    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
    let finalBuffer = buffer;

    // Check if the image is larger than 10 MB
    if (buffer.length > MAX_FILE_SIZE) {
      // Compress the image using sharp
      const sharp = await import("sharp");
      finalBuffer = await sharp
        .default(buffer)
        .jpeg({ quality: 95 }) // Set JPEG quality to 95%
        .toBuffer();
    }

    // Upload the image (compressed or original) to Uploadcare
    const file: UploadResponse = (await client.uploadFile(finalBuffer, {
      fileName: "recipe-image.jpg", // Adjust the file name as needed
    })) as UploadResponse;

    if (!file.cdnUrl) {
      throw new Error("Failed to upload image: No CDN URL returned");
    }

    // Apply transformations to ensure optimal quality and size
    const transformedUrl = `${file.cdnUrl}-/quality/best/-/format/auto/`;

    return transformedUrl;
  } catch (error) {
    console.error("Failed to upload image to Uploadcare", error);
    throw new Error("Failed to upload image");
  }
};
