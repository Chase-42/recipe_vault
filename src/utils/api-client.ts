import type { ApiResponse, PaginatedApiResponse } from "~/lib/api-response";
import { RecipeError } from "~/lib/errors";

/**
 * Client-side helper to parse API responses
 * Throws an error if the response is not successful
 * Only handles non-paginated responses - use parsePaginatedApiResponse for paginated endpoints
 */
export async function parseApiResponse<T>(
  response: Response
): Promise<T> {
  const data = (await response.json()) as ApiResponse<T>;

  if (!data.success) {
    throw new RecipeError(
      data.error ?? "An error occurred",
      response.status
    );
  }

  return data.data;
}

/**
 * Client-side helper to parse paginated API responses
 */
export async function parsePaginatedApiResponse<T>(
  response: Response
): Promise<{ data: T[]; pagination: PaginatedApiResponse<T>["pagination"] }> {
  const data = (await response.json()) as PaginatedApiResponse<T>;

  if (!data.success) {
    throw new RecipeError(
      "Failed to fetch paginated data",
      response.status
    );
  }

  return {
    data: data.data,
    pagination: data.pagination,
  };
}
