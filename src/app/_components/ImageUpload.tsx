"use client";

import { ImageIcon, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { RecipeError } from "~/lib/errors";
import { compressImage } from "~/utils/imageCompression";

interface ImageUploadProps {
  imageUrl: string;
  onImageChange: (url: string) => void;
  uploadLoading?: boolean;
  onUploadLoadingChange?: (loading: boolean) => void;
}

export default function ImageUpload({
  imageUrl,
  onImageChange,
  uploadLoading = false,
  onUploadLoadingChange,
}: ImageUploadProps) {
  const previousBlobUrl = useRef<string | null>(null);

  // Clean up blob URLs when they're replaced
  useEffect(() => {
    if (previousBlobUrl.current && !imageUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previousBlobUrl.current);
      previousBlobUrl.current = null;
    }
  }, [imageUrl]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (previousBlobUrl.current) {
        URL.revokeObjectURL(previousBlobUrl.current);
      }
    };
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      onUploadLoadingChange?.(true);

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
        onImageChange(previewUrl);
      }

      const formData = new FormData();
      formData.append("file", fileToUpload);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const result = (await response.json()) as
        | { url: string }
        | { error: string };

      if (!response.ok || "error" in result) {
        throw new RecipeError(
          "error" in result ? result.error : "Upload failed",
          500
        );
      }

      onImageChange(result.url);
      toast("Image uploaded successfully!");
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error("Error uploading image");
      onImageChange("");
    } finally {
      onUploadLoadingChange?.(false);
    }
  };

  return (
    <div className="flex h-full w-full items-center justify-center p-4 md:w-1/2">
      <div className="w-full">
        {imageUrl ? (
          <div className="relative aspect-square w-full overflow-hidden rounded-lg border-2 border-gray-600">
            <Image
              src={imageUrl}
              alt="Recipe preview"
              fill
              className="rounded-lg object-cover"
            />
            <button
              type="button"
              onClick={() => onImageChange("")}
              className="absolute right-2 top-2 rounded-full bg-black/50 p-1.5 text-white backdrop-blur-sm transition-all hover:bg-black/70"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        ) : (
          <label className="flex w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-600 bg-black/20 p-8 transition-all hover:border-gray-500 hover:bg-black/30">
            <div className="flex flex-col items-center justify-center gap-4">
              <ImageIcon className="h-16 w-16 text-gray-400" />
              <div className="text-center">
                <p className="text-sm text-gray-400">
                  Click or drag image to upload
                </p>
                <p className="mt-2 text-xs text-gray-500">
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
        {uploadLoading && (
          <div className="mt-4 text-center text-sm text-gray-400">
            Uploading image...
          </div>
        )}
      </div>
    </div>
  );
}
