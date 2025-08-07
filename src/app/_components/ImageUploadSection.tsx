"use client";

import { ImageIcon, X } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { RecipeError, ERROR_MESSAGES } from "~/lib/errors";
import { useErrorHandler } from "~/hooks/useErrorHandler";
import { compressImage } from "~/utils/imageCompression";

interface ImageUploadSectionProps {
  imageUrl: string;
  onImageUrlChange: (url: string) => void;
}

export default function ImageUploadSection({
  imageUrl,
  onImageUrlChange,
}: ImageUploadSectionProps) {
  const { handleError } = useErrorHandler();
  const [uploadLoading, setUploadLoading] = useState(false);
  const previousBlobUrl = useRef<string | null>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadLoading(true);

      // Compress image before upload (only on client side)
      let fileToUpload = file;
      if (typeof window !== "undefined") {
        try {
          fileToUpload = await compressImage(file);
        } catch (compressionError) {
          console.warn(
            "Image compression failed, using original file:",
            compressionError
          );
          // Keep original file if compression fails
        }
      }

      // Only create object URL on the client side
      if (typeof window !== "undefined") {
        const previewUrl = URL.createObjectURL(fileToUpload);
        previousBlobUrl.current = previewUrl;
        onImageUrlChange(previewUrl);
      }

      const formData = new FormData();
      formData.append("file", fileToUpload);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const result = (await response.json()) as
        | { data: { url: string }; success: boolean; timestamp: number }
        | { error: string };

      if (!response.ok || "error" in result) {
        throw new RecipeError(
          "error" in result ? result.error : ERROR_MESSAGES.IMAGE_UPLOAD_FAILED,
          500
        );
      }

      onImageUrlChange(result.data.url);
      toast("Image uploaded successfully!");
    } catch (error) {
      handleError(error, {
        fallbackMessage: ERROR_MESSAGES.IMAGE_UPLOAD_FAILED,
      });
      onImageUrlChange("");
    } finally {
      setUploadLoading(false);
    }
  };

  return (
    <div className="p-4 h-full overflow-y-auto">
      <h2 className="text-lg font-semibold text-foreground mb-4">
        Recipe Image
      </h2>
      <div className="flex items-center justify-center h-[250px]">
        {imageUrl ? (
          <div className="relative aspect-square w-full max-w-md overflow-hidden rounded-lg border-2 border-border">
            <Image
              src={imageUrl}
              alt="Recipe preview"
              fill
              className="rounded-lg object-cover"
            />
            <button
              type="button"
              onClick={() => onImageUrlChange("")}
              className="absolute right-2 top-2 rounded-full bg-black/50 p-1.5 text-white backdrop-blur-sm transition-all hover:bg-black/70"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        ) : (
          <label className="flex w-full max-w-md cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/20 p-8 transition-all hover:border-primary hover:bg-muted/30">
            <div className="flex flex-col items-center justify-center gap-4">
              <ImageIcon className="h-16 w-16 text-muted-foreground" />
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Click or drag image to upload
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  PNG, JPG up to 10MB
                </p>
              </div>
            </div>
            <input
              type="file"
              className="hidden"
              onChange={handleImageUpload}
              accept="image/*"
              disabled={uploadLoading}
            />
          </label>
        )}
      </div>
      {uploadLoading && (
        <div className="mt-4 text-center text-sm text-muted-foreground">
          Uploading image...
        </div>
      )}
    </div>
  );
}
