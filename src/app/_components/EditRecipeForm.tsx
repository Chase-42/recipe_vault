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

interface EditRecipeClientProps {
  initialRecipe: Recipe;
}

const fetchRecipe = async (id: number): Promise<Recipe> => {
  const response = await fetch(`/api/recipes/${id}`);
  if (!response.ok) {
    throw new Error("Failed to fetch recipe");
  }
  const data = (await response.json()) as Recipe;
  return data;
};

const updateRecipe = async (recipe: Recipe): Promise<void> => {
  const response = await fetch(`/api/recipes/${recipe.id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(recipe),
  });

  if (!response.ok) {
    throw new Error("Failed to update recipe");
  }
};

const EditRecipeClient: React.FC<EditRecipeClientProps> = ({
  initialRecipe,
}) => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    data: recipe,
    error,
    isLoading = loading,
  } = useQuery<Recipe>({
    queryKey: ["recipe", initialRecipe.id],
    queryFn: () => fetchRecipe(initialRecipe.id),
    initialData: initialRecipe,
  });

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

  const [name, setName] = useState(recipe.name);
  const [ingredients, setIngredients] = useState(recipe.ingredients);
  const [instructions, setInstructions] = useState(recipe.instructions);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      ...initialRecipe,
      name,
      ingredients,
      instructions,
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
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setIngredients(e.target.value)
          }
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
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setInstructions(e.target.value)
          }
          required
          className="mt-1 block w-full"
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
  );
};

export default EditRecipeClient;
