"use client";

import { useQuery } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { type ChangeEvent, type FormEvent, useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import type { Recipe, Category } from "~/types";
import { fetchRecipe } from "~/utils/recipeService";
import { useRecipeMutation } from "~/hooks/useRecipeMutation";
import { recipeKey } from "~/utils/query-keys";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { MAIN_MEAL_CATEGORIES } from "~/types";
import LoadingSpinner from "./LoadingSpinner";

const ImageUpload = dynamic(() => import("./ImageUpload"), {
  loading: () => (
    <div className="flex h-full w-full items-center justify-center p-4 md:w-1/2">
      <LoadingSpinner />
    </div>
  ),
});

interface EditRecipeClientProps {
  initialRecipe: Recipe;
}

interface FormData {
  name: string;
  link: string;
  ingredients: string;
  instructions: string;
  imageUrl: string;
  categories: string[];
  tags: string[];
}

const EditRecipeClient: React.FC<EditRecipeClientProps> = ({
  initialRecipe,
}) => {
  const { data: recipe } = useQuery({
    queryKey: recipeKey(initialRecipe.id),
    queryFn: async () => {
      const data = await fetchRecipe(initialRecipe.id);
      return data;
    },
    initialData: initialRecipe,
  });

  const [formData, setFormData] = useState<FormData>({
    name: recipe?.name ?? "",
    link: recipe?.link ?? "",
    ingredients: recipe?.ingredients ?? "",
    instructions: recipe?.instructions ?? "",
    imageUrl: recipe?.imageUrl ?? "",
    categories: recipe?.categories ?? [],
    tags: recipe?.tags ?? [],
  });

  const mutation = useRecipeMutation("update");

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleCategoryChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      categories: value ? [value as Category] : [],
    }));
  };

  const handleTagChange = (e: ChangeEvent<HTMLInputElement>) => {
    const tagString = e.target.value;
    const tagsArray = tagString
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);
    setFormData((prev) => ({ ...prev, tags: tagsArray }));
  };

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

  if (recipe === undefined) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-xl text-red-800">Error loading recipe</div>
      </div>
    );
  }

  if (mutation.isPending) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col md:flex-row">
      <div className="flex flex-col border-b p-4 md:w-1/2 md:border-b-0 md:border-r">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4">
            <div>
              <label htmlFor="name" className="text-sm font-medium">
                Recipe Name
              </label>
              <Input
                id="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., Classic Chocolate Chip Cookies"
              />
            </div>

            <div>
              <label htmlFor="link" className="text-sm font-medium">
                Recipe Link
              </label>
              <Input
                id="link"
                value={formData.link}
                onChange={handleInputChange}
                placeholder="e.g., https://cooking.nytimes.com/recipes/..."
              />
            </div>

            <div>
              <label htmlFor="ingredients" className="text-sm font-medium">
                Ingredients
              </label>
              <div className="mb-2 text-xs text-gray-500">
                Enter each ingredient on a new line
              </div>
              <Textarea
                id="ingredients"
                value={formData.ingredients}
                onChange={handleInputChange}
                placeholder="Enter ingredients, one per line"
                rows={6}
              />
            </div>

            <div>
              <label htmlFor="instructions" className="text-sm font-medium">
                Instructions
              </label>
              <div className="mb-2 text-xs text-gray-500">
                Enter each step on a new line
              </div>
              <Textarea
                id="instructions"
                value={formData.instructions}
                onChange={handleInputChange}
                placeholder="Enter instructions, one step per line"
                rows={6}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Category</label>
              <Select
                value={formData.categories[0] ?? ""}
                onValueChange={handleCategoryChange}
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
              <label className="text-sm font-medium">Tag(s)</label>
              <Input
                id="tags"
                value={formData.tags.join(", ")}
                onChange={handleTagChange}
                placeholder="e.g. spicy, quick, gluten-free"
                className="mt-1 block w-full"
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                variant="secondary"
                type="button"
                onClick={() => window.history.back()}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                Save
              </Button>
            </div>
          </div>
        </form>
      </div>

      <ImageUpload
        imageUrl={formData.imageUrl}
        onImageChange={(url) =>
          setFormData((prev) => ({ ...prev, imageUrl: url }))
        }
      />
    </div>
  );
};

export default EditRecipeClient;
