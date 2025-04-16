import type { Category } from "./types/category";

export interface Recipe {
	id: number;
	name: string;
	link: string;
	imageUrl: string;
	blurDataUrl: string;
	instructions: string;
	ingredients: string;
	favorite: boolean;
	createdAt: string;
	userId: string;
	categories: string;
	tags: string;
}

export interface RecipesData {
	pages: {
		recipes: Recipe[];
		nextCursor?: number;
	}[];
}

export interface PaginationMetadata {
	total: number;
	offset: number;
	limit: number;
	hasNextPage: boolean;
	hasPreviousPage: boolean;
	totalPages: number;
	currentPage: number;
}

export interface PaginatedResponse {
	recipes: Recipe[];
	pagination: PaginationMetadata;
}

export interface RecipeDetails {
	name: string;
	imageUrl: string;
	instructions: string;
	ingredients: string[];
}

export interface RecipeData {
	name: string;
	image: { url: string };
	recipeInstructions: { text?: string }[];
	recipeIngredient: string[];
}

interface Image {
	url: string;
	height: number;
	width: number;
}

export type RecipeInstruction = {
	text: string;
	image?: Image[];
} | {
	text?: string;
} | {
	"@type": "HowToSection";
	text?: string;
};

export interface RecipeResponse {
	name?: string;
	image?: {
		url: string;
	};
	recipeInstructions?: { text?: string }[];
	recipeIngredient?: string[];
}

export interface UpdatedRecipe {
	favorite: boolean;
	name: string;
	instructions: string;
	ingredients: string;
	imageUrl: string;
}

export interface CreateRecipeRequest {
	link: string;
}

export type APIResponse<T> = {
	data?: T;
	error?: string;
};