import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Link2, PenLine } from "lucide-react";
import Link from "next/link";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { RecipeError } from "~/lib/errors";
import type { Recipe } from "~/types";
import { Input } from "../../components/ui/input";

interface AddRecipeProps {
  onSuccess: () => void;
}

interface ButtonContainerProps {
  children: React.ReactNode;
  onClick: () => void;
  cursor?: string;
}

interface SaveRecipeResponse {
  data: Recipe;
  error?: string;
}

const saveRecipe = async (link: string): Promise<Recipe> => {
  const response = await fetch("/api/recipes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ link }),
  });

  const result = (await response.json()) as SaveRecipeResponse;

  if (!response.ok || result.error) {
    throw new RecipeError(result.error ?? "Failed to save recipe", 500);
  }

  return result.data;
};

const ButtonContainer = ({
  children,
  onClick,
  cursor = "pointer",
}: ButtonContainerProps) => (
  <motion.div
    className={`group relative flex flex-col items-center justify-center rounded-lg border border-input p-6 text-center transition-colors hover:border-primary/50 cursor-${cursor}`}
    whileHover={{ scale: 1.02 }}
    transition={{ type: "spring", stiffness: 300 }}
    onClick={onClick}
  >
    <motion.div className="absolute inset-0 rounded-lg bg-primary/10 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
    {children}
  </motion.div>
);

export default function AddRecipe({ onSuccess }: AddRecipeProps) {
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [link, setLink] = useState("");
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation<Recipe, Error, string>({
    mutationFn: saveRecipe,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["recipes"] });
      toast("Recipe saved successfully!");
      onSuccess();
    },
    onError: (error: Error) => {
      console.error("Failed to save recipe:", error);
      toast.error(error.message || "Failed to save recipe.");
      onSuccess();
    },
  });

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!link) return;
    mutate(link);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 p-4 sm:p-8">
      <Card className="w-full max-w-md p-4 sm:max-w-lg sm:p-6">
        <CardHeader>
          <CardTitle className="text-center text-xl font-semibold">
            How would you like to add your recipe?
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!showLinkForm ? (
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <ButtonContainer
                onClick={() => setShowLinkForm(true)}
                cursor="pointer"
              >
                <Link2 className="mb-2 h-8 w-8 transition-transform duration-200 group-hover:scale-110 group-hover:text-primary" />
                <h3 className="font-medium text-foreground transition-colors duration-200 group-hover:text-primary">
                  Paste a Link
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Import from a recipe website
                </p>
              </ButtonContainer>

              <Link
                href="/add"
                prefetch={true}
                onClick={onSuccess}
                className="block"
              >
                <ButtonContainer onClick={() => undefined} cursor="pointer">
                  <PenLine className="mb-2 h-8 w-8 transition-transform duration-200 group-hover:scale-110 group-hover:text-primary" />
                  <h3 className="font-medium text-foreground transition-colors duration-200 group-hover:text-primary">
                    Enter Manually
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Create your own recipe
                  </p>
                </ButtonContainer>
              </Link>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <form
                onSubmit={handleSubmit}
                className="flex flex-col items-center"
              >
                <Input
                  type="url"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="Paste recipe URL here"
                  className="mb-4 w-full px-4 py-2 text-sm sm:px-6 sm:py-3 sm:text-base"
                  required
                  aria-label="Recipe link"
                />
                <div className="flex w-full flex-col gap-3">
                  <motion.button
                    type="submit"
                    disabled={!link || isPending}
                    className={`relative flex h-12 w-full items-center justify-center overflow-hidden rounded-md border-2 border-primary bg-background text-primary hover:bg-background/90 ${
                      !link || isPending ? "cursor-not-allowed" : ""
                    }`}
                  >
                    <span
                      className={`relative z-10 ${isPending ? "text-primary-foreground" : ""}`}
                    >
                      {isPending ? "Importing..." : "Import Recipe"}
                    </span>
                    {isPending && (
                      <motion.div
                        className="absolute inset-0 bg-primary"
                        initial={{ x: "-100%" }}
                        animate={{ x: "0%" }}
                        transition={{ duration: 2, ease: "linear" }}
                      />
                    )}
                  </motion.button>
                  <motion.button
                    type="button"
                    onClick={() => setShowLinkForm(false)}
                    className="h-12 w-full rounded-md border-2 border-gray-200 text-gray-700 hover:bg-gray-50"
                  >
                    Back to Options
                  </motion.button>
                </div>
              </form>
            </motion.div>
          )}
        </CardContent>
        <CardFooter />
      </Card>
    </div>
  );
}
