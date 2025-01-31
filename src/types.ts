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

interface Author {
	"@id": string | undefined;
	name: string;
	url: string | undefined;
}

interface Image {
	url: string;
	height: number;
	width: number;
}

interface Video {
	contentUrl: string;
	description: string;
	duration: string;
	name: string;
	thumbnailUrl: string;
	uploadDate: string;
}

interface Nutrition {
	calories: string;
	carbohydrateContent: string;
	cholesterolContent: string | undefined;
	fiberContent: string;
	proteinContent: string;
	saturatedFatContent: string;
	sodiumContent: string;
	sugarContent: string;
	fatContent: string;
	unsaturatedFatContent: string;
}

interface RecipeInstruction {
	text: string;
	image?: Image[];
}

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