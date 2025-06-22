import type { Recipe } from "~/lib/schemas";

export interface FavoriteResponse {
  favorite: boolean;
}

export interface APIResponse<T> {
  data?: T;
  error?: string;
}
