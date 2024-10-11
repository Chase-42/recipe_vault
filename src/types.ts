export interface Recipe {
	link: string;
	id: number;
	name: string;
	userId: string;
	imageUrl: string;
	blurDataUrl: string;
	instructions: string;
	ingredients: string;
	favorite: boolean;
	createdAt: Date;
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
	authors: Author[];
	description: string;
	image: Image;
	video: Video;
	name: string;
	nutrition: Nutrition;
	recipeCategory: string[];
	recipeCuisine: string[];
	recipeIngredient: string[];
	recipeInstructions: RecipeInstruction[];
	recipeYield: string[];
	cookTime: string;
	prepTime: string;
	totalTime: string;
}

export interface UpdatedRecipe {
	favorite: boolean;
	name: string;
	instructions: string;
	ingredients: string;
	
}