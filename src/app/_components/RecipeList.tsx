// src/app/_components/RecipeList.tsx
import { useEffect, useState } from "react";

const RecipeList = () => {
	const [recipes, setRecipes] = useState([]);

	useEffect(() => {
		const fetchRecipes = async () => {
			const response = await fetch("/api/recipes");
			const data = await response.json();
			setRecipes(data);
		};

		fetchRecipes();
	}, []);

	return (
		<div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
			{recipes.map((recipe) => (
				<div key={recipe.id} className="p-4 bg-white rounded-md shadow-md">
					<img
						src={recipe.imageUrl}
						alt="Recipe"
						className="w-full mb-4 rounded-md"
					/>
					<p className="text-gray-700">{recipe.instructions}</p>
				</div>
			))}
		</div>
	);
};

export default RecipeList;
