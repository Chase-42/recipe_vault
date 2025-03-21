import {
	boolean,
	pgTableCreator,
	serial,
	text,
	timestamp,
	varchar,
	index,
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
	},
	(table) => ({
		userIdIdx: index("user_id_idx").on(table.userId),
		createdAtIdx: index("created_at_idx").on(table.createdAt),
		favoriteIdx: index("favorite_idx").on(table.favorite),
	}),
);

// Simple shopping list items table - one list per user
export const shoppingItems = createTable(
	"shopping_items",
	{
		id: serial("id").primaryKey(),
		userId: varchar("userId", { length: 256 }).notNull(),
		name: text("name").notNull(),
		checked: boolean("checked").default(false).notNull(),
		recipeId: serial("recipe_id").references(() => recipes.id, { onDelete: "set null" }),
		createdAt: timestamp("createdAt").defaultNow().notNull(),
	},
	(table) => ({
		userIdIdx: index("shopping_items_user_id_idx").on(table.userId),
		recipeIdIdx: index("shopping_items_recipe_id_idx").on(table.recipeId),
		createdAtIdx: index("shopping_items_created_at_idx").on(table.createdAt),
		userCheckedIdx: index("shopping_items_user_checked_idx").on(table.userId, table.checked),
		userCreatedAtIdx: index("shopping_items_user_created_at_idx").on(table.userId, table.createdAt),
	}),
);
