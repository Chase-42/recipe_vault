import { ImageIcon, X } from "lucide-react";
import Image from "next/image";
import { type ChangeEvent, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { RecipeError } from "~/lib/errors";

interface ImageUploadProps {
  imageUrl: string;
  onImageChange: (url: string) => void;
}

// Simple image compression function
const compressImage = (
  file: File,
  maxWidth = 1200,
  quality = 0.8
): Promise<File> => {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      resolve(file);
      return;
    }

    const img = new window.Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      const { width, height } = img;
      const ratio = Math.min(maxWidth / width, maxWidth / height);

      canvas.width = width * ratio;
      canvas.height = height * ratio;

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: "image/jpeg",
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          } else {
            resolve(file);
          }
        },
        "image/jpeg",
        quality
      );

      // Clean up the object URL after compression
      URL.revokeObjectURL(objectUrl);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };

    img.src = objectUrl;
  });
};

const ImageUpload: React.FC<ImageUploadProps> = ({
  imageUrl,
  onImageChange,
}) => {
  const [isUploading, setIsUploading] = useState(false);
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

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const previewUrl = URL.createObjectURL(file);
      previousBlobUrl.current = previewUrl;
      onImageChange(previewUrl);

      // Compress image before upload
      const compressedFile = await compressImage(file);

      const formData = new FormData();
      formData.append("file", compressedFile);

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
      toast.error(
        error instanceof Error ? error.message : "Failed to upload image"
      );
      onImageChange(imageUrl);
    } finally {
      setIsUploading(false);
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
              aria-label="Remove image"
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
              disabled={isUploading}
            />
          </label>
        )}
        {isUploading && (
          <div className="mt-4 text-center text-sm text-gray-400">
            Uploading image...
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageUpload;
