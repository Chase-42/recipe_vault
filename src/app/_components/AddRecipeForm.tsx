"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Button } from "~/components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import LoadingSpinner from "./LoadingSpinner";
import type { Recipe, APIResponse } from "~/types";
import Image from "next/image";
import { ImageIcon, X } from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "../../components/ui/select";
import { Category, MAIN_MEAL_CATEGORIES } from "../../types/category";

type CreateRecipeInput = Omit<
  Recipe,
  "id" | "userId" | "blurDataUrl" | "createdAt"
>;

const createRecipe = async (recipe: CreateRecipeInput): Promise<Recipe> => {
  const response = await fetch("/api/recipes/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(recipe),
  });

  const result = (await response.json()) as APIResponse<Recipe>;

  if (!response.ok || result.error) {
    throw new Error(result.error ?? "Failed to create recipe");
  }

  if (!result.data) {
    throw new Error("No data received from server");
  }

  return result.data;
};

const CreateRecipeClient = () => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [link, setLink] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [instructions, setInstructions] = useState("");
  const [categories, setCategories] = useState<Category | undefined>(undefined);
  const [tags, setTags] = useState<string>("");

  const mutation = useMutation({
    mutationFn: createRecipe,
    onMutate: () => {
      setLoading(true);
    },
    onError: (_error) => {
      toast.error("Failed to create recipe");
    },
    onSuccess: () => {
      setLoading(false);
      setTimeout(() => {
        toast("Recipe created successfully!");
      }, 200);

      setTimeout(() => {
        router.push("/");
      }, 1500);
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
      toast("Image uploaded successfully!");
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error("Error uploading image");
      setImageUrl("");
    } finally {
      setUploadLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl) {
      toast("Please upload an image first");
      return;
    }
    const newRecipe: CreateRecipeInput = {
      name,
      link,
      imageUrl,
      ingredients,
      instructions,
      favorite: false,
      categories,
      tags,
    };
    mutation.mutate(newRecipe);
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

  return (
    <div className="flex h-full w-full flex-col md:flex-row">
      <div className="flex flex-col border-b p-4 md:w-1/2 md:border-b-0 md:border-r">
        <form onSubmit={handleSubmit} className="space-y-5">
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
              htmlFor="link"
              className="text-md m-1 block font-medium text-white"
            >
              Recipe Link
            </label>
            <Input
              id="link"
              type="url"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              required
              className="mt-1 block w-full"
            />
          </div>
          <div>
            <label
              htmlFor="ingredients"
              className="text-md m-1 block font-medium"
            >
              Ingredients
            </label>
            <div className="mb-2 text-sm text-muted-foreground">
              Enter each ingredient on a new line, starting with the amount:
              <pre className="mt-1 rounded bg-muted p-2 text-xs">
                {`2 tablespoons olive oil
1 lemon, juiced
4 cloves garlic, minced`}
              </pre>
            </div>
            <Textarea
              id="ingredients"
              value={ingredients}
              onChange={(e) => setIngredients(e.target.value)}
              required
              placeholder={`2 tablespoons olive oil
1 lemon, juiced
4 cloves garlic, minced`}
              className="mt-1 block w-full font-mono text-sm"
              rows={10}
            />
          </div>
          <div>
            <label
              htmlFor="instructions"
              className="text-md m-1 block font-medium"
            >
              Instructions
            </label>
            <div className="mb-2 text-sm text-muted-foreground">
              Enter each step on a new line:
            </div>
            <Textarea
              id="instructions"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              required
              placeholder={`Preheat the oven to 400°F
In a large bowl, combine ingredients
Bake for 25-30 minutes`}
              className="mt-1 block min-h-[200px] w-full"
              rows={10}
            />
          </div>
          <div>
            <label className="text-md m-1 block font-medium">Category</label>
            <Select
              value={categories}
              onValueChange={(v) => setCategories(v as Category)}
            >
              <SelectTrigger>
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                {MAIN_MEAL_CATEGORIES.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-md m-1 block font-medium">Tag(s)</label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g. spicy, quick, gluten-free"
              className="mt-1 block w-full"
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="secondary" type="button" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} onClick={handleSubmit}>
              Create
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

export default CreateRecipeClient;
