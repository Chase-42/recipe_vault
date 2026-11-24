ALTER TABLE "recipe_vault_shopping_items" ADD COLUMN IF NOT EXISTS "ingredient_name" text;
ALTER TABLE "recipe_vault_shopping_items" ADD COLUMN IF NOT EXISTS "quantity" real;
ALTER TABLE "recipe_vault_shopping_items" ADD COLUMN IF NOT EXISTS "unit" text;
ALTER TABLE "recipe_vault_shopping_items" ADD COLUMN IF NOT EXISTS "recipe_name" text;
