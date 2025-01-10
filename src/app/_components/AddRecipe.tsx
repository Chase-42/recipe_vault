"use client";

import { useQueryClient, useMutation } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Input } from "../../components/ui/input";
import { motion } from "framer-motion";
import Link from "next/link";
import { Link2, PenLine } from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Toaster } from "~/components/ui/sonner";

interface AddRecipeProps {
  onSuccess: () => void;
}

const saveRecipe = async (link: string) => {
  const response = await fetch("/api/recipes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ link }),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json();
};

export default function AddRecipe({ onSuccess }: AddRecipeProps) {
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [link, setLink] = useState("");
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: (link: string) => saveRecipe(link),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["recipes"] });
      toast.success("Recipe saved successfully!", {
        duration: 2500,
        id: "success",
      });
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
              <motion.button
                onClick={() => setShowLinkForm(true)}
                className="group relative flex flex-col items-center justify-center rounded-lg border border-input p-6 text-center transition-colors hover:border-primary/50"
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <motion.div className="absolute inset-0 rounded-lg bg-primary/10 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                <Link2 className="mb-2 h-8 w-8 transition-transform duration-200 group-hover:scale-110 group-hover:text-primary" />
                <h3 className="font-medium text-foreground transition-colors duration-200 group-hover:text-primary">
                  Paste a Link
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Import from a recipe website
                </p>
              </motion.button>

              <Link
                href={`/add`}
                prefetch={true}
                onClick={onSuccess}
                className="group relative flex flex-col items-center justify-center rounded-lg border border-input p-6 text-center transition-colors hover:border-primary/50"
              >
                <motion.div
                  className="absolute inset-0 rounded-lg bg-primary/10 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300 }}
                />
                <PenLine className="mb-2 h-8 w-8 transition-transform duration-200 group-hover:scale-110 group-hover:text-primary" />
                <h3 className="font-medium text-foreground transition-colors duration-200 group-hover:text-primary">
                  Enter Manually
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Create your own recipe
                </p>
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
                    className={`relative flex h-12 w-full items-center justify-center overflow-hidden rounded-md bg-primary text-primary-foreground hover:bg-primary/90 ${
                      !link || isPending ? "cursor-not-allowed opacity-50" : ""
                    }`}
                  >
                    <span className="relative z-10 transition-colors duration-300">
                      {isPending ? "Importing..." : "Import Recipe"}
                    </span>
                    {isPending && (
                      <motion.div
                        className="bg-primary-dark absolute inset-0"
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
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
        <CardFooter>
          <Toaster position="bottom-center" />
        </CardFooter>
      </Card>
    </div>
  );
}
