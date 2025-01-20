import { useState, type ChangeEvent } from "react";
import Image from "next/image";
import { ImageIcon, X } from "lucide-react";
import { toast } from "sonner";

interface ImageUploadProps {
  imageUrl: string;
  onImageChange: (url: string) => void;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  imageUrl,
  onImageChange,
}) => {
  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const previewUrl = URL.createObjectURL(file);
      onImageChange(previewUrl);

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const result = (await response.json()) as
        | { url: string }
        | { error: string };

      if (!response.ok || "error" in result) {
        throw new Error("error" in result ? result.error : "Upload failed");
      }

      onImageChange(result.url);
      toast.success("Image uploaded successfully!");
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to upload image",
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
