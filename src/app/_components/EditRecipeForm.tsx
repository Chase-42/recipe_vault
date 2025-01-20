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
import dynamic from "next/dynamic";

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

const EditRecipeClient: React.FC<EditRecipeClientProps> = ({
  initialRecipe,
}) => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Query setup
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
    onError: (_, __, context) => {
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
      setTimeout(() => router.back(), 1500);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["recipes"] });
      void queryClient.invalidateQueries({
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

      {/* Dynamically loaded Image Upload Section */}
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
