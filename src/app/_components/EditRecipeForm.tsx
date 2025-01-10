"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Button } from "~/components/ui/button";
import { useRouter } from "next/navigation";
import { toast, Toaster } from "sonner";
import LoadingSpinner from "./LoadingSpinner";
import type { Recipe } from "~/types";
import { fetchRecipe, updateRecipe } from "~/utils/recipeService";
import Image from "next/image";
import { ImageIcon, X } from "lucide-react";

interface EditRecipeClientProps {
  initialRecipe: Recipe;
}

const EditRecipeClient: React.FC<EditRecipeClientProps> = ({
  initialRecipe,
}) => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { data: recipe, error } = useQuery<Recipe>({
    queryKey: ["recipe", initialRecipe.id],
    queryFn: () => fetchRecipe(initialRecipe.id),
    initialData: initialRecipe,
  });

  // Form state
  const [formData, setFormData] = useState({
    name: recipe.name,
    ingredients: recipe.ingredients,
    instructions: recipe.instructions,
    imageUrl: recipe.imageUrl,
  });

  // Form handlers
  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const previewUrl = URL.createObjectURL(file);
      setFormData((prev) => ({ ...prev, imageUrl: previewUrl }));

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

      setFormData((prev) => ({ ...prev, imageUrl: result.url }));
      toast.success("Image uploaded successfully!");
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to upload image",
      );
      setFormData((prev) => ({ ...prev, imageUrl: recipe.imageUrl }));
    } finally {
      setIsUploading(false);
    }
  };

  // Mutation setup
  const mutation = useMutation({
    mutationFn: updateRecipe,
    onMutate: async (newRecipe) => {
      setIsSubmitting(true);
      await queryClient.cancelQueries({
        queryKey: ["recipe", initialRecipe.id],
      });
      const previousRecipe = queryClient.getQueryData<Recipe>([
        "recipe",
        initialRecipe.id,
      ]);
      queryClient.setQueryData(["recipe", initialRecipe.id], newRecipe);
      return { previousRecipe };
    },
    onError: (err, _, context) => {
      if (context?.previousRecipe) {
        queryClient.setQueryData(
          ["recipe", initialRecipe.id],
          context.previousRecipe,
        );
      }
      toast.error("Failed to update recipe");
      setIsSubmitting(false);
    },
    onSuccess: () => {
      setIsSubmitting(false);
      toast.success("Recipe updated successfully!", {
        duration: 1500,
        id: "success",
      });
      setTimeout(() => router.back(), 1400);
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ["recipes"] });
      await queryClient.invalidateQueries({
        queryKey: ["recipe", initialRecipe.id],
      });
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!formData.imageUrl) {
      toast.error("Please upload an image first");
      return;
    }

    mutation.mutate({
      ...initialRecipe,
      ...formData,
    });
  };

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-xl text-red-800">Error loading recipe</div>
      </div>
    );
  }

  if (isSubmitting) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col md:flex-row">
      <div className="flex flex-col border-b p-4 md:w-1/2 md:border-b-0 md:border-r">
        <form onSubmit={handleSubmit} className="space-y-5">
          <Toaster position="top-center" />
          {/* Recipe Name Input */}
          <div>
            <label htmlFor="name" className="text-md m-1 block font-medium">
              Recipe Name
            </label>
            <Input
              id="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full"
            />
          </div>
          {/* Ingredients Input */}
          <div>
            <label
              htmlFor="ingredients"
              className="text-md m-1 block font-medium"
            >
              Ingredients
            </label>
            <Textarea
              id="ingredients"
              value={formData.ingredients}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full"
            />
          </div>
          {/* Instructions Input */}
          <div>
            <label
              htmlFor="instructions"
              className="text-md m-1 block font-medium"
            >
              Instructions
            </label>
            <Textarea
              id="instructions"
              value={formData.instructions}
              onChange={handleInputChange}
              required
              className="mt-1 block min-h-[200px] w-full"
            />
          </div>
          {/* Form Actions */}
          <div className="flex justify-end space-x-2">
            <Button
              variant="secondary"
              type="button"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              Save
            </Button>
          </div>
        </form>
      </div>

      {/* Image Upload Section */}
      <div className="flex h-full w-full items-center justify-center p-4 md:w-1/2">
        <div className="w-full">
          {formData.imageUrl ? (
            <div className="relative aspect-square w-full overflow-hidden rounded-lg border-2 border-gray-600">
              <Image
                src={formData.imageUrl}
                alt="Recipe preview"
                fill
                className="rounded-lg object-cover"
              />
              <button
                type="button"
                onClick={() =>
                  setFormData((prev) => ({ ...prev, imageUrl: "" }))
                }
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
    </div>
  );
};

export default EditRecipeClient;
