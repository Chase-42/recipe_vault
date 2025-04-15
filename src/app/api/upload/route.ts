import { type NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { uploadImage } from "~/utils/uploadImage";
import { withRateLimit } from "~/lib/rateLimit";

// Maximum file size (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;
// Allowed MIME types
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif'
]);

// Create a shared rate limiter instance for the upload endpoint
const uploadRateLimiter = { maxRequests: 20, windowMs: 60 * 1000, path: "/api/upload" };

export async function POST(req: NextRequest): Promise<NextResponse> {
  return withRateLimit(req, async (req: NextRequest): Promise<NextResponse> => {
    try {
      const { userId } = getAuth(req);
      if (!userId) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }

      const formData = await req.formData();
      const file = formData.get("file") as File;
      
      if (!file) {
        return NextResponse.json(
          { error: "No file provided" },
          { status: 400 }
        );
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: "File size exceeds 5MB limit" },
          { status: 400 }
        );
      }

      // Validate file type
      if (!ALLOWED_MIME_TYPES.has(file.type)) {
        return NextResponse.json(
          { error: "Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed" },
          { status: 400 }
        );
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      const base64 = buffer.toString('base64');
      const dataUrl = `data:${file.type};base64,${base64}`;
      
      const cdnUrl = await uploadImage(dataUrl);

      return NextResponse.json({ url: cdnUrl });
    } catch (error) {
      console.error("Upload error:", error);
      return NextResponse.json(
        { error: "Failed to upload image" },
        { status: 500 }
      );
    }
  }, uploadRateLimiter);
}