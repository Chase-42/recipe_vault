import { useState } from "react";

const AddRecipe = () => {
	const [link, setLink] = useState("");
	const [name, setName] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	const handleSubmit = async (e: { preventDefault: () => void }) => {
		e.preventDefault();
		if (link && name) {
			setIsLoading(true);
			await fetch("/api/recipes", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ link, name }),
			});
			setIsLoading(false);
			setLink("");
			setName("");
		}
	};

	return (
		<div className="flex items-center justify-center h-full w-full">
			<form
				onSubmit={handleSubmit}
				className="flex flex-col items-center p-5 bg-gray-800 rounded-md shadow-md max-w-lg w-full"
			>
				<input
					type="text"
					value={name}
					onChange={(e) => setName(e.target.value)}
					placeholder="Enter recipe name"
					required
					className="w-full p-2.5 mb-4 border border-gray-600 rounded-md bg-gray-700 text-white text-base"
				/>
				<input
					type="url"
					value={link}
					onChange={(e) => setLink(e.target.value)}
					placeholder="Enter recipe link"
					required
					className="w-full p-2.5 mb-4 border border-gray-600 rounded-md bg-gray-700 text-white text-base"
				/>
				<button
					type="submit"
					className="px-4 py-2 text-white bg-red-800 rounded-md hover:bg-red-500 text-base"
					disabled={isLoading}
				>
					{isLoading ? "Saving..." : "Save Recipe"}
				</button>
			</form>
			{isLoading && (
				<div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
					<div className="loader"></div>
				</div>
			)}
		</div>
	);
};

export default AddRecipe;
