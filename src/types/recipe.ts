import type { Category } from "./category";

export interface CreateRecipeInput {
  link: string;
  name?: string;
  imageUrl?: string;
  blurDataUrl?: string;
  instructions?: string;
  ingredients?: string;
  favorite?: boolean;
  categories?: Category;
  tags?: string[];
}
