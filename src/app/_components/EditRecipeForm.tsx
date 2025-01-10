"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
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
  const [loading, setLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);

  const { data: recipe, error } = useQuery<Recipe>({
    queryKey: ["recipe", initialRecipe.id],
    queryFn: () => fetchRecipe(initialRecipe.id),
    initialData: initialRecipe,
  });

  const [name, setName] = useState(recipe.name);
  const [ingredients, setIngredients] = useState(recipe.ingredients);
  const [instructions, setInstructions] = useState(recipe.instructions);
  const [imageUrl, setImageUrl] = useState(recipe.imageUrl);

  const mutation = useMutation({
    mutationFn: updateRecipe,
    onMutate: async (newRecipe) => {
      setLoading(true);
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
    onError: (err, newRecipe, context) => {
      queryClient.setQueryData(
        ["recipe", initialRecipe.id],
        context?.previousRecipe,
      );
      toast.error("Failed to update recipe.");
      setLoading(false);
    },
    onSuccess: async () => {
      setLoading(false);
      setTimeout(() => {
        toast.success("Recipe updated successfully!", {
          duration: 1500,
          id: "success",
        });
      }, 200);

      setTimeout(() => {
        router.back();
      }, 1500);
      setTimeout(() => {
        router.push(`/img/${initialRecipe.id}`);
      }, 1510);
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ["recipes"] });
    },
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadLoading(true);
      const previewUrl = URL.createObjectURL(file);
      setImageUrl(previewUrl);

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

      setImageUrl(result.url);
      toast.success("Image uploaded successfully!");
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to upload image",
      );
      setImageUrl(recipe.imageUrl); // Revert to original image on error
    } finally {
      setUploadLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl) {
      toast.error("Please upload an image first");
      return;
    }
    mutation.mutate({
      ...initialRecipe,
      name,
      ingredients,
      instructions,
      imageUrl,
    });
  };

  const handleCancel = () => {
    router.push("/");
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-xl text-red-800">Error loading recipe</div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col md:flex-row">
      <div className="flex flex-col border-b p-4 md:w-1/2 md:border-b-0 md:border-r">
        <form onSubmit={handleSubmit} className="space-y-5">
          <Toaster position="top-center" />
          <div>
            <label
              htmlFor="name"
              className="text-md m-1 block font-medium text-white"
            >
              Recipe Name
            </label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1 block w-full"
            />
          </div>
          <div>
            <label
              htmlFor="ingredients"
              className="text-md m-1 block font-medium text-white"
            >
              Ingredients
            </label>
            <Textarea
              id="ingredients"
              value={ingredients}
              onChange={(e) => setIngredients(e.target.value)}
              required
              className="mt-1 block w-full"
            />
          </div>
          <div>
            <label
              htmlFor="instructions"
              className="text-md m-1 block font-medium text-white"
            >
              Instructions
            </label>
            <Textarea
              id="instructions"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              required
              className="mt-1 block min-h-[200px] w-full"
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="secondary" type="button" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              Save
            </Button>
          </div>
        </form>
      </div>

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
                onClick={() => setImageUrl("")}
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
    </div>
  );
};

export default EditRecipeClient;
