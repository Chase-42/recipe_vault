"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import type { Category, CreateRecipeInput } from "~/types";
import LoadingSpinner from "./LoadingSpinner";
import ImageUpload from "./ImageUpload";
import { useRecipeMutation } from "~/hooks/useRecipeMutation";
import { CategorySelect } from "./CategorySelect";

const CreateRecipeClient = () => {
  const router = useRouter();
  const [uploadLoading, setUploadLoading] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [link, setLink] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [instructions, setInstructions] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [tags, setTags] = useState<string>("");

  const mutation = useRecipeMutation("create", {
    onSuccessNavigate: () => {
      setTimeout(() => {
        router.push("/");
      }, 1500);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl) {
      toast("Please upload an image first");
      return;
    }
    const tagArray = tags
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);
    const newRecipe: CreateRecipeInput = {
      name,
      link,
      imageUrl,
      ingredients,
      instructions,
      favorite: false,
      categories,
      tags: tagArray,
    };
    mutation.mutate(newRecipe);
  };

  const handleCancel = () => {
    router.push("/");
  };

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
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label
              htmlFor="name"
              className="text-md mb-1 block font-medium text-white"
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
              className="text-md mb-1 block font-medium text-white"
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
              className="text-md mb-1 block font-medium"
            >
              Ingredients
            </label>
            <div className="mb-1 text-sm text-muted-foreground">
              Enter each ingredient on a new line:
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
              rows={4}
            />
          </div>
          <div>
            <label
              htmlFor="instructions"
              className="text-md mb-1 block font-medium"
            >
              Instructions
            </label>
            <div className="mb-1 text-sm text-muted-foreground">
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
              className="mt-1 block w-full"
              rows={4}
            />
          </div>
          <CategorySelect
            value={categories[0] ?? ""}
            onValueChange={(v) => setCategories(v ? [v as Category] : [])}
            labelClassName="text-md mb-1 block font-medium"
          />
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
          <div className="flex justify-end space-x-2 pt-2 border-t mt-2">
            <Button variant="secondary" type="button" onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending}
            >
              Create
            </Button>
          </div>
        </form>
      </div>

      <ImageUpload
        imageUrl={imageUrl}
        onImageChange={setImageUrl}
        uploadLoading={uploadLoading}
        onUploadLoadingChange={setUploadLoading}
      />
    </div>
  );
};

export default CreateRecipeClient;
