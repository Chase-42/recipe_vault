"use client";

import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { useSearch } from "../providers";
import type { Recipe } from "~/types";

interface RecipesClientProps {
	initialRecipes: Recipe[];
}

const fetchRecipes = async (): Promise<Recipe[]> => {
	try {
		const response: Response = await fetch("/api/recipes");
		console.log("response", response);
		if (!response.ok) {
			throw new Error("Network response was not ok");
		}
		const data: Recipe[] = (await response.json()) as Recipe[];
		return data;
	} catch (error) {
		console.error("Failed to fetch recipes:", error);
		throw error;
	}
};

const RecipesClient: React.FC<RecipesClientProps> = ({ initialRecipes }) => {
	const { searchTerm } = useSearch();
	const {
		data: recipes = initialRecipes,
		error,
		isLoading,
	} = useQuery<Recipe[]>({
		queryKey: ["recipes"],
		queryFn: fetchRecipes,
		initialData: initialRecipes,
	});

	const filteredRecipes = recipes.filter((recipe) =>
		recipe.name.toLowerCase().includes(searchTerm.toLowerCase()),
	);

	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-full">
				<div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-red-800 mt-10" />
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex items-center justify-center h-full">
				<div className="text-red-800 text-xl">Error loading recipes</div>
			</div>
		);
	}

	return (
		<div className="flex flex-wrap justify-center gap-4 p-4">
			{filteredRecipes.map((recipe) => (
				<div
					key={recipe.id}
					className="recipe-card flex flex-col items-center text-white rounded-md p-4 shadow-md max-w-xs transition group border-2 border-transparent hover:border-white hover:animate-swirl-border"
				>
					<h2 className="text-md font-semibold mb-2 text-center break-words">
						{recipe.name}
					</h2>
					<Link href={`/img/${recipe.id}`} className="group relative">
						<Image
							src={recipe.imageUrl}
							className="rounded-md"
							style={{ objectFit: "cover" }}
							width={192}
							height={192}
							alt={recipe.name}
						/>
					</Link>
				</div>
			))}
		</div>
	);
};

export default RecipesClient;
