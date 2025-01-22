export class RecipeError extends Error {
	constructor(
		message: string,
		public code:
			| "SCRAPING_FAILED"
			| "NETWORK_ERROR"
			| "UNAUTHORIZED"
			| "NOT_FOUND",
	) {
		super(message);
		this.name = "RecipeError";
	}
}
