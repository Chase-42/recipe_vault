// src/app/_components/AddRecipe.tsx
import { useState } from "react";

const AddRecipe = () => {
	const [link, setLink] = useState("");

	const handleSubmit = async (e: { preventDefault: () => void }) => {
		e.preventDefault();
		if (link) {
			await fetch("/api/recipes", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ link }),
			});
			setLink("");
		}
	};

	return (
		<form
			onSubmit={handleSubmit}
			className="flex flex-col items-center p-4 bg-gray-100 rounded-md shadow-md"
		>
			<input
				type="url"
				value={link}
				onChange={(e) => setLink(e.target.value)}
				placeholder="Enter recipe link"
				required
				className="w-full p-2 mb-4 border border-gray-300 rounded-md"
			/>
			<button
				type="submit"
				className="px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-700"
			>
				Save Recipe
			</button>
		</form>
	);
};

export default AddRecipe;
