import { useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { toast, Toaster } from "sonner";
import { Input } from "../../components/ui/input";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";

interface AddRecipeProps {
  onSuccess: () => void;
}

const AddRecipe: React.FC<AddRecipeProps> = ({ onSuccess }) => {
  const [link, setLink] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!link) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/recipes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ link }),
      });

      if (!response.ok) {
        throw new Error("Failed to save recipe");
      }

      await queryClient.invalidateQueries({ queryKey: ["recipes"] });

      toast.success("Recipe saved successfully!", {
        duration: 2500,
        id: "success",
      });
      onSuccess();
    } catch (error) {
      onSuccess();
      console.error("An error occurred:", error);
      toast.error("Failed to save recipe.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-full w-full items-center justify-center">
      <Card className="w-full max-w-lg text-center">
        <CardHeader>
          <CardTitle>Add a New Recipe</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col items-center">
            <Input
              type="url"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="Enter recipe link"
              className="mb-4"
              required
              aria-label="Recipe link"
            />
            <motion.button
              type="submit"
              disabled={!link || isLoading}
              className={`relative flex h-12 w-full items-center justify-center overflow-hidden rounded-md bg-white text-black ${
                !link || isLoading ? "cursor-not-allowed opacity-50" : ""
              }`}
            >
              <span
                className={
                  "relative z-10 text-black transition-colors duration-300"
                }
              >
                {isLoading ? "Saving..." : "Save Recipe"}
              </span>
              {isLoading && (
                <motion.div
                  className="absolute inset-0 bg-primary"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 2, ease: "linear" }}
                />
              )}
            </motion.button>
          </form>
        </CardContent>
        <CardFooter>
          <Toaster position="bottom-center" />
        </CardFooter>
      </Card>
    </div>
  );
};

export default AddRecipe;
