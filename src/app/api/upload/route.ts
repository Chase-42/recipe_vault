import type { NextRequest } from "next/server";
import { ValidationError } from "~/lib/errors";
import { withApiHandler } from "~/lib/api-handler";
import { uploadImage } from "~/utils/uploadImage";
import { apiSuccess } from "~/lib/api-response";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const uploadRateLimiter = {
  maxRequests: 20,
  windowMs: 60 * 1000,
  path: "/api/upload",
};

export const POST = withApiHandler(uploadRateLimiter, async (req, _userId) => {
  const formData = await req.formData();
  const file = formData.get("file") as File;

  if (!file) {
    throw new ValidationError("No file provided");
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new ValidationError("File size exceeds 5MB limit");
  }
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    throw new ValidationError(
      "Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed"
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const cdnUrl = await uploadImage(`data:${file.type};base64,${buffer.toString("base64")}`);
  return apiSuccess({ url: cdnUrl }, 201);
});
