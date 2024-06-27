import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast, Toaster } from "sonner";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

const AddRecipe = ({ onSuccess }: { onSuccess: () => void }) => {
	const [link, setLink] = useState("");
	const [name, setName] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const queryClient = useQueryClient();

	const handleSubmit = async (e: { preventDefault: () => void }) => {
		e.preventDefault();
		if (link && name) {
			setIsLoading(true);
			try {
				const response = await fetch("/api/recipes", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ link, name }),
				});
				if (!response.ok) {
					throw new Error("Failed to save recipe");
				}
				setLink("");
				setName("");
				toast.success("Recipe saved successfully!");
				setTimeout(() => {
					onSuccess();
				}, 1000);
				await queryClient.invalidateQueries({ queryKey: ["recipes"] });
			} catch (error) {
				console.error("An error occurred:", error);
				toast.error("Failed to save recipe.");
			} finally {
				setIsLoading(false);
			}
		}
	};

	return (
		<>
			<Toaster
				position="top-center"
				toastOptions={{ style: { zIndex: 9999 } }}
			/>
			<div className="flex items-center justify-center h-full w-full">
				<form
					onSubmit={handleSubmit}
					className="flex flex-col items-center p-5 bg-gray-800 rounded-md shadow-md max-w-lg w-full"
				>
					<Input
						type="text"
						value={name}
						onChange={(e) => setName(e.target.value)}
						placeholder="Enter recipe name"
						className="mb-3"
						required
					/>
					<Input
						type="url"
						value={link}
						onChange={(e) => setLink(e.target.value)}
						placeholder="Enter recipe link"
						className="mb-4"
						required
					/>
					<Button type="submit" disabled={isLoading}>
						{isLoading ? "Saving..." : "Save Recipe"}
					</Button>
				</form>
			</div>
		</>
	);
};

export default AddRecipe;
