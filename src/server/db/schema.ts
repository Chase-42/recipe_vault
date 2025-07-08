import {
  boolean,
  index,
  pgTableCreator,
  serial,
  text,
  timestamp,
  varchar,
  pgEnum,
} from "drizzle-orm/pg-core";

export const createTable = pgTableCreator((name) => `recipe_vault_${name}`);

export const recipes = createTable(
  "recipes",
  {
    id: serial("id").primaryKey(),
    link: text("link").notNull(),
    name: text("name").notNull(),
    userId: varchar("userId", { length: 256 }).notNull(),
    imageUrl: text("imageUrl").notNull(),
    blurDataUrl: text("blurDataUrl").notNull(),
    instructions: text("instructions").notNull(),
    ingredients: text("ingredients").notNull(),
    favorite: boolean("favorite").default(false).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    categories: text("categories").array().notNull().default([]),
    tags: text("tags").array().notNull().default([]),
  },
  (table) => ({
    userIdIdx: index("user_id_idx").on(table.userId),
    createdAtIdx: index("created_at_idx").on(table.createdAt),
    favoriteIdx: index("favorite_idx").on(table.favorite),

    // Composite indexes for common query patterns
    userCreatedAtIdx: index("user_created_at_idx").on(
      table.userId,
      table.createdAt
    ),
    userFavoriteIdx: index("user_favorite_idx").on(
      table.userId,
      table.favorite
    ),

    searchIdx: index("search_idx").on(
      table.name,
      table.instructions,
      table.ingredients,
      table.categories,
      table.tags
    ),
    categoriesIdx: index("categories_idx").on(table.categories),
    tagsIdx: index("tags_idx").on(table.tags),
  })
);

// Simple shopping list items table - one list per user
export const shoppingItems = createTable(
  "shopping_items",
  {
    id: serial("id").primaryKey(),
    userId: varchar("userId", { length: 256 }).notNull(),
    name: text("name").notNull(),
    checked: boolean("checked").default(false).notNull(),
    recipeId: serial("recipe_id").references(() => recipes.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("shopping_items_user_id_idx").on(table.userId),
    recipeIdIdx: index("shopping_items_recipe_id_idx").on(table.recipeId),
    createdAtIdx: index("shopping_items_created_at_idx").on(table.createdAt),
    userCheckedIdx: index("shopping_items_user_checked_idx").on(
      table.userId,
      table.checked
    ),
    userCreatedAtIdx: index("shopping_items_user_created_at_idx").on(
      table.userId,
      table.createdAt
    ),
  })
);
