import { getServerUserIdFromRequest } from "~/lib/auth-helpers";
import { type NextRequest, NextResponse } from "next/server";
import {
  AuthorizationError,
  handleApiError,
  ValidationError,
} from "~/lib/errors";
import { withRateLimit } from "~/lib/rateLimit";
import { uploadImage } from "~/utils/uploadImage";

// Maximum file size (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;
// Allowed MIME types
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

// Create a shared rate limiter instance for the upload endpoint
const uploadRateLimiter = {
  maxRequests: 20,
  windowMs: 60 * 1000,
  path: "/api/upload",
};

export async function POST(req: NextRequest): Promise<NextResponse> {
  return withRateLimit(
    req,
    async (req: NextRequest): Promise<NextResponse> => {
      try {
        const userId = await getServerUserIdFromRequest(req);

        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
          throw new ValidationError("No file provided");
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
          throw new ValidationError("File size exceeds 5MB limit");
        }

        // Validate file type
        if (!ALLOWED_MIME_TYPES.has(file.type)) {
          throw new ValidationError(
            "Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed"
          );
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const base64 = buffer.toString("base64");
        const dataUrl = `data:${file.type};base64,${base64}`;

        const cdnUrl = await uploadImage(dataUrl);

        return NextResponse.json({ url: cdnUrl });
      } catch (error) {
        const { error: errorMessage, statusCode } = handleApiError(error);
        return NextResponse.json(
          { error: errorMessage },
          { status: statusCode }
        );
      }
    },
    uploadRateLimiter
  );
}
