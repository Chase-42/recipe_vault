"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Button } from "~/components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface EditRecipeFormProps {
  recipe: {
    id: number;
    name: string;
    ingredients: string;
    instructions: string;
  };
}

const EditRecipeForm: React.FC<EditRecipeFormProps> = ({ recipe }) => {
  const [name, setName] = useState(recipe.name);
  const [ingredients, setIngredients] = useState(recipe.ingredients);
  const [instructions, setInstructions] = useState(recipe.instructions);
  const router = useRouter();
  const queryClient = useQueryClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data = { name, ingredients, instructions };

    try {
      const response = await fetch(`/api/recipes/${recipe.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to update recipe");
      }

      await queryClient.invalidateQueries({ queryKey: ["recipes"] });
      toast.success("Recipe saved successfully!", {
        duration: 2500,
        id: "success",
      });
      router.push(`/img/${recipe.id}`);
    } catch (error) {
      console.error("An error occurred:", error);
      toast.error("Failed to save recipe.");
    }
  };

  const handleCancel = () => {
    router.push("/");
  };

  return (
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
        <Button type="submit">Save</Button>
      </div>
    </form>
  );
};

export default EditRecipeForm;
