import { useState } from "react";

const AddRecipe = () => {
	const [link, setLink] = useState("");
	const [name, setName] = useState("");

	const handleSubmit = async (e: { preventDefault: () => void }) => {
		e.preventDefault();
		if (link && name) {
			await fetch("/api/recipes", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ link, name }),
			});
			setLink("");
			setName("");
		}
	};

	return (
		<form
			onSubmit={handleSubmit}
			className="flex flex-col items-center p-4 bg-gray-800 rounded-md shadow-md"
		>
			<input
				type="text"
				value={name}
				onChange={(e) => setName(e.target.value)}
				placeholder="Enter recipe name"
				required
				className="w-full p-2 mb-4 border border-gray-600 rounded-md bg-gray-700 text-white"
			/>
			<input
				type="url"
				value={link}
				onChange={(e) => setLink(e.target.value)}
				placeholder="Enter recipe link"
				required
				className="w-full p-2 mb-4 border border-gray-600 rounded-md bg-gray-700 text-white"
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
